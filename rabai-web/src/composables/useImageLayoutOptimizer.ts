// Image Layout Optimization - 图片排版优化
import { ref, computed } from 'vue'

export interface ImageElement {
  id: string
  src: string
  alt: string
  x: number
  y: number
  width: number
  height: number
  aspectRatio: number
  fit: 'cover' | 'contain' | 'fill' | 'none'
}

export interface LayoutConfig {
  type: 'grid' | 'masonry' | 'carousel' | 'collage' | 'scattered'
  columns: number
  rows: number
  gap: number
  alignment: 'left' | 'center' | 'right' | 'justify'
  valign: 'top' | 'middle' | 'bottom'
}

export interface ImagePreset {
  id: string
  name: string
  nameEn: string
  description: string
  config: LayoutConfig
}

export interface OptimizationResult {
  elementId: string
  originalWidth: number
  originalHeight: number
  optimizedWidth: number
  optimizedHeight: number
  savedSpace: number
}

export function useImageLayoutOptimizer() {
  // 图片元素列表
  const images = ref<ImageElement[]>([])

  // 布局配置
  const layoutConfig = ref<LayoutConfig>({
    type: 'grid',
    columns: 3,
    rows: 2,
    gap: 16,
    alignment: 'center',
    valign: 'middle'
  })

  // 布局预设
  const presets = ref<ImagePreset[]>([
    { id: 'preset_grid_2', name: '2列网格', nameEn: '2 Columns Grid', description: '2列图片网格布局', config: { type: 'grid', columns: 2, rows: 3, gap: 16, alignment: 'center', valign: 'middle' } },
    { id: 'preset_grid_3', name: '3列网格', nameEn: '3 Columns Grid', description: '3列图片网格布局', config: { type: 'grid', columns: 3, rows: 2, gap: 16, alignment: 'center', valign: 'middle' } },
    { id: 'preset_grid_4', name: '4列网格', nameEn: '4 Columns Grid', description: '4列图片网格布局', config: { type: 'grid', columns: 4, rows: 2, gap: 12, alignment: 'center', valign: 'middle' } },
    { id: 'preset_masonry', name: '瀑布流', nameEn: 'Masonry', description: '瀑布流布局', config: { type: 'masonry', columns: 3, rows: 0, gap: 16, alignment: 'center', valign: 'top' } },
    { id: 'preset_carousel', name: '轮播图', nameEn: 'Carousel', description: '水平轮播布局', config: { type: 'carousel', columns: 1, rows: 1, gap: 0, alignment: 'center', valign: 'middle' } },
    { id: 'preset_collage', name: '拼贴画', nameEn: 'Collage', description: '创意拼贴布局', config: { type: 'collage', columns: 2, rows: 2, gap: 8, alignment: 'center', valign: 'middle' } },
    { id: 'preset_scattered', name: '散落', nameEn: 'Scattered', description: '随机散落布局', config: { type: 'scattered', columns: 0, rows: 0, gap: 20, alignment: 'left', valign: 'top' } },
    { id: 'preset_gallery', name: '画廊', nameEn: 'Gallery', description: '专业画廊布局', config: { type: 'grid', columns: 4, rows: 3, gap: 10, alignment: 'center', valign: 'middle' } }
  ])

  // 优化结果
  const optimizationResults = ref<OptimizationResult[]>([])

  // 容器尺寸
  const containerSize = ref({ width: 960, height: 540 })

  // 添加图片
  const addImage = (image: Omit<ImageElement, 'id'>): ImageElement => {
    const newImage: ImageElement = {
      ...image,
      id: `img_${Date.now()}`
    }
    images.value.push(newImage)
    return newImage
  }

  // 移除图片
  const removeImage = (imageId: string): boolean => {
    const index = images.value.findIndex(i => i.id === imageId)
    if (index > -1) {
      images.value.splice(index, 1)
      return true
    }
    return false
  }

  // 更新图片
  const updateImage = (imageId: string, updates: Partial<ImageElement>) => {
    const image = images.value.find(i => i.id === imageId)
    if (image) {
      Object.assign(image, updates)
    }
  }

  // 计算网格布局
  const calculateGridLayout = (): ImageElement[] => {
    const { columns, gap, alignment, valign } = layoutConfig.value

    if (columns <= 0) return images.value

    const cellWidth = (containerSize.value.width - gap * (columns + 1)) / columns
    const cellHeight = cellWidth // 保持正方形

    return images.value.map((img, index) => {
      const col = index % columns
      const row = Math.floor(index / columns)

      let x = gap + col * (cellWidth + gap)
      let y = gap + row * (cellHeight + gap)

      // 对齐调整
      if (alignment === 'center') {
        x += (cellWidth - img.width) / 2
      } else if (alignment === 'right') {
        x += cellWidth - img.width
      }

      // 垂直对齐
      if (valign === 'middle') {
        y += (cellHeight - img.height) / 2
      } else if (valign === 'bottom') {
        y += cellHeight - img.height
      }

      return { ...img, x, y, width: cellWidth, height: cellHeight }
    })
  }

  // 计算瀑布流布局
  const calculateMasonryLayout = (): ImageElement[] => {
    const { columns, gap } = layoutConfig.value
    const columnHeights = new Array(columns).fill(0)

    return images.value.map((img) => {
      // 找到最矮的列
      const minHeight = Math.min(...columnHeights)
      const colIndex = columnHeights.indexOf(minHeight)

      const cellWidth = (containerSize.value.width - gap * (columns + 1)) / columns
      const cellHeight = cellWidth / img.aspectRatio

      const x = gap + colIndex * (cellWidth + gap)
      const y = gap + columnHeights[colIndex]

      columnHeights[colIndex] += cellHeight + gap

      return { ...img, x, y, width: cellWidth, height: cellHeight }
    })
  }

  // 计算拼贴布局
  const calculateCollageLayout = (): ImageElement[] => {
    const { gap } = layoutConfig.value
    const halfWidth = (containerSize.value.width - gap * 3) / 2
    const halfHeight = (containerSize.value.height - gap * 3) / 2

    const layouts = [
      { x: gap, y: gap, width: halfWidth, height: halfHeight * 1.5 },
      { x: halfWidth + gap * 2, y: gap, width: halfWidth, height: halfHeight * 0.5 },
      { x: halfWidth + gap * 2, y: halfHeight * 0.5 + gap * 1.5, width: halfWidth, height: halfHeight },
      { x: gap, y: halfHeight * 1.5 + gap * 2, width: halfWidth, height: halfHeight * 0.5 }
    ]

    return images.value.map((img, index) => {
      const layout = layouts[index % layouts.length]
      return { ...img, ...layout }
    })
  }

  // 计算散落布局
  const calculateScatteredLayout = (): ImageElement[] => {
    const { gap } = layoutConfig.value

    return images.value.map((img, index) => {
      // 伪随机位置
      const seed = index * 12345
      const random = (n: number) => ((seed * 9301 + 49297) % 233280) / 233280 * n

      const x = gap + random(containerSize.value.width - img.width - gap * 2)
      const y = gap + random(containerSize.value.height - img.height - gap * 2)

      return { ...img, x, y }
    })
  }

  // 应用布局
  const applyLayout = (): ImageElement[] => {
    switch (layoutConfig.value.type) {
      case 'grid':
        return calculateGridLayout()
      case 'masonry':
        return calculateMasonryLayout()
      case 'collage':
        return calculateCollageLayout()
      case 'scattered':
        return calculateScatteredLayout()
      case 'carousel':
        return images.value
      default:
        return images.value
    }
  }

  // 优化图片尺寸
  const optimizeImageSizes = (): OptimizationResult[] => {
    const results: OptimizationResult[] = []

    images.value.forEach(img => {
      const containerArea = containerSize.value.width * containerSize.value.height
      const imgArea = img.width * img.height

      // 智能缩放
      let optimizedWidth = img.width
      let optimizedHeight = img.height

      if (img.width > containerSize.value.width) {
        const ratio = containerSize.value.width / img.width
        optimizedWidth = containerSize.value.width
        optimizedHeight = img.height * ratio
      }

      const savedSpace = ((imgArea - optimizedWidth * optimizedHeight) / imgArea * 100).toFixed(1)

      results.push({
        elementId: img.id,
        originalWidth: img.width,
        originalHeight: img.height,
        optimizedWidth,
        optimizedHeight,
        savedSpace: parseFloat(savedSpace)
      })
    })

    optimizationResults.value = results
    return results
  }

  // 应用预设
  const applyPreset = (presetId: string): boolean => {
    const preset = presets.value.find(p => p.id === presetId)
    if (preset) {
      layoutConfig.value = { ...preset.config }
      return true
    }
    return false
  }

  // 设置布局类型
  const setLayoutType = (type: LayoutConfig['type']) => {
    layoutConfig.value.type = type
  }

  // 设置列数
  const setColumns = (columns: number) => {
    layoutConfig.value.columns = Math.max(1, Math.min(10, columns))
  }

  // 设置间距
  const setGap = (gap: number) => {
    layoutConfig.value.gap = Math.max(0, Math.min(50, gap))
  }

  // 设置对齐
  const setAlignment = (alignment: LayoutConfig['alignment']) => {
    layoutConfig.value.alignment = alignment
  }

  // 设置容器尺寸
  const setContainerSize = (width: number, height: number) => {
    containerSize.value = { width, height }
  }

  // 批量添加图片
  const addImages = (imageList: Array<Omit<ImageElement, 'id'>>) => {
    return imageList.map(img => addImage(img))
  }

  // 清空图片
  const clearImages = () => {
    images.value = []
    optimizationResults.value = []
  }

  // 导出布局配置
  const exportConfig = () => {
    return JSON.stringify({
      layout: layoutConfig.value,
      images: images.value,
      container: containerSize.value
    }, null, 2)
  }

  // 统计
  const stats = computed(() => ({
    totalImages: images.value.length,
    layoutType: layoutConfig.value.type,
    columns: layoutConfig.value.columns,
    gap: layoutConfig.value.gap,
    containerWidth: containerSize.value.width,
    containerHeight: containerSize.value.height,
    optimizedCount: optimizationResults.value.length
  }))

  return {
    images,
    layoutConfig,
    presets,
    optimizationResults,
    containerSize,
    addImage,
    removeImage,
    updateImage,
    applyLayout,
    optimizeImageSizes,
    applyPreset,
    setLayoutType,
    setColumns,
    setGap,
    setAlignment,
    setContainerSize,
    addImages,
    clearImages,
    exportConfig,
    stats
  }
}

export default useImageLayoutOptimizer
