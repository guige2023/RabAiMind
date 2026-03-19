// useStorage.ts - 本地存储模块
import { ref, watch } from 'vue'

export interface StorageOptions {
  prefix: string
  storageType: 'local' | 'session'
}

export function useStorage(options: StorageOptions = { prefix: 'rabaimind_', storageType: 'local' }) {
  const storage = options.storageType === 'local' ? localStorage : sessionStorage

  const get = <T = any>(key: string, defaultValue?: T): T | null => {
    try {
      const item = storage.getItem(options.prefix + key)
      return item ? JSON.parse(item) : defaultValue ?? null
    } catch {
      return defaultValue ?? null
    }
  }

  const set = <T = any>(key: string, value: T): boolean => {
    try {
      storage.setItem(options.prefix + key, JSON.stringify(value))
      return true
    } catch {
      return false
    }
  }

  const remove = (key: string): boolean => {
    try {
      storage.removeItem(options.prefix + key)
      return true
    } catch {
      return false
    }
  }

  const clear = (): boolean => {
    try {
      Object.keys(storage)
        .filter(k => k.startsWith(options.prefix))
        .forEach(k => storage.removeItem(k))
      return true
    } catch {
      return false
    }
  }

  const keys = () => Object.keys(storage).filter(k => k.startsWith(options.prefix))

  const has = (key: string): boolean => storage.getItem(options.prefix + key) !== null

  // 响应式
  const reactive = <T>(key: string, defaultValue: T) => {
    const data = ref<T>(get(key, defaultValue) ?? defaultValue)

    watch(data, (val) => set(key, val), { deep: true })

    return data
  }

  return { get, set, remove, clear, keys, has, reactive }
}

export default useStorage
