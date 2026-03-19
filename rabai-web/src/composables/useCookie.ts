// useCookie.ts - Cookie模块
import { ref } from 'vue'

export function useCookie() {
  const get = (name: string): string | null => {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
    return match ? decodeURIComponent(match[2]) : null
  }

  const set = (name: string, value: string, days = 7, path = '/'): void => {
    const expires = new Date(Date.now() + days * 864e5).toUTCString()
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=${path}`
  }

  const remove = (name: string, path = '/'): void => {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path}`
  }

  const has = (name: string): boolean => get(name) !== null

  const getAll = (): Record<string, string> => {
    const cookies: Record<string, string> = {}
    document.cookie.split(';').forEach(c => {
      const [key, ...v] = c.trim().split('=')
      if (key) cookies[key] = decodeURIComponent(v.join('='))
    })
    return cookies
  }

  return { get, set, remove, has, getAll }
}

export default useCookie
