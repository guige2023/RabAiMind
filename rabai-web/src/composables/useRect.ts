// useRect.ts - 元素尺寸模块
import { ref, onMounted, onUnmounted } from 'vue'

export function useRect(elRef: any) {
  const rect = ref({ top: 0, left: 0, width: 0, height: 0, right: 0, bottom: 0 })

  const update = () => {
    if (!elRef.value) return
    const r = elRef.value.getBoundingClientRect()
    rect.value = { top: r.top, left: r.left, width: r.width, height: r.height, right: r.right, bottom: r.bottom }
  }

  onMounted(update)
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
  }
  onUnmounted(() => {
    window.removeEventListener('resize', update)
    window.removeEventListener('scroll', update, true)
  })

  return rect
}

export default useRect
