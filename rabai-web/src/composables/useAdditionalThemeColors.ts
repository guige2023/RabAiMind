// Additional Theme Colors - 更多主题色系
import { ref, computed, watch } from 'vue'

export type ExtendedAccentColor =
  | 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'pink' | 'cyan' | 'yellow'
  | 'indigo' | 'violet' | 'teal' | 'lime' | 'amber' | 'rose' | 'sky' | 'slate'
  | 'emerald' | 'fuchsia' | 'orange' | 'stone' | 'neutral' | 'gray'

export interface ExtendedThemeColors {
  primary: string
  primaryHover: string
  primaryLight: string
  secondary: string
  accent: string
  background: string
  backgroundAlt: string
  surface: string
  surfaceHover: string
  text: string
  textSecondary: string
  textMuted: string
  border: string
  borderLight: string
  success: string
  successLight: string
  warning: string
  warningLight: string
  error: string
  errorLight: string
  info: string
  infoLight: string
}

export interface ExtendedPresetTheme {
  id: ExtendedAccentColor
  name: string
  nameEn: string
  icon: string
  colors: ExtendedThemeColors
  category: 'modern' | 'nature' | 'warm' | 'cool' | 'neutral'
}

// 更多预设主题
export const extendedPresetThemes: ExtendedPresetTheme[] = [
  // Modern系列
  {
    id: 'indigo',
    name: '靛青现代',
    nameEn: 'Indigo Modern',
    icon: '◐',
    category: 'modern',
    colors: {
      primary: '#4F46E5',
      primaryHover: '#4338CA',
      primaryLight: '#E0E7FF',
      secondary: '#312E81',
      accent: '#818CF8',
      background: '#FAFBFF',
      backgroundAlt: '#F5F3FF',
      surface: '#FFFFFF',
      surfaceHover: '#F5F3FF',
      text: '#1E1B4B',
      textSecondary: '#4C1D95',
      textMuted: '#6B7280',
      border: '#C7D2FE',
      borderLight: '#E0E7FF',
      success: '#10B981',
      successLight: '#D1FAE5',
      warning: '#F59E0B',
      warningLight: '#FEF3C7',
      error: '#EF4444',
      errorLight: '#FEE2E2',
      info: '#3B82F6',
      infoLight: '#DBEAFE'
    }
  },
  {
    id: 'violet',
    name: '紫罗兰',
    nameEn: 'Violet Dream',
    icon: '◑',
    category: 'modern',
    colors: {
      primary: '#8B5CF6',
      primaryHover: '#7C3AED',
      primaryLight: '#EDE9FE',
      secondary: '#5B21B6',
      accent: '#A78BFA',
      background: '#FEFCFF',
      backgroundAlt: '#F5F3FF',
      surface: '#FFFFFF',
      surfaceHover: '#FAF5FF',
      text: '#4C1D95',
      textSecondary: '#6D28D9',
      textMuted: '#6B7280',
      border: '#DDD6FE',
      borderLight: '#EDE9FE',
      success: '#10B981',
      successLight: '#D1FAE5',
      warning: '#F59E0B',
      warningLight: '#FEF3C7',
      error: '#EF4444',
      errorLight: '#FEE2E2',
      info: '#8B5CF6',
      infoLight: '#EDE9FE'
    }
  },
  // Nature系列
  {
    id: 'teal',
    name: '青绿自然',
    nameEn: 'Teal Nature',
    icon: '▣',
    category: 'nature',
    colors: {
      primary: '#0D9488',
      primaryHover: '#0F766E',
      primaryLight: '#CCFBF1',
      secondary: '#134E4A',
      accent: '#2DD4BF',
      background: '#F0FDFA',
      backgroundAlt: '#ECFDF5',
      surface: '#FFFFFF',
      surfaceHover: '#F0FDFA',
      text: '#134E4A',
      textSecondary: '#115E59',
      textMuted: '#6B7280',
      border: '#99F6E4',
      borderLight: '#CCFBF1',
      success: '#10B981',
      successLight: '#D1FAE5',
      warning: '#F59E0B',
      warningLight: '#FEF3C7',
      error: '#EF4444',
      errorLight: '#FEE2E2',
      info: '#14B8A6',
      infoLight: '#CCFBF1'
    }
  },
  {
    id: 'emerald',
    name: '翡翠绿',
    nameEn: 'Emerald Green',
    icon: '▦',
    category: 'nature',
    colors: {
      primary: '#059669',
      primaryHover: '#047857',
      primaryLight: '#D1FAE5',
      secondary: '#064E3B',
      accent: '#34D399',
      background: '#ECFDF5',
      backgroundAlt: '#F0FDF4',
      surface: '#FFFFFF',
      surfaceHover: '#ECFDF5',
      text: '#064E3B',
      textSecondary: '#065F46',
      textMuted: '#6B7280',
      border: '#A7F3D0',
      borderLight: '#D1FAE5',
      success: '#10B981',
      successLight: '#D1FAE5',
      warning: '#F59E0B',
      warningLight: '#FEF3C7',
      error: '#EF4444',
      errorLight: '#FEE2E2',
      info: '#10B981',
      infoLight: '#D1FAE5'
    }
  },
  {
    id: 'lime',
    name: '青柠',
    nameEn: 'Lime Fresh',
    icon: '▧',
    category: 'nature',
    colors: {
      primary: '#84CC16',
      primaryHover: '#65A30D',
      primaryLight: '#ECFCCB',
      secondary: '#365314',
      accent: '#A3E635',
      background: '#F7FEE7',
      backgroundAlt: '#F0FDF4',
      surface: '#FFFFFF',
      surfaceHover: '#F7FEE7',
      text: '#365314',
      textSecondary: '#3F6212',
      textMuted: '#6B7280',
      border: '#D9F99D',
      borderLight: '#ECFCCB',
      success: '#22C55E',
      successLight: '#DCFCE7',
      warning: '#EAB308',
      warningLight: '#FEF9C3',
      error: '#EF4444',
      errorLight: '#FEE2E2',
      info: '#84CC16',
      infoLight: '#ECFCCB'
    }
  },
  // Warm系列
  {
    id: 'amber',
    name: '琥珀金',
    nameEn: 'Amber Gold',
    icon: '◊',
    category: 'warm',
    colors: {
      primary: '#D97706',
      primaryHover: '#B45309',
      primaryLight: '#FEF3C7',
      secondary: '#78350F',
      accent: '#FBBF24',
      background: '#FFFBEB',
      backgroundAlt: '#FFFCF1',
      surface: '#FFFFFF',
      surfaceHover: '#FFFBEB',
      text: '#78350F',
      textSecondary: '#92400E',
      textMuted: '#6B7280',
      border: '#FDE68A',
      borderLight: '#FEF3C7',
      success: '#22C55E',
      successLight: '#DCFCE7',
      warning: '#F59E0B',
      warningLight: '#FEF3C7',
      error: '#EF4444',
      errorLight: '#FEE2E2',
      info: '#F59E0B',
      infoLight: '#FEF3C7'
    }
  },
  {
    id: 'rose',
    name: '玫瑰红',
    nameEn: 'Rose Red',
    icon: '⬡',
    category: 'warm',
    colors: {
      primary: '#F43F5E',
      primaryHover: '#E11D48',
      primaryLight: '#FFE4E6',
      secondary: '#881337',
      accent: '#FB7185',
      background: '#FFF1F2',
      backgroundAlt: '#FFF5F5',
      surface: '#FFFFFF',
      surfaceHover: '#FFF1F2',
      text: '#881337',
      textSecondary: '#9F1239',
      textMuted: '#6B7280',
      border: '#FECDD3',
      borderLight: '#FFE4E6',
      success: '#22C55E',
      successLight: '#DCFCE7',
      warning: '#F59E0B',
      warningLight: '#FEF3C7',
      error: '#F43F5E',
      errorLight: '#FFE4E6',
      info: '#F43F5E',
      infoLight: '#FFE4E6'
    }
  },
  {
    id: 'orange',
    name: '活力橙',
    nameEn: 'Vibrant Orange',
    icon: '⬢',
    category: 'warm',
    colors: {
      primary: '#EA580C',
      primaryHover: '#C2410C',
      primaryLight: '#FFEDD5',
      secondary: '#7C2D12',
      accent: '#FB923C',
      background: '#FFF7ED',
      backgroundAlt: '#FFF5F0',
      surface: '#FFFFFF',
      surfaceHover: '#FFF7ED',
      text: '#7C2D12',
      textSecondary: '#9A3412',
      textMuted: '#6B7280',
      border: '#FED7AA',
      borderLight: '#FFEDD5',
      success: '#22C55E',
      successLight: '#DCFCE7',
      warning: '#F59E0B',
      warningLight: '#FEF3C7',
      error: '#EF4444',
      errorLight: '#FEE2E2',
      info: '#EA580C',
      infoLight: '#FFEDD5'
    }
  },
  // Cool系列
  {
    id: 'sky',
    name: '天空蓝',
    nameEn: 'Sky Blue',
    icon: '◇',
    category: 'cool',
    colors: {
      primary: '#0284C7',
      primaryHover: '#0369A1',
      primaryLight: '#E0F2FE',
      secondary: '#0C4A6E',
      accent: '#38BDF8',
      background: '#F0F9FF',
      backgroundAlt: '#F5F3FF',
      surface: '#FFFFFF',
      surfaceHover: '#F0F9FF',
      text: '#0C4A6E',
      textSecondary: '#075985',
      textMuted: '#6B7280',
      border: '#BAE6FD',
      borderLight: '#E0F2FE',
      success: '#10B981',
      successLight: '#D1FAE5',
      warning: '#F59E0B',
      warningLight: '#FEF3C7',
      error: '#EF4444',
      errorLight: '#FEE2E2',
      info: '#0EA5E9',
      infoLight: '#E0F2FE'
    }
  },
  // Neutral系列
  {
    id: 'slate',
    name: '岩石灰',
    nameEn: 'Slate Gray',
    icon: '○',
    category: 'neutral',
    colors: {
      primary: '#475569',
      primaryHover: '#334155',
      primaryLight: '#F1F5F9',
      secondary: '#1E293B',
      accent: '#64748B',
      background: '#F8FAFC',
      backgroundAlt: '#F1F5F9',
      surface: '#FFFFFF',
      surfaceHover: '#F8FAFC',
      text: '#1E293B',
      textSecondary: '#334155',
      textMuted: '#94A3B8',
      border: '#E2E8F0',
      borderLight: '#F1F5F9',
      success: '#22C55E',
      successLight: '#DCFCE7',
      warning: '#EAB308',
      warningLight: '#FEF9C3',
      error: '#EF4444',
      errorLight: '#FEE2E2',
      info: '#3B82F6',
      infoLight: '#DBEAFE'
    }
  },
  {
    id: 'stone',
    name: '砂岩灰',
    nameEn: 'Stone Gray',
    icon: '□',
    category: 'neutral',
    colors: {
      primary: '#78716C',
      primaryHover: '#57534E',
      primaryLight: '#F5F5F4',
      secondary: '#44403C',
      accent: '#A8A29E',
      background: '#FAFAF9',
      backgroundAlt: '#F5F5F4',
      surface: '#FFFFFF',
      surfaceHover: '#FAFAF9',
      text: '#44403C',
      textSecondary: '#57534E',
      textMuted: '#A8A29E',
      border: '#D6D3D1',
      borderLight: '#F5F5F4',
      success: '#22C55E',
      successLight: '#DCFCE7',
      warning: '#EAB308',
      warningLight: '#FEF9C3',
      error: '#EF4444',
      errorLight: '#FEE2E2',
      info: '#78716C',
      infoLight: '#F5F5F4'
    }
  },
  {
    id: 'neutral',
    name: '中性灰',
    nameEn: 'Neutral Gray',
    icon: '⬜',
    category: 'neutral',
    colors: {
      primary: '#525252',
      primaryHover: '#404040',
      primaryLight: '#F5F5F5',
      secondary: '#262626',
      accent: '#737373',
      background: '#FAFAFA',
      backgroundAlt: '#F5F5F5',
      surface: '#FFFFFF',
      surfaceHover: '#FAFAFA',
      text: '#262626',
      textSecondary: '#404040',
      textMuted: '#A3A3A3',
      border: '#E5E5E5',
      borderLight: '#F5F5F5',
      success: '#22C55E',
      successLight: '#DCFCE7',
      warning: '#EAB308',
      warningLight: '#FEF9C3',
      error: '#EF4444',
      errorLight: '#FEE2E2',
      info: '#525252',
      infoLight: '#F5F5F5'
    }
  },
  {
    id: 'gray',
    name: '经典灰',
    nameEn: 'Classic Gray',
    icon: '▢',
    category: 'neutral',
    colors: {
      primary: '#6B7280',
      primaryHover: '#4B5563',
      primaryLight: '#F3F4F6',
      secondary: '#1F2937',
      accent: '#9CA3AF',
      background: '#F9FAFB',
      backgroundAlt: '#F3F4F6',
      surface: '#FFFFFF',
      surfaceHover: '#F9FAFB',
      text: '#1F2937',
      textSecondary: '#374151',
      textMuted: '#9CA3AF',
      border: '#E5E7EB',
      borderLight: '#F3F4F6',
      success: '#22C55E',
      successLight: '#DCFCE7',
      warning: '#EAB308',
      warningLight: '#FEF9C3',
      error: '#EF4444',
      errorLight: '#FEE2E2',
      info: '#6B7280',
      infoLight: '#F3F4F6'
    }
  },
  // Fuchsia
  {
    id: 'fuchsia',
    name: '洋红',
    nameEn: 'Fuchsia Pink',
    icon: '◈',
    category: 'modern',
    colors: {
      primary: '#D946EF',
      primaryHover: '#C026D3',
      primaryLight: '#FAE8FF',
      secondary: '#701a75',
      accent: '#E879F9',
      background: '#FDF4FF',
      backgroundAlt: '#FAE8FF',
      surface: '#FFFFFF',
      surfaceHover: '#FDF4FF',
      text: '#701a75',
      textSecondary: '#86198F',
      textMuted: '#6B7280',
      border: '#F0ABFC',
      borderLight: '#FAE8FF',
      success: '#22C55E',
      successLight: '#DCFCE7',
      warning: '#EAB308',
      warningLight: '#FEF9C3',
      error: '#EF4444',
      errorLight: '#FEE2E2',
      info: '#D946EF',
      infoLight: '#FAE8FF'
    }
  }
]

