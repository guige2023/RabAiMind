// useElement.ts - DOM元素模块
import { ref, onMounted, onUnmounted } from 'vue'

export function useElement(selector: string) {
  const el = ref<HTMLElement | null>(null)

  onMounted(() => {
    el.value = document.querySelector(selector)
  })

  const addClass = (className: string) => el.value?.classList.add(className)
  const removeClass = (className: string) => el.value?.classList.remove(className)
  const toggleClass = (className: string) => el.value?.classList.toggle(className)
  const hasClass = (className: string) => el.value?.classList.contains(className)

  return { el, addClass, removeClass, toggleClass, hasClass }
}

export default useElement
