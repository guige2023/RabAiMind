<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="isOpen" class="help-overlay" @click="close">
        <div class="help-modal" @click.stop>
          <!-- Header -->
          <div class="help-header">
            <h2>帮助中心</h2>
            <div class="header-tabs">
              <button
                v-for="tab in tabs"
                :key="tab.id"
                class="tab-btn"
                :class="{ active: activeTab === tab.id }"
                @click="activeTab = tab.id"
              >
                {{ tab.name }}
              </button>
            </div>
            <button class="close-btn" @click="close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Content -->
          <div class="help-content">
            <!-- Quick Start -->
            <div v-if="activeTab === 'quickstart'" class="help-section">
              <h3>快速开始</h3>
              <div class="guide-steps">
                <div class="step">
                  <span class="step-num">1</span>
                  <div class="step-content">
                    <h4>输入主题</h4>
                    <p>在创建页面描述您的PPT主题和需求</p>
                  </div>
                </div>
                <div class="step">
                  <span class="step-num">2</span>
                  <div class="step-content">
                    <h4>选择模板</h4>
                    <p>从模板市场选择喜欢的风格和布局</p>
                  </div>
                </div>
                <div class="step">
                  <span class="step-num">3</span>
                  <div class="step-content">
                    <h4>AI生成</h4>
                    <p>AI自动生成PPT内容，可编辑调整</p>
                  </div>
                </div>
                <div class="step">
                  <span class="step-num">4</span>
                  <div class="step-content">
                    <h4>导出分享</h4>
                    <p>导出为多种格式或分享给他人</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Shortcuts -->
            <div v-if="activeTab === 'shortcuts'" class="help-section">
              <h3>快捷键</h3>
              <div class="shortcut-categories">
                <div class="shortcut-category" v-for="(actions, category) in shortcutsByCategory" :key="category">
                  <h4>{{ getCategoryName(category) }}</h4>
                  <div class="shortcut-list">
                    <div v-for="action in actions" :key="action.id" class="shortcut-item">
                      <span class="shortcut-name">{{ action.name }}</span>
                      <kbd>{{ action.shortcut }}</kbd>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- FAQ -->
            <div v-if="activeTab === 'faq'" class="help-section">
              <h3>常见问题</h3>
              <div class="faq-list">
                <div v-for="faq in faqs" :key="faq.id" class="faq-item">
                  <button class="faq-question" @click="toggleFaq(faq.id)">
                    <span>{{ faq.question }}</span>
                    <svg :class="{ rotated: expandedFaq === faq.id }" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </button>
                  <div v-if="expandedFaq === faq.id" class="faq-answer">
                    {{ faq.answer }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Tips -->
            <div v-if="activeTab === 'tips'" class="help-section">
              <h3>使用技巧</h3>
              <div class="tips-grid">
                <div class="tip-card">
                  <span class="tip-icon">✨</span>
                  <h4>AI提示词技巧</h4>
                  <p>描述越详细，生成效果越好。包含：主题、目标受众、风格偏好、页数要求</p>
                </div>
                <div class="tip-card">
                  <span class="tip-icon">📋</span>
                  <h4>模板使用</h4>
                  <p>收藏常用模板，下次创建可直接使用，节省时间</p>
                </div>
                <div class="tip-card">
                  <span class="tip-icon">📝</span>
                  <h4>内容编辑</h4>
                  <p>生成后可编辑文字、调整布局、更换图片</p>
                </div>
                <div class="tip-card">
                  <span class="tip-icon">📤</span>
                  <h4>多格式导出</h4>
                  <p>支持PPTX、PDF、图片等多种格式，满足不同场景需求</p>
                </div>
                <div class="tip-card">
                  <span class="tip-icon">🔍</span>
                  <h4>全局搜索</h4>
                  <p>按Ctrl+K快速搜索模板、历史记录和页面</p>
                </div>
                <div class="tip-card">
                  <span class="tip-icon">💾</span>
                  <h4>自动保存</h4>
                  <p>系统自动保存创作内容，不用担心数据丢失</p>
                </div>
              </div>
            </div>

            <!-- Contact -->
            <div v-if="activeTab === 'contact'" class="help-section">
              <h3>联系我们</h3>
              <div class="contact-info">
                <div class="contact-item">
                  <span class="contact-icon">📧</span>
                  <span>support@rabai.com</span>
                </div>
                <div class="contact-item">
                  <span class="contact-icon">💬</span>
                  <span>在线客服</span>
                </div>
                <div class="contact-item">
                  <span class="contact-icon">📱</span>
                  <span>微信公众号: RabAiMind</span>
                </div>
              </div>
              <p class="contact-note">工作时间: 周一至周五 9:00-18:00</p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { defaultEditActions, type EditAction } from '../composables/useEditingExperienceOptimizer'

const isOpen = ref(false)
const activeTab = ref('quickstart')
const expandedFaq = ref<string | null>(null)

const tabs = [
  { id: 'quickstart', name: '快速开始' },
  { id: 'shortcuts', name: '快捷键' },
  { id: 'faq', name: '常见问题' },
  { id: 'tips', name: '使用技巧' },
  { id: 'contact', name: '联系我们' }
]

const shortcutsByCategory = computed(() => {
  const categories: Record<string, EditAction[]> = {
    edit: [],
    format: [],
    view: [],
    slide: []
  }
  defaultEditActions.forEach(action => {
    if (categories[action.category]) {
      categories[action.category].push(action)
    }
  })
  return categories
})

const getCategoryName = (category: string): string => {
  const names: Record<string, string> = {
    edit: '编辑',
    format: '格式',
    view: '视图',
    slide: '幻灯片'
  }
  return names[category] || category
}

const faqs = [
  {
    id: '1',
    question: '如何创建PPT?',
    answer: '在首页点击"创建PPT"按钮，输入您的主题描述，选择模板后点击生成即可。'
  },
  {
    id: '2',
    question: '支持哪些导出格式?',
    answer: '支持PPTX、PDF、PNG、JPG、HTML、Markdown、Word、JSON等多种格式。'
  },
  {
    id: '3',
    question: '生成的PPT可以编辑吗?',
    answer: '可以。生成后点击"编辑内容"按钮即可对文字、布局等进行修改。'
  },
  {
    id: '4',
    question: '如何获得更好的生成效果?',
    answer: '建议输入详细的主题描述，包括目标受众、风格偏好、具体内容要求等。'
  },
  {
    id: '5',
    question: '数据会自动保存吗?',
    answer: '是的，系统每30秒自动保存一次，您也可以手动保存。'
  },
  {
    id: '6',
    question: '如何联系客服?',
    answer: '可以通过页面右下角的反馈按钮联系客服，或发送邮件至 support@rabai.com'
  }
]

const toggleFaq = (id: string) => {
  expandedFaq.value = expandedFaq.value === id ? null : id
}

const open = () => { isOpen.value = true }
const close = () => { isOpen.value = false }

defineExpose({ open, close })
</script>

<style scoped>
.help-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 24px;
}

