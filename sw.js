const CACHE_NAME = 'card-scanner-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
   './form.html',
   './script.js',
   './style.css', // if external CSS
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
