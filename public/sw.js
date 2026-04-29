const CACHE_NAME = 'ggames-v3';

// Critical assets to pre-cache on install
const CRITICAL_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Install event - cache critical assets only
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching critical assets');
      return cache.addAll(CRITICAL_ASSETS).catch(err => {
        console.warn('[SW] Some assets failed to pre-cache:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up ALL old caches
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
  self.clients.claim();
});

// Fetch event - ONLY cache true static assets (images, fonts, icons)
// NEVER cache .js files — Next.js handles its own caching with hashes
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never cache API calls or navigation requests
  if (url.pathname.startsWith('/api/') || request.mode === 'navigate') {
    event.respondWith(fetch(request));
    return;
  }

  // Never cache POST/PUT/DELETE requests
  if (request.method !== 'GET') {
    event.respondWith(fetch(request));
    return;
  }

  // Only cache true static assets — NOT .js files
  const isStaticAsset =
    request.destination === 'image' ||
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
    url.pathname.endsWith('.woff');

  if (isStaticAsset) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // For everything else (HTML, JS, CSS) — always go to network
  // Next.js uses content hashes for cache busting, so the browser
  // will naturally cache unchanged files via standard HTTP caching
  event.respondWith(fetch(request));
});

// Cache-first strategy for static assets only
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Cache-first fetch failed:', request.url, error);
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

/* ═══════════════════════════════════════════════════════════════════════
   Push Notification Handlers
   ═══════════════════════════════════════════════════════════════════════ */

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
      actions: [
        { action: 'open', title: 'فتح' },
        { action: 'dismiss', title: 'إغلاق' },
      ],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/voice-rooms';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          if (client.url.includes(targetUrl)) return client.focus();
          return client.navigate(targetUrl).then(() => client.focus());
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
