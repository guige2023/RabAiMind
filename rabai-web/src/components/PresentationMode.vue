<template>
  <Teleport to="body">
    <div
      v-if="isActive"
      class="presentation-overlay"
      :class="{ 'laser-active': laserPointerActive }"
      @click="handleOverlayClick"
      @mousemove="handleMouseMove"
    >
      <!-- 顶部工具栏 -->
      <div class="presentation-toolbar" @click.stop>
        <span class="slide-counter">{{ currentSlide + 1 }} / {{ totalSlides }}</span>

        <!-- 计时器显示 -->
        <div class="timer-display">
          <span class="timer-elapsed" :class="{ 'overtime': isOvertime }">
            ⏱ {{ formatTime(elapsedSeconds) }}
          </span>
          <span v-if="timerDurationMinutes > 0" class="timer-remaining" :class="{ 'overtime': isOvertime, 'warning': remainingSeconds <= 60 && remainingSeconds > 0 }">
            / {{ isOvertime ? '+' : '' }}{{ formatTime(Math.abs(remainingSeconds)) }}
          </span>
          <button
            v-if="!timerRunning && elapsedSeconds === 0"
            class="timer-btn"
            @click="showTimerSetup = !showTimerSetup"
            title="设置计时器"
          >
            ⏱
          </button>
          <button
            v-if="timerRunning"
            class="timer-btn"
            @click="pauseTimer"
            title="暂停"
          >
            ⏸
          </button>
          <button
            v-if="!timerRunning && elapsedSeconds > 0"
            class="timer-btn"
            @click="resumeTimer"
            title="继续"
          >
            ▶
          </button>
          <button
            v-if="elapsedSeconds > 0"
            class="timer-btn"
            @click="resetTimer"
            title="重置"
          >
            ↺
          </button>
          <!-- 计时器设置下拉 -->
          <div v-if="showTimerSetup" class="timer-setup-dropdown">
            <div class="timer-setup-row">
              <label>目标时长:</label>
              <div class="timer-input-group">
                <input
                  type="number"
                  v-model.number="timerSetupMinutes"
                  min="0"
                  max="300"
                  class="timer-input"
                />
                <span>分钟</span>
              </div>
            </div>
            <div class="timer-setup-row">
              <button class="btn btn-sm" @click="startTimerWithSetup">开始计时</button>
              <button class="btn btn-sm btn-outline" @click="startTimerNoLimit">不限时</button>
            </div>
          </div>
        </div>

        <!-- 过渡效果选择 -->
        <div class="transition-selector">
          <select v-model="selectedTransition" class="transition-select" title="过渡效果">
            <option value="slide">滑动</option>
            <option value="fade">淡入淡出</option>
            <option value="zoom">缩放</option>
            <option value="flip">翻转</option>
          </select>
        </div>

        <!-- 过渡速度 -->
        <div class="duration-selector">
          <button
            v-for="d in durationOptions"
            :key="d.value"
            class="duration-btn"
            :class="{ active: selectedDuration === d.value }"
            @click="selectedDuration = d.value"
            :title="d.label"
          >
            {{ d.label }}
          </button>
        </div>

        <!-- 自动播放计时器 -->
        <div class="auto-advance" v-if="autoAdvanceEnabled">
          <span class="auto-advance-label">⏱ {{ autoAdvanceCountdown }}s</span>
        </div>

        <!-- 激光笔按钮 -->
        <button
          class="toolbar-btn laser-btn"
          :class="{ active: laserPointerActive }"
          @click="toggleLaserPointer"
          title="激光笔 (L)"
        >
          🔴
        </button>

        <!-- 演讲者备注按钮 -->
        <button
          class="toolbar-btn notes-btn"
          :class="{ active: showPresenterNotes }"
          @click="showPresenterNotes = !showPresenterNotes"
          title="演讲者备注 (N)"
        >
          📋
        </button>

        <!-- Q&A / 投票模式按钮 -->
        <button
          class="toolbar-btn qa-btn"
          :class="{ active: showQAPanel }"
          @click="toggleQAPanel"
          title="Q&A / 投票 (Q)"
        >
          ❓
        </button>

        <button class="toolbar-btn" @click="toggleFullscreen" title="全屏 (F)">
          {{ isFullscreen ? '⛶' : '⛶' }}
        </button>
        <button class="toolbar-btn" @click="exitPresentation" title="退出 (ESC)">
          ✕
        </button>
      </div>

      <!-- 激光笔光斑 -->
      <div
        v-if="laserPointerActive"
        class="laser-dot"
        :style="laserDotStyle"
      ></div>
      <div
        v-if="laserPointerActive && isDrawingLaser"
        class="laser-trail"
        :style="laserTrailStyle"
      ></div>

      <!-- 幻灯片内容 -->
      <div class="slides-container" ref="slidesRef">
        <!-- Swipe hint on mobile -->
        <div class="presentation-swipe-hint" v-if="slides.length > 1">
          <span>👆 左右滑动切换</span>
        </div>
        <div
          v-for="(slide, index) in slides"
          :key="index"
          class="slide"
          :class="getSlideClass(index)"
          :style="getSlideStyle(index)"
        >
          <div class="slide-content">
          <!-- SVG 模式：显示真实幻灯片 -->
          <img
            v-if="slide.svgUrl"
            :src="slide.svgUrl"
            :alt="slide.title"
            class="slide-svg"
            :style="{ cursor: laserPointerActive ? 'none' : 'default' }"
          />
          <!-- 文本模式：显示文字内容（降级） -->
          <template v-else>
            <h2 class="slide-title">{{ slide.title }}</h2>
            <p class="slide-text" if="slide.content">{{ slide.content }}</p>
            <div class="slide-bullets" v-if="slide.bullets && slide.bullets.length">
              <li v-for="(bullet, i) in slide.bullets" :key="i">{{ bullet }}</li>
            </div>
          </template>
          </div>
        </div>
      </div>

      <!-- 演讲者备注面板 -->
      <Transition name="slide-up">
        <div v-if="showPresenterNotes" class="presenter-notes-panel" @click.stop>
          <div class="notes-panel-header">
            <span>📋 演讲者备注</span>
            <button class="notes-close-btn" @click="showPresenterNotes = false">✕</button>
          </div>
          <div class="notes-panel-content">
            <div v-if="currentSlideNotes" class="notes-text">
              {{ currentSlideNotes }}
            </div>
            <div v-else class="notes-empty">
              本页暂无备注
            </div>
          </div>
          <div class="notes-panel-footer">
            <span class="notes-slide-hint">第 {{ currentSlide + 1 }} 页 / {{ totalSlides }} 页</span>
          </div>
        </div>
      </Transition>

      <!-- Q&A / 投票侧边面板 -->
      <Transition name="slide-right">
        <div v-if="showQAPanel" class="qa-panel" @click.stop>
          <div class="qa-panel-header">
            <div class="qa-tabs">
              <button
                :class="['qa-tab', { active: qaActiveTab === 'qa' }]"
                @click="qaActiveTab = 'qa'"
              >
                ❓ 问答
              </button>
              <button
                :class="['qa-tab', { active: qaActiveTab === 'poll' }]"
                @click="qaActiveTab = 'poll'"
              >
                📊 投票
              </button>
            </div>
            <button class="qa-close-btn" @click="showQAPanel = false">✕</button>
          </div>

          <!-- Q&A 模式 -->
          <div v-if="qaActiveTab === 'qa'" class="qa-content">
            <!-- 提问输入 -->
            <div class="qa-input-section">
              <input
                v-model="newQuestion"
                class="qa-input"
                placeholder="输入你的问题..."
                @keyup.enter="submitQuestion"
              />
              <button class="qa-submit-btn" @click="submitQuestion" :disabled="!newQuestion.trim()">
                提问
              </button>
            </div>

            <!-- 问题列表 -->
            <div class="qa-list">
              <TransitionGroup name="qa-item">
                <div
                  v-for="q in sortedQuestions"
                  :key="q.id"
                  class="qa-item"
                  :class="{ 'highlight-vote': q.votes >= 3 }"
                >
                  <div class="qa-item-vote">
                    <button class="vote-btn" @click="upvoteQuestion(q.id)">
                      ▲
                    </button>
                    <span class="vote-count">{{ q.votes }}</span>
                  </div>
                  <div class="qa-item-content">
                    <div class="qa-item-text">{{ q.text }}</div>
                    <div class="qa-item-meta">
                      {{ q.author || '听众' }} · {{ formatTimeAgo(q.timestamp) }}
                    </div>
                  </div>
                </div>
              </TransitionGroup>
              <div v-if="questions.length === 0" class="qa-empty">
                <p>还没有问题</p>
                <p class="qa-empty-hint">点击上方"提问"按钮提出你的问题</p>
              </div>
            </div>
          </div>

          <!-- 投票模式 -->
          <div v-if="qaActiveTab === 'poll'" class="poll-content">
            <!-- 创建投票 -->
            <div class="poll-create-section" v-if="!activePoll">
              <div class="poll-question-input">
                <input
                  v-model="newPollQuestion"
                  class="qa-input"
                  placeholder="投票问题..."
                />
              </div>
              <div class="poll-options-input">
                <div
                  v-for="(opt, idx) in newPollOptions"
                  :key="idx"
                  class="poll-option-row"
                >
                  <input
                    v-model="newPollOptions[idx]"
                    class="qa-input"
                    :placeholder="`选项 ${idx + 1}`"
                  />
                  <button
                    v-if="newPollOptions.length > 2"
                    class="poll-remove-btn"
                    @click="newPollOptions.splice(idx, 1)"
                  >
                    ✕
                  </button>
                </div>
                <button class="poll-add-option-btn" @click="newPollOptions.push('')">
                  + 添加选项
                </button>
              </div>
              <button
                class="qa-submit-btn"
                @click="createPoll"
                :disabled="!newPollQuestion.trim() || newPollOptions.filter(o => o.trim()).length < 2"
              >
                发布投票
              </button>
            </div>

            <!-- 显示投票 -->
            <div class="poll-display-section" v-if="activePoll">
              <div class="poll-question-display">{{ activePoll.question }}</div>
              <div class="poll-options-display">
                <div
                  v-for="(opt, idx) in activePoll.options"
                  :key="idx"
                  class="poll-option-item"
                  :class="{
                    'voted': votedOptionIdx === idx,
                    'show-results': showPollResults
                  }"
                  @click="!votedOptionIdx && votePoll(idx)"
                >
                  <div class="poll-option-bar-bg">
                    <div
                      class="poll-option-bar-fill"
                      :style="{ width: showPollResults ? getPollPercent(opt.votes) + '%' : '0%' }"
                    ></div>
                  </div>
                  <div class="poll-option-label">
                    <span>{{ opt.text }}</span>
                    <span v-if="showPollResults" class="poll-option-percent">
                      {{ getPollPercent(opt.votes) }}%
                    </span>
                  </div>
                  <div v-if="!showPollResults && votedOptionIdx === null" class="poll-option-vote-hint">
                    点击投票
                  </div>
                  <div v-if="votedOptionIdx === idx" class="poll-option-voted-mark">✓</div>
                </div>
              </div>
              <div class="poll-meta">
                <span>{{ activePoll.totalVotes }} 票</span>
                <button
                  v-if="votedOptionIdx !== null && !showPollResults"
                  class="btn btn-sm"
                  @click="showPollResults = true"
                >
                  查看结果
                </button>
                <button
                  v-if="votedOptionIdx !== null"
                  class="btn btn-sm btn-outline"
                  @click="closePoll"
                >
                  结束投票
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- 底部导航 -->
      <div class="presentation-nav" @click.stop>
        <button class="nav-btn" @click="prevSlide" :disabled="currentSlide === 0">
          ◀ 上一页
        </button>
        <div class="nav-dots">
          <button
            v-for="(_, index) in slides"
            :key="index"
            class="dot"
            :class="{ active: index === currentSlide }"
            @click="goToSlide(index)"
          ></button>
        </div>
        <button class="nav-btn" @click="nextSlide" :disabled="currentSlide === slides.length - 1">
          下一页 ▶
        </button>

        <!-- 自动播放控制 -->
        <div class="auto-play-controls">
          <label class="auto-play-label">
            <input type="checkbox" v-model="autoAdvanceEnabled" />
            自动播放
          </label>
          <select v-if="autoAdvanceEnabled" v-model="autoAdvanceDelay" class="auto-delay-select" @change="resetAutoAdvance">
            <option :value="3000">3秒</option>
            <option :value="5000">5秒</option>
            <option :value="8000">8秒</option>
            <option :value="10000">10秒</option>
            <option :value="15000">15秒</option>
          </select>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, reactive } from 'vue'
