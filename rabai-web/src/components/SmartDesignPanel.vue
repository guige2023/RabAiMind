<template>
  <div class="smart-design-overlay" @click.self="closePanel">
    <div class="smart-design-panel">
      <div class="panel-header">
        <div class="header-title">
          <span class="title-icon">✨</span>
          <h3>智能设计</h3>
        </div>
        <div class="header-subtitle">AI 驱动的自动化设计增强</div>
        <button class="panel-close-btn" @click="closePanel">✕</button>
      </div>

      <div class="panel-body">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>{{ loadingText }}</p>
        </div>

        <!-- 五大功能模块 -->
        <div v-else class="features-grid">
          <!-- 1. Auto-layout -->
          <div class="feature-card feature-auto-layout" @click="runAutoLayout">
            <div class="feature-icon">📐</div>
            <div class="feature-info">
              <div class="feature-name">自动布局</div>
              <div class="feature-desc">AI 分析内容，智能推荐最佳布局</div>
            </div>
            <button class="feature-run-btn" :disabled="loading">🚀 启动</button>
          </div>

          <!-- 2. Content-aware resize -->
          <div class="feature-card feature-content-resize">
            <div class="feature-icon">📐</div>
            <div class="feature-info">
              <div class="feature-name">内容感知缩放</div>
              <div class="feature-desc">元素自动适应内容变化</div>
            </div>
            <div class="feature-controls">
              <select v-model="resizeMode" class="resize-mode-select">
                <option value="auto">自动匹配</option>
                <option value="text">文字优先</option>
                <option value="image">图片优先</option>
              </select>
              <button class="feature-run-btn" @click="runContentResize" :disabled="loading">🚀 启动</button>
            </div>
          </div>

          <!-- 3. Smart spacing -->
          <div class="feature-card feature-smart-spacing">
            <div class="feature-icon">↔️</div>
            <div class="feature-info">
              <div class="feature-name">智能间距</div>
              <div class="feature-desc">统一元素间距，保持视觉一致性</div>
            </div>
            <div class="spacing-presets">
              <button
                v-for="sp in spacingPresets"
                :key="sp.value"
                class="spacing-preset-btn"
                :class="{ active: activeSpacingPreset === sp.value }"
                @click="applySpacingPreset(sp.value)"
              >{{ sp.label }}</button>
            </div>
          </div>

          <!-- 4. Alignment guides -->
          <div class="feature-card feature-alignment">
            <div class="feature-icon">⊞</div>
            <div class="feature-info">
              <div class="feature-name">对齐辅助线</div>
              <div class="feature-desc">吸附网格 + 智能对齐引导线</div>
            </div>
            <div class="toggle-row">
              <label class="toggle-label">
                <input type="checkbox" v-model="guidesEnabled" @change="toggleGuides" class="toggle-input" />
                <span class="toggle-switch"></span>
                <span class="toggle-text">{{ guidesEnabled ? '已开启' : '已关闭' }}</span>
              </label>
            </div>
          </div>

          <!-- 5. One-click beautify -->
          <div class="feature-card feature-beautify" @click="runBeautify">
            <div class="feature-icon">🎨</div>
            <div class="feature-info">
              <div class="feature-name">一键美化</div>
              <div class="feature-desc">AI 优化配色、字体和视觉层次</div>
            </div>
            <button class="feature-run-btn beautify-btn" :disabled="loading">✨ 美化</button>
          </div>

          <!-- R93: 6. Smart placeholder (内容类型自动检测 + 布局推荐) -->
          <div class="feature-card feature-smart-placeholder" @click="detectContentType">
            <div class="feature-icon">🔮</div>
            <div class="feature-info">
              <div class="feature-name">智能占位符</div>
              <div class="feature-desc">自动识别内容类型，智能推荐布局</div>
            </div>
            <button class="feature-run-btn ai-btn" :disabled="loading">🔍 识别</button>
          </div>
        </div>

        <!-- 美化结果预览 -->
        <div v-if="beautifyResult" class="beautify-result">
          <div class="result-header">
            <span>🎨 美化建议</span>
            <button class="apply-btn" @click="applyBeautify">✅ 应用</button>
            <button class="dismiss-btn" @click="beautifyResult = null">✕</button>
          </div>
          <div class="result-body">
            <div v-if="beautifyResult.improved_color_scheme" class="result-item">
              <span class="result-label">配色方案</span>
              <div class="color-swatches">
                <span
                  v-for="(c, i) in beautifyResult.improved_color_scheme"
                  :key="i"
                  class="result-swatch"
                  :style="{ background: c }"
                ></span>
              </div>
            </div>
            <div v-if="beautifyResult.suggested_font" class="result-item">
              <span class="result-label">推荐字体</span>
              <span class="result-value">{{ beautifyResult.suggested_font }}</span>
            </div>
            <div v-if="beautifyResult.suggested_spacing" class="result-item">
              <span class="result-label">间距建议</span>
              <span class="result-value">{{ beautifyResult.suggested_spacing }}</span>
            </div>
          </div>
        </div>

        <!-- R93: 内容类型检测结果 + 多个布局建议 -->
        <div v-if="contentTypeResult" class="content-type-result">
          <div class="result-header">
            <span>🔮 智能识别结果</span>
            <button class="dismiss-btn" @click="contentTypeResult = null">✕</button>
          </div>
          <!-- 内容类型标签 -->
          <div class="content-type-info">
            <span class="content-type-badge" :class="'type-' + contentTypeResult.content_type">
              {{ contentTypeResult.content_type_display }}
            </span>
            <span class="content-meta">
              密度: {{ contentTypeResult.density }}/10 | 元素: {{ contentTypeResult.element_count }}个
            </span>
            <span v-if="contentTypeResult.has_timeline" class="meta-tag">⏰ 时间线</span>
            <span v-if="contentTypeResult.has_comparison" class="meta-tag">⚖️ 对比</span>
          </div>
          <!-- 关键词 -->
          <div v-if="contentTypeResult.keywords?.length > 0" class="keywords-row">
            <span v-for="kw in contentTypeResult.keywords.slice(0, 5)" :key="kw" class="keyword-chip">{{ kw }}</span>
          </div>
          <!-- 布局推荐 -->
          <div class="layout-suggestions-list">
            <div class="suggestions-header">
              <span class="suggestions-title">📐 推荐布局</span>
              <span class="suggestions-hint">点击应用，或查看详情</span>
            </div>
            <div
              v-for="(suggestion, idx) in contentTypeResult.suggestions"
              :key="suggestion.type"
              class="layout-suggestion-item"
              :class="{ primary: suggestion.is_primary, selected: selectedSuggestionIdx === idx }"
              @click="applyLayoutSuggestion(suggestion, contentTypeResult.content_type)"
            >
              <div class="suggestion-rank">
                <span v-if="suggestion.is_primary" class="rank-badge primary">⭐ 推荐</span>
                <span v-else class="rank-badge">#{{ idx + 1 }}</span>
              </div>
              <div class="suggestion-info">
                <span class="suggestion-name">{{ suggestion.name }}</span>
                <span class="suggestion-desc">{{ suggestion.description }}</span>
              </div>
              <div class="suggestion-confidence">
                <span class="confidence-value">{{ Math.round(suggestion.confidence * 100) }}%</span>
                <div class="confidence-bar">
                  <div class="confidence-fill" :style="{ width: (suggestion.confidence * 100) + '%' }"></div>
                </div>
              </div>
              <button class="suggestion-apply-btn" :class="{ primary: suggestion.is_primary }">
                {{ suggestion.is_primary ? '✅ 一键应用' : '应用' }}
              </button>
            </div>
          </div>
          <!-- 适用场景 -->
          <div class="typical-use-section">
            <span class="typical-use-label">适用场景:</span>
            <span class="typical-use-list">
              {{ getTypicalUse(contentTypeResult.primary_layout) }}
            </span>
          </div>
        </div>

        <!-- 旧版布局建议结果（兼容）-->
        <div v-if="layoutResult && !contentTypeResult" class="layout-result">
          <div class="result-header">
            <span>📐 布局建议</span>
            <button class="apply-btn" @click="applyLayoutResult(contentTypeResult?.content_type)">✅ 应用</button>
            <button class="dismiss-btn" @click="layoutResult = null">✕</button>
          </div>
          <div class="layout-type-badge">{{ layoutResult.layout_type }}</div>
          <p class="layout-reason">{{ layoutResult.reason }}</p>
        </div>

        <!-- 缩放结果 -->
        <div v-if="resizeResult" class="resize-result">
          <div class="result-header">
            <span>📐 内容缩放结果</span>
            <button class="apply-btn" @click="applyResizeResult">✅ 应用</button>
            <button class="dismiss-btn" @click="resizeResult = null">✕</button>
          </div>
          <p class="resize-summary">{{ resizeResult.summary }}</p>
        </div>
      </div>

      <div class="panel-footer">
        <button class="btn btn-outline" @click="closePanel">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import api from '../api/client'

