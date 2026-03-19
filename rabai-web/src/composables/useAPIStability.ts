// API Stability Optimizer - API稳定性优化
import { ref, computed } from 'vue'

export type RetryStrategy = 'none' | 'linear' | 'exponential' | 'fibonacci'

export interface APIConfig {
  baseURL: string
  timeout: number
  retryCount: number
  retryDelay: number
  retryStrategy: RetryStrategy
  enableCircuitBreaker: boolean
  circuitBreakerThreshold: number
  circuitBreakerTimeout: number
  enableCaching: boolean
  cacheDuration: number
}

export interface APIError {
  code: string
  message: string
  status: number
  timestamp: number
  retryable: boolean
}

export interface RequestMetrics {
  totalRequests: number
  successCount: number
  errorCount: number
  averageResponseTime: number
  lastRequestTime: number
}

export interface CircuitBreakerState {
  status: 'closed' | 'open' | 'half-open'
  failureCount: number
  successCount: number
  lastFailureTime: number
  nextAttemptTime: number
}

const defaultConfig: APIConfig = {
  baseURL: '/api',
  timeout: 30000,
  retryCount: 3,
  retryDelay: 1000,
  retryStrategy: 'exponential',
  enableCircuitBreaker: true,
  circuitBreakerThreshold: 5,
  circuitBreakerTimeout: 60000,
  enableCaching: true,
  cacheDuration: 300000
}

