<template>
  <div class="team-workspace-panel">
    <!-- 头部 -->
    <div class="panel-header">
      <div class="header-title">
        <span class="title-icon">👥</span>
        <span>团队工作空间</span>
      </div>
      <div class="header-actions">
        <button class="action-btn" @click="showInvite = !showInvite" title="邀请成员">
          +
        </button>
      </div>
    </div>

    <!-- 邀请表单 -->
    <div v-if="showInvite" class="invite-section">
      <div class="invite-form">
        <input
          v-model="inviteEmail"
          type="email"
          placeholder="输入邮箱地址"
          class="invite-input"
          @keyup.enter="handleInvite"
        />
        <select v-model="inviteRole" class="invite-role">
          <option value="editor">可编辑</option>
          <option value="viewer">可查看</option>
          <option value="commenter">可评论</option>
        </select>
        <button class="invite-btn" @click="handleInvite" :disabled="!inviteEmail.trim()">
          邀请
        </button>
      </div>
    </div>

    <!-- 在线成员 -->
    <div class="members-section" v-if="onlineMembers.length > 0">
      <div class="section-label">
        <span class="online-dot"></span>
        在线成员 ({{ onlineMembers.length }})
      </div>
      <div class="members-list">
        <div
          v-for="member in onlineMembers"
          :key="member.id"
          class="member-item online"
        >
          <div class="member-avatar" :style="{ background: member.color }">
            {{ member.name.charAt(0) }}
          </div>
          <div class="member-info">
            <span class="member-name">{{ member.name }}</span>
            <span class="member-status">在线</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 所有成员 -->
    <div class="members-section">
      <div class="section-label">所有成员 ({{ allMembers.length }})</div>
      <div class="members-list">
        <div
          v-for="member in allMembers"
          :key="member.id"
          class="member-item"
        >
          <div class="member-avatar" :style="{ background: member.color }">
            {{ member.name.charAt(0) }}
          </div>
          <div class="member-info">
            <span class="member-name">{{ member.name }}</span>
            <span class="member-role">{{ getRoleText(member.role) }}</span>
          </div>
          <div class="member-actions">
            <select
              v-if="member.role !== 'owner'"
              v-model="member.role"
              class="role-select"
              @change="handleRoleChange(member.id, member.role)"
            >
              <option value="editor">可编辑</option>
              <option value="viewer">可查看</option>
              <option value="commenter">可评论</option>
            </select>
            <button
              v-if="member.role !== 'owner'"
              class="remove-btn"
              @click="handleRemove(member.id)"
              title="移除"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 待处理邀请 -->
    <div class="invitations-section" v-if="workspace?.invitations.length">
      <div class="section-label">待处理邀请 ({{ workspace.invitations.length }})</div>
      <div class="invitations-list">
        <div v-for="inv in workspace.invitations.filter(i => i.status === 'pending')" :key="inv.id" class="invitation-item">
          <div class="inv-email">{{ inv.email }}</div>
          <div class="inv-role">{{ getRoleText(inv.role) }}</div>
          <button class="cancel-invite-btn" @click="handleCancelInvite(inv.id)">取消</button>
        </div>
      </div>
    </div>

    <!-- 工作空间设置 -->
    <div class="settings-section">
      <div class="section-label">设置</div>
      <div class="setting-item">
        <span class="setting-label">公开工作空间</span>
        <label class="toggle">
          <input type="checkbox" :checked="workspace?.isPublic" @change="handleTogglePublic" />
          <span class="toggle-slider"></span>
        </label>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="panel-footer">
      <button class="share-btn" @click="handleShareEmail">
        <span>📧</span> 邮件分享
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTeamWorkspace } from '../composables/useTeamWorkspace'

const props = defineProps<{
  pptId?: string
}>()

const {
  workspace,
  onlineMembers,
  allMembers,
  inviteMember,
  cancelInvitation,
  removeMember,
  updateMemberRole,
  togglePublic
} = useTeamWorkspace(props.pptId)

const showInvite = ref(false)
const inviteEmail = ref('')
const inviteRole = ref<'editor' | 'viewer' | 'commenter'>('editor')

const getRoleText = (role: string): string => {
  const map: Record<string, string> = {
    owner: '所有者',
    editor: '可编辑',
    viewer: '可查看',
    commenter: '可评论'
  }
  return map[role] || role
}

