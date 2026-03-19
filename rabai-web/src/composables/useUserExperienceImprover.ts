// User Experience Improver - 用户体验改善
import { ref, computed } from 'vue'

export type ExperienceFeature = 'onboarding' | 'tooltips' | 'guidedTour' | 'contextualHelp' | 'quickActions' | 'notifications' | 'feedback'

export interface UserExperienceConfig {
  onboardingCompleted: boolean
  showTooltips: boolean
  showGuidedTour: boolean
  contextualHelpEnabled: boolean
  quickActionsEnabled: boolean
  notificationsEnabled: boolean
  soundEnabled: boolean
  animationEnabled: boolean
}

export interface Tooltip {
  id: string
  target: string
  content: string
  position: 'top' | 'bottom' | 'left' | 'right'
  trigger: 'hover' | 'click' | 'always'
}

export interface GuidedTourStep {
  id: string
  target: string
  title: string
  content: string
  position: 'center' | 'top' | 'bottom' | 'left' | 'right'
}

export interface QuickAction {
  id: string
  label: string
  icon: string
  shortcut?: string
  action: () => void
}

const defaultConfig: UserExperienceConfig = {
  onboardingCompleted: false,
  showTooltips: true,
  showGuidedTour: true,
  contextualHelpEnabled: true,
  quickActionsEnabled: true,
  notificationsEnabled: true,
  soundEnabled: false,
  animationEnabled: true
}

export function useUserExperienceImprover() {
  // 配置
  const config = ref<UserExperienceConfig>({ ...defaultConfig })

  // 工具提示
  const tooltips = ref<Tooltip[]>([
    { id: 'create', target: '#create-btn', content: '点击创建新的PPT', position: 'bottom', trigger: 'hover' },
    { id: 'template', target: '#template-btn', content: '浏览模板市场', position: 'bottom', trigger: 'hover' },
    { id: 'search', target: '#search-input', content: '搜索模板和内容', position: 'bottom', trigger: 'hover' },
    { id: 'export', target: '#export-btn', content: '导出您的PPT', position: 'top', trigger: 'hover' },
    { id: 'theme', target: '#theme-toggle', content: '切换深色/浅色模式', position: 'bottom', trigger: 'hover' }
  ])

  // 引导步骤
  const guidedTourSteps = ref<GuidedTourStep[]>([
    { id: 'step1', target: 'body', title: '欢迎使用 RabAi Mind', content: '让我们一起了解如何使用AI创建专业演示文稿', position: 'center' },
    { id: 'step2', target: '#create-btn', title: '创建PPT', content: '点击这里开始创建您的第一个PPT', position: 'bottom' },
    { id: 'step3', target: '#template-btn', title: '选择模板', content: '从丰富的模板库中选择', position: 'bottom' },
    { id: 'step4', target: '#ai-input', title: '描述主题', content: '告诉AI您想要的内容', position: 'top' },
    { id: 'step5', target: '#export-btn', title: '导出分享', content: '完成后导出或分享您的作品', position: 'top' }
  ])

  // 快速操作
  const quickActions = ref<QuickAction[]>([
    { id: 'new', label: '新建PPT', icon: '➕', shortcut: 'Ctrl+N', action: () => {} },
    { id: 'open', label: '打开文件', icon: '📂', shortcut: 'Ctrl+O', action: () => {} },
    { id: 'save', label: '保存', icon: '💾', shortcut: 'Ctrl+S', action: () => {} },
    { id: 'export', label: '导出', icon: '📤', shortcut: 'Ctrl+E', action: () => {} },
    { id: 'undo', label: '撤销', icon: '↩️', shortcut: 'Ctrl+Z', action: () => {} },
    { id: 'redo', label: '重做', icon: '↪️', shortcut: 'Ctrl+Shift+Z', action: () => {} },
    { id: 'theme', label: '切换主题', icon: '🌓', action: () => {} },
    { id: 'help', label: '帮助', icon: '❓', shortcut: 'F1', action: () => {} }
  ])

  // 引导状态
  const tourStep = ref(0)
  const isTourActive = ref(false)

  // 加载配置
  const loadConfig = () => {
    try {
      const stored = localStorage.getItem('ux_config')
      if (stored) {
        config.value = { ...config.value, ...JSON.parse(stored) }
      }
    } catch { /* ignore */ }
  }

  // 保存配置
  const saveConfig = () => {
    try {
      localStorage.setItem('ux_config', JSON.stringify(config.value))
    } catch { /* ignore */ }
  }

  // 更新配置
  const updateConfig = (updates: Partial<UserExperienceConfig>) => {
    config.value = { ...config.value, ...updates }
    saveConfig()
  }

  // 开始引导
  const startTour = () => {
    tourStep.value = 0
    isTourActive.value = true
  }

  // 下一步
  const nextStep = () => {
    if (tourStep.value < guidedTourSteps.value.length - 1) {
      tourStep.value++
    } else {
      endTour()
    }
  }

  // 上一步
  const prevStep = () => {
    if (tourStep.value > 0) {
      tourStep.value--
    }
  }

  // 结束引导
  const endTour = () => {
    isTourActive.value = false
    config.value.onboardingCompleted = true
    config.value.showGuidedTour = false
    saveConfig()
  }

  // 跳过引导
  const skipTour = () => {
    isTourActive.value = false
    config.value.onboardingCompleted = true
    saveConfig()
  }

  // 获取当前步骤
  const currentStep = computed(() => guidedTourSteps.value[tourStep.value])

  // 添加工具提示
  const addTooltip = (tooltip: Tooltip) => {
    tooltips.value.push(tooltip)
  }

  // 移除工具提示
  const removeTooltip = (id: string) => {
    tooltips.value = tooltips.value.filter(t => t.id !== id)
  }

  // 添加快速操作
  const addQuickAction = (action: QuickAction) => {
    quickActions.value.push(action)
  }

  // 移除快速操作
  const removeQuickAction = (id: string) => {
    quickActions.value = quickActions.value.filter(a => a.id !== id)
  }

  // 初始化
  const init = () => {
    loadConfig()
  }

  return {
    config,
    tooltips,
    guidedTourSteps,
    quickActions,
    tourStep,
    isTourActive,
    currentStep,
    updateConfig,
    startTour,
    nextStep,
    prevStep,
    endTour,
    skipTour,
    addTooltip,
    removeTooltip,
    addQuickAction,
    removeQuickAction,
    init
  }
}

export default useUserExperienceImprover
