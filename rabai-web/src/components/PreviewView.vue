<template>
  <div class="preview-view">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <button class="back-btn" @click="$emit('back')">← 返回</button>
        <h2>PPT预览编辑</h2>
      </div>
      <div class="toolbar-center">
        <span class="slide-count">共 {{ slides.length }} 页</span>
      </div>
      <div class="toolbar-right">
        <button
          class="toolbar-btn"
          :class="{ 'btn-active': isPerformanceMode }"
          @click="togglePerformanceMode"
          :title="isPerformanceMode ? '关闭性能模式' : '开启性能模式（禁用动画，提升大PPT性能）'"
        >
          ⚡ {{ isPerformanceMode ? '性能模式' : '极速' }}
        </button>
        <button class="toolbar-btn" @click="undo" :disabled="!canUndo">↩ 撤销</button>
        <button class="toolbar-btn" @click="redo" :disabled="!canRedo">↪ 重做</button>
        <button class="toolbar-btn" @click="savePPT">💾 保存</button>
        <button class="toolbar-btn primary" @click="exportPPT">📤 导出</button>
      </div>
    </div>

    <div class="main-content">
      <!-- 左侧缩略图列表 -->
      <div class="slides-sidebar">
        <div class="sidebar-header">
          <h3>页面列表</h3>
          <button class="add-slide-btn" @click="addSlide">+ 添加</button>
        </div>
        <div class="slides-list" ref="thumbnailsListRef">
          <!-- Virtualized list for large PPTs (100+ slides) or performance mode -->
          <template v-if="shouldUseVirtualList">
            <div
              v-for="(slide, index) in slides"
              :key="index"
              class="slide-thumbnail"
              :class="{ active: activeSlideIndex === index }"
              @click="selectSlide(index)"
            >
              <div class="thumb-num">{{ index + 1 }}</div>
              <div class="thumb-preview" :style="getSlideStyle(slide)">
                <div
                  v-for="(el, elIdx) in slide.elements"
                  :key="elIdx"
                  class="thumb-element"
                  :style="getThumbElementStyle(el)"
                >
                  {{ el.type === 'text' ? 'T' : (el.type === 'image' ? '🖼' : '■') }}
                </div>
                <div
                  class="thumb-transition-badge"
                  :class="'badge-' + (slide.transition || 'slide')"
                  :title="'过渡: ' + (slide.transition || 'slide')"
                >
                  {{ getTransitionIcon(slide.transition || 'slide') }}
                </div>
              </div>
              <div class="thumb-actions">
                <button @click.stop="duplicateSlide(index)" title="复制">📋</button>
                <button @click.stop="deleteSlide(index)" title="删除">🗑</button>
              </div>
            </div>
          </template>
          <!-- Lazy-loaded list for normal PPTs -->
          <template v-else>
            <div
              v-for="(slide, index) in slides"
              :key="index"
              class="slide-thumbnail"
              :class="{ active: activeSlideIndex === index }"
              :data-slide-index="index"
              @click="selectSlide(index)"
            >
              <div class="thumb-num">{{ index + 1 }}</div>
              <div class="thumb-preview" :style="getSlideStyle(slide)">
                <div
                  v-for="(el, elIdx) in slide.elements"
                  :key="elIdx"
                  class="thumb-element"
                  :style="getThumbElementStyle(el)"
                >
                  {{ el.type === 'text' ? 'T' : (el.type === 'image' ? '🖼' : '■') }}
                </div>
                <div
                  class="thumb-transition-badge"
                  :class="'badge-' + (slide.transition || 'slide')"
                  :title="'过渡: ' + (slide.transition || 'slide')"
                >
                  {{ getTransitionIcon(slide.transition || 'slide') }}
                </div>
              </div>
              <div class="thumb-actions">
                <button @click.stop="duplicateSlide(index)" title="复制">📋</button>
                <button @click.stop="deleteSlide(index)" title="删除">🗑</button>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- 中间编辑画布 -->
      <div class="edit-area">
        <div
          class="canvas-slide"
          :style="currentSlideStyle"
          @click="deselectElement"
        >
          <!-- 元素渲染 -->
          <div
            v-for="(el, index) in currentSlide.elements"
            :key="index"
            class="canvas-element"
            :class="{
              selected: selectedElementIndex === index,
              dragging: isDragging
            }"
            :style="getCanvasElementStyle(el, index)"
            @click.stop="selectElement(index)"
            @mousedown="startDrag($event, index)"
          >
            <!-- 文本元素 -->
            <template v-if="el.type === 'text'">
              <div
                class="element-content text-content"
                contenteditable="true"
                :style="getTextStyle(el)"
                @blur="updateTextContent(index, $event)"
                @click.stop
              >
                {{ el.content }}
              </div>
              <!-- 半透明遮罩 -->
              <div
                v-if="el.overlay"
                class="text-overlay"
                :style="{ backgroundColor: el.overlay, opacity: (el.overlayOpacity ?? 50) / 100 }"
              ></div>
              <!-- 文字阴影 -->
              <div
                v-if="el.textShadow"
                class="text-shadow"
                :style="{ textShadow: getTextShadowStyle(el) }"
              ></div>
            </template>

            <!-- 图片元素 -->
            <template v-else-if="el.type === 'image'">
              <img
                v-if="el.src"
                :src="el.src"
                class="element-content image-content"
                alt=""
                @error="handleImageError(index)"
              />
              <div v-else class="image-placeholder" @click.stop="openImagePicker(index)">
                点击添加图片
              </div>
              <input
                v-if="selectedElementIndex === index"
                type="file"
                accept="image/*"
                class="image-input"
                @change="handleImageUpload($event, index)"
              />
            </template>

            <!-- 形状元素 -->
            <template v-else-if="el.type === 'shape'">
              <div
                class="element-content shape-content"
                :style="{
                  backgroundColor: el.fill,
                  borderRadius: el.radius || '0'
                }"
              ></div>
            </template>

            <!-- 选中标记和调整手柄 -->
            <div v-if="selectedElementIndex === index" class="resize-handles">
              <div class="handle handle-nw" @mousedown.stop="startResize($event, 'nw')"></div>
              <div class="handle handle-ne" @mousedown.stop="startResize($event, 'ne')"></div>
              <div class="handle handle-sw" @mousedown.stop="startResize($event, 'sw')"></div>
              <div class="handle handle-se" @mousedown.stop="startResize($event, 'se')"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧属性面板 -->
      <div class="properties-panel">
        <!-- 页面设置 -->
        <div class="panel-section">
          <h4>页面设置</h4>
          <div class="prop-group">
            <label>背景</label>
            <div class="bg-options">
              <div
                v-for="bg in backgroundPresets"
                :key="bg"
                class="bg-option"
                :style="{ background: bg }"
                :class="{ active: currentSlide.background === bg }"
                @click="setSlideBackground(bg)"
              ></div>
            </div>
            <input
              type="color"
              :value="getBgColor(currentSlide.background)"
              @input="(e) => setSlideBackground((e.target as HTMLInputElement).value)"
              class="color-input"
            />
          </div>
          <div class="prop-group">
            <label>布局</label>
            <select
              :value="currentSlide.layout"
              @change="setSlideLayout(($event.target as HTMLSelectElement).value)"
              class="prop-select"
            >
              <option v-for="layout in layoutTypes" :key="layout.id" :value="layout.id">
                {{ layout.name }}
              </option>
            </select>
          </div>
        </div>

        <!-- 过渡效果设置 -->
        <div class="panel-section">
          <h4>🔀 过渡效果</h4>
          <div class="prop-group">
            <label>效果类型</label>
            <div class="transition-btns">
              <button
                v-for="t in transitionTypes"
                :key="t.value"
                class="transition-btn"
                :class="{ active: currentSlide.transition === t.value }"
                @click="setSlideTransition(t.value)"
                :title="t.name"
              >
                <span class="t-icon">{{ t.icon }}</span>
                <span class="t-label">{{ t.name }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 元素属性 -->
        <div v-if="selectedElement" class="panel-section">
          <h4>元素属性</h4>

          <!-- 位置 -->
          <div class="prop-group">
            <label>位置</label>
            <div class="prop-row">
              <div class="prop-input">
                <span>X</span>
                <input
                  type="number"
                  :value="Math.round(selectedElement.x)"
                  @input="updateElementProp('x', Number(($event.target as HTMLInputElement).value))"
                />
              </div>
              <div class="prop-input">
                <span>Y</span>
                <input
                  type="number"
                  :value="Math.round(selectedElement.y)"
                  @input="updateElementProp('y', Number(($event.target as HTMLInputElement).value))"
                />
              </div>
            </div>
          </div>

          <!-- 尺寸 -->
          <div class="prop-group">
            <label>尺寸</label>
            <div class="prop-row">
              <div class="prop-input">
                <span>宽</span>
                <input
                  type="number"
                  :value="Math.round(selectedElement.width)"
                  @input="updateElementProp('width', Number(($event.target as HTMLInputElement).value))"
                />
              </div>
              <div class="prop-input">
                <span>高</span>
                <input
                  type="number"
                  :value="Math.round(selectedElement.height)"
                  @input="updateElementProp('height', Number(($event.target as HTMLInputElement).value))"
                />
              </div>
            </div>
          </div>

          <!-- 文本内容 -->
          <div v-if="selectedElement.type === 'text'" class="prop-group">
            <label>文本内容</label>
            <textarea
              class="prop-textarea"
              :value="selectedElement.content"
              @input="updateElementProp('content', ($event.target as HTMLTextAreaElement).value)"
              rows="3"
            ></textarea>
          </div>

          <!-- 字体设置 -->
          <div v-if="selectedElement.type === 'text'" class="prop-group">
            <label>字体设置</label>
            <div class="prop-row">
              <select
                class="prop-select"
                :value="selectedElement.fontFamily || '思源黑体'"
                @change="updateElementProp('fontFamily', ($event.target as HTMLSelectElement).value)"
              >
                <option value="思源黑体">思源黑体</option>
                <option value="思源宋体">思源宋体</option>
                <option value="系统默认">系统默认</option>
              </select>
              <select
                class="prop-select"
                :value="selectedElement.fontSize || 18"
                @change="updateElementProp('fontSize', Number(($event.target as HTMLSelectElement).value))"
              >
                <option v-for="s in [12,14,16,18,20,24,28,32,36,40,48,56]" :key="s" :value="s">{{s}}px</option>
              </select>
            </div>
          </div>

          <!-- 文字颜色 -->
          <div v-if="selectedElement.type === 'text'" class="prop-group">
            <label>文字颜色</label>
            <div class="color-picker">
              <input
                type="color"
                :value="selectedElement.color || '#000000'"
                @input="updateElementProp('color', ($event.target as HTMLInputElement).value)"
                class="color-input"
              />
              <input
                type="text"
                :value="selectedElement.color || '#000000'"
                @input="updateElementProp('color', ($event.target as HTMLInputElement).value)"
                class="color-text"
              />
            </div>
          </div>

          <!-- 半透明遮罩 -->
          <div v-if="selectedElement.type === 'text'" class="prop-group">
            <label>遮罩透明度</label>
            <input
              type="range"
              min="0"
              max="80"
              :value="selectedElement.overlayOpacity || 0"
              @input="updateElementProp('overlayOpacity', Number(($event.target as HTMLInputElement).value))"
              class="range-input"
            />
            <span class="range-value">{{ selectedElement.overlayOpacity || 0 }}%</span>
          </div>

          <!-- 文字阴影 -->
          <div v-if="selectedElement.type === 'text'" class="prop-group">
            <label>文字阴影</label>
            <div class="shadow-presets">
              <button
                v-for="shadow in shadowPresets"
                :key="shadow.name"
                class="shadow-btn"
                :class="{ active: selectedElement.textShadow === shadow.value }"
                :style="{ textShadow: shadow.preview }"
                @click="updateElementProp('textShadow', shadow.value)"
              >
                T
              </button>
            </div>
          </div>

          <!-- 形状填充色 -->
          <div v-if="selectedElement.type === 'shape'" class="prop-group">
            <label>填充颜色</label>
            <div class="color-picker">
              <input
                type="color"
                :value="selectedElement.fill || '#165DFF'"
                @input="updateElementProp('fill', ($event.target as HTMLInputElement).value)"
                class="color-input"
              />
            </div>
          </div>

          <!-- 删除元素 -->
          <div class="prop-group">
            <button class="btn-delete" @click="deleteElement">🗑 删除元素</button>
          </div>
        </div>

        <!-- 添加元素 -->
        <div class="panel-section">
          <h4>添加元素</h4>
          <div class="add-buttons">
            <button @click="addElement('text')">📝 文本</button>
            <button @click="addElement('image')">🖼️ 图片</button>
            <button @click="addElement('shape')">■ 形状</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { usePerformanceMode, applyPerformanceModeCSS } from '@/composables/usePerformanceMode'

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
  radius?: string
  fontSize?: number
  fontFamily?: string
  fontWeight?: string
  textAlign?: string
  src?: string
  overlay?: string
  overlayOpacity?: number
  textShadow?: string
}

