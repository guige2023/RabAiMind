<template>
  <div v-if="visible" class="coach-overlay" @click.self="$emit('close')">
    <div class="coach-panel">
      <!-- Header -->
      <div class="coach-header">
        <div class="coach-title">
          <span class="coach-icon">🎯</span>
          <h3>AI 演讲教练</h3>
          <span class="coach-badge" v-if="overallScore">评分: {{ overallScore }}/10</span>
        </div>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <!-- Tab Navigation -->
      <div class="coach-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="['tab-btn', { active: activeTab === tab.id }]"
          @click="switchTab(tab.id)"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          <span class="tab-label">{{ tab.label }}</span>
        </button>
      </div>

      <!-- Tab Content -->
      <div class="coach-content">
        <!-- Loading State -->
        <div v-if="isLoading" class="coach-loading">
          <div class="loading-spinner"></div>
          <p>{{ loadingMessage }}</p>
        </div>

        <!-- Coach Tab: Analyze -->
        <div v-else-if="activeTab === 'analyze'" class="tab-panel">
          <div v-if="!analysisResult" class="coach-start">
            <p class="coach-desc">AI 将分析你的幻灯片，从结构、内容、设计、参与度等维度给出评分和建议</p>
            <button class="btn btn-primary btn-lg" @click="runAnalysis" :disabled="isLoading">
              🔍 开始分析
            </button>
          </div>
          <div v-else class="analysis-result">
            <!-- Overall Scores -->
            <div class="score-cards">
              <div class="score-card">
                <div class="score-circle" :style="{ '--score': analysisResult.overall_score * 10 }">
                  <span class="score-num">{{ analysisResult.overall_score }}</span>
                </div>
                <span class="score-label">综合评分</span>
              </div>
              <div class="score-card small">
                <span class="score-small-num">{{ analysisResult.structure_score || 0 }}</span>
                <span class="score-label">结构</span>
              </div>
              <div class="score-card small">
                <span class="score-small-num">{{ analysisResult.content_score || 0 }}</span>
                <span class="score-label">内容</span>
              </div>
              <div class="score-card small">
                <span class="score-small-num">{{ analysisResult.design_score || 0 }}</span>
                <span class="score-label">设计</span>
              </div>
              <div class="score-card small">
                <span class="score-small-num">{{ analysisResult.engagement_score || 0 }}</span>
                <span class="score-label">参与度</span>
              </div>
            </div>

            <!-- Overall Feedback -->
            <div v-if="analysisResult.overall_feedback" class="feedback-block">
              <h4>📋 整体反馈</h4>
              <p>{{ analysisResult.overall_feedback }}</p>
            </div>

            <!-- Top Improvements -->
            <div v-if="analysisResult.top_3_improvements?.length" class="improvements-block">
              <h4>🚀 重点改进建议</h4>
              <ul>
                <li v-for="(item, idx) in analysisResult.top_3_improvements" :key="idx">
                  {{ item }}
                </li>
              </ul>
            </div>

            <!-- Per-slide Feedback -->
            <div v-if="analysisResult.slide_feedback?.length" class="slide-feedback-list">
              <h4>📑 每页详细反馈</h4>
              <div
                v-for="fb in analysisResult.slide_feedback"
                :key="fb.slide_num"
                class="slide-feedback-item"
              >
                <div class="sf-header">
                  <span class="sf-slide-num">第 {{ fb.slide_num }} 页</span>
                  <button class="btn btn-sm" @click="viewSlide(fb.slide_num)">查看</button>
                </div>
                <div class="sf-body">
                  <div v-if="fb.strengths?.length" class="sf-section strengths">
                    <span class="sf-tag positive">✅ 优点</span>
                    <ul>
                      <li v-for="s in fb.strengths" :key="s">{{ s }}</li>
                    </ul>
                  </div>
                  <div v-if="fb.weaknesses?.length" class="sf-section weaknesses">
                    <span class="sf-tag negative">⚠️ 缺点</span>
                    <ul>
                      <li v-for="w in fb.weaknesses" :key="w">{{ w }}</li>
                    </ul>
                  </div>
                  <div v-if="fb.suggestions?.length" class="sf-section suggestions">
                    <span class="sf-tag suggestion">💡 建议</span>
                    <ul>
                      <li v-for="s in fb.suggestions" :key="s">{{ s }}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <button class="btn btn-outline" @click="runAnalysis" :disabled="isLoading">
              🔄 重新分析
            </button>
          </div>
        </div>

        <!-- Practice Tab -->
        <div v-else-if="activeTab === 'practice'" class="tab-panel">
          <div v-if="!practiceResult" class="coach-start">
            <p class="coach-desc">AI 将根据你的演讲内容生成模拟观众问答，帮你练习演讲和准备回答</p>
            <div class="practice-options">
              <div class="option-row">
                <label>练习难度：</label>
                <div class="difficulty-btns">
                  <button
                    v-for="d in ['easy', 'moderate', 'hard', 'mixed']"
                    :key="d"
                    :class="['diff-btn', { active: selectedDifficulty === d }]"
                    @click="selectedDifficulty = d"
                  >
                    {{ difficultyLabels[d] }}
                  </button>
                </div>
              </div>
              <div class="option-row">
                <label>问题数量：</label>
                <select v-model="questionCount" class="form-select">
                  <option :value="5">5 题（5分钟）</option>
                  <option :value="8">8 题（10分钟）</option>
                  <option :value="10">10 题（15分钟）</option>
                  <option :value="15">15 题（20分钟）</option>
                </select>
              </div>
            </div>
            <button class="btn btn-primary btn-lg" @click="runPractice" :disabled="isLoading">
              🎤 开始练习
            </button>
          </div>
          <div v-else class="practice-result">
            <div class="practice-header">
              <h4>🎤 练习问答</h4>
              <span class="practice-meta">
                {{ practiceResult.total_questions || practiceResult.qa_list?.length || 0 }} 题
                · 约 {{ practiceResult.estimated_minutes || 10 }} 分钟
              </span>
            </div>

            <!-- Q&A List -->
            <div class="qa-list">
              <div
                v-for="(qa, idx) in practiceResult.qa_list"
                :key="idx"
                class="qa-item"
                :class="{ revealed: revealedQuestions.has(idx) }"
              >
                <div class="qa-question" @click="toggleQuestion(idx)">
                  <span class="qa-num">{{ idx + 1 }}.</span>
                  <span class="qa-text">{{ qa.question }}</span>
                  <span class="qa-meta">
                    <span :class="['cat-tag', qa.category]">{{ categoryLabels[qa.category] || qa.category }}</span>
                    <span :class="['diff-tag', qa.difficulty]">{{ difficultyLabels[qa.difficulty] || qa.difficulty }}</span>
                    <span class="qa-ref" v-if="qa.slide_ref">📍 第{{ qa.slide_ref }}页</span>
                  </span>
                </div>
                <div v-if="revealedQuestions.has(idx)" class="qa-answer">
                  <div v-if="qa.suggested_answer" class="answer-main">
                    <strong>建议回答：</strong>{{ qa.suggested_answer }}
                  </div>
                  <div v-if="qa.tips" class="answer-tips">
                    <strong>💡 技巧：</strong>{{ qa.tips }}
                  </div>
                </div>
                <div v-else class="qa-hint" @click="toggleQuestion(idx)">
                  点击查看回答提示
                </div>
              </div>
            </div>

            <div class="practice-actions">
              <button class="btn btn-outline" @click="resetPractice">🔄 重新生成</button>
              <button class="btn btn-primary" @click="startPracticeMode">
                🎯 模拟练习模式
              </button>
            </div>
          </div>
        </div>

        <!-- Timing Tab -->
        <div v-else-if="activeTab === 'timing'" class="tab-panel">
          <div v-if="!timingResult" class="coach-start">
            <p class="coach-desc">根据你的内容长度和总演讲时间，AI 将给出每页的推荐时间分配和节奏建议</p>
            <div class="timing-options">
              <div class="option-row">
                <label>总演讲时间：</label>
                <select v-model.number="totalMinutes" class="form-select">
                  <option :value="5">5 分钟</option>
                  <option :value="10">10 分钟</option>
                  <option :value="15">15 分钟</option>
                  <option :value="20">20 分钟</option>
                  <option :value="30">30 分钟</option>
                  <option :value="45">45 分钟</option>
                  <option :value="60">60 分钟</option>
                </select>
              </div>
            </div>
            <button class="btn btn-primary btn-lg" @click="runTiming" :disabled="isLoading">
              ⏱️ 计算节奏
            </button>
          </div>
          <div v-else class="timing-result">
            <div class="timing-summary">
              <div class="timing-stat">
                <span class="stat-num">{{ timingResult.total_slides }}</span>
                <span class="stat-label">总页数</span>
              </div>
              <div class="timing-stat">
                <span class="stat-num">{{ timingResult.total_minutes }}</span>
                <span class="stat-label">总时间(分钟)</span>
              </div>
              <div class="timing-stat">
                <span class="stat-num">{{ Math.round(timingResult.total_minutes * 60 / timingResult.total_slides) || 0 }}</span>
                <span class="stat-label">平均秒/页</span>
              </div>
            </div>

            <div class="pace-feedback" v-if="timingResult.pace_feedback">
              <span class="pace-icon">{{ getPaceIcon(timingResult.pace_feedback) }}</span>
              {{ timingResult.pace_feedback }}
            </div>

            <!-- Breakdown -->
            <div class="timing-breakdown" v-if="timingResult.breakdown">
              <h4>⏱️ 时间分配</h4>
              <div class="breakdown-bars">
                <div class="breakdown-item">
                  <span class="breakdown-label">开场介绍</span>
                  <div class="breakdown-bar">
                    <div
                      class="breakdown-fill intro"
                      :style="{ width: (timingResult.breakdown.introduction / timingResult.total_minutes * 100) + '%' }"
                    ></div>
                  </div>
                  <span class="breakdown-time">{{ timingResult.breakdown.introduction.toFixed(1) }}分钟</span>
                </div>
                <div class="breakdown-item">
                  <span class="breakdown-label">内容讲解</span>
                  <div class="breakdown-bar">
                    <div
                      class="breakdown-fill content"
                      :style="{ width: (timingResult.breakdown.content / timingResult.total_minutes * 100) + '%' }"
                    ></div>
                  </div>
                  <span class="breakdown-time">{{ timingResult.breakdown.content.toFixed(1) }}分钟</span>
                </div>
                <div class="breakdown-item">
                  <span class="breakdown-label">结尾总结</span>
                  <div class="breakdown-bar">
                    <div
                      class="breakdown-fill conclusion"
                      :style="{ width: (timingResult.breakdown.conclusion / timingResult.total_minutes * 100) + '%' }"
                    ></div>
                  </div>
                  <span class="breakdown-time">{{ timingResult.breakdown.conclusion.toFixed(1) }}分钟</span>
                </div>
              </div>
            </div>

            <!-- Per-slide timing -->
            <div class="per-slide-timing">
              <h4>📄 每页建议时间</h4>
              <div class="timing-list">
                <div
                  v-for="slide in timingResult.per_slide_seconds"
                  :key="slide.slide_num"
                  class="timing-item"
                  @click="viewSlide(slide.slide_num)"
                >
                  <span class="timing-slide-num">第{{ slide.slide_num }}页</span>
                  <span class="timing-slide-title">{{ slide.title || '(无标题)' }}</span>
                  <div class="timing-bar-container">
                    <div
                      class="timing-bar-fill"
                      :style="{
                        width: Math.min(100, (slide.suggested_seconds / 180) * 100) + '%',
                        background: getTimingColor(slide.suggested_seconds)
                      }"
                    ></div>
                  </div>
                  <span class="timing-seconds">{{ slide.suggested_seconds }}秒</span>
                </div>
              </div>
            </div>

            <!-- Pause Points -->
            <div class="pause-points" v-if="timingResult.pause_points?.length">
              <h4>⏸️ 推荐暂停点</h4>
              <p class="pause-desc">在这些页面之间适合停顿，让观众消化内容</p>
              <div class="pause-tags">
                <span
                  v-for="point in timingResult.pause_points"
                  :key="point"
                  class="pause-tag"
                >
                  第 {{ point }} 页后
                </span>
              </div>
            </div>

            <!-- Tips -->
            <div class="timing-tips" v-if="timingResult.tips?.length">
              <h4>💡 节奏建议</h4>
              <ul>
                <li v-for="(tip, idx) in timingResult.tips" :key="idx">{{ tip }}</li>
              </ul>
            </div>

            <div class="timing-apply-row">
              <button class="btn btn-primary" @click="emit('applyTiming', timingResult)">
                ⏱ 应用此节奏自动播放
              </button>
              <button class="btn btn-outline" @click="runTiming" :disabled="isLoading">
                🔄 重新计算
              </button>
            </div>
          </div>
        </div>

        <!-- Delivery Tips Tab -->
        <div v-else-if="activeTab === 'delivery'" class="tab-panel">
          <div v-if="!deliveryResult" class="coach-start">
            <p class="coach-desc">AI 将分析每页内容，给出强调要点、语音技巧、肢体语言建议，以及每页的过渡语</p>
            <button class="btn btn-primary btn-lg" @click="runDelivery" :disabled="isLoading">
              🎙️ 生成演讲技巧
            </button>
          </div>
          <div v-else class="delivery-result">
            <!-- General Tips -->
            <div class="general-tips" v-if="deliveryResult.general_tips?.length">
              <h4>🎯 通用演讲技巧</h4>
              <ul>
                <li v-for="(tip, idx) in deliveryResult.general_tips" :key="idx">{{ tip }}</li>
              </ul>
            </div>

            <!-- Per-slide Tips -->
            <div class="delivery-tips-list">
              <h4>📄 每页演讲技巧</h4>
              <div
                v-for="tip in deliveryResult.tips"
                :key="tip.slide_num"
                class="delivery-tip-item"
              >
                <div class="dt-header" @click="viewSlide(tip.slide_num)">
                  <span class="dt-slide-num">第 {{ tip.slide_num }} 页</span>
                  <span class="dt-key-message">{{ tip.key_message || '(无核心信息)' }}</span>
                </div>
                <div class="dt-body">
                  <div v-if="tip.emphasis_points?.length" class="dt-section">
                    <span class="dt-tag">🔑 强调</span>
                    <div class="emphasis-points">
                      <span
                        v-for="ep in tip.emphasis_points"
                        :key="ep"
                        class="emphasis-chip"
                      >{{ ep }}</span>
                    </div>
                  </div>
                  <div v-if="tip.voice_tips" class="dt-section">
                    <span class="dt-tag">🎵 语音</span>
                    <span>{{ tip.voice_tips }}</span>
                  </div>
                  <div v-if="tip.body_language" class="dt-section">
                    <span class="dt-tag">🧍 肢体</span>
                    <span>{{ tip.body_language }}</span>
                  </div>
                  <div v-if="tip.transition_phrase" class="dt-section transition">
                    <span class="dt-tag">➡️ 过渡</span>
                    <span class="transition-text">"{{ tip.transition_phrase }}"</span>
                  </div>
                </div>
              </div>
            </div>

            <button class="btn btn-outline" @click="runDelivery" :disabled="isLoading">
              🔄 重新生成
            </button>
          </div>
        </div>

        <!-- Audience Prediction Tab -->
        <div v-else-if="activeTab === 'audience'" class="tab-panel">
          <div v-if="!audienceResult" class="coach-start">
            <p class="coach-desc">AI 将预测观众可能提出的问题，帮助你提前准备回答，增加演讲信心</p>
            <div class="audience-options">
              <div class="option-row">
                <label>观众画像：</label>
                <select v-model="audienceProfile" class="form-select">
                  <option value="">一般商务人士</option>
                  <option value="技术高管">技术高管 / CTO</option>
                  <option value="投资者">投资者 / 股东</option>
                  <option value="大学生">大学生 / 学术</option>
                  <option value="客户">潜在客户</option>
                  <option value="团队成员">团队成员 / 同事</option>
                  <option value="媒体">媒体 / 记者</option>
                </select>
              </div>
            </div>
            <button class="btn btn-primary btn-lg" @click="runAudience" :disabled="isLoading">
              👥 预测观众问题
            </button>
          </div>
          <div v-else class="audience-result">
            <!-- Audience Profile -->
            <div class="audience-header">
              <span class="audience-badge">
                👥 目标观众: {{ audienceResult.audience_profile || '一般商务人士' }}
              </span>
            </div>

            <!-- Must Prepare -->
            <div class="must-prepare" v-if="audienceResult.must_prepare?.length">
              <h4>🔥 必须准备的问题</h4>
              <div class="must-prepare-list">
                <div
                  v-for="(q, idx) in audienceResult.must_prepare"
                  :key="idx"
                  class="must-prepare-item"
                >
                  {{ idx + 1 }}. {{ q }}
                </div>
              </div>
            </div>

            <!-- Hardest Question -->
            <div class="hardest-question" v-if="audienceResult.hardest_question">
              <h4>💪 最难回答的问题</h4>
              <div class="hardest-item">
                <div class="hq-question">❓ {{ audienceResult.hardest_question.question }}</div>
                <div class="hq-why" v-if="audienceResult.hardest_question.why_hard">
                  <strong>为什么难：</strong>{{ audienceResult.hardest_question.why_hard }}
                </div>
                <div class="hq-strategy" v-if="audienceResult.hardest_question.strategy">
                  <strong>应对策略：</strong>{{ audienceResult.hardest_question.strategy }}
                </div>
              </div>
            </div>

            <!-- All Questions -->
            <div class="audience-questions-list">
              <h4>📋 预测的问题（共 {{ audienceResult.questions?.length || 0 }} 个）</h4>
              <div
                v-for="(q, idx) in audienceResult.questions"
                :key="idx"
                class="audience-question-item"
                :class="{ revealed: revealedAudQuestions.has(idx) }"
              >
                <div class="aq-question" @click="toggleAudQuestion(idx)">
                  <span class="aq-num">{{ idx + 1 }}.</span>
                  <span class="aq-text">{{ q.question }}</span>
                  <div class="aq-meta">
                    <span :class="['cat-tag', q.category]">{{ categoryLabels[q.category] || q.category }}</span>
                    <span :class="['diff-tag', q.difficulty]">{{ difficultyLabels[q.difficulty] || q.difficulty }}</span>
                    <span class="aq-ref" v-if="q.slide_ref">📍 第{{ q.slide_ref }}页</span>
                  </div>
                </div>
                <div v-if="revealedAudQuestions.has(idx)" class="aq-answer">
                  <div v-if="q.why_likely" class="aq-why">
                    <strong>为什么问：</strong>{{ q.why_likely }}
                  </div>
                  <div v-if="q.suggested_answer" class="aq-answer-text">
                    <strong>建议回答：</strong>{{ q.suggested_answer }}
                  </div>
                  <div v-if="q.preparation_tip" class="aq-tip">
                    <strong>💡 准备建议：</strong>{{ q.preparation_tip }}
                  </div>
                </div>
                <div v-else class="aq-hint" @click="toggleAudQuestion(idx)">
                  点击查看回答提示
                </div>
              </div>
            </div>

            <button class="btn btn-outline" @click="resetAudience" :disabled="isLoading">
              🔄 重新预测
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { api } from '../api/client'

