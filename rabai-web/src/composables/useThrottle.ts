// useThrottle.ts - 节流模块
import { ref } from 'vue'
import type { Ref } from 'vue'

export function useThrottle<T>(value: Ref<T>, delay: number = 300) {
  const throttledValue = ref<T>(value.value) as Ref<T>
  let lastUpdate = 0

  const update = () => {
    const now = Date.now()
    if (now - lastUpdate >= delay) {
      lastUpdate = now
      throttledValue.value = value.value
    }
  }

  value.value // 访问以触发响应式

  return { throttledValue, update }
}

export function useThrottleFn<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  let lastCall = 0

  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      fn(...args)
    }
  }
}

export function useThrottleLeading<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null
  let lastCall = 0

  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (!timeout && now - lastCall >= delay) {
      lastCall = now
      fn(...args)
      timeout = setTimeout(() => {
        timeout = null
      }, delay)
    }
  }
}

export default useThrottle
