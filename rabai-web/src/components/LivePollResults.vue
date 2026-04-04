<template>
  <div class="live-poll-results" :class="{ 'panel-mode': panelMode }">
    <!-- Panel Mode (sidebar in presenter view) -->
    <div v-if="panelMode" class="panel-container">
      <div class="panel-header">
        <span class="panel-title">📊 实时投票</span>
        <button v-if="!isMinimized" class="minimize-btn" @click="isMinimized = true">−</button>
        <button v-else class="minimize-btn" @click="isMinimized = false">+</button>
      </div>

      <div v-if="!isMinimized" class="panel-body">
        <!-- Active Poll -->
        <div v-if="activePoll" class="active-poll-section">
          <div class="poll-live-badge">
            <span class="live-dot"></span>
            <span>实时</span>
          </div>
          <div class="poll-question">{{ activePoll.question }}</div>

          <div class="live-bars">
            <div
              v-for="(option, idx) in activePoll.options"
              :key="idx"
              class="live-bar-row"
            >
              <div class="live-bar-label">{{ String.fromCharCode(65 + idx) }}. {{ option }}</div>
              <div class="live-bar-track">
                <div
                  class="live-bar-fill"
                  :class="`fill-${idx % 6}`"
                  :style="{ width: getPercentage(idx) + '%' }"
                ></div>
              </div>
              <div class="live-bar-stats">
                <span class="live-percent">{{ getPercentage(idx) }}%</span>
                <span class="live-votes">{{ optionResults?.[String(idx)] || 0 }}票</span>
              </div>
            </div>
          </div>

          <div class="total-votes-row">
            <span class="total-label">总投票</span>
            <span class="total-value">{{ activePoll.total_votes || 0 }}</span>
          </div>
        </div>

        <!-- No Active Poll -->
        <div v-else class="no-poll">
          <span>📊</span>
          <p>暂无进行中的投票</p>
          <button class="btn btn-sm btn-primary" @click="$emit('create-poll')">
            创建投票
          </button>
        </div>

        <!-- Poll History -->
        <div class="poll-history" v-if="allPolls.length > 0">
          <div class="history-label">历史投票</div>
          <div
            v-for="p in allPolls.filter(p => p.poll_id !== activePoll?.poll_id)"
            :key="p.poll_id"
            class="history-item"
            :class="{ active: selectedHistoryId === p.poll_id }"
            @click="selectHistoryPoll(p.poll_id)"
          >
            <span class="history-q">{{ p.question }}</span>
            <span class="history-v">{{ p.total_votes }}票</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Overlay Mode (floating overlay on presentation) -->
    <div v-else class="overlay-container" :class="positionClass">
      <div class="overlay-header">
        <span class="overlay-icon">📊</span>
        <span class="overlay-title">投票结果</span>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="overlay-body" v-if="activePoll">
        <div class="overlay-question">{{ activePoll.question }}</div>

        <div class="live-bars compact">
          <div
            v-for="(option, idx) in activePoll.options"
            :key="idx"
            class="live-bar-row"
          >
            <div class="live-bar-label-compact">{{ option }}</div>
            <div class="live-bar-track-compact">
              <div
                class="live-bar-fill"
                :class="`fill-${idx % 6}`"
                :style="{ width: getPercentage(idx) + '%' }"
              ></div>
            </div>
            <div class="live-percent-compact">{{ getPercentage(idx) }}%</div>
          </div>
        </div>

        <div class="overlay-total">
          <span>👥 {{ activePoll.total_votes || 0 }} 票</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import apiClient from '../api/client'

interface Poll {
  poll_id: string
  question: string
  options: string[]
  option_votes?: Record<string, number>
  total_votes?: number
  is_active?: boolean
}

interface Props {
  taskId: string
  panelMode?: boolean
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left'
}

const props = withDefaults(defineProps<Props>(), {
  panelMode: false,
  position: 'bottom-right'
})

interface Emits {
  (e: 'close'): void
  (e: 'create-poll'): void
}

