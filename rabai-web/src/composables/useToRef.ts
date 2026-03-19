// useToRef.ts - 响应式引用模块
import { toRef, ref } from 'vue'

export function useToRef<T>(obj: any, key: keyof T) {
  return toRef(obj, key as string)
}

export default useToRef
