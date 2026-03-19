// AI Chat composable - AI对话功能
import { ref, computed } from 'vue'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  suggestions?: string[]
  loading?: boolean
}

export interface ChatContext {
  topic?: string
  template?: string
  style?: string
  slideCount?: number
}

export interface ChatSuggestion {
  id: string
  text: string
  icon: string
  category: 'edit' | 'regenerate' | 'style' | 'content'
}

// 预设快捷回复
export const quickReplies = [
  { id: '1', text: '优化这个内容', icon: '✨', category: 'edit' as const },
  { id: '2', text: '生成更多页面', icon: '➕', category: 'content' as const },
  { id: '3', text: '改变风格', icon: '🎨', category: 'style' as const },
  { id: '4', text: '重新生成', icon: '🔄', category: 'regenerate' as const }
]

// AI角色提示
const systemPrompt = `你是一个专业的PPT设计助手，擅长：
1. 根据用户需求生成高质量的PPT内容
2. 优化现有PPT的文字和布局
3. 提供专业的设计建议
4. 回答关于演示文稿的各种问题

请用简洁、专业的语言回复。`

export function useAIChat() {
  const messages = ref<ChatMessage[]>([])
  const isLoading = ref(false)
  const context = ref<ChatContext>({})
  const chatHistory = ref<ChatMessage[]>([])

  // 初始化对话
  const initChat = (initialContext?: ChatContext) => {
    if (initialContext) {
      context.value = initialContext
    }

    // 添加系统提示
    messages.value = [
      {
        id: 'system',
        role: 'system',
        content: systemPrompt,
        timestamp: Date.now()
      }
    ]

    // 添加欢迎消息
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      role: 'assistant',
      content: getWelcomeMessage(),
      timestamp: Date.now(),
      suggestions: getInitialSuggestions()
    }
    messages.value.push(welcomeMessage)
  }

  // 获取欢迎消息
  const getWelcomeMessage = (): string => {
    if (context.value.topic) {
      return `好的，我来帮您完善关于"${context.value.topic}"的PPT。您可以：`
    }
    return '您好！我是AI PPT助手，可以帮您：'
  }

  // 获取初始建议
  const getInitialSuggestions = (): string[] => {
    return [
      '帮我优化PPT内容',
      '添加更多幻灯片',
      '改变整体风格',
      '生成演讲稿'
    ]
  }

  // 发送消息
  const sendMessage = async (content: string): Promise<void> => {
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now()
    }

    messages.value.push(userMessage)
    isLoading.value = true

    // 添加加载中的AI消息
    const aiMessage: ChatMessage = {
      id: `ai_${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      loading: true
    }
    messages.value.push(aiMessage)

    try {
      // 模拟AI响应（实际应该调用API）
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000))

      const response = generateResponse(content)
      aiMessage.content = response.content
      aiMessage.suggestions = response.suggestions
      aiMessage.loading = false
    } catch (error) {
      aiMessage.content = '抱歉，我遇到了问题，请稍后重试。'
      aiMessage.loading = false
    } finally {
      isLoading.value = false
    }
  }

  // 生成AI响应（模拟）
  const generateResponse = (userInput: string): { content: string; suggestions: string[] } => {
    const input = userInput.toLowerCase()

    if (input.includes('风格') || input.includes('模板')) {
      return {
        content: '我为您推荐几种风格：\n\n1. **商务专业** - 适合正式场合\n2. **创意现代** - 吸引观众注意力\n3. **简约大方** - 清晰传达信息\n\n您想要哪种风格？',
        suggestions: ['商务专业风格', '创意现代风格', '简约大方风格']
      }
    }

    if (input.includes('优化') || input.includes('改善')) {
      return {
        content: '我可以帮您优化以下方面：\n\n• 文字表达更简洁有力\n• 图表数据更清晰直观\n• 整体布局更专业美观\n\n请告诉我想优化哪部分？',
        suggestions: ['优化文字内容', '优化图表设计', '优化整体布局']
      }
    }

    if (input.includes('添加') || input.includes('更多')) {
      return {
        content: '好的，我可以为您添加：\n\n• 数据分析页\n• 团队介绍页\n• 案例展示页\n• 问答环节页\n\n您需要哪些？',
        suggestions: ['添加数据页', '添加团队页', '添加案例页']
      }
    }

    return {
      content: '明白了！请告诉我您具体想要什么样的调整？比如：\n\n• "让内容更简洁"\n• "添加一些图表"\n• "换一个风格"',
      suggestions: ['让内容更简洁', '添加图表', '换一种风格']
    }
  }

  // 快速回复
  const sendQuickReply = async (suggestion: string): Promise<void> => {
    await sendMessage(suggestion)
  }

  // 清除对话历史
  const clearHistory = (): void => {
    messages.value = []
    initChat(context.value)
  }

  // 加载历史记录
  const loadHistory = (): void => {
    try {
      const saved = localStorage.getItem('ai_chat_history')
      if (saved) {
        chatHistory.value = JSON.parse(saved)
      }
    } catch {
      // 忽略错误
    }
  }

  // 保存历史记录
  const saveHistory = (): void => {
    try {
      const history = messages.value.filter(m => m.role !== 'system')
      localStorage.setItem('ai_chat_history', JSON.stringify(history.slice(-50)))
    } catch {
      // 忽略错误
    }
  }

  // 获取对话统计
  const chatStats = computed(() => ({
    totalMessages: messages.value.length,
    userMessages: messages.value.filter(m => m.role === 'user').length,
    aiMessages: messages.value.filter(m => m.role === 'assistant').length
  }))

  // 初始化
  loadHistory()

  return {
    messages,
    isLoading,
    context,
    chatHistory,
    chatStats,
    initChat,
    sendMessage,
    sendQuickReply,
    clearHistory,
    loadHistory,
    saveHistory,
    quickReplies
  }
}

export default useAIChat
