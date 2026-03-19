// Font Manager - 字体管理系统
import { ref, computed } from 'vue'

export interface FontAsset {
  id: string
  name: string
  family: string
  file: string
  url?: string
  format: 'woff2' | 'woff' | 'ttf' | 'otf'
  weight: number
  style: 'normal' | 'italic'
  language: string
  category: string
  size?: number
  loaded: boolean
}

export interface FontCollection {
  id: string
  name: string
  nameEn: string
  description: string
  fonts: string[]
  createdAt: number
  isBuiltIn: boolean
}

export interface FontUsage {
  fontFamily: string
  usageCount: number
  elements: string[]
  slides: string[]
}

export function useFontManager() {
  // 字体资源库
  const fontAssets = ref<FontAsset[]>([
    { id: 'asset_1', name: '思源黑体 Regular', family: 'Noto Sans SC', file: 'noto-sans-sc.woff2', format: 'woff2', weight: 400, style: 'normal', language: 'zh-CN', category: 'sans-serif', loaded: false },
    { id: 'asset_2', name: '思源黑体 Bold', family: 'Noto Sans SC', file: 'noto-sans-sc-bold.woff2', format: 'woff2', weight: 700, style: 'normal', language: 'zh-CN', category: 'sans-serif', loaded: false },
    { id: 'asset_3', name: '思源宋体 Regular', family: 'Noto Serif SC', file: 'noto-serif-sc.woff2', format: 'woff2', weight: 400, style: 'normal', language: 'zh-CN', category: 'serif', loaded: false },
    { id: 'asset_4', name: '思源宋体 Bold', family: 'Noto Serif SC', file: 'noto-serif-sc-bold.woff2', format: 'woff2', weight: 700, style: 'normal', language: 'zh-CN', category: 'serif', loaded: false },
    { id: 'asset_5', name: '站酷庆科酱心体', family: 'ZCOOL QingKe', file: 'zcool-qingke.woff2', format: 'woff2', weight: 400, style: 'normal', language: 'zh-CN', category: 'display', loaded: false }
  ])

  // 字体集合
  const collections = ref<FontCollection[]>([
    { id: 'col_1', name: '商务常用', nameEn: 'Business Common', description: '商务场合常用字体', fonts: ['Noto Sans SC', 'Noto Serif SC'], createdAt: Date.now(), isBuiltIn: true },
    { id: 'col_2', name: '创意设计', nameEn: 'Creative Design', description: '创意设计专用字体', fonts: ['ZCOOL QingKe', 'ZCOOL WenYi'], createdAt: Date.now(), isBuiltIn: true },
    { id: 'col_3', name: '代码编程', nameEn: 'Code & Programming', description: '编程代码字体', fonts: ['Source Code Pro', 'JetBrains Mono'], createdAt: Date.now(), isBuiltIn: true }
  ])

  // 字体使用记录
  const usageRecords = ref<FontUsage[]>([])

  // 最近使用的字体
  const recentFonts = ref<string[]>([])

  // 收藏的字体
  const favorites = ref<Set<string>>(new Set())

  // 添加字体资源
  const addFontAsset = (asset: Omit<FontAsset, 'id' | 'loaded'>): FontAsset => {
    const newAsset: FontAsset = {
      ...asset,
      id: `asset_${Date.now()}`,
      loaded: false
    }
    fontAssets.value.push(newAsset)
    return newAsset
  }

  // 移除字体资源
  const removeFontAsset = (assetId: string): boolean => {
    const index = fontAssets.value.findIndex(a => a.id === assetId)
    if (index > -1) {
      fontAssets.value.splice(index, 1)
      return true
    }
    return false
  }

  // 创建字体集合
  const createCollection = (collection: Omit<FontCollection, 'id' | 'createdAt' | 'isBuiltIn'>): FontCollection => {
    const newCollection: FontCollection = {
      ...collection,
      id: `col_${Date.now()}`,
      createdAt: Date.now(),
      isBuiltIn: false
    }
    collections.value.push(newCollection)
    return newCollection
  }

  // 删除字体集合
  const deleteCollection = (collectionId: string): boolean => {
    const collection = collections.value.find(c => c.id === collectionId)
    if (!collection || collection.isBuiltIn) return false

    const index = collections.value.findIndex(c => c.id === collectionId)
    if (index > -1) {
      collections.value.splice(index, 1)
      return true
    }
    return false
  }

  // 添加字体到集合
  const addFontToCollection = (collectionId: string, fontFamily: string): boolean => {
    const collection = collections.value.find(c => c.id === collectionId)
    if (!collection) return false

    if (!collection.fonts.includes(fontFamily)) {
      collection.fonts.push(fontFamily)
    }
    return true
  }

  // 从集合移除字体
  const removeFontFromCollection = (collectionId: string, fontFamily: string): boolean => {
    const collection = collections.value.find(c => c.id === collectionId)
    if (!collection) return false

    const index = collection.fonts.indexOf(fontFamily)
    if (index > -1) {
      collection.fonts.splice(index, 1)
      return true
    }
    return false
  }

  // 记录字体使用
  const recordUsage = (fontFamily: string, elementId: string, slideId: string) => {
    let usage = usageRecords.value.find(u => u.fontFamily === fontFamily)

    if (!usage) {
      usage = { fontFamily, usageCount: 0, elements: [], slides: [] }
      usageRecords.value.push(usage)
    }

    usage.usageCount++

    if (!usage.elements.includes(elementId)) {
      usage.elements.push(elementId)
    }

    if (!usage.slides.includes(slideId)) {
      usage.slides.push(slideId)
    }

    // 更新最近使用
    if (!recentFonts.value.includes(fontFamily)) {
      recentFonts.value.unshift(fontFamily)
      if (recentFonts.value.length > 10) {
        recentFonts.value.pop()
      }
    }
  }

  // 收藏字体
  const toggleFavorite = (fontFamily: string) => {
    if (favorites.value.has(fontFamily)) {
      favorites.value.delete(fontFamily)
    } else {
      favorites.value.add(fontFamily)
    }
  }

  // 检查是否已收藏
  const isFavorite = (fontFamily: string): boolean => {
    return favorites.value.has(fontFamily)
  }

  // 获取最常用的字体
  const getMostUsedFonts = (limit = 5): FontUsage[] => {
    return [...usageRecords.value]
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit)
  }

  // 获取字体的所有变体
  const getFontVariants = (fontFamily: string): FontAsset[] => {
    return fontAssets.value.filter(a => a.family === fontFamily)
  }

  // 按分类获取字体
  const getFontsByCategory = (category: string): FontAsset[] => {
    return fontAssets.value.filter(a => a.category === category)
  }

  // 导出字体配置
  const exportConfig = (): string => {
    return JSON.stringify({
      assets: fontAssets.value,
      collections: collections.value,
      favorites: Array.from(favorites.value),
      recentFonts: recentFonts.value
    }, null, 2)
  }

  // 导入字体配置
  const importConfig = (config: string): boolean => {
    try {
      const data = JSON.parse(config)

      if (data.assets) {
        fontAssets.value = data.assets
      }

      if (data.collections) {
        collections.value = data.collections
      }

      if (data.favorites) {
        favorites.value = new Set(data.favorites)
      }

      if (data.recentFonts) {
        recentFonts.value = data.recentFonts
      }

      return true
    } catch {
      return false
    }
  }

  // 统计
  const stats = computed(() => ({
    totalAssets: fontAssets.value.length,
    loadedAssets: fontAssets.value.filter(a => a.loaded).length,
    totalCollections: collections.value.length,
    builtInCollections: collections.value.filter(c => c.isBuiltIn).length,
    favoriteCount: favorites.value.size,
    recentCount: recentFonts.value.length,
    usageRecords: usageRecords.value.length
  }))

  return {
    fontAssets,
    collections,
    usageRecords,
    recentFonts,
    favorites,
    addFontAsset,
    removeFontAsset,
    createCollection,
    deleteCollection,
    addFontToCollection,
    removeFontFromCollection,
    recordUsage,
    toggleFavorite,
    isFavorite,
    getMostUsedFonts,
    getFontVariants,
    getFontsByCategory,
    exportConfig,
    importConfig,
    stats
  }
}

export default useFontManager
