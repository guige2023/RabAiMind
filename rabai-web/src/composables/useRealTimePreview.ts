// Real-time Preview - 实时预览编辑
import { ref, computed, watch, reactive } from 'vue'

export interface PreviewElement {
  id: string
  type: 'text' | 'image' | 'shape' | 'chart' | 'table' | 'video'
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  visible: boolean
  locked: boolean
  data: Record<string, any>
  style: Record<string, any>
}

export interface PreviewSlide {
  id: string
  index: number
  elements: PreviewElement[]
  background: string
  backgroundImage?: string
  transition: string
  duration: number
}

export interface PreviewViewport {
  width: number
  height: number
  scale: number
  rotation: number
}

export interface UndoState {
  slides: PreviewSlide[]
  currentSlideId: string
  viewport: PreviewViewport
}

export interface PreviewOptions {
  showGrid: boolean
  snapToGrid: boolean
  gridSize: number
  showRulers: boolean
  showGuides: boolean
  enableLiveUpdate: boolean
  autoSave: boolean
}

export function useRealTimePreview() {
  // 幻灯片列表
  const slides = ref<PreviewSlide[]>([])

  // 当前幻灯片索引
  const currentSlideIndex = ref(0)

  // 视口配置
  const viewport = reactive<PreviewViewport>({
    width: 1920,
    height: 1080,
    scale: 0.5,
    rotation: 0
  })

  // 预览选项
  const options = reactive<PreviewOptions>({
    showGrid: true,
    snapToGrid: true,
    gridSize: 20,
    showRulers: true,
    showGuides: false,
    enableLiveUpdate: true,
    autoSave: true
  })

  // 选中的元素
  const selectedElements = ref<Set<string>>(new Set())

  // 拖拽状态
  const dragState = reactive({
    isDragging: false,
    isResizing: false,
    isRotating: false,
    startX: 0,
    startY: 0,
    startElementX: 0,
    startElementY: 0,
    startWidth: 0,
    startHeight: 0,
    resizeHandle: '',
    elementId: ''
  })

  // 剪贴板
  const clipboard = ref<PreviewElement[]>([])

  // 撤销/重做栈
  const undoStack = ref<UndoState[]>([])
  const redoStack = ref<UndoState[]>([])
  const maxUndoSteps = 50

  // 历史记录指针
  const historyIndex = ref(-1)

  // 缩放级别预设
  const zoomPresets = [0.1, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4]

  // 实时更新状态
  const isUpdating = ref(false)
  const lastUpdateTime = ref(0)

  // 初始化示例幻灯片
  const initSampleSlides = () => {
    slides.value = [
      {
        id: 'slide_1',
        index: 0,
        elements: [
          {
            id: 'el_1',
            type: 'text',
            x: 100,
            y: 80,
            width: 800,
            height: 120,
            rotation: 0,
            opacity: 1,
            visible: true,
            locked: false,
            data: { content: '欢迎使用 RabAiMind', fontSize: 72, fontWeight: 'bold' },
            style: { color: '#1e40af', fontFamily: 'noto-sans-sc' }
          },
          {
            id: 'el_2',
            type: 'text',
            x: 100,
            y: 220,
            width: 600,
            height: 60,
            rotation: 0,
            opacity: 1,
            visible: true,
            locked: false,
            data: { content: 'AI驱动的智能PPT生成平台', fontSize: 32 },
            style: { color: '#64748b' }
          }
        ],
        background: '#ffffff',
        transition: 'fade',
        duration: 500
      },
      {
        id: 'slide_2',
        index: 1,
        elements: [
          {
            id: 'el_3',
            type: 'text',
            x: 100,
            y: 80,
            width: 700,
            height: 80,
            rotation: 0,
            opacity: 1,
            visible: true,
            locked: false,
            data: { content: '核心功能', fontSize: 56, fontWeight: 'bold' },
            style: { color: '#1e293b' }
          },
          {
            id: 'el_4',
            type: 'shape',
            x: 100,
            y: 200,
            width: 300,
            height: 200,
            rotation: 0,
            opacity: 1,
            visible: true,
            locked: false,
            data: { shapeType: 'rect', fill: '#3b82f6' },
            style: {}
          },
          {
            id: 'el_5',
            type: 'text',
            x: 120,
            y: 220,
            width: 260,
            height: 40,
            rotation: 0,
            opacity: 1,
            visible: true,
            locked: false,
            data: { content: 'AI智能生成', fontSize: 24, fontWeight: 'bold' },
            style: { color: '#ffffff' }
          }
        ],
        background: '#f8fafc',
        transition: 'slide',
        duration: 500
      }
    ]
    currentSlideIndex.value = 0
  }

  // 获取当前幻灯片
  const currentSlide = computed(() =>
    slides.value[currentSlideIndex.value] || null
  )

  // 获取选中的元素
  const selectedElementsList = computed(() => {
    if (!currentSlide.value) return []
    return currentSlide.value.elements.filter(el => selectedElements.value.has(el.id))
  })

  // 保存状态到历史
  const saveState = () => {
    const state: UndoState = {
      slides: JSON.parse(JSON.stringify(slides.value)),
      currentSlideId: slides.value[currentSlideIndex.value]?.id || '',
      viewport: { ...viewport }
    }

    // 移除当前指针之后的所有状态
    if (historyIndex.value < undoStack.value.length - 1) {
      undoStack.value = undoStack.value.slice(0, historyIndex.value + 1)
    }

    undoStack.value.push(state)
    historyIndex.value = undoStack.value.length - 1

    // 限制栈大小
    if (undoStack.value.length > maxUndoSteps) {
      undoStack.value.shift()
      historyIndex.value--
    }

    // 清空重做栈
    redoStack.value = []
  }

  // 撤销
  const undo = () => {
    if (historyIndex.value > 0) {
      historyIndex.value--
      const state = undoStack.value[historyIndex.value]
      restoreState(state)
    }
  }

  // 重做
  const redo = () => {
    if (historyIndex.value < undoStack.value.length - 1) {
      historyIndex.value++
      const state = undoStack.value[historyIndex.value]
      restoreState(state)
    }
  }

  // 恢复状态
  const restoreState = (state: UndoState) => {
    slides.value = JSON.parse(JSON.stringify(state.slides))
    const slideIndex = slides.value.findIndex(s => s.id === state.currentSlideId)
    currentSlideIndex.value = slideIndex >= 0 ? slideIndex : 0
    Object.assign(viewport, state.viewport)
  }

  // 可撤销/重做
  const canUndo = computed(() => historyIndex.value > 0)
  const canRedo = computed(() => historyIndex.value < undoStack.value.length - 1)

  // 添加元素
  const addElement = (element: Omit<PreviewElement, 'id'>) => {
    if (!currentSlide.value) return null

    saveState()

    const newElement: PreviewElement = {
      ...element,
      id: `el_${Date.now()}`
    }

    currentSlide.value.elements.push(newElement)
    selectElement(newElement.id)

    return newElement
  }

  // 删除元素
  const deleteElement = (elementId: string) => {
    if (!currentSlide.value) return

    saveState()

    const index = currentSlide.value.elements.findIndex(el => el.id === elementId)
    if (index > -1) {
      currentSlide.value.elements.splice(index, 1)
      selectedElements.value.delete(elementId)
    }
  }

  // 删除选中的元素
  const deleteSelected = () => {
    if (!currentSlide.value || selectedElements.value.size === 0) return

    saveState()

    currentSlide.value.elements = currentSlide.value.elements.filter(
      el => !selectedElements.value.has(el.id)
    )
    selectedElements.value.clear()
  }

  // 选择元素
  const selectElement = (elementId: string, addToSelection = false) => {
    if (!addToSelection) {
      selectedElements.value.clear()
    }
    selectedElements.value.add(elementId)
  }

  // 取消选择
  const clearSelection = () => {
    selectedElements.value.clear()
  }

  // 全选
  const selectAll = () => {
    if (!currentSlide.value) return
    currentSlide.value.elements.forEach(el => selectedElements.value.add(el.id))
  }

  // 更新元素
  const updateElement = (elementId: string, updates: Partial<PreviewElement>) => {
    if (!currentSlide.value) return

    const element = currentSlide.value.elements.find(el => el.id === elementId)
    if (element) {
      if (options.enableLiveUpdate) {
        Object.assign(element, updates)
        lastUpdateTime.value = Date.now()
      } else {
        saveState()
        Object.assign(element, updates)
      }
    }
  }

  // 批量更新元素
  const batchUpdateElements = (updates: Array<{ id: string; data: Partial<PreviewElement> }>) => {
    saveState()

    updates.forEach(({ id, data }) => {
      const element = currentSlide.value?.elements.find(el => el.id === id)
      if (element) {
        Object.assign(element, data)
      }
    })
  }

  // 移动元素
  const moveElement = (elementId: string, deltaX: number, deltaY: number) => {
    const element = currentSlide.value?.elements.find(el => el.id === elementId)
    if (!element || element.locked) return

    let newX = element.x + deltaX
    let newY = element.y + deltaY

    // 网格吸附
    if (options.snapToGrid) {
      newX = Math.round(newX / options.gridSize) * options.gridSize
      newY = Math.round(newY / options.gridSize) * options.gridSize
    }

    updateElement(elementId, { x: newX, y: newY })
  }

  // 调整元素大小
  const resizeElement = (elementId: string, width: number, height: number) => {
    const element = currentSlide.value?.elements.find(el => el.id === elementId)
    if (!element || element.locked) return

    updateElement(elementId, { width, height })
  }

  // 旋转元素
  const rotateElement = (elementId: string, rotation: number) => {
    const element = currentSlide.value?.elements.find(el => el.id === elementId)
    if (!element || element.locked) return

    updateElement(elementId, { rotation })
  }

  // 复制元素
  const copyElements = () => {
    if (!currentSlide.value || selectedElements.value.size === 0) return

    clipboard.value = currentSlide.value.elements.filter(
      el => selectedElements.value.has(el.id)
    )
  }

  // 粘贴元素
  const pasteElements = () => {
    if (!currentSlide.value || clipboard.value.length === 0) return

    saveState()

    const newElements = clipboard.value.map(el => ({
      ...el,
      id: `el_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      x: el.x + 20,
      y: el.y + 20
    }))

    currentSlide.value.elements.push(...newElements)
    selectedElements.value.clear()
    newElements.forEach(el => selectedElements.value.add(el.id))
  }

  // 切换元素可见性
  const toggleVisibility = (elementId: string) => {
    const element = currentSlide.value?.elements.find(el => el.id === elementId)
    if (element) {
      updateElement(elementId, { visible: !element.visible })
    }
  }

  // 切换元素锁定
  const toggleLock = (elementId: string) => {
    const element = currentSlide.value?.elements.find(el => el.id === elementId)
    if (element) {
      updateElement(elementId, { locked: !element.locked })
    }
  }

  // 添加幻灯片
  const addSlide = (afterIndex?: number): PreviewSlide => {
    const insertIndex = afterIndex !== undefined ? afterIndex + 1 : slides.value.length

    const newSlide: PreviewSlide = {
      id: `slide_${Date.now()}`,
      index: insertIndex,
      elements: [],
      background: '#ffffff',
      transition: 'fade',
      duration: 500
    }

    slides.value.splice(insertIndex, 0, newSlide)

    // 更新索引
    slides.value.forEach((s, i) => s.index = i)

    currentSlideIndex.value = insertIndex
    saveState()

    return newSlide
  }

  // 删除幻灯片
  const deleteSlide = (slideId: string) => {
    const index = slides.value.findIndex(s => s.id === slideId)
    if (index > -1 && slides.value.length > 1) {
      slides.value.splice(index, 1)
      slides.value.forEach((s, i) => s.index = i)

      if (currentSlideIndex.value >= slides.value.length) {
        currentSlideIndex.value = slides.value.length - 1
      }
      saveState()
    }
  }

  // 切换幻灯片
  const goToSlide = (index: number) => {
    if (index >= 0 && index < slides.value.length) {
      currentSlideIndex.value = index
      clearSelection()
    }
  }

  // 上一张/下一张
  const nextSlide = () => {
    if (currentSlideIndex.value < slides.value.length - 1) {
      goToSlide(currentSlideIndex.value + 1)
    }
  }

  const prevSlide = () => {
    if (currentSlideIndex.value > 0) {
      goToSlide(currentSlideIndex.value - 1)
    }
  }

  // 设置缩放
  const setZoom = (scale: number) => {
    viewport.scale = Math.max(0.1, Math.min(4, scale))
  }

  // 适应窗口
  const fitToWindow = (containerWidth: number, containerHeight: number) => {
    const scaleX = containerWidth / viewport.width
    const scaleY = containerHeight / viewport.height
    viewport.scale = Math.min(scaleX, scaleY) * 0.9
  }

  // 实际显示尺寸
  const displaySize = computed(() => ({
    width: viewport.width * viewport.scale,
    height: viewport.height * viewport.scale
  }))

  // 获取元素边界
  const getSelectionBounds = () => {
    if (selectedElementsList.value.length === 0) return null

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

    selectedElementsList.value.forEach(el => {
      minX = Math.min(minX, el.x)
      minY = Math.min(minY, el.y)
      maxX = Math.max(maxX, el.x + el.width)
      maxY = Math.max(maxY, el.y + el.height)
    })

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    }
  }

  // 对齐选中的元素
  const alignElements = (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (!currentSlide.value || selectedElementsList.value.length < 2) return

    const bounds = getSelectionBounds()
    if (!bounds) return

    saveState()

    selectedElementsList.value.forEach(el => {
      switch (alignment) {
        case 'left':
          el.x = bounds.x
          break
        case 'center':
          el.x = bounds.x + (bounds.width - el.width) / 2
          break
        case 'right':
          el.x = bounds.x + bounds.width - el.width
          break
        case 'top':
          el.y = bounds.y
          break
        case 'middle':
          el.y = bounds.y + (bounds.height - el.height) / 2
          break
        case 'bottom':
          el.y = bounds.y + bounds.height - el.height
          break
      }
    })
  }

  // 分布选中的元素
  const distributeElements = (direction: 'horizontal' | 'vertical') => {
    if (!currentSlide.value || selectedElementsList.value.length < 3) return

    const sorted = [...selectedElementsList.value].sort((a, b) =>
      direction === 'horizontal' ? a.x - b.x : a.y - b.y
    )

    const first = sorted[0]
    const last = sorted[sorted.length - 1]

    const totalSpace = direction === 'horizontal'
      ? (last.x + last.width) - first.x
      : (last.y + last.height) - first.y

    const totalElementSize = sorted.reduce((sum, el) =>
      sum + (direction === 'horizontal' ? el.width : el.height), 0
    )

    const gap = (totalSpace - totalElementSize) / (sorted.length - 1)

    saveState()

    let currentPos = direction === 'horizontal' ? first.x + first.width + gap : first.y + first.height + gap

    sorted.slice(1, -1).forEach(el => {
      if (direction === 'horizontal') {
        el.x = currentPos
        currentPos += el.width + gap
      } else {
        el.y = currentPos
        currentPos += el.height + gap
      }
    })
  }

  // 组合元素
  const groupElements = () => {
    // 简化实现：选中多个元素时，可以标记为组合
    if (selectedElementsList.value.length < 2) return null
    // 返回组合ID
    return `group_${Date.now()}`
  }

  // 取消组合
  const ungroupElements = () => {
    // 实现取消组合逻辑
  }

  // 导出JSON
  const exportJSON = computed(() => JSON.stringify({
    slides: slides.value,
    viewport: { ...viewport },
    options: { ...options }
  }, null, 2))

  // 统计信息
  const stats = computed(() => ({
    totalSlides: slides.value.length,
    currentSlide: currentSlideIndex.value + 1,
    totalElements: slides.value.reduce((sum, s) => sum + s.elements.length, 0),
    selectedCount: selectedElements.value.size,
    canUndo: canUndo.value,
    canRedo: canRedo.value,
    zoom: Math.round(viewport.scale * 100)
  }))

  return {
    // 数据
    slides,
    currentSlideIndex,
    currentSlide,
    viewport,
    options,
    selectedElements,
    selectedElementsList,

    // 计算属性
    displaySize,
    exportJSON,
    stats,
    canUndo,
    canRedo,

    // 初始化
    initSampleSlides,

    // 幻灯片操作
    addSlide,
    deleteSlide,
    goToSlide,
    nextSlide,
    prevSlide,

    // 元素操作
    addElement,
    deleteElement,
    deleteSelected,
    updateElement,
    batchUpdateElements,
    moveElement,
    resizeElement,
    rotateElement,

    // 选择操作
    selectElement,
    clearSelection,
    selectAll,

    // 可见性/锁定
    toggleVisibility,
    toggleLock,

    // 剪贴板
    copyElements,
    pasteElements,

    // 撤销/重做
    undo,
    redo,

    // 缩放
    setZoom,
    fitToWindow,

    // 对齐
    alignElements,
    distributeElements,

    // 组合
    groupElements,
    ungroupElements
  }
}

export default useRealTimePreview
