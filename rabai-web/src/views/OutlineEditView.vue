<template>
  <div class="outline-edit-page">
    <div class="outline-header">
      <div class="header-left">
        <button class="btn-back" @click="goBack">
          ← 返回
        </button>
        <div class="header-info">
          <h1 class="page-title">编辑 PPT 大纲</h1>
          <p class="page-subtitle">调整每页标题和内容，确认后生成演示文稿</p>
        </div>
        <div class="auto-save-indicator" v-if="autoSaveLabel">
          <span class="save-dot" :class="{ saving: isSaving }"></span>
          <span class="save-label">{{ isSaving ? '保存中...' : autoSaveLabel }}</span>
        </div>
      </div>
      <div class="header-actions">
        <button class="btn btn-outline" @click="showConfigPanel = !showConfigPanel">
          {{ showConfigPanel ? '收起参数' : '⚙️ 参数配置' }}
        </button>
        <button class="btn btn-outline" @click="addSlide">
          + 添加页面
        </button>
        <button class="btn btn-primary" @click="generatePPT" :disabled="isGenerating">
          {{ isGenerating ? '生成中...' : '生成 PPT' }}
        </button>
      </div>
    </div>

    <!-- 大纲预览 -->
    <div class="outline-preview">
      <div class="outline-summary">
        <span class="summary-item">
          <span class="summary-icon">📄</span>
          {{ outline.slides.length }} 页
        </span>
        <span class="summary-item">
          <span class="summary-icon">⏱️</span>
          预计 {{ outline.slides.length * 30 }} 秒
        </span>
        <span class="summary-item">
          <span class="summary-icon">🎨</span>
          {{ getStyleName(outline.style) }}
        </span>
      </div>
    </div>

    <!-- 幻灯片列表 -->
    <div class="slides-container">
      <TransitionGroup name="slide" tag="div" class="slides-list">
        <div
          v-for="(slide, index) in outline.slides"
          :key="slide.id"
          class="slide-card"
          :class="{ active: activeSlide === index }"
          @click="activeSlide = index"
        >
          <div class="slide-number">{{ index + 1 }}</div>
          <div class="slide-content">
            <div class="slide-header">
              <input
                v-model="slide.title"
                type="text"
                class="slide-title-input"
                placeholder="页面标题"
                @click.stop
              />
              <button class="btn-icon btn-delete" @click.stop="deleteSlide(index)" title="删除页面">
                🗑️
              </button>
            </div>
            <div class="slide-body">
              <textarea
                v-model="slide.content"
                class="slide-content-input"
                placeholder="输入页面内容要点，每行一个要点..."
                rows="4"
                @click.stop
              ></textarea>
            </div>
            <div class="slide-footer">
              <select v-model="slide.layout" class="layout-select" @click.stop>
                <option value="title_slide">标题页</option>
                <option value="content_card">内容页</option>
                <option value="two_column">双栏</option>
                <option value="left_image_right_text">左图右文</option>
                <option value="left_text_right_image">左文右图</option>
                <option value="center">居中</option>
              </select>
              <span class="word-count">{{ getWordCount(slide.content) }} 字</span>
            </div>

            <!-- R55: Layout Suggestions Panel (Smart Placeholder) -->
            <div v-if="activeSlide === index && layoutSuggestions.length > 0" class="layout-suggestions-panel">
              <div class="suggestions-header">
                <span class="suggestions-icon">✨</span>
                <span class="suggestions-title">AI 布局推荐</span>
                <span class="content-type-badge">{{ activeContentTypeDisplay }}</span>
                <span v-if="isDetectingLayout" class="detecting-indicator">分析中...</span>
              </div>
              <div class="suggestions-list">
                <div
                  v-for="suggestion in layoutSuggestions"
                  :key="suggestion.type"
                  class="suggestion-item"
                  :class="{ primary: suggestion.is_primary }"
                >
                  <div class="suggestion-info">
                    <span class="suggestion-name">{{ suggestion.name }}</span>
                    <span class="suggestion-desc">{{ suggestion.description }}</span>
                  </div>
                  <div class="suggestion-actions">
                    <button
                      class="btn-apply-layout"
                      :disabled="slide.layout === suggestion.type"
                      @click.stop="applyLayoutSuggestion(suggestion)"
                    >
                      {{ slide.layout === suggestion.type ? '已应用' : '应用' }}
                    </button>
                    <button
                      class="btn-dismiss-layout"
                      @click.stop="dismissSuggestion(suggestion)"
                      title="不感兴趣"
                    >✕</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- R55: Content Type Indicator (Smart Placeholder) -->
            <div v-else-if="activeSlide === index && activeContentTypeDisplay && !isDetectingLayout" class="content-type-indicator">
              <span class="content-type-badge small">{{ activeContentTypeDisplay }}</span>
              <span class="hint-text">切换到"布局建议"查看推荐</span>
            </div>
          </div>
        </div>
      </TransitionGroup>

      <!-- 添加页面按钮 -->
      <div class="add-slide-card" @click="addSlide">
        <span class="add-icon">+</span>
        <span>添加新页面</span>
      </div>
    </div>

    <!-- 快捷操作 -->
    <div class="quick-actions">
      <button class="quick-action" @click="generateOutline">
        <span class="action-icon">✨</span>
        <span>AI 重新生成大纲</span>
      </button>
      <button class="quick-action" @click="clearAll">
        <span class="action-icon">🗑️</span>
        <span>清空所有</span>
      </button>
    </div>

    <!-- 参数配置面板 -->
    <div v-if="showConfigPanel" class="config-panel">
      <div class="config-panel-header">
        <h3>🎨 PPT 参数配置</h3>
        <button class="close-btn" @click="showConfigPanel = false">✕</button>
      </div>
      <div class="config-panel-body">
        <!-- 场景选择 -->
        <div class="config-section">
          <label class="config-label">场景类型</label>
          <select v-model="genOptions.scene" class="config-select">
            <option value="business">💼 商务</option>
            <option value="education">📚 教育</option>
            <option value="tech">🚀 科技</option>
            <option value="creative">💡 创意</option>
            <option value="marketing">📢 营销</option>
            <option value="finance">💰 金融</option>
            <option value="medical">🏥 医疗</option>
            <option value="government">🏛️ 政府</option>
          </select>
        </div>

        <!-- 风格选择 -->
        <div class="config-section">
          <label class="config-label">视觉风格</label>
          <select v-model="genOptions.style" class="config-select">
            <option value="professional">💼 专业商务</option>
            <option value="simple">✨ 简约现代</option>
            <option value="energetic">🔥 活力动感</option>
            <option value="premium">👑 高端大气</option>
            <option value="tech">🚀 科技未来</option>
            <option value="creative">🎨 创意艺术</option>
            <option value="elegant">🌸 优雅古典</option>
            <option value="playful">🎮 卡通趣味</option>
            <option value="nature">🌿 自然清新</option>
            <option value="minimalist">⬜ 极简留白</option>
          </select>
        </div>

        <!-- 模板选择 -->
        <div class="config-section">
          <label class="config-label">模板风格</label>
          <div class="template-grid">
            <div
              v-for="tpl in templateOptions"
              :key="tpl.value"
              class="template-card"
              :class="{ active: genOptions.template === tpl.value }"
              @click="genOptions.template = tpl.value"
            >
              <div class="template-preview" :style="{ background: tpl.preview }">
                <span class="template-icon">{{ tpl.icon }}</span>
              </div>
              <span class="template-name">{{ tpl.name }}</span>
            </div>
          </div>
        </div>

        <!-- 主题色 -->
        <div class="config-section">
          <label class="config-label">主题色</label>
          <div class="theme-colors">
            <div
              v-for="color in themeColors"
              :key="color.value"
              class="theme-color"
              :class="{ active: genOptions.themeColor === color.value }"
              :style="{ background: color.value }"
              @click="genOptions.themeColor = color.value"
            >
              <span v-if="genOptions.themeColor === color.value" class="check">✓</span>
            </div>
          </div>
        </div>

        <!-- 文字样式 -->
        <div class="config-section">
          <label class="config-label">文字样式</label>
          <select v-model="genOptions.textStyle" class="config-select">
            <option value="transparent_overlay">半透明遮罩</option>
            <option value="shadow">文字阴影</option>
            <option value="glow">发光效果</option>
            <option value="outline">描边效果</option>
            <option value="gradient">渐变文字</option>
            <option value="neon">霓虹灯效</option>
          </select>
        </div>

        <!-- 字体系统 -->
        <div class="config-section">
          <label class="config-label">字体系统</label>
          <div class="font-grid">
            <div class="font-item">
              <span class="font-label">标题字体</span>
              <select v-model="genOptions.fontTitle" class="config-select">
                <option value="思源黑体">思源黑体</option>
                <option value="思源宋体">思源宋体</option>
                <option value="Noto Sans SC">Noto Sans</option>
                <option value="Noto Serif SC">Noto Serif</option>
                <option value="阿里巴巴普惠体">阿里巴巴普惠体</option>
                <option value="站酷高端黑">站酷高端黑</option>
              </select>
            </div>
            <div class="font-item">
              <span class="font-label">正文字体</span>
              <select v-model="genOptions.fontContent" class="config-select">
                <option value="思源黑体">思源黑体</option>
                <option value="思源宋体">思源宋体</option>
                <option value="Noto Sans SC">Noto Sans</option>
                <option value="Noto Serif SC">Noto Serif</option>
                <option value="阿里巴巴普惠体">阿里巴巴普惠体</option>
                <option value="站酷快乐体">站酷快乐体</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 智能布局 -->
        <div class="config-section">
          <label class="config-label">
            <input type="checkbox" v-model="genOptions.useSmartLayout" />
            <span>启用智能布局</span>
          </label>
        </div>

        <!-- 生成模式 -->
        <div class="config-section">
          <label class="config-label">生成模式</label>
          <select v-model="genOptions.generationMode" class="config-select">
            <option value="standard">标准模式</option>
            <option value="fast">快速模式</option>
            <option value="quality">高清模式</option>
            <option value="stream">流式模式</option>
          </select>
        </div>

        <!-- 输出格式 -->
        <div class="config-section">
          <label class="config-label">输出格式</label>
          <select v-model="genOptions.outputFormat" class="config-select">
            <option value="pptx">PPTX (PowerPoint)</option>
            <option value="pdf">PDF</option>
            <option value="svg">SVG</option>
            <option value="png">PNG</option>
          </select>
        </div>

        <!-- 质量选择 -->
        <div class="config-section">
          <label class="config-label">输出质量</label>
          <select v-model="genOptions.quality" class="config-select">
            <option value="standard">标准 (1080p)</option>
            <option value="high">高清 (1440p)</option>
            <option value="ultra">超清 (4K)</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 加载中 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>正在生成大纲...</p>
    </div>

    <!-- 图表上传入口按钮 -->
    <button class="quick-action chart-upload-btn" @click="showChartUploadPanel = true">
      <span class="action-icon">📊</span>
      <span>上传数据生成图表</span>
    </button>

    <!-- 图表上传面板 -->
    <div v-if="showChartUploadPanel" class="chart-upload-panel">
      <view class="panel-header">
        <text class="panel-title">📊 数据可视化</text>
        <span class="close-btn" @click="showChartUploadPanel = false">✕</span>
      </view>
      
      <view class="upload-area" @click="chooseChartFile">
        <text>{{ chartFileName || '点击选择 CSV/Excel 文件' }}</text>
      </view>
      
      <view class="chart-type-selector">
        <view 
          v-for="type in chartTypes" 
          :class="['type-btn', selectedChartType === type ? 'active' : '']"
          @click="selectedChartType = type"
        >
          {{ type === 'bar' ? '柱状图' : type === 'pie' ? '饼图' : type === 'line' ? '折线图' : type === 'horizontal_bar' ? '横向柱图' : '堆叠柱图' }}
        </view>
      </view>
      
      <view class="column-selector" v-if="chartColumns.label_columns && chartColumns.label_columns.length">
        <text class="selector-label">标签列：</text>
        <select v-model="selectedLabelColIndex" class="column-select">
          <option v-for="(col, idx) in chartColumns.label_columns" :key="idx" :value="idx">{{ col }}</option>
        </select>
      </view>
      
      <view class="column-selector" v-if="chartColumns.numeric_columns && chartColumns.numeric_columns.length">
        <text class="selector-label">数值列：</text>
        <select v-model="selectedValueColIndex" class="column-select">
          <option v-for="(col, idx) in chartColumns.numeric_columns" :key="idx" :value="idx">{{ col }}</option>
        </select>
      </view>

      <view class="preview-table" v-if="chartColumns.preview && chartColumns.preview.length">
        <text class="preview-title">数据预览（前5行）</text>
        <table>
          <thead>
            <tr>
              <th v-for="col in chartColumns.all_columns" :key="col">{{ col }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in chartColumns.preview" :key="idx">
              <td v-for="col in chartColumns.all_columns" :key="col">{{ row[col] }}</td>
            </tr>
          </tbody>
        </table>
      </view>
      
      <button class="generate-btn" type="button" @click="generateChartFromData">生成图表</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useInteractionFeedback } from '../composables/useInteractionFeedback'
