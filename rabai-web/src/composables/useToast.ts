// useToast.ts - 轻提示模块
import { ref } from 'vue'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration: number
}

export function useToast() {
  const toasts = ref<Toast[]>([])

  const show = (message: string, type: Toast['type'] = 'info', duration = 3000) => {
    const id = `toast_${Date.now()}`
    const toast: Toast = { id, message, type, duration }

    toasts.value.push(toast)

    if (duration > 0) {
      setTimeout(() => remove(id), duration)
    }

    return id
  }

  const success = (message: string, duration?: number) => show(message, 'success', duration)
  const error = (message: string, duration?: number) => show(message, 'error', duration || 5000)
  const warning = (message: string, duration?: number) => show(message, 'warning', duration)
  const info = (message: string, duration?: number) => show(message, 'info', duration)

  const remove = (id: string) => {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index > -1) toasts.value.splice(index, 1)
  }

  const clear = () => { toasts.value = [] }

  return { toasts, show, success, error, warning, info, remove, clear }
}

export default useToast
