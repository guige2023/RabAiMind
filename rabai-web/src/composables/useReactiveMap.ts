// useReactiveMap.ts - 响应式映射模块
import { reactive, computed } from 'vue'

export function useReactiveMap<K, V>(initial?: Map<K, V>) {
  const map = reactive(new Map<K, V>(initial))

  const set = (key: K, value: V) => {
    map.set(key, value)
  }

  const get = (key: K): V | undefined => {
    return map.get(key)
  }

  const has = (key: K): boolean => {
    return map.has(key)
  }

  const delete = (key: K): boolean => {
    return map.delete(key)
  }

  const clear = () => {
    map.clear()
  }

  const keys = computed(() => Array.from(map.keys()))

  const values = computed(() => Array.from(map.values()))

  const entries = computed(() => Array.from(map.entries()))

  const size = computed(() => map.size)

  const isEmpty = computed(() => map.size === 0)

  return {
    map,
    set,
    get,
    has,
    delete,
    clear,
    keys,
    values,
    entries,
    size,
    isEmpty
  }
}

export default useReactiveMap
