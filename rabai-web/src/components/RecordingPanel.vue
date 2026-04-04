<template>
  <Teleport to="body">
    <div v-if="show" class="recording-panel-overlay" @click.self="handleClose">
      <div class="recording-panel">
        <!-- Header -->
        <div class="panel-header">
          <text class="panel-title">🎬 演示录制</text>
          <button class="btn btn-sm btn-close-panel" @click="handleClose">✕</button>
        </div>

        <!-- Tabs -->
        <div class="panel-tabs">
          <view :class="['tab-btn', activeTab === 'record' ? 'active' : '']" @click="activeTab = 'record'">
            <text>📹 录制</text>
          </view>
          <view :class="['tab-btn', activeTab === 'stream' ? 'active' : '']" @click="activeTab = 'stream'">
            <text>📡 直播</text>
          </view>
          <view :class="['tab-btn', activeTab === 'webcam' ? 'active' : '']" @click="activeTab = 'webcam'">
            <text>📷 摄像头</text>
          </view>
          <view :class="['tab-btn', activeTab === 'chapters' ? 'active' : '']" @click="activeTab = 'chapters'">
            <text>📑 章节</text>
          </view>
          <view :class="['tab-btn', activeTab === 'export' ? 'active' : '']" @click="activeTab = 'export'">
            <text>💾 导出</text>
          </view>
        </div>

        <!-- Tab Content: Record -->
        <div v-if="activeTab === 'record'" class="tab-content">
          <div class="recording-status">
            <div class="status-indicator" :class="{ recording: isRecording, paused: isPaused }">
              <span class="status-dot"></span>
              <span class="status-text">{{ recordingStatusText }}</span>
            </div>
            <div v-if="isRecording || isPaused" class="recording-timer">
              {{ formatTime(recordingDuration) }}
            </div>
          </div>

          <div class="recording-controls">
            <button
              class="btn btn-lg btn-record"
              :class="{ 'btn-stop': isRecording, 'btn-resume': isPaused }"
              @click="toggleRecording"
            >
              {{ isRecording ? '⏹️ 停止' : (isPaused ? '▶️ 继续' : '⏺️ 开始录制') }}
            </button>
            <button
              v-if="isRecording"
              class="btn btn-lg btn-pause"
              @click="pauseRecording"
            >
              ⏸️ 暂停
            </button>
          </div>

          <div class="recording-info">
            <p class="info-text">
              录制将捕获演示模式的完整画面，包含所有动画和过渡效果。
            </p>
            <div class="recording-tips">
              <div class="tip-item">
                <span class="tip-icon">💡</span>
                <span>建议先全屏演示模式，再开始录制</span>
              </div>
              <div class="tip-item">
                <span class="tip-icon">🎤</span>
                <span>可配合语音旁白使用效果更佳</span>
              </div>
            </div>
          </div>

          <button class="btn btn-primary btn-lg btn-full" @click="startPresentationAndRecord">
            🎬 开始演示并录制
          </button>
        </div>

        <!-- Tab Content: Stream -->
        <div v-if="activeTab === 'stream'" class="tab-content">
          <div class="form-item">
            <text class="form-label">直播平台</text>
            <div class="stream-platforms">
              <div
                v-for="platform in streamPlatforms"
                :key="platform.id"
                class="platform-option"
                :class="{ active: selectedPlatform === platform.id }"
                @click="selectedPlatform = platform.id"
              >
                <span class="platform-icon">{{ platform.icon }}</span>
                <span class="platform-name">{{ platform.name }}</span>
              </div>
            </div>
          </div>

          <div class="form-item">
            <text class="form-label">推流地址 (RTMP)</text>
            <input
              v-model="rtmpUrl"
              class="form-input"
              placeholder="rtmp://..."
            />
          </div>

          <div class="form-item">
            <text class="form-label">直播密钥</text>
            <input
              v-model="streamKey"
              type="password"
              class="form-input"
              placeholder="输入直播密钥"
            />
          </div>

          <div class="form-item">
            <text class="form-label">分辨率</text>
            <select v-model="streamResolution" class="form-select">
              <option value="1080p">1080p (1920x1080)</option>
              <option value="720p">720p (1280x720)</option>
              <option value="480p">480p (854x480)</option>
            </select>
          </div>

          <div class="form-item">
            <text class="form-label">帧率</text>
            <select v-model="streamFramerate" class="form-select">
              <option value="60">60 fps</option>
              <option value="30">30 fps</option>
              <option value="15">15 fps</option>
            </select>
          </div>

          <div class="stream-actions">
            <button
              class="btn btn-primary btn-lg btn-full"
              :disabled="!rtmpUrl || !streamKey || isStreaming"
              @click="startStreaming"
            >
              {{ isStreaming ? '📡 直播中...' : '📡 开始直播' }}
            </button>
            <button
              v-if="isStreaming"
              class="btn btn-danger btn-lg btn-full"
              @click="stopStreaming"
            >
              ⏹️ 停止直播
            </button>
          </div>
        </div>

        <!-- Tab Content: Webcam -->
        <div v-if="activeTab === 'webcam'" class="tab-content">
          <div class="form-item">
            <text class="form-label">摄像头预览</text>
            <div class="webcam-preview">
              <video ref="webcamVideo" class="webcam-video" autoplay muted playsinline></video>
              <div v-if="!webcamEnabled" class="webcam-placeholder">
                <span>📷</span>
                <p>点击启用摄像头</p>
              </div>
            </div>
            <button
              class="btn btn-sm"
              :class="{ 'btn-active': webcamEnabled }"
              @click="toggleWebcam"
            >
              {{ webcamEnabled ? '🔴 摄像头已启用' : '🔘 启用摄像头' }}
            </button>
          </div>

          <div class="form-item">
            <text class="form-label">叠加位置</text>
            <div class="position-grid">
              <div
                v-for="pos in positions"
                :key="pos.id"
                class="position-option"
                :class="{ active: webcamPosition === pos.id }"
                @click="webcamPosition = pos.id"
              >
                <div class="position-preview">
                  <div class="preview-slide"></div>
                  <div class="preview-cam" :class="pos.id"></div>
                </div>
                <span class="position-name">{{ pos.name }}</span>
              </div>
            </div>
          </div>

          <div class="form-item">
            <text class="form-label">摄像头大小</text>
            <div class="size-slider">
              <input
                type="range"
                v-model.number="webcamSize"
                min="80"
                max="300"
                class="slider"
              />
              <span class="size-value">{{ webcamSize }}px</span>
            </div>
          </div>

          <div class="form-item">
            <text class="form-label">圆角</text>
            <div class="size-slider">
              <input
                type="range"
                v-model.number="webcamBorderRadius"
                min="0"
                max="50"
                class="slider"
              />
              <span class="size-value">{{ webcamBorderRadius }}%</span>
            </div>
          </div>

          <div class="form-item">
            <label class="checkbox-label">
              <input type="checkbox" v-model="webcamMirror" />
              <span>水平翻转 (镜像)</span>
            </label>
          </div>

          <div class="form-item">
            <label class="checkbox-label">
              <input type="checkbox" v-model="webcamBorder" />
              <span>显示边框</span>
            </label>
          </div>
        </div>

        <!-- Tab Content: Chapters -->
        <div v-if="activeTab === 'chapters'" class="tab-content">
          <div class="form-item">
            <text class="form-label">章节列表</text>
            <div v-if="chapters.length === 0" class="chapters-empty">
              <p>暂无章节标记</p>
              <p class="tip">录制时按"M"键可快速添加章节</p>
            </div>
            <div v-else class="chapters-list">
              <div
                v-for="(chapter, index) in chapters"
                :key="chapter.id"
                class="chapter-item"
              >
                <div class="chapter-index">{{ index + 1 }}</div>
                <div class="chapter-info">
                  <input
                    v-model="chapter.title"
                    class="chapter-title-input"
                    placeholder="章节标题"
                  />
                  <div class="chapter-time">{{ formatTime(chapter.time) }}</div>
                </div>
                <button class="btn btn-sm btn-icon" @click="removeChapter(index)">✕</button>
              </div>
            </div>
          </div>

          <button
            v-if="isRecording"
            class="btn btn-primary btn-full"
            @click="addChapterAtCurrentTime"
          >
            ➕ 在当前位置添加章节
          </button>

          <div class="chapter-tips">
            <div class="tip-item">
              <span class="tip-icon">⌨️</span>
              <span>录制时按 M 键添加章节</span>
            </div>
            <div class="tip-item">
              <span class="tip-icon">📑</span>
              <span>章节会嵌入视频文件，方便导航</span>
            </div>
          </div>
        </div>

        <!-- Tab Content: Export -->
        <div v-if="activeTab === 'export'" class="tab-content">
          <div class="form-item">
            <text class="form-label">视频格式</text>
            <select v-model="exportFormat" class="form-select">
              <option value="mp4">MP4 (H.264)</option>
              <option value="webm">WebM (VP9)</option>
            </select>
          </div>

          <div class="form-item">
            <text class="form-label">视频质量</text>
            <select v-model="exportQuality" class="form-select">
              <option value="high">高质量 (1080p)</option>
              <option value="medium">中等质量 (720p)</option>
              <option value="low">低质量 (480p)</option>
            </select>
          </div>

          <div class="form-item">
            <label class="checkbox-label">
              <input type="checkbox" v-model="includeChapters" />
              <span>包含章节标记</span>
            </label>
          </div>

          <div class="form-item">
            <label class="checkbox-label">
              <input type="checkbox" v-model="includeWebcam" />
              <span>包含摄像头叠加</span>
            </label>
          </div>

          <div class="form-item">
            <label class="checkbox-label">
              <input type="checkbox" v-model="includeAudio" />
              <span>包含音频</span>
            </label>
          </div>

          <div class="export-preview" v-if="lastRecording">
            <text class="form-label">上次录制</text>
            <div class="preview-info">
              <span>⏱ {{ formatTime(lastRecording.duration) }}</span>
              <span>📦 {{ formatFileSize(lastRecording.size) }}</span>
            </div>
            <div class="export-actions">
              <button class="btn btn-primary" @click="exportRecording">
                💾 导出 MP4
              </button>
              <button class="btn btn-outline" @click="deleteRecording">
                🗑️ 删除
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface RecordingChapter {
  id: string
  title: string
  time: number  // seconds
}

