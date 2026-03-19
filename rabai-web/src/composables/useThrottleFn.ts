// useThrottleFn.ts - 节流函数模块
import { ref } from 'vue'

export function useThrottleFn<T extends (...args: any[]) => any>(fn: T, delay = 300) {
  let lastCall = 0
  const pending = ref(false)

  const execute = (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      fn(...args)
    }
  }

  return { execute, pending }
}

export default useThrottleFn
