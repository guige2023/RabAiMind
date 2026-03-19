// Rendering Performance Ultra - 渲染性能极致优化
import { ref, computed, onMounted, onUnmounted } from 'vue'

export interface RenderMetrics {
  fps: number
  frameTime: number
  paintTime: number
  layoutTime: number
  scriptTime: number
  memory: number
}

export interface OptimizationConfig {
  enableVirtualScroll: boolean
  enableDebounce: boolean
  enableThrottle: boolean
  enableRequestAnimationFrame: boolean
  enableWebWorker: boolean
  enableLazyLoad: boolean
  batchUpdates: boolean
  cacheDom: boolean
}

export interface ComponentProfile {
  name: string
  renderCount: number
  lastRenderTime: number
  averageRenderTime: number
  memory: number
}

export function useRenderingPerformanceUltra() {
  // 配置
  const config = ref<OptimizationConfig>({
    enableVirtualScroll: true,
    enableDebounce: true,
    enableThrottle: true,
    enableRequestAnimationFrame: true,
    enableWebWorker: false,
    enableLazyLoad: true,
    batchUpdates: true,
    cacheDom: true
  })

  // 性能指标
  const metrics = ref<RenderMetrics>({
    fps: 60,
    frameTime: 16.67,
    paintTime: 0,
    layoutTime: 0,
    scriptTime: 0,
    memory: 0
  })

  // 组件性能分析
  const componentProfiles = ref<ComponentProfile[]>([])

  // FPS追踪
  let frameCount = 0
  let lastTime = performance.now()
  let animationId: number | null = null

  // DOM缓存
  const domCache = ref<Map<string, HTMLElement>>(new Map())

  // 虚拟滚动状态
  const virtualScrollState = ref({
    scrollTop: 0,
    viewportHeight: 0,
    itemHeight: 0,
    totalItems: 0,
    visibleStart: 0,
    visibleEnd: 0
  })

  // FPS监控
  const startFPSMonitor = () => {
    const measureFPS = () => {
      frameCount++
      const now = performance.now()
      const delta = now - lastTime

      if (delta >= 1000) {
        metrics.value.fps = Math.round((frameCount * 1000) / delta)
        metrics.value.frameTime = delta / frameCount
        frameCount = 0
        lastTime = now
      }

      animationId = requestAnimationFrame(measureFPS)
    }

    animationId = requestAnimationFrame(measureFPS)
  }

  const stopFPSMonitor = () => {
    if (animationId) {
      cancelAnimationFrame(animationId)
      animationId = null
    }
  }

  // 性能标记
  const mark = (name: string) => {
    performance.mark(name)
  }

  const measure = (name: string, startMark: string, endMark?: string) => {
    performance.measure(name, startMark, endMark)
    const entries = performance.getEntriesByName(name)
    if (entries.length > 0) {
      const last = entries[entries.length - 1]
      return last.duration
    }
    return 0
  }

  // 组件性能追踪
  const trackComponentRender = (name: string, renderTime: number) => {
    let profile = componentProfiles.value.find(p => p.name === name)

    if (!profile) {
      profile = {
        name,
        renderCount: 0,
        lastRenderTime: 0,
        averageRenderTime: 0,
        memory: 0
      }
      componentProfiles.value.push(profile)
    }

    profile.renderCount++
    profile.lastRenderTime = renderTime
    profile.averageRenderTime = (profile.averageRenderTime * (profile.renderCount - 1) + renderTime) / profile.renderCount

    if (performance.memory) {
      profile.memory = performance.memory.usedJSHeapSize
    }
  }

  // 虚拟滚动计算
  const updateVirtualScroll = (scrollTop: number, viewportHeight: number, itemHeight: number, totalItems: number) => {
    virtualScrollState.value = {
      scrollTop,
      viewportHeight,
      itemHeight,
      totalItems,
      visibleStart: Math.floor(scrollTop / itemHeight),
      visibleEnd: Math.ceil((scrollTop + viewportHeight) / itemHeight)
    }

    return {
      start: virtualScrollState.value.visibleStart,
      end: Math.min(virtualScrollState.value.visibleEnd + 5, totalItems),
      offsetY: virtualScrollState.value.visibleStart * itemHeight
    }
  }

  // 防抖
  const debounce = <T extends (...args: any[]) => any>(
    fn: T,
    delay: number
  ): ((...args: Parameters<T>) => void) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    return (...args: Parameters<T>) => {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => fn(...args), delay)
    }
  }

  // 节流
  const throttle = <T extends (...args: any[]) => any>(
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

  // RAF批量更新
  const batchUpdate = (callbacks: Array<() => void>) => {
    if (!config.value.enableRequestAnimationFrame) {
      callbacks.forEach(cb => cb())
      return
    }

    let index = 0

    const processNext = () => {
      if (index < callbacks.length) {
        callbacks[index]()
        index++
        requestAnimationFrame(processNext)
      }
    }

    requestAnimationFrame(processNext)
  }

  // DOM缓存
  const cacheDom = (key: string, element: HTMLElement) => {
    if (config.value.cacheDom) {
      domCache.value.set(key, element)
    }
  }

  const getCachedDom = (key: string): HTMLElement | undefined => {
    return domCache.value.get(key)
  }

  const clearDomCache = () => {
    domCache.value.clear()
  }

  // 懒加载检测
  const observeLazyLoad = (
    callback: (entry: IntersectionObserverEntry) => void
  ): IntersectionObserver => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(callback),
      { rootMargin: '100px' }
    )

    return observer
  }

  // 内存监控
  const getMemoryUsage = () => {
    if (performance.memory) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1048576),
        total: Math.round(performance.memory.totalJSHeapSize / 1048576),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
      }
    }
    return null
  }

  // 获取慢渲染组件
  const getSlowComponents = (threshold = 16) => {
    return componentProfiles.value
      .filter(p => p.averageRenderTime > threshold)
      .sort((a, b) => b.averageRenderTime - a.averageRenderTime)
  }

  // 更新配置
  const updateConfig = (newConfig: Partial<OptimizationConfig>) => {
    Object.assign(config.value, newConfig)
  }

  // 性能建议
  const getPerformanceSuggestions = () => {
    const suggestions: string[] = []

    if (metrics.value.fps < 30) {
      suggestions.push('FPS过低，建议减少动画或使用will-change优化')
    }

    if (metrics.value.frameTime > 33) {
      suggestions.push('帧时间过长，检查是否有重排或重绘')
    }

    const slowComponents = getSlowComponents()
    if (slowComponents.length > 0) {
      suggestions.push(`发现${slowComponents.length}个慢渲染组件，考虑使用虚拟列表或懒加载`)
    }

    const memory = getMemoryUsage()
    if (memory && memory.used / memory.limit > 0.8) {
      suggestions.push('内存使用率过高，注意清理不需要的数据')
    }

    return suggestions
  }

  // 统计
  const stats = computed(() => ({
    fps: metrics.value.fps,
    frameTime: Math.round(metrics.value.frameTime * 100) / 100,
    memory: getMemoryUsage(),
    components: componentProfiles.value.length,
    slowComponents: getSlowComponents().length,
    virtualScroll: virtualScrollState.value,
    suggestions: getPerformanceSuggestions().length,
    config: { ...config.value }
  }))

  // 初始化
  onMounted(() => {
    if (config.value.enableRequestAnimationFrame) {
      startFPSMonitor()
    }
  })

  onUnmounted(() => {
    stopFPSMonitor()
  })

  return {
    // 配置
    config,
    updateConfig,
    // 指标
    metrics,
    getMemoryUsage,
    // 组件分析
    componentProfiles,
    trackComponentRender,
    getSlowComponents,
    // 虚拟滚动
    virtualScrollState,
    updateVirtualScroll,
    // 优化工具
    debounce,
    throttle,
    batchUpdate,
    // DOM缓存
    domCache,
    cacheDom,
    getCachedDom,
    clearDomCache,
    // 懒加载
    observeLazyLoad,
    // 性能标记
    mark,
    measure,
    // 建议
    getPerformanceSuggestions,
    // 统计
    stats
  }
}

export default useRenderingPerformanceUltra
