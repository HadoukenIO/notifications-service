// Set a name for 'he current cache
const cacheName = PACKAGE_VERSION; // eslint-disable-line no-undef

self.addEventListener('activate', (e) => {
    e.waitUntil(caches.keys().then((cacheNames) => { // Get all the cache keys (cacheName)
        return Promise.all(cacheNames.map((thisCacheName) => {
            // If a cached item is saved under a previous cacheName
            if (thisCacheName !== cacheName) {
                // Delete that cached file
                return caches.delete(thisCacheName);
            }
        }));
    }));
});

self.addEventListener('fetch', event => {
    event.respondWith(caches.match(event.request).then(response => {
        if (response) {
            return response;
        }
        return fetch(event.request).then(response => {
            return caches.open(cacheName).then(cache => {
                cache.put(event.request.url, response.clone());
                return response;
            });
        });
    }));
});
