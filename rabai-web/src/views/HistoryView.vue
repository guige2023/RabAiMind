<template>
  <div class="history-page">
    <div class="history-header">
      <h1 class="page-title">历史记录</h1>
      <div class="header-actions">
        <!-- 批量选择按钮 -->
        <button class="btn btn-outline" @click="toggleSelectMode">
          {{ isSelectMode ? '取消选择' : '批量选择' }}
        </button>
        <!-- 搜索框 -->
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索历史记录..."
            class="search-input"
          />
        </div>
        <!-- R34: 日期范围筛选 -->
        <div class="date-range-filter">
          <span class="date-label">📅</span>
          <input
            v-model="dateFrom"
            type="date"
            class="date-input"
          />
          <span class="date-sep">至</span>
          <input
            v-model="dateTo"
            type="date"
            class="date-input"
          />
          <button v-if="dateFrom || dateTo" class="clear-date-btn" @click="clearDateFilter">
            ✕
          </button>
        </div>
        <div class="filter-tabs">
          <button
            class="tab-btn"
            :class="{ active: filterType === 'all' }"
            @click="clearTagFilter()"
          >
            全部
          </button>
          <button
            class="tab-btn"
            :class="{ active: filterType === 'favorites' }"
            @click="filterType = 'favorites'"
          >
            ⭐ 收藏
          </button>
          <button
            v-if="activeTag"
            class="tab-btn active"
            @click="filterType = 'tags'"
          >
            🏷️ {{ activeTag }}
          </button>
        </div>
        <div class="backup-actions">
          <button class="btn btn-outline" @click="handleExport" title="导出备份">
            📤 导出
          </button>
          <button class="btn btn-outline" @click="triggerImport" title="导入备份">
            📥 导入
          </button>
          <input
            type="file"
            ref="importInput"
            accept=".json"
            @change="handleImport"
            hidden
          />
          <button v-if="historyList.length > 0" class="btn btn-outline btn-danger" @click="clearHistory">
            清空历史
          </button>
        </div>
      </div>
    </div>

    <!-- 批量操作栏 -->
    <div v-if="isSelectMode && filteredList.length > 0" class="batch-actions">
      <label class="select-all">
        <input
          type="checkbox"
          :checked="isAllSelected"
          @change="isAllSelected ? deselectAll() : selectAll()"
        />
        {{ isAllSelected ? '取消全选' : '全选' }}
      </label>
      <span class="selected-count">已选择 {{ selectedItems.size }} 项</span>
      <div class="batch-buttons">
        <button class="batch-btn batch-favorite" @click="batchFavorite" :disabled="selectedItems.size === 0">
          ⭐ 批量收藏
        </button>
        <button class="batch-btn batch-export" @click="batchExport" :disabled="selectedItems.size === 0">
          📥 批量导出
        </button>
        <button class="batch-btn batch-delete" @click="batchDelete" :disabled="selectedItems.size === 0">
          🗑️ 批量删除
        </button>
      </div>
    </div>

    <!-- 骨架屏加载 -->
    <div class="history-list" v-if="isLoading">
      <div v-for="i in 3" :key="i" class="history-item skeleton-item">
        <div class="history-info">
          <div class="skeleton-title"></div>
          <div class="skeleton-desc"></div>
          <div class="skeleton-meta"></div>
        </div>
        <div class="history-actions">
          <div class="skeleton-btn"></div>
          <div class="skeleton-btn"></div>
        </div>
      </div>
    </div>

    <!-- 历史记录列表 -->
    <!-- Virtual scrolling for large lists (50+ items) -->
    <div class="history-list" v-else-if="filteredList.length > 0">
      <!-- Virtual scroll container -->
      <div
        v-if="shouldUseVirtualScroll"
        class="virtual-history-container"
        ref="virtualHistoryRef"
        @scroll="onHistoryScroll"
      >
        <div :style="{ height: virtualHistoryTotalHeight + 'px', position: 'relative' }">
          <div :style="{ position: 'absolute', top: virtualHistoryOffsetY + 'px', left: 0, right: 0 }">
            <div
              v-for="item in virtualHistoryItems"
              :key="item.item.taskId"
              class="history-item"
              :class="{ selected: selectedItems.has(item.item.taskId) }"
              @click="viewResult(item.item)"
            >
              <div class="item-checkbox" @click.stop>
                <input v-if="isSelectMode" type="checkbox" :checked="selectedItems.has(item.item.taskId)" @change="toggleSelect(item.item.taskId)" />
              </div>
              <div class="history-info">
                <h3 class="history-title" v-html="highlightText(item.item.title || '未命名PPT')"></h3>
                <p class="history-desc" v-html="highlightText(item.item.request)"></p>
                <div class="history-meta">
                  <span class="meta-item"><span class="meta-icon">📄</span>{{ item.item.slideCount }}页</span>
                  <span class="meta-item"><span class="meta-icon">🎨</span>{{ getStyleName(item.item.style) }}</span>
                  <span class="meta-item"><span class="meta-icon">🕐</span>{{ formatTime(item.item.createdAt) }}</span>
                </div>
                <div class="tags-container" v-if="item.item.tags && item.item.tags.length > 0">
                  <span v-for="tag in item.item.tags" :key="tag" class="tag" @click.stop="filterByTag(tag)">{{ tag }}<span class="tag-remove" @click.stop="removeTag(item.item, tag)">×</span></span>
                  <button class="tag-add-btn" @click.stop="startEditTags(item.item)">+ 添加</button>
                </div>
                <div v-else class="tags-empty">
                  <button class="tag-add-btn" @click.stop="startEditTags(item.item)">+ 添加标签</button>
                </div>
                <div v-if="editingTags === item.item.taskId" class="tag-edit" @click.stop>
                  <input v-model="newTag" type="text" placeholder="输入标签..." class="tag-input" @keyup.enter="addTag(item.item)" @keyup.escape="closeEditTags" />
                  <button class="tag-confirm" @click="addTag(item.item)">添加</button>
                  <button class="tag-cancel" @click="closeEditTags">取消</button>
                </div>
              </div>
              <div class="history-actions">
                <button class="action-btn" :class="{ favorited: item.item.favorite }" @click.stop="toggleFavorite(item.item)" :title="item.item.favorite ? '取消收藏' : '收藏'">{{ item.item.favorite ? '⭐' : '☆' }}</button>
                <button class="action-btn" @click.stop="downloadAgain(item.item)" title="重新下载">⬇️</button>
                <button class="action-btn" @click.stop="deleteItem(item.item.taskId)" title="删除">🗑️</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- Normal list (small lists) -->
      <template v-else>
        <div
          v-for="item in filteredList"
          :key="item.taskId"
          class="history-item"
          :class="{ selected: selectedItems.has(item.taskId) }"
          @click="viewResult(item)"
        >
          <div class="item-checkbox" @click.stop>
            <input v-if="isSelectMode" type="checkbox" :checked="selectedItems.has(item.taskId)" @change="toggleSelect(item.taskId)" />
          </div>
          <div class="history-info">
            <h3 class="history-title" v-html="highlightText(item.title || '未命名PPT')"></h3>
            <p class="history-desc" v-html="highlightText(item.request)"></p>
            <div class="history-meta">
              <span class="meta-item"><span class="meta-icon">📄</span>{{ item.slideCount }}页</span>
              <span class="meta-item"><span class="meta-icon">🎨</span>{{ getStyleName(item.style) }}</span>
              <span class="meta-item"><span class="meta-icon">🕐</span>{{ formatTime(item.createdAt) }}</span>
            </div>
            <div class="tags-container" v-if="item.tags && item.tags.length > 0">
              <span v-for="tag in item.tags" :key="tag" class="tag" @click.stop="filterByTag(tag)">{{ tag }}<span class="tag-remove" @click.stop="removeTag(item, tag)">×</span></span>
              <button class="tag-add-btn" @click.stop="startEditTags(item)">+ 添加</button>
            </div>
            <div v-else class="tags-empty">
              <button class="tag-add-btn" @click.stop="startEditTags(item)">+ 添加标签</button>
            </div>
            <div v-if="editingTags === item.taskId" class="tag-edit" @click.stop>
              <input v-model="newTag" type="text" placeholder="输入标签..." class="tag-input" @keyup.enter="addTag(item)" @keyup.escape="closeEditTags" />
              <button class="tag-confirm" @click="addTag(item)">添加</button>
              <button class="tag-cancel" @click="closeEditTags">取消</button>
            </div>
          </div>
          <div class="history-actions">
            <button class="action-btn" :class="{ favorited: item.favorite }" @click.stop="toggleFavorite(item)" :title="item.favorite ? '取消收藏' : '收藏'">{{ item.favorite ? '⭐' : '☆' }}</button>
            <button class="action-btn" @click.stop="downloadAgain(item)" title="重新下载">⬇️</button>
            <button class="action-btn" @click.stop="deleteItem(item.taskId)" title="删除">🗑️</button>
          </div>
        </div>
      </template>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-icon">{{ filterType === 'favorites' ? '⭐' : '📂' }}</div>
      <p>{{ searchQuery ? '未找到匹配结果' : (filterType === 'favorites' ? '暂无收藏记录' : '暂无历史记录') }}</p>
      <button class="btn btn-primary" @click="goCreate">开始创建</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { exportBackup, importBackup } from '../composables/useCloudBackup'
