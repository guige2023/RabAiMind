<template>
  <div class="app">
    <!-- Skip to main content link for accessibility -->
    <a href="#main-content" class="skip-link">{{ t('a11y.skipToContent') }}</a>

    <!-- Global Search -->
    <GlobalSearch ref="globalSearchRef" />
    <ToastNotifications />
    <UserOnboarding />
    <AIChatPanel />
    <MobileNavDrawer ref="mobileNavRef" />
    <UserExperience ref="uxRef" />
    <HelpCenter ref="helpRef" />

    <!-- Initial Loading -->
    <div v-if="isLoading" class="app-loading" role="status" :aria-label="t('loading')">
      <div class="loading-logo">✨</div>
      <div class="loading-bar">
        <div class="loading-progress"></div>
      </div>
    </div>

    <template v-else>
      <header class="header" role="banner">
        <div class="header-content">
          <router-link to="/" class="logo" aria-label="RabAi Mind - {{ t('nav.home') }}">
            <span class="logo-icon" aria-hidden="true">✨</span>
            <span class="logo-text">RabAi Mind</span>
          </router-link>
          <!-- Mobile Menu Button -->
          <button
            class="mobile-menu-btn"
            @click="openMobileNav"
            :aria-label="t('a11y.menu')"
            aria-controls="mobile-nav"
            :aria-expanded="false"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <nav class="nav" :aria-label="t('nav.home') + ' ' + t('nav.create')">
            <router-link to="/" class="nav-link" :aria-label="t('nav.home')">{{ t('nav.home') }}</router-link>
            <router-link to="/create" class="nav-link" :aria-label="t('nav.create')">{{ t('nav.create') }}</router-link>
            <router-link to="/templates" class="nav-link" :aria-label="t('nav.templates')">{{ t('nav.templates') }}</router-link>
            <router-link to="/media" class="nav-link" :aria-label="t('nav.media')">{{ t('nav.media') }}</router-link>
            <router-link to="/favorites" class="nav-link" :aria-label="t('nav.favorites')">
              <span>{{ t('nav.favorites') }}</span>
              <span class="nav-badge" v-if="favoritesCount > 0" :aria-label="`${favoritesCount}`">{{ favoritesCount }}</span>
            </router-link>
            <router-link to="/history" class="nav-link" :aria-label="t('nav.history')">{{ t('nav.history') }}</router-link>
          </nav>
          <button
            class="search-trigger"
            @click="openGlobalSearch"
            :aria-label="`${t('a11y.search')} (${t('a11y.searchHint')})`"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <span class="search-hint" aria-hidden="true">{{ t('a11y.searchHint') }}</span>
          </button>
          <LangSwitch />
          <ReduceMotionToggle />
          <ThemeSwitch />
          <Feedback />
          <button
            class="help-btn hide-mobile"
            @click="openHelp"
            :aria-label="t('a11y.help')"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <path d="M12 17h.01"/>
            </svg>
          </button>
          <!-- View Mode Toggle -->
          <button
            class="view-mode-toggle"
            @click="cycleViewMode"
            :aria-label="`{{ t('a11y.viewMode') }}: ${viewModeLabel}`"
          >
            <span class="view-mode-label" aria-hidden="true">{{ viewModeOptions.find(o => o.value === viewMode.value)?.label }}</span>
          </button>
        </div>
      </header>
      <main class="main" id="main-content" tabindex="-1" role="main">
        <router-view />
      </main>
      <footer class="footer" role="contentinfo">
        <p>{{ t('footer.copyright') }}</p>
      </footer>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import LangSwitch from './components/LangSwitch.vue'
