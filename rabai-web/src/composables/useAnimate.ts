// useAnimate.ts - 动画模块
import { ref, onMounted, onUnmounted } from 'vue'

export interface AnimationOptions {
  duration?: number
  easing?: string
  delay?: number
}

export function useAnimate() {
  const isAnimating = ref(false)
  const progress = ref(0)

  const animate = (
    from: number,
    to: number,
    duration: number,
    onUpdate: (value: number) => void,
    onComplete?: () => void
  ) => {
    isAnimating.value = true
    progress.value = 0
    const startTime = performance.now()

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const value = from + (to - from) * progress

      onUpdate(value)
      progress.value = progress * 100

      if (progress < 1) {
        requestAnimationFrame(step)
      } else {
        isAnimating.value = false
        onComplete?.()
      }
    }

    requestAnimationFrame(step)
  }

  const fadeIn = (element: HTMLElement, duration = 300) => {
    element.style.opacity = '0'
    animate(0, 1, duration, (v) => {
      element.style.opacity = String(v)
    })
  }

  const fadeOut = (element: HTMLElement, duration = 300) => {
    animate(1, 0, duration, (v) => {
      element.style.opacity = String(v)
    })
  }

  const slideIn = (element: HTMLElement, direction: 'up' | 'down' | 'left' | 'right' = 'up', duration = 300) => {
    const transforms: Record<string, string> = {
      up: 'translateY(-20px)',
      down: 'translateY(20px)',
      left: 'translateX(-20px)',
      right: 'translateX(20px)'
    }
    element.style.opacity = '0'
    element.style.transform = transforms[direction]
    element.style.transition = `all ${duration}ms ease`

    requestAnimationFrame(() => {
      element.style.opacity = '1'
      element.style.transform = 'translate(0)'
    })
  }

  return { isAnimating, progress, animate, fadeIn, fadeOut, slideIn }
}

export default useAnimate
