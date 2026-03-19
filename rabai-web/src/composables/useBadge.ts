// useBadge.ts - 徽标模块
import { ref, computed } from 'vue'

export function useBadge() {
  const count = ref(0)
  const max = ref(99)
  const show = ref(true)

  const displayCount = computed(() => count.value > max.value ? `${max.value}+` : String(count.value))

  const setCount = (value: number) => { count.value = value }
  const increment = (delta = 1) => { count.value += delta }
  const decrement = (delta = 1) => { count.value = Math.max(0, count.value - delta) }
  const clear = () => { count.value = 0 }

  return { count, max, show, displayCount, setCount, increment, decrement, clear }
}

export default useBadge