import { useAutoSave } from '../composables/useAutoSave'
import { useKeyboardShortcuts } from '../composables/useKeyboardShortcuts'

const router = useRouter()
const route = useRoute()
const { showSuccess, showError, showWarning } = useInteractionFeedback()

interface Slide {
  id: string
  title: string
  content: string
  layout: 'title' | 'content' | 'two-column' | 'image-left' | 'image-right' | 'centered' | 'content_card'
}

interface OutlineData {
  slides: Slide[]
  style: string
  theme: string
}

const activeSlide = ref(0)
const isLoading = ref(false)
const debugSrc = ref('init')
const isGenerating = ref(false)

// 参数配置面板显示状态
const showConfigPanel = ref(false)

// 图表上传相关
const chartTypes = ['bar', 'pie', 'line', 'horizontal_bar', 'stacked_bar']
const showChartUploadPanel = ref(false)
const chartFileName = ref('')
const selectedChartType = ref('bar')
const chartColumns = ref<{ all_columns: string[]; label_columns: string[]; numeric_columns: string[]; preview: Record<string, any>[] }>({
  all_columns: [],
  label_columns: [],
  numeric_columns: [],
  preview: []
})
const selectedLabelColIndex = ref(0)
const selectedValueColIndex = ref(0)
const chartSvgUrls = ref<string[]>([])
const chartSelectedFile = ref<File | null>(null)

