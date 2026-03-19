// AI Understanding Optimizer - AI理解能力增强
import { ref, computed } from 'vue'

export type IntentType = 'create' | 'edit' | 'improve' | 'convert' | 'explain' | 'analyze' | 'summarize'
export type AudienceType = 'general' | 'professional' | 'executive' | 'technical' | 'educational'
export type ToneType = 'formal' | 'casual' | 'academic' | 'creative'

export interface AIContext {
  topic: string
  keywords: string[]
  audience: AudienceType
  tone: ToneType
  length: 'brief' | 'standard' | 'detailed'
  style: string
  language: 'zh-CN' | 'en-US'
}

export interface UnderstandingResult {
  intent: IntentType
  confidence: number
  entities: string[]
  suggestions: string[]
  context: AIContext
  optimizedPrompt: string
}

export function useAIUnderstandingOptimizer() {
  // 理解配置
  const config = ref({
    language: 'zh-CN' as 'zh-CN' | 'en-US',
    autoDetect: true,
    enableOptimization: true,
    minConfidence: 0.5
  })

  // 意图模式
  const intentPatterns: Record<IntentType, string[]> = {
    create: ['创建', '生成', '制作', '新建', 'make', 'create', 'generate', 'build'],
    edit: ['编辑', '修改', '调整', '改', 'edit', 'modify', 'change', 'update'],
    improve: ['优化', '改善', '提升', '增强', 'improve', 'enhance', 'better', 'optimize'],
    convert: ['转换', '改成', '变成', '改编', 'convert', 'transform', 'change to'],
    explain: ['解释', '说明', '讲解', '什么是', 'explain', 'describe', 'what is'],
    analyze: ['分析', '解析', '研究', 'analyze', 'examine', 'study'],
    summarize: ['总结', '概括', '归纳', 'summarize', 'conclude', 'overview']
  }

  // 行业关键词
  const industryKeywords: Record<string, string[]> = {
    tech: ['科技', '技术', 'AI', '软件', '互联网', '数字化', 'tech', 'software', 'digital'],
    finance: ['金融', '银行', '投资', '理财', 'finance', 'investment', 'banking'],
    education: ['教育', '培训', '学习', 'teaching', 'education', 'training', 'course'],
    medical: ['医疗', '健康', '医药', 'medical', 'health', 'doctor', 'healthcare'],
    marketing: ['营销', '推广', '品牌', 'marketing', 'brand', 'advertising', 'sales'],
    startup: ['创业', '融资', '商业计划', 'startup', 'business', 'venture']
  }

  // 分析用户输入
  const analyze = (input: string): UnderstandingResult => {
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

    // 识别长度
    const length = recognizeLength(lowerInput)

    // 识别风格
    const style = recognizeStyle(lowerInput)

    // 计算置信度
    const confidence = calculateConfidence(intent, entities, keywords)

    // 生成建议
    const suggestions = generateSuggestions(intent, keywords, audience)

    // 优化提示词
    const optimizedPrompt = optimizePrompt(input, { intent, keywords, audience, tone, length, style })

    const result: UnderstandingResult = {
      intent,
      confidence,
      entities,
      suggestions,
      context: {
        topic: extractTopic(input),
        keywords,
        audience,
        tone,
        length,
        style,
        language: config.value.language
      },
      optimizedPrompt
    }

    return result
  }

  // 识别意图
  const recognizeIntent = (input: string): IntentType => {
    for (const [intent, patterns] of Object.entries(intentPatterns)) {
      if (patterns.some(p => input.includes(p))) {
        return intent as IntentType
      }
    }
    return 'create' // 默认创建
  }

  // 提取实体
  const extractEntities = (input: string): string[] => {
    const entities: string[] = []

    // 页数
    const pageMatch = input.match(/(\d+)\s*页?/)
    if (pageMatch) entities.push(`pages:${pageMatch[1]}`)

    // 时间
    const timeMatch = input.match(/(\d+)\s*(分钟|小时|min|hour)/)
    if (timeMatch) entities.push(`duration:${timeMatch[1]}`)

    // 数字
    const numMatch = input.match(/(\d+)/g)
    if (numMatch) entities.push(...numMatch.map(n => `number:${n}`))

    return entities
  }

  // 提取关键词
  const extractKeywords = (input: string): string[] => {
    const keywords: string[] = []

    for (const [industry, indKeywords] of Object.entries(industryKeywords)) {
      if (indKeywords.some(k => input.toLowerCase().includes(k))) {
        keywords.push(industry)
      }
    }

    return keywords
  }

  // 识别受众
  const recognizeAudience = (input: string): AudienceType => {
    if (input.includes('高管') || input.includes('老板') || input.includes('CEO') || input.includes('executive')) return 'executive'
    if (input.includes('专业') || input.includes('技术') || input.includes('工程师') || input.includes('technical')) return 'technical'
    if (input.includes('学生') || input.includes('教学') || input.includes('老师') || input.includes('educational')) return 'educational'
    if (input.includes('专业') || input.includes('行业') || input.includes('professional')) return 'professional'
    return 'general'
  }

  // 识别语气
  const recognizeTone = (input: string): ToneType => {
    if (input.includes('正式') || input.includes('专业') || input.includes('formal')) return 'formal'
    if (input.includes('轻松') || input.includes('活泼') || input.includes('casual')) return 'casual'
    if (input.includes('学术') || input.includes('严谨') || input.includes('academic')) return 'academic'
    if (input.includes('创意') || input.includes('独特') || input.includes('creative')) return 'creative'
    return 'formal'
  }

  // 识别长度
  const recognizeLength = (input: string): AIContext['length'] => {
    if (input.includes('简短') || input.includes('简洁') || input.includes('brief')) return 'brief'
    if (input.includes('详细') || input.includes('详尽') || input.includes('详细') || input.includes('detailed')) return 'detailed'
    return 'standard'
  }

  // 识别风格
  const recognizeStyle = (input: string): string => {
    if (input.includes('创意') || input.includes('独特')) return 'creative'
    if (input.includes('简约') || input.includes('简洁')) return 'minimalist'
    if (input.includes('科技') || input.includes('未来')) return 'tech'
    if (input.includes('高端') || input.includes('大气')) return 'premium'
    if (input.includes('中国') || input.includes('传统')) return 'chinese'
    return 'standard'
  }

  // 计算置信度
  const calculateConfidence = (intent: IntentType, entities: string[], keywords: string[]): number => {
    let confidence = 0.5

    if (entities.length > 0) confidence += 0.2
    if (keywords.length > 0) confidence += 0.15
    if (intent !== 'create') confidence += 0.15

    return Math.min(confidence, 0.95)
  }

  // 生成建议
  const generateSuggestions = (intent: IntentType, keywords: string[], audience: AudienceType): string[] => {
    const suggestions: string[] = []

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

  // 优化提示词
  const optimizePrompt = (input: string, context: Partial<AIContext>): string => {
    if (!config.value.enableOptimization) return input

    let prompt = input

    // 添加受众
    if (context.audience) {
      prompt += `\n目标受众: ${context.audience}`
    }

    // 添加语气
    if (context.tone) {
      prompt += `\n语气风格: ${context.tone}`
    }

    // 添加风格
    if (context.style) {
      prompt += `\n视觉风格: ${context.style}`
    }

    // 添加长度
    if (context.length) {
      prompt += `\n内容详细程度: ${context.length}`
    }

    return prompt
  }

  // 提取主题
  const extractTopic = (input: string): string => {
    return input
      .replace(/创建|生成|制作|做一个|帮我做/g, '')
      .replace(/PPT|演示|幻灯片/g, '')
      .trim() || input
  }

  return {
    config,
    analyze,
    recognizeIntent,
    extractEntities,
    extractKeywords,
    recognizeAudience,
    recognizeTone,
    recognizeLength,
    recognizeStyle,
    calculateConfidence,
    generateSuggestions,
    optimizePrompt,
    extractTopic
  }
}

export default useAIUnderstandingOptimizer
