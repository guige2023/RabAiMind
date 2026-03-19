// useRetry.ts - 重试模块
import { ref } from 'vue'

export function useRetry(fn: () => Promise<any>, maxRetries = 3) {
  const attempts = ref(0)
  const error = ref<Error | null>(null)

  const run = async () => {
    attempts.value = 0
    error.value = null

    while (attempts.value < maxRetries) {
      try {
        attempts.value++
        return await fn()
      } catch (e) {
        error.value = e as Error
        if (attempts.value >= maxRetries) throw e
      }
    }
  }

  return { attempts, error, run }
}

export default useRetry
