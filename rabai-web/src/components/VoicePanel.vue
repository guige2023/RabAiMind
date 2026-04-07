<template>
  <div class="voice-panel-overlay" @click.self="$emit('close')">
    <div class="voice-panel" @click.stop>
      <div class="panel-header">
        <h3>🎙️ 语音设置</h3>
        <button class="panel-close" @click="$emit('close')">✕</button>
      </div>

      <div class="panel-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="['tab-btn', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          {{ tab.icon }} {{ tab.name }}
        </button>
      </div>

      <!-- Tab: Commands -->
      <div v-if="activeTab === 'commands'" class="tab-content">
        <div class="section-title">🎤 语音命令</div>
        <div class="toggle-row">
          <span>启用语音命令</span>
          <label class="switch">
            <input type="checkbox" v-model="localSettings.enabled" @change="emitSettings" />
            <span class="slider"></span>
          </label>
        </div>

        <div class="form-item">
          <label class="form-label">识别语言</label>
          <select v-model="localSettings.language" class="form-select" @change="emitSettings">
            <option v-for="lang in RECOGNITION_LANGUAGES" :key="lang.code" :value="lang.code">
              {{ lang.name }}
            </option>
          </select>
        </div>

        <div class="section-title" style="margin-top: 16px;">默认命令</div>
        <div class="command-list">
          <div v-for="cmd in defaultCommands" :key="cmd.id" class="command-item">
            <span class="cmd-icon">{{ cmd.icon }}</span>
            <span class="cmd-phrase">"{{ cmd.phrase }}"</span>
            <span class="cmd-desc">{{ cmd.description }}</span>
          </div>
        </div>

        <div class="section-title" style="margin-top: 16px;">
          <span>🆕 自定义命令 ({{ customCommands.length }})</span>
        </div>
        <div v-if="customCommands.length === 0" class="empty-tip">
          暂无自定义命令，切换到"训练"标签添加
        </div>
        <div v-else class="command-list">
          <div v-for="cmd in customCommands" :key="cmd.id" class="command-item custom">
            <span class="cmd-icon">{{ cmd.icon || '🎯' }}</span>
            <span class="cmd-phrase">"{{ cmd.phrase }}"</span>
            <span class="cmd-desc">{{ cmd.description }}</span>
            <button class="btn btn-mini btn-danger" @click="removeCommand(cmd.id)">删除</button>
          </div>
        </div>

        <!-- Quick Test -->
        <div class="section-title" style="margin-top: 16px;">🧪 测试</div>
        <div class="test-section">
          <button
            class="btn"
            :class="isListening ? 'btn-danger' : 'btn-primary'"
            @click="toggleListening"
          >
            {{ isListening ? '⏹️ 停止监听' : '🎤 开始监听' }}
          </button>
          <div v-if="currentTranscript" class="transcript-display">
            识别到: <strong>{{ currentTranscript }}</strong>
          </div>
          <div v-if="lastRecognizedCommand" class="recognized-display">
            ✅ 执行: <strong>{{ lastRecognizedCommand }}</strong>
          </div>
          <div v-if="commandError" class="error-display">
            ❌ 错误: {{ commandError }}
          </div>
        </div>
      </div>

      <!-- Tab: Read Aloud -->
      <div v-if="activeTab === 'read'" class="tab-content">
        <div class="section-title">🔊 朗读当前页</div>

        <div class="form-item">
          <label class="form-label">选择语音</label>
          <select v-model="localSettings.ttsVoice" class="form-select" @change="emitSettings">
            <optgroup v-for="group in voiceGroups" :key="group.lang" :label="group.label">
              <option v-for="v in group.voices" :key="v.id" :value="v.id">
                {{ v.name }}
              </option>
            </optgroup>
          </select>
        </div>

        <div class="form-item">
          <label class="form-label">语速 ({{ localSettings.ttsRate }})</label>
          <input type="range" v-model="localSettings.ttsRate"
            min="-50%" max="+50%" step="10%"
            class="range-input" @change="emitSettings" />
          <div class="range-labels">
            <span>慢</span><span>正常</span><span>快</span>
          </div>
        </div>

        <div class="form-item">
          <label class="form-label">音量 ({{ localSettings.ttsVolume }})</label>
          <input type="range" v-model="localSettings.ttsVolume"
            min="-50%" max="+50%" step="10%"
            class="range-input" @change="emitSettings" />
          <div class="range-labels">
            <span>低</span><span>正常</span><span>高</span>
          </div>
        </div>

        <div class="form-item">
          <label class="form-label">音调 ({{ localSettings.ttsPitch }})</label>
          <input type="range" v-model="localSettings.ttsPitch"
            min="-50Hz" max="+50Hz" step="10Hz"
            class="range-input" @change="emitSettings" />
          <div class="range-labels">
            <span>低</span><span>正常</span><span>高</span>
          </div>
        </div>

        <div class="section-title" style="margin-top: 16px;">当前页内容预览</div>
        <div class="preview-box">
          <div class="preview-title">{{ slideTitle || '(无标题)' }}</div>
          <div class="preview-content">{{ slideContentPreview }}</div>
        </div>

        <div class="action-row" style="margin-top: 16px;">
          <button
            class="btn btn-primary"
            :disabled="isSpeaking"
            @click="$emit('read-current-slide')"
          >
            {{ isSpeaking ? '🔊 朗读中...' : '🔊 朗读当前页' }}
          </button>
          <button v-if="isSpeaking" class="btn btn-outline" @click="$emit('stop-speaking')">
            ⏹️ 停止
          </button>
        </div>

        <!-- Batch narration -->
        <div class="section-title" style="margin-top: 24px;">📋 批量生成配音</div>
        <p class="section-desc">为所有幻灯片生成语音解说（需调用后端TTS）</p>
        <button
          class="btn btn-outline"
          :disabled="isBatchGenerating"
          @click="$emit('batch-generate')"
        >
          {{ isBatchGenerating ? '生成中...' : '🎙️ 批量生成配音' }}
        </button>
      </div>

      <!-- Tab: Captions (STT) -->
      <div v-if="activeTab === 'captions'" class="tab-content">
        <div class="section-title">📝 实时字幕</div>
        <div class="toggle-row">
          <span>启用实时字幕</span>
          <label class="switch">
            <input type="checkbox" v-model="localSettings.captionsEnabled" @change="emitSettings" />
            <span class="slider"></span>
          </label>
        </div>

        <div class="form-item">
          <label class="form-label">字幕语言</label>
          <select v-model="localSettings.captionsLanguage" class="form-select" @change="emitSettings">
            <option v-for="lang in RECOGNITION_LANGUAGES" :key="lang.code" :value="lang.code">
              {{ lang.name }}
            </option>
          </select>
        </div>

        <div class="toggle-row">
          <span>命令反馈音效</span>
          <label class="switch">
            <input type="checkbox" v-model="localSettings.commandFeedback" @change="emitSettings" />
            <span class="slider"></span>
          </label>
        </div>

        <div class="captions-preview">
          <div class="captions-title">字幕预览</div>
          <div class="captions-display" :class="{ visible: captionsVisible }">
            <div v-if="!captionsVisible" class="captions-hint">
              点击下方按钮开启实时字幕
            </div>
            <div v-else>
              <div v-for="(cap, i) in captions.slice(-5)" :key="i" class="caption-line" :class="{ final: cap.isFinal }">
                {{ cap.text }}
              </div>
              <div v-if="currentTranscript && captionsVisible" class="caption-line interim">
                {{ currentTranscript }}
              </div>
            </div>
          </div>
        </div>

        <div class="action-row" style="margin-top: 16px;">
          <button
            class="btn"
            :class="captionsVisible ? 'btn-danger' : 'btn-primary'"
            @click="$emit('toggle-captions')"
          >
            {{ captionsVisible ? '⏹️ 关闭字幕' : '📝 开启实时字幕' }}
          </button>
        </div>
      </div>

      <!-- Tab: Training -->
      <div v-if="activeTab === 'training'" class="tab-content">
        <div class="section-title">🎯 语音命令训练</div>
        <p class="section-desc">
          添加你自己的语音命令。例如：说"翻页"来执行下一页操作。
        </p>

        <!-- Step 1: Record phrase -->
        <div class="training-step">
          <div class="step-num">1</div>
          <div class="step-content">
            <div class="step-title">录制命令短语</div>
            <div class="step-desc">对着麦克风说出你想要的命令，例如"下一页"、"放大"、"退出"等</div>
            <div class="record-section">
              <button
                class="btn record-btn"
                :class="{ recording: isRecording }"
                @click="toggleRecording"
              >
                <span class="record-icon">🎤</span>
                {{ isRecording ? '录音中...' : '开始录音' }}
              </button>
              <div v-if="recordedPhrase" class="recorded-phrase">
                录制成功: "{{ recordedPhrase }}"
              </div>
              <div v-if="recordingError" class="error-text">{{ recordingError }}</div>
            </div>
          </div>
        </div>

        <!-- Step 2: Assign action -->
        <div class="training-step" :class="{ disabled: !recordedPhrase }">
          <div class="step-num">2</div>
          <div class="step-content">
            <div class="step-title">设置动作</div>
            <div class="step-desc">选择这个命令执行什么操作</div>
            <div class="action-grid">
              <button
                v-for="act in availableActions"
                :key="act.value"
                class="action-btn"
                :class="{ selected: newCommandAction === act.value }"
                @click="newCommandAction = act.value"
              >
                {{ act.icon }} {{ act.label }}
              </button>
            </div>

            <!-- Value input for navigation -->
            <div v-if="newCommandAction === 'navigation'" class="value-input-section">
              <select v-model="newCommandValue" class="form-select">
                <option value="next">下一页 (next)</option>
                <option value="prev">上一页 (prev)</option>
                <option value="first">第一页 (first)</option>
                <option value="last">最后一页 (last)</option>
              </select>
            </div>

            <div v-if="newCommandAction === 'custom'" class="value-input-section">
              <input
                v-model="newCommandValue"
                class="form-input"
                placeholder="输入自定义动作值"
              />
            </div>
          </div>
        </div>

        <!-- Step 3: Save -->
        <div class="training-step" :class="{ disabled: !recordedPhrase || !newCommandAction }">
          <div class="step-num">3</div>
          <div class="step-content">
            <div class="step-title">保存命令</div>
            <div class="step-desc">给命令起个描述名称，方便管理</div>
            <div class="save-row">
              <input
                v-model="newCommandName"
                class="form-input"
                placeholder="命令描述，如：翻到下一页"
              />
              <input
                v-model="newCommandIcon"
                class="form-input icon-input"
                placeholder="图标"
                maxlength="2"
              />
            </div>
            <button
              class="btn btn-primary"
              :disabled="!recordedPhrase || !newCommandAction || !newCommandName"
              @click="saveNewCommand"
            >
              💾 保存命令
            </button>
          </div>
        </div>

        <!-- Existing custom commands -->
        <div class="section-title" style="margin-top: 24px;">
          已训练的命令 ({{ customCommands.length }})
        </div>
        <div v-if="customCommands.length === 0" class="empty-tip">
          还没有自定义命令，按照上面的步骤添加
        </div>
        <div v-else class="trained-list">
          <div v-for="cmd in customCommands" :key="cmd.id" class="trained-item">
            <span class="trained-icon">{{ cmd.icon || '🎯' }}</span>
            <div class="trained-info">
              <div class="trained-phrase">"{{ cmd.phrase }}"</div>
              <div class="trained-desc">{{ cmd.description || cmd.action }}: {{ cmd.value }}</div>
            </div>
            <button class="btn btn-mini btn-danger" @click="removeCommand(cmd.id)">删除</button>
          </div>
        </div>
      </div>

      <!-- Tab: Translate -->
      <div v-if="activeTab === 'translate'" class="tab-content">
        <div class="section-title">🌐 实时翻译</div>
        <p class="section-desc">输入或粘贴需要翻译的文本，选择语言后即可翻译</p>

        <div class="form-item">
          <label class="form-label">源语言</label>
          <select v-model="translateSource" class="form-select">
            <option v-for="lang in translateLangs" :key="lang.code" :value="lang.code">
              {{ lang.name }}
            </option>
          </select>
        </div>

        <div class="form-item">
          <label class="form-label">目标语言</label>
          <select v-model="translateTarget" class="form-select">
            <option v-for="lang in translateLangs" :key="lang.code" :value="lang.code">
              {{ lang.name }}
            </option>
          </select>
        </div>

        <div class="form-item">
          <label class="form-label">原文</label>
          <textarea
            v-model="translateInput"
            class="form-textarea"
            placeholder="在此输入或粘贴需要翻译的文本..."
            rows="4"
          ></textarea>
        </div>

        <div class="action-row" style="margin-bottom: 12px;">
          <button
            class="btn btn-primary"
            :disabled="!translateInput.trim() || translateLoading"
            @click="doTranslate"
          >
            {{ translateLoading ? '翻译中...' : '🌐 翻译' }}
          </button>
          <button
            v-if="translatedResult"
            class="btn btn-outline"
            @click="speakTranslation"
            :disabled="isSpeaking"
          >
            {{ isSpeaking ? '🔊 朗读中...' : '🔊 朗读翻译' }}
          </button>
        </div>

        <div v-if="translateError" class="error-display">
          ❌ {{ translateError }}
        </div>

        <div v-if="translatedResult" class="translate-result">
          <div class="translate-result-header">
            <span class="translate-result-label">翻译结果</span>
            <button class="btn btn-mini" @click="copyTranslation">📋 复制</button>
          </div>
          <div class="translate-result-text">{{ translatedResult }}</div>
          <div class="translate-result-meta">
            {{ translateLangs.find(l => l.code === translateSource)?.name }} → {{ translateLangs.find(l => l.code === translateTarget)?.name }}
          </div>
        </div>

        <!-- Voice input for translation -->
        <div class="section-title" style="margin-top: 20px;">🎤 语音输入翻译</div>
        <div class="form-item">
          <label class="form-label">对着麦克风说话，自动翻译为 {{ translateLangs.find(l => l.code === translateTarget)?.name }}</label>
          <div class="voice-input-row">
            <button
              class="btn"
              :class="isVoiceTranslating ? 'btn-danger' : 'btn-primary'"
              @click="toggleVoiceTranslate"
            >
              {{ isVoiceTranslating ? '⏹️ 停止' : '🎤 开始语音翻译' }}
            </button>
            <span v-if="voiceTranscription" class="voice-transcription">
              "{{ voiceTranscription }}"
            </span>
          </div>
          <div v-if="isVoiceTranslating" class="voice-translating-indicator">
            <span class="pulse-dot"></span> 正在聆听...
          </div>
          <div v-if="voiceTranslateResult" class="translate-result">
            <div class="translate-result-header">
              <span class="translate-result-label">语音翻译结果</span>
            </div>
            <div class="translate-result-text">{{ voiceTranslateResult }}</div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="panel-footer">
        <button class="btn btn-outline" @click="$emit('close')">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { api } from '../api/client'
import { TTS_VOICES, RECOGNITION_LANGUAGES } from '../composables/useVoiceCommands'
import type { VoiceCommand, VoiceSettings } from '../composables/useVoiceCommands'

const props = defineProps<{
  settings: VoiceSettings
  customCommands: VoiceCommand[]
  isListening: boolean
  isSpeaking: boolean
  captions: { text: string; startTime: number; isFinal: boolean }[]
  captionsVisible: boolean
  currentTranscript: string
  lastRecognizedCommand: string | null
  commandError: string | null
  slideTitle?: string
  slideContent?: string
  isBatchGenerating?: boolean
}>()

const emit = defineEmits<{
  close: []
  'update-settings': [settings: Partial<VoiceSettings>]
  'toggle-listening': []
  'read-current-slide': []
  'stop-speaking': []
  'toggle-captions': []
  'batch-generate': []
  'add-command': [command: Omit<VoiceCommand, 'id'>]
  'remove-command': [id: string]
  'translate': [text: string, sourceLang: string, targetLang: string]
  'speak-translation': [text: string]
}>()

const tabs = [
  { id: 'commands', name: '命令', icon: '🎤' },
  { id: 'read', name: '朗读', icon: '🔊' },
  { id: 'captions', name: '字幕', icon: '📝' },
  { id: 'translate', name: '翻译', icon: '🌐' },
  { id: 'training', name: '训练', icon: '🎯' },
]

const activeTab = ref('commands')

// Local settings copy for two-way binding
const localSettings = ref<Partial<VoiceSettings>>({ ...props.settings })

watch(() => props.settings, (val) => {
  localSettings.value = { ...val }
}, { deep: true })

function emitSettings() {
  emit('update-settings', localSettings.value)
}

const defaultCommands = [
  { id: 'nav-next', phrase: 'next slide', action: 'navigation', value: 'next', description: '下一页', icon: '➡️' },
  { id: 'nav-prev', phrase: 'previous slide', action: 'navigation', value: 'prev', description: '上一页', icon: '⬅️' },
  { id: 'nav-first', phrase: 'first slide', action: 'navigation', value: 'first', description: '第一页', icon: '⏮️' },
  { id: 'nav-last', phrase: 'last slide', action: 'navigation', value: 'last', description: '最后一页', icon: '⏭️' },
  { id: 'nav-go', phrase: 'go to slide N', action: 'navigation', value: 'go', description: '跳转到第N页', icon: '🔢' },
  { id: 'ctrl-read', phrase: 'read slide', action: 'control', value: 'read', description: '朗读当前页', icon: '🔊' },
  { id: 'ctrl-captions', phrase: 'show captions', action: 'control', value: 'captions', description: '开启字幕', icon: '📝' },
]

const voiceGroups = computed(() => {
  const groups: Record<string, { lang: string; label: string; voices: typeof TTS_VOICES }> = {}
  for (const v of TTS_VOICES) {
    if (!groups[v.lang]) {
      const langNames: Record<string, string> = {
        'zh-CN': '中文',
        'zh-TW': '中文(繁体)',
        'en-US': 'English (US)',
        'en-GB': 'English (UK)',
        'ja-JP': '日本語',
        'ko-KR': '한국어',
        'fr-FR': 'Français',
        'de-DE': 'Deutsch',
        'es-ES': 'Español',
      }
      groups[v.lang] = { lang: v.lang, label: langNames[v.lang] || v.lang, voices: [] }
    }
    groups[v.lang].voices.push(v)
  }
  return Object.values(groups)
})

// Local speaking state (separate from prop, used for local async operations)
const localSpeaking = ref(false)

const slideContentPreview = computed(() => {
  const text = props.slideContent || ''
  return text.length > 200 ? text.slice(0, 200) + '...' : text
})

function toggleListening() {
  emit('toggle-listening')
}

function removeCommand(id: string) {
  emit('remove-command', id)
}

// ── Voice Training ──────────────────────────────────────────────────────────

const isRecording = ref(false)
const recordedPhrase = ref('')
const recordingError = ref('')
let mediaRecorder: MediaRecorder | null = null
let recognitionForTraining: any = null

onMounted(() => {
  // Check support
  if (typeof window === 'undefined') return
})

function toggleRecording() {
  if (isRecording.value) {
    stopRecording()
  } else {
    startRecording()
  }
}

function startRecording() {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    recordingError.value = '浏览器不支持语音识别'
    return
  }

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  recognitionForTraining = new SpeechRecognition()
  recognitionForTraining.continuous = false
  recognitionForTraining.interimResults = false
  recognitionForTraining.lang = localSettings.value.language || 'zh-CN'

  recognitionForTraining.onstart = () => {
    isRecording.value = true
    recordingError.value = ''
    recordedPhrase.value = ''
  }

  recognitionForTraining.onend = () => {
    isRecording.value = false
  }

  recognitionForTraining.onerror = (e: any) => {
    isRecording.value = false
    if (e.error !== 'no-speech') {
      recordingError.value = `错误: ${e.error}`
    }
  }

  recognitionForTraining.onresult = (event: any) => {
    const transcript = event.results[0][0].transcript
    recordedPhrase.value = transcript
  }

  try {
    recognitionForTraining.start()
  } catch (e) {
    recordingError.value = '无法访问麦克风'
    isRecording.value = false
  }
}

