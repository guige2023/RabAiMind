// useVirtualList.ts - 虚拟列表模块
import { ref, computed, onMounted, onUnmounted } from 'vue'

export interface VirtualListOptions {
  itemHeight: number
  overscan?: number
}

export function useVirtualList<T>(items: T[], options: VirtualListOptions) {
  const { itemHeight, overscan = 3 } = options

  const scrollTop = ref(0)
  const containerHeight = ref(0)

  const setScrollTop = (top: number) => { scrollTop.value = top }
  const setContainerHeight = (height: number) => { containerHeight.value = height }

  const startIndex = computed(() => Math.max(0, Math.floor(scrollTop.value / itemHeight) - overscan))
  const endIndex = computed(() => {
    const visibleCount = Math.ceil(containerHeight.value / itemHeight)
    return Math.min(items.length, startIndex.value + visibleCount + overscan * 2)
  })

  const visibleItems = computed(() => items.slice(startIndex.value, endIndex.value))

  const offsetY = computed(() => startIndex.value * itemHeight)

  const totalHeight = computed(() => items.length * itemHeight)

  return {
    scrollTop,
    containerHeight,
    startIndex,
    endIndex,
    visibleItems,
    offsetY,
    totalHeight,
    setScrollTop,
    setContainerHeight
  }
}

export default useVirtualList
