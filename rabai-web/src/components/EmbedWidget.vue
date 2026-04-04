<template>
  <div v-if="show" class="modal-mask" @click.self="$emit('close')">
    <div class="embed-modal">
      <div class="modal-header">
        <h3>🔗 嵌入代码生成器</h3>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="modal-body">
        <!-- Embed Type Tabs -->
        <div class="embed-tabs">
          <button
            v-for="tab in embedTabs"
            :key="tab.id"
            class="tab-btn"
            :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            <span class="tab-icon">{{ tab.icon }}</span>
            <span class="tab-label">{{ tab.label }}</span>
          </button>
        </div>

        <!-- Presentation Widget (Iframe) -->
        <div v-if="activeTab === 'iframe'" class="tab-content">
          <div class="config-section">
            <h4 class="section-title">📐 尺寸配置</h4>
            <div class="config-grid">
              <div class="config-item">
                <label>宽度</label>
                <select v-model="iframeConfig.width" class="form-select">
                  <option value="320px">320px（小程序）</option>
                  <option value="640px">640px（中等）</option>
                  <option value="800px">800px（标准）</option>
                  <option value="960px">960px（大）</option>
                  <option value="100%">100%（响应式）</option>
                </select>
              </div>
              <div class="config-item">
                <label>高度</label>
                <select v-model="iframeConfig.height" class="form-select">
                  <option value="240px">240px（迷你）</option>
                  <option value="360px">360px（紧凑）</option>
                  <option value="480px">480px（中等）</option>
                  <option value="600px">600px（标准）</option>
                  <option value="720px">720px（高清）</option>
                  <option value="100vh">100vh（全屏）</option>
                </select>
              </div>
            </div>

            <div class="config-item">
              <label>预设尺寸</label>
              <div class="size-presets">
                <button
                  v-for="preset in sizePresets"
                  :key="preset.label"
                  class="preset-chip"
                  :class="{ active: iframeConfig.width === preset.width && iframeConfig.height === preset.height }"
                  @click="applySizePreset(preset)"
                >
                  {{ preset.label }}
                </button>
              </div>
            </div>
          </div>

          <div class="config-section">
            <h4 class="section-title">🎨 主题</h4>
            <div class="theme-options">
              <label class="theme-option" :class="{ active: iframeConfig.theme === 'light' }">
                <input type="radio" v-model="iframeConfig.theme" value="light" />
                <span class="theme-preview light-preview">☀️ 浅色</span>
              </label>
              <label class="theme-option" :class="{ active: iframeConfig.theme === 'dark' }">
                <input type="radio" v-model="iframeConfig.theme" value="dark" />
                <span class="theme-preview dark-preview">🌙 深色</span>
              </label>
              <label class="theme-option" :class="{ active: iframeConfig.theme === 'auto' }">
                <input type="radio" v-model="iframeConfig.theme" value="auto" />
                <span class="theme-preview auto-preview">🔄 自动</span>
              </label>
            </div>
          </div>

          <div class="config-section">
            <h4 class="section-title">⚙️ 播放器选项</h4>
            <label class="toggle-row">
              <input type="checkbox" v-model="iframeConfig.showControls" />
              <span>显示控制栏</span>
            </label>
            <label class="toggle-row">
              <input type="checkbox" v-model="iframeConfig.autoSlideEnabled" />
              <span>自动轮播</span>
            </label>
            <div v-if="iframeConfig.autoSlideEnabled" class="sub-config">
              <label>每页停留（秒）</label>
              <input type="number" v-model.number="iframeConfig.autoSlideInterval" min="2" max="60" class="form-input inline-input" />
            </div>
            <div class="sub-config">
              <label>起始页</label>
              <input type="number" v-model.number="iframeConfig.startSlide" min="1" :max="slideCount" class="form-input inline-input" />
            </div>
          </div>

          <!-- Live Preview -->
          <div class="preview-section">
            <h4 class="section-title">👁 效果预览</h4>
            <div class="iframe-preview-box" :style="{ width: previewWidth, height: previewHeight }">
              <div class="preview-placeholder">
                <span style="font-size: 32px;">📊</span>
                <p>{{ slideCount }} 页演示文稿</p>
                <p style="font-size: 11px; color: #888;">{{ previewWidth }} × {{ previewHeight }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Single Slide Embed -->
        <div v-if="activeTab === 'slide'" class="tab-content">
          <div class="config-section">
            <h4 class="section-title">📑 选择幻灯片</h4>
            <div class="slide-selector">
              <div class="slide-grid">
                <div
                  v-for="slideNum in slideCount"
                  :key="slideNum"
                  class="slide-thumb"
                  :class="{ active: slideConfig.selectedSlide === slideNum }"
                  @click="slideConfig.selectedSlide = slideNum"
                >
                  <div class="slide-thumb-number">{{ slideNum }}</div>
                </div>
              </div>
              <div class="slide-input-row">
                <label>直接输入页码：</label>
                <input
                  type="number"
                  v-model.number="slideConfig.selectedSlide"
                  min="1"
                  :max="slideCount"
                  class="form-input inline-input"
                />
              </div>
            </div>
          </div>

          <div class="config-section">
            <h4 class="section-title">📐 尺寸配置</h4>
            <div class="config-grid">
              <div class="config-item">
                <label>宽度</label>
                <select v-model="slideConfig.width" class="form-select">
                  <option value="320px">320px</option>
                  <option value="480px">480px</option>
                  <option value="640px">640px</option>
                  <option value="800px">800px</option>
                  <option value="960px">960px</option>
                  <option value="100%">100%</option>
                </select>
              </div>
              <div class="config-item">
                <label>高度</label>
                <select v-model="slideConfig.height" class="form-select">
                  <option value="180px">180px</option>
                  <option value="270px">270px（16:9）</option>
                  <option value="360px">360px（16:9）</option>
                  <option value="540px">540px（16:9）</option>
                  <option value="720px">720px（16:9）</option>
                </select>
              </div>
            </div>
          </div>

          <div class="config-section">
            <h4 class="section-title">🎨 主题</h4>
            <div class="theme-options">
              <label class="theme-option" :class="{ active: slideConfig.theme === 'light' }">
                <input type="radio" v-model="slideConfig.theme" value="light" />
                <span class="theme-preview light-preview">☀️ 浅色</span>
              </label>
              <label class="theme-option" :class="{ active: slideConfig.theme === 'dark' }">
                <input type="radio" v-model="slideConfig.theme" value="dark" />
                <span class="theme-preview dark-preview">🌙 深色</span>
              </label>
            </div>
          </div>

          <div class="config-section">
            <h4 class="section-title">⚙️ 交互选项</h4>
            <label class="toggle-row">
              <input type="checkbox" v-model="slideConfig.interactive" />
              <span>启用交互（允许点击导航）</span>
            </label>
          </div>
        </div>

        <!-- Floating Button -->
        <div v-if="activeTab === 'floating_button'" class="tab-content">
          <div class="config-section">
            <h4 class="section-title">📍 按钮位置</h4>
            <div class="position-grid">
              <label
                v-for="pos in positionOptions"
                :key="pos.value"
                class="position-option"
                :class="{ active: floatingConfig.position === pos.value }"
              >
                <input type="radio" v-model="floatingConfig.position" :value="pos.value" />
                <span>{{ pos.label }}</span>
              </label>
            </div>
          </div>

          <div class="config-section">
            <h4 class="section-title">🎨 按钮样式</h4>
            <div class="color-presets">
              <button
                v-for="color in buttonColors"
                :key="color.value"
                class="color-dot"
                :style="{ background: color.value }"
                :title="color.label"
                :class="{ active: floatingConfig.buttonColor === color.value }"
                @click="floatingConfig.buttonColor = color.value"
              ></button>
            </div>
            <div class="sub-config">
              <label>自定义颜色</label>
              <div class="color-input-row">
                <input type="color" v-model="floatingConfig.buttonColor" class="color-picker-sm" />
                <input type="text" v-model="floatingConfig.buttonColor" class="form-input inline-input" maxlength="7" />
              </div>
            </div>
          </div>

          <div class="config-section">
            <h4 class="section-title">👁 效果预览</h4>
            <div class="floating-preview-box">
              <div class="preview-site">
                <div class="site-header"></div>
                <div class="site-content"></div>
                <div class="site-footer"></div>
                <div
                  class="preview-fab"
                  :style="{ [floatingConfig.position.includes('bottom') ? 'bottom' : 'top']: '24px', [floatingConfig.position.includes('left') ? 'left' : 'right']: '24px', background: floatingConfig.buttonColor }"
                >
                  <svg width="20" height="20" viewBox="0 0 56 56" fill="none">
                    <circle cx="28" cy="28" r="28" :fill="floatingConfig.buttonColor"/>
                    <path d="M18 28h20M28 18v20" stroke="white" stroke-width="3" stroke-linecap="round"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Inline Preview -->
        <div v-if="activeTab === 'inline_preview'" class="tab-content">
          <div class="config-section">
            <h4 class="section-title">📐 尺寸</h4>
            <div class="config-grid">
              <div class="config-item">
                <label>最大宽度</label>
                <select v-model="inlineConfig.maxWidth" class="form-select">
                  <option value="320px">320px</option>
                  <option value="480px">480px</option>
                  <option value="640px">640px</option>
                  <option value="800px">800px</option>
                  <option value="960px">960px</option>
                  <option value="100%">100%</option>
                </select>
              </div>
              <div class="config-item">
                <label>背景渐变</label>
                <select v-model="inlineConfig.gradient" class="form-select">
                  <option value="blue">蓝紫渐变</option>
                  <option value="green">绿青渐变</option>
                  <option value="orange">橙红渐变</option>
                  <option value="dark">深色渐变</option>
                </select>
              </div>
            </div>
          </div>

          <div class="config-section">
            <h4 class="section-title">👁 效果预览</h4>
            <div class="inline-preview-box" :style="{ maxWidth: inlineConfig.maxWidth }">
              <div class="inline-preview-card" :class="`gradient-${inlineConfig.gradient}`">
                <span style="font-size: 28px;">📊</span>
                <div style="font-size: 13px; font-weight: 600; color: white; margin-top: 8px;">点击查看完整演示</div>
                <div style="font-size: 11px; color: rgba(255,255,255,0.7); margin-top: 4px;">{{ slideCount }} 页 · RabAi Mind</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Analytics Widget -->
        <div v-if="activeTab === 'analytics'" class="tab-content">
          <div class="config-section">
            <h4 class="section-title">📊 分析指标</h4>
            <div class="analytics-metrics">
              <div class="metric-card">
                <span class="metric-icon">👁</span>
                <span class="metric-value">{{ analyticsData.total_views || 0 }}</span>
                <span class="metric-label">总浏览</span>
              </div>
              <div class="metric-card">
                <span class="metric-icon">👤</span>
                <span class="metric-value">{{ analyticsData.unique_viewers || 0 }}</span>
                <span class="metric-label">独立访客</span>
              </div>
              <div class="metric-card">
                <span class="metric-icon">⏱</span>
                <span class="metric-value">{{ Math.round(analyticsData.avg_duration || 0) }}s</span>
                <span class="metric-label">平均时长</span>
              </div>
            </div>
            <div class="config-item" style="margin-top: 12px;">
              <label>Widget 宽度</label>
              <select v-model="analyticsConfig.width" class="form-select">
                <option value="300px">300px</option>
                <option value="400px">400px（标准）</option>
                <option value="600px">600px</option>
                <option value="100%">100%</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Poll Tab -->
        <div v-if="activeTab === 'poll'" class="tab-content">
          <div class="config-section">
            <h4 class="section-title">🗳️ 投票问题</h4>
            <div class="config-item">
              <label>问题内容</label>
              <input v-model="pollConfig.question" type="text" class="form-input" placeholder="例如：您喜欢哪个功能？" />
            </div>
            <div class="config-item">
              <label>选项（每行一个）</label>
              <div class="options-list">
                <div v-for="(opt, idx) in pollConfig.options" :key="idx" class="option-row">
                  <input v-model="pollConfig.options[idx]" type="text" class="form-input" :placeholder="'选项 ' + (idx + 1)" />
                  <button v-if="pollConfig.options.length > 2" class="btn-icon" @click="pollConfig.options.splice(idx, 1)">✕</button>
                </div>
                <button class="btn btn-outline btn-sm" @click="pollConfig.options.push('新选项')">+ 添加选项</button>
              </div>
            </div>
            <div class="config-item">
              <label>Widget 宽度</label>
              <select v-model="pollConfig.width" class="form-select">
                <option value="300px">300px</option>
                <option value="400px">400px（标准）</option>
                <option value="500px">500px</option>
                <option value="100%">100%</option>
              </select>
            </div>
            <div class="config-item">
              <label>颜色主题</label>
              <div class="theme-options">
                <label class="theme-option" :class="{ active: pollConfig.theme === 'light' }">
                  <input type="radio" v-model="pollConfig.theme" value="light" /> 浅色
                </label>
                <label class="theme-option" :class="{ active: pollConfig.theme === 'dark' }">
                  <input type="radio" v-model="pollConfig.theme" value="dark" /> 深色
                </label>
              </div>
            </div>
            <div class="info-box" style="margin-top: 12px;">
              <p>💡 观众投票后，投票结果会自动汇总显示。投票组件可嵌入到演示页面中。</p>
            </div>
          </div>
        </div>

        <!-- Lead Capture Tab -->
        <div v-if="activeTab === 'lead_capture'" class="tab-content">
          <div class="config-section">
            <h4 class="section-title">📧 线索收集</h4>
            <div class="config-item">
              <label>表单标题</label>
              <input v-model="leadCaptureConfig.title" type="text" class="form-input" placeholder="订阅更新" />
            </div>
            <div class="config-item">
              <label>按钮文字</label>
              <input v-model="leadCaptureConfig.buttonText" type="text" class="form-input" placeholder="立即订阅" />
            </div>
            <div class="config-item">
              <label>Widget 宽度</label>
              <select v-model="leadCaptureConfig.width" class="form-select">
                <option value="300px">300px</option>
                <option value="400px">400px（标准）</option>
                <option value="500px">500px</option>
                <option value="100%">100%</option>
              </select>
            </div>
            <div class="config-item">
              <label>收集字段</label>
              <div class="checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="leadCaptureConfig.showName" /> 姓名（选填）
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" v-model="leadCaptureConfig.showCompany" /> 公司（选填）
                </label>
              </div>
            </div>
            <div class="info-box" style="margin-top: 12px;">
              <p>💡 访客提交邮箱后，可在演示后台查看所有收集到的线索数据。</p>
            </div>
          </div>
        </div>

        <!-- Pixel Tab -->
        <div v-if="activeTab === 'pixel'" class="tab-content">
          <div class="config-section">
            <h4 class="section-title">🔍 追踪像素</h4>
            <div class="config-item">
              <label>追踪 Token</label>
              <input v-model="pixelConfig.token" type="text" class="form-input" placeholder="留空自动生成" />
              <small style="color: #888; font-size: 12px;">用于标识此追踪像素，可自定义</small>
            </div>
            <div class="config-item">
              <label>追踪事件</label>
              <div class="checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="pixelConfig.trackViews" /> 页面浏览
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" v-model="pixelConfig.trackClicks" /> 元素点击
                </label>
              </div>
            </div>
            <div class="info-box" style="margin-top: 12px;">
              <p>💡 追踪像素是一段轻量代码，添加到外部网站后可以追踪该网站的流量来源和用户行为。</p>
            </div>
          </div>
        </div>

        <!-- Generated Code Output -->
        <div class="code-output-section">
          <div class="code-header">
            <h4 class="section-title">📋 嵌入代码</h4>
            <button class="copy-btn" @click="copyCode">
              {{ copied ? '✅ 已复制' : '📋 复制代码' }}
            </button>
          </div>
          <div class="code-preview">
            <pre>{{ generatedCode }}</pre>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-outline" @click="$emit('close')">关闭</button>
        <button class="btn btn-primary" @click="regenerateCode">
          🔄 重新生成
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import apiClient from '../api/client'

interface Props {
  show: boolean
  taskId: string
  slideCount?: number
}

interface Emits {
  (e: 'close'): void
}

const props = withDefaults(defineProps<Props>(), {
  slideCount: 1
})

const emit = defineEmits<Emits>()

const activeTab = ref('iframe')
const copied = ref(false)

const embedTabs = [
  { id: 'iframe', label: '演示Widget', icon: '🖼️' },
  { id: 'slide', label: '单页嵌入', icon: '📑' },
  { id: 'floating_button', label: '悬浮按钮', icon: '🔘' },
  { id: 'inline_preview', label: '内嵌预览', icon: '📄' },
  { id: 'analytics', label: '数据统计', icon: '📊' },
  { id: 'poll', label: '投票组件', icon: '🗳️' },
  { id: 'lead_capture', label: '线索收集', icon: '📧' },
  { id: 'pixel', label: '追踪像素', icon: '🔍' },
]

const sizePresets = [
  { label: '迷你', width: '320px', height: '240px' },
  { label: '中等', width: '640px', height: '480px' },
  { label: '标准', width: '800px', height: '600px' },
  { label: '大屏', width: '960px', height: '720px' },
  { label: '全宽', width: '100%', height: '600px' },
]

const positionOptions = [
  { value: 'bottom-right', label: '右下' },
  { value: 'bottom-left', label: '左下' },
  { value: 'top-right', label: '右上' },
  { value: 'top-left', label: '左上' },
]

const buttonColors = [
  { value: '#165DFF', label: '科技蓝' },
  { value: '#00D4AA', label: '青绿' },
  { value: '#FF6B6B', label: '珊瑚红' },
  { value: '#7C3AED', label: '紫色' },
  { value: '#F59E0B', label: '琥珀' },
  { value: '#10B981', label: '翠绿' },
]

const iframeConfig = ref({
  width: '800px',
  height: '600px',
  theme: 'light',
  showControls: true,
  autoSlideEnabled: false,
  autoSlideInterval: 5,
  startSlide: 1,
})

const floatingConfig = ref({
  position: 'bottom-right',
  buttonColor: '#165DFF',
})

const inlineConfig = ref({
  maxWidth: '640px',
  gradient: 'blue',
})

const slideConfig = ref({
  selectedSlide: 1,
  width: '640px',
  height: '360px',
  theme: 'light',
  interactive: true,
})

const analyticsData = ref<Record<string, any>>({})

const analyticsConfig = ref({
  width: '400px',
  showViews: true,
  showDuration: true,
  showEngagement: true,
  theme: 'light',
})

const pollConfig = ref({
  question: '',
  options: ['选项一', '选项二', '选项三'],
  width: '400px',
  theme: 'light',
})

const leadCaptureConfig = ref({
  title: '订阅更新',
  buttonText: '立即订阅',
  width: '400px',
  showName: true,
  showCompany: true,
})

const pixelConfig = ref({
  token: '',
  trackViews: true,
  trackClicks: false,
})

const previewWidth = computed(() => {
  const w = parseInt(iframeConfig.value.width)
  return Math.min(w, 300) + 'px'
})

const previewHeight = computed(() => {
  const h = parseInt(iframeConfig.value.height)
  return Math.min(h, 200) + 'px'
})

const generatedCode = ref('')

watch([activeTab, iframeConfig, slideConfig, floatingConfig, inlineConfig, analyticsConfig], () => {
  generateCode()
}, { deep: true, immediate: true })

watch(() => props.show, async (val) => {
  if (val) {
    generateCode()
    if (activeTab.value === 'analytics') {
      loadAnalytics()
    }
  }
})

const applySizePreset = (preset: { width: string; height: string }) => {
  iframeConfig.value.width = preset.width
  iframeConfig.value.height = preset.height
}

const loadAnalytics = async () => {
  try {
    const res = await apiClient.get(`/ppt/embed/${props.taskId}/analytics`)
    if (res.data.success) {
      analyticsData.value = res.data
    }
  } catch (e) {
    console.warn('Failed to load analytics:', e)
  }
}

const generateCode = async () => {
  const embedType = activeTab.value
  try {
    const payload: any = {
      embed_type: embedType,
    }
    
    if (embedType === 'iframe') {
      payload.width = iframeConfig.value.width
      payload.height = iframeConfig.value.height
      payload.theme = iframeConfig.value.theme
      payload.show_controls = iframeConfig.value.showControls
      payload.auto_slide = iframeConfig.value.autoSlideEnabled ? iframeConfig.value.autoSlideInterval : 0
      payload.start_slide = iframeConfig.value.startSlide
    } else if (embedType === 'floating_button') {
      payload.position = floatingConfig.value.position
    } else if (embedType === 'inline_preview') {
      payload.width = inlineConfig.value.maxWidth
    } else if (embedType === 'analytics') {
      payload.width = analyticsConfig.value.width
    } else if (embedType === 'poll') {
      payload.width = pollConfig.value.width
      payload.theme = pollConfig.value.theme
    } else if (embedType === 'lead_capture') {
      payload.width = leadCaptureConfig.value.width
      payload.lead_form_title = leadCaptureConfig.value.title
      payload.lead_button_text = leadCaptureConfig.value.buttonText
    } else if (embedType === 'pixel') {
      payload.analytics_token = pixelConfig.value.token || undefined
    }

    const res = await apiClient.post(`/ppt/embed/${props.taskId}/generate`, payload)
    if (res.data.success) {
      generatedCode.value = res.data.embed_code
    }
  } catch (e) {
    // Fallback: generate client-side
    generatedCode.value = generateClientCode()
  }
}

const generateClientCode = (): string => {
  const base = window.location.origin
  const embedUrl = `${base}/embed/${props.taskId}/viewer`
  const fullUrl = `${base}/result?taskId=${props.taskId}`

  if (activeTab.value === 'iframe') {
    return `<iframe
  src="${embedUrl}?theme=${iframeConfig.value.theme}&controls=${iframeConfig.value.showControls}&auto_slide=${iframeConfig.value.autoSlideEnabled ? iframeConfig.value.autoSlideInterval : 0}&start=${iframeConfig.value.startSlide}"
  width="${iframeConfig.value.width}"
  height="${iframeConfig.value.height}"
  frameborder="0"
  allowfullscreen
  style="border-radius: 8px; box-shadow: 0 4px 24px rgba(0,0,0,0.12);"
></iframe>`
  } else if (activeTab.value === 'floating_button') {
    const pos = floatingConfig.value.position
    const [vPos, hPos] = pos.includes('-')
      ? pos.split('-')
      : ['bottom', 'right']
    return `<script>
(function() {
  var btn = document.createElement('div');
  btn.innerHTML = '<svg width="56" height="56" viewBox="0 0 56 56" fill="none"><circle cx="28" cy="28" r="28" fill="${floatingConfig.value.buttonColor}"/><path d="M18 28h20M28 18v20" stroke="white" stroke-width="3" stroke-linecap="round"/></svg>';
  btn.style.cssText = 'position:fixed;${vPos}:24px;${hPos}:24px;cursor:pointer;z-index:99999;border:none;background:none;box-shadow:0 4px 16px rgba(0,0,0,0.25);border-radius:50%;transition:transform .2s;width:56px;height:56px;';
  btn.onmouseover = function() { this.style.transform='scale(1.1)'; };
  btn.onmouseout = function() { this.style.transform='scale(1)'; };
  btn.onclick = function() { window.open("${fullUrl}", "_blank"); };
  document.body.appendChild(btn);
})();
<\/script>`
  } else if (activeTab.value === 'inline_preview') {
    const gradients: Record<string, string> = {
      blue: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      green: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
      orange: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)',
      dark: 'linear-gradient(135deg, #2c3e50 0%, #4ca1af 100%)',
    }
    return `<div style="max-width:${inlineConfig.value.maxWidth};margin:0 auto;">
  <div style="aspect-ratio:16/9;background:${gradients[inlineConfig.value.gradient]};border-radius:12px;display:flex;align-items:center;justify-content:center;cursor:pointer;" onclick="window.open('${fullUrl}','_blank')">
    <div style="text-align:center;color:white;">
      <div style="font-size:32px;margin-bottom:8px;">📊</div>
      <div style="font-size:14px;font-weight:600;">点击查看完整演示</div>
    </div>
  </div>
</div>`
  } else if (activeTab.value === 'slide') {
    const slideNum = slideConfig.value.selectedSlide
    const slideUrl = `${embedUrl}?theme=${slideConfig.value.theme}&controls=${slideConfig.value.interactive}&start=${slideNum}`
    return `<iframe\n  src="${slideUrl}"\n  width="${slideConfig.value.width}"\n  height="${slideConfig.value.height}"\n  frameborder="0"\n  allowfullscreen\n  style="border-radius:8px;box-shadow:0 4px 24px rgba(0,0,0,0.12);"\n  title="Slide ${slideNum}"\n></iframe>`
  } else {
    return `<!-- RabAi Mind Analytics Widget -->
<div id="rabai-analytics-${props.taskId.slice(0, 8)}" style="font-family:system-ui;background:#f8f9fa;border-radius:8px;padding:16px;max-width:${analyticsConfig.value.width};">
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
    <span style="font-size:20px;">📊</span>
    <strong style="font-size:14px;">演示分析</strong>
    <span style="margin-left:auto;font-size:11px;color:#888;">rabai.com</span>
  </div>
  <div style="font-size:12px;color:#555;">
    <div style="margin:4px 0;"><span style="color:#888;">👁 总浏览</span> <strong>${analyticsData.value.total_views || 0}</strong></div>
    <div style="margin:4px 0;"><span style="color:#888;">⏱ 平均停留</span> <strong>${Math.round(analyticsData.value.avg_duration || 0)}s</strong></div>
  </div>
</div>`
  }
}

