// AI Chat Optimizer - AI对话优化
import { ref, computed } from 'vue'

export type MessageRole = 'user' | 'assistant' | 'system'
export type MessageStatus = 'sending' | 'sent' | 'error'

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: number
  status: MessageStatus
  suggestions?: string[]
  actions?: ChatAction[]
}

export interface ChatAction {
  id: string
  label: string
  icon: string
  action: () => void
}

export interface ChatContext {
  topic?: string
  slideCount?: number
  template?: string
  audience?: string
}

export interface AIChatConfig {
  temperature: number
  maxTokens: number
  streamResponse: boolean
  showSuggestions: boolean
  showTyping: boolean
  contextRetention: boolean
}

const defaultConfig: AIChatConfig = {
  temperature: 0.7,
  maxTokens: 2000,
  streamResponse: true,
  showSuggestions: true,
  showTyping: true,
  contextRetention: true
}

// 预设提示
const systemPrompts = {
  default: '你是一个专业的PPT助手，帮助用户创建和编辑演示文稿。',
  professional: '你是一个商业演示专家，擅长创建专业的企业PPT。',
  creative: '你是一个创意设计师，帮助用户创建独特风格的演示文稿。',
  educator: '你是一个教育专家，擅长创建教学课件和培训材料。'
}

// 建议回复
const suggestedResponses = [
  '帮我创建一个关于[主题]的PPT',
  '推荐一个适合[场景]的模板',
  '如何优化PPT的内容结构？',
  '添加一些数据可视化图表',
  '调整整体风格为[风格]'
]

export function useAIChatOptimizer() {
  // 配置
  const config = ref<AIChatConfig>({ ...defaultConfig })

  // 消息列表
  const messages = ref<ChatMessage[]>([])

  // 当前上下文
  const context = ref<ChatContext>({})

  // 加载状态
  const isLoading = ref(false)

  // 输入文本
  const inputText = ref('')

  // 会话历史
  const conversationHistory = ref<Array<{ role: MessageRole; content: string }>>([])

  // 添加消息
  const addMessage = (
    role: MessageRole,
    content: string,
    options?: Partial<ChatMessage>
  ): ChatMessage => {
    const message: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role,
      content,
      timestamp: Date.now(),
      status: 'sent',
      ...options
    }

    messages.value.push(message)
    return message
  }

  // 发送消息
  const sendMessage = async (content: string): Promise<ChatMessage> => {
    if (!content.trim()) return null as any

    // 添加用户消息
    const userMessage = addMessage('user', content)

    // 添加到历史
    conversationHistory.value.push({ role: 'user', content })

    // 显示加载状态
    isLoading.value = true

    try {
      // 模拟AI响应（实际应该调用API）
      if (config.value.showTyping) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      const response = await generateResponse(content)

      // 添加AI消息
      const aiMessage = addMessage('assistant', response.content, {
        suggestions: response.suggestions,
        actions: response.actions
      })

      // 添加到历史
      conversationHistory.value.push({ role: 'assistant', content: response.content })

      return aiMessage
    } catch (error) {
      // 添加错误消息
      const errorMessage = addMessage('assistant', '抱歉，发生了错误，请稍后重试。', {
        status: 'error'
      })
      return errorMessage
    } finally {
      isLoading.value = false
    }
  }

  // 生成响应
  const generateResponse = async (input: string): Promise<{
    content: string
    suggestions?: string[]
    actions?: ChatAction[]
  }> => {
    const lowerInput = input.toLowerCase()

    // 根据输入类型生成响应
    if (lowerInput.includes('创建') || lowerInput.includes('生成')) {
      return {
        content: '好的，我来帮您创建PPT。请告诉我您想要的主题、内容和风格。',
        suggestions: [
          '创建一个关于人工智能的商业计划',
          '创建年度总结报告PPT',
          '创建产品介绍PPT'
        ],
        actions: [
          { id: 'create', label: '开始创建', icon: '➕', action: () => {} }
        ]
      }
    }

    if (lowerInput.includes('模板') || lowerInput.includes('风格')) {
      return {
        content: '我可以为您推荐适合的模板。请告诉我您想要的风格：',
        suggestions: [
          '推荐科技风格模板',
          '推荐商务风格模板',
          '推荐创意风格模板'
        ]
      }
    }

    if (lowerInput.includes('编辑') || lowerInput.includes('修改')) {
      return {
        content: '我可以帮您编辑内容。请选择您想要进行的操作：',
        actions: [
          { id: 'edit-text', label: '编辑文字', icon: '✏️', action: () => {} },
          { id: 'add-chart', label: '添加图表', icon: '📊', action: () => {} },
          { id: 'change-style', label: '更换风格', icon: '🎨', action: () => {} }
        ]
      }
    }

    // 默认响应
    return {
      content: '我理解了。请问还有什么可以帮助您的？',
      suggestions: suggestedResponses
    }
  }

  // 流式响应
  const streamResponse = async (content: string): Promise<void> => {
    if (!config.value.streamResponse) {
      await sendMessage(content)
      return
    }

    const userMessage = addMessage('user', content)
    conversationHistory.value.push({ role: 'user', content })
    isLoading.value = true

    // 创建空消息
    const aiMessage = addMessage('assistant', '', { status: 'sending' })

    // 模拟流式输出
    const response = await generateResponse(content)
    const words = response.content.split('')

    for (const word of words) {
      await new Promise(resolve => setTimeout(resolve, 30))
      aiMessage.content += word
    }

    aiMessage.status = 'sent'
    aiMessage.suggestions = response.suggestions
    aiMessage.actions = response.actions

    conversationHistory.value.push({ role: 'assistant', content: response.content })
    isLoading.value = false
  }

  // 设置上下文
  const setContext = (ctx: Partial<ChatContext>) => {
    context.value = { ...context.value, ...ctx }
  }

  // 清除上下文
  const clearContext = () => {
    context.value = {}
  }

  // 清除历史
  const clearHistory = () => {
    messages.value = []
    conversationHistory.value = []
  }

  // 设置系统提示
  const setSystemPrompt = (type: keyof typeof systemPrompts) => {
    const prompt = systemPrompts[type]
    conversationHistory.value.unshift({ role: 'system', content: prompt })
  }

  // 获取建议
  const getSuggestions = (): string[] => {
    if (!config.value.showSuggestions) return []

    // 基于上下文返回建议
    if (context.value.topic) {
      return [
        `创建关于${context.value.topic}的PPT`,
        `推荐${context.value.topic}相关模板`,
        `优化${context.value.topic}的内容`
      ]
    }

    return suggestedResponses
  }

  // 消息统计
  const stats = computed(() => ({
    totalMessages: messages.value.length,
    userMessages: messages.value.filter(m => m.role === 'user').length,
    aiMessages: messages.value.filter(m => m.role === 'assistant').length,
    conversationLength: conversationHistory.value.length
  }))

  return {
    // 配置和状态
    config,
    messages,
    context,
    isLoading,
    inputText,
    conversationHistory,
    // 方法
    addMessage,
    sendMessage,
    streamResponse,
    setContext,
    clearContext,
    clearHistory,
    setSystemPrompt,
    getSuggestions,
    // 数据
    systemPrompts,
    suggestedResponses,
    // 计算属性
    stats
  }
}

export default useAIChatOptimizer
