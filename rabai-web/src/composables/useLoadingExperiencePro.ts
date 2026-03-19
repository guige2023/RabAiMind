// Loading Experience Pro - 加载体验深度优化
import { ref, computed } from 'vue'

export type LoadingStyle = 'spinner' | 'skeleton' | 'progress' | 'shimmer' | 'adaptive'

export interface LoadingState {
  isLoading: boolean
  progress: number
  message: string
  startTime: number
  estimatedEnd: number
}

export interface LoadingProfile {
  id: string
  name: string
  minDuration: number
  steps: { progress: number; message: string }[]
}

export function useLoadingExperiencePro() {
  // 配置
  const config = ref({
    style: 'adaptive' as LoadingStyle,
    minDuration: 300,
    smoothTransition: true,
    enableProgress: true,
    enablePrediction: true
  })

  // 状态
  const state = ref<LoadingState>({
    isLoading: false,
    progress: 0,
    message: '加载中...',
    startTime: 0,
    estimatedEnd: 0
  })

  // 加载配置
  const profiles = ref<LoadingProfile[]>([
    {
      id: 'quick',
      name: '快速',
      minDuration: 200,
      steps: [
        { progress: 50, message: '处理中...' },
        { progress: 100, message: '完成!' }
      ]
    },
    {
      id: 'standard',
      name: '标准',
      minDuration: 500,
      steps: [
        { progress: 20, message: '准备中...' },
        { progress: 50, message: '加载数据...' },
        { progress: 80, message: '处理中...' },
        { progress: 100, message: '完成!' }
      ]
    },
    {
      id: 'detailed',
      name: '详细',
      minDuration: 1000,
      steps: [
        { progress: 10, message: '初始化...' },
        { progress: 30, message: '加载配置...' },
        { progress: 50, message: '获取数据...' },
        { progress: 70, message: '处理内容...' },
        { progress: 90, message: '渲染界面...' },
        { progress: 100, message: '完成!' }
      ]
    }
  ])

  // 开始加载
  const startLoading = (message?: string, profileId = 'standard') => {
    const profile = profiles.value.find(p => p.id === profileId) || profiles.value[1]

    state.value = {
      isLoading: true,
      progress: 0,
      message: message || '加载中...',
      startTime: Date.now(),
      estimatedEnd: 0
    }

    return profile
  }

  // 更新进度
  const updateProgress = (progress: number, message?: string) => {
    state.value.progress = Math.min(100, Math.max(0, progress))

    if (message) {
      state.value.message = message
    }

    // 预测完成时间
    if (config.value.enablePrediction && state.value.startTime > 0 && progress > 0) {
      const elapsed = Date.now() - state.value.startTime
      const estimated = (elapsed / progress) * (100 - progress)
      state.value.estimatedEnd = Date.now() + estimated
    }
  }

  // 结束加载
  const endLoading = (success = true) => {
    const duration = Date.now() - state.value.startTime

    // 确保最小显示时间
    if (duration < config.value.minDuration) {
      setTimeout(() => {
        completeLoading(success)
      }, config.value.minDuration - duration)
    } else {
      completeLoading(success)
    }
  }

  // 完成加载
  const completeLoading = (success: boolean) => {
    state.value.progress = 100
    state.value.isLoading = false
  }

  // 取消加载
  const cancelLoading = () => {
    state.value.isLoading = false
    state.value.progress = 0
  }

  // 带Promise的加载
  const withLoading = async <T>(
    promise: Promise<T>,
    message?: string
  ): Promise<T> => {
    startLoading(message)

    try {
      const result = await promise
      endLoading(true)
      return result
    } catch (error) {
      endLoading(false)
      throw error
    }
  }

  // 骨架屏生成
  const generateSkeleton = (count: number, type: 'text' | 'image' | 'card' = 'text') => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      type,
      width: type === 'image' ? '100%' : `${60 + Math.random() * 40}%`,
      height: type === 'image' ? '200px' : '16px',
      delay: i * 50
    }))
  }

  // 剩余时间
  const remainingTime = computed(() => {
    if (!state.value.isLoading || state.value.estimatedEnd === 0) return 0
    return Math.max(0, state.value.estimatedEnd - Date.now())
  })

  // 格式化时间
  const formattedRemaining = computed(() => {
    const ms = remainingTime.value
    if (ms < 1000) return '即将完成'
    if (ms < 60000) return `${Math.ceil(ms / 1000)}秒`
    return `${Math.ceil(ms / 60000)}分钟`
  })

  return {
    config,
    state,
    profiles,
    startLoading,
    updateProgress,
    endLoading,
    cancelLoading,
    withLoading,
    generateSkeleton,
    remainingTime,
    formattedRemaining
  }
}

export default useLoadingExperiencePro
