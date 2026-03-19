// Template Matching Pro - 模板匹配专业版
import { ref, computed } from 'vue'

export interface TemplateMatchResult {
  templateId: string
  score: number
  factors: {
    category: number
    style: number
    content: number
    color: number
    layout: number
    length: number
  }
  reasons: string[]
}

export interface MatchingWeights {
  category: number
  style: number
  content: number
  color: number
  layout: number
  length: number
}

export interface MatchingContext {
  title?: string
  description?: string
  category?: string
  style?: string
  colorScheme?: string
  contentLength?: number
  slideCount?: number
  keywords?: string[]
}

export interface Template {
  id: string
  name: string
  category: string
  style: string
  colorScheme: string
  keywords: string[]
  score: number
  usage: number
}

export function useTemplateMatchingPro() {
  // 匹配权重
  const weights = ref<MatchingWeights>({
    category: 1.5,
    style: 1.2,
    content: 1.0,
    color: 0.8,
    layout: 1.0,
    length: 0.5
  })

  // 匹配历史
  const matchHistory = ref<{ context: MatchingContext; result: TemplateMatchResult[] }[]>([])

  // 候选模板库
  const candidateTemplates = ref<Template[]>([])

  // 匹配阈值
  const matchThreshold = ref(0.3)

  // 最大返回结果数
  const maxResults = ref(5)

  // 设置权重
  const setWeights = (newWeights: Partial<MatchingWeights>) => {
    Object.assign(weights.value, newWeights)
  }

  // 重置权重
  const resetWeights = () => {
    weights.value = {
      category: 1.5,
      style: 1.2,
      content: 1.0,
      color: 0.8,
      layout: 1.0,
      length: 0.5
    }
  }

  // 计算类别匹配度
  const calculateCategoryScore = (template: Template, context: MatchingContext): number => {
    if (!context.category) return 0.5

    const templateCategory = template.category.toLowerCase()
    const contextCategory = context.category.toLowerCase()

    // 精确匹配
    if (templateCategory === contextCategory) return 1.0

    // 部分匹配
    if (templateCategory.includes(contextCategory) || contextCategory.includes(templateCategory)) {
      return 0.7
    }

    // 相关类别
    const relatedCategories: Record<string, string[]> = {
      'business': ['corporate', 'professional', 'enterprise'],
      'education': ['academic', 'learning', 'training'],
      'creative': ['design', 'artistic', 'modern'],
      'personal': ['portfolio', 'resume', 'informal']
    }

    for (const [key, related] of Object.entries(relatedCategories)) {
      if (templateCategory === key && related.some(r => contextCategory.includes(r))) {
        return 0.6
      }
    }

    return 0.2
  }

  // 计算风格匹配度
  const calculateStyleScore = (template: Template, context: MatchingContext): number => {
    if (!context.style) return 0.5

    const templateStyle = template.style.toLowerCase()
    const contextStyle = context.style.toLowerCase()

    if (templateStyle === contextStyle) return 1.0
    if (templateStyle.includes(contextStyle) || contextStyle.includes(templateStyle)) return 0.8

    // 相似风格
    const similarStyles: Record<string, string[]> = {
      'modern': ['contemporary', 'minimalist', 'clean'],
      'classic': ['traditional', 'elegant', 'formal'],
      'creative': ['innovative', 'unique', 'artistic']
    }

    for (const [key, similar] of Object.entries(similarStyles)) {
      if (templateStyle === key && similar.some(s => contextStyle.includes(s))) {
        return 0.6
      }
    }

    return 0.3
  }

  // 计算内容匹配度
  const calculateContentScore = (template: Template, context: MatchingContext): number => {
    if (!context.keywords || context.keywords.length === 0) return 0.5

    const templateKeywords = template.keywords.map(k => k.toLowerCase())
    const contextKeywords = context.keywords.map(k => k.toLowerCase())

    let matches = 0
    contextKeywords.forEach(kw => {
      if (templateKeywords.some(tk => tk.includes(kw) || kw.includes(tk))) {
        matches++
      }
    })

    return Math.min(matches / contextKeywords.length, 1.0)
  }

  // 计算配色匹配度
  const calculateColorScore = (template: Template, context: MatchingContext): number => {
    if (!context.colorScheme) return 0.5

    const templateColor = template.colorScheme.toLowerCase()
    const contextColor = context.colorScheme.toLowerCase()

    if (templateColor === contextColor) return 1.0
    if (templateColor.includes(contextColor) || contextColor.includes(templateColor)) return 0.7

    // 相似配色
    const colorFamilies: Record<string, string[]> = {
      'blue': ['navy', 'sky', 'indigo', 'teal'],
      'warm': ['orange', 'red', 'yellow', 'amber'],
      'neutral': ['gray', 'slate', 'zinc', 'stone']
    }

    for (const [family, colors] of Object.entries(colorFamilies)) {
      if (templateColor === family && colors.some(c => contextColor.includes(c))) {
        return 0.5
      }
    }

    return 0.2
  }

  // 计算长度匹配度
  const calculateLengthScore = (template: Template, context: MatchingContext): number => {
    if (!context.slideCount) return 0.5

    const diff = Math.abs((template.score || 10) - (context.slideCount || 10))
    const maxDiff = 20

    return Math.max(1 - diff / maxDiff, 0)
  }

  // 智能匹配
  const matchTemplates = (
    templates: Template[],
    context: MatchingContext
  ): TemplateMatchResult[] => {
    if (templates.length === 0) return []

    const results: TemplateMatchResult[] = templates.map(template => {
      // 计算各维度分数
      const categoryScore = calculateCategoryScore(template, context)
      const styleScore = calculateStyleScore(template, context)
      const contentScore = calculateContentScore(template, context)
      const colorScore = calculateColorScore(template, context)
      const lengthScore = calculateLengthScore(template, context)

      // 计算加权总分
      const totalScore = (
        categoryScore * weights.value.category +
        styleScore * weights.value.style +
        contentScore * weights.value.content +
        colorScore * weights.value.color +
        lengthScore * weights.value.length
      ) / (
        weights.value.category +
        weights.value.style +
        weights.value.content +
        weights.value.color +
        weights.value.length
      )

      // 生成原因
      const reasons: string[] = []
      if (categoryScore > 0.8) reasons.push('类别高度匹配')
      if (styleScore > 0.8) reasons.push('风格一致')
      if (contentScore > 0.7) reasons.push('内容关键词匹配')
      if (colorScore > 0.8) reasons.push('配色方案匹配')
      if (lengthScore > 0.8) reasons.push('页数合适')

      results.push({
        templateId: template.id,
        score: Math.round(totalScore * 100) / 100,
        factors: {
          category: Math.round(categoryScore * 100) / 100,
          style: Math.round(styleScore * 100) / 100,
          content: Math.round(contentScore * 100) / 100,
          color: Math.round(colorScore * 100) / 100,
          layout: 0.5,
          length: Math.round(lengthScore * 100) / 100
        },
        reasons
      })
    })

    // 按分数排序
    results.sort((a, b) => b.score - a.score)

    // 过滤低于阈值的結果
    const filtered = results.filter(r => r.score >= matchThreshold.value)

    // 限制返回数量
    const limited = filtered.slice(0, maxResults.value)

    // 记录历史
    matchHistory.value.push({ context, result: limited })

    return limited
  }

  // 模糊匹配
  const fuzzyMatch = (templates: Template[], query: string): Template[] => {
    const normalizedQuery = query.toLowerCase().trim()
    if (!normalizedQuery) return templates

    const words = normalizedQuery.split(/\s+/)

    return templates
      .map(template => {
        let score = 0

        // 名称匹配
        words.forEach(word => {
          if (template.name.toLowerCase().includes(word)) score += 3
        })

        // 关键词匹配
        words.forEach(word => {
          template.keywords.forEach(kw => {
            if (kw.toLowerCase().includes(word)) score += 2
          })
        })

        // 类别匹配
        if (template.category.toLowerCase().includes(normalizedQuery)) score += 1

        // 风格匹配
        if (template.style.toLowerCase().includes(normalizedQuery)) score += 1

        return { template, score }
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.template)
  }

  // 相似模板推荐
  const findSimilar = (templateId: string, templates: Template[]): Template[] => {
    const target = templates.find(t => t.id === templateId)
    if (!target) return []

    const results = templates
      .filter(t => t.id !== templateId)
      .map(t => ({
        template: t,
        similarity: (
          calculateCategoryScore(t, { category: target.category }) * 0.3 +
          calculateStyleScore(t, { style: target.style }) * 0.3 +
          calculateContentScore(t, { keywords: target.keywords }) * 0.2 +
          calculateColorScore(t, { colorScheme: target.colorScheme }) * 0.2
        )
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3)
      .map(item => item.template)

    return results
  }

  // 学习优化
  const learnFromChoice = (context: MatchingContext, chosenTemplateId: string) => {
    const historyEntry = matchHistory.value.find(h =>
      h.context.category === context.category &&
      h.context.style === context.style
    )

    if (historyEntry) {
      const chosen = historyEntry.result.find(r => r.templateId === chosenTemplateId)
      if (chosen) {
        // 调整权重
        if (chosen.factors.category > 0.8) weights.value.category *= 1.1
        if (chosen.factors.style > 0.8) weights.value.style *= 1.1
        if (chosen.factors.content > 0.8) weights.value.content *= 1.1
      }
    }
  }

  // 统计
  const stats = computed(() => ({
    matchCount: matchHistory.value.length,
    averageScore: matchHistory.value.length > 0
      ? matchHistory.value.reduce((sum, h) =>
          sum + (h.result[0]?.score || 0), 0) / matchHistory.value.length
      : 0,
    weights: { ...weights.value },
    threshold: matchThreshold.value,
    maxResults: maxResults.value
  }))

  return {
    // 权重
    weights,
    setWeights,
    resetWeights,
    // 匹配
    matchTemplates,
    fuzzyMatch,
    findSimilar,
    learnFromChoice,
    // 配置
    matchThreshold,
    maxResults,
    // 历史
    matchHistory,
    // 统计
    stats
  }
}

export default useTemplateMatchingPro
