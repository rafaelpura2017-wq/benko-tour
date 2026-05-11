const CACHE_NAME = "palenque-lengua-v16";
const APP_FILES = [
  "./",
  "./index.html",
  "./dashboard.html",
  "./terminos.html",
  "./app.css",
  "./app.js",
  "./lessons-data.js",
  "./manifest.webmanifest",
  "./config.js",
  "./firebase-config.js",
  "./assets/data/lengua-palenquera-dictionary.js",
  "./assets/images/brand/favicon-ph.png",
  "./assets/images/brand/apple-touch-icon-180.png",
  "./assets/images/brand/logo-sello-ph.png",
  "./assets/images/brand/pwa-icon-192.png",
  "./assets/images/brand/pwa-icon-512.png",
  "../config.js",
  "../firebase-config.js",
  "../assets/data/lengua-palenquera-dictionary.js",
  "../assets/images/brand/favicon-ph.png",
  "../assets/images/brand/apple-touch-icon-180.png",
  "../assets/images/brand/logo-sello-ph.png",
  "../assets/images/brand/pwa-icon-192.png",
  "../assets/images/brand/pwa-icon-512.png"
];

function cacheOptionalFiles(cache, files) {
  return Promise.all(
    files.map(function(file) {
      return fetch(file, { cache: "no-cache" })
        .then(function(response) {
          if (response && response.ok) {
            return cache.put(file, response);
          }
          return null;
        })
        .catch(function() {
          return null;
        });
    })
  );
}

self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cacheOptionalFiles(cache, APP_FILES);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys
          .filter(function(key) { return key !== CACHE_NAME; })
          .map(function(key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function(event) {
  const request = event.request;
  if (request.method !== "GET") {
    return;
  }
  const requestUrl = new URL(request.url);
  const networkFirstPaths = [
    "/firebase-config.js",
    "/config.js",
    "/app.js",
    "/index.html",
    "/dashboard.html"
  ];

  // Firebase usa el espacio reservado "/__" para Auth helpers.
  // No debemos interceptarlo en el service worker.
  if (requestUrl.origin === self.location.origin && requestUrl.pathname.startsWith("/__/")) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).then(function(response) {
        if (response && response.status === 200 && response.type === "basic") {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(request, cloned);
          });
        }
        return response;
      }).catch(function() {
        return caches.match("./dashboard.html").then(function(cachedDashboard) {
          if (cachedDashboard) {
            return cachedDashboard;
          }
          return caches.match("./index.html").then(function(cachedIndex) {
            if (cachedIndex) {
              return cachedIndex;
            }
            return new Response(
              "<!doctype html><html lang=\"es\"><meta charset=\"utf-8\"><title>Kumaina</title><body>Sin conexión temporal. Intenta recargar.</body></html>",
              { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
            );
          });
        });
      })
    );
    return;
  }

  if (
    requestUrl.origin === self.location.origin &&
    networkFirstPaths.some(function(path) { return requestUrl.pathname.endsWith(path); })
  ) {
    event.respondWith(
      fetch(request).then(function(response) {
        if (response && response.status === 200 && response.type === "basic") {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(request, cloned);
          });
        }
        return response;
      }).catch(function() {
        return caches.match(request).then(function(cached) {
          return cached || Response.error();
        });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(function(cached) {
      if (cached) {
        return cached;
      }

      return fetch(request).then(function(response) {
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }

        const cloned = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(request, cloned);
        });
        return response;
      }).catch(function() {
        return Response.error();
      });
    })
  );
});
