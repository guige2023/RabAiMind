import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

export interface PerformanceModeState {
  enabled: boolean
  animationsDisabled: boolean
  thumbnailsLazy: boolean
  imagesCompressed: boolean
  virtualListEnabled: boolean
}

const PERF_MODE_KEY = 'rabai_perf_mode'

// Global performance mode state (shared across components)
const globalPerfMode = ref(false)
const globalInitialized = ref(false)

export function usePerformanceMode() {
  // Initialize from localStorage on first call
  if (!globalInitialized.value) {
    const stored = localStorage.getItem(PERF_MODE_KEY)
    if (stored !== null) {
      globalPerfMode.value = stored === 'true'
    }
    globalInitialized.value = true
  }

  const isPerformanceMode = computed(() => globalPerfMode.value)

  // Whether animations should be disabled
  const animationsDisabled = computed(() => globalPerfMode.value)

  // Lazy load thumbnails
  const thumbnailsLazy = computed(() => globalPerfMode.value)

  // Compress images before upload
  const imagesCompressed = computed(() => globalPerfMode.value)

  // Enable virtual list for large slide counts
  const virtualListEnabled = computed(() => globalPerfMode.value)

  const togglePerformanceMode = () => {
    globalPerfMode.value = !globalPerfMode.value
    localStorage.setItem(PERF_MODE_KEY, String(globalPerfMode.value))
  }

  const setPerformanceMode = (enabled: boolean) => {
    globalPerfMode.value = enabled
    localStorage.setItem(PERF_MODE_KEY, String(enabled))
  }

  return {
    isPerformanceMode,
    animationsDisabled,
    thumbnailsLazy,
    imagesCompressed,
    virtualListEnabled,
    togglePerformanceMode,
    setPerformanceMode
  }
}

// CSS class injection for performance mode
export function applyPerformanceModeCSS(disabled: boolean) {
  if (disabled) {
    document.documentElement.classList.add('perf-mode')
  } else {
    document.documentElement.classList.remove('perf-mode')
  }
}
