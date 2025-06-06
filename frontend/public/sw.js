// Healthcare IVR Platform Service Worker
// Version 1.0.0 - HIPAA Compliant Offline Support

const CACHE_NAME = 'healthcare-ivr-v1';
const OFFLINE_URL = '/offline.html';

// Cache strategies
const CACHE_FIRST_RESOURCES = [
  // Static assets
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico',

  // Fonts and icons
  '/static/media/',

  // Offline page
  OFFLINE_URL
];

const NETWORK_FIRST_RESOURCES = [
  // API endpoints that should try network first
  '/api/auth/',
  '/api/patients/',
  '/api/ivr/',
  '/api/orders/',
  '/api/upload/'
];

const CACHE_ONLY_RESOURCES = [
  // Resources that should only come from cache
  '/static/media/',
  '/images/',
  '/icons/'
];

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching essential resources');
        return cache.addAll(CACHE_FIRST_RESOURCES);
      })
      .then(() => {
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Failed to cache resources during install:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Take control of all clients immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Determine caching strategy based on URL
  if (shouldUseCacheFirst(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request));
  } else if (shouldUseNetworkFirst(url.pathname)) {
    event.respondWith(networkFirstStrategy(request));
  } else if (shouldUseCacheOnly(url.pathname)) {
    event.respondWith(cacheOnlyStrategy(request));
  } else {
    // Default to network first for other requests
    event.respondWith(networkFirstStrategy(request));
  }
});

// Cache-first strategy (for static assets)
async function cacheFirstStrategy(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('Cache-first strategy failed:', error);

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match(OFFLINE_URL);
    }

    // Return a basic offline response for other requests
    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Network-first strategy (for API calls)
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);

    // Cache successful API responses (with expiration)
    if (networkResponse.status === 200 && isApiRequest(request.url)) {
      const cache = await caches.open(CACHE_NAME);
      const responseToCache = networkResponse.clone();

      // Add timestamp for cache expiration
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cached-at', Date.now().toString());

      const modifiedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });

      cache.put(request, modifiedResponse);
    }

    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache:', error);

    // Try to get from cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Check if cached response is still valid (24 hours for API responses)
      const cachedAt = cachedResponse.headers.get('sw-cached-at');
      if (cachedAt) {
        const age = Date.now() - parseInt(cachedAt);
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        if (age < maxAge) {
          // Add offline indicator header
          const headers = new Headers(cachedResponse.headers);
          headers.set('sw-offline', 'true');

          return new Response(cachedResponse.body, {
            status: cachedResponse.status,
            statusText: cachedResponse.statusText,
            headers: headers
          });
        }
      } else {
        // Non-API cached response, return as-is
        return cachedResponse;
      }
    }

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match(OFFLINE_URL);
    }

    // Return offline response for API requests
    if (isApiRequest(request.url)) {
      return new Response(JSON.stringify({
        error: 'Offline',
        message: 'This request requires an internet connection',
        offline: true
      }), {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
          'Content-Type': 'application/json',
          'sw-offline': 'true'
        }
      });
    }

    // Generic offline response
    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Cache-only strategy (for static media)
async function cacheOnlyStrategy(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  return new Response('Resource not available offline', {
    status: 404,
    statusText: 'Not Found'
  });
}

// Helper functions
function shouldUseCacheFirst(pathname) {
  return CACHE_FIRST_RESOURCES.some(resource =>
    pathname.startsWith(resource) || pathname === resource
  );
}

function shouldUseNetworkFirst(pathname) {
  return NETWORK_FIRST_RESOURCES.some(resource =>
    pathname.startsWith(resource)
  );
}

function shouldUseCacheOnly(pathname) {
  return CACHE_ONLY_RESOURCES.some(resource =>
    pathname.startsWith(resource)
  );
}

function isApiRequest(url) {
  return url.includes('/api/');
}

// Background sync for offline data
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);

  if (event.tag === 'healthcare-ivr-sync') {
    event.waitUntil(syncOfflineData());
  }
});

// Sync offline data when connection is restored
async function syncOfflineData() {
  try {
    console.log('Syncing offline data...');

    // Get all clients (open tabs/windows)
    const clients = await self.clients.matchAll();

    // Notify clients to sync their offline data
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_OFFLINE_DATA',
        timestamp: Date.now()
      });
    });

    console.log('Offline data sync initiated');
  } catch (error) {
    console.error('Failed to sync offline data:', error);
  }
}

// Push notifications (for future use)
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);

  if (event.data) {
    const data = event.data.json();

    const options = {
      body: data.body || 'New healthcare notification',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: data.tag || 'healthcare-notification',
      requireInteraction: data.requireInteraction || false,
      actions: data.actions || [],
      data: data.data || {}
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Healthcare IVR', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  // Handle notification actions
  if (event.action) {
    console.log('Notification action clicked:', event.action);
    // Handle specific actions here
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message handling from clients
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);

  const { type, data } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'GET_VERSION':
      event.ports[0].postMessage({
        version: CACHE_NAME,
        timestamp: Date.now()
      });
      break;

    case 'CLEAR_CACHE':
      clearCache().then(() => {
        event.ports[0].postMessage({ success: true });
      }).catch((error) => {
        event.ports[0].postMessage({ success: false, error: error.message });
      });
      break;

    case 'CACHE_RESOURCE':
      if (data && data.url) {
        cacheResource(data.url).then(() => {
          event.ports[0].postMessage({ success: true });
        }).catch((error) => {
          event.ports[0].postMessage({ success: false, error: error.message });
        });
      }
      break;

    default:
      console.log('Unknown message type:', type);
  }
});

// Clear all caches
async function clearCache() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
  console.log('All caches cleared');
}

// Cache a specific resource
async function cacheResource(url) {
  const cache = await caches.open(CACHE_NAME);
  await cache.add(url);
  console.log('Resource cached:', url);
}

// Error handling
self.addEventListener('error', (event) => {
  console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker unhandled rejection:', event.reason);
});

console.log('Healthcare IVR Service Worker loaded successfully');