const props = defineProps<{
  visible: boolean
  taskId: string
  slides: Array<{
    title: string
    content: string
    layout?: string
    presenterNotes?: string
  }>
}>()

const emit = defineEmits(['close', 'viewSlide', 'applyTiming'])

// Tabs
const tabs = [
  { id: 'analyze', label: '分析反馈', icon: '🔍' },
  { id: 'practice', label: '练习模式', icon: '🎤' },
  { id: 'timing', label: '时间节奏', icon: '⏱️' },
  { id: 'delivery', label: '演讲技巧', icon: '🎙️' },
  { id: 'audience', label: '观众预测', icon: '👥' },
]

const activeTab = ref('analyze')
const isLoading = ref(false)
const loadingMessage = ref('分析中...')

// Analysis
const analysisResult = ref<any>(null)
const overallScore = computed(() => analysisResult.value?.overall_score)

// Practice
const practiceResult = ref<any>(null)
const selectedDifficulty = ref('mixed')
const questionCount = ref(10)
const revealedQuestions = ref(new Set<number>())

// Timing
const timingResult = ref<any>(null)
const totalMinutes = ref(15)

// Delivery
const deliveryResult = ref<any>(null)

// Audience
const audienceResult = ref<any>(null)
const audienceProfile = ref('')
const revealedAudQuestions = ref(new Set<number>())

