/* Ledger service worker — app shell cache, network-first for Supabase */
const CACHE = 'ledger-v1.0.2';
const SHELL = [
  './', './index.html', './styles.css', './app.js',
  './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const { request } = e;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // never cache the sync backend or fonts API responses we can't version
  if (url.pathname.includes('/rest/v1/')) return;

  e.respondWith(
    caches.match(request).then(hit => {
      if (hit) {
        // refresh in background so the shell stays current
        fetch(request).then(res => {
          if (res && res.status === 200) caches.open(CACHE).then(c => c.put(request, res.clone()));
        }).catch(() => {});
        return hit;
      }
      return fetch(request).then(res => {
        if (res && res.status === 200 && (url.origin === location.origin || url.host.includes('fonts.g'))) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(request, copy));
        }
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
