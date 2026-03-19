// Loading Speed Optimizer - 加载速度优化
import { ref, computed, onMounted } from 'vue'

export interface ResourceHint {
  url: string
  type: 'preload' | 'prefetch' | 'dns-prefetch' | 'preconnect'
  as?: string
}

export interface LoadingStrategy {
  id: string
  name: string
  enabled: boolean
  description: string
}

export function useLoadingSpeedOptimizer() {
  // 加载指标
  const metrics = ref({
    pageLoadTime: 0,
    domContentLoaded: 0,
    firstPaint: 0,
    firstContentfulPaint: 0,
    largestContentfulPaint: 0,
    timeToInteractive: 0
  })

  // 优化策略
  const strategies = ref<LoadingStrategy[]>([
    { id: 'resourceHints', name: '资源提示', enabled: true, description: '使用preload、prefetch、preconnect' },
    { id: 'codeSplitting', name: '代码分割', enabled: true, description: '路由级代码分割' },
    { id: 'lazyLoading', name: '懒加载', enabled: true, description: '图片和组件懒加载' },
    { id: 'caching', name: '缓存优化', enabled: true, description: '本地缓存和Service Worker' },
    { id: 'compression', name: '压缩传输', enabled: true, description: 'Gzip/Brotli压缩' },
    { id: 'imageOptimization', name: '图片优化', enabled: true, description: 'WebP格式和响应式图片' },
    { id: 'criticalCSS', name: '关键CSS', enabled: false, description: '内联关键CSS' },
    { id: 'deferScripts', name: '延迟脚本', enabled: true, description: ' defer第三方脚本' }
  ])

  // 资源提示
  const resourceHints = ref<ResourceHint[]>([])

  // 预连接
  const preconnect = (url: string) => {
    const hint: ResourceHint = { url, type: 'preconnect' }
    resourceHints.value.push(hint)

    const link = document.createElement('link')
    link.rel = 'preconnect'
    link.href = url
    document.head.appendChild(link)
  }

  // DNS预解析
  const dnsPrefetch = (url: string) => {
    const hint: ResourceHint = { url, type: 'dns-prefetch' }
    resourceHints.value.push(hint)

    const link = document.createElement('link')
    link.rel = 'dns-prefetch'
    link.href = url
    document.head.appendChild(link)
  }

  // 预加载
  const preload = (url: string, as: string = 'script') => {
    const hint: ResourceHint = { url, type: 'preload', as }
    resourceHints.value.push(hint)

    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = url
    link.as = as
    document.head.appendChild(link)
  }

  // 预取
  const prefetch = (url: string) => {
    const hint: ResourceHint = { url, type: 'prefetch' }
    resourceHints.value.push(hint)

    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = url
    document.head.appendChild(link)
  }

  // 测量页面加载时间
  const measureLoadTime = () => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const paint = performance.getEntriesByType('paint')

    if (navigation) {
      metrics.value.pageLoadTime = navigation.loadEventEnd - navigation.startTime
      metrics.value.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.startTime
    }

    paint.forEach(entry => {
      if (entry.name === 'first-paint') {
        metrics.value.firstPaint = entry.startTime
      }
      if (entry.name === 'first-contentful-paint') {
        metrics.value.firstContentfulPaint = entry.startTime
      }
    })

    const lcp = performance.getEntriesByType('largest-contentful-paint') as PerformanceEntry[]
    if (lcp.length > 0) {
      metrics.value.largestContentfulPaint = lcp[lcp.length - 1].startTime
    }
  }

  // 异步加载脚本
  const loadScriptAsync = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = src
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`))
      document.head.appendChild(script)
    })
  }

  // 延迟加载脚本
  const loadScriptDeferred = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = src
      script.defer = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`))
      document.head.appendChild(script)
    })
  }

  // 动态导入模块
  const dynamicImport = async (modulePath: string) => {
    const startTime = performance.now()
    try {
      const module = await import(/* @vite-ignore */ modulePath)
      const loadTime = performance.now() - startTime
      console.log(`Module ${modulePath} loaded in ${loadTime.toFixed(2)}ms`)
      return module
    } catch (error) {
      console.error(`Failed to load module ${modulePath}:`, error)
      throw error
    }
  }

  // 图片懒加载
  const setupLazyLoading = (selector = 'img[data-src]') => {
    if (!('IntersectionObserver' in window)) return

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          if (img.dataset.src) {
            img.src = img.dataset.src
            if (img.dataset.srcset) img.srcset = img.dataset.srcset
            img.removeAttribute('data-src')
            img.removeAttribute('data-srcset')
            img.classList.add('loaded')
          }
          observer.unobserve(img)
        }
      })
    }, { rootMargin: '100px' })

    document.querySelectorAll(selector).forEach(img => observer.observe(img))
    return () => observer.disconnect()
  }

  // 组件懒加载
  const lazyLoadComponent = (componentPath: string) => {
    return () => import(`../components/${componentPath}.vue`)
  }

  // 优化字体加载
  const optimizeFontLoading = (fontFamily: string, fontUrl: string) => {
    // 使用Font Loading API
    if ('fonts' in document) {
      (document as any).fonts.load(`16px "${fontFamily}"`)
    }

    // 预加载字体
    preload(fontUrl, 'font')
  }

  // 缓存资源
  const cacheResource = async (url: string, response: Response): Promise<void> => {
    if ('caches' in window) {
      const cache = await caches.open('rabai-resources')
      await cache.put(url, response.clone())
    }
  }

  // 从缓存获取
  const getFromCache = async (url: string): Promise<Response | null> => {
    if (!('caches' in window)) return null

    try {
      const cache = await caches.open('rabai-resources')
      return await cache.match(url)
    } catch {
      return null
    }
  }

  // 性能评分
  const score = computed(() => {
    let s = 100

    if (metrics.value.firstContentfulPaint > 1800) s -= 20
    if (metrics.value.largestContentfulPaint > 2500) s -= 25
    if (metrics.value.pageLoadTime > 3000) s -= 20

    const enabledStrategies = strategies.value.filter(st => st.enabled).length
    s -= (strategies.value.length - enabledStrategies) * 5

    return Math.max(0, s)
  })

  // 性能等级
  const grade = computed(() => {
    const s = score.value
    if (s >= 90) return 'A+'
    if (s >= 80) return 'A'
    if (s >= 70) return 'B'
    if (s >= 60) return 'C'
    return 'D'
  })

  // 切换策略
  const toggleStrategy = (id: string) => {
    const strategy = strategies.value.find(s => s.id === id)
    if (strategy) strategy.enabled = !strategy.enabled
  }

  // 格式化时间
  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  // 初始化
  const init = () => {
    if (document.readyState === 'complete') {
      measureLoadTime()
    } else {
      window.addEventListener('load', measureLoadTime)
    }
  }

  return {
    metrics,
    strategies,
    resourceHints,
    score,
    grade,
    preconnect,
    dnsPrefetch,
    preload,
    prefetch,
    measureLoadTime,
    loadScriptAsync,
    loadScriptDeferred,
    dynamicImport,
    setupLazyLoading,
    lazyLoadComponent,
    optimizeFontLoading,
    cacheResource,
    getFromCache,
    toggleStrategy,
    formatTime,
    init
  }
}

export default useLoadingSpeedOptimizer