const regenerateCode = () => {
  generateCode()
}

const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(generatedCode.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = generatedCode.value
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
}
</script>

<style scoped>
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.embed-modal {
  background: white;
  border-radius: 16px;
  width: 600px;
  max-width: 95vw;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

:global(.dark) .embed-modal {
  background: #1e1e1e;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

:global(.dark) .modal-header {
  border-color: #333;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

:global(.dark) .modal-header h3 {
  color: #eee;
}

.close-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 16px;
  border-radius: 6px;
  color: #888;
}

.close-btn:hover {
  background: #f0f0f0;
}

.modal-body {
  padding: 16px 20px;
  overflow-y: auto;
  flex: 1;
}

/* Tabs */
.embed-tabs {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
  margin-bottom: 16px;
}

.tab-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 4px;
  border: 1px solid #e0e0e0;
  background: white;
  border-radius: 10px;
  cursor: pointer;
  font-size: 11px;
  color: #555;
  transition: all 0.15s;
}

:global(.dark) .tab-btn {
  background: #2a2a2a;
  border-color: #333;
  color: #aaa;
}

.tab-btn.active {
  background: #e8f0ff;
  border-color: #165DFF;
  color: #165DFF;
}

:global(.dark) .tab-btn.active {
  background: #1a2a4a;
  border-color: #165DFF;
  color: #4d8eff;
}

.tab-icon {
  font-size: 18px;
}

.tab-label {
  font-size: 11px;
}

/* Sections */
.tab-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.config-section {
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  padding: 12px;
}

:global(.dark) .config-section {
  background: #1a1a1a;
  border-color: #333;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: #555;
  margin: 0 0 10px;
}

:global(.dark) .section-title {
  color: #aaa;
}

.config-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.config-item label {
  font-size: 11px;
  color: #888;
}

:global(.dark) .config-item label {
  color: #aaa;
}

.form-select, .form-input {
  padding: 7px 10px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 12px;
  font-family: inherit;
}

:global(.dark) .form-select,
:global(.dark) .form-input {
  background: #2a2a2a;
  border-color: #444;
  color: #fff;
}

.form-input.inline-input {
  width: 80px;
}

/* Size presets */
.size-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 4px;
}

