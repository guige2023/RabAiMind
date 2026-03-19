// Theme Manager - 主题管理
import { ref, computed, watch } from 'vue'

export type ThemeMode = 'light' | 'dark' | 'auto' | 'custom'
export type AccentColor = 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'pink' | 'cyan' | 'yellow'

export interface ThemeColors {
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
  text: string
  textSecondary: string
  border: string
  success: string
  warning: string
  error: string
  info: string
}

export interface ThemeConfig {
  mode: ThemeMode
  accentColor: AccentColor
  borderRadius: number
  fontFamily: string
  customColors?: Partial<ThemeColors>
}

export interface PresetTheme {
  id: string
  name: string
  nameEn: string
  icon: string
  colors: ThemeColors
}

// 预设主题
export const presetThemes: PresetTheme[] = [
  {
    id: 'blue',
    name: '蓝色经典',
    nameEn: 'Classic Blue',
    icon: '🔵',
    colors: {
      primary: '#165DFF',
      secondary: '#0d45cc',
      accent: '#5AC8FA',
      background: '#ffffff',
      surface: '#f5f5f5',
      text: '#333333',
      textSecondary: '#666666',
      border: '#e0e0e0',
      success: '#52c41a',
      warning: '#faad14',
      error: '#ff4d4f',
      info: '#1890ff'
    }
  },
  {
    id: 'purple',
    name: '紫色浪漫',
    nameEn: 'Purple Romance',
    icon: '🟣',
    colors: {
      primary: '#722ED1',
      secondary: '#531dab',
      accent: '#b37feb',
      background: '#faf5ff',
      surface: '#f3e8ff',
      text: '#1f1f1f',
      textSecondary: '#595959',
      border: '#d3adf7',
      success: '#52c41a',
      warning: '#faad14',
      error: '#ff4d4f',
      info: '#9254de'
    }
  },
  {
    id: 'green',
    name: '绿色清新',
    nameEn: 'Fresh Green',
    icon: '🟢',
    colors: {
      primary: '#52C41A',
      secondary: '#389e0d',
      accent: '#95de64',
      background: '#f6ffed',
      surface: '#d9f7be',
      text: '#1f1f1f',
      textSecondary: '#595959',
      border: '#b7eb8f',
      success: '#52c41a',
      warning: '#faad14',
      error: '#ff4d4f',
      info: '#73d13d'
    }
  },
  {
    id: 'orange',
    name: '橙色活力',
    nameEn: 'Orange Energy',
    icon: '🟠',
    colors: {
      primary: '#FA8C16',
      secondary: '#d46b08',
      accent: '#ffc069',
      background: '#fff7e6',
      surface: '#ffe7ba',
      text: '#1f1f1f',
      textSecondary: '#595959',
      border: '#ffd591',
      success: '#52c41a',
      warning: '#faad14',
      error: '#ff4d4f',
      info: '#fa8c16'
    }
  },
  {
    id: 'red',
    name: '红色热情',
    nameEn: 'Red Passion',
    icon: '🔴',
    colors: {
      primary: '#F5222D',
      secondary: '#cf1322',
      accent: '#ff7875',
      background: '#fff1f0',
      surface: '#ffdcdd',
      text: '#1f1f1f',
      textSecondary: '#595959',
      border: '#ffa39e',
      success: '#52c41a',
      warning: '#faad14',
      error: '#f5222d',
      info: '#ff7875'
    }
  },
  {
    id: 'pink',
    name: '粉色甜美',
    nameEn: 'Pink Sweet',
    icon: '💗',
    colors: {
      primary: '#EB2F96',
      secondary: '#c41d7f',
      accent: '#ff85c0',
      background: '#fff0f6',
      surface: '#ffdeeb',
      text: '#1f1f1f',
      textSecondary: '#595959',
      border: '#ffadd2',
      success: '#52c41a',
      warning: '#faad14',
      error: '#ff4d4f',
      info: '#eb2f96'
    }
  },
  {
    id: 'cyan',
    name: '青色专业',
    nameEn: 'Cyan Professional',
    icon: '🔷',
    colors: {
      primary: '#13C2C2',
      secondary: '#08979c',
      accent: '#36cfc9',
      background: '#e6fffb',
      surface: '#b5f5ec',
      text: '#1f1f1f',
      textSecondary: '#595959',
      border: '#87e8de',
      success: '#52c41a',
      warning: '#faad14',
      error: '#ff4d4f',
      info: '#13c2c2'
    }
  },
  {
    id: 'gold',
    name: '金色奢华',
    nameEn: 'Gold Luxury',
    icon: '🟡',
    colors: {
      primary: '#FAAD14',
      secondary: '#d48806',
      accent: '#ffe58f',
      background: '#fffbe6',
      surface: '#fff1b8',
      text: '#1f1f1f',
      textSecondary: '#595959',
      border: '#ffe58f',
      success: '#52c41a',
      warning: '#faad14',
      error: '#ff4d4f',
      info: '#ffc53d'
    }
  },
  {
    id: 'dark',
    name: '暗夜主题',
    nameEn: 'Dark Night',
    icon: '🌙',
    colors: {
      primary: '#165DFF',
      secondary: '#5AC8FA',
      accent: '#722ED1',
      background: '#141414',
      surface: '#1f1f1f',
      text: '#e8e8e8',
      textSecondary: '#a0a0a0',
      border: '#303030',
      success: '#52c41a',
      warning: '#faad14',
      error: '#ff4d4f',
      info: '#1890ff'
    }
  },
  {
    id: 'midnight',
    name: '午夜深蓝',
    nameEn: 'Midnight Blue',
    icon: '🌃',
    colors: {
      primary: '#5AC8FA',
      secondary: '#165DFF',
      accent: '#722ED1',
      background: '#0a0e27',
      surface: '#151b39',
      text: '#e0e6f0',
      textSecondary: '#8892a8',
      border: '#252d4a',
      success: '#52c41a',
      warning: '#faad14',
      error: '#ff6b6b',
      info: '#5AC8FA'
    }
  },
  {
    id: 'ocean',
    name: '海洋主题',
    nameEn: 'Ocean Theme',
    icon: '🌊',
    colors: {
      primary: '#006d77',
      secondary: '#83c5be',
      accent: '#edf6f9',
      background: '#edf6f9',
      surface: '#e0f2f1',
      text: '#1a3a3c',
      textSecondary: '#4a6b6d',
      border: '#b2dfdb',
      success: '#52c41a',
      warning: '#faad14',
      error: '#e29578',
      info: '#006d77'
    }
  },
  {
    id: 'forest',
    name: '森林主题',
    nameEn: 'Forest Theme',
    icon: '🌲',
    colors: {
      primary: '#2d6a4f',
      secondary: '#40916c',
      accent: '#95d5b2',
      background: '#f0fdf4',
      surface: '#dcfce7',
      text: '#1a3a2a',
      textSecondary: '#4a6b5a',
      border: '#bbf7d0',
      success: '#22c55e',
      warning: '#eab308',
      error: '#ef4444',
      info: '#2d6a4f'
    }
  }
]

