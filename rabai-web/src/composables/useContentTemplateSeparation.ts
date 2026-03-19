// Content Template Separation - AI内容与模板分离架构
import { ref, computed } from 'vue'

export interface ContentData {
  id: string
  title: string
  outline: OutlineItem[]
  slides: SlideContent[]
  metadata: Record<string, any>
}

export interface OutlineItem {
  id: string
  title: string
  titleEn: string
  description?: string
  keywords: string[]
  pageCount: number
  importance: number
}

export interface SlideContent {
  id: string
  outlineId: string
  title: string
  elements: ContentElement[]
}

export interface ContentElement {
  id: string
  type: 'text' | 'image' | 'chart' | 'table' | 'shape' | 'icon'
  data: Record<string, any>
  position: { x: number; y: number }
  size: { width: number; height: number }
}

export interface TemplateData {
  id: string
  name: string
  category: string
  layout: LayoutConfig
  styles: StyleConfig
  animations: AnimationConfig[]
}

export interface LayoutConfig {
  type: string
  grid: { rows: number; cols: number }
  margins: { top: number; right: number; bottom: number; left: number }
  gap: number
}

export interface StyleConfig {
  theme: string
  fonts: { title: string; body: string }
  colors: { primary: string; secondary: string; accent: string }
  background: string
}

export interface AnimationConfig {
  id: string
  type: string
  element: string
  duration: number
  delay: number
}

export interface RenderContext {
  content: ContentData
  template: TemplateData
}

export function useContentTemplateSeparation() {
  // 内容数据
  const content = ref<ContentData | null>(null)

  // 模板数据
  const template = ref<TemplateData | null>(null)

  // 渲染上下文
  const renderContext = ref<RenderContext | null>(null)

  // 验证结果
  const validation = ref<{ valid: boolean; errors: string[]; warnings: string[] }>({
    valid: true,
    errors: [],
    warnings: []
  })

  // 设置内容
  const setContent = (data: ContentData) => {
    content.value = data
    validate()
  }

  // 设置模板
  const setTemplate = (data: TemplateData) => {
    template.value = data
    validate()
  }

  // 创建内容
  const createContent = (title: string): ContentData => {
    const newContent: ContentData = {
      id: `content_${Date.now()}`,
      title,
      outline: [],
      slides: [],
      metadata: { createdAt: Date.now() }
    }
    content.value = newContent
    return newContent
  }

  // 添加大纲项
  const addOutlineItem = (item: Omit<OutlineItem, 'id'>) => {
    if (!content.value) return

    const newItem: OutlineItem = {
      ...item,
      id: `outline_${Date.now()}`
    }
    content.value.outline.push(newItem)
    return newItem
  }

  // 添加幻灯片内容
  const addSlide = (outlineId: string, title: string): SlideContent | null => {
    if (!content.value) return null

    const slide: SlideContent = {
      id: `slide_${Date.now()}`,
      outlineId,
      title,
      elements: []
    }
    content.value.slides.push(slide)
    return slide
  }

  // 添加元素
  const addElement = (slideId: string, element: Omit<ContentElement, 'id'>): ContentElement | null => {
    if (!content.value) return null

    const slide = content.value.slides.find(s => s.id === slideId)
    if (!slide) return null

    const newElement: ContentElement = {
      ...element,
      id: `element_${Date.now()}`
    }
    slide.elements.push(newElement)
    return newElement
  }

  // 创建模板
  const createTemplate = (name: string, category: string): TemplateData => {
    const newTemplate: TemplateData = {
      id: `template_${Date.now()}`,
      name,
      category,
      layout: {
        type: 'grid',
        grid: { rows: 1, cols: 1 },
        margins: { top: 40, right: 40, bottom: 40, left: 40 },
        gap: 20
      },
      styles: {
        theme: 'default',
        fonts: { title: 'noto-sans-sc', body: 'noto-sans-sc' },
        colors: { primary: '#3b82f6', secondary: '#64748b', accent: '#10b981' },
        background: '#ffffff'
      },
      animations: []
    }
    template.value = newTemplate
    return newTemplate
  }

  // 应用样式
  const applyStyle = (style: Partial<StyleConfig>) => {
    if (!template.value) return
    Object.assign(template.value.styles, style)
  }

  // 应用布局
  const applyLayout = (layout: Partial<LayoutConfig>) => {
    if (!template.value) return
    Object.assign(template.value.layout, layout)
  }

  // 验证兼容性
  const validate = (): boolean => {
    const errors: string[] = []
    const warnings: string[] = []

    if (!content.value) {
      errors.push('缺少内容数据')
    }

    if (!template.value) {
      errors.push('缺少模板数据')
    }

    if (content.value && template.value) {
      // 检查大纲与幻灯片数量
      if (content.value.outline.length !== content.value.slides.length) {
        warnings.push('大纲项数量与幻灯片数量不匹配')
      }

      // 检查必要字段
      if (!content.value.title) {
        warnings.push('内容缺少标题')
      }

      // 检查模板完整性
      if (!template.value.layout) {
        errors.push('模板缺少布局配置')
      }

      if (!template.value.styles) {
        errors.push('模板缺少样式配置')
      }
    }

    validation.value = {
      valid: errors.length === 0,
      errors,
      warnings
    }

    return validation.value.valid
  }

  // 生成渲染上下文
  const generateContext = (): RenderContext | null => {
    if (!content.value || !template.value) return null

    renderContext.value = {
      content: content.value,
      template: template.value
    }

    return renderContext.value
  }

  // 导出组合数据
  const exportPackage = computed(() => {
    return {
      content: content.value,
      template: template.value,
      context: renderContext.value,
      exportedAt: Date.now()
    }
  })

  // 统计
  const stats = computed(() => ({
    hasContent: !!content.value,
    hasTemplate: !!template.value,
    outlineItems: content.value?.outline.length || 0,
    slides: content.value?.slides.length || 0,
    elements: content.value?.slides.reduce((sum, s) => sum + s.elements.length, 0) || 0,
    validation: validation.value,
    templateCategory: template.value?.category,
    templateName: template.value?.name
  }))

  return {
    // 内容
    content,
    setContent,
    createContent,
    addOutlineItem,
    addSlide,
    addElement,
    // 模板
    template,
    setTemplate,
    createTemplate,
    applyStyle,
    applyLayout,
    // 渲染
    renderContext,
    generateContext,
    // 验证
    validate,
    validation,
    // 导出
    exportPackage,
    // 统计
    stats
  }
}

export default useContentTemplateSeparation
