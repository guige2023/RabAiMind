<template>
  <div class="ppt-generator">
    <!-- 顶部标题 -->
    <div class="generator-header">
      <h1 class="title">RabAi Mind</h1>
      <p class="subtitle">AI 智能 PPT 生成平台</p>
    </div>

    <!-- 主要内容区域 -->
    <div class="generator-content">
      <!-- 输入表单 -->
      <div class="generator-form" v-if="!isCompleted && !isFailed">
        <div class="form-group">
          <label class="form-label">需求描述</label>
          <textarea
            v-model="formState.userRequest"
            class="form-textarea"
            :class="{ 'is-error': getFieldError('userRequest') }"
            placeholder="请描述您想要创建的 PPT 内容，例如：创建一个关于人工智能发展趋势的商业演示文稿，包含行业现状、未来预测、应用场景等"
            rows="5"
          ></textarea>
          <div class="form-hint">
            <span v-if="getFieldError('userRequest')" class="error-text">
              {{ getFieldError('userRequest') }}
            </span>
            <span class="char-count">
              {{ formState.userRequest.length }} / 2000
            </span>
          </div>
        </div>

        <!-- 参数配置 -->
        <div class="form-row">
          <div class="form-group flex-1">
            <label class="form-label">幻灯片数量</label>
            <div class="slider-wrapper">
              <input
                type="range"
                v-model.number="formState.slideCount"
                min="5"
                max="30"
                step="1"
                class="form-slider"
              />
              <span class="slider-value">{{ formState.slideCount }} 页</span>
            </div>
          </div>

          <div class="form-group flex-1">
            <label class="form-label">场景类型</label>
            <select v-model="formState.scene" class="form-select">
              <option value="business">商务</option>
              <option value="education">教育</option>
              <option value="tech">科技</option>
              <option value="creative">创意</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group flex-1">
            <label class="form-label">风格</label>
            <select v-model="formState.style" class="form-select">
              <option value="professional">专业</option>
              <option value="simple">简约</option>
              <option value="energetic">活力</option>
              <option value="premium">高端</option>
            </select>
          </div>

          <div class="form-group flex-1">
            <label class="form-label">模板</label>
            <select v-model="formState.template" class="form-select">
              <option value="default">默认</option>
              <option value="modern">现代</option>
              <option value="classic">经典</option>
              <option value="tech">科技</option>
            </select>
          </div>
        </div>

        <!-- 提交按钮 -->
        <div class="form-actions">
          <button
            type="button"
            class="btn btn-primary"
            :disabled="isGenerating || !isFormValid"
            @click="handleGenerate"
          >
            <span v-if="isGenerating" class="btn-loading">
              <i class="spinner"></i>
              生成中...
            </span>
            <span v-else>开始生成</span>
          </button>
        </div>
      </div>

      <!-- 生成进度 -->
      <div class="generator-progress" v-if="isGenerating">
        <div class="progress-card">
          <div class="progress-header">
            <span class="progress-status">{{ getStatusText() }}</span>
            <button
              type="button"
              class="btn btn-ghost btn-sm"
              @click="handleCancel"
            >
              取消
            </button>
          </div>
          <div class="progress-bar-wrapper">
            <div
              class="progress-bar"
              :style="{ width: taskState.progress + '%' }"
            ></div>
          </div>
          <div class="progress-info">
            <span>进度: {{ taskState.progress }}%</span>
            <span>{{ taskState.currentStep }}</span>
          </div>
        </div>
      </div>

      <!-- 生成结果 -->
      <div class="generator-result" v-if="isCompleted">
        <div class="result-card">
          <div class="result-icon success">
            <svg viewBox="0 0 24 24" width="48" height="48">
              <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
          </div>
          <h3 class="result-title">生成完成!</h3>
          <p class="result-info">
            共生成 {{ taskState.result?.slide_count || 0 }} 页幻灯片
          </p>
          <div class="result-actions">
            <button
              type="button"
              class="btn btn-primary"
              @click="handleDownload"
            >
              下载 PPT
            </button>
            <button
              type="button"
              class="btn btn-secondary"
              @click="handleCreateNew"
            >
              创建新的
            </button>
          </div>
        </div>
      </div>

      <!-- 错误提示 -->
      <div class="generator-error" v-if="isFailed">
        <div class="error-card">
          <div class="result-icon error">
            <svg viewBox="0 0 24 24" width="48" height="48">
              <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </div>
          <h3 class="result-title">生成失败</h3>
          <p class="error-message">{{ error?.message || '未知错误' }}</p>
          <div class="result-actions">
            <button
              type="button"
              class="btn btn-primary"
              @click="handleRetry"
            >
              重试
            </button>
            <button
              type="button"
              class="btn btn-secondary"
              @click="handleCreateNew"
            >
              重新输入
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * PPT 生成器组件
 *
 * 负责接收用户输入、提交生成任务、显示进度和结果
 */
