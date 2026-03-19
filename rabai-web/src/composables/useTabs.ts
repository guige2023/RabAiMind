// useTabs.ts - 标签页模块
import { ref, computed } from 'vue'

export interface TabItem {
  key: string
  label: string
  disabled?: boolean
}

export function useTabs(initialKey?: string) {
  const activeKey = ref(initialKey || '')

  const setActive = (key: string) => {
    activeKey.value = key
  }

  const next = (tabs: TabItem[]) => {
    const currentIndex = tabs.findIndex(t => t.key === activeKey.value)
    const nextIndex = tabs.findIndex(t => t.key !== activeKey.value && !t.disabled)
    if (nextIndex > currentIndex) {
      activeKey.value = tabs[nextIndex].key
    }
  }

  const prev = (tabs: TabItem[]) => {
    const currentIndex = tabs.findIndex(t => t.key === activeKey.value)
    const prevTabs = tabs.slice(0, currentIndex).filter(t => !t.disabled)
    if (prevTabs.length > 0) {
      activeKey.value = prevTabs[prevTabs.length - 1].key
    }
  }

  const reset = () => {
    activeKey.value = ''
  }

  return { activeKey, setActive, next, prev, reset }
}

export function useAccordion() {
  const activeKeys = ref<string[]>([])

  const toggle = (key: string) => {
    const index = activeKeys.value.indexOf(key)
    if (index > -1) {
      activeKeys.value.splice(index, 1)
    } else {
      activeKeys.value.push(key)
    }
  }

  const isActive = (key: string) => activeKeys.value.includes(key)

  const open = (key: string) => {
    if (!isActive(key)) activeKeys.value.push(key)
  }

  const close = (key: string) => {
    const index = activeKeys.value.indexOf(key)
    if (index > -1) activeKeys.value.splice(index, 1)
  }

  const closeAll = () => { activeKeys.value = [] }

  return { activeKeys, toggle, isActive, open, close, closeAll }
}

export default useTabs
