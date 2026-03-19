// Performance optimization composable
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface PerformanceMetrics {
  fps: number
  memory: number
  loadTime: number
  renderTime: number
  fcp: number
  lcp: number
  cls: number
  ttfb: number
}

interface MemoryInfo {
  used: number
  total: number
  percentage: number
}

export function usePerformanceOptimizer() {
  const metrics = ref<PerformanceMetrics>({
    fps: 60,
    memory: 0,
    loadTime: 0,
    renderTime: 0,
    fcp: 0,
    lcp: 0,
    cls: 0,
    ttfb: 0
  })

  const memoryInfo = ref<MemoryInfo>({
    used: 0,
    total: 0,
    percentage: 0
  })

  const warnings = ref<string[]>([])
  const isLowPerformance = ref(false)
  let frameCount = 0
  let lastTime = performance.now()
  let animationId: number | null = null

  // FPS监测
  const measureFPS = () => {
    frameCount++
    const currentTime = performance.now()

    if (currentTime - lastTime >= 1000) {
      metrics.value.fps = frameCount
      frameCount = 0
      lastTime = currentTime

      // 低性能检测
      if (metrics.value.fps < 30) {
        isLowPerformance.value = true
        applyLowPerformanceMode()
      }
    }

    animationId = requestAnimationFrame(measureFPS)
  }

  // 内存使用情况
  const getMemoryUsage = (): number => {
    if ((performance as any).memory) {
      return Math.round((performance as any).memory.usedJSHeapSize / 1048576)
    }
    return 0
  }

  // 应用低性能模式
  const applyLowPerformanceMode = () => {
    // 减少动画
    document.body.classList.add('reduced-motion')

    // 延迟加载图片
    const images = document.querySelectorAll('img')
    images.forEach(img => {
      (img as HTMLImageElement).loading = 'lazy'
    })
  }

  // 页面加载时间
  const measureLoadTime = () => {
    if (performance.timing) {
      metrics.value.loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart
    }
  }

  // 资源加载优化建议
  const getOptimizationSuggestions = (): string[] => {
    const suggestions: string[] = []

    if (metrics.value.loadTime > 3000) {
      suggestions.push('考虑使用代码分割减少首屏加载时间')
    }

    if (metrics.value.fps < 50) {
      suggestions.push('检测是否有大型动画影响性能')
    }

    const memory = getMemoryUsage()
    if (memory > 100) {
      suggestions.push('内存使用较高，注意清理不需要的资源')
    }

    // 检查Web Vitals
    if (metrics.value.fcp > 1800) {
      suggestions.push('首次内容绘制时间过长，优化CSS和JavaScript加载顺序')
    }

    if (metrics.value.lcp > 2500) {
      suggestions.push('最大内容绘制时间过长，使用CDN和预加载关键资源')
    }

    if (metrics.value.cls > 0.1) {
      suggestions.push('布局偏移过大，为图片和iframe设置明确尺寸')
    }

    return suggestions
  }

  // 性能评分
  const score = computed(() => {
    let s = 100
    if (metrics.value.fps < 30) s -= 20
    else if (metrics.value.fps < 50) s -= 10
    if (metrics.value.loadTime > 3000) s -= 15
    if (metrics.value.fcp > 1800) s -= 15
    if (metrics.value.lcp > 2500) s -= 20
    if (metrics.value.cls > 0.1) s -= 10
    if (memoryInfo.value.percentage > 80) s -= 10
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

  // 防抖函数
  const debounce = <T extends (...args: any[]) => any>(
    fn: T,
    delay: number
  ): ((...args: Parameters<T>) => void) => {
    let timeoutId: ReturnType<typeof setTimeout>
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => fn(...args), delay)
    }
  }

  // 节流函数
  const throttle = <T extends (...args: any[]) => any>(
    fn: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        fn(...args)
        inThrottle = true
        setTimeout(() => (inThrottle = false), limit)
      }
    }
  }

  // 懒加载图片
  const lazyLoadImages = (selector = 'img[data-src]') => {
    if (!('IntersectionObserver' in window)) return

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          if (img.dataset.src) {
            img.src = img.dataset.src
            img.removeAttribute('data-src')
          }
          observer.unobserve(img)
        }
      })
    })

    document.querySelectorAll(selector).forEach(img => {
      observer.observe(img)
    })
  }

  // 虚拟滚动
  const virtualScroll = (
    containerHeight: number,
    itemHeight: number,
    scrollTop: number,
    totalItems: number
  ) => {
    const visibleItems = Math.ceil(containerHeight / itemHeight)
    const startIndex = Math.floor(scrollTop / itemHeight)
    const endIndex = Math.min(startIndex + visibleItems + 2, totalItems)
    return {
      startIndex: Math.max(0, startIndex - 1),
      endIndex,
      visibleItems: endIndex - startIndex
    }
  }

  // 预加载资源
  const preloadResource = (url: string, as: 'script' | 'style' | 'image' | 'font' = 'script') => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = as
    link.href = url
    document.head.appendChild(link)
  }

  // 预连接
  const preconnect = (url: string) => {
    const link = document.createElement('link')
    link.rel = 'preconnect'
    link.href = url
    document.head.appendChild(link)
  }

  // 收集完整指标
  const collectFullMetrics = () => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const paint = performance.getEntriesByType('paint')

    if (navigation) {
      metrics.value.ttfb = navigation.responseStart - navigation.requestStart
      metrics.value.loadTime = navigation.loadEventEnd - navigation.startTime
    }

    paint.forEach(entry => {
      if (entry.name === 'first-contentful-paint') {
        metrics.value.fcp = entry.startTime
      }
    })

    const lcpEntries = performance.getEntriesByType('largest-contentful-paint') as PerformanceEntry[]
    if (lcpEntries.length > 0) {
      metrics.value.lcp = lcpEntries[lcpEntries.length - 1].startTime
    }

    const clsEntries = performance.getEntriesByType('layout-shift') as PerformanceEntry[]
    if (clsEntries.length > 0) {
      metrics.value.cls = clsEntries.reduce((sum, entry) => sum + (entry as any).value, 0)
    }

    if ('memory' in performance) {
      const memory = (performance as any).memory
      memoryInfo.value.used = memory.usedJSHeapSize
      memoryInfo.value.total = memory.jsHeapSizeLimit
      memoryInfo.value.percentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
    }
  }

  // 格式化字节
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // 启动性能监测
  const startMonitoring = () => {
    measureLoadTime()
    animationId = requestAnimationFrame(measureFPS)

    // 定期检查内存
    setInterval(() => {
      metrics.value.memory = getMemoryUsage()
    }, 5000)
  }

  // 停止监测
  const stopMonitoring = () => {
    if (animationId) {
      cancelAnimationFrame(animationId)
      animationId = null
    }
  }

  onMounted(() => {
    startMonitoring()
  })

  onUnmounted(() => {
    stopMonitoring()
  })

  return {
    metrics,
    memoryInfo,
    warnings,
    isLowPerformance,
    score,
    grade,
    getMemoryUsage,
    getOptimizationSuggestions,
    startMonitoring,
    stopMonitoring,
    debounce,
    throttle,
    lazyLoadImages,
    virtualScroll,
    preloadResource,
    preconnect,
    collectFullMetrics,
    formatBytes
  }
}

export default usePerformanceOptimizer
