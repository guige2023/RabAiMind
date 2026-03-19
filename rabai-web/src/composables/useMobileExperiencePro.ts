// Mobile Experience Pro - 移动端体验深度优化
import { ref, computed, onMounted, onUnmounted } from 'vue'

export type DeviceType = 'mobile' | 'tablet' | 'desktop'
export type Orientation = 'portrait' | 'landscape'
export type TouchGesture = 'tap' | 'longpress' | 'swipe' | 'pan' | 'pinch' | 'rotate'

export interface ViewportInfo {
  width: number
  height: number
  deviceType: DeviceType
  orientation: Orientation
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  pixelRatio: number
  isIOS: boolean
  isAndroid: boolean
  isPWA: boolean
  isTouch: boolean
}

export interface MobileConfig {
  touchOptimized: boolean
  largeTouchTargets: boolean
  swipeGestures: boolean
  pullToRefresh: boolean
  safeArea: boolean
  adaptiveLayout: boolean
  viewportMeta: boolean
}

export function useMobileExperiencePro() {
  // 配置
  const config = ref<MobileConfig>({
    touchOptimized: true,
    largeTouchTargets: true,
    swipeGestures: true,
    pullToRefresh: true,
    safeArea: true,
    adaptiveLayout: true,
    viewportMeta: true
  })

  // 视口信息
  const viewport = ref<ViewportInfo>({
    width: 0,
    height: 0,
    deviceType: 'desktop',
    orientation: 'portrait',
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    pixelRatio: 1,
    isIOS: false,
    isAndroid: false,
    isPWA: false,
    isTouch: false
  })

  // 触摸状态
  const touchState = ref({
    isTouching: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    lastTap: 0
  })

  // 检测设备
  const detectDevice = () => {
    const width = window.innerWidth
    const height = window.innerHeight
    const ua = navigator.userAgent

    viewport.value.width = width
    viewport.value.height = height
    viewport.value.pixelRatio = window.devicePixelRatio || 1
    viewport.value.orientation = height > width ? 'portrait' : 'landscape'
    viewport.value.deviceType = width < 768 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop'
    viewport.value.isMobile = viewport.value.deviceType === 'mobile'
    viewport.value.isTablet = viewport.value.deviceType === 'tablet'
    viewport.value.isDesktop = viewport.value.deviceType === 'desktop'
    viewport.value.isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    viewport.value.isAndroid = /Android/.test(ua)
    viewport.value.isPWA = window.matchMedia('(display-mode: standalone)').matches
    viewport.value.isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  }

  // 更新视口
  const updateViewport = () => {
    detectDevice()
  }

  // 初始化监听
  const initListeners = () => {
    detectDevice()
    window.addEventListener('resize', updateViewport)
    window.addEventListener('orientationchange', updateViewport)
  }

  // 移除监听
  const removeListeners = () => {
    window.removeEventListener('resize', updateViewport)
    window.removeEventListener('orientationchange', updateViewport)
  }

  // 触摸开始
  const handleTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0]
    touchState.value.isTouching = true
    touchState.value.startX = touch.clientX
    touchState.value.startY = touch.clientY
    touchState.value.currentX = touch.clientX
    touchState.value.currentY = touch.clientY
  }

  // 触摸移动
  const handleTouchMove = (e: TouchEvent) => {
    const touch = e.touches[0]
    touchState.value.currentX = touch.clientX
    touchState.value.currentY = touch.clientY
  }

  // 触摸结束
  const handleTouchEnd = (e: TouchEvent, callbacks: Record<TouchGesture, () => void>) => {
    if (!touchState.value.isTouching) return

    const startX = touchState.value.startX
    const startY = touchState.value.startY
    const endX = touchState.value.currentX
    const endY = touchState.value.currentY
    const deltaX = endX - startX
    const deltaY = endY - startY
    const now = Date.now()

    // 点击
    if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
      const isDoubleTap = now - touchState.value.lastTap < 300
      if (isDoubleTap) {
        callbacks.tap?.()
      } else {
        callbacks.tap?.()
      }
      touchState.value.lastTap = now
    }
    // 滑动
    else if (config.value.swipeGestures) {
      const minSwipe = 50
      if (Math.abs(deltaX) > minSwipe || Math.abs(deltaY) > minSwipe) {
        const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY)
        if (isHorizontal) {
          deltaX > 0 ? callbacks.swipe?.() : callbacks.swipe?.()
        } else {
          deltaY > 0 ? callbacks.swipe?.() : callbacks.swipe?.()
        }
      }
    }

    touchState.value.isTouching = false
  }

  // 安全区域
  const safeArea = computed(() => {
    if (!config.value.safeArea) return { top: 0, right: 0, bottom: 0, left: 0 }

    const style = getComputedStyle(document.documentElement)
    return {
      top: parseInt(style.getPropertyValue('--sat') || '0') || (viewport.value.isIOS ? 44 : 0),
      right: parseInt(style.getPropertyValue('--sar') || '0') || 0,
      bottom: parseInt(style.getPropertyValue('--sab') || '0') || (viewport.value.isIOS ? 34 : 0),
      left: parseInt(style.getPropertyValue('--sal') || '0') || 0
    }
  })

  // 最小触摸目标
  const minTouchSize = 44

  // 优化触摸目标
  const optimizeTouchTarget = (element: HTMLElement) => {
    if (!config.value.largeTouchTargets) return

    const rect = element.getBoundingClientRect()
    const scale = Math.max(minTouchSize / rect.width, minTouchSize / rect.height, 1)

    if (scale > 1) {
      element.style.minWidth = `${rect.width * scale}px`
      element.style.minHeight = `${rect.height * scale}px`
    }
  }

  // 滑动手势
  const swipeNavigation = (
    element: HTMLElement,
    options: {
      onSwipeLeft?: () => void
      onSwipeRight?: () => void
      onSwipeUp?: () => void
      onSwipeDown?: () => void
      threshold?: number
    }
  ) => {
    let startX = 0, startY = 0
    const threshold = options.threshold || 50

    const onStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
    }

    const onEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX
      const endY = e.changedTouches[0].clientY
      const deltaX = endX - startX
      const deltaY = endY - startY

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > threshold) options.onSwipeRight?.()
        else if (deltaX < -threshold) options.onSwipeLeft?.()
      } else {
        if (deltaY > threshold) options.onSwipeDown?.()
        else if (deltaY < -threshold) options.onSwipeUp?.()
      }
    }

    element.addEventListener('touchstart', onStart, { passive: true })
    element.addEventListener('touchend', onEnd, { passive: true })

    return () => {
      element.removeEventListener('touchstart', onStart)
      element.removeEventListener('touchend', onEnd)
    }
  }

  // 下拉刷新
  const enablePullToRefresh = (callback: () => void) => {
    let startY = 0
    const onTouchStart = (e: TouchEvent) => { startY = e.touches[0].clientY }
    const onTouchEnd = (e: TouchEvent) => {
      const endY = e.changedTouches[0].clientY
      if (window.scrollY === 0 && endY - startY > 100) {
        callback()
      }
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }

  // 设备信息
  const deviceInfo = computed(() => ({
    isMobile: viewport.value.isMobile,
    isTablet: viewport.value.isTablet,
    isDesktop: viewport.value.isDesktop,
    isIOS: viewport.value.isIOS,
    isAndroid: viewport.value.isAndroid,
    isPWA: viewport.value.isPWA,
    isTouch: viewport.value.isTouch,
    orientation: viewport.value.orientation,
    pixelRatio: viewport.value.pixelRatio
  }))

  onMounted(() => {
    initListeners()
  })

  onUnmounted(() => {
    removeListeners()
  })

  return {
    config,
    viewport,
    touchState,
    safeArea,
    deviceInfo,
    detectDevice,
    updateViewport,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    optimizeTouchTarget,
    swipeNavigation,
    enablePullToRefresh
  }
}

export default useMobileExperiencePro
