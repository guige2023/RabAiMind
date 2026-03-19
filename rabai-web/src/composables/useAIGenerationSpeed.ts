// AI Generation Speed Optimizer - AI生成速度优化
import { ref, computed } from 'vue'

export type GenerationMode = 'fast' | 'balanced' | 'quality'

export interface GenerationTask {
  id: string
  type: 'outline' | 'content' | 'image' | 'slide' | 'full'
  priority: number
  status: 'pending' | 'running' | 'completed' | 'failed'
  startTime?: number
  endTime?: number
  progress: number
  result?: any
  error?: string
}

export interface SpeedConfig {
  mode: GenerationMode
  enableCache: boolean
  enableParallel: boolean
  enableStreaming: boolean
  maxConcurrent: number
  timeout: number
  retryCount: number
  fallbackToSimple: boolean
}

export const speedModes: Record<GenerationMode, {
  name: string
  description: string
  estimatedTime: number
  quality: number
}> = {
  fast: {
    name: '极速模式',
    description: '最快生成速度，适合快速预览',
    estimatedTime: 5,
    quality: 60
  },
  balanced: {
    name: '均衡模式',
    description: '速度和质量的平衡',
    estimatedTime: 15,
    quality: 80
  },
  quality: {
    name: '高质量模式',
    description: '最佳质量，适合正式场合',
    estimatedTime: 30,
    quality: 95
  }
}

