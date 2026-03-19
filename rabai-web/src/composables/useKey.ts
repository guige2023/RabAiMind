// useKey.ts - 键盘状态模块
import { ref, onMounted, onUnmounted } from 'vue'

export function useKey() {
  const keys = ref<Set<string>>(new Set())

  const handleKeyDown = (e: KeyboardEvent) => { keys.value.add(e.key) }
  const handleKeyUp = (e: KeyboardEvent) => { keys.value.delete(e.key) }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('keyup', handleKeyUp)
  })

  const isPressed = (key: string) => keys.value.has(key)
  return { keys, isPressed }
}

export default useKey
