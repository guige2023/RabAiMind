// Loading Speed Advanced - 加载速度深度优化
import { ref, computed, onMounted, onUnmounted } from 'vue'

export type LoadStrategy = 'sequential' | 'parallel' | 'priority' | 'lazy'

export interface ResourcePriority {
  id: string
  url: string
  type: 'script' | 'style' | 'image' | 'font' | 'data'
  priority: 'critical' | 'high' | 'normal' | 'low'
  loaded: boolean
}

export interface LoadMetrics {
  totalResources: number
  loadedResources: number
  failedResources: number
  avgLoadTime: number
  cacheHitRate: number
}

export function useLoadingSpeedAdvanced() {
  // 加载策略
  const strategy = ref<LoadStrategy>('priority')

  // 资源队列
  const resourceQueue = ref<ResourcePriority[]>([])

  // 加载指标
  const metrics = ref<LoadMetrics>({
    totalResources: 0,
    loadedResources: 0,
    failedResources: 0,
    avgLoadTime: 0,
    cacheHitRate: 0
  })

  // 缓存
  const resourceCache = new Map<string, { data: any; timestamp: number }>()
  const cacheHits = ref(0)
  const cacheMisses = ref(0)

  // 加载优先级
  const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 }

  // 添加资源
  const addResource = (resource: Omit<ResourcePriority, 'loaded'>) => {
    resourceQueue.value.push({ ...resource, loaded: false })
    metrics.value.totalResources++

    // 按优先级排序
    resourceQueue.value.sort((a, b) =>
      priorityOrder[a.priority] - priorityOrder[b.priority]
    )
  }

  // 批量添加资源
  const addResources = (resources: Omit<ResourcePriority, 'loaded'>[]) => {
    resources.forEach(r => addResource(r))
  }

  // 优先级加载
  const loadByPriority = async (): Promise<void> => {
    const priorityGroups: Record<string, ResourcePriority[]> = {
      critical: [],
      high: [],
      normal: [],
      low: []
    }

    // 分组
    resourceQueue.value.forEach(r => {
      priorityGroups[r.priority].push(r)
    })

    // 按组加载
    for (const group of ['critical', 'high', 'normal', 'low'] as const) {
      const resources = priorityGroups[group]
      if (resources.length === 0) continue

      if (group === 'critical' || group === 'high') {
        // 关键资源串行加载
        for (const resource of resources) {
          await loadResource(resource)
        }
      } else {
        // 普通和低级资源并行加载
        await Promise.all(resources.map(r => loadResource(r)))
      }
    }
  }

  // 并行加载
  const loadParallel = async (): Promise<void> => {
    const promises = resourceQueue.value.map(r => loadResource(r))
    await Promise.all(promises)
  }

  // 串行加载
  const loadSequential = async (): Promise<void> => {
    for (const resource of resourceQueue.value) {
      await loadResource(resource)
    }
  }

  // 懒加载
  const loadLazy = async (visibleIds: string[]): Promise<void> => {
    const toLoad = resourceQueue.value.filter(r =>
      visibleIds.includes(r.id) && !r.loaded
    )

    await Promise.all(toLoad.map(r => loadResource(r)))
  }

  // 加载单个资源
  const loadResource = async (resource: ResourcePriority): Promise<void> => {
    const startTime = performance.now()

    // 检查缓存
    if (resourceCache.has(resource.url)) {
      cacheHits.value++
      metrics.value.loadedResources++
      resource.loaded = true
      return
    }

    cacheMisses.value++

    try {
      switch (resource.type) {
        case 'script':
          await loadScript(resource.url)
          break
        case 'style':
          await loadStyle(resource.url)
          break
        case 'image':
          await loadImage(resource.url)
          break
        case 'font':
          await loadFont(resource.url)
          break
        case 'data':
          await loadData(resource.url)
          break
      }

      // 记录加载时间
      const loadTime = performance.now() - startTime
      updateAvgLoadTime(loadTime)

      // 缓存
      resourceCache.set(resource.url, { data: true, timestamp: Date.now() })

      // 更新状态
      resource.loaded = true
      metrics.value.loadedResources++

    } catch (error) {
      metrics.value.failedResources++
      console.error(`Failed to load resource: ${resource.url}`, error)
    }
  }

  // 加载脚本
  const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve()
        return
      }

      const script = document.createElement('script')
      script.src = src
      script.onload = () => resolve()
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`))
      document.head.appendChild(script)
    })
  }

  // 加载样式
  const loadStyle = (href: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`link[href="${href}"]`)) {
        resolve()
        return
      }

      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = href
      link.onload = () => resolve()
      link.onerror = () => reject(new Error(`Failed to load style: ${href}`))
      document.head.appendChild(link)
    })
  }

  // 加载图片
  const loadImage = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve()
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
      img.src = src
    })
  }

  // 加载字体
  const loadFont = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const font = new FontFace('CustomFont', `url(${src})`)
      font.load().then(() => {
        document.fonts.add(font)
        resolve()
      }).catch(() => reject(new Error(`Failed to load font: ${src}`)))
    })
  }

  // 加载数据
  const loadData = async (url: string): Promise<void> => {
    await fetch(url)
  }

  // 更新平均加载时间
  const updateAvgLoadTime = (time: number) => {
    const total = metrics.value.loadedResources
    metrics.value.avgLoadTime =
      (metrics.value.avgLoadTime * (total - 1) + time) / total
  }

  // 预连接
  const preconnect = (url: string) => {
    const link = document.createElement('link')
    link.rel = 'preconnect'
    link.href = url
    document.head.appendChild(link)
  }

  // 预加载
  const preload = (url: string, as: string = 'fetch') => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = url
    link.as = as
    document.head.appendChild(link)
  }

  // DNS预解析
  const dnsPrefetch = (domain: string) => {
    const link = document.createElement('link')
    link.rel = 'dns-prefetch'
    link.href = domain
    document.head.appendChild(link)
  }

  // 开始加载
  const startLoading = async () => {
    switch (strategy.value) {
      case 'priority':
        await loadByPriority()
        break
      case 'parallel':
        await loadParallel()
        break
      case 'sequential':
        await loadSequential()
        break
      case 'lazy':
        await loadLazy([])
        break
    }
  }

  // 清除缓存
  const clearCache = () => {
    resourceCache.clear()
    cacheHits.value = 0
    cacheMisses.value = 0
  }

  // 统计
  const stats = computed(() => ({
    strategy: strategy.value,
    total: metrics.value.totalResources,
    loaded: metrics.value.loadedResources,
    failed: metrics.value.failedResources,
    avgTime: metrics.value.avgLoadTime.toFixed(0) + 'ms',
    cacheHitRate: metrics.value.totalResources > 0
      ? (cacheHits.value / (cacheHits.value + cacheMisses.value) * 100).toFixed(1) + '%'
      : '0%'
  }))

  return {
    strategy,
    resourceQueue,
    metrics,
    stats,
    addResource,
    addResources,
    startLoading,
    loadByPriority,
    loadParallel,
    loadSequential,
    loadLazy,
    preconnect,
    preload,
    dnsPrefetch,
    clearCache
  }
}

export default useLoadingSpeedAdvanced
