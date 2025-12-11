// ========================================
// SERVICE WORKER - POKIWAR PWA
// ========================================

const CACHE_NAME = 'pokiwar-v3';
const OFFLINE_URL = 'offline.html';

// Files to cache for offline use
const STATIC_ASSETS = [
    './',
    './index.html',
    './admin.html',
    './offline.html',
    './manifest.json',
    './styles.css',
    './styles-3d.css',
    './admin.css',
    './main.js',
    './game-data.js',
    './game-state.js',
    './game-ui.js',
    './game-battle.js',
    './admin.js',
    './assets/pets/slime.png',
    './assets/pets/fire_dragon.png',
    './assets/pets/water_spirit.png',
    './assets/pets/phoenix.png',
    './assets/pets/forest_fairy.png',
    './assets/pets/wind_hawk.png',
    './assets/pets/shadow_wolf.png',
    './assets/pets/ice_penguin.png',
    './assets/pets/unicorn.png',
    './icons/icon-72.png',
    './icons/icon-96.png',
    './icons/icon-128.png',
    './icons/icon-144.png',
    './icons/icon-152.png',
    './icons/icon-192.png',
    './icons/icon-384.png',
    './icons/icon-512.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                // Cache what we can, ignore failures
                return Promise.allSettled(
                    STATIC_ASSETS.map(url => 
                        cache.add(url).catch(err => {
                            console.log(`[SW] Failed to cache: ${url}`);
                        })
                    )
                );
            })
            .then(() => {
                console.log('[SW] Install complete');
                return self.skipWaiting();
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter(name => name !== CACHE_NAME)
                        .map(name => {
                            console.log(`[SW] Deleting old cache: ${name}`);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('[SW] Activation complete');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;
    
    // Skip chrome-extension and other non-http requests
    if (!event.request.url.startsWith('http')) return;
    
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // Return cached version if available
                if (cachedResponse) {
                    // Fetch new version in background
                    fetchAndCache(event.request);
                    return cachedResponse;
                }
                
                // Not in cache, fetch from network
                return fetch(event.request)
                    .then((response) => {
                        // Cache valid responses
                        if (response.ok) {
                            const responseToCache = response.clone();
                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(event.request, responseToCache);
                                });
                        }
                        return response;
                    })
                    .catch(() => {
                        // Offline and not in cache
                        if (event.request.headers.get('accept').includes('text/html')) {
                            return caches.match(OFFLINE_URL);
                        }
                    });
            })
    );
});

// Helper: Fetch and update cache in background
function fetchAndCache(request) {
    fetch(request)
        .then((response) => {
            if (response.ok) {
                caches.open(CACHE_NAME)
                    .then((cache) => {
                        cache.put(request, response);
                    });
            }
        })
        .catch(() => {
            // Network failed, keep using cache
        });
}

// Handle push notifications (optional)
self.addEventListener('push', (event) => {
    const data = event.data?.json() || {};
    
    const options = {
        body: data.body || 'Có thông báo mới từ PokiWar!',
        icon: './icons/icon-192.png',
        badge: './icons/icon-72.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || './'
        }
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title || 'PokiWar', options)
    );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow(event.notification.data.url || './')
    );
});
