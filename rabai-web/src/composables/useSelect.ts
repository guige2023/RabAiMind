// useSelect.ts - 选择模块
import { ref, computed } from 'vue'

export function useSelect<T>(items: T[], multiple = false) {
  const selected = ref<Set<any>>(new Set())

  const isSelected = (item: T) => selected.value.has(item.id || JSON.stringify(item))
  const isAllSelected = computed(() => items.length > 0 && selected.value.size === items.length)

  const toggle = (item: T) => {
    const key = item.id || JSON.stringify(item)
    if (multiple) {
      selected.value.has(key) ? selected.value.delete(key) : selected.value.add(key)
    } else {
      selected.value.clear()
      selected.value.add(key)
    }
  }

  const select = (item: T) => {
    const key = item.id || JSON.stringify(item)
    selected.value.add(key)
  }

  const deselect = (item: T) => {
    const key = item.id || JSON.stringify(item)
    selected.value.delete(key)
  }

  const selectAll = () => items.forEach(item => select(item))
  const clear = () => selected.value.clear()

  return { selected, isSelected, isAllSelected, toggle, select, deselect, selectAll, clear }
}

export default useSelect
