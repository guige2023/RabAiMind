// Verbal Modification Optimizer - 口头修改识别率优化
import { ref, computed, watch } from 'vue'

export type ModificationType = 'page' | 'text' | 'style' | 'element' | 'layout' | 'content' | 'animation' | 'transition' | 'unknown'

export interface ModificationCommand {
  id: string
  type: ModificationType
  pageNumber?: number
  elementIndex?: number
  action: 'modify' | 'add' | 'delete' | 'replace' | 'query' | 'move' | 'copy'
  value: string
  confidence: number
  rawText: string
  alternatives: string[]
}

export interface ParsedVoiceCommand {
  pageNumber: number | null
  action: string
  target: string
  value: string
  modifiers: string[]
  elementType?: string
  styleProperty?: string
  styleValue?: string
}

// 增强的动作关键词映射 - 包含更多变体和同义词
const actionKeywords: Record<string, { action: string; type: ModificationType; weight: number }> = {
  // 页面操作 - 多种表达方式
  '修改第': { action: 'modify', type: 'page', weight: 1.0 },
  '改一下第': { action: 'modify', type: 'page', weight: 0.9 },
  '改动第': { action: 'modify', type: 'page', weight: 0.9 },
  '第几页': { action: 'query', type: 'page', weight: 1.0 },
  '删除第': { action: 'delete', type: 'page', weight: 1.0 },
  '去掉第': { action: 'delete', type: 'page', weight: 0.9 },
  '移除第': { action: 'delete', type: 'page', weight: 0.9 },
  '添加第': { action: 'add', type: 'page', weight: 1.0 },
  '新建第': { action: 'add', type: 'page', weight: 1.0 },
  '增加第': { action: 'add', type: 'page', weight: 0.9 },
  '插入第': { action: 'add', type: 'page', weight: 0.9 },
  '复制第': { action: 'copy', type: 'page', weight: 1.0 },
  '移动第': { action: 'move', type: 'page', weight: 1.0 },

  // 文本操作 - 多种表达
  '修改文字': { action: 'modify', type: 'text', weight: 1.0 },
  '改文字': { action: 'modify', type: 'text', weight: 1.0 },
  '改文本': { action: 'modify', type: 'text', weight: 1.0 },
  '改一下文字': { action: 'modify', type: 'text', weight: 0.9 },
  '文字改成': { action: 'replace', type: 'text', weight: 1.0 },
  '文字改成': { action: 'replace', type: 'text', weight: 1.0 },
  '添加文字': { action: 'add', type: 'text', weight: 1.0 },
  '加文字': { action: 'add', type: 'text', weight: 0.9 },
  '删除文字': { action: 'delete', type: 'text', weight: 1.0 },
  '去掉文字': { action: 'delete', type: 'text', weight: 0.9 },
  '替换文字': { action: 'replace', type: 'text', weight: 1.0 },

  // 样式操作 - 颜色、字体、大小等
  '修改样式': { action: 'modify', type: 'style', weight: 1.0 },
  '改样式': { action: 'modify', type: 'style', weight: 1.0 },
  '改成': { action: 'replace', type: 'style', weight: 0.8 },
  '改成蓝色': { action: 'replace', type: 'style', weight: 1.0 },
  '改成红色': { action: 'replace', type: 'style', weight: 1.0 },
  '改成绿色': { action: 'replace', type: 'style', weight: 1.0 },
  '改成黑色': { action: 'replace', type: 'style', weight: 1.0 },
  '改成白色': { action: 'replace', type: 'style', weight: 1.0 },
  '改颜色': { action: 'modify', type: 'style', weight: 1.0 },
  '改字体': { action: 'modify', type: 'style', weight: 1.0 },
  '改大小': { action: 'modify', type: 'style', weight: 1.0 },
  '改背景': { action: 'modify', type: 'style', weight: 1.0 },
  '改透明度': { action: 'modify', type: 'style', weight: 1.0 },
  '改间距': { action: 'modify', type: 'style', weight: 1.0 },
  '字体变大': { action: 'modify', type: 'style', weight: 1.0 },
  '字体变小': { action: 'modify', type: 'style', weight: 1.0 },
  '字体加粗': { action: 'modify', type: 'style', weight: 1.0 },
  '字体变细': { action: 'modify', type: 'style', weight: 1.0 },

  // 元素操作
  '添加图片': { action: 'add', type: 'element', weight: 1.0 },
  '加图片': { action: 'add', type: 'element', weight: 0.9 },
  '删除图片': { action: 'delete', type: 'element', weight: 1.0 },
  '去掉图片': { action: 'delete', type: 'element', weight: 0.9 },
  '添加图表': { action: 'add', type: 'element', weight: 1.0 },
  '加图表': { action: 'add', type: 'element', weight: 0.9 },
  '删除图表': { action: 'delete', type: 'element', weight: 1.0 },
  '添加视频': { action: 'add', type: 'element', weight: 1.0 },
  '删除视频': { action: 'delete', type: 'element', weight: 1.0 },
  '添加形状': { action: 'add', type: 'element', weight: 1.0 },
  '添加图标': { action: 'add', type: 'element', weight: 1.0 },

  // 布局操作
  '修改布局': { action: 'modify', type: 'layout', weight: 1.0 },
  '改布局': { action: 'modify', type: 'layout', weight: 1.0 },
  '调整布局': { action: 'modify', type: 'layout', weight: 1.0 },
  '换布局': { action: 'replace', type: 'layout', weight: 1.0 },
  '改变布局': { action: 'modify', type: 'layout', weight: 0.9 },
  '重新布局': { action: 'modify', type: 'layout', weight: 0.9 },

  // 内容操作
  '修改内容': { action: 'modify', type: 'content', weight: 1.0 },
  '改内容': { action: 'modify', type: 'content', weight: 1.0 },
  '替换内容': { action: 'replace', type: 'content', weight: 1.0 },
  '更新内容': { action: 'modify', type: 'content', weight: 1.0 },

  // 动画操作
  '添加动画': { action: 'add', type: 'animation', weight: 1.0 },
  '删除动画': { action: 'delete', type: 'animation', weight: 1.0 },
  '修改动画': { action: 'modify', type: 'animation', weight: 1.0 },
  '换动画': { action: 'replace', type: 'animation', weight: 1.0 },

  // 过渡效果
  '添加过渡': { action: 'add', type: 'transition', weight: 1.0 },
  '删除过渡': { action: 'delete', type: 'transition', weight: 1.0 },
  '修改过渡': { action: 'modify', type: 'transition', weight: 1.0 }
}

