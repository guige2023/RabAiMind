// Template Collection - 更多模板集合
import { ref, computed } from 'vue'

export interface Template {
  id: string
  name: string
  category: string
  style: string
  slides: number
  thumbnail: string
  tags: string[]
  popularity: number
  isPremium: boolean
}

export function useTemplateCollection() {
  // 模板列表
  const templates = ref<Template[]>([
    // 商业类
    { id: 'biz1', name: '商业计划书', category: 'business', style: 'professional', slides: 15, thumbnail: '', tags: ['融资', '路演'], popularity: 98, isPremium: false },
    { id: 'biz2', name: '公司介绍', category: 'business', style: 'modern', slides: 12, thumbnail: '', tags: ['企业', '团队'], popularity: 95, isPremium: false },
    { id: 'biz3', name: '年度报告', category: 'business', style: 'professional', slides: 20, thumbnail: '', tags: ['财务', '数据'], popularity: 92, isPremium: true },
    { id: 'biz4', name: '项目提案', category: 'business', style: 'creative', slides: 10, thumbnail: '', tags: ['项目', '方案'], popularity: 88, isPremium: false },
    { id: 'biz5', name: '团队展示', category: 'business', style: 'modern', slides: 8, thumbnail: '', tags: ['团队', '成员'], popularity: 85, isPremium: false },

    // 科技类
    { id: 'tech1', name: 'AI产品发布', category: 'tech', style: 'futuristic', slides: 12, thumbnail: '', tags: ['AI', '产品'], popularity: 97, isPremium: true },
    { id: 'tech2', name: '技术分享', category: 'tech', style: 'minimal', slides: 15, thumbnail: '', tags: ['技术', '架构'], popularity: 90, isPremium: false },
    { id: 'tech3', name: 'App演示', category: 'tech', style: 'modern', slides: 10, thumbnail: '', tags: ['APP', '演示'], popularity: 93, isPremium: false },
    { id: 'tech4', name: 'SaaS介绍', category: 'tech', style: 'professional', slides: 14, thumbnail: '', tags: ['SaaS', '云服务'], popularity: 89, isPremium: true },

    // 教育类
    { id: 'edu1', name: '在线课程', category: 'education', style: 'friendly', slides: 20, thumbnail: '', tags: ['课程', '培训'], popularity: 94, isPremium: false },
    { id: 'edu2', name: '学术报告', category: 'education', style: 'academic', slides: 15, thumbnail: '', tags: ['学术', '研究'], popularity: 87, isPremium: false },
    { id: 'edu3', name: '培训课件', category: 'education', style: 'modern', slides: 12, thumbnail: '', tags: ['培训', '教学'], popularity: 91, isPremium: false },

    // 创意类
    { id: 'cre1', name: '品牌故事', category: 'creative', style: 'artistic', slides: 10, thumbnail: '', tags: ['品牌', '故事'], popularity: 96, isPremium: true },
    { id: 'cre2', name: '活动策划', category: 'creative', style: 'playful', slides: 8, thumbnail: '', tags: ['活动', '策划'], popularity: 88, isPremium: false },
    { id: 'cre3', name: '作品集', category: 'creative', style: 'minimal', slides: 15, thumbnail: '', tags: ['作品', '设计'], popularity: 95, isPremium: false },
    { id: 'cre4', name: '摄影集', category: 'creative', style: 'elegant', slides: 12, thumbnail: '', tags: ['摄影', '图片'], popularity: 82, isPremium: false },

    // 营销类
    { id: 'mkt1', name: '营销方案', category: 'marketing', style: 'energetic', slides: 12, thumbnail: '', tags: ['营销', '推广'], popularity: 93, isPremium: false },
    { id: 'mkt2', name: '产品宣传', category: 'marketing', style: 'modern', slides: 10, thumbnail: '', tags: ['产品', '宣传'], popularity: 91, isPremium: false },
    { id: 'mkt3', name: '社交媒体', category: 'marketing', style: 'creative', slides: 8, thumbnail: '', tags: ['社交', '新媒体'], popularity: 86, isPremium: false },

    // 金融类
    { id: 'fin1', name: '投资报告', category: 'finance', style: 'professional', slides: 15, thumbnail: '', tags: ['投资', '分析'], popularity: 90, isPremium: true },
    { id: 'fin2', name: '理财规划', category: 'finance', style: 'premium', slides: 10, thumbnail: '', tags: ['理财', '规划'], popularity: 87, isPremium: true },

    // 医疗类
    { id: 'med1', name: '医疗演示', category: 'medical', style: 'professional', slides: 12, thumbnail: '', tags: ['医疗', '健康'], popularity: 84, isPremium: false },
    { id: 'med2', name: '健康讲座', category: 'medical', style: 'friendly', slides: 10, thumbnail: '', tags: ['健康', '讲座'], popularity: 81, isPremium: false }
  ])

  // 分类
  const categories = [
    { id: 'business', name: '商业', icon: '💼', count: 5 },
    { id: 'tech', name: '科技', icon: '🚀', count: 4 },
    { id: 'education', name: '教育', icon: '📚', count: 3 },
    { id: 'creative', name: '创意', icon: '💡', count: 4 },
    { id: 'marketing', name: '营销', icon: '📢', count: 3 },
    { id: 'finance', name: '金融', icon: '💰', count: 2 },
    { id: 'medical', name: '医疗', icon: '🏥', count: 2 }
  ]

  // 风格
  const styles = [
    { id: 'professional', name: '专业商务' },
    { id: 'modern', name: '现代简约' },
    { id: 'creative', name: '创意艺术' },
    { id: 'minimal', name: '极简风格' },
    { id: 'futuristic', name: '科技未来' },
    { id: 'elegant', name: '优雅古典' },
    { id: 'friendly', name: '亲切友好' }
  ]

  // 按分类获取
  const getByCategory = (category: string) => {
    return templates.value.filter(t => t.category === category)
  }

  // 搜索
  const search = (query: string) => {
    const q = query.toLowerCase()
    return templates.value.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.tags.some(tag => tag.toLowerCase().includes(q))
    )
  }

  // 热门模板
  const getPopular = (limit = 10) => {
    return [...templates.value].sort((a, b) => b.popularity - a.popularity).slice(0, limit)
  }

  // 统计
  const stats = computed(() => ({
    total: templates.value.length,
    free: templates.value.filter(t => !t.isPremium).length,
    premium: templates.value.filter(t => t.isPremium).length
  }))

  return {
    templates,
    categories,
    styles,
    getByCategory,
    search,
    getPopular,
    stats
  }
}

export default useTemplateCollection
