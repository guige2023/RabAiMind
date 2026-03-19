// useReactiveObject.ts - 响应式对象模块
import { reactive, computed, toRaw } from 'vue'

export function useReactiveObject<T extends object>(initial: T) {
  const state = reactive<T>(initial)

  const get = <K extends keyof T>(key: K): T[K] => {
    return state[key]
  }

  const set = <K extends keyof T>(key: K, value: T[K]) => {
    state[key] = value
  }

  const remove = <K extends keyof T>(key: K) => {
    delete state[key]
  }

  const has = <K extends keyof T>(key: K): boolean => {
    return key in state
  }

  const keys = computed(() => Object.keys(state))

  const values = computed(() => Object.values(state))

  const entries = computed(() => Object.entries(state))

  const toPlain = (): T => {
    return JSON.parse(JSON.stringify(toRaw(state)))
  }

  const merge = (obj: Partial<T>) => {
    Object.assign(state, obj)
  }

  return {
    state,
    get,
    set,
    remove,
    has,
    keys,
    values,
    entries,
    toPlain,
    merge
  }
}

export default useReactiveObject
