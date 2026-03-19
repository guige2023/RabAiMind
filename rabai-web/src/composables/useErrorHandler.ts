// Error Handler - 错误处理优化
import { ref, computed } from 'vue'

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'
export type ErrorCategory = 'network' | 'validation' | 'auth' | 'permission' | 'resource' | 'unknown'

export interface ErrorInfo {
  id: string
  code: string
  message: string
  details?: string
  severity: ErrorSeverity
  category: ErrorCategory
  timestamp: number
  stack?: string
  context?: Record<string, any>
  resolved: boolean
}

export interface ErrorConfig {
  enableLogging: boolean
  enableReporting: boolean
  maxErrors: number
  autoResolve: boolean
  retryEnabled: boolean
}

export interface ErrorTemplate {
  code: string
  title: string
  message: string
  severity: ErrorSeverity
  category: ErrorCategory
  suggestAction: string
  canRetry: boolean
}

// 错误模板
export const errorTemplates: ErrorTemplate[] = [
  {
    code: 'NETWORK_ERROR',
    title: '网络错误',
    message: '网络连接不稳定，请检查您的网络',
    severity: 'medium',
    category: 'network',
    suggestAction: '请检查网络后重试',
    canRetry: true
  },
  {
    code: 'TIMEOUT',
    title: '请求超时',
    message: '服务器响应时间过长',
    severity: 'medium',
    category: 'network',
    suggestAction: '请稍后重试',
    canRetry: true
  },
  {
    code: 'SERVER_ERROR',
    title: '服务器错误',
    message: '服务器暂时不可用',
    severity: 'high',
    category: 'network',
    suggestAction: '请稍后重试',
    canRetry: true
  },
  {
    code: 'VALIDATION_ERROR',
    title: '验证失败',
    message: '输入数据验证失败',
    severity: 'low',
    category: 'validation',
    suggestAction: '请检查输入内容',
    canRetry: false
  },
  {
    code: 'AUTH_ERROR',
    title: '认证失败',
    message: '登录状态已过期',
    severity: 'high',
    category: 'auth',
    suggestAction: '请重新登录',
    canRetry: false
  },
  {
    code: 'PERMISSION_DENIED',
    title: '权限不足',
    message: '您没有执行此操作的权限',
    severity: 'medium',
    category: 'permission',
    suggestAction: '请联系管理员获取权限',
    canRetry: false
  },
  {
    code: 'NOT_FOUND',
    title: '资源不存在',
    message: '请求的资源不存在',
    severity: 'low',
    category: 'resource',
    suggestAction: '请检查资源链接',
    canRetry: false
  },
  {
    code: 'QUOTA_EXCEEDED',
    title: '配额超限',
    message: '您已达到使用配额限制',
    severity: 'high',
    category: 'resource',
    suggestAction: '请升级套餐或等待配额重置',
    canRetry: false
  }
]

const defaultConfig: ErrorConfig = {
  enableLogging: true,
  enableReporting: false,
  maxErrors: 50,
  autoResolve: true,
  retryEnabled: true
}

