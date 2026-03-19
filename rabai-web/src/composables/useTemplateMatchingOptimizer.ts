// Template Matching Optimizer - 模板智能匹配优化
import { ref, computed } from 'vue'

export interface TemplateMatchCriteria {
  category?: string
  style?: string
  keywords?: string[]
  audience?: string
  length?: number
  industry?: string
  color?: string[]
}

export interface TemplateScore {
  templateId: string
  score: number
  matchedCriteria: string[]
  missingCriteria: string[]
}

// 模板匹配规则
const matchingRules = {
  // 关键词权重
  keywordWeights: {
    high: 10,
    medium: 5,
    low: 2
  },
  // 类别匹配权重
  categoryWeight: 15,
  // 风格匹配权重
  styleWeight: 12,
  // 行业匹配权重
  industryWeight: 10,
  // 受众匹配权重
  audienceWeight: 8
}

// 行业关键词映射
const industryKeywords: Record<string, string[]> = {
  tech: ['科技', '技术', 'AI', '软件', '互联网', '数字化', '智能', '创新'],
  finance: ['金融', '银行', '投资', '理财', '财务', '经济', '商业', '融资'],
  education: ['教育', '培训', '学习', '教学', '课程', '学校', '学生', '老师'],
  medical: ['医疗', '健康', '医药', '医学', '医院', '保健', '生物'],
  marketing: ['营销', '推广', '品牌', '销售', '市场', '广告', '运营'],
  startup: ['创业', '商业', '路演', 'BP', '融资', '企业', '公司'],
  government: ['政府', '政务', '党建', '汇报', '机关', '公务'],
  personal: ['个人', '简历', '面试', '简介', '作品集', '分享']
}

