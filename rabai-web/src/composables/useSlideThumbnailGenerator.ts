// Slide Thumbnail Generator - 幻灯片缩略图生成器
import { ref, computed } from 'vue'

export interface ThumbnailConfig {
  width: number
  height: number
  scale: number
  format: 'png' | 'jpeg' | 'webp'
  quality: number
  background: string
}

export interface SlideThumbnail {
  id: string
  slideId: string
  dataUrl: string
  generatedAt: number
}

export function useSlideThumbnailGenerator() {
  // 缩略图配置
  const config = ref<ThumbnailConfig>({
    width: 320,
    height: 180,
    scale: 1,
    format: 'png',
    quality: 0.9,
    background: '#ffffff'
  })

  // 生成的缩略图
  const thumbnails = ref<SlideThumbnail[]>([])

  // 生成的缩略图映射
  const thumbnailMap = ref<Map<string, string>>(new Map())

  // 生成单个缩略图
  const generateThumbnail = async (slideId: string, elements: any[]): Promise<string> => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      throw new Error('Failed to get canvas context')
    }

    // 设置画布大小
    const scale = config.value.scale
    canvas.width = config.value.width * scale
    canvas.height = config.value.height * scale

    // 绘制背景
    ctx.fillStyle = config.value.background
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 绘制元素（简化版）
    const aspectRatio = 16 / 9
    const contentWidth = canvas.width * 0.9
    const contentHeight = contentWidth / aspectRatio
    const offsetX = (canvas.width - contentWidth) / 2
    const offsetY = (canvas.height - contentHeight) / 2

    elements.forEach((el: any) => {
      const elX = offsetX + (el.x / 960) * contentWidth
      const elY = offsetY + (el.y / 540) * contentHeight
      const elWidth = (el.width / 960) * contentWidth
      const elHeight = (el.height / 540) * contentHeight

      if (el.type === 'text') {
        ctx.fillStyle = el.style?.color || '#000000'
        ctx.font = `${el.style?.fontSize || 16}px sans-serif`
        ctx.fillText(el.content || '', elX, elY + elHeight / 2)
      } else if (el.type === 'shape') {
        ctx.fillStyle = el.data?.fill || '#cccccc'
        ctx.fillRect(elX, elY, elWidth, elHeight)
      }
    })

    // 生成Data URL
    const dataUrl = canvas.toDataURL(`image/${config.value.format}`, config.value.quality)

    // 保存
    const thumbnail: SlideThumbnail = {
      id: `thumb_${slideId}`,
      slideId,
      dataUrl,
      generatedAt: Date.now()
    }

    thumbnails.value.push(thumbnail)
    thumbnailMap.value.set(slideId, dataUrl)

    return dataUrl
  }

  // 批量生成缩略图
  const generateThumbnails = async (slides: Array<{ id: string; elements: any[] }>): Promise<void> => {
    for (const slide of slides) {
      await generateThumbnail(slide.id, slide.elements)
    }
  }

  // 获取缩略图
  const getThumbnail = (slideId: string): string | undefined => {
    return thumbnailMap.value.get(slideId)
  }

  // 更新配置
  const updateConfig = (updates: Partial<ThumbnailConfig>) => {
    Object.assign(config.value, updates)
  }

  // 清除缩略图
  const clearThumbnails = () => {
    thumbnails.value = []
    thumbnailMap.value.clear()
  }

  // 重新生成
  const regenerate = async (slideId: string, elements: any[]): Promise<string> => {
    // 删除旧的
    thumbnailMap.value.delete(slideId)
    thumbnails.value = thumbnails.value.filter(t => t.slideId !== slideId)

    // 生成新的
    return generateThumbnail(slideId, elements)
  }

  const stats = computed(() => ({
    count: thumbnails.value.length,
    width: config.value.width,
    height: config.value.height,
    format: config.value.format
  }))

  return {
    config,
    thumbnails,
    thumbnailMap,
    generateThumbnail,
    generateThumbnails,
    getThumbnail,
    updateConfig,
    clearThumbnails,
    regenerate,
    stats
  }
}

export default useSlideThumbnailGenerator
