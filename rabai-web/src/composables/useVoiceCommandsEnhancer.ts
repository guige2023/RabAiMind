// Voice Commands Enhancer - 增强语音命令支持
import { ref, computed } from 'vue'

export type VoiceCommandCategory = 'navigation' | 'creation' | 'editing' | 'style' | 'export' | 'system' | 'ai'

export interface VoiceCommand {
  id: string
  keywords: string[]
  category: VoiceCommandCategory
  action: string
  description: string
  example: string
  params?: Record<string, any>
}

export interface VoiceCommandResult {
  command: VoiceCommand | null
  matched: boolean
  confidence: number
  params: Record<string, any>
}

// 增强语音命令库
export const voiceCommands: VoiceCommand[] = [
  // 导航命令
  {
    id: 'nav_home',
    keywords: ['首页', '主页', '回家', '去首页', '回主页'],
    category: 'navigation',
    action: 'navigate.home',
    description: '返回首页',
    example: '去首页'
  },
  {
    id: 'nav_create',
    keywords: ['创建', '新建', '制作PPT', '开始创建', '新建PPT'],
    category: 'navigation',
    action: 'navigate.create',
    description: '创建新PPT',
    example: '创建一个PPT'
  },
  {
    id: 'nav_templates',
    keywords: ['模板', '模板市场', '浏览模板', '看模板'],
    category: 'navigation',
    action: 'navigate.templates',
    description: '打开模板市场',
    example: '打开模板市场'
  },
  {
    id: 'nav_history',
    keywords: ['历史', '历史记录', '我的作品', '以往作品'],
    category: 'navigation',
    action: 'navigate.history',
    description: '查看历史记录',
    example: '查看历史'
  },
  {
    id: 'nav_back',
    keywords: ['返回', '后退', '回去', '上一步'],
    category: 'navigation',
    action: 'navigate.back',
    description: '返回上一步',
    example: '返回'
  },

  // 创建命令
  {
    id: 'create_ppt',
    keywords: ['创建PPT', '做一个PPT', '帮我做PPT', '生成PPT', '制作PPT'],
    category: 'creation',
    action: 'create.ppt',
    description: '创建新的PPT',
    example: '创建一个关于公司介绍的PPT'
  },
  {
    id: 'create_from_template',
    keywords: ['用模板', '基于模板', '模板创建', '参照模板'],
    category: 'creation',
    action: 'create.fromTemplate',
    description: '基于模板创建',
    example: '用这个模板创建一个'
  },
  {
    id: 'create_clone',
    keywords: ['复制', '克隆', '复制的', '一样的'],
    category: 'creation',
    action: 'create.clone',
    description: '复制现有PPT',
    example: '复制这个PPT'
  },

  // 编辑命令
  {
    id: 'edit_page',
    keywords: ['修改第', '改一下第', '编辑第', '调整第'],
    category: 'editing',
    action: 'edit.page',
    description: '修改指定页面',
    example: '修改第三页'
  },
  {
    id: 'edit_text',
    keywords: ['改文字', '修改文字', '改文本', '编辑文字', '改一下文字'],
    category: 'editing',
    action: 'edit.text',
    description: '修改文字内容',
    example: '把第一页的文字改成欢迎'
  },
  {
    id: 'edit_add_text',
    keywords: ['添加文字', '加文字', '新增文字', '增加文字'],
    category: 'editing',
    action: 'edit.addText',
    description: '添加文字',
    example: '在第二页添加文字'
  },
  {
    id: 'edit_delete',
    keywords: ['删除', '去掉', '移除', '删除掉', '不要了'],
    category: 'editing',
    action: 'edit.delete',
    description: '删除内容',
    example: '删除第一页'
  },
  {
    id: 'edit_undo',
    keywords: ['撤销', '取消', '撤回', '回退'],
    category: 'editing',
    action: 'edit.undo',
    description: '撤销操作',
    example: '撤销上一步'
  },
  {
    id: 'edit_redo',
    keywords: ['重做', '恢复', '重新做', '再来'],
    category: 'editing',
    action: 'edit.redo',
    description: '重做操作',
    example: '重做'
  },

  // 样式命令
  {
    id: 'style_color',
    keywords: ['改成颜色', '改颜色', '设置颜色', '颜色改成', '变色'],
    category: 'style',
    action: 'style.color',
    description: '修改颜色',
    example: '把文字改成蓝色'
  },
  {
    id: 'style_font',
    keywords: ['改字体', '换字体', '设置字体', '字体改成'],
    category: 'style',
    action: 'style.font',
    description: '修改字体',
    example: '把字体改成黑体'
  },
  {
    id: 'style_size',
    keywords: ['改大小', '字体大小', '字号', '调整大小', '变大', '变小'],
    category: 'style',
    action: 'style.size',
    description: '调整大小',
    example: '把字体改大一点'
  },
  {
    id: 'style_align',
    keywords: ['对齐', '居中', '靠左', '靠右', '两端对齐'],
    category: 'style',
    action: 'style.align',
    description: '调整对齐方式',
    example: '文字居中'
  },
  {
    id: 'style_bold',
    keywords: ['加粗', '变粗', '粗体', '加黑'],
    category: 'style',
    action: 'style.bold',
    description: '加粗文字',
    example: '把标题加粗'
  },
  {
    id: 'style_theme',
    keywords: ['换主题', '改主题', '主题换成', '换个主题'],
    category: 'style',
    action: 'style.theme',
    description: '更换主题',
    example: '换个蓝色主题'
  },

  // 导出命令
  {
    id: 'export_pptx',
    keywords: ['导出PPT', '下载PPT', '导出文件', '保存PPT'],
    category: 'export',
    action: 'export.pptx',
    description: '导出为PPT文件',
    example: '导出PPT'
  },
  {
    id: 'export_pdf',
    keywords: ['导出PDF', '下载PDF', '转成PDF', 'PDF格式'],
    category: 'export',
    action: 'export.pdf',
    description: '导出为PDF',
    example: '导出PDF'
  },
  {
    id: 'export_image',
    keywords: ['导出图片', '下载图片', '导出图片格式', 'PNG'],
    category: 'export',
    action: 'export.image',
    description: '导出为图片',
    example: '导出图片'
  },
  {
    id: 'export_share',
    keywords: ['分享', '共享', '发送', '分享链接'],
    category: 'export',
    action: 'export.share',
    description: '分享PPT',
    example: '分享这个PPT'
  },

  // 系统命令
  {
    id: 'sys_save',
    keywords: ['保存', '存储', '存一下', '保存一下'],
    category: 'system',
    action: 'system.save',
    description: '保存当前工作',
    example: '保存'
  },
  {
    id: 'sys_help',
    keywords: ['帮助', '说明', '怎么用', '使用说明', '帮忙'],
    category: 'system',
    action: 'system.help',
    description: '获取帮助',
    example: '有什么帮助'
  },
  {
    id: 'sys_setting',
    keywords: ['设置', '配置', '选项', '偏好设置'],
    category: 'system',
    action: 'system.settings',
    description: '打开设置',
    example: '打开设置'
  },
  {
    id: 'sys_dark',
    keywords: ['深色模式', '暗黑模式', '夜间模式', '关灯'],
    category: 'system',
    action: 'system.darkMode',
    description: '切换深色模式',
    example: '打开深色模式'
  },
  {
    id: 'sys_light',
    keywords: ['浅色模式', '亮色模式', '日间模式', '开灯'],
    category: 'system',
    action: 'system.lightMode',
    description: '切换浅色模式',
    example: '打开浅色模式'
  },

  // AI命令
  {
    id: 'ai_generate',
    keywords: ['AI生成', '智能生成', 'AI创建', '让AI做'],
    category: 'ai',
    action: 'ai.generate',
    description: 'AI生成内容',
    example: '用AI生成一个封面'
  },
  {
    id: 'ai_improve',
    keywords: ['AI优化', '智能优化', '改善一下', '优化内容'],
    category: 'ai',
    action: 'ai.improve',
    description: 'AI优化内容',
    example: '优化一下这段文字'
  },
  {
    id: 'ai_summarize',
    keywords: ['总结', '概括', '提炼', '摘要'],
    category: 'ai',
    action: 'ai.summarize',
    description: 'AI总结内容',
    example: '总结这一页的内容'
  },
  {
    id: 'ai_translate',
    keywords: ['翻译', '翻译成', '转成', '语言转换'],
    category: 'ai',
    action: 'ai.translate',
    description: 'AI翻译内容',
    example: '翻译成英文'
  },
  {
    id: 'ai_expand',
    keywords: ['扩展', '展开', '详细内容', '详细说明'],
    category: 'ai',
    action: 'ai.expand',
    description: 'AI扩展内容',
    example: '详细展开一下'
  },
  {
    id: 'ai_shorter',
    keywords: ['缩短', '简化', '简洁', '精简'],
    category: 'ai',
    action: 'ai.shorter',
    description: 'AI缩短内容',
    example: '简化一下这段话'
  }
]

