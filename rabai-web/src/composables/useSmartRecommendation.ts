import { ref, computed } from 'vue'

interface Recommendation {
  type: 'scene' | 'style' | 'template' | 'color'
  value: string
  reason: string
  confidence: number
}

// Keywords for analysis
const sceneKeywords: Record<string, string[]> = {
  business: ['商业', '公司', '企业', '商务', '方案', '计划', '报告', '提案', '合作', '融资'],
  education: ['教育', '培训', '课程', '学生', '学校', '教学', '学习', '讲座', '学术'],
  tech: ['科技', '技术', 'AI', '人工智能', '软件', '互联网', '数字化', '代码', '产品发布'],
  creative: ['创意', '设计', '艺术', '品牌', '营销', '活动', '策划', '创意']
}

const styleKeywords: Record<string, string[]> = {
  professional: ['专业', '商务', '正式', '报告', '方案', '企业'],
  simple: ['简约', '简单', '干净', '清爽', '极简'],
  energetic: ['活力', '激情', '能量', '年轻', '创新'],
  premium: ['高端', '奢华', '品质', 'VIP', '尊贵'],
  creative: ['创意', '独特', '艺术', '设计', '品牌'],
  tech: ['科技', '未来', '智能', '技术', '数字化']
}

const templateKeywords: Record<string, string[]> = {
  default: ['标准', '常规', '通用', '默认'],
  modern: ['现代', '简洁', '清新', '当代'],
  tech: ['科技', '未来', '技术', '数字'],
  classic: ['经典', '传统', '正式', '大气']
}

export function useSmartRecommendation() {
  const recommendations = ref<Recommendation[]>([])
  const isAnalyzing = ref(false)

  // Analyze user request and generate recommendations
  const analyzeRequest = (request: string): Recommendation[] => {
    if (!request || request.length < 5) return []

    const results: Recommendation[] = []
    const lowerRequest = request.toLowerCase()

    // Analyze scene
    for (const [scene, keywords] of Object.entries(sceneKeywords)) {
      const matches = keywords.filter(kw => lowerRequest.includes(kw)).length
      if (matches > 0) {
        results.push({
          type: 'scene',
          value: scene,
          reason: `检测到"${keywords.find(kw => lowerRequest.includes(kw))}"相关内容`,
          confidence: Math.min(matches * 0.3, 0.9)
        })
        break
      }
    }

    // Analyze style
    for (const [style, keywords] of Object.entries(styleKeywords)) {
      const matches = keywords.filter(kw => lowerRequest.includes(kw)).length
      if (matches > 0) {
        results.push({
          type: 'style',
          value: style,
          reason: `适合${keywords[0]}风格`,
          confidence: Math.min(matches * 0.3, 0.85)
        })
        break
      }
    }

    // Analyze template
    for (const [template, keywords] of Object.entries(templateKeywords)) {
      const matches = keywords.filter(kw => lowerRequest.includes(kw)).length
      if (matches > 0) {
        results.push({
          type: 'template',
          value: template,
          reason: `${keywords[0]}模板`,
          confidence: Math.min(matches * 0.25, 0.8)
        })
        break
      }
    }

    // Auto-detect slide count from request
    const slideMatch = request.match(/(\d+)\s*页?/)
    if (slideMatch) {
      const slideCount = parseInt(slideMatch[1])
      if (slideCount >= 5 && slideCount <= 30) {
        results.push({
          type: 'scene',
          value: 'auto',
          reason: `自动设置${slideCount}页`,
          confidence: 0.7
        })
      }
    }

    // Recommend chart if data-related keywords detected
    const dataKeywords = ['数据', '统计', '分析', '增长', '趋势', '图表', '业绩', '销售', '占比']
    if (dataKeywords.some(kw => lowerRequest.includes(kw))) {
      results.push({
        type: 'scene',
        value: 'chart',
        reason: '建议添加数据图表',
        confidence: 0.75
      })
    }

    return results.sort((a, b) => b.confidence - a.confidence)
  }

  // Get recommendation for a specific type
  const getRecommendation = (type: string): Recommendation | undefined => {
    return recommendations.value.find(r => r.type === type)
  }

  // Apply recommendations to form
  const applyRecommendations = (results: Recommendation[], applyFn: (type: string, value: string) => void) => {
    results.forEach(r => {
      applyFn(r.type, r.value)
    })
  }

  return {
    recommendations,
    isAnalyzing,
    analyzeRequest,
    getRecommendation,
    applyRecommendations
  }
}
