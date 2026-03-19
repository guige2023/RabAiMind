// Image Processor - 图片处理优化
import { ref, computed } from 'vue'

export type ImageFormat = 'jpeg' | 'png' | 'webp' | 'avif' | 'gif'
export type ImageQuality = 'low' | 'medium' | 'high' | 'ultra'
export type ResizeMode = 'cover' | 'contain' | 'fill' | 'inside' | 'outside'

export interface ImageProcessingOptions {
  format?: ImageFormat
  quality?: ImageQuality
  width?: number
  height?: number
  resizeMode?: ResizeMode
  keepAspectRatio?: boolean
  optimizeForWeb?: boolean
  removeBackground?: boolean
  applyWatermark?: boolean
}

export interface ImageMetadata {
  width: number
  height: number
  format: string
  size: number
  hasAlpha: boolean
  colorSpace: string
}

export interface ProcessedImage {
  url: string
  blob: Blob
  metadata: ImageMetadata
  originalSize: number
  processedSize: number
  compressionRatio: number
}

export const formatOptions = [
  { id: 'jpeg', name: 'JPEG', extension: '.jpg', mimeType: 'image/jpeg', lossy: true },
  { id: 'png', name: 'PNG', extension: '.png', mimeType: 'image/png', lossy: false },
  { id: 'webp', name: 'WebP', extension: '.webp', mimeType: 'image/webp', lossy: true },
  { id: 'avif', name: 'AVIF', extension: '.avif', mimeType: 'image/avif', lossy: true },
  { id: 'gif', name: 'GIF', extension: '.gif', mimeType: 'image/gif', lossy: false }
]

export const qualityMap: Record<ImageQuality, number> = {
  low: 0.5,
  medium: 0.7,
  high: 0.85,
  ultra: 1.0
}