function stopRecording() {
  if (recognitionForTraining) {
    try {
      recognitionForTraining.stop()
    } catch {}
  }
  isRecording.value = false
}

// New command form
const newCommandAction = ref('')
const newCommandValue = ref('')
const newCommandName = ref('')
const newCommandIcon = ref('')

const availableActions = [
  { value: 'navigation', label: '导航', icon: '🧭' },
  { value: 'control', label: '控制', icon: '🎛️' },
  { value: 'custom', label: '自定义', icon: '✨' },
]

function saveNewCommand() {
  if (!recordedPhrase.value || !newCommandAction.value || !newCommandName.value) return

  emit('add-command', {
    phrase: recordedPhrase.value,
    action: newCommandAction.value as any,
    value: newCommandValue.value || newCommandAction.value,
    description: newCommandName.value,
    icon: newCommandIcon.value || '🎯',
  })

  // Reset form
  recordedPhrase.value = ''
  newCommandAction.value = ''
  newCommandValue.value = ''
  newCommandName.value = ''
  newCommandIcon.value = ''
  activeTab.value = 'commands'
}

// ── Translate ────────────────────────────────────────────────────────────────

const translateLangs = [
  { code: 'zh', name: '中文' },
  { code: 'en', name: 'English' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'es', name: 'Español' },
  { code: 'pt', name: 'Português' },
  { code: 'it', name: 'Italiano' },
  { code: 'ru', name: 'Русский' },
  { code: 'ar', name: 'العربية' },
]

