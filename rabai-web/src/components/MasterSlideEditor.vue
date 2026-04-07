<template>
  <div class="master-slide-overlay" @click.self="closePanel">
    <div class="master-slide-panel">
      <!-- Header -->
      <div class="panel-header">
        <div class="header-title">
          <span class="title-icon">📐</span>
          <h3>母版幻灯片编辑器</h3>
        </div>
        <div class="header-subtitle">定义布局模板，子页自动继承</div>
        <button class="panel-close-btn" @click="closePanel">✕</button>
      </div>

      <!-- Tab Navigation -->
      <div class="panel-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="tab-btn"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          <span>{{ tab.label }}</span>
        </button>
      </div>

      <!-- Body -->
      <div class="panel-body">
        <!-- Tab: Master Slide List -->
        <div v-if="activeTab === 'list'" class="tab-content">
          <div class="section-header">
            <span class="section-title">📋 我的母版</span>
            <button class="btn-create" @click="createNewMaster">
              <span>+</span> 新建母版
            </button>
          </div>

          <!-- Empty state -->
          <div v-if="masterSlides.length === 0" class="empty-state">
            <div class="empty-icon">📐</div>
            <p>还没有母版</p>
            <p class="empty-hint">创建母版可以统一多页幻灯片的布局风格</p>
            <button class="btn-create-first" @click="createNewMaster">创建第一个母版</button>
          </div>

          <!-- Master slide cards -->
          <div v-else class="master-grid">
            <div
              v-for="master in masterSlides"
              :key="master.id"
              class="master-card"
              :class="{ active: selectedMasterId === master.id }"
              @click="selectMaster(master)"
            >
              <!-- Master preview -->
              <div class="master-preview" :style="masterPreviewStyle(master)">
                <div class="preview-layout-icon">
                  {{ master.layout_type === 'title' ? '📄' : master.layout_type === 'content' ? '📝' : '📊' }}
                </div>
                <div class="preview-master-name">{{ master.name }}</div>
              </div>
              <!-- Master info -->
              <div class="master-info">
                <div class="master-name-row">
                  <span class="master-name">{{ master.name }}</span>
                  <span class="master-badge">{{ master.layout_type }}</span>
                </div>
                <span class="master-desc">{{ master.description || '无描述' }}</span>
                <div class="master-meta">
                  <span>👶 {{ master.child_count || 0 }} 个子页面</span>
                  <span>{{ master.updated_at || master.created_at }}</span>
                </div>
              </div>
              <!-- Actions -->
              <div class="master-actions">
                <button class="action-btn edit" @click.stop="editMaster(master)" title="编辑">✏️</button>
                <button class="action-btn duplicate" @click.stop="duplicateMaster(master)" title="复制">📋</button>
                <button class="action-btn delete" @click.stop="deleteMaster(master.id)" title="删除">🗑️</button>
              </div>
            </div>
          </div>

          <!-- Apply to slides section -->
          <div v-if="selectedMasterId" class="apply-section">
            <div class="section-header">
              <span class="section-title">🎯 应用母版到页面</span>
            </div>
            <div class="apply-layouts-grid">
              <div
                v-for="(layout, idx) in availableLayouts"
                :key="layout.type"
                class="layout-card"
                :class="{ selected: selectedLayouts.includes(layout.type) }"
                @click="toggleLayout(layout.type)"
              >
                <div class="layout-icon">{{ layout.icon }}</div>
                <div class="layout-info">
                  <span class="layout-name">{{ layout.name }}</span>
                  <span class="layout-desc">{{ layout.desc }}</span>
                </div>
                <div class="layout-check">{{ selectedLayouts.includes(layout.type) ? '✓' : '' }}</div>
              </div>
            </div>
            <button class="btn-apply-masters" @click="applyMasterToSlides" :disabled="selectedLayouts.length === 0">
              应用到选中的 {{ selectedLayouts.length }} 种布局
            </button>
          </div>
        </div>

        <!-- Tab: Create / Edit Master -->
        <div v-if="activeTab === 'editor'" class="tab-content">
          <div class="editor-form">
            <div class="form-row">
              <label class="form-label">母版名称</label>
              <input v-model="editingMaster.name" type="text" class="form-input" placeholder="例如：封面标题页" />
            </div>

            <div class="form-row">
              <label class="form-label">布局类型</label>
              <select v-model="editingMaster.layout_type" class="form-select">
                <option value="title">封面标题页</option>
                <option value="content">内容页</option>
                <option value="two_column">双栏布局</option>
                <option value="center">居中布局</option>
                <option value="data">数据展示</option>
                <option value="timeline">时间线</option>
                <option value="quote">金句引用</option>
                <option value="comparison">对比页</option>
              </select>
            </div>

            <div class="form-row">
              <label class="form-label">描述说明</label>
              <textarea v-model="editingMaster.description" class="form-textarea" placeholder="描述此母版的用途..." rows="2"></textarea>
            </div>

            <!-- Layout Visual Editor -->
            <div class="form-row">
              <label class="form-label">布局结构</label>
              <div class="layout-visual-editor">
                <div
                  v-for="region in layoutRegions"
                  :key="region.id"
                  class="layout-region"
                  :class="[`region-${region.id}`, { active: activeRegion === region.id }]"
                  :style="region.style"
                  @click="activeRegion = region.id"
                >
                  <span class="region-label">{{ region.label }}</span>
                  <span class="region-hint">{{ region.hint }}</span>
                </div>
              </div>
              <p class="layout-hint">点击区域可设置属性</p>
            </div>

            <!-- Region Properties (when a region is selected) -->
            <div v-if="activeRegion" class="form-row region-props">
              <label class="form-label">区域属性: {{ activeRegion }}</label>
              <div class="region-props-grid">
                <div class="prop-item">
                  <label>元素类型</label>
                  <select v-model="regionProps[activeRegion].element_type" class="form-select">
                    <option value="text">文本</option>
                    <option value="image">图片</option>
                    <option value="chart">图表</option>
                    <option value="icon">图标</option>
                    <option value="shape">形状</option>
                  </select>
                </div>
                <div class="prop-item">
                  <label>对齐方式</label>
                  <select v-model="regionProps[activeRegion].align" class="form-select">
                    <option value="left">左对齐</option>
                    <option value="center">居中</option>
                    <option value="right">右对齐</option>
                  </select>
                </div>
                <div class="prop-item">
                  <label>字体大小</label>
                  <input type="number" v-model="regionProps[activeRegion].font_size" class="form-input" min="12" max="72" />
                </div>
                <div class="prop-item">
                  <label>字体颜色</label>
                  <input type="color" v-model="regionProps[activeRegion].font_color" class="form-color" />
                </div>
              </div>
              <div class="prop-item full-width">
                <label>继承属性</label>
                <div class="inheritance-toggle">
                  <label class="toggle-label">
                    <input type="checkbox" v-model="regionProps[activeRegion].inherit" class="toggle-input" />
                    <span class="toggle-switch"></span>
                    <span>允许子页面覆盖</span>
                  </label>
                </div>
              </div>
            </div>

            <!-- Master Theme Override -->
            <div class="form-row">
              <label class="form-label">主题色覆盖</label>
              <div class="theme-override-colors">
                <div class="color-picker-item">
                  <label>主色</label>
                  <input type="color" v-model="editingMaster.theme_primary" class="form-color" />
                </div>
                <div class="color-picker-item">
                  <label>辅色</label>
                  <input type="color" v-model="editingMaster.theme_secondary" class="form-color" />
                </div>
                <div class="color-picker-item">
                  <label>强调色</label>
                  <input type="color" v-model="editingMaster.theme_accent" class="form-color" />
                </div>
              </div>
              <button class="btn-apply-theme" @click="applyColorsFromTheme">从主题应用</button>
            </div>

            <!-- Child layout inheritance -->
            <div class="form-row">
              <label class="form-label">子页面继承设置</label>
              <div class="inheritance-settings">
                <div class="inherit-item">
                  <label class="toggle-label">
                    <input type="checkbox" v-model="editingMaster.inherit_background" class="toggle-input" />
                    <span class="toggle-switch"></span>
                    <span>背景样式</span>
                  </label>
                </div>
                <div class="inherit-item">
                  <label class="toggle-label">
                    <input type="checkbox" v-model="editingMaster.inherit_layout" class="toggle-input" />
                    <span class="toggle-switch"></span>
                    <span>布局结构</span>
                  </label>
                </div>
                <div class="inherit-item">
                  <label class="toggle-label">
                    <input type="checkbox" v-model="editingMaster.inherit_fonts" class="toggle-input" />
                    <span class="toggle-switch"></span>
                    <span>字体样式</span>
                  </label>
                </div>
                <div class="inherit-item">
                  <label class="toggle-label">
                    <input type="checkbox" v-model="editingMaster.inherit_colors" class="toggle-input" />
                    <span class="toggle-switch"></span>
                    <span>主题配色</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Editor Actions -->
          <div class="editor-actions">
            <button class="btn btn-outline" @click="cancelEdit">取消</button>
            <button class="btn btn-primary" @click="saveMaster" :disabled="saving">
              {{ saving ? '保存中...' : '💾 保存母版' }}
            </button>
          </div>
        </div>

        <!-- Tab: Theme Library -->
        <div v-if="activeTab === 'themes'" class="tab-content">
          <div class="section-header">
            <span class="section-title">🎨 主题库</span>
            <button class="btn-create" @click="goToThemeBuilder">
              <span>+</span> 从图片创建
            </button>
          </div>

          <!-- Trending themes -->
          <div class="theme-section">
            <div class="theme-section-title">🔥 热门主题</div>
            <div class="theme-chips">
              <div
                v-for="theme in trendingThemes"
                :key="theme.id"
                class="theme-chip"
                :class="{ active: activeThemeId === theme.id }"
                @click="applyTheme(theme)"
              >
                <div class="chip-colors">
                  <div class="chip-dot" :style="{ background: theme.primary }"></div>
                  <div class="chip-dot" :style="{ background: theme.secondary }"></div>
                  <div class="chip-dot" :style="{ background: theme.accent }"></div>
                </div>
                <span class="chip-name">{{ theme.name }}</span>
                <span v-if="activeThemeId === theme.id" class="chip-check">✓</span>
              </div>
            </div>
          </div>

          <!-- All themes -->
          <div class="theme-section">
            <div class="theme-section-title">✨ 全部主题</div>
            <div class="theme-grid">
              <div
                v-for="theme in allThemes"
                :key="theme.id"
                class="theme-card"
                :class="{ active: activeThemeId === theme.id }"
                @click="applyTheme(theme)"
              >
                <div class="theme-preview" :style="{ background: `linear-gradient(135deg, ${theme.primary}22, ${theme.secondary}22)` }">
                  <div class="theme-preview-colors">
                    <div class="preview-dot large" :style="{ background: theme.primary }"></div>
                    <div class="preview-dot medium" :style="{ background: theme.secondary }"></div>
                    <div class="preview-dot small" :style="{ background: theme.accent }"></div>
                  </div>
                  <div class="theme-preview-name" :style="{ color: theme.primary }">{{ theme.name }}</div>
                </div>
                <div class="theme-card-info">
                  <span class="theme-card-name">{{ theme.name }}</span>
                  <span class="theme-card-style">{{ theme.style }}</span>
                  <span class="theme-card-use">{{ theme.usage_count || 0 }} 次使用</span>
                </div>
              </div>
            </div>
          </div>

          <!-- My custom themes -->
          <div class="theme-section" v-if="myThemes.length > 0">
            <div class="theme-section-title">💎 我的自定义主题</div>
            <div class="theme-grid">
              <div
                v-for="theme in myThemes"
                :key="theme.id"
                class="theme-card"
                :class="{ active: activeThemeId === theme.id }"
                @click="applyTheme(theme)"
              >
                <div class="theme-preview" :style="{ background: `linear-gradient(135deg, ${theme.primary}22, ${theme.secondary}22)` }">
                  <div class="theme-preview-colors">
                    <div class="preview-dot large" :style="{ background: theme.primary }"></div>
                    <div class="preview-dot medium" :style="{ background: theme.secondary }"></div>
                    <div class="preview-dot small" :style="{ background: theme.accent }"></div>
                  </div>
                  <div class="theme-preview-name" :style="{ color: theme.primary }">{{ theme.name }}</div>
                </div>
                <div class="theme-card-info">
                  <span class="theme-card-name">{{ theme.name }}</span>
                  <span class="theme-card-style">{{ theme.style }}</span>
                  <div class="theme-card-actions">
                    <button class="tiny-btn" @click.stop="editCustomTheme(theme)">✏️</button>
                    <button class="tiny-btn delete" @click.stop="deleteCustomTheme(theme.id)">🗑️</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab: Auto Theme -->
        <div v-if="activeTab === 'autotheme'" class="tab-content">
          <div class="section-header">
            <span class="section-title">🤖 根据内容自动推荐主题</span>
          </div>

          <div class="autotheme-input">
            <textarea
              v-model="autoThemeContent"
              class="form-textarea"
              placeholder="输入演示文稿的主题内容、关键词或描述，AI 将自动推荐最适合的配色方案..."
              rows="4"
            ></textarea>
            <button class="btn-analyze" @click="analyzeAndSuggestTheme" :disabled="analyzing">
              {{ analyzing ? '🔍 分析中...' : '✨ AI 智能分析' }}
            </button>
          </div>

          <div v-if="autoThemeResult" class="autotheme-result">
            <div class="result-card">
              <div class="result-theme-preview" :style="{ background: `linear-gradient(135deg, ${autoThemeResult.primary}22, ${autoThemeResult.secondary}22)` }">
                <div class="theme-colors-row">
                  <div class="theme-dot-lg" :style="{ background: autoThemeResult.primary }" title="主色"></div>
                  <div class="theme-dot-md" :style="{ background: autoThemeResult.secondary }" title="辅色"></div>
                  <div class="theme-dot-sm" :style="{ background: autoThemeResult.accent }" title="强调色"></div>
                </div>
                <div class="result-theme-name">{{ autoThemeResult.name }}</div>
                <div class="result-theme-style">{{ autoThemeResult.style }}</div>
              </div>

              <div class="result-reasons">
                <div class="result-section-title">推荐理由</div>
                <div v-for="reason in autoThemeResult.reasons" :key="reason" class="reason-chip">{{ reason }}</div>
              </div>

              <div class="result-analysis" v-if="autoThemeResult.content_analysis">
                <div class="result-section-title">内容分析</div>
                <div class="analysis-tags">
                  <span class="type-badge">{{ autoThemeResult.content_analysis.type }}</span>
                  <span v-for="kw in (autoThemeResult.content_analysis.keywords || []).slice(0, 5)" :key="kw" class="keyword-chip">{{ kw }}</span>
                </div>
              </div>

              <button class="btn-apply-auto-theme" @click="applyAutoThemeResult">🎨 应用此主题</button>
            </div>
          </div>

          <!-- Auto theme suggestions -->
          <div v-if="autoThemeSuggestions.length > 0" class="autotheme-suggestions">
            <div class="result-section-title">备选主题</div>
            <div class="suggestions-grid">
              <div
                v-for="(sug, idx) in autoThemeSuggestions"
                :key="idx"
                class="suggestion-card"
                @click="applyAutoThemeSuggestion(sug)"
              >
                <div class="sug-colors">
                  <div class="sug-dot" :style="{ background: sug.primary }"></div>
                  <div class="sug-dot" :style="{ background: sug.secondary }"></div>
                  <div class="sug-dot" :style="{ background: sug.accent }"></div>
                </div>
                <div class="sug-info">
                  <span class="sug-name">{{ sug.name }}</span>
                  <span class="sug-style">{{ sug.style }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="panel-footer">
        <button class="btn btn-outline" @click="closePanel">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { api } from '../api/client'
import { useInteractionFeedback } from '../composables/useInteractionFeedback'

const props = defineProps<{
  show: boolean
  slides?: any[]
  currentSlideIndex?: number
  taskId?: string
}>()

const emit = defineEmits(['close', 'apply-theme', 'apply-master'])

const { showSuccess, showError } = useInteractionFeedback()

// ===== Tabs =====
const tabs = [
  { id: 'list', label: '母版列表', icon: '📋' },
  { id: 'editor', label: '编辑母版', icon: '✏️' },
  { id: 'themes', label: '主题库', icon: '🎨' },
  { id: 'autotheme', label: '智能主题', icon: '🤖' },
]

const activeTab = ref('list')

// ===== Master Slides =====
const masterSlides = ref<any[]>([])
const selectedMasterId = ref<string | null>(null)
const selectedLayouts = ref<string[]>([])
const saving = ref(false)

const availableLayouts = [
  { type: 'title', name: '封面标题', icon: '📄', desc: '封面、章节标题页' },
  { type: 'content', name: '内容页', icon: '📝', desc: '普通内容展示' },
  { type: 'two_column', name: '双栏布局', icon: '📊', desc: '左右对比、并列展示' },
  { type: 'center', name: '居中布局', icon: '🎯', desc: '居中聚焦内容' },
  { type: 'data', name: '数据展示', icon: '📈', desc: '图表、数据可视化' },
  { type: 'timeline', name: '时间线', icon: '⏰', desc: '发展历程、时间轴' },
  { type: 'quote', name: '金句引用', icon: '💬', desc: '名言、核心观点' },
  { type: 'comparison', name: '对比页', icon: '⚖️', desc: '方案对比、优劣势' },
]

// ===== Layout Regions (visual editor) =====
const layoutRegions = computed(() => {
  const type = editingMaster.value.layout_type
  const regionMap: Record<string, any[]> = {
    title: [
      { id: 'title', label: '标题', hint: '主标题区域', style: { top: '15%', left: '10%', width: '80%', height: '25%', background: '#165DFF22' } },
      { id: 'subtitle', label: '副标题', hint: '副标题/描述', style: { top: '45%', left: '15%', width: '70%', height: '15%', background: '#34C75922' } },
      { id: 'background', label: '背景', hint: '背景装饰', style: { top: '0', left: '0', width: '100%', height: '100%', background: '#FF950011' } },
    ],
    content: [
      { id: 'header', label: '页眉', hint: '页面标题', style: { top: '5%', left: '5%', width: '90%', height: '12%', background: '#165DFF22' } },
      { id: 'content', label: '内容', hint: '主要内容', style: { top: '22%', left: '8%', width: '84%', height: '60%', background: '#34C75922' } },
      { id: 'footer', label: '页脚', hint: '页码/日期', style: { top: '88%', left: '5%', width: '90%', height: '8%', background: '#FF950022' } },
    ],
    two_column: [
      { id: 'header', label: '页眉', hint: '页面标题', style: { top: '5%', left: '5%', width: '90%', height: '12%', background: '#165DFF22' } },
      { id: 'left', label: '左栏', hint: '左侧内容', style: { top: '22%', left: '3%', width: '44%', height: '65%', background: '#5856D622' } },
      { id: 'right', label: '右栏', hint: '右侧内容', style: { top: '22%', left: '53%', width: '44%', height: '65%', background: '#34C75922' } },
    ],
    center: [
      { id: 'main', label: '主内容', hint: '居中主要内容', style: { top: '25%', left: '20%', width: '60%', height: '50%', background: '#165DFF22' } },
    ],
    data: [
      { id: 'header', label: '标题', hint: '图表标题', style: { top: '5%', left: '5%', width: '90%', height: '12%', background: '#165DFF22' } },
      { id: 'chart', label: '图表区', hint: '图表展示', style: { top: '20%', left: '5%', width: '65%', height: '70%', background: '#34C75922' } },
      { id: 'legend', label: '图例', hint: '图例说明', style: { top: '20%', left: '72%', width: '25%', height: '70%', background: '#FF950022' } },
    ],
    timeline: [
      { id: 'header', label: '标题', hint: '时间线标题', style: { top: '5%', left: '5%', width: '90%', height: '12%', background: '#165DFF22' } },
      { id: 'timeline', label: '时间轴', hint: '时间线内容', style: { top: '22%', left: '5%', width: '90%', height: '70%', background: '#5856D622' } },
    ],
    quote: [
      { id: 'quote', label: '引用内容', hint: '金句文字', style: { top: '20%', left: '10%', width: '80%', height: '40%', background: '#5856D622' } },
      { id: 'attribution', label: '出处', hint: '引用来源', style: { top: '65%', left: '50%', width: '40%', height: '15%', background: '#FF950022' } },
    ],
    comparison: [
      { id: 'header', label: '标题', hint: '对比标题', style: { top: '5%', left: '5%', width: '90%', height: '12%', background: '#165DFF22' } },
      { id: 'left', label: '方案A', hint: '左侧方案', style: { top: '22%', left: '3%', width: '44%', height: '68%', background: '#34C75922' } },
      { id: 'right', label: '方案B', hint: '右侧方案', style: { top: '22%', left: '53%', width: '44%', height: '68%', background: '#FF3B3022' } },
    ],
  }
  return regionMap[type] || regionMap['content']
})

const activeRegion = ref<string | null>(null)

const defaultRegionProps: Record<string, any> = {
  element_type: 'text',
  align: 'center',
  font_size: 24,
  font_color: '#FFFFFF',
  inherit: true,
}

const regionProps = ref<Record<string, any>>({})

watch(activeRegion, (region) => {
  if (region && !regionProps.value[region]) {
    regionProps.value[region] = { ...defaultRegionProps }
  }
})

// ===== Editing Master =====
const editingMaster = ref<any>({
  id: null,
  name: '',
  layout_type: 'content',
  description: '',
  theme_primary: '#165DFF',
  theme_secondary: '#0E42D2',
  theme_accent: '#64D2FF',
  inherit_background: true,
  inherit_layout: true,
  inherit_fonts: true,
  inherit_colors: false,
  regions: {},
})

// ===== Theme Library =====
const trendingThemes = ref<any[]>([
  { id: 'biz-blue', name: '商务蓝', primary: '#165DFF', secondary: '#0E42D2', accent: '#64D2FF', style: '专业商务', usage_count: 128 },
  { id: 'elegant-gold', name: '高端金', primary: '#D4AF37', secondary: '#1a1a2e', accent: '#FFD700', style: '高端大气', usage_count: 89 },
  { id: 'tech-purple', name: '科技紫', primary: '#5856D6', secondary: '#3634A3', accent: '#8B89FF', style: '科技未来', usage_count: 76 },
  { id: 'nature-green', name: '清新绿', primary: '#34C759', secondary: '#248A3D', accent: '#5DD879', style: '自然清新', usage_count: 65 },
  { id: 'energetic-orange', name: '活力橙', primary: '#FF9500', secondary: '#CC7A00', accent: '#FFB340', style: '活力动感', usage_count: 54 },
])

const allThemes = ref<any[]>([
  { id: 'creative-coral', name: '创意珊瑚', primary: '#FF6B6B', secondary: '#EE5A24', accent: '#FF9F7F', style: '创意活力', usage_count: 43 },
  { id: 'ocean-blue', name: '海洋蓝', primary: '#007AFF', secondary: '#0055CC', accent: '#5AC8FA', style: '简约现代', usage_count: 38 },
  { id: 'sunset-gold', name: '落日金', primary: '#FF9500', secondary: '#8B5A00', accent: '#FFD60A', style: '优雅知性', usage_count: 31 },
  { id: 'minimal-gray', name: '极简灰', primary: '#1A1A1A', secondary: '#48484A', accent: '#98989D', style: '简约现代', usage_count: 29 },
  { id: 'romantic-pink', name: '浪漫粉', primary: '#FF2D55', secondary: '#C41E3A', accent: '#FF6B8A', style: '创意活力', usage_count: 22 },
  { id: 'midnight-indigo', name: '午夜靛', primary: '#5856D6', secondary: '#1C1C1E', accent: '#BF5AF2', style: '高端大气', usage_count: 18 },
  { id: 'nature-teal', name: '自然青', primary: '#00B96B', secondary: '#00875A', accent: '#5DD879', style: '自然清新', usage_count: 15 },
])

const myThemes = ref<any[]>([])
const activeThemeId = ref<string | null>(null)

// ===== Auto Theme =====
const autoThemeContent = ref('')
const analyzing = ref(false)
const autoThemeResult = ref<any>(null)
const autoThemeSuggestions = ref<any[]>([])

// ===== Master Preview Style =====
const masterPreviewStyle = (master: any) => ({
  background: `linear-gradient(135deg, ${master.theme_primary || '#165DFF'}22, ${master.theme_secondary || '#0E42D2'}22)`,
  borderColor: master.theme_primary || '#165DFF',
})

// ===== Load master slides =====
const loadMasterSlides = async () => {
  try {
    const res = await api.ppt.getMasterSlides()
    if (res.data.success) {
      masterSlides.value = res.data.master_slides || []
    }
  } catch (e) {
    console.warn('[MasterSlideEditor] Failed to load master slides:', e)
  }
}

// ===== Master CRUD =====
const selectMaster = (master: any) => {
  selectedMasterId.value = master.id
  selectedLayouts.value = [master.layout_type]
}

const createNewMaster = () => {
  editingMaster.value = {
    id: null,
    name: '',
    layout_type: 'content',
    description: '',
    theme_primary: '#165DFF',
    theme_secondary: '#0E42D2',
    theme_accent: '#64D2FF',
    inherit_background: true,
    inherit_layout: true,
    inherit_fonts: true,
    inherit_colors: false,
  }
  regionProps.value = {}
  activeRegion.value = null
  activeTab.value = 'editor'
}

const editMaster = async (master: any) => {
  editingMaster.value = { ...master }
  activeTab.value = 'editor'
}

const duplicateMaster = async (master: any) => {
  const copy = {
    ...master,
    id: null,
    name: master.name + ' (副本)',
  }
  try {
    const res = await api.ppt.saveMasterSlide(copy)
    if (res.data.success) {
      await loadMasterSlides()
      showSuccess('已复制母版')
    }
  } catch (e) {
    showError('复制失败')
  }
}

const deleteMaster = async (id: string) => {
  if (!confirm('确定删除此母版？')) return
  try {
    const res = await api.ppt.deleteMasterSlide(id)
    if (res.data.success) {
      masterSlides.value = masterSlides.value.filter(m => m.id !== id)
      if (selectedMasterId.value === id) selectedMasterId.value = null
      showSuccess('已删除')
    }
  } catch (e) {
    showError('删除失败')
  }
}

const saveMaster = async () => {
  if (!editingMaster.value.name.trim()) {
    showError('请输入母版名称')
    return
  }
  saving.value = true
  try {
    // Collect region props
    const regions: Record<string, any> = {}
    for (const [key, props] of Object.entries(regionProps.value)) {
      regions[key] = props
    }
    const payload = { ...editingMaster.value, regions }

    const res = await api.ppt.saveMasterSlide(payload)
    if (res.data.success) {
      await loadMasterSlides()
      activeTab.value = 'list'
      showSuccess('母版已保存')
    }
  } catch (e: any) {
    showError('保存失败: ' + (e?.message || ''))
  } finally {
    saving.value = false
  }
}

const cancelEdit = () => {
  activeTab.value = 'list'
}

const toggleLayout = (type: string) => {
  const idx = selectedLayouts.value.indexOf(type)
  if (idx >= 0) selectedLayouts.value.splice(idx, 1)
  else selectedLayouts.value.push(type)
}

const applyMasterToSlides = async () => {
  if (!selectedMasterId.value || selectedLayouts.value.length === 0) return
  emit('apply-master', {
    master_id: selectedMasterId.value,
    layout_types: selectedLayouts.value,
  })
  showSuccess('已应用母版到选中的幻灯片')
  closePanel()
}

const applyColorsFromTheme = () => {
  const primaries = {
    'biz-blue': { primary: '#165DFF', secondary: '#0E42D2', accent: '#64D2FF' },
    'elegant-gold': { primary: '#D4AF37', secondary: '#1a1a2e', accent: '#FFD700' },
    'tech-purple': { primary: '#5856D6', secondary: '#3634A3', accent: '#8B89FF' },
    'nature-green': { primary: '#34C759', secondary: '#248A3D', accent: '#5DD879' },
  }
  const theme = (primaries as Record<string, { primary: string; secondary: string; accent: string }>)[activeThemeId.value || '']
  if (theme) {
    editingMaster.value.theme_primary = theme.primary
    editingMaster.value.theme_secondary = theme.secondary
    editingMaster.value.theme_accent = theme.accent
  }
}

// ===== Theme Library =====
const applyTheme = (theme: any) => {
  activeThemeId.value = theme.id
  emit('apply-theme', {
    primary: theme.primary,
    secondary: theme.secondary,
    accent: theme.accent,
  })
  showSuccess('主题已应用', theme.name)
}

const goToThemeBuilder = () => {
  emit('close')
  // Emit event to open theme panel
  showSuccess('请在右侧面板使用"AI提取主题色"功能')
}

const editCustomTheme = (theme: any) => {
  activeThemeId.value = theme.id
  // Switch to auto-theme tab with the theme loaded
  autoThemeResult.value = theme
  activeTab.value = 'autotheme'
}

const deleteCustomTheme = async (id: string) => {
  if (!confirm('确定删除此自定义主题？')) return
  try {
    const res = await api.ppt.deleteCustomTheme(id)
    if (res.data.success) {
      myThemes.value = myThemes.value.filter(t => t.id !== id)
      showSuccess('已删除')
    }
  } catch (e) {
    showError('删除失败')
  }
}

// ===== Auto Theme =====
const analyzeAndSuggestTheme = async () => {
  if (!autoThemeContent.value.trim()) {
    showError('请输入内容描述')
    return
  }
  analyzing.value = true
  try {
    const res = await api.ppt.suggestTheme({
      content: autoThemeContent.value,
      title: '',
      scene: '',
      style: 'auto',
    })
    if (res.data.success) {
      autoThemeResult.value = res.data.theme
      autoThemeSuggestions.value = res.data.alternatives || []
    }
  } catch (e: any) {
    showError('分析失败: ' + (e?.message || ''))
  } finally {
    analyzing.value = false
  }
}

const applyAutoThemeResult = () => {
  if (!autoThemeResult.value) return
  emit('apply-theme', {
    primary: autoThemeResult.value.primary,
    secondary: autoThemeResult.value.secondary,
    accent: autoThemeResult.value.accent,
  })
  showSuccess('智能主题已应用', autoThemeResult.value.name)
}

const applyAutoThemeSuggestion = (sug: any) => {
  emit('apply-theme', {
    primary: sug.primary,
    secondary: sug.secondary,
    accent: sug.accent,
  })
  showSuccess('主题已应用', sug.name)
}

// ===== Lifecycle =====
watch(() => props.show, (val) => {
  if (val) {
    activeTab.value = 'list'
    loadMasterSlides()
    loadMyThemes()
  }
})

const loadMyThemes = async () => {
  try {
    const res = await api.ppt.getCustomThemes()
    if (res.data.success) {
      myThemes.value = res.data.themes || []
    }
  } catch (e) {
    console.warn('[MasterSlideEditor] Failed to load custom themes:', e)
  }
}

const closePanel = () => {
  emit('close')
}
</script>

<style scoped>
.master-slide-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.master-slide-panel {
  background: #fff;
  border-radius: 16px;
  width: 680px;
  max-width: 95vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.panel-header {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #fff;
  padding: 20px 24px;
  display: flex;
  align-items: center;
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
  font-weight: 600;
}

.header-subtitle {
  margin-left: 16px;
  font-size: 13px;
  opacity: 0.75;
}

.panel-close-btn {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255,255,255,0.2);
  border: none;
  color: #fff;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.panel-close-btn:hover {
  background: rgba(255,255,255,0.3);
}

/* Tabs */
.panel-tabs {
  display: flex;
  background: #f8f9fa;
  border-bottom: 1px solid #e8e8e8;
  padding: 0 16px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 16px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  font-size: 13px;
  color: #666;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: #333;
}

.tab-btn.active {
  color: #165DFF;
  border-bottom-color: #165DFF;
  font-weight: 600;
}

.tab-icon {
  font-size: 16px;
}

/* Body */
.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Section header */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #222;
}

