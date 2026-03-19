<template>
  <div class="history-page">
    <div class="history-header">
      <h1 class="page-title">历史记录</h1>
      <div class="header-actions">
        <div class="filter-tabs">
          <button
            class="tab-btn"
            :class="{ active: filterType === 'all' }"
            @click="filterType = 'all'"
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
    <div class="history-list" v-else-if="filteredList.length > 0">
      <div
        v-for="item in filteredList"
        :key="item.taskId"
        class="history-item"
        @click="viewResult(item)"
      >
        <div class="history-info">
          <h3 class="history-title">{{ item.title || '未命名PPT' }}</h3>
          <p class="history-desc">{{ item.request }}</p>
          <div class="history-meta">
            <span class="meta-item">
              <span class="meta-icon">📄</span>
              {{ item.slideCount }}页
            </span>
            <span class="meta-item">
              <span class="meta-icon">🎨</span>
              {{ getStyleName(item.style) }}
            </span>
            <span class="meta-item">
              <span class="meta-icon">🕐</span>
              {{ formatTime(item.createdAt) }}
            </span>
          </div>
        </div>
        <div class="history-actions">
          <button
            class="action-btn"
            :class="{ favorited: item.favorite }"
            @click.stop="toggleFavorite(item)"
            :title="item.favorite ? '取消收藏' : '收藏'"
          >
            {{ item.favorite ? '⭐' : '☆' }}
          </button>
          <button class="action-btn" @click.stop="downloadAgain(item)" title="重新下载">
            ⬇️
          </button>
          <button class="action-btn" @click.stop="deleteItem(item.taskId)" title="删除">
            🗑️
          </button>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-icon">{{ filterType === 'favorites' ? '⭐' : '📂' }}</div>
      <p>{{ filterType === 'favorites' ? '暂无收藏记录' : '暂无历史记录' }}</p>
      <button class="btn btn-primary" @click="goCreate">开始创建</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { exportBackup, importBackup } from '../composables/useCloudBackup'

const router = useRouter()

interface HistoryItem {
  taskId: string
  title: string
  request: string
  slideCount: number
  style: string
  createdAt: string
  favorite?: boolean
}

const historyList = ref<HistoryItem[]>([])
const filterType = ref<'all' | 'favorites'>('all')
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

const filteredList = computed(() => {
  if (filterType.value === 'favorites') {
    return historyList.value.filter(item => item.favorite)
  }
  return historyList.value
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
  router.push({ path: '/result', query: { taskId: item.taskId } })
}

const downloadAgain = (item: HistoryItem) => {
  router.push({ path: '/result', query: { taskId: item.taskId } })
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

const clearHistory = () => {
  if (confirm('确定要清空所有历史记录吗？')) {
    historyList.value = []
    localStorage.removeItem('ppt_history')
  }
}

const goCreate = () => {
  router.push('/create')
}

onMounted(() => {
  loadHistory()
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

.history-item {
  display: flex;
  justify-content: space-between;
  background: var(--white);
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;
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

/* Dark mode */
:global(.dark) .skeleton-title,
:global(.dark) .skeleton-desc,
:global(.dark) .skeleton-meta,
:global(.dark) .skeleton-btn {
  background: linear-gradient(90deg, #2a2a2a 25%, #333 50%, #2a2a2a 75%);
  background-size: 200% 100%;
}
</style>