const handleInvite = async () => {
  if (!inviteEmail.value.trim()) return
  await inviteMember(inviteEmail.value, inviteRole.value)
  inviteEmail.value = ''
  showInvite.value = false
}

const handleCancelInvite = (invitationId: string) => {
  cancelInvitation(invitationId)
}

const handleRemove = (memberId: string) => {
  if (confirm('确定要移除该成员吗？')) {
    removeMember(memberId)
  }
}

const handleRoleChange = (memberId: string, role: string) => {
  updateMemberRole(memberId, role as 'editor' | 'viewer' | 'commenter')
}

const handleTogglePublic = () => {
  togglePublic()
}

const handleShareEmail = () => {
  const subject = encodeURIComponent('来看看我的演示文稿')
  const body = encodeURIComponent(`邀请你查看我的演示文稿:\n${window.location.href}`)
  window.open(`mailto:?subject=${subject}&body=${body}`, '_blank')
}
</script>

<style scoped>
.team-workspace-panel {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  max-width: 380px;
  max-height: 600px;
  display: flex;
  flex-direction: column;
}

:global(.dark) .team-workspace-panel {
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
  font-size: 18px;
}

.action-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: #165DFF;
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background: #0d47e6;
}

/* Invite */
.invite-section {
  padding: 12px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #f0f0f0;
}

:global(.dark) .invite-section {
  background: #2a2a2a;
  border-color: #333;
}

.invite-form {
  display: flex;
  gap: 8px;
}

.invite-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 13px;
}

:global(.dark) .invite-input {
  background: #1a1a1a;
  border-color: #444;
  color: #fff;
}

.invite-role {
  padding: 8px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 13px;
  background: white;
  color: #333;
}

:global(.dark) .invite-role {
  background: #1a1a1a;
  border-color: #444;
  color: #fff;
}

.invite-btn {
  padding: 8px 16px;
  border: none;
  background: #165DFF;
  color: white;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
}

.invite-btn:hover {
  background: #0d47e6;
}

.invite-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Members */
.members-section {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

:global(.dark) .members-section {
  border-color: #333;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #888;
  margin-bottom: 8px;
}

.online-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #00C850;
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 8px;
}

:global(.dark) .member-item {
  background: #2a2a2a;
}

.member-item.online {
  border-left: 3px solid #00C850;
}

.member-avatar {
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

.member-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.member-name {
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

:global(.dark) .member-name {
  color: #eee;
}

.member-role {
  font-size: 11px;
  color: #888;
}

.member-status {
  font-size: 11px;
  color: #00C850;
}

.member-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.role-select {
  padding: 4px 6px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 11px;
  background: white;
  color: #333;
}

:global(.dark) .role-select {
  background: #1a1a1a;
  border-color: #444;
  color: #fff;
}

.remove-btn {
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: #ff4757;
  cursor: pointer;
  font-size: 16px;
  border-radius: 4px;
}

.remove-btn:hover {
  background: #fee;
}

/* Invitations */
.invitations-section {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

:global(.dark) .invitations-section {
  border-color: #333;
}

.invitations-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.invitation-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 8px;
  font-size: 12px;
}

:global(.dark) .invitation-item {
  background: #2a2a2a;
}

.inv-email {
  flex: 1;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:global(.dark) .inv-email {
  color: #eee;
}

.inv-role {
  color: #888;
  font-size: 11px;
}

.cancel-invite-btn {
  border: none;
  background: transparent;
  color: #ff4757;
  cursor: pointer;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
}

.cancel-invite-btn:hover {
  background: #fee;
}

/* Settings */
.settings-section {
  padding: 12px 16px;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
}

.setting-label {
  font-size: 13px;
  color: #555;
}

:global(.dark) .setting-label {
  color: #bbb;
}

/* Toggle */
.toggle {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 22px;
}

.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background: #ccc;
  border-radius: 22px;
  transition: 0.2s;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  height: 16px;
  width: 16px;
  left: 3px;
  bottom: 3px;
  background: white;
  border-radius: 50%;
  transition: 0.2s;
}

.toggle input:checked + .toggle-slider {
  background: #165DFF;
}

.toggle input:checked + .toggle-slider::before {
  transform: translateX(18px);
}

/* Footer */
.panel-footer {
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
}

:global(.dark) .panel-footer {
  border-color: #333;
}

.share-btn {
  width: 100%;
  padding: 10px;
  border: none;
  background: #f0f7ff;
  color: #165DFF;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.share-btn:hover {
  background: #e0eeff;
}
</style>
