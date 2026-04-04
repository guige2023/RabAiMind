<template>
  <div class="template-selector">
    <!-- R63: Quick-Start Templates Section -->
    <div class="quick-start-section">
      <div class="qs-header">
        <span class="qs-icon">⚡</span>
        <span class="qs-title">快速开始</span>
        <span class="qs-hint">选择场景，快速生成</span>
      </div>
      <div class="qs-buttons">
        <button
          v-for="qs in quickStartOptions"
          :key="qs.id"
          class="qs-btn"
          :class="{ active: activeQuickStart === qs.id }"
          @click="selectQuickStart(qs)"
        >
          <span class="qs-btn-icon">{{ qs.icon }}</span>
          <span class="qs-btn-name">{{ qs.name }}</span>
        </button>
      </div>
    </div>

    <!-- R35: 内容匹配推荐 -->
    <div v-if="contentMatchedTemplates.length > 0" class="content-matched-section">
      <div class="matched-header">
        <span class="matched-icon">✨</span>
        <span class="matched-title">AI 智能匹配</span>
        <span class="matched-tags" v-if="detectedScene || detectedStyle">
          <span v-if="detectedScene" class="matched-tag scene-tag">{{ detectedScene }}</span>
          <span v-if="detectedStyle" class="matched-tag style-tag">{{ detectedStyle }}</span>
        </span>
      </div>
      <div class="matched-grid">
        <div
          v-for="tpl in contentMatchedTemplates"
          :key="tpl.id"
          class="template-card"
          :class="{ selected: selectedTemplate?.id === tpl.id }"
          @click="selectTemplateById(tpl)"
        >
          <div class="card-preview" :style="{ background: getMatchedBackground(tpl) }">
            <div class="preview-content">
              <span class="preview-title">{{ tpl.name }}</span>
            </div>
          </div>
          <div class="card-info">
            <div class="info-header">
              <h4 class="card-title">{{ tpl.name }}</h4>
            </div>
            <p class="card-scene">{{ tpl.description || tpl.category }}</p>
          </div>
          <div v-if="selectedTemplate?.id === tpl.id" class="check-mark">✓</div>
        </div>
      </div>
    </div>

    <!-- 分类标签 -->
    <div class="category-tabs">
      <button
        v-for="cat in categories"
        :key="cat.id"
        class="tab-btn"
        :class="{ active: activeCategory === cat.id }"
        @click="activeCategory = cat.id"
      >
        {{ cat.icon }} {{ cat.name }}
      </button>
    </div>

    <!-- 模板网格 -->
    <!-- 空状态 -->
    <div v-if="filteredTemplates.length === 0" class="empty-state">
      <div class="empty-illustration">
        <svg viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- 背景圆 -->
          <circle cx="120" cy="100" r="80" fill="#F0F5FF" />
          <circle cx="120" cy="100" r="60" fill="#E8EEFF" />
          <!-- 空白文档 -->
          <rect x="90" y="60" width="60" height="80" rx="6" fill="white" stroke="#D0D7E8" stroke-width="2"/>
          <rect x="98" y="75" width="44" height="4" rx="2" fill="#E0E7FF"/>
          <rect x="98" y="85" width="30" height="4" rx="2" fill="#E0E7FF"/>
          <rect x="98" y="95" width="38" height="4" rx="2" fill="#E0E7FF"/>
          <rect x="98" y="105" width="25" height="4" rx="2" fill="#E0E7FF"/>
          <!-- 放大镜 -->
          <circle cx="140" cy="130" r="20" fill="#165DFF" opacity="0.15"/>
          <circle cx="140" cy="130" r="14" fill="white" stroke="#165DFF" stroke-width="2"/>
          <line x1="150" y1="140" x2="160" y2="150" stroke="#165DFF" stroke-width="2.5" stroke-linecap="round"/>
          <!-- 装饰点 -->
          <circle cx="70" cy="70" r="4" fill="#165DFF" opacity="0.3"/>
          <circle cx="170" cy="85" r="3" fill="#52C41A" opacity="0.4"/>
          <circle cx="60" cy="120" r="3" fill="#FAAD14" opacity="0.4"/>
        </svg>
      </div>
      <h3 class="empty-title">暂无模板</h3>
      <p class="empty-desc">该分类下还没有模板，试试其他分类吧</p>
      <button class="btn btn-outline empty-action" @click="activeCategory = 'all'">
        查看全部模板
      </button>
    </div>

    <!-- 模板网格 -->
      <div
        v-for="template in filteredTemplates"
        :key="template.id"
        class="template-card"
        :class="{ selected: selectedTemplate?.id === template.id }"
        @click="selectTemplate(template)"
      >
        <!-- 预览缩略图 -->
        <div class="card-preview" :style="getPreviewStyle(template)" @click.stop="openPreview(template)">
          <div class="preview-content">
            <span class="preview-title">{{ template.name }}</span>
          </div>
          <!-- 标签 -->
          <div class="card-labels">
            <span v-if="template.isPremium" class="label-premium">💎 {{ template.price }}</span>
            <span v-if="template.isCustom" class="label-custom">🎨 自定义</span>
          </div>
        </div>

        <!-- 模板信息 -->
        <div class="card-info">
          <div class="info-header">
            <h4 class="card-title">{{ template.name }}</h4>
            <span class="page-count">{{ template.pageCount }}页</span>
          </div>
          <p class="card-scene">{{ template.scene }}</p>
          <div class="style-tags">
            <span v-for="style in template.styles" :key="style" class="style-tag">{{ style }}</span>
          </div>
        </div>

        <!-- 选中标记 -->
        <div v-if="selectedTemplate?.id === template.id" class="check-mark">
          ✓
        </div>
      </div>
    </div>

    <!-- R55: Similar Presentations Section -->
    <div v-if="similarTemplates.length > 0" class="similar-section">
      <div class="similar-header">
        <span class="similar-icon">🔗</span>
        <span class="similar-title">相似模板推荐</span>
        <span class="similar-hint">用过这个模板的人还喜欢</span>
      </div>
      <div class="similar-grid">
        <div
          v-for="tpl in similarTemplates"
          :key="tpl.id"
          class="template-card similar-card"
          :class="{ selected: selectedTemplate?.id === tpl.id }"
          @click="selectTemplateById(tpl)"
        >
          <div class="card-preview" :style="{ background: getMatchedBackground(tpl) }">
            <div class="preview-content">
              <span class="preview-title">{{ tpl.name }}</span>
            </div>
          </div>
          <div class="card-info">
            <h4 class="card-title">{{ tpl.name }}</h4>
            <p class="card-scene">{{ tpl.description || tpl.category }}</p>
          </div>
          <div v-if="selectedTemplate?.id === tpl.id" class="check-mark">✓</div>
        </div>
      </div>
    </div>

    <!-- R55: User Layout Preferences Section -->
    <div v-if="userLayoutPreferences.length > 0" class="preferences-section">
      <div class="preferences-header">
        <span class="preferences-icon">🎯</span>
        <span class="preferences-title">你的布局偏好</span>
        <span class="preferences-hint">系统学习自你的使用习惯</span>
      </div>
      <div class="preferences-list">
        <div
          v-for="pref in userLayoutPreferences"
          :key="pref.layout_type"
          class="preference-item"
        >
          <span class="preference-layout">{{ getLayoutDisplayName(pref.layout_type) }}</span>
          <div class="preference-bar-container">
            <div
              class="preference-bar"
              :style="{ width: (pref.count / maxPreferenceCount * 100) + '%' }"
            ></div>
          </div>
          <span class="preference-count">{{ pref.count }}次</span>
        </div>
      </div>
    </div>

    <!-- 大预览弹窗 -->
    <Teleport to="body">
      <div v-if="previewTemplate" class="preview-modal" @click.self="closePreview">
        <div class="preview-container">
          <button class="modal-close" @click="closePreview">✕</button>

          <!-- 大预览 -->
          <div class="preview-large" :style="getPreviewStyle(previewTemplate)">
            <div class="preview-content large">
              <span class="preview-title">{{ previewTemplate.name }}</span>
              <span class="preview-subtitle">{{ previewTemplate.description }}</span>
            </div>
          </div>

          <!-- 详细信息 -->
          <div class="preview-details">
            <div class="detail-item">
              <span class="detail-label">场景</span>
              <span class="detail-value">{{ previewTemplate.scene }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">页数</span>
              <span class="detail-value">{{ previewTemplate.pageCount }}页</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">风格</span>
              <div class="style-tags">
                <span v-for="style in previewTemplate.styles" :key="style" class="style-tag">{{ style }}</span>
              </div>
            </div>
            <div v-if="previewTemplate.fontConfig" class="detail-item">
              <span class="detail-label">字体</span>
              <span class="detail-value">{{ getFontNames(previewTemplate.fontConfig) }}</span>
            </div>
          </div>

          <!-- 预览操作 -->
          <div class="preview-actions">
            <button class="btn btn-outline" @click="closePreview">取消</button>
            <button class="btn btn-primary" @click="confirmSelect">
              选择此模板
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { api } from '../api/client'

interface FontConfig {
  h1: { family: string; size: number; color: string }
  h2: { family: string; size: number; color: string }
  h3: { family: string; size: number; color: string }
  body: { family: string; size: number; color: string }
}

interface Template {
  id: string
  name: string
  description: string
  scene: string
  pageCount: number
  styles: string[]
  thumbnail?: string
  background: string
  category: string
  isPremium?: boolean
  price?: string
  isCustom?: boolean
  fontConfig?: FontConfig
  layout?: string
}

const props = defineProps<{
  userRequest?: string
  scene?: string
  style?: string
}>()

const emit = defineEmits(['select'])

const activeCategory = ref('all')
const activeQuickStart = ref<string | null>(null)

// R63: Quick-start template options
const quickStartOptions = [
  { id: 'product', name: '🚀 产品发布', icon: '🚀', scene: 'business', style: 'modern' },
  { id: 'annual', name: '📊 年度总结', icon: '📊', scene: 'business', style: 'professional' },
  { id: 'company', name: '🏢 公司介绍', icon: '🏢', scene: 'business', style: 'professional' },
  { id: 'business', name: '💼 商业计划', icon: '💼', scene: 'business', style: 'premium' },
  { id: 'education', name: '📚 教育培训', icon: '📚', scene: 'education', style: 'simple' },
  { id: 'data', name: '📈 数据分析', icon: '📈', scene: 'data', style: 'professional' },
  { id: 'marketing', name: '📢 营销推广', icon: '📢', scene: 'marketing', style: 'energetic' },
  { id: 'creative', name: '💡 创意展示', icon: '💡', scene: 'creative', style: 'creative' },
]

const selectQuickStart = (qs: typeof quickStartOptions[0]) => {
  activeQuickStart.value = qs.id
  // Filter templates by scene
  activeCategory.value = qs.scene
  // Emit selection with scene/style info for parent to handle
  emit('select-quickstart', { scene: qs.scene, style: qs.style })
}

// R35: Content-based matched templates
const contentMatchedTemplates = ref<any[]>([])
const detectedScene = ref<string | null>(null)
const detectedStyle = ref<string | null>(null)
const isMatchingContent = ref(false)

// Watch for userRequest changes and match templates
const matchTemplatesFromContent = async () => {
  if (!props.userRequest || props.userRequest.length < 5) {
    contentMatchedTemplates.value = []
    return
  }
  isMatchingContent.value = true
  try {
    const res = await api.template.matchTemplates({
      q: props.userRequest,
      scene: props.scene,
      style: props.style,
      limit: 4,
    })
    if (res.data?.success) {
      contentMatchedTemplates.value = res.data.templates || []
      detectedScene.value = res.data.detected_scene || null
      detectedStyle.value = res.data.detected_style || null
    }
  } catch (e) {
    console.warn('[TemplateSelector] 内容匹配失败:', e)
    contentMatchedTemplates.value = []
  } finally {
    isMatchingContent.value = false
  }
}

// Watch for changes in userRequest, scene, or style
import { watch } from 'vue'
watch(() => [props.userRequest, props.scene, props.style], () => {
  if (props.userRequest && props.userRequest.length >= 5) {
    matchTemplatesFromContent()
  } else {
    contentMatchedTemplates.value = []
  }
}, { immediate: true })

// R55: Similar Templates (from same-usage recommendations)
const similarTemplates = ref<any[]>([])
const isLoadingSimilar = ref(false)

const loadSimilarTemplates = async () => {
  if (!selectedTemplate.value?.id) return
  isLoadingSimilar.value = true
  try {
    const res = await api.template.getSimilar(selectedTemplate.value.id, 4)
    if (res.data?.success) {
      similarTemplates.value = res.data.templates || []
    }
  } catch (e) {
    similarTemplates.value = []
  } finally {
    isLoadingSimilar.value = false
  }
}

// Watch selected template to load similar
watch(selectedTemplate, (newVal) => {
  if (newVal?.id) {
    loadSimilarTemplates()
  }
})

// R55: User Layout Preferences (learned from usage)
interface LayoutPreference {
  layout_type: string
  count: number
  content_type?: string
}

const userLayoutPreferences = ref<LayoutPreference[]>([])
const maxPreferenceCount = ref(1)

const LAYOUT_DISPLAY_NAMES: Record<string, string> = {
  title_slide: '封面布局',
  content_card: '卡片布局',
  two_column: '双栏布局',
  center_radiation: '中心辐射',
  timeline: '时间线',
  data_visualization: '数据图表',
  quote: '金句布局',
  comparison: '对比布局',
  left_text_right_image: '左文右图',
  left_image_right_text: '左图右文',
  center: '居中布局',
}

const getLayoutDisplayName = (layoutType: string) => {
  return LAYOUT_DISPLAY_NAMES[layoutType] || layoutType
}

const loadUserPreferences = async () => {
  try {
    const res = await api.template.getLayoutPreferences({
      user_id: 'anonymous',
      limit: 5
    })
    if (res.data?.success) {
      userLayoutPreferences.value = res.data.preferences || []
      maxPreferenceCount.value = Math.max(
        ...userLayoutPreferences.value.map(p => p.count),
        1
      )
    }
  } catch (e) {
    userLayoutPreferences.value = []
  }
}

loadUserPreferences()

const selectedTemplate = ref<Template | null>(null)
const previewTemplate = ref<Template | null>(null)

const categories = [
  { id: 'all', name: '全部', icon: '📋' },
  { id: 'business', name: '商务', icon: '💼' },
  { id: 'education', name: '教育', icon: '📚' },
  { id: 'marketing', name: '营销', icon: '📢' },
  { id: 'creative', name: '创意', icon: '🎨' },
  { id: 'data', name: '数据', icon: '📊' },
  { id: 'social', name: '社交', icon: '🤝' }
]

// 模板数据 - 6大类
const templates = ref<Template[]>([
  // 商务类
  {
    id: 'biz1', name: '商务蓝', description: '专业简洁的商务风格', scene: '企业汇报/商务演示', pageCount: 10,
    styles: ['商务', '简洁', '专业'], background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%)',
    category: 'business', fontConfig: { h1: { family: '思源黑体', size: 56, color: '#ffffff' }, h2: { family: '思源黑体', size: 40, color: '#ffffff' }, h3: { family: '思源黑体', size: 28, color: '#e0e0e0' }, body: { family: '思源宋体', size: 18, color: '#cccccc' } }
  },
  {
    id: 'biz2', name: '商务金', description: '高端大气的金色商务风', scene: '高端展示/投资路演', pageCount: 15,
    styles: ['高端', '奢华', '金色'], background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    category: 'business', isPremium: true, price: '¥9.9',
    fontConfig: { h1: { family: '思源黑体', size: 56, color: '#ffd700' }, h2: { family: '思源黑体', size: 40, color: '#ffffff' }, h3: { family: '思源黑体', size: 28, color: '#d4af37' }, body: { family: '思源宋体', size: 18, color: '#c0c0c0' } }
  },
  {
    id: 'biz3', name: '深蓝商务', description: '稳重深沉的深蓝配色', scene: '年度总结/战略规划', pageCount: 12,
    styles: ['稳重', '专业', '深色'], background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
    category: 'business', fontConfig: { h1: { family: '思源黑体', size: 52, color: '#ffffff' }, h2: { family: '思源黑体', size: 38, color: '#ffffff' }, h3: { family: '思源黑体', size: 26, color: '#b0b0b0' }, body: { family: '思源宋体', size: 16, color: '#909090' } }
  },
  // 教育类
  {
    id: 'edu1', name: '学术蓝', description: '清新淡雅的学术风格', scene: '课件制作/学术报告', pageCount: 20,
    styles: ['学术', '清新', '简洁'], background: 'linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 50%, #80deea 100%)',
    category: 'education', fontConfig: { h1: { family: '思源黑体', size: 54, color: '#006064' }, h2: { family: '思源黑体', size: 38, color: '#00838f' }, h3: { family: '思源黑体', size: 26, color: '#0097a7' }, body: { family: '思源宋体', size: 18, color: '#006064' } }
  },
  {
    id: 'edu2', name: '校园绿', description: '充满活力的校园风格', scene: '校园活动/学生活动', pageCount: 8,
    styles: ['活力', '青春', '校园'], background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    category: 'education', fontConfig: { h1: { family: '思源黑体', size: 52, color: '#ffffff' }, h2: { family: '思源黑体', size: 38, color: '#f0fdf4' }, h3: { family: '思源黑体', size: 26, color: '#dcfce7' }, body: { family: '思源宋体', size: 18, color: '#bbf7d0' } }
  },
  {
    id: 'edu3', name: '书香', description: '古典雅致的书院风格', scene: '传统文化/文学分享', pageCount: 12,
    styles: ['古典', '雅致', '文化'], background: 'linear-gradient(135deg, #f5f5dc 0%, #faebd7 50%, #f0e68c 100%)',
    category: 'education', fontConfig: { h1: { family: '思源宋体', size: 52, color: '#5d4037' }, h2: { family: '思源宋体', size: 38, color: '#6d4c41' }, h3: { family: '思源宋体', size: 26, color: '#795548' }, body: { family: '思源宋体', size: 18, color: '#5d4037' } }
  },
  // 营销类
  {
    id: 'mkt1', name: '促销红', description: '充满活力的营销风格', scene: '产品促销/活动宣传', pageCount: 6,
    styles: ['促销', '活力', '热烈'], background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
    category: 'marketing', fontConfig: { h1: { family: '思源黑体', size: 56, color: '#ffffff' }, h2: { family: '思源黑体', size: 40, color: '#fff5f5' }, h3: { family: '思源黑体', size: 28, color: '#ffe0e0' }, body: { family: '思源宋体', size: 18, color: '#fff0f0' } }
  },
  {
    id: 'mkt2', name: '渐变橙', description: '温暖渐变的活力风格', scene: '品牌推广/新品发布', pageCount: 10,
    styles: ['品牌', '时尚', '渐变'], background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    category: 'marketing', fontConfig: { h1: { family: '思源黑体', size: 54, color: '#ffffff' }, h2: { family: '思源黑体', size: 38, color: '#fff5f5' }, h3: { family: '思源黑体', size: 26, color: '#ffe0e0' }, body: { family: '思源宋体', size: 18, color: '#fff0f0' } }
  },
  {
    id: 'mkt3', name: '电商紫', description: '时尚电商促销风格', scene: '电商活动/直播带货', pageCount: 8,
    styles: ['电商', '时尚', '促销'], background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    category: 'marketing', isPremium: true, price: '¥5.9',
    fontConfig: { h1: { family: '思源黑体', size: 56, color: '#ffffff' }, h2: { family: '思源黑体', size: 40, color: '#f3e8ff' }, h3: { family: '思源黑体', size: 28, color: '#e9d5ff' }, body: { family: '思源宋体', size: 18, color: '#ddc6ff' } }
  },
  // 创意类
  {
    id: 'cre1', name: '科技未来', description: '充满科技感的现代风格', scene: '科技展示/创新大赛', pageCount: 12,
    styles: ['科技', '未来', '现代'], background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
    category: 'creative', fontConfig: { h1: { family: '思源黑体', size: 56, color: '#00d4ff' }, h2: { family: '思源黑体', size: 40, color: '#ffffff' }, h3: { family: '思源黑体', size: 28, color: '#b0b0b0' }, body: { family: '思源宋体', size: 18, color: '#909090' } }
  },
  {
    id: 'cre2', name: '霓虹灯', description: '赛博朋克霓虹风格', scene: '创意展示/潮流活动', pageCount: 10,
    styles: ['潮流', '赛博', '霓虹'], background: 'linear-gradient(135deg, #0d0d0d 0%, #1a1a2e 50%, #16213e 100%)',
    category: 'creative', fontConfig: { h1: { family: '思源黑体', size: 56, color: '#ff00ff' }, h2: { family: '思源黑体', size: 40, color: '#00ffff' }, h3: { family: '思源黑体', size: 28, color: '#ffff00' }, body: { family: '思源宋体', size: 18, color: '#e0e0e0' } }
  },
  {
    id: 'cre3', name: '水彩', description: '艺术感水彩风格', scene: '艺术展示/个人作品', pageCount: 15,
    styles: ['艺术', '水彩', '唯美'], background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
    category: 'creative', fontConfig: { h1: { family: '思源黑体', size: 52, color: '#5a3f5a' }, h2: { family: '思源黑体', size: 38, color: '#6a4f6a' }, h3: { family: '思源黑体', size: 26, color: '#7a5f7a' }, body: { family: '思源宋体', size: 18, color: '#8a6f8a' } }
  },
  // 数据类
  {
    id: 'data1', name: '数据蓝', description: '专业数据分析风格', scene: '数据分析/报告展示', pageCount: 15,
    styles: ['数据', '专业', '图表'], background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
    category: 'data', fontConfig: { h1: { family: '思源黑体', size: 54, color: '#ffffff' }, h2: { family: '思源黑体', size: 38, color: '#e0e7ff' }, h3: { family: '思源黑体', size: 26, color: '#c7d2fe' }, body: { family: '思源宋体', size: 16, color: '#a5b4fc' } }
  },
  {
    id: 'data2', name: '清新绿', description: '自然清新的绿色主题', scene: '环保报告/可持续发展', pageCount: 10,
    styles: ['自然', '环保', '绿色'], background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    category: 'data', fontConfig: { h1: { family: '思源黑体', size: 52, color: '#ffffff' }, h2: { family: '思源黑体', size: 38, color: '#f0fdf4' }, h3: { family: '思源黑体', size: 26, color: '#dcfce7' }, body: { family: '思源宋体', size: 18, color: '#bbf7d0' } }
  },
  {
    id: 'data3', name: '暗色数据', description: '高端暗色数据风格', scene: '大数据展示/科技公司', pageCount: 20,
    styles: ['高端', '暗色', '科技'], background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
    category: 'data', isPremium: true, price: '¥12.9',
    fontConfig: { h1: { family: '思源黑体', size: 56, color: '#00d4ff' }, h2: { family: '思源黑体', size: 40, color: '#ffffff' }, h3: { family: '思源黑体', size: 28, color: '#b0b0b0' }, body: { family: '思源宋体', size: 18, color: '#909090' } }
  },
  // 社交类
  {
    id: 'soc1', name: '温暖橙', description: '温馨友爱的社交风格', scene: '团队活动/聚会分享', pageCount: 8,
    styles: ['温馨', '友爱', '温暖'], background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    category: 'social', fontConfig: { h1: { family: '思源黑体', size: 54, color: '#ffffff' }, h2: { family: '思源黑体', size: 38, color: '#fffbeb' }, h3: { family: '思源黑体', size: 26, color: '#fef3c7' }, body: { family: '思源宋体', size: 18, color: '#fde68a' } }
  },
  {
    id: 'soc2', name: '粉色系', description: '甜美温柔的粉色风格', scene: '婚礼/生日/纪念日', pageCount: 10,
    styles: ['甜美', '浪漫', '温馨'], background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    category: 'social', fontConfig: { h1: { family: '思源黑体', size: 52, color: '#be185d' }, h2: { family: '思源黑体', size: 38, color: '#db2777' }, h3: { family: '思源黑体', size: 26, color: '#ec4899' }, body: { family: '思源宋体', size: 18, color: '#f472b6' } }
  },
  {
    id: 'soc3', name: '商务社交', description: '专业友好的社交风格', scene: '商务社交/名片展示', pageCount: 6,
    styles: ['专业', '友好', '商务'], background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    category: 'social', fontConfig: { h1: { family: '思源黑体', size: 56, color: '#ffffff' }, h2: { family: '思源黑体', size: 40, color: '#f3e8ff' }, h3: { family: '思源黑体', size: 28, color: '#e9d5ff' }, body: { family: '思源宋体', size: 18, color: '#ddc6ff' } }
  }
])

