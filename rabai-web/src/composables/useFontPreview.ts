// Font Preview - 字体预览功能
import { ref, computed, watch } from 'vue'

export interface PreviewText {
  id: string
  label: string
  labelEn: string
  text: string
}

export interface PreviewSize {
  id: string
  label: string
  size: number
}

export interface FontPreviewConfig {
  font: string
  weight: number
  style: 'normal' | 'italic'
  size: number
  color: string
  background: string
  lineHeight: number
  letterSpacing: number
}

export interface PreviewSample {
  id: string
  name: string
  nameEn: string
  category: string
  texts: string[]
}

export function useFontPreview() {
  // 预览文本样例
  const previewTexts = ref<PreviewText[]>([
    { id: 'text_1', label: '中文示例', labelEn: 'Chinese Sample', text: '永和九年岁在癸丑暮春之初会于会稽山阴之兰亭' },
    { id: 'text_2', label: '数字字母', labelEn: 'Numbers & Letters', text: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789' },
    { id: 'text_3', label: '标点符号', labelEn: 'Punctuation', text: '，。、；：？！（）【】《》—…·' },
    { id: 'text_4', label: '诗词', labelEn: 'Poetry', text: '床前明月光，疑是地上霜。举头望明月，低头思故乡。' },
    { id: 'text_5', label: '常用短语', labelEn: 'Common Phrases', text: '人工智能 机器学习 深度学习 神经网络' },
    { id: 'text_6', label: '长文本', labelEn: 'Long Text', text: '这是一个比较长的段落，包含了中文和English混合的内容，用于测试字体在长文本情况下的渲染效果和阅读体验。' }
  ])

  // 字号预设
  const sizePresets = ref<PreviewSize[]>([
    { id: 'size_xs', label: '特小', size: 12 },
    { id: 'size_sm', label: '小', size: 14 },
    { id: 'size_md', label: '中', size: 16 },
    { id: 'size_lg', label: '大', size: 20 },
    { id: 'size_xl', label: '特大', size: 24 },
    { id: 'size_2xl', label: '2倍', size: 32 },
    { id: 'size_3xl', label: '3倍', size: 40 },
    { id: 'size_4xl', label: '4倍', size: 48 },
    { id: 'size_5xl', label: '5倍', size: 56 },
    { id: 'size_6xl', label: '6倍', size: 64 },
    { id: 'size_7xl', label: '7倍', size: 72 },
    { id: 'size_8xl', label: '8倍', size: 80 }
  ])

  // 预览样例
  const samples = ref<PreviewSample[]>([
    { id: 'sample_1', name: '标题', nameEn: 'Heading', category: 'title', texts: ['演示标题', '这是大标题', '第二段内容'] },
    { id: 'sample_2', name: '正文', nameEn: 'Body', category: 'body', texts: ['这是一段正文内容，用于展示字体在正文阅读中的效果。', '第二行正文'] },
    { id: 'sample_3', name: '引用', nameEn: 'Quote', category: 'quote', texts: ['这是一段引用文字，可以展示特殊排版的视觉效果。'] }
  ])

  // 当前配置
  const config = ref<FontPreviewConfig>({
    font: 'Noto Sans SC',
    weight: 400,
    style: 'normal',
    size: 24,
    color: '#1e293b',
    background: '#ffffff',
    lineHeight: 1.6,
    letterSpacing: 0
  })

  // 选中的预览文本
  const selectedTextId = ref('text_1')

  // 选中的字号
  const selectedSizeId = ref('size_4xl')

  // 当前预览文本
  const currentText = computed(() => {
    const text = previewTexts.value.find(t => t.id === selectedTextId.value)
    return text?.text || previewTexts.value[0].text
  })

  // 当前字号
  const currentSize = computed(() => {
    const size = sizePresets.value.find(s => s.id === selectedSizeId.value)
    return size?.size || 24
  })

  // 切换预览文本
  const selectText = (textId: string) => {
    selectedTextId.value = textId
  }

  // 切换字号
  const selectSize = (sizeId: string) => {
    selectedSizeId.value = sizeId
  }

  // 更新配置
  const updateConfig = (updates: Partial<FontPreviewConfig>) => {
    Object.assign(config.value, updates)
  }

  // 更新字号
  const setSize = (size: number) => {
    config.value.size = size

    // 找到最接近的预设
    const preset = sizePresets.value.reduce((prev, curr) =>
      Math.abs(curr.size - size) < Math.abs(prev.size - size) ? curr : prev
    )
    selectedSizeId.value = preset.id
  }

  // 生成预览样式
  const previewStyle = computed(() => ({
    fontFamily: config.value.font,
    fontWeight: config.value.weight,
    fontStyle: config.value.style,
    fontSize: `${config.value.size}px`,
    color: config.value.color,
    backgroundColor: config.value.background,
    lineHeight: config.value.lineHeight,
    letterSpacing: `${config.value.letterSpacing}px`
  }))

  // 对比预览
  const compareFonts = (fonts: Array<{ name: string; family: string }>, text: string) => {
    return fonts.map(font => ({
      name: font.name,
      style: {
        ...previewStyle.value,
        fontFamily: font.family
      },
      text
    }))
  }

  // 获取不同字重的预览
  const getWeightPreview = (fontFamily: string, weights: number[]) => {
    return weights.map(weight => ({
      weight,
      style: {
        fontFamily,
        fontWeight: weight,
        fontSize: `${config.value.size}px`,
        color: config.value.color
      },
      label: getWeightLabel(weight),
      text: currentText.value
    }))
  }

  // 获取字重标签
  const getWeightLabel = (weight: number): string => {
    const labels: Record<number, string> = {
      100: 'Thin',
      200: 'Extra Light',
      300: 'Light',
      400: 'Regular',
      500: 'Medium',
      600: 'Semi Bold',
      700: 'Bold',
      800: 'Extra Bold',
      900: 'Black'
    }
    return labels[weight] || String(weight)
  }

  // 导出预览为图片（模拟）
  const exportAsImage = async (): Promise<string> => {
    // 这里可以集成html2canvas等库
    return 'data:image/png;base64,...'
  }

  // 复制CSS
  const copyCSS = (): string => {
    return `font-family: ${config.value.font};
font-weight: ${config.value.weight};
font-style: ${config.value.style};
font-size: ${config.value.size}px;
color: ${config.value.color};
background-color: ${config.value.background};
line-height: ${config.value.lineHeight};
letter-spacing: ${config.value.letterSpacing}px;`
  }

  // 统计
  const stats = computed(() => ({
    textsCount: previewTexts.value.length,
    sizesCount: sizePresets.value.length,
    currentText: selectedTextId.value,
    currentSize: currentSize.value,
    config: { ...config.value }
  }))

  return {
    previewTexts,
    sizePresets,
    samples,
    config,
    selectedTextId,
    selectedSizeId,
    currentText,
    currentSize,
    previewStyle,
    selectText,
    selectSize,
    updateConfig,
    setSize,
    compareFonts,
    getWeightPreview,
    getWeightLabel,
    exportAsImage,
    copyCSS,
    stats
  }
}

export default useFontPreview
