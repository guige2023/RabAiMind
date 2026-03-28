const CACHE_NAME = 'rabai-mind-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/robots.txt',
  '/sitemap.xml'
];

const isValidRequest = (request) => {
  try {
    const url = new URL(request.url);
    const validProtocols = ['http:', 'https:'];
    return validProtocols.includes(url.protocol);
  } catch {
    return false;
  }
};

const isCacheableResponse = (response, request) => {
  if (!response || response.status !== 200) return false;
  if (!isValidRequest(request)) return false;
  try {
    const url = new URL(request.url);
    if (url.protocol === 'chrome-extension:') return false;
    return true;
  } catch {
    return false;
  }
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  if (!isValidRequest(request)) return;

  if (url.pathname.startsWith('/api/')) return;

  if (url.origin === location.origin) {
    if (
      request.destination === 'style' ||
      request.destination === 'script' ||
      request.destination === 'image' ||
      request.destination === 'font'
    ) {
      event.respondWith(
        caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request).then((response) => {
            if (isCacheableResponse(response, request)) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return response;
          });
        })
      );
      return;
    }

    if (request.mode === 'navigate') {
      event.respondWith(
        fetch(request)
          .then((response) => {
            if (isCacheableResponse(response, request)) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return response;
          })
          .catch(() => {
            return caches.match(request).then((cachedResponse) => {
              return cachedResponse || caches.match('/');
            });
          })
      );
      return;
    }
  }

  if (!isValidRequest(request)) {
    event.respondWith(fetch(request));
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (isCacheableResponse(response, request)) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cachedResponse) => {
          return cachedResponse || new Response('Offline', { status: 503 });
        });
      })
  );
});