.btn-create {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 7px 14px;
  background: #165DFF;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-create:hover {
  background: #0D47A1;
}

.btn-create-first {
  margin-top: 12px;
  padding: 10px 20px;
  background: #165DFF;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: 40px;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-hint {
  font-size: 13px;
  color: #bbb;
}

/* Master grid */
.master-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.master-card {
  border: 2px solid #e8e8e8;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  background: #fff;
}

.master-card:hover {
  border-color: #165DFF;
  box-shadow: 0 2px 12px rgba(22, 93, 255, 0.15);
}

.master-card.active {
  border-color: #165DFF;
  box-shadow: 0 2px 12px rgba(22, 93, 255, 0.2);
}

.master-preview {
  height: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-bottom: 1px solid #eee;
}

.preview-layout-icon {
  font-size: 32px;
}

.preview-master-name {
  font-size: 12px;
  font-weight: 600;
  color: #333;
}

.master-info {
  padding: 12px;
}

.master-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.master-name {
  font-size: 14px;
  font-weight: 600;
  color: #222;
}

.master-badge {
  font-size: 10px;
  background: #f0f0f5;
  color: #165DFF;
  padding: 2px 6px;
  border-radius: 4px;
}

.master-desc {
  font-size: 12px;
  color: #888;
  display: block;
  margin-bottom: 6px;
}

