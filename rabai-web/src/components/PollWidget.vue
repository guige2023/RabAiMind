<template>
  <div class="poll-widget" :class="{ 'results-mode': showResults }">
    <!-- Poll Creation Mode (for presenters) -->
    <div v-if="mode === 'create'" class="poll-create">
      <div class="poll-header">
        <span class="poll-icon">📊</span>
        <h4 class="poll-title">创建投票</h4>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="poll-body">
        <div class="form-group">
          <label>投票问题</label>
          <input
            v-model="newQuestion"
            type="text"
            class="form-input"
            placeholder="例如：你更喜欢哪种方案？"
            maxlength="200"
          />
        </div>

        <div class="form-group">
          <label>选项（2-6个）</label>
          <div class="options-list">
            <div
              v-for="(opt, idx) in newOptions"
              :key="idx"
              class="option-row"
            >
              <span class="option-letter">{{ String.fromCharCode(65 + idx) }}</span>
              <input
                v-model="newOptions[idx]"
                type="text"
                class="form-input"
                :placeholder="`选项 ${idx + 1}`"
                maxlength="100"
              />
              <button
                v-if="newOptions.length > 2"
                class="remove-btn"
                @click="removeOption(idx)"
              >✕</button>
            </div>
          </div>
          <button
            v-if="newOptions.length < 6"
            class="add-option-btn"
            @click="addOption"
          >
            + 添加选项
          </button>
        </div>

        <div class="form-group">
          <label class="toggle-row">
            <input type="checkbox" v-model="autoShowResults" />
            <span>投票后自动显示结果</span>
          </label>
        </div>
      </div>

      <div class="poll-footer">
        <button class="btn btn-outline" @click="$emit('close')">取消</button>
        <button
          class="btn btn-primary"
          :disabled="!canCreatePoll"
          @click="handleCreatePoll"
        >
          📊 创建投票
        </button>
      </div>
    </div>

    <!-- Poll Voting Mode (for audience) -->
    <div v-else-if="mode === 'vote' && activePoll" class="poll-vote">
      <div class="poll-header">
        <span class="poll-icon">🗳️</span>
        <h4 class="poll-title">{{ activePoll.question }}</h4>
        <span class="vote-count" v-if="activePoll.total_votes > 0">
          {{ activePoll.total_votes }} 票
        </span>
      </div>

      <div class="poll-options">
        <button
          v-for="(option, idx) in activePoll.options"
          :key="idx"
          class="poll-option-btn"
          :class="{
            selected: userVotedOption === idx,
            disabled: hasVoted && userVotedOption !== idx
          }"
          @click="handleVote(idx)"
          :disabled="hasVoted && userVotedOption !== idx"
        >
          <span class="option-letter">{{ String.fromCharCode(65 + idx) }}</span>
          <span class="option-text">{{ option }}</span>
          <span v-if="showResults && optionResults" class="option-percent">
            {{ getPercentage(idx) }}%
          </span>
        </button>
      </div>

      <!-- Results Bar -->
      <div v-if="showResults && optionResults" class="results-bar">
        <div
          v-for="(option, idx) in activePoll.options"
          :key="idx"
          class="result-row"
        >
          <div
            class="result-fill"
            :style="{ width: getPercentage(idx) + '%' }"
            :class="`fill-${idx}`"
          ></div>
          <span class="result-label">{{ option }}</span>
          <span class="result-value">{{ optionResults[idx] || 0 }}票</span>
        </div>
      </div>

      <div class="poll-footer vote-footer" v-if="!showResults">
        <span class="hint-text">选择一个选项后提交</span>
        <button
          class="btn btn-primary btn-sm"
          :disabled="userVotedOption === null"
          @click="submitVote"
        >
          投票
        </button>
      </div>

      <div class="poll-footer vote-footer" v-else>
        <span class="hint-text">共 {{ activePoll.total_votes }} 票</span>
      </div>
    </div>

    <!-- No Active Poll -->
    <div v-else-if="mode === 'vote'" class="poll-empty">
      <span class="empty-icon">📊</span>
      <p>暂无进行中的投票</p>
    </div>

    <!-- Live Results Panel (for presenter view) -->
    <div v-else-if="mode === 'live-results'" class="poll-live-results">
      <div class="poll-header">
        <span class="poll-icon live-icon">🔴</span>
        <h4 class="poll-title">{{ activePoll?.question || '实时投票结果' }}</h4>
        <button
          v-if="activePoll?.is_active"
          class="btn btn-sm btn-danger"
          @click="handleClosePoll"
        >结束投票</button>
        <span v-else class="closed-badge">已结束</span>
      </div>

      <div class="live-chart" v-if="activePoll">
        <div
          v-for="(option, idx) in activePoll.options"
          :key="idx"
          class="live-bar-row"
        >
          <div class="live-label">{{ option }}</div>
          <div class="live-bar-track">
            <div
              class="live-bar-fill"
              :class="`fill-${idx % 6}`"
              :style="{ width: getPercentage(idx) + '%' }"
            ></div>
          </div>
          <div class="live-stats">
            <span class="live-percent">{{ getPercentage(idx) }}%</span>
            <span class="live-count">({{ optionResults?.[idx] || 0 }})</span>
          </div>
        </div>
      </div>

      <div class="total-votes">
        <span class="total-icon">👥</span>
        <span>总投票数：<strong>{{ activePoll?.total_votes || 0 }}</strong></span>
      </div>

      <div class="poll-list-mini" v-if="allPolls.length > 1">
        <div class="mini-label">其他投票</div>
        <div
          v-for="p in allPolls.filter(p => p.poll_id !== activePoll?.poll_id)"
          :key="p.poll_id"
          class="mini-poll-item"
          :class="{ active: selectedPollId === p.poll_id }"
          @click="selectPoll(p.poll_id)"
        >
          <span class="mini-q">{{ p.question }}</span>
          <span class="mini-v">{{ p.total_votes }}票</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { apiClient } from '../api/client'

