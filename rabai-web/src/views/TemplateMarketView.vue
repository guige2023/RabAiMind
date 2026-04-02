<template>
  <div class="template-market">
    <!-- Header -->
    <header class="market-header">
      <div class="container">
        <h1 class="market-title">模板市场</h1>
        <p class="market-subtitle">发现适合您演示的精美模板</p>

        <!-- Search Bar -->
        <div class="search-bar">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索模板名称、描述或标签..."
            class="search-input"
            @focus="showSearchHistory = true"
            @blur="hideSearchHistory"
          />
          <button v-if="searchQuery" class="clear-btn" @click="clear()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
          <!-- Search History Dropdown -->
          <div v-if="showSearchHistory && searchHistory.length > 0 && !searchQuery" class="search-history-dropdown">
            <div class="history-header">
              <span>最近搜索</span>
              <button class="clear-history-btn" @click="clearHistory">清除</button>
            </div>
            <div
              v-for="item in searchHistory"
              :key="item.query"
              class="history-item"
              @mousedown="setQuery(item.query)"
            >
              <svg class="history-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12,6 12,12 16,14"/>
              </svg>
              <span>{{ item.query }}</span>
              <span class="history-results">{{ item.resultsCount }}个结果</span>
              <button class="remove-history-btn" @click.stop="removeFromHistory(item.query)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <main class="market-main container">
      <!-- Filters Sidebar -->
      <aside class="filters-sidebar">
        <!-- Categories -->
        <div class="filter-section">
          <h3 class="filter-title">分类</h3>
          <div class="filter-options">
            <button
              class="filter-btn"
              :class="{ active: !selectedCategory }"
              @click="selectedCategory = null"
            >
              全部
            </button>
            <button
              v-for="cat in templateCategories"
              :key="cat.id"
              class="filter-btn"
              :class="{ active: selectedCategory === cat.id }"
              @click="selectedCategory = cat.id"
            >
              <span class="filter-icon">{{ cat.icon }}</span>
              {{ cat.name }}
              <span class="filter-count">{{ categoryStats[cat.id] || 0 }}</span>
            </button>
          </div>
        </div>

        <!-- Styles -->
        <div class="filter-section">
          <h3 class="filter-title">风格</h3>
          <div class="filter-options">
            <button
              class="filter-btn"
              :class="{ active: !selectedStyle }"
              @click="selectedStyle = null"
            >
              全部
            </button>
            <button
              v-for="style in templateStyles"
              :key="style.id"
              class="filter-btn"
              :class="{ active: selectedStyle === style.id }"
              @click="selectedStyle = style.id"
            >
              <span class="filter-icon">{{ style.icon }}</span>
              {{ style.name }}
            </button>
          </div>
        </div>

        <!-- Sort -->
        <div class="filter-section">
          <h3 class="filter-title">排序</h3>
          <select v-model="sortBy" class="sort-select">
            <option value="popularity">最受欢迎</option>
            <option value="newest">最新</option>
            <option value="name">名称</option>
          </select>
        </div>

        <!-- Favorites Toggle -->
        <div class="filter-section">
          <button
            class="favorites-toggle"
            :class="{ active: showFavorites }"
            @click="showFavorites = !showFavorites"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            只显示收藏
          </button>
        </div>
      </aside>

      <!-- Templates Grid -->
      <section class="templates-section">
        <div class="templates-header">
          <div class="templates-tabs">
            <button 
              class="tab-btn" 
              :class="{ active: !showMyTemplates && !showFavorites }"
              @click="showMyTemplates = false; showFavorites = false">
              全部模板
            </button>
            <button 
              class="tab-btn" 
              :class="{ active: showMyTemplates }"
              @click="showMyTemplates = true; showFavorites = false">
              📁 我的模板
            </button>
            <button 
              class="tab-btn" 
              :class="{ active: showFavorites }"
              @click="showMyTemplates = false; showFavorites = true">
              ⭐ 收藏
            </button>
          </div>
          <span class="templates-count">
            {{ displayTemplates.length }} 个模板
          </span>
        </div>

        <!-- Templates Grid -->
        <div v-if="displayTemplates.length > 0" class="templates-grid">
          <article
            v-for="template in displayTemplates"
            :key="template.id"
            class="template-card"
            @click="selectTemplate(template)"
          >
            <!-- Thumbnail -->
            <div class="template-thumbnail">
              <div class="thumbnail-placeholder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M9 9h6M9 12h6M9 15h4"/>
                </svg>
              </div>
              <!-- Premium Badge -->
              <span v-if="template.isPremium" class="premium-badge">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z"/>
                </svg>
                VIP
              </span>
              <!-- Favorite Button -->
              <button
                class="favorite-btn"
                :class="{ active: isFavorite(template.id) }"
                @click.stop="toggleFavorite(template.id)"
              >
                <svg viewBox="0 0 24 24" :fill="isFavorite(template.id) ? 'currentColor' : 'none'" stroke="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </button>
            </div>

            <!-- Info -->
            <div class="template-info">
              <h3 class="template-name" v-html="highlightText(template.name)"></h3>
              <p class="template-desc" v-html="highlightText(template.description)"></p>

              <!-- Tags -->
              <div class="template-tags">
                <span v-for="tag in template.tags.slice(0, 3)" :key="tag" class="tag">
                  {{ tag }}
                </span>
              </div>

              <!-- Meta -->
              <div class="template-meta">
                <span class="meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
                  </svg>
                  {{ template.slides }}页
                </span>
                <span class="meta-item popularity">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  {{ template.popularity }}
                </span>
              </div>
            </div>
          </article>
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <h3>没有找到模板</h3>
          <p>试试调整筛选条件或搜索词</p>
          <button class="reset-btn" @click="resetFilters">重置筛选</button>
        </div>
      </section>
    </main>

    <!-- Template Detail Modal -->
    <Teleport to="body">
      <div v-if="selectedTemplate" class="modal-overlay" @click="selectedTemplate = null">
        <div class="modal-content template-modal" @click.stop>
          <button class="modal-close" @click="selectedTemplate = null">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>

          <div class="modal-body">
            <!-- Preview -->
            <div class="template-preview">
              <div class="preview-placeholder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M9 9h6M9 12h6M9 15h4"/>
                </svg>
                <span>{{ selectedTemplate.name }}</span>
              </div>
            </div>

            <!-- Details -->
            <div class="template-details">
              <div class="detail-header">
                <h2>{{ selectedTemplate.name }}</h2>
                <button
                  class="favorite-btn large"
                  :class="{ active: isFavorite(selectedTemplate.id) }"
                  @click="toggleFavorite(selectedTemplate.id)"
                >
                  <svg viewBox="0 0 24 24" :fill="isFavorite(selectedTemplate.id) ? 'currentColor' : 'none'" stroke="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                  {{ isFavorite(selectedTemplate.id) ? '已收藏' : '收藏' }}
                </button>
              </div>

              <p class="template-description">{{ selectedTemplate.description }}</p>

              <div class="detail-tags">
                <span v-for="tag in selectedTemplate.tags" :key="tag" class="tag">
                  {{ tag }}
                </span>
              </div>

              <div class="detail-meta">
                <span class="meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <path d="M14 2v6h6"/>
                  </svg>
                  {{ selectedTemplate.slides }} 页
                </span>
                <span class="meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                  {{ selectedTemplate.createdAt }}
                </span>
                <span class="meta-item">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  热度 {{ selectedTemplate.popularity }}
                </span>
                <span v-if="selectedTemplate.isPremium" class="meta-item premium">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z"/>
                  </svg>
                  VIP模板
                </span>
              </div>

              <div class="detail-actions">
                <button class="action-btn primary" @click="useTemplateAndNavigate(selectedTemplate)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                  使用此模板
                </button>
                <button class="action-btn secondary" @click="previewTemplate(selectedTemplate)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  预览
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  useTemplateStore,
  templateCategories,
  templateStyles,
  type Template
} from '../composables/useTemplateStore'
import { useSearch } from '../composables/useSearch'
import { api } from '../api/client'

