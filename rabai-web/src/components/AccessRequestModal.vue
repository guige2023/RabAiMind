<template>
  <div v-if="show" class="modal-mask" @click.self="$emit('close')">
    <div class="access-modal">
      <div class="modal-header">
        <h3>🔐 访问请求</h3>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <!-- Tab Navigation -->
      <div class="tab-nav">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="tab-btn"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
          <span v-if="tab.key === 'incoming' && pendingCount > 0" class="badge">{{ pendingCount }}</span>
        </button>
      </div>

      <div class="modal-body">
        <!-- Incoming Requests (Owner View) -->
        <div v-if="activeTab === 'incoming'" class="requests-list">
          <div v-if="loading" class="loading-state">
            <div class="spinner"></div>
          </div>
          <div v-else-if="incomingRequests.length === 0" class="empty-state">
            <span class="empty-icon">📭</span>
            <p>暂无访问请求</p>
          </div>
          <div
            v-else
            v-for="req in incomingRequests"
            :key="req.id"
            class="request-card"
            :class="req.status"
          >
            <div class="request-header">
              <div class="requester-info">
                <div class="requester-avatar" :style="{ background: avatarColor(req.requester_email) }">
                  {{ req.requester_name?.charAt(0) || '?' }}
                </div>
                <div>
                  <div class="requester-name">{{ req.requester_name || req.requester_email }}</div>
                  <div class="requester-email">{{ req.requester_email }}</div>
                </div>
              </div>
              <div class="request-status-badge" :class="req.status">
                {{ statusText(req.status) }}
              </div>
            </div>
            <div class="request-body">
              <div class="request-resource">
                <span class="resource-icon">{{ req.resource_type === 'ppt' ? '📊' : '👥' }}</span>
                <span class="resource-name">{{ req.resource_name || req.resource_id }}</span>
              </div>
              <div class="request-permission">
                请求权限: <strong>{{ permissionText(req.permission_requested) }}</strong>
              </div>
              <div v-if="req.message" class="request-message">
                「{{ req.message }}」
              </div>
              <div class="request-time">
                {{ formatTime(req.created_at) }}
              </div>
            </div>
            <div v-if="req.status === 'pending'" class="request-actions">
              <button class="btn-approve" @click="handleApprove(req)">
                ✅ 批准
              </button>
              <button class="btn-reject" @click="showRejectForm(req)">
                ❌ 拒绝
              </button>
            </div>
            <div v-if="req.status === 'rejected' && req.reject_reason" class="reject-reason">
              拒绝原因: {{ req.reject_reason }}
            </div>

            <!-- Reject Reason Form -->
            <div v-if="rejectingId === req.id" class="reject-form">
              <input
                v-model="rejectReason"
                class="form-input"
                placeholder="拒绝原因（可选）"
                maxlength="200"
              />
              <div class="reject-form-actions">
                <button class="btn-cancel" @click="cancelReject">取消</button>
                <button class="btn-confirm-reject" @click="confirmReject(req)">确认拒绝</button>
              </div>
            </div>
          </div>
        </div>

        <!-- My Requests (Requester View) -->
        <div v-if="activeTab === 'my-requests'" class="requests-list">
          <div v-if="loading" class="loading-state">
            <div class="spinner"></div>
          </div>
          <div v-else-if="myRequests.length === 0" class="empty-state">
            <span class="empty-icon">📤</span>
            <p>还没有发起过访问请求</p>
            <button class="btn-create-request" @click="activeTab = 'request'">
              + 发起访问请求
            </button>
          </div>
          <div
            v-else
            v-for="req in myRequests"
            :key="req.id"
            class="request-card"
            :class="req.status"
          >
            <div class="request-header">
              <div class="requester-info">
                <div class="resource-icon">{{ req.resource_type === 'ppt' ? '📊' : '👥' }}</div>
                <div>
                  <div class="requester-name">{{ req.resource_name || req.resource_id }}</div>
                  <div class="requester-email">请求 {{ permissionText(req.permission_requested) }} 权限</div>
                </div>
              </div>
              <div class="request-status-badge" :class="req.status">
                {{ statusText(req.status) }}
              </div>
            </div>
            <div v-if="req.message" class="request-message">
              「{{ req.message }}」
            </div>
            <div class="request-time">
              {{ formatTime(req.created_at) }}
              <span v-if="req.status === 'approved'"> · 已获得 {{ permissionText(req.permission_requested) }} 权限</span>
              <span v-if="req.status === 'rejected'"> · 被拒绝</span>
            </div>
            <div v-if="req.status === 'pending'" class="request-actions">
              <button class="btn-cancel" @click="handleCancel(req)">取消请求</button>
            </div>
          </div>
        </div>

        <!-- New Request Form -->
        <div v-if="activeTab === 'request'" class="request-form">
          <div class="form-item">
            <label>资源类型</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="form.resource_type" value="ppt" />
                <span>📊 演示文稿</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="form.resource_type" value="workspace" />
                <span>👥 工作空间</span>
              </label>
            </div>
          </div>
          <div class="form-item">
            <label>资源ID或链接</label>
            <input
              v-model="form.resource_id"
              class="form-input"
              placeholder="输入PPT或工作空间的ID"
            />
          </div>
          <div class="form-item">
            <label>资源名称 <span class="optional">(可选)</span></label>
            <input
              v-model="form.resource_name"
              class="form-input"
              placeholder="例如：Q1工作汇报"
            />
          </div>
          <div class="form-item">
            <label>请求权限级别</label>
            <div class="permission-options">
              <button
                v-for="perm in permissionOptions"
                :key="perm.value"
                class="perm-btn"
                :class="{ selected: form.permission_requested === perm.value }"
                @click="form.permission_requested = perm.value"
              >
                <span class="perm-icon">{{ perm.icon }}</span>
                <span class="perm-label">{{ perm.label }}</span>
                <span class="perm-desc">{{ perm.desc }}</span>
              </button>
            </div>
          </div>
          <div class="form-item">
            <label>留言 <span class="optional">(可选，向所有者说明你的身份和用途)</span></label>
            <textarea
              v-model="form.message"
              class="form-textarea"
              placeholder="我是市场部的小李，需要查看这份PPT用于下周的客户提案..."
              rows="3"
              maxlength="300"
            ></textarea>
          </div>
          <button
            class="btn-submit"
            @click="submitRequest"
            :disabled="!form.resource_id.trim() || submitting"
          >
            {{ submitting ? '提交中...' : '📤 发送访问请求' }}
          </button>
          <p v-if="submitResult" class="submit-result" :class="submitResult.type">
            {{ submitResult.text }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import api from '../api/client'

const props = defineProps<{ show: boolean }>()
const emit = defineEmits(['close'])

const activeTab = ref('incoming')
const tabs = [
  { key: 'incoming', label: '收到的请求' },
  { key: 'my-requests', label: '我的请求' },
  { key: 'request', label: '发起请求' },
]

const loading = ref(false)
const incomingRequests = ref<any[]>([])
const myRequests = ref<any[]>([])
const pendingCount = ref(0)
const rejectingId = ref('')
const rejectReason = ref('')
const submitting = ref(false)
const submitResult = ref<{ type: string; text: string } | null>(null)

const form = ref({
  resource_type: 'ppt',
  resource_id: '',
  resource_name: '',
  permission_requested: 'view',
  message: '',
})

const permissionOptions = [
  { value: 'view', label: '查看', icon: '👁️', desc: '仅查看PPT内容' },
  { value: 'comment', label: '评论', icon: '💬', desc: '查看 + 添加评论' },
  { value: 'edit', label: '编辑', icon: '✏️', desc: '查看 + 编辑幻灯片' },
  { value: 'download', label: '下载', icon: '📥', desc: '查看 + 导出PPTX' },
]

const AVATAR_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F']

const avatarColor = (email: string): string => {
  let hash = 0
  for (let i = 0; i < (email?.length || 1); i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

const statusText = (status: string): string => {
  const map: Record<string, string> = {
    pending: '待审批',
    approved: '已批准',
    rejected: '已拒绝',
    expired: '已过期',
  }
  return map[status] || status
}

const permissionText = (perm: string): string => {
  const map: Record<string, string> = {
    view: '查看',
    comment: '评论',
    edit: '编辑',
    download: '下载',
    full: '完全访问',
  }
  return map[perm] || perm
}

const formatTime = (iso: string): string => {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

watch(() => props.show, async (val) => {
  if (val) {
    await loadAll()
  }
})

watch(activeTab, () => {
  if (activeTab.value === 'incoming') loadIncoming()
  else if (activeTab.value === 'my-requests') loadMyRequests()
})

const loadAll = async () => {
  await Promise.all([loadIncoming(), loadMyRequests()])
}

const loadIncoming = async () => {
  loading.value = true
  try {
    const res = await api.sharing.listIncomingAccessRequests()
    incomingRequests.value = res.data.requests || []
    pendingCount.value = incomingRequests.value.filter((r: any) => r.status === 'pending').length
  } catch {
    incomingRequests.value = []
  } finally {
    loading.value = false
  }
}

const loadMyRequests = async () => {
  loading.value = true
  try {
    const res = await api.sharing.listMyAccessRequests()
    myRequests.value = res.data.requests || []
  } catch {
    myRequests.value = []
  } finally {
    loading.value = false
  }
}

const handleApprove = async (req: any) => {
  try {
    await api.sharing.approveAccessRequest(req.id)
    req.status = 'approved'
    pendingCount.value = Math.max(0, pendingCount.value - 1)
  } catch {
    // ignore
  }
}

const showRejectForm = (req: any) => {
  rejectingId.value = req.id
  rejectReason.value = ''
}

const cancelReject = () => {
  rejectingId.value = ''
  rejectReason.value = ''
}

const confirmReject = async (req: any) => {
  try {
    await api.sharing.rejectAccessRequest(req.id, rejectReason.value)
    req.status = 'rejected'
    req.reject_reason = rejectReason.value
    pendingCount.value = Math.max(0, pendingCount.value - 1)
  } catch {
    // ignore
  }
  rejectingId.value = ''
  rejectReason.value = ''
}

const handleCancel = async (req: any) => {
  if (!confirm('确定要取消这个请求吗？')) return
  try {
    await api.sharing.deleteAccessRequest(req.id)
    myRequests.value = myRequests.value.filter(r => r.id !== req.id)
  } catch {
    // ignore
  }
}

const submitRequest = async () => {
  if (!form.value.resource_id.trim()) return
  submitting.value = true
  submitResult.value = null
  try {
    await api.sharing.createAccessRequest({ item_id: form.value.resource_id, item_type: form.value.resource_type, message: form.value.message })
    submitResult.value = { type: 'success', text: '✅ 访问请求已发送！所有者审批后你会收到通知。' }
    form.value = { resource_type: 'ppt', resource_id: '', resource_name: '', permission_requested: 'view', message: '' }
    setTimeout(() => {
      activeTab.value = 'my-requests'
      loadMyRequests()
      submitResult.value = null
    }, 1500)
  } catch (e: any) {
    submitResult.value = { type: 'error', text: e?.response?.data?.detail || '❌ 提交失败，请检查资源ID是否正确' }
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.access-modal {
  background: white;
  border-radius: 16px;
  width: 500px;
  max-width: 95vw;
  max-height: 85vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dark, :global(.dark) .access-modal {
  background: #2a2a2a;
}

/* Header */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.dark .modal-header {
  border-color: #333;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.dark .modal-header h3 {
  color: #eee;
}

.close-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 16px;
  border-radius: 6px;
  color: #888;
}

.close-btn:hover {
  background: #f0f0f0;
}

/* Tabs */
.tab-nav {
  display: flex;
  border-bottom: 1px solid #f0f0f0;
  padding: 0 20px;
  flex-shrink: 0;
}

.dark .tab-nav {
  border-color: #333;
}

.tab-btn {
  padding: 12px 16px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  color: #888;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.tab-btn:hover {
  color: #333;
}

.dark .tab-btn {
  color: #aaa;
}

.dark .tab-btn:hover {
  color: #eee;
}

.tab-btn.active {
  color: #165DFF;
  border-bottom-color: #165DFF;
  font-weight: 500;
}

.badge {
  background: #ff4757;
  color: white;
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 10px;
  font-weight: 600;
}

/* Body */
.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
}

/* Requests List */
.requests-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.request-card {
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 14px;
  background: #f8f9fa;
  transition: all 0.15s;
}

.dark .request-card {
  background: #1a1a1a;
  border-color: #333;
}

.request-card.pending {
  border-left: 3px solid #FF9500;
}

.request-card.approved {
  border-left: 3px solid #00C850;
  opacity: 0.8;
}

.request-card.rejected {
  border-left: 3px solid #ff4757;
  opacity: 0.7;
}

.request-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.requester-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.requester-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
}

.requester-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.dark .requester-name {
  color: #eee;
}

.requester-email {
  font-size: 12px;
  color: #888;
}

.resource-icon {
  font-size: 18px;
  margin-right: 6px;
}

.request-status-badge {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 10px;
  font-weight: 500;
}

.request-status-badge.pending {
  background: #FFF3E0;
  color: #FF9500;
}

.dark .request-status-badge.pending {
  background: #3a2a00;
}

.request-status-badge.approved {
  background: #E8F5E9;
  color: #00C850;
}

.dark .request-status-badge.approved {
  background: #0a2a0a;
}

.request-status-badge.rejected {
  background: #FFEBEE;
  color: #ff4757;
}

.dark .request-status-badge.rejected {
  background: #2a0a0a;
}

.request-body {
  margin-left: 46px;
}

.request-resource {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #555;
  margin-bottom: 4px;
}

.dark .request-resource {
  color: #aaa;
}

.resource-name {
  font-weight: 500;
  color: #333;
}

.dark .resource-name {
  color: #eee;
}

.request-permission {
  font-size: 12px;
  color: #888;
  margin-bottom: 6px;
}

.request-message {
  font-size: 12px;
  color: #666;
  font-style: italic;
  background: white;
  padding: 6px 10px;
  border-radius: 6px;
  margin-bottom: 6px;
}

.dark .request-message {
  background: #2a2a2a;
  color: #aaa;
}

.request-time {
  font-size: 11px;
  color: #aaa;
}

.request-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  margin-left: 46px;
}

.btn-approve, .btn-reject, .btn-cancel {
  padding: 7px 16px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  border: none;
}

.btn-approve {
  background: #00C850;
  color: white;
}

.btn-approve:hover {
  background: #00A040;
}

.btn-reject {
  background: #ff4757;
  color: white;
}

.btn-reject:hover {
  background: #cc3a47;
}

.btn-cancel {
  background: #f0f0f0;
  color: #555;
}

.dark .btn-cancel {
  background: #333;
  color: #aaa;
}

.reject-reason {
  font-size: 12px;
  color: #ff4757;
  margin-top: 6px;
  margin-left: 46px;
}

.reject-form {
  margin-top: 10px;
  margin-left: 46px;
}

.reject-form-actions {
  display: flex;
  gap: 8px;
  margin-top: 6px;
}

.btn-confirm-reject {
  padding: 7px 16px;
  border: none;
  background: #ff4757;
  color: white;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
}

/* Form */
.request-form {
  max-width: 100%;
}

.form-item {
  margin-bottom: 16px;
}

.form-item label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #555;
  margin-bottom: 6px;
}

.dark .form-item label {
  color: #aaa;
}

.optional {
  font-weight: 400;
  color: #999;
  font-size: 12px;
}

.form-input, .form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
  box-sizing: border-box;
}

.dark .form-input, .dark .form-textarea {
  background: #1a1a1a;
  border-color: #444;
  color: #fff;
}

.form-textarea {
  resize: vertical;
  min-height: 70px;
}

.radio-group {
  display: flex;
  gap: 12px;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 13px;
  color: #333;
}

.dark .radio-label {
  color: #eee;
}

.permission-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.perm-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  background: white;
  border-radius: 10px;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s;
}

