// useWatcher2.ts - 监听器模块
import { watch, ref } from 'vue'

export function useWatcher2(source: any, callback: (val: any, oldVal: any) => void) {
  const stopped = ref(false)
  watch(source, (n, o) => { if (!stopped.value) callback(n, o) }, { immediate: true })
  const stop = () => { stopped.value = true }
  return { stop }
}

export default useWatcher2