const translateSource = ref('zh')
const translateTarget = ref('en')
const translateInput = ref('')
const translatedResult = ref('')
const translateLoading = ref(false)
const translateError = ref('')

// Voice transcription state for translate tab
const isVoiceTranslating = ref(false)
const voiceTranscription = ref('')
const voiceTranslateResult = ref('')
let voiceTranscribeRecognition: any = null

async function doTranslate() {
  if (!translateInput.value.trim()) return
  translateLoading.value = true
  translateError.value = ''
  translatedResult.value = ''
  try {
    const res = await api.ai.translateText({
      text: translateInput.value,
      source_lang: translateSource.value,
      target_lang: translateTarget.value,
    } as any)
    if (res.data.success) {
      translatedResult.value = res.data.data.translated
    } else {
      translateError.value = res.data.error || '翻译失败'
    }
  } catch (e: any) {
    translateError.value = e?.response?.data?.detail || e.message || '翻译请求失败'
  } finally {
    translateLoading.value = false
  }
}

function onTranslateResult(result: string, error?: string) {
  translateLoading.value = false
  if (error) {
    translateError.value = error
  } else {
    translatedResult.value = result
  }
}

async function speakTranslation() {
  if (!translatedResult.value) return
  try {
    localSpeaking.value = true
    const res = await api.voice.generateTTS({
      text: translatedResult.value,
      voice: localSettings.value.ttsVoice || 'zh-CN-Xiaoxiao',
      rate: localSettings.value.ttsRate || '+0%',
      volume: localSettings.value.ttsVolume || '+0%',
      pitch: localSettings.value.ttsPitch || '+0Hz',
    } as any)
    if (res.data.success) {
      const audio = new Audio(res.data.data.audio_url)
      audio.onended = () => { localSpeaking.value = false }
      audio.onerror = () => { localSpeaking.value = false }
      audio.play().catch(() => { localSpeaking.value = false })
    }
  } catch {
    isSpeaking.value = false
  }
}

