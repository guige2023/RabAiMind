// Export formats composable - 导出格式功能
import { ref, computed } from 'vue'

export type ExportFormat = 'pptx' | 'pdf' | 'png' | 'jpg' | 'html' | 'md' | 'docx' | 'json'
export type ExportQuality = 'standard' | 'high' | 'ultra'
export type ExportTheme = 'light' | 'dark' | 'auto'

export interface ExportOption {
  id: ExportFormat
  name: string
  extension: string
  mimeType: string
  description: string
  icon: string
  quality?: boolean
  theme?: boolean
  maxSlides?: number
}

export interface ExportConfig {
  format: ExportFormat
  quality: ExportQuality
  theme: ExportTheme
  slides?: number[] // 指定页面，为空则导出全部
  includeNotes: boolean
  compress: boolean
}

// 可用的导出格式
export const exportFormats: ExportOption[] = [
  {
    id: 'pptx',
    name: 'PowerPoint',
    extension: 'pptx',
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    description: 'Microsoft PowerPoint 演示文稿',
    icon: '📊',
    quality: true,
    theme: true
  },
  {
    id: 'pdf',
    name: 'PDF文档',
    extension: 'pdf',
    mimeType: 'application/pdf',
    description: 'Adobe PDF 便携文档',
    icon: '📄',
    quality: true,
    theme: true
  },
  {
    id: 'png',
    name: 'PNG图片',
    extension: 'png',
    mimeType: 'image/png',
    description: '高清PNG图片（每页一张）',
    icon: '🖼️',
    quality: true
  },
  {
    id: 'jpg',
    name: 'JPG图片',
    extension: 'jpg',
    mimeType: 'image/jpeg',
    description: 'JPEG图片（每页一张）',
    icon: '📷',
    quality: true
  },
  {
    id: 'html',
    name: 'HTML网页',
    extension: 'html',
    mimeType: 'text/html',
    description: '可交互的HTML网页',
    icon: '🌐'
  },
  {
    id: 'md',
    name: 'Markdown',
    extension: 'md',
    mimeType: 'text/markdown',
    description: 'Markdown格式大纲',
    icon: '📝'
  },
  {
    id: 'docx',
    name: 'Word文档',
    extension: 'docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    description: 'Microsoft Word 文档',
    icon: '📃'
  },
  {
    id: 'json',
    name: 'JSON数据',
    extension: 'json',
    mimeType: 'application/json',
    description: 'JSON格式原始数据',
    icon: '💾'
  }
]

// 质量选项
export const qualityOptions = [
  { id: 'standard', name: '标准', description: '适合屏幕展示', dpi: 72 },
  { id: 'high', name: '高清', description: '适合打印输出', dpi: 150 },
  { id: 'ultra', name: '超清', description: '适合高质量印刷', dpi: 300 }
]

// 主题选项
export const themeOptions = [
  { id: 'light', name: '亮色', icon: '☀️' },
  { id: 'dark', name: '暗色', icon: '🌙' },
  { id: 'auto', name: '自动', icon: '⚡' }
]

