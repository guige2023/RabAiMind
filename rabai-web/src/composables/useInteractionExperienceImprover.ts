// Interaction Experience Improver - 交互体验深度改善
import { ref, computed, onMounted, onUnmounted } from 'vue'

export type InteractionType = 'click' | 'hover' | 'focus' | 'drag' | 'scroll' | 'keypress' | 'touch' | 'swipe' | 'pinch'
export type FeedbackLevel = 'subtle' | 'medium' | 'prominent'

export interface InteractionConfig {
  enableHoverEffects: boolean
  enableClickFeedback: boolean
  enableTouchOptimized: boolean
  enableGestures: boolean
  enableHaptic: boolean
  enableSound: boolean
  animationDuration: number
  feedbackLevel: FeedbackLevel
}

export interface InteractionMetrics {
  totalInteractions: number
  interactionsByType: Record<InteractionType, number>
  averageResponseTime: number
  lastInteractionTime: number
}

export interface TouchTarget {
  x: number
  y: number
  width: number
  height: number
}

const defaultConfig: InteractionConfig = {
  enableHoverEffects: true,
  enableClickFeedback: true,
  enableTouchOptimized: true,
  enableGestures: true,
  enableHaptic: true,
  enableSound: false,
  animationDuration: 200,
  feedbackLevel: 'medium'
}

