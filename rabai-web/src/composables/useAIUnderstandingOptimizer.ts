// AI Understanding Optimizer - AI理解能力深度优化
import { ref, computed } from 'vue'

export type IntentType = 'create' | 'edit' | 'improve' | 'convert' | 'explain' | 'analyze' | 'summarize' | 'translate' | 'expand' | 'simplify'
export type AudienceType = 'general' | 'professional' | 'executive' | 'technical' | 'educational' | 'creative'
export type ToneType = 'formal' | 'casual' | 'academic' | 'creative' | 'humorous' | 'persuasive'

export interface AIContext {
  topic: string
  keywords: string[]
  audience: AudienceType
  tone: ToneType
  length: 'brief' | 'standard' | 'detailed' | 'comprehensive'
  style: string
  language: 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR'
  format: 'presentation' | 'document' | 'outline' | 'bullet' | 'narrative'
}

export interface UnderstandingResult {
  intent: IntentType
  confidence: number
  entities: string[]
  suggestions: string[]
  context: AIContext
  optimizedPrompt: string
  alternatives: string[]
}

// 意图模式 - 扩展版本
const intentPatterns: Record<IntentType, { keywords: string[]; weight: number }> = {
  create: { keywords: ['创建', '生成', '制作', '新建', '做', '做一个', '帮我做', 'make', 'create', 'generate', 'build', '做一个'], weight: 1.0 },
  edit: { keywords: ['编辑', '修改', '调整', '改', '改动', '编辑', 'edit', 'modify', 'change', 'update', '改一下'], weight: 1.0 },
  improve: { keywords: ['优化', '改善', '提升', '增强', '改进', '完善', 'improve', 'enhance', 'better', 'optimize', '提升一下'], weight: 1.0 },
  convert: { keywords: ['转换', '改成', '变成', '改编', '转成', '转化', 'convert', 'transform', 'change to', '改成'], weight: 1.0 },
  explain: { keywords: ['解释', '说明', '讲解', '什么是', '介绍', '阐述', 'explain', 'describe', 'what is'], weight: 1.0 },
  analyze: { keywords: ['分析', '解析', '研究', '探讨', '剖析', 'analyze', 'examine', 'study'], weight: 1.0 },
  summarize: { keywords: ['总结', '概括', '归纳', '提炼', '摘要', 'summarize', 'conclude', 'overview'], weight: 1.0 },
  translate: { keywords: ['翻译', '转译', '翻译成', '转成', 'translate', 'convert to'], weight: 1.0 },
  expand: { keywords: ['扩展', '展开', '详细', '详细说明', '展开说', 'expand', 'elaborate'], weight: 1.0 },
  simplify: { keywords: ['简化', '精简', '缩短', '简略', '压缩', 'simplify', 'shorten', 'condense'], weight: 1.0 }
}

// 行业关键词
const industryKeywords: Record<string, string[]> = {
  tech: ['科技', '技术', 'AI', '软件', '互联网', '数字化', 'tech', 'software', 'digital', '计算机', '互联网', '人工智能'],
  finance: ['金融', '银行', '投资', '理财', '财务', 'finance', 'investment', 'banking', '股票', '基金', '经济'],
  education: ['教育', '培训', '学习', '教学', '课程', 'teaching', 'education', 'training', 'course', '学校', '学生'],
  medical: ['医疗', '健康', '医药', '医学', 'medical', 'health', 'doctor', 'healthcare', '医院', '保健'],
  marketing: ['营销', '推广', '品牌', '销售', 'marketing', 'brand', 'advertising', 'sales', '市场', '推广'],
  startup: ['创业', '融资', '商业计划', '商业', 'startup', 'business', 'venture', '企业', '公司'],
  legal: ['法律', '法务', '合同', '法律咨询', 'legal', 'law', '律师', '合规'],
  hr: ['人力资源', '招聘', '员工', 'HR', 'human resources', '人才', '招聘', '管理']
}

// 格式关键词
const formatKeywords: Record<string, string[]> = {
  presentation: ['PPT', '演示', '幻灯片', 'presentation', 'slides', 'deck'],
  document: ['文档', '文章', '报告', 'document', 'article', 'report', 'paper'],
  outline: ['大纲', '提纲', 'outline', 'structure'],
  bullet: ['要点', '列表', 'bullet', 'list', 'points'],
  narrative: ['故事', '叙述', 'narrative', 'story', '文章']
}

