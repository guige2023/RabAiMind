// Error Message Improver - 错误提示改善
import { ref, computed } from 'vue'

export type ErrorCategory = 'network' | 'validation' | 'auth' | 'server' | 'client' | 'unknown'
export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical'

export interface ErrorMessage {
  id: string
  code: string
  category: ErrorCategory
  severity: ErrorSeverity
  title: string
  message: string
  description?: string
  suggestion?: string
  timestamp: number
  context?: Record<string, any>
}

export interface ErrorConfig {
  showSuggestions: boolean
  showDetails: boolean
  enableLogging: boolean
  maxHistory: number
}

// 错误代码映射
const errorCodeMap: Record<string, {
  category: ErrorCategory
  severity: ErrorSeverity
  title: string
  getMessage: (context?: Record<string, any>) => string
  getSuggestion: (context?: Record<string, any>) => string
}> = {
  // 网络错误
  'NETWORK_ERROR': {
    category: 'network',
    severity: 'error',
    title: '网络连接失败',
    getMessage: () => '无法连接到服务器，请检查您的网络连接',
    getSuggestion: () => '请检查网络后重试，或稍后再试'
  },
  'TIMEOUT': {
    category: 'network',
    severity: 'warning',
    title: '请求超时',
    getMessage: () => '服务器响应时间过长',
    getSuggestion: () => '网络可能不稳定，请稍后重试'
  },
  'OFFLINE': {
    category: 'network',
    severity: 'warning',
    title: '网络离线',
    getMessage: () => '您当前处于离线状态',
    getSuggestion: () => '请检查网络连接后继续操作'
  },

  // 验证错误
  'VALIDATION_ERROR': {
    category: 'validation',
    severity: 'error',
    title: '输入验证失败',
    getMessage: (ctx) => ctx?.field ? `字段"${ctx.field}"验证失败` : '请检查输入的内容',
    getSuggestion: (ctx) => ctx?.hint ? ctx.hint : '请确保所有必填项都已填写'
  },
  'INVALID_FORMAT': {
    category: 'validation',
    severity: 'error',
    title: '格式错误',
    getMessage: (ctx) => ctx?.expected ? `请输入${ctx.expected}格式` : '输入格式不正确',
    getSuggestion: (ctx) => ctx?.example ? `例如: ${ctx.example}` : '请检查格式后重试'
  },
  'FILE_TOO_LARGE': {
    category: 'validation',
    severity: 'warning',
    title: '文件过大',
    getMessage: (ctx) => ctx?.maxSize ? `文件大小不能超过${ctx.maxSize}` : '文件过大',
    getSuggestion: (ctx) => ctx?.suggestedSize ? `建议上传${ctx.suggestedSize}以下的文件` : '请压缩文件后重试'
  },

  // 认证错误
  'AUTH_REQUIRED': {
    category: 'auth',
    severity: 'warning',
    title: '需要登录',
    getMessage: () => '请先登录后再继续操作',
    getSuggestion: () => '点击登录按钮进行身份验证'
  },
  'AUTH_EXPIRED': {
    category: 'auth',
    severity: 'error',
    title: '登录已过期',
    getMessage: () => '您的登录状态已过期',
    getSuggestion: () => '请重新登录以继续'
  },
  'PERMISSION_DENIED': {
    category: 'auth',
    severity: 'error',
    title: '权限不足',
    getMessage: () = > '您没有执行此操作的权限',
    getSuggestion: () => '请联系管理员获取相应权限'
  },

  // 服务器错误
  'SERVER_ERROR': {
    category: 'server',
    severity: 'critical',
    title: '服务器错误',
    getMessage: () => '服务器出现了问题',
    getSuggestion: () => '请稍后再试，如问题持续请联系支持'
  },
  'MAINTENANCE': {
    category: 'server',
    severity: 'info',
    title: '系统维护中',
    getMessage: () => '系统正在进行维护',
    getSuggestion: () => '请稍后再来，预计维护时间不久'
  },
  'RATE_LIMIT': {
    category: 'server',
    severity: 'warning',
    title: '请求过于频繁',
    getMessage: () => '您请求的频率过高',
    getSuggestion: () => '请稍等片刻后再继续操作'
  },

  // 客户端错误
  'NOT_FOUND': {
    category: 'client',
    severity: 'error',
    title: '内容未找到',
    getMessage: (ctx) => ctx?.resource ? `找不到${ctx.resource}` : '请求的内容不存在',
    getSuggestion: () => '请检查链接是否正确或返回首页'
  },
  'ALREADY_EXISTS': {
    category: 'client',
    severity: 'warning',
    title: '已存在',
    getMessage: (ctx) => ctx?.resource ? `${ctx.resource}已存在` : '该内容已存在',
    getSuggestion: (ctx) => ctx?.suggestion || '请使用其他名称或修改现有内容'
  },
  'OPERATION_FAILED': {
    category: 'client',
    severity: 'error',
    title: '操作失败',
    getMessage: () => '操作未能完成',
    getSuggestion: () => '请重试或刷新页面后再次尝试'
  }
}

