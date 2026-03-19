// useIsMounted.ts - 挂载状态模块
import { ref, onMounted, onUnmounted } from 'vue'

export function useIsMounted() {
  const mounted = ref(false)
  onMounted(() => { mounted.value = true })
  onUnmounted(() => { mounted.value = false })
  return { mounted }
}

export default useIsMounted
