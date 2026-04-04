<template>
  <div class="notifications-panel" @click.stop>
    <!-- Header -->
    <div class="panel-header">
      <h2 class="panel-title">
        <span class="title-icon">🔔</span>
        通知中心
        <span v-if="totalUnread > 0" class="badge">{{ totalUnread }}</span>
      </h2>
      <div class="header-actions">
        <button v-if="totalUnread > 0" class="btn-text" @click="markAllRead">全部已读</button>
        <button class="btn-close" @click="$emit('close')">✕</button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="panel-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-btn"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.icon }} {{ tab.label }}
        <span v-if="tab.badge" class="tab-badge">{{ tab.badge }}</span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="notif.loading" class="panel-loading">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- Content -->
    <div v-else class="panel-body">

      <!-- ALERTS FEED TAB -->
      <div v-if="activeTab === 'alerts'" class="tab-content">
        <div v-if="notif.alerts.value.length === 0" class="empty-state">
          <span class="empty-icon">🎉</span>
          <p>暂无提醒</p>
          <p class="empty-sub">所有提醒都已处理 ✅</p>
        </div>
        <div v-else class="alerts-list">
          <div
            v-for="alert in notif.alerts.value"
            :key="alert.id"
            class="alert-item"
            :class="`alert-${alert.priority}`"
          >
            <div class="alert-icon">{{ alertIcon(alert.type) }}</div>
            <div class="alert-body">
              <div class="alert-title">{{ alert.title }}</div>
              <div class="alert-message">{{ alert.message }}</div>
              <div v-if="alert.sub_message" class="alert-sub">{{ alert.sub_message }}</div>
              <div class="alert-meta">
                <span class="alert-time">{{ formatTime(alert.created_at) }}</span>
                <span v-if="alert.hours_remaining !== undefined" class="alert-countdown">
                  ⏰ {{ notif.formatCountdown(alert.hours_remaining) }}
                </span>
              </div>
            </div>
            <div class="alert-actions">
              <button
                v-if="alert.type === 'mention' && !isMentionRead(alert.id)"
                class="btn-sm"
                @click="handleMentionRead(alert)"
              >已读</button>
              <button
                v-if="alert.type === 'content_update'"
                class="btn-sm btn-secondary"
                @click="handleDismissAlert(alert)"
              >忽略</button>
              <button class="btn-sm btn-link" @click="handleViewTask(alert.task_id)">查看</button>
            </div>
          </div>
        </div>
      </div>

      <!-- REMINDERS TAB -->
      <div v-if="activeTab === 'reminders'" class="tab-content">
        <div class="tab-toolbar">
          <button class="btn btn-primary" @click="showReminderModal = true">
            + 添加提醒
          </button>
        </div>
        <div v-if="notif.reminders.value.length === 0" class="empty-state">
          <span class="empty-icon">📅</span>
          <p>暂无审核提醒</p>
        </div>
        <div v-else class="reminders-list">
          <div
            v-for="reminder in notif.reminders.value"
            :key="reminder.id"
            class="reminder-item"
            :class="`status-${reminder.status}`"
          >
            <div class="reminder-info">
              <div class="reminder-title">{{ reminder.title }}</div>
              <div class="reminder-meta">
                <span class="reminder-date">📅 {{ formatDate(reminder.review_date) }}</span>
                <span class="reminder-before">提前 {{ reminder.remind_before_hours }}h 提醒</span>
                <span class="reminder-status" :class="`s-${reminder.status}`">
                  {{ STATUS_LABELS[reminder.status] }}
                </span>
              </div>
              <div v-if="reminder.notes" class="reminder-notes">{{ reminder.notes }}</div>
            </div>
            <div class="reminder-actions">
              <button class="btn-sm" @click="editReminder(reminder)">编辑</button>
              <button class="btn-sm btn-danger" @click="notif.deleteReminder(reminder.id)">删除</button>
            </div>
          </div>
        </div>
      </div>

      <!-- DEADLINES TAB -->
      <div v-if="activeTab === 'deadlines'" class="tab-content">
        <div class="tab-toolbar">
          <button class="btn btn-primary" @click="showDeadlineModal = true">
            + 添加截止日期
          </button>
        </div>
        <div v-if="notif.deadlines.value.length === 0" class="empty-state">
          <span class="empty-icon">⏰</span>
          <p>暂无截止日期</p>
        </div>
        <div v-else class="deadlines-list">
          <DeadlineCountdown
            v-for="ddl in notif.deadlines.value"
            :key="ddl.id"
            :deadline="ddl"
            @delete="notif.deleteDeadline(ddl.id)"
            @view="handleViewTask(ddl.task_id)"
          />
        </div>
      </div>

      <!-- MENTIONS TAB -->
      <div v-if="activeTab === 'mentions'" class="tab-content">
        <div v-if="notif.mentions.value.length === 0" class="empty-state">
          <span class="empty-icon">💬</span>
          <p>暂无@提及</p>
        </div>
        <div v-else class="mentions-list">
          <div
            v-for="mention in notif.mentions.value"
            :key="mention.id"
            class="mention-item"
            :class="{ unread: !mention.read }"
          >
            <div class="mention-avatar">{{ mention.from_user.charAt(0).toUpperCase() }}</div>
            <div class="mention-body">
              <div class="mention-from">@{{ mention.from_user }}</div>
              <div class="mention-message">{{ mention.message }}</div>
              <div class="mention-meta">
                <span>{{ formatTime(mention.created_at) }}</span>
                <span v-if="mention.slide_ref" class="mention-slide">{{ mention.slide_ref }}</span>
              </div>
            </div>
            <div v-if="!mention.read" class="mention-unread-dot"></div>
          </div>
        </div>
      </div>

      <!-- DIGEST TAB -->
      <div v-if="activeTab === 'digest'" class="tab-content">
        <div class="digest-settings">
          <h3 class="section-title">📧 周报邮件订阅</h3>
          <p class="section-desc">每周定时收到您的演示文稿状态摘要，包括待审核、需更新内容和截止日期提醒。</p>

          <div v-if="notif.digestSubscribed.value" class="digest-subscribed">
            <div class="sub-info">
              <div class="sub-email">{{ notif.digestSub.value?.email }}</div>
              <div class="sub-schedule">
                每周{{ notif.WEEKDAYS[notif.digestSub.value?.day_of_week ?? 1] }}
                {{ notif.digestSub.value?.hour ?? 9 }}:{{ String(notif.digestSub.value?.minute ?? 0).padStart(2, '0') }}
              </div>
              <div v-if="notif.digestSub.value?.last_sent" class="sub-last">
                上次发送: {{ formatDate(notif.digestSub.value.last_sent) }}
              </div>
            </div>
            <div class="sub-actions">
              <button class="btn btn-sm" @click="showDigestModal = true">修改设置</button>
              <button class="btn btn-sm btn-secondary" @click="notif.testDigestEmail()">发送测试邮件</button>
              <button class="btn btn-sm btn-danger" @click="notif.unsubscribeDigest()">取消订阅</button>
            </div>
          </div>

          <div v-else class="digest-unsubscribed">
            <button class="btn btn-primary" @click="showDigestModal = true">
              订阅周报
            </button>
          </div>

          <!-- Smart Alerts -->
          <h3 class="section-title" style="margin-top: 24px">⚙️ 智能提醒规则</h3>
          <div v-if="notif.smartAlerts.value.length === 0" class="empty-state-sm">
            <p>暂无智能提醒规则</p>
          </div>
          <div v-else class="smart-alerts-list">
            <div
              v-for="alert in notif.smartAlerts.value"
              :key="alert.id"
              class="smart-alert-item"
            >
              <div class="sa-info">
                <div class="sa-title">{{ alert.title }}</div>
                <div class="sa-message">{{ alert.message }}</div>
                <div class="sa-meta">
                  每 {{ alert.trigger_after_days }} 天提醒一次
                  <span v-if="alert.dismissed">· 已忽略</span>
                </div>
              </div>
              <div class="sa-actions">
                <button class="btn-sm" @click="notif.deleteSmartAlert(alert.id)">删除</button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- Reminder Modal -->
    <ReminderModal
      v-if="showReminderModal"
      :reminder="editingReminder"
      @close="closeReminderModal"
      @save="saveReminder"
    />

    <!-- Deadline Modal -->
    <DeadlineModal
      v-if="showDeadlineModal"
      @close="showDeadlineModal = false"
      @save="saveDeadline"
    />

    <!-- Digest Modal -->
    <DigestModal
      v-if="showDigestModal"
      :subscriber="notif.digestSub.value"
      @close="showDigestModal = false"
      @save="saveDigest"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useNotifications } from '../composables/useNotifications'
