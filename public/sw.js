const CACHE_VERSION = 'v103';
const STATIC_CACHE = `pitpulse-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `pitpulse-runtime-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline.html';

const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/logo.png',
  '/icon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable.png',
];

// Install Event
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

// Activate Event - PURGE ALL OLD CACHES
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

// Fetch Event - ALWAYS NETWORK-FIRST for all dashboard routes
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Always fetch fresh HTML & API for dashboard pages from server
  if (url.pathname.startsWith('/dashboard/')) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request).then((res) => res || caches.match(OFFLINE_URL)))
    );
    return;
  }

  // Generic assets
  event.respondWith(
    fetch(request).catch(() => caches.match(request).then((res) => res || caches.match(OFFLINE_URL)))
  );
});

// Push Notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    self.registration.showNotification(data.title || 'Pit Pulse Alert', {
      body: data.message || 'New update available.',
      icon: '/logo.png',
    });
  } catch {
    self.registration.showNotification('Pit Pulse Alert', {
      body: event.data.text(),
      icon: '/logo.png',
    });
  }
});
