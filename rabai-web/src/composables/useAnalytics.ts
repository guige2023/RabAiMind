import { ref, computed } from 'vue'
import axios from 'axios'

export interface AnalyticsSummary {
  total_generations: number
  total_slides: number
  total_time_seconds: number
  avg_time_seconds: number
  avg_slides_per_ppt: number
  unique_templates_used: number
  unique_styles_used: number
}

export interface PopularItem {
  name: string
  count: number
}

export interface WeeklyActivityRow {
  day: string
  day_idx: string
  [hour: string]: any
}

export interface DailyStat {
  date: string
  day_label: string
  weekday: string
  weekday_label: string
  count: number
}

export interface CarbonFootprint {
  total_slides: number
  time_saved_minutes: number
  time_saved_hours: number
  kg_co2_saved: number
  trees_equivalent: number
  paper_sheets_saved: number
  liters_water_saved: number
}

export interface MostUsedFeature {
  name: string
  count: number
  category: string
  rank: number
}

export interface AnalyticsData {
  success: boolean
  user_id: string
  summary: AnalyticsSummary
  popular_templates: PopularItem[]
  popular_styles: PopularItem[]
  popular_scenes: PopularItem[]
  weekly_activity: WeeklyActivityRow[]
  productivity_score: number
  daily_stats: DailyStat[]
  carbon_footprint: CarbonFootprint
  most_used_features: MostUsedFeature[]
}

const API_BASE = '/api/v1'

const analyticsData = ref<AnalyticsData | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const lastFetched = ref<Date | null>(null)

export function useAnalytics() {
  const fetchAnalytics = async (force = false) => {
    // Cache for 30 seconds
    if (!force && analyticsData.value && lastFetched.value) {
      const age = (Date.now() - lastFetched.value.getTime()) / 1000
      if (age < 30) return
    }

    loading.value = true
    error.value = null

    try {
      const resp = await axios.get<AnalyticsData>(`${API_BASE}/analytics`)
      analyticsData.value = resp.data
      lastFetched.value = new Date()
    } catch (err: any) {
      error.value = err?.response?.data?.detail || err.message || '加载分析数据失败'
    } finally {
      loading.value = false
    }
  }

  const exportCSV = () => {
    window.open(`${API_BASE}/analytics/export/csv`, '_blank')
  }

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}秒`
    const m = Math.floor(seconds / 60)
    const s = Math.round(seconds % 60)
    return `${m}分${s}秒`
  }

  const productivityLabel = computed(() => {
    const score = analyticsData.value?.productivity_score ?? 0
    if (score >= 80) return { label: '卓越', color: '#52c41a' }
    if (score >= 60) return { label: '优秀', color: '#1890ff' }
    if (score >= 40) return { label: '良好', color: '#faad14' }
    if (score >= 20) return { label: '一般', color: '#fa8c16' }
    return { label: '起步中', color: '#d9d9d9' }
  })

  const chartColors = [
    '#165DFF', '#00B42A', '#FF7D00', '#F53FAD', '#722ED1',
    '#0FC6C2', '#FADB14', '#EB5757', '#2D8768', '#33679A'
  ]

  return {
    analyticsData,
    loading,
    error,
    fetchAnalytics,
    exportCSV,
    formatTime,
    productivityLabel,
    chartColors,
  }
}
