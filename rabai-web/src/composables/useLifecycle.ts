// useLifecycle.ts - 生命周期模块
import { ref, onMounted, onUpdated, onUnmounted } from 'vue'

export function useLifecycle() {
  const mounted = ref(false)
  const updated = ref(false)
  const unmounted = ref(false)

  onMounted(() => { mounted.value = true })
  onUpdated(() => { updated.value = true })
  onUnmounted(() => { unmounted.value = true })

  return { mounted, updated, unmounted }
}

export default useLifecycle