.help-modal {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 720px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

:global(.dark) .help-modal {
  background: #1a1a1a;
}

/* Header */
.help-header {
  padding: 24px;
  border-bottom: 1px solid #e0e0e0;
  position: relative;
}

:global(.dark) .help-header {
  border-color: #333;
}

.help-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

:global(.dark) .help-header h2 {
  color: #fff;
}

.header-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tab-btn {
  padding: 8px 16px;
  border: none;
  background: #f5f5f5;
  border-radius: 20px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

:global(.dark) .tab-btn {
  background: #2a2a2a;
  color: #fff;
}

.tab-btn.active {
  background: #165DFF;
  color: white;
}

.close-btn {
  position: absolute;
  top: 24px;
  right: 24px;
  width: 32px;
  height: 32px;
  border: none;
  background: #f5f5f5;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

:global(.dark) .close-btn {
  background: #2a2a2a;
}

.close-btn svg {
  width: 16px;
  height: 16px;
  color: #666;
}

/* Content */
.help-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.help-section h3 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
}

:global(.dark) .help-section h3 {
  color: #fff;
}

/* Quick Start */
.guide-steps {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.step {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.step-num {
  width: 36px;
  height: 36px;
  background: #165DFF;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
}

.step-content h4 {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

:global(.dark) .step-content h4 {
  color: #fff;
}

.step-content p {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
}

/* Shortcuts */
.shortcut-categories {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.shortcut-category h4 {
  font-size: 14px;
  font-weight: 600;
  color: #666;
  margin-bottom: 12px;
}

.shortcut-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
}

.shortcut-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

:global(.dark) .shortcut-item {
  background: #2a2a2a;
}

.shortcut-name {
  font-size: 13px;
  color: #333;
}

:global(.dark) .shortcut-name {
  color: #fff;
}

kbd {
  padding: 4px 8px;
  background: #e0e0e0;
  border-radius: 4px;
  font-size: 12px;
  font-family: monospace;
}

:global(.dark) kbd {
  background: #444;
}

/* FAQ */
.faq-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.faq-question {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: #f8f9fa;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  text-align: left;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

:global(.dark) .faq-question {
  background: #2a2a2a;
  color: #fff;
}

.faq-question svg {
  width: 18px;
  height: 18px;
  color: #666;
  transition: transform 0.2s;
}

.faq-question svg.rotated {
  transform: rotate(180deg);
}

.faq-answer {
  padding: 12px 16px;
  font-size: 13px;
  color: #666;
  line-height: 1.6;
  background: #fafafa;
  border-radius: 0 0 10px 10px;
}

:global(.dark) .faq-answer {
  background: #252525;
  color: #aaa;
}

/* Tips */
.tips-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.tip-card {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
}

:global(.dark) .tip-card {
  background: #2a2a2a;
}

.tip-icon {
  font-size: 28px;
  display: block;
  margin-bottom: 12px;
}

.tip-card h4 {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

:global(.dark) .tip-card h4 {
  color: #fff;
}

.tip-card p {
  font-size: 12px;
  color: #666;
  line-height: 1.5;
}

/* Contact */
.contact-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 10px;
  font-size: 14px;
  color: #333;
}

:global(.dark) .contact-item {
  background: #2a2a2a;
  color: #fff;
}

.contact-icon {
  font-size: 18px;
}

.contact-note {
  font-size: 12px;
  color: #888;
  text-align: center;
}

/* Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
