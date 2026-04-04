<template>
  <div class="activity-feed-panel">
    <!-- 头部 -->
    <div class="panel-header">
      <div class="header-title">
        <span class="title-icon">📋</span>
        <span>团队动态</span>
        <span v-if="unreadCount > 0" class="unread-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
      </div>
      <div class="header-actions">
        <button v-if="unreadCount > 0" class="action-btn" @click="handleMarkAllRead" title="全部已读">
          ✓
        </button>
        <button class="action-btn" @click="showFilter = !showFilter" :class="{ active: showFilter }" title="筛选">
          🔍
        </button>
      </div>
    </div>

    <!-- 筛选区域 -->
    <div v-if="showFilter" class="filter-section">
      <div class="filter-row">
        <select v-model="filterType" class="filter-select">
          <option value="all">全部类型</option>
          <option v-for="t in activityTypes" :key="t.type" :value="t.type">
            {{ t.icon }} {{ t.text }}
          </option>
        </select>
        <select v-model="filterUserId" class="filter-select">
          <option value="all">全部成员</option>
          <option v-for="m in participantMembers" :key="m.id" :value="m.id">
            {{ m.name }}
          </option>
        </select>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="filteredActivities.length === 0" class="empty-state">
      <span class="empty-icon">📭</span>
      <p class="empty-text">暂无动态</p>
      <p class="empty-hint">团队成员的操作会显示在这里</p>
    </div>

    <!-- 分组动态列表 -->
    <div v-else class="activity-list">
      <div v-for="group in groupedActivities" :key="group.date" class="activity-group">
        <div class="group-date">{{ group.date }}</div>
        <div
          v-for="activity in group.activities"
          :key="activity.id"
          class="activity-item"
          :class="{ unread: !activity.read }"
          @click="handleClick(activity)"
        >
          <div class="activity-avatar" :style="{ background: getAvatarColor(activity.userName) }">
            {{ activity.userName.charAt(0) }}
          </div>
          <div class="activity-content">
            <div class="activity-main">
              <span class="activity-icon">{{ getActivityDisplay(activity).icon }}</span>
              <span class="activity-text">{{ activity.userName }} {{ getActivityDisplay(activity).text }}</span>
            </div>
            <div v-if="activity.target" class="activity-target">{{ activity.target }}</div>
            <div class="activity-meta">
              <span v-if="activity.slideNum" class="activity-slide">第{{ activity.slideNum }}页</span>
              <span class="activity-time">{{ getTimeDescription(activity.timestamp) }}</span>
            </div>
          </div>
          <button
            v-if="!activity.read"
            class="mark-read-btn"
            @click.stop="handleMarkRead(activity.id)"
            title="标记已读"
          >
            ●
          </button>
        </div>
      </div>
    </div>

    <!-- 底部操作 -->
    <div class="panel-footer">
      <button class="simulate-btn" @click="handleSimulate" title="模拟团队活动（演示用）">
        🎭 模拟活动
      </button>
      <button class="clear-btn" @click="handleClear">清空</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useActivityFeed } from '../composables/useActivityFeed'

const props = defineProps<{
  pptId?: string
  taskId?: string
}>()

const {
  filteredActivities,
  groupedActivities,
  unreadCount,
  activityTypes,
  participantMembers,
  filterType,
  filterUserId,
  addActivity,
  markAsRead,
  markAllAsRead,
  clearAll,
  getActivityDisplay,
  getTimeDescription,
  simulateTeamActivity,
  loadActivities
} = useActivityFeed(props.pptId, props.taskId)

const showFilter = ref(false)

