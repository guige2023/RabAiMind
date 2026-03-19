// Theme Market - 主题市场/模板商店
import { ref, computed } from 'vue'

export interface Theme {
  id: string
  name: string
  nameEn: string
  description: string
  category: string
  tags: string[]
  thumbnail: string
  previewImages: string[]
  author: string
  authorAvatar: string
  downloads: number
  rating: number
  reviewCount: number
  price: number
  currency: string
  isPremium: boolean
  isFeatured: boolean
  isNew: boolean
  createdAt: number
  updatedAt: number
  colors: ThemeColors
  fonts: ThemeFonts
  layout: string
  animations: string[]
  elements: string[]
}

export interface ThemeColors {
  primary: string
  secondary: string
  accent: string
  background: string
  text: string
  success: string
  warning: string
  error: string
}

export interface ThemeFonts {
  title: string
  body: string
  accent: string
}

export interface ThemeCategory {
  id: string
  name: string
  nameEn: string
  icon: string
  count: number
  description: string
}

export interface ThemeFilter {
  category?: string
  priceRange?: [number, number]
  tags?: string[]
  sortBy: 'popular' | 'newest' | 'rating' | 'price'
  isPremium?: boolean
  search?: string
}

export interface ThemeStats {
  totalThemes: number
  totalDownloads: number
  averageRating: number
  categories: ThemeCategory[]
}

