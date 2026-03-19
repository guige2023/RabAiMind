// useHover.ts - 悬停模块
import { ref, onMounted, onUnmounted } from 'vue'

export function useHover(elRef: any) {
  const isHovered = ref(false)

  const handleMouseEnter = () => { isHovered.value = true }
  const handleMouseLeave = () => { isHovered.value = false }

  onMounted(() => {
    elRef.value?.addEventListener('mouseenter', handleMouseEnter)
    elRef.value?.addEventListener('mouseleave', handleMouseLeave)
  })

  onUnmounted(() => {
    elRef.value?.removeEventListener('mouseenter', handleMouseEnter)
    elRef.value?.removeEventListener('mouseleave', handleMouseLeave)
  })

  return { isHovered }
}

export default useHover