interface Slide {
  background: string
  layout: string
  elements: SlideElement[]
  transition?: 'slide' | 'fade' | 'zoom' | 'flip'
}

const emit = defineEmits(['back', 'save', 'export'])

const props = defineProps<{
  template?: any
}>()

// 幻灯片数据
const slides = ref<Slide[]>([])
const activeSlideIndex = ref(0)

// Performance mode
const { isPerformanceMode, togglePerformanceMode } = usePerformanceMode()
const VIRTUAL_LIST_THRESHOLD = 100  // use virtualized list when slides >= 100
const shouldUseVirtualList = computed(() =>
  slides.value.length >= VIRTUAL_LIST_THRESHOLD || isPerformanceMode.value
)

// Lazy loading for thumbnails (IntersectionObserver)
const thumbnailsListRef = ref<HTMLElement | null>(null)
const visibleThumbnails = ref<Set<number>>(new Set())
let thumbnailObserver: IntersectionObserver | null = null

const setupLazyLoading = () => {
  if (!thumbnailsListRef.value || shouldUseVirtualList.value) return
  if (thumbnailObserver) thumbnailObserver.disconnect()

  // Show first 10 slides initially (above the fold)
  for (let i = 0; i < Math.min(10, slides.value.length); i++) {
    visibleThumbnails.value.add(i)
  }

  thumbnailObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const index = parseInt(entry.target.getAttribute('data-slide-index') || '0', 10)
        if (entry.isIntersecting) {
          visibleThumbnails.value.add(index)
        }
      })
    },
    {
      root: thumbnailsListRef.value,
      rootMargin: '100px',  // preload 100px ahead
      threshold: 0
    }
  )

  // Observe all slide thumbnail elements
  nextTick(() => {
    const items = thumbnailsListRef.value?.querySelectorAll('.slide-thumbnail[data-slide-index]')
    items?.forEach((el) => {
      thumbnailObserver?.observe(el)
    })
  })
}

