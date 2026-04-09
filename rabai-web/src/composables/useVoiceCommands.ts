/**
 * useVoiceCommands.ts
 * Voice command recognition + execution + TTS read-aloud + voice training
 * 
 * Features:
 * 1. Voice command recognition ("next slide", "go to slide 5")
 * 2. Read slide aloud (TTS via backend edge-tts)
 * 3. Multi-language voice support
 * 4. Voice training mode for personalized commands
 * 5. Real-time STT for live captions
 */

import { ref, computed, onUnmounted } from 'vue'
import { api } from '../api/client'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface VoiceCommand {
  id: string
  phrase: string          // spoken phrase
  action: string          // action type: 'navigation' | 'control' | 'custom'
  value?: string          // action value: 'next' | 'prev' | 'slide:5'
  description?: string
  icon?: string
}

export interface VoiceSettings {
  enabled: boolean
  language: string        // recognition language
  ttsVoice: string        // TTS voice ID
  ttsRate: string         // speech rate "+0%"
  ttsVolume: string       // volume "+0%"
  ttsPitch: string        // pitch "+0Hz"
  captionsEnabled: boolean
  captionsLanguage: string
  commandFeedback: boolean // play sound on command recognition
}

export interface CaptionLine {
  text: string
  startTime: number
  isFinal: boolean
}

// ─── Default Commands ─────────────────────────────────────────────────────────

const DEFAULT_COMMANDS: VoiceCommand[] = [
  // Navigation
  { id: 'nav-next', phrase: 'next slide', action: 'navigation', value: 'next', description: 'Go to next slide', icon: '➡️' },
  { id: 'nav-prev', phrase: 'previous slide', action: 'navigation', value: 'prev', description: 'Go to previous slide', icon: '⬅️' },
  { id: 'nav-first', phrase: 'first slide', action: 'navigation', value: 'first', description: 'Go to first slide', icon: '⏮️' },
  { id: 'nav-last', phrase: 'last slide', action: 'navigation', value: 'last', description: 'Go to last slide', icon: '⏭️' },
  { id: 'nav-go', phrase: 'go to slide', action: 'navigation', value: 'go', description: 'Go to specific slide', icon: '🔢' },
  // Control
  { id: 'ctrl-start', phrase: 'start presentation', action: 'control', value: 'start', description: 'Start presentation', icon: '▶️' },
  { id: 'ctrl-pause', phrase: 'pause', action: 'control', value: 'pause', description: 'Pause presentation', icon: '⏸️' },
  { id: 'ctrl-resume', phrase: 'resume', action: 'control', value: 'resume', description: 'Resume presentation', icon: '▶️' },
  { id: 'ctrl-read', phrase: 'read slide', action: 'control', value: 'read', description: 'Read current slide aloud', icon: '🔊' },
  { id: 'ctrl-stop', phrase: 'stop reading', action: 'control', value: 'stop', description: 'Stop reading aloud', icon: '⏹️' },
  { id: 'ctrl-captions', phrase: 'show captions', action: 'control', value: 'captions', description: 'Toggle live captions', icon: '📝' },
  { id: 'ctrl-annotate', phrase: 'annotate', action: 'annotation', value: 'annotate', description: 'Voice annotate current slide', icon: '📝' },
  { id: 'ctrl-annotate-start', phrase: 'start annotating', action: 'annotation', value: 'start', description: 'Start voice annotation', icon: '🎤' },
  { id: 'ctrl-annotate-stop', phrase: 'stop annotating', action: 'annotation', value: 'stop', description: 'Stop voice annotation', icon: '⏹️' },
  // Chinese navigation
  { id: 'nav-next-zh', phrase: '下一页', action: 'navigation', value: 'next', description: '下一页', icon: '➡️' },
  { id: 'nav-prev-zh', phrase: '上一页', action: 'navigation', value: 'prev', description: '上一页', icon: '⬅️' },
  { id: 'nav-first-zh', phrase: '第一页', action: 'navigation', value: 'first', description: '第一页', icon: '⏮️' },
  { id: 'nav-last-zh', phrase: '最后一页', action: 'navigation', value: 'last', description: '最后一页', icon: '⏭️' },
]

// ─── Composable ─────────────────────────────────────────────────────────────

