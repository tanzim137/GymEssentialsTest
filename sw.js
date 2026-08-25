const CACHE_NAME = "gymessentials-v1.0-platform";
const APP_SHELL = [
  "./", "./index.html", "./styles.css", "./app.js", "./manifest.json"
];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("message", event => { if (event.data?.type === "SKIP_WAITING") self.skipWaiting(); });
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const request = event.request;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const shell = request.mode === "navigate" || /\.(?:js|css|json|html)$/i.test(url.pathname);
  if (shell) {
    event.respondWith(fetch(request).then(response => { if (response?.status === 200) caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone())); return response; }).catch(() => caches.match(request).then(cached => cached || caches.match("./index.html"))));
    return;
  }
  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => { if (response?.status === 200) caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone())); return response; })).catch(() => caches.match("./index.html")));
});
