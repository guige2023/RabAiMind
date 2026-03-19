// Batch Operations - 批量操作
import { ref, computed } from 'vue'

export type BatchAction = 'delete' | 'export' | 'duplicate' | 'move' | 'tag' | 'share' | 'archive' | 'restore'

export interface BatchOperation<T = any> {
  id: string
  type: BatchAction
  items: T[]
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  total: number
  successCount: number
  failedCount: number
  errors: Array<{ item: T; error: string }>
  startedAt?: Date
  completedAt?: Date
}

export interface BatchActionConfig {
  id: BatchAction
  name: string
  icon: string
  description: string
  color: string
  requiresConfirmation: boolean
  destructive: boolean
}

// 批量操作配置
export const batchActions: BatchActionConfig[] = [
  {
    id: 'delete',
    name: '删除',
    icon: '🗑️',
    description: '删除选中的项目',
    color: '#ff4d4f',
    requiresConfirmation: true,
    destructive: true
  },
  {
    id: 'export',
    name: '导出',
    icon: '📥',
    description: '导出选中的项目',
    color: '#1890ff',
    requiresConfirmation: false,
    destructive: false
  },
  {
    id: 'duplicate',
    name: '复制',
    icon: '📋',
    description: '复制选中的项目',
    color: '#52c41a',
    requiresConfirmation: false,
    destructive: false
  },
  {
    id: 'move',
    name: '移动',
    icon: '📁',
    description: '移动到指定位置',
    color: '#722ed1',
    requiresConfirmation: true,
    destructive: false
  },
  {
    id: 'tag',
    name: '添加标签',
    icon: '🏷️',
    description: '为项目添加标签',
    color: '#faad14',
    requiresConfirmation: false,
    destructive: false
  },
  {
    id: 'share',
    name: '分享',
    icon: '🔗',
    description: '分享选中的项目',
    color: '#13c2c2',
    requiresConfirmation: false,
    destructive: false
  },
  {
    id: 'archive',
    name: '归档',
    icon: '📦',
    description: '归档选中的项目',
    color: '#8c8c8c',
    requiresConfirmation: true,
    destructive: false
  },
  {
    id: 'restore',
    name: '恢复',
    icon: '♻️',
    description: '恢复已归档的项目',
    color: '#52c41a',
    requiresConfirmation: false,
    destructive: false
  }
]

