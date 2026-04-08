<template>
  <div class="ppt-preview-section" ref="slidesContainerRef">
    <!-- Swipe hint (mobile only) -->
    <div class="swipe-hint" v-if="isMobile && previewSlides.length > 1">
      <span>👆 左右滑动查看更多</span>
    </div>
    <h3 class="preview-title">PPT 预览</h3>
    <div class="preview-loading" v-if="!previewLoaded">
      <div class="loading-spinner"></div>
      <p>加载预览中...</p>
    </div>
    <div v-else-if="previewLoadFailed" class="preview-load-failed">
      <p>预览加载失败</p>
      <button class="btn btn-sm" @click="$emit('retry')">🔄 重试</button>
    </div>
    <!-- R149: Lazy loading preview grid with IntersectionObserver -->
    <div class="preview-grid" v-else ref="previewGridRef">
      <template v-if="previewSlides.length > 0">
        <div
          v-for="(slide, index) in previewSlides.slice(0, 6)"
          :key="slide.slideNum"
          class="preview-slide"
          :ref="el => setupPreviewLazy(el as HTMLElement, slide.slideNum)"
          :class="{ 'slide-visible': visiblePreviewSlides.has(slide.slideNum), 'slide-loading': visiblePreviewSlides.has(slide.slideNum) && !loadedPreviews.has(slide.slideNum) }"
        >
          <div class="slide-number-badge">{{ slide.slideNum }}</div>
          <!-- R149: Lazy loaded image - only loads when in viewport -->
          <img
            v-if="visiblePreviewSlides.has(slide.slideNum)"
            :src="getCachedPreviewUrl(slide)"
            :alt="`第 ${slide.slideNum} 页`"
            class="preview-image"
            :class="{ 'image-loaded': loadedPreviews.has(slide.slideNum) }"
            @load="$emit('previewLoaded', slide.slideNum)"
            @error="$emit('previewError', $event, slide.slideNum)"
          />
          <!-- Placeholder while not in viewport or loading -->
          <div v-else class="preview-image-placeholder">
            <div class="preview-skeleton"></div>
          </div>
          <!-- Loading spinner overlay -->
          <div v-if="visiblePreviewSlides.has(slide.slideNum) && !loadedPreviews.has(slide.slideNum) && !previewErrors.has(slide.slideNum)" class="preview-loading-overlay">
            <div class="loading-spinner small"></div>
          </div>
          <!-- BUG修复: 图片加载失败时显示占位符 -->
          <div v-if="previewErrors.has(slide.slideNum)" class="preview-error">
            <span>加载失败</span>
          </div>
          <div class="slide-actions">
            <button
              class="btn btn-sm btn-regenerate"
              @click="$emit('regenerateSingleSlide', index)"
              :disabled="regeneratingSlideIndex === index"
              :aria-label="`重生成第${slide.slideNum}页`"
            >
              {{ regeneratingSlideIndex === index ? '重生成中...' : '🔄 重生成' }}
            </button>
          </div>
        </div>
      </template>
      <div v-else class="preview-empty">
        <p>暂无预览数据</p>
      </div>
      <div v-if="slideCount > 6" class="preview-more">
        +{{ slideCount - 6 }} 页
      </div>
      <!-- R149: Performance metrics badge -->
      <div class="preview-perf-badge" v-if="perfMetrics.renderTime > 0">
        ⚡ {{ perfMetrics.renderTime.toFixed(1) }}ms
      </div>
    </div>
    <p class="preview-tip">点击"下载PPT"查看完整内容</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'

interface PreviewSlide {
  url: string
  slideNum: number
}

interface PerfMetrics {
  renderTime: number
}

interface Props {
  previewSlides: PreviewSlide[]
  visiblePreviewSlides: Set<number>
  loadedPreviews: Set<number>
  previewErrors: Set<number>
  previewLoaded: boolean
  previewLoadFailed: boolean
  regeneratingSlideIndex: number | null
  slideCount: number
  isMobile: boolean
  perfMetrics: PerfMetrics
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'regenerateSingleSlide', index: number): void
  (e: 'previewLoaded', slideNum: number): void
  (e: 'previewError', event: Event, slideNum: number): void
  (e: 'retry'): void
  (e: 'visibleSlidesChange', slideNum: number): void
}>()

const slidesContainerRef = ref<HTMLElement | null>(null)
const previewGridRef = ref<HTMLElement | null>(null)
let previewObserver: IntersectionObserver | null = null

function getCachedPreviewUrl(slide: PreviewSlide): string {
  return slide.url
}

function setupPreviewLazy(el: HTMLElement | null, slideNum: number) {
  if (el && previewObserver) {
    previewObserver.observe(el)
  }
}

function initIntersectionObserver() {
  if (typeof IntersectionObserver === 'undefined') return

  previewObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const slideNum = parseInt((entry.target as HTMLElement).dataset.slideNum || '0')
          if (slideNum) {
            emit('visibleSlidesChange', slideNum)
          }
        }
      })
    },
    { rootMargin: '100px', threshold: 0.1 }
  )
}

onMounted(() => {
  initIntersectionObserver()
})

onUnmounted(() => {
  if (previewObserver) {
    previewObserver.disconnect()
    previewObserver = null
  }
})
</script>

<style scoped>
.ppt-preview-section {
  margin: 20px 0;
}

.swipe-hint {
  text-align: center;
  color: #666;
  font-size: 14px;
  margin-bottom: 10px;
}

.preview-title {
  font-size: 18px;
  margin-bottom: 15px;
  color: #333;
}

.preview-loading {
  text-align: center;
  padding: 40px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

.loading-spinner.small {
  width: 20px;
  height: 20px;
  border-width: 2px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.preview-load-failed {
  text-align: center;
  padding: 40px;
  color: #e74c3c;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.preview-slide {
  position: relative;
  background: #f8f9fa;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.preview-slide:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.slide-number-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  z-index: 1;
}

.preview-image {
  width: 100%;
  height: auto;
  display: block;
  opacity: 0;
  transition: opacity 0.3s;
}

.preview-image.image-loaded {
  opacity: 1;
}

.preview-image-placeholder {
  width: 100%;
  aspect-ratio: 16/9;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e9ecef;
}

.preview-skeleton {
  width: 80%;
  height: 60%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.preview-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-error {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(231, 76, 60, 0.9);
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
}

.slide-actions {
  position: absolute;
  bottom: 8px;
  right: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.preview-slide:hover .slide-actions {
  opacity: 1;
}

.btn-regenerate {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
}

.btn-regenerate:hover {
  background: #fff;
}

.preview-empty {
  text-align: center;
  padding: 40px;
  color: #999;
}

.preview-more {
  text-align: center;
  padding: 10px;
  color: #666;
  font-size: 14px;
}

.preview-perf-badge {
  position: absolute;
  bottom: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
}

.preview-tip {
  text-align: center;
  color: #999;
  font-size: 12px;
  margin-top: 15px;
}
</style>
