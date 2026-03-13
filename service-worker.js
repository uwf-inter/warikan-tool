const CACHE_NAME = 'smart-warikan-v1';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/golf.html',
  '/travel.html',
  '/shopping.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  
  // 広告ドメインはキャッシュしない
  if (req.url.includes('adm.shinobi.jp') || req.url.includes('googleads')) {
    return;
  }
  
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('/index.html'))
    );
    return;
  }
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      // http/https 以外のリクエスト（chrome-extension等）はキャッシュしない
      if (!req.url.startsWith('http')) {
        return res;
      }
      const resClone = res.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
      return res;
    }).catch(() => cached))
  );
});
