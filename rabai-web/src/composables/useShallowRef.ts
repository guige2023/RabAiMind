// useShallowRef.ts - 浅响应模块
import { shallowRef, triggerRef, ShallowRef } from 'vue'

export function useShallowRef<T>(initial: T) {
  const _ref = shallowRef<T>(initial)
  const trigger = () => triggerRef(_ref)
  return { ref: _ref as ShallowRef<T>, trigger }
}

export default useShallowRef
