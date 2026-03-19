// useMap.ts - 字典模块
import { ref, computed } from 'vue'

export function useMap<K, V>(initial: Record<K, V> = {} as Record<K, V>) {
  const data = ref<Record<K, V>>({ ...initial })
  const keys = computed(() => Object.keys(data.value) as K[])
  const values = computed(() => Object.values(data.value))
  const entries = computed(() => Object.entries(data.value) as [K, V][])
  const size = computed(() => keys.value.length)
  const isEmpty = computed(() => size.value === 0)
  const set = (k: K, v: V) => { data.value[k] = v }
  const get = (k: K) => data.value[k]
  const has = (k: K) => k in data.value
  const remove = (k: K) => delete data.value[k]
  const clear = () => { data.value = {} }
  return { data, keys, values, entries, size, isEmpty, set, get, has, remove, clear }
}

export default useMap
