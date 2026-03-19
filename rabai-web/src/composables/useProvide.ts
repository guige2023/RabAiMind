// useProvide.ts - 依赖注入模块
import { provide, inject, InjectionKey } from 'vue'

export function useProvide<T>(key: InjectionKey<T>, value: T) {
  provide(key, value)
}

export function useInject<T>(key: InjectionKey<T>) {
  return inject(key)
}

export default useProvide
