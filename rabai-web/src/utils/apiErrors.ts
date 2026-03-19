// API错误处理和友好提示

export interface ApiError {
  type: 'network' | 'server' | 'timeout' | 'validation' | 'unknown'
  message: string
  userMessage: string
  code?: string
  status?: number
}

// 错误类型分类
const classifyError = (error: any): ApiError => {
  // 网络错误
  if (!error.response) {
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return {
        type: 'timeout',
        message: error.message,
        userMessage: '请求超时，请检查网络后重试',
        code: error.code
      }
    }
    if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
      return {
        type: 'network',
        message: error.message,
        userMessage: '网络连接失败，请检查网络设置',
        code: error.code
      }
    }
    return {
      type: 'network',
      message: error.message,
      userMessage: '网络错误，请检查网络连接后重试',
      code: error.code
    }
  }

  const status = error.response?.status
  const data = error.response?.data

  // 服务器错误 5xx
  if (status && status >= 500) {
    return {
      type: 'server',
      message: data?.message || error.message,
      userMessage: '服务器繁忙，请稍后重试',
      status,
      code: data?.code
    }
  }

  // 客户端错误 4xx
  if (status === 400) {
    return {
      type: 'validation',
      message: data?.message || error.message,
      userMessage: data?.message || '请求参数有误，请检查输入',
      status,
      code: data?.code
    }
  }

  if (status === 401) {
    return {
      type: 'validation',
      message: data?.message || error.message,
      userMessage: '登录已过期，请重新登录',
      status,
      code: data?.code
    }
  }

  if (status === 403) {
    return {
      type: 'validation',
      message: data?.message || error.message,
      userMessage: '没有权限执行此操作',
      status,
      code: data?.code
    }
  }

  if (status === 404) {
    return {
      type: 'validation',
      message: data?.message || error.message,
      userMessage: '请求的资源不存在',
      status,
      code: data?.code
    }
  }

  if (status === 429) {
    return {
      type: 'server',
      message: data?.message || error.message,
      userMessage: '请求过于频繁，请稍后再试',
      status,
      code: data?.code
    }
  }

  // 未知错误
  return {
    type: 'unknown',
    message: error.message,
    userMessage: '操作失败，请重试',
    status,
    code: data?.code
  }
}

// 获取错误处理建议
export const getErrorSuggestions = (error: ApiError): string[] => {
  const suggestions: string[] = []

  switch (error.type) {
    case 'network':
      suggestions.push('请检查您的网络连接')
      suggestions.push('尝试刷新页面后重试')
      suggestions.push('如果使用VPN，请尝试关闭')
      break
    case 'timeout':
      suggestions.push('服务器响应较慢，请耐心等待')
      suggestions.push('可以尝试减少请求的数据量')
      break
    case 'server':
      suggestions.push('服务器暂时不可用')
      suggestions.push('建议稍后再试')
      break
    case 'validation':
      if (error.status === 400) {
        suggestions.push('请检查输入的内容是否正确')
      }
      break
  }

  return suggestions
}

// 统一错误处理函数
export const handleApiError = (error: any): ApiError => {
  const classified = classifyError(error)
  console.error('API Error:', classified)
  return classified
}

// 显示错误提示
export const showErrorToast = (error: ApiError): void => {
  // 可以集成 toast 组件
  console.warn('Error:', error.userMessage)
}

// 生成友好的错误消息
export const getFriendlyErrorMessage = (error: any): string => {
  const classified = classifyError(error)
  return classified.userMessage
}

export default {
  classifyError,
  getErrorSuggestions,
  handleApiError,
  showErrorToast,
  getFriendlyErrorMessage
}
