// useScroll2.ts - 滚动位置模块
import { ref, onMounted, onUnmounted } from 'vue'

export function useScroll2() {
  const x = ref(0)
  const y = ref(0)
  const direction = ref<'up' | 'down' | null>(null)
  let lastY = 0

  const handleScroll = () => {
    x.value = window.scrollX
    y.value = window.scrollY
    direction.value = y.value > lastY ? 'down' : 'up'
    lastY = y.value
  }

  onMounted(() => window.addEventListener('scroll', handleScroll, { passive: true }))
  onUnmounted(() => window.removeEventListener('scroll', handleScroll))

  return { x, y, direction }
}

export default useScroll2
