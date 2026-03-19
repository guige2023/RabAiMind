// useDrawer.ts - 抽屉模块
import { ref } from 'vue'

export type DrawerPlacement = 'left' | 'right' | 'top' | 'bottom'

export interface DrawerOptions {
  placement?: DrawerPlacement
  closable?: boolean
  maskClosable?: boolean
  width?: number | string
  height?: number | string
}

export function useDrawer(options: DrawerOptions = {}) {
  const {
    placement = 'right',
    closable = true,
    maskClosable = true,
    width = 400,
    height = '100%'
  } = options

  const isOpen = ref(false)
  const isVisible = ref(false)

  const open = () => {
    isOpen.value = true
    setTimeout(() => { isVisible.value = true }, 10)
  }

  const close = () => {
    isVisible.value = false
    setTimeout(() => { isOpen.value = false }, 300)
  }

  const toggle = () => isOpen.value ? close() : open()

  const styles = ref({
    width: placement === 'left' || placement === 'right' ? width : '100%',
    height: placement === 'top' || placement === 'bottom' ? height : '100%'
  })

  return { isOpen, isVisible, placement, open, close, toggle, styles, closable, maskClosable }
}

export default useDrawer
