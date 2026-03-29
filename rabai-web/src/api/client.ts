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
    },

    saveOutline: (taskId: string, outline: any): Promise<AxiosResponse<any>> => {
      return apiClient.post(`/ppt/outline/save?task_id=${taskId}`, outline)
    },

    commitOutline: (data: any): Promise<AxiosResponse<any>> => {
      return apiClient.post('/ppt/outline/commit', data)
    },

    getOutline: (taskId: string): Promise<AxiosResponse<any>> => {
      return apiClient.get(`/ppt/outline/${taskId}`)
    },

    regenerateSlide: (params: {
      taskId: string;
      slideIndex: number;
      scene?: string;
      style?: string;
      content?: string;
      layout?: string;
      title?: string;
    }): Promise<AxiosResponse<{ success: boolean; data: { svg_url: string; slide_index: number }; message: string }>> => {
      return apiClient.post(`/ppt/regenerate/${params.taskId}/${params.slideIndex}`, {
        scene: params.scene || 'business',
        style: params.style || 'professional',
        content: params.content || '',
        layout: params.layout || 'content',
        title: params.title || ''
      })
    },

    // 上传 CSV/Excel 生成图表
    uploadChart: (params: {
      taskId: string
      file: File
      chartType: string
      labelCol: string
      valueCol: string
    }): Promise<AxiosResponse<{
      success: boolean
      columns: { all_columns: string[]; label_columns: string[]; numeric_columns: string[]; preview: any[] }
      charts: Array<{ index: number; svg_path: string; label_col: string; value_col: string; chart_type: string }>
      svg_urls: string[]
    }>> => {
      const formData = new FormData()
      formData.append('file', params.file)
      formData.append('chart_type', params.chartType)
      formData.append('label_col', params.labelCol)
      formData.append('value_col', params.valueCol)
      return apiClient.post(`/ppt/chart/upload/${params.taskId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    },

    // 预览图表列信息
    previewChart: (taskId: string, file: File): Promise<AxiosResponse<{
      success: boolean
      columns: { all_columns: string[]; label_columns: string[]; numeric_columns: string[]; preview: any[] }
    }>> => {
      const formData = new FormData()
      formData.append('file', file)
      return apiClient.post(`/ppt/chart/preview/${taskId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    },

    // 版本管理
    listVersions: (taskId: string): Promise<AxiosResponse<{ success: boolean; versions: Array<{ version_id: string; name: string; created_at: string; slide_count: number }> }>> => {
      return apiClient.get(`/ppt/versions/${taskId}`)
    },

    getVersion: (taskId: string, versionId: string): Promise<AxiosResponse<{ success: boolean; version: any }>> => {
      return apiClient.get(`/ppt/versions/${taskId}/${versionId}`)
    },

    rollbackVersion: (taskId: string, versionId: string): Promise<AxiosResponse<{ success: boolean; message: string }>> => {
      return apiClient.post(`/ppt/versions/${taskId}/${versionId}/rollback`)
    },

    diffVersions: (taskId: string, versionA: string, versionB: string): Promise<AxiosResponse<{ success: boolean; version_a: string; version_b: string; diff: any[]; total_changes: number }>> => {
      return apiClient.get(`/ppt/versions/${taskId}/diff`, {
        params: { version_a: versionA, version_b: versionB }
      })
    },

    createSnapshot: (taskId: string, name?: string): Promise<AxiosResponse<{ success: boolean; version_id: string }>> => {
      return apiClient.post(`/ppt/versions/${taskId}/snapshot`, null, {
        params: name ? { name } : {}
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
  },

  template: {
    uploadTemplate: (data: {
      name: string;
      description: string;
      scene: string;
      style: string;
      visibility: string;
    }): Promise<AxiosResponse<{ success: boolean; template_id: string; template: any }>> => {
      return apiClient.post('/templates/upload', data)
    },

    listMyTemplates: (): Promise<AxiosResponse<{ success: boolean; templates: any[] }>> => {
      return apiClient.get('/templates/my')
    },

    deleteTemplate: (id: string): Promise<AxiosResponse<{ success: boolean }>> => {
      return apiClient.delete(`/templates/${id}`)
    }
  }
}

export default api