interface Poll {
  poll_id: string
  question: string
  options: string[]
  option_votes?: Record<string, number>
  total_votes?: number
  is_active?: boolean
}

interface Props {
  mode: 'create' | 'vote' | 'live-results'  // create=presenter creates, vote=audience votes, live-results=presenter sees results
  taskId: string
  initialPoll?: Poll | null
  showResults?: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'poll-created', pollId: string): void
  (e: 'poll-closed', pollId: string): void
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'vote',
  initialPoll: null,
  showResults: false
})

const emit = defineEmits<Emits>()

// Creation state
const newQuestion = ref('')
const newOptions = ref(['', ''])
const autoShowResults = ref(true)

// Voting state
const activePoll = ref<Poll | null>(props.initialPoll)
const allPolls = ref<Poll[]>([])
const userVotedOption = ref<number | null>(null)
const hasVoted = ref(false)
const optionResults = ref<Record<string, number>>({})
const selectedPollId = ref<string | null>(null)

// Polling interval
let pollInterval: ReturnType<typeof setInterval> | null = null

const canCreatePoll = computed(() => {
  return newQuestion.value.trim().length > 0 &&
    newOptions.value.filter(o => o.trim()).length >= 2
})

const addOption = () => {
  if (newOptions.value.length < 6) {
    newOptions.value.push('')
  }
}

const removeOption = (idx: number) => {
  newOptions.value.splice(idx, 1)
}

const handleCreatePoll = async () => {
  const options = newOptions.value.filter(o => o.trim())
  if (options.length < 2) return

  try {
    const res = await apiClient.post(`/engagement/polls/${props.taskId}`, {
      question: newQuestion.value.trim(),
      options
    })
    if (res.data.success) {
      activePoll.value = {
        poll_id: res.data.poll_id,
        question: res.data.question,
        options: res.data.options,
        is_active: true,
        total_votes: 0
      }
      emit('poll-created', res.data.poll_id)
      startPolling()
    }
  } catch (e) {
    console.error('Failed to create poll:', e)
  }
}

const handleVote = (idx: number) => {
  if (hasVoted.value) return
  userVotedOption.value = idx
}

const submitVote = async () => {
  if (userVotedOption.value === null || !activePoll.value) return

  try {
    const res = await apiClient.post(`/engagement/polls/${props.taskId}/vote`, {
      poll_id: activePoll.value.poll_id,
      option_index: userVotedOption.value
    })
    if (res.data.success) {
      hasVoted.value = true
      optionResults.value = res.data.option_results
      activePoll.value.total_votes = res.data.total_votes
    }
  } catch (e) {
    console.error('Failed to vote:', e)
  }
}

const getPercentage = (idx: number): string => {
  if (!activePoll.value || !optionResults.value) return '0'
  const total = activePoll.value.total_votes || 1
  const votes = optionResults.value[String(idx)] || 0
  return ((votes / total) * 100).toFixed(1)
}

