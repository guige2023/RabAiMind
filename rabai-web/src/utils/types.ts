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

// ==================== 新增类型定义（消除 any）====================

/** 图表注解 */
export interface ChartAnnotation {
  type: string
  x: number
  y: number
  text: string
  color: string
}

/** 表格列信息 */
export interface ColumnInfo {
  index: number
  name: string
  type: string
  sample: unknown
}

/** 表格预览数据 */
export type TablePreview = unknown[][]

/** 检查点 */
export interface Checkpoint {
  checkpoint_id: string
  name?: string
  checkpoint_type: 'auto' | 'manual'
  created_at: string
  slide_count: number
  state?: PresentationState
}

/** 版本信息 */
export interface Version {
  version_id: string
  name: string
  created_at: string
  slide_count: number
  tags?: string[]
  branch_id?: string
  branched_from?: string
  auto_created?: boolean
  auto_type?: string
}

/** 操作日志条目 */
export interface ActionLogEntry {
  action_type: string
  description: string
  timestamp: string
  undo_data?: PresentationState
}

/** 撤销栈条目 */
export interface UndoStackEntry {
  action_type: string
  description: string
  timestamp: string
  undo_data?: PresentationState
}

/** 时间线条目 */
export interface TimelineEntry {
  action_id: string
  action_type: string
  description: string
  timestamp: string
  undo_data?: PresentationState
  branch_id?: string
}

/** 协作锁 */
export interface CollabLock {
  locked_by: string
  locked_at: string
  slide_index?: number
}

/** 版本差异结果 */
export interface DiffResult {
  success: boolean
  version_a: string
  version_b: string
  diff: SlideHistoryEntry[]
  total_changes: number
}

/** 合并冲突 */
export interface MergeConflict {
  slide_index: number
  conflict_type: string
  version_a_content: unknown
  version_b_content: unknown
}

/** 自动版本信息 */
export interface AutoVersion {
  version_id: string
  version_name: string
  created_at: string
  change_count: number
}

/** 变更详情 */
export interface ChangeDetails {
  changed_slides: number[]
  changed_elements: Record<number, string[]>
  reason: string
}

/** 便签 */
export interface StickyNote {
  id: string
  slide_index: number
  content: string
  author: string
  color?: string
  position_x?: number
  position_y?: number
  created_at?: string
}

/** 活动条目 */
export interface ActivityEntry {
  id: string
  activity_type: string
  user_id: string
  user_name: string
  target: string
  details: string
  slide_num?: number
  timestamp: number
  read: boolean
}

/** 建议编辑 */
export interface SuggestEdit {
  id: string
  slide_num: number
  author_id: string
  author_name: string
  edit_type: 'text' | 'image' | 'layout' | 'style'
  original_content: unknown
  suggested_content: unknown
  reason: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
}

/** 版本标签 */
export interface VersionTag {
  version_id: string
  version_name: string
  tag: string
}

/** 大纲修订版 */
export interface OutlineRevision {
  task_id: string
  slides: Array<{
    title: string
    content: string
    layout?: string
    slide_type?: string
  }>
  scene?: string
  style?: string
  user_request?: string
  created_at?: string
  updated_at?: string
}

/** A/B 测试变体 */
export interface ABTESTVariant {
  variant_id: string
  name: string
  svg_url: string
  selected_count: number
  click_count: number
}

/** A/B 测试结果 */
export interface ABTestResult {
  test_id: string
  slide_index: number
  variants: ABTESTVariant[]
  winner?: string
  status: 'running' | 'completed'
  created_at: string
}

/** 幻灯片历史条目 */
export interface SlideHistoryEntry {
  version_id: string
  slide_index: number
  title: string
  content: string
  layout?: string
  created_at: string
  created_by?: string
}

/** 改进建议 */
export interface Improvement {
  slide_index: number
  type: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  confidence: number
}

/** 自动保存状态 */
export type AutoSaveState = PresentationState

/** 演示文稿完整状态（用于自动保存/恢复） */
export interface PresentationState {
  slides: Array<{
    title: string
    content: string
    layout?: string
    background?: SlideBackground
    notes?: string
    sticky_notes?: StickyNote[]
  }>
  theme?: {
    primary: string
    secondary: string
    accent: string
  }
  metadata?: Record<string, unknown>
}

/** 备份信息 */
export interface BackupInfo {
  backup_id: string
  task_id: string
  name: string
  backup_type: 'full' | 'slides' | 'config'
  created_at: string
  size_str: string
  slide_count: number
}

