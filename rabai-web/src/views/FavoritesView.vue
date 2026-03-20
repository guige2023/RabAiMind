<template>
  <div class="favorites-page">
    <div class="favorites-header">
      <h1 class="page-title">我的收藏</h1>
      <p class="page-subtitle">收藏的模板和历史记录</p>
    </div>

    <main class="favorites-main container">
      <!-- 标签页 -->
      <div class="tabs">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'templates' }"
          @click="activeTab = 'templates'"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="M3 9h18M9 21V9"/>
          </svg>
          模板收藏
          <span class="tab-count">{{ favoriteTemplates.length }}</span>
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'history' }"
          @click="activeTab = 'history'"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12,6 12,12 16,14"/>
          </svg>
          历史收藏
          <span class="tab-count">{{ favoriteHistory.length }}</span>
        </button>
      </div>

      <!-- 模板收藏 -->
      <div v-if="activeTab === 'templates'" class="tab-content">
        <div v-if="favoriteTemplates.length > 0" class="templates-grid">
          <div
            v-for="template in favoriteTemplates"
            :key="template.id"
            class="template-card"
          >
            <div class="template-thumbnail">
              <img :src="template.thumbnail" :alt="template.name" />
              <button
                class="favorite-btn favorited"
                @click="toggleFavorite(template.id)"
                title="取消收藏"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </button>
            </div>
            <div class="template-info">
              <h3 class="template-name">{{ template.name }}</h3>
              <p class="template-desc">{{ template.description }}</p>
              <div class="template-meta">
                <span class="meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                  </svg>
                  {{ template.slides }}页
                </span>
                <span class="meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  {{ template.author }}
                </span>
              </div>
              <div class="template-tags">
                <span v-for="tag in template.tags.slice(0, 3)" :key="tag" class="tag">
                  {{ tag }}
                </span>
              </div>
            </div>
            <div class="template-actions">
              <button class="btn btn-primary" @click="useTemplate(template)">
                使用模板
              </button>
              <button class="btn btn-outline" @click="previewTemplate(template)">
                预览
              </button>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <div class="empty-icon">⭐</div>
          <h3>暂无收藏的模板</h3>
          <p>在模板市场中发现喜欢的模板，点击收藏按钮收藏</p>
          <router-link to="/templates" class="btn btn-primary">
            去模板市场
          </router-link>
        </div>
      </div>

      <!-- 历史收藏 -->
      <div v-if="activeTab === 'history'" class="tab-content">
        <div v-if="favoriteHistory.length > 0" class="history-list">
          <div
            v-for="item in favoriteHistory"
            :key="item.taskId"
            class="history-card"
          >
            <div class="history-preview">
              <div class="preview-placeholder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M3 9h18M9 21V9"/>
                </svg>
              </div>
            </div>
            <div class="history-info">
              <h3 class="history-title">{{ item.title || '未命名PPT' }}</h3>
              <p class="history-request">{{ item.request }}</p>
              <div class="history-meta">
                <span class="meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                  </svg>
                  {{ item.slideCount }}页
                </span>
                <span class="meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12,6 12,12 16,14"/>
                  </svg>
                  {{ formatDate(item.createdAt) }}
                </span>
              </div>
            </div>
            <div class="history-actions">
              <button
                class="favorite-btn favorited"
                @click="toggleHistoryFavorite(item)"
                title="取消收藏"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </button>
              <button class="btn btn-primary" @click="viewResult(item)">
                查看结果
              </button>
              <button class="btn btn-outline" @click="downloadAgain(item)">
                重新下载
              </button>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <div class="empty-icon">📂</div>
          <h3>暂无收藏的历史记录</h3>
          <p>生成PPT后可以收藏方便以后快速访问</p>
          <router-link to="/create" class="btn btn-primary">
            开始创建
          </router-link>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTemplateStore, type Template } from '../composables/useTemplateStore'

const router = useRouter()
const templateStore = useTemplateStore()

// Tab state
const activeTab = ref<'templates' | 'history'>('templates')

// History items
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

// Load favorites from template store
const favoriteTemplates = computed(() => templateStore.favoriteTemplates)

// Get favorite history items
const favoriteHistory = computed(() =>
  historyList.value.filter(item => item.favorite)
)

// Load history from localStorage
const loadHistory = () => {
  try {
    const saved = localStorage.getItem('ppt_history')
    if (saved) {
      historyList.value = JSON.parse(saved)
    }
  } catch {
    // Ignore errors
  }
}

// Format date
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  if (days < 30) return `${Math.floor(days / 7)}周前`
  return `${date.getMonth() + 1}-${date.getDate()}`
}