import DeadlineCountdown from './DeadlineCountdown.vue'
import ReminderModal from './ReminderModal.vue'
import DeadlineModal from './DeadlineModal.vue'
import DigestModal from './DigestModal.vue'
import type { NotificationAlert, Reminder } from '../composables/useNotifications'

const emit = defineEmits<{
  close: []
  viewTask: [taskId: string]
}>()

const notif = useNotifications()

// Tabs
const activeTab = ref('alerts')
const tabs = computed(() => [
  { key: 'alerts', label: '全部提醒', icon: '🔔', badge: notif.alerts.value.length || null },
  { key: 'reminders', label: '审核提醒', icon: '📅', badge: notif.reminders.value.length || null },
  { key: 'deadlines', label: '截止日期', icon: '⏰', badge: notif.upcomingDeadlines.value.length || null },
  { key: 'mentions', label: '@提及', icon: '💬', badge: notif.unreadMentionCount.value || null },
  { key: 'digest', label: '周报订阅', icon: '📧', badge: null },
])

const totalUnread = computed(() =>
  notif.alerts.value.length + notif.unreadMentionCount.value + notif.unreadGenerationCount.value
)

// Modal state
const showReminderModal = ref(false)
const showDeadlineModal = ref(false)
const showDigestModal = ref(false)
const editingReminder = ref<Reminder | null>(null)

