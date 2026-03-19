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
              placeholder="搜索模板、页面..."
              class="search-input"
              @keydown="handleKeyNavigation"
            />
            <button v-if="searchQuery" class="clear-btn" @click="searchQuery = ''">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
            <kbd class="esc-hint">ESC</kbd>
          </div>

          <!-- Search Content -->
          <div class="search-content">
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
                    v-for="(item, index) in searchHistory.slice(0, 5)"
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

const {
  searchQuery,
  isSearchOpen,
  searchInputRef,
  selectedIndex,
  searchHistory,
  searchResults,
  suggestions,
  openSearch,
  closeSearch,
  performSearch,
  selectResult,
  clearSearchHistory,
  handleKeyNavigation,
  quickLinks
} = useGlobalSearch()

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

/* Search Content */
.search-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
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
