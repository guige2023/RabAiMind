// Mobile Experience Ultra - 移动端体验极致优化
import { ref, computed, onMounted, onUnmounted } from 'vue'

export interface DeviceInfo {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isIOS: boolean
  isAndroid: boolean
  isWeChat: boolean
  isSafari: boolean
  isChrome: boolean
  screenWidth: number
  screenHeight: number
  pixelRatio: number
  orientation: 'portrait' | 'landscape'
  supportsTouch: boolean
  supportsHover: boolean
}

export interface TouchRegion {
  id: string
  x: number
  y: number
  width: number
  height: number
  action: () => void
  label?: string
}

export interface PullToRefreshConfig {
  enabled: boolean
  threshold: number
  maxPull: number
  color: string
}

export interface SwipeAction {
  id: string
  direction: 'left' | 'right' | 'up' | 'down'
  threshold: number
  action: () => void
  background?: string
  label?: string
}

export interface MobileGesture {
  type: 'tap' | 'longpress' | 'swipe' | 'pan' | 'pinch' | 'rotate'
  handler: (event: TouchEvent) => void
  options?: AddEventListenerOptions
}

export function useMobileExperienceUltra() {
  // 设备信息
  const deviceInfo = ref<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isIOS: false,
    isAndroid: false,
    isWeChat: false,
    isSafari: false,
    isChrome: false,
    screenWidth: 0,
    screenHeight: 0,
    pixelRatio: 1,
    orientation: 'portrait',
    supportsTouch: false,
    supportsHover: false
  })

  // 触摸区域
  const touchRegions = ref<TouchRegion[]>([])

  // 下拉刷新配置
  const pullToRefresh = ref<PullToRefreshConfig>({
    enabled: true,
    threshold: 80,
    maxPull: 150,
    color: '#3b82f6'
  })

  // 滑动操作
  const swipeActions = ref<SwipeAction[]>([])

  // 安全区域
  const safeArea = ref({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  })

  // 键盘状态
  const keyboardVisible = ref(false)
  const keyboardHeight = ref(0)

  // 加载状态
  const isLoading = ref(false)
  const loadingProgress = ref(0)

  // 检测设备
  const detectDevice = () => {
    const ua = navigator.userAgent.toLowerCase()
    const width = window.innerWidth
    const height = window.innerHeight

    deviceInfo.value = {
      isMobile: /mobile|android|iphone|ipad|phone/i.test(ua) || width < 768,
      isTablet: /ipad|tablet|playbook|silk/i.test(ua) || (width >= 768 && width < 1024),
      isDesktop: !/mobile|android|iphone|ipad|phone/i.test(ua) && width >= 1024,
      isIOS: /iphone|ipad|ipod/i.test(ua),
      isAndroid: /android/i.test(ua),
      isWeChat: /micromessenger/i.test(ua),
      isSafari: /safari/i.test(ua) && !/chrome/i.test(ua),
      isChrome: /chrome/i.test(ua) && !/edge/i.test(ua),
      screenWidth: width,
      screenHeight: height,
      pixelRatio: window.devicePixelRatio || 1,
      orientation: width > height ? 'landscape' : 'portrait',
      supportsTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      supportsHover: !('ontouchstart' in window)
    }
  }

  // 检测安全区域
  const detectSafeArea = () => {
    const style = getComputedStyle(document.documentElement)
    safeArea.value = {
      top: parseInt(style.getPropertyValue('--sat') || '0') || (deviceInfo.value.isIOS ? 44 : 0),
      right: parseInt(style.getPropertyValue('--sar') || '0') || 0,
      bottom: parseInt(style.getPropertyValue('--sab') || '0') || (deviceInfo.value.isIOS ? 34 : 0),
      left: parseInt(style.getPropertyValue('--sal') || '0') || 0
    }
  }

  // 键盘监听
  const setupKeyboardListener = () => {
    const handleFocus = () => {
      keyboardVisible.value = true
      keyboardHeight.value = window.innerHeight - document.documentElement.clientHeight
    }

    const handleBlur = () => {
      keyboardVisible.value = false
      keyboardHeight.value = 0
    }

    window.addEventListener('focusin', handleFocus)
    window.addEventListener('focusout', handleBlur)
  }

  // 屏幕方向监听
  const setupOrientationListener = () => {
    const handleChange = () => {
      detectDevice()
      detectSafeArea()
    }

    window.addEventListener('resize', handleChange)
    window.addEventListener('orientationchange', handleChange)

    return () => {
      window.removeEventListener('resize', handleChange)
      window.removeEventListener('orientationchange', handleChange)
    }
  }

  // 触摸区域
  const addTouchRegion = (region: Omit<TouchRegion, 'id'>) => {
    const newRegion: TouchRegion = {
      ...region,
      id: `region_${Date.now()}`
    }
    touchRegions.value.push(newRegion)
    return newRegion.id
  }

  const removeTouchRegion = (id: string) => {
    const index = touchRegions.value.findIndex(r => r.id === id)
    if (index > -1) {
      touchRegions.value.splice(index, 1)
    }
  }

  const checkTouchRegion = (x: number, y: number): TouchRegion | undefined => {
    return touchRegions.value.find(r =>
      x >= r.x && x <= r.x + r.width &&
      y >= r.y && y <= r.y + r.height
    )
  }

  // 下拉刷新
  let pullStartY = 0
  let pullCurrentY = 0
  const pullState = ref({
    isPulling: false,
    pullDistance: 0,
    isRefreshing: false
  })

  const setupPullToRefresh = (element: HTMLElement, onRefresh: () => Promise<void>) => {
    if (!pullToRefresh.value.enabled) return

    const handleTouchStart = (e: TouchEvent) => {
      if (element.scrollTop === 0) {
        pullStartY = e.touches[0].clientY
        pullState.value.isPulling = true
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!pullState.value.isPulling || pullState.value.isRefreshing) return

      pullCurrentY = e.touches[0].clientY
      const diff = pullCurrentY - pullStartY

      if (diff > 0) {
        pullState.value.pullDistance = Math.min(diff, pullToRefresh.value.maxPull)
        e.preventDefault()
      }
    }

    const handleTouchEnd = async () => {
      if (pullState.value.pullDistance >= pullToRefresh.value.threshold && !pullState.value.isRefreshing) {
        pullState.value.isRefreshing = true
        await onRefresh()
        pullState.value.isRefreshing = false
      }

      pullState.value.isPulling = false
      pullState.value.pullDistance = 0
    }

    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }

  // 滑动操作
  const addSwipeAction = (action: Omit<SwipeAction, 'id'>) => {
    const newAction: SwipeAction = {
      ...action,
      id: `swipe_${Date.now()}`
    }
    swipeActions.value.push(newAction)
    return newAction.id
  }

  // 震动反馈
  const vibrate = (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') => {
    if (!navigator.vibrate) return

    const patterns: Record<string, number | number[]> = {
      light: 10,
      medium: 20,
      heavy: 40,
      success: [50, 50, 50],
      warning: [100, 50, 100],
      error: [200, 100, 200]
    }

    navigator.vibrate(patterns[type])
  }

  // 屏幕唤醒
  const wakeLock = ref<WakeLockSentinel | null>(null)

  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLock.value = await navigator.wakeLock.request('screen')
      }
    } catch (err) {
      console.log('Wake Lock not supported')
    }
  }

  const releaseWakeLock = async () => {
    if (wakeLock.value) {
      await wakeLock.value.release()
      wakeLock.value = null
    }
  }

  // 全屏
  const enterFullscreen = async (element?: HTMLElement) => {
    const el = element || document.documentElement
    if (el.requestFullscreen) {
      await el.requestFullscreen()
    }
  }

  const exitFullscreen = async () => {
    if (document.exitFullscreen) {
      await document.exitFullscreen()
    }
  }

  // 复制到剪贴板
  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text)
      vibrate('success')
      return true
    } catch {
      return false
    }
  }

  // 分享
  const share = async (data: { title?: string; text?: string; url?: string }) => {
    if (navigator.share) {
      try {
        await navigator.share(data)
        return true
      } catch {
        return false
      }
    }
    return false
  }

  // 获取CSS变量
  const getMobileStyles = computed(() => {
    const { top, right, bottom, left } = safeArea.value

    return {
      paddingTop: `max(${top}px, env(safe-area-inset-top))`,
      paddingBottom: `max(${bottom}px, env(safe-area-inset-bottom))`,
      paddingLeft: `max(${left}px, env(safe-area-inset-left))`,
      paddingRight: `max(${right}px, env(safe-area-inset-right))`
    }
  })

  // 统计
  const stats = computed(() => ({
    device: deviceInfo.value,
    safeArea: safeArea.value,
    keyboard: {
      visible: keyboardVisible.value,
      height: keyboardHeight.value
    },
    pull: pullState.value,
    touchRegions: touchRegions.value.length,
    swipeActions: swipeActions.value.length,
    isLoading: isLoading.value
  }))

  // 初始化
  onMounted(() => {
    detectDevice()
    detectSafeArea()
    setupKeyboardListener()
    setupOrientationListener()

    // 检测iOS
    if (deviceInfo.value.isIOS) {
      document.body.classList.add('is-ios')
    }
    if (deviceInfo.value.isAndroid) {
      document.body.classList.add('is-android')
    }
    if (deviceInfo.value.isMobile) {
      document.body.classList.add('is-mobile')
    }
  })

  onUnmounted(() => {
    releaseWakeLock()
  })

  return {
    // 设备信息
    deviceInfo,
    detectDevice,
    // 安全区域
    safeArea,
    detectSafeArea,
    getMobileStyles,
    // 触摸区域
    touchRegions,
    addTouchRegion,
    removeTouchRegion,
    checkTouchRegion,
    // 下拉刷新
    pullToRefresh,
    pullState,
    setupPullToRefresh,
    // 滑动操作
    swipeActions,
    addSwipeAction,
    // 键盘
    keyboardVisible,
    keyboardHeight,
    // 震动
    vibrate,
    // 屏幕唤醒
    wakeLock,
    requestWakeLock,
    releaseWakeLock,
    // 全屏
    enterFullscreen,
    exitFullscreen,
    // 剪贴板
    copyToClipboard,
    // 分享
    share,
    // 加载
    isLoading,
    loadingProgress,
    // 统计
    stats
  }
}

export default useMobileExperienceUltra
