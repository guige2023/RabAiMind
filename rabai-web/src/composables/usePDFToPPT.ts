// PDF to PPT Converter - PDF转PPT智能转换
import { ref, computed } from 'vue'

export interface PDFPage {
  pageNumber: number
  width: number
  height: number
  elements: PDFElement[]
  text: string
}

export interface PDFElement {
  type: 'text' | 'image' | 'table' | 'shape'
  x: number
  y: number
  width: number
  height: number
  content: string
  style: Record<string, any>
}

export interface PDFLayout {
  type: 'title' | 'content' | 'two_column' | 'image_left' | 'image_right' | 'blank'
  title?: string
  content?: string
}

export interface PPTConversionResult {
  slides: ConvertedSlide[]
  images: string[]
  metadata: Record<string, any>
}

export interface ConvertedSlide {
  id: string
  pageNumber: number
  layout: PDFLayout
  elements: PPTElement[]
  background: string
  transition: string
}

export interface PPTElement {
  id: string
  type: 'text' | 'image' | 'shape' | 'chart' | 'table'
  x: number
  y: number
  width: number
  height: number
  content: any
  style: Record<string, any>
}

export interface ConversionOptions {
  imageQuality: 'low' | 'medium' | 'high'
  textExtraction: boolean
  tableDetection: boolean
  imageExtraction: boolean
  layoutAnalysis: boolean
  mergePages: boolean
  slideDuration: number
}

