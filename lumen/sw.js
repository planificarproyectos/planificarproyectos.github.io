// Service worker: abre Lumen rápido y sin conexión (app, liturgia y Biblia completa).
const CACHE = "lumen-v20";
const SHELL = ["./", "./index.html", "./app.js", "./liturgia.js", "./firebase-config.js", "./manifest.webmanifest",
  "./icon.svg", "./icon-192.png", "./icon-512.png", "./datos/calendario.json", "./datos/leccionario.json", "./biblia/indice.json", "../apariencia.js", "../uso.js"];
const BIBLIA = Array.from({length: 73}, (_, i) => "./biblia/" + (i + 1) + ".json");
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
  caches.open(CACHE).then(c => Promise.all(BIBLIA.map(u => c.match(u).then(m => m || c.add(u).catch(() => {})))));
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => { if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); } return r; })
    .catch(() => caches.match(e.request).then(m => m || caches.match("./"))));
});
