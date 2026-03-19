// useModal.ts - 模态框模块
import { ref, watch } from 'vue'

export interface ModalOptions {
  closable?: boolean
  maskClosable?: boolean
  destroyOnClose?: boolean
}

export function useModal(options: ModalOptions = {}) {
  const { closable = true, maskClosable = true, destroyOnClose = false } = options

  const isOpen = ref(false)
  const isVisible = ref(false)
  const data = ref<any>(null)

  const open = (modalData?: any) => {
    data.value = modalData || null
    isOpen.value = true
    setTimeout(() => { isVisible.value = true }, 10)
  }

  const close = () => {
    isVisible.value = false
    setTimeout(() => {
      isOpen.value = false
      if (destroyOnClose) data.value = null
    }, 300)
  }

  const toggle = () => isOpen.value ? close() : open()

  const onClose = () => {
    if (closable) close()
  }

  const onMaskClick = () => {
    if (maskClosable) close()
  }

  return { isOpen, isVisible, data, open, close, toggle, onClose, onMaskClick }
}

export default useModal
