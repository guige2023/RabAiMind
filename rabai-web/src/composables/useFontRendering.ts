// Font Rendering Optimization - 字体渲染优化
import { ref, computed, watch } from 'vue'

export interface FontRenderingSettings {
  antialias: 'default' | 'none' | 'antialiased' | 'subpixel-antialiased'
  fontSmooth: 'auto' | 'never' | 'always'
  textRender: 'optimizeSpeed' | 'optimizeLegibility' | 'geometricPrecision'
  hinting: 'none' | 'slight' | 'medium' | 'full'
  subpixelRendering: boolean
  ligatures: boolean
  kerning: boolean
}

export interface FontQuality {
  level: 'low' | 'medium' | 'high' | 'ultra'
  description: string
  settings: FontRenderingSettings
}

export function useFontRendering() {
  // 当前渲染设置
  const settings = ref<FontRenderingSettings>({
    antialias: 'antialiased',
    fontSmooth: 'always',
    textRender: 'optimizeLegibility',
    hinting: 'medium',
    subpixelRendering: true,
    ligatures: true,
    kerning: true
  })

  // 渲染质量级别
  const qualityPresets = ref<FontQuality[]>([
    { level: 'low', description: '省电模式', settings: { antialias: 'none', fontSmooth: 'never', textRender: 'optimizeSpeed', hinting: 'none', subpixelRendering: false, ligatures: false, kerning: false } },
    { level: 'medium', description: '均衡模式', settings: { antialias: 'default', fontSmooth: 'auto', textRender: 'optimizeLegibility', hinting: 'slight', subpixelRendering: false, ligatures: true, kerning: true } },
    { level: 'high', description: '清晰模式', settings: { antialias: 'antialiased', fontSmooth: 'always', textRender: 'optimizeLegibility', hinting: 'medium', subpixelRendering: true, ligatures: true, kerning: true } },
    { level: 'ultra', description: '超清模式', settings: { antialias: 'subpixel-antialiased', fontSmooth: 'always', textRender: 'geometricPrecision', hinting: 'full', subpixelRendering: true, ligatures: true, kerning: true } }
  ])

  // 当前质量级别
  const currentQuality = ref<FontQuality['level']>('high')

  // 浏览器支持检测
  const support = computed(() => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    return {
      canvas: !!ctx,
      fontLoading: 'FontFace' in window,
      textMetrics: !!ctx?.measureText,
      subpixel: false // 简化检测
    }
  })

  // 应用质量预设
  const applyQualityPreset = (level: FontQuality['level']) => {
    const preset = qualityPresets.value.find(q => q.level === level)
    if (preset) {
      currentQuality.value = level
      Object.assign(settings.value, preset.settings)
      applyToDOM()
    }
  }

  // 应用到DOM
  const applyToDOM = () => {
    const style = document.documentElement.style

    // 字体渲染设置
    style.webkitFontSmoothing = settings.value.antialias
    style.fontSmooth = settings.value.fontSmooth
    style.textRendering = settings.value.textRender

    // 应用CSS变量
    document.documentElement.style.setProperty('--font-antialias', settings.value.antialias)
    document.documentElement.style.setProperty('--font-hinting', settings.value.hinting)
    document.documentElement.style.setProperty('--font-ligatures', settings.value.ligatures ? 'normal' : 'none')
    document.documentElement.style.setProperty('--font-kerning', settings.value.kerning ? 'normal' : 'none')
  }

  // 文本清晰度测试
  const testClarity = (text: string, font: string): number => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return 0

    canvas.width = 200
    canvas.height = 50

    ctx.font = `24px "${font}"`
    ctx.fillStyle = '#000'
    ctx.textRendering = settings.value.textRender as any
    ctx.fillText(text, 10, 30)

    // 简单评估
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    let edgePixels = 0

    for (let y = 1; y < canvas.height - 1; y++) {
      for (let x = 1; x < canvas.width - 1; x++) {
        const i = (y * canvas.width + x) * 4
        const neighbors = [
          (y * canvas.width + x - 1) * 4,
          (y * canvas.width + x + 1) * 4,
          ((y - 1) * canvas.width + x) * 4,
          ((y + 1) * canvas.width + x) * 4
        ]

        const current = imageData.data[i]
        const avg = (imageData.data[neighbors[0]] + imageData.data[neighbors[1]] + imageData.data[neighbors[2]] + imageData.data[neighbors[3]]) / 4

        if (Math.abs(current - avg) > 10) edgePixels++
      }
    }

    return Math.min(100, Math.round((edgePixels / (canvas.width * canvas.height)) * 1000))
  }

  // 生成渲染CSS
  const generateCSS = computed(() => {
    return `
/* Font Rendering Optimization */
html {
  -webkit-font-smoothing: ${settings.value.antialias};
  -moz-osx-font-smoothing: ${settings.value.fontSmooth === 'always' ? 'grayscale' : 'auto'};
  font-smooth: ${settings.value.fontSmooth};
  text-rendering: ${settings.value.textRender};
  font-kerning: ${settings.value.kerning ? 'normal' : 'none'};
  font-variant-ligatures: ${settings.value.ligatures ? 'normal' : 'none'};
}

.text-optimized {
  -webkit-font-smoothing: ${settings.value.antialias};
  font-smooth: ${settings.value.fontSmooth};
  text-rendering: ${settings.value.textRender};
  -webkit-text-stroke: 0.3px;
}
`.trim()
  })

  // 更新单个设置
  const updateSetting = (key: keyof FontRenderingSettings, value: any) => {
    (settings.value as any)[key] = value
    applyToDOM()
  }

  // 检测屏幕DPI
  const detectDPI = (): number => {
    return window.devicePixelRatio || 1
  }

  // 根据DPI自动优化
  const autoOptimize = () => {
    const dpi = detectDPI()

    if (dpi >= 2) {
      applyQualityPreset('ultra')
    } else if (dpi >= 1.5) {
      applyQualityPreset('high')
    } else if (dpi >= 1) {
      applyQualityPreset('medium')
    } else {
      applyQualityPreset('low')
    }
  }

  // 统计
  const stats = computed(() => ({
    quality: currentQuality.value,
    antialias: settings.value.antialias,
    dpi: detectDPI(),
    subpixel: settings.value.subpixelRendering,
    ligatures: settings.value.ligatures
  }))

  // 初始化时应用设置
  applyToDOM()

  return {
    settings,
    qualityPresets,
    currentQuality,
    support,
    applyQualityPreset,
    applyToDOM,
    testClarity,
    generateCSS,
    updateSetting,
    autoOptimize,
    detectDPI,
    stats
  }
}

export default useFontRendering