// Init
onMounted(() => {
  notif.init()
})

// Actions
const markAllRead = () => {
  notif.markAllMentionsRead()
  notif.alerts.value = []
}

const handleMentionRead = (alert: NotificationAlert) => {
  notif.markMentionRead(alert.id)
}

const handleDismissAlert = (alert: NotificationAlert) => {
  if (alert.type === 'content_update') {
    notif.dismissSmartAlert(alert.id)
  }
}

const handleGenerationRead = (alert: NotificationAlert) => {
  notif.markGenerationRead(alert.id)
}

const isGenerationRead = (alertId: string) => {
  const g = notif.generationNotifications.value.find(g => g.id === alertId)
  return g ? g.read : true
}

const handleViewTask = (taskId: string) => {
  emit('viewTask', taskId)
  emit('close')
}

const isMentionRead = (alertId: string) => {
  const m = notif.mentions.value.find(m => m.id === alertId)
  return m ? m.read : true
}

// Reminder modal
const closeReminderModal = () => {
  showReminderModal.value = false
  editingReminder.value = null
}

const saveReminder = async (params: any) => {
  if (editingReminder.value) {
    await notif.updateReminder(editingReminder.value.id, params)
  } else {
    await notif.createReminder(params)
  }
  closeReminderModal()
}

const editReminder = (reminder: Reminder) => {
  editingReminder.value = reminder
  showReminderModal.value = true
}

// Deadline
const saveDeadline = async (params: any) => {
  await notif.createDeadline(params)
  showDeadlineModal.value = false
}

// Digest
const saveDigest = async (params: any) => {
  await notif.subscribeDigest(params)
  showDigestModal.value = false
}

