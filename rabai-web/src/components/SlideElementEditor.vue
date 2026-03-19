<template>
  <div class="element-editor-overlay" @click.self="closeEditor">
    <div class="element-editor-panel">
      <div class="editor-header">
        <div class="header-left">
          <h3>🛠️ 页面元素微调</h3>
          <p class="editor-tip">点击画布中的元素进行编辑，拖拽调整位置 | 方向键移动 | Delete删除 | Ctrl+Z撤销</p>
        </div>
        <div class="header-toolbar">
          <button class="toolbar-btn" @click="undo" :disabled="!canUndo" title="撤销 (Ctrl+Z)">
            ↩️ 撤销
          </button>
          <button class="toolbar-btn" @click="redo" :disabled="!canRedo" title="重做 (Ctrl+Y)">
            ↪️ 重做
          </button>
        </div>
        <button class="btn-close" @click="closeEditor">✕</button>
      </div>

      <div class="editor-content">
        <!-- 幻灯片缩略图列表 -->
        <div class="slides-list">
          <div
            v-for="(slide, index) in slides"
            :key="index"
            class="slide-thumb"
            :class="{ active: activeSlideIndex === index }"
            @click="selectSlide(index)"
          >
            <span class="thumb-num">{{ index + 1 }}</span>
            <div class="thumb-preview" :style="{ background: slide.background || '#fff' }">
              <div
                v-for="(el, elIndex) in slide.elements"
                :key="elIndex"
                class="thumb-element"
                :class="{ selected: activeSlideIndex === index && selectedElementIndex === elIndex }"
                :style="getElementStyle(el)"
                @click.stop="selectElement(index, elIndex)"
              >
                {{ el.type === 'text' ? 'T' : (el.type === 'shape' ? '■' : '🖼') }}
              </div>
            </div>
          </div>
        </div>

        <!-- 编辑画布 -->
        <div class="edit-canvas">
          <div
            class="canvas-slide"
            :style="currentSlideStyle"
            @click="deselectElement"
          >
            <div
              v-for="(el, index) in currentElements"
              :key="index"
              class="canvas-element"
              :class="{
                selected: selectedElementIndex === index,
                dragging: isDragging
              }"
              :style="getCanvasElementStyle(el, index)"
              @click.stop="selectElement(activeSlideIndex, index)"
              @mousedown="startDrag($event, index)"
            >
              <!-- 文本元素 -->
              <template v-if="el.type === 'text'">
                <div
                  class="element-content text-content"
                  contenteditable="true"
                  @blur="updateElementContent(index, $event)"
                  @click.stop
                >
                  {{ el.content }}
                </div>
              </template>

              <!-- 形状元素 -->
              <template v-else-if="el.type === 'shape'">
                <div
                  class="element-content shape-content"
                  :style="{ backgroundColor: el.fill, borderRadius: el.radius || '0' }"
                ></div>
              </template>

              <!-- 图片元素 -->
              <template v-else-if="el.type === 'image'">
                <img
                  v-if="el.src"
                  :src="el.src"
                  class="element-content image-content"
                  alt=""
                />
                <div v-else class="element-content image-placeholder">🖼️</div>
              </template>

              <!-- 选中标记 -->
              <div v-if="selectedElementIndex === index" class="resize-handles">
                <div class="handle handle-nw" @mousedown.stop="startResize($event, 'nw')"></div>
                <div class="handle handle-ne" @mousedown.stop="startResize($event, 'ne')"></div>
                <div class="handle handle-sw" @mousedown.stop="startResize($event, 'sw')"></div>
                <div class="handle handle-se" @mousedown.stop="startResize($event, 'se')"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 属性面板 -->
        <div class="properties-panel">
          <div class="panel-header">元素属性</div>

          <div v-if="selectedElement" class="panel-content">
            <!-- 元素类型 -->
            <div class="prop-group">
              <label class="prop-label">类型</label>
              <div class="prop-value">
                <span class="type-badge">{{ getElementTypeName(selectedElement.type) }}</span>
              </div>
            </div>

            <!-- 位置 -->
            <div class="prop-group">
              <label class="prop-label">位置</label>
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
              <label class="prop-label">尺寸</label>
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
              <label class="prop-label">文本内容</label>
              <textarea
                class="prop-textarea"
                :value="selectedElement.content"
                @input="updateElementProp('content', ($event.target as HTMLTextAreaElement).value)"
                rows="4"
              ></textarea>
            </div>

            <!-- 字体设置 -->
            <div v-if="selectedElement.type === 'text'" class="prop-group">
              <label class="prop-label">字体</label>
              <div class="prop-row">
                <select
                  class="prop-select"
                  :value="selectedElement.fontSize || 18"
                  @change="updateElementProp('fontSize', Number(($event.target as HTMLSelectElement).value))"
                >
                  <option :value="12">12px</option>
                  <option :value="14">14px</option>
                  <option :value="16">16px</option>
                  <option :value="18">18px</option>
                  <option :value="24">24px</option>
                  <option :value="32">32px</option>
                  <option :value="40">40px</option>
                  <option :value="48">48px</option>
                </select>
                <select
                  class="prop-select"
                  :value="selectedElement.fontWeight || 'normal'"
                  @change="updateElementProp('fontWeight', ($event.target as HTMLSelectElement).value)"
                >
                  <option value="normal">正常</option>
                  <option value="bold">粗体</option>
                </select>
              </div>
            </div>

            <!-- 颜色设置 -->
            <div v-if="selectedElement.type === 'text' || selectedElement.type === 'shape'" class="prop-group">
              <label class="prop-label">颜色</label>
              <div class="color-picker">
                <input
                  type="color"
                  :value="selectedElement.color || '#000000'"
                  @input="updateElementProp('color', ($event.target as HTMLInputElement).value)"
                  class="color-input"
                />
                <span class="color-value">{{ selectedElement.color || '#000000' }}</span>
              </div>
            </div>

            <!-- 形状填充色 -->
            <div v-if="selectedElement.type === 'shape'" class="prop-group">
              <label class="prop-label">填充颜色</label>
              <div class="color-picker">
                <input
                  type="color"
                  :value="selectedElement.fill || '#ffffff'"
                  @input="updateElementProp('fill', ($event.target as HTMLInputElement).value)"
                  class="color-input"
                />
                <span class="color-value">{{ selectedElement.fill || '#ffffff' }}</span>
              </div>
            </div>

            <!-- 对齐 -->
            <div class="prop-group">
              <label class="prop-label">对齐</label>
              <div class="align-buttons">
                <button @click="setAlignment('left')" title="左对齐">⬅</button>
                <button @click="setAlignment('center')" title="居中">⬌</button>
                <button @click="setAlignment('right')" title="右对齐">➡</button>
              </div>
            </div>

            <!-- 删除元素 -->
            <div class="prop-group">
              <button class="btn-delete-element" @click="deleteElement">
                🗑️ 删除元素
              </button>
            </div>
          </div>

          <div v-else class="panel-empty">
            <p>选择画布中的元素进行编辑</p>
          </div>

          <!-- 添加元素 -->
          <div class="panel-add">
            <div class="panel-header">添加元素</div>
            <div class="add-buttons">
              <button @click="addElement('text')" title="添加文本">📝 文本</button>
              <button @click="addElement('shape')" title="添加形状">■ 形状</button>
              <button @click="addElement('image')" title="添加图片">🖼️ 图片</button>
            </div>
          </div>
        </div>
      </div>

      <div class="editor-footer">
        <button class="btn btn-outline" @click="resetChanges">重置</button>
        <button class="btn btn-primary" @click="applyChanges">应用更改</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface SlideElement {
  id: string
  type: 'text' | 'shape' | 'image'
  x: number
  y: number
  width: number
  height: number
  content?: string
  color?: string
  fill?: string
  radius?: string
  fontSize?: number
  fontWeight?: string
  textAlign?: string
  src?: string
}

