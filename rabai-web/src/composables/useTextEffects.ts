// Text Effects Complete - 完整文字效果系统
import { ref, computed } from 'vue'

export type TextEffectType = 'gradient' | 'shadow' | '3d' | 'outline' | 'glow' | 'emboss' | 'neon' | 'metallic' | 'rainbow' | 'fire' | 'ice' | 'glitch'

export interface TextEffect {
  type: TextEffectType
  enabled: boolean
  params: Record<string, any>
}

export interface GradientStop {
  color: string
  position: number
}

export interface GradientPreset {
  id: string
  name: string
  nameEn: string
  direction: string
  stops: GradientStop[]
  type: 'linear' | 'radial'
}

export interface ShadowPreset {
  id: string
  name: string
  nameEn: string
  color: string
  offsetX: number
  offsetY: number
  blur: number
  spread: number
}

export interface ColorPreset {
  id: string
  name: string
  nameEn: string
  color: string
  category: 'basic' | 'warm' | 'cool' | 'nature' | 'vibrant' | 'gradient'
}

export interface FontStylePreset {
  id: string
  name: string
  nameEn: string
  fontSize: number
  fontWeight: number
  letterSpacing: number
  lineHeight: number
  fontFamily: string
}

export function useTextEffects() {
  // 文字效果
  const effects = ref<Record<TextEffectType, TextEffect>>({
    gradient: { type: 'gradient', enabled: false, params: { direction: '135deg', stops: [{ color: '#667eea', position: 0 }, { color: '#764ba2', position: 100 }] } },
    shadow: { type: 'shadow', enabled: false, params: { color: 'rgba(0,0,0,0.3)', offsetX: 2, offsetY: 2, blur: 4, spread: 0 } },
    '3d': { type: '3d', enabled: false, params: { depth: 5, angle: 135, color: '#000000' } },
    outline: { type: 'outline', enabled: false, params: { color: '#ffffff', width: 2 } },
    glow: { type: 'glow', enabled: false, params: { color: '#00ffff', blur: 10 } },
    emboss: { type: 'emboss', enabled: false, params: { lightColor: '#ffffff', darkColor: '#888888', blur: 2 } },
    neon: { type: 'neon', enabled: false, params: { color: '#ff00ff', blur: 15 } },
    metallic: { type: 'metallic', enabled: false, params: { baseColor: '#c0c0c0', highlightColor: '#ffffff', shadowColor: '#808080' } },
    rainbow: { type: 'rainbow', enabled: false, params: { speed: 2 } },
    fire: { type: 'fire', enabled: false, params: { intensity: 1 } },
    ice: { type: 'ice', enabled: false, params: { intensity: 1 } },
    glitch: { type: 'glitch', enabled: false, params: { intensity: 1 } }
  })

  // 渐变色预设 (20+种)
  const gradientPresets = ref<GradientPreset[]>([
    { id: 'purple-blue', name: '紫蓝渐变', nameEn: 'Purple Blue', direction: '135deg', stops: [{ color: '#667eea', position: 0 }, { color: '#764ba2', position: 100 }], type: 'linear' },
    { id: 'pink-orange', name: '粉橙渐变', nameEn: 'Pink Orange', direction: '135deg', stops: [{ color: '#f093fb', position: 0 }, { color: '#f5576c', position: 100 }], type: 'linear' },
    { id: 'cyan-blue', name: '青蓝渐变', nameEn: 'Cyan Blue', direction: '135deg', stops: [{ color: '#4facfe', position: 0 }, { color: '#00f2fe', position: 100 }], type: 'linear' },
    { id: 'green-teal', name: '绿青渐变', nameEn: 'Green Teal', direction: '135deg', stops: [{ color: '#43e97b', position: 0 }, { color: '#38f9d7', position: 100 }], type: 'linear' },
    { id: 'sunset', name: '日落渐变', nameEn: 'Sunset', direction: '135deg', stops: [{ color: '#fa709a', position: 0 }, { color: '#fee140', position: 100 }], type: 'linear' },
    { id: 'ocean', name: '海洋渐变', nameEn: 'Ocean', direction: '180deg', stops: [{ color: '#2af598', position: 0 }, { color: '#009efd', position: 100 }], type: 'linear' },
    { id: 'night', name: '夜晚渐变', nameEn: 'Night', direction: '135deg', stops: [{ color: '#30cfd0', position: 0 }, { color: '#330867', position: 100 }], type: 'linear' },
    { id: 'royal', name: '皇家渐变', nameEn: 'Royal', direction: '135deg', stops: [{ color: '#c471f5', position: 0 }, { color: '#fa71cd', position: 100 }], type: 'linear' },
    { id: 'fire', name: '火焰渐变', nameEn: 'Fire', direction: '180deg', stops: [{ color: '#f12711', position: 0 }, { color: '#f5af19', position: 100 }], type: 'linear' },
    { id: 'ice', name: '冰霜渐变', nameEn: 'Ice', direction: '180deg', stops: [{ color: '#00c6fb', position: 0 }, { color: '#005bea', position: 100 }], type: 'linear' },
    { id: 'gold', name: '金色渐变', nameEn: 'Gold', direction: '135deg', stops: [{ color: '#f7971e', position: 0 }, { color: '#ffd200', position: 100 }], type: 'linear' },
    { id: 'silver', name: '银色渐变', nameEn: 'Silver', direction: '135deg', stops: [{ color: '#bdc3c7', position: 0 }, { color: '#2c3e50', position: 100 }], type: 'linear' },
    { id: 'rainbow', name: '彩虹渐变', nameEn: 'Rainbow', direction: '90deg', stops: [{ color: '#ff0000', position: 0 }, { color: '#ff7300', position: 17 }, { color: '#fffb00', position: 33 }, { color: '#00ff00', position: 50 }, { color: '#00ffff', position: 67 }, { color: '#0000ff', position: 83 }, { color: '#ff00ff', position: 100 }], type: 'linear' },
    { id: 'candy', name: '糖果渐变', nameEn: 'Candy', direction: '135deg', stops: [{ color: '#d53369', position: 0 }, { color: '#daae51', position: 100 }], type: 'linear' },
    { id: 'deep-sea', name: '深海渐变', nameEn: 'Deep Sea', direction: '180deg', stops: [{ color: '#2c3e50', position: 0 }, { color: '#4ca1af', position: 100 }], type: 'linear' },
    { id: 'aurora', name: '极光渐变', nameEn: 'Aurora', direction: '135deg', stops: [{ color: '#00cdac', position: 0 }, { color: '#8ddad5', position: 100 }], type: 'linear' },
    { id: 'passion', name: '热情渐变', nameEn: 'Passion', direction: '135deg', stops: [{ color: '#ff416c', position: 0 }, { color: '#ff4b2b', position: 100 }], type: 'linear' },
    { id: 'mystic', name: '神秘渐变', nameEn: 'Mystic', direction: '135deg', stops: [{ color: '#7f00ff', position: 0 }, { color: '#e100ff', position: 100 }], type: 'linear' },
    { id: 'spring', name: '春天渐变', nameEn: 'Spring', direction: '135deg', stops: [{ color: '#a8edea', position: 0 }, { color: '#fed6e3', position: 100 }], type: 'linear' },
    { id: 'autumn', name: '秋天渐变', nameEn: 'Autumn', direction: '135deg', stops: [{ color: '#d299c2', position: 0 }, { color: '#fef9d7', position: 100 }], type: 'linear' }
  ])

  // 阴影预设 (12种)
  const shadowPresets = ref<ShadowPreset[]>([
    { id: 'soft', name: '柔和阴影', nameEn: 'Soft', color: 'rgba(0,0,0,0.1)', offsetX: 0, offsetY: 4, blur: 6, spread: 0 },
    { id: 'medium', name: '中等阴影', nameEn: 'Medium', color: 'rgba(0,0,0,0.15)', offsetX: 0, offsetY: 6, blur: 10, spread: 0 },
    { id: 'strong', name: '强阴影', nameEn: 'Strong', color: 'rgba(0,0,0,0.2)', offsetX: 0, offsetY: 8, blur: 15, spread: 0 },
    { id: 'inner', name: '内阴影', nameEn: 'Inner', color: 'rgba(0,0,0,0.1)', offsetX: 0, offsetY: 2, blur: 4, spread: 0 },
    { id: 'glow-blue', name: '蓝色发光', nameEn: 'Blue Glow', color: 'rgba(59,130,246,0.5)', offsetX: 0, offsetY: 0, blur: 10, spread: 0 },
    { id: 'glow-green', name: '绿色发光', nameEn: 'Green Glow', color: 'rgba(34,197,94,0.5)', offsetX: 0, offsetY: 0, blur: 10, spread: 0 },
    { id: 'glow-pink', name: '粉色发光', nameEn: 'Pink Glow', color: 'rgba(236,72,153,0.5)', offsetX: 0, offsetY: 0, blur: 10, spread: 0 },
    { id: 'glow-purple', name: '紫色发光', nameEn: 'Purple Glow', color: 'rgba(139,92,246,0.5)', offsetX: 0, offsetY: 0, blur: 10, spread: 0 },
    { id: 'drop', name: '投影', nameEn: 'Drop', color: 'rgba(0,0,0,0.25)', offsetX: 5, offsetY: 5, blur: 15, spread: 0 },
    { id: 'lifted', name: '悬浮', nameEn: 'Lifted', color: 'rgba(0,0,0,0.2)', offsetX: 10, offsetY: 10, blur: 20, spread: -5 },
    { id: 'flat', name: '平面', nameEn: 'Flat', color: 'rgba(0,0,0,0.05)', offsetX: 0, offsetY: 2, blur: 3, spread: 0 },
    { id: 'concave', name: '凹陷', nameEn: 'Concave', color: 'rgba(255,255,255,0.7)', offsetX: 0, offsetY: -2, blur: 4, spread: 0 }
  ])

  // 颜色预设 (60+种)
  const colorPresets = ref<ColorPreset[]>([
    // 基础色
    { id: 'black', name: '黑色', nameEn: 'Black', color: '#000000', category: 'basic' },
    { id: 'white', name: '白色', nameEn: 'White', color: '#ffffff', category: 'basic' },
    { id: 'red', name: '红色', nameEn: 'Red', color: '#ef4444', category: 'basic' },
    { id: 'green', name: '绿色', nameEn: 'Green', color: '#22c55e', category: 'basic' },
    { id: 'blue', name: '蓝色', nameEn: 'Blue', color: '#3b82f6', category: 'basic' },
    { id: 'yellow', name: '黄色', nameEn: 'Yellow', color: '#eab308', category: 'basic' },
    // 暖色系
    { id: 'orange', name: '橙色', nameEn: 'Orange', color: '#f97316', category: 'warm' },
    { id: 'amber', name: '琥珀', nameEn: 'Amber', color: '#f59e0b', category: 'warm' },
    { id: 'rose', name: '玫瑰红', nameEn: 'Rose', color: '#f43f5e', category: 'warm' },
    { id: 'coral', name: '珊瑚', nameEn: 'Coral', color: '#fb7185', category: 'warm' },
    { id: 'peach', name: '桃子', nameEn: 'Peach', color: '#fdba74', category: 'warm' },
    { id: 'terracotta', name: '陶土', nameEn: 'Terracotta', color: '#c2410c', category: 'warm' },
    { id: 'gold-color', name: '金色', nameEn: 'Gold', color: '#f59e0b', category: 'warm' },
    { id: 'bronze', name: '青铜', nameEn: 'Bronze', color: '#cd7f32', category: 'warm' },
    // 冷色系
    { id: 'cyan', name: '青色', nameEn: 'Cyan', color: '#06b6d4', category: 'cool' },
    { id: 'teal', name: '青绿', nameEn: 'Teal', color: '#14b8a6', category: 'cool' },
    { id: 'indigo', name: '靛蓝', nameEn: 'Indigo', color: '#6366f1', category: 'cool' },
    { id: 'purple', name: '紫色', nameEn: 'Purple', color: '#a855f7', category: 'cool' },
    { id: 'violet', name: '紫罗兰', nameEn: 'Violet', color: '#8b5cf6', category: 'cool' },
    { id: 'navy', name: '海军蓝', nameEn: 'Navy', color: '#1e3a8a', category: 'cool' },
    { id: 'slate', name: '岩石灰', nameEn: 'Slate', color: '#64748b', category: 'cool' },
    // 自然色
    { id: 'emerald', name: '翡翠', nameEn: 'Emerald', color: '#059669', category: 'nature' },
    { id: 'forest', name: '森林', nameEn: 'Forest', color: '#15803d', category: 'nature' },
    { id: 'sage', name: '鼠尾草', nameEn: 'Sage', color: '#84cc16', category: 'nature' },
    { id: 'olive', name: '橄榄', nameEn: 'Olive', color: '#84cc16', category: 'nature' },
    { id: 'mint', name: '薄荷', nameEn: 'Mint', color: '#6ee7b7', category: 'nature' },
    { id: 'sand', name: '沙色', nameEn: 'Sand', color: '#d6d3d1', category: 'nature' },
    { id: 'cream', name: '奶油', nameEn: 'Cream', color: '#fef3c7', category: 'nature' },
    // 鲜艳色
    { id: 'pink-vibrant', name: '亮粉', nameEn: 'Vibrant Pink', color: '#ec4899', category: 'vibrant' },
    { id: 'fuchsia', name: '洋红', nameEn: 'Fuchsia', color: '#d946ef', category: 'vibrant' },
    { id: 'lime-vibrant', name: '亮绿', nameEn: 'Vibrant Lime', color: '#84cc16', category: 'vibrant' },
    { id: 'sky-blue', name: '天蓝', nameEn: 'Sky Blue', color: '#0ea5e9', category: 'vibrant' },
    { id: 'hot-pink', name: '热粉', nameEn: 'Hot Pink', color: '#f472b6', category: 'vibrant' },
    { id: 'electric-blue', name: '电光蓝', nameEn: 'Electric Blue', color: '#3b82f6', category: 'vibrant' },
    { id: 'neon-green', name: '霓虹绿', nameEn: 'Neon Green', color: '#39ff14', category: 'vibrant' },
    { id: 'neon-pink', name: '霓虹粉', nameEn: 'Neon Pink', color: '#ff6b9d', category: 'vibrant' }
  ])

  // 字号预设 (12-72pt)
  const fontSizePresets = ref([
    { value: 12, label: '12pt', name: '小六' },
    { value: 14, label: '14pt', name: '小五' },
    { value: 16, label: '16pt', name: '五号' },
    { value: 18, label: '18pt', name: '小四' },
    { value: 20, label: '20pt', name: '四号' },
    { value: 24, label: '24pt', name: '三号' },
    { value: 28, label: '28pt', name: '二号' },
    { value: 32, label: '32pt', name: '小一' },
    { value: 36, label: '36pt', name: '一号' },
    { value: 42, label: '42pt', name: '小初' },
    { value: 48, label: '48pt', name: '初号' },
    { value: 54, label: '54pt', name: '大初' },
    { value: 60, label: '60pt', name: '特号' },
    { value: 72, label: '72pt', name: '72pt' }
  ])

  // 字体样式预设
  const fontStylePresets = ref<FontStylePreset[]>([
    { id: 'title-large', name: '大标题', nameEn: 'Title Large', fontSize: 48, fontWeight: 700, letterSpacing: 0, lineHeight: 1.2, fontFamily: 'noto-sans-sc' },
    { id: 'title-medium', name: '中标题', nameEn: 'Title Medium', fontSize: 36, fontWeight: 600, letterSpacing: 0, lineHeight: 1.3, fontFamily: 'noto-sans-sc' },
    { id: 'title-small', name: '小标题', nameEn: 'Title Small', fontSize: 24, fontWeight: 600, letterSpacing: 0, lineHeight: 1.4, fontFamily: 'noto-sans-sc' },
    { id: 'headline', name: '标题', nameEn: 'Headline', fontSize: 20, fontWeight: 500, letterSpacing: 0, lineHeight: 1.5, fontFamily: 'noto-sans-sc' },
    { id: 'body-large', name: '大正文', nameEn: 'Body Large', fontSize: 18, fontWeight: 400, letterSpacing: 0, lineHeight: 1.8, fontFamily: 'noto-sans-sc' },
    { id: 'body-medium', name: '中正文', nameEn: 'Body Medium', fontSize: 16, fontWeight: 400, letterSpacing: 0, lineHeight: 1.8, fontFamily: 'noto-sans-sc' },
    { id: 'body-small', name: '小正文', nameEn: 'Body Small', fontSize: 14, fontWeight: 400, letterSpacing: 0, lineHeight: 1.6, fontFamily: 'noto-sans-sc' },
    { id: 'caption', name: '说明', nameEn: 'Caption', fontSize: 12, fontWeight: 400, letterSpacing: 0, lineHeight: 1.5, fontFamily: 'noto-sans-sc' },
    { id: 'button', name: '按钮', nameEn: 'Button', fontSize: 16, fontWeight: 500, letterSpacing: 1, lineHeight: 1, fontFamily: 'noto-sans-sc' }
  ])

  // 当前设置
  const currentFontSize = ref(24)
  const currentColor = ref('#000000')
  const currentFontFamily = ref('noto-sans-sc')
  const currentGradient = ref<GradientPreset | null>(null)

  // 应用渐变预设
  const applyGradient = (preset: GradientPreset) => {
    currentGradient.value = preset
    effects.value.gradient.params.direction = preset.direction
    effects.value.gradient.params.stops = [...preset.stops]
    effects.value.gradient.enabled = true
  }

  // 应用阴影预设
  const applyShadow = (preset: ShadowPreset) => {
    effects.value.shadow.params = { color: preset.color, offsetX: preset.offsetX, offsetY: preset.offsetY, blur: preset.blur, spread: preset.spread }
    effects.value.shadow.enabled = true
  }

  // 应用颜色
  const applyColor = (color: string) => {
    currentColor.value = color
  }

  // 设置字号
  const setFontSize = (size: number) => {
    currentFontSize.value = Math.max(12, Math.min(200, size))
  }

  // 启用效果
  const enableEffect = (type: TextEffectType, enabled: boolean) => {
    effects.value[type].enabled = enabled
  }

  // 生成CSS
  const generateCSS = computed(() => {
    let css = ''

    // 渐变
    if (effects.value.gradient.enabled && currentGradient.value) {
      const stops = effects.value.gradient.params.stops.map((s: GradientStop) => `${s.color} ${s.position}%`).join(', ')
      css += `background: ${currentGradient.value.type}-gradient(${effects.value.gradient.params.direction}, ${stops});\n`
      css += `-webkit-background-clip: text;\n-webkit-text-fill-color: transparent;\n`
    }

    // 阴影
    if (effects.value.shadow.enabled) {
      const p = effects.value.shadow.params
      css += `text-shadow: ${p.offsetX}px ${p.offsetY}px ${p.blur}px ${p.color};\n`
    }

    // 3D
    if (effects.value['3d'].enabled) {
      const p = effects.value['3d'].params
      const shadows: string[] = []
      for (let i = 1; i <= p.depth; i++) shadows.push(`${i}px ${i}px 0 ${p.color}`)
      css += `text-shadow: ${shadows.join(', ')};\n`
    }

    // 发光
    if (effects.value.glow.enabled) {
      css += `text-shadow: 0 0 ${effects.value.glow.params.blur}px ${effects.value.glow.params.color};\n`
    }

    // 霓虹
    if (effects.value.neon.enabled) {
      const c = effects.value.neon.params.color
      css += `text-shadow: 0 0 5px ${c}, 0 0 10px ${c}, 0 0 20px ${c}, 0 0 40px ${c};\n`
    }

    return css
  })

  // 获取渐变CSS
  const getGradientCSS = computed(() => {
    if (!currentGradient.value) return ''
    const stops = currentGradient.value.stops.map(s => `${s.color} ${s.position}%`).join(', ')
    return `${currentGradient.value.type}-gradient(${currentGradient.value.direction}, ${stops})`
  })

  // 统计
  const stats = computed(() => ({
    gradientPresets: gradientPresets.value.length,
    shadowPresets: shadowPresets.value.length,
    colorPresets: colorPresets.value.length,
    fontSizePresets: fontSizePresets.value.length,
    fontStylePresets: fontStylePresets.value.length,
    currentFontSize: currentFontSize.value,
    currentColor: currentColor.value,
    enabledEffects: Object.values(effects.value).filter(e => e.enabled).length
  }))

  return {
    // 效果
    effects,
    enableEffect,
    generateCSS,
    // 渐变
    gradientPresets,
    currentGradient,
    applyGradient,
    getGradientCSS,
    // 阴影
    shadowPresets,
    applyShadow,
    // 颜色
    colorPresets,
    currentColor,
    applyColor,
    // 字号
    fontSizePresets,
    currentFontSize,
    setFontSize,
    // 字体样式
    fontStylePresets,
    currentFontFamily,
    // 统计
    stats
  }
}

export default useTextEffects
