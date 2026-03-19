// AI Understanding Optimizer - AI理解能力优化
import { ref, computed } from 'vue'

export interface AIContext {
  topic: string
  keywords: string[]
  audience: string
  tone: string
  style: string
  length: string
}

export interface UnderstandingResult {
  intent: 'create' | 'edit' | 'improve' | 'convert' | 'explain'
  confidence: number
  entities: string[]
  suggestions: string[]
  context: AIContext
}

export interface PromptTemplate {
  id: string
  name: string
  template: string
  variables: string[]
}

// Intent recognition patterns
const intentPatterns = {
  create: ['创建', '生成', '制作', 'make', 'create', 'generate'],
  edit: ['编辑', '修改', '调整', 'edit', 'modify', 'change'],
  improve: ['优化', '改善', '提升', 'improve', 'enhance', 'better'],
  convert: ['转换', '改成', '变成', 'convert', 'transform', 'change to'],
  explain: ['解释', '说明', '讲解', 'explain', 'describe', 'what is']
}

// Industry keywords
const industryKeywords: Record<string, string[]> = {
  tech: ['科技', '技术', 'AI', '软件', '互联网', '数字化', 'tech', 'software'],
  finance: ['金融', '银行', '投资', '理财', 'finance', 'investment'],
  education: ['教育', '培训', '学习', 'education', 'training', 'course'],
  medical: ['医疗', '健康', '医药', 'medical', 'health', 'doctor'],
  marketing: ['营销', '推广', '品牌', 'marketing', 'brand', 'advertising'],
  startup: ['创业', '融资', '商业计划', 'startup', 'business plan']
}

