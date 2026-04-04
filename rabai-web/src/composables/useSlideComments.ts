// Slide Comments composable - 幻灯片评论功能
import { ref, computed } from 'vue'
import api from '../api/client'
import { useCollaboration } from './useCollaboration'

export interface Comment {
  id: string
  slideNum: number
  authorId: string
  authorName: string
  authorAvatar: string
  content: string
  createdAt: string
  updatedAt: string
  resolved: boolean
  resolvedBy: string | null
  resolvedAt: string | null
  replies: CommentReply[]
  position?: { x: number; y: number } // 可选：评论位置
}

export interface CommentReply {
  id: string
  authorId: string
  authorName: string
  authorAvatar: string
  content: string
  createdAt: string
}

export interface SuggestEdit {
  id: string
  slideNum: number
  authorId: string
  authorName: string
  authorAvatar: string
  type: 'text' | 'image' | 'layout' | 'style'
  originalContent: any
  suggestedContent: any
  reason: string
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string
  resolvedBy: string | null
  resolvedAt: string | null
}

// 当前用户（默认值，可被覆盖）
const defaultUser = {
  id: 'u_current',
  name: '我',
  avatar: ''
}

export function useSlideComments(
  pptId?: string,
  taskIdForApi?: string,
  userInfo?: { id: string; name: string; avatar?: string }
) {
  const currentUser = userInfo || defaultUser
  const comments = ref<Comment[]>([])
  const suggestEdits = ref<SuggestEdit[]>([])
  const isLoading = ref(false)
  const activeSlideNum = ref(1)
  const showResolved = ref(false)

  // 加载评论
  const loadComments = () => {
    try {
      const saved = localStorage.getItem(`comments_${pptId || 'default'}`)
      if (saved) {
        comments.value = JSON.parse(saved)
      }
    } catch {
      comments.value = []
    }
  }

  // 保存评论
  const saveComments = () => {
    try {
      localStorage.setItem(`comments_${pptId || 'default'}`, JSON.stringify(comments.value))
    } catch {
      // ignore
    }
  }

  // 加载建议编辑（优先后端，其次本地）
  const loadSuggestEdits = async () => {
    // Try backend first
    if (taskIdForApi) {
      try {
        const res = await api.getSuggestEdits(taskIdForApi)
        if (res.data.success && res.data.edits) {
          suggestEdits.value = res.data.edits.map((e: any) => ({
            id: e.id,
            slideNum: e.slide_num,
            authorId: e.author_id,
            authorName: e.author_name,
            authorAvatar: e.author_avatar,
            type: e.edit_type,
            originalContent: e.original_content,
            suggestedContent: e.suggested_content,
            reason: e.reason,
            status: e.status,
            createdAt: e.created_at,
            resolvedBy: e.resolved_by,
            resolvedAt: e.resolved_at,
          }))
          return
        }
      } catch {
        // Fall through to localStorage
      }
    }
    // Fallback to localStorage
    try {
      const saved = localStorage.getItem(`suggestEdits_${pptId || 'default'}`)
      if (saved) {
        suggestEdits.value = JSON.parse(saved)
      }
    } catch {
      suggestEdits.value = []
    }
  }

  // 保存建议编辑
  const saveSuggestEdits = () => {
    try {
      localStorage.setItem(`suggestEdits_${pptId || 'default'}`, JSON.stringify(suggestEdits.value))
    } catch {
      // ignore
    }
  }

  // 添加评论
  const addComment = (
    slideNum: number,
    content: string,
    position?: { x: number; y: number }
  ): Comment | null => {
    if (!content.trim()) return null

    const comment: Comment = {
      id: `cmt_${Date.now()}`,
      slideNum,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      resolved: false,
      resolvedBy: null,
      resolvedAt: null,
      replies: [],
      position
    }

    comments.value.push(comment)
    saveComments()
    return comment
  }

  // 回复评论
  const replyComment = (commentId: string, content: string): CommentReply | null => {
    if (!content.trim()) return null

    const comment = comments.value.find(c => c.id === commentId)
    if (!comment) return null

    const reply: CommentReply = {
      id: `rpl_${Date.now()}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar,
      content: content.trim(),
      createdAt: new Date().toISOString()
    }

    comment.replies.push(reply)
    comment.updatedAt = new Date().toISOString()
    saveComments()
    return reply
  }

  // 编辑评论
  const editComment = (commentId: string, content: string): boolean => {
    const comment = comments.value.find(c => c.id === commentId)
    if (!comment || comment.authorId !== currentUser.id) return false

    comment.content = content.trim()
    comment.updatedAt = new Date().toISOString()
    saveComments()
    return true
  }

  // 删除评论
  const deleteComment = (commentId: string): boolean => {
    const index = comments.value.findIndex(c => c.id === commentId)
    if (index === -1) return false

    const comment = comments.value[index]
    if (comment.authorId !== currentUser.id) return false

    comments.value.splice(index, 1)
    saveComments()
    return true
  }

  // 标记评论为已解决
  const resolveComment = (commentId: string): boolean => {
    const comment = comments.value.find(c => c.id === commentId)
    if (!comment) return false

    comment.resolved = true
    comment.resolvedBy = currentUser.id
    comment.resolvedAt = new Date().toISOString()
    saveComments()
    return true
  }

  // 重新打开评论
  const unresolveComment = (commentId: string): boolean => {
    const comment = comments.value.find(c => c.id === commentId)
    if (!comment) return false

    comment.resolved = false
    comment.resolvedBy = null
    comment.resolvedAt = null
    saveComments()
    return true
  }

  // 获取指定幻灯片的评论
  const getSlideComments = (slideNum: number) => {
    return computed(() => {
      let slideComments = comments.value.filter(c => c.slideNum === slideNum)
      if (!showResolved.value) {
        slideComments = slideComments.filter(c => !c.resolved)
      }
      return slideComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    })
  }

  // 获取待处理的建议编辑
  const pendingSuggestEdits = computed(() => {
    return suggestEdits.value.filter(e => e.status === 'pending')
  })

  // 获取指定幻灯片的建议编辑
  const getSlideSuggestEdits = (slideNum: number) => {
    return computed(() => suggestEdits.value.filter(e => e.slideNum === slideNum))
  }

  // 添加建议编辑
  const addSuggestEdit = async (
    slideNum: number,
    type: 'text' | 'image' | 'layout' | 'style',
    originalContent: any,
    suggestedContent: any,
    reason: string
  ): Promise<SuggestEdit | null> => {
    // Try backend first
    if (taskIdForApi) {
      try {
        const res = await api.addSuggestEdit(taskIdForApi, {
          slide_num: slideNum,
          author_id: currentUser.id,
          author_name: currentUser.name,
          author_avatar: currentUser.avatar || '',
          edit_type: type,
          original_content: originalContent,
          suggested_content: suggestedContent,
          reason,
        })
        if (res.data.success && res.data.edit) {
          const e = res.data.edit
          const edit: SuggestEdit = {
            id: e.id,
            slideNum: e.slide_num,
            authorId: e.author_id,
            authorName: e.author_name,
            authorAvatar: e.author_avatar,
            type: e.edit_type,
            originalContent: e.original_content,
            suggestedContent: e.suggested_content,
            reason: e.reason,
            status: e.status,
            createdAt: e.created_at,
            resolvedBy: e.resolved_by,
            resolvedAt: e.resolved_at,
          }
          // Add to list if not already there
          if (!suggestEdits.value.find(x => x.id === edit.id)) {
            suggestEdits.value.push(edit)
          }
          saveSuggestEdits()
          return edit
        }
      } catch {
        // Fall through to local
      }
    }
    // Local fallback
    const edit: SuggestEdit = {
      id: `sug_${Date.now()}`,
      slideNum,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar || '',
      type,
      originalContent,
      suggestedContent,
      reason,
      status: 'pending',
      createdAt: new Date().toISOString(),
      resolvedBy: null,
      resolvedAt: null
    }
    suggestEdits.value.push(edit)
    saveSuggestEdits()
    return edit
  }

  // 接受建议编辑
  const acceptSuggestEdit = async (editId: string): Promise<boolean> => {
    // Try backend first
    if (taskIdForApi) {
      try {
        const res = await api.resolveSuggestEdit(taskIdForApi, editId, {
          status: 'accepted',
          resolved_by: currentUser.id,
        })
        if (res.data.success) {
          const edit = suggestEdits.value.find(e => e.id === editId)
          if (edit) {
            edit.status = 'accepted'
            edit.resolvedBy = currentUser.id
            edit.resolvedAt = new Date().toISOString()
            saveSuggestEdits()
          }
          return true
        }
      } catch {
        // Fall through to local
      }
    }
    // Local fallback
    const edit = suggestEdits.value.find(e => e.id === editId)
    if (!edit) return false
    edit.status = 'accepted'
    edit.resolvedBy = currentUser.id
    edit.resolvedAt = new Date().toISOString()
    saveSuggestEdits()
    return true
  }

  // 拒绝建议编辑
  const rejectSuggestEdit = async (editId: string): Promise<boolean> => {
    // Try backend first
    if (taskIdForApi) {
      try {
        const res = await api.resolveSuggestEdit(taskIdForApi, editId, {
          status: 'rejected',
          resolved_by: currentUser.id,
        })
        if (res.data.success) {
          const edit = suggestEdits.value.find(e => e.id === editId)
          if (edit) {
            edit.status = 'rejected'
            edit.resolvedBy = currentUser.id
            edit.resolvedAt = new Date().toISOString()
            saveSuggestEdits()
          }
          return true
        }
      } catch {
        // Fall through to local
      }
    }
    // Local fallback
    const edit = suggestEdits.value.find(e => e.id === editId)
    if (!edit) return false
    edit.status = 'rejected'
    edit.resolvedBy = currentUser.id
    edit.resolvedAt = new Date().toISOString()
    saveSuggestEdits()
    return true
  }

  // 获取评论统计
  const commentStats = computed(() => {
    const total = comments.value.length
    const resolved = comments.value.filter(c => c.resolved).length
    const pending = total - resolved
    const bySlide: Record<number, number> = {}
    comments.value.forEach(c => {
      bySlide[c.slideNum] = (bySlide[c.slideNum] || 0) + 1
    })
    return { total, resolved, pending, bySlide }
  })

  // 格式化时间
  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`
    return date.toLocaleDateString('zh-CN')
  }

  // 初始化
  loadComments()
  loadSuggestEdits()

  return {
    comments,
    suggestEdits,
    isLoading,
    activeSlideNum,
    showResolved,
    pendingSuggestEdits,
    commentStats,
    addComment,
    replyComment,
    editComment,
    deleteComment,
    resolveComment,
    unresolveComment,
    getSlideComments,
    getSlideSuggestEdits,
    addSuggestEdit,
    acceptSuggestEdit,
    rejectSuggestEdit,
    formatTime,
    loadComments,
    loadSuggestEdits
  }
}

export default useSlideComments