.master-meta {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #aaa;
}

.master-actions {
  display: flex;
  gap: 6px;
  padding: 0 12px 12px;
}

.action-btn {
  width: 30px;
  height: 30px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f5f5f5;
}

.action-btn.delete:hover {
  background: #ffeaea;
  border-color: #ff3b30;
}

/* Apply layouts grid */
.apply-layouts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.layout-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border: 2px solid #e8e8e8;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  background: #fff;
}

.layout-card:hover {
  border-color: #165DFF;
}

.layout-card.selected {
  border-color: #165DFF;
  background: #f0f5ff;
}

.layout-icon {
  font-size: 22px;
}

.layout-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.layout-name {
  font-size: 13px;
  font-weight: 600;
  color: #222;
}

.layout-desc {
  font-size: 11px;
  color: #888;
}

.layout-check {
  font-size: 16px;
  color: #165DFF;
  font-weight: 700;
  width: 20px;
}

.btn-apply-masters {
  margin-top: 12px;
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #165DFF 0%, #0D47A1 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-apply-masters:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(22, 93, 255, 0.3);
}

.btn-apply-masters:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Editor form */
.editor-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.form-input,
.form-select,
.form-textarea {
  padding: 10px 12px;
  border: 2px solid #e8e8e8;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s;
  background: #fff;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #165DFF;
}

