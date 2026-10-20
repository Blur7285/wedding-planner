/* Wedding Planner — storage hook. Loaded in <head> so it is active before any page script writes data.
   Stamps per-item {t, by} whenever the page writes/removes an wp-* key. Page code is unchanged. */
(function () {
  'use strict';
  var S = window.SXMSync, ls;
  if (!S) return;
  try { ls = window.localStorage; ls.getItem('x'); } catch (e) { return; }
  var P = Storage.prototype, oSet = P.setItem, oRem = P.removeItem, oGet = P.getItem;
  function listKeys() { var a = []; for (var i = 0; i < ls.length; i++) a.push(ls.key(i)); return a; }
  function device() {
    var c = window.Capacitor; if (c && c.isNativePlatform && c.isNativePlatform()) return 'Android app';
    var ua = navigator.userAgent || '';
    if (/iPhone|iPod/.test(ua)) return 'iPhone'; if (/iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'iPad';
    if (/Android/.test(ua)) return 'Android'; return 'computer';
  }
  S.device = device;
  // "Graham (Android app)", "Arielle (iPhone)": the name comes from the People list (matched by the signed-in e-mail), stored locally.
  S.whoLabel = function () { var n = ''; try { n = oGet.call(ls, 'wp-sync-me') || ''; } catch (e) {} var d = device(); return n ? n + ' (' + d + ')' : d.charAt(0).toUpperCase() + d.slice(1); };
  var local = S.createLocal({
    getRaw: function (k) { return oGet.call(ls, k); },
    setRaw: function (k, v) { oSet.call(ls, k, v); },
    removeRaw: function (k) { oRem.call(ls, k); },
    listKeys: listKeys,
    getWho: function () { return S.whoLabel(); },
    now: function () { return Date.now(); }
  });
  S.local = local;
  S.onLocalChange = null;
  function notify(k) { try { if (S.onLocalChange) S.onLocalChange(k); } catch (e) {} }
  P.setItem = function (k, v) {
    if (this === ls && S.isSynced(k)) {
      var old = oGet.call(ls, k);
      oSet.call(ls, k, v);
      try { if (local.afterWrite(k, old, String(v))) notify(k); } catch (e) {}
      return;
    }
    return oSet.apply(this, arguments);
  };
  P.removeItem = function (k) {
    if (this === ls && S.isSynced(k)) {
      var old = oGet.call(ls, k);
      oRem.call(ls, k);
      try { if (old !== null && local.afterWrite(k, old, null)) notify(k); } catch (e) {}
      return;
    }
    return oRem.apply(this, arguments);
  };
})();