// 增强的修饰词
const modifierKeywords: Record<string, { modifier: string; weight: number }> = {
  '再': { modifier: 'again', weight: 1.0 },
  '稍微': { modifier: 'slightly', weight: 0.8 },
  '一点': { modifier: 'slightly', weight: 0.8 },
  '一点点的': { modifier: 'slightly', weight: 0.7 },
  '大幅': { modifier: 'significantly', weight: 1.0 },
  '彻底的': { modifier: 'completely', weight: 1.0 },
  '稍微的': { modifier: 'slightly', weight: 0.7 },
  '轻轻的': { modifier: 'gently', weight: 0.7 },
  '重新': { modifier: 'again', weight: 1.0 },
  '再一次': { modifier: 'again', weight: 1.0 }
}

// 增强的数值词映射
const numberWords: Record<string, number> = {
  // 中文数字
  '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
  '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
  '十一': 11, '十二': 12, '十三': 13, '十四': 14, '十五': 15,
  '十六': 16, '十七': 17, '十八': 18, '十九': 19, '二十': 20,
  // 序数词
  '第一': 1, '第二': 2, '第三': 3, '第四': 4, '第五': 5,
  '第六': 6, '第七': 7, '第八': 8, '第九': 9, '第十': 10,
  // 量词
  '一页': 1, '两页': 2, '三页': 3, '四页': 4, '五页': 5,
  '六页': 6, '七页': 7, '八页': 8, '九页': 9, '十页': 10,
  // 口语化
  '第一页': 1, '第二页': 2, '第三页': 3, '第四页': 4, '第五页': 5,
  '第六页': 6, '第七页': 7, '第八页': 8, '第九页': 9, '第十页': 10
}

// 样式属性映射
const styleProperties: Record<string, string> = {
  '颜色': 'color',
  '背景色': 'background-color',
  '字体': 'font-family',
  '字号': 'font-size',
  '字体大小': 'font-size',
  '大小': 'size',
  '宽度': 'width',
  '高度': 'height',
  '透明度': 'opacity',
  '间距': 'gap',
  '内边距': 'padding',
  '外边距': 'margin',
  '边框': 'border',
  '圆角': 'border-radius',
  '对齐': 'text-align',
  '行高': 'line-height',
  '字重': 'font-weight',
  '加粗': 'font-weight',
  '斜体': 'font-style'
}

