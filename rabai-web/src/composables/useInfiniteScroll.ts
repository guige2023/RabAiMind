// useInfiniteScroll.ts - 无限滚动模块
import { ref, onMounted, onUnmounted } from 'vue'

export interface InfiniteScrollOptions {
  distance?: number
  disabled?: boolean
}

export function useInfiniteScroll(
  loadMore: () => Promise<void>,
  options: InfiniteScrollOptions = {}
) {
  const { distance = 100, disabled = false } = options

  const isLoading = ref(false)
  const isComplete = ref(false)
  const error = ref<Error | null>(null)

  const handleScroll = async () => {
    if (disabled || isLoading.value || isComplete.value) return

    const scrollTop = window.scrollY
    const scrollHeight = document.documentElement.scrollHeight
    const clientHeight = window.innerHeight

    if (scrollHeight - scrollTop - clientHeight < distance) {
      isLoading.value = true
      error.value = null

      try {
        await loadMore()
      } catch (e) {
        error.value = e as Error
      } finally {
        isLoading.value = false
      }
    }
  }

  const reset = () => {
    isComplete.value = false
    error.value = null
  }

  const complete = () => {
    isComplete.value = true
  }

  onMounted(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
  })

  return { isLoading, isComplete, error, reset, complete }
}

export default useInfiniteScroll