const emit = defineEmits<Emits>()

const activePoll = ref<Poll | null>(null)
const allPolls = ref<Poll[]>([])
const optionResults = ref<Record<string, number>>({})
const selectedHistoryId = ref<string | null>(null)
const isMinimized = ref(false)

let pollInterval: ReturnType<typeof setInterval> | null = null

const positionClass = computed(() => `position-${props.position}`)

const getPercentage = (idx: number): string => {
  if (!activePoll.value || !optionResults.value) return '0'
  const total = activePoll.value.total_votes || 1
  const votes = optionResults.value[String(idx)] || 0
  return ((votes / total) * 100).toFixed(1)
}

const loadPolls = async () => {
  try {
    const res = await apiClient.get(`/engagement/polls/${props.taskId}`)
    if (res.data.success) {
      allPolls.value = res.data.polls || []
      const active = allPolls.value.find(p => p.is_active)
      if (active) {
        activePoll.value = active
        await loadPollResults(active.poll_id)
      }
    }
  } catch (e) {
    console.error('Failed to load polls:', e)
  }
}

const loadPollResults = async (pollId: string) => {
  try {
    const res = await apiClient.get(`/engagement/polls/${props.taskId}/${pollId}`)
    if (res.data.success) {
      if (activePoll.value?.poll_id === pollId) {
        activePoll.value = { ...activePoll.value, ...res.data }
      }
      optionResults.value = res.data.option_votes || {}
    }
  } catch (e) {
    console.error('Failed to load poll results:', e)
  }
}

const selectHistoryPoll = async (pollId: string) => {
  selectedHistoryId.value = pollId
  const poll = allPolls.value.find(p => p.poll_id === pollId)
  if (poll) {
    activePoll.value = poll
    await loadPollResults(pollId)
  }
}

const startPolling = () => {
  stopPolling()
  pollInterval = setInterval(async () => {
    if (activePoll.value?.poll_id) {
      await loadPollResults(activePoll.value.poll_id)
    }
  }, 2000)
}

const stopPolling = () => {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
}

onMounted(() => {
  loadPolls()
  startPolling()
})

onUnmounted(() => {
  stopPolling()
})
</script>

<style scoped>
.live-poll-results {
  font-family: inherit;
}

:global(.dark) .live-poll-results {
  --bg: #1e1e1e;
  --border: #333;
  --text: #eee;
  --text-dim: #aaa;
}

/* Panel Mode */
.panel-container {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  width: 320px;
}

:global(.dark) .panel-container {
  background: #1e1e1e;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #165DFF;
  color: white;
}

.panel-title {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
}

.minimize-btn {
  width: 20px;
  height: 20px;
  border: none;
  background: rgba(255,255,255,0.2);
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
}

.panel-body {
  padding: 12px;
}

.poll-live-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #165DFF;
  background: #e8f0ff;
  padding: 2px 8px;
  border-radius: 10px;
  margin-bottom: 8px;
}

:global(.dark) .poll-live-badge {
  background: #1a2a4a;
  color: #4d8eff;
}

.live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #165DFF;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(0.8); }
}

.poll-question {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  line-height: 1.4;
}

:global(.dark) .poll-question {
  color: #eee;
}

