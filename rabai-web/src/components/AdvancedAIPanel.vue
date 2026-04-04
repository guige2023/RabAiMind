<template>
  <div v-if="show" class="modal-mask" @click.self="$emit('close')">
    <div class="advanced-ai-panel">
      <div class="panel-header">
        <h2>🤖 AI 高级功能</h2>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="panel-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="tab-btn"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ tab.icon }} {{ tab.name }}
        </button>
      </div>

      <div class="panel-content">
        <!-- Tab 1: Smart Copy -->
        <div v-if="activeTab === 'smart-copy'" class="tab-content">
          <div class="feature-intro">
            <h3>🧠 智能复制</h3>
            <p>从其他PPT中选择性迁移内容，AI智能适配目标主题和风格</p>
          </div>

          <div class="form-item">
            <label>源PPT内容（粘贴或手动输入）</label>
            <textarea
              v-model="smartCopy.sourceText"
              class="form-textarea"
              placeholder="粘贴源PPT的内容，每页用---分隔，格式：标题 + 内容"
              rows="6"
            ></textarea>
          </div>

          <div class="form-item">
            <label>目标主题</label>
            <input v-model="smartCopy.targetTheme" class="form-input" placeholder="例如：年度总结汇报" />
          </div>

          <div class="form-row">
            <div class="form-item">
              <label>目标风格</label>
              <select v-model="smartCopy.targetStyle" class="form-select">
                <option value="professional">商务专业</option>
                <option value="creative">创意活泼</option>
                <option value="academic">学术严谨</option>
                <option value="minimal">简约清新</option>
              </select>
            </div>
            <div class="form-item">
              <label>目标页数</label>
              <input v-model.number="smartCopy.targetPageCount" type="number" class="form-input" min="1" max="20" />
            </div>
          </div>

          <button class="btn btn-primary btn-block" @click="handleSmartCopy" :disabled="loading">
            {{ loading && currentAction === 'smart-copy' ? '分析中...' : '🚀 开始智能复制' }}
          </button>

          <div v-if="smartCopy.result" class="result-section">
            <h4>📋 复制结果</h4>
            <div class="result-summary">{{ smartCopy.result.summary }}</div>
            <div v-for="(slide, idx) in smartCopy.result.copied_slides" :key="idx" class="copied-slide-card">
              <div class="slide-header">
                <span class="slide-num">{{ slide.source_slide }}</span>
                <span class="relevance-badge" :class="slide.relevance">{{ slide.relevance }}</span>
              </div>
              <div class="slide-title">{{ slide.title }}</div>
              <div class="slide-content">{{ slide.content }}</div>
            </div>
          </div>
        </div>

        <!-- Tab 2: Content Extender -->
        <div v-if="activeTab === 'content-extender'" class="tab-content">
          <div class="feature-intro">
            <h3>✨ AI 内容扩展</h3>
            <p>将简略的大纲要点扩展为详细的幻灯片内容，包括演讲提示</p>
          </div>

          <div class="form-item">
            <label>简略大纲（每行一个主题）</label>
            <textarea
              v-model="contentExtender.outlineText"
              class="form-textarea"
              placeholder="例如：
