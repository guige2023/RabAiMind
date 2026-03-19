// useReactivePick.ts - 响应式对象pick模块
import { reactive, computed } from 'vue'

export function useReactivePick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
) {
  const picked = reactive(
    keys.reduce((acc, key) => {
      acc[key] = obj[key]
      return acc
    }, {} as Pick<T, K>)
  )

  const get = <K2 extends keyof Pick<T, K>>(key: K2): Pick<T, K>[K2] => {
    return picked[key]
  }

  const set = <K2 extends keyof Pick<T, K>>(key: K2, value: Pick<T, K>[K2]) => {
    picked[key] = value
  }

  const allKeys = computed(() => Object.keys(picked))

  const toPlain = (): Pick<T, K> => {
    return { ...picked }
  }

  return {
    picked,
    get,
    set,
    allKeys,
    toPlain
  }
}

export default useReactivePick
