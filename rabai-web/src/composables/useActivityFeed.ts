// Activity Feed composable - 团队活动动态
import { ref, computed } from 'vue'

export type ActivityType =
  | 'join'
  | 'leave'
  | 'edit'
  | 'comment'
  | 'suggest'
  | 'resolve'
  | 'share'
  | 'download'
  | 'create_slide'
  | 'delete_slide'
  | 'regenerate'
  | 'apply_template'

export interface Activity {
  id: string
  type: ActivityType
  userId: string
  userName: string
  userAvatar: string
  target?: string // 操作目标（如幻灯片号、评论内容摘要）
  details?: string // 额外详情
  slideNum?: number
  timestamp: number
  read: boolean
}

// 用户映射
const userMap: Record<string, { name: string; avatar: string }> = {
  'u_current': { name: '我', avatar: '' },
  'u1': { name: '张三', avatar: '' },
  'u2': { name: '李四', avatar: '' },
  'u3': { name: '王五', avatar: '' }
}

const getUserInfo = (userId: string) => {
  return userMap[userId] || { name: '未知成员', avatar: '' }
}

// 活动类型显示配置
const ACTIVITY_CONFIG: Record<ActivityType, { icon: string; text: string; color: string }> = {
  join: { icon: '🎉', text: '加入了工作空间', color: '#00C850' },
  leave: { icon: '👋', text: '离开了工作空间', color: '#888' },
  edit: { icon: '✏️', text: '编辑了幻灯片', color: '#165DFF' },
  comment: { icon: '💬', text: '评论了幻灯片', color: '#5856D6' },
  suggest: { icon: '💡', text: '提出了编辑建议', color: '#FF9500' },
  resolve: { icon: '✅', text: '处理了评论/建议', color: '#00C850' },
  share: { icon: '📤', text: '分享了演示文稿', color: '#34C759' },
  download: { icon: '⬇️', text: '下载了PPT', color: '#007AFF' },
  create_slide: { icon: '➕', text: '创建了幻灯片', color: '#5856D6' },
  delete_slide: { icon: '🗑️', text: '删除了幻灯片', color: '#FF3B30' },
  regenerate: { icon: '🔄', text: '重新生成了幻灯片', color: '#FF9500' },
  apply_template: { icon: '🎨', text: '应用了模板', color: '#AF52DE' }
}

