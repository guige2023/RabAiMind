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
          <label class="form-label">需求描述</label>
          <textarea
            v-model="formData.userRequest"
            class="input textarea"
            :class="{ error: errors.userRequest }"
            placeholder="例如：创建一个关于人工智能发展趋势的商业计划书，包含行业现状、未来预测、应用场景等..."
            rows="5"
            @input="validateRequest"
          ></textarea>
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
            <label class="form-label">模板</label>
            <select v-model="formData.template" class="input select">
              <option value="default">默认模板</option>
              <option value="modern">现代模板</option>
              <option value="tech">科技模板</option>
              <option value="classic">经典模板</option>
            </select>
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
const formData = ref({
  userRequest: '',
  slideCount: 10,
  scene: 'business',
  style: 'professional',
  template: 'default',
  themeColor: '#165DFF',
  textStyle: 'transparent_overlay',
  shadowColor: '#000000',
  overlayTransparency: 30
})

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
  { value: '#1A1A1A', name: '经典黑' }
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
      overlay_transparency: formData.value.overlayTransparency
    })

    const { task_id, status } = response.data

    // 跳转到生成页面
    router.push({
      path: '/generating',
      query: { taskId: task_id }
    })
  } catch (error: any) {
    alert(error.response?.data?.detail || '提交失败，请重试')
  } finally {
    isSubmitting.value = false
  }
}

// 页面加载时检查是否有场景参数
onMounted(() => {
  if (route.query.scene) {
    formData.value.scene = route.query.scene as string
  }
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
</style>