export function useBatchOperations<T = any>() {
  const selectedItems = ref<T[]>([])
  const isBatchMode = ref(false)
  const currentOperation = ref<BatchOperation<T> | null>(null)
  const operationHistory = ref<BatchOperation<T>[]>([])

  // 是否选中
  const isSelected = (item: T): boolean => {
    return selectedItems.value.some((selected, index) => selected === item)
  }

  // 切换选中状态
  const toggleSelection = (item: T) => {
    const index = selectedItems.value.indexOf(item)
    if (index === -1) {
      selectedItems.value.push(item)
    } else {
      selectedItems.value.splice(index, 1)
    }
  }

  // 全选
  const selectAll = (items: T[]) => {
    selectedItems.value = [...items]
  }

  // 取消全选
  const clearSelection = () => {
    selectedItems.value = []
  }

  // 反选
  const invertSelection = (allItems: T[]) => {
    selectedItems.value = allItems.filter(
      item => !selectedItems.value.includes(item)
    )
  }

  // 选中范围
  const selectRange = (items: T[], start: number, end: number) => {
    const range = items.slice(start, end + 1)
    range.forEach(item => {
      if (!selectedItems.value.includes(item)) {
        selectedItems.value.push(item)
      }
    })
  }

  // 进入批量模式
  const enterBatchMode = () => {
    isBatchMode.value = true
  }

  // 退出批量模式
  const exitBatchMode = () => {
    isBatchMode.value = false
    clearSelection()
  }

  // 执行批量操作
  const executeBatch = async (
    action: BatchAction,
    items: T[],
    handler: (item: T) => Promise<{ success: boolean; error?: string }>
  ): Promise<BatchOperation<T>> => {
    const operation: BatchOperation<T> = {
      id: `batch_${Date.now()}`,
      type: action,
      items,
      status: 'processing',
      progress: 0,
      total: items.length,
      successCount: 0,
      failedCount: 0,
      errors: [],
      startedAt: new Date()
    }

    currentOperation.value = operation

    for (let i = 0; i < items.length; i++) {
      const item = items[i]

      try {
        const result = await handler(item)

        if (result.success) {
          operation.successCount++
        } else {
          operation.failedCount++
          operation.errors.push({ item, error: result.error || '未知错误' })
        }
      } catch (e: any) {
        operation.failedCount++
        operation.errors.push({ item, error: e.message })
      }

      operation.progress = Math.round(((i + 1) / items.length) * 100)
    }

    operation.status = operation.failedCount === 0 ? 'completed' : 'failed'
    operation.completedAt = new Date()

    // 添加到历史记录
    operationHistory.value.push(operation)
    currentOperation.value = null

    return operation
  }

  // 批量删除
  const batchDelete = async (
    items: T[],
    deleteHandler: (item: T) => Promise<boolean>
  ): Promise<BatchOperation<T>> => {
    return executeBatch(
      'delete',
      items,
      async (item) => {
        const success = await deleteHandler(item)
        return { success }
      }
    )
  }

  // 批量导出
  const batchExport = async (
    items: T[],
    exportHandler: (item: T) => Promise<{ success: boolean; error?: string }>
  ): Promise<BatchOperation<T>> => {
    return executeBatch('export', items, exportHandler)
  }

  // 批量复制
  const batchDuplicate = async (
    items: T[],
    duplicateHandler: (item: T) => Promise<{ success: boolean; newItem?: T; error?: string }>
  ): Promise<BatchOperation<T>> => {
    return executeBatch(
      'duplicate',
      items,
      async (item) => {
        const result = await duplicateHandler(item)
        return { success: result.success, error: result.error }
      }
    )
  }

  // 批量移动
  const batchMove = async (
    items: T[],
    targetFolder: string,
    moveHandler: (item: T, target: string) => Promise<{ success: boolean; error?: string }>
  ): Promise<BatchOperation<T>> => {
    return executeBatch(
      'move',
      items,
      async (item) => await moveHandler(item, targetFolder)
    )
  }

  // 批量添加标签
  const batchTag = async (
    items: T[],
    tags: string[],
    tagHandler: (item: T, tags: string[]) => Promise<{ success: boolean; error?: string }>
  ): Promise<BatchOperation<T>> => {
    return executeBatch(
      'tag',
      items,
      async (item) => await tagHandler(item, tags)
    )
  }

  // 批量分享
  const batchShare = async (
    items: T[],
    shareHandler: (item: T) => Promise<{ success: boolean; url?: string; error?: string }>
  ): Promise<BatchOperation<T>> => {
    return executeBatch('share', items, shareHandler)
  }

  // 取消当前操作
  const cancelOperation = () => {
    if (currentOperation.value?.status === 'processing') {
      currentOperation.value.status = 'failed'
      currentOperation.value.completedAt = new Date()
      operationHistory.value.push(currentOperation.value)
      currentOperation.value = null
    }
  }

  // 清除历史记录
  const clearHistory = () => {
    operationHistory.value = []
  }

  // 获取操作统计
  const stats = computed(() => ({
    selectedCount: selectedItems.value.length,
    isBatchMode: isBatchMode.value,
    hasOperation: !!currentOperation.value,
    operationStatus: currentOperation.value?.status,
    totalOperations: operationHistory.value.length,
    successRate: operationHistory.value.length > 0
      ? operationHistory.value.reduce((acc, op) => acc + op.successCount, 0) /
        operationHistory.value.reduce((acc, op) => acc + op.total, 0) * 100
      : 0
  }))

  return {
    // 状态
    selectedItems,
    isBatchMode,
    currentOperation,
    operationHistory,
    // 选择方法
    isSelected,
    toggleSelection,
    selectAll,
    clearSelection,
    invertSelection,
    selectRange,
    // 批量模式
    enterBatchMode,
    exitBatchMode,
    // 执行方法
    executeBatch,
    batchDelete,
    batchExport,
    batchDuplicate,
    batchMove,
    batchTag,
    batchShare,
    cancelOperation,
    clearHistory,
    // 统计
    stats
  }
}

export default useBatchOperations
