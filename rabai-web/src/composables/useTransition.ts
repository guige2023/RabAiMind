// useTransition.ts - 过渡动画模块
import { ref, watch } from 'vue'

export interface TransitionOptions {
  duration?: number
  onEnter?: () => void
  onLeave?: () => void
}

export function useTransition(show: ReturnType<typeof ref<boolean>>, options: TransitionOptions = {}) {
  const { duration = 300 } = options

  const isTransitioning = ref(false)
  const isVisible = ref(show.value)

  watch(show, (val) => {
    if (val) {
      isVisible.value = true
      setTimeout(() => options.onEnter?.(), 10)
    } else {
      isTransitioning.value = true
      setTimeout(() => {
        isTransitioning.value = false
        isVisible.value = false
        options.onLeave?.()
      }, duration)
    }
  })

  return { isTransitioning, isVisible }
}

export default useTransition
