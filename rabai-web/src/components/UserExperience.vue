<template>
  <Teleport to="body">
    <!-- Toast Notifications -->
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast"
          :class="toast.type"
        >
          <span class="toast-icon">{{ getToastIcon(toast.type) }}</span>
          <span class="toast-message">{{ toast.message }}</span>
          <button class="toast-close" @click="removeToast(toast.id)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>

    <!-- Loading Overlay -->
    <Transition name="fade">
      <div v-if="showLoading" class="loading-overlay">
        <div class="loading-content">
          <div class="loading-spinner"></div>
          <p class="loading-text">{{ loadingText }}</p>
        </div>
      </div>
    </Transition>

    <!-- Confirm Dialog -->
    <Transition name="fade">
      <div v-if="showConfirm" class="confirm-overlay" @click="cancelConfirm">
        <div class="confirm-dialog" @click.stop>
          <div class="confirm-icon">{{ confirmConfig.icon }}</div>
          <h3 class="confirm-title">{{ confirmConfig.title }}</h3>
          <p class="confirm-message">{{ confirmConfig.message }}</p>
          <div class="confirm-actions">
            <button class="btn-cancel" @click="cancelConfirm">
              {{ confirmConfig.cancelText || '取消' }}
            </button>
            <button class="btn-confirm" :class="confirmConfig.type" @click="confirmConfirm">
              {{ confirmConfig.confirmText || '确定' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration: number
}

interface ConfirmConfig {
  icon: string
  title: string
  message: string
  type: 'primary' | 'danger'
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void
  onCancel?: () => void
}

const toasts = ref<Toast[]>([])
const showLoading = ref(false)
const loadingText = ref('加载中...')
const showConfirm = ref(false)
const confirmConfig = reactive<ConfirmConfig>({
  icon: '❓',
  title: '确认',
  message: '确定要执行此操作吗？',
  type: 'primary'
})

// Toast methods
const showToast = (
  message: string,
  type: Toast['type'] = 'info',
  duration: number = 3000
): string => {
  const id = `toast_${Date.now()}`
  const toast: Toast = { id, type, message, duration }
  toasts.value.push(toast)

  if (duration > 0) {
    setTimeout(() => {
      removeToast(id)
    }, duration)
  }

  return id
}

const removeToast = (id: string) => {
  toasts.value = toasts.value.filter(t => t.id !== id)
}

const getToastIcon = (type: Toast['type']): string => {
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  }
  return icons[type]
}

// Loading methods
const showLoadingWithText = (text: string = '加载中...') => {
  loadingText.value = text
  showLoading.value = true
}

const hideLoading = () => {
  showLoading.value = false
}

// Confirm methods
const showConfirmDialog = (config: Omit<ConfirmConfig, 'onConfirm' | 'onCancel'>): Promise<boolean> => {
  Object.assign(confirmConfig, config)
  showConfirm.value = true

  return new Promise((resolve) => {
    confirmConfig.onConfirm = () => {
      showConfirm.value = false
      resolve(true)
    }
    confirmConfig.onCancel = () => {
      showConfirm.value = false
      resolve(false)
    }
  })
}

const confirmConfirm = () => {
  confirmConfig.onConfirm?.()
}

const cancelConfirm = () => {
  confirmConfig.onCancel?.()
}

// Expose methods
defineExpose({
  showToast,
  removeToast,
  showLoading: showLoadingWithText,
  hideLoading,
  showConfirm: showConfirmDialog,
  success: (msg: string, duration?: number) => showToast(msg, 'success', duration),
  error: (msg: string, duration?: number) => showToast(msg, 'error', duration),
  warning: (msg: string, duration?: number) => showToast(msg, 'warning', duration),
  info: (msg: string, duration?: number) => showToast(msg, 'info', duration)
})
</script>

<style scoped>
/* Toast */
.toast-container {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 360px;
}

.toast {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease;
}

:global(.dark) .toast {
  background: #1a1a1a;
}

.toast.success { border-left: 4px solid #00C850; }
.toast.error { border-left: 4px solid #FF3B30; }
.toast.warning { border-left: 4px solid #FF9500; }
.toast.info { border-left: 4px solid #165DFF; }

.toast-icon {
  font-size: 18px;
}

.toast-message {
  flex: 1;
  font-size: 14px;
  color: #333;
}

:global(.dark) .toast-message {
  color: #fff;
}

.toast-close {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.toast-close:hover {
  background: #f0f0f0;
}

.toast-close svg {
  width: 14px;
  height: 14px;
  color: #999;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.toast-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* Loading Overlay */
.loading-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-content {
  background: white;
  padding: 32px 48px;
  border-radius: 16px;
  text-align: center;
}

:global(.dark) .loading-content {
  background: #1a1a1a;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #f0f0f0;
  border-top-color: #165DFF;
  border-radius: 50%;
  margin: 0 auto 16px;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  color: #666;
  font-size: 14px;
}

:global(.dark) .loading-text {
  color: #aaa;
}

/* Confirm Dialog */
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 24px;
}

.confirm-dialog {
  background: white;
  border-radius: 16px;
  padding: 28px;
  max-width: 360px;
  width: 100%;
  text-align: center;
}

:global(.dark) .confirm-dialog {
  background: #1a1a1a;
}

.confirm-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.confirm-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

:global(.dark) .confirm-title {
  color: #fff;
}

.confirm-message {
  font-size: 14px;
  color: #666;
  margin-bottom: 24px;
  line-height: 1.5;
}

:global(.dark) .confirm-message {
  color: #aaa;
}

.confirm-actions {
  display: flex;
  gap: 12px;
}

.btn-cancel,
.btn-confirm {
  flex: 1;
  padding: 12px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  border: 1px solid #e0e0e0;
  background: transparent;
  color: #666;
}

.btn-cancel:hover {
  background: #f5f5f5;
}

.btn-confirm {
  border: none;
  background: #165DFF;
  color: white;
}

.btn-confirm:hover {
  background: #0d47e6;
}

.btn-confirm.danger {
  background: #FF3B30;
}

.btn-confirm.danger:hover {
  background: #d63027;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
