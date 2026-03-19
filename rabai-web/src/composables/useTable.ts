// useTable.ts - 表格模块
import { ref, computed } from 'vue'

export interface TableColumn {
  key: string
  title: string
  width?: number
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
}

export interface TableSort {
  key: string
  order: 'asc' | 'desc' | null
}

export function useTable<T extends Record<string, any>>(data: T[], columns: TableColumn[]) {
  const currentData = ref<T[]>([...data])
  const sort = ref<TableSort>({ key: '', order: null })
  const selectedRows = ref<Set<any>>(new Set())
  const currentPage = ref(1)
  const pageSize = ref(10)

  const sortedData = computed(() => {
    if (!sort.value.key || !sort.value.order) return currentData.value

    return [...currentData.value].sort((a, b) => {
      const aVal = a[sort.value.key]
      const bVal = b[sort.value.key]
      const order = sort.value.order === 'asc' ? 1 : -1

      if (aVal < bVal) return -1 * order
      if (aVal > bVal) return 1 * order
      return 0
    })
  })

  const paginatedData = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    return sortedData.value.slice(start, start + pageSize.value)
  })

  const totalPages = computed(() => Math.ceil(currentData.value.length / pageSize.value))

  const sortBy = (key: string) => {
    if (sort.value.key === key) {
      sort.value.order = sort.value.order === 'asc' ? 'desc' : 'asc'
    } else {
      sort.value = { key, order: 'asc' }
    }
  }

  const selectRow = (row: T) => {
    const key = row.id || JSON.stringify(row)
    if (selectedRows.value.has(key)) {
      selectedRows.value.delete(key)
    } else {
      selectedRows.value.add(key)
    }
  }

  const selectAll = () => {
    paginatedData.value.forEach(row => {
      selectedRows.value.add(row.id || JSON.stringify(row))
    })
  }

  const clearSelection = () => {
    selectedRows.value.clear()
  }

  const setPage = (page: number) => {
    currentPage.value = page
  }

  return {
    columns,
    currentData,
    sort,
    selectedRows,
    currentPage,
    pageSize,
    sortedData,
    paginatedData,
    totalPages,
    sortBy,
    selectRow,
    selectAll,
    clearSelection,
    setPage
  }
}

export default useTable
