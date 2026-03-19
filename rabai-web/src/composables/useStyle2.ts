// useStyle2.ts - 样式模块
import { ref } from 'vue'

export function useStyle() {
  const style = ref<Record<string, string>>({})

  const set = (key: string, value: string) => { style.value[key] = value }
  const remove = (key: string) => { delete style.value[key] }
  const clear = () => { style.value = {} }

  const toString = () => {
    return Object.entries(style.value)
      .map(([k, v]) => `${k}: ${v}`)
      .join('; ')
  }

  return { style, set, remove, clear, toString }
}

export default useStyle