const props = defineProps<{
  show: boolean
  slides?: any[]         // 当前幻灯片数据
  currentSlideIndex?: number
  taskId?: string
  previewSlides?: any[]
}>()

const emit = defineEmits(['close', 'apply', 'toggle-guides', 'spacing-change', 'resize'])

const loading = ref(false)
const loadingText = ref('')
const guidesEnabled = ref(true)
const activeSpacingPreset = ref('standard')

const beautifyResult = ref<any>(null)
const layoutResult = ref<any>(null)
const resizeResult = ref<any>(null)
const resizeMode = ref('auto')

// R93: Smart placeholder - 内容类型检测结果
const contentTypeResult = ref<any>(null)
const selectedSuggestionIdx = ref(0)

const spacingPresets = [
  { value: 'compact', label: '紧凑' },
  { value: 'standard', label: '标准' },
  { value: 'loose', label: '宽松' },
]

// ============= 1. Auto-layout =============
const runAutoLayout = async () => {
  if (!props.slides || props.slides.length === 0) return
  loading.value = true
  loadingText.value = 'AI 分析布局中...'
  try {
    const slideIndex = props.currentSlideIndex ?? 0
    const slide = props.slides[slideIndex] ?? props.slides[0]
    const elements = slide?.elements ?? []
    const content = elements.map((e: any) => e.content || '').join(' ')

    const res = await api.ai.layoutSuggestion({
      slideIndex,
      elements,
      slideContent: content
    })
    if (res.data.success) {
      layoutResult.value = res.data.suggestion
    } else {
      alert('布局建议失败')
    }
  } catch (e: any) {
    console.error('布局建议失败', e)
    alert('布局建议失败: ' + (e?.message || '未知错误'))
  } finally {
    loading.value = false
    loadingText.value = ''
  }
}