import { useSwipeGesture } from '../composables/useSwipeGesture'

export interface Slide {
  title: string
  content?: string
  bullets?: string[]
  background?: string
  svgUrl?: string
  transition?: 'slide' | 'fade' | 'zoom' | 'flip'
  presenterNotes?: string  // 演讲者备注
}

export interface QAQuestion {
  id: string
  text: string
  author?: string
  votes: number
  timestamp: number
}

export interface PollOption {
  text: string
  votes: number
}

export interface Poll {
  id: string
  question: string
  options: PollOption[]
  active: boolean
  totalVotes: number
  createdAt: number
}

export interface TransitionSettings {
  type: 'slide' | 'fade' | 'zoom' | 'flip'
  duration: 'fast' | 'normal' | 'slow'
  autoAdvance: boolean
  autoDelay: number
}

const props = defineProps<{
  slides: Slide[]
  active: boolean
  transitionSettings?: TransitionSettings
  initialQuestions?: QAQuestion[]
  initialPolls?: Poll[]
  replayAnimationSignal?: number  // changing number triggers animation replay
}>()

const emit = defineEmits<{
  (e: 'update:active', value: boolean): void
  (e: 'question-submitted', question: QAQuestion): void
  (e: 'poll-created', poll: Poll): void
  (e: 'poll-voted', pollId: string, optionIndex: number): void
  (e: 'poll-closed', pollId: string): void
}>()

