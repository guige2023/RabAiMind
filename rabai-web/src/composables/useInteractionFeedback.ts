// Interaction Feedback - 交互反馈系统
import { ref, computed } from 'vue'

export interface FeedbackMessage {
  id: string
  type: 'success' | 'error' | 'warning' | 'info' | 'loading'
  title: string
  message: string
  duration?: number
  action?: {
    label: string
    handler: () => void
  }
}

export interface ToastConfig {
  position: 'top' | 'center' | 'bottom'
  maxToasts: number
}

export interface InteractionEvent {
  type: 'click' | 'hover' | 'focus' | 'input' | 'submit' | 'navigate'
  element: string
  timestamp: number
  data?: Record<string, any>
}

export function useInteractionFeedback() {
  const messages = ref<FeedbackMessage[]>([])
  const isLoading = ref(false)
  const loadingMessage = ref('')
  const interactionHistory = ref<InteractionEvent[]>([])
  const maxHistorySize = 100

  const config = ref<ToastConfig>({
    position: 'top',
    maxToasts: 5
  })

  // 显示成功提示
  const showSuccess = (title: string, message = '', duration = 3000) => {
    const id = `toast-${Date.now()}`
    messages.value.push({
      id,
      type: 'success',
      title,
      message,
      duration
    })

    if (duration > 0) {
      setTimeout(() => removeMessage(id), duration)
    }

    return id
  }

  // 显示错误提示
  const showError = (title: string, message = '', duration = 5000) => {
    const id = `toast-${Date.now()}`
    messages.value.push({
      id,
      type: 'error',
      title,
      message,
      duration
    })

    if (duration > 0) {
      setTimeout(() => removeMessage(id), duration)
    }

    return id
  }

  // 显示警告提示
  const showWarning = (title: string, message: string, duration = 4000) => {
    const id = `toast-${Date.now()}`
    messages.value.push({
      id,
      type: 'warning',
      title,
      message,
      duration
    })

    if (duration > 0) {
      setTimeout(() => removeMessage(id), duration)
    }

    return id
  }

  // 显示信息提示
  const showInfo = (title: string, message: string, duration = 3000) => {
    const id = `toast-${Date.now()}`
    messages.value.push({
      id,
      type: 'info',
      title,
      message,
      duration
    })

    if (duration > 0) {
      setTimeout(() => removeMessage(id), duration)
    }

    return id
  }

  // 显示加载状态
  const showLoading = (message = '加载中...') => {
    isLoading.value = true
    loadingMessage.value = message

    const id = `loading-${Date.now()}`
    messages.value.push({
      id,
      type: 'loading',
      title: '请稍候',
      message
    })

    return id
  }

  // 隐藏加载状态
  const hideLoading = (id?: string) => {
    isLoading.value = false
    loadingMessage.value = ''

    if (id) {
      removeMessage(id)
    } else {
      // 移除所有loading消息
      messages.value = messages.value.filter(m => m.type !== 'loading')
    }
  }

  // 带操作的消息
  const showActionMessage = (
    type: FeedbackMessage['type'],
    title: string,
    message: string,
    action: FeedbackMessage['action'],
    duration = 0
  ) => {
    const id = `toast-${Date.now()}`
    messages.value.push({
      id,
      type,
      title,
      message,
      duration,
      action
    })

    return id
  }

  // 移除消息
  const removeMessage = (id: string) => {
    messages.value = messages.value.filter(m => m.id !== id)
  }

  // 清除所有消息
  const clearMessages = () => {
    messages.value = []
  }

  // 记录交互事件
  const trackInteraction = (
    type: InteractionEvent['type'],
    element: string,
    data?: Record<string, any>
  ) => {
    const event: InteractionEvent = {
      type,
      element,
      timestamp: Date.now(),
      data
    }

    interactionHistory.value.push(event)

    // 保持历史记录在限制内
    if (interactionHistory.value.length > maxHistorySize) {
      interactionHistory.value.shift()
    }
  }

  // 获取最近的交互
  const recentInteractions = (count = 10) => {
    return interactionHistory.value.slice(-count)
  }

  // 获取特定类型的交互
  const interactionsByType = (type: InteractionEvent['type']) => {
    return interactionHistory.value.filter(e => e.type === type)
  }

  // 常用快捷方法
  const copied = () => showSuccess('已复制', '内容已复制到剪贴板')
  const saved = () => showSuccess('已保存', '您的更改已保存')
  const deleted = () => showSuccess('已删除', '内容已成功删除')
  const generated = () => showSuccess('生成完成', 'PPT已成功生成')
  const exported = () => showSuccess('导出成功', '文件已导出')
  const error = (msg: string) => showError('操作失败', msg)
  const warning = (msg: string) => showWarning('注意', msg)

  // 统计信息
  const stats = computed(() => ({
    total: messages.value.length,
    byType: messages.value.reduce((acc, m) => {
      acc[m.type] = (acc[m.type] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    interactions: interactionHistory.value.length
  }))

  // 设置toast位置
  const setPosition = (position: ToastConfig['position']) => {
    config.value.position = position
  }

  return {
    messages,
    isLoading,
    loadingMessage,
    interactionHistory,
    config,
    stats,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
    hideLoading,
    showActionMessage,
    removeMessage,
    clearMessages,
    trackInteraction,
    recentInteractions,
    interactionsByType,
    setPosition,
    // 常用快捷方法
    copied,
    saved,
    deleted,
    generated,
    exported,
    error,
    warning
  }
}

export default useInteractionFeedback
