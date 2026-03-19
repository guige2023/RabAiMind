// Collaborative Editing - 协作编辑功能
import { ref, computed, reactive } from 'vue'

export interface User {
  id: string
  name: string
  email: string
  avatar: string
  color: string
  role: 'owner' | 'editor' | 'viewer'
  status: 'online' | 'away' | 'offline'
  lastActive: number
}

export interface Cursor {
  userId: string
  userName: string
  color: string
  x: number
  y: number
  slideId: string
}

export interface Comment {
  id: string
  userId: string
  userName: string
  userAvatar: string
  content: string
  slideId: string
  elementId?: string
  position: { x: number; y: number }
  createdAt: number
  resolved: boolean
  replies: CommentReply[]
}

export interface CommentReply {
  id: string
  userId: string
  userName: string
  userAvatar: string
  content: string
  createdAt: number
}

export interface EditOperation {
  id: string
  userId: string
  type: 'add' | 'delete' | 'update' | 'move' | 'resize'
  targetId: string
  targetType: 'slide' | 'element'
  previousValue: any
  newValue: any
  timestamp: number
}

export interface PresenceState {
  users: User[]
  cursors: Cursor[]
  activeSlideId: string
  selectedElements: string[]
}

export interface CollaboratorSettings {
  autoSave: boolean
  syncFrequency: number
  conflictResolution: 'last-write-wins' | 'merge' | 'manual'
  showCursors: boolean
  showUserAvatars: boolean
  enableComments: boolean
  enableRealTimeTyping: boolean
}

