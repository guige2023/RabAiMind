// Loading Experience Improver - 加载体验深度改善
import { ref, computed, onMounted, onUnmounted } from 'vue'

export type LoadingStyle = 'spinner' | 'skeleton' | 'progress' | 'shimmer' | 'pulse' | 'adaptive'

export interface LoadingStep {
  id: string
  name: string
  progress: number
  message: string
  duration?: number
}

export interface LoadingProfile {
  id: string
  name: string
  minDuration: number
  maxDuration: number
  steps: LoadingStep[]
}

export function useLoadingExperienceImprover() {
  // 加载配置
  const config = ref({
    style: 'adaptive' as LoadingStyle,
    enableProgress: true,
    enableSteps: true,
    enablePrediction: true,
    minDuration: 300,
    maxDuration: 5000,
    smoothTransition: true
  })

  // 当前加载状态
  const state = ref({
    isLoading: false,
    progress: 0,
    message: '',
    currentStep: 0,
    startTime: 0,
    estimatedRemaining: 0,
    isComplete: false
  })

  // 加载步骤
  const steps = ref<LoadingStep[]>([])

  // 加载历史
  const history = ref<Array<{
    duration: number
    success: boolean
    timestamp: number
  }>>([])

  // 预设加载配置
  const loadingProfiles = ref<LoadingProfile[]>([
    {
      id: 'quick',
      name: '快速加载',
      minDuration: 200,
      maxDuration: 800,
      steps: [
        { id: 'init', name: '初始化', progress: 30, message: '正在初始化...' },
        { id: 'load', name: '加载数据', progress: 80, message: '加载中...' },
        { id: 'complete', name: '完成', progress: 100, message: '完成!' }
      ]
    },
    {
      id: 'standard',
      name: '标准加载',
      minDuration: 500,
      maxDuration: 2000,
      steps: [
        { id: 'prepare', name: '准备', progress: 15, message: '准备中...' },
        { id: 'fetch', name: '获取数据', progress: 45, message: '获取数据...' },
        { id: 'process', name: '处理', progress: 70, message: '处理中...' },
        { id: 'render', name: '渲染', progress: 90, message: '渲染中...' },
        { id: 'complete', name: '完成', progress: 100, message: '完成!' }
      ]
    },
    {
      id: 'detailed',
      name: '详细加载',
      minDuration: 1000,
      maxDuration: 5000,
      steps: [
        { id: 'auth', name: '身份验证', progress: 10, message: '验证身份...' },
        { id: 'config', name: '加载配置', progress: 25, message: '加载配置...' },
        { id: 'fetch', name: '获取数据', progress: 50, message: '获取数据...' },
        { id: 'parse', name: '解析内容', progress: 70, message: '解析内容...' },
        { id: 'template', name: '应用模板', progress: 85, message: '应用模板...' },
        { id: 'render', name: '渲染页面', progress: 95, message: '渲染页面...' },
        { id: 'complete', name: '完成', progress: 100, message: '完成!' }
      ]
    }
  ])

  // 当前使用的配置
  const currentProfile = ref<LoadingProfile | null>(null)

  // 启动加载
  const startLoading = (message?: string, profileId?: string) => {
    // 选择配置
    if (profileId) {
      currentProfile.value = loadingProfiles.value.find(p => p.id === profileId) || loadingProfiles.value[1]
    } else {
      // 根据时长自动选择
      currentProfile.value = loadingProfiles.value[1]
    }

    if (currentProfile.value) {
      steps.value = [...currentProfile.value.steps]
    }

    state.value = {
      isLoading: true,
      progress: 0,
      message: message || '加载中...',
      currentStep: 0,
      startTime: Date.now(),
      estimatedRemaining: 0,
      isComplete: false
    }
  }

  // 更新进度
  const updateProgress = (progress: number, message?: string) => {
    if (!state.value.isLoading) return

    state.value.progress = Math.min(100, Math.max(0, progress))

    // 根据进度更新步骤
    if (currentProfile.value && config.value.enableSteps) {
      const stepIndex = steps.value.findIndex((s, i) => {
        const nextStep = steps.value[i + 1]
        return progress >= s.progress && (!nextStep || progress < nextStep.progress)
      })

      if (stepIndex >= 0 && stepIndex !== state.value.currentStep) {
        state.value.currentStep = stepIndex
        state.value.message = steps.value[stepIndex].message
      }
    }

    // 估算剩余时间
    if (config.value.enablePrediction && state.value.startTime > 0) {
      const elapsed = Date.now() - state.value.startTime
      if (progress > 0) {
        const estimated = (elapsed / progress) * (100 - progress)
        state.value.estimatedRemaining = Math.round(estimated)
      }
    }

    if (message) {
      state.value.message = message
    }
  }

  // 推进到下一步
  const nextStep = (message?: string) => {
    if (!currentProfile.value) return

    const nextIndex = state.value.currentStep + 1
    if (nextIndex < currentProfile.value.steps.length) {
      const step = currentProfile.value.steps[nextIndex]
      updateProgress(step.progress, message || step.message)
    }
  }

  // 设置步骤
  const setStep = (stepId: string, message?: string) => {
    const step = steps.value.find(s => s.id === stepId)
    if (step) {
      updateProgress(step.progress, message || step.message)
    }
  }

  // 结束加载
  const endLoading = (success = true) => {
    if (!state.value.isLoading) return

    const duration = Date.now() - state.value.startTime

    // 确保最小显示时间
    if (duration < config.value.minDuration) {
      setTimeout(() => completeLoading(success), config.value.minDuration - duration)
    } else {
      completeLoading(success)
    }
  }

  // 完成加载（内部）
  const completeLoading = (success: boolean) => {
    state.value.progress = 100
    state.value.message = '完成!'
    state.value.isComplete = true

    // 记录历史
    history.value.push({
      duration: Date.now() - state.value.startTime,
      success,
      timestamp: Date.now()
    })

    // 限制历史数量
    if (history.value.length > 50) {
      history.value.shift()
    }

    // 延迟重置状态
    setTimeout(() => {
      state.value.isLoading = false
    }, config.value.smoothTransition ? 300 : 0)
  }

  // 取消加载
  const cancelLoading = () => {
    state.value.isLoading = false
    state.value.progress = 0
    currentProfile.value = null
  }

  // 带Promise的加载
  const withLoading = async <T>(
    promise: Promise<T>,
    message?: string,
    profileId?: string
  ): Promise<T> => {
    startLoading(message, profileId)

    try {
      const result = await promise
      endLoading(true)
      return result
    } catch (error) {
      endLoading(false)
      throw error
    }
  }

  // 模拟加载
  const simulateLoading = async (
    duration: number,
    message?: string
  ) => {
    const steps = Math.max(3, Math.floor(duration / 200))
    startLoading(message || '加载中...')

    for (let i = 1; i <= steps; i++) {
      await new Promise(resolve => setTimeout(resolve, duration / steps))
      updateProgress((i / steps) * 100)
    }

    endLoading(true)
  }

  // 骨架屏生成
  const generateSkeleton = (count: number, type: 'text' | 'image' | 'card' | 'list' = 'text') => {
    return Array.from({ length: count }, (_, i) => {
      const base = {
        id: i,
        animate: true
      }

      switch (type) {
        case 'image':
          return { ...base, width: '100%', height: '200px', borderRadius: '8px' }
        case 'card':
          return { ...base, width: '100%', height: '120px', hasImage: true, rows: 2 }
        case 'list':
          return { ...base, hasAvatar: true, rows: 1, width: `${70 + Math.random() * 30}%` }
        default:
          return { ...base, width: `${60 + Math.random() * 40}%`, height: '16px' }
      }
    })
  }

  // 闪烁效果CSS
  const shimmerStyle = computed(() => ({
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite'
  }))

  // 估算剩余时间格式化
  const formattedRemaining = computed(() => {
    const ms = state.value.estimatedRemaining
    if (ms < 1000) return '即将完成'
    if (ms < 60000) return `${Math.ceil(ms / 1000)}秒`
    return `${Math.ceil(ms / 60000)}分钟`
  })

  // 加载统计
  const stats = computed(() => {
    if (history.value.length === 0) {
      return { avgDuration: 0, successRate: 0, total: 0 }
    }

    const total = history.value.length
    const successCount = history.value.filter(h => h.success).length
    const avgDuration = history.value.reduce((sum, h) => sum + h.duration, 0) / total

    return {
      total,
      successCount,
      failureCount: total - successCount,
      successRate: Math.round((successCount / total) * 100),
      avgDuration: Math.round(avgDuration)
    }
  })

  // 加载速度等级
  const speedLevel = computed(() => {
    const avg = stats.value.avgDuration
    if (avg < 500) return { level: 'fast', label: '快速', color: '#52c41a' }
    if (avg < 1500) return { level: 'normal', label: '正常', color: '#1890ff' }
    if (avg < 3000) return { level: 'slow', label: '较慢', color: '#faad14' }
    return { level: 'very-slow', label: '很慢', color: '#ff4d4f' }
  })

  // 设置配置
  const setConfig = (newConfig: Partial<typeof config.value>) => {
    config.value = { ...config.value, ...newConfig }
  }

  // 设置样式
  const setStyle = (style: LoadingStyle) => {
    config.value.style = style
  }

  // 添加自定义配置
  const addProfile = (profile: LoadingProfile) => {
    loadingProfiles.value.push(profile)
  }

  return {
    // 配置和状态
    config,
    state,
    steps,
    history,
    currentProfile,
    loadingProfiles,
    // 计算属性
    shimmerStyle,
    formattedRemaining,
    stats,
    speedLevel,
    // 方法
    startLoading,
    updateProgress,
    nextStep,
    setStep,
    endLoading,
    cancelLoading,
    withLoading,
    simulateLoading,
    generateSkeleton,
    setConfig,
    setStyle,
    addProfile
  }
}

export default useLoadingExperienceImprover
