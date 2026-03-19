// useWatchPost.ts - 异步监听模块
import { watch, ref } from 'vue'

export function useWatchPost(source: any, fn: (val: any) => void) {
  const stopped = ref(false)
  watch(source, fn, { flush: 'post' })
  const stop = () => { stopped.value = true }
  return { stop }
}

export default useWatchPost
