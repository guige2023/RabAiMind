// useSet.ts - 集合模块
import { ref, computed } from 'vue'

export function useSet<T>(initial: T[] = []) {
  const data = ref(new Set<T>(initial))
  const size = computed(() => data.value.size)
  const isEmpty = computed(() => data.value.size === 0)
  const add = (item: T) => data.value.add(item)
  const remove = (item: T) => data.value.delete(item)
  const has = (item: T) => data.value.has(item)
  const clear = () => { data.value.clear() }
  const toArray = computed(() => Array.from(data.value))
  return { data, size, isEmpty, add, remove, has, clear, toArray }
}

export default useSet
