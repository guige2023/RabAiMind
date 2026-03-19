// useWeakMap.ts - WeakMap缓存模块
import { ref } from 'vue'

// 简单的缓存实现
export function useCache() {
  const cache = new Map<string, { value: any; expiry: number }>()

  const get = <T>(key: string): T | null => {
    const item = cache.get(key)
    if (!item) return null
    if (item.expiry && Date.now() > item.expiry) {
      cache.delete(key)
      return null
    }
    return item.value as T
  }

  const set = <T>(key: string, value: T, ttl?: number) => {
    cache.set(key, {
      value,
      expiry: ttl ? Date.now() + ttl : 0
    })
  }

  const has = (key: string): boolean => {
    const item = cache.get(key)
    if (!item) return false
    if (item.expiry && Date.now() > item.expiry) {
      cache.delete(key)
      return false
    }
    return true
  }

  const remove = (key: string) => cache.delete(key)

  const clear = () => cache.clear()

  const keys = () => Array.from(cache.keys())

  const size = () => cache.size

  return { cache, get, set, has, remove, clear, keys, size }
}

export default useCache