interface Slide {
  background?: string
  elements: SlideElement[]
}

const emit = defineEmits(['close', 'apply'])

const props = defineProps<{
  slideCount: number
}>()

const slides = ref<Slide[]>([])
const activeSlideIndex = ref(0)
const selectedElementIndex = ref<number | null>(null)
const isDragging = ref(false)
const isResizing = ref(false)
const dragStart = ref({ x: 0, y: 0, elementX: 0, elementY: 0 })
const resizeHandle = ref('')
const resizeStart = ref({ x: 0, y: 0, width: 0, height: 0, elX: 0, elY: 0 })

// 撤销/重做历史记录
const history = ref<Slide[][]>([])
const historyIndex = ref(-1)
const maxHistory = 50

const saveHistory = () => {
  // 移除当前位置之后的所有历史
  if (historyIndex.value < history.value.length - 1) {
    history.value = history.value.slice(0, historyIndex.value + 1)
  }
  // 深拷贝当前状态
  history.value.push(JSON.parse(JSON.stringify(slides.value)))
  // 限制历史记录数量
  if (history.value.length > maxHistory) {
    history.value.shift()
  } else {
    historyIndex.value++
  }
}

const canUndo = computed(() => historyIndex.value > 0)
const canRedo = computed(() => historyIndex.value < history.value.length - 1)

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

