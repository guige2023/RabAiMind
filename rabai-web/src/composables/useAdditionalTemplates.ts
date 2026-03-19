// Additional Templates - 更多模板
import { ref, computed } from 'vue'

export interface AdditionalTemplate {
  id: string
  name: string
  description: string
  category: string
  subcategory: string
  style: string
  color: string
  slides: number
  tags: string[]
  popularity: number
  isPremium: boolean
  isNew: boolean
  author: string
}

export const additionalTemplates: AdditionalTemplate[] = [
  // 商务类
  {
    id: 'biz-1',
    name: '公司简介',
    description: '简洁大气的公司介绍模板，适合企业宣传',
    category: 'business',
    subcategory: '介绍',
    style: 'professional',
    color: '#165DFF',
    slides: 10,
    tags: ['公司', '介绍', '企业', '宣传'],
    popularity: 96,
    isPremium: false,
    isNew: false,
    author: 'RabAi Mind'
  },
  {
    id: 'biz-2',
    name: '项目汇报',
    description: '清晰的项目进度汇报模板，适合项目管理',
    category: 'business',
    subcategory: '汇报',
    style: 'simple',
    color: '#52C41A',
    slides: 8,
    tags: ['项目', '汇报', '进度', '管理'],
    popularity: 90,
    isPremium: false,
    isNew: false,
    author: 'RabAi Mind'
  },
  {
    id: 'biz-3',
    name: '市场分析',
    description: '专业的市场分析报告模板，数据图表丰富',
    category: 'business',
    subcategory: '分析',
    style: 'professional',
    color: '#722ED1',
    slides: 12,
    tags: ['市场', '分析', '数据', '报告'],
    popularity: 88,
    isPremium: true,
    isNew: false,
    author: 'RabAi Mind'
  },
  {
    id: 'biz-4',
    name: '团队介绍',
    description: '展示团队实力和成员风采的模板',
    category: 'business',
    subcategory: '介绍',
    style: 'premium',
    color: '#FA8C16',
    slides: 6,
    tags: ['团队', '成员', '介绍', '展示'],
    popularity: 85,
    isPremium: false,
    isNew: true,
    author: 'RabAi Mind'
  },

  // 教育类
  {
    id: 'edu-1',
    name: '学术答辩',
    description: '严谨的论文答辩模板，适合学术场合',
    category: 'education',
    subcategory: '答辩',
    style: 'elegant',
    color: '#13C2C2',
    slides: 15,
    tags: ['答辩', '论文', '学术', '研究'],
    popularity: 92,
    isPremium: false,
    isNew: false,
    author: 'RabAi Mind'
  },
  {
    id: 'edu-2',
    name: '教学课件',
    description: '互动性强的教学课件模板，适合课堂教学',
    category: 'education',
    subcategory: '课件',
    style: 'playful',
    color: '#EB2F96',
    slides: 20,
    tags: ['教学', '课件', '课堂', '互动'],
    popularity: 89,
    isPremium: false,
    isNew: false,
    author: 'RabAi Mind'
  },
  {
    id: 'edu-3',
    name: '培训演讲',
    description: '专业培训师使用的演讲模板',
    category: 'education',
    subcategory: '培训',
    style: 'energetic',
    color: '#F5222D',
    slides: 12,
    tags: ['培训', '演讲', '讲师', '激励'],
    popularity: 87,
    isPremium: true,
    isNew: true,
    author: 'RabAi Mind'
  },

  // 科技类
  {
    id: 'tech-1',
    name: 'AI产品介绍',
    description: '面向AI产品的专业介绍模板',
    category: 'tech',
    subcategory: '产品',
    style: 'tech',
    color: '#5AC8FA',
    slides: 10,
    tags: ['AI', '产品', '技术', '智能'],
    popularity: 94,
    isPremium: true,
    isNew: true,
    author: 'RabAi Mind'
  },
  {
    id: 'tech-2',
    name: '技术架构',
    description: '展示技术架构和系统设计的模板',
    category: 'tech',
    subcategory: '架构',
    style: 'tech',
    color: '#2F54EB',
    slides: 8,
    tags: ['技术', '架构', '系统', '设计'],
    popularity: 86,
    isPremium: false,
    isNew: false,
    author: 'RabAi Mind'
  },
  {
    id: 'tech-3',
    name: '互联网大会',
    description: '大型互联网会议使用的科技感模板',
    category: 'tech',
    subcategory: '会议',
    style: 'tech',
    color: '#3949AB',
    slides: 15,
    tags: ['大会', '会议', '互联网', '峰会'],
    popularity: 91,
    isPremium: true,
    isNew: false,
    author: 'RabAi Mind'
  },

  // 创意类
  {
    id: 'cre-1',
    name: '作品集',
    description: '设计师和创意人员展示作品的模板',
    category: 'creative',
    subcategory: '作品',
    style: 'creative',
    color: '#EB2F96',
    slides: 12,
    tags: ['作品', '集', '设计', '创意'],
    popularity: 93,
    isPremium: false,
    isNew: false,
    author: 'RabAi Mind'
  },
  {
    id: 'cre-2',
    name: '个人简历',
    description: '创新的个人简历模板，让面试官眼前一亮',
    category: 'creative',
    subcategory: '简历',
    style: 'simple',
    color: '#52C41A',
    slides: 4,
    tags: ['简历', '个人', '求职', '面试'],
    popularity: 89,
    isPremium: false,
    isNew: false,
    author: 'RabAi Mind'
  },
  {
    id: 'cre-3',
    name: '摄影作品',
    description: '展示摄影作品的画廊风格模板',
    category: 'creative',
    subcategory: '摄影',
    style: 'elegant',
    color: '#722ED1',
    slides: 8,
    tags: ['摄影', '作品', '画廊', '展示'],
    popularity: 84,
    isPremium: true,
    isNew: true,
    author: 'RabAi Mind'
  },

  // 金融类
  {
    id: 'fin-1',
    name: '投资路演',
    description: '专业的投资路演模板，适合创业者融资',
    category: 'finance',
    subcategory: '路演',
    style: 'premium',
    color: '#FAAD14',
    slides: 12,
    tags: ['投资', '路演', '融资', '创业'],
    popularity: 95,
    isPremium: true,
    isNew: false,
    author: 'RabAi Mind'
  },
  {
    id: 'fin-2',
    name: '财务报告',
    description: '专业的财务报表模板，数据清晰直观',
    category: 'finance',
    subcategory: '报告',
    style: 'professional',
    color: '#13C2C2',
    slides: 10,
    tags: ['财务', '报告', '数据', '分析'],
    popularity: 88,
    isPremium: false,
    isNew: false,
    author: 'RabAi Mind'
  },
  {
    id: 'fin-3',
    name: '商业计划',
    description: '完整的商业计划书模板，含财务预测',
    category: 'finance',
    subcategory: '计划',
    style: 'professional',
    color: '#165DFF',
    slides: 15,
    tags: ['商业', '计划', '创业', '发展'],
    popularity: 91,
    isPremium: true,
    isNew: false,
    author: 'RabAi Mind'
  },

  // 医疗类
  {
    id: 'med-1',
    name: '医疗演示',
    description: '医疗行业专业演示模板',
    category: 'medical',
    subcategory: '演示',
    style: 'professional',
    color: '#F5222D',
    slides: 10,
    tags: ['医疗', '演示', '专业', '健康'],
    popularity: 85,
    isPremium: false,
    isNew: false,
    author: 'RabAi Mind'
  },
  {
    id: 'med-2',
    name: '健康讲座',
    description: '健康讲座和科普宣传模板',
    category: 'medical',
    subcategory: '讲座',
    style: 'simple',
    color: '#52C41A',
    slides: 8,
    tags: ['健康', '讲座', '科普', '宣传'],
    popularity: 82,
    isPremium: false,
    isNew: true,
    author: 'RabAi Mind'
  },

  // 政府类
  {
    id: 'gov-1',
    name: '政府汇报',
    description: '政府机关工作汇报模板',
    category: 'government',
    subcategory: '汇报',
    style: 'professional',
    color: '#2F54EB',
    slides: 12,
    tags: ['政府', '汇报', '工作', '党建'],
    popularity: 87,
    isPremium: false,
    isNew: false,
    author: 'RabAi Mind'
  },
  {
    id: 'gov-2',
    name: '政策宣讲',
    description: '政策宣讲和解读模板',
    category: 'government',
    subcategory: '宣讲',
    style: 'simple',
    color: '#165DFF',
    slides: 8,
    tags: ['政策', '宣讲', '解读', '宣传'],
    popularity: 83,
    isPremium: false,
    isNew: false,
    author: 'RabAi Mind'
  },

  // 个人类
  {
    id: 'per-1',
    name: '婚礼请柬',
    description: '浪漫温馨的婚礼请柬模板',
    category: 'personal',
    subcategory: '婚礼',
    style: 'elegant',
    color: '#EB2F96',
    slides: 6,
    tags: ['婚礼', '请柬', '浪漫', '温馨'],
    popularity: 90,
    isPremium: false,
    isNew: false,
    author: 'RabAi Mind'
  },
  {
    id: 'per-2',
    name: '生日派对',
    description: '创意有趣的生日派对模板',
    category: 'personal',
    subcategory: '生日',
    style: 'playful',
    color: '#FA8C16',
    slides: 8,
    tags: ['生日', '派对', '庆祝', '创意'],
    popularity: 88,
    isPremium: false,
    isNew: false,
    author: 'RabAi Mind'
  },
  {
    id: 'per-3',
    name: '旅行分享',
    description: '记录旅行精彩瞬间的分享模板',
    category: 'personal',
    subcategory: '旅行',
    style: 'creative',
    color: '#5AC8FA',
    slides: 10,
    tags: ['旅行', '分享', '精彩', '回忆'],
    popularity: 86,
    isPremium: false,
    isNew: true,
    author: 'RabAi Mind'
  },
  {
    id: 'per-4',
    name: '中国风',
    description: '传统中国风格的演示模板',
    category: 'personal',
    subcategory: '文化',
    style: 'elegant',
    color: '#F5222D',
    slides: 10,
    tags: ['中国', '传统', '文化', '古典'],
    popularity: 84,
    isPremium: true,
    isNew: false,
    author: 'RabAi Mind'
  },

  // 行业类
  {
    id: 'ind-1',
    name: '餐饮菜单',
    description: '餐厅菜单和宣传模板',
    category: 'industry',
    subcategory: '餐饮',
    style: 'creative',
    color: '#FA8C16',
    slides: 6,
    tags: ['餐饮', '菜单', '宣传', '美食'],
    popularity: 81,
    isPremium: false,
    isNew: false,
    author: 'RabAi Mind'
  },
  {
    id: 'ind-2',
    name: '房地产',
    description: '房地产项目展示模板',
    category: 'industry',
    subcategory: '地产',
    style: 'premium',
    color: '#722ED1',
    slides: 12,
    tags: ['房地产', '项目', '展示', '营销'],
    popularity: 85,
    isPremium: true,
    isNew: false,
    author: 'RabAi Mind'
  },
  {
    id: 'ind-3',
    name: '运动会',
    description: '学校或公司运动会模板',
    category: 'industry',
    subcategory: '活动',
    style: 'energetic',
    color: '#52C41A',
    slides: 8,
    tags: ['运动', '会', '活动', '比赛'],
    popularity: 79,
    isPremium: false,
    isNew: true,
    author: 'RabAi Mind'
  },
  {
    id: 'ind-4',
    name: '数据报告',
    description: '专业的数据报告展示模板',
    category: 'industry',
    subcategory: '报告',
    style: 'tech',
    color: '#165DFF',
    slides: 15,
    tags: ['数据', '报告', '分析', '可视化'],
    popularity: 92,
    isPremium: true,
    isNew: false,
    author: 'RabAi Mind'
  }
]

export function useAdditionalTemplates() {
  const templates = ref(additionalTemplates)
  const newTemplates = computed(() => templates.value.filter(t => t.isNew))
  const premiumTemplates = computed(() => templates.value.filter(t => t.isPremium))
  const popularTemplates = computed(() => [...templates.value].sort((a, b) => b.popularity - a.popularity).slice(0, 10))

  const getByCategory = (category: string) => templates.value.filter(t => t.category === category)
  const getByStyle = (style: string) => templates.value.filter(t => t.style === style)
  const getNew = () => newTemplates.value

  return {
    templates,
    newTemplates,
    premiumTemplates,
    popularTemplates,
    getByCategory,
    getByStyle,
    getNew
  }
}

export default useAdditionalTemplates
