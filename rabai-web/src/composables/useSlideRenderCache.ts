/**
 * useSlideRenderCache - Render caching for unchanged slides
 * Caches rendered slide images to avoid re-rendering unchanged slides
 */
import { ref, computed } from 'vue'
import { performanceProfiler } from './usePerformanceProfiler'

export interface CachedSlide {
  url: string
  timestamp: number
  size: number  // approximate size in bytes
}

const MAX_CACHE_SIZE = 50  // max cached slides
const CACHE_TTL = 30 * 60 * 1000  // 30 minutes TTL

class SlideRenderCache {
  private cache = new Map<string, CachedSlide>()
  private accessOrder: string[] = []  // LRU tracking

  // Generate cache key from slide data
  generateKey(taskId: string, slideNum: number, slideData: any): string {
    const contentHash = JSON.stringify(slideData || {})
    return `slide:${taskId}:${slideNum}:${this.hashString(contentHash)}`
  }

  // Simple string hash
  private hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(36)
  }

  // Get cached slide
  get(key: string): CachedSlide | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    // Check TTL
    if (Date.now() - cached.timestamp > CACHE_TTL) {
      this.cache.delete(key)
      this.accessOrder = this.accessOrder.filter(k => k !== key)
      return null
    }

    // Update LRU order
    this.accessOrder = this.accessOrder.filter(k => k !== key)
    this.accessOrder.push(key)

    return cached
  }

  // Check if key exists and is valid (for quick lookups)
  has(key: string): boolean {
    return this.get(key) !== null
  }

  // Set cached slide
  set(key: string, url: string, size: number = 0): void {
    // Evict if at capacity
    if (this.cache.size >= MAX_CACHE_SIZE && !this.cache.has(key)) {
      const oldestKey = this.accessOrder.shift()
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }

    this.cache.set(key, {
      url,
      timestamp: Date.now(),
      size
    })

    // Update LRU order
    this.accessOrder = this.accessOrder.filter(k => k !== key)
    this.accessOrder.push(key)
  }

  // Invalidate specific slide
  invalidate(key: string): void {
    this.cache.delete(key)
    this.accessOrder = this.accessOrder.filter(k => k !== key)
  }

  // Invalidate all slides for a task
  invalidateTask(taskId: string): void {
    const keysToDelete: string[] = []
    this.cache.forEach((_, key) => {
      if (key.startsWith(`slide:${taskId}:`)) {
        keysToDelete.push(key)
      }
    })
    keysToDelete.forEach(key => {
      this.cache.delete(key)
      this.accessOrder = this.accessOrder.filter(k => k !== key)
    })
  }

  // Clear all cache
  clear(): void {
    this.cache.clear()
    this.accessOrder = []
  }

  // Get cache stats
  getStats() {
    return {
      size: this.cache.size,
      maxSize: MAX_CACHE_SIZE,
      keys: Array.from(this.cache.keys()),
      oldestEntry: this.cache.size > 0 ? Math.min(...Array.from(this.cache.values()).map(c => c.timestamp)) : null,
      newestEntry: this.cache.size > 0 ? Math.max(...Array.from(this.cache.values()).map(c => c.timestamp)) : null
    }
  }
}

// Singleton instance
export const slideRenderCache = new SlideRenderCache()

// Vue composable wrapper
export function useSlideRenderCache() {
  const isEnabled = ref(true)
  const cacheStats = computed(() => slideRenderCache.getStats())

  // Get cached slide URL if available
  const getCached = (taskId: string, slideNum: number, slideData: any): string | null => {
    if (!isEnabled.value) return null
    const key = slideRenderCache.generateKey(taskId, slideNum, slideData)
    const cached = slideRenderCache.get(key)
    return cached?.url ?? null
  }

  // Cache a rendered slide
  const setCached = (taskId: string, slideNum: number, slideData: any, url: string, size: number = 0): void => {
    if (!isEnabled.value) return
    const key = slideRenderCache.generateKey(taskId, slideNum, slideData)
    slideRenderCache.set(key, url, size)
  }

  // Check if slide is cached
  const hasCached = (taskId: string, slideNum: number, slideData: any): boolean => {
    if (!isEnabled.value) return false
    const key = slideRenderCache.generateKey(taskId, slideNum, slideData)
    return slideRenderCache.has(key)
  }

  // Invalidate slide cache
  const invalidate = (taskId: string, slideNum?: number): void => {
    if (slideNum !== undefined) {
      const key = slideRenderCache.generateKey(taskId, slideNum, null)
      slideRenderCache.invalidate(key)
    } else {
      slideRenderCache.invalidateTask(taskId)
    }
  }

  // Clear all caches
  const clear = (): void => {
    slideRenderCache.clear()
  }

  // Toggle cache
  const toggle = (): void => {
    isEnabled.value = !isEnabled.value
  }

  return {
    isEnabled,
    cacheStats,
    getCached,
    setCached,
    hasCached,
    invalidate,
    clear,
    toggle
  }
}

export default useSlideRenderCache