function copyTranslation() {
  if (!translatedResult.value) return
  navigator.clipboard.writeText(translatedResult.value).catch(() => {})
}

// Voice transcription for translate input
function initVoiceTranscribe() {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    return null
  }
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  const rec = new SpeechRecognition()
  rec.continuous = true
  rec.interimResults = true
  rec.lang = translateSource.value === 'zh' ? 'zh-CN' : translateSource.value === 'en' ? 'en-US' : translateSource.value === 'ja' ? 'ja-JP' : translateSource.value === 'ko' ? 'ko-KR' : 'zh-CN'

  rec.onresult = (event: any) => {
    let interim = ''
    let final = ''
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const t = event.results[i][0].transcript
      if (event.results[i].isFinal) final += t
      else interim += t
    }
    voiceTranscription.value = final || interim
    if (final) {
      translateInput.value = (translateInput.value + ' ' + final).trim()
      // Auto-translate on final result
      if (translateInput.value.trim()) {
        doTranslate()
      }
    }
  }

  rec.onend = () => {
    isVoiceTranslating.value = false
  }

  rec.onerror = (e: any) => {
    if (e.error !== 'no-speech') {
      isVoiceTranslating.value = false
    }
  }

  return rec
}

function toggleVoiceTranslate() {
  if (isVoiceTranslating.value) {
    stopVoiceTranslate()
  } else {
    startVoiceTranslate()
  }
}

