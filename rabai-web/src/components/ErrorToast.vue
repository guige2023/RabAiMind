<template>
  <Teleport to="body">
    <Transition name="toast">
      <div v-if="visible" class="error-toast" :class="type">
        <div class="toast-icon">
          <template v-if="type === 'error'">❌</template>
          <template v-else-if="type === 'warning'">⚠️</template>
          <template v-else-if="type === 'success'">✅</template>
          <template v-else>ℹ️</template>
        </div>
        <div class="toast-content">
          <div class="toast-title">{{ title }}</div>
          <div class="toast-message">{{ message }}</div>
          <div v-if="suggestions.length > 0" class="toast-suggestions">
            <div v-for="(suggestion, index) in suggestions" :key="index" class="suggestion">
              💡 {{ suggestion }}
            </div>
          </div>
        </div>
        <button class="toast-close" @click="close">✕</button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  visible: boolean
  type?: 'error' | 'warning' | 'info' | 'success'
  title?: string
  message: string
  suggestions?: string[]
  duration?: number
}

const props = withDefaults(defineProps<Props>(), {
  type: 'error',
  title: '操作失败',
  suggestions: () => [],
  duration: 5000
})

const emit = defineEmits(['close'])

const close = () => {
  emit('close')
}

// 自动关闭
watch(() => props.visible, (val) => {
  if (val && props.duration > 0) {
    setTimeout(() => {
      close()
    }, props.duration)
  }
})
</script>

<style scoped>
.error-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  max-width: 400px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  display: flex;
  gap: 12px;
  padding: 16px;
  z-index: 9999;
  border-left: 4px solid;
}

.error-toast.error {
  border-color: #EF4444;
}

.error-toast.warning {
  border-color: #F59E0B;
}

.error-toast.success {
  border-color: #10B981;
}

.error-toast.info {
  border-color: #3B82F6;
}

.toast-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.toast-content {
  flex: 1;
  min-width: 0;
}

.toast-title {
  font-weight: 600;
  font-size: 15px;
  color: #333;
  margin-bottom: 4px;
}

.toast-message {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

.toast-suggestions {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.suggestion {
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
}

.toast-close {
  background: none;
  border: none;
  font-size: 16px;
  color: #999;
  cursor: pointer;
  padding: 4px;
  flex-shrink: 0;
}

.toast-close:hover {
  color: #666;
}

/* 动画 */
.toast-enter-active {
  animation: slideIn 0.3s ease;
}

.toast-leave-active {
  animation: slideOut 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(100px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideOut {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(100px);
  }
}

/* 移动端 */
@media (max-width: 480px) {
  .error-toast {
    left: 16px;
    right: 16px;
    max-width: none;
  }
}
</style>