import ThemeSwitch from './components/ThemeSwitch.vue'
import Feedback from './components/Feedback.vue'
import ReduceMotionToggle from './components/ReduceMotionToggle.vue'
import GlobalSearch from './components/GlobalSearch.vue'
import UserOnboarding from './components/UserOnboarding.vue'
import AIChatPanel from './components/AIChatPanel.vue'
import MobileNavDrawer from './components/MobileNavDrawer.vue'
import UserExperience from './components/UserExperience.vue'
import HelpCenter from './components/HelpCenter.vue'
import ToastNotifications from './components/ToastNotifications.vue'
import { useTemplateStore } from './composables/useTemplateStore'
import { useDeviceMode, initDeviceMode, getDeviceMode } from './composables/useDeviceMode'
import { useI18n } from './composables/useI18n'
import { useAccessibility } from './composables/useAccessibility'

const isLoading = ref(true)
const { t } = useI18n()
const { isReduceMotion, toggleReduceMotion } = useAccessibility()
const globalSearchRef = ref<InstanceType<typeof GlobalSearch> | null>(null)
const mobileNavRef = ref<InstanceType<typeof MobileNavDrawer> | null>(null)
const uxRef = ref<InstanceType<typeof UserExperience> | null>(null)
const helpRef = ref<InstanceType<typeof HelpCenter> | null>(null)

// Device mode
const deviceMode = getDeviceMode()
const { viewMode, effectiveMode } = deviceMode

// View mode toggle options
const viewModeOptions = [
  { value: 'auto' as const, label: 'A', title: '自动' },
  { value: 'desktop' as const, label: '🖥', title: '桌面视图' },
  { value: 'mobile' as const, label: '📱', title: '移动视图' }
]

const viewModeLabel = computed(() => {
  const opt = viewModeOptions.find(o => o.value === viewMode.value)
  return opt?.title || ''
})

const cycleViewMode = () => {
  const modes: Array<'auto' | 'desktop' | 'mobile'> = ['auto', 'desktop', 'mobile']
  const idx = modes.indexOf(viewMode.value)
  const next = modes[(idx + 1) % modes.length]
  deviceMode.setViewMode(next)
}

// Template store for favorites count
const templateStore = useTemplateStore()
const favoritesCount = computed(() => templateStore.favorites.value.size)

const openGlobalSearch = () => {
  globalSearchRef.value?.openSearch()
}

const openMobileNav = () => {
  mobileNavRef.value?.open()
}

const openHelp = (tab?: string) => {
  helpRef.value?.open(tab)
}

// Global keyboard shortcuts
const handleGlobalKeydown = (e: KeyboardEvent) => {
  // Ctrl/Cmd + ? or Ctrl/Cmd + / → open shortcuts tab in help
  if ((e.ctrlKey || e.metaKey) && (e.key === '?' || e.key === '/')) {
    e.preventDefault()
    openHelp('shortcuts')
  }
}

onMounted(() => {
  // Initialize device mode detection
  initDeviceMode()
  window.addEventListener('keydown', handleGlobalKeydown)

  // Load favorites
  templateStore.loadFavorites()

  // Simulate initial load
  setTimeout(() => {
    isLoading.value = false
  }, 500)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
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

.nav-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  margin-left: 4px;
  background: #FF4D4F;
  color: white;
  font-size: 10px;
  font-weight: 600;
  border-radius: 9px;
  line-height: 1;
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

.search-trigger:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
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

.help-btn:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
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

/* View Mode Toggle */
.view-mode-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid #e0e0e0;
  background: #f8f9fa;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 16px;
}

.view-mode-toggle:hover {
  background: #fff;
  border-color: #165DFF;
  color: #165DFF;
}

.view-mode-toggle:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

:global(.dark) .view-mode-toggle {
  background: #2a2a2a;
  border-color: #444;
}

:global(.dark) .view-mode-toggle:hover {
  background: #333;
}

.view-mode-label {
  font-size: 16px;
  line-height: 1;
}

@media (max-width: 768px) {
  .view-mode-toggle {
    display: none;
  }
}

/* Hide on mobile but show in tablet+ */
@media (min-width: 769px) {
  .view-mode-toggle {
    display: flex;
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