export function useVoiceCommands() {
  // ── State ────────────────────────────────────────────────────────────────
  const settings = ref<VoiceSettings>(loadSettings())
  const customCommands = ref<VoiceCommand[]>(loadCustomCommands())
  const isListening = ref(false)
  const isSpeaking = ref(false)
  const currentTranscript = ref('')
  const captions = ref<CaptionLine[]>([])
  const captionsVisible = ref(false)
  const lastRecognizedCommand = ref<string | null>(null)
  const commandError = ref<string | null>(null)

  // Web Speech API instances
  let recognition: any = null
  let speechSynthesis: SpeechSynthesis | null = null
  let currentUtterance: SpeechSynthesisUtterance | null = null

  // ── Settings Storage ─────────────────────────────────────────────────────

  function loadSettings(): VoiceSettings {
    try {
      const saved = localStorage.getItem('rabai_voice_settings')
      if (saved) return JSON.parse(saved)
    } catch {}
    return {
      enabled: true,
      language: 'zh-CN',
      ttsVoice: 'zh-CN-Xiaoxiao',
      ttsRate: '+0%',
      ttsVolume: '+0%',
      ttsPitch: '+0Hz',
      captionsEnabled: true,
      captionsLanguage: 'zh-CN',
      commandFeedback: true,
    }
  }

  function saveSettings() {
    localStorage.setItem('rabai_voice_settings', JSON.stringify(settings.value))
  }

  function loadCustomCommands(): VoiceCommand[] {
    try {
      const saved = localStorage.getItem('rabai_custom_voice_commands')
      if (saved) return JSON.parse(saved)
    } catch {}
    return []
  }

  function saveCustomCommands() {
    localStorage.setItem('rabai_custom_voice_commands', JSON.stringify(customCommands.value))
  }

  // ── All Commands (default + custom) ──────────────────────────────────────

  const allCommands = computed(() => [...DEFAULT_COMMANDS, ...customCommands.value])

  // ── Voice Recognition Setup ──────────────────────────────────────────────

  function initRecognition() {
    if (typeof window === 'undefined') return
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      commandError.value = 'Browser does not support speech recognition'
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = settings.value.language

    recognition.onstart = () => {
      isListening.value = true
      commandError.value = null
    }

    recognition.onend = () => {
      isListening.value = false
    }

    recognition.onerror = (event: any) => {
      console.warn('[VoiceCommands] Recognition error:', event.error)
      if (event.error === 'no-speech') return
      commandError.value = event.error
      isListening.value = false
    }

    recognition.onresult = (event: any) => {
      let interimTranscript = ''
      let finalTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      currentTranscript.value = finalTranscript || interimTranscript

      if (finalTranscript) {
        handleTranscript(finalTranscript.trim())
      }
    }
  }

  // ── Command Matching ─────────────────────────────────────────────────────

  function matchCommand(transcript: string): VoiceCommand | null {
    const normalized = transcript.toLowerCase().trim()

    // Check custom commands first
    for (const cmd of customCommands.value) {
      if (normalized.includes(cmd.phrase.toLowerCase())) {
        return cmd
      }
    }

    // Check default commands
    for (const cmd of DEFAULT_COMMANDS) {
      if (normalized.includes(cmd.phrase.toLowerCase())) {
        return cmd
      }
    }

    // Pattern match: "go to slide N"
    const goToMatch = normalized.match(/go to slide (\d+)/)
    if (goToMatch) {
      return {
        id: 'nav-go-x',
        phrase: transcript,
        action: 'navigation',
        value: `slide:${goToMatch[1]}`,
        description: `Go to slide ${goToMatch[1]}`,
        icon: '🔢',
      }
    }

    // Pattern match: "第 N 页" (Chinese)
    const chineseMatch = normalized.match(/第\s*(\d+)\s*页/)
    if (chineseMatch) {
      return {
        id: 'nav-go-zh',
        phrase: transcript,
        action: 'navigation',
        value: `slide:${chineseMatch[1]}`,
        description: `Go to slide ${chineseMatch[1]}`,
        icon: '🔢',
      }
    }

    return null
  }

  // ── Command Handlers ─────────────────────────────────────────────────────

  let onNavigation: ((action: string, value?: string) => void) | null = null
  let onControl: ((action: string, value?: string) => void) | null = null
  let onAnnotation: ((action: string, value?: string) => void) | null = null

  function setNavigationHandler(handler: (action: string, value?: string) => void) {
    onNavigation = handler
  }

  function setControlHandler(handler: (action: string, value?: string) => void) {
    onControl = handler
  }

  function setAnnotationHandler(handler: (action: string, value?: string) => void) {
    onAnnotation = handler
  }

  function handleTranscript(transcript: string) {
    const cmd = matchCommand(transcript)
    if (!cmd) return

    lastRecognizedCommand.value = cmd.phrase
    if (settings.value.commandFeedback) {
      playFeedback()
    }

    if (cmd.action === 'navigation' && onNavigation) {
      onNavigation(cmd.action, cmd.value)
    } else if (cmd.action === 'control' && onControl) {
      onControl(cmd.action, cmd.value)
    } else if (cmd.action === 'annotation' && onAnnotation) {
      onAnnotation(cmd.action, cmd.value)
    }
  }

  function playFeedback() {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()
      oscillator.connect(gain)
      gain.connect(ctx.destination)
      oscillator.frequency.value = 880
      gain.gain.value = 0.1
      oscillator.start()
      oscillator.stop(ctx.currentTime + 0.05)
    } catch {}
  }

  // ── Start/Stop Listening ─────────────────────────────────────────────────

  function startListening() {
    if (!settings.value.enabled) return
    if (!recognition) initRecognition()
    if (!recognition) return
    try {
      recognition.lang = settings.value.language
      recognition.start()
    } catch (e) {
      console.warn('[VoiceCommands] Start failed:', e)
    }
  }

  function stopListening() {
    if (!recognition) return
    try {
      recognition.stop()
    } catch {}
    isListening.value = false
  }

  function toggleListening() {
    if (isListening.value) {
      stopListening()
    } else {
      startListening()
    }
  }

  // ── TTS: Read Slide Aloud ───────────────────────────────────────────────

  async function readSlideAloud(text: string, voiceId?: string): Promise<string | null> {
    if (isSpeaking.value) {
      stopSpeaking()
    }

    const voice = voiceId || settings.value.ttsVoice

    try {
      // Call backend TTS API
      const response = await api.voice.generateTTS({
        text,
        voice,
        rate: settings.value.ttsRate,
        volume: settings.value.ttsVolume,
        pitch: settings.value.ttsPitch,
      })

      if (response.data.success) {
        const audioUrl = response.data.data.audio_url
        await playAudio(audioUrl)
        return audioUrl
      }
    } catch (e) {
      console.warn('[VoiceCommands] Backend TTS failed, using Web Speech API:', e)
      // Fallback to Web Speech API
      await speakWithWebSpeech(text, voice)
    }

    return null
  }

  function speakWithWebSpeech(text: string, voiceId?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!window.speechSynthesis) {
        reject(new Error('Web Speech API not available'))
        return
      }

      stopSpeaking()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = settings.value.language
      utterance.rate = parseFloat(settings.value.ttsRate.replace('%', '')) / 100 + 1 || 1
      utterance.pitch = parseFloat(settings.value.ttsPitch.replace('Hz', '')) / 10 + 1 || 1

      // Try to find the voice
      const voices = window.speechSynthesis.getVoices()
      const voice = voices.find(v => v.lang.startsWith(settings.value.language.split('-')[0]))
      if (voice) utterance.voice = voice

      utterance.onend = () => {
        isSpeaking.value = false
        resolve()
      }
      utterance.onerror = (e) => {
        isSpeaking.value = false
        reject(e)
      }

      currentUtterance = utterance
      isSpeaking.value = true
      window.speechSynthesis.speak(utterance)
    })
  }

  function playAudio(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(url)
      audio.onended = () => {
        isSpeaking.value = false
        resolve()
      }
      audio.onerror = (e) => {
        isSpeaking.value = false
        reject(e)
      }
      isSpeaking.value = true
      audio.play().catch(reject)
    })
  }

  function stopSpeaking() {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    isSpeaking.value = false
    currentUtterance = null
  }

  // ── Real-time STT for Live Captions ─────────────────────────────────────

  let sttRecognition: any = null
  let captionHistory: CaptionLine[] = []
  let captionStartTime = 0

  function initSTT() {
    if (typeof window === 'undefined') return
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    sttRecognition = new SpeechRecognition()
    sttRecognition.continuous = true
    sttRecognition.interimResults = true
    sttRecognition.lang = settings.value.captionsLanguage

    sttRecognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        const isFinal = event.results[i].isFinal

        const line: CaptionLine = {
          text: transcript,
          startTime: captionStartTime,
          isFinal,
        }

        if (isFinal) {
          captions.value.push(line)
          captionStartTime = Date.now()
          // Keep only last 50 captions
          if (captions.value.length > 50) {
            captions.value = captions.value.slice(-50)
          }
        }
      }
    }

    sttRecognition.onerror = (e: any) => {
      if (e.error !== 'no-speech') {
        console.warn('[VoiceCommands] STT error:', e.error)
      }
    }
  }

  function startCaptions() {
    if (!settings.value.captionsEnabled) return
    if (!sttRecognition) initSTT()
    if (!sttRecognition) return
    captions.value = []
    captionStartTime = Date.now()
    try {
      sttRecognition.lang = settings.value.captionsLanguage
      sttRecognition.start()
      captionsVisible.value = true
    } catch {}
  }

  function stopCaptions() {
    if (!sttRecognition) return
    try {
      sttRecognition.stop()
    } catch {}
    captionsVisible.value = false
  }

  function toggleCaptions() {
    if (captionsVisible.value) {
      stopCaptions()
    } else {
      startCaptions()
    }
  }

  // ── Voice Training ───────────────────────────────────────────────────────

  function addCustomCommand(command: Omit<VoiceCommand, 'id'>): VoiceCommand {
    const newCmd: VoiceCommand = {
      ...command,
      id: `custom-${Date.now()}`,
    }
    customCommands.value.push(newCmd)
    saveCustomCommands()
    return newCmd
  }

  function removeCustomCommand(id: string) {
    customCommands.value = customCommands.value.filter(c => c.id !== id)
    saveCustomCommands()
  }

  function updateCustomCommand(id: string, updates: Partial<VoiceCommand>) {
    const idx = customCommands.value.findIndex(c => c.id === id)
    if (idx >= 0) {
      customCommands.value[idx] = { ...customCommands.value[idx], ...updates }
      saveCustomCommands()
    }
  }

  // ── Settings Update ──────────────────────────────────────────────────────

  function updateSettings(updates: Partial<VoiceSettings>) {
    settings.value = { ...settings.value, ...updates }
    saveSettings()

    // Re-init recognition with new language if needed
    if (updates.language && recognition) {
      recognition.lang = updates.language
    }
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────

  onUnmounted(() => {
    stopListening()
    stopSpeaking()
    stopCaptions()
  })

  // ── Public API ───────────────────────────────────────────────────────────

  return {
    // State
    settings,
    customCommands,
    allCommands,
    isListening,
    isSpeaking,
    currentTranscript,
    captions,
    captionsVisible,
    lastRecognizedCommand,
    commandError,

    // Settings
    updateSettings,

    // Recognition
    startListening,
    stopListening,
    toggleListening,

    // Navigation/Control handlers
    setNavigationHandler,
    setControlHandler,
    setAnnotationHandler,

    // TTS
    readSlideAloud,
    stopSpeaking,

    // STT Captions
    startCaptions,
    stopCaptions,
    toggleCaptions,

    // Voice Training
    addCustomCommand,
    removeCustomCommand,
    updateCustomCommand,
  }
}

