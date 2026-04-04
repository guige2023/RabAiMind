<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-card">
      <div class="modal-header">
        <h3>{{ subscriber ? '修改周报订阅' : '订阅周报' }}</h3>
        <button class="btn-close" @click="$emit('close')">✕</button>
      </div>

      <div class="modal-body">
        <p class="modal-desc">
          每周定时收到您的演示文稿状态摘要，包括待审核提醒、内容更新提示、截止日期倒计时和 @提及动态。
        </p>

        <div class="form-group">
          <label>邮箱地址 *</label>
          <input v-model="form.email" type="email" placeholder="your@email.com" class="form-input" />
        </div>

        <div class="form-group">
          <label>姓名（可选）</label>
          <input v-model="form.name" type="text" placeholder="您的姓名" class="form-input" />
        </div>

        <div class="form-group">
          <label>发送时间</label>
          <div class="time-row">
            <select v-model="form.day_of_week" class="form-input">
              <option v-for="(day, i) in WEEKDAYS" :key="i" :value="i">{{ day }}</option>
            </select>
            <select v-model="form.hour" class="form-input">
              <option v-for="h in 24" :key="h-1" :value="h-1">{{ String(h-1).padStart(2,'0') }}:00</option>
            </select>
          </div>
        </div>

        <div class="form-preview">
          📧 每周 {{ WEEKDAYS[form.day_of_week] }} {{ String(form.hour).padStart(2,'0') }}:00
          发送至 <strong>{{ form.email || '...' }}</strong>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="$emit('close')">取消</button>
        <button class="btn btn-primary" @click="handleSave" :disabled="!form.email">
          {{ subscriber ? '保存设置' : '确认订阅' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import type { DigestSubscriber } from '../composables/useNotifications'

const props = defineProps<{
  subscriber?: DigestSubscriber | null
}>()

const emit = defineEmits<{
  close: []
  save: [params: any]
}>()

const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

const form = reactive({
  email: props.subscriber?.email || '',
  name: props.subscriber?.name || '',
  day_of_week: props.subscriber?.day_of_week ?? 1,
  hour: props.subscriber?.hour ?? 9,
  minute: props.subscriber?.minute ?? 0,
})

const handleSave = () => {
  if (!form.email) return
  emit('save', { ...form })
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-card {
  background: white;
  border-radius: 16px;
  width: 420px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 16px;
  border-bottom: 1px solid rgba(0,0,0,0.08);
}

.modal-header h3 { margin: 0; font-size: 16px; font-weight: 600; }

.btn-close {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: #666;
}

.modal-body { padding: 20px 24px; }

.modal-desc {
  font-size: 13px;
  color: #666;
  margin: 0 0 20px;
  line-height: 1.5;
}

.form-group { margin-bottom: 16px; }

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 6px;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid rgba(0,0,0,0.12);
  border-radius: 8px;
  font-size: 13px;
  box-sizing: border-box;
}

.form-input:focus { outline: none; border-color: #165DFF; }

.time-row {
  display: flex;
  gap: 10px;
}

.time-row .form-input {
  flex: 1;
}

.form-preview {
  background: rgba(22,93,255,0.05);
  border: 1px solid rgba(22,93,255,0.15);
  border-radius: 8px;
  padding: 12px;
  font-size: 13px;
  color: #333;
  text-align: center;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px 20px;
  border-top: 1px solid rgba(0,0,0,0.08);
}

.btn {
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  border: none;
}

.btn-primary { background: #165DFF; color: white; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-secondary { background: rgba(0,0,0,0.06); color: #333; }
</style>
