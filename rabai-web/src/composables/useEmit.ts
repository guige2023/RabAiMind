// useEmit.ts - 事件发射模块
import { emit } from 'vue'

export function useEmit() {
  const emitEvent = (name: string, ...args: any[]) => {
    // 模拟事件发射
  }
  return { emit: emitEvent }
}

export default useEmit