const isActive = ref(false)
const currentSlide = ref(0)
const isFullscreen = ref(false)
const slidesRef = ref<HTMLElement | null>(null)

// Touch swipe: navigate slides with swipe gestures
useSwipeGesture({
  element: slidesRef,
  onSwipeLeft: () => nextSlide(),
  onSwipeRight: () => prevSlide(),
  threshold: 60
})

// =====================
// TIMER FEATURE
// =====================
const timerRunning = ref(false)
const elapsedSeconds = ref(0)
const timerDurationMinutes = ref(0)  // 0 = no limit
const showTimerSetup = ref(false)
const timerSetupMinutes = ref(10)
let timerInterval: ReturnType<typeof setInterval> | null = null

const remainingSeconds = computed(() => {
  if (timerDurationMinutes.value === 0) return 0
  return timerDurationMinutes.value * 60 - elapsedSeconds.value
})

const isOvertime = computed(() => remainingSeconds.value < 0)

const formatTime = (seconds: number): string => {
  const abs = Math.abs(seconds)
  const m = Math.floor(abs / 60)
  const s = abs % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

const startTimerWithSetup = () => {
  timerDurationMinutes.value = timerSetupMinutes.value
  showTimerSetup.value = false
  startTimer()
}

const startTimerNoLimit = () => {
  timerDurationMinutes.value = 0
  showTimerSetup.value = false
  startTimer()
}

const startTimer = () => {
  stopTimer()
  timerRunning.value = true
  timerInterval = setInterval(() => {
    elapsedSeconds.value++
  }, 1000)
}

const pauseTimer = () => {
  timerRunning.value = false
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

const resumeTimer = () => {
  startTimer()
}

const resetTimer = () => {
  pauseTimer()
  elapsedSeconds.value = 0
  timerDurationMinutes.value = 0
  showTimerSetup.value = false
}

// =====================
// LASER POINTER FEATURE
// =====================
const laserPointerActive = ref(false)
const isDrawingLaser = ref(false)
const laserPosition = ref({ x: 0, y: 0 })
const laserTrailPoints = ref<Array<{ x: number; y: number }>>([])
let laserTrailTimer: ReturnType<typeof setTimeout> | null = null

const laserDotStyle = computed(() => ({
  left: `${laserPosition.value.x}px`,
  top: `${laserPosition.value.y}px`
}))

const laserTrailStyle = computed(() => {
  if (laserTrailPoints.value.length < 2) return {}
  const points = laserTrailPoints.value
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  return {
    d: pathD
  }
})

const toggleLaserPointer = () => {
  laserPointerActive.value = !laserPointerActive.value
  if (!laserPointerActive.value) {
    isDrawingLaser.value = false
    laserTrailPoints.value = []
  }
}

const handleOverlayClick = (e: MouseEvent) => {
  if (laserPointerActive.value) {
    isDrawingLaser.value = !isDrawingLaser.value
    if (!isDrawingLaser.value) {
      laserTrailPoints.value = []
    }
  }
}

const handleMouseMove = (e: MouseEvent) => {
  if (laserPointerActive.value) {
    laserPosition.value = { x: e.clientX, y: e.clientY }
    if (isDrawingLaser.value) {
      laserTrailPoints.value.push({ x: e.clientX, y: e.clientY })
      if (laserTrailPoints.value.length > 50) {
        laserTrailPoints.value.shift()
      }
    }
  }
}

// =====================
// PRESENTER NOTES FEATURE
// =====================
const showPresenterNotes = ref(false)

const currentSlideNotes = computed(() => {
  return props.slides[currentSlide.value]?.presenterNotes || ''
})

// =====================
// Q&A FEATURE
// =====================
const showQAPanel = ref(false)
const qaActiveTab = ref<'qa' | 'poll'>('qa')
const questions = ref<QAQuestion[]>([])
const newQuestion = ref('')

const sortedQuestions = computed(() => {
  return [...questions.value].sort((a, b) => b.votes - a.votes)
})

const submitQuestion = () => {
  const text = newQuestion.value.trim()
  if (!text) return
  const q: QAQuestion = {
    id: Date.now().toString(),
    text,
    author: '听众',
    votes: 0,
    timestamp: Date.now()
  }
  questions.value.push(q)
  newQuestion.value = ''
  emit('question-submitted', q)
}

const upvoteQuestion = (id: string) => {
  const q = questions.value.find(q => q.id === id)
  if (q) q.votes++
}

const formatTimeAgo = (timestamp: number): string => {
  const diff = Date.now() - timestamp
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  return `${Math.floor(diff / 3600000)}小时前`
}

// =====================
// POLL FEATURE
// =====================
const newPollQuestion = ref('')
const newPollOptions = ref(['', ''])
const activePoll = ref<Poll | null>(null)
const votedOptionIdx = ref<number | null>(null)
const showPollResults = ref(false)

const createPoll = () => {
  const validOptions = newPollOptions.value
    .map(o => o.trim())
    .filter(o => o.length > 0)
  if (!newPollQuestion.value.trim() || validOptions.length < 2) return

  const poll: Poll = {
    id: Date.now().toString(),
    question: newPollQuestion.value.trim(),
    options: validOptions.map(text => ({ text, votes: 0 })),
    active: true,
    totalVotes: 0,
    createdAt: Date.now()
  }
  activePoll.value = poll
  votedOptionIdx.value = null
  showPollResults.value = false
  newPollQuestion.value = ''
  newPollOptions.value = ['', '']
  emit('poll-created', poll)
}

const votePoll = (optionIndex: number) => {
  if (!activePoll.value || votedOptionIdx.value !== null) return
  activePoll.value.options[optionIndex].votes++
  activePoll.value.totalVotes++
  votedOptionIdx.value = optionIndex
  emit('poll-voted', activePoll.value.id, optionIndex)
}

const getPollPercent = (votes: number): number => {
  if (!activePoll.value || activePoll.value.totalVotes === 0) return 0
  return Math.round((votes / activePoll.value.totalVotes) * 100)
}

const closePoll = () => {
  if (activePoll.value) {
    showPollResults.value = true
    emit('poll-closed', activePoll.value.id)
  }
}

const toggleQAPanel = () => {
  showQAPanel.value = !showQAPanel.value
}

// =====================
// TRANSITION SETTINGS
// =====================
const durationOptions = [
  { label: '快', value: 'fast' as const },
  { label: '中', value: 'normal' as const },
  { label: '慢', value: 'slow' as const }
]

const durationMap = {
  fast: 0.3,
  normal: 0.5,
  slow: 0.8
}

const selectedTransition = ref<'slide' | 'fade' | 'zoom' | 'flip'>('slide')
const selectedDuration = ref<'fast' | 'normal' | 'slow'>('normal')
const autoAdvanceEnabled = ref(false)
const autoAdvanceDelay = ref(5000)
const autoAdvanceCountdown = ref(0)

let autoAdvanceTimer: ReturnType<typeof setInterval> | null = null
let countdownTimer: ReturnType<typeof setInterval> | null = null

// Watch for prop changes
watch(() => props.active, (val) => {
  isActive.value = val
  if (val) {
    document.body.style.overflow = 'hidden'
    resetAutoAdvance()
  } else {
    document.body.style.overflow = ''
    stopAutoAdvance()
    pauseTimer()
  }
}, { immediate: true })

// Watch for transition settings prop changes
watch(() => props.transitionSettings, (settings) => {
  if (settings) {
    selectedTransition.value = settings.type
    selectedDuration.value = settings.duration
    autoAdvanceEnabled.value = settings.autoAdvance
    autoAdvanceDelay.value = settings.autoDelay
  }
}, { immediate: true })

// Watch for initial questions
watch(() => props.initialQuestions, (qs) => {
  if (qs && qs.length > 0) {
    questions.value = [...qs]
  }
}, { immediate: true })

// Watch for replay animation signal
watch(() => props.replayAnimationSignal, (signal) => {
  if (signal && signal > 0) {
    replayCurrentSlideAnimation()
  }
})

// Replay animation for current slide
const isReplayingAnimation = ref(false)
const replayAnimationClass = ref('')

const replayCurrentSlideAnimation = () => {
  if (!isActive.value) return
  isReplayingAnimation.value = false
  // Force reflow to restart animation
  nextTick(() => {
    isReplayingAnimation.value = true
    replayAnimationClass.value = `replay-${Date.now()}`
    setTimeout(() => {
      isReplayingAnimation.value = false
    }, 1500)
  })
}

const totalSlides = computed(() => props.slides.length)

// Current transition duration in seconds
const currentDuration = computed(() => durationMap[selectedDuration.value])

// Get per-slide or global transition
const getSlideTransition = (index: number): string => {
  return props.slides[index]?.transition || selectedTransition.value
}

// Get slide CSS class based on current slide and transition type
const getSlideClass = (index: number) => {
  const transition = getSlideTransition(index)
  const classes: string[] = []

  if (index === currentSlide.value) {
    classes.push('active')
  } else if (index < currentSlide.value) {
    classes.push('prev')
  } else {
    classes.push('next')
  }

  classes.push(`transition-${transition}`)

  return classes
}

// Get slide inline style
const getSlideStyle = (index: number) => {
  const transition = getSlideTransition(index)
  const dur = currentDuration.value

  const baseStyle: Record<string, string> = {
    transition: `all ${dur}s cubic-bezier(0.4, 0, 0.2, 1)`,
    background: props.slides[index]?.background || 'linear-gradient(135deg, #667eea, #764ba2)'
  }

  if (transition === 'fade') {
    baseStyle.opacity = index === currentSlide.value ? '1' : '0'
    baseStyle.transform = 'none'
  } else if (transition === 'zoom') {
    if (index === currentSlide.value) {
      baseStyle.opacity = '1'
      baseStyle.transform = 'scale(1)'
    } else {
      baseStyle.opacity = '0'
      baseStyle.transform = 'scale(0.8)'
    }
  } else if (transition === 'flip') {
    if (index === currentSlide.value) {
      baseStyle.opacity = '1'
      baseStyle.transform = 'rotateY(0deg)'
    } else if (index < currentSlide.value) {
      baseStyle.opacity = '0'
      baseStyle.transform = 'rotateY(-90deg)'
    } else {
      baseStyle.opacity = '0'
      baseStyle.transform = 'rotateY(90deg)'
    }
  } else {
    baseStyle.opacity = index === currentSlide.value ? '1' : '0'
  }

  return baseStyle
}

const nextSlide = () => {
  if (currentSlide.value < props.slides.length - 1) {
    currentSlide.value++
    resetAutoAdvance()
  } else if (autoAdvanceEnabled.value) {
    stopAutoAdvance()
  }
}

const prevSlide = () => {
  if (currentSlide.value > 0) {
    currentSlide.value--
    resetAutoAdvance()
  }
}

const goToSlide = (index: number) => {
  currentSlide.value = index
  resetAutoAdvance()
}

const exitPresentation = () => {
  isActive.value = false
  emit('update:active', false)
  document.body.style.overflow = ''
  stopAutoAdvance()
  pauseTimer()
  if (document.fullscreenElement) {
    document.exitFullscreen()
    isFullscreen.value = false
  }
}

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
    isFullscreen.value = true
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
}

// Auto-advance logic
const startAutoAdvance = () => {
  stopAutoAdvance()
  if (!autoAdvanceEnabled.value) return

  autoAdvanceCountdown.value = Math.ceil(autoAdvanceDelay.value / 1000)

  countdownTimer = setInterval(() => {
    autoAdvanceCountdown.value--
    if (autoAdvanceCountdown.value <= 0) {
      autoAdvanceCountdown.value = Math.ceil(autoAdvanceDelay.value / 1000)
      nextSlide()
    }
  }, 1000)
}

const stopAutoAdvance = () => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
  if (autoAdvanceTimer) {
    clearInterval(autoAdvanceTimer)
    autoAdvanceTimer = null
  }
  autoAdvanceCountdown.value = 0
}

const stopTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

const resetAutoAdvance = () => {
  if (autoAdvanceEnabled.value && isActive.value) {
    startAutoAdvance()
  }
}

// Watch auto-advance toggle
watch(autoAdvanceEnabled, (enabled) => {
  if (enabled) {
    startAutoAdvance()
  } else {
    stopAutoAdvance()
  }
})

const handleKeydown = (e: KeyboardEvent) => {
  if (!isActive.value) return

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
      currentSlide.value = 0
      break
    case 'End':
      e.preventDefault()
      currentSlide.value = props.slides.length - 1
      break
    case 'Escape':
      e.preventDefault()
      exitPresentation()
      break
    case 'f':
    case 'F':
      e.preventDefault()
      toggleFullscreen()
      break
    case 'l':
    case 'L':
      e.preventDefault()
      toggleLaserPointer()
      break
    case 'n':
    case 'N':
      e.preventDefault()
      showPresenterNotes.value = !showPresenterNotes.value
      break
    case 'q':
    case 'Q':
      e.preventDefault()
      toggleQAPanel()
      break
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement
  })
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
  stopAutoAdvance()
  stopTimer()
})
</script>

<style scoped>
.presentation-overlay {
  position: fixed;
  inset: 0;
  background: #000;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* =====================
   TOOLBAR
   ===================== */
.presentation-toolbar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.7);
  z-index: 10;
  flex-wrap: wrap;
}