const isThumbnailVisible = (index: number) => {
  // In performance mode, always show (no lazy loading)
  if (isPerformanceMode.value) return true
  // Virtual list handles its own rendering
  if (shouldUseVirtualList.value) return true
  // Default: all visible (IntersectionObserver handles lazy loading)
  return true
}
const selectedElementIndex = ref<number | null>(null)

// 拖拽状态
const isDragging = ref(false)
const isResizing = ref(false)
const dragStart = ref({ x: 0, y: 0, elementX: 0, elementY: 0 })
const resizeStart = ref({ x: 0, y: 0, width: 0, height: 0, elX: 0, elY: 0 })
const resizeHandle = ref('')

// 撤销/重做
const history = ref<Slide[][]>([])
const historyIndex = ref(-1)
const maxHistory = 50

// 布局类型
const layoutTypes = [
  { id: 'title_slide', name: '标题页' },
  { id: 'left_text_right_image', name: '左文右图' },
  { id: 'left_image_right_text', name: '左图右文' },
  { id: 'center', name: '居中' },
  { id: 'card', name: '卡片' },
  { id: 'two_column', name: '双栏' },
  { id: 'three_column', name: '三栏' },
  { id: 'timeline', name: '时间线' },
  { id: 'center_radiation', name: '居中辐射' },
  { id: 'content_card', name: '内容卡片' }
]

