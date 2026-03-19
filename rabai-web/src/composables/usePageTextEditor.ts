// Page Text Editor - 页面文字编辑器
import { ref, computed, watch } from 'vue'

export interface TextElement {
  id: string
  type: 'title' | 'subtitle' | 'body' | 'bullet' | 'quote' | 'caption'
  content: string
  contentEn?: string
  fontSize: number
  fontWeight: number
  color: string
  alignment: 'left' | 'center' | 'right' | 'justify'
  lineHeight: number
  letterSpacing: number
  indent?: number
  visible: boolean
}

export interface PageTextConfig {
  pageId: string
  elements: TextElement[]
  background?: string
  backgroundImage?: string
}

export interface TextStyle {
  id: string
  name: string
  nameEn: string
  type: TextElement['type']
  presets: Partial<TextElement>[]
}

export interface UndoRedoState {
  past: PageTextConfig[]
  present: PageTextConfig
  future: PageTextConfig[]
}

export function usePageTextEditor() {
  // 当前页面配置
  const currentPage = ref<PageTextConfig>({
    pageId: '',
    elements: []
  })

  // 撤销/重做
  const undoRedo = ref<UndoRedoState>({
    past: [],
    present: { pageId: '', elements: [] },
    future: []
  })

  const maxHistory = 50

  // 文本样式预设
  const textStyles = ref<TextStyle[]>([
    {
      id: 'title',
      name: '标题',
      nameEn: 'Title',
      type: 'title',
      presets: [
        { fontSize: 48, fontWeight: 700, alignment: 'center', lineHeight: 1.2 },
        { fontSize: 36, fontWeight: 600, alignment: 'left', lineHeight: 1.3 }
      ]
    },
    {
      id: 'subtitle',
      name: '副标题',
      nameEn: 'Subtitle',
      type: 'subtitle',
      presets: [
        { fontSize: 28, fontWeight: 500, alignment: 'center', lineHeight: 1.4 },
        { fontSize: 24, fontWeight: 400, alignment: 'left', lineHeight: 1.5 }
      ]
    },
    {
      id: 'body',
      name: '正文',
      nameEn: 'Body',
      type: 'body',
      presets: [
        { fontSize: 18, fontWeight: 400, alignment: 'left', lineHeight: 1.8 },
        { fontSize: 16, fontWeight: 400, alignment: 'justify', lineHeight: 2 }
      ]
    },
    {
      id: 'bullet',
      name: '列表项',
      nameEn: 'Bullet Point',
      type: 'bullet',
      presets: [
        { fontSize: 16, fontWeight: 400, alignment: 'left', lineHeight: 1.8, indent: 20 },
        { fontSize: 14, fontWeight: 400, alignment: 'left', lineHeight: 1.6, indent: 16 }
      ]
    },
    {
      id: 'quote',
      name: '引用',
      nameEn: 'Quote',
      type: 'quote',
      presets: [
        { fontSize: 20, fontWeight: 400, alignment: 'left', lineHeight: 1.8, indent: 30 },
        { fontSize: 18, fontWeight: 300, alignment: 'center', lineHeight: 1.6 }
      ]
    },
    {
      id: 'caption',
      name: '说明文字',
      nameEn: 'Caption',
      type: 'caption',
      presets: [
        { fontSize: 12, fontWeight: 400, alignment: 'center', lineHeight: 1.5 },
        { fontSize: 14, fontWeight: 300, alignment: 'left', lineHeight: 1.4 }
      ]
    }
  ])

  // 初始化页面
  const initPage = (pageId: string, elements?: TextElement[]) => {
    saveState()

    currentPage.value = {
      pageId,
      elements: elements || getDefaultElements()
    }

    undoRedo.value = {
      past: [],
      present: { ...currentPage.value },
      future: []
    }
  }

  // 获取默认元素
  const getDefaultElements = (): TextElement[] => [
    {
      id: 'title_1',
      type: 'title',
      content: '标题',
      fontSize: 48,
      fontWeight: 700,
      color: '#1f2937',
      alignment: 'center',
      lineHeight: 1.2,
      letterSpacing: 0,
      visible: true
    },
    {
      id: 'subtitle_1',
      type: 'subtitle',
      content: '副标题',
      fontSize: 28,
      fontWeight: 500,
      color: '#4b5563',
      alignment: 'center',
      lineHeight: 1.4,
      letterSpacing: 0,
      visible: true
    },
    {
      id: 'body_1',
      type: 'body',
      content: '在此输入正文内容',
      fontSize: 18,
      fontWeight: 400,
      color: '#374151',
      alignment: 'left',
      lineHeight: 1.8,
      letterSpacing: 0,
      visible: true
    }
  ]

  // 保存状态(用于撤销)
  const saveState = () => {
    const current = JSON.parse(JSON.stringify(currentPage.value))

    undoRedo.value.past.push(current)
    if (undoRedo.value.past.length > maxHistory) {
      undoRedo.value.past.shift()
    }

    undoRedo.value.present = current
    undoRedo.value.future = []
  }

  // 撤销
  const undo = () => {
    if (undoRedo.value.past.length === 0) return

    const previous = undoRedo.value.past.pop()!
    undoRedo.value.future.push(JSON.parse(JSON.stringify(undoRedo.value.present)))
    currentPage.value = previous
  }

  // 重做
  const redo = () => {
    if (undoRedo.value.future.length === 0) return

    const next = undoRedo.value.future.pop()!
    undoRedo.value.past.push(JSON.parse(JSON.stringify(undoRedo.value.present)))
    currentPage.value = next
  }

  // 添加元素
  const addElement = (type: TextElement['type'], content = '') => {
    saveState()

    const style = textStyles.value.find(s => s.type === type)
    const preset = style?.presets[0] || {}

    const element: TextElement = {
      id: `${type}_${Date.now()}`,
      type,
      content,
      fontSize: preset.fontSize || 16,
      fontWeight: preset.fontWeight || 400,
      color: preset.color || '#374151',
      alignment: preset.alignment || 'left',
      lineHeight: preset.lineHeight || 1.5,
      letterSpacing: preset.letterSpacing || 0,
      indent: preset.indent,
      visible: true
    }

    currentPage.value.elements.push(element)
    return element
  }

  // 移除元素
  const removeElement = (id: string) => {
    saveState()
    currentPage.value.elements = currentPage.value.elements.filter(e => e.id !== id)
  }

  // 更新元素
  const updateElement = (id: string, updates: Partial<TextElement>) => {
    const element = currentPage.value.elements.find(e => e.id === id)
    if (element) {
      saveState()
      Object.assign(element, updates)
    }
  }

  // 批量更新
  const batchUpdate = (updates: Array<{ id: string; changes: Partial<TextElement> }>) => {
    saveState()
    updates.forEach(({ id, changes }) => {
      const element = currentPage.value.elements.find(e => e.id === id)
      if (element) {
        Object.assign(element, changes)
      }
    })
  }

  // 应用样式预设
  const applyStylePreset = (elementId: string, styleType: TextElement['type']) => {
    const style = textStyles.value.find(s => s.type === styleType)
    if (!style) return

    const preset = style.presets[0]
    updateElement(elementId, preset)
  }

  // 设置文本内容
  const setContent = (id: string, content: string) => {
    updateElement(id, { content })
  }

  // 设置字体大小
  const setFontSize = (id: string, size: number) => {
    updateElement(id, { fontSize: Math.max(8, Math.min(200, size)) })
  }

  // 设置对齐方式
  const setAlignment = (id: string, alignment: TextElement['alignment']) => {
    updateElement(id, { alignment })
  }

  // 设置颜色
  const setColor = (id: string, color: string) => {
    updateElement(id, { color })
  }

  // 切换可见性
  const toggleVisibility = (id: string) => {
    const element = currentPage.value.elements.find(e => e.id === id)
    if (element) {
      updateElement(id, { visible: !element.visible })
    }
  }

  // 重新排序元素
  const reorderElements = (fromIndex: number, toIndex: number) => {
    saveState()
    const [removed] = currentPage.value.elements.splice(fromIndex, 1)
    currentPage.value.elements.splice(toIndex, 0, removed)
  }

  // 获取元素
  const getElement = (id: string) => {
    return currentPage.value.elements.find(e => e.id === id)
  }

  // 获取某类型的元素
  const getElementsByType = (type: TextElement['type']) => {
    return currentPage.value.elements.filter(e => e.type === type)
  }

  // 验证
  const validate = () => {
    const warnings: string[] = []

    const titles = getElementsByType('title')
    if (titles.length === 0) {
      warnings.push('缺少标题')
    }

    const emptyElements = currentPage.value.elements.filter(e => !e.content.trim())
    if (emptyElements.length > 0) {
      warnings.push(`${emptyElements.length}个元素内容为空`)
    }

    return warnings
  }

  // 统计
  const stats = computed(() => ({
    elements: currentPage.value.elements.length,
    types: {
      title: currentPage.value.elements.filter(e => e.type === 'title').length,
      subtitle: currentPage.value.elements.filter(e => e.type === 'subtitle').length,
      body: currentPage.value.elements.filter(e => e.type === 'body').length,
      bullet: currentPage.value.elements.filter(e => e.type === 'bullet').length,
      quote: currentPage.value.elements.filter(e => e.type === 'quote').length,
      caption: currentPage.value.elements.filter(e => e.type === 'caption').length
    },
    canUndo: undoRedo.value.past.length > 0,
    canRedo: undoRedo.value.future.length > 0,
    validation: validate()
  }))

  return {
    // 页面
    currentPage,
    initPage,
    // 元素
    elements: computed(() => currentPage.value.elements),
    addElement,
    removeElement,
    updateElement,
    batchUpdate,
    getElement,
    getElementsByType,
    // 样式
    textStyles,
    applyStylePreset,
    // 内容
    setContent,
    setFontSize,
    setAlignment,
    setColor,
    toggleVisibility,
    // 排序
    reorderElements,
    // 撤销/重做
    undo,
    redo,
    // 验证
    validate,
    // 统计
    stats
  }
}

export default usePageTextEditor
