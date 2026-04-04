<template>
  <div class="qa-widget">
    <!-- Audience Q&A Submit Mode -->
    <div v-if="mode === 'submit'" class="qa-submit">
      <div class="qa-header">
        <span class="qa-icon">❓</span>
        <h4 class="qa-title">提问</h4>
        <span class="qa-count" v-if="totalQuestions > 0">{{ totalQuestions }} 个问题</span>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="qa-body">
        <div class="ask-form">
          <input
            v-model="questionText"
            type="text"
            class="form-input ask-input"
            placeholder="输入你的问题..."
            maxlength="300"
            @keyup.enter="handleSubmit"
          />
          <div class="ask-form-row">
            <input
              v-model="askerName"
              type="text"
              class="form-input name-input"
              placeholder="你的名字（可选）"
              maxlength="50"
            />
            <button
              class="btn btn-primary"
              :disabled="!questionText.trim()"
              @click="handleSubmit"
            >
              提交
            </button>
          </div>
        </div>

        <div class="questions-list" v-if="questions.length > 0">
          <div
            v-for="q in questions"
            :key="q.qa_id"
            class="question-item"
            :class="{ answered: q.is_answered }"
          >
            <div class="q-header">
              <span class="q-asker">{{ q.asker }}</span>
              <span class="q-time">{{ formatTime(q.created_at) }}</span>
            </div>
            <p class="q-text">{{ q.question }}</p>
            <div class="q-footer">
              <button
                class="upvote-btn"
                :class="{ upvoted: upvotedIds.has(q.qa_id) }"
                @click="handleUpvote(q.qa_id)"
              >
                <span>👍</span>
                <span>{{ q.upvotes }}</span>
              </button>
              <span v-if="q.is_answered" class="answered-badge">✅ 已回答</span>
            </div>
          </div>
        </div>

        <div class="qa-empty" v-else>
          <span class="empty-icon">💬</span>
          <p>还没有人提问</p>
          <p class="empty-hint">成为第一个提问的人！</p>
        </div>
      </div>
    </div>

    <!-- Presenter Q&A Moderation Mode -->
    <div v-else-if="mode === 'moderate'" class="qa-moderate">
      <div class="qa-header">
        <span class="qa-icon">🎙️</span>
        <h4 class="qa-title">问答管理</h4>
        <span class="qa-count" v-if="totalQuestions > 0">{{ totalQuestions }} 个问题</span>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="moderate-tabs">
        <button
          v-for="tab in moderateTabs"
          :key="tab.id"
          class="tab-btn"
          :class="{ active: activeModerateTab === tab.id }"
          @click="activeModerateTab = tab.id"
        >
          {{ tab.label }}
          <span class="tab-badge" v-if="tab.count > 0">{{ tab.count }}</span>
        </button>
      </div>

      <div class="qa-body">
        <!-- Pending Questions -->
        <div v-if="activeModerateTab === 'pending'" class="questions-list">
          <div
            v-for="q in pendingQuestions"
            :key="q.qa_id"
            class="question-item pending"
          >
            <div class="q-header">
              <span class="q-asker">{{ q.asker }}</span>
              <span class="q-time">{{ formatTime(q.created_at) }}</span>
              <span class="q-upvotes">👍 {{ q.upvotes }}</span>
            </div>
            <p class="q-text">{{ q.question }}</p>
            <div class="q-actions">
              <button class="btn btn-sm btn-outline" @click="handleAnswer(q)">回答</button>
              <button
                class="btn btn-sm btn-danger-outline"
                @click="handleDismiss(q.qa_id)"
              >忽略</button>
            </div>
          </div>
          <div v-if="pendingQuestions.length === 0" class="qa-empty">
            <p>暂无待回答问题</p>
          </div>
        </div>

        <!-- Answered Questions -->
        <div v-if="activeModerateTab === 'answered'" class="questions-list">
          <div
            v-for="q in answeredQuestions"
            :key="q.qa_id"
            class="question-item answered"
          >
            <div class="q-header">
              <span class="q-asker">{{ q.asker }}</span>
              <span class="q-time">{{ formatTime(q.created_at) }}</span>
              <span class="q-upvotes">👍 {{ q.upvotes }}</span>
            </div>
            <p class="q-text">{{ q.question }}</p>
            <div class="q-answer-preview">
              <span class="answer-label">✅ 已回答</span>
              <span class="answer-count" v-if="q.answer_count > 0">{{ q.answer_count }} 条回复</span>
            </div>
          </div>
          <div v-if="answeredQuestions.length === 0" class="qa-empty">
            <p>暂无已回答问题</p>
          </div>
        </div>

        <!-- All Questions -->
        <div v-if="activeModerateTab === 'all'" class="questions-list">
          <div
            v-for="q in questions"
            :key="q.qa_id"
            class="question-item"
            :class="{ answered: q.is_answered }"
          >
            <div class="q-header">
              <span class="q-asker">{{ q.asker }}</span>
              <span class="q-time">{{ formatTime(q.created_at) }}</span>
              <span class="q-upvotes">👍 {{ q.upvotes }}</span>
            </div>
            <p class="q-text">{{ q.question }}</p>
            <div class="q-footer">
              <span v-if="q.is_answered" class="answered-badge">✅ 已回答</span>
              <button v-else class="btn btn-sm btn-primary" @click="handleAnswer(q)">回答</button>
            </div>
          </div>
          <div v-if="questions.length === 0" class="qa-empty">
            <p>暂无问题</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Answer Modal -->
    <div v-if="showAnswerModal" class="answer-modal-overlay" @click.self="showAnswerModal = false">
      <div class="answer-modal">
        <div class="answer-modal-header">
          <h4>回答问题</h4>
          <button @click="showAnswerModal = false">✕</button>
        </div>
        <div class="answer-modal-body">
          <div class="original-question">
            <span class="oq-label">问题：</span>
            <span class="oq-text">{{ selectedQuestion?.question }}</span>
          </div>
          <textarea
            v-model="answerText"
            class="form-input answer-textarea"
            placeholder="输入你的回答..."
            rows="4"
            maxlength="1000"
          ></textarea>
        </div>
        <div class="answer-modal-footer">
          <button class="btn btn-outline" @click="showAnswerModal = false">取消</button>
          <button
            class="btn btn-primary"
            :disabled="!answerText.trim()"
            @click="submitAnswer"
          >
            提交回答
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import apiClient from '../api/client'

