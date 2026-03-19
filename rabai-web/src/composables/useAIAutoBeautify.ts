// AI Auto Beautify - AI生成UI自动美化
import { ref, computed, reactive } from 'vue'

export interface ElementStyle {
  id: string
  type: string
  originalStyle: Record<string, any>
  beautifiedStyle: Record<string, any>
  confidence: number
}

export interface BeautifyResult {
  elementId: string
  changes: StyleChange[]
  preview: Record<string, any>
}

export interface StyleChange {
  property: string
  originalValue: any
  newValue: any
  reason: string
}

export interface BeautifyPreset {
  id: string
  name: string
  nameEn: string
  description: string
  category: 'modern' | 'classic' | 'minimal' | 'creative' | 'professional'
  settings: BeautifySettings
}

export interface BeautifySettings {
  colorScheme: 'auto' | 'warm' | 'cool' | 'neutral' | 'vibrant'
  fontScale: number
  spacing: 'compact' | 'comfortable' | 'spacious'
  borderRadius: 'none' | 'small' | 'medium' | 'large' | 'full'
  shadows: 'none' | 'subtle' | 'medium' | 'strong'
  animations: 'none' | 'subtle' | 'enhanced'
  contrast: 'low' | 'medium' | 'high'
}

export interface ColorPalette {
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
  text: string
  textSecondary: string
  border: string
  success: string
  warning: string
  error: string
}

export interface FontConfig {
  titleFont: string
  bodyFont: string
  monoFont: string
  baseSize: number
  scaleRatio: number
}

