// Template store - 模板市场数据管理
import { ref, computed } from 'vue'
import { apiClient } from '../api/client'

export interface Template {
  id: string
  name: string
  description: string
  category: string
  style: string
  slides: number
  thumbnail: string
  tags: string[]
  popularity: number
  isPremium: boolean
  author: string
  createdAt: string
  // 额外字段（来自真实API）
  colors?: string[]
  fonts?: string[]
  // R128: 用户生成模板
  is_ugc?: boolean
  // R128: 子分类
  subcategory?: string
  // R128: 下载次数
  download_count?: number
  // R128: 评分细分
  rating_breakdown?: {
    design: number
    usability: number
    features: number
    total: number
    count: number
  }
  // R128: 预览幻灯片
  preview_slides?: PreviewSlide[]
}

export interface PreviewSlide {
  index: number
  type: 'title' | 'toc' | 'content' | 'two_column' | 'data_visualization' | 'ending'
  title: string
  subtitle?: string
  items?: string[]
  layout: string
  colors: string[]
  content_preview?: string
}

// 真实API模板 → 前端模板的映射
function mapApiTemplate(apiT: any): Template {
  return {
    id: apiT.id,
    name: apiT.name,
    description: apiT.description,
    category: apiT.category,
    style: apiT.style,
    slides: 8,  // 默认值
    thumbnail: apiT.thumbnail || '',
    tags: [apiT.category, apiT.style],  // 派生
    popularity: 80,  // 默认热度
    isPremium: ['tech', 'creative'].includes(apiT.category),  // 简单判断
    author: apiT.author || 'RabAi Mind',
    createdAt: apiT.created_at || new Date().toISOString().split('T')[0],
    colors: apiT.colors,
    fonts: apiT.fonts,
    is_ugc: apiT.is_ugc || false,
    subcategory: apiT.subcategory || '',
    download_count: apiT.download_count || 0,
    rating_breakdown: apiT.rating_breakdown,
  }
}

// 模板分类 - 硬编码兜底数据
const defaultCategories = [
  { id: 'business', name: '商业', icon: '💼', count: 12 },
  { id: 'education', name: '教育', icon: '📚', count: 8 },
  { id: 'tech', name: '科技', icon: '🚀', count: 6 },
  { id: 'creative', name: '创意', icon: '💡', count: 10 },
  { id: 'personal', name: '个人', icon: '👤', count: 5 },
  { id: 'government', name: '政府', icon: '🏛️', count: 4 },
  { id: 'finance', name: '金融', icon: '💰', count: 5 },
  { id: 'marketing', name: '营销', icon: '📢', count: 7 },
]

