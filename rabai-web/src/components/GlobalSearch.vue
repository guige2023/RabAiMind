<template>
  <Teleport to="body">
    <Transition name="search-fade">
      <div v-if="isSearchOpen" class="search-overlay" @click="closeSearch">
        <div class="search-modal" @click.stop>
          <!-- Search Input -->
          <div class="search-input-wrapper">
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              ref="searchInputRef"
              v-model="searchQuery"
              type="text"
              :placeholder="searchInPPT ? '搜索PPT内容，支持自然语言...' : '搜索模板、页面...'"
              class="search-input"
              @keydown="handleKeyNavigation"
              @input="onInputChange"
            />
            <!-- R69: Voice Search Button -->
            <button
              class="voice-btn"
              :class="{ active: isVoiceSearching, recording: isVoiceSearching }"
              @click="startVoiceSearch"
              :title="isVoiceSearching ? '停止录音' : '语音搜索'"
            >
              <svg v-if="!isVoiceSearching" class="mic-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
              <svg v-else class="mic-icon pulse" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" fill="#ef4444"/>
                <rect x="9" y="9" width="6" height="6" fill="white"/>
              </svg>
            </button>
            <button v-if="searchQuery" class="clear-btn" @click="searchQuery = ''">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
            <kbd class="esc-hint">ESC</kbd>
          </div>

          <!-- R69: Smart Filter Chips -->
          <div v-if="searchInPPT && (activeFilters.length > 0 || searchQuery)" class="smart-filter-bar">
            <span class="filter-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="14" height="14">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
              </svg>
              智能筛选
            </span>
            <!-- Active Filter Chips -->
            <button
              v-for="filter in activeFilters"
              :key="`${filter.type}-${filter.value}`"
              class="filter-chip active"
              @click="removeFilter(filter.type)"
            >
              {{ filter.icon }} {{ filter.label }}
              <span class="chip-close">×</span>
            </button>
            <!-- Filter Toggle Buttons -->
            <div class="filter-toggles">
              <button class="filter-toggle-btn" @click="toggleQuickFilter('type', 'chart', '📊', '图表')" :class="{ active: activeFilters.some(f => f.type === 'type' && f.value === 'chart') }">📊 图表</button>
              <button class="filter-toggle-btn" @click="toggleQuickFilter('type', 'image', '🖼️', '图片')" :class="{ active: activeFilters.some(f => f.type === 'type' && f.value === 'image') }">🖼️ 图片</button>
              <button class="filter-toggle-btn" @click="toggleQuickFilter('type', 'text', '📝', '文字')" :class="{ active: activeFilters.some(f => f.type === 'type' && f.value === 'text') }">📝 文字</button>
              <button class="filter-toggle-btn" @click="toggleQuickFilter('theme', 'business', '💼', '商务')" :class="{ active: activeFilters.some(f => f.type === 'theme' && f.value === 'business') }">💼 商务</button>
              <button class="filter-toggle-btn" @click="toggleQuickFilter('theme', 'creative', '🎨', '创意')" :class="{ active: activeFilters.some(f => f.type === 'theme' && f.value === 'creative') }">🎨 创意</button>
              <button class="filter-toggle-btn" @click="toggleQuickFilter('size', 'small', '📏', '小')" :class="{ active: activeFilters.some(f => f.type === 'size' && f.value === 'small') }">📏 小</button>
              <button class="filter-toggle-btn" @click="toggleQuickFilter('size', 'medium', '📐', '中')" :class="{ active: activeFilters.some(f => f.type === 'size' && f.value === 'medium') }">📐 中</button>
              <button class="filter-toggle-btn" @click="toggleQuickFilter('size', 'large', '📏', '大')" :class="{ active: activeFilters.some(f => f.type === 'size' && f.value === 'large') }">📏 大</button>
            </div>
            <button v-if="activeFilters.length > 0" class="clear-all-filters" @click="clearAllFilters">清除全部</button>
          </div>

          <!-- R34: Search Mode Toggle -->
          <div class="search-mode-bar">
            <button
              class="mode-btn"
              :class="{ active: !searchInPPT }"
              @click="searchInPPT = false"
            >
              🔍 全局搜索
            </button>
            <button
              class="mode-btn"
              :class="{ active: searchInPPT }"
              @click="searchInPPT = true; searchQuery && performSearch()"
            >
              📄 搜索PPT内容
            </button>
          </div>

          <!-- Search Content -->
          <div class="search-content">
            <!-- PPT搜索模式 -->
            <template v-if="searchInPPT">
              <template v-if="pptSearchLoading">
                <div class="ppt-search-loading">
                  <div class="loading-spinner"></div>
                  <span>搜索中...</span>
                </div>
              </template>
              <template v-else-if="pptSearchResults.length > 0">
                <div class="ppt-results-header">
                  <span class="ppt-results-count">找到 {{ pptSearchResults.length }} 条结果</span>
                </div>
                <div class="ppt-search-results">
                  <button
                    v-for="(result, index) in pptSearchResults"
                    :key="`${result.task_id}-${result.slide_num}`"
                    class="ppt-result-item"
                    :class="{ active: selectedIndex === index }"
                    @click="selectPPTSearchResult(result)"
                  >
                    <div class="ppt-result-icon">📄</div>
                    <div class="ppt-result-content">
                      <div class="ppt-result-title">
                        <strong>{{ result.title }}</strong>
                        <span class="slide-badge">第{{ result.slide_num }}页</span>
                      </div>
                      <div class="ppt-result-context" v-html="highlightPPTMatch(result.context, searchQuery)"></div>
                    </div>
                  </button>
                </div>
              </template>
              <template v-else-if="searchQuery && !pptSearchLoading">
                <div class="no-results">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="M21 21l-4.35-4.35"/>
                  </svg>
                  <p>在PPT内容中未找到 "{{ searchQuery }}"</p>
                </div>
              </template>
              <template v-else>
                <div class="ppt-search-hint">
                  <p>📄 在所有已生成的PPT内容中搜索关键词</p>
                  <p class="hint-sub">输入至少2个字符开始搜索</p>
                </div>
              </template>
            </template>

            <!-- 普通搜索模式 -->
            <template v-else>
              <!-- No Input - Show Suggestions -->
              <template v-if="!searchQuery">
                <!-- Recent Searches -->
                <div v-if="searchHistory.length > 0" class="search-section">
                  <div class="section-header">
                    <h3>最近搜索</h3>
                    <button class="clear-history-btn" @click="clearSearchHistory">清除</button>
                  </div>
                  <div class="search-items">
                    <button
                      v-for="(item, index) in searchHistory.slice(0, 10)"
                      :key="item"
                      class="search-item"
                      :class="{ active: selectedIndex === index }"
                      @click="performSearch(item)"
                    >
                      <span class="item-icon">🕐</span>
                      <span class="item-text">{{ item }}</span>
                    </button>
                  </div>
                </div>

                <!-- Suggestions -->
                <div class="search-section">
                  <h3>推荐搜索</h3>
                  <div class="search-items">
                    <button
                      v-for="(item, index) in suggestions"
                      :key="item.text"
                      class="search-item"
                      :class="{ active: selectedIndex === searchHistory.length + index }"
                      @click="performSearch(item.text)"
                    >
                      <span class="item-icon">{{ item.icon }}</span>
                      <span class="item-text">{{ item.text }}</span>
                    </button>
                  </div>
                </div>

                <!-- Quick Links -->
                <div class="search-section">
                  <h3>快速访问</h3>
                  <div class="quick-links">
                    <router-link
                      v-for="link in quickLinks"
                      :key="link.url"
                      :to="link.url"
                      class="quick-link"
                      @click="closeSearch"
                    >
                      <span class="link-icon">{{ link.icon }}</span>
                      <span class="link-text">{{ link.title }}</span>
                    </router-link>
                  </div>
                </div>
              </template>

              <!-- Has Input - Show Results -->
              <template v-else>
                <div v-if="searchResults.length > 0" class="search-results">
                  <button
                    v-for="(result, index) in searchResults"
                    :key="result.id"
                    class="result-item"
                    :class="{ active: selectedIndex === index }"
                    @click="selectResult(result)"
                  >
                    <span class="result-icon">{{ result.icon }}</span>
                    <div class="result-content">
                      <span class="result-title">{{ result.title }}</span>
                      <span v-if="result.description" class="result-desc">{{ result.description }}</span>
                    </div>
                    <span v-if="result.meta" class="result-meta">{{ result.meta }}</span>
                  </button>
                </div>
                <div v-else class="no-results">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="M21 21l-4.35-4.35"/>
                  </svg>
                  <p>没有找到 "{{ searchQuery }}" 相关内容</p>
                  <button class="search-btn" @click="performSearch()">
                    搜索模板市场
                  </button>
                </div>
              </template>
            </template>
          </div>

          <!-- Search Footer -->
          <div class="search-footer">
            <span class="hint">
              <kbd>↑</kbd><kbd>↓</kbd> 导航
            </span>
            <span class="hint">
              <kbd>Enter</kbd> 确认
            </span>
            <span class="hint">
              <kbd>ESC</kbd> 关闭
            </span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useGlobalSearch } from '../composables/useGlobalSearch'
