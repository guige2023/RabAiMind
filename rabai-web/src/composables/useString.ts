// useString.ts - 字符串模块
import { ref, computed } from 'vue'

export function useString(initial = '') {
  const value = ref(initial)
  const length = computed(() => value.value.length)
  const isEmpty = computed(() => value.value.length === 0)
  const isNotEmpty = computed(() => value.value.length > 0)
  const upper = computed(() => value.value.toUpperCase())
  const lower = computed(() => value.value.toLowerCase())
  const capitalize = () => { value.value = value.value.charAt(0).toUpperCase() + value.value.slice(1).toLowerCase() }
  const trim = () => { value.value = value.value.trim() }
  const clear = () => { value.value = '' }
  return { value, length, isEmpty, isNotEmpty, upper, lower, capitalize, trim, clear }
}

export default useString
