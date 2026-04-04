// Global search composable - 全局搜索功能
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTemplateStore } from './useTemplateStore'
import { api } from '../api/client'

// R69: Smart Filter Types
export type FilterType = 'date' | 'theme' | 'size' | 'type'
export type FilterSize = 'small' | 'medium' | 'large'
export type FilterSort = 'asc' | 'desc'

export interface SmartFilter {
  type: FilterType
  label: string
  value: string
  icon: string
}

// R69: Parse natural language query into filters and keywords
const parseNaturalLanguage = (query: string): { keywords: string; filters: SmartFilter[] } => {
  const filters: SmartFilter[] = []
  let keywords = query

  // 日期过滤
  const datePatterns = [
    { pattern: /近(?:一天|1天)/, value: 'today', label: '今天' },
    { pattern: /近(?:一周|7天|一周)/, value: 'week', label: '近一周' },
    { pattern: /近(?:一月|30天|一个月)/, value: 'month', label: '近一月' },
    { pattern: /近(?:一年|365天|一年)/, value: 'year', label: '近一年' },
  ]
  for (const dp of datePatterns) {
    const match = keywords.match(dp.pattern)
    if (match) {
      filters.push({ type: 'date', label: dp.label, value: dp.value, icon: '📅' })
      keywords = keywords.replace(dp.pattern, '').trim()
    }
  }

  // 类型过滤
  const typePatterns = [
    { pattern: /图表|chart|柱状|折线|饼图/, value: 'chart', label: '图表' },
    { pattern: /图片|image|照片|photo/, value: 'image', label: '图片' },
    { pattern: /文字|text|纯文本/, value: 'text', label: '文字' },
    { pattern: /封面|标题页|title/, value: 'cover', label: '封面' },
    { pattern: /目录|大纲|outline/, value: 'outline', label: '目录' },
    { pattern: /总结|结尾|end/, value: 'summary', label: '总结' },
  ]
  for (const tp of typePatterns) {
    if (tp.pattern.test(keywords)) {
      filters.push({ type: 'type', label: tp.label, value: tp.value, icon: '📄' })
      keywords = keywords.replace(tp.pattern, '').trim()
    }
  }

  // 主题过滤
  const themePatterns = [
    { pattern: /商务|business/, value: 'business', label: '商务' },
    { pattern: /创意|creative/, value: 'creative', label: '创意' },
    { pattern: /简约|minimal|simple/, value: 'minimal', label: '简约' },
    { pattern: /科技|tech|科技感/, value: 'tech', label: '科技' },
    { pattern: /教育|education|培训/, value: 'education', label: '教育' },
    { pattern: /医疗|medical|健康/, value: 'medical', label: '医疗' },
    { pattern: /金融|finance|银行/, value: 'finance', label: '金融' },
  ]
  for (const thp of themePatterns) {
    if (thp.pattern.test(keywords)) {
      filters.push({ type: 'theme', label: thp.label, value: thp.value, icon: '🎨' })
      keywords = keywords.replace(thp.pattern, '').trim()
    }
  }

  // 大小过滤
  const sizePatterns = [
    { pattern: /小.*页|少.*页|\d.*?页.*?以内/, value: 'small', label: '小(1-5页)' },
    { pattern: /中.*页|\d.*?-\d.*?页/, value: 'medium', label: '中(6-15页)' },
    { pattern: /大.*页|多.*页|\d+.*?页.*?以上/, value: 'large', label: '大(16+页)' },
  ]
  for (const sp of sizePatterns) {
    const match = keywords.match(sp.pattern)
    if (match) {
      filters.push({ type: 'size', label: sp.label, value: sp.value, icon: '📏' })
      keywords = keywords.replace(sp.pattern, '').trim()
    }
  }

  // 清理多余空格
  keywords = keywords.replace(/\s+/g, ' ').trim()

  return { keywords, filters }
}

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

  // R69: Smart Filters
  const activeFilters = ref<SmartFilter[]>([])
  const showFilterPanel = ref(false)

  // R69: Voice Search
  const isVoiceSearching = ref(false)
  const voiceError = ref<string | null>(null)
  const speechRecognizer = ref<any>(null)

  // R111: Advanced Search State
  const advancedSearchResults = ref<any[]>([])
  const advancedSearchLoading = ref(false)
  const advancedSearchTotal = ref(0)
  const advancedSearchPage = ref(1)
  const advancedSearchTotalPages = ref(1)
  const advancedSearchHighlighted = ref<Record<string, any>>({})

  // R111: Multi-filter options (date + type + author + tags)
  const advancedFilters = ref({
    dateFrom: '',
    dateTo: '',
    templateType: 'all' as 'all' | 'ugc' | 'system',
    author: '',
    tags: [] as string[],
    sortBy: 'relevance' as 'relevance' | 'newest' | 'popularity' | 'name',
    useSemantic: true,
  })

  // R111: Search Analytics Dashboard
  const searchAnalytics = ref<{
    trendingQueries: Array<{ query: string; count: number }>
    searchVolumeOverTime: Array<{ date: string; count: number }>
    noResultQueries: Array<{ query: string; count: number }>
    topClickedTemplates: Array<{ id: string; name: string; category: string; click_count: number }>
    popularFilterCombinations: Array<{ filters: string; count: number }>
    totalSearches: number
    uniqueQueries: number
  } | null>(null)
  const analyticsLoading = ref(false)

  // R111: Advanced Search - Multi-filter + semantic search
  const performAdvancedSearch = async (page = 1) => {
    advancedSearchLoading.value = true
    try {
      const res = await api.template.advancedSearch({
        query: searchQuery.value,
        category: activeFilters.value.find(f => f.type === 'theme')?.value,
        style: activeFilters.value.find(f => f.type === 'theme')?.value,
        author: advancedFilters.value.author || undefined,
        tags: advancedFilters.value.tags.length > 0 ? advancedFilters.value.tags : undefined,
        date_from: advancedFilters.value.dateFrom || undefined,
        date_to: advancedFilters.value.dateTo || undefined,
        template_type: advancedFilters.value.templateType,
        sort_by: advancedFilters.value.sortBy,
        page,
        limit: 20,
        use_semantic: advancedFilters.value.useSemantic,
      })
      if (res.data.success) {
        advancedSearchResults.value = res.data.results
        advancedSearchTotal.value = res.data.total
        advancedSearchPage.value = res.data.page
        advancedSearchTotalPages.value = res.data.total_pages
        advancedSearchHighlighted.value = res.data.highlighted_fields || {}
      }
    } catch (e) {
      console.error('[AdvancedSearch] failed:', e)
    } finally {
      advancedSearchLoading.value = false
    }
  }

  // R111: AI Semantic Search (dedicated endpoint)
  const performSemanticSearch = async () => {
    if (!searchQuery.value.trim()) return
    advancedSearchLoading.value = true
    try {
      const res = await api.template.semanticSearch({
        query: searchQuery.value,
        limit: 10,
        category: activeFilters.value.find(f => f.type === 'theme')?.value,
        style: activeFilters.value.find(f => f.type === 'theme')?.value,
      })
      if (res.data.success) {
        advancedSearchResults.value = res.data.results
        advancedSearchTotal.value = res.data.total
      }
    } catch (e) {
      console.error('[SemanticSearch] failed:', e)
    } finally {
      advancedSearchLoading.value = false
    }
  }

  // R111: Load Search Analytics Dashboard
  const loadSearchAnalytics = async (days = 30) => {
    analyticsLoading.value = true
    try {
      const res = await api.template.getSearchAnalyticsDashboard(days)
      if (res.data.success) {
        searchAnalytics.value = {
          trendingQueries: res.data.trending_queries,
          searchVolumeOverTime: res.data.search_volume_over_time,
          noResultQueries: res.data.no_result_queries,
          topClickedTemplates: res.data.top_clicked_templates,
          popularFilterCombinations: res.data.popular_filter_combinations,
          totalSearches: res.data.total_searches,
          uniqueQueries: res.data.unique_queries,
        }
      }
    } catch (e) {
      console.error('[SearchAnalytics] failed:', e)
    } finally {
      analyticsLoading.value = false
    }
  }

  // R111: Highlight search match text in results
  const highlightText = (text: string, query: string): string => {
    if (!query || !text) return text
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`(${escaped})`, 'gi')
    return text.replace(regex, '<mark class="search-highlight">$1</mark>')
  }

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

    // R69: Apply smart filters to query
    let searchQuery = query.trim()
    const parsed = parseNaturalLanguage(searchQuery)
    searchQuery = parsed.keywords || searchQuery

    // Apply filters to activeFilters
    activeFilters.value = parsed.filters

    pptSearchLoading.value = true
    try {
      const res = await api.search.inPPT(searchQuery, 20)
      if (res.data.success) {
        let results = res.data.results
        // Apply local filters if present
        results = applyFilters(results, activeFilters.value)
        pptSearchResults.value = results
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

  // R69: Apply smart filters to results
  const applyFilters = (results: PPTSearchResult[], filters: SmartFilter[]): PPTSearchResult[] => {
    let filtered = [...results]

    for (const filter of filters) {
      switch (filter.type) {
        case 'type':
          filtered = filtered.filter(r => {
            const ctx = (r.context || '').toLowerCase()
            const title = (r.title || '').toLowerCase()
            switch (filter.value) {
              case 'chart':
                return ctx.includes('chart') || ctx.includes('图表') || ctx.includes('柱状') || ctx.includes('折线') || ctx.includes('饼图')
              case 'image':
                return ctx.includes('image') || ctx.includes('图片') || ctx.includes('照片')
              case 'text':
                return !ctx.includes('chart') && !ctx.includes('image') && !ctx.includes('图片')
              case 'cover':
                return title.includes('封面') || title.includes('title') || title.includes('标题')
              case 'summary':
                return title.includes('总结') || title.includes('结尾') || title.includes('end')
              default:
                return true
            }
          })
          break
        case 'theme':
          // Theme filter applied via query context
          break
        case 'date':
          // Date filter - would need task creation date from backend
          break
        case 'size':
          // Size filter based on slide count context
          break
      }
    }

    return filtered
  }

  // R69: Add or remove a smart filter
  const toggleFilter = (filter: SmartFilter) => {
    const idx = activeFilters.value.findIndex(f => f.type === filter.type && f.value === filter.value)
    if (idx >= 0) {
      activeFilters.value.splice(idx, 1)
    } else {
      // Remove any existing filter of same type
      activeFilters.value = activeFilters.value.filter(f => f.type !== filter.type)
      activeFilters.value.push(filter)
    }
    // Re-run search with updated filters
    if (searchQuery.value.trim()) {
      searchPPTContent(searchQuery.value)
    }
  }

  const removeFilter = (filterType: FilterType) => {
    activeFilters.value = activeFilters.value.filter(f => f.type !== filterType)
    if (searchQuery.value.trim()) {
      searchPPTContent(searchQuery.value)
    }
  }

  const clearAllFilters = () => {
    activeFilters.value = []
    if (searchQuery.value.trim()) {
      searchPPTContent(searchQuery.value)
    }
  }

  // R69: Voice Search using Web Speech API
  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      voiceError.value = '当前浏览器不支持语音搜索'
      return
    }

    if (isVoiceSearching.value) {
      stopVoiceSearch()
      return
    }

    voiceError.value = null
    isVoiceSearching.value = true

    speechRecognizer.value = new SpeechRecognition()
    speechRecognizer.value.lang = 'zh-CN'
    speechRecognizer.value.continuous = false
    speechRecognizer.value.interimResults = true

    speechRecognizer.value.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join('')
      searchQuery.value = transcript
      // Auto-search when voice input is complete
      if (event.results[0].isFinal) {
        performSearch()
        stopVoiceSearch()
      }
    }

    speechRecognizer.value.onerror = (event: any) => {
      console.error('Voice search error:', event.error)
      voiceError.value = event.error === 'no-speech' ? '未检测到语音输入' : '语音识别出错'
      stopVoiceSearch()
    }

    speechRecognizer.value.onend = () => {
      stopVoiceSearch()
    }

    speechRecognizer.value.start()
  }

  const stopVoiceSearch = () => {
    if (speechRecognizer.value) {
      try {
        speechRecognizer.value.stop()
      } catch (e) {
        // Ignore
      }
      speechRecognizer.value = null
    }
    isVoiceSearching.value = false
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

    // R111: 导航到模板市场并使用高级搜索
    // Parse natural language query to extract filters
    const parsed = parseNaturalLanguage(q)
    const filters: Record<string, any> = {}
    for (const f of parsed.filters) {
      if (f.type === 'theme') filters.category = f.value
      if (f.type === 'type') filters.template_type = f.value
      if (f.type === 'date') {
        // Map date filter to date range
        const now = new Date()
        if (f.value === 'today') filters.date_from = now.toISOString().split('T')[0]
        if (f.value === 'week') {
          const d = new Date(now); d.setDate(d.getDate() - 7)
          filters.date_from = d.toISOString().split('T')[0]
        }
        if (f.value === 'month') {
          const d = new Date(now); d.setDate(d.getDate() - 30)
          filters.date_from = d.toISOString().split('T')[0]
        }
        if (f.value === 'year') {
          const d = new Date(now); d.setDate(d.getDate() - 365)
          filters.date_from = d.toISOString().split('T')[0]
        }
      }
    }
    // Merge parsed keyword (if any extracted)
    const keyword = parsed.keywords || q

    router.push({
      path: '/templates',
      query: {
        search: keyword,
        ...filters,
        use_semantic: 'true',
      }
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
    // R69: Smart Filters
    activeFilters,
    showFilterPanel,
    // R69: Voice Search
    isVoiceSearching,
    voiceError,
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
    // R69: Smart Filter methods
    toggleFilter,
    removeFilter,
    clearAllFilters,
    // R69: Voice Search
    startVoiceSearch,
    stopVoiceSearch,
    // 快速链接
    quickLinks,
    // R69: Utilities
    parseNaturalLanguage,
    // R111: Advanced Search
    advancedSearchResults,
    advancedSearchLoading,
    advancedSearchTotal,
    advancedSearchPage,
    advancedSearchTotalPages,
    advancedSearchHighlighted,
    advancedFilters,
    searchAnalytics,
    analyticsLoading,
    performAdvancedSearch,
    performSemanticSearch,
    loadSearchAnalytics,
    highlightText,
  }
}

export default useGlobalSearch
