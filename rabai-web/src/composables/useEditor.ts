// useEditor.ts - 编辑器统一模块
import { ref, computed } from 'vue'

export interface EditorElement {
  id: string
  type: 'text' | 'image' | 'shape' | 'chart'
  x: number
  y: number
  width: number
  height: number
}

export interface EditorSlide {
  id: string
  index: number
  elements: EditorElement[]
  background: string
}

export interface EditorConfig {
  gridEnabled: boolean
  snapToGrid: boolean
  showRulers: boolean
}

export function useEditor() {
  // 幻灯片
  const slides = ref<EditorSlide[]>([])
  const currentSlideIndex = ref(0)

  // 配置
  const config = ref<EditorConfig>({
    gridEnabled: true,
    snapToGrid: true,
    showRulers: false
  })

  // 选中的元素
  const selectedElements = ref<string[]>([])

  // 添加幻灯片
  const addSlide = () => {
    const slide: EditorSlide = {
      id: `slide_${Date.now()}`,
      index: slides.value.length,
      elements: [],
      background: '#ffffff'
    }
    slides.value.push(slide)
    return slide
  }

  // 删除幻灯片
  const deleteSlide = (id: string) => {
    const index = slides.value.findIndex(s => s.id === id)
    if (index > -1 && slides.value.length > 1) {
      slides.value.splice(index, 1)
    }
  }

  // 添加元素
  const addElement = (slideId: string, element: Omit<EditorElement, 'id'>) => {
    const slide = slides.value.find(s => s.id === slideId)
    if (slide) {
      slide.elements.push({ ...element, id: `el_${Date.now()}` })
    }
  }

  // 选择元素
  const selectElement = (id: string, multi = false) => {
    if (!multi) selectedElements.value = []
    if (!selectedElements.value.includes(id)) {
      selectedElements.value.push(id)
    }
  }

  // 更新配置
  const updateConfig = (updates: Partial<EditorConfig>) => {
    Object.assign(config.value, updates)
  }

  // 当前幻灯片
  const currentSlide = computed(() => slides.value[currentSlideIndex.value])

  return {
    slides,
    currentSlideIndex,
    currentSlide,
    config,
    selectedElements,
    addSlide,
    deleteSlide,
    addElement,
    selectElement,
    updateConfig
  }
}

export default useEditor
