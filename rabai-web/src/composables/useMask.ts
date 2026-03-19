// useMask.ts - 遮罩层模块
import { ref } from 'vue'

export interface MaskOptions {
  closable?: boolean
  onClose?: () => void
}

export function useMask() {
  const isVisible = ref(false)
  const isAnimating = ref(false)

  const show = (options?: MaskOptions) => {
    isVisible.value = true
    isAnimating.value = true
    setTimeout(() => { isAnimating.value = false }, 300)
  }

  const hide = () => {
    isAnimating.value = true
    setTimeout(() => {
      isVisible.value = false
      isAnimating.value = false
    }, 300)
  }

  const toggle = () => {
    isVisible.value ? hide() : show()
  }

  return { isVisible, isAnimating, show, hide, toggle }
}

export default useMask
