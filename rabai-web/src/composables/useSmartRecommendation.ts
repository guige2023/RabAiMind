import { ref, computed } from 'vue'

interface Recommendation {
  type: 'scene' | 'style' | 'template' | 'color' | 'structure' | 'quality'
  value: string
  reason: string
  confidence: number
}

// Keywords for analysis - expanded with more industries and scenarios
const sceneKeywords: Record<string, string[]> = {
  business: ['商业', '公司', '企业', '商务', '方案', '计划', '报告', '提案', '合作', '融资', 'BP', '商业计划', '招投标', '项目汇报'],
  education: ['教育', '培训', '课程', '学生', '学校', '教学', '学习', '讲座', '学术', '课件', '说课', '教案', '培训PPT'],
  tech: ['科技', '技术', 'AI', '人工智能', '软件', '互联网', '数字化', '代码', '产品发布', '技术分享', '架构', '系统'],
  creative: ['创意', '设计', '艺术', '品牌', '营销', '活动', '策划', '创意', '广告', '宣传', '发布会', '年会'],
  medical: ['医疗', '医药', '医院', '健康', '药品', '医疗设备', '病例', '诊疗'],
  finance: ['金融', '银行', '投资', '理财', '基金', '股票', '保险', '财务', '审计', '财报', '路演'],
  government: ['政府', '党建', '政务', '汇报', '规划', '政策', '红色', '党政'],
  startup: ['创业', '路演', '融资', '商业模式', '创始人', '团队介绍', '天使轮', 'A轮', 'B轮']
}

// Enhanced style keywords
const styleKeywords: Record<string, string[]> = {
  professional: ['专业', '商务', '正式', '报告', '方案', '企业', '稳重', '可靠'],
  simple: ['简约', '简单', '干净', '清爽', '极简', '清新', '淡雅'],
  energetic: ['活力', '激情', '能量', '年轻', '创新', '时尚', '动感'],
  premium: ['高端', '奢华', '品质', 'VIP', '尊贵', '大气', '磅礡'],
  creative: ['创意', '独特', '艺术', '设计', '品牌', '个性', '潮流'],
  tech: ['科技', '未来', '智能', '技术', '数字化', '赛博', '朋克'],
  elegant: ['优雅', '精致', '古典', '传统', '中国风', '水墨', '文艺'],
  playful: ['可爱', '卡通', '童趣', '活泼', '趣味', '插画']
}

const templateKeywords: Record<string, string[]> = {
  default: ['标准', '常规', '通用', '默认'],
  modern: ['现代', '简洁', '清新', '当代', '极简'],
  tech: ['科技', '未来', '技术', '数字', '互联网'],
  classic: ['经典', '传统', '正式', '大气', '古典'],
  minimalist: ['极简', '简单', '朴素', '留白'],
  bold: ['大胆', '醒目', '强烈', '对比']
}

// Slide structure recommendations based on content type
const structureRecommendations: Record<string, { layout: string[]; tips: string[] }> = {
  business: {
    layout: ['title', 'toc', 'problem', 'solution', 'market', 'team', 'financial', 'roadmap', 'contact'],
    tips: ['建议添加市场规模数据', '突出竞争优势', '展示团队背景', '包含财务预测']
  },
  education: {
    layout: ['title', 'objective', 'content', 'practice', 'summary', 'qa'],
    tips: ['使用清晰的知识结构', '添加案例分析', '包含互动环节', '提供练习题目']
  },
  product: {
    layout: ['title', 'pain_point', 'solution', 'demo', 'features', 'pricing', 'roadmap', 'contact'],
    tips: ['突出用户痛点', '展示产品演示', '清晰定价策略', '包含使用场景']
  },
  report: {
    layout: ['title', 'overview', 'data', 'analysis', 'insight', 'recommendation', 'next'],
    tips: ['使用数据可视化', '突出关键发现', '提供行动建议', '对比历史数据']
  }
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
    } else {
      // Auto-recommend slide count based on detected scene
      const detectedScene = results.find(r => r.type === 'scene')?.value
      if (detectedScene && detectedScene !== 'chart') {
        const defaultCounts: Record<string, number> = {
          business: 12,
          education: 10,
          tech: 8,
          creative: 10,
          medical: 10,
          finance: 12,
          government: 10,
          startup: 10
        }
        const count = defaultCounts[detectedScene] || 10
        results.push({
          type: 'scene',
          value: 'auto',
          reason: `根据${detectedScene}类型推荐${count}页`,
          confidence: 0.6
        })
      }
    }

    // Recommend chart if data-related keywords detected
    const dataKeywords = ['数据', '统计', '分析', '增长', '趋势', '图表', '业绩', '销售', '占比', '同比', '环比', 'KPI']
    if (dataKeywords.some(kw => lowerRequest.includes(kw))) {
      results.push({
        type: 'scene',
        value: 'chart',
        reason: '检测到数据相关内容，建议添加图表',
        confidence: 0.8
      })
    }

    // Recommend structure based on content type
    for (const [key, struct] of Object.entries(structureRecommendations)) {
      if (lowerRequest.includes(key) || results.some(r => r.value === key)) {
        results.push({
          type: 'structure',
          value: key,
          reason: struct.tips[0] || '推荐使用标准结构',
          confidence: 0.7
        })
        break
      }
    }

    // Content quality improvements
    if (request.length < 50) {
      results.push({
        type: 'quality',
        value: 'expand',
        reason: '建议补充更多细节，提升生成质量',
        confidence: 0.5
      })
    }

    // Check for target audience
    const audienceKeywords = ['CEO', '投资人', '客户', '员工', '学生', '家长', '医生', '政府']
    if (audienceKeywords.some(kw => lowerRequest.includes(kw))) {
      const audience = audienceKeywords.find(kw => lowerRequest.includes(kw))
      results.push({
        type: 'quality',
        value: 'audience',
        reason: `针对${audience}群体优化内容`,
        confidence: 0.65
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