// 初始化幻灯片数据
const initSlides = () => {
  // 生成示例数据
  slides.value = Array.from({ length: props.slideCount }, (_, i) => ({
    background: i % 2 === 0 ? '#ffffff' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    elements: i === 0
      ? [
          { id: '1', type: 'text', x: 100, y: 80, width: 600, height: 60, content: 'PPT标题', fontSize: 40, fontWeight: 'bold', color: '#333333' },
          { id: '2', type: 'text', x: 100, y: 160, width: 600, height: 40, content: '副标题', fontSize: 24, color: '#666666' }
        ]
      : [
          { id: '1', type: 'text', x: 60, y: 40, width: 540, height: 50, content: '第' + (i + 1) + '页标题', fontSize: 28, fontWeight: 'bold', color: '#333333' },
          { id: '2', type: 'text', x: 60, y: 100, width: 540, height: 200, content: '• 要点1\n• 要点2\n• 要点3\n• 要点4', fontSize: 18, color: '#555555' },
          { id: '3', type: 'shape', x: 60, y: 320, width: 100, height: 8, fill: '#165DFF', radius: '4px' }
        ]
  }))
}

const currentSlideStyle = computed(() => ({
  background: slides.value[activeSlideIndex.value]?.background || '#fff'
}))

const currentElements = computed(() =>
  slides.value[activeSlideIndex.value]?.elements || []
)

const selectedElement = computed(() => {
  if (selectedElementIndex.value === null) return null
  return currentElements.value[selectedElementIndex.value]
})

const selectSlide = (index: number) => {
  activeSlideIndex.value = index
  selectedElementIndex.value = null
}

const selectElement = (slideIndex: number, elementIndex: number) => {
  activeSlideIndex.value = slideIndex
  selectedElementIndex.value = elementIndex
}

const deselectElement = () => {
  selectedElementIndex.value = null
}

const getElementTypeName = (type: string) => {
  const map: Record<string, string> = {
    text: '文本',
    shape: '形状',
    image: '图片'
  }
  return map[type] || type
}

const getElementStyle = (el: SlideElement) => ({
  left: (el.x / 800 * 100) + '%',
  top: (el.y / 450 * 100) + '%',
  width: (el.width / 800 * 100) + '%',
  height: (el.height / 450 * 100) + '%',
  fontSize: el.fontSize ? Math.max(8, el.fontSize / 3) + 'px' : '12px'
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
    zIndex: isSelected ? 100 : 1
  }
}

