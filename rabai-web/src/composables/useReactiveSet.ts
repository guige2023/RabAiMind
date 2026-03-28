// useReactiveSet.ts - 响应式集合模块
import { reactive, computed } from 'vue'

export function useReactiveSet<T>(initial?: T[]) {
  const set = reactive(new Set<T>(initial))

  const add = (value: T) => {
    set.add(value)
  }

  const has = (value: T): boolean => {
    return set.has(value)
  }

  const remove = (value: T): boolean => {
    return set.delete(value)
  }

  const clear = () => {
    set.clear()
  }

  const values = computed(() => Array.from(set))

  const size = computed(() => set.size)

  const isEmpty = computed(() => set.size === 0)

  const toggle = (value: T) => {
    if (set.has(value)) {
      set.delete(value)
    } else {
      set.add(value)
    }
  }

  return {
    set,
    add,
    has,
    remove,
    clear,
    values,
    size,
    isEmpty,
    toggle
  }
}

export default useReactiveSet
