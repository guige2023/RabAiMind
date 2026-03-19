// API Stability Advanced - API稳定性高级优化
import { ref, computed } from 'vue'

export type LoadBalancingStrategy = 'round-robin' | 'least-connections' | 'weighted' | 'adaptive'
export type HealthCheckInterval = 'fast' | 'normal' | 'slow'

export interface APIEndpoint {
  url: string
  weight: number
  isHealthy: boolean
  responseTime: number
  failureCount: number
  lastChecked: number
}

export interface RequestQueueItem {
  id: string
  request: () => Promise<any>
  priority: number
  retries: number
  timeout: number
  createdAt: number
}

export interface APIMetrics {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  avgResponseTime: number
  p95ResponseTime: number
  p99ResponseTime: number
  uptime: number
}

export function useAPIStabilityAdvanced() {
  // 负载均衡策略
  const loadBalancing = ref<LoadBalancingStrategy>('adaptive')

  // API端点
  const endpoints = ref<APIEndpoint[]>([])

  // 请求队列
  const requestQueue = ref<RequestQueueItem[]>([])
  const maxQueueSize = 100

  // 指标
  const metrics = ref<APIMetrics>({
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    avgResponseTime: 0,
    p95ResponseTime: 0,
    p99ResponseTime: 0,
    uptime: 100
  })

  // 响应时间历史
  const responseTimeHistory: number[] = []
  const maxHistorySize = 1000

  // 添加端点
  const addEndpoint = (url: string, weight = 1) => {
    endpoints.value.push({
      url,
      weight,
      isHealthy: true,
      responseTime: 0,
      failureCount: 0,
      lastChecked: Date.now()
    })
  }

  // 移除端点
  const removeEndpoint = (url: string) => {
    endpoints.value = endpoints.value.filter(e => e.url !== url)
  }

  // 选择最佳端点
  const selectEndpoint = (): APIEndpoint | null => {
    if (endpoints.value.length === 0) return null

    const healthy = endpoints.value.filter(e => e.isHealthy)
    if (healthy.length === 0) return endpoints.value[0]

    switch (loadBalancing.value) {
      case 'round-robin':
        return healthy[Math.floor(Math.random() * healthy.length)]

      case 'least-connections':
        return healthy.sort((a, b) => a.failureCount - b.failureCount)[0]

      case 'weighted':
        const totalWeight = healthy.reduce((sum, e) => sum + e.weight, 0)
        let random = Math.random() * totalWeight
        for (const endpoint of healthy) {
          random -= endpoint.weight
          if (random <= 0) return endpoint
        }
        return healthy[0]

      case 'adaptive':
        return healthy.sort((a, b) => a.responseTime - b.responseTime)[0]

      default:
        return healthy[0]
    }
  }

  // 健康检查
  const checkHealth = async (url: string): Promise<boolean> => {
    const start = performance.now()
    try {
      const response = await fetch(url, { method: 'HEAD', cache: 'no-cache' })
      const time = performance.now() - start

      const endpoint = endpoints.value.find(e => e.url === url)
      if (endpoint) {
        endpoint.responseTime = time
        endpoint.isHealthy = response.ok
        endpoint.lastChecked = Date.now()

        if (!response.ok) {
          endpoint.failureCount++
        } else {
          endpoint.failureCount = Math.max(0, endpoint.failureCount - 1)
        }
      }

      return response.ok
    } catch {
      const endpoint = endpoints.value.find(e => e.url === url)
      if (endpoint) {
        endpoint.isHealthy = false
        endpoint.failureCount++
        endpoint.lastChecked = Date.now()
      }
      return false
    }
  }

  // 批量健康检查
  const checkAllHealth = async (interval: HealthCheckInterval = 'normal') => {
    const delays: Record<HealthCheckInterval, number> = {
      fast: 30000,
      normal: 60000,
      slow: 120000
    }

    const promises = endpoints.value.map(e => checkHealth(e.url))
    await Promise.all(promises)

    setTimeout(() => checkAllHealth(interval), delays[interval])
  }

  // 请求队列
  const enqueue = (request: () => Promise<any>, priority = 5, timeout = 30000) => {
    const item: RequestQueueItem = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      request,
      priority,
      retries: 0,
      timeout,
      createdAt: Date.now()
    }

    requestQueue.value.push(item)
    requestQueue.value.sort((a, b) => b.priority - a.priority)

    // 限制队列大小
    if (requestQueue.value.length > maxQueueSize) {
      requestQueue.value.shift()
    }
  }

  // 执行队列请求
  const processQueue = async () => {
    while (requestQueue.value.length > 0) {
      const item = requestQueue.value.shift()!
      const endpoint = selectEndpoint()

      if (!endpoint) {
        console.error('No available endpoints')
        continue
      }

      try {
        const start = performance.now()
        await item.request()
        const duration = performance.now() - start

        recordSuccess(duration)
      } catch (error) {
        recordFailure()

        // 重试
        if (item.retries < 3) {
          item.retries++
          requestQueue.value.push(item)
        }
      }
    }
  }

  // 记录成功
  const recordSuccess = (duration: number) => {
    metrics.value.totalRequests++
    metrics.value.successfulRequests++

    responseTimeHistory.push(duration)
    if (responseTimeHistory.length > maxHistorySize) {
      responseTimeHistory.shift()
    }

    updateMetrics()
  }

  // 记录失败
  const recordFailure = () => {
    metrics.value.totalRequests++
    metrics.value.failedRequests++
    updateMetrics()
  }

  // 更新指标
  const updateMetrics = () => {
    if (responseTimeHistory.length === 0) return

    // 平均响应时间
    metrics.value.avgResponseTime = responseTimeHistory.reduce((a, b) => a + b, 0) / responseTimeHistory.length

    // P95
    const sorted = [...responseTimeHistory].sort((a, b) => a - b)
    const p95Index = Math.floor(sorted.length * 0.95)
    metrics.value.p95ResponseTime = sorted[p95Index] || 0

    // P99
    const p99Index = Math.floor(sorted.length * 0.99)
    metrics.value.p99ResponseTime = sorted[p99Index] || 0

    // 可用率
    metrics.value.uptime = (metrics.value.successfulRequests / metrics.value.totalRequests) * 100
  }

  // 智能重试
  const smartRetry = async <T>(
    request: () => Promise<T>,
    options?: { maxRetries?: number; backoff?: 'linear' | 'exponential' }
  ): Promise<T> => {
    const maxRetries = options?.maxRetries ?? 3
    const backoff = options?.backoff ?? 'exponential'

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await request()
      } catch (error) {
        if (attempt === maxRetries) throw error

        const delay = backoff === 'exponential'
          ? Math.pow(2, attempt) * 1000
          : attempt * 1000

        await new Promise(r => setTimeout(r, delay))
      }
    }

    throw new Error('Max retries reached')
  }

  // 统计
  const stats = computed(() => ({
    totalRequests: metrics.value.totalRequests,
    successRate: metrics.value.uptime.toFixed(1) + '%',
    avgResponseTime: metrics.value.avgResponseTime.toFixed(0) + 'ms',
    p95ResponseTime: metrics.value.p95ResponseTime.toFixed(0) + 'ms',
    healthyEndpoints: endpoints.value.filter(e => e.isHealthy).length,
    totalEndpoints: endpoints.value.length,
    queueLength: requestQueue.value.length
  }))

  return {
    loadBalancing,
    endpoints,
    requestQueue,
    metrics,
    stats,
    addEndpoint,
    removeEndpoint,
    selectEndpoint,
    checkHealth,
    checkAllHealth,
    enqueue,
    processQueue,
    smartRetry,
    recordSuccess,
    recordFailure
  }
}

export default useAPIStabilityAdvanced
