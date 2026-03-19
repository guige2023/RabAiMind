// User Experience Pro - 用户体验深度改善
import { ref, computed, onMounted, onUnmounted } from 'vue'

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced'

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto'
  language: string
  animationLevel: 'minimal' | 'normal' | 'full'
  feedbackLevel: 'subtle' | 'medium' | 'detailed'
  keyboardShortcuts: boolean
  autoSave: boolean
}

export interface UXMetrics {
  taskCompletionRate: number
  averageTaskTime: number
  errorRate: number
  satisfactionScore: number
}

export function useUserExperiencePro() {
  // 用户偏好设置
  const preferences = ref<UserPreferences>({
    theme: 'auto',
    language: 'zh-CN',
    animationLevel: 'normal',
    feedbackLevel: 'medium',
    keyboardShortcuts: true,
    autoSave: true
  })

  // 用户体验等级
  const experienceLevel = ref<ExperienceLevel>('intermediate')

  // 使用统计
  const usageStats = ref({
    totalSessions: 0,
    totalTime: 0,
    featuresUsed: [] as string[],
    lastVisit: 0
  })

  // 任务跟踪
  const taskHistory = ref<Array<{
    task: string
    startTime: number
    endTime?: number
    completed: boolean
  }>>([])

  // 欢迎提示
  const welcomeTips = ref([
    '💡 尝试说"创建关于XX的PPT"来快速创建',
    '💡 使用语音命令可以更快捷地编辑',
    '💡 双击文字可直接编辑',
    '💡 右键点击元素可查看更多选项',
    '💡 使用快捷键Ctrl+Z撤销操作',
    '💡 可以导入自己的图片和Logo',
    '💡 支持多种导出格式',
    '💡 AI可以帮助优化文案内容'
  ])

  // 首次使用引导
  const showOnboarding = ref(false)

  // 快捷操作面板
  const quickActions = ref([
    { id: 'new', label: '新建PPT', icon: '➕', shortcut: 'Ctrl+N', action: () => {} },
    { id: 'open', label: '打开文件', icon: '📂', shortcut: 'Ctrl+O', action: () => {} },
    { id: 'save', label: '保存', icon: '💾', shortcut: 'Ctrl+S', action: () => {} },
    { id: 'export', label: '导出', icon: '📤', shortcut: 'Ctrl+E', action: () => {} },
    { id: 'undo', label: '撤销', icon: '↩️', shortcut: 'Ctrl+Z', action: () => {} },
    { id: 'redo', label: '重做', icon: '↪️', shortcut: 'Ctrl+Shift+Z', action: () => {} },
    { id: 'ai', label: 'AI助手', icon: '🤖', shortcut: 'Ctrl+M', action: () => {} },
    { id: 'help', label: '帮助', icon: '❓', shortcut: 'F1', action: () => {} }
  ])

  // 更新偏好
  const updatePreferences = (updates: Partial<UserPreferences>) => {
    preferences.value = { ...preferences.value, ...updates }
    savePreferences()
  }

  // 保存偏好到本地
  const savePreferences = () => {
    localStorage.setItem('ux_preferences', JSON.stringify(preferences.value))
  }

  // 加载偏好
  const loadPreferences = () => {
    const stored = localStorage.getItem('ux_preferences')
    if (stored) {
      try {
        preferences.value = { ...preferences.value, ...JSON.parse(stored) }
      } catch { /* ignore */ }
    }
  }

  // 记录功能使用
  const recordFeatureUsage = (feature: string) => {
    if (!usageStats.value.featuresUsed.includes(feature)) {
      usageStats.value.featuresUsed.push(feature)
    }
    usageStats.value.lastVisit = Date.now()
  }

  // 开始任务
  const startTask = (task: string) => {
    taskHistory.value.push({
      task,
      startTime: Date.now(),
      completed: false
    })
  }

  // 完成任务
  const completeTask = (task: string) => {
    const taskItem = taskHistory.value.find(t => t.task === task && !t.completed)
    if (taskItem) {
      taskItem.completed = true
      taskItem.endTime = Date.now()
    }
  }

  // 获取任务统计
  const taskStats = computed(() => {
    const completed = taskHistory.value.filter(t => t.completed)
    const total = taskHistory.value.length

    return {
      total,
      completed,
      completionRate: total > 0 ? Math.round((completed.length / total) * 100) : 0,
      averageTime: completed.length > 0
        ? Math.round(completed.reduce((sum, t) => sum + ((t.endTime || 0) - t.startTime), 0) / completed.length / 1000)
        : 0
    }
  })

  // 随机欢迎提示
  const randomTip = computed(() => {
    return welcomeTips.value[Math.floor(Math.random() * welcomeTips.value.length)]
  })

  // 获取推荐功能
  const recommendedFeatures = computed(() => {
    const used = usageStats.value.featuresUsed
    const all = quickActions.value.map(a => a.id)

    // 找出未使用的功能
    return all.filter(f => !used.includes(f)).slice(0, 3)
  })

  // 检测用户体验等级
  const detectExperienceLevel = () => {
    const sessionCount = usageStats.value.totalSessions
    const featureCount = usageStats.value.featuresUsed.length

    if (sessionCount < 3 || featureCount < 5) {
      experienceLevel.value = 'beginner'
    } else if (sessionCount < 10 || featureCount < 15) {
      experienceLevel.value = 'intermediate'
    } else {
      experienceLevel.value = 'advanced'
    }
  }

  // 获取个性化建议
  const personalizedSuggestions = computed(() => {
    const suggestions: string[] = []

    if (experienceLevel.value === 'beginner') {
      suggestions.push('建议先完成新手引导了解基本功能')
      suggestions.push('可以尝试使用模板快速创建PPT')
    }

    if (!preferences.value.keyboardShortcuts) {
      suggestions.push('开启键盘快捷键可以大幅提升效率')
    }

    if (!preferences.value.autoSave) {
      suggestions.push('开启自动保存防止内容丢失')
    }

    if (recommendedFeatures.value.length > 0) {
      suggestions.push('尝试使用' + quickActions.value.find(a => a.id === recommendedFeatures.value[0])?.label || '新功能')
    }

    return suggestions
  })

  // 启动会话
  const startSession = () => {
    usageStats.value.totalSessions++
    loadPreferences()
    detectExperienceLevel()
  }

  // 结束会话
  const endSession = () => {
    savePreferences()
  }

  // 清除数据
  const clearData = () => {
    usageStats.value = { totalSessions: 0, totalTime: 0, featuresUsed: [], lastVisit: 0 }
    taskHistory.value = []
    localStorage.removeItem('ux_preferences')
  }

  onMounted(() => {
    loadPreferences()
    detectExperienceLevel()
  })

  onUnmounted(() => {
    endSession()
  })

  return {
    preferences,
    experienceLevel,
    usageStats,
    taskHistory,
    welcomeTips,
    showOnboarding,
    quickActions,
    updatePreferences,
    recordFeatureUsage,
    startTask,
    completeTask,
    taskStats,
    randomTip,
    recommendedFeatures,
    personalizedSuggestions,
    detectExperienceLevel,
    startSession,
    endSession,
    clearData
  }
}

export default useUserExperiencePro