export function useErrorHandler() {
  // 配置
  const config = ref<ErrorConfig>({ ...defaultConfig })

  // 错误列表
  const errors = ref<ErrorInfo[]>([])

  // 当前错误
  const currentError = ref<ErrorInfo | null>(null)

  // 错误摘要
  const errorSummary = computed(() => {
    const summary = {
      total: errors.value.length,
      unresolved: errors.value.filter(e => !e.resolved).length,
      byCategory: {} as Record<ErrorCategory, number>,
      bySeverity: {} as Record<ErrorSeverity, number>,
      recent: errors.value.slice(0, 5)
    }

    errors.value.forEach(error => {
      summary.byCategory[error.category] = (summary.byCategory[error.category] || 0) + 1
      summary.bySeverity[error.severity] = (summary.bySeverity[error.severity] || 0) + 1
    })

    return summary
  })

  // 创建错误
  const createError = (
    code: string,
    message: string,
    options?: Partial<ErrorInfo>
  ): ErrorInfo => {
    // 查找错误模板
    const template = errorTemplates.find(t => t.code === code)

    const error: ErrorInfo = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      code: template?.code || code,
      message: template?.message || message,
      details: options?.details,
      severity: options?.severity || template?.severity || 'medium',
      category: options?.category || template?.category || 'unknown',
      timestamp: Date.now(),
      stack: options?.stack,
      context: options?.context,
      resolved: false
    }

    return error
  }

  // 记录错误
  const logError = (
    code: string,
    message: string,
    options?: Partial<ErrorInfo>
  ): ErrorInfo => {
    const error = createError(code, message, options)

    // 添加到列表
    errors.value.unshift(error)

    // 限制错误数量
    if (errors.value.length > config.value.maxErrors) {
      errors.value = errors.value.slice(0, config.value.maxErrors)
    }

    // 设置为当前错误
    currentError.value = error

    // 记录到控制台
    if (config.value.enableLogging) {
      console.error(`[${error.code}] ${error.message}`, error)
    }

    return error
  }

  // 解析错误
  const parseError = (error: any): ErrorInfo => {
    // 处理标准Error对象
    if (error instanceof Error) {
      return logError('UNKNOWN', error.message, {
        stack: error.stack,
        details: error.name
      })
    }

    // 处理HTTP响应
    if (error.response) {
      const status = error.response.status

      if (status === 401) {
        return logError('AUTH_ERROR', '认证失败', {
          details: '请重新登录',
          context: { status }
        })
      }

      if (status === 403) {
        return logError('PERMISSION_DENIED', '权限不足', {
          context: { status }
        })
      }

      if (status === 404) {
        return logError('NOT_FOUND', '资源不存在', {
          context: { status }
        })
      }

      if (status === 429) {
        return logError('QUOTA_EXCEEDED', '请求过于频繁', {
          severity: 'high',
          context: { status }
        })
      }

      if (status >= 500) {
        return logError('SERVER_ERROR', '服务器错误', {
          severity: status >= 500 ? 'high' : 'medium',
          context: { status }
        })
      }
    }

    // 处理网络错误
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return logError('TIMEOUT', '请求超时', {
        category: 'network',
        severity: 'medium'
      })
    }

    if (error.message?.includes('network') || !navigator.onLine) {
      return logError('NETWORK_ERROR', '网络错误', {
        category: 'network'
      })
    }

    // 默认未知错误
    return logError('UNKNOWN', '发生未知错误', {
      details: typeof error === 'string' ? error : JSON.stringify(error)
    })
  }

  // 解决错误
  const resolveError = (errorId: string) => {
    const error = errors.value.find(e => e.id === errorId)
    if (error) {
      error.resolved = true
    }
  }

  // 解决所有错误
  const resolveAllErrors = () => {
    errors.value.forEach(e => e.resolved = true)
  }

  // 清除已解决的错误
  const clearResolvedErrors = () => {
    errors.value = errors.value.filter(e => !e.resolved)
  }

  // 清除所有错误
  const clearAllErrors = () => {
    errors.value = []
    currentError.value = null
  }

  // 获取错误建议
  const getErrorSuggestion = (error: ErrorInfo): string => {
    const template = errorTemplates.find(t => t.code === error.code)
    return template?.suggestAction || '请稍后重试'
  }

  // 检查是否可以重试
  const canRetry = (error: ErrorInfo): boolean => {
    if (!config.value.retryEnabled) return false

    const template = errorTemplates.find(t => t.code === error.code)
    return template?.canRetry || false
  }

  // 安全的异步包装
  const safeAsync = async <T>(
    fn: () => Promise<T>,
    errorCode?: string
  ): Promise<{ success: boolean; data?: T; error?: ErrorInfo }> => {
    try {
      const data = await fn()
      return { success: true, data }
    } catch (error) {
      const errorInfo = parseError(error)
      if (errorCode) {
        errorInfo.code = errorCode
      }
      return { success: false, error: errorInfo }
    }
  }

  // 带重试的异步包装
  const retryAsync = async <T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    delay = 1000
  ): Promise<{ success: boolean; data?: T; error?: ErrorInfo }> => {
    let lastError: ErrorInfo | null = null

    for (let i = 0; i < maxRetries; i++) {
      try {
        const data = await fn()
        return { success: true, data }
      } catch (error) {
        lastError = parseError(error)

        if (!canRetry(lastError)) {
          return { success: false, error: lastError }
        }

        // 等待后重试
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
        }
      }
    }

    return { success: false, error: lastError || undefined }
  }

  // 获取严重错误
  const criticalErrors = computed(() =>
    errors.value.filter(e => e.severity === 'critical' && !e.resolved)
  )

  // 是否有未解决的严重错误
  const hasCriticalErrors = computed(() => criticalErrors.value.length > 0)

  // 更新配置
  const updateConfig = (newConfig: Partial<ErrorConfig>) => {
    config.value = { ...config.value, ...newConfig }
  }

  return {
    // 配置和状态
    config,
    errors,
    currentError,
    // 计算属性
    errorSummary,
    criticalErrors,
    hasCriticalErrors,
    // 方法
    createError,
    logError,
    parseError,
    resolveError,
    resolveAllErrors,
    clearResolvedErrors,
    clearAllErrors,
    getErrorSuggestion,
    canRetry,
    safeAsync,
    retryAsync,
    updateConfig,
    errorTemplates
  }
}

export default useErrorHandler
