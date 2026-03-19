// useUniqueId.ts - 唯一ID生成模块
import { ref } from 'vue'

let idCounter = 0

export function useUniqueId(prefix = 'id') {
  const generate = (): string => {
    idCounter++
    return `${prefix}_${Date.now()}_${idCounter}`
  }

  const generateNanoId = (length = 16): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  return { generate, generateNanoId }
}

export default useUniqueId
