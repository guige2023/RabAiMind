<template>
  <div v-if="show" class="smart-content-overlay" @click.self="closePanel">
    <div class="smart-content-panel">
      <div class="panel-header">
        <div class="header-title">
          <span class="title-icon">💡</span>
          <h3>智能内容建议</h3>
        </div>
        <div class="header-subtitle">AI 驱动的 PPT 内容增强</div>
        <button class="panel-close-btn" @click="closePanel">✕</button>
      </div>

      <div class="panel-body">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>{{ loadingText }}</p>
        </div>

        <!-- Tab 导航 -->
        <div v-if="!loading" class="tabs-nav">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="tab-btn"
            :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            <span class="tab-icon">{{ tab.icon }}</span>
            <span class="tab-label">{{ tab.label }}</span>
          </button>
        </div>

        <!-- 五大功能模块 - 内容增强 -->
        <div v-if="!loading && activeTab === 'content-boost'" class="tab-content">
          <div class="feature-intro">
            <p>AI 分析您的 PPT 内容，智能推荐可以补充的遗漏主题和深化点。</p>
          </div>
          <div class="action-area">
            <button class="run-btn primary" @click="runContentBoost" :disabled="loading">
              <span>🚀</span> 开始内容增强分析
            </button>
          </div>

          <!-- 结果展示 -->
          <div v-if="contentBoostResult" class="result-section">
            <div class="result-header">
              <span>📝 内容增强建议</span>
              <button class="dismiss-btn" @click="contentBoostResult = null">✕</button>
            </div>

            <div v-if="contentBoostResult.missing_topics?.length > 0" class="result-block">
              <div class="block-title">🎯 建议添加的遗漏主题</div>
              <div class="block-list">
                <div v-for="(topic, i) in contentBoostResult.missing_topics" :key="i" class="list-item">
                  <span class="item-bullet">•</span>
                  <span>{{ topic }}</span>
                </div>
              </div>
            </div>

            <div v-if="contentBoostResult.strengthened_points?.length > 0" class="result-block">
              <div class="block-title">📈 可以深化的论点</div>
              <div class="block-list">
                <div v-for="(point, i) in contentBoostResult.strengthened_points" :key="i" class="list-item">
                  <span class="item-bullet">•</span>
                  <span>{{ point }}</span>
                </div>
              </div>
            </div>

            <div v-if="contentBoostResult.suggested_additions?.length > 0" class="result-block">
              <div class="block-title">➕ 建议添加的内容</div>
              <div v-for="(add, i) in contentBoostResult.suggested_additions" :key="i" class="suggestion-card">
                <div class="suggestion-slide-badge">第 {{ add.slide_index + 1 }} 页</div>
                <div class="suggestion-text">
                  <div class="suggestion-type">{{ add.suggestion_type }}</div>
                  <div class="suggestion-content">{{ add.suggestion }}</div>
                  <div class="suggestion-reason">理由: {{ add.reason }}</div>
                </div>
                <button class="apply-chip" @click="applyAddition(add)">+ 添加</button>
              </div>
            </div>

            <div v-if="contentBoostResult.summary" class="result-summary">
              {{ contentBoostResult.summary }}
            </div>
          </div>
        </div>

        <!-- 引用查找 -->
        <div v-if="!loading && activeTab === 'citations'" class="tab-content">
          <div class="feature-intro">
            <p>AI 自动识别 PPT 中需要引用的声明，并提供可靠的来源建议。</p>
          </div>
          <div class="action-area">
            <button class="run-btn primary" @click="runCitationFinder" :disabled="loading">
              <span>📚</span> 查找需要引用的声明
            </button>
          </div>

          <div v-if="citationResult" class="result-section">
            <div class="result-header">
              <span>📚 引用建议</span>
              <button class="dismiss-btn" @click="citationResult = null">✕</button>
            </div>

            <div v-if="citationResult.citations?.length > 0" class="result-block">
              <div class="block-title">🔍 需要引用的声明</div>
              <div v-for="(cit, i) in citationResult.citations" :key="i" class="citation-card">
                <div class="citation-claim">"{{ cit.claim }}"</div>
                <div class="citation-meta">
                  <span class="slide-badge">第 {{ cit.slide_index + 1 }} 页</span>
                  <span class="confidence-badge" :class="cit.confidence">{{ cit.confidence }}</span>
                </div>
                <div class="citation-source">
                  <strong>建议来源:</strong> {{ cit.suggested_source }}
                </div>
                <div class="citation-keywords">
                  <span v-for="kw in cit.source_keywords" :key="kw" class="keyword-chip">{{ kw }}</span>
                </div>
              </div>
            </div>

            <div v-if="citationResult.general_sources?.length > 0" class="result-block">
              <div class="block-title">🌐 通用来源推荐</div>
              <div v-for="(src, i) in citationResult.general_sources" :key="i" class="source-card">
                <div class="source-name">{{ src.source_name }}</div>
                <div class="source-desc">{{ src.description }}</div>
                <div class="source-type">{{ src.source_type }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 图片建议 -->
        <div v-if="!loading && activeTab === 'images'" class="tab-content">
          <div class="feature-intro">
            <p>AI 根据每页内容，推荐最合适的配图类型和搜索关键词。</p>
          </div>
          <div class="action-area">
            <button class="run-btn primary" @click="runImageSuggestions" :disabled="loading">
              <span>🖼️</span> 生成配图建议
            </button>
          </div>

          <div v-if="imageResult" class="result-section">
            <div class="result-header">
              <span>🖼️ 图片建议</span>
              <button class="dismiss-btn" @click="imageResult = null">✕</button>
            </div>

            <div v-if="imageResult.image_suggestions?.length > 0" class="result-block">
              <div v-for="(img, i) in imageResult.image_suggestions" :key="i" class="image-card">
                <div class="image-card-header">
                  <span class="slide-badge">第 {{ img.slide_index + 1 }} 页</span>
                  <span class="image-type-badge">{{ img.image_type }}</span>
                </div>
                <div class="image-desc">{{ img.description }}</div>
                <div class="image-keywords">
                  <span class="keywords-label">搜索关键词:</span>
                  <span v-for="kw in img.search_keywords" :key="kw" class="keyword-chip">{{ kw }}</span>
                </div>
                <div class="image-style">{{ img.style_hint }}</div>
              </div>
            </div>

            <div v-if="imageResult.overall_image_strategy" class="result-summary">
              {{ imageResult.overall_image_strategy }}
            </div>
          </div>
        </div>

        <!-- 引用语建议 -->
        <div v-if="!loading && activeTab === 'quotes'" class="tab-content">
          <div class="feature-intro">
            <p>AI 根据 PPT 主题和内容，推荐最合适的引用语。</p>
          </div>
          <div class="action-area">
            <button class="run-btn primary" @click="runQuoteSuggestions" :disabled="loading">
              <span>💬</span> 生成引用语建议
            </button>
          </div>

          <div v-if="quoteResult" class="result-section">
            <div class="result-header">
              <span>💬 引用语建议</span>
              <button class="dismiss-btn" @click="quoteResult = null">✕</button>
            </div>

            <div v-if="quoteResult.quote_suggestions?.length > 0" class="result-block">
              <div v-for="(q, i) in quoteResult.quote_suggestions" :key="i" class="quote-card">
                <div class="quote-header">
                  <span class="slide-badge">第 {{ q.slide_index + 1 }} 页</span>
                  <span class="placement-badge">{{ q.placement }}</span>
                </div>
                <blockquote class="quote-text">"{{ q.quote }}"</blockquote>
                <div class="quote-author">— {{ q.author }}, {{ q.source }}</div>
                <div v-if="q.translation_if_needed" class="quote-translation">
                  {{ q.translation_if_needed }}
                </div>
                <div class="quote-relevance">{{ q.relevance }}</div>
              </div>
            </div>

            <div v-if="quoteResult.quote_themes?.length > 0" class="result-block">
              <div class="block-title">📌 引用主题</div>
              <div class="themes-row">
                <span v-for="theme in quoteResult.quote_themes" :key="theme" class="theme-chip">{{ theme }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 相关演示文稿 -->
        <div v-if="!loading && activeTab === 'related'" class="tab-content">
          <div class="feature-intro">
            <p>AI 分析当前 PPT，推荐相关的演示文稿方向。</p>
          </div>
          <div class="action-area">
            <button class="run-btn primary" @click="runRelatedPresentations" :disabled="loading">
              <span>🔗</span> 发现相关演示文稿
            </button>
          </div>

          <div v-if="relatedResult" class="result-section">
            <div class="result-header">
              <span>🔗 相关演示文稿</span>
              <button class="dismiss-btn" @click="relatedResult = null">✕</button>
            </div>

            <div v-if="relatedResult.related_presentations?.length > 0" class="result-block">
              <div v-for="(rp, i) in relatedResult.related_presentations" :key="i" class="related-card">
                <div class="related-header">
                  <span class="related-title">{{ rp.title }}</span>
                  <span class="link-type-badge">{{ rp.link_type }}</span>
                </div>
                <div class="related-desc">{{ rp.description }}</div>
                <div class="related-meta">
                  <span class="meta-item">👥 {{ rp.target_audience }}</span>
                  <span class="meta-item">📄 {{ rp.suggested_pages }}</span>
                </div>
                <div class="related-relationship">{{ rp.relationship }}</div>
              </div>
            </div>

            <div v-if="relatedResult.related_topics?.length > 0" class="result-block">
              <div class="block-title">🗂️ 相关主题</div>
              <div class="themes-row">
                <span v-for="topic in relatedResult.related_topics" :key="topic" class="theme-chip">{{ topic }}</span>
              </div>
            </div>

            <div v-if="relatedResult.audience_expansion?.length > 0" class="result-block">
              <div class="block-title">👥 可拓展受众</div>
              <div class="themes-row">
                <span v-for="aud in relatedResult.audience_expansion" :key="aud" class="theme-chip audience">{{ aud }}</span>
              </div>
            </div>

            <div v-if="relatedResult.summary" class="result-summary">
              {{ relatedResult.summary }}
            </div>
          </div>
        </div>
      </div>

      <div class="panel-footer">
        <button class="btn btn-outline" @click="closePanel">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import api from '../api/client'

const props = defineProps<{
  show: boolean
  slides?: any[]
  currentSlideIndex?: number
  taskId?: string
  topic?: string
  style?: string
  scene?: string
  pageCount?: number
}>()

const emit = defineEmits(['close', 'apply-addition'])

const loading = ref(false)
const loadingText = ref('')
const activeTab = ref('content-boost')

const contentBoostResult = ref<any>(null)
const citationResult = ref<any>(null)
const imageResult = ref<any>(null)
const quoteResult = ref<any>(null)
const relatedResult = ref<any>(null)

const tabs = [
  { id: 'content-boost', label: '内容增强', icon: '✨' },
  { id: 'citations', label: '引用查找', icon: '📚' },
  { id: 'images', label: '图片建议', icon: '🖼️' },
  { id: 'quotes', label: '引用语', icon: '💬' },
  { id: 'related', label: '相关演示', icon: '🔗' },
]

const closePanel = () => {
  emit('close')
}

// ============ 1. Content Boost ============
const runContentBoost = async () => {
  if (!props.slides || props.slides.length === 0) return
  loading.value = true
  loadingText.value = '分析内容中...'
  try {
    const res = await api.post('/ppt/suggest/content-boost', {
      topic: props.topic || 'PPT演示',
      slides: props.slides,
      style: props.style || 'professional',
      scene: props.scene || 'business'
    })
    if (res.data.success) {
      contentBoostResult.value = res.data.data
    } else {
      alert('内容增强分析失败')
    }
  } catch (e: any) {
    console.error('Content boost error:', e)
    alert('内容增强分析失败: ' + (e.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

const applyAddition = (addition: any) => {
  emit('apply-addition', addition)
  contentBoostResult.value = null
}

// ============ 2. Citation Finder ============
const runCitationFinder = async () => {
  if (!props.slides || props.slides.length === 0) return
  loading.value = true
  loadingText.value = '查找引用中...'
  try {
    const res = await api.post('/ppt/suggest/citations', {
      topic: props.topic || 'PPT演示',
      slides: props.slides
    })
    if (res.data.success) {
      citationResult.value = res.data.data
    } else {
      alert('引用查找失败')
    }
  } catch (e: any) {
    console.error('Citation finder error:', e)
    alert('引用查找失败: ' + (e.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

// ============ 3. Image Suggestions ============
const runImageSuggestions = async () => {
  if (!props.slides || props.slides.length === 0) return
  loading.value = true
  loadingText.value = '生成配图建议中...'
  try {
    const res = await api.post('/ppt/suggest/images', {
      topic: props.topic || 'PPT演示',
      slides: props.slides
    })
    if (res.data.success) {
      imageResult.value = res.data.data
    } else {
      alert('图片建议生成失败')
    }
  } catch (e: any) {
    console.error('Image suggestions error:', e)
    alert('图片建议生成失败: ' + (e.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

// ============ 4. Quote Suggestions ============
const runQuoteSuggestions = async () => {
  if (!props.slides || props.slides.length === 0) return
  loading.value = true
  loadingText.value = '生成引用语中...'
  try {
    const res = await api.post('/ppt/suggest/quotes', {
      topic: props.topic || 'PPT演示',
      slides: props.slides,
      style: props.style || 'professional',
      scene: props.scene || 'business'
    })
    if (res.data.success) {
      quoteResult.value = res.data.data
    } else {
      alert('引用语生成失败')
    }
  } catch (e: any) {
    console.error('Quote suggestions error:', e)
    alert('引用语生成失败: ' + (e.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

// ============ 5. Related Presentations ============
const runRelatedPresentations = async () => {
  if (!props.slides || props.slides.length === 0) return
  loading.value = true
  loadingText.value = '发现相关演示中...'
  try {
    const res = await api.post('/ppt/suggest/related', {
      topic: props.topic || 'PPT演示',
      slides: props.slides,
      style: props.style || 'professional',
      scene: props.scene || 'business',
      page_count: props.pageCount || props.slides.length
    })
    if (res.data.success) {
      relatedResult.value = res.data.data
    } else {
      alert('相关演示发现失败')
    }
  } catch (e: any) {
    console.error('Related presentations error:', e)
    alert('相关演示发现失败: ' + (e.message || '未知错误'))
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.smart-content-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.smart-content-panel {
  background: #fff;
  border-radius: 16px;
  width: 680px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.panel-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px 24px;
  position: relative;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-icon {
  font-size: 24px;
}

.header-title h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}

.header-subtitle {
  margin-top: 4px;
  font-size: 13px;
  opacity: 0.9;
}

.panel-close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(255,255,255,0.2);
  border: none;
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  gap: 12px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e0e0e0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Tabs */
.tabs-nav {
  display: flex;
  gap: 4px;
  margin-bottom: 20px;
  background: #f5f5f5;
  border-radius: 10px;
  padding: 4px;
}

.tab-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 4px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn.active {
  background: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.tab-icon {
  font-size: 18px;
}

.tab-label {
  font-size: 11px;
  font-weight: 600;
  color: #666;
}

.tab-btn.active .tab-label {
  color: #667eea;
}

/* Feature Intro */
.feature-intro {
  background: #f8f9ff;
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 16px;
}

.feature-intro p {
  margin: 0;
  font-size: 13px;
  color: #555;
  line-height: 1.6;
}

/* Action Area */
.action-area {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.run-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.run-btn.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.run-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Result Sections */
.result-section {
  border-top: 1px solid #eee;
  padding-top: 16px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.dismiss-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  color: #999;
}

.result-block {
  margin-bottom: 16px;
}

.block-title {
  font-size: 13px;
  font-weight: 600;
  color: #555;
  margin-bottom: 10px;
}

.block-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.list-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  color: #444;
}

.item-bullet {
  color: #667eea;
  font-weight: 700;
}

.result-summary {
  background: #f0f4ff;
  border-radius: 8px;
  padding: 12px;
  font-size: 13px;
  color: #555;
  line-height: 1.6;
}

/* Suggestion Cards */
.suggestion-card {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.suggestion-slide-badge {
  background: #667eea;
  color: white;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 12px;
  white-space: nowrap;
}

.suggestion-text {
  flex: 1;
}

.suggestion-type {
  font-size: 11px;
  color: #888;
  text-transform: uppercase;
}

.suggestion-content {
  font-size: 13px;
  color: #333;
  margin: 2px 0;
}

.suggestion-reason {
  font-size: 11px;
  color: #888;
}

.apply-chip {
  background: #667eea;
  color: white;
  border: none;
  border-radius: 14px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
}

/* Citation Cards */
.citation-card {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 10px;
}

.citation-claim {
  font-size: 14px;
  color: #333;
  font-style: italic;
  margin-bottom: 8px;
}

.citation-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.slide-badge {
  background: #667eea;
  color: white;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 12px;
}

.confidence-badge {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 12px;
  text-transform: uppercase;
}

.confidence-badge.high {
  background: #d4edda;
  color: #155724;
}

.confidence-badge.medium {
  background: #fff3cd;
  color: #856404;
}

.confidence-badge.low {
  background: #f8d7da;
  color: #721c24;
}

.citation-source {
  font-size: 12px;
  color: #555;
  margin-bottom: 6px;
}

.citation-keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

/* Source Cards */
.source-card {
  background: #f8f9ff;
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 8px;
}

.source-name {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.source-desc {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
}

.source-type {
  font-size: 11px;
  color: #888;
  margin-top: 4px;
}

/* Image Cards */
.image-card {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 10px;
}

.image-card-header {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.image-type-badge {
  background: #e8f0fe;
  color: #1a73e8;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 12px;
}

.image-desc {
  font-size: 13px;
  color: #333;
  margin-bottom: 8px;
}

.image-keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  margin-bottom: 6px;
}

.keywords-label {
  font-size: 11px;
  color: #888;
}

.image-style {
  font-size: 11px;
  color: #888;
  font-style: italic;
}

/* Quote Cards */
.quote-card {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 10px;
}

.quote-header {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.placement-badge {
  background: #f3e8ff;
  color: #7c3aed;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 12px;
}

.quote-text {
  font-size: 14px;
  color: #333;
  margin: 0 0 8px 0;
  border-left: 3px solid #667eea;
  padding-left: 12px;
  line-height: 1.6;
}

.quote-author {
  font-size: 12px;
  color: #666;
  margin-bottom: 6px;
}

.quote-translation {
  font-size: 12px;
  color: #888;
  font-style: italic;
  margin-bottom: 6px;
}

.quote-relevance {
  font-size: 11px;
  color: #888;
}

/* Related Cards */
.related-card {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 10px;
}

.related-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.related-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.link-type-badge {
  background: #e8f5e9;
  color: #2e7d32;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 12px;
}

.related-desc {
  font-size: 13px;
  color: #555;
  margin-bottom: 8px;
}

.related-meta {
  display: flex;
  gap: 12px;
  margin-bottom: 6px;
}

.meta-item {
  font-size: 12px;
  color: #666;
}

.related-relationship {
  font-size: 11px;
  color: #888;
}

/* Keywords / Chips */
.keyword-chip {
  background: #f0f0f0;
  color: #555;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
}

.theme-chip {
  background: #e8f0fe;
  color: #1a73e8;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 14px;
}

.theme-chip.audience {
  background: #fce8e6;
  color: #c5221f;
}

.themes-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

/* Panel Footer */
.panel-footer {
  padding: 14px 24px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
}

.btn {
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-outline {
  background: white;
  border: 1px solid #ddd;
  color: #555;
}

.btn-outline:hover {
  background: #f5f5f5;
}
</style>
