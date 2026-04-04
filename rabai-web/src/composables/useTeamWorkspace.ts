// Team Workspace composable - 团队工作空间功能
import { ref, computed } from 'vue'

export interface WorkspaceMember {
  id: string
  name: string
  avatar: string
  email: string
  role: 'owner' | 'editor' | 'viewer' | 'commenter'
  joinedAt: string
  lastActiveAt: string
  status: 'online' | 'away' | 'offline'
  color: string // 协作者光标颜色
}

export interface WorkspaceInvitation {
  id: string
  email: string
  role: 'editor' | 'viewer' | 'commenter'
  invitedBy: string
  invitedAt: string
  status: 'pending' | 'accepted' | 'declined'
  expiresAt: string
}

export interface Workspace {
  id: string
  name: string
  description: string
  ownerId: string
  members: WorkspaceMember[]
  invitations: WorkspaceInvitation[]
  pptId: string
  createdAt: string
  updatedAt: string
  isPublic: boolean
}

// 头像颜色池
const AVATAR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
]

const getAvatarColor = (name: string): string => {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export function useTeamWorkspace(pptId?: string) {
  const workspace = ref<Workspace | null>(null)
  const isLoading = ref(false)
  const isJoining = ref(false)

  // 模拟当前用户
  const currentUser: WorkspaceMember = {
    id: 'u_current',
    name: '我',
    avatar: '',
    email: 'me@example.com',
    role: 'owner',
    joinedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    status: 'online',
    color: '#165DFF'
  }

  // 初始化工作空间
  const initWorkspace = (id?: string) => {
    const saved = localStorage.getItem(`workspace_${id || pptId || 'default'}`)
    if (saved) {
      workspace.value = JSON.parse(saved)
      // 确保当前用户在成员列表中
      if (!workspace.value?.members.find(m => m.id === currentUser.id)) {
        workspace.value?.members.unshift(currentUser)
      }
    } else {
      workspace.value = {
        id: `ws_${Date.now()}`,
        name: '我的演示文稿',
        description: '',
        ownerId: currentUser.id,
        members: [currentUser],
        invitations: [],
        pptId: id || pptId || 'default',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPublic: false
      }
    }
    saveWorkspace()
  }

  // 保存工作空间
  const saveWorkspace = () => {
    if (!workspace.value) return
    try {
      localStorage.setItem(`workspace_${workspace.value.pptId}`, JSON.stringify(workspace.value))
    } catch {
      // ignore
    }
  }

  // 邀请成员
  const inviteMember = async (email: string, role: 'editor' | 'viewer' | 'commenter'): Promise<WorkspaceInvitation | null> => {
    isLoading.value = true
    try {
      // 模拟API调用
      await new Promise(r => setTimeout(r, 300))

      const invitation: WorkspaceInvitation = {
        id: `inv_${Date.now()}`,
        email,
        role,
        invitedBy: currentUser.id,
        invitedAt: new Date().toISOString(),
        status: 'pending',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }

      workspace.value?.invitations.push(invitation)
      workspace.value && (workspace.value.updatedAt = new Date().toISOString())
      saveWorkspace()
      return invitation
    } finally {
      isLoading.value = false
    }
  }

  // 取消邀请
  const cancelInvitation = (invitationId: string) => {
    if (!workspace.value) return
    workspace.value.invitations = workspace.value.invitations.filter(i => i.id !== invitationId)
    workspace.value.updatedAt = new Date().toISOString()
    saveWorkspace()
  }

  // 移除成员
  const removeMember = (memberId: string): boolean => {
    if (!workspace.value) return false
    const member = workspace.value.members.find(m => m.id === memberId)
    if (!member || member.role === 'owner') return false

    workspace.value.members = workspace.value.members.filter(m => m.id !== memberId)
    workspace.value.updatedAt = new Date().toISOString()
    saveWorkspace()
    return true
  }

  // 更新成员角色
  const updateMemberRole = (memberId: string, role: 'editor' | 'viewer' | 'commenter'): boolean => {
    if (!workspace.value) return false
    const member = workspace.value.members.find(m => m.id === memberId)
    if (!member || member.role === 'owner') return false

    member.role = role
    workspace.value && (workspace.value.updatedAt = new Date().toISOString())
    saveWorkspace()
    return true
  }

  // 接受邀请（模拟）
  const acceptInvitation = async (invitationId: string): Promise<boolean> => {
    isJoining.value = true
    try {
      await new Promise(r => setTimeout(r, 500))

      const invitation = workspace.value?.invitations.find(i => i.id === invitationId)
      if (!invitation || invitation.status !== 'pending') return false

      invitation.status = 'accepted'

      const newMember: WorkspaceMember = {
        id: `u_${Date.now()}`,
        name: invitation.email.split('@')[0],
        avatar: '',
        email: invitation.email,
        role: invitation.role,
        joinedAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        status: 'online',
        color: getAvatarColor(invitation.email)
      }

      workspace.value?.members.push(newMember)
      workspace.value && (workspace.value.updatedAt = new Date().toISOString())
      saveWorkspace()
      return true
    } finally {
      isJoining.value = false
    }
  }

  // 切换公开/私有
  const togglePublic = () => {
    if (!workspace.value) return
    workspace.value.isPublic = !workspace.value.isPublic
    workspace.value.updatedAt = new Date().toISOString()
    saveWorkspace()
  }

  // 获取在线成员
  const onlineMembers = computed(() => {
    return workspace.value?.members.filter(m => m.status === 'online' && m.id !== currentUser.id) || []
  })

  // 获取所有成员
  const allMembers = computed(() => workspace.value?.members || [])

  // 初始化
  initWorkspace(pptId)

  return {
    workspace,
    isLoading,
    isJoining,
    currentUser,
    onlineMembers,
    allMembers,
    inviteMember,
    cancelInvitation,
    removeMember,
    updateMemberRole,
    acceptInvitation,
    togglePublic,
    initWorkspace,
    saveWorkspace
  }
}

export default useTeamWorkspace
