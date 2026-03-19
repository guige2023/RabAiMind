// Rendering Optimizer - 渲染性能优化
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

export interface RenderMetrics {
  fps: number
  frameTime: number
  memory: number
  paintTime: number
  scriptTime: number
}

export interface OptimizationStrategy {
  id: string
  name: string
  enabled: boolean
  threshold?: number
}

export function useRenderingOptimizer() {
  // 性能指标
  const metrics = ref<RenderMetrics>({
    fps: 60,
    frameTime: 16.67,
    memory: 0,
    paintTime: 0,
    scriptTime: 0
  })

  // 优化策略
  const strategies = ref<OptimizationStrategy[]>([
    { id: 'requestAnimationFrame', name: '使用requestAnimationFrame', enabled: true },
    { id: 'virtualScroll', name: '虚拟滚动', enabled: true, threshold: 100 },
    { id: 'imageLazyLoad', name: '图片懒加载', enabled: true },
    { id: 'debounce', name: '防抖处理', enabled: true },
    { id: 'throttle', name: '节流处理', enabled: true },
    { id: 'cssContainment', name: 'CSSContainment', enabled: false },
    { id: 'willChange', name: 'will-change优化', enabled: true },
    { id: 'transform3d', name: '3D变换加速', enabled: true },
    { id: 'contentVisibility', name: 'content-visibility', enabled: false }
  ])

  // FPS监测
  let frameCount = 0
  let lastTime = performance.now()
  let animationFrameId: number | null = null

  const measureFPS = () => {
    frameCount++
    const currentTime = performance.now()

    if (currentTime - lastTime >= 1000) {
      metrics.value.fps = frameCount
      metrics.value.frameTime = (currentTime - lastTime) / frameCount
      frameCount = 0
      lastTime = currentTime
    }

    animationFrameId = requestAnimationFrame(measureFPS)
  }

  // 启动FPS监测
  const startMonitoring = () => {
    if (animationFrameId) return
    measureFPS()
  }

  // 停止监测
  const stopMonitoring = () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }
  }

  // 获取内存使用
  const getMemoryUsage = (): number => {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return Math.round(memory.usedJSHeapSize / 1048576)
    }
    return 0
  }

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

  // RAF防抖
  const rafDebounce = <T extends (...args: any[]) => any>(
    fn: T
  ): ((...args: Parameters<T>) => void) => {
    let rafId: number | null = null
    return (...args: Parameters<T>) => {
      if (rafId) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        fn(...args)
        rafId = null
      })
    }
  }

  // RAF节流
  const rafThrottle = <T extends (...args: any[]) => any>(
    fn: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let lastRun = 0
    return (...args: Parameters<T>) => {
      const now = performance.now()
      if (now - lastRun >= limit) {
        lastRun = now
        fn(...args)
      }
    }
  }

  // 虚拟列表计算
  const virtualList = (
    containerHeight: number,
    itemHeight: number,
    scrollTop: number,
    overscan = 3
  ) => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const endIndex = Math.min(
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan,
      1000 // 假设最多1000项
    )
    const offsetY = startIndex * itemHeight

    return { startIndex, endIndex, offsetY }
  }

  // 图片懒加载
  const lazyLoadImages = (selector = 'img[data-src]') => {
    if (!('IntersectionObserver' in window)) return () => {}

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          if (img.dataset.src) {
            img.src = img.dataset.src
            img.removeAttribute('data-src')
            img.classList.add('loaded')
          }
          observer.unobserve(img)
        }
      })
    }, { rootMargin: '50px' })

    document.querySelectorAll(selector).forEach(img => observer.observe(img))

    return () => observer.disconnect()
  }

  // 元素可见性检测
  const observeVisibility = (
    element: HTMLElement,
    callback: (isVisible: boolean) => void
  ): (() => void) => {
    if (!('IntersectionObserver' in window)) {
      callback(true)
      return () => {}
    }

    const observer = new IntersectionObserver(
      ([entry]) => callback(entry.isIntersecting),
      { threshold: 0 }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }

  // 优化滚动
  const optimizeScroll = (element: HTMLElement, callback: (scrollTop: number) => void) => {
    const handler = rafThrottle(() => {
      callback(element.scrollTop)
    }, 16)

    element.addEventListener('scroll', handler, { passive: true })
    return () => element.removeEventListener('scroll', handler)
  }

  // CSS优化
  const applyOptimizations = (element: HTMLElement, enable3d = true) => {
    if (enable3d && strategies.value.find(s => s.id === 'transform3d')?.enabled) {
      element.style.transform = 'translateZ(0)'
      element.style.backfaceVisibility = 'hidden'
    }

    if (strategies.value.find(s => s.id === 'willChange')?.enabled) {
      element.style.willChange = 'transform, opacity'
    }
  }

  // 移除CSS优化
  const removeOptimizations = (element: HTMLElement) => {
    element.style.transform = ''
    element.style.backfaceVisibility = ''
    element.style.willChange = ''
  }

  // 性能评分
  const score = computed(() => {
    let s = 100

    if (metrics.value.fps < 30) s -= 30
    else if (metrics.value.fps < 50) s -= 15

    const memory = getMemoryUsage()
    if (memory > 200) s -= 20
    else if (memory > 100) s -= 10

    if (metrics.value.frameTime > 33) s -= 10

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

  // 启用/禁用策略
  const toggleStrategy = (id: string) => {
    const strategy = strategies.value.find(s => s.id === id)
    if (strategy) {
      strategy.enabled = !strategy.enabled
    }
  }

  // 更新配置
  const updateConfig = (id: string, enabled: boolean, threshold?: number) => {
    const strategy = strategies.value.find(s => s.id === id)
    if (strategy) {
      strategy.enabled = enabled
      if (threshold !== undefined) strategy.threshold = threshold
    }
  }

  onMounted(() => {
    startMonitoring()
  })

  onUnmounted(() => {
    stopMonitoring()
  })

  return {
    // 状态
    metrics,
    strategies,
    // 计算属性
    score,
    grade,
    // 方法
    startMonitoring,
    stopMonitoring,
    getMemoryUsage,
    debounce,
    throttle,
    rafDebounce,
    rafThrottle,
    virtualList,
    lazyLoadImages,
    observeVisibility,
    optimizeScroll,
    applyOptimizations,
    removeOptimizations,
    toggleStrategy,
    updateConfig
  }
}

export default useRenderingOptimizer