// Toggle template favorite
const toggleFavorite = (templateId: string) => {
  templateStore.toggleFavorite(templateId)
}

// Toggle history favorite
const toggleHistoryFavorite = (item: HistoryItem) => {
  item.favorite = !item.favorite
  localStorage.setItem('ppt_history', JSON.stringify(historyList.value))
}

// Use template
const useTemplate = (template: Template) => {
  templateStore.useTemplate(template)
  router.push({
    path: '/create',
    query: { template: template.id }
  })
}

// Preview template
const previewTemplate = (template: Template) => {
  console.log('Preview:', template.name)
}

// View result
const viewResult = (item: HistoryItem) => {
  router.push({
    path: '/result',
    query: { taskId: item.taskId }
  })
}

// Download again
const downloadAgain = (item: HistoryItem) => {
  router.push({
    path: '/result',
    query: { taskId: item.taskId, download: 'true' }
  })
}

// Initialize
onMounted(() => {
  templateStore.loadFavorites()
  loadHistory()
})
</script>

<style scoped>
.favorites-page {
  min-height: 100vh;
  background: #f8f9fa;
}

.favorites-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 48px 24px;
  text-align: center;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 8px;
}

.page-subtitle {
  font-size: 16px;
  opacity: 0.9;
}

.favorites-main {
  padding: 32px 24px;
  max-width: 1200px;
  margin: 0 auto;
}

/* Tabs */
.tabs {
  display: flex;
  gap: 16px;
  margin-bottom: 32px;
  border-bottom: 2px solid #eee;
  padding-bottom: 16px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  background: transparent;
  font-size: 15px;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
}

.tab-btn svg {
  width: 18px;
  height: 18px;
}

.tab-btn:hover {
  background: #f5f5f5;
}

.tab-btn.active {
  background: #EEF2FF;
  color: #165DFF;
}

.tab-count {
  background: #e0e0e0;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.tab-btn.active .tab-count {
  background: #165DFF;
  color: white;
}

/* Templates Grid */
.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.template-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s, box-shadow 0.2s;
}

.template-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.template-thumbnail {
  position: relative;
  height: 180px;
  background: #f0f0f0;
}

.template-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.favorite-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 36px;
  height: 36px;
  border: none;
  background: white;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s;
}

.favorite-btn:hover {
  transform: scale(1.1);
}

.favorite-btn svg {
  width: 20px;
  height: 20px;
  color: #999;
}

.favorite-btn.favorited svg {
  color: #FFB800;
}

.template-info {
  padding: 16px;
}

.template-name {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
}

.template-desc {
  font-size: 13px;
  color: #666;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.template-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #999;
}

.meta-item svg {
  width: 14px;
  height: 14px;
}

.template-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag {
  padding: 4px 8px;
  background: #f0f0f0;
  border-radius: 4px;
  font-size: 11px;
  color: #666;
}

.template-actions {
  display: flex;
  gap: 12px;
  padding: 0 16px 16px;
}

.template-actions .btn {
  flex: 1;
}

/* History List */
.history-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.history-card {
  display: flex;
  gap: 20px;
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s, box-shadow 0.2s;
}

.history-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.history-preview {
  width: 160px;
  height: 90px;
  border-radius: 8px;
  overflow: hidden;
  background: #f0f0f0;
  flex-shrink: 0;
}

.preview-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ccc;
}

.preview-placeholder svg {
  width: 40px;
  height: 40px;
}

.history-info {
  flex: 1;
  min-width: 0;
}

.history-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
}

.history-request {
  font-size: 13px;
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

.history-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
}

.history-actions .favorite-btn {
  position: static;
  width: 40px;
  height: 40px;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  background: white;
  border-radius: 16px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
}

.empty-state p {
  font-size: 14px;
  color: #666;
  margin-bottom: 24px;
}

/* Buttons */
.btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-block;
}

.btn-primary {
  background: #165DFF;
  color: white;
  border: none;
}

.btn-primary:hover {
  background: #0D47E8;
}

.btn-outline {
  background: white;
  color: #666;
  border: 1px solid #ddd;
}

.btn-outline:hover {
  border-color: #165DFF;
  color: #165DFF;
}

/* Responsive */
@media (max-width: 768px) {
  .history-card {
    flex-direction: column;
  }

  .history-preview {
    width: 100%;
    height: 160px;
  }

  .history-actions {
    flex-direction: row;
    width: 100%;
  }

  .history-actions .btn {
    flex: 1;
  }

  .history-actions .favorite-btn {
    width: 40px;
    height: 40px;
  }

  .tabs {
    flex-direction: column;
  }

  .template-actions {
    flex-direction: column;
  }
}
</style>
