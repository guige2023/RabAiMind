<template>
  <Teleport to="body">
    <div v-if="isActive" class="presentation-overlay" @click="exitPresentation">
      <!-- 顶部工具栏 -->
      <div class="presentation-toolbar" @click.stop>
        <span class="slide-counter">{{ currentSlide + 1 }} / {{ totalSlides }}</span>

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

        <button class="toolbar-btn" @click="toggleFullscreen" title="全屏 (F)">
          {{ isFullscreen ? '⛶' : '⛶' }}
        </button>
        <button class="toolbar-btn" @click="exitPresentation" title="退出 (ESC)">
          ✕
        </button>
      </div>

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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useSwipeGesture } from '../composables/useSwipeGesture'

export interface Slide {
  title: string
  content?: string
  bullets?: string[]
  background?: string
  svgUrl?: string  // 真实 SVG URL
  transition?: 'slide' | 'fade' | 'zoom' | 'flip'  // per-slide transition override
}

export interface TransitionSettings {
  type: 'slide' | 'fade' | 'zoom' | 'flip'
  duration: 'fast' | 'normal' | 'slow'
  autoAdvance: boolean
  autoDelay: number  // ms
}

const props = defineProps<{
  slides: Slide[]
  active: boolean
  transitionSettings?: TransitionSettings
}>()

const emit = defineEmits<{
  (e: 'update:active', value: boolean): void
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

// Transition settings
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
    // Fade uses opacity only
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
    // Slide: default behavior from CSS
    baseStyle.opacity = index === currentSlide.value ? '1' : '0'
  }

  return baseStyle
}

const nextSlide = () => {
  if (currentSlide.value < props.slides.length - 1) {
    currentSlide.value++
    resetAutoAdvance()
  } else if (autoAdvanceEnabled.value) {
    // At last slide, stop auto-advance
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
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
  stopAutoAdvance()
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

/* Toolbar */
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

/* Slides Container */
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

/* ====================
   TRANSITION: SLIDE (default)
   ==================== */
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

/* ====================
   TRANSITION: FADE
   ==================== */
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

/* ====================
   TRANSITION: ZOOM
   ==================== */
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

/* ====================
   TRANSITION: FLIP
   ==================== */
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

/* Navigation */
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

/* Mobile */
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
}

/* Presentation Mode - Mobile Swipe */
.presentation-swipe-hint {
  display: none;
}

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

/* Mobile: Full-screen presentation overlay */
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
}

/* Tablet presentation */
@media (min-width: 768px) and (max-width: 1024px) {
  .slides-container {
    padding: 20px;
  }

  .slide-content {
    padding: 24px;
  }
}
</style>
