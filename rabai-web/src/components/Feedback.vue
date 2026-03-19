<template>
  <div class="feedback-trigger" @click="showFeedback = true">
    <span class="feedback-icon">💬</span>
    <span class="feedback-text">反馈</span>
  </div>

  <!-- 反馈弹窗 -->
  <Teleport to="body">
    <div v-if="showFeedback" class="feedback-overlay" @click.self="closeFeedback">
      <div class="feedback-modal">
        <div class="feedback-header">
          <h3>提交反馈</h3>
          <button class="close-btn" @click="closeFeedback">×</button>
        </div>

        <div class="feedback-body">
          <div class="feedback-type">
            <button
              v-for="type in feedbackTypes"
              :key="type.value"
              class="type-btn"
              :class="{ active: formData.type === type.value }"
              @click="formData.type = type.value"
            >
              {{ type.icon }} {{ type.label }}
            </button>
          </div>

          <div class="feedback-field">
            <label>描述问题或建议</label>
            <textarea
              v-model="formData.content"
              placeholder="请详细描述您遇到的问题或建议..."
              rows="4"
            ></textarea>
          </div>

          <div class="feedback-field">
            <label>联系方式（选填）</label>
            <input
              v-model="formData.contact"
              type="text"
              placeholder="邮箱或微信"
            />
          </div>

          <div v-if="submitStatus === 'success'" class="feedback-success">
            ✅ 感谢您的反馈！我们会尽快处理。
          </div>

          <div v-if="submitStatus === 'error'" class="feedback-error">
            ❌ 提交失败，请稍后重试。
          </div>
        </div>

        <div class="feedback-footer">
          <button class="btn btn-secondary" @click="closeFeedback">取消</button>
          <button
            class="btn btn-primary"
            :disabled="!canSubmit || submitting"
            @click="submitFeedback"
          >
            {{ submitting ? '提交中...' : '提交反馈' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'

const showFeedback = ref(false)
const submitting = ref(false)
const submitStatus = ref<'idle' | 'success' | 'error'>('idle')

const feedbackTypes = [
  { value: 'bug', label: '问题', icon: '🐛' },
  { value: 'suggestion', label: '建议', icon: '💡' },
  { value: 'other', label: '其他', icon: '📝' }
]

const formData = reactive({
  type: 'bug',
  content: '',
  contact: ''
})

const canSubmit = computed(() => {
  return formData.content.trim().length >= 10
})

const closeFeedback = () => {
  showFeedback.value = false
  // Reset form after closing
  setTimeout(() => {
    formData.content = ''
    formData.contact = ''
    submitStatus.value = 'idle'
  }, 300)
}

const submitFeedback = async () => {
  if (!canSubmit.value || submitting.value) return

  submitting.value = true

  // Simulate API call - save to localStorage for demo
  try {
    const feedback = {
      id: Date.now(),
      type: formData.type,
      content: formData.content,
      contact: formData.contact,
      createdAt: new Date().toISOString()
    }

    const saved = localStorage.getItem('user_feedback') || '[]'
    const list = JSON.parse(saved)
    list.push(feedback)
    localStorage.setItem('user_feedback', JSON.stringify(list))

    submitStatus.value = 'success'

    // Auto close after success
    setTimeout(() => {
      closeFeedback()
    }, 2000)
  } catch (error) {
    submitStatus.value = 'error'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.feedback-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  color: #fff;
  font-size: 14px;
}

.feedback-trigger:hover {
  background: rgba(255, 255, 255, 0.2);
}

.feedback-icon {
  font-size: 16px;
}

.feedback-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.feedback-modal {
  background: var(--white);
  border-radius: 16px;
  width: 90%;
  max-width: 480px;
  max-height: 90vh;
  overflow: auto;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.feedback-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--gray-200);
}

.feedback-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--gray-900);
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: var(--gray-100);
  border-radius: 50%;
  font-size: 20px;
  color: var(--gray-500);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background: var(--gray-200);
  color: var(--gray-700);
}

.feedback-body {
  padding: 24px;
}

.feedback-type {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.type-btn {
  flex: 1;
  padding: 10px;
  border: 2px solid var(--gray-200);
  background: var(--white);
  border-radius: 8px;
  font-size: 14px;
  color: var(--gray-500);
  cursor: pointer;
  transition: all 0.2s;
}

.type-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.type-btn.active {
  border-color: var(--primary);
  background: rgba(22, 93, 255, 0.05);
  color: var(--primary);
}

.feedback-field {
  margin-bottom: 16px;
}

.feedback-field label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--gray-700);
  margin-bottom: 8px;
}

.feedback-field textarea,
.feedback-field input {
  width: 100%;
  padding: 12px;
  border: 2px solid var(--gray-200);
  border-radius: 8px;
  font-size: 14px;
  color: var(--gray-900);
  background: var(--white);
  transition: all 0.2s;
}

.feedback-field textarea:focus,
.feedback-field input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(22, 93, 255, 0.1);
}

.feedback-field textarea::placeholder,
.feedback-field input::placeholder {
  color: var(--gray-300);
}

.feedback-success {
  padding: 12px;
  background: #E8F5E9;
  color: #2E7D32;
  border-radius: 8px;
  text-align: center;
  margin-bottom: 16px;
}

.feedback-error {
  padding: 12px;
  background: #FFEBEE;
  color: #C62828;
  border-radius: 8px;
  text-align: center;
  margin-bottom: 16px;
}

.feedback-footer {
  display: flex;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--gray-200);
  justify-content: flex-end;
}

.feedback-footer .btn {
  padding: 10px 20px;
}
</style>
