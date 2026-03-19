// Interaction Feedback Improver - 交互反馈改善
import { ref, computed, watch } from 'vue'

export type FeedbackType = 'toast' | 'modal' | 'banner' | 'inline' | 'sound' | 'haptic'
export type FeedbackSeverity = 'info' | 'success' | 'warning' | 'error'

export interface FeedbackItem {
  id: string
  type: FeedbackType
  severity: FeedbackSeverity
  title: string
  message: string
  duration?: number
  dismissible: boolean
  action?: { label: string; handler: () => void }
  timestamp: number
}

export interface FeedbackConfig {
  maxToasts: number
  defaultDuration: number
  position: 'top' | 'bottom' | 'center'
  enableSound: boolean
  enableHaptic: boolean
  enableAnimation: boolean
}

const defaultConfig: FeedbackConfig = {
  maxToasts: 5,
  defaultDuration: 3000,
  position: 'top',
  enableSound: false,
  enableHaptic: true,
  enableAnimation: true
}

export function useInteractionFeedbackImprover() {
  // 配置
  const config = ref<FeedbackConfig>({ ...defaultConfig })

  // 反馈队列
  const queue = ref<FeedbackItem[]>([])

  // 当前显示的反馈
  const current = ref<FeedbackItem | null>(null)

  // 历史记录
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
      action: options?.action,
      timestamp: Date.now()
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

    // 声音反馈
    if (config.value.enableSound) {
      playSound(item.severity)
    }

    // 根据类型处理
    if (item.type === 'toast') {
      // 限制toast数量
      const toasts = queue.value.filter(i => i.type === 'toast')
      if (toasts.length >= config.value.maxToasts) {
        queue.value = queue.value.filter(i => i.type !== 'toast' || i.id !== toasts[0].id)
      }
      queue.value.push(item)
    } else {
      // 其他类型立即显示
      current.value = item
    }

    // 添加到历史
    history.value.unshift(item)
    if (history.value.length > 100) history.value.pop()

    // 自动关闭
    if (item.duration && item.duration > 0) {
      setTimeout(() => dismiss(item.id), item.duration)
    }
  }

  // 关闭反馈
  const dismiss = (id?: string) => {
    if (id) {
      queue.value = queue.value.filter(i => i.id !== id)
      if (current.value?.id === id) {
        current.value = null
      }
    } else {
      // 关闭当前
      current.value = null
      // 关闭所有toast
      queue.value = []
    }
  }

  // 快捷方法
  const info = (title: string, message: string) => show(create('toast', 'info', title, message))
  const success = (title: string, message: string) => show(create('toast', 'success', title, message))
  const warning = (title: string, message: string) => show(create('toast', 'warning', title, message))
  const error = (title: string, message: string) => show(create('toast', 'error', title, message, { duration: 5000 }))

  // 确认对话框
  const confirm = (title: string, message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const item = create('modal', 'info', title, message, {
        duration: 0,
        dismissible: false,
        action: {
          label: '确认',
          handler: () => {
            dismiss(item.id)
            resolve(true)
          }
        }
      })
      show(item)
    })
  }

  // 提示对话框
  const prompt = (title: string, message: string, defaultValue = ''): Promise<string | null> => {
    return new Promise((resolve) => {
      const item = create('modal', 'info', title, message, {
        duration: 0,
        dismissible: false,
        action: {
          label: '确定',
          handler: () => {
            dismiss(item.id)
            resolve(defaultValue)
          }
        }
      })
      show(item)
    })
  }

  // 播放声音
  const playSound = (severity: FeedbackSeverity) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      const frequencies: Record<FeedbackSeverity, number> = {
        info: 800,
        success: 1000,
        warning: 600,
        error: 400
      }

      oscillator.frequency.value = frequencies[severity]
      oscillator.type = 'sine'
      gainNode.gain.value = 0.1

      oscillator.start()
      oscillator.stop(audioContext.currentTime + 0.1)
    } catch { /* ignore */ }
  }

  // 加载配置
  const loadConfig = () => {
    try {
      const stored = localStorage.getItem('feedback_config')
      if (stored) config.value = { ...config.value, ...JSON.parse(stored) }
    } catch { /* ignore */ }
  }

  // 保存配置
  const saveConfig = () => {
    localStorage.setItem('feedback_config', JSON.stringify(config.value))
  }

  // 更新配置
  const updateConfig = (updates: Partial<FeedbackConfig>) => {
    config.value = { ...config.value, ...updates }
    saveConfig()
  }

  // 统计
  const stats = computed(() => ({
    total: history.value.length,
    bySeverity: history.value.reduce((acc, i) => {
      acc[i.severity] = (acc[i.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    byType: history.value.reduce((acc, i) => {
      acc[i.type] = (acc[i.type] || 0) + 1
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
    prompt,
    loadConfig,
    saveConfig,
    updateConfig,
    stats
  }
}

export default useInteractionFeedbackImprover
