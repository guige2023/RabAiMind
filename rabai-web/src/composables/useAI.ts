// useAI.ts - AI统一模块
// 合并所有AI相关功能
import { ref, computed } from 'vue'

export interface AIConfig {
  model: string
  temperature: number
  maxTokens: number
}

export interface AIResponse {
  content: string
  usage: number
  latency: number
}

export interface AIChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export function useAI() {
  // 配置
  const config = ref<AIConfig>({
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2000
  })

  // 对话消息
  const messages = ref<AIChatMessage[]>([])

  // 加载状态
  const loading = ref(false)

  // 发送消息
  const sendMessage = async (content: string): Promise<AIResponse> => {
    loading.value = true

    // 添加用户消息
    messages.value.push({
      id: `msg_${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now()
    })

    try {
      // 模拟AI响应
      await new Promise(r => setTimeout(r, 1000))

      const response: AIResponse = {
        content: `AI响应: ${content}`,
        usage: 100,
        latency: 1000
      }

      // 添加AI消息
      messages.value.push({
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: response.content,
        timestamp: Date.now()
      })

      return response
    } finally {
      loading.value = false
    }
  }

  // 清空对话
  const clearChat = () => {
    messages.value = []
  }

  // 更新配置
  const updateConfig = (updates: Partial<AIConfig>) => {
    Object.assign(config.value, updates)
  }

  return {
    config,
    messages,
    loading,
    sendMessage,
    clearChat,
    updateConfig
  }
}

export default useAI
