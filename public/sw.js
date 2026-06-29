const CACHE_NAME = "biocycle-v1";

// Install event - cache core shell files
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(["/"]);
    })
  );
});

// Fetch event - network-first fallback strategy
self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request).catch(() => {
        // Fallback for offline if page is requested
        if (e.request.mode === "navigate") {
          return caches.match("/");
        }
      });
    })
  );
});