// 分类主题
export const themeCategories = [
  { id: 'modern', name: '现代', icon: '✨', themes: extendedPresetThemes.filter(t => t.category === 'modern') },
  { id: 'nature', name: '自然', icon: '🌿', themes: extendedPresetThemes.filter(t => t.category === 'nature') },
  { id: 'warm', name: '暖色', icon: '☀️', themes: extendedPresetThemes.filter(t => t.category === 'warm') },
  { id: 'cool', name: '冷色', icon: '❄️', themes: extendedPresetThemes.filter(t => t.category === 'cool') },
  { id: 'neutral', name: '中性', icon: '🌑', themes: extendedPresetThemes.filter(t => t.category === 'neutral') }
]

export function useAdditionalThemeColors() {
  // 选中的主题
  const selectedTheme = ref<ExtendedAccentColor>('indigo')

  // 获取当前主题
  const currentTheme = computed(() => {
    return extendedPresetThemes.find(t => t.id === selectedTheme.value) || extendedPresetThemes[0]
  })

  // 按分类获取主题
  const getThemesByCategory = (category: string) => {
    return extendedPresetThemes.filter(t => t.category === category)
  }

  // 应用主题
  const applyTheme = (themeId: ExtendedAccentColor) => {
    selectedTheme.value = themeId
    const theme = extendedPresetThemes.find(t => t.id === themeId)
    if (!theme) return

    const root = document.documentElement

    // 应用所有颜色变量
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value)
    })

    // 保存选择
    localStorage.setItem('selected_theme', themeId)
  }

  // 加载保存的主题
  const loadSavedTheme = () => {
    const saved = localStorage.getItem('selected_theme')
    if (saved && extendedPresetThemes.find(t => t.id === saved)) {
      applyTheme(saved as ExtendedAccentColor)
    } else {
      applyTheme('indigo')
    }
  }

  // 随机主题
  const randomTheme = () => {
    const random = extendedPresetThemes[Math.floor(Math.random() * extendedPresetThemes.length)]
    applyTheme(random.id)
  }

  // 切换相邻主题
  const nextTheme = (direction: 'next' | 'prev' = 'next') => {
    const currentIndex = extendedPresetThemes.findIndex(t => t.id === selectedTheme.value)
    let newIndex: number

    if (direction === 'next') {
      newIndex = (currentIndex + 1) % extendedPresetThemes.length
    } else {
      newIndex = (currentIndex - 1 + extendedPresetThemes.length) % extendedPresetThemes.length
    }

    applyTheme(extendedPresetThemes[newIndex].id)
  }

  // 获取所有主题列表
  const allThemes = computed(() => extendedPresetThemes)

  // 获取分类列表
  const categories = computed(() => themeCategories)

  // 初始化
  const init = () => {
    loadSavedTheme()
  }

  return {
    selectedTheme,
    currentTheme,
    allThemes,
    categories,
    getThemesByCategory,
    applyTheme,
    loadSavedTheme,
    randomTheme,
    nextTheme,
    init
  }
}

export default useAdditionalThemeColors