// Undo history for Ctrl+Z
const undoStack = ref<string[]>([])
const MAX_UNDO = 20

// R55: Layout Suggestions - Smart placeholders & AI layout recommendations
interface LayoutSuggestion {
  type: string
  name: string
  description: string
  confidence: number
  is_primary: boolean
}

const layoutSuggestions = ref<LayoutSuggestion[]>([])
const activeContentType = ref('')
const activeContentTypeDisplay = ref('')
const isDetectingLayout = ref(false)
const layoutDetectTimer = ref<ReturnType<typeof setTimeout> | null>(null)

// Detect content type and suggest layouts
const detectLayoutForSlide = async () => {
  const slide = outline.slides[activeSlide.value]
  if (!slide) return
  
  const text = (slide.title || '') + ' ' + (slide.content || '')
  if (text.trim().length < 5) {
    layoutSuggestions.value = []
    activeContentType.value = ''
    activeContentTypeDisplay.value = ''
    return
  }
  
  isDetectingLayout.value = true
  try {
    const { api } = await import('../api/client')
    const res = await api.template.suggestLayouts({
      title: slide.title || '',
      content: slide.content || ''
    })
    if (res.data?.success) {
      layoutSuggestions.value = res.data.suggestions || []
      activeContentType.value = res.data.content_type || ''
      activeContentTypeDisplay.value = res.data.content_type_display || ''
    }
  } catch (e) {
    console.warn('[OutlineEdit] Layout detection failed:', e)
    layoutSuggestions.value = []
  } finally {
    isDetectingLayout.value = false
  }
}

// Debounced version - called on content change
const debouncedDetectLayout = () => {
  if (layoutDetectTimer.value) {
    clearTimeout(layoutDetectTimer.value)
  }
  layoutDetectTimer.value = setTimeout(() => {
    detectLayoutForSlide()
  }, 800)
}

// Apply a layout suggestion (one-click apply)
const applyLayoutSuggestion = async (suggestion: LayoutSuggestion) => {
  const slide = outline.slides[activeSlide.value]
  if (!slide) return
  
  saveUndoSnapshot()
  slide.layout = suggestion.type as any
  
  // Track preference (template learning)
  try {
    const { api } = await import('../api/client')
    api.template.saveLayoutPreference({
      template_id: genOptions.template,
      layout_type: suggestion.type,
      content_type: activeContentType.value,
      scene: genOptions.scene,
      style: genOptions.style,
      action: 'apply'
    })
  } catch (e) {
    // Silent fail for tracking
  }
  
  showSuccess('布局已应用', `${suggestion.name} 布局已应用到当前页面`)
}

// Dismiss suggestion
const dismissSuggestion = async (suggestion: LayoutSuggestion) => {
  try {
    const { api } = await import('../api/client')
    api.template.saveLayoutPreference({
      template_id: genOptions.template,
      layout_type: suggestion.type,
      content_type: activeContentType.value,
      scene: genOptions.scene,
      style: genOptions.style,
      action: 'dismiss'
    })
  } catch (e) {
    // Silent fail
  }
  
  // Remove from suggestions
  layoutSuggestions.value = layoutSuggestions.value.filter(s => s.type !== suggestion.type)
}

// Auto-save indicator
const autoSaveKey = ref(`outline_${route.query.taskId || 'new'}`)
const autoSaveLabel = ref('')

// Update auto-save label
const updateAutoSaveLabel = () => {
  if (!lastSavedTime.value) {
    autoSaveLabel.value = ''
    return
  }
  const diff = Date.now() - lastSavedTime.value
  if (diff < 60000) {
    autoSaveLabel.value = '刚刚保存'
  } else if (diff < 3600000) {
    autoSaveLabel.value = `${Math.floor(diff / 60000)}分钟前保存`
  } else {
    autoSaveLabel.value = `${Math.floor(diff / 3600000)}小时前保存`
  }
}

// Save snapshot for undo
const saveUndoSnapshot = () => {
  const snapshot = JSON.stringify(outline.slides)
  undoStack.value.push(snapshot)
  if (undoStack.value.length > MAX_UNDO) {
    undoStack.value.shift()
  }
}

