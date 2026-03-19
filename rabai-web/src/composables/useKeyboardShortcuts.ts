import { onMounted, onUnmounted } from 'vue'

interface ShortcutHandler {
  key: string
  ctrl?: boolean
  meta?: boolean
  shift?: boolean
  alt?: boolean
  handler: () => void
  description?: string
}

export function useKeyboardShortcuts(shortcuts: ShortcutHandler[]) {
  const handleKeydown = (event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement
    const isInput = target.tagName === 'INPUT' ||
                   target.tagName === 'TEXTAREA' ||
                   target.isContentEditable

    for (const shortcut of shortcuts) {
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase() ||
                      event.code.toLowerCase() === shortcut.key.toLowerCase()
      const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : true
      const metaMatch = shortcut.meta ? event.metaKey : true
      const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey
      const altMatch = shortcut.alt ? event.altKey : !event.altKey

      if (keyMatch && ctrlMatch && metaMatch && shiftMatch && altMatch) {
        // For non-input shortcuts, prevent default and execute
        if (!isInput || shortcut.key === 'Escape') {
          event.preventDefault()
        }
        shortcut.handler()
        break
      }
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
  })
}

// Global keyboard shortcuts for the app
export function setupGlobalShortcuts() {
  const shortcuts: ShortcutHandler[] = []

  return { useKeyboardShortcuts: () => useKeyboardShortcuts(shortcuts) }
}

// 常用快捷键映射
export const shortcutHints: Record<string, string> = {
  'Ctrl+Enter': '提交',
  'Ctrl+S': '保存',
  'Ctrl+Z': '撤销',
  'Ctrl+Y': '重做',
  'Ctrl+Shift+Z': '重做',
  'Ctrl+C': '复制',
  'Ctrl+V': '粘贴',
  'Ctrl+A': '全选',
  'Delete': '删除',
  'Escape': '关闭/取消',
  'Enter': '确认',
  'ArrowUp': '上移/上一个',
  'ArrowDown': '下移/下一个',
  'ArrowLeft': '左移/上一个',
  'ArrowRight': '右移/下一个',
  'Tab': '下一个焦点',
  'Shift+Tab': '上一个焦点',
  'Space': '选中/播放',
  '?': '显示帮助',
  'n': '新建',
  's': '保存',
  'e': '编辑',
  'd': '删除',
  'f': '搜索',
  '/': '搜索'
}
