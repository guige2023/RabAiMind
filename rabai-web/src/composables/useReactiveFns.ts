// useReactiveFns.ts - 响应式函数工具模块
import { reactive, toRaw, isReactive } from 'vue'

export function useReactiveFns<T extends object>(initial: T) {
  const state = reactive<T>(initial)

  const getRaw = () => toRaw(state)

  const isStateReactive = () => isReactive(state)

  const reset = (newInitial: T) => {
    Object.keys(state).forEach(key => {
      delete (state as any)[key]
    })
    Object.assign(state, newInitial)
  }

  const clone = (): T => {
    return JSON.parse(JSON.stringify(toRaw(state)))
  }

  return {
    state,
    getRaw,
    isStateReactive,
    reset,
    clone
  }
}

export default useReactiveFns