// Perform undo
const performUndo = () => {
  if (undoStack.value.length === 0) {
    showWarning('无法撤销', '没有可撤销的操作')
    return
  }
  const snapshot = undoStack.value.pop()!
  try {
    const parsed = JSON.parse(snapshot)
    outline.slides = parsed
    showSuccess('已撤销', '大纲已恢复到上一步')
  } catch {
    showError('撤销失败', '无法解析撤销数据')
  }
}

// Save outline (Ctrl+S)
const performSave = async () => {
  try {
    await saveOutline()
    saveDraft()
    showSuccess('已保存', '大纲已保存到服务器和本地')
  } catch {
    showError('保存失败', '请稍后重试')
  }
}

const outline = reactive<OutlineData>({
  slides: [],
  style: 'professional',
  theme: 'blue'
})

// Auto-save after outline is defined
const { saveDraft, lastSavedTime, isSaving } = useAutoSave({
  key: autoSaveKey.value,
  data: outline,
  debounceMs: 3000,
  maxAge: 7 * 24 * 60 * 60 * 1000
})

// 生成选项 - 从 CreateView 传递（通过 route.query）
// 完整参数配置
const genOptions = reactive({
  // 基础参数
  scene: (route.query.scene as string) || 'business',
  style: (route.query.style as string) || 'professional',
  template: (route.query.template as string) || 'default',
  themeColor: (route.query.themeColor as string) || '#165DFF',
  // 字体系统
  fontTitle: (route.query.fontTitle as string) || '思源黑体',
  fontSubtitle: (route.query.fontSubtitle as string) || '思源黑体',
  fontContent: (route.query.fontContent as string) || '思源宋体',
  fontCaption: (route.query.fontCaption as string) || '思源黑体',
  // 文字样式
  textStyle: (route.query.textStyle as string) || 'transparent_overlay',
  shadowColor: (route.query.shadowColor as string) || '#000000',
  overlayTransparency: Number(route.query.overlayTransparency) || 30,
  // 布局设置
  useSmartLayout: route.query.useSmartLayout === 'true',
  layoutMode: (route.query.layoutMode as 'auto' | 'manual') || 'auto',
  // 生成设置
  generationMode: (route.query.generationMode as string) || 'standard',
  outputFormat: (route.query.outputFormat as string) || 'pptx',
  quality: (route.query.quality as string) || 'standard',
})

// 模板选项
const templateOptions = [
  { value: 'default', name: '默认商务', icon: '📊', preview: 'linear-gradient(135deg, #667eea, #764ba2)' },
  { value: 'modern', name: '现代简约', icon: '✨', preview: 'linear-gradient(135deg, #11998e, #38ef7d)' },
  { value: 'tech', name: '科技未来', icon: '🚀', preview: 'linear-gradient(135deg, #0f0c29, #302b63)' },
  { value: 'classic', name: '经典大气', icon: '👔', preview: 'linear-gradient(135deg, #232526, #414345)' },
  { value: 'nature', name: '自然清新', icon: '🌿', preview: 'linear-gradient(135deg, #56ab2f, #a8e063)' },
  { value: 'ocean', name: '海洋商务', icon: '🌊', preview: 'linear-gradient(135deg, #2193b0, #6dd5ed)' },
  { value: 'sunset', name: '日落暖阳', icon: '🌅', preview: 'linear-gradient(135deg, #f093fb, #f5576c)' },
  { value: 'minimal', name: '极简黑白', icon: '⬛', preview: 'linear-gradient(135deg, #304352, #d7d2cc)' }
]

// 主题色选项
const themeColors = [
  { value: '#165DFF', name: '科技蓝' },
  { value: '#34C759', name: '自然绿' },
  { value: '#FF9500', name: '活力橙' },
  { value: '#FF3B30', name: '热情红' },
  { value: '#AF52DE', name: '神秘紫' },
  { value: '#1A1A1A', name: '经典黑' },
  { value: '#5856D6', name: '暗夜紫' },
  { value: '#00B96B', name: '清新薄荷' },
  { value: '#FF2D55', name: '玫瑰粉' },
  { value: '#FFD60A', name: '阳光黄' },
  { value: '#64D2FF', name: '天空蓝' },
  { value: '#BF5AF2', name: '荧光紫' },
  { value: '#FF6B6B', name: '珊瑚红' },
  { value: '#4ECDC4', name: '海洋青' },
  { value: '#45B7D1', name: '天际蓝' },
  { value: '#96CEB4', name: '森林绿' }
]

// 生成唯一ID
const generateId = () => Math.random().toString(36).substr(2, 9)

// 获取风格名称
const getStyleName = (style: string) => {
  const styleMap: Record<string, string> = {
    professional: '专业商务',
    simple: '简约现代',
    energetic: '活力创意',
    premium: '高端奢华',
    tech: '科技感',
    creative: '创意艺术'
  }
  return styleMap[style] || style
}

// 获取字数
const getWordCount = (content: string) => {
  return content ? content.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '').length : 0
}

// 返回
const goBack = () => {
  router.back()
}

// 添加页面
const addSlide = () => {
  saveUndoSnapshot()
  outline.slides.push({
    id: generateId(),
    title: '',
    content: '',
    layout: 'content_card'
  })
  activeSlide.value = outline.slides.length - 1
}

// 删除页面
const deleteSlide = (index: number) => {
  if (outline.slides.length <= 1) {
    showError('操作无效', '至少保留一页')
    return
  }
  saveUndoSnapshot()
  outline.slides.splice(index, 1)
  if (activeSlide.value >= outline.slides.length) {
    activeSlide.value = outline.slides.length - 1
  }
}

// 布局类型映射 - API返回的后端格式映射到前端选项值
const mapLayoutType = (layout: string) => {
  const map: Record<string, string> = {
    'title_slide': 'title_slide',
    'content': 'content_card',
    'content_card': 'content_card',
    'two_column': 'two_column',
    'left_text_right_image': 'left_text_right_image',
    'left_image_right_text': 'left_image_right_text',
    'three_column': 'three_column',
    'center': 'center',
    'centered': 'center',
    'center_radiation': 'center',
    'toc': 'toc',
    'timeline': 'timeline',
    'data_visualization': 'data_visualization',
    'quote': 'quote',
    'comparison': 'comparison',
    'thank_you': 'thank_you'
  }
  return map[layout] || 'content_card'
}

