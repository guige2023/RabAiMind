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
      <button class="quick-action" @click="loadTemplate">
        <span class="action-icon">📋</span>
        <span>加载模板</span>
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
      
      <button class="generate-btn" type="primary" @click="generateChartFromData">生成图表</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

interface Slide {
  id: string
  title: string
  content: string
  layout: 'title' | 'content' | 'two-column' | 'image-left' | 'image-right' | 'centered'
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

const outline = reactive<OutlineData>({
  slides: [],
  style: 'professional',
  theme: 'blue'
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
    alert('至少保留一页')
    return
  }
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
      const { api } = await import('../api/client')
      // 先预览文件列信息
      const response = await fetch(`/api/v1/ppt/chart/preview/${route.query.taskId || 'temp'}`, {
        method: 'GET',
        headers: { 'Content-Type': 'multipart/form-data' },
        body: formData
      })
      // 简单解析：使用表单上传获取列信息
      // 由于 GET 不支持 body，改用 FormData 上传
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
      alert('文件解析失败，请检查文件格式')
    }
  }
  input.click()
}

// 生成图表
const generateChartFromData = async () => {
  if (!chartSelectedFile.value) {
    alert('请先选择文件')
    return
  }
  
  const labelCol = chartColumns.value.label_columns?.[selectedLabelColIndex.value] || ''
  const valueCol = chartColumns.value.numeric_columns?.[selectedValueColIndex.value] || ''
  
  if (!labelCol || !valueCol) {
    alert('请选择标签列和数值列')
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
      
      alert(`图表已生成！共 ${result.charts.length} 个图表。\n文件: ${result.svg_urls.join(', ')}`)
    }
  } catch (err) {
    console.error('图表生成失败', err)
    alert('图表生成失败，请重试')
  }
}

