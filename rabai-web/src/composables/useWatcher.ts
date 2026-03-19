// useWatcher.ts - 观察者模块
import { ref, watch, onUnmounted } from 'vue'

export function useWatcher<T>(value: T) {
  const previous = ref<T>(value)
  const current = ref<T>(value)
  const changed = ref(false)

  const stop = watch(() => value, (newVal, oldVal) => {
    previous.value = oldVal
    current.value = newVal
    changed.value = newVal !== oldVal
  })

  onUnmounted(stop)

  return { previous, current, changed }
}

export default useWatcher