export function useErrorMessageImprover() {
  // 配置
  const config = ref<ErrorConfig>({
    showSuggestions: true,
    showDetails: true,
    enableLogging: true,
    maxHistory: 50
  })

  // 错误历史
  const errorHistory = ref<ErrorMessage[]>([])

  // 当前错误
  const currentError = ref<ErrorMessage | null>(null)

  // 创建错误消息
  const createError = (
    code: string,
    context?: Record<string, any>,
    customMessage?: string
  ): ErrorMessage => {
    const errorDef = errorCodeMap[code]
    const timestamp = Date.now()

    const error: ErrorMessage = {
      id: `err_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
      code,
      category: errorDef?.category || 'unknown',
      severity: errorDef?.severity || 'error',
      title: errorDef?.title || '未知错误',
      message: customMessage || errorDef?.getMessage(context) || '发生了一个错误',
      description: errorDef ? undefined : JSON.stringify(context),
      suggestion: errorDef?.getSuggestion(context),
      timestamp,
      context
    }

    return error
  }

  // 显示错误
  const showError = (error: ErrorMessage) => {
    currentError.value = error
    errorHistory.value.unshift(error)

    // 限制历史
    if (errorHistory.value.length > config.value.maxHistory) {
      errorHistory.value.pop()
    }

    // 记录日志
    if (config.value.enableLogging) {
      console.error(`[${error.code}] ${error.title}:`, error.message, error.context)
    }
  }

  // 显示错误（通过代码）
  const showErrorByCode = (
    code: string,
    context?: Record<string, any>,
    customMessage?: string
  ) => {
    const error = createError(code, context, customMessage)
    showError(error)
  }

  // 清除当前错误
  const clearError = () => {
    currentError.value = null
  }

  // 清除历史
  const clearHistory = () => {
    errorHistory.value = []
  }

  // 获取错误统计
  const errorStats = computed(() => {
    const total = errorHistory.value.length

    const byCategory: Record<ErrorCategory, number> = {
      network: 0,
      validation: 0,
      auth: 0,
      server: 0,
      client: 0,
      unknown: 0
    }

    const bySeverity: Record<ErrorSeverity, number> = {
      info: 0,
      warning: 0,
      error: 0,
      critical: 0
    }

    errorHistory.value.forEach(e => {
      byCategory[e.category]++
      bySeverity[e.severity]++
    })

    return {
      total,
      byCategory,
      bySeverity,
      latest: errorHistory.value[0] || null
    }
  })

  // 获取错误建议
  const getSuggestion = (code: string, context?: Record<string, any>): string => {
    const errorDef = errorCodeMap[code]
    return errorDef?.getSuggestion(context) || '请稍后重试'
  }

  // 更新配置
  const updateConfig = (updates: Partial<ErrorConfig>) => {
    config.value = { ...config.value, ...updates }
  }

  // 获取所有错误代码
  const getErrorCodes = computed(() => Object.keys(errorCodeMap))

  return {
    config,
    errorHistory,
    currentError,
    createError,
    showError,
    showErrorByCode,
    clearError,
    clearHistory,
    errorStats,
    getSuggestion,
    updateConfig,
    getErrorCodes
  }
}

export default useErrorMessageImprover
