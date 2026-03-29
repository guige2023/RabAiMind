/**
 * API 类型定义
 * 与后端 src/models/__init__.py 中的 Pydantic 模型保持同步
 */
import type { AxiosResponse } from 'axios'
import { LayoutType } from './constants'

// ==================== 枚举类型 ====================

export enum TaskStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum SceneType {
  BUSINESS = 'business',
  EDUCATION = 'education',
  TECH = 'tech',
  CREATIVE = 'creative',
  MARKETING = 'marketing',
  FINANCE = 'finance',
  MEDICAL = 'medical',
  GOVERNMENT = 'government'
}

export enum StyleType {
  PROFESSIONAL = 'professional',
  SIMPLE = 'simple',
  ENERGETIC = 'energetic',
  PREMIUM = 'premium',
  CREATIVE = 'creative',
  TECH = 'tech',
  NATURE = 'nature',
  ELEGANT = 'elegant',
  PLAYFUL = 'playful',
  MINIMALIST = 'minimalist'
}

export enum TemplateType {
  DEFAULT = 'default',
  MODERN = 'modern',
  CLASSIC = 'classic',
  TECH = 'tech',
  NATURE = 'nature',
  OCEAN = 'ocean',
  SUNSET = 'sunset',
  MINIMAL = 'minimal'
}

export enum TextStyleType {
  TRANSPARENT_OVERLAY = 'transparent_overlay',
  SHADOW = 'shadow',
  GLOW = 'glow',
  OUTLINE = 'outline',
  GRADIENT = 'gradient',
  NEON = 'neon'
}

// ==================== 请求模型 ====================

export interface SlideBackground {
  slide_index: number
  background_type: 'color' | 'image' | 'gradient'
  background_color?: string
  background_image?: string
  gradient_start?: string
  gradient_end?: string
}

export interface SlideLayout {
  slide_index: number
  layout_type: LayoutType
}

export interface GeneratePPTRequest {
  user_request: string
  slide_count?: number
  scene?: SceneType
  style?: StyleType
  template?: TemplateType
  theme_color?: string
  text_style?: TextStyleType
  shadow_color?: string
  overlay_transparency?: number
  use_smart_layout?: boolean
  slide_backgrounds?: SlideBackground[]
  slide_layouts?: SlideLayout[]
  include_charts?: boolean
  include_pie_chart?: boolean
  include_bar_chart?: boolean
  include_line_chart?: boolean
  add_watermark?: boolean
  font_title?: string
  font_subtitle?: string
  font_content?: string
  font_caption?: string
  generation_mode?: 'standard' | 'fast' | 'quality' | 'stream'
  output_format?: 'pptx' | 'pdf' | 'svg' | 'png'
  quality?: 'standard' | 'high' | 'ultra'
  layout_mode?: 'auto' | 'manual'
  unified_layout?: boolean
  // 两阶段模式：预生成的大纲内容（来自 OutlineEditView 用户确认后）
  pre_generated_slides?: SlideOutlineItem[]
}

export interface SlideOutlineItem {
  title: string
  content: string
  slide_type?: string
  layout?: string
  image_prompt?: string
}

export interface PlanPPTRequest {
  user_request: string
  slide_count?: number
  scene?: SceneType
  style?: StyleType
}

export interface ImageSearchRequest {
  q: string
  page?: number
  limit?: number
}

// ==================== 响应模型 ====================

export interface TaskResult {
  pptx_path: string
  slide_count: number
  file_size: number
  compression_ratio: number
}

export interface TaskError {
  code: string
  message: string
  details?: Record<string, unknown>
}

export interface GeneratePPTResponse {
  success: boolean
  task_id: string
  status: TaskStatus
  message: string
  request_id?: string
  estimated_time?: number
}

export interface TaskStatusResponse {
  success: boolean
  task_id: string
  status: TaskStatus
  progress: number
  current_step: string
  created_at: string
  updated_at: string
  result?: TaskResult
  error?: TaskError
  user_request?: string
}

export interface SlidePreview {
  slide_num: number
  filename: string
  url: string
}

export interface TaskPreviewResponse {
  success: boolean
  task_id: string
  slides: SlidePreview[]
  total: number
}

export interface PlanPPTResponse {
  success: boolean
  slides: Array<{
    type: string
    title: string
    content: string[]
  }>
  message: string
}

export interface ImageResult {
  id: string
  url: string
  thumbnail_url: string
  width: number
  height: number
  description?: string
  source: string
  author?: string
  author_url?: string
}

export interface ImageSearchResponse {
  success: boolean
  total: number
  page: number
  per_page: number
  images: ImageResult[]
  message: string
}

export interface Template {
  id: string
  name: string
  description: string
  thumbnail: string
}

export interface Scene {
  id: string
  name: string
  description: string
}

export interface Style {
  id: string
  name: string
  description: string
}

export interface HealthResponse {
  status: string
  service: string
  version: string
}

export interface APIInfo {
  name: string
  version: string
  features: string[]
}

// ==================== API 客户端类型 ====================

export interface APIClient {
  ppt: {
    createTask: (data: GeneratePPTRequest) => Promise<AxiosResponse<GeneratePPTResponse>>
    getTask: (taskId: string) => Promise<AxiosResponse<TaskStatusResponse>>
    getTaskPreview: (taskId: string) => Promise<AxiosResponse<TaskPreviewResponse>>
    cancelTask: (taskId: string) => Promise<AxiosResponse<{ success: boolean; task_id: string; status: string }>>
    downloadPpt: (taskId: string, options?: { quality?: string; dpi?: number }) => Promise<Blob>
    exportPdf: (taskId: string) => Promise<Blob>
    getTemplates: () => Promise<AxiosResponse<Template[]>>
    getScenes: () => Promise<AxiosResponse<Scene[]>>
    getStyles: () => Promise<AxiosResponse<Style[]>>
    plan: (request: string, slideCount?: number) => Promise<AxiosResponse<PlanPPTResponse>>
  }
  images: {
    search: (query: string, page?: number) => Promise<AxiosResponse<ImageSearchResponse>>
    random: (count?: number, orientation?: string) => Promise<AxiosResponse<ImageSearchResponse>>
    categories: () => Promise<AxiosResponse<{ success: boolean; categories: Array<{ id: string; name: string; icon: string; keywords: string[] }> }>>
  }
}
