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

// Cache key generators
export const cacheKeys = {
  taskStatus: (taskId: string) => `cache_task_${taskId}`,
  imageSearch: (query: string, page: number) => `cache_img_${query}_${page}`,
  userHistory: () => 'ppt_history',
  statistics: () => 'ppt_statistics'
}

export default { apiCache, storageCache, cacheKeys }
