// Intelligent Suggestions - 智能建议系统增强版
import { ref, computed, watch } from 'vue'

export type SuggestionType = 'contextual' | 'predictive' | 'adaptive' | 'collaborative'

export interface IntelligentSuggestion {
  id: string
  type: SuggestionType
  title: string
  description: string
  confidence: number
  context: Record<string, any>
  actions: { label: string; handler: () => void }[]
  dismissed: boolean
  createdAt: number
}

export interface UserBehaviorPattern {
  action: string
  frequency: number
  lastTriggered: number
  triggers: string[]
}

export function useIntelligentSuggestions() {
  // 智能建议
  const suggestions = ref<IntelligentSuggestion[]>([])

  // 用户行为模式
  const behaviorPatterns = ref<UserBehaviorPattern[]>([])

  // 上下文历史
  const contextHistory = ref<Record<string, any>[]>([])

  // 学习启用
  const learningEnabled = ref(true)

  // 添加建议
  const addSuggestion = (suggestion: Omit<IntelligentSuggestion, 'id' | 'dismissed' | 'createdAt'>) => {
    const newSuggestion: IntelligentSuggestion = {
      ...suggestion,
      id: `is_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      dismissed: false,
      createdAt: Date.now()
    }
    suggestions.value.push(newSuggestion)
    return newSuggestion
  }

  // 基于上下文的建议
  const generateContextualSuggestions = (context: Record<string, any>) => {
    contextHistory.value.push({ ...context, timestamp: Date.now() })
    if (contextHistory.value.length > 20) {
      contextHistory.value.shift()
    }

    const newSuggestions: IntelligentSuggestion[] = []

    // 基于页面状态
    if (context.pageCount === 0 && context.mode === 'create') {
      newSuggestions.push({
        type: 'contextual',
        title: '从模板开始',
        description: '您可能想从选择一个模板开始创建PPT',
        confidence: 0.95,
        context,
        actions: [
          { label: '浏览模板', handler: () => {} }
        ]
      })
    }

    // 基于内容长度
    if (context.contentLength > 500 && !context.hasSummary) {
      newSuggestions.push({
        type: 'contextual',
        title: '添加内容摘要',
        description: '长内容建议添加摘要便于快速浏览',
        confidence: 0.85,
        context,
        actions: [
          { label: '添加摘要', handler: () => {} }
        ]
      })
    }

    // 基于时间（早/晚）
    const hour = new Date().getHours()
    if (hour >= 22 || hour < 6) {
      newSuggestions.push({
        type: 'predictive',
        title: '深夜工作注意休息',
        description: '建议开启护眼模式或保存草稿休息',
        confidence: 0.7,
        context,
        actions: [
          { label: '开启护眼', handler: () => {} },
          { label: '保存草稿', handler: () => {} }
        ]
      })
    }

    // 添加建议
    newSuggestions.forEach(s => addSuggestion(s))

    return newSuggestions
  }

  // 基于行为模式的预测建议
  const generatePredictiveSuggestions = () => {
    if (!learningEnabled.value || behaviorPatterns.value.length < 3) return []

    const predictions: IntelligentSuggestion[] = []

    // 找到频繁使用的操作
    const frequentActions = behaviorPatterns.value
      .filter(p => p.frequency > 3)
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 3)

    frequentActions.forEach(pattern => {
      predictions.push({
        type: 'predictive',
        title: `快速${pattern.action}`,
        description: `您经常${pattern.action}，是否现在执行？`,
        confidence: Math.min(0.95, pattern.frequency / 10),
        context: { pattern },
        actions: [
          { label: '执行', handler: () => {} }
        ]
      })
    })

    predictions.forEach(p => addSuggestion(p))
    return predictions
  }

  // 记录用户行为
  const recordBehavior = (action: string, trigger?: string) => {
    let pattern = behaviorPatterns.value.find(p => p.action === action)

    if (!pattern) {
      pattern = {
        action,
        frequency: 0,
        lastTriggered: 0,
        triggers: []
      }
      behaviorPatterns.value.push(pattern)
    }

    pattern.frequency++
    pattern.lastTriggered = Date.now()
    if (trigger && !pattern.triggers.includes(trigger)) {
      pattern.triggers.push(trigger)
    }
  }

  // 忽略建议
  const dismissSuggestion = (id: string) => {
    const s = suggestions.value.find(s => s.id === id)
    if (s) s.dismissed = true
  }

  // 执行建议
  const executeSuggestion = (id: string) => {
    const s = suggestions.value.find(s => s.id === id)
    if (s && s.actions.length > 0) {
      s.actions[0].handler()
      recordBehavior(s.title, 'suggestion_executed')
    }
    dismissSuggestion(id)
  }

  // 清理旧建议
  const cleanup = () => {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
    suggestions.value = suggestions.value.filter(
      s => !s.dismissed && s.createdAt > oneDayAgo
    )
  }

  // 获取活跃建议
  const activeSuggestions = computed(() =>
    suggestions.value.filter(s => !s.dismissed).sort((a, b) => b.confidence - a.confidence)
  )

  // 统计
  const stats = computed(() => ({
    total: suggestions.value.length,
    active: activeSuggestions.value.length,
    dismissed: suggestions.value.filter(s => s.dismissed).length,
    byType: {
      contextual: suggestions.value.filter(s => s.type === 'contextual').length,
      predictive: suggestions.value.filter(s => s.type === 'predictive').length,
      adaptive: suggestions.value.filter(s => s.type === 'adaptive').length,
      collaborative: suggestions.value.filter(s => s.type === 'collaborative').length
    },
    patterns: behaviorPatterns.value.length
  }))

  // 自动清理
  setInterval(cleanup, 60 * 60 * 1000) // 每小时清理

  return {
    suggestions,
    behaviorPatterns,
    contextHistory,
    learningEnabled,
    activeSuggestions,
    stats,
    addSuggestion,
    generateContextualSuggestions,
    generatePredictiveSuggestions,
    recordBehavior,
    dismissSuggestion,
    executeSuggestion,
    cleanup
  }
}

export default useIntelligentSuggestions