interface QAQuestion {
  qa_id: string
  question: string
  asker: string
  is_answered: boolean
  upvotes: number
  created_at: string
  answer_count?: number
}

interface Props {
  mode: 'submit' | 'moderate'  // submit=audience asks, moderate=presenter manages
  taskId: string
}

interface Emits {
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const questionText = ref('')
const askerName = ref('')
const questions = ref<QAQuestion[]>([])
const upvotedIds = ref(new Set<string>())
const totalQuestions = ref(0)
const showAnswerModal = ref(false)
const selectedQuestion = ref<QAQuestion | null>(null)
const answerText = ref('')
const activeModerateTab = ref('pending')

let pollInterval: ReturnType<typeof setInterval> | null = null

const moderateTabs = computed(() => [
  { id: 'pending', label: '待回答', count: pendingQuestions.value.length },
  { id: 'answered', label: '已回答', count: answeredQuestions.value.length },
  { id: 'all', label: '全部', count: questions.value.length }
])

const pendingQuestions = computed(() =>
  questions.value.filter(q => !q.is_answered)
)

const answeredQuestions = computed(() =>
  questions.value.filter(q => q.is_answered)
)

const handleSubmit = async () => {
  if (!questionText.value.trim()) return

  try {
    const res = await apiClient.post(`/engagement/qa/${props.taskId}`, {
      question: questionText.value.trim(),
      asker_name: askerName.value.trim() || '匿名用户'
    })
    if (res.data.success) {
      questionText.value = ''
      await loadQuestions()
    }
  } catch (e) {
    console.error('Failed to submit question:', e)
  }
}

const handleUpvote = async (qaId: string) => {
  if (upvotedIds.value.has(qaId)) return

  try {
    await apiClient.post(`/engagement/qa/${props.taskId}/${qaId}/upvote`)
    upvotedIds.value.add(qaId)
    const q = questions.value.find(q => q.qa_id === qaId)
    if (q) q.upvotes++
  } catch (e) {
    console.error('Failed to upvote:', e)
  }
}

const handleAnswer = (q: QAQuestion) => {
  selectedQuestion.value = q
  answerText.value = ''
  showAnswerModal.value = true
}

const submitAnswer = async () => {
  if (!answerText.value.trim() || !selectedQuestion.value) return

  try {
    await apiClient.post(
      `/engagement/qa/${props.taskId}/${selectedQuestion.value.qa_id}/answer?answer_text=${encodeURIComponent(answerText.value.trim())}`
    )
    showAnswerModal.value = false
    selectedQuestion.value.is_answered = true
    await loadQuestions()
  } catch (e) {
    console.error('Failed to submit answer:', e)
  }
}

const handleDismiss = async (qaId: string) => {
  // For now, just remove from list (could add dismiss endpoint)
  questions.value = questions.value.filter(q => q.qa_id !== qaId)
}

const loadQuestions = async () => {
  try {
    const res = await apiClient.get(`/engagement/qa/${props.taskId}`)
    if (res.data.success) {
      questions.value = res.data.questions || []
      totalQuestions.value = res.data.total || 0
    }
  } catch (e) {
    console.error('Failed to load Q&A:', e)
  }
}

const formatTime = (isoString: string): string => {
  if (!isoString) return ''
  try {
    const date = new Date(isoString)
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diff < 60) return '刚刚'
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
    return `${Math.floor(diff / 86400)}天前`
  } catch {
    return ''
  }
}