.live-bars {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.live-bars.compact {
  gap: 6px;
}

.live-bar-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.live-bar-label {
  width: 90px;
  font-size: 12px;
  color: #555;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;
}

:global(.dark) .live-bar-label {
  color: #aaa;
}

.live-bar-track {
  flex: 1;
  height: 20px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

:global(.dark) .live-bar-track {
  background: #2a2a2a;
}

.live-bar-track-compact {
  flex: 1;
  height: 16px;
  background: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
}

:global(.dark) .live-bar-track-compact {
  background: #2a2a2a;
}

.live-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.live-bar-fill.fill-0 { background: linear-gradient(90deg, #165DFF, #4d8eff); }
.live-bar-fill.fill-1 { background: linear-gradient(90deg, #00D4AA, #34efc2); }
.live-bar-fill.fill-2 { background: linear-gradient(90deg, #FF6B6B, #ff9999); }
.live-bar-fill.fill-3 { background: linear-gradient(90deg, #F59E0B, #fbbf24); }
.live-bar-fill.fill-4 { background: linear-gradient(90deg, #7C3AED, #a78bfa); }
.live-bar-fill.fill-5 { background: linear-gradient(90deg, #10B981, #34d399); }

.live-bar-stats {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 70px;
  justify-content: flex-end;
}

.live-percent {
  font-size: 13px;
  font-weight: 700;
  color: #165DFF;
}

:global(.dark) .live-percent {
  color: #4d8eff;
}

.live-votes {
  font-size: 11px;
  color: #888;
}

:global(.dark) .live-votes {
  color: #aaa;
}

.live-bar-label-compact {
  width: 60px;
  font-size: 11px;
  color: #555;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;
}

:global(.dark) .live-bar-label-compact {
  color: #aaa;
}

.live-percent-compact {
  min-width: 45px;
  font-size: 12px;
  font-weight: 700;
  color: #165DFF;
  text-align: right;
}

:global(.dark) .live-percent-compact {
  color: #4d8eff;
}

.total-votes-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
}

:global(.dark) .total-votes-row {
  border-color: #333;
}

.total-label {
  font-size: 12px;
  color: #888;
}

:global(.dark) .total-label {
  color: #aaa;
}

.total-value {
  font-size: 18px;
  font-weight: 700;
  color: #165DFF;
}

:global(.dark) .total-value {
  color: #4d8eff;
}

.no-poll {
  text-align: center;
  padding: 20px;
  color: #888;
}

:global(.dark) .no-poll {
  color: #aaa;
}

.no-poll span {
  font-size: 28px;
  display: block;
  margin-bottom: 8px;
}

.no-poll p {
  margin: 0 0 10px;
  font-size: 13px;
}

.btn {
  padding: 7px 14px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  border: none;
  font-family: inherit;
}

.btn-sm {
  padding: 5px 10px;
  font-size: 11px;
}

.btn-primary {
  background: #165DFF;
  color: white;
}

.poll-history {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
}

:global(.dark) .poll-history {
  border-color: #333;
}

.history-label {
  font-size: 11px;
  color: #888;
  margin-bottom: 6px;
}

:global(.dark) .history-label {
  color: #aaa;
}

.history-item {
  display: flex;
  justify-content: space-between;
  padding: 5px 8px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  color: #555;
  margin-bottom: 3px;
}

:global(.dark) .history-item {
  color: #aaa;
}

.history-item:hover {
  background: #f0f0f0;
}

:global(.dark) .history-item:hover {
  background: #2a2a2a;
}

.history-item.active {
  background: #e8f0ff;
  color: #165DFF;
}

:global(.dark) .history-item.active {
  background: #1a2a4a;
  color: #4d8eff;
}

.history-q {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-v {
  margin-left: 8px;
  color: #888;
  font-size: 11px;
}

/* Overlay Mode */
.overlay-container {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
  width: 380px;
}

:global(.dark) .overlay-container {
  background: #1e1e1e;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
}

.position-top-right {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 999;
}

.position-bottom-right {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 999;
}

.position-top-left {
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 999;
}

.position-bottom-left {
  position: fixed;
  bottom: 20px;
  left: 20px;
  z-index: 999;
}

.overlay-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #165DFF;
  color: white;
}

.overlay-icon {
  font-size: 16px;
}

.overlay-title {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
}

.overlay-header .close-btn {
  width: 22px;
  height: 22px;
  border: none;
  background: rgba(255,255,255,0.2);
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.overlay-body {
  padding: 14px;
}

.overlay-question {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

:global(.dark) .overlay-question {
  color: #eee;
}

.overlay-total {
  margin-top: 10px;
  text-align: center;
  font-size: 13px;
  color: #888;
}

:global(.dark) .overlay-total {
  color: #aaa;
}
</style>