import { usePptGenerator } from '../composables/usePptGenerator'

// 使用生成器 Composable
const {
  formState,
  taskState,
  validationErrors,
  error,
  isGenerating,
  isCompleted,
  isFailed,
  isFormValid,
  generatePpt,
  cancelTask,
  downloadPpt,
  resetForm,
  resetTask
} = usePptGenerator()

/**
 * 获取字段错误信息
 * @param field - 字段名
 * @returns 错误信息或 undefined
 */
function getFieldError(field: string): string | undefined {
  return validationErrors.value.find(e => e.field === field)?.message
}

/**
 * 获取状态文本
 * @returns 状态描述文本
 */
function getStatusText(): string {
  const statusMap: Record<string, string> = {
    pending: '等待处理',
    processing: '正在生成',
    completed: '生成完成',
    failed: '生成失败',
    cancelled: '已取消'
  }
  return statusMap[taskState.value.status] || '未知状态'
}

/**
 * 处理生成点击
 */
async function handleGenerate() {
  await generatePpt()
}

/**
 * 处理取消点击
 */
async function handleCancel() {
  await cancelTask()
}

/**
 * 处理下载点击
 */
async function handleDownload() {
  await downloadPpt()
}

/**
 * 处理重试点击
 */
async function handleRetry() {
  resetTask()
  await generatePpt()
}

/**
 * 处理新建点击
 */
function handleCreateNew() {
  resetForm()
  resetTask()
}
</script>

<style scoped>
/* 组件样式 */
.ppt-generator {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
}

/* 顶部标题 */
.generator-header {
  text-align: center;
  margin-bottom: 40px;
}

.title {
  font-size: 48px;
  font-weight: 700;
  color: #165DFF;
  margin: 0;
}

.subtitle {
  font-size: 18px;
  color: #666;
  margin: 8px 0 0;
}

/* 表单样式 */
.generator-content {
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

.form-group {
  margin-bottom: 24px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.form-textarea {
  width: 100%;
  padding: 12px 16px;
  font-size: 16px;
  font-family: inherit;
  border: 2px solid #E5E5E5;
  border-radius: 8px;
  resize: vertical;
  transition: border-color 0.2s;
}

.form-textarea:focus {
  outline: none;
  border-color: #165DFF;
}

.form-textarea.is-error {
  border-color: #FF3B30;
}

.form-hint {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: #999;
}

.error-text {
  color: #FF3B30;
}

.char-count {
  color: #999;
}

.form-row {
  display: flex;
  gap: 16px;
}

.flex-1 {
  flex: 1;
}

.form-select {
  width: 100%;
  padding: 10px 16px;
  font-size: 14px;
  border: 2px solid #E5E5E5;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
}

.form-select:focus {
  outline: none;
  border-color: #165DFF;
}

/* 滑块 */
.slider-wrapper {
  display: flex;
  align-items: center;
  gap: 16px;
}

.form-slider {
  flex: 1;
  height: 6px;
  -webkit-appearance: none;
  background: #E5E5E5;
  border-radius: 3px;
}

.form-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  background: #165DFF;
  border-radius: 50%;
  cursor: pointer;
}

.slider-value {
  font-size: 14px;
  color: #333;
  min-width: 50px;
}

/* 按钮样式 */
.form-actions {
  margin-top: 32px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 14px 32px;
  font-size: 16px;
  font-weight: 500;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  width: 100%;
  background: linear-gradient(135deg, #165DFF 0%, #0A84FF 100%);
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(22, 93, 255, 0.4);
}

.btn-secondary {
  background: #F5F5F5;
  color: #333;
}

.btn-secondary:hover {
  background: #E5E5E5;
}

.btn-ghost {
  background: transparent;
  color: #666;
}

.btn-ghost:hover {
  color: #333;
}

.btn-sm {
  padding: 8px 16px;
  font-size: 14px;
}

.btn-loading {
  display: flex;
  align-items: center;
  gap: 8px;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 进度卡片 */
.progress-card,
.result-card,
.error-card {
  text-align: center;
  padding: 40px 20px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.progress-status {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.progress-bar-wrapper {
  height: 8px;
  background: #E5E5E5;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #165DFF, #5AC8FA);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  font-size: 14px;
  color: #666;
}

/* 结果卡片 */
.result-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.result-icon.success {
  background: #E8F5E9;
  color: #34C759;
}

.result-icon.error {
  background: #FFEBEE;
  color: #FF3B30;
}

.result-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px;
}

.result-info {
  font-size: 16px;
  color: #666;
  margin: 0 0 24px;
}

.error-message {
  font-size: 14px;
  color: #FF3B30;
  margin: 0 0 24px;
}

.result-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.result-actions .btn {
  min-width: 140px;
}
</style>
