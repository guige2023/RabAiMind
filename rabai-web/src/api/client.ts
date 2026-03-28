import axios, { AxiosInstance, AxiosResponse } from 'axios'
import apiErrors from '../utils/apiErrors'
import type {
  GeneratePPTRequest,
  GeneratePPTResponse,
  TaskStatusResponse,
  TaskPreviewResponse,
  PlanPPTResponse,
  ImageSearchResponse,
  Template,
  Scene,
  Style,
  APIClient
} from '../utils/types'

const { classifyError } = apiErrors

const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: '/api/v1',
    timeout: 120000,
    headers: {
      'Content-Type': 'application/json'
    }
  })

  client.interceptors.request.use(
    (config) => {
      if (config.method === 'get') {
        config.params = {
          ...config.params,
          _t: Date.now()
        }
      }
      document.body.classList.add('api-loading')
      return config
    },
    (error) => {
      document.body.classList.remove('api-loading')
      return Promise.reject(error)
    }
  )

  client.interceptors.response.use(
    (response) => {
      document.body.classList.remove('api-loading')
      return response
    },
    async (error) => {
      document.body.classList.remove('api-loading')
      const config = error.config

      if (!config || !config.__retryCount) {
        config.__retryCount = 0
      }

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

      const classifiedError = classifyError(error)
      error.classified = classifiedError

      return Promise.reject(error)
    }
  )

  return client
}

export const apiClient = createApiClient()

export const api: APIClient = {
  ppt: {
    createTask: (data: GeneratePPTRequest): Promise<AxiosResponse<GeneratePPTResponse>> => {
      return apiClient.post('/ppt/generate', data)
    },

    getTask: (taskId: string): Promise<AxiosResponse<TaskStatusResponse>> => {
      return apiClient.get(`/ppt/task/${taskId}`)
    },

    getTaskPreview: (taskId: string): Promise<AxiosResponse<TaskPreviewResponse>> => {
      return apiClient.get(`/ppt/preview/${taskId}`)
    },

    cancelTask: (taskId: string): Promise<AxiosResponse<{ success: boolean; task_id: string; status: string }>> => {
      return apiClient.delete(`/ppt/task/${taskId}`)
    },

    downloadPpt: (taskId: string, options?: { quality?: string; dpi?: number }): Promise<Blob> => {
      return apiClient.get(`/ppt/download/${taskId}`, {
        responseType: 'blob',
        params: options || {}
      })
    },

    exportPdf: (taskId: string): Promise<Blob> => {
      return apiClient.get(`/ppt/export/pdf/${taskId}`, {
        responseType: 'blob'
      })
    },

    getTemplates: (): Promise<AxiosResponse<Template[]>> => {
      return apiClient.get('/ppt/templates')
    },

    getScenes: (): Promise<AxiosResponse<Scene[]>> => {
      return apiClient.get('/ppt/scenes')
    },

    getStyles: (): Promise<AxiosResponse<Style[]>> => {
      return apiClient.get('/ppt/styles')
    },

    plan: (request: string, slideCount = 5): Promise<AxiosResponse<PlanPPTResponse>> => {
      return apiClient.post('/ppt/plan', {
        user_request: request,
        slide_count: slideCount,
        scene: 'business',
        style: 'professional'
      })
    }
  },

  images: {
    search: (query: string, page = 1): Promise<AxiosResponse<ImageSearchResponse>> => {
      return apiClient.get('/images/search', {
        params: { q: query, page, limit: 20 }
      })
    },

    random: (count = 10, orientation = 'landscape'): Promise<AxiosResponse<ImageSearchResponse>> => {
      return apiClient.get('/images/random', {
        params: { count, orientation }
      })
    },

    categories: (): Promise<AxiosResponse<{ success: boolean; categories: Array<{ id: string; name: string; icon: string; keywords: string[] }> }>> => {
      return apiClient.get('/images/categories')
    }
  }
}

export default api
