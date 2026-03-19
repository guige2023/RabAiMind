// Text Effects - 文字效果系统
import { ref, computed } from 'vue'

export type TextEffectType = 'gradient' | 'shadow' | '3d' | 'outline' | 'glow' | 'emboss' | 'neon' | 'metallic'

export interface TextEffect {
  type: TextEffectType
  enabled: boolean
  params: Record<string, any>
}

export interface GradientStop {
  color: string
  position: number
}

export interface ShadowConfig {
  color: string
  offsetX: number
  offsetY: number
  blur: number
  spread: number
}

export interface OutlineConfig {
  color: string
  width: number
}

export interface FontOption {
  id: string
  name: string
  nameEn: string
  family: string
  category: string
  chineseSupport: boolean
  weights: number[]
}

export interface ColorPalette {
  id: string
  name: string
  colors: string[]
}

export function useTextEffects() {
  // 文字效果
  const effects = ref<Record<TextEffectType, TextEffect>>({
    gradient: {
      type: 'gradient',
      enabled: false,
      params: {
        direction: 'to right',
        stops: [
          { color: '#667eea', position: 0 },
          { color: '#764ba2', position: 100 }
        ]
      }
    },
    shadow: {
      type: 'shadow',
      enabled: false,
      params: {
        color: 'rgba(0,0,0,0.3)',
        offsetX: 2,
        offsetY: 2,
        blur: 4,
        spread: 0
      }
    },
    '3d': {
      type: '3d',
      enabled: false,
      params: {
        depth: 5,
        angle: 135,
        color: '#000000'
      }
    },
    outline: {
      type: 'outline',
      enabled: false,
      params: {
        color: '#ffffff',
        width: 2
      }
    },
    glow: {
      type: 'glow',
      enabled: false,
      params: {
        color: '#00ffff',
        blur: 10
      }
    },
    emboss: {
      type: 'emboss',
      enabled: false,
      params: {
        lightColor: '#ffffff',
        darkColor: '#888888',
        blur: 2
      }
    },
    neon: {
      type: 'neon',
      enabled: false,
      params: {
        color: '#ff00ff',
        blur: 15
      }
    },
    metallic: {
      type: 'metallic',
      enabled: false,
      params: {
        baseColor: '#c0c0c0',
        highlightColor: '#ffffff',
        shadowColor: '#808080'
      }
    }
  })

  // 字号预设 (12-72pt)
  const fontSizes = ref([
    { value: 12, label: '12pt', name: '小六' },
    { value: 14, label: '14pt', name: '小五' },
    { value: 16, label: '16pt', name: '五号' },
    { value: 18, label: '18pt', name: '小四' },
    { value: 20, label: '20pt', name: '四号' },
    { value: 22, label: '22pt', name: '小三' },
    { value: 24, label: '24pt', name: '三号' },
    { value: 26, label: '26pt', name: '小二' },
    { value: 28, label: '28pt', name: '二号' },
    { value: 32, label: '32pt', name: '小一' },
    { value: 36, label: '36pt', name: '一号' },
    { value: 42, label: '42pt', name: '小初' },
    { value: 48, label: '48pt', name: '初号' },
    { value: 54, label: '54pt', name: '大初' },
    { value: 60, label: '60pt', name: '特号' },
    { value: 72, label: '72pt', name: '72pt' }
  ])

  // 50+字体库
  const fonts = ref<FontOption[]>([
    // 中文衬线
    { id: 'noto-serif-sc', name: '思源宋体', nameEn: 'Noto Serif SC', family: '"Noto Serif SC", serif', category: 'serif', chineseSupport: true, weights: [400, 600, 700] },
    { id: 'songti', name: '宋体', nameEn: 'Songti', family: 'SimSun, serif', category: 'serif', chineseSupport: true, weights: [400] },
    { id: 'fangzheng-zson', name: '方正书宋', nameEn: 'FZ ShuSong', family: 'FZShuSong, serif', category: 'serif', chineseSupport: true, weights: [400] },
    { id: 'fangzheng-xt', name: '方正细体', nameEn: 'FZ XiTi', family: 'FZXiTi, serif', category: 'serif', chineseSupport: true, weights: [400] },
    { id: 'times-new-roman', name: 'Times New Roman', nameEn: 'Times New Roman', family: '"Times New Roman", serif', category: 'serif', chineseSupport: false, weights: [400, 700] },
    { id: 'georgia', name: 'Georgia', nameEn: 'Georgia', family: 'Georgia, serif', category: 'serif', chineseSupport: false, weights: [400, 700] },

    // 中文无衬线
    { id: 'noto-sans-sc', name: '思源黑体', nameEn: 'Noto Sans SC', family: '"Noto Sans SC", sans-serif', category: 'sans-serif', chineseSupport: true, weights: [300, 400, 500, 600, 700] },
    { id: 'pingfang-sc', name: '苹方-简', nameEn: 'PingFang SC', family: '"PingFang SC", sans-serif', category: 'sans-serif', chineseSupport: true, weights: [300, 400, 500, 600] },
    { id: 'heiti-sc', name: '黑体', nameEn: 'Heiti SC', family: 'SimHei, sans-serif', category: 'sans-serif', chineseSupport: true, weights: [300, 400, 600] },
    { id: 'microsoft-yahei', name: '微软雅黑', nameEn: 'Microsoft YaHei', family: '"Microsoft YaHei", sans-serif', category: 'sans-serif', chineseSupport: true, weights: [300, 400, 600] },
    { id: 'droid-sans-fallback', name: 'Droid Sans Fallback', nameEn: 'Droid Sans Fallback', family: 'DroidSansFallback, sans-serif', category: 'sans-serif', chineseSupport: true, weights: [400] },
    { id: 'arial', name: 'Arial', nameEn: 'Arial', family: 'Arial, sans-serif', category: 'sans-serif', chineseSupport: false, weights: [400, 700] },
    { id: 'helvetica', name: 'Helvetica', nameEn: 'Helvetica', family: 'Helvetica, Arial, sans-serif', category: 'sans-serif', chineseSupport: false, weights: [300, 400, 700] },
    { id: 'verdana', name: 'Verdana', nameEn: 'Verdana', family: 'Verdana, sans-serif', category: 'sans-serif', chineseSupport: false, weights: [400, 700] },
    { id: 'tahoma', name: 'Tahoma', nameEn: 'Tahoma', family: 'Tahoma, sans-serif', category: 'sans-serif', chineseSupport: false, weights: [400, 700] },
    { id: 'roboto', name: 'Roboto', nameEn: 'Roboto', family: 'Roboto, sans-serif', category: 'sans-serif', chineseSupport: false, weights: [300, 400, 500, 700] },

    // 展示字体
    { id: 'orbitron', name: 'Orbitron', nameEn: 'Orbitron', family: '"Orbitron", sans-serif', category: 'display', chineseSupport: false, weights: [400, 500, 700, 900] },
    { id: 'bebas-neue', name: 'Bebas Neue', nameEn: 'Bebas Neue', family: '"Bebas Neue", sans-serif', category: 'display', chineseSupport: false, weights: [400] },
    { id: 'anton', name: 'Anton', nameEn: 'Anton', family: 'Anton, sans-serif', category: 'display', chineseSupport: false, weights: [400] },
    { id: 'oswald', name: 'Oswald', nameEn: 'Oswald', family: 'Oswald, sans-serif', category: 'display', chineseSupport: false, weights: [300, 400, 500, 600, 700] },
    { id: 'raleway', name: 'Raleway', nameEn: 'Raleway', family: 'Raleway, sans-serif', category: 'display', chineseSupport: false, weights: [100, 200, 300, 400, 500, 600, 700, 800, 900] },
    { id: 'montserrat', name: 'Montserrat', nameEn: 'Montserrat', family: 'Montserrat, sans-serif', category: 'display', chineseSupport: false, weights: [100, 200, 300, 400, 500, 600, 700, 800, 900] },
    { id: 'poppins', name: 'Poppins', nameEn: 'Poppins', family: 'Poppins, sans-serif', category: 'display', chineseSupport: false, weights: [100, 200, 300, 400, 500, 600, 700, 800, 900] },
    { id: 'futura', name: 'Futura', nameEn: 'Futura', family: 'Futura, sans-serif', category: 'display', chineseSupport: false, weights: [400, 700] },

    // 手写字体
    { id: 'zcool-xiaowei', name: '站酷小薇体', nameEn: 'ZCOOL XiaoWei', family: '"ZCOOL XiaoWei", sans-serif', category: 'handwriting', chineseSupport: true, weights: [400] },
    { id: 'zcool-qingke', name: '站酷庆科酱', nameEn: 'ZCOOL QingKe', family: '"ZCOOL QingKe", sans-serif', category: 'handwriting', chineseSupport: true, weights: [400] },
    { id: 'zcool-kuaile', name: '站酷快乐体', nameEn: 'ZCOOL KuaiLe', family: '"ZCOOL KuaiLe", sans-serif', category: 'handwriting', chineseSupport: true, weights: [400] },
    { id: 'ma-shan-zheng', name: '马善政毛笔', nameEn: 'Ma Shan Zheng', family: '"Ma Shan Zheng", cursive', category: 'handwriting', chineseSupport: true, weights: [400] },
    { id: 'long-cang', name: '龙藏体', nameEn: 'Long Cang', family: '"Long Cang", cursive', category: 'handwriting', chineseSupport: true, weights: [400] },
    { id: 'dancing-script', name: 'Dancing Script', nameEn: 'Dancing Script', family: '"Dancing Script", cursive', category: 'handwriting', chineseSupport: false, weights: [400, 500, 600, 700] },
    { id: 'pacifico', name: '太平洋字体', nameEn: 'Pacifico', family: '"Pacifico", cursive', category: 'handwriting', chineseSupport: false, weights: [400] },
    { id: 'lobster', name: 'Lobster', nameEn: 'Lobster', family: '"Lobster", cursive', category: 'handwriting', chineseSupport: false, weights: [400] },
    { id: 'kalam', name: 'Kalam', nameEn: 'Kalam', family: '"Kalam", cursive', category: 'handwriting', chineseSupport: false, weights: [300, 400, 700] },
    { id: 'permanent-marker', name: 'Permanent Marker', nameEn: 'Permanent Marker', family: '"Permanent Marker", cursive', category: 'handwriting', chineseSupport: false, weights: [400] },

    // 等宽字体
    { id: 'source-code-pro', name: '源码字体', nameEn: 'Source Code Pro', family: '"Source Code Pro", monospace', category: 'monospace', chineseSupport: false, weights: [400, 600, 700] },
    { id: 'fira-code', name: 'Fira Code', nameEn: 'Fira Code', family: '"Fira Code", monospace', category: 'monospace', chineseSupport: false, weights: [400, 600] },
    { id: 'jetbrains-mono', name: 'JetBrains Mono', nameEn: 'JetBrains Mono', family: '"JetBrains Mono", monospace', category: 'monospace', chineseSupport: false, weights: [400, 500, 600, 700] },
    { id: 'consolas', name: 'Consolas', nameEn: 'Consolas', family: 'Consolas, monospace', category: 'monospace', chineseSupport: false, weights: [400, 700] },
    { id: 'courier-new', name: 'Courier New', nameEn: 'Courier New', family: '"Courier New", monospace', category: 'monospace', chineseSupport: false, weights: [400, 700] },
    { id: 'inconsolata', name: 'Inconsolata', nameEn: 'Inconsolata', family: 'Inconsolata, monospace', category: 'monospace', chineseSupport: false, weights: [400, 700] },

    // 装饰字体
    { id: 'comfortaa', name: '舒适体', nameEn: 'Comfortaa', family: '"Comfortaa", cursive', category: 'decorative', chineseSupport: false, weights: [300, 400, 700] },
    { id: 'sacramento', name: '萨克拉门托', nameEn: 'Sacramento', family: 'Sacramento, cursive', category: 'decorative', chineseSupport: false, weights: [400] },
    { id: 'satisfy', name: '满足', nameEn: 'Satisfy', family: 'Satisfy, cursive', category: 'decorative', chineseSupport: false, weights: [400] },
    { id: 'great-vibes', name: '伟大 Vibes', nameEn: 'Great Vibes', family: '"Great Vibes", cursive', category: 'decorative', chineseSupport: false, weights: [400] },
    { id: 'allura', name: 'Allura', nameEn: 'Allura', family: 'Allura, cursive', category: 'decorative', chineseSupport: false, weights: [400] },
    { id: 'tangerine', name: '橘子', nameEn: 'Tangerine', family: 'Tangerine, cursive', category: 'decorative', chineseSupport: false, weights: [400, 700] },

    // 艺术字体
    { id: 'clip-art', name: '剪贴画', nameEn: 'Clip Art', family: 'ClipArt, fantasy', category: 'artistic', chineseSupport: false, weights: [400] },
    { id: 'stencil', name: '模板', nameEn: 'Stencil', family: 'Stencil, fantasy', category: 'artistic', chineseSupport: false, weights: [400, 700] }
  ])

  // 颜色调色板
  const colorPalettes = ref<ColorPalette[]>([
    { id: 'basic', name: '基础色', colors: ['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'] },
    { id: 'warm', name: '暖色系', colors: ['#ff6b6b', '#ffa726', '#ffcc02', '#ff9800', '#f57c00', '#ef6c00', '#d84315', '#bf360c'] },
    { id: 'cool', name: '冷色系', colors: ['#42a5f5', '#1e88e5', '#1976d2', '#1565c0', '#0d47a1', '#00acc1', '#00838f', '#006064'] },
    { id: 'nature', name: '自然色', colors: ['#66bb6a', '#43a047', '#2e7d32', '#1b5e20', '#8d6e63', '#6d4c41', '#4e342e', '#3e2723'] },
    { id: 'pastel', name: '粉彩色', colors: ['#ffcdd2', '#f8bbd0', '#e1bee7', '#d1c4e9', '#c5cae9', '#b3e5fc', '#b2dfdb', '#c8e6c9'] },
    { id: 'vibrant', name: '鲜艳色', colors: ['#ff1744', '#2979ff', '#00e676', '#ffea00', '#ff9100', '#f50057', '#651fff', '#00b8d4'] },
    { id: 'gradient-preset', name: '渐变预设', colors: ['linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'] },
    { id: 'metallic', name: '金属色', colors: ['#c0c0c0', '#ffd700', '#b87333', '#cd7f32', '#a9a9a9', '#d4af37', '#e5e4e2', '#bcc6cc'] }
  ])

  // 当前设置
  const currentFont = ref('noto-sans-sc')
  const currentSize = ref(24)
  const currentColor = ref('#000000')

  // 启用效果
  const enableEffect = (type: TextEffectType, enabled: boolean) => {
    effects.value[type].enabled = enabled
  }

  // 更新效果参数
  const updateEffectParams = (type: TextEffectType, params: Record<string, any>) => {
    Object.assign(effects.value[type].params, params)
  }

  // 生成CSS
  const generateCSS = computed(() => {
    let css = ''

    // 渐变
    if (effects.value.gradient.enabled) {
      const stops = effects.value.gradient.params.stops
        .map((s: GradientStop) => `${s.color} ${s.position}%`)
        .join(', ')
      css += `background: linear-gradient(${effects.value.gradient.params.direction}, ${stops});\n`
      css += `-webkit-background-clip: text;\n`
      css += `-webkit-text-fill-color: transparent;\n`
    }

    // 阴影
    if (effects.value.shadow.enabled) {
      const p = effects.value.shadow.params
      css += `text-shadow: ${p.offsetX}px ${p.offsetY}px ${p.blur}px ${p.color};\n`
    }

    // 3D效果
    if (effects.value['3d'].enabled) {
      const p = effects.value['3d'].params
      const shadows: string[] = []
      for (let i = 1; i <= p.depth; i++) {
        shadows.push(`${i}px ${i}px 0 ${p.color}`)
      }
      css += `text-shadow: ${shadows.join(', ')};\n`
    }

    // 发光
    if (effects.value.glow.enabled) {
      const p = effects.value.glow.params
      css += `text-shadow: 0 0 ${p.blur}px ${p.color};\n`
    }

    // 霓虹
    if (effects.value.neon.enabled) {
      const p = effects.value.neon.params
      css += `text-shadow: 0 0 5px ${p.color}, 0 0 10px ${p.color}, 0 0 20px ${p.color}, 0 0 40px ${p.color};\n`
    }

    // 描边
    if (effects.value.outline.enabled) {
      const p = effects.value.outline.params
      css += `-webkit-text-stroke: ${p.width}px ${p.color};\n`
    }

    return css
  })

  // 获取字体
  const getFont = (id: string) => fonts.value.find(f => f.id === id)

  // 获取渐变CSS
  const getGradientCSS = (gradientIndex: number) => {
    const colors = colorPalettes.value.find(p => p.id === 'gradient-preset')?.colors || []
    return colors[gradientIndex] || ''
  }

  // 统计
  const stats = computed(() => ({
    fonts: fonts.value.length,
    fontCategories: [...new Set(fonts.value.map(f => f.category))].length,
    effects: Object.values(effects.value).filter(e => e.enabled).length,
    fontSizes: fontSizes.value.length,
    colorPalettes: colorPalettes.value.length,
    currentFont: getFont(currentFont.value)?.name,
    currentSize: currentSize.value,
    currentColor: currentColor.value
  }))

  return {
    // 效果
    effects,
    enableEffect,
    updateEffectParams,
    generateCSS,
    // 字体
    fonts,
    currentFont,
    getFont,
    // 字号
    fontSizes,
    currentSize,
    // 颜色
    colorPalettes,
    currentColor,
    getGradientCSS,
    // 统计
    stats
  }
}

export default useTextEffects
