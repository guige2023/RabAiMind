// API Response Optimizer Advanced - API响应优化高级版
import { ref, computed, watch } from 'vue'

export interface ResponseCache {
  key: string
  data: any
  timestamp: number
  expiresAt: number
  size: number
  hitCount: number
}

export interface RequestQueue {
  id: string
  url: string
  method: string
  priority: number
  timestamp: number
  retries: number
  resolve: (value: any) => void
  reject: (error: any) => void
}

export interface ResponseMetrics {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  cacheHitRate: number
  totalDataTransferred: number
}

export type OptimizationStrategy = 'cache-first' | 'network-first' | 'stale-while-revalidate' | 'cache-only' | 'network-only'

export interface APIEndpointConfig {
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  strategy: OptimizationStrategy
  cacheDuration: number
  retryCount: number
  timeout: number
  enabled: boolean
}

export function useAPIResponseOptimizerAdvanced() {
  // 响应缓存
  const cache = ref<ResponseCache[]>([])
  const maxCacheSize = 50
  const maxCacheAge = 30 * 60 * 1000 // 30分钟

  // 请求队列
  const requestQueue = ref<RequestQueue[]>([])
  const maxConcurrentRequests = 6
  const activeRequests = ref(0)

  // 端点配置
  const endpointConfigs = ref<Map<string, APIEndpointConfig>>(new Map())

  // 性能指标
  const metrics = ref<ResponseMetrics>({
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    cacheHitRate: 0,
    totalDataTransferred: 0
  })

  // 响应时间历史
  const responseTimes = ref<number[]>([])
  const maxHistorySize = 100

  // 配置端点
  const configureEndpoint = (url: string, config: Partial<APIEndpointConfig>) => {
    const defaultConfig: APIEndpointConfig = {
      url,
      method: 'GET',
      strategy: 'cache-first',
      cacheDuration: 5 * 60 * 1000,
      retryCount: 3,
      timeout: 10000,
      enabled: true
    }

    endpointConfigs.value.set(url, { ...defaultConfig, ...config })
  }

  // 获取缓存
  const getCached = (key: string): any | null => {
    const cached = cache.value.find(c => c.key === key)
    if (!cached) return null

    if (Date.now() > cached.expiresAt) {
      removeCache(key)
      return null
    }

    cached.hitCount++
    return cached.data
  }

  // 设置缓存
  const setCache = (key: string, data: any, duration?: number) => {
    const existingIndex = cache.value.findIndex(c => c.key === key)
    const size = JSON.stringify(data).length
    const expiresAt = Date.now() + (duration || maxCacheAge)

    const cachedItem: ResponseCache = {
      key,
      data,
      timestamp: Date.now(),
      expiresAt,
      size,
      hitCount: 0
    }

    if (existingIndex > -1) {
      cache.value[existingIndex] = cachedItem
    } else {
      cache.value.push(cachedItem)

      // 清理旧缓存
      if (cache.value.length > maxCacheSize) {
        cache.value.sort((a, b) => b.hitCount - a.hitCount)
        cache.value.pop()
      }
    }
  }

  // 移除缓存
  const removeCache = (key: string) => {
    const index = cache.value.findIndex(c => c.key === key)
    if (index > -1) {
      cache.value.splice(index, 1)
    }
  }

  // 清空缓存
  const clearCache = () => {
    cache.value = []
  }

  // 生成缓存key
  const generateCacheKey = (url: string, params?: Record<string, any>): string => {
    if (!params) return url
    const sortedParams = Object.keys(params).sort().reduce((acc, key) => {
      acc[key] = params[key]
      return acc
    }, {} as Record<string, any>)
    return `${url}?${JSON.stringify(sortedParams)}`
  }

  // 智能请求
  const smartRequest = async <T>(
    url: string,
    options?: RequestInit,
    strategy?: OptimizationStrategy
  ): Promise<T> => {
    const startTime = Date.now()
    const config = endpointConfigs.value.get(url)
    const finalStrategy = strategy || config?.strategy || 'cache-first'
    const cacheKey = generateCacheKey(url, options?.body as any)

    metrics.value.totalRequests++

    // Cache-first 策略
    if (finalStrategy === 'cache-first') {
      const cached = getCached(cacheKey)
      if (cached) {
        metrics.value.cacheHitRate = (metrics.value.cacheHitRate * 0.9) + 10
        return cached
      }
    }

    // Stale-while-revalidate 策略
    if (finalStrategy === 'stale-while-revalidate') {
      const cached = getCached(cacheKey)
      if (cached) {
        // 返回缓存同时后台更新
        fetchAndCache(url, options, cacheKey).catch(console.error)
        return cached
      }
    }

    return fetchAndCache(url, options, cacheKey, startTime) as Promise<T>
  }

  // 获取并缓存
  const fetchAndCache = async (
    url: string,
    options?: RequestInit,
    cacheKey?: string,
    startTime?: number
  ): Promise<any> => {
    const config = endpointConfigs.value.get(url)
    const timeout = config?.timeout || 10000
    const retryCount = config?.retryCount || 3

    let lastError: Error | null = null

    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        const responseTime = Date.now() - (startTime || Date.now())

        // 更新指标
        recordResponseTime(responseTime)
        metrics.value.successfulRequests++
        metrics.value.totalDataTransferred += JSON.stringify(data).length

        // 缓存响应
        if (cacheKey && config?.strategy !== 'network-only') {
          setCache(cacheKey, data, config?.cacheDuration)
        }

        return data
      } catch (error) {
        lastError = error as Error
        if (attempt < retryCount) {
          await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 500))
        }
      }
    }

    metrics.value.failedRequests++
    throw lastError
  }

  // 记录响应时间
  const recordResponseTime = (time: number) => {
    responseTimes.value.push(time)
    if (responseTimes.value.length > maxHistorySize) {
      responseTimes.value.shift()
    }

    // 计算平均响应时间
    const sum = responseTimes.value.reduce((a, b) => a + b, 0)
    metrics.value.averageResponseTime = sum / responseTimes.value.length
  }

  // 请求去重
  const deduplicateRequest = async (
    key: string,
    requestFn: () => Promise<any>
  ): Promise<any> => {
    const existing = requestQueue.value.find(r => r.id === key)
    if (existing) {
      return new Promise((resolve, reject) => {
        existing.resolve = resolve
        existing.reject = reject
      })
    }

    const promise = new Promise((resolve, reject) => {
      requestQueue.value.push({
        id: key,
        url: key,
        method: 'GET',
        priority: 5,
        timestamp: Date.now(),
        retries: 0,
        resolve,
        reject
      })
      processQueue()
    })

    try {
      const result = await requestFn()
      const queued = requestQueue.value.find(r => r.id === key)
      if (queued) queued.resolve(result)
      return result
    } catch (error) {
      const queued = requestQueue.value.find(r => r.id === key)
      if (queued) queued.reject(error)
      throw error
    } finally {
      const index = requestQueue.value.findIndex(r => r.id === key)
      if (index > -1) requestQueue.value.splice(index, 1)
    }
  }

  // 处理队列
  const processQueue = async () => {
    while (activeRequests.value < maxConcurrentRequests && requestQueue.value.length > 0) {
      const request = requestQueue.value.shift()
      if (!request) break

      activeRequests.value++
      try {
        await fetch(request.url)
      } catch (error) {
        request.reject(error)
      } finally {
        activeRequests.value--
        processQueue()
      }
    }
  }

  // 批量请求
  const batchRequests = async <T>(
    requests: Array<{ url: string; options?: RequestInit }>
  ): Promise<T[]> => {
    const results = await Promise.allSettled(
      requests.map(r => smartRequest(r.url, r.options))
    )

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value
      }
      console.error(`Request ${index} failed:`, result.reason)
      return null
    })
  }

  // 预加载数据
  const preloadData = (urls: string[]) => {
    urls.forEach(url => {
      const cacheKey = generateCacheKey(url)
      if (!getCached(cacheKey)) {
        smartRequest(url).catch(console.error)
      }
    })
  }

  // 统计
  const stats = computed(() => ({
    cacheSize: cache.value.length,
    cacheItems: cache.value.map(c => ({ key: c.key, hitCount: c.hitCount, size: c.size })),
    queueLength: requestQueue.value.length,
    activeRequests: activeRequests.value,
    endpoints: endpointConfigs.value.size,
    ...metrics.value,
    averageResponseTime: Math.round(metrics.value.averageResponseTime),
    cacheHitRate: Math.round(metrics.value.cacheHitRate * 10) / 10
  }))

  return {
    // 缓存
    cache,
    getCached,
    setCache,
    removeCache,
    clearCache,
    generateCacheKey,
    // 请求
    smartRequest,
    deduplicateRequest,
    batchRequests,
    preloadData,
    // 配置
    endpointConfigs,
    configureEndpoint,
    // 队列
    requestQueue,
    activeRequests,
    processQueue,
    // 指标
    metrics,
    responseTimes,
    recordResponseTime,
    // 统计
    stats
  }
}

export default useAPIResponseOptimizerAdvanced
