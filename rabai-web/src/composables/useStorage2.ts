// useStorage2.ts - 本地存储模块
import { ref, watch } from 'vue'

export function useStorage2<T>(key: string, defaultValue: T, storage: Storage = localStorage) {
  const data = ref<T>(defaultValue)

  const load = () => {
    const item = storage.getItem(key)
    if (item) {
      try { data.value = JSON.parse(item) }
      catch { data.value = defaultValue }
    }
  }

  const save = () => {
    storage.setItem(key, JSON.stringify(data.value))
  }

  const remove = () => storage.removeItem(key)

  load()
  watch(data, save, { deep: true })

  return { data, load, save, remove }
}

export default useStorage2
