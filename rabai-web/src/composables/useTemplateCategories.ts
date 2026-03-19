// Template Categories - 模板分类管理
import { ref, computed } from 'vue'

export interface TemplateCategory {
  id: string
  name: string
  nameEn: string
  icon: string
  color: string
  description: string
  subcategories?: TemplateSubcategory[]
  templateCount: number
}

export interface TemplateSubcategory {
  id: string
  name: string
  icon: string
  parentId: string
  templateCount: number
}

export interface TemplateFilter {
  category?: string
  subcategory?: string
  tags?: string[]
  style?: string
  color?: string
  sortBy: 'popular' | 'newest' | 'name' | 'usage'
  sortOrder: 'asc' | 'desc'
}

export const templateCategories: TemplateCategory[] = [
  {
    id: 'business',
    name: '商务办公',
    nameEn: 'Business',
    icon: '💼',
    color: '#165DFF',
    description: '商务演示、工作汇报、企业介绍',
    templateCount: 156,
    subcategories: [
      { id: '汇报', name: '工作汇报', icon: '📊', parentId: 'business', templateCount: 45 },
      { id: '计划', name: '商业计划', icon: '📈', parentId: 'business', templateCount: 32 },
      { id: '介绍', name: '企业介绍', icon: '🏢', parentId: 'business', templateCount: 28 },
      { id: '会议', name: '会议演示', icon: '🗓️', parentId: 'business', templateCount: 25 },
      { id: '培训', name: '培训课件', icon: '📚', parentId: 'business', templateCount: 26 }
    ]
  },
  {
    id: 'education',
    name: '教育培训',
    nameEn: 'Education',
    icon: '🎓',
    color: '#52C41A',
    description: '教学课件、学术答辩、培训资料',
    templateCount: 98,
    subcategories: [
      { id: '课件', name: '教学课件', icon: '📖', parentId: 'education', templateCount: 35 },
      { id: '答辩', name: '论文答辩', icon: '🎤', parentId: 'education', templateCount: 22 },
      { id: '培训', name: '培训资料', icon: '👨‍🏫', parentId: 'education', templateCount: 25 },
      { id: '考试', name: '考试试题', icon: '✍️', parentId: 'education', templateCount: 16 }
    ]
  },
  {
    id: 'technology',
    name: '科技数码',
    nameEn: 'Technology',
    icon: '💻',
    color: '#722ED1',
    description: '产品发布、技术分享、互联网',
    templateCount: 87,
    subcategories: [
      { id: '发布', name: '产品发布', icon: '🚀', parentId: 'technology', templateCount: 28 },
      { id: '技术', name: '技术分享', icon: '⚡', parentId: 'technology', templateCount: 25 },
      { id: '互联网', name: '互联网+', icon: '🌐', parentId: 'technology', templateCount: 20 },
      { id: 'AI', name: 'AI/机器学习', icon: '🤖', parentId: 'technology', templateCount: 14 }
    ]
  },
  {
    id: 'marketing',
    name: '营销策划',
    nameEn: 'Marketing',
    icon: '📢',
    color: '#FA8C16',
    description: '品牌推广、活动策划、市场分析',
    templateCount: 124,
    subcategories: [
      { id: '品牌', name: '品牌推广', icon: '🎨', parentId: 'marketing', templateCount: 38 },
      { id: '活动', name: '活动策划', icon: '🎉', parentId: 'marketing', templateCount: 32 },
      { id: '分析', name: '市场分析', icon: '🔍', parentId: 'marketing', templateCount: 28 },
      { id: '销售', name: '销售演示', icon: '💰', parentId: 'marketing', templateCount: 26 }
    ]
  },
  {
    id: 'finance',
    name: '金融投资',
    nameEn: 'Finance',
    icon: '💰',
    color: '#13C2C2',
    description: '投资路演、财务报告、融资计划',
    templateCount: 65,
    subcategories: [
      { id: '路演', name: '投资路演', icon: '🎯', parentId: 'finance', templateCount: 22 },
      { id: '报告', name: '财务报告', icon: '📑', parentId: 'finance', templateCount: 20 },
      { id: '融资', name: '融资计划', icon: '💳', parentId: 'finance', templateCount: 15 },
      { id: '分析', name: '投资分析', icon: '📊', parentId: 'finance', templateCount: 8 }
    ]
  },
  {
    id: 'creative',
    name: '创意设计',
    nameEn: 'Creative',
    icon: '🎨',
    color: '#EB2F96',
    description: '艺术展示、创意方案、设计作品',
    templateCount: 78,
    subcategories: [
      { id: '作品', name: '作品集', icon: '🖼️', parentId: 'creative', templateCount: 25 },
      { id: '方案', name: '创意方案', icon: '💡', parentId: 'creative', templateCount: 22 },
      { id: '展示', name: '艺术展示', icon: '🖌️', parentId: 'creative', templateCount: 18 },
      { id: '个人', name: '个人简介', icon: '👤', parentId: 'creative', templateCount: 13 }
    ]
  },
  {
    id: 'government',
    name: '政府机构',
    nameEn: 'Government',
    icon: '🏛️',
    color: '#2F54EB',
    description: '政府汇报、政策宣讲、党建活动',
    templateCount: 45,
    subcategories: [
      { id: '汇报', name: '政府汇报', icon: '📋', parentId: 'government', templateCount: 18 },
      { id: '政策', name: '政策宣讲', icon: '📜', parentId: 'government', templateCount: 12 },
      { id: '党建', name: '党建活动', icon: '🇨🇳', parentId: 'government', templateCount: 10 },
      { id: '招标', name: '招标投标', icon: '📦', parentId: 'government', templateCount: 5 }
    ]
  },
  {
    id: 'medical',
    name: '医疗健康',
    nameEn: 'Medical',
    icon: '🏥',
    color: '#F5222D',
    description: '医疗演示、健康讲座、药品介绍',
    templateCount: 42,
    subcategories: [
      { id: '演示', name: '医疗演示', icon: '👨‍⚕️', parentId: 'medical', templateCount: 15 },
      { id: '讲座', name: '健康讲座', icon: '💊', parentId: 'medical', templateCount: 12 },
      { id: '药品', name: '药品介绍', icon: '💉', parentId: 'medical', templateCount: 10 },
      { id: '培训', name: '医护培训', icon: '📖', parentId: 'medical', templateCount: 5 }
    ]
  },
  {
    id: 'personal',
    name: '个人生活',
    nameEn: 'Personal',
    icon: '🏠',
    color: '#FAAD14',
    description: '婚礼生日、旅行分享、个人简历',
    templateCount: 56,
    subcategories: [
      { id: '婚礼', name: '婚礼请柬', icon: '💒', parentId: 'personal', templateCount: 20 },
      { id: '生日', name: '生日派对', icon: '🎂', parentId: 'personal', templateCount: 15 },
      { id: '旅行', name: '旅行分享', icon: '✈️', parentId: 'personal', templateCount: 12 },
      { id: '简历', name: '个人简历', icon: '📝', parentId: 'personal', templateCount: 9 }
    ]
  },
  {
    id: 'industry',
    name: '行业垂直',
    nameEn: 'Industry',
    icon: '🏭',
    color: '#606266',
    description: '各行业专用模板',
    templateCount: 89,
    subcategories: [
      { id: '制造', name: '制造业', icon: '🏗️', parentId: 'industry', templateCount: 18 },
      { id: '餐饮', name: '餐饮业', icon: '🍽️', parentId: 'industry', templateCount: 15 },
      { id: '地产', name: '房地产业', icon: '🏠', parentId: 'industry', templateCount: 15 },
      { id: '物流', name: '物流运输', icon: '🚚', parentId: 'industry', templateCount: 12 },
      { id: '能源', name: '能源环保', icon: '⚡', parentId: 'industry', templateCount: 14 },
      { id: '其他', name: '其他行业', icon: '📋', parentId: 'industry', templateCount: 15 }
    ]
  }
]

