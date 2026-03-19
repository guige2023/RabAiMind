// Performance Monitor - 性能监控与优化建议
import { ref, computed, onMounted, onUnmounted } from 'vue'

export interface PerformanceMetrics {
  fps: number
  memory: number
  domNodes: number
  eventListeners: number
  frameTime: number
  scriptTime: number
  renderTime: number
  paintTime: number
}

export interface PerformanceThreshold {
  fps: { min: number; max: number }
  memory: { min: number; max: number }
  domNodes: { min: number; max: number }
}

export interface PerformanceAlert {
  id: string
  type: 'warning' | 'critical'
  metric: string
  value: number
  threshold: number
  timestamp: number
  suggestion: string
}

export interface PerformanceReport {
  generatedAt: number
  metrics: PerformanceMetrics
  alerts: PerformanceAlert[]
  suggestions: string[]
}

export function usePerformanceMonitor() {
  // 性能指标
  const metrics = ref<PerformanceMetrics>({
    fps: 60,
    memory: 0,
    domNodes: 0,
    eventListeners: 0,
    frameTime: 16,
    scriptTime: 0,
    renderTime: 0,
    paintTime: 0
  })

  // 性能阈值
  const thresholds = ref<PerformanceThreshold>({
    fps: { min: 30, max: 60 },
    memory: { min: 0, max: 100 },
    domNodes: { min: 0, max: 2000 }
  })

  // 告警列表
  const alerts = ref<PerformanceAlert[]>([])

  // 监控状态
  const isMonitoring = ref(false)

  // FPS计算
  let frameCount = 0
  let lastTime = performance.now()
  let animationId: number | null = null

  // 更新FPS
  const updateFPS = (): void => {
    frameCount++
    const currentTime = performance.now()

    if (currentTime - lastTime >= 1000) {
      metrics.value.fps = frameCount
      frameCount = 0
      lastTime = currentTime
    }

    if (isMonitoring.value) {
      animationId = requestAnimationFrame(updateFPS)
    }
  }

  // 更新DOM指标
  const updateDOMMetrics = (): void => {
    metrics.value.domNodes = document.querySelectorAll('*').length
  }

  // 更新内存指标
  const updateMemoryMetrics = (): void => {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      metrics.value.memory = Math.round(memory.usedJSHeapSize / 1048576) // MB
    }
  }

  // 检查阈值
  const checkThresholds = (): void => {
    // FPS告警
    if (metrics.value.fps < thresholds.value.fps.min) {
      addAlert('warning', 'fps', metrics.value.fps, thresholds.value.fps.min, '建议优化动画性能')
    }

    // DOM节点告警
    if (metrics.value.domNodes > thresholds.value.domNodes.max) {
      addAlert('critical', 'domNodes', metrics.value.domNodes, thresholds.value.domNodes.max, 'DOM节点过多，建议优化')
    }

    // 内存告警
    if (metrics.value.memory > thresholds.value.memory.max) {
      addAlert('critical', 'memory', metrics.value.memory, thresholds.value.memory.max, '内存使用过高，建议清理')
    }
  }

  // 添加告警
  const addAlert = (type: PerformanceAlert['type'], metric: string, value: number, threshold: number, suggestion: string): void => {
    // 避免重复告警
    const existing = alerts.value.find(
      a => a.metric === metric && !a.timestamp
    )

    if (!existing) {
      alerts.value.push({
        id: `alert_${Date.now()}`,
        type,
        metric,
        value,
        threshold,
        timestamp: Date.now(),
        suggestion
      })
    }
  }

  // 开始监控
  const startMonitoring = (): void => {
    if (isMonitoring.value) return

    isMonitoring.value = true
    updateFPS()

    // 定期更新DOM和内存
    setInterval(() => {
      updateDOMMetrics()
      updateMemoryMetrics()
      checkThresholds()
    }, 1000)
  }

  // 停止监控
  const stopMonitoring = (): void => {
    isMonitoring.value = false
    if (animationId) {
      cancelAnimationFrame(animationId)
      animationId = null
    }
  }

  // 生成报告
  const generateReport = (): PerformanceReport => {
    return {
      generatedAt: Date.now(),
      metrics: { ...metrics.value },
      alerts: [...alerts.value],
      suggestions: getSuggestions()
    }
  }

  // 获取优化建议
  const getSuggestions = (): string[] => {
    const suggestions: string[] = []

    if (metrics.value.fps < 50) {
      suggestions.push('FPS较低，建议减少动画复杂度或使用will-change优化')
    }

    if (metrics.value.domNodes > 1500) {
      suggestions.push('DOM节点过多，建议使用虚拟列表或懒加载')
    }

    if (metrics.value.memory > 80) {
      suggestions.push('内存占用较高，建议清理未使用的资源')
    }

    return suggestions
  }

  // 清空告警
  const clearAlerts = (): void => {
    alerts.value = []
  }

  // 更新阈值
  const updateThresholds = (updates: Partial<PerformanceThreshold>): void => {
    Object.assign(thresholds.value, updates)
  }

  // 当前状态
  const status = computed(() => ({
    isMonitoring: isMonitoring.value,
    fps: metrics.value.fps,
    memory: metrics.value.memory,
    domNodes: metrics.value.domNodes,
    alertsCount: alerts.value.length
  }))

  // 生命周期
  onMounted(() => {
    startMonitoring()
  })

  onUnmounted(() => {
    stopMonitoring()
  })

  return {
    metrics,
    thresholds,
    alerts,
    isMonitoring,
    status,
    startMonitoring,
    stopMonitoring,
    generateReport,
    getSuggestions,
    clearAlerts,
    updateThresholds
  }
}

export default usePerformanceMonitor