const updateElementContent = (index: number, event: Event) => {
  const target = event.target as HTMLElement
  slides.value[activeSlideIndex.value].elements[index].content = target.innerText
}

const updateElementProp = (prop: string, value: any) => {
  if (selectedElementIndex.value === null) return
  (slides.value[activeSlideIndex.value].elements[selectedElementIndex.value] as any)[prop] = value
}

const setAlignment = (align: string) => {
  if (selectedElementIndex.value === null) return
  slides.value[activeSlideIndex.value].elements[selectedElementIndex.value].textAlign = align
}

const deleteElement = () => {
  if (selectedElementIndex.value === null) return
  saveHistory()
  slides.value[activeSlideIndex.value].elements.splice(selectedElementIndex.value, 1)
  selectedElementIndex.value = null
}

const addElement = (type: 'text' | 'shape' | 'image') => {
  saveHistory()
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
    fontSize: 18
  }
  slides.value[activeSlideIndex.value].elements.push(newElement)
  selectedElementIndex.value = slides.value[activeSlideIndex.value].elements.length - 1
}

// 拖拽
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

  if (handle.includes('e')) el.width = Math.max(50, resizeStart.value.width + dx)
  if (handle.includes('w')) {
    el.width = Math.max(50, resizeStart.value.width - dx)
    el.x = resizeStart.value.elX + dx
  }
  if (handle.includes('s')) el.height = Math.max(30, resizeStart.value.height + dy)
  if (handle.includes('n')) {
    el.height = Math.max(30, resizeStart.value.height - dy)
    el.y = resizeStart.value.elY + dy
  }
}

const stopResize = () => {
  isResizing.value = false
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', stopResize)
}

const resetChanges = () => {
  initSlides()
  selectedElementIndex.value = null
}

const applyChanges = () => {
  // 保存更改到本地存储
  localStorage.setItem('ppt_edited_elements', JSON.stringify(slides.value))
  emit('apply', slides.value)
  closeEditor()
}

const closeEditor = () => {
  emit('close')
}

// 键盘快捷键
const handleKeydown = (e: KeyboardEvent) => {
  // 如果正在输入文本，不触发快捷键
  if ((e.target as HTMLElement).tagName === 'INPUT' ||
      (e.target as HTMLElement).tagName === 'TEXTAREA' ||
      (e.target as HTMLElement).isContentEditable) {
    return
  }

  // 方向键移动元素
  if (selectedElementIndex.value !== null) {
    const step = e.shiftKey ? 10 : 1
    const el = slides.value[activeSlideIndex.value].elements[selectedElementIndex.value]

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault()
        saveHistory()
        el.x = Math.max(0, el.x - step)
        break
      case 'ArrowRight':
        e.preventDefault()
        saveHistory()
        el.x = Math.min(800 - el.width, el.x + step)
        break
      case 'ArrowUp':
        e.preventDefault()
        saveHistory()
        el.y = Math.max(0, el.y - step)
        break
      case 'ArrowDown':
        e.preventDefault()
        saveHistory()
        el.y = Math.min(450 - el.height, el.y + step)
        break
      case 'Delete':
      case 'Backspace':
        e.preventDefault()
        deleteElement()
        break
    }
  }

  // Ctrl/Cmd + Z 撤销
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
    e.preventDefault()
    undo()
  }

  // Ctrl/Cmd + Shift + Z 或 Ctrl/Cmd + Y 重做
  if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
    e.preventDefault()
    redo()
  }

  // Escape 取消选择
  if (e.key === 'Escape') {
    selectedElementIndex.value = null
  }
}