interface LastRecording {
  duration: number
  size: number
  url: string
}

const props = defineProps<{
  show: boolean
  taskId?: string
  slides?: any[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'start-record'): void
  (e: 'stop-record'): void
  (e: 'add-chapter', chapter: RecordingChapter): void
  (e: 'webcam-config', config: WebcamConfig): void
  (e: 'stream-config', config: StreamConfig): void
  (e: 'export-recording', options: ExportOptions): void
}>()

// Tab state
const activeTab = ref('record')

// Recording state
const isRecording = ref(false)
const isPaused = ref(false)
const recordingDuration = ref(0)
let recordingTimer: ReturnType<typeof setInterval> | null = null

// Stream state
const selectedPlatform = ref('youtube')
const rtmpUrl = ref('')
const streamKey = ref('')
const streamResolution = ref('1080p')
const streamFramerate = ref('30')
const isStreaming = ref(false)

// Webcam state
const webcamEnabled = ref(false)
const webcamPosition = ref('bottom-right')
const webcamSize = ref(160)
const webcamBorderRadius = ref(8)
const webcamMirror = ref(true)
const webcamBorder = ref(true)
const webcamVideo = ref<HTMLVideoElement | null>(null)
let webcamStream: MediaStream | null = null

// Chapters
const chapters = ref<RecordingChapter[]>([])

