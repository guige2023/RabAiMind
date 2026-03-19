// useSearch.ts - 搜索模块
import { ref, computed } from 'vue'

export function useSearch<T>(items: T[], keys: (keyof T | string)[]) {
  const query = ref('')

  const results = computed(() => {
    if (!query.value) return items
    const q = query.value.toLowerCase()
    return items.filter(item => {
      return keys.some(key => {
        const val = String(item[key as keyof T]).toLowerCase()
        return val.includes(q)
      })
    })
  })

  const setQuery = (q: string) => { query.value = q }
  const clear = () => { query.value = '' }

  return { query, results, setQuery, clear }
}

export default useSearch
