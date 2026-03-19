// Loading Experience Advanced - 加载体验高级版
import { ref, computed, onMounted } from 'vue'

export interface LoadingTask {
  id: string
  name: string
  progress: number
  status: 'pending' | 'loading' | 'complete' | 'error'
  startTime: number
  endTime?: number
  error?: string
  estimatedTime?: number
}

export interface LoadingPhase {
  name: string
  duration: number
  weight: number
}

export interface SkeletonConfig {
  enabled: boolean
  animated: boolean
  variant: 'text' | 'rectangular' | 'circular'
  count: number
}

export interface LoadingConfig {
  showProgress: boolean
  showPercentage: boolean
  showTime: boolean
  enableSkeleton: boolean
  enableBlur: boolean
  minDuration: number
}

export type LoadingStyle = 'spinner' | 'progress' | 'skeleton' | 'shimmer' | 'pulse' | 'custom'

export function useLoadingExperienceAdvanced() {
  // 加载任务
  const tasks = ref<LoadingTask[]>([])
  const maxTasks = 10

  // 全局状态
  const isGlobalLoading = ref(false)
  const globalProgress = ref(0)
  const globalMessage = ref('')

  // 性能追踪
  const loadTimes = ref<{ name: string; duration: number; timestamp: number }[]>([])
  const maxHistory = 50

  // 配置
  const config = ref<LoadingConfig>({
    showProgress: true,
    showPercentage: true,
    showTime: true,
    enableSkeleton: true,
    enableBlur: true,
    minDuration: 300
  })

  // 骨架屏配置
  const skeletonConfig = ref<SkeletonConfig>({
    enabled: true,
    animated: true,
    variant: 'text',
    count: 5
  })

  // 加载阶段
  const phases = ref<LoadingPhase[]>([
    { name: '初始化', duration: 100, weight: 0.1 },
    { name: '加载资源', duration: 300, weight: 0.3 },
    { name: '处理数据', duration: 200, weight: 0.2 },
    { name: '渲染界面', duration: 300, weight: 0.3 },
    { name: '完成', duration: 100, weight: 0.1 }
  ])

  // 预估时间
  const estimatedRemainingTime = computed(() => {
    if (!isGlobalLoading.value) return 0

    const completedWeight = phases.value
      .filter(p => {
        const task = tasks.value.find(t => t.name === p.name)
        return task?.status === 'complete'
      })
      .reduce((sum, p) => sum + p.weight, 0)

    const totalWeight = phases.value.reduce((sum, p) => sum + p.weight, 0)
    const progress = completedWeight / totalWeight

    if (progress > 0) {
      const elapsed = Date.now() - (tasks.value[0]?.startTime || Date.now())
      return Math.round((elapsed / progress) * (1 - progress))
    }

    return 5000
  })

  // 创建任务
  const createTask = (name: string): string => {
    const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    tasks.value.push({
      id,
      name,
      progress: 0,
      status: 'pending',
      startTime: Date.now()
    })

    if (tasks.value.length > maxTasks) {
      tasks.value.shift()
    }

    return id
  }

  // 更新任务进度
  const updateProgress = (id: string, progress: number) => {
    const task = tasks.value.find(t => t.id === id)
    if (task) {
      task.progress = Math.min(100, Math.max(0, progress))
      task.status = 'loading'
    }

    updateGlobalProgress()
  }

  // 完成任务
  const completeTask = (id: string) => {
    const task = tasks.value.find(t => t.id === id)
    if (task) {
      task.progress = 100
      task.status = 'complete'
      task.endTime = Date.now()

      // 记录加载时间
      const duration = task.endTime - task.startTime
      recordLoadTime(task.name, duration)
    }

    updateGlobalProgress()
  }

  // 任务失败
  const failTask = (id: string, error: string) => {
    const task = tasks.value.find(t => t.id === id)
    if (task) {
      task.status = 'error'
      task.error = error
      task.endTime = Date.now()
    }

    updateGlobalProgress()
  }

  // 批量创建任务
  const createBatch = (names: string[]): string[] => {
    return names.map(name => createTask(name))
  }

  // 更新全局进度
  const updateGlobalProgress = () => {
    if (tasks.value.length === 0) {
      globalProgress.value = 0
      return
    }

    const totalProgress = tasks.value.reduce((sum, task) => {
      return sum + task.progress
    }, 0)

    globalProgress.value = Math.round(totalProgress / tasks.value.length)
  }

  // 开始全局加载
  const startGlobalLoading = (message = '加载中...') => {
    isGlobalLoading.value = true
    globalMessage.value = message
    globalProgress.value = 0

    // 清除旧任务
    tasks.value = []
  }

  // 停止全局加载
  const stopGlobalLoading = () => {
    isGlobalLoading.value = false
    globalProgress.value = 100
    globalMessage.value = '加载完成'

    setTimeout(() => {
      globalMessage.value = ''
    }, 1500)
  }

  // 记录加载时间
  const recordLoadTime = (name: string, duration: number) => {
    loadTimes.value.push({
      name,
      duration,
      timestamp: Date.now()
    })

    if (loadTimes.value.length > maxHistory) {
      loadTimes.value.shift()
    }
  }

  // 模拟加载效果
  const simulateLoading = async (
    taskId: string,
    duration: number,
    onProgress?: (progress: number) => void
  ) => {
    const steps = 20
    const stepDuration = duration / steps

    for (let i = 1; i <= steps; i++) {
      const progress = Math.round((i / steps) * 100)
      updateProgress(taskId, progress)
      onProgress?.(progress)
      await new Promise(r => setTimeout(r, stepDuration))
    }

    completeTask(taskId)
  }

  // 智能加载（带预估）
  const smartLoad = async (
    name: string,
    loader: () => Promise<any>,
    useCache = true
  ) => {
    const taskId = createTask(name)

    // 检查缓存
    if (useCache) {
      const cached = loadTimes.value.find(t => t.name === name)
      if (cached && cached.duration < 1000) {
        completeTask(taskId)
        return cached
      }
    }

    try {
      updateProgress(taskId, 10)
      const result = await loader()
      updateProgress(taskId, 90)
      completeTask(taskId)
      return result
    } catch (error) {
      failTask(taskId, (error as Error).message)
      throw error
    }
  }

  // 骨架屏内容
  const generateSkeletonHTML = (variant?: SkeletonConfig['variant'], count?: number) => {
    const v = variant || skeletonConfig.value.variant
    const c = count || skeletonConfig.value.count

    return Array(c).fill(0).map(() => {
      const baseClass = v === 'circular' ? 'skeleton-circle' : v === 'rectangular' ? 'skeleton-rect' : 'skeleton-text'
      return `<div class="${baseClass} skeleton-animated"></div>`
    }).join('')
  }

  // 加载动画样式
  const loadingAnimations = {
    shimmer: `
      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
      .skeleton-shimmer {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
      }
    `,
    pulse: `
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      .skeleton-pulse {
        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      }
    `,
    wave: `
      @keyframes wave {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
      .skeleton-wave::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
        animation: wave 1.5s infinite;
      }
    `
  }

  // 配置更新
  const updateConfig = (newConfig: Partial<LoadingConfig>) => {
    Object.assign(config.value, newConfig)
  }

  const updateSkeletonConfig = (newConfig: Partial<SkeletonConfig>) => {
    Object.assign(skeletonConfig.value, newConfig)
  }

  // 获取加载统计
  const getLoadStats = () => {
    if (loadTimes.value.length === 0) {
      return { avg: 0, min: 0, max: 0, total: 0 }
    }

    const durations = loadTimes.value.map(t => t.duration)
    return {
      avg: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
      min: Math.min(...durations),
      max: Math.max(...durations),
      total: loadTimes.value.length
    }
  }

  // 获取慢加载项
  const getSlowLoads = (threshold = 2000) => {
    return loadTimes.value
      .filter(t => t.duration > threshold)
      .sort((a, b) => b.duration - a.duration)
  }

  // 统计
  const stats = computed(() => ({
    tasks: tasks.value.length,
    activeTasks: tasks.value.filter(t => t.status === 'loading').length,
    completedTasks: tasks.value.filter(t => t.status === 'complete').length,
    failedTasks: tasks.value.filter(t => t.status === 'error').length,
    globalProgress: globalProgress.value,
    isLoading: isGlobalLoading.value,
    loadStats: getLoadStats(),
    slowLoads: getSlowLoads().length
  }))

  return {
    // 任务管理
    tasks,
    createTask,
    updateProgress,
    completeTask,
    failTask,
    createBatch,
    simulateLoading,
    smartLoad,
    // 全局加载
    isGlobalLoading,
    globalProgress,
    globalMessage,
    startGlobalLoading,
    stopGlobalLoading,
    // 性能追踪
    loadTimes,
    recordLoadTime,
    getLoadStats,
    getSlowLoads,
    // 配置
    config,
    updateConfig,
    skeletonConfig,
    updateSkeletonConfig,
    // 骨架屏
    skeletonConfig,
    generateSkeletonHTML,
    loadingAnimations,
    // 预估
    estimatedRemainingTime,
    // 统计
    stats
  }
}

export default useLoadingExperienceAdvanced
