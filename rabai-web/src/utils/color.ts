/**
 * 颜色工具函数
 */

/**
 * 验证hex颜色格式
 * @param color 颜色字符串
 * @returns 是否为有效的3位或6位hex颜色
 */
export const isValidHex = (color: string): boolean => {
  if (typeof color !== 'string') return false
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color)
}

/**
 * 规范化hex颜色为6位格式
 * @param color 3位或6位hex颜色
 * @returns 6位hex颜色，不合法返回原值
 */
export const normalizeHex = (color: string): string => {
  if (!isValidHex(color)) return color
  if (color.length === 4) {
    return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
  }
  return color
}

/**
 * hex转rgb对象
 * @param hex 6位hex颜色
 * @returns rgb对象 或 null
 */
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  if (!isValidHex(hex)) return null
  const normalized = normalizeHex(hex)
  return {
    r: parseInt(normalized.slice(1, 3), 16),
    g: parseInt(normalized.slice(3, 5), 16),
    b: parseInt(normalized.slice(5, 7), 16),
  }
}

/**
 * rgb转hex字符串
 * @param r 红色 0-255
 * @param g 绿色 0-255
 * @param b 蓝色 0-255
 * @returns 6位hex颜色
 */
export const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + [r, g, b].map(x => {
    const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}