.dark .perm-btn {
  background: #1a1a1a;
  border-color: #333;
}

.perm-btn.selected {
  border-color: #165DFF;
  background: #f0f7ff;
}

.dark .perm-btn.selected {
  background: #1a2a4a;
}

.perm-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.perm-label {
  font-size: 13px;
  font-weight: 500;
  color: #333;
  flex: 1;
}

.dark .perm-label {
  color: #eee;
}

.perm-desc {
  font-size: 11px;
  color: #888;
}

.btn-submit {
  width: 100%;
  padding: 12px;
  border: none;
  background: #165DFF;
  color: white;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
}

.btn-submit:hover:not(:disabled) {
  background: #0d47e6;
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.submit-result {
  text-align: center;
  font-size: 13px;
  margin-top: 8px;
  padding: 8px;
  border-radius: 8px;
}

.submit-result.success {
  background: #E8F5E9;
  color: #00C850;
}

.submit-result.error {
  background: #FFEBEE;
  color: #ff4757;
}

.dark .submit-result.success {
  background: #0a2a0a;
}

.dark .submit-result.error {
  background: #2a0a0a;
}

/* Empty/Loading */
.empty-state {
  text-align: center;
  padding: 32px 16px;
  color: #888;
}

.empty-icon {
  font-size: 40px;
  display: block;
  margin-bottom: 8px;
}

.empty-state p {
  margin: 0 0 12px;
  font-size: 13px;
}

.btn-create-request {
  padding: 8px 16px;
  border: 1px solid #165DFF;
  background: transparent;
  color: #165DFF;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
}

.loading-state {
  text-align: center;
  padding: 24px;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #e0e0e0;
  border-top-color: #165DFF;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