// Export
const exportFormat = ref('mp4')
const exportQuality = ref('high')
const includeChapters = ref(true)
const includeWebcam = ref(true)
const includeAudio = ref(true)
const lastRecording = ref<LastRecording | null>(null)

const streamPlatforms = [
  { id: 'youtube', name: 'YouTube', icon: '📺' },
  { id: 'twitch', name: 'Twitch', icon: '🎮' },
  { id: 'bilibili', name: '哔哩哔哩', icon: '📺' },
]

const positions = [
  { id: 'top-left', name: '左上' },
  { id: 'top-right', name: '右上' },
  { id: 'bottom-left', name: '左下' },
  { id: 'bottom-right', name: '右下' },
]

const recordingStatusText = computed(() => {
  if (isRecording.value) return '录制中'
  if (isPaused.value) return '已暂停'
  return '就绪'
})

// Recording controls
function toggleRecording() {
  if (isRecording.value) {
    stopRecording()
  } else {
    startRecording()
  }
}

function startRecording() {
  isRecording.value = true
  isPaused.value = false
  recordingDuration.value = 0
  emit('start-record')
  
  recordingTimer = setInterval(() => {
    if (!isPaused.value) {
      recordingDuration.value++
    }
  }, 1000)
}

function pauseRecording() {
  isPaused.value = !isPaused.value
}

