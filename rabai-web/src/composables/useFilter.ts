// useFilter.ts - 筛选模块
import { ref, computed } from 'vue'

export interface FilterOption {
  key: string
  label: string
  value: any
}

export function useFilter<T extends Record<string, any>>() {
  const data = ref<T[]>([])
  const filters = ref<Record<string, any>>({})
  const searchText = ref('')

  const filtered = computed(() => {
    let result = data.value

    // 文本搜索
    if (searchText.value) {
      const text = searchText.value.toLowerCase()
      result = result.filter(item =>
        Object.values(item).some(val =>
          String(val).toLowerCase().includes(text)
        )
      )
    }

    // 字段筛选
    Object.entries(filters.value).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        result = result.filter(item => item[key] === value)
      }
    })

    return result
  })

  const setData = (arr: T[]) => { data.value = arr }
  const setFilter = (key: string, value: any) => { filters.value[key] = value }
  const clearFilters = () => { filters.value = {}; searchText.value = '' }
  const setSearch = (text: string) => { searchText.value = text }

  return { data, filters, searchText, filtered, setData, setFilter, clearFilters, setSearch }
}

export default useFilter