// 背景预设
const backgroundPresets = [
  '#ffffff',
  '#1a1a1a',
  '#f5f5f5',
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
  'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%)'
]

// 阴影预设
const transitionTypes = [
  { value: 'slide', name: '滑动', icon: '→' },
  { value: 'fade', name: '淡入', icon: '◐' },
  { value: 'zoom', name: '缩放', icon: '⊕' },
  { value: 'flip', name: '翻转', icon: '↺' }
]

const shadowPresets = [
  { name: '无', value: '', preview: 'none' },
  { name: '轻微', value: '0 1px 2px rgba(0,0,0,0.1)', preview: '0 1px 2px rgba(0,0,0,0.1)' },
  { name: '中等', value: '0 2px 4px rgba(0,0,0,0.15)', preview: '0 2px 4px rgba(0,0,0,0.15)' },
  { name: '强烈', value: '0 4px 8px rgba(0,0,0,0.2)', preview: '0 4px 8px rgba(0,0,0,0.2)' },
  { name: '发光', value: '0 0 10px rgba(22,93,255,0.5)', preview: '0 0 10px rgba(22,93,255,0.5)' },
  { name: '霓虹', value: '0 0 20px rgba(255,0,255,0.6)', preview: '0 0 20px rgba(255,0,255,0.6)' }
]

// 计算属性
const currentSlide = computed(() => slides.value[activeSlideIndex.value] || { background: '#fff', layout: 'left_text_right_image', elements: [] })

const currentSlideStyle = computed(() => ({
  background: currentSlide.value.background || '#fff'
}))

const selectedElement = computed(() => {
  if (selectedElementIndex.value === null) return null
  return currentSlide.value.elements[selectedElementIndex.value]
})

const canUndo = computed(() => historyIndex.value > 0)
const canRedo = computed(() => historyIndex.value < history.value.length - 1)

// 方法
const initSlides = () => {
  if (props.template) {
    // 使用模板初始化
    slides.value = Array.from({ length: 5 }, (_, i) => ({
      background: props.template.background || '#ffffff',
      layout: props.template.layout || 'left_text_right_image',
      elements: generateElementsForLayout(props.template.layout || 'left_text_right_image', i)
    }))
  } else {
    // 默认数据
    slides.value = Array.from({ length: 5 }, (_, i) => ({
      background: i % 2 === 0 ? '#ffffff' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      layout: 'left_text_right_image',
      elements: generateDefaultElements(i)
    }))
  }
  saveHistory()
}

const generateDefaultElements = (pageIndex: number): SlideElement[] => {
  if (pageIndex === 0) {
    return [
      { id: '1', type: 'text', x: 80, y: 60, width: 600, height: 60, content: 'PPT标题', fontSize: 42, fontWeight: 'bold', color: '#333333', fontFamily: '思源黑体' },
      { id: '2', type: 'text', x: 80, y: 140, width: 600, height: 40, content: '副标题', fontSize: 24, color: '#666666', fontFamily: '思源黑体' }
    ]
  }
  return [
    { id: '1', type: 'text', x: 50, y: 30, width: 500, height: 50, content: `第${pageIndex + 1}页标题`, fontSize: 32, fontWeight: 'bold', color: '#333333', fontFamily: '思源黑体' },
    { id: '2', type: 'text', x: 50, y: 90, width: 500, height: 200, content: '• 要点1\n• 要点2\n• 要点3\n• 要点4', fontSize: 18, color: '#555555', fontFamily: '思源宋体' },
    { id: '3', type: 'shape', x: 50, y: 310, width: 100, height: 8, fill: '#165DFF', radius: '4px' }
  ]
}

