// useLoading.ts - 加载状态模块
import { ref, computed } from 'vue'

export interface LoadingState {
  loading: boolean
  error: string | null
  data: any
}

export function useLoading(initial = false) {
  const isLoading = ref(initial)
  const error = ref<string | null>(null)
  const data = ref<any>(null)

  const start = () => {
    isLoading.value = true
    error.value = null
  }

  const stop = () => {
    isLoading.value = false
  }

  const setError = (err: string) => {
    error.value = err
    isLoading.value = false
  }

  const setData = (newData: any) => {
    data.value = newData
    isLoading.value = false
  }

  const reset = () => {
    isLoading.value = false
    error.value = null
    data.value = null
  }

  const isSuccess = computed(() => !isLoading.value && !error.value && data.value !== null)
  const isEmpty = computed(() => !isLoading.value && !error.value && data.value === null)

  return { isLoading, error, data, start, stop, setError, setData, reset, isSuccess, isEmpty }
}

export function useAsync<T>(asyncFn: () => Promise<T>, initialValue?: T) {
  const isLoading = ref(false)
  const error = ref<Error | null>(null)
  const data = ref<T | undefined>(initialValue)

  const execute = async (...args: any[]) => {
    isLoading.value = true
    error.value = null
    try {
      data.value = await asyncFn() as T
      return data.value
    } catch (e) {
      error.value = e as Error
      throw e
    } finally {
      isLoading.value = false
    }
  }

  return { isLoading, error, data, execute }
}

export default useLoading