// R93: Apply layout from auto-layout result
const applyLayoutResult = (contentType?: string) => {
  if (!layoutResult.value) return
  // R93: Record layout preference for template learning
  recordLayoutPreference(layoutResult.value.layout_type, contentType || 'content')
  emit('apply', { type: 'layout', data: layoutResult.value })
  layoutResult.value = null
}

// R93: Smart placeholder - 内容类型自动检测
const detectContentType = async () => {
  if (!props.slides || props.slides.length === 0) return
  loading.value = true
  loadingText.value = '🔍 智能识别内容类型...'
  try {
    const slideIndex = props.currentSlideIndex ?? 0
    const slide = props.slides[slideIndex] ?? props.slides[0]
    const elements = slide?.elements ?? []
    const content = elements.map((e: any) => e.content || '').join(' ')
    const title = slide?.title || ''

    // R93: 调用内容类型检测API
    const res = await api.ppt.suggestLayouts({ title, content })
    if (res.data.success) {
      contentTypeResult.value = res.data
    } else {
      alert('内容类型识别失败')
    }
  } catch (e: any) {
    console.error('内容类型识别失败', e)
    alert('内容类型识别失败: ' + (e?.message || '未知错误'))
  } finally {
    loading.value = false
    loadingText.value = ''
  }
}

// R93: 获取布局适用场景
const LAYOUT_TYPICAL_USE: Record<string, string> = {
  title_slide: 'PPT封面、章节标题页、开场介绍',
  content_card: '功能介绍、特点展示、优势说明、步骤说明',
  two_column: '并列说明、优缺点对比、方案对比、原因分析',
  center_radiation: '思维导图、核心概念展开、主要组成、关键要素',
  timeline: '发展历程、项目里程碑、历史演进、计划安排',
  data_visualization: '数据分析、统计报告、市场调研、业绩展示',
  quote: '名人名言、核心观点、关键引用、总结升华',
  comparison: '方案对比、优劣势分析、新旧对比、前后对比',
}

