// Rendering Performance Advanced - 渲染性能高级优化
import { ref, computed, onMounted, onUnmounted } from 'vue'

export type PerformanceMode = 'performance' | 'balanced' | 'quality'

export interface PerformanceProfile {
  mode: PerformanceMode
  targetFPS: number
  enableHybridRendering: boolean
  enableRenderCaching: boolean
  maxFrameTime: number
}

export interface FrameData {
  timestamp: number
  duration: number
  type: 'script' | 'render' | 'paint' | 'composite'
}

export function useRenderingPerformanceAdvanced() {
  // 性能模式
  const profile = ref<PerformanceProfile>({
    mode: 'balanced',
    targetFPS: 60,
    enableHybridRendering: true,
    enableRenderCaching: true,
    maxFrame: 16.67
  })

  // 帧数据收集
  const frameHistory = ref<FrameData[]>([])
  const maxHistorySize = 300

  // 渲染缓存
  const renderCache = new Map<string, any>()

  // GPU信息
  const gpuInfo = ref({
    renderer: '',
    vendor: '',
    memory: 0,
    isIntegrated: false
  })

  // 检测GPU
  const detectGPU = () => {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext
    if (!gl) return

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
    if (debugInfo) {
      gpuInfo.value.renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      gpuInfo.value.vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
      gpuInfo.value.isIntegrated = gpuInfo.value.renderer.toLowerCase().includes('intel')
    }
  }

  // 帧时间追踪
  let lastFrameTime = performance.now()
  const trackFrame = (type: FrameData['type'] = 'render') => {
    const now = performance.now()
    const duration = now - lastFrameTime
    lastFrameTime = now

    frameHistory.value.push({ timestamp: now, duration, type })
    if (frameHistory.value.length > maxHistorySize) {
      frameHistory.value.shift()
    }
  }

  // 智能帧跳过
  const shouldSkipFrame = computed(() => {
    const recent = frameHistory.value.slice(-10)
    const avgDuration = recent.reduce((sum, f) => sum + f.duration, 0) / recent.length
    return avgDuration > profile.value.maxFrameTime
  })

  // 混合渲染
  const hybridRendering = ref(false)

  const enableHybridMode = () => {
    hybridRendering.value = true
    // 使用CSS transform代替重排
    document.body.style.contain = 'layout paint'
  }

  const disableHybridMode = () => {
    hybridRendering.value = false
    document.body.style.contain = ''
  }

  // 渲染缓存
  const getCachedRender = <T>(key: string, generator: () => T): T => {
    if (!profile.value.enableRenderCaching) return generator()

    if (renderCache.has(key)) {
      return renderCache.get(key)
    }

    const result = generator()
    renderCache.set(key, result)
    return result
  }

  const clearRenderCache = () => {
    renderCache.clear()
  }

  // 性能报告
  const performanceReport = computed(() => {
    const recent = frameHistory.value.slice(-60)
    if (recent.length === 0) return null

    const avgFrameTime = recent.reduce((sum, f) => sum + f.duration, 0) / recent.length
    const fps = Math.round(1000 / avgFrameTime)
    const jankFrames = recent.filter(f => f.duration > 16.67).length
    const jankRate = (jankFrames / recent.length) * 100

    return {
      fps,
      avgFrameTime: avgFrameTime.toFixed(2),
      jankRate: jankRate.toFixed(1) + '%',
      gpu: gpuInfo.value.renderer,
      mode: profile.value.mode,
      cacheSize: renderCache.size
    }
  })

  // 自动优化建议
  const optimizationSuggestions = computed(() => {
    const suggestions: string[] = []

    const report = performanceReport.value
    if (!report) return suggestions

    if (report.fps < 30) {
      suggestions.push('FPS过低，建议启用硬件加速')
      suggestions.push('考虑减少页面元素数量')
    }

    if (parseFloat(report.jankRate) > 20) {
      suggestions.push('存在大量卡顿帧，建议优化JavaScript执行')
    }

    if (gpuInfo.value.isIntegrated) {
      suggestions.push('使用集成显卡，建议降低动画复杂度')
    }

    if (renderCache.size > 100) {
      suggestions.push('渲染缓存较大，建议定期清理')
    }

    return suggestions
  })

  // 性能模式切换
  const setPerformanceMode = (mode: PerformanceMode) => {
    profile.value.mode = mode

    switch (mode) {
      case 'performance':
        profile.value.targetFPS = 30
        profile.value.maxFrameTime = 33
        profile.value.enableHybridRendering = true
        profile.value.enableRenderCaching = true
        enableHybridMode()
        break
      case 'balanced':
        profile.value.targetFPS = 60
        profile.value.maxFrameTime = 16.67
        profile.value.enableHybridRendering = true
        profile.value.enableRenderCaching = true
        break
      case 'quality':
        profile.value.targetFPS = 60
        profile.value.maxFrameTime = 16.67
        profile.value.enableHybridRendering = false
        profile.value.enableRenderCaching = false
        disableHybridMode()
        break
    }
  }

  // FPS监测
  let monitorInterval: ReturnType<typeof setInterval> | null = null

  const startAdvancedMonitoring = () => {
    detectGPU()

    monitorInterval = setInterval(() => {
      trackFrame('render')
    }, 1000 / profile.value.targetFPS)
  }

  const stopAdvancedMonitoring = () => {
    if (monitorInterval) {
      clearInterval(monitorInterval)
      monitorInterval = null
    }
  }

  // 统计
  const stats = computed(() => ({
    mode: profile.value.mode,
    fps: performanceReport.value?.fps || 60,
    jankRate: performanceReport.value?.jankRate || '0%',
    suggestions: optimizationSuggestions.value.length,
    cacheSize: renderCache.size,
    gpu: gpuInfo.value.renderer || 'Unknown'
  }))

  onMounted(() => {
    detectGPU()
    startAdvancedMonitoring()
  })

  onUnmounted(() => {
    stopAdvancedMonitoring()
    renderCache.clear()
  })

  return {
    profile,
    frameHistory,
    gpuInfo,
    hybridRendering,
    performanceReport,
    optimizationSuggestions,
    stats,
    setPerformanceMode,
    trackFrame,
    enableHybridMode,
    disableHybridMode,
    getCachedRender,
    clearRenderCache,
    startAdvancedMonitoring,
    stopAdvancedMonitoring
  }
}

export default useRenderingPerformanceAdvanced
