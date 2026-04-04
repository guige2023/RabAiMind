// Global search composable - 全局搜索功能
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTemplateStore } from './useTemplateStore'
import { api } from '../api/client'

interface SearchResult {
  type: 'template' | 'history' | 'page'
  id: string
  title: string
  description?: string
  icon: string
  url: string
  meta?: string
}

interface PPTSearchResult {
  task_id: string
  title: string
  slide_num: number
  matched_text: string
  context: string
}

interface SearchSuggestion {
  type: 'recent' | 'suggestion' | 'category'
  text: string
  icon?: string
}

interface HistoryItem {
  id: string
  title: string
  description?: string
  createdAt: string
}

// 搜索建议
const searchSuggestions = [
  { text: '商业计划书', icon: '💼' },
  { text: '产品发布会', icon: '🚀' },
  { text: '年度总结', icon: '📊' },
  { text: '培训课件', icon: '📚' },
  { text: '公司介绍', icon: '🏢' },
  { text: '项目汇报', icon: '📋' },
  { text: '创意提案', icon: '💡' },
  { text: '个人简历', icon: '👤' }
]

// 页面快速跳转
const quickLinks = [
  { title: '创建PPT', url: '/create', icon: '✨' },
  { title: '模板市场', url: '/templates', icon: '📋' },
  { title: '素材库', url: '/media', icon: '🖼️' },
  { title: '历史记录', url: '/history', icon: '📜' }
]