const generateElementsForLayout = (layout: string, pageIndex: number): SlideElement[] => {
  const layouts: Record<string, SlideElement[]> = {
    title_slide: [
      { id: '1', type: 'text', x: 80, y: 80, width: 600, height: 80, content: '演示文稿', fontSize: 56, fontWeight: 'bold', color: '#ffffff', fontFamily: '思源黑体', textShadow: '0 2px 4px rgba(0,0,0,0.3)' },
      { id: '2', type: 'text', x: 80, y: 180, width: 600, height: 40, content: '副标题', fontSize: 28, color: 'rgba(255,255,255,0.9)', fontFamily: '思源黑体' }
    ],
    left_text_right_image: [
      { id: '1', type: 'text', x: 40, y: 40, width: 450, height: 50, content: '标题内容', fontSize: 32, fontWeight: 'bold', color: '#333333', fontFamily: '思源黑体' },
      { id: '2', type: 'text', x: 40, y: 100, width: 450, height: 200, content: '正文内容', fontSize: 18, color: '#555555', fontFamily: '思源宋体' },
      { id: '3', type: 'image', x: 520, y: 40, width: 280, height: 350, src: '' }
    ],
    center: [
      { id: '1', type: 'text', x: 200, y: 100, width: 560, height: 60, content: '居中标题', fontSize: 42, fontWeight: 'bold', color: '#333333', fontFamily: '思源黑体', textAlign: 'center' },
      { id: '2', type: 'text', x: 200, y: 180, width: 560, height: 150, content: '居中正文内容', fontSize: 20, color: '#555555', fontFamily: '思源宋体', textAlign: 'center' }
    ]
  }
  return layouts[layout] || generateDefaultElements(pageIndex)
}

const saveHistory = () => {
  if (historyIndex.value < history.value.length - 1) {
    history.value = history.value.slice(0, historyIndex.value + 1)
  }
  history.value.push(JSON.parse(JSON.stringify(slides.value)))
  if (history.value.length > maxHistory) {
    history.value.shift()
  } else {
    historyIndex.value++
  }
}

const undo = () => {
  if (canUndo.value) {
    historyIndex.value--
    slides.value = JSON.parse(JSON.stringify(history.value[historyIndex.value]))
    selectedElementIndex.value = null
  }
}

const redo = () => {
  if (canRedo.value) {
    historyIndex.value++
    slides.value = JSON.parse(JSON.stringify(history.value[historyIndex.value]))
    selectedElementIndex.value = null
  }
}

const selectSlide = (index: number) => {
  activeSlideIndex.value = index
  selectedElementIndex.value = null
}

const selectElement = (index: number) => {
  selectedElementIndex.value = index
}

const deselectElement = () => {
  selectedElementIndex.value = null
}

const getSlideStyle = (slide: Slide) => ({
  background: slide.background || '#fff'
})

const getThumbElementStyle = (el: SlideElement) => ({
  left: (el.x / 800 * 100) + '%',
  top: (el.y / 450 * 100) + '%',
  width: Math.max(4, el.width / 800 * 100) + '%',
  height: Math.max(4, el.height / 450 * 100) + '%',
  fontSize: '6px'
})

const getCanvasElementStyle = (el: SlideElement, index: number) => {
  const isSelected = selectedElementIndex.value === index
  return {
    left: el.x + 'px',
    top: el.y + 'px',
    width: el.width + 'px',
    height: el.height + 'px',
    fontSize: (el.fontSize || 18) + 'px',
    fontWeight: el.fontWeight || 'normal',
    color: el.color || '#000',
    backgroundColor: el.fill || 'transparent',
    borderRadius: el.radius || '0',
    border: isSelected ? '2px solid #165DFF' : 'none',
    zIndex: isSelected ? 100 : 1,
    textAlign: (el.textAlign || 'left') as 'left' | 'center' | 'right'
  }
}

const getTextStyle = (el: SlideElement) => {
  const style: any = {
    fontFamily: el.fontFamily || '思源黑体',
    fontSize: (el.fontSize || 18) + 'px',
    fontWeight: el.fontWeight || 'normal',
    color: el.color || '#000',
    textAlign: el.textAlign || 'left',
    position: 'relative',
    zIndex: 2
  }
  if (el.textShadow) {
    style.textShadow = el.textShadow
  }
  return style
}

const getTextShadowStyle = (el: SlideElement) => {
  return el.textShadow || 'none'
}

const updateTextContent = (index: number, event: Event) => {
  const target = event.target as HTMLElement
  slides.value[activeSlideIndex.value].elements[index].content = target.innerText
  saveHistory()
}

