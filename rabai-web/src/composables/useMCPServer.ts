// MCP AI Tool Server Architecture - MCP AI工具服务器架构
import { ref, computed } from 'vue'

export interface MCPTool {
  id: string
  name: string
  description: string
  category: string
  inputSchema: Record<string, any>
  outputSchema: Record<string, any>
  handler: (...args: any[]) => any
  enabled: boolean
}

export interface MCPResource {
  id: string
  name: string
  type: string
  uri: string
  data: any
  mimeType: string
}

export interface MCPrompt {
  id: string
  name: string
  description: string
  template: string
  variables: string[]
}

export interface MCPConnection {
  id: string
  serverName: string
  serverUrl: string
  status: 'connected' | 'disconnected' | 'error'
  lastPing: number
  capabilities: string[]
}

export interface MCPToolExecution {
  id: string
  toolId: string
  toolName: string
  input: Record<string, any>
  output: any
  status: 'pending' | 'running' | 'success' | 'error'
  startTime: number
  endTime?: number
  error?: string
  duration?: number
}

export interface MCPServerConfig {
  name: string
  url: string
  apiKey?: string
  timeout: number
  retryCount: number
  capabilities: string[]
}

export function useMCPServer() {
  // 服务器配置
  const servers = ref<MCPServerConfig[]>([])

  // 连接状态
  const connections = ref<MCPConnection[]>([])

  // 可用工具
  const tools = ref<MCPTool[]>([])

  // 资源列表
  const resources = ref<MCPResource[]>([])

  // 提示词模板
  const prompts = ref<MCPrompt[]>([])

  // 执行历史
  const executionHistory = ref<MCPToolExecution[]>([])

  // 当前执行
  const currentExecution = ref<MCPToolExecution | null>(null)

  // 加载状态
  const loading = ref(false)

  // 初始化示例服务器
  const initSampleServers = () => {
    servers.value = [
      {
        name: 'PPT Generation Server',
        url: 'http://localhost:3001',
        apiKey: 'demo-key-123',
        timeout: 30000,
        retryCount: 3,
        capabilities: ['tools', 'resources', 'prompts']
      },
      {
        name: 'AI Content Server',
        url: 'http://localhost:3002',
        apiKey: 'ai-key-456',
        timeout: 60000,
        retryCount: 2,
        capabilities: ['tools', 'prompts']
      },
      {
        name: 'Template Server',
        url: 'http://localhost:3003',
        timeout: 15000,
        retryCount: 3,
        capabilities: ['resources', 'tools']
      }
    ]

    // 初始化工具
    tools.value = [
      {
        id: 'tool_ppt_generate',
        name: 'generate_ppt',
        description: '根据主题生成PPT内容',
        category: 'generation',
        inputSchema: {
          type: 'object',
          properties: {
            topic: { type: 'string', description: 'PPT主题' },
            slideCount: { type: 'number', description: '幻灯片数量' },
            style: { type: 'string', enum: ['business', 'creative', 'minimal'] }
          },
          required: ['topic']
        },
        outputSchema: { type: 'object' },
        handler: async (input: any) => {
          await new Promise(r => setTimeout(r, 1000))
          return { success: true, slides: [], message: 'PPT生成完成' }
        },
        enabled: true
      },
      {
        id: 'tool_ppt_export',
        name: 'export_ppt',
        description: '导出PPT为各种格式',
        category: 'export',
        inputSchema: {
          type: 'object',
          properties: {
            format: { type: 'string', enum: ['pdf', 'pptx', 'html', 'images'] },
            quality: { type: 'string', enum: ['low', 'medium', 'high'] }
          },
          required: ['format']
        },
        outputSchema: { type: 'object' },
        handler: async (input: any) => {
          await new Promise(r => setTimeout(r, 500))
          return { success: true, file: 'demo.pptx' }
        },
        enabled: true
      },
      {
        id: 'tool_content_analyze',
        name: 'analyze_content',
        description: '分析文本内容并提取关键信息',
        category: 'analysis',
        inputSchema: {
          type: 'object',
          properties: {
            text: { type: 'string' },
            analysisType: { type: 'string', enum: ['summary', 'keywords', 'sentiment'] }
          },
          required: ['text']
        },
        outputSchema: { type: 'object' },
        handler: async (input: any) => {
          await new Promise(r => setTimeout(r, 800))
          return { summary: '内容摘要...', keywords: ['关键词1', '关键词2'] }
        },
        enabled: true
      },
      {
        id: 'tool_image_generate',
        name: 'generate_image',
        description: '根据描述生成图片',
        category: 'media',
        inputSchema: {
          type: 'object',
          properties: {
            prompt: { type: 'string' },
            size: { type: 'string', enum: ['256x256', '512x512', '1024x1024'] },
            style: { type: 'string' }
          },
          required: ['prompt']
        },
        outputSchema: { type: 'object' },
        handler: async (input: any) => {
          await new Promise(r => setTimeout(r, 2000))
          return { imageUrl: 'https://placeholder.com/image.png' }
        },
        enabled: true
      },
      {
        id: 'tool_template_search',
        name: 'search_templates',
        description: '搜索PPT模板',
        category: 'template',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string' },
            category: { type: 'string' },
            limit: { type: 'number' }
          }
        },
        outputSchema: { type: 'array' },
        handler: async (input: any) => {
          await new Promise(r => setTimeout(r, 300))
          return [{ id: 't1', name: '商务蓝', match: 0.95 }]
        },
        enabled: true
      }
    ]

    // 初始化资源
    resources.value = [
      {
        id: 'res_theme_dark',
        name: 'Dark Theme',
        type: 'theme',
        uri: 'internal://themes/dark',
        data: { colors: { primary: '#000000', text: '#ffffff' } },
        mimeType: 'application/json'
      },
      {
        id: 'res_theme_light',
        name: 'Light Theme',
        type: 'theme',
        uri: 'internal://themes/light',
        data: { colors: { primary: '#ffffff', text: '#000000' } },
        mimeType: 'application/json'
      },
      {
        id: 'res_template_business',
        name: 'Business Template',
        type: 'template',
        uri: 'internal://templates/business',
        data: { layout: 'grid', slides: 10 },
        mimeType: 'application/json'
      }
    ]

    // 初始化提示词
    prompts.value = [
      {
        id: 'prompt_outline',
        name: 'Generate Outline',
        description: '生成PPT大纲',
        template: '请为「{{topic}}」生成一个{{slideCount}}页的PPT大纲',
        variables: ['topic', 'slideCount']
      },
      {
        id: 'prompt_content',
        name: 'Generate Content',
        description: '生成幻灯片内容',
        template: '请为第{{slideNumber}}页「{{title}}」生成详细内容',
        variables: ['slideNumber', 'title']
      },
      {
        id: 'prompt_translate',
        name: 'Translate Content',
        description: '翻译内容',
        template: '请将以下内容翻译成{{targetLanguage}}：\n\n{{content}}',
        variables: ['targetLanguage', 'content']
      }
    ]

    // 初始化连接状态
    connections.value = servers.value.map((server, index) => ({
      id: `conn_${index}`,
      serverName: server.name,
      serverUrl: server.url,
      status: index === 0 ? 'connected' : 'disconnected',
      lastPing: Date.now() - Math.random() * 60000,
      capabilities: server.capabilities
    }))
  }

  // 添加工具
  const addTool = (tool: Omit<MCPTool, 'id'>) => {
    const newTool: MCPTool = {
      ...tool,
      id: `tool_${Date.now()}`
    }
    tools.value.push(newTool)
    return newTool
  }

  // 删除工具
  const removeTool = (toolId: string) => {
    const index = tools.value.findIndex(t => t.id === toolId)
    if (index > -1) {
      tools.value.splice(index, 1)
    }
  }

  // 切换工具启用状态
  const toggleTool = (toolId: string) => {
    const tool = tools.value.find(t => t.id === toolId)
    if (tool) {
      tool.enabled = !tool.enabled
    }
  }

  // 执行工具
  const executeTool = async (toolId: string, input: Record<string, any>): Promise<any> => {
    const tool = tools.value.find(t => t.id === toolId)
    if (!tool) {
      throw new Error(`Tool ${toolId} not found`)
    }

    if (!tool.enabled) {
      throw new Error(`Tool ${tool.name} is disabled`)
    }

    const execution: MCPToolExecution = {
      id: `exec_${Date.now()}`,
      toolId,
      toolName: tool.name,
      input,
      output: null,
      status: 'running',
      startTime: Date.now()
    }

    currentExecution.value = execution
    executionHistory.value.unshift(execution)

    try {
      const output = await tool.handler(input)

      execution.output = output
      execution.status = 'success'
      execution.endTime = Date.now()
      execution.duration = execution.endTime - execution.startTime

      return output
    } catch (error) {
      execution.status = 'error'
      execution.error = (error as Error).message
      execution.endTime = Date.now()
      execution.duration = execution.endTime - execution.startTime

      throw error
    } finally {
      currentExecution.value = null
    }
  }

  // 添加服务器
  const addServer = (server: MCPServerConfig) => {
    servers.value.push(server)
    connections.value.push({
      id: `conn_${Date.now()}`,
      serverName: server.name,
      serverUrl: server.url,
      status: 'disconnected',
      lastPing: 0,
      capabilities: server.capabilities
    })
  }

  // 移除服务器
  const removeServer = (serverName: string) => {
    const index = servers.value.findIndex(s => s.name === serverName)
    if (index > -1) {
      servers.value.splice(index, 1)
      connections.value = connections.value.filter(c => c.serverName !== serverName)
    }
  }

  // 连接服务器
  const connect = async (serverName: string): Promise<boolean> => {
    const connection = connections.value.find(c => c.serverName === serverName)
    if (!connection) return false

    loading.value = true

    try {
      // 模拟连接
      await new Promise(r => setTimeout(r, 500))
      connection.status = 'connected'
      connection.lastPing = Date.now()
      return true
    } catch {
      connection.status = 'error'
      return false
    } finally {
      loading.value = false
    }
  }

  // 断开连接
  const disconnect = (serverName: string) => {
    const connection = connections.value.find(c => c.serverName === serverName)
    if (connection) {
      connection.status = 'disconnected'
    }
  }

  // 添加资源
  const addResource = (resource: Omit<MCPResource, 'id'>) => {
    const newResource: MCPResource = {
      ...resource,
      id: `res_${Date.now()}`
    }
    resources.value.push(newResource)
    return newResource
  }

  // 获取资源
  const getResource = (resourceId: string): MCPResource | undefined => {
    return resources.value.find(r => r.id === resourceId)
  }

  // 添加提示词
  const addPrompt = (prompt: Omit<MCPrompt, 'id'>) => {
    const newPrompt: MCPrompt = {
      ...prompt,
      id: `prompt_${Date.now()}`
    }
    prompts.value.push(newPrompt)
    return newPrompt
  }

  // 渲染提示词
  const renderPrompt = (promptId: string, variables: Record<string, any>): string => {
    const prompt = prompts.value.find(p => p.id === promptId)
    if (!prompt) return ''

    let result = prompt.template
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value))
    }
    return result
  }

  // 按分类获取工具
  const getToolsByCategory = computed(() => {
    const categories: Record<string, MCPTool[]> = {}
    tools.value.forEach(tool => {
      if (!categories[tool.category]) {
        categories[tool.category] = []
      }
      categories[tool.category].push(tool)
    })
    return categories
  })

  // 获取启用的工具
  const enabledTools = computed(() => tools.value.filter(t => t.enabled))

  // 统计信息
  const stats = computed(() => ({
    totalServers: servers.value.length,
    connectedServers: connections.value.filter(c => c.status === 'connected').length,
    totalTools: tools.value.length,
    enabledTools: enabledTools.value.length,
    totalResources: resources.value.length,
    totalPrompts: prompts.value.length,
    totalExecutions: executionHistory.value.length,
    successRate: executionHistory.value.length > 0
      ? (executionHistory.value.filter(e => e.status === 'success').length / executionHistory.value.length) * 100
      : 0
  }))

  // 清空执行历史
  const clearHistory = () => {
    executionHistory.value = []
  }

  return {
    // 数据
    servers,
    connections,
    tools,
    resources,
    prompts,
    executionHistory,
    currentExecution,
    loading,

    // 方法
    initSampleServers,
    addTool,
    removeTool,
    toggleTool,
    executeTool,
    addServer,
    removeServer,
    connect,
    disconnect,
    addResource,
    getResource,
    addPrompt,
    renderPrompt,
    clearHistory,

    // 计算属性
    getToolsByCategory,
    enabledTools,
    stats
  }
}

export default useMCPServer
