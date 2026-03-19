<template>
  <Teleport to="body">
    <Transition name="onboard-fade">
      <div v-if="showOnboarding" class="onboarding-overlay" @click="closeOnboarding">
        <div class="onboarding-modal" @click.stop>
          <!-- Progress -->
          <div class="onboarding-progress">
            <div class="progress-step" :class="{ active: step >= 1, completed: step > 1 }">
              <span class="step-num">1</span>
            </div>
            <div class="progress-line" :class="{ active: step > 1 }"></div>
            <div class="progress-step" :class="{ active: step >= 2, completed: step > 2 }">
              <span class="step-num">2</span>
            </div>
            <div class="progress-line" :class="{ active: step > 2 }"></div>
            <div class="progress-step" :class="{ active: step >= 3 }">
              <span class="step-num">3</span>
            </div>
          </div>

          <!-- Step Content -->
          <div class="onboarding-content">
            <!-- Step 1: Welcome -->
            <div v-if="step === 1" class="step-content">
              <div class="step-icon">✨</div>
              <h2>欢迎使用 RabAi Mind</h2>
              <p>AI 驱动的智能 PPT 生成平台，让演示文稿制作变得轻松简单。</p>
              <div class="feature-list">
                <div class="feature-item">
                  <span class="feature-icon">🎨</span>
                  <span>海量精美模板</span>
                </div>
                <div class="feature-item">
                  <span class="feature-icon">🤖</span>
                  <span>AI 智能生成</span>
                </div>
                <div class="feature-item">
                  <span class="feature-icon">✏️</span>
                  <span>灵活编辑调整</span>
                </div>
                <div class="feature-item">
                  <span class="feature-icon">📥</span>
                  <span>多种格式导出</span>
                </div>
              </div>
            </div>

            <!-- Step 2: Quick Start -->
            <div v-if="step === 2" class="step-content">
              <div class="step-icon">🚀</div>
              <h2>快速开始</h2>
              <p>只需三步，即可完成一份专业演示文稿：</p>
              <div class="quick-steps">
                <div class="quick-step">
                  <span class="step-badge">1</span>
                  <div class="step-info">
                    <h4>描述主题</h4>
                    <p>输入您的演示主题或大纲</p>
                  </div>
                </div>
                <div class="quick-step">
                  <span class="step-badge">2</span>
                  <div class="step-info">
                    <h4>选择模板</h4>
                    <p>从模板市场选择喜欢的风格</p>
                  </div>
                </div>
                <div class="quick-step">
                  <span class="step-badge">3</span>
                  <div class="step-info">
                    <h4>导出分享</h4>
                    <p>AI 自动生成后可编辑导出</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Step 3: Tips -->
            <div v-if="step === 3" class="step-content">
              <div class="step-icon">💡</div>
              <h2>使用技巧</h2>
              <div class="tips-grid">
                <div class="tip-card">
                  <span class="tip-icon">⌘</span>
                  <h4>快捷键</h4>
                  <p>按 <kbd>Ctrl</kbd> + <kbd>K</kbd> 快速搜索</p>
                </div>
                <div class="tip-card">
                  <span class="tip-icon">⭐</span>
                  <h4>收藏模板</h4>
                  <p>喜欢的模板可以收藏备用</p>
                </div>
                <div class="tip-card">
                  <span class="tip-icon">📜</span>
                  <h4>历史记录</h4>
                  <p>创作内容会自动保存</p>
                </div>
                <div class="tip-card">
                  <span class="tip-icon">🌙</span>
                  <h4>深色模式</h4>
                  <p>点击右上角切换主题</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="onboarding-actions">
            <button v-if="step > 1" class="btn-secondary" @click="prevStep">
              上一步
            </button>
            <button v-if="step < 3" class="btn-primary" @click="nextStep">
              下一步
            </button>
            <button v-if="step === 3" class="btn-primary" @click="finishOnboarding">
              开始使用
            </button>
            <button class="btn-skip" @click="closeOnboarding">
              跳过引导
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Onboarding Trigger Button (for re-triggering) -->
    <button
      v-if="!showOnboarding && canShowTrigger"
      class="onboarding-trigger"
      @click="showOnboarding = true"
      title="查看新手引导"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="10"/>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
        <path d="M12 17h.01"/>
      </svg>
    </button>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const step = ref(1)
const showOnboarding = ref(false)
const canShowTrigger = ref(false)

const ONBOARDING_KEY = 'onboarding_completed'
const MAX_SHOW_COUNT = 3

const shouldShowOnboarding = (): boolean => {
  try {
    const completed = localStorage.getItem(ONBOARDING_KEY)
    if (completed) {
      const data = JSON.parse(completed)
      // 每周最多显示一次
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
      if (data.lastShown < weekAgo && data.count < MAX_SHOW_COUNT) {
        return true
      }
      return false
    }
    return true
  } catch {
    return true
  }
}

