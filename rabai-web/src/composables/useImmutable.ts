// useImmutable.ts - 不可变数据模块
import { reactive, readonly } from 'vue'

export function useImmutable<T>(initial: T) {
  const state = reactive(initial)
  return readonly(state)
}

export default useImmutable