function startVoiceTranslate() {
  if (!voiceTranscribeRecognition) {
    voiceTranscribeRecognition = initVoiceTranscribe()
  }
  if (!voiceTranscribeRecognition) return
  try {
    voiceTranscription.value = ''
    voiceTranslateResult.value = ''
    isVoiceTranslating.value = true
    voiceTranscribeRecognition.start()
  } catch {}
}

function stopVoiceTranslate() {
  if (voiceTranscribeRecognition) {
    try {
      voiceTranscribeRecognition.stop()
    } catch {}
  }
  isVoiceTranslating.value = false
}
</script>

<style scoped>
.voice-panel-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.voice-panel {
  background: white;
  border-radius: 16px;
  width: 520px;
  max-width: 95vw;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.panel-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.panel-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #999;
  padding: 4px;
  border-radius: 4px;
}

.panel-close:hover {
  background: #f5f5f5;
  color: #333;
}

.panel-tabs {
  display: flex;
  padding: 0 24px;
  border-bottom: 1px solid #f0f0f0;
  gap: 4px;
}

.tab-btn {
  padding: 10px 16px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  border-bottom: 2px solid transparent;
  transition: all 0.15s;
}

.tab-btn.active {
  color: #165DFF;
  border-bottom-color: #165DFF;
}

