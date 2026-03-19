// useScroll.ts - 滚动控制模块
import { ref, onMounted, onUnmounted } from 'vue'
import { useEventListener } from './useEventListener'

export function useScroll() {
  const x = ref(0)
  const y = ref(0)
  const direction = ref<'up' | 'down' | null>(null)
  let lastY = 0

  const updateScroll = () => {
    x.value = window.scrollX
    y.value = window.scrollY
    direction.value = y.value > lastY ? 'down' : 'up'
    lastY = y.value
  }

  useEventListener(window, 'scroll', updateScroll, { passive: true })

  const scrollTo = (options: ScrollToOptions) => {
    window.scrollTo(options)
  }

  const scrollToTop = (smooth = true) => {
    window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' })
  }

  const scrollToBottom = (smooth = true) => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: smooth ? 'smooth' : 'auto' })
  }

  const scrollToElement = (el: Element, offset = 0, smooth = true) => {
    const top = el.getBoundingClientRect().top + window.scrollY - offset
    window.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' })
  }

  return { x, y, direction, scrollTo, scrollToTop, scrollToBottom, scrollToElement }
}

export function useScrollLock(locked = ref(false)) {
  const lock = () => {
    locked.value = true
    document.body.style.overflow = 'hidden'
  }

  const unlock = () => {
    locked.value = false
    document.body.style.overflow = ''
  }

  const toggle = () => {
    locked.value ? unlock() : lock()
  }

  return { lock, unlock, toggle, isLocked: locked }
}

export default useScroll