export function useAPIStability() {
  // 配置
  const config = ref<APIConfig>({ ...defaultConfig })

  // 熔断器状态
  const circuitBreaker = ref<CircuitBreakerState>({
    status: 'closed',
    failureCount: 0,
    successCount: 0,
    lastFailureTime: 0,
    nextAttemptTime: 0
  })

  // 请求缓存
  const requestCache = ref<Map<string, { data: any; timestamp: number }>>(new Map())

  // 请求队列
  const requestQueue = ref<Array<{
    id: string
    request: () => Promise<any>
    resolve: (value: any) => void
    reject: (error: any) => void
    retries: number
  }>>([])

  // 指标
  const metrics = ref<RequestMetrics>({
    totalRequests: 0,
    successCount: 0,
    errorCount: 0,
    averageResponseTime: 0,
    lastRequestTime: 0
  })

  // 错误历史
  const errorHistory = ref<APIError[]>([])

  // 计算重试延迟
  const calculateRetryDelay = (attempt: number): number => {
    const baseDelay = config.value.retryDelay

    switch (config.value.retryStrategy) {
      case 'linear':
        return baseDelay * attempt
      case 'exponential':
        return baseDelay * Math.pow(2, attempt - 1)
      case 'fibonacci':
        const fib = [1, 1, 2, 3, 5, 8, 13]
        return baseDelay * (fib[Math.min(attempt, fib.length - 1)] || 1)
      default:
        return baseDelay
    }
  }

  // 检查是否应该重试
  const shouldRetry = (error: APIError, attempt: number): boolean => {
    if (attempt >= config.value.retryCount) return false
    if (!error.retryable) return false
    if (circuitBreaker.value.status === 'open') return false
    return true
  }

  // 记录成功
  const recordSuccess = () => {
    metrics.value.totalRequests++
    metrics.value.successCount++
    metrics.value.lastRequestTime = Date.now()

    // 重置熔断器
    if (circuitBreaker.value.status === 'half-open') {
      circuitBreaker.value.successCount++
      if (circuitBreaker.value.successCount >= 2) {
        circuitBreaker.value.status = 'closed'
        circuitBreaker.value.failureCount = 0
        circuitBreaker.value.successCount = 0
      }
    }
  }

  // 记录失败
  const recordFailure = (error: APIError) => {
    metrics.value.totalRequests++
    metrics.value.errorCount++
    metrics.value.lastRequestTime = Date.now()

    // 记录错误
    errorHistory.value.push(error)
    if (errorHistory.value.length > 50) {
      errorHistory.value.shift()
    }

    // 更新熔断器
    if (config.value.enableCircuitBreaker) {
      circuitBreaker.value.failureCount++
      circuitBreaker.value.lastFailureTime = Date.now()

      if (circuitBreaker.value.status === 'closed') {
        if (circuitBreaker.value.failureCount >= config.value.circuitBreakerThreshold) {
          circuitBreaker.value.status = 'open'
          circuitBreaker.value.nextAttemptTime = Date.now() + config.value.circuitBreakerTimeout
        }
      } else if (circuitBreaker.value.status === 'open') {
        if (Date.now() >= circuitBreaker.value.nextAttemptTime) {
          circuitBreaker.value.status = 'half-open'
          circuitBreaker.value.successCount = 0
        }
      }
    }
  }

  // 创建带重试的请求
  const fetchWithRetry = async <T>(
    requestFn: () => Promise<T>,
    cacheKey?: string
  ): Promise<T> => {
    // 检查缓存
    if (cacheKey && config.value.enableCaching) {
      const cached = requestCache.value.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < config.value.cacheDuration) {
        return cached.data
      }
    }

    // 检查熔断器
    if (circuitBreaker.value.status === 'open') {
      if (Date.now() < circuitBreaker.value.nextAttemptTime) {
        throw new Error('Circuit breaker is open')
      }
      circuitBreaker.value.status = 'half-open'
    }

    let attempt = 0
    let lastError: APIError | null = null

    while (attempt < config.value.retryCount) {
      attempt++

      try {
        const startTime = performance.now()
        const result = await Promise.race([
          requestFn(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), config.value.timeout)
          )
        ])

        const responseTime = performance.now() - startTime
        metrics.value.averageResponseTime =
          (metrics.value.averageResponseTime * (metrics.value.successCount) + responseTime) /
          (metrics.value.successCount + 1)

        recordSuccess()

        // 保存到缓存
        if (cacheKey && config.value.enableCaching) {
          requestCache.value.set(cacheKey, { data: result, timestamp: Date.now() })
        }

        return result
      } catch (error: any) {
        const apiError: APIError = {
          code: error.code || 'UNKNOWN',
          message: error.message || 'Unknown error',
          status: error.status || 0,
          timestamp: Date.now(),
          retryable: isRetryableError(error)
        }

        lastError = apiError

        if (!shouldRetry(apiError, attempt)) {
          recordFailure(apiError)
          throw error
        }

        // 等待后重试
        const delay = calculateRetryDelay(attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    if (lastError) {
      recordFailure(lastError)
    }

    throw new Error('Max retries reached')
  }

  // 判断是否可重试
  const isRetryableError = (error: any): boolean => {
    if (!error.status) return true // 网络错误
    // 5xx错误和429可重试
    return error.status >= 500 || error.status === 429
  }

  // 清空缓存
  const clearCache = () => {
    requestCache.value.clear()
  }

  // 重置熔断器
  const resetCircuitBreaker = () => {
    circuitBreaker.value = {
      status: 'closed',
      failureCount: 0,
      successCount: 0,
      lastFailureTime: 0,
      nextAttemptTime: 0
    }
  }

  // 重置指标
  const resetMetrics = () => {
    metrics.value = {
      totalRequests: 0,
      successCount: 0,
      errorCount: 0,
      averageResponseTime: 0,
      lastRequestTime: 0
    }
  }

  // 成功率
  const successRate = computed(() => {
    if (metrics.value.totalRequests === 0) return 100
    return (metrics.value.successCount / metrics.value.totalRequests) * 100
  })

  // 稳定性评分
  const stabilityScore = computed(() => {
    let score = 100

    // 扣分：成功率低
    score -= (100 - successRate.value) * 0.3

    // 扣分：错误历史多
    score -= Math.min(20, errorHistory.value.length * 2)

    // 扣分：熔断器打开
    if (circuitBreaker.value.status === 'open') {
      score -= 30
    } else if (circuitBreaker.value.status === 'half-open') {
      score -= 15
    }

    return Math.max(0, Math.round(score))
  })

  // 状态报告
  const statusReport = computed(() => ({
    successRate: successRate.value.toFixed(1) + '%',
    stabilityScore: stabilityScore.value,
    circuitBreakerStatus: circuitBreaker.value.status,
    totalRequests: metrics.value.totalRequests,
    averageResponseTime: metrics.value.averageResponseTime.toFixed(0) + 'ms',
    cacheSize: requestCache.value.size,
    recentErrors: errorHistory.value.slice(-5)
  }))

  return {
    config,
    circuitBreaker,
    metrics,
    errorHistory,
    // 方法
    fetchWithRetry,
    calculateRetryDelay,
    shouldRetry,
    recordSuccess,
    recordFailure,
    clearCache,
    resetCircuitBreaker,
    resetMetrics,
    // 计算属性
    successRate,
    stabilityScore,
    statusReport
  }
}

export default useAPIStability
