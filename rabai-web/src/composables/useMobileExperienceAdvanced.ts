// Mobile Experience Advanced - 移动端体验高级优化
import { ref, computed, onMounted, onUnmounted } from 'vue'

export type DeviceCapability = 'touch' | 'gyroscope' | 'accelerometer' | 'vibration' | 'camera' | 'geolocation' | 'bluetooth' | 'nfc'

export interface DeviceProfile {
  os: string
  osVersion: string
  browser: string
  browserVersion: string
  screenSize: { width: number; height: number }
  pixelRatio: number
  isPWA: boolean
  isStandalone: boolean
  supportsTouch: boolean
  supportsHover: boolean
  networkType: 'slow-2g' | '2g' | '3g' | '4g' | '5g' | 'wifi' | 'unknown'
}

export interface AdaptiveLayout {
  name: string
  minWidth: number
  maxWidth: number
  columns: number
  fontSize: string
  spacing: string
}

export function useMobileExperienceAdvanced() {
  // 设备信息
  const deviceProfile = ref<DeviceProfile>({
    os: '',
    osVersion: '',
    browser: '',
    browserVersion: '',
    screenSize: { width: 0, height: 0 },
    pixelRatio: 1,
    isPWA: false,
    isStandalone: false,
    supportsTouch: false,
    supportsHover: false,
    networkType: 'unknown'
  })

  // 设备能力
  const capabilities = ref<Set<DeviceCapability>>(new Set())

  // 自适应布局
  const adaptiveLayouts = ref<AdaptiveLayout[]>([
    { name: '手机竖屏', minWidth: 0, maxWidth: 479, columns: 1, fontSize: '14px', spacing: '8px' },
    { name: '手机横屏', minWidth: 480, maxWidth: 767, columns: 2, fontSize: '14px', spacing: '12px' },
    { name: '平板竖屏', minWidth: 768, maxWidth: 1023, columns: 3, fontSize: '15px', spacing: '16px' },
    { name: '平板横屏', minWidth: 1024, maxWidth: 1279, columns: 4, fontSize: '15px', spacing: '16px' },
    { name: '桌面', minWidth: 1280, maxWidth: Infinity, columns: 5, fontSize: '16px', spacing: '20px' }
  ])

  // 当前布局
  const currentLayout = ref<AdaptiveLayout>(adaptiveLayouts.value[0])

  // 检测设备
  const detectDevice = () => {
    const ua = navigator.userAgent

    // OS检测
    if (/iPhone|iPad|iPod/.test(ua)) {
      deviceProfile.value.os = 'iOS'
      const match = ua.match(/OS (\d+)_/)
      if (match) deviceProfile.value.osVersion = match[1]
    } else if (/Android/.test(ua)) {
      deviceProfile.value.os = 'Android'
      const match = ua.match(/Android (\d+)/)
      if (match) deviceProfile.value.osVersion = match[1]
    } else if (/Mac/.test(ua)) {
      deviceProfile.value.os = 'macOS'
    } else if (/Windows/.test(ua)) {
      deviceProfile.value.os = 'Windows'
    }

    // 浏览器检测
    if (/Chrome/.test(ua)) {
      deviceProfile.value.browser = 'Chrome'
    } else if (/Safari/.test(ua)) {
      deviceProfile.value.browser = 'Safari'
    } else if (/Firefox/.test(ua)) {
      deviceProfile.value.browser = 'Firefox'
    } else if (/Edge/.test(ua)) {
      deviceProfile.value.browser = 'Edge'
    }

    // 屏幕信息
    deviceProfile.value.screenSize = {
      width: window.screen.width,
      height: window.screen.height
    }
    deviceProfile.value.pixelRatio = window.devicePixelRatio || 1

    // PWA检测
    deviceProfile.value.isPWA = window.matchMedia('(display-mode: standalone)').matches
    deviceProfile.value.isStandalone = window.matchMedia('(display-mode: standalone)').matches

    // 触摸支持
    deviceProfile.value.supportsTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    deviceProfile.value.supportsHover = !deviceProfile.value.supportsTouch

    // 网络类型
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      deviceProfile.value.networkType = connection.effectiveType || 'unknown'
    }

    // 检测设备能力
    detectCapabilities()
  }

  // 检测设备能力
  const detectCapabilities = () => {
    const caps: DeviceCapability[] = []

    if (deviceProfile.value.supportsTouch) caps.push('touch')
    if ('vibrate' in navigator) caps.push('vibration')
    if ('geolocation' in navigator) caps.push('geolocation')
    if ('mediaDevices' in navigator && 'getUserMedia' in (navigator as any).mediaDevices) caps.push('camera')
    if ('bluetooth' in navigator) caps.push('bluetooth')
    if ('NDEFReader' in window) caps.push('nfc')

    capabilities.value = new Set(caps)
  }

  // 更新布局
  const updateLayout = () => {
    const width = window.innerWidth

    for (const layout of adaptiveLayouts.value) {
      if (width >= layout.minWidth && width <= layout.maxWidth) {
        currentLayout.value = layout
        applyLayout(layout)
        break
      }
    }
  }

  // 应用布局
  const applyLayout = (layout: AdaptiveLayout) => {
    const root = document.documentElement
    root.style.setProperty('--adaptive-columns', layout.columns.toString())
    root.style.setProperty('--adaptive-font-size', layout.fontSize)
    root.style.setProperty('--adaptive-spacing', layout.spacing)
  }

  // 触摸优化
  const optimizeTouchTargets = (container: HTMLElement) => {
    const minSize = 44 // 最小触摸区域
    const elements = container.querySelectorAll('button, a, input, select, [role="button"]')

    elements.forEach((el) => {
      const htmlEl = el as HTMLElement
      const rect = htmlEl.getBoundingClientRect()

      if (rect.width < minSize || rect.height < minSize) {
        htmlEl.style.minWidth = `${Math.max(rect.width, minSize)}px`
        htmlEl.style.minHeight = `${Math.max(rect.height, minSize)}px`
      }
    })
  }

  // 触觉反馈
  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => {
    if (!capabilities.value.has('vibration')) return

    const patterns: Record<string, number | number[]> = {
      light: 10,
      medium: 20,
      heavy: 30,
      success: [10, 50, 10],
      warning: [20, 30, 20],
      error: [30, 50, 30]
    }

    navigator.vibrate(patterns[type])
  }

  // 屏幕方向处理
  const handleOrientationChange = (callback: (orientation: 'portrait' | 'landscape') => void) => {
    const check = () => {
      const orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
      callback(orientation)
    }

    window.addEventListener('resize', check)
    window.addEventListener('orientationchange', check)

    return () => {
      window.removeEventListener('resize', check)
      window.removeEventListener('orientationchange', check)
    }
  }

  // 网络状态优化
  const optimizeForNetwork = () => {
    const type = deviceProfile.value.networkType

    if (type === 'slow-2g' || type === '2g') {
      // 禁用动画
      document.documentElement.style.setProperty('--animation', 'none')
      // 减少图片质量
      document.querySelectorAll('img').forEach(img => {
        (img as HTMLImageElement).loading = 'lazy'
      })
    }
  }

  // 智能预加载
  const smartPreload = (resources: string[]) => {
    const type = deviceProfile.value.networkType

    if (type === '4g' || type === '5g' || type === 'wifi') {
      // 快速网络 - 全部预加载
      resources.forEach(src => {
        const link = document.createElement('link')
        link.rel = 'preload'
        link.href = src
        document.head.appendChild(link)
      })
    } else {
      // 慢速网络 - 仅预加载关键资源
      if (resources.length > 0) {
        const link = document.createElement('link')
        link.rel = 'preload'
        link.href = resources[0]
        document.head.appendChild(link)
      }
    }
  }

  // 离线支持
  const isOnline = ref(navigator.onLine)

  const setupOfflineSupport = () => {
    const handleOnline = () => { isOnline.value = true }
    const handleOffline = () => { isOnline.value = false }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }

  // 统计
  const stats = computed(() => ({
    os: deviceProfile.value.os,
    isMobile: deviceProfile.value.os === 'iOS' || deviceProfile.value.os === 'Android',
    isPWA: deviceProfile.value.isPWA,
    supportsTouch: deviceProfile.value.supportsTouch,
    networkType: deviceProfile.value.networkType,
    currentLayout: currentLayout.value.name,
    capabilities: Array.from(capabilities.value),
    isOnline: isOnline.value
  }))

  // 初始化
  onMounted(() => {
    detectDevice()
    updateLayout()
    window.addEventListener('resize', updateLayout)
    setupOfflineSupport()
  })

  onUnmounted(() => {
    window.removeEventListener('resize', updateLayout)
  })

  return {
    deviceProfile,
    capabilities,
    adaptiveLayouts,
    currentLayout,
    isOnline,
    stats,
    detectDevice,
    updateLayout,
    optimizeTouchTargets,
    triggerHaptic,
    handleOrientationChange,
    optimizeForNetwork,
    smartPreload
  }
}

export default useMobileExperienceAdvanced