import type { FilterType } from '../composables/useGlobalSearch'

const {
  searchQuery,
  isSearchOpen,
  searchInputRef,
  selectedIndex,
  searchHistory,
  searchResults,
  suggestions,
  searchInPPT,
  pptSearchResults,
  pptSearchLoading,
  activeFilters,
  isVoiceSearching,
  voiceError,
  openSearch,
  closeSearch,
  performSearch,
  selectResult,
  selectPPTSearchResult,
  clearSearchHistory,
  handleKeyNavigation,
  toggleFilter,
  removeFilter,
  clearAllFilters,
  startVoiceSearch,
  stopVoiceSearch
} = useGlobalSearch()

// R69: Quick filter toggle helper
const toggleQuickFilter = (type: FilterType, value: string, icon: string, label: string) => {
  const existing = activeFilters.value.find(f => f.type === type && f.value === value)
  if (existing) {
    removeFilter(type)
  } else {
    toggleFilter({ type, value, icon, label })
  }
}

// 输入时触发PPT内容搜索
const onInputChange = () => {
  if (searchInPPT.value && searchQuery.value.trim().length >= 2) {
    // 防抖
    clearTimeout((window as any).__searchDebounce)
    ;(window as any).__searchDebounce = setTimeout(() => {
      performSearch()
    }, 400)
  }
}