.tab-btn:hover:not(.active) {
  color: #333;
}

.tab-content {
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.section-desc {
  font-size: 13px;
  color: #666;
  margin-bottom: 12px;
}

.empty-tip {
  font-size: 13px;
  color: #999;
  padding: 12px;
  text-align: center;
  background: #f9fafb;
  border-radius: 8px;
}

.toggle-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
  font-size: 14px;
}

.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background: #ccc;
  border-radius: 24px;
  transition: 0.2s;
}

.slider::before {
  content: '';
  position: absolute;
  width: 18px;
  height: 18px;
  left: 3px;
  bottom: 3px;
  background: white;
  border-radius: 50%;
  transition: 0.2s;
}

input:checked + .slider {
  background: #165DFF;
}

input:checked + .slider::before {
  transform: translateX(20px);
}

.form-item {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 13px;
  color: #666;
  margin-bottom: 6px;
}

.form-select,
.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.15s;
}

.form-select:focus,
.form-input:focus {
  border-color: #165DFF;
}

.range-input {
  width: 100%;
  margin: 8px 0;
}

.range-labels {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #999;
}

.command-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.command-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f9fafb;
  border-radius: 8px;
  font-size: 13px;
}

.command-item.custom {
  background: #f0f7ff;
}

.cmd-icon {
  font-size: 16px;
}