export function useVoiceCommandsEnhancer() {
  // 命令匹配历史
  const matchHistory = ref<VoiceCommandResult[]>([])

  // 按类别分组命令
  const commandsByCategory = computed(() => {
    const grouped: Record<VoiceCommandCategory, VoiceCommand[]> = {
      navigation: [],
      creation: [],
      editing: [],
      style: [],
      export: [],
      system: [],
      ai: []
    }

    voiceCommands.forEach(cmd => {
      grouped[cmd.category].push(cmd)
    })

    return grouped
  })

  // 匹配命令
  const matchCommand = (text: string): VoiceCommandResult => {
    const processed = text.toLowerCase().trim()

    let bestMatch: VoiceCommand | null = null
    let bestConfidence = 0

    // 遍历所有命令
    for (const command of voiceCommands) {
      for (const keyword of command.keywords) {
        const keywordLower = keyword.toLowerCase()

        // 完全匹配
        if (processed === keywordLower) {
          if (1.0 > bestConfidence) {
            bestMatch = command
            bestConfidence = 1.0
          }
          break
        }

        // 包含匹配
        if (processed.includes(keywordLower)) {
          const confidence = keywordLower.length / processed.length
          if (confidence > bestConfidence) {
            bestMatch = command
            bestConfidence = confidence
          }
        }
      }
    }

    const result: VoiceCommandResult = {
      command: bestMatch,
      matched: bestMatch !== null,
      confidence: bestConfidence,
      params: extractParams(text, bestMatch)
    }

    // 记录匹配历史
    matchHistory.value.push(result)
    if (matchHistory.value.length > 50) {
      matchHistory.value.shift()
    }

    return result
  }

  // 提取参数
  const extractParams = (text: string, command: VoiceCommand | null): Record<string, any> => {
    const params: Record<string, any> = {}

    if (!command) return params

    // 提取页码
    const pageMatch = text.match(/第(\d+)[页张]/)
    if (pageMatch) {
      params.page = parseInt(pageMatch[1])
    }

    // 提取颜色
    const colors = ['蓝色', '红色', '绿色', '黑色', '白色', '黄色', '紫色', '橙色', '粉色']
    for (const color of colors) {
      if (text.includes(color)) {
        params.color = color
        break
      }
    }

    // 提取尺寸
    if (text.includes('大') || text.includes('加')) {
      params.size = 'larger'
    } else if (text.includes('小') || text.includes('减')) {
      params.size = 'smaller'
    }

    return params
  }

  // 获取类别命令
  const getCommandsByCategory = (category: VoiceCommandCategory): VoiceCommand[] => {
    return commandsByCategory.value[category] || []
  }

  // 搜索命令
  const searchCommands = (query: string): VoiceCommand[] => {
    const lowerQuery = query.toLowerCase()
    return voiceCommands.filter(cmd => {
      if (cmd.keywords.some(k => k.toLowerCase().includes(lowerQuery))) return true
      if (cmd.description.includes(query)) return true
      return false
    })
  }

  // 获取所有命令
  const getAllCommands = (): VoiceCommand[] => {
    return voiceCommands
  }

  // 获取匹配统计
  const matchStats = computed(() => ({
    total: matchHistory.value.length,
    matched: matchHistory.value.filter(r => r.matched).length,
    successRate: matchHistory.value.length > 0
      ? Math.round((matchHistory.value.filter(r => r.matched).length / matchHistory.value.length) * 100)
      : 0
  }))

  // 清除历史
  const clearHistory = () => {
    matchHistory.value = []
  }

  return {
    // 状态
    matchHistory,
    // 计算属性
    commandsByCategory,
    matchStats,
    // 方法
    matchCommand,
    extractParams,
    getCommandsByCategory,
    searchCommands,
    getAllCommands,
    clearHistory
  }
}

export default useVoiceCommandsEnhancer
