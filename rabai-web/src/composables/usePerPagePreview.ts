// Per-Page Preview - 每页单独预览功能
import { ref, computed, watch } from 'vue'

export interface PagePreview {
  id: string
  index: number
  title: string
  thumbnail: string
  elements: PreviewElement[]
  background: string
  transition: string
  duration: number
  status: 'clean' | 'modified' | 'saving' | 'error'
}

export interface PreviewElement {
  id: string
  type: 'text' | 'image' | 'shape' | 'chart' | 'table'
  x: number
  y: number
  width: number
  height: number
  content: any
  style: Record<string, any>
}

export interface PreviewSettings {
  mode: 'grid' | 'list' | 'carousel'
  thumbnailSize: 'small' | 'medium' | 'large'
  showTitle: boolean
  showPageNumber: boolean
  autoRefresh: boolean
  refreshInterval: number
}

export interface PageHistory {
  pageId: string
  snapshot: string
  timestamp: number
}

export function usePerPagePreview() {
  // 页面列表
  const pages = ref<PagePreview[]>([])

  // 当前预览的页面ID
  const currentPageId = ref<string>('')

  // 预览设置
  const settings = ref<PreviewSettings>({
    mode: 'grid',
    thumbnailSize: 'medium',
    showTitle: true,
    showPageNumber: true,
    autoRefresh: true,
    refreshInterval: 3000
  })

  // 页面历史记录
  const pageHistory = ref<Map<string, PageHistory[]>>(new Map())

  // 加载状态
  const loading = ref(false)

  // 初始化示例页面
  const initSamplePages = () => {
    pages.value = [
      {
        id: 'page_1',
        index: 0,
        title: '封面页',
        thumbnail: '',
        elements: [
          { id: 'el_1', type: 'text', x: 100, y: 80, width: 760, height: 100, content: '欢迎使用 RabAiMind', style: { fontSize: 56, fontWeight: 'bold', align: 'center' } }
        ],
        background: '#ffffff',
        transition: 'fade',
        duration: 500,
        status: 'clean'
      },
      {
        id: 'page_2',
        index: 1,
        title: '目录',
        thumbnail: '',
        elements: [
          { id: 'el_2', type: 'text', x: 60, y: 40, width: 840, height: 60, content: '目录', style: { fontSize: 40, fontWeight: 'bold' } },
          { id: 'el_3', type: 'text', x: 60, y: 120, width: 840, height: 380, content: '1. 介绍\n2. 功能\n3. 优势\n4. 定价', style: { fontSize: 24 } }
        ],
        background: '#f8fafc',
        transition: 'slide',
        duration: 400,
        status: 'clean'
      },
      {
        id: 'page_3',
        index: 2,
        title: '功能介绍',
        thumbnail: '',
        elements: [
          { id: 'el_4', type: 'text', x: 60, y: 40, width: 840, height: 60, content: '核心功能', style: { fontSize: 40, fontWeight: 'bold' } },
          { id: 'el_5', type: 'image', x: 100, y: 120, width: 300, height: 200, content: '', style: {} }
        ],
        background: '#ffffff',
        transition: 'fade',
        duration: 500,
        status: 'clean'
      },
      {
        id: 'page_4',
        index: 3,
        title: '总结',
        thumbnail: '',
        elements: [
          { id: 'el_6', type: 'text', x: 100, y: 180, width: 760, height: 80, content: '谢谢观看', style: { fontSize: 48, align: 'center' } }
        ],
        background: '#1e40af',
        transition: 'zoom',
        duration: 500,
        status: 'clean'
      }
    ]

    if (pages.value.length > 0) {
      currentPageId.value = pages.value[0].id
    }
  }

  // 当前页面
  const currentPage = computed(() =>
    pages.value.find(p => p.id === currentPageId.value) || null
  )

  // 获取页面
  const getPage = (pageId: string): PagePreview | undefined =>
    pages.value.find(p => p.id === pageId)

  // 切换页面
  const goToPage = (pageId: string) => {
    if (getPage(pageId)) {
      currentPageId.value = pageId
    }
  }

  // 上一页
  const prevPage = () => {
    const currentIndex = pages.value.findIndex(p => p.id === currentPageId.value)
    if (currentIndex > 0) {
      currentPageId.value = pages.value[currentIndex - 1].id
    }
  }

  // 下一页
  const nextPage = () => {
    const currentIndex = pages.value.findIndex(p => p.id === currentPageId.value)
    if (currentIndex < pages.value.length - 1) {
      currentPageId.value = pages.value[currentIndex + 1].id
    }
  }

  // 更新页面状态
  const updatePageStatus = (pageId: string, status: PagePreview['status']) => {
    const page = getPage(pageId)
    if (page) {
      page.status = status
    }
  }

  // 保存页面快照
  const saveSnapshot = (pageId: string) => {
    const page = getPage(pageId)
    if (!page) return

    // 创建快照
    const snapshot = JSON.stringify({
      elements: page.elements,
      background: page.background,
      transition: page.transition,
      duration: page.duration
    })

    // 保存到历史
    if (!pageHistory.value.has(pageId)) {
      pageHistory.value.set(pageId, [])
    }

    const history = pageHistory.value.get(pageId)!
    history.push({
      pageId,
      snapshot,
      timestamp: Date.now()
    })

    // 限制历史数量
    if (history.length > 20) {
      history.shift()
    }

    // 更新状态
    updatePageStatus(pageId, 'clean')
  }

  // 恢复快照
  const restoreSnapshot = (pageId: string, index: number): boolean => {
    const history = pageHistory.value.get(pageId)
    if (!history || !history[index]) return false

    const snapshot = JSON.parse(history[index].snapshot)
    const page = getPage(pageId)
    if (!page) return false

    page.elements = snapshot.elements
    page.background = snapshot.background
    page.transition = snapshot.transition
    page.duration = snapshot.duration

    return true
  }

  // 更新页面元素
  const updatePageElements = (pageId: string, elements: PreviewElement[]) => {
    const page = getPage(pageId)
    if (page) {
      page.elements = elements
      page.status = 'modified'
    }
  }

  // 更新页面背景
  const updatePageBackground = (pageId: string, background: string) => {
    const page = getPage(pageId)
    if (page) {
      page.background = background
      page.status = 'modified'
    }
  }

  // 添加页面
  const addPage = (afterIndex?: number): PagePreview => {
    const insertIndex = afterIndex !== undefined ? afterIndex + 1 : pages.value.length

    const newPage: PagePreview = {
      id: `page_${Date.now()}`,
      index: insertIndex,
      title: `页面 ${insertIndex + 1}`,
      thumbnail: '',
      elements: [],
      background: '#ffffff',
      transition: 'fade',
      duration: 500,
      status: 'clean'
    }

    pages.value.splice(insertIndex, 0, newPage)

    // 更新索引
    pages.value.forEach((p, i) => p.index = i)

    return newPage
  }

  // 删除页面
  const deletePage = (pageId: string): boolean => {
    const index = pages.value.findIndex(p => p.id === pageId)
    if (index === -1 || pages.value.length <= 1) return false

    pages.value.splice(index, 1)

    // 更新索引
    pages.value.forEach((p, i) => p.index = i)

    // 如果删除的是当前页，切换到前一页
    if (currentPageId.value === pageId) {
      currentPageId.value = pages.value[Math.max(0, index - 1)].id
    }

    return true
  }

  // 复制页面
  const duplicatePage = (pageId: string): PagePreview | null => {
    const page = getPage(pageId)
    if (!page) return null

    const newPage: PagePreview = {
      ...JSON.parse(JSON.stringify(page)),
      id: `page_${Date.now()}`,
      index: page.index + 1,
      title: `${page.title} (副本)`,
      status: 'modified'
    }

    pages.value.splice(newPage.index, 0, newPage)
    pages.value.forEach((p, i) => p.index = i)

    return newPage
  }

  // 重新排序页面
  const reorderPages = (fromIndex: number, toIndex: number) => {
    const page = pages.value[fromIndex]
    if (!page) return

    pages.value.splice(fromIndex, 1)
    pages.value.splice(toIndex, 0, page)

    // 更新索引
    pages.value.forEach((p, i) => p.index = i)
  }

  // 更新设置
  const updateSettings = (updates: Partial<PreviewSettings>) => {
    Object.assign(settings.value, updates)
  }

  // 统计
  const stats = computed(() => ({
    totalPages: pages.value.length,
    currentPage: currentPage.value?.index + 1 || 0,
    modifiedPages: pages.value.filter(p => p.status === 'modified').length,
    currentMode: settings.value.mode,
    thumbnailSize: settings.value.thumbnailSize
  }))

  return {
    pages,
    currentPageId,
    currentPage,
    settings,
    pageHistory,
    loading,
    initSamplePages,
    getPage,
    goToPage,
    prevPage,
    nextPage,
    updatePageStatus,
    saveSnapshot,
    restoreSnapshot,
    updatePageElements,
    updatePageBackground,
    addPage,
    deletePage,
    duplicatePage,
    reorderPages,
    updateSettings,
    stats
  }
}

export default usePerPagePreview