.form-textarea {
  resize: vertical;
  font-family: inherit;
}

/* Layout visual editor */
.layout-visual-editor {
  position: relative;
  height: 200px;
  background: #f8f9fa;
  border: 2px solid #e8e8e8;
  border-radius: 12px;
  overflow: hidden;
}

.layout-region {
  position: absolute;
  border: 1.5px dashed #aaa;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.layout-region:hover {
  border-color: #165DFF;
}

.layout-region.active {
  border-color: #165DFF;
  border-style: solid;
  box-shadow: 0 0 0 2px rgba(22, 93, 255, 0.2);
}

.region-label {
  font-size: 12px;
  font-weight: 600;
  color: #555;
}

.region-hint {
  font-size: 10px;
  color: #999;
}

.layout-hint {
  font-size: 11px;
  color: #888;
}

/* Region props */
.region-props-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.prop-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.prop-item label {
  font-size: 11px;
  color: #666;
  font-weight: 500;
}

.prop-item.full-width {
  grid-column: 1 / -1;
}

.form-color {
  width: 100%;
  height: 36px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  cursor: pointer;
  padding: 2px;
}

.inheritances-toggle,
.inheritance-settings {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.inherit-item {
  display: flex;
  align-items: center;
}

/* Toggle */
.toggle-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 13px;
}

