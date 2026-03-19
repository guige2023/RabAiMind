// useResizeObserver.ts - 尺寸观察模块
import { ref, onMounted, onUnmounted, type Ref } from 'vue'

export interface ResizeObserverEntry {
  contentRect: {
    width: number
    height: number
    top: number
    right: number
    bottom: number
    left: number
  }
}

export function useResizeObserver(
  target: Ref<Element | null>,
  callback?: (entry: ResizeObserverEntry) => void
) {
  const width = ref(0)
  const height = ref(0)
  let observer: ResizeObserver | null = null

  const handleResize = (entries: ResizeObserverEntry[]) => {
    const entry = entries[0]
    width.value = entry.contentRect.width
    height.value = entry.contentRect.height
    callback?.(entry)
  }

  onMounted(() => {
    if (target.value && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(handleResize)
      observer.observe(target.value)
    }
  })

  onUnmounted(() => {
    if (observer) {
      observer.disconnect()
      observer = null
    }
  })

  return { width, height }
}

export function useElementSize(target: Ref<Element | null>) {
  return useResizeObserver(target)
}

export default useResizeObserver
