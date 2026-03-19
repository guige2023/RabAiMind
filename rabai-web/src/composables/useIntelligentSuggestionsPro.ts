// Intelligent Suggestions Pro - 智能建议专业版
import { ref, computed, watch } from 'vue'

export type SuggestionCategory =
  | 'content' | 'design' | 'layout' | 'color' | 'image'
  | 'text' | 'animation' | 'timing' | 'style' | 'optimization'

export interface Suggestion {
  id: string
  category: SuggestionCategory
  title: string
  description: string
  priority: number
  impact: 'low' | 'medium' | 'high'
  confidence: number
  actionable: boolean
  action?: () => void
  context?: Record<string, any>
  timestamp: number
}

export interface SuggestionRule {
  id: string
  name: string
  category: SuggestionCategory
  condition: (context: Record<string, any>) => boolean
  generate: (context: Record<string, any>) => Omit<Suggestion, 'id' | 'timestamp'>
  enabled: boolean
  weight: number
}

export interface SuggestionContext {
  slideCount?: number
  contentLength?: number
  imageCount?: number
  hasAnimation?: boolean
  colorScheme?: string
  fontSize?: number
  emptySlides?: number
  [key: string]: any
}

export function useIntelligentSuggestionsPro() {
  // 建议列表
  const suggestions = ref<Suggestion[]>([])

  // 规则定义
  const rules = ref<SuggestionRule[]>([])

  // 当前上下文
  const context = ref<SuggestionContext>({})

  // 历史建议（用于学习）
  const suggestionHistory = ref<{ accepted: Suggestion[]; rejected: Suggestion[] }>({
    accepted: [],
    rejected: []
  })

  // 加载状态
  const isAnalyzing = ref(false)

  // 初始化默认规则
  const initDefaultRules = () => {
    rules.value = [
      // 内容相关建议
      {
        id: 'content-balance',
        name: '内容平衡',
        category: 'content',
        condition: (ctx) => (ctx.slideCount || 0) > 0,
        generate: (ctx) => ({
          category: 'content',
          title: '内容平衡建议',
          description: `您共有${ctx.slideCount}页幻灯片，建议保持内容分布均匀`,
          priority: 8,
          impact: 'medium',
          confidence: 0.85,
          actionable: true
        }),
        enabled: true,
        weight: 1.0
      },
      {
        id: 'content-length',
        name: '内容长度',
        category: 'content',
        condition: (ctx) => (ctx.contentLength || 0) > 1000,
        generate: (ctx) => ({
          category: 'content',
          title: '精简内容',
          description: '内容较长，建议拆分成多个要点以提高可读性',
          priority: 7,
          impact: 'high',
          confidence: 0.9,
          actionable: true
        }),
        enabled: true,
        weight: 1.2
      },
      // 图片相关建议
      {
        id: 'image-quality',
        name: '图片质量',
        category: 'image',
        condition: (ctx) => (ctx.imageCount || 0) > 0,
        generate: (ctx) => ({
          category: 'image',
          title: '图片优化建议',
          description: '建议使用高分辨率图片以获得更好的显示效果',
          priority: 6,
          impact: 'medium',
          confidence: 0.8,
          actionable: true
        }),
        enabled: true,
        weight: 0.9
      },
      {
        id: 'image-count',
        name: '图片数量',
        category: 'image',
        condition: (ctx) => (ctx.imageCount || 0) === 0,
        generate: () => ({
          category: 'image',
          title: '添加图片',
          description: '建议添加图片以增强视觉吸引力',
          priority: 9,
          impact: 'high',
          confidence: 0.95,
          actionable: true
        }),
        enabled: true,
        weight: 1.1
      },
      // 设计相关建议
      {
        id: 'color-consistency',
        name: '颜色一致性',
        category: 'color',
        condition: (ctx) => !!ctx.colorScheme,
        generate: (ctx) => ({
          category: 'color',
          title: '保持配色一致',
          description: `当前使用${ctx.colorScheme}配色方案，建议保持整体风格统一`,
          priority: 7,
          impact: 'medium',
          confidence: 0.88,
          actionable: true
        }),
        enabled: true,
        weight: 1.0
      },
      // 动画相关建议
      {
        id: 'animation-usage',
        name: '动画使用',
        category: 'animation',
        condition: (ctx) => !ctx.hasAnimation,
        generate: () => ({
          category: 'animation',
          title: '添加动画效果',
          description: '适当添加动画可以增强演示效果，建议在关键页面使用',
          priority: 5,
          impact: 'low',
          confidence: 0.75,
          actionable: true
        }),
        enabled: true,
        weight: 0.7
      },
      {
        id: 'animation-overuse',
        name: '动画过度使用',
        category: 'animation',
        condition: (ctx) => (ctx.animationCount || 0) > 10,
        generate: (ctx) => ({
          category: 'animation',
          title: '减少动画',
          description: `检测到${ctx.animationCount}个动画，可能影响演示流畅度`,
          priority: 8,
          impact: 'medium',
          confidence: 0.82,
          actionable: true
        }),
        enabled: true,
        weight: 0.9
      },
      // 布局相关建议
      {
        id: 'empty-slides',
        name: '空白页面',
        category: 'layout',
        condition: (ctx) => (ctx.emptySlides || 0) > 0,
        generate: (ctx) => ({
          category: 'layout',
          title: '处理空白页面',
          description: `发现${ctx.emptySlides}个空白或内容较少的页面，建议补充内容`,
          priority: 9,
          impact: 'high',
          confidence: 0.92,
          actionable: true
        }),
        enabled: true,
        weight: 1.3
      },
      {
        id: 'layout-variety',
        name: '布局多样性',
        category: 'layout',
        condition: (ctx) => (ctx.slideCount || 0) > 5,
        generate: (ctx) => ({
          category: 'layout',
          title: '增加布局变化',
          description: '建议尝试不同的布局风格以增加视觉兴趣',
          priority: 6,
          impact: 'low',
          confidence: 0.7,
          actionable: true
        }),
        enabled: true,
        weight: 0.6
      },
      // 字体相关建议
      {
        id: 'font-size',
        name: '字体大小',
        category: 'text',
        condition: (ctx) => (ctx.fontSize || 0) < 14,
        generate: () => ({
          category: 'text',
          title: '调整字体大小',
          description: '字体可能偏小，建议适当增大以提高可读性',
          priority: 8,
          impact: 'high',
          confidence: 0.9,
          actionable: true
        }),
        enabled: true,
        weight: 1.1
      },
      // 优化建议
      {
        id: 'performance',
        name: '性能优化',
        category: 'optimization',
        condition: (ctx) => (ctx.totalSize || 0) > 5000000,
        generate: (ctx) => ({
          category: 'optimization',
          title: '文件大小优化',
          description: `当前文件较大(${Math.round((ctx.totalSize || 0) / 1024)}KB)，建议优化图片`,
          priority: 7,
          impact: 'medium',
          confidence: 0.85,
          actionable: true
        }),
        enabled: true,
        weight: 0.8
      }
    ]
  }

  // 设置上下文
  const setContext = (newContext: Partial<SuggestionContext>) => {
    context.value = { ...context.value, ...newContext }
  }

  // 触发规则评估
  const evaluateRules = () => {
    const newSuggestions: Suggestion[] = []

    rules.value.filter(r => r.enabled).forEach(rule => {
      if (rule.condition(context.value)) {
        const suggestion = rule.generate(context.value)
        newSuggestions.push({
          ...suggestion,
          id: `suggestion_${rule.id}_${Date.now()}`,
          timestamp: Date.now()
        })
      }
    })

    // 按优先级和权重排序
    newSuggestions.sort((a, b) => {
      const weightA = rules.value.find(r => r.id === a.id.split('_')[1])?.weight || 1
      const weightB = rules.value.find(r => r.id === b.id.split('_')[1])?.weight || 1
      return (b.priority * weightB) - (a.priority * weightA)
    })

    suggestions.value = newSuggestions
    return newSuggestions
  }

  // 分析内容
  const analyzeContent = async (content: any): Promise<Suggestion[]> => {
    isAnalyzing.value = true

    // 模拟分析过程
    await new Promise(r => setTimeout(r, 500))

    // 从内容中提取上下文
    const extractedContext = extractContext(content)
    setContext(extractedContext)

    // 评估规则
    const results = evaluateRules()

    isAnalyzing.value = false
    return results
  }

  // 提取上下文
  const extractContext = (content: any): SuggestionContext => {
    const ctx: SuggestionContext = {}

    if (content) {
      ctx.slideCount = content.slideCount || content.slides?.length || 0
      ctx.imageCount = content.imageCount || content.images?.length || 0
      ctx.hasAnimation = content.hasAnimation || false
      ctx.animationCount = content.animationCount || 0
      ctx.contentLength = JSON.stringify(content).length
      ctx.emptySlides = content.emptySlides || 0
      ctx.totalSize = content.totalSize || 0
    }

    return ctx
  }

  // 接受建议
  const acceptSuggestion = (id: string) => {
    const index = suggestions.value.findIndex(s => s.id === id)
    if (index > -1) {
      const [accepted] = suggestions.value.splice(index, 1)
      suggestionHistory.value.accepted.push(accepted)

      // 执行建议的操作
      if (accepted.action) {
        accepted.action()
      }

      // 根据接受情况调整权重
      adjustWeight(accepted, 1.1)
    }
  }

  // 拒绝建议
  const rejectSuggestion = (id: string) => {
    const index = suggestions.value.findIndex(s => s.id === id)
    if (index > -1) {
      const [rejected] = suggestions.value.splice(index, 1)
      suggestionHistory.value.rejected.push(rejected)

      // 根据拒绝情况调整权重
      adjustWeight(rejected, 0.9)
    }
  }

  // 调整权重
  const adjustWeight = (suggestion: Suggestion, factor: number) => {
    const ruleId = suggestion.id.split('_')[1]
    const rule = rules.value.find(r => r.id === ruleId)
    if (rule) {
      rule.weight = Math.max(0.1, Math.min(2, rule.weight * factor))
    }
  }

  // 按类别筛选
  const filterByCategory = (category: SuggestionCategory): Suggestion[] => {
    return suggestions.value.filter(s => s.category === category)
  }

  // 按优先级筛选
  const filterByPriority = (minPriority: number): Suggestion[] => {
    return suggestions.value.filter(s => s.priority >= minPriority)
  }

  // 添加自定义规则
  const addRule = (rule: Omit<SuggestionRule, 'id'>) => {
    const newRule: SuggestionRule = {
      ...rule,
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    rules.value.push(newRule)
  }

  // 启用/禁用规则
  const toggleRule = (id: string) => {
    const rule = rules.value.find(r => r.id === id)
    if (rule) {
      rule.enabled = !rule.enabled
    }
  }

  // 获取高优先级建议
  const getHighPrioritySuggestions = (): Suggestion[] => {
    return suggestions.value.filter(s => s.priority >= 8 || s.impact === 'high')
  }

  // 获取统计信息
  const stats = computed(() => ({
    total: suggestions.value.length,
    byCategory: suggestions.value.reduce((acc, s) => {
      acc[s.category] = (acc[s.category] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    highPriority: suggestions.value.filter(s => s.priority >= 8).length,
    accepted: suggestionHistory.value.accepted.length,
    rejected: suggestionHistory.value.rejected.length,
    rules: rules.value.length,
    enabledRules: rules.value.filter(r => r.enabled).length,
    isAnalyzing: isAnalyzing.value
  }))

  // 初始化
  initDefaultRules()

  return {
    // 建议
    suggestions,
    // 规则
    rules,
    addRule,
    toggleRule,
    initDefaultRules,
    // 上下文
    context,
    setContext,
    // 分析
    analyzeContent,
    evaluateRules,
    extractContext,
    // 操作
    acceptSuggestion,
    rejectSuggestion,
    // 筛选
    filterByCategory,
    filterByPriority,
    getHighPrioritySuggestions,
    // 历史
    suggestionHistory,
    // 状态
    isAnalyzing,
    // 统计
    stats
  }
}

export default useIntelligentSuggestionsPro
