// Verbal Modification - 口头修改功能
import { ref, computed } from 'vue'

export type ModificationType = 'page' | 'text' | 'style' | 'element' | 'layout' | 'content' | 'unknown'

export interface ModificationCommand {
  id: string
  type: ModificationType
  pageNumber?: number
  elementIndex?: number
  action: string
  value: string
  confidence: number
  rawText: string
}

export interface ParsedVoiceCommand {
  pageNumber: number | null
  action: string
  target: string
  value: string
  modifiers: string[]
}

// 动作关键词映射
const actionKeywords: Record<string, { action: string; type: ModificationType }> = {
  // 页面操作
  '修改第': { action: 'modify', type: 'page' },
  '第几页': { action: 'query', type: 'page' },
  '删除第': { action: 'delete', type: 'page' },
  '添加第': { action: 'add', type: 'page' },
  '新建第': { action: 'add', type: 'page' },

  // 文本操作
  '修改文字': { action: 'modify', type: 'text' },
  '改文字': { action: 'modify', type: 'text' },
  '改文本': { action: 'modify', type: 'text' },
  '添加文字': { action: 'add', type: 'text' },
  '删除文字': { action: 'delete', type: 'text' },
  '替换文字': { action: 'replace', type: 'text' },

  // 样式操作
  '修改样式': { action: 'modify', type: 'style' },
  '改颜色': { action: 'modify', type: 'style' },
  '改字体': { action: 'modify', type: 'style' },
  '改大小': { action: 'modify', type: 'style' },
  '改背景': { action: 'modify', type: 'style' },

  // 元素操作
  '添加图片': { action: 'add', type: 'element' },
  '删除图片': { action: 'delete', type: 'element' },
  '添加图表': { action: 'add', type: 'element' },
  '删除图表': { action: 'delete', type: 'element' },

  // 布局操作
  '修改布局': { action: 'modify', type: 'layout' },
  '调整布局': { action: 'modify', type: 'layout' },
  '换布局': { action: 'replace', type: 'layout' },

  // 内容操作
  '修改内容': { action: 'modify', type: 'content' },
  '改内容': { action: 'modify', type: 'content' },
  '替换内容': { action: 'replace', type: 'content' }
}

// 修饰词
const modifierKeywords = ['再', '稍微', '一点', '大幅', '彻底', '稍微', '稍微']

// 数值词
const numberWords: Record<string, number> = {
  '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
  '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
  '第一': 1, '第二': 2, '第三': 3, '第四': 4, '第五': 5,
  '一页': 1, '两页': 2, '三页': 3, '四页': 4, '五页': 5
}