const router = useRouter()
const store = useTemplateStore()

// Reactive state from store
const selectedCategory = ref<string | null>(null)
const selectedStyle = ref<string | null>(null)
const sortBy = ref<'popularity' | 'newest' | 'name'>('popularity')
const showFavorites = ref(false)
const showMyTemplates = ref(false)
const myTemplates = ref<Template[]>([])
const selectedTemplate = ref<Template | null>(null)
const showSearchHistory = ref(false)

// 隐藏搜索历史
const hideSearchHistory = () => {
  setTimeout(() => {
    showSearchHistory.value = false
  }, 200)
}

// 增强搜索功能 - 使用getter函数保持响应式
const {
  query: searchQuery,
  results: searchResults,
  searchHistory,
  setQuery,
  clear,
  highlightText,
  removeFromHistory,
  clearHistory
} = useSearch<Template>(
  () => store.templates.value,
  ['name', 'description', 'tags', 'category', 'style', 'author'],
  { maxHistory: 10 }
)

// Sync with store
onMounted(() => {
  store.loadTemplates()
  store.loadCategoriesAndStyles()  // BUG修复: 从API加载分类/风格
  store.loadFavorites()
  loadMyTemplates()
})

// 加载我的模板
const loadMyTemplates = async () => {
  try {
    const res = await api.template.listMyTemplates()
    if (res.data.success) {
      myTemplates.value = res.data.templates.map((t: any) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        category: t.category,
        style: t.style,
        thumbnail: t.thumbnail,
        isPremium: false,
        isFavorite: false
      }))
    }
  } catch (e) {
    console.error('加载我的模板失败:', e)
  }
}

