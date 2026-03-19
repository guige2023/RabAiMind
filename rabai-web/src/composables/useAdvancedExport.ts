// Enhanced Export Formats - 增强导出格式
import { ref, computed } from 'vue'
import { exportFormats as baseFormats, type ExportFormat, type ExportQuality, type ExportTheme } from './useExportFormats'

export type ExportCompression = 'none' | 'zip' | 'gzip'
export type ExportRange = 'all' | 'current' | 'range' | 'selection'

export interface AdvancedExportOption {
  id: ExportFormat | 'svg' | 'xps' | 'odp' | 'rtf'
  name: string
  extension: string
  mimeType: string
  description: string
  icon: string
  supportsQuality: boolean
  supportsTheme: boolean
  supportsRange: boolean
  supportsCompression: boolean
  maxFileSize?: number
}

export interface AdvancedExportConfig {
  format: ExportFormat | 'svg' | 'xps' | 'odp' | 'rtf'
  quality: ExportQuality
  theme: ExportTheme
  compression: ExportCompression
  range: ExportRange
  slides: number[]
  includeNotes: boolean
  includeSpeakerNotes: boolean
  embedFonts: boolean
  flattenAnimations: boolean
  optimizeForWeb: boolean
}

// 增强的导出格式
export const advancedExportFormats: AdvancedExportOption[] = [
  ...baseFormats.map(f => ({
    id: f.id,
    name: f.name,
    extension: f.extension,
    mimeType: f.mimeType,
    description: f.description,
    icon: f.icon,
    supportsQuality: f.quality || false,
    supportsTheme: f.theme || false,
    supportsRange: ['png', 'jpg', 'pdf'].includes(f.id),
    supportsCompression: ['pptx', 'pdf', 'html'].includes(f.id)
  })),
  // 新增格式
  {
    id: 'svg',
    name: 'SVG矢量图',
    extension: 'svg',
    mimeType: 'image/svg+xml',
    description: '可缩放矢量图形，适合印刷和设计',
    icon: '📐',
    supportsQuality: false,
    supportsTheme: true,
    supportsRange: true,
    supportsCompression: false
  },
  {
    id: 'xps',
    name: 'XPS文档',
    extension: 'xps',
    mimeType: 'application/vnd.ms-xpsdocument',
    description: 'Windows XPS 文档格式',
    icon: '📑',
    supportsQuality: true,
    supportsTheme: true,
    supportsRange: false,
    supportsCompression: true
  },
  {
    id: 'odp',
    name: 'OpenDocument',
    extension: 'odp',
    mimeType: 'application/vnd.oasis.opendocument.presentation',
    description: 'LibreOffice/OpenOffice 演示文稿',
    icon: '🌊',
    supportsQuality: false,
    supportsTheme: true,
    supportsRange: false,
    supportsCompression: true
  },
  {
    id: 'rtf',
    name: 'RTF富文本',
    extension: 'rtf',
    mimeType: 'application/rtf',
    description: '富文本格式，兼容性好',
    icon: '📄',
    supportsQuality: false,
    supportsTheme: false,
    supportsRange: false,
    supportsCompression: false
  }
]

// 压缩选项
export const compressionOptions = [
  { id: 'none', name: '不压缩', description: '直接导出原始文件', icon: '📦' },
  { id: 'zip', name: 'ZIP压缩', description: '打包为ZIP文件', icon: '🗜️' },
  { id: 'gzip', name: 'GZIP压缩', description: '适合网页传输', icon: '📚' }
]

// 导出范围选项
export const rangeOptions = [
  { id: 'all', name: '全部页面', description: '导出所有幻灯片', icon: '📚' },
  { id: 'current', name: '当前页', description: '仅导出当前幻灯片', icon: '📄' },
  { id: 'range', name: '页面范围', description: '指定起始和结束页', icon: '📋' },
  { id: 'selection', name: '选中页面', description: '导出选中的幻灯片', icon: '☑️' }
]

// 性能优化预设
export const performancePresets = [
  { id: 'speed', name: '速度优先', description: '快速导出，适合预览', quality: 72, compress: true },
  { id: 'balanced', name: '均衡模式', description: '质量和速度平衡', quality: 150, compress: false },
  { id: 'quality', name: '质量优先', description: '最高质量，适合印刷', quality: 300, compress: false }
]

