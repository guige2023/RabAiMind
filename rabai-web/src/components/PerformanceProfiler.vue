<template>
  <div class="perf-profiler-panel" :class="{ collapsed: !isExpanded }" :style="panelStyle">
    <!-- Toggle Button -->
    <button class="perf-toggle-btn" @click="toggleExpanded" :title="isExpanded ? '收起性能面板' : '展开性能面板'">
      <span class="perf-toggle-icon">📊</span>
      <span v-if="!isExpanded" class="perf-toggle-badge" :class="fpsGradeClass">{{ fpsDisplay }}</span>
    </button>

    <!-- Panel Content -->
    <div v-if="isExpanded" class="perf-panel-content">
      <!-- Header -->
      <div class="perf-header">
        <div class="perf-title">
          <span>⚡ 性能监控</span>
          <button class="perf-close-btn" @click="toggleExpanded">×</button>
        </div>
        <div class="perf-status">
          <span class="status-dot" :class="{ online: isOnline, syncing: isSyncing }"></span>
          <span class="status-text">{{ isSyncing ? '同步中...' : isOnline ? '在线' : '离线' }}</span>
        </div>
      </div>

      <!-- FPS Gauge -->
      <div class="perf-metric-row">
        <div class="perf-metric">
          <div class="metric-label">FPS</div>
          <div class="metric-value" :class="fpsGradeClass">{{ fpsDisplay }}</div>
          <div class="metric-bar">
            <div class="metric-bar-fill" :class="fpsGradeClass" :style="{ width: fpsBarWidth }"></div>
          </div>
        </div>
      </div>

      <!-- Memory -->
      <div class="perf-metric-row">
        <div class="perf-metric">
          <div class="metric-label">内存</div>
          <div class="metric-value" :class="memoryGradeClass">
            {{ metrics.memory }}MB <span class="metric-limit">/ {{ metrics.memoryLimit }}MB</span>
          </div>
          <div class="metric-bar">
            <div class="metric-bar-fill" :class="memoryGradeClass" :style="{ width: memoryBarWidth }"></div>
          </div>
        </div>
      </div>

      <!-- DOM Nodes -->
      <div class="perf-metric-row">
        <div class="perf-metric">
          <div class="metric-label">DOM节点</div>
          <div class="metric-value">{{ metrics.domNodes.toLocaleString() }}</div>
        </div>
      </div>

      <!-- Long Tasks -->
      <div class="perf-metric-row" v-if="metrics.longTasks > 0">
        <div class="perf-metric warning">
          <div class="metric-label">慢任务</div>
          <div class="metric-value warning">{{ metrics.longTasks }}</div>
        </div>
      </div>

      <!-- Network Requests -->
      <div class="perf-metric-row">
        <div class="perf-metric">
          <div class="metric-label">网络请求</div>
          <div class="metric-value">{{ metrics.networkRequests }}</div>
        </div>
      </div>

      <!-- Render Time -->
      <div class="perf-metric-row" v-if="metrics.renderTime > 0">
        <div class="perf-metric">
          <div class="metric-label">渲染耗时</div>
          <div class="metric-value">{{ metrics.renderTime.toFixed(1) }}ms</div>
        </div>
      </div>

      <!-- Actions -->
      <div class="perf-actions">
        <button class="perf-action-btn" @click="resetProfiler" title="重置数据">
          🔄 重置
        </button>
        <button class="perf-action-btn" @click="toggleProfiler" :title="isRunning ? '暂停监控' : '继续监控'">
          {{ isRunning ? '⏸️' : '▶️' }} {{ isRunning ? '暂停' : '继续' }}
        </button>
      </div>

      <!-- Timeline (collapsed) -->
      <div class="perf-timeline" v-if="timeline.length > 0">
        <div class="timeline-header" @click="toggleTimeline">
          <span>📋 最近事件 ({{ timeline.length }})</span>
          <span>{{ timelineExpanded ? '▼' : '▶' }}</span>
        </div>
        <div v-if="timelineExpanded" class="timeline-list">
          <div v-for="(entry, idx) in timeline" :key="idx" class="timeline-item" :class="entry.type">
            <span class="timeline-icon">{{ getTypeIcon(entry.type) }}</span>
            <span class="timeline-name">{{ entry.name }}</span>
            <span class="timeline-duration">{{ entry.duration.toFixed(1) }}ms</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { usePerformanceProfiler, performanceProfiler } from '../composables/usePerformanceProfiler'
import { useBackgroundSync } from '../composables/useBackgroundSync'

const {
  metrics,
  isRunning,
  isVisible,
  panelPosition,
  start,
  stop,
  toggle,
  reset,
  getTimeline
} = usePerformanceProfiler()

const { state: syncState } = useBackgroundSync()

const isExpanded = ref(false)
const timelineExpanded = ref(false)
const panelX = ref(panelPosition.value.x)
const panelY = ref(panelPosition.value.y)
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })

// Sync state
const isOnline = computed(() => syncState.value.isOnline)
const isSyncing = computed(() => syncState.value.isSyncing)

// FPS display
const fpsDisplay = computed(() => metrics.value.fps.toString())

// FPS grade
const fpsGradeClass = computed(() => {
  const fps = metrics.value.fps
  if (fps >= 50) return 'good'
  if (fps >= 30) return 'warning'
  return 'poor'
})

// FPS bar width
const fpsBarWidth = computed(() => `${Math.min(100, (metrics.value.fps / 60) * 100)}%`)

// Memory grade
const memoryGradeClass = computed(() => {
  const { memory, memoryLimit } = metrics.value
  const ratio = memory / Math.max(memoryLimit, 1)
  if (ratio < 0.6) return 'good'
  if (ratio < 0.8) return 'warning'
  return 'poor'
})

// Memory bar width
const memoryBarWidth = computed(() => {
  const { memory, memoryLimit } = metrics.value
  return `${Math.min(100, (memory / Math.max(memoryLimit, 1)) * 100)}%`
})

// Timeline
const timeline = computed(() => getTimeline().slice(-10).reverse())

// Panel style
const panelStyle = computed(() => ({
  right: `${panelX.value}px`,
  top: `${panelY.value}px`
}))

// Toggle expanded
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

// Toggle timeline
const toggleTimeline = () => {
  timelineExpanded.value = !timelineExpanded.value
}

// Get type icon
const getTypeIcon = (type: string) => {
  switch (type) {
    case 'render': return '🎨'
    case 'network': return '🌐'
    case 'task': return '⏱️'
    case 'custom': return '📌'
    default: return '•'
  }
}

// Reset profiler
const resetProfiler = () => {
  reset()
}

// Toggle profiler
const toggleProfiler = () => {
  toggle()
}

// Start profiler on mount
onMounted(() => {
  if (!isRunning.value) {
    start()
  }
})

// Expose for parent components
defineExpose({
  toggle: toggleExpanded,
  isExpanded
})
</script>

<style scoped>
.perf-profiler-panel {
  position: fixed;
  z-index: 9999;
  font-family: 'SF Mono', Monaco, 'Courier New', monospace;
  font-size: 11px;
  transition: all 0.2s ease;
}

.perf-profiler-panel.collapsed {
  min-width: auto;
}

.perf-toggle-btn {
  position: absolute;
  top: 0;
  right: 0;
  width: 36px;
  height: 36px;
  background: rgba(0, 0, 0, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 0;
  transition: all 0.2s;
  color: white;
}

.perf-toggle-btn:hover {
  background: rgba(0, 0, 0, 0.95);
  transform: scale(1.05);
}

.perf-toggle-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 4px;
  border-radius: 4px;
  min-width: 18px;
  text-align: center;
}

.perf-toggle-badge.good { background: #34C759; color: white; }
.perf-toggle-badge.warning { background: #FF9500; color: white; }
.perf-toggle-badge.poor { background: #FF3B30; color: white; }

.perf-panel-content {
  position: absolute;
  top: 44px;
  right: 0;
  width: 240px;
  background: rgba(0, 0, 0, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 12px;
  color: white;
  backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.perf-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.perf-title {
  font-weight: 600;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.perf-close-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  font-size: 16px;
  padding: 0;
  line-height: 1;
}

.perf-close-btn:hover {
  color: white;
}

.perf-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.6);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #FF3B30;
}

.status-dot.online {
  background: #34C759;
}

.status-dot.syncing {
  background: #FF9500;
  animation: pulse 1s infinite;
}

.perf-metric-row {
  margin-bottom: 10px;
}

.perf-metric {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-label {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgba(255, 255, 255, 0.5);
}

.metric-value {
  font-size: 14px;
  font-weight: 600;
  color: white;
}

.metric-value.good { color: #34C759; }
.metric-value.warning { color: #FF9500; }
.metric-value.poor { color: #FF3B30; }

.metric-limit {
  font-size: 10px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.4);
}

.metric-bar {
  height: 3px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 2px;
}

.metric-bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.metric-bar-fill.good { background: #34C759; }
.metric-bar-fill.warning { background: #FF9500; }
.metric-bar-fill.poor { background: #FF3B30; }

.perf-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.perf-action-btn {
  flex: 1;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  color: white;
  font-size: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.perf-action-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.perf-timeline {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.6);
  padding: 4px 0;
}

.timeline-header:hover {
  color: white;
}

.timeline-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 6px;
  max-height: 120px;
  overflow-y: auto;
}

.timeline-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 9px;
  padding: 3px 6px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.timeline-icon {
  font-size: 10px;
}

.timeline-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: rgba(255, 255, 255, 0.8);
}

.timeline-duration {
  color: rgba(255, 255, 255, 0.4);
  font-variant-numeric: tabular-nums;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