// Formatters
const formatTime = (iso: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins} 分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} 天前`
  return d.toLocaleDateString('zh-CN')
}

const formatDate = (iso: string) => {
  if (!iso) return ''
  return new Date(iso).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const alertIcon = (type: string) => {
  const map: Record<string, string> = {
    review_date: '📅',
    content_update: '⚠️',
    deadline_approaching: '⏰',
    mention: '💬',
    weekly_digest: '📧',
    generation_complete: '✅',
    collaborator_joined: '👋',
  }
  return map[type] || '🔔'
}

const STATUS_LABELS: Record<string, string> = {
  pending: '待提醒',
  triggered: '已触发',
  dismissed: '已忽略',
  completed: '已完成',
}
</script>

<style scoped>
.notifications-panel {
  position: fixed;
  top: 60px;
  right: 20px;
  width: 420px;
  max-height: calc(100vh - 100px);
  background: var(--bg-card, #fff);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(0,0,0,0.08);
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
}

.badge {
  background: #EF4444;
  color: white;
  border-radius: 10px;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.btn-text {
  background: none;
  border: none;
  color: #165DFF;
  font-size: 13px;
  cursor: pointer;
  padding: 4px 8px;
}

.btn-close {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 4px 8px;
  color: #666;
}

.panel-tabs {
  display: flex;
  padding: 0 12px;
  gap: 4px;
  border-bottom: 1px solid rgba(0,0,0,0.06);
  overflow-x: auto;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 10px 12px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  font-size: 13px;
  color: #666;
  white-space: nowrap;
}

.tab-btn.active {
  color: #165DFF;
  border-bottom-color: #165DFF;
  font-weight: 500;
}

.tab-badge {
  background: #EF4444;
  color: white;
  border-radius: 8px;
  padding: 1px 5px;
  font-size: 10px;
}

.panel-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  gap: 12px;
  color: #999;
}

.panel-body {
  flex: 1;
  overflow-y: auto;
}

.tab-content {
  padding: 16px;
}

.tab-toolbar {
  margin-bottom: 12px;
}

/* Alerts */
.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.alert-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 10px;
  background: rgba(0,0,0,0.03);
  border-left: 3px solid transparent;
}

.alert-high { border-left-color: #EF4444; background: rgba(239,68,68,0.05); }
.alert-medium { border-left-color: #F59E0B; background: rgba(245,158,11,0.05); }
.alert-low { border-left-color: #10B981; }

.alert-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.alert-body {
  flex: 1;
  min-width: 0;
}

.alert-title {
  font-size: 13px;
  font-weight: 600;
  color: #1a1a1a;
}

.alert-message {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
}

.alert-sub {
  font-size: 11px;
  color: #999;
  margin-top: 2px;
}

.alert-meta {
  display: flex;
  gap: 8px;
  margin-top: 6px;
  font-size: 11px;
  color: #999;
}

.alert-countdown {
  color: #EF4444;
  font-weight: 500;
}

.alert-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
}

/* Reminders */
.reminders-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.reminder-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-radius: 10px;
  background: rgba(0,0,0,0.03);
}

.status-triggered { background: rgba(16,185,129,0.08); }
.status-dismissed { opacity: 0.5; }

.reminder-title {
  font-size: 13px;
  font-weight: 600;
}

.reminder-meta {
  display: flex;
  gap: 8px;
  font-size: 11px;
  color: #666;
  margin-top: 4px;
}

.reminder-status {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 8px;
}
.s-pending { background: #FEF3C7; color: #92400E; }
.s-triggered { background: #D1FAE5; color: #065F46; }
.s-dismissed { background: #E5E7EB; color: #374151; }
.s-completed { background: #DBEAFE; color: #1E40AF; }

.reminder-notes {
  font-size: 11px;
  color: #999;
  margin-top: 4px;
}

.reminder-actions {
  display: flex;
  gap: 6px;
}

/* Deadlines */
.deadlines-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Mentions */
.mentions-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mention-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 10px;
  background: rgba(0,0,0,0.03);
  align-items: flex-start;
}

.mention-item.unread {
  background: rgba(22,93,255,0.05);
  border-left: 3px solid #165DFF;
}

.mention-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #165DFF;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}

.mention-body {
  flex: 1;
}

.mention-from {
  font-size: 13px;
  font-weight: 600;
  color: #165DFF;
}

.mention-message {
  font-size: 12px;
  color: #333;
  margin-top: 2px;
}

.mention-meta {
  display: flex;
  gap: 8px;
  font-size: 11px;
  color: #999;
  margin-top: 4px;
}

.mention-unread-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #EF4444;
  flex-shrink: 0;
  margin-top: 4px;
}

/* Digest */
.digest-settings {
  font-size: 13px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 8px;
}

.section-desc {
  font-size: 12px;
  color: #666;
  margin: 0 0 16px;
}

.sub-info {
  background: rgba(0,0,0,0.03);
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 12px;
}

.sub-email {
  font-weight: 600;
  font-size: 14px;
}

.sub-schedule {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.sub-last {
  font-size: 11px;
  color: #999;
  margin-top: 4px;
}

.sub-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.smart-alerts-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.smart-alert-item {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  background: rgba(0,0,0,0.03);
  border-radius: 8px;
}

.sa-title {
  font-size: 13px;
  font-weight: 500;
}

.sa-message {
  font-size: 12px;
  color: #666;
}

.sa-meta {
  font-size: 11px;
  color: #999;
  margin-top: 4px;
}

/* Buttons */
.btn {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  border: none;
}

.btn-primary {
  background: #165DFF;
  color: white;
}

.btn-secondary {
  background: rgba(0,0,0,0.06);
  color: #333;
}

.btn-danger {
  background: rgba(239,68,68,0.1);
  color: #EF4444;
}

.btn-sm {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  border: none;
}

.btn-link {
  background: none;
  color: #165DFF;
  padding: 4px 6px;
}

/* Empty states */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.empty-icon {
  font-size: 40px;
  display: block;
  margin-bottom: 12px;
}

.empty-sub {
  font-size: 12px;
  margin-top: 4px;
}

.empty-state-sm {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 12px;
}

/* Spinner */
.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(0,0,0,0.1);
  border-top-color: #165DFF;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
