// Interaction Feedback Pro - 交互反馈深度优化
import { ref, computed } from 'vue'

export type FeedbackType = 'toast' | 'snackbar' | 'banner' | 'modal' | 'inline'
export type FeedbackSeverity = 'info' | 'success' | 'warning' | 'error'

export interface FeedbackItem {
  id: string
  type: FeedbackType
  severity: FeedbackSeverity
  title: string
  message: string
  duration: number
  dismissible: boolean
  action?: { label: string; handler: () => void }
}

export interface FeedbackConfig {
  maxVisible: number
  defaultDuration: number
  position: 'top' | 'bottom' | 'center'
  enableSound: boolean
  enableHaptic: boolean
}

export function useInteractionFeedbackPro() {
  // 配置
  const config = ref<FeedbackConfig>({
    maxVisible: 5,
    defaultDuration: 3000,
    position: 'top',
    enableSound: false,
    enableHaptic: true
  })

  // 队列
  const queue = ref<FeedbackItem[]>([])

  // 当前显示
  const current = ref<FeedbackItem | null>(null)

  // 历史
  const history = ref<FeedbackItem[]>([])

  // 创建反馈
  const create = (
    type: FeedbackType,
    severity: FeedbackSeverity,
    title: string,
    message: string,
    options?: Partial<FeedbackItem>
  ): FeedbackItem => {
    const item: FeedbackItem = {
      id: `fb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      title,
      message,
      duration: options?.duration ?? config.value.defaultDuration,
      dismissible: options?.dismissible ?? true,
      action: options?.action
    }

    return item
  }

  // 显示反馈
  const show = (item: FeedbackItem) => {
    // 触觉反馈
    if (config.value.enableHaptic && navigator.vibrate) {
      const patterns: Record<FeedbackSeverity, number | number[]> = {
        info: 10,
        success: [10, 50, 10],
        warning: [20, 30, 20],
        error: [30, 50, 30]
      }
      navigator.vibrate(patterns[item.severity])
    }

    if (item.type === 'toast' || item.type === 'snackbar') {
      // 限制数量
      const visible = queue.value.filter(i => i.type === 'toast' || i.type === 'snackbar')
      if (visible.length >= config.value.maxVisible) {
        queue.value.shift()
      }
      queue.value.push(item)
    } else {
      current.value = item
    }

    // 添加到历史
    history.value.unshift(item)
    if (history.value.length > 100) history.value.pop()

    // 自动关闭
    if (item.duration > 0) {
      setTimeout(() => dismiss(item.id), item.duration)
    }
  }

  // 关闭
  const dismiss = (id?: string) => {
    if (id) {
      queue.value = queue.value.filter(i => i.id !== id)
      if (current.value?.id === id) {
        current.value = null
      }
    } else {
      current.value = null
      queue.value = []
    }
  }

  // 快捷方法
  const info = (title: string, message: string) =>
    show(create('toast', 'info', title, message))

  const success = (title: string, message: string) =>
    show(create('toast', 'success', title, message))

  const warning = (title: string, message: string) =>
    show(create('toast', 'warning', title, message))

  const error = (title: string, message: string) =>
    show(create('toast', 'error', title, message, { duration: 5000 }))

  // 确认对话框
  const confirm = (title: string, message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const item = create('modal', 'info', title, message, {
        duration: 0,
        dismissible: false,
        action: {
          label: '确认',
          handler: () => { dismiss(item.id); resolve(true) }
        }
      })
      show(item)
    })
  }

  // 统计
  const stats = computed(() => ({
    total: history.value.length,
    bySeverity: history.value.reduce((acc, i) => {
      acc[i.severity] = (acc[i.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }))

  return {
    config,
    queue,
    current,
    history,
    create,
    show,
    dismiss,
    info,
    success,
    warning,
    error,
    confirm,
    stats
  }
}

export default useInteractionFeedbackPro
