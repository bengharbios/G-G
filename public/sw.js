const CACHE_NAME = 'ggames-v2';

// Critical assets to pre-cache on install
const CRITICAL_ASSETS = [
  '/',
  '/voice-rooms',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Install event - cache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching critical assets');
      return cache.addAll(CRITICAL_ASSETS);
    })
  );
  // Activate immediately without waiting for old service worker to finish
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  // Take control of all clients immediately
  self.clients.claim();
});

// Fetch event - cache-first for static, network-first for API
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Network-first for API calls
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Cache-first for static assets (images, CSS, JS, fonts)
  if (
    request.destination === 'image' ||
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font' ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/img/') ||
    url.pathname.startsWith('/sounds/') ||
    url.pathname.startsWith('/gifts/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.mp3') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js')
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Network-first for HTML pages
  event.respondWith(networkFirst(request));
});

// Cache-first strategy for static assets
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Cache-first fetch failed:', request.url, error);
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

// Network-first strategy for API calls and pages
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    console.log('[SW] Network-first fetch failed, no cache:', request.url, error);
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

/* ═══════════════════════════════════════════════════════════════════════
   Push Notification Handlers
   
   Handles incoming Web Push messages from the server.
   Displays native notifications with Arabic RTL support.
   ═══════════════════════════════════════════════════════════════════════ */

// Push notification event
self.addEventListener('push', (event) => {
  let data = {
    title: 'G-Games',
    body: 'لديك إشعار جديد!',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    tag: 'ggames-notification',
    dir: 'rtl',
    lang: 'ar',
    vibrate: [200, 100, 200, 100, 200],
    requireInteraction: false,
    data: {
      url: '/voice-rooms',
      timestamp: Date.now(),
    },
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = {
        ...data,
        title: parsed.title || data.title,
        body: parsed.body || data.body,
        icon: parsed.icon || data.icon,
        badge: parsed.badge || data.badge,
        tag: parsed.tag || data.tag,
        data: {
          url: parsed.data?.url || parsed.url || '/voice-rooms',
          type: parsed.data?.type || parsed.type,
          roomId: parsed.data?.roomId,
          fromUserId: parsed.data?.fromUserId,
          fromDisplayName: parsed.data?.fromDisplayName,
          timestamp: parsed.timestamp || Date.now(),
        },
      };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      tag: data.tag,
      dir: data.dir,
      lang: data.lang,
      data: data.data,
      vibrate: data.vibrate,
      requireInteraction: data.requireInteraction,
      // Android-specific actions
      actions: [
        { action: 'open', title: 'فتح' },
        { action: 'dismiss', title: 'إغلاق' },
      ],
    })
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Handle action buttons
  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/voice-rooms';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if ('focus' in client) {
          // If already on the target page, just focus
          if (client.url.includes(targetUrl)) {
            return client.focus();
          }
          // Otherwise navigate to target
          return client.navigate(targetUrl).then(() => client.focus());
        }
      }
      // Open new window if none exists
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
