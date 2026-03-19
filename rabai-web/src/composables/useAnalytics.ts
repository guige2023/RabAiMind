// Analytics composable - 用户行为分析
import { ref, onMounted } from 'vue'

// 事件类型
type EventCategory = 'page' | 'action' | 'error' | 'performance' | 'conversion'
type EventAction =
  | 'page_view'
  | 'button_click'
  | 'form_submit'
  | 'ppt_create'
  | 'ppt_download'
  | 'ppt_share'
  | 'ppt_edit'
  | 'template_select'
  | 'style_select'
  | 'error_occurred'

interface AnalyticsEvent {
  category: EventCategory
  action: EventAction
  label?: string
  value?: number
  metadata?: Record<string, any>
  timestamp: number
}

interface UserSession {
  sessionId: string
  startTime: number
  pageViews: number
  events: AnalyticsEvent[]
}

// 生成会话ID
const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// 获取或创建会话
const getSession = (): UserSession => {
  const STORAGE_KEY = 'ppt_analytics_session'

  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const session = JSON.parse(saved) as UserSession
      // 会话超过30分钟则创建新会话
      if (Date.now() - session.startTime > 30 * 60 * 1000) {
        throw new Error('Session expired')
      }
      return session
    }
  } catch {
    // 忽略错误，创建新会话
  }

  const newSession: UserSession = {
    sessionId: generateSessionId(),
    startTime: Date.now(),
    pageViews: 0,
    events: []
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession))
  } catch {
    // 忽略存储错误
  }

  return newSession
}

// 保存会话
const saveSession = (session: UserSession): void => {
  try {
    localStorage.setItem('ppt_analytics_session', JSON.stringify(session))
  } catch {
    // 忽略错误
  }
}

// 发送事件到分析服务
const sendEvent = (event: AnalyticsEvent): void => {
  // 开发环境打印
  if (import.meta.env.DEV) {
    console.log('📊 Analytics:', event)
    return
  }

  // 生产环境发送到服务器
  try {
    const session = getSession()
    const payload = {
      ...event,
      sessionId: session.sessionId,
      url: window.location.pathname,
      referrer: document.referrer,
      userAgent: navigator.userAgent
    }

    // 发送到后端API（需要后端支持）
    // fetch('/api/v1/analytics/event', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(payload)
    // }).catch(() => {})

    // 也可以发送到Google Analytics
    if (typeof (window as any).gtag === 'function') {
      (window as any).gtag('event', event.action, {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
        ...event.metadata
      })
    }
  } catch {
    // 忽略发送失败
  }
}

// Analytics composable
export function useAnalytics() {
  const session = ref<UserSession>(getSession())

  // 页面浏览
  const trackPageView = (pageName: string, metadata?: Record<string, any>): void => {
    session.value.pageViews++

    const event: AnalyticsEvent = {
      category: 'page',
      action: 'page_view',
      label: pageName,
      metadata,
      timestamp: Date.now()
    }

    session.value.events.push(event)
    saveSession(session.value)
    sendEvent(event)
  }

  // 用户操作
  const trackAction = (
    action: EventAction,
    label?: string,
    value?: number,
    metadata?: Record<string, any>
  ): void => {
    const event: AnalyticsEvent = {
      category: 'action',
      action,
      label,
      value,
      metadata,
      timestamp: Date.now()
    }

    session.value.events.push(event)
    saveSession(session.value)
    sendEvent(event)
  }

  // 错误追踪
  const trackError = (errorType: string, errorMessage: string, metadata?: Record<string, any>): void => {
    const event: AnalyticsEvent = {
      category: 'error',
      action: 'error_occurred',
      label: errorType,
      metadata: { message: errorMessage, ...metadata },
      timestamp: Date.now()
    }

    session.value.events.push(event)
    saveSession(session.value)
    sendEvent(event)
  }

  // 性能追踪
  const trackPerformance = (metricName: string, value: number, rating?: string): void => {
    const event: AnalyticsEvent = {
      category: 'performance',
      action: metricName as any,
      value: Math.round(value),
      metadata: { rating },
      timestamp: Date.now()
    }

    session.value.events.push(event)
    saveSession(session.value)
    sendEvent(event)
  }

  // 转化追踪
  const trackConversion = (conversionType: string, value?: number): void => {
    const event: AnalyticsEvent = {
      category: 'conversion',
      action: conversionType as any,
      value,
      timestamp: Date.now()
    }

    session.value.events.push(event)
    saveSession(session.value)
    sendEvent(event)
  }

  // PPT创建
  const trackPptCreate = (slideCount: number, style: string, template: string): void => {
    trackAction('ppt_create', `${slideCount}页-${style}`, slideCount, { style, template })
  }

  // PPT下载
  const trackPptDownload = (format: string): void => {
    trackAction('ppt_download', format)
  }

  // PPT分享
  const trackPptShare = (platform: string): void => {
    trackAction('ppt_share', platform)
  }

  // PPT编辑
  const trackPptEdit = (editType: string): void => {
    trackAction('ppt_edit', editType)
  }

  // 模板选择
  const trackTemplateSelect = (templateId: string, templateName: string): void => {
    trackAction('template_select', templateName, undefined, { templateId })
  }

  // 风格选择
  const trackStyleSelect = (styleId: string, styleName: string): void => {
    trackAction('style_select', styleName, undefined, { styleId })
  }

  // 获取会话统计
  const getSessionStats = () => {
    return {
      sessionId: session.value.sessionId,
      duration: Date.now() - session.value.startTime,
      pageViews: session.value.pageViews,
      eventCount: session.value.events.length
    }
  }

  // 获取所有事件
  const getEvents = (category?: EventCategory) => {
    if (category) {
      return session.value.events.filter(e => e.category === category)
    }
    return session.value.events
  }

  // 清除会话数据
  const clearSession = (): void => {
    session.value = {
      sessionId: generateSessionId(),
      startTime: Date.now(),
      pageViews: 0,
      events: []
    }
    saveSession(session.value)
  }

  return {
    // 追踪方法
    trackPageView,
    trackAction,
    trackError,
    trackPerformance,
    trackConversion,
    trackPptCreate,
    trackPptDownload,
    trackPptShare,
    trackPptEdit,
    trackTemplateSelect,
    trackStyleSelect,
    // 统计数据
    getSessionStats,
    getEvents,
    clearSession
  }
}

export default useAnalytics
