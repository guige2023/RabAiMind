// Image Processor Pro - 图片处理深度优化
import { ref, computed } from 'vue'

export type ImageFilterType = 'blur' | 'brightness' | 'contrast' | 'grayscale' | 'hue' | 'invert' | 'saturate' | 'sepia'

export interface ImageFilter {
  id: string
  type: ImageFilterType
  value: number
  enabled: boolean
}

export interface ImageAdjustment {
  brightness: number
  contrast: number
  saturation: number
  exposure: number
  highlights: number
  shadows: number
  temperature: number
  tint: number
  sharpness: number
  blur: number
}

export interface ImageCrop {
  x: number
  y: number
  width: number
  height: number
  aspectRatio?: string
}

export interface AIFeatureConfig {
  enableAutoEnhance: boolean
  enableSmartCrop: boolean
  enableBackgroundRemoval: boolean
  enableStyleTransfer: boolean
}

export function useImageProcessorPro() {
  // 基础处理状态
  const isProcessing = ref(false)
  const processingProgress = ref(0)

  // 图像调整
  const adjustments = ref<ImageAdjustment>({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    exposure: 0,
    highlights: 0,
    shadows: 0,
    temperature: 0,
    tint: 0,
    sharpness: 0,
    blur: 0
  })

  // 滤镜
  const filters = ref<ImageFilter[]>([
    { id: 'f1', type: 'blur', value: 0, enabled: false },
    { id: 'f2', type: 'brightness', value: 100, enabled: false },
    { id: 'f3', type: 'contrast', value: 100, enabled: false },
    { id: 'f4', type: 'grayscale', value: 0, enabled: false },
    { id: 'f5', type: 'sepia', value: 0, enabled: false },
    { id: 'f6', type: 'saturate', value: 100, enabled: false }
  ])

  // 裁剪
  const crop = ref<ImageCrop | null>(null)

  // AI功能配置
  const aiConfig = ref<AIFeatureConfig>({
    enableAutoEnhance: true,
    enableSmartCrop: true,
    enableBackgroundRemoval: false,
    enableStyleTransfer: false
  })

  // 历史记录
  const history = ref<ImageAdjustment[]>[]
  const historyIndex = ref(-1)

  // 调整值
  const setAdjustment = (key: keyof ImageAdjustment, value: number) => {
    adjustments.value[key] = value
    saveToHistory()
  }

  // 重置调整
  const resetAdjustments = () => {
    adjustments.value = {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      exposure: 0,
      highlights: 0,
      shadows: 0,
      temperature: 0,
      tint: 0,
      sharpness: 0,
      blur: 0
    }
    saveToHistory()
  }

  // 应用滤镜
  const applyFilter = (filterId: string, value: number) => {
    const filter = filters.value.find(f => f.id === filterId)
    if (filter) {
      filter.value = value
      filter.enabled = value > 0
    }
  }

  // 切换滤镜
  const toggleFilter = (filterId: string) => {
    const filter = filters.value.find(f => f.id === filterId)
    if (filter) {
      filter.enabled = !filter.enabled
    }
  }

  // 预设滤镜
  const filterPresets = {
    none: { brightness: 100, contrast: 100, saturation: 100, grayscale: 0, sepia: 0 },
    vintage: { brightness: 110, contrast: 90, saturation: 80, grayscale: 0, sepia: 30 },
    noir: { brightness: 100, contrast: 120, saturation: 0, grayscale: 100, sepia: 0 },
    vivid: { brightness: 105, contrast: 110, saturation: 130, grayscale: 0, sepia: 0 },
    warm: { brightness: 100, contrast: 100, saturation: 110, temperature: 15, sepia: 0 },
    cool: { brightness: 100, contrast: 100, saturation: 90, temperature: -15, sepia: 0 },
    dramatic: { brightness: 90, contrast: 130, saturation: 110, grayscale: 0, sepia: 0 },
    soft: { brightness: 105, contrast: 85, saturation: 90, blur: 1, sepia: 0 }
  }

  // 应用预设
  const applyPreset = (presetName: keyof typeof filterPresets) => {
    const preset = filterPresets[presetName]
    if (!preset) return

    adjustments.value = {
      ...adjustments.value,
      brightness: preset.brightness || 100,
      contrast: preset.contrast || 100,
      saturation: preset.saturation || 100,
      blur: preset.blur || 0
    }

    // 应用灰度和复古
    const grayscaleFilter = filters.value.find(f => f.type === 'grayscale')
    if (grayscaleFilter) {
      grayscaleFilter.enabled = preset.grayscale ? preset.grayscale > 0 : false
      grayscaleFilter.value = preset.grayscale || 0
    }

    const sepiaFilter = filters.value.find(f => f.type === 'sepia')
    if (sepiaFilter) {
      sepiaFilter.enabled = preset.sepia ? preset.sepia > 0 : false
      sepiaFilter.value = preset.sepia || 0
    }

    saveToHistory()
  }

  // 裁剪图片
  const setCrop = (newCrop: ImageCrop) => {
    crop.value = newCrop
  }

  const resetCrop = () => {
    crop.value = null
  }

  // 历史记录
  const saveToHistory = () => {
    history.value = history.value.slice(0, historyIndex.value + 1)
    history.value.push({ ...adjustments.value })
    historyIndex.value = history.value.length - 1

    // 限制历史长度
    if (history.value.length > 20) {
      history.value.shift()
      historyIndex.value--
    }
  }

  const undo = () => {
    if (historyIndex.value > 0) {
      historyIndex.value--
      adjustments.value = { ...history.value[historyIndex.value] }
    }
  }

  const redo = () => {
    if (historyIndex.value < history.value.length - 1) {
      historyIndex.value++
      adjustments.value = { ...history.value[historyIndex.value] }
    }
  }

  // 生成CSS滤镜字符串
  const filterCSS = computed(() => {
    const parts: string[] = []

    filters.value.filter(f => f.enabled).forEach(f => {
      switch (f.type) {
        case 'blur': parts.push(`blur(${f.value}px)`); break
        case 'brightness': parts.push(`brightness(${f.value}%)`); break
        case 'contrast': parts.push(`contrast(${f.value}%)`); break
        case 'grayscale': parts.push(`grayscale(${f.value}%)`); break
        case 'sepia': parts.push(`sepia(${f.value}%)`); break
        case 'saturate': parts.push(`saturate(${f.value}%)`); break
        case 'invert': parts.push(`invert(${f.value}%)`); break
        case 'hue': parts.push(`hue-rotate(${f.value}deg)`); break
      }
    })

    return parts.join(' ')
  })

  // 智能裁剪建议
  const suggestSmartCrop = (imgWidth: number, imgHeight: number, targetRatio?: string) => {
    const ratios: Record<string, number> = {
      '1:1': 1,
      '4:3': 4/3,
      '16:9': 16/9,
      '3:2': 3/2,
      '21:9': 21/9
    }

    if (!targetRatio || !ratios[targetRatio]) {
      // 默认使用原始比例
      return { x: 0, y: 0, width: imgWidth, height: imgHeight }
    }

    const targetW = imgHeight * ratios[targetRatio]
    const targetH = imgWidth / ratios[targetRatio]

    if (targetW <= imgWidth) {
      return {
        x: Math.round((imgWidth - targetW) / 2),
        y: 0,
        width: Math.round(targetW),
        height: imgHeight
      }
    } else {
      return {
        x: 0,
        y: Math.round((imgHeight - targetH) / 2),
        width: imgWidth,
        height: Math.round(targetH)
      }
    }
  }

  // 批量处理队列
  const processingQueue = ref<string[]>([])
  const currentProcessing = ref<string | null>(null)

  const addToQueue = (src: string) => {
    processingQueue.value.push(src)
  }

  const processQueue = async (processFn: (src: string) => Promise<any>) => {
    while (processingQueue.value.length > 0) {
      currentProcessing.value = processingQueue.value.shift()!
      await processFn(currentProcessing.value)
      currentProcessing.value = null
    }
  }

  // 统计
  const stats = computed(() => ({
    isProcessing: isProcessing.value,
    progress: processingProgress.value,
    activeFilters: filters.value.filter(f => f.enabled).length,
    hasCrop: !!crop.value,
    canUndo: historyIndex.value > 0,
    canRedo: historyIndex.value < history.value.length - 1,
    queueLength: processingQueue.value.length
  }))

  return {
    isProcessing,
    processingProgress,
    adjustments,
    filters,
    crop,
    aiConfig,
    history,
    historyIndex,
    processingQueue,
    currentProcessing,
    filterCSS,
    stats,
    setAdjustment,
    resetAdjustments,
    applyFilter,
    toggleFilter,
    applyPreset,
    filterPresets,
    setCrop,
    resetCrop,
    saveToHistory,
    undo,
    redo,
    suggestSmartCrop,
    addToQueue,
    processQueue
  }
}

export default useImageProcessorPro
