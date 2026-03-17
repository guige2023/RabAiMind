<template>
  <div class="generating">
    <div class="container">
      <div class="generating-card">
        <div class="generating-icon">
          <div class="ai-brain">
            <span v-for="i in 5" :key="i" class="brain-wave" :style="{ animationDelay: `${i * 0.2}s` }">🧠</span>
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const route = useRoute()

const taskId = computed(() => route.query.taskId as string)

// 状态
const status = ref('pending')
const progress = ref(0)
const currentStepKey = ref('init')

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
    const response = await axios.get(`/api/v1/ppt/status/${taskId.value}`)
    const data = response.data

    status.value = data.status
    progress.value = data.progress
    currentStepKey.value = getStepKey(data.progress)

    if (data.status === 'completed') {
      // 跳转到结果页
      router.push({ path: '/result', query: { taskId: taskId.value } })
    } else if (data.status === 'failed') {
      alert(data.error?.message || '生成失败')
    }
  } catch (error) {
    console.error('查询状态失败:', error)
  }
}

// 根据进度获取步骤
const getStepKey = (progress: number): string => {
  if (progress < 20) return 'init'
  if (progress < 50) return 'content'
  if (progress < 80) return 'svg'
  if (progress < 100) return 'pptx'
  return 'done'
}

// 取消生成
const handleCancel = async () => {
  if (!taskId.value) return

  try {
    await axios.delete(`/api/v1/ppt/task/${taskId.value}`)
    router.push('/create')
  } catch (error) {
    console.error('取消失败:', error)
  }
}

// 页面加载时开始轮询
onMounted(() => {
  pollStatus()
  pollTimer = window.setInterval(pollStatus, 2000)
})

// 页面卸载时停止轮询
onUnmounted(() => {
  if (pollTimer) {
    clearInterval(pollTimer)
  }
})
</script>

<style scoped>
.generating {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.generating-card {
  max-width: 500px;
  text-align: center;
  padding: 60px 40px;
  background: #fff;
  border-radius: 24px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.1);
}

.generating-icon {
  margin-bottom: 32px;
}

.ai-brain {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.brain-wave {
  font-size: 28px;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.7; }
}

.generating-title {
  font-size: 28px;
  font-weight: 700;
  color: #1A1A1A;
  margin-bottom: 8px;
}

.generating-desc {
  font-size: 15px;
  color: #666;
  margin-bottom: 32px;
}

.progress-wrapper {
  margin-bottom: 40px;
}

.progress-bar {
  height: 8px;
  background: #E5E5E5;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #165DFF, #5AC8FA);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.progress-info {
  margin-top: 12px;
  text-align: right;
}

.progress-percent {
  font-size: 14px;
  font-weight: 600;
  color: #165DFF;
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
  background: #F5F5F5;
  border-radius: 50%;
}

.step.active .step-icon {
  background: linear-gradient(135deg, #165DFF, #5AC8FA);
}

.step.completed .step-icon {
  background: #34C759;
}

.step-name {
  font-size: 12px;
  color: #666;
}

.step.active .step-name {
  color: #165DFF;
  font-weight: 500;
}

.actions {
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}
</style>