export function useGlobalSearch() {
  const router = useRouter()
  const templateStore = useTemplateStore()

  // 搜索状态
  const searchQuery = ref('')
  const isSearchOpen = ref(false)
  const searchInputRef = ref<HTMLInputElement | null>(null)
  const selectedIndex = ref(0)

  // R34: 搜索模式 - 是否在PPT内容中搜索
  const searchInPPT = ref(false)
  const pptSearchResults = ref<PPTSearchResult[]>([])
  const pptSearchLoading = ref(false)

  // 搜索历史
  const searchHistory = ref<string[]>([])

  // 加载搜索历史
  const loadSearchHistory = () => {
    try {
      const saved = localStorage.getItem('search_history')
      if (saved) {
        searchHistory.value = JSON.parse(saved)
      }
    } catch {
      // 忽略错误
    }
  }

  // 保存搜索历史
  const saveSearchHistory = (query: string) => {
    if (!query.trim()) return

    // 去重
    const filtered = searchHistory.value.filter(h => h !== query)
    filtered.unshift(query)

    // 限制数量
    searchHistory.value = filtered.slice(0, 10)

    try {
      localStorage.setItem('search_history', JSON.stringify(searchHistory.value))
    } catch {
      // 忽略错误
    }
  }

  // 清除搜索历史
  const clearSearchHistory = () => {
    searchHistory.value = []
    try {
      localStorage.removeItem('search_history')
    } catch {
      // 忽略错误
    }
  }

  // 加载历史记录
  const loadHistoryItems = (): HistoryItem[] => {
    try {
      const saved = localStorage.getItem('ppt_history')
      if (saved) {
        return JSON.parse(saved)
      }
    } catch {
      // 忽略错误
    }
    return []
  }

  // R34: 搜索PPT内容
  const searchPPTContent = async (query: string) => {
    if (!query || query.trim().length < 2) {
      pptSearchResults.value = []
      return
    }

    pptSearchLoading.value = true
    try {
      const res = await api.search.inPPT(query.trim(), 20)
      if (res.data.success) {
        pptSearchResults.value = res.data.results
      } else {
        pptSearchResults.value = []
      }
    } catch (e) {
      console.error('PPT内容搜索失败:', e)
      pptSearchResults.value = []
    } finally {
      pptSearchLoading.value = false
    }
  }

  // 搜索结果
  const searchResults = computed<SearchResult[]>(() => {
    const query = searchQuery.value.toLowerCase().trim()
    if (!query) return []

    const results: SearchResult[] = []

    // 搜索模板
    templateStore.templates.value.forEach(template => {
      if (
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.tags.some(tag => tag.toLowerCase().includes(query))
      ) {
        results.push({
          type: 'template',
          id: template.id,
          title: template.name,
          description: template.description,
          icon: '📋',
          url: `/templates?search=${encodeURIComponent(query)}`,
          meta: `${template.slides}页 | ${template.category}`
        })
      }
    })

    // 搜索历史记录
    const historyItems = loadHistoryItems()
    historyItems.forEach(item => {
      if (item.title.toLowerCase().includes(query)) {
        results.push({
          type: 'history',
          id: item.id,
          title: item.title,
          description: item.description,
          icon: '📜',
          url: `/result?id=${item.id}`,
          meta: new Date(item.createdAt).toLocaleDateString()
        })
      }
    })

    // 搜索页面
    quickLinks.forEach(link => {
      if (link.title.toLowerCase().includes(query)) {
        results.push({
          type: 'page',
          id: link.url,
          title: link.title,
          icon: link.icon,
          url: link.url
        })
      }
    })

    return results.slice(0, 10)
  })

  // 搜索建议
  const suggestions = computed<SearchSuggestion[]>(() => {
    const query = searchQuery.value.toLowerCase().trim()
    const results: SearchSuggestion[] = []

    if (!query) {
      // 无输入时显示最近搜索和建议
      searchHistory.value.slice(0, 5).forEach(h => {
        results.push({ type: 'recent', text: h, icon: '🕐' })
      })

      searchSuggestions.slice(0, 4).forEach(s => {
        results.push({ type: 'suggestion', text: s.text, icon: s.icon })
      })

      return results
    }

    // 输入时显示匹配的建议
    searchSuggestions
      .filter(s => s.text.toLowerCase().includes(query))
      .slice(0, 4)
      .forEach(s => {
        results.push({ type: 'suggestion', text: s.text, icon: s.icon })
      })

    return results
  })

  // 打开搜索
  const openSearch = () => {
    isSearchOpen.value = true
    loadSearchHistory()
    setTimeout(() => {
      searchInputRef.value?.focus()
    }, 100)
  }

  // 关闭搜索
  const closeSearch = () => {
    isSearchOpen.value = false
    searchQuery.value = ''
    selectedIndex.value = 0
    pptSearchResults.value = []
    searchInPPT.value = false
  }

  // 执行搜索
  const performSearch = (query?: string) => {
    const q = query || searchQuery.value
    if (!q.trim()) return

    saveSearchHistory(q)

    if (searchInPPT.value) {
      // 在PPT内容中搜索
      searchPPTContent(q)
      return
    }

    closeSearch()

    // 导航到模板市场并搜索
    router.push({
      path: '/templates',
      query: { search: q }
    })
  }

  // R34: 选择PPT搜索结果，跳转到对应PPT的第N页
  const selectPPTSearchResult = (result: PPTSearchResult) => {
    saveSearchHistory(result.title)
    closeSearch()
    router.push({
      path: '/result',
      query: { taskId: result.task_id, slide: String(result.slide_num) }
    })
  }

  // 选择结果
  const selectResult = (result: SearchResult) => {
    saveSearchHistory(result.title)
    closeSearch()
    router.push(result.url)
  }

  // 键盘导航
  const handleKeyNavigation = (e: KeyboardEvent) => {
    if (searchInPPT.value) {
      // PPT搜索模式下的键盘导航
      const total = pptSearchResults.value.length
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          selectedIndex.value = (selectedIndex.value + 1) % Math.max(total, 1)
          break
        case 'ArrowUp':
          e.preventDefault()
          selectedIndex.value = (selectedIndex.value - 1 + Math.max(total, 1)) % Math.max(total, 1)
          break
        case 'Enter':
          e.preventDefault()
          if (pptSearchResults.value.length > 0) {
            selectPPTSearchResult(pptSearchResults.value[selectedIndex.value])
          } else if (searchQuery.value) {
            performSearch()
          }
          break
        case 'Escape':
          closeSearch()
          break
      }
      return
    }

    const totalItems = searchResults.value.length > 0
      ? searchResults.value.length
      : suggestions.value.length

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        selectedIndex.value = (selectedIndex.value + 1) % totalItems
        break
      case 'ArrowUp':
        e.preventDefault()
        selectedIndex.value = (selectedIndex.value - 1 + totalItems) % totalItems
        break
      case 'Enter':
        e.preventDefault()
        if (searchResults.value.length > 0) {
          selectResult(searchResults.value[selectedIndex.value])
        } else if (suggestions.value.length > 0) {
          performSearch(suggestions.value[selectedIndex.value].text)
        } else if (searchQuery.value) {
          performSearch()
        }
        break
      case 'Escape':
        closeSearch()
        break
    }
  }

  // 初始化
  loadSearchHistory()

  return {
    // 状态
    searchQuery,
    isSearchOpen,
    searchInputRef,
    selectedIndex,
    searchHistory,
    // R34: PPT内容搜索
    searchInPPT,
    pptSearchResults,
    pptSearchLoading,
    // 计算属性
    searchResults,
    suggestions,
    // 方法
    openSearch,
    closeSearch,
    performSearch,
    selectResult,
    selectPPTSearchResult,
    clearSearchHistory,
    handleKeyNavigation,
    searchPPTContent,
    // 快速链接
    quickLinks
  }
}

export default useGlobalSearch