const loadPollResults = async () => {
  if (!activePoll.value) return
  try {
    const res = await apiClient.get(`/engagement/polls/${props.taskId}/${activePoll.value.poll_id}`)
    if (res.data.success) {
      activePoll.value = {
        ...activePoll.value,
        ...res.data,
        options: res.data.options
      }
      optionResults.value = res.data.option_votes
    }
  } catch (e) {
    console.error('Failed to load poll results:', e)
  }
}

const loadAllPolls = async () => {
  try {
    const res = await apiClient.get(`/engagement/polls/${props.taskId}`)
    if (res.data.success) {
      allPolls.value = res.data.polls || []
      // Find active poll
      const active = allPolls.value.find(p => p.is_active)
      if (active) {
        selectedPollId.value = active.poll_id
        activePoll.value = active
        await loadPollResults()
      }
    }
  } catch (e) {
    console.error('Failed to load polls:', e)
  }
}

const selectPoll = async (pollId: string) => {
  selectedPollId.value = pollId
  const poll = allPolls.value.find(p => p.poll_id === pollId)
  if (poll) {
    activePoll.value = poll
    await loadPollResults()
  }
}

const handleClosePoll = async () => {
  if (!activePoll.value) return
  try {
    await apiClient.post(`/engagement/polls/${props.taskId}/${activePoll.value.poll_id}/close`)
    activePoll.value.is_active = false
    emit('poll-closed', activePoll.value.poll_id)
  } catch (e) {
    console.error('Failed to close poll:', e)
  }
}

const startPolling = () => {
  stopPolling()
  pollInterval = setInterval(loadPollResults, 3000)
}

const stopPolling = () => {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
}

onMounted(async () => {
  if (props.mode === 'vote') {
    await loadAllPolls()
    if (activePoll.value) {
      startPolling()
    }
  } else if (props.mode === 'live-results') {
    await loadAllPolls()
    if (activePoll.value) {
      startPolling()
    }
  }
})

onUnmounted(() => {
  stopPolling()
})
</script>

<style scoped>
.poll-widget {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  font-family: inherit;
}

:global(.dark) .poll-widget {
  background: #1e1e1e;
}

.poll-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border-bottom: 1px solid #f0f0f0;
}

:global(.dark) .poll-header {
  border-color: #333;
}

.poll-icon {
  font-size: 18px;
}

.live-icon {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.poll-title {
  flex: 1;
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

:global(.dark) .poll-title {
  color: #eee;
}

.vote-count {
  font-size: 12px;
  color: #888;
  background: #f0f0f0;
  padding: 2px 8px;
  border-radius: 10px;
}

:global(.dark) .vote-count {
  background: #333;
  color: #aaa;
}

.close-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  color: #888;
  border-radius: 4px;
}

.close-btn:hover {
  background: #f0f0f0;
}

.poll-body {
  padding: 14px;
}

.form-group {
  margin-bottom: 12px;
}

.form-group label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #555;
  margin-bottom: 6px;
}

:global(.dark) .form-group label {
  color: #aaa;
}

.form-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 13px;
  font-family: inherit;
  box-sizing: border-box;
}

:global(.dark) .form-input {
  background: #2a2a2a;
  border-color: #444;
  color: #fff;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.option-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.option-letter {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #e8f0ff;
  color: #165DFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}

.option-row .form-input {
  flex: 1;
}

.remove-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: #ff4d4f;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  flex-shrink: 0;
}

.add-option-btn {
  margin-top: 6px;
  padding: 6px 12px;
  border: 1px dashed #e0e0e0;
  background: transparent;
  border-radius: 6px;
  font-size: 12px;
  color: #555;
  cursor: pointer;
  width: 100%;
}

:global(.dark) .add-option-btn {
  border-color: #444;
  color: #aaa;
}

.add-option-btn:hover {
  border-color: #165DFF;
  color: #165DFF;
}

.toggle-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #555;
  cursor: pointer;
}

:global(.dark) .toggle-row {
  color: #aaa;
}

.poll-options {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.poll-option-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-size: 13px;
  color: #333;
  transition: all 0.2s;
  text-align: left;
}

:global(.dark) .poll-option-btn {
  background: #2a2a2a;
  border-color: #444;
  color: #eee;
}

.poll-option-btn:hover:not(.disabled) {
  border-color: #165DFF;
  background: #f0f7ff;
}

:global(.dark) .poll-option-btn:hover:not(.disabled) {
  background: #1a2a4a;
}

.poll-option-btn.selected {
  border-color: #165DFF;
  background: #e8f0ff;
}

:global(.dark) .poll-option-btn.selected {
  background: #1a2a4a;
}

