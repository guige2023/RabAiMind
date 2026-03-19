// Template Collection Pro - 模板集合专业版
import { ref, computed } from 'vue'

export interface ExtendedTemplate {
  id: string
  name: string
  nameEn: string
  category: string
  style: string
  colorScheme: string
  layout: string
  slides: number
  aspectRatio: string
  keywords: string[]
  features: string[]
  description: string
  thumbnail?: string
  popularity: number
  isNew: boolean
  isPremium: boolean
}

export interface TemplateCategory {
  id: string
  name: string
  nameEn: string
  icon: string
  count: number
}

export function useTemplateCollectionPro() {
  // 模板集合
  const templates = ref<ExtendedTemplate[]>([
    // Business 商务
    { id: 'biz-modern-01', name: '现代商务', nameEn: 'Modern Business', category: 'business', style: 'modern', colorScheme: 'blue', layout: 'grid', slides: 10, aspectRatio: '16:9', keywords: ['business', 'corporate', 'professional'], features: ['数据图表', '时间轴', '团队介绍'], description: '简洁现代的商务演示', popularity: 95, isNew: false, isPremium: false },
    { id: 'biz-corporate-01', name: '企业年报', nameEn: 'Annual Report', category: 'business', style: 'classic', colorScheme: 'navy', layout: 'grid', slides: 15, aspectRatio: '16:9', keywords: ['annual', 'report', 'corporate'], features: ['财务报表', '里程碑', 'CEO致辞'], description: '专业企业年度报告模板', popularity: 88, isNew: false, isPremium: true },
    { id: 'biz-startup-01', name: '创业路演', nameEn: 'Startup Pitch', category: 'business', style: 'creative', colorScheme: 'gradient', layout: 'full', slides: 12, aspectRatio: '16:9', keywords: ['startup', 'pitch', 'investor'], features: ['痛点分析', '商业模式', '团队展示'], description: '吸引投资者的创业路演', popularity: 92, isNew: true, isPremium: true },
    { id: 'biz-meeting-01', name: '会议纪要', nameEn: 'Meeting Minutes', category: 'business', style: 'minimalist', colorScheme: 'gray', layout: 'list', slides: 8, aspectRatio: '4:3', keywords: ['meeting', 'minutes', 'agenda'], features: ['议程', '决议', '行动项'], description: '简洁高效的会议模板', popularity: 85, isNew: false, isPremium: false },
    { id: 'biz-proposal-01', name: '商业提案', nameEn: 'Business Proposal', category: 'business', style: 'modern', colorScheme: 'blue', layout: 'grid', slides: 14, aspectRatio: '16:9', keywords: ['proposal', 'solution', 'project'], features: ['问题分析', '解决方案', '报价'], description: '专业的商业提案演示', popularity: 90, isNew: false, isPremium: true },

    // Education 教育
    { id: 'edu-lecture-01', name: '课程讲座', nameEn: 'Course Lecture', category: 'education', style: 'academic', colorScheme: 'green', layout: 'split', slides: 20, aspectRatio: '16:9', keywords: ['lecture', 'course', 'academic'], features: ['知识要点', '案例分析', '思考题'], description: '高校课程教学模板', popularity: 87, isNew: false, isPremium: false },
    { id: 'edu-training-01', name: '培训课件', nameEn: 'Training Course', category: 'education', style: 'modern', colorScheme: 'orange', layout: 'grid', slides: 16, aspectRatio: '16:9', keywords: ['training', 'workshop', 'skill'], features: ['技能讲解', '实操演练', '考核'], description: '企业培训专用模板', popularity: 89, isNew: false, isPremium: false },
    { id: 'edu-defense-01', name: '论文答辩', nameEn: 'Thesis Defense', category: 'education', style: 'classic', colorScheme: 'blue', layout: 'center', slides: 18, aspectRatio: '4:3', keywords: ['thesis', 'defense', 'academic'], features: ['研究背景', '方法论', '结论'], description: '学术论文答辩模板', popularity: 93, isNew: false, isPremium: false },
    { id: 'edu-online-01', name: '在线课堂', nameEn: 'Online Class', category: 'education', style: 'friendly', colorScheme: 'yellow', layout: 'full', slides: 12, aspectRatio: '16:9', keywords: ['online', 'elearning', 'video'], features: ['视频占位', '互动问答', '测验'], description: '适合在线教学的模板', popularity: 91, isNew: true, isPremium: false },

    // Creative 创意
    { id: 'cre-portfolio-01', name: '作品集', nameEn: 'Portfolio', category: 'creative', style: 'artistic', colorScheme: 'dark', layout: 'gallery', slides: 15, aspectRatio: '16:9', keywords: ['portfolio', 'showcase', 'design'], features: ['作品展示', '项目详情', '客户评价'], description: '设计师作品集展示', popularity: 94, isNew: false, isPremium: true },
    { id: 'cre-brand-01', name: '品牌介绍', nameEn: 'Brand Story', category: 'creative', style: 'cinematic', colorScheme: 'warm', layout: 'full', slides: 10, aspectRatio: '16:9', keywords: ['brand', 'story', 'identity'], features: ['品牌理念', '视觉识别', '发展历程'], description: '品牌故事演示', popularity: 88, isNew: false, isPremium: true },
    { id: 'cre-event-01', name: '活动宣传', nameEn: 'Event Promo', category: 'creative', style: 'vibrant', colorScheme: 'gradient', layout: 'poster', slides: 8, aspectRatio: '9:16', keywords: ['event', 'promo', 'invitation'], features: ['倒计时', '嘉宾介绍', '报名'], description: '活动宣传邀请函', popularity: 86, isNew: true, isPremium: false },
    { id: 'cre-video-01', name: '视频脚本', nameEn: 'Video Storyboard', category: 'creative', style: 'visual', colorScheme: 'dark', layout: 'timeline', slides: 20, aspectRatio: '16:9', keywords: ['video', 'storyboard', 'scene'], features: ['分镜', '台词', '音效'], description: '视频制作分镜模板', popularity: 82, isNew: false, isPremium: false },

    // Technology 科技
    { id: 'tech-product-01', name: '产品发布', nameEn: 'Product Launch', category: 'technology', style: 'futuristic', colorScheme: 'cyan', layout: 'hero', slides: 12, aspectRatio: '16:9', keywords: ['product', 'launch', 'tech'], features: ['产品演示', '功能亮点', '价格'], description: '科技产品发布会', popularity: 94, isNew: true, isPremium: true },
    { id: 'tech-tutorial-01', name: '技术教程', nameEn: 'Tech Tutorial', category: 'technology', style: 'clean', colorScheme: 'blue', layout: 'step', slides: 16, aspectRatio: '16:9', keywords: ['tutorial', 'howto', 'guide'], features: ['步骤分解', '代码示例', '注意事项'], description: '技术教学演示模板', popularity: 87, isNew: false, isPremium: false },
    { id: 'tech-api-01', name: 'API文档', nameEn: 'API Documentation', category: 'technology', style: 'developer', colorScheme: 'dark', layout: 'reference', slides: 25, aspectRatio: '16:9', keywords: ['api', 'documentation', 'developer'], features: ['接口说明', '示例代码', '错误码'], description: 'API技术文档模板', popularity: 80, isNew: false, isPremium: true },
    { id: 'tech-ai-01', name: 'AI演示', nameEn: 'AI Presentation', category: 'technology', style: 'futuristic', colorScheme: 'purple', layout: 'grid', slides: 14, aspectRatio: '16:9', keywords: ['ai', 'machine learning', 'neural'], features: ['算法原理', '应用场景', '效果展示'], description: 'AI技术演示模板', popularity: 91, isNew: true, isPremium: true },

    // Finance 金融
    { id: 'fin-investor-01', name: '投资者演示', nameEn: 'Investor Deck', category: 'finance', style: 'professional', colorScheme: 'blue', layout: 'data', slides: 18, aspectRatio: '16:9', keywords: ['investor', 'pitch deck', 'funding'], features: ['财务数据', '市场分析', '退出策略'], description: '融资路演专用', popularity: 95, isNew: false, isPremium: true },
    { id: 'fin-analysis-01', name: '财务分析', nameEn: 'Financial Analysis', category: 'finance', style: 'data', colorScheme: 'green', layout: 'chart', slides: 20, aspectRatio: '16:9', keywords: ['financial', 'analysis', 'report'], features: ['比率分析', '趋势图', '预测'], description: '财务分析报告模板', popularity: 89, isNew: false, isPremium: true },
    { id: 'fin-plan-01', name: '商业计划', nameEn: 'Business Plan', category: 'finance', style: 'classic', colorScheme: 'navy', layout: 'section', slides: 22, aspectRatio: '16:9', keywords: ['business plan', 'strategy', 'roadmap'], features: ['战略规划', '执行方案', '预算'], description: '完整商业计划书', popularity: 92, isNew: false, isPremium: true },

    // Medical 医疗
    { id: 'med-research-01', name: '医学研究', nameEn: 'Medical Research', category: 'medical', style: 'scientific', colorScheme: 'teal', layout: 'academic', slides: 16, aspectRatio: '16:9', keywords: ['research', 'clinical', 'study'], features: ['研究方法', '数据分析', '结论'], description: '医学研究演示', popularity: 85, isNew: false, isPremium: true },
    { id: 'med-pharma-01', name: '药品介绍', nameEn: 'Drug Presentation', category: 'medical', style: 'professional', colorScheme: 'blue', layout: 'grid', slides: 14, aspectRatio: '16:9', keywords: ['pharmaceutical', 'drug', 'product'], features: ['药理作用', '临床试验', '安全性'], description: '药品介绍演示', popularity: 83, isNew: false, isPremium: true },
    { id: 'med-health-01', name: '健康讲座', nameEn: 'Health Talk', category: 'medical', style: 'friendly', colorScheme: 'green', layout: 'visual', slides: 12, aspectRatio: '16:9', keywords: ['health', 'wellness', 'lecture'], features: ['健康知识', '案例分享', '建议'], description: '健康科普讲座', popularity: 88, isNew: true, isPremium: false },

    // Personal 个人
    { id: 'per-resume-01', name: '个人简历', nameEn: 'Personal Resume', category: 'personal', style: 'minimalist', colorScheme: 'gray', layout: 'split', slides: 4, aspectRatio: '16:9', keywords: ['resume', 'cv', 'profile'], features: ['个人简介', '工作经历', '技能'], description: '个人简历演示', popularity: 90, isNew: false, isPremium: false },
    { id: 'per-travel-01', name: '旅行日志', nameEn: 'Travel Journal', category: 'personal', style: 'photo', colorScheme: 'warm', layout: 'gallery', slides: 15, aspectRatio: '16:9', keywords: ['travel', 'trip', 'adventure'], features: ['行程安排', '风景照片', '美食'], description: '旅行分享模板', popularity: 87, isNew: false, isPremium: false },
    { id: 'per-celebration-01', name: '生日祝福', nameEn: 'Birthday Celebration', category: 'personal', style: 'festive', colorScheme: 'gradient', layout: 'full', slides: 10, aspectRatio: '16:9', keywords: ['birthday', 'celebration', 'party'], features: ['祝福语', '照片墙', '回忆'], description: '生日派对演示', popularity: 84, isNew: false, isPremium: false },
    { id: 'per-wedding-01', name: '婚礼相册', nameEn: 'Wedding Album', category: 'personal', style: 'romantic', colorScheme: 'rose', layout: 'gallery', slides: 20, aspectRatio: '4:3', keywords: ['wedding', 'love', 'ceremony'], features: ['恋爱故事', '婚礼照片', '感谢'], description: '婚礼纪念相册', popularity: 91, isNew: false, isPremium: true },

    // Food 餐饮
    { id: 'food-menu-01', name: '菜单展示', nameEn: 'Menu Display', category: 'food', style: 'elegant', colorScheme: 'warm', layout: 'grid', slides: 6, aspectRatio: '4:3', keywords: ['menu', 'restaurant', 'cuisine'], features: ['菜品图片', '价格', '特色'], description: '餐厅菜单演示', popularity: 86, isNew: false, isPremium: false },
    { id: 'food-recipe-01', name: '食谱分享', nameEn: 'Recipe Share', category: 'food', style: 'cozy', colorScheme: 'orange', layout: 'step', slides: 12, aspectRatio: '16:9', keywords: ['recipe', 'cooking', 'kitchen'], features: ['食材', '步骤', '技巧'], description: '美食食谱分享', popularity: 83, isNew: true, isPremium: false },

    // Real Estate 房产
    { id: 'real-property-01', name: '房产推介', nameEn: 'Property Showcase', category: 'realestate', style: 'luxury', colorScheme: 'gold', layout: 'gallery', slides: 14, aspectRatio: '16:9', keywords: ['property', 'real estate', 'apartment'], features: ['户型图', '效果图', '周边配套'], description: '房产项目推介', popularity: 89, isNew: false, isPremium: true },
    { id: 'real-tour-01', name: '楼盘导览', nameEn: 'Property Tour', category: 'realestate', style: 'modern', colorScheme: 'blue', layout: 'virtual', slides: 18, aspectRatio: '16:9', keywords: ['tour', 'showroom', 'virtual'], features: ['VR看房', '户型选择', '优惠'], description: '楼盘导览演示', popularity: 87, isNew: true, isPremium: true },

    // Marketing 营销
    { id: 'mkt-campaign-01', name: '营销方案', nameEn: 'Marketing Campaign', category: 'marketing', style: 'bold', colorScheme: 'red', layout: 'grid', slides: 16, aspectRatio: '16:9', keywords: ['marketing', 'campaign', 'strategy'], features: ['市场分析', '营销策略', '预算'], description: '营销活动方案', popularity: 91, isNew: false, isPremium: true },
    { id: 'mkt-social-01', name: '社交媒体', nameEn: 'Social Media', category: 'marketing', style: 'trendy', colorScheme: 'gradient', layout: 'card', slides: 10, aspectRatio: '1:1', keywords: ['social media', 'instagram', 'content'], features: ['内容策划', '发布时间', '互动'], description: '社交媒体运营', popularity: 88, isNew: true, isPremium: false },
    { id: 'mkt-seo-01', name: 'SEO报告', nameEn: 'SEO Report', category: 'marketing', style: 'data', colorScheme: 'green', layout: 'chart', slides: 12, aspectRatio: '16:9', keywords: ['seo', 'analytics', 'ranking'], features: ['关键词排名', '流量分析', '建议'], description: 'SEO优化报告', popularity: 82, isNew: false, isPremium: false }
  ])

  // 分类
  const categories = ref<TemplateCategory[]>([
    { id: 'business', name: '商务', nameEn: 'Business', icon: '💼', count: 5 },
    { id: 'education', name: '教育', nameEn: 'Education', icon: '📚', count: 4 },
    { id: 'creative', name: '创意', nameEn: 'Creative', icon: '🎨', count: 4 },
    { id: 'technology', name: '科技', nameEn: 'Technology', icon: '💻', count: 4 },
    { id: 'finance', name: '金融', nameEn: 'Finance', icon: '💰', count: 3 },
    { id: 'medical', name: '医疗', nameEn: 'Medical', icon: '🏥', count: 3 },
    { id: 'personal', name: '个人', nameEn: 'Personal', icon: '👤', count: 4 },
    { id: 'food', name: '餐饮', nameEn: 'Food', icon: '🍽', count: 2 },
    { id: 'realestate', name: '房产', nameEn: 'Real Estate', icon: '🏠', count: 2 },
    { id: 'marketing', name: '营销', nameEn: 'Marketing', icon: '📢', count: 3 }
  ])

  // 筛选
  const selectedCategory = ref<string | null>(null)
  const selectedStyle = ref<string | null>(null)
  const searchQuery = ref('')
  const showNewOnly = ref(false)
  const showPremiumOnly = ref(false)

  // 过滤模板
  const filteredTemplates = computed(() => {
    let result = templates.value

    if (selectedCategory.value) {
      result = result.filter(t => t.category === selectedCategory.value)
    }

    if (selectedStyle.value) {
      result = result.filter(t => t.style === selectedStyle.value)
    }

    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      result = result.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.nameEn.toLowerCase().includes(q) ||
        t.keywords.some(k => k.toLowerCase().includes(q))
      )
    }

    if (showNewOnly.value) {
      result = result.filter(t => t.isNew)
    }

    if (showPremiumOnly.value) {
      result = result.filter(t => t.isPremium)
    }

    return result.sort((a, b) => b.popularity - a.popularity)
  })

  // 获取模板
  const getTemplate = (id: string) => {
    return templates.value.find(t => t.id === id)
  }

  // 添加模板
  const addTemplate = (template: Omit<ExtendedTemplate, 'id'>) => {
    const id = `custom_${Date.now()}`
    templates.value.push({ ...template, id })
    return id
  }

  // 分类筛选
  const filterByCategory = (category: string) => {
    selectedCategory.value = category
  }

  // 风格筛选
  const filterByStyle = (style: string) => {
    selectedStyle.value = style
  }

  // 搜索
  const search = (query: string) => {
    searchQuery.value = query
  }

  // 清空筛选
  const clearFilters = () => {
    selectedCategory.value = null
    selectedStyle.value = null
    searchQuery.value = ''
    showNewOnly.value = false
    showPremiumOnly.value = false
  }

  // 获取推荐
  const getRecommendations = (context: { category?: string; style?: string }, limit = 5) => {
    let result = templates.value

    if (context.category) {
      result = result.filter(t => t.category === context.category)
    }

    return result
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit)
  }

  // 统计
  const stats = computed(() => ({
    total: templates.value.length,
    byCategory: categories.value.map(c => ({ name: c.name, count: templates.value.filter(t => t.category === c.id).length })),
    newCount: templates.value.filter(t => t.isNew).length,
    premiumCount: templates.value.filter(t => t.isPremium).length,
    filtered: filteredTemplates.value.length
  }))

  return {
    // 模板
    templates,
    filteredTemplates,
    getTemplate,
    addTemplate,
    // 分类
    categories,
    selectedCategory,
    selectedStyle,
    searchQuery,
    filterByCategory,
    filterByStyle,
    search,
    clearFilters,
    // 选项
    showNewOnly,
    showPremiumOnly,
    // 推荐
    getRecommendations,
    // 统计
    stats
  }
}

export default useTemplateCollectionPro
