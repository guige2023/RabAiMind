// useChips.ts - 芯片模块
import { ref } from 'vue'

export interface Chip {
  id: string
  label: string
  value?: any
}

export function useChips(initialChips: Chip[] = []) {
  const chips = ref<Chip[]>([...initialChips])

  const add = (chip: Chip | string) => {
    const newChip = typeof chip === 'string' ? { id: String(Date.now()), label: chip } : chip
    if (!chips.value.find(c => c.id === newChip.id)) {
      chips.value.push(newChip)
    }
  }

  const remove = (id: string) => {
    const index = chips.value.findIndex(c => c.id === id)
    if (index > -1) chips.value.splice(index, 1)
  }

  const update = (id: string, updates: Partial<Chip>) => {
    const chip = chips.value.find(c => c.id === id)
    if (chip) Object.assign(chip, updates)
  }

  const clear = () => { chips.value = [] }

  return { chips, add, remove, update, clear }
}

export default useChips
