<template>
  <Teleport to="body">
    <div v-if="isActive" class="presentation-overlay" @click="exitPresentation">
      <!-- 顶部工具栏 -->
      <div class="presentation-toolbar" @click.stop>
        <span class="slide-counter">{{ currentSlide + 1 }} / {{ totalSlides }}</span>
        <button class="toolbar-btn" @click="toggleFullscreen" title="全屏">
          {{ isFullscreen ? '⛶' : '⛶' }}
        </button>
        <button class="toolbar-btn" @click="exitPresentation" title="退出 (ESC)">
          ✕
        </button>
      </div>

      <!-- 幻灯片内容 -->
      <div class="slides-container" ref="slidesRef">
        <div
          v-for="(slide, index) in slides"
          :key="index"
          class="slide"
          :class="{ active: index === currentSlide, prev: index < currentSlide, next: index > currentSlide }"
          :style="{ background: slide.background || 'linear-gradient(135deg, #667eea, #764ba2)' }"
        >
          <div class="slide-content">
            <h2 class="slide-title">{{ slide.title }}</h2>
            <p class="slide-text" v-if="slide.content">{{ slide.content }}</p>
            <div class="slide-bullets" v-if="slide.bullets && slide.bullets.length">
              <li v-for="(bullet, i) in slide.bullets" :key="i">{{ bullet }}</li>
            </div>
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
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'

interface Slide {
  title: string
  content?: string
  bullets?: string[]
  background?: string
}

const props = defineProps<{
  slides: Slide[]
  active: boolean
}>()

const emit = defineEmits<{
  (e: 'update:active', value: boolean): void
}>()

const isActive = ref(false)
const currentSlide = ref(0)
const isFullscreen = ref(false)
const slidesRef = ref<HTMLElement | null>(null)

// Watch for prop changes
watch(() => props.active, (val) => {
  isActive.value = val
  if (val) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

const totalSlides = computed(() => props.slides.length)

const nextSlide = () => {
  if (currentSlide.value < props.slides.length - 1) {
    currentSlide.value++
  }
}

const prevSlide = () => {
  if (currentSlide.value > 0) {
    currentSlide.value--
  }
}

const goToSlide = (index: number) => {
  currentSlide.value = index
}

const exitPresentation = () => {
  isActive.value = false
  emit('update:active', false)
  document.body.style.overflow = ''
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
  gap: 16px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.5);
  z-index: 10;
}

.slide-counter {
  color: #fff;
  font-size: 14px;
  margin-right: auto;
}

.toolbar-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: #fff;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
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
  perspective: 1000px;
}

.slide {
  position: absolute;
  width: 80%;
  max-width: 900px;
  aspect-ratio: 16/9;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  opacity: 0;
  transform: translateX(100px) scale(0.9);
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
}

.slide.active {
  opacity: 1;
  transform: translateX(0) scale(1);
  z-index: 5;
}

.slide.prev {
  opacity: 0;
  transform: translateX(-100px) scale(0.9);
}

.slide.next {
  opacity: 0;
  transform: translateX(100px) scale(0.9);
}

.slide-content {
  text-align: center;
  padding: 40px;
  color: #fff;
  max-width: 80%;
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

/* Navigation */
.presentation-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 20px;
  background: rgba(0, 0, 0, 0.5);
}

.nav-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: #fff;
  padding: 12px 24px;
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
}
</style>
