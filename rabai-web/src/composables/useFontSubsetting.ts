// Font Subsetting - 字体子集化优化
import { ref, computed } from 'vue'

export interface SubsetConfig {
  fontId: string
  fontFamily: string
  unicodeRanges: string[]
  includeBaseLatin: boolean
  includeNumbers: boolean
  includePunctuation: boolean
  includeSymbols: boolean
  customChars?: string
}

export interface SubsetResult {
  fontId: string
  originalSize: number
  subsetSize: number
  savings: number
  charsCount: number
  coverage: number
}

export interface SubsetPreset {
  id: string
  name: string
  nameEn: string
  description: string
  unicodeRanges: string[]
  includes: {
    baseLatin: boolean
    numbers: boolean
    punctuation: boolean
    symbols: boolean
    cjk: boolean
  }
}

export interface FontGlyph {
  unicode: number
  name: string
  advanceWidth: number
  path?: string
}

export function useFontSubsetting() {
  // 子集化配置
  const configs = ref<SubsetConfig[]>([])

  // 子集化结果
  const results = ref<SubsetResult[]>([])

  // 子集化预设
  const presets = ref<SubsetPreset[]>([
    { id: 'preset_basic', name: '基础拉丁', nameEn: 'Basic Latin', description: '仅包含基本拉丁字母', unicodeRanges: ['U+0020-007F'], includes: { baseLatin: true, numbers: false, punctuation: false, symbols: false, cjk: false } },
    { id: 'preset_latin_ext', name: '扩展拉丁', nameEn: 'Latin Extended', description: '包含扩展拉丁字符', unicodeRanges: ['U+0020-007F', 'U+0080-00FF', 'U+0100-017F'], includes: { baseLatin: true, numbers: true, punctuation: true, symbols: true, cjk: false } },
    { id: 'preset_cjk_basic', name: '基础中文', nameEn: 'Basic CJK', description: '常用汉字+拉丁', unicodeRanges: ['U+0020-007F', 'U+4E00-5FFF'], includes: { baseLatin: true, numbers: true, punctuation: true, symbols: true, cjk: true } },
    { id: 'preset_cjk_full', name: '完整中文', nameEn: 'Full CJK', description: '完整GBK汉字', unicodeRanges: ['U+0020-007F', 'U+4E00-9FFF'], includes: { baseLatin: true, numbers: true, punctuation: true, symbols: true, cjk: true } },
    { id: 'preset_numbers', name: '数字+标点', nameEn: 'Numbers & Punctuation', description: '数字和常用标点', unicodeRanges: ['U+0020-007F', 'U+0030-0039', 'U+3000-303F'], includes: { baseLatin: true, numbers: true, punctuation: true, symbols: false, cjk: false } },
    { id: 'preset_symbols', name: '符号', nameEn: 'Symbols', description: '常用符号', unicodeRanges: ['U+2000-206F', 'U+2100-214F', 'U+2190-21FF'], includes: { baseLatin: false, numbers: false, punctuation: false, symbols: true, cjk: false } }
  ])

  // 分析文本获取所需字符
  const analyzeText = (text: string): Set<string> => {
    const chars = new Set<string>()

    for (const char of text) {
      chars.add(char)
    }

    return chars
  }

  // 获取Unicode范围
  const getUnicodeRanges = (config: SubsetConfig): string[] => {
    const ranges: string[] = []

    if (config.includeBaseLatin) {
      ranges.push('U+0020-007F')
    }

    if (config.includeNumbers) {
      ranges.push('U+0030-0039')
    }

    if (config.includePunctuation) {
      ranges.push('U+2000-203F', 'U+3000-303F')
    }

    if (config.includeSymbols) {
      ranges.push('U+2190-21FF', 'U+2600-26FF')
    }

    if (config.unicodeRanges) {
      ranges.push(...config.unicodeRanges)
    }

    return [...new Set(ranges)]
  }

  // 计算子集大小（模拟）
  const calculateSubsetSize = (config: SubsetConfig, text: string): SubsetResult => {
    const chars = analyzeText(text)
    const charsCount = chars.size

    // 估算原始大小 (假设完整中文字体约5MB)
    const originalSize = 5 * 1024 * 1024

    // 根据字符数估算子集大小
    const avgGlyphSize = 500 // bytes per glyph
    const subsetSize = charsCount * avgGlyphSize

    const savings = ((originalSize - subsetSize) / originalSize * 100).toFixed(1)

    // 估算覆盖率
    const totalCJK = 10000 // 常用汉字数量
    const coverage = (charsCount / totalCJK * 100).toFixed(1)

    const result: SubsetResult = {
      fontId: config.fontId,
      originalSize,
      subsetSize,
      savings: parseFloat(savings),
      charsCount,
      coverage: parseFloat(coverage)
    }

    results.value.push(result)
    return result
  }

  // 生成子集字体（模拟）
  const generateSubset = async (config: SubsetConfig): Promise<SubsetResult> => {
    // 模拟处理时间
    await new Promise(r => setTimeout(r, 500))

    // 使用预设计算
    const preset = presets.value.find(p => {
      const rangesMatch = p.unicodeRanges.some(r => config.unicodeRanges.includes(r))
      return rangesMatch || config.unicodeRanges.length === 0
    })

    // 生成示例字符集
    let sampleText = ''
    if (config.includeBaseLatin) {
      sampleText += 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
    }
    if (config.includeNumbers) {
      sampleText += '0123456789'
    }
    if (config.includePunctuation) {
      sampleText += '，。、；：？！（）【】《》—…·'
    }
    if (config.customChars) {
      sampleText += config.customChars
    }

    return calculateSubsetSize(config, sampleText || '示例文本')
  }

  // 应用预设
  const applyPreset = (fontId: string, presetId: string): SubsetConfig | null => {
    const preset = presets.value.find(p => p.id === presetId)
    if (!preset) return null

    const config: SubsetConfig = {
      fontId,
      fontFamily: '',
      unicodeRanges: [...preset.unicodeRanges],
      includeBaseLatin: preset.includes.baseLatin,
      includeNumbers: preset.includes.numbers,
      includePunctuation: preset.includes.punctuation,
      includeSymbols: preset.includes.symbols
    }

    configs.value.push(config)
    return config
  }

  // 添加自定义字符
  const addCustomChars = (configId: string, chars: string): boolean => {
    const config = configs.value.find(c => c.fontId === configId)
    if (!config) return false

    config.customChars = (config.customChars || '') + chars
    return true
  }

  // 移除配置
  const removeConfig = (fontId: string): boolean => {
    const index = configs.value.findIndex(c => c.fontId === fontId)
    if (index > -1) {
      configs.value.splice(index, 1)
      return true
    }
    return false
  }

  // 获取文本覆盖率
  const getTextCoverage = (text: string, config: SubsetConfig): number => {
    const requiredChars = analyzeText(text)
    const ranges = getUnicodeRanges(config)

    // 简化计算
    let covered = 0
    for (const char of requiredChars) {
      const code = char.charCodeAt(0)

      for (const range of ranges) {
        const match = range.match(/U\+([0-9A-F]+)-([0-9A-F]+)/i)
        if (match) {
          const start = parseInt(match[1], 16)
          const end = parseInt(match[2], 16)

          if (code >= start && code <= end) {
            covered++
            break
          }
        }
      }
    }

    return parseFloat((covered / requiredChars.size * 100).toFixed(1))
  }

  // 导出子集配置
  const exportConfig = (): string => {
    return JSON.stringify({
      configs: configs.value,
      results: results.value
    }, null, 2)
  }

  // 统计
  const stats = computed(() => ({
    totalConfigs: configs.value.length,
    totalResults: results.value.length,
    presetsCount: presets.value.length,
    averageSavings: results.value.length > 0
      ? results.value.reduce((sum, r) => sum + r.savings, 0) / results.value.length
      : 0
  }))

  return {
    configs,
    results,
    presets,
    analyzeText,
    getUnicodeRanges,
    calculateSubsetSize,
    generateSubset,
    applyPreset,
    addCustomChars,
    removeConfig,
    getTextCoverage,
    exportConfig,
    stats
  }
}

export default useFontSubsetting
