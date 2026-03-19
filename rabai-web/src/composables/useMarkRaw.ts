// useMarkRaw.ts - 标记非响应式模块
import { markRaw, reactive } from 'vue'

export function useMarkRaw<T extends object>(obj: T) {
  return markRaw(obj)
}

export default useMarkRaw
