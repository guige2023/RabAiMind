// useEffect.ts - 副作用模块
import { ref, watch, onUnmounted } from 'vue'

export function useEffect(source: any, effect: () => void) {
  const stopped = ref(false)
  watch(source, () => { if (!stopped.value) effect() }, { immediate: true, deep: true })
  const stop = () => { stopped.value = true }
  onUnmounted(stop)
  return { stop }
}

export default useEffect