const updateElementProp = (prop: string, value: any) => {
  if (selectedElementIndex.value === null) return
  (slides.value[activeSlideIndex.value].elements[selectedElementIndex.value] as any)[prop] = value
  saveHistory()
}

const setSlideBackground = (bg: string) => {
  slides.value[activeSlideIndex.value].background = bg
  saveHistory()
}

const setSlideLayout = (layout: string) => {
  slides.value[activeSlideIndex.value].layout = layout
  // 根据布局重新生成元素
  slides.value[activeSlideIndex.value].elements = generateElementsForLayout(layout, activeSlideIndex.value)
  saveHistory()
}

const setSlideTransition = (transition: string) => {
  slides.value[activeSlideIndex.value].transition = transition as any
  saveHistory()
}

const getBgColor = (bg: string) => {
  if (bg.startsWith('#')) return bg
  return '#ffffff'
}

const getTransitionIcon = (transition: string) => {
  const icons: Record<string, string> = {
    slide: '→',
    fade: '◐',
    zoom: '⊕',
    flip: '↺'
  }
  return icons[transition] || '→'
}

const deleteElement = () => {
  if (selectedElementIndex.value === null) return
  slides.value[activeSlideIndex.value].elements.splice(selectedElementIndex.value, 1)
  selectedElementIndex.value = null
  saveHistory()
}

const addElement = (type: 'text' | 'image' | 'shape') => {
  const newElement: SlideElement = {
    id: Date.now().toString(),
    type,
    x: 100,
    y: 100,
    width: type === 'text' ? 400 : 150,
    height: type === 'text' ? 50 : 150,
    content: type === 'text' ? '新文本' : undefined,
    color: '#000000',
    fill: type === 'shape' ? '#165DFF' : undefined,
    fontSize: 18,
    fontFamily: '思源黑体'
  }
  slides.value[activeSlideIndex.value].elements.push(newElement)
  selectedElementIndex.value = slides.value[activeSlideIndex.value].elements.length - 1
  saveHistory()
}

const addSlide = () => {
  slides.value.push({
    background: slides.value[0]?.background || '#ffffff',
    layout: 'left_text_right_image',
    elements: generateDefaultElements(slides.value.length)
  })
  activeSlideIndex.value = slides.value.length - 1
  saveHistory()
}

const duplicateSlide = (index: number) => {
  const newSlide = JSON.parse(JSON.stringify(slides.value[index]))
  newSlide.elements.forEach((el: SlideElement) => {
    el.id = Date.now().toString() + Math.random()
  })
  slides.value.splice(index + 1, 0, newSlide)
  activeSlideIndex.value = index + 1
  saveHistory()
}

const deleteSlide = (index: number) => {
  if (slides.value.length <= 1) return
  slides.value.splice(index, 1)
  if (activeSlideIndex.value >= slides.value.length) {
    activeSlideIndex.value = slides.value.length - 1
  }
  saveHistory()
}

const openImagePicker = (index: number) => {
  selectedElementIndex.value = index
}

const handleImageUpload = (event: Event, index: number) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      slides.value[activeSlideIndex.value].elements[index].src = e.target?.result as string
      saveHistory()
    }
    reader.readAsDataURL(file)
  }
}

const handleImageError = (index: number) => {
  slides.value[activeSlideIndex.value].elements[index].src = ''
}

// 拖拽处理
const startDrag = (event: MouseEvent, index: number) => {
  if (selectedElementIndex.value !== index) return
  isDragging.value = true
  const el = slides.value[activeSlideIndex.value].elements[index]
  dragStart.value = {
    x: event.clientX,
    y: event.clientY,
    elementX: el.x,
    elementY: el.y
  }
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}

const onDrag = (event: MouseEvent) => {
  if (!isDragging.value || selectedElementIndex.value === null) return
  const dx = event.clientX - dragStart.value.x
  const dy = event.clientY - dragStart.value.y
  const el = slides.value[activeSlideIndex.value].elements[selectedElementIndex.value]
  el.x = Math.max(0, Math.min(800 - el.width, dragStart.value.elementX + dx))
  el.y = Math.max(0, Math.min(450 - el.height, dragStart.value.elementY + dy))
}

const stopDrag = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  saveHistory()
}

// 调整大小
const startResize = (event: MouseEvent, handle: string) => {
  if (selectedElementIndex.value === null) return
  isResizing.value = true
  resizeHandle.value = handle
  const el = slides.value[activeSlideIndex.value].elements[selectedElementIndex.value]
  resizeStart.value = {
    x: event.clientX,
    y: event.clientY,
    width: el.width,
    height: el.height,
    elX: el.x,
    elY: el.y
  }
  document.addEventListener('mousemove', onResize)
  document.addEventListener('mouseup', stopResize)
}