// 圆角选项
export const borderRadiusOptions = [
  { id: 0, name: '无', label: '0px' },
  { id: 4, name: '小', label: '4px' },
  { id: 8, name: '中', label: '8px' },
  { id: 12, name: '大', label: '12px' },
  { id: 16, name: '特大', label: '16px' },
  { id: 24, name: '圆角', label: '24px' }
]

// 字体选项
export const fontOptions = [
  { id: 'system', name: '系统默认', value: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto' },
  { id: 'sans', name: '无衬线', value: '"Inter", "Helvetica Neue", Arial, sans-serif' },
  { id: 'serif', name: '衬线', value: '"Georgia", "Times New Roman", serif' },
  { id: 'mono', name: '等宽', value: '"Fira Code", "Consolas", monospace' }
]

export function useThemeManager() {
  // 当前配置
  const config = ref<ThemeConfig>({
    mode: 'light',
    accentColor: 'blue',
    borderRadius: 8,
    fontFamily: 'system'
  })

  // 是否应用了深色模式
  const isDarkMode = computed(() => {
    if (config.value.mode === 'dark') return true
    if (config.value.mode === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })

  // 当前主题
  const currentTheme = computed(() => {
    if (config.value.mode === 'custom' && config.value.customColors) {
      return {
        id: 'custom',
        name: '自定义',
        nameEn: 'Custom',
        icon: '🎨',
        colors: { ...presetThemes[0].colors, ...config.value.customColors }
      }
    }

    return presetThemes.find(t => t.id === config.value.accentColor) || presetThemes[0]
  })

  // 应用主题到CSS变量
  const applyTheme = () => {
    const theme = currentTheme.value
    const root = document.documentElement

    // 应用颜色
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value)
    })

    // 应用圆角
    root.style.setProperty('--border-radius', `${config.value.borderRadius}px`)

    // 应用字体
    const font = fontOptions.find(f => f.id === config.value.fontFamily)
    if (font) {
      root.style.setProperty('--font-family', font.value)
    }

    // 添加深色模式类
    if (isDarkMode.value) {
      root.classList.add('dark-theme')
    } else {
      root.classList.remove('dark-theme')
    }

    // 保存到localStorage
    localStorage.setItem('theme_config', JSON.stringify(config.value))
  }

  // 设置主题模式
  const setMode = (mode: ThemeMode) => {
    config.value.mode = mode
    applyTheme()
  }

  // 设置强调色
  const setAccentColor = (color: AccentColor) => {
    config.value.accentColor = color
    applyTheme()
  }

  // 设置圆角
  const setBorderRadius = (radius: number) => {
    config.value.borderRadius = radius
    applyTheme()
  }

  // 设置字体
  const setFontFamily = (font: string) => {
    config.value.fontFamily = font
    applyTheme()
  }

  // 设置自定义颜色
  const setCustomColors = (colors: Partial<ThemeColors>) => {
    config.value.mode = 'custom'
    config.value.customColors = colors
    applyTheme()
  }

  // 重置为默认
  const resetToDefault = () => {
    config.value = {
      mode: 'light',
      accentColor: 'blue',
      borderRadius: 8,
      fontFamily: 'system'
    }
    applyTheme()
  }

  // 加载保存的主题
  const loadSavedTheme = () => {
    const saved = localStorage.getItem('theme_config')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        config.value = { ...config.value, ...parsed }
      } catch {
        // 忽略解析错误
      }
    }
    applyTheme()
  }

  // 监听系统主题变化
  const watchSystemTheme = () => {
    if (config.value.mode === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addEventListener('change', applyTheme)
    }
  }

  // 切换主题（快速切换）
  const toggleTheme = () => {
    if (config.value.mode === 'light') {
      setMode('dark')
    } else if (config.value.mode === 'dark') {
      setMode('light')
    } else {
      setMode('light')
    }
  }

  // 初始化
  const init = () => {
    loadSavedTheme()
    watchSystemTheme()
  }

  // 获取可用的强调色选项
  const accentColorOptions = computed(() =>
    presetThemes.map(t => ({
      id: t.id,
      name: t.name,
      icon: t.icon,
      color: t.colors.primary
    }))
  )

  return {
    // 配置
    config,
    // 计算属性
    isDarkMode,
    currentTheme,
    presetThemes,
    accentColorOptions,
    borderRadiusOptions,
    fontOptions,
    // 方法
    applyTheme,
    setMode,
    setAccentColor,
    setBorderRadius,
    setFontFamily,
    setCustomColors,
    resetToDefault,
    loadSavedTheme,
    toggleTheme,
    init
  }
}

export default useThemeManager