产品优势介绍
市场竞争分析
年度销售数据
未来发展规划"
              rows="8"
            ></textarea>
          </div>

          <div class="form-item">
            <label>PPT主题</label>
            <input v-model="contentExtender.topic" class="form-input" placeholder="例如：2024年Q3季度汇报" />
          </div>

          <div class="form-row">
            <div class="form-item">
              <label>目标受众</label>
              <select v-model="contentExtender.audience" class="form-select">
                <option value="商务人士">商务人士</option>
                <option value="技术团队">技术团队</option>
                <option value="管理层">管理层</option>
                <option value="投资者">投资者</option>
                <option value="大众">大众</option>
              </select>
            </div>
            <div class="form-item">
              <label>风格</label>
              <select v-model="contentExtender.style" class="form-select">
                <option value="professional">商务专业</option>
                <option value="creative">创意活泼</option>
                <option value="academic">学术严谨</option>
              </select>
            </div>
          </div>

          <button class="btn btn-primary btn-block" @click="handleExtendContent" :disabled="loading">
            {{ loading && currentAction === 'extend-content' ? '扩展中...' : '✨ 扩展内容' }}
          </button>

          <div v-if="contentExtender.result" class="result-section">
            <h4>📋 扩展结果（共 {{ contentExtender.result.total_slides }} 页）</h4>
            <div v-for="(slide, idx) in contentExtender.result.extended_slides" :key="idx" class="extended-slide-card">
              <div class="slide-header">
                <span class="slide-num">第 {{ idx + 1 }} 页</span>
                <span class="duration-hint">⏱ {{ slide.time_hint || '1分钟' }}</span>
              </div>
              <div class="slide-title">{{ slide.title }}</div>
              <div class="slide-core">{{ slide.core_message }}</div>
              <div class="slide-bullets" v-if="slide.bullet_points">
                <div v-for="(bp, bi) in slide.bullet_points" :key="bi" class="bullet-item">
                  <strong>{{ bp.point }}:</strong> {{ bp.detail }}
                </div>
              </div>
              <div class="slide-notes">
                <strong>💬 演讲提示:</strong> {{ slide.speaker_notes }}
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 3: Speaker Notes -->
        <div v-if="activeTab === 'speaker-notes'" class="tab-content">
          <div class="feature-intro">
            <h3>🎤 自动演讲稿</h3>
            <p>为当前PPT的每页幻灯片生成专业的演讲者备注</p>
          </div>

          <div class="form-item">
            <label>幻灯片数据（从当前PPT读取）</label>
            <div class="slides-preview" v-if="slidesData.length > 0">
              <div v-for="(slide, idx) in slidesData.slice(0, 10)" :key="idx" class="slide-preview-item">
                <span class="slide-num">第{{ idx + 1 }}页</span>
                <span class="slide-title-preview">{{ slide.title }}</span>
              </div>
              <div v-if="slidesData.length > 10" class="more-slides">+{{ slidesData.length - 10 }} 页</div>
            </div>
            <div v-else class="empty-hint">点击下方按钮读取当前PPT的幻灯片内容</div>
          </div>

          <div class="form-item">
            <label>总演讲时长（分钟）</label>
            <input v-model.number="speakerNotes.totalDuration" type="number" class="form-input" min="1" max="120" />
          </div>

          <div class="action-row">
            <button class="btn btn-outline" @click="loadSlidesFromPPT">📥 读取PPT内容</button>
            <button class="btn btn-primary" @click="handleSpeakerNotes" :disabled="loading || slidesData.length === 0">
              {{ loading && currentAction === 'speaker-notes' ? '生成中...' : '🎤 生成演讲稿' }}
            </button>
          </div>

          <div v-if="speakerNotes.result" class="result-section">
            <h4>📋 演讲稿（ {{ speakerNotes.result.total_slides }} 页）</h4>
            <div v-for="(note, idx) in speakerNotes.result.speaker_notes" :key="idx" class="speaker-note-card">
              <div class="note-header">
                <span class="slide-num">第 {{ note.slide_num }} 页</span>
                <span class="time-hint">⏱ {{ note.time_hint }}</span>
                <span class="tone-hint">🎯 {{ note.tone_suggestion }}</span>
              </div>
              <div class="note-section">
                <strong>开场:</strong> {{ note.opening }}
              </div>
              <div class="note-section">
                <strong>讲述:</strong> {{ note.main_script }}
              </div>
              <div class="note-section" v-if="note.transition">
                <strong>过渡:</strong> {{ note.transition }}
              </div>
              <div class="note-key-messages" v-if="note.key_messages && note.key_messages.length > 0">
                <strong>🎯 关键信息:</strong>
                <span v-for="(msg, mi) in note.key_messages" :key="mi" class="key-msg-tag">{{ msg }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 4: Design Checker -->
        <div v-if="activeTab === 'design-checker'" class="tab-content">
          <div class="feature-intro">
            <h3>🔍 设计一致性检查</h3>
            <p>扫描PPT的设计违规问题，给出专业优化建议</p>
          </div>

          <div class="form-item">
            <label>风格主题</label>
            <select v-model="designChecker.styleTheme" class="form-select">
              <option value="business">商务风格</option>
              <option value="creative">创意风格</option>
              <option value="academic">学术风格</option>
              <option value="minimal">简约风格</option>
            </select>
          </div>

          <div class="form-item">
            <label>品牌配色（可选，留空使用默认）</label>
            <div class="color-inputs">
              <input v-model="designChecker.brandColors[0]" type="color" class="color-picker" />
              <input v-model="designChecker.brandColors[1]" type="color" class="color-picker" />
              <input v-model="designChecker.brandColors[2]" type="color" class="color-picker" />
              <button class="btn btn-sm" @click="loadSlidesForDesign">📥 读取PPT检查</button>
            </div>
          </div>

          <button class="btn btn-primary btn-block" @click="handleDesignCheck" :disabled="loading">
            {{ loading && currentAction === 'design-check' ? '扫描中...' : '🔍 开始检查' }}
          </button>

          <div v-if="designChecker.result" class="result-section">
            <div class="score-section">
              <div class="score-circle" :class="getScoreClass(designChecker.result.overall_score)">
                <span class="score-num">{{ designChecker.result.overall_score }}</span>
                <span class="score-label">分</span>
              </div>
              <div class="score-summary">
                <span class="critical-badge">🔴 {{ designChecker.result.critical_count }} 严重</span>
                <span class="warning-badge">🟡 {{ designChecker.result.warning_count }} 警告</span>
                <span class="suggestion-badge">🔵 {{ designChecker.result.suggestion_count }} 建议</span>
              </div>
            </div>

            <div v-if="designChecker.result.violations && designChecker.result.violations.length > 0" class="violations-list">
              <h4>📋 发现问题</h4>
              <div
                v-for="(v, idx) in designChecker.result.violations"
                :key="idx"
                class="violation-item"
                :class="v.severity"
              >
                <div class="violation-header">
                  <span class="violation-slide">第{{ v.slide_num }}页</span>
                  <span class="violation-severity">{{ v.severity === 'critical' ? '🔴严重' : v.severity === 'warning' ? '🟡警告' : '🔵建议' }}</span>
                </div>
                <div class="violation-category">{{ v.category }}</div>
                <div class="violation-desc">{{ v.description }}</div>
                <div class="violation-fix">💡 {{ v.suggested_fix }}</div>
              </div>
            </div>

            <div v-if="designChecker.result.recommendations && designChecker.result.recommendations.length > 0" class="recommendations">
              <h4>💎 改进建议</h4>
              <div v-for="(rec, idx) in designChecker.result.recommendations" :key="idx" class="rec-item">
                {{ rec }}
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 5: Professional Polish -->
        <div v-if="activeTab === 'polish'" class="tab-content">
          <div class="feature-intro">
            <h3>✨ 一键专业优化</h3>
            <p>对PPT进行全方位的专业级优化，包括配色、布局、字体、留白等</p>
          </div>

          <div class="form-item">
            <label>使用场景</label>
            <select v-model="polish.useCase" class="form-select">
              <option value="商务演示">商务演示</option>
              <option value="产品发布">产品发布</option>
              <option value="教学培训">教学培训</option>
              <option value="个人展示">个人展示</option>
              <option value="项目汇报">项目汇报</option>
            </select>
          </div>

          <div class="form-item">
            <label>目标风格</label>
            <select v-model="polish.targetStyle" class="form-select">
              <option value="business">商务专业</option>
              <option value="creative">创意活泼</option>
              <option value="minimal">简约清新</option>
              <option value="bold">大胆醒目</option>
            </select>
          </div>

          <div class="action-row">
            <button class="btn btn-outline" @click="loadSlidesForPolish">📥 读取PPT内容</button>
            <button class="btn btn-primary" @click="handlePolish" :disabled="loading">
              {{ loading && currentAction === 'polish' ? '优化中...' : '✨ 开始优化' }}
            </button>
          </div>

          <div v-if="polish.result" class="result-section">
            <h4>📋 优化结果</h4>
            <div class="polish-summary">{{ polish.result.before_after_summary }}</div>

            <div v-for="(opt, idx) in polish.result.global_optimizations" :key="idx" class="global-opt-item">
              <span class="opt-type">{{ opt.type }}</span>
              <span class="opt-impact" :class="opt.impact">{{ opt.impact }}</span>
              <span class="opt-desc">{{ opt.description }}</span>
            </div>

            <div v-for="(slide, idx) in polish.result.polished_slides" :key="idx" class="polished-slide-card">
              <div class="slide-header">
                <span class="slide-num">第 {{ slide.slide_num }} 页</span>
                <span class="improvement-summary">{{ slide.improvement_summary }}</span>
              </div>
              <div class="applied-theme" v-if="slide.applied_theme">
                <span class="theme-color" :style="{ background: slide.applied_theme.primary_color }"></span>
                <span class="theme-color" :style="{ background: slide.applied_theme.secondary_color }"></span>
                <span class="theme-color" :style="{ background: slide.applied_theme.accent_color }"></span>
                <span class="theme-font">{{ slide.applied_theme.font_title }}</span>
              </div>
              <div v-for="(opt, oi) in slide.optimizations" :key="oi" class="opt-item">
                <span class="opt-badge">{{ opt.type }}</span>
                <span>{{ opt.before }} → {{ opt.after }}</span>
              </div>
            </div>

            <div v-if="polish.result.professional_tips" class="tips-section">
              <h4>💎 专业建议</h4>
              <div v-for="(tip, idx) in polish.result.professional_tips" :key="idx" class="tip-item">
                {{ tip }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { api } from '../api/client'

const props = defineProps<{
  show: boolean
  taskId?: string
  slides?: Array<{ title: string; content: string; bullet_points?: string[] }>
}>()

defineEmits(['close'])

const tabs = [
  { id: 'smart-copy', name: '智能复制', icon: '🧠' },
  { id: 'content-extender', name: '内容扩展', icon: '✨' },
  { id: 'speaker-notes', name: '演讲稿', icon: '🎤' },
  { id: 'design-checker', name: '设计检查', icon: '🔍' },
  { id: 'polish', name: '一键优化', icon: '✨' }
]

const activeTab = ref('smart-copy')
const loading = ref(false)
const currentAction = ref('')

const slidesData = ref<Array<{ title: string; content: string; bullet_points?: string[] }>>([])

// Smart Copy state
const smartCopy = reactive({
  sourceText: '',
  targetTheme: '',
  targetStyle: 'professional',
  targetPageCount: 5,
  result: null as any
})

// Content Extender state
const contentExtender = reactive({
  outlineText: '',
  topic: '',
  audience: '商务人士',
  style: 'professional',
  result: null as any
})

// Speaker Notes state
const speakerNotes = reactive({
  totalDuration: 10,
  result: null as any
})

// Design Checker state
const designChecker = reactive({
  styleTheme: 'business',
  brandColors: ['#1a73e8', '#ffffff', '#202124'],
  result: null as any
})

// Professional Polish state
const polish = reactive({
  targetStyle: 'business',
  useCase: '商务演示',
  result: null as any
})

function getScoreClass(score: number): string {
  if (score >= 80) return 'score-good'
  if (score >= 60) return 'score-warning'
  return 'score-bad'
}

async function loadSlidesFromPPT() {
  if (!props.taskId) return
  try {
    const res = await api.ppt.getOutline(props.taskId)
    if (res.data?.outline?.slides) {
      slidesData.value = res.data.outline.slides.map((s: any) => ({
        title: s.title || '',
        content: s.content || '',
        bullet_points: s.bullet_points || []
      }))
    }
  } catch (e) {
    console.error('Failed to load slides:', e)
  }
}

async function loadSlidesForDesign() {
  await loadSlidesFromPPT()
  handleDesignCheck()
}

async function loadSlidesForPolish() {
  await loadSlidesFromPPT()
}

async function handleSmartCopy() {
  if (!smartCopy.sourceText || !smartCopy.targetTheme) return
  loading.value = true
  currentAction.value = 'smart-copy'

  try {
    // Parse source slides from text (simple parsing)
    const slideTexts = smartCopy.sourceText.split(/---|\n\n/).filter(s => s.trim())
    const sourceSlides = slideTexts.map(s => {
      const lines = s.trim().split('\n')
      return {
        title: lines[0] || '',
        content: lines.slice(1).join('\n') || ''
      }
    })

    const res = await api.advancedAI.smartCopy({
      source_slides: sourceSlides,
      target_theme: smartCopy.targetTheme,
      target_style: smartCopy.targetStyle,
      target_page_count: smartCopy.targetPageCount
    })

    if (res.data?.success) {
      smartCopy.result = res.data.data
    } else {
      alert(res.data?.error || '智能复制失败')
    }
  } catch (e: any) {
    alert('智能复制失败: ' + (e.message || '未知错误'))
  } finally {
    loading.value = false
    currentAction.value = ''
  }
}

async function handleExtendContent() {
  if (!contentExtender.outlineText || !contentExtender.topic) return
  loading.value = true
  currentAction.value = 'extend-content'

  try {
    const lines = contentExtender.outlineText.split('\n').filter(l => l.trim())
    const outline = lines.map(l => ({ title: l.trim(), content: '' }))

    const res = await api.advancedAI.extendContent({
      outline,
      topic: contentExtender.topic,
      audience: contentExtender.audience,
      style: contentExtender.style
    })

    if (res.data?.success) {
      contentExtender.result = res.data.data
    } else {
      alert(res.data?.error || '内容扩展失败')
    }
  } catch (e: any) {
    alert('内容扩展失败: ' + (e.message || '未知错误'))
  } finally {
    loading.value = false
    currentAction.value = ''
  }
}

async function handleSpeakerNotes() {
  if (slidesData.value.length === 0) {
    alert('请先读取PPT内容')
    return
  }
  loading.value = true
  currentAction.value = 'speaker-notes'

  try {
    const res = await api.advancedAI.generateSpeakerNotes({
      slides: slidesData.value,
      total_duration: speakerNotes.totalDuration
    })

    if (res.data?.success) {
      speakerNotes.result = res.data.data
    } else {
      alert(res.data?.error || '演讲稿生成失败')
    }
  } catch (e: any) {
    alert('演讲稿生成失败: ' + (e.message || '未知错误'))
  } finally {
    loading.value = false
    currentAction.value = ''
  }
}

async function handleDesignCheck() {
  if (slidesData.value.length === 0) {
    alert('请先读取PPT内容')
    return
  }
  loading.value = true
  currentAction.value = 'design-check'

  try {
    const res = await api.advancedAI.checkDesignConsistency({
      slides: slidesData.value,
      style_theme: designChecker.styleTheme,
      brand_colors: designChecker.brandColors
    })

    if (res.data?.success) {
      designChecker.result = res.data.data
    } else {
      alert(res.data?.error || '设计检查失败')
    }
  } catch (e: any) {
    alert('设计检查失败: ' + (e.message || '未知错误'))
  } finally {
    loading.value = false
    currentAction.value = ''
  }
}

async function handlePolish() {
  if (slidesData.value.length === 0) {
    alert('请先读取PPT内容')
    return
  }
  loading.value = true
  currentAction.value = 'polish'

  try {
    const res = await api.advancedAI.professionalPolish({
      slides: slidesData.value,
      target_style: polish.targetStyle,
      use_case: polish.useCase
    })

    if (res.data?.success) {
      polish.result = res.data.data
    } else {
      alert(res.data?.error || '优化失败')
    }
  } catch (e: any) {
    alert('优化失败: ' + (e.message || '未知错误'))
  } finally {
    loading.value = false
    currentAction.value = ''
  }
}

// Reset state when panel closes
watch(() => props.show, (val) => {
  if (!val) {
    activeTab.value = 'smart-copy'
  }
})
</script>

<style scoped>
.advanced-ai-panel {
  background: var(--bg-primary, #1e1e2e);
  border-radius: 16px;
  width: 680px;
  max-width: 95vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
}

.panel-header h2 {
  margin: 0;
  font-size: 18px;
  color: #fff;
}

.close-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #fff;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.panel-tabs {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.2);
  overflow-x: auto;
  flex-shrink: 0;
}

.tab-btn {
  padding: 8px 14px;
  border: none;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  white-space: nowrap;
  transition: all 0.2s;
}

.tab-btn.active {
  background: rgba(22, 93, 255, 0.4);
  color: #fff;
}

.tab-btn:hover:not(.active) {
  background: rgba(255, 255, 255, 0.1);
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feature-intro {
  background: rgba(22, 93, 255, 0.1);
  border: 1px solid rgba(22, 93, 255, 0.3);
  border-radius: 12px;
  padding: 16px;
}

.feature-intro h3 {
  margin: 0 0 6px 0;
  font-size: 15px;
  color: #fff;
}

.feature-intro p {
  margin: 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-item label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
}

.form-input, .form-textarea, .form-select {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 10px 12px;
  color: #fff;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus, .form-textarea:focus, .form-select:focus {
  border-color: rgba(22, 93, 255, 0.6);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #165dff, #4080ff);
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #4080ff, #165dff);
}

.btn-outline {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-outline:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
}

.btn-block {
  width: 100%;
}

.action-row {
  display: flex;
  gap: 12px;
}

.action-row .btn {
  flex: 1;
}

.result-section {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-section h4 {
  margin: 0;
  font-size: 14px;
  color: #fff;
}

.result-summary {
  background: rgba(22, 93, 255, 0.15);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
}

.copied-slide-card, .extended-slide-card, .speaker-note-card, .polished-slide-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.slide-header {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.slide-num {
  background: rgba(22, 93, 255, 0.3);
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}

.relevance-badge {
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 12px;
}

.relevance-badge.高 {
  background: rgba(76, 175, 80, 0.3);
  color: #4caf50;
}

.relevance-badge.中 {
  background: rgba(255, 193, 7, 0.3);
  color: #ffc107;
}

.relevance-badge.低 {
  background: rgba(255, 152, 0, 0.3);
  color: #ff9800;
}

.relevance-badge.不相关 {
  background: rgba(244, 67, 54, 0.3);
  color: #f44336;
}

.slide-title {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.slide-content, .slide-core {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
}

.slide-bullets {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.bullet-item {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  padding-left: 8px;
  border-left: 2px solid rgba(22, 93, 255, 0.4);
}

.slide-notes {
  background: rgba(255, 193, 7, 0.1);
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}

.slides-preview {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 10px;
  max-height: 150px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.slide-preview-item {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 12px;
}

.slide-title-preview {
  color: rgba(255, 255, 255, 0.7);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.more-slides {
  text-align: center;
  color: rgba(255, 255, 255, 0.4);
  font-size: 12px;
  padding: 4px;
}

.empty-hint {
  text-align: center;
  color: rgba(255, 255, 255, 0.4);
  font-size: 13px;
  padding: 20px;
}

.duration-hint, .time-hint, .tone-hint {
  background: rgba(255, 255, 255, 0.08);
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.note-section {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.75);
  line-height: 1.5;
}

.note-key-messages {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  align-items: center;
  font-size: 12px;
}

.key-msg-tag {
  background: rgba(22, 93, 255, 0.2);
  color: #93b4ff;
  padding: 2px 8px;
  border-radius: 4px;
}

.score-section {
  display: flex;
  align-items: center;
  gap: 20px;
}

.score-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 3px solid;
}

.score-good {
  border-color: #4caf50;
  background: rgba(76, 175, 80, 0.15);
}

.score-warning {
  border-color: #ff9800;
  background: rgba(255, 152, 0, 0.15);
}

.score-bad {
  border-color: #f44336;
  background: rgba(244, 67, 54, 0.15);
}

.score-num {
  font-size: 28px;
  font-weight: 700;
  color: #fff;
}

.score-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.score-summary {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.critical-badge, .warning-badge, .suggestion-badge {
  font-size: 13px;
  padding: 3px 8px;
  border-radius: 6px;
}

.critical-badge {
  background: rgba(244, 67, 54, 0.2);
  color: #ff7043;
}

.warning-badge {
  background: rgba(255, 152, 0, 0.2);
  color: #ffb74d;
}

.suggestion-badge {
  background: rgba(33, 150, 243, 0.2);
  color: #64b5f6;
}

.violations-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.violations-list h4, .recommendations h4 {
  margin: 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}

.violation-item {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  padding: 12px;
  border-left: 3px solid;
}

.violation-item.critical {
  border-color: #f44336;
}

.violation-item.warning {
  border-color: #ff9800;
}

.violation-item.suggestion {
  border-color: #2196f3;
}

.violation-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.violation-slide {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.violation-severity {
  font-size: 12px;
}

.violation-category {
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 4px;
}

.violation-desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.violation-fix {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 4px;
}

.recommendations {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rec-item {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.75);
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
}

.color-inputs {
  display: flex;
  gap: 8px;
  align-items: center;
}

.color-picker {
  width: 40px;
  height: 36px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  padding: 2px;
  background: rgba(255, 255, 255, 0.08);
}

.polish-summary {
  background: rgba(22, 93, 255, 0.1);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
}

.global-opt-item {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  font-size: 13px;
}

.opt-type {
  background: rgba(22, 93, 255, 0.3);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #93b4ff;
}

.opt-impact {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.opt-impact.全局 {
  background: rgba(76, 175, 80, 0.2);
  color: #81c784;
}

.opt-impact.局部 {
  background: rgba(255, 152, 0, 0.2);
  color: #ffb74d;
}

.opt-desc {
  color: rgba(255, 255, 255, 0.7);
}

.applied-theme {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
}

.theme-color {
  width: 20px;
  height: 20px;
  border-radius: 4px;
}

.theme-font {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.opt-item {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.opt-badge {
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
}

.improvement-summary {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.tips-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tip-item {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.75);
  padding: 6px 10px;
  background: rgba(255, 193, 7, 0.08);
  border-radius: 6px;
  border-left: 3px solid rgba(255, 193, 7, 0.4);
}
</style>
