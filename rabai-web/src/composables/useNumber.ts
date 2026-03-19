// useNumber.ts - 数字模块
import { ref, computed } from 'vue'

export function useNumber(initial = 0) {
  const value = ref(initial)
  const min = ref(-Infinity)
  const max = ref(Infinity)
  const setMin = (v: number) => { min.value = v }
  const setMax = (v: number) => { max.value = v }
  const clamp = () => { value.value = Math.min(Math.max(value.value, min.value), max.value) }
  const format = (decimals = 0) => value.value.toFixed(decimals)
  const percent = computed(() => value.value * 100)
  return { value, min, max, setMin, setMax, clamp, format, percent }
}

export default useNumber
