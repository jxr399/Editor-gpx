const APP = 'app-v1';
const TILES = 'tiles-v1';
const HOSTS = ['www.ign.es', 'tile.opentopomap.org', 'a.tile.opentopomap.org', 'b.tile.opentopomap.org', 'c.tile.opentopomap.org', 'tile.openstreetmap.org', 'server.arcgisonline.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(APP).then(c => c.addAll(['./', 'index.html'])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin === location.origin) {
    e.respondWith(
      fetch(r).then(res => {
        const cp = res.clone();
        caches.open(APP).then(c => c.put(r, cp));
        return res;
      }).catch(() => caches.match(r, { ignoreSearch: true }).then(m => m || caches.match('index.html')))
    );
    return;
  }
  if (HOSTS.includes(u.hostname)) {
    e.respondWith(caches.open(TILES).then(async c => {
      const m = await c.match(r.url);
      if (m) return m;
      try {
        const res = await fetch(r);
        if (res.ok || res.type === 'opaque') c.put(r.url, res.clone());
        return res;
      } catch (err) {
        return Response.error();
      }
    }));
  }
});