// Computed - 使用增强搜索结果
const filteredTemplates = computed(() => {
  // 使用useSearch的模糊搜索结果（已按相关性排序）
  let result = searchResults.value.length > 0 || searchQuery.value.trim()
    ? [...searchResults.value]
    : [...store.templates.value]

  // Category filter
  if (selectedCategory.value) {
    result = result.filter(t => t.category === selectedCategory.value)
  }

  // Style filter
  if (selectedStyle.value) {
    result = result.filter(t => t.style === selectedStyle.value)
  }

  // Sort - 如果没有搜索关键词则按排序，否则保持相关性排序
  if (!searchQuery.value.trim()) {
    switch (sortBy.value) {
      case 'popularity':
        result.sort((a, b) => b.popularity - a.popularity)
        break
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name))
        break
    }
  }

  return result
})

const displayTemplates = computed(() => {
  if (showMyTemplates.value) {
    return myTemplates.value
  }
  if (showFavorites.value) {
    return store.favoriteTemplates.value.filter(t =>
      filteredTemplates.value.some(ft => ft.id === t.id)
    )
  }
  return filteredTemplates.value
})

const categoryStats = computed(() => store.categoryStats.value)

// Store methods
const { toggleFavorite, isFavorite, useTemplate, favoriteTemplates } = store

// Actions
const selectTemplate = (template: Template) => {
  selectedTemplate.value = template
}

const useTemplateAndNavigate = (template: Template) => {
  useTemplate(template)
  router.push({
    path: '/create',
    query: { template: template.id }
  })
}

const previewTemplate = (template: Template) => {
  // Open preview in modal or new tab
  console.log('Preview:', template.name)
}

const resetFilters = () => {
  searchQuery.value = ''
  selectedCategory.value = null
  selectedStyle.value = null
  sortBy.value = 'popularity'
  showFavorites.value = false
}
</script>

<style scoped>
.template-market {
  min-height: 100vh;
  background: #f8f9fa;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
}

/* Header */
.market-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 48px 0 32px;
  color: white;
}

.market-title {
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 8px;
}

.market-subtitle {
  font-size: 18px;
  opacity: 0.9;
  margin-bottom: 24px;
}

/* Search Bar */
.search-bar {
  position: relative;
  max-width: 600px;
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  color: #666;
}

.search-input {
  width: 100%;
  padding: 14px 48px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.search-input:focus {
  outline: none;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
}

.clear-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 28px;
  height: 28px;
  border: none;
  background: #e0e0e0;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-btn svg {
  width: 14px;
  height: 14px;
  color: #666;
}

/* Search History Dropdown */
.search-history-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 8px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 100;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
  font-size: 13px;
  color: #666;
}

.clear-history-btn {
  border: none;
  background: none;
  color: #e74c3c;
  cursor: pointer;
  font-size: 13px;
}

.clear-history-btn:hover {
  text-decoration: underline;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.history-item:hover {
  background: #f5f5f5;
}

.history-icon {
  width: 16px;
  height: 16px;
  color: #999;
}

.history-results {
  margin-left: auto;
  font-size: 12px;
  color: #999;
}

.remove-history-btn {
  border: none;
  background: none;
  cursor: pointer;
  padding: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.history-item:hover .remove-history-btn {
  opacity: 1;
}

.remove-history-btn svg {
  width: 14px;
  height: 14px;
  color: #999;
}

.remove-history-btn:hover svg {
  color: #e74c3c;
}

/* Highlighted text */
:deep(mark) {
  background: #fff3cd;
  color: #856404;
  padding: 0 2px;
  border-radius: 2px;
}

/* Main Layout */
.market-main {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 32px;
  padding: 32px 24px;
}

/* Filters Sidebar */
.filters-sidebar {
  position: sticky;
  top: 24px;
  height: fit-content;
}

.filter-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.filter-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #555;
  text-align: left;
  transition: all 0.2s;
}

.filter-btn:hover {
  background: #f5f5f5;
}

.filter-btn.active {
  background: #667eea;
  color: white;
}

.filter-icon {
  font-size: 16px;
}

.filter-count {
  margin-left: auto;
  font-size: 12px;
  background: #eee;
  padding: 2px 8px;
  border-radius: 10px;
}

.filter-btn.active .filter-count {
  background: rgba(255, 255, 255, 0.2);
}

.sort-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}

