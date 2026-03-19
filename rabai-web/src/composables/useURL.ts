// useURL.ts - URL解析模块
import { ref, computed } from 'vue'

export interface URLParams {
  [key: string]: string
}

export function useURL() {
  const getQueryParam = (key: string): string | null => {
    const params = new URLSearchParams(window.location.search)
    return params.get(key)
  }

  const getAllParams = (): URLParams => {
    const params: URLParams = {}
    const searchParams = new URLSearchParams(window.location.search)
    searchParams.forEach((value, key) => {
      params[key] = value
    })
    return params
  }

  const setQueryParam = (key: string, value: string) => {
    const url = new URL(window.location.href)
    url.searchParams.set(key, value)
    window.history.pushState({}, '', url.toString())
  }

  const removeQueryParam = (key: string) => {
    const url = new URL(window.location.href)
    url.searchParams.delete(key)
    window.history.pushState({}, '', url.toString())
  }

  const buildURL = (base: string, params: Record<string, string | number>) => {
    const url = new URL(base)
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, String(value))
    })
    return url.toString()
  }

  const hash = computed(() => window.location.hash.slice(1) || '')
  const path = computed(() => window.location.pathname)
  const host = computed(() => window.location.host)

  return { getQueryParam, getAllParams, setQueryParam, removeQueryParam, buildURL, hash, path, host }
}

export default useURL