// 生成导出配置
export function useExportFormats() {
  const selectedFormat = ref<ExportFormat>('pptx')
  const selectedQuality = ref<ExportQuality>('high')
  const selectedTheme = ref<ExportTheme>('light')
  const includeNotes = ref(false)
  const compressOutput = ref(false)
  const selectedSlides = ref<number[]>([])
  const isExporting = ref(false)
  const exportProgress = ref(0)

  // 当前格式详情
  const currentFormat = computed(() =>
    exportFormats.find(f => f.id === selectedFormat.value)
  )

  // 当前质量详情
  const currentQuality = computed(() =>
    qualityOptions.find(q => q.id === selectedQuality.value)
  )

  // 是否支持指定页面
  const supportsSlideSelection = computed(() =>
    ['png', 'jpg', 'pdf'].includes(selectedFormat.value)
  )

  // 是否支持主题
  const supportsTheme = computed(() =>
    currentFormat.value?.theme === true
  )

  // 是否支持质量选项
  const supportsQuality = computed(() =>
    currentFormat.value?.quality === true
  )

  // 获取导出配置
  const getExportConfig = (): ExportConfig => ({
    format: selectedFormat.value,
    quality: selectedQuality.value,
    theme: selectedTheme.value,
    slides: selectedSlides.value.length > 0 ? selectedSlides.value : undefined,
    includeNotes: includeNotes.value,
    compress: compressOutput.value
  })

  // 导出文件（模拟）
  const exportFile = async (
    content: any,
    filename: string
  ): Promise<{ success: boolean; url?: string; error?: string }> => {
    isExporting.value = true
    exportProgress.value = 0

    try {
      const format = currentFormat.value
      if (!format) {
        throw new Error('未选择导出格式')
      }

      // 模拟导出进度
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 100))
        exportProgress.value = i
      }

      // 创建下载链接（实际应该调用API）
      const blob = new Blob([JSON.stringify(content)], {
        type: format.mimeType
      })
      const url = URL.createObjectURL(blob)

      // 触发下载
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}.${format.extension}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      return { success: true, url }
    } catch (e: any) {
      return { success: false, error: e.message }
    } finally {
      isExporting.value = false
      exportProgress.value = 0
    }
  }

  // 批量导出
  const batchExport = async (
    items: Array<{ content: any; filename: string }>
  ): Promise<{ success: number; failed: number }> => {
    let success = 0
    let failed = 0

    for (const item of items) {
      const result = await exportFile(item.content, item.filename)
      if (result.success) {
        success++
      } else {
        failed++
      }
    }

    return { success, failed }
  }

  // 导出为不同格式
  const exportAs = async (
    content: any,
    filename: string,
    format: ExportFormat,
    options?: Partial<ExportConfig>
  ): Promise<{ success: boolean; url?: string; error?: string }> => {
    // 保存当前选择
    const originalFormat = selectedFormat.value

    // 临时更改格式
    selectedFormat.value = format

    // 应用选项
    if (options?.quality) selectedQuality.value = options.quality
    if (options?.theme) selectedTheme.value = options.theme
    if (options?.includeNotes !== undefined) includeNotes.value = options.includeNotes

    // 导出
    const result = await exportFile(content, filename)

    // 恢复原始选择
    selectedFormat.value = originalFormat

    return result
  }

  // 获取格式对应的MIME类型
  const getMimeType = (format: ExportFormat): string => {
    const fmt = exportFormats.find(f => f.id === format)
    return fmt?.mimeType || 'application/octet-stream'
  }

  // 验证导出配置
  const validateConfig = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = []

    if (!selectedFormat.value) {
      errors.push('请选择导出格式')
    }

    if (supportsSlideSelection.value && selectedSlides.value.length === 0) {
      errors.push('请选择要导出的页面')
    }

    return { valid: errors.length === 0, errors }
  }

  // 分享链接（生成临时下载链接）
  const generateShareLink = async (
    content: any,
    expiresInHours: number = 24
  ): Promise<{ url: string; expiresAt: string }> => {
    // 模拟生成分享链接（实际应该调用API存储内容）
    const shareId = Math.random().toString(36).substring(2, 15)
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000)

    // 存储到本地（模拟）
    localStorage.setItem(`share_${shareId}`, JSON.stringify(content))

    const shareUrl = `${window.location.origin}/share/${shareId}`

    return { url: shareUrl, expiresAt: expiresAt.toISOString() }
  }

  return {
    // 状态
    selectedFormat,
    selectedQuality,
    selectedTheme,
    includeNotes,
    compressOutput,
    selectedSlides,
    isExporting,
    exportProgress,
    // 计算属性
    currentFormat,
    currentQuality,
    supportsSlideSelection,
    supportsTheme,
    supportsQuality,
    // 方法
    getExportConfig,
    exportFile,
    batchExport,
    exportAs,
    getMimeType,
    validateConfig,
    generateShareLink
  }
}

export default useExportFormats
