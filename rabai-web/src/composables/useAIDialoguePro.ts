// AI Dialogue Pro - AI对话优化
import { ref, computed } from 'vue'

export type MessageRole = 'user' | 'assistant' | 'system'
export type DialogueStatus = 'idle' | 'thinking' | 'responding' | 'error'

export interface DialogueMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: number
  status?: DialogueStatus
  suggestions?: string[]
}

export interface AIContext {
  topic?: string
  style?: string
  tone?: 'formal' | 'casual' | 'friendly' | 'professional'
  length?: 'short' | 'medium' | 'long'
}

export interface DialogueConfig {
  maxHistory: number
  contextWindow: number
  temperature: number
  enableSuggestions: boolean
  autoComplete: boolean
}

export function useAIDialoguePro() {
  // 配置
  const config = ref<DialogueConfig>({
    maxHistory: 50,
    contextWindow: 10,
    temperature: 0.7,
    enableSuggestions: true,
    autoComplete: true
  })

  // 对话历史
  const messages = ref<DialogueMessage[]>([])

  // 当前状态
  const status = ref<DialogueStatus>('idle')

  // 上下文
  const context = ref<AIContext>({})

  // 发送消息
  const sendMessage = async (content: string): Promise<DialogueMessage> => {
    const userMessage: DialogueMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: 'user',
      content,
      timestamp: Date.now()
    }

    messages.value.push(userMessage)
    status.value = 'thinking'

    // 限制历史
    if (messages.value.length > config.value.maxHistory) {
      messages.value = messages.value.slice(-config.value.maxHistory)
    }

    return userMessage
  }

  // 接收回复
  const receiveReply = (content: string, suggestions?: string[]): DialogueMessage => {
    const assistantMessage: DialogueMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: 'assistant',
      content,
      timestamp: Date.now(),
      status: 'responding',
      suggestions
    }

    messages.value.push(assistantMessage)
    status.value = 'idle'

    return assistantMessage
  }

  // 获取上下文消息
  const getContextMessages = computed(() => {
    const recent = messages.value.slice(-config.value.contextWindow)
    return recent
  })

  // 智能建议
  const getSuggestions = (lastMessage: string): string[] => {
    const suggestions: string[] = []

    if (lastMessage.includes('创建') || lastMessage.includes('制作')) {
      suggestions.push('创建一个关于公司介绍的PPT')
      suggestions.push('制作一个产品演示')
    } else if (lastMessage.includes('修改') || lastMessage.includes('编辑')) {
      suggestions.push('优化这个页面的设计')
      suggestions.push('添加一些图表')
    } else if (lastMessage.includes('帮助')) {
      suggestions.push('告诉我如何开始')
      suggestions.push('有什么功能')
    }

    return suggestions
  }

  // 自动补全
  const autoComplete = (partial: string): string[] => {
    const completions: string[] = []

    if (partial.includes('创建')) {
      completions.push('创建一个关于公司介绍的PPT')
      completions.push('创建一个产品发布会PPT')
    } else if (partial.includes('修改')) {
      completions.push('修改第一页的标题')
      completions.push('修改文字内容')
    } else if (partial.includes('添加')) {
      completions.push('添加一张图片')
      completions.push('添加动画效果')
    }

    return completions
  }

  // 清除历史
  const clearHistory = () => {
    messages.value = []
    status.value = 'idle'
  }

  // 更新上下文
  const updateContext = (updates: Partial<AIContext>) => {
    context.value = { ...context.value, ...updates }
  }

  // 获取统计
  const stats = computed(() => ({
    totalMessages: messages.value.length,
    userMessages: messages.value.filter(m => m.role === 'user').length,
    assistantMessages: messages.value.filter(m => m.role === 'assistant').length,
    averageLength: messages.value.length > 0
      ? Math.round(messages.value.reduce((sum, m) => sum + m.content.length, 0) / messages.value.length)
      : 0
  }))

  return {
    config,
    messages,
    status,
    context,
    sendMessage,
    receiveReply,
    getContextMessages,
    getSuggestions,
    autoComplete,
    clearHistory,
    updateContext,
    stats
  }
}

export default useAIDialoguePro
