<template>
  <div class="slide-comments-panel">
    <!-- 头部 -->
    <div class="panel-header">
      <div class="header-tabs">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'comments' }"
          @click="activeTab = 'comments'"
        >
          💬 评论 <span v-if="commentStats.pending > 0" class="tab-badge">{{ commentStats.pending }}</span>
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'suggestions' }"
          @click="activeTab = 'suggestions'"
        >
          💡 建议 <span v-if="pendingSuggestEdits.length > 0" class="tab-badge">{{ pendingSuggestEdits.length }}</span>
        </button>
      </div>
      <div class="header-actions">
        <label class="show-resolved">
          <input type="checkbox" v-model="showResolved" />
          <span>显示已处理</span>
        </label>
      </div>
    </div>

    <!-- 评论列表 -->
    <div v-if="activeTab === 'comments'" class="comments-section">
      <!-- 空状态 -->
      <div v-if="currentSlideComments.length === 0" class="empty-state">
        <span class="empty-icon">💬</span>
        <p>还没有评论</p>
        <p class="empty-hint">点击下方添加评论</p>
      </div>

      <!-- 评论列表 -->
      <div v-else class="comments-list">
        <div
          v-for="comment in currentSlideComments"
          :key="comment.id"
          class="comment-item"
          :class="{ resolved: comment.resolved }"
        >
          <div class="comment-avatar" :style="{ background: getAvatarColor(comment.authorName) }">
            {{ comment.authorName.charAt(0) }}
          </div>
          <div class="comment-body">
            <div class="comment-header">
              <span class="comment-author">{{ comment.authorName }}</span>
              <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
              <span v-if="comment.resolved" class="resolved-tag">✓ 已解决</span>
            </div>
            <div class="comment-content">{{ comment.content }}</div>

            <!-- 回复列表 -->
            <div v-if="comment.replies.length > 0" class="replies-list">
              <div v-for="reply in comment.replies" :key="reply.id" class="reply-item">
                <div class="reply-avatar" :style="{ background: getAvatarColor(reply.authorName) }">
                  {{ reply.authorName.charAt(0) }}
                </div>
                <div class="reply-body">
                  <span class="reply-author">{{ reply.authorName }}</span>
                  <span class="reply-content">{{ reply.content }}</span>
                </div>
              </div>
            </div>

            <!-- 评论操作 -->
            <div class="comment-actions">
              <button class="action-btn" @click="toggleReply(comment.id)">回复</button>
              <button v-if="!comment.resolved" class="action-btn" @click="handleResolve(comment.id)">解决</button>
              <button v-else class="action-btn" @click="handleUnresolve(comment.id)">重新打开</button>
            </div>

            <!-- 回复输入框 -->
            <div v-if="replyingTo === comment.id" class="reply-input-area">
              <input
                v-model="replyContent"
                class="reply-input"
                placeholder="写下你的回复..."
                @keyup.enter="submitReply(comment.id)"
              />
              <button class="submit-btn" @click="submitReply(comment.id)">发送</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 添加评论 -->
      <div class="add-comment-section">
        <div class="current-avatar" :style="{ background: getAvatarColor('我') }">我</div>
        <div class="add-comment-input">
          <textarea
            v-model="newComment"
            class="comment-textarea"
            :placeholder="`评论第 ${slideNum} 页...`"
            rows="2"
            @keyup.ctrl.enter="submitComment"
          ></textarea>
          <button
            class="submit-comment-btn"
            @click="submitComment"
            :disabled="!newComment.trim()"
          >
            发表评论
          </button>
        </div>
      </div>
    </div>

    <!-- 建议编辑列表 -->
    <div v-if="activeTab === 'suggestions'" class="suggestions-section">
      <!-- 空状态 -->
      <div v-if="currentSlideSuggestions.length === 0" class="empty-state">
        <span class="empty-icon">💡</span>
        <p>还没有编辑建议</p>
        <p class="empty-hint">选择内容后点击"建议修改"</p>
      </div>

      <!-- 建议列表 -->
      <div v-else class="suggestions-list">
        <div
          v-for="suggestion in currentSlideSuggestions"
          :key="suggestion.id"
          class="suggestion-item"
          :class="suggestion.status"
        >
          <div class="suggestion-header">
            <div class="suggestion-avatar" :style="{ background: getAvatarColor(suggestion.authorName) }">
              {{ suggestion.authorName.charAt(0) }}
            </div>
            <div class="suggestion-meta">
              <span class="suggestion-author">{{ suggestion.authorName }}</span>
              <span class="suggestion-type">{{ getTypeText(suggestion.type) }}</span>
            </div>
            <span class="suggestion-status" :class="suggestion.status">
              {{ getStatusText(suggestion.status) }}
            </span>
          </div>

          <div class="suggestion-content">
            <div class="suggestion-reason">{{ suggestion.reason }}</div>
            <div class="suggestion-change">
              <div class="change-original" v-if="suggestion.originalContent">
                <span class="change-label">原文:</span>
                <span class="change-text">{{ JSON.stringify(suggestion.originalContent).slice(0, 50) }}</span>
              </div>
              <div class="change-arrow">→</div>
              <div class="change-suggested">
                <span class="change-label">建议:</span>
                <span class="change-text">{{ JSON.stringify(suggestion.suggestedContent).slice(0, 50) }}</span>
              </div>
            </div>
          </div>

          <!-- 建议操作 -->
          <div v-if="suggestion.status === 'pending'" class="suggestion-actions">
            <button class="accept-btn" @click="handleAccept(suggestion.id)">✓ 接受</button>
            <button class="reject-btn" @click="handleReject(suggestion.id)">✕ 拒绝</button>
          </div>
        </div>
      </div>

      <!-- 添加建议按钮 -->
      <div class="add-suggestion-section">
        <button class="add-suggestion-btn" @click="showSuggestModal = true">
          <span>💡</span> 添加编辑建议
        </button>
      </div>
    </div>

    <!-- 建议弹窗 -->
    <div v-if="showSuggestModal" class="suggest-modal" @click.self="showSuggestModal = false">
      <div class="suggest-form">
        <h3>📝 添加编辑建议</h3>
        <div class="form-item">
          <label>建议类型</label>
          <select v-model="suggestForm.type">
            <option value="text">文字内容</option>
            <option value="image">图片</option>
            <option value="layout">布局</option>
            <option value="style">样式</option>
          </select>
        </div>
        <div class="form-item">
          <label>修改原因</label>
          <textarea v-model="suggestForm.reason" placeholder="说明你建议这样修改的原因..." rows="3"></textarea>
        </div>
        <div class="form-item">
          <label>建议内容</label>
          <textarea v-model="suggestForm.content" placeholder="输入建议的内容..." rows="3"></textarea>
        </div>
        <div class="form-actions">
          <button class="cancel-btn" @click="showSuggestModal = false">取消</button>
          <button class="submit-btn" @click="submitSuggestion">提交建议</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSlideComments } from '../composables/useSlideComments'

