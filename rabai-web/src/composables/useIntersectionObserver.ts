// useIntersectionObserver.ts - 元素可见性观察模块
import { ref, onMounted, onUnmounted, type Ref } from 'vue'

export interface IntersectionObserverOptions {
  root?: Element | null
  rootMargin?: string
  threshold?: number | number[]
}

export function useIntersectionObserver(
  target: Ref<Element | null>,
  options: IntersectionObserverOptions = {}
) {
  const isVisible = ref(false)
  const hasIntersected = ref(false)
  let observer: IntersectionObserver | null = null

  const { root = null, rootMargin = '0px', threshold = 0 } = options

  const handleIntersect = (entries: IntersectionObserverEntry[]) => {
    const [entry] = entries
    isVisible.value = entry.isIntersecting
    if (entry.isIntersected && !hasIntersected.value) {
      hasIntersected.value = true
    }
  }

  onMounted(() => {
    if (target.value && typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(handleIntersect, {
        root,
        rootMargin,
        threshold
      })
      observer.observe(target.value)
    }
  })

  onUnmounted(() => {
    if (observer) {
      observer.disconnect()
      observer = null
    }
  })

  return { isVisible, hasIntersected }
}

export default useIntersectionObserver
