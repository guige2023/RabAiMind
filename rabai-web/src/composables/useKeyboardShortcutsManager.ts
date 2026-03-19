// Keyboard Shortcuts - 键盘快捷键管理
import { ref, computed, onMounted, onUnmounted } from 'vue'

export type ShortcutCategory = 'navigation' | 'editing' | 'view' | 'file' | 'tools' | 'general'

export interface KeyboardShortcut {
  id: string
  key: string
  modifiers: ('ctrl' | 'shift' | 'alt' | 'meta')[]
  description: string
  descriptionEn: string
  category: ShortcutCategory
  action: () => void
  enabled: boolean
  global: boolean
}

// 默认快捷键
export const defaultShortcuts: Omit<KeyboardShortcut, 'action'>[] = [
  // 导航
  { id: 'home', key: 'g', modifiers: ['g'], description: '前往首页', descriptionEn: 'Go to home', category: 'navigation', enabled: true, global: false },
  { id: 'create', key: 'n', modifiers: ['ctrl'], description: '新建PPT', descriptionEn: 'New presentation', category: 'navigation', enabled: true, global: true },
  { id: 'templates', key: 't', modifiers: ['ctrl'], description: '打开模板市场', descriptionEn: 'Open template market', category: 'navigation', enabled: true, global: true },

  // 编辑
  { id: 'undo', key: 'z', modifiers: ['ctrl'], description: '撤销', descriptionEn: 'Undo', category: 'editing', enabled: true, global: false },
  { id: 'redo', key: 'z', modifiers: ['ctrl', 'shift'], description: '重做', descriptionEn: 'Redo', category: 'editing', enabled: true, global: false },
  { id: 'save', key: 's', modifiers: ['ctrl'], description: '保存', descriptionEn: 'Save', category: 'editing', enabled: true, global: true },
  { id: 'copy', key: 'c', modifiers: ['ctrl'], description: '复制', descriptionEn: 'Copy', category: 'editing', enabled: true, global: true },
  { id: 'paste', key: 'v', modifiers: ['ctrl'], description: '粘贴', descriptionEn: 'Paste', category: 'editing', enabled: true, global: true },
  { id: 'cut', key: 'x', modifiers: ['ctrl'], description: '剪切', descriptionEn: 'Cut', category: 'editing', enabled: true, global: true },
  { id: 'delete', key: 'Delete', modifiers: [], description: '删除', descriptionEn: 'Delete', category: 'editing', enabled: true, global: false },
  { id: 'selectAll', key: 'a', modifiers: ['ctrl'], description: '全选', descriptionEn: 'Select all', category: 'editing', enabled: true, global: true },

  // 视图
  { id: 'zoomIn', key: '=', modifiers: ['ctrl'], description: '放大', descriptionEn: 'Zoom in', category: 'view', enabled: true, global: false },
  { id: 'zoomOut', key: '-', modifiers: ['ctrl'], description: '缩小', descriptionEn: 'Zoom out', category: 'view', enabled: true, global: false },
  { id: 'zoomReset', key: '0', modifiers: ['ctrl'], description: '重置缩放', descriptionEn: 'Reset zoom', category: 'view', enabled: true, global: false },
  { id: 'fullscreen', key: 'F11', modifiers: [], description: '全屏', descriptionEn: 'Fullscreen', category: 'view', enabled: true, global: true },
  { id: 'toggleSidebar', key: 'b', modifiers: ['ctrl'], description: '切换侧边栏', descriptionEn: 'Toggle sidebar', category: 'view', enabled: true, global: false },

  // 文件
  { id: 'export', key: 'e', modifiers: ['ctrl', 'shift'], description: '导出', descriptionEn: 'Export', category: 'file', enabled: true, global: false },
  { id: 'import', key: 'i', modifiers: ['ctrl', 'shift'], description: '导入', descriptionEn: 'Import', category: 'file', enabled: true, global: false },
  { id: 'print', key: 'p', modifiers: ['ctrl'], description: '打印', descriptionEn: 'Print', category: 'file', enabled: true, global: true },

  // 工具
  { id: 'search', key: 'k', modifiers: ['ctrl'], description: '搜索', descriptionEn: 'Search', category: 'tools', enabled: true, global: true },
  { id: 'aiChat', key: 'm', modifiers: ['ctrl'], description: 'AI对话', descriptionEn: 'AI Chat', category: 'tools', enabled: true, global: true },
  { id: 'help', key: 'F1', modifiers: [], description: '帮助', descriptionEn: 'Help', category: 'tools', enabled: true, global: true },

  // 通用
  { id: 'close', key: 'Escape', modifiers: [], description: '关闭/取消', descriptionEn: 'Close/Cancel', category: 'general', enabled: true, global: true },
  { id: 'confirm', key: 'Enter', modifiers: [], description: '确认', descriptionEn: 'Confirm', category: 'general', enabled: true, global: true },
  { id: 'refresh', key: 'r', modifiers: ['ctrl'], description: '刷新', descriptionEn: 'Refresh', category: 'general', enabled: true, global: true }
]

