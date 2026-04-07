/**
 * Social Engagement Composable
 * 社交互动 composable - 管理反应、浏览量、分享链接
 */
import { ref, computed } from 'vue'
import { apiClient } from '../api/client'

export interface EngagementStats {
  success: boolean
  task_id: string
  view_count: number
  likes: number
  fires: number
  hearts: number
  comment_count: number
  share_count: number
}

export interface ReactionResponse {
  success: boolean
  task_id: string
  reaction_type: string | null
  total_likes: number
  total_fires: number
  total_hearts: number
  user_reaction: string | null
}

export interface ShareLinkData {
  success: boolean
  task_id: string
  share_url: string
  title: string
  description: string
  thumbnail: string | null
}

export function useEngagement(taskId: string) {
  const loading = ref(false)
  const stats = ref<EngagementStats | null>(null)
  const userReaction = ref<string | null>(null)
  const shareLink = ref<ShareLinkData | null>(null)
  const error = ref<string | null>(null)

  // Computed
  const totalReactions = computed(() => {
    if (!stats.value) return 0
    return stats.value.likes + stats.value.fires + stats.value.hearts
  })

  const hasUserReacted = computed(() => userReaction.value !== null)

  // Load engagement stats
  const loadStats = async () => {
    try {
      loading.value = true
      error.value = null
      const response = await apiClient.get(`/engagement/stats/${taskId}`)
      stats.value = response.data
    } catch (e: any) {
      console.error('Failed to load engagement stats:', e)
      // Use defaults on error
      if (!stats.value) {
        stats.value = {
          success: true,
          task_id: taskId,
          view_count: 0,
          likes: 0,
          fires: 0,
          hearts: 0,
          comment_count: 0,
          share_count: 0
        }
      }
    } finally {
      loading.value = false
    }
  }

  // Load user reaction status
  const loadUserReaction = async () => {
    try {
      const response = await apiClient.get(`/engagement/reaction/${taskId}`)
      userReaction.value = response.data.user_reaction
    } catch (e: any) {
      console.error('Failed to load user reaction:', e)
    }
  }

  // Add/toggle reaction
  const addReaction = async (reactionType: 'like' | 'fire' | 'heart') => {
    try {
      const response = await apiClient.post('/engagement/react', {
        task_id: taskId,
        reaction_type: reactionType
      })
      const data: ReactionResponse = response.data
      
      // Update stats
      if (stats.value) {
        stats.value.likes = data.total_likes
        stats.value.fires = data.total_fires
        stats.value.hearts = data.total_hearts
      }
      userReaction.value = data.user_reaction
      return data
    } catch (e: any) {
      console.error('Failed to add reaction:', e)
      throw e
    }
  }

  // Remove reaction
  const removeReaction = async () => {
    try {
      const response = await apiClient.delete(`/engagement/react/${taskId}`)
      const data: ReactionResponse = response.data
      
      if (stats.value) {
        stats.value.likes = data.total_likes
        stats.value.fires = data.total_fires
        stats.value.hearts = data.total_hearts
      }
      userReaction.value = null
      return data
    } catch (e: any) {
      console.error('Failed to remove reaction:', e)
      throw e
    }
  }

  // Record a view
  const recordView = async () => {
    try {
      const response = await apiClient.post(`/engagement/view/${taskId}`)
      if (stats.value) {
        stats.value.view_count = response.data.view_count
      } else {
        stats.value = {
          success: true,
          task_id: taskId,
          view_count: response.data.view_count,
          likes: 0,
          fires: 0,
          hearts: 0,
          comment_count: 0,
          share_count: 0
        }
      }
    } catch (e: any) {
      console.error('Failed to record view:', e)
    }
  }

  // Get share link
  const loadShareLink = async () => {
    try {
      const response = await apiClient.get(`/engagement/share-link/${taskId}`)
      shareLink.value = response.data
    } catch (e: any) {
      console.error('Failed to load share link:', e)
    }
  }

  // Update share link
  const updateShareLink = async (title: string, description: string, thumbnail?: string) => {
    try {
      const response = await apiClient.post('/engagement/share-link', {
        task_id: taskId,
        title,
        description,
        thumbnail: thumbnail || null
      })
      shareLink.value = response.data
      return response.data
    } catch (e: any) {
      console.error('Failed to update share link:', e)
      throw e
    }
  }

  // Initialize
  const init = async () => {
    await Promise.all([loadStats(), loadUserReaction(), loadShareLink()])
  }

  return {
    loading,
    stats,
    userReaction,
    shareLink,
    error,
    totalReactions,
    hasUserReacted,
    loadStats,
    loadUserReaction,
    addReaction,
    removeReaction,
    recordView,
    loadShareLink,
    updateShareLink,
    init
  }
}
