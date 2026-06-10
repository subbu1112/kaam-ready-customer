const CACHE = 'kaam-ready-v1'
const SHELL = ['/', '/index.html', '/manifest.json']
self.addEventListener('install', e =>
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)))
)
self.addEventListener('fetch', e =>
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)))
)
