// Rendering Speed Optimizer - 渲染速度深度优化
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

export interface RenderOptimization {
  id: string
  name: string
  description: string
  enabled: boolean
  priority: 'high' | 'medium' | 'low'
}

export interface PerformanceReport {
  timestamp: number
  fps: number
  memory: number
  renderTime: number
  score: number
  suggestions: string[]
}

export function useRenderingSpeedOptimizer() {
  // 深度优化策略
  const optimizations = ref<RenderOptimization[]>([
    { id: 'fragment', name: 'DocumentFragment批量插入', description: '使用DocumentFragment减少重排', enabled: true, priority: 'high' },
    { id: 'requestIdleCallback', name: 'requestIdleCallback', description: '空闲时执行非紧急任务', enabled: true, priority: 'high' },
    { id: 'layerPromotion', name: 'CSS层提升', description: '使用transform/opacity提升为合成层', enabled: true, priority: 'high' },
    { id: 'paintFlattening', name: '减少绘制', description: '避免不必要的绘制区域', enabled: true, priority: 'medium' },
    { id: 'textReflow', name: '文本优化', description: '使用font-display优化字体加载', enabled: true, priority: 'medium' },
    { id: 'imageDecoding', name: '图片解码优化', description: '异步解码图片', enabled: true, priority: 'medium' },
    { id: 'cssContainment', name: 'CSS Containment', description: '隔离组件渲染', enabled: false, priority: 'low' },
    { id: 'contentVisibility', name: 'Content Visibility', description: '跳过离屏内容渲染', enabled: false, priority: 'low' },
    { id: 'virtualization', name: '列表虚拟化', description: '只渲染可见区域元素', enabled: true, priority: 'high' },
    { id: 'memoization', name: '计算缓存', description: '缓存重复计算结果', enabled: true, priority: 'medium' }
  ])

  // 性能报告历史
  const performanceHistory = ref<PerformanceReport[]>([])

  // 实时FPS
  const currentFPS = ref(60)

  // 内存使用
  const memoryUsage = ref(0)

  // 渲染时间
  const renderTime = ref(0)

  // FPS监测
  let frameTimes: number[] = []
  let lastFrameTime = performance.now()

  const measurePerformance = () => {
    const now = performance.now()
    const delta = now - lastFrameTime
    lastFrameTime = now

    frameTimes.push(delta)
    if (frameTimes.length > 60) {
      frameTimes.shift()
    }

    // 计算平均FPS
    const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length
    currentFPS.value = Math.round(1000 / avgFrameTime)

    // 获取内存
    if ('memory' in performance) {
      memoryUsage.value = Math.round((performance as any).memory.usedJSHeapSize / 1048576)
    }

    // 生成报告
    generateReport()
  }

  // 启动性能监测
  let monitorId: number | null = null
  const startMonitoring = () => {
    if (monitorId !== null) return

    const monitor = () => {
      measurePerformance()
      monitorId = requestAnimationFrame(monitor)
    }
    monitor()
  }

  const stopMonitoring = () => {
    if (monitorId !== null) {
      cancelAnimationFrame(monitorId)
      monitorId = null
    }
  }

  // 生成性能报告
  const generateReport = () => {
    const suggestions: string[] = []

    if (currentFPS.value < 30) {
      suggestions.push('FPS较低，建议启用虚拟化列表')
    }
    if (memoryUsage.value > 200) {
      suggestions.push('内存使用较高，检查是否有内存泄漏')
    }
    if (renderTime.value > 16) {
      suggestions.push('渲染时间过长，考虑减少DOM节点')
    }

    optimizations.value.filter(o => o.enabled && o.priority === 'high').forEach(opt => {
      if (currentFPS.value < 50 && !suggestions.includes(opt.description)) {
        suggestions.push(`建议启用: ${opt.name}`)
      }
    })

    const report: PerformanceReport = {
      timestamp: Date.now(),
      fps: currentFPS.value,
      memory: memoryUsage.value,
      renderTime: renderTime.value,
      score: calculateScore(),
      suggestions
    }

    performanceHistory.value.push(report)
    if (performanceHistory.value.length > 100) {
      performanceHistory.value.shift()
    }
  }

  // 计算性能评分
  const calculateScore = (): number => {
    let score = 100

    if (currentFPS.value < 30) score -= 30
    else if (currentFPS.value < 50) score -= 15

    if (memoryUsage.value > 200) score -= 20
    else if (memoryUsage.value > 100) score -= 10

    if (renderTime.value > 33) score -= 15
    else if (renderTime.value > 16) score -= 5

    return Math.max(0, Math.min(100, score))
  }

  const performanceScore = computed(() => calculateScore())

  // DocumentFragment批量插入
  const batchInsert = (parent: HTMLElement, elements: HTMLElement[]) => {
    const fragment = document.createDocumentFragment()
    elements.forEach(el => fragment.appendChild(el))
    parent.appendChild(fragment)
  }

  // 空闲时执行
  const idleExecute = (task: () => void, timeout = 2000) => {
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(task, { timeout })
    } else {
      setTimeout(task, 0)
    }
  }

  // CSS层提升
  const promoteToLayer = (element: HTMLElement) => {
    element.style.willChange = 'transform, opacity'
    element.style.transform = 'translateZ(0)'
  }

  const demoteLayer = (element: HTMLElement) => {
    element.style.willChange = ''
    element.style.transform = ''
  }

  // 异步图片解码
  const decodeImageAsync = (img: HTMLImageElement): Promise<void> => {
    return new Promise((resolve) => {
      if (img.decode) {
        img.decode().then(resolve).catch(() => resolve())
      } else {
        resolve()
      }
    })
  }

  // 智能虚拟列表
  const smartVirtualize = (
    container: HTMLElement,
    items: any[],
    itemHeight: number,
    renderFn: (item: any, index: number) => HTMLElement
  ) => {
    const scrollTop = container.scrollTop
    const containerHeight = container.clientHeight

    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 5)
    const endIndex = Math.min(
      items.length,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + 5
    )

    const visibleItems = items.slice(startIndex, endIndex)
    const fragment = document.createDocumentFragment()

    visibleItems.forEach((item, i) => {
      const el = renderFn(item, startIndex + i)
      el.style.position = 'absolute'
      el.style.top = `${(startIndex + i) * itemHeight}px`
      fragment.appendChild(el)
    })

    container.innerHTML = ''
    container.appendChild(fragment)
    container.style.height = `${items.length * itemHeight}px`
  }

  // 计算结果缓存
  const memoize = <T extends (...args: any[]) => any>(fn: T): T => {
    const cache = new Map<string, any>()

    return ((...args: any[]) => {
      const key = JSON.stringify(args)
      if (cache.has(key)) {
        return cache.get(key)
      }
      const result = fn(...args)
      cache.set(key, result)
      return result
    }) as T
  }

  // 防抖优化
  const optimizedDebounce = <T extends (...args: any[]) => any>(
    fn: T,
    delay: number,
    options?: { leading?: boolean; trailing?: boolean }
  ) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let lastArgs: any[] | null = null
    const { leading = false, trailing = true } = options || {}

    return (...args: any[]) => {
      lastArgs = args

      if (leading && !timeoutId) {
        fn(...args)
      }

      if (timeoutId) clearTimeout(timeoutId)

      timeoutId = setTimeout(() => {
        if (trailing && lastArgs) {
          fn(...lastArgs)
        }
        timeoutId = null
      }, delay)
    }
  }

  // 节流优化
  const optimizedThrottle = <T extends (...args: any[]) => any>(
    fn: T,
    limit: number,
    options?: { leading?: boolean; trailing?: boolean }
  ) => {
    let lastCall = 0
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let lastArgs: any[] | null = null
    const { leading = true, trailing = false } = options || {}

    return (...args: any[]) => {
      const now = Date.now()
      lastArgs = args

      if (leading && now - lastCall >= limit) {
        fn(...args)
        lastCall = now
      } else if (trailing && !timeoutId) {
        timeoutId = setTimeout(() => {
          lastCall = Date.now()
          if (lastArgs) fn(...lastArgs)
          timeoutId = null
        }, limit - (now - lastCall))
      }
    }
  }

  // 启用/禁用优化
  const toggleOptimization = (id: string) => {
    const opt = optimizations.value.find(o => o.id === id)
    if (opt) {
      opt.enabled = !opt.enabled
    }
  }

  // 获取最佳优化建议
  const getBestSuggestions = computed(() => {
    return optimizations.value
      .filter(o => o.enabled && o.priority === 'high')
      .map(o => o.name)
  })

  // 获取性能趋势
  const performanceTrend = computed(() => {
    if (performanceHistory.value.length < 2) return 'stable'

    const recent = performanceHistory.value.slice(-10)
    const first = recent[0].score
    const last = recent[recent.length - 1].score

    if (last > first + 5) return 'improving'
    if (last < first - 5) return 'degrading'
    return 'stable'
  })

  // 清除历史
  const clearHistory = () => {
    performanceHistory.value = []
  }

  onMounted(() => {
    startMonitoring()
  })

  onUnmounted(() => {
    stopMonitoring()
  })

  return {
    // 状态
    optimizations,
    performanceHistory,
    currentFPS,
    memoryUsage,
    renderTime,
    performanceScore,
    performanceTrend,
    getBestSuggestions,
    // 方法
    startMonitoring,
    stopMonitoring,
    batchInsert,
    idleExecute,
    promoteToLayer,
    demoteLayer,
    decodeImageAsync,
    smartVirtualize,
    memoize,
    optimizedDebounce,
    optimizedThrottle,
    toggleOptimization,
    clearHistory
  }
}

export default useRenderingSpeedOptimizer
