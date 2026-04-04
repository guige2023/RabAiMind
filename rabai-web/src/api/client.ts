import axios, { AxiosInstance, AxiosResponse } from 'axios'
import apiErrors from '../utils/apiErrors'
import { apiCache, cacheKeys } from '../utils/cache'
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

// Cache configuration
const CACHEABLE_METHODS = ['get']
const CACHEABLE_PATTERNS = [
  '/templates',
  '/images/categories',
  '/images/random',
  '/ppt/scenes',
  '/ppt/styles',
  '/brand/get',
  '/favorites/list',
]
const DEFAULT_CACHE_TTL = 5 * 60 * 1000  // 5 minutes

const isCacheable = (config: any): boolean => {
  if (!CACHEABLE_METHODS.includes(config.method?.toLowerCase())) return false
  const url = config.url || ''
  return CACHEABLE_PATTERNS.some(pattern => url.includes(pattern))
}

const getCacheKey = (config: any): string => {
  const url = config.url || ''
  const params = config.params ? JSON.stringify(config.params) : ''
  return `api_${url}_${params}`
}

const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: '/api/v1',
    timeout: 120000,
    headers: {
      'Content-Type': 'application/json'
    }
  })

  // Response cache interceptor
  client.interceptors.response.use(
    (response) => {
      const config = response.config
      if (isCacheable(config)) {
        const key = getCacheKey(config)
        apiCache.set(key, response.data, DEFAULT_CACHE_TTL)
      }
      return response
    },
    (error) => Promise.reject(error)
  )

  // Request cache interceptor (check cache before hitting network)
  client.interceptors.request.use(
    (config) => {
      if (isCacheable(config)) {
        const key = getCacheKey(config)
        const cached = apiCache.get(key)
        if (cached !== null) {
          // Return cached data as a fake response
          return Promise.resolve({
            ...config,
            cached: true,
            __cachedResponse: cached
          } as any)
        }
      }
      return config
    },
    (error) => Promise.reject(error)
  )

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

      // Detect network error (offline)
      const isNetworkError = !error.response && !navigator.onLine

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

      // Queue offline POST/PUT/DELETE requests for background sync
      if (isNetworkError && config && ['post', 'put', 'delete'].includes(config.method?.toLowerCase())) {
        console.log(`[API Client] Queuing offline ${config.method} request: ${config.url}`)
        try {
          const registration = await navigator.serviceWorker?.ready
          if (registration?.active) {
            registration.active.postMessage({
              type: 'QUEUED_REQUEST',
              payload: {
                method: config.method.toUpperCase(),
                url: new URL(config.url, window.location.origin).href,
                headers: config.headers ? Object.fromEntries(Object.entries(config.headers).filter(([, v]) => typeof v === 'string')) : {},
                body: config.data ? JSON.parse(config.data) : null
              }
            })
          }
        } catch (err) {
          console.error('[API Client] Failed to queue offline request:', err)
        }
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
      // R62 新参数
      themeId?: string
      showTrendLine?: boolean
      annotations?: Array<{ type: string; x: number; y: number; text: string; color: string }>
    }): Promise<AxiosResponse<{
      success: boolean
      columns: { all_columns: string[]; label_columns: string[]; numeric_columns: string[]; preview: any[] }
      charts: Array<{ index: number; svg_path: string; label_col: string; value_col: string; chart_type: string; theme_id?: string }>
      svg_urls: string[]
    }>> => {
      const formData = new FormData()
      formData.append('file', params.file)
      formData.append('chart_type', params.chartType)
      formData.append('label_col', params.labelCol)
      formData.append('value_col', params.valueCol)
      // R62: 新参数
      if (params.themeId) formData.append('theme_id', params.themeId)
      if (params.showTrendLine) formData.append('show_trend_line', 'true')
      if (params.annotations && params.annotations.length > 0) {
        formData.append('annotations_json', JSON.stringify(params.annotations))
      }
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
    },

    redo: (taskId: string): Promise<AxiosResponse<{ success: boolean; message?: string; redone_action?: string; action_type?: string }>> => {
      return apiClient.post(`/ppt/redo/${taskId}`)
    },

    getRedoStack: (taskId: string): Promise<AxiosResponse<{ success: boolean; redo_stack: Array<{ action_type: string; description: string; timestamp: string; undo_data?: any }> }>> => {
      return apiClient.get(`/ppt/redo_stack/${taskId}`)
    },

    // 高级撤销/重做
    getActionTimeline: (taskId: string, limit = 100): Promise<AxiosResponse<{ success: boolean; timeline: Array<{ action_id: string; action_type: string; description: string; timestamp: string; undo_data?: any; branch_id?: string }> }>> => {
      return apiClient.get(`/ppt/timeline/${taskId}`, { params: { limit } })
    },

    undoByActionId: (taskId: string, actionId: string): Promise<AxiosResponse<{ success: boolean; undone_action?: string; affected_actions?: number }>> => {
      return apiClient.post(`/ppt/undo/${taskId}/${actionId}`)
    },

    // 检查点系统
    createCheckpoint: (taskId: string, name?: string, checkpointType = 'auto'): Promise<AxiosResponse<{ success: boolean; checkpoint_id: string; checkpoint?: any }>> => {
      return apiClient.post(`/ppt/checkpoints/${taskId}`, null, { params: { name, checkpoint_type: checkpointType } })
    },

    getCheckpoints: (taskId: string, limit = 20): Promise<AxiosResponse<{ success: boolean; checkpoints: Array<any> }>> => {
      return apiClient.get(`/ppt/checkpoints/${taskId}`, { params: { limit } })
    },

    restoreCheckpoint: (taskId: string, checkpointId: string): Promise<AxiosResponse<{ success: boolean; message?: string }>> => {
      return apiClient.post(`/ppt/checkpoints/${taskId}/${checkpointId}/restore`)
    },

    // 协作编辑锁
    acquireCollaborativeLock: (taskId: string, userId: string, slideIndex?: number): Promise<AxiosResponse<{ success: boolean; locked?: string; locked_by?: string }>> => {
      return apiClient.post(`/ppt/collaborative-lock/${taskId}`, null, { params: { user_id: userId, slide_index: slideIndex } })
    },

    releaseCollaborativeLock: (taskId: string, userId: string, slideIndex?: number): Promise<AxiosResponse<{ success: boolean; released?: string }>> => {
      return apiClient.delete(`/ppt/collaborative-lock/${taskId}`, { params: { user_id: userId, slide_index: slideIndex } })
    },

    getCollaborativeLocks: (taskId: string): Promise<AxiosResponse<{ success: boolean; locks: Record<string, any> }>> => {
      return apiClient.get(`/ppt/collaborative-locks/${taskId}`)
    },

    branchVersion: (taskId: string, versionId: string, name?: string): Promise<AxiosResponse<{ success: boolean; version_id: string; branch_id: string }>> => {
      return apiClient.post(`/ppt/versions/${taskId}/${versionId}/branch`, null, { params: { name } })
    },

    mergeVersions: (taskId: string, sourceVersionId: string, targetVersionId?: string, strategy = 'branch_wins'): Promise<AxiosResponse<{ success: boolean; version_id: string; merged_from: string; merged_to: string; strategy: string }>> => {
      return apiClient.post(`/ppt/versions/${taskId}/merge`, {
        source_version_id: sourceVersionId,
        target_version_id: targetVersionId,
        strategy,
      })
    },

    // ========== A/B Testing ==========
    createABTest: (taskId: string, slideIndex: number, variantCount = 2): Promise<AxiosResponse<{ success: boolean; test_id: string; variants: any[] }>> => {
      return apiClient.post(`/ppt/ab_test/${taskId}`, null, { params: { slide_index: slideIndex, variant_count: variantCount } })
    },

    listABTests: (taskId: string): Promise<AxiosResponse<{ success: boolean; tests: any[] }>> => {
      return apiClient.get(`/ppt/ab_test/${taskId}`)
    },

    getABTest: (taskId: string, testId: string): Promise<AxiosResponse<{ success: boolean; test: any }>> => {
      return apiClient.get(`/ppt/ab_test/${taskId}/${testId}`)
    },

    trackABView: (taskId: string, testId: string, variantId: string, timeSpentMs = 0): Promise<AxiosResponse<{ success: boolean }>> => {
      return apiClient.post(`/ppt/ab_test/${taskId}/${testId}/view`, null, { params: { variant_id: variantId, time_spent_ms: timeSpentMs } })
    },

    trackABClick: (taskId: string, testId: string, variantId: string): Promise<AxiosResponse<{ success: boolean }>> => {
      return apiClient.post(`/ppt/ab_test/${taskId}/${testId}/click`, null, { params: { variant_id: variantId } })
    },

    selectABWinner: (taskId: string, testId: string, variantId: string): Promise<AxiosResponse<{ success: boolean; winner: string }>> => {
      return apiClient.post(`/ppt/ab_test/${taskId}/${testId}/select`, null, { params: { variant_id: variantId } })
    },

    deleteABTest: (taskId: string, testId: string): Promise<AxiosResponse<{ success: boolean }>> => {
      return apiClient.delete(`/ppt/ab_test/${taskId}/${testId}`)
    },

    // ========== Slide Version History ==========
    getSlideHistory: (taskId: string, slideIndex: number): Promise<AxiosResponse<{ success: boolean; history: any[] }>> => {
      return apiClient.get(`/ppt/slide_history/${taskId}/${slideIndex}`)
    },

    // ========== Suggest Improvements ==========
    suggestImprovements: (taskId: string): Promise<AxiosResponse<{ success: boolean; suggestions: any[]; total_slides: number; suggestion_count: number }>> => {
      return apiClient.get(`/ppt/suggest_improve/${taskId}`)
    },

    autoSave: (taskId: string, state: any): Promise<AxiosResponse<{ success: boolean; saved_at: string }>> => {
      return apiClient.post(`/ppt/autosave/${taskId}`, state)
    },

    getAutoSave: (taskId: string): Promise<AxiosResponse<{ success: boolean; state?: any; saved_at?: string; message?: string }>> => {
      return apiClient.get(`/ppt/autosave/${taskId}`)
    },

    // ========== Localize / Translate Presentation ==========
    localize: (taskId: string, params: {
      target_locale: string;
      source_locale?: string;
      translate_content?: boolean;
      apply_rtl?: boolean;
    }): Promise<AxiosResponse<{
      success: boolean;
      task_id: string;
      new_task_id?: string;
      target_locale: string;
      source_locale: string;
      slides_localized: number;
      message?: string;
    }>> => {
      return apiClient.post(`/ppt/localize/${taskId}`, null, { params })
    },

    detectContentLanguage: (taskId: string): Promise<AxiosResponse<{
      success: boolean;
      detected_locale: string;
      confidence: number;
      text_sample: string;
    }>> => {
      return apiClient.get(`/ppt/detect_language/${taskId}`)
    },

    /** R131: 列出PPT的所有语言版本 */
    languageVersions: (taskId: string): Promise<AxiosResponse<{
      success: boolean;
      root_task_id: string;
      versions: Array<{
        task_id: string;
        locale: string;
        locale_name: string;
        is_original: boolean;
        is_rtl: boolean;
        created_at: string;
      }>;
      count: number;
    }>> => {
      return apiClient.get(`/ppt/language_versions/${taskId}`)
    },

    // ========== 备份管理 R125 ==========
    /** 列出备份历史 */
    listBackups: (taskId?: string): Promise<AxiosResponse<{ success: boolean; backups: Array<{ backup_id: string; task_id: string; name: string; backup_type: string; created_at: string; size_str: string; slide_count: number }>; count: number }>> => {
      return apiClient.get('/ppt/backups', { params: taskId ? { task_id: taskId } : {} })
    },

    /** 创建备份 */
    createBackup: (taskId: string, name?: string, backupType = 'manual'): Promise<AxiosResponse<{ success: boolean; backup_id: string; created_at: string; name: string; size_str: string; slide_count: number }>> => {
      return apiClient.post(`/ppt/backups/${taskId}`, null, { params: name ? { name } : {}, data: { backup_type: backupType } })
    },

    /** 获取备份详情 */
    getBackupDetail: (taskId: string, backupId: string): Promise<AxiosResponse<{ success: boolean; backup: any }>> => {
      return apiClient.get(`/ppt/backups/${taskId}/${backupId}`)
    },

    /** 获取备份中的幻灯片列表（用于选择性恢复） */
    getBackupSlides: (taskId: string, backupId: string): Promise<AxiosResponse<{ success: boolean; slides: Array<{ slide_num: number; title: string; content: string; has_chart: boolean; chart_type?: string; svg_path: string }> }>> => {
      return apiClient.get(`/ppt/backups/${taskId}/${backupId}/slides`)
    },

    /** 从备份恢复 */
    restoreBackup: (taskId: string, backupId: string, restoreType: 'full' | 'slides' | 'config' = 'full', selectedSlideNums?: number[]): Promise<AxiosResponse<{ success: boolean; message: string; restore_type: string; selected_slides?: number[]; pptx_path?: string; data?: any; config?: any }>> => {
      return apiClient.post(`/ppt/backups/${taskId}/${backupId}/restore`, {
        restore_type: restoreType,
        selected_slide_nums: selectedSlideNums || []
      })
    },

    /** 删除备份 */
    deleteBackup: (taskId: string, backupId: string): Promise<AxiosResponse<{ success: boolean; backup_id: string }>> => {
      return apiClient.delete(`/ppt/backups/${taskId}/${backupId}`)
    },

    /** 下载备份文件 */
    downloadBackup: (taskId: string, backupId: string): Promise<Blob> => {
      return apiClient.get(`/ppt/backups/${taskId}/${backupId}/download`, { responseType: 'blob' })
    },

    /** 导入备份文件 */
    importBackup: (file: File): Promise<AxiosResponse<{ success: boolean; backup_id: string; task_id: string }>> => {
      const formData = new FormData()
      formData.append('file', file)
      return apiClient.post('/ppt/backups/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
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
    },

    // R48: Template Marketplace APIs
    publishTemplate: (templateId: string, visibility = 'public'): Promise<AxiosResponse<{ success: boolean; template_id: string; visibility: string }>> => {
      return apiClient.post(`/templates/${templateId}/publish`, null, { params: { visibility } })
    },

    // Reviews & Ratings
    getReviews: (templateId: string): Promise<AxiosResponse<{ success: boolean; reviews: any[]; count: number; average_rating: number }>> => {
      return apiClient.get(`/templates/${templateId}/reviews`)
    },
    addReview: (templateId: string, data: { user_id?: string; user_name?: string; rating: number; content: string }): Promise<AxiosResponse<{ success: boolean; review: any; count: number; average_rating: number }>> => {
      return apiClient.post(`/templates/${templateId}/reviews`, data)
    },
    deleteReview: (templateId: string, reviewId: string, userId = 'anonymous'): Promise<AxiosResponse<{ success: boolean }>> => {
      return apiClient.delete(`/templates/${templateId}/reviews/${reviewId}`, { params: { user_id: userId } })
    },

    // Featured Templates
    getFeatured: (limit = 10): Promise<AxiosResponse<{ success: boolean; templates: any[] }>> => {
      return apiClient.get('/templates/featured', { params: { limit } })
    },
    addFeatured: (templateId: string): Promise<AxiosResponse<{ success: boolean }>> => {
      return apiClient.post(`/templates/featured/${templateId}`)
    },

    // Template of the day
    getTemplateOfTheDay: (): Promise<AxiosResponse<{ success: boolean; template: any; date: string; reason: string }>> => {
      return apiClient.get('/templates/daily')
    },
    getDailyHistory: (limit = 7): Promise<AxiosResponse<{ success: boolean; history: any[] }>> => {
      return apiClient.get('/templates/daily/history', { params: { limit } })
    },

    // Subscriptions
    subscribe: (category: string, userId = 'anonymous'): Promise<AxiosResponse<{ success: boolean }>> => {
      return apiClient.post(`/templates/subscribe/${category}`, null, { params: { user_id: userId } })
    },
    unsubscribe: (category: string, userId = 'anonymous'): Promise<AxiosResponse<{ success: boolean }>> => {
      return apiClient.delete(`/templates/subscribe/${category}`, { params: { user_id: userId } })
    },
    getSubscriptions: (userId = 'anonymous'): Promise<AxiosResponse<{ success: boolean; categories: string[] }>> => {
      return apiClient.get('/templates/subscriptions', { params: { user_id: userId } })
    },

    // Bundles
    getBundles: (): Promise<AxiosResponse<{ success: boolean; bundles: any[] }>> => {
      return apiClient.get('/templates/bundles')
    },
    getBundle: (bundleId: string): Promise<AxiosResponse<{ success: boolean; bundle: any }>> => {
      return apiClient.get(`/templates/bundles/${bundleId}`)
    },
    purchaseBundle: (bundleId: string, userId = 'anonymous'): Promise<AxiosResponse<{ success: boolean; purchase: any; bundle: any }>> => {
      return apiClient.post(`/templates/bundles/${bundleId}/purchase`, null, { params: { user_id: userId } })
    },

    // R55: Layout Suggestions
    suggestLayouts: (params: { title?: string; content?: string }): Promise<AxiosResponse<{
      success: boolean
      content_type: string
      content_type_display: string
      density: number
      element_count: number
      has_timeline: boolean
      has_comparison: boolean
      keywords: string[]
      primary_layout: string
      suggestions: Array<{ type: string; name: string; description: string; confidence: number; is_primary: boolean }>
    }>> => {
      return apiClient.get('/ppt/layouts/suggest', { params })
    },

    getAllLayouts: (): Promise<AxiosResponse<{
      success: boolean
      layouts: Array<{ type: string; name: string; description: string; typical_use: string[]; elements: string[] }>
    }>> => {
      return apiClient.get('/ppt/layouts/all')
    },

    // R55: Template Learning / Layout Preferences
    saveLayoutPreference: (params: {
      user_id?: string; template_id?: string; layout_type?: string
      content_type?: string; scene?: string; style?: string; action?: string
    }): Promise<AxiosResponse<{ success: boolean; action: string }>> => {
      return apiClient.post('/templates/preferences', null, { params })
    },

    getLayoutPreferences: (params: {
      user_id?: string; content_type?: string; limit?: number
    }): Promise<AxiosResponse<{ success: boolean; preferences: any[]; user_id: string }>> => {
      return apiClient.get('/templates/preferences', { params })
    },

    // R111: Advanced Search - Multi-filter + AI semantic + highlighting
    advancedSearch: (params: {
      query?: string
      category?: string
      style?: string
      author?: string
      tags?: string[]
      date_from?: string
      date_to?: string
      template_type?: 'all' | 'ugc' | 'system'
      sort_by?: 'relevance' | 'newest' | 'popularity' | 'name'
      page?: number
      limit?: number
      use_semantic?: boolean
    }): Promise<AxiosResponse<{
      success: boolean
      results: any[]
      total: number
      page: number
      total_pages: number
      query: string
      applied_filters: Record<string, any>
      highlighted_fields: Record<string, any>
    }>> => {
      return apiClient.post('/templates/advanced-search', params)
    },

    // R111: AI Semantic Search
    semanticSearch: (params: {
      query: string
      limit?: number
      category?: string
      style?: string
    }): Promise<AxiosResponse<{
      success: boolean
      query: string
      total: number
      results: any[]
      search_type: string
    }>> => {
      return apiClient.post('/templates/semantic-search', params)
    },

    // R111: Search Analytics Dashboard
    getSearchAnalyticsDashboard: (days = 30): Promise<AxiosResponse<{
      success: boolean
      period_days: number
      trending_queries: Array<{ query: string; count: number }>
      search_volume_over_time: Array<{ date: string; count: number }>
      no_result_queries: Array<{ query: string; count: number }>
      top_clicked_templates: Array<{ id: string; name: string; category: string; style: string; thumbnail: string; click_count: number }>
      popular_filter_combinations: Array<{ filters: string; count: number }>
      total_searches: number
      unique_queries: number
    }>> => {
      return apiClient.get('/templates/search-analytics/dashboard', { params: { days } })
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
    },

    expandShorten: (text: string, ratio: number = 1.5): Promise<AxiosResponse<{ success: boolean; result: string; ratio: number }>> => {
      return apiClient.post('/ai/expand-shorten', { text, ratio })
    },

    grammarCheck: (text: string): Promise<AxiosResponse<{ success: boolean; check: { corrected: string; errors: any[]; has_errors: boolean } }>> => {
      return apiClient.post('/ai/grammar-check', { text })
    },

    // R109: AI Content Enhancement
    smartFootnotes: (text: string, topic?: string, count?: number): Promise<AxiosResponse<{ success: boolean; footnotes: { footnotes: Array<{ source: string; source_type: string; description: string; in_text_mark: string }>; formatted_footnotes: string } }>> => {
      return apiClient.post('/ai/smart-footnotes', { text, topic, count })
    },

    toneAdjust: (text: string, tone: string): Promise<AxiosResponse<{ success: boolean; adjusted: { adjusted: string; tone: string; tone_description: string; changes_summary: string } }>> => {
      return apiClient.post('/ai/tone-adjust', { text, tone })
    },

    clicheDetect: (text: string): Promise<AxiosResponse<{ success: boolean; detection: { detected: Array<{ phrase: string; reason: string; alternatives: Array<{ text: string; style: string }> }>; has_cliches: boolean; cleaned_text: string; summary: string } }>> => {
      return apiClient.post('/ai/cliche-detect', { text })
    },

    // R133: AI Content Templates
    listContentTemplates: (): Promise<AxiosResponse<{ success: boolean; templates: Array<{ type: string; description: string }> }>> => {
      return apiClient.get('/ai/content-templates')
    },

    generateContentTemplate: (params: {
      template_type: string
      topic?: string
      context?: string
      slide_title?: string
      count?: number
    }): Promise<AxiosResponse<{ success: boolean; content: any; template_type: string }>> => {
      return apiClient.post('/ai/content-template', params)
    }
  },

  // R40: 批量操作
  batch: {
    // 批量导出为ZIP
    exportPpts: (taskIds: string[], format: string = 'pptx'): Promise<Blob> => {
      return apiClient.post('/ppt/batch/export', { task_ids: taskIds, format }, {
        responseType: 'blob'
      })
    },

    // 批量删除任务
    deleteTasks: (taskIds: string[]): Promise<AxiosResponse<{ success: boolean; deleted: string[]; errors: any[]; summary: string }>> => {
      return apiClient.post('/ppt/batch/delete', { task_ids: taskIds })
    },

    // 批量应用主题
    applyTheme: (params: {
      task_ids: string[]
      theme_primary: string
      theme_secondary: string
      theme_accent: string
    }): Promise<AxiosResponse<{ success: boolean; updated: string[]; errors: any[]; summary: string }>> => {
      return apiClient.post('/ppt/batch/apply-theme', params)
    },

    // 并行生成多个PPT
    generateParallel: (requests: any[]): Promise<AxiosResponse<{ success: boolean; task_ids: string[]; count: number; message: string }>> => {
      return apiClient.post('/ppt/generate/parallel', { outlines: requests })
    },

    // 批量重命名模板
    renameTemplates: (renames: Array<{ template_id: string; new_name: string }>): Promise<AxiosResponse<{ success: boolean; renamed: any[]; errors: any[]; summary: string }>> => {
      return apiClient.post('/templates/batch/rename', { renames })
    }
  },

  // R43: Advanced AI Features
  advancedAI: {
    // 1. 智能复制
    smartCopy: (params: {
      source_slides: Array<{ title: string; content: string; bullet_points?: string[] }>
      target_theme: string
      target_style?: string
      target_page_count?: number
    }): Promise<AxiosResponse<{ success: boolean; data?: any; error?: string }>> => {
      return apiClient.post('/ppt/ai/smart-copy', {
        source_slides: params.source_slides,
        target_theme: params.target_theme,
        target_style: params.target_style || 'professional',
        target_page_count: params.target_page_count || 5
      })
    },

    // 2. AI内容扩展
    extendContent: (params: {
      outline: Array<{ title: string; content?: string }>
      topic: string
      audience?: string
      style?: string
    }): Promise<AxiosResponse<{ success: boolean; data?: any; error?: string }>> => {
      return apiClient.post('/ppt/ai/extend-content', {
        outline: params.outline,
        topic: params.topic,
        audience: params.audience || '商务人士',
        style: params.style || 'professional'
      })
    },

    // 3. 自动生成演讲者备注
    generateSpeakerNotes: (params: {
      slides: Array<{ title: string; content: string; bullet_points?: string[] }>
      total_duration?: number
    }): Promise<AxiosResponse<{ success: boolean; data?: any; error?: string }>> => {
      return apiClient.post('/ppt/ai/speaker-notes', {
        slides: params.slides,
        total_duration: params.total_duration || 10
      })
    },

    // 4. 设计一致性检查
    checkDesignConsistency: (params: {
      slides: Array<{ title: string; content: string; design_info?: any }>
      style_theme?: string
      brand_colors?: string[]
    }): Promise<AxiosResponse<{ success: boolean; data?: any; error?: string }>> => {
      return apiClient.post('/ppt/ai/design-check', {
        slides: params.slides,
        style_theme: params.style_theme || 'business',
        brand_colors: params.brand_colors
      })
    },

    // 5. 一键专业优化
    professionalPolish: (params: {
      slides: Array<{ title: string; content: string; bullet_points?: string[] }>
      target_style?: string
      use_case?: string
    }): Promise<AxiosResponse<{ success: boolean; data?: any; error?: string }>> => {
      return apiClient.post('/ppt/ai/polish', {
        slides: params.slides,
        target_style: params.target_style || 'business',
        use_case: params.use_case || '商务演示'
      })
    }
  },

  // R46: 品牌中心
  brand: {
    // 获取品牌配置
    getBrand: (userId: string = 'default'): Promise<AxiosResponse<{ success: boolean; brand: any }>> => {
      return apiClient.get(`/brand/get/${userId}`)
    },

    // 保存品牌配置
    saveBrand: (data: {
      user_id?: string
      brand_name: string
      primary_color: string
      secondary_color: string
      accent_color: string
      fonts: string[]
      logo_url?: string
      slogan?: string
      logo_data?: string
      logo_position?: string
      powered_by_toggle?: boolean
      footer_text?: string
      white_label_mode?: boolean
      auto_color_detection?: boolean
    }): Promise<AxiosResponse<{ success: boolean; message: string }>> => {
      return apiClient.post('/brand/save', data)
    },

    // 上传 LOGO
    uploadLogo: (userId: string, file: File): Promise<AxiosResponse<{ success: boolean; logo_data: string; message: string }>> => {
      const formData = new FormData()
      formData.append('file', file)
      return apiClient.post(`/brand/upload-logo?user_id=${userId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    },

    // 从 LOGO 检测颜色（基础版）
    detectColors: (userId: string, file: File): Promise<AxiosResponse<{
      success: boolean
      colors: string[]
      primary_color: string
      secondary_color: string
      accent_color: string
      message: string
    }>> => {
      const formData = new FormData()
      formData.append('file', file)
      return apiClient.post(`/brand/detect-colors?user_id=${userId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    },

    // R64: AI 智能提取图片主题色
    aiExtractColors: (file: File): Promise<AxiosResponse<{
      success: boolean
      colors: string[]
      primary_color: string
      secondary_color: string
      accent_color: string
      color_names: string[]
      theme_description: string
      message: string
    }>> => {
      const formData = new FormData()
      formData.append('file', file)
      return apiClient.post('/brand/ai-extract-colors', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000
      })
    },

    // 删除品牌配置
    deleteBrand: (userId: string = 'default'): Promise<AxiosResponse<{ success: boolean; message: string }>> => {
      return apiClient.delete(`/brand/delete/${userId}`)
    }
  },

    // R127: AI Presentation Coach 2.0
    coachSpeakingPace: (taskId: string, slides: any[], totalMinutes: number, actualWords?: number) => {
      return apiClient.post('/ppt/coach/speaking-pace', {
        task_id: taskId,
        slides,
        total_minutes: totalMinutes,
        actual_words: actualWords
      })
    },
    coachContentDimensions: (taskId: string, slides: any[]) => {
      return apiClient.post('/ppt/coach/content-dimensions', {
        task_id: taskId,
        slides
      })
    },
    coachVisualDesign: (taskId: string, slides: any[]) => {
      return apiClient.post('/ppt/coach/visual-design', {
        task_id: taskId,
        slides
      })
    },
    coachEngagement: (taskId: string, slides: any[], audienceProfile: string) => {
      return apiClient.post('/ppt/coach/engagement', {
        task_id: taskId,
        slides,
        audience_profile: audienceProfile
      })
    },
    coachPersonalized: (taskId: string, slides: any[], userId: string) => {
      return apiClient.post('/ppt/coach/personalized', {
        task_id: taskId,
        slides,
        user_id: userId
      })
    },


  // R58: Voice / TTS
  voice: {
    // List available voices
    listVoices: (): Promise<AxiosResponse<{
      success: boolean
      data: Array<{ id: string; lang: string; name: string; gender: string }>
    }>> => {
      return apiClient.get('/voice/voices')
    },

    // List supported translation languages
    listLanguages: (): Promise<AxiosResponse<{
      success: boolean
      data: Array<{ code: string; name: string }>
    }>> => {
      return apiClient.get('/voice/languages')
    },

    // Generate TTS audio
    generateTTS: (params: {
      text: string
      voice?: string
      rate?: string
      volume?: string
      pitch?: string
    }): Promise<AxiosResponse<{
      success: boolean
      data: {
        audio_url: string
        filename: string
        duration_sec: number
        voice: string
        voice_name: string
        text_length: number
      }
    }>> => {
      return apiClient.post('/voice/tts', params)
    },

    // Translate text
    translateText: (params: {
      text: string
      source_lang: string
      target_lang: string
    }): Promise<AxiosResponse<{
      success: boolean
      data: {
        original: string
        translated: string
        source_lang: string
        target_lang: string
        source_lang_name: string
        target_lang_name: string
      }
    }>> => {
      return apiClient.post('/voice/translate', params)
    },

    // Batch TTS for slides
    batchTTS: (params: {
      slides: Array<{ index: number; title?: string; content?: string; narration?: string }>
      voice?: string
      rate?: string
    }): Promise<AxiosResponse<{
      success: boolean
      data: {
        voice: string
        voice_name: string
        results: Array<{
          index: number
          success: boolean
          audio_url?: string
          filename?: string
          text_length?: number
          error?: string
        }>
      }
    }>> => {
      return apiClient.post('/voice/tts-batch', params)
    }
  },

  // --- Collaboration: Share via Email ---------------------------------------

  shareViaEmail: (params: {
    to_email: string
    from_name?: string
    ppt_title?: string
    share_url?: string
    message?: string
  }): Promise<AxiosResponse<{
    success: boolean
    message?: string
    fallback?: string
    mailto_url?: string
  }>> => {
    return apiClient.post('/collaboration/share/email', params)
  },

  // --- Collaboration: Suggest Edits ------------------------------------------

  getSuggestEdits: (taskId: string, slideNum?: number): Promise<AxiosResponse<{
    success: boolean
    edits: Array<{
      id: string
      slide_num: number
      author_id: string
      author_name: string
      edit_type: string
      original_content: any
      suggested_content: any
      reason: string
      status: 'pending' | 'accepted' | 'rejected'
      created_at: string
    }>
  }>> => {
    const params = slideNum ? { slide_num: slideNum } : {}
    return apiClient.get(`/collaboration/suggest-edits/${taskId}`, { params })
  },

  addSuggestEdit: (taskId: string, params: {
    slide_num: number
    author_id: string
    author_name: string
    author_avatar?: string
    edit_type: 'text' | 'image' | 'layout' | 'style'
    original_content: any
    suggested_content: any
    reason: string
  }): Promise<AxiosResponse<{ success: boolean; edit: any }>> => {
    return apiClient.post(`/collaboration/suggest-edits/${taskId}`, params)
  },

  resolveSuggestEdit: (taskId: string, editId: string, params: {
    status: 'pending' | 'accepted' | 'rejected'
    resolved_by: string
  }): Promise<AxiosResponse<{ success: boolean }>> => {
    return apiClient.put(`/collaboration/suggest-edits/${taskId}/${editId}`, params)
  },

  // --- Collaboration: Activity Feed -------------------------------------------

  getActivityFeed: (taskId: string, params?: {
    activity_type?: string
    user_id?: string
    limit?: number
  }): Promise<AxiosResponse<{
    success: boolean
    activities: Array<{
      id: string
      activity_type: string
      user_id: string
      user_name: string
      target: string
      details: string
      slide_num?: number
      timestamp: number
      read: boolean
    }>
  }>> => {
    return apiClient.get(`/collaboration/activity-feed/${taskId}`, { params })
  },

  logActivity: (taskId: string, params: {
    activity_type: string
    user_id: string
    user_name: string
    user_avatar?: string
    target?: string
    details?: string
    slide_num?: number
  }): Promise<AxiosResponse<{ success: boolean; activity: any }>> => {
    return apiClient.post(`/collaboration/activity-feed/${taskId}`, params)
  },

  markActivityRead: (taskId: string, activityId: string): Promise<AxiosResponse<{ success: boolean }>> => {
    return apiClient.post(`/collaboration/activity-feed/${taskId}/mark-read/${activityId}`)
  },

  markAllActivitiesRead: (taskId: string): Promise<AxiosResponse<{ success: boolean; count: number }>> => {
    return apiClient.post(`/collaboration/activity-feed/${taskId}/mark-all-read`)
  },

  // --- Comment Email Notifications (R124) ----------------------------------------

  /** 注册邮箱用于接收评论 @mention 邮件通知 */
  registerCommentEmail: (params: {
    email: string
    name?: string
    enabled?: boolean
  }): Promise<AxiosResponse<{
    success: boolean
    data: { registered: boolean; email: string; name: string; enabled: boolean }
  }>> => {
    return apiClient.put('/notifications/comment-email', params)
  },

  /** 获取评论邮件通知状态 */
  getCommentEmailStatus: (): Promise<AxiosResponse<{
    success: boolean
    data: { registered: boolean; email: string; enabled: boolean; name?: string }
  }>> => {
    return apiClient.get('/notifications/comment-email')
  },

  /** 更新评论邮件通知设置 */
  updateCommentEmail: (params: {
    email?: string
    name?: string
    enabled?: boolean
  }): Promise<AxiosResponse<{
    success: boolean
    data: { registered: boolean; email: string; name: string; enabled: boolean }
  }>> => {
    return apiClient.patch('/notifications/comment-email')
  },

  /** 取消评论邮件通知 */
  deleteCommentEmail: (): Promise<AxiosResponse<{
    success: boolean
    data: { deleted: boolean }
  }>> => {
    return apiClient.delete('/notifications/comment-email')
  },

  // --- Data Sources (R113) -------------------------------------------
  listDataSources: (): Promise<AxiosResponse<{
    success: boolean
    data_sources: Array<{
      id: string
      name: string
      source_type: string
      status: string
      auto_update: boolean
      last_synced_at: string | null
      sync_interval_minutes: number
      created_at: string
      updated_at: string
      total_rows: number
      total_columns: number
      headers: string[]
      table_type: string
      threshold_alerts?: any[]
    }>
  }>> => {
    return apiClient.get('/data-sources')
  },

  getDataSource: (sourceId: string): Promise<AxiosResponse<{
    success: boolean
    data_source: any
  }>> => {
    return apiClient.get(`/data-sources/${sourceId}`)
  },

  updateDataSource: (sourceId: string, params: {
    name?: string
    auto_update?: boolean
    sync_interval_minutes?: number
    status?: string
  }): Promise<AxiosResponse<{ success: boolean; data_source: any }>> => {
    return apiClient.put(`/data-sources/${sourceId}`, params)
  },

  deleteDataSource: (sourceId: string): Promise<AxiosResponse<{ success: boolean; message: string }>> => {
    return apiClient.delete(`/data-sources/${sourceId}`)
  },

  importExcel: (params: {
    file: File
    sheet_index?: number
    has_header?: boolean
    max_rows?: number
  }): Promise<AxiosResponse<{
    success: boolean
    source_id: string
    source_name: string
    sheet_names: string[]
    current_sheet: string
    total_rows: number
    total_columns: number
    headers: string[]
    column_info: Array<{ index: number; name: string; type: string; sample: any }>
    table_type: string
    table_preview: any[][]
    outline: any
  }>> => {
    const formData = new FormData()
    formData.append('file', params.file)
    if (params.sheet_index !== undefined) formData.append('sheet_index', String(params.sheet_index))
    if (params.has_header !== undefined) formData.append('has_header', String(params.has_header))
    if (params.max_rows !== undefined) formData.append('max_rows', String(params.max_rows))
    return apiClient.post('/data-sources/import/excel', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  importCSV: (params: {
    file: File
    has_header?: boolean
    max_rows?: number
    delimiter?: string
  }): Promise<AxiosResponse<{
    success: boolean
    source_id: string
    source_name: string
    total_rows: number
    total_columns: number
    headers: string[]
    column_info: any[]
    table_type: string
    table_preview: any[][]
    outline: any
  }>> => {
    const formData = new FormData()
    formData.append('file', params.file)
    if (params.has_header !== undefined) formData.append('has_header', String(params.has_header))
    if (params.max_rows !== undefined) formData.append('max_rows', String(params.max_rows))
    if (params.delimiter) formData.append('delimiter', params.delimiter)
    return apiClient.post('/data-sources/import/csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  importGoogleSheets: (params: {
    spreadsheet_url: string
    sheet_name?: string
    access_token: string
    has_header?: boolean
    max_rows?: number
  }): Promise<AxiosResponse<{
    success: boolean
    source_id: string
    source_name: string
    spreadsheet_title: string
    total_rows: number
    total_columns: number
    headers: string[]
    column_info: any[]
    table_type: string
    outline: any
  }>> => {
    return apiClient.post('/data-sources/import/google-sheets', params)
  },

  syncDataSource: (sourceId: string, accessToken: string): Promise<AxiosResponse<{
    success: boolean
    data_source_id: string
    synced_rows: number
    synced_at: string
    message: string
    outline?: any
  }>> => {
    return apiClient.post(`/data-sources/${sourceId}/sync`, { access_token: accessToken })
  },

  getDataSourcePreview: (sourceId: string): Promise<AxiosResponse<{
    success: boolean
    source_id: string
    headers: string[]
    column_info: any[]
    total_rows: number
    total_columns: number
    table_preview: any[][]
    table_type: string
  }>> => {
    return apiClient.get(`/data-sources/${sourceId}/preview`)
  },

  // Threshold Alerts (R113)
  setThresholdAlerts: (sourceId: string, alerts: Array<{
    column: string
    condition: string
    value: number
    label: string
    enabled?: boolean
  }>): Promise<AxiosResponse<{
    success: boolean
    source_id: string
    alerts: any[]
    triggered: any[]
  }>> => {
    return apiClient.post(`/data-sources/${sourceId}/threshold-alerts`, { alerts })
  },

  getThresholdAlerts: (sourceId: string): Promise<AxiosResponse<{
    success: boolean
    source_id: string
    alerts: any[]
    triggered: any[]
  }>> => {
    return apiClient.get(`/data-sources/${sourceId}/threshold-alerts`)
  },

  // Data Analysis (R113)
  analyzeData: (sourceId: string, params: {
    compare_column: string
    group_by_column?: string
    periods?: string[]
  }): Promise<AxiosResponse<{
    success: boolean
    source_id: string
    compare_column: string
    total_rows: number
    stats: { sum: number; avg: number; max: number; min: number; max_label: string; min_label: string }
    trend: { direction: string; change_pct: number; first_half_avg: number; second_half_avg: number }
    group_stats?: any
    period_comparison?: any
    chart_data: { labels: string[]; values: number[] }
  }>> => {
    return apiClient.post(`/data-sources/${sourceId}/analyze`, params)
  },

  // Forecast (R113)
  getForecast: (sourceId: string, params: {
    value_column: string
    label_column?: string
    forecast_periods?: number
    chart_type?: string
  }): Promise<AxiosResponse<{
    success: boolean
    source_id: string
    value_column: string
    regression: { slope: number; intercept: number; r_squared: number }
    trend_direction: string
    trendline: number[]
    forecast: { periods: number; labels: string[]; values: number[] }
    chart_data: {
      type: string
      labels: string[]
      actual: (number | null)[]
      forecast: (number | null)[]
      trendline: number[]
    }
  }>> => {
    return apiClient.post(`/data-sources/${sourceId}/forecast`, params)
  },

  // Generate PPT from Data Source (R113)
  generateFromDataSource: (params: {
    source_id: string
    title?: string
    include_charts?: boolean
    include_threshold_alerts?: boolean
    include_forecast?: boolean
    forecast_periods?: number
    slide_count?: number
  }): Promise<AxiosResponse<{
    success: boolean
    source_id: string
    outline: { title: string; slides: any[] }
  }>> => {
    return apiClient.post('/data-sources/generate-ppt', params)
  },

  // === Presentation Security (R122) ===
  security: {
    getConfig(taskId: string) {
      return apiClient.get(`/security/presentation/${taskId}/security`)
    },
    setPassword(taskId: string, password: string) {
      return apiClient.post(`/security/presentation/${taskId}/password`, { password })
    },
    removePassword(taskId: string) {
      return apiClient.delete(`/security/presentation/${taskId}/password`)
    },
    getPasswordStatus(taskId: string) {
      return apiClient.get(`/security/presentation/${taskId}/password`)
    },
    verifyPassword(taskId: string, password: string) {
      return apiClient.post(`/security/presentation/${taskId}/password/verify`, { password })
    },
    setBiometric(taskId: string, required: boolean) {
      return apiClient.post(`/security/presentation/${taskId}/biometric`, { biometric_required: required })
    },
    getBiometricStatus(taskId: string) {
      return apiClient.get(`/security/presentation/${taskId}/biometric`)
    },
    verifyBiometric(taskId: string, assertion: string) {
      return apiClient.post(`/security/presentation/${taskId}/biometric/verify`, { task_id: taskId, assertion })
    },
    setIPAllowlist(taskId: string, allowed_ips: string[]) {
      return apiClient.post(`/security/presentation/${taskId}/ip-allowlist`, { allowed_ips })
    },
    getIPAllowlist(taskId: string) {
      return apiClient.get(`/security/presentation/${taskId}/ip-allowlist`)
    },
    setWatermark(taskId: string, opts: {
      enabled: boolean; text: string; opacity: number; angle: number; font_size: number; color: string
    }) {
      return apiClient.post(`/security/presentation/${taskId}/watermark`, opts)
    },
    getWatermark(taskId: string) {
      return apiClient.get(`/security/presentation/${taskId}/watermark`)
    },
    getAccessLog(taskId: string, limit = 100, offset = 0) {
      return apiClient.get(`/security/presentation/${taskId}/access-log`, { params: { limit, offset } })
    },
    deleteSecurity(taskId: string) {
      return apiClient.delete(`/security/presentation/${taskId}/security`)
    },
  },
}

export default api
