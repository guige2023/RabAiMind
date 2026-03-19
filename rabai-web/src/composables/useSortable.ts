// useSortable.ts - 排序模块
import { ref } from 'vue'

export function useSortable<T>() {
  const list = ref<T[]>([])
  const sortKey = ref<keyof T | ''>('')
  const sortOrder = ref<'asc' | 'desc'>('asc')

  const sort = (key: keyof T) => {
    if (sortKey.value === key) {
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortKey.value = key
      sortOrder.value = 'asc'
    }
  }

  const sorted = () => {
    if (!sortKey.value) return list.value
    return [...list.value].sort((a, b) => {
      const aVal = a[sortKey.value as keyof T]
      const bVal = b[sortKey.value as keyof T]
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return sortOrder.value === 'asc' ? cmp : -cmp
    })
  }

  const setList = (arr: T[]) => { list.value = arr }

  return { list, sortKey, sortOrder, sort, sorted, setList }
}

export default useSortable