export function useVerbalModification() {
  // 解析历史
  const history = ref<ParsedVoiceCommand[]>([])

  // 修改历史
  const modifications = ref<ModificationCommand[]>([])

  // 解析语音命令
  const parseCommand = (text: string): ParsedVoiceCommand => {
    const result: ParsedVoiceCommand = {
      pageNumber: null,
      action: '',
      target: '',
      value: '',
      modifiers: []
    }

    let processedText = text.trim()

    // 提取页码
    const pageMatch = processedText.match(/第(\d+)[页张]/)
    if (pageMatch) {
      result.pageNumber = parseInt(pageMatch[1])
      processedText = processedText.replace(pageMatch[0], '')
    }

    // 提取中文数字页码
    for (const [word, num] of Object.entries(numberWords)) {
      if (processedText.includes(word) && word.includes('页')) {
        result.pageNumber = num
        break
      }
    }

    // 提取修饰词
    for (const mod of modifierKeywords) {
      if (processedText.includes(mod)) {
        result.modifiers.push(mod)
        processedText = processedText.replace(mod, '')
      }
    }

    // 识别动作
    for (const [keyword, { action }] of Object.entries(actionKeywords)) {
      if (processedText.includes(keyword)) {
        result.action = action
        result.target = keyword
        processedText = processedText.replace(keyword, '').trim()
        break
      }
    }

    // 剩余文本作为值
    result.value = processedText.replace(/的|要|请|帮我|给我/g, '').trim()

    // 如果没有识别到动作，尝试推断
    if (!result.action) {
      if (processedText.includes('删除') || processedText.includes('去掉')) {
        result.action = 'delete'
      } else if (processedText.includes('添加') || processedText.includes('加')) {
        result.action = 'add'
      } else if (processedText.includes('改') || processedText.includes('换')) {
        result.action = 'modify'
      }
    }

    return result
  }

  // 创建修改命令
  const createModification = (text: string): ModificationCommand => {
    const parsed = parseCommand(text)

    // 确定修改类型
    let type: ModificationType = 'unknown'
    for (const [, { type: t }] of Object.entries(actionKeywords)) {
      if (parsed.target.includes('文字') || parsed.target.includes('文本')) {
        type = 'text'
        break
      } else if (parsed.target.includes('样式') || parsed.target.includes('颜色') || parsed.target.includes('字体')) {
        type = 'style'
        break
      } else if (parsed.target.includes('图片') || parsed.target.includes('图表')) {
        type = 'element'
        break
      } else if (parsed.target.includes('布局')) {
        type = 'layout'
        break
      } else if (parsed.target.includes('内容')) {
        type = 'content'
        break
      } else if (parsed.pageNumber) {
        type = 'page'
        break
      }
    }

    // 计算置信度
    let confidence = 0.5
    if (parsed.pageNumber) confidence += 0.2
    if (parsed.action) confidence += 0.2
    if (parsed.value) confidence += 0.1

    const command: ModificationCommand = {
      id: `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      pageNumber: parsed.pageNumber || undefined,
      action: parsed.action,
      value: parsed.value,
      confidence,
      rawText: text
    }

    // 添加到历史
    history.value.push(parsed)
    modifications.value.push(command)

    // 限制历史数量
    if (history.value.length > 50) {
      history.value.shift()
      modifications.value.shift()
    }

    return command
  }

  // 执行修改
  const executeModification = (
    command: ModificationCommand,
    executeFn: (command: ModificationCommand) => Promise<boolean>
  ): Promise<boolean> => {
    return executeFn(command)
  }

  // 批量解析
  const parseMultipleCommands = (texts: string[]): ModificationCommand[] => {
    return texts.map(text => createModification(text))
  }

  // 解析自然语言修改请求
  const parseNaturalLanguage = (text: string): ModificationCommand[] => {
    const commands: ModificationCommand[] = []

    // 按句子分割
    const sentences = text.split(/[,，。;；!！?？]/).filter(s => s.trim())

    for (const sentence of sentences) {
      if (sentence.trim()) {
        commands.push(createModification(sentence.trim()))
      }
    }

    return commands
  }

  // 识别页码
  const extractPageNumber = (text: string): number | null => {
    // 阿拉伯数字
    const arabicMatch = text.match(/第(\d+)[页张]/)
    if (arabicMatch) return parseInt(arabicMatch[1])

    // 中文数字
    for (const [word, num] of Object.entries(numberWords)) {
      if (text.includes(word)) return num
    }

    return null
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

    if (!command.value && command.action !== 'delete') {
      return { valid: false, error: '未提供修改内容' }
    }

    return { valid: true }
  }

  // 获取修改建议
  const getSuggestions = computed(() => {
    return [
      '修改第一页的标题',
      '把第三页的文字改成蓝色',
      '在第五页添加一张图片',
      '删除第二页的第二段',
      '把第一页的字体改大一点',
      '给第四页换个布局'
    ]
  })

  // 常用命令模板
  const commandTemplates = computed(() => ({
    page: [
      '修改第{page}页',
      '删除第{page}页',
      '在第{page}页后添加新页',
      '复制第{page}页'
    ],
    text: [
      '修改第{page}页的文字：{content}',
      '在第{page}页添加文字：{content}',
      '删除第{page}页的第{index}段文字'
    ],
    style: [
      '把第{page}页的{element}改成{value}',
      '修改第{page}页的{property}为{value}',
      '给第{page}页的{element}添加{style}'
    ],
    element: [
      '在第{page}页添加{element}',
      '删除第{page}页的{element}',
      '替换第{page}页的第{index}个{element}'
    ]
  }))

  // 清除历史
  const clearHistory = () => {
    history.value = []
    modifications.value = []
  }

  return {
    // 状态
    history,
    modifications,
    // 方法
    parseCommand,
    createModification,
    executeModification,
    parseMultipleCommands,
    parseNaturalLanguage,
    extractPageNumber,
    validateCommand,
    // 数据
    getSuggestions,
    commandTemplates,
    clearHistory
  }
}

export default useVerbalModification
