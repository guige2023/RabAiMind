/**
 * ID生成工具
 */

let counter = 0

/**
 * 生成唯一ID
 * @param prefix 前缀
 * @returns 唯一ID字符串
 */
export const generateId = (prefix = 'id'): string => {
  counter += 1
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).slice(2, 7)
  return `${prefix}_${timestamp}_${random}_${counter}`
}

/**
 * 重置计数器（用于测试）
 */
export const resetIdCounter = (): void => {
  counter = 0
}
