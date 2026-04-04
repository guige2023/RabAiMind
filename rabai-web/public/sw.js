const CACHE_NAME = 'rabai-mind-v4';
const IMAGE_CACHE_NAME = 'rabai-mind-images-v1';
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
          .filter((name) => name !== CACHE_NAME && name !== IMAGE_CACHE_NAME)
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

  // Skip API calls - no caching
  if (url.pathname.startsWith('/api/')) return;

  // Cache images separately with size limit
  if (
    request.destination === 'image' &&
    url.origin === location.origin
  ) {
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request).then((response) => {
            if (isCacheableResponse(response, request)) {
              // Don't cache huge images (>2MB)
              const contentLength = response.headers.get('content-length')
              if (!contentLength || parseInt(contentLength, 10) < 2 * 1024 * 1024) {
                const responseClone = response.clone();
                cache.put(request, responseClone);
              }
            }
            return response;
          }).catch(() => {
            return new Response('', { status: 503 });
          });
        });
      })
    );
    return;
  }

  // Cache static assets (JS, CSS, fonts)
  if (
    url.origin === location.origin &&
    (request.destination === 'style' ||
      request.destination === 'script' ||
      request.destination === 'font')
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

  // Navigation requests - network first, fallback to cache
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

  // Default: try network, fall back to cache
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
