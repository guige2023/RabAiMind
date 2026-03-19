// Loading Experience Optimizer - 加载体验深度优化
import { ref, computed, onMounted, onUnmounted } from 'vue'

export type LoadingStrategy = 'eager' | 'lazy' | 'progressive' | 'skeleton' | 'placeholder'

export interface LoadingConfig {
  strategy: LoadingStrategy
  enablePreload: boolean
  enableCache: boolean
  priorityQueue: string[]
  skeletonType: 'shimmer' | 'pulse' | 'gradient'
}

export interface LoadingProgress {
  stage: string
  progress: number
  estimatedTime: number
}

export interface ResourceHint {
  rel: string
  href: string
  as: 'script' | 'style' | 'image' | 'font'
  crossorigin?: boolean
}

export function useLoadingExperienceOptimizer() {
  // 配置
  const config = ref<LoadingConfig>({
    strategy: 'progressive',
    enablePreload: true,
    enableCache: true,
    priorityQueue: [],
    skeletonType: 'shimmer'
  })

  // 加载进度
  const progress = ref<LoadingProgress[]>([])

  // 当前状态
  const currentStage = ref('')
  const isLoading = ref(false)
  const loadingStartTime = ref(0)

  // 预加载资源
  const preloadQueue = ref<ResourceHint[]>([])

  // 缓存
  const resourceCache = ref<Map<string, { loaded: boolean; time: number }>>(new Map())

  // 资源提示
  const addPreloadHint = (hint: ResourceHint) => {
    preloadQueue.value.push(hint)

    const link = document.createElement('link')
    link.rel = hint.rel
    link.href = hint.href
    link.as = hint.as
    if (hint.crossorigin) link.crossOrigin = 'anonymous'
    document.head.appendChild(link)
  }

  // 预加载关键资源
  const preloadCriticalResources = (resources: ResourceHint[]) => {
    resources.forEach(resource => {
      addPreloadHint(resource)
    })
  }

  // 图片懒加载
  const lazyLoadImages = (selector = 'img[data-src]') => {
    if (!('IntersectionObserver' in window)) {
      // 回退
      document.querySelectorAll(selector).forEach(img => {
        const src = img.getAttribute('data-src')
        if (src) {
          img.setAttribute('src', src)
          img.removeAttribute('data-src')
        }
      })
      return
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          const src = img.getAttribute('data-src')
          if (src) {
            img.src = src
            img.removeAttribute('data-src')
            img.classList.add('loaded')
          }
          observer.unobserve(img)
        }
      })
    }, {
      rootMargin: '100px',
      threshold: 0.1
    })

    document.querySelectorAll(selector).forEach(img => {
      img.classList.add('lazy-loading')
      observer.observe(img)
    })
  }

  // 组件懒加载
  const lazyLoadComponent = async (componentPath: string): Promise<any> => {
    // 检查缓存
    if (config.value.enableCache && resourceCache.value.get(componentPath)?.loaded) {
      return Promise.resolve(null)
    }

    try {
      const module = await import(/* @vite-ignore */ componentPath)
      resourceCache.value.set(componentPath, { loaded: true, time: Date.now() })
      return module.default || module
    } catch (error) {
      console.error('Failed to load component:', error)
      return null
    }
  }

  // 渐进式加载
  const progressiveLoad = async (
    stages: { name: string; load: () => Promise<any> }[]
  ): Promise<any[]> => {
    isLoading.value = true
    loadingStartTime.value = Date.now()
    progress.value = []

    const results: any[] = []

    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i]
      currentStage.value = stage.name

      // 记录进度
      progress.value.push({
        stage: stage.name,
        progress: Math.round(((i) / stages.length) * 100),
        estimatedTime: 0
      })

      try {
        const result = await stage.load()
        results.push(result)
      } catch (error) {
        results.push(null)
      }

      // 更新进度
      progress.value[progress.value.length - 1].progress = Math.round(((i + 1) / stages.length) * 100)
    }

    isLoading.value = false
    currentStage.value = ''

    return results
  }

  // 骨架屏
  const generateSkeletonHTML = (count: number, type: 'card' | 'text' | 'image' = 'card'): string => {
    const skeletons: string[] = []

    for (let i = 0; i < count; i++) {
      if (type === 'card') {
        skeletons.push(`
          <div class="skeleton-card">
            <div class="skeleton-image"></div>
            <div class="skeleton-title"></div>
            <div class="skeleton-text"></div>
            <div class="skeleton-text short"></div>
          </div>
        `)
      } else if (type === 'text') {
        skeletons.push(`
          <div class="skeleton-text">
            <div class="skeleton-line"></div>
            <div class="skeleton-line"></div>
            <div class="skeleton-line short"></div>
          </div>
        `)
      } else if (type === 'image') {
        skeletons.push(`<div class="skeleton-image large"></div>`)
      }
    }

    return skeletons.join('')
  }

  // CSS骨架屏样式
  const skeletonStyles = computed(() => {
    const base = `
      .skeleton-shimmer {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
      }
      .skeleton-pulse {
        animation: pulse 1.5s ease-in-out infinite;
      }
      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      .skeleton-card {
        padding: 16px;
        border-radius: 8px;
        background: #fff;
      }
      .skeleton-image {
        height: 120px;
        border-radius: 4px;
        background: #e0e0e0;
      }
      .skeleton-image.large {
        height: 200px;
      }
      .skeleton-title {
        height: 20px;
        margin: 12px 0 8px;
        border-radius: 4px;
        background: #e0e0e0;
      }
      .skeleton-text {
        height: 14px;
        margin-bottom: 8px;
        border-radius: 4px;
        background: #e0e0e0;
      }
      .skeleton-text.short {
        width: 60%;
      }
      .skeleton-line {
        height: 12px;
        margin-bottom: 8px;
        border-radius: 4px;
        background: #e0e0e0;
      }
    `
    return base
  })

  // 数据预取
  const prefetchData = async (urls: string[]) => {
    const promises = urls.map(async (url) => {
      try {
        await fetch(url, { method: 'HEAD' })
        return { url, success: true }
      } catch {
        return { url, success: false }
      }
    })

    return Promise.all(promises)
  }

  // 智能加载策略
  const smartLoad = async (
    critical: () => Promise<any>,
    nonCritical: () => Promise<any>
  ): Promise<{ critical: any; nonCritical: any }> => {
    // 优先加载关键内容
    const criticalResult = await critical()

    // 非关键内容并行加载
    const nonCriticalPromise = nonCritical()

    // 等待非关键内容，但设置较短超时
    let nonCriticalResult = null
    try {
      nonCriticalResult = await Promise.race([
        nonCriticalPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
      ])
    } catch {
      // 超时或出错，使用占位
    }

    return { critical: criticalResult, nonCritical: nonCriticalResult }
  }

  // 加载完成回调
  const onLoaded = ref<(() => void) | null>(null)

  // 设置加载完成回调
  const setLoadedCallback = (callback: () => void) => {
    onLoaded.value = callback
  }

  // 触发加载完成
  const triggerLoaded = () => {
    if (onLoaded.value) {
      onLoaded.value()
    }
  }

  // 统计
  const stats = computed(() => ({
    isLoading: isLoading.value,
    currentStage: currentStage.value,
    progress: progress.value.length > 0 ? progress.value[progress.value.length - 1].progress : 0,
    preloadCount: preloadQueue.value.length,
    cacheSize: resourceCache.value.size,
    loadingTime: isLoading.value ? Date.now() - loadingStartTime.value : 0
  }))

  return {
    config,
    progress,
    currentStage,
    isLoading,
    preloadQueue,
    resourceCache,
    skeletonStyles,
    stats,
    addPreloadHint,
    preloadCriticalResources,
    lazyLoadImages,
    lazyLoadComponent,
    progressiveLoad,
    generateSkeletonHTML,
    prefetchData,
    smartLoad,
    setLoadedCallback,
    triggerLoaded
  }
}

export default useLoadingExperienceOptimizer