const getTypicalUse = (layoutType: string) => {
  return LAYOUT_TYPICAL_USE[layoutType] || '通用布局'
}

// R93: 应用选中的布局建议（一键应用）
const applyLayoutSuggestion = async (suggestion: any, detectedContentType: string) => {
  if (!suggestion) return
  // R93: 记录布局偏好用于模板学习
  await recordLayoutPreference(suggestion.type, detectedContentType)
  // 构建完整的布局数据
  const layoutData = {
    layout_type: suggestion.type,
    reason: `基于「${suggestion.name}」推荐的${suggestion.is_primary ? '首选' : '备选'}布局`,
    suggested_alignments: [],
    confidence: suggestion.confidence,
  }
  emit('apply', { type: 'layout', data: layoutData })
  contentTypeResult.value = null
}

// R93: 记录布局偏好（模板学习）
async function recordLayoutPreference(layoutType: string, contentType: string) {
  try {
    await api.template.saveLayoutPreference({
      layout_type: layoutType,
      content_type: contentType,
      action: 'apply',
      user_id: 'anonymous',
    })
  } catch (e) {
    // 后台静默记录，不影响主流程
    console.warn('[SmartDesignPanel] 记录布局偏好失败:', e)
  }
}

// ============= 2. Content-aware resize =============
const runContentResize = async () => {
  if (!props.slides || props.slides.length === 0) return
  loading.value = true
  loadingText.value = '内容感知缩放中...'
  try {
    const slideIndex = props.currentSlideIndex ?? 0
    const slide = props.slides[slideIndex] ?? props.slides[0]
    const elements = slide?.elements ?? []

    // AI 分析每个元素的最佳尺寸
    const content = elements.map((e: any) => e.content || '').join(' ')
    const res = await api.ai.layoutSuggestion({
      slideIndex,
      elements,
      slideContent: content
    })

    if (res.data.success) {
      const suggestion = res.data.suggestion
      // 根据 AI 建议计算元素新尺寸
      const suggested = suggestion.suggested_alignments || []
      const result = {
        mode: resizeMode.value,
        elements: elements.map((el: any, i: number) => {
          const sug = suggested[i] || {}
          return {
            id: el.id,
            originalWidth: el.width,
            originalHeight: el.height,
            suggestedWidth: sug.width || el.width,
            suggestedHeight: sug.height || el.height,
            content: el.content,
            type: el.type
          }
        }),
        summary: suggestion.reason || '已根据内容长度自动调整元素尺寸'
      }
      resizeResult.value = result
    } else {
      alert('内容缩放失败')
    }
  } catch (e: any) {
    console.error('内容缩放失败', e)
    alert('内容缩放失败: ' + (e?.message || '未知错误'))
  } finally {
    loading.value = false
    loadingText.value = ''
  }
}

const applyResizeResult = () => {
  if (!resizeResult.value) return
  emit('apply', { type: 'resize', data: resizeResult.value })
  resizeResult.value = null
}

// ============= 3. Smart spacing =============
const applySpacingPreset = (preset: string) => {
  activeSpacingPreset.value = preset
  const scale = preset === 'compact' ? 0.8 : preset === 'loose' ? 1.2 : 1
  emit('spacing-change', { preset, scale })
}

// ============= 4. Alignment guides =============
const toggleGuides = () => {
  emit('toggle-guides', guidesEnabled.value)
}

// ============= 5. One-click beautify =============
const runBeautify = async () => {
  if (!props.slides || props.slides.length === 0) return
  loading.value = true
  loadingText.value = 'AI 美化中...'
  try {
    const slideIndex = props.currentSlideIndex ?? 0
    const slide = props.slides[slideIndex] ?? props.slides[0]
    const elements = slide?.elements ?? []

    const res = await api.ai.autoEnhance({
      slideIndex,
      elements,
      colorScheme: '#165DFF'
    })
    if (res.data.success) {
      beautifyResult.value = res.data.enhancement
    } else {
      alert('美化失败')
    }
  } catch (e: any) {
    console.error('美化失败', e)
    alert('美化失败: ' + (e?.message || '未知错误'))
  } finally {
    loading.value = false
    loadingText.value = ''
  }
}

