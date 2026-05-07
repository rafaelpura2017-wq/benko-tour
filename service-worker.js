const CACHE_VERSION = "benko-tour-cache-v2";
const CORE_CACHE_URLS = [
  "./",
  "./index.html",
  "./acceso.html",
  "./reservas.html",
  "./tienda.html",
  "./experiencia.html",
  "./nosotros.html",
  "./lengua-palenquera.html",
  "./moda.html",
  "./musica.html",
  "./otros.html",
  "./gastronomia.html",
  "./styles.css",
  "./styles.css?v=20260507-auth-ui",
  "./script.js",
  "./script.js?v=20260507-auth-ui",
  "./config.js",
  "./firebase-config.js",
  "./firebase-config.js?v=20260507-auth-ui",
  "./manifest.webmanifest",
  "./assets/images/brand/favicon-ph.png",
  "./assets/images/brand/pwa-icon-192.png",
  "./assets/images/brand/pwa-icon-512.png",
  "./assets/images/brand/apple-touch-icon-180.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(CORE_CACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

function isSameOrigin(request) {
  return new URL(request.url).origin === self.location.origin;
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_VERSION);

  try {
    const response = await fetch(request);
    cache.put(request, response.clone());
    return response;
  } catch (_) {
    return (
      (await cache.match(request)) ||
      (await cache.match("./index.html")) ||
      Response.error()
    );
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_VERSION);
  const cachedResponse = await cache.match(request);

  const networkPromise = fetch(request)
    .then((response) => {
      cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  return cachedResponse || networkPromise || Response.error();
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  if (isSameOrigin(request)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
