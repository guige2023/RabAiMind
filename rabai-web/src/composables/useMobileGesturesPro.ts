// Mobile Gestures Pro - 移动端手势深度优化
import { ref, computed, onMounted, onUnmounted } from 'vue'

export type GestureType =
  | 'tap' | 'doubletap' | 'longpress'
  | 'swipe' | 'swipeleft' | 'swiperight' | 'swipeup' | 'swipedown'
  | 'pan' | 'pinch' | 'rotate'
  | 'drag' | 'drop'

export interface GestureConfig {
  enabled: boolean
  preventDefault: boolean
  threshold: number
  longPressDuration: number
  doubleTapDelay: number
}

export interface GestureEvent {
  type: GestureType
  startX: number
  startY: number
  endX: number
  endY: number
  deltaX: number
  deltaY: number
  distance: number
  angle: number
  velocity: number
  scale?: number
  rotation?: number
  duration: number
}

export interface GestureCallbacks {
  onTap?: (e: GestureEvent) => void
  onDoubleTap?: (e: GestureEvent) => void
  onLongPress?: (e: GestureEvent) => void
  onSwipe?: (e: GestureEvent) => void
  onSwipeLeft?: (e: GestureEvent) => void
  onSwipeRight?: (e: GestureEvent) => void
  onSwipeUp?: (e: GestureEvent) => void
  onSwipeDown?: (e: GestureEvent) => void
  onPan?: (e: GestureEvent) => void
  onPinch?: (e: GestureEvent) => void
  onRotate?: (e: GestureEvent) => void
}