// Labels
const difficultyLabels: Record<string, string> = {
  easy: '简单',
  moderate: '中等',
  hard: '困难',
  mixed: '混合'
}

const categoryLabels: Record<string, string> = {
  clarification: '澄清',
  challenge: '质疑',
  suggestion: '建议',
  deep_dive: '深入',
  technical: '技术',
  commercial: '商务'
}

// Methods
function switchTab(tabId: string) {
  activeTab.value = tabId
}

async function runAnalysis() {
  isLoading.value = true
  loadingMessage.value = 'AI 正在分析幻灯片...'
  analysisResult.value = null
  try {
    const res = await api.post('/ppt/coach/analyze', {
      task_id: props.taskId,
      slides: props.slides
    })
    if (res.data.success) {
      analysisResult.value = res.data.analysis
    } else {
      alert(res.data.error || '分析失败')
    }
  } catch (e: any) {
    alert('分析失败: ' + (e.message || '请重试'))
  } finally {
    isLoading.value = false
  }
}

async function runPractice() {
  isLoading.value = true
  loadingMessage.value = 'AI 正在生成练习问答...'
  practiceResult.value = null
  revealedQuestions.value.clear()
  try {
    const res = await api.post('/ppt/coach/practice', {
      task_id: props.taskId,
      slides: props.slides,
      difficulty: selectedDifficulty.value,
      count: questionCount.value
    })
    if (res.data.success) {
      practiceResult.value = res.data
    } else {
      alert(res.data.error || '生成失败')
    }
  } catch (e: any) {
    alert('生成失败: ' + (e.message || '请重试'))
  } finally {
    isLoading.value = false
  }
}

