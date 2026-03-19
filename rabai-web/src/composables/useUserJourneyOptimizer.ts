// User Journey Optimizer - 用户旅程优化
import { ref, computed, onMounted, onUnmounted } from 'vue'

export interface JourneyStep {
  id: string
  name: string
  category: 'awareness' | 'consideration' | 'conversion' | 'retention' | 'advocacy'
  description?: string
}

export interface UserEvent {
  id: string
  stepId: string
  type: 'view' | 'click' | 'input' | 'submit' | 'error' | 'success' | 'navigate'
  timestamp: number
  duration?: number
  metadata?: Record<string, any>
}

export interface FunnelStage {
  name: string
  count: number
  conversionRate: number
  dropOff: number
}

export interface UserSegment {
  id: string
  name: string
  criteria: Record<string, any>
  count: number
  percentage: number
}

export interface PainPoint {
  id: string
  stepId: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  frequency: number
  impact: number
  suggestion?: string
}

export interface OptimizationAction {
  id: string
  title: string
  description: string
  priority: number
  impact: 'low' | 'medium' | 'high'
  effort: 'low' | 'medium' | 'high'
  targetStep?: string
}

export function useUserJourneyOptimizer() {
  // 用户旅程步骤
  const steps = ref<JourneyStep[]>([
    { id: 'home', name: '首页', category: 'awareness', description: '用户首次访问' },
    { id: 'template', name: '选择模板', category: 'consideration', description: '浏览和选择模板' },
    { id: 'create', name: '创建项目', category: 'consideration', description: '输入主题和要求' },
    { id: 'generate', name: '生成PPT', category: 'conversion', description: 'AI生成过程' },
    { id: 'edit', name: '编辑优化', category: 'retention', description: '编辑生成的内容' },
    { id: 'export', name: '导出分享', category: 'retention', description: '导出或分享PPT' },
    { id: 'feedback', name: '反馈', category: 'advocacy', description: '用户反馈' }
  ])

  // 用户事件
  const events = ref<UserEvent[]>([])
  const maxEvents = 1000

  // 当前用户旅程
  const currentJourney = ref<string[]>([])
  const journeyStartTime = ref<number | null>(null)

  // 痛点
  const painPoints = ref<PainPoint[]>([])

  // 优化建议
  const optimizationActions = ref<OptimizationAction[]>([])

  // 用户分段
  const segments = ref<UserSegment[]>([])

  // 添加事件
  const trackEvent = (
    stepId: string,
    type: UserEvent['type'],
    metadata?: Record<string, any>,
    duration?: number
  ) => {
    const event: UserEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      stepId,
      type,
      timestamp: Date.now(),
      duration,
      metadata
    }

    events.value.push(event)

    // 更新当前旅程
    if (!currentJourney.value.includes(stepId)) {
      currentJourney.value.push(stepId)
    }

    // 限制事件数量
    if (events.value.length > maxEvents) {
      events.value.shift()
    }

    // 检查痛点
    checkForPainPoints(stepId, type)

    return event
  }

  // 便捷方法
  const trackView = (stepId: string) => trackEvent(stepId, 'view')
  const trackClick = (stepId: string, target?: string) => trackEvent(stepId, 'click', { target })
  const trackInput = (stepId: string, field: string, value: any) => trackEvent(stepId, 'input', { field, value })
  const trackSubmit = (stepId: string) => trackEvent(stepId, 'submit')
  const trackError = (stepId: string, error: string) => trackEvent(stepId, 'error', { error })
  const trackSuccess = (stepId: string, result?: any) => trackEvent(stepId, 'success', { result })
  const trackNavigate = (stepId: string, from: string, to: string) => trackEvent(stepId, 'navigate', { from, to })

  // 开始新旅程
  const startJourney = () => {
    currentJourney.value = []
    journeyStartTime.value = Date.now()
  }

  // 完成旅程
  const completeJourney = () => {
    if (journeyStartTime.value) {
      const duration = Date.now() - journeyStartTime.value
      journeyStartTime.value = null

      // 分析旅程并生成优化建议
      analyzeJourney()
      return duration
    }
    return 0
  }

  // 计算漏斗转化
  const calculateFunnel = (): FunnelStage[] => {
    const stepCounts: Record<string, number> = {}

    // 统计每个步骤的事件数
    events.value.forEach(event => {
      if (event.type === 'view') {
        stepCounts[event.stepId] = (stepCounts[event.stepId] || 0) + 1
      }
    })

    const funnel: FunnelStage[] = []
    const orderedSteps = steps.value.map(s => s.id)

    let previousCount = 0

    orderedSteps.forEach((stepId, index) => {
      const count = stepCounts[stepId] || 0
      const conversionRate = previousCount > 0 ? (count / previousCount) * 100 : 100
      const dropOff = previousCount > 0 ? previousCount - count : 0

      funnel.push({
        name: steps.value[index].name,
        count,
        conversionRate: Math.round(conversionRate * 10) / 10,
        dropOff
      })

      previousCount = count
    })

    return funnel
  }

  // 检测痛点
  const checkForPainPoints = (stepId: string, type: UserEvent['type']) => {
    const recentEvents = events.value.slice(-20)
    const stepEvents = recentEvents.filter(e => e.stepId === stepId)

    // 检测重复错误
    const errors = stepEvents.filter(e => e.type === 'error')
    if (errors.length >= 3) {
      addPainPoint(stepId, 'high', `在${steps.value.find(s => s.id === stepId)?.name}步骤出现多次错误`, errors.length, 0.8)
    }

    // 检测长时间停留
    const lastView = [...recentEvents].reverse().find(e => e.stepId === stepId && e.type === 'view')
    if (lastView && lastView.duration && lastView.duration > 30000) {
      addPainPoint(stepId, 'medium', `在${steps.value.find(s => s.id === stepId)?.name}停留时间过长`, 1, 0.5)
    }

    // 检测频繁返回
    const navigations = stepEvents.filter(e => e.type === 'navigate')
    if (navigations.length >= 2) {
      addPainPoint(stepId, 'low', `在${steps.value.find(s => s.id === stepId)?.name}频繁切换`, navigations.length, 0.3)
    }
  }

  // 添加痛点
  const addPainPoint = (
    stepId: string,
    severity: PainPoint['severity'],
    description: string,
    frequency: number,
    impact: number
  ) => {
    const existing = painPoints.value.find(p => p.stepId === stepId && p.severity === severity)
    if (!existing) {
      painPoints.value.push({
        id: `pain_${Date.now()}`,
        stepId,
        severity,
        description,
        frequency,
        impact,
        suggestion: generateSuggestion(stepId, severity)
      })
    }
  }

  // 生成建议
  const generateSuggestion = (stepId: string, severity: PainPoint['severity']): string => {
    const suggestions: Record<string, Record<string, string>> = {
      home: {
        high: '简化首页内容，突出核心功能',
        medium: '优化CTA按钮位置和文案',
        low: '增加引导提示'
      },
      template: {
        high: '优化模板加载速度',
        medium: '改进模板分类和搜索',
        low: '添加模板预览功能'
      },
      create: {
        high: '简化输入表单',
        medium: '添加输入提示和示例',
        low: '优化表单验证'
      },
      generate: {
        high: '显示详细进度',
        medium: '添加取消功能',
        low: '优化等待体验'
      },
      edit: {
        high: '简化编辑界面',
        medium: '添加快捷操作',
        low: '优化撤销功能'
      },
      export: {
        high: '简化导出流程',
        medium: '增加导出格式选项',
        low: '优化分享功能'
      }
    }

    return suggestions[stepId]?.[severity] || '建议优化此步骤'
  }

  // 分析旅程
  const analyzeJourney = () => {
    const funnel = calculateFunnel()

    // 识别转化率低的步骤
    funnel.forEach((stage, index) => {
      if (stage.conversionRate < 50 && index > 0) {
        const stepId = steps.value[index].id
        addOptimizationAction(
          `优化${stage.name}转化`,
          `当前转化率为${stage.conversionRate}%，建议简化流程或增加引导`,
          9 - index,
          'high',
          'medium',
          stepId
        )
      }
    })

    // 生成整体优化建议
    if (currentJourney.value.length < steps.value.length * 0.5) {
      addOptimizationAction(
        '提高用户完成率',
        '用户旅程完成度较低，建议优化各步骤转化',
        8,
        'high',
        'high'
      )
    }
  }

  // 添加优化操作
  const addOptimizationAction = (
    title: string,
    description: string,
    priority: number,
    impact: OptimizationAction['impact'],
    effort: OptimizationAction['effort'],
    targetStep?: string
  ) => {
    optimizationActions.value.push({
      id: `action_${Date.now()}`,
      title,
      description,
      priority,
      impact,
      effort,
      targetStep
    })

    // 按优先级排序
    optimizationActions.value.sort((a, b) => b.priority - a.priority)
  }

  // 获取用户分段
  const calculateSegments = () => {
    const journeys = groupEventsByJourney()
    const total = journeys.length

    if (total === 0) return []

    const segmentData: Record<string, number> = {
      '新用户': 0,
      '回访用户': 0,
      '活跃用户': 0,
      '潜在转化用户': 0
    }

    journeys.forEach(journey => {
      if (journey.length <= 2) segmentData['新用户']++
      else if (journey.includes('export')) segmentData['活跃用户']++
      else if (journey.includes('generate')) segmentData['潜在转化用户']++
      else segmentData['回访用户']++
    })

    segments.value = Object.entries(segmentData).map(([name, count]) => ({
      id: `segment_${name}`,
      name,
      criteria: {},
      count,
      percentage: Math.round((count / total) * 100)
    }))

    return segments.value
  }

  // 按旅程分组事件
  const groupEventsByJourney = (): string[][] => {
    const journeys: string[][] = []
    let currentJourney: string[] = []

    events.value.forEach(event => {
      if (event.type === 'view' && !currentJourney.includes(event.stepId)) {
        currentJourney.push(event.stepId)
      }

      if (event.type === 'submit' || event.type === 'success') {
        if (currentJourney.length > 0) {
          journeys.push([...currentJourney])
          currentJourney = []
        }
      }
    })

    return journeys
  }

  // 获取步骤统计
  const getStepStats = (stepId: string) => {
    const stepEvents = events.value.filter(e => e.stepId === stepId)
    const views = stepEvents.filter(e => e.type === 'view').length
    const clicks = stepEvents.filter(e => e.type === 'click').length
    const errors = stepEvents.filter(e => e.type === 'error').length
    const success = stepEvents.filter(e => e.type === 'success').length

    return {
      views,
      clicks,
      errors,
      success,
      errorRate: views > 0 ? (errors / views) * 100 : 0,
      successRate: views > 0 ? (success / views) * 100 : 0
    }
  }

  // 清除数据
  const clearData = () => {
    events.value = []
    currentJourney.value = []
    painPoints.value = []
    optimizationActions.value = []
    journeyStartTime.value = null
  }

  // 统计信息
  const stats = computed(() => ({
    totalEvents: events.value.length,
    currentJourney: currentJourney.value,
    journeySteps: currentJourney.value.length,
    totalSteps: steps.value.length,
    funnel: calculateFunnel(),
    painPoints: painPoints.value.length,
    criticalPainPoints: painPoints.value.filter(p => p.severity === 'critical' || p.severity === 'high').length,
    optimizationActions: optimizationActions.value.length,
    highImpactActions: optimizationActions.value.filter(a => a.impact === 'high').length,
    segments: segments.value.length
  }))

  // 初始化旅程
  startJourney()

  // 监听页面卸载
  onMounted(() => {
    window.addEventListener('beforeunload', () => {
      if (journeyStartTime.value) {
        completeJourney()
      }
    })
  })

  return {
    // 步骤
    steps,
    // 事件跟踪
    events,
    trackEvent,
    trackView,
    trackClick,
    trackInput,
    trackSubmit,
    trackError,
    trackSuccess,
    trackNavigate,
    // 旅程
    currentJourney,
    journeyStartTime,
    startJourney,
    completeJourney,
    // 漏斗
    calculateFunnel,
    // 痛点
    painPoints,
    addPainPoint,
    // 优化
    optimizationActions,
    addOptimizationAction,
    analyzeJourney,
    // 分段
    segments,
    calculateSegments,
    // 统计
    getStepStats,
    // 数据
    clearData,
    // 统计
    stats
  }
}

export default useUserJourneyOptimizer
