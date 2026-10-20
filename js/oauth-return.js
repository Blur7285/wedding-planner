/* Wedding Planner: finish a full-page Google sign-in (used on iPhone/iPad). Runs before the app reads location.hash.
   Google returns #access_token=…&expires_in=…&state=… (or #error=…); we keep the token on this device only and restore the page. */
(function () {
  try {
    var h = location.hash || '';
    if (!/[#&](access_token|error)=/.test(h)) return;
    var q = {}; h.replace(/^#/, '').split('&').forEach(function (kv) { var i = kv.indexOf('='); if (i > 0) q[decodeURIComponent(kv.slice(0, i))] = decodeURIComponent(kv.slice(i + 1).replace(/\+/g, ' ')); });
    var saved = (localStorage.getItem('wp-sync-oauthstate') || '').split('|'), back = saved[1] || '#overview';
    if (q.state && saved[0] === q.state) {
      localStorage.removeItem('wp-sync-oauthstate');
      var r = q.access_token ? { t: q.access_token, exp: Date.now() + Math.max(60, (+q.expires_in || 3600) - 120) * 1000 } : { error: q.error || 'unknown' };
      localStorage.setItem('wp-sync-redirect-done', JSON.stringify(r));
    }
    history.replaceState(null, '', location.pathname + location.search + (back.charAt(0) === '#' ? back : '#overview'));
  } catch (e) {}
})();
