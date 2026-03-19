// useIsReactive.ts - 响应式检测模块
import { isReactive, isProxy, reactive } from 'vue'

export function useIsReactive(obj: any) {
  return isReactive(obj)
}

export function useIsProxy(obj: any) {
  return isProxy(obj)
}

export default useIsReactive