/** 母版幻灯片 */
export interface MasterSlide {
  id: string
  name: string
  thumbnail: string
  layout_type: LayoutType
  created_at: string
}

/** 自定义主题 */
export interface CustomTheme {
  id: string
  name: string
  primary: string
  secondary: string
  accent: string
  style: string
  created_at: string
}

/** 安全配置 */
export interface SecurityConfig {
  has_password: boolean
  has_biometric: boolean
  allowed_ips?: string[]
  watermark_enabled?: boolean
  watermark_settings?: {
    text: string
    opacity: number
    angle: number
    font_size: number
    color: string
  }
}

/** 数据源 */
export interface DataSource {
  id: string
  name: string
  source_type: 'excel' | 'csv' | 'google_sheets'
  status: 'active' | 'inactive' | 'error'
  auto_update: boolean
  last_synced_at: string | null
  sync_interval_minutes: number
  created_at: string
  updated_at: string
  total_rows: number
  total_columns: number
  headers: string[]
  table_type: string
  threshold_alerts?: ThresholdAlert[]
}

/** 阈值告警 */
export interface ThresholdAlert {
  id?: string
  column: string
  condition: string
  value: number
  label: string
  enabled?: boolean
}

/** 触发的告警 */
export interface TriggeredAlert {
  alert_id: string
  column: string
  current_value: number
  triggered_at: string
  message: string
}

/** 协作者 */
export interface Collaborator {
  user_id: string
  user_name: string
  email: string
  role: 'owner' | 'editor' | 'viewer'
  added_at: string
}

/** 分享链接 */
export interface ShareLink {
  id: string
  url: string
  role: string
  expires_at?: string
  created_at: string
}