.toggle-input {
  display: none;
}

.toggle-switch {
  width: 36px;
  height: 20px;
  background: #ccc;
  border-radius: 10px;
  position: relative;
  transition: background 0.2s;
  flex-shrink: 0;
}

.toggle-switch::after {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  background: #fff;
  border-radius: 50%;
  top: 2px;
  left: 2px;
  transition: transform 0.2s;
}

.toggle-input:checked + .toggle-switch {
  background: #165DFF;
}

.toggle-input:checked + .toggle-switch::after {
  transform: translateX(16px);
}

/* Theme override colors */
.theme-override-colors {
  display: flex;
  gap: 12px;
}

.color-picker-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.color-picker-item label {
  font-size: 11px;
  color: #666;
  font-weight: 500;
}

.btn-apply-theme {
  margin-top: 8px;
  padding: 6px 12px;
  background: #f0f0f5;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  align-self: flex-start;
}

.btn-apply-theme:hover {
  background: #e8e8f5;
  border-color: #165DFF;
}

/* Editor actions */
.editor-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding-top: 12px;
  border-top: 1px solid #eee;
}

.btn {
  border-radius: 8px;
  padding: 8px 20px;
  font-size: 14px;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-outline {
  background: #fff;
  border: 1.5px solid #ddd;
  color: #555;
}

.btn-outline:hover {
  border-color: #165DFF;
  color: #165DFF;
}

.btn-primary {
  background: #165DFF;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0D47A1;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Theme Library */
.theme-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.theme-section-title {
  font-size: 13px;
  font-weight: 600;
  color: #555;
}

.theme-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.theme-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: #f8f9fa;
  border: 2px solid #e8e8e8;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.theme-chip:hover {
  border-color: #165DFF;
}

.theme-chip.active {
  border-color: #165DFF;
  background: #f0f5ff;
}

.chip-colors {
  display: flex;
  gap: 3px;
}

.chip-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid rgba(0,0,0,0.1);
}

