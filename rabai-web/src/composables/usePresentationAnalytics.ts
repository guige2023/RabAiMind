// Presentation Analytics Composable
// Tracks view sessions, slide time, heatmaps, scroll depth

import { ref } from 'vue'

export interface HeatmapPoint {
  x: number   // 0.0-1.0 (normalized)
  y: number   // 0.0-1.0 (normalized)
  weight: number
}

export interface SlideStats {
  slide_index: number
  view_count: number
  avg_time_seconds: number
  max_time_seconds: number
  min_time_seconds: number
  total_time_seconds: number
  heatmap_grid: Record<string, number>  // "x,y" -> weight
}

export interface ViewerInfo {
  viewer_id: string
  viewer_name: string
  session_count: number
  first_view: string
  last_view: string
  total_duration_seconds: number
}

export interface EffectivenessScore {
  total: number
  reach_score: number
  depth_score: number
  engagement_score: number
  hotspot_score: number
  completion_score: number
}

export interface PresentationAnalytics {
  success: boolean
  task_id: string
  total_views: number
  unique_viewers: number
  viewer_list: ViewerInfo[]
  slide_stats: SlideStats[]
  avg_scroll_depth_percent: number
  scroll_depth_reached_end_count: number
  scroll_depth_samples: number
  heatmap_grid_size: number
  overview_heatmap: Record<string, number>  // "x,y" -> normalized weight
  effectiveness_score?: EffectivenessScore
}

const API_BASE = '/api/v1/presentation-analytics'

// Singleton session state
let activeSessionId: string | null = null
let currentSlideIndex = 0
let slideEnterTime: number = 0
let heartbeatTimer: ReturnType<typeof setInterval> | null = null
let heatmapBuffer: HeatmapPoint[] = []
let heatmapFlushTimer: ReturnType<typeof setInterval> | null = null

// User identity (anonymous by default)
function getViewerIdentity(): { viewer_id: string; viewer_name: string } {
  const stored = localStorage.getItem('rabai_viewer_identity')
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch { /* ignore */ }
  }
  // Generate anonymous ID
  const anonId = 'anon_' + Math.random().toString(36).slice(2, 10)
  const identity = { viewer_id: anonId, viewer_name: 'Anonymous' }
  localStorage.setItem('rabai_viewer_identity', JSON.stringify(identity))
  return identity
}

// ---- Session Management ----

export async function startViewSession(taskId: string): Promise<string | null> {
  if (activeSessionId) {
    await endViewSession()  // end any existing session first
  }

  const { viewer_id, viewer_name } = getViewerIdentity()

  try {
    const res = await fetch(`${API_BASE}/view/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id: taskId, viewer_id, viewer_name }),
    })
    const data = await res.json()
    if (data.success) {
      activeSessionId = data.session_id
      currentSlideIndex = 0
      slideEnterTime = Date.now()

      // Start heartbeat every 5 seconds
      heartbeatTimer = setInterval(() => {
        sendHeartbeat()
      }, 5000)

      // Start heatmap flush every 3 seconds
      heatmapFlushTimer = setInterval(() => {
        flushHeatmap()
      }, 3000)

      return activeSessionId
    }
  } catch (e) {
    console.warn('startViewSession failed:', e)
  }
  return null
}

export async function endViewSession(): Promise<void> {
  if (!activeSessionId) return

  // Send final heartbeat
  await sendHeartbeat()

  // Flush remaining heatmap
  await flushHeatmap()

  // Calculate total duration
  const now = Date.now()
  const duration = (now - slideEnterTime) / 1000

  if (heartbeatTimer) {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }
  if (heatmapFlushTimer) {
    clearInterval(heatmapFlushTimer)
    heatmapFlushTimer = null
  }

  try {
    await fetch(`${API_BASE}/view/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: activeSessionId, duration_seconds: duration }),
    })
  } catch (e) {
    console.warn('endViewSession failed:', e)
  }

  activeSessionId = null
}

// ---- Heartbeat ----