const startPolling = () => {
  stopPolling()
  pollInterval = setInterval(loadQuestions, 5000)
}

const stopPolling = () => {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
}

onMounted(() => {
  loadQuestions()
  startPolling()
})

onUnmounted(() => {
  stopPolling()
})
</script>

<style scoped>
.qa-widget {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  font-family: inherit;
}

:global(.dark) .qa-widget {
  background: #1e1e1e;
}

.qa-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border-bottom: 1px solid #f0f0f0;
}

:global(.dark) .qa-header {
  border-color: #333;
}

.qa-icon {
  font-size: 18px;
}

.qa-title {
  flex: 1;
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

:global(.dark) .qa-title {
  color: #eee;
}

.qa-count {
  font-size: 12px;
  color: #888;
  background: #f0f0f0;
  padding: 2px 8px;
  border-radius: 10px;
}

:global(.dark) .qa-count {
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

.qa-body {
  padding: 12px;
}

/* Submit mode */
.ask-form {
  margin-bottom: 14px;
}

.ask-input {
  margin-bottom: 8px;
}

.ask-form-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.name-input {
  flex: 1;
}

.btn {
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  border: none;
  font-family: inherit;
  white-space: nowrap;
}

.btn-sm {
  padding: 5px 10px;
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

.btn-danger-outline {
  background: transparent;
  border: 1px solid #ff4d4f;
  color: #ff4d4f;
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

/* Questions list */
.questions-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 400px;
  overflow-y: auto;
}

.question-item {
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fafafa;
}

:global(.dark) .question-item {
  background: #1a1a1a;
  border-color: #333;
}

.question-item.answered {
  border-color: #52c41a;
  background: #f6ffed;
}

:global(.dark) .question-item.answered {
  background: #1a2a10;
  border-color: #52c41a;
}

.question-item.pending {
  border-left: 3px solid #165DFF;
}

.q-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.q-asker {
  font-size: 12px;
  font-weight: 600;
  color: #555;
}

:global(.dark) .q-asker {
  color: #aaa;
}

.q-time {
  font-size: 11px;
  color: #aaa;
  flex: 1;
}

.q-upvotes {
  font-size: 11px;
  color: #888;
}

.q-text {
  margin: 4px 0;
  font-size: 13px;
  color: #333;
  line-height: 1.4;
}

:global(.dark) .q-text {
  color: #eee;
}

.q-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}

.upvote-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border: 1px solid #e0e0e0;
  background: white;
  border-radius: 12px;
  font-size: 12px;
  cursor: pointer;
  color: #555;
  transition: all 0.15s;
}

:global(.dark) .upvote-btn {
  background: #2a2a2a;
  border-color: #444;
  color: #aaa;
}

.upvote-btn:hover {
  border-color: #165DFF;
  color: #165DFF;
}

.upvote-btn.upvoted {
  background: #e8f0ff;
  border-color: #165DFF;
  color: #165DFF;
}

.answered-badge {
  font-size: 11px;
  color: #52c41a;
  background: #f6ffed;
  padding: 2px 8px;
  border-radius: 10px;
}

:global(.dark) .answered-badge {
  background: #1a2a10;
}

.q-actions {
  display: flex;
  gap: 6px;
  margin-top: 6px;
}

.q-answer-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  font-size: 12px;
}

