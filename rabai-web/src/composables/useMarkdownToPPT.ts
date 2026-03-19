// Markdown to PPT Converter - Markdown转PPT
import { ref, computed } from 'vue'

export interface MarkdownSlide {
  id: string
  level: number
  content: string
  type: 'title' | 'subtitle' | 'content' | 'bullet' | 'code' | 'image' | 'quote' | 'table'
  children?: MarkdownSlide[]
}

export interface MarkdownConfig {
  theme: string
  fontSize: number
  layout: 'default' | 'compact' | 'wide'
  showCode: boolean
  codeTheme: string
}

export interface ParseResult {
  slides: MarkdownSlide[]
  metadata: Record<string, any>
}

export function useMarkdownToPPT() {
  // Markdown内容
  const markdown = ref('')

  // 配置
  const config = ref<MarkdownConfig>({
    theme: 'default',
    fontSize: 24,
    layout: 'default',
    showCode: true,
    codeTheme: 'github'
  })

  // 解析结果
  const parsedSlides = ref<MarkdownSlide[]>([])

  // 解析Markdown
  const parse = (md: string): ParseResult => {
    markdown.value = md
    const lines = md.split('\n')
    const slides: MarkdownSlide[] = []
    let currentSlide: MarkdownSlide | null = null
    let slideContent: string[] = []
    let metadata: Record<string, any> = {}

    // 解析元数据
    const metadataMatch = md.match(/^---\n([\s\S]*?)\n---/)
    if (metadataMatch) {
      metadataMatch[1].split('\n').forEach(line => {
        const [key, value] = line.split(':').map(s => s.trim())
        if (key && value) {
          metadata[key] = value
        }
      })
    }

    // 解析幻灯片
    const processSlideContent = (content: string[]): MarkdownSlide[] => {
      const elements: MarkdownSlide[] = []

      content.forEach((line, index) => {
        const trimmed = line.trim()
        if (!trimmed) return

        // 标题检测
        if (trimmed.startsWith('# ')) {
          elements.push({
            id: `slide_${slides.length}_${index}`,
            level: 1,
            content: trimmed.substring(2).trim(),
            type: 'title'
          })
        } else if (trimmed.startsWith('## ')) {
          elements.push({
            id: `slide_${slides.length}_${index}`,
            level: 2,
            content: trimmed.substring(3).trim(),
            type: 'subtitle'
          })
        } else if (trimmed.startsWith('### ')) {
          elements.push({
            id: `slide_${slides.length}_${index}`,
            level: 3,
            content: trimmed.substring(4).trim(),
            type: 'content'
          })
        }
        // 列表项
        else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          elements.push({
            id: `slide_${slides.length}_${index}`,
            level: 0,
            content: trimmed.substring(2).trim(),
            type: 'bullet'
          })
        }
        // 代码块
        else if (trimmed.startsWith('```')) {
          elements.push({
            id: `slide_${slides.length}_${index}`,
            level: 0,
            content: trimmed.replace(/```\w*/g, '').trim(),
            type: 'code'
          })
        }
        // 图片
        else if (trimmed.startsWith('![')) {
          const urlMatch = trimmed.match(/!\[([^\]]*)\]\(([^)]+)\)/)
          if (urlMatch) {
            elements.push({
              id: `slide_${slides.length}_${index}`,
              level: 0,
              content: urlMatch[2],
              type: 'image'
            })
          }
        }
        // 引用
        else if (trimmed.startsWith('> ')) {
          elements.push({
            id: `slide_${slides.length}_${index}`,
            level: 0,
            content: trimmed.substring(2).trim(),
            type: 'quote'
          })
        }
        // 表格
        else if (trimmed.includes('|')) {
          elements.push({
            id: `slide_${slides.length}_${index}`,
            level: 0,
            content: trimmed,
            type: 'table'
          })
        }
        // 普通文本
        else {
          elements.push({
            id: `slide_${slides.length}_${index}`,
            level: 0,
            content: trimmed,
            type: 'content'
          })
        }
      })

      return elements
    }

    // 分割幻灯片 (--- 或 ***)
    const slideLines: string[][] = [[]]
    let slideIndex = 0

    lines.forEach(line => {
      if (line.trim() === '---' || line.trim() === '***' || line.trim() === '___') {
        slideIndex++
        slideLines.push([])
      } else if (!line.startsWith('---')) {
        slideLines[slideIndex].push(line)
      }
    })

    // 处理每个幻灯片
    slideLines.forEach((lines, index) => {
      if (lines.some(l => l.trim())) {
        const elements = processSlideContent(lines)
        const titleElement = elements.find(e => e.type === 'title')

        slides.push({
          id: `slide_${index}`,
          level: 0,
          content: titleElement?.content || `Slide ${index + 1}`,
          type: 'title',
          children: elements
        })
      }
    })

    parsedSlides.value = slides
    return { slides, metadata }
  }

  // 从URL加载Markdown
  const loadFromURL = async (url: string): Promise<ParseResult> => {
    const response = await fetch(url)
    const md = await response.text()
    return parse(md)
  }

  // 导出为HTML
  const exportToHTML = computed(() => {
    let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${config.value.theme}</title>
  <style>
    body { font-family: system-ui; margin: 0; padding: 0; }
    .slide { page-break-after: always; min-height: 100vh; padding: 40px; }
    .title { font-size: ${config.value.fontSize * 1.5}px; font-weight: bold; margin-bottom: 20px; }
    .subtitle { font-size: ${config.value.fontSize * 1.2}px; color: #666; margin-bottom: 15px; }
    .content { font-size: ${config.value.fontSize}px; line-height: 1.6; }
    .bullet { margin-left: 20px; }
    .code { background: #f5f5f5; padding: 10px; border-radius: 4px; font-family: monospace; }
    .quote { border-left: 4px solid #ddd; padding-left: 15px; font-style: italic; }
    img { max-width: 100%; }
  </style>
</head>
<body>`

    parsedSlides.value.forEach(slide => {
      html += `<div class="slide">`
      slide.children?.forEach(child => {
        switch (child.type) {
          case 'title':
            html += `<h1 class="title">${child.content}</h1>`
            break
          case 'subtitle':
            html += `<h2 class="subtitle">${child.content}</h2>`
            break
          case 'content':
            html += `<p class="content">${child.content}</p>`
            break
          case 'bullet':
            html += `<li class="bullet">${child.content}</li>`
            break
          case 'code':
            html += `<pre class="code"><code>${child.content}</code></pre>`
            break
          case 'quote':
            html += `<blockquote class="quote">${child.content}</blockquote>`
            break
          case 'image':
            html += `<img src="${child.content}" alt="">`
            break
        }
      })
      html += `</div>`
    })

    html += `</body></html>`
    return html
  })

  // 统计
  const stats = computed(() => ({
    slides: parsedSlides.value.length,
    hasTitle: parsedSlides.value.some(s => s.children?.some(c => c.type === 'title')),
    hasCode: parsedSlides.value.some(s => s.children?.some(c => c.type === 'code')),
    hasImages: parsedSlides.value.some(s => s.children?.some(c => c.type === 'image')),
    config: { ...config.value }
  }))

  return {
    markdown,
    config,
    parsedSlides,
    parse,
    loadFromURL,
    exportToHTML,
    stats
  }
}

export default useMarkdownToPPT