export function useAIGenerationSpeed() {
  // 速度配置
  const config = ref<SpeedConfig>({
    mode: 'balanced',
    enableCache: true,
    enableParallel: true,
    enableStreaming: true,
    maxConcurrent: 3,
    timeout: 30000,
    retryCount: 2,
    fallbackToSimple: true
  })

  // 任务队列
  const taskQueue = ref<GenerationTask[]>([])
  const runningTasks = ref<GenerationTask[]>([])
  const completedTasks = ref<GenerationTask[]>([])

  // 缓存
  const cache = ref<Map<string, any>>(new Map())
  const cacheHits = ref(0)
  const cacheMisses = ref(0)

  // 性能指标
  const metrics = ref({
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    averageTime: 0,
    fastestTime: Infinity,
    slowestTime: 0
  })

  // 获取缓存键
  const getCacheKey = (type: string, input: any): string => {
    return `${type}_${JSON.stringify(input)}`
  }

  // 从缓存获取
  const getFromCache = <T>(key: string): T | undefined => {
    if (!config.value.enableCache) return undefined

    const value = cache.value.get(key)
    if (value) {
      cacheHits.value++
      return value as T
    }
    cacheMisses.value++
    return undefined
  }

  // 保存到缓存
  const saveToCache = (key: string, value: any) => {
    if (config.value.enableCache) {
      // 限制缓存大小
      if (cache.value.size > 100) {
        const firstKey = cache.value.keys().next().value
        cache.value.delete(firstKey)
      }
      cache.value.set(key, value)
    }
  }

  // 清除缓存
  const clearCache = () => {
    cache.value.clear()
    cacheHits.value = 0
    cacheMisses.value = 0
  }

  // 创建生成任务
  const createTask = (
    type: GenerationTask['type'],
    input: any,
    priority = 5
  ): GenerationTask => {
    const task: GenerationTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      priority,
      status: 'pending',
      progress: 0
    }

    taskQueue.value.push(task)
    taskQueue.value.sort((a, b) => b.priority - a.priority)

    return task
  }

  // 执行任务
  const executeTask = async <T>(
    task: GenerationTask,
    generator: () => Promise<T>
  ): Promise<T> => {
    const startTime = performance.now()

    task.status = 'running'
    task.startTime = startTime
    runningTasks.value.push(task)

    try {
      // 检查缓存
      const cacheKey = getCacheKey(task.type, task)
      const cached = getFromCache<T>(cacheKey)
      if (cached) {
        task.status = 'completed'
        task.progress = 100
        task.result = cached
        task.endTime = performance.now()
        moveToCompleted(task)
        return cached
      }

      // 执行生成
      const result = await Promise.race([
        generator(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Generation timeout')), config.value.timeout)
        )
      ])

      // 保存到缓存
      saveToCache(cacheKey, result)

      task.status = 'completed'
      task.progress = 100
      task.result = result
      task.endTime = performance.now()

      // 更新指标
      updateMetrics(task.endTime - startTime, false)

      moveToCompleted(task)
      return result
    } catch (error: any) {
      task.status = 'failed'
      task.error = error.message
      task.endTime = performance.now()

      // 如果启用降级处理
      if (config.value.fallbackToSimple && task.type !== 'outline') {
        try {
          const fallbackResult = await generateSimpleResult(task.type)
          task.result = fallbackResult
          task.status = 'completed'
          updateMetrics(performance.now() - startTime, false)
          moveToCompleted(task)
          return fallbackResult
        } catch {
          // 降级也失败
        }
      }

      updateMetrics(performance.now() - startTime, true)
      moveToCompleted(task)
      throw error
    } finally {
      runningTasks.value = runningTasks.value.filter(t => t.id !== task.id)
    }
  }

  // 简单降级生成
  const generateSimpleResult = async (type: GenerationTask['type']): Promise<any> => {
    await new Promise(resolve => setTimeout(resolve, 500))

    switch (type) {
      case 'content':
        return { text: '生成内容', slides: [] }
      case 'image':
        return { url: '', alt: 'Generated image' }
      case 'slide':
        return { title: 'Slide', content: [] }
      case 'full':
        return { slides: [], metadata: {} }
      default:
        return {}
    }
  }

  // 移动到已完成
  const moveToCompleted = (task: GenerationTask) => {
    const index = taskQueue.value.findIndex(t => t.id === task.id)
    if (index !== -1) {
      taskQueue.value.splice(index, 1)
    }
    completedTasks.value.push(task)

    // 限制已完成任务数量
    if (completedTasks.value.length > 50) {
      completedTasks.value.shift()
    }
  }

  // 更新指标
  const updateMetrics = (time: number, failed: boolean) => {
    metrics.value.totalTasks++

    if (!failed) {
      metrics.value.completedTasks++
      metrics.value.averageTime =
        (metrics.value.averageTime * (metrics.value.completedTasks - 1) + time) /
        metrics.value.completedTasks
      metrics.value.fastestTime = Math.min(metrics.value.fastestTime, time)
      metrics.value.slowestTime = Math.max(metrics.value.slowestTime, time)
    } else {
      metrics.value.failedTasks++
    }
  }

  // 并行生成多个任务
  const parallelGenerate = async <T>(
    tasks: Array<{ type: GenerationTask['type']; input: any; priority: number }>,
    generator: (input: any) => Promise<T>
  ): Promise<T[]> => {
    if (!config.value.enableParallel) {
      // 串行执行
      const results: T[] = []
      for (const task of tasks) {
        const t = createTask(task.type, task.input, task.priority)
        const result = await executeTask(t, () => generator(task.input))
        results.push(result)
      }
      return results
    }

    // 并行执行
    const batchSize = config.value.maxConcurrent
    const results: T[] = []

    for (let i = 0; i < tasks.length; i += batchSize) {
      const batch = tasks.slice(i, i + batchSize)
      const batchPromises = batch.map(task => {
        const t = createTask(task.type, task.input, task.priority)
        return executeTask(t, () => generator(task.input))
      })

      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
    }

    return results
  }

  // 流式生成（模拟）
  const streamingGenerate = async (
    onChunk: (chunk: string, progress: number) => void
  ): Promise<string> => {
    if (!config.value.enableStreaming) {
      const result = await new Promise<string>(resolve => setTimeout(() => resolve('Full result'), 1000))
      onChunk(result, 100)
      return result
    }

    const chunks = ['Hello', ' this', ' is', ' a', ' streaming', ' result']
    let result = ''

    for (let i = 0; i < chunks.length; i++) {
      result += chunks[i]
      onChunk(result, Math.round(((i + 1) / chunks.length) * 100))
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    return result
  }

  // 设置速度模式
  const setMode = (mode: GenerationMode) => {
    config.value.mode = mode

    // 根据模式调整配置
    switch (mode) {
      case 'fast':
        config.value.enableCache = true
        config.value.enableParallel = true
        config.value.enableStreaming = false
        config.value.timeout = 10000
        config.value.maxConcurrent = 5
        break
      case 'balanced':
        config.value.enableCache = true
        config.value.enableParallel = true
        config.value.enableStreaming = true
        config.value.timeout = 30000
        config.value.maxConcurrent = 3
        break
      case 'quality':
        config.value.enableCache = true
        config.value.enableParallel = false
        config.value.enableStreaming = true
        config.value.timeout = 60000
        config.value.maxConcurrent = 1
        break
    }
  }

  // 预估生成时间
  const estimatedTime = computed(() => {
    const baseTime = speedModes[config.value.mode].estimatedTime
    const activeTasks = taskQueue.value.length + runningTasks.value.length

    return baseTime * (1 + activeTasks * 0.5)
  })

  // 缓存命中率
  const cacheHitRate = computed(() => {
    const total = cacheHits.value + cacheMisses.value
    return total > 0 ? (cacheHits.value / total) * 100 : 0
  })

  // 性能统计
  const stats = computed(() => ({
    mode: config.value.mode,
    queueLength: taskQueue.value.length,
    runningCount: runningTasks.value.length,
    completedCount: completedTasks.value.length,
    cacheSize: cache.value.size,
    cacheHitRate: cacheHitRate.value.toFixed(1) + '%',
    averageTime: metrics.value.averageTime.toFixed(0) + 'ms',
    successRate: metrics.value.totalTasks > 0
      ? ((metrics.value.completedTasks / metrics.value.totalTasks) * 100).toFixed(1) + '%'
      : '0%'
  }))

  return {
    config,
    taskQueue,
    runningTasks,
    completedTasks,
    metrics,
    cache,
    estimatedTime,
    cacheHitRate,
    stats,
    speedModes,
    setMode,
    createTask,
    executeTask,
    parallelGenerate,
    streamingGenerate,
    getFromCache,
    saveToCache,
    clearCache
  }
}

export default useAIGenerationSpeed
