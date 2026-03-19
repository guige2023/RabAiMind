// AI generation optimizer composable
import { ref, computed } from 'vue'

export interface GenerationConfig {
  tone: 'professional' | 'casual' | 'academic' | 'creative'
  length: 'brief' | 'standard' | 'detailed'
  audience: 'general' | 'professional' | 'executive' | 'technical'
  language: 'zh-CN' | 'en-US'
  includeCharts: boolean
  includeImages: boolean
  slideLayout: 'title-content' | 'title-only' | 'two-column' | 'grid'
}

export interface ContentSuggestion {
  type: 'title' | 'content' | 'chart' | 'image' | 'quote'
  text: string
  confidence: number
}

const tonePrompts = {
  professional: '使用专业、正式的语言风格',
  casual: '使用轻松、友好的语言风格',
  academic: '使用严谨、学术的语言风格',
  creative: '使用富有创意、吸引人的语言风格'
}

const lengthPrompts = {
  brief: '简洁精炼，每个要点控制在一句话',
  standard: '适中，每个要点展开说明',
  detailed: '详尽完整，提供充分的内容和细节'
}

export function useAIGenerationOptimizer() {
  const config = ref<GenerationConfig>({
    tone: 'professional',
    length: 'standard',
    audience: 'general',
    language: 'zh-CN',
    includeCharts: true,
    includeImages: true,
    slideLayout: 'title-content'
  })

  const isGenerating = ref(false)
  const generationProgress = ref(0)

  // 生成优化提示词
  const getOptimizationPrompt = (baseContent: string): string => {
    const prompts: string[] = [baseContent]

    // 添加语气提示
    prompts.push(tonePrompts[config.value.tone])

    // 添加长度提示
    prompts.push(lengthPrompts[config.value.length])

    // 添加受众提示
    const audiencePrompts = {
      general: '适合普通大众理解',
      professional: '适合专业人士理解，可使用行业术语',
      executive: '适合高管决策层，突出要点和结论',
      technical: '适合技术人员，包含技术细节'
    }
    prompts.push(audiencePrompts[config.value.audience])

    return prompts.join('，')
  }

  // 生成内容建议
  const generateSuggestions = (topic: string): ContentSuggestion[] => {
    const suggestions: ContentSuggestion[] = []

    // 基于主题生成标题建议
    suggestions.push({
      type: 'title',
      text: `${topic} - 核心要点`,
      confidence: 0.95
    })

    // 生成内容建议
    if (config.value.includeCharts) {
      suggestions.push({
        type: 'chart',
        text: '数据分析和趋势图表',
        confidence: 0.85
      })
    }

    suggestions.push({
      type: 'content',
      text: getContentOutline(topic),
      confidence: 0.9
    })

    if (config.value.audience === 'executive') {
      suggestions.push({
        type: 'quote',
        text: '关键引言或名人名言',
        confidence: 0.7
      })
    }

    return suggestions
  }

  // 获取内容大纲
  const getContentOutline = (topic: string): string => {
    const outlines: Record<string, string[]> = {
      brief: ['背景介绍', '核心内容', '总结展望'],
      standard: ['背景介绍', '问题分析', '解决方案', '实施计划', '预期效果', '总结展望'],
      detailed: ['项目背景', '市场分析', '产品介绍', '商业模式', '竞争优势', '团队介绍', '财务预测', '融资计划', '风险分析', '总结与展望']
    }
    return outlines[config.value.length].join(' → ')
  }

  // 优化现有内容
  const optimizeContent = async (content: string): Promise<string> => {
    isGenerating.value = true
    generationProgress.value = 0

    // 模拟AI优化过程
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 100))
      generationProgress.value = i
    }

    const optimized = getOptimizationPrompt(content)
    isGenerating.value = false

    return optimized
  }

  // 生成PPT大纲
  const generateOutline = (topic: string, slideCount: number) => {
    const outline = []
    const baseSlides = getContentOutline(topic).split(' → ')

    for (let i = 0; i < Math.min(slideCount, baseSlides.length); i++) {
      outline.push({
        title: baseSlides[i],
        content: `${baseSlides[i]}的详细内容`,
        layout: config.value.slideLayout
      })
    }

    return outline
  }

  // 计算生成时间预估
  const estimatedTime = computed(() => {
    const baseTime = config.value.length === 'brief' ? 10 :
                     config.value.length === 'standard' ? 20 : 35
    return baseTime + (config.value.includeCharts ? 10 : 0)
  })

  // 质量评分
  const qualityScore = computed(() => {
    let score = 60 // 基础分

    // 根据配置加分
    if (config.value.tone === 'professional') score += 10
    if (config.value.length === 'detailed') score += 15
    if (config.value.audience === 'executive') score += 10
    if (config.value.includeCharts) score += 5

    return Math.min(score, 100)
  })

  return {
    config,
    isGenerating,
    generationProgress,
    estimatedTime,
    qualityScore,
    getOptimizationPrompt,
    generateSuggestions,
    optimizeContent,
    generateOutline
  }
}

export default useAIGenerationOptimizer
