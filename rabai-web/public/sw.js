const CACHE_NAME = 'rabai-mind-v5';
const IMAGE_CACHE_NAME = 'rabai-mind-images-v1';
const OFFLINE_QUEUE_NAME = 'rabai-mind-offline-queue-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/robots.txt',
  '/sitemap.xml'
];

// Pending background sync registrations
const pendingSyncs = new Map();

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

// --- Background Sync: Queue offline requests ---
const queueOfflineRequest = async (requestData) => {
  const queue = await openQueueDB();
  return new Promise((resolve, reject) => {
    const tx = queue.transaction('pending', 'readwrite');
    const store = tx.objectStore('pending');
    const addReq = store.add(requestData);
    addReq.onsuccess = () => resolve(addReq.result);
    addReq.onerror = () => reject(addReq.error);
  });
};

const openQueueDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('rabai-mind-sw-db', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending')) {
        db.createObjectStore('pending', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
};

const getAllPendingRequests = async () => {
  const queue = await openQueueDB();
  return new Promise((resolve, reject) => {
    const tx = queue.transaction('pending', 'readonly');
    const store = tx.objectStore('pending');
    const getReq = store.getAll();
    getReq.onsuccess = () => resolve(getReq.result);
    getReq.onerror = () => reject(getReq.error);
  });
};

const removePendingRequest = async (id) => {
  const queue = await openQueueDB();
  return new Promise((resolve, reject) => {
    const tx = queue.transaction('pending', 'readwrite');
    const store = tx.objectStore('pending');
    const delReq = store.delete(id);
    delReq.onsuccess = () => resolve();
    delReq.onerror = () => reject(delReq.error);
  });
};

// Process queued offline requests
const processOfflineQueue = async () => {
  try {
    const pending = await getAllPendingRequests();
    console.log(`[SW] Processing ${pending.length} queued offline requests`);

    for (const item of pending) {
      try {
        const { method, url, headers, body } = item;
        const response = await fetch(new Request(url, {
          method,
          headers: new Headers(headers),
          body: body || undefined
        }));

        if (response.ok) {
          await removePendingRequest(item.id);
          // Notify clients of successful sync
          const clients = await self.clients.matchAll();
          clients.forEach(client => {
            client.postMessage({
              type: 'SYNC_SUCCESS',
              url,
              status: response.status,
              id: item.id
            });
          });
        }
      } catch (err) {
        console.log(`[SW] Retry failed for ${item.url}:`, err.message);
        // Keep in queue for next sync attempt
        break; // Stop on first failure, will retry on next sync
      }
    }
  } catch (err) {
    console.error('[SW] Error processing offline queue:', err);
  }
};

// --- Install event ---
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// --- Activate event ---
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

// --- Message handler ---
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};

  if (type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  if (type === 'TRIGGER_SYNC') {
    // Client triggered sync (e.g., back online)
    processOfflineQueue();
    return;
  }

  if (type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
    return;
  }

  if (type === 'SHOW_NOTIFICATION') {
    // Show push notification
    const { title, body, icon, tag, data } = payload || {};
    self.registration.showNotification(title || 'RabAi Mind', {
      body: body || '',
      icon: icon || '/icon-192.svg',
      tag: tag || 'rabai-notification',
      badge: '/icon-192.svg',
      data: data || {},
      requireInteraction: false,
      silent: false
    });
    return;
  }

  if (type === 'QUEUED_REQUEST') {
    // Queue a request for background sync
    queueOfflineRequest(payload).then((id) => {
      console.log(`[SW] Queued offline request: ${payload.url} (id: ${id})`);
      // Try background sync if available
      if ('sync' in self.registration) {
        self.registration.sync.register('process-offline-queue').catch(() => {
          // Background sync not available, will retry when triggered manually
        });
      }
    }).catch(err => console.error('[SW] Failed to queue request:', err));
    return;
  }
});

// --- Background Sync event ---
self.addEventListener('sync', (event) => {
  if (event.tag === 'process-offline-queue') {
    event.waitUntil(processOfflineQueue());
  }
});

// --- Fetch handler ---
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (!isValidRequest(request)) return;

  // Skip API calls - handle separately
  if (url.pathname.startsWith('/api/')) {
    // For GET API calls, try network first, cache fallback
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (isCacheableResponse(response, request)) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return new Response(JSON.stringify({ error: 'offline', cached: false }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            });
          });
        })
    );
    return;
  }

  // Cache images separately with size limit
  if (request.destination === 'image' && url.origin === location.origin) {
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          return fetch(request).then((response) => {
            if (isCacheableResponse(response, request)) {
              const contentLength = response.headers.get('content-length');
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

  // Cache static assets
  if (
    url.origin === location.origin &&
    (request.destination === 'style' ||
      request.destination === 'script' ||
      request.destination === 'font')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(request).then((response) => {
          if (isCacheableResponse(response, request)) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
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
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
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
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
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

// --- Push notification click handler ---
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const { data } = event.notification;
  const targetUrl = data?.taskId ? `/result?taskId=${data.taskId}` : '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Try to focus existing window
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.postMessage({ type: 'NOTIFICATION_CLICK', data });
          return;
        }
      }
      // Open new window
      return self.clients.openWindow(targetUrl);
    })
  );
});
