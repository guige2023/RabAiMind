// useProgress.ts - 进度条模块
import { ref, computed } from 'vue'

export function useProgress() {
  const value = ref(0)
  const status = ref<'normal' | 'success' | 'error' | 'active'>('normal')

  const percentage = computed(() => Math.min(100, Math.max(0, value.value)))

  const setValue = (val: number) => { value.value = val }
  const setStatus = (s: typeof status.value) => { status.value = s }

  const start = () => { status.value = 'active' }
  const success = () => { status.value = 'success'; value.value = 100 }
  const error = () => { status.value = 'error' }
  const reset = () => { value.value = 0; status.value = 'normal' }

  return { value, status, percentage, setValue, setStatus, start, success, error, reset }
}

export default useProgress
