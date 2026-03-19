// usePagination.ts - 分页模块
import { ref, computed } from 'vue'

export interface PaginationOptions {
  page?: number
  pageSize?: number
  total?: number
}

export function usePagination(options: PaginationOptions = {}) {
  const page = ref(options.page || 1)
  const pageSize = ref(options.pageSize || 10)
  const total = ref(options.total || 0)

  const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

  const isFirstPage = computed(() => page.value === 1)
  const isLastPage = computed(() => page.value >= totalPages.value)

  const startIndex = computed(() => (page.value - 1) * pageSize.value + 1)
  const endIndex = computed(() => Math.min(page.value * pageSize.value, total.value))

  const setPage = (p: number) => {
    if (p >= 1 && p <= totalPages.value) {
      page.value = p
    }
  }

  const nextPage = () => setPage(page.value + 1)
  const prevPage = () => setPage(page.value - 1)
  const firstPage = () => setPage(1)
  const lastPage = () => setPage(totalPages.value)

  const setPageSize = (size: number) => {
    pageSize.value = size
    page.value = 1
  }

  const setTotal = (t: number) => {
    total.value = t
    if (page.value > totalPages.value) {
      page.value = Math.max(1, totalPages.value)
    }
  }

  const reset = () => {
    page.value = 1
  }

  return {
    page,
    pageSize,
    total,
    totalPages,
    isFirstPage,
    isLastPage,
    startIndex,
    endIndex,
    setPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    setPageSize,
    setTotal,
    reset
  }
}

export default usePagination
