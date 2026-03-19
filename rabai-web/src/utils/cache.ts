// Memory cache with TTL support
class MemoryCache<T> {
  private cache = new Map<string, { value: T; expiry: number }>()

  set(key: string, value: T, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl
    })
  }

  get(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return null
    }

    return item.value
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // Cleanup expired items
  cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key)
      }
    }
  }
}

// Create cache instance
export const apiCache = new MemoryCache<any>()

// Cleanup cache every 5 minutes
setInterval(() => {
  apiCache.cleanup()
}, 5 * 60 * 1000)

// LocalStorage cache wrapper
export const storageCache = {
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key)
      if (!item) return null

      const { value, expiry } = JSON.parse(item)
      if (expiry && Date.now() > expiry) {
        localStorage.removeItem(key)
        return null
      }

      return value
    } catch {
      return null
    }
  },

  set<T>(key: string, value: T, ttl?: number): void {
    try {
      const item = {
        value,
        expiry: ttl ? Date.now() + ttl : null
      }
      localStorage.setItem(key, JSON.stringify(item))
    } catch {
      // Ignore quota errors
    }
  },

  delete(key: string): void {
    localStorage.removeItem(key)
  },

  clear(): void {
    // Only clear app-related keys
    const keys = Object.keys(localStorage)
    keys.forEach((key) => {
      if (key.startsWith('ppt_') || key.startsWith('cache_')) {
        localStorage.removeItem(key)
      }
    })
  }
}

// IndexedDB for larger data storage
const DB_NAME = 'rabai-mind-cache'
const DB_VERSION = 1

class IndexedDBCache {
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' })
        }
      }
    })
  }

  private async getDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init()
    }
    return this.db!
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const db = await this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('cache', 'readwrite')
      const store = transaction.objectStore('cache')
      const request = store.put({
        key,
        value,
        expiry: ttl ? Date.now() + ttl : null
      })
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async get<T>(key: string): Promise<T | null> {
    const db = await this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('cache', 'readonly')
      const store = transaction.objectStore('cache')
      const request = store.get(key)

      request.onsuccess = () => {
        const result = request.result
        if (!result) {
          resolve(null)
          return
        }

        if (result.expiry && Date.now() > result.expiry) {
          this.delete(key)
          resolve(null)
          return
        }

        resolve(result.value as T)
      }

      request.onerror = () => reject(request.error)
    })
  }

  async delete(key: string): Promise<void> {
    const db = await this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('cache', 'readwrite')
      const store = transaction.objectStore('cache')
      const request = store.delete(key)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async clear(): Promise<void> {
    const db = await this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('cache', 'readwrite')
      const store = transaction.objectStore('cache')
      const request = store.clear()
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
}

// Create IndexedDB cache instance
export const indexedDBCache = new IndexedDBCache()

// Initialize IndexedDB on load
indexedDBCache.init().catch(console.error)

// Cache key generators
export const cacheKeys = {
  taskStatus: (taskId: string) => `cache_task_${taskId}`,
  imageSearch: (query: string, page: number) => `cache_img_${query}_${page}`,
  userHistory: () => 'ppt_history',
  statistics: () => 'ppt_statistics'
}

export default { apiCache, storageCache, indexedDBCache, cacheKeys }
