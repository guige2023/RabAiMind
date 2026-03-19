// useTip.ts - 工具提示模块
import { ref, onMounted, onUnmounted } from 'vue'

export function useTip() {
  const visible = ref(false)
  const content = ref('')
  const position = ref({ x: 0, y: 0 })

  let showTimer: ReturnType<typeof setTimeout> | null = null
  let hideTimer: ReturnType<typeof setTimeout> | null = null

  const show = (text: string, x: number, y: number, delay = 200) => {
    content.value = text
    position.value = { x, y }

    hideTimer && clearTimeout(hideTimer)
    showTimer = setTimeout(() => {
      visible.value = true
    }, delay)
  }

  const hide = (delay = 100) => {
    showTimer && clearTimeout(showTimer)
    hideTimer = setTimeout(() => {
      visible.value = false
    }, delay)
  }

  const updatePosition = (x: number, y: number) => {
    position.value = { x, y }
  }

  onUnmounted(() => {
    showTimer && clearTimeout(showTimer)
    hideTimer && clearTimeout(hideTimer)
  })

  return { visible, content, position, show, hide, updatePosition }
}

export default useTip
