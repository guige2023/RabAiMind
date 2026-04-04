<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-card">
      <div class="modal-header">
        <h3>设置截止日期</h3>
        <button class="btn-close" @click="$emit('close')">✕</button>
      </div>

      <div class="modal-body">
        <div class="form-group">
          <label>PPT 任务 ID</label>
          <input v-model="form.task_id" type="text" placeholder="输入任务 ID" class="form-input" />
        </div>
        <div class="form-group">
          <label>标题</label>
          <input v-model="form.title" type="text" placeholder="如：Q1 汇报截止" class="form-input" />
        </div>
        <div class="form-group">
          <label>截止时间</label>
          <input v-model="form.deadline" type="datetime-local" class="form-input" />
        </div>
        <div class="form-group">
          <label>提前提醒（小时）</label>
          <div class="checkbox-group">
            <label v-for="h in [1, 2, 6, 12, 24, 48, 72]" :key="h" class="checkbox-label">
              <input type="checkbox" :value="h" v-model="form.notification_hours" />
              {{ h }}h
            </label>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="$emit('close')">取消</button>
        <button class="btn btn-primary" @click="handleSave" :disabled="!isValid">创建</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue'

const emit = defineEmits<{
  close: []
  save: [params: any]
}>()

const form = reactive({
  task_id: '',
  title: '',
  deadline: '',
  notification_hours: [24, 1],
})

const isValid = computed(() => form.task_id && form.title && form.deadline)

const handleSave = () => {
  if (!isValid.value) return
  emit('save', { ...form, deadline: new Date(form.deadline).toISOString() })
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

.checkbox-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  cursor: pointer;
  padding: 4px 8px;
  background: rgba(0,0,0,0.04);
  border-radius: 6px;
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
