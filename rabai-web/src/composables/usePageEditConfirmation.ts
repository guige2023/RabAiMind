// Page Edit Confirmation - 每页编辑后确认保存
import { ref, computed, watch } from 'vue'

export interface PageEditState {
  pageId: string
  originalData: string
  currentData: string
  isDirty: boolean
  lastSaved: number | null
  saveStatus: 'idle' | 'saving' | 'saved' | 'error' | 'confirming'
}

export interface SaveConfig {
  autoSave: boolean
  autoSaveDelay: number
  confirmBeforeClose: boolean
  confirmBeforeSwitch: boolean
  showSaveNotification: boolean
  maxRetries: number
}

export interface PendingChange {
  pageId: string
  changeType: 'content' | 'style' | 'element' | 'background' | 'transition'
  description: string
  timestamp: number
}

export interface ConfirmationDialog {
  show: boolean
  title: string
  message: string
  type: 'save' | 'discard' | 'merge'
  onConfirm: (() => void) | null
  onCancel: (() => void) | null
}

export function usePageEditConfirmation() {
  // 页面编辑状态
  const pageStates = ref<Map<string, PageEditState>>(new Map())

  // 保存配置
  const config = ref<SaveConfig>({
    autoSave: true,
    autoSaveDelay: 2000,
    confirmBeforeClose: true,
    confirmBeforeSwitch: true,
    showSaveNotification: true,
    maxRetries: 3
  })

  // 待保存的更改
  const pendingChanges = ref<PendingChange[]>([])

  // 确认对话框
  const confirmationDialog = ref<ConfirmationDialog>({
    show: false,
    title: '',
    message: '',
    type: 'save',
    onConfirm: null,
    onCancel: null
  })

  // 保存历史
  const saveHistory = ref<Array<{ pageId: string; timestamp: number; success: boolean }>>([])

  // 自动保存定时器
  const autoSaveTimers = ref<Map<string, number>>(new Map())

  // 初始化页面状态
  const initPageState = (pageId: string, data: any) => {
    const originalData = JSON.stringify(data)

    pageStates.value.set(pageId, {
      pageId,
      originalData,
      currentData: originalData,
      isDirty: false,
      lastSaved: null,
      saveStatus: 'idle'
    })
  }

  // 检测页面是否有未保存的更改
  const hasUnsavedChanges = (pageId: string): boolean => {
    const state = pageStates.value.get(pageId)
    return state?.isDirty || false
  }

  // 检测所有页面是否有未保存的更改
  const hasAnyUnsavedChanges = (): boolean => {
    for (const state of pageStates.value.values()) {
      if (state.isDirty) return true
    }
    return false
  }

  // 记录更改
  const recordChange = (pageId: string, changeType: PendingChange['changeType'], description: string) => {
    let state = pageStates.value.get(pageId)

    // 如果状态不存在，初始化
    if (!state) {
      initPageState(pageId, {})
      state = pageStates.value.get(pageId)!
    }

    // 更新当前数据
    state.isDirty = true
    state.saveStatus = 'idle'

    // 记录待保存的更改
    pendingChanges.value.push({
      pageId,
      changeType,
      description,
      timestamp: Date.now()
    })

    // 设置自动保存
    if (config.value.autoSave) {
      scheduleAutoSave(pageId)
    }
  }

  // 安排自动保存
  const scheduleAutoSave = (pageId: string) => {
    // 清除之前的定时器
    const existingTimer = autoSaveTimers.value.get(pageId)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    // 设置新的定时器
    const timer = window.setTimeout(() => {
      savePage(pageId)
    }, config.value.autoSaveDelay)

    autoSaveTimers.value.set(pageId, timer)
  }

  // 保存页面
  const savePage = async (pageId: string): Promise<boolean> => {
    const state = pageStates.value.get(pageId)
    if (!state || !state.isDirty) return true

    state.saveStatus = 'saving'

    try {
      // 模拟保存操作
      await new Promise(resolve => setTimeout(resolve, 500))

      // 更新状态
      state.currentData = state.originalData
      state.isDirty = false
      state.lastSaved = Date.now()
      state.saveStatus = 'saved'

      // 记录到历史
      saveHistory.value.push({
        pageId,
        timestamp: Date.now(),
        success: true
      })

      // 限制历史数量
      if (saveHistory.value.length > 50) {
        saveHistory.value.shift()
      }

      // 清除待保存的更改
      pendingChanges.value = pendingChanges.value.filter(p => p.pageId !== pageId)

      return true
    } catch (error) {
      state.saveStatus = 'error'

      saveHistory.value.push({
        pageId,
        timestamp: Date.now(),
        success: false
      })

      return false
    }
  }

  // 保存所有页面
  const saveAllPages = async (): Promise<number> => {
    let successCount = 0

    for (const state of pageStates.value.values()) {
      if (state.isDirty) {
        if (await savePage(state.pageId)) {
          successCount++
        }
      }
    }

    return successCount
  }

  // 放弃更改
  const discardChanges = (pageId: string) => {
    const state = pageStates.value.get(pageId)
    if (!state) return

    // 恢复原始数据
    state.currentData = state.originalData
    state.isDirty = false
    state.saveStatus = 'idle'

    // 清除待保存的更改
    pendingChanges.value = pendingChanges.value.filter(p => p.pageId !== pageId)
  }

  // 放弃所有更改
  const discardAllChanges = () => {
    for (const state of pageStates.value.values()) {
      discardChanges(state.pageId)
    }
  }

  // 请求确认（切换页面前）
  const confirmBeforeSwitch = (fromPageId: string, toPageId: string): Promise<boolean> => {
    const fromState = pageStates.value.get(fromPageId)

    if (!fromState?.isDirty || !config.value.confirmBeforeSwitch) {
      return Promise.resolve(true)
    }

    // 显示确认对话框
    return new Promise((resolve) => {
      showConfirmation(
        '有未保存的更改',
        '当前页面有未保存的更改。是否保存后再切换？',
        'save',
        () => {
          savePage(fromPageId).then(() => resolve(true))
        },
        () => {
          discardChanges(fromPageId)
          resolve(true)
        }
      )
    })
  }

  // 请求确认（关闭前）
  const confirmBeforeClose = (): Promise<boolean> => {
    if (!hasAnyUnsavedChanges() || !config.value.confirmBeforeClose) {
      return Promise.resolve(true)
    }

    return new Promise((resolve) => {
      showConfirmation(
        '有未保存的更改',
        '您有未保存的更改。是否保存所有更改？',
        'save',
        () => {
          saveAllPages().then(() => resolve(true))
        },
        () => {
          discardAllChanges()
          resolve(true)
        }
      )
    })
  }

  // 显示确认对话框
  const showConfirmation = (
    title: string,
    message: string,
    type: ConfirmationDialog['type'],
    onConfirm: () => void,
    onCancel: () => void
  ) => {
    confirmationDialog.value = {
      show: true,
      title,
      message,
      type,
      onConfirm,
      onCancel
    }
  }

  // 关闭确认对话框
  const closeConfirmation = () => {
    confirmationDialog.value.show = false
    confirmationDialog.value.onConfirm = null
    confirmationDialog.value.onCancel = null
  }

  // 获取页面状态
  const getPageState = (pageId: string): PageEditState | undefined =>
    pageStates.value.get(pageId)

  // 获取未保存的更改
  const getPendingChanges = (pageId?: string): PendingChange[] => {
    if (pageId) {
      return pendingChanges.value.filter(p => p.pageId === pageId)
    }
    return [...pendingChanges.value]
  }

  // 获取保存历史
  const getSaveHistory = (pageId?: string, limit = 10) => {
    let history = saveHistory.value

    if (pageId) {
      history = history.filter(h => h.pageId === pageId)
    }

    return history.slice(-limit)
  }

  // 更新配置
  const updateConfig = (updates: Partial<SaveConfig>) => {
    Object.assign(config.value, updates)
  }

  // 统计
  const stats = computed(() => ({
    totalPages: pageStates.value.size,
    dirtyPages: [...pageStates.value.values()].filter(s => s.isDirty).length,
    pendingChanges: pendingChanges.value.length,
    saveHistoryCount: saveHistory.value.length,
    autoSaveEnabled: config.value.autoSave
  }))

  return {
    pageStates,
    config,
    pendingChanges,
    confirmationDialog,
    saveHistory,
    initPageState,
    hasUnsavedChanges,
    hasAnyUnsavedChanges,
    recordChange,
    scheduleAutoSave,
    savePage,
    saveAllPages,
    discardChanges,
    discardAllChanges,
    confirmBeforeSwitch,
    confirmBeforeClose,
    showConfirmation,
    closeConfirmation,
    getPageState,
    getPendingChanges,
    getSaveHistory,
    updateConfig,
    stats
  }
}

export default usePageEditConfirmation
