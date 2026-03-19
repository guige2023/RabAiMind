// Template Matcher - 智能模板匹配深度优化
import { ref, computed } from 'vue'

export type MatchStrategy = 'keyword' | 'semantic' | 'hybrid' | 'popularity' | 'recent'

export interface MatchContext {
  userId?: string
  sessionId?: string
  previousTemplates?: string[]
  device?: 'desktop' | 'mobile' | 'tablet'
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night'
}

export interface MatchFeedback {
  templateId: string
  helpful: boolean
  selected: boolean
  timestamp: number
}

export interface SmartTemplate {
  id: string
  name: string
  category: string
  style: string
  tags: string[]
  popularity: number
  usageCount: number
  successRate: number
  avgRating: number
  lastUsed?: number
}

export function useTemplateMatcher() {
  // 匹配策略
  const strategy = ref<MatchStrategy>('hybrid')

  // 上下文
  const context = ref<MatchContext>({})

  // 匹配反馈
  const feedback = ref<MatchFeedback[]>([])

  // 模板使用统计
  const templateStats = ref<Map<string, { usageCount: number; successCount: number }>>(new Map())

  // 语义匹配 - 模拟语义分析
  const semanticAnalysis = (text: string): Record<string, number> => {
    const scores: Record<string, number> = {
      tech: 0, finance: 0, education: 0, creative: 0,
      business: 0, marketing: 0, medical: 0, government: 0
    }

    const keywords: Record<string, string[]> = {
      tech: ['AI', '人工智能', '软件', '技术', '代码', '开发', '互联网', '数字化', '智能', '科技'],
      finance: ['金融', '投资', '理财', '银行', '财务', '经济', '商业', '融资', '基金', '股票'],
      education: ['教育', '学习', '培训', '课程', '教学', '学校', '学生', '老师', '学术', '论文'],
      creative: ['创意', '设计', '艺术', '作品', '摄影', '品牌', '故事', '策划', '活动'],
      business: ['商业', '企业', '公司', '路演', '提案', '计划', '汇报', '团队', '年度'],
      marketing: ['营销', '推广', '销售', '品牌', '广告', '运营', '市场', '社交媒体', '宣传'],
      medical: ['医疗', '健康', '医药', '医院', '保健', '生物', '医学', '临床'],
      government: ['政府', '政务', '党建', '机关', '公务', '汇报', '政策']
    }

    const lowerText = text.toLowerCase()

    for (const [category, words] of Object.entries(keywords)) {
      for (const word of words) {
        if (lowerText.includes(word)) {
          scores[category] += 1
        }
      }
    }

    return scores
  }

  // 智能匹配
  const match = (
    templates: SmartTemplate[],
    query: string,
    options?: { limit?: number; minScore?: number }
  ): { template: SmartTemplate; score: number; reasons: string[] }[] => {
    const limit = options?.limit || 10
    const minScore = options?.minScore || 10

    const results: { template: SmartTemplate; score: number; reasons: string[] }[] = []

    // 语义分析
    const semanticScores = semanticAnalysis(query)

    for (const template of templates) {
      let score = 0
      const reasons: string[] = []

      // 关键词匹配
      const queryTerms = query.toLowerCase().split(/[,\s]+/).filter(t => t.length > 1)
      for (const term of queryTerms) {
        if (template.name.toLowerCase().includes(term)) {
          score += 15
          reasons.push('名称匹配')
        }
        if (template.tags?.some(t => t.toLowerCase().includes(term))) {
          score += 10
          reasons.push('标签匹配')
        }
      }

      // 语义匹配
      const categoryScore = semanticScores[template.category] || 0
      if (categoryScore > 0) {
        score += categoryScore * 5
        reasons.push('语义相关')
      }

      // 风格匹配
      if (query.toLowerCase().includes(template.style)) {
        score += 8
        reasons.push('风格匹配')
      }

      // 热度加成
      if (template.popularity > 90) {
        score += 5
        reasons.push('热门模板')
      }

      // 使用率加成
      const stats = templateStats.value.get(template.id)
      if (stats && stats.usageCount > 10) {
        score += Math.min(10, stats.usageCount / 10)
        reasons.push('常用')
      }

      // 成功率加成
      if (template.successRate > 0.8) {
        score += 5
        reasons.push('成功率高')
      }

      // 时间上下文加成
      if (context.value.timeOfDay === 'morning' && template.category === 'business') {
        score += 3
        reasons.push('适合早晨')
      }

      if (score >= minScore) {
        results.push({ template, score, reasons })
      }
    }

    // 排序
    results.sort((a, b) => b.score - a.score)

    return results.slice(0, limit)
  }

  // 记录使用
  const recordUsage = (templateId: string, successful: boolean = true) => {
    const stats = templateStats.value.get(templateId) || { usageCount: 0, successCount: 0 }
    stats.usageCount++
    if (successful) {
      stats.successCount++
    }
    templateStats.value.set(templateId, stats)
  }

  // 记录反馈
  const recordFeedback = (templateId: string, helpful: boolean, selected: boolean) => {
    feedback.value.push({
      templateId,
      helpful,
      selected,
      timestamp: Date.now()
    })

    // 保留最近100条
    if (feedback.value.length > 100) {
      feedback.value.shift()
    }
  }

  // 基于历史推荐
  const recommendFromHistory = (templates: SmartTemplate[], limit: number = 5): SmartTemplate[] => {
    if (!context.value.previousTemplates || context.value.previousTemplates.length === 0) {
      // 无历史，返回热门
      return templates
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, limit)
    }

    // 提取历史类别
    const historyCategories = new Set<string>()
    const historyTags: string[] = []

    context.value.previousTemplates.forEach(id => {
      const t = templates.find(temp => temp.id === id)
      if (t) {
        historyCategories.add(t.category)
        historyTags.push(...(t.tags || []))
      }
    })

    // 计算类别得分
    return templates
      .map(t => {
        let score = 0

        // 历史类别加成
        if (historyCategories.has(t.category)) {
          score += 20
        }

        // 历史标签加成
        const tagMatch = t.tags?.filter(tag => historyTags.includes(tag)).length || 0
        score += tagMatch * 5

        // 热度
        score += t.popularity / 10

        return { template: t, score }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(r => r.template)
  }

  // 混合策略匹配
  const matchHybrid = (
    templates: SmartTemplate[],
    query: string,
    options?: { limit?: number }
  ): { template: SmartTemplate; score: number; reasons: string[] }[] => {
    switch (strategy.value) {
      case 'keyword':
        return match(templates, query, { ...options, minScore: 20 })

      case 'semantic':
        // 纯语义，无关键词
        const semanticScores = semanticAnalysis(query)
        return templates
          .map(t => ({
            template: t,
            score: (semanticScores[t.category] || 0) * 10,
            reasons: ['语义匹配']
          }))
          .filter(r => r.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, options?.limit || 10)

      case 'popularity':
        return templates
          .map(t => ({
            template: t,
            score: t.popularity,
            reasons: ['热门']
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, options?.limit || 10)

      case 'recent':
        return templates
          .map(t => ({
            template: t,
            score: t.lastUsed ? Date.now() - t.lastUsed : 0,
            reasons: ['最近使用']
          }))
          .sort((a, b) => a.score - b.score)
          .slice(0, options?.limit || 10)

      case 'hybrid':
      default:
        return match(templates, query, options)
    }
  }

  // 统计
  const stats = computed(() => ({
    totalFeedback: feedback.value.length,
    helpfulRate: feedback.value.length > 0
      ? (feedback.value.filter(f => f.helpful).length / feedback.value.length * 100).toFixed(1) + '%'
      : '0%',
    selectionRate: feedback.value.length > 0
      ? (feedback.value.filter(f => f.selected).length / feedback.value.length * 100).toFixed(1) + '%'
      : '0%',
    trackedTemplates: templateStats.value.size,
    currentStrategy: strategy.value
  }))

  return {
    strategy,
    context,
    feedback,
    templateStats,
    semanticAnalysis,
    match,
    matchHybrid,
    recordUsage,
    recordFeedback,
    recommendFromHistory,
    stats
  }
}

export default useTemplateMatcher
