// Smart Suggestions Pro - 增强版智能建议系统
import { ref, computed } from 'vue'

export type SuggestionCategory = 'content' | 'style' | 'layout' | 'ai' | 'optimization' | 'interaction' | 'template'

export interface Suggestion {
  id: string
  category: SuggestionCategory
  title: string
  description: string
  priority: number
  enabled: boolean
  action?: () => void
  keywords: string[]
  icon?: string
}

export interface SuggestionContext {
  pageCount: number
  currentPage: number
  hasImages: boolean
  hasCharts: boolean
  hasTitle: boolean
  theme: string
  language: string
  isGenerating?: boolean
  topic?: string
}

export function useSmartSuggestionsPro() {
  // 增强建议列表
  const suggestions = ref<Suggestion[]>([
    // 内容建议
    {
      id: 'content_add_title',
      category: 'content',
      title: '添加标题',
      description: '当前页面缺少标题，建议添加一个清晰的标题',
      priority: 9,
      enabled: true,
      icon: '📝',
      keywords: ['标题', 'title', '添加']
    },
    {
      id: 'content_add_image',
      category: 'content',
      title: '添加图片',
      description: '添加图片可以增强视觉效果和表达力',
      priority: 8,
      enabled: true,
      icon: '🖼️',
      keywords: ['图片', 'image', '照片']
    },
    {
      id: 'content_add_chart',
      category: 'content',
      title: '添加图表',
      description: '数据可视化可以帮助更好地传达信息',
      priority: 7,
      enabled: true,
      icon: '📊',
      keywords: ['图表', 'chart', '数据']
    },
    {
      id: 'content_bullet_points',
      category: 'content',
      title: '使用要点列表',
      description: '将长文本转换为要点列表更易于阅读',
      priority: 6,
      enabled: true,
      icon: '📋',
      keywords: ['列表', '要点', 'bullet']
    },
    {
      id: 'content_add_icons',
      category: 'content',
      title: '添加图标',
      description: '使用图标可以让内容更加直观',
      priority: 6,
      enabled: true,
      icon: '⭐',
      keywords: ['图标', 'icon', '符号']
    },

    // 样式建议
    {
      id: 'style_consistency',
      category: 'style',
      title: '保持风格一致',
      description: '建议保持整个PPT的风格一致性',
      priority: 9,
      enabled: true,
      icon: '🎨',
      keywords: ['风格', '一致', 'style']
    },
    {
      id: 'style_color_contrast',
      category: 'style',
      title: '增强颜色对比',
      description: '提高文字与背景的颜色对比度以增强可读性',
      priority: 8,
      enabled: true,
      icon: '🎭',
      keywords: ['颜色', '对比', '可读性']
    },
    {
      id: 'style_font_hierarchy',
      category: 'style',
      title: '建立字体层级',
      description: '使用不同字号区分标题和正文',
      priority: 7,
      enabled: true,
      icon: '🔤',
      keywords: ['字体', '层级', 'size']
    },
    {
      id: 'style_whitespace',
      category: 'style',
      title: '增加留白',
      description: '适当的留白可以让页面更加清爽',
      priority: 6,
      enabled: true,
      icon: '⬜',
      keywords: ['留白', '空白', 'space']
    },
    {
      id: 'style_brand_colors',
      category: 'style',
      title: '使用品牌色',
      description: '应用品牌配色以增强品牌识别度',
      priority: 7,
      enabled: true,
      icon: '🏷️',
      keywords: ['品牌', '颜色', 'brand']
    },

    // 布局建议
    {
      id: 'layout_balance',
      category: 'layout',
      title: '平衡布局',
      description: '建议调整元素位置以达到视觉平衡',
      priority: 8,
      enabled: true,
      icon: '⚖️',
      keywords: ['布局', '平衡', 'layout']
    },
    {
      id: 'layout_alignment',
      category: 'layout',
      title: '对齐元素',
      description: '建议对齐页面元素以提升整洁度',
      priority: 8,
      enabled: true,
      icon: '📏',
      keywords: ['对齐', '排列', 'align']
    },
    {
      id: 'layout_grid',
      category: 'layout',
      title: '使用网格',
      description: '使用网格系统可以让布局更加规范',
      priority: 6,
      enabled: true,
      icon: '🔲',
      keywords: ['网格', 'grid', '布局']
    },
    {
      id: 'layout_visual_flow',
      category: 'layout',
      title: '优化视觉流程',
      description: '按照阅读习惯安排元素顺序',
      priority: 7,
      enabled: true,
      icon: '👁️',
      keywords: ['视觉', '流程', 'flow']
    },

    // AI建议
    {
      id: 'ai_expand_content',
      category: 'ai',
      title: 'AI扩展内容',
      description: '使用AI扩展当前内容的详细程度',
      priority: 9,
      enabled: true,
      icon: '🤖',
      keywords: ['AI', '扩展', '详细']
    },
    {
      id: 'ai_improve_writing',
      category: 'ai',
      title: 'AI优化文案',
      description: '使用AI优化当前的文字表达',
      priority: 9,
      enabled: true,
      icon: '✍️',
      keywords: ['AI', '优化', '文案']
    },
    {
      id: 'ai_generate_image',
      category: 'ai',
      title: 'AI生成图片',
      description: '使用AI生成与内容相关的图片',
      priority: 8,
      enabled: true,
      icon: '🎨',
      keywords: ['AI', '图片', '生成']
    },
    {
      id: 'ai_translate',
      category: 'ai',
      title: 'AI翻译',
      description: '将内容翻译成其他语言',
      priority: 7,
      enabled: true,
      icon: '🌐',
      keywords: ['AI', '翻译', '语言']
    },
    {
      id: 'ai_summarize',
      category: 'ai',
      title: 'AI总结',
      description: '使用AI总结当前页面内容',
      priority: 8,
      enabled: true,
      icon: '📝',
      keywords: ['AI', '总结', '摘要']
    },
    {
      id: 'ai_add_examples',
      category: 'ai',
      title: 'AI添加案例',
      description: '使用AI为内容添加相关案例',
      priority: 7,
      enabled: true,
      icon: '💡',
      keywords: ['AI', '案例', '例子']
    },

    // 优化建议
    {
      id: 'opt_performance',
      category: 'optimization',
      title: '优化性能',
      description: '压缩图片大小以提升加载速度',
      priority: 6,
      enabled: true,
      icon: '⚡',
      keywords: ['优化', '性能', '压缩']
    },
    {
      id: 'opt_export',
      category: 'optimization',
      title: '优化导出',
      description: '选择最佳导出格式以保证质量',
      priority: 5,
      enabled: true,
      icon: '📤',
      keywords: ['导出', '优化', '格式']
    },
    {
      id: 'opt_accessibility',
      category: 'optimization',
      title: '优化无障碍',
      description: '添加替代文本以提升无障碍访问性',
      priority: 6,
      enabled: true,
      icon: '♿',
      keywords: ['无障碍', 'accessibility', '辅助']
    },

    // 交互建议
    {
      id: 'interaction_animation',
      category: 'interaction',
      title: '添加动画',
      description: '添加适当的动画可以增强演示效果',
      priority: 6,
      enabled: true,
      icon: '✨',
      keywords: ['动画', 'animation', '效果']
    },
    {
      id: 'interaction_transition',
      category: 'interaction',
      title: '添加过渡效果',
      description: '页面切换添加过渡效果使演示更流畅',
      priority: 6,
      enabled: true,
      icon: '🔄',
      keywords: ['过渡', 'transition', '切换']
    },
    {
      id: 'interaction_links',
      category: 'interaction',
      title: '添加交互链接',
      description: '添加超链接方便内容导航',
      priority: 5,
      enabled: true,
      icon: '🔗',
      keywords: ['链接', '超链接', 'link']
    },

    // 模板建议
    {
      id: 'template_change',
      category: 'template',
      title: '更换模板',
      description: '尝试不同的模板风格',
      priority: 7,
      enabled: true,
      icon: '🎭',
      keywords: ['模板', 'template', '主题']
    },
    {
      id: 'template_industry',
      category: 'template',
      title: '使用行业模板',
      description: '选择适合您行业的专业模板',
      priority: 8,
      enabled: true,
      icon: '🏢',
      keywords: ['模板', '行业', '专业']
    }
  ])

  // 获取上下文相关的建议
  const getContextualSuggestions = (context: SuggestionContext): Suggestion[] => {
    let filtered = suggestions.value.filter(s => s.enabled)

    // 根据页面数量调整
    if (context.pageCount === 0) {
      filtered = filtered.filter(s =>
        s.category === 'template' ||
        s.category === 'ai' ||
        s.id === 'content_add_title'
      )
    }

    // 根据当前页面内容调整
    if (context.hasTitle) {
      filtered = filtered.filter(s => s.id !== 'content_add_title')
    }
    if (context.hasImages) {
      filtered = filtered.filter(s => s.id !== 'content_add_image')
    }
    if (context.hasCharts) {
      filtered = filtered.filter(s => s.id !== 'content_add_chart')
    }

    // 根据是否正在生成调整
    if (context.isGenerating) {
      filtered = filtered.filter(s => s.category !== 'ai')
    }

    // 按优先级排序
    return filtered.sort((a, b) => b.priority - a.priority).slice(0, 10)
  }

  // 根据关键词搜索
  const search = (query: string): Suggestion[] => {
    const q = query.toLowerCase()
    return suggestions.value.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.keywords.some(k => k.toLowerCase().includes(q))
    )
  }

  // 按类别获取
  const getByCategory = (category: SuggestionCategory): Suggestion[] => {
    return suggestions.value.filter(s => s.category === category && s.enabled)
  }

  // 切换启用状态
  const toggle = (id: string) => {
    const s = suggestions.value.find(x => x.id === id)
    if (s) s.enabled = !s.enabled
  }

  // 添加建议
  const add = (suggestion: Omit<Suggestion, 'id'>) => {
    suggestions.value.push({ ...suggestion, id: `s_${Date.now()}` })
  }

  // 统计
  const stats = computed(() => ({
    total: suggestions.value.length,
    enabled: suggestions.value.filter(s => s.enabled).length,
    byCategory: {
      content: suggestions.value.filter(s => s.enabled && s.category === 'content').length,
      style: suggestions.value.filter(s => s.enabled && s.category === 'style').length,
      layout: suggestions.value.filter(s => s.enabled && s.category === 'layout').length,
      ai: suggestions.value.filter(s => s.enabled && s.category === 'ai').length,
      optimization: suggestions.value.filter(s => s.enabled && s.category === 'optimization').length,
      interaction: suggestions.value.filter(s => s.enabled && s.category === 'interaction').length,
      template: suggestions.value.filter(s => s.enabled && s.category === 'template').length
    }
  }))

  return {
    suggestions,
    getContextualSuggestions,
    search,
    getByCategory,
    toggle,
    add,
    stats
  }
}

export default useSmartSuggestionsPro
