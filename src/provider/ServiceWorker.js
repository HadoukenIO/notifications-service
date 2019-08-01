// Set a name for the current cache
const cacheName = PACKAGE_VERSION; // eslint-disable-line no-undef

// Default files to always cache
const cacheFiles = [
    './provider.html',
    './main-bundle.js',
    './ui/toast-bundle.js',
    './ui/notification-center.html',
    './ui/toast.html',
    './ui/favicon.ico',
    './ui/favicon.png',
    './ui/css/base.css',
    './ui/css/notification-center.css',
    './ui/css/toast.css',
    './ui/css/AkkuratPro/AkkBdIt_Pro_1.otf',
    './ui/css/AkkuratPro/AkkBd_Pro_1.otf',
    './ui/css/AkkuratPro/AkkIt_Pro_1.otf',
    './ui/css/AkkuratPro/AkkLgIt_Pro_1.otf',
    './ui/css/AkkuratPro/AkkLg_Pro_1.otf',
    './ui/css/AkkuratPro/AkkRg_Pro_1.otf',
    './ui/css/themes/dark.css',
    './ui/css/themes/light.css',
    './ui/image/shapes/arrow.png',
    './ui/image/shapes/notifications-x.png',
    './ui/image/shapes/trayIcon.png'
];

self.addEventListener('install', (e) => {
    // e.waitUntil Delays the event until the Promise is resolved
    e.waitUntil(caches.open(cacheName).then((cache) => { // Open the cache
        // Add all the default files to the cache
        return cache.addAll(cacheFiles);
    }));
});

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

self.addEventListener('fetch', (event) => {
    event.respondWith(fetch(event.request).catch(() => {
        return caches.match(event.request);
    }));
});
