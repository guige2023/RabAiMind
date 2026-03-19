// useCollapse.ts - 折叠面板模块
import { ref } from 'vue'

export function useCollapse() {
  const activeNames = ref<string[]>([])

  const toggle = (name: string) => {
    const index = activeNames.value.indexOf(name)
    if (index > -1) {
      activeNames.value.splice(index, 1)
    } else {
      activeNames.value.push(name)
    }
  }

  const isActive = (name: string) => activeNames.value.includes(name)

  const open = (name: string) => {
    if (!isActive(name)) activeNames.value.push(name)
  }

  const close = (name: string) => {
    const index = activeNames.value.indexOf(name)
    if (index > -1) activeNames.value.splice(index, 1)
  }

  const closeAll = () => { activeNames.value = [] }

  return { activeNames, toggle, isActive, open, close, closeAll }
}

export default useCollapse