export function useInteractionExperienceImprover() {
  // 配置
  const config = ref<InteractionConfig>({ ...defaultConfig })

  // 交互状态
  const isPressed = ref(false)
  const isHovering = ref(false)
  const isDragging = ref(false)
  const lastInteraction = ref<{ type: InteractionType; timestamp: number; element: string } | null>(null)

  // 交互历史
  const interactionHistory = ref<Array<{
    type: InteractionType
    element: string
    timestamp: number
    duration?: number
    success: boolean
  }>>([])

  // 性能指标
  const metrics = ref<InteractionMetrics>({
    totalInteractions: 0,
    interactionsByType: {
      click: 0, hover: 0, focus: 0, drag: 0, scroll: 0, keypress: 0, touch: 0, swipe: 0, pinch: 0
    },
    averageResponseTime: 0,
    lastInteractionTime: 0
  })

  // 响应时间追踪
  let interactionStartTime = 0

  // 记录交互
  const recordInteraction = (type: InteractionType, element: string, success = true) => {
    const now = Date.now()
    const duration = interactionStartTime > 0 ? now - interactionStartTime : 0

    interactionHistory.value.push({
      type,
      element,
      timestamp: now,
      duration,
      success
    })

    // 更新指标
    metrics.value.totalInteractions++
    metrics.value.interactionsByType[type]++
    metrics.value.lastInteractionTime = now

    // 计算平均响应时间
    const relevantInteractions = interactionHistory.value.filter(i => i.duration && i.duration > 0)
    if (relevantInteractions.length > 0) {
      const totalTime = relevantInteractions.reduce((sum, i) => sum + (i.duration || 0), 0)
      metrics.value.averageResponseTime = totalTime / relevantInteractions.length
    }

    lastInteraction.value = { type, timestamp: now, element }

    // 限制历史
    if (interactionHistory.value.length > 200) {
      interactionHistory.value.shift()
    }
  }

  // 点击效果
  const handleClick = (element: string, callback?: () => void) => {
    interactionStartTime = Date.now()

    if (config.value.enableClickFeedback) {
      // 触觉反馈
      if (config.value.enableHaptic && navigator.vibrate) {
        navigator.vibrate(10)
      }

      // 视觉反馈
      isPressed.value = true
      setTimeout(() => {
        isPressed.value = false
      }, config.value.animationDuration)
    }

    recordInteraction('click', element, true)
    callback?.()
  }

  // 悬停效果
  const handleMouseEnter = (element: string) => {
    if (!config.value.enableHoverEffects) return
    interactionStartTime = Date.now()
    isHovering.value = true
    recordInteraction('hover', element)
  }

  const handleMouseLeave = (element: string) => {
    isHovering.value = false
  }

  // 触摸优化
  const optimizeTouchTarget = (element: HTMLElement): TouchTarget => {
    const rect = element.getBoundingClientRect()
    const minSize = 44 // 最小触摸目标尺寸

    let width = rect.width
    let height = rect.height

    // 确保最小触摸区域
    if (width < minSize || height < minSize) {
      const scale = Math.max(minSize / width, minSize / height)
      width *= scale
      height *= scale
    }

    return {
      x: rect.left + (rect.width - width) / 2,
      y: rect.top + (rect.height - height) / 2,
      width,
      height
    }
  }

  // 手势识别
  const handleGesture = (
    element: string,
    gestureType: 'swipe' | 'pinch' | 'rotate',
    callback: (data: any) => void
  ) => {
    if (!config.value.enableGestures) return

    let startX = 0
    let startY = 0
    let startDistance = 0

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        startX = e.touches[0].clientX
        startY = e.touches[0].clientY
      } else if (e.touches.length === 2 && gestureType === 'pinch') {
        startDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        )
      }
      interactionStartTime = Date.now()
    }

    const onTouchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX
      const endY = e.changedTouches[0].clientY
      const deltaX = endX - startX
      const deltaY = endY - startY

      // 判断滑动方向
      if (gestureType === 'swipe') {
        const minSwipe = 50
        if (Math.abs(deltaX) > minSwipe || Math.abs(deltaY) > minSwipe) {
          const direction = Math.abs(deltaX) > Math.abs(deltaY)
            ? (deltaX > 0 ? 'right' : 'left')
            : (deltaY > 0 ? 'down' : 'up')

          recordInteraction('swipe', element)
          callback({ type: 'swipe', direction, deltaX, deltaY })
        }
      }

      recordInteraction('touch', element)
    }

    // 添加监听
    element.addEventListener('touchstart', onTouchStart, { passive: true })
    element.addEventListener('touchend', onTouchEnd, { passive: true })

    // 返回清理函数
    return () => {
      element.removeEventListener('touchstart', onTouchStart)
      element.removeEventListener('touchend', onTouchEnd)
    }
  }

  // 长按检测
  const handleLongPress = (element: string, callback: () => void, duration = 500) => {
    let pressTimer: ReturnType<typeof setTimeout> | null = null

    const onPressStart = () => {
      pressTimer = setTimeout(() => {
        recordInteraction('touch', element)
        callback()
      }, duration)
    }

    const onPressEnd = () => {
      if (pressTimer) {
        clearTimeout(pressTimer)
        pressTimer = null
      }
    }

    // 添加监听
    const el = document.getElementById(element)
    if (el) {
      el.addEventListener('touchstart', onPressStart, { passive: true })
      el.addEventListener('touchend', onPressEnd)
      el.addEventListener('touchmove', onPressEnd)
    }
  }

  // 双击检测
  const handleDoubleTap = (element: string, callback: () => void) => {
    let lastTap = 0
    const delay = 300

    const onTap = () => {
      const now = Date.now()
      if (now - lastTap < delay) {
        recordInteraction('touch', element)
        callback()
      }
      lastTap = now
    }

    const el = document.getElementById(element)
    if (el) {
      el.addEventListener('click', onTap)
    }

    return () => {
      el?.removeEventListener('click', onTap)
    }
  }

  // 涟漪效果
  const createRipple = (event: MouseEvent | TouchEvent, element: HTMLElement) => {
    const ripple = document.createElement('span')
    ripple.className = 'ripple'

    const rect = element.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)

    const clientX = 'touches' in event ? event.touches[0].clientX : (event as MouseEvent).clientX
    const clientY = 'touches' in event ? event.touches[0].clientY : (event as MouseEvent).clientY

    ripple.style.width = ripple.style.height = `${size}px`
    ripple.style.left = `${clientX - rect.left - size / 2}px`
    ripple.style.top = `${clientY - rect.top - size / 2}px`

    element.appendChild(ripple)

    setTimeout(() => ripple.remove(), 600)
  }

  // 键盘快捷键处理
  const handleKeyPress = (element: string, callback: () => void) => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        interactionStartTime = Date.now()
        recordInteraction('keypress', element)
        callback()
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }

  // 交互建议
  const suggestions = computed(() => [
    '点击按钮获取即时反馈',
    '长按图片查看选项',
    '双击文本进行编辑',
    '左右滑动切换页面',
    '使用键盘Tab键导航',
    '捏合缩放图片'
  ])

  // 性能评分
  const performanceScore = computed(() => {
    let score = 100

    if (metrics.value.averageResponseTime > 200) score -= 20
    if (metrics.value.averageResponseTime > 100) score -= 10

    const clickCount = metrics.value.interactionsByType.click
    const hoverCount = metrics.value.interactionsByType.hover
    if (clickCount > 0 && hoverCount > 0) {
      const hoverRatio = hoverCount / clickCount
      if (hoverRatio > 5) score -= 10 // 悬停过多可能影响性能
    }

    return Math.max(0, score)
  })

  // 设置配置
  const updateConfig = (updates: Partial<InteractionConfig>) => {
    config.value = { ...config.value, ...updates }
  }

  // 清除历史
  const clearHistory = () => {
    interactionHistory.value = []
  }

  // 获取统计
  const stats = computed(() => ({
    total: metrics.value.totalInteractions,
    byType: metrics.value.interactionsByType,
    avgResponseTime: Math.round(metrics.value.averageResponseTime),
    score: performanceScore.value
  }))

  onMounted(() => {
    // 可以添加全局事件监听
  })

  onUnmounted(() => {
    // 清理
  })

  return {
    // 配置和状态
    config,
    isPressed,
    isHovering,
    isDragging,
    lastInteraction,
    interactionHistory,
    // 计算属性
    suggestions,
    performanceScore,
    stats,
    // 方法
    recordInteraction,
    handleClick,
    handleMouseEnter,
    handleMouseLeave,
    optimizeTouchTarget,
    handleGesture,
    handleLongPress,
    handleDoubleTap,
    createRipple,
    handleKeyPress,
    updateConfig,
    clearHistory
  }
}

export default useInteractionExperienceImprover
