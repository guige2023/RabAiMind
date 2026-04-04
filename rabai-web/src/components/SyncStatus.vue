<template>
  <div class="sync-status">
    <!-- Sync Header -->
    <div class="sync-header">
      <div class="sync-title">
        <span class="sync-icon">{{ isOnline ? '☁️' : '📴' }}</span>
        <span>离线同步</span>
      </div>
      <div class="sync-badge" :class="statusClass">
        {{ statusText }}
      </div>
    </div>

    <!-- Sync Status -->
    <div class="sync-info">
      <div class="sync-stat">
        <span class="sync-stat-value">{{ pendingCount }}</span>
        <span class="sync-stat-label">待同步</span>
      </div>
      <div class="sync-stat">
        <span class="sync-stat-value">{{ failedCount }}</span>
        <span class="sync-stat-label">失败</span>
      </div>
      <div class="sync-stat">
        <span class="sync-stat-value">{{ lastSyncTimeDisplay }}</span>
        <span class="sync-stat-label">上次同步</span>
      </div>
    </div>

    <!-- Sync Progress -->
    <div v-if="isSyncing" class="sync-progress">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: syncProgress + '%' }"></div>
      </div>
      <div class="progress-text">{{ syncProgress }}%</div>
    </div>

    <!-- Sync Actions -->
    <div class="sync-actions">
      <button
        class="sync-btn"
        @click="handleSync"
        :disabled="!isOnline || isSyncing || pendingCount === 0"
      >
        {{ isSyncing ? '同步中...' : '🔄 立即同步' }}
      </button>
      <button
        v-if="failedCount > 0"
        class="sync-btn secondary"
        @click="handleRetryFailed"
        :disabled="!isOnline || isSyncing"
      >
        🔁 重试失败
      </button>
    </div>

    <!-- Pending List -->
    <div v-if="pendingChanges.length > 0" class="sync-queue">
      <div class="queue-header" @click="toggleQueue">
        <span>📋 待同步队列 ({{ pendingChanges.length }})</span>
        <span>{{ queueExpanded ? '▼' : '▶' }}</span>
      </div>
      <div v-if="queueExpanded" class="queue-list">
        <div
          v-for="change in pendingChanges"
          :key="change.id"
          class="queue-item"
          :class="{ failed: change.retries >= 5 }"
        >
          <div class="queue-item-icon">{{ getTypeIcon(change.type) }}</div>
          <div class="queue-item-info">
            <div class="queue-item-name">{{ change.entity }} / {{ change.entityId }}</div>
            <div class="queue-item-meta">
              <span class="queue-item-type">{{ change.type }}</span>
              <span v-if="change.retries > 0" class="queue-item-retries">
                重试 {{ change.retries }} 次
              </span>
              <span v-if="change.lastError" class="queue-item-error" :title="change.lastError">
                ⚠️ {{ change.lastError }}
              </span>
            </div>
          </div>
          <button
            class="queue-item-delete"
            @click="handleRemove(change.id)"
            title="移除"
          >
            ×
          </button>
        </div>
      </div>
    </div>

    <!-- Clear Queue -->
    <div v-if="pendingChanges.length > 0" class="sync-clear">
      <button class="clear-btn" @click="handleClearQueue">
        🗑️ 清空队列
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useBackgroundSync } from '../composables/useBackgroundSync'

const {
  state,
  isOnline,
  isSyncing,
  pendingCount,
  failedCount,
  syncProgress,
  sync,
  clearQueue,
  clearFailed,
  removeChange,
  retryChange,
  getPendingChanges,
  getFailedChanges
} = useBackgroundSync()

const queueExpanded = ref(false)

const lastSyncTimeDisplay = computed(() => {
  const time = state.value.lastSyncTime
  if (!time) return '从未'
  const diff = Date.now() - time
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return new Date(time).toLocaleDateString()
})

const statusClass = computed(() => {
  if (!isOnline.value) return 'offline'
  if (isSyncing.value) return 'syncing'
  if (failedCount.value > 0) return 'warning'
  if (pendingCount.value > 0) return 'pending'
  return 'synced'
})

const statusText = computed(() => {
  if (!isOnline.value) return '离线'
  if (isSyncing.value) return '同步中'
  if (failedCount.value > 0) return '有失败'
  if (pendingCount.value > 0) return '待同步'
  return '已同步'
})

const pendingChanges = computed(() => getPendingChanges())

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'create': return '➕'
    case 'update': return '✏️'
    case 'delete': return '🗑️'
    default: return '📝'
  }
}

const toggleQueue = () => {
  queueExpanded.value = !queueExpanded.value
}