// 选择图表文件
const chooseChartFile = async () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.csv,.xlsx,.xls'
  input.onchange = async (e: Event) => {
    const target = e.target as HTMLInputElement
    const file = target.files?.[0]
    if (!file) return
    chartFileName.value = file.name
    chartSelectedFile.value = file

    // 预览列信息
    try {
      const formData = new FormData()
      formData.append('file', file)
      // 使用 POST 方法预览文件列信息
      const previewRes = await fetch(`/api/v1/ppt/chart/preview/${route.query.taskId || 'temp'}`, {
        method: 'POST',
        body: formData
      })
      if (previewRes.ok) {
        const result = await previewRes.json()
        if (result.success) {
          chartColumns.value = result.columns
          selectedLabelColIndex.value = 0
          selectedValueColIndex.value = 0
        }
      }
    } catch (err) {
      console.error('文件解析失败', err)
      showError('文件解析失败', '请检查文件格式')
    }
  }
  input.click()
}

// 生成图表
const generateChartFromData = async () => {
  if (!chartSelectedFile.value) {
    showError('请选择文件', '请先选择文件')
    return
  }
  
  const labelCol = chartColumns.value.label_columns?.[selectedLabelColIndex.value] || ''
  const valueCol = chartColumns.value.numeric_columns?.[selectedValueColIndex.value] || ''
  
  if (!labelCol || !valueCol) {
    showError('请选择列', '请选择标签列和数值列')
    return
  }
  
  const taskId = route.query.taskId as string || 'temp_chart_task'
  
  try {
    const formData = new FormData()
    formData.append('file', chartSelectedFile.value)
    formData.append('chart_type', selectedChartType.value)
    formData.append('label_col', labelCol)
    formData.append('value_col', valueCol)
    
    const response = await fetch(`/api/v1/ppt/chart/upload/${taskId}`, {
      method: 'POST',
      body: formData
    })
    
    if (!response.ok) {
      throw new Error('图表生成失败')
    }
    
    const result = await response.json()
    if (result.success) {
      chartSvgUrls.value = result.svg_urls
      showChartUploadPanel.value = false
      
      // 可以选择在这里将图表插入到PPT大纲中
      // 添加一个新的图表页面
      outline.slides.push({
        id: generateId(),
        title: `${labelCol} - ${valueCol}`,
        content: `图表类型: ${selectedChartType.value}`,
        layout: 'content'
      })
      
      showSuccess('图表已生成', `共 ${result.charts.length} 个图表，已添加到幻灯片`)
    }
  } catch (err) {
    console.error('图表生成失败', err)
    showError('图表生成失败', '请重试')
  }
}

// 直接调用API生成大纲（跳过mock）
const testAPI = async () => {
  const r = document.getElementById('dbg-res')
  if (r) r.textContent = '⏳...'
  try {
    const scene = route.query.scene as string || 'business'
    const style = route.query.style as string || 'professional'
    const resp = await fetch('/api/v1/ppt/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_request: route.query.request || '商务演示', slide_count: 6, scene: scene, style: style })
    })
    const data = await resp.json()
    const ok = data.success && data.slides?.length > 0
    if (r) r.textContent = ok ? `✅ HTTP${resp.status} slides=${data.slides.length} s0="${data.slides[0]?.title}"` : `⚠️ success=${data.success} slides=${data.slides?.length||0}`
    if (ok) {
      outline.slides = data.slides.map((s: any, i: number) => ({
        id: generateId(),
        title: s.title || `第${i+1}页`,
        content: Array.isArray(s.content) ? s.content.join('\n') : (s.content || ''),
        layout: mapLayoutType(s.layout || s.slide_type || 'content')
      }))
      debugSrc.value = 'testAPI'
    }
  } catch(e: any) {
    if (r) r.textContent = `❌ ${e.message}`
  }
}

// AI重新生成大纲
const generateOutline = async () => {
  isLoading.value = true

  const request = route.query.request as string || '商务演示'
  const scene = route.query.scene as string || 'business'
  const style = route.query.style as string || 'professional'

  // 尝试调用后端API生成大纲
  try {
    const { api } = await import('../api/client')

    const response = await api.ppt.plan(request, 6, scene, style)

    // 检查响应结构
    if (response?.data) {
      const data = response.data as any

      if (data.success && data.slides && data.slides.length > 0) {
        outline.slides = data.slides.map((s: any, i: number) => ({
          id: generateId(),
          title: s.title || `第${i + 1}页`,
          content: Array.isArray(s.content) ? s.content.join('\n') : (s.content || ''),
          layout: mapLayoutType(s.layout || s.slide_type || 'content')
        }))
        showSuccess('大纲已生成', `共 ${outline.slides.length} 页内容`)
        isLoading.value = false
        return
      } else {
        console.warn('[generateOutline] ⚠️ API返回但 success=false 或 slides 为空:', JSON.stringify(data)?.substring(0, 300))
      }
    }
  } catch (apiError: any) {
    console.error('[generateOutline] ❌ API调用异常:', apiError?.message || apiError?.code || 'unknown')
    console.error('[generateOutline] 错误详情:', apiError?.response?.status, apiError?.response?.data)

    // 网络错误 - 后端可能没启动，显示友好提示
    if (!apiError?.response || apiError?.code === 'ERR_NETWORK' || apiError?.message?.includes('Network')) {
      console.warn('[generateOutline] 🌐 检测到网络错误，后端服务可能未启动')
      isLoading.value = false
      showError('无法连接后端服务', '请确保后端服务已启动并运行在 8003 端口')
      return
    }
  }

  // API返回了但数据为空，让用户重试，不走mock
  isLoading.value = false
}

// 清空所有
const clearAll = () => {
  if (confirm('确定要清空所有页面吗？')) {
    outline.slides = [{ id: generateId(), title: '', content: '', layout: 'content' as const }]
    activeSlide.value = 0
  }
}

