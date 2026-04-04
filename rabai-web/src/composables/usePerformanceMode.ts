import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

export interface PerformanceModeState {
  enabled: boolean
  animationsDisabled: boolean
  thumbnailsLazy: boolean
  imagesCompressed: boolean
  virtualListEnabled: boolean
}

export interface PowerSaverOptions {
  animationsDisabled: boolean
  lazyLoadImages: boolean
  compressImages: boolean
  reduceDOM: boolean
}

const PERF_MODE_KEY = 'rabai_perf_mode'
const POWER_SAVER_OPTIONS_KEY = 'rabai_power_saver_options'

// Global performance mode state (shared across components)
const globalPerfMode = ref(false)
const globalInitialized = ref(false)
const globalPowerSaverOptions = ref<PowerSaverOptions>({
  animationsDisabled: true,
  lazyLoadImages: true,
  compressImages: true,
  reduceDOM: false
})

export function usePerformanceMode() {
  // Initialize from localStorage on first call
  if (!globalInitialized.value) {
    const stored = localStorage.getItem(PERF_MODE_KEY)
    if (stored !== null) {
      globalPerfMode.value = stored === 'true'
    }
    const savedOptions = localStorage.getItem(POWER_SAVER_OPTIONS_KEY)
    if (savedOptions) {
      try {
        globalPowerSaverOptions.value = { ...globalPowerSaverOptions.value, ...JSON.parse(savedOptions) }
      } catch {}
    }
    globalInitialized.value = true
  }

  const isPerformanceMode = computed(() => globalPerfMode.value)

  // Whether animations should be disabled
  const animationsDisabled = computed(() =>
    globalPerfMode.value || globalPowerSaverOptions.value.animationsDisabled
  )

  // Lazy load thumbnails
  const thumbnailsLazy = computed(() =>
    globalPerfMode.value || globalPowerSaverOptions.value.lazyLoadImages
  )

  // Compress images before upload
  const imagesCompressed = computed(() =>
    globalPerfMode.value || globalPowerSaverOptions.value.compressImages
  )

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

  const setPowerSaverOptions = (options: Partial<PowerSaverOptions>) => {
    globalPowerSaverOptions.value = { ...globalPowerSaverOptions.value, ...options }
    localStorage.setItem(POWER_SAVER_OPTIONS_KEY, JSON.stringify(globalPowerSaverOptions.value))
  }

  const getPowerSaverOptions = () => globalPowerSaverOptions.value

  return {
    isPerformanceMode,
    animationsDisabled,
    thumbnailsLazy,
    imagesCompressed,
    virtualListEnabled,
    togglePerformanceMode,
    setPerformanceMode,
    setPowerSaverOptions,
    getPowerSaverOptions
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