.preset-chip {
  padding: 4px 10px;
  border: 1px solid #e0e0e0;
  background: white;
  border-radius: 14px;
  font-size: 11px;
  cursor: pointer;
  color: #555;
}

:global(.dark) .preset-chip {
  background: #2a2a2a;
  border-color: #444;
  color: #aaa;
}

.preset-chip.active {
  background: #e8f0ff;
  border-color: #165DFF;
  color: #165DFF;
}

/* Theme options */
.theme-options {
  display: flex;
  gap: 8px;
}

.theme-option {
  flex: 1;
  cursor: pointer;
}

.theme-option input {
  display: none;
}

.theme-preview {
  display: block;
  text-align: center;
  padding: 8px 4px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 12px;
}

.theme-preview.light-preview {
  background: #f8f9fa;
  color: #333;
}

.theme-preview.dark-preview {
  background: #2a2a2a;
  color: #eee;
}

.theme-preview.auto-preview {
  background: linear-gradient(135deg, #f8f9fa 50%, #2a2a2a 50%);
  color: #333;
}

.theme-option.active .theme-preview {
  border-color: #165DFF;
}

/* Toggle rows */
.toggle-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #555;
  cursor: pointer;
  margin-bottom: 6px;
}

:global(.dark) .toggle-row {
  color: #aaa;
}

