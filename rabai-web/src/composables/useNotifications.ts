/**
 * useNotifications — 智能通知系统 composable
 *
 * 功能:
 * 1. Reminders      — 审核日期提醒 CRUD
 * 2. Smart Alerts   — 内容更新智能提醒
 * 3. Weekly Digest  — 周报邮件订阅
 * 4. @Mentions      — @提及通知
 * 5. Deadline Countdowns — 截止日期倒计时
 * 6. Unified Feed   — 统一提醒列表
 *
 * 触发浏览器通知 + 内部 toast 通知
 */

import { ref, computed } from 'vue'
import { apiClient } from '../api/client'
import { useInteractionFeedback } from './useInteractionFeedback'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Reminder {
  id: string
  task_id: string
  title: string
  review_date: string
  remind_before_hours: number
  notes: string
  status: 'pending' | 'triggered' | 'dismissed' | 'completed'
  notified_at: string | null
  created_at: string
}

export interface SmartAlert {
  id: string
  task_id: string
  rule_type: string
  title: string
  message: string
  trigger_after_days: number
  last_triggered: string | null
  notified: boolean
  dismissed: boolean
  created_at: string
}

export interface Mention {
  id: string
  task_id: string
  from_user: string
  to_user: string
  message: string
  slide_ref: string | null
  read: boolean
  created_at: string
}

export interface Deadline {
  id: string
  task_id: string
  title: string
  deadline: string
  hours_remaining: number
  notification_hours: number[]
  created_at: string
}

export interface DigestSubscriber {
  id: string
  email: string
  name: string
  enabled: boolean
  day_of_week: number
  hour: number
  minute: number
  last_sent: string | null
}

export interface NotificationAlert {
  type: 'review_date' | 'content_update' | 'deadline_approaching' | 'mention' | 'weekly_digest' | 'generation_complete' | 'collaborator_joined'
  id: string
  task_id: string
  title: string
  message: string
  sub_message?: string
  hours_remaining?: number
  slide_ref?: string
  priority: 'high' | 'medium' | 'low'
  created_at: string
}

export interface GenerationNotification {
  id: string
  notif_type: 'generation_complete' | 'collaborator_joined'
  task_id: string
  title: string
  message: string
  task_title?: string
  collaborator_name?: string
  read: boolean
  created_at: string
}

// ── Composable ─────────────────────────────────────────────────────────────────

