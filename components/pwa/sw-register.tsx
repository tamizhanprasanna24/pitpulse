'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    // Flush stale caches & unregister legacy workers once for v104 update
    if (!localStorage.getItem('pitpulse_sw_v104_purged')) {
      if ('caches' in window) {
        caches.keys().then((keys) => {
          Promise.all(keys.map((key) => caches.delete(key)));
        });
      }
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
        localStorage.setItem('pitpulse_sw_v104_purged', 'true');
        window.location.reload();
      });
    }

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js');
        reg.update();
      } catch (err) {
        console.error('Service worker registration failed:', err);
      }
    };

    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register);
      return () => window.removeEventListener('load', register);
    }
  }, []);

  return null;
}