// 生成PPT（两阶段模式）
const generatePPT = async () => {
  // 验证
  const emptySlides = outline.slides.filter(s => !s.title.trim())
  if (emptySlides.length > 0) {
    showWarning('请填写标题', '所有页面都需要填写标题才能生成PPT')
    return
  }

  isGenerating.value = true

  try {
    // 将大纲数据转换为预生成内容格式
    // content 在前端是字符串（\n 分隔），发到后端要转成数组
    const preGeneratedSlides = outline.slides.map(slide => ({
      title: slide.title,
      content: typeof slide.content === 'string'
        ? slide.content.split('\n').filter(line => line.trim())
        : slide.content,
      slide_type: slide.layout === 'title' ? 'title' : 'content',
      layout: slide.layout,
    }))

    const { api } = await import('../api/client')

    // Step 0: 先保存大纲到服务器（支持跨设备）
    await saveOutline()

    // Step 1: 调用 /generate API，将预生成内容传入，跳过 AI 内容规划
    // 使用 genOptions 中的完整参数配置
    const response = await api.ppt.createTask({
      user_request: route.query.request as string || 'PPT 生成',
      slide_count: outline.slides.length,
      scene: genOptions.scene as any,
      style: genOptions.style as any,
      template: genOptions.template as any,
      theme_color: genOptions.themeColor,
      pre_generated_slides: preGeneratedSlides as any,
      text_style: genOptions.textStyle as any,
      shadow_color: genOptions.shadowColor,
      overlay_transparency: genOptions.overlayTransparency,
      use_smart_layout: genOptions.useSmartLayout,
      font_title: genOptions.fontTitle,
      font_subtitle: genOptions.fontSubtitle,
      font_content: genOptions.fontContent,
      font_caption: genOptions.fontCaption,
      layout_mode: (genOptions.layoutMode as string) === '统一' ? 'auto' : genOptions.layoutMode,
      unified_layout: (genOptions.layoutMode as string) !== '统一',
      include_charts: false,
      generation_mode: genOptions.generationMode as any,
      output_format: genOptions.outputFormat as any,
      quality: genOptions.quality as any
    } as any)
    const taskId = response.data.task_id

    // 保存大纲到本地存储（备用）
    localStorage.setItem('ppt_outline', JSON.stringify(outline))

    // Step 2: 跳转到生成页面（显示"排版中"，内容阶段已跳过）
    showSuccess('开始生成', '正在跳转到大纲生成页面...')
    router.push({
      path: '/generating',
      query: { taskId }
    })
  } catch (e: any) {
    console.error('生成PPT失败详情:', e?.response?.data || e)
    const msg = e?.response?.data?.detail || e?.message || '请重试'
    showError('生成失败', typeof msg === 'object' ? JSON.stringify(msg) : msg)
    isGenerating.value = false
  }
}

// 保存大纲到服务器（支持跨设备）
const saveOutline = async () => {
  try {
    const { api } = await import('../api/client')
    const outlineData = {
      slides: outline.slides.map(s => ({
        title: s.title,
        content: s.content,
        layout: s.layout,
        slide_type: s.layout === 'title' ? 'title' : 'content',
      })),
      style: outline.style,
      scene: (route.query.scene as any) || 'business',
    }

    // 如果已有 taskId，更新大纲
    if ((window as any).__currentTaskId) {
      await api.ppt.saveOutline((window as any).__currentTaskId, outlineData)
      // removed: console.log('大纲已保存')
    } else {
      // 新建并保存
      const response = await api.ppt.commitOutline({
        user_request: route.query.request as string || 'PPT生成',
        slide_count: outlineData.slides.length,
        scene: outlineData.scene,
        style: outlineData.style,
        pre_generated_slides: outlineData.slides,
      })
      const taskId = response.data.task_id
      ;(window as any).__currentTaskId = taskId
      console.log('✅ 大纲已创建，taskId:', taskId)
    }

    // 同时保留 localStorage 备份
    localStorage.setItem('ppt_outline', JSON.stringify(outlineData))
  } catch (e) {
    console.warn('保存失败（仅本地）:', e)
  }
}

// R55: Watch active slide for layout detection
watch(activeSlide, () => {
  layoutSuggestions.value = []
  debouncedDetectLayout()
})

// Watch slide content changes for debounced layout detection
watch(
  () => outline.slides.map(s => s.title + '|' + s.content),
  () => {
    debouncedDetectLayout()
  },
  { deep: false }
)

// 页面加载时初始化
onMounted(async () => {
  // 读取 CreateView 传来的参数
  const passedStyle = route.query.style as string
  const passedScene = route.query.scene as string
  const passedTemplate = route.query.template as string
  const passedThemeColor = route.query.themeColor as string
  
  // 应用 CreateView 传来的所有参数
  if (passedStyle) {
    outline.style = passedStyle
    genOptions.style = passedStyle
  }
  if (passedScene) {
    genOptions.scene = passedScene
  }
  if (passedTemplate) {
    genOptions.template = passedTemplate
  }
  if (passedThemeColor) {
    outline.theme = passedThemeColor
    genOptions.themeColor = passedThemeColor
  }

  // 如果 URL 有 taskId，从服务器加载大纲
  const taskIdFromUrl = route.query.taskId as string
  if (taskIdFromUrl) {
    ;(window as any).__currentTaskId = taskIdFromUrl
    try {
      const { api } = await import('../api/client')
      const resp = await api.ppt.getOutline(taskIdFromUrl)
      if (resp.data && resp.data.outline) {
        // 用服务器大纲覆盖本地
        outline.slides = resp.data.outline.slides || []
        outline.style = resp.data.outline.style || outline.style
        outline.theme = resp.data.outline.theme || outline.theme
        console.log('✅ 大纲已从服务器加载')
        return
      }
    } catch (e) {
      console.warn('从服务器加载大纲失败:', e)
    }
  }

  // 检查是否有保存的大纲（localStorage 兜底）
  const savedOutline = localStorage.getItem('ppt_outline_temp')
  if (savedOutline) {
    const parsed = JSON.parse(savedOutline)
    // 优先用 URL 参数，兜底用 localStorage
    if (!passedStyle && parsed.style) outline.style = parsed.style
    if (!passedThemeColor && parsed.theme) outline.theme = parsed.theme
    // 读取完整生成选项到 genOptions
    if (parsed.scene) genOptions.scene = parsed.scene
    if (parsed.style) genOptions.style = parsed.style
    if (parsed.template) genOptions.template = parsed.template
    if (parsed.themeColor) genOptions.themeColor = parsed.themeColor
    if (parsed.fontTitle) genOptions.fontTitle = parsed.fontTitle
    if (parsed.fontSubtitle) genOptions.fontSubtitle = parsed.fontSubtitle
    if (parsed.fontContent) genOptions.fontContent = parsed.fontContent
    if (parsed.fontCaption) genOptions.fontCaption = parsed.fontCaption
    if (parsed.textStyle) genOptions.textStyle = parsed.textStyle
    if (parsed.shadowColor) genOptions.shadowColor = parsed.shadowColor
    if (parsed.overlayTransparency) genOptions.overlayTransparency = parsed.overlayTransparency
    if (parsed.useSmartLayout !== undefined) genOptions.useSmartLayout = parsed.useSmartLayout
    if (parsed.layoutMode) genOptions.layoutMode = parsed.layoutMode === '统一' ? 'auto' : parsed.layoutMode
    if (parsed.generationMode) genOptions.generationMode = parsed.generationMode
    if (parsed.outputFormat) genOptions.outputFormat = parsed.outputFormat
    if (parsed.quality) genOptions.quality = parsed.quality
    // 加载生成选项
    localStorage.removeItem('ppt_outline_temp')
    debugSrc.value = 'localStorage'
  }

  // 没有大纲时，直接调用 API 生成
  if (outline.slides.length === 0) {
    debugSrc.value = 'onMounted'
    await testAPI()
  }

  // 更新自动保存标签
  setInterval(updateAutoSaveLabel, 30000)
})

