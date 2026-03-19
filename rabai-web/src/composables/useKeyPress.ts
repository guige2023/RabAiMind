// useKeyPress.ts - 键盘按键检测模块
import { onMounted, onUnmounted } from 'vue'

export interface KeyPressOptions {
  callback: (e: KeyboardEvent) => void
  key?: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean
}

export function useKeyPress(options: KeyPressOptions) {
  const { callback, key, ctrl, shift, alt, meta } = options

  const handler = (e: KeyboardEvent) => {
    if (key && e.key.toLowerCase() !== key.toLowerCase()) return
    if (ctrl !== undefined && e.ctrlKey !== ctrl) return
    if (shift !== undefined && e.shiftKey !== shift) return
    if (alt !== undefined && e.altKey !== alt) return
    if (meta !== undefined && e.metaKey !== meta) return

    e.preventDefault()
    callback(e)
  }

  onMounted(() => {
    document.addEventListener('keydown', handler)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handler)
  })
}

export function useKeyCombo(key: string, callback: () => void) {
  return useKeyPress({ key, callback, ctrl: true })
}

export default useKeyPress