.sub-config {
  margin-top: 6px;
  padding-left: 20px;
  font-size: 11px;
  color: #888;
  display: flex;
  align-items: center;
  gap: 8px;
}

:global(.dark) .sub-config {
  color: #aaa;
}

/* Position grid */
.position-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.position-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  color: #555;
}

:global(.dark) .position-option {
  border-color: #333;
  color: #aaa;
}

.position-option.active {
  border-color: #165DFF;
  color: #165DFF;
  background: #e8f0ff;
}

:global(.dark) .position-option.active {
  background: #1a2a4a;
}

.position-option input {
  display: none;
}

/* Color presets */
.color-presets {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.color-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.15s;
}

.color-dot:hover {
  transform: scale(1.15);
}

.color-dot.active {
  border-color: #333;
  box-shadow: 0 0 0 2px white;
}

:global(.dark) .color-dot.active {
  border-color: #fff;
  box-shadow: 0 0 0 2px #333;
}

.color-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-picker-sm {
  width: 32px;
  height: 28px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  cursor: pointer;
  padding: 0;
}

/* Preview boxes */
.preview-section {
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  padding: 12px;
}

:global(.dark) .preview-section {
  background: #1a1a1a;
  border-color: #333;
}

.iframe-preview-box {
  max-width: 300px;
  max-height: 200px;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.preview-placeholder {
  text-align: center;
  color: #888;
}

.preview-placeholder p {
  margin: 4px 0 0;
  font-size: 12px;
}

/* Floating preview */
.floating-preview-box {
  background: #f0f0f0;
  border-radius: 8px;
  height: 180px;
  position: relative;
  overflow: hidden;
}

:global(.dark) .floating-preview-box {
  background: #2a2a2a;
}

.preview-site {
  position: absolute;
  inset: 0;
}

.site-header {
  height: 24px;
  background: #e0e0e0;
}

:global(.dark) .site-header {
  background: #444;
}

.site-content {
  height: calc(100% - 48px);
  background: #f8f8f8;
}

:global(.dark) .site-content {
  background: #333;
}

.site-footer {
  height: 24px;
  background: #e0e0e0;
}

:global(.dark) .site-footer {
  background: #444;
}

.preview-fab {
  position: absolute;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  cursor: pointer;
}

/* Inline preview */
.inline-preview-box {
  margin: 0 auto;
}

.inline-preview-card {
  aspect-ratio: 16/9;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
}

.gradient-blue {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.gradient-green {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.gradient-orange {
  background: linear-gradient(135deg, #f12711 0%, #f5af19 100%);
}

.gradient-dark {
  background: linear-gradient(135deg, #2c3e50 0%, #4ca1af 100%);
}

/* Analytics metrics */
.analytics-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.metric-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 10px;
  text-align: center;
}

:global(.dark) .metric-card {
  background: #2a2a2a;
  border-color: #333;
}

.metric-icon {
  font-size: 16px;
}

.metric-value {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: #165DFF;
  margin-top: 4px;
}

.metric-label {
  display: block;
  font-size: 11px;
  color: #888;
  margin-top: 2px;
}

/* Code output */
.code-output-section {
  border-top: 1px solid #e0e0e0;
  padding-top: 12px;
}

:global(.dark) .code-output-section {
  border-color: #333;
}

.code-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.copy-btn {
  padding: 6px 12px;
  border: 1px solid #e0e0e0;
  background: white;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  color: #555;
}

:global(.dark) .copy-btn {
  background: #2a2a2a;
  border-color: #444;
  color: #aaa;
}

.copy-btn:hover {
  background: #f0f7ff;
  border-color: #165DFF;
  color: #165DFF;
}

.code-preview {
  background: #1e1e1e;
  border-radius: 8px;
  padding: 12px;
  max-height: 200px;
  overflow: auto;
}

.code-preview pre {
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 11px;
  color: #d4d4d4;
  white-space: pre-wrap;
  word-break: break-all;
  line-height: 1.5;
}

/* Footer */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 20px;
  border-top: 1px solid #f0f0f0;
}

:global(.dark) .modal-footer {
  border-color: #333;
}

.btn {
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  border: none;
}

.btn-outline {
  background: white;
  border: 1px solid #e0e0e0;
  color: #555;
}

:global(.dark) .btn-outline {
  background: #2a2a2a;
  border-color: #444;
  color: #aaa;
}

.btn-primary {
  background: #165DFF;
  color: white;
}

.btn-primary:hover {
  background: #0d47e6;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.option-row .form-input {
  flex: 1;
}

.btn-icon {
  padding: 4px 8px;
  background: #f0f0f0;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  color: #666;
}

.btn-icon:hover {
  background: #e0e0e0;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 13px;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
}

.info-box {
  background: #f0f7ff;
  border: 1px solid #d0e4ff;
  border-radius: 8px;
  padding: 12px;
  font-size: 13px;
  color: #555;
  line-height: 1.5;
}

.info-box p {
  margin: 0;
}
</style>
