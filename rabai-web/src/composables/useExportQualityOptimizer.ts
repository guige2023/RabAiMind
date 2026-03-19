// Export quality optimization composable
import { ref, computed } from 'vue'

export interface ExportQualityConfig {
  resolution: number
  dpi: number
  compression: 'none' | 'low' | 'medium' | 'high'
  format: 'pptx' | 'pdf' | 'png' | 'jpg'
  includeNotes: boolean
  includeHiddenSlides: boolean
  colorProfile: 'sRGB' | 'CMYK' | 'RGB'
}

export interface ExportPreset {
  id: string
  name: string
  description: string
  icon: string
  config: ExportQualityConfig
}

export const exportPresets: ExportPreset[] = [
  {
    id: 'screen',
    name: '屏幕演示',
    description: '适合屏幕展示，文件较小',
    icon: '🖥️',
    config: {
      resolution: 1920,
      dpi: 72,
      compression: 'medium',
      format: 'pptx',
      includeNotes: false,
      includeHiddenSlides: false,
      colorProfile: 'RGB'
    }
  },
  {
    id: 'print',
    name: '打印输出',
    description: '适合A4/A3打印，清晰度高',
    icon: '🖨️',
    config: {
      resolution: 3000,
      dpi: 300,
      compression: 'low',
      format: 'pdf',
      includeNotes: true,
      includeHiddenSlides: false,
      colorProfile: 'CMYK'
    }
  },
  {
    id: 'presentation',
    name: '高清演示',
    description: '4K投影仪演示，超清画质',
    icon: '🎬',
    config: {
      resolution: 3840,
      dpi: 150,
      compression: 'none',
      format: 'pptx',
      includeNotes: false,
      includeHiddenSlides: true,
      colorProfile: 'RGB'
    }
  },
  {
    id: 'social',
    name: '社交媒体',
    description: '适合分享到社交平台的图片',
    icon: '📱',
    config: {
      resolution: 2048,
      dpi: 96,
      compression: 'high',
      format: 'png',
      includeNotes: false,
      includeHiddenSlides: false,
      colorProfile: 'sRGB'
    }
  },
  {
    id: 'archive',
    name: '归档保存',
    description: '高质量归档，最完整保留',
    icon: '📦',
    config: {
      resolution: 4096,
      dpi: 400,
      compression: 'none',
      format: 'pdf',
      includeNotes: true,
      includeHiddenSlides: true,
      colorProfile: 'RGB'
    }
  }
]

export function useExportQualityOptimizer() {
  const selectedPreset = ref<string>('screen')
  const customConfig = ref<ExportQualityConfig>({
    resolution: 1920,
    dpi: 72,
    compression: 'medium',
    format: 'pptx',
    includeNotes: false,
    includeHiddenSlides: false,
    colorProfile: 'RGB'
  })

  const isCustomMode = ref(false)
  const isExporting = ref(false)
  const exportProgress = ref(0)

  // 当前配置
  const currentConfig = computed((): ExportQualityConfig => {
    if (isCustomMode.value) {
      return customConfig.value
    }
    const preset = exportPresets.find(p => p.id === selectedPreset.value)
    return preset?.config || exportPresets[0].config
  })

  // 预估文件大小
  const estimatedFileSize = computed(() => {
    const { resolution, dpi, compression, format } = currentConfig.value

    // 估算公式（简化）
    let baseSize = (resolution * dpi) / 1000
    if (format === 'pdf') baseSize *= 1.5
    if (format === 'png' || format === 'jpg') baseSize *= 0.8

    const compressionFactor = {
      none: 1,
      low: 0.7,
      medium: 0.5,
      high: 0.3
    }

    const size = baseSize * (compressionFactor[compression] || 0.5) * 10
    return `${size.toFixed(1)} MB`
  })

  // 选择预设
  const selectPreset = (presetId: string) => {
    selectedPreset.value = presetId
    isCustomMode.value = false
  }

  // 启用自定义模式
  const enableCustomMode = () => {
    isCustomMode.value = true
  }

  // 更新自定义配置
  const updateCustomConfig = (updates: Partial<ExportQualityConfig>) => {
    customConfig.value = { ...customConfig.value, ...updates }
  }

  // 执行导出
  const exportWithConfig = async (
    content: any,
    filename: string
  ): Promise<{ success: boolean; url?: string; error?: string }> => {
    isExporting.value = true
    exportProgress.value = 0

    try {
      // 模拟导出进度
      for (let i = 0; i <= 100; i += 5) {
        await new Promise(resolve => setTimeout(resolve, 50))
        exportProgress.value = i
      }

      const config = currentConfig.value
      const blob = new Blob([JSON.stringify({
        content,
        config,
        exportedAt: new Date().toISOString()
      })], { type: 'application/octet-stream' })

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}.${config.format}`
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

  // 获取导出质量描述
  const getQualityDescription = (): string => {
    const { resolution, dpi } = currentConfig.value
    if (dpi >= 300) return '打印质量'
    if (resolution >= 3000) return '高清质量'
    return '标准质量'
  }

  return {
    selectedPreset,
    customConfig,
    isCustomMode,
    isExporting,
    exportProgress,
    currentConfig,
    estimatedFileSize,
    selectPreset,
    enableCustomMode,
    updateCustomConfig,
    exportWithConfig,
    getQualityDescription
  }
}

export default useExportQualityOptimizer
