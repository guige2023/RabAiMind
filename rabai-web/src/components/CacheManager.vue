<template>
  <div class="cache-manager">
    <div class="cache-header">
      <div class="cache-title">
        <span class="cache-icon">💾</span>
        <span>缓存管理</span>
      </div>
      <div class="cache-stats">
        <span class="stat-badge">
          <span class="stat-value">{{ cacheStats.totalItems }}</span>
          <span class="stat-label">项</span>
        </span>
        <span class="stat-badge">
          <span class="stat-value">{{ formatSize(cacheStats.totalSize) }}</span>
          <span class="stat-label">大小</span>
        </span>
      </div>
    </div>

    <!-- Cache Controls -->
    <div class="cache-controls">
      <button class="cache-btn" @click="refreshCache" :disabled="refreshing">
        🔄 {{ refreshing ? '刷新中...' : '刷新' }}
      </button>
      <button class="cache-btn" @click="clearMemoryCache" :disabled="clearing">
        🗑️ {{ clearing ? '清理中...' : '清理内存' }}
      </button>
      <button class="cache-btn danger" @click="clearAllCache">
        ⚠️ 清除全部
      </button>
    </div>

    <!-- Cache List -->
    <div class="cache-list">
      <div v-if="cacheItems.length === 0" class="cache-empty">
        <span class="empty-icon">📭</span>
        <span>暂无缓存数据</span>
      </div>

      <div
        v-for="item in cacheItems"
        :key="item.key"
        class="cache-item"
        :class="{ expired: item.isExpired }"
      >
        <div class="cache-item-main">
          <div class="cache-item-icon">{{ getEntityIcon(item.type) }}</div>
          <div class="cache-item-info">
            <div class="cache-item-key">{{ item.key }}</div>
            <div class="cache-item-meta">
              <span class="cache-item-type">{{ item.type }}</span>
              <span class="cache-item-size">{{ formatSize(item.size) }}</span>
              <span v-if="item.isExpired" class="cache-item-expired">已过期</span>
            </div>
          </div>
          <button class="cache-item-delete" @click="deleteItem(item.key)" title="删除">
            ×
          </button>
        </div>
      </div>
    </div>

    <!-- Cache Summary by Type -->
    <div class="cache-summary" v-if="cacheItems.length > 0">
      <div class="summary-title">按类型统计</div>
      <div class="summary-bars">
        <div v-for="(count, type) in cacheByType" :key="type" class="summary-bar-row">
          <span class="summary-bar-label">
            <span class="summary-bar-icon">{{ getEntityIcon(type) }}</span>
            {{ type }}
          </span>
          <div class="summary-bar-track">
            <div
              class="summary-bar-fill"
              :style="{ width: getBarWidth(count) }"
            ></div>
          </div>
          <span class="summary-bar-count">{{ count }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { apiCache, storageCache, indexedDBCache } from '../utils/cache'

interface CacheItem {
  key: string
  type: string
  size: number
  isExpired: boolean
  expiryTime?: number
}

const cacheItems = ref<CacheItem[]>([])
const refreshing = ref(false)
const clearing = ref(false)

// Cache statistics
const cacheStats = computed(() => {
  const items = cacheItems.value
  return {
    totalItems: items.length,
    totalSize: items.reduce((sum, item) => sum + item.size, 0),
    expiredCount: items.filter(i => i.isExpired).length
  }
})

// Cache items grouped by type
const cacheByType = computed(() => {
  const grouped: Record<string, number> = {}
  cacheItems.value.forEach(item => {
    const type = item.type || 'unknown'
    grouped[type] = (grouped[type] || 0) + 1
  })
  return grouped
})

// Format bytes to human readable
const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

// Get entity icon
const getEntityIcon = (type: string): string => {
  const icons: Record<string, string> = {
    task: '📋',
    image: '🖼️',
    user: '👤',
    history: '📜',
    statistics: '📊',
    api: '🔗',
    search: '🔍',
    template: '📄',
    unknown: '📦'
  }
  return icons[type] || icons.unknown
}

// Get bar width percentage
const getBarWidth = (count: number): string => {
  const max = Math.max(...Object.values(cacheByType.value), 1)
  return `${(count / max) * 100}%`
}

// Refresh cache list
const refreshCache = async () => {
  refreshing.value = true
  try {
    const items: CacheItem[] = []

    // Scan localStorage for cached items
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.startsWith('cache_') || key.startsWith('ppt_'))) {
        try {
          const value = localStorage.getItem(key)
          if (value) {
            const parsed = JSON.parse(value)
            const expiry = parsed.expiry ? new Date(parsed.expiry).getTime() : null
            items.push({
              key,
              type: guessType(key),
              size: value.length,
              isExpired: expiry ? Date.now() > expiry : false,
              expiryTime: expiry || undefined
            })
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }

    cacheItems.value = items.sort((a, b) => b.size - a.size)
  } finally {
    refreshing.value = false
  }
}

// Guess type from key
const guessType = (key: string): string => {
  if (key.includes('image') || key.includes('img')) return 'image'
  if (key.includes('task')) return 'task'
  if (key.includes('user')) return 'user'
  if (key.includes('history')) return 'history'
  if (key.includes('stat')) return 'statistics'
  if (key.includes('search')) return 'search'
  if (key.includes('template')) return 'template'
  if (key.includes('api')) return 'api'
  return 'unknown'
}

// Clear memory cache (apiCache)
const clearMemoryCache = () => {
  clearing.value = true
  try {
    apiCache.clear()
    // Also clear browser cache
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          if (name.includes('rabai')) {
            caches.delete(name)
          }
        })
      })
    }
    refreshCache()
  } finally {
    clearing.value = false
  }
}

