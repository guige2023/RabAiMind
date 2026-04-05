<template>
  <div class="app">
    <!-- Skip to main content link for accessibility -->
    <a href="#main-content" class="skip-link">{{ t('a11y.skipToContent') }}</a>

    <!-- Global Search -->
    <GlobalSearch ref="globalSearchRef" />
    <ToastNotifications />
    <UserOnboarding />
    <TipsPanel ref="tipsRef" />
    <AIChatPanel />
    <MobileNavDrawer ref="mobileNavRef" />
    <UserExperience ref="uxRef" />
    <HelpCenter ref="helpRef" />
    <PWAInstallPrompt />
    <PerformanceProfiler v-if="isDevelopment" />
    <NotificationsPanel
      v-if="showNotifications"
      @close="showNotifications = false"
      @view-task="handleNotificationViewTask"
    />

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
          <router-link to="/" class="logo" aria-label="{{ displayBrandName }} - {{ t('nav.home') }}">
            <span v-if="brandLogo && isWhiteLabel" class="logo-img-wrap">
              <img :src="brandLogo" alt="Logo" class="logo-img" />
            </span>
            <span v-else class="logo-icon" aria-hidden="true">✨</span>
            <span class="logo-text" :style="isWhiteLabel ? `background: linear-gradient(135deg, var(--brand-primary, #165DFF) 0%, var(--brand-secondary, #0E42D2) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;` : ''">
              {{ displayBrandName }}
            </span>
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
            <router-link to="/brand" class="nav-link" aria-label="品牌中心">🛡️</router-link>
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
          <HighContrastToggle />
          <ThemeSwitch />
          <!-- Performance Mode Indicator -->
          <div v-if="isPerformanceMode" class="perf-mode-indicator" title="流量节省模式已开启">
            <span>📡</span>
            <span class="hide-mobile">省流</span>
          </div>
          <router-link to="/settings" class="settings-btn" aria-label="设置">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </router-link>
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
          <!-- Notification Bell -->
          <button
            class="notif-bell-btn"
            @click="showNotifications = true"
            aria-label="通知中心"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span v-if="notifUnreadCount > 0" class="notif-dot">{{ notifUnreadCount > 9 ? '9+' : notifUnreadCount }}</span>
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
        <p v-if="isWhiteLabel && footerText">{{ footerText }}</p>
        <p v-else>{{ t('footer.copyright') }}</p>
        <p v-if="showPoweredBy" class="powered-by-inline">Powered by RabAiMind</p>
      </footer>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import LangSwitch from './components/LangSwitch.vue'
import ThemeSwitch from './components/ThemeSwitch.vue'
import Feedback from './components/Feedback.vue'
import NotificationsPanel from './components/NotificationsPanel.vue'
import { useNotifications } from './composables/useNotifications'
import ReduceMotionToggle from './components/ReduceMotionToggle.vue'
import HighContrastToggle from './components/HighContrastToggle.vue'
import GlobalSearch from './components/GlobalSearch.vue'
import UserOnboarding from './components/UserOnboarding.vue'
import AIChatPanel from './components/AIChatPanel.vue'
import MobileNavDrawer from './components/MobileNavDrawer.vue'
import UserExperience from './components/UserExperience.vue'
import HelpCenter from './components/HelpCenter.vue'
import ToastNotifications from './components/ToastNotifications.vue'
import PWAInstallPrompt from './components/PWAInstallPrompt.vue'
import PerformanceProfiler from './components/PerformanceProfiler.vue'
import TipsPanel from './components/TipsPanel.vue'
import { useTemplateStore } from './composables/useTemplateStore'
import { useDeviceMode, initDeviceMode, getDeviceMode } from './composables/useDeviceMode'
import { useBrand } from './composables/useBrand'
import { useI18n } from './composables/useI18n'
import { useAccessibility } from './composables/useAccessibility'
import { usePerformanceMode, applyPerformanceModeCSS } from './composables/usePerformanceMode'

