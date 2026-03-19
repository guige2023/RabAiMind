// Theme Colors Ultra - 极致主题色系统
import { ref, computed } from 'vue'

export type ThemeColor =
  | 'blue' | 'indigo' | 'purple' | 'fuchsia' | 'pink' | 'rose' | 'red' | 'orange'
  | 'amber' | 'yellow' | 'lime' | 'green' | 'emerald' | 'teal' | 'cyan' | 'sky'
  | 'slate' | 'gray' | 'zinc' | 'neutral' | 'stone'
  | 'rosegold' | 'lavender' | 'mint' | 'peach' | 'coral' | 'turquoise' | 'champagne' | 'burgundy'
  | 'navy' | 'maroon' | 'olive' | 'charcoal' | 'ivory' | 'cream' | 'sand' | 'terracotta'

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
  category: 'primary' | 'warm' | 'cool' | 'nature' | 'neutral' | 'special'
}

export const themePresets: ThemePreset[] = [
  // Primary colors
  { id: 'blue', name: '蓝色', nameEn: 'Blue', icon: '🔵', category: 'primary', colors: { primary: '#3b82f6', primaryLight: '#60a5fa', primaryDark: '#1d4ed8', secondary: '#1e40af', accent: '#93c5fd', background: '#eff6ff', surface: '#dbeafe', text: '#1e3a8a', textSecondary: '#3b82f6', border: '#bfdbfe' }},
  { id: 'indigo', name: '靛蓝', nameEn: 'Indigo', icon: '🔷', category: 'primary', colors: { primary: '#6366f1', primaryLight: '#818cf8', primaryDark: '#4f46e5', secondary: '#3730a3', accent: '#a5b4fc', background: '#eef2ff', surface: '#e0e7ff', text: '#312e81', textSecondary: '#6366f1', border: '#c7d2fe' }},
  { id: 'purple', name: '紫色', nameEn: 'Purple', icon: '🟣', category: 'primary', colors: { primary: '#a855f7', primaryLight: '#c084fc', primaryDark: '#9333ea', secondary: '#6b21a8', accent: '#d8b4fe', background: '#faf5ff', surface: '#f3e8ff', text: '#581c87', textSecondary: '#a855f7', border: '#e9d5ff' }},
  { id: 'pink', name: '粉色', nameEn: 'Pink', icon: '💗', category: 'primary', colors: { primary: '#ec4899', primaryLight: '#f472b6', primaryDark: '#db2777', secondary: '#9d174d', accent: '#f9a8d4', background: '#fdf2f8', surface: '#fce7f3', text: '#831843', textSecondary: '#ec4899', border: '#fbcfe8' }},
  { id: 'red', name: '红色', nameEn: 'Red', icon: '🔴', category: 'primary', colors: { primary: '#ef4444', primaryLight: '#f87171', primaryDark: '#dc2626', secondary: '#991b1b', accent: '#fca5a5', background: '#fef2f2', surface: '#fee2e2', text: '#7f1d1d', textSecondary: '#ef4444', border: '#fecaca' }},
  { id: 'orange', name: '橙色', nameEn: 'Orange', icon: '🟠', category: 'warm', colors: { primary: '#f97316', primaryLight: '#fb923c', primaryDark: '#ea580c', secondary: '#9a3412', accent: '#fdba74', background: '#fff7ed', surface: '#ffedd5', text: '#7c2d12', textSecondary: '#f97316', border: '#fed7aa' }},
  { id: 'amber', name: '琥珀', nameEn: 'Amber', icon: '◊', category: 'warm', colors: { primary: '#f59e0b', primaryLight: '#fbbf24', primaryDark: '#d97706', secondary: '#78350f', accent: '#fcd34d', background: '#fffbeb', surface: '#fef3c7', text: '#78350f', textSecondary: '#f59e0b', border: '#fde68a' }},
  { id: 'yellow', name: '黄色', nameEn: 'Yellow', icon: '🟡', category: 'warm', colors: { primary: '#eab308', primaryLight: '#facc15', primaryDark: '#ca8a04', secondary: '#713f12', accent: '#fde047', background: '#fefce8', surface: '#fef9c3', text: '#713f12', textSecondary: '#eab308', border: '#fef08a' }},
  { id: 'lime', name: '青柠', nameEn: 'Lime', icon: '▧', category: 'nature', colors: { primary: '#84cc16', primaryLight: '#a3e635', primaryDark: '#65a30d', secondary: '#365314', accent: '#bef264', background: '#f7fee7', surface: '#ecfccb', text: '#365314', textSecondary: '#84cc16', border: '#d9f99d' }},
  { id: 'green', name: '绿色', nameEn: 'Green', icon: '🟢', category: 'nature', colors: { primary: '#22c55e', primaryLight: '#4ade80', primaryDark: '#16a34a', secondary: '#14532d', accent: '#86efac', background: '#f0fdf4', surface: '#dcfce7', text: '#14532d', textSecondary: '#22c55e', border: '#bbf7d0' }},
  { id: 'emerald', name: '翡翠', nameEn: 'Emerald', icon: '💚', category: 'nature', colors: { primary: '#059669', primaryLight: '#34d399', primaryDark: '#047857', secondary: '#064e3b', accent: '#6ee7b7', background: '#ecfdf5', surface: '#d1fae5', text: '#064e3b', textSecondary: '#059669', border: '#a7f3d0' }},
  { id: 'teal', name: '青绿', nameEn: 'Teal', icon: '▣', category: 'nature', colors: { primary: '#14b8a6', primaryLight: '#2dd4bf', primaryDark: '#0d9488', secondary: '#134e4a', accent: '#5eead4', background: '#f0fdfa', surface: '#ccfbf1', text: '#134e4a', textSecondary: '#14b8a6', border: '#99f6e4' }},
  { id: 'cyan', name: '青色', nameEn: 'Cyan', icon: '🔵', category: 'cool', colors: { primary: '#06b6d4', primaryLight: '#22d3ee', primaryDark: '#0891b2', secondary: '#164e63', accent: '#67e8f9', background: '#ecfeff', surface: '#cffafe', text: '#164e63', textSecondary: '#06b6d4', border: '#a5f3fc' }},
  { id: 'sky', name: '天蓝', nameEn: 'Sky', icon: '◇', category: 'cool', colors: { primary: '#0ea5e9', primaryLight: '#38bdf8', primaryDark: '#0284c7', secondary: '#0c4a6e', accent: '#7dd3fc', background: '#f0f9ff', surface: '#e0f2fe', text: '#0c4a6e', textSecondary: '#0ea5e9', border: '#bae6fd' }},
  { id: 'slate', name: '岩石灰', nameEn: 'Slate', icon: '○', category: 'neutral', colors: { primary: '#64748b', primaryLight: '#94a3b8', primaryDark: '#475569', secondary: '#1e293b', accent: '#cbd5e1', background: '#f8fafc', surface: '#f1f5f9', text: '#1e293b', textSecondary: '#64748b', border: '#e2e8f0' }},
  { id: 'gray', name: '灰色', nameEn: 'Gray', icon: '▢', category: 'neutral', colors: { primary: '#6b7280', primaryLight: '#9ca3af', primaryDark: '#4b5563', secondary: '#1f2937', accent: '#d1d5db', background: '#f9fafb', surface: '#f3f4f6', text: '#1f2937', textSecondary: '#6b7280', border: '#e5e7eb' }},
  { id: 'zinc', name: '锌灰', nameEn: 'Zinc', icon: '⬜', category: 'neutral', colors: { primary: '#71717a', primaryLight: '#a1a1aa', primaryDark: '#52525b', secondary: '#18181b', accent: '#d4d4d8', background: '#fafafa', surface: '#f4f4f5', text: '#18181b', textSecondary: '#71717a', border: '#e4e4e7' }},
  { id: 'neutral', name: '中性灰', nameEn: 'Neutral', icon: '◻', category: 'neutral', colors: { primary: '#737373', primaryLight: '#a3a3a3', primaryDark: '#525252', secondary: '#171717', accent: '#d4d4d4', background: '#fafafa', surface: '#f5f5f5', text: '#171717', textSecondary: '#737373', border: '#e5e5e5' }},
  { id: 'stone', name: '砂岩灰', nameEn: 'Stone', icon: '□', category: 'neutral', colors: { primary: '#78716c', primaryLight: '#a8a29e', primaryDark: '#57534e', secondary: '#44403c', accent: '#d6d3d1', background: '#fafaf9', surface: '#f5f5f4', text: '#44403c', textSecondary: '#78716c', border: '#d6d3d1' }},
  // Special colors
  { id: 'rosegold', name: '玫瑰金', nameEn: 'Rose Gold', icon: '🌹', category: 'special', colors: { primary: '#e8b4b8', primaryLight: '#f0c4c7', primaryDark: '#d4a0a4', secondary: '#8b696d', accent: '#f5d5d8', background: '#fdf8f8', surface: '#fbeeee', text: '#5c4547', textSecondary: '#e8b4b8', border: '#f0dcdd' }},
  { id: 'lavender', name: '薰衣草', nameEn: 'Lavender', icon: '💜', category: 'special', colors: { primary: '#a78bfa', primaryLight: '#c4b5fd', primaryDark: '#8b5cf6', secondary: '#5b21b6', accent: '#ddd6fe', background: '#f5f3ff', surface: '#ede9fe', text: '#4c1d95', textSecondary: '#a78bfa', border: '#e9d5ff' }},
  { id: 'mint', name: '薄荷', nameEn: 'Mint', icon: '🍃', category: 'special', colors: { primary: '#6ee7b7', primaryLight: '#a7f3d0', primaryDark: '#34d399', secondary: '#047857', accent: '#d1fae5', background: '#ecfdf5', surface: '#d1fae5', text: '#064e3b', textSecondary: '#6ee7b7', border: '#a7f3d0' }},
  { id: 'peach', name: '桃子', nameEn: 'Peach', icon: '🍑', category: 'special', colors: { primary: '#fdba74', primaryLight: '#fed7aa', primaryDark: '#fb923c', secondary: '#9a3412', accent: '#ffedd5', background: '#fff7ed', surface: '#ffedd5', text: '#7c2d12', textSecondary: '#fdba74', border: '#fed7aa' }},
  { id: 'coral', name: '珊瑚', nameEn: 'Coral', icon: '🪸', category: 'special', colors: { primary: '#fb7185', primaryLight: '#fda4af', primaryDark: '#f43f5e', secondary: '#9f1239', accent: '#ffe4e6', background: '#fff1f2', surface: '#ffe4e6', text: '#881337', textSecondary: '#fb7185', border: '#fecdd3' }},
  { id: 'turquoise', name: '绿松石', nameEn: 'Turquoise', icon: '💎', category: 'special', colors: { primary: '#14b8a6', primaryLight: '#5eead4', primaryDark: '#0d9488', secondary: '#115e59', accent: '#ccfbf1', background: '#f0fdfa', surface: '#ccfbf1', text: '#134e4a', textSecondary: '#14b8a6', border: '#99f6e4' }},
  { id: 'champagne', name: '香槟', nameEn: 'Champagne', icon: '🥂', category: 'special', colors: { primary: '#fcd34d', primaryLight: '#fde68a', primaryDark: '#fbbf24', secondary: '#78350f', accent: '#fef3c7', background: '#fffbeb', surface: '#fef3c7', text: '#78350f', textSecondary: '#fcd34d', border: '#fde68a' }},
  { id: 'burgundy', name: '酒红', nameEn: 'Burgundy', icon: '🍷', category: 'special', colors: { primary: '#9f1239', primaryLight: '#e11d48', primaryDark: '#881337', secondary: '#4c0519', accent: '#ffe4e6', background: '#fff1f2', surface: '#ffe4e6', text: '#4c0519', textSecondary: '#e11d48', border: '#fecdd3' }},
  { id: 'navy', name: '海军蓝', nameEn: 'Navy', icon: '⚓', category: 'cool', colors: { primary: '#1e3a8a', primaryLight: '#3b82f6', primaryDark: '#1e40af', secondary: '#172554', accent: '#60a5fa', background: '#eff6ff', surface: '#dbeafe', text: '#172554', textSecondary: '#1e3a8a', border: '#bfdbfe' }},
  { id: 'maroon', name: '栗色', nameEn: 'Maroon', icon: '🟤', category: 'warm', colors: { primary: '#991b1b', primaryLight: '#ef4444', primaryDark: '#7f1d1d', secondary: '#450a0a', accent: '#fca5a5', background: '#fef2f2', surface: '#fee2e2', text: '#450a0a', textSecondary: '#ef4444', border: '#fecaca' }},
  { id: 'olive', name: '橄榄绿', nameEn: 'Olive', icon: '🫒', category: 'nature', colors: { primary: '#84cc16', primaryLight: '#a3e635', primaryDark: '#65a30d', secondary: '#365314', accent: '#d9f99d', background: '#f7fee7', surface: '#ecfccb', text: '#365314', textSecondary: '#84cc16', border: '#bef264' }},
  { id: 'charcoal', name: '炭灰', nameEn: 'Charcoal', icon: '◼', category: 'neutral', colors: { primary: '#374151', primaryLight: '#6b7280', primaryDark: '#1f2937', secondary: '#111827', accent: '#9ca3af', background: '#f9fafb', surface: '#f3f4f6', text: '#111827', textSecondary: '#374151', border: '#d1d5db' }},
  { id: 'ivory', name: '象牙白', nameEn: 'Ivory', icon: '⚪', category: 'neutral', colors: { primary: '#fefce8', primaryLight: '#fef9c3', primaryDark: '#fde047', secondary: '#713f12', accent: '#fef9c3', background: '#fffff0', surface: '#fffff0', text: '#713f12', textSecondary: '#fde047', border: '#fef9c3' }},
  { id: 'cream', name: '奶油色', nameEn: 'Cream', icon: '🧁', category: 'warm', colors: { primary: '#fef3c7', primaryLight: '#fde68a', primaryDark: '#fbbf24', secondary: '#78350f', accent: '#fef9c3', background: '#fffbeb', surface: '#fff7ed', text: '#78350f', textSecondary: '#d97706', border: '#fde68a' }},
  { id: 'sand', name: '沙色', nameEn: 'Sand', icon: '🏖', category: 'neutral', colors: { primary: '#d6d3d1', primaryLight: '#e7e5e4', primaryDark: '#a8a29e', secondary: '#44403c', accent: '#f5f5f4', background: '#fafaf9', surface: '#f5f5f4', text: '#44403c', textSecondary: '#78716c', border: '#e7e5e4' }},
  { id: 'terracotta', name: '陶土色', nameEn: 'Terracotta', icon: '🏺', category: 'warm', colors: { primary: '#c2410c', primaryLight: '#fb923c', primaryDark: '#9a3412', secondary: '#7c2d12', accent: '#fed7aa', background: '#fff7ed', surface: '#ffedd5', text: '#7c2d12', textSecondary: '#ea580c', border: '#fed7aa' }}
]

export function useThemeColorsUltra() {
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

  const getByCategory = (category: ThemePreset['category']) => {
    return themePresets.filter(t => t.category === category)
  }

  const search = (query: string) => {
    const q = query.toLowerCase()
    return themePresets.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.nameEn.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q)
    )
  }

  return {
    selectedTheme,
    currentTheme,
    themePresets,
    applyTheme,
    loadTheme,
    getByCategory,
    search
  }
}

export default useThemeColorsUltra
