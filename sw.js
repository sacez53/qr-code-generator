// Augmenter ce numéro quand la liste des fichiers change.
const CACHE = "qr-code-v6";

const ASSETS = [
  "./",
  "index.html",
  "generateur.html",
  "home.css",
  "home.js",
  "style.css",
  "app.js",
  "batch.js",
  "pwa.js",
  "manifest.webmanifest",
  "vendor/daisyui.css",
  "vendor/qr-code-styling.js",
  "vendor/font-data.js",
  "vendor/schibsted-grotesk-latin-wght-normal.woff2",
  "icons/apple-touch-icon.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

async function fromNetwork(request) {
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}

// Pages : version en ligne si possible. Fichiers : cache immédiat, mis à jour en arrière-plan.
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fromNetwork(request).catch(async () => (
        (await caches.match(request, { ignoreSearch: true })) || caches.match("index.html")
      )),
    );
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request, { ignoreSearch: true });
    const update = fromNetwork(request);
    if (cached) {
      event.waitUntil(update.catch(() => {}));
      return cached;
    }
    return update;
  })());
});
