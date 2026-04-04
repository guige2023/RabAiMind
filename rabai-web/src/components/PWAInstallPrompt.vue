<template>
  <Teleport to="body">
    <Transition name="slide-up">
      <div v-if="showBanner" class="pwa-install-prompt" role="dialog" aria-label="安装 RabAi Mind 应用">
        <div class="pwa-install-content">
          <div class="pwa-install-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="pwa-install-text">
            <span class="pwa-install-title">安装 RabAi Mind App</span>
            <span class="pwa-install-desc">更快的加载速度，离线也能使用</span>
          </div>
          <div class="pwa-install-actions">
            <button class="pwa-btn pwa-btn-primary" @click="handleInstall">
              安装
            </button>
            <button class="pwa-btn pwa-btn-ghost" @click="handleDismiss" aria-label="关闭">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
                <line x1="18" y1="6" x2="6" y2="18" stroke-width="2"/>
                <line x1="6" y1="6" x2="18" y2="18" stroke-width="2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Offline indicator -->
    <Transition name="fade">
      <div v-if="isOffline" class="offline-indicator">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
          <path d="M1 1L23 23" stroke-width="2"/>
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" stroke-width="2" stroke-linecap="round"/>
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" stroke-width="2" stroke-linecap="round"/>
          <path d="M10.71 5.05A16 16 0 0 1 22.56 9" stroke-width="2" stroke-linecap="round"/>
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" stroke-width="2" stroke-linecap="round"/>
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" stroke-width="2" stroke-linecap="round"/>
          <line x1="12" y1="20" x2="12.01" y2="20" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <span>离线模式</span>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { usePWAInstall } from '../composables/usePWAInstall'

const { canInstall, installApp, dismissInstall } = usePWAInstall()

const showBanner = ref(false)
const isOffline = ref(!navigator.onLine)

let dismissTimeout: ReturnType<typeof setTimeout> | null = null

const handleInstall = async () => {
  const success = await installApp()
  if (success) {
    showBanner.value = false
  }
}

const handleDismiss = () => {
  dismissInstall()
  showBanner.value = false
}

onMounted(() => {
  // Show banner after a short delay if conditions are met
  setTimeout(() => {
    if (canInstall.value) {
      showBanner.value = true
      // Auto-dismiss after 30 seconds
      dismissTimeout = setTimeout(() => {
        handleDismiss()
      }, 30000)
    }
  }, 2000)
})

onUnmounted(() => {
  if (dismissTimeout) clearTimeout(dismissTimeout)
})

// Watch for online/offline changes
const handleOnline = () => {
  isOffline.value = false
}

const handleOffline = () => {
  isOffline.value = true
}

onMounted(() => {
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
})

onUnmounted(() => {
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
})
</script>

<style scoped>
.pwa-install-prompt {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-top: 1px solid rgba(22, 93, 255, 0.3);
  padding: 12px 16px;
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(12px);
}

.pwa-install-content {
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 960px;
  margin: 0 auto;
}

.pwa-install-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #165DFF, #7030FF);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.pwa-install-icon svg {
  width: 22px;
  height: 22px;
}

.pwa-install-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.pwa-install-title {
  font-size: 14px;
  font-weight: 600;
  color: white;
}

.pwa-install-desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.pwa-install-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.pwa-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.pwa-btn-primary {
  background: #165DFF;
  color: white;
}

.pwa-btn-primary:hover {
  background: #0d47e1;
  transform: translateY(-1px);
}

.pwa-btn-ghost {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  padding: 8px;
  border-radius: 8px;
}

.pwa-btn-ghost:hover {
  background: rgba(255, 255, 255, 0.15);
  color: white;
}

/* Offline indicator */
.offline-indicator {
  position: fixed;
  top: 70px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9998;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #ff9800;
  color: white;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 4px 16px rgba(255, 152, 0, 0.4);
}

/* Transitions */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 480px) {
  .pwa-install-desc {
    display: none;
  }
}
</style>