export function useAIUnderstandingOptimizer() {
  // 理解配置
  const config = ref({
    language: 'zh-CN' as 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR',
    autoDetect: true,
    enableOptimization: true,
    minConfidence: 0.5,
    enableMultiIntent: true
  })

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

    // 识别格式
    const format = recognizeFormat(lowerInput)

    // 计算置信度
    const confidence = calculateConfidence(intent, entities, keywords)

    // 生成建议
    const suggestions = generateSuggestions(intent, keywords, audience)

    // 优化提示词
    const optimizedPrompt = optimizePrompt(input, { intent, keywords, audience, tone, length, style, format })

    // 生成替代理解
    const alternatives = generateAlternatives(input, intent)

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
        language: config.value.language,
        format
      },
      optimizedPrompt,
      alternatives
    }

    return result
  }

  // 识别意图
  const recognizeIntent = (input: string): IntentType => {
    let bestIntent: IntentType = 'create'
    let bestWeight = 0

    for (const [intent, { keywords, weight }] of Object.entries(intentPatterns)) {
      for (const keyword of keywords) {
        if (input.includes(keyword)) {
          if (weight > bestWeight) {
            bestWeight = weight
            bestIntent = intent as IntentType
          }
        }
      }
    }

    return bestIntent
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

    // 百分比
    const percentMatch = input.match(/(\d+)%/)
    if (percentMatch) entities.push(`percentage:${percentMatch[1]}`)

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
    if (input.includes('创意') || input.includes('艺术') || input.includes('creative')) return 'creative'
    if (input.includes('专业') || input.includes('行业') || input.includes('professional')) return 'professional'
    return 'general'
  }

  // 识别语气
  const recognizeTone = (input: string): ToneType => {
    if (input.includes('正式') || input.includes('专业') || input.includes('formal')) return 'formal'
    if (input.includes('轻松') || input.includes('活泼') || input.includes('casual')) return 'casual'
    if (input.includes('学术') || input.includes('严谨') || input.includes('academic')) return 'academic'
    if (input.includes('创意') || input.includes('独特') || input.includes('creative')) return 'creative'
    if (input.includes('幽默') || input.includes('搞笑') || input.includes('humorous')) return 'humorous'
    if (input.includes('说服') || input.includes('推销') || input.includes('persuasive')) return 'persuasive'
    return 'formal'
  }

  // 识别长度
  const recognizeLength = (input: string): AIContext['length'] => {
    if (input.includes('简短') || input.includes('简洁') || input.includes('brief')) return 'brief'
    if (input.includes('详细') || input.includes('详尽') || input.includes('详细') || input.includes('detailed')) return 'detailed'
    if (input.includes('全面') || input.includes('完整') || input.includes('comprehensive')) return 'comprehensive'
    return 'standard'
  }

  // 识别风格
  const recognizeStyle = (input: string): string => {
    if (input.includes('创意') || input.includes('独特')) return 'creative'
    if (input.includes('简约') || input.includes('简洁')) return 'minimalist'
    if (input.includes('科技') || input.includes('未来')) return 'tech'
    if (input.includes('高端') || input.includes('大气')) return 'premium'
    if (input.includes('中国') || input.includes('传统')) return 'chinese'
    if (input.includes('可爱') || input.includes('卡通')) return 'cartoon'
    if (input.includes('商务') || input.includes('专业')) return 'business'
    return 'standard'
  }

  // 识别格式
  const recognizeFormat = (input: string): AIContext['format'] => {
    for (const [format, keywords] of Object.entries(formatKeywords)) {
      if (keywords.some(k => input.toLowerCase().includes(k))) {
        return format as AIContext['format']
      }
    }
    return 'presentation'
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
      suggestions.push('使用现代化的设计元素')
    }
    if (keywords.includes('finance')) {
      suggestions.push('添加财务数据展示')
      suggestions.push('包含增长趋势图表')
      suggestions.push('使用专业的商务风格')
    }
    if (keywords.includes('education')) {
      suggestions.push('使用清晰的知识结构')
      suggestions.push('添加案例分析')
      suggestions.push('包含图文并茂的内容')
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
      case 'translate':
        suggestions.push('保持原文结构')
        suggestions.push('调整文化适配')
        break
      case 'expand':
        suggestions.push('添加详细说明')
        suggestions.push('提供案例支持')
        break
    }

    return suggestions.slice(0, 5)
  }

  // 优化提示词
  const optimizePrompt = (input: string, context: Partial<AIContext>): string => {
    if (!config.value.enableOptimization) return input

    let prompt = input

    if (context.audience) {
      prompt += `\n目标受众: ${context.audience}`
    }

    if (context.tone) {
      prompt += `\n语气风格: ${context.tone}`
    }

    if (context.style) {
      prompt += `\n视觉风格: ${context.style}`
    }

    if (context.length) {
      prompt += `\n内容详细程度: ${context.length}`
    }

    if (context.format) {
      prompt += `\n输出格式: ${context.format}`
    }

    return prompt
  }

  // 生成替代理解
  const generateAlternatives = (input: string, intent: IntentType): string[] => {
    const alternatives: string[] = []

    // 根据意图生成替代理解
    if (intent === 'create') {
      alternatives.push(`创建一个关于${input}的演示文稿`)
      alternatives.push(`生成${input}的PPT内容`)
    } else if (intent === 'improve') {
      alternatives.push(`优化${input}的内容和设计`)
      alternatives.push(`改善${input}的表达效果`)
    } else if (intent === 'translate') {
      alternatives.push(`将${input}翻译成目标语言`)
    }

    return alternatives
  }

  // 提取主题
  const extractTopic = (input: string): string => {
    return input
      .replace(/创建|生成|制作|做一个|帮我做/g, '')
      .replace(/PPT|演示|幻灯片/g, '')
      .trim() || input
  }

  // 批量分析
  const analyzeBatch = (inputs: string[]): UnderstandingResult[] => {
    return inputs.map(input => analyze(input))
  }

  // 智能补全
  const completePrompt = (partial: string): string[] => {
    const completions: string[] = []

    // 基于关键词补全
    if (partial.includes('创建')) {
      completions.push('创建一个关于公司介绍的PPT')
      completions.push('创建一个产品演示文稿')
      completions.push('创建一个培训课件')
    } else if (partial.includes('优化')) {
      completions.push('优化这个PPT的视觉效果')
      completions.push('优化内容结构和表达')
    }

    return completions
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
    recognizeFormat,
    calculateConfidence,
    generateSuggestions,
    optimizePrompt,
    generateAlternatives,
    extractTopic,
    analyzeBatch,
    completePrompt
  }
}

export default useAIUnderstandingOptimizer