async function sendHeartbeat(): Promise<void> {
  if (!activeSessionId) return

  const now = Date.now()
  const duration = (now - slideEnterTime) / 1000

  try {
    await fetch(`${API_BASE}/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: activeSessionId,
        slide_index: currentSlideIndex,
        duration_seconds: duration,
      }),
    })
    // Update enter time after sending
    slideEnterTime = now
  } catch (e) {
    console.warn('heartbeat failed:', e)
  }
}

export function notifySlideChange(newSlideIndex: number): void {
  // Send heartbeat for previous slide before switching
  if (activeSessionId) {
    sendHeartbeat()
  }
  currentSlideIndex = newSlideIndex
  slideEnterTime = Date.now()
}

// ---- Heatmap ----

export function recordHeatmapPoint(x: number, y: number, weight: number = 1): void {
  if (!activeSessionId) return
  // Normalize coordinates to 0-1
  const nx = Math.max(0, Math.min(1, x))
  const ny = Math.max(0, Math.min(1, y))
  heatmapBuffer.push({ x: nx, y: ny, weight })
}

export function recordHeatmapFromMouseEvent(event: MouseEvent, target: HTMLElement): void {
  if (!activeSessionId || !target) return
  const rect = target.getBoundingClientRect()
  const x = (event.clientX - rect.left) / rect.width
  const y = (event.clientY - rect.top) / rect.height
  recordHeatmapPoint(x, y, 1)
}

async function flushHeatmap(): Promise<void> {
  if (!activeSessionId || heatmapBuffer.length === 0) return

  const points = [...heatmapBuffer]
  heatmapBuffer = []

  try {
    await fetch(`${API_BASE}/heatmap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: activeSessionId,
        slide_index: currentSlideIndex,
        points,
      }),
    })
  } catch (e) {
    // Put points back in buffer on failure
    heatmapBuffer = [...points, ...heatmapBuffer]
    console.warn('flushHeatmap failed:', e)
  }
}

// ---- Scroll Depth ----

export function trackScrollDepth(scrollPercent: number): void {
  if (!activeSessionId) return
  fetch(`${API_BASE}/scroll`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: activeSessionId,
      scroll_percent: Math.max(0, Math.min(100, scrollPercent)),
    }),
  }).catch(e => console.warn('trackScrollDepth failed:', e))
}

// Setup scroll listener for web-hosted presentations
export function setupScrollTracking(element: HTMLElement): () => void {
  if (!activeSessionId) return () => {}

  const handler = () => {
    const scrollTop = element.scrollTop
    const scrollHeight = element.scrollHeight - element.clientHeight
    if (scrollHeight > 0) {
      const percent = (scrollTop / scrollHeight) * 100
      trackScrollDepth(percent)
    }
  }

  element.addEventListener('scroll', handler, { passive: true })
  return () => element.removeEventListener('scroll', handler)
}

// ---- Analytics Fetch ----

export async function fetchPresentationAnalytics(taskId: string): Promise<PresentationAnalytics | null> {
  try {
    const res = await fetch(`${API_BASE}/${taskId}`)
    const data = await res.json()
    return data as PresentationAnalytics
  } catch (e) {
    console.warn('fetchPresentationAnalytics failed:', e)
    return null
  }
}

export async function exportAnalyticsPDF(taskId: string): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/${taskId}/report`)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const contentDisposition = res.headers.get('Content-Disposition')
    let filename = `analytics_${taskId}.pdf`
    if (contentDisposition) {
      const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
      if (match) filename = match[1].replace(/['"]/g, '')
    }
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (e) {
    console.warn('exportAnalyticsPDF failed:', e)
    throw e
  }
}

// ---- Vue Composable ----

export function usePresentationAnalytics() {
  const analytics = ref<PresentationAnalytics | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const loadAnalytics = async (taskId: string) => {
    loading.value = true
    error.value = null
    try {
      analytics.value = await fetchPresentationAnalytics(taskId)
    } catch (e: any) {
      error.value = e.message || '加载分析数据失败'
    } finally {
      loading.value = false
    }
  }

  const exportPDF = async (taskId: string) => {
    await exportAnalyticsPDF(taskId)
  }

  return {
    analytics,
    loading,
    error,
    loadAnalytics,
    exportPDF,
    startViewSession,
    endViewSession,
    notifySlideChange,
    recordHeatmapPoint,
    recordHeatmapFromMouseEvent,
    setupScrollTracking,
    trackScrollDepth,
  }
}
