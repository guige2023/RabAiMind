// useAsyncState.ts - 异步状态模块
import { ref } from 'vue'

export function useAsyncState<T>(initialState: T) {
  const state = ref<T>(initialState)
  const loading = ref(false)
  const error = ref<Error | null>(null)

  const execute = async (fn: () => Promise<T>) => {
    loading.value = true
    error.value = null
    try {
      state.value = await fn()
    } catch (e) {
      error.value = e as Error
    } finally {
      loading.value = false
    }
    return state.value
  }

  return { state, loading, error, execute }
}

export default useAsyncState
