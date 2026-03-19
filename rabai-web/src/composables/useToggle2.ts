// useToggle2.ts - 布尔切换模块
import { ref, computed } from 'vue'

export function useToggle2(initial = false) {
  const value = ref(initial)
  const toggle = () => { value.value = !value.value }
  const setTrue = () => { value.value = true }
  const setFalse = () => { value.value = false }
  const set = (v: boolean) => { value.value = v }
  const isTrue = computed(() => value.value === true)
  const isFalse = computed(() => value.value === false)
  return { value, toggle, setTrue, setFalse, set, isTrue, isFalse }
}

export default useToggle2