// 注册键盘快捷键
useKeyboardShortcuts([
  {
    key: 's',
    ctrl: true,
    handler: () => performSave(),
    description: '保存大纲 (Ctrl+S)'
  },
  {
    key: 'z',
    ctrl: true,
    handler: () => performUndo(),
    description: '撤销 (Ctrl+Z)'
  }
])
</script>

<style scoped>
.outline-edit-page {
  min-height: 100vh;
  background: var(--gray-100, #f5f5f5);
  padding: 24px;
}

.outline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* Auto-save indicator */
.auto-save-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #52c41a;
  background: #f6ffed;
  padding: 4px 12px;
  border-radius: 16px;
  border: 1px solid #b7eb8f;
  animation: fadeIn 0.3s ease;
}

.save-dot {
  width: 6px;
  height: 6px;
  background: #52c41a;
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

.save-dot.saving {
  background: #faad14;
  animation: pulse 0.5s ease-in-out infinite;
}

.save-label {
  font-weight: 500;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.btn-back {
  padding: 10px 16px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-back:hover {
  background: #f5f5f5;
}

.header-info .page-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.header-info .page-subtitle {
  font-size: 14px;
  color: #666;
  margin: 4px 0 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #165DFF;
  color: white;
}

.btn-primary:hover {
  background: #0e42d2;
}

.btn-primary:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}

.btn-outline {
  background: white;
  border: 1px solid #ddd;
  color: #333;
}

.btn-outline:hover {
  background: #f5f5f5;
}

/* 大纲预览 */
.outline-preview {
  background: white;
  border-radius: 12px;
  padding: 16px 24px;
  margin-bottom: 24px;
}

.outline-summary {
  display: flex;
  gap: 24px;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
}

.summary-icon {
  font-size: 16px;
}

/* 幻灯片列表 */
.slides-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.slides-list {
  display: contents;
}

.slide-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
  position: relative;
}

.slide-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.slide-card.active {
  border-color: #165DFF;
  box-shadow: 0 4px 16px rgba(22, 93, 255, 0.2);
}

.slide-number {
  position: absolute;
  top: -10px;
  left: -10px;
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
}

.slide-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.slide-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.slide-title-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 500;
  outline: none;
  transition: border-color 0.2s;
}

.slide-title-input:focus {
  border-color: #165DFF;
}

.btn-icon {
  padding: 6px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 14px;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.btn-icon:hover {
  opacity: 1;
}

.btn-delete:hover {
  color: #dc2626;
}

.slide-body {
  flex: 1;
}

.slide-content-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  font-size: 14px;
  line-height: 1.6;
  resize: vertical;
  outline: none;
  transition: border-color 0.2s;
  font-family: inherit;
}

.slide-content-input:focus {
  border-color: #165DFF;
}

.slide-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.layout-select {
  padding: 4px 8px;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  font-size: 12px;
  background: white;
  cursor: pointer;
}

.word-count {
  font-size: 12px;
  color: #999;
}

