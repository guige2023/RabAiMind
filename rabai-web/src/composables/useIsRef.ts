// useIsRef.ts - Ref检测模块
import { isRef, ref } from 'vue'

export function useIsRef<T>(obj: any): boolean {
  return isRef(obj)
}

export default useIsRef
