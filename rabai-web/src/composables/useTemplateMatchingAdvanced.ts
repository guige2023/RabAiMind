// Template Matching Advanced - 模板智能匹配高级优化
import { ref, computed } from 'vue'

export type MatchAlgorithm = 'keyword' | 'semantic' | 'ml' | 'hybrid'

export interface TemplateFeature {
  id: string
  name: string
  category: string
  style: string
  tags: string[]
  color: string
  popularity: number
  rating: number
  usageCount: number
  responseTime: number
}

export interface MatchResult {
  template: TemplateFeature
  score: number
  matchDetails: { type: string; score: number }[]
}

export function useTemplateMatchingAdvanced() {
  // 匹配算法
  const algorithm = ref<MatchAlgorithm>('hybrid')

  // 模板特征库
  const templateFeatures = ref<TemplateFeature[]>([])

  // 匹配历史
  const matchHistory = ref<MatchResult[]>([])

  // 用户偏好
  const userPreferences = ref({
    favoriteCategories: [] as string[],
    favoriteStyles: [] as string[],
    recentTemplates: [] as string[]
  })

  // 语义相似度计算
  const calculateSemanticSimilarity = (text1: string, text2: string): number => {
    const words1 = new Set(text1.toLowerCase().split(/[\s,]/))
    const words2 = new Set(text2.toLowerCase().split(/[\s,]/))

    const intersection = new Set([...words1].filter(x => words2.has(x)))
    const union = new Set([...words1, ...words2])

    return union.size > 0 ? intersection.size / union.size : 0
  }

  // 关键词匹配
  const keywordMatch = (template: TemplateFeature, query: string): number => {
    const queryLower = query.toLowerCase()
    let score = 0

    // 名称匹配
    if (template.name.toLowerCase().includes(queryLower)) {
      score += 30
    }

    // 标签匹配
    template.tags.forEach(tag => {
      if (tag.toLowerCase().includes(queryLower)) {
        score += 15
      }
    })

    // 类别匹配
    if (template.category.toLowerCase().includes(queryLower)) {
      score += 20
    }

    // 风格匹配
    if (template.style.toLowerCase().includes(queryLower)) {
      score += 10
    }

    return Math.min(100, score)
  }

  // 语义匹配
  const semanticMatch = (template: TemplateFeature, query: string): number => {
    const templateText = [template.name, template.tags.join(' '), template.category, template.style].join(' ')
    const similarity = calculateSemanticSimilarity(query, templateText)
    return similarity * 100
  }

  // ML风格匹配（模拟）
  const mlMatch = (template: TemplateFeature, query: string): number => {
    let score = 0

    // 基于热度的分数
    score += Math.min(20, template.popularity / 5)

    // 基于评分的分数
    score += template.rating * 5

    // 基于使用次数
    score += Math.min(15, template.usageCount / 100)

    // 基于响应时间（越快越好）
    if (template.responseTime < 1000) score += 10
    else if (template.responseTime < 2000) score += 5

    // 用户偏好加成
    if (userPreferences.value.favoriteCategories.includes(template.category)) {
      score += 15
    }
    if (userPreferences.value.favoriteStyles.includes(template.style)) {
      score += 10
    }
    if (userPreferences.value.recentTemplates.includes(template.id)) {
      score += 20
    }

    return Math.min(100, score)
  }

  // 混合匹配
  const hybridMatch = (template: TemplateFeature, query: string): number => {
    const keywordScore = keywordMatch(template, query) * 0.4
    const semanticScore = semanticMatch(template, query) * 0.3
    const mlScore = mlMatch(template, query) * 0.3

    return keywordScore + semanticScore + mlScore
  }

  // 执行匹配
  const match = (query: string, templates: TemplateFeature[], options?: { limit?: number }): MatchResult[] => {
    const limit = options?.limit || 10

    // 选择匹配算法
    const matchFn = {
      keyword: (t: TemplateFeature) => ({ template: t, score: keywordMatch(t, query), matchDetails: [{ type: 'keyword', score: keywordMatch(t, query) }] }),
      semantic: (t: TemplateFeature) => ({ template: t, score: semanticMatch(t, query), matchDetails: [{ type: 'semantic', score: semanticMatch(t, query) }] }),
      ml: (t: TemplateFeature) => ({ template: t, score: mlMatch(t, query), matchDetails: [{ type: 'ml', score: mlMatch(t, query) }] }),
      hybrid: (t: TemplateFeature) => {
        const k = keywordMatch(t, query)
        const s = semanticMatch(t, query)
        const m = mlMatch(t, query)
        return {
          template: t,
          score: k * 0.4 + s * 0.3 + m * 0.3,
          matchDetails: [
            { type: 'keyword', score: k },
            { type: 'semantic', score: s },
            { type: 'ml', score: m }
          ]
        }
      }
    }

    // 执行匹配
    const results = templates
      .map(matchFn[algorithm.value])
      .filter(r => r.score > 5)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)

    // 记录历史
    if (results.length > 0) {
      matchHistory.value.unshift(...results)
      if (matchHistory.value.length > 100) {
        matchHistory.value = matchHistory.value.slice(0, 100)
      }
    }

    return results
  }

  // 智能推荐
  const recommend = (templates: TemplateFeature[], userId?: string): MatchResult[] => {
    // 基于用户历史的推荐
    const recentTemplates = userPreferences.value.recentTemplates

    if (recentTemplates.length === 0) {
      // 无历史，返回热门
      return templates
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 10)
        .map(t => ({ template: t, score: t.popularity, matchDetails: [{ type: 'popularity', score: t.popularity }] }))
    }

    // 基于类别偏好
    const categoryCounts: Record<string, number> = {}
    recentTemplates.forEach(id => {
      const t = templates.find(temp => temp.id === id)
      if (t) {
        categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1
      }
    })

    const topCategory = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0]

    return templates
      .filter(t => t.category === topCategory)
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 10)
      .map(t => ({ template: t, score: 80, matchDetails: [{ type: 'category', score: 80 }] }))
  }

  // 更新用户偏好
  const updatePreferences = (templateId: string) => {
    const template = templateFeatures.value.find(t => t.id === templateId)
    if (!template) return

    // 添加到最近使用
    userPreferences.value.recentTemplates.unshift(templateId)
    if (userPreferences.value.recentTemplates.length > 20) {
      userPreferences.value.recentTemplates.pop()
    }

    // 更新类别偏好
    if (!userPreferences.value.favoriteCategories.includes(template.category)) {
      userPreferences.value.favoriteCategories.push(template.category)
    }

    // 更新风格偏好
    if (!userPreferences.value.favoriteStyles.includes(template.style)) {
      userPreferences.value.favoriteStyles.push(template.style)
    }
  }

  // 统计
  const stats = computed(() => ({
    totalMatches: matchHistory.value.length,
    avgScore: matchHistory.value.length > 0
      ? (matchHistory.value.reduce((sum, r) => sum + r.score, 0) / matchHistory.value.length).toFixed(1)
      : '0',
    topScore: matchHistory.value.length > 0
      ? Math.max(...matchHistory.value.map(r => r.score)).toFixed(1)
      : '0',
    algorithm: algorithm.value,
    favoriteCategories: userPreferences.value.favoriteCategories.length,
    favoriteStyles: userPreferences.value.favoriteStyles.length
  }))

  return {
    algorithm,
    templateFeatures,
    matchHistory,
    userPreferences,
    stats,
    match,
    recommend,
    updatePreferences,
    keywordMatch,
    semanticMatch,
    mlMatch,
    hybridMatch
  }
}

export default useTemplateMatchingAdvanced
