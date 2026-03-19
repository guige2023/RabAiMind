// useConfirm.ts - 确认对话框模块
import { ref } from 'vue'

export interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'info' | 'warning' | 'danger'
}

export function useConfirm() {
  const isOpen = ref(false)
  const options = ref<ConfirmOptions>({ message: '' })
  const promise = ref<{ resolve: (value: boolean) => void } | null>(null)

  const confirm = (opts: ConfirmOptions): Promise<boolean> => {
    options.value = {
      title: '确认',
      confirmText: '确定',
      cancelText: '取消',
      type: 'info',
      ...opts
    }
    isOpen.value = true

    return new Promise((resolve) => {
      promise.value = { resolve }
    })
  }

  const handleConfirm = () => {
    isOpen.value = false
    promise.value?.resolve(true)
  }

  const handleCancel = () => {
    isOpen.value = false
    promise.value?.resolve(false)
  }

  return { isOpen, options, confirm, handleConfirm, handleCancel }
}

export default useConfirm
