// Smart Suggestions Advanced - 智能建议高级系统
import { ref, computed, watch } from 'vue'

export type SuggestionSource = 'ai' | 'behavior' | 'context' | 'collaborative' | 'trending'
export type SuggestionUrgency = 'low' | 'medium' | 'high' | 'critical'

export interface AdvancedSuggestion {
  id: string
  type: SuggestionSource
  category: string
  title: string
  description: string
  confidence: number
  urgency: SuggestionUrgency
  impact: string
  actions: { label: string; handler: () => void }[]
  metadata: Record<string, any>
  createdAt: number
  expiresAt?: number
}

export interface SuggestionContext {
  userId?: string
  projectId?: string
  currentStep: string
  previousSteps: string[]
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night'
  dayOfWeek?: 'weekday' | 'weekend'
  device?: 'desktop' | 'mobile' | 'tablet'
}

export interface BehaviorPattern {
  trigger: string
  action: string
  frequency: number
  avgTimeSpent: number
  successRate: number
}

export function useSmartSuggestionsAdvanced() {
  // 建议列表
  const suggestions = ref<AdvancedSuggestion[]>([])

  // 行为模式
  const behaviorPatterns = ref<BehaviorPattern[]>([])

  // 上下文
  const context = ref<SuggestionContext>({
    currentStep: '',
    previousSteps: []
  })

  // 建议配置
  const config = ref({
    maxSuggestions: 10,
    autoRefresh: true,
    refreshInterval: 30000,
    enableAI: true,
    enableBehavior: true,
    enableContext: true,
    enableTrending: true
  })

  // AI建议生成
  const generateAISuggestions = (): AdvancedSuggestion[] => {
    if (!config.value.enableAI) return []

    const aiSuggestions: AdvancedSuggestion[] = []

    // 基于当前步骤的AI建议
    if (context.value.currentStep === 'editing') {
      aiSuggestions.push({
        id: `ai_${Date.now()}`,
        type: 'ai',
        category: 'content',
        title: 'AI优化建议',
        description: '检测到内容可以进一步优化，是否使用AI增强？',
        confidence: 0.85,
        urgency: 'medium',
        impact: '提升内容质量',
        actions: [
          { label: '优化内容', handler: () => {} },
          { label: '忽略', handler: () => {} }
        ],
        metadata: { model: 'gpt-4' },
        createdAt: Date.now()
      })
    }

    return aiSuggestions
  }

  // 行为建议生成
  const generateBehaviorSuggestions = (): AdvancedSuggestion[] => {
    if (!config.value.enableBehavior || behaviorPatterns.value.length === 0) return []

    const suggestions: AdvancedSuggestion[] = []

    // 找到频繁但效率低的行为
    behaviorPatterns.value.forEach(pattern => {
      if (pattern.frequency > 5 && pattern.successRate < 0.7) {
        suggestions.push({
          id: `behavior_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          type: 'behavior',
          category: 'efficiency',
          title: `优化您的${pattern.action}操作`,
          description: `您经常${pattern.trigger}，但成功率较低。建议尝试其他方式。`,
          confidence: Math.min(0.95, pattern.frequency / 20),
          urgency: 'low',
          impact: '提高效率',
          actions: [
            { label: '查看建议', handler: () => {} }
          ],
          metadata: { pattern },
          createdAt: Date.now()
        })
      }
    })

    return suggestions
  }

  // 上下文建议生成
  const generateContextSuggestions = (): AdvancedSuggestion[] => {
    if (!config.value.enableContext) return []

    const suggestions: AdvancedSuggestion[] = []

    // 基于时间
    const hour = new Date().getHours()
    if (hour >= 22 || hour < 6) {
      suggestions.push({
        id: `context_${Date.now()}`,
        type: 'context',
        category: 'lifestyle',
        title: '夜深了，注意休息',
        description: '建议保存当前工作并休息，避免熬夜影响效率。',
        confidence: 0.9,
        urgency: 'high',
        impact: '保护健康',
        actions: [
          { label: '保存草稿', handler: () => {} },
          { label: '稍后提醒', handler: () => {} }
        ],
        metadata: { timeOfDay: 'night' },
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600000
      })
    }

    // 基于设备
    if (context.value.device === 'mobile') {
      suggestions.push({
        id: `context_mobile_${Date.now()}`,
        type: 'context',
        category: 'ux',
        title: '切换到桌面端获得更好体验',
        description: '当前在移动设备上，部分功能可能受限。',
        confidence: 0.75,
        urgency: 'low',
        impact: '改善体验',
        actions: [
          { label: '知道了', handler: () => {} }
        ],
        metadata: { device: 'mobile' },
        createdAt: Date.now()
      })
    }

    return suggestions
  }

  // 协同建议
  const generateCollaborativeSuggestions = (): AdvancedSuggestion[] => {
    // 模拟基于团队的建议
    return [
      {
        id: `collab_${Date.now()}`,
        type: 'collaborative',
        category: 'team',
        title: '团队模板推荐',
        description: '您的团队成员常用此模板，效果很好。',
        confidence: 0.82,
        urgency: 'low',
        impact: '提高一致性',
        actions: [
          { label: '查看', handler: () => {} }
        ],
        metadata: { teamSize: 5 },
        createdAt: Date.now()
      }
    ]
  }

  // 热门建议
  const generateTrendingSuggestions = (): AdvancedSuggestion[] => {
    if (!config.value.enableTrending) return []

    return [
      {
        id: `trending_${Date.now()}`,
        type: 'trending',
        category: 'template',
        title: '热门模板',
        description: '本周AI产品发布模板使用量增长300%，推荐尝试。',
        confidence: 0.88,
        urgency: 'low',
        impact: '提升效果',
        actions: [
          { label: '查看', handler: () => {} }
        ],
        metadata: { trending: true, growth: 300 },
        createdAt: Date.now()
      }
    ]
  }

  // 生成所有建议
  const generateAllSuggestions = () => {
    const allSuggestions: AdvancedSuggestion[] = [
      ...generateAISuggestions(),
      ...generateBehaviorSuggestions(),
      ...generateContextSuggestions(),
      ...generateCollaborativeSuggestions(),
      ...generateTrendingSuggestions()
    ]

    // 按置信度和紧急度排序
    const urgencyWeight: Record<SuggestionUrgency, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1
    }

    allSuggestions.sort((a, b) => {
      const aScore = a.confidence * urgencyWeight[a.urgency]
      const bScore = b.confidence * urgencyWeight[b.urgency]
      return bScore - aScore
    })

    // 限制数量
    suggestions.value = allSuggestions.slice(0, config.value.maxSuggestions)

    // 过滤过期建议
    const now = Date.now()
    suggestions.value = suggestions.value.filter(s => !s.expiresAt || s.expiresAt > now)
  }

  // 记录行为
  const recordBehavior = (trigger: string, action: string, success: boolean, timeSpent: number) => {
    let pattern = behaviorPatterns.value.find(p => p.trigger === trigger && p.action === action)

    if (!pattern) {
      pattern = { trigger, action, frequency: 0, avgTimeSpent: 0, successRate: 0 }
      behaviorPatterns.value.push(pattern)
    }

    // 更新模式
    const totalAttempts = pattern.frequency
    pattern.frequency++
    pattern.avgTimeSpent = (pattern.avgTimeSpent * totalAttempts + timeSpent) / pattern.frequency

    // 更新成功率
    const successCount = pattern.successRate * totalAttempts + (success ? 1 : 0)
    pattern.successRate = successCount / pattern.frequency
  }

  // 忽略建议
  const dismissSuggestion = (id: string) => {
    suggestions.value = suggestions.value.filter(s => s.id !== id)
  }

  // 执行建议
  const executeSuggestion = (id: string) => {
    const suggestion = suggestions.value.find(s => s.id === id)
    if (suggestion && suggestion.actions.length > 0) {
      suggestion.actions[0].handler()
      dismissSuggestion(id)
    }
  }

  // 设置上下文
  const setContext = (newContext: Partial<SuggestionContext>) => {
    context.value = { ...context.value, ...newContext }
    generateAllSuggestions()
  }

  // 统计
  const stats = computed(() => ({
    totalSuggestions: suggestions.value.length,
    byType: {
      ai: suggestions.value.filter(s => s.type === 'ai').length,
      behavior: suggestions.value.filter(s => s.type === 'behavior').length,
      context: suggestions.value.filter(s => s.type === 'context').length,
      collaborative: suggestions.value.filter(s => s.type === 'collaborative').length,
      trending: suggestions.value.filter(s => s.type === 'trending').length
    },
    byUrgency: {
      critical: suggestions.value.filter(s => s.urgency === 'critical').length,
      high: suggestions.value.filter(s => s.urgency === 'high').length,
      medium: suggestions.value.filter(s => s.urgency === 'medium').length,
      low: suggestions.value.filter(s => s.urgency === 'low').length
    },
    behaviorPatterns: behaviorPatterns.value.length
  }))

  // 自动刷新
  if (typeof window !== 'undefined' && config.value.autoRefresh) {
    setInterval(generateAllSuggestions, config.value.refreshInterval)
  }

  return {
    suggestions,
    behaviorPatterns,
    context,
    config,
    stats,
    generateAllSuggestions,
    recordBehavior,
    dismissSuggestion,
    executeSuggestion,
    setContext
  }
}

export default useSmartSuggestionsAdvanced
