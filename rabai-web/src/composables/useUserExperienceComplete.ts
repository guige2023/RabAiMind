// User Experience Complete - 完整用户体验系统
import { ref, computed, onMounted, onUnmounted } from 'vue'

export interface UserProfile {
  id: string
  name: string
  email?: string
  avatar?: string
  preferences: UserPreferences
  createdAt: number
  lastActive: number
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto'
  language: string
  fontSize: 'small' | 'medium' | 'large'
  reducedMotion: boolean
  highContrast: boolean
  notifications: boolean
  sound: boolean
}

export interface OnboardingStep {
  id: string
  title: string
  content: string
  target?: string
  position: 'top' | 'bottom' | 'left' | 'right' | 'center'
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
  unlockedAt?: number
  progress?: number
  maxProgress?: number
}

export interface UserActivity {
  type: string
  timestamp: number
  metadata?: Record<string, any>
}

export interface Feedback {
  id: string
  type: 'bug' | 'feature' | 'improvement' | 'other'
  content: string
  status: 'pending' | 'reviewed' | 'resolved'
  createdAt: number
}

export function useUserExperienceComplete() {
  // 用户档案
  const profile = ref<UserProfile | null>(null)

  // 用户偏好
  const preferences = ref<UserPreferences>({
    theme: 'auto',
    language: 'zh-CN',
    fontSize: 'medium',
    reducedMotion: false,
    highContrast: false,
    notifications: true,
    sound: true
  })

  // 引导步骤
  const onboardingSteps = ref<OnboardingStep[]>([])
  const currentStep = ref(0)
  const isOnboardingActive = ref(false)

  // 成就系统
  const achievements = ref<Achievement[]>([
    { id: 'first_ppt', name: '首次创作', description: '创建您的第一个PPT', icon: '🎉', unlocked: false },
    { id: 'template_master', name: '模板大师', description: '使用10种不同模板', icon: '📄', unlocked: false, progress: 0, maxProgress: 10 },
    { id: 'share_master', name: '分享达人', description: '分享10个作品', icon: '📤', unlocked: false, progress: 0, maxProgress: 10 },
    { id: 'editor_pro', name: '编辑专家', description: '使用所有编辑功能', icon: '✏️', unlocked: false },
    { id: 'night_owl', name: '夜猫子', description: '在深夜使用产品', icon: '🦉', unlocked: false },
    { id: 'speed_demon', name: '速度达人', description: '5分钟内完成PPT', icon: '⚡', unlocked: false },
    { id: 'perfectionist', name: '完美主义者', description: '导出高清质量', icon: '💎', unlocked: false },
    { id: 'explorer', name: '探索者', description: '尝试所有主要功能', icon: '🔍', unlocked: false }
  ])

  // 用户活动
  const activities = ref<UserActivity[]>([])
  const maxActivities = 500

  // 反馈
  const feedbacks = ref<Feedback[]>([])

  // Toast通知
  const toasts = ref<Array<{
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message?: string
    duration: number
  }>>([])

  // 初始化用户
  const initProfile = () => {
    const saved = localStorage.getItem('user_profile')
    if (saved) {
      try {
        profile.value = JSON.parse(saved)
      } catch {
        createProfile()
      }
    } else {
      createProfile()
    }

    // 加载偏好
    const savedPrefs = localStorage.getItem('user_preferences')
    if (savedPrefs) {
      try {
        preferences.value = { ...preferences.value, ...JSON.parse(savedPrefs) }
      } catch {}
    }
  }

  // 创建档案
  const createProfile = () => {
    profile.value = {
      id: `user_${Date.now()}`,
      name: '新用户',
      preferences: { ...preferences.value },
      createdAt: Date.now(),
      lastActive: Date.now()
    }
    saveProfile()
  }

  // 保存档案
  const saveProfile = () => {
    if (profile.value) {
      localStorage.setItem('user_profile', JSON.stringify(profile.value))
    }
  }

  // 保存偏好
  const savePreferences = () => {
    localStorage.setItem('user_preferences', JSON.stringify(preferences.value))
    if (profile.value) {
      profile.value.preferences = { ...preferences.value }
      saveProfile()
    }
  }

  // 更新偏好
  const updatePreference = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    preferences.value[key] = value
    savePreferences()
    applyPreference(key, value)
  }

  // 应用偏好
  const applyPreference = (key: keyof UserPreferences, value: any) => {
    const root = document.documentElement

    switch (key) {
      case 'theme':
        root.setAttribute('data-theme', value)
        break
      case 'fontSize':
        root.style.fontSize = value === 'small' ? '14px' : value === 'large' ? '18px' : '16px'
        break
      case 'reducedMotion':
        root.style.setProperty('--animation-duration', value ? '0ms' : '300ms')
        break
      case 'highContrast':
        root.setAttribute('data-contrast', value ? 'high' : 'normal')
        break
    }
  }

  // 更新档案
  const updateProfile = (updates: Partial<UserProfile>) => {
    if (profile.value) {
      Object.assign(profile.value, updates)
      profile.value.lastActive = Date.now()
      saveProfile()
    }
  }

  // 引导系统
  const startOnboarding = (steps: OnboardingStep[]) => {
    onboardingSteps.value = steps
    currentStep.value = 0
    isOnboardingActive.value = true
    localStorage.setItem('onboarding_done', 'false')
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
    localStorage.setItem('onboarding_done', 'true')
    unlockAchievement('explorer')
  }

  const skipOnboarding = () => {
    isOnboardingActive.value = false
    localStorage.setItem('onboarding_done', 'skipped')
  }

  const hasCompletedOnboarding = () => {
    return localStorage.getItem('onboarding_done') === 'true'
  }

  // 成就系统
  const unlockAchievement = (id: string) => {
    const achievement = achievements.value.find(a => a.id === id)
    if (achievement && !achievement.unlocked) {
      achievement.unlocked = true
      achievement.unlockedAt = Date.now()
      showToast('success', '成就解锁', achievement.name)
    }
  }

  const updateProgress = (id: string, progress: number) => {
    const achievement = achievements.value.find(a => a.id === id)
    if (achievement && achievement.maxProgress) {
      achievement.progress = Math.min(progress, achievement.maxProgress)
      if (achievement.progress >= achievement.maxProgress) {
        unlockAchievement(id)
      }
    }
  }

  const incrementProgress = (id: string, amount = 1) => {
    const achievement = achievements.value.find(a => a.id === id)
    if (achievement) {
      updateProgress(id, (achievement.progress || 0) + amount)
    }
  }

  // 活动追踪
  const trackActivity = (type: string, metadata?: Record<string, any>) => {
    activities.value.push({
      type,
      timestamp: Date.now(),
      metadata
    })

    if (activities.value.length > maxActivities) {
      activities.value.shift()
    }

    // 更新最后活跃时间
    if (profile.value) {
      profile.value.lastActive = Date.now()
    }

    // 触发成就检查
    checkAchievements(type, metadata)
  }

  // 检查成就
  const checkAchievements = (type: string, metadata?: Record<string, any>) => {
    switch (type) {
      case 'create_ppt':
        unlockAchievement('first_ppt')
        incrementProgress('template_master')
        break
      case 'share_ppt':
        incrementProgress('share_master')
        break
      case 'export_hd':
        unlockAchievement('perfectionist')
        break
      case 'quick_create':
        if (metadata?.duration && metadata.duration < 300000) {
          unlockAchievement('speed_demon')
        }
        break
      case 'night_use':
        const hour = new Date().getHours()
        if (hour >= 22 || hour < 6) {
          unlockAchievement('night_owl')
        }
        break
    }
  }

  // Toast通知
  const showToast = (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string, duration = 3000) => {
    const id = `toast_${Date.now()}`
    toasts.value.push({ id, type, title, message, duration })

    setTimeout(() => {
      dismissToast(id)
    }, duration)
  }

  const dismissToast = (id: string) => {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  // 反馈系统
  const submitFeedback = (type: Feedback['type'], content: string) => {
    const feedback: Feedback = {
      id: `fb_${Date.now()}`,
      type,
      content,
      status: 'pending',
      createdAt: Date.now()
    }
    feedbacks.value.push(feedback)
    return feedback.id
  }

  // 获取活动统计
  const getActivityStats = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayActivities = activities.value.filter(a => a.timestamp >= today.getTime())
    const weekAgo = today.getTime() - 7 * 24 * 60 * 60 * 1000
    const weekActivities = activities.value.filter(a => a.timestamp >= weekAgo)

    return {
      today: todayActivities.length,
      week: weekActivities.length,
      total: activities.value.length
    }
  }

  // 统计
  const stats = computed(() => ({
    profile: profile.value ? {
      name: profile.value.name,
      created: profile.value.createdAt,
      lastActive: profile.value.lastActive,
      memberDays: Math.floor((Date.now() - profile.value.createdAt) / (1000 * 60 * 60 * 24))
    } : null,
    preferences: { ...preferences.value },
    achievements: {
      total: achievements.value.length,
      unlocked: achievements.value.filter(a => a.unlocked).length,
      progress: achievements.value.filter(a => a.progress && a.maxProgress).map(a => ({
        id: a.id,
        name: a.name,
        progress: a.progress,
        maxProgress: a.maxProgress,
        percentage: a.maxProgress ? Math.round((a.progress! / a.maxProgress) * 100) : 0
      }))
    },
    activity: getActivityStats(),
    feedback: feedbacks.value.length,
    toasts: toasts.value.length
  }))

  // 初始化
  onMounted(() => {
    initProfile()
  })

  return {
    // 用户档案
    profile,
    updateProfile,
    // 偏好
    preferences,
    updatePreference,
    savePreferences,
    // 引导
    onboardingSteps,
    currentStep,
    isOnboardingActive,
    startOnboarding,
    nextStep,
    prevStep,
    completeOnboarding,
    skipOnboarding,
    hasCompletedOnboarding,
    // 成就
    achievements,
    unlockAchievement,
    updateProgress,
    incrementProgress,
    // 活动
    activities,
    trackActivity,
    getActivityStats,
    // Toast
    toasts,
    showToast,
    dismissToast,
    // 反馈
    feedbacks,
    submitFeedback,
    // 统计
    stats
  }
}

export default useUserExperienceComplete
