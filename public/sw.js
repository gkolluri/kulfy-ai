// Kulfy Service Worker - Aggressive Image Caching
const CACHE_NAME = 'kulfy-cache-v1';
const IMAGE_CACHE_NAME = 'kulfy-images-v1';

// Install event - set up caches
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  self.skipWaiting(); // Activate immediately
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== IMAGE_CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - cache strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Cache strategy for images (IPFS and API proxy)
  if (
    event.request.destination === 'image' ||
    url.pathname.startsWith('/api/image/') ||
    url.hostname.includes('mypinata.cloud') ||
    url.hostname.includes('pinata.cloud')
  ) {
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then((cache) => {
        // Create a cache key without query params for consistency
        const cacheRequest = new Request(url.origin + url.pathname, {
          method: event.request.method,
          headers: event.request.headers,
          mode: event.request.mode,
          credentials: event.request.credentials,
          redirect: event.request.redirect,
        });
        
        return cache.match(cacheRequest).then((cachedResponse) => {
          if (cachedResponse) {
            console.log('[SW] ✅ Cache HIT:', url.pathname);
            return cachedResponse;
          }
          
          console.log('[SW] ❌ Cache MISS, fetching:', url.pathname);
          return fetch(event.request).then((response) => {
            // Only cache successful responses
            if (response.status === 200) {
              console.log('[SW] 💾 Caching image:', url.pathname);
              cache.put(cacheRequest, response.clone());
            }
            return response;
          }).catch((error) => {
            console.error('[SW] Fetch failed for image:', error);
            // Return a placeholder or offline image if needed
            return new Response('Image unavailable', { status: 503 });
          });
        });
      })
    );
    return;
  }
  
  // Network-first strategy for HTML/API requests
  if (
    event.request.mode === 'navigate' ||
    url.pathname.startsWith('/api/')
  ) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Optionally cache successful navigations
          if (response.status === 200 && event.request.mode === 'navigate') {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, response.clone());
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if offline
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // Default: network-first, cache fallback
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

// Listen for messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      }).then(() => {
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({ type: 'CACHE_CLEARED' });
          });
        });
      })
    );
  }
});

