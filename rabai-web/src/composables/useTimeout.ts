// useTimeout.ts - 定时器模块
import { ref, onUnmounted } from 'vue'

export function useTimeout() {
  const isReady = ref(false)
  const isPending = ref(false)
  let timer: ReturnType<typeof setTimeout> | null = null

  const start = (fn: () => void, delay: number) => {
    clear()
    isPending.value = true
    timer = setTimeout(() => {
      isReady.value = true
      isPending.value = false
      fn()
    }, delay)
  }

  const clear = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    isReady.value = false
    isPending.value = false
  }

  onUnmounted(clear)

  return { isReady, isPending, start, clear }
}

export function useInterval() {
  const isActive = ref(false)
  let timer: ReturnType<typeof setInterval> | null = null

  const start = (fn: () => void, delay: number) => {
    clear()
    isActive.value = true
    timer = setInterval(fn, delay)
  }

  const stop = () => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    isActive.value = false
  }

  const clear = stop

  onUnmounted(clear)

  return { isActive, start, stop, clear }
}

export default useTimeout
