<template>
  <div class="mobile-nav-drawer" :class="{ open: isOpen }">
    <!-- Backdrop -->
    <Transition name="fade">
      <div v-if="isOpen" class="drawer-backdrop" @click="close"></div>
    </Transition>

    <!-- Drawer -->
    <Transition name="slide">
      <div v-if="isOpen" class="drawer-panel">
        <!-- Header -->
        <div class="drawer-header">
          <div class="user-info">
            <div class="user-avatar">👤</div>
            <div class="user-details">
              <span class="user-name">用户</span>
              <span class="user-status">欢迎使用</span>
            </div>
          </div>
          <button class="close-btn" @click="close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Navigation -->
        <nav class="drawer-nav">
          <router-link
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="nav-item"
            @click="close"
          >
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="nav-label">{{ item.label }}</span>
          </router-link>
        </nav>

        <!-- Quick Actions -->
        <div class="drawer-actions">
          <button class="action-btn" @click="handleQuickAction('create')">
            <span>✨</span> 创建PPT
          </button>
          <button class="action-btn" @click="handleQuickAction('search')">
            <span>🔍</span> 搜索
          </button>
        </div>

        <!-- Footer -->
        <div class="drawer-footer">
          <button class="theme-toggle" @click="toggleTheme">
            <span>{{ isDark ? '☀️' : '🌙' }}</span>
            {{ isDark ? '亮色模式' : '深色模式' }}
          </button>
          <button class="lang-toggle">
            <span>🌐</span> 中文
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isOpen = ref(false)
const isDark = ref(false)

const navItems = [
  { path: '/', label: '首页', icon: '🏠' },
  { path: '/create', label: '创建PPT', icon: '✨' },
  { path: '/templates', label: '模板市场', icon: '📋' },
  { path: '/media', label: '素材库', icon: '🖼️' },
  { path: '/history', label: '历史记录', icon: '📜' }
]

const open = () => { isOpen.value = true }
const close = () => { isOpen.value = false }

const toggleTheme = () => {
  isDark.value = !isDark.value
  document.body.classList.toggle('dark', isDark.value)
}

const handleQuickAction = (action: string) => {
  close()
  if (action === 'create') {
    router.push('/create')
  } else if (action === 'search') {
    // 触发全局搜索
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))
  }
}

defineExpose({ open, close })
</script>

<style scoped>
.mobile-nav-drawer {
  display: none;
}

@media (max-width: 768px) {
  .mobile-nav-drawer {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 9999;
  }
}

/* Backdrop */
.drawer-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
}

/* Panel */
.drawer-panel {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 280px;
  background: white;
  display: flex;
  flex-direction: column;
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.15);
}

:global(.dark) .drawer-panel {
  background: #1a1a1a;
}

/* Header */
.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

:global(.dark) .drawer-header {
  border-color: #333;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

:global(.dark) .user-name {
  color: #fff;
}

.user-status {
  font-size: 12px;
  color: #888;
}

.close-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: #f5f5f5;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

:global(.dark) .close-btn {
  background: #333;
}

.close-btn svg {
  width: 18px;
  height: 18px;
  color: #666;
}

/* Navigation */
.drawer-nav {
  flex: 1;
  padding: 16px 12px;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 12px;
  text-decoration: none;
  color: #333;
  transition: all 0.2s;
  margin-bottom: 4px;
}

:global(.dark) .nav-item {
  color: #fff;
}

.nav-item:hover {
  background: #f5f5f5;
}

:global(.dark) .nav-item:hover {
  background: #2a2a2a;
}

.nav-item.router-link-active {
  background: #667eea;
  color: white;
}

.nav-icon {
  font-size: 20px;
}

.nav-label {
  font-size: 15px;
  font-weight: 500;
}

/* Actions */
.drawer-actions {
  display: flex;
  gap: 12px;
  padding: 16px;
  border-top: 1px solid #e0e0e0;
}

:global(.dark) .drawer-actions {
  border-color: #333;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border: none;
  background: #f5f5f5;
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

:global(.dark) .action-btn {
  background: #2a2a2a;
  color: #fff;
}

.action-btn:hover {
  background: #667eea;
  color: white;
}

/* Footer */
.drawer-footer {
  display: flex;
  gap: 12px;
  padding: 16px;
  border-top: 1px solid #e0e0e0;
}

:global(.dark) .drawer-footer {
  border-color: #333;
}

.theme-toggle,
.lang-toggle {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  border: 1px solid #e0e0e0;
  background: transparent;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
}

:global(.dark) .theme-toggle,
:global(.dark) .lang-toggle {
  border-color: #444;
  color: #fff;
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

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}
</style>
