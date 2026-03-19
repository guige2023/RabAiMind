// Voice Input - 语音输入支持
import { ref, computed, onMounted, onUnmounted } from 'vue'

export type VoiceRecognitionState = 'idle' | 'listening' | 'processing' | 'error'

export interface VoiceConfig {
  language: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
}

export interface VoiceResult {
  transcript: string
  isFinal: boolean
  confidence: number
  alternatives: string[]
  timestamp: number
}

export function useVoiceInput() {
  // 配置
  const config = ref<VoiceConfig>({
    language: 'zh-CN',
    continuous: true,
    interimResults: true,
    maxAlternatives: 3
  })

  // 状态
  const state = ref<VoiceRecognitionState>('idle')
  const isSupported = ref(false)
  const isListening = ref(false)

  // 结果
  const currentResult = ref<VoiceResult | null>(null)
  const results = ref<VoiceResult[]>([])
  const error = ref<string | null>(null)

  // 语音识别实例
  let recognition: any = null

  // 初始化
  const init = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      isSupported.value = false
      error.value = '您的浏览器不支持语音识别'
      return
    }

    isSupported.value = true
    recognition = new SpeechRecognition()

    recognition.lang = config.value.language
    recognition.continuous = config.value.continuous
    recognition.interimResults = config.value.interimResults
    recognition.maxAlternatives = config.value.maxAlternatives

    // 结果事件
    recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1]
      const voiceResult: VoiceResult = {
        transcript: result[0].transcript,
        isFinal: result.isFinal,
        confidence: result[0].confidence || 0,
        alternatives: Array.from(result).slice(1).map((r: any) => r.transcript),
        timestamp: Date.now()
      }

      if (result.isFinal) {
        results.value.push(voiceResult)
      }

      currentResult.value = voiceResult
      state.value = 'processing'
    }

    // 开始监听
    recognition.onstart = () => {
      state.value = 'listening'
      isListening.value = true
      error.value = null
    }

    // 结束监听
    recognition.onend = () => {
      state.value = 'idle'
      isListening.value = false
    }

    // 错误处理
    recognition.onerror = (event: any) => {
      state.value = 'error'
      error.value = getErrorMessage(event.error)
      isListening.value = false
    }
  }

  // 获取错误消息
  const getErrorMessage = (errorCode: string): string => {
    const messages: Record<string, string> = {
      'no-speech': '未检测到语音',
      'audio-capture': '无法访问麦克风',
      'not-allowed': '麦克风权限被拒绝',
      'network': '网络错误',
      'aborted': '操作被取消',
      'language-not-supported': '不支持该语言'
    }
    return messages[errorCode] || '语音识别出错'
  }

  // 开始识别
  const startListening = (): boolean => {
    if (!recognition) {
      init()
    }

    if (!isSupported.value) {
      error.value = '语音识别不可用'
      return false
    }

    try {
      recognition.start()
      return true
    } catch (e) {
      error.value = '启动语音识别失败'
      return false
    }
  }

  // 停止识别
  const stopListening = () => {
    if (recognition && isListening.value) {
      recognition.stop()
    }
  }

  // 切换识别状态
  const toggleListening = (): boolean => {
    if (isListening.value) {
      stopListening()
      return false
    } else {
      return startListening()
    }
  }

  // 清除结果
  const clearResults = () => {
    results.value = []
    currentResult.value = null
  }

  // 设置语言
  const setLanguage = (lang: string) => {
    config.value.language = lang
    if (recognition) {
      recognition.lang = lang
    }
  }

  // 获取转录文本
  const transcript = computed(() => {
    if (currentResult.value) {
      return currentResult.value.transcript
    }
    return ''
  })

  // 获取所有转录
  const fullTranscript = computed(() => {
    return results.value.map(r => r.transcript).join(' ')
  })

  // 获取最后一句话
  const lastResult = computed(() => {
    return results.value[results.value.length - 1] || null
  })

  // 导出为文本
  const exportAsText = (): string => {
    return fullTranscript.value
  }

  onMounted(() => {
    init()
  })

  onUnmounted(() => {
    if (recognition) {
      recognition.stop()
    }
  })

  return {
    // 配置和状态
    config,
    state,
    isSupported,
    isListening,
    currentResult,
    results,
    error,
    // 计算属性
    transcript,
    fullTranscript,
    lastResult,
    // 方法
    init,
    startListening,
    stopListening,
    toggleListening,
    clearResults,
    setLanguage,
    exportAsText
  }
}

export default useVoiceInput