function stopRecording() {
  isRecording.value = false
  isPaused.value = false
  if (recordingTimer) {
    clearInterval(recordingTimer)
    recordingTimer = null
  }
  emit('stop-record')
  
  // Save recording info
  if (recordingDuration.value > 0) {
    lastRecording.value = {
      duration: recordingDuration.value,
      size: Math.round(recordingDuration.value * 1024 * 1024 / 60), // estimate
      url: ''
    }
  }
}

// Streaming controls
function startStreaming() {
  if (!rtmpUrl.value || !streamKey.value) return
  isStreaming.value = true
  emit('stream-config', {
    platform: selectedPlatform.value,
    rtmpUrl: rtmpUrl.value,
    streamKey: streamKey.value,
    resolution: streamResolution.value,
    framerate: parseInt(streamFramerate.value)
  })
}

function stopStreaming() {
  isStreaming.value = false
}

// Webcam controls
async function toggleWebcam() {
  if (webcamEnabled.value) {
    disableWebcam()
  } else {
    await enableWebcam()
  }
}

async function enableWebcam() {
  try {
    webcamStream = await navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720 },
      audio: false
    })
    if (webcamVideo.value) {
      webcamVideo.value.srcObject = webcamStream
    }
    webcamEnabled.value = true
    emit('webcam-config', getWebcamConfig())
  } catch (err) {
    console.error('Failed to enable webcam:', err)
  }
}

function disableWebcam() {
  if (webcamStream) {
    webcamStream.getTracks().forEach(track => track.stop())
    webcamStream = null
  }
  webcamEnabled.value = false
}

function getWebcamConfig(): WebcamConfig {
  return {
    enabled: webcamEnabled.value,
    position: webcamPosition.value,
    size: webcamSize.value,
    borderRadius: webcamBorderRadius.value,
    mirror: webcamMirror.value,
    border: webcamBorder.value,
    stream: webcamStream
  }
}

// Watch webcam config changes
watch([webcamPosition, webcamSize, webcamBorderRadius, webcamMirror, webcamBorder], () => {
  if (webcamEnabled.value) {
    emit('webcam-config', getWebcamConfig())
  }
})

// Chapter management
function addChapterAtCurrentTime() {
  const chapter: RecordingChapter = {
    id: `ch-${Date.now()}`,
    title: `章节 ${chapters.value.length + 1}`,
    time: recordingDuration.value
  }
  chapters.value.push(chapter)
  emit('add-chapter', chapter)
}

function removeChapter(index: number) {
  chapters.value.splice(index, 1)
}

// Export
function exportRecording() {
  emit('export-recording', {
    format: exportFormat.value,
    quality: exportQuality.value,
    includeChapters: includeChapters.value,
    includeWebcam: includeWebcam.value,
    includeAudio: includeAudio.value
  })
}

function deleteRecording() {
  lastRecording.value = null
  chapters.value = []
}

// Utilities
function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function handleClose() {
  if (isRecording.value) {
    if (!confirm('录制尚未停止，确定要退出吗？')) return
    stopRecording()
  }
  disableWebcam()
  emit('close')
}

// Cleanup on unmount
watch(() => props.show, (val) => {
  if (!val) {
    disableWebcam()
  }
})
</script>

