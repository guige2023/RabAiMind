// Outline Generation Optimizer - 大纲生成优化器
import { ref, computed } from 'vue'

export interface OutlineSection {
  id: string
  title: string
  titleEn: string
  description?: string
  subsections?: OutlineSection[]
  keywords?: string[]
  pageCount: number
  contentType: 'introduction' | 'content' | 'conclusion' | 'appendix'
  importance: number
}

export interface OutlineTemplate {
  id: string
  name: string
  nameEn: string
  category: string
  sections: OutlineSection[]
  totalPages: number
}

export interface GenerationConfig {
  language: 'zh' | 'en' | 'mixed'
  style: 'formal' | 'casual' | 'creative' | 'academic'
  tone: 'professional' | 'friendly' | 'authoritative' | 'humorous'
  length: 'brief' | 'standard' | 'detailed'
  includeSubsections: boolean
  keywordDensity: number
}

export interface OutlineValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
  suggestions: string[]
}

export function useOutlineGenerationOptimizer() {
  // 大纲内容
  const outline = ref<OutlineSection[]>([])

  // 配置
  const config = ref<GenerationConfig>({
    language: 'zh',
    style: 'formal',
    tone: 'professional',
    length: 'standard',
    includeSubsections: true,
    keywordDensity: 0.05
  })

  // 模板库
  const templates = ref<OutlineTemplate[]>([
    {
      id: 'business-standard',
      name: '商业计划书',
      nameEn: 'Business Plan',
      category: 'business',
      totalPages: 15,
      sections: [
        { id: 's1', title: '执行摘要', titleEn: 'Executive Summary', pageCount: 1, contentType: 'introduction', importance: 10 },
        { id: 's2', title: '公司概况', titleEn: 'Company Overview', pageCount: 2, contentType: 'introduction', importance: 8 },
        { id: 's3', title: '市场分析', titleEn: 'Market Analysis', pageCount: 3, contentType: 'content', importance: 9 },
        { id: 's4', title: '产品服务', titleEn: 'Products & Services', pageCount: 2, contentType: 'content', importance: 9 },
        { id: 's5', title: '商业模式', titleEn: 'Business Model', pageCount: 2, contentType: 'content', importance: 8 },
        { id: 's6', title: '营销策略', titleEn: 'Marketing Strategy', pageCount: 2, contentType: 'content', importance: 8 },
        { id: 's7', title: '运营计划', titleEn: 'Operations Plan', pageCount: 2, contentType: 'content', importance: 7 },
        { id: 's8', title: '财务预测', titleEn: 'Financial Projections', pageCount: 3, contentType: 'content', importance: 9 },
        { id: 's9', title: '团队介绍', titleEn: 'Team', pageCount: 1, contentType: 'content', importance: 7 },
        { id: 's10', title: '融资计划', titleEn: 'Funding Request', pageCount: 1, contentType: 'conclusion', importance: 8 }
      ]
    },
    {
      id: 'product-launch',
      name: '产品发布会',
      nameEn: 'Product Launch',
      category: 'marketing',
      totalPages: 12,
      sections: [
        { id: 's1', title: '开场', titleEn: 'Opening', pageCount: 1, contentType: 'introduction', importance: 7 },
        { id: 's2', title: '行业趋势', titleEn: 'Industry Trends', pageCount: 2, contentType: 'content', importance: 8 },
        { id: 's3', title: '用户痛点', titleEn: 'Pain Points', pageCount: 2, contentType: 'content', importance: 9 },
        { id: 's4', title: '产品介绍', titleEn: 'Product Introduction', pageCount: 3, contentType: 'content', importance: 10 },
        { id: 's5', title: '核心功能', titleEn: 'Key Features', pageCount: 2, contentType: 'content', importance: 9 },
        { id: 's6', title: '定价策略', titleEn: 'Pricing', pageCount: 1, contentType: 'content', importance: 7 },
        { id: 's7', title: '上市时间', titleEn: 'Launch Timeline', pageCount: 1, contentType: 'conclusion', importance: 8 }
      ]
    },
    {
      id: 'academic-defense',
      name: '论文答辩',
      nameEn: 'Thesis Defense',
      category: 'academic',
      totalPages: 18,
      sections: [
        { id: 's1', title: '研究背景', titleEn: 'Research Background', pageCount: 3, contentType: 'introduction', importance: 8 },
        { id: 's2', title: '研究目的', titleEn: 'Research Objectives', pageCount: 1, contentType: 'introduction', importance: 9 },
        { id: 's3', title: '文献综述', titleEn: 'Literature Review', pageCount: 3, contentType: 'content', importance: 7 },
        { id: 's4', title: '研究方法', titleEn: 'Methodology', pageCount: 3, contentType: 'content', importance: 10 },
        { id: 's5', title: '数据分析', titleEn: 'Data Analysis', pageCount: 4, contentType: 'content', importance: 10 },
        { id: 's6', title: '研究结论', titleEn: 'Conclusions', pageCount: 2, contentType: 'conclusion', importance: 10 },
        { id: 's7', title: '未来展望', titleEn: 'Future Work', pageCount: 2, contentType: 'conclusion', importance: 7 }
      ]
    },
    {
      id: 'training-course',
      name: '培训课件',
      nameEn: 'Training Course',
      category: 'education',
      totalPages: 20,
      sections: [
        { id: 's1', title: '课程介绍', titleEn: 'Course Introduction', pageCount: 1, contentType: 'introduction', importance: 7 },
        { id: 's2', title: '知识要点', titleEn: 'Key Points', pageCount: 8, contentType: 'content', importance: 10 },
        { id: 's3', title: '案例分析', titleEn: 'Case Studies', pageCount: 4, contentType: 'content', importance: 9 },
        { id: 's4', title: '实操演练', titleEn: 'Practice', pageCount: 4, contentType: 'content', importance: 9 },
        { id: 's5', title: '总结回顾', titleEn: 'Summary', pageCount: 2, contentType: 'conclusion', importance: 8 },
        { id: 's6', title: '答疑环节', titleEn: 'Q&A', pageCount: 1, contentType: 'conclusion', importance: 6 }
      ]
    }
  ])

  // 生成大纲
  const generateOutline = (
    topic: string,
    customConfig?: Partial<GenerationConfig>
  ): OutlineSection[] => {
    const finalConfig = { ...config.value, ...customConfig }

    // 根据主题智能匹配模板
    const matchedTemplate = matchTemplate(topic)

    if (matchedTemplate) {
      outline.value = matchedTemplate.sections
      return outline.value
    }

    // 默认生成
    const defaultOutline: OutlineSection[] = [
      {
        id: 'intro',
        title: finalConfig.language === 'en' ? 'Introduction' : '介绍',
        titleEn: 'Introduction',
        pageCount: finalConfig.length === 'brief' ? 1 : 2,
        contentType: 'introduction',
        importance: 8,
        keywords: extractKeywords(topic, 3)
      },
      {
        id: 'main',
        title: finalConfig.language === 'en' ? 'Main Content' : '主要内容',
        titleEn: 'Main Content',
        pageCount: finalConfig.length === 'brief' ? 3 : finalConfig.length === 'detailed' ? 8 : 5,
        contentType: 'content',
        importance: 10,
        keywords: extractKeywords(topic, 5)
      },
      {
        id: 'conclusion',
        title: finalConfig.language === 'en' ? 'Conclusion' : '总结',
        titleEn: 'Conclusion',
        pageCount: finalConfig.length === 'brief' ? 1 : 2,
        contentType: 'conclusion',
        importance: 8,
        keywords: extractKeywords(topic, 2)
      }
    ]

    outline.value = defaultOutline
    return outline.value
  }

  // 智能匹配模板
  const matchTemplate = (topic: string): OutlineTemplate | null => {
    const topicLower = topic.toLowerCase()

    for (const template of templates.value) {
      if (
        template.name.toLowerCase().includes(topicLower) ||
        template.nameEn.toLowerCase().includes(topicLower) ||
        template.category.toLowerCase().includes(topicLower)
      ) {
        return template
      }
    }

    return null
  }

  // 提取关键词
  const extractKeywords = (text: string, count: number): string[] => {
    const words = text.split(/[,，、\s]+/).filter(w => w.length > 1)
    return words.slice(0, count)
  }

  // 添加章节
  const addSection = (section: Omit<OutlineSection, 'id'>) => {
    const newSection: OutlineSection = {
      ...section,
      id: `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    outline.value.push(newSection)
    return newSection
  }

  // 移除章节
  const removeSection = (id: string) => {
    outline.value = outline.value.filter(s => s.id !== id)
  }

  // 更新章节
  const updateSection = (id: string, updates: Partial<OutlineSection>) => {
    const section = outline.value.find(s => s.id === id)
    if (section) {
      Object.assign(section, updates)
    }
  }

  // 重新排序
  const reorderSections = (fromIndex: number, toIndex: number) => {
    const [removed] = outline.value.splice(fromIndex, 1)
    outline.value.splice(toIndex, 0, removed)
  }

  // 验证大纲
  const validate = (): OutlineValidation => {
    const errors: string[] = []
    const warnings: string[] = []
    const suggestions: string[] = []

    if (outline.value.length === 0) {
      errors.push('大纲为空')
    }

    const totalPages = outline.value.reduce((sum, s) => sum + s.pageCount, 0)

    if (totalPages < 5) {
      warnings.push('页数较少，建议增加内容')
    } else if (totalPages > 30) {
      warnings.push('页数较多，建议精简')
    }

    const hasIntro = outline.value.some(s => s.contentType === 'introduction')
    const hasConclusion = outline.value.some(s => s.contentType === 'conclusion')

    if (!hasIntro) {
      suggestions.push('建议添加介绍章节')
    }
    if (!hasConclusion) {
      suggestions.push('建议添加总结章节')
    }

    const highImportance = outline.value.filter(s => s.importance >= 9)
    if (highImportance.length === 0) {
      suggestions.push('建议标记重要章节')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    }
  }

  // 获取总页数
  const totalPages = computed(() =>
    outline.value.reduce((sum, s) => sum + s.pageCount, 0)
  )

  // 获取分类统计
  const categoryStats = computed(() => {
    const stats: Record<string, number> = {}
    outline.value.forEach(s => {
      stats[s.contentType] = (stats[s.contentType] || 0) + s.pageCount
    })
    return stats
  })

  // 配置更新
  const updateConfig = (newConfig: Partial<GenerationConfig>) => {
    Object.assign(config.value, newConfig)
  }

  // 统计
  const stats = computed(() => ({
    sections: outline.value.length,
    totalPages: totalPages.value,
    templates: templates.value.length,
    config: { ...config.value },
    validation: validate()
  }))

  return {
    // 大纲
    outline,
    generateOutline,
    addSection,
    removeSection,
    updateSection,
    reorderSections,
    // 模板
    templates,
    matchTemplate,
    // 配置
    config,
    updateConfig,
    // 验证
    validate,
    // 统计
    totalPages,
    categoryStats,
    stats
  }
}

export default useOutlineGenerationOptimizer
