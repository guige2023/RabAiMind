// useDarkMode.ts - 暗色模式模块
import { ref, watch, useCssModule } from 'vue'
import { useMediaQuery } from './useMediaQuery'

export type DarkModeStrategy = 'system' | 'light' | 'dark'

export function useDarkMode(initial: DarkModeStrategy = 'system') {
  const isDark = ref(false)
  const strategy = ref<DarkModeStrategy>(initial)

  const mediaQuery = useMediaQuery('(prefers-color-scheme: dark)')

  const updateDarkMode = () => {
    if (strategy.value === 'system') {
      isDark.value = mediaQuery.value
    } else {
      isDark.value = strategy.value === 'dark'
    }

    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', isDark.value)
    }
  }

  watch(mediaQuery, updateDarkMode, { immediate: true })
  watch(strategy, updateDarkMode, { immediate: true })

  const toggle = () => {
    strategy.value = isDark.value ? 'light' : 'dark'
  }

  const setMode = (mode: DarkModeStrategy) => {
    strategy.value = mode
  }

  return { isDark, strategy, toggle, setMode }
}

export default useDarkMode
