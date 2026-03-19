// Loading Experience - 加载体验优化
import { ref, computed, onMounted, onUnmounted } from 'vue'

export type LoadingType = 'spinner' | 'skeleton' | 'progress' | 'shimmer' | 'placeholder'
export type LoadingSize = 'small' | 'medium' | 'large'

export interface LoadingConfig {
  type: LoadingType
  size: LoadingSize
  showProgress: boolean
  showTime: boolean
  enableAnimation: boolean
  minDisplayTime: number
}

export interface LoadingState {
  isLoading: boolean
  progress: number
  message: string
  startTime: number
  estimatedEndTime: number
}

export const loadingTypes: Record<LoadingType, { name: string; description: string }> = {
  spinner: { name: '旋转器', description: '传统的加载动画' },
  skeleton: { name: '骨架屏', description: '内容占位符' },
  progress: { name: '进度条', description: '显示加载进度' },
  shimmer: { name: '闪光效果', description: '闪烁的加载动画' },
  placeholder: { name: '占位图', description: '灰色占位区域' }
}

export function useLoadingExperience() {
  // 加载配置
  const config = ref<LoadingConfig>({
    type: 'skeleton',
    size: 'medium',
    showProgress: true,
    showTime: true,
    enableAnimation: true,
    minDisplayTime: 500
  })

  // 加载状态
  const state = ref<LoadingState>({
    isLoading: false,
    progress: 0,
    message: '加载中...',
    startTime: 0,
    estimatedEndTime: 0
  })

  // 加载历史
  const loadingHistory = ref<Array<{
    startTime: number
    endTime: number
    duration: number
    success: boolean
  }>>([])

  // 最小显示计时器
  let minDisplayTimer: ReturnType<typeof setTimeout> | null = null

  // 启动加载
  const startLoading = (message?: string) => {
    state.value.isLoading = true
    state.value.progress = 0
    state.value.message = message || '加载中...'
    state.value.startTime = Date.now()

    // 最小显示时间
    if (minDisplayTimer) {
      clearTimeout(minDisplayTimer)
    }
    minDisplayTimer = setTimeout(() => {
      // 可以在这里处理最小时间后的逻辑
    }, config.value.minDisplayTime)
  }

  // 更新进度
  const updateProgress = (progress: number, message?: string) => {
    state.value.progress = Math.min(100, Math.max(0, progress))

    // 估算完成时间
    const elapsed = Date.now() - state.value.startTime
    if (progress > 0) {
      const estimatedTotal = elapsed / (progress / 100)
      state.value.estimatedEndTime = state.value.startTime + estimatedTotal
    }

    if (message) {
      state.value.message = message
    }
  }

  // 增量进度
  const incrementProgress = (amount: number, message?: string) => {
    updateProgress(state.value.progress + amount, message)
  }

  // 结束加载
  const endLoading = (success = true) => {
    const endTime = Date.now()
    const duration = endTime - state.value.startTime

    // 确保最小显示时间
    if (duration < config.value.minDisplayTime) {
      return new Promise<void>(resolve => {
        setTimeout(() => {
          completeLoading(success)
          resolve()
        }, config.value.minDisplayTime - duration)
      })
    }

    completeLoading(success)
  }

  // 完成加载（内部方法）
  const completeLoading = (success: boolean) => {
    // 记录到历史
    const duration = Date.now() - state.value.startTime
    loadingHistory.value.push({
      startTime: state.value.startTime,
      endTime: Date.now(),
      duration,
      success
    })

    // 限制历史数量
    if (loadingHistory.value.length > 20) {
      loadingHistory.value.shift()
    }

    // 重置状态
    state.value.isLoading = false
    state.value.progress = 100
  }

  // 取消加载
  const cancelLoading = () => {
    completeLoading(false)
  }

  // 带承诺的加载
  const withLoading = async <T>(
    promise: Promise<T>,
    message?: string
  ): Promise<T> => {
    startLoading(message)

    try {
      const result = await promise
      await endLoading(true)
      return result
    } catch (error) {
      await endLoading(false)
      throw error
    }
  }

  // 带模拟进度的加载
  const withSimulatedProgress = async <T>(
    callback: (progress: number, message: string) => Promise<T>,
    steps: number = 10,
    message?: string
  ): Promise<T> => {
    startLoading(message)

    try {
      const result = await callback(0, state.value.message)

      for (let i = 1; i <= steps; i++) {
        await new Promise(resolve => setTimeout(resolve, 100))
        updateProgress((i / steps) * 100, message)
      }

      await endLoading(true)
      return result
    } catch (error) {
      await endLoading(false)
      throw error
    }
  }

  // 骨架屏数据生成
  const generateSkeletonItems = (count: number, options?: {
    rows?: number
    hasImage?: boolean
    hasAvatar?: boolean
  }) => {
    const { rows = 3, hasImage = false, hasAvatar = false } = options || {}

    return Array.from({ length: count }, (_, i) => ({
      id: i,
      rows,
      hasImage,
      hasAvatar,
      // 随机高度变化
      height: Array.from({ length: rows }, () =>
        Math.random() > 0.5 ? '1em' : '0.8em'
      )
    }))
  }

  // 估算剩余时间
  const estimatedRemainingTime = computed(() => {
    if (!state.value.isLoading || state.value.progress === 0) {
      return 0
    }

    const elapsed = Date.now() - state.value.startTime
    const remaining = (elapsed / state.value.progress) * (100 - state.value.progress)
    return Math.round(remaining / 1000) // 转换为秒
  })

  // 格式化时间
  const formattedElapsedTime = computed(() => {
    const elapsed = state.value.startTime > 0
      ? Date.now() - state.value.startTime
      : 0
    return Math.round(elapsed / 1000)
  })

  // 加载统计
  const stats = computed(() => {
    const history = loadingHistory.value
    if (history.length === 0) {
      return {
        total: 0,
        successCount: 0,
        failureCount: 0,
        successRate: '0%',
        averageDuration: '0ms',
        fastestDuration: '0ms',
        slowestDuration: '0ms'
      }
    }

    const successCount = history.filter(h => h.success).length
    const durations = history.map(h => h.duration)
    const averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length

    return {
      total: history.length,
      successCount,
      failureCount: history.length - successCount,
      successRate: ((successCount / history.length) * 100).toFixed(1) + '%',
      averageDuration: Math.round(averageDuration) + 'ms',
      fastestDuration: Math.round(Math.min(...durations)) + 'ms',
      slowestDuration: Math.round(Math.max(...durations)) + 'ms'
    }
  })

  // 设置配置
  const setConfig = (newConfig: Partial<LoadingConfig>) => {
    config.value = { ...config.value, ...newConfig }
  }

  // 设置类型
  const setType = (type: LoadingType) => {
    config.value.type = type
  }

  // 设置大小
  const setSize = (size: LoadingSize) => {
    config.value.size = size
  }

  // 清除历史
  const clearHistory = () => {
    loadingHistory.value = []
  }

  return {
    // 配置和状态
    config,
    state,
    loadingHistory,
    // 计算属性
    estimatedRemainingTime,
    formattedElapsedTime,
    stats,
    loadingTypes,
    // 方法
    startLoading,
    updateProgress,
    incrementProgress,
    endLoading,
    cancelLoading,
    withLoading,
    withSimulatedProgress,
    generateSkeletonItems,
    setConfig,
    setType,
    setSize,
    clearHistory
  }
}

export default useLoadingExperience
