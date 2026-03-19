// useOnce.ts - 单次执行模块
import { ref } from 'vue'

export function useOnce() {
  const done = ref(false)
  const run = <T>(fn: () => T): T | undefined => {
    if (done.value) return undefined
    done.value = true
    return fn()
  }
  const reset = () => { done.value = false }
  return { done, run, reset }
}

export default useOnce
