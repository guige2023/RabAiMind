<template>
  <div
    ref="containerRef"
    class="virtual-slide-list"
    @scroll="onScroll"
  >
    <!-- Spacer to maintain scroll height -->
    <div :style="{ height: totalHeight + 'px', position: 'relative' }">
      <div
        :style="{
          position: 'absolute',
          top: offsetY + 'px',
          left: 0,
          right: 0,
        }"
      >
        <div
          v-for="item in visibleItems"
          :key="item.index"
          class="slide-thumbnail"
          :class="{ active: activeIndex === item.index }"
          @click="$emit('select', item.index)"
        >
          <div class="thumb-num">{{ item.index + 1 }}</div>
          <div class="thumb-preview" :style="getSlideStyle(item.data)">
            <div
              v-for="(el, elIdx) in item.data.elements"
              :key="elIdx"
              class="thumb-element"
              :style="getThumbElementStyle(el)"
            >
              {{ el.type === 'text' ? 'T' : (el.type === 'image' ? '🖼' : '■') }}
            </div>
            <div
              v-if="item.data.transition"
              class="thumb-transition-badge"
              :class="'badge-' + item.data.transition"
              :title="'过渡: ' + item.data.transition"
            >
              {{ getTransitionIcon(item.data.transition) }}
            </div>
          </div>
          <div class="thumb-actions">
            <button @click.stop="$emit('duplicate', item.index)" title="复制">📋</button>
            <button @click.stop="$emit('delete', item.index)" title="删除">🗑</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

interface SlideElement {
  id: string
  type: 'text' | 'image' | 'shape'
  x: number
  y: number
  width: number
  height: number
  content?: string
  color?: string
  fill?: string
  src?: string
}

interface Slide {
  background: string
  layout: string
  elements: SlideElement[]
  transition?: 'slide' | 'fade' | 'zoom' | 'flip'
}

const props = defineProps<{
  slides: Slide[]
  activeIndex: number
  itemHeight?: number   // height of each thumbnail item in px
  overscan?: number      // number of items to render outside visible area
}>()

const emit = defineEmits<{
  select: [index: number]
  duplicate: [index: number]
  delete: [index: number]
}>()

const ITEM_HEIGHT = props.itemHeight ?? 120  // px per thumbnail
const OVERSCAN = props.overscan ?? 3         // render 3 extra items above/below

const containerRef = ref<HTMLElement | null>(null)
const scrollTop = ref(0)
const containerHeight = ref(600)

const totalHeight = computed(() => props.slides.length * ITEM_HEIGHT)

const visibleRange = computed(() => {
  const start = Math.max(0, Math.floor(scrollTop.value / ITEM_HEIGHT) - OVERSCAN)
  const visibleCount = Math.ceil(containerHeight.value / ITEM_HEIGHT)
  const end = Math.min(props.slides.length, start + visibleCount + OVERSCAN * 2)
  return { start, end }
})

const visibleItems = computed(() => {
  const items: { index: number; data: Slide }[] = []
  for (let i = visibleRange.value.start; i < visibleRange.value.end; i++) {
    items.push({ index: i, data: props.slides[i] })
  }
  return items
})

const offsetY = computed(() => visibleRange.value.start * ITEM_HEIGHT)

const onScroll = () => {
  if (containerRef.value) {
    scrollTop.value = containerRef.value.scrollTop
  }
}

const getSlideStyle = (slide: Slide) => {
  return { background: slide.background || '#fff' }
}

const getThumbElementStyle = (el: SlideElement) => {
  return {
    left: (el.x / 960 * 100) + '%',
    top: (el.y / 540 * 100) + '%',
    width: (el.width / 960 * 100) + '%',
    height: (el.height / 540 * 100) + '%',
    color: el.color || '#333'
  }
}

const getTransitionIcon = (transition: string) => {
  const icons: Record<string, string> = {
    slide: '→', fade: '◐', zoom: '⊕', flip: '↺'
  }
  return icons[transition] || '→'
}

// ResizeObserver for container height
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  if (containerRef.value) {
    containerHeight.value = containerRef.value.clientHeight
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        containerHeight.value = entry.contentRect.height
      }
    })
    resizeObserver.observe(containerRef.value)
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})
</script>

<style scoped>
.virtual-slide-list {
  overflow-y: auto;
  overflow-x: hidden;
  height: 100%;
}

.slide-thumbnail {
  height: 112px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: transform 0.15s;
}

.slide-thumbnail:hover {
  transform: scale(1.02);
}

.slide-thumbnail.active {
  border-color: var(--color-primary, #3b82f6);
}
</style>
