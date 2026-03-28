// Performance monitoring utility
import { Directive } from 'vue'

interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
}

interface WebVitalsMetric {
  id: string
  name: string
  value: number
  delta: number
  rating?: 'good' | 'needs-improvement' | 'poor'
}

interface PerformanceReport {
  pageLoad: number
  firstPaint: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  firstInputDelay: number
  cumulativeLayoutShift: number
  timeToInteractive: number
  domContentLoaded: number
  resourceTiming: PerformanceMetric[]
}

// 性能等级评估
const getRating = (name: string, value: number): 'good' | 'needs-improvement' | 'poor' => {
  const thresholds = {
    // FCP (First Contentful Paint) - ms
    'FCP': { good: 1800, poor: 3000 },
    // LCP (Largest Contentful Paint) - ms
    'LCP': { good: 2500, poor: 4000 },
    // FID (First Input Delay) - ms
    'FID': { good: 100, poor: 300 },
    // CLS (Cumulative Layout Shift) - score
    'CLS': { good: 0.1, poor: 0.25 },
    // TTFB (Time to First Byte) - ms
    'TTFB': { good: 800, poor: 1800 },
    // INP (Interaction to Next Paint) - ms
    'INP': { good: 200, poor: 500 }
  }

  const threshold = thresholds[name as keyof typeof thresholds]
  if (!threshold) return 'good'

  if (value <= threshold.good) return 'good'
  if (value <= threshold.poor) return 'needs-improvement'
  return 'poor'
}

// 图片懒加载指令
export const lazyLoad: Directive<HTMLImageElement, string> = {
  mounted(el, binding) {
    // 使用IntersectionObserver实现懒加载
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement
            img.src = binding.value
            img.removeAttribute('data-src')
            observer.unobserve(img)
          }
        })
      }, {
        rootMargin: '50px',
        threshold: 0.1
      })

      el.dataset.src = binding.value
      observer.observe(el)
    } else {
      // 降级处理：直接加载
      el.src = binding.value
    }
  },
  updated(el, binding) {
    if (el.src !== binding.value) {
      el.src = binding.value
    }
  }
}

// 防抖函数
export const debounce = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timer: number | null = null
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer)
    timer = window.setTimeout(() => fn(...args), delay)
  }
}

// 节流函数
export const throttle = <T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Report to console in development
const isDev = import.meta.env.DEV

// Track page load metrics
export const trackPageLoad = (): void => {
  if (!window.performance) return

  const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming

  if (!navigation) return

  const metrics = {
    pageLoad: navigation.loadEventEnd - navigation.fetchStart,
    firstPaint: window.performance.getEntriesByType('paint')[0]?.startTime || 0,
    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
    fetchStart: navigation.fetchStart,
    domInteractive: navigation.domInteractive - navigation.fetchStart,
    loadEventEnd: navigation.loadEventEnd - navigation.fetchStart
  }

  if (isDev) {
    console.log('📊 Performance Metrics:', metrics)
  }

  try {
    const reports = JSON.parse(localStorage.getItem('perf_reports') || '[]')
    reports.push({
      ...metrics,
      url: window.location.pathname,
      timestamp: Date.now()
    })
    localStorage.setItem('perf_reports', JSON.stringify(reports.slice(-10)))
  } catch (e) {
    // Ignore storage errors
  }
}

// Measure API response time
export const measureApiTime = async <T>(
  apiName: string,
  request: () => Promise<T>
): Promise<T> => {
  const start = performance.now()

  try {
    const result = await request()
    const duration = performance.now() - start

    if (isDev) {
      console.log(`⚡ API [${apiName}]: ${duration.toFixed(2)}ms`)
    }

    return result
  } catch (error) {
    const duration = performance.now() - start

    if (isDev) {
      console.error(`❌ API [${apiName}] failed after ${duration.toFixed(2)}ms`)
    }

    throw error
  }
}

// Custom timing for code blocks
export const createTimer = (label: string) => {
  const start = performance.now()

  return {
    stop: () => {
      const duration = performance.now() - start
      if (isDev) {
        console.log(`⏱️ [${label}]: ${duration.toFixed(2)}ms`)
      }
      return duration
    }
  }
}

