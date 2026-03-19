// User Experience Enhancer - 用户体验深度增强
import { ref, computed, watch } from 'vue'

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced'

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto'
  language: string
  fontSize: 'small' | 'medium' | 'large'
  reducedMotion: boolean
  highContrast: boolean
  experienceLevel: ExperienceLevel
  keyboardShortcuts: boolean
  showTooltips: boolean
  autoSave: boolean
  notifications: boolean
}

export interface UsageMetrics {
  totalSessions: number
  totalTime: number
  actionsCount: Record<string, number>
  lastActivity: number
  favoriteFeatures: string[]
}

export interface OnboardingStep {
  id: string
  title: string
  description: string
  target?: string
  completed: boolean
}

export function useUserExperienceEnhancer() {
  // 用户偏好设置
  const preferences = ref<UserPreferences>({
    theme: 'auto',
    language: 'zh-CN',
    fontSize: 'medium',
    reducedMotion: false,
    highContrast: false,
    experienceLevel: 'intermediate',
    keyboardShortcuts: true,
    showTooltips: true,
    autoSave: true,
    notifications: true
  })

  // 使用指标
  const metrics = ref<UsageMetrics>({
    totalSessions: 0,
    totalTime: 0,
    actionsCount: {},
    lastActivity: Date.now(),
    favoriteFeatures: []
  })

  // 引导步骤
  const onboardingSteps = ref<OnboardingStep[]>([
    { id: 'welcome', title: '欢迎使用', description: '了解RabAi Mind的主要功能', completed: false },
    { id: 'create', title: '创建PPT', description: '选择模板并输入主题', completed: false },
    { id: 'edit', title: '编辑内容', description: '编辑和调整PPT内容', completed: false },
    { id: 'export', title: '导出分享', description: '导出为多种格式', completed: false }
  ])

  // 用户会话
  const currentSession = ref({
    startTime: Date.now(),
    actions: [] as string[]
  })

  // 加载设置
  const loadPreferences = () => {
    const saved = localStorage.getItem('user_preferences')
    if (saved) {
      try {
        preferences.value = { ...preferences.value, ...JSON.parse(saved) }
      } catch (e) {
        console.warn('Failed to load preferences:', e)
      }
    }
  }

  // 保存设置
  const savePreferences = () => {
    localStorage.setItem('user_preferences', JSON.stringify(preferences.value))
  }

  // 更新偏好
  const updatePreference = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    preferences.value[key] = value
    savePreferences()
    recordAction(`preference_change_${key}`)
  }

  // 记录动作
  const recordAction = (action: string) => {
    metrics.value.actionsCount[action] = (metrics.value.actionsCount[action] || 0) + 1
    metrics.value.lastActivity = Date.now()
    currentSession.value.actions.push(action)

    // 更新常用功能
    if (!metrics.value.favoriteFeatures.includes(action)) {
      const count = metrics.value.actionsCount[action] || 0
      if (count >= 3) {
        metrics.value.favoriteFeatures.push(action)
      }
    }
  }

  // 开始会话
  const startSession = () => {
    metrics.value.totalSessions++
    currentSession.value = {
      startTime: Date.now(),
      actions: []
    }
  }

  // 结束会话
  const endSession = () => {
    const duration = Date.now() - currentSession.value.startTime
    metrics.value.totalTime += duration

    // 保存指标
    localStorage.setItem('usage_metrics', JSON.stringify(metrics.value))
  }

  // 完成引导步骤
  const completeOnboardingStep = (stepId: string) => {
    const step = onboardingSteps.value.find(s => s.id === stepId)
    if (step) {
      step.completed = true
      recordAction(`onboarding_${stepId}`)
    }
  }

  // 重置引导
  const resetOnboarding = () => {
    onboardingSteps.value.forEach(s => s.completed = false)
  }

  // 获取引导进度
  const onboardingProgress = computed(() => {
    const completed = onboardingSteps.value.filter(s => s.completed).length
    return Math.round((completed / onboardingSteps.value.length) * 100)
  })

  // 体验级别建议
  const levelBasedSuggestions = computed(() => {
    const suggestions: string[] = []

    if (preferences.value.experienceLevel === 'beginner') {
      suggestions.push('启用工具提示以获得更多帮助')
      suggestions.push('使用模板快速创建PPT')
    } else if (preferences.value.experienceLevel === 'advanced') {
      suggestions.push('尝试使用键盘快捷键提高效率')
      suggestions.push('使用批量操作功能')
    }

    return suggestions
  })

  // 统计
  const stats = computed(() => {
    const sessionDuration = Date.now() - currentSession.value.startTime
    return {
      sessions: metrics.value.totalSessions,
      totalTime: formatDuration(metrics.value.totalTime),
      sessionTime: formatDuration(sessionDuration),
      actions: Object.keys(metrics.value.actionsCount).length,
      favoriteFeatures: metrics.value.favoriteFeatures.slice(0, 5),
      onboardingProgress: onboardingProgress.value
    }
  })

  // 格式化时长
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) return `${hours}小时${minutes % 60}分钟`
    if (minutes > 0) return `${minutes}分钟${seconds % 60}秒`
    return `${seconds}秒`
  }

  // 初始化
  loadPreferences()
  startSession()

  // 页面卸载时结束会话
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', endSession)
  }

  return {
    preferences,
    metrics,
    onboardingSteps,
    currentSession,
    onboardingProgress,
    levelBasedSuggestions,
    stats,
    updatePreference,
    recordAction,
    startSession,
    endSession,
    completeOnboardingStep,
    resetOnboarding,
    loadPreferences,
    savePreferences
  }
}

export default useUserExperienceEnhancer
