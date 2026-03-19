// API Response Optimizer - API响应速度优化
import { ref, computed } from 'vue'

export interface APIRequest {
  id: string
  url: string
  method: string
  timestamp: number
  duration?: number
  status?: number
  success?: boolean
}

export interface APIConfig {
  timeout: number
  retries: number
  retryDelay: number
  enableCache: boolean
  enableCompression: boolean
}

export function useAPIResponseOptimizer() {
  // 配置
  const config = ref<APIConfig>({
    timeout: 30000,
    retries: 3,
    retryDelay: 1000,
    enableCache: true,
    enableCompression: true
  })

  // 请求历史
  const requestHistory = ref<APIRequest[]>([])

  // 性能统计
  const stats = ref({
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    cacheHitRate: 0
  })

  // 发送优化请求
  const fetch = async (
    url: string,
    options?: RequestInit
  ): Promise<Response> => {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const startTime = Date.now()

    // 构建请求
    const requestOptions: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(config.value.enableCompression ? { 'Accept-Encoding': 'gzip, deflate' } : {}),
        ...options?.headers
      }
    }

    try {
      const response = await Promise.race([
        fetch(url, requestOptions),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('请求超时')), config.value.timeout)
        )
      ])

      const duration = Date.now() - startTime

      // 记录请求
      requestHistory.value.push({
        id: requestId,
        url,
        method: options?.method || 'GET',
        timestamp: startTime,
        duration,
        status: response.status,
        success: response.ok
      })

      // 更新统计
      updateStats(duration, response.ok)

      // 限制历史
      if (requestHistory.value.length > 100) {
        requestHistory.value.shift()
      }

      return response
    } catch (error) {
      const duration = Date.now() - startTime

      requestHistory.value.push({
        id: requestId,
        url,
        method: options?.method || 'GET',
        timestamp: startTime,
        duration,
        success: false
      })

      stats.value.failedRequests++
      stats.value.totalRequests++

      throw error
    }
  }

  // 带重试的请求
  const fetchWithRetry = async (
    url: string,
    options?: RequestInit,
    retries = config.value.retries
  ): Promise<Response> => {
    let lastError: Error | null = null

    for (let i = 0; i < retries; i++) {
      try {
        return await fetch(url, options)
      } catch (error) {
        lastError = error as Error

        // 非网络错误不重试
        if (!error.message.includes('请求超时') && !error.message.includes('network')) {
          throw error
        }

        // 等待后重试
        if (i < retries - 1) {
          await new Promise(resolve =>
            setTimeout(resolve, config.value.retryDelay * (i + 1))
          )
        }
      }
    }

    throw lastError
  }

  // 智能请求（带缓存）
  const smartFetch = async (
    url: string,
    options?: RequestInit & { cacheKey?: string }
  ): Promise<Response> => {
    const cacheKey = options?.cacheKey || url

    // 检查缓存
    if (config.value.enableCache) {
      const cached = getCachedResponse(cacheKey)
      if (cached) {
        return cached
      }
    }

    // 发起请求
    const response = await fetch(url, options)

    // 缓存成功响应
    if (config.value.enableCache && response.ok) {
      cacheResponse(cacheKey, response.clone())
    }

    return response
  }

  // 简单缓存
  const responseCache = new Map<string, { response: Response; timestamp: number }>()
  const CACHE_TTL = 5 * 60 * 1000 // 5分钟

  const getCachedResponse = (key: string): Response | null => {
    const cached = responseCache.get(key)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.response
    }
    responseCache.delete(key)
    return null
  }

  const cacheResponse = (key: string, response: Response) => {
    responseCache.set(key, {
      response,
      timestamp: Date.now()
    })
  }

  // 更新统计
  const updateStats = (duration: number, success: boolean) => {
    stats.value.totalRequests++

    if (success) {
      stats.value.successfulRequests++
    } else {
      stats.value.failedRequests++
    }

    // 计算平均响应时间
    const total = stats.value.totalRequests
    stats.value.averageResponseTime = Math.round(
      (stats.value.averageResponseTime * (total - 1) + duration) / total
    )
  }

  // 获取性能报告
  const performanceReport = computed(() => ({
    total: stats.value.totalRequests,
    success: stats.value.successfulRequests,
    failed: stats.value.failedRequests,
    successRate: stats.value.totalRequests > 0
      ? Math.round((stats.value.successfulRequests / stats.value.totalRequests) * 100)
      : 0,
    avgResponseTime: stats.value.averageResponseTime,
    cacheHitRate: stats.value.cacheHitRate
  }))

  // 清除缓存
  const clearCache = () => {
    responseCache.clear()
  }

  // 更新配置
  const updateConfig = (updates: Partial<APIConfig>) => {
    config.value = { ...config.value, ...updates }
  }

  return {
    config,
    requestHistory,
    stats,
    fetch,
    fetchWithRetry,
    smartFetch,
    getCachedResponse,
    cacheResponse,
    clearCache,
    performanceReport,
    updateConfig
  }
}

export default useAPIResponseOptimizer