<style scoped>
.recording-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.recording-panel {
  background: var(--bg-primary, #fff);
  border-radius: 16px;
  width: 480px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.panel-title {
  font-size: 18px;
  font-weight: 600;
}

.btn-close-panel {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.btn-close-panel:hover {
  background: var(--bg-secondary, #f3f4f6);
}

.panel-tabs {
  display: flex;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
  overflow-x: auto;
}

.tab-btn {
  padding: 10px 12px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  white-space: nowrap;
  font-size: 13px;
}

.tab-btn.active {
  border-bottom-color: var(--color-primary, #2563eb);
  color: var(--color-primary, #2563eb);
}

.tab-content {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.recording-status {
  text-align: center;
  margin-bottom: 20px;
}

.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--bg-secondary, #f3f4f6);
  border-radius: 20px;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #9ca3af;
}

.status-indicator.recording .status-dot {
  background: #ef4444;
  animation: pulse 1s infinite;
}

.status-indicator.paused .status-dot {
  background: #f59e0b;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.recording-timer {
  font-size: 32px;
  font-weight: 700;
  font-family: monospace;
  margin-top: 12px;
  color: var(--color-primary, #2563eb);
}

.recording-controls {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 20px;
}

.btn-record {
  background: var(--color-primary, #2563eb);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 12px 24px;
  font-size: 16px;
  cursor: pointer;
}

.btn-record.btn-stop {
  background: #ef4444;
}

.btn-record.btn-resume {
  background: #10b981;
}

.btn-pause {
  background: var(--bg-secondary, #f3f4f6);
  border: none;
  border-radius: 12px;
  padding: 12px 24px;
  font-size: 16px;
  cursor: pointer;
}

.recording-info {
  margin-bottom: 20px;
}

.info-text {
  font-size: 13px;
  color: var(--text-secondary, #6b7280);
  margin-bottom: 16px;
}

.recording-tips {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-secondary, #6b7280);
}

.tip-icon {
  font-size: 14px;
}

.btn-full {
  width: 100%;
}

/* Stream Tab */
.stream-platforms {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.platform-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px;
  border: 2px solid var(--border-color, #e5e7eb);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.platform-option.active {
  border-color: var(--color-primary, #2563eb);
  background: var(--color-primary-light, #eff6ff);
}

.platform-icon {
  font-size: 24px;
}

.platform-name {
  font-size: 12px;
}

.stream-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
}

/* Webcam Tab */
.webcam-preview {
  width: 100%;
  aspect-ratio: 16/9;
  background: var(--bg-secondary, #f3f4f6);
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 12px;
  position: relative;
}

.webcam-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.webcam-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary, #6b7280);
}

.webcam-placeholder span {
  font-size: 32px;
  margin-bottom: 8px;
}

.position-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.position-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
  border: 2px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.position-option.active {
  border-color: var(--color-primary, #2563eb);
}

.position-preview {
  width: 60px;
  height: 40px;
  background: var(--bg-secondary, #f3f4f6);
  border-radius: 4px;
  position: relative;
}

.preview-slide {
  position: absolute;
  inset: 2px;
  background: var(--color-primary-light, #eff6ff);
  border-radius: 2px;
}

.preview-cam {
  position: absolute;
  width: 12px;
  height: 10px;
  background: var(--color-primary, #2563eb);
  border-radius: 2px;
}

.preview-cam.top-left { top: 2px; left: 2px; }
.preview-cam.top-right { top: 2px; right: 2px; }
.preview-cam.bottom-left { bottom: 2px; left: 2px; }
.preview-cam.bottom-right { bottom: 2px; right: 2px; }

.position-name {
  font-size: 11px;
}

.size-slider {
  display: flex;
  align-items: center;
  gap: 12px;
}

.slider {
  flex: 1;
  height: 4px;
  appearance: none;
  background: var(--border-color, #e5e7eb);
  border-radius: 2px;
}

.slider::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  background: var(--color-primary, #2563eb);
  border-radius: 50%;
  cursor: pointer;
}

.size-value {
  font-size: 12px;
  color: var(--text-secondary, #6b7280);
  min-width: 50px;
}

/* Chapters Tab */
.chapters-empty {
  text-align: center;
  padding: 20px;
  color: var(--text-secondary, #6b7280);
}

.chapters-empty .tip {
  font-size: 12px;
  margin-top: 8px;
}

.chapters-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
  max-height: 200px;
  overflow-y: auto;
}

.chapter-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: var(--bg-secondary, #f3f4f6);
  border-radius: 8px;
}

.chapter-index {
  width: 24px;
  height: 24px;
  background: var(--color-primary, #2563eb);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}

.chapter-info {
  flex: 1;
}

.chapter-title-input {
  width: 100%;
  border: none;
  background: none;
  font-size: 14px;
  padding: 2px 0;
}

.chapter-time {
  font-size: 11px;
  color: var(--text-secondary, #6b7280);
  font-family: monospace;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: var(--text-secondary, #6b7280);
}

.btn-icon:hover {
  color: #ef4444;
}

.chapter-tips {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
}

/* Export Tab */
.export-preview {
  background: var(--bg-secondary, #f3f4f6);
  border-radius: 12px;
  padding: 16px;
  margin-top: 16px;
}

.preview-info {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: var(--text-secondary, #6b7280);
  margin: 8px 0;
}

.export-actions {
  display: flex;
  gap: 8px;
}

.export-actions .btn {
  flex: 1;
}

/* Form Items */
.form-item {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 6px;
  color: var(--text-primary, #1f2937);
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
  font-size: 14px;
}

.form-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
  font-size: 14px;
  background: white;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
}

.btn-active {
  background: var(--color-primary, #2563eb);
  color: white;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-outline {
  background: transparent;
  border: 1px solid var(--border-color, #e5e7eb);
}
</style>
