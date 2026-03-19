// useWatchEffect.ts - 监听副作用模块
import { watchEffect, ref } from 'vue'

export function useWatchEffect(fn: () => void) {
  const stopped = ref(false)
  watchEffect(() => {
    if (!stopped.value) fn()
  })
  const stop = () => { stopped.value = true }
  return { stop }
}

export default useWatchEffect
