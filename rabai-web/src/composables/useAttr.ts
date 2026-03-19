// useAttr.ts - 属性模块
import { ref, onMounted, onUnmounted } from 'vue'

export function useAttr(elRef: any) {
  const attrs = ref<Record<string, string>>({})

  const setAttr = (key: string, value: string) => {
    elRef.value?.setAttribute(key, value)
    attrs.value[key] = value
  }

  const removeAttr = (key: string) => {
    elRef.value?.removeAttribute(key)
    delete attrs.value[key]
  }

  const getAttr = (key: string): string | null => elRef.value?.getAttribute(key) || null

  const hasAttr = (key: string): boolean => elRef.value?.hasAttribute(key) || false

  return { attrs, setAttr, removeAttr, getAttr, hasAttr }
}

export default useAttr
