// useReactive.ts - 响应式模块
import { reactive, ref } from 'vue'

export function useReactive<T extends object>(initial: T) {
  const state = reactive(initial)
  const reset = (newVal?: T) => Object.assign(state, newVal || initial)
  const keys = () => Object.keys(state)
  const values = () => Object.values(state)
  const entries = () => Object.entries(state)
  return { state, reset, keys, values, entries }
}

export default useReactive
