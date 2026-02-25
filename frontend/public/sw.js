const CACHE_NAME = 'library-star-pro-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/icon-192.png',
  '/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Do not cache authentication paths or API calls
  if (
    url.pathname.startsWith('/auth') || 
    url.pathname.startsWith('/sso-callback') ||
    url.pathname.startsWith('/api') ||
    url.hostname.includes('clerk')
  ) {
    return;
  }

  // Network-First Strategy for everything else
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Optional: Update cache with the new version
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
