// User Experience Enhancement - 用户体验增强
import { ref, computed, onMounted, onUnmounted } from 'vue'

export interface ToastConfig {
  id: string
  type: 'success' | 'error' | 'warning' | 'info' | 'loading'
  title: string
  message?: string
  duration?: number
  dismissible?: boolean
  action?: {
    label: string
    callback: () => void
  }
}

export interface OnboardingStep {
  id: string
  target?: string
  title: string
  content: string
  position: 'top' | 'bottom' | 'left' | 'right' | 'center'
  highlight?: boolean
}

export interface UserPreference {
  key: string
  value: any
  type: 'boolean' | 'number' | 'string' | 'array' | 'object'
  label: string
  description?: string
}

export interface Shortcut {
  key: string
  description: string
  action: () => void
  enabled?: boolean
}

export interface UserSession {
  id: string
  startTime: number
  lastActivity: number
  pageViews: number
  actions: number
}

export function useUserExperienceEnhancement() {
  // Toast 通知
  const toasts = ref<ToastConfig[]>([])
  const maxToasts = 5

  // 引导步骤
  const onboardingSteps = ref<OnboardingStep[]>([])
  const currentStep = ref(0)
  const isOnboardingActive = ref(false)

  // 用户偏好设置
  const preferences = ref<Map<string, UserPreference>>(new Map())

  // 键盘快捷键
  const shortcuts = ref<Shortcut[]>([])

  // 用户会话
  const session = ref<UserSession>({
    id: `session_${Date.now()}`,
    startTime: Date.now(),
    lastActivity: Date.now(),
    pageViews: 0,
    actions: 0
  })

  // 加载状态
  const loadingStates = ref<Map<string, boolean>>(new Map())

  // 错误追踪
  const errors = ref<{ message: string; timestamp: number; context?: string }[]>([])

  // Toast 操作
  const showToast = (config: Omit<ToastConfig, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const toast: ToastConfig = { ...config, id }

    toasts.value.push(toast)

    if (toasts.value.length > maxToasts) {
      toasts.value.shift()
    }

    const duration = config.duration ?? (config.type === 'loading' ? 0 : 3000)
    if (duration > 0) {
      setTimeout(() => dismissToast(id), duration)
    }

    return id
  }

  const dismissToast = (id: string) => {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  const clearAllToasts = () => {
    toasts.value = []
  }

  // 便捷方法
  const showSuccess = (title: string, message?: string) =>
    showToast({ type: 'success', title, message })

  const showError = (title: string, message?: string) =>
    showToast({ type: 'error', title, message, duration: 5000, dismissible: true })

  const showWarning = (title: string, message?: string) =>
    showToast({ type: 'warning', title, message })

  const showInfo = (title: string, message?: string) =>
    showToast({ type: 'info', title, message })

  const showLoading = (title: string, message?: string) =>
    showToast({ type: 'loading', title, message, duration: 0 })

  // 引导功能
  const startOnboarding = (steps: OnboardingStep[]) => {
    onboardingSteps.value = steps
    currentStep.value = 0
    isOnboardingActive.value = true
  }

  const nextStep = () => {
    if (currentStep.value < onboardingSteps.value.length - 1) {
      currentStep.value++
    } else {
      completeOnboarding()
    }
  }

  const prevStep = () => {
    if (currentStep.value > 0) {
      currentStep.value--
    }
  }

  const completeOnboarding = () => {
    isOnboardingActive.value = false
    localStorage.setItem('onboarding_completed', 'true')
  }

  const skipOnboarding = () => {
    isOnboardingActive.value = false
    localStorage.setItem('onboarding_skipped', 'true')
  }

  const hasSeenOnboarding = () => {
    return localStorage.getItem('onboarding_completed') === 'true' ||
           localStorage.getItem('onboarding_skipped') === 'true'
  }

  // 用户偏好设置
  const setPreference = <T>(key: string, value: T, label: string, type: UserPreference['type'], description?: string) => {
    preferences.value.set(key, { key, value, type, label, description })
    localStorage.setItem(`pref_${key}`, JSON.stringify(value))
  }

  const getPreference = <T>(key: string, defaultValue: T): T => {
    const stored = localStorage.getItem(`pref_${key}`)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        return defaultValue
      }
    }
    return defaultValue
  }

  const initPreference = <T>(key: string, defaultValue: T, label: string, type: UserPreference['type'], description?: string) => {
    const value = getPreference(key, defaultValue)
    setPreference(key, value, label, type, description)
    return value
  }

  // 键盘快捷键
  const registerShortcut = (key: string, description: string, action: () => void) => {
    shortcuts.value.push({ key, description, action, enabled: true })
  }

  const unregisterShortcut = (key: string) => {
    const index = shortcuts.value.findIndex(s => s.key === key)
    if (index > -1) {
      shortcuts.value.splice(index, 1)
    }
  }

  const toggleShortcut = (key: string) => {
    const shortcut = shortcuts.value.find(s => s.key === key)
    if (shortcut) {
      shortcut.enabled = !shortcut.enabled
    }
  }

  const handleKeydown = (e: KeyboardEvent) => {
    const key = e.ctrlKey || e.metaKey ? `ctrl+${e.key}` : e.key
    const shortcut = shortcuts.value.find(s => s.key === key && s.enabled)

    if (shortcut) {
      e.preventDefault()
      shortcut.action()
      trackAction('shortcut', key)
    }
  }

  // 会话管理
  const trackPageView = () => {
    session.value.pageViews++
    session.value.lastActivity = Date.now()
  }

  const trackAction = (type: string, detail?: string) => {
    session.value.actions++
    session.value.lastActivity = Date.now()
  }

  const getSessionDuration = () => {
    return Date.now() - session.value.startTime
  }

  const isSessionActive = (timeout = 30 * 60 * 1000) => {
    return Date.now() - session.value.lastActivity < timeout
  }

  // 加载状态
  const setLoading = (key: string, loading: boolean) => {
    loadingStates.value.set(key, loading)
  }

  const isLoading = (key: string) => {
    return loadingStates.value.get(key) || false
  }

  const isAnyLoading = computed(() => {
    return Array.from(loadingStates.value.values()).some(v => v)
  })

  // 错误追踪
  const logError = (message: string, context?: string) => {
    errors.value.push({
      message,
      timestamp: Date.now(),
      context
    })

    // 只保留最近50个错误
    if (errors.value.length > 50) {
      errors.value.shift()
    }
  }

  const clearErrors = () => {
    errors.value = []
  }

  const getRecentErrors = (count = 10) => {
    return errors.value.slice(-count)
  }

  // 统计信息
  const stats = computed(() => ({
    toasts: toasts.value.length,
    onboardingActive: isOnboardingActive.value,
    preferences: preferences.value.size,
    shortcuts: shortcuts.value.length,
    enabledShortcuts: shortcuts.value.filter(s => s.enabled).length,
    sessionDuration: getSessionDuration(),
    pageViews: session.value.pageViews,
    actions: session.value.actions,
    loadingStates: loadingStates.value.size,
    errors: errors.value.length,
    isAnyLoading: isAnyLoading.value
  }))

  // 初始化
  onMounted(() => {
    window.addEventListener('keydown', handleKeydown)
    trackPageView()
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
  })

  return {
    // Toast
    toasts,
    showToast,
    dismissToast,
    clearAllToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
    // Onboarding
    onboardingSteps,
    currentStep,
    isOnboardingActive,
    startOnboarding,
    nextStep,
    prevStep,
    completeOnboarding,
    skipOnboarding,
    hasSeenOnboarding,
    // Preferences
    preferences,
    setPreference,
    getPreference,
    initPreference,
    // Shortcuts
    shortcuts,
    registerShortcut,
    unregisterShortcut,
    toggleShortcut,
    // Session
    session,
    trackPageView,
    trackAction,
    getSessionDuration,
    isSessionActive,
    // Loading
    loadingStates,
    setLoading,
    isLoading,
    isAnyLoading,
    // Errors
    errors,
    logError,
    clearErrors,
    getRecentErrors,
    // Stats
    stats
  }
}

export default useUserExperienceEnhancement
