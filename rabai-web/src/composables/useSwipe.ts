// useSwipe.ts - 滑动检测模块
import { ref } from 'vue'
import { useEventListener } from './useEventListener'

export interface SwipeOptions {
  threshold?: number
  direction?: 'horizontal' | 'vertical' | 'all'
}

export function useSwipe(onSwipe?: (direction: string) => void, options: SwipeOptions = {}) {
  const { threshold = 50, direction = 'all' } = options

  const isSwiping = ref(false)
  const directionResult = ref<string | null>(null)
  const startX = ref(0)
  const startY = ref(0)
  const deltaX = ref(0)
  const deltaY = ref(0)

  const handleStart = (e: TouchEvent) => {
    isSwiping.value = true
    startX.value = e.touches[0].clientX
    startY.value = e.touches[0].clientY
    deltaX.value = 0
    deltaY.value = 0
  }

  const handleMove = (e: TouchEvent) => {
    if (!isSwiping.value) return
    deltaX.value = e.touches[0].clientX - startX.value
    deltaY.value = e.touches[0].clientY - startY.value
  }

  const handleEnd = () => {
    if (!isSwiping.value) return

    const absX = Math.abs(deltaX.value)
    const absY = Math.abs(deltaY.value)

    if (absX > threshold || absY > threshold) {
      let dir = ''

      if (direction === 'horizontal' || direction === 'all') {
        if (absX > absY) {
          dir = deltaX.value > 0 ? 'right' : 'left'
        }
      }

      if (direction === 'vertical' || direction === 'all') {
        if (absY > absX) {
          dir = deltaY.value > 0 ? 'down' : 'up'
        }
      }

      if (dir) {
        directionResult.value = dir
        onSwipe?.(dir)
      }
    }

    isSwiping.value = false
  }

  useEventListener('touchstart', handleStart, { target: document as any })
  useEventListener('touchmove', handleMove, { target: document as any, passive: true })
  useEventListener('touchend', handleEnd, { target: document as any })

  return { isSwiping, direction: directionResult, deltaX, deltaY, startX, startY }
}

export default useSwipe
