// Smart Reminders - 智能提醒系统
import { ref, computed } from 'vue'

export type ReminderType = 'save' | 'export' | 'share' | 'backup' | 'update' | 'session' | 'custom'
export type ReminderPriority = 'low' | 'medium' | 'high'

export interface Reminder {
  id: string
  type: ReminderType
  title: string
  message: string
  priority: ReminderPriority
  timestamp: number
  triggered: boolean
  dismissed: boolean
  action?: () => void
}

export interface ReminderConfig {
  enableAutoSave: boolean
  enableExportReminder: boolean
  enableSessionReminder: boolean
  autoSaveInterval: number
  sessionTimeout: number
}

export function useSmartReminders() {
  // 配置
  const config = ref<ReminderConfig>({
    enableAutoSave: true,
    enableExportReminder: true,
    enableSessionReminder: true,
    autoSaveInterval: 60000, // 1分钟
    sessionTimeout: 300000 // 5分钟
  })

  // 提醒列表
  const reminders = ref<Reminder[]>([])

  // 活跃提醒
  const activeReminders = computed(() =>
    reminders.value.filter(r => r.triggered && !r.dismissed)
  )

  // 创建提醒
  const createReminder = (
    type: ReminderType,
    title: string,
    message: string,
    priority: ReminderPriority = 'medium'
  ): Reminder => {
    const reminder: Reminder = {
      id: `rem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      message,
      priority,
      timestamp: Date.now(),
      triggered: false,
      dismissed: false
    }

    reminders.value.push(reminder)
    return reminder
  }

  // 触发提醒
  const triggerReminder = (id: string) => {
    const reminder = reminders.value.find(r => r.id === id)
    if (reminder) {
      reminder.triggered = true
    }
  }

  // 触发提醒（通过类型）
  const triggerByType = (type: ReminderType) => {
    const reminder = reminders.value.find(r => r.type === type && !r.triggered)
    if (reminder) {
      reminder.triggered = true
    }
  }

  // 关闭提醒
  const dismissReminder = (id: string) => {
    const reminder = reminders.value.find(r => r.id === id)
    if (reminder) {
      reminder.dismissed = true
    }
  }

  // 自动保存提醒
  const autoSaveReminder = () => {
    if (!config.value.enableAutoSave) return

    createReminder(
      'save',
      '自动保存提醒',
      '您的作品已自动保存',
      'low'
    )
  }

  // 导出提醒
  const exportReminder = () => {
    if (!config.value.enableExportReminder) return

    createReminder(
      'export',
      '导出提醒',
      '记得导出您的PPT以便保存',
      'medium'
    )
  }

  // 会话超时提醒
  const sessionTimeoutReminder = () => {
    if (!config.value.enableSessionReminder) return

    createReminder(
      'session',
      '会话即将过期',
      '由于长时间未操作，会话将在一分钟后过期',
      'high'
    )
  }

  // 设置定时提醒
  const setTimedReminder = (
    type: ReminderType,
    title: string,
    message: string,
    delay: number,
    priority: ReminderPriority = 'medium'
  ) => {
    const reminder = createReminder(type, title, message, priority)

    setTimeout(() => {
      triggerReminder(reminder.id)
    }, delay)

    return reminder
  }

  // 清除所有提醒
  const clearAllReminders = () => {
    reminders.value = []
  }

  // 清除已触发的提醒
  const clearTriggered = () => {
    reminders.value = reminders.value.filter(r => !r.triggered)
  }

  // 统计
  const stats = computed(() => ({
    total: reminders.value.length,
    active: activeReminders.value.length,
    triggered: reminders.value.filter(r => r.triggered).length,
    dismissed: reminders.value.filter(r => r.dismissed).length,
    byPriority: {
      high: reminders.value.filter(r => r.priority === 'high').length,
      medium: reminders.value.filter(r => r.priority === 'medium').length,
      low: reminders.value.filter(r => r.priority === 'low').length
    }
  }))

  return {
    config,
    reminders,
    activeReminders,
    createReminder,
    triggerReminder,
    triggerByType,
    dismissReminder,
    autoSaveReminder,
    exportReminder,
    sessionTimeoutReminder,
    setTimedReminder,
    clearAllReminders,
    clearTriggered,
    stats
  }
}

export default useSmartReminders