const getAvatarColor = (name: string): string => {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD']
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

const handleClick = (activity: any) => {
  markAsRead(activity.id)
}

const handleMarkRead = (activityId: string) => {
  markAsRead(activityId)
}

const handleMarkAllRead = () => {
  markAllAsRead()
}

const handleClear = () => {
  if (confirm('确定要清空所有动态吗？')) {
    clearAll()
  }
}

const handleSimulate = () => {
  simulateTeamActivity()
}
</script>

<style scoped>
.activity-feed-panel {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  max-width: 380px;
  max-height: 500px;
  display: flex;
  flex-direction: column;
}

:global(.dark) .activity-feed-panel {
  background: #1a1a1a;
}

/* Header */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

:global(.dark) .panel-header {
  border-color: #333;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

:global(.dark) .header-title {
  color: #fff;
}

.title-icon {
  font-size: 16px;
}

.unread-badge {
  background: #FF3B30;
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}

.header-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
}

.action-btn:hover {
  background: #f0f0f0;
}

.action-btn.active {
  background: #e8f0fe;
}

/* Filter */
.filter-section {
  padding: 12px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #f0f0f0;
}

:global(.dark) .filter-section {
  background: #2a2a2a;
  border-color: #333;
}

.filter-row {
  display: flex;
  gap: 8px;
}

.filter-select {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 13px;
  background: white;
  color: #333;
}

:global(.dark) .filter-select {
  background: #1a1a1a;
  border-color: #444;
  color: #fff;
}

/* Empty */
.empty-state {
  padding: 40px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 40px;
  display: block;
  margin-bottom: 12px;
}

.empty-text {
  font-size: 14px;
  color: #666;
  margin: 0 0 4px;
}

:global(.dark) .empty-text {
  color: #aaa;
}

.empty-hint {
  font-size: 12px;
  color: #999;
  margin: 0;
}

:global(.dark) .empty-hint {
  color: #666;
}

/* Activity List */
.activity-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.activity-group {
  margin-bottom: 8px;
}

.group-date {
  padding: 8px 16px 4px;
  font-size: 12px;
  color: #888;
  font-weight: 500;
}

:global(.dark) .group-date {
  color: #666;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 16px;
  cursor: pointer;
  transition: background 0.15s;
  position: relative;
}

.activity-item:hover {
  background: #f8f9fa;
}

:global(.dark) .activity-item:hover {
  background: #2a2a2a;
}

.activity-item.unread {
  background: #f0f7ff;
}

:global(.dark) .activity-item.unread {
  background: #1a2a3a;
}

.activity-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 13px;
  flex-shrink: 0;
}

.activity-content {
  flex: 1;
  min-width: 0;
}

.activity-main {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #333;
  line-height: 1.4;
}

:global(.dark) .activity-main {
  color: #eee;
}

.activity-icon {
  font-size: 14px;
}

.activity-text {
  color: #666;
}

:global(.dark) .activity-text {
  color: #aaa;
}

.activity-target {
  font-size: 12px;
  color: #165DFF;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.activity-meta {
  display: flex;
  gap: 8px;
  margin-top: 4px;
  font-size: 11px;
  color: #999;
}

:global(.dark) .activity-meta {
  color: #666;
}

.activity-slide {
  background: #f0f0f0;
  padding: 1px 6px;
  border-radius: 4px;
}

:global(.dark) .activity-slide {
  background: #333;
}

.activity-time {
  color: #aaa;
}

.mark-read-btn {
  width: 20px;
  height: 20px;
  border: none;
  background: #165DFF;
  color: white;
  border-radius: 50%;
  font-size: 8px;
  cursor: pointer;
  flex-shrink: 0;
  opacity: 0.7;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mark-read-btn:hover {
  opacity: 1;
}

/* Footer */
.panel-footer {
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 8px;
}

:global(.dark) .panel-footer {
  border-color: #333;
}

.simulate-btn,
.clear-btn {
  flex: 1;
  padding: 8px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
}

.simulate-btn {
  background: #f0f7ff;
  color: #165DFF;
}

.simulate-btn:hover {
  background: #e0eeff;
}

.clear-btn {
  background: #f5f5f5;
  color: #666;
}

:global(.dark) .clear-btn {
  background: #2a2a2a;
  color: #aaa;
}

.clear-btn:hover {
  background: #fee;
  color: #FF3B30;
}
</style>
