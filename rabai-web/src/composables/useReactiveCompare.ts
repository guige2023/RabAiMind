// useReactiveCompare.ts - 响应式比较模块
import { reactive, computed, isProxy, isReactive } from 'vue'

export function useReactiveCompare<T extends object>(target: T) {
  const state = reactive(target)

  const isTargetProxy = computed(() => isProxy(state))
  const isTargetReactive = computed(() => isReactive(state))

  const compare = (other: any) => {
    return JSON.stringify(target) === JSON.stringify(other)
  }

  const getKeys = () => {
    return Object.keys(target)
  }

  const getValues = () => {
    return Object.values(target)
  }

  const getEntries = () => {
    return Object.entries(target)
  }

  return {
    state,
    isTargetProxy,
    isTargetReactive,
    compare,
    getKeys,
    getValues,
    getEntries
  }
}

export default useReactiveCompare
