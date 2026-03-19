// usePromise.ts - Promise模块
import { ref } from 'vue'

export function usePromise<T>(fn: () => Promise<T>) {
  const pending = ref(false)
  const resolved = ref<T | null>(null)
  const rejected = ref<Error | null>(null)

  const execute = async (...args: any[]) => {
    pending.value = true
    resolved.value = null
    rejected.value = null
    try {
      resolved.value = await fn()
    } catch (e) {
      rejected.value = e as Error
    } finally {
      pending.value = false
    }
  }

  return { pending, resolved, rejected, execute }
}

export default usePromise
