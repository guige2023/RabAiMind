// useRequest.ts - 请求模块
import { ref } from 'vue'

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: any
}

export function useRequest() {
  const loading = ref(false)
  const error = ref<Error | null>(null)

  const request = async <T = any>(url: string, options: RequestOptions = {}): Promise<T | null> => {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        body: options.body ? JSON.stringify(options.body) : undefined
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (e) {
      error.value = e as Error
      return null
    } finally {
      loading.value = false
    }
  }

  const get = <T = any>(url: string, headers?: Record<string, string>) =>
    request<T>(url, { method: 'GET', headers })

  const post = <T = any>(url: string, body: any, headers?: Record<string, string>) =>
    request<T>(url, { method: 'POST', body, headers })

  const put = <T = any>(url: string, body: any, headers?: Record<string, string>) =>
    request<T>(url, { method: 'PUT', body, headers })

  const del = <T = any>(url: string, headers?: Record<string, string>) =>
    request<T>(url, { method: 'DELETE', headers })

  return { loading, error, request, get, post, put, del }
}

export default useRequest
