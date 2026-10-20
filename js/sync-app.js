/* Wedding Planner — Google Drive sync: sign-in (native Google authorization via the GoogleAuth Capacitor plugin), scheduler, header chip, captions. */
(function () {
  'use strict';
  var S = window.SXMSync;
  if (!S || !S.local) return;

  // Auth is done natively by the local GoogleAuth plugin (Google Identity Services AuthorizationClient; Android OAuth client
  // 749897568298-p53uvvb0sg20rsv7vvg1nctb5jfr3tvh, bound to package + signing SHA-1). Scopes are set in GoogleAuthPlugin.java:
  // https://www.googleapis.com/auth/drive.file (+ email, openid): non-sensitive, no verification needed. No web redirect, no PKCE, no refresh token, no client secret.
  var TOKEN_TTL = 30 * 60 * 1000;   // reuse a plugin-issued token for at most 30 min within a session (tokens last ~1 h)
  var cap = window.Capacitor || {};
  var native = !!(cap.isNativePlatform && cap.isNativePlatform());
  // Plugins are not auto-exposed on Capacitor.Plugins without a bundler: register the ones we use by name.
  var Plug = {};
  ['App', 'GoogleAuth', 'CapacitorHttp'].forEach(function (n) {
    try { Plug[n] = (cap.Plugins && cap.Plugins[n]) || (native && cap.registerPlugin ? cap.registerPlugin(n) : undefined); } catch (e) {}
  });
  var ls = window.localStorage;
  var web = !native;   // web app (computer, iPhone, Android browser): Google Identity Services token flow
  var UA = navigator.userAgent || '';
  var IOS = /iPhone|iPad|iPod/.test(UA) || (/Macintosh/.test(UA) && navigator.maxTouchPoints > 1);
  // iPhone/iPad (Safari and Home Screen apps): popups can't report back from a standalone web app, so use a full-page redirect.
  function useRedirect() { return web && (IOS || lget('wp-sync-redirect') === '1'); }
  function redirectUri() { return location.origin + location.pathname.replace(/index\.html$/, ''); }
  var CFG = window.WP_CONFIG || {};
  function webClientId() { return (CFG.WEB_CLIENT_ID || lget('wp-sync-webclient') || '').trim(); }
  var GIS_SCOPE = 'https://www.googleapis.com/auth/drive.file openid email';

  /* ---------- small helpers ---------- */
  function lget(k) { try { return ls.getItem(k); } catch (e) { return null; } }
  function lset(k, v) { try { ls.setItem(k, v); } catch (e) {} }
  function lrem(k) { try { ls.removeItem(k); } catch (e) {} }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function getWho() { return S.whoLabel ? S.whoLabel() : (native ? 'Phone' : 'Computer'); }
  function setWho(w) { lset('wp-sync-who', w); }
  function ago(t) {
    var d = Date.now() - t;
    if (d < 45000) return 'just now';
    if (d < 3600000) return Math.round(d / 60000) + ' min ago';
    if (d < 86400000) return Math.round(d / 3600000) + ' h ago';
    return new Date(t).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  }


  /* ---------- account marker (not a secret: just the signed-in e-mail; access tokens are never stored) ---------- */
  var ACCOUNT_KEY = 'wp-sync-account';
  function authLoad() {
    lrem('wp-sync-auth'); lrem('wp-sync-pending');   // leftovers of the v2 custom-tab/PKCE flow
    try { var a = JSON.parse(lget(ACCOUNT_KEY) || 'null'); return a && a.signedIn ? { email: a.email || '', access_token: '', exp: 0 } : null; } catch (e) { return null; }
  }
  function authSave() { lset(ACCOUNT_KEY, JSON.stringify({ signedIn: true, email: (auth && auth.email) || '' })); }
  function authClear() { lrem(ACCOUNT_KEY); }

  /* ---------- network: fetch, with native-HTTP fallback if the WebView blocks the request (CORS) ---------- */
  function offlineErr(e) { var x = new Error('offline'); x.offline = true; x.cause = e; return x; }
  async function sfetch(url, init) {
    init = init || {};
    try { return await fetch(url, init); }
    catch (e) {
      var H = Plug.CapacitorHttp;
      if (!(native && H && H.request)) throw offlineErr(e);
      try {
        var headers = init.headers || {}, data;
        if (init.body !== undefined) {
          var ct = headers['Content-Type'] || '';
          data = /json/.test(ct) ? JSON.parse(init.body) : init.body;
        }
        var r = await H.request({ url: url, method: init.method || 'GET', headers: headers, data: data, responseType: 'text' });
        var text = typeof r.data === 'string' ? r.data : JSON.stringify(r.data);
        return { ok: r.status >= 200 && r.status < 300, status: r.status, text: async function () { return text; }, json: async function () { return JSON.parse(text); } };
      } catch (e2) { throw offlineErr(e2); }
    }
  }

  /* ---------- auth (native; each call asks Google Play services for a fresh access token) ---------- */
  var auth = null, refreshing = null, needsSignin = false;   // needsSignin: Google would have to show UI (consent expired/revoked) -> user must tap Sign in again
  function plugErr(e) {
    var code = (e && (e.code || (e.data && e.data.code))) || '';
    var x = new Error((e && e.message) || 'Google sign-in failed'); x.code = code;
    if (code === 'NEEDS_RESOLUTION') { x.signin = true; x.message = 'Google needs you to sign in again.'; }
    else if (code === 'API_7' || code === 'API_8' || code === 'API_15') x.offline = true;   // NETWORK_ERROR / INTERNAL_ERROR / TIMEOUT
    return x;
  }
  async function accountEmail(token) {
    // only used if the plugin result carries no e-mail: the Drive scope can read the user's own address
    try {
      var r = await sfetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { Authorization: 'Bearer ' + token } });
      if (r.ok) { var j = await r.json(); if (j.email) return j.email; }
    } catch (e) {}
    try {
      var r2 = await sfetch('https://www.googleapis.com/drive/v3/about?fields=user(emailAddress)', { headers: { Authorization: 'Bearer ' + token } });
      if (r2.ok) { var j2 = await r2.json(); return (j2.user && j2.user.emailAddress) || ''; }
    } catch (e) {}
    return '';
  }
  var gisLoading = null;
  function loadGis() {
    if (window.google && google.accounts && google.accounts.oauth2) return Promise.resolve();
    if (gisLoading) return gisLoading;
    gisLoading = new Promise(function (ok, bad) {
      var sc = document.createElement('script'); sc.src = 'https://accounts.google.com/gsi/client'; sc.async = true;
      sc.onload = function () { ok(); }; sc.onerror = function () { gisLoading = null; bad(offlineErr(new Error('Could not load Google sign-in'))); };
      document.head.appendChild(sc);
    });
    return gisLoading;
  }
  function webAuthorize(interactive) {
    // Silent (non-interactive) refresh is not possible without a popup in the browser, so an expired token -> "Sign in again" (one click, no consent screen).
    if (!interactive) return Promise.reject(Object.assign(new Error('Google sign-in expired'), { signin: true }));
    var cid = webClientId();
    if (!cid) return Promise.reject(Object.assign(new Error('Computer sign-in is not set up yet: paste the Web OAuth client ID below.'), { code: 'NO_CLIENT' }));
    return loadGis().then(function () {
      return new Promise(function (ok, bad) {
        var tc = google.accounts.oauth2.initTokenClient({
          client_id: cid, scope: GIS_SCOPE, login_hint: (auth && auth.email) || lget('wp-sync-lastemail') || undefined,
          callback: function (r) { if (r && r.access_token) ok(r); else bad(Object.assign(new Error((r && (r.error_description || r.error)) || 'Google sign-in failed'), { code: r && r.error })); },
          error_callback: function (e) { bad(Object.assign(new Error((e && e.message) || 'Sign-in window closed'), { code: e && e.type === 'popup_closed' ? 'CANCELLED' : e && e.type === 'popup_failed_to_open' ? 'POPUP_BLOCKED' : (e && e.type) || '' })); }
        });
        popupPending = true; renderModal();
        tc.requestAccessToken({ prompt: auth && auth.email ? '' : 'consent' });
      });
    }).then(async function (r) {
      var email = await accountEmail(r.access_token) || (auth && auth.email) || '';
      var ttl = Math.max(60000, (Number(r.expires_in) || 3600) * 1000 - 120000);
      auth = { email: email, access_token: r.access_token, exp: Date.now() + ttl };
      authSave(); lset('wp-sync-webtok', JSON.stringify({ t: r.access_token, exp: auth.exp }));
      return auth.access_token;
    });
  }
  function startRedirect() {
    var cid = webClientId();
    if (!cid) return Promise.reject(Object.assign(new Error('Sign-in is not set up yet: paste the Web OAuth client ID below.'), { code: 'NO_CLIENT' }));
    var st = Math.random().toString(36).slice(2) + Date.now().toString(36);
    lset('wp-sync-oauthstate', st + '|' + (location.hash || '#overview'));
    var hint = (auth && auth.email) || lget('wp-sync-lastemail') || '';
    var u = 'https://accounts.google.com/o/oauth2/v2/auth?client_id=' + encodeURIComponent(cid) + '&redirect_uri=' + encodeURIComponent(redirectUri()) +
      '&response_type=token&include_granted_scopes=true&scope=' + encodeURIComponent(GIS_SCOPE) + '&state=' + encodeURIComponent(st) +
      (hint ? '&login_hint=' + encodeURIComponent(hint) + '&prompt=none' : '&prompt=consent');
    location.assign(u);
    return new Promise(function () {});   // page navigates away
  }
  async function finishRedirect() {
    var raw = lget('wp-sync-redirect-done'); if (!raw) return false;
    lrem('wp-sync-redirect-done');
    var r; try { r = JSON.parse(raw); } catch (e) { return false; }
    if (r.error) {
      if (r.error === 'interaction_required' || r.error === 'login_required' || r.error === 'consent_required') { lrem('wp-sync-lastemail'); return startRedirect(); }
      setState('signin', 'Sign-in did not finish: ' + r.error); return true;
    }
    var email = await accountEmail(r.t);
    auth = { email: email, access_token: r.t, exp: r.exp };
    authSave(); lset('wp-sync-webtok', JSON.stringify({ t: r.t, exp: r.exp })); if (email) lset('wp-sync-lastemail', email);
    needsSignin = false; afterSignin(); runSync('signin');
    return true;
  }
  async function authorize(interactive) {
    if (web && interactive && useRedirect()) return startRedirect();
    if (web) return webAuthorize(interactive);
    var G = Plug.GoogleAuth;
    if (!G) throw Object.assign(new Error('Google sign-in works in the Android app only.'), { code: 'NO_PLUGIN' });
    var res;
    try { res = await G.authorize({ interactive: !!interactive, email: interactive ? '' : ((auth && auth.email) || '') }); }
    catch (e) { throw plugErr(e); }
    if (!res || !res.accessToken) throw plugErr({ message: 'Google returned no access token' });
    var email = res.email || (auth && auth.email) || await accountEmail(res.accessToken);
    auth = { email: email || '', access_token: res.accessToken, exp: Date.now() + TOKEN_TTL };
    authSave();
    return auth.access_token;
  }
  async function getToken() {
    if (!auth) throw Object.assign(new Error('not signed in'), { signin: true });
    if (auth.access_token && auth.exp - 60000 > Date.now()) return auth.access_token;
    return refresh();
  }
  // Silent re-authorize (never shows UI). If Google would need UI, throws {signin:true} -> chip shows "Sign in".
  async function refresh(dropCached) {
    if (!auth) throw Object.assign(new Error('not signed in'), { signin: true });
    if (refreshing) return refreshing;
    refreshing = (async function () {
      try {
        if (dropCached && auth.access_token && Plug.GoogleAuth && Plug.GoogleAuth.clearToken) { try { await Plug.GoogleAuth.clearToken({ accessToken: auth.access_token }); } catch (e) {} }
        if (web) { if (!dropCached && auth.access_token && auth.exp - 60000 > Date.now()) return auth.access_token; auth.access_token = ''; lrem('wp-sync-webtok'); return await authorize(false); }
        auth.access_token = '';
        return await authorize(false);
      } finally { refreshing = null; }
    })();
    return refreshing;
  }
  // Popup watchdog: GitHub Pages + Google's popup trigger Cross-Origin-Opener-Policy checks, so a closed popup isn't always
  // reported. When the user comes back to this window and nothing arrived, stop waiting and offer full-page sign-in.
  var popupPending = false;
  window.addEventListener('focus', function () {
    if (!popupPending) return;
    setTimeout(function () { if (popupPending && state === 'syncing') { popupPending = false; setState('signin', 'The Google window closed or didn’t finish. Try again, or use “Sign in on this page instead”.'); } }, 2500);
  });
  function redirectSignIn() { lset('wp-sync-redirect', '1'); startRedirect().catch(function (e) { setState('error', 'Sign-in failed: ' + (e.message || e)); }); }
  async function signIn() {
    if (!web && !Plug.GoogleAuth) { setState('error', 'Google sign-in plugin missing.'); return; }
    if (web) { var ci = modal && modal.querySelector('#wp-webclient'); if (ci && ci.value.trim()) lset('wp-sync-webclient', ci.value.trim()); }
    setState('syncing', 'Opening Google sign-in…');
    try {
      await authorize(true); popupPending = false; needsSignin = false;
      if (auth.email) lset('wp-sync-lastemail', auth.email);
      afterSignin(); closeModal(); runSync('signin');
    } catch (e) {
      var wasPending = popupPending; popupPending = false;
      if (e.code === 'POPUP_BLOCKED') { setState('syncing', 'Pop-up blocked: signing in on this page instead…'); redirectSignIn(); return; }
      if (e.code === 'NO_CLIENT') { setState('error', e.message); return; }
      if (e.code === 'CANCELLED') setState('signin', 'Sign-in cancelled.');
      else if (web && navigator.onLine !== false && /Could not load Google sign-in/.test(String(e.message))) { setState('syncing', 'Google sign-in script didn’t load: signing in on this page instead…'); redirectSignIn(); return; }
      else setState(e.offline ? 'offline' : 'error', 'Sign-in failed: ' + (e.message || e) + (e.code ? ' [' + e.code + ']' : ''));
    }
  }
  function afterSignin() { identify(); }
  // Who am I? Match the signed-in e-mail to the shared People list; add myself if I'm new (I can rename myself in Settings).
  function identify(addIfMissing) {
    var em = ((auth && auth.email) || '').toLowerCase(); if (!em) return;
    var a; try { a = JSON.parse(ls.getItem('wp-people') || '[]') || []; } catch (e) { a = []; }
    var m = a.filter(function (x) { return x && (x.email || '').toLowerCase() === em; })[0];
    if (!m && addIfMissing) {
      var nm = em.split('@')[0].replace(/[._\d]+/g, ' ').trim(); nm = nm ? nm.charAt(0).toUpperCase() + nm.slice(1) : 'Guest';
      m = { id: 'p_' + Date.now().toString(36), name: nm, email: em, role: '' }; a.push(m);
      ls.setItem('wp-people', JSON.stringify(a));
      detail = 'Welcome! You were added to People as “' + nm + '”. You can change your name in Settings.';
    }
    if (m && m.name) lset('wp-sync-me', m.name.trim().split(' ')[0]);
  }
  async function signOut() {
    var tok = auth && auth.access_token;
    auth = null; authClear(); needsSignin = false; lrem('wp-sync-webtok');
    if (web && tok && window.google && google.accounts && google.accounts.oauth2) { try { google.accounts.oauth2.revoke(tok, function () {}); } catch (e) {} }
    if (tok && Plug.GoogleAuth && Plug.GoogleAuth.clearToken) { try { await Plug.GoogleAuth.clearToken({ accessToken: tok }); } catch (e) {} }
    setState('signin', ''); renderModal();
  }

  /* ---------- engine ---------- */
  var drive = S.createDrive({ fetch: sfetch, getToken: getToken, refreshToken: function () { return refresh(true); } });
  var engine = S.createEngine({
    folderId: function () { return (CFG.SYNC_FOLDER_ID || '').trim(); }, fileId: function () { return (lget('wp-sync-fileid') || CFG.SYNC_FILE_ID || '').trim(); },
    drive: drive, who: getWho, email: function () { return auth && auth.email || ''; }, now: function () { return Date.now(); },
    rawIO: S.local.rawIO, loadMeta: S.local.loadMeta, saveMeta: S.local.saveMeta, suspend: function (fn) { return fn(); }
  });

  /* ---------- status + UI ---------- */
  var state = 'signin', detail = '', running = false, rerun = false, lastRunAt = 0, lastEditAt = 0;
  var LABEL = { synced: 'Synced', syncing: 'Syncing…', offline: 'Offline', signin: 'Sign in', error: 'Sync error', connect: 'Connect' };
  function setState(s, d) { state = s; detail = d || ''; renderChip(); renderModal(); }

  var css = document.createElement('style');
  css.textContent =
    '.sxm-chip{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;padding:6px 10px;border-radius:9999px;border:1px solid #d1d5db;background:#fff;color:#3a2e2a;cursor:pointer;white-space:nowrap;line-height:1.2}' +
    '.sxm-dot{width:8px;height:8px;border-radius:50%;background:#9ca3af;display:inline-block}' +
    '.sxm-chip[data-s=synced] .sxm-dot{background:#22c55e}.sxm-chip[data-s=syncing] .sxm-dot{background:#f59e0b;animation:sxmpulse 1s infinite}' +
    '.sxm-chip[data-s=signin] .sxm-dot{background:#b5838d}.sxm-chip[data-s=error] .sxm-dot{background:#ef4444}' +
    '@keyframes sxmpulse{50%{opacity:.25}}@keyframes sxmspin{to{transform:rotate(360deg)}}' +
    '.sxm-sync-btn{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:9999px;border:1px solid #d1d5db;background:#fff;color:#7a4e3a;font-size:18px;line-height:1;cursor:pointer}' +
    '.sxm-sync-btn.spin span{display:inline-block;animation:sxmspin .8s linear infinite}' +
    '.sxm-lu{text-align:center;font-size:11px;color:#6b7280;margin:-6px 0 14px}' +
    '.sxm-btn{display:block;width:100%;padding:12px 14px;margin:8px 0;border-radius:10px;border:1px solid #7a4e3a;background:#7a4e3a;color:#fff;font-weight:600;font-size:15px;cursor:pointer;min-height:44px}' +
    '.sxm-btn.alt{background:#fff;color:#7a4e3a}.sxm-btn.on{background:#b5838d;border-color:#b5838d;color:#fff}' +
    '.sxm-row{display:flex;gap:8px;flex-wrap:wrap}.sxm-row .sxm-btn{flex:1 1 40%}.sxm-row .sxm-btn{margin:6px 0}.sxm-sm{font-size:12px;color:#6b7280}.sxm-err{font-size:12px;color:#b91c1c;margin-top:6px;word-break:break-word}' +
    '@media (pointer:coarse){.sxm-chip{min-height:44px}.sxm-sync-btn{width:44px;height:44px}}' +
    '@media print{.sxm-chip,.sxm-sync-btn,.sxm-lu,#wp-sync-modal{display:none!important}}';
  document.head.appendChild(css);

  var chip, syncBtn, modal;
  function mountHeader() {
    var pb = document.getElementById('print-btn-nav-g7h8');
    var host = pb && pb.parentElement;
    if (!host) return;
    chip = document.createElement('button'); chip.type = 'button'; chip.className = 'sxm-chip no-print'; chip.id = 'wp-sync-chip';
    chip.setAttribute('aria-label', 'Sync status');
    syncBtn = document.createElement('button'); syncBtn.type = 'button'; syncBtn.className = 'sxm-sync-btn no-print'; syncBtn.id = 'wp-sync-now';
    syncBtn.setAttribute('aria-label', 'Sync now'); syncBtn.innerHTML = '<span>&#x21bb;</span>';
    host.insertBefore(syncBtn, host.firstChild); host.insertBefore(chip, host.firstChild);
    chip.addEventListener('click', function () { openModal(); });
    syncBtn.addEventListener('click', function () { if (!auth || needsSignin) openModal(); else runSync('manual'); });
    renderChip();
  }
  function renderChip() {
    if (!chip) return;
    chip.setAttribute('data-s', state);
    chip.innerHTML = '<span class="sxm-dot"></span>' + LABEL[state];
    if (syncBtn) syncBtn.classList.toggle('spin', state === 'syncing');
  }

  function mountModal() {
    modal = document.createElement('div');
    modal.className = 'modal-overlay no-print'; modal.id = 'wp-sync-modal';
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
    document.body.appendChild(modal);
  }
  function whoBtns(who) {
    if (window.WPApp && WPApp.syncTeam) WPApp.syncTeam();
    return Object.keys(S.EMAILS).map(function (n) { return '<button class="sxm-btn ' + (who ? (who === n ? 'on' : 'alt') : '') + '" data-who="' + esc(n) + '">' + esc(n) + '</button>'; }).join('');
  }
  var modalMode = 'main';
  function openModal(mode) { modalMode = mode || 'main'; renderModal(); modal.classList.add('active'); }
  function closeModal() { if (modal) modal.classList.remove('active'); }
  /* ---------- v1.6 one-time "Connect to the family planner" (Google Picker, drive.file) ---------- */
  var notConnected = false;
  var BASE_URL = 'https://blur7285.github.io/wedding-planner/';
  function pickerKey() { return (CFG.PICKER_API_KEY || lget('wp-sync-pickerkey') || '').trim(); }
  var pickerP = null;
  function loadPicker() {
    if (window.google && google.picker) return Promise.resolve();
    if (!pickerP) pickerP = new Promise(function (res, rej) {
      var sc = document.createElement('script'); sc.src = 'https://apis.google.com/js/api.js'; sc.async = true;
      sc.onload = function () { window.gapi.load('picker', { callback: res, onerror: rej }); }; sc.onerror = function () { pickerP = null; rej(new Error('Could not load Google Picker (offline?)')); };
      document.head.appendChild(sc);
    });
    return pickerP;
  }
  async function connect() {
    if (native) {   // Picker can't run inside the Android app's WebView: do the one-time step in the browser; access then works in the app too (same Google project)
      location.href = BASE_URL + '#connect';   // Capacitor hands non-app URLs to the system browser
      detail = 'Finish “Connect” in the browser that just opened (sign in with the same Google account), then come back and tap Sync now.'; renderModal(); return;
    }
    var key = pickerKey(); if (!key) { setState('connect', 'Paste the Picker API key below first (one-time setup).'); return; }
    try {
      var tok = await getToken(); await loadPicker();
      var P = google.picker, FOLDER = (CFG.SYNC_FOLDER_ID || '').trim();
      var inFolder = new P.DocsView(P.ViewId.DOCS).setMode(P.DocsViewMode.LIST).setIncludeFolders(true); if (FOLDER) inFolder.setParent(FOLDER);
      var search = new P.DocsView(P.ViewId.DOCS).setMode(P.DocsViewMode.LIST).setQuery(S.FILE_NAME);
      var b = new P.PickerBuilder().setAppId(String(CFG.PROJECT_NUMBER || '')).setOAuthToken(tok).setDeveloperKey(key).addView(inFolder).addView(search)
        .setTitle('Tap “' + S.FILE_NAME + '”, then Select').setOrigin(location.protocol + '//' + location.host).setSize(Math.min(1051, innerWidth - 10), Math.min(650, innerHeight - 40))
        .setCallback(function (d) {
          if (d.action !== P.Action.PICKED) return;
          var doc = d.docs && d.docs[0]; if (!doc) return;
          if (doc.mimeType === 'application/vnd.google-apps.folder') { setState('connect', 'That is the folder: open it and choose the file “' + S.FILE_NAME + '”.'); return; }
          if (doc.name !== S.FILE_NAME) { setState('connect', 'Please choose the file named “' + S.FILE_NAME + '”.'); return; }
          lset('wp-sync-fileid', doc.id); notConnected = false; detail = 'Connected! Syncing…'; runSync('connect');
        });
      b.build().setVisible(true);
      detail = 'If Google shows “403” in that window: (1) the planner’s Google key must allow https://docs.google.com/* (organizer fix in Google Cloud), or (2) this browser is signed in to Google with a different account first: open the planner in a window where ' + (auth && auth.email || 'your account') + ' is the only/first Google account (e.g. an InPrivate window), sign in, and Connect again.'; renderModal();
    } catch (e) { setState('connect', 'Could not open the file chooser: ' + (e.message || e)); }
  }
  function renderModal() {
    if (!modal) return;
    var who = getWho(), h;
    {
      var last = lget('wp-sync-last');
      h = '<div class="modal-card"><div class="modal-header"><h3>Sync with Google Drive</h3><button data-act="close" style="background:none;border:none;color:#fff;font-size:24px;min-width:44px;min-height:44px;cursor:pointer">&#x2715;</button></div><div class="modal-body">' +
        '<div class="sxm-sm" style="margin-bottom:4px">This device: <b>' + esc(S.device ? S.device() : (native ? 'Android phone' : 'Computer')) + '</b>' + (lget('wp-sync-me') ? ' · You: <b>' + esc(lget('wp-sync-me')) + '</b>' : '') + '</div>' +
        '<div style="margin:10px 0 2px;font-weight:600">' + LABEL[state] + '</div>' +
        '<div class="sxm-sm">' + (auth ? (needsSignin ? 'Sign-in needed again for ' : 'Signed in as ') + esc(auth.email || 'Google account') : 'Not signed in. The app works on this device; sign in with your Google account to share the plan with everyone else.' + (useRedirect() ? ' You’ll go to Google and come straight back here.' : '')) + '</div>' +
        (last ? '<div class="sxm-sm">Last synced ' + esc(ago(+last)) + '</div>' : '') +
        (detail ? '<div class="' + (state === 'error' ? 'sxm-err' : 'sxm-sm') + '">' + esc(detail) + '</div>' : '') +
        ((auth && notConnected && !needsSignin) ? '<div class="sxm-sm" style="margin-top:10px"><b>One-time step:</b> connect this Google account to the family planner. A Google window opens; tap <b>' + esc(S.FILE_NAME) + '</b> (in “' + esc(S.FOLDER_NAME) + '”), then <b>Select</b>. If you don’t see it, the organizer hasn’t shared the folder with ' + esc(auth.email || 'you') + ' yet.</div>' +
          ((web && !CFG.PICKER_API_KEY) ? '<label class="sxm-sm" style="display:block;margin-top:10px">Picker API key (one-time setup)<input id="wp-pickerkey" placeholder="AIza…" value="' + esc(lget('wp-sync-pickerkey') || '') + '" style="margin-top:4px;font-size:13px"></label>' : '') +
          '<button class="sxm-btn" data-act="connect">Connect to the family planner</button>' : '') +
        (auth ? (needsSignin ? '<button class="sxm-btn" data-act="signin">Sign in again</button>' : '<button class="sxm-btn" data-act="sync">Sync now</button>') + '<button class="sxm-btn alt" data-act="signout">Sign out</button>'
              : ((web && !CFG.WEB_CLIENT_ID) ? '<label class="sxm-sm" style="display:block;margin-top:10px">Web OAuth client ID (one-time setup)<input id="wp-webclient" placeholder="749897568298-….apps.googleusercontent.com" value="' + esc(lget('wp-sync-webclient') || '') + '" style="margin-top:4px;font-size:13px"></label>' : '') +
                '<button class="sxm-btn" data-act="signin">Sign in with Google</button>') +
        ((web && !useRedirect() && (!auth || needsSignin)) ? '<button class="sxm-btn alt" data-act="redirect">Sign in on this page instead</button>' : '') +
        '<div class="sxm-sm" style="margin-top:8px">Everyone’s changes are kept in one shared “' + esc(S.FOLDER_NAME) + '” folder in Google Drive that the organizer shares with each person. Changes merge item by item (the newest edit to each item wins), so two people editing at once don’t erase each other’s work. “Last updated by” shows who changed what.</div>' +
        '</div></div>';
    }
    modal.innerHTML = h;
    modal.querySelectorAll('[data-who]').forEach(function (b) { b.addEventListener('click', function () { setWho(b.getAttribute('data-who')); if (modalMode === 'who') { modalMode = 'main'; closeModal(); startup2(); } else renderModal(); }); });
    modal.querySelectorAll('[data-act]').forEach(function (b) {
      b.addEventListener('click', function () {
        var a = b.getAttribute('data-act');
        if (a === 'close' || a === 'later') closeModal();
        else if (a === 'signin') signIn();
        else if (a === 'redirect') { var ci2 = modal.querySelector('#wp-webclient'); if (ci2 && ci2.value.trim()) lset('wp-sync-webclient', ci2.value.trim()); popupPending = false; setState('syncing', 'Going to Google…'); redirectSignIn(); }
        else if (a === 'connect') { var pk = document.getElementById('wp-pickerkey'); if (pk && pk.value.trim()) lset('wp-sync-pickerkey', pk.value.trim()); connect(); }
        else if (a === 'sync') runSync('manual');
        else if (a === 'signout') signOut();
      });
    });
  }

  /* ---------- section captions ---------- */
  var SECTIONS = {
    overview: ['*'], settings: ['wp-settings'], suggest: ['wp-suggestions'], decisions: ['wp-decisions'], timeline: ['wp-tasks'], budget: ['wp-budget', 'wp-payments'],
    vendors: ['wp-vendors'], compare: ['wp-venues', 'wp-weights'], lists: ['wp-lists'], honeymoon: ['wp-honey', 'wp-hm-itin', 'wp-hm-book', 'wp-lists'], start: ['wp-profile'], menu: ['wp-menu', 'wp-meals'], guests: ['wp-guests'], seating: ['wp-tables', 'wp-guests'], dayof: ['wp-schedule'], ideas: ['wp-ideas']
  };
  function renderCaptions() {
    var meta = S.local.loadMeta();
    var secs = {}; Object.keys(SECTIONS).forEach(function (id) {
      if (SECTIONS[id][0] === '*') {
        var allKeys = {}; Object.keys(meta).forEach(function (k) { allKeys[k.split('#')[0]] = 1; });
        secs[id] = Object.keys(allKeys);
      } else secs[id] = SECTIONS[id];
    });
    var lu = S.lastUpdated(meta, secs);
    Object.keys(SECTIONS).forEach(function (id) {
      var sec = document.getElementById(id); if (!sec) return;
      var el = sec.querySelector('[data-sxm-lu]');
      if (!lu[id]) { if (el) el.remove(); return; }
      if (!el) {
        var h = sec.querySelector(id === 'overview' ? 'h1' : 'h2'); if (!h) return;
        el = document.createElement('div'); el.className = 'sxm-lu no-print'; el.setAttribute('data-sxm-lu', id);
        if (id === 'overview') { el.style.margin = '8px 0 0'; h.parentNode.appendChild(el); }
        else h.parentNode.insertBefore(el, h.nextSibling);
      }
      el.textContent = 'Last updated by ' + (lu[id].by || 'someone') + ' · ' + ago(lu[id].t);
    });
  }

  /* ---------- running a sync ---------- */
  async function runSync(reason) {
    if (window.WPApp && WPApp.syncTeam) WPApp.syncTeam();
    if (!auth) { setState('signin', detail); return; }
    if (needsSignin && reason !== 'manual' && reason !== 'signin') return;   // don't keep poking Google in the background; wait for the user to sign in again
    if (running) { rerun = true; return; }
    if (navigator.onLine === false) { setState('offline', 'No connection — will sync when back online.'); return; }
    running = true; lastRunAt = Date.now(); setState('syncing', '');
    try {
      await refresh();   // silent re-authorize on every sync: fresh ~1 h access token from Google Play services (never shows UI)
      var r = await engine.sync(); notConnected = false;
      lset('wp-sync-last', String(Date.now())); needsSignin = false;
      identify(true);
      setState('synced', detail && /Welcome/.test(detail) ? detail : '');
      renderCaptions();
      if (r.changedKeys.length) scheduleReload();
    } catch (e) {
      if (e.noAccess && e.message === 'NOT_CONNECTED') { notConnected = true; setState('connect', ''); if (/signin|manual|connect|open/.test(reason || '') && !modal.classList.contains('active')) openModal(); }
      else if (e.noAccess) setState('error', (e.message === 'READ_ONLY' ? 'This Google account (' + ((auth && auth.email) || '') + ') can only view the shared “' + S.FOLDER_NAME + '” folder. Ask the organizer to make you an Editor.' : 'This Google account (' + ((auth && auth.email) || '') + ') doesn’t have access to the shared “' + S.FOLDER_NAME + '” folder yet. Ask the organizer to share it with this address, then tap Sync now. Your edits are kept on this device until then.'));
      else if (e.offline || (navigator.onLine === false)) setState('offline', 'No connection — will retry.');
      else if (e.signin || e.status === 401) { needsSignin = true; setState('signin', 'Google sign-in expired — ' + (native ? 'tap' : 'click') + ' “Sign in again” to continue syncing. Your data on this device is safe.'); }
      else {
        var msg = 'Sync failed' + (e.status ? ' (' + e.status + ')' : '') + ': ';
        try { var j = JSON.parse(e.body || '{}'); msg += (j.error && j.error.message) || e.message; } catch (x) { msg += e.message || e; }
        if (e.status === 403 && /not been used|disabled|accessNotConfigured/i.test(e.body || '')) msg += ' — enable the Google Drive API for this Cloud project.';
        setState('error', msg);
      }
    } finally {
      running = false;
      if (rerun) { rerun = false; setTimeout(function () { runSync('rerun'); }, 500); }
    }
  }

  var reloadTimer = null;
  function scheduleReload() {
    if (reloadTimer) return;
    reloadTimer = setInterval(tryReload, 2500); setTimeout(tryReload, 600);
  }
  function tryReload() {
    var ae = document.activeElement;
    var typing = ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName) && !/checkbox|radio|button/.test(ae.type || '');
    var modalOpen = document.querySelector('.modal-overlay.active');
    if (typing || modalOpen || Date.now() - lastEditAt < 3000 || running) return;
    clearInterval(reloadTimer); reloadTimer = null;
    try { sessionStorage.setItem('wp-sync-scroll', String(window.scrollY || 0)); } catch (e) {}
    location.reload();
  }
  // restore scroll position after a sync-triggered reload
  try {
    var sy = sessionStorage.getItem('wp-sync-scroll');
    if (sy !== null) {
      sessionStorage.removeItem('wp-sync-scroll');
      window.addEventListener('load', function () { setTimeout(function () { window.scrollTo({ top: +sy, behavior: 'instant' }); }, 450); });
    }
  } catch (e) {}

  /* ---------- scheduling: open, resume, 5 s after edits, periodic ---------- */
  var editTimer = null, capTimer = null;
  S.onLocalChange = function () {
    lastEditAt = Date.now();
    clearTimeout(capTimer); capTimer = setTimeout(renderCaptions, 600);
    if (!auth) return;
    clearTimeout(editTimer); editTimer = setTimeout(function () { runSync('edit'); }, 5000);
  };
  function onResume() { if (auth && Date.now() - lastRunAt > 10000) runSync('resume'); }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) onResume(); });
  window.addEventListener('online', function () { if (auth) runSync('online'); });
  window.addEventListener('offline', function () { if (auth) setState('offline', ''); });
  if (Plug.App && Plug.App.addListener) {
    try {
      Plug.App.addListener('appStateChange', function (s) { if (s && s.isActive) onResume(); });
    } catch (e) {}
  }
  setInterval(function () { if (auth && !document.hidden && Date.now() - lastRunAt > 120000) runSync('poll'); }, 30000);

  /* ---------- startup ---------- */
  function startup2() { if (auth) setTimeout(function () { runSync('open'); }, 600); else if (/^#connect/.test(location.hash) && modal) openModal(); }
  async function start() {
    mountHeader(); mountModal(); renderCaptions();
    auth = authLoad();
    if (web && !useRedirect()) { setTimeout(function () { loadGis().catch(function () {}); }, 1500); }   // preload so the sign-in popup opens straight from the click
    if (web && lget('wp-sync-redirect-done')) { finishRedirect(); return; }
    if (auth && web) { try { var wt = JSON.parse(lget('wp-sync-webtok') || 'null'); if (wt && wt.exp > Date.now() + 60000) { auth.access_token = wt.t; auth.exp = wt.exp; } else needsSignin = true; } catch (e) {} }
    setState(auth ? (navigator.onLine === false ? 'offline' : 'synced') : 'signin', '');
    if (auth && lget('wp-sync-last') === null) setState('syncing', '');
    if (auth && needsSignin) setState('signin', 'Click “Sign in again” to resume syncing.');
    startup2();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();

  window.SXMSyncApp = { runSync: runSync, signIn: signIn, signOut: signOut, state: function () { return state; } };
})();
