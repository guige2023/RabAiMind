// useTimeoutFn.ts - 超时模块
import { ref, onUnmounted } from 'vue'

export function useTimeoutFn(fn: () => void, delay: number) {
  const active = ref(true)
  let id: ReturnType<typeof setTimeout> | null = setTimeout(() => {
    if (active.value) fn()
  }, delay)

  const cancel = () => {
    active.value = false
    if (id) clearTimeout(id)
  }

  onUnmounted(cancel)

  return { active, cancel }
}

export default useTimeoutFn
