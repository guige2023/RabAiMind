<template>
  <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-card schedule-modal">
      <div class="modal-header">
        <h3>📅 定时发布与自动化</h3>
        <button class="btn-close" @click="$emit('close')">✕</button>
      </div>

      <div class="modal-body">
        <!-- Schedule Type Tabs -->
        <div class="schedule-tabs">
          <button
            v-for="tab in scheduleTabs"
            :key="tab.id"
            class="tab-btn"
            :class="{ active: form.schedule_type === tab.id }"
            @click="form.schedule_type = tab.id"
          >
            {{ tab.icon }} {{ tab.label }}
          </button>
        </div>

        <!-- Schedule Name -->
        <div class="form-group">
          <label>任务名称 <span class="required">*</span></label>
          <input
            v-model="form.name"
            type="text"
            class="form-input"
            placeholder="如：每日站会汇报、Q1月报自动生成"
            maxlength="100"
          />
        </div>

        <!-- Timezone Selector -->
        <div class="form-group">
          <label>🌐 时区</label>
          <select v-model="form.timezone" class="form-input">
            <option value="Asia/Shanghai">🇨🇳 北京时间 (UTC+8)</option>
            <option value="Asia/Tokyo">🇯🇵 东京时间 (UTC+9)</option>
            <option value="Asia/Seoul">🇰🇷 首尔时间 (UTC+9)</option>
            <option value="Asia/Singapore">🇸🇬 新加坡时间 (UTC+8)</option>
            <option value="Asia/Dubai">🇦🇪 迪拜时间 (UTC+4)</option>
            <option value="Europe/London">🇬🇧 伦敦时间 (UTC+0)</option>
            <option value="Europe/Paris">🇫🇷 巴黎时间 (UTC+1)</option>
            <option value="Europe/Berlin">🇩🇪 柏林时间 (UTC+1)</option>
            <option value="America/New_York">🇺🇸 纽约时间 (UTC-5)</option>
            <option value="America/Los_Angeles">🇺🇸 洛杉矶时间 (UTC-8)</option>
            <option value="America/Chicago">🇺🇸 芝加哥时间 (UTC-6)</option>
            <option value="Australia/Sydney">🇦🇺 悉尼时间 (UTC+10)</option>
          </select>
          <div class="form-hint">当前本地时间: {{ localTime }}</div>
        </div>

        <!-- Once: Date/Time Picker -->
        <template v-if="form.schedule_type === 'once'">
          <div class="form-group">
            <label>📆 发布日期 <span class="required">*</span></label>
            <input
              v-model="form.run_at_date"
              type="date"
              class="form-input"
              :min="minDate"
            />
          </div>
          <div class="form-group">
            <label>🕐 发布时间 <span class="required">*</span></label>
            <input
              v-model="form.run_at_time"
              type="time"
              class="form-input"
            />
            <div class="form-hint">
              对应 {{ form.timezone }}: {{ scheduledDisplayTime }}
            </div>
          </div>
        </template>

        <!-- Daily -->
        <template v-else-if="form.schedule_type === 'daily'">
          <div class="form-row">
            <div class="form-group">
              <label>🕐 执行时间</label>
              <select v-model="form.hour" class="form-input">
                <option v-for="h in 24" :key="h-1" :value="h-1">
                  {{ String(h-1).padStart(2, '0') }}:00
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>📅 循环频率</label>
              <div class="frequency-display">每天</div>
            </div>
          </div>
        </template>

        <!-- Weekly -->
        <template v-else-if="form.schedule_type === 'weekly'">
          <div class="form-group">
            <label>📅 选择星期 <span class="required">*</span></label>
            <div class="weekday-selector">
              <button
                v-for="(day, idx) in weekdays"
                :key="idx"
                class="weekday-btn"
                :class="{ active: form.day_of_week === day.value }"
                @click="form.day_of_week = day.value"
              >
                {{ day.label }}
              </button>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>🕐 执行时间</label>
              <select v-model="form.hour" class="form-input">
                <option v-for="h in 24" :key="h-1" :value="h-1">
                  {{ String(h-1).padStart(2, '0') }}:00
                </option>
              </select>
            </div>
          </div>
        </template>

        <!-- Monthly -->
        <template v-else-if="form.schedule_type === 'monthly'">
          <div class="form-group">
            <label>📅 每月几号 <span class="required">*</span></label>
            <div class="day-selector">
              <button
                v-for="d in 31"
                :key="d"
                class="day-btn"
                :class="{ active: form.day_of_month === d }"
                @click="form.day_of_month = d"
              >
                {{ d }}
              </button>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>🕐 执行时间</label>
              <select v-model="form.hour" class="form-input">
                <option v-for="h in 24" :key="h-1" :value="h-1">
                  {{ String(h-1).padStart(2, '0') }}:00
                </option>
              </select>
            </div>
          </div>
        </template>

        <!-- Action: Generate / Export -->
        <div class="form-group">
          <label>⚙️ 执行动作</label>
          <div class="action-cards">
            <div
              class="action-card"
              :class="{ selected: form.action === 'generate' }"
              @click="form.action = 'generate'"
            >
              <span class="action-icon">🤖</span>
              <span class="action-label">AI重新生成</span>
              <span class="action-desc">按原配置重新生成PPT</span>
            </div>
            <div
              class="action-card"
              :class="{ selected: form.action === 'export' }"
              @click="form.action = 'export'"
            >
              <span class="action-icon">📤</span>
              <span class="action-label">导出文件</span>
              <span class="action-desc">导出PPTX/PDF/PNG</span>
            </div>
          </div>
        </div>

        <!-- Reminder Notification -->
        <div class="form-group">
          <label>
            <input type="checkbox" v-model="form.enable_reminder" class="checkbox" />
            🔔 提醒观看者
          </label>
          <div v-if="form.enable_reminder" class="reminder-options">
            <select v-model="form.remind_before_minutes" class="form-input">
              <option :value="15">提前 15 分钟</option>
              <option :value="30">提前 30 分钟</option>
              <option :value="60">提前 1 小时</option>
              <option :value="120">提前 2 小时</option>
              <option :value="1440">提前 1 天</option>
            </select>
            <input
              v-model="form.reminder_message"
              type="text"
              class="form-input"
              placeholder="提醒消息（可选）"
              maxlength="200"
            />
          </div>
        </div>

        <!-- Automated Email Follow-up -->
        <div class="form-group">
          <label>
            <input type="checkbox" v-model="form.enable_email" class="checkbox" />
            📧 生成后自动发送邮件
          </label>
          <div v-if="form.enable_email" class="email-options">
            <input
              v-model="form.email_to"
              type="email"
              class="form-input"
              placeholder="收件人邮箱"
            />
            <input
              v-model="form.email_subject"
              type="text"
              class="form-input"
              placeholder="邮件主题"
            />
            <textarea
              v-model="form.email_body"
              class="form-input"
              placeholder="邮件正文（支持HTML）"
              rows="3"
            ></textarea>
            <button class="btn btn-sm btn-outline" @click="handleTestEmail" :disabled="testingEmail">
              {{ testingEmail ? '发送中...' : '🧪 发送测试邮件' }}
            </button>
            <div v-if="emailTestResult" class="email-test-result" :class="emailTestResult.type">
              {{ emailTestResult.message }}
            </div>
          </div>
        </div>

        <!-- Status Display -->
        <div v-if="previewText" class="schedule-preview">
          <div class="preview-label">📋 任务预览</div>
          <div class="preview-text">{{ previewText }}</div>
        </div>

        <!-- Error -->
        <div v-if="error" class="error-msg">{{ error }}</div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="$emit('close')">取消</button>
        <button class="btn btn-primary" @click="handleCreate" :disabled="!isValid || loading">
          {{ loading ? '创建中...' : '✅ 创建定时任务' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, ref } from 'vue'
import { api } from '../api/client'

const props = defineProps<{
  show?: boolean
  taskId?: string
  taskName?: string
}>()

const emit = defineEmits(['close', 'created'])

// ── Constants ────────────────────────────────────────────────────────────────
const weekdays = [
  { label: '周一', value: 'mon' },
  { label: '周二', value: 'tue' },
  { label: '周三', value: 'wed' },
  { label: '周四', value: 'thu' },
  { label: '周五', value: 'fri' },
  { label: '周六', value: 'sat' },
  { label: '周日', value: 'sun' },
]

const scheduleTabs = [
  { id: 'once', label: '一次性', icon: '⏰' },
  { id: 'daily', label: '每天', icon: '🔁' },
  { id: 'weekly', label: '每周', icon: '📅' },
  { id: 'monthly', label: '每月', icon: '🗓️' },
]

// ── State ────────────────────────────────────────────────────────────────────
const form = reactive({
  name: props.taskName ? `${props.taskName} - 定时发布` : '',
  schedule_type: 'once' as 'once' | 'daily' | 'weekly' | 'monthly',
  timezone: 'Asia/Shanghai',
  // once
  run_at_date: '',
  run_at_time: '09:00',
  // recurring
  day_of_week: 'mon',
  day_of_month: 1,
  hour: 9,
  minute: 0,
  // action
  action: 'generate' as 'generate' | 'export',
  // reminder
  enable_reminder: false,
  remind_before_minutes: 60,
  reminder_message: '',
  // email
  enable_email: false,
  email_to: '',
  email_subject: props.taskName ? `${props.taskName} 已生成` : '您的PPT已生成',
  email_body: props.taskName
    ? `<p>您好，</p><p>您的PPT「${props.taskName}」已生成，请查收附件。</p>`
    : '<p>您好，</p><p>您的PPT已生成，请查收附件。</p>',
})

const loading = ref(false)
const testingEmail = ref(false)
const emailTestResult = ref<{ type: 'success' | 'error'; message: string } | null>(null)
const error = ref('')

// ── Computed ────────────────────────────────────────────────────────────────
const minDate = computed(() => {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
})

const localTime = computed(() => {
  return new Date().toLocaleString('zh-CN', { timeZone: form.timezone })
})

const scheduledDisplayTime = computed(() => {
  if (!form.run_at_date || !form.run_at_time) return ''
  const dt = new Date(`${form.run_at_date}T${form.run_at_time}:00`)
  return dt.toLocaleString('zh-CN', { timeZone: form.timezone })
})

const isValid = computed(() => {
  if (!form.name.trim()) return false
  if (form.schedule_type === 'once') {
    if (!form.run_at_date || !form.run_at_time) return false
  }
  if (form.schedule_type === 'weekly' && !form.day_of_week) return false
  if (form.schedule_type === 'monthly' && !form.day_of_month) return false
  if (form.enable_email && !form.email_to.trim()) return false
  return true
})

const previewText = computed(() => {
  if (!form.name) return ''
  const typeLabels: Record<string, string> = {
    once: '一次性',
    daily: '每天',
    weekly: `每${weekdays.find(w => w.value === form.day_of_week)?.label}`,
    monthly: `每月${form.day_of_month}号`,
  }
  const timeStr = form.schedule_type === 'once'
    ? `${form.run_at_date} ${form.run_at_time}`
    : `${String(form.hour).padStart(2, '0')}:00`
  return `${form.name} | ${typeLabels[form.schedule_type]} ${timeStr} (${form.timezone.split('/')[1]})`
})

// ── Actions ────────────────────────────────────────────────────────────────
async function handleCreate() {
  if (!isValid.value) return
  loading.value = true
  error.value = ''

  try {
    // Build run_at for once type
    let run_at: string | undefined
    if (form.schedule_type === 'once') {
      const dt = new Date(`${form.run_at_date}T${form.run_at_time}:00`)
      run_at = dt.toISOString()
    }

    // Build email config
    const email_config = form.enable_email ? {
      to_email: form.email_to,
      subject: form.email_subject,
      body_html: form.email_body,
    } : undefined

    // Build generation params from current task if applicable
    const generation = form.action === 'generate' ? {
      user_request: form.name,
      slide_count: 10,
    } : undefined

    // Build export config
    const export_config = form.action === 'export' && props.taskId ? {
      task_ids: [props.taskId],
      format: 'pptx',
      quality: 'high',
    } : undefined

    const res = await api.schedule.create({
      name: form.name,
      action: form.action,
      schedule_type: form.schedule_type,
      run_at,
      day_of_week: form.schedule_type === 'weekly' ? form.day_of_week : undefined,
      day_of_month: form.schedule_type === 'monthly' ? form.day_of_month : undefined,
      hour: form.schedule_type !== 'once' ? form.hour : undefined,
      minute: 0,
      generation,
      export_config,
      email_config,
      user_id: 'default',
    })

    if (res.data.success) {
      emit('created', res.data.schedule)
      emit('close')
    } else {
      error.value = res.data.error || '创建失败'
    }
  } catch (e: any) {
    error.value = e?.response?.data?.detail || e.message || '创建失败'
  } finally {
    loading.value = false
  }
}

async function handleTestEmail() {
  if (!form.email_to) return
  testingEmail.value = true
  emailTestResult.value = null
  try {
    const res = await api.schedule.testEmail({
      to_email: form.email_to,
      to_name: '',
      subject: form.email_subject || 'RabAiMind 测试邮件',
      body_html: form.email_body || '<p>这是一封测试邮件。</p>',
    })
    emailTestResult.value = res.data.success
      ? { type: 'success', message: '✅ 测试邮件发送成功！' }
      : { type: 'error', message: `❌ 发送失败: ${res.data.error || '请检查SMTP配置'}` }
  } catch (e: any) {
    emailTestResult.value = { type: 'error', message: `❌ 发送失败: ${e.message}` }
  } finally {
    testingEmail.value = false
  }
}
</script>

<style scoped>
.schedule-modal {
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.schedule-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.tab-btn {
  flex: 1;
  min-width: 80px;
  padding: 8px 12px;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.tab-btn.active {
  background: var(--primary-color, #165DFF);
  color: #fff;
  border-color: var(--primary-color, #165DFF);
}

.form-group {
  margin-bottom: 14px;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 6px;
  color: var(--text-secondary, #6b7280);
}

.required {
  color: #ef4444;
}

.form-row {
  display: flex;
  gap: 12px;
}

.form-row .form-group {
  flex: 1;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color, #165DFF);
  box-shadow: 0 0 0 2px rgba(22, 93, 255, 0.1);
}

.form-hint {
  font-size: 11px;
  color: var(--text-muted, #9ca3af);
  margin-top: 4px;
}

.frequency-display {
  padding: 8px 12px;
  background: var(--bg-light, #f9fafb);
  border-radius: 8px;
  font-size: 14px;
  color: var(--text-secondary, #6b7280);
}

.weekday-selector,
.day-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.weekday-btn,
.day-btn {
  min-width: 40px;
  padding: 6px 10px;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.weekday-btn.active,
.day-btn.active {
  background: var(--primary-color, #165DFF);
  color: #fff;
  border-color: var(--primary-color, #165DFF);
}

.action-cards {
  display: flex;
  gap: 12px;
}

.action-card {
  flex: 1;
  padding: 12px;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.action-card.selected {
  border-color: var(--primary-color, #165DFF);
  background: rgba(22, 93, 255, 0.05);
}

.action-icon {
  display: block;
  font-size: 24px;
  margin-bottom: 4px;
}

.action-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 2px;
}

.action-desc {
  display: block;
  font-size: 11px;
  color: var(--text-muted, #9ca3af);
}

.checkbox {
  margin-right: 6px;
  vertical-align: middle;
}

.reminder-options,
.email-options {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.email-test-result {
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
}

.email-test-result.success {
  background: #d1fae5;
  color: #065f46;
}

.email-test-result.error {
  background: #fee2e2;
  color: #991b1b;
}

.schedule-preview {
  background: var(--bg-light, #f9fafb);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
  padding: 12px;
  margin-top: 8px;
}

.preview-label {
  font-size: 11px;
  color: var(--text-muted, #9ca3af);
  margin-bottom: 4px;
}

.preview-text {
  font-size: 13px;
  color: var(--text-primary, #111827);
  font-family: monospace;
}

.error-msg {
  color: #ef4444;
  font-size: 13px;
  margin-top: 8px;
  padding: 8px 12px;
  background: #fee2e2;
  border-radius: 6px;
}

.btn {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--primary-color, #165DFF);
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--bg-light, #f3f4f6);
  color: var(--text-primary, #374151);
}

.btn-outline {
  background: transparent;
  border: 1px solid var(--border-color, #e5e7eb);
  color: var(--text-secondary, #6b7280);
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

.btn-close {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: var(--text-muted, #9ca3af);
  padding: 4px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.modal-body {
  padding: 20px;
  max-height: 65vh;
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid var(--border-color, #e5e7eb);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-card {
  background: var(--bg-white, #fff);
  border-radius: 12px;
  width: 100%;
}
</style>
