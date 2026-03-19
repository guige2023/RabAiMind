// Image Arrangement - 图片智能排列
import { ref, computed } from 'vue'

export interface ArrangedImage {
  id: string
  x: number
  y: number
  width: number
  height: number
  zIndex: number
}

export interface ArrangementConfig {
  mode: 'auto' | 'manual' | 'smart'
  fitMode: 'cover' | 'contain' | 'fill'
  spacing: number
  maxWidth: number
  maxHeight: number
}

export function useImageArrangement() {
  // 排列配置
  const config = ref<ArrangementConfig>({
    mode: 'auto',
    fitMode: 'cover',
    spacing: 10,
    maxWidth: 960,
    maxHeight: 540
  })

  // 排列结果
  const arrangedImages = ref<ArrangedImage[]>([])

  // 自动排列
  const autoArrange = (images: Array<{ id: string; width: number; height: number }>): ArrangedImage[] => {
    const { spacing, maxWidth, maxHeight } = config.value
    const result: ArrangedImage[] = []

    let currentX = spacing
    let currentY = spacing
    let rowHeight = 0

    images.forEach((img, index) => {
      // 计算缩放后的尺寸
      let width = img.width
      let height = img.height

      // 保持宽高比
      if (width > maxWidth / 2) {
        const ratio = (maxWidth / 2) / width
        width = maxWidth / 2
        height = height * ratio
      }

      // 检查是否需要换行
      if (currentX + width + spacing > maxWidth) {
        currentX = spacing
        currentY += rowHeight + spacing
        rowHeight = 0
      }

      result.push({
        id: img.id,
        x: currentX,
        y: currentY,
        width,
        height,
        zIndex: index
      })

      currentX += width + spacing
      rowHeight = Math.max(rowHeight, height)
    })

    arrangedImages.value = result
    return result
  }

  // 网格排列
  const gridArrange = (images: Array<{ id: string; width: number; height: number }>, cols = 3): ArrangedImage[] => {
    const { spacing, maxWidth, maxHeight } = config.value
    const result: ArrangedImage[] = []

    const cellWidth = (maxWidth - spacing * (cols + 1)) / cols
    const cellHeight = cellWidth * 0.75 // 4:3 比例

    images.forEach((img, index) => {
      const col = index % cols
      const row = Math.floor(index / cols)

      let width = cellWidth
      let height = cellWidth / img.width * img.height

      if (height > cellHeight) {
        height = cellHeight
        width = cellHeight / img.height * img.width
      }

      result.push({
        id: img.id,
        x: spacing + col * (cellWidth + spacing),
        y: spacing + row * (cellHeight + spacing),
        width,
        height,
        zIndex: index
      })
    })

    arrangedImages.value = result
    return result
  }

  // 堆叠排列
  const stackArrange = (images: Array<{ id: string; width: number; height: number }>): ArrangedImage[] => {
    const { spacing, maxWidth, maxHeight } = config.value
    const result: ArrangedImage[] = []

    const baseWidth = maxWidth * 0.6
    const baseHeight = maxHeight * 0.6
    const offset = 20

    images.forEach((img, index) => {
      const scale = 1 - index * 0.1

      result.push({
        id: img.id,
        x: spacing + index * offset,
        y: spacing + index * offset,
        width: baseWidth * scale,
        height: baseHeight * scale,
        zIndex: images.length - index
      })
    })

    arrangedImages.value = result
    return result
  }

  // 更新配置
  const updateConfig = (updates: Partial<ArrangementConfig>) => {
    Object.assign(config.value, updates)
  }

  const stats = computed(() => ({
    mode: config.value.mode,
    imagesCount: arrangedImages.value.length,
    spacing: config.value.spacing
  }))

  return {
    config,
    arrangedImages,
    autoArrange,
    gridArrange,
    stackArrange,
    updateConfig,
    stats
  }
}

export default useImageArrangement