/** 访问请求 */
export interface AccessRequest {
  id: string
  item_id: string
  item_type: string
  requester_id: string
  requester_name: string
  message?: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

/** 短链接 */
export interface ShortUrl {
  short_code: string
  short_url: string
  original_url: string
  ppt_id: string
  title: string
  total_accesses: number
  qr_scans: number
  nfc_taps: number
  beacon_triggers: number
  created_at: string
}

/** 信标设备 */
export interface Beacon {
  id: string
  name: string
  uuid?: string
  major?: number
  minor?: number
  tx_power?: number
  url?: string
  ppt_id: string
  created_at: string
}

/** 提醒 */
export interface Reminder {
  id: string
  task_id?: string
  title: string
  review_date: string
  remind_before_hours?: number
  notes?: string
  status: 'pending' | 'completed' | 'cancelled'
  created_at: string
}

/** 定时任务 */
export interface Schedule {
  id: string
  name: string
  action: 'generate' | 'export' | 'webhook' | 'email'
  schedule_type: 'once' | 'daily' | 'weekly' | 'monthly'
  status: 'active' | 'paused' | 'completed'
  next_run_at?: string
  last_run_at?: string
  created_at: string
  user_id?: string
}

/** 搜索分析数据 */
export interface SearchAnalytics {
  period_days: number
  total_searches: number
  unique_queries: number
  trending_queries: Array<{ query: string; count: number }>
  search_volume_over_time: Array<{ date: string; count: number }>
  no_result_queries: Array<{ query: string; count: number }>
  top_clicked_templates: Array<{
    id: string
    name: string
    category: string
    style: string
    thumbnail: string
    click_count: number
  }>
}

/** 评价/评论 */
export interface Review {
  id: string
  user_id: string
  user_name: string
  rating: number
  content: string
  created_at: string
}

/** 模板包 */
export interface Bundle {
  id: string
  name: string
  description: string
  thumbnail: string
  template_ids: string[]
  price: number
  created_at: string
}

/** 邮件配置 */
export interface EmailConfig {
  to_email: string
  from_name?: string
  subject: string
  body_html?: string
  body_text?: string
  smtp_host?: string
  smtp_port?: number
  smtp_user?: string
  smtp_password?: string
  from_email?: string
}

/** 语音结果 */
export interface VoiceResult {
  audio_url: string
  filename: string
  duration_sec: number
  voice: string
  voice_name: string
  text_length: number
}

/** 翻译结果 */
export interface TranslationResult {
  original: string
  translated: string
  source_lang: string
  target_lang: string
  source_lang_name: string
  target_lang_name: string
}

/** 批量 TTS 结果 */
export interface TTSBatchResult {
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

/** SOC2 合规信息 */
export interface SOC2Info {
  attestation_url?: string
  last_audit_at?: string
  next_audit_at?: string
  compliance_status: 'compliant' | 'pending' | 'non_compliant'
}

/** 自定义角色 */
export interface CustomRole {
  id: string
  name: string
  description: string
  permissions: string[]
  is_active: boolean
  created_at: string
}

/** SSO 提供商 */
export interface SSOProvider {
  id: string
  name: string
  icon?: string
  enabled: boolean
}

// ==================== API 客户端类型 ====================

export interface APIClient {
    // Collaboration suggest edits (top-level methods)
  getSuggestEdits: (taskId: string, slideNum?: number) => Promise<AxiosResponse<{ success: boolean; edits: SuggestEdit[] }>>
  addSuggestEdit: (taskId: string, params: Omit<SuggestEdit, 'id' | 'status' | 'created_at'>) => Promise<AxiosResponse<{ success: boolean; edit: SuggestEdit }>>
  resolveSuggestEdit: (taskId: string, editId: string, params: { status: 'pending' | 'accepted' | 'rejected'; resolved_by: string }) => Promise<AxiosResponse<{ success: boolean }>>
  getActivityFeed: (taskId: string, params?: { activity_type?: string; user_id?: string; limit?: number }) => Promise<AxiosResponse<{ success: boolean; activities: ActivityEntry[] }>>
  logActivity: (taskId: string, params: Omit<ActivityEntry, 'id' | 'timestamp' | 'read'>) => Promise<AxiosResponse<{ success: boolean; activity: ActivityEntry }>>
  markActivityRead: (taskId: string, activityId: string) => Promise<AxiosResponse<{ success: boolean }>>
  markAllActivitiesRead: (taskId: string) => Promise<AxiosResponse<{ success: boolean; count: number }>>
  // Data Sources (R113)
  listDataSources: () => Promise<AxiosResponse<{ success: boolean; data_sources: DataSource[] }>>
  getDataSource: (sourceId: string) => Promise<AxiosResponse<{ success: boolean; data_source: DataSource }>>
  updateDataSource: (sourceId: string, params: Partial<DataSource>) => Promise<AxiosResponse<{ success: boolean; data_source: DataSource }>>
  deleteDataSource: (sourceId: string) => Promise<AxiosResponse<{ success: boolean; message: string }>>
  importExcel: (params: { file: File; sheet_index?: number; has_header?: boolean; max_rows?: number }) => Promise<AxiosResponse<{ success: boolean; source_id: string; source_name: string; sheet_names: string[]; current_sheet: string; total_rows: number; total_columns: number; headers: string[]; column_info: ColumnInfo[]; table_type: string; table_preview: TablePreview; outline: unknown }>>
  importCSV: (params: { file: File; has_header?: boolean; max_rows?: number; delimiter?: string }) => Promise<AxiosResponse<{ success: boolean; source_id: string; source_name: string; total_rows: number; total_columns: number; headers: string[]; column_info: ColumnInfo[]; table_type: string; table_preview: TablePreview; outline: unknown }>>
  importGoogleSheets: (params: { spreadsheet_url: string; sheet_name?: string; access_token: string; has_header?: boolean; max_rows?: number }) => Promise<AxiosResponse<{ success: boolean; source_id: string; source_name: string; spreadsheet_title: string; total_rows: number; total_columns: number; headers: string[]; column_info: ColumnInfo[]; table_type: string; outline: unknown }>>
  syncDataSource: (sourceId: string, accessToken: string) => Promise<AxiosResponse<{ success: boolean; data_source_id: string; synced_rows: number; synced_at: string; message: string; outline?: unknown }>>
  getDataSourcePreview: (sourceId: string) => Promise<AxiosResponse<{ success: boolean; source_id: string; headers: string[]; column_info: ColumnInfo[]; total_rows: number; total_columns: number; table_preview: TablePreview; table_type: string }>>
  setThresholdAlerts: (sourceId: string, alerts: ThresholdAlert[]) => Promise<AxiosResponse<{ success: boolean; source_id: string; alerts: ThresholdAlert[]; triggered: TriggeredAlert[] }>>
  getThresholdAlerts: (sourceId: string) => Promise<AxiosResponse<{ success: boolean; source_id: string; alerts: ThresholdAlert[]; triggered: TriggeredAlert[] }>>
  analyzeData: (sourceId: string, params: { compare_column: string; group_by_column?: string; periods?: string[] }) => Promise<AxiosResponse<{ success: boolean; source_id: string; compare_column: string; total_rows: number; stats: { sum: number; avg: number; max: number; min: number; max_label: string; min_label: string }; trend: { direction: string; change_pct: number; first_half_avg: number; second_half_avg: number }; group_stats?: unknown; period_comparison?: unknown; chart_data: { labels: string[]; values: number[] } }>>
  getForecast: (sourceId: string, params: { value_column: string; label_column?: string; forecast_periods?: number; chart_type?: string }) => Promise<AxiosResponse<{ success: boolean; source_id: string; value_column: string; regression: { slope: number; intercept: number; r_squared: number }; trend_direction: string; trendline: number[]; forecast: { periods: number; labels: string[]; values: number[] }; chart_data: { type: string; labels: string[]; actual: (number | null)[]; forecast: (number | null)[]; trendline: number[] } }>>
  generateFromDataSource: (params: { source_id: string; title?: string; include_charts?: boolean; include_threshold_alerts?: boolean; include_forecast?: boolean; forecast_periods?: number; slide_count?: number }) => Promise<AxiosResponse<{ success: boolean; source_id: string; outline: { title: string; slides: unknown[] } }>>
  // Presentation Security (R122)
  security: {
    getConfig: (taskId: string) => Promise<AxiosResponse<SecurityConfig>>
    setPassword: (taskId: string, password: string) => Promise<AxiosResponse<{ success: boolean }>>
    removePassword: (taskId: string) => Promise<AxiosResponse<{ success: boolean }>>
    getPasswordStatus: (taskId: string) => Promise<AxiosResponse<{ has_password: boolean }>>
    verifyPassword: (taskId: string, password: string) => Promise<AxiosResponse<{ valid: boolean }>>
    setBiometric: (taskId: string, required: boolean) => Promise<AxiosResponse<{ success: boolean }>>
    getBiometricStatus: (taskId: string) => Promise<AxiosResponse<{ enabled: boolean }>>
    verifyBiometric: (taskId: string, assertion: string) => Promise<AxiosResponse<{ valid: boolean }>>
    setIPAllowlist: (taskId: string, allowed_ips: string[]) => Promise<AxiosResponse<{ success: boolean }>>
    getIPAllowlist: (taskId: string) => Promise<AxiosResponse<{ allowed_ips: string[] }>>
    setWatermark: (taskId: string, opts: { enabled: boolean; text: string; opacity: number; angle: number; font_size: number; color: string }) => Promise<AxiosResponse<{ success: boolean }>>
    getWatermark: (taskId: string) => Promise<AxiosResponse<{ enabled: boolean; text: string; opacity: number; angle: number; font_size: number; color: string }>>
    getAccessLog: (taskId: string, limit?: number, offset?: number) => Promise<AxiosResponse<{ success: boolean; logs: Array<{ user_id: string; action: string; timestamp: string; ip?: string }> }>>
    deleteSecurity: (taskId: string) => Promise<AxiosResponse<{ success: boolean }>>
  }
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
    getOutline: (taskId: string) => Promise<AxiosResponse<OutlineRevision>>
    regenerateSlide: (params: { taskId: string; slideIndex: number; scene?: string; style?: string; content?: string; layout?: string; title?: string; layout_mode?: string; unified_layout?: boolean; reset_first_layout?: boolean }) => Promise<AxiosResponse<{ success: boolean; data: { svg_url: string; slide_index: number }; message: string }>>
    uploadChart: (params: { taskId: string; file: File; chartType: string; labelCol: string; valueCol: string; themeId?: string; showTrendLine?: boolean; annotations?: ChartAnnotation[] }) => Promise<AxiosResponse<{ success: boolean; columns: { all_columns: string[]; label_columns: string[]; numeric_columns: string[]; preview: TablePreview }; charts: Array<{ index: number; svg_path: string; label_col: string; value_col: string; chart_type: string; theme_id?: string }>; svg_urls: string[] }>>
    updateSlideImage: (params: { taskId: string; slideIndex: number; image_url?: string; action: 'set' | 'remove' | 'regenerate' }) => Promise<AxiosResponse<{ success: boolean; image_url?: string; message: string }>>
    getActionLog: (taskId: string, limit?: number) => Promise<AxiosResponse<{ success: boolean; action_log: ActionLogEntry[] }>>
    getUndoStack: (taskId: string) => Promise<AxiosResponse<{ success: boolean; undo_stack: UndoStackEntry[] }>>
    undo: (taskId: string) => Promise<AxiosResponse<{ success: boolean; message?: string }>>
    redo: (taskId: string) => Promise<AxiosResponse<{ success: boolean; message?: string }>>
    getRedoStack: (taskId: string) => Promise<AxiosResponse<{ success: boolean; redo_stack: UndoStackEntry[] }>>
    getActionTimeline: (taskId: string, limit?: number) => Promise<AxiosResponse<{ success: boolean; timeline: TimelineEntry[] }>>
    undoByActionId: (taskId: string, actionId: string, force?: boolean) => Promise<AxiosResponse<{ success: boolean; undone_action?: string; affected_actions?: number; mode?: string; warning?: string }>>
    createCheckpoint: (taskId: string, name?: string, checkpointType?: string) => Promise<AxiosResponse<{ success: boolean; checkpoint_id: string; checkpoint: Checkpoint }>>
    getCheckpoints: (taskId: string, limit?: number) => Promise<AxiosResponse<{ success: boolean; checkpoints: Checkpoint[] }>>
    restoreCheckpoint: (taskId: string, checkpointId: string) => Promise<AxiosResponse<{ success: boolean; message?: string }>>
    acquireCollaborativeLock: (taskId: string, userId: string, slideIndex?: number) => Promise<AxiosResponse<{ success: boolean; locked?: string; locked_by?: string }>>
    releaseCollaborativeLock: (taskId: string, userId: string, slideIndex?: number) => Promise<AxiosResponse<{ success: boolean; released?: string }>>
    getCollaborativeLocks: (taskId: string) => Promise<AxiosResponse<{ success: boolean; locks: Record<string, CollabLock> }>>
    updateSlideNotes: (taskId: string, params: { slide_index: number; notes?: string; rich_notes?: string; speaker_notes?: string }) => Promise<AxiosResponse<{ success: boolean; slide_index: number }>>
    updateSlideStickyNotes: (taskId: string, params: { slide_index: number; sticky_notes?: StickyNote[] }) => Promise<AxiosResponse<{ success: boolean; slide_index: number }>>
    saveSlideAnnotations: (taskId: string, slideIndex: number, annotations: SlideAnnotation[]) => Promise<AxiosResponse<{ success: boolean; slide_index: number; count: number }>>
    getStickyNotes: (taskId: string) => Promise<AxiosResponse<{ success: boolean; sticky_notes: StickyNote[] }>>
    addStickyNote: (taskId: string, note: Omit<StickyNote, 'id' | 'created_at'>) => Promise<AxiosResponse<{ success: boolean; note: StickyNote }>>
    deleteStickyNote: (taskId: string, noteId: string) => Promise<AxiosResponse<{ success: boolean }>>
    getNotesTemplates: (templateType?: string) => Promise<AxiosResponse<{ success: boolean; templates: unknown[] }>>
    createNotesTemplate: (tpl: { name: string; description?: string; template_type?: string; content: string }) => Promise<AxiosResponse<{ success: boolean; template: unknown }>>
    suggestLayouts: (params: { title?: string; content?: string }) => Promise<AxiosResponse<{ success: boolean; suggestions: unknown[] }>>
    saveLayoutPreference: (params: { user_id?: string; template_id?: string; layout_type?: string; content_type?: string; scene?: string; style?: string; action?: string }) => Promise<AxiosResponse<{ success: boolean; action: string }>>
    previewChart: (taskId: string, file: File) => Promise<AxiosResponse<{ success: boolean; columns: { all_columns: string[]; label_columns: string[]; numeric_columns: string[]; preview: TablePreview } }>>
    listVersions: (taskId: string) => Promise<AxiosResponse<{ success: boolean; versions: Version[] }>>
    getVersion: (taskId: string, versionId: string) => Promise<AxiosResponse<{ success: boolean; version: Version }>>
    rollbackVersion: (taskId: string, versionId: string) => Promise<AxiosResponse<{ success: boolean; message: string }>>
    diffVersions: (taskId: string, versionA: string, versionB: string) => Promise<AxiosResponse<DiffResult>>
    createSnapshot: (taskId: string, name?: string) => Promise<AxiosResponse<{ success: boolean; version_id: string }>>
    exportPngSequence: (taskId: string, resolution?: string) => Promise<Blob>
    // R160: Backup
    listBackups: (taskId: string) => Promise<AxiosResponse<{ success: boolean; backups: BackupInfo[] }>>
    createBackup: (taskId: string, name: string) => Promise<AxiosResponse<{ success: boolean; backup_id: string }>>
    restoreBackup: (taskId: string, backupId: string, restoreType?: 'full' | 'slides' | 'config', selectedSlideNums?: number[]) => Promise<AxiosResponse<{ success: boolean; message: string; restore_type?: string; selected_slides?: number[] }>>
    getBackupSlides: (taskId: string, backupId: string) => Promise<AxiosResponse<{ success: boolean; slides: unknown[] }>>
    downloadBackup: (taskId: string, backupId: string) => Promise<Blob>
    deleteBackup: (taskId: string, backupId: string) => Promise<AxiosResponse<{ success: boolean }>>
    importBackup: (file: File) => Promise<AxiosResponse<{ success: boolean; backup_id: string; task_id: string }>>
    getMasterSlides: () => Promise<AxiosResponse<{ success: boolean; master_slides: MasterSlide[] }>>
    saveMasterSlide: (master: MasterSlide) => Promise<AxiosResponse<{ success: boolean; master_slide: MasterSlide }>>
    deleteMasterSlide: (id: string) => Promise<AxiosResponse<{ success: boolean }>>
    deleteCustomTheme: (id: string) => Promise<AxiosResponse<{ success: boolean }>>
    getCustomThemes: () => Promise<AxiosResponse<{ success: boolean; themes: CustomTheme[] }>>
    suggestTheme: (params: { content?: string; title?: string; scene?: string; style?: string }) => Promise<AxiosResponse<{ success: boolean; theme: { primary: string; secondary: string; accent: string; style: string; name: string }; alternatives?: Array<{ primary: string; secondary: string; accent: string; name: string; style: string }> }>>
  }
  // R160: Sharing / Access Requests
  sharing: {
    listIncomingAccessRequests: () => Promise<AxiosResponse<{ success: boolean; requests: AccessRequest[] }>>
    listMyAccessRequests: () => Promise<AxiosResponse<{ success: boolean; requests: AccessRequest[] }>>
    approveAccessRequest: (requestId: string) => Promise<AxiosResponse<{ success: boolean }>>
    rejectAccessRequest: (requestId: string, reason?: string) => Promise<AxiosResponse<{ success: boolean }>>
    deleteAccessRequest: (requestId: string) => Promise<AxiosResponse<{ success: boolean }>>
    createAccessRequest: (data: { item_id: string; item_type: string; message?: string }) => Promise<AxiosResponse<{ success: boolean; request_id: string }>>
  }
  // R160: Collaboration
  shareEnhancements: {
    createShortUrl: (params: { original_url: string; ppt_id: string; title: string }) => Promise<AxiosResponse<{ success: boolean; short_code: string; short_url: string; original_url: string; created_at: string }>>
    resolveShortUrl: (shortCode: string) => Promise<AxiosResponse<{ success: boolean; original_url: string; ppt_id: string; title: string }>>
    listShortUrls: () => Promise<AxiosResponse<{ success: boolean; short_urls: ShortUrl[] }>>
    deleteShortUrl: (shortCode: string) => Promise<AxiosResponse<{ success: boolean }>>
    getShortUrlAnalytics: (shortCode: string) => Promise<AxiosResponse<{ success: boolean; short_code: string; total_accesses: number; qr_scans: number; nfc_taps: number; beacon_triggers: number; created_at: string }>>
    recordQRScan: (shortCode: string, deviceInfo?: string, location?: string) => Promise<AxiosResponse<{ success: boolean }>>
    recordNFCTap: (shortCode: string, deviceInfo?: string, location?: string) => Promise<AxiosResponse<{ success: boolean }>>
    listBeacons: (shortCode: string) => Promise<AxiosResponse<{ success: boolean; beacons: Beacon[] }>>
    createBeacon: (shortCode: string, params: Omit<Beacon, 'id' | 'created_at'>) => Promise<AxiosResponse<{ success: boolean; beacon: Beacon }>>
    updateBeacon: (beaconId: string, params: Partial<Beacon>) => Promise<AxiosResponse<{ success: boolean; beacon: Beacon }>>
    deleteBeacon: (beaconId: string) => Promise<AxiosResponse<{ success: boolean }>>
  }
  collaboration: {
    listCollaborators: (taskId: string) => Promise<AxiosResponse<{ success: boolean; collaborators: Collaborator[] }>>
    createShareLink: (taskId: string, role: string) => Promise<AxiosResponse<{ success: boolean; link: string; share_id: string }>>
    deleteShareLink: (taskId: string, shareId: string) => Promise<AxiosResponse<{ success: boolean }>>
    listShareLinks: (taskId: string) => Promise<AxiosResponse<{ success: boolean; links: ShareLink[] }>>
    getSuggestEdits: (taskId: string, slideNum?: number) => Promise<AxiosResponse<{ success: boolean; edits: SuggestEdit[] }>>
    addSuggestEdit: (taskId: string, params: Omit<SuggestEdit, 'id' | 'status' | 'created_at'>) => Promise<AxiosResponse<{ success: boolean; edit: SuggestEdit }>>
    resolveSuggestEdit: (taskId: string, editId: string, params: { status: 'pending' | 'accepted' | 'rejected'; resolved_by: string }) => Promise<AxiosResponse<{ success: boolean }>>
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
    list: (userId: string, itemType?: string) => Promise<AxiosResponse<{ success: boolean; items: unknown[]; total: number }>>
  }
  template: {
    uploadTemplate: (data: { name: string; description: string; scene: string; style: string; visibility: string }) => Promise<AxiosResponse<{ success: boolean; template_id: string; template: unknown }>>
    listMyTemplates: () => Promise<AxiosResponse<{ success: boolean; templates: unknown[] }>>
    deleteTemplate: (id: string) => Promise<AxiosResponse<{ success: boolean }>>
    renameTemplate: (id: string, data: { name: string; description?: string }) => Promise<AxiosResponse<{ success: boolean; template: unknown }>>
    getTrending: (limit?: number, days?: number) => Promise<AxiosResponse<{ success: boolean; templates: unknown[]; period_days: number }>>
    getSimilar: (templateId: string, limit?: number) => Promise<AxiosResponse<{ success: boolean; templates: unknown[]; template_id: string }>>
    getRecommended: (params: { user_id?: string; scene?: string; style?: string; limit?: number }) => Promise<AxiosResponse<{ success: boolean; templates: unknown[]; user_id: string }>>
    matchTemplates: (params: { q?: string; scene?: string; style?: string; limit?: number }) => Promise<AxiosResponse<{ success: boolean; templates: unknown[]; query: string; detected_scene: string | null; detected_style: string | null }>>
    trackEvent: (params: { event_type: string; template_id?: string; user_id?: string; query?: string; scene?: string; style?: string; request_text?: string }) => Promise<AxiosResponse<{ success: boolean }>>
    recordTemplateClick: (templateId: string) => Promise<AxiosResponse<{ success: boolean }>>
    getTrendingQueries: (limit?: number, days?: number) => Promise<AxiosResponse<{ success: boolean; queries: Array<{ query: string; count: number }>; period_days: number }>>
  }
  // R58: Voice / TTS
  voice: {
    listVoices: () => Promise<AxiosResponse<{ success: boolean; data: Array<{ id: string; lang: string; name: string; gender: string }> }>>
    listLanguages: () => Promise<AxiosResponse<{ success: boolean; data: Array<{ code: string; name: string }> }>>
    generateTTS: (params: { text: string; voice?: string; rate?: string; volume?: string; pitch?: string }) => Promise<AxiosResponse<{ success: boolean; data: VoiceResult }>>
    translateText: (params: { text: string; source_lang: string; target_lang: string }) => Promise<AxiosResponse<{ success: boolean; data: TranslationResult }>>
    batchTTS: (params: { slides: Array<{ index: number; title?: string; content?: string; narration?: string }>; voice?: string; rate?: string }) => Promise<AxiosResponse<{ success: boolean; data: TTSBatchResult }>>
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
    translateText: (params: { text: string; source_lang: string; target_lang: string }) => Promise<AxiosResponse<{ success: boolean; data: { original: string; translated: string; source_lang: string; target_lang: string } }>>
    layoutSuggestion: (params: { slideIndex: number; elements: unknown[]; slideContent: string }) => Promise<AxiosResponse<{ success: boolean; suggestion: unknown }>>
    autoEnhance: (params: { slideIndex: number; elements: unknown[]; colorScheme?: string }) => Promise<AxiosResponse<{ success: boolean; enhancement: unknown }>>
    contentScore: (params: { elements: unknown[]; slideContent: string }) => Promise<AxiosResponse<{ success: boolean; score: unknown }>>
    generateContentTemplate: (params: { template_type: string; topic?: string; context?: string; slide_title?: string; count?: number }) => Promise<AxiosResponse<{ success: boolean; content: unknown; template_type: string }>>
    professionalPolish: (params: { slideIndex: number; targetLevel: string }) => Promise<AxiosResponse<{ success: boolean; polish: unknown }>>
    smartCopy: (params: { sourceSlideIndex: number; targetSlideIndex: number }) => Promise<AxiosResponse<{ success: boolean }>>
    extendContent: (params: { slideIndex: number; ratio?: number }) => Promise<AxiosResponse<{ success: boolean; content: unknown }>>
    generateSpeakerNotes: (params: { slideIndex: number; slidesContent: string[] }) => Promise<AxiosResponse<{ success: boolean; notes: string }>>
    checkDesignConsistency: (params: { slideIndices: number[] }) => Promise<AxiosResponse<{ success: boolean; consistency: unknown }>>
    expandShorten: (text: string, ratio?: number) => Promise<AxiosResponse<{ success: boolean; result: string; ratio: number }>>
    grammarCheck: (text: string) => Promise<AxiosResponse<{ success: boolean; check: { corrected: string; errors: unknown[]; has_errors: boolean } }>>
    smartFootnotes: (text: string, topic?: string, count?: number) => Promise<AxiosResponse<{ success: boolean; footnotes: { footnotes: Array<{ source: string; source_type: string; description: string; in_text_mark: string }>; formatted_footnotes: string } }>>
    toneAdjust: (text: string, tone: string) => Promise<AxiosResponse<{ success: boolean; adjusted: { adjusted: string; tone: string; tone_description: string; changes_summary: string } }>>
    clicheDetect: (text: string) => Promise<AxiosResponse<{ success: boolean; detection: { detected: Array<{ phrase: string; reason: string; alternatives: Array<{ text: string; style: string }> }>; has_cliches: boolean; cleaned_text: string; summary: string } }>>
    listContentTemplates: () => Promise<AxiosResponse<{ success: boolean; templates: Array<{ type: string; description: string }> }>>
  }
  // R109/R148: Advanced AI (高级AI功能)
  advancedAI: {
    smartCopy: (params: { source_slides: Array<{ title: string; content: string; bullet_points?: string[] }>; target_theme: string; target_style?: string; target_page_count?: number }) => Promise<AxiosResponse<{ success: boolean; data?: unknown; error?: string }>>
    extendContent: (params: { outline: Array<{ title: string; content?: string }>; topic: string; audience?: string; style?: string }) => Promise<AxiosResponse<{ success: boolean; data?: unknown; error?: string }>>
    generateSpeakerNotes: (params: { slides: Array<{ title: string; content: string; bullet_points?: string[] }>; total_duration?: number }) => Promise<AxiosResponse<{ success: boolean; data?: unknown; error?: string }>>
    checkDesignConsistency: (params: { slides: Array<{ title: string; content: string; design_info?: unknown }>; style_theme?: string; brand_colors?: string[] }) => Promise<AxiosResponse<{ success: boolean; data?: unknown; error?: string }>>
    professionalPolish: (params: { slides: Array<{ title: string; content: string; bullet_points?: string[] }>; target_style?: string; use_case?: string }) => Promise<AxiosResponse<{ success: boolean; data?: unknown; error?: string }>>
    generateScriptContent: (params: { content_type: string; topic: string; scene?: string; slide_count?: number; audience?: string; brief_description?: string }) => Promise<AxiosResponse<{ success: boolean; data?: unknown; error?: string }>>
  }
}

/** 幻灯片注解（用于保存） */
export interface SlideAnnotation {
  id?: string
  type: string
  x: number
  y: number
  width?: number
  height?: number
  content?: string
  style?: Record<string, unknown>
}

// ==================== 品牌资产 ====================

export interface Brand {
  brand_id: string
  user_id: string
  name: string
  logo_url: string | null
  primary_color: string
  secondary_color: string
  font_family: string
  created_at: string
  updated_at: string
}

export interface BrandPreview {
  brand_id: string
  name: string
  logo_url: string | null
  colors: {
    primary: string
    secondary: string
  }
  font_family: string
  preview_style: {
    background: string
    primary_color: string
    secondary_color: string
    font_family: string
  }
}