const filteredTemplates = computed(() => {
  if (activeCategory.value === 'all') {
    return templates.value
  }
  return templates.value.filter(t => t.category === activeCategory.value)
})

const getPreviewStyle = (template: Template) => ({
  background: template.background
})

// R35: Select a template from content-matched results
const selectTemplateById = (tpl: any) => {
  const matchedTemplate: Template = {
    id: tpl.id,
    name: tpl.name,
    description: tpl.description || '',
    scene: tpl.category || 'business',
    pageCount: 8,
    styles: [tpl.style || 'professional'],
    thumbnail: tpl.thumbnail || '',
    background: getMatchedBackground(tpl),
    category: tpl.category || 'business',
    isPremium: false,
    fontConfig: undefined,
  }
  selectedTemplate.value = matchedTemplate
  emit('select', matchedTemplate)
}

// R35: Get background for content-matched template
const getMatchedBackground = (tpl: any): string => {
  // Map category to gradient
  const gradients: Record<string, string> = {
    business: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%)',
    education: 'linear-gradient(135deg, #e0f7fa 0%, #80deea 100%)',
    tech: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
    creative: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    marketing: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    data: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
    social: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    government: 'linear-gradient(135deg, #003366 0%, #006699 100%)',
  }
  return gradients[tpl.category] || gradients.business
}

