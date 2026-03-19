// User Experience Enhancer - 用户体验增强
import { ref, computed } from 'vue'

export interface UXEvent {
  id: string
  type: 'click' | 'hover' | 'input' | 'navigate' | 'error' | 'success'
  target: string
  timestamp: number
  data?: any
}

export interface UXMetrics {
  clickCount: number
  hoverCount: number
  inputCount: number
  navigationCount: number
  errorCount: number
  successCount: number
}

export interface UXSettings {
  enableTracking: boolean
  enableAnalytics: boolean
  enableFeedback: boolean
  enableAnimations: boolean
}

export function useUserExperienceEnhancer() {
  const events = ref<UXEvent[]>([])
  const session = ref({
    id: `session_${Date.now()}`,
    startTime: Date.now(),
    pageViews: 0,
    interactions: 0
  })
  const settings = ref<UXSettings>({
    enableTracking: true,
    enableAnalytics: true,
    enableFeedback: true,
    enableAnimations: true
  })

  const trackEvent = (type: UXEvent['type'], target: string, data?: any): void => {
    if (!settings.value.enableTracking) return
    const event: UXEvent = {
      id: `ux_${Date.now()}`,
      type,
      target,
      timestamp: Date.now(),
      data
    }
    events.value.unshift(event)
    if (events.value.length > 100) events.value.pop()
    session.value.interactions++
  }

  const trackClick = (target: string, data?: any) => trackEvent('click', target, data)
  const trackPageView = (page: string) => { session.value.pageViews++; trackEvent('navigate', page) }
  const trackError = (target: string, data?: any) => trackEvent('error', target, data)
  const trackSuccess = (target: string, data?: any) => trackEvent('success', target, data)

  const metrics = computed<UXMetrics>(() => ({
    clickCount: events.value.filter(e => e.type === 'click').length,
    hoverCount: events.value.filter(e => e.type === 'hover').length,
    inputCount: events.value.filter(e => e.type === 'input').length,
    navigationCount: events.value.filter(e => e.type === 'navigate').length,
    errorCount: events.value.filter(e => e.type === 'error').length,
    successCount: events.value.filter(e => e.type === 'success').length
  }))

  const stats = computed(() => ({
    totalEvents: events.value.length,
    sessionDuration: Date.now() - session.value.startTime,
    pageViews: session.value.pageViews,
    ...metrics.value
  }))

  return { events, session, settings, trackEvent, trackClick, trackPageView, trackError, trackSuccess, metrics, stats }
}

export default useUserExperienceEnhancer
