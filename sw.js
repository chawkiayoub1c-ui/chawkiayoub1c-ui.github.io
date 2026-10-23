const CACHE = 'radar-v1';
const FILES = ['./', 'index.html', 'privacy.html', 'manifest.json', 'icon-192.png', 'icon-512.png'];
const SKIP = ['googlesyndication', 'doubleclick', 'googleadservices', 'adtrafficquality'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || SKIP.some(s => req.url.includes(s))) return;
  e.respondWith(
    caches.match(req).then(cached => {
      const net = fetch(req).then(res => {
        if (res && (res.ok || res.type === 'opaque')) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => cached || caches.match('index.html'));
      return cached || net;
    })
  );
});