// 高亮PPT搜索匹配文本
const highlightPPTMatch = (context: string, query: string): string => {
  if (!query || !context) return context
  const escaped = context.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  return context.replace(regex, '<mark>$1</mark>')
}

// 键盘快捷键打开搜索
const handleGlobalKeydown = (e: KeyboardEvent) => {
  // Ctrl/Cmd + K 打开搜索
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    if (isSearchOpen.value) {
      closeSearch()
    } else {
      openSearch()
    }
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalKeydown)
})

// 暴露给外部使用
defineExpose({
  openSearch
})
</script>

<style scoped>
.search-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 10vh;
  z-index: 9999;
}

.search-modal {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 640px;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

:global(.dark) .search-modal {
  background: #1a1a1a;
}

/* Search Input */
.search-input-wrapper {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
  gap: 12px;
}

:global(.dark) .search-input-wrapper {
  border-color: #333;
}

.search-icon {
  width: 22px;
  height: 22px;
  color: #999;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 18px;
  color: #333;
  outline: none;
}

:global(.dark) .search-input {
  color: #fff;
}

.search-input::placeholder {
  color: #999;
}

/* R69: Voice Search Button */
.voice-btn {
  width: 36px;
  height: 36px;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

:global(.dark) .voice-btn {
  background: #2a2a2a;
  border-color: #444;
}

.voice-btn:hover {
  border-color: #165DFF;
  background: #EEF2FF;
}

:global(.dark) .voice-btn:hover {
  background: #1e1e3f;
}

.voice-btn.recording {
  border-color: #ef4444;
  background: #fef2f2;
  animation: pulse-ring 1.5s infinite;
}

:global(.dark) .voice-btn.recording {
  background: #2a1a1a;
}

.voice-btn .mic-icon {
  width: 18px;
  height: 18px;
  color: #666;
}

.voice-btn.recording .mic-icon {
  color: #ef4444;
}

@keyframes pulse-ring {
  0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
  70% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
  100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
}

.clear-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: #f0f0f0;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.clear-btn:hover {
  background: #e0e0e0;
}

.clear-btn svg {
  width: 14px;
  height: 14px;
  color: #666;
}

.esc-hint {
  padding: 4px 8px;
  background: #f5f5f5;
  border-radius: 6px;
  font-size: 12px;
  color: #888;
}

:global(.dark) .esc-hint {
  background: #333;
  color: #888;
}

/* R69: Smart Filter Bar */
.smart-filter-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
  flex-wrap: wrap;
}

