// useDropdown.ts - 下拉菜单模块
import { ref } from 'vue'
import { useClickOutside } from './useClickOutside'

export interface DropdownOption {
  label: string
  value: any
  disabled?: boolean
  divided?: boolean
}

export function useDropdown(initialValue?: any) {
  const isOpen = ref(false)
  const selected = ref(initialValue)

  const open = () => { isOpen.value = true }
  const close = () => { isOpen.value = false }
  const toggle = () => { isOpen.value = !isOpen.value }

  const select = (value: any) => {
    selected.value = value
    close()
  }

  const clear = () => {
    selected.value = null
  }

  return { isOpen, selected, open, close, toggle, select, clear }
}

export function useMultiSelect(initialValues: any[] = []) {
  const isOpen = ref(false)
  const selected = ref<any[]>(initialValues)

  const open = () => { isOpen.value = true }
  const close = () => { isOpen.value = false }
  const toggle = () => { isOpen.value = !isOpen.value }

  const select = (value: any) => {
    if (!selected.value.includes(value)) {
      selected.value.push(value)
    }
  }

  const remove = (value: any) => {
    const index = selected.value.indexOf(value)
    if (index > -1) selected.value.splice(index, 1)
  }

  const toggleSelect = (value: any) => {
    if (selected.value.includes(value)) {
      remove(value)
    } else {
      select(value)
    }
  }

  const isSelected = (value: any) => selected.value.includes(value)

  const clear = () => { selected.value = [] }

  return { isOpen, selected, open, close, toggle, select, remove, toggleSelect, isSelected, clear }
}

export default useDropdown