function resetPractice() {
  practiceResult.value = null
  revealedQuestions.value.clear()
}

async function runTiming() {
  isLoading.value = true
  loadingMessage.value = '计算时间分配...'
  timingResult.value = null
  try {
    const res = await api.post('/ppt/coach/timing', {
      task_id: props.taskId,
      slides: props.slides,
      total_minutes: totalMinutes.value
    })
    if (res.data.success) {
      timingResult.value = res.data
    } else {
      alert(res.data.error || '计算失败')
    }
  } catch (e: any) {
    alert('计算失败: ' + (e.message || '请重试'))
  } finally {
    isLoading.value = false
  }
}

async function runDelivery() {
  isLoading.value = true
  loadingMessage.value = 'AI 正在生成演讲技巧...'
  deliveryResult.value = null
  try {
    const res = await api.post('/ppt/coach/delivery', {
      task_id: props.taskId,
      slides: props.slides
    })
    if (res.data.success) {
      deliveryResult.value = res.data
    } else {
      alert(res.data.error || '生成失败')
    }
  } catch (e: any) {
    alert('生成失败: ' + (e.message || '请重试'))
  } finally {
    isLoading.value = false
  }
}

async function runAudience() {
  isLoading.value = true
  loadingMessage.value = 'AI 正在预测观众问题...'
  audienceResult.value = null
  revealedAudQuestions.value.clear()
  try {
    const res = await api.post('/ppt/coach/audience', {
      task_id: props.taskId,
      slides: props.slides,
      audience_profile: audienceProfile.value
    })
    if (res.data.success) {
      audienceResult.value = res.data
    } else {
      alert(res.data.error || '预测失败')
    }
  } catch (e: any) {
    alert('预测失败: ' + (e.message || '请重试'))
  } finally {
    isLoading.value = false
  }
}

