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

export interface OutlineSlideData {
  title: string
  content: string
  layout?: string
  slide_type?: string
}

export interface OutlineSaveData {
  slides: OutlineSlideData[]
  scene?: string
  style?: string
  user_request?: string
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
    slide_type?: string
    title: string
    subtitle?: string
    content?: string[]
    layout?: string
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
    plan: (request: string, slideCount?: number, scene?: string, style?: string) => Promise<AxiosResponse<PlanPPTResponse>>
    saveOutline: (taskId: string, outline: OutlineSaveData) => Promise<AxiosResponse<{ success: boolean }>>
    commitOutline: (data: { task_id: string; pre_generated_slides: Array<{ title: string; content: string; layout?: string; slide_type?: string }>; scene?: string; style?: string; user_request?: string; slide_count?: number; layout_mode?: string; theme_color?: string }) => Promise<AxiosResponse<{ success: boolean; task_id: string }>>
    getOutline: (taskId: string) => Promise<AxiosResponse<any>>
    regenerateSlide: (params: { taskId: string; slideIndex: number; scene?: string; style?: string; content?: string; layout?: string; title?: string }) => Promise<AxiosResponse<{ success: boolean; data: { svg_url: string; slide_index: number }; message: string }>>
    uploadChart: (params: { taskId: string; file: File; chartType: string; labelCol: string; valueCol: string }) => Promise<AxiosResponse<any>>
    previewChart: (taskId: string, file: File) => Promise<AxiosResponse<any>>
    listVersions: (taskId: string) => Promise<AxiosResponse<{ success: boolean; versions: Array<{ version_id: string; name: string; created_at: string; slide_count: number }> }>>
    getVersion: (taskId: string, versionId: string) => Promise<AxiosResponse<{ success: boolean; version: any }>>
    rollbackVersion: (taskId: string, versionId: string) => Promise<AxiosResponse<{ success: boolean; message: string }>>
    diffVersions: (taskId: string, versionA: string, versionB: string) => Promise<AxiosResponse<{ success: boolean; version_a: string; version_b: string; diff: any[]; total_changes: number }>>
    createSnapshot: (taskId: string, name?: string) => Promise<AxiosResponse<{ success: boolean; version_id: string }>>
    exportPngSequence: (taskId: string, resolution?: string) => Promise<Blob>
  }
  // R160: Backup
  backup: {
    listBackups: (taskId: string) => Promise<AxiosResponse<{ success: boolean; backups: any[] }>>
    createBackup: (taskId: string, name: string) => Promise<AxiosResponse<{ success: boolean; backup_id: string }>>
    restoreBackup: (taskId: string, backupId: string) => Promise<AxiosResponse<{ success: boolean; message: string }>>
    getBackupSlides: (taskId: string, backupId: string) => Promise<AxiosResponse<{ success: boolean; slides: any[] }>>
    downloadBackup: (taskId: string, backupId: string) => Promise<Blob>
    deleteBackup: (taskId: string, backupId: string) => Promise<AxiosResponse<{ success: boolean }>>
    importBackup: (file: File) => Promise<AxiosResponse<{ success: boolean; message: string }>>
  }
  // R160: Sharing / Access Requests
  sharing: {
    listIncomingAccessRequests: () => Promise<AxiosResponse<{ success: boolean; requests: any[] }>>
    listMyAccessRequests: () => Promise<AxiosResponse<{ success: boolean; requests: any[] }>>
    approveAccessRequest: (requestId: string) => Promise<AxiosResponse<{ success: boolean }>>
    rejectAccessRequest: (requestId: string, reason?: string) => Promise<AxiosResponse<{ success: boolean }>>
    deleteAccessRequest: (requestId: string) => Promise<AxiosResponse<{ success: boolean }>>
    createAccessRequest: (data: { item_id: string; item_type: string; message?: string }) => Promise<AxiosResponse<{ success: boolean; request_id: string }>>
  }
  // R160: Collaboration
  collaboration: {
    listCollaborators: (taskId: string) => Promise<AxiosResponse<{ success: boolean; collaborators: any[] }>>
    createShareLink: (taskId: string, role: string) => Promise<AxiosResponse<{ success: boolean; link: string; share_id: string }>>
    deleteShareLink: (taskId: string, shareId: string) => Promise<AxiosResponse<{ success: boolean }>>
    listShareLinks: (taskId: string) => Promise<AxiosResponse<{ success: boolean; links: any[] }>>
  }
  images: {
    search: (query: string, page?: number) => Promise<AxiosResponse<ImageSearchResponse>>
    random: (count?: number, orientation?: string) => Promise<AxiosResponse<ImageSearchResponse>>
    categories: () => Promise<AxiosResponse<{ success: boolean; categories: Array<{ id: string; name: string; icon: string; keywords: string[] }> }>>
  }
  favorites: {
    add: (userId: string, data: { item_id: string; item_type: string; name: string; description?: string; thumbnail?: string }) => Promise<AxiosResponse<{ success: boolean; message: string }>>
    remove: (userId: string, itemId: string, itemType: string) => Promise<AxiosResponse<{ success: boolean; message: string }>>
    check: (userId: string, itemId: string, itemType: string) => Promise<AxiosResponse<{ is_favorite: boolean }>>
    list: (userId: string, itemType?: string) => Promise<AxiosResponse<{ success: boolean; items: any[]; total: number }>>
  }
  template: {
    uploadTemplate: (data: { name: string; description: string; scene: string; style: string; visibility: string }) => Promise<AxiosResponse<{ success: boolean; template_id: string; template: any }>>
    listMyTemplates: () => Promise<AxiosResponse<{ success: boolean; templates: any[] }>>
    deleteTemplate: (id: string) => Promise<AxiosResponse<{ success: boolean }>>
    renameTemplate: (id: string, data: { name: string; description?: string }) => Promise<AxiosResponse<{ success: boolean; template: any }>>
  }
  // R58: Voice / TTS
  voice: {
    listVoices: () => Promise<AxiosResponse<{ success: boolean; data: Array<{ id: string; lang: string; name: string; gender: string }> }>>
    listLanguages: () => Promise<AxiosResponse<{ success: boolean; data: Array<{ code: string; name: string }> }>>
    generateTTS: (params: { text: string; voice?: string; rate?: string; volume?: string; pitch?: string }) => Promise<AxiosResponse<{ success: boolean; data: { audio_url: string; filename: string; duration_sec: number; voice: string; voice_name: string; text_length: number } }>>
    translateText: (params: { text: string; source_lang: string; target_lang: string }) => Promise<AxiosResponse<{ success: boolean; data: { original: string; translated: string; source_lang: string; target_lang: string; source_lang_name: string; target_lang_name: string } }>>
    batchTTS: (params: { slides: Array<{ index: number; title?: string; content?: string; narration?: string }>; voice?: string; rate?: string }) => Promise<AxiosResponse<{ success: boolean; data: { voice: string; voice_name: string; results: Array<{ index: number; success: boolean; audio_url?: string; filename?: string; text_length?: number; error?: string }> } }>>
  }
  // R34/R69: Search
  search: {
    inPPT: (query: string, limit?: number) => Promise<AxiosResponse<{
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
    }>>
  }
  // R32/R109/R133: AI 增强功能
  ai: {
    rephrase: (text: string, style?: string) => Promise<AxiosResponse<{ success: boolean; rephrased: string }>>
    translate: (text: string, targetLang: string) => Promise<AxiosResponse<{ success: boolean; translated: string; lang: string }>>
    layoutSuggestion: (params: { slideIndex: number; elements: any[]; slideContent: string }) => Promise<AxiosResponse<{ success: boolean; suggestion: any }>>
    autoEnhance: (params: { slideIndex: number; elements: any[]; colorScheme?: string }) => Promise<AxiosResponse<{ success: boolean; enhancement: any }>>
    contentScore: (params: { elements: any[]; slideContent: string }) => Promise<AxiosResponse<{ success: boolean; score: any }>>
    generateContentTemplate: (params: { template_type: string; topic?: string; context?: string; slide_title?: string; count?: number }) => Promise<AxiosResponse<{ success: boolean; content: any; template_type: string }>>
    professionalPolish: (params: { slideIndex: number; targetLevel: string }) => Promise<AxiosResponse<{ success: boolean; polish: any }>>
    smartCopy: (params: { sourceSlideIndex: number; targetSlideIndex: number }) => Promise<AxiosResponse<{ success: boolean }>>
    extendContent: (params: { slideIndex: number; ratio?: number }) => Promise<AxiosResponse<{ success: boolean; content: any }>>
    generateSpeakerNotes: (params: { slideIndex: number; slidesContent: string[] }) => Promise<AxiosResponse<{ success: boolean; notes: string }>>
    checkDesignConsistency: (params: { slideIndices: number[] }) => Promise<AxiosResponse<{ success: boolean; consistency: any }>>
  }
}
