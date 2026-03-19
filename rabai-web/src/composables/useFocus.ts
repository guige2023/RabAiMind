// useFocus.ts - 焦点管理模块
import { ref, onMounted, onUnmounted } from 'vue'

export function useFocus() {
  const isFocused = ref(false)

  const onFocus = () => { isFocused.value = true }
  const onBlur = () => { isFocused.value = false }

  return { isFocused, onFocus, onBlur }
}

export function useFocusTrap(containerRef: any) {
  const isActive = ref(false)

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isActive.value || e.key !== 'Tab') return

    const focusableElements = containerRef.value?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    if (!focusableElements?.length) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault()
      lastElement.focus()
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault()
      firstElement.focus()
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', handleKeyDown)
    isActive.value = true
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown)
    isActive.value = false
  })

  return { isActive }
}

export default useFocus