const props = defineProps<{
  pptId?: string
  slideNum?: number
}>()

const {
  comments,
  suggestEdits,
  activeSlideNum,
  showResolved,
  pendingSuggestEdits,
  commentStats,
  addComment,
  replyComment,
  resolveComment,
  unresolveComment,
  getSlideComments,
  addSuggestEdit,
  acceptSuggestEdit,
  rejectSuggestEdit,
  formatTime,
  loadComments
} = useSlideComments(props.pptId)

const activeTab = ref<'comments' | 'suggestions'>('comments')
const newComment = ref('')
const replyContent = ref('')
const replyingTo = ref<string | null>(null)
const showSuggestModal = ref(false)
const suggestForm = ref({
  type: 'text' as 'text' | 'image' | 'layout' | 'style',
  reason: '',
  content: ''
})

const currentSlideNum = computed(() => props.slideNum || activeSlideNum.value)

const currentSlideComments = computed(() => {
  let slideComments = comments.value.filter(c => c.slideNum === currentSlideNum.value)
  if (!showResolved.value) {
    slideComments = slideComments.filter(c => !c.resolved)
  }
  return slideComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
})

const currentSlideSuggestions = computed(() => {
  return suggestEdits.value
    .filter(e => e.slideNum === currentSlideNum.value)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
})