function resetAudience() {
  audienceResult.value = null
  revealedAudQuestions.value.clear()
}

function toggleQuestion(idx: number) {
  if (revealedQuestions.value.has(idx)) {
    revealedQuestions.value.delete(idx)
  } else {
    revealedQuestions.value.add(idx)
  }
}

function toggleAudQuestion(idx: number) {
  if (revealedAudQuestions.value.has(idx)) {
    revealedAudQuestions.value.delete(idx)
  } else {
    revealedAudQuestions.value.add(idx)
  }
}

function viewSlide(slideNum: number) {
  emit('viewSlide', slideNum)
}

function startPracticeMode() {
  // Switch to practice tab with first question revealed
  if (practiceResult.value?.qa_list?.length) {
    revealedQuestions.value.add(0)
  }
}

// Helpers
function getPaceIcon(feedback: string): string {
  if (feedback.includes('快')) return '🏃'
  if (feedback.includes('慢')) return '🐢'
  return '✅'
}

function getTimingColor(seconds: number): string {
  if (seconds < 30) return '#34C759'
  if (seconds < 60) return '#007AFF'
  if (seconds < 90) return '#FF9500'
  return '#FF3B30'
}

// Reset when panel opens with new task
watch(() => props.visible, (visible) => {
  if (visible) {
    // Keep existing results when reopening same panel
  }
})
</script>

