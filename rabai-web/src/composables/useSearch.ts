// useSearch.ts - 增强搜索模块
import { ref, computed, watch } from 'vue'

interface SearchOptions {
  debounceMs?: number
  maxHistory?: number
}

interface SearchHistory {
  query: string
  timestamp: number
  resultsCount: number
}

// 简单的模糊匹配算法
const fuzzyMatch = (str: string, pattern: string): boolean => {
  str = str.toLowerCase()
  pattern = pattern.toLowerCase()

  // 精确包含
  if (str.includes(pattern)) return true

  // 模糊匹配：检查pattern中每个字符是否按顺序出现在str中
  let patternIdx = 0
  for (let i = 0; i < str.length && patternIdx < pattern.length; i++) {
    if (str[i] === pattern[patternIdx]) {
      patternIdx++
    }
  }
  return patternIdx === pattern.length
}

// 计算匹配分数
const calculateScore = (text: string, query: string): number => {
  text = text.toLowerCase()
  query = query.toLowerCase()

  let score = 0

  // 精确匹配得分最高
  if (text === query) {
    score += 100
  }
  // 开头匹配
  else if (text.startsWith(query)) {
    score += 80
  }
  // 包含匹配
  else if (text.includes(query)) {
    score += 60
  }
  // 模糊匹配
  else if (fuzzyMatch(text, query)) {
    score += 40
  }

  // 短文本匹配优先
  if (text.length < 20) score += 10
  if (text.length < 10) score += 10

  return score
}

export function useSearch<T extends Record<string, any>>(
  items: T[] | (() => T[]),
  keys: (keyof T | string)[],
  options: SearchOptions = {}
) {
  const { debounceMs = 300, maxHistory = 10 } = options

  const query = ref('')
  const searchHistory = ref<SearchHistory[]>([])

  // 获取items（支持函数或数组）
  const getItems = (): T[] => {
    if (typeof items === 'function') {
      return items()
    }
    return items
  }

  // 搜索结果（带排序）
  const results = computed(() => {
    const currentItems = getItems()
    if (!query.value.trim()) return currentItems

    const q = query.value.toLowerCase()
    const resultsWithScore: { item: T; score: number }[] = []

    for (const item of currentItems) {
      let maxScore = 0

      for (const key of keys) {
        const val = item[key as keyof T]
        if (typeof val === 'string') {
          const score = calculateScore(val, q)
          maxScore = Math.max(maxScore, score)
        } else if (Array.isArray(val)) {
          // 搜索数组字段（如tags）
          for (const v of val) {
            if (typeof v === 'string') {
              const score = calculateScore(v, q)
              maxScore = Math.max(maxScore, score)
            }
          }
        }
      }

      if (maxScore > 0) {
        resultsWithScore.push({ item, score: maxScore })
      }
    }

    // 按分数排序
    resultsWithScore.sort((a, b) => b.score - a.score)

    return resultsWithScore.map(r => r.item)
  })

  // 加载搜索历史
  const loadHistory = () => {
    try {
      const saved = localStorage.getItem('search_history')
      if (saved) {
        searchHistory.value = JSON.parse(saved)
      }
    } catch (e) {
      console.warn('Failed to load search history:', e)
    }
  }

  // 保存搜索历史
  const saveHistory = () => {
    try {
      localStorage.setItem('search_history', JSON.stringify(searchHistory.value))
    } catch (e) {
      console.warn('Failed to save search history:', e)
    }
  }

  // 添加到搜索历史
  const addToHistory = () => {
    const q = query.value.trim()
    if (!q) return

    // 移除重复项
    searchHistory.value = searchHistory.value.filter(h => h.query !== q)

    // 添加新项到开头
    searchHistory.value.unshift({
      query: q,
      timestamp: Date.now(),
      resultsCount: results.value.length
    })

    // 限制历史数量
    if (searchHistory.value.length > maxHistory) {
      searchHistory.value = searchHistory.value.slice(0, maxHistory)
    }

    saveHistory()
  }

  // 清除单条历史
  const removeFromHistory = (q: string) => {
    searchHistory.value = searchHistory.value.filter(h => h.query !== q)
    saveHistory()
  }

  // 清除全部历史
  const clearHistory = () => {
    searchHistory.value = []
    saveHistory()
  }

  // HTML转义防XSS
  const escapeHtml = (text: string): string => {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  // 高亮文本（先转义再高亮，防止XSS）
  const highlightText = (text: string): string => {
    if (!text) return ''
    // 先转义HTML
    let escaped = escapeHtml(text)
    if (!query.value.trim()) return escaped

    const regex = new RegExp(`(${query.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    return escaped.replace(regex, '<mark>$1</mark>')
  }

  // 设置查询
  const setQuery = (q: string) => {
    query.value = q
    if (q.trim()) {
      addToHistory()
    }
  }

  // 清除查询
  const clear = () => {
    query.value = ''
  }

  // 初始化
  loadHistory()

  return {
    query,
    results,
    searchHistory,
    setQuery,
    clear,
    highlightText,
    addToHistory,
    removeFromHistory,
    clearHistory,
    fuzzyMatch,
    calculateScore
  }
}

export default useSearch