:global(.dark) .smart-filter-bar {
  background: #161616;
  border-color: #333;
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #888;
  font-weight: 600;
  white-space: nowrap;
}

.filter-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: 1px solid #e0e0e0;
  background: white;
  border-radius: 16px;
  font-size: 12px;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
}

:global(.dark) .filter-chip {
  background: #2a2a2a;
  border-color: #444;
  color: #fff;
}

.filter-chip:hover {
  border-color: #165DFF;
}

.filter-chip.active {
  background: #165DFF;
  border-color: #165DFF;
  color: white;
}

.chip-close {
  margin-left: 2px;
  font-size: 14px;
  line-height: 1;
}

.filter-toggles {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.filter-toggle-btn {
  padding: 4px 10px;
  border: 1px solid #e0e0e0;
  background: white;
  border-radius: 16px;
  font-size: 12px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

:global(.dark) .filter-toggle-btn {
  background: #2a2a2a;
  border-color: #444;
  color: #aaa;
}

.filter-toggle-btn:hover {
  border-color: #165DFF;
  color: #165DFF;
}

:global(.dark) .filter-toggle-btn:hover {
  color: #165DFF;
}

.filter-toggle-btn.active {
  background: #EEF2FF;
  border-color: #165DFF;
  color: #165DFF;
}

:global(.dark) .filter-toggle-btn.active {
  background: #1e1e3f;
  color: #818cf8;
}

.clear-all-filters {
  padding: 4px 10px;
  border: none;
  background: transparent;
  font-size: 12px;
  color: #888;
  cursor: pointer;
  margin-left: auto;
}

.clear-all-filters:hover {
  color: #ef4444;
}

/* R34: Search Mode Bar */
.search-mode-bar {
  display: flex;
  padding: 8px 20px;
  gap: 8px;
  border-bottom: 1px solid #e0e0e0;
  background: #fafafa;
}

:global(.dark) .search-mode-bar {
  border-color: #333;
  background: #161616;
}

.mode-btn {
  padding: 6px 14px;
  border: 1px solid #e0e0e0;
  background: white;
  border-radius: 20px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  color: #666;
}

:global(.dark) .mode-btn {
  background: #2a2a2a;
  border-color: #444;
  color: #aaa;
}

.mode-btn:hover {
  border-color: #165DFF;
  color: #165DFF;
}

.mode-btn.active {
  background: #165DFF;
  border-color: #165DFF;
  color: white;
}

:global(.dark) .mode-btn.active {
  background: #165DFF;
  border-color: #165DFF;
}

/* Search Content */
.search-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

/* PPT Search Loading */
.ppt-search-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px;
  color: #888;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #e0e0e0;
  border-top-color: #165DFF;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.ppt-results-header {
  margin-bottom: 12px;
}

.ppt-results-count {
  font-size: 13px;
  color: #888;
}

/* PPT Search Results */
.ppt-search-results {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ppt-result-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  border: none;
  background: transparent;
  border-radius: 10px;
  cursor: pointer;
  text-align: left;
  transition: background 0.2s;
  width: 100%;
}

.ppt-result-item:hover,
.ppt-result-item.active {
  background: #f5f5f5;
}

:global(.dark) .ppt-result-item:hover,
:global(.dark) .ppt-result-item.active {
  background: #2a2a2a;
}

.ppt-result-icon {
  font-size: 20px;
  margin-top: 2px;
}

.ppt-result-content {
  flex: 1;
  min-width: 0;
}

.ppt-result-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.ppt-result-title strong {
  font-size: 14px;
  color: #333;
}

:global(.dark) .ppt-result-title strong {
  color: #fff;
}

.slide-badge {
  font-size: 11px;
  padding: 2px 8px;
  background: #EEF2FF;
  color: #4F46E5;
  border-radius: 10px;
}

.ppt-result-context {
  font-size: 13px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(mark) {
  background: #fff3cd;
  color: #856404;
  padding: 0 2px;
  border-radius: 2px;
}

/* PPT Search Hint */
.ppt-search-hint {
  text-align: center;
  padding: 40px 20px;
}

.ppt-search-hint p {
  color: #666;
  margin-bottom: 8px;
}

.hint-sub {
  font-size: 13px;
  color: #999;
}

.search-section {
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-header h3,
.search-section > h3 {
  font-size: 13px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}

.clear-history-btn {
  font-size: 12px;
  color: #666;
  background: none;
  border: none;
  cursor: pointer;
}

.clear-history-btn:hover {
  color: #165DFF;
}

.search-items {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.search-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border: none;
  background: transparent;
  border-radius: 10px;
  cursor: pointer;
  text-align: left;
  transition: background 0.2s;
  width: 100%;
}

.search-item:hover,
.search-item.active {
  background: #f5f5f5;
}

:global(.dark) .search-item:hover,
:global(.dark) .search-item.active {
  background: #2a2a2a;
}

.item-icon {
  font-size: 18px;
}

.item-text {
  font-size: 15px;
  color: #333;
}

:global(.dark) .item-text {
  color: #fff;
}

/* Quick Links */
.quick-links {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.quick-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 10px;
  text-decoration: none;
  transition: all 0.2s;
}

.quick-link:hover {
  background: #f0f0f0;
  transform: translateY(-2px);
}

:global(.dark) .quick-link {
  background: #2a2a2a;
}

:global(.dark) .quick-link:hover {
  background: #333;
}

.link-icon {
  font-size: 20px;
}

.link-text {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

:global(.dark) .link-text {
  color: #fff;
}

/* Search Results */
.search-results {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  border: none;
  background: transparent;
  border-radius: 10px;
  cursor: pointer;
  text-align: left;
  transition: background 0.2s;
  width: 100%;
}

.result-item:hover,
.result-item.active {
  background: #f5f5f5;
}

:global(.dark) .result-item:hover,
:global(.dark) .result-item.active {
  background: #2a2a2a;
}

.result-icon {
  font-size: 22px;
}

.result-content {
  flex: 1;
  min-width: 0;
}

.result-title {
  display: block;
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

:global(.dark) .result-title {
  color: #fff;
}

.result-desc {
  display: block;
  font-size: 13px;
  color: #888;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-meta {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
}

/* No Results */
.no-results {
  text-align: center;
  padding: 40px 20px;
}

.no-results svg {
  width: 48px;
  height: 48px;
  color: #ccc;
  margin-bottom: 16px;
}

.no-results p {
  color: #666;
  margin-bottom: 16px;
}

.search-btn {
  padding: 10px 24px;
  background: #165DFF;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.search-btn:hover {
  background: #0d47e6;
}

/* Search Footer */
.search-footer {
  display: flex;
  justify-content: center;
  gap: 20px;
  padding: 12px;
  border-top: 1px solid #e0e0e0;
  background: #fafafa;
}

:global(.dark) .search-footer {
  border-color: #333;
  background: #1a1a1a;
}

.hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #888;
}

.hint kbd {
  padding: 2px 6px;
  background: #eee;
  border-radius: 4px;
  font-size: 11px;
}

:global(.dark) .hint kbd {
  background: #333;
}

/* Transitions */
.search-fade-enter-active,
.search-fade-leave-active {
  transition: opacity 0.2s;
}

.search-fade-enter-from,
.search-fade-leave-to {
  opacity: 0;
}
</style>
