<template>
  <div class="generating">
    <div class="container">
      <div class="generating-layout">
        <!-- 左侧：进度卡片 -->
        <div class="generating-card">
          <div class="generating-icon">
            <div class="ai-orb">
              <div class="orb-ring"></div>
              <div class="orb-ring" style="animation-delay: -0.5s"></div>
              <div class="orb-ring" style="animation-delay: -1s"></div>
              <div class="orb-core">✨</div>
            </div>
          </div>

          <h2 class="generating-title">{{ statusText }}</h2>
          <p class="generating-desc">{{ currentStep }}</p>

          <!-- 进度条 -->
          <div class="progress-wrapper">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
            </div>
            <div class="progress-info">
              <span class="progress-percent">{{ progress }}%</span>
              <span class="progress-time" v-if="progress > 0 && progress < 100">预计剩余 {{ estimatedTime }} 秒</span>
            </div>
          </div>

          <!-- 步骤提示 -->
          <div class="steps">
            <div
              v-for="(step, index) in steps"
              :key="step.key"
              class="step"
              :class="{ active: currentStepKey === step.key, completed: stepOrder.indexOf(currentStepKey) > index }"
            >
              <div class="step-icon">{{ step.icon }}</div>
              <span class="step-name">{{ step.name }}</span>
            </div>
          </div>

          <!-- 取消按钮 -->
          <div class="actions">
            <button class="btn btn-ghost" @click="handleCancel">
              取消生成
            </button>
          </div>
        </div>

        <!-- 右侧：实时预览 -->
        <div class="preview-panel">
          <div class="preview-header">
            <h3>实时预览</h3>
            <span class="preview-count">{{ previewSlides.length }} / {{ totalSlides }} 页</span>
          </div>
          <div class="preview-grid">
            <div
              v-for="(slide, index) in previewSlides"
              :key="slide.slide_num"
              class="preview-slide"
              :class="{ active: index === currentPreviewIndex }"
            >
              <div class="slide-number">{{ slide.slide_num }}</div>
              <img :src="slide.url" :alt="`Slide ${slide.slide_num}`" @load="onSlideLoad(index)" />
            </div>
            <!-- 占位符 -->
            <div
              v-for="i in (totalSlides - previewSlides.length)"
              :key="`placeholder-${i}`"
              class="preview-slide placeholder"
            >
              <div class="placeholder-content">
                <span class="placeholder-number">{{ previewSlides.length + i }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 错误弹窗 -->
    <div v-if="showErrorModal" class="error-modal-overlay">
      <div class="error-modal">
        <div class="error-icon">⚠️</div>
        <h3>生成遇到问题</h3>
        <p>{{ showError }}</p>
        <div class="error-actions">
          <button class="btn btn-primary" @click="retryGenerate">重试</button>
          <button class="btn btn-secondary" @click="goHome">返回首页</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { api } from '../api/client'
import { useKeyboardShortcuts } from '../composables/useKeyboardShortcuts'
import { usePushNotification } from '../composables/usePushNotification'

const router = useRouter()
const route = useRoute()

const taskId = computed(() => route.query.taskId as string)

// 状态
const status = ref('pending')
const progress = ref(0)
const currentStepKey = ref('init')
const showErrorModal = ref(false)
const showError = ref('')
const errorCount = ref(0)
const startTime = ref(Date.now())

// 预览相关状态
const previewSlides = ref<{ slide_num: number; url: string }[]>([])
const totalSlides = ref(10)
const currentPreviewIndex = ref(0)
let previewPollTimer: number | null = null

const estimatedTime = computed(() => {
  if (progress.value <= 0) return 60
  if (progress.value >= 95) return 10 // 即将完成
  if (progress.value >= 85) return 60 // PPTX转换阶段最慢
  if (progress.value >= 80) return 30 // SVG转PPTX开始
  if (progress.value >= 48) return 45 // SVG渲染阶段

  // 内容生成阶段（0-48%）
  const elapsed = (Date.now() - startTime.value) / 1000
  const total = elapsed / (progress.value / 100)
  return Math.max(10, Math.round(total - elapsed))
})

// 步骤定义
const steps = [
  { key: 'init', name: '初始化', icon: '⚡' },
  { key: 'content', name: '生成内容', icon: '📝' },
  { key: 'svg', name: '渲染设计', icon: '🎨' },
  { key: 'pptx', name: '转换文件', icon: '📄' },
  { key: 'done', name: '完成', icon: '✅' }
]

const stepOrder = ['init', 'content', 'svg', 'pptx', 'done']

// 状态文本
const statusText = computed(() => {
  switch (status.value) {
    case 'pending': return '准备生成...'
    case 'processing': return 'AI 正在创作中'
    case 'completed': return '生成完成!'
    case 'failed': return '生成失败'
    default: return '处理中'
  }
})

// 当前步骤
const currentStep = computed(() => {
  const step = steps.find(s => s.key === currentStepKey.value)
  return step?.name || '处理中'
})

// 轮询定时器
let pollTimer: number | null = null

// 轮询任务状态
const pollStatus = async () => {
  if (!taskId.value) return

  try {
    const response = await api.ppt.getTask(taskId.value)
    const data = response.data

    status.value = data.status
    progress.value = data.progress

    // 优先使用后端返回的步骤名称
    if (data.current_step) {
      currentStepKey.value = getStepKeyFromName(data.current_step)
    } else {
      currentStepKey.value = getStepKey(data.progress)
    }

    // 获取总页数
    if (data.result?.slide_count) {
      totalSlides.value = data.result.slide_count
    }

    if (data.status === 'completed') {
      // 发送完成通知
      notifyComplete()
      // 跳转到结果页
      router.push(`/result/${taskId.value}`)
    } else if (data.status === 'failed') {
      notifyFailed(data.error?.message)
      showError.value = data.error?.message || '生成失败，请重试'
      showErrorModal.value = true
    }
  } catch (error) {
    console.error('查询状态失败:', error)
    errorCount.value++
    if (errorCount.value >= 3) {
      showError.value = '网络不稳定，请检查网络后刷新页面'
      showErrorModal.value = true
    }
  }
}

// 获取预览图
const pollPreview = async () => {
  if (!taskId.value) return

  try {
    const response = await api.ppt.getTaskPreview(taskId.value)
    const data = response.data

    if (data.slides && data.slides.length > 0) {
      // 添加时间戳避免缓存
      const slidesWithTimestamp = data.slides.map((s: { slide_num: number; url: string }) => ({
        slide_num: s.slide_num,
        url: `${s.url}?t=${Date.now()}`
      }))

      // 更新预览（只在有新幻灯片时更新）
      if (slidesWithTimestamp.length > previewSlides.value.length) {
        previewSlides.value = slidesWithTimestamp
        // 自动滚动到最新
        currentPreviewIndex.value = slidesWithTimestamp.length - 1
        // 同步更新总页数（AI可能生成超过预设页数）
        if (slidesWithTimestamp.length > totalSlides.value) {
          totalSlides.value = slidesWithTimestamp.length
        }
      }
    }
  } catch (error) {
    // 预览获取失败不显示错误，静默处理
    console.debug('获取预览失败:', error)
  }
}

// 幻灯片加载完成
const onSlideLoad = (index: number) => {
  console.debug(`Slide ${index + 1} loaded`)
}

// 根据进度获取步骤
const getStepKey = (progress: number): string => {
  if (progress < 20) return 'init'
  if (progress < 50) return 'content'
  if (progress < 80) return 'svg'
  if (progress < 100) return 'pptx'
  return 'done'
}

// 根据后端步骤名称获取前端步骤key
const getStepKeyFromName = (stepName: string): string => {
  const name = stepName.toLowerCase()
  if (name.includes('初始化') || name.includes('解析') || name.includes('pending')) return 'init'
  // 两阶段模式：内容已确认后直接进入渲染，跳过纯"内容"关键词
  if (name.includes('SVG') || name.includes('渲染') || name.includes('design')) return 'svg'
  if (name.includes('内容') || (name.includes('生成') && !name.includes('SVG'))) return 'content'
  if (name.includes('转换') || name.includes('PPTX') || name.includes('file')) return 'pptx'
  if (name.includes('完成') || name.includes('优化') || name.includes('completed')) return 'done'
  return 'content'
}

// 取消生成
const handleCancel = async () => {
  if (!taskId.value) return

  try {
    await api.ppt.cancelTask(taskId.value)
    router.push('/create')
  } catch (error) {
    console.error('取消失败:', error)
    alert('取消失败，请稍后重试')
  }
}

// 重试
const retryGenerate = () => {
  showErrorModal.value = false
  errorCount.value = 0
  status.value = 'pending'
  progress.value = 0
  currentStepKey.value = 'init'
  pollStatus()
  pollTimer = window.setInterval(pollStatus, 2000)
}

// 返回首页
const goHome = () => {
  router.push('/')
}

// 页面加载时开始轮询
// 通知相关
const { prepareForGeneration, notifyGenerationComplete, notifyGenerationFailed, initNotifications } = usePushNotification()

const notifyComplete = () => {
  notifyGenerationComplete(taskId.value, '您的 PPT 已生成完毕！')
}

const notifyFailed = (error?: string) => {
  notifyGenerationFailed(taskId.value, error)
}

onMounted(() => {
  initNotifications()
  prepareForGeneration()
  pollStatus()
  pollPreview()
  pollTimer = window.setInterval(pollStatus, 3000)
  previewPollTimer = window.setInterval(pollPreview, 3000)
})

// 键盘快捷键
useKeyboardShortcuts([
  {
    key: 'Escape',
    handler: () => {
      if (!showErrorModal.value) {
        handleCancel()
      }
    },
    description: '取消生成'
  }
])

// 页面卸载时停止轮询
onUnmounted(() => {
  if (pollTimer) {
    clearInterval(pollTimer)
  }
  if (previewPollTimer) {
    clearInterval(previewPollTimer)
  }
})
</script>

<style scoped>
.generating {
  min-height: 80vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 40px 0;
}

.generating-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  max-width: 1200px;
  width: 100%;
}