.slide-counter {
  color: #fff;
  font-size: 14px;
  margin-right: auto;
  min-width: 60px;
}

/* Timer */
.timer-display {
  display: flex;
  align-items: center;
  gap: 6px;
  position: relative;
}

.timer-elapsed,
.timer-remaining {
  color: #fff;
  font-size: 14px;
  font-variant-numeric: tabular-nums;
  background: rgba(255, 255, 255, 0.1);
  padding: 4px 10px;
  border-radius: 12px;
  font-family: monospace;
}

.timer-elapsed.overtime {
  color: #ff6b6b;
  background: rgba(255, 107, 107, 0.15);
}

.timer-remaining.warning {
  color: #ffd93d;
  background: rgba(255, 217, 61, 0.15);
}

.timer-btn {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: #fff;
  padding: 5px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.2s;
}

.timer-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.timer-setup-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: rgba(30, 30, 40, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 12px;
  min-width: 200px;
  z-index: 100;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.timer-setup-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.timer-setup-row:last-child {
  margin-bottom: 0;
}

.timer-setup-row label {
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
  white-space: nowrap;
}

.timer-input-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.timer-input-group span {
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
}

.timer-input {
  width: 60px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 13px;
  text-align: center;
}

/* Transition selectors */
.transition-selector {
  display: flex;
  align-items: center;
  gap: 6px;
}

.transition-select {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #fff;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
}

.transition-select option {
  background: #333;
  color: #fff;
}

.duration-selector {
  display: flex;
  gap: 4px;
}

.duration-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.7);
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.duration-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.duration-btn.active {
  background: rgba(22, 93, 255, 0.8);
  border-color: #165DFF;
  color: #fff;
}