const getFontNames = (fontConfig: FontConfig) => {
  return `${fontConfig.h1.family} / ${fontConfig.body.family}`
}

const selectTemplate = (template: Template) => {
  selectedTemplate.value = template
  emit('select', template)
}

const openPreview = (template: Template) => {
  previewTemplate.value = template
}

const closePreview = () => {
  previewTemplate.value = null
}

const confirmSelect = () => {
  if (previewTemplate.value) {
    selectTemplate(previewTemplate.value)
    closePreview()
  }
}
</script>

<style scoped>
/* R63: Quick-Start Templates Section */
.quick-start-section {
  background: linear-gradient(135deg, #fff8f0 0%, #fff0f5 100%);
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 20px;
  border: 1px solid #ffe0b2;
}

:global(.dark) .quick-start-section {
  background: linear-gradient(135deg, #2a1f1a 0%, #2a1a20 100%);
  border-color: #5a3a2a;
}

.qs-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.qs-icon {
  font-size: 18px;
}

.qs-title {
  font-size: 14px;
  font-weight: 600;
  color: #e65100;
}

:global(.dark) .qs-title {
  color: #ffb74d;
}

.qs-hint {
  font-size: 12px;
  color: #999;
  margin-left: auto;
}

.qs-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.qs-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: white;
  border: 2px solid transparent;
  border-radius: 20px;
  cursor: pointer;
  font-size: 13px;
  color: #333;
  transition: all 0.2s;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}

:global(.dark) .qs-btn {
  background: #2a2a2a;
  color: #ddd;
}

.qs-btn:hover {
  border-color: #ff9800;
  background: #fff3e0;
}

:global(.dark) .qs-btn:hover {
  background: #3a2a1a;
}

.qs-btn.active {
  background: linear-gradient(135deg, #ff9800, #ff6d00);
  border-color: #ff6d00;
  color: white;
  box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);
}

.qs-btn-icon {
  font-size: 14px;
}

.qs-btn-name {
  font-weight: 500;
}

/* R35: Content Matched Section */
.content-matched-section {
  background: linear-gradient(135deg, #f0f5ff 0%, #e8f0fe 100%);
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 20px;
  border: 1px solid #d0e0ff;
}

.matched-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.matched-icon {
  font-size: 16px;
}

.matched-title {
  font-size: 14px;
  font-weight: 600;
  color: #165DFF;
}

.matched-tags {
  display: flex;
  gap: 6px;
  margin-left: auto;
}

.matched-tag {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
}

.scene-tag {
  background: #e6f0ff;
  color: #165DFF;
}

.style-tag {
  background: #fff3e0;
  color: #ff9800;
}

.matched-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.matched-grid .template-card {
  border: 2px solid transparent;
  transition: all 0.2s;
}

.matched-grid .template-card:hover {
  border-color: #165DFF;
}

.matched-grid .template-card.selected {
  border-color: #165DFF;
  box-shadow: 0 4px 12px rgba(22, 93, 255, 0.3);
}

.matched-grid .card-preview {
  height: 80px;
}

.matched-grid .card-info {
  padding: 8px;
}

.matched-grid .card-title {
  font-size: 13px;
  margin: 0;
}

.matched-grid .card-scene {
  font-size: 11px;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.template-selector {
  padding: 20px;
}

.category-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.tab-btn {
  padding: 10px 20px;
  background: #f5f5f5;
  border: 2px solid transparent;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  background: #e5e5e5;
}

.tab-btn.active {
  background: #165DFF;
  color: white;
  border-color: #165DFF;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}

.template-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid #e5e5e5;
  position: relative;
}

.template-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.template-card.selected {
  border-color: #165DFF;
  box-shadow: 0 4px 16px rgba(22, 93, 255, 0.25);
}

.card-preview {
  height: 160px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.preview-content {
  text-align: center;
  padding: 20px;
}

.preview-title {
  font-size: 24px;
  font-weight: bold;
  color: white;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.preview-content.large .preview-title {
  font-size: 36px;
}

.preview-subtitle {
  display: block;
  font-size: 14px;
  color: rgba(255,255,255,0.8);
  margin-top: 8px;
}

.card-labels {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 6px;
}

.label-premium {
  background: linear-gradient(135deg, #ffd700, #ffb700);
  color: #1a1a1a;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.label-custom {
  background: linear-gradient(135deg, #8b5cf6, #a78bfa);
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.card-info {
  padding: 16px;
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.card-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}

.page-count {
  font-size: 12px;
  color: #165DFF;
  background: #EEF2FF;
  padding: 2px 8px;
  border-radius: 10px;
}

.card-scene {
  margin: 0 0 10px;
  font-size: 13px;
  color: #666;
}

.style-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.style-tag {
  background: #f0f0f0;
  color: #666;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
}

.check-mark {
  position: absolute;
  top: 8px;
  left: 8px;
  width: 28px;
  height: 28px;
  background: #165DFF;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

/* 预览弹窗 */
.preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.preview-container {
  background: white;
  border-radius: 16px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  position: relative;
}

.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 40px;
  height: 40px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 18px;
  cursor: pointer;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  background: rgba(0, 0, 0, 0.7);
}

.preview-large {
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-details {
  padding: 20px 30px;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  border-bottom: 1px solid #e5e5e5;
}

.detail-item {
  min-width: 150px;
}

.detail-label {
  display: block;
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.detail-value {
  font-size: 14px;
  color: #333;
}

.preview-actions {
  padding: 20px 30px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn {
  padding: 12px 28px;
  border-radius: 8px;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-outline {
  background: white;
  border: 1px solid #e5e5e5;
  color: #333;
}

.btn-outline:hover {
  background: #f5f5f5;
}

.btn-primary {
  background: #165DFF;
  border: none;
  color: white;
}

.btn-primary:hover {
  background: #0e42d2;
}

/* 移动端 */
@media (max-width: 768px) {
  .template-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .card-preview {
    height: 110px;
  }

  .preview-title {
    font-size: 18px;
  }

  .card-info {
    padding: 10px;
  }

  .card-title {
    font-size: 14px;
  }

  .card-scene, .style-tag {
    font-size: 11px;
  }

  .preview-modal {
    padding: 20px;
  }

  .preview-large {
    height: 250px;
  }

  .preview-details {
    flex-direction: column;
    gap: 12px;
  }
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-illustration {
  width: 240px;
  height: 200px;
  margin-bottom: 24px;
}

.empty-illustration svg {
  width: 100%;
  height: 100%;
}

.empty-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px;
}

.empty-desc {
  font-size: 14px;
  color: #666;
  margin: 0 0 24px;
}

.empty-action {
  padding: 10px 24px;
  font-size: 14px;
}
</style>
