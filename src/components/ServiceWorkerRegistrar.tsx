/* ═══════════════════════════════════════════════════════════════════════
   ServiceWorkerRegistrar — Registers the Service Worker on mount

   This component ensures the service worker is registered when the
   user visits any page. The service worker handles:
   - Caching for offline support
   - Push notification reception
   ═══════════════════════════════════════════════════════════════════════ */

'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('[SW] Service Worker registered:', registration.scope);

        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000); // Check every hour
      })
      .catch((error) => {
        console.warn('[SW] Service Worker registration failed:', error);
      });
  }, []);

  return null;
}