.chip-name {
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

.chip-check {
  font-size: 14px;
  color: #165DFF;
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.theme-card {
  border: 2px solid #e8e8e8;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  background: #fff;
}

.theme-card:hover {
  border-color: #165DFF;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(22, 93, 255, 0.15);
}

.theme-card.active {
  border-color: #165DFF;
}

.theme-preview {
  height: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
}

.theme-preview-colors {
  display: flex;
  align-items: flex-end;
  gap: 4px;
}

.preview-dot {
  border-radius: 50%;
  border: 1px solid rgba(0,0,0,0.1);
}

.preview-dot.large {
  width: 28px;
  height: 28px;
}

.preview-dot.medium {
  width: 20px;
  height: 20px;
}

.preview-dot.small {
  width: 14px;
  height: 14px;
}

.theme-preview-name {
  font-size: 11px;
  font-weight: 600;
  text-align: center;
}

.theme-card-info {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.theme-card-name {
  font-size: 12px;
  font-weight: 600;
  color: #222;
}

.theme-card-style {
  font-size: 10px;
  color: #888;
}

.theme-card-use {
  font-size: 10px;
  color: #aaa;
}

.theme-card-actions {
  display: flex;
  gap: 4px;
  margin-top: 4px;
}

.tiny-btn {
  width: 22px;
  height: 22px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tiny-btn.delete:hover {
  background: #ffeaea;
}

/* Auto Theme */
.autotheme-input {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.btn-analyze {
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  align-self: flex-end;
}

.btn-analyze:hover:not(:disabled) {
  opacity: 0.85;
}

.btn-analyze:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.autotheme-result {
  margin-top: 8px;
}

.result-card {
  border: 2px solid #667eea;
  border-radius: 12px;
  overflow: hidden;
}

.result-theme-preview {
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.theme-colors-row {
  display: flex;
  gap: 10px;
}

.theme-dot-lg {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 2px solid rgba(0,0,0,0.1);
}

.theme-dot-md {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid rgba(0,0,0,0.1);
  align-self: center;
}

.theme-dot-sm {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid rgba(0,0,0,0.1);
  align-self: flex-end;
}

.result-theme-name {
  font-size: 18px;
  font-weight: 700;
  color: #222;
}

.result-theme-style {
  font-size: 12px;
  color: #888;
}

.result-reasons {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.result-section-title {
  font-size: 12px;
  font-weight: 600;
  color: #555;
  margin-bottom: 4px;
}

.reason-chip {
  display: inline-block;
  background: #f0f5ff;
  color: #667eea;
  padding: 3px 10px;
  border-radius: 10px;
  font-size: 12px;
}

.result-analysis {
  padding: 0 16px 12px;
}

.analysis-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.type-badge {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
}

.keyword-chip {
  background: #f0f0f5;
  color: #555;
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 11px;
}

.btn-apply-auto-theme {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.btn-apply-auto-theme:hover {
  opacity: 0.9;
}

/* Suggestions grid */
.autotheme-suggestions {
  margin-top: 12px;
}

.suggestions-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 8px;
}

.suggestion-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border: 2px solid #e8e8e8;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  background: #fff;
}

.suggestion-card:hover {
  border-color: #667eea;
}

.sug-colors {
  display: flex;
  gap: 3px;
}

.sug-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid rgba(0,0,0,0.1);
}

.sug-info {
  display: flex;
  flex-direction: column;
}

.sug-name {
  font-size: 12px;
  font-weight: 600;
  color: #333;
}

.sug-style {
  font-size: 10px;
  color: #888;
}

/* Footer */
.panel-footer {
  padding: 14px 24px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
