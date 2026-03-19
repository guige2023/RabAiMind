// useClipboard.ts - 剪贴板模块
import { ref } from 'vue'

export interface ClipboardItem {
  id: string
  content: string
  type: 'text' | 'html' | 'image'
  timestamp: number
}

export function useClipboard() {
  const history = ref<ClipboardItem[]>([])
  const maxHistory = 20

  const copy = async (content: string, type: 'text' | 'html' = 'text'): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(content)

      history.value.unshift({
        id: `clip_${Date.now()}`,
        content,
        type,
        timestamp: Date.now()
      })

      if (history.value.length > maxHistory) {
        history.value.pop()
      }

      return true
    } catch (error) {
      console.error('Copy failed:', error)
      return false
    }
  }

  const paste = async (): Promise<string | null> => {
    try {
      return await navigator.clipboard.readText()
    } catch {
      return null
    }
  }

  const clearHistory = () => {
    history.value = []
  }

  const getLast = () => history.value[0] || null

  return { history, copy, paste, clearHistory, getLast }
}

export default useClipboard