.cmd-phrase {
  color: #333;
  font-weight: 500;
  font-style: italic;
}

.cmd-desc {
  color: #999;
  margin-left: auto;
  font-size: 12px;
}

.test-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
}

.transcript-display {
  font-size: 13px;
  color: #333;
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 8px;
  width: 100%;
}

.recognized-display {
  font-size: 13px;
  color: #16a34a;
  padding: 8px 12px;
  background: #f0fdf4;
  border-radius: 8px;
  width: 100%;
}

.error-display {
  font-size: 13px;
  color: #dc2626;
  padding: 8px 12px;
  background: #fef2f2;
  border-radius: 8px;
  width: 100%;
}

.preview-box {
  background: #f9fafb;
  border-radius: 10px;
  padding: 12px 16px;
  margin-top: 8px;
}

.preview-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
}

.preview-content {
  font-size: 13px;
  color: #666;
  line-height: 1.6;
  max-height: 80px;
  overflow: hidden;
}

.action-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.captions-preview {
  margin-top: 12px;
}

.captions-title {
  font-size: 12px;
  color: #999;
  margin-bottom: 6px;
}

.captions-display {
  background: #1a1a1a;
  border-radius: 10px;
  padding: 12px 16px;
  min-height: 80px;
  max-height: 160px;
  overflow-y: auto;
  font-family: monospace;
  font-size: 14px;
  color: #ccc;
}