export function useVerbalModificationOptimizer() {
  // 解析历史
  const history = ref<ParsedVoiceCommand[]>([])

  // 修改历史
  const modifications = ref<ModificationCommand[]>([])

  // 识别统计
  const recognitionStats = ref({
    total: 0,
    success: 0,
    failure: 0,
    averageConfidence: 0
  })

  // 文本预处理
  const preprocessText = (text: string): string => {
    let processed = text.trim()
    // 移除多余空格
    processed = processed.replace(/\s+/g, ' ')
    // 移除常见前缀
    processed = processed.replace(/^(帮我|请|给我|我想|我要|能不能|可以不可以)/, '')
    return processed
  }

  // 智能提取页码
  const extractPageNumber = (text: string): number | null => {
    let processed = text

    // 首先检查阿拉伯数字
    const arabicMatch = processed.match(/第(\d+)[页张]/)
    if (arabicMatch) return parseInt(arabicMatch[1])

    // 检查"第X页"格式（无空格）
    const directMatch = processed.match(/第(\d+)页/)
    if (directMatch) return parseInt(directMatch[1])

    // 检查中文数字
    for (const [word, num] of Object.entries(numberWords)) {
      if (processed.includes(word)) {
        return num
      }
    }

    // 检查纯数字（在开头或跟在"页"后面）
    const pureNumber = processed.match(/^(\d+)|页(\d+)/)
    if (pureNumber) {
      return parseInt(pureNumber[1] || pureNumber[2])
    }

    return null
  }

  // 提取修饰词
  const extractModifiers = (text: string): string[] => {
    const modifiers: string[] = []
    let processed = text

    for (const [keyword, { modifier }] of Object.entries(modifierKeywords)) {
      if (processed.includes(keyword)) {
        modifiers.push(modifier)
        processed = processed.replace(keyword, '')
      }
    }

    return modifiers
  }

  // 识别动作和目标
  const recognizeAction = (text: string): { action: string; target: string; type: ModificationType; weight: number } => {
    let bestMatch = { action: '', target: '', type: 'unknown' as ModificationType, weight: 0 }

    // 按权重排序关键词
    const sortedKeywords = Object.entries(actionKeywords)
      .sort((a, b) => b[1].weight - a[1].weight)

    for (const [keyword, { action, type, weight }] of sortedKeywords) {
      if (text.includes(keyword)) {
        if (weight > bestMatch.weight) {
          bestMatch = { action, target: keyword, type, weight }
        }
      }
    }

    // 如果没有匹配到，尝试推断
    if (!bestMatch.action) {
      if (text.includes('删除') || text.includes('去掉') || text.includes('移除')) {
        bestMatch = { action: 'delete', target: '删除', type: 'unknown', weight: 0.5 }
      } else if (text.includes('添加') || text.includes('加') || text.includes('新增')) {
        bestMatch = { action: 'add', target: '添加', type: 'unknown', weight: 0.5 }
      } else if (text.includes('改') || text.includes('换') || text.includes('更新')) {
        bestMatch = { action: 'modify', target: '修改', type: 'unknown', weight: 0.5 }
      }
    }

    return bestMatch
  }

  // 提取样式属性和值
  const extractStyleInfo = (text: string): { property?: string; value?: string } => {
    for (const [keyword, property] of Object.entries(styleProperties)) {
      if (text.includes(keyword)) {
        // 尝试提取值
        const valueMatch = text.match(/[:为成是](\S+)/)
        return {
          property,
          value: valueMatch ? valueMatch[1] : ''
        }
      }
    }
    return {}
  }

  // 解析命令
  const parseCommand = (text: string): ParsedVoiceCommand => {
    const processed = preprocessText(text)

    const result: ParsedVoiceCommand = {
      pageNumber: null,
      action: '',
      target: '',
      value: '',
      modifiers: []
    }

    // 提取页码
    result.pageNumber = extractPageNumber(processed)

    // 提取修饰词
    result.modifiers = extractModifiers(processed)

    // 识别动作
    const actionResult = recognizeAction(processed)
    result.action = actionResult.action
    result.target = actionResult.target

    // 提取样式信息
    const styleInfo = extractStyleInfo(processed)
    result.styleProperty = styleInfo.property
    result.styleValue = styleInfo.value

    // 提取值（剩余文本）
    let valueText = processed
    valueText = valueText.replace(/第\d+[页张]/, '')
    valueText = valueText.replace(/的|要|请|帮我|给我们|把它|把这个|把那个/g, '')

    // 移除已识别的关键词
    for (const keyword of Object.keys(actionKeywords)) {
      valueText = valueText.replace(keyword, '')
    }

    result.value = valueText.trim()

    return result
  }

  // 创建修改命令（带置信度计算）
  const createModification = (text: string): ModificationCommand => {
    const parsed = parseCommand(text)

    // 确定修改类型
    let type: ModificationType = parsed.type || 'unknown'

    // 根据关键词判断类型
    if (parsed.target.includes('文字') || parsed.target.includes('文本')) {
      type = 'text'
    } else if (parsed.target.includes('样式') || parsed.target.includes('颜色') || parsed.target.includes('字体')) {
      type = 'style'
    } else if (parsed.target.includes('图片') || parsed.target.includes('图表') || parsed.target.includes('视频')) {
      type = 'element'
    } else if (parsed.target.includes('布局')) {
      type = 'layout'
    } else if (parsed.target.includes('内容')) {
      type = 'content'
    } else if (parsed.target.includes('动画')) {
      type = 'animation'
    } else if (parsed.target.includes('过渡')) {
      type = 'transition'
    } else if (parsed.pageNumber) {
      type = 'page'
    }

    // 计算置信度
    let confidence = 0.3 // 基础分

    if (parsed.pageNumber) confidence += 0.2
    if (parsed.action) confidence += 0.2
    if (parsed.value) confidence += 0.15
    if (parsed.modifiers.length > 0) confidence += 0.05
    if (parsed.styleProperty) confidence += 0.1

    // 生成替代理解
    const alternatives: string[] = []
    if (parsed.action === 'modify' && !parsed.target) {
      alternatives.push(`修改第${parsed.pageNumber || '?'}页的内容`)
    }
    if (parsed.action === 'add' && !parsed.target) {
      alternatives.push(`在第${parsed.pageNumber || '?'}页添加内容`)
    }

    const command: ModificationCommand = {
      id: `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      pageNumber: parsed.pageNumber || undefined,
      action: parsed.action as any,
      value: parsed.value,
      confidence: Math.min(confidence, 0.95),
      rawText: text,
      alternatives
    }

    // 更新统计
    recognitionStats.value.total++
    if (confidence >= 0.5) {
      recognitionStats.value.success++
    } else {
      recognitionStats.value.failure++
    }
    recognitionStats.value.averageConfidence =
      (recognitionStats.value.averageConfidence * (recognitionStats.value.total - 1) + confidence) /
      recognitionStats.value.total

    // 添加到历史
    history.value.push(parsed)
    modifications.value.push(command)

    // 限制历史数量
    if (history.value.length > 100) {
      history.value.shift()
      modifications.value.shift()
    }

    return command
  }

  // 批量解析
  const parseMultipleCommands = (texts: string[]): ModificationCommand[] => {
    return texts.map(text => createModification(text))
  }

  // 解析自然语言
  const parseNaturalLanguage = (text: string): ModificationCommand[] => {
    const commands: ModificationCommand[] = []

    // 按句子分割
    const sentences = text.split(/[,，。;；!！?？\n]/).filter(s => s.trim())

    for (const sentence of sentences) {
      if (sentence.trim().length > 2) {
        commands.push(createModification(sentence.trim()))
      }
    }

    return commands
  }

  // 验证命令
  const validateCommand = (command: ModificationCommand, totalPages: number): { valid: boolean; error?: string } => {
    if (!command.action) {
      return { valid: false, error: '未识别到操作' }
    }

    if (command.pageNumber !== undefined) {
      if (command.pageNumber < 1 || command.pageNumber > totalPages) {
        return { valid: false, error: `页码超出范围 (1-${totalPages})` }
      }
    }

    if (!command.value && command.action !== 'delete' && command.action !== 'query') {
      return { valid: false, error: '未提供修改内容' }
    }

    return { valid: true }
  }

  // 智能建议
  const getSuggestions = computed(() => [
    '修改第一页的标题文字',
    '把第三页改成蓝色',
    '在第五页添加一张图片',
    '删除第二页',
    '把第一页的字体改大',
    '给第四页换个布局',
    '添加动画效果',
    '修改第二页的背景色'
  ])

  // 获取统计
  const stats = computed(() => recognitionStats.value)

  // 清除历史
  const clearHistory = () => {
    history.value = []
    modifications.value = []
  }

  // 重置统计
  const resetStats = () => {
    recognitionStats.value = {
      total: 0,
      success: 0,
      failure: 0,
      averageConfidence: 0
    }
  }

  return {
    // 状态
    history,
    modifications,
    recognitionStats,
    // 方法
    preprocessText,
    extractPageNumber,
    extractModifiers,
    recognizeAction,
    extractStyleInfo,
    parseCommand,
    createModification,
    parseMultipleCommands,
    parseNaturalLanguage,
    validateCommand,
    // 数据
    getSuggestions,
    stats,
    clearHistory,
    resetStats
  }
}

export default useVerbalModificationOptimizer