export function useActivityFeed(pptId?: string) {
  const activities = ref<Activity[]>([])
  const isLoading = ref(false)
  const filterType = ref<ActivityType | 'all'>('all')
  const filterUserId = ref<string | 'all'>('all')
  const autoRefresh = ref(true)
  const refreshInterval = ref<number | null>(null)

  // 加载活动
  const loadActivities = () => {
    try {
      const saved = localStorage.getItem(`activities_${pptId || 'default'}`)
      if (saved) {
        activities.value = JSON.parse(saved)
      }
    } catch {
      activities.value = []
    }
  }

  // 保存活动
  const saveActivities = () => {
    try {
      localStorage.setItem(`activities_${pptId || 'default'}`, JSON.stringify(activities.value))
    } catch {
      // ignore
    }
  }

  // 添加活动
  const addActivity = (
    type: ActivityType,
    userId: string,
    target?: string,
    details?: string,
    slideNum?: number
  ): Activity => {
    const userInfo = getUserInfo(userId)
    const activity: Activity = {
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type,
      userId,
      userName: userInfo.name,
      userAvatar: userInfo.avatar,
      target,
      details,
      slideNum,
      timestamp: Date.now(),
      read: false
    }

    activities.value.unshift(activity)

    // 最多保留100条
    if (activities.value.length > 100) {
      activities.value = activities.value.slice(0, 100)
    }

    saveActivities()
    return activity
  }

  // 标记活动为已读
  const markAsRead = (activityId: string) => {
    const activity = activities.value.find(a => a.id === activityId)
    if (activity) {
      activity.read = true
      saveActivities()
    }
  }

  // 全部标记为已读
  const markAllAsRead = () => {
    activities.value.forEach(a => a.read = true)
    saveActivities()
  }

  // 删除活动
  const deleteActivity = (activityId: string) => {
    activities.value = activities.value.filter(a => a.id !== activityId)
    saveActivities()
  }

  // 清空所有活动
  const clearAll = () => {
    activities.value = []
    saveActivities()
  }

  // 获取活动显示信息
  const getActivityDisplay = (activity: Activity) => {
    const config = ACTIVITY_CONFIG[activity.type]
    return {
      icon: config.icon,
      text: config.text,
      color: config.color,
      description: `${activity.userName} ${config.text}${activity.target ? `「${activity.target}」` : ''}`
    }
  }

  // 过滤后的活动
  const filteredActivities = computed(() => {
    let filtered = activities.value

    if (filterType.value !== 'all') {
      filtered = filtered.filter(a => a.type === filterType.value)
    }

    if (filterUserId.value !== 'all') {
      filtered = filtered.filter(a => a.userId === filterUserId.value)
    }

    return filtered
  })

  // 未读数量
  const unreadCount = computed(() => activities.value.filter(a => !a.read).length)

  // 获取活动时间描述
  const getTimeDescription = (timestamp: number): string => {
    const now = Date.now()
    const diff = now - timestamp

    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`

    const date = new Date(timestamp)
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  // 获取活动类型列表
  const activityTypes = computed(() => {
    return Object.entries(ACTIVITY_CONFIG).map(([type, config]) => ({
      type: type as ActivityType,
      icon: config.icon,
      text: config.text
    }))
  })

  // 获取参与成员列表
  const participantMembers = computed(() => {
    const userIds = new Set(activities.value.map(a => a.userId))
    return Array.from(userIds).map(id => ({
      id: id,
      ...getUserInfo(id)
    }))
  })

  // 按天分组活动
  const groupedActivities = computed(() => {
    const groups: { date: string; activities: Activity[] }[] = []
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const yesterday = today - 86400000

    let currentGroup: Activity[] = []
    let currentDate = ''

    filteredActivities.value.forEach(activity => {
      const activityDate = new Date(activity.timestamp)
      const activityDay = new Date(
        activityDate.getFullYear(),
        activityDate.getMonth(),
        activityDate.getDate()
      ).getTime()

      let dateLabel: string
      if (activityDay === today) {
        dateLabel = '今天'
      } else if (activityDay === yesterday) {
        dateLabel = '昨天'
      } else {
        dateLabel = `${activityDate.getMonth() + 1}月${activityDate.getDate()}日`
      }

      if (dateLabel !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, activities: currentGroup })
        }
        currentGroup = [activity]
        currentDate = dateLabel
      } else {
        currentGroup.push(activity)
      }
    })

    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, activities: currentGroup })
    }

    return groups
  })

  // 开始自动刷新
  const startAutoRefresh = (intervalMs = 30000) => {
    if (refreshInterval.value) return
    refreshInterval.value = window.setInterval(() => {
      // 模拟其他用户的活动
      if (Math.random() < 0.1) { // 10%概率有新活动
        const users = ['u1', 'u2', 'u3']
        const userId = users[Math.floor(Math.random() * users.length)]
        const types: ActivityType[] = ['edit', 'comment', 'download']
        const type = types[Math.floor(Math.random() * types.length)]
        addActivity(type, userId, undefined, undefined, Math.floor(Math.random() * 10) + 1)
      }
    }, intervalMs)
  }

  // 停止自动刷新
  const stopAutoRefresh = () => {
    if (refreshInterval.value) {
      window.clearInterval(refreshInterval.value)
      refreshInterval.value = null
    }
  }

  // 模拟团队成员活动（用于演示）
  const simulateTeamActivity = () => {
    const users = ['u1', 'u2', 'u3']
    const types: ActivityType[] = ['edit', 'comment', 'suggest', 'download', 'share']
    const type = types[Math.floor(Math.random() * types.length)]
    const userId = users[Math.floor(Math.random() * users.length)]
    addActivity(type, userId, undefined, undefined, Math.floor(Math.random() * 10) + 1)
  }

  // 初始化
  loadActivities()
  if (autoRefresh.value) {
    startAutoRefresh()
  }

  return {
    activities,
    isLoading,
    filterType,
    filterUserId,
    autoRefresh,
    filteredActivities,
    unreadCount,
    groupedActivities,
    activityTypes,
    participantMembers,
    addActivity,
    markAsRead,
    markAllAsRead,
    deleteActivity,
    clearAll,
    getActivityDisplay,
    getTimeDescription,
    startAutoRefresh,
    stopAutoRefresh,
    simulateTeamActivity,
    loadActivities
  }
}

export default useActivityFeed