.generating-card {
  text-align: center;
  padding: 40px;
  background: var(--white);
  border-radius: 24px;
  box-shadow: var(--shadow-lg);
}

.generating-icon {
  margin-bottom: 32px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ai-orb {
  position: relative;
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.orb-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 3px solid transparent;
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: orbit 2s linear infinite;
}

.orb-ring:nth-child(2) {
  width: 80%;
  height: 80%;
  border-top-color: var(--secondary);
  animation-duration: 1.5s;
  animation-direction: reverse;
}

.orb-ring:nth-child(3) {
  width: 60%;
  height: 60%;
  border-top-color: var(--accent);
  animation-duration: 1s;
}

.orb-core {
  font-size: 36px;
  animation: glow 1.5s ease-in-out infinite;
}

@keyframes orbit {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes glow {
  0%, 100% { transform: scale(1); filter: brightness(1); }
  50% { transform: scale(1.1); filter: brightness(1.3); }
}

.generating-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--gray-900);
  margin-bottom: 8px;
}

.generating-desc {
  font-size: 15px;
  color: var(--gray-500);
  margin-bottom: 32px;
}

.progress-wrapper {
  margin-bottom: 40px;
}

.progress-bar {
  height: 8px;
  background: var(--gray-200);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), var(--secondary));
  border-radius: 4px;
  transition: width 0.5s ease;
  will-change: width;
}