export function useNotifications() {
  const { showSuccess } = useInteractionFeedback()

  // State
  const reminders = ref<Reminder[]>([])
  const smartAlerts = ref<SmartAlert[]>([])
  const mentions = ref<Mention[]>([])
  const deadlines = ref<Deadline[]>([])
  const alerts = ref<NotificationAlert[]>([])
  const digestSub = ref<DigestSubscriber | null>(null)
  const unreadMentionCount = ref(0)
  const generationNotifications = ref<GenerationNotification[]>([])
  const unreadGenerationCount = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const hasUnreadMentions = computed(() => unreadMentionCount.value > 0)
  const hasActiveAlerts = computed(() => alerts.value.length > 0)
  const highPriorityAlerts = computed(() => alerts.value.filter(a => a.priority === 'high'))
  const upcomingDeadlines = computed(() => deadlines.value.filter(d => d.hours_remaining > 0))
  const digestSubscribed = computed(() => digestSub.value !== null)

  // ── Browser Notification Helpers ──────────────────────────────────────────

  const requestBrowserPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) return false
    if (Notification.permission === 'granted') return true
    if (Notification.permission === 'denied') return false
    try {
      const perm = await Notification.requestPermission()
      return perm === 'granted'
    } catch {
      return false
    }
  }

  const showBrowserNotification = async (title: string, body: string, tag?: string) => {
    const granted = await requestBrowserPermission()
    if (!granted) return
    try {
      const n = new Notification(title, {
        body,
        tag: tag || `notif-${Date.now()}`,
        icon: '/icon-192.svg',
      })
      n.onclick = () => { window.focus(); n.close() }
      setTimeout(() => n.close(), 10000)
    } catch { /* ignore */ }
  }

  // ── Alerts Feed ────────────────────────────────────────────────────────────

  const fetchAlerts = async () => {
    try {
      const res = await apiClient.get('/notifications/alerts')
      if (res.data.success) {
        alerts.value = res.data.data.alerts || []
      }
    } catch { /* silently fail */ }
  }

  const checkAndTriggerAlerts = async () => {
    try {
      const res = await apiClient.post('/notifications/alerts/check')
      if (res.data.success) {
        alerts.value = res.data.data.all_alerts || []
        // Show browser notification for new high priority alerts
        const newHigh = (res.data.data.all_alerts || []).filter(
          (a: NotificationAlert) => a.priority === 'high'
        )
        if (newHigh.length > 0) {
          showBrowserNotification(
            `📢 您有 ${newHigh.length} 条高优先级提醒`,
            newHigh[0].message,
            'high-priority-alerts'
          )
        }
      }
    } catch { /* silently fail */ }
  }

  // ── Reminders ──────────────────────────────────────────────────────────────

  const fetchReminders = async () => {
    try {
      const res = await apiClient.get('/notifications/reminders')
      if (res.data.success) {
        reminders.value = res.data.data || []
      }
    } catch (e: any) {
      error.value = e.message
    }
  }

  const createReminder = async (params: {
    task_id: string
    title: string
    review_date: string
    remind_before_hours?: number
    notes?: string
  }) => {
    try {
      const res = await apiClient.post('/notifications/reminders', params)
      if (res.data.success) {
        reminders.value.push(res.data.data)
        showSuccess('✅ 提醒已设置', `将在 ${params.review_date} 前提醒您`)
        showBrowserNotification('🔔 提醒已设置', `「${params.title}」将在 ${params.review_date} 审核`, 'reminder-set')
        return res.data.data
      }
    } catch (e: any) {
      showSuccess('❌ 设置失败', e.message)
    }
  }

  const updateReminder = async (reminderId: string, updates: Partial<Reminder>) => {
    try {
      const res = await apiClient.patch(`/notifications/reminders/${reminderId}`, updates)
      if (res.data.success) {
        const idx = reminders.value.findIndex(r => r.id === reminderId)
        if (idx >= 0) reminders.value[idx] = res.data.data
        return res.data.data
      }
    } catch (e: any) {
      showSuccess('❌ 更新失败', e.message)
    }
  }

  const deleteReminder = async (reminderId: string) => {
    try {
      const res = await apiClient.delete(`/notifications/reminders/${reminderId}`)
      if (res.data.success) {
        reminders.value = reminders.value.filter(r => r.id !== reminderId)
        showSuccess('🗑️ 提醒已删除', '')
      }
    } catch (e: any) {
      showSuccess('❌ 删除失败', e.message)
    }
  }

  // ── Smart Alerts ──────────────────────────────────────────────────────────

  const fetchSmartAlerts = async () => {
    try {
      const res = await apiClient.get('/notifications/smart-alerts')
      if (res.data.success) {
        smartAlerts.value = res.data.data || []
      }
    } catch { /* silently fail */ }
  }

  const createSmartAlert = async (params: {
    task_id: string
    rule_type: string
    title: string
    message: string
    trigger_after_days: number
  }) => {
    try {
      const res = await apiClient.post('/notifications/smart-alerts', params)
      if (res.data.success) {
        smartAlerts.value.unshift(res.data.data)
        showSuccess('✅ 智能提醒已创建', `内容更新后将自动提醒您`)
        return res.data.data
      }
    } catch (e: any) {
      showSuccess('❌ 创建失败', e.message)
    }
  }

  const dismissSmartAlert = async (alertId: string) => {
    try {
      await apiClient.post(`/notifications/smart-alerts/${alertId}/dismiss`)
      smartAlerts.value = smartAlerts.value.filter(a => a.id !== alertId)
      alerts.value = alerts.value.filter(a => a.id !== alertId)
    } catch { /* silently fail */ }
  }

  const deleteSmartAlert = async (alertId: string) => {
    try {
      await apiClient.delete(`/notifications/smart-alerts/${alertId}`)
      smartAlerts.value = smartAlerts.value.filter(a => a.id !== alertId)
    } catch { /* silently fail */ }
  }

  // ── Mentions ──────────────────────────────────────────────────────────────

  const fetchMentions = async (unreadOnly = false) => {
    try {
      const res = await apiClient.get('/notifications/mentions', { params: { unread_only: unreadOnly } })
      if (res.data.success) {
        mentions.value = res.data.data.mentions || []
        unreadMentionCount.value = res.data.data.unread_count || 0
      }
    } catch { /* silently fail */ }
  }

  const sendMention = async (params: {
    task_id: string
    from_user: string
    to_user: string
    message: string
    slide_ref?: string
  }) => {
    try {
      const res = await apiClient.post('/notifications/mentions', params)
      if (res.data.success) {
        showSuccess('📣 @提及已发送', `已通知 ${params.to_user}`)
        showBrowserNotification(`📣 @${params.to_user}`, params.message.substring(0, 60), 'mention-sent')
        return res.data.data
      }
    } catch (e: any) {
      showSuccess('❌ 发送失败', e.message)
    }
  }

  const markMentionRead = async (mentionId: string) => {
    try {
      await apiClient.post(`/notifications/mentions/${mentionId}/read`)
      const m = mentions.value.find(m => m.id === mentionId)
      if (m && !m.read) {
        m.read = true
        unreadMentionCount.value = Math.max(0, unreadMentionCount.value - 1)
      }
    } catch { /* silently fail */ }
  }

  const markAllMentionsRead = async () => {
    try {
      await apiClient.post('/notifications/mentions/read-all')
      mentions.value.forEach(m => { m.read = true })
      unreadMentionCount.value = 0
    } catch { /* silently fail */ }
  }

  // ── Deadlines ──────────────────────────────────────────────────────────────

  const fetchDeadlines = async () => {
    try {
      const res = await apiClient.get('/notifications/deadlines')
      if (res.data.success) {
        deadlines.value = res.data.data || []
      }
    } catch { /* silently fail */ }
  }

  const createDeadline = async (params: {
    task_id: string
    title: string
    deadline: string
    notification_hours?: number[]
  }) => {
    try {
      const res = await apiClient.post('/notifications/deadlines', params)
      if (res.data.success) {
        deadlines.value.push(res.data.data)
        deadlines.value.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
        showSuccess('⏰ 截止日期已设置', `"${params.title}" 已加入倒计时`)
        return res.data.data
      }
    } catch (e: any) {
      showSuccess('❌ 设置失败', e.message)
    }
  }

  const deleteDeadline = async (deadlineId: string) => {
    try {
      await apiClient.delete(`/notifications/deadlines/${deadlineId}`)
      deadlines.value = deadlines.value.filter(d => d.id !== deadlineId)
    } catch { /* silently fail */ }
  }

  // ── Weekly Digest ──────────────────────────────────────────────────────────

  const fetchDigestStatus = async () => {
    try {
      const res = await apiClient.get('/notifications/digest/status')
      if (res.data.success) {
        digestSub.value = res.data.data.subscribed ? res.data.data.subscriber : null
      }
    } catch { /* silently fail */ }
  }

  const subscribeDigest = async (params: {
    email: string
    name?: string
    day_of_week?: number
    hour?: number
    minute?: number
  }) => {
    try {
      const res = await apiClient.post('/notifications/digest/subscribe', params)
      if (res.data.success) {
        digestSub.value = res.data.data
        showSuccess('📧 周报订阅成功', `每周 ${WEEKDAYS[params.day_of_week ?? 1]} ${params.hour ?? 9}:00 发送`)
        return res.data.data
      }
    } catch (e: any) {
      showSuccess('❌ 订阅失败', e.message)
    }
  }

  const unsubscribeDigest = async () => {
    try {
      await apiClient.delete('/notifications/digest/unsubscribe')
      digestSub.value = null
      showSuccess('📧 周报已取消订阅', '')
    } catch (e: any) {
      showSuccess('❌ 取消失败', e.message)
    }
  }

  const testDigestEmail = async () => {
    try {
      const res = await apiClient.post('/notifications/digest/test')
      if (res.data.success) {
        showSuccess('📧 测试邮件已发送', '请检查您的收件箱')
      }
    } catch (e: any) {
      showSuccess('❌ 发送失败', e.message)
    }
  }

  // ── Generation / Collaborator Notifications ─────────────────────────────────

  const fetchGenerationNotifications = async (unreadOnly = false) => {
    try {
      const res = await apiClient.get('/notifications/generation', {
        params: { unread_only: unreadOnly }
      })
      if (res.data.success) {
        generationNotifications.value = res.data.data.notifications || []
        unreadGenerationCount.value = res.data.data.unread_count || 0
      }
    } catch { /* silently fail */ }
  }

  const markGenerationRead = async (notifId: string) => {
    try {
      await apiClient.patch(`/notifications/generation/${notifId}/read`)
      const n = generationNotifications.value.find(n => n.id === notifId)
      if (n && !n.read) {
        n.read = true
        unreadGenerationCount.value = Math.max(0, unreadGenerationCount.value - 1)
      }
    } catch { /* silently fail */ }
  }

  const markAllGenerationRead = async () => {
    try {
      await apiClient.post('/notifications/generation/read-all')
      generationNotifications.value.forEach(n => { n.read = true })
      unreadGenerationCount.value = 0
    } catch { /* silently fail */ }
  }

  // ── Full Init ──────────────────────────────────────────────────────────────

  const init = async () => {
    loading.value = true
    await Promise.all([
      fetchAlerts(),
      fetchReminders(),
      fetchSmartAlerts(),
      fetchMentions(),
      fetchDeadlines(),
      fetchDigestStatus(),
      fetchGenerationNotifications(),
    ])
    // Also trigger backend check for due items
    checkAndTriggerAlerts()
    loading.value = false
  }

  // Refresh all
  const refresh = async () => {
    await Promise.all([
      fetchAlerts(),
      fetchReminders(),
      fetchSmartAlerts(),
      fetchMentions(),
      fetchDeadlines(),
      fetchDigestStatus(),
      fetchGenerationNotifications(),
    ])
  }

  // ── Utility ────────────────────────────────────────────────────────────────

  function formatCountdown(hours: number): string {
    if (hours < 0) return '已到期'
    if (hours < 1) return `${Math.round(hours * 60)} 分钟`
    if (hours < 24) return `${Math.round(hours)} 小时`
    const days = Math.round(hours / 24)
    return `${days} 天`
  }

  const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

  return {
    // State
    reminders,
    smartAlerts,
    mentions,
    deadlines,
    alerts,
    digestSub,
    unreadMentionCount,
    generationNotifications,
    unreadGenerationCount,
    loading,
    error,

    // Computed
    hasUnreadMentions,
    hasActiveAlerts,
    highPriorityAlerts,
    upcomingDeadlines,
    digestSubscribed,

    // Actions
    init,
    refresh,
    fetchAlerts,
    checkAndTriggerAlerts,

    // Reminders
    fetchReminders,
    createReminder,
    updateReminder,
    deleteReminder,

    // Smart Alerts
    fetchSmartAlerts,
    createSmartAlert,
    dismissSmartAlert,
    deleteSmartAlert,

    // Mentions
    fetchMentions,
    sendMention,
    markMentionRead,
    markAllMentionsRead,

    // Deadlines
    fetchDeadlines,
    createDeadline,
    deleteDeadline,

    // Digest
    fetchDigestStatus,
    subscribeDigest,
    unsubscribeDigest,
    testDigestEmail,

    // Generation / Collaborator
    fetchGenerationNotifications,
    markGenerationRead,
    markAllGenerationRead,

    // Utilities
    formatCountdown,
    WEEKDAYS,
  }
}
