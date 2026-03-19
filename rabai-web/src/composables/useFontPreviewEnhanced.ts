// Font Preview Enhanced - 增强字体预览
import { ref, computed, watch } from 'vue'

export interface PreviewVariant {
  weight: number
  style: 'normal' | 'italic'
  label: string
}

export interface PreviewStyle {
  fontFamily: string
  variants: PreviewVariant[]
  sampleText: string
}

export interface CharacterGridItem {
  char: string
  code: string
  name: string
}

export interface WaterfallItem {
  fontFamily: string
  size: number
}

export function useFontPreviewEnhanced() {
  // 当前预览字体
  const currentFont = ref({
    family: 'Noto Sans SC',
    weight: 400,
    style: 'normal' as 'normal' | 'italic'
  })

  // 可用的字重变体
  const availableVariants = ref<PreviewVariant[]>([
    { weight: 100, style: 'normal', label: 'Thin' },
    { weight: 200, style: 'normal', label: 'Extra Light' },
    { weight: 300, style: 'normal', label: 'Light' },
    { weight: 400, style: 'normal', label: 'Regular' },
    { weight: 500, style: 'normal', label: 'Medium' },
    { weight: 600, style: 'normal', label: 'Semi Bold' },
    { weight: 700, style: 'normal', label: 'Bold' },
    { weight: 800, style: 'normal', label: 'Extra Bold' },
    { weight: 900, style: 'normal', label: 'Black' }
  ])

  // 预览文本
  const sampleText = ref('永和九年岁在癸丑暮春之初会于会稽山阴之兰亭')

  // 字号大小
  const fontSize = ref(32)

  // 预览样式
  const previewStyle = computed(() => ({
    fontFamily: currentFont.value.family,
    fontWeight: currentFont.value.weight,
    fontStyle: currentFont.value.style,
    fontSize: `${fontSize.value}px`,
    lineHeight: 1.5,
    letterSpacing: '0px'
  }))

  // 字符网格数据
  const characterGrid = computed((): CharacterGridItem[] => {
    const chars: CharacterGridItem[] = []
    const ranges = [
      { start: 0x4E00, end: 0x4FFF, name: '基本汉字' }, // 常用汉字
      { start: 0x0030, end: 0x0039, name: '数字' },
      { start: 0x0041, end: 0x005A, name: '大写字母' },
      { start: 0x0061, end: 0x007A, name: '小写字母' },
      { start: 0x3000, end: 0x303F, name: '中日韩符号' }
    ]

    ranges.forEach(range => {
      for (let i = range.start; i <= range.end; i++) {
        chars.push({
          char: String.fromCodePoint(i),
          code: `U+${i.toString(16).toUpperCase().padStart(4, '0')}`,
          name: range.name
        })
      }
    })

    return chars
  })

  // 字号瀑布流
  const waterfallSizes = [12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 56, 64, 72, 84, 96]

  // 对比字体列表
  const compareFonts = ref<string[]>([
    'Noto Sans SC',
    'Noto Serif SC',
    'Microsoft YaHei',
    'SimSun'
  ])

  // 添加对比字体
  const addCompareFont = (fontFamily: string) => {
    if (!compareFonts.value.includes(fontFamily)) {
      compareFonts.value.push(fontFamily)
    }
  }

  // 移除对比字体
  const removeCompareFont = (fontFamily: string) => {
    const index = compareFonts.value.indexOf(fontFamily)
    if (index > -1) {
      compareFonts.value.splice(index, 1)
    }
  }

  // 设置字体
  const setFont = (family: string, weight = 400, style: 'normal' | 'italic' = 'normal') => {
    currentFont.value = { family, weight, style }
  }

  // 设置字重
  const setWeight = (weight: number) => {
    currentFont.value.weight = weight
  }

  // 设置字号
  const setSize = (size: number) => {
    fontSize.value = size
  }

  // 调整字号
  const adjustSize = (delta: number) => {
    fontSize.value = Math.max(8, Math.min(200, fontSize.value + delta))
  }

  // 字符搜索
  const searchCharacter = (query: string): CharacterGridItem[] => {
    return characterGrid.value.filter(item =>
      item.char.includes(query) ||
      item.code.toLowerCase().includes(query.toLowerCase())
    )
  }

  // 获取变体标签
  const getVariantLabel = (weight: number): string => {
    const variant = availableVariants.value.find(v => v.weight === weight)
    return variant?.label || String(weight)
  }

  // 导出预览配置
  const exportConfig = () => {
    return JSON.stringify({
      font: currentFont.value,
      sampleText: sampleText.value,
      fontSize: fontSize.value,
      compareFonts: compareFonts.value
    }, null, 2)
  }

  // 复制字体CSS
  const copyFontCSS = () => {
    const style = previewStyle.value
    return `font-family: ${style.fontFamily};
font-weight: ${style.fontWeight};
font-style: ${style.fontStyle};
font-size: ${style.fontSize};
line-height: ${style.lineHeight};
letter-spacing: ${style.letterSpacing};`
  }

  // 生成对比预览HTML
  const generateCompareHTML = () => {
    let html = '<table style="width:100%; border-collapse: collapse;">'

    compareFonts.value.forEach(font => {
      html += `
  <tr>
    <td style="padding: 8px; border: 1px solid #ddd; font-family: ${font}; font-size: 24px;">
      ${sampleText.value}
    </td>
  </tr>`
    })

    html += '</table>'
    return html
  }

  // 字号预设
  const sizePresets = [
    { label: 'H1', size: 48 },
    { label: 'H2', size: 36 },
    { label: 'H3', size: 28 },
    { label: 'Body', size: 16 },
    { label: 'Small', size: 12 },
    { label: 'Caption', size: 10 }
  ]

  // 快速字号选择
  const quickSizes = [12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 56, 64, 72]

  // 统计
  const stats = computed(() => ({
    currentFont: currentFont.value.family,
    weight: currentFont.value.weight,
    size: fontSize.value,
    compareCount: compareFonts.value.length,
    characterCount: characterGrid.value.length,
    variantsCount: availableVariants.value.length
  }))

  return {
    currentFont,
    availableVariants,
    sampleText,
    fontSize,
    previewStyle,
    characterGrid,
    waterfallSizes,
    compareFonts,
    sizePresets,
    quickSizes,
    setFont,
    setWeight,
    setSize,
    adjustSize,
    searchCharacter,
    getVariantLabel,
    addCompareFont,
    removeCompareFont,
    exportConfig,
    copyFontCSS,
    generateCompareHTML,
    stats
  }
}

export default useFontPreviewEnhanced
