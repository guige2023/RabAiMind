// useBoolean.ts - 布尔值模块
import { ref } from 'vue'

export function useBoolean(initial = false) {
  const value = ref(initial)
  const toggle = () => { value.value = !value.value }
  const setTrue = () => { value.value = true }
  const setFalse = () => { value.value = false }
  const set = (v: boolean) => { value.value = v }
  return { value, toggle, setTrue, setFalse, set }
}

export default useBoolean
