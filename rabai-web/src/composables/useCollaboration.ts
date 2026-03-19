// Collaboration composable - 协作功能
import { ref, computed, watch } from 'vue'

export interface Collaborator {
  id: string
  name: string
  avatar: string
  role: 'owner' | 'editor' | 'viewer'
  email: string
  joinedAt: string
}

export interface ShareLink {
  id: string
  url: string
  role: 'editor' | 'viewer'
  expiresAt: string | null
  password: string | null
  createdAt: string
  visitCount: number
}

export interface CollaborationState {
  isCollaborating: boolean
  collaborators: Collaborator[]
  shareLinks: ShareLink[]
  currentUserId: string | null
}

// 生成邀请链接
const generateShareLink = (
  docId: string,
  role: 'editor' | 'viewer',
  expiresInDays?: number,
  password?: string
): ShareLink => {
  const id = Math.random().toString(36).substring(2, 15)
  const baseUrl = window.location.origin
  const token = btoa(`${docId}:${role}:${Date.now()}`)

  return {
    id,
    url: `${baseUrl}/shared/${token}`,
    role,
    expiresAt: expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null,
    password: password || null,
    createdAt: new Date().toISOString(),
    visitCount: 0
  }
}

// 模拟协作者数据
const mockCollaborators: Collaborator[] = [
  {
    id: 'u1',
    name: '张三',
    avatar: '',
    role: 'owner',
    email: 'zhangsan@example.com',
    joinedAt: '2024-01-01'
  }
]

export function useCollaboration(documentId?: string) {
  const docId = ref(documentId || 'default')
  const isLoading = ref(false)
  const isCollaborating = ref(false)
  const collaborators = ref<Collaborator[]>([])
  const shareLinks = ref<ShareLink[]>([])
  const currentUserId = ref<string | null>(null)

  // 从本地存储加载协作数据
  const loadCollaboration = () => {
    try {
      const saved = localStorage.getItem(`collab_${docId.value}`)
      if (saved) {
        const data = JSON.parse(saved) as CollaborationState
        collaborators.value = data.collaborators || []
        shareLinks.value = data.shareLinks || []
        isCollaborating.value = data.isCollaborating
      }
    } catch {
      // 忽略错误
    }

    // 如果没有数据，使用默认协作者
    if (collaborators.value.length === 0) {
      collaborators.value = [...mockCollaborators]
    }
  }

  // 保存协作数据到本地存储
  const saveCollaboration = () => {
    try {
      const data: CollaborationState = {
        isCollaborating: isCollaborating.value,
        collaborators: collaborators.value,
        shareLinks: shareLinks.value,
        currentUserId: currentUserId.value
      }
      localStorage.setItem(`collab_${docId.value}`, JSON.stringify(data))
    } catch {
      // 忽略错误
    }
  }

  // 创建分享链接
  const createShareLink = (
    role: 'editor' | 'viewer',
    options?: {
      expiresInDays?: number
      password?: string
    }
  ): ShareLink => {
    const link = generateShareLink(docId.value, role, options?.expiresInDays, options?.password)
    shareLinks.value.push(link)
    saveCollaboration()
    return link
  }

  // 删除分享链接
  const deleteShareLink = (linkId: string) => {
    shareLinks.value = shareLinks.value.filter(l => l.id !== linkId)
    saveCollaboration()
  }

  // 复制分享链接
  const copyShareLink = async (linkId: string): Promise<boolean> => {
    const link = shareLinks.value.find(l => l.id === linkId)
    if (!link) return false

    try {
      await navigator.clipboard.writeText(link.url)
      return true
    } catch {
      return false
    }
  }

  // 添加协作者
  const addCollaborator = (email: string, role: 'editor' | 'viewer'): Collaborator | null => {
    // 模拟添加协作者
    const newCollaborator: Collaborator = {
      id: `u${Date.now()}`,
      name: email.split('@')[0],
      avatar: '',
      role,
      email,
      joinedAt: new Date().toISOString().split('T')[0]
    }

    // 检查是否已存在
    if (collaborators.value.some(c => c.email === email)) {
      return null
    }

    collaborators.value.push(newCollaborator)
    isCollaborating.value = true
    saveCollaboration()
    return newCollaborator
  }

  // 移除协作者
  const removeCollaborator = (userId: string) => {
    const collaborator = collaborators.value.find(c => c.id === userId)
    if (collaborator?.role === 'owner') {
      return false // 不能移除所有者
    }

    collaborators.value = collaborators.value.filter(c => c.id !== userId)
    saveCollaboration()
    return true
  }

  // 更新协作者权限
  const updateCollaboratorRole = (userId: string, role: 'editor' | 'viewer') => {
    const collaborator = collaborators.value.find(c => c.id === userId)
    if (collaborator && collaborator.role !== 'owner') {
      collaborator.role = role
      saveCollaboration()
      return true
    }
    return false
  }

  // 获取有效链接
  const validShareLinks = computed(() => {
    const now = new Date()
    return shareLinks.value.filter(link => {
      if (link.expiresAt && new Date(link.expiresAt) < now) {
        return false
      }
      return true
    })
  })

  // 检查链接是否有效
  const validateShareLink = (url: string): { valid: boolean; role?: 'editor' | 'viewer' } => {
    const link = shareLinks.value.find(l => l.url === url)
    if (!link) return { valid: false }

    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return { valid: false }
    }

    return { valid: true, role: link.role }
  }

  // 导出协作数据
  const exportCollaborationData = () => {
    return {
      documentId: docId.value,
      collaborators: collaborators.value,
      shareLinks: shareLinks.value,
      exportedAt: new Date().toISOString()
    }
  }

  // 初始化
  loadCollaboration()

  return {
    docId,
    isLoading,
    isCollaborating,
    collaborators,
    shareLinks,
    validShareLinks,
    currentUserId,
    createShareLink,
    deleteShareLink,
    copyShareLink,
    addCollaborator,
    removeCollaborator,
    updateCollaboratorRole,
    validateShareLink,
    exportCollaborationData,
    loadCollaboration,
    saveCollaboration
  }
}

export default useCollaboration