export function useThemeMarket() {
  // 主题列表
  const themes = ref<Theme[]>([])

  // 分类列表
  const categories = ref<ThemeCategory[]>([])

  // 当前选中的主题
  const selectedTheme = ref<Theme | null>(null)

  // 筛选条件
  const filter = ref<ThemeFilter>({
    sortBy: 'popular'
  })

  // 加载状态
  const loading = ref(false)

  // 搜索历史
  const searchHistory = ref<string[]>([])

  // 收藏的主题
  const favorites = ref<Set<string>>(new Set())

  // 已购买的主题
  const purchased = ref<Set<string>>(new Set())

  // 初始化示例数据
  const initSampleData = () => {
    categories.value = [
      { id: 'business', name: '商务', nameEn: 'Business', icon: '💼', count: 156, description: '企业展示、商务报告' },
      { id: 'education', name: '教育', nameEn: 'Education', icon: '📚', count: 89, description: '课件、培训材料' },
      { id: 'creative', name: '创意', nameEn: 'Creative', icon: '🎨', count: 234, description: '设计、艺术展示' },
      { id: 'tech', name: '科技', nameEn: 'Technology', icon: '💻', count: 178, description: '技术分享、产品发布' },
      { id: 'medical', name: '医疗', nameEn: 'Medical', icon: '🏥', count: 45, description: '医疗健康、药品展示' },
      { id: 'finance', name: '金融', nameEn: 'Finance', icon: '💰', count: 67, description: '财务报告、投资演示' },
      { id: 'personal', name: '个人', nameEn: 'Personal', icon: '👤', count: 123, description: '个人简历、旅行分享' },
      { id: 'holiday', name: '节日', nameEn: 'Holiday', icon: '🎉', count: 56, description: '节日庆典、活动策划' }
    ]

    themes.value = [
      {
        id: 'theme_1',
        name: '商务蓝',
        nameEn: 'Business Blue',
        description: '专业简洁的蓝色商务主题，适合企业展示和报告',
        category: 'business',
        tags: ['商务', '蓝色', '专业', '简洁'],
        thumbnail: '/themes/business-blue.png',
        previewImages: ['/themes/preview/bb1.png', '/themes/preview/bb2.png'],
        author: 'RabAiMind',
        authorAvatar: '/avatars/rabaimind.png',
        downloads: 12580,
        rating: 4.8,
        reviewCount: 234,
        price: 0,
        currency: 'CNY',
        isPremium: false,
        isFeatured: true,
        isNew: false,
        createdAt: Date.now() - 86400000 * 90,
        updatedAt: Date.now() - 86400000 * 10,
        colors: { primary: '#1e40af', secondary: '#3b82f6', accent: '#06b6d4', background: '#ffffff', text: '#1e293b', success: '#10b981', warning: '#f59e0b', error: '#ef4444' },
        fonts: { title: 'noto-sans-sc', body: 'noto-sans-sc', accent: 'noto-serif-sc' },
        layout: 'grid',
        animations: ['fade', 'slide'],
        elements: ['text', 'image', 'chart', 'table']
      },
      {
        id: 'theme_2',
        name: '渐变紫',
        nameEn: 'Gradient Purple',
        description: '现代渐变风格，适合创意展示和科技演示',
        category: 'creative',
        tags: ['创意', '渐变', '现代', '科技'],
        thumbnail: '/themes/gradient-purple.png',
        previewImages: ['/themes/preview/gp1.png'],
        author: 'DesignPro',
        authorAvatar: '/avatars/designpro.png',
        downloads: 8970,
        rating: 4.6,
        reviewCount: 156,
        price: 9.9,
        currency: 'CNY',
        isPremium: true,
        isFeatured: true,
        isNew: true,
        createdAt: Date.now() - 86400000 * 7,
        updatedAt: Date.now() - 86400000 * 2,
        colors: { primary: '#7c3aed', secondary: '#a855f7', accent: '#ec4899', background: '#0f172a', text: '#f8fafc', success: '#10b981', warning: '#f59e0b', error: '#ef4444' },
        fonts: { title: 'noto-sans-sc', body: 'noto-sans-sc', accent: 'noto-sans-sc' },
        layout: 'full',
        animations: ['fade', 'slide', 'scale'],
        elements: ['text', 'image', 'chart', 'shape', 'video']
      },
      {
        id: 'theme_3',
        name: '极简白',
        nameEn: 'Minimal White',
        description: '纯净的白色主题，突出内容本身',
        category: 'business',
        tags: ['极简', '白色', '纯净', '内容优先'],
        thumbnail: '/themes/minimal-white.png',
        previewImages: ['/themes/preview/mw1.png'],
        author: 'MinimalStudio',
        authorAvatar: '/avatars/minimal.png',
        downloads: 5430,
        rating: 4.9,
        reviewCount: 89,
        price: 0,
        currency: 'CNY',
        isPremium: false,
        isFeatured: false,
        isNew: false,
        createdAt: Date.now() - 86400000 * 180,
        updatedAt: Date.now() - 86400000 * 30,
        colors: { primary: '#000000', secondary: '#64748b', accent: '#3b82f6', background: '#ffffff', text: '#000000', success: '#10b981', warning: '#f59e0b', error: '#ef4444' },
        fonts: { title: 'noto-sans-sc', body: 'noto-sans-sc', accent: 'noto-sans-sc' },
        layout: 'single',
        animations: ['fade'],
        elements: ['text', 'image']
      },
      {
        id: 'theme_4',
        name: '科技蓝',
        nameEn: 'Tech Blue',
        description: '未来感科技风格，适合技术分享和产品发布',
        category: 'tech',
        tags: ['科技', '未来', '蓝色', '技术'],
        thumbnail: '/themes/tech-blue.png',
        previewImages: ['/themes/preview/tb1.png'],
        author: 'TechDesign',
        authorAvatar: '/avatars/techdesign.png',
        downloads: 15670,
        rating: 4.7,
        reviewCount: 312,
        price: 19.9,
        currency: 'CNY',
        isPremium: true,
        isFeatured: true,
        isNew: false,
        createdAt: Date.now() - 86400000 * 60,
        updatedAt: Date.now() - 86400000 * 5,
        colors: { primary: '#0ea5e9', secondary: '#6366f1', accent: '#22d3ee', background: '#030712', text: '#f9fafb', success: '#10b981', warning: '#f59e0b', error: '#ef4444' },
        fonts: { title: 'noto-sans-sc', body: 'noto-sans-sc', accent: 'noto-mono' },
        layout: 'grid',
        animations: ['fade', 'slide', 'glitch'],
        elements: ['text', 'image', 'chart', 'code', 'video']
      },
      {
        id: 'theme_5',
        name: '自然绿',
        nameEn: 'Nature Green',
        description: '清新自然的绿色主题，适合环保和健康主题',
        category: 'medical',
        tags: ['自然', '绿色', '环保', '健康'],
        thumbnail: '/themes/nature-green.png',
        previewImages: ['/themes/preview/ng1.png'],
        author: 'GreenDesign',
        authorAvatar: '/avatars/green.png',
        downloads: 7890,
        rating: 4.5,
        reviewCount: 145,
        price: 0,
        currency: 'CNY',
        isPremium: false,
        isFeatured: false,
        isNew: true,
        createdAt: Date.now() - 86400000 * 14,
        updatedAt: Date.now() - 86400000 * 3,
        colors: { primary: '#059669', secondary: '#10b981', accent: '#34d399', background: '#ecfdf5', text: '#064e3b', success: '#10b981', warning: '#f59e0b', error: '#ef4444' },
        fonts: { title: 'noto-sans-sc', body: 'noto-sans-sc', accent: 'noto-serif-sc' },
        layout: 'masonry',
        animations: ['fade', 'slide'],
        elements: ['text', 'image', 'chart', 'shape']
      }
    ]
  }

  // 筛选主题
  const filteredThemes = computed(() => {
    let result = [...themes.value]

    // 分类筛选
    if (filter.value.category) {
      result = result.filter(t => t.category === filter.value.category)
    }

    // 价格筛选
    if (filter.value.priceRange) {
      result = result.filter(t =>
        t.price >= filter.value.priceRange![0] &&
        t.price <= filter.value.priceRange![1]
      )
    }

    // 标签筛选
    if (filter.value.tags && filter.value.tags.length > 0) {
      result = result.filter(t =>
        filter.value.tags!.some(tag => t.tags.includes(tag))
      )
    }

    // Premium筛选
    if (filter.value.isPremium !== undefined) {
      result = result.filter(t => t.isPremium === filter.value.isPremium)
    }

    // 搜索
    if (filter.value.search) {
      const search = filter.value.search.toLowerCase()
      result = result.filter(t =>
        t.name.toLowerCase().includes(search) ||
        t.nameEn.toLowerCase().includes(search) ||
        t.description.toLowerCase().includes(search) ||
        t.tags.some(tag => tag.toLowerCase().includes(search))
      )
    }

    // 排序
    switch (filter.value.sortBy) {
      case 'popular':
        result.sort((a, b) => b.downloads - a.downloads)
        break
      case 'newest':
        result.sort((a, b) => b.createdAt - a.createdAt)
        break
      case 'rating':
        result.sort((a, b) => b.rating - a.rating)
        break
      case 'price':
        result.sort((a, b) => a.price - b.price)
        break
    }

    return result
  })

  // 获取精选主题
  const featuredThemes = computed(() =>
    themes.value.filter(t => t.isFeatured)
  )

  // 获取最新主题
  const newThemes = computed(() =>
    themes.value.filter(t => t.isNew)
  )

  // 获取免费主题
  const freeThemes = computed(() =>
    themes.value.filter(t => !t.isPremium)
  )

  // 搜索主题
  const searchThemes = (query: string) => {
    filter.value.search = query

    if (query && !searchHistory.value.includes(query)) {
      searchHistory.value.unshift(query)
      if (searchHistory.value.length > 10) {
        searchHistory.value.pop()
      }
    }
  }

  // 清除搜索
  const clearSearch = () => {
    filter.value.search = ''
  }

  // 收藏主题
  const toggleFavorite = (themeId: string) => {
    if (favorites.value.has(themeId)) {
      favorites.value.delete(themeId)
    } else {
      favorites.value.add(themeId)
    }
  }

  // 是否已收藏
  const isFavorite = (themeId: string): boolean => {
    return favorites.value.has(themeId)
  }

  // 购买主题
  const purchaseTheme = async (themeId: string): Promise<boolean> => {
    loading.value = true

    try {
      // 模拟购买过程
      await new Promise(r => setTimeout(r, 1000))
      purchased.value.add(themeId)
      return true
    } catch {
      return false
    } finally {
      loading.value = false
    }
  }

  // 是否已购买
  const isPurchased = (themeId: string): boolean => {
    return purchased.value.has(themeId) || !themes.value.find(t => t.id === themeId)?.isPremium
  }

  // 下载主题
  const downloadTheme = async (themeId: string): Promise<boolean> => {
    const theme = themes.value.find(t => t.id === themeId)
    if (!theme) return false

    // 检查是否需要购买
    if (theme.isPremium && !isPurchased(themeId)) {
      return false
    }

    loading.value = true

    try {
      await new Promise(r => setTimeout(r, 500))
      theme.downloads++
      return true
    } finally {
      loading.value = false
    }
  }

  // 应用主题
  const applyTheme = (themeId: string): Theme | null => {
    const theme = themes.value.find(t => t.id === themeId)
    if (theme) {
      selectedTheme.value = theme
    }
    return theme
  }

  // 获取分类统计
  const stats = computed((): ThemeStats => ({
    totalThemes: themes.value.length,
    totalDownloads: themes.value.reduce((sum, t) => sum + t.downloads, 0),
    averageRating: themes.value.length > 0
      ? themes.value.reduce((sum, t) => sum + t.rating, 0) / themes.value.length
      : 0,
    categories: categories.value
  }))

  // 获取推荐主题
  const getRecommendedThemes = (currentThemeId: string): Theme[] => {
    const current = themes.value.find(t => t.id === currentThemeId)
    if (!current) return []

    return themes.value
      .filter(t => t.id !== currentThemeId && t.category === current.category)
      .slice(0, 4)
  }

  // 清除搜索历史
  const clearSearchHistory = () => {
    searchHistory.value = []
  }

  return {
    // 数据
    themes,
    categories,
    selectedTheme,
    filter,
    loading,
    searchHistory,
    favorites,

    // 计算属性
    filteredThemes,
    featuredThemes,
    newThemes,
    freeThemes,
    stats,

    // 方法
    initSampleData,
    searchThemes,
    clearSearch,
    toggleFavorite,
    isFavorite,
    purchaseTheme,
    isPurchased,
    downloadTheme,
    applyTheme,
    getRecommendedThemes,
    clearSearchHistory
  }
}

export default useThemeMarket
