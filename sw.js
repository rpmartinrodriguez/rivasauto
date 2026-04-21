// sw.js - Service Worker para RIVAS AUTO ERP

// Nombre del caché (puedes cambiar el v1 a v2 cuando hagas grandes actualizaciones de diseño)
const CACHE_NAME = 'rivas-auto-cache-v1';

// Archivos estáticos que se guardarán en la memoria del dispositivo
const urlsToCache = [
  './',
  './index.html',
  './icon.png',
  './manifest.json'
];

// 1. INSTALACIÓN: Guardar los archivos iniciales en el caché
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Archivos de Rivas Auto guardados en caché correctamente.');
        return cache.addAll(urlsToCache);
      })
  );
});

// 2. ACTIVACIÓN: Limpiar cachés antiguos si se cambia el CACHE_NAME
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Borrando caché antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 3. INTERCEPCIÓN DE PETICIONES (Fetch): Estrategia Cache-First para assets estáticos
self.addEventListener('fetch', event => {
  // Solo interceptamos peticiones GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si el archivo está en caché, lo devuelve al instante (ideal para el HTML y Logo)
        if (response) {
          return response;
        }
        // Si no está, lo busca en internet
        return fetch(event.request).catch(() => {
            console.log('Falló la red al intentar obtener:', event.request.url);
        });
      })
  );
});