export function usePDFToPPT() {
  // PDF文件
  const pdfFile = ref<File | null>(null)

  // PDF元数据
  const pdfMetadata = ref<{
    title: string
    author: string
    pageCount: number
    creationDate: Date
  } | null>(null)

  // 解析的页面
  const pages = ref<PDFPage[]>([])

  // 转换选项
  const options = ref<ConversionOptions>({
    imageQuality: 'high',
    textExtraction: true,
    tableDetection: true,
    imageExtraction: true,
    layoutAnalysis: true,
    mergePages: false,
    slideDuration: 500
  })

  // 转换进度
  const progress = ref({
    status: 'idle' as 'idle' | 'loading' | 'analyzing' | 'converting' | 'complete' | 'error',
    currentPage: 0,
    totalPages: 0,
    message: ''
  })

  // 转换结果
  const result = ref<PPTConversionResult | null>(null)

  // 错误信息
  const error = ref<string | null>(null)

  // 加载PDF
  const loadPDF = async (file: File): Promise<boolean> => {
    progress.value = { status: 'loading', currentPage: 0, totalPages: 0, message: '加载PDF文件...' }
    pdfFile.value = file
    error.value = null

    try {
      // 模拟PDF解析
      await new Promise(r => setTimeout(r, 500))

      // 模拟提取元数据
      pdfMetadata.value = {
        title: file.name.replace('.pdf', ''),
        author: 'Unknown',
        pageCount: 10,
        creationDate: new Date()
      }

      progress.value.totalPages = pdfMetadata.value.pageCount
      progress.value.message = '解析页面...'

      // 模拟解析每一页
      const parsedPages: PDFPage[] = []
      for (let i = 1; i <= pdfMetadata.value.pageCount; i++) {
        progress.value.currentPage = i
        progress.value.message = `解析第 ${i} 页...`

        const page = await parsePage(i)
        parsedPages.push(page)

        await new Promise(r => setTimeout(r, 100))
      }

      pages.value = parsedPages
      progress.value.status = 'complete'
      progress.value.message = 'PDF加载完成'

      return true
    } catch (err) {
      error.value = (err as Error).message
      progress.value.status = 'error'
      progress.value.message = 'PDF加载失败'
      return false
    }
  }

  // 解析单页
  const parsePage = async (pageNumber: number): Promise<PDFPage> => {
    // 模拟页面解析
    const isTitlePage = pageNumber === 1
    const pageWidth = 595 // A4 width in points
    const pageHeight = 842 // A4 height in points

    const elements: PDFElement[] = []

    if (isTitlePage) {
      // 标题页
      elements.push({
        type: 'text',
        x: 50,
        y: pageHeight / 2 - 50,
        width: pageWidth - 100,
        height: 60,
        content: pdfMetadata.value?.title || 'Document Title',
        style: { fontSize: 36, fontWeight: 'bold', align: 'center' }
      })
    } else {
      // 内容页 - 模拟提取的文本
      const contentText = generateSampleText(pageNumber)

      // 模拟标题
      elements.push({
        type: 'text',
        x: 50,
        y: 50,
        width: pageWidth - 100,
        height: 30,
        content: `第 ${pageNumber} 章`,
        style: { fontSize: 24, fontWeight: 'bold' }
      })

      // 模拟正文
      elements.push({
        type: 'text',
        x: 50,
        y: 100,
        width: pageWidth - 100,
        height: pageHeight - 200,
        content: contentText,
        style: { fontSize: 12 }
      })
    }

    return {
      pageNumber,
      width: pageWidth,
      height: pageHeight,
      elements,
      text: elements.map(e => e.content).join('\n')
    }
  }

  // 生成示例文本
  const generateSampleText = (pageNumber: number): string => {
    const samples = [
      '本章介绍系统架构设计和核心功能模块。系统采用微服务架构，包含用户管理、内容生成、模板引擎等核心模块。',
      '技术选型方面，我们选择了Vue3作为前端框架，Node.js作为后端运行时，PostgreSQL作为数据存储。',
      '性能优化策略包括：CDN加速、缓存策略、懒加载、代码分割等。通过这些优化，首屏加载时间减少了60%。',
      '安全性方面，系统实现了JWT认证、XSS防护、CSRF防护等安全机制，确保用户数据安全。',
      '用户体验设计遵循极简原则，界面清晰、操作便捷。通过A/B测试持续优化转化率。'
    ]
    return samples[pageNumber % samples.length] + '\n\n' + samples[(pageNumber + 1) % samples.length]
  }

  // 分析布局
  const analyzeLayout = (page: PDFPage): PDFLayout => {
    const textElements = page.elements.filter(e => e.type === 'text')

    // 检查是否是标题页
    if (page.pageNumber === 1) {
      return { type: 'title', title: textElements[0]?.content || '' }
    }

    // 检查布局类型
    const hasImage = page.elements.some(e => e.type === 'image')
    const textLength = page.text.length

    if (textLength < 200) {
      return { type: 'content', title: textElements[0]?.content || '' }
    }

    if (hasImage) {
      const imageEl = page.elements.find(e => e.type === 'image')
      if (imageEl && imageEl.x < page.width / 2) {
        return { type: 'image_left', title: textElements[0]?.content || '' }
      }
      return { type: 'image_right', title: textElements[0]?.content || '' }
    }

    // 默认为内容布局
    return {
      type: 'content',
      title: textElements[0]?.content || '',
      content: textElements.slice(1).map(e => e.content).join('\n')
    }
  }

  // 转换为PPT
  const convert = async (): Promise<PPTConversionResult | null> => {
    if (pages.value.length === 0) {
      error.value = '请先加载PDF文件'
      return null
    }

    progress.value = { status: 'converting', currentPage: 0, totalPages: pages.value.length, message: '开始转换...' }
    error.value = null

    try {
      const slides: ConvertedSlide[] = []
      const images: string[] = []

      for (let i = 0; i < pages.value.length; i++) {
        const page = pages.value[i]
        progress.value.currentPage = i + 1
        progress.value.message = `转换第 ${i + 1} 页...`

        // 分析布局
        const layout = options.value.layoutAnalysis
          ? analyzeLayout(page)
          : { type: 'content', title: '', content: page.text }

        // 转换元素
        const elements = convertElements(page)

        // 提取图片
        if (options.value.imageExtraction) {
          const pageImages = page.elements.filter(e => e.type === 'image')
          images.push(...pageImages.map(img => img.content))
        }

        // 创建幻灯片
        const slide: ConvertedSlide = {
          id: `slide_${i + 1}`,
          pageNumber: page.pageNumber,
          layout,
          elements,
          background: '#ffffff',
          transition: 'fade'
        }

        slides.push(slide)

        await new Promise(r => setTimeout(r, 200))
      }

      // 合并页面（可选）
      if (options.value.mergePages && slides.length > 2) {
        const mergedSlides: ConvertedSlide[] = []

        for (let i = 0; i < slides.length; i += 2) {
          if (i + 1 < slides.length) {
            // 合并两页为一张
            mergedSlides.push({
              ...slides[i],
              id: `slide_merged_${i / 2 + 1}`,
              layout: { type: 'two_column' },
              elements: [...slides[i].elements, ...slides[i + 1].elements]
            })
          } else {
            mergedSlides.push(slides[i])
          }
        }

        result.value = { slides: mergedSlides, images, metadata: { originalPages: pages.value.length } }
      } else {
        result.value = { slides, images, metadata: { originalPages: pages.value.length } }
      }

      progress.value.status = 'complete'
      progress.value.message = '转换完成!'

      return result.value
    } catch (err) {
      error.value = (err as Error).message
      progress.value.status = 'error'
      progress.value.message = '转换失败'
      return null
    }
  }

  // 转换元素
  const convertElements = (page: PDFPage): PPTElement[] => {
    const result: PPTElement[] = []

    // 转换文本元素
    page.elements
      .filter(e => e.type === 'text')
      .forEach((el, index) => {
        const isTitle = index === 0

        result.push({
          id: `el_${page.pageNumber}_${index}`,
          type: 'text',
          x: (el.x / page.width) * 960,
          y: (el.y / page.height) * 540,
          width: (el.width / page.width) * 960,
          height: (el.height / page.height) * 540,
          content: el.content,
          style: {
            fontSize: isTitle ? 44 : 18,
            fontWeight: isTitle ? 'bold' : 'normal',
            color: '#1e293b',
            ...el.style
          }
        })
      })

    // 转换图片元素
    page.elements
      .filter(e => e.type === 'image')
      .forEach((el, index) => {
        result.push({
          id: `el_${page.pageNumber}_img_${index}`,
          type: 'image',
          x: (el.x / page.width) * 960,
          y: (el.y / page.height) * 540,
          width: (el.width / page.width) * 960,
          height: (el.height / page.height) * 540,
          content: el.content,
          style: {}
        })
      })

    return result
  }

  // 更新选项
  const updateOptions = (newOptions: Partial<ConversionOptions>) => {
    Object.assign(options.value, newOptions)
  }

  // 导出为JSON
  const exportJSON = computed(() => {
    if (!result.value) return ''
    return JSON.stringify(result.value, null, 2)
  })

  // 统计信息
  const stats = computed(() => ({
    pagesLoaded: pages.value.length,
    slidesGenerated: result.value?.slides.length || 0,
    imagesExtracted: result.value?.images.length || 0,
    progress: progress.value
  }))

  // 重置
  const reset = () => {
    pdfFile.value = null
    pdfMetadata.value = null
    pages.value = []
    result.value = null
    error.value = null
    progress.value = { status: 'idle', currentPage: 0, totalPages: 0, message: '' }
  }

  return {
    // 数据
    pdfFile,
    pdfMetadata,
    pages,
    options,
    progress,
    result,
    error,

    // 方法
    loadPDF,
    convert,
    updateOptions,
    reset,

    // 计算属性
    exportJSON,
    stats
  }
}

export default usePDFToPPT
