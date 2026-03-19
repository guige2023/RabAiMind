// useDebounceFn.ts - 防抖函数模块
import { ref } from 'vue'

export function useDebounceFn<T extends (...args: any[]) => any>(fn: T, delay = 300) {
  let timer: ReturnType<typeof setTimeout> | null = null
  const pending = ref(false)

  const execute = (...args: Parameters<T>) => {
    pending.value = true
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn(...args)
      pending.value = false
    }, delay)
  }

  const cancel = () => {
    if (timer) clearTimeout(timer)
    pending.value = false
  }

  return { execute, cancel, pending }
}

export default useDebounceFn