export function useAIAutoBeautify() {
  // 当前预设
  const currentPreset = ref<BeautifyPreset | null>(null)

  // 美化设置
  const settings = reactive<BeautifySettings>({
    colorScheme: 'auto',
    fontScale: 1,
    spacing: 'comfortable',
    borderRadius: 'medium',
    shadows: 'subtle',
    animations: 'subtle',
    contrast: 'medium'
  })

  // 预设列表
  const presets = ref<BeautifyPreset[]>([
    {
      id: 'preset_modern',
      name: '现代简约',
      nameEn: 'Modern Minimal',
      description: '简洁现代的设计风格',
      category: 'modern',
      settings: {
        colorScheme: 'neutral',
        fontScale: 1,
        spacing: 'comfortable',
        borderRadius: 'medium',
        shadows: 'subtle',
        animations: 'subtle',
        contrast: 'medium'
      }
    },
    {
      id: 'preset_classic',
      name: '经典商务',
      nameEn: 'Classic Business',
      description: '专业稳重的商务风格',
      category: 'professional',
      settings: {
        colorScheme: 'neutral',
        fontScale: 1,
        spacing: 'comfortable',
        borderRadius: 'none',
        shadows: 'none',
        animations: 'none',
        contrast: 'high'
      }
    },
    {
      id: 'preset_creative',
      name: '创意活泼',
      nameEn: 'Creative',
      description: '充满活力的创意风格',
      category: 'creative',
      settings: {
        colorScheme: 'vibrant',
        fontScale: 1.1,
        spacing: 'spacious',
        borderRadius: 'large',
        shadows: 'medium',
        animations: 'enhanced',
        contrast: 'medium'
      }
    },
    {
      id: 'preset_minimal',
      name: '极致简约',
      nameEn: 'Ultra Minimal',
      description: '极简主义设计',
      category: 'minimal',
      settings: {
        colorScheme: 'neutral',
        fontScale: 0.9,
        spacing: 'spacious',
        borderRadius: 'none',
        shadows: 'none',
        animations: 'none',
        contrast: 'low'
      }
    },
    {
      id: 'preset_warm',
      name: '温暖柔和',
      nameEn: 'Warm & Soft',
      description: '温暖柔和的色调',
      category: 'modern',
      settings: {
        colorScheme: 'warm',
        fontScale: 1,
        spacing: 'comfortable',
        borderRadius: 'medium',
        shadows: 'subtle',
        animations: 'subtle',
        contrast: 'medium'
      }
    },
    {
      id: 'preset_cool',
      name: '冷峻科技',
      nameEn: 'Cool Tech',
      description: '科技感冷色调',
      category: 'creative',
      settings: {
        colorScheme: 'cool',
        fontScale: 1,
        spacing: 'compact',
        borderRadius: 'small',
        shadows: 'medium',
        animations: 'enhanced',
        contrast: 'high'
      }
    }
  ])

  // 元素样式记录
  const elementStyles = ref<ElementStyle[]>([])

  // 美化结果
  const results = ref<BeautifyResult[]>([])

  // 分析状态
  const analyzing = ref(false)

  // 生成调色板
  const generatePalette = (scheme: BeautifySettings['colorScheme']): ColorPalette => {
    const palettes: Record<string, ColorPalette> = {
      auto: {
        primary: '#3b82f6',
        secondary: '#6366f1',
        accent: '#8b5cf6',
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#1e293b',
        textSecondary: '#64748b',
        border: '#e2e8f0',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444'
      },
      warm: {
        primary: '#f59e0b',
        secondary: '#ef4444',
        accent: '#ec4899',
        background: '#fffbeb',
        surface: '#fef3c7',
        text: '#451a03',
        textSecondary: '#92400e',
        border: '#fcd34d',
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444'
      },
      cool: {
        primary: '#0ea5e9',
        secondary: '#6366f1',
        accent: '#a855f7',
        background: '#f0f9ff',
        surface: '#e0f2fe',
        text: '#0c4a6e',
        textSecondary: '#0369a1',
        border: '#7dd3fc',
        success: '#14b8a6',
        warning: '#f59e0b',
        error: '#f43f5e'
      },
      neutral: {
        primary: '#525252',
        secondary: '#737373',
        accent: '#a3a3a3',
        background: '#fafafa',
        surface: '#f5f5f5',
        text: '#171717',
        textSecondary: '#525252',
        border: '#d4d4d4',
        success: '#22c55e',
        warning: '#eab308',
        error: '#dc2626'
      },
      vibrant: {
        primary: '#ff0080',
        secondary: '#7928ca',
        accent: '#00d4ff',
        background: '#ffffff',
        surface: '#fff0f5',
        text: '#1a1a2e',
        textSecondary: '#4a4a6a',
        border: '#ff80b0',
        success: '#00ff88',
        warning: '#ff8800',
        error: '#ff0044'
      }
    }

    return palettes[scheme] || palettes.auto
  }

  // 生成字体配置
  const generateFontConfig = (scale: number): FontConfig => ({
    titleFont: 'noto-sans-sc',
    bodyFont: 'noto-sans-sc',
    monoFont: 'noto-sans-mono',
    baseSize: 16 * scale,
    scaleRatio: 1.25
  })

  // 分析元素样式
  const analyzeElement = async (element: { id: string; type: string; style: Record<string, any> }): Promise<ElementStyle> => {
    analyzing.value = true

    // 模拟AI分析
    await new Promise(r => setTimeout(r, 200))

    const originalStyle = { ...element.style }

    // 根据类型生成美化建议
    let beautifiedStyle = { ...originalStyle }

    const palette = generatePalette(settings.colorScheme)
    const fonts = generateFontConfig(settings.fontScale)

    // 应用颜色方案
    if (element.type === 'button') {
      beautifiedStyle.backgroundColor = palette.primary
      beautifiedStyle.color = '#ffffff'
      beautifiedStyle.borderRadius = getBorderRadius(settings.borderRadius)
    } else if (element.type === 'text') {
      beautifiedStyle.color = palette.text
    } else if (element.type === 'container') {
      beautifiedStyle.backgroundColor = palette.surface
    }

    // 应用阴影
    if (settings.shadows !== 'none') {
      beautifiedStyle.boxShadow = getShadow(settings.shadows)
    }

    // 应用间距
    if (element.type !== 'text') {
      const spacing = getSpacing(settings.spacing)
      beautifiedStyle.padding = spacing
    }

    // 应用字体
    beautifiedStyle.fontFamily = fonts.bodyFont
    beautifiedStyle.fontSize = `${fonts.baseSize}px`

    const result: ElementStyle = {
      id: element.id,
      type: element.type,
      originalStyle,
      beautifiedStyle,
      confidence: 0.85 + Math.random() * 0.1
    }

    elementStyles.value.push(result)
    analyzing.value = false

    return result
  }

  // 获取圆角
  const getBorderRadius = (setting: BeautifySettings['borderRadius']): string => {
    const radii = { none: '0', small: '4px', medium: '8px', large: '16px', full: '9999px' }
    return radii[setting]
  }

  // 获取阴影
  const getShadow = (setting: BeautifySettings['shadows']): string => {
    const shadows = {
      none: 'none',
      subtle: '0 1px 3px rgba(0,0,0,0.1)',
      medium: '0 4px 12px rgba(0,0,0,0.15)',
      strong: '0 10px 25px rgba(0,0,0,0.2)'
    }
    return shadows[setting]
  }

  // 获取间距
  const getSpacing = (setting: BeautifySettings['spacing']): string => {
    const spacings = {
      compact: '8px',
      comfortable: '16px',
      spacious: '24px'
    }
    return spacings[setting]
  }

  // 应用美化
  const applyBeautify = async (elements: Array<{ id: string; type: string; style: Record<string, any> }>): Promise<BeautifyResult[]> => {
    results.value = []

    for (const element of elements) {
      const analyzed = await analyzeElement(element)

      const changes: StyleChange[] = []

      // 对比样式变化
      for (const key of Object.keys(analyzed.beautifiedStyle)) {
        if (analyzed.originalStyle[key] !== analyzed.beautifiedStyle[key]) {
          changes.push({
            property: key,
            originalValue: analyzed.originalStyle[key],
            newValue: analyzed.beautifiedStyle[key],
            reason: getChangeReason(key)
          })
        }
      }

      results.value.push({
        elementId: element.id,
        changes,
        preview: analyzed.beautifiedStyle
      })
    }

    return results.value
  }

  // 获取变化原因
  const getChangeReason = (property: string): string => {
    const reasons: Record<string, string> = {
      backgroundColor: '提升视觉层次',
      color: '优化文字可读性',
      borderRadius: '增加现代感',
      boxShadow: '添加深度效果',
      padding: '改善呼吸感',
      fontSize: '优化阅读体验',
      fontFamily: '提升整体美感'
    }
    return reasons[property] || '整体美化'
  }

  // 预览效果
  const previewStyle = computed(() => {
    const palette = generatePalette(settings.colorScheme)
    const fonts = generateFontConfig(settings.fontScale)

    return {
      colors: palette,
      fonts,
      spacing: getSpacing(settings.spacing),
      borderRadius: getBorderRadius(settings.borderRadius),
      shadow: getShadow(settings.shadows)
    }
  })

  // 应用预设
  const applyPreset = (presetId: string) => {
    const preset = presets.value.find(p => p.id === presetId)
    if (preset) {
      currentPreset.value = preset
      Object.assign(settings, preset.settings)
    }
  }

  // 更新设置
  const updateSettings = (newSettings: Partial<BeautifySettings>) => {
    Object.assign(settings, newSettings)
    currentPreset.value = null // 清除预设选择
  }

  // 生成CSS
  const generateCSS = computed(() => {
    const palette = generatePalette(settings.colorScheme)
    const fonts = generateFontConfig(settings.fontScale)

    return `
/* AI Auto Beautify - Generated CSS */
:root {
  --primary: ${palette.primary};
  --secondary: ${palette.secondary};
  --accent: ${palette.accent};
  --background: ${palette.background};
  --surface: ${palette.surface};
  --text: ${palette.text};
  --text-secondary: ${palette.textSecondary};
  --border: ${palette.border};
  --success: ${palette.success};
  --warning: ${palette.warning};
  --error: ${palette.error};

  --font-title: ${fonts.titleFont};
  --font-body: ${fonts.bodyFont};
  --font-mono: ${fonts.monoFont};

  --spacing: ${getSpacing(settings.spacing)};
  --radius: ${getBorderRadius(settings.borderRadius)};
  --shadow: ${getShadow(settings.shadows)};
}

body {
  font-family: var(--font-body);
  color: var(--text);
  background: var(--background);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-title);
}

button, .btn {
  background: var(--primary);
  color: white;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}

.container, .card {
  background: var(--surface);
  border-radius: var(--radius);
  padding: var(--spacing);
  box-shadow: var(--shadow);
}
`.trim()
  })

  // 获取分类预设
  const getPresetsByCategory = computed(() => {
    const categories: Record<string, BeautifyPreset[]> = {}
    presets.value.forEach(preset => {
      if (!categories[preset.category]) {
        categories[preset.category] = []
      }
      categories[preset.category].push(preset)
    })
    return categories
  })

  // 统计信息
  const stats = computed(() => ({
    totalPresets: presets.value.length,
    analyzedElements: elementStyles.value.length,
    appliedChanges: results.value.reduce((sum, r) => sum + r.changes.length, 0),
    confidence: results.value.length > 0
      ? results.value.reduce((sum, r) => sum + (elementStyles.value.find(e => e.id === r.elementId)?.confidence || 0), 0) / results.value.length
      : 0
  }))

  return {
    // 数据
    presets,
    currentPreset,
    settings,
    elementStyles,
    results,
    analyzing,

    // 方法
    applyPreset,
    updateSettings,
    analyzeElement,
    applyBeautify,
    generatePalette,
    generateFontConfig,

    // 计算属性
    previewStyle,
    generateCSS,
    getPresetsByCategory,
    stats
  }
}

export default useAIAutoBeautify
