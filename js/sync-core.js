/* Wedding Planner — sync core (no DOM). Item-level newest-wins merge + Google Drive client + sync engine.
   Works in the browser (window.SXMSync) and in Node (module.exports) for unit tests. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SXMSync = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var META_KEY = 'wp-sync-meta';
  var FOLDER_NAME = 'Wedding Planner Sync';
  var FILE_NAME = 'Wedding_Planner_sync.json';
  // v1.5 multi-user: everyone works in ONE shared folder (pinned by id in config.js, owned by the organizer and shared with each
  // person by the organizer in Google Drive). The app never shares anything itself. E-mails are never hard-coded here.
  var EMAILS = { Me: '' };

  function isSynced(key) {
    return typeof key === 'string' && key.indexOf('wp-') === 0 && key.indexOf('wp-sync-') !== 0;
  }
  function canon(v) {
    if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
    if (v && typeof v === 'object') {
      return '{' + Object.keys(v).sort().map(function (k) { return JSON.stringify(k) + ':' + canon(v[k]); }).join(',') + '}';
    }
    return JSON.stringify(v === undefined ? null : v);
  }
  function isPlainObj(x) { return x !== null && typeof x === 'object' && !Array.isArray(x); }

  /* Split a raw localStorage string into sync items. shape: 'o' map, 'a' array of {id}, 'v' whole JSON, 'r' raw text */
  function itemsOf(raw) {
    if (raw === null || raw === undefined) return null;
    var parsed;
    try { parsed = JSON.parse(raw); } catch (e) { return { shape: 'r', items: { __v: String(raw) } }; }
    if (Array.isArray(parsed)) {
      var ok = true, seen = {}, items = {};
      for (var i = 0; i < parsed.length; i++) {
        var el = parsed[i];
        if (!isPlainObj(el) || (typeof el.id !== 'string' && typeof el.id !== 'number') || seen[String(el.id)]) { ok = false; break; }
        seen[String(el.id)] = 1; items[String(el.id)] = el;
      }
      if (ok) return { shape: 'a', items: items };
      return { shape: 'v', items: { __v: parsed } };
    }
    if (isPlainObj(parsed)) {
      var o = {}; Object.keys(parsed).forEach(function (k) { o[k] = parsed[k]; });
      return { shape: 'o', items: o };
    }
    return { shape: 'v', items: { __v: parsed } };
  }
  function ik(key, id) { return key + '#' + id; }
  function splitIk(k) { var i = k.indexOf('#'); return [k.slice(0, i), k.slice(i + 1)]; }

  /* Record per-item stamps for one write. Mutates meta; returns number of stamped items. */
  function stampWrite(meta, key, oldRaw, newRaw, now, by) {
    var o = itemsOf(oldRaw), n = itemsOf(newRaw);
    // Seeding rule: first-ever write of an id-array (e.g. default listings) is baseline data, not an edit.
    if (!o && n && n.shape === 'a') return 0;
    var count = 0;
    function put(id, extra) {
      var k = ik(key, id), prev = meta[k];
      var t = Math.max(now, prev ? prev.t + 1 : 0);
      var e = { t: t, by: by };
      if (extra) e.d = 1;
      meta[k] = e; count++;
    }
    var oi = o ? o.items : {}, ni = n ? n.items : {};
    Object.keys(ni).forEach(function (id) {
      var changed = !o || !(id in oi) || o.shape !== n.shape || canon(oi[id]) !== canon(ni[id]);
      if (changed) put(id, false);
    });
    Object.keys(oi).forEach(function (id) { if (!(id in ni)) put(id, true); });
    return count;
  }

  /* Snapshot of everything we know locally: live items + tombstones */
  function snapshot(readRaw, listKeys, meta) {
    var out = {};
    listKeys().forEach(function (key) {
      if (!isSynced(key)) return;
      var it = itemsOf(readRaw(key));
      if (!it) return;
      Object.keys(it.items).forEach(function (id) {
        var k = ik(key, id), m = meta[k];
        var stamp = (m && !m.d) ? m : { t: 0, by: '' };
        out[k] = { v: it.items[id], sh: it.shape, t: stamp.t, by: stamp.by };
      });
    });
    Object.keys(meta).forEach(function (k) {
      var m = meta[k];
      if (m && m.d && !out[k]) out[k] = { d: 1, t: m.t, by: m.by };
    });
    return out;
  }

  function pickWinner(a, b) {
    if (!a) return b; if (!b) return a;
    if (a.t !== b.t) return a.t > b.t ? a : b;
    if (!!a.d !== !!b.d) return a.d ? a : b;                 // tie: delete wins
    if ((a.by || '') !== (b.by || '')) return (a.by || '') > (b.by || '') ? a : b;
    return canon(a.v) >= canon(b.v) ? a : b;
  }
  function merge(a, b) {
    var out = {};
    Object.keys(a || {}).concat(Object.keys(b || {})).forEach(function (k) {
      if (k in out) return;
      out[k] = pickWinner(a && a[k], b && b[k]);
    });
    return out;
  }

  /* Write merged items back to storage. io = {readRaw, listKeys, writeRaw, removeRaw}. Returns {changedKeys, meta} */
  function applyMerged(merged, io) {
    var groups = {};
    Object.keys(merged).forEach(function (k) {
      var p = splitIk(k); (groups[p[0]] = groups[p[0]] || {})[p[1]] = merged[k];
    });
    var changedKeys = [];
    Object.keys(groups).forEach(function (key) {
      if (!isSynced(key)) return;
      var g = groups[key];
      var ids = Object.keys(g);
      var live = ids.filter(function (id) { return !g[id].d; });
      var curRaw = io.readRaw(key), cur = itemsOf(curRaw);
      var shape = null, newest = -1;
      live.forEach(function (id) { if (g[id].t >= newest) { newest = g[id].t; shape = g[id].sh; } });
      if (!shape) shape = cur ? cur.shape : 'o';
      var next; // serialized string or null (remove)
      if (shape === 'v' || shape === 'r') {
        if (live.length) { var it = g.__v && !g.__v.d ? g.__v : g[live[0]]; next = shape === 'r' ? String(it.v) : JSON.stringify(it.v); }
        else next = null;
      } else if (shape === 'a') {
        var curIds = cur && cur.shape === 'a' ? Object.keys(cur.items) : [];
        var order = curIds.filter(function (id) { return g[id] && !g[id].d; });
        var rest = live.filter(function (id) { return order.indexOf(id) < 0; }).sort(function (x, y) { return g[x].t - g[y].t; });
        // keep local-only items that merge didn't mention (should not happen) to be safe
        next = JSON.stringify(order.concat(rest).map(function (id) { return g[id].v; }));
      } else {
        var base = {};
        var curKeys = cur && cur.shape === 'o' ? Object.keys(cur.items) : [];
        curKeys.concat(live).forEach(function (id) { if (g[id] && !g[id].d && !(id in base)) base[id] = g[id].v; });
        next = JSON.stringify(base);
      }
      if (next === null) {
        if (curRaw !== null && curRaw !== undefined) { io.removeRaw(key); changedKeys.push(key); }
        return;
      }
      if (curRaw === null || curRaw === undefined) {
        if (shape !== 'v' && shape !== 'r' && !live.length) return;   // nothing to create
        io.writeRaw(key, next); changedKeys.push(key); return;
      }
      var same;
      if (shape === 'r' || (cur && cur.shape === 'r')) same = curRaw === next;
      else { try { same = canon(JSON.parse(curRaw)) === canon(JSON.parse(next)); } catch (e) { same = false; } }
      if (!same) { io.writeRaw(key, next); changedKeys.push(key); }
    });
    var meta = {};
    Object.keys(merged).forEach(function (k) {
      var m = merged[k];
      if (m.d) meta[k] = { t: m.t, by: m.by, d: 1 };
      else if (m.t > 0) meta[k] = { t: m.t, by: m.by };
    });
    return { changedKeys: changedKeys, meta: meta };
  }


  /* Local store helper: wraps raw storage primitives. Used by the browser hook and by tests. */
  function createLocal(p) { // p: {getRaw,setRaw,removeRaw,listKeys,getWho,now}
    function loadMeta() { try { return JSON.parse(p.getRaw(META_KEY) || '{}') || {}; } catch (e) { return {}; } }
    function saveMeta(m) { p.setRaw(META_KEY, JSON.stringify(m)); }
    return {
      loadMeta: loadMeta, saveMeta: saveMeta,
      rawIO: { readRaw: p.getRaw, writeRaw: p.setRaw, removeRaw: p.removeRaw, listKeys: p.listKeys },
      /* call after a user/app write of a synced key (old/new raw values; new === null for removal). Returns #stamped. */
      afterWrite: function (key, oldRaw, newRaw) {
        if (!isSynced(key)) return 0;
        var meta = loadMeta();
        var n = stampWrite(meta, key, oldRaw, newRaw, p.now(), p.getWho() || 'Unknown');
        if (n) saveMeta(meta);
        return n;
      }
    };
  }

  /* Latest edit per section: sections = {sectionId: [storageKeys]} */
  function lastUpdated(meta, sections) {
    var out = {};
    Object.keys(sections).forEach(function (sid) {
      var best = null;
      sections[sid].forEach(function (key) {
        Object.keys(meta).forEach(function (k) {
          if (k.indexOf(key + '#') !== 0) return;
          var m = meta[k];
          if (!best || m.t > best.t) best = { t: m.t, by: m.by };
        });
      });
      if (best && best.t > 0) out[sid] = best;
    });
    return out;
  }

  /* ---------------- Google Drive client (fetch-based; getToken() -> Promise<string>) ---------------- */
  function DriveError(msg, status, body) { var e = new Error(msg); e.status = status; e.body = body; e.name = 'DriveError'; return e; }

  function createDrive(opts) {
    var fetchFn = opts.fetch, getToken = opts.getToken, refreshToken = opts.refreshToken;
    var API = 'https://www.googleapis.com/drive/v3/';
    var UPLOAD = 'https://www.googleapis.com/upload/drive/v3/';

    async function call(method, url, body, retried) {
      var token = await getToken();
      var headers = { Authorization: 'Bearer ' + token };
      var init = { method: method, headers: headers };
      if (body !== undefined) { headers['Content-Type'] = 'application/json'; init.body = JSON.stringify(body); }
      var res = await fetchFn(url, init);
      if (res.status === 401 && !retried && refreshToken) { await refreshToken(); return call(method, url, body, true); }
      if (!res.ok) {
        var txt = ''; try { txt = await res.text(); } catch (e) {}
        throw DriveError('Drive ' + res.status, res.status, txt);
      }
      return res;
    }
    function q(s) { return encodeURIComponent(s); }
    function esc(s) { return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }

    return {
      /* All non-trashed folders called FOLDER_NAME visible to this user (own + shared with me), oldest first */
      listFolders: async function () {
        var url = API + 'files?q=' + q("name='" + esc(FOLDER_NAME) + "' and mimeType='application/vnd.google-apps.folder' and trashed=false") +
          '&fields=' + q('files(id,name,createdTime,ownedByMe,owners(emailAddress))') + '&orderBy=createdTime&pageSize=20&spaces=drive';
        var j = await (await call('GET', url)).json();
        return j.files || [];
      },
      getFile: async function (id) {
        var j = await (await call('GET', API + 'files/' + encodeURIComponent(id) + '?fields=' + q('id,name,mimeType,trashed,ownedByMe,capabilities(canEdit,canAddChildren)') + '&supportsAllDrives=true')).json();
        return j;
      },
      createFolder: async function () {
        var j = await (await call('POST', API + 'files?fields=id,createdTime', { name: FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' })).json();
        return j;
      },
      listPermissions: async function (id) {
        var j = await (await call('GET', API + 'files/' + id + '/permissions?fields=' + q('permissions(id,emailAddress,role,type)'))).json();
        return j.permissions || [];
      },
      shareWriter: async function (id, email) {
        return (await call('POST', API + 'files/' + id + '/permissions?sendNotificationEmail=false&fields=id', { type: 'user', role: 'writer', emailAddress: email })).json();
      },
      findFile: async function (folderId) {
        var url = API + 'files?q=' + q("'" + esc(folderId) + "' in parents and name='" + FILE_NAME + "' and trashed=false") +
          '&fields=' + q('files(id,version,createdTime)') + '&orderBy=createdTime&pageSize=10&spaces=drive';
        var j = await (await call('GET', url)).json();
        return (j.files || [])[0] || null;
      },
      createFile: async function (folderId) {
        return (await call('POST', API + 'files?fields=id,version', { name: FILE_NAME, parents: [folderId], mimeType: 'application/json' })).json();
      },
      getVersion: async function (id) {
        return (await (await call('GET', API + 'files/' + id + '?fields=version')).json()).version;
      },
      download: async function (id) {
        var res = await call('GET', API + 'files/' + id + '?alt=media');
        var txt = await res.text();
        if (!txt || !txt.trim()) return null;
        try { return JSON.parse(txt); } catch (e) { return null; }
      },
      upload: async function (id, doc) {
        return (await call('PATCH', UPLOAD + 'files/' + id + '?uploadType=media&fields=id,version', doc)).json();
      }
    };
  }

  /* ---------------- Sync engine ----------------
     deps: { drive, storage:{get,set,remove,keys}, who(), email() , now() , rawIO:{readRaw,writeRaw,removeRaw,listKeys}, loadMeta, saveMeta, suspend(fn) } */
  function createEngine(deps) {
    var drive = deps.drive;
    var IDS_KEY = 'wp-sync-ids';
    function loadIds() { try { return JSON.parse(deps.rawIO.readRaw(IDS_KEY) || '{}'); } catch (e) { return {}; } }
    function saveIds(o) { deps.rawIO.writeRaw(IDS_KEY, JSON.stringify(o)); }

    function partnerEmails() { return []; }   // v1.5: the app never shares; the organizer shares the folder in Google Drive

    function noAccess(msg) { var e = new Error(msg); e.noAccess = true; return e; }
    async function ensureFolder() {
      var ids = loadIds();
      var pinned = deps.folderId ? deps.folderId() : '';
      if (pinned) {
        // Shared folder: never create a private copy. No access yet -> clear message (the organizer has to share it).
        var f;
        try { f = await drive.getFile(pinned); }
        catch (e) { if (e.status === 404 || e.status === 403) throw noAccess('NO_ACCESS'); throw e; }
        if (!f || f.trashed) throw noAccess('NO_ACCESS');
        if (f.capabilities && f.capabilities.canEdit === false) throw noAccess('READ_ONLY');
        if (ids.folderId !== pinned) ids = { folderId: pinned, prevFolderId: ids.folderId || '' };
        saveIds(ids);
        return ids;
      }
      // No pinned folder (tests / private use): oldest folder with the app's name that this account can see; create if none.
      var folders = await drive.listFolders();
      var folder = folders[0];
      if (!folder) {
        var c = await drive.createFolder();
        folder = { id: c.id, ownedByMe: true, createdTime: c.createdTime };
        ids = {};
      }
      if (ids.folderId !== folder.id) { ids = { folderId: folder.id }; }
      saveIds(ids);
      return ids;
    }

    async function ensureFile(ids) {
      var pf = deps.fileId ? deps.fileId() : '';
      if (pf && ids.folderId === (deps.folderId ? deps.folderId() : '')) {
        try { var g = await drive.getFile(pf); if (g && !g.trashed) { ids.fileId = pf; saveIds(ids); return { id: pf }; } } catch (e) { if (e.status !== 404) throw e; }
      }
      var f = await drive.findFile(ids.folderId);
      if (!f) { f = await drive.createFile(ids.folderId); f.created = true; }
      ids.fileId = f.id; saveIds(ids);
      return f;
    }

    function localSnap(meta) {
      return snapshot(deps.rawIO.readRaw, deps.rawIO.listKeys, meta);
    }

    /* One full sync pass. Returns {changedKeys, uploaded, rounds} */
    async function sync() {
      var ids = await ensureFolder();
      var file = await ensureFile(ids);
      var changedAll = [], uploaded = false, rounds = 0;
      for (var round = 0; round < 4; round++) {
        rounds++;
        var v0 = await drive.getVersion(file.id);
        var remoteDoc = await drive.download(file.id);
        var remoteItems = (remoteDoc && remoteDoc.items) || {};
        var meta = deps.loadMeta();
        var local = localSnap(meta);
        var merged = merge(local, remoteItems);
        var res = deps.suspend(function () { return applyMerged(merged, deps.rawIO); });
        deps.saveMeta(res.meta);
        res.changedKeys.forEach(function (k) { if (changedAll.indexOf(k) < 0) changedAll.push(k); });
        if (canon(merged) === canon(remoteItems)) break;           // remote already equals the merged state
        var v1 = await drive.getVersion(file.id);
        if (v1 !== v0) continue;                                    // someone wrote while we were merging: re-read
        await drive.upload(file.id, { v: 1, updatedAt: deps.now(), updatedBy: deps.who() || '', items: merged });
        uploaded = true;                                            // next round re-reads to verify
      }
      return { changedKeys: changedAll, uploaded: uploaded, rounds: rounds };
    }
    return { sync: sync, ensureFolder: ensureFolder, partnerEmails: partnerEmails };
  }

  return {
    META_KEY: META_KEY, FOLDER_NAME: FOLDER_NAME, FILE_NAME: FILE_NAME, EMAILS: EMAILS,
    isSynced: isSynced, canon: canon, itemsOf: itemsOf, stampWrite: stampWrite, snapshot: snapshot,
    createLocal: createLocal, merge: merge, applyMerged: applyMerged, lastUpdated: lastUpdated, createDrive: createDrive, createEngine: createEngine
  };
});