// R128: 分类+子分类映射
const CATEGORY_SUBCATEGORIES: Record<string, { id: string; name: string }[]> = {
  business: [
    { id: 'annual', name: '年度总结' },
    { id: 'quarterly', name: '季度报告' },
    { id: 'proposal', name: '项目提案' },
    { id: 'company', name: '公司介绍' },
    { id: 'roadshow', name: '投资路演' },
    { id: 'meeting', name: '会议议程' },
    { id: 'sales', name: '销售提案' },
    { id: 'analysis', name: '市场分析' },
    { id: 'team', name: '团队建设' },
    { id: 'negotiation', name: '商务谈判' },
  ],
  education: [
    { id: 'training', name: '培训课件' },
    { id: 'defense', name: '学术答辩' },
    { id: 'teaching', name: '教学教案' },
    { id: 'campus', name: '校园活动' },
    { id: 'graduation', name: '毕业典礼' },
    { id: 'course', name: '课程介绍' },
    { id: 'exam', name: '考试复习' },
    { id: 'academic', name: '学术报告' },
  ],
  tech: [
    { id: 'product_launch', name: '产品发布' },
    { id: 'tech_share', name: '技术分享' },
    { id: 'ai_demo', name: 'AI演示' },
    { id: 'tech_conf', name: '科技大会' },
    { id: 'internet_conf', name: '互联网峰会' },
    { id: 'product_intro', name: '产品介绍' },
    { id: 'tech_doc', name: '技术文档' },
    { id: 'dev_conf', name: '开发者大会' },
  ],
  creative: [
    { id: 'creative_show', name: '创意展示' },
    { id: 'brand_design', name: '品牌设计' },
    { id: 'marketing', name: '营销提案' },
    { id: 'event', name: '活动策划' },
    { id: 'art', name: '艺术展示' },
    { id: 'resume', name: '个人简历' },
    { id: 'portfolio', name: '作品集' },
    { id: 'creative_writing', name: '创意写作' },
  ],
  personal: [
    { id: 'birthday', name: '生日派对' },
    { id: 'wedding', name: '婚礼请柬' },
    { id: 'travel', name: '旅行分享' },
    { id: 'food', name: '美食记录' },
    { id: 'family', name: '家庭相册' },
    { id: 'anniversary', name: '纪念日' },
    { id: 'diary', name: '个人日记' },
  ],
  government: [
    { id: 'gov_report', name: '政府汇报' },
    { id: 'party', name: '党建工作' },
    { id: 'gov_affairs', name: '政务公开' },
    { id: 'policy', name: '政策解读' },
    { id: 'meeting_report', name: '会议报告' },
    { id: 'planning', name: '规划展示' },
  ],
  finance: [
    { id: 'financial_report', name: '财务报告' },
    { id: 'investment', name: '投资分析' },
    { id: 'market_research', name: '市场研究' },
    { id: 'business_plan', name: '商业计划' },
    { id: 'audit', name: '审计汇报' },
    { id: 'budget', name: '预算方案' },
    { id: 'fund_roadshow', name: '基金路演' },
  ],
  marketing: [
    { id: 'brand_promo', name: '品牌推广' },
    { id: 'promotion', name: '产品促销' },
    { id: 'ad_creative', name: '广告创意' },
    { id: 'social_media', name: '社交媒体' },
    { id: 'content_marketing', name: '内容营销' },
    { id: 'event_promo', name: '活动宣传' },
    { id: 'media', name: '媒体投放' },
  ],
}

// 模板风格 - 硬编码兜底数据
const defaultStyles = [
  { id: 'professional', name: '专业商务', icon: '💼' },
  { id: 'simple', name: '简约现代', icon: '✨' },
  { id: 'energetic', name: '活力动感', icon: '🔥' },
  { id: 'premium', name: '高端大气', icon: '👑' },
  { id: 'tech', name: '科技未来', icon: '🔬' },
  { id: 'creative', name: '创意艺术', icon: '🎨' },
  { id: 'elegant', name: '优雅古典', icon: '🌸' },
  { id: 'playful', name: '卡通趣味', icon: '🎮' }
]

// BUG修复: 从后端API加载分类/风格，而不是硬编码
export const templateCategories = ref(defaultCategories)
export const templateStyles = ref(defaultStyles)