.progress-info {
  margin-top: 12px;
  text-align: right;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-percent {
  font-size: 14px;
  font-weight: 600;
  color: #165DFF;
}

.progress-time {
  font-size: 13px;
  color: #999;
}

.steps {
  display: flex;
  justify-content: space-between;
  margin-bottom: 40px;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  opacity: 0.4;
  transition: all 0.3s;
}

.step.active {
  opacity: 1;
}

.step.completed {
  opacity: 0.7;
}

.step-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  background: var(--gray-100);
  border-radius: 50%;
}

.step.active .step-icon {
  background: linear-gradient(135deg, var(--primary), var(--secondary));
}

.step.completed .step-icon {
  background: var(--success);
}

.step-name {
  font-size: 12px;
  color: var(--gray-500);
}

.step.active .step-name {
  color: var(--primary);
  font-weight: 500;
}

.actions {
  padding-top: 20px;
  border-top: 1px solid var(--gray-200);
}

/* 实时预览面板 */
.preview-panel {
  background: var(--white);
  border-radius: 24px;
  box-shadow: var(--shadow-lg);
  padding: 24px;
  max-height: 600px;
  overflow-y: auto;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--gray-200);
}

.preview-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--gray-900);
}

.preview-count {
  font-size: 13px;
  color: var(--gray-500);
  background: var(--gray-100);
  padding: 4px 12px;
  border-radius: 12px;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.preview-slide {
  position: relative;
  aspect-ratio: 16 / 9;
  border-radius: 8px;
  overflow: hidden;
  background: var(--gray-100);
  border: 2px solid transparent;
  transition: all 0.2s;
}

.preview-slide.active {
  border-color: var(--blue-500);
}

.preview-slide img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.slide-number {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  z-index: 1;
}

.preview-slide.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-content {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--gray-200);
  border-radius: 50%;
}

.placeholder-number {
  color: var(--gray-400);
  font-size: 14px;
  font-weight: 600;
}

/* 响应式 */
@media (max-width: 900px) {
  .generating-layout {
    grid-template-columns: 1fr;
  }

  .preview-panel {
    max-height: 400px;
  }

  .preview-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* 错误弹窗 */
.error-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.error-modal {
  background: var(--white);
  border-radius: 16px;
  padding: 32px;
  text-align: center;
  max-width: 400px;
  margin: 20px;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.error-modal h3 {
  font-size: 20px;
  color: var(--gray-900);
  margin-bottom: 12px;
}

.error-modal p {
  color: var(--gray-500);
  margin-bottom: 24px;
}

.error-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .generating-card {
    margin: 20px;
    padding: 32px 20px;
  }

  .success-icon {
    font-size: 64px;
  }

  .generating-title {
    font-size: 24px;
  }

  .steps {
    flex-direction: column;
    gap: 12px;
  }

  .step {
    flex-direction: row;
    justify-content: flex-start;
  }
}
</style>
