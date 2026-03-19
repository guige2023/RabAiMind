// useClickOutside.ts - 点击外部检测模块
import { onMounted, onUnmounted, Ref } from 'vue'

export function useClickOutside(
  target: Ref<Element | null>,
  callback: () => void
) {
  const handler = (e: MouseEvent) => {
    const el = target.value
    if (el && !el.contains(e.target as Node)) {
      callback()
    }
  }

  onMounted(() => {
    document.addEventListener('click', handler, true)
  })

  onUnmounted(() => {
    document.removeEventListener('click', handler, true)
  })
}

export default useClickOutside
