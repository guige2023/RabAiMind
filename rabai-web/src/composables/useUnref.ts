// useUnref.ts - 脱 ref 模块
import { unref, isRef } from 'vue'

export function useUnref<T>(obj: T) {
  return unref(obj)
}

export default useUnref