const handleSync = async () => {
  await sync()
}

const handleRetryFailed = () => {
  const failed = getFailedChanges()
  failed.forEach(change => retryChange(change.id))
}

const handleRemove = (id: string) => {
  removeChange(id)
}

const handleClearQueue = () => {
  if (confirm('确定要清空同步队列吗？')) {
    clearQueue()
  }
}
</script>

<style scoped>
.sync-status {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sync-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sync-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 15px;
}

.sync-icon {
  font-size: 18px;
}

.sync-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.sync-badge.synced {
  background: rgba(52, 199, 89, 0.1);
  color: #34C759;
}

.sync-badge.pending {
  background: rgba(255, 149, 0, 0.1);
  color: #FF9500;
}

.sync-badge.warning {
  background: rgba(255, 59, 48, 0.1);
  color: #FF3B30;
}

.sync-badge.offline {
  background: rgba(142, 142, 147, 0.1);
  color: #8E8E93;
}

.sync-badge.syncing {
  background: rgba(22, 93, 255, 0.1);
  color: #165DFF;
  animation: pulse 1s infinite;
}

.sync-info {
  display: flex;
  gap: 16px;
}

.sync-stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  background: var(--gray-100);
  border-radius: 8px;
}

:root.dark .sync-stat {
  background: var(--gray-800);
}

.sync-stat-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--primary);
}

.sync-stat-label {
  font-size: 11px;
  color: var(--gray-500);
  margin-top: 4px;
}

.sync-progress {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: var(--gray-200);
  border-radius: 3px;
  overflow: hidden;
}

:root.dark .progress-bar {
  background: var(--gray-700);
}

.progress-fill {
  height: 100%;
  background: var(--primary);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  color: var(--gray-600);
  font-variant-numeric: tabular-nums;
  min-width: 36px;
  text-align: right;
}

.sync-actions {
  display: flex;
  gap: 8px;
}

.sync-btn {
  flex: 1;
  padding: 10px 16px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.sync-btn:hover:not(:disabled) {
  background: var(--primary-dark);
}

.sync-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sync-btn.secondary {
  background: var(--gray-100);
  color: var(--gray-700);
}

:root.dark .sync-btn.secondary {
  background: var(--gray-800);
  color: var(--gray-300);
}

.sync-btn.secondary:hover:not(:disabled) {
  background: var(--gray-200);
}

:root.dark .sync-btn.secondary:hover:not(:disabled) {
  background: var(--gray-700);
}

.sync-queue {
  border-top: 1px solid var(--gray-200);
  padding-top: 12px;
}

:root.dark .sync-queue {
  border-color: var(--gray-700);
}

.queue-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  font-size: 12px;
  color: var(--gray-600);
  padding: 4px 0;
}

.queue-header:hover {
  color: var(--gray-900);
}

:root.dark .queue-header:hover {
  color: var(--gray-100);
}

.queue-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.queue-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: var(--gray-100);
  border-radius: 6px;
  font-size: 11px;
}

:root.dark .queue-item {
  background: var(--gray-800);
}

.queue-item.failed {
  background: rgba(255, 59, 48, 0.05);
  border: 1px solid rgba(255, 59, 48, 0.2);
}

.queue-item-icon {
  font-size: 14px;
  width: 20px;
  text-align: center;
}

.queue-item-info {
  flex: 1;
  min-width: 0;
}

.queue-item-name {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.queue-item-meta {
  display: flex;
  gap: 6px;
  margin-top: 2px;
  font-size: 9px;
  color: var(--gray-500);
}

.queue-item-type {
  background: var(--gray-200);
  padding: 1px 4px;
  border-radius: 3px;
}

:root.dark .queue-item-type {
  background: var(--gray-700);
}

.queue-item-retries {
  color: #FF9500;
}

.queue-item-error {
  color: #FF3B30;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px;
  white-space: nowrap;
}

.queue-item-delete {
  width: 20px;
  height: 20px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--gray-500);
  font-size: 14px;
  line-height: 1;
  border-radius: 4px;
  flex-shrink: 0;
}

.queue-item-delete:hover {
  background: rgba(220, 38, 38, 0.1);
  color: #FF3B30;
}

.sync-clear {
  display: flex;
  justify-content: center;
  padding-top: 8px;
}

.clear-btn {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid var(--gray-300);
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  color: var(--gray-600);
  transition: all 0.2s;
}

.clear-btn:hover {
  background: rgba(255, 59, 48, 0.05);
  border-color: rgba(255, 59, 48, 0.3);
  color: #FF3B30;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
</style>
