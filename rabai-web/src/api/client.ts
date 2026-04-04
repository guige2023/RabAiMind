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

    exportPngSequence: (taskId: string, resolution = '1080p'): Promise<Blob> => {
      return apiClient.get(`/ppt/export/png/${taskId}`, {
        responseType: 'blob',
        params: { resolution }
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

    plan: (request: string, slideCount = 5, scene = 'business', style = 'professional'): Promise<AxiosResponse<PlanPPTResponse>> => {
      return apiClient.post('/ppt/plan', {
        user_request: request,
        slide_count: slideCount,
        scene: scene,
        style: style
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
      layout_mode?: string;  // 'manual'|'auto' - applyTuning 时传 'manual'
      unified_layout?: boolean;  // applyTuning 时传 false
      reset_first_layout?: boolean;  // applyTuning 首次调用时传 true
    }): Promise<AxiosResponse<{ success: boolean; data: { svg_url: string; slide_index: number }; message: string }>> => {
      return apiClient.post(`/ppt/regenerate/${params.taskId}/${params.slideIndex}`, {
        scene: params.scene || 'business',
        style: params.style || 'professional',
        content: params.content || '',
        layout: params.layout || 'content',
        title: params.title || '',
        layout_mode: params.layout_mode,
        unified_layout: params.unified_layout,
        reset_first_layout: params.reset_first_layout,
      })
    },

    // 更新单页图片（设置/移除/重新生成）
    updateSlideImage: (params: {
      taskId: string;
      slideIndex: number;
      image_url?: string;
      action: 'set' | 'remove' | 'regenerate';
    }): Promise<AxiosResponse<{ success: boolean; image_url?: string; message: string }>> => {
      return apiClient.put(`/ppt/image/${params.taskId}/${params.slideIndex}`, {
        image_url: params.image_url,
        action: params.action,
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
    },

    // 操作日志
    getActionLog: (taskId: string, limit = 20): Promise<AxiosResponse<{ success: boolean; action_log: Array<{ action_type: string; description: string; timestamp: string; undo_data?: any }> }>> => {
      return apiClient.get(`/ppt/action_log/${taskId}`, {
        params: { limit }
      })
    },

    // 撤销栈
    getUndoStack: (taskId: string): Promise<AxiosResponse<{ success: boolean; undo_stack: Array<{ action_type: string; description: string; timestamp: string; undo_data?: any }> }>> => {
      return apiClient.get(`/ppt/undo_stack/${taskId}`)
    },

    // 撤销上一操作
    undo: (taskId: string): Promise<AxiosResponse<{ success: boolean; message?: string; undone_action?: string; action_type?: string }>> => {
      return apiClient.post(`/ppt/undo/${taskId}`)
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

  // 收藏功能 - BUG修复: 后端已有API但前端未调用，添加user_id支持
  favorites: {
    add: (userId: string, data: { item_id: string; item_type: string; name: string; description?: string; thumbnail?: string }): Promise<AxiosResponse<{ success: boolean; message: string }>> => {
      return apiClient.post(`/favorites/add?user_id=${userId}`, data)
    },
    remove: (userId: string, itemId: string, itemType: string): Promise<AxiosResponse<{ success: boolean; message: string }>> => {
      return apiClient.delete('/favorites/remove', { params: { user_id: userId, item_id: itemId, item_type: itemType } })
    },
    check: (userId: string, itemId: string, itemType: string): Promise<AxiosResponse<{ is_favorite: boolean }>> => {
      return apiClient.get('/favorites/check', { params: { user_id: userId, item_id: itemId, item_type: itemType } })
    },
    list: (userId: string, itemType?: string): Promise<AxiosResponse<{ success: boolean; items: any[]; total: number }>> => {
      return apiClient.get(`/favorites/list/${userId}`, { params: { item_type: itemType } })
    }
  },

  template: {
    uploadTemplate: (data: {
      name: string;
      description: string;
      scene: string;
      style: string;
      visibility: string;
      thumbnail?: string;
      colors?: string[];
      fonts?: string[];
    }): Promise<AxiosResponse<{ success: boolean; template_id: string; template: any }>> => {
      return apiClient.post('/templates', data)
    },

    listMyTemplates: (): Promise<AxiosResponse<{ success: boolean; templates: any[] }>> => {
      return apiClient.get('/templates/my')
    },

    deleteTemplate: (id: string): Promise<AxiosResponse<{ success: boolean }>> => {
      return apiClient.delete(`/templates/${id}`)
    },

    renameTemplate: (id: string, data: { name: string; description?: string }): Promise<AxiosResponse<{ success: boolean; template: any }>> => {
      return apiClient.patch(`/templates/${id}`, data)
    },

    // R35: 推荐引擎
    getTrending: (limit = 6, days = 7): Promise<AxiosResponse<{ success: boolean; templates: any[]; period_days: number }>> => {
      return apiClient.get('/templates/trending', { params: { limit, days } })
    },

    getSimilar: (templateId: string, limit = 5): Promise<AxiosResponse<{ success: boolean; templates: any[]; template_id: string }>> => {
      return apiClient.get(`/templates/similar/${templateId}`, { params: { limit } })
    },

    getRecommended: (params: { user_id?: string; scene?: string; style?: string; limit?: number }): Promise<AxiosResponse<{ success: boolean; templates: any[]; user_id: string }>> => {
      return apiClient.get('/templates/recommend', { params: params })
    },

    matchTemplates: (params: { q?: string; scene?: string; style?: string; limit?: number }): Promise<AxiosResponse<{
      success: boolean
      templates: any[]
      query: string
      detected_scene: string | null
      detected_style: string | null
    }>> => {
      return apiClient.get('/templates/match', { params: params })
    },

    trackEvent: (params: {
      event_type: 'search' | 'click' | 'use'
      template_id?: string
      user_id?: string
      query?: string
      scene?: string
      style?: string
      request_text?: string
    }): Promise<AxiosResponse<{ success: boolean; event_type: string }>> => {
      return apiClient.post('/templates/track', null, { params: params })
    },

    getTrendingQueries: (limit = 10, days = 7): Promise<AxiosResponse<{ success: boolean; queries: Array<{ query: string; count: number }>; period_days: number }>> => {
      return apiClient.get('/templates/search-analytics/trending-queries', { params: { limit, days } })
    }
  },

  // R34: PPT内容搜索
  search: {
    inPPT: (query: string, limit = 20): Promise<AxiosResponse<{
      success: boolean
      query: string
      total: number
      results: Array<{
        task_id: string
        title: string
        slide_num: number
        matched_text: string
        context: string
      }>
    }>> => {
      return apiClient.post('/ppt/search', { query, limit })
    }
  },

  // R32: AI 增强功能
  ai: {
    rephrase: (text: string, style: string = 'natural'): Promise<AxiosResponse<{ success: boolean; rephrased: string }>> => {
      return apiClient.post('/ai/rephrase', { text, style })
    },

    translate: (text: string, targetLang: string): Promise<AxiosResponse<{ success: boolean; translated: string; lang: string }>> => {
      return apiClient.post('/ai/translate', { text, target_lang: targetLang })
    },

    layoutSuggestion: (params: {
      slideIndex: number
      elements: any[]
      slideContent: string
    }): Promise<AxiosResponse<{ success: boolean; suggestion: any }>> => {
      return apiClient.post('/ai/layout-suggestion', {
        slide_index: params.slideIndex,
        elements: params.elements,
        slide_content: params.slideContent
      })
    },

    autoEnhance: (params: {
      slideIndex: number
      elements: any[]
      colorScheme?: string
    }): Promise<AxiosResponse<{ success: boolean; enhancement: any }>> => {
      return apiClient.post('/ai/auto-enhance', {
        slide_index: params.slideIndex,
        elements: params.elements,
        color_scheme: params.colorScheme || '#165DFF'
      })
    },

    contentScore: (params: {
      elements: any[]
      slideContent: string
    }): Promise<AxiosResponse<{ success: boolean; score: any }>> => {
      return apiClient.post('/ai/content-score', {
        elements: params.elements,
        slide_content: params.slideContent
      })
    }
  }
}

export default api
