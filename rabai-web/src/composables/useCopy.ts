// useCopy.ts - 复制功能模块
import { ref } from 'vue'

export function useCopy() {
  const copied = ref(false)
  const error = ref<Error | null>(null)

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      copied.value = true
      error.value = null
      setTimeout(() => { copied.value = false }, 2000)
      return true
    } catch (e) {
      error.value = e as Error
      // 降级方案
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      try {
        document.execCommand('copy')
        copied.value = true
        error.value = null
        setTimeout(() => { copied.value = false }, 2000)
        return true
      } catch (e) {
        error.value = e as Error
        return false
      } finally {
        document.body.removeChild(textarea)
      }
    }
  }

  const paste = async () => {
    try {
      return await navigator.clipboard.readText()
    } catch {
      return null
    }
  }

  return { copied, error, copy, paste }
}

export default useCopy