export function useImageProcessor() {
  // 处理状态
  const isProcessing = ref(false)
  const processingProgress = ref(0)
  const currentTask = ref<string>('')

  // 图片缓存
  const imageCache = ref<Map<string, ProcessedImage>>(new Map())

  // 加载图片
  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })
  }

  // 获取图片元数据
  const getMetadata = async (src: string): Promise<ImageMetadata> => {
    const img = await loadImage(src)

    return {
      width: img.naturalWidth,
      height: img.naturalHeight,
      format: src.split('.').pop()?.toLowerCase() || 'unknown',
      size: 0, // 需要服务器返回
      hasAlpha: img.complete && (img as any).naturalWidth !== 0,
      colorSpace: 'sRGB'
    }
  }

  // 创建Canvas
  const createCanvas = (width: number, height: number): HTMLCanvasElement => {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    return canvas
  }

  // 调整图片大小
  const resizeImage = (
    img: HTMLImageElement,
    width: number,
    height: number,
    mode: ResizeMode = 'inside'
  ): { width: number; height: number; x: number; y: number } => {
    const imgRatio = img.width / img.height
    const targetRatio = width / height

    let newWidth = width
    let newHeight = height
    let x = 0
    let y = 0

    switch (mode) {
      case 'cover':
        if (imgRatio > targetRatio) {
          newHeight = width / imgRatio
          y = (height - newHeight) / 2
        } else {
          newWidth = height * imgRatio
          x = (width - newWidth) / 2
        }
        break
      case 'contain':
        if (imgRatio > targetRatio) {
          newWidth = height * imgRatio
          x = (width - newWidth) / 2
        } else {
          newHeight = width / imgRatio
          y = (height - newHeight) / 2
        }
        break
      case 'fill':
        // 拉伸填充
        break
      case 'inside':
      default:
        if (imgRatio > targetRatio) {
          newHeight = width / imgRatio
          x = 0
          y = (height - newHeight) / 2
        } else {
          newWidth = height * imgRatio
          x = (width - newWidth) / 2
          y = 0
        }
        break
    }

    return { width: newWidth, height: newHeight, x, y }
  }

  // 处理图片
  const processImage = async (
    src: string,
    options: ImageProcessingOptions = {}
  ): Promise<ProcessedImage> => {
    isProcessing.value = true
    processingProgress.value = 0
    currentTask.value = '加载图片...'

    try {
      // 检查缓存
      const cacheKey = `${src}_${JSON.stringify(options)}`
      const cached = imageCache.value.get(cacheKey)
      if (cached) {
        return cached
      }

      // 加载图片
      processingProgress.value = 20
      const img = await loadImage(src)
      currentTask.value = '调整大小...'

      // 计算目标尺寸
      const targetWidth = options.width || img.width
      const targetHeight = options.height || img.height

      // 创建Canvas
      processingProgress.value = 40
      const canvas = createCanvas(targetWidth, targetHeight)
      const ctx = canvas.getContext('2d')!

      // 调整大小并绘制
      processingProgress.value = 60
      const { width, height, x, y } = resizeImage(
        img,
        targetWidth,
        targetHeight,
        options.resizeMode || 'inside'
      )

      // 绘制图片
      if (options.keepAspectRatio !== false) {
        ctx.drawImage(img, x, y, width, height)
      } else {
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight)
      }

      // 转换为Blob
      currentTask.value = '转换格式...'
      processingProgress.value = 80

      const format = options.format || 'jpeg'
      const quality = qualityMap[options.quality || 'high']

      const blob = await new Promise<Blob>((resolve) => {
        const mimeType = formatOptions.find(f => f.id === format)?.mimeType || 'image/jpeg'
        canvas.toBlob(
          (b) => resolve(b!),
          mimeType,
          quality
        )
      })

      processingProgress.value = 100
      currentTask.value = '完成'

      // 获取元数据
      const metadata: ImageMetadata = {
        width: targetWidth,
        height: targetHeight,
        format,
        size: blob.size,
        hasAlpha: format !== 'jpeg',
        colorSpace: 'sRGB'
      }

      const result: ProcessedImage = {
        url: URL.createObjectURL(blob),
        blob,
        metadata,
        originalSize: 0, // 需要服务器返回
        processedSize: blob.size,
        compressionRatio: 0
      }

      // 缓存结果
      imageCache.value.set(cacheKey, result)

      return result
    } finally {
      isProcessing.value = false
      processingProgress.value = 0
      currentTask.value = ''
    }
  }

  // 生成缩略图
  const generateThumbnail = async (
    src: string,
    maxSize = 200
  ): Promise<ProcessedImage> => {
    const metadata = await getMetadata(src)
    const scale = Math.min(maxSize / metadata.width, maxSize / metadata.height)

    return processImage(src, {
      width: Math.round(metadata.width * scale),
      height: Math.round(metadata.height * scale),
      quality: 'medium',
      resizeMode: 'inside'
    })
  }

  // 批量处理
  const batchProcess = async (
    sources: string[],
    options: ImageProcessingOptions = {}
  ): Promise<ProcessedImage[]> => {
    const results: ProcessedImage[] = []

    for (let i = 0; i < sources.length; i++) {
      const result = await processImage(sources[i], options)
      results.push(result)
      processingProgress.value = Math.round(((i + 1) / sources.length) * 100)
    }

    return results
  }

  // 移除背景（模拟）
  const removeBackground = async (src: string): Promise<ProcessedImage> => {
    // 这里应该调用实际的背景移除API
    // 简化实现：直接返回原图
    return processImage(src, { format: 'png' })
  }

  // 添加水印
  const addWatermark = async (
    src: string,
    text: string,
    position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' = 'bottom-right'
  ): Promise<ProcessedImage> => {
    const img = await loadImage(src)
    const canvas = createCanvas(img.width, img.height)
    const ctx = canvas.getContext('2d')!

    // 绘制原图
    ctx.drawImage(img, 0, 0)

    // 设置水印样式
    ctx.font = `${Math.max(12, img.width * 0.02)}px sans-serif`
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.textBaseline = 'bottom'

    // 计算位置
    const metrics = ctx.measureText(text)
    let x = img.width - metrics.width - 10
    let y = img.height - 10

    switch (position) {
      case 'bottom-left':
        x = 10
        break
      case 'top-right':
        y = img.height * 0.1 + 10
        break
      case 'top-left':
        x = 10
        y = img.height * 0.1 + 10
        break
    }

    // 绘制阴影
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
    ctx.shadowBlur = 4

    // 绘制水印
    ctx.fillText(text, x, y)

    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), 'image/png')
    })

    return {
      url: URL.createObjectURL(blob),
      blob,
      metadata: {
        width: img.width,
        height: img.height,
        format: 'png',
        size: blob.size,
        hasAlpha: true,
        colorSpace: 'sRGB'
      },
      originalSize: 0,
      processedSize: blob.size,
      compressionRatio: 0
    }
  }

  // 图片转Base64
  const toBase64 = async (src: string): Promise<string> => {
    const processed = await processImage(src, { format: 'jpeg', quality: 'high' })
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(processed.blob)
    })
  }

  // 清除缓存
  const clearCache = () => {
    imageCache.value.forEach(img => {
      URL.revokeObjectURL(img.url)
    })
    imageCache.value.clear()
  }

  // 推荐最佳格式
  const suggestBestFormat = (src: string): ImageFormat => {
    const ext = src.split('.').pop()?.toLowerCase()

    // 如果原图已经是WebP或AVIF，返回原格式
    if (ext === 'webp') return 'webp'
    if (ext === 'avif') return 'avif'

    // 否则返回WebP作为最佳选择
    return 'webp'
  }

  return {
    // 状态
    isProcessing,
    processingProgress,
    currentTask,
    imageCache,
    // 方法
    loadImage,
    getMetadata,
    processImage,
    generateThumbnail,
    batchProcess,
    removeBackground,
    addWatermark,
    toBase64,
    clearCache,
    suggestBestFormat,
    resizeImage
  }
}

export default useImageProcessor