const getAvatarColor = (name: string): string => {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD']
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

const getTypeText = (type: string): string => {
  const map: Record<string, string> = {
    text: '文字',
    image: '图片',
    layout: '布局',
    style: '样式'
  }
  return map[type] || type
}

const getStatusText = (status: string): string => {
  const map: Record<string, string> = {
    pending: '待处理',
    accepted: '已接受',
    rejected: '已拒绝'
  }
  return map[status] || status
}

const submitComment = () => {
  if (!newComment.value.trim()) return
  addComment(currentSlideNum.value, newComment.value)
  newComment.value = ''
}

const toggleReply = (commentId: string) => {
  replyingTo.value = replyingTo.value === commentId ? null : commentId
  replyContent.value = ''
}

const submitReply = (commentId: string) => {
  if (!replyContent.value.trim()) return
  replyComment(commentId, replyContent.value)
  replyContent.value = ''
  replyingTo.value = null
}

const handleResolve = (commentId: string) => {
  resolveComment(commentId)
}

const handleUnresolve = (commentId: string) => {
  unresolveComment(commentId)
}

const handleAccept = (editId: string) => {
  acceptSuggestEdit(editId)
}

const handleReject = (editId: string) => {
  rejectSuggestEdit(editId)
}

const submitSuggestion = () => {
  if (!suggestForm.value.reason.trim()) return
  addSuggestEdit(
    currentSlideNum.value,
    suggestForm.value.type,
    {},
    { content: suggestForm.value.content },
    suggestForm.value.reason
  )
  suggestForm.value = { type: 'text', reason: '', content: '' }
  showSuggestModal.value = false
}
</script>

<style scoped>
.slide-comments-panel {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  max-width: 400px;
  max-height: 600px;
  display: flex;
  flex-direction: column;
}

:global(.dark) .slide-comments-panel {
  background: #1a1a1a;
}

/* Header */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

:global(.dark) .panel-header {
  border-color: #333;
}

.header-tabs {
  display: flex;
  gap: 4px;
}

.tab-btn {
  padding: 6px 12px;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  color: #666;
  display: flex;
  align-items: center;
  gap: 4px;
}

.tab-btn.active {
  background: #f0f7ff;
  color: #165DFF;
}

:global(.dark) .tab-btn.active {
  background: #1a2a4a;
}

.tab-badge {
  background: #FF3B30;
  color: white;
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 8px;
}

.show-resolved {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
  cursor: pointer;
}

.show-resolved input {
  cursor: pointer;
}

/* Empty */
.empty-state {
  padding: 40px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 40px;
  display: block;
  margin-bottom: 8px;
}

.empty-state p {
  font-size: 14px;
  color: #666;
  margin: 0 0 4px;
}

:global(.dark) .empty-state p {
  color: #aaa;
}

.empty-hint {
  font-size: 12px;
  color: #999;
  margin: 0;
}

/* Comments */
.comments-section {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.comments-list {
  flex: 1;
  padding: 8px 0;
}

.comment-item {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #f5f5f5;
}

:global(.dark) .comment-item {
  border-color: #2a2a2a;
}

.comment-item.resolved {
  opacity: 0.6;
}

.comment-avatar {
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

.comment-body {
  flex: 1;
  min-width: 0;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.comment-author {
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

:global(.dark) .comment-author {
  color: #eee;
}

.comment-time {
  font-size: 11px;
  color: #aaa;
}

.resolved-tag {
  font-size: 11px;
  color: #00C850;
  background: #e8f8ee;
  padding: 1px 6px;
  border-radius: 4px;
}

:global(.dark) .resolved-tag {
  background: #1a3a2a;
}

.comment-content {
  font-size: 13px;
  color: #555;
  line-height: 1.5;
}

:global(.dark) .comment-content {
  color: #bbb;
}

/* Replies */
.replies-list {
  margin-top: 8px;
  padding-left: 12px;
  border-left: 2px solid #f0f0f0;
}

:global(.dark) .replies-list {
  border-color: #333;
}

.reply-item {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.reply-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 11px;
  flex-shrink: 0;
}

.reply-body {
  flex: 1;
}

.reply-author {
  font-size: 12px;
  font-weight: 500;
  color: #555;
  margin-right: 6px;
}

:global(.dark) .reply-author {
  color: #bbb;
}

.reply-content {
  font-size: 12px;
  color: #666;
}

:global(.dark) .reply-content {
  color: #999;
}

/* Actions */
.comment-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.action-btn {
  border: none;
  background: transparent;
  font-size: 12px;
  color: #888;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
}

.action-btn:hover {
  background: #f0f0f0;
  color: #555;
}

:global(.dark) .action-btn:hover {
  background: #333;
}

/* Reply Input */
.reply-input-area {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.reply-input {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 12px;
}

:global(.dark) .reply-input {
  background: #2a2a2a;
  border-color: #444;
  color: #fff;
}

.submit-btn {
  padding: 6px 12px;
  border: none;
  background: #165DFF;
  color: white;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
}

.submit-btn:hover {
  background: #0d47e6;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Add Comment */
.add-comment-section {
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 12px;
  background: #fafafa;
}

:global(.dark) .add-comment-section {
  background: #1a1a1a;
  border-color: #333;
}

.current-avatar {
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

.add-comment-input {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.comment-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 13px;
  resize: none;
  font-family: inherit;
}

:global(.dark) .comment-textarea {
  background: #2a2a2a;
  border-color: #444;
  color: #fff;
}

.submit-comment-btn {
  align-self: flex-end;
  padding: 8px 16px;
  border: none;
  background: #165DFF;
  color: white;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
}

.submit-comment-btn:hover {
  background: #0d47e6;
}

.submit-comment-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Suggestions */
.suggestions-section {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.suggestions-list {
  flex: 1;
  padding: 8px 0;
}

.suggestion-item {
  padding: 12px 16px;
  border-bottom: 1px solid #f5f5f5;
}

:global(.dark) .suggestion-item {
  border-color: #2a2a2a;
}

.suggestion-item.accepted {
  opacity: 0.6;
  background: #f0fff0;
}

:global(.dark) .suggestion-item.accepted {
  background: #0a200a;
}

.suggestion-item.rejected {
  opacity: 0.6;
  background: #fff8f8;
}

:global(.dark) .suggestion-item.rejected {
  background: #200a0a;
}

.suggestion-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.suggestion-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 12px;
  flex-shrink: 0;
}

.suggestion-meta {
  flex: 1;
}

.suggestion-author {
  font-size: 13px;
  font-weight: 500;
  color: #333;
  margin-right: 8px;
}

:global(.dark) .suggestion-author {
  color: #eee;
}

.suggestion-type {
  font-size: 11px;
  color: #888;
  background: #f0f0f0;
  padding: 1px 6px;
  border-radius: 4px;
}

:global(.dark) .suggestion-type {
  background: #333;
}

.suggestion-status {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
}

.suggestion-status.pending {
  background: #fff8e6;
  color: #FF9500;
}

:global(.dark) .suggestion-status.pending {
  background: #3a2a0a;
}

.suggestion-status.accepted {
  background: #e8f8ee;
  color: #00C850;
}

:global(.dark) .suggestion-status.accepted {
  background: #0a2a1a;
}

.suggestion-status.rejected {
  background: #fee;
  color: #FF3B30;
}

:global(.dark) .suggestion-status.rejected {
  background: #3a0a0a;
}

.suggestion-content {
  margin-left: 36px;
}

.suggestion-reason {
  font-size: 13px;
  color: #555;
  line-height: 1.5;
}

:global(.dark) .suggestion-reason {
  color: #bbb;
}

.suggestion-change {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  background: #f8f9fa;
  padding: 8px;
  border-radius: 6px;
}

:global(.dark) .suggestion-change {
  background: #2a2a2a;
}

.change-label {
  color: #888;
  margin-right: 4px;
}

.change-arrow {
  color: #165DFF;
}

.suggestion-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  margin-left: 36px;
}

.accept-btn,
.reject-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
}

.accept-btn {
  background: #e8f8ee;
  color: #00C850;
}

.accept-btn:hover {
  background: #d0f0d8;
}

.reject-btn {
  background: #fee;
  color: #FF3B30;
}

.reject-btn:hover {
  background: #fdd;
}

/* Add Suggestion */
.add-suggestion-section {
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
}

:global(.dark) .add-suggestion-section {
  border-color: #333;
}

.add-suggestion-btn {
  width: 100%;
  padding: 10px;
  border: 1px dashed #ccc;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.add-suggestion-btn:hover {
  border-color: #165DFF;
  color: #165DFF;
  background: #f0f7ff;
}

/* Suggest Modal */
.suggest-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.suggest-form {
  background: white;
  border-radius: 16px;
  padding: 24px;
  width: 360px;
  max-width: 90vw;
}

:global(.dark) .suggest-form {
  background: #2a2a2a;
}

.suggest-form h3 {
  margin: 0 0 16px;
  font-size: 16px;
  color: #333;
}

:global(.dark) .suggest-form h3 {
  color: #eee;
}

.form-item {
  margin-bottom: 12px;
}

.form-item label {
  display: block;
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
}

:global(.dark) .form-item label {
  color: #aaa;
}

.form-item select,
.form-item textarea,
.form-item input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
  resize: none;
  box-sizing: border-box;
}

:global(.dark) .form-item textarea,
:global(.dark) .form-item select {
  background: #1a1a1a;
  border-color: #444;
  color: #fff;
}

.form-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.cancel-btn {
  flex: 1;
  padding: 10px;
  border: 1px solid #e0e0e0;
  background: white;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
}

:global(.dark) .cancel-btn {
  background: #2a2a2a;
  border-color: #444;
  color: #aaa;
}

.submit-btn {
  flex: 1;
  padding: 10px;
  border: none;
  background: #165DFF;
  color: white;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
}

.submit-btn:hover {
  background: #0d47e6;
}
</style>