.answer-label {
  color: #52c41a;
}

.answer-count {
  color: #888;
}

/* Empty state */
.qa-empty {
  text-align: center;
  padding: 24px;
  color: #888;
}

:global(.dark) .qa-empty {
  color: #aaa;
}

.empty-icon {
  font-size: 28px;
  display: block;
  margin-bottom: 8px;
}

.qa-empty p {
  margin: 0;
  font-size: 13px;
}

.empty-hint {
  font-size: 12px !important;
  color: #aaa;
  margin-top: 4px !important;
}

/* Moderate mode */
.moderate-tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid #f0f0f0;
  padding: 0 12px;
}

:global(.dark) .moderate-tabs {
  border-color: #333;
}

.tab-btn {
  padding: 8px 14px;
  border: none;
  background: transparent;
  font-size: 13px;
  color: #888;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  display: flex;
  align-items: center;
  gap: 4px;
}

:global(.dark) .tab-btn {
  color: #aaa;
}

.tab-btn.active {
  color: #165DFF;
  border-bottom-color: #165DFF;
}

.tab-badge {
  background: #165DFF;
  color: white;
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 8px;
}

/* Answer Modal */
.answer-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.answer-modal {
  background: white;
  border-radius: 12px;
  width: 480px;
  max-width: 95vw;
  overflow: hidden;
}

:global(.dark) .answer-modal {
  background: #1e1e1e;
}

.answer-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #f0f0f0;
}

:global(.dark) .answer-modal-header {
  border-color: #333;
}

.answer-modal-header h4 {
  margin: 0;
  font-size: 15px;
  color: #333;
}

:global(.dark) .answer-modal-header h4 {
  color: #eee;
}

.answer-modal-header button {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  color: #888;
  border-radius: 4px;
}

.answer-modal-body {
  padding: 14px 16px;
}

.original-question {
  margin-bottom: 12px;
  padding: 10px;
  background: #f0f0f0;
  border-radius: 6px;
  font-size: 13px;
}

:global(.dark) .original-question {
  background: #2a2a2a;
}

.oq-label {
  font-weight: 600;
  color: #555;
}

:global(.dark) .oq-label {
  color: #aaa;
}

.oq-text {
  color: #333;
  margin-left: 4px;
}

:global(.dark) .oq-text {
  color: #eee;
}

.answer-textarea {
  resize: vertical;
  min-height: 100px;
}

.answer-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
}

:global(.dark) .answer-modal-footer {
  border-color: #333;
}
</style>
