// useText.ts - 文本处理模块
export function useText() {
  const truncate = (text: string, length: number, suffix = '...'): string => {
    if (text.length <= length) return text
    return text.slice(0, length) + suffix
  }

  const capitalize = (text: string): string => {
    return text.charAt(0).toUpperCase() + text.slice(1)
  }

  const camelCase = (text: string): string => {
    return text.replace(/[-_](\w)/g, (_, c) => c ? c.toUpperCase() : '')
  }

  const snakeCase = (text: string): string => {
    return text.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '')
  }

  const kebabCase = (text: string): string => {
    return text.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')
  }

  const trim = (text: string): string => text.trim()

  const escapeHtml = (text: string): string => {
    const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
    return text.replace(/[&<>"']/g, m => map[m])
  }

  const unescapeHtml = (text: string): string => {
    const map: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" }
    return text.replace(/&amp;|&lt;|&gt;|&quot;|&#39;/g, m => map[m])
  }

  const slugify = (text: string): string => {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }

  return { truncate, capitalize, camelCase, snakeCase, kebabCase, trim, escapeHtml, unescapeHtml, slugify }
}

export default useText