export function useAdvancedExport() {
  // 基础状态
  const selectedFormat = ref<ExportFormat | 'svg' | 'xps' | 'odp' | 'rtf'>('pptx')
  const selectedQuality = ref<ExportQuality>('high')
  const selectedTheme = ref<ExportTheme>('light')
  const selectedCompression = ref<ExportCompression>('none')
  const selectedRange = ref<ExportRange>('all')
  const selectedSlides = ref<number[]>([])
  const slideRangeStart = ref(1)
  const slideRangeEnd = ref(10)

  // 高级选项
  const includeNotes = ref(false)
  const includeSpeakerNotes = ref(false)
  const embedFonts = ref(true)
  const flattenAnimations = ref(false)
  const optimizeForWeb = ref(false)

  // 导出状态
  const isExporting = ref(false)
  const exportProgress = ref(0)
  const exportQueue = ref<AdvancedExportConfig[]>([])
  const currentExportTask = ref<AdvancedExportConfig | null>(null)

  // 当前格式详情
  const currentFormat = computed(() =>
    advancedExportFormats.find(f => f.id === selectedFormat.value)
  )

  // 实际使用的质量值
  const effectiveQuality = computed(() => {
    const preset = performancePresets.find(p => p.id === selectedQuality.value)
    return preset?.quality || 150
  })

  // 获取导出配置
  const getExportConfig = (): AdvancedExportConfig => {
    let slides: number[] = []

    switch (selectedRange.value) {
      case 'all':
        slides = []
        break
      case 'current':
        slides = [0]
        break
      case 'range':
        slides = Array.from(
          { length: slideRangeEnd.value - slideRangeStart.value + 1 },
          (_, i) => slideRangeStart.value + i
        )
        break
      case 'selection':
        slides = selectedSlides.value
        break
    }

    return {
      format: selectedFormat.value,
      quality: selectedQuality.value,
      theme: selectedTheme.value,
      compression: selectedCompression.value,
      range: selectedRange.value,
      slides,
      includeNotes: includeNotes.value,
      includeSpeakerNotes: includeSpeakerNotes.value,
      embedFonts: embedFonts.value,
      flattenAnimations: flattenAnimations.value,
      optimizeForWeb: optimizeForWeb.value
    }
  }

  // 设置预设
  const applyPreset = (presetId: string) => {
    const preset = performancePresets.find(p => p.id === presetId)
    if (preset) {
      selectedQuality.value = preset.id as ExportQuality
      selectedCompression.value = preset.compress ? 'zip' : 'none'
    }
  }

  // 智能选择最佳格式
  const suggestBestFormat = (useCase: 'sharing' | 'printing' | 'editing' | 'web'): ExportFormat | 'svg' | 'xps' | 'odp' | 'rtf' => {
    switch (useCase) {
      case 'sharing':
        return 'pdf'
      case 'printing':
        return 'pdf'
      case 'editing':
        return 'pptx'
      case 'web':
        return 'html'
      default:
        return 'pptx'
    }
  }

  // 导出文件
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
      for (let i = 0; i <= 100; i += 5) {
        await new Promise(resolve => setTimeout(resolve, 50))
        exportProgress.value = i
      }

      // 创建下载链接
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

  // 添加到导出队列
  const queueExport = (config: AdvancedExportConfig, filename: string) => {
    exportQueue.value.push(config)
  }

  // 处理导出队列
  const processQueue = async (): Promise<{ success: number; failed: number }> => {
    let success = 0
    let failed = 0

    while (exportQueue.value.length > 0) {
      const config = exportQueue.value.shift()
      if (config) {
        currentExportTask.value = config
        const result = await exportFile(config, `export_${Date.now()}`)
        if (result.success) {
          success++
        } else {
          failed++
        }
      }
    }

    currentExportTask.value = null
    return { success, failed }
  }

  // 批量导出
  const batchExport = async (
    items: Array<{ content: any; filename: string; config?: Partial<AdvancedExportConfig> }>
  ): Promise<{ success: number; failed: number }> => {
    let success = 0
    let failed = 0

    for (const item of items) {
      const baseConfig = getExportConfig()
      const config = { ...baseConfig, ...item.config }
      const result = await exportFile(item.content, item.filename)

      if (result.success) {
        success++
      } else {
        failed++
      }
    }

    return { success, failed }
  }

  // 导出为多种格式
  const exportToMultipleFormats = async (
    content: any,
    filename: string,
    formats: Array<ExportFormat | 'svg' | 'xps' | 'odp' | 'rtf'>
  ): Promise<{ success: number; failed: number; results: Array<{ format: string; success: boolean }> }> => {
    let success = 0
    let failed = 0
    const results: Array<{ format: string; success: boolean }> = []

    const originalFormat = selectedFormat.value

    for (const fmt of formats) {
      selectedFormat.value = fmt
      const result = await exportFile(content, `${filename}_${fmt}`)
      results.push({ format: fmt, success: result.success })

      if (result.success) {
        success++
      } else {
        failed++
      }
    }

    selectedFormat.value = originalFormat
    return { success, failed, results }
  }

  // 重置选项
  const resetOptions = () => {
    selectedFormat.value = 'pptx'
    selectedQuality.value = 'high'
    selectedTheme.value = 'light'
    selectedCompression.value = 'none'
    selectedRange.value = 'all'
    selectedSlides.value = []
    includeNotes.value = false
    includeSpeakerNotes.value = false
    embedFonts.value = true
    flattenAnimations.value = false
    optimizeForWeb.value = false
  }

  return {
    // 状态
    selectedFormat,
    selectedQuality,
    selectedTheme,
    selectedCompression,
    selectedRange,
    selectedSlides,
    slideRangeStart,
    slideRangeEnd,
    includeNotes,
    includeSpeakerNotes,
    embedFonts,
    flattenAnimations,
    optimizeForWeb,
    isExporting,
    exportProgress,
    exportQueue,
    currentExportTask,
    // 计算属性
    currentFormat,
    effectiveQuality,
    // 方法
    getExportConfig,
    applyPreset,
    suggestBestFormat,
    exportFile,
    queueExport,
    processQueue,
    batchExport,
    exportToMultipleFormats,
    resetOptions
  }
}

export default useAdvancedExport