.favorites-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #555;
  transition: all 0.2s;
}

.favorites-toggle svg {
  width: 18px;
  height: 18px;
}

.favorites-toggle:hover {
  border-color: #ff4757;
  color: #ff4757;
}

.favorites-toggle.active {
  background: #ff4757;
  border-color: #ff4757;
  color: white;
}

/* Templates Section */
.templates-section {
  min-height: 400px;
}

.templates-header {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.templates-tabs {
  display: flex;
  gap: 8px;
}

.tab-btn {
  padding: 8px 16px;
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 20px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  color: #666;
}

.tab-btn:hover {
  background: #f5f5f5;
  border-color: #165DFF;
  color: #165DFF;
}

.tab-btn.active {
  background: #165DFF;
  border-color: #165DFF;
  color: white;
}

.templates-count {
  font-size: 14px;
  color: #666;
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

/* Template Card */
.template-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.3s;
}

.template-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.template-thumbnail {
  position: relative;
  height: 180px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.thumbnail-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #aaa;
}

.thumbnail-placeholder svg {
  width: 48px;
  height: 48px;
}

.thumbnail-placeholder span {
  font-size: 14px;
}

.premium-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: linear-gradient(135deg, #ffd700 0%, #ffb800 100%);
  color: #333;
  font-size: 12px;
  font-weight: 600;
  border-radius: 20px;
}

.premium-badge svg {
  width: 12px;
  height: 12px;
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}

.favorite-btn svg {
  width: 18px;
  height: 18px;
  color: #ff4757;
}

.favorite-btn:hover {
  transform: scale(1.1);
}

.favorite-btn.large {
  width: auto;
  padding: 8px 16px;
  border-radius: 20px;
  gap: 6px;
  font-size: 14px;
}

/* Template Info */
.template-info {
  padding: 16px;
}

.template-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.template-desc {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.template-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.tag {
  padding: 4px 10px;
  background: #f0f2f5;
  color: #555;
  font-size: 12px;
  border-radius: 12px;
}

.template-meta {
  display: flex;
  gap: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #888;
}

.meta-item svg {
  width: 14px;
  height: 14px;
}

.meta-item.popularity {
  color: #ffa502;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 80px 20px;
}

.empty-state svg {
  width: 64px;
  height: 64px;
  color: #ccc;
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: 18px;
  color: #333;
  margin-bottom: 8px;
}

.empty-state p {
  color: #666;
  margin-bottom: 20px;
}

.reset-btn {
  padding: 10px 24px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.reset-btn:hover {
  background: #5568d3;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
}

.modal-content {
  background: white;
  border-radius: 20px;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  overflow: auto;
  position: relative;
}

.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 40px;
  height: 40px;
  border: none;
  background: #f5f5f5;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.modal-close svg {
  width: 20px;
  height: 20px;
  color: #666;
}

.modal-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
}

.template-preview {
  background: #f5f7fa;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: #aaa;
}

.preview-placeholder svg {
  width: 80px;
  height: 80px;
}

.preview-placeholder span {
  font-size: 18px;
  font-weight: 600;
}

.template-details {
  padding: 32px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.detail-header h2 {
  font-size: 24px;
  color: #333;
}

.template-description {
  color: #666;
  line-height: 1.6;
  margin-bottom: 16px;
}

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
}

.detail-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
}

.meta-item.premium {
  color: #ffa502;
}

.detail-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn svg {
  width: 18px;
  height: 18px;
}

.action-btn.primary {
  background: #667eea;
  color: white;
  flex: 1;
}

.action-btn.primary:hover {
  background: #5568d3;
}

.action-btn.secondary {
  background: #f5f5f5;
  color: #333;
}

.action-btn.secondary:hover {
  background: #e8e8e8;
}

@media (max-width: 900px) {
  .market-main {
    grid-template-columns: 1fr;
  }

  .filters-sidebar {
    position: static;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
  }

  .filter-section {
    margin-bottom: 0;
  }

  .modal-body {
    grid-template-columns: 1fr;
  }
}
</style>
