/* Rivas Auto - cache v3: actualiza HTML y scripts antes de servir el cache. */
const CACHE_NAME = "rivas-auto-cache-v3";
const ASSETS = ["./","./index.html","./icon.png","./manifest.json","./js/backup.js","./js/recovery.js"];
self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    try { await cache.addAll(ASSETS); } catch (e) { console.warn("Cache inicial incompleto", e); }
    await self.skipWaiting();
  })());
});
self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(x => x !== CACHE_NAME).map(x => caches.delete(x)));
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  const fresh = event.request.mode === "navigate" || /\.(?:js|html|css)$/i.test(url.pathname);
  if (fresh) {
    event.respondWith(fetch(event.request).then(response => {
      if (response.ok) {
        const cloned = response.clone();
        caches.open(CACHE_NAME).then(c => c.put(event.request, cloned)).catch(() => {});
      }
      return response;
    }).catch(() => caches.match(event.request)));
  } else {
    event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
  }
});
