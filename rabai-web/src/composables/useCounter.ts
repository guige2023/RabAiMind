// useCounter.ts - 计数器模块
import { ref, computed } from 'vue'

export function useCounter(initial = 0, step = 1) {
  const count = ref(initial)
  const inc = () => { count.value += step }
  const dec = () => { count.value -= step }
  const set = (v: number) => { count.value = v }
  const reset = () => { count.value = initial }
  const isPositive = computed(() => count.value > 0)
  const isNegative = computed(() => count.value < 0)
  const isZero = computed(() => count.value === 0)
  return { count, inc, dec, set, reset, isPositive, isNegative, isZero }
}

export default useCounter