// Web Vitals monitoring (basic)
export const reportWebVitals = (onPerfEntry?: (metric: any) => void): void => {
  if (!window.performance || !onPerfEntry) return

  // First Contentful Paint
  const fcpEntry = window.performance.getEntriesByType('paint').find(
    (entry) => entry.name === 'first-contentful-paint'
  )

  if (fcpEntry) {
    onPerfEntry({
      name: 'FCP',
      value: fcpEntry.startTime,
      delta: fcpEntry.startTime
    })
  }

  // Largest Contentful Paint - use PerformanceObserver for better compatibility
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      onPerfEntry({
        name: 'LCP',
        value: lastEntry.startTime,
        delta: lastEntry.startTime
      })
    })
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })
  } catch (e) {
    // LCP not supported, ignore
  }
}

// Get performance summary
export const getPerformanceSummary = (): PerformanceReport | null => {
  if (!window.performance) return null

  const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
  if (!navigation) return null

  // Get LCP
  const lcpEntry = window.performance.getEntriesByType('largest-contentful-paint')[0] as any

  // Get FID (First Input Delay)
  const fidEntry = window.performance.getEntriesByType('first-input')[0] as any

  // Get CLS (Cumulative Layout Shift)
  let clsValue = 0
  if ('LayoutShift' in window) {
    const layoutShiftEntries = (window.performance as any).getEntriesByType('layout-shift') as any[]
    clsValue = layoutShiftEntries.reduce((sum, entry) => sum + (entry.hadRecentInput ? 0 : entry.value), 0)
  }

  return {
    pageLoad: navigation.loadEventEnd - navigation.fetchStart,
    firstPaint: window.performance.getEntriesByType('paint')[0]?.startTime || 0,
    firstContentfulPaint: window.performance.getEntriesByType('paint')
      .find((e) => e.name === 'first-contentful-paint')?.startTime || 0,
    largestContentfulPaint: lcpEntry?.startTime || 0,
    firstInputDelay: fidEntry?.processingStart - fidEntry?.startTime || 0,
    cumulativeLayoutShift: clsValue,
    timeToInteractive: navigation.loadEventEnd - navigation.fetchStart,
    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
    resourceTiming: window.performance.getEntriesByType('resource').map((r) => ({
      name: r.name,
      value: r.duration,
      timestamp: r.startTime
    }))
  }
}

// 发送性能数据到分析服务
export const sendToAnalytics = (metric: WebVitalsMetric): void => {
  // 开发环境只打印
  if (isDev) {
    console.log(`📈 Web Vitals [${metric.name}]: ${metric.value.toFixed(2)}ms (${metric.rating})`)
    return
  }

  // 生产环境发送到分析服务
  try {
    // 可以发送到Google Analytics、Mixpanel等
    if (typeof (window as any).gtag === 'function') {
      (window as any).gtag('event', metric.name, {
        event_category: 'Web Vitals',
        event_label: metric.id,
        value: Math.round(metric.value),
        non_interaction: true
      })
    }
  } catch (e) {
    // 忽略发送失败
  }
}

// 完整的Web Vitals监控
export const initWebVitals = (): void => {
  // 监控CLS
  if ('LayoutShift' in window) {
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as any) {
        if (!entry.hadRecentInput) {
          const metric: WebVitalsMetric = {
            id: 'cls',
            name: 'CLS',
            value: (window.performance as any).getEntriesByType('layout-shift')
              .reduce((sum: number, e: any) => sum + (e.hadRecentInput ? 0 : e.value), 0),
            delta: entry.value,
            rating: getRating('CLS', entry.value)
          }
          sendToAnalytics(metric)
        }
      }
    })
    clsObserver.observe({ type: 'layout-shift', buffered: true })
  }

  // 监控LCP
  const lcpObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries()
    const lastEntry = entries[entries.length - 1] as any
    const metric: WebVitalsMetric = {
      id: 'lcp',
      name: 'LCP',
      value: lastEntry.startTime,
      delta: lastEntry.startTime,
      rating: getRating('LCP', lastEntry.startTime)
    }
    sendToAnalytics(metric)
  })
  lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })

  // 监控INP
  const inpObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries() as any) {
      if (entry.interactionId) {
        const metric: WebVitalsMetric = {
          id: 'inp',
          name: 'INP',
          value: entry.duration,
          delta: entry.duration,
          rating: getRating('INP', entry.duration)
        }
        sendToAnalytics(metric)
      }
    }
  })
  inpObserver.observe({ type: 'event', buffered: true, entryTypes: ['event'] })
}

// 获取慢请求列表
export const getSlowRequests = (threshold = 1000): PerformanceMetric[] => {
  if (!window.performance) return []

  return window.performance.getEntriesByType('resource')
    .filter(r => r.duration > threshold)
    .map(r => ({
      name: r.name,
      value: r.duration,
      timestamp: r.startTime
    }))
    .sort((a, b) => b.value - a.value)
}
