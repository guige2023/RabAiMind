// Voice Control - 语音控制功能
import { ref, computed, onMounted, onUnmounted } from 'vue'

export interface VoiceCommand {
  id: string
  phrase: string
  aliases: string[]
  action: string
  description: string
  params?: Record<string, any>
}

export interface VoiceRecognitionResult {
  transcript: string
  confidence: number
  commands: VoiceCommand[]
  isFinal: boolean
}

export interface VoiceSettings {
  language: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  noiseSuppression: boolean
  autoRestart: boolean
}

export interface TTSOptions {
  voice: string
  rate: number
  pitch: number
  volume: number
}

export function useVoiceControl() {
  // 语音识别状态
  const isListening = ref(false)

  // 识别结果
  const transcript = ref('')

  // 识别历史
  const transcriptHistory = ref<string[]>([])

  // 可用命令
  const commands = ref<VoiceCommand[]>([
    { id: 'cmd_1', phrase: '新建幻灯片', aliases: ['创建幻灯片', '添加一页'], action: 'createSlide', description: '创建新的幻灯片' },
    { id: 'cmd_2', phrase: '删除幻灯片', aliases: ['移除幻灯片', '删除当前页'], action: 'deleteSlide', description: '删除当前幻灯片' },
    { id: 'cmd_3', phrase: '下一页', aliases: ['下一张', '继续'], action: 'nextSlide', description: '切换到下一页' },
    { id: 'cmd_4', phrase: '上一页', aliases: ['上一张', '返回'], action: 'prevSlide', description: '切换到上一页' },
    { id: 'cmd_5', phrase: '保存', aliases: ['保存文件', '存盘'], action: 'save', description: '保存当前文件' },
    { id: 'cmd_6', phrase: '导出', aliases: ['导出PPT', '导出文件'], action: 'export', description: '导出PPT文件' },
    { id: 'cmd_7', phrase: '撤销', aliases: ['撤销操作', '回退'], action: 'undo', description: '撤销上一步操作' },
    { id: 'cmd_8', phrase: '重做', aliases: ['重做操作', '恢复'], action: 'redo', description: '重做操作' },
    { id: 'cmd_9', phrase: '全屏', aliases: ['全屏模式', '进入全屏'], action: 'fullscreen', description: '进入全屏模式' },
    { id: 'cmd_10', phrase: '退出全屏', aliases: ['退出全屏', '退出全屏模式'], action: 'exitFullscreen', description: '退出全屏模式' }
  ])

  // 识别器
  const recognition = ref<any>(null)

  // 语音合成
  const speechSynthesis = ref<SpeechSynthesis | null>(null)

  // 可用语音
  const availableVoices = ref<SpeechSynthesisVoice[]>([])

  // 设置
  const settings = ref<VoiceSettings>({
    language: 'zh-CN',
    continuous: true,
    interimResults: true,
    maxAlternatives: 1,
    noiseSuppression: true,
    autoRestart: true
  })

  // TTS设置
  const ttsOptions = ref<TTSOptions>({
    voice: '',
    rate: 1,
    pitch: 1,
    volume: 1
  })

  // 错误信息
  const error = ref<string | null>(null)

  // 初始化语音识别
  const initRecognition = (): boolean => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      error.value = '您的浏览器不支持语音识别'
      return false
    }

    recognition.value = new SpeechRecognition()
    recognition.value.continuous = settings.value.continuous
    recognition.value.interimResults = settings.value.interimResults
    recognition.value.maxAlternatives = settings.value.maxAlternatives
    recognition.value.lang = settings.value.language

    recognition.value.onresult = (event: any) => {
      const result = event.results[event.results.length - 1]
      const transcriptText = result[0].transcript
      const confidence = result[0].confidence

      transcript.value = transcriptText

      if (result.isFinal) {
        processCommand(transcriptText, confidence)
        transcriptHistory.value.push(transcriptText)
      }
    }

    recognition.value.onerror = (event: any) => {
      error.value = `语音识别错误: ${event.error}`

      if (settings.value.autoRestart && event.error !== 'no-speech') {
        setTimeout(startListening, 1000)
      }
    }

    recognition.value.onend = () => {
      if (settings.value.autoRestart && isListening.value) {
        try {
          recognition.value.start()
        } catch {
          // 忽略重启错误
        }
      }
    }

    return true
  }

  // 初始化语音合成
  const initSpeechSynthesis = () => {
    speechSynthesis.value = window.speechSynthesis

    const loadVoices = () => {
      availableVoices.value = speechSynthesis.value?.getVoices() || []
    }

    loadVoices()

    if (speechSynthesis.value?.onvoiceschanged !== undefined) {
      speechSynthesis.value.onvoiceschanged = loadVoices
    }
  }

  // 处理命令
  const processCommand = (text: string, confidence: number): VoiceCommand | null => {
    const lowerText = text.toLowerCase().trim()

    // 精确匹配
    let matched = commands.value.find(cmd =>
      cmd.phrase.toLowerCase() === lowerText ||
      cmd.aliases.some(alias => alias.toLowerCase() === lowerText)
    )

    // 模糊匹配
    if (!matched) {
      matched = commands.value.find(cmd =>
        lowerText.includes(cmd.phrase.toLowerCase()) ||
        cmd.aliases.some(alias => lowerText.includes(alias.toLowerCase()))
      )
    }

    if (matched && confidence > 0.5) {
      executeCommand(matched)
      return matched
    }

    return null
  }

  // 执行命令
  const executeCommand = (command: VoiceCommand) => {
    console.log('执行命令:', command.action, command.params)
    // 这里可以触发实际的事件或回调
  }

  // 开始监听
  const startListening = (): boolean => {
    if (!recognition.value) {
      if (!initRecognition()) return false
    }

    try {
      recognition.value.start()
      isListening.value = true
      error.value = null
      return true
    } catch (err) {
      error.value = (err as Error).message
      return false
    }
  }

  // 停止监听
  const stopListening = () => {
    if (recognition.value) {
      recognition.value.stop()
      isListening.value = false
    }
  }

  // 语音合成
  const speak = (text: string, options?: Partial<TTSOptions>): boolean => {
    if (!speechSynthesis.value) {
      initSpeechSynthesis()
    }

    if (!speechSynthesis.value) {
      error.value = '您的浏览器不支持语音合成'
      return false
    }

    // 停止当前语音
    speechSynthesis.value.cancel()

    const utterance = new SpeechSynthesisUtterance(text)

    if (options?.voice) {
      utterance.voice = availableVoices.value.find(v => v.name === options.voice)
    }

    utterance.rate = options?.rate ?? ttsOptions.value.rate
    utterance.pitch = options?.pitch ?? ttsOptions.value.pitch
    utterance.volume = options?.volume ?? ttsOptions.value.volume

    speechSynthesis.value.speak(utterance)
    return true
  }

  // 停止语音
  const stopSpeaking = () => {
    speechSynthesis.value?.cancel()
  }

  // 添加自定义命令
  const addCommand = (command: Omit<VoiceCommand, 'id'>) => {
    commands.value.push({
      ...command,
      id: `cmd_${Date.now()}`
    })
  }

  // 删除命令
  const removeCommand = (commandId: string) => {
    const index = commands.value.findIndex(c => c.id === commandId)
    if (index > -1) {
      commands.value.splice(index, 1)
    }
  }

  // 更新设置
  const updateSettings = (newSettings: Partial<VoiceSettings>) => {
    Object.assign(settings.value, newSettings)

    if (recognition.value) {
      recognition.value.lang = settings.value.language
      recognition.value.continuous = settings.value.continuous
      recognition.value.interimResults = settings.value.interimResults
    }
  }

  // 检查支持
  const isSupported = computed(() => {
    const hasSpeechRecognition = !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition
    const hasSpeechSynthesis = !!window.speechSynthesis
    return { speechRecognition: hasSpeechRecognition, speechSynthesis: hasSpeechSynthesis }
  })

  // 统计
  const stats = computed(() => ({
    isListening: isListening.value,
    transcriptLength: transcript.value.length,
    commandCount: commands.value.length,
    historyCount: transcriptHistory.value.length,
    availableVoices: availableVoices.value.length,
    error: error.value
  }))

  return {
    // 数据
    isListening,
    transcript,
    transcriptHistory,
    commands,
    availableVoices,
    settings,
    ttsOptions,
    error,

    // 方法
    initRecognition,
    initSpeechSynthesis,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    addCommand,
    removeCommand,
    updateSettings,
    processCommand,
    executeCommand,

    // 计算属性
    isSupported,
    stats
  }
}

export default useVoiceControl
