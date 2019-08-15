// Set a name for the current cache
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
    event.respondWith(fetch(event.request).then(response => {
        let networkResponse;
        ['.js', '.html', '.ico', '.css', '.otf', '.png', '.jpg'].some(suffix => {
            const match = event.request.url.endsWith(suffix);
            if (match) {
                networkResponse = response.clone();
            }
            return match;
        });
        if (networkResponse) {
            caches.open(cacheName).then(cache => {
                cache.put(event.request.url, networkResponse);
            });
        }
        return response;
    }).catch(() => {
        return caches.match(event.request);
    }));
});
