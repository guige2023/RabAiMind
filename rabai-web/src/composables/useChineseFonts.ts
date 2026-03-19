// Chinese Fonts System - 中文字体系统
import { ref, computed } from 'vue'

export interface ChineseFont {
  id: string
  name: string
  nameEn: string
  family: string
  category: 'serif' | 'sans-serif' | 'display' | 'handwriting' | 'monospace'
  style: 'normal' | 'italic'
  weight: number[]
  language: 'simplified' | 'traditional' | 'both'
  source: 'system' | 'google' | 'local' | 'custom'
  loaded: boolean
  popularity: number
}

export interface FontCategory {
  id: string
  name: string
  nameEn: string
  icon: string
  count: number
}

export function useChineseFonts() {
  // 中文字体列表
  const fonts = ref<ChineseFont[]>([
    // 衬线字体
    { id: 'font_noto_serif_sc', name: '思源宋体', nameEn: 'Noto Serif SC', family: '"Noto Serif SC", "Source Han Serif SC"', category: 'serif', style: 'normal', weight: [400, 700], language: 'simplified', source: 'google', loaded: false, popularity: 95 },
    { id: 'font_noto_serif_tc', name: '思源宋体繁体', nameEn: 'Noto Serif TC', family: '"Noto Serif TC", "Source Han Serif TC"', category: 'serif', style: 'normal', weight: [400, 700], language: 'traditional', source: 'google', loaded: false, popularity: 90 },
    { id: 'font_zcool_xiaowei', name: '站酷小薇体', nameEn: 'ZCOOL XiaoWei', family: '"ZCOOL XiaoWei"', category: 'serif', style: 'normal', weight: [400], language: 'simplified', source: 'google', loaded: false, popularity: 88 },
    { id: 'font_lora', name: 'Lora', nameEn: 'Lora', family: 'Lora', category: 'serif', style: 'normal', weight: [400, 700], language: 'both', source: 'google', loaded: false, popularity: 75 },
    { id: 'font_merriweather', name: 'Merriweather', nameEn: 'Merriweather', family: 'Merriweather', category: 'serif', style: 'normal', weight: [400, 700], language: 'both', source: 'google', loaded: false, popularity: 70 },
    { id: 'font_noto_serif', name: 'Noto Serif', nameEn: 'Noto Serif', family: 'Noto Serif', category: 'serif', style: 'normal', weight: [400, 700], language: 'both', source: 'google', loaded: false, popularity: 85 },

    // 无衬线字体
    { id: 'font_noto_sans_sc', name: '思源黑体', nameEn: 'Noto Sans SC', family: '"Noto Sans SC", "Source Han Sans SC"', category: 'sans-serif', style: 'normal', weight: [100, 300, 400, 500, 700, 900], language: 'simplified', source: 'google', loaded: false, popularity: 98 },
    { id: 'font_noto_sans_tc', name: '思源黑体繁体', nameEn: 'Noto Sans TC', family: '"Noto Sans TC", "Source Han Sans TC"', category: 'sans-serif', style: 'normal', weight: [100, 300, 400, 500, 700, 900], language: 'traditional', source: 'google', loaded: false, popularity: 92 },
    { id: 'font_noto_sans', name: 'Noto Sans', nameEn: 'Noto Sans', family: 'Noto Sans', category: 'sans-serif', style: 'normal', weight: [100, 300, 400, 500, 700, 900], language: 'both', source: 'google', loaded: false, popularity: 96 },
    { id: 'font_inter', name: 'Inter', nameEn: 'Inter', family: 'Inter', category: 'sans-serif', style: 'normal', weight: [100, 200, 300, 400, 500, 600, 700, 800, 900], language: 'both', source: 'google', loaded: false, popularity: 94 },
    { id: 'font_roboto', name: 'Roboto', nameEn: 'Roboto', family: 'Roboto', category: 'sans-serif', style: 'normal', weight: [100, 300, 400, 500, 700, 900], language: 'both', source: 'system', loaded: true, popularity: 91 },
    { id: 'font_source_han_sans', name: '思源黑体', nameEn: 'Source Han Sans', family: '"Source Han Sans CN"', category: 'sans-serif', style: 'normal', weight: [300, 400, 500, 700], language: 'simplified', source: 'system', loaded: true, popularity: 89 },
    { id: 'font_helvetica', name: 'Helvetica', nameEn: 'Helvetica', family: 'Helvetica, "Helvetica Neue", Arial', category: 'sans-serif', style: 'normal', weight: [400, 700], language: 'both', source: 'system', loaded: true, popularity: 87 },
    { id: 'font_arial', name: 'Arial', nameEn: 'Arial', family: 'Arial, "Microsoft YaHei"', category: 'sans-serif', style: 'normal', weight: [400, 700], language: 'both', source: 'system', loaded: true, popularity: 85 },

    // 标题字体
    { id: 'font_noto_sans_sc_bold', name: '思源黑体粗体', nameEn: 'Noto Sans SC Bold', family: '"Noto Sans SC"', category: 'display', style: 'normal', weight: [700, 900], language: 'simplified', source: 'google', loaded: false, popularity: 82 },
    { id: 'font_din', name: 'DIN Alternate', nameEn: 'DIN Alternate', family: '"DIN Alternate", "DIN Condensed"', category: 'display', style: 'normal', weight: [700], language: 'both', source: 'local', loaded: false, popularity: 78 },
    { id: 'font_bebas', name: 'Bebas Neue', nameEn: 'Bebas Neue', family: '"Bebas Neue"', category: 'display', style: 'normal', weight: [400], language: 'both', source: 'google', loaded: false, popularity: 76 },
    { id: 'font_anton', name: 'Anton', nameEn: 'Anton', family: 'Anton', category: 'display', style: 'normal', weight: [400], language: 'both', source: 'google', loaded: false, popularity: 72 },

    // 手写字体
    { id: 'font_zcool_qingke', name: '站酷庆科酱心体', nameEn: 'ZCOOL QingKe', family: '"ZCOOL QingKe"', category: 'handwriting', style: 'normal', weight: [400], language: 'simplified', source: 'google', loaded: false, popularity: 86 },
    { id: 'font_zcool_wenyi', name: '站酷文艺体', nameEn: 'ZCOOL WenYi', family: '"ZCOOL WenYi"', category: 'handwriting', style: 'normal', weight: [400], language: 'simplified', source: 'google', loaded: false, popularity: 84 },
    { id: 'font_ma_shan', name: '马善政毛笔', nameEn: 'Ma Shan Zheng', family: '"Ma Shan Zheng"', category: 'handwriting', style: 'normal', weight: [400], language: 'simplified', source: 'google', loaded: false, popularity: 80 },
    { id: 'font_long_cang', name: '龙藏大楷', nameEn: 'Long Cang', family: '"Long Cang"', category: 'handwriting', style: 'normal', weight: [400], language: 'simplified', source: 'google', loaded: false, popularity: 77 },
    { id: 'font_lxgw', name: '落霞文心', nameEn: 'LXGW WenKai', family: '"LXGW WenKai"', category: 'handwriting', style: 'normal', weight: [400, 700], language: 'simplified', source: 'google', loaded: false, popularity: 75 },

    // 等宽字体
    { id: 'font_noto_sans_mono', name: 'Noto Sans Mono', nameEn: 'Noto Sans Mono', family: '"Noto Sans Mono"', category: 'monospace', style: 'normal', weight: [400, 700], language: 'both', source: 'google', loaded: false, popularity: 83 },
    { id: 'font_source_code', name: '思源代码', nameEn: 'Source Code Pro', family: '"Source Code Pro"', category: 'monospace', style: 'normal', weight: [400, 700], language: 'both', source: 'google', loaded: false, popularity: 81 },
    { id: 'font_jetbrains', name: 'JetBrains Mono', nameEn: 'JetBrains Mono', family: '"JetBrains Mono"', category: 'monospace', style: 'normal', weight: [400, 700], language: 'both', source: 'google', loaded: false, popularity: 79 },
    { id: 'font_fira_code', name: 'Fira Code', nameEn: 'Fira Code', family: '"Fira Code"', category: 'monospace', style: 'normal', weight: [400, 700], language: 'both', source: 'google', loaded: false, popularity: 77 },
    { id: 'font_consolas', name: 'Consolas', nameEn: 'Consolas', family: 'Consolas, "Source Han Sans CN"', category: 'monospace', style: 'normal', weight: [400, 700], language: 'both', source: 'system', loaded: true, popularity: 74 },

    // 更多常用中文字体
    { id: 'font_microsoft_yahei', name: '微软雅黑', nameEn: 'Microsoft YaHei', family: '"Microsoft YaHei", "Microsoft YaHei UI"', category: 'sans-serif', style: 'normal', weight: [400, 700], language: 'simplified', source: 'system', loaded: true, popularity: 93 },
    { id: 'font_simhei', name: '黑体', nameEn: 'SimHei', family: 'SimHei, "Microsoft YaHei"', category: 'sans-serif', style: 'normal', weight: [400, 700], language: 'simplified', source: 'system', loaded: true, popularity: 88 },
    { id: 'font_simsum', name: '宋体', nameEn: 'SimSun', family: 'SimSun, "Noto Serif SC"', category: 'serif', style: 'normal', weight: [400, 700], language: 'simplified', source: 'system', loaded: true, popularity: 85 },
    { id: 'font_kaiti', name: '楷体', nameEn: 'KaiTi', family: 'KaiTi, "Noto Serif SC"', category: 'serif', style: 'normal', weight: [400], language: 'simplified', source: 'system', loaded: true, popularity: 82 },
    { id: 'font_fangsong', name: '仿宋', nameEn: 'FangSong', family: 'FangSong, "Noto Serif SC"', category: 'serif', style: 'normal', weight: [400], language: 'simplified', source: 'system', loaded: true, popularity: 78 },
    { id: 'font_youyuan', name: '幼圆', nameEn: 'YouYuan', family: 'YouYuan, "Microsoft YaHei"', category: 'sans-serif', style: 'normal', weight: [400], language: 'simplified', source: 'system', loaded: true, popularity: 75 }
  ])

  // 字体分类
  const categories = computed<FontCategory[]>(() => [
    { id: 'serif', name: '衬线体', nameEn: 'Serif', icon: '✒️', count: fonts.value.filter(f => f.category === 'serif').length },
    { id: 'sans-serif', name: '无衬线体', nameEn: 'Sans-Serif', icon: '🔤', count: fonts.value.filter(f => f.category === 'sans-serif').length },
    { id: 'display', name: '标题体', nameEn: 'Display', icon: '🔴', count: fonts.value.filter(f => f.category === 'display').length },
    { id: 'handwriting', name: '手写体', nameEn: 'Handwriting', icon: '✏️', count: fonts.value.filter(f => f.category === 'handwriting').length },
    { id: 'monospace', name: '等宽体', nameEn: 'Monospace', icon: '💻', count: fonts.value.filter(f => f.category === 'monospace').length }
  ])

  // 当前选中的字体
  const selectedFont = ref<ChineseFont | null>(null)

  // 已加载的字体
  const loadedFonts = ref<Set<string>>(new Set())

  // 加载字体
  const loadFont = async (fontId: string): Promise<boolean> => {
    const font = fonts.value.find(f => f.id === fontId)
    if (!font || font.loaded) return true

    try {
      if (font.source === 'system') {
        font.loaded = true
        loadedFonts.value.add(fontId)
        return true
      }

      // 动态加载Google字体
      const fontFace = new FontFace(font.nameEn, `local("${font.family}")`)

      await fontFace.load()
      document.fonts.add(fontFace)

      font.loaded = true
      loadedFonts.value.add(fontId)
      return true
    } catch (error) {
      console.error(`Failed to load font: ${font.name}`, error)
      return false
    }
  }

  // 批量加载字体
  const loadFonts = async (fontIds: string[]): Promise<number> => {
    let successCount = 0

    for (const id of fontIds) {
      if (await loadFont(id)) {
        successCount++
      }
    }

    return successCount
  }

  // 预加载常用字体
  const preloadCommonFonts = async () => {
    const commonFonts = fonts.value
      .filter(f => f.popularity >= 85)
      .map(f => f.id)

    return loadFonts(commonFonts)
  }

  // 按分类获取字体
  const getFontsByCategory = (category: string): ChineseFont[] => {
    return fonts.value.filter(f => f.category === category)
  }

  // 按语言获取字体
  const getFontsByLanguage = (language: ChineseFont['language']): ChineseFont[] => {
    return fonts.value.filter(f => f.language === language || f.language === 'both')
  }

  // 搜索字体
  const searchFonts = (query: string): ChineseFont[] => {
    const lowerQuery = query.toLowerCase()
    return fonts.value.filter(f =>
      f.name.toLowerCase().includes(lowerQuery) ||
      f.nameEn.toLowerCase().includes(lowerQuery) ||
      f.family.toLowerCase().includes(lowerQuery)
    )
  }

  // 选择字体
  const selectFont = (fontId: string) => {
    const font = fonts.value.find(f => f.id === fontId)
    if (font) {
      selectedFont.value = font
      loadFont(fontId)
    }
  }

  // 获取CSS字体声明
  const getFontCSS = (fontId: string, weight = 400, style = 'normal'): string => {
    const font = fonts.value.find(f => f.id === fontId)
    if (!font) return ''

    const weightStr = font.weight.includes(weight) ? weight : font.weight[0]
    return `font-family: ${font.family}; font-weight: ${weightStr}; font-style: ${style};`
  }

  // 统计
  const stats = computed(() => ({
    total: fonts.value.length,
    loaded: loadedFonts.value.size,
    byCategory: categories.value.map(c => ({ category: c.id, count: c.count })),
    popular: fonts.value.filter(f => f.popularity >= 90).length
  }))

  return {
    fonts,
    categories,
    selectedFont,
    loadedFonts,
    loadFont,
    loadFonts,
    preloadCommonFonts,
    getFontsByCategory,
    getFontsByLanguage,
    searchFonts,
    selectFont,
    getFontCSS,
    stats
  }
}

export default useChineseFonts
