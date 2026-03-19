// useActive.ts - 激活状态模块
import { ref, onMounted, onUnmounted } from 'vue'

export function useActive(elRef: any) {
  const isActive = ref(false)

  const handleMouseDown = () => { isActive.value = true }
  const handleMouseUp = () => { isActive.value = false }

  onMounted(() => {
    elRef.value?.addEventListener('mousedown', handleMouseDown)
    elRef.value?.addEventListener('mouseup', handleMouseUp)
    elRef.value?.addEventListener('mouseleave', handleMouseUp)
  })

  onUnmounted(() => {
    elRef.value?.removeEventListener('mousedown', handleMouseDown)
    elRef.value?.removeEventListener('mouseup', handleMouseUp)
    elRef.value?.removeEventListener('mouseleave', handleMouseUp)
  })

  return { isActive }
}

export default useActive
