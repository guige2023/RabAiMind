<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-card">
      <div class="modal-header">
        <h3>{{ reminder ? '编辑提醒' : '设置审核提醒' }}</h3>
        <button class="btn-close" @click="$emit('close')">✕</button>
      </div>

      <div class="modal-body">
        <!-- Task ID -->
        <div class="form-group">
          <label>PPT 任务 ID</label>
          <input
            v-model="form.task_id"
            type="text"
            placeholder="输入任务 ID"
            class="form-input"
          />
        </div>

        <!-- Title -->
        <div class="form-group">
          <label>演示文稿标题</label>
          <input
            v-model="form.title"
            type="text"
            placeholder="如：Q1 季度汇报"
            class="form-input"
          />
        </div>

        <!-- Review Date -->
        <div class="form-group">
          <label>审核日期</label>
          <input
            v-model="form.review_date"
            type="datetime-local"
            class="form-input"
          />
        </div>

        <!-- Remind Before -->
        <div class="form-group">
          <label>提前提醒</label>
          <select v-model="form.remind_before_hours" class="form-input">
            <option :value="1">1 小时前</option>
            <option :value="2">2 小时前</option>
            <option :value="6">6 小时前</option>
            <option :value="12">12 小时前</option>
            <option :value="24">1 天前</option>
            <option :value="48">2 天前</option>
            <option :value="72">3 天前</option>
          </select>
        </div>

        <!-- Notes -->
        <div class="form-group">
          <label>备注（可选）</label>
          <textarea
            v-model="form.notes"
            placeholder="审核要点..."
            class="form-input"
            rows="3"
          ></textarea>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="$emit('close')">取消</button>
        <button class="btn btn-primary" @click="handleSave" :disabled="!isValid">
          {{ reminder ? '保存' : '创建提醒' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue'
import type { Reminder } from '../composables/useNotifications'

const props = defineProps<{
  reminder?: Reminder | null
}>()

const emit = defineEmits<{
  close: []
  save: [params: any]
}>()

const form = reactive({
  task_id: props.reminder?.task_id || '',
  title: props.reminder?.title || '',
  review_date: props.reminder?.review_date
    ? new Date(props.reminder.review_date).toISOString().slice(0, 16)
    : '',
  remind_before_hours: props.reminder?.remind_before_hours || 24,
  notes: props.reminder?.notes || '',
})

const isValid = computed(() => form.task_id && form.title && form.review_date)

const handleSave = () => {
  if (!isValid.value) return
  emit('save', { ...form, review_date: new Date(form.review_date).toISOString() })
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
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 16px;
  border-bottom: 1px solid rgba(0,0,0,0.08);
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.btn-close {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: #666;
  padding: 4px;
}

.modal-body {
  padding: 20px 24px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #333;
  margin-bottom: 6px;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid rgba(0,0,0,0.12);
  border-radius: 8px;
  font-size: 13px;
  box-sizing: border-box;
  background: white;
}

.form-input:focus {
  outline: none;
  border-color: #165DFF;
}

textarea.form-input {
  resize: vertical;
  min-height: 60px;
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

.btn-primary {
  background: #165DFF;
  color: white;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: rgba(0,0,0,0.06);
  color: #333;
}
</style>
