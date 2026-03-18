<template>
  <div class="history-page">
    <div class="history-header">
      <h1 class="page-title">历史记录</h1>
      <button v-if="historyList.length > 0" class="btn btn-outline" @click="clearHistory">
        清空历史
      </button>
    </div>

    <!-- 历史记录列表 -->
    <div class="history-list" v-if="historyList.length > 0">
      <div
        v-for="item in historyList"
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
      <div class="empty-icon">📂</div>
      <p>暂无历史记录</p>
      <button class="btn btn-primary" @click="goCreate">开始创建</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

interface HistoryItem {
  taskId: string
  title: string
  request: string
  slideCount: number
  style: string
  createdAt: string
}

const historyList = ref<HistoryItem[]>([])

const loadHistory = () => {
  const saved = localStorage.getItem('ppt_history')
  if (saved) {
    historyList.value = JSON.parse(saved)
  }
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
  background: #f5f5f5;
  padding: 24px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: #1D2129;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.history-item {
  display: flex;
  justify-content: space-between;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.history-item:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.history-info {
  flex: 1;
}

.history-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.history-desc {
  font-size: 14px;
  color: #666;
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
  color: #999;
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
  background: #f5f5f5;
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 16px;
}

.action-btn:hover {
  background: #e5e5e5;
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
  color: #999;
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
</style>
