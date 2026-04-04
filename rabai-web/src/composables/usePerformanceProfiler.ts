// Performance Profiler - Real-time performance monitoring
import { ref, computed, onMounted, onUnmounted } from 'vue'

export interface ProfilerMetrics {
  fps: number
  memory: number // MB
  memoryLimit: number // MB
  domNodes: number
  renderTime: number // ms
  longTasks: number
  networkRequests: number
  cacheHitRate: number // percentage
}

export interface TimelineEntry {
  name: string
  start: number
  duration: number
  type: 'render' | 'network' | 'task' | 'custom'
}

const SLOW_THRESHOLD = 50 // ms for long task detection

class PerformanceProfilerClass {
  private fpsHistory: number[] = []
  private timeline: TimelineEntry[] = []
  private frameCount = 0
  private lastFrameTime = 0
  private rafId: number | null = null
  private memoryInterval: number | null = null
  private longTaskObserver: PerformanceObserver | null = null
  private longTaskCount = 0

  // Current metrics
  readonly metrics = ref<ProfilerMetrics>({
    fps: 60,
    memory: 0,
    memoryLimit: 0,
    domNodes: 0,
    renderTime: 0,
    longTasks: 0,
    networkRequests: 0,
    cacheHitRate: 0
  })

  // Profiler state
  readonly isRunning = ref(false)
  readonly isVisible = ref(false)
  readonly panelPosition = ref({ x: 20, y: 20 })

  // FPS calculation
  private calculateFPS(now: number) {
    this.frameCount++
    const elapsed = now - this.lastFrameTime

    if (elapsed >= 1000) {
      const fps = Math.round((this.frameCount * 1000) / elapsed)
      this.fpsHistory.push(fps)
      if (this.fpsHistory.length > 60) {
        this.fpsHistory.shift()
      }
      this.metrics.value.fps = fps
      this.frameCount = 0
      this.lastFrameTime = now
    }
  }

