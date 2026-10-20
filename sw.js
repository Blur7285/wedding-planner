/* Wedding Planner service worker: network-first (updates show up immediately when online),
   versioned cache as the offline fallback. Never touches Google sign-in / Drive requests. */
var VERSION = '1.5.0';
var CACHE = 'wp-' + VERSION;
var CORE = ['./', './index.html', './manifest.webmanifest', './css/app.css', './css/fonts.css', './js/oauth-return.js', './js/config.js', './js/sync-core.js', './js/sync-hook.js', './js/sync-app.js', './js/backup.js', './js/app.js', './icons/icon-192.png', './icons/icon-512.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(CORE.map(function (u) { return new Request(u, { cache: 'reload' }); })); }).catch(function () {}).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k.indexOf('wp-') === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;   // Google APIs, GIS etc. go straight to the network
  e.respondWith(fetch(req, { cache: 'no-store' }).then(function (res) {
    if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
    return res;
  }).catch(function () {
    return caches.match(req, { ignoreSearch: true }).then(function (m) { return m || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()); });
  }));
});
