// useTriggerRef.ts - 手动触发模块
import { triggerRef, shallowRef, Ref } from 'vue'

export function useTriggerRef<T>(initial?: T) {
  const _ref = shallowRef(initial)
  const trigger = () => triggerRef(_ref)
  return { ref: _ref as Ref<T>, trigger }
}

export default useTriggerRef
