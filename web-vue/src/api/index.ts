/**
 * RabAi Mind 前端 API 服务封装
 *
 * 提供统一的接口调用、错误处理、请求拦截等功能
 * 基于 Fetch API + TypeScript
 */

import type {
  GenerateRequest,
  GenerateResponse,
  TaskStatusResponse,
  HistoryItem,
  TemplateInfo,
  ApiError
} from '../types'

// API 基础路径 - 从环境变量读取
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// 请求超时时间 (毫秒)
const REQUEST_TIMEOUT = 30000

/**
 * 请求选项配置
 */
interface RequestOptions {
  /** 请求方法 */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  /** 请求头 */
  headers?: Record<string, string>
  /** 请求体 */
  body?: any
  /** 超时时间 (毫秒) */
  timeout?: number
}

/**
 * API 响应封装
 */
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: ApiError
}

/**
 * 内部工具函数 - 发送请求
 * @param endpoint - API 端点
 * @param options - 请求选项
 * @returns Promise - 响应数据
 */
async function fetchApi<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const {
    method = 'GET',
    headers = {},
    body,
    timeout = REQUEST_TIMEOUT
  } = options

  // 构建请求配置
  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    // credentials: 'include' // 携带 Cookie (如果需要)
  }

  // 添加请求体
  if (body && method !== 'GET') {
    config.body = JSON.stringify(body)
  }

  // 创建 AbortController 用于超时控制
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  config.signal = controller.signal

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config)
    clearTimeout(timeoutId)

    // 解析响应
    const data = await response.json()

    // 检查 HTTP 状态
    if (!response.ok) {
      throw {
        code: `HTTP_${response.status}`,
        message: data.message || '请求失败',
        details: data.details
      } as ApiError
    }

    return data as T
  } catch (error: any) {
    clearTimeout(timeoutId)

    // 处理不同类型的错误
    if (error.name === 'AbortError') {
      throw {
        code: 'TIMEOUT',
        message: '请求超时，请稍后重试'
      } as ApiError
    }

    if (error.code) {
      // 已经是 ApiError 格式
      throw error
    }

    // 网络错误
    throw {
      code: 'NETWORK_ERROR',
      message: '网络错误，请检查网络连接',
      details: error.message
    } as ApiError
  }
}

/**
 * PPT 生成服务
 * 负责提交生成任务、查询状态等
 */
export const pptApi = {
  /**
   * 提交 PPT 生成任务
   * @param request - 生成请求参数
   * @returns 生成任务响应
   */
  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    return fetchApi<GenerateResponse>('/api/v1/generate', {
      method: 'POST',
      body: request
    })
  },

  /**
   * 查询任务状态
   * @param taskId - 任务 ID
   * @returns 任务状态响应
   */
  async getTaskStatus(taskId: string): Promise<TaskStatusResponse> {
    return fetchApi<TaskStatusResponse>(`/api/v1/task/${taskId}`)
  },

  /**
   * 取消任务
   * @param taskId - 任务 ID
   * @returns 取消结果
   */
  async cancelTask(taskId: string): Promise<{ success: boolean; message: string }> {
    return fetchApi<{ success: boolean; message: string }>(`/api/v1/task/${taskId}/cancel`, {
      method: 'POST'
    })
  },

  /**
   * 下载 PPT 文件
   * @param taskId - 任务 ID
   * @returns Blob 文件数据
   */
  async downloadPpt(taskId: string): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/api/v1/download/${taskId}`)

    if (!response.ok) {
      throw {
        code: 'DOWNLOAD_ERROR',
        message: '文件下载失败'
      } as ApiError
    }

    return response.blob()
  },

  /**
   * 预览 PPT (获取预览图)
   * @param taskId - 任务 ID
   * @param slideIndex - 幻灯片索引 (从 1 开始)
   * @returns 预览图 URL
   */
  async getPreview(taskId: string, slideIndex: number = 1): Promise<string> {
    const response = await fetchApi<{ url: string }>(
      `/api/v1/preview/${taskId}?slide=${slideIndex}`
    )
    return response.url
  }
}

/**
 * 用户历史服务
 * 负责获取用户生成历史记录
 */
export const historyApi = {
  /**
   * 获取生成历史列表
   * @param page - 页码
   * @param pageSize - 每页数量
   * @returns 历史记录列表
   */
  async getList(page: number = 1, pageSize: number = 20): Promise<{
    items: HistoryItem[]
    total: number
    page: number
    pageSize: number
  }> {
    return fetchApi<{
      items: HistoryItem[]
      total: number
      page: number
      pageSize: number
    }>(`/api/v1/history?page=${page}&page_size=${pageSize}`)
  },

  /**
   * 删除历史记录
   * @param id - 记录 ID
   * @returns 删除结果
   */
  async delete(id: string): Promise<{ success: boolean }> {
    return fetchApi<{ success: boolean }>(`/api/v1/history/${id}`, {
      method: 'DELETE'
    })
  }
}

/**
 * 模板服务
 * 负责获取模板列表和详情
 */
export const templateApi = {
  /**
   * 获取模板列表
   * @returns 模板列表
   */
  async getList(): Promise<TemplateInfo[]> {
    return fetchApi<TemplateInfo[]>('/api/v1/templates')
  },

  /**
   * 获取模板详情
   * @param templateId - 模板 ID
   * @returns 模板详情
   */
  async getDetail(templateId: string): Promise<TemplateInfo> {
    return fetchApi<TemplateInfo>(`/api/v1/templates/${templateId}`)
  }
}

/**
 * 工具函数 - 轮询任务状态
 * @param taskId - 任务 ID
 * @param onProgress - 进度回调
 * @param interval - 轮询间隔 (毫秒)
 * @param maxAttempts - 最大轮询次数
 * @returns 最终任务状态
 */
export async function pollTaskStatus(
  taskId: string,
  onProgress?: (progress: number, status: string) => void,
  interval: number = 2000,
  maxAttempts: number = 150
): Promise<TaskStatusResponse> {
  let attempts = 0

  while (attempts < maxAttempts) {
    const status = await pptApi.getTaskStatus(taskId)

    // 回调进度
    if (onProgress) {
      onProgress(status.progress, status.status)
    }

    // 检查是否完成
    if (status.status === 'completed') {
      return status
    }

    // 检查是否失败
    if (status.status === 'failed' || status.status === 'cancelled') {
      throw {
        code: 'TASK_FAILED',
        message: status.error?.message || '任务执行失败'
      } as ApiError
    }

    // 等待后继续轮询
    await new Promise(resolve => setTimeout(resolve, interval))
    attempts++
  }

  throw {
    code: 'POLL_TIMEOUT',
    message: '任务等待超时'
  } as ApiError
}

/**
 * 工具函数 - 下载文件
 * @param blob - 文件 Blob
 * @param filename - 文件名
 */
export function downloadBlob(blob: Blob, filename: string): void {
  // 创建下载链接
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename

  // 触发下载
  document.body.appendChild(link)
  link.click()

  // 清理
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export default {
  pptApi,
  historyApi,
  templateApi,
  pollTaskStatus,
  downloadBlob
}
