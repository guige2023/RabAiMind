// useList.ts - 列表模块
import { ref, computed } from 'vue'

export function useList<T>(initial: T[] = []) {
  const items = ref<T[]>([...initial])
  const length = computed(() => items.value.length)
  const isEmpty = computed(() => items.value.length === 0)
  const isNotEmpty = computed(() => items.value.length > 0)
  const add = (item: T) => items.value.push(item)
  const remove = (index: number) => items.value.splice(index, 1)
  const clear = () => { items.value = [] }
  const first = computed(() => items.value[0])
  const last = computed(() => items.value[items.value.length - 1])
  return { items, length, isEmpty, isNotEmpty, add, remove, clear, first, last }
}

export default useList
