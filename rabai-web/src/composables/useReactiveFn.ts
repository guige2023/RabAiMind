// useReactiveFn.ts - 响应式函数模块
import { ref, reactive, watch } from 'vue'

export function useReactiveFn<T>(initial: T) {
  const value = ref<T>(initial) as { value: T }

  const state = reactive({
    data: initial as T,
    loading: false,
    error: null as Error | null
  })

  const setValue = (newValue: T) => {
    value.value = newValue
    state.data = newValue
  }

  const setLoading = (loading: boolean) => {
    state.loading = loading
  }

  const setError = (error: Error | null) => {
    state.error = error
  }

  const watchValue = (callback: (val: T, oldVal: T) => void) => {
    watch(value, callback, { deep: true })
  }

  return {
    value,
    state,
    setValue,
    setLoading,
    setError,
    watchValue
  }
}

export default useReactiveFn
