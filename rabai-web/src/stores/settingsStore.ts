// Settings Store - 系统设置状态管理
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export interface AppSettings {
  // Theme
  theme: 'light' | 'dark' | 'auto'
  primaryColor: string
  accentColor: string

  // Language
  locale: string
  fallbackLocale: string

  // Accessibility
  reduceMotion: boolean
  highContrast: boolean
  fontSize: 'small' | 'medium' | 'large'

  // Performance
  performanceMode: boolean
  hardwareAcceleration: boolean
  cacheEnabled: boolean

  // Editor
  autoSave: boolean
  autoSaveInterval: number // seconds
  snapToGrid: boolean
  showRulers: boolean

  // Slides
  defaultSlideLayout: string
  gridSize: number

  // Notifications
  notificationsEnabled: boolean
  soundEnabled: boolean

  // Network
  offlineMode: boolean
  syncOnReconnect: boolean
}

const defaultSettings: AppSettings = {
  theme: 'auto',
  primaryColor: '#4F46E5',
  accentColor: '#10B981',
  locale: 'zh-CN',
  fallbackLocale: 'en',
  reduceMotion: false,
  highContrast: false,
  fontSize: 'medium',
  performanceMode: false,
  hardwareAcceleration: true,
  cacheEnabled: true,
  autoSave: true,
  autoSaveInterval: 30,
  snapToGrid: true,
  showRulers: false,
  defaultSlideLayout: 'content',
  gridSize: 20,
  notificationsEnabled: true,
  soundEnabled: true,
  offlineMode: false,
  syncOnReconnect: true
}

export const useSettingsStore = defineStore('settings', () => {
  // State
  const settings = ref<AppSettings>({ ...defaultSettings })
  const isLoading = ref(false)

  // Getters
  const isDarkMode = computed(() => {
    if (settings.value.theme === 'dark') return true
    if (settings.value.theme === 'light') return false
    // Auto mode
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  const effectiveTheme = computed(() => {
    if (settings.value.theme === 'auto') {
      return isDarkMode.value ? 'dark' : 'light'
    }
    return settings.value.theme
  })

  const fontSizeValue = computed(() => {
    switch (settings.value.fontSize) {
      case 'small': return 14
      case 'large': return 18
      default: return 16
    }
  })

  // Actions
  const loadSettings = () => {
    try {
      const saved = localStorage.getItem('app_settings')
      if (saved) {
        const parsed = JSON.parse(saved)
        settings.value = { ...defaultSettings, ...parsed }
      }
    } catch {
      // Ignore errors, use defaults
    }
  }

  const saveSettings = () => {
    try {
      localStorage.setItem('app_settings', JSON.stringify(settings.value))
    } catch {
      // Ignore errors
    }
  }

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    settings.value[key] = value
    saveSettings()
  }

  const updateSettings = (updates: Partial<AppSettings>) => {
    settings.value = { ...settings.value, ...updates }
    saveSettings()
  }

  const resetSettings = () => {
    settings.value = { ...defaultSettings }
    saveSettings()
  }

  const setTheme = (theme: 'light' | 'dark' | 'auto') => {
    settings.value.theme = theme
    saveSettings()
    applyTheme()
  }

  const setLocale = (locale: string) => {
    settings.value.locale = locale
    saveSettings()
  }

  const setReduceMotion = (reduce: boolean) => {
    settings.value.reduceMotion = reduce
    saveSettings()
    applyAccessibilitySettings()
  }

  const setPerformanceMode = (enabled: boolean) => {
    settings.value.performanceMode = enabled
    saveSettings()
  }

  const applyTheme = () => {
    const theme = effectiveTheme.value
    document.documentElement.setAttribute('data-theme', theme)
    document.body.classList.remove('light-theme', 'dark-theme')
    document.body.classList.add(`${theme}-theme`)
  }

  const applyAccessibilitySettings = () => {
    // Apply reduce motion
    if (settings.value.reduceMotion) {
      document.body.classList.add('reduce-motion')
    } else {
      document.body.classList.remove('reduce-motion')
    }

    // Apply font size
    document.documentElement.style.setProperty('--base-font-size', `${fontSizeValue.value}px`)
  }

  // Watch for theme changes and apply
  watch(() => settings.value.theme, () => {
    applyTheme()
  })

  // Watch for accessibility changes
  watch([() => settings.value.reduceMotion, () => settings.value.fontSize], () => {
    applyAccessibilitySettings()
  })

  // Initialize
  loadSettings()

  return {
    // State
    settings,
    isLoading,
    // Getters
    isDarkMode,
    effectiveTheme,
    fontSizeValue,
    // Actions
    loadSettings,
    saveSettings,
    updateSetting,
    updateSettings,
    resetSettings,
    setTheme,
    setLocale,
    setReduceMotion,
    setPerformanceMode,
    applyTheme,
    applyAccessibilitySettings
  }
})