import { useSearch } from '../composables/useSearch'
import { api } from '../api/client'

const router = useRouter()

interface HistoryItem {
  taskId: string
  title: string
  request: string
  slideCount: number
  style: string
  createdAt: string
  favorite?: boolean
  tags?: string[]
}

const historyList = ref<HistoryItem[]>([])

// Virtual scrolling for large history lists
const VIRTUAL_SCROLL_THRESHOLD = 50
const VIRTUAL_ITEM_HEIGHT = 160  // approximate height of each history-item in px
const VIRTUAL_OVERSCAN = 5

const virtualHistoryRef = ref<HTMLElement | null>(null)
const virtualHistoryScrollTop = ref(0)
const virtualHistoryContainerHeight = ref(600)

const shouldUseVirtualScroll = computed(() => filteredList.value.length >= VIRTUAL_SCROLL_THRESHOLD)

const virtualHistoryTotalHeight = computed(() => filteredList.value.length * VIRTUAL_ITEM_HEIGHT)

const virtualHistoryVisibleRange = computed(() => {
  const start = Math.max(0, Math.floor(virtualHistoryScrollTop.value / VIRTUAL_ITEM_HEIGHT) - VIRTUAL_OVERSCAN)
  const visibleCount = Math.ceil(virtualHistoryContainerHeight.value / VIRTUAL_ITEM_HEIGHT)
  const end = Math.min(filteredList.value.length, start + visibleCount + VIRTUAL_OVERSCAN * 2)
  return { start, end }
})