onMounted(() => {
  // 尝试加载已保存的编辑数据
  const saved = localStorage.getItem('ppt_edited_elements')
  if (saved) {
    try {
      slides.value = JSON.parse(saved)
    } catch {
      initSlides()
    }
  } else {
    initSlides()
  }

  // 初始化历史记录
  saveHistory()

  // 添加键盘事件监听
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', stopResize)
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.element-editor-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.element-editor-panel {
  width: 95%;
  max-width: 1400px;
  height: 90vh;
  background: white;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-header {
  padding: 16px 24px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e5e5;
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
}

.header-left {
  flex: 1;
}

.header-left h3 {
  margin: 0;
  font-size: 20px;
}

.editor-tip {
  margin: 4px 0 0;
  font-size: 13px;
  color: #666;
}

.header-toolbar {
  display: flex;
  gap: 8px;
}

.toolbar-btn {
  padding: 8px 16px;
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}

.toolbar-btn:hover:not(:disabled) {
  background: #f5f5f5;
  border-color: #165DFF;
}

.toolbar-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.editor-tip {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.btn-close {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
}

.btn-close:hover {
  background: #e5e5e5;
}

.editor-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* 幻灯片列表 */
.slides-list {
  width: 120px;
  padding: 16px;
  background: #f5f5f5;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.slide-thumb {
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.slide-thumb:hover {
  border-color: #ccc;
}

.slide-thumb.active {
  border-color: #165DFF;
}

.thumb-num {
  display: block;
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  padding: 4px;
  background: #e5e5e5;
}

.thumb-preview {
  height: 60px;
  position: relative;
  overflow: hidden;
}

.thumb-element {
  position: absolute;
  background: rgba(22, 93, 255, 0.3);
  border: 1px solid #165DFF;
  font-size: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.thumb-element.selected {
  background: rgba(22, 93, 255, 0.6);
}

/* 编辑画布 */
.edit-canvas {
  flex: 1;
  background: #e5e5e5;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.canvas-slide {
  width: 800px;
  height: 450px;
  background: white;
  position: relative;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
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

.shape-content {
  width: 100%;
  height: 100%;
}

.image-content {
  object-fit: cover;
}

.image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
  font-size: 24px;
}

/* 调整手柄 */
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

/* 属性面板 */
.properties-panel {
  width: 280px;
  background: #f9fafb;
  border-left: 1px solid #e5e5e5;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 12px 16px;
  font-weight: 600;
  font-size: 14px;
  border-bottom: 1px solid #e5e5e5;
}

.panel-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.panel-empty {
  padding: 40px 16px;
  text-align: center;
  color: #999;
}

.prop-group {
  margin-bottom: 16px;
}

.prop-label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 6px;
}

.prop-value {
  font-size: 14px;
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
  width: 60px;
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

.prop-select {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  font-size: 13px;
  background: white;
}

.type-badge {
  display: inline-block;
  padding: 4px 8px;
  background: #EEF2FF;
  color: #4F46E5;
  border-radius: 4px;
  font-size: 12px;
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

.color-value {
  font-size: 13px;
  color: #666;
  font-family: monospace;
}

.align-buttons {
  display: flex;
  gap: 4px;
}

.align-buttons button {
  flex: 1;
  padding: 8px;
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  cursor: pointer;
}

.align-buttons button:hover {
  background: #f5f5f5;
}

.btn-delete-element {
  width: 100%;
  padding: 10px;
  background: #FEE2E2;
  color: #DC2626;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.btn-delete-element:hover {
  background: #FECACA;
}

/* 添加元素 */
.panel-add {
  border-top: 1px solid #e5e5e5;
  padding: 12px 0;
}

.add-buttons {
  display: flex;
  gap: 8px;
  padding: 0 16px;
}

.add-buttons button {
  flex: 1;
  padding: 8px 4px;
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
}

.add-buttons button:hover {
  background: #f5f5f5;
  border-color: #165DFF;
}

/* 页脚 */
.editor-footer {
  padding: 16px 24px;
  border-top: 1px solid #e5e5e5;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn {
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}

.btn-outline {
  background: white;
  border: 1px solid #ddd;
}

.btn-outline:hover {
  background: #f5f5f5;
}

.btn-primary {
  background: #165DFF;
  color: white;
  border: none;
}

.btn-primary:hover {
  background: #0e42d2;
}
</style>
