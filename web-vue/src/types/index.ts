/**
 * RabAi Mind 前端类型定义
 *
 * 定义所有 API 请求/响应的 TypeScript 类型
 */

// ==================== 枚举类型 ====================

/** 任务状态 */
export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

/** 场景类型 */
export type SceneType = 'business' | 'education' | 'tech' | 'creative'

/** 风格类型 */
export type StyleType = 'professional' | 'simple' | 'energetic' | 'premium'

/** 模板类型 */
export type TemplateType = 'default' | 'modern' | 'classic' | 'tech'

// ==================== 请求类型 ====================

/** PPT 生成请求 */
export interface GenerateRequest {
  /** 用户需求描述 (必填, 10-2000字符) */
  user_request: string
  /** 幻灯片数量 (可选, 默认10, 范围5-30) */
  slide_count?: number
  /** 场景类型 (可选, 默认business) */
  scene?: SceneType
  /** 风格 (可选, 默认professional) */
  style?: StyleType
  /** 模板 (可选, 默认default) */
  template?: TemplateType
  /** 主题色 (可选, 默认#165DFF) */
  theme_color?: string
  /** 回调地址 (可选) */
  callback_url?: string
}

// ==================== 响应类型 ====================

/** PPT 生成响应 */
export interface GenerateResponse {
  /** 请求是否成功 */
  success: boolean
  /** 任务 ID */
  task_id: string
  /** 任务状态 */
  status: TaskStatus
  /** 响应消息 */
  message: string
  /** 预计耗时(秒) */
  estimated_time?: number
}

/** 任务状态响应 */
export interface TaskStatusResponse {
  /** 请求是否成功 */
  success: boolean
  /** 任务 ID */
  task_id: string
  /** 任务状态 */
  status: TaskStatus
  /** 进度百分比 (0-100) */
  progress: number
  /** 当前步骤 */
  current_step: string
  /** 创建时间 */
  created_at: string
  /** 更新时间 */
  updated_at: string
  /** 任务结果 (完成后有值) */
  result?: TaskResult
  /** 错误信息 (失败时有值) */
  error?: TaskError
}

/** 任务结果 */
export interface TaskResult {
  /** PPT 文件 URL */
  pptx_url: string
  /** 幻灯片数量 */
  slide_count: number
  /** 文件大小 (字节) */
  file_size: number
  /** 预览图 URL 列表 */
  preview_urls?: string[]
}

/** 任务错误 */
export interface TaskError {
  /** 错误码 */
  code: string
  /** 错误消息 */
  message: string
  /** 错误详情 */
  details?: any
}

/** 历史记录项 */
export interface HistoryItem {
  /** 记录 ID */
  id: string
  /** 用户需求 */
  user_request: string
  /** 幻灯片数量 */
  slide_count: number
  /** 场景类型 */
  scene: SceneType
  /** 风格 */
  style: StyleType
  /** 任务状态 */
  status: TaskStatus
  /** PPT 文件 URL */
  pptx_url?: string
  /** 创建时间 */
  created_at: string
  /** 完成时间 */
  completed_at?: string
}

/** 模板信息 */
export interface TemplateInfo {
  /** 模板 ID */
  id: string
  /** 模板名称 */
  name: string
  /** 模板描述 */
  description: string
  /** 模板预览图 URL */
  thumbnail_url: string
  /** 模板类型 */
  type: TemplateType
  /** 是否为默认模板 */
  is_default: boolean
  /** 适用场景 */
  scenes: SceneType[]
  /** 创建时间 */
  created_at: string
}

// ==================== 错误类型 ====================

/** API 错误 */
export interface ApiError {
  /** 错误码 */
  code: string
  /** 错误消息 */
  message: string
  /** 错误详情 */
  details?: any
}

/** 表单验证错误 */
export interface ValidationError {
  /** 字段名 */
  field: string
  /** 错误消息 */
  message: string
}

// ==================== 组件类型 ====================

/** 幻灯片数据 */
export interface SlideData {
  /** 幻灯片索引 */
  index: number
  /** 标题 */
  title: string
  /** 内容 */
  content: string
  /** 配图 URL */
  imageUrl?: string
  /** SVG 内容 */
  svgContent?: string
}

/** 模板配置 */
export interface TemplateConfig {
  /** 模板 ID */
  id: string
  /** 模板名称 */
  name: string
  /** 主题色 */
  themeColor: string
  /** 背景色 */
  backgroundColor: string
  /** 字体配置 */
  fontFamily: string
}

// ==================== 状态类型 ====================

/** 任务状态机 */
export interface TaskState {
  /** 任务 ID */
  taskId: string | null
  /** 任务状态 */
  status: TaskStatus
  /** 进度百分比 */
  progress: number
  /** 当前步骤 */
  currentStep: string
  /** 任务结果 */
  result: TaskResult | null
  /** 错误信息 */
  error: TaskError | null
}

/** 表单状态 */
export interface FormState {
  /** 用户需求 */
  userRequest: string
  /** 幻灯片数量 */
  slideCount: number
  /** 场景类型 */
  scene: SceneType
  /** 风格 */
  style: StyleType
  /** 模板 */
  template: TemplateType
  /** 主题色 */
  themeColor: string
  /** 表单是否有效 */
  isValid: boolean
  /** 验证错误 */
  validationErrors: ValidationError[]
}
