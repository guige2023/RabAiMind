// useToRefs.ts - 批量响应式模块
import { toRefs, reactive } from 'vue'

export function useToRefs<T extends object>(obj: T) {
  return toRefs(reactive(obj))
}

export default useToRefs
