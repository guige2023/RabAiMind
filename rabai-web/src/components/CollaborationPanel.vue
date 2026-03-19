<template>
  <div class="collaboration-panel">
    <!-- 协作状态 -->
    <div class="collab-status" v-if="collaborators.length > 0">
      <div class="status-indicator" :class="{ active: isCollaborating }"></div>
      <span class="status-text">{{ isCollaborating ? '协作中' : '私有' }}</span>
    </div>

    <!-- 协作者列表 -->
    <div class="collaborators-section">
      <h3 class="section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        协作者
      </h3>

      <div class="collaborators-list">
        <div
          v-for="collaborator in collaborators"
          :key="collaborator.id"
          class="collaborator-item"
        >
          <div class="collaborator-avatar">
            {{ collaborator.name.charAt(0) }}
          </div>
          <div class="collaborator-info">
            <span class="collaborator-name">{{ collaborator.name }}</span>
            <span class="collaborator-role">{{ getRoleText(collaborator.role) }}</span>
          </div>
          <button
            v-if="collaborator.role !== 'owner'"
            class="remove-btn"
            @click="handleRemove(collaborator.id)"
            title="移除"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- 添加协作者 -->
      <div class="add-collaborator">
        <input
          v-model="newEmail"
          type="email"
          placeholder="输入邮箱添加协作者"
          class="email-input"
          @keyup.enter="handleAddCollaborator"
        />
        <select v-model="newRole" class="role-select">
          <option value="viewer">可查看</option>
          <option value="editor">可编辑</option>
        </select>
        <button class="add-btn" @click="handleAddCollaborator">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 5v14M5 12h14"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 分享链接 -->
    <div class="share-section">
      <h3 class="section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
          <polyline points="16 6 12 2 8 6"/>
          <line x1="12" y1="2" x2="12" y2="15"/>
        </svg>
        分享链接
      </h3>

      <div class="share-links">
        <div
          v-for="link in validShareLinks"
          :key="link.id"
          class="share-link-item"
        >
          <div class="link-info">
            <span class="link-role">{{ link.role === 'editor' ? '可编辑' : '可查看' }}</span>
            <span v-if="link.expiresAt" class="link-expires">
              有效期至 {{ formatDate(link.expiresAt) }}
            </span>
          </div>
          <div class="link-actions">
            <button class="action-btn" @click="handleCopyLink(link.id)" title="复制链接">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
            </button>
            <button class="action-btn delete" @click="handleDeleteLink(link.id)" title="删除链接">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- 创建新链接 -->
      <div class="create-link">
        <button class="create-btn" @click="showCreateLink = !showCreateLink">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          创建分享链接
        </button>

        <div v-if="showCreateLink" class="create-options">
          <div class="option-group">
            <label>权限</label>
            <select v-model="newLinkRole">
              <option value="viewer">可查看</option>
              <option value="editor">可编辑</option>
            </select>
          </div>
          <div class="option-group">
            <label>有效期</label>
            <select v-model="newLinkExpiry">
              <option :value="undefined">永久有效</option>
              <option :value="1">1天</option>
              <option :value="7">7天</option>
              <option :value="30">30天</option>
            </select>
          </div>
          <button class="confirm-btn" @click="handleCreateLink">
            生成链接
          </button>
        </div>
      </div>
    </div>

    <!-- 同步状态 -->
    <div class="sync-section">
      <h3 class="section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <polyline points="23 4 23 10 17 10"/>
          <polyline points="1 20 1 14 7 14"/>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
        </svg>
        云同步
      </h3>

      <div class="sync-status">
        <div class="sync-info">
          <span class="sync-indicator" :style="{ background: syncStatusColor }"></span>
          <span class="sync-text">{{ syncStatusText }}</span>
        </div>
        <button
          v-if="!syncStatus.isSyncing"
          class="sync-btn"
          @click="handleSync"
          title="立即同步"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="23 4 23 10 17 10"/>
            <polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
        </button>
        <div v-else class="syncing-spinner"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCollaboration } from '../composables/useCollaboration'
import { useCloudSync } from '../composables/useCloudSync'

const documentId = ref('current-doc')

// 协作功能
const {
  collaborators,
  isCollaborating,
  validShareLinks,
  createShareLink,
  deleteShareLink,
  copyShareLink,
  addCollaborator,
  removeCollaborator
} = useCollaboration(documentId.value)

// 云同步功能
const {
  syncStatus,
  syncStatusText,
  syncStatusColor,
  syncToCloud
} = useCloudSync()

// 本地状态
const newEmail = ref('')
const newRole = ref<'editor' | 'viewer'>('viewer')
const showCreateLink = ref(false)
const newLinkRole = ref<'editor' | 'viewer'>('viewer')
const newLinkExpiry = ref<number | undefined>(7)