// Clear all cache
const clearAllCache = () => {
  if (!confirm('确定要清除所有缓存吗？这将删除所有本地存储的临时数据。')) {
    return
  }

  clearing.value = true
  try {
    // Clear localStorage cache items
    storageCache.clear()

    // Clear memory cache
    apiCache.clear()

    // Clear IndexedDB
    indexedDBCache.clear().catch(console.error)

    // Clear browser caches if available
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          if (name.includes('rabai')) {
            caches.delete(name)
          }
        })
      })
    }

    cacheItems.value = []
  } finally {
    clearing.value = false
  }
}

// Delete single item
const deleteItem = (key: string) => {
  localStorage.removeItem(key)
  cacheItems.value = cacheItems.value.filter(item => item.key !== key)
}

// Initial load
onMounted(() => {
  refreshCache()
})
</script>

<style scoped>
.cache-manager {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cache-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cache-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 15px;
}

.cache-icon {
  font-size: 18px;
}

.cache-stats {
  display: flex;
  gap: 12px;
}

.stat-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 12px;
  background: var(--gray-100);
  border-radius: 8px;
}

:root.dark .stat-badge {
  background: var(--gray-800);
}

.stat-value {
  font-size: 16px;
  font-weight: 700;
  color: var(--primary);
}

.stat-label {
  font-size: 10px;
  color: var(--gray-500);
}

.cache-controls {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.cache-btn {
  padding: 8px 12px;
  background: var(--gray-100);
  border: 1px solid var(--gray-200);
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

:root.dark .cache-btn {
  background: var(--gray-800);
  border-color: var(--gray-700);
  color: var(--gray-100);
}

.cache-btn:hover:not(:disabled) {
  background: var(--gray-200);
}

:root.dark .cache-btn:hover:not(:disabled) {
  background: var(--gray-700);
}

.cache-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cache-btn.danger {
  background: #fff5f5;
  border-color: #fca5a5;
  color: #dc2626;
}

:root.dark .cache-btn.danger {
  background: rgba(220, 38, 38, 0.1);
  border-color: rgba(220, 38, 38, 0.3);
  color: #f87171;
}

.cache-btn.danger:hover:not(:disabled) {
  background: #fee2e2;
}

:root.dark .cache-btn.danger:hover:not(:disabled) {
  background: rgba(220, 38, 38, 0.2);
}

.cache-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.cache-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px;
  color: var(--gray-500);
}

.empty-icon {
  font-size: 32px;
  opacity: 0.5;
}

.cache-item {
  padding: 10px 12px;
  background: var(--gray-100);
  border-radius: 8px;
  transition: all 0.2s;
}

:root.dark .cache-item {
  background: var(--gray-800);
}

.cache-item:hover {
  background: var(--gray-200);
}

:root.dark .cache-item:hover {
  background: var(--gray-700);
}

.cache-item.expired {
  opacity: 0.6;
}

.cache-item-main {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cache-item-icon {
  font-size: 18px;
  width: 24px;
  text-align: center;
}

.cache-item-info {
  flex: 1;
  min-width: 0;
}

.cache-item-key {
  font-size: 12px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: 'SF Mono', Monaco, monospace;
}

.cache-item-meta {
  display: flex;
  gap: 8px;
  margin-top: 4px;
  font-size: 10px;
  color: var(--gray-500);
}

.cache-item-type {
  background: var(--gray-200);
  padding: 1px 6px;
  border-radius: 4px;
}

:root.dark .cache-item-type {
  background: var(--gray-700);
}

.cache-item-expired {
  color: #dc2626;
  font-weight: 500;
}

.cache-item-delete {
  width: 24px;
  height: 24px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--gray-500);
  font-size: 18px;
  line-height: 1;
  border-radius: 4px;
  transition: all 0.2s;
}

.cache-item-delete:hover {
  background: rgba(220, 38, 38, 0.1);
  color: #dc2626;
}

.cache-summary {
  padding-top: 12px;
  border-top: 1px solid var(--gray-200);
}

:root.dark .cache-summary {
  border-color: var(--gray-700);
}

.summary-title {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 10px;
  color: var(--gray-700);
}

:root.dark .summary-title {
  color: var(--gray-300);
}

.summary-bars {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-bar-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 11px;
}

.summary-bar-label {
  width: 80px;
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--gray-600);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:root.dark .summary-bar-label {
  color: var(--gray-400);
}

.summary-bar-icon {
  font-size: 12px;
}

.summary-bar-track {
  flex: 1;
  height: 6px;
  background: var(--gray-200);
  border-radius: 3px;
  overflow: hidden;
}

:root.dark .summary-bar-track {
  background: var(--gray-700);
}

.summary-bar-fill {
  height: 100%;
  background: var(--primary);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.summary-bar-count {
  width: 24px;
  text-align: right;
  color: var(--gray-500);
  font-variant-numeric: tabular-nums;
}
</style>
