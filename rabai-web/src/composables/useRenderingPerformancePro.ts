// Rendering Performance Pro - 渲染性能深度优化
import { ref, computed, onMounted, onUnmounted } from 'vue'

export interface PerformanceMetrics {
  fps: number
  frameTime: number
  memory: number
  paintTime: number
  scriptTime: number
  layoutCount: number
  paintCount: number
  compositeCount: number
}

export interface PerformanceThreshold {
  fps: number
  memory: number
  paintTime: number
}

export function useRenderingPerformancePro() {
  // 性能指标
  const metrics = ref<PerformanceMetrics>({
    fps: 60,
    frameTime: 16.67,
    memory: 0,
    paintTime: 0,
    scriptTime: 0,
    layoutCount: 0,
    paintCount: 0,
    compositeCount: 0
  })

  // 性能阈值
  const thresholds = ref<PerformanceThreshold>({
    fps: 30,
    memory: 100,
    paintTime: 16
  })

  // 性能警告
  const warnings = ref<string[]>([])

  // FPS监测
  let frameTimes: number[] = []
  let lastTime = performance.now()

  const measurePerformance = () => {
    const now = performance.now()
    const delta = now - lastTime
    lastTime = now

    frameTimes.push(delta)
    if (frameTimes.length > 60) frameTimes.shift()

    const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length
    metrics.value.fps = Math.round(1000 / avgFrameTime)
    metrics.value.frameTime = avgFrameTime

    // 内存
    if ('memory' in performance) {
      metrics.value.memory = Math.round((performance as any).memory.usedJSHeapSize / 1048576)
    }

    // 检查警告
    checkWarnings()

    requestAnimationFrame(measurePerformance)
  }

  // 检查性能警告
  const checkWarnings = () => {
    warnings.value = []

    if (metrics.value.fps < thresholds.value.fps) {
      warnings.value.push(`FPS过低: ${metrics.value.fps}`)
    }
    if (metrics.value.memory > thresholds.value.memory) {
      warnings.value.push(`内存使用过高: ${metrics.value.memory}MB`)
    }
    if (metrics.value.paintTime > thresholds.value.paintTime) {
      warnings.value.push(`绘制时间过长: ${metrics.value.paintTime}ms`)
    }
  }

  // 启动监测
  let monitorId: number | null = null
  const startMonitoring = () => {
    if (monitorId !== null) return
    measurePerformance()
  }

  const stopMonitoring = () => {
    if (monitorId !== null) {
      cancelAnimationFrame(monitorId)
      monitorId = null
    }
  }

  // DOM优化
  const batchDOMUpdates = (updates: (() => void)[]) => {
    requestAnimationFrame(() => {
      updates.forEach(update => update())
    })
  }

  // 虚拟列表优化
  const virtualizeList = (
    container: HTMLElement,
    items: any[],
    itemHeight: number,
    renderFn: (item: any, index: number) => HTMLElement
  ) => {
    const scrollTop = container.scrollTop
    const containerHeight = container.clientHeight

    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 3)
    const endIndex = Math.min(items.length, Math.ceil((scrollTop + containerHeight) / itemHeight) + 3)

    container.innerHTML = ''
    for (let i = startIndex; i < endIndex; i++) {
      const el = renderFn(items[i], i)
      el.style.position = 'absolute'
      el.style.top = `${i * itemHeight}px`
      container.appendChild(el)
    }

    container.style.height = `${items.length * itemHeight}px`
  }

  // 图片懒加载
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
    }, { rootMargin: '100px' })

    document.querySelectorAll(selector).forEach(img => observer.observe(img))
  }

  // CSS优化
  const optimizeStyle = (element: HTMLElement) => {
    element.style.willChange = 'transform, opacity'
    element.style.transform = 'translateZ(0)'
    element.style.backfaceVisibility = 'hidden'
  }

  const removeOptimizeStyle = (element: HTMLElement) => {
    element.style.willChange = ''
    element.style.transform = ''
    element.style.backfaceVisibility = ''
  }

  // 防抖
  const debounce = <T extends (...args: any[]) => any>(fn: T, delay: number) => {
    let timeoutId: ReturnType<typeof setTimeout>
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => fn(...args), delay)
    }
  }

  // 节流
  const throttle = <T extends (...args: any[]) => any>(fn: T, limit: number) => {
    let inThrottle: boolean
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        fn(...args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  }

  // 性能评分
  const performanceScore = computed(() => {
    let score = 100
    if (metrics.value.fps < 30) score -= 30
    else if (metrics.value.fps < 50) score -= 15
    if (metrics.value.memory > 200) score -= 20
    else if (metrics.value.memory > 100) score -= 10
    return Math.max(0, score)
  })

  // 性能等级
  const performanceGrade = computed(() => {
    const score = performanceScore.value
    if (score >= 90) return 'A+'
    if (score >= 80) return 'A'
    if (score >= 70) return 'B'
    if (score >= 60) return 'C'
    return 'D'
  })

  onMounted(() => {
    startMonitoring()
  })

  onUnmounted(() => {
    stopMonitoring()
  })

  return {
    metrics,
    thresholds,
    warnings,
    performanceScore,
    performanceGrade,
    startMonitoring,
    stopMonitoring,
    batchDOMUpdates,
    virtualizeList,
    lazyLoadImages,
    optimizeStyle,
    removeOptimizeStyle,
    debounce,
    throttle
  }
}

export default useRenderingPerformancePro
