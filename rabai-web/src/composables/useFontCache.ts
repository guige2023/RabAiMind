// Font Cache - 字体缓存管理
import { ref, computed } from 'vue'

export interface CachedFont {
  id: string
  fontFamily: string
  url: string
  format: string
  size: number
  loadedAt: number
  lastUsed: number
  useCount: number
  expiresAt?: number
}

export interface CacheConfig {
  maxSize: number // MB
  maxFonts: number
  ttl: number // milliseconds
  storageType: 'memory' | 'localStorage' | 'indexedDB'
  autoCleanup: boolean
  cleanupThreshold: number // 0-1
}

export interface CacheStats {
  totalFonts: number
  totalSize: number
  hitCount: number
  missCount: number
  evictionCount: number
}

export function useFontCache() {
  // 缓存的字体
  const cachedFonts = ref<CachedFont[]>([])

  // 缓存配置
  const config = ref<CacheConfig>({
    maxSize: 50, // 50MB
    maxFonts: 20,
    ttl: 7 * 24 * 60 * 60 * 1000, // 7天
    storageType: 'memory',
    autoCleanup: true,
    cleanupThreshold: 0.9
  })

  // 缓存统计
  const stats = ref<CacheStats>({
    totalFonts: 0,
    totalSize: 0,
    hitCount: 0,
    missCount: 0,
    evictionCount: 0
  })

  // 获取缓存大小
  const getCacheSize = (): number => {
    return cachedFonts.value.reduce((sum, font) => sum + font.size, 0)
  }

  // 获取缓存大小（MB）
  const getCacheSizeMB = (): number => {
    return getCacheSize() / (1024 * 1024)
  }

  // 检查是否已缓存
  const hasCached = (fontFamily: string): boolean => {
    return cachedFonts.value.some(f => f.fontFamily === fontFamily)
  }

  // 获取缓存的字体
  const getCachedFont = (fontFamily: string): CachedFont | undefined => {
    const font = cachedFonts.value.find(f => f.fontFamily === fontFamily)

    if (font) {
      // 检查是否过期
      if (font.expiresAt && font.expiresAt < Date.now()) {
        removeFromCache(fontFamily)
        stats.value.missCount++
        return undefined
      }

      // 更新使用信息
      font.lastUsed = Date.now()
      font.useCount++
      stats.value.hitCount++

      return font
    }

    stats.value.missCount++
    return undefined
  }

  // 添加到缓存
  const addToCache = async (font: Omit<CachedFont, 'id' | 'loadedAt' | 'lastUsed' | 'useCount'>): Promise<boolean> => {
    // 检查是否已存在
    if (hasCached(font.fontFamily)) {
      return true
    }

    // 检查大小限制
    if (getCacheSizeMB() + font.size / (1024 * 1024) > config.value.maxSize) {
      if (config.value.autoCleanup) {
        await cleanup()
      } else {
        return false
      }
    }

    // 检查数量限制
    if (cachedFonts.value.length >= config.value.maxFonts) {
      if (config.value.autoCleanup) {
        await cleanup()
      } else {
        return false
      }
    }

    const cachedFont: CachedFont = {
      ...font,
      id: `font_${Date.now()}`,
      loadedAt: Date.now(),
      lastUsed: Date.now(),
      useCount: 1,
      expiresAt: config.value.ttl ? Date.now() + config.value.ttl : undefined
    }

    cachedFonts.value.push(cachedFont)
    updateStats()

    return true
  }

  // 从缓存移除
  const removeFromCache = (fontFamily: string): boolean => {
    const index = cachedFonts.value.findIndex(f => f.fontFamily === fontFamily)
    if (index > -1) {
      cachedFonts.value.splice(index, 1)
      stats.value.evictionCount++
      updateStats()
      return true
    }
    return false
  }

  // 清空缓存
  const clearCache = () => {
    const count = cachedFonts.value.length
    cachedFonts.value = []
    stats.value.totalFonts = 0
    stats.value.totalSize = 0
    stats.value.evictionCount += count
  }

  // 清理过期/最少使用的字体
  const cleanup = async (): Promise<number> => {
    const now = Date.now()
    let freedCount = 0

    // 1. 移除过期的
    const expired = cachedFonts.value.filter(f => f.expiresAt && f.expiresAt < now)
    for (const font of expired) {
      removeFromCache(font.fontFamily)
      freedCount++
    }

    // 2. 如果还不够，移除最少使用的
    if (getCacheSizeMB() / config.value.maxSize > config.value.cleanupThreshold) {
      // 按使用次数和最后使用时间排序
      const sorted = [...cachedFonts.value].sort((a, b) => {
        const aScore = a.useCount / (now - a.lastUsed)
        const bScore = b.useCount / (now - b.lastUsed)
        return aScore - bScore
      })

      // 移除最不常用的，直到达到阈值
      while (getCacheSizeMB() / config.value.maxSize > 0.5 && sorted.length > 0) {
        const font = sorted.shift()
        if (font) {
          removeFromCache(font.fontFamily)
          freedCount++
        }
      }
    }

    return freedCount
  }

  // 更新统计
  const updateStats = () => {
    stats.value.totalFonts = cachedFonts.value.length
    stats.value.totalSize = getCacheSize()
  }

  // 获取命中率
  const getHitRate = (): number => {
    const total = stats.value.hitCount + stats.value.missCount
    return total > 0 ? (stats.value.hitCount / total * 100).toFixed(1) : 0
  }

  // 获取最少使用的字体
  const getLeastUsedFonts = (count: number): CachedFont[] => {
    return [...cachedFonts.value]
      .sort((a, b) => a.useCount - b.useCount)
      .slice(0, count)
  }

  // 获取最常使用的字体
  const getMostUsedFonts = (count: number): CachedFont[] => {
    return [...cachedFonts.value]
      .sort((a, b) => b.useCount - a.useCount)
      .slice(0, count)
  }

  // 获取最近的字体
  const getRecentFonts = (count: number): CachedFont[] => {
    return [...cachedFonts.value]
      .sort((a, b) => b.lastUsed - a.lastUsed)
      .slice(0, count)
  }

  // 获取即将过期的字体
  const getExpiringFonts = (days: number): CachedFont[] => {
    const threshold = Date.now() + days * 24 * 60 * 60 * 1000
    return cachedFonts.value.filter(f => f.expiresAt && f.expiresAt < threshold)
  }

  // 保存到localStorage
  const saveToStorage = (): boolean => {
    if (config.value.storageType !== 'localStorage') return false

    try {
      const data = JSON.stringify({
        fonts: cachedFonts.value,
        stats: stats.value,
        config: config.value
      })
      localStorage.setItem('font_cache', data)
      return true
    } catch {
      return false
    }
  }

  // 从localStorage加载
  const loadFromStorage = (): boolean => {
    if (config.value.storageType !== 'localStorage') return false

    try {
      const data = localStorage.getItem('font_cache')
      if (!data) return false

      const parsed = JSON.parse(data)
      cachedFonts.value = parsed.fonts || []
      stats.value = parsed.stats || stats.value
      return true
    } catch {
      return false
    }
  }

  // 预热缓存
  const warmCache = async (fonts: Array<{ fontFamily: string; url: string; format: string; size: number }>): Promise<number> => {
    let loaded = 0

    for (const font of fonts) {
      if (!hasCached(font.fontFamily)) {
        if (await addToCache(font)) {
          loaded++
        }
      }
    }

    return loaded
  }

  // 更新配置
  const updateConfig = (updates: Partial<CacheConfig>) => {
    Object.assign(config.value, updates)
  }

  // 统计信息
  const cacheStats = computed(() => ({
    ...stats.value,
    hitRate: getHitRate(),
    cacheSize: getCacheSizeMB(),
    maxSize: config.value.maxSize,
    usagePercent: (getCacheSizeMB() / config.value.maxSize * 100).toFixed(1)
  }))

  return {
    cachedFonts,
    config,
    stats,
    cacheStats,
    getCacheSize,
    getCacheSizeMB,
    hasCached,
    getCachedFont,
    addToCache,
    removeFromCache,
    clearCache,
    cleanup,
    updateStats,
    getHitRate,
    getLeastUsedFonts,
    getMostUsedFonts,
    getRecentFonts,
    getExpiringFonts,
    saveToStorage,
    loadFromStorage,
    warmCache,
    updateConfig
  }
}

export default useFontCache
