// Interaction Pro - 交互专业版
import { ref, computed, onMounted, onUnmounted } from 'vue'

export type GestureType = 'tap' | 'doubletap' | 'longpress' | 'swipe' | 'swipeleft' | 'swiperight' | 'swipeup' | 'swipedown' | 'pinch' | 'rotate' | 'drag' | 'drop' | 'pan' | 'shake'

export interface GestureConfig {
  type: GestureType
  threshold: number
  direction?: 'horizontal' | 'vertical' | 'all'
  preventDefault: boolean
}

export interface InteractionEvent {
  type: GestureType
  target: string
  timestamp: number
  position: { x: number; y: number }
  velocity?: { x: number; y: number }
  scale?: number
  rotation?: number
}

export interface MicroInteraction {
  id: string
  name: string
  trigger: 'click' | 'hover' | 'focus' | 'scroll' | 'keypress'
  type: 'scale' | 'rotate' | 'fade' | 'translate' | 'color' | 'shadow' | 'custom'
  keyframes: Keyframe[]
  duration: number
  easing: string
  infinite: boolean
}

export interface KeyboardShortcut {
  key: string
  modifiers: ('ctrl' | 'alt' | 'shift' | 'meta')[]
  action: () => void
  description: string
  enabled: boolean
}

export interface TouchZone {
  id: string
  x: number
  y: number
  width: number
  height: number
  action: () => void
  label?: string
}

