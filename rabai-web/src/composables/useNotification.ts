// useNotification.ts - 通知模块
import { ref, computed } from 'vue'

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message?: string
  duration: number
  timestamp: number
  read: boolean
}

export interface NotificationConfig {
  maxCount: number
  defaultDuration: number
  position: 'top' | 'bottom' | 'top-right' | 'bottom-right'
}

export function useNotification() {
  const config = ref<NotificationConfig>({
    maxCount: 5,
    defaultDuration: 3000,
    position: 'top-right'
  })

  const notifications = ref<Notification[]>([])

  const add = (type: NotificationType, title: string, message?: string, duration?: number): Notification => {
    const notification: Notification = {
      id: `notif_${Date.now()}`,
      type,
      title,
      message,
      duration: duration ?? config.value.defaultDuration,
      timestamp: Date.now(),
      read: false
    }

    notifications.value.unshift(notification)

    if (notifications.value.length > config.value.maxCount) {
      notifications.value.pop()
    }

    // 自动移除
    if (notification.duration > 0) {
      setTimeout(() => remove(notification.id), notification.duration)
    }

    return notification
  }

  const success = (title: string, message?: string) => add('success', title, message)
  const error = (title: string, message?: string) => add('error', title, message, 5000)
  const warning = (title: string, message?: string) => add('warning', title, message)
  const info = (title: string, message?: string) => add('info', title, message)

  const remove = (id: string): boolean => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
      return true
    }
    return false
  }

  const clear = () => { notifications.value = [] }

  const markRead = (id: string) => {
    const notif = notifications.value.find(n => n.id === id)
    if (notif) notif.read = true
  }

  const markAllRead = () => {
    notifications.value.forEach(n => n.read = true)
  }

  const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

  return { config, notifications, add, success, error, warning, info, remove, clear, markRead, markAllRead, unreadCount }
}

export default useNotification
