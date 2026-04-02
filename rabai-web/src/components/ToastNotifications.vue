<template>
  <Teleport to="body">
    <TransitionGroup name="toast" :tag="'div'" class="toast-container" :class="positionClass">
      <div
        v-for="message in visibleMessages"
        :key="message.id"
        class="toast"
        :class="[`toast-${message.type}`, { 'toast-with-action': message.action }]"
      >
        <div class="toast-icon">
          <!-- Success -->
          <svg v-if="message.type === 'success'" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <path d="M22 4L12 14.01l-3-3"/>
          </svg>
          <!-- Error -->
          <svg v-else-if="message.type === 'error'" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10"/>
            <path d="M15 9l-6 6M9 9l6 6"/>
          </svg>
          <!-- Warning -->
          <svg v-else-if="message.type === 'warning'" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <!-- Info -->
          <svg v-else-if="message.type === 'info'" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <!-- Loading -->
          <div v-else-if="message.type === 'loading'" class="toast-loading">
            <div class="spinner"></div>
          </div>
        </div>

        <div class="toast-content">
          <div class="toast-title">{{ message.title }}</div>
          <div class="toast-message">{{ message.message }}</div>
        </div>

        <button v-if="message.action" class="toast-action" @click="handleAction(message)">
          {{ message.action.label }}
        </button>

        <button class="toast-close" @click="removeMessage(message.id)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useInteractionFeedback, type FeedbackMessage } from '../composables/useInteractionFeedback'

const { messages, removeMessage, config } = useInteractionFeedback()

const positionClass = computed(() => `toast-position-${config.value.position || 'top'}`)

const visibleMessages = computed(() => {
  const max = config.value.maxToasts || 5
  return messages.value.slice(0, max)
})

const handleAction = (message: FeedbackMessage) => {
  if (message.action) {
    message.action.handler()
  }
}

// 键盘快捷键关闭
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && messages.value.length > 0) {
    removeMessage(messages.value[0].id)
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.toast-container {
  position: fixed;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  pointer-events: none;
}

.toast-container.toast-position-top {
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  align-items: center;
}

.toast-container.toast-position-center {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  align-items: center;
}

.toast-container.toast-position-bottom {
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  align-items: center;
}

.toast {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  pointer-events: auto;
  max-width: 400px;
  min-width: 300px;
  animation: toastSlideIn 0.3s ease;
}

:global(.dark) .toast {
  background: #1a1a1a;
  border: 1px solid #333;
}

@keyframes toastSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.toast-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
}

.toast-icon svg {
  width: 24px;
  height: 24px;
}

.toast-success .toast-icon svg {
  color: #52c41a;
}

.toast-error .toast-icon svg {
  color: #ff4d4f;
}

.toast-warning .toast-icon svg {
  color: #faad14;
}

.toast-info .toast-icon svg {
  color: #1890ff;
}

.toast-loading .toast-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #e0e0e0;
  border-top-color: #165DFF;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

:global(.dark) .spinner {
  border-color: #444;
  border-top-color: #165DFF;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.toast-content {
  flex: 1;
  min-width: 0;
}

.toast-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
}

:global(.dark) .toast-title {
  color: #fff;
}

.toast-message {
  font-size: 13px;
  color: #666;
  line-height: 1.4;
}

:global(.dark) .toast-message {
  color: #aaa;
}

.toast-with-action {
  padding-right: 12px;
}

.toast-action {
  flex-shrink: 0;
  padding: 6px 12px;
  background: #165DFF;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.toast-action:hover {
  background: #0d45cc;
}

.toast-close {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.2s;
}

.toast-close:hover {
  background: #f0f0f0;
}

:global(.dark) .toast-close:hover {
  background: #333;
}

.toast-close svg {
  width: 14px;
  height: 14px;
  color: #999;
}

/* Transition */
.toast-enter-active {
  animation: toastSlideIn 0.3s ease;
}

.toast-leave-active {
  animation: toastSlideOut 0.2s ease;
}

@keyframes toastSlideOut {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-10px);
  }
}
</style>
