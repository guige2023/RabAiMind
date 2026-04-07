<template>
  <div class="presenter-view" :class="{ 'laser-active': laserActive }" @keydown="handleKeydown" tabindex="0" ref="presenterRoot">
    <!-- 顶部信息栏 -->
    <div class="presenter-header">
      <div class="header-left">
        <span class="presenter-label">🎤 演讲者视图</span>
        <span class="elapsed-time" :class="{ overtime: isOvertime }">
          ⏱ {{ formatTime(elapsedSeconds) }}
        </span>
        <span v-if="timerDurationMinutes > 0" class="time-remaining" :class="{ warning: remainingSeconds <= 60 && remainingSeconds > 0, overtime: isOvertime }">
          / {{ isOvertime ? '+' : '' }}{{ formatTime(Math.abs(remainingSeconds)) }}
        </span>
        <!-- Auto-advance indicator -->
        <span v-if="autoAdvanceEnabled && autoAdvanceSeconds > 0" class="auto-advance-indicator" :class="{ active: autoAdvanceRunning }">
          🔄 {{ autoAdvanceSeconds }}s
        </span>
      </div>
      <div class="header-center">
        <!-- Progress bar -->
        <div class="progress-bar-container">
          <div class="progress-bar-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
        <span class="slide-info">{{ currentSlide + 1 }} / {{ totalSlides }}</span>
      </div>
      <div class="header-right">
        <!-- Laser pointer toggle -->
        <button class="header-btn" :class="{ active: laserActive }" @click="toggleLaser" title="激光笔 (L)">
          🎯 激光笔
        </button>
        <!-- Auto-advance toggle -->
        <button class="header-btn" :class="{ active: autoAdvanceEnabled }" @click="toggleAutoAdvance" title="自动翻页 (A)">
          ⏭️ 自动
        </button>
        <!-- Keyboard shortcuts help -->
        <button class="header-btn" @click="showShortcuts = !showShortcuts" title="快捷键 (?)">
          ⌨️
        </button>
        <button class="btn-close" @click="closePresenter" title="关闭演讲者视图">
          ✕ 关闭
        </button>
      </div>
    </div>

    <!-- Keyboard Shortcuts Modal -->
    <div v-if="showShortcuts" class="shortcuts-modal" @click.self="showShortcuts = false">
      <div class="shortcuts-content">
        <h2>⌨️ 快捷键</h2>
        <div class="shortcuts-grid">
          <div class="shortcut-item"><kbd>←</kbd><kbd>→</kbd><span>上一页 / 下一页</span></div>
          <div class="shortcut-item"><kbd>Space</kbd><span>下一页</span></div>
          <div class="shortcut-item"><kbd>Home</kbd><span>第一页</span></div>
          <div class="shortcut-item"><kbd>End</kbd><span>最后一页</span></div>
          <div class="shortcut-item"><kbd>T</kbd><span>开始/暂停计时</span></div>
          <div class="shortcut-item"><kbd>R</kbd><span>重置计时</span></div>
          <div class="shortcut-item"><kbd>L</kbd><span>激光笔</span></div>
          <div class="shortcut-item"><kbd>A</kbd><span>自动翻页</span></div>
          <div class="shortcut-item"><kbd>+</kbd><kbd>-</kbd><span>调整自动翻页时间</span></div>
          <div class="shortcut-item"><kbd>Esc</kbd><span>关闭快捷键帮助</span></div>
        </div>
        <button class="close-shortcuts-btn" @click="showShortcuts = false">关闭</button>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="presenter-body">
      <!-- 左侧：当前幻灯片预览 -->
      <div class="current-slide-panel">
        <div class="current-slide-label">当前幻灯片</div>
        <div class="current-slide-preview" :key="currentSlide">
          <img
            v-if="currentSlideData?.svgUrl"
            :src="currentSlideData.svgUrl"
            :alt="currentSlideData.title"
            class="preview-image"
          />
          <div v-else class="preview-placeholder">
            <h3>{{ currentSlideData?.title }}</h3>
            <p>{{ currentSlideData?.content }}</p>
          </div>
        </div>
        <!-- 演讲者备注 -->
        <div class="presenter-notes-section" v-if="currentSlideData?.presenterNotes">
          <div class="notes-label">📋 备注</div>
          <div class="notes-text">{{ currentSlideData.presenterNotes }}</div>
        </div>
        <div class="presenter-notes-section empty" v-else>
          <div class="notes-label">📋 备注</div>
          <div class="notes-text empty-text">本页暂无备注</div>
        </div>

        <!-- AI 教练数据同步显示 -->
        <div class="coach-sync-section">
          <div class="coach-sync-title">🎯 AI 教练数据</div>
          <div class="coach-sync-row">
            <span class="coach-sync-label">自信度</span>
            <div class="coach-sync-bar-bg">
              <div class="coach-sync-bar-fill confidence" :style="{ width: (coachData.confidenceScore || 75) + '%' }"></div>
            </div>
            <span class="coach-sync-value">{{ coachData.confidenceScore || 75 }}</span>
          </div>
          <div class="coach-sync-row">
            <span class="coach-sync-label">眼神接触</span>
            <div class="coach-sync-bar-bg">
              <div class="coach-sync-bar-fill eye" :style="{ width: (coachData.eyeContact || 65) + '%' }"></div>
            </div>
            <span class="coach-sync-value">{{ coachData.eyeContact || 65 }}%</span>
          </div>
          <div class="coach-sync-row">
            <span class="coach-sync-label">语速稳定</span>
            <div class="coach-sync-bar-bg">
              <div class="coach-sync-bar-fill pace" :style="{ width: (coachData.paceScore || 80) + '%' }"></div>
            </div>
            <span class="coach-sync-value">{{ coachData.paceScore || 80 }}%</span>
          </div>
          <div class="coach-sync-row">
            <span class="coach-sync-label">填充词</span>
            <div class="coach-sync-bar-bg">
              <div class="coach-sync-bar-fill fillers" :style="{ width: (coachData.fillerControl || 90) + '%' }"></div>
            </div>
            <span class="coach-sync-value">{{ coachData.fillerCount || 0 }}次</span>
          </div>
          <div class="coach-sync-tips" v-if="coachData.latestTip">
            <span class="tip-icon">{{ coachData.latestTip.icon }}</span>
            <span class="tip-text">{{ coachData.latestTip.text }}</span>
          </div>
        </div>
      </div>

      <!-- 右侧：幻灯片缩略图导航 -->
      <div class="slide-navigator">
        <div class="navigator-label">幻灯片导航 ({{ totalSlides }}页)</div>
        <div class="thumbnail-grid" ref="thumbnailGrid">
          <div
            v-for="(slide, index) in slides"
            :key="index"
            class="thumbnail-item"
            :class="{ active: index === currentSlide, visited: index < currentSlide }"
            @click="goToSlide(index)"
          >
            <div class="thumbnail-number">{{ index + 1 }}</div>
            <div class="thumbnail-image-wrapper">
              <img
                v-if="slide.svgUrl"
                :src="slide.svgUrl"
                :alt="slide.title"
                class="thumbnail-image"
                loading="lazy"
              />
              <div v-else class="thumbnail-placeholder">
                {{ slide.title }}
              </div>
            </div>
            <div v-if="index === currentSlide" class="thumbnail-active-indicator"></div>
            <div v-if="index < currentSlide" class="thumbnail-visited-dot"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部导航 -->
    <div class="presenter-footer">
      <button class="nav-btn" @click="prevSlide" :disabled="currentSlide === 0">
        ◀ 上一页
      </button>
      <div class="footer-slide-info">
        <span class="footer-current">{{ currentSlide + 1 }}</span>
        <span class="footer-sep">/</span>
        <span class="footer-total">{{ totalSlides }}</span>
      </div>
      <button class="nav-btn primary" @click="nextSlide" :disabled="currentSlide >= totalSlides - 1">
        下一页 ▶
      </button>
      <button class="nav-btn secondary" @click="toggleTimer">
        {{ timerRunning ? '⏸ 暂停' : '▶ 开始' }}
      </button>
      <button class="nav-btn secondary" @click="resetTimer" title="重置计时">
        ↺ 重置
      </button>
      <!-- Auto-advance controls -->
      <div class="auto-advance-controls" v-if="autoAdvanceEnabled">
        <button class="nav-btn secondary" @click="adjustAutoAdvance(-5)" title="减少自动翻页时间">
          -5s
        </button>
        <span class="auto-advance-label">{{ autoAdvanceSeconds }}s/页</span>
        <button class="nav-btn secondary" @click="adjustAutoAdvance(5)" title="增加自动翻页时间">
          +5s
        </button>
        <button class="nav-btn secondary" :class="{ active: autoAdvanceRunning }" @click="toggleAutoAdvanceRunning">
          {{ autoAdvanceRunning ? '⏸ 暂停自动' : '▶ 自动翻页' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface Slide {
  title: string
  content?: string
  bullets?: string[]
  background?: string
  svgUrl?: string
  transition?: 'slide' | 'fade' | 'zoom' | 'flip'
  presenterNotes?: string
}

const slides = ref<Slide[]>([])
const currentSlide = ref(0)
const elapsedSeconds = ref(0)
const timerDurationMinutes = ref(0)
const timerRunning = ref(false)

// Auto-advance state
const autoAdvanceEnabled = ref(false)
const autoAdvanceSeconds = ref(10)
const autoAdvanceRunning = ref(false)
let autoAdvanceInterval: ReturnType<typeof setInterval> | null = null
let autoAdvanceCountdown = ref(0)

// Laser pointer
const laserActive = ref(false)

// Keyboard shortcuts modal
const showShortcuts = ref(false)

// Ref for focus
const presenterRoot = ref<HTMLElement | null>(null)

// AI Coach data from main presentation window
const coachData = ref({
  confidenceScore: 75,
  eyeContact: 65,
  paceScore: 80,
  fillerControl: 90,
  fillerCount: 0,
  latestTip: null as { icon: string; text: string } | null
})

let timerInterval: ReturnType<typeof setInterval> | null = null
let bc: BroadcastChannel | null = null

const totalSlides = computed(() => slides.value.length)
const currentSlideData = computed(() => slides.value[currentSlide.value])

const remainingSeconds = computed(() => {
  if (timerDurationMinutes.value === 0) return 0
  return timerDurationMinutes.value * 60 - elapsedSeconds.value
})

const isOvertime = computed(() => remainingSeconds.value < 0)

// Progress bar percentage
const progressPercent = computed(() => {
  if (totalSlides.value === 0) return 0
  return ((currentSlide.value + 1) / totalSlides.value) * 100
})

const formatTime = (seconds: number): string => {
  const abs = Math.abs(seconds)
  const m = Math.floor(abs / 60)
  const s = abs % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

const loadFromStorage = () => {
  try {
    const stored = localStorage.getItem('rabai_presentation_state')
    if (stored) {
      const state = JSON.parse(stored)
      slides.value = state.slides || []
      currentSlide.value = state.currentSlide || 0
      elapsedSeconds.value = state.elapsedSeconds || 0
      timerDurationMinutes.value = state.timerDurationMinutes || 0
      timerRunning.value = state.timerRunning || false
      if (timerRunning.value) {
        startTimerInterval()
      }
    }
  } catch (e) {
    console.warn('Failed to load presentation state:', e)
  }
}

const saveToStorage = () => {
  try {
    localStorage.setItem('rabai_presentation_state', JSON.stringify({
      slides: slides.value,
      currentSlide: currentSlide.value,
      elapsedSeconds: elapsedSeconds.value,
      timerDurationMinutes: timerDurationMinutes.value,
      timerRunning: timerRunning.value,
      autoAdvanceEnabled: autoAdvanceEnabled.value,
      autoAdvanceSeconds: autoAdvanceSeconds.value,
      lastUpdate: Date.now()
    }))
  } catch (e) {
    console.warn('Failed to save presentation state:', e)
  }
}

const setupBroadcastChannel = () => {
  bc = new BroadcastChannel('rabai_presentation')
  bc.onmessage = (event) => {
    const { type, data } = event.data
    switch (type) {
      case 'state_update':
        slides.value = data.slides || slides.value
        currentSlide.value = data.currentSlide ?? currentSlide.value
        elapsedSeconds.value = data.elapsedSeconds ?? elapsedSeconds.value
        timerDurationMinutes.value = data.timerDurationMinutes ?? timerDurationMinutes.value
        timerRunning.value = data.timerRunning ?? timerRunning.value
        if (data.timerRunning && !timerRunning.value) {
          startTimerInterval()
        } else if (!data.timerRunning && timerRunning.value) {
          stopTimerInterval()
        }
        break
      case 'sync_request':
        // Reply with current state
        bc?.postMessage({
          type: 'state_update',
          data: {
            slides: slides.value,
            currentSlide: currentSlide.value,
            elapsedSeconds: elapsedSeconds.value,
            timerDurationMinutes: timerDurationMinutes.value,
            timerRunning: timerRunning.value
          }
        })
        break
      case 'navigate':
        if (data.action === 'next') nextSlide()
        else if (data.action === 'prev') prevSlide()
        else if (typeof data.slide === 'number') goToSlide(data.slide)
        break
      case 'coach_update':
        if (data.confidenceScore !== undefined) coachData.value.confidenceScore = data.confidenceScore
        if (data.eyeContact !== undefined) coachData.value.eyeContact = data.eyeContact
        if (data.paceScore !== undefined) coachData.value.paceScore = data.paceScore
        if (data.fillerControl !== undefined) coachData.value.fillerControl = data.fillerControl
        if (data.fillerCount !== undefined) coachData.value.fillerCount = data.fillerCount
        if (data.latestTip) coachData.value.latestTip = data.latestTip
        break
    }
  }
  // Request initial state
  bc.postMessage({ type: 'sync_request' })
}

const startTimerInterval = () => {
  stopTimerInterval()
  timerRunning.value = true
  timerInterval = setInterval(() => {
    elapsedSeconds.value++
  }, 1000)
}

const stopTimerInterval = () => {
  timerRunning.value = false
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

const toggleTimer = () => {
  if (timerRunning.value) {
    stopTimerInterval()
  } else {
    startTimerInterval()
  }
  saveToStorage()
}

const resetTimer = () => {
  stopTimerInterval()
  elapsedSeconds.value = 0
  timerDurationMinutes.value = 0
  saveToStorage()
}

const goToSlide = (index: number) => {
  if (index < 0 || index >= totalSlides.value) return
  currentSlide.value = index
  saveToStorage()
  bc?.postMessage({
    type: 'navigate',
    data: { slide: index }
  })
}

const nextSlide = () => {
  if (currentSlide.value < totalSlides.value - 1) {
    goToSlide(currentSlide.value + 1)
  }
}

const prevSlide = () => {
  if (currentSlide.value > 0) {
    goToSlide(currentSlide.value - 1)
  }
}

const closePresenter = () => {
  window.close()
}

// Auto-advance functions
const toggleAutoAdvance = () => {
  autoAdvanceEnabled.value = !autoAdvanceEnabled.value
  if (autoAdvanceEnabled.value && autoAdvanceRunning.value) {
    startAutoAdvanceInterval()
  } else {
    stopAutoAdvanceInterval()
  }
  saveToStorage()
}

const toggleAutoAdvanceRunning = () => {
  if (autoAdvanceRunning.value) {
    stopAutoAdvanceInterval()
  } else {
    startAutoAdvanceInterval()
  }
}

const startAutoAdvanceInterval = () => {
  stopAutoAdvanceInterval()
  if (!autoAdvanceEnabled.value || autoAdvanceSeconds.value <= 0) return
  autoAdvanceRunning.value = true
  autoAdvanceCountdown.value = autoAdvanceSeconds.value
  autoAdvanceInterval = setInterval(() => {
    autoAdvanceCountdown.value--
    if (autoAdvanceCountdown.value <= 0) {
      // Auto advance to next slide
      if (currentSlide.value < totalSlides.value - 1) {
        goToSlide(currentSlide.value + 1)
      }
      autoAdvanceCountdown.value = autoAdvanceSeconds.value
    }
  }, 1000)
}

const stopAutoAdvanceInterval = () => {
  autoAdvanceRunning.value = false
  if (autoAdvanceInterval) {
    clearInterval(autoAdvanceInterval)
    autoAdvanceInterval = null
  }
}

const adjustAutoAdvance = (delta: number) => {
  autoAdvanceSeconds.value = Math.max(3, Math.min(60, autoAdvanceSeconds.value + delta))
  if (autoAdvanceRunning.value) {
    startAutoAdvanceInterval()
  }
  saveToStorage()
}

// Laser pointer toggle
const toggleLaser = () => {
  laserActive.value = !laserActive.value
}

// Keyboard shortcuts
const handleKeydown = (e: KeyboardEvent) => {
  // Ignore if typing in an input
  if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
    return
  }
  switch (e.key) {
    case 'ArrowRight':
    case ' ':
    case 'PageDown':
      e.preventDefault()
      nextSlide()
      break
    case 'ArrowLeft':
    case 'PageUp':
      e.preventDefault()
      prevSlide()
      break
    case 'Home':
      e.preventDefault()
      goToSlide(0)
      break
    case 'End':
      e.preventDefault()
      goToSlide(totalSlides.value - 1)
      break
    case 't':
    case 'T':
      e.preventDefault()
      toggleTimer()
      break
    case 'r':
    case 'R':
      e.preventDefault()
      resetTimer()
      break
    case 'l':
    case 'L':
      e.preventDefault()
      toggleLaser()
      break
    case 'a':
    case 'A':
      e.preventDefault()
      toggleAutoAdvance()
      break
    case '+':
    case '=':
      e.preventDefault()
      adjustAutoAdvance(5)
      break
    case '-':
    case '_':
      e.preventDefault()
      adjustAutoAdvance(-5)
      break
    case '?':
      e.preventDefault()
      showShortcuts.value = !showShortcuts.value
      break
    case 'Escape':
      if (showShortcuts.value) {
        showShortcuts.value = false
      }
      break
  }
}

onMounted(() => {
  loadFromStorage()
  setupBroadcastChannel()
  // Focus for keyboard events
  presenterRoot.value?.focus()
})

onUnmounted(() => {
  stopTimerInterval()
  bc?.close()
})
</script>

<style scoped>
.presenter-view {
  position: fixed;
  inset: 0;
  background: #0f0f1a;
  display: flex;
  flex-direction: column;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow: hidden;
}

/* Header */
.presenter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: rgba(20, 20, 35, 0.95);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.presenter-label {
  font-size: 14px;
  font-weight: 600;
  color: #165DFF;
}

.elapsed-time {
  font-size: 20px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
  padding: 4px 14px;
  border-radius: 8px;
  font-family: 'SF Mono', Monaco, monospace;
}

.elapsed-time.overtime {
  color: #ff6b6b;
  background: rgba(255, 107, 107, 0.15);
}

.time-remaining {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  font-variant-numeric: tabular-nums;
}

.time-remaining.warning {
  color: #ffd93d;
}

.time-remaining.overtime {
  color: #ff6b6b;
}

.header-center {
  text-align: center;
}

.slide-info {
  font-size: 16px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  background: rgba(22, 93, 255, 0.3);
  padding: 6px 20px;
  border-radius: 20px;
  border: 1px solid rgba(22, 93, 255, 0.4);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-close {
  background: rgba(255, 80, 80, 0.2);
  border: 1px solid rgba(255, 80, 80, 0.4);
  color: #ff6b6b;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.btn-close:hover {
  background: rgba(255, 80, 80, 0.3);
}

/* Body */
.presenter-body {
  flex: 1;
  display: flex;
  gap: 0;
  overflow: hidden;
}

/* Current slide panel */
.current-slide-panel {
  width: 55%;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.current-slide-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.current-slide-preview {
  flex: 1;
  background: #1a1a2e;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  min-height: 0;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.preview-placeholder {
  text-align: center;
  padding: 20px;
}

.preview-placeholder h3 {
  font-size: 20px;
  margin-bottom: 10px;
}

.preview-placeholder p {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
}

.presenter-notes-section {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 12px 14px;
  max-height: 120px;
  overflow-y: auto;
  flex-shrink: 0;
}

.presenter-notes-section.empty {
  opacity: 0.6;
}

.notes-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

.notes-text {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
  white-space: pre-wrap;
}

.notes-text.empty-text {
  color: rgba(255, 255, 255, 0.35);
  font-style: italic;
}

/* Slide navigator */
.slide-navigator {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.navigator-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.thumbnail-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
  overflow-y: auto;
  padding-right: 4px;
}

.thumbnail-item {
  position: relative;
  cursor: pointer;
  border-radius: 6px;
  overflow: hidden;
  border: 2px solid transparent;
  transition: all 0.2s;
  background: rgba(255, 255, 255, 0.05);
}

.thumbnail-item:hover {
  border-color: rgba(255, 255, 255, 0.3);
  transform: scale(1.02);
}

.thumbnail-item.active {
  border-color: #165DFF;
  box-shadow: 0 0 12px rgba(22, 93, 255, 0.4);
}

.thumbnail-item.visited .thumbnail-visited-dot {
  display: block;
}

.thumbnail-number {
  position: absolute;
  top: 4px;
  left: 4px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-size: 10px;
  padding: 2px 5px;
  border-radius: 3px;
  z-index: 2;
}

.thumbnail-image-wrapper {
  aspect-ratio: 16/9;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-placeholder {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
  padding: 4px;
}

.thumbnail-active-indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: #165DFF;
}

.thumbnail-visited-dot {
  display: none;
  position: absolute;
  top: 4px;
  right: 4px;
  width: 6px;
  height: 6px;
  background: #4ade80;
  border-radius: 50%;
  z-index: 2;
}

/* Footer */
.presenter-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 12px 20px;
  background: rgba(20, 20, 35, 0.95);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.footer-slide-info {
  display: flex;
  align-items: baseline;
  gap: 4px;
  font-variant-numeric: tabular-nums;
}

.footer-current {
  font-size: 28px;
  font-weight: 700;
  color: #165DFF;
}

.footer-sep {
  font-size: 20px;
  color: rgba(255, 255, 255, 0.3);
}

.footer-total {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.5);
}

.nav-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.nav-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
}

.nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.nav-btn.primary {
  background: #165DFF;
  border-color: #165DFF;
}

.nav-btn.primary:hover:not(:disabled) {
  background: #0d47e1;
}

.nav-btn.secondary {
  background: rgba(255, 255, 255, 0.08);
  font-size: 13px;
  padding: 8px 14px;
}

/* Scrollbar styling */
.thumbnail-grid::-webkit-scrollbar {
  width: 4px;
}

.thumbnail-grid::-webkit-scrollbar-track {
  background: transparent;
}

.thumbnail-grid::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

/* AI Coach Sync Section */
.coach-sync-section {
  margin-top: 12px;
  background: rgba(22, 93, 255, 0.08);
  border: 1px solid rgba(22, 93, 255, 0.2);
  border-radius: 10px;
  padding: 10px 12px;
}

.coach-sync-title {
  font-size: 12px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 8px;
}

.coach-sync-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 11px;
}

.coach-sync-label {
  color: rgba(255, 255, 255, 0.45);
  min-width: 56px;
}

.coach-sync-bar-bg {
  flex: 1;
  height: 5px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 3px;
  overflow: hidden;
}

.coach-sync-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}

.coach-sync-bar-fill.confidence { background: linear-gradient(90deg, #34d399, #00b8d9); }
.coach-sync-bar-fill.eye { background: linear-gradient(90deg, #165DFF, #7229ff); }
.coach-sync-bar-fill.pace { background: linear-gradient(90deg, #34d399, #00b8d9); }
.coach-sync-bar-fill.fillers { background: linear-gradient(90deg, #ffd93d, #ff6b6b); }

.coach-sync-value {
  color: rgba(255, 255, 255, 0.6);
  min-width: 28px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.coach-sync-tips {
  margin-top: 8px;
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 6px 8px;
  background: rgba(255, 217, 61, 0.08);
  border: 1px solid rgba(255, 217, 61, 0.15);
  border-radius: 6px;
  font-size: 11px;
  color: #ffd93d;
  line-height: 1.4;
}

.tip-icon {
  font-size: 13px;
  flex-shrink: 0;
}

/* Progress Bar */
.progress-bar-container {
  width: 200px;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
  margin: 0 12px;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #165DFF, #00b8d9);
  border-radius: 3px;
  transition: width 0.3s ease;
}

/* Header Buttons */
.header-btn {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  margin-right: 6px;
}

.header-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.header-btn.active {
  background: rgba(22, 93, 255, 0.3);
  border-color: #165DFF;
  color: #165DFF;
}

/* Auto-advance Indicator */
.auto-advance-indicator {
  background: rgba(255, 149, 0, 0.15);
  border: 1px solid rgba(255, 149, 0, 0.3);
  color: #FF9500;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  margin-left: 8px;
}

.auto-advance-indicator.active {
  background: rgba(52, 211, 153, 0.15);
  border-color: rgba(52, 211, 153, 0.3);
  color: #34d399;
}

/* Auto-advance Controls */
.auto-advance-controls {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: 12px;
  padding-left: 12px;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
}

.auto-advance-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  font-variant-numeric: tabular-nums;
  min-width: 50px;
}

.nav-btn.active {
  background: rgba(52, 211, 153, 0.2);
  border-color: #34d399;
  color: #34d399;
}

/* Keyboard Shortcuts Modal */
.shortcuts-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.shortcuts-content {
  background: #1a1a2e;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px 32px;
  max-width: 480px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.shortcuts-content h2 {
  color: #fff;
  font-size: 18px;
  margin-bottom: 16px;
  text-align: center;
}

.shortcuts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 16px;
  margin-bottom: 20px;
}

.shortcut-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
}

.shortcut-item kbd {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 11px;
  font-family: 'SF Mono', Monaco, monospace;
  color: #fff;
}

.shortcut-item span {
  margin-left: 4px;
}

.close-shortcuts-btn {
  width: 100%;
  background: #165DFF;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.close-shortcuts-btn:hover {
  background: #0d47e1;
}

/* Laser pointer cursor */
.presenter-view.laser-active {
  cursor: crosshair;
}

.presenter-view.laser-active * {
  cursor: crosshair !important;
}
</style>
