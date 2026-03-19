// API Stability Pro - API稳定性专业版
import { ref, computed, onMounted } from 'vue'

export interface APIEndpoint {
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  timeout: number
  retryCount: number
  retryDelay: number
  circuitBreaker: {
    enabled: boolean
    threshold: number
    timeout: number
    resetTimeout: number
  }
}

export interface RequestRecord {
  id: string
  url: string
  method: string
  status: number
  duration: number
  timestamp: number
  error?: string
  retryCount: number
}

export interface HealthCheck {
  endpoint: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  latency: number
  lastCheck: number
  consecutiveFailures: number
}

export interface APIStatus {
  total: number
  success: number
  failure: number
  averageLatency: number
  uptime: number
}

export function useAPIStabilityPro() {
  // 端点配置
  const endpoints = ref<Map<string, APIEndpoint>>(new Map())

  // 请求记录
  const records = ref<RequestRecord[]>([])
  const maxRecords = 500

  // 健康检查
  const healthChecks = ref<HealthCheck[]>([])

  // 熔断器状态
  const circuitBreakers = ref<Map<string, {
    state: 'closed' | 'open' | 'half-open'
    failureCount: number
    lastFailure: number
    nextAttempt: number
  }>>(new Map())

  // 全局状态
  const globalStatus = ref<'stable' | 'degraded' | 'unstable'>('stable')

  // 自动重试配置
  const autoRetry = ref({
    enabled: true,
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
  })

  // 注册端点
  const registerEndpoint = (url: string, config?: Partial<APIEndpoint>) => {
    const defaultConfig: APIEndpoint = {
      url,
      method: 'GET',
      timeout: 10000,
      retryCount: 3,
      retryDelay: 1000,
      circuitBreaker: {
        enabled: true,
        threshold: 5,
        timeout: 30000,
        resetTimeout: 60000
      }
    }

    endpoints.value.set(url, { ...defaultConfig, ...config })
  }

  // 发送请求
  const request = async <T = any>(
    url: string,
    options?: RequestInit,
    config?: Partial<APIEndpoint>
  ): Promise<T> => {
    const endpoint = endpoints.value.get(url) || {
      ...config,
      timeout: config?.timeout || 10000,
      retryCount: config?.retryCount || 3,
      retryDelay: config?.retryDelay || 1000,
      circuitBreaker: config?.circuitBreaker || { enabled: true, threshold: 5, timeout: 30000, resetTimeout: 60000 }
    }

    // 检查熔断器
    const breaker = circuitBreakers.value.get(url)
    if (breaker && breaker.state === 'open') {
      if (Date.now() < breaker.nextAttempt) {
        throw new Error('Circuit breaker is open')
      }
      // 半开状态
      circuitBreakers.value.set(url, { ...breaker, state: 'half-open' })
    }

    let lastError: Error | null = null
    let attempts = 0
    const maxAttempts = endpoint.retryCount + 1

    while (attempts < maxAttempts) {
      attempts++

      try {
        const result = await fetchWithTimeout(url, options, endpoint.timeout)

        // 记录成功
        recordRequest({
          id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          url,
          method: options?.method || 'GET',
          status: result.status,
          duration: 0, // 简化
          timestamp: Date.now(),
          retryCount: attempts - 1
        })

        // 重置熔断器
        if (breaker) {
          circuitBreakers.value.set(url, {
            ...breaker,
            state: 'closed',
            failureCount: 0
          })
        }

        return result.json()
      } catch (error) {
        lastError = error as Error

        // 记录失败
        recordRequest({
          id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          url,
          method: options?.method || 'GET',
          status: 0,
          duration: 0,
          timestamp: Date.now(),
          error: (error as Error).message,
          retryCount: attempts - 1
        })

        // 更新熔断器
        updateCircuitBreaker(url)

        // 等待重试
        if (attempts < maxAttempts && autoRetry.value.enabled) {
          const delay = Math.min(
            autoRetry.value.baseDelay * Math.pow(autoRetry.value.backoffMultiplier, attempts - 1),
            autoRetry.value.maxDelay
          )
          await new Promise(r => setTimeout(r, delay))
        }
      }
    }

    throw lastError
  }

  // 超时请求
  const fetchWithTimeout = async (
    url: string,
    options?: RequestInit,
    timeout: number = 10000
  ): Promise<Response> => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      })
      return response
    } finally {
      clearTimeout(timeoutId)
    }
  }

  // 记录请求
  const recordRequest = (record: RequestRecord) => {
    records.value.push(record)

    if (records.value.length > maxRecords) {
      records.value.shift()
    }
  }

  // 更新熔断器
  const updateCircuitBreaker = (url: string) => {
    const breaker = circuitBreakers.value.get(url) || {
      state: 'closed',
      failureCount: 0,
      lastFailure: 0,
      nextAttempt: 0
    }

    breaker.failureCount++
    breaker.lastFailure = Date.now()

    const endpoint = endpoints.value.get(url)
    const threshold = endpoint?.circuitBreaker.threshold || 5

    if (breaker.failureCount >= threshold) {
      breaker.state = 'open'
      breaker.nextAttempt = Date.now() + (endpoint?.circuitBreaker.resetTimeout || 60000)
    }

    circuitBreakers.value.set(url, breaker)
  }

  // 健康检查
  const checkHealth = async (url: string): Promise<HealthCheck> => {
    const start = Date.now()

    try {
      await fetchWithTimeout(url, { method: 'HEAD' }, 5000)
      const latency = Date.now() - start

      const existing = healthChecks.value.find(h => h.endpoint === url)
      if (existing) {
        existing.status = latency < 1000 ? 'healthy' : 'degraded'
        existing.latency = latency
        existing.lastCheck = Date.now()
        existing.consecutiveFailures = 0
      }

      return {
        endpoint: url,
        status: latency < 1000 ? 'healthy' : 'degraded',
        latency,
        lastCheck: Date.now(),
        consecutiveFailures: 0
      }
    } catch {
      const existing = healthChecks.value.find(h => h.endpoint === url)
      if (existing) {
        existing.consecutiveFailures++
        existing.status = existing.consecutiveFailures >= 3 ? 'unhealthy' : 'degraded'
        existing.lastCheck = Date.now()
      }

      return {
        endpoint: url,
        status: 'unhealthy',
        latency: 0,
        lastCheck: Date.now(),
        consecutiveFailures: (existing?.consecutiveFailures || 0) + 1
      }
    }
  }

  // 批量健康检查
  const checkAllHealth = async () => {
    const urls = Array.from(endpoints.value.keys())
    const results = await Promise.all(urls.map(url => checkHealth(url)))
    healthChecks.value = results
    return results
  }

  // 获取统计
  const getStats = (): APIStatus => {
    const recent = records.value.slice(-100)

    const success = recent.filter(r => r.status >= 200 && r.status < 400).length
    const failure = recent.filter(r => r.status === 0 || r.status >= 400).length

    const totalDuration = recent.reduce((sum, r) => sum + r.duration, 0)
    const averageLatency = recent.length > 0 ? totalDuration / recent.length : 0

    const healthy = healthChecks.value.filter(h => h.status === 'healthy').length
    const uptime = healthChecks.value.length > 0 ? (healthy / healthChecks.value.length) * 100 : 100

    return {
      total: recent.length,
      success,
      failure,
      averageLatency: Math.round(averageLatency),
      uptime: Math.round(uptime)
    }
  }

  // 获取失败的请求
  const getFailedRequests = (count = 10) => {
    return records.value
      .filter(r => r.status === 0 || r.status >= 400)
      .slice(-count)
      .reverse()
  }

  // 获取慢请求
  const getSlowRequests = (threshold = 5000, count = 10) => {
    return records.value
      .filter(r => r.duration > threshold)
      .slice(-count)
      .reverse()
  }

  // 更新配置
  const updateConfig = (config: Partial<typeof autoRetry.value>) => {
    Object.assign(autoRetry.value, config)
  }

  // 统计
  const stats = computed(() => ({
    ...getStats(),
    endpoints: endpoints.value.size,
    records: records.value.length,
    healthChecks: healthChecks.value.length,
    healthy: healthChecks.value.filter(h => h.status === 'healthy').length,
    circuitBreakers: Array.from(circuitBreakers.value.entries()).map(([url, state]) => ({
      url,
      state: state.state,
      failures: state.failureCount
    }))
  }))

  return {
    // 端点
    endpoints,
    registerEndpoint,
    // 请求
    request,
    records,
    // 熔断器
    circuitBreakers,
    updateCircuitBreaker,
    // 健康检查
    healthChecks,
    checkHealth,
    checkAllHealth,
    // 配置
    autoRetry,
    updateConfig,
    // 统计
    getStats,
    getFailedRequests,
    getSlowRequests,
    // 状态
    globalStatus,
    // 统计
    stats
  }
}

export default useAPIStabilityPro