const applyBeautify = () => {
  if (!beautifyResult.value) return
  emit('apply', { type: 'beautify', data: beautifyResult.value })
  beautifyResult.value = null
}

const closePanel = () => {
  loading.value = false
  loadingText.value = ''
  beautifyResult.value = null
  layoutResult.value = null
  resizeResult.value = null
  contentTypeResult.value = null
  selectedSuggestionIdx.value = 0
  emit('close')
}
</script>

<style scoped>
.smart-design-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.smart-design-panel {
  background: #fff;
  border-radius: 16px;
  width: 580px;
  max-width: 95vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.panel-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  position: relative;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-icon {
  font-size: 24px;
}

.header-title h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.header-subtitle {
  margin-left: 16px;
  font-size: 13px;
  opacity: 0.85;
}

.panel-close-btn {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255,255,255,0.2);
  border: none;
  color: #fff;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.panel-close-btn:hover {
  background: rgba(255,255,255,0.3);
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.loading-state {
  text-align: center;
  padding: 40px;
  color: #666;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e0e0e0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.features-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.feature-card {
  border: 1.5px solid #e8e8e8;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  transition: all 0.2s;
  background: #fff;
}

.feature-card:hover {
  border-color: #667eea;
  box-shadow: 0 2px 12px rgba(102, 126, 234, 0.15);
}

.feature-icon {
  font-size: 28px;
  width: 48px;
  height: 48px;
  background: #f5f5fa;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.feature-info {
  flex: 1;
}

.feature-name {
  font-weight: 600;
  font-size: 15px;
  color: #222;
}

.feature-desc {
  font-size: 12px;
  color: #888;
  margin-top: 3px;
}

.feature-run-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  border-radius: 20px;
  padding: 6px 16px;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.2s;
}

.feature-run-btn:hover {
  opacity: 0.85;
}

.feature-run-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.beautify-btn {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

/* R93: AI smart button */
.feature-run-btn.ai-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.feature-run-btn.ai-btn:hover {
  opacity: 0.85;
}

.feature-run-btn.ai-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* R93: Content Type Result */
.content-type-result {
  margin-top: 16px;
  border: 1.5px solid #667eea;
  border-radius: 12px;
  overflow: hidden;
}

.result-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
}

.apply-btn {
  margin-left: auto;
  background: rgba(255,255,255,0.25);
  border: none;
  color: #fff;
  border-radius: 6px;
  padding: 4px 12px;
  cursor: pointer;
  font-size: 13px;
}

.apply-btn:hover {
  background: rgba(255,255,255,0.4);
}

.dismiss-btn {
  background: rgba(255,255,255,0.2);
  border: none;
  color: #fff;
  border-radius: 6px;
  width: 28px;
  height: 28px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dismiss-btn:hover {
  background: rgba(255,255,255,0.4);
}

/* R93: Content type info */
.content-type-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  flex-wrap: wrap;
}

.content-type-badge {
  padding: 4px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.content-type-badge.type-title_slide { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); }
.content-type-badge.type-quote { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
.content-type-badge.type-timeline { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.content-type-badge.type-comparison { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); }
.content-type-badge.type-data { background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); }
.content-type-badge.type-content { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }

.content-meta {
  font-size: 12px;
  color: #888;
}

.meta-tag {
  background: #f0f0f5;
  color: #667eea;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
}

/* R93: Keywords */
.keywords-row {
  display: flex;
  gap: 6px;
  padding: 0 16px 12px;
  flex-wrap: wrap;
}

.keyword-chip {
  background: #f0f0f5;
  color: #555;
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 11px;
}

/* R93: Layout suggestions list */
.layout-suggestions-list {
  padding: 0 16px 12px;
}

.suggestions-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.suggestions-title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.suggestions-hint {
  font-size: 11px;
  color: #aaa;
  margin-left: auto;
}

.layout-suggestion-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1.5px solid #e8e8e8;
  border-radius: 10px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: #fff;
}

.layout-suggestion-item:hover {
  border-color: #667eea;
  background: #f8f8ff;
}

