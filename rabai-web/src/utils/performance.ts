// Performance monitoring utility
import { Directive } from 'vue'

interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
}

interface PerformanceReport {
  pageLoad: number
  firstPaint: number
  firstContentfulPaint: number
  domContentLoaded: number
  resourceTiming: PerformanceMetric[]
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

  const timing = window.performance.timing
  const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming

  const metrics = {
    pageLoad: navigation ? navigation.loadEventEnd - navigation.fetchStart : 0,
    firstPaint: window.performance.getEntriesByType('paint')[0]?.startTime || 0,
    domContentLoaded: timing.domContentLoadedEventEnd - timing.fetchStart,
    fetchStart: timing.fetchStart,
    domInteractive: timing.domInteractive - timing.fetchStart,
    loadEventEnd: timing.loadEventEnd - timing.fetchStart
  }

  if (isDev) {
    console.log('📊 Performance Metrics:', metrics)
  }

  // Store in localStorage for analytics
  try {
    const reports = JSON.parse(localStorage.getItem('perf_reports') || '[]')
    reports.push({
      ...metrics,
      url: window.location.pathname,
      timestamp: Date.now()
    })
    // Keep last 10 reports
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

  // Largest Contentful Paint
  const lcpEntry = window.performance.getEntriesByType('largest-contentful-paint')[0]

  if (lcpEntry) {
    onPerfEntry({
      name: 'LCP',
      value: lcpEntry.startTime,
      delta: lcpEntry.startTime
    })
  }
}

// Get performance summary
export const getPerformanceSummary = (): PerformanceReport | null => {
  if (!window.performance) return null

  const timing = window.performance.timing
  const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming

  return {
    pageLoad: navigation ? navigation.loadEventEnd - navigation.fetchStart : 0,
    firstPaint: window.performance.getEntriesByType('paint')[0]?.startTime || 0,
    firstContentfulPaint: window.performance.getEntriesByType('paint')
      .find((e) => e.name === 'first-contentful-paint')?.startTime || 0,
    domContentLoaded: timing.domContentLoadedEventEnd - timing.fetchStart,
    resourceTiming: window.performance.getEntriesByType('resource').map((r) => ({
      name: r.name,
      value: r.duration,
      timestamp: r.startTime
    }))
  }
}