export function useCollaborativeEdit() {
  // 当前用户
  const currentUser = ref<User>({
    id: 'user_1',
    name: '当前用户',
    email: 'user@example.com',
    avatar: '',
    color: '#3b82f6',
    role: 'owner',
    status: 'online',
    lastActive: Date.now()
  })

  // 协作者列表
  const collaborators = ref<User[]>([])

  // 光标位置
  const cursors = ref<Cursor[]>([])

  // 评论列表
  const comments = ref<Comment[]>([])

  // 编辑历史
  const editHistory = ref<EditOperation[]>([])

  // 当前选中的幻灯片
  const activeSlideId = ref<string>('')

  // 选中的元素
  const selectedElements = ref<string[]>([])

  // 协作设置
  const settings = reactive<CollaboratorSettings>({
    autoSave: true,
    syncFrequency: 1000,
    conflictResolution: 'last-write-wins',
    showCursors: true,
    showUserAvatars: true,
    enableComments: true,
    enableRealTimeTyping: true
  })

  // 连接状态
  const connectionState = ref<'connected' | 'connecting' | 'disconnected' | 'error'>('disconnected')

  // 同步状态
  const syncState = ref<'idle' | 'syncing' | 'synced' | 'error'>('idle')

  // 待处理操作
  const pendingOperations = ref<EditOperation[]>([])

  // 初始化示例协作者
  const initSampleCollaborators = () => {
    collaborators.value = [
      {
        id: 'user_2',
        name: '张三',
        email: 'zhangsan@example.com',
        avatar: '',
        color: '#ef4444',
        role: 'editor',
        status: 'online',
        lastActive: Date.now() - 30000
      },
      {
        id: 'user_3',
        name: '李四',
        email: 'lisi@example.com',
        avatar: '',
        color: '#10b981',
        role: 'editor',
        status: 'away',
        lastActive: Date.now() - 120000
      },
      {
        id: 'user_4',
        name: '王五',
        email: 'wangwu@example.com',
        avatar: '',
        color: '#f59e0b',
        role: 'viewer',
        status: 'offline',
        lastActive: Date.now() - 3600000
      }
    ]

    // 初始化示例评论
    comments.value = [
      {
        id: 'comment_1',
        userId: 'user_2',
        userName: '张三',
        userAvatar: '',
        content: '这个标题可以更大一些',
        slideId: 'slide_1',
        elementId: 'el_title',
        position: { x: 100, y: 50 },
        createdAt: Date.now() - 600000,
        resolved: false,
        replies: [
          {
            id: 'reply_1',
            userId: 'user_1',
            userName: '当前用户',
            userAvatar: '',
            content: '好的，我调整一下',
            createdAt: Date.now() - 300000
          }
        ]
      },
      {
        id: 'comment_2',
        userId: 'user_3',
        userName: '李四',
        userAvatar: '',
        content: '建议使用更活泼的配色',
        slideId: 'slide_2',
        position: { x: 200, y: 150 },
        createdAt: Date.now() - 1800000,
        resolved: true,
        replies: []
      }
    ]

    // 初始化示例光标
    cursors.value = [
      {
        userId: 'user_2',
        userName: '张三',
        color: '#ef4444',
        x: 450,
        y: 320,
        slideId: 'slide_1'
      }
    ]
  }

  // 连接协作房间
  const connect = async (roomId: string): Promise<boolean> => {
    connectionState.value = 'connecting'

    try {
      // 模拟连接
      await new Promise(r => setTimeout(r, 500))

      connectionState.value = 'connected'
      initSampleCollaborators()

      return true
    } catch {
      connectionState.value = 'error'
      return false
    }
  }

  // 断开连接
  const disconnect = () => {
    connectionState.value = 'disconnected'
    collaborators.value = []
    cursors.value = []
  }

  // 更新用户状态
  const updateUserStatus = (status: User['status']) => {
    currentUser.value.status = status
    currentUser.value.lastActive = Date.now()
  }

  // 更新光标位置
  const updateCursor = (x: number, y: number, slideId: string) => {
    const cursor: Cursor = {
      userId: currentUser.value.id,
      userName: currentUser.value.name,
      color: currentUser.value.color,
      x,
      y,
      slideId
    }

    const existingIndex = cursors.value.findIndex(c => c.userId === currentUser.value.id)
    if (existingIndex > -1) {
      cursors.value[existingIndex] = cursor
    } else {
      cursors.value.push(cursor)
    }
  }

  // 切换幻灯片
  const setActiveSlide = (slideId: string) => {
    activeSlideId.value = slideId
  }

  // 切换选中的元素
  const setSelectedElements = (elementIds: string[]) => {
    selectedElements.value = elementIds
  }

  // 记录操作
  const recordOperation = (operation: Omit<EditOperation, 'id' | 'userId' | 'timestamp'>) => {
    const newOperation: EditOperation = {
      ...operation,
      id: `op_${Date.now()}`,
      userId: currentUser.value.id,
      timestamp: Date.now()
    }

    editHistory.value.push(newOperation)

    // 添加到待同步队列
    if (settings.autoSave) {
      pendingOperations.value.push(newOperation)
    }

    return newOperation
  }

  // 同步操作
  const syncOperations = async (): Promise<boolean> => {
    if (pendingOperations.value.length === 0) return true

    syncState.value = 'syncing'

    try {
      // 模拟同步
      await new Promise(r => setTimeout(r, 300))

      // 清除已同步的操作
      pendingOperations.value = []
      syncState.value = 'synced'

      return true
    } catch {
      syncState.value = 'error'
      return false
    }
  }

  // 添加评论
  const addComment = (comment: Omit<Comment, 'id' | 'userId' | 'userName' | 'userAvatar' | 'createdAt' | 'resolved' | 'replies'>): Comment => {
    const newComment: Comment = {
      ...comment,
      id: `comment_${Date.now()}`,
      userId: currentUser.value.id,
      userName: currentUser.value.name,
      userAvatar: currentUser.value.avatar,
      createdAt: Date.now(),
      resolved: false,
      replies: []
    }

    comments.value.push(newComment)
    return newComment
  }

  // 回复评论
  const replyToComment = (commentId: string, content: string): CommentReply | null => {
    const comment = comments.value.find(c => c.id === commentId)
    if (!comment) return null

    const reply: CommentReply = {
      id: `reply_${Date.now()}`,
      userId: currentUser.value.id,
      userName: currentUser.value.name,
      userAvatar: currentUser.value.avatar,
      content,
      createdAt: Date.now()
    }

    comment.replies.push(reply)
    return reply
  }

  // 标记评论已解决
  const resolveComment = (commentId: string) => {
    const comment = comments.value.find(c => c.id === commentId)
    if (comment) {
      comment.resolved = true
    }
  }

  // 删除评论
  const deleteComment = (commentId: string) => {
    const index = comments.value.findIndex(c => c.id === commentId)
    if (index > -1) {
      comments.value.splice(index, 1)
    }
  }

  // 获取幻灯片的评论
  const getSlideComments = (slideId: string): Comment[] => {
    return comments.value.filter(c => c.slideId === slideId)
  }

  // 获取未解决的评论数
  const unresolvedCount = computed(() =>
    comments.value.filter(c => !c.resolved).length
  )

  // 获取在线用户
  const onlineUsers = computed(() =>
    [currentUser.value, ...collaborators.value].filter(u => u.status === 'online')
  )

  // 权限检查
  const canEdit = computed(() =>
    currentUser.value.role === 'owner' || currentUser.value.role === 'editor'
  )

  const canComment = computed(() =>
    currentUser.value.role !== 'viewer'
  )

  const canManage = computed(() =>
    currentUser.value.role === 'owner'
  )

  // 更新设置
  const updateSettings = (newSettings: Partial<CollaboratorSettings>) => {
    Object.assign(settings, newSettings)
  }

  // 生成协作邀请链接
  const generateInviteLink = (role: 'editor' | 'viewer'): string => {
    const inviteId = `invite_${Date.now()}_${role}`
    return `https://rabaimind.app/invite/${inviteId}`
  }

  // 导出协作历史
  const exportHistory = (): string => {
    return JSON.stringify({
      operations: editHistory.value,
      comments: comments.value,
      exportedAt: Date.now()
    }, null, 2)
  }

  // 统计
  const stats = computed(() => ({
    totalCollaborators: collaborators.value.length,
    onlineCount: onlineUsers.value.length,
    totalComments: comments.value.length,
    unresolvedComments: unresolvedCount.value,
    totalOperations: editHistory.value.length,
    pendingSync: pendingOperations.value.length,
    connectionStatus: connectionState.value,
    syncStatus: syncState.value
  }))

  return {
    // 数据
    currentUser,
    collaborators,
    cursors,
    comments,
    editHistory,
    activeSlideId,
    selectedElements,
    settings,
    connectionState,
    syncState,
    pendingOperations,

    // 方法
    initSampleCollaborators,
    connect,
    disconnect,
    updateUserStatus,
    updateCursor,
    setActiveSlide,
    setSelectedElements,
    recordOperation,
    syncOperations,
    addComment,
    replyToComment,
    resolveComment,
    deleteComment,
    getSlideComments,
    updateSettings,
    generateInviteLink,
    exportHistory,

    // 计算属性
    onlineUsers,
    unresolvedCount,
    canEdit,
    canComment,
    canManage,
    stats
  }
}

export default useCollaborativeEdit