export function useKeyboardShortcuts() {
  // 快捷键列表
  const shortcuts = ref<KeyboardShortcut[]>([])

  // 是否启用
  const enabled = ref(true)

  // 是否显示快捷键提示
  const showHints = ref(true)

  // 快捷键按下状态
  const pressedKeys = ref<Set<string>>(new Set())

  // 注册的监听器
  const registeredListeners = ref<((shortcut: KeyboardShortcut) => void)[]>([])

  // 初始化快捷键
  const initShortcuts = () => {
    shortcuts.value = defaultShortcuts.map(s => ({
      ...s,
      action: () => {}
    }))
  }

  // 注册快捷键
  const registerShortcut = (shortcut: Omit<KeyboardShortcut, 'action'>, action: () => void) => {
    const existing = shortcuts.value.find(s => s.id === shortcut.id)
    if (existing) {
      existing.action = action
      existing.enabled = shortcut.enabled
      existing.global = shortcut.global
    } else {
      shortcuts.value.push({ ...shortcut, action })
    }
  }

  // 注销快捷键
  const unregisterShortcut = (id: string) => {
    const index = shortcuts.value.findIndex(s => s.id === id)
    if (index !== -1) {
      shortcuts.value.splice(index, 1)
    }
  }

  // 启用/禁用快捷键
  const toggleShortcut = (id: string) => {
    const shortcut = shortcuts.value.find(s => s.id === id)
    if (shortcut) {
      shortcut.enabled = !shortcut.enabled
    }
  }

  // 启用/禁用所有
  const toggleAll = (enable: boolean) => {
    enabled.value = enable
  }

  // 检查快捷键是否匹配
  const matchShortcut = (
    event: KeyboardEvent,
    shortcut: KeyboardShortcut
  ): boolean => {
    const key = event.key.toLowerCase()
    const shortcutKey = shortcut.key.toLowerCase()

    if (key !== shortcutKey) return false

    const requiredModifiers = new Set(shortcut.modifiers)
    const eventModifiers: ('ctrl' | 'shift' | 'alt' | 'meta')[] = []

    if (event.ctrlKey) eventModifiers.push('ctrl')
    if (event.shiftKey) eventModifiers.push('shift')
    if (event.altKey) eventModifiers.push('alt')
    if (event.metaKey) eventModifiers.push('meta')

    return requiredModifiers.size === eventModifiers.length &&
      [...requiredModifiers].every(m => eventModifiers.includes(m))
  }

  // 处理键盘事件
  const handleKeyDown = (event: KeyboardEvent) => {
    if (!enabled.value) return

    // 忽略在输入框中的快捷键（除了全局的）
    const target = event.target as HTMLElement
    const isInput = target.tagName === 'INPUT' ||
                    target.tagName === 'TEXTAREA' ||
                    target.isContentEditable

    for (const shortcut of shortcuts.value) {
      if (!shortcut.enabled) continue

      // 如果不是全局快捷键且在输入框中，跳过
      if (!shortcut.global && isInput) continue

      if (matchShortcut(event, shortcut)) {
        event.preventDefault()
        shortcut.action()

        // 触发监听器
        registeredListeners.value.forEach(listener => listener(shortcut))

        return
      }
    }

    // 记录按下的键
    pressedKeys.value.add(event.key)
  }

  const handleKeyUp = (event: KeyboardEvent) => {
    pressedKeys.value.delete(event.key)
  }

  // 监听快捷键执行
  const onShortcut = (listener: (shortcut: KeyboardShortcut) => void) => {
    registeredListeners.value.push(listener)
    return () => {
      const index = registeredListeners.value.indexOf(listener)
      if (index > -1) {
        registeredListeners.value.splice(index, 1)
      }
    }
  }

  // 获取分类快捷键
  const shortcutsByCategory = computed(() => {
    const categories: Record<ShortcutCategory, KeyboardShortcut[]> = {
      navigation: [],
      editing: [],
      view: [],
      file: [],
      tools: [],
      general: []
    }

    shortcuts.value.forEach(shortcut => {
      if (categories[shortcut.category]) {
        categories[shortcut.category].push(shortcut)
      }
    })

    return categories
  })

  // 获取启用的快捷键
  const enabledShortcuts = computed(() =>
    shortcuts.value.filter(s => s.enabled)
  )

  // 获取快捷键描述
  const getShortcutDisplay = (shortcut: KeyboardShortcut): string => {
    const parts: string[] = []

    if (shortcut.modifiers.includes('ctrl')) parts.push('Ctrl')
    if (shortcut.modifiers.includes('shift')) parts.push('Shift')
    if (shortcut.modifiers.includes('alt')) parts.push('Alt')
    if (shortcut.modifiers.includes('meta')) parts.push('⌘')

    parts.push(shortcut.key.toUpperCase())

    return parts.join('+')
  }

  // 搜索快捷键
  const searchShortcuts = (query: string): KeyboardShortcut[] => {
    const lowerQuery = query.toLowerCase()
    return shortcuts.value.filter(s =>
      s.description.toLowerCase().includes(lowerQuery) ||
      s.descriptionEn.toLowerCase().includes(lowerQuery) ||
      s.key.toLowerCase().includes(lowerQuery)
    )
  }

  // 加载保存的配置
  const loadConfig = () => {
    try {
      const stored = localStorage.getItem('keyboard_shortcuts')
      if (stored) {
        const config = JSON.parse(stored)
        config.forEach((c: { id: string; enabled: boolean }) => {
          const shortcut = shortcuts.value.find(s => s.id === c.id)
          if (shortcut) {
            shortcut.enabled = c.enabled
          }
        })
      }
    } catch { /* ignore */ }
  }

  // 保存配置
  const saveConfig = () => {
    try {
      const config = shortcuts.value.map(s => ({
        id: s.id,
        enabled: s.enabled
      }))
      localStorage.setItem('keyboard_shortcuts', JSON.stringify(config))
    } catch { /* ignore */ }
  }

  // 添加事件监听
  const addListeners = () => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
  }

  // 移除事件监听
  const removeListeners = () => {
    window.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('keyup', handleKeyUp)
  }

  onMounted(() => {
    initShortcuts()
    loadConfig()
    addListeners()
  })

  onUnmounted(() => {
    removeListeners()
    saveConfig()
  })

  return {
    // 状态
    shortcuts,
    enabled,
    showHints,
    pressedKeys,
    // 计算属性
    shortcutsByCategory,
    enabledShortcuts,
    // 方法
    registerShortcut,
    unregisterShortcut,
    toggleShortcut,
    toggleAll,
    matchShortcut,
    handleKeyDown,
    handleKeyUp,
    onShortcut,
    getShortcutDisplay,
    searchShortcuts,
    loadConfig,
    saveConfig,
    addListeners,
    removeListeners
  }
}

export default useKeyboardShortcuts
