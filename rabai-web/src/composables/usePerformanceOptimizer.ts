// Performance optimization composable
import { ref, onMounted, onUnmounted } from 'vue'

interface PerformanceMetrics {
  fps: number
  memory: number
  loadTime: number
  renderTime: number
}

export function usePerformanceOptimizer() {
  const metrics = ref<PerformanceMetrics>({
    fps: 60,
    memory: 0,
    loadTime: 0,
    renderTime: 0
  })

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

    return suggestions
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
    isLowPerformance,
    getMemoryUsage,
    getOptimizationSuggestions,
    startMonitoring,
    stopMonitoring
  }
}

export default usePerformanceOptimizer