// 方法
const getRoleText = (role: string) => {
  const map: Record<string, string> = {
    owner: '所有者',
    editor: '可编辑',
    viewer: '可查看'
  }
  return map[role] || role
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

const handleAddCollaborator = () => {
  if (!newEmail.value) return
  const result = addCollaborator(newEmail.value, newRole.value)
  if (result) {
    newEmail.value = ''
  }
}

const handleRemove = (userId: string) => {
  removeCollaborator(userId)
}

const handleCopyLink = async (linkId: string) => {
  await copyShareLink(linkId)
}

const handleDeleteLink = (linkId: string) => {
  deleteShareLink(linkId)
}

const handleCreateLink = () => {
  createShareLink(newLinkRole.value, {
    expiresInDays: newLinkExpiry.value
  })
  showCreateLink.value = false
}

const handleSync = () => {
  syncToCloud()
}
</script>

<style scoped>
.collaboration-panel {
  background: white;
  border-radius: 16px;
  padding: 20px;
  max-width: 400px;
}

:global(.dark) .collaboration-panel {
  background: #1a1a1a;
}

/* Status */
.collab-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 10px;
  margin-bottom: 20px;
}

:global(.dark) .collab-status {
  background: #2a2a2a;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ccc;
}

.status-indicator.active {
  background: #00C850;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.status-text {
  font-size: 14px;
  color: #333;
}

:global(.dark) .status-text {
  color: #fff;
}

/* Section */
.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

:global(.dark) .section-title {
  color: #fff;
}

.section-title svg {
  width: 18px;
  height: 18px;
  color: #666;
}

.collaborators-section,
.share-section,
.sync-section {
  margin-bottom: 24px;
}

/* Collaborators */
.collaborators-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.collaborator-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 10px;
}

:global(.dark) .collaborator-item {
  background: #2a2a2a;
}

.collaborator-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.collaborator-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.collaborator-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

:global(.dark) .collaborator-name {
  color: #fff;
}

.collaborator-role {
  font-size: 12px;
  color: #888;
}

.remove-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-btn:hover {
  background: #fee;
}

.remove-btn svg {
  width: 16px;
  height: 16px;
  color: #999;
}

/* Add Collaborator */
.add-collaborator {
  display: flex;
  gap: 8px;
}

.email-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 13px;
}

:global(.dark) .email-input {
  background: #2a2a2a;
  border-color: #444;
  color: #fff;
}

.role-select {
  padding: 8px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 13px;
  background: white;
}

:global(.dark) .role-select {
  background: #2a2a2a;
  border-color: #444;
  color: #fff;
}

.add-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: #165DFF;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-btn svg {
  width: 18px;
  height: 18px;
  color: white;
}

/* Share Links */
.share-links {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.share-link-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

:global(.dark) .share-link-item {
  background: #2a2a2a;
}

.link-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.link-role {
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

:global(.dark) .link-role {
  color: #fff;
}

.link-expires {
  font-size: 11px;
  color: #888;
}

.link-actions {
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
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background: #e8e8e8;
}

.action-btn.delete:hover {
  background: #fee;
}

.action-btn svg {
  width: 14px;
  height: 14px;
  color: #666;
}

.action-btn.delete svg {
  color: #ff4757;
}

/* Create Link */
.create-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 10px;
  border: 1px dashed #ccc;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: all 0.2s;
}

.create-btn:hover {
  border-color: #165DFF;
  color: #165DFF;
}

.create-btn svg {
  width: 16px;
  height: 16px;
}

.create-options {
  margin-top: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

:global(.dark) .create-options {
  background: #2a2a2a;
}

.option-group {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.option-group label {
  font-size: 13px;
  color: #666;
}

.option-group select {
  padding: 6px 10px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 13px;
}

:global(.dark) .option-group select {
  background: #1a1a1a;
  border-color: #444;
  color: #fff;
}

.confirm-btn {
  width: 100%;
  padding: 10px;
  border: none;
  background: #165DFF;
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.confirm-btn:hover {
  background: #0d47e6;
}

/* Sync */
.sync-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 10px;
}

:global(.dark) .sync-status {
  background: #2a2a2a;
}

.sync-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sync-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.sync-text {
  font-size: 13px;
  color: #666;
}

.sync-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

:global(.dark) .sync-btn {
  background: #333;
}

.sync-btn:hover {
  background: #f5f5f5;
}

:global(.dark) .sync-btn:hover {
  background: #444;
}

.sync-btn svg {
  width: 16px;
  height: 16px;
  color: #666;
}

.syncing-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #e0e0e0;
  border-top-color: #165DFF;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
