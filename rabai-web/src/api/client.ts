import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import apiErrors from '../utils/apiErrors'

const { classifyError } = apiErrors

// Create axios instance with optimized defaults
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: '/api/v1',
    timeout: 60000, // 60 seconds timeout
    headers: {
      'Content-Type': 'application/json'
    }
  })

  // Request interceptor
  client.interceptors.request.use(
    (config) => {
      // Add timestamp to prevent caching GET requests
      if (config.method === 'get') {
        config.params = {
          ...config.params,
          _t: Date.now()
        }
      }
      // Add loading state
      document.body.classList.add('api-loading')
      return config
    },
    (error) => {
      document.body.classList.remove('api-loading')
      return Promise.reject(error)
    }
  )

  // Response interceptor with retry logic and error handling
  client.interceptors.response.use(
    (response) => {
      document.body.classList.remove('api-loading')
      return response
    },
    async (error) => {
      document.body.classList.remove('api-loading')
      const config = error.config

      // Retry logic for network errors
      if (!config || !config.__retryCount) {
        config.__retryCount = 0
      }

      // Only retry on network errors, not on 4xx/5xx
      if (
        !error.response &&
        config.__retryCount < 3 &&
        config.method !== 'get'
      ) {
        config.__retryCount++
        const delay = Math.pow(2, config.__retryCount) * 1000
        console.log(`Retrying request (${config.__retryCount}/3) after ${delay}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
        return client(config)
      }

      // Classify and enhance error
      const classifiedError = classifyError(error)
      error.classified = classifiedError

      return Promise.reject(error)
    }
  )

  return client
}

export const apiClient = createApiClient()

// API methods
export const api = {
  // PPT APIs
  ppt: {
    // Create PPT generation task
    createTask: (data: any): Promise<AxiosResponse> => {
      return apiClient.post('/ppt/generate', data)
    },

    // Get task status
    getTask: (taskId: string): Promise<AxiosResponse> => {
      return apiClient.get(`/ppt/task/${taskId}`)
    },

    // Cancel task
    cancelTask: (taskId: string): Promise<AxiosResponse> => {
      return apiClient.delete(`/ppt/task/${taskId}`)
    },

    // Download PPT
    downloadPpt: (taskId: string, options?: { quality?: string; dpi?: number }): Promise<Blob> => {
      return apiClient.get(`/ppt/download/${taskId}`, {
        responseType: 'blob',
        params: options || {}
      })
    },

    // Export to PDF
    exportPdf: (taskId: string): Promise<Blob> => {
      return apiClient.get(`/ppt/export/pdf/${taskId}`, {
        responseType: 'blob'
      })
    }
  },

  // Image APIs
  images: {
    // Search images
    search: (query: string, page = 1): Promise<AxiosResponse> => {
      return apiClient.get('/images/search', {
        params: { q: query, page, limit: 20 }
      })
    }
  }
}

export default api
