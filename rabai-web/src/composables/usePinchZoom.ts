/**
 * usePinchZoom - Pinch-to-zoom gesture detection for slide content
 * Enables pinch gestures on touch devices to zoom in/out of slide content
 */
import { ref, onMounted, onUnmounted, type Ref } from 'vue'

export interface PinchZoomOptions {
  element: Ref<HTMLElement | null>
  minScale?: number
  maxScale?: number
  onScaleChange?: (scale: number) => void
  onDoubleTap?: () => void
}

export function usePinchZoom(options: PinchZoomOptions) {
  const {
    element,
    minScale = 0.5,
    maxScale = 3.0,
    onScaleChange,
    onDoubleTap
  } = options

  const scale = ref(1)
  const isPinching = ref(false)

  // Touch tracking
  let lastTouchDistance = 0
  let lastTouchCenter = { x: 0, y: 0 }
  let lastTapTime = 0
  let initialPinchScale = 1

  const getTouchDistance = (touches: TouchList): number => {
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  const getTouchCenter = (touches: TouchList): { x: number; y: number } => {
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2
    }
  }

  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault()
      isPinching.value = true
      lastTouchDistance = getTouchDistance(e.touches)
      lastTouchCenter = getTouchCenter(e.touches)
      initialPinchScale = scale.value
    } else if (e.touches.length === 1) {
      // Double-tap detection
      const now = Date.now()
      if (now - lastTapTime < 300) {
        onDoubleTap?.()
        lastTapTime = 0
      } else {
        lastTapTime = now
      }
    }
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 2 && isPinching.value) {
      e.preventDefault()
      const distance = getTouchDistance(e.touches)
      const center = getTouchCenter(e.touches)

      if (lastTouchDistance > 0) {
        const scaleFactor = distance / lastTouchDistance
        let newScale = initialPinchScale * scaleFactor
        newScale = Math.max(minScale, Math.min(maxScale, newScale))
        scale.value = newScale
        onScaleChange?.(newScale)
      }

      lastTouchDistance = distance
      lastTouchCenter = center
    }
  }

  const handleTouchEnd = (e: TouchEvent) => {
    if (e.touches.length < 2) {
      isPinching.value = false
      lastTouchDistance = 0
    }
  }

  const resetScale = () => {
    scale.value = 1
    onScaleChange?.(1)
  }

  const attach = (el: HTMLElement) => {
    el.addEventListener('touchstart', handleTouchStart, { passive: false })
    el.addEventListener('touchmove', handleTouchMove, { passive: false })
    el.addEventListener('touchend', handleTouchEnd, { passive: true })
    el.style.touchAction = 'none' // Prevent browser pinch zoom
  }

  const detach = (el: HTMLElement) => {
    el.removeEventListener('touchstart', handleTouchStart)
    el.removeEventListener('touchmove', handleTouchMove)
    el.removeEventListener('touchend', handleTouchEnd)
  }

  onMounted(() => {
    if (element.value) attach(element.value)
  })

  onUnmounted(() => {
    if (element.value) detach(element.value)
  })

  return { scale, isPinching, resetScale }
}
