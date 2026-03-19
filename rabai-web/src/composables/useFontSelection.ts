// Font Selection - 字体选择系统
import { ref, computed } from 'vue'

export type FontCategory = 'serif' | 'sans-serif' | 'display' | 'handwriting' | 'monospace' | 'decorative'
export type FontUseCase = 'title' | 'body' | 'caption' | 'decoration' | 'code'

export interface FontOption {
  id: string
  name: string
  nameEn: string
  family: string
  category: FontCategory
  weights: number[]
  styles: string[]
  source: 'google' | 'system' | 'custom'
  googleName?: string
  chineseSupport: boolean
  description?: string
}

export interface FontCombination {
  id: string
  name: string
  nameEn: string
  title: FontOption
  body: FontOption
  decoration?: FontOption
  description?: string
}

export interface FontSettings {
  titleFont: string
  bodyFont: string
  decorationFont: string
  titleSize: number
  titleWeight: number
  bodySize: number
  bodyWeight: number
  lineHeight: number
  letterSpacing: number
}

export function useFontSelection() {
  // 字体库
  const fonts = ref<FontOption[]>([
    // 衬线体
    { id: 'noto-serif-sc', name: '思源宋体', nameEn: 'Noto Serif SC', family: '"Noto Serif SC", serif', category: 'serif', weights: [400, 600, 700], styles: ['normal', 'italic'], source: 'google', googleName: 'Noto+Serif+SC', chineseSupport: true, description: '现代衬线体，适合正式场合' },
    { id: 'noto-serif', name: 'Noto衬线体', nameEn: 'Noto Serif', family: '"Noto Serif", serif', category: 'serif', weights: [400, 700], styles: ['normal', 'italic'], source: 'google', googleName: 'Noto+Serif', chineseSupport: false },
    { id: 'songti', name: '宋体', nameEn: 'Songti', family: 'Songti, serif', category: 'serif', weights: [400], styles: ['normal'], source: 'system', chineseSupport: true, description: '传统宋体' },
    { id: 'fangzheng', name: '方正书宋', nameEn: 'FZ ShuSong', family: 'FZShuSong, serif', category: 'serif', weights: [400], styles: ['normal'], source: 'system', chineseSupport: true },
    { id: 'times', name: 'Times New Roman', nameEn: 'Times New Roman', family: '"Times New Roman", serif', category: 'serif', weights: [400, 700], styles: ['normal', 'italic'], source: 'system', chineseSupport: false },

    // 无衬线体
    { id: 'noto-sans-sc', name: '思源黑体', nameEn: 'Noto Sans SC', family: '"Noto Sans SC", sans-serif', category: 'sans-serif', weights: [300, 400, 500, 600, 700], styles: ['normal'], source: 'google', googleName: 'Noto+Sans+SC', chineseSupport: true, description: '现代通用黑体' },
    { id: 'noto-sans', name: 'Noto无衬线', nameEn: 'Noto Sans', family: '"Noto Sans", sans-serif', category: 'sans-serif', weights: [300, 400, 700], styles: ['normal'], source: 'google', googleName: 'Noto+Sans', chineseSupport: false },
    { id: 'heiti', name: '黑体', nameEn: 'Heiti', family: 'Heiti, sans-serif', category: 'sans-serif', weights: [300, 400, 600], styles: ['normal'], source: 'system', chineseSupport: true, description: '现代黑体' },
    { id: 'pingfang', name: '苹方', nameEn: 'PingFang', family: '"PingFang SC", sans-serif', category: 'sans-serif', weights: [300, 400, 500, 600], styles: ['normal'], source: 'system', chineseSupport: true, description: '苹果系统默认' },
    { id: 'microsoft-yahei', name: '微软雅黑', nameEn: 'Microsoft YaHei', family: '"Microsoft YaHei", sans-serif', category: 'sans-serif', weights: [300, 400, 600], styles: ['normal'], source: 'system', chineseSupport: true },
    { id: 'helvetica', name: 'Helvetica', nameEn: 'Helvetica', family: 'Helvetica, Arial, sans-serif', category: 'sans-serif', weights: [300, 400, 700], styles: ['normal'], source: 'system', chineseSupport: false },
    { id: 'arial', name: 'Arial', nameEn: 'Arial', family: 'Arial, sans-serif', category: 'sans-serif', weights: [400, 700], styles: ['normal'], source: 'system', chineseSupport: false },

    // 展示体
    { id: 'noto-serif-tc', name: '思源宋体繁体', nameEn: 'Noto Serif TC', family: '"Noto Serif TC", serif', category: 'display', weights: [400, 700], styles: ['normal'], source: 'google', googleName: 'Noto+Serif+TC', chineseSupport: true },
    { id: 'orbitron', name: 'Orbitron', nameEn: 'Orbitron', family: '"Orbitron", sans-serif', category: 'display', weights: [400, 500, 700], styles: ['normal'], source: 'google', googleName: 'Orbitron', chineseSupport: false, description: '科技感展示字体' },
    { id: 'bebas-neue', name: 'Bebas Neue', nameEn: 'Bebas Neue', family: '"Bebas Neue", sans-serif', category: 'display', weights: [400], styles: ['normal'], source: 'google', googleName: 'Bebas+Neue', chineseSupport: false, description: '大写展示字体' },
    { id: 'impact', name: 'Impact', nameEn: 'Impact', family: 'Impact, sans-serif', category: 'display', weights: [400], styles: ['normal'], source: 'system', chineseSupport: false },

    // 手写体
    { id: 'zcool-xiaowei', name: '站酷小薇体', nameEn: 'ZCOOL XiaoWei', family: '"ZCOOL XiaoWei", serif', category: 'handwriting', weights: [400], styles: ['normal'], source: 'google', googleName: 'ZCOOL+XiaoWei', chineseSupport: true, description: '手写风格标题' },
    { id: 'zcool-qingke', name: '站酷庆科酱', nameEn: 'ZCOOL QingKe', family: '"ZCOOL QingKe", sans-serif', category: 'handwriting', weights: [400], styles: ['normal'], source: 'google', googleName: 'ZCOOL+QingKe', chineseSupport: true, description: '个性手写' },
    { id: 'ma-shan-zheng', name: '马善政毛笔', nameEn: 'Ma Shan Zheng', family: '"Ma Shan Zheng", cursive', category: 'handwriting', weights: [400], styles: ['normal'], source: 'google', googleName: 'Ma+Shan+Zheng', chineseSupport: true, description: '毛笔字体' },
    { id: 'kalam', name: 'Kalam', nameEn: 'Kalam', family: '"Kalam", cursive', category: 'handwriting', weights: [300, 400, 700], styles: ['normal'], source: 'google', googleName: 'Kalam', chineseSupport: false },

    // 等宽体
    { id: 'source-code-pro', name: '源码字体', nameEn: 'Source Code Pro', family: '"Source Code Pro", monospace', category: 'monospace', weights: [400, 600, 700], styles: ['normal'], source: 'google', googleName: 'Source+Code+Pro', chineseSupport: false, description: '代码专用' },
    { id: 'fira-code', name: 'Fira Code', nameEn: 'Fira Code', family: '"Fira Code", monospace', category: 'monospace', weights: [400, 600], styles: ['normal'], source: 'google', googleName: 'Fira+Code', chineseSupport: false },
    { id: 'jetbrains-mono', name: 'JetBrains Mono', nameEn: 'JetBrains Mono', family: '"JetBrains Mono", monospace', category: 'monospace', weights: [400, 600, 700], styles: ['normal'], source: 'google', googleName: 'JetBrains+Mono', chineseSupport: false },
    { id: 'courier', name: 'Courier New', nameEn: 'Courier New', family: '"Courier New", monospace', category: 'monospace', weights: [400, 700], styles: ['normal'], source: 'system', chineseSupport: false },

    // 装饰体
    { id: 'dancing-script', name: '舞动字体', nameEn: 'Dancing Script', family: '"Dancing Script", cursive', category: 'decorative', weights: [400, 500, 600, 700], styles: ['normal'], source: 'google', googleName: 'Dancing+Script', chineseSupport: false, description: '优雅装饰' },
    { id: 'pacifico', name: '太平洋字体', nameEn: 'Pacifico', family: '"Pacifico", cursive', category: 'decorative', weights: [400], styles: ['normal'], source: 'google', googleName: 'Pacifico', chineseSupport: false, description: '手写签名风格' },
    { id: 'lobster', name: '龙虾体', nameEn: 'Lobster', family: '"Lobster", cursive', category: 'decorative', weights: [400], styles: ['normal'], source: 'google', googleName: 'Lobster', chineseSupport: false },
    { id: 'comfortaa', name: '舒适体', nameEn: 'Comfortaa', family: '"Comfortaa", cursive', category: 'decorative', weights: [300, 400, 700], styles: ['normal'], source: 'google', nameEn: 'Comfortaa', chineseSupport: false, description: '圆润可爱风格' }
  ])

  // 字体组合
  const combinations = ref<FontCombination[]>([
    { id: 'classic', name: '经典正式', nameEn: 'Classic', title: fonts.value[0], body: fonts.value[5], description: '思源宋体+思源黑体' },
    { id: 'modern', name: '现代简约', nameEn: 'Modern', title: fonts.value[5], body: fonts.value[6], description: '思源黑体组合' },
    { id: 'elegant', name: '优雅精致', nameEn: 'Elegant', title: fonts.value[0], body: fonts.value[8], description: '宋体+黑体' },
    { id: 'tech', name: '科技感', nameEn: 'Tech', title: fonts.value[13], body: fonts.value[5], description: 'Orbitron+思源黑体' },
    { id: 'creative', name: '创意个性', nameEn: 'Creative', title: fonts.value[14], body: fonts.value[8], description: '站酷小薇+黑体' },
    { id: 'fresh', name: '清新自然', nameEn: 'Fresh', title: fonts.value[19], body: fonts.value[6], description: '手写风格组合' },
    { id: 'corporate', name: '企业商务', nameEn: 'Corporate', title: fonts.value[1], body: fonts.value[11], description: 'Noto Serif+Arial' },
    { id: 'academic', name: '学术严谨', nameEn: 'Academic', title: fonts.value[0], body: fonts.value[4], description: '衬线体组合' }
  ])

  // 当前设置
  const settings = ref<FontSettings>({
    titleFont: 'noto-serif-sc',
    bodyFont: 'noto-sans-sc',
    decorationFont: 'zcool-xiaowei',
    titleSize: 48,
    titleWeight: 700,
    bodySize: 18,
    bodyWeight: 400,
    lineHeight: 1.8,
    letterSpacing: 0
  })

  // 获取字体
  const getFont = (id: string) => fonts.value.find(f => f.id === id)

  // 获取字体CSS
  const getFontFamily = (id: string) => {
    const font = getFont(id)
    return font?.family || 'sans-serif'
  }

  // 按分类获取
  const getByCategory = (category: FontCategory) =>
    fonts.value.filter(f => f.category === category)

  // 按用途获取
  const getForUseCase = (useCase: FontUseCase): FontOption[] => {
    switch (useCase) {
      case 'title':
        return fonts.value.filter(f => ['serif', 'sans-serif', 'display', 'decorative'].includes(f.category))
      case 'body':
        return fonts.value.filter(f => ['serif', 'sans-serif'].includes(f.category))
      case 'caption':
        return fonts.value
      case 'decoration':
        return fonts.value.filter(f => ['handwriting', 'decorative'].includes(f.category))
      case 'code':
        return fonts.value.filter(f => f.category === 'monospace')
      default:
        return fonts.value
    }
  }

  // 支持中文的字体
  const getChineseFonts = () => fonts.value.filter(f => f.chineseSupport)

  // 应用字体组合
  const applyCombination = (combinationId: string) => {
    const combo = combinations.value.find(c => c.id === combinationId)
    if (combo) {
      settings.value.titleFont = combo.title.id
      settings.value.bodyFont = combo.body.id
      if (combo.decoration) {
        settings.value.decorationFont = combo.decoration.id
      }
    }
  }

  // 设置字体
  const setTitleFont = (fontId: string) => {
    settings.value.titleFont = fontId
  }

  const setBodyFont = (fontId: string) => {
    settings.value.bodyFont = fontId
  }

  const setDecorationFont = (fontId: string) => {
    settings.value.decorationFont = fontId
  }

  // 设置字号
  const setTitleSize = (size: number) => {
    settings.value.titleSize = Math.max(12, Math.min(200, size))
  }

  const setBodySize = (size: number) => {
    settings.value.bodySize = Math.max(8, Math.min(100, size))
  }

  // 设置字重
  const setTitleWeight = (weight: number) => {
    settings.value.titleWeight = Math.max(100, Math.min(900, weight))
  }

  const setBodyWeight = (weight: number) => {
    settings.value.bodyWeight = Math.max(100, Math.min(900, weight))
  }

  // 生成CSS
  const generateCSS = computed(() => `
    :root {
      --font-title: ${getFontFamily(settings.value.titleFont)};
      --font-body: ${getFontFamily(settings.value.bodyFont)};
      --font-decoration: ${getFontFamily(settings.value.decorationFont)};
      --font-size-title: ${settings.value.titleSize}px;
      --font-size-body: ${settings.value.bodySize}px;
      --font-weight-title: ${settings.value.titleWeight};
      --font-weight-body: ${settings.value.bodyWeight};
      --line-height: ${settings.value.lineHeight};
      --letter-spacing: ${settings.value.letterSpacing}px;
    }

    .title {
      font-family: var(--font-title);
      font-size: var(--font-size-title);
      font-weight: var(--font-weight-title);
      line-height: var(--line-height);
      letter-spacing: var(--letter-spacing);
    }

    .body {
      font-family: var(--font-body);
      font-size: var(--font-size-body);
      font-weight: var(--font-weight-body);
      line-height: var(--line-height);
      letter-spacing: var(--letter-spacing);
    }

    .decoration {
      font-family: var(--font-decoration);
    }
  `)

  // 统计
  const stats = computed(() => ({
    totalFonts: fonts.value.length,
    byCategory: fonts.value.reduce((acc, f) => {
      acc[f.category] = (acc[f.category] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    combinations: combinations.value.length,
    current: {
      title: getFont(settings.value.titleFont)?.name,
      body: getFont(settings.value.bodyFont)?.name,
      decoration: getFont(settings.value.decorationFont)?.name
    }
  }))

  return {
    // 字体库
    fonts,
    getFont,
    getFontFamily,
    getByCategory,
    getForUseCase,
    getChineseFonts,
    // 组合
    combinations,
    applyCombination,
    // 设置
    settings,
    setTitleFont,
    setBodyFont,
    setDecorationFont,
    setTitleSize,
    setBodySize,
    setTitleWeight,
    setBodyWeight,
    // CSS
    generateCSS,
    // 统计
    stats
  }
}

export default useFontSelection