// 模板风格
export const templateStyles = [
  { id: 'minimalist', name: '简约', icon: '⬜', color: '#F0F0F0' },
  { id: 'modern', name: '现代', icon: '📐', color: '#E8F4FD' },
  { id: 'creative', name: '创意', icon: '🎨', color: '#FEF0E8' },
  { id: 'professional', name: '专业', icon: '👔', color: '#E8F5E9' },
  { id: 'elegant', name: '优雅', icon: '✨', color: '#F3E5F5' },
  { id: 'tech', name: '科技', icon: '💻', color: '#E3F2FD' },
  { id: 'vintage', name: '复古', icon: '📜', color: '#FFF8E1' },
  { id: 'colorful', name: '彩色', icon: '🌈', color: '#FFEBEE' }
]

// 模板色系
export const templateColors = [
  { id: 'blue', name: '蓝色', hex: '#165DFF' },
  { id: 'green', name: '绿色', hex: '#52C41A' },
  { id: 'purple', name: '紫色', hex: '#722ED1' },
  { id: 'orange', name: '橙色', hex: '#FA8C16' },
  { id: 'red', name: '红色', hex: '#F5222D' },
  { id: 'cyan', name: '青色', hex: '#13C2C2' },
  { id: 'pink', name: '粉色', hex: '#EB2F96' },
  { id: 'gray', name: '灰色', hex: '#8C8C8C' }
]

