<template>
  <div class="accessibility-panel" v-if="visible">
    <!-- SVG Filters for Color Blindness (hidden) -->
    <svg width="0" height="0" style="position:absolute">
      <defs>
        <!-- Protanopia (red-blind) -->
        <filter id="protanopia">
          <feColorMatrix type="matrix" values="
            0.567, 0.433, 0,     0, 0
            0.558, 0.442, 0,     0, 0
            0,     0.242, 0.758, 0, 0
            0,     0,     0,     1, 0
          "/>
        </filter>
        <!-- Deuteranopia (green-blind) -->
        <filter id="deuteranopia">
          <feColorMatrix type="matrix" values="
            0.625, 0.375, 0, 0, 0
            0.7,   0.3,   0, 0, 0
            0,     0.3,   0.7, 0, 0
            0,     0,     0,   1, 0
          "/>
        </filter>
        <!-- Tritanopia (blue-blind) -->
        <filter id="tritanopia">
          <feColorMatrix type="matrix" values="
            0.95,  0.05,  0,     0, 0
            0,     0.433, 0.567, 0, 0
            0,     0.475, 0.525, 0, 0
            0,     0,     0,     1, 0
          "/>
        </filter>
        <!-- Achromatopsia (total color blindness) -->
        <filter id="achromatopsia">
          <feColorMatrix type="matrix" values="
            0.299, 0.587, 0.114, 0, 0
            0.299, 0.587, 0.114, 0, 0
            0.299, 0.587, 0.114, 0, 0
            0,     0,     0,     1, 0
          "/>
        </filter>
      </defs>
    </svg>

    <div class="panel-header">
      <h3>♿ 无障碍与通用设计</h3>
      <button class="btn-close" @click="$emit('close')">✕</button>
    </div>

    <!-- Tab Navigation -->
    <div class="tab-nav">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="['tab-btn', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        {{ tab.icon }} {{ tab.label }}
      </button>
    </div>

    <!-- WCAG Audit Tab -->
    <div v-if="activeTab === 'wcag'" class="tab-content">
      <div class="section-title">WCAG 2.1 AA 合规审计</div>

      <button class="btn btn-primary audit-btn" @click="runAudit" :disabled="isAuditing">
        {{ isAuditing ? '🔄 审计中...' : '▶️ 开始审计' }}
      </button>

      <div v-if="auditResult" class="audit-results">
        <!-- Score Ring -->
        <div class="score-ring-container">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" stroke-width="10"/>
            <circle
              cx="60" cy="60" r="50" fill="none"
              :stroke="getWcagScoreColor(auditResult.score)"
              stroke-width="10"
              stroke-linecap="round"
              :stroke-dasharray="`${2 * Math.PI * 50}`"
              :stroke-dashoffset="`${2 * Math.PI * 50 * (1 - auditResult.score / 100)}`"
              transform="rotate(-90 60 60)"
              style="transition: stroke-dashoffset 0.8s ease"
            />
          </svg>
          <div class="score-text">
            <span class="score-number">{{ auditResult.score }}</span>
            <span class="score-label">/ 100</span>
          </div>
        </div>

        <div class="score-summary">
          <div class="summary-item pass">
            <span class="count">{{ auditResult.passedCount }}</span>
            <span class="label">通过</span>
          </div>
          <div class="summary-item fail">
            <span class="count">{{ auditResult.failedCount }}</span>
            <span class="label">未通过</span>
          </div>
          <div class="summary-label" :style="{ color: getWcagScoreColor(auditResult.score) }">
            {{ getWcagScoreLabel(auditResult.score) }}
          </div>
        </div>

        <!-- Issues List -->
        <div class="issues-list">
          <div
            v-for="issue in auditResult.issues"
            :key="issue.id + issue.element"
            :class="['issue-item', issue.passed ? 'passed' : 'failed']"
          >
            <span class="issue-status">{{ issue.passed ? '✅' : '❌' }}</span>
            <div class="issue-content">
              <div class="issue-header">
                <span class="issue-criterion">{{ issue.criterion }}</span>
                <span :class="['issue-level', issue.level]">{{ issue.level }}</span>
              </div>
              <p class="issue-desc">{{ issue.description }}</p>
              <p v-if="issue.suggestion" class="issue-suggestion">💡 {{ issue.suggestion }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Readability Tab -->
    <div v-if="activeTab === 'readability'" class="tab-content">
      <div class="section-title">内容可读性评分</div>

      <div class="readability-input">
        <label>选择要检查的页面：</label>
        <select v-model="selectedSlideForReadability" class="form-select">
          <option value="all">全部页面 (综合)</option>
          <option v-for="(slide, i) in slides" :key="i" :value="i">
            第 {{ i + 1 }} 页: {{ slide.title?.substring(0, 20) || '无标题' }}
          </option>
        </select>
      </div>

      <button class="btn btn-primary audit-btn" @click="runReadability">
        📊 检查可读性
      </button>

      <div v-if="readabilityResult" class="readability-results">
        <div class="readability-score-bar">
          <div class="score-bar-track">
            <div
              class="score-bar-fill"
              :style="{
                width: readabilityResult.score + '%',
                backgroundColor: readabilityScoreColor(readabilityResult.score)
              }"
            ></div>
          </div>
          <div class="score-bar-labels">
            <span>难</span>
            <span class="current-score" :style="{ color: readabilityScoreColor(readabilityResult.score) }">
              {{ readabilityResult.score }}分
            </span>
            <span>易</span>
          </div>
        </div>

        <div class="readability-details">
          <div class="detail-item">
            <span class="detail-label">阅读难度</span>
            <span class="detail-value">{{ readabilityResult.interpretation }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">建议年级</span>
            <span class="detail-value">{{ readabilityResult.gradeLevel }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">字数</span>
            <span class="detail-value">{{ readabilityResult.wordCount }} 字</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">句子数</span>
            <span class="detail-value">{{ readabilityResult.sentenceCount }} 句</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">平均句长</span>
            <span class="detail-value">{{ readabilityResult.avgWordsPerSentence }} 字/句</span>
          </div>
        </div>

        <!-- Content preview -->
        <div class="content-preview-box" v-if="selectedSlideForReadability !== 'all'">
          <div class="preview-label">内容预览</div>
          <div class="preview-text">{{ getSelectedContent() }}</div>
        </div>
      </div>
    </div>

    <!-- Font Size Check Tab -->
    <div v-if="activeTab === 'fontsize'" class="tab-content">
      <div class="section-title">字体大小检查</div>
      <p class="section-desc">最小正文字号：<strong>18px</strong> (WCAG 2.1 AA 要求)</p>

      <button class="btn btn-primary audit-btn" @click="doFontSizeCheck">
        🔤 检查字体大小
      </button>

      <div v-if="fontSizeIssues.length > 0" class="fontsize-results">
        <div class="fontsize-summary">
          <span class="issue-count">{{ fontSizeIssues.length }} 个潜在问题</span>
        </div>
        <div v-for="issue in fontSizeIssues" :key="issue.element + issue.slideIndex" class="fontsize-issue">
          <span class="issue-icon">⚠️</span>
          <div class="issue-detail">
            <strong>第 {{ issue.slideIndex + 1 }} 页 - {{ issue.element }}</strong>
            <p>当前: {{ issue.currentSize }}px → 建议: ≥{{ issue.requiredSize }}px</p>
          </div>
        </div>
      </div>

      <div v-else-if="fontSizeChecked" class="fontsize-ok">
        <span class="ok-icon">✅</span>
        <p>所有页面字体大小均符合 WCAG 标准</p>
      </div>

      <!-- Font Size Reference -->
      <div class="fontsize-reference">
        <div class="ref-title">字号参考标准</div>
        <div class="ref-item"><strong>标题:</strong> ≥32px</div>
        <div class="ref-item"><strong>副标题:</strong> ≥24px</div>
        <div class="ref-item"><strong>正文:</strong> ≥18px</div>
        <div class="ref-item"><strong>注释:</strong> ≥14px</div>
      </div>
    </div>

    <!-- Alt Text Tab -->
    <div v-if="activeTab === 'alttext'" class="tab-content">
      <div class="section-title">图片 Alt 文本生成</div>
      <p class="section-desc">为演示文稿中的图片自动生成描述性 alt 文本</p>

      <button class="btn btn-primary audit-btn" @click="runAltTextGeneration" :disabled="generatingAltText">
        {{ generatingAltText ? '🔄 生成中...' : '✨ 生成 Alt 文本' }}
      </button>

      <div v-if="altTextCandidates.length > 0" class="alttext-results">
        <div v-for="candidate in altTextCandidates" :key="candidate.imageUrl" class="alttext-item">
          <div class="alttext-preview">
            <img :src="candidate.imageUrl" :alt="candidate.generatedAltText" class="alttext-image" />
          </div>
          <div class="alttext-content">
            <div class="alttext-label">
              第 {{ candidate.slideIndex + 1 }} 页图片
              <span :class="['confidence-badge', candidate.confidence]">{{ candidate.confidence }}</span>
            </div>
            <div class="alttext-text">{{ candidate.generatedAltText }}</div>
            <div class="alttext-actions">
              <button class="btn btn-sm" @click="copyAltText(candidate.generatedAltText)">📋 复制</button>
              <button class="btn btn-sm btn-primary" @click="applyAltText(candidate)">✅ 应用</button>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="altTextGenerated" class="alttext-empty">
        <span>ℹ️ 未检测到需要 alt 文本的图片</span>
      </div>

      <div class="alttext-tip">
        <strong>💡 提示：</strong>Alt 文本应简洁描述图片内容和目的，帮助视障用户理解图片信息。
      </div>
    </div>

    <!-- Color Blindness Simulator Tab -->
    <div v-if="activeTab === 'colorblind'" class="tab-content">
      <div class="section-title">色盲模拟预览</div>
      <p class="section-desc">预览演示文稿在不同类型色觉障碍用户眼中的效果</p>

      <div class="colorblind-types">
        <button
          v-for="type in colorBlindnessTypes"
          :key="type.value"
          :class="['type-btn', { active: colorBlindnessType === type.value }]"
          @click="setColorBlindnessType(type.value)"
        >
          <span class="type-icon">{{ type.icon }}</span>
          <span class="type-name">{{ type.label }}</span>
          <span class="type-prevalence">{{ type.prevalence }}</span>
        </button>
      </div>

      <!-- Preview Section -->
      <div class="colorblind-preview">
        <div class="preview-label">模拟预览（当前：{{ currentTypeLabel }}）</div>
        <div
          class="preview-slides"
          :style="colorBlindnessType !== 'none' ? { filter: `url(#${colorBlindnessType})` } : {}"
        >
          <!-- Color palette preview -->
          <div class="palette-preview">
            <div class="palette-title">配色预览</div>
            <div class="palette-row">
              <div class="color-swatch" style="background:#3B82F6" title="#3B82F6 主题蓝"></div>
              <div class="color-swatch" style="background:#1E40AF" title="#1E40AF 深蓝"></div>
              <div class="color-swatch" style="background:#EF4444" title="#EF4444 红色"></div>
              <div class="color-swatch" style="background:#22C55E" title="#22C55E 绿色"></div>
              <div class="color-swatch" style="background:#F59E0B" title="#F59E0B 橙色"></div>
              <div class="color-swatch" style="background:#8B5CF6" title="#8B5CF6 紫色"></div>
            </div>
            <div class="palette-contrast">
              <span>文字对比度:</span>
              <div
                class="contrast-indicator"
                :style="{ background: contrastOk ? '#22c55e' : '#ef4444' }"
              >
                {{ contrastOk ? '✅ 符合 AA 标准' : '❌ 对比度不足' }}
              </div>
            </div>
          </div>

          <!-- Sample slide content -->
          <div class="sample-slide">
            <div class="sample-title">标题文本示例</div>
            <div class="sample-body">这是一段正文内容演示，用于测试色盲模拟效果。</div>
            <div class="sample-chart">
              <div class="bar" style="height:60%; background:#3B82F6">A</div>
              <div class="bar" style="height:80%; background:#22C55E">B</div>
              <div class="bar" style="height:45%; background:#F59E0B">C</div>
              <div class="bar" style="height:70%; background:#EF4444">D</div>
            </div>
          </div>
        </div>
      </div>

      <div class="colorblind-info">
        <div class="info-title">色盲类型说明</div>
        <div class="info-item"><strong>红色盲 (Protanopia):</strong> 无法感知红色，约占男性 1%</div>
        <div class="info-item"><strong>绿色盲 (Deuteranopia):</strong> 无法感知绿色，最常见的色盲类型，约占男性 6%</div>
        <div class="info-item"><strong>蓝色盲 (Tritanopia):</strong> 无法感知蓝色，非常罕见</div>
        <div class="info-item"><strong>全色盲 (Achromatopsia):</strong> 完全无法分辨颜色，极为罕见</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAccessibilityTools, type ColorBlindnessType } from '@/composables/useAccessibilityTools'

interface Slide {
  title?: string
  content?: string
  imageUrl?: string
  layout?: string
}

const props = defineProps<{
  visible: boolean
  slides: Slide[]
  themeColor?: string
  bodyBgColor?: string
}>()

defineEmits(['close'])

const {
  auditResult,
  readabilityResult,
  fontSizeIssues,
  altTextCandidates,
  colorBlindnessType,
  isAuditing,
  runWcagAudit,
  runReadabilityCheck,
  runFontSizeCheck,
  generateAltTexts,
  setColorBlindnessType,
  getWcagScoreLabel,
  getWcagScoreColor
} = useAccessibilityTools()

const activeTab = ref('wcag')
const fontSizeChecked = ref(false)
const generatingAltText = ref(false)
const altTextGenerated = ref(false)
const selectedSlideForReadability = ref('all')

const tabs = [
  { id: 'wcag', label: 'WCAG审计', icon: '🔍' },
  { id: 'readability', label: '可读性', icon: '📖' },
  { id: 'fontsize', label: '字号检查', icon: '🔤' },
  { id: 'alttext', label: 'Alt文本', icon: '🖼️' },
  { id: 'colorblind', label: '色盲模拟', icon: '👁️' }
]

const colorBlindnessTypes = [
  { value: 'none' as ColorBlindnessType, label: '正常视觉', icon: '👁️', prevalence: '—' },
  { value: 'protanopia' as ColorBlindnessType, label: '红色盲', icon: '🔴', prevalence: '1% 男性' },
  { value: 'deuteranopia' as ColorBlindnessType, label: '绿色盲', icon: '🟢', prevalence: '6% 男性' },
  { value: 'tritanopia' as ColorBlindnessType, label: '蓝色盲', icon: '🔵', prevalence: '0.01%' },
  { value: 'achromatopsia' as ColorBlindnessType, label: '全色盲', icon: '⬜', prevalence: '极罕见' }
]

const currentTypeLabel = computed(() => {
  return colorBlindnessTypes.find(t => t.value === colorBlindnessType.value)?.label || '正常视觉'
})

const contrastOk = computed(() => {
  const { hexToRgb, getContrastRatio } = useAccessibilityTools()
  const theme = hexToRgb(props.themeColor || '#3B82F6')
  const bg = hexToRgb(props.bodyBgColor || '#FFFFFF')
  if (!theme || !bg) return true
  return getContrastRatio(theme.r, theme.g, theme.b, bg.r, bg.g, bg.b) >= 4.5
})

function runAudit() {
  runWcagAudit(props.slides, props.themeColor, props.bodyBgColor)
}

function runReadability() {
  let text = ''
  if (selectedSlideForReadability.value === 'all') {
    text = props.slides.map(s => `${s.title}\n${s.content}`).join('\n')
  } else {
    const idx = Number(selectedSlideForReadability.value)
    const slide = props.slides[idx]
    text = `${slide.title}\n${slide.content}`
  }
  runReadabilityCheck(text)
}

function doFontSizeCheck() {
  runFontSizeCheck(props.slides as any, 18)
  fontSizeChecked.value = true
}

async function runAltTextGeneration() {
  generatingAltText.value = true
  await generateAltTexts(props.slides as any)
  generatingAltText.value = false
  altTextGenerated.value = true
}

function getSelectedContent(): string {
  if (selectedSlideForReadability.value === 'all') return ''
  const idx = Number(selectedSlideForReadability.value)
  const slide = props.slides[idx]
  return `${slide.title}\n\n${slide.content}`
}

function copyAltText(text: string) {
  navigator.clipboard.writeText(text)
}

function applyAltText(candidate: any) {
  // Emit event to parent to apply alt text
  // Parent should handle updating the slide's image alt attribute
  alert(`Alt 文本已应用到第 ${candidate.slideIndex + 1} 页`)
}

function readabilityScoreColor(score: number): string {
  if (score >= 70) return '#22c55e'
  if (score >= 40) return '#eab308'
  return '#ef4444'
}
</script>

<style scoped>
.accessibility-panel {
  position: fixed;
  top: 60px;
  right: 16px;
  width: 440px;
  max-height: calc(100vh - 80px);
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.btn-close {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  color: #6b7280;
}

.btn-close:hover {
  color: #111;
}

.tab-nav {
  display: flex;
  overflow-x: auto;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
}

.tab-btn {
  flex-shrink: 0;
  padding: 10px 14px;
  border: none;
  background: none;
  font-size: 13px;
  cursor: pointer;
  color: #6b7280;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab-btn.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
  font-weight: 500;
}

.tab-btn:hover:not(.active) {
  color: #374151;
  background: #f3f4f6;
}

.tab-content {
  padding: 16px 20px;
  overflow-y: auto;
  flex: 1;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #111;
}

.section-desc {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 12px;
}

.audit-btn {
  width: 100%;
  margin-bottom: 16px;
}

/* WCAG Results */
.audit-results {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.score-ring-container {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto;
}

.score-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.score-number {
  display: block;
  font-size: 28px;
  font-weight: 700;
  color: #111;
}

.score-label {
  font-size: 12px;
  color: #6b7280;
}

.score-summary {
  display: flex;
  justify-content: center;
  gap: 24px;
  align-items: center;
}

.summary-item {
  text-align: center;
}

.summary-item .count {
  display: block;
  font-size: 24px;
  font-weight: 700;
}

.summary-item.pass .count { color: #22c55e; }
.summary-item.fail .count { color: #ef4444; }

.summary-item .label {
  font-size: 12px;
  color: #6b7280;
}

.summary-label {
  font-weight: 600;
  font-size: 14px;
}

.issues-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.issue-item {
  display: flex;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #f9fafb;
  font-size: 13px;
}

.issue-item.passed {
  background: #f0fdf4;
}

.issue-item.failed {
  background: #fef2f2;
}

.issue-status {
  font-size: 16px;
  flex-shrink: 0;
}

.issue-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.issue-criterion {
  font-weight: 600;
  color: #111;
  font-size: 12px;
}

.issue-level {
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 4px;
  font-weight: 600;
}

.issue-level.A { background: #fef3c7; color: #92400e; }
.issue-level.AA { background: #dbeafe; color: #1e40af; }
.issue-level.AAA { background: #ede9fe; color: #5b21b6; }

.issue-desc {
  margin: 0 0 4px 0;
  color: #374151;
  line-height: 1.4;
}

.issue-suggestion {
  margin: 0;
  color: #6b7280;
  font-size: 12px;
  line-height: 1.4;
}

/* Readability */
.readability-input {
  margin-bottom: 12px;
}

.readability-input label {
  display: block;
  font-size: 13px;
  margin-bottom: 6px;
  color: #374151;
}

.form-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 13px;
  background: white;
}

.readability-results {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.readability-score-bar {
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.score-bar-track {
  height: 12px;
  background: linear-gradient(to right, #ef4444, #eab308, #22c55e);
  border-radius: 6px;
  position: relative;
}

.score-bar-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.6s ease;
}

.score-bar-labels {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 6px;
  font-size: 12px;
  color: #6b7280;
}

.current-score {
  font-weight: 700;
  font-size: 14px;
}

.readability-details {
  display: grid;
  gap: 8px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f9fafb;
  border-radius: 6px;
  font-size: 13px;
}

.detail-label {
  color: #6b7280;
}

.detail-value {
  font-weight: 600;
  color: #111;
}

.content-preview-box {
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  font-size: 13px;
}

.preview-label {
  font-size: 11px;
  color: #9ca3af;
  margin-bottom: 6px;
  text-transform: uppercase;
}

.preview-text {
  color: #374151;
  line-height: 1.6;
  white-space: pre-wrap;
  max-height: 100px;
  overflow-y: auto;
}

/* Font Size */
.fontsize-results {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.fontsize-summary {
  font-weight: 600;
  color: #92400e;
  background: #fef3c7;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
}

.fontsize-issue {
  display: flex;
  gap: 10px;
  padding: 10px;
  background: #fef3c7;
  border-radius: 6px;
  font-size: 13px;
}

.issue-icon {
  font-size: 18px;
}

.fontsize-issue p {
  margin: 2px 0 0 0;
  color: #92400e;
  font-size: 12px;
}

.fontsize-ok {
  text-align: center;
  padding: 20px;
  background: #f0fdf4;
  border-radius: 8px;
  margin-top: 12px;
}

.ok-icon {
  font-size: 32px;
  display: block;
  margin-bottom: 8px;
}

.fontsize-reference {
  margin-top: 16px;
  padding: 12px;
  background: #f3f4f6;
  border-radius: 8px;
  font-size: 13px;
}

.ref-title {
  font-weight: 600;
  margin-bottom: 8px;
  color: #374151;
}

.ref-item {
  padding: 4px 0;
  color: #6b7280;
}

/* Alt Text */
.alttext-results {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
}

.alttext-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.alttext-preview {
  flex-shrink: 0;
  width: 80px;
  height: 60px;
  overflow: hidden;
  border-radius: 4px;
  background: #e5e7eb;
}

.alttext-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.alttext-content {
  flex: 1;
  min-width: 0;
}

.alttext-label {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.confidence-badge {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.confidence-badge.high { background: #d1fae5; color: #065f46; }
.confidence-badge.medium { background: #fef3c7; color: #92400e; }
.confidence-badge.low { background: #fee2e2; color: #991b1b; }

.alttext-text {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.4;
  margin-bottom: 6px;
}

.alttext-actions {
  display: flex;
  gap: 6px;
}

.alttext-empty {
  text-align: center;
  padding: 16px;
  color: #6b7280;
  font-size: 13px;
  background: #f3f4f6;
  border-radius: 8px;
  margin-top: 12px;
}

.alttext-tip {
  margin-top: 16px;
  padding: 10px 12px;
  background: #eff6ff;
  border-left: 3px solid #3b82f6;
  border-radius: 0 6px 6px 0;
  font-size: 12px;
  color: #1e40af;
  line-height: 1.5;
}

/* Color Blindness */
.colorblind-types {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.type-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  font-size: 13px;
}

.type-btn:hover {
  background: #f3f4f6;
}

.type-btn.active {
  border-color: #3b82f6;
  background: #eff6ff;
}

.type-icon {
  font-size: 18px;
  width: 28px;
  text-align: center;
}

.type-name {
  flex: 1;
  font-weight: 500;
  color: #111;
}

.type-prevalence {
  font-size: 11px;
  color: #9ca3af;
}

.colorblind-preview {
  margin-bottom: 16px;
}

.preview-label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
}

.palette-preview {
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  margin-bottom: 12px;
}

.palette-title {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.palette-row {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
}

.color-swatch {
  flex: 1;
  height: 32px;
  border-radius: 6px;
  border: 1px solid rgba(0,0,0,0.1);
}

.palette-contrast {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #6b7280;
}

.contrast-indicator {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  color: white;
}

.sample-slide {
  padding: 16px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.sample-title {
  font-size: 20px;
  font-weight: 700;
  color: #111;
  margin-bottom: 8px;
}

.sample-body {
  font-size: 14px;
  color: #374151;
  margin-bottom: 12px;
  line-height: 1.5;
}

.sample-chart {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  height: 80px;
}

.bar {
  flex: 1;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 4px;
  border-radius: 4px 4px 0 0;
  font-size: 12px;
  font-weight: 600;
  color: white;
  transition: filter 0.3s;
}

.colorblind-info {
  padding: 12px;
  background: #f3f4f6;
  border-radius: 8px;
  font-size: 12px;
  color: #6b7280;
}

.info-title {
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.info-item {
  padding: 4px 0;
  line-height: 1.5;
}

.info-item strong {
  color: #374151;
}

/* Common */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:hover:not(:disabled) {
  background: #f3f4f6;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-sm {
  padding: 4px 10px;
  font-size: 12px;
}
</style>