// 示例模板数据
const sampleTemplates: Template[] = [
  {
    id: 't1',
    name: '商业计划书',
    description: '专业简洁的商业计划书模板，适合创业者融资路演',
    category: 'business',
    style: 'professional',
    slides: 12,
    thumbnail: '',
    tags: ['融资', '路演', '创业', '商业'],
    popularity: 98,
    isPremium: false,
    author: 'RabAi Mind',
    subcategory: 'roadshow',
    download_count: 1247,
    rating_breakdown: {'design': 4.2, 'usability': 4.5, 'features': 4.0, 'total': 4.2, 'count': 312},
    createdAt: '2024-01-15'
  },
  {
    id: 't2',
    name: '产品发布会',
    description: '科技感十足的产品发布会模板，适合新品发布活动',
    category: 'tech',
    style: 'tech',
    slides: 10,
    thumbnail: '',
    tags: ['产品', '发布', '科技', '新品'],
    popularity: 95,
    isPremium: true,
    author: 'RabAi Mind',
    subcategory: 'product_launch',
    download_count: 1834,
    rating_breakdown: {'design': 4.8, 'usability': 4.5, 'features': 4.9, 'total': 4.7, 'count': 521},
    createdAt: '2024-02-01'
  },
  {
    id: 't3',
    name: '年度总结',
    description: '清晰直观的年度工作总结模板，数据可视化友好',
    category: 'business',
    style: 'simple',
    slides: 8,
    thumbnail: '',
    tags: ['总结', '汇报', '数据', '图表'],
    popularity: 92,
    isPremium: false,
    author: 'RabAi Mind',
    subcategory: 'annual',
    download_count: 2341,
    rating_breakdown: {'design': 4.4, 'usability': 4.6, 'features': 4.5, 'total': 4.5, 'count': 678},
    createdAt: '2024-01-20'
  },
  {
    id: 't4',
    name: '培训课件',
    description: '结构清晰的培训课件模板，适合教学培训',
    category: 'education',
    style: 'simple',
    slides: 15,
    thumbnail: '',
    tags: ['培训', '教学', '课件', '教育'],
    popularity: 88,
    isPremium: false,
    author: 'RabAi Mind',
    subcategory: 'training',
    download_count: 1567,
    rating_breakdown: {'design': 4.3, 'usability': 4.7, 'features': 4.4, 'total': 4.5, 'count': 389},
    createdAt: '2024-02-10'
  },
  // 更多模板
  {
    id: 't9',
    name: '互联网大会',
    description: '高端大气的行业大会演讲模板，适合大型会议',
    category: 'tech',
    style: 'premium',
    slides: 20,
    thumbnail: '',
    tags: ['大会', '演讲', '峰会', '互联网'],
    popularity: 87,
    isPremium: true,
    author: 'RabAi Mind',
    subcategory: 'internet_conf',
    download_count: 1765,
    rating_breakdown: {'design': 4.7, 'usability': 4.4, 'features': 4.6, 'total': 4.6, 'count': 389},
    createdAt: '2024-02-20'
  },
  {
    id: 't10',
    name: '婚礼请柬',
    description: '温馨浪漫的婚礼邀请函模板，适合喜宴邀请',
    category: 'personal',
    style: 'elegant',
    slides: 5,
    thumbnail: '',
    tags: ['婚礼', '请柬', '邀请', '浪漫'],
    popularity: 78,
    isPremium: false,
    author: 'RabAi Mind',
    subcategory: 'wedding',
    download_count: 543,
    rating_breakdown: {'design': 4.9, 'usability': 4.6, 'features': 4.2, 'total': 4.6, 'count': 132},
    createdAt: '2024-02-18'
  },
  {
    id: 't11',
    name: '政府汇报',
    description: '端庄稳重的政府工作汇报模板，适合政务演示',
    category: 'government',
    style: 'professional',
    slides: 15,
    thumbnail: '',
    tags: ['政府', '汇报', '政务', '党建'],
    popularity: 85,
    isPremium: false,
    author: 'RabAi Mind',
    subcategory: 'gov_report',
    download_count: 634,
    rating_breakdown: {'design': 4.0, 'usability': 4.2, 'features': 4.1, 'total': 4.1, 'count': 98},
    createdAt: '2024-02-15'
  },
  {
    id: 't12',
    name: '学术答辩',
    description: '严谨规范的学术论文答辩模板，适合毕业论文',
    category: 'education',
    style: 'simple',
    slides: 12,
    thumbnail: '',
    tags: ['答辩', '论文', '学术', '毕业'],
    popularity: 82,
    isPremium: false,
    author: 'RabAi Mind',
    subcategory: 'defense',
    download_count: 1087,
    rating_breakdown: {'design': 4.2, 'usability': 4.5, 'features': 4.4, 'total': 4.4, 'count': 298},
    createdAt: '2024-02-12'
  },
  {
    id: 't13',
    name: '生日派对',
    description: '活泼可爱的生日派对模板，适合庆祝活动',
    category: 'personal',
    style: 'playful',
    slides: 8,
    thumbnail: '',
    tags: ['生日', '派对', '庆祝', '卡通'],
    popularity: 75,
    isPremium: false,
    author: 'RabAi Mind',
    subcategory: 'birthday',
    download_count: 432,
    rating_breakdown: {'design': 4.7, 'usability': 4.9, 'features': 4.3, 'total': 4.6, 'count': 156},
    createdAt: '2024-02-08'
  },
  {
    id: 't14',
    name: '产品介绍',
    description: '清晰的产品功能介绍模板，适合产品演示',
    category: 'business',
    style: 'creative',
    slides: 10,
    thumbnail: '',
    tags: ['产品', '介绍', '功能', '演示'],
    popularity: 89,
    isPremium: false,
    author: 'RabAi Mind',
    subcategory: 'product_intro',
    download_count: 1123,
    rating_breakdown: {'design': 4.5, 'usability': 4.6, 'features': 4.7, 'total': 4.6, 'count': 287},
    createdAt: '2024-02-05'
  },
  {
    id: 't15',
    name: '运动会',
    description: '动感活力的校园运动会模板，适合体育活动',
    category: 'education',
    style: 'energetic',
    slides: 8,
    thumbnail: '',
    tags: ['运动', '体育', '校园', '活力'],
    popularity: 72,
    isPremium: false,
    author: 'RabAi Mind',
    subcategory: 'campus',
    download_count: 567,
    rating_breakdown: {'design': 4.3, 'usability': 4.7, 'features': 4.4, 'total': 4.5, 'count': 123},
    createdAt: '2024-02-02'
  },
  {
    id: 't16',
    name: '投资路演',
    description: '专业的投资融资路演模板，适合创业者',
    category: 'business',
    style: 'premium',
    slides: 15,
    thumbnail: '',
    tags: ['路演', '投资', '融资', 'VC'],
    popularity: 91,
    isPremium: true,
    author: 'RabAi Mind',
    subcategory: 'roadshow',
    download_count: 1543,
    rating_breakdown: {'design': 4.6, 'usability': 4.5, 'features': 4.7, 'total': 4.6, 'count': 345},
    createdAt: '2024-01-28'
  },
  {
    id: 't17',
    name: '中国风',
    description: '典雅水墨风格的中国风模板，适合传统文化展示',
    category: 'creative',
    style: 'elegant',
    slides: 10,
    thumbnail: '',
    tags: ['中国风', '水墨', '传统', '文化'],
    popularity: 83,
    isPremium: false,
    author: 'RabAi Mind',
    subcategory: 'art',
    download_count: 678,
    rating_breakdown: {'design': 4.9, 'usability': 4.2, 'features': 4.3, 'total': 4.5, 'count': 156},
    createdAt: '2024-01-25'
  },
  {
    id: 't18',
    name: '数据报告',
    description: '专业的数据分析报告模板，适合商业 intelligence',
    category: 'business',
    style: 'tech',
    slides: 12,
    thumbnail: '',
    tags: ['数据', '分析', '报告', 'BI'],
    popularity: 90,
    isPremium: true,
    author: 'RabAi Mind',
    subcategory: 'analysis',
    download_count: 1654,
    rating_breakdown: {'design': 4.5, 'usability': 4.6, 'features': 4.8, 'total': 4.6, 'count': 423},
    createdAt: '2024-01-22'
  },
  {
    id: 't19',
    name: '团队介绍',
    description: '展示团队成员和企业文化的介绍模板',
    category: 'business',
    style: 'simple',
    slides: 6,
    thumbnail: '',
    tags: ['团队', '介绍', '成员', '文化'],
    popularity: 86,
    isPremium: false,
    author: 'RabAi Mind',
    subcategory: 'team',
    download_count: 876,
    rating_breakdown: {'design': 4.4, 'usability': 4.7, 'features': 4.3, 'total': 4.5, 'count': 234},
    createdAt: '2024-01-18'
  },
  {
    id: 't20',
    name: '科技未来',
    description: '充满未来感的科技主题模板，适合技术分享',
    category: 'tech',
    style: 'tech',
    slides: 12,
    thumbnail: '',
    tags: ['科技', '未来', 'AI', '创新'],
    popularity: 94,
    isPremium: true,
    author: 'RabAi Mind',
    subcategory: 'tech_share',
    download_count: 2543,
    rating_breakdown: {'design': 4.8, 'usability': 4.5, 'features': 4.9, 'total': 4.7, 'count': 612},
    createdAt: '2024-01-15'
  },
  {
    id: 't5',
    name: '公司介绍',
    description: '大气磅礴的公司介绍模板，展现企业形象',
    category: 'business',
    style: 'premium',
    slides: 10,
    thumbnail: '',
    tags: ['公司', '介绍', '企业', '宣传'],
    popularity: 90,
    isPremium: true,
    author: 'RabAi Mind',
    subcategory: 'company',
    download_count: 1432,
    rating_breakdown: {'design': 4.6, 'usability': 4.4, 'features': 4.5, 'total': 4.5, 'count': 321},
    createdAt: '2024-01-25'
  },
  {
    id: 't6',
    name: '项目汇报',
    description: '逻辑清晰的项目汇报模板，适合项目进度展示',
    category: 'business',
    style: 'professional',
    slides: 8,
    thumbnail: '',
    tags: ['项目', '汇报', '进度', '管理'],
    popularity: 85,
    isPremium: false,
    author: 'RabAi Mind',
    subcategory: 'proposal',
    download_count: 987,
    rating_breakdown: {'design': 4.5, 'usability': 4.7, 'features': 4.6, 'total': 4.6, 'count': 245},
    createdAt: '2024-02-05'
  },
  {
    id: 't7',
    name: '创意提案',
    description: '富有创意的提案模板，吸引客户注意力',
    category: 'creative',
    style: 'creative',
    slides: 12,
    thumbnail: '',
    tags: ['提案', '创意', '策划', '客户'],
    popularity: 82,
    isPremium: true,
    author: 'RabAi Mind',
    subcategory: 'marketing',
    download_count: 756,
    rating_breakdown: {'design': 4.9, 'usability': 4.3, 'features': 4.5, 'total': 4.6, 'count': 167},
    createdAt: '2024-02-15'
  },
  {
    id: 't8',
    name: '个人简历',
    description: '简洁大方的个人简历模板，求职必备',
    category: 'personal',
    style: 'simple',
    slides: 3,
    thumbnail: '',
    tags: ['简历', '求职', '个人', '应聘'],
    popularity: 80,
    isPremium: false,
    author: 'RabAi Mind',
    subcategory: 'resume',
    download_count: 654,
    rating_breakdown: {'design': 4.4, 'usability': 4.8, 'features': 4.2, 'total': 4.5, 'count': 198},
    createdAt: '2024-01-30'
  },
  // R86: Document Generation Templates
  {
    id: 'doc1',
    name: '季度报告',
    description: '专业季度报告模板，支持从数据源自动填充财务/运营数据',
    category: 'business',
    style: 'professional',
    slides: 10,
    thumbnail: '',
    tags: ['季度报告', '数据填充', '财务', '运营', '自动填充'],
    popularity: 93,
    isPremium: false,
    author: 'RabAi Mind',
    subcategory: 'quarterly',
    download_count: 1876,
    rating_breakdown: {'design': 4.5, 'usability': 4.7, 'features': 4.8, 'total': 4.7, 'count': 534},
    createdAt: '2024-03-15'
  },
  {
    id: 'doc2',
    name: '会议议程',
    description: '清晰高效的会议议程模板，包含时间分配和行动项',
    category: 'business',
    style: 'simple',
    slides: 5,
    thumbnail: '',
    tags: ['会议', '议程', '时间管理', '行动项'],
    popularity: 88,
    isPremium: false,
    author: 'RabAi Mind',
    subcategory: 'meeting',
    download_count: 1563,
    rating_breakdown: {'design': 4.3, 'usability': 4.9, 'features': 4.6, 'total': 4.6, 'count': 412},
    createdAt: '2024-03-15'
  },
  {
    id: 'doc3',
    name: '销售提案',
    description: '结构化销售提案模板，基于AIDA说服模型设计',
    category: 'marketing',
    style: 'energetic',
    slides: 12,
    thumbnail: '',
    tags: ['销售', '提案', 'AIDA', '说服', '客户'],
    popularity: 91,
    isPremium: true,
    author: 'RabAi Mind',
    subcategory: 'sales',
    download_count: 1432,
    rating_breakdown: {'design': 4.6, 'usability': 4.4, 'features': 4.7, 'total': 4.6, 'count': 321},
    createdAt: '2024-03-15'
  },
  {
    id: 'doc4',
    name: '项目提案',
    description: '完整项目提案模板，适合项目立项和资源申请',
    category: 'business',
    style: 'professional',
    slides: 14,
    thumbnail: '',
    tags: ['项目', '提案', '立项', '资源', '计划'],
    popularity: 90,
    isPremium: false,
    author: 'RabAi Mind',
    subcategory: 'proposal',
    download_count: 987,
    rating_breakdown: {'design': 4.5, 'usability': 4.7, 'features': 4.6, 'total': 4.6, 'count': 245},
    createdAt: '2024-03-15'
  },
  {
    id: 'doc5',
    name: '培训手册',
    description: '章节导航式培训手册模板，适合企业内训和教学课件',
    category: 'education',
    style: 'simple',
    slides: 20,
    thumbnail: '',
    tags: ['培训', '手册', '章节导航', '教学', '课件'],
    popularity: 87,
    isPremium: false,
    author: 'RabAi Mind',
    subcategory: 'training',
    download_count: 1123,
    rating_breakdown: {'design': 4.4, 'usability': 4.8, 'features': 4.5, 'total': 4.6, 'count': 287},
    createdAt: '2024-03-15'
  }
]

