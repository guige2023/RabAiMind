import { ref, computed } from 'vue'
import axios from 'axios'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RecentPresentation {
  task_id: string
  title: string
  scene: string
  style: string
  template: string
  slide_count: number
  status: string
  created_at: string | null
  updated_at: string | null
  duration_seconds: number | null
  thumbnail: string | null
}

export interface WeeklyStat {
  date: string
  day_label: string
  weekday: string
  weekday_label: string
  count: number
}

export interface SuggestedTemplate {
  name: string
  scene: string
  style: string
  reason: string
}

export interface TeamActivity {
  id: string
  activity_type: string
  user_id: string
  user_name: string
  user_avatar: string
  target: string
  details: string
  slide_num: number | null
  timestamp: number
}

export interface DashboardSummary {
  total_presentations: number
  total_slides: number
  this_week_presentations: number
  this_week_slides: number
  avg_slides_per_ppt: number
  top_scene: string
  top_style: string
}

export interface DashboardData {
  success: boolean
  user_id: string
  recent_presentations: RecentPresentation[]
  weekly_stats: WeeklyStat[]
  suggested_templates: SuggestedTemplate[]
  team_activity: TeamActivity[]
  summary: DashboardSummary
}

// ─── Activity display config ──────────────────────────────────────────────────

const ACTIVITY_CONFIG: Record<string, { icon: string; color: string }> = {
  create_slide:  { icon: '➕', color: '#5856D6' },
  delete_slide:  { icon: '🗑️', color: '#FF3B30' },
  edit:          { icon: '✏️', color: '#165DFF' },
  regenerate:    { icon: '🔄', color: '#FF9500' },
  apply_template:{ icon: '🎨', color: '#AF52DE' },
  download:      { icon: '⬇️', color: '#007AFF' },
  share:         { icon: '📤', color: '#34C759' },
  join:          { icon: '🎉', color: '#00C850' },
  leave:         { icon: '👋', color: '#888888' },
  comment:       { icon: '💬', color: '#5856D6' },
  suggest:       { icon: '💡', color: '#FF9500' },
  resolve:       { icon: '✅', color: '#00C850' },
}

const getActivityDisplay = (type: string) => {
  return ACTIVITY_CONFIG[type] || { icon: '📋', color: '#888888' }
}

// ─── Composable ───────────────────────────────────────────────────────────────

const API_BASE = '/api/v1'
const CACHE_TTL = 30_000 // 30 seconds

const cached = ref<DashboardData | null>(null)
const cachedAt = ref<number>(0)
const loading = ref(false)
const error = ref<string | null>(null)

export function useDashboard() {
  const fetchDashboard = async (force = false) => {
    const now = Date.now()
    if (!force && cached.value && (now - cachedAt.value) < CACHE_TTL) {
      return cached.value
    }

    loading.value = true
    error.value = null

    try {
      const resp = await axios.get<DashboardData>(`${API_BASE}/dashboard`)
      cached.value = resp.data
      cachedAt.value = Date.now()
      return resp.data
    } catch (err: any) {
      error.value = err?.response?.data?.detail || err.message || '加载仪表盘失败'
      return null
    } finally {
      loading.value = false
    }
  }

  const recentPresentations = computed(() => cached.value?.recent_presentations ?? [])
  const weeklyStats = computed(() => cached.value?.weekly_stats ?? [])
  const suggestedTemplates = computed(() => cached.value?.suggested_templates ?? [])
  const teamActivity = computed(() => cached.value?.team_activity ?? [])
  const summary = computed(() => cached.value?.summary ?? {
    total_presentations: 0,
    total_slides: 0,
    this_week_presentations: 0,
    this_week_slides: 0,
    avg_slides_per_ppt: 0,
    top_scene: 'business',
    top_style: 'professional',
  })

  const weeklyMaxCount = computed(() => {
    const stats = weeklyStats.value
    if (!stats.length) return 1
    return Math.max(...stats.map(s => s.count), 1)
  })

  const formatRelativeTime = (timestamp: number): string => {
    const now = Date.now()
    const diff = Math.floor((now - timestamp) / 1000)
    if (diff < 60) return '刚刚'
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
    return `${Math.floor(diff / 86400)}天前`
  }

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return ''
    if (seconds < 60) return `${seconds}秒`
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return s > 0 ? `${m}分${s}秒` : `${m}分钟`
  }

  const formatCreatedAt = (isoStr: string | null): string => {
    if (!isoStr) return ''
    try {
      const d = new Date(isoStr)
      const now = new Date()
      const diffMs = now.getTime() - d.getTime()
      const diffDays = Math.floor(diffMs / 86400000)
      if (diffDays === 0) return '今天'
      if (diffDays === 1) return '昨天'
      if (diffDays < 7) return `${diffDays}天前`
      return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
    } catch {
      return ''
    }
  }

  const getActivityInfo = (activity: TeamActivity) => {
    const config = getActivityDisplay(activity.activity_type)
    return {
      ...config,
      text: activity.details || activity.activity_type,
      relativeTime: formatRelativeTime(activity.timestamp),
    }
  }

  const sceneLabels: Record<string, string> = {
    business: '💼 商务',
    education: '📚 教育',
    tech: '🚀 科技',
    creative: '💡 创意',
    marketing: '📣 营销',
    default: '📄 通用',
  }

  const getSceneLabel = (scene: string) => sceneLabels[scene] || `📄 ${scene}`

  return {
    fetchDashboard,
    loading,
    error,
    recentPresentations,
    weeklyStats,
    suggestedTemplates,
    teamActivity,
    summary,
    weeklyMaxCount,
    formatRelativeTime,
    formatDuration,
    formatCreatedAt,
    getActivityInfo,
    getSceneLabel,
  }
}