.auto-advance {
  display: flex;
  align-items: center;
}

.auto-advance-label {
  color: #4ade80;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  background: rgba(74, 222, 128, 0.15);
  padding: 4px 10px;
  border-radius: 12px;
}

.toolbar-btn {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: #fff;
  padding: 7px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 15px;
  transition: background 0.2s;
}

.toolbar-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.toolbar-btn.active {
  background: rgba(22, 93, 255, 0.8);
  border: 1px solid #165DFF;
}

.laser-btn.active {
  background: rgba(255, 50, 50, 0.8);
  border: 1px solid #ff3232;
  box-shadow: 0 0 8px rgba(255, 50, 50, 0.5);
}

.notes-btn.active,
.qa-btn.active {
  background: rgba(22, 93, 255, 0.8);
  border: 1px solid #165DFF;
}

/* =====================
   LASER POINTER
   ===================== */
.presentation-overlay.laser-active {
  cursor: none;
}

.laser-dot {
  position: fixed;
  width: 16px;
  height: 16px;
  background: radial-gradient(circle, #ff0000 0%, #ff4444 40%, transparent 70%);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 10000;
  box-shadow: 0 0 10px 4px rgba(255, 0, 0, 0.6), 0 0 20px 8px rgba(255, 0, 0, 0.3);
  animation: laserPulse 0.5s ease-in-out infinite alternate;
}

@keyframes laserPulse {
  from { transform: translate(-50%, -50%) scale(1); }
  to { transform: translate(-50%, -50%) scale(1.2); }
}

.laser-trail {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9998;
}

.laser-trail path {
  fill: none;
  stroke: rgba(255, 0, 0, 0.4);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* =====================
   SLIDES
   ===================== */
.slides-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  perspective: 1200px;
}

/* Base slide styles */
.slide {
  position: absolute;
  width: 80%;
  max-width: 900px;
  aspect-ratio: 16/9;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  pointer-events: none;
  transform-style: preserve-3d;
  backface-visibility: hidden;
}

/* Slide content */
.slide-content {
  text-align: center;
  padding: 40px;
  color: #fff;
  max-width: 80%;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* SVG 幻灯片：填充整个 slide 区域 */
.slide-svg {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 4px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.slide-title {
  font-size: 42px;
  font-weight: 700;
  margin-bottom: 24px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.slide-text {
  font-size: 20px;
  opacity: 0.9;
  line-height: 1.6;
}

.slide-bullets {
  text-align: left;
  font-size: 18px;
  margin-top: 20px;
  padding-left: 20px;
}

.slide-bullets li {
  margin-bottom: 12px;
  line-height: 1.5;
}

/* TRANSITION: SLIDE */
.transition-slide.slide.active {
  opacity: 1;
  transform: translateX(0) scale(1);
  z-index: 5;
}
.transition-slide.slide.prev {
  opacity: 0;
  transform: translateX(-100px) scale(0.9);
}
.transition-slide.slide.next {
  opacity: 0;
  transform: translateX(100px) scale(0.9);
}

/* TRANSITION: FADE */
.transition-fade.slide.active {
  opacity: 1;
  transform: scale(1);
  z-index: 5;
}
.transition-fade.slide.prev,
.transition-fade.slide.next {
  opacity: 0;
  transform: scale(1);
}

/* TRANSITION: ZOOM */
.transition-zoom.slide.active {
  opacity: 1;
  transform: scale(1);
  z-index: 5;
}
.transition-zoom.slide.prev,
.transition-zoom.slide.next {
  opacity: 0;
  transform: scale(0.8);
}

/* TRANSITION: FLIP */
.transition-flip.slide.active {
  opacity: 1;
  transform: rotateY(0deg);
  z-index: 5;
}
.transition-flip.slide.prev {
  opacity: 0;
  transform: rotateY(-90deg);
}
.transition-flip.slide.next {
  opacity: 0;
  transform: rotateY(90deg);
}

/* =====================
   PRESENTER NOTES PANEL
   ===================== */
.presenter-notes-panel {
  position: absolute;
  bottom: 70px;
  left: 20px;
  right: 20px;
  max-width: 600px;
  background: rgba(20, 20, 30, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  overflow: hidden;
  z-index: 20;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.notes-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
  font-weight: 500;
}

.notes-close-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  font-size: 14px;
  padding: 2px 6px;
}

.notes-close-btn:hover {
  color: #fff;
}

.notes-panel-content {
  padding: 14px;
  max-height: 160px;
  overflow-y: auto;
}

.notes-text {
  color: rgba(255, 255, 255, 0.85);
  font-size: 14px;
  line-height: 1.7;
  white-space: pre-wrap;
}

.notes-empty {
  color: rgba(255, 255, 255, 0.4);
  font-size: 13px;
  text-align: center;
  padding: 20px;
}

.notes-panel-footer {
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.03);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.notes-slide-hint {
  color: rgba(255, 255, 255, 0.4);
  font-size: 11px;
}

/* Slide-up transition */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* =====================
   Q&A PANEL
   ===================== */
.qa-panel {
  position: absolute;
  top: 60px;
  right: 0;
  bottom: 70px;
  width: 320px;
  background: rgba(18, 18, 28, 0.97);
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  z-index: 30;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.4);
}

.qa-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.qa-tabs {
  display: flex;
  gap: 4px;
}

.qa-tab {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.qa-tab:hover {
  color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.05);
}

.qa-tab.active {
  color: #fff;
  background: rgba(22, 93, 255, 0.6);
}

.qa-close-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  font-size: 14px;
  padding: 4px 8px;
}

/* Q&A Content */
.qa-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.qa-input-section {
  display: flex;
  gap: 8px;
  padding: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.qa-input {
  flex: 1;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #fff;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 13px;
}

.qa-input::placeholder {
  color: rgba(255, 255, 255, 0.35);
}

.qa-input:focus {
  outline: none;
  border-color: rgba(22, 93, 255, 0.6);
}

.qa-submit-btn {
  background: #165DFF;
  border: none;
  color: #fff;
  padding: 8px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  white-space: nowrap;
  transition: background 0.2s;
}

.qa-submit-btn:hover:not(:disabled) {
  background: #0d47e1;
}

.qa-submit-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.qa-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.qa-item {
  display: flex;
  gap: 10px;
  padding: 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  margin-bottom: 8px;
  transition: all 0.2s;
}

.qa-item.highlight-vote {
  background: rgba(22, 93, 255, 0.12);
  border: 1px solid rgba(22, 93, 255, 0.2);
}

.qa-item-vote {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 30px;
}

.vote-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  font-size: 12px;
  padding: 2px;
  transition: color 0.2s;
}

.vote-btn:hover {
  color: #4ade80;
}

.vote-count {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  font-weight: 600;
}

.qa-item-content {
  flex: 1;
  min-width: 0;
}

.qa-item-text {
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
  line-height: 1.5;
  word-break: break-word;
}

.qa-item-meta {
  color: rgba(255, 255, 255, 0.35);
  font-size: 11px;
  margin-top: 4px;
}

.qa-empty {
  text-align: center;
  padding: 40px 20px;
  color: rgba(255, 255, 255, 0.35);
  font-size: 13px;
}

.qa-empty-hint {
  font-size: 12px;
  margin-top: 6px;
}

/* Poll Content */
.poll-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.poll-create-section {
  padding: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.poll-question-input {
  margin-bottom: 10px;
}

.poll-options-input {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
}

.poll-option-row {
  display: flex;
  gap: 6px;
  align-items: center;
}

.poll-remove-btn {
  background: rgba(255, 80, 80, 0.3);
  border: none;
  color: rgba(255, 255, 255, 0.7);
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.poll-add-option-btn {
  background: none;
  border: 1px dashed rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.5);
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  width: 100%;
  transition: all 0.2s;
}

.poll-add-option-btn:hover {
  border-color: rgba(22, 93, 255, 0.5);
  color: rgba(255, 255, 255, 0.8);
}

.poll-display-section {
  padding: 12px;
  flex: 1;
  overflow-y: auto;
}

.poll-question-display {
  color: rgba(255, 255, 255, 0.95);
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 16px;
  line-height: 1.4;
}

.poll-options-display {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.poll-option-item {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 10px 12px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.2s;
}

.poll-option-item:hover:not(.show-results) {
  background: rgba(22, 93, 255, 0.15);
  border-color: rgba(22, 93, 255, 0.4);
}

.poll-option-item.voted {
  border-color: rgba(22, 93, 255, 0.5);
}

.poll-option-bar-bg {
  position: absolute;
  inset: 0;
  background: rgba(22, 93, 255, 0.1);
}

.poll-option-bar-fill {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  background: rgba(22, 93, 255, 0.3);
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.poll-option-label {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
}

.poll-option-percent {
  color: rgba(22, 93, 255, 1);
  font-weight: 600;
}

.poll-option-vote-hint {
  position: relative;
  color: rgba(255, 255, 255, 0.3);
  font-size: 11px;
  margin-top: 2px;
}

.poll-option-voted-mark {
  position: absolute;
  top: 8px;
  right: 10px;
  color: #4ade80;
  font-size: 14px;
  font-weight: bold;
}

.poll-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
}

/* Slide-right transition */
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-right-enter-from,
.slide-right-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

/* QA item transition */
.qa-item-enter-active {
  transition: all 0.3s ease;
}
.qa-item-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

/* =====================
   NAVIGATION
   ===================== */
.presentation-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 16px 20px;
  background: rgba(0, 0, 0, 0.7);
  flex-wrap: wrap;
}

.nav-btn {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: #fff;
  padding: 10px 22px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.nav-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
}

.nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.nav-dots {
  display: flex;
  gap: 8px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.dot:hover {
  background: rgba(255, 255, 255, 0.5);
}

.dot.active {
  background: #fff;
  transform: scale(1.2);
}

/* Auto-play controls */
.auto-play-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: 16px;
  padding-left: 16px;
  border-left: 1px solid rgba(255, 255, 255, 0.2);
}

.auto-play-label {
  color: rgba(255, 255, 255, 0.85);
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}

.auto-play-label input {
  cursor: pointer;
}

.auto-delay-select {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.auto-delay-select option {
  background: #333;
  color: #fff;
}

/* =====================
   MOBILE RESPONSIVE
   ===================== */
@media (max-width: 768px) {
  .slide {
    width: 90%;
  }

  .slide-title {
    font-size: 28px;
  }

  .slide-text {
    font-size: 16px;
  }

  .nav-btn {
    padding: 8px 16px;
    font-size: 12px;
  }

  .presentation-toolbar {
    gap: 8px;
    padding: 8px 12px;
  }

  .auto-play-controls {
    margin-left: 0;
    padding-left: 0;
    border-left: none;
    width: 100%;
    justify-content: center;
  }

  .qa-panel {
    width: 100%;
    top: auto;
    bottom: 70px;
    left: 0;
    right: 0;
    border-left: none;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .presenter-notes-panel {
    left: 10px;
    right: 10px;
  }
}

/* Mobile: Full-screen presentation overlay */
@media (pointer: coarse), (max-width: 767px) {
  .presentation-swipe-hint {
    display: block;
    position: absolute;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
    background: rgba(0, 0, 0, 0.3);
    padding: 6px 14px;
    border-radius: 20px;
    z-index: 20;
    pointer-events: none;
    animation: fadeIn 0.5s ease 1s both;
  }
}

@media (max-width: 767px) {
  .presentation-overlay {
    flex-direction: column;
  }

  .presentation-toolbar {
    padding: 10px 12px;
    flex-wrap: wrap;
    gap: 6px;
  }

  .slide-counter {
    font-size: 14px;
  }

  .transition-selector .transition-select {
    font-size: 12px;
    padding: 4px 8px;
  }

  .duration-selector {
    gap: 4px;
  }

  .duration-btn {
    padding: 4px 10px;
    font-size: 12px;
  }

  .slides-container {
    flex: 1;
    min-height: 0;
  }

  .slide-content {
    padding: 16px;
  }

  .slide-title {
    font-size: 24px;
    margin-bottom: 12px;
  }

  .slide-text {
    font-size: 15px;
  }

  .presentation-nav {
    padding: 10px 12px;
    gap: 8px;
  }

  .nav-btn {
    padding: 8px 12px;
    font-size: 12px;
  }

  .nav-dots {
    gap: 4px;
  }

  .dot {
    width: 8px;
    height: 8px;
  }

  .auto-play-controls {
    flex-wrap: wrap;
    justify-content: center;
    padding: 0;
    border: none;
    margin: 0;
  }

  .timer-elapsed,
  .timer-remaining {
    font-size: 12px;
    padding: 3px 7px;
  }
}

/* Tablet presentation */
@media (min-width: 768px) and (max-width: 1024px) {
  .slides-container {
    padding: 20px;
  }

  .slide-content {
    padding: 24px;
  }

  .qa-panel {
    width: 280px;
  }
}
</style>
