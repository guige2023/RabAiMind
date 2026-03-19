// Interaction Experience Advanced - 交互体验高级优化
import { ref, computed, onMounted, onUnmounted } from 'vue'

export type GestureType = 'tap' | 'longpress' | 'swipe' | 'pinch' | 'rotate' | 'drag' | 'drop' | 'pan'

export interface InteractionConfig {
  enableHaptic: boolean
  enableSound: boolean
  enableAnimation: boolean
  enableGesture: boolean
  sensitivity: 'low' | 'medium' | 'high'
}

export interface InteractionEvent {
  type: GestureType
  target: string
  timestamp: number
  position: { x: number; y: number }
  velocity?: { x: number; y: number }
}

export interface FeedbackConfig {
  type: 'visual' | 'haptic' | 'audio'
  duration: number
  intensity: 'light' | 'medium' | 'heavy'
}

export function useInteractionExperienceAdvanced() {
  // 配置
  const config = ref<InteractionConfig>({
    enableHaptic: true,
    enableSound: false,
    enableAnimation: true,
    enableGesture: true,
    sensitivity: 'medium'
  })

  // 交互事件
  const events = ref<InteractionEvent[]>([])
  const maxEvents = 1000

  // 快捷键映射
  const shortcuts = ref<Map<string, () => void>>(new Map())

  // 回调映射
  const callbacks = ref<Map<string, (event: InteractionEvent) => void>>(new Map())

  // 追踪交互
  const track = (type: GestureType, target: string, position: { x: number; y: number }, velocity?: { x: number; y: number }) => {
    const event: InteractionEvent = {
      type,
      target,
      timestamp: Date.now(),
      position,
      velocity
    }

    events.value.push(event)

    if (events.value.length > maxEvents) {
      events.value.shift()
    }
  }

  // 触觉反馈
  const haptic = (intensity: FeedbackConfig['intensity'] = 'medium') => {
    if (!config.value.enableHaptic || !navigator.vibrate) return

    const patterns: Record<FeedbackConfig['intensity'], number | number[]> = {
      light: 10,
      medium: 20,
      heavy: 40
    }

    navigator.vibrate(patterns[intensity])
  }

  // 声音反馈
  const playSound = (type: 'click' | 'success' | 'error' = 'click') => {
    if (!config.value.enableSound) return

    // 简化实现，实际项目可使用Audio API
    console.log(`Playing sound: ${type}`)
  }

  // 视觉反馈
  const visualFeedback = (element: HTMLElement, type: 'press' | 'success' | 'error') => {
    if (!config.value.enableAnimation) return

    const classes = {
      press: 'interaction-press',
      success: 'interaction-success',
      error: 'interaction-error'
    }

    element.classList.add(classes[type])
    setTimeout(() => element.classList.remove(classes[type]), 200)
  }

  // 手势处理
  const handleGesture = (element: HTMLElement, gesture: GestureType, callback: (event: InteractionEvent) => void) => {
    if (!config.value.enableGesture) return

    let startX = 0
    let startY = 0
    let startTime = 0

    const sensitivityMultiplier = config.value.sensitivity === 'high' ? 1 : config.value.sensitivity === 'low' ? 0.5 : 1

    const onStart = (e: TouchEvent | MouseEvent) => {
      const point = 'touches' in e ? e.touches[0] : e as MouseEvent
      startX = point.clientX
      startY = point.clientY
      startTime = Date.now()
    }

    const onEnd = (e: TouchEvent | MouseEvent) => {
      const point = 'changedTouches' in e ? e.changedTouches[0] : e as MouseEvent
      const endX = point.clientX
      const endY = point.clientY
      const deltaX = endX - startX
      const deltaY = endY - startY
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      const duration = Date.now() - startTime
      const velocity = duration > 0 ? { x: deltaX / duration, y: deltaY / duration } : undefined

      const event: InteractionEvent = {
        type: gesture,
        target: element.id || 'unknown',
        timestamp: Date.now(),
        position: { x: endX, y: endY },
        velocity
      }

      // 检测手势类型
      if (gesture === 'tap' && distance < 10 * sensitivityMultiplier) {
        callback(event)
        haptic('light')
      } else if (gesture === 'swipe' && distance > 50 * sensitivityMultiplier) {
        callback(event)
        haptic('medium')
      } else if (gesture === 'longpress' && duration > 500) {
        callback(event)
        haptic('heavy')
      }
    }

    element.addEventListener('touchstart', onStart, { passive: true })
    element.addEventListener('touchend', onEnd, { passive: true })
    element.addEventListener('mousedown', onStart)
    element.addEventListener('mouseup', onEnd)

    // 返回清理函数
    return () => {
      element.removeEventListener('touchstart', onStart)
      element.removeEventListener('touchend', onEnd)
      element.removeEventListener('mousedown', onStart)
      element.removeEventListener('mouseup', onEnd)
    }
  }

  // 键盘快捷键
  const registerShortcut = (key: string, callback: () => void) => {
    shortcuts.value.set(key, callback)
  }

  const handleKeyboard = (e: KeyboardEvent) => {
    const key = e.ctrlKey ? `ctrl+${e.key}` : e.key
    const callback = shortcuts.value.get(key)

    if (callback) {
      e.preventDefault()
      callback()
      haptic('light')
    }
  }

  // 悬停效果
  const addHoverEffect = (element: HTMLElement, effect: 'scale' | 'glow' | 'lift' = 'scale') => {
    const effects = {
      scale: 'transform: scale(1.05)',
      glow: 'box-shadow: 0 0 20px rgba(59, 130, 246, 0.5)',
      lift: 'transform: translateY(-4px)'
    }

    element.addEventListener('mouseenter', () => {
      if (config.value.enableAnimation) {
        element.style.cssText += effects[effect]
      }
    })

    element.addEventListener('mouseleave', () => {
      element.style.cssText = element.style.cssText.replace(effects[effect], '')
    })
  }

  // 点击波纹效果
  const addRippleEffect = (element: HTMLElement) => {
    element.style.position = 'relative'
    element.style.overflow = 'hidden'

    const onClick = (e: MouseEvent) => {
      if (!config.value.enableAnimation) return

      const rect = element.getBoundingClientRect()
      const ripple = document.createElement('span')

      ripple.style.cssText = `
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: scale(0);
        animation: ripple 0.6s linear;
        pointer-events: none;
        left: ${e.clientX - rect.left}px;
        top: ${e.clientY - rect.top}px;
        width: 20px;
        height: 20px;
        margin-left: -10px;
        margin-top: -10px;
      `

      element.appendChild(ripple)

      setTimeout(() => ripple.remove(), 600)
    }

    element.addEventListener('click', onClick)

    return () => element.removeEventListener('click', onClick)
  }

  // 惯性滚动
  const addInertialScroll = (container: HTMLElement) => {
    let velocity = 0
    let isScrolling = false

    const onWheel = (e: WheelEvent) => {
      if (!config.value.enableAnimation) return
      e.preventDefault()

      velocity += e.deltaY * 0.5

      if (!isScrolling) {
        isScrolling = true

        const scroll = () => {
          if (Math.abs(velocity) > 0.1) {
            container.scrollTop += velocity
            velocity *= 0.95
            requestAnimationFrame(scroll)
          } else {
            isScrolling = false
          }
        }

        requestAnimationFrame(scroll)
      }
    }

    container.addEventListener('wheel', onWheel, { passive: false })

    return () => container.removeEventListener('wheel', onWheel)
  }

  // 统计
  const stats = computed(() => ({
    totalEvents: events.value.length,
    byType: events.value.reduce((acc, e) => {
      acc[e.type] = (acc[e.type] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    shortcuts: shortcuts.value.size,
    hapticEnabled: config.value.enableHaptic,
    soundEnabled: config.value.enableSound
  }))

  // 初始化键盘监听
  onMounted(() => {
    window.addEventListener('keydown', handleKeyboard)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyboard)
  })

  return {
    config,
    events,
    shortcuts,
    stats,
    track,
    haptic,
    playSound,
    visualFeedback,
    handleGesture,
    registerShortcut,
    addHoverEffect,
    addRippleEffect,
    addInertialScroll
  }
}

export default useInteractionExperienceAdvanced
