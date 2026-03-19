// Editing experience optimizer composable
import { ref, computed, watch } from 'vue'

export interface EditAction {
  id: string
  name: string
  shortcut: string
  icon: string
  category: 'edit' | 'format' | 'view' | 'slide'
  description: string
}

export interface UndoRedoState {
  past: any[]
  future: any[]
}

export const defaultEditActions: EditAction[] = [
  // Edit actions
  { id: 'undo', name: '撤销', shortcut: 'Ctrl+Z', icon: '↩️', category: 'edit', description: '撤销上一步操作' },
  { id: 'redo', name: '重做', shortcut: 'Ctrl+Shift+Z', icon: '↪️', category: 'edit', description: '重做上一步操作' },
  { id: 'copy', name: '复制', shortcut: 'Ctrl+C', icon: '📋', category: 'edit', description: '复制选中内容' },
  { id: 'paste', name: '粘贴', shortcut: 'Ctrl+V', icon: '📌', category: 'edit', description: '粘贴内容' },
  { id: 'delete', name: '删除', shortcut: 'Del', icon: '🗑️', category: 'edit', description: '删除选中内容' },
  { id: 'selectAll', name: '全选', shortcut: 'Ctrl+A', icon: '☑️', category: 'edit', description: '选中所有内容' },

  // Format actions
  { id: 'bold', name: '加粗', shortcut: 'Ctrl+B', icon: '🔴', category: 'format', description: '加粗选中文字' },
  { id: 'italic', name: '斜体', shortcut: 'Ctrl+I', icon: '🔵', category: 'format', description: '斜体选中文字' },
  { id: 'underline', name: '下划线', shortcut: 'Ctrl+U', icon: '🟢', category: 'format', description: '添加下划线' },
  { id: 'highlight', name: '高亮', shortcut: 'Ctrl+H', icon: '🟡', category: 'format', description: '高亮选中文字' },
  { id: 'fontSize', name: '字号', shortcut: 'Ctrl+Shift+P', icon: '🔤', category: 'format', description: '调整字体大小' },
  { id: 'fontColor', name: '字体颜色', shortcut: 'Ctrl+Shift+C', icon: '🎨', category: 'format', description: '修改字体颜色' },

  // View actions
  { id: 'zoomIn', name: '放大', shortcut: 'Ctrl++', icon: '🔍', category: 'view', description: '放大视图' },
  { id: 'zoomOut', name: '缩小', shortcut: 'Ctrl+-', icon: '🔎', category: 'view', description: '缩小视图' },
  { id: 'fitToScreen', name: '适应屏幕', shortcut: 'Ctrl+0', icon: '📱', category: 'view', description: '适应屏幕大小' },
  { id: 'fullscreen', name: '全屏', shortcut: 'F11', icon: '🖥️', category: 'view', description: '切换全屏' },

  // Slide actions
  { id: 'newSlide', name: '新建幻灯片', shortcut: 'Ctrl+M', icon: '➕', category: 'slide', description: '插入新幻灯片' },
  { id: 'duplicateSlide', name: '复制幻灯片', shortcut: 'Ctrl+D', icon: '📑', category: 'slide', description: '复制当前幻灯片' },
  { id: 'deleteSlide', name: '删除幻灯片', shortcut: 'Ctrl+Backspace', icon: '❌', category: 'slide', description: '删除当前幻灯片' },
  { id: 'moveSlideUp', name: '上移', shortcut: 'Ctrl+↑', icon: '⬆️', category: 'slide', description: '将幻灯片上移' },
  { id: 'moveSlideDown', name: '下移', shortcut: 'Ctrl+↓', icon: '⬇️', category: 'slide', description: '将幻灯片下移' },
  { id: 'goToFirst', name: '首页', shortcut: 'Home', icon: '⏮️', category: 'slide', description: '跳转到第一页' },
  { id: 'goToLast', name: '末页', shortcut: 'End', icon: '⏭️', category: 'slide', description: '跳转到最后一页' }
]

