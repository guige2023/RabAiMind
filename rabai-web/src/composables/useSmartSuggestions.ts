// Smart Suggestions - 智能建议系统
import { ref, computed } from 'vue'

export interface Suggestion {
  id: string
  type: 'template' | 'content' | 'style' | 'layout' | 'action'
  title: string
  description: string
  icon: string
  priority: number
  action?: () => void
}

export interface SmartSuggestionContext {
  currentStep: 'input' | 'template' | 'generating' | 'editing' | 'export'
  topic?: string
  keywords: string[]
  audience?: string
  style?: string
  hasTemplates?: boolean
  isGenerating?: boolean
  hasContent?: boolean
}

export function useSmartSuggestions() {
  const suggestions = ref<Suggestion[]>([])
  const context = ref<SmartSuggestionContext>({
    currentStep: 'input',
    keywords: []
  })

  // 根据当前上下文生成建议
  const generateSuggestions = (ctx: SmartSuggestionContext): Suggestion[] => {
    context.value = ctx
    const newSuggestions: Suggestion[] = []

    switch (ctx.currentStep) {
      case 'input':
        // 输入阶段建议
        if (!ctx.topic || ctx.topic.length < 5) {
          newSuggestions.push({
            id: 'topic-detail',
            type: 'content',
            title: '添加更详细的主题描述',
            description: '描述越详细，AI生成的PPT质量越高',
            icon: '📝',
            priority: 1
          })
        }
        if (ctx.keywords.length === 0) {
          newSuggestions.push({
            id: 'add-keywords',
            type: 'content',
            title: '添加关键词',
            description: '添加行业或主题关键词获得更精准的模板推荐',
            icon: '🏷️',
            priority: 2
          })
        }
        newSuggestions.push({
          id: 'describe-audience',
          type: 'content',
          title: '说明目标受众',
          description: '告诉我们受众是谁，我们会给您更好的建议',
          icon: '👥',
          priority: 3
        })
        break

      case 'template':
        // 模板选择阶段建议
        if (!ctx.hasTemplates) {
          newSuggestions.push({
            id: 'browse-templates',
            type: 'template',
            title: '浏览更多模板',
            description: '查看不同风格的模板，找到最适合的',
            icon: '🎨',
            priority: 1
          })
        }
        if (ctx.keywords.includes('tech')) {
          newSuggestions.push({
            id: 'tech-template',
            type: 'template',
            title: '推荐科技风格',
            description: '基于您的关键词，推荐科技感模板',
            icon: '💻',
            priority: 2
          })
        }
        newSuggestions.push({
          id: 'use-favorites',
          type: 'template',
          title: '使用收藏的模板',
          description: '从您收藏的模板中选择',
            icon: '⭐',
            priority: 3
          })
        break

      case 'generating':
        // 生成阶段建议
        if (ctx.isGenerating) {
          newSuggestions.push({
            id: 'wait-generation',
            type: 'action',
            title: '正在生成中...',
            description: 'AI正在努力创作您的PPT，请稍候',
            icon: '⏳',
            priority: 1
          })
        }
        newSuggestions.push({
          id: 'prepare-content',
          type: 'content',
          title: '准备编辑内容',
            description: '生成完成后可以随时修改内容',
            icon: '✏️',
            priority: 2
          })
        break

      case 'editing':
        // 编辑阶段建议
        newSuggestions.push({
          id: 'use-shortcuts',
          type: 'action',
          title: '使用快捷键',
          description: '按Ctrl+K查看所有快捷键，提高编辑效率',
          icon: '⌨️',
          priority: 1
        })
        if (ctx.style === 'tech') {
          newSuggestions.push({
            id: 'add-charts',
            type: 'content',
            title: '添加数据图表',
            description: '科技风格PPT推荐添加数据可视化',
            icon: '📊',
            priority: 2
          })
        }
        newSuggestions.push({
          id: 'auto-save',
          type: 'action',
          title: '自动保存已开启',
          description: '您的修改会自动保存，无需担心丢失',
          icon: '💾',
          priority: 3
        })
        break

      case 'export':
        // 导出阶段建议
        newSuggestions.push({
          id: 'export-pptx',
          type: 'action',
          title: '导出PPTX格式',
          description: '导出后可继续在PowerPoint中编辑',
          icon: '📄',
          priority: 1
        })
        newSuggestions.push({
          id: 'export-pdf',
          type: 'action',
          title: '导出PDF格式',
          description: 'PDF格式便于分享和打印',
          icon: '📕',
          priority: 2
        })
        newSuggestions.push({
          id: 'share-link',
          type: 'action',
          title: '生成分享链接',
          description: '创建链接方便他人在线查看',
          icon: '🔗',
          priority: 3
        })
        break
    }

    // 按优先级排序
    suggestions.value = newSuggestions.sort((a, b) => a.priority - b.priority)
    return suggestions.value
  }

  // 获取高优先级建议
  const topSuggestions = computed(() => {
    return suggestions.value.slice(0, 3)
  })

  // 消除建议
  const dismissSuggestion = (id: string) => {
    suggestions.value = suggestions.value.filter(s => s.id !== id)
  }

  // 执行建议操作
  const executeSuggestion = (id: string) => {
    const suggestion = suggestions.value.find(s => s.id === id)
    if (suggestion?.action) {
      suggestion.action()
      dismissSuggestion(id)
    }
  }

  // 获取建议统计
  const stats = computed(() => ({
    total: suggestions.value.length,
    byType: suggestions.value.reduce((acc, s) => {
      acc[s.type] = (acc[s.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }))

  return {
    suggestions,
    context,
    topSuggestions,
    stats,
    generateSuggestions,
    dismissSuggestion,
    executeSuggestion
  }
}

export default useSmartSuggestions