<style scoped>
.coach-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.coach-panel {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 720px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.coach-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e5e5;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.coach-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.coach-title h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.coach-icon {
  font-size: 24px;
}

.coach-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.coach-tabs {
  display: flex;
  border-bottom: 1px solid #e5e5e5;
  background: #f9f9f9;
  overflow-x: auto;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 16px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 13px;
  color: #666;
  border-bottom: 2px solid transparent;
  white-space: nowrap;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: #333;
  background: #f0f0f0;
}

.tab-btn.active {
  color: #667eea;
  border-bottom-color: #667eea;
  background: white;
}

.tab-icon {
  font-size: 16px;
}

.coach-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.coach-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e5e5;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.coach-start {
  text-align: center;
  padding: 20px;
}

.coach-desc {
  color: #666;
  margin-bottom: 24px;
  line-height: 1.6;
  font-size: 14px;
}

.coach-start .btn-lg {
  padding: 12px 32px;
  font-size: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
}

.coach-start .btn-lg:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Score Cards */
.score-cards {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.score-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.score-card.small {
  background: #f5f5f5;
  padding: 12px 16px;
  border-radius: 12px;
}

.score-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: conic-gradient(
    #667eea calc(var(--score) * 1%),
    #e5e5e5 calc(var(--score) * 1%)
  );
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.score-circle::before {
  content: '';
  position: absolute;
  width: 64px;
  height: 64px;
  background: white;
  border-radius: 50%;
}

.score-num {
  position: relative;
  font-size: 28px;
  font-weight: 700;
  color: #667eea;
}

.score-small-num {
  font-size: 24px;
  font-weight: 700;
  color: #667eea;
}

.score-label {
  font-size: 11px;
  color: #888;
}

/* Feedback Blocks */
.feedback-block,
.improvements-block,
.general-tips,
.timing-tips {
  background: #f9f9f9;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.feedback-block h4,
.improvements-block h4,
.general-tips h4,
.timing-tips h4 {
  margin: 0 0 10px;
  font-size: 14px;
  color: #333;
}

.improvements-block ul,
.general-tips ul,
.timing-tips ul {
  margin: 0;
  padding-left: 20px;
}

.improvements-block li,
.general-tips li,
.timing-tips li {
  color: #555;
  font-size: 13px;
  margin-bottom: 6px;
  line-height: 1.5;
}

/* Slide Feedback List */
.slide-feedback-list h4 {
  font-size: 14px;
  margin-bottom: 12px;
}

.slide-feedback-item {
  border: 1px solid #e5e5e5;
  border-radius: 10px;
  margin-bottom: 12px;
  overflow: hidden;
}

.sf-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: #f5f5f5;
  cursor: pointer;
}

.sf-slide-num {
  font-weight: 600;
  font-size: 13px;
}

.sf-body {
  padding: 12px 14px;
}

.sf-section {
  margin-bottom: 10px;
}

.sf-section:last-child {
  margin-bottom: 0;
}

.sf-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  margin-bottom: 6px;
}

.sf-tag.positive { background: #dcfce7; color: #166534; }
.sf-tag.negative { background: #fef2f2; color: #991b1b; }
.sf-tag.suggestion { background: #eff6ff; color: #1e40af; }

.sf-section ul {
  margin: 0;
  padding-left: 18px;
  font-size: 13px;
  color: #555;
}

.sf-section li {
  margin-bottom: 4px;
}

/* Practice Options */
.practice-options,
.timing-options,
.audience-options {
  background: #f9f9f9;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

.option-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.option-row:last-child {
  margin-bottom: 0;
}

.option-row label {
  font-size: 13px;
  color: #666;
  white-space: nowrap;
}

.difficulty-btns {
  display: flex;
  gap: 6px;
}

.diff-btn {
  padding: 6px 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.diff-btn.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.form-select {
  padding: 8px 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-size: 13px;
  background: white;
  cursor: pointer;
}

/* Q&A List */
.qa-list,
.audience-questions-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.qa-item,
.audience-question-item {
  border: 1px solid #e5e5e5;
  border-radius: 10px;
  overflow: hidden;
  transition: all 0.2s;
}

.qa-question,
.aq-question {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px;
  cursor: pointer;
  background: white;
  transition: background 0.2s;
}

.qa-question:hover,
.aq-question:hover {
  background: #f9f9f9;
}

.qa-num,
.aq-num {
  font-weight: 700;
  color: #667eea;
  font-size: 14px;
  min-width: 24px;
}

.qa-text,
.aq-text {
  flex: 1;
  font-size: 14px;
  line-height: 1.5;
  color: #333;
}

.qa-meta,
.aq-meta {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-shrink: 0;
}

.cat-tag,
.diff-tag {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
}

.cat-tag.clarification { background: #dbeafe; color: #1e40af; }
.cat-tag.challenge { background: #fef3c7; color: #92400e; }
.cat-tag.suggestion { background: #dcfce7; color: #166534; }
.cat-tag.deep_dive { background: #f3e8ff; color: #7e22ce; }
.cat-tag.technical { background: #e0e7ff; color: #3730a3; }
.cat-tag.commercial { background: #fce7f3; color: #9d174d; }

.diff-tag.easy { background: #dcfce7; color: #166534; }
.diff-tag.moderate { background: #fef9c3; color: #854d0e; }
.diff-tag.hard { background: #fee2e2; color: #991b1b; }

.aq-ref,
.qa-ref {
  font-size: 10px;
  color: #888;
}

.qa-answer,
.aq-answer {
  padding: 12px 14px;
  background: #f0f9ff;
  border-top: 1px solid #e5e5e5;
}

.answer-main,
.answer-tips,
.aq-why,
.aq-answer-text,
.aq-tip {
  font-size: 13px;
  color: #444;
  margin-bottom: 8px;
  line-height: 1.5;
}

.answer-main:last-child,
.answer-tips:last-child,
.aq-why:last-child,
.aq-answer-text:last-child,
.aq-tip:last-child {
  margin-bottom: 0;
}

.qa-hint,
.aq-hint {
  padding: 10px 14px;
  background: #f5f5f5;
  border-top: 1px solid #e5e5e5;
  font-size: 12px;
  color: #888;
  cursor: pointer;
  text-align: center;
}

.qa-hint:hover,
.aq-hint:hover {
  background: #eee;
}

/* Practice Header */
.practice-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.practice-header h4 {
  margin: 0;
  font-size: 15px;
}

.practice-meta {
  font-size: 12px;
  color: #888;
}

.practice-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

/* Timing Results */
.timing-summary {
  display: flex;
  justify-content: space-around;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 12px;
  margin-bottom: 16px;
}

.timing-stat {
  text-align: center;
}

.stat-num {
  display: block;
  font-size: 28px;
  font-weight: 700;
  color: #667eea;
}

.stat-label {
  font-size: 11px;
  color: #888;
}

.pace-feedback {
  background: linear-gradient(135deg, #667eea22, #764ba222);
  padding: 14px;
  border-radius: 10px;
  text-align: center;
  font-size: 14px;
  color: #333;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.pace-icon {
  font-size: 20px;
}

.timing-breakdown h4,
.per-slide-timing h4,
.pause-points h4 {
  font-size: 13px;
  margin-bottom: 10px;
  color: #333;
}

.breakdown-bars {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.breakdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.breakdown-label {
  font-size: 12px;
  color: #666;
  width: 70px;
  flex-shrink: 0;
}

.breakdown-bar {
  flex: 1;
  height: 12px;
  background: #e5e5e5;
  border-radius: 6px;
  overflow: hidden;
}

.breakdown-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.5s ease;
}

.breakdown-fill.intro { background: #34C759; }
.breakdown-fill.content { background: #007AFF; }
.breakdown-fill.conclusion { background: #FF9500; }

.breakdown-time {
  font-size: 11px;
  color: #888;
  width: 50px;
  text-align: right;
}

.timing-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.timing-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.timing-item:hover {
  background: #f9f9f9;
}

.timing-slide-num {
  font-size: 12px;
  font-weight: 600;
  color: #667eea;
  width: 55px;
  flex-shrink: 0;
}

.timing-slide-title {
  font-size: 12px;
  color: #666;
  width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 0;
}

.timing-bar-container {
  flex: 1;
  height: 8px;
  background: #e5e5e5;
  border-radius: 4px;
  overflow: hidden;
}

.timing-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}

.timing-seconds {
  font-size: 12px;
  font-weight: 600;
  color: #333;
  width: 45px;
  text-align: right;
}

.pause-points {
  margin-bottom: 20px;
}

.pause-desc {
  font-size: 12px;
  color: #888;
  margin-bottom: 10px;
}

.pause-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pause-tag {
  padding: 4px 12px;
  background: #fef3c7;
  color: #92400e;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
}

/* Delivery Tips */
.delivery-tips-list h4 {
  font-size: 14px;
  margin-bottom: 12px;
}

.delivery-tip-item {
  border: 1px solid #e5e5e5;
  border-radius: 10px;
  margin-bottom: 12px;
  overflow: hidden;
}

.dt-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: #f5f5f5;
  cursor: pointer;
}

.dt-header:hover {
  background: #eee;
}

.dt-slide-num {
  font-size: 12px;
  font-weight: 700;
  color: #667eea;
}

.dt-key-message {
  font-size: 13px;
  color: #333;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dt-body {
  padding: 12px 14px;
}

.dt-section {
  margin-bottom: 10px;
  font-size: 13px;
  color: #555;
  line-height: 1.5;
}

.dt-section:last-child {
  margin-bottom: 0;
}

.dt-section.transition {
  background: #f0f9ff;
  padding: 8px 12px;
  border-radius: 6px;
}

.dt-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  margin-right: 6px;
  background: #667eea22;
  color: #667eea;
}

.emphasis-points {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 6px;
}

.emphasis-chip {
  padding: 3px 10px;
  background: #fef3c7;
  color: #92400e;
  border-radius: 12px;
  font-size: 12px;
}

.transition-text {
  font-style: italic;
  color: #007AFF;
}

/* Audience */
.audience-header {
  margin-bottom: 16px;
}

.audience-badge {
  display: inline-block;
  padding: 6px 14px;
  background: linear-gradient(135deg, #667eea22, #764ba222);
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

.must-prepare,
.hardest-question {
  background: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 16px;
}

.must-prepare h4,
.hardest-question h4 {
  font-size: 13px;
  margin-bottom: 10px;
  color: #333;
}

.must-prepare-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.must-prepare-item {
  font-size: 13px;
  color: #555;
  padding: 6px 0;
  border-bottom: 1px solid #fed7aa;
}

.must-prepare-item:last-child {
  border-bottom: none;
}

.hardest-item {
  font-size: 13px;
  color: #555;
}

.hq-question {
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.hq-why,
.hq-strategy {
  margin-bottom: 6px;
  line-height: 1.5;
}

/* Buttons */
.btn {
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
  border: none;
}

.btn-outline {
  background: white;
  border: 1px solid #e5e5e5;
  color: #666;
}

.btn-outline:hover {
  background: #f5f5f5;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5a6fd6;
}

.btn-sm {
  padding: 4px 10px;
  font-size: 11px;
  background: #667eea22;
  color: #667eea;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.timing-apply-row {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;
}
</style>
