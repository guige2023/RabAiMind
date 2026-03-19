// Interaction Experience - 交互体验增强
import { ref, computed, onMounted, onUnmounted } from 'vue'

export type InteractionType = 'click' | 'hover' | 'focus' | 'drag' | 'scroll' | 'keypress' | 'touch'
export type GestureType = 'tap' | 'longpress' | 'swipe' | 'pinch' | 'rotate' | 'pan'

export interface InteractionConfig {
  enableHover: boolean
  enableClick: boolean
  enableDrag: boolean
  enableTouch: boolean
  enableGestures: boolean
  hapticFeedback: boolean
  soundEffects: boolean
  animationDuration: number
}

export interface GestureEvent {
  type: GestureType
  startX: number
  startY: number
  endX: number
  endY: number
  deltaX: number
  deltaY: number
  scale?: number
  rotation?: number
  duration: number
}

export interface InteractionAnalytics {
  totalInteractions: number
  byType: Record<InteractionType, number>
  byElement: Record<string, number>
  averageDuration: number
  lastInteraction: { type: InteractionType; element: string; timestamp: number } | null
}

export const interactionDefaults: InteractionConfig = {
  enableHover: true,
  enableClick: true,
  enableDrag: true,
  enableTouch: true,
  enableGestures: true,
  hapticFeedback: true,
  soundEffects: false,
  animationDuration: 200
}