.layout-suggestion-item.primary {
  border-color: #667eea;
  background: linear-gradient(135deg, #f0f5ff 0%, #f8f8ff 100%);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
}

.layout-suggestion-item.selected {
  border-color: #667eea;
  background: #f0f0ff;
}

.suggestion-rank {
  min-width: 50px;
}

.rank-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 11px;
  background: #f0f0f5;
  color: #666;
}

.rank-badge.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.suggestion-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.suggestion-name {
  font-size: 13px;
  font-weight: 600;
  color: #222;
}

.suggestion-desc {
  font-size: 11px;
  color: #888;
}

.suggestion-confidence {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  min-width: 60px;
}

.confidence-value {
  font-size: 12px;
  font-weight: 600;
  color: #667eea;
}

.confidence-bar {
  width: 50px;
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  overflow: hidden;
}

.confidence-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 2px;
  transition: width 0.3s;
}

.suggestion-apply-btn {
  background: #f0f0f5;
  border: none;
  border-radius: 6px;
  padding: 5px 12px;
  font-size: 12px;
  cursor: pointer;
  color: #555;
  transition: all 0.2s;
  white-space: nowrap;
}

.suggestion-apply-btn:hover {
  background: #e0e0ee;
}

.suggestion-apply-btn.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.suggestion-apply-btn.primary:hover {
  opacity: 0.85;
}

/* R93: Typical use */
.typical-use-section {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #f8f8ff;
  border-top: 1px solid #eee;
}

.typical-use-label {
  font-size: 12px;
  color: #888;
  white-space: nowrap;
}

.typical-use-list {
  font-size: 12px;
  color: #555;
}

.feature-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.resize-mode-select {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 5px 10px;
  font-size: 13px;
  background: #fafafa;
  cursor: pointer;
}

.spacing-presets {
  display: flex;
  gap: 6px;
}

.spacing-preset-btn {
  background: #f0f0f5;
  border: 1px solid #ddd;
  border-radius: 16px;
  padding: 4px 12px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.spacing-preset-btn.active {
  background: #667eea;
  color: #fff;
  border-color: #667eea;
}

.spacing-preset-btn:hover:not(.active) {
  background: #e8e8f5;
}

/* Toggle */
.toggle-row {
  display: flex;
  align-items: center;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.toggle-input {
  display: none;
}

.toggle-switch {
  width: 40px;
  height: 22px;
  background: #ccc;
  border-radius: 11px;
  position: relative;
  transition: background 0.2s;
}

.toggle-switch::after {
  content: '';
  position: absolute;
  width: 18px;
  height: 18px;
  background: #fff;
  border-radius: 50%;
  top: 2px;
  left: 2px;
  transition: transform 0.2s;
}

.toggle-input:checked + .toggle-switch {
  background: #667eea;
}

.toggle-input:checked + .toggle-switch::after {
  transform: translateX(18px);
}

.toggle-text {
  font-size: 12px;
  color: #888;
}

/* Results */
.beautify-result,
.layout-result,
.resize-result {
  margin-top: 16px;
  border: 1.5px solid #667eea;
  border-radius: 12px;
  overflow: hidden;
}

/* R93: result-header/apply-btn/dismiss-btn defined in R93 section above */

.result-body {
  padding: 14px 16px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.result-label {
  font-size: 13px;
  color: #888;
  min-width: 80px;
}

.result-value {
  font-size: 13px;
  color: #333;
  font-weight: 500;
}

.color-swatches {
  display: flex;
  gap: 6px;
}

.result-swatch {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid rgba(0,0,0,0.1);
  display: inline-block;
}

.layout-type-badge {
  display: inline-block;
  background: #f0f0f5;
  color: #667eea;
  border-radius: 20px;
  padding: 4px 14px;
  font-size: 13px;
  font-weight: 600;
  margin: 12px 16px 8px;
}

.layout-reason,
.resize-summary {
  font-size: 13px;
  color: #555;
  padding: 0 16px 14px;
  line-height: 1.5;
}

.panel-footer {
  padding: 14px 24px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn {
  border-radius: 8px;
  padding: 8px 20px;
  font-size: 14px;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-outline {
  background: #fff;
  border: 1.5px solid #ddd;
  color: #555;
}

.btn-outline:hover {
  border-color: #667eea;
  color: #667eea;
}
</style>
