// useDelay.ts - 延迟执行模块
import { ref, onUnmounted } from 'vue'

export function useDelay() {
  const timers = ref<ReturnType<typeof setTimeout>[]>([])

  const set = (fn: () => void, ms: number): number => {
    const id = window.setTimeout(fn, ms)
    timers.value.push(id)
    return id
  }

  const clear = (id: number) => {
    clearTimeout(id)
    timers.value = timers.value.filter(t => t !== id)
  }

  const clearAll = () => {
    timers.value.forEach(t => clearTimeout(t))
    timers.value = []
  }

  onUnmounted(clearAll)

  return { set, clear, clearAll }
}

export default useDelay
