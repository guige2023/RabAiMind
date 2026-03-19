// useEventListener.ts - 事件监听模块
import { onMounted, onUnmounted, type Ref } from 'vue'

export type EventListenerOptions = {
  target?: Ref<Element | Window | Document | null>
  passive?: boolean
  capture?: boolean
}

export function useEventListener(
  event: string,
  handler: (e: Event) => void,
  options: EventListenerOptions = {}
) {
  const { target = window, passive = false, capture = false } = options

  const add = () => {
    const el = target.value
    if (el) {
      el.addEventListener(event, handler, { passive, capture })
    }
  }

  const remove = () => {
    const el = target.value
    if (el) {
      el.removeEventListener(event, handler, { capture })
    }
  }

  onMounted(add)
  onUnmounted(remove)

  return { add, remove }
}

export function useWindowEvent(event: string, handler: (e: Event) => void, passive = false) {
  return useEventListener(event, handler, { target: window, passive })
}

export function useDocumentEvent(event: string, handler: (e: Event) => void, passive = false) {
  return useEventListener(event, handler, { target: document, passive })
}

export default useEventListener
