// Mobile Experience - 移动端体验优化
import { ref, computed, onMounted, onUnmounted } from 'vue'

export type DeviceType = 'mobile' | 'tablet' | 'desktop'
export type Orientation = 'portrait' | 'landscape'

export interface MobileConfig {
  touchOptimized: boolean
  largeTouchTargets: boolean
  swipeGestures: boolean
  pullToRefresh: boolean
  adaptiveLayout: boolean
  safeArea: boolean
}

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
}

export interface TouchGesture {
  type: 'swipe' | 'pinch' | 'rotate' | 'longpress' | 'tap' | 'doubletap'
  direction?: 'up' | 'down' | 'left' | 'right'
  startX: number
  startY: number
  endX: number
  endY: number
  scale?: number
  rotation?: number
  duration: number
}

const defaultConfig: MobileConfig = {
  touchOptimized: true,
  largeTouchTargets: true,
  swipeGestures: true,
  pullToRefresh: true,
  adaptiveLayout: true,
  safeArea: true
}

export function useMobileExperience() {
  // 配置
  const config = ref<MobileConfig>({ ...defaultConfig })

  // 视口信息
  const viewport = ref<ViewportInfo>({
    width: window.innerWidth,
    height: window.innerHeight,
    deviceType: 'desktop',
    orientation: 'portrait',
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    pixelRatio: window.devicePixelRatio,
    isIOS: false,
    isAndroid: false,
    isPWA: false
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

  // 手势监听器
  const gestureListeners = ref<Array<(gesture: TouchGesture) => void>>([])

  // 检测设备类型
  const detectDeviceType = (): DeviceType => {
    const width = window.innerWidth
    if (width < 768) return 'mobile'
    if (width < 1024) return 'tablet'
    return 'desktop'
  }

  // 检测方向
  const detectOrientation = (): Orientation => {
    return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
  }

  // 检测平台
  const detectPlatform = () => {
    const userAgent = navigator.userAgent
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    const isAndroid = /Android/.test(userAgent)
    const isPWA = window.matchMedia('(display-mode: standalone)').matches

    viewport.value.isIOS = isIOS
    viewport.value.isAndroid = isAndroid
    viewport.value.isPWA = isPWA
  }

  // 更新视口信息
  const updateViewport = () => {
    viewport.value.width = window.innerWidth
    viewport.value.height = window.innerHeight
    viewport.value.deviceType = detectDeviceType()
    viewport.value.orientation = detectOrientation()
    viewport.value.isMobile = viewport.value.deviceType === 'mobile'
    viewport.value.isTablet = viewport.value.deviceType === 'tablet'
    viewport.value.isDesktop = viewport.value.deviceType === 'desktop'
    viewport.value.pixelRatio = window.devicePixelRatio
  }

  // 初始化视口监听
  const initViewportListener = () => {
    updateViewport()
    detectPlatform()

    window.addEventListener('resize', updateViewport)
    window.addEventListener('orientationchange', updateViewport)
  }

  // 移除监听
  const removeViewportListener = () => {
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
  const handleTouchEnd = (e: TouchEvent) => {
    if (!touchState.value.isTouching) return

    const startX = touchState.value.startX
    const startY = touchState.value.startY
    const endX = touchState.value.currentX
    const endY = touchState.value.currentY

    const deltaX = endX - startX
    const deltaY = endY - startY
    const now = Date.now()

    // 检测手势类型
    if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
      // 点击
      const isDoubleTap = now - touchState.value.lastTap < 300

      emitGesture({
        type: isDoubleTap ? 'doubletap' : 'tap',
        startX,
        startY,
        endX,
        endY,
        duration: now - touchState.value.lastTap
      })

      touchState.value.lastTap = now
    } else if (config.value.swipeGestures) {
      // 滑动
      const absX = Math.abs(deltaX)
      const absY = Math.abs(deltaY)

      if (absX > 50 || absY > 50) {
        let direction: 'up' | 'down' | 'left' | 'right'

        if (absX > absY) {
          direction = deltaX > 0 ? 'right' : 'left'
        } else {
          direction = deltaY > 0 ? 'down' : 'up'
        }

        emitGesture({
          type: 'swipe',
          direction,
          startX,
          startY,
          endX,
          endY,
          duration: now - touchState.value.lastTap
        })
      }
    }

    touchState.value.isTouching = false
  }

  // 发射手势事件
  const emitGesture = (gesture: TouchGesture) => {
    gestureListeners.value.forEach(listener => listener(gesture))
  }

  // 注册手势监听
  const onGesture = (listener: (gesture: TouchGesture) => void) => {
    gestureListeners.value.push(listener)

    return () => {
      const index = gestureListeners.value.indexOf(listener)
      if (index > -1) {
        gestureListeners.value.splice(index, 1)
      }
    }
  }

  // 启用下拉刷新
  const enablePullToRefresh = (callback: () => void) => {
    let startY = 0
    let currentY = 0
    let isRefreshing = false

    const onTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY
    }

    const onTouchMove = (e: TouchEvent) => {
      currentY = e.touches[0].clientY

      // 只有在页面顶部才能下拉
      if (window.scrollY === 0 && currentY > startY && !isRefreshing) {
        // 可以添加视觉反馈
      }
    }

    const onTouchEnd = () => {
      if (window.scrollY === 0 && currentY - startY > 100) {
        isRefreshing = true
        callback().finally(() => {
          isRefreshing = false
        })
      }
      startY = 0
      currentY = 0
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchmove', onTouchMove, { passive: true })
    document.addEventListener('touchend', onTouchEnd)

    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }

  // 虚拟键盘检测
  const isVirtualKeyboardVisible = computed(() => {
    // 简单检测：视口高度变化超过20%
    return false // 需要在实际使用中通过resize事件动态检测
  })

  // 安全区域
  const safeArea = computed(() => {
    if (!config.value.safeArea) return { top: 0, right: 0, bottom: 0, left: 0 }

    const style = getComputedStyle(document.documentElement)
    const top = parseInt(style.getPropertyValue('--sat') || '0')
    const right = parseInt(style.getPropertyValue('--sar') || '0')
    const bottom = parseInt(style.getPropertyValue('--sab') || '0')
    const left = parseInt(style.getPropertyValue('--sal') || '0')

    return {
      top: top || (viewport.value.isIOS ? 44 : 0),
      right: right || 0,
      bottom: bottom || (viewport.value.isIOS ? 34 : 0),
      left: left || 0
    }
  })

  // 触摸友好的点击
  const handleTap = (element: HTMLElement, callback: () => void) => {
    let pressed = false
    let moved = false

    const onTouchStart = () => {
      pressed = true
      moved = false
      element.classList.add('pressed')
    }

    const onTouchMove = () => {
      moved = true
      element.classList.remove('pressed')
    }

    const onTouchEnd = () => {
      if (pressed && !moved) {
        callback()
      }
      pressed = false
      element.classList.remove('pressed')
    }

    element.addEventListener('touchstart', onTouchStart, { passive: true })
    element.addEventListener('touchmove', onTouchMove, { passive: true })
    element.addEventListener('touchend', onTouchEnd)

    return () => {
      element.removeEventListener('touchstart', onTouchStart)
      element.removeEventListener('touchmove', onTouchMove)
      element.removeEventListener('touchend', onTouchEnd)
    }
  }

  // 滑动手势导航
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
    const threshold = options.threshold || 50
    let startX = 0
    let startY = 0

    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
    }

    const onTouchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX
      const endY = e.changedTouches[0].clientY

      const deltaX = endX - startX
      const deltaY = endY - startY

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > threshold && options.onSwipeRight) {
          options.onSwipeRight()
        } else if (deltaX < -threshold && options.onSwipeLeft) {
          options.onSwipeLeft()
        }
      } else {
        if (deltaY > threshold && options.onSwipeDown) {
          options.onSwipeDown()
        } else if (deltaY < -threshold && options.onSwipeUp) {
          options.onSwipeUp()
        }
      }
    }

    element.addEventListener('touchstart', onTouchStart, { passive: true })
    element.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      element.removeEventListener('touchstart', onTouchStart)
      element.removeEventListener('touchend', onTouchEnd)
    }
  }

  // 设置配置
  const updateConfig = (newConfig: Partial<MobileConfig>) => {
    config.value = { ...config.value, ...newConfig }
  }

  // 切换触摸优化
  const toggleTouchOptimized = (enabled: boolean) => {
    config.value.touchOptimized = enabled
  }

  // 初始化
  const init = () => {
    initViewportListener()
  }

  // 清理
  const cleanup = () => {
    removeViewportListener()
  }

  onMounted(() => {
    init()
  })

  onUnmounted(() => {
    cleanup()
  })

  return {
    // 配置和状态
    config,
    viewport,
    touchState,
    // 计算属性
    safeArea,
    isVirtualKeyboardVisible,
    // 方法
    updateViewport,
    detectDeviceType,
    detectOrientation,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    onGesture,
    enablePullToRefresh,
    handleTap,
    swipeNavigation,
    toggleTouchOptimized,
    // 初始化
    init,
    cleanup
  }
}

export default useMobileExperience
