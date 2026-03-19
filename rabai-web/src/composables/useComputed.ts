// useComputed.ts - 计算属性模块
import { computed, ref, ComputedRef } from 'vue'

export function useComputed<T>(fn: () => T): ComputedRef<T> {
  return computed(fn)
}

export default useComputed
