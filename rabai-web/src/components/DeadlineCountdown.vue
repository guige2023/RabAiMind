<template>
  <div class="deadline-item" :class="urgencyClass">
    <div class="ddl-icon">{{ urgencyIcon }}</div>
    <div class="ddl-info">
      <div class="ddl-title">{{ deadline.title }}</div>
      <div class="ddl-countdown" :class="`cd-${urgencyLevel}`">
        <span class="cd-number">{{ countdownDisplay.number }}</span>
        <span class="cd-unit">{{ countdownDisplay.unit }}</span>
      </div>
      <div class="ddl-deadline-time">截止: {{ formatDeadline(deadline.deadline) }}</div>
    </div>
    <div class="ddl-actions">
      <button class="btn-sm btn-link" @click="$emit('view')">查看</button>
      <button class="btn-sm btn-danger" @click="$emit('delete')">删除</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import type { Deadline } from '../composables/useNotifications'

const props = defineProps<{
  deadline: Deadline
}>()

defineEmits<{
  delete: []
  view: []
}>()

// Live countdown update
const now = ref(Date.now())
let timer: ReturnType<typeof setInterval>

onMounted(() => {
  timer = setInterval(() => { now.value = Date.now() }, 60000)
})
onUnmounted(() => clearInterval(timer))

const hoursRemaining = computed(() => {
  const dl = new Date(props.deadline.deadline).getTime()
  return (dl - now.value) / 3600000
})

const urgencyLevel = computed(() => {
  const h = hoursRemaining.value
  if (h < 0) return 'expired'
  if (h < 1) return 'critical'
  if (h < 24) return 'high'
  if (h < 72) return 'medium'
  return 'low'
})

const urgencyIcon = computed(() => {
  const map: Record<string, string> = {
    expired: '🔴', critical: '🔴', high: '🟠', medium: '🟡', low: '🟢'
  }
  return map[urgencyLevel.value]
})

const urgencyClass = computed(() => `urgency-${urgencyLevel.value}`)

const countdownDisplay = computed(() => {
  const h = hoursRemaining.value
  if (h < 0) return { number: '已', unit: '过期' }
  if (h < 1) {
    const m = Math.round(h * 60)
    return { number: m, unit: '分钟' }
  }
  if (h < 24) return { number: Math.round(h), unit: '小时' }
  const d = Math.round(h / 24)
  return { number: d, unit: '天' }
})

const formatDeadline = (iso: string) => {
  return new Date(iso).toLocaleString('zh-CN', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}
</script>

<style scoped>
.deadline-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 10px;
  background: rgba(0,0,0,0.03);
  align-items: center;
}

.urgency-critical { background: rgba(239,68,68,0.08); border-left: 3px solid #EF4444; }
.urgency-high { background: rgba(245,158,11,0.08); border-left: 3px solid #F59E0B; }
.urgency-medium { background: rgba(234,179,8,0.06); border-left: 3px solid #EAB308; }
.urgency-low { background: rgba(16,185,129,0.06); border-left: 3px solid #10B981; }
.urgency-expired { opacity: 0.6; }

.ddl-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.ddl-info {
  flex: 1;
  min-width: 0;
}

.ddl-title {
  font-size: 13px;
  font-weight: 600;
}

.ddl-countdown {
  display: inline-flex;
  align-items: baseline;
  gap: 2px;
  margin-top: 4px;
}

.cd-number {
  font-size: 22px;
  font-weight: 700;
  line-height: 1;
}

.cd-unit {
  font-size: 12px;
  color: #666;
}

.cd-critical .cd-number { color: #EF4444; }
.cd-high .cd-number { color: #F59E0B; }
.cd-medium .cd-number { color: #EAB308; }
.cd-low .cd-number { color: #10B981; }

.ddl-deadline-time {
  font-size: 11px;
  color: #999;
  margin-top: 2px;
}

.ddl-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
}

.btn-sm {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  border: none;
}

.btn-link {
  background: none;
  color: #165DFF;
}

.btn-danger {
  background: rgba(239,68,68,0.1);
  color: #EF4444;
}
</style>