const virtualHistoryVisibleItems = computed(() => {
  const items: { index: number; item: HistoryItem }[] = []
  for (let i = virtualHistoryVisibleRange.value.start; i < virtualHistoryVisibleRange.value.end; i++) {
    items.push({ index: i, item: filteredList.value[i] })
  }
  return items
})

const virtualHistoryOffsetY = computed(() => virtualHistoryVisibleRange.value.start * VIRTUAL_ITEM_HEIGHT)

const onHistoryScroll = () => {
  if (virtualHistoryRef.value) {
    virtualHistoryScrollTop.value = virtualHistoryRef.value.scrollTop
  }
}
const filterType = ref<'all' | 'favorites' | 'tags'>('all')
const activeTag = ref<string | null>(null)

// 增强搜索功能
const {
  query: searchQuery,
  results: searchResults,
  highlightText
} = useSearch<HistoryItem>(
  () => historyList.value,
  ['title', 'request', 'style', 'tags'],
  { maxHistory: 10 }
)

// 批量选择
const selectedItems = ref<Set<string>>(new Set())
const isSelectMode = ref(false)

const toggleSelectMode = () => {
  isSelectMode.value = !isSelectMode.value
  if (!isSelectMode.value) {
    selectedItems.value.clear()
  }
}

const toggleSelect = (taskId: string) => {
  if (selectedItems.value.has(taskId)) {
    selectedItems.value.delete(taskId)
  } else {
    selectedItems.value.add(taskId)
  }
}

const selectAll = () => {
  filteredList.value.forEach(item => selectedItems.value.add(item.taskId))
}

const deselectAll = () => {
  selectedItems.value.clear()
}

const isAllSelected = computed(() => {
  return filteredList.value.length > 0 && filteredList.value.every(item => selectedItems.value.has(item.taskId))
})

