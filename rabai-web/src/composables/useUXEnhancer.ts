// UX Enhancer - 用户体验增强
import { ref, computed, watch } from 'vue'

export interface UXFeature {
  id: string
  name: string
  enabled: boolean
  description: string
}

export interface UserPreference {
  key: string
  value: any
  category: 'display' | 'interaction' | 'accessibility' | 'notification'
}

export interface OnboardingStep {
  id: string
  title: string
  content: string
  target?: string
  position: 'top' | 'bottom' | 'left' | 'right' | 'center'
}

export function useUXEnhancer() {
  // 功能开关
  const features = ref<UXFeature[]>([
    { id: 'animations', name: '动效', enabled: true, description: '页面过渡和微交互动画' },
    { id: 'sounds', name: '声音', enabled: false, description: '操作提示音' },
    { id: 'haptics', name: '触觉反馈', enabled: true, description: '移动端震动反馈' },
    { id: 'tooltips', name: '工具提示', enabled: true, description: '悬停显示帮助信息' },
    { id: 'smartHints', name: '智能提示', enabled: true, description: '上下文相关建议' },
    { id: 'quickActions', name: '快捷操作', enabled: true, description: '右键菜单和快捷方式' },
    { id: 'autoPreview', name: '自动预览', enabled: true, description: '悬停时预览内容' },
    { id: 'infiniteScroll', name: '无限滚动', enabled: false, description: '自动加载更多内容' }
  ])

  // 用户偏好设置
  const preferences = ref<UserPreference[]>([
    { key: 'compactMode', value: false, category: 'display' },
    { key: 'showGrid', value: false, category: 'display' },
    { key: 'defaultView', value: 'grid', category: 'display' },
    { key: 'animationSpeed', value: 'normal', category: 'display' },
    { key: 'dragAndDrop', value: true, category: 'interaction' },
    { key: 'doubleClick', value: true, category: 'interaction' },
    { key: 'keyboardNav', value: true, category: 'interaction' },
    { key: 'reducedMotion', value: false, category: 'accessibility' },
    { key: 'highContrast', value: false, category: 'accessibility' },
    { key: 'screenReader', value: false, category: 'accessibility' },
    { key: 'soundEffects', value: false, category: 'notification' },
    { key: 'desktopNotifications', value: true, category: 'notification' },
    { key: 'emailNotifications', value: false, category: 'notification' }
  ])

  // 引导步骤
  const onboardingSteps = ref<OnboardingStep[]>([])
  const currentOnboardingStep = ref(0)
  const isOnboarding = ref(false)

  // 快捷操作菜单
  const quickActions = ref<Array<{
    id: string
    label: string
    icon: string
    action: () => void
    shortcut?: string
    category: string
  }>>([])

  // 启用/禁用功能
  const toggleFeature = (id: string) => {
    const feature = features.value.find(f => f.id === id)
    if (feature) {
      feature.enabled = !feature.enabled
    }
  }

  // 设置功能状态
  const setFeature = (id: string, enabled: boolean) => {
    const feature = features.value.find(f => f.id === id)
    if (feature) {
      feature.enabled = enabled
    }
  }

  // 获取功能状态
  const isFeatureEnabled = (id: string): boolean => {
    const feature = features.value.find(f => f.id === id)
    return feature?.enabled ?? false
  }

  // 设置偏好
  const setPreference = (key: string, value: any) => {
    const pref = preferences.value.find(p => p.key === key)
    if (pref) {
      pref.value = value
      // 保存到localStorage
      localStorage.setItem(`pref_${key}`, JSON.stringify(value))
    }
  }

  // 获取偏好
  const getPreference = <T>(key: string, defaultValue: T): T => {
    const pref = preferences.value.find(p => p.key === key)
    if (pref) {
      return pref.value as T
    }
    // 尝试从localStorage读取
    const stored = localStorage.getItem(`pref_${key}`)
    if (stored) {
      try {
        return JSON.parse(stored) as T
      } catch {
        return defaultValue
      }
    }
    return defaultValue
  }

  // 加载保存的偏好
  const loadPreferences = () => {
    preferences.value.forEach(pref => {
      const stored = localStorage.getItem(`pref_${pref.key}`)
      if (stored) {
        try {
          pref.value = JSON.parse(stored)
        } catch {
          // 忽略解析错误
        }
      }
    })
  }

  // 添加快捷操作
  const addQuickAction = (action: typeof quickActions.value[0]) => {
    quickActions.value.push(action)
  }

  // 移除快捷操作
  const removeQuickAction = (id: string) => {
    quickActions.value = quickActions.value.filter(a => a.id !== id)
  }

  // 开始引导
  const startOnboarding = (steps: OnboardingStep[]) => {
    onboardingSteps.value = steps
    currentOnboardingStep.value = 0
    isOnboarding.value = true
  }

  // 下一步
  const nextOnboardingStep = () => {
    if (currentOnboardingStep.value < onboardingSteps.value.length - 1) {
      currentOnboardingStep.value++
    } else {
      completeOnboarding()
    }
  }

  // 上一步
  const prevOnboardingStep = () => {
    if (currentOnboardingStep.value > 0) {
      currentOnboardingStep.value--
    }
  }

  // 完成引导
  const completeOnboarding = () => {
    isOnboarding.value = false
    onboardingSteps.value = []
    currentOnboardingStep.value = 0
    // 标记引导完成
    localStorage.setItem('onboarding_completed', 'true')
  }

  // 跳过引导
  const skipOnboarding = () => {
    isOnboarding.value = false
    localStorage.setItem('onboarding_skipped', 'true')
  }

  // 检查是否已完成引导
  const hasCompletedOnboarding = (): boolean => {
    return localStorage.getItem('onboarding_completed') === 'true'
  }

  // 触觉反馈
  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') => {
    if (!isFeatureEnabled('haptics') || !navigator.vibrate) return

    const patterns: Record<string, number | number[]> = {
      light: 10,
      medium: 20,
      heavy: 40,
      success: [10, 50, 10],
      warning: [20, 30, 20],
      error: [30, 50, 30]
    }

    navigator.vibrate(patterns[type] as number)
  }

  // 声音反馈
  const playSound = (type: 'click' | 'success' | 'error' | 'warning' = 'click') => {
    if (!isFeatureEnabled('sounds')) return

    // 可以在这里添加实际的音效
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    const frequencies: Record<string, number> = {
      click: 800,
      success: 1000,
      error: 400,
      warning: 600
    }

    oscillator.frequency.value = frequencies[type]
    oscillator.type = 'sine'
    gainNode.gain.value = 0.1

    oscillator.start()
    oscillator.stop(audioContext.currentTime + 0.1)
  }

  // 获取按类别分组的偏好
  const preferencesByCategory = computed(() => {
    const categories: Record<string, UserPreference[]> = {
      display: [],
      interaction: [],
      accessibility: [],
      notification: []
    }

    preferences.value.forEach(pref => {
      if (categories[pref.category]) {
        categories[pref.category].push(pref)
      }
    })

    return categories
  })

  // 获取启用的功能
  const enabledFeatures = computed(() =>
    features.value.filter(f => f.enabled)
  )

  // 初始化
  const init = () => {
    loadPreferences()

    // 检查是否需要显示引导
    if (!hasCompletedOnboarding() && !localStorage.getItem('onboarding_skipped')) {
      // 可以在这里触发引导
    }
  }

  return {
    features,
    preferences,
    preferencesByCategory,
    onboardingSteps,
    currentOnboardingStep,
    isOnboarding,
    quickActions,
    enabledFeatures,
    toggleFeature,
    setFeature,
    isFeatureEnabled,
    setPreference,
    getPreference,
    loadPreferences,
    addQuickAction,
    removeQuickAction,
    startOnboarding,
    nextOnboardingStep,
    prevOnboardingStep,
    completeOnboarding,
    skipOnboarding,
    hasCompletedOnboarding,
    triggerHaptic,
    playSound,
    init
  }
}

export default useUXEnhancer