export function useTemplateMatchingOptimizer() {
  // 匹配历史
  const matchHistory = ref<TemplateScore[]>([])

  // 智能匹配
  const matchTemplates = (
    templates: any[],
    criteria: TemplateMatchCriteria
  ): TemplateScore[] => {
    const scores: TemplateScore[] = []

    for (const template of templates) {
      const result = calculateMatchScore(template, criteria)
      scores.push(result)
    }

    // 按分数排序
    scores.sort((a, b) => b.score - a.score)

    // 记录匹配历史
    if (scores.length > 0) {
      matchHistory.value.unshift(scores[0])
      if (matchHistory.value.length > 20) {
        matchHistory.value.pop()
      }
    }

    return scores
  }

  // 计算匹配分数
  const calculateMatchScore = (
    template: any,
    criteria: TemplateMatchCriteria
  ): TemplateScore => {
    let score = 0
    const matched: string[] = []
    const missing: string[] = []

    // 关键词匹配
    if (criteria.keywords && criteria.keywords.length > 0) {
      const templateTags = template.tags || []
      const templateName = template.name || ''
      const templateDesc = template.description || ''

      for (const keyword of criteria.keywords) {
        const lowerKeyword = keyword.toLowerCase()

        // 检查标签
        if (templateTags.some((t: string) => t.toLowerCase().includes(lowerKeyword))) {
          score += matchingRules.keywordWeights.high
          matched.push(`关键词: ${keyword}`)
        } else if (templateName.toLowerCase().includes(lowerKeyword)) {
          score += matchingRules.keywordWeights.medium
          matched.push(`名称含: ${keyword}`)
        } else if (templateDesc.toLowerCase().includes(lowerKeyword)) {
          score += matchingRules.keywordWeights.low
          matched.push(`描述含: ${keyword}`)
        } else {
          missing.push(`缺少: ${keyword}`)
        }
      }
    }

    // 类别匹配
    if (criteria.category) {
      if (template.category === criteria.category) {
        score += matchingRules.categoryWeight
        matched.push(`类别: ${criteria.category}`)
      } else {
        missing.push(`类别不匹配`)
      }
    }

    // 风格匹配
    if (criteria.style) {
      if (template.style === criteria.style) {
        score += matchingRules.styleWeight
        matched.push(`风格: ${criteria.style}`)
      } else {
        missing.push(`风格不匹配`)
      }
    }

    // 行业匹配
    if (criteria.industry) {
      const industryTerms = industryKeywords[criteria.industry] || []
      const hasIndustry = industryTerms.some(term =>
        template.tags?.some((t: string) => t.includes(term)) ||
        template.name?.includes(term) ||
        template.description?.includes(term)
      )

      if (hasIndustry) {
        score += matchingRules.industryWeight
        matched.push(`行业: ${criteria.industry}`)
      } else {
        missing.push(`行业不匹配`)
      }
    }

    // 长度匹配
    if (criteria.length) {
      const templateSlides = template.slides || 0
      const lengthDiff = Math.abs(templateSlides - criteria.length)

      if (lengthDiff === 0) {
        score += 10
        matched.push(`页数匹配`)
      } else if (lengthDiff <= 2) {
        score += 5
        matched.push(`页数接近`)
      } else if (lengthDiff <= 5) {
        score += 2
      } else {
        missing.push(`页数差异大`)
      }
    }

    // 归一化分数到0-100
    const normalizedScore = Math.min(100, score)

    return {
      templateId: template.id,
      score: normalizedScore,
      matchedCriteria: matched,
      missingCriteria: missing
    }
  }

  // 从文本提取匹配条件
  const extractCriteriaFromText = (text: string): TemplateMatchCriteria => {
    const criteria: TemplateMatchCriteria = {
      keywords: []
    }

    const lowerText = text.toLowerCase()

    // 提取类别
    const categories = ['business', 'education', 'tech', 'creative', 'personal', 'government']
    for (const cat of categories) {
      if (lowerText.includes(cat)) {
        criteria.category = cat
        break
      }
    }

    // 提取风格
    const styles = ['professional', 'simple', 'energetic', 'premium', 'tech', 'creative', 'elegant', 'playful']
    for (const style of styles) {
      if (lowerText.includes(style)) {
        criteria.style = style
        break
      }
    }

    // 提取行业
    for (const [industry, keywords] of Object.entries(industryKeywords)) {
      if (keywords.some(k => lowerText.includes(k))) {
        criteria.industry = industry
        break
      }
    }

    // 提取页数
    const pageMatch = text.match(/(\d+)\s*页?/)
    if (pageMatch) {
      criteria.length = parseInt(pageMatch[1])
    }

    // 提取关键词
    const importantWords = text.replace(/[，。、？！和与或的]/g, ' ').split(/\s+/).filter(w => w.length > 1)
    if (importantWords.length > 0) {
      criteria.keywords = importantWords
    }

    return criteria
  }

  // 获取最佳匹配
  const getBestMatch = (templates: any[], criteria: TemplateMatchCriteria): any | null => {
    const scores = matchTemplates(templates, criteria)
    return scores.length > 0 && scores[0].score > 30 ? templates.find(t => t.id === scores[0].templateId) : null
  }

  // 获取推荐模板
  const getRecommendations = (templates: any[], userHistory: string[] = [], limit = 5): any[] => {
    // 基于用户历史提升相关模板分数
    return templates
      .map(template => {
        let boost = 0
        if (userHistory.includes(template.category)) {
          boost += 10
        }
        if (template.popularity > 90) {
          boost += 5
        }
        return { ...template, _boost: boost }
      })
      .sort((a, b) => (b.popularity + b._boost) - (a.popularity + a._boost))
      .slice(0, limit)
  }

  // 匹配统计
  const matchStats = computed(() => ({
    totalMatches: matchHistory.value.length,
    averageScore: matchHistory.value.length > 0
      ? Math.round(matchHistory.value.reduce((sum, m) => sum + m.score, 0) / matchHistory.value.length)
      : 0,
    topScore: matchHistory.value.length > 0 ? Math.max(...matchHistory.value.map(m => m.score)) : 0
  }))

  return {
    matchHistory,
    matchTemplates,
    calculateMatchScore,
    extractCriteriaFromText,
    getBestMatch,
    getRecommendations,
    matchStats
  }
}

export default useTemplateMatchingOptimizer