.poll-option-btn.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.option-text {
  flex: 1;
}

.option-percent {
  font-weight: 700;
  color: #165DFF;
}

.results-bar {
  padding: 0 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.result-row {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 24px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

:global(.dark) .result-row {
  background: #2a2a2a;
}

.result-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
  position: absolute;
  left: 0;
  top: 0;
}

.fill-0 { background: linear-gradient(90deg, #165DFF, #4d8eff); }
.fill-1 { background: linear-gradient(90deg, #00D4AA, #34efc2); }
.fill-2 { background: linear-gradient(90deg, #FF6B6B, #ff9999); }
.fill-3 { background: linear-gradient(90deg, #F59E0B, #fbbf24); }
.fill-4 { background: linear-gradient(90deg, #7C3AED, #a78bfa); }
.fill-5 { background: linear-gradient(90deg, #10B981, #34d399); }

.result-label {
  flex: 1;
  font-size: 12px;
  color: #333;
  padding-left: 8px;
  position: relative;
  z-index: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:global(.dark) .result-label {
  color: #eee;
}

.result-value {
  font-size: 11px;
  color: #888;
  padding-right: 6px;
  position: relative;
  z-index: 1;
}

:global(.dark) .result-value {
  color: #aaa;
}

.poll-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-top: 1px solid #f0f0f0;
}

:global(.dark) .poll-footer {
  border-color: #333;
}

.vote-footer {
  justify-content: flex-end;
  gap: 8px;
}

.hint-text {
  font-size: 12px;
  color: #888;
}

:global(.dark) .hint-text {
  color: #aaa;
}

.btn {
  padding: 7px 14px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  border: none;
  font-family: inherit;
}

.btn-sm {
  padding: 5px 12px;
  font-size: 12px;
}

.btn-primary {
  background: #165DFF;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0d47e6;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-outline {
  background: white;
  border: 1px solid #e0e0e0;
  color: #555;
}

:global(.dark) .btn-outline {
  background: #2a2a2a;
  border-color: #444;
  color: #aaa;
}

.btn-danger {
  background: #ff4d4f;
  color: white;
  font-size: 11px;
  padding: 4px 10px;
}

.poll-empty {
  padding: 30px;
  text-align: center;
  color: #888;
}

:global(.dark) .poll-empty {
  color: #aaa;
}

.empty-icon {
  font-size: 28px;
  display: block;
  margin-bottom: 8px;
}

.poll-empty p {
  margin: 0;
  font-size: 13px;
}

/* Live Results Panel */
.poll-live-results {
  padding-bottom: 12px;
}

.live-chart {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.live-bar-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.live-label {
  width: 80px;
  font-size: 12px;
  color: #555;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:global(.dark) .live-label {
  color: #aaa;
}

.live-bar-track {
  flex: 1;
  height: 24px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

:global(.dark) .live-bar-track {
  background: #2a2a2a;
}

.live-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.live-stats {
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

.live-count {
  font-size: 11px;
  color: #888;
}

:global(.dark) .live-count {
  color: #aaa;
}

.total-votes {
  padding: 8px 14px;
  font-size: 13px;
  color: #555;
  display: flex;
  align-items: center;
  gap: 6px;
}

:global(.dark) .total-votes {
  color: #aaa;
}

.total-icon {
  font-size: 14px;
}

.closed-badge {
  font-size: 11px;
  background: #f0f0f0;
  color: #888;
  padding: 2px 8px;
  border-radius: 10px;
}

:global(.dark) .closed-badge {
  background: #333;
}

.poll-list-mini {
  padding: 8px 14px 0;
  border-top: 1px solid #f0f0f0;
  margin-top: 8px;
}

:global(.dark) .poll-list-mini {
  border-color: #333;
}

.mini-label {
  font-size: 11px;
  color: #888;
  margin-bottom: 6px;
}

:global(.dark) .mini-label {
  color: #aaa;
}

.mini-poll-item {
  display: flex;
  justify-content: space-between;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  color: #555;
  margin-bottom: 4px;
}

:global(.dark) .mini-poll-item {
  color: #aaa;
}

.mini-poll-item:hover {
  background: #f0f0f0;
}

:global(.dark) .mini-poll-item:hover {
  background: #2a2a2a;
}

.mini-poll-item.active {
  background: #e8f0ff;
  color: #165DFF;
}

:global(.dark) .mini-poll-item.active {
  background: #1a2a4a;
  color: #4d8eff;
}

.mini-q {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mini-v {
  margin-left: 8px;
  color: #888;
}
</style>
