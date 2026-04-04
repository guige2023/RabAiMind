/**
 * useVoiceDictation - Voice dictation for mobile slide content editing
 * Uses Web Speech API (SpeechRecognition) to convert speech to text
 * and insert into the active input/textarea field
 */
import { ref, onUnmounted } from 'vue'

export interface VoiceDictationOptions {
  language?: string
  continuous?: boolean
  interimResults?: boolean
  maxAlternatives?: number
}

export function useVoiceDictation(options: VoiceDictationOptions = {}) {
  const {
    language = 'zh-CN',
    continuous = false,
    interimResults = true,
    maxAlternatives = 1
  } = options

  const isListening = ref(false)
  const transcript = ref('')
  const interimTranscript = ref('')
  const error = ref<string | null>(null)
  const isSupported = ref(false)

  let recognition: any = null
  let mediaStream: MediaStream | null = null

  // Check support
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  isSupported.value = !!SpeechRecognition

  const initRecognition = () => {
    if (!SpeechRecognition) return null
    const rec = new SpeechRecognition()
    rec.lang = language
    rec.continuous = continuous
    rec.interimResults = interimResults
    rec.maxAlternatives = maxAlternatives
    rec.interimResults = true

    rec.onstart = () => {
      isListening.value = true
      error.value = null
    }

    rec.onend = () => {
      isListening.value = false
      interimTranscript.value = ''
    }

    rec.onerror = (e: any) => {
      isListening.value = false
      if (e.error === 'not-allowed') {
        error.value = '请允许麦克风访问权限'
      } else if (e.error === 'no-speech') {
        error.value = '未检测到语音，请重试'
      } else if (e.error === 'network') {
        error.value = '网络错误，请检查网络连接'
      } else {
        error.value = `语音识别错误: ${e.error}`
      }
    }

    rec.onresult = (event: any) => {
      let finalText = ''
      let interimText = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalText += result[0].transcript
        } else {
          interimText += result[0].transcript
        }
      }

      if (finalText) {
        transcript.value += finalText
        interimTranscript.value = ''
      } else {
        interimTranscript.value = interimText
      }
    }

    return rec
  }

  const start = async () => {
    if (!isSupported.value) {
      error.value = '当前浏览器不支持语音识别'
      return false
    }

    if (isListening.value) return false

    // Request microphone permission
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStream.getTracks().forEach(track => track.stop())
      mediaStream = null
    } catch (e) {
      error.value = '无法访问麦克风，请检查权限设置'
      return false
    }

    recognition = initRecognition()
    if (!recognition) return false

    try {
      transcript.value = ''
      interimTranscript.value = ''
      recognition.start()
      return true
    } catch (e: any) {
      error.value = `启动语音识别失败: ${e.message || e}`
      return false
    }
  }

  const stop = (): string => {
    if (recognition) {
      try {
        recognition.stop()
      } catch (e) {
        // ignore
      }
    }
    isListening.value = false
    return transcript.value
  }

  const startForInput = async (
    inputRef: { value: HTMLInputElement | HTMLTextAreaElement | null },
    options?: { append?: boolean }
  ): Promise<string> => {
    const success = await start()
    if (!success) return ''

    const { append = true } = options || {}

    if (!append) {
      transcript.value = ''
    }

    // Poll for transcript updates and inject into the input field
    return new Promise<string>((resolve) => {
      const checkInterval = setInterval(() => {
        const target = inputRef.value
        if (!target) return

        if (!isListening.value && transcript.value) {
          clearInterval(checkInterval)
          if (append) {
            const pos = target.selectionStart ?? target.value.length
            const before = target.value.substring(0, pos)
            const after = target.value.substring(pos)
            target.value = before + transcript.value + after
            // Move cursor to end of inserted text
            const newPos = pos + transcript.value.length
            target.setSelectionRange(newPos, newPos)
            // Trigger Vue reactivity
            target.dispatchEvent(new Event('input', { bubbles: true }))
          }
          resolve(transcript.value)
        }
      }, 100)

      // Auto-resolve after 60 seconds
      setTimeout(() => {
        clearInterval(checkInterval)
        if (isListening.value) {
          stop()
        }
        resolve(transcript.value)
      }, 60000)
    })
  }

  onUnmounted(() => {
    stop()
  })

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    start,
    stop,
    startForInput
  }
}
