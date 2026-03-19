// Extended Templates - 更多预设模板
import { ref, computed } from 'vue'

export interface Template {
  id: string
  name: string
  nameEn: string
  category: string
  style: string
  slides: number
  tags: string[]
  popularity: number
  isPremium: boolean
}

export function useExtendedTemplates() {
  const templates = ref<Template[]>([
    // 商业
    { id: 'b1', name: '融资路演', nameEn: 'Pitch Deck', category: 'business', style: 'premium', slides: 15, tags: ['融资', 'VC', '路演'], popularity: 98, isPremium: true },
    { id: 'b2', name: '商业计划', nameEn: 'Business Plan', category: 'business', style: 'professional', slides: 20, tags: ['计划', '商业', '创业'], popularity: 95, isPremium: false },
    { id: 'b3', name: '公司介绍', nameEn: 'Company Profile', category: 'business', style: 'modern', slides: 12, tags: ['公司', '介绍', '团队'], popularity: 93, isPremium: false },
    { id: 'b4', name: '年度汇报', nameEn: 'Annual Report', category: 'business', style: 'professional', slides: 25, tags: ['年度', '汇报', '总结'], popularity: 90, isPremium: true },
    { id: 'b5', name: '项目提案', nameEn: 'Project Proposal', category: 'business', style: 'creative', slides: 10, tags: ['项目', '提案', '方案'], popularity: 88, isPremium: false },

    // 科技
    { id: 't1', name: 'AI产品发布', nameEn: 'AI Product Launch', category: 'tech', style: 'futuristic', slides: 12, tags: ['AI', '产品', '发布'], popularity: 97, isPremium: true },
    { id: 't2', name: '技术分享', nameEn: 'Tech Sharing', category: 'tech', style: 'minimal', slides: 15, tags: ['技术', '架构', '分享'], popularity: 92, isPremium: false },
    { id: 't3', name: 'App演示', nameEn: 'App Demo', category: 'tech', style: 'modern', slides: 10, tags: ['APP', '演示', '产品'], popularity: 91, isPremium: false },
    { id: 't4', name: 'SaaS方案', nameEn: 'SaaS Solution', category: 'tech', style: 'professional', slides: 14, tags: ['SaaS', '云', '解决方案'], popularity: 89, isPremium: true },

    // 教育
    { id: 'e1', name: '在线课程', nameEn: 'Online Course', category: 'education', style: 'friendly', slides: 20, tags: ['课程', '培训', '在线'], popularity: 94, isPremium: false },
    { id: 'e2', name: '学术报告', nameEn: 'Academic Report', category: 'education', style: 'academic', slides: 15, tags: ['学术', '研究', '报告'], popularity: 88, isPremium: false },
    { id: 'e3', name: '培训课件', nameEn: 'Training', category: 'education', style: 'modern', slides: 12, tags: ['培训', '课件', '教学'], popularity: 90, isPremium: false },
    { id: 'e4', name: '论文答辩', nameEn: 'Thesis Defense', category: 'education', style: 'academic', slides: 15, tags: ['论文', '答辩', '学术'], popularity: 85, isPremium: false },

    // 创意
    { id: 'c1', name: '品牌故事', nameEn: 'Brand Story', category: 'creative', style: 'artistic', slides: 10, tags: ['品牌', '故事', '文化'], popularity: 96, isPremium: true },
    { id: 'c2', name: '作品集', nameEn: 'Portfolio', category: 'creative', style: 'minimal', slides: 15, tags: ['作品', '设计', '集'], popularity: 95, isPremium: false },
    { id: 'c3', name: '活动策划', nameEn: 'Event Plan', category: 'creative', style: 'playful', slides: 8, tags: ['活动', '策划', '创意'], popularity: 87, isPremium: false },
    { id: 'c4', name: '摄影集', nameEn: 'Photo Gallery', category: 'creative', style: 'elegant', slides: 12, tags: ['摄影', '图片', '作品'], popularity: 83, isPremium: false },

    // 营销
    { id: 'm1', name: '营销方案', nameEn: 'Marketing Plan', category: 'marketing', style: 'energetic', slides: 12, tags: ['营销', '推广', '方案'], popularity: 93, isPremium: false },
    { id: 'm2', name: '产品宣传', nameEn: 'Product Promo', category: 'marketing', style: 'modern', slides: 10, tags: ['产品', '宣传', '推广'], popularity: 91, isPremium: false },
    { id: 'm3', name: '社交媒体', nameEn: 'Social Media', category: 'marketing', style: 'creative', slides: 8, tags: ['社交', '新媒体', '运营'], popularity: 86, isPremium: false },

    // 金融
    { id: 'f1', name: '投资报告', nameEn: 'Investment Report', category: 'finance', style: 'premium', slides: 15, tags: ['投资', '分析', '报告'], popularity: 90, isPremium: true },
    { id: 'f2', name: '理财规划', nameEn: 'Financial Plan', category: 'finance', style: 'luxury', slides: 10, tags: ['理财', '规划', '财富'], popularity: 88, isPremium: true },

    // 医疗
    { id: 'md1', name: '医疗演示', nameEn: 'Medical Demo', category: 'medical', style: 'professional', slides: 12, tags: ['医疗', '健康', '演示'], popularity: 84, isPremium: false },
    { id: 'md2', name: '健康讲座', nameEn: 'Health Talk', category: 'medical', style: 'friendly', slides: 10, tags: ['健康', '讲座', '科普'], popularity: 82, isPremium: false },

    // 政府
    { id: 'g1', name: '政务汇报', nameEn: 'Government Report', category: 'government', style: 'formal', slides: 15, tags: ['政务', '汇报', '政府'], popularity: 80, isPremium: false },
    { id: 'g2', name: '党建活动', nameEn: 'Party Building', category: 'government', style: 'formal', slides: 10, tags: ['党建', '活动', '组织'], popularity: 78, isPremium: false },

    // 餐饮
    { id: 'r1', name: '餐厅菜单', nameEn: 'Restaurant Menu', category: 'restaurant', style: 'elegant', slides: 8, tags: ['餐饮', '菜单', '美食'], popularity: 85, isPremium: false },
    { id: 'r2', name: '食品宣传', nameEn: 'Food Promo', category: 'restaurant', style: 'colorful', slides: 10, tags: ['食品', '宣传', '推广'], popularity: 88, isPremium: false },
    { id: 'r3', name: '烹饪课程', nameEn: 'Cooking Class', category: 'restaurant', style: 'friendly', slides: 12, tags: ['烹饪', '菜谱', '教学'], popularity: 82, isPremium: false },

    // 房地产
    { id: 're1', name: '房产推介', nameEn: 'Property Presentation', category: 'realestate', style: 'luxury', slides: 15, tags: ['房产', '地产', '楼盘'], popularity: 89, isPremium: true },
    { id: 're2', name: '户型展示', nameEn: 'Floor Plan', category: 'realestate', style: 'modern', slides: 10, tags: ['户型', '房间', '布局'], popularity: 86, isPremium: false },
    { id: 're3', name: '楼盘宣传', nameEn: 'Property Promo', category: 'realestate', style: 'premium', slides: 12, tags: ['楼盘', '宣传', '销售'], popularity: 87, isPremium: true },

    // 旅游
    { id: 'tr1', name: '旅游攻略', nameEn: 'Travel Guide', category: 'travel', style: 'adventure', slides: 15, tags: ['旅游', '攻略', '出行'], popularity: 91, isPremium: false },
    { id: 'tr2', name: '行程安排', nameEn: 'Itinerary', category: 'travel', style: 'minimal', slides: 8, tags: ['行程', '安排', '计划'], popularity: 88, isPremium: false },
    { id: 'tr3', name: '酒店介绍', nameEn: 'Hotel Introduction', category: 'travel', style: 'luxury', slides: 10, tags: ['酒店', '住宿', '介绍'], popularity: 84, isPremium: false },

    // 运动健身
    { id: 'sp1', name: '健身计划', nameEn: 'Fitness Plan', category: 'sports', style: 'energetic', slides: 12, tags: ['健身', '运动', '计划'], popularity: 86, isPremium: false },
    { id: 'sp2', name: '赛事介绍', nameEn: 'Event Introduction', category: 'sports', style: 'dynamic', slides: 10, tags: ['赛事', '比赛', '活动'], popularity: 83, isPremium: false },
    { id: 'sp3', name: '体育教学', nameEn: 'Sports Teaching', category: 'sports', style: 'professional', slides: 15, tags: ['体育', '教学', '训练'], popularity: 81, isPremium: false },

    // 音乐艺术
    { id: 'ma1', name: '音乐会', nameEn: 'Concert', category: 'music', style: 'artistic', slides: 10, tags: ['音乐', '演唱会', '艺术'], popularity: 85, isPremium: false },
    { id: 'ma2', name: '画展介绍', nameEn: 'Art Exhibition', category: 'music', style: 'elegant', slides: 12, tags: ['画展', '艺术', '展览'], popularity: 82, isPremium: false },
    { id: 'ma3', name: '乐器教学', nameEn: 'Music Teaching', category: 'music', style: 'classic', slides: 15, tags: ['乐器', '音乐', '教学'], popularity: 80, isPremium: false },

    // 时尚美妆
    { id: 'fc1', name: '时尚走秀', nameEn: 'Fashion Show', category: 'fashion', style: 'trendy', slides: 10, tags: ['时尚', '走秀', '服装'], popularity: 87, isPremium: true },
    { id: 'fc2', name: '美妆教程', nameEn: 'Beauty Tutorial', category: 'fashion', style: 'glamorous', slides: 12, tags: ['美妆', '化妆', '教程'], popularity: 89, isPremium: false },
    { id: 'fc3', name: '穿搭分享', nameEn: 'Outfit Sharing', category: 'fashion', style: 'modern', slides: 8, tags: ['穿搭', '服装', '时尚'], popularity: 85, isPremium: false },

    // 宠物
    { id: 'pe1', name: '宠物展示', nameEn: 'Pet Show', category: 'pet', style: 'cute', slides: 10, tags: ['宠物', '可爱', '动物'], popularity: 84, isPremium: false },
    { id: 'pe2', name: '宠物训练', nameEn: 'Pet Training', category: 'pet', style: 'friendly', slides: 12, tags: ['宠物', '训练', '教学'], popularity: 81, isPremium: false },

    // 环保
    { id: 'en1', name: '环保宣传', nameEn: 'Environmental Promo', category: 'environmental', style: 'natural', slides: 10, tags: ['环保', '绿色', '宣传'], popularity: 83, isPremium: false },
    { id: 'en2', name: '公益活动', nameEn: 'Charity Event', category: 'environmental', style: 'warm', slides: 12, tags: ['公益', '活动', '慈善'], popularity: 86, isPremium: false }
  ])

  const categories = [
    { id: 'business', name: '商业', count: 5 },
    { id: 'tech', name: '科技', count: 4 },
    { id: 'education', name: '教育', count: 4 },
    { id: 'creative', name: '创意', count: 4 },
    { id: 'marketing', name: '营销', count: 3 },
    { id: 'finance', name: '金融', count: 2 },
    { id: 'medical', name: '医疗', count: 2 },
    { id: 'government', name: '政府', count: 2 },
    { id: 'restaurant', name: '餐饮', count: 3 },
    { id: 'realestate', name: '房地产', count: 3 },
    { id: 'travel', name: '旅游', count: 3 },
    { id: 'sports', name: '运动', count: 3 },
    { id: 'music', name: '音乐艺术', count: 3 },
    { id: 'fashion', name: '时尚美妆', count: 3 },
    { id: 'pet', name: '宠物', count: 2 },
    { id: 'environmental', name: '环保公益', count: 2 }
  ]

  const getByCategory = (cat: string) => templates.value.filter(t => t.category === cat)
  const getPopular = (n = 10) => [...templates.value].sort((a, b) => b.popularity - a.popularity).slice(0, n)
  const search = (q: string) => templates.value.filter(t => t.name.toLowerCase().includes(q.toLowerCase()) || t.tags.some(tag => tag.toLowerCase().includes(q.toLowerCase())))

  const stats = computed(() => ({
    total: templates.value.length,
    free: templates.value.filter(t => !t.isPremium).length,
    premium: templates.value.filter(t => t.isPremium).length
  }))

  return { templates, categories, getByCategory, getPopular, search, stats }
}

export default useExtendedTemplates
