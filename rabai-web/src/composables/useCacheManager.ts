// Cache Manager - 缓存管理系统
import { ref, computed } from 'vue'

export interface CacheEntry<T = any> {
  key: string
  value: T
  timestamp: number
  expiresAt: number
  size: number
  hitCount: number
}

export interface CacheConfig {
  maxSize: number
  defaultTTL: number
  enableAutoCleanup: boolean
  cleanupInterval: number
}

export function useCacheManager() {
  // 配置
  const config = ref<CacheConfig>({
    maxSize: 50 * 1024 * 1024, // 50MB
    defaultTTL: 5 * 60 * 1000, // 5分钟
    enableAutoCleanup: true,
    cleanupInterval: 60 * 1000 // 1分钟
  })

  // 缓存存储
  const cache = ref<Map<string, CacheEntry>>(new Map())

  // 缓存统计
  const stats = ref({
    hits: 0,
    misses: 0,
    size: 0,
    entries: 0
  })

  // 设置缓存
  const set = <T>(key: string, value: T, ttl?: number): void => {
    const now = Date.now()
    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: now,
      expiresAt: now + (ttl || config.value.defaultTTL),
      size: JSON.stringify(value).length,
      hitCount: 0
    }

    // 检查大小
    const newSize = stats.value.size + entry.size
    if (newSize > config.value.maxSize) {
      cleanup()
    }

    cache.value.set(key, entry as CacheEntry)
    stats.value.size = newSize
    stats.value.entries = cache.value.size
  }

  // 获取缓存
  const get = <T>(key: string): T | null => {
    const entry = cache.value.get(key) as CacheEntry<T> | undefined

    if (!entry) {
      stats.value.misses++
      return null
    }

    // 检查过期
    if (Date.now() > entry.expiresAt) {
      cache.value.delete(key)
      stats.value.size -= entry.size
      stats.value.entries = cache.value.size
      stats.value.misses++
      return null
    }

    // 更新命中统计
    entry.hitCount++
    stats.value.hits++

    return entry.value
  }

  // 检查是否存在
  const has = (key: string): boolean => {
    const entry = cache.value.get(key)
    if (!entry) return false

    // 检查过期
    if (Date.now() > entry.expiresAt) {
      cache.value.delete(key)
      return false
    }

    return true
  }

  // 删除缓存
  const remove = (key: string): boolean => {
    const entry = cache.value.get(key)
    if (entry) {
      cache.value.delete(key)
      stats.value.size -= entry.size
      stats.value.entries = cache.value.size
      return true
    }
    return false
  }

  // 清空缓存
  const clear = (): void => {
    cache.value.clear()
    stats.value = { hits: 0, misses: 0, size: 0, entries: 0 }
  }

  // 清理过期缓存
  const cleanup = (): void => {
    const now = Date.now()
    let removedSize = 0

    for (const [key, entry] of cache.value.entries()) {
      if (now > entry.expiresAt) {
        cache.value.delete(key)
        removedSize += entry.size
      }
    }

    // 如果仍然过大，删除最少使用的
    while (stats.value.size > config.value.maxSize * 0.8 && cache.value.size > 0) {
      let oldestKey: string | null = null
      let oldestHitCount = Infinity

      for (const [key, entry] of cache.value.entries()) {
        if (entry.hitCount < oldestHitCount) {
          oldestHitCount = entry.hitCount
          oldestKey = key
        }
      }

      if (oldestKey) {
        const entry = cache.value.get(oldestKey)!
        cache.value.delete(oldestKey)
        removedSize += entry.size
      }
    }

    stats.value.size -= removedSize
    stats.value.entries = cache.value.size
  }

  // 获取统计
  const cacheStats = computed(() => ({
    hits: stats.value.hits,
    misses: stats.value.misses,
    total: stats.value.hits + stats.value.misses,
    hitRate: (stats.value.hits + stats.value.misses) > 0
      ? Math.round((stats.value.hits / (stats.value.hits + stats.value.misses)) * 100)
      : 0,
    size: stats.value.size,
    entries: stats.value.entries,
    maxSize: config.value.maxSize
  }))

  // 获取所有键
  const keys = (): string[] => {
    return Array.from(cache.value.keys())
  }

  // 获取过期的键
  const expiredKeys = (): string[] => {
    const now = Date.now()
    return Array.from(cache.value.entries())
      .filter(([, entry]) => now > entry.expiresAt)
      .map(([key]) => key)
  }

  // 设置配置
  const updateConfig = (updates: Partial<CacheConfig>) => {
    config.value = { ...config.value, ...updates }
  }

  // 初始化自动清理
  let cleanupTimer: ReturnType<typeof setInterval> | null = null

  const initAutoCleanup = () => {
    if (config.value.enableAutoCleanup && !cleanupTimer) {
      cleanupTimer = setInterval(cleanup, config.value.cleanupInterval)
    }
  }

  const stopAutoCleanup = () => {
    if (cleanupTimer) {
      clearInterval(cleanupTimer)
      cleanupTimer = null
    }
  }

  return {
    config,
    cache,
    stats,
    set,
    get,
    has,
    remove,
    clear,
    cleanup,
    cacheStats,
    keys,
    expiredKeys,
    updateConfig,
    initAutoCleanup,
    stopAutoCleanup
  }
}

export default useCacheManager
