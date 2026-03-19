<template>
  <div class="create">
    <div class="container">
      <div class="create-header">
        <h1 class="page-title">创建你的 PPT</h1>
        <p class="page-subtitle">描述你想要的内容，AI 将为你生成专业演示文稿</p>
      </div>

      <div class="create-form">
        <!-- 需求输入 -->
        <div class="form-section">
          <label class="form-label">
            需求描述
            <span class="label-tip">描述越详细，生成效果越好</span>
          </label>
          <textarea
            v-model="formData.userRequest"
            class="input textarea"
            :class="{ error: errors.userRequest }"
            placeholder="例如：创建一个关于人工智能发展趋势的商业计划书，包含行业现状、未来预测、应用场景等..."
            rows="5"
            @input="validateRequest"
          ></textarea>
          <!-- 快速示例 -->
          <div class="quick-examples" v-if="!formData.userRequest">
            <span class="tip-label">试试这些：</span>
            <button class="example-btn" @click="formData.userRequest = '创建一份产品发布会的PPT，包含产品介绍、功能演示、定价策略、市场目标等，10页左右'">产品发布会</button>
            <button class="example-btn" @click="formData.userRequest = '制作年度工作总结PPT，包含年度回顾、业绩数据、团队成就、明年计划，8页'">年度总结</button>
            <button class="example-btn" @click="formData.userRequest = '创建公司介绍PPT，包含公司背景、核心业务、竞争优势、发展愿景，12页'">公司介绍</button>
          </div>
          <div class="form-hint">
            <span v-if="errors.userRequest" class="text-error">{{ errors.userRequest }}</span>
            <span class="text-muted">{{ formData.userRequest.length }} / 2000</span>
          </div>
        </div>

        <!-- 参数配置 -->
        <div class="form-row">
          <!-- 幻灯片数量 -->
          <div class="form-section">
            <label class="form-label">幻灯片数量</label>
            <div class="slider-group">
              <input
                type="range"
                v-model.number="formData.slideCount"
                min="5"
                max="30"
                step="1"
                class="slider"
              />
              <span class="slider-value">{{ formData.slideCount }} 页</span>
            </div>
          </div>

          <!-- 场景选择 -->
          <div class="form-section">
            <label class="form-label">场景类型</label>
            <select v-model="formData.scene" class="input select">
              <option value="business">💼 商务</option>
              <option value="education">📚 教育</option>
              <option value="tech">🚀 科技</option>
              <option value="creative">💡 创意</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <!-- 风格选择 -->
          <div class="form-section">
            <label class="form-label">视觉风格</label>
            <select v-model="formData.style" class="input select">
              <option value="professional">专业商务</option>
              <option value="simple">简约现代</option>
              <option value="energetic">活力动感</option>
              <option value="premium">高端大气</option>
            </select>
          </div>

          <!-- 模板选择 -->
          <div class="form-section">
            <label class="form-label">模板风格</label>
            <div class="template-grid">
              <div
                v-for="tpl in templateOptions"
                :key="tpl.value"
                class="template-card"
                :class="{ active: formData.template === tpl.value }"
                @click="formData.template = tpl.value"
              >
                <div class="template-preview" :style="{ background: tpl.preview }">
                  <span class="template-icon">{{ tpl.icon }}</span>
                </div>
                <span class="template-name">{{ tpl.name }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 数据图表设置 -->
        <div class="form-section">
          <label class="form-label">
            数据可视化
            <span class="label-tip">在PPT中添加图表</span>
          </label>
          <div class="chart-options">
            <label class="checkbox-label">
              <input type="checkbox" v-model="formData.includeCharts" />
              <span>包含数据图表</span>
            </label>
          </div>
          <div v-if="formData.includeCharts" class="chart-type-select">
            <label class="checkbox-label">
              <input type="checkbox" v-model="formData.includePieChart" />
              <span>饼图</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" v-model="formData.includeBarChart" />
              <span>柱状图</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" v-model="formData.includeLineChart" />
              <span>折线图</span>
            </label>
          </div>
        </div>

        <!-- 水印设置 -->
        <div class="form-section">
          <label class="form-label">
            高级设置
            <span class="label-tip">可选功能</span>
          </label>
          <div class="chart-options">
            <label class="checkbox-label">
              <input type="checkbox" v-model="formData.addWatermark" />
              <span>添加水印</span>
            </label>
          </div>
        </div>

        <!-- 主题色 -->
        <div class="form-section">
          <label class="form-label">主题色</label>
          <div class="theme-colors">
            <div
              v-for="color in themeColors"
              :key="color.value"
              class="theme-color"
              :class="{ active: formData.themeColor === color.value }"
              :style="{ background: color.value }"
              @click="formData.themeColor = color.value"
            >
              <span v-if="formData.themeColor === color.value" class="check">✓</span>
            </div>
          </div>
        </div>

        <!-- 文字样式方案 -->
        <div class="form-section">
          <label class="form-label">文字样式方案</label>
          <div class="text-style-options">
            <div
              v-for="option in textStyleOptions"
              :key="option.value"
              class="text-style-option"
              :class="{ active: formData.textStyle === option.value }"
              @click="formData.textStyle = option.value"
            >
              <div class="option-icon">{{ option.icon }}</div>
              <div class="option-info">
                <div class="option-name">{{ option.name }}</div>
                <div class="option-desc">{{ option.desc }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 遮罩透明度选择（仅半透明遮罩样式时显示） -->
        <div class="form-section" v-if="formData.textStyle === 'transparent_overlay'">
          <label class="form-label">遮罩透明度: {{ formData.overlayTransparency }}%</label>
          <div class="slider-group">
            <input
              type="range"
              v-model.number="formData.overlayTransparency"
              min="10"
              max="80"
              step="5"
              class="slider"
            />
            <span class="slider-value">{{ formData.overlayTransparency }}%</span>
          </div>
        </div>

        <!-- 阴影颜色选择（仅文字阴影样式时显示） -->
        <div class="form-section" v-if="formData.textStyle === 'shadow'">
          <label class="form-label">阴影颜色</label>
          <div class="theme-colors">
            <div
              v-for="color in shadowColors"
              :key="color.value"
              class="theme-color"
              :class="{ active: formData.shadowColor === color.value }"
              :style="{ background: color.value }"
              @click="formData.shadowColor = color.value"
            >
              <span v-if="formData.shadowColor === color.value" class="check">✓</span>
            </div>
          </div>
        </div>

        <!-- 智能布局模式开关 -->
        <div class="form-section">
          <label class="form-label">生成模式</label>
          <div class="mode-toggle">
            <div
              class="mode-option"
              :class="{ active: !formData.useSmartLayout }"
              @click="formData.useSmartLayout = false"
            >
              <span class="mode-icon">🎨</span>
              <span class="mode-name">AI智能生成</span>
              <span class="mode-desc">火山引擎AI生成精美SVG</span>
            </div>
            <div
              class="mode-option"
              :class="{ active: formData.useSmartLayout }"
              @click="formData.useSmartLayout = true"
            >
              <span class="mode-icon">📐</span>
              <span class="mode-name">智能布局模式</span>
              <span class="mode-desc">8种布局+自动配色</span>
            </div>
          </div>
        </div>

        <!-- 背景颜色设置 -->
        <div class="form-section" v-if="formData.useSmartLayout">
          <label class="form-label">页面背景设置</label>
          <div class="background-mode-toggle">
            <div
              class="bg-mode-option"
              :class="{ active: formData.backgroundMode === '统一' }"
              @click="formData.backgroundMode = '统一'"
            >
              <span class="bg-mode-name">统一背景</span>
              <span class="bg-mode-desc">所有页面使用相同背景</span>
            </div>
            <div
              class="bg-mode-option"
              :class="{ active: formData.backgroundMode === '自定义' }"
              @click="formData.backgroundMode = '自定义'"
            >
              <span class="bg-mode-name">自定义每页</span>
              <span class="bg-mode-desc">单独设置每页背景</span>
            </div>
          </div>

          <!-- 统一背景模式 -->
          <div v-if="formData.backgroundMode === '统一'" class="unified-bg-setting">
            <label class="form-label-sub">统一背景颜色</label>
            <div class="theme-colors">
              <div
                v-for="color in backgroundColors"
                :key="color.value"
                class="theme-color"
                :class="{ active: formData.unifiedBackground === color.value }"
                :style="{ background: color.value }"
                @click="formData.unifiedBackground = color.value"
              >
                <span v-if="formData.unifiedBackground === color.value" class="check">✓</span>
              </div>
            </div>
          </div>

          <!-- 自定义每页背景 -->
          <div v-if="formData.backgroundMode === '自定义'" class="custom-bg-setting">
            <div
              v-for="i in formData.slideCount"
              :key="i"
              class="slide-bg-item"
            >
              <span class="slide-index">第 {{ i }} 页</span>
              <div class="theme-colors">
                <div
                  v-for="color in backgroundColors"
                  :key="color.value"
                  class="theme-color theme-color-sm"
                  :class="{ active: formData.slideBackgrounds[i-1] === color.value }"
                  :style="{ background: color.value }"
                  @click="formData.slideBackgrounds[i-1] = color.value"
                >
                  <span v-if="formData.slideBackgrounds[i-1] === color.value" class="check">✓</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 布局类型设置 -->
        <div class="form-section" v-if="formData.useSmartLayout">
          <label class="form-label">页面布局设置</label>
          <div class="background-mode-toggle">
            <div
              class="bg-mode-option"
              :class="{ active: formData.layoutMode === '统一' }"
              @click="formData.layoutMode = '统一'"
            >
              <span class="bg-mode-name">统一布局</span>
              <span class="bg-mode-desc">所有页面使用相同布局</span>
            </div>
            <div
              class="bg-mode-option"
              :class="{ active: formData.layoutMode === '自定义' }"
              @click="formData.layoutMode = '自定义'"
            >
              <span class="bg-mode-name">自定义每页</span>
              <span class="bg-mode-desc">单独设置每页布局</span>
            </div>
          </div>

          <!-- 统一布局模式 -->
          <div v-if="formData.layoutMode === '统一'" class="unified-layout-setting">
            <label class="form-label-sub">统一布局类型</label>
            <div class="layout-options">
              <div
                v-for="layout in layoutOptions"
                :key="layout.value"
                class="layout-option"
                :class="{ active: formData.unifiedLayout === layout.value }"
                @click="formData.unifiedLayout = layout.value"
              >
                <span class="layout-icon">{{ layout.icon }}</span>
                <span class="layout-name">{{ layout.name }}</span>
              </div>
            </div>
          </div>

          <!-- 自定义每页布局 -->
          <div v-if="formData.layoutMode === '自定义'" class="custom-layout-setting">
            <div
              v-for="i in formData.slideCount"
              :key="i"
              class="slide-layout-item"
            >
              <span class="slide-index">第 {{ i }} 页</span>
              <div class="layout-options layout-options-sm">
                <div
                  v-for="layout in layoutOptions"
                  :key="layout.value"
                  class="layout-option layout-option-sm"
                  :class="{ active: formData.slideLayouts[i-1] === layout.value }"
                  @click="formData.slideLayouts[i-1] = layout.value"
                >
                  <span class="layout-icon">{{ layout.icon }}</span>
                  <span class="layout-name">{{ layout.name }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 素材选择 -->
        <div class="form-section" v-if="pptImages.length > 0">
          <label class="form-label">我的素材</label>
          <div class="ppt-images-grid">
            <div
              v-for="img in pptImages"
              :key="img.id"
              class="ppt-image-item"
              :class="{ selected: selectedPptImages.includes(img.url) }"
              @click="togglePptImage(img.url)"
            >
              <img :src="img.url" :alt="img.name" />
              <span class="ppt-image-check" v-if="selectedPptImages.includes(img.url)">✓</span>
            </div>
          </div>
          <p class="ppt-images-tip">点击选择图片，生成的PPT将优先使用这些图片</p>
          <button class="btn btn-sm btn-outline" @click="clearPptImages">清空素材</button>
        </div>

        <!-- 提交按钮 -->
        <div class="form-actions">
          <button
            class="btn btn-primary btn-lg"
            :disabled="!isValid || isSubmitting"
            @click="handleSubmit"
          >
            <span v-if="isSubmitting" class="spinner"></span>
            <span v-else>✨ 开始生成</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const route = useRoute()

// 表单数据
const formData = ref<{
  userRequest: string
  slideCount: number
  scene: string
  style: string
  template: string
  themeColor: string
  textStyle: string
  shadowColor: string
  overlayTransparency: number
  useSmartLayout: boolean
  backgroundMode: string
  unifiedBackground: string
  slideBackgrounds: string[]
  layoutMode: string
  unifiedLayout: string
  slideLayouts: string[]
  includeCharts: boolean
  includePieChart: boolean
  includeBarChart: boolean
  includeLineChart: boolean
  addWatermark: boolean
}>({
  userRequest: '',
  slideCount: 10,
  scene: 'business',
  style: 'professional',
  template: 'default',
  themeColor: '#165DFF',
  textStyle: 'transparent_overlay',
  shadowColor: '#000000',
  overlayTransparency: 30,
  useSmartLayout: false,
  backgroundMode: '统一',  // 统一或自定义
  unifiedBackground: '#165DFF',  // 统一背景色
  slideBackgrounds: [],  // 每页背景色数组
  layoutMode: '统一',  // 统一或自定义
  unifiedLayout: 'content_card',  // 统一布局
  slideLayouts: [],  // 每页布局数组
  includeCharts: false,  // 包含图表
  includePieChart: true,  // 饼图
  includeBarChart: true,  // 柱状图
  includeLineChart: false,  // 折线图
  addWatermark: false  // 添加水印
})

// PPT素材
const pptImages = ref<{ id: string; url: string; name: string }[]>([])
const selectedPptImages = ref<string[]>([])

// 加载PPT素材
const loadPptImages = () => {
  const saved = localStorage.getItem('ppt_images')
  if (saved) {
    pptImages.value = JSON.parse(saved)
  }
}

// 切换选择图片
const togglePptImage = (url: string) => {
  const index = selectedPptImages.value.indexOf(url)
  if (index > -1) {
    selectedPptImages.value.splice(index, 1)
  } else {
    selectedPptImages.value.push(url)
  }
}

// 清空素材
const clearPptImages = () => {
  localStorage.removeItem('ppt_images')
  pptImages.value = []
  selectedPptImages.value = []
}

// 验证错误
const errors = ref({
  userRequest: ''
})

// 提交状态
const isSubmitting = ref(false)

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
  { value: '#BF5AF2', name: '荧光紫' }
]

// 模板选项
const templateOptions = [
  { value: 'default', name: '默认商务', icon: '📊', preview: 'linear-gradient(135deg, #667eea, #764ba2)' },
  { value: 'modern', name: '现代简约', icon: '✨', preview: 'linear-gradient(135deg, #11998e, #38ef7d)' },
  { value: 'tech', name: '科技未来', icon: '🚀', preview: 'linear-gradient(135deg, #0f0c29, #302b63)' },
  { value: 'classic', name: '经典大气', icon: '👔', preview: 'linear-gradient(135deg, #232526, #414345)' }
]

// 文字样式选项
const textStyleOptions = [
  {
    value: 'transparent_overlay',
    name: '半透明遮罩',
    desc: '在图片上添加半透明黑色层，文字更清晰',
    icon: '🎨'
  },
  {
    value: 'shadow',
    name: '文字阴影',
    desc: '白色文字带阴影效果，图片上清晰可见',
    icon: '✨'
  }
]

// 阴影颜色选项
const shadowColors = [
  { value: '#000000', name: '黑色' },
  { value: '#333333', name: '深灰' },
  { value: '#FFFF00', name: '黄色' },
  { value: '#FF0000', name: '红色' },
  { value: '#165DFF', name: '蓝色' },
  { value: '#34C759', name: '绿色' },
  { value: '#FF9500', name: '橙色' }
]

// 背景颜色选项
const backgroundColors = [
  { value: '#165DFF', name: '科技蓝' },
  { value: '#34C759', name: '自然绿' },
  { value: '#FF9500', name: '活力橙' },
  { value: '#FF3B30', name: '热情红' },
  { value: '#AF52DE', name: '神秘紫' },
  { value: '#1A1A1A', name: '经典黑' },
  { value: '#5856D6', name: '暗紫色' },
  { value: '#FFFFFF', name: '纯白色' }
]

// 布局类型选项
const layoutOptions = [
  { value: 'title_slide', name: '封面', icon: '📄', desc: '标题封面页' },
  { value: 'content_card', name: '卡片', icon: '🃏', desc: '内容卡片布局' },
  { value: 'two_column', name: '双栏', icon: '📊', desc: '左右双栏布局' },
  { value: 'center_radiation', name: '中心辐射', icon: '🌀', desc: '中心发散布局' },
  { value: 'timeline', name: '时间线', icon: '📅', desc: '时间轴布局' },
  { value: 'data_visualization', name: '数据可视化', icon: '📈', desc: '图表数据展示' },
  { value: 'quote', name: '金句', icon: '💬', desc: '引用金句布局' },
  { value: 'comparison', name: '对比', icon: '⚖️', desc: '左右对比布局' }
]

// 验证输入
const validateRequest = () => {
  if (!formData.value.userRequest.trim()) {
    errors.value.userRequest = '请输入需求描述'
  } else if (formData.value.userRequest.length < 10) {
    errors.value.userRequest = '需求描述至少需要 10 个字符'
  } else {
    errors.value.userRequest = ''
  }
}

// 表单是否有效
const isValid = computed(() => {
  return formData.value.userRequest.length >= 10 && formData.value.userRequest.length <= 2000
})

// 提交
const handleSubmit = async () => {
  validateRequest()
  if (!isValid.value) return

  isSubmitting.value = true

  // 构建背景设置
  let slideBackgrounds = null
  if (formData.value.useSmartLayout) {
    if (formData.value.backgroundMode === '统一') {
      // 统一背景：所有页面使用相同颜色
      slideBackgrounds = []
      for (let i = 0; i < formData.value.slideCount; i++) {
        slideBackgrounds.push({
          slide_index: i,
          background_type: 'color',
          background_color: formData.value.unifiedBackground
        })
      }
    } else {
      // 自定义每页背景
      slideBackgrounds = []
      for (let i = 0; i < formData.value.slideCount; i++) {
        slideBackgrounds.push({
          slide_index: i,
          background_type: 'color',
          background_color: formData.value.slideBackgrounds[i] || formData.value.themeColor
        })
      }
    }
  }

  // 构建布局设置
  let slideLayouts = null
  if (formData.value.useSmartLayout) {
    if (formData.value.layoutMode === '统一') {
      // 统一布局：所有页面使用相同布局
      slideLayouts = []
      for (let i = 0; i < formData.value.slideCount; i++) {
        // 首页强制使用封面布局
        const layout = i === 0 ? 'title_slide' : formData.value.unifiedLayout
        slideLayouts.push({
          slide_index: i,
          layout_type: layout
        })
      }
    } else {
      // 自定义每页布局
      slideLayouts = []
      for (let i = 0; i < formData.value.slideCount; i++) {
        // 首页强制使用封面布局
        const layout = i === 0 ? 'title_slide' : (formData.value.slideLayouts[i] || formData.value.unifiedLayout)
        slideLayouts.push({
          slide_index: i,
          layout_type: layout
        })
      }
    }
  }

  try {
    const response = await axios.post('/api/v1/ppt/generate', {
      user_request: formData.value.userRequest,
      slide_count: formData.value.slideCount,
      scene: formData.value.scene,
      style: formData.value.style,
      template: formData.value.template,
      theme_color: formData.value.themeColor,
      text_style: formData.value.textStyle,
      shadow_color: formData.value.shadowColor,
      overlay_transparency: formData.value.overlayTransparency,
      use_smart_layout: formData.value.useSmartLayout,
      slide_backgrounds: slideBackgrounds,
      slide_layouts: slideLayouts,
      include_charts: formData.value.includeCharts,
      include_pie_chart: formData.value.includePieChart,
      include_bar_chart: formData.value.includeBarChart,
      include_line_chart: formData.value.includeLineChart,
      add_watermark: formData.value.addWatermark
    })

    const { task_id } = response.data

    // 保存到历史记录
    const history = JSON.parse(localStorage.getItem('ppt_history') || '[]')
    history.unshift({
      taskId: task_id,
      title: formData.value.userRequest.substring(0, 20),
      request: formData.value.userRequest,
      slideCount: formData.value.slideCount,
      style: formData.value.style,
      createdAt: new Date().toISOString()
    })
    // 只保留最近20条
    if (history.length > 20) history.pop()
    localStorage.setItem('ppt_history', JSON.stringify(history))

    // 跳转到生成页面
    router.push({
      path: '/generating',
      query: { taskId: task_id }
    })
  } catch (error: any) {
    isSubmitting.value = false
    const errorMsg = error.response?.data?.detail || '网络错误，请检查网络连接'
    const retry = confirm(`${errorMsg}\n\n是否重试？`)
    if (retry) {
      handleSubmit()
    }
  } finally {
    isSubmitting.value = false
  }
}

// 页面加载时检查是否有场景参数
onMounted(() => {
  if (route.query.scene) {
    formData.value.scene = route.query.scene as string
  }
  // 加载PPT素材
  loadPptImages()
})
</script>

<style scoped>
.create {
  min-height: 80vh;
  padding: 40px 0 80px;
  background: linear-gradient(180deg, #F5F5F5 0%, #fff 100%);
}

.create-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-title {
  font-size: 36px;
  font-weight: 700;
  color: #1A1A1A;
  margin-bottom: 8px;
}

.page-subtitle {
  font-size: 16px;
  color: #666;
}

.create-form {
  max-width: 700px;
  margin: 0 auto;
  background: #fff;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}

.form-section {
  margin-bottom: 28px;
}

.form-label {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
}

.form-hint {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 13px;
}

.label-tip {
  font-size: 12px;
  font-weight: normal;
  color: #999;
  margin-left: 8px;
}

.quick-examples {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.tip-label {
  font-size: 13px;
  color: #999;
}

.example-btn {
  padding: 4px 12px;
  background: #f0f7ff;
  border: 1px solid #d0e8ff;
  border-radius: 16px;
  font-size: 12px;
  color: #165DFF;
  cursor: pointer;
  transition: all 0.2s;
}

.example-btn:hover {
  background: #e0f0ff;
  border-color: #165DFF;
}

.chart-options {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.chart-type-select {
  margin-top: 12px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

@media (max-width: 600px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}

.slider-group {
  display: flex;
  align-items: center;
  gap: 16px;
}

.slider {
  flex: 1;
  height: 6px;
  -webkit-appearance: none;
  background: #E5E5E5;
  border-radius: 3px;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  background: linear-gradient(135deg, #165DFF, #5AC8FA);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(22, 93, 255, 0.3);
}

.slider-value {
  min-width: 60px;
  font-size: 15px;
  font-weight: 500;
  color: #165DFF;
}

/* 模板选择 */
.template-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.template-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s;
}

.template-preview {
  width: 100%;
  aspect-ratio: 16/9;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  border: 2px solid transparent;
}

.template-card.active .template-preview {
  border-color: #165DFF;
}

.template-icon {
  font-size: 24px;
}

.template-name {
  font-size: 13px;
  color: #333;
}

.template-card.active .template-name {
  color: #165DFF;
  font-weight: 500;
}

.theme-colors {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.theme-color {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  border: 3px solid transparent;
}

.theme-color:hover {
  transform: scale(1.1);
}

.theme-color.active {
  border-color: #333;
}

.check {
  color: #fff;
  font-weight: bold;
}

/* 文字样式选项 */
.text-style-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

@media (max-width: 600px) {
  .text-style-options {
    grid-template-columns: 1fr;
  }
}

.text-style-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border: 2px solid #E5E5E5;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.text-style-option:hover {
  border-color: #165DFF;
  background: #F0F7FF;
}

.text-style-option.active {
  border-color: #165DFF;
  background: #E6F0FF;
}

.option-icon {
  font-size: 24px;
}

.option-info {
  flex: 1;
}

.option-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.option-desc {
  font-size: 12px;
  color: #888;
  margin-top: 2px;
}

.form-actions {
  margin-top: 36px;
  text-align: center;
}

.btn-lg {
  padding: 16px 48px;
  font-size: 17px;
  min-width: 200px;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* 模式切换 */
.mode-toggle {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 600px) {
  .mode-toggle {
    grid-template-columns: 1fr;
  }
}

.mode-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 16px;
  border: 2px solid #E5E5E5;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.mode-option:hover {
  border-color: #165DFF;
  background: #F0F7FF;
}

.mode-option.active {
  border-color: #165DFF;
  background: #E6F0FF;
}

.mode-icon {
  font-size: 28px;
  margin-bottom: 8px;
}

.mode-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.mode-desc {
  font-size: 12px;
  color: #888;
}

/* 背景设置 */
.background-mode-toggle {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.bg-mode-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px;
  border: 2px solid #E5E5E5;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.bg-mode-option:hover {
  border-color: #165DFF;
}

.bg-mode-option.active {
  border-color: #165DFF;
  background: #E6F0FF;
}

.bg-mode-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.bg-mode-desc {
  font-size: 12px;
  color: #888;
}

.form-label-sub {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #666;
  margin-bottom: 8px;
  margin-top: 12px;
}

.unified-bg-setting {
  padding: 12px;
  background: #F9F9F9;
  border-radius: 8px;
}

.custom-bg-setting {
  max-height: 300px;
  overflow-y: auto;
  padding: 12px;
  background: #F9F9F9;
  border-radius: 8px;
}

.slide-bg-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #EEE;
}

.slide-bg-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.slide-index {
  min-width: 60px;
  font-size: 13px;
  font-weight: 500;
  color: #666;
}

.theme-color-sm {
  width: 32px;
  height: 32px;
}

/* 布局设置 */
.unified-layout-setting {
  margin-top: 12px;
}

.layout-options {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .layout-options {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .layout-option {
    padding: 10px 6px;
  }

  .layout-icon {
    font-size: 24px;
  }

  .layout-name {
    font-size: 13px;
  }

  .layout-options-sm {
    grid-template-columns: repeat(2, 1fr);
  }
}

.layout-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  border: 2px solid #E5E5E5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.layout-option:hover {
  border-color: #165DFF;
}

.layout-option.active {
  border-color: #165DFF;
  background: #E6F0FF;
}

.layout-icon {
  font-size: 20px;
  margin-bottom: 4px;
}

.layout-name {
  font-size: 12px;
  font-weight: 500;
  color: #333;
}

.custom-layout-setting {
  max-height: 300px;
  overflow-y: auto;
  padding: 12px;
  background: #F9F9F9;
  border-radius: 8px;
  margin-top: 12px;
}

.slide-layout-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #EEE;
}

.slide-layout-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.layout-options-sm {
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.layout-option-sm {
  padding: 8px 4px;
}

.layout-option-sm .layout-icon {
  font-size: 16px;
  margin-bottom: 2px;
}

.layout-option-sm .layout-name {
  font-size: 11px;
}

/* PPT素材 */
.ppt-images-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}

.ppt-image-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
}

.ppt-image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ppt-image-item.selected {
  border-color: #165DFF;
}

.ppt-image-check {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  background: #165DFF;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.ppt-images-tip {
  font-size: 13px;
  color: #666;
  margin-bottom: 12px;
}

.btn-sm {
  padding: 6px 16px;
  font-size: 13px;
}

.btn-outline {
  background: transparent;
  border: 1px solid #ddd;
  color: #666;
}

.btn-outline:hover {
  background: #f5f5f5;
}

@media (max-width: 768px) {
  .ppt-images-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
