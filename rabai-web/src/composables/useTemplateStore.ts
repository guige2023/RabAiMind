// Template store - 模板市场数据管理
import { ref, computed } from 'vue'

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
}

// 模板分类
export const templateCategories = [
  { id: 'business', name: '商业', icon: '💼', count: 12 },
  { id: 'education', name: '教育', icon: '📚', count: 8 },
  { id: 'tech', name: '科技', icon: '🚀', count: 6 },
  { id: 'creative', name: '创意', icon: '💡', count: 10 },
  { id: 'personal', name: '个人', icon: '👤', count: 5 },
  { id: 'government', name: '政府', icon: '🏛️', count: 4 }
]

// 模板风格
export const templateStyles = [
  { id: 'professional', name: '专业商务', icon: '💼' },
  { id: 'simple', name: '简约现代', icon: '✨' },
  { id: 'energetic', name: '活力动感', icon: '🔥' },
  { id: 'premium', name: '高端大气', icon: '👑' },
  { id: 'tech', name: '科技未来', icon: '🔬' },
  { id: 'creative', name: '创意艺术', icon: '🎨' },
  { id: 'elegant', name: '优雅古典', icon: '🌸' },
  { id: 'playful', name: '卡通趣味', icon: '🎮' }
]

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
    createdAt: '2024-02-10'
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
    createdAt: '2024-01-30'
  }
]

export function useTemplateStore() {
  const templates = ref<Template[]>(sampleTemplates)
  const favorites = ref<Set<string>>(new Set())
  const searchQuery = ref('')
  const selectedCategory = ref<string | null>(null)
  const selectedStyle = ref<string | null>(null)
  const sortBy = ref<'popularity' | 'newest' | 'name'>('popularity')

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

  // 获取分类统计
  const categoryStats = computed((): Record<string, number> => {
    const stats: Record<string, number> = {}
    templateCategories.forEach((cat: { id: string }): void => {
      stats[cat.id] = templates.value.filter((t: Template): boolean => t.category === cat.id).length
    })
    return stats
  })

  // 使用模板
  const useTemplate = (template: Template): Template => {
    localStorage.setItem('selected_template', JSON.stringify(template))
    return template
  }

  return {
    templates,
    favorites,
    searchQuery,
    selectedCategory,
    selectedStyle,
    sortBy,
    filteredTemplates,
    favoriteTemplates,
    popularTemplates,
    newTemplates,
    categoryStats,
    loadFavorites,
    toggleFavorite,
    isFavorite,
    useTemplate
  }
}

export default useTemplateStore
