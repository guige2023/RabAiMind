// useCarousel.ts - 轮播模块
import { ref, computed } from 'vue'

export function useCarousel(total: number, initialIndex = 0) {
  const currentIndex = ref(initialIndex)
  const isAnimating = ref(false)

  const next = () => {
    if (isAnimating.value) return
    currentIndex.value = (currentIndex.value + 1) % total
  }

  const prev = () => {
    if (isAnimating.value) return
    currentIndex.value = (currentIndex.value - 1 + total) % total
  }

  const goTo = (index: number) => {
    if (isAnimating.value || index < 0 || index >= total) return
    currentIndex.value = index
  }

  const isFirst = computed(() => currentIndex.value === 0)
  const isLast = computed(() => currentIndex.value === total - 1)

  return { currentIndex, isAnimating, next, prev, goTo, isFirst, isLast }
}

export function useInfiniteCarousel(total: number) {
  const currentIndex = ref(0)
  const direction = ref<'left' | 'right'>('right')

  const next = () => {
    direction.value = 'right'
    currentIndex.value = (currentIndex.value + 1) % total
  }

  const prev = () => {
    direction.value = 'left'
    currentIndex.value = (currentIndex.value - 1 + total) % total
  }

  const goTo = (index: number) => {
    if (index < 0 || index >= total) return
    direction.value = index > currentIndex.value ? 'right' : 'left'
    currentIndex.value = index
  }

  return { currentIndex, direction, next, prev, goTo }
}

export default useCarousel
