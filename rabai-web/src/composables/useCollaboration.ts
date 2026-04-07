// useCollaboration.ts — 实时协作 composable (R71)
import { ref, computed, onUnmounted } from 'vue'
import { nextTick } from 'vue'
import { apiClient } from '../api/client'

export interface CursorPosition {
  user_id: string
  user_name: string
  user_avatar: string
  x: number
  y: number
  slide_num: number
  viewport_x: number
  viewport_y: number
  viewport_zoom: number
  cursor_style: string
  color: string
  is_editing: boolean
  selection?: { start: number; end: number; text: string } | null
  last_update: number
}

export interface PresenceInfo {
  user_id: string
  user_name: string
  user_avatar: string
  role: 'owner' | 'editor' | 'viewer' | 'commenter'
  color: string
  slide_num: number
  viewport_x: number
  viewport_y: number
  viewport_zoom: number
  last_ping: number
  is_following?: string | null
  following_since?: number | null
}

export interface Comment {
  id: string
  task_id: string
  slide_num: number
  author_id: string
  author_name: string
  author_avatar: string
  content: string
  mentions: Array<{ user_id: string; user_name: string; start: number; end: number }>
  resolved: boolean
  created_at: string
  updated_at: string
  replies: Array<{
    id: string
    author_id: string
    author_name: string
    author_avatar: string
    content: string
    mentions: any[]
    created_at: string
  }>
}

export interface Operation {
  id: string
  task_id: string
  user_id: string
  type: string
  slide_num: number
  element_id?: string
  position?: { index: number; [key: string]: any }
  data?: any
  version: number
  timestamp: number
  base_version: number
  client_id?: string
}

export type FollowViewport = {
  user_id: string
  user_name: string
  slide_num: number
  viewport_x: number
  viewport_y: number
  viewport_zoom: number
} | null

