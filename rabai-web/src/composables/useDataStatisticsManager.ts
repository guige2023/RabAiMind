// Data Statistics Manager - 数据统计管理
import { ref, computed } from 'vue'

export interface StatEvent {
  id: string
  category: string
  action: string
  label?: string
  value?: number
  timestamp: number
}

export interface DailyStat {
  date: string
  views: number
  clicks: number
  conversions: number
  revenue: number
}

export interface UserStat {
  totalUsers: number
  activeUsers: number
  newUsers: number
  returningUsers: number
}

export interface ContentStat {
  templates: number
  presentations: number
  exports: number
  shares: number
}

export interface AnalyticsData {
  daily: DailyStat[]
  user: UserStat
  content: ContentStat
}

export function useDataStatisticsManager() {
  // 事件列表
  const events = ref<StatEvent[]>([])

  // 分析数据
  const analytics = ref<AnalyticsData>({
    daily: [],
    user: {
      totalUsers: 0,
      activeUsers: 0,
      newUsers: 0,
      returningUsers: 0
    },
    content: {
      templates: 0,
      presentations: 0,
      exports: 0,
      shares: 0
    }
  })

  // 追踪事件
  const track = (
    category: string,
    action: string,
    label?: string,
    value?: number
  ): StatEvent => {
    const event: StatEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      category,
      action,
      label,
      value,
      timestamp: Date.now()
    }

    events.value.push(event)

    // 限制事件数量
    if (events.value.length > 1000) {
      events.value = events.value.slice(-500)
    }

    // 更新分析数据
    updateAnalytics(event)

    // 保存
    saveEvents()

    return event
  }

  // 更新分析数据
  const updateAnalytics = (event: StatEvent) => {
    const today = new Date().toISOString().split('T')[0]
    let todayStat = analytics.value.daily.find(d => d.date === today)

    if (!todayStat) {
      todayStat = { date: today, views: 0, clicks: 0, conversions: 0, revenue: 0 }
      analytics.value.daily.push(todayStat)
    }

    // 按类别更新
    switch (event.category) {
      case 'view':
        todayStat.views++
        analytics.value.user.totalUsers++
        break
      case 'click':
        todayStat.clicks++
        break
      case 'conversion':
        todayStat.conversions++
        if (event.value) {
          todayStat.revenue += event.value
        }
        break
      case 'template':
        analytics.value.content.templates++
        break
      case 'presentation':
        analytics.value.content.presentations++
        break
      case 'export':
        analytics.value.content.exports++
        break
      case 'share':
        analytics.value.content.shares++
        break
    }

    // 保留最近30天数据
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const cutoff = thirtyDaysAgo.toISOString().split('T')[0]
    analytics.value.daily = analytics.value.daily.filter(d => d.date >= cutoff)
  }

  // 获取今日统计
  const todayStats = computed(() => {
    const today = new Date().toISOString().split('T')[0]
    return analytics.value.daily.find(d => d.date === today) || {
      date: today, views: 0, clicks: 0, conversions: 0, revenue: 0
    }
  })

  // 获取本周统计
  const weekStats = computed(() => {
    const stats = { views: 0, clicks: 0, conversions: 0, revenue: 0 }
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    analytics.value.daily.forEach(d => {
      if (d.date >= weekAgo.toISOString().split('T')[0]) {
        stats.views += d.views
        stats.clicks += d.clicks
        stats.conversions += d.conversions
        stats.revenue += d.revenue
      }
    })

    return stats
  })

  // 获取本月统计
  const monthStats = computed(() => {
    const stats = { views: 0, clicks: 0, conversions: 0, revenue: 0 }
    const now = new Date()
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    analytics.value.daily.forEach(d => {
      if (d.date >= monthAgo.toISOString().split('T')[0]) {
        stats.views += d.views
        stats.clicks += d.clicks
        stats.conversions += d.conversions
        stats.revenue += d.revenue
      }
    })

    return stats
  })

  // 获取趋势（相比上期）
  const trend = computed(() => {
    const week = weekStats.value
    return {
      views: Math.random() * 20 - 10, // 模拟
      clicks: Math.random() * 20 - 10,
      conversions: Math.random() * 20 - 10,
      revenue: Math.random() * 20 - 10
    }
  })

  // 常用追踪方法
  const trackPageView = (page: string) => track('view', 'pageview', page)
  const trackClick = (element: string) => track('click', 'element', element)
  const trackTemplateUse = (templateId: string) => track('template', 'use', templateId)
  const trackPresentationCreate = () => track('presentation', 'create')
  const trackExport = (format: string) => track('export', 'download', format)
  const trackShare = (platform: string) => track('share', 'share', platform)

  // 保存事件
  const saveEvents = () => {
    try {
      localStorage.setItem('analytics_events', JSON.stringify(events.value.slice(-100)))
      localStorage.setItem('analytics_data', JSON.stringify(analytics.value))
    } catch { /* ignore */ }
  }

  // 加载事件
  const loadEvents = () => {
    try {
      const stored = localStorage.getItem('analytics_events')
      if (stored) events.value = JSON.parse(stored)

      const storedData = localStorage.getItem('analytics_data')
      if (storedData) analytics.value = JSON.parse(storedData)
    } catch { /* ignore */ }
  }

  // 清除数据
  const clearData = () => {
    events.value = []
    analytics.value = {
      daily: [],
      user: { totalUsers: 0, activeUsers: 0, newUsers: 0, returningUsers: 0 },
      content: { templates: 0, presentations: 0, exports: 0, shares: 0 }
    }
    localStorage.removeItem('analytics_events')
    localStorage.removeItem('analytics_data')
  }

  // 获取事件统计
  const eventStats = computed(() => ({
    total: events.value.length,
    byCategory: events.value.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    byAction: events.value.reduce((acc, e) => {
      acc[e.action] = (acc[e.action] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }))

  return {
    events,
    analytics,
    todayStats,
    weekStats,
    monthStats,
    trend,
    eventStats,
    track,
    trackPageView,
    trackClick,
    trackTemplateUse,
    trackPresentationCreate,
    trackExport,
    trackShare,
    loadEvents,
    clearData
  }
}

export default useDataStatisticsManager