export function useTemplateStore() {
  const templates = ref<Template[]>([])
  const favorites = ref<Set<string>>(new Set())
  const searchQuery = ref('')
  const selectedCategory = ref<string | null>(null)
  const selectedStyle = ref<string | null>(null)
  const sortBy = ref<'popularity' | 'newest' | 'name'>('popularity')
  const isLoading = ref(false)

  // 从真实API加载模板列表
  const loadTemplates = async () => {
    isLoading.value = true
    try {
      // 调用后端 /api/v1/ppt/templates（TemplateManager 提供）
      // BUG修复: 之前错误地调用 /templates，应该是 /ppt/templates
      const res = await apiClient.get('/ppt/templates')
      // 兼容两种响应格式：直接数组 或 {data: [...]} 或 {success: true, data: [...]}
      const raw: any[] = Array.isArray(res.data)
        ? res.data
        : (res.data.data || res.data.templates || [])
      // BUG修复: 使用正确的变量名 raw 而不是未定义的 apiTemplates
      if (raw && raw.length > 0) {
        templates.value = raw.map(mapApiTemplate)
      } else {
        // API无数据时降级用本地假数据
        templates.value = sampleTemplates
      }
    } catch (e) {
      console.warn('[TemplateStore] 加载模板失败，降级使用本地数据', e)
      templates.value = sampleTemplates
    } finally {
      isLoading.value = false
    }
  }

  // BUG修复: 从API加载分类和风格
  const loadCategoriesAndStyles = async () => {
    try {
      const [catsRes, stylesRes] = await Promise.all([
        apiClient.get('/templates/categories').catch(() => null),
        apiClient.get('/templates/styles').catch(() => null)
      ])

      // 合并API返回的分类（保留图标映射）
      if (catsRes?.data?.categories) {
        const apiCats: string[] = catsRes.data.categories
        templateCategories.value = apiCats.map((id: string) => {
          const found = defaultCategories.find(c => c.id === id)
          return found || { id, name: id, icon: '📁', count: 0 }
        })
      }

      // 合并API返回的风格（保留图标映射）
      if (stylesRes?.data?.styles) {
        const apiStyles: string[] = stylesRes.data.styles
        templateStyles.value = apiStyles.map((id: string) => {
          const found = defaultStyles.find(s => s.id === id)
          return found || { id, name: id, icon: '🎨' }
        })
      }

      console.log('[TemplateStore] 分类/风格已从API加载')
    } catch (e) {
      console.warn('[TemplateStore] 加载分类/风格失败，使用硬编码兜底:', e)
    }
  }

  // 从本地存储加载收藏
  const loadFavorites = () => {
    try {
      const saved = localStorage.getItem('template_favorites')
      if (saved) {
        favorites.value = new Set(JSON.parse(saved))
      }
    } catch {
      // 忽略错误
    }
  }

  // 保存收藏到本地存储
  const saveFavorites = () => {
    try {
      localStorage.setItem('template_favorites', JSON.stringify([...favorites.value]))
    } catch {
      // 忽略错误
    }
  }

  // 切换收藏
  const toggleFavorite = (templateId: string) => {
    if (favorites.value.has(templateId)) {
      favorites.value.delete(templateId)
    } else {
      favorites.value.add(templateId)
    }
    saveFavorites()
  }

  // 检查是否收藏
  const isFavorite = (templateId: string): boolean => favorites.value.has(templateId)

  // 筛选后的模板
  const filteredTemplates = computed((): Template[] => {
    let result: Template[] = [...templates.value]

    // 搜索筛选
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      result = result.filter((t: Template): boolean => {
        const nameMatch = t.name.toLowerCase().includes(query)
        const descMatch = t.description.toLowerCase().includes(query)
        const tagMatch = t.tags.some((tag: string): boolean => tag.toLowerCase().includes(query))
        return nameMatch || descMatch || tagMatch
      })
    }

    // 分类筛选
    if (selectedCategory.value) {
      result = result.filter((t: Template): boolean => t.category === selectedCategory.value)
    }

    // 风格筛选
    if (selectedStyle.value) {
      result = result.filter((t: Template): boolean => t.style === selectedStyle.value)
    }

    // 排序
    switch (sortBy.value) {
      case 'popularity':
        result.sort((a: Template, b: Template): number => b.popularity - a.popularity)
        break
      case 'newest':
        result.sort((a: Template, b: Template): number =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        break
      case 'name':
        result.sort((a: Template, b: Template): number => a.name.localeCompare(b.name))
        break
    }

    return result
  })

  // 获取收藏的模板
  const favoriteTemplates = computed((): Template[] =>
    templates.value.filter((t: Template): boolean => favorites.value.has(t.id))
  )

  // 获取热门模板
  const popularTemplates = computed((): Template[] =>
    [...templates.value].sort((a: Template, b: Template): number => b.popularity - a.popularity).slice(0, 6)
  )

  // 获取最新模板
  const newTemplates = computed((): Template[] =>
    [...templates.value].sort((a: Template, b: Template): number =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ).slice(0, 6)
  )

  // ── R35: 推荐相关状态 ────────────────────────────────────────────────
  const trendingTemplates = ref<Template[]>([])
  const recommendedTemplates = ref<Template[]>([])
  const similarTemplates = ref<Record<string, Template[]>>({})  // templateId → similar templates
  const contentMatchedTemplates = ref<Template[]>([])
  const trendingQueries = ref<Array<{ query: string; count: number }>>([])
  const detectedScene = ref<string | null>(null)
  const detectedStyle = ref<string | null>(null)

  // 从API加载热门模板（基于使用频率）
  const loadTrendingTemplates = async (limit = 6, days = 7) => {
    try {
      const res = await apiClient.get('/templates/trending', { params: { limit, days } })
      if (res.data?.success && res.data.templates?.length > 0) {
        trendingTemplates.value = res.data.templates.map((t: any) => mapApiTemplate(t))
      }
    } catch (e) {
      console.warn('[TemplateStore] 加载热门模板失败:', e)
    }
  }

  // 从API加载为你推荐
  const loadRecommendedTemplates = async (userId = 'anonymous', scene?: string, style?: string, limit = 6) => {
    try {
      const res = await apiClient.get('/templates/recommend', {
        params: { user_id: userId, scene, style, limit }
      })
      if (res.data?.success && res.data.templates?.length > 0) {
        recommendedTemplates.value = res.data.templates.map((t: any) => mapApiTemplate(t))
      }
    } catch (e) {
      console.warn('[TemplateStore] 加载推荐模板失败:', e)
    }
  }

  // 加载相似模板
  const loadSimilarTemplates = async (templateId: string, limit = 5) => {
    try {
      const res = await apiClient.get(`/templates/similar/${templateId}`, { params: { limit } })
      if (res.data?.success && res.data.templates?.length > 0) {
        similarTemplates.value[templateId] = res.data.templates.map((t: any) => mapApiTemplate(t))
      }
    } catch (e) {
      console.warn('[TemplateStore] 加载相似模板失败:', e)
    }
  }

  // 内容匹配：根据用户需求文本推荐模板
  const loadContentMatchedTemplates = async (q: string, scene?: string, style?: string, limit = 6) => {
    try {
      const res = await apiClient.get('/templates/match', {
        params: { q, scene, style, limit }
      })
      if (res.data?.success) {
        contentMatchedTemplates.value = (res.data.templates || []).map((t: any) => mapApiTemplate(t))
        detectedScene.value = res.data.detected_scene || null
        detectedStyle.value = res.data.detected_style || null
      }
    } catch (e) {
      console.warn('[TemplateStore] 内容匹配模板失败:', e)
    }
  }

  // 加载热门搜索词
  const loadTrendingQueries = async (limit = 10, days = 7) => {
    try {
      const res = await apiClient.get('/templates/search-analytics/trending-queries', { params: { limit, days } })
      if (res.data?.success) {
        trendingQueries.value = res.data.queries || []
      }
    } catch (e) {
      console.warn('[TemplateStore] 加载热门搜索词失败:', e)
    }
  }

  // 跟踪事件
  const trackTemplateEvent = async (
    eventType: 'search' | 'click' | 'use',
    templateId?: string,
    extra: Record<string, string> = {}
  ) => {
    try {
      await apiClient.post('/templates/track', null, {
        params: { event_type: eventType, template_id: templateId, ...extra }
      })
    } catch (e) {
      // 静默失败，不影响主流程
    }
  }

  // 获取分类统计
  const categoryStats = computed((): Record<string, number> => {
    const stats: Record<string, number> = {}
    templateCategories.value.forEach((cat: { id: string }): void => {
      stats[cat.id] = templates.value.filter((t: Template): boolean => t.category === cat.id).length
    })
    return stats
  })

  // 使用模板
  const useTemplate = (template: Template): Template => {
    localStorage.setItem('selected_template', JSON.stringify(template))
    return template
  }

  // R128: 子分类状态
  const selectedSubcategory = ref<string | null>(null)
  const subcategories = ref<Record<string, { id: string; name: string }[]>>(CATEGORY_SUBCATEGORIES)

  // R128: 加载子分类
  const loadSubcategories = async (category?: string) => {
    try {
      const res = await apiClient.get('/templates/subcategories', {
        params: category ? { category } : {}
      })
      if (res.data?.success) {
        if (category) {
          subcategories.value = { ...subcategories.value, [category]: res.data.subcategories || [] }
        } else {
          subcategories.value = res.data.subcategories || CATEGORY_SUBCATEGORIES
        }
      }
    } catch (e) {
      console.warn('[TemplateStore] 加载子分类失败，使用默认数据')
    }
  }

  // R128: 加载模板预览幻灯片
  const loadPreviewSlides = async (templateId: string) => {
    try {
      const res = await apiClient.get(`/templates/${templateId}/preview-slides`)
      if (res.data?.success) {
        return res.data
      }
    } catch (e) {
      console.warn('[TemplateStore] 加载预览幻灯片失败')
    }
    return null
  }

  // R128: 加载评分细分
  const loadRatingsBreakdown = async (templateId: string) => {
    try {
      const res = await apiClient.get(`/templates/${templateId}/ratings-breakdown`)
      if (res.data?.success) {
        return res.data.ratings_breakdown
      }
    } catch (e) {
      console.warn('[TemplateStore] 加载评分细分失败')
    }
    return null
  }

  // R128: 提交评分细分
  const submitRatingsBreakdown = async (
    templateId: string,
    design: number,
    usability: number,
    features: number,
    content: string = ''
  ) => {
    try {
      const res = await apiClient.post(`/templates/${templateId}/ratings-breakdown`, {
        user_id: 'anonymous',
        user_name: '用户',
        design,
        usability,
        features,
        content,
      })
      if (res.data?.success) {
        return res.data.ratings_breakdown
      }
    } catch (e) {
      console.warn('[TemplateStore] 提交评分细分失败')
    }
    return null
  }

  // R128: 记录下载
  const trackDownload = async (templateId: string) => {
    try {
      await apiClient.post(`/templates/${templateId}/download`)
    } catch (e) {
      console.warn('[TemplateStore] 记录下载失败')
    }
  }

  // R128: 加载精选合集
  const collections = ref<any[]>([])
  const loadCollections = async () => {
    try {
      const res = await apiClient.get('/templates/collections')
      if (res.data?.success) {
        collections.value = res.data.collections || []
      }
    } catch (e) {
      console.warn('[TemplateStore] 加载精选合集失败')
    }
  }

  return {
    templates,
    favorites,
    searchQuery,
    selectedCategory,
    selectedStyle,
    selectedSubcategory,
    subcategories,
    sortBy,
    filteredTemplates,
    favoriteTemplates,
    popularTemplates,
    newTemplates,
    trendingTemplates,
    recommendedTemplates,
    similarTemplates,
    contentMatchedTemplates,
    trendingQueries,
    detectedScene,
    detectedStyle,
    categoryStats,
    isLoading,
    collections,
    loadTemplates,
    loadTrendingTemplates,
    loadRecommendedTemplates,
    loadSimilarTemplates,
    loadContentMatchedTemplates,
    loadTrendingQueries,
    trackTemplateEvent,
    loadCategoriesAndStyles,
    loadSubcategories,
    loadPreviewSlides,
    loadRatingsBreakdown,
    submitRatingsBreakdown,
    trackDownload,
    loadCollections,
    loadFavorites,
    toggleFavorite,
    isFavorite,
    useTemplate
  }
}

export default useTemplateStore