export const useCollaboration = (
  taskId: string,
  currentUser: { id: string; name: string; avatar: string; role: string }
) => {
  const ws = ref<WebSocket | null>(null)
  const connected = ref(false)
  const myColor = ref('#3B82F6')
  const serverVersion = ref(0)

  // Presence & Cursors
  const presenceList = ref<PresenceInfo[]>([])
  const cursors = ref<Map<string, CursorPosition>>(new Map())

  // Follow mode
  const followingUserId = ref<string | null>(null)
  const followViewport = ref<FollowViewport>(null)
  let followSyncInterval: number | null = null

  // Comments
  const comments = ref<Comment[]>([])

  // Operation queue for OT
  const pendingOperations = ref<Operation[]>([])

  // Callbacks
  let onFollowViewportChange: ((viewport: FollowViewport) => void) | null = null

  const wsBase = import.meta.env.VITE_API_BASE || 'ws://localhost:8003'

  const connect = () => {
    const params = new URLSearchParams({
      user_id: currentUser.id,
      user_name: currentUser.name,
      user_avatar: currentUser.avatar,
      role: currentUser.role,
    })
    const url = `${wsBase}/api/v1/collaboration/ws/${taskId}?${params}`
    const socket = new WebSocket(url)

    socket.onopen = () => {
      connected.value = true
      console.log('[Collab] Connected')
    }

    socket.onclose = () => {
      connected.value = false
      console.log('[Collab] Disconnected, reconnecting in 3s...')
      setTimeout(connect, 3000)
    }

    socket.onerror = (e) => {
      console.warn('[Collab] WebSocket error', e)
    }

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        handleMessage(msg)
      } catch (e) {
        console.warn('[Collab] Failed to parse message', e)
      }
    }

    ws.value = socket
  }

  const handleMessage = async (msg: any) => {
    switch (msg.type) {
      case 'init':
        myColor.value = msg.color
        serverVersion.value = msg.server_version || 0
        // Load presence list (excluding self)
        presenceList.value = (msg.presence_list || []).filter(
          (p: PresenceInfo) => p.user_id !== currentUser.id
        )
        // Load cursors
        cursors.value = new Map(Object.entries(msg.cursors || {}))
        // Load comments
        comments.value = msg.comments || []
        break

      case 'user_joined':
        if (msg.user_id !== currentUser.id) {
          const info: PresenceInfo = {
            user_id: msg.user_id,
            user_name: msg.user_name,
            user_avatar: msg.user_avatar || '',
            role: msg.role || 'viewer',
            color: msg.color || '#3B82F6',
            slide_num: 1,
            viewport_x: 0,
            viewport_y: 0,
            viewport_zoom: 1,
            last_ping: Date.now(),
          }
          const existing = presenceList.value.findIndex(p => p.user_id === msg.user_id)
          if (existing >= 0) {
            presenceList.value[existing] = info
          } else {
            presenceList.value.push(info)
          }

          // Send collaborator joined notification to backend
          try {
            await apiClient.post('/notifications/generation', {
              notif_type: 'collaborator_joined',
              task_id: taskId,
              title: `${msg.user_name} 加入了编辑`,
              message: `${msg.user_name} (${msg.role || 'viewer'}) 已加入协作文档编辑`,
              collaborator_name: msg.user_name,
            })
            // Show browser notification if permitted
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(`${msg.user_name} 加入了编辑`, {
                body: `${msg.user_name} 作为 ${msg.role || 'viewer'} 加入了这篇演示文稿的编辑`,
                tag: `collab-joined-${taskId}`,
                icon: '/icon-192.svg',
              })
            }
          } catch (e) {
            // Silently fail - notification is not critical
            console.warn('[Collaboration] Failed to send collaborator notification:', e)
          }
        }
        break

      case 'user_left':
        presenceList.value = presenceList.value.filter(p => p.user_id !== msg.user_id)
        cursors.value.delete(msg.user_id)
        // Stop following if they left
        if (followingUserId.value === msg.user_id) {
          followingUserId.value = null
          followViewport.value = null
        }
        break

      case 'cursor_update':
        if (msg.user_id !== currentUser.id) {
          cursors.value.set(msg.user_id, msg.cursor)
        }
        break

      case 'presence_update':
        if (msg.user_id !== currentUser.id) {
          const idx = presenceList.value.findIndex(p => p.user_id === msg.user_id)
          if (idx >= 0) {
            presenceList.value[idx] = msg.data
          }
          // If following this user, update follow viewport
          if (followingUserId.value === msg.user_id) {
            const data = msg.data as PresenceInfo
            followViewport.value = {
              user_id: msg.user_id,
              user_name: data.user_name,
              slide_num: data.slide_num,
              viewport_x: data.viewport_x,
              viewport_y: data.viewport_y,
              viewport_zoom: data.viewport_zoom,
            }
            onFollowViewportChange?.(followViewport.value)
          }
        }
        break

      case 'operation_applied':
        serverVersion.value = msg.server_version
        // If we have pending ops with transformed versions, resolve them
        break

      case 'operation_result':
        // Our operation was accepted
        break

      case 'operations_sync':
        serverVersion.value = msg.server_version
        // Apply synced operations
        break

      case 'follow_started':
        if (msg.followed_id === currentUser.id) {
          // Someone started following us
          console.log(`[Collab] ${msg.follower_id} is following you`)
        }
        break

      case 'follow_ended':
        break

      case 'follow_viewport':
        followViewport.value = msg.viewport
        onFollowViewportChange?.(msg.viewport)
        break

      case 'comment_added':
        if (msg.comment) {
          const existing = comments.value.findIndex(c => c.id === msg.comment.id)
          if (existing < 0) {
            comments.value.push(msg.comment)
          }
        }
        break

      case 'comment_replied':
        {
          const comment = comments.value.find(c => c.id === msg.comment_id)
          if (comment && msg.reply) {
            const existingReply = comment.replies.findIndex(r => r.id === msg.reply.id)
            if (existingReply < 0) {
              comment.replies.push(msg.reply)
            }
          }
        }
        break

      case 'comment_resolved':
        {
          const comment = comments.value.find(c => c.id === msg.comment_id)
          if (comment) {
            comment.resolved = msg.resolved
          }
        }
        break

      case 'pong':
        break
    }
  }

  const send = (data: object) => {
    if (ws.value && ws.value.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify(data))
    }
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  const startFollowMode = (followedUserId: string) => {
    followingUserId.value = followedUserId
    send({ type: 'follow', followed_user_id: followedUserId })
    // Start polling for viewport updates
    followSyncInterval = window.setInterval(() => {
      send({ type: 'get_follow_viewport' })
    }, 500)
  }

  const stopFollowMode = () => {
    followingUserId.value = null
    followViewport.value = null
    send({ type: 'follow', followed_user_id: null })
    if (followSyncInterval) {
      clearInterval(followSyncInterval)
      followSyncInterval = null
    }
  }

  const onViewportChange = (callback: (viewport: FollowViewport) => void) => {
    onFollowViewportChange = callback
  }

  const updateCursor = (x: number, y: number, slideNum: number, options: {
    viewportX?: number, viewportY?: number, viewportZoom?: number,
    cursorStyle?: string, isEditing?: boolean, selection?: any
  } = {}) => {
    send({
      type: 'cursor_move',
      x,
      y,
      slide_num: slideNum,
      viewport_x: options.viewportX ?? 0,
      viewport_y: options.viewportY ?? 0,
      viewport_zoom: options.viewportZoom ?? 1,
      cursor_style: options.cursorStyle ?? 'pointer',
      is_editing: options.isEditing ?? false,
      selection: options.selection ?? null,
    })
  }

  const updatePresence = (slideNum: number, viewport?: {
    x: number, y: number, zoom: number
  }) => {
    send({
      type: 'presence_update',
      slide_num: slideNum,
      viewport: viewport ? { x: viewport.x, y: viewport.y, zoom: viewport.zoom } : undefined,
    })
  }

  const sendOperation = (op: Omit<Operation, 'id' | 'task_id' | 'user_id' | 'version' | 'timestamp' | 'base_version'>) => {
    const operation: Operation = {
      ...op,
      id: `${currentUser.id}_${Date.now()}`,
      task_id: taskId,
      user_id: currentUser.id,
      version: 0,
      timestamp: Date.now(),
      base_version: serverVersion.value,
      client_id: currentUser.id,
    }
    send(operation)
    return operation
  }

  const addComment = async (slideNum: number, content: string, mentions: any[] = []): Promise<Comment | null> => {
    return new Promise((resolve) => {
      const handler = (event: MessageEvent) => {
        try {
          const msg = JSON.parse(event.data)
          if (msg.type === 'comment_result' && msg.success && msg.comment) {
            ws.value?.removeEventListener('message', handler)
            resolve(msg.comment)
          }
        } catch {}
      }
      ws.value?.addEventListener('message', handler)
      send({
        type: 'comment_add',
        slide_num: slideNum,
        content,
        mentions,
      })
      // Timeout fallback
      setTimeout(() => {
        ws.value?.removeEventListener('message', handler)
        resolve(null)
      }, 5000)
    })
  }

  const replyComment = async (commentId: string, content: string, mentions: any[] = []): Promise<any | null> => {
    return new Promise((resolve) => {
      const handler = (event: MessageEvent) => {
        try {
          const msg = JSON.parse(event.data)
          if (msg.type === 'comment_result' && msg.success && msg.reply) {
            ws.value?.removeEventListener('message', handler)
            resolve(msg.reply)
          }
        } catch {}
      }
      ws.value?.addEventListener('message', handler)
      send({
        type: 'comment_reply',
        comment_id: commentId,
        content,
        mentions,
      })
      setTimeout(() => {
        ws.value?.removeEventListener('message', handler)
        resolve(null)
      }, 5000)
    })
  }

  const resolveComment = (commentId: string, resolved: boolean = true) => {
    send({ type: 'comment_resolve', comment_id: commentId, resolved })
  }

  // Current slide comments
  const currentSlideComments = computed(() =>
    comments.value.filter(c => !c.resolved)
  )

  const disconnect = () => {
    stopFollowMode()
    ws.value?.close()
    ws.value = null
    connected.value = false
  }

  // R160: Collaboration state
  const collaborators = ref<any[]>([])
  const validShareLinks = ref<any[]>([])
  const isCollaborating = computed(() => collaborators.value.length > 0)

  const loadCollaborators = async (taskId: string) => {
    try {
      const res = await apiClient.get(`/sharing/collaborators/${taskId}`)
      collaborators.value = res.data.collaborators || []
    } catch {
      collaborators.value = []
    }
  }

  const loadShareLinks = async (taskId: string) => {
    try {
      const res = await apiClient.get(`/sharing/links/${taskId}`)
      validShareLinks.value = res.data.links || []
    } catch {
      validShareLinks.value = []
    }
  }

  const createShareLink = async (role: string, options?: { expiresInDays?: number }) => {
    const documentId = 'current-doc'
    const res = await apiClient.post(`/sharing/links/${documentId}`, { role, ...options })
    if (res.data.success) {
      await loadShareLinks(documentId)
    }
    return res.data
  }

  const deleteShareLink = async (linkId: string) => {
    const documentId = 'current-doc'
    await apiClient.delete(`/sharing/links/${documentId}/${linkId}`)
    validShareLinks.value = validShareLinks.value.filter(l => l.id !== linkId)
  }

  const copyShareLink = async (linkId: string) => {
    const link = validShareLinks.value.find(l => l.id === linkId)
    if (link) {
      await navigator.clipboard.writeText(link.url || link.link || '')
    }
  }

  const addCollaborator = async (email: string, role: string) => {
    // Placeholder - real implementation would call an API
    return false
  }

  const removeCollaborator = async (userId: string) => {
    collaborators.value = collaborators.value.filter(c => c.user_id !== userId)
  }

  onUnmounted(() => {
    disconnect()
  })

  // Auto-connect
  connect()

  return {
    // State
    connected,
    myColor,
    presenceList,
    cursors,
    comments,
    currentSlideComments,
    followingUserId,
    followViewport,
    serverVersion,
    // R160: Collaboration
    collaborators,
    isCollaborating,
    validShareLinks,
    // Methods
    updateCursor,
    updatePresence,
    sendOperation,
    startFollowMode,
    stopFollowMode,
    onViewportChange,
    addComment,
    replyComment,
    resolveComment,
    disconnect,
    // R160: Collaboration methods
    loadCollaborators,
    loadShareLinks,
    createShareLink,
    deleteShareLink,
    copyShareLink,
    addCollaborator,
    removeCollaborator,
  }
}