// ─── Available TTS Voices ────────────────────────────────────────────────────

export const TTS_VOICES = [
  // Chinese
  { id: 'zh-CN-Xiaoxiao', lang: 'zh-CN', name: '晓晓 (女声)', gender: 'Female' },
  { id: 'zh-CN-Yunxi', lang: 'zh-CN', name: '云希 (男声)', gender: 'Male' },
  { id: 'zh-CN-Yunyang', lang: 'zh-CN', name: '云扬 (男声)', gender: 'Male' },
  { id: 'zh-CN-Xiaoyi', lang: 'zh-CN', name: '小艺 (女声)', gender: 'Female' },
  { id: 'zh-CN-XiaoMin', lang: 'zh-CN', name: '小敏 (粤语)', gender: 'Female' },
  // English
  { id: 'en-US-Jenny', lang: 'en-US', name: 'Jenny (美式女声)', gender: 'Female' },
  { id: 'en-US-Guy', lang: 'en-US', name: 'Guy (美式男声)', gender: 'Male' },
  { id: 'en-GB-Sonia', lang: 'en-GB', name: 'Sonia (英式女声)', gender: 'Female' },
  // Other languages
  { id: 'ja-JP-Nanami', lang: 'ja-JP', name: '七海 (日语女声)', gender: 'Female' },
  { id: 'ko-KR-Sunhi', lang: 'ko-KR', name: 'Sunhi (韩语女声)', gender: 'Female' },
  { id: 'fr-FR-Denise', lang: 'fr-FR', name: 'Denise (法语女声)', gender: 'Female' },
  { id: 'de-DE-Katja', lang: 'de-DE', name: 'Katja (德语女声)', gender: 'Female' },
  { id: 'es-ES-Elvira', lang: 'es-ES', name: 'Elvira (西班牙语女声)', gender: 'Female' },
]

export const RECOGNITION_LANGUAGES = [
  { code: 'zh-CN', name: '中文 (简体)' },
  { code: 'zh-TW', name: '中文 (繁体)' },
  { code: 'en-US', name: 'English (US)' },
  { code: 'en-GB', name: 'English (UK)' },
  { code: 'ja-JP', name: '日本語' },
  { code: 'ko-KR', name: '한국어' },
  { code: 'fr-FR', name: 'Français' },
  { code: 'de-DE', name: 'Deutsch' },
  { code: 'es-ES', name: 'Español' },
]