const markOnboardingShown = () => {
  try {
    const existing = localStorage.getItem(ONBOARDING_KEY)
    let data = { count: 0, lastShown: 0 }
    if (existing) {
      data = JSON.parse(existing)
    }
    data.count++
    data.lastShown = Date.now()
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify(data))
  } catch {
    // 忽略错误
  }
}

const openOnboarding = () => {
  step.value = 1
  showOnboarding.value = true
}

const closeOnboarding = () => {
  showOnboarding.value = false
  markOnboardingShown()
}

const nextStep = () => {
  if (step.value < 3) {
    step.value++
  }
}

const prevStep = () => {
  if (step.value > 1) {
    step.value--
  }
}

const finishOnboarding = () => {
  closeOnboarding()
}

onMounted(() => {
  // 延迟显示，让页面先加载
  setTimeout(() => {
    if (shouldShowOnboarding()) {
      showOnboarding.value = true
    } else {
      canShowTrigger.value = true
    }
  }, 1500)
})

defineExpose({
  openOnboarding
})
</script>

<style scoped>
.onboarding-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 24px;
}

.onboarding-modal {
  background: white;
  border-radius: 24px;
  width: 100%;
  max-width: 520px;
  padding: 32px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

:global(.dark) .onboarding-modal {
  background: #1a1a1a;
}

/* Progress */
.onboarding-progress {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32px;
}

.progress-step {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.progress-step.active {
  background: #165DFF;
}

.progress-step.completed {
  background: #00C850;
}

.step-num {
  font-size: 14px;
  font-weight: 600;
  color: #666;
}

.progress-step.active .step-num,
.progress-step.completed .step-num {
  color: white;
}

.progress-line {
  width: 60px;
  height: 3px;
  background: #e0e0e0;
  margin: 0 8px;
  transition: background 0.3s;
}

.progress-line.active {
  background: #165DFF;
}

/* Content */
.onboarding-content {
  min-height: 280px;
}

.step-content {
  text-align: center;
}

.step-icon {
  font-size: 56px;
  margin-bottom: 16px;
}

.step-content h2 {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin-bottom: 12px;
}

:global(.dark) .step-content h2 {
  color: #fff;
}

.step-content > p {
  color: #666;
  font-size: 15px;
  line-height: 1.6;
  margin-bottom: 24px;
}

:global(.dark) .step-content > p {
  color: #aaa;
}

/* Feature List */
.feature-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 12px;
  font-size: 14px;
  color: #333;
}

:global(.dark) .feature-item {
  background: #2a2a2a;
}

.feature-icon {
  font-size: 20px;
}

/* Quick Steps */
.quick-steps {
  text-align: left;
}

.quick-step {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px;
  margin-bottom: 10px;
  background: #f8f9fa;
  border-radius: 12px;
}

:global(.dark) .quick-step {
  background: #2a2a2a;
}

.step-badge {
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
  flex-shrink: 0;
}

.step-info h4 {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

:global(.dark) .step-info h4 {
  color: #fff;
}

.step-info p {
  font-size: 13px;
  color: #666;
}

/* Tips Grid */
.tips-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.tip-card {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  text-align: center;
}

:global(.dark) .tip-card {
  background: #2a2a2a;
}

.tip-icon {
  font-size: 24px;
  display: block;
  margin-bottom: 8px;
}

.tip-card h4 {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
}

:global(.dark) .tip-card h4 {
  color: #fff;
}

.tip-card p {
  font-size: 12px;
  color: #666;
}

.tip-card kbd {
  padding: 2px 6px;
  background: #e0e0e0;
  border-radius: 4px;
  font-size: 11px;
}

:global(.dark) .tip-card kbd {
  background: #444;
}

/* Actions */
.onboarding-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 28px;
}

.btn-primary,
.btn-secondary,
.btn-skip {
  padding: 12px 28px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #165DFF;
  color: white;
  border: none;
}

.btn-primary:hover {
  background: #0d47e6;
}

.btn-secondary {
  background: transparent;
  color: #666;
  border: 1px solid #e0e0e0;
}

.btn-secondary:hover {
  background: #f5f5f5;
}

.btn-skip {
  background: transparent;
  color: #888;
  border: none;
  font-size: 14px;
}

.btn-skip:hover {
  color: #666;
}

/* Onboarding Trigger */
.onboarding-trigger {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 48px;
  height: 48px;
  border: none;
  background: #165DFF;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(22, 93, 255, 0.3);
  transition: all 0.2s;
  z-index: 999;
}

.onboarding-trigger:hover {
  transform: scale(1.1);
}

.onboarding-trigger svg {
  width: 24px;
  height: 24px;
  color: white;
}

/* Transitions */
.onboard-fade-enter-active,
.onboard-fade-leave-active {
  transition: opacity 0.3s;
}

.onboard-fade-enter-from,
.onboard-fade-leave-to {
  opacity: 0;
}
</style>