.captions-hint {
  color: #666;
  text-align: center;
  padding: 16px;
}

.caption-line {
  padding: 4px 0;
  opacity: 0.7;
}

.caption-line.final {
  opacity: 1;
  color: #fff;
}

.caption-line.interim {
  color: #93c5fd;
  font-style: italic;
}

/* Voice Training */
.training-step {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 12px;
  margin-bottom: 12px;
}

.training-step.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.step-num {
  width: 28px;
  height: 28px;
  background: #165DFF;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}

.step-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.step-desc {
  font-size: 12px;
  color: #666;
  margin-bottom: 12px;
}

.record-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.record-btn {
  display: flex;
  align-items: center;
  gap: 8px;
}

.record-btn.recording {
  background: #dc2626;
  color: white;
  border-color: #dc2626;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.recorded-phrase {
  font-size: 14px;
  color: #16a34a;
  font-weight: 500;
}

.error-text {
  font-size: 12px;
  color: #dc2626;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.action-btn {
  padding: 10px;
  border: 1px solid #e5e5e5;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  text-align: center;
  transition: all 0.15s;
}

.action-btn.selected {
  background: #165DFF;
  color: white;
  border-color: #165DFF;
}

.value-input-section {
  margin-top: 8px;
}

.save-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.icon-input {
  width: 60px;
  flex-shrink: 0;
  text-align: center;
}

.trained-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.trained-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: #f0f7ff;
  border-radius: 10px;
}

.trained-icon {
  font-size: 20px;
}

.trained-info {
  flex: 1;
}

.trained-phrase {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.trained-desc {
  font-size: 12px;
  color: #666;
}

.panel-footer {
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* Buttons */
.btn {
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid #e5e5e5;
  background: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.15s;
}

.btn:hover {
  background: #f5f5f5;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #165DFF;
  color: white;
  border-color: #165DFF;
}

.btn-primary:hover:not(:disabled) {
  background: #0e42d2;
}

.btn-primary:disabled {
  background: #93c5fd;
  border-color: #93c5fd;
}

.btn-outline {
  background: white;
  color: #165DFF;
  border-color: #165DFF;
}

.btn-outline:hover:not(:disabled) {
  background: #f0f7ff;
}

.btn-danger {
  background: #dc2626;
  color: white;
  border-color: #dc2626;
}

.btn-mini {
  padding: 4px 10px;
  font-size: 12px;
}

.btn-danger.btn-mini {
  background: #fef2f2;
  color: #dc2626;
  border-color: #fecaca;
}

.btn-danger.btn-mini:hover {
  background: #fee2e2;
}

/* Translate tab */
.form-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  outline: none;
  transition: border-color 0.15s;
  line-height: 1.6;
  box-sizing: border-box;
}

.form-textarea:focus {
  border-color: #165DFF;
}

.translate-result {
  background: #f0f7ff;
  border: 1px solid #d0e2ff;
  border-radius: 10px;
  padding: 12px 14px;
  margin-top: 12px;
}

.translate-result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.translate-result-label {
  font-size: 12px;
  color: #165DFF;
  font-weight: 600;
}

.translate-result-text {
  font-size: 15px;
  color: #1a1a1a;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}

.translate-result-meta {
  font-size: 11px;
  color: #999;
  margin-top: 6px;
}

.voice-input-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.voice-transcription {
  font-size: 13px;
  color: #333;
  font-style: italic;
  background: #f5f5f5;
  padding: 4px 10px;
  border-radius: 6px;
}

.voice-translating-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #165DFF;
  margin-top: 6px;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  background: #165DFF;
  border-radius: 50%;
  animation: pulse-dot-anim 1s ease-in-out infinite;
}

@keyframes pulse-dot-anim {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.8); }
}
</style>