  // Start the profiler
  start() {
    if (this.isRunning.value) return

    this.isRunning.value = true
    this.lastFrameTime = performance.now()
    this.frameCount = 0
    this.fpsHistory = []
    this.timeline = []
    this.longTaskCount = 0

    // FPS monitoring via requestAnimationFrame
    const measureFrame = (now: number) => {
      if (!this.isRunning.value) return
      this.calculateFPS(now)
      this.rafId = requestAnimationFrame(measureFrame)
    }
    this.rafId = requestAnimationFrame(measureFrame)

    // Memory monitoring (memory info API)
    this.memoryInterval = window.setInterval(() => {
      this.updateMemoryInfo()
    }, 2000)

    // DOM node count
    this.updateDOMInfo()

    // Long task detection via PerformanceObserver
    if ('PerformanceObserver' in window) {
      try {
        this.longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if ((entry as any).duration > SLOW_THRESHOLD) {
              this.longTaskCount++
              this.metrics.value.longTasks = this.longTaskCount
              this.addTimelineEntry({
                name: `Long Task: ${(entry as any).duration.toFixed(1)}ms`,
                start: (entry as any).startTime,
                duration: (entry as any).duration,
                type: 'task'
              })
            }
          }
        })
        this.longTaskObserver.observe({ entryTypes: ['longtask'] })
      } catch (e) {
        // Long task API not supported
      }
    }

    // Initial measurements
    this.updateMemoryInfo()
  }

  // Stop the profiler
  stop() {
    this.isRunning.value = false

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }

    if (this.memoryInterval !== null) {
      clearInterval(this.memoryInterval)
      this.memoryInterval = null
    }

    if (this.longTaskObserver) {
      this.longTaskObserver.disconnect()
      this.longTaskObserver = null
    }
  }

  // Toggle profiler
  toggle() {
    if (this.isRunning.value) {
      this.stop()
    } else {
      this.start()
    }
  }

  // Show/hide panel
  togglePanel() {
    this.isVisible.value = !this.isVisible.value
    if (this.isVisible.value && !this.isRunning.value) {
      this.start()
    }
  }

  // Update memory info
  private updateMemoryInfo() {
    const mem = (performance as any).memory
    if (mem) {
      this.metrics.value.memory = Math.round(mem.usedJSHeapSize / 1048576)
      this.metrics.value.memoryLimit = Math.round(mem.jsHeapSizeLimit / 1048576)
    }

    // Count network requests from resource timing
    const resources = performance.getEntriesByType('resource')
    this.metrics.value.networkRequests = resources.length
  }

  // Update DOM info
  private updateDOMInfo() {
    this.metrics.value.domNodes = document.getElementsByTagName('*').length
  }

  // Add timeline entry
  addTimelineEntry(entry: TimelineEntry) {
    this.timeline.push(entry)
    if (this.timeline.length > 100) {
      this.timeline.shift()
    }
  }

  // Measure render time for a callback
  measureRender(name: string, callback: () => void) {
    const start = performance.now()
    callback()
    const duration = performance.now() - start

    this.metrics.value.renderTime = duration
    this.addTimelineEntry({ name, start: performance.now() - duration, duration, type: 'render' })

    return duration
  }

  // Measure network request
  measureNetwork(name: string, request: () => Promise<any>): Promise<any> {
    const start = performance.now()
    return request().then((result) => {
      const duration = performance.now() - start
      this.addTimelineEntry({ name, start, duration, type: 'network' })
      return result
    })
  }

  // Get average FPS
  getAverageFPS(): number {
    if (this.fpsHistory.length === 0) return 60
    const sum = this.fpsHistory.reduce((a, b) => a + b, 0)
    return Math.round(sum / this.fpsHistory.length)
  }

  // Get FPS grade
  getFPSGrade(): 'good' | 'warning' | 'poor' {
    const avg = this.getAverageFPS()
    if (avg >= 50) return 'good'
    if (avg >= 30) return 'warning'
    return 'poor'
  }

  // Get memory grade
  getMemoryGrade(): 'good' | 'warning' | 'poor' {
    const { memory, memoryLimit } = this.metrics.value
    const ratio = memory / memoryLimit
    if (ratio < 0.6) return 'good'
    if (ratio < 0.8) return 'warning'
    return 'poor'
  }

  // Get performance summary
  getSummary() {
    return {
      fps: {
        current: this.metrics.value.fps,
        average: this.getAverageFPS(),
        grade: this.getFPSGrade()
      },
      memory: {
        used: this.metrics.value.memory,
        limit: this.metrics.value.memoryLimit,
        grade: this.getMemoryGrade()
      },
      domNodes: this.metrics.value.domNodes,
      longTasks: this.metrics.value.longTasks,
      networkRequests: this.metrics.value.networkRequests,
      timeline: this.timeline.slice(-20)
    }
  }

  // Set panel position
  setPosition(x: number, y: number) {
    this.panelPosition.value = { x, y }
  }

  // Get timeline entries
  getTimeline(): TimelineEntry[] {
    return this.timeline
  }

  // Reset profiler data
  reset() {
    this.timeline = []
    this.fpsHistory = []
    this.longTaskCount = 0
    this.metrics.value.longTasks = 0
    this.metrics.value.renderTime = 0
  }

  // Cleanup
  destroy() {
    this.stop()
    this.isVisible.value = false
  }
}

// Singleton instance
export const performanceProfiler = new PerformanceProfilerClass()

// Vue composable wrapper
export function usePerformanceProfiler() {
  const start = () => performanceProfiler.start()
  const stop = () => performanceProfiler.stop()
  const toggle = () => performanceProfiler.toggle()
  const togglePanel = () => performanceProfiler.togglePanel()
  const reset = () => performanceProfiler.reset()
  const getSummary = () => performanceProfiler.getSummary()
  const getTimeline = () => performanceProfiler.getTimeline()

  return {
    metrics: performanceProfiler.metrics,
    isRunning: performanceProfiler.isRunning,
    isVisible: performanceProfiler.isVisible,
    panelPosition: performanceProfiler.panelPosition,
    start,
    stop,
    toggle,
    togglePanel,
    reset,
    getSummary,
    getTimeline
  }
}

export default performanceProfiler
