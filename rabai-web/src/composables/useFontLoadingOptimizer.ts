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
  const fontStatuses = ref<Map<string, FontLoadStatus>>(new Map())
  const loadQueue = ref<FontLoadRequest[]>([])
  const loadingFonts = ref<Set<string>>(new Set())
  const loadedFonts = ref<Set<string>>(new Set())
  const config = ref<FontOptimizationConfig>({
    strategy: 'hybrid',
    preloadPriority: 'medium',
    cacheEnabled: true,
    fallbackEnabled: true,
    swapEnabled: true,
    subsetEnabled: false
  })
  const metrics = ref<FontMetrics[]>([])

  const loadFont = async (request: FontLoadRequest): Promise<boolean> => {
    const { fontFamily, url, weight = 400, style = 'normal', display = 'swap', preload = false } = request
    const key = `${fontFamily}-${weight}-${style}`

    if (loadedFonts.value.has(key)) {
      return true
    }

    fontStatuses.value.set(key, { fontFamily, status: 'loading' })
    loadingFonts.value.add(key)

    const startTime = performance.now()

    try {
      let fontFace: FontFace

      if (url) {
        fontFace = new FontFace(fontFamily, `url(${url})`, {
          weight: String(weight),
          style,
          display
        })
      } else {
        fontFace = new FontFace(fontFamily, `local("${fontFamily}")`, {
          weight: String(weight),
          style,
          display
        })
      }

      await fontFace.load()
      document.fonts.add(fontFace)

      const loadTime = performance.now() - startTime

      fontStatuses.value.set(key, {
        fontFamily,
        status: 'loaded',
        loadTime
      })

      loadedFonts.value.add(key)
      loadingFonts.value.delete(key)

      metrics.value.push({
        fontFamily,
        loadTime,
        size: 0,
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

  const loadFonts = async (requests: FontLoadRequest[]): Promise<number> => {
    let successCount = 0

    const priority = requests.filter(r => r.preload)
    const normal = requests.filter(r => !r.preload)

    for (const request of [...priority, ...normal]) {
      if (await loadFont(request)) {
        successCount++
      }
    }

    return successCount
  }

  const preloadCriticalFonts = async (fonts: string[]): Promise<void> => {
    for (const font of fonts) {
      await loadFont({ fontFamily: font, preload: true })
    }
  }

  const lazyLoadFont = async (fontFamily: string): Promise<boolean> => {
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

      observer.observe(document.body)

      setTimeout(() => {
        observer.disconnect()
        resolve(loadFont({ fontFamily }))
      }, 3000)
    })
  }

  const generatePreloadLinks = (fonts: FontLoadRequest[]): string => {
    return fonts
      .filter(f => f.url)
      .map(f => `<link rel="preload" as="font" type="font/woff2" href="${f.url}" crossorigin>`)
      .join('\n')
  }

  const generateFontCSS = (requests: FontLoadRequest[]): string => {
    return requests
      .map(r => {
        const display = r.display || (config.value.swapEnabled ? 'swap' : 'block')
        return `@font-face {
  font-family: '${r.fontFamily}';
  src: ${r.url ? `url('${r.url}')` : `local('${r.fontFamily}')`};
  font-weight: ${r.weight || 400};
  font-style: ${r.style || 'normal'};
  font-display: ${display};
}`
      })
      .join('\n\n')
  }

  const queueFont = (request: FontLoadRequest) => {
    loadQueue.value.push(request)
  }

  const processQueue = async (): Promise<number> => {
    const queue = [...loadQueue.value]
    loadQueue.value = []
    return loadFonts(queue)
  }

  const getFontStatus = (fontFamily: string): FontLoadStatus | undefined => {
    return fontStatuses.value.get(fontFamily)
  }

  const isLoaded = (fontFamily: string): boolean => {
    return loadedFonts.value.has(fontFamily)
  }

  const clearCache = () => {
    loadedFonts.value.clear()
    fontStatuses.value.clear()
    metrics.value = []
  }

  const performanceStats = computed(() => {
    const loadedMetrics = metrics.value.filter(m => m.loadTime > 0)
    const avgTime = loadedMetrics.length > 0
      ? loadedMetrics.reduce((sum, m) => sum + m.loadTime, 0) / loadedMetrics.length
      : 0

    return {
      totalLoaded: loadedFonts.value.size,
      currentlyLoading: loadingFonts.value.size,
      averageLoadTime: Math.round(avgTime),
      totalMetrics: metrics.value.length
    }
  })

  const getOptimizationSuggestions = computed(() => {
    const suggestions: string[] = []

    const largeFonts = metrics.value.filter(m => m.loadTime > 1000)
    if (largeFonts.length > 0) {
      const fontNames = largeFonts.map(f => f.fontFamily).join(', ')
      suggestions.push('建议对以下字体使用懒加载: ' + fontNames)
    }

    const slowFonts = metrics.value.filter(m => (m.loadTime || 0) > 500)
    if (slowFonts.length > 0) {
      const fontNames = slowFonts.map(f => f.fontFamily).join(', ')
      suggestions.push('考虑优化以下字体的加载: ' + fontNames)
    }

    if (config.value.strategy === 'lazy') {
      suggestions.push('建议对关键字体使用预加载策略')
    }

    return suggestions
  })

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
