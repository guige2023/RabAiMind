// useExpose.ts - 暴露模块
import { ref } from 'vue'

export function useExpose<T extends Record<string, any>>(exposed: T) {
  return exposed
}

export default useExpose
