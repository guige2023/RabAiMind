/**
 * useDeviceMode - Device type detection and view mode management
 * Provides responsive breakpoint support and manual desktop/mobile toggle
 */
import { ref, onMounted, onUnmounted, computed } from 'vue'

// Breakpoint constants
export const BREAKPOINT_MOBILE = 768
export const BREAKPOINT_TABLET = 1024

// Singleton state (shared across all consumers)
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1200)
const viewMode = ref<'auto' | 'desktop' | 'mobile'>('auto')

// Device type computed from width + manual override
const isMobile = computed(() => {
  if (viewMode.value === 'desktop') return false
  if (viewMode.value === 'mobile') return true
  return windowWidth.value < BREAKPOINT_MOBILE
})

const isTablet = computed(() => {
  if (viewMode.value !== 'auto') return false
  return windowWidth.value >= BREAKPOINT_MOBILE && windowWidth.value < BREAKPOINT_TABLET
})

const isDesktop = computed(() => {
  if (viewMode.value === 'mobile') return false
  if (viewMode.value === 'desktop') return true
  return windowWidth.value >= BREAKPOINT_TABLET
})

const effectiveMode = computed<'mobile' | 'tablet' | 'desktop'>(() => {
  if (isMobile.value) return 'mobile'
  if (isTablet.value) return 'tablet'
  return 'desktop'
})

// Apply CSS class to document for styling
const applyModeClass = () => {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.classList.remove('view-mobile', 'view-tablet', 'view-desktop')
  root.classList.add(`view-${effectiveMode.value}`)
}

// Handle resize
let resizeTimer: ReturnType<typeof setTimeout> | null = null
const handleResize = () => {
  if (resizeTimer) clearTimeout(resizeTimer)
  resizeTimer = setTimeout(() => {
    windowWidth.value = window.innerWidth
    applyModeClass()
  }, 100)
}

export function useDeviceMode() {
  const setViewMode = (mode: 'auto' | 'desktop' | 'mobile') => {
    viewMode.value = mode
    localStorage.setItem('rabai_view_mode', mode)
    applyModeClass()
  }

  const init = () => {
    // Restore saved preference
    const saved = localStorage.getItem('rabai_view_mode') as 'auto' | 'desktop' | 'mobile' | null
    if (saved) viewMode.value = saved
    windowWidth.value = window.innerWidth
    applyModeClass()
    window.addEventListener('resize', handleResize, { passive: true })
  }

  const destroy = () => {
    window.removeEventListener('resize', handleResize)
    if (resizeTimer) clearTimeout(resizeTimer)
  }

  return {
    windowWidth,
    viewMode,
    isMobile,
    isTablet,
    isDesktop,
    effectiveMode,
    setViewMode,
    init,
    destroy,
    BREAKPOINT_MOBILE,
    BREAKPOINT_TABLET
  }
}

// Singleton instance
let _initialized = false
const _deviceMode = useDeviceMode()

export function initDeviceMode() {
  if (_initialized) return
  _initialized = true
  _deviceMode.init()
}

export function getDeviceMode() {
  return _deviceMode
}
