// useLazyLoad.ts - 懒加载模块
import { ref, computed, onMounted } from 'vue'
import { useIntersectionObserver } from './useIntersectionObserver'

export interface LazyLoadOptions {
  src: string
  placeholder?: string
  error?: string
}

export function useLazyLoad(options: LazyLoadOptions) {
  const { src, placeholder = '', error = '' } = options

  const imageSrc = ref(placeholder)
  const isLoaded = ref(false)
  const isError = ref(false)

  const load = () => {
    const img = new Image()
    img.onload = () => {
      imageSrc.value = src
      isLoaded.value = true
      isError.value = false
    }
    img.onerror = () => {
      imageSrc.value = error || placeholder
      isError.value = true
    }
    img.src = src
  }

  return { imageSrc, isLoaded, isError, load }
}

export function useLazyImage(src: string, rootRef?: any) {
  const target = ref<HTMLImageElement | null>(null)
  const { hasIntersected } = useIntersectionObserver(rootRef || target, { threshold: 0.1 })

  const imageSrc = ref('')

  onMounted(() => {
    if (hasIntersected.value && src) {
      imageSrc.value = src
    }
  })

  return { target, imageSrc, hasIntersected }
}

export default useLazyLoad