export function useAIUnderstanding() {
  const isProcessing = ref(false)
  const lastResult = ref<UnderstandingResult | null>(null)

  // 分析用户输入
  const analyzeInput = (input: string): UnderstandingResult => {
    isProcessing.value = true
    const lowerInput = input.toLowerCase()

    // 识别意图
    const intent = recognizeIntent(lowerInput)

    // 提取实体
    const entities = extractEntities(input)

    // 提取关键词
    const keywords = extractKeywords(input)

    // 识别受众
    const audience = recognizeAudience(lowerInput)

    // 识别语气
    const tone = recognizeTone(lowerInput)

    // 识别风格
    const style = recognizeStyle(lowerInput)

    // 识别长度
    const length = recognizeLength(lowerInput)

    const result: UnderstandingResult = {
      intent,
      confidence: calculateConfidence(intent, entities, keywords),
      entities,
      suggestions: generateSuggestions(intent, keywords),
      context: {
        topic: extractTopic(input),
        keywords,
        audience,
        tone,
        style,
        length
      }
    }

    lastResult.value = result
    isProcessing.value = false

    return result
  }

  // 识别意图
  const recognizeIntent = (input: string): UnderstandingResult['intent'] => {
    for (const [intent, patterns] of Object.entries(intentPatterns)) {
      if (patterns.some(p => input.includes(p))) {
        return intent as UnderstandingResult['intent']
      }
    }
    return 'create' // 默认创建
  }

  // 提取实体
  const extractEntities = (input: string): string[] => {
    const entities: string[] = []

    // 提取数字（页数）
    const pageMatch = input.match(/(\d+)\s*页?/)
    if (pageMatch) {
      entities.push(`pages:${pageMatch[1]}`)
    }

    // 提取时间
    const timePatterns = ['分钟', '小时', 'min', 'hour']
    for (const pattern of timePatterns) {
      if (input.includes(pattern)) {
        const match = input.match(/(\d+)\s*分钟/) || input.match(/(\d+)\s*小时/)
        if (match) {
          entities.push(`duration:${match[1]}`)
        }
      }
    }

    return entities
  }

  // 提取关键词
  const extractKeywords = (input: string): string[] => {
    const keywords: string[] = []

    // 行业关键词
    for (const [industry, indKeywords] of Object.entries(industryKeywords)) {
      if (indKeywords.some(k => input.toLowerCase().includes(k))) {
        keywords.push(industry)
      }
    }

    return keywords
  }

  // 识别受众
  const recognizeAudience = (input: string): string => {
    if (input.includes('高管') || input.includes('老板') || input.includes('CEO')) return 'executive'
    if (input.includes('专业') || input.includes('技术') || input.includes('工程师')) return 'technical'
    if (input.includes('学生') || input.includes('教学') || input.includes('老师')) return 'educational'
    return 'general'
  }

  // 识别语气
  const recognizeTone = (input: string): string => {
    if (input.includes('正式') || input.includes('专业')) return 'professional'
    if (input.includes('轻松') || input.includes('活泼')) return 'casual'
    if (input.includes('学术') || input.includes('严谨')) return 'academic'
    return 'neutral'
  }

  // 识别风格
  const recognizeStyle = (input: string): string => {
    if (input.includes('创意') || input.includes('独特')) return 'creative'
    if (input.includes('简约') || input.includes('简洁')) return 'minimalist'
    if (input.includes('科技') || input.includes('未来')) return 'tech'
    if (input.includes('高端') || input.includes('大气')) return 'premium'
    return 'standard'
  }

  // 识别长度
  const recognizeLength = (input: string): string => {
    if (input.includes('简短') || input.includes('简洁') || input.includes('brief')) return 'brief'
    if (input.includes('详细') || input.includes('详尽') || input.includes('详细')) return 'detailed'
    return 'standard'
  }

  // 提取主题
  const extractTopic = (input: string): string => {
    // 移除常见动词和描述词
    const cleaned = input
      .replace(/创建|生成|制作|做一个|帮我做/gi, '')
      .replace(/PPT|演示|幻灯片/gi, '')
      .trim()

    return cleaned || input
  }

  // 计算置信度
  const calculateConfidence = (
    intent: string,
    entities: string[],
    keywords: string[]
  ): number => {
    let confidence = 0.5 // 基础置信度

    if (entities.length > 0) confidence += 0.2
    if (keywords.length > 0) confidence += 0.15

    // 根据意图清晰度调整
    if (intent !== 'create') confidence += 0.15

    return Math.min(confidence, 0.95)
  }

  // 生成建议
  const generateSuggestions = (
    intent: string,
    keywords: string[]
  ): string[] => {
    const suggestions: string[] = []

    // 基于关键词生成建议
    if (keywords.includes('tech')) {
      suggestions.push('推荐科技风格模板')
      suggestions.push('包含数据可视化图表')
    }
    if (keywords.includes('finance')) {
      suggestions.push('添加财务数据展示')
      suggestions.push('包含增长趋势图表')
    }
    if (keywords.includes('education')) {
      suggestions.push('使用清晰的知识结构')
      suggestions.push('添加案例分析')
    }

    // 基于意图生成建议
    switch (intent) {
      case 'create':
        suggestions.push('根据主题推荐合适的模板')
        suggestions.push('自动生成大纲结构')
        break
      case 'edit':
        suggestions.push('提供多种编辑选项')
        suggestions.push('保留原版式基础上优化')
        break
      case 'improve':
        suggestions.push('提供优化建议列表')
        suggestions.push('一键应用改进')
        break
    }

    return suggestions.slice(0, 4)
  }

  // 生成优化后的提示词
  const generateOptimizedPrompt = (input: string): string => {
    const result = analyzeInput(input)

    let prompt = input

    // 添加上下文
    const { audience, tone, style, length } = result.context

    prompt += `\n\n目标受众: ${audience}`
    prompt += `\n语气风格: ${tone}`
    prompt += `\n视觉风格: ${style}`
    prompt += `\n内容详细程度: ${length}`

    // 添加建议
    if (result.suggestions.length > 0) {
      prompt += `\n\n建议: ${result.suggestions.join(', ')}`
    }

    return prompt
  }

  // 理解能力统计
  const stats = computed(() => ({
    totalAnalyses: lastResult.value ? 1 : 0,
    averageConfidence: lastResult.value?.confidence || 0,
    topIntent: lastResult.value?.intent || 'create'
  }))

  return {
    isProcessing,
    lastResult,
    stats,
    analyzeInput,
    generateOptimizedPrompt,
    extractTopic,
    extractKeywords
  }
}

export default useAIUnderstanding
