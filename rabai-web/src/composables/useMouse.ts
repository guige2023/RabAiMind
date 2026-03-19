// useMouse.ts - 鼠标位置模块
import { ref, onMounted, onUnmounted } from 'vue'

export function useMouse() {
  const x = ref(0)
  const y = ref(0)

  const handleMove = (e: MouseEvent) => {
    x.value = e.clientX
    y.value = e.clientY
  }

  onMounted(() => window.addEventListener('mousemove', handleMove))
  onUnmounted(() => window.removeEventListener('mousemove', handleMove))

  return { x, y }
}

export default useMouse
