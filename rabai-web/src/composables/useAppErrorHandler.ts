// App Error Handler - 全局错误处理与恢复
import { ref, computed, onMounted, onUnmounted } from 'vue'

export interface ErrorRecord {
  id: string
  type: 'error' | 'warning' | 'info'
  source: string
  message: string
  stack?: string
  timestamp: number
  resolved: boolean
}

export interface ErrorConfig {
  maxRecords: number
  autoReport: boolean
  logToConsole: boolean
  retryEnabled: boolean
  maxRetries: number
}

export interface RecoveryAction {
  id: string
  name: string
  action: () => Promise<boolean>
  description: string
}

export function useAppErrorHandler() {
  // 错误记录
  const errors = ref<ErrorRecord[]>([])

  // 配置
  const config = ref<ErrorConfig>({
    maxRecords: 100,
    autoReport: false,
    logToConsole: true,
    retryEnabled: true,
    maxRetries: 3
  })

  // 恢复操作
  const recoveryActions = ref<Map<string, RecoveryAction>>(new Map())

  // 全局错误处理器
  let errorHandler: ((event: ErrorEvent) => void) | null = null
  let unhandledRejectionHandler: ((event: PromiseRejectionEvent) => void) | null = null

  // 记录错误
  const recordError = (source: string, message: string, type: ErrorRecord['type'] = 'error', stack?: string): ErrorRecord => {
    const record: ErrorRecord = {
      id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      source,
      message,
      stack,
      timestamp: Date.now(),
      resolved: false
    }

    errors.value.unshift(record)

    // 限制记录数量
    if (errors.value.length > config.value.maxRecords) {
      errors.value.pop()
    }

    // 输出到控制台
    if (config.value.logToConsole) {
      console[type === 'error' ? 'error' : type === 'warning' ? 'warn' : 'log'](
        `[${source}] ${message}`,
        stack || ''
      )
    }

    return record
  }

  // 记录JS错误
  const handleError = (event: ErrorEvent): void => {
    recordError(
      'javascript',
      event.message,
      'error',
      event.error?.stack
    )
  }

  // 记录Promise错误
  const handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
    recordError(
      'promise',
      event.reason?.message || 'Unhandled Promise Rejection',
      'error',
      event.reason?.stack
    )
  }

  // 安装全局错误处理器
  const installHandlers = (): void => {
    errorHandler = handleError
    unhandledRejectionHandler = handleUnhandledRejection

    window.addEventListener('error', errorHandler)
    window.addEventListener('unhandledrejection', unhandledRejectionHandler)
  }

  // 卸载全局错误处理器
  const uninstallHandlers = (): void => {
    if (errorHandler) {
      window.removeEventListener('error', errorHandler)
    }
    if (unhandledRejectionHandler) {
      window.removeEventListener('unhandledrejection', unhandledRejectionHandler)
    }
  }

  // 注册恢复操作
  const registerRecovery = (key: string, action: RecoveryAction): void => {
    recoveryActions.value.set(key, action)
  }

  // 执行恢复操作
  const executeRecovery = async (key: string): Promise<boolean> => {
    const action = recoveryActions.value.get(key)
    if (!action) {
      return false
    }

    try {
      return await action.action()
    } catch (error) {
      recordError(
        'recovery',
        `Recovery failed: ${error}`,
        'error'
      )
      return false
    }
  }

  // 解决错误
  const resolveError = (errorId: string): boolean => {
    const error = errors.value.find(e => e.id === errorId)
    if (error) {
      error.resolved = true
      return true
    }
    return false
  }

  // 获取未解决的错误
  const getUnresolvedErrors = (): ErrorRecord[] => {
    return errors.value.filter(e => !e.resolved)
  }

  // 获取错误统计
  const errorStats = computed(() => {
    const total = errors.value.length
    const resolved = errors.value.filter(e => e.resolved).length
    const unresolved = total - resolved

    return {
      total,
      resolved,
      unresolved,
      errorCount: errors.value.filter(e => e.type === 'error').length,
      warningCount: errors.value.filter(e => e.type === 'warning').length,
      infoCount: errors.value.filter(e => e.type === 'info').length
    }
  })

  // 清空错误记录
  const clearErrors = (): void => {
    errors.value = []
  }

  // 更新配置
  const updateConfig = (updates: Partial<ErrorConfig>): void => {
    Object.assign(config.value, updates)
  }

  // 初始化
  onMounted(() => {
    installHandlers()
  })

  onUnmounted(() => {
    uninstallHandlers()
  })

  return {
    errors,
    config,
    recoveryActions,
    recordError,
    installHandlers,
    uninstallHandlers,
    registerRecovery,
    executeRecovery,
    resolveError,
    getUnresolvedErrors,
    errorStats,
    clearErrors,
    updateConfig
  }
}

export default useAppErrorHandler
