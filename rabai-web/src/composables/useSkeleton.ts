// useSkeleton.ts - 骨架屏模块
import { ref } from 'vue'

export interface SkeletonOptions {
  rows?: number
  animated?: boolean
}

export function useSkeleton(options: SkeletonOptions = {}) {
  const { rows = 3, animated = true } = options

  const isLoading = ref(true)
  const isReady = ref(false)

  const start = () => {
    isLoading.value = true
    isReady.value = false
  }

  const end = () => {
    isLoading.value = false
    isReady.value = true
  }

  const getRows = () => Array.from({ length: rows }, (_, i) => i)

  return { isLoading, isReady, start, end, getRows, animated }
}

export default useSkeleton
