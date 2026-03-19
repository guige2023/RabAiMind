// useToRaw.ts - 原始数据模块
import { toRaw, ref } from 'vue'

export function useToRaw() {
  const toRaw2 = <T>(obj: T) => toRaw(obj)
  return { toRaw: toRaw2 }
}

export default useToRaw