export function useTemplateCategories() {
  // 当前选中的分类
  const selectedCategory = ref<string | null>(null)
  const selectedSubcategory = ref<string | null>(null)
  const selectedStyle = ref<string | null>(null)
  const selectedColor = ref<string | null>(null)
  const selectedTags = ref<string[]>([])

  // 筛选配置
  const filter = ref<TemplateFilter>({
    category: undefined,
    subcategory: undefined,
    tags: [],
    style: undefined,
    color: undefined,
    sortBy: 'popular',
    sortOrder: 'desc'
  })

  // 搜索关键词
  const searchQuery = ref('')

  // 热门标签
  const popularTags = ref([
    '免费', '热门', '新品', '商务', '教育', '科技', '创意',
    '简约', '动画', '图表', '数据', '答辩', '路演', '招聘'
  ])

  // 选择分类
  const selectCategory = (categoryId: string | null) => {
    selectedCategory.value = categoryId
    selectedSubcategory.value = null
    filter.value.category = categoryId || undefined
  }

  // 选择子分类
  const selectSubcategory = (subcategoryId: string | null) => {
    selectedSubcategory.value = subcategoryId
    filter.value.subcategory = subcategoryId || undefined
  }

  // 选择风格
  const selectStyle = (styleId: string | null) => {
    selectedStyle.value = styleId
    filter.value.style = styleId || undefined
  }

  // 选择颜色
  const selectColor = (colorId: string | null) => {
    selectedColor.value = colorId
    filter.value.color = colorId || undefined
  }

  // 切换标签
  const toggleTag = (tag: string) => {
    const index = selectedTags.value.indexOf(tag)
    if (index === -1) {
      selectedTags.value.push(tag)
    } else {
      selectedTags.value.splice(index, 1)
    }
    filter.value.tags = [...selectedTags.value]
  }

  // 设置排序
  const setSort = (sortBy: TemplateFilter['sortBy'], sortOrder?: TemplateFilter['sortOrder']) => {
    filter.value.sortBy = sortBy
    if (sortOrder) {
      filter.value.sortOrder = sortOrder
    } else {
      // 切换顺序
      filter.value.sortOrder = filter.value.sortOrder === 'asc' ? 'desc' : 'asc'
    }
  }

  // 重置筛选
  const resetFilter = () => {
    selectedCategory.value = null
    selectedSubcategory.value = null
    selectedStyle.value = null
    selectedColor.value = null
    selectedTags.value = []
    searchQuery.value = ''
    filter.value = {
      category: undefined,
      subcategory: undefined,
      tags: [],
      style: undefined,
      color: undefined,
      sortBy: 'popular',
      sortOrder: 'desc'
    }
  }

  // 获取当前分类详情
  const currentCategory = computed(() => {
    if (!selectedCategory.value) return null
    return templateCategories.find(c => c.id === selectedCategory.value)
  })

  // 获取当前子分类列表
  const currentSubcategories = computed(() => {
    if (!selectedCategory.value) return []
    const category = templateCategories.find(c => c.id === selectedCategory.value)
    return category?.subcategories || []
  })

  // 是否有活跃筛选
  const hasActiveFilter = computed(() => {
    return !!(
      selectedCategory.value ||
      selectedSubcategory.value ||
      selectedStyle.value ||
      selectedColor.value ||
      selectedTags.value.length > 0 ||
      searchQuery.value
    )
  })

  // 活跃筛选计数
  const activeFilterCount = computed(() => {
    let count = 0
    if (selectedCategory.value) count++
    if (selectedSubcategory.value) count++
    if (selectedStyle.value) count++
    if (selectedColor.value) count++
    count += selectedTags.value.length
    return count
  })

  // 分类统计
  const categoryStats = computed(() => ({
    totalCategories: templateCategories.length,
    totalTemplates: templateCategories.reduce((sum, c) => sum + c.templateCount, 0),
    popularCategories: [...templateCategories].sort((a, b) => b.templateCount - a.templateCount).slice(0, 5)
  }))

  return {
    // 数据
    categories: templateCategories,
    styles: templateStyles,
    colors: templateColors,
    popularTags,
    // 状态
    selectedCategory,
    selectedSubcategory,
    selectedStyle,
    selectedColor,
    selectedTags,
    filter,
    searchQuery,
    // 计算属性
    currentCategory,
    currentSubcategories,
    hasActiveFilter,
    activeFilterCount,
    categoryStats,
    // 方法
    selectCategory,
    selectSubcategory,
    selectStyle,
    selectColor,
    toggleTag,
    setSort,
    resetFilter
  }
}

export default useTemplateCategories
