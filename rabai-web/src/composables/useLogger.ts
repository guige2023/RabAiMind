// useLogger.ts - 日志模块
import { ref, computed } from 'vue'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  id: string
  level: LogLevel
  message: string
  timestamp: number
  data?: any
}

export interface LoggerConfig {
  level: LogLevel
  maxEntries: number
  enableConsole: boolean
  enableRemote: boolean
}

export function useLogger() {
  const config = ref<LoggerConfig>({
    level: 'info',
    maxEntries: 200,
    enableConsole: true,
    enableRemote: false
  })

  const logs = ref<LogEntry[]>([])

  const levels: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 }

  const shouldLog = (level: LogLevel): boolean => {
    return levels[level] >= levels[config.value.level]
  }

  const log = (level: LogLevel, message: string, data?: any): void => {
    if (!shouldLog(level)) return

    const entry: LogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      level,
      message,
      timestamp: Date.now(),
      data
    }

    logs.value.unshift(entry)

    if (logs.value.length > config.value.maxEntries) {
      logs.value.pop()
    }

    if (config.value.enableConsole) {
      const method = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'
      console[method](`[${level.toUpperCase()}]`, message, data || '')
    }
  }

  const debug = (message: string, data?: any) => log('debug', message, data)
  const info = (message: string, data?: any) => log('info', message, data)
  const warn = (message: string, data?: any) => log('warn', message, data)
  const error = (message: string, data?: any) => log('error', message, data)

  const clear = () => { logs.value = [] }

  const getByLevel = (level: LogLevel) => logs.value.filter(l => l.level === level)

  const stats = computed(() => ({
    total: logs.value.length,
    debug: getByLevel('debug').length,
    info: getByLevel('info').length,
    warn: getByLevel('warn').length,
    error: getByLevel('error').length
  }))

  return { config, logs, log, debug, info, warn, error, clear, getByLevel, stats }
}

export default useLogger