// 直接调用API生成大纲（跳过mock）
const testAPI = async () => {
  const r = document.getElementById('dbg-res')
  if (r) r.textContent = '⏳...'
  try {
    const scene = route.query.scene as string || 'business'
    const style = route.query.style as string || 'professional'
    const resp = await fetch('http://localhost:8003/api/v1/ppt/plan', {
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
  console.log('[generateOutline] 🚀 开始生成大纲')
  console.log('[generateOutline] 请求内容:', route.query.request)

  const request = route.query.request as string || '商务演示'
  const scene = route.query.scene as string || 'business'
  const style = route.query.style as string || 'professional'

  // 尝试调用后端API生成大纲
  try {
    const { api } = await import('../api/client')
    console.log('[generateOutline] 📡 调用 api.ppt.plan API...')
    console.log('[generateOutline] 参数:', { request, scene, style })

    const response = await api.ppt.plan(request, 6, scene, style)
    console.log('[generateOutline] ✅ API响应收到:', JSON.stringify(response?.data)?.substring(0, 500))

    // 检查响应结构
    if (response?.data) {
      const data = response.data as any
      console.log('[generateOutline] 响应 data.success:', data.success)
      console.log('[generateOutline] 响应 data.slides:', data.slides?.length, '页')

      if (data.success && data.slides && data.slides.length > 0) {
        console.log('[generateOutline] ✅ 使用API返回的大纲，共', data.slides.length, '页')
        outline.slides = data.slides.map((s: any, i: number) => ({
          id: generateId(),
          title: s.title || `第${i + 1}页`,
          content: Array.isArray(s.content) ? s.content.join('\n') : (s.content || ''),
          layout: mapLayoutType(s.layout || s.slide_type || 'content')
        }))
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
      alert('⚠️ 无法连接到后端服务\n\n请确保后端服务已启动:\ncd /Users/guige/my_project/RabAiMind\nsource .venv/bin/activate\npython3 -m uvicorn src.main:app --host 127.0.0.1 --port 8003\n\n如果后端已启动，请检查浏览器控制台获取更多信息。')
      return
    }
  }

  // 只有API真正失败（网络/服务器错误）才走mock
  // 如果API返回了但数据为空，业务逻辑不应走mock而是让用户重试
  console.log('[generateOutline] 🔄 API不可用，走本地智能生成作为兜底')

  // API不可用时使用本地智能生成
  await new Promise(resolve => setTimeout(resolve, 800))

  // 智能生成基于用户请求
  const requestLower = request.toLowerCase()
  let slideData: any[]

  try {
    if (requestLower.includes('商务') || requestLower.includes('企业') || requestLower.includes('公司')) {
      slideData = [
        { title: request, content: '副标题\n演讲者：姓名', layout: 'title' },
        { title: '目录', content: '一、行业概述\n二、市场分析\n三、竞争格局\n四、发展策略\n五、总结展望', layout: 'content' },
        { title: '行业概述', content: '• 行业定义与发展历程\n• 市场规模与增长趋势\n• 政策环境分析', layout: 'content' },
        { title: '市场分析', content: '• 目标市场定位\n• 用户需求洞察\n• 市场份额分析', layout: 'two-column' },
        { title: '竞争格局', content: '• 主要竞争对手\n• 竞争优势分析\n• 差异化策略', layout: 'content' },
        { title: '发展策略', content: '• 短期目标\n• 中期规划\n• 长期愿景', layout: 'content' },
        { title: '总结与展望', content: '• 核心观点回顾\n• 下一步行动计划\n• 感谢聆听', layout: 'centered' }
      ]
    } else if (requestLower.includes('教育') || requestLower.includes('培训') || requestLower.includes('课程')) {
      slideData = [
        { title: request, content: '课程名称\n讲师：姓名', layout: 'title' },
        { title: '课程目录', content: '第一章：基础知识\n第二章：核心要点\n第三章：实战应用\n第四章：总结复习', layout: 'content' },
        { title: '第一章：基础知识', content: '• 知识点1\n• 知识点2\n• 知识点3', layout: 'content' },
        { title: '第二章：核心要点', content: '• 核心概念\n• 案例分析\n• 实践方法', layout: 'two-column' },
        { title: '第三章：实战应用', content: '• 实战演练\n• 常见问题\n• 解决方案', layout: 'content' },
        { title: '第四章：总结复习', content: '• 知识回顾\n• 重点总结\n• 课后作业', layout: 'content' },
        { title: '谢谢观看', content: '感谢您的聆听\n欢迎提问交流', layout: 'centered' }
      ]
    } else if (requestLower.includes('数据') || requestLower.includes('报告') || requestLower.includes('分析')) {
      slideData = [
        { title: request, content: '报告周期：2024年\n汇报部门：数据分析部', layout: 'title' },
        { title: '报告摘要', content: '• 核心发现\n• 关键指标\n• 建议行动', layout: 'content' },
        { title: '数据概览', content: '• 总体数据\n• 趋势分析\n• 对比数据', layout: 'content' },
        { title: '详细分析', content: '• 维度一分析\n• 维度二分析\n• 维度三分析', layout: 'two-column' },
        { title: '洞察发现', content: '• 主要发现1\n• 主要发现2\n• 主要发现3', layout: 'content' },
        { title: '建议方案', content: '• 短期行动\n• 中期优化\n• 长期规划', layout: 'content' },
        { title: '总结', content: '• 核心结论\n• 下一步计划', layout: 'centered' }
      ]
    } else if (requestLower.includes('产品') || requestLower.includes('发布')) {
      slideData = [
        { title: request, content: '产品名称\n发布会主题', layout: 'title' },
        { title: '产品介绍', content: '• 核心功能\n• 创新亮点\n• 使用体验', layout: 'content' },
        { title: '产品特点', content: '• 特点一\n• 特点二\n• 特点三', layout: 'two-column' },
        { title: '应用场景', content: '• 场景一\n• 场景二\n• 场景三', layout: 'content' },
        { title: '定价与发售', content: '• 价格方案\n• 优惠政策\n• 上市时间', layout: 'content' },
        { title: '谢谢观看', content: '感谢您的关注\n欢迎预订', layout: 'centered' }
      ]
    } else {
      // 默认通用模板
      slideData = [
        { title: request, content: '副标题\n演讲者信息', layout: 'title' },
        { title: '目录', content: '第一部分：背景\n第二部分：内容\n第三部分：总结', layout: 'content' },
        { title: '第一部分', content: '• 要点1\n• 要点2\n• 要点3', layout: 'content' },
        { title: '第二部分', content: '• 要点1\n• 要点2\n• 要点3', layout: 'two-column' },
        { title: '第三部分', content: '• 总结1\n• 总结2\n• 总结3', layout: 'content' },
        { title: '谢谢观看', content: '感谢您的聆听\n欢迎提问', layout: 'centered' }
      ]
    }

    outline.slides = slideData.map((s) => ({
      id: generateId(),
      title: s.title,
      content: s.content,
      layout: s.layout
    }))
    } catch (e) {
      console.error('生成失败:', e)
      alert('生成失败，请重试')
    } finally {
      isLoading.value = false
    }
}

// 加载模板
const loadTemplate = () => {
  const templates: { name: string; slides: Slide[] }[] = [
    {
      name: '1. 商业计划书',
      slides: [
        { id: generateId(), title: '公司介绍', content: '公司背景\n核心业务\n团队介绍', layout: 'title' as const },
        { id: generateId(), title: '市场分析', content: '行业规模\n目标用户\n竞争分析', layout: 'content' as const },
        { id: generateId(), title: '产品服务', content: '产品特点\n核心优势\n商业模式', layout: 'two-column' as const },
        { id: generateId(), title: '发展规划', content: '短期目标\n中期规划\n长期愿景', layout: 'content' as const }
      ]
    },
    {
      name: '2. 产品发布会',
      slides: [
        { id: generateId(), title: '新品发布', content: '产品名称\n发布主题\n演讲嘉宾', layout: 'title' as const },
        { id: generateId(), title: '产品介绍', content: '核心功能\n创新亮点\n使用体验', layout: 'content' as const },
        { id: generateId(), title: '产品演示', content: '演示环节\n互动问答', layout: 'image-right' as const },
        { id: generateId(), title: '定价与上市', content: '价格方案\n优惠政策\n上市时间', layout: 'content' as const }
      ]
    },
    {
      name: '3. 培训课件',
      slides: [
        { id: generateId(), title: '培训主题', content: '培训目标\n课程大纲', layout: 'title' as const },
        { id: generateId(), title: '知识点一', content: '概念讲解\n案例分析', layout: 'content' as const },
        { id: generateId(), title: '知识点二', content: '方法论\n实践操作', layout: 'content' as const },
        { id: generateId(), title: '总结与问答', content: '要点回顾\n课后作业\n问答环节', layout: 'centered' as const }
      ]
    },
    {
      name: '4. 年度总结',
      slides: [
        { id: generateId(), title: '年度工作总结', content: '年度回顾\n核心成就', layout: 'title' as const },
        { id: generateId(), title: '业绩数据', content: '关键指标\n同比分析\n环比趋势', layout: 'two-column' as const },
        { id: generateId(), title: '团队成就', content: '团队建设\n人才培养\n文化建设', layout: 'content' as const },
        { id: generateId(), title: '明年计划', content: '目标设定\n战略方向\n资源规划', layout: 'content' as const }
      ]
    },
    {
      name: '5. 项目汇报',
      slides: [
        { id: generateId(), title: '项目概述', content: '项目背景\n项目目标\n团队成员', layout: 'title' as const },
        { id: generateId(), title: '项目进度', content: '里程碑\n已完成工作\n进行中工作', layout: 'content' as const },
        { id: generateId(), title: '问题与解决', content: '遇到的问题\n解决方案\n风险控制', layout: 'two-column' as const },
        { id: generateId(), title: '下一步计划', content: '后续安排\n资源需求\n预期成果', layout: 'content' as const }
      ]
    },
    {
      name: '6. 公司介绍',
      slides: [
        { id: generateId(), title: '公司介绍', content: '公司名称\n创立时间\n发展历程', layout: 'title' as const },
        { id: generateId(), title: '核心业务', content: '主要产品\n服务领域\n客户群体', layout: 'content' as const },
        { id: generateId(), title: '竞争优势', content: '技术优势\n团队优势\n资源优势', layout: 'two-column' as const },
        { id: generateId(), title: '发展愿景', content: '战略目标\n未来规划\n合作期待', layout: 'centered' as const }
      ]
    },
    {
      name: '7. 融资路演',
      slides: [
        { id: generateId(), title: '融资计划', content: '项目名称\n融资轮次\n融资金额', layout: 'title' as const },
        { id: generateId(), title: '商业模式', content: '产品定位\n盈利模式\n市场空间', layout: 'content' as const },
        { id: generateId(), title: '竞争优势', content: '核心竞争力\n技术壁垒\n团队优势', layout: 'two-column' as const },
        { id: generateId(), title: '融资用途', content: '资金分配\n使用计划\n预期回报', layout: 'content' as const },
        { id: generateId(), title: '联系方式', content: '联系人\n电话\n邮箱', layout: 'centered' as const }
      ]
    },
    {
      name: '8. 党建汇报',
      slides: [
        { id: generateId(), title: '党建工作汇报', content: '党组织名称\n汇报时间', layout: 'title' as const },
        { id: generateId(), title: '组织建设', content: '党员情况\n组织活动\n制度建设', layout: 'content' as const },
        { id: generateId(), title: '思想建设', content: '理论学习\n主题教育\n思想动态', layout: 'content' as const },
        { id: generateId(), title: '下一步计划', content: '工作目标\n重点任务', layout: 'centered' as const }
      ]
    }
  ]

  const choice = prompt(`选择模板:\n${templates.map(t => t.name).join('\n')}`)
  const index = parseInt(choice || '0') - 1
  if (index >= 0 && index < templates.length) {
    outline.slides = templates[index].slides.map(s => ({ ...s, id: generateId() }))
  }
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
    alert('请填写所有页面的标题')
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
      scene: genOptions.scene,
      style: genOptions.style,
      template: genOptions.template,
      theme_color: genOptions.themeColor,
      pre_generated_slides: preGeneratedSlides,
      text_style: genOptions.textStyle,
      shadow_color: genOptions.shadowColor,
      overlay_transparency: genOptions.overlayTransparency,
      use_smart_layout: genOptions.useSmartLayout,
      font_title: genOptions.fontTitle,
      font_subtitle: genOptions.fontSubtitle,
      font_content: genOptions.fontContent,
      font_caption: genOptions.fontCaption,
      layout_mode: genOptions.layoutMode === '统一' ? 'auto' : genOptions.layoutMode,
      unified_layout: true,
      include_charts: false,
      generation_mode: genOptions.generationMode,
      output_format: genOptions.outputFormat,
      quality: genOptions.quality
    })
    const taskId = response.data.task_id

    // 保存大纲到本地存储（备用）
    localStorage.setItem('ppt_outline', JSON.stringify(outline))

    // Step 2: 跳转到生成页面（显示"排版中"，内容阶段已跳过）
    router.push({
      path: '/generating',
      query: { taskId }
    })
  } catch (e: any) {
    console.error('生成PPT失败详情:', e?.response?.data || e)
    const msg = e?.response?.data?.detail || e?.message || '请重试'
    alert(`生成失败: ${typeof msg === 'object' ? JSON.stringify(msg) : msg}`)
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
      console.log('✅ 大纲已保存到服务器')
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

// 页面加载时初始化
onMounted(async () => {
  // 读取 CreateView 传来的参数
  const passedStyle = route.query.style as string
  const passedScene = route.query.scene as string
  const passedTemplate = route.query.template as string
  const passedThemeColor = route.query.themeColor as string
  
  if (passedStyle) outline.style = passedStyle
  if (passedThemeColor) outline.theme = passedThemeColor

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
    console.log('[OutlineEdit] 加载生成选项:', genOptions)
    localStorage.removeItem('ppt_outline_temp')
    debugSrc.value = 'localStorage'
  }

  // 没有大纲时，直接调用 API 生成
  if (outline.slides.length === 0) {
    debugSrc.value = 'onMounted'
    await testAPI()
  }
})
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
</style>
