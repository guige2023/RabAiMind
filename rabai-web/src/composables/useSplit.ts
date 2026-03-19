// useSplit.ts - 分栏模块
import { ref, computed } from 'vue'

export function useSplit<T>(items: T[], columns = 2) {
  const currentPage = ref(1)
  const totalPages = computed(() => Math.ceil(items.length / columns))

  const paginatedItems = computed(() => {
    const start = (currentPage.value - 1) * columns
    return items.slice(start, start + columns)
  })

  const next = () => {
    if (currentPage.value < totalPages.value) currentPage.value++
  }

  const prev = () => {
    if (currentPage.value > 1) currentPage.value--
  }

  const goTo = (page: number) => {
    if (page >= 1 && page <= totalPages.value) currentPage.value = page
  }

  const reset = () => { currentPage.value = 1 }

  return { currentPage, totalPages, paginatedItems, next, prev, goTo, reset }
}

export default useSplit
