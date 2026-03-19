// useCustomRef.ts - 自定义 Ref 模块
import { customRef, Ref } from 'vue'

export function useCustomRef<T>(get: () => T, set: (val: T) => void): Ref<T> {
  return customRef((track, trigger) => ({
    get: () => { track(); return get() },
    set: (val) => { set(val); trigger() }
  }))
}

export default useCustomRef
