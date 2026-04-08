// Template Store - 模板状态管理
// 基于已有的 useTemplateStore.ts 重构为 Pinia store
import { defineStore } from 'pinia'
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
  colors?: string[]
  fonts?: string[]
  is_ugc?: boolean
  subcategory?: string
  download_count?: number
  use_count?: number
  rating_breakdown?: {
    design: number
    usability: number
    features: number
    total: number
    count: number
  }
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

export interface Category {
  id: string
  name: string
  icon: string
  count: number
}

export interface Style {
  id: string
  name: string
  icon: string
}

// 真实API模板 → 前端模板的映射
function mapApiTemplate(apiT: any): Template {
  return {
    id: apiT.id,
    name: apiT.name,
    description: apiT.description,
    category: apiT.category,
    style: apiT.style,
    slides: 8,
    thumbnail: apiT.thumbnail || '',
    tags: apiT.tags?.length ? apiT.tags : [apiT.category, apiT.style],
    popularity: 80,
    isPremium: ['tech', 'creative'].includes(apiT.category),
    author: apiT.author || 'RabAi Mind',
    createdAt: apiT.created_at || new Date().toISOString().split('T')[0],
    colors: apiT.colors,
    fonts: apiT.fonts,
    is_ugc: apiT.is_ugc || false,
    subcategory: apiT.subcategory || '',
    download_count: apiT.download_count || 0,
    use_count: apiT.use_count || 0,
    rating_breakdown: apiT.rating_breakdown,
  }
}

// 默认分类
const defaultCategories: Category[] = [
  { id: 'business', name: '商业', icon: '💼', count: 12 },
  { id: 'education', name: '教育', icon: '📚', count: 8 },
  { id: 'tech', name: '科技', icon: '🚀', count: 6 },
  { id: 'creative', name: '创意', icon: '💡', count: 10 },
  { id: 'personal', name: '个人', icon: '👤', count: 5 },
  { id: 'government', name: '政府', icon: '🏛️', count: 4 },
  { id: 'finance', name: '金融', icon: '💰', count: 5 },
  { id: 'marketing', name: '营销', icon: '📢', count: 7 },
]

// 默认风格
const defaultStyles: Style[] = [
  { id: 'professional', name: '专业商务', icon: '💼' },
  { id: 'simple', name: '简约现代', icon: '✨' },
  { id: 'energetic', name: '活力动感', icon: '🔥' },
  { id: 'premium', name: '高端大气', icon: '👑' },
  { id: 'tech', name: '科技未来', icon: '🔬' },
  { id: 'creative', name: '创意艺术', icon: '🎨' },
  { id: 'elegant', name: '优雅古典', icon: '🌸' },
  { id: 'playful', name: '卡通趣味', icon: '🎮' }
]

export const useTemplateStore = defineStore('template', () => {
  // State
  const templates = ref<Template[]>([])
  const favorites = ref<Set<string>>(new Set())
  const searchQuery = ref('')
  const selectedCategory = ref<string | null>(null)
  const selectedStyle = ref<string | null>(null)
  const sortBy = ref<'popularity' | 'newest' | 'name'>('popularity')
  const isLoading = ref(false)
  const categories = ref<Category[]>(defaultCategories)
  const styles = ref<Style[]>(defaultStyles)

  // Getters
  const filteredTemplates = computed(() => {
    let result = templates.value

    // Filter by search query
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      result = result.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    // Filter by category
    if (selectedCategory.value) {
      result = result.filter(t => t.category === selectedCategory.value)
    }

    // Filter by style
    if (selectedStyle.value) {
      result = result.filter(t => t.style === selectedStyle.value)
    }

    // Sort
    if (sortBy.value === 'popularity') {
      result = [...result].sort((a, b) => b.popularity - a.popularity)
    } else if (sortBy.value === 'newest') {
      result = [...result].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    } else if (sortBy.value === 'name') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name))
    }

    return result
  })

  const favoriteTemplates = computed(() => {
    return templates.value.filter(t => favorites.value.has(t.id))
  })

  const templateCount = computed(() => templates.value.length)
  const filteredCount = computed(() => filteredTemplates.value.length)

  // Actions
  const loadTemplates = async () => {
    isLoading.value = true
    try {
      const res = await apiClient.get('/ppt/templates')
      const raw: any[] = Array.isArray(res.data)
        ? res.data
        : (res.data.data || res.data.templates || [])

      if (raw && raw.length > 0) {
        templates.value = raw.map(mapApiTemplate)
      } else {
        // Fallback to sample data if API returns empty
        templates.value = sampleTemplates
      }
    } catch (e) {
      console.warn('[TemplateStore] Failed to load templates, using fallback data:', e)
      templates.value = sampleTemplates
    } finally {
      isLoading.value = false
    }
  }

  const loadCategoriesAndStyles = async () => {
    try {
      const [catsRes, stylesRes] = await Promise.all([
        apiClient.get('/templates/categories').catch(() => null),
        apiClient.get('/templates/styles').catch(() => null)
      ])

      if (catsRes?.data?.categories) {
        const apiCats: string[] = catsRes.data.categories
        categories.value = apiCats.map((id: string) => {
          const found = defaultCategories.find(c => c.id === id)
          return found || { id, name: id, icon: '📁', count: 0 }
        })
      }

      if (stylesRes?.data?.styles) {
        const apiStyles: string[] = stylesRes.data.styles
        styles.value = apiStyles.map((id: string) => {
          const found = defaultStyles.find(s => s.id === id)
          return found || { id, name: id, icon: '🎨' }
        })
      }
    } catch (e) {
      console.warn('[TemplateStore] Failed to load categories/styles, using defaults:', e)
    }
  }

  const loadFavorites = () => {
    try {
      const saved = localStorage.getItem('template_favorites')
      if (saved) {
        favorites.value = new Set(JSON.parse(saved))
      }
    } catch {
      // Ignore errors
    }
  }

  const saveFavorites = () => {
    try {
      localStorage.setItem('template_favorites', JSON.stringify([...favorites.value]))
    } catch {
      // Ignore errors
    }
  }

  const toggleFavorite = (templateId: string) => {
    if (favorites.value.has(templateId)) {
      favorites.value.delete(templateId)
    } else {
      favorites.value.add(templateId)
    }
    // Trigger reactivity
    favorites.value = new Set(favorites.value)
    saveFavorites()
  }

  const isFavorite = (templateId: string) => favorites.value.has(templateId)

  const setSearchQuery = (query: string) => {
    searchQuery.value = query
  }

  const setSelectedCategory = (category: string | null) => {
    selectedCategory.value = category
  }

  const setSelectedStyle = (style: string | null) => {
    selectedStyle.value = style
  }

  const setSortBy = (sort: 'popularity' | 'newest' | 'name') => {
    sortBy.value = sort
  }

  const getTemplateById = (id: string) => {
    return templates.value.find(t => t.id === id)
  }

  return {
    // State
    templates,
    favorites,
    searchQuery,
    selectedCategory,
    selectedStyle,
    sortBy,
    isLoading,
    categories,
    styles,
    // Getters
    filteredTemplates,
    favoriteTemplates,
    templateCount,
    filteredCount,
    // Actions
    loadTemplates,
    loadCategoriesAndStyles,
    loadFavorites,
    saveFavorites,
    toggleFavorite,
    isFavorite,
    setSearchQuery,
    setSelectedCategory,
    setSelectedStyle,
    setSortBy,
    getTemplateById
  }
})

// Sample templates for fallback
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
]
