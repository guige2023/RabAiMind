// User Experience Improver - 用户体验改善
import { ref, computed, watch, onMounted } from 'vue'

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert'

export interface UserProfile {
  id: string
  name: string
  email: string
  avatar?: string
  experienceLevel: ExperienceLevel
  createdAt: number
  lastActiveAt: number
  preferences: UserPreferences
}

export interface UserPreferences {
  language: string
  timezone: string
  notifications: {
    email: boolean
    push: boolean
    desktop: boolean
  }
  privacy: {
    showProfile: boolean
    showActivity: boolean
  }
  accessibility: {
    fontSize: 'small' | 'medium' | 'large'
    highContrast: boolean
    reducedMotion: boolean
    screenReader: boolean
  }
}

export interface OnboardingProgress {
  currentStep: number
  totalSteps: number
  completed: boolean
  skipped: boolean
}

export interface UserActivity {
  date: string
  action: string
  details: string
}

const defaultPreferences: UserPreferences = {
  language: 'zh-CN',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  notifications: {
    email: true,
    push: true,
    desktop: false
  },
  privacy: {
    showProfile: true,
    showActivity: true
  },
  accessibility: {
    fontSize: 'medium',
    highContrast: false,
    reducedMotion: false,
    screenReader: false
  }
}

export function useUserExperience() {
  // 用户配置
  const profile = ref<UserProfile | null>(null)

  // 引导进度
  const onboarding = ref<OnboardingProgress>({
    currentStep: 0,
    totalSteps: 5,
    completed: false,
    skipped: false
  })

  // 用户活动
  const activities = ref<UserActivity[]>([])

  // 使用统计
  const usageStats = ref({
    totalSessions: 0,
    totalTime: 0,
    presentationsCreated: 0,
    templatesUsed: 0,
    exportsCount: 0
  })

  // 加载用户配置
  const loadProfile = (): UserProfile | null => {
    try {
      const stored = localStorage.getItem('user_profile')
      if (stored) {
        profile.value = JSON.parse(stored)
        return profile.value
      }
    } catch (e) {
      console.error('Failed to load profile:', e)
    }
    return null
  }

  // 保存用户配置
  const saveProfile = () => {
    if (profile.value) {
      localStorage.setItem('user_profile', JSON.stringify(profile.value))
    }
  }

  // 创建新用户
  const createProfile = (name: string, email: string): UserProfile => {
    const newProfile: UserProfile = {
      id: `user_${Date.now()}`,
      name,
      email,
      experienceLevel: 'beginner',
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      preferences: { ...defaultPreferences }
    }

    profile.value = newProfile
    saveProfile()
    return newProfile
  }

  // 更新用户资料
  const updateProfile = (updates: Partial<UserProfile>) => {
    if (profile.value) {
      profile.value = { ...profile.value, ...updates }
      profile.value.lastActiveAt = Date.now()
      saveProfile()
    }
  }

  // 更新偏好设置
  const updatePreferences = (prefs: Partial<UserPreferences>) => {
    if (profile.value) {
      profile.value.preferences = { ...profile.value.preferences, ...prefs }
      profile.value.lastActiveAt = Date.now()
      saveProfile()
      applyPreferences()
    }
  }

  // 应用偏好设置
  const applyPreferences = () => {
    if (!profile.value) return

    const { accessibility } = profile.value.preferences

    // 字体大小
    const root = document.documentElement
    const fontSizes = { small: '14px', medium: '16px', large: '18px' }
    root.style.fontSize = fontSizes[accessibility.fontSize]

    // 高对比度
    if (accessibility.highContrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }

    // 减少动画
    if (accessibility.reducedMotion) {
      root.classList.add('reduced-motion')
    } else {
      root.classList.remove('reduced-motion')
    }
  }

  // 记录活动
  const logActivity = (action: string, details: string) => {
    const activity: UserActivity = {
      date: new Date().toISOString(),
      action,
      details
    }

    activities.value.unshift(activity)

    // 限制活动数量
    if (activities.value.length > 100) {
      activities.value = activities.value.slice(0, 100)
    }

    // 保存到localStorage
    localStorage.setItem('user_activities', JSON.stringify(activities.value))
  }

  // 加载活动历史
  const loadActivities = () => {
    try {
      const stored = localStorage.getItem('user_activities')
      if (stored) {
        activities.value = JSON.parse(stored)
      }
    } catch (e) {
      console.error('Failed to load activities:', e)
    }
  }

  // 更新使用统计
  const incrementStat = (stat: keyof typeof usageStats.value) => {
    if (stat in usageStats.value) {
      (usageStats.value as any)[stat]++
      localStorage.setItem('usage_stats', JSON.stringify(usageStats.value))
    }
  }

  // 加载使用统计
  const loadUsageStats = () => {
    try {
      const stored = localStorage.getItem('usage_stats')
      if (stored) {
        usageStats.value = JSON.parse(stored)
      }
    } catch (e) {
      console.error('Failed to load usage stats:', e)
    }
  }

  // 引导步骤
  const onboardingSteps = [
    { id: 'welcome', title: '欢迎', content: '欢迎使用RabAi Mind AI PPT生成平台' },
    { id: 'create', title: '创建PPT', content: '输入主题，AI自动为您生成演示文稿' },
    { id: 'template', title: '选择模板', content: '从丰富的模板库中选择适合的样式' },
    { id: 'edit', title: '编辑内容', content: '生成后可自由编辑和调整' },
    { id: 'export', title: '导出分享', content: '支持多种格式导出和在线分享' }
  ]

  // 开始引导
  const startOnboarding = () => {
    onboarding.value = {
      currentStep: 0,
      totalSteps: onboardingSteps.length,
      completed: false,
      skipped: false
    }
    logActivity('onboarding_start', 'Started onboarding')
  }

  // 下一步
  const nextOnboardingStep = () => {
    if (onboarding.value.currentStep < onboarding.value.totalSteps - 1) {
      onboarding.value.currentStep++
    } else {
      completeOnboarding()
    }
  }

  // 上一步
  const prevOnboardingStep = () => {
    if (onboarding.value.currentStep > 0) {
      onboarding.value.currentStep--
    }
  }

  // 完成引导
  const completeOnboarding = () => {
    onboarding.value.completed = true
    localStorage.setItem('onboarding_completed', 'true')

    // 更新用户经验等级
    if (profile.value) {
      profile.value.experienceLevel = 'intermediate'
      saveProfile()
    }

    logActivity('onboarding_complete', 'Completed onboarding')
  }

  // 跳过引导
  const skipOnboarding = () => {
    onboarding.value.skipped = true
    localStorage.setItem('onboarding_skipped', 'true')
    logActivity('onboarding_skip', 'Skipped onboarding')
  }

  // 检查是否需要引导
  const needsOnboarding = (): boolean => {
    return !localStorage.getItem('onboarding_completed') &&
           !localStorage.getItem('onboarding_skipped')
  }

  // 获取欢迎消息
  const welcomeMessage = computed(() => {
    if (!profile.value) return '欢迎使用'

    const hour = new Date().getHours()
    let greeting = '您好'

    if (hour < 6) greeting = '夜深了'
    else if (hour < 12) greeting = '早上好'
    else if (hour < 14) greeting = '中午好'
    else if (hour < 18) greeting = '下午好'
    else greeting = '晚上好'

    return `${greeting}，${profile.value.name}`
  })

  // 用户等级徽章
  const experienceBadge = computed(() => {
    if (!profile.value) return { label: '访客', color: '#999' }

    const badges: Record<ExperienceLevel, { label: string; color: string }> = {
      beginner: { label: '新手', color: '#52c41a' },
      intermediate: { label: '熟练', color: '#1890ff' },
      advanced: { label: '专家', color: '#722ed1' },
      expert: { label: '大师', color: '#faad14' }
    }

    return badges[profile.value.experienceLevel]
  })

  // 统计最近7天的活动
  const recentActivityCount = computed(() => {
    const now = Date.now()
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000

    return activities.value.filter(a => {
      return new Date(a.date).getTime() > sevenDaysAgo
    }).length
  })

  // 初始化
  const init = () => {
    loadProfile()
    loadActivities()
    loadUsageStats()

    if (needsOnboarding()) {
      startOnboarding()
    }

    // 应用偏好
    applyPreferences()
  }

  return {
    // 状态
    profile,
    onboarding,
    onboardingSteps,
    activities,
    usageStats,
    // 方法
    createProfile,
    updateProfile,
    updatePreferences,
    logActivity,
    startOnboarding,
    nextOnboardingStep,
    prevOnboardingStep,
    completeOnboarding,
    skipOnboarding,
    needsOnboarding,
    incrementStat,
    loadProfile,
    applyPreferences,
    // 计算属性
    welcomeMessage,
    experienceBadge,
    recentActivityCount,
    // 初始化
    init
  }
}

export default useUserExperience
