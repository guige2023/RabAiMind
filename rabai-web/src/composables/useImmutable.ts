// useImmutable.ts - 不可变数据模块
import { ref, readonly } from 'vue'

export function useImmutable<T>(initial: T) {
  const data = ref(initial) as { value: T }
  return readonly(data)
}

export default useImmutable
