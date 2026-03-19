// Data statistics composable - 数据统计功能
import { ref, computed, onMounted } from 'vue'

export interface StatItem {
  label: string
  value: number
  change?: number
  icon: string
}

export interface UsageData {
  date: string
  count: number
}

export interface ChartData {
  labels: string[]
  values: number[]
}

export function useDataStatistics() {
  const isLoading = ref(false)
  const totalCreations = ref(0)
  const totalDownloads = ref(0)
  const totalShares = ref(0)
  const activeUsers = ref(0)
  const usageHistory = ref<UsageData[]>([])

  // 加载统计数据
  const loadStatistics = (): void => {
    isLoading.value = true

    try {
      // 从localStorage加载
      const stats = localStorage.getItem('app_statistics')
      if (stats) {
        const data = JSON.parse(stats)
        totalCreations.value = data.totalCreations || 0
        totalDownloads.value = data.totalDownloads || 0
        totalShares.value = data.totalShares || 0
        activeUsers.value = data.activeUsers || 0
        usageHistory.value = data.usageHistory || []
      }

      // 如果没有数据，初始化示例数据
      if (usageHistory.value.length === 0) {
        initSampleData()
      }
    } catch {
      initSampleData()
    }

    isLoading.value = false
  }

  // 初始化示例数据
  const initSampleData = (): void => {
    const today = new Date()
    const history: UsageData[] = []

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      history.push({
        date: date.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 20) + 5
      })
    }

    usageHistory.value = history
    totalCreations.value = history.reduce((sum, item) => sum + item.count, 0)
    totalDownloads.value = Math.floor(totalCreations.value * 0.8)
    totalShares.value = Math.floor(totalCreations.value * 0.3)
    activeUsers.value = Math.floor(Math.random() * 100) + 50

    saveStatistics()
  }

  // 保存统计数据
  const saveStatistics = (): void => {
    try {
      const data = {
        totalCreations: totalCreations.value,
        totalDownloads: totalDownloads.value,
        totalShares: totalShares.value,
        activeUsers: activeUsers.value,
        usageHistory: usageHistory.value,
        lastUpdated: Date.now()
      }
      localStorage.setItem('app_statistics', JSON.stringify(data))
    } catch {
      // ignore
    }
  }

  // 记录创建
  const recordCreation = (): void => {
    totalCreations.value++

    // 更新今日统计
    const today = new Date().toISOString().split('T')[0]
    const todayData = usageHistory.value.find(h => h.date === today)
    if (todayData) {
      todayData.count++
    } else {
      usageHistory.value.push({ date: today, count: 1 })
    }

    // 只保留30天数据
    if (usageHistory.value.length > 30) {
      usageHistory.value = usageHistory.value.slice(-30)
    }

    saveStatistics()
  }

  // 记录下载
  const recordDownload = (): void => {
    totalDownloads.value++
    saveStatistics()
  }

  // 记录分享
  const recordShare = (): void => {
    totalShares.value++
    saveStatistics()
  }

  // 统计数据列表
  const statItems = computed((): StatItem[] => [
    { label: '创作总数', value: totalCreations.value, change: 12, icon: '✨' },
    { label: '下载次数', value: totalDownloads.value, change: 8, icon: '⬇️' },
    { label: '分享次数', value: totalShares.value, change: -3, icon: '📤' },
    { label: '活跃用户', value: activeUsers.value, change: 15, icon: '👥' }
  ])

  // 图表数据
  const chartData = computed((): ChartData => ({
    labels: usageHistory.value.map(h => {
      const date = new Date(h.date)
      return `${date.getMonth() + 1}/${date.getDate()}`
    }),
    values: usageHistory.value.map(h => h.count)
  }))

  // 获取本周统计
  const weeklyStats = computed(() => {
    const today = new Date()
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

    const weekData = usageHistory.value.filter(h => new Date(h.date) >= weekAgo)
    const total = weekData.reduce((sum, h) => sum + h.count, 0)

    return {
      total,
      average: Math.round(total / 7),
      trend: weekData[weekData.length - 1]?.count || 0
    }
  })

  // 获取本月统计
  const monthlyStats = computed(() => {
    const today = new Date()
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    const monthData = usageHistory.value.filter(h => new Date(h.date) >= monthAgo)
    const total = monthData.reduce((sum, h) => sum + h.count, 0)

    return {
      total,
      average: Math.round(total / 30),
      trend: monthData[monthData.length - 1]?.count || 0
    }
  })

  // 导出统计数据
  const exportStats = (): string => {
    return JSON.stringify({
      generatedAt: new Date().toISOString(),
      summary: {
        totalCreations: totalCreations.value,
        totalDownloads: totalDownloads.value,
        totalShares: totalShares.value,
        activeUsers: activeUsers.value
      },
      history: usageHistory.value
    }, null, 2)
  }

  // 初始化
  onMounted(() => {
    loadStatistics()
  })

  return {
    isLoading,
    totalCreations,
    totalDownloads,
    totalShares,
    activeUsers,
    usageHistory,
    statItems,
    chartData,
    weeklyStats,
    monthlyStats,
    loadStatistics,
    recordCreation,
    recordDownload,
    recordShare,
    exportStats
  }
}

export default useDataStatistics
