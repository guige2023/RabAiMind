// useHistory.ts - 历史记录模块
import { ref, watch } from 'vue'

export interface HistoryState {
  past: any[]
  present: any
  future: any[]
}

export function useHistory<T>(initialValue: T) {
  const past = ref<T[]>([])
  const present = ref<T>(initialValue)
  const future = ref<T[]>([])

  const canUndo = ref(false)
  const canRedo = ref(false)

  const update = () => {
    canUndo.value = past.value.length > 0
    canRedo.value = future.value.length > 0
  }

  const set = (newValue: T) => {
    past.value.push(present.value)
    present.value = newValue
    future.value = []
    update()
  }

  const undo = () => {
    if (past.value.length === 0) return
    future.value.push(present.value)
    present.value = past.value.pop()!
    update()
  }

  const redo = () => {
    if (future.value.length === 0) return
    past.value.push(present.value)
    present.value = future.value.pop()!
    update()
  }

  const clear = () => {
    past.value = []
    future.value = []
    update()
  }

  return { past, present, future, canUndo, canRedo, set, undo, redo, clear }
}

export default useHistory
