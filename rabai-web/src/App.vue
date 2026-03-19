<template>
  <div class="app">
    <!-- Skip to main content link for accessibility -->
    <a href="#main-content" class="skip-link">跳转到主要内容</a>

    <!-- Global Search -->
    <GlobalSearch ref="globalSearchRef" />
    <ToastNotifications />
    <UserOnboarding />
    <AIChatPanel />
    <MobileNavDrawer ref="mobileNavRef" />
    <UserExperience ref="uxRef" />
    <HelpCenter ref="helpRef" />

    <!-- Initial Loading -->
    <div v-if="isLoading" class="app-loading">
      <div class="loading-logo">✨</div>
      <div class="loading-bar">
        <div class="loading-progress"></div>
      </div>
    </div>

    <template v-else>
      <header class="header">
        <div class="header-content">
          <router-link to="/" class="logo">
            <span class="logo-icon">✨</span>
            <span class="logo-text">RabAi Mind</span>
          </router-link>
          <!-- Mobile Menu Button -->
          <button class="mobile-menu-btn" @click="openMobileNav">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <nav class="nav">
            <router-link to="/" class="nav-link">首页</router-link>
            <router-link to="/create" class="nav-link">创建PPT</router-link>
            <router-link to="/templates" class="nav-link">模板市场</router-link>
            <router-link to="/media" class="nav-link">素材库</router-link>
            <router-link to="/history" class="nav-link">历史</router-link>
          </nav>
          <button class="search-trigger" @click="openGlobalSearch" title="搜索 (Ctrl+K)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <span class="search-hint">Ctrl+K</span>
          </button>
          <LangSwitch />
          <ThemeSwitch />
          <Feedback />
          <button class="help-btn" @click="openHelp" title="帮助">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <path d="M12 17h.01"/>
            </svg>
          </button>
        </div>
      </header>
      <main class="main" id="main-content" tabindex="-1">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
      <footer class="footer">
        <p>© 2026 RabAi Mind · AI PPT 生成平台</p>
      </footer>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import LangSwitch from './components/LangSwitch.vue'
import ThemeSwitch from './components/ThemeSwitch.vue'
import Feedback from './components/Feedback.vue'
import GlobalSearch from './components/GlobalSearch.vue'
import UserOnboarding from './components/UserOnboarding.vue'
import AIChatPanel from './components/AIChatPanel.vue'
import MobileNavDrawer from './components/MobileNavDrawer.vue'
import UserExperience from './components/UserExperience.vue'
import HelpCenter from './components/HelpCenter.vue'
import ToastNotifications from './components/ToastNotifications.vue'

const isLoading = ref(true)
const globalSearchRef = ref<InstanceType<typeof GlobalSearch> | null>(null)
const mobileNavRef = ref<InstanceType<typeof MobileNavDrawer> | null>(null)
const uxRef = ref<InstanceType<typeof UserExperience> | null>(null)
const helpRef = ref<InstanceType<typeof HelpCenter> | null>(null)

const openGlobalSearch = () => {
  globalSearchRef.value?.openSearch()
}

const openMobileNav = () => {
  mobileNavRef.value?.open()
}

const openHelp = () => {
  helpRef.value?.open()
}

onMounted(() => {
  // Simulate initial load
  setTimeout(() => {
    isLoading.value = false
  }, 500)
})
</script>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Skip Link - Accessibility */
.skip-link {
  position: absolute;
  top: -100px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  background: var(--primary);
  color: white;
  text-decoration: none;
  border-radius: 0 0 8px 8px;
  z-index: 9999;
  font-weight: 500;
  transition: top 0.3s;
}

.skip-link:focus {
  top: 0;
  outline: none;
}

/* App Loading */
.app-loading {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  background: #f5f5f5;
}

.loading-logo {
  font-size: 48px;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

.loading-bar {
  width: 200px;
  height: 4px;
  background: #e5e5e5;
  border-radius: 2px;
  overflow: hidden;
}

.loading-progress {
  height: 100%;
  width: 30%;
  background: linear-gradient(90deg, #165DFF, #5AC8FA);
  border-radius: 2px;
  animation: loading 1s ease-in-out infinite;
}

@keyframes loading {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(400%); }
}

.header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(22, 93, 255, 0.1);
}

:global(.dark) .header {
  background: rgba(26, 26, 26, 0.95);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
}

.logo-icon {
  font-size: 28px;
}

.logo-text {
  font-size: 22px;
  font-weight: 700;
  background: linear-gradient(135deg, #165DFF 0%, #5AC8FA 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav {
  display: flex;
  gap: 32px;
}

.nav-link {
  font-size: 15px;
  color: #666;
  text-decoration: none;
  transition: color 0.2s;
  position: relative;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: #165DFF;
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, #165DFF, #5AC8FA);
  transition: width 0.3s;
}

.nav-link:hover::after,
.nav-link.router-link-active::after {
  width: 100%;
}

/* Mobile Menu Button */
.mobile-menu-btn {
  display: none;
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  align-items: center;
  justify-content: center;
}

.mobile-menu-btn svg {
  width: 24px;
  height: 24px;
  color: #333;
}

:global(.dark) .mobile-menu-btn svg {
  color: #fff;
}

@media (max-width: 768px) {
  .mobile-menu-btn {
    display: flex;
  }

  .nav {
    display: none;
  }
}

.search-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  background: #f8f9fa;
  border-radius: 10px;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
}

.search-trigger:hover {
  background: #fff;
  border-color: #165DFF;
  color: #165DFF;
}

.search-trigger svg {
  width: 18px;
  height: 18px;
}

.search-hint {
  font-size: 12px;
  color: #888;
}

@media (max-width: 768px) {
  .search-hint {
    display: none;
  }
}

:global(.dark) .search-trigger {
  background: #2a2a2a;
  border-color: #444;
}

:global(.dark) .search-trigger:hover {
  background: #333;
}

.help-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.help-btn:hover {
  background: #f0f0f0;
}

.help-btn svg {
  width: 22px;
  height: 22px;
  color: #666;
}

:global(.dark) .help-btn:hover {
  background: #2a2a2a;
}

:global(.dark) .help-btn svg {
  color: #aaa;
}

@media (max-width: 768px) {
  .help-btn {
    display: none;
  }
}

.main {
  flex: 1;
}

.footer {
  padding: 24px;
  text-align: center;
  color: var(--gray-300);
  font-size: 14px;
  border-top: 1px solid var(--gray-200);
  background: var(--gray-100);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