export function useInteractionExperience() {
  // 配置
  const config = ref<InteractionConfig>({ ...interactionDefaults })

  // 交互状态
  const isHovering = ref(false)
  const isPressed = ref(false)
  const isDragging = ref(false)
  const currentElement = ref<string | null>(null)

  // 手势状态
  const gestureState = ref<GestureEvent | null>(null)
  const touchStartPos = ref({ x: 0, y: 0 })
  const isTouching = ref(false)

  // 交互历史
  const interactionHistory = ref<Array<{
    type: InteractionType
    element: string
    timestamp: number
    duration?: number
  }>>([])

  // 点击动画
  const clickAnimations = ref<Map<string, boolean>>(new Map())

  // 跟踪交互
  const trackInteraction = (type: InteractionType, element: string, duration?: number) => {
    interactionHistory.value.push({
      type,
      element,
      timestamp: Date.now(),
      duration
    })

    // 限制历史记录数量
    if (interactionHistory.value.length > 100) {
      interactionHistory.value.shift()
    }
  }

  // 悬停效果
  const handleMouseEnter = (element: string) => {
    if (!config.value.enableHover) return
    isHovering.value = true
    currentElement.value = element
    trackInteraction('hover', element)
  }

  const handleMouseLeave = (element: string) => {
    isHovering.value = false
    currentElement.value = null
  }

  // 点击效果
  const handleClick = (element: string) => {
    if (!config.value.enableClick) return
    trackInteraction('click', element)

    // 点击动画
    clickAnimations.value.set(element, true)
    setTimeout(() => {
      clickAnimations.value.set(element, false)
    }, config.value.animationDuration)

    // 触觉反馈
    if (config.value.hapticFeedback && navigator.vibrate) {
      navigator.vibrate(10)
    }
  }

  // 按下效果
  const handleMouseDown = (element: string) => {
    isPressed.value = true
    trackInteraction('click', element)
  }

  const handleMouseUp = (element: string) => {
    isPressed.value = false
  }

  // 拖拽处理
  const handleDragStart = (element: string) => {
    if (!config.value.enableDrag) return
    isDragging.value = true
    trackInteraction('drag', element)
  }

  const handleDragEnd = (element: string) => {
    isDragging.value = false
  }

  // 触摸处理
  const handleTouchStart = (e: TouchEvent, element: string) => {
    if (!config.value.enableTouch) return
    isTouching.value = true
    touchStartPos.value = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    }
    trackInteraction('touch', element)
  }

  const handleTouchEnd = (e: TouchEvent, element: string) => {
    isTouching.value = false

    if (config.value.enableGestures && gestureState.value) {
      // 处理手势
      const gesture = gestureState.value

      if (gesture.type === 'swipe') {
        // 处理滑动
        const angle = Math.atan2(gesture.deltaY, gesture.deltaX) * (180 / Math.PI)
        if (Math.abs(angle) < 45) {
          // 向右滑动
        } else if (Math.abs(angle) > 135) {
          // 向左滑动
        } else if (angle > 0) {
          // 向下滑动
        } else {
          // 向上滑动
        }
      }
    }
  }

  // 手势识别
  const recognizeGesture = (
    type: GestureType,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    duration: number
  ): GestureEvent => {
    const gesture: GestureEvent = {
      type,
      startX,
      startY,
      endX,
      endY,
      deltaX: endX - startX,
      deltaY: endY - startY,
      duration
    }

    gestureState.value = gesture
    return gesture
  }

  // 长按检测
  const longPressTimer = ref<ReturnType<typeof setTimeout> | null>(null)
  const LONG_PRESS_DURATION = 500

  const handleLongPressStart = (callback: () => void) => {
    longPressTimer.value = setTimeout(() => {
      callback()
      if (config.value.hapticFeedback && navigator.vibrate) {
        navigator.vibrate([50, 50, 50])
      }
    }, LONG_PRESS_DURATION)
  }

  const handleLongPressEnd = () => {
    if (longPressTimer.value) {
      clearTimeout(longPressTimer.value)
      longPressTimer.value = null
    }
  }

  // 滚动手势
  const scrollDirection = ref<'up' | 'down' | 'left' | 'right' | null>(null)
  let lastScrollPos = { x: 0, y: 0 }

  const handleScroll = (e: WheelEvent) => {
    trackInteraction('scroll', currentElement.value || 'window')

    const currentPos = { x: e.deltaX, y: e.deltaY }

    if (Math.abs(currentPos.y) > Math.abs(currentPos.x)) {
      scrollDirection.value = currentPos.y > 0 ? 'down' : 'up'
    } else {
      scrollDirection.value = currentPos.x > 0 ? 'right' : 'left'
    }

    lastScrollPos = currentPos
  }

  // 键盘导航
  const focusedElement = ref<string | null>(null)

  const handleFocus = (element: string) => {
    focusedElement.value = element
    trackInteraction('focus', element)
  }

  const handleBlur = (element: string) => {
    focusedElement.value = null
  }

  const handleKeyPress = (e: KeyboardEvent, element: string) => {
    trackInteraction('keypress', element)
  }

  // 快捷键处理
  const shortcuts = ref<Array<{
    key: string
    modifiers: string[]
    action: () => void
    description: string
  }>>([])

  const registerShortcut = (
    key: string,
    modifiers: string[],
    action: () => void,
    description: string
  ) => {
    shortcuts.value.push({ key, modifiers, action, description })
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    const shortcut = shortcuts.value.find(s =>
      s.key.toLowerCase() === e.key.toLowerCase() &&
      s.modifiers.includes(e.ctrlKey ? 'ctrl' : '') &&
      s.modifiers.includes(e.shiftKey ? 'shift' : '') &&
      s.modifiers.includes(e.altKey ? 'alt' : '')
    )

    if (shortcut) {
      e.preventDefault()
      shortcut.action()
    }
  }

  // 双击检测
  const lastClickTime = ref(0)
  const lastClickElement = ref('')

  const handleDoubleClick = (element: string): boolean => {
    const now = Date.now()
    const isDouble = now - lastClickTime.value < 300 && lastClickElement.value === element
    lastClickTime.value = now
    lastClickElement.value = element
    return isDouble
  }

  // 禁用/启用交互
  const disabled = ref(false)

  const setDisabled = (value: boolean) => {
    disabled.value = value
  }

  // 交互分析
  const analytics = computed<InteractionAnalytics>(() => {
    const history = interactionHistory.value

    if (history.length === 0) {
      return {
        totalInteractions: 0,
        byType: { click: 0, hover: 0, focus: 0, drag: 0, scroll: 0, keypress: 0, touch: 0 },
        byElement: {},
        averageDuration: 0,
        lastInteraction: null
      }
    }

    const byType: Record<InteractionType, number> = {
      click: 0, hover: 0, focus: 0, drag: 0, scroll: 0, keypress: 0, touch: 0
    }
    const byElement: Record<string, number> = {}
    let totalDuration = 0
    let durationCount = 0

    history.forEach(interaction => {
      byType[interaction.type]++
      byElement[interaction.element] = (byElement[interaction.element] || 0) + 1

      if (interaction.duration) {
        totalDuration += interaction.duration
        durationCount++
      }
    })

    const last = history[history.length - 1]

    return {
      totalInteractions: history.length,
      byType,
      byElement,
      averageDuration: durationCount > 0 ? totalDuration / durationCount : 0,
      lastInteraction: { type: last.type, element: last.element, timestamp: last.timestamp }
    }
  })

  // 设置配置
  const updateConfig = (newConfig: Partial<InteractionConfig>) => {
    config.value = { ...config.value, ...newConfig }
  }

  // 清除历史
  const clearHistory = () => {
    interactionHistory.value = []
  }

  // 初始化
  const init = () => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('wheel', handleScroll)
  }

  // 清理
  const cleanup = () => {
    window.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('wheel', handleScroll)
    if (longPressTimer.value) {
      clearTimeout(longPressTimer.value)
    }
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
    isHovering,
    isPressed,
    isDragging,
    isTouching,
    currentElement,
    focusedElement,
    gestureState,
    scrollDirection,
    disabled,
    interactionHistory,
    // 方法
    trackInteraction,
    handleMouseEnter,
    handleMouseLeave,
    handleClick,
    handleMouseDown,
    handleMouseUp,
    handleDragStart,
    handleDragEnd,
    handleTouchStart,
    handleTouchEnd,
    handleLongPressStart,
    handleLongPressEnd,
    handleFocus,
    handleBlur,
    handleKeyPress,
    handleDoubleClick,
    registerShortcut,
    recognizeGesture,
    setDisabled,
    updateConfig,
    clearHistory,
    // 分析
    analytics
  }
}

export default useInteractionExperience