export function useMobileGesturesPro() {
  // 配置
  const config = ref<GestureConfig>({
    enabled: true,
    preventDefault: true,
    threshold: 10,
    longPressDuration: 500,
    doubleTapDelay: 300
  })

  // 手势状态
  const gestureState = ref({
    isActive: false,
    startX: 0,
    startY: 0,
    startTime: 0,
    lastTapTime: 0,
    lastTapX: 0,
    lastTapY: 0,
    initialDistance: 0,
    initialAngle: 0
  })

  // 手势历史
  const gestureHistory = ref<GestureEvent[]>([])

  // 当前手势
  const currentGesture = ref<GestureEvent | null>(null)

  // 计算两点距离
  const getDistance = (x1: number, y1: number, x2: number, y2: number) => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
  }

  // 计算角度
  const getAngle = (x1: number, y1: number, x2: number, y2: number) => {
    return Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI)
  }

  // 创建手势事件
  const createGestureEvent = (
    type: GestureType,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    extra?: { scale?: number; rotation?: number }
  ): GestureEvent => {
    const deltaX = endX - startX
    const deltaY = endY - startY
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    const angle = getAngle(startX, startY, endX, endY)
    const duration = Date.now() - gestureState.value.startTime
    const velocity = duration > 0 ? distance / duration : 0

    return {
      type,
      startX,
      startY,
      endX,
      endY,
      deltaX,
      deltaY,
      distance,
      angle,
      velocity,
      scale: extra?.scale,
      rotation: extra?.rotation,
      duration
    }
  }

  // 绑定手势到元素
  const bindGestures = (element: HTMLElement, callbacks: GestureCallbacks) => {
    if (!config.value.enabled) return

    const { threshold, longPressDuration, doubleTapDelay } = config.value

    let longPressTimer: ReturnType<typeof setTimeout>
    let isMoved = false
    let startX = 0
    let startY = 0

    const onStart = (e: TouchEvent | MouseEvent) => {
      if (config.value.preventDefault) {
        e.preventDefault()
      }

      const point = 'touches' in e ? e.touches[0] : e as MouseEvent
      startX = point.clientX
      startY = point.clientY

      gestureState.value = {
        isActive: true,
        startX,
        startY,
        startTime: Date.now(),
        lastTapTime: gestureState.value.lastTapTime,
        lastTapX: gestureState.value.lastTapX,
        lastTapY: gestureState.value.lastTapY,
        initialDistance: 0,
        initialAngle: 0
      }

      isMoved = false

      // 长按定时器
      longPressTimer = setTimeout(() => {
        if (!isMoved && callbacks.onLongPress) {
          const event = createGestureEvent('longpress', startX, startY, startX, startY)
          callbacks.onLongPress(event)
          gestureState.value.isActive = false
        }
      }, longPressDuration)
    }

    const onMove = (e: TouchEvent | MouseEvent) => {
      if (!gestureState.value.isActive) return

      const point = 'touches' in e ? e.touches[0] : e as MouseEvent
      const deltaX = Math.abs(point.clientX - startX)
      const deltaY = Math.abs(point.clientY - startY)

      if (deltaX > threshold || deltaY > threshold) {
        isMoved = true
        clearTimeout(longPressTimer)
      }

      // 拖拽/平移
      if (callbacks.onPan) {
        const event = createGestureEvent('pan', startX, startY, point.clientX, point.clientY)
        callbacks.onPan(event)
      }
    }

    const onEnd = (e: TouchEvent | MouseEvent) => {
      if (!gestureState.value.isActive && !isMoved) return

      clearTimeout(longPressTimer)

      const point = 'changedTouches' in e
        ? e.changedTouches[0]
        : e as MouseEvent
      const endX = point.clientX
      const endY = point.clientY
      const deltaX = endX - startX
      const deltaY = endY - startY

      // 检查是否为滑动
      if (Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold) {
        const event = createGestureEvent('swipe', startX, startY, endX, endY)

        // 方向检测
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          if (deltaX < 0 && callbacks.onSwipeLeft) {
            callbacks.onSwipeLeft(event)
          } else if (deltaX > 0 && callbacks.onSwipeRight) {
            callbacks.onSwipeRight(event)
          }
        } else {
          if (deltaY < 0 && callbacks.onSwipeUp) {
            callbacks.onSwipeUp(event)
          } else if (deltaY > 0 && callbacks.onSwipeDown) {
            callbacks.onSwipeDown(event)
          }
        }

        if (callbacks.onSwipe) {
          callbacks.onSwipe(event)
        }
      } else if (!isMoved) {
        // 点击检测
        const now = Date.now()
        const timeSinceLastTap = now - gestureState.value.lastTapTime

        if (timeSinceLastTap < doubleTapDelay && gestureState.value.lastTapTime > 0) {
          // 双击
          if (callbacks.onDoubleTap) {
            const event = createGestureEvent('doubletap', startX, startY, endX, endY)
            callbacks.onDoubleTap(event)
            gestureHistory.value.unshift(event)
          }
        } else {
          // 单击
          if (callbacks.onTap) {
            const event = createGestureEvent('tap', startX, startY, endX, endY)
            callbacks.onTap(event)
            gestureHistory.value.unshift(event)
          }
        }

        gestureState.value.lastTapTime = now
        gestureState.value.lastTapX = startX
        gestureState.value.lastTapY = startY
      }

      gestureState.value.isActive = false

      // 限制历史记录
      if (gestureHistory.value.length > 50) {
        gestureHistory.value.pop()
      }
    }

    // 触摸事件
    element.addEventListener('touchstart', onStart, { passive: false })
    element.addEventListener('touchmove', onMove, { passive: false })
    element.addEventListener('touchend', onEnd, { passive: false })

    // 鼠标事件（桌面端测试）
    element.addEventListener('mousedown', onStart)
    element.addEventListener('mousemove', onMove)
    element.addEventListener('mouseup', onEnd)
    element.addEventListener('mouseleave', onEnd)

    // 返回清理函数
    return () => {
      clearTimeout(longPressTimer)
      element.removeEventListener('touchstart', onStart)
      element.removeEventListener('touchmove', onMove)
      element.removeEventListener('touchend', onEnd)
      element.removeEventListener('mousedown', onStart)
      element.removeEventListener('mousemove', onMove)
      element.removeEventListener('mouseup', onEnd)
      element.removeEventListener('mouseleave', onEnd)
    }
  }

  // 滑动手势导航
  const createSwipeNavigator = (
    container: HTMLElement,
    options: {
      onNext?: () => void
      onPrev?: () => void
      threshold?: number
    }
  ) => {
    const threshold = options.threshold || 50

    return bindGestures(container, {
      onSwipeLeft: () => options.onNext?.(),
      onSwipeRight: () => options.onPrev?.()
    })
  }

  // 捏合缩放
  const createPinchZoom = (
    element: HTMLElement,
    callbacks: { onPinch?: (scale: number) => void; onRotate?: (angle: number) => void }
  ) => {
    let initialDistance = 0
    let initialAngle = 0

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const t1 = e.touches[0]
        const t2 = e.touches[1]
        initialDistance = getDistance(t1.clientX, t1.clientY, t2.clientX, t2.clientY)
        initialAngle = getAngle(t1.clientX, t1.clientY, t2.clientX, t2.clientY)
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const t1 = e.touches[0]
        const t2 = e.touches[1]
        const distance = getDistance(t1.clientX, t1.clientY, t2.clientX, t2.clientY)
        const angle = getAngle(t1.clientX, t1.clientY, t2.clientX, t2.clientY)

        const scale = distance / initialDistance
        const rotation = angle - initialAngle

        callbacks.onPinch?.(scale)
        callbacks.onRotate?.(rotation)

        initialDistance = distance
        initialAngle = angle
      }
    }

    element.addEventListener('touchstart', onTouchStart, { passive: true })
    element.addEventListener('touchmove', onTouchMove, { passive: true })

    return () => {
      element.removeEventListener('touchstart', onTouchStart)
      element.removeEventListener('touchmove', onTouchMove)
    }
  }

  // 拖拽
  const createDraggable = (
    element: HTMLElement,
    options: {
      handle?: HTMLElement
      bounds?: HTMLElement
      onDragStart?: () => void
      onDrag?: (x: number, y: number) => void
      onDragEnd?: (x: number, y: number) => void
    }
  ) => {
    let isDragging = false
    let startX = 0
    let startY = 0
    let offsetX = 0
    let offsetY = 0

    const target = options.handle || element

    const onStart = (e: MouseEvent | TouchEvent) => {
      isDragging = true
      const point = 'touches' in e ? e.touches[0] : e
      startX = point.clientX
      startY = point.clientY
      offsetX = element.offsetLeft
      offsetY = element.offsetTop

      options.onDragStart?.()

      if (config.value.preventDefault) {
        e.preventDefault()
      }
    }

    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return

      const point = 'touches' in e ? e.touches[0] : e
      const deltaX = point.clientX - startX
      const deltaY = point.clientY - startY

      let newX = offsetX + deltaX
      let newY = offsetY + deltaY

      // 边界限制
      if (options.bounds) {
        const bounds = options.bounds.getBoundingClientRect()
        const elRect = element.getBoundingClientRect()

        newX = Math.max(bounds.left, Math.min(newX, bounds.right - elRect.width))
        newY = Math.max(bounds.top, Math.min(newY, bounds.bottom - elRect.height))
      }

      element.style.left = `${newX}px`
      element.style.top = `${newY}px`

      options.onDrag?.(newX, newY)
    }

    const onEnd = () => {
      if (!isDragging) return
      isDragging = false

      const x = parseFloat(element.style.left || '0')
      const y = parseFloat(element.style.top || '0')
      options.onDragEnd?.(x, y)
    }

    target.addEventListener('mousedown', onStart)
    target.addEventListener('touchstart', onStart, { passive: false })
    window.addEventListener('mousemove', onMove)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('mouseup', onEnd)
    window.addEventListener('touchend', onEnd)

    return () => {
      target.removeEventListener('mousedown', onStart)
      target.removeEventListener('touchstart', onStart)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('mouseup', onEnd)
      window.removeEventListener('touchend', onEnd)
    }
  }

  // 统计
  const stats = computed(() => ({
    totalGestures: gestureHistory.value.length,
    isActive: gestureState.value.isActive,
    lastGesture: gestureHistory.value[0]?.type || 'none'
  }))

  return {
    config,
    gestureState,
    currentGesture,
    gestureHistory,
    stats,
    bindGestures,
    createSwipeNavigator,
    createPinchZoom,
    createDraggable
  }
}

export default useMobileGesturesPro
