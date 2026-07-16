const CACHE_NAME = 'nexus-grr-cache-v1';
const ASSETS = [
  '/manifest.json',
  '/icons/icon.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      try {
        return cache.addAll(ASSETS);
      } catch (err) {
        console.warn("Could not cache all assets during install", err);
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Ignora chamadas POST e Server Actions (método POST)
  if (event.request.method !== 'GET') {
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request).catch(() => {
        // Fallback offline se necessário
      });
    })
  );
});
