// useDebounce.ts - 防抖模块
import { ref, watch } from 'vue'
import type { Ref } from 'vue'

export function useDebounce<T>(value: Ref<T>, delay: number = 300) {
  const debouncedValue = ref<T>(value.value) as Ref<T>
  let timeout: ReturnType<typeof setTimeout> | null = null

  watch(value, (newValue) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      debouncedValue.value = newValue
    }, delay)
  })

  const cancel = () => {
    if (timeout) {
      clearTimeout(timeout)
      timeout = null
    }
  }

  const flush = () => {
    if (timeout) {
      clearTimeout(timeout)
      debouncedValue.value = value.value
      timeout = null
    }
  }

  return { debouncedValue, cancel, flush }
}

export function useDebounceFn<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), delay)
  }
}

export default useDebounce