// 批量操作
const batchDelete = async () => {
  if (selectedItems.value.size === 0) return
  if (!confirm(`确定要删除选中的 ${selectedItems.value.size} 条记录吗？`)) return
  try {
    const taskIds = Array.from(selectedItems.value)
    await api.batch.deleteTasks(taskIds)
    historyList.value = historyList.value.filter(item => !selectedItems.value.has(item.taskId))
    localStorage.setItem('ppt_history', JSON.stringify(historyList.value))
    selectedItems.value.clear()
    isSelectMode.value = false
  } catch (e) {
    alert('批量删除失败: ' + (e as Error).message)
  }
}

const batchFavorite = () => {
  if (selectedItems.value.size === 0) return
  historyList.value.forEach(item => {
    if (selectedItems.value.has(item.taskId)) {
      item.favorite = true
    }
  })
  localStorage.setItem('ppt_history', JSON.stringify(historyList.value))
  selectedItems.value.clear()
  isSelectMode.value = false
}

const batchExport = async () => {
  if (selectedItems.value.size === 0) return
  try {
    const taskIds = Array.from(selectedItems.value)
    const blob = await api.batch.exportPpts(taskIds, 'pptx')
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `batch_ppts_${new Date().toISOString().slice(0, 10)}.zip`
    a.click()
    URL.revokeObjectURL(url)
    selectedItems.value.clear()
    isSelectMode.value = false
  } catch (e) {
    alert('批量导出失败: ' + (e as Error).message)
  }
}
const isLoading = ref(true)
const importInput = ref<HTMLInputElement | null>(null)

// 导出备份
const handleExport = () => {
  try {
    exportBackup()
    alert('导出成功！')
  } catch (e) {
    alert('导出失败')
  }
}

// 触发导入
const triggerImport = () => {
  importInput.value?.click()
}

// 导入备份
const handleImport = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const result = await importBackup(file)
  if (result.success) {
    alert(result.message)
    loadHistory() // Reload history
    window.location.reload() // Refresh to apply settings
  } else {
    alert(result.message)
  }

  // Reset input
  target.value = ''
}

// R34: 日期范围筛选
const dateFrom = ref<string>('')
const dateTo = ref<string>('')

const clearDateFilter = () => {
  dateFrom.value = ''
  dateTo.value = ''
}

const filteredList = computed(() => {
  // 使用增强搜索结果
  let list = searchResults.value.length > 0 || searchQuery.value.trim()
    ? [...searchResults.value]
    : [...historyList.value]

  // Filter by favorites
  if (filterType.value === 'favorites') {
    list = list.filter(item => item.favorite)
  }

  // Filter by tag
  if (filterType.value === 'tags' && activeTag.value) {
    list = list.filter(item => item.tags?.includes(activeTag.value!))
  }

  // R34: Filter by date range
  if (dateFrom.value || dateTo.value) {
    const from = dateFrom.value ? new Date(dateFrom.value) : null
    const to = dateTo.value ? new Date(dateTo.value + 'T23:59:59') : null
    list = list.filter(item => {
      const itemDate = new Date(item.createdAt)
      if (from && itemDate < from) return false
      if (to && itemDate > to) return false
      return true
    })
  }

  return list
})

const loadHistory = () => {
  isLoading.value = true

  // Simulate loading delay
  setTimeout(() => {
    const saved = localStorage.getItem('ppt_history')
    if (saved) {
      historyList.value = JSON.parse(saved)
    }
    isLoading.value = false
  }, 300)
}

const formatTime = (time: string) => {
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString('zh-CN')
}

const getStyleName = (style: string) => {
  const styleMap: Record<string, string> = {
    professional: '专业',
    simple: '简约',
    energetic: '活力',
    premium: '高端',
    creative: '创意',
    tech: '科技',
    nature: '自然',
    elegant: '优雅'
  }
  return styleMap[style] || style
}

const viewResult = (item: HistoryItem) => {
  router.push(`/result/${item.taskId}`)
}

const downloadAgain = (item: HistoryItem) => {
  router.push(`/result/${item.taskId}`)
}

const deleteItem = (taskId: string) => {
  const index = historyList.value.findIndex(h => h.taskId === taskId)
  if (index > -1) {
    historyList.value.splice(index, 1)
    localStorage.setItem('ppt_history', JSON.stringify(historyList.value))
  }
}

