// useShallowRef.ts - 浅响应模块
import { shallowRef, triggerRef } from 'vue'

export function useShallowRef<T>(initial: T) {
  const ref = shallowRef(initial)
  const trigger = () => triggerRef(ref)
  return { ref, trigger }
}

export default useShallowRef