export function useEditingExperienceOptimizer() {
  const isEditing = ref(false)
  const currentSlide = ref(0)
  const totalSlides = ref(0)
  const zoomLevel = ref(100)
  const selectedElements = ref<string[]>([])

  // Undo/Redo state
  const undoStack = ref<any[]>([])
  const redoStack = ref<any[]>([])
  const maxHistorySize = 50

  // Auto-save state
  const lastSaved = ref<Date | null>(null)
  const hasUnsavedChanges = ref(false)
  const autoSaveInterval = ref<number | null>(null)

  // 编辑操作历史
  const editActions = ref<EditAction[]>(defaultEditActions)

  // 分类快捷操作
  const actionsByCategory = computed(() => {
    const categories = {
      edit: [] as EditAction[],
      format: [] as EditAction[],
      view: [] as EditAction[],
      slide: [] as EditAction[]
    }

    editActions.value.forEach(action => {
      if (categories[action.category]) {
        categories[action.category].push(action)
      }
    })

    return categories
  })

  // 撤销
  const undo = () => {
    if (undoStack.value.length > 0) {
      const state = undoStack.value.pop()
      redoStack.value.push(state)
      return state
    }
    return null
  }

  // 重做
  const redo = () => {
    if (redoStack.value.length > 0) {
      const state = redoStack.value.pop()
      undoStack.value.push(state)
      return state
    }
    return null
  }

  // 保存状态到历史
  const saveToHistory = (state: any) => {
    undoStack.value.push(state)
    if (undoStack.value.length > maxHistorySize) {
      undoStack.value.shift()
    }
    redoStack.value = [] // 清空重做栈
    hasUnsavedChanges.value = true
  }

  // 清除历史
  const clearHistory = () => {
    undoStack.value = []
    redoStack.value = []
  }

  // 缩放操作
  const zoomIn = () => {
    zoomLevel.value = Math.min(200, zoomLevel.value + 10)
  }

  const zoomOut = () => {
    zoomLevel.value = Math.max(25, zoomLevel.value - 10)
  }

  const resetZoom = () => {
    zoomLevel.value = 100
  }

  // 切换编辑模式
  const toggleEditMode = () => {
    isEditing.value = !isEditing.value
  }

  // 幻灯片导航
  const goToSlide = (index: number) => {
    if (index >= 0 && index < totalSlides.value) {
      currentSlide.value = index
    }
  }

  const nextSlide = () => {
    if (currentSlide.value < totalSlides.value - 1) {
      currentSlide.value++
    }
  }

  const prevSlide = () => {
    if (currentSlide.value > 0) {
      currentSlide.value--
    }
  }

  // 自动保存
  const startAutoSave = (intervalMs: number = 30000, saveFn: () => void) => {
    if (autoSaveInterval.value) {
      clearInterval(autoSaveInterval.value)
    }
    autoSaveInterval.value = window.setInterval(() => {
      if (hasUnsavedChanges.value) {
        saveFn()
        lastSaved.value = new Date()
        hasUnsavedChanges.value = false
      }
    }, intervalMs)
  }

  const stopAutoSave = () => {
    if (autoSaveInterval.value) {
      clearInterval(autoSaveInterval.value)
      autoSaveInterval.value = null
    }
  }

  // 标记已保存
  const markSaved = () => {
    lastSaved.value = new Date()
    hasUnsavedChanges.value = false
  }

  // 获取操作提示
  const getActionById = (id: string): EditAction | undefined => {
    return editActions.value.find(a => a.id === id)
  }

  // 搜索快捷操作
  const searchActions = (query: string): EditAction[] => {
    const lowerQuery = query.toLowerCase()
    return editActions.value.filter(action =>
      action.name.toLowerCase().includes(lowerQuery) ||
      action.shortcut.toLowerCase().includes(lowerQuery) ||
      action.description.toLowerCase().includes(lowerQuery)
    )
  }

  return {
    isEditing,
    currentSlide,
    totalSlides,
    zoomLevel,
    selectedElements,
    undoStack,
    redoStack,
    lastSaved,
    hasUnsavedChanges,
    editActions,
    actionsByCategory,
    undo,
    redo,
    saveToHistory,
    clearHistory,
    zoomIn,
    zoomOut,
    resetZoom,
    toggleEditMode,
    goToSlide,
    nextSlide,
    prevSlide,
    startAutoSave,
    stopAutoSave,
    markSaved,
    getActionById,
    searchActions
  }
}

export default useEditingExperienceOptimizer