const toggleFavorite = (item: HistoryItem) => {
  item.favorite = !item.favorite
  localStorage.setItem('ppt_history', JSON.stringify(historyList.value))
}

// 标签管理
const editingTags = ref<string | null>(null)
const newTag = ref('')

const startEditTags = (item: HistoryItem) => {
  editingTags.value = item.taskId
}

const addTag = (item: HistoryItem) => {
  if (!newTag.value.trim()) return
  if (!item.tags) item.tags = []
  if (!item.tags.includes(newTag.value)) {
    item.tags.push(newTag.value)
    localStorage.setItem('ppt_history', JSON.stringify(historyList.value))
  }
  newTag.value = ''
}

const removeTag = (item: HistoryItem, tag: string) => {
  if (!item.tags) return
  item.tags = item.tags.filter(t => t !== tag)
  localStorage.setItem('ppt_history', JSON.stringify(historyList.value))
}

const closeEditTags = () => {
  editingTags.value = null
  newTag.value = ''
}

const filterByTag = (tag: string) => {
  activeTag.value = tag
  filterType.value = 'tags'
  searchQuery.value = ''
}

const clearTagFilter = () => {
  activeTag.value = null
  filterType.value = 'all'
}

const clearHistory = () => {
  if (confirm('确定要清空所有历史记录吗？')) {
    historyList.value = []
    localStorage.removeItem('ppt_history')
  }
}

const goCreate = () => {
  router.push('/create')
}

let virtualHistoryObserver: ResizeObserver | null = null

onMounted(() => {
  loadHistory()
  // Setup virtual history container ResizeObserver
  nextTick(() => {
    if (virtualHistoryRef.value) {
      virtualHistoryContainerHeight.value = virtualHistoryRef.value.clientHeight
      virtualHistoryObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          virtualHistoryContainerHeight.value = entry.contentRect.height
        }
      })
      virtualHistoryObserver.observe(virtualHistoryRef.value)
    }
  })
})

onUnmounted(() => {
  virtualHistoryObserver?.disconnect()
})
</script>

<style scoped>
.history-page {
  min-height: 100vh;
  background: var(--gray-100);
  padding: 24px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.backup-actions {
  display: flex;
  gap: 8px;
}

.btn-danger {
  color: #FF3B30;
  border-color: #FF3B30;
}

.btn-danger:hover {
  background: #FFEBEE;
}

/* R34: Date Range Filter */
.date-range-filter {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: 8px;
  font-size: 13px;
}

.date-label {
  font-size: 14px;
}

.date-input {
  border: none;
  background: transparent;
  outline: none;
  font-size: 13px;
  color: var(--gray-700);
  cursor: pointer;
  width: 110px;
}

.date-sep {
  color: var(--gray-300);
}

.clear-date-btn {
  border: none;
  background: none;
  cursor: pointer;
  font-size: 12px;
  color: #999;
  padding: 2px 6px;
  border-radius: 4px;
}

.clear-date-btn:hover {
  background: #f0f0f0;
  color: #666;
}

/* Search Box */
.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: 8px;
  min-width: 200px;
}

.search-icon {
  font-size: 14px;
  opacity: 0.6;
}

.search-input {
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
  width: 100%;
  color: var(--gray-700);
}

.search-input::placeholder {
  color: var(--gray-300);
}

.filter-tabs {
  display: flex;
  background: var(--white);
  border-radius: 8px;
  padding: 4px;
  box-shadow: var(--shadow-sm);
}

