// Theme Colors Pro - 更多主题色
import { ref, computed } from 'vue'

export type ThemeColor = 'blue' | 'indigo' | 'purple' | 'fuchsia' | 'pink' | 'red' | 'orange' | 'amber' | 'yellow' | 'lime' | 'green' | 'teal' | 'cyan' | 'sky' | 'slate' | 'gray' | 'zinc' | 'neutral' | 'stone' | 'rose' | 'violet' | 'emerald' | 'skyblue' | 'copper' | 'gold' | 'silver' | 'bronze' | 'ocean' | 'forest' | 'sunset' | 'midnight'

export interface ThemeColors {
  primary: string
  primaryLight: string
  primaryDark: string
  secondary: string
  accent: string
  background: string
  surface: string
  text: string
  textSecondary: string
  border: string
}

export interface ThemePreset {
  id: ThemeColor
  name: string
  nameEn: string
  icon: string
  colors: ThemeColors
}

export const themePresets: ThemePreset[] = [
  {
    id: 'blue', name: '蓝色', nameEn: 'Blue', icon: '🔵',
    colors: { primary: '#3b82f6', primaryLight: '#60a5fa', primaryDark: '#1d4ed8', secondary: '#1e40af', accent: '#93c5fd', background: '#eff6ff', surface: '#dbeafe', text: '#1e3a8a', textSecondary: '#3b82f6', border: '#bfdbfe' }
  },
  {
    id: 'indigo', name: '靛蓝', nameEn: 'Indigo', icon: '🔷',
    colors: { primary: '#6366f1', primaryLight: '#818cf8', primaryDark: '#4f46e5', secondary: '#3730a3', accent: '#a5b4fc', background: '#eef2ff', surface: '#e0e7ff', text: '#312e81', textSecondary: '#6366f1', border: '#c7d2fe' }
  },
  {
    id: 'purple', name: '紫色', nameEn: 'Purple', icon: '🟣',
    colors: { primary: '#a855f7', primaryLight: '#c084fc', primaryDark: '#9333ea', secondary: '#6b21a8', accent: '#d8b4fe', background: '#faf5ff', surface: '#f3e8ff', text: '#581c87', textSecondary: '#a855f7', border: '#e9d5ff' }
  },
  {
    id: 'fuchsia', name: '洋红', nameEn: 'Fuchsia', icon: '◈',
    colors: { primary: '#d946ef', primaryLight: '#e879f9', primaryDark: '#c026d3', secondary: '#701a75', accent: '#f0abfc', background: '#fdf4ff', surface: '#fae8ff', text: '#701a75', textSecondary: '#d946ef', border: '#f5d0fe' }
  },
  {
    id: 'pink', name: '粉色', nameEn: 'Pink', icon: '💗',
    colors: { primary: '#ec4899', primaryLight: '#f472b6', primaryDark: '#db2777', secondary: '#9d174d', accent: '#f9a8d4', background: '#fdf2f8', surface: '#fce7f3', text: '#831843', textSecondary: '#ec4899', border: '#fbcfe8' }
  },
  {
    id: 'red', name: '红色', nameEn: 'Red', icon: '🔴',
    colors: { primary: '#ef4444', primaryLight: '#f87171', primaryDark: '#dc2626', secondary: '#991b1b', accent: '#fca5a5', background: '#fef2f2', surface: '#fee2e2', text: '#7f1d1d', textSecondary: '#ef4444', border: '#fecaca' }
  },
  {
    id: 'orange', name: '橙色', nameEn: 'Orange', icon: '🟠',
    colors: { primary: '#f97316', primaryLight: '#fb923c', primaryDark: '#ea580c', secondary: '#9a3412', accent: '#fdba74', background: '#fff7ed', surface: '#ffedd5', text: '#7c2d12', textSecondary: '#f97316', border: '#fed7aa' }
  },
  {
    id: 'amber', name: '琥珀', nameEn: 'Amber', icon: '◊',
    colors: { primary: '#f59e0b', primaryLight: '#fbbf24', primaryDark: '#d97706', secondary: '#78350f', accent: '#fcd34d', background: '#fffbeb', surface: '#fef3c7', text: '#78350f', textSecondary: '#f59e0b', border: '#fde68a' }
  },
  {
    id: 'yellow', name: '黄色', nameEn: 'Yellow', icon: '🟡',
    colors: { primary: '#eab308', primaryLight: '#facc15', primaryDark: '#ca8a04', secondary: '#713f12', accent: '#fde047', background: '#fefce8', surface: '#fef9c3', text: '#713f12', textSecondary: '#eab308', border: '#fef08a' }
  },
  {
    id: 'lime', name: '青柠', nameEn: 'Lime', icon: '▧',
    colors: { primary: '#84cc16', primaryLight: '#a3e635', primaryDark: '#65a30d', secondary: '#365314', accent: '#bef264', background: '#f7fee7', surface: '#ecfccb', text: '#365314', textSecondary: '#84cc16', border: '#d9f99d' }
  },
  {
    id: 'green', name: '绿色', nameEn: 'Green', icon: '🟢',
    colors: { primary: '#22c55e', primaryLight: '#4ade80', primaryDark: '#16a34a', secondary: '#14532d', accent: '#86efac', background: '#f0fdf4', surface: '#dcfce7', text: '#14532d', textSecondary: '#22c55e', border: '#bbf7d0' }
  },
  {
    id: 'teal', name: '青绿', nameEn: 'Teal', icon: '▣',
    colors: { primary: '#14b8a6', primaryLight: '#2dd4bf', primaryDark: '#0d9488', secondary: '#134e4a', accent: '#5eead4', background: '#f0fdfa', surface: '#ccfbf1', text: '#134e4a', textSecondary: '#14b8a6', border: '#99f6e4' }
  },
  {
    id: 'cyan', name: '青色', nameEn: 'Cyan', icon: '🔵',
    colors: { primary: '#06b6d4', primaryLight: '#22d3ee', primaryDark: '#0891b2', secondary: '#164e63', accent: '#67e8f9', background: '#ecfeff', surface: '#cffafe', text: '#164e63', textSecondary: '#06b6d4', border: '#a5f3fc' }
  },
  {
    id: 'sky', name: '天蓝', nameEn: 'Sky', icon: '◇',
    colors: { primary: '#0ea5e9', primaryLight: '#38bdf8', primaryDark: '#0284c7', secondary: '#0c4a6e', accent: '#7dd3fc', background: '#f0f9ff', surface: '#e0f2fe', text: '#0c4a6e', textSecondary: '#0ea5e9', border: '#bae6fd' }
  },
  {
    id: 'slate', name: '岩石灰', nameEn: 'Slate', icon: '○',
    colors: { primary: '#64748b', primaryLight: '#94a3b8', primaryDark: '#475569', secondary: '#1e293b', accent: '#cbd5e1', background: '#f8fafc', surface: '#f1f5f9', text: '#1e293b', textSecondary: '#64748b', border: '#e2e8f0' }
  },
  {
    id: 'gray', name: '灰色', nameEn: 'Gray', icon: '▢',
    colors: { primary: '#6b7280', primaryLight: '#9ca3af', primaryDark: '#4b5563', secondary: '#1f2937', accent: '#d1d5db', background: '#f9fafb', surface: '#f3f4f6', text: '#1f2937', textSecondary: '#6b7280', border: '#e5e7eb' }
  },
  {
    id: 'zinc', name: '锌灰', nameEn: 'Zinc', icon: '⬜',
    colors: { primary: '#71717a', primaryLight: '#a1a1aa', primaryDark: '#52525b', secondary: '#18181b', accent: '#d4d4d8', background: '#fafafa', surface: '#f4f4f5', text: '#18181b', textSecondary: '#71717a', border: '#e4e4e7' }
  },
  {
    id: 'neutral', name: '中性灰', nameEn: 'Neutral', icon: '◻',
    colors: { primary: '#737373', primaryLight: '#a3a3a3', primaryDark: '#525252', secondary: '#171717', accent: '#d4d4d4', background: '#fafafa', surface: '#f5f5f5', text: '#171717', textSecondary: '#737373', border: '#e5e5e5' }
  },
  {
    id: 'stone', name: '砂岩灰', nameEn: 'Stone', icon: '□',
    colors: { primary: '#78716c', primaryLight: '#a8a29e', primaryDark: '#57534e', secondary: '#44403c', accent: '#d6d3d1', background: '#fafaf9', surface: '#f5f5f4', text: '#44403c', textSecondary: '#78716c', border: '#d6d3d1' }
  },
  // 新增主题色
  {
    id: 'rose', name: '玫瑰', nameEn: 'Rose', icon: '🌹',
    colors: { primary: '#e11d48', primaryLight: '#fb7185', primaryDark: '#be123c', secondary: '#881337', accent: '#fda4af', background: '#fff1f2', surface: '#ffe4e6', text: '#881337', textSecondary: '#e11d48', border: '#fecdd3' }
  },
  {
    id: 'violet', name: '紫罗兰', nameEn: 'Violet', icon: '💜',
    colors: { primary: '#7c3aed', primaryLight: '#a78bfa', primaryDark: '#5b21b6', secondary: '#4c1d95', accent: '#c4b5fd', background: '#f5f3ff', surface: '#ede9fe', text: '#4c1d95', textSecondary: '#7c3aed', border: '#ddd6fe' }
  },
  {
    id: 'emerald', name: '翡翠', nameEn: 'Emerald', icon: '💚',
    colors: { primary: '#059669', primaryLight: '#34d399', primaryDark: '#047857', secondary: '#064e3b', accent: '#6ee7b7', background: '#ecfdf5', surface: '#d1fae5', text: '#064e3b', textSecondary: '#059669', border: '#a7f3d0' }
  },
  {
    id: 'skyblue', name: '天蓝', nameEn: 'Sky Blue', icon: '🌊',
    colors: { primary: '#0ea5e9', primaryLight: '#38bdf8', primaryDark: '#0284c7', secondary: '#0c4a6e', accent: '#7dd3fc', background: '#f0f9ff', surface: '#e0f2fe', text: '#0c4a6e', textSecondary: '#0ea5e9', border: '#bae6fd' }
  },
  {
    id: 'copper', name: '铜色', nameEn: 'Copper', icon: '🥉',
    colors: { primary: '#c2410c', primaryLight: '#fb923c', primaryDark: '#9a3412', secondary: '#7c2d12', accent: '#fdba74', background: '#fff7ed', surface: '#ffedd5', text: '#7c2d12', textSecondary: '#c2410c', border: '#fed7aa' }
  },
  {
    id: 'gold', name: '金色', nameEn: 'Gold', icon: '🥇',
    colors: { primary: '#d97706', primaryLight: '#fbbf24', primaryDark: '#b45309', secondary: '#78350f', accent: '#fcd34d', background: '#fffbeb', surface: '#fef3c7', text: '#78350f', textSecondary: '#d97706', border: '#fde68a' }
  },
  {
    id: 'silver', name: '银色', nameEn: 'Silver', icon: '🥈',
    colors: { primary: '#64748b', primaryLight: '#94a3b8', primaryDark: '#475569', secondary: '#1e293b', accent: '#cbd5e1', background: '#f8fafc', surface: '#f1f5f9', text: '#1e293b', textSecondary: '#64748b', border: '#e2e8f0' }
  },
  {
    id: 'bronze', name: '青铜', nameEn: 'Bronze', icon: '🏺',
    colors: { primary: '#92400e', primaryLight: '#d97706', primaryDark: '#78350f', secondary: '#451a03', accent: '#f59e0b', background: '#fffbeb', surface: '#fef3c7', text: '#451a03', textSecondary: '#92400e', border: '#fcd34d' }
  },
  {
    id: 'ocean', name: '海洋', nameEn: 'Ocean', icon: '🌊',
    colors: { primary: '#0369a1', primaryLight: '#0ea5e9', primaryDark: '#075985', secondary: '#0c4a6e', accent: '#38bdf8', background: '#f0f9ff', surface: '#e0f2fe', text: '#0c4a6e', textSecondary: '#0369a1', border: '#7dd3fc' }
  },
  {
    id: 'forest', name: '森林', nameEn: 'Forest', icon: '🌲',
    colors: { primary: '#15803d', primaryLight: '#22c55e', primaryDark: '#166534', secondary: '#14532d', accent: '#4ade80', background: '#f0fdf4', surface: '#dcfce7', text: '#14532d', textSecondary: '#15803d', border: '#bbf7d0' }
  },
  {
    id: 'sunset', name: '日落', nameEn: 'Sunset', icon: '🌅',
    colors: { primary: '#ea580c', primaryLight: '#fb923c', primaryDark: '#c2410c', secondary: '#7c2d12', accent: '#fdba74', background: '#fff7ed', surface: '#ffedd5', text: '#7c2d12', textSecondary: '#ea580c', border: '#fed7aa' }
  },
  {
    id: 'midnight', name: '午夜', nameEn: 'Midnight', icon: '🌙',
    colors: { primary: '#1e3a8a', primaryLight: '#3b82f6', primaryDark: '#1e40af', secondary: '#172554', accent: '#60a5fa', background: '#eff6ff', surface: '#dbeafe', text: '#172554', textSecondary: '#1e3a8a', border: '#bfdbfe' }
  }
]

export function useThemeColorsPro() {
  const selectedTheme = ref<ThemeColor>('blue')

  const currentTheme = computed(() =>
    themePresets.find(t => t.id === selectedTheme.value) || themePresets[0]
  )

  const applyTheme = (themeId: ThemeColor) => {
    selectedTheme.value = themeId
    const theme = themePresets.find(t => t.id === themeId)
    if (!theme) return

    const root = document.documentElement
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value)
    })

    localStorage.setItem('theme_color', themeId)
  }

  const loadTheme = () => {
    const saved = localStorage.getItem('theme_color')
    if (saved && themePresets.find(t => t.id === saved)) {
      applyTheme(saved as ThemeColor)
    }
  }

  return {
    selectedTheme,
    currentTheme,
    themePresets,
    applyTheme,
    loadTheme
  }
}

export default useThemeColorsPro
