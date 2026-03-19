// Image Processing Pro - 图片处理专业版
import { ref, computed } from 'vue'

export interface ImageFilter {
  id: string
  name: string
  nameEn: string
  category: 'basic' | 'artistic' | 'professional' | 'vintage'
  operations: ImageOperation[]
}

export interface ImageOperation {
  type: 'brightness' | 'contrast' | 'saturate' | 'hueRotate' | 'grayscale' | 'sepia' | 'blur' | 'invert' | 'opacity' | 'dropShadow'
  value: number
  enabled: boolean
}

export interface ImagePreset {
  id: string
  name: string
  nameEn: string
  icon: string
  filters: ImageOperation[]
}

export interface ImageOptimization {
  quality: number
  format: 'jpeg' | 'png' | 'webp' | 'avif'
  maxWidth: number
  maxHeight: number
  progressive: boolean
}

export interface ImageCrop {
  x: number
  y: number
  width: number
  height: number
  aspectRatio?: string
}

export interface ImageWatermark {
  text?: string
  image?: string
  position: 'center' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'tiled'
  opacity: number
  fontSize: number
  color: string
}

export function useImageProcessingPro() {
  // 滤镜预设
  const filterPresets = ref<ImageFilter[]>([
    // Basic 基础
    { id: 'none', name: '原图', nameEn: 'Original', category: 'basic', operations: [] },
    { id: 'brighten', name: '提亮', nameEn: 'Brighten', category: 'basic', operations: [{ type: 'brightness', value: 120, enabled: true }] },
    { id: 'darken', name: '变暗', nameEn: 'Darken', category: 'basic', operations: [{ type: 'brightness', value: 80, enabled: true }] },
    { id: 'contrast', name: '增强对比', nameEn: 'High Contrast', category: 'basic', operations: [{ type: 'contrast', value: 140, enabled: true }] },
    { id: 'fade', name: '淡雅', nameEn: 'Fade', category: 'basic', operations: [{ type: 'contrast', value: 85, enabled: true }, { type: 'brightness', value: 110, enabled: true }, { type: 'saturate', value: 70, enabled: true }] },
    // Artistic 艺术
    { id: 'vivid', name: '鲜艳', nameEn: 'Vivid', category: 'artistic', operations: [{ type: 'saturate', value: 150, enabled: true }, { type: 'contrast', value: 120, enabled: true }] },
    { id: 'dramatic', name: '戏剧', nameEn: 'Dramatic', category: 'artistic', operations: [{ type: 'contrast', value: 150, enabled: true }, { type: 'brightness', value: 90, enabled: true }, { type: 'saturate', value: 110, enabled: true }] },
    { id: 'soft', name: '柔和', nameEn: 'Soft', category: 'artistic', operations: [{ type: 'contrast', value: 90, enabled: true }, { type: 'brightness', value: 105, enabled: true }, { type: 'saturate', value: 85, enabled: true }] },
    { id: 'dreamy', name: '梦幻', nameEn: 'Dreamy', category: 'artistic', operations: [{ type: 'brightness', value: 115, enabled: true }, { type: 'contrast', value: 85, enabled: true }, { type: 'blur', value: 1, enabled: true }] },
    { id: 'bw-strong', name: '黑白增强', nameEn: 'Strong B&W', category: 'artistic', operations: [{ type: 'grayscale', value: 100, enabled: true }, { type: 'contrast', value: 140, enabled: true }] },
    // Professional 专业
    { id: 'portrait', name: '人像', nameEn: 'Portrait', category: 'professional', operations: [{ type: 'brightness', value: 105, enabled: true }, { type: 'contrast', value: 95, enabled: true }, { type: 'saturate', value: 90, enabled: true }] },
    { id: 'landscape', name: '风景', nameEn: 'Landscape', category: 'professional', operations: [{ type: 'contrast', value: 115, enabled: true }, { type: 'saturate', value: 130, enabled: true }, { type: 'brightness', value: 105, enabled: true }] },
    { id: 'food', name: '美食', nameEn: 'Food', category: 'professional', operations: [{ type: 'saturate', value: 140, enabled: true }, { type: 'brightness', value: 108, enabled: true }, { type: 'contrast', value: 105, enabled: true }] },
    { id: 'product', name: '产品', nameEn: 'Product', category: 'professional', operations: [{ type: 'contrast', value: 125, enabled: true }, { type: 'brightness', value: 100, enabled: true }, { type: 'saturate', value: 105, enabled: true }] },
    { id: ' hdr', name: 'HDR效果', nameEn: 'HDR', category: 'professional', operations: [{ type: 'contrast', value: 130, enabled: true }, { type: 'saturate', value: 120, enabled: true }, { type: 'brightness', value: 105, enabled: true }] },
    // Vintage 复古
    { id: 'vintage', name: '复古', nameEn: 'Vintage', category: 'vintage', operations: [{ type: 'sepia', value: 40, enabled: true }, { type: 'contrast', value: 110, enabled: true }, { type: 'brightness', value: 105, enabled: true }] },
    { id: 'sepia', name: '棕褐色', nameEn: 'Sepia', category: 'vintage', operations: [{ type: 'sepia', value: 80, enabled: true }, { type: 'contrast', value: 110, enabled: true }] },
    { id: 'retro', name: '怀旧', nameEn: 'Retro', category: 'vintage', operations: [{ type: 'sepia', value: 25, enabled: true }, { type: 'contrast', value: 115, enabled: true }, { type: 'hueRotate', value: -20, enabled: true }] },
    { id: 'film', name: '胶片', nameEn: 'Film', category: 'vintage', operations: [{ type: 'contrast', value: 120, enabled: true }, { type: 'saturate', value: 85, enabled: true }, { type: 'sepia', value: 15, enabled: true }] },
    { id: 'faded', name: '褪色', nameEn: 'Faded', category: 'vintage', operations: [{ type: 'brightness', value: 115, enabled: true }, { type: 'contrast', value: 80, enabled: true }, { type: 'saturate', value: 60, enabled: true }] }
  ])

  // 当前滤镜
  const currentFilter = ref<ImageFilter>(filterPresets.value[0])

  // 自定义操作
  const customOperations = ref<ImageOperation[]>([])

  // 裁剪配置
  const cropConfig = ref<ImageCrop>({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    aspectRatio: '16:9'
  })

  // 水印配置
  const watermarkConfig = ref<ImageWatermark>({
    text: 'RabAiMind',
    position: 'bottomRight',
    opacity: 0.5,
    fontSize: 16,
    color: '#ffffff'
  })

  // 优化配置
  const optimizationConfig = ref<ImageOptimization>({
    quality: 85,
    format: 'jpeg',
    maxWidth: 1920,
    maxHeight: 1080,
    progressive: true
  })

  // 应用预设
  const applyPreset = (presetId: string) => {
    const preset = filterPresets.value.find(f => f.id === presetId)
    if (preset) {
      currentFilter.value = preset
      customOperations.value = [...preset.operations]
    }
  }

  // 添加自定义操作
  const addOperation = (operation: ImageOperation) => {
    const existing = customOperations.value.findIndex(o => o.type === operation.type)
    if (existing > -1) {
      customOperations.value[existing] = operation
    } else {
      customOperations.value.push(operation)
    }
    updateCurrentFilter()
  }

  // 移除操作
  const removeOperation = (type: ImageOperation['type']) => {
    customOperations.value = customOperations.value.filter(o => o.type !== type)
    updateCurrentFilter()
  }

  // 更新操作值
  const updateOperationValue = (type: ImageOperation['type'], value: number) => {
    const op = customOperations.value.find(o => o.type === type)
    if (op) {
      op.value = value
    }
    updateCurrentFilter()
  }

  // 切换操作启用状态
  const toggleOperation = (type: ImageOperation['type']) => {
    const op = customOperations.value.find(o => o.type === type)
    if (op) {
      op.enabled = !op.enabled
    }
    updateCurrentFilter()
  }

  // 更新当前滤镜
  const updateCurrentFilter = () => {
    currentFilter.value = {
      id: 'custom',
      name: '自定义',
      nameEn: 'Custom',
      category: 'basic',
      operations: [...customOperations.value]
    }
  }

  // 重置为原图
  const reset = () => {
    customOperations.value = []
    currentFilter.value = filterPresets.value[0]
  }

  // 生成CSS滤镜
  const generateFilterCSS = (operations?: ImageOperation[]): string => {
    const ops = operations || customOperations.value.filter(o => o.enabled)
    const filters: string[] = []

    ops.forEach(op => {
      switch (op.type) {
        case 'brightness':
          filters.push(`brightness(${op.value}%)`)
          break
        case 'contrast':
          filters.push(`contrast(${op.value}%)`)
          break
        case 'saturate':
          filters.push(`saturate(${op.value}%)`)
          break
        case 'hueRotate':
          filters.push(`hue-rotate(${op.value}deg)`)
          break
        case 'grayscale':
          filters.push(`grayscale(${op.value}%)`)
          break
        case 'sepia':
          filters.push(`sepia(${op.value}%)`)
          break
        case 'blur':
          filters.push(`blur(${op.value}px)`)
          break
        case 'invert':
          filters.push(`invert(${op.value}%)`)
          break
        case 'opacity':
          filters.push(`opacity(${op.value}%)`)
          break
      }
    })

    return filters.join(' ')
  }

  // 智能裁剪建议
  const getSmartCropSuggestions = (width: number, height: number) => {
    const ratio = width / height
    const suggestions = [
      { ratio: '1:1', name: '正方形', icon: '◻', score: 1 - Math.abs(1 - ratio) },
      { ratio: '4:3', name: '标准', icon: '▭', score: 1 - Math.abs(1.33 - ratio) },
      { ratio: '16:9', name: '宽屏', icon: '▬', score: 1 - Math.abs(1.78 - ratio) },
      { ratio: '9:16', name: '竖屏', icon: '▯', score: 1 - Math.abs(0.56 - ratio) },
      { ratio: '3:2', name: '摄影', icon: '▭', score: 1 - Math.abs(1.5 - ratio) },
      { ratio: '2:3', name: '人像', icon: '▯', score: 1 - Math.abs(0.67 - ratio) },
      { ratio: '21:9', name: '超宽', icon: '▬', score: 1 - Math.abs(2.33 - ratio) }
    ]

    return suggestions
      .map(s => ({ ...s, score: Math.round(s.score * 100) }))
      .sort((a, b) => b.score - a.score)
  }

  // 应用裁剪
  const applyCrop = (crop: Partial<ImageCrop>) => {
    Object.assign(cropConfig.value, crop)
  }

  // 应用水印
  const applyWatermark = (watermark: Partial<ImageWatermark>) => {
    Object.assign(watermarkConfig.value, watermark)
  }

  // 配置优化
  const configureOptimization = (config: Partial<ImageOptimization>) => {
    Object.assign(optimizationConfig.value, config)
  }

  // 批量应用预设
  const batchApplyPresets = (imageElements: HTMLElement[]) => {
    const css = generateFilterCSS()
    imageElements.forEach(el => {
      el.style.filter = css
    })
  }

  // 获取统计
  const stats = computed(() => ({
    presets: filterPresets.value.length,
    activeOperations: customOperations.value.filter(o => o.enabled).length,
    totalOperations: customOperations.value.length,
    currentCategory: currentFilter.value.category,
    hasCrop: cropConfig.value.width !== 100 || cropConfig.value.height !== 100,
    hasWatermark: !!watermarkConfig.value.text,
    optimizationFormat: optimizationConfig.value.format,
    optimizationQuality: optimizationConfig.value.quality
  }))

  return {
    // 滤镜预设
    filterPresets,
    currentFilter,
    applyPreset,
    // 自定义操作
    customOperations,
    addOperation,
    removeOperation,
    updateOperationValue,
    toggleOperation,
    // 生成CSS
    generateFilterCSS,
    // 裁剪
    cropConfig,
    applyCrop,
    getSmartCropSuggestions,
    // 水印
    watermarkConfig,
    applyWatermark,
    // 优化
    optimizationConfig,
    configureOptimization,
    // 批量应用
    batchApplyPresets,
    // 重置
    reset,
    // 统计
    stats
  }
}

export default useImageProcessingPro
