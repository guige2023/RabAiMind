// Vue Transition Utilities
import { ref, onMounted, onUnmounted } from 'vue'

// Intersection Observer for scroll animations
export const useScrollAnimation = (options?: IntersectionObserverInit) => {
  const isVisible = ref(false)
  const elementRef = ref<HTMLElement | null>(null)

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        isVisible.value = true
        // Once visible, stop observing
        observer.unobserve(entry.target)
      }
    })
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
    ...options
  })

  const observe = (el: HTMLElement) => {
    elementRef.value = el
    observer.observe(el)
  }

  const cleanup = () => {
    if (elementRef.value) {
      observer.unobserve(elementRef.value)
    }
    observer.disconnect()
  }

  return {
    isVisible,
    observe,
    cleanup
  }
}

// Slide up animation
export const useSlideUp = (delay = 0) => {
  const isVisible = ref(false)
  const elementRef = ref<HTMLElement | null>(null)

  onMounted(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            isVisible.value = true
          }, delay)
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.1 })

    if (elementRef.value) {
      observer.observe(elementRef.value)
    }

    return () => observer.disconnect()
  })

  return {
    isVisible,
    elementRef
  }
}

// Number counter animation
export const useCountUp = (end: number, duration = 2000) => {
  const current = ref(0)
  const isComplete = ref(false)

  const start = () => {
    const startTime = performance.now()
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Ease out
      current.value = Math.floor(progress * end * (1 - Math.pow(1 - progress, 3)))

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        current.value = end
        isComplete.value = true
      }
    }

    requestAnimationFrame(animate)
  }

  return {
    current,
    isComplete,
    start
  }
}

// Stagger children animation
export const useStagger = (itemCount: number, delay = 50) => {
  const getDelay = (index: number) => `${index * delay}ms`
  return { getDelay }
}

// Fade scale animation
export const useFadeScale = () => {
  const isVisible = ref(false)

  const show = () => {
    isVisible.value = true
  }

  const hide = () => {
    isVisible.value = false
  }

  const toggle = () => {
    isVisible.value = !isVisible.value
  }

  return {
    isVisible,
    show,
    hide,
    toggle
  }
}

// Skeleton loading state
export const useSkeleton = () => {
  const isLoading = ref(true)

  const startLoading = () => {
    isLoading.value = true
  }

  const stopLoading = () => {
    isLoading.value = false
  }

  return {
    isLoading,
    startLoading,
    stopLoading
  }
}

// Page transitions
export const pageTransition = {
  name: 'page',
  mode: 'out-in',
  enterActiveClass: 'page-enter-active',
  enterFromClass: 'page-enter-from',
  enterToClass: 'page-enter-to',
  leaveActiveClass: 'page-leave-active',
  leaveFromClass: 'page-leave-from',
  leaveToClass: 'page-leave-to'
}

export default {
  useScrollAnimation,
  useSlideUp,
  useCountUp,
  useStagger,
  useFadeScale,
  useSkeleton,
  pageTransition
}
