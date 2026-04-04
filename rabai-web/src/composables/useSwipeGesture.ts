/**
 * useSwipeGesture - Touch swipe detection for slide navigation
 */
import { ref, onMounted, onUnmounted, type Ref } from 'vue'

export interface SwipeGestureOptions {
  element: Ref<HTMLElement | null>
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  threshold?: number  // min swipe distance in px
}

export function useSwipeGesture(options: SwipeGestureOptions) {
  const { element, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold = 50 } = options

  let startX = 0
  let startY = 0
  let startTime = 0

  const handleTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0]
    startX = touch.clientX
    startY = touch.clientY
    startTime = Date.now()
  }

  const handleTouchEnd = (e: TouchEvent) => {
    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - startX
    const deltaY = touch.clientY - startY
    const elapsed = Date.now() - startTime

    // Ignore slow swipes (< 300ms for a fast swipe)
    if (elapsed > 500) return

    const absDeltaX = Math.abs(deltaX)
    const absDeltaY = Math.abs(deltaY)

    // Must be a horizontal or vertical swipe, not diagonal
    if (absDeltaX < threshold && absDeltaY < threshold) return

    if (absDeltaX > absDeltaY) {
      // Horizontal swipe
      if (deltaX < 0) {
        onSwipeLeft?.()
      } else {
        onSwipeRight?.()
      }
    } else {
      // Vertical swipe
      if (deltaY < 0) {
        onSwipeUp?.()
      } else {
        onSwipeDown?.()
      }
    }
  }

  const attach = (el: HTMLElement) => {
    el.addEventListener('touchstart', handleTouchStart, { passive: true })
    el.addEventListener('touchend', handleTouchEnd, { passive: true })
  }

  const detach = (el: HTMLElement) => {
    el.removeEventListener('touchstart', handleTouchStart)
    el.removeEventListener('touchend', handleTouchEnd)
  }

  onMounted(() => {
    if (element.value) attach(element.value)
  })

  onUnmounted(() => {
    if (element.value) detach(element.value)
  })

  return { attach, detach }
}