const onResize = (event: MouseEvent) => {
  if (!isResizing.value || selectedElementIndex.value === null) return
  const dx = event.clientX - resizeStart.value.x
  const dy = event.clientY - resizeStart.value.y
  const el = slides.value[activeSlideIndex.value].elements[selectedElementIndex.value]
  const handle = resizeHandle.value

  if (handle.includes('e')) el.width = Math.max(30, resizeStart.value.width + dx)
  if (handle.includes('w')) {
    el.width = Math.max(30, resizeStart.value.width - dx)
    el.x = resizeStart.value.elX + dx
  }
  if (handle.includes('s')) el.height = Math.max(20, resizeStart.value.height + dy)
  if (handle.includes('n')) {
    el.height = Math.max(20, resizeStart.value.height - dy)
    el.y = resizeStart.value.elY + dy
  }
}

const stopResize = () => {
  isResizing.value = false
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', stopResize)
  saveHistory()
}

// 保存和导出
const savePPT = () => {
  localStorage.setItem('ppt_edited_slides', JSON.stringify(slides.value))
  emit('save', slides.value)
  alert('已保存!')
}

const exportPPT = () => {
  emit('export', slides.value)
}

// 键盘快捷键
const handleKeydown = (e: KeyboardEvent) => {
  if ((e.target as HTMLElement).tagName === 'INPUT' ||
      (e.target as HTMLElement).tagName === 'TEXTAREA' ||
      (e.target as HTMLElement).isContentEditable) {
    return
  }

  if (selectedElementIndex.value !== null) {
    const step = e.shiftKey ? 10 : 1
    const el = slides.value[activeSlideIndex.value].elements[selectedElementIndex.value]

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault()
        el.x = Math.max(0, el.x - step)
        break
      case 'ArrowRight':
        e.preventDefault()
        el.x = Math.min(800 - el.width, el.x + step)
        break
      case 'ArrowUp':
        e.preventDefault()
        el.y = Math.max(0, el.y - step)
        break
      case 'ArrowDown':
        e.preventDefault()
        el.y = Math.min(450 - el.height, el.y + step)
        break
      case 'Delete':
      case 'Backspace':
        e.preventDefault()
        deleteElement()
        break
    }
  }

  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
    e.preventDefault()
    undo()
  }

  if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
    e.preventDefault()
    redo()
  }

  if (e.key === 'Escape') {
    selectedElementIndex.value = null
  }
}

onMounted(() => {
  initSlides()
  window.addEventListener('keydown', handleKeydown)
  // Setup lazy loading for thumbnails
  nextTick(() => {
    setupLazyLoading()
  })
})

// Re-setup lazy loading when slides change
watch(() => slides.value.length, () => {
  nextTick(() => setupLazyLoading())
})

onUnmounted(() => {
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', stopResize)
  window.removeEventListener('keydown', handleKeydown)
  thumbnailObserver?.disconnect()
})
</script>

