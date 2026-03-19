// Font Loading Optimization - 字体加载优化
import { ref, computed } from 'vue'

export interface FontLoadRequest {
  fontFamily: string
  url?: string
  weight?: number
  style?: 'normal' | 'italic'
  display?: 'swap' | 'block' | 'fallback' | 'optional'
  preload?: boolean
}

export interface FontLoadStatus {
  fontFamily: string
  status: 'pending' | 'loading' | 'loaded' | 'error'
  loadTime?: number
  error?: string
}

export interface FontOptimizationConfig {
  strategy: 'preload' | 'lazy' | 'hybrid' | 'critical'
  preloadPriority: 'high' | 'medium' | 'low'
  cacheEnabled: boolean
  fallbackEnabled: boolean
  swapEnabled: boolean
  subsetEnabled: boolean
}

export interface FontMetrics {
  fontFamily: string
  loadTime: number
  size: number
  firstContentfulPaint: number
}

export function useFontLoadingOptimizer() {
  // 字体加载状态
  const fontStatuses = ref<Map<string, FontLoadStatus>>(new Map())

  // 加载队列
  const loadQueue = ref<FontLoadRequest[]>([])

  // 加载中的字体
  const loadingFonts = ref<Set<string>>(new Set())

  // 已加载字体缓存
  const loadedFonts = ref<Set<string>>(new Set())

  // 优化配置
  const config = ref<FontOptimizationConfig>({
    strategy: 'hybrid',
    preloadPriority: 'medium',
    cacheEnabled: true,
    fallbackEnabled: true,
    swapEnabled: true,
    subsetEnabled: false
  })

  // 性能指标
  const metrics = ref<FontMetrics[]>([])

  // 加载字体
  const loadFont = async (request: FontLoadRequest): Promise<boolean> => {
    const { fontFamily, url, weight = 400, style = 'normal', display = 'swap', preload = false } = request

    const key = `${fontFamily}-${weight}-${style}`

    // 如果已加载，跳过
    if (loadedFonts.value.has(key)) {
      return true
    }

    // 设置状态
    fontStatuses.value.set(key, { fontFamily, status: 'loading' })
    loadingFonts.value.add(key)

    const startTime = performance.now()

    try {
      // 创建字体加载
      let fontFace: FontFace

      if (url) {
        // 远程字体
        fontFace = new FontFace(fontFamily, `url(${url})`, {
          weight,
          style,
          display
        })
      } else {
        // 系统字体
        fontFace = new FontFace(fontFamily, `local("${fontFamily}")`, {
          weight,
          style,
          display
        })
      }

      await fontFace.load()
      document.fonts.add(fontFace)

      const loadTime = performance.now() - startTime

      // 更新状态
      fontStatuses.value.set(key, {
        fontFamily,
        status: 'loaded',
        loadTime
      })

      loadedFonts.value.add(key)
      loadingFonts.value.delete(key)

      // 记录指标
      metrics.value.push({
        fontFamily,
        loadTime,
        size: 0, // 无法直接获取
        firstContentfulPaint: 0
      })

      return true
    } catch (error) {
      fontStatuses.value.set(key, {
        fontFamily,
        status: 'error',
        error: (error as Error).message
      })

      loadingFonts.value.delete(key)
      return false
    }
  }

  // 批量加载
  const loadFonts = async (requests: FontLoadRequest[]): Promise<number> => {
    let successCount = 0

    // 根据策略决定加载方式
    if (config.value.strategy === 'parallel') {
      // 并行加载
      const results = await Promise.all(requests.map(r => loadFont(r)))
      successCount = results.filter(r => r).length
    } else if (config.value.strategy === 'sequential') {
      // 串行加载
      for (const request of requests) {
        if (await loadFont(request)) {
          successCount++
        }
      }
    } else {
      // 混合策略 - 优先加载高优先级
      const priority = requests.filter(r => r.preload)
      const normal = requests.filter(r => !r.preload)

      for (const request of [...priority, ...normal]) {
        if (await loadFont(request)) {
          successCount++
        }
      }
    }

    return successCount
  }

  // 预加载关键字体
  const preloadCriticalFonts = async (fonts: string[]): Promise<void> => {
    for (const font of fonts) {
      await loadFont({ fontFamily: font, preload: true })
    }
  }

  // 懒加载字体
  const lazyLoadFont = async (fontFamily: string): Promise<boolean> => {
    // 使用Intersection Observer检测可见性
    return new Promise((resolve) => {
      const observer = new IntersectionObserver(
        async (entries) => {
          if (entries[0].isIntersecting) {
            observer.disconnect()
            const result = await loadFont({ fontFamily })
            resolve(result)
          }
        },
        { threshold: 0.1 }
      )

      // 观察body
      observer.observe(document.body)

      // 超时自动加载
      setTimeout(() => {
        observer.disconnect()
        resolve(loadFont({ fontFamily }))
      }, 3000)
    })
  }

  // 生成预加载链接
  const generatePreloadLinks = (fonts: FontLoadRequest[]): string => {
    return fonts
      .filter(f => f.url)
      .map(f => `<link rel="preload" as="font" type="font/woff2" href="${f.url}" crossorigin>`)
      .join('\n')
  }

  // 生成字体CSS
  const generateFontCSS = (requests: FontLoadRequest[]): string => {
    return requests
      .map(r => {
        const display = r.display || (config.value.swapEnabled ? 'swap' : 'block')
        return `@font-face {
  font-family: '${r.fontFamily}';
  src: ${r.url ? `url('${r.url}')` : `local('${r.fontFamily}')'};
  font-weight: ${r.weight || 400};
  font-style: ${r.style || 'normal'};
  font-display: ${display};
}`
      })
      .join('\n\n')
  }

  // 添加到加载队列
  const queueFont = (request: FontLoadRequest) => {
    loadQueue.value.push(request)
  }

  // 处理队列
  const processQueue = async (): Promise<number> => {
    const queue = [...loadQueue.value]
    loadQueue.value = []
    return loadFonts(queue)
  }

  // 获取字体状态
  const getFontStatus = (fontFamily: string): FontLoadStatus | undefined => {
    return fontStatuses.value.get(fontFamily)
  }

  // 检查是否已加载
  const isLoaded = (fontFamily: string): boolean => {
    return loadedFonts.value.has(fontFamily)
  }

  // 清除缓存
  const clearCache = () => {
    loadedFonts.value.clear()
    fontStatuses.value.clear()
    metrics.value = []
  }

  // 获取性能统计
  const performanceStats = computed(() => {
    const loaded = metrics.value.filter(m => m.status === 'loaded')
    const avgTime = loaded.length > 0
      ? loaded.reduce((sum, m) => sum + m.loadTime, 0) / loaded.length
      : 0

    return {
      totalLoaded: loadedFonts.value.size,
      currentlyLoading: loadingFonts.value.size,
      averageLoadTime: Math.round(avgTime),
      totalMetrics: metrics.value.length
    }
  })

  // 优化策略建议
  const getOptimizationSuggestions = computed(() => {
    const suggestions: string[] = []

    // 检测大字体文件
    const largeFonts = metrics.value.filter(m => m.loadTime > 1000)
    if (largeFonts.length > 0) {
      suggestions.push(`建议对以下字体使用懒加载: ${largeFonts.map(f => f.fontFamily).join(', ')}`)
    }

    // 检测慢加载
    const slowFonts = metrics.value.filter(m => (m.loadTime || 0) > 500)
    if (slowFonts.length > 0) {
      suggestions.push(`考虑优化以下字体的加载: ${slowFonts.map(f => f.fontFamily).join(', ')}`)
    }

    // 建议使用预加载
    if (config.value.strategy === 'lazy') {
      suggestions.push('建议对关键字体使用预加载策略')
    }

    return suggestions
  })

  // 更新配置
  const updateConfig = (updates: Partial<FontOptimizationConfig>) => {
    Object.assign(config.value, updates)
  }

  return {
    fontStatuses,
    loadQueue,
    loadingFonts,
    loadedFonts,
    config,
    metrics,
    loadFont,
    loadFonts,
    preloadCriticalFonts,
    lazyLoadFont,
    generatePreloadLinks,
    generateFontCSS,
    queueFont,
    processQueue,
    getFontStatus,
    isLoaded,
    clearCache,
    performanceStats,
    getOptimizationSuggestions,
    updateConfig
  }
}

export default useFontLoadingOptimizer