export function useInteractionPro() {
  // 手势配置
  const gestureConfigs = ref<Record<GestureType, GestureConfig>>({
    tap: { type: 'tap', threshold: 10, preventDefault: true },
    doubletap: { type: 'doubletap', threshold: 10, preventDefault: true },
    longpress: { type: 'longpress', threshold: 500, preventDefault: true },
    swipe: { type: 'swipe', threshold: 50, direction: 'all', preventDefault: true },
    swipeleft: { type: 'swipeleft', threshold: 50, direction: 'horizontal', preventDefault: true },
    swiperight: { type: 'swiperight', threshold: 50, direction: 'horizontal', preventDefault: true },
    swipeup: { type: 'swipeup', threshold: 50, direction: 'vertical', preventDefault: true },
    swipedown: { type: 'swipedown', threshold: 50, direction: 'vertical', preventDefault: true },
    pinch: { type: 'pinch', threshold: 0.1, preventDefault: true },
    rotate: { type: 'rotate', threshold: 10, preventDefault: true },
    drag: { type: 'drag', threshold: 5, preventDefault: true },
    drop: { type: 'drop', threshold: 0, preventDefault: false },
    pan: { type: 'pan', threshold: 5, preventDefault: true },
    shake: { type: 'shake', threshold: 15, preventDefault: true }
  })

  // 交互事件
  const events = ref<InteractionEvent[]>([])
  const maxEvents = 1000

  // 快捷键
  const shortcuts = ref<KeyboardShortcut[]>([])

  // 微交互
  const microInteractions = ref<MicroInteraction[]>([])

  // 触摸区域
  const touchZones = ref<TouchZone[]>([])

  // 性能追踪
  const interactionStats = ref({
    totalGestures: 0,
    totalClicks: 0,
    totalSwipes: 0,
    averageResponseTime: 0,
    lastInteractionTime: 0
  })

  // 追踪交互
  const track = (type: GestureType, target: string, position: { x: number; y: number }, extra?: any) => {
    const event: InteractionEvent = {
      type,
      target,
      timestamp: Date.now(),
      position,
      ...extra
    }

    events.value.push(event)
    interactionStats.value.lastInteractionTime = Date.now()

    if (events.value.length > maxEvents) {
      events.value.shift()
    }

    // 更新统计
    interactionStats.value.totalGestures++
    if (type.includes('swipe')) interactionStats.value.totalSwipes++
    if (type === 'tap') interactionStats.value.totalClicks++
  }

  // 手势识别
  const recognizeGesture = (
    element: HTMLElement,
    gesture: GestureType,
    callback: (event: InteractionEvent) => void
  ) => {
    if (!('ontouchstart' in window)) {
      // 桌面端使用鼠标事件
      return setupMouseGesture(element, gesture, callback)
    } else {
      // 移动端使用触摸事件
      return setupTouchGesture(element, gesture, callback)
    }
  }

  // 鼠标手势
  const setupMouseGesture = (
    element: HTMLElement,
    gesture: GestureType,
    callback: (event: InteractionEvent) => void
  ) => {
    let startX = 0
    let startY = 0
    let startTime = 0
    let clickCount = 0
    let lastClickTime = 0
    let isDragging = false

    const config = gestureConfigs.value[gesture]

    const onMouseDown = (e: MouseEvent) => {
      startX = e.clientX
      startY = e.clientY
      startTime = Date.now()
      isDragging = false
    }

    const onMouseMove = (e: MouseEvent) => {
      if (gesture === 'drag' || gesture === 'pan') {
        const deltaX = Math.abs(e.clientX - startX)
        const deltaY = Math.abs(e.clientY - startY)
        if (deltaX > config.threshold || deltaY > config.threshold) {
          isDragging = true
        }
      }
    }

    const onMouseUp = (e: MouseEvent) => {
      const endX = e.clientX
      const endY = e.clientY
      const deltaX = endX - startX
      const deltaY = endY - startY
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      const duration = Date.now() - startTime
      const velocity = duration > 0 ? { x: deltaX / duration, y: deltaY / duration } : undefined

      const now = Date.now()

      // 检测手势类型
      if (gesture === 'tap' && distance < config.threshold) {
        // 检测双击
        if (now - lastClickTime < 300) {
          callback({
            type: 'doubletap',
            target: element.id || 'unknown',
            timestamp: now,
            position: { x: endX, y: endY }
          })
          clickCount = 0
        } else {
          callback({
            type: 'tap',
            target: element.id || 'unknown',
            timestamp: now,
            position: { x: endX, y: endY }
          })
          clickCount++
        }
        lastClickTime = now
      }
      else if ((gesture === 'swipe' || gesture === 'swipeleft') && distance > config.threshold && deltaX < -config.threshold / 2) {
        callback({
          type: 'swipeleft',
          target: element.id || 'unknown',
          timestamp: now,
          position: { x: endX, y: endY },
          velocity
        })
      }
      else if ((gesture === 'swipe' || gesture === 'swiperight') && distance > config.threshold && deltaX > config.threshold / 2) {
        callback({
          type: 'swiperight',
          target: element.id || 'unknown',
          timestamp: now,
          position: { x: endX, y: endY },
          velocity
        })
      }
      else if ((gesture === 'swipe' || gesture === 'swipeup') && distance > config.threshold && deltaY < -config.threshold / 2) {
        callback({
          type: 'swipeup',
          target: element.id || 'unknown',
          timestamp: now,
          position: { x: endX, y: endY },
          velocity
        })
      }
      else if ((gesture === 'swipe' || gesture === 'swipedown') && distance > config.threshold && deltaY > config.threshold / 2) {
        callback({
          type: 'swipedown',
          target: element.id || 'unknown',
          timestamp: now,
          position: { x: endX, y: endY },
          velocity
        })
      }
      else if (gesture === 'longpress' && duration > 500) {
        callback({
          type: 'longpress',
          target: element.id || 'unknown',
          timestamp: now,
          position: { x: endX, y: endY },
          duration
        })
      }
      else if ((gesture === 'drag' || gesture === 'pan') && isDragging) {
        callback({
          type: gesture,
          target: element.id || 'unknown',
          timestamp: now,
          position: { x: endX, y: endY },
          velocity
        })
      }
    }

    element.addEventListener('mousedown', onMouseDown)
    element.addEventListener('mousemove', onMouseMove)
    element.addEventListener('mouseup', onMouseUp)

    return () => {
      element.removeEventListener('mousedown', onMouseDown)
      element.removeEventListener('mousemove', onMouseMove)
      element.removeEventListener('mouseup', onMouseUp)
    }
  }

  // 触摸手势
  const setupTouchGesture = (
    element: HTMLElement,
    gesture: GestureType,
    callback: (event: InteractionEvent) => void
  ) => {
    let startX = 0
    let startY = 0
    let startTime = 0
    let initialDistance = 0
    let initialAngle = 0
    let lastTapTime = 0

    const config = gestureConfigs.value[gesture]

    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      startX = touch.clientX
      startY = touch.clientY
      startTime = Date.now()

      // 多点触控
      if (e.touches.length === 2 && (gesture === 'pinch' || gesture === 'rotate')) {
        const touch1 = e.touches[0]
        const touch2 = e.touches[1]
        initialDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
        )
        initialAngle = Math.atan2(
          touch2.clientY - touch1.clientY,
          touch2.clientX - touch1.clientX
        ) * 180 / Math.PI
      }
    }

    const onTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0]
      const endX = touch.clientX
      const endY = touch.clientY
      const deltaX = endX - startX
      const deltaY = endY - startY
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      const duration = Date.now() - startTime
      const now = Date.now()

      // 检测缩放
      if (gesture === 'pinch' && e.changedTouches.length === 2) {
        const touch1 = e.changedTouches[0]
        const touch2 = e.changedTouches[1]
        const currentDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
        )
        const scale = currentDistance / initialDistance
        callback({
          type: 'pinch',
          target: element.id || 'unknown',
          timestamp: now,
          position: { x: endX, y: endY },
          scale
        })
      }

      // 检测旋转
      if (gesture === 'rotate' && e.changedTouches.length === 2) {
        const touch1 = e.changedTouches[0]
        const touch2 = e.changedTouches[1]
        const currentAngle = Math.atan2(
          touch2.clientY - touch1.clientY,
          touch2.clientX - touch1.clientX
        ) * 180 / Math.PI
        const rotation = currentAngle - initialAngle
        callback({
          type: 'rotate',
          target: element.id || 'unknown',
          timestamp: now,
          position: { x: endX, y: endY },
          rotation
        })
      }

      // 检测滑动
      if (distance > config.threshold) {
        if (deltaX < -config.threshold / 2) {
          callback({ type: 'swipeleft', target: element.id || 'unknown', timestamp: now, position: { x: endX, y: endY } })
        } else if (deltaX > config.threshold / 2) {
          callback({ type: 'swiperight', target: element.id || 'unknown', timestamp: now, position: { x: endX, y: endY } })
        } else if (deltaY < -config.threshold / 2) {
          callback({ type: 'swipeup', target: element.id || 'unknown', timestamp: now, position: { x: endX, y: endY } })
        } else if (deltaY > config.threshold / 2) {
          callback({ type: 'swipedown', target: element.id || 'unknown', timestamp: now, position: { x: endX, y: endY } })
        }
      }

      // 检测点击
      if (distance < config.threshold) {
        if (now - lastTapTime < 300) {
          callback({ type: 'doubletap', target: element.id || 'unknown', timestamp: now, position: { x: endX, y: endY } })
        } else {
          callback({ type: 'tap', target: element.id || 'unknown', timestamp: now, position: { x: endX, y: endY } })
        }
        lastTapTime = now
      }

      // 长按
      if (gesture === 'longpress' && duration > 500) {
        callback({ type: 'longpress', target: element.id || 'unknown', timestamp: now, position: { x: endX, y: endY }, duration })
      }
    }

    element.addEventListener('touchstart', onTouchStart, { passive: true })
    element.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      element.removeEventListener('touchstart', onTouchStart)
      element.removeEventListener('touchend', onTouchEnd)
    }
  }

  // 添加微交互
  const addMicroInteraction = (interaction: Omit<MicroInteraction, 'id'>) => {
    const newInteraction: MicroInteraction = {
      ...interaction,
      id: `micro_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    microInteractions.value.push(newInteraction)
    return newInteraction
  }

  // 触觉反馈
  const haptic = (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') => {
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

  // 快捷键
  const registerShortcut = (shortcut: Omit<KeyboardShortcut, 'enabled'>) => {
    shortcuts.value.push({ ...shortcut, enabled: true })
  }

  const handleKeydown = (e: KeyboardEvent) => {
    shortcuts.value
      .filter(s => s.enabled)
      .forEach(s => {
        const modifiersMatch = s.modifiers.every(m => {
          if (m === 'ctrl') return e.ctrlKey || e.metaKey
          if (m === 'alt') return e.altKey
          if (m === 'shift') return e.shiftKey
          if (m === 'meta') return e.metaKey
          return false
        })

        const keyMatch = s.key.toLowerCase() === e.key.toLowerCase()

        if (modifiersMatch && keyMatch) {
          e.preventDefault()
          s.action()
          haptic('light')
        }
      })
  }

  // 触摸区域
  const addTouchZone = (zone: Omit<TouchZone, 'id'>) => {
    const newZone: TouchZone = {
      ...zone,
      id: `zone_${Date.now()}`
    }
    touchZones.value.push(newZone)
    return newZone
  }

  const checkTouchZone = (x: number, y: number) => {
    return touchZones.value.find(zone =>
      x >= zone.x && x <= zone.x + zone.width &&
      y >= zone.y && y <= zone.y + zone.height
    )
  }

  // 摇晃检测
  let shakeThreshold = 15
  let lastShake = 0
  const detectShake = () => {
    if (!window.DeviceMotionEvent) return

    window.addEventListener('devicemotion', (event) => {
      const acceleration = event.accelerationIncludingGravity
      if (!acceleration) return

      const { x, y, z } = acceleration
      const total = Math.sqrt(x * x + y * y + z * z)

      if (total > shakeThreshold) {
        const now = Date.now()
        if (now - lastShake > 1000) {
          lastShake = now
          track('shake', 'window', { x, y })
          haptic('medium')
        }
      }
    })
  }

  // 统计
  const stats = computed(() => ({
    totalEvents: events.value.length,
    gestures: interactionStats.value,
    shortcuts: shortcuts.value.length,
    enabledShortcuts: shortcuts.value.filter(s => s.enabled).length,
    microInteractions: microInteractions.value.length,
    touchZones: touchZones.value.length
  }))

  // 初始化
  onMounted(() => {
    window.addEventListener('keydown', handleKeydown)
    detectShake()
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
  })

  return {
    // 手势
    gestureConfigs,
    recognizeGesture,
    setupMouseGesture,
    setupTouchGesture,
    // 事件
    events,
    track,
    // 微交互
    microInteractions,
    addMicroInteraction,
    // 快捷键
    shortcuts,
    registerShortcut,
    // 触觉
    haptic,
    // 触摸区域
    touchZones,
    addTouchZone,
    checkTouchZone,
    // 统计
    stats
  }
}

export default useInteractionPro