<style scoped>
.preview-view {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.toolbar {
  padding: 12px 24px;
  background: white;
  border-bottom: 1px solid #e5e5e5;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.toolbar-left, .toolbar-center, .toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-btn {
  padding: 8px 16px;
  background: #f5f5f5;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.back-btn:hover {
  background: #e5e5e5;
}

.toolbar h2 {
  margin: 0;
  font-size: 18px;
}

.slide-count {
  color: #666;
  font-size: 14px;
}

.toolbar-btn {
  padding: 8px 16px;
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.toolbar-btn:hover:not(:disabled) {
  background: #f5f5f5;
}

.toolbar-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toolbar-btn.primary {
  background: #165DFF;
  color: white;
  border-color: #165DFF;
}

.toolbar-btn.primary:hover {
  background: #0e42d2;
}

.toolbar-btn.btn-active {
  background: #fff3cd;
  border-color: #ffc107;
  color: #856404;
}

.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* 左侧缩略图 */
.slides-sidebar {
  width: 180px;
  background: #fafafa;
  border-right: 1px solid #e5e5e5;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #e5e5e5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 14px;
}

.add-slide-btn {
  padding: 4px 12px;
  background: #165DFF;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.slides-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.slide-thumbnail {
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid transparent;
  margin-bottom: 12px;
  position: relative;
  transition: all 0.2s;
}

.slide-thumbnail:hover {
  border-color: #ccc;
}

.slide-thumbnail.active {
  border-color: #165DFF;
}

.thumb-num {
  background: #e5e5e5;
  padding: 4px;
  text-align: center;
  font-size: 12px;
  font-weight: 600;
}

.thumb-preview {
  height: 80px;
  position: relative;
  overflow: hidden;
}

.thumb-element {
  position: absolute;
  background: rgba(22, 93, 255, 0.3);
  border: 1px solid #165DFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 6px;
}

/* 过渡效果缩略图标识 */
.thumb-transition-badge {
  position: absolute;
  bottom: 3px;
  right: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.thumb-transition-badge.badge-fade { background: rgba(100, 100, 100, 0.8); }
.thumb-transition-badge.badge-zoom { background: rgba(22, 93, 255, 0.8); }
.thumb-transition-badge.badge-flip { background: rgba(118, 75, 162, 0.8); }
.thumb-transition-badge.badge-slide { background: rgba(22, 160, 100, 0.8); }

.thumb-actions {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: #f5f5f5;
}

.thumb-actions button {
  flex: 1;
  padding: 4px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

/* 编辑区域 */
.edit-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30px;
  background: #e5e5e5;
  overflow: auto;
}

.canvas-slide {
  width: 800px;
  height: 450px;
  background: white;
  position: relative;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.canvas-element {
  position: absolute;
  cursor: move;
  user-select: none;
}

.canvas-element.selected {
  outline: none;
}

.element-content {
  width: 100%;
  height: 100%;
}

.text-content {
  padding: 8px;
  white-space: pre-wrap;
  word-break: break-word;
  overflow: hidden;
}

.image-content {
  object-fit: cover;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
  color: #999;
  font-size: 14px;
  cursor: pointer;
}

.image-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.text-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  pointer-events: none;
}

.text-shadow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 0;
}

.resize-handles {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.handle {
  position: absolute;
  width: 10px;
  height: 10px;
  background: #165DFF;
  border: 2px solid white;
  border-radius: 2px;
  pointer-events: auto;
}

.handle-nw { top: -5px; left: -5px; cursor: nw-resize; }
.handle-ne { top: -5px; right: -5px; cursor: ne-resize; }
.handle-sw { bottom: -5px; left: -5px; cursor: sw-resize; }
.handle-se { bottom: -5px; right: -5px; cursor: se-resize; }

/* 右侧属性面板 */
.properties-panel {
  width: 300px;
  background: white;
  border-left: 1px solid #e5e5e5;
  overflow-y: auto;
}

.panel-section {
  padding: 16px;
  border-bottom: 1px solid #e5e5e5;
}

.panel-section h4 {
  margin: 0 0 16px;
  font-size: 14px;
  font-weight: 600;
}

.prop-group {
  margin-bottom: 16px;
}

.prop-group label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 6px;
}

.prop-row {
  display: flex;
  gap: 8px;
}

.prop-input {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 4px;
}

.prop-input span {
  font-size: 12px;
  color: #999;
}

.prop-input input {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  font-size: 13px;
  width: 50px;
}

.prop-select {
  width: 100%;
  padding: 8px;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  font-size: 13px;
  background: white;
}

.prop-textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  font-size: 13px;
  resize: vertical;
  font-family: inherit;
}

.color-picker {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-input {
  width: 40px;
  height: 32px;
  padding: 0;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  cursor: pointer;
}

.color-text {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  font-size: 13px;
  font-family: monospace;
}

.range-input {
  flex: 1;
}

.range-value {
  font-size: 12px;
  color: #666;
  margin-left: 8px;
}

.bg-options {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.bg-option {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  cursor: pointer;
  border: 2px solid transparent;
}

.bg-option.active {
  border-color: #165DFF;
}

.shadow-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.shadow-btn {
  width: 36px;
  height: 36px;
  background: white;
  border: 2px solid #e5e5e5;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
}

.shadow-btn.active {
  border-color: #165DFF;
}

/* 过渡效果按钮组 */
.transition-btns {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.transition-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 4px;
  background: #f5f5f5;
  border: 2px solid #e5e5e5;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
  color: #333;
}

.transition-btn:hover {
  border-color: #165DFF;
  background: #f0f5ff;
}

.transition-btn.active {
  border-color: #165DFF;
  background: #e8f0ff;
  color: #165DFF;
}

.transition-btn .t-icon {
  font-size: 16px;
  margin-bottom: 2px;
}

.transition-btn .t-label {
  font-size: 10px;
}

.btn-delete {
  width: 100%;
  padding: 10px;
  background: #FEE2E2;
  color: #DC2626;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.btn-delete:hover {
  background: #FECACA;
}

.add-buttons {
  display: flex;
  gap: 8px;
}

.add-buttons button {
  flex: 1;
  padding: 10px 8px;
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}

.add-buttons button:hover {
  background: #f5f5f5;
  border-color: #165DFF;
}

/* 移动端 */
@media (max-width: 1024px) {
  .slides-sidebar {
    width: 100px;
  }

  .properties-panel {
    width: 240px;
  }

  .canvas-slide {
    width: 100%;
    max-width: 600px;
    height: auto;
    aspect-ratio: 16 / 9;
  }
}

@media (max-width: 768px) {
  .toolbar {
    flex-wrap: wrap;
    gap: 8px;
    padding: 8px 16px;
  }

  .main-content {
    flex-direction: column;
  }

  .slides-sidebar {
    width: 100%;
    flex-direction: row;
    overflow-x: auto;
    border-right: none;
    border-bottom: 1px solid #e5e5e5;
  }

  .slide-thumbnail {
    min-width: 60px;
    margin-right: 8px;
    margin-bottom: 0;
  }

  .properties-panel {
    width: 100%;
    max-height: 200px;
  }
}
</style>