/* R55: Layout Suggestions Panel */
.layout-suggestions-panel {
  background: linear-gradient(135deg, #f0f5ff 0%, #fff9f0 100%);
  border-top: 1px solid #e8e0ff;
  padding: 10px 12px;
  margin-top: 4px;
}

.suggestions-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.suggestions-icon {
  font-size: 14px;
}

.suggestions-title {
  font-size: 12px;
  font-weight: 600;
  color: #165DFF;
}

.detecting-indicator {
  font-size: 11px;
  color: #999;
  margin-left: auto;
}

.content-type-badge {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
  background: #e6f0ff;
  color: #165DFF;
  border: 1px solid #d0e4ff;
}

.content-type-badge.small {
  padding: 1px 6px;
  font-size: 10px;
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.suggestion-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
  border: 1px solid #e8e0ff;
  border-radius: 8px;
  padding: 8px 10px;
  gap: 8px;
  transition: all 0.2s;
}

.suggestion-item:hover {
  border-color: #165DFF;
  box-shadow: 0 2px 8px rgba(22, 93, 255, 0.15);
}

.suggestion-item.primary {
  border-color: #165DFF;
  background: linear-gradient(135deg, #f0f5ff 0%, #ffffff 100%);
}

.suggestion-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.suggestion-name {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.suggestion-desc {
  font-size: 11px;
  color: #888;
}

.suggestion-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-apply-layout {
  padding: 4px 12px;
  background: #165DFF;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.btn-apply-layout:hover:not(:disabled) {
  background: #0e46d9;
  transform: scale(1.02);
}

.btn-apply-layout:disabled {
  background: #d0d7e8;
  color: #888;
  cursor: not-allowed;
}

.btn-dismiss-layout {
  width: 22px;
  height: 22px;
  border: 1px solid #e0e0e0;
  border-radius: 50%;
  background: white;
  color: #999;
  font-size: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-dismiss-layout:hover {
  background: #fff0f0;
  border-color: #ff9999;
  color: #ff6666;
}

.content-type-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  margin-top: 4px;
}

.hint-text {
  font-size: 11px;
  color: #bbb;
}

/* 添加页面卡片 */
.add-slide-card {
  background: white;
  border: 2px dashed #ddd;
  border-radius: 12px;
  padding: 40px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 200px;
}

.add-slide-card:hover {
  border-color: #165DFF;
  color: #165DFF;
}

.add-icon {
  font-size: 32px;
  font-weight: 300;
}

/* 快捷操作 */
.quick-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.quick-action {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-action:hover {
  background: #f9fafb;
  border-color: #165DFF;
}

.action-icon {
  font-size: 16px;
}

/* 动画 */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

/* 加载中 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  z-index: 100;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e5e5;
  border-top-color: #165DFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 移动端 */
@media (max-width: 768px) {
  .outline-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-left {
    flex-direction: column;
    align-items: stretch;
  }

  .header-actions {
    justify-content: stretch;
  }

  .header-actions .btn {
    flex: 1;
  }

  .slides-container {
    grid-template-columns: 1fr;
  }
}

/* 图表上传按钮 */
.chart-upload-btn {
  position: fixed;
  right: 20px;
  bottom: 100px;
  z-index: 100;
  background: linear-gradient(135deg, #165DFF, #4080FF);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 24px;
  box-shadow: 0 4px 12px rgba(22, 93, 255, 0.4);
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.chart-upload-btn:hover {
  background: linear-gradient(135deg, #4080FF, #50a0ff);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(22, 93, 255, 0.5);
}

/* 图表上传面板 */
.chart-upload-panel {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
  background: white;
  border-radius: 16px;
  padding: 24px;
  width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.panel-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  cursor: pointer;
  font-size: 20px;
  color: #999;
  padding: 4px 8px;
}

.close-btn:hover {
  color: #333;
}

.upload-area {
  border: 2px dashed #ddd;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  color: #666;
  font-size: 14px;
  margin-bottom: 16px;
  transition: all 0.2s;
}

.upload-area:hover {
  border-color: #165DFF;
  background: #f8faff;
  color: #165DFF;
}

.chart-type-selector {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.type-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  color: #666;
  background: #f5f5f5;
  transition: all 0.2s;
}

.type-btn:hover {
  border-color: #165DFF;
  color: #165DFF;
}

.type-btn.active {
  background: #165DFF;
  color: white;
  border-color: #165DFF;
}

.column-selector {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.selector-label {
  font-size: 14px;
  color: #333;
  min-width: 70px;
}

.column-select {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  color: #333;
}

.preview-table {
  margin: 16px 0;
}

.preview-title {
  font-size: 14px;
  color: #666;
  display: block;
  margin-bottom: 8px;
}

.preview-table table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.preview-table th,
.preview-table td {
  border: 1px solid #eee;
  padding: 6px 8px;
  text-align: left;
}

.preview-table th {
  background: #f5f5f5;
  font-weight: 600;
  color: #333;
}

.preview-table td {
  color: #666;
}

.generate-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #165DFF, #4080FF);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 16px;
  transition: all 0.2s;
}

.generate-btn:hover {
  background: linear-gradient(135deg, #4080FF, #50a0ff);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(22, 93, 255, 0.3);
}

/* 参数配置面板 */
.config-panel {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.config-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.config-panel-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.config-panel-header .close-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f5f5f5;
  border: none;
  cursor: pointer;
  font-size: 16px;
  color: #666;
  transition: all 0.2s;
}

.config-panel-header .close-btn:hover {
  background: #e5e5e5;
  color: #333;
}

.config-panel-body {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.config-section {
  margin-bottom: 16px;
}

.config-section .config-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.config-section .config-label input[type="checkbox"] {
  margin-right: 8px;
}

.config-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  color: #333;
  background: white;
  cursor: pointer;
  transition: border-color 0.2s;
}

.config-select:hover {
  border-color: #165DFF;
}

.config-select:focus {
  outline: none;
  border-color: #165DFF;
  box-shadow: 0 0 0 2px rgba(22, 93, 255, 0.1);
}

/* 模板选择 */
.template-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.template-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  border: 2px solid #eee;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.template-card:hover {
  border-color: #ddd;
}

.template-card.active {
  border-color: #165DFF;
  background: #f0f7ff;
}

.template-preview {
  width: 100%;
  aspect-ratio: 16/9;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 6px;
}

.template-icon {
  font-size: 20px;
}

.template-name {
  font-size: 12px;
  color: #333;
}

.template-card.active .template-name {
  color: #165DFF;
  font-weight: 500;
}

/* 主题色 */
.theme-colors {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.theme-color {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid transparent;
  transition: all 0.2s;
}

.theme-color:hover {
  transform: scale(1.1);
}

.theme-color.active {
  border-color: #333;
}

.theme-color .check {
  color: white;
  font-weight: bold;
  font-size: 14px;
}

/* 字体网格 */
.font-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.font-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.font-label {
  font-size: 12px;
  color: #666;
}

/* ============ Mobile Responsive Enhancements ============ */
@media (max-width: 767px) {
  .config-panel {
    border-radius: 20px 20px 0 0;
    margin-bottom: 0;
    padding: 20px 16px;
    max-height: 80vh;
    overflow-y: auto;
  }

  .config-panel-body {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .chart-upload-panel {
    width: 100% !important;
    max-width: 100vw !important;
    height: 80vh !important;
    border-radius: 20px 20px 0 0 !important;
    top: auto !important;
    bottom: 0 !important;
    left: 0 !important;
    transform: none !important;
    overflow-y: auto;
  }

  .slides-container {
    grid-template-columns: 1fr !important;
    gap: 12px !important;
  }

  .slide-card {
    padding: 12px !important;
  }

  .outline-header {
    padding: 12px !important;
  }

  .header-actions .btn {
    padding: 8px 12px;
    font-size: 13px;
  }
}

@media (min-width: 768px) and (max-width: 1024px) {
  .config-panel-body {
    grid-template-columns: repeat(2, 1fr);
  }

  .slides-container {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}
</style>