const isLoading = ref(true)
const { t } = useI18n()
const { isReduceMotion, toggleReduceMotion, toggleHighContrast } = useAccessibility()
const { isPerformanceMode } = usePerformanceMode()
// Brand (R104 white-label)
const { isWhiteLabel, displayBrandName, brandLogo, showPoweredBy, loadBrand, footerText } = useBrand()
const globalSearchRef = ref<InstanceType<typeof GlobalSearch> | null>(null)
const mobileNavRef = ref<InstanceType<typeof MobileNavDrawer> | null>(null)
const uxRef = ref<InstanceType<typeof UserExperience> | null>(null)
const helpRef = ref<InstanceType<typeof HelpCenter> | null>(null)
const tipsRef = ref<InstanceType<typeof TipsPanel> | null>(null)
const showNotifications = ref(false)
const notif = useNotifications()
const notifUnreadCount = computed(() =>
  notif.unreadMentionCount.value
  + notif.alerts.value.filter(a => a.priority === 'high').length
  + notif.unreadGenerationCount.value
)

// Device mode
const isDevelopment = import.meta.env.DEV
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

// Notifications
const handleNotificationViewTask = (taskId: string) => {
  if (taskId) {
    window.location.href = `/result/${taskId}`
  }
}

// Global keyboard shortcuts
const handleGlobalKeydown = (e: KeyboardEvent) => {
  // Ctrl/Cmd + ? or Ctrl/Cmd + / → open shortcuts tab in help
  if ((e.ctrlKey || e.metaKey) && (e.key === '?' || e.key === '/')) {
    e.preventDefault()
    openHelp('shortcuts')
  }
  // Ctrl/Cmd + Shift + H → toggle high contrast
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'H') {
    e.preventDefault()
    toggleHighContrast()
  }
}

onMounted(() => {
  // Initialize device mode detection
  initDeviceMode()
  window.addEventListener('keydown', handleGlobalKeydown)

  // Load favorites
  templateStore.loadFavorites()

  // Apply performance mode CSS on load
  applyPerformanceModeCSS(isPerformanceMode.value)

  // Load brand config (R104 white-label)
  loadBrand()

  // Init notifications
  notif.init()

  // Simulate initial load
  setTimeout(() => {
    isLoading.value = false
  }, 500)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
})

// Watch performance mode and apply CSS class to root
watch(isPerformanceMode, (enabled) => {
  applyPerformanceModeCSS(enabled)
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

.settings-btn {
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
  text-decoration: none;
  flex-shrink: 0;
}

.settings-btn:hover {
  background: #f0f0f0;
}

.settings-btn:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.settings-btn svg {
  width: 20px;
  height: 20px;
  color: #666;
}

:global(.dark) .settings-btn:hover {
  background: #2a2a2a;
}

:global(.dark) .settings-btn svg {
  color: #aaa;
}

:global(.dark) .help-btn:hover {
  background: #2a2a2a;
}

:global(.dark) .help-btn svg {
  color: #aaa;
}

/* Notification Bell */
.notif-bell-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid #e0e0e0;
  background: #f8f9fa;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s;
}

.notif-bell-btn:hover {
  background: #f0f0f0;
}

.notif-bell-btn svg {
  width: 18px;
  height: 18px;
  color: #555;
}

.notif-dot {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  background: #EF4444;
  color: white;
  font-size: 10px;
  font-weight: 600;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
}

@media (max-width: 768px) {
  .help-btn, .notif-bell-btn {
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

/* Performance Mode Indicator */
.perf-mode-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: #fff3e0;
  border: 1px solid #ff9800;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: #e65100;
  cursor: default;
  flex-shrink: 0;
  animation: fadeIn 0.3s ease;
}

:global(.dark) .perf-mode-indicator {
  background: rgba(255, 152, 0, 0.15);
  border-color: #ff9800;
  color: #ffb74d;
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
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
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.powered-by-inline {
  color: #bbb;
  font-size: 12px;
}

.logo-img-wrap {
  display: flex;
  align-items: center;
}

.logo-img {
  max-height: 32px;
  max-width: 120px;
  object-fit: contain;
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
