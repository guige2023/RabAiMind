// useBreadcrumb.ts - 面包屑模块
import { ref, computed } from 'vue'

export interface BreadcrumbItem {
  title: string
  path?: string
  disabled?: boolean
}

export function useBreadcrumb() {
  const items = ref<BreadcrumbItem[]>([])

  const add = (item: BreadcrumbItem) => {
    items.value.push(item)
  }

  const remove = (index?: number) => {
    if (index !== undefined) {
      items.value.splice(index, 1)
    } else {
      items.value.pop()
    }
  }

  const clear = () => {
    items.value = []
  }

  const setItems = (newItems: BreadcrumbItem[]) => {
    items.value = newItems
  }

  const replace = (index: number, item: BreadcrumbItem) => {
    items.value[index] = item
  }

  const go = (index: number) => {
    items.value = items.value.slice(0, index + 1)
  }

  return { items, add, remove, clear, setItems, replace, go }
}

export default useBreadcrumb