.tab-btn {
  padding: 8px 16px;
  border: none;
  background: transparent;
  border-radius: 6px;
  font-size: 14px;
  color: var(--gray-500);
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn.active {
  background: var(--primary);
  color: white;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: var(--gray-900);
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.virtual-history-container {
  overflow-y: auto;
  overflow-x: hidden;
  max-height: calc(100vh - 200px);
}

.history-item {
  display: flex;
  align-items: flex-start;
  background: var(--white);
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.history-item:hover {
  box-shadow: var(--shadow-md);
}

.history-info {
  flex: 1;
}

.history-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--gray-700);
  margin-bottom: 8px;
}

.history-desc {
  font-size: 14px;
  color: var(--gray-500);
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.history-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
}

/* Tags */
.tags-container, .tags-empty {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: #EEF2FF;
  color: #4F46E5;
  border-radius: 12px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.tag:hover {
  background: #E0E7FF;
}

.tag-remove {
  margin-left: 2px;
  font-size: 14px;
  line-height: 1;
  opacity: 0.7;
}

.tag-remove:hover {
  opacity: 1;
  color: #DC2626;
}

.tag-add-btn {
  padding: 4px 10px;
  background: transparent;
  border: 1px dashed #ccc;
  border-radius: 12px;
  font-size: 12px;
  color: #999;
  cursor: pointer;
  transition: all 0.2s;
}

.tag-add-btn:hover {
  border-color: #4F46E5;
  color: #4F46E5;
}

.tag-edit {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  padding: 8px;
  background: #f9fafb;
  border-radius: 8px;
}

.tag-input {
  flex: 1;
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
}

.tag-input:focus {
  border-color: #4F46E5;
}

.tag-confirm {
  padding: 6px 12px;
  background: #4F46E5;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
}

.tag-confirm:hover {
  background: #4338CA;
}

.tag-cancel {
  padding: 6px 12px;
  background: #f3f4f6;
  color: #666;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
}

.tag-cancel:hover {
  background: #e5e7EB;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--gray-300);
}

.meta-icon {
  font-size: 14px;
}

.history-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-btn {
  background: var(--gray-100);
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
}

.action-btn:hover {
  background: var(--gray-200);
}

.action-btn.favorited {
  color: #FFB800;
}

/* Batch Actions */
.batch-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: #EEF2FF;
  border-radius: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.select-all {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #4F46E5;
}

.select-all input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.selected-count {
  font-size: 14px;
  color: #666;
  flex: 1;
}

.batch-buttons {
  display: flex;
  gap: 8px;
}

.batch-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.batch-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.batch-favorite {
  background: #FEF3C7;
  color: #D97706;
}

.batch-favorite:hover:not(:disabled) {
  background: #FDE68A;
}

.batch-export {
  background: #DBEAFE;
  color: #2563EB;
}

.batch-export:hover:not(:disabled) {
  background: #BFDBFE;
}

.batch-delete {
  background: #FEE2E2;
  color: #DC2626;
}

.batch-delete:hover:not(:disabled) {
  background: #FECACA;
}

/* Checkbox */
.item-checkbox {
  display: flex;
  align-items: center;
  padding-right: 12px;
}

.item-checkbox input {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.history-item.selected {
  background: #EEF2FF;
  border: 2px solid #4F46E5;
}

/* Empty */
.empty-state {
  text-align: center;
  padding: 80px 20px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state p {
  color: var(--gray-300);
  margin-bottom: 20px;
}

/* Buttons */
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #165DFF;
  color: #fff;
}

.btn-primary:hover {
  background: #0e42d2;
}

.btn-outline {
  background: transparent;
  border: 1px solid #ddd;
  color: #666;
}

.btn-outline:hover {
  background: #f5f5f5;
}

/* 移动端 */
@media (max-width: 768px) {
  .history-item {
    flex-direction: column;
  }

  .history-actions {
    flex-direction: row;
    margin-top: 12px;
  }

  .history-meta {
    flex-wrap: wrap;
  }
}

/* Skeleton Loading */
.skeleton-item {
  pointer-events: none;
}

.skeleton-title {
  height: 20px;
  width: 60%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 4px;
  margin-bottom: 12px;
}

.skeleton-desc {
  height: 14px;
  width: 90%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 4px;
  margin-bottom: 12px;
}

.skeleton-meta {
  height: 12px;
  width: 50%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 4px;
}

.skeleton-btn {
  width: 36px;
  height: 36px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 8px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Dark mode */
:global(.dark) .skeleton-title,
:global(.dark) .skeleton-desc,
:global(.dark) .skeleton-meta,
:global(.dark) .skeleton-btn {
  background: linear-gradient(90deg, #2a2a2a 25%, #333 50%, #2a2a2a 75%);
  background-size: 200% 100%;
}

/* Highlighted text */
:deep(mark) {
  background: #fff3cd;
  color: #856404;
  padding: 0 2px;
  border-radius: 2px;
}
</style>
