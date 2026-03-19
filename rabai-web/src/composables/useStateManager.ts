// State Manager - 统一状态管理
import { ref, computed, reactive, watch } from 'vue'

// ============================================
// 类型定义
// ============================================

export interface StateSnapshot {
  id: string
  timestamp: number
  data: Record<string, any>
  description?: string
}

export interface StateValidator {
  key: string
  validate: (value: any) => boolean
  message: string
}

export interface StateOptions {
  enableHistory: boolean
  maxHistory: number
  enablePersistence: boolean
  storageKey: string
}

// ============================================
// 核心状态管理
// ============================================

const state = reactive<Record<string, any>>({})
const history = ref<StateSnapshot[]>([])
const validators = ref<StateValidator[]>([])

const options = reactive<StateOptions>({
  enableHistory: true,
  maxHistory: 50,
  enablePersistence: false,
  storageKey: 'app_state'
})

// ============================================
// 状态操作
// ============================================

// 设置状态
const setState = (key: string, value: any, description?: string): void => {
  // 保存历史
  if (options.enableHistory) {
    saveSnapshot(description || `Set ${key}`)
  }

  // 验证
  if (!validateState(key, value)) {
    console.warn(`State validation failed for key: ${key}`)
    return
  }

  // 更新状态
  state[key] = value

  // 持久化
  if (options.enablePersistence) {
    persistState()
  }
}

// 获取状态
const getState = <T = any>(key: string, defaultValue?: T): T => {
  return state[key] ?? defaultValue ?? null as T
}

// 删除状态
const deleteState = (key: string): void => {
  if (options.enableHistory) {
    saveSnapshot(`Delete ${key}`)
  }

  delete state[key]

  if (options.enablePersistence) {
    persistState()
  }
}

// 批量更新
const batchSetState = (updates: Record<string, any>, description?: string): void => {
  if (options.enableHistory) {
    saveSnapshot(description || 'Batch update')
  }

  Object.assign(state, updates)

  if (options.enablePersistence) {
    persistState()
  }
}

// 清空状态
const clearState = (): void => {
  if (options.enableHistory) {
    saveSnapshot('Clear all state')
  }

  Object.keys(state).forEach(key => delete state[key])

  if (options.enablePersistence) {
    persistState()
  }
}

// ============================================
// 历史管理
// ============================================

// 保存快照
const saveSnapshot = (description?: string): void => {
  const snapshot: StateSnapshot = {
    id: `snapshot_${Date.now()}`,
    timestamp: Date.now(),
    data: JSON.parse(JSON.stringify(state)),
    description
  }

  history.value.unshift(snapshot)

  // 限制历史数量
  if (history.value.length > options.maxHistory) {
    history.value.pop()
  }
}

// 恢复到快照
const restoreSnapshot = (snapshotId: string): boolean => {
  const snapshot = history.value.find(s => s.id === snapshotId)
  if (!snapshot) return false

  Object.assign(state, snapshot.data)
  return true
}

// 获取历史
const getHistory = (limit = 20): StateSnapshot[] => {
  return history.value.slice(0, limit)
}

// 撤销
const undo = (): boolean => {
  if (history.value.length < 2) return false

  // 移除当前状态
  history.value.shift()

  // 恢复到上一个状态
  const previous = history.value[0]
  if (previous) {
    Object.assign(state, previous.data)
    return true
  }

  return false
}

// ============================================
// 验证器
// ============================================

// 添加验证器
const addValidator = (validator: StateValidator): void => {
  validators.value.push(validator)
}

// 验证状态
const validateState = (key: string, value: any): boolean => {
  const validator = validators.value.find(v => v.key === key)
  if (!validator) return true
  return validator.validate(value)
}

// ============================================
// 持久化
// ============================================

// 持久化状态
const persistState = (): void => {
  try {
    localStorage.setItem(options.storageKey, JSON.stringify(state))
  } catch (error) {
    console.error('Failed to persist state:', error)
  }
}

// 恢复状态
const restoreState = (): void => {
  try {
    const stored = localStorage.getItem(options.storageKey)
    if (stored) {
      const data = JSON.parse(stored)
      Object.assign(state, data)
    }
  } catch (error) {
    console.error('Failed to restore state:', error)
  }
}

// 清除持久化
const clearPersistedState = (): void => {
  localStorage.removeItem(options.storageKey)
}

// ============================================
// 配置
// ============================================

// 更新配置
const updateOptions = (updates: Partial<StateOptions>): void => {
  Object.assign(options, updates)
}

// ============================================
// 导出
// ============================================

// 导出状态
const exportState = (): string => {
  return JSON.stringify(state, null, 2)
}

// 导入状态
const importState = (data: string, merge = false): boolean => {
  try {
    const parsed = JSON.parse(data)

    if (merge) {
      Object.assign(state, parsed)
    } else {
      clearState()
      Object.assign(state, parsed)
    }

    return true
  } catch {
    return false
  }
}

// ============================================
// 统计
// ============================================

const stats = computed(() => ({
  keys: Object.keys(state).length,
  historySize: history.value.length,
  validators: validators.value.length,
  isPersisted: options.enablePersistence
}))

// ============================================
// 导出 composable
// ============================================

export function useStateManager() {
  return {
    // 状态
    state,
    setState,
    getState,
    deleteState,
    batchSetState,
    clearState,

    // 历史
    history,
    saveSnapshot,
    restoreSnapshot,
    getHistory,
    undo,

    // 验证
    validators,
    addValidator,
    validateState,

    // 持久化
    persistState,
    restoreState,
    clearPersistedState,

    // 配置
    options,
    updateOptions,

    // 导入导出
    exportState,
    importState,

    // 统计
    stats
  }
}

export default useStateManager
