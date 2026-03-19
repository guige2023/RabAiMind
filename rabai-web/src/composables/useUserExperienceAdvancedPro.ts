// User Experience Advanced Pro - 用户体验高级优化专业版
import { ref, computed, watch } from 'vue'

export type ExperienceEventType = 'click' | 'hover' | 'scroll' | 'input' | 'navigate' | 'generate' | 'export' | 'share' | 'edit' | 'delete'

export interface ExperienceEvent {
  type: ExperienceEventType
  target: string
  timestamp: number
  duration?: number
  metadata?: Record<string, any>
}

export interface FunnelStep {
  name: string
  conversionRate: number
  dropOff: number
  avgTime: number
}

export interface UserSegmentProfile {
  id: string
  name: string
  characteristics: string[]
  recommendedFeatures: string[]
  onboardingPriority: number
}

export interface ExperienceInsight {
  id: string
  title: string
  description: string
  metric: string
  value: number
  recommendation: string
}

export function useUserExperienceAdvancedPro() {
  // 事件追踪
  const events = ref<ExperienceEvent[]>([])
  const maxEvents = 5000

  // 用户分群
  const segments = ref<UserSegmentProfile[]>([
    { id: 'new', name: '新用户', characteristics: ['首次使用', '探索中'], recommendedFeatures: ['模板', '新手引导'], onboardingPriority: 1 },
    { id: 'casual', name: '休闲用户', characteristics: ['偶尔使用', '简单需求'], recommendedFeatures: ['快速模板', '一键生成'], onboardingPriority: 2 },
    { id: 'regular', name: '常规用户', characteristics: ['定期使用', '中等需求'], recommendedFeatures: ['批量操作', '历史记录'], onboardingPriority: 3 },
    { id: 'power', name: '高级用户', characteristics: ['高频使用', '复杂需求'], recommendedFeatures: ['高级编辑', 'API集成'], onboardingPriority: 4 }
  ])

  // 当前分群
  const currentSegment = ref<string>('new')

  // 漏斗数据
  const funnelSteps = ref<FunnelStep[]>([
    { name: '访问', conversionRate: 100, dropOff: 0, avgTime: 0 },
    { name: '创建项目', conversionRate: 65, dropOff: 35, avgTime: 45000 },
    { name: '选择模板', conversionRate: 85, dropOff: 15, avgTime: 30000 },
    { name: '输入内容', conversionRate: 70, dropOff: 30, avgTime: 60000 },
    { name: '生成PPT', conversionRate: 90, dropOff: 10, avgTime: 120000 },
    { name: '导出', conversionRate: 80, dropOff: 20, avgTime: 15000 }
  ])

  // 洞察
  const insights = ref<ExperienceInsight[]>([])

  // 追踪事件
  const trackEvent = (type: ExperienceEventType, target: string, metadata?: Record<string, any>) => {
    const event: ExperienceEvent = {
      type,
      target,
      timestamp: Date.now(),
      metadata
    }

    events.value.push(event)

    // 限制事件数量
    if (events.value.length > maxEvents) {
      events.value = events.value.slice(-maxEvents)
    }

    // 实时分析
    analyzeInRealTime()
  }

  // 实时分析
  const analyzeInRealTime = () => {
    // 分析当前分群
    updateSegment()

    // 分析漏斗
    analyzeFunnel()

    // 生成洞察
    generateInsights()
  }

  // 更新分群
  const updateSegment = () => {
    const recentEvents = events.value.slice(-100)

    if (recentEvents.length < 5) {
      currentSegment.value = 'new'
      return
    }

    const eventCount = recentEvents.length
    const generateCount = recentEvents.filter(e => e.type === 'generate').length
    const exportCount = recentEvents.filter(e => e.type === 'export').length

    if (generateCount > 20 || exportCount > 10) {
      currentSegment.value = 'power'
    } else if (generateCount > 5 || exportCount > 3) {
      currentSegment.value = 'regular'
    } else if (generateCount > 0 || exportCount > 0) {
      currentSegment.value = 'casual'
    } else {
      currentSegment.value = 'new'
    }
  }

  // 分析漏斗
  const analyzeFunnel = () => {
    const recentEvents = events.value.slice(-500)

    // 简化漏斗计算
    const stepCounts: Record<string, number> = {
      '访问': recentEvents.length,
      '创建项目': recentEvents.filter(e => ['navigate', 'click'].includes(e.type)).length * 0.7,
      '选择模板': recentEvents.filter(e => ['click', 'input'].includes(e.type)).length * 0.5,
      '输入内容': recentEvents.filter(e => e.type === 'input').length * 0.4,
      '生成PPT': recentEvents.filter(e => e.type === 'generate').length * 0.3,
      '导出': recentEvents.filter(e => e.type === 'export').length * 0.2
    }

    let previousCount = stepCounts['访问']
    funnelSteps.value.forEach(step => {
      const count = stepCounts[step.name] || 0
      step.conversionRate = previousCount > 0 ? (count / previousCount) * 100 : 0
      step.dropOff = 100 - step.conversionRate
      previousCount = count
    })
  }

  // 生成洞察
  const generateInsights = () => {
    const newInsights: ExperienceInsight[] = []

    // 检测大流失步骤
    const maxDropOffStep = funnelSteps.value.reduce((max, step) =>
      step.dropOff > max.dropOff ? step : max
    , funnelSteps.value[0])

    if (maxDropOffStep && maxDropOffStep.dropOff > 30) {
      newInsights.push({
        id: `insight_${Date.now()}_1`,
        title: `优化${maxDropOffStep.name}步骤`,
        description: `该步骤流失率较高${maxDropOffStep.dropOff.toFixed(0)}%，建议简化流程`,
        metric: 'dropOff',
        value: maxDropOffStep.dropOff,
        recommendation: '考虑添加引导或简化该步骤'
      })
    }

    // 检测高频操作
    const eventCounts: Record<string, number> = {}
    events.value.slice(-100).forEach(e => {
      eventCounts[e.type] = (eventCounts[e.type] || 0) + 1
    })

    const topAction = Object.entries(eventCounts).sort((a, b) => b[1] - a[1])[0]
    if (topAction && topAction[1] > 30) {
      newInsights.push({
        id: `insight_${Date.now()}_2`,
        title: `高频操作：${topAction[0]}`,
        description: `您经常进行${topAction[0]}操作，建议使用快捷方式`,
        metric: 'frequency',
        value: topAction[1],
        recommendation: '查看快捷键或批量操作功能'
      })
    }

    insights.value = newInsights.slice(0, 5)
  }

  // 获取当前分群详情
  const getCurrentSegment = computed(() => {
    return segments.value.find(s => s.id === currentSegment.value) || segments.value[0]
  })

  // 获取推荐功能
  const recommendedFeatures = computed(() => {
    return getCurrentSegment.value?.recommendedFeatures || []
  })

  // 获取漏斗可视化数据
  const funnelData = computed(() => {
    return funnelSteps.value.map((step, index) => ({
      ...step,
      width: index === 0 ? 100 : funnelSteps.value[index - 1].conversionRate
    }))
  })

  // 获取体验评分
  const experienceScore = computed(() => {
    let score = 100

    // 扣分：漏斗流失
    const avgDropOff = funnelSteps.value.reduce((sum, s) => sum + s.dropOff, 0) / funnelSteps.value.length
    score -= avgDropOff * 0.3

    // 扣分：缺少操作
    const recentTypes = new Set(events.value.slice(-50).map(e => e.type))
    if (!recentTypes.has('generate')) score -= 10
    if (!recentTypes.has('export')) score -= 10

    return Math.max(0, Math.round(score))
  })

  // 获取优化建议
  const optimizationTips = computed(() => {
    const tips: string[] = []

    if (experienceScore.value < 70) {
      tips.push('建议完成新手引导了解核心功能')
    }

    const step = funnelSteps.value.find(s => s.dropOff > 40)
    if (step) {
      tips.push(`${step.name}步骤流失较高，建议简化`)
    }

    if (currentSegment.value === 'new') {
      tips.push('建议先选择一个模板开始')
    }

    return tips
  })

  // 统计
  const stats = computed(() => ({
    totalEvents: events.value.length,
    currentSegment: currentSegment.value,
    segmentName: getCurrentSegment.value?.name,
    funnelSteps: funnelSteps.value.length,
    insights: insights.value.length,
    experienceScore: experienceScore.value,
    optimizationTips: optimizationTips.value.length,
    recommendedFeatures: recommendedFeatures.value
  }))

  return {
    events,
    segments,
    currentSegment,
    funnelSteps,
    insights,
    funnelData,
    experienceScore,
    optimizationTips,
    recommendedFeatures,
    stats,
    trackEvent,
    analyzeInRealTime,
    updateSegment,
    analyzeFunnel,
    generateInsights
  }
}

export default useUserExperienceAdvancedPro
