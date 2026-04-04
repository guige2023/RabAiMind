<template>
  <div class="create">
    <div class="container">
      <div class="create-header">
        <div class="header-top">
          <div>
            <h1 class="page-title">创建 PPT - 输入需求</h1>
            <p class="page-subtitle">描述你想要的内容，AI 将为你生成专业演示文稿</p>
          </div>
          <div class="draft-status" v-if="draftSaved">
            <span class="draft-icon">✓</span>
            <span class="draft-text">草稿已保存</span>
          </div>
        </div>
      </div>

      <div class="create-form">
        <!-- 需求输入 -->
        <div class="form-section">
          <label class="form-label">
            需求描述
            <span class="label-tip">描述越详细，生成效果越好</span>
          </label>
          <textarea
            v-model="formData.userRequest"
            class="input textarea"
            :class="{ error: errors.userRequest }"
            placeholder="例如：创建一个关于人工智能发展趋势的商业计划书，包含行业现状、未来预测、应用场景等..."
            rows="5"
            @input="validateRequest"
          ></textarea>
          <!-- 快速示例 -->
          <div class="quick-examples" v-if="!formData.userRequest">
            <span class="tip-label">试试这些：</span>
            <button class="example-btn" @click="formData.userRequest = '创建一份产品发布会的PPT，包含产品介绍、功能演示、定价策略、市场目标等，10页左右'">产品发布会</button>
            <button class="example-btn" @click="formData.userRequest = '制作年度工作总结PPT，包含年度回顾、业绩数据、团队成就、明年计划，8页'">年度总结</button>
            <button class="example-btn" @click="formData.userRequest = '创建公司介绍PPT，包含公司背景、核心业务、竞争优势、发展愿景，12页'">公司介绍</button>
            <button class="example-btn" @click="formData.userRequest = '制作商业计划书PPT，包含市场分析、商业模式、竞争优势、融资计划，15页'">商业计划书</button>
            <button class="example-btn" @click="formData.userRequest = '创建教育培训课程PPT，包含课程目标、教学内容、学习成果、案例分析，20页'">教育培训</button>
            <button class="example-btn" @click="formData.userRequest = '制作数据分析报告PPT，包含数据概览、关键发现、深度分析、建议行动，12页'">数据分析报告</button>
          </div>

          <!-- AI智能推荐 -->
          <div class="ai-recommendation" v-if="showRecommendation && recommendations.length > 0">
            <div class="recommendation-header">
              <span class="ai-icon">✨</span>
              <span>AI 智能推荐</span>
            </div>
            <div class="recommendation-list">
              <button
                v-for="rec in recommendations"
                :key="rec.type"
                class="recommendation-btn"
                @click="applyRecommendation(rec)"
              >
                <span class="rec-type">{{ getRecTypeName(rec.type) }}</span>
                <span class="rec-value">{{ getRecValueName(rec) }}</span>
              </button>
            </div>
          </div>
          <div class="form-hint">
            <span v-if="errors.userRequest" class="text-error">{{ errors.userRequest }}</span>
            <span class="text-muted">{{ formData.userRequest.length }} / 2000</span>
          </div>
        </div>

        <!-- 高级参数（默认折叠，完整参数在 OutlineEditView 中配置）-->
        <div class="form-section">
          <button class="btn btn-outline" @click="showAdvancedParams = !showAdvancedParams">
            {{ showAdvancedParams ? '▼ 收起高级参数' : '▶ 高级参数（场景/风格/模板等）' }}
          </button>
        </div>

        <!-- 高级参数配置 -->
        <div v-if="showAdvancedParams">
          <!-- 幻灯片数量 -->
          <div class="form-section">
            <label class="form-label">幻灯片数量</label>
            <div class="slider-group">
              <input
                type="range"
                v-model.number="formData.slideCount"
                min="5"
                max="30"
                step="1"
                class="slider"
              />
              <span class="slider-value">{{ formData.slideCount }} 页</span>
            </div>
          </div>

          <!-- 场景选择 -->
          <div class="form-section">
            <label class="form-label">场景类型</label>
            <select v-model="formData.scene" class="input select">
              <option value="business">💼 商务</option>
              <option value="education">📚 教育</option>
              <option value="tech">🚀 科技</option>
              <option value="creative">💡 创意</option>
              <option value="marketing">📢 营销</option>
              <option value="finance">💰 金融</option>
              <option value="medical">🏥 医疗</option>
              <option value="government">🏛️ 政府</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <!-- 风格选择 -->
          <div class="form-section">
            <label class="form-label">视觉风格</label>
            <select v-model="formData.style" class="input select">
              <option value="professional">💼 专业商务</option>
              <option value="simple">✨ 简约现代</option>
              <option value="energetic">🔥 活力动感</option>
              <option value="premium">👑 高端大气</option>
              <option value="tech">🚀 科技未来</option>
              <option value="creative">🎨 创意艺术</option>
              <option value="elegant">🌸 优雅古典</option>
              <option value="playful">🎮 卡通趣味</option>
              <option value="nature">🌿 自然清新</option>
              <option value="minimalist">⬜ 极简留白</option>
            </select>
          </div>

          <!-- 模板选择 -->
          <div class="form-section">
            <label class="form-label">模板风格</label>
            <div class="template-grid">
              <div
                v-for="tpl in templateOptionsComputed"
                :key="tpl.value"
                class="template-card"
                :class="{ active: formData.template === tpl.value }"
                :data-testid="`template-${tpl.value}`"
                :aria-label="tpl.name"
                @click="formData.template = tpl.value"
              >
                <div class="template-preview" :style="{ background: tpl.preview }">
                  <span class="template-icon">{{ tpl.icon }}</span>
                </div>
                <span class="template-name">{{ tpl.name }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 主题定制 -->
        <div class="form-section theme-panel-section">
          <ThemePanel
            @theme-change="onThemeChange"
            @dark-mode-change="onDarkModeChange"
            @font-change="onFontChange"
          />
        </div>

        <!-- 数据图表设置 -->
        <div class="form-section">
          <label class="form-label">
            数据可视化
            <span class="label-tip">在PPT中添加图表</span>
          </label>
          <div class="chart-options">
            <label class="checkbox-label">
              <input type="checkbox" v-model="formData.includeCharts" />
              <span>包含数据图表</span>
            </label>
          </div>
          <div v-if="formData.includeCharts" class="chart-type-select">
            <label class="checkbox-label">
              <input type="checkbox" v-model="formData.includePieChart" />
              <span>饼图</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" v-model="formData.includeBarChart" />
              <span>柱状图</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" v-model="formData.includeLineChart" />
              <span>折线图</span>
            </label>
          </div>
        </div>

        <!-- 水印设置 -->
        <div class="form-section">
          <label class="form-label">
            高级设置
            <span class="label-tip">可选功能</span>
          </label>
          <div class="chart-options">
            <label class="checkbox-label">
              <input type="checkbox" v-model="formData.addWatermark" />
              <span>添加水印</span>
            </label>
          </div>
        </div>

        <!-- 主题色 -->
        <div class="form-section">
          <label class="form-label">主题色</label>
          <div class="theme-colors">
            <div
              v-for="color in themeColors"
              :key="color.value"
              class="theme-color"
              :class="{ active: formData.themeColor === color.value }"
              :style="{ background: color.value }"
              @click="formData.themeColor = color.value"
            >
              <span v-if="formData.themeColor === color.value" class="check">✓</span>
            </div>
          </div>
        </div>

        <!-- 字体系统 - 4级字体设置 -->
        <div class="form-section">
          <label class="form-label">
            字体系统
            <span class="label-tip">4级字体设置</span>
          </label>

          <!-- 字体级别选择 -->
          <div class="font-level-tabs">
            <button
              v-for="level in fontLevelOptions"
              :key="level.value"
              class="font-level-btn"
              :class="{ active: formData.fontLevel === level.value }"
              @click="formData.fontLevel = level.value"
            >
              <span class="level-num">{{ level.value }}</span>
              <span class="level-name">{{ level.name }}</span>
            </button>
          </div>

          <!-- 字体选择 -->
          <div class="font-select-grid">
            <!-- 一级字体 -->
            <div v-if="formData.fontLevel === 1" class="font-select-group">
              <label class="form-label-sub">一级字体（标题）</label>
              <div class="font-options">
                <div
                  v-for="font in fontFamilyOptions"
                  :key="font.value"
                  class="font-option"
                  :class="{ active: formData.fontTitle === font.value }"
                  @click="formData.fontTitle = font.value"
                >
                  <span class="font-name" :style="{ fontFamily: font.value }">{{ font.name }}</span>
                  <span class="font-desc">{{ font.desc }}</span>
                </div>
              </div>
            </div>

            <!-- 二级字体 -->
            <div v-if="formData.fontLevel === 2" class="font-select-group">
              <label class="form-label-sub">二级字体（副标题）</label>
              <div class="font-options">
                <div
                  v-for="font in fontFamilyOptions"
                  :key="font.value"
                  class="font-option"
                  :class="{ active: formData.fontSubtitle === font.value }"
                  @click="formData.fontSubtitle = font.value"
                >
                  <span class="font-name" :style="{ fontFamily: font.value }">{{ font.name }}</span>
                  <span class="font-desc">{{ font.desc }}</span>
                </div>
              </div>
            </div>

            <!-- 三级字体 -->
            <div v-if="formData.fontLevel === 3" class="font-select-group">
              <label class="form-label-sub">三级字体（正文）</label>
              <div class="font-options">
                <div
                  v-for="font in fontFamilyOptions"
                  :key="font.value"
                  class="font-option"
                  :class="{ active: formData.fontContent === font.value }"
                  @click="formData.fontContent = font.value"
                >
                  <span class="font-name" :style="{ fontFamily: font.value }">{{ font.name }}</span>
                  <span class="font-desc">{{ font.desc }}</span>
                </div>
              </div>
            </div>

            <!-- 四级字体 -->
            <div v-if="formData.fontLevel === 4" class="font-select-group">
              <label class="form-label-sub">四级字体（注释）</label>
              <div class="font-options">
                <div
                  v-for="font in fontFamilyOptions"
                  :key="font.value"
                  class="font-option"
                  :class="{ active: formData.fontCaption === font.value }"
                  @click="formData.fontCaption = font.value"
                >
                  <span class="font-name" :style="{ fontFamily: font.value }">{{ font.name }}</span>
                  <span class="font-desc">{{ font.desc }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 字体预览 -->
          <div class="font-preview" :style="{ fontFamily: getCurrentFont() }">
            <div class="preview-title" :style="{ fontFamily: formData.fontTitle }">演示文稿标题</div>
            <div class="preview-subtitle" :style="{ fontFamily: formData.fontSubtitle }">副标题示例文本</div>
            <div class="preview-content" :style="{ fontFamily: formData.fontContent }">这是正文内容，用于展示主要信息和详细描述。</div>
            <div class="preview-caption" :style="{ fontFamily: formData.fontCaption }">这是注释说明</div>
          </div>
        </div>

        <!-- 文字样式方案 -->
        <div class="form-section">
          <label class="form-label">文字样式方案</label>
          <div class="text-style-options">
            <div
              v-for="option in textStyleOptions"
              :key="option.value"
              class="text-style-option"
              :class="{ active: formData.textStyle === option.value }"
              @click="formData.textStyle = option.value"
            >
              <div class="option-icon">{{ option.icon }}</div>
              <div class="option-info">
                <div class="option-name">{{ option.name }}</div>
                <div class="option-desc">{{ option.desc }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 遮罩透明度选择（仅半透明遮罩样式时显示） -->
        <div class="form-section" v-if="formData.textStyle === 'transparent_overlay'">
          <label class="form-label">遮罩透明度: {{ formData.overlayTransparency }}%</label>
          <div class="slider-group">
            <input
              type="range"
              v-model.number="formData.overlayTransparency"
              min="10"
              max="80"
              step="5"
              class="slider"
            />
            <span class="slider-value">{{ formData.overlayTransparency }}%</span>
          </div>
        </div>

        <!-- 阴影颜色选择（仅文字阴影样式时显示） -->
        <div class="form-section" v-if="formData.textStyle === 'shadow'">
          <label class="form-label">阴影颜色</label>
          <div class="theme-colors">
            <div
              v-for="color in shadowColors"
              :key="color.value"
              class="theme-color"
              :class="{ active: formData.shadowColor === color.value }"
              :style="{ background: color.value }"
              @click="formData.shadowColor = color.value"
            >
              <span v-if="formData.shadowColor === color.value" class="check">✓</span>
            </div>
          </div>
        </div>

        <!-- 智能布局模式开关 -->
        <div class="form-section">
          <label class="form-label">生成模式</label>
          <div class="mode-toggle">
            <div
              class="mode-option"
              :class="{ active: !formData.useSmartLayout }"
              @click="formData.useSmartLayout = false"
            >
              <span class="mode-icon">🎨</span>
              <span class="mode-name">AI智能生成</span>
              <span class="mode-desc">火山引擎AI生成精美SVG</span>
            </div>
            <div
              class="mode-option"
              :class="{ active: formData.useSmartLayout }"
              @click="formData.useSmartLayout = true"
            >
              <span class="mode-icon">📐</span>
              <span class="mode-name">智能布局模式</span>
              <span class="mode-desc">8种布局+自动配色</span>
            </div>
          </div>
        </div>

        <!-- 生成模式选择 -->
        <div class="form-section">
          <label class="form-label">
            生成模式
            <span class="label-tip">选择生成速度和输出质量</span>
          </label>
          <div class="generation-mode-grid">
            <div
              v-for="mode in generationModeOptions"
              :key="mode.value"
              class="generation-mode-card"
              :class="{ active: formData.generationMode === mode.value }"
              :data-testid="`generation-mode-${mode.value}`"
              :aria-label="`${mode.name}: ${mode.desc}`"
              @click="formData.generationMode = mode.value"
            >
              <span class="mode-icon">{{ mode.icon }}</span>
              <span class="mode-name">{{ mode.name }}</span>
              <span class="mode-desc">{{ mode.desc }}</span>
              <span class="mode-time">{{ mode.time }}</span>
            </div>
          </div>
        </div>

        <!-- 输出格式选择 -->
        <div class="form-section">
          <label class="form-label">
            输出格式
            <span class="label-tip">选择导出文件格式</span>
          </label>
          <div class="output-format-grid">
            <div
              v-for="fmt in outputFormatOptions"
              :key="fmt.value"
              class="output-format-card"
              :class="{ active: formData.outputFormat === fmt.value }"
              :data-testid="`output-format-${fmt.value}`"
              :aria-label="`${fmt.name}: ${fmt.desc}`"
              @click="formData.outputFormat = fmt.value"
            >
              <span class="format-icon">{{ fmt.icon }}</span>
              <span class="format-name">{{ fmt.name }}</span>
              <span class="format-desc">{{ fmt.desc }}</span>
            </div>
          </div>
        </div>

        <!-- 质量选择 -->
        <div class="form-section">
          <label class="form-label">
            输出质量
            <span class="label-tip">选择输出分辨率</span>
          </label>
          <div class="quality-toggle">
            <div
              v-for="q in qualityOptions"
              :key="q.value"
              class="quality-option"
              :class="{ active: formData.quality === q.value }"
              :data-testid="`quality-${q.value}`"
              :aria-label="`${q.name} ${q.dpi}`"
              @click="formData.quality = q.value"
            >
              <span class="quality-name">{{ q.name }}</span>
              <span class="quality-dpi">{{ q.dpi }}</span>
              <span class="quality-desc">{{ q.desc }}</span>
            </div>
          </div>
        </div>

        <!-- 背景颜色设置 -->
        <div class="form-section" v-if="formData.useSmartLayout">
          <label class="form-label">页面背景设置</label>
          <div class="background-mode-toggle">
            <div
              class="bg-mode-option"
              :class="{ active: formData.backgroundMode === '统一' }"
              @click="formData.backgroundMode = '统一'"
            >
              <span class="bg-mode-name">统一背景</span>
              <span class="bg-mode-desc">所有页面使用相同背景</span>
            </div>
            <div
              class="bg-mode-option"
              :class="{ active: formData.backgroundMode === '自定义' }"
              @click="formData.backgroundMode = '自定义'"
            >
              <span class="bg-mode-name">自定义每页</span>
              <span class="bg-mode-desc">单独设置每页背景</span>
            </div>
          </div>

          <!-- 统一背景模式 -->
          <div v-if="formData.backgroundMode === '统一'" class="unified-bg-setting">
            <label class="form-label-sub">统一背景颜色</label>
            <div class="theme-colors">
              <div
                v-for="color in backgroundColors"
                :key="color.value"
                class="theme-color"
                :class="{ active: formData.unifiedBackground === color.value }"
                :style="{ background: color.value }"
                @click="formData.unifiedBackground = color.value"
              >
                <span v-if="formData.unifiedBackground === color.value" class="check">✓</span>
              </div>
            </div>
          </div>

          <!-- 自定义每页背景 -->
          <div v-if="formData.backgroundMode === '自定义'" class="custom-bg-setting">
            <div
              v-for="i in formData.slideCount"
              :key="i"
              class="slide-bg-item"
            >
              <span class="slide-index">第 {{ i }} 页</span>
              <div class="theme-colors">
                <div
                  v-for="color in backgroundColors"
                  :key="color.value"
                  class="theme-color theme-color-sm"
                  :class="{ active: formData.slideBackgrounds[i-1] === color.value }"
                  :style="{ background: color.value }"
                  @click="formData.slideBackgrounds[i-1] = color.value"
                >
                  <span v-if="formData.slideBackgrounds[i-1] === color.value" class="check">✓</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 布局类型设置 -->
        <div class="form-section" v-if="formData.useSmartLayout">
          <label class="form-label">页面布局设置</label>
          <div class="background-mode-toggle">
            <div
              class="bg-mode-option"
              :class="{ active: formData.layoutMode === '统一' }"
              @click="formData.layoutMode = '统一'"
            >
              <span class="bg-mode-name">统一布局</span>
              <span class="bg-mode-desc">所有页面使用相同布局</span>
            </div>
            <div
              class="bg-mode-option"
              :class="{ active: formData.layoutMode === '自定义' }"
              @click="formData.layoutMode = '自定义'"
            >
              <span class="bg-mode-name">自定义每页</span>
              <span class="bg-mode-desc">单独设置每页布局</span>
            </div>
          </div>

          <!-- 统一布局模式 -->
          <div v-if="formData.layoutMode === '统一'" class="unified-layout-setting">
            <label class="form-label-sub">统一布局类型</label>
            <div class="layout-options">
              <div
                v-for="layout in layoutOptions"
                :key="layout.value"
                class="layout-option"
                :class="{ active: formData.unifiedLayout === layout.value }"
                @click="formData.unifiedLayout = layout.value"
              >
                <span class="layout-icon">{{ layout.icon }}</span>
                <span class="layout-name">{{ layout.name }}</span>
              </div>
            </div>
          </div>

          <!-- 自定义每页布局 -->
          <div v-if="formData.layoutMode === '自定义'" class="custom-layout-setting">
            <div
              v-for="i in formData.slideCount"
              :key="i"
              class="slide-layout-item"
            >
              <span class="slide-index">第 {{ i }} 页</span>
              <div class="layout-options layout-options-sm">
                <div
                  v-for="layout in layoutOptions"
                  :key="layout.value"
                  class="layout-option layout-option-sm"
                  :class="{ active: formData.slideLayouts[i-1] === layout.value }"
                  @click="formData.slideLayouts[i-1] = layout.value"
                >
                  <span class="layout-icon">{{ layout.icon }}</span>
                  <span class="layout-name">{{ layout.name }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 素材选择 -->
        <div class="form-section" v-if="pptImages.length > 0">
          <label class="form-label">我的素材</label>
          <div class="ppt-images-grid">
            <div
              v-for="img in pptImages"
              :key="img.id"
              class="ppt-image-item"
              :class="{ selected: selectedPptImages.includes(img.url) }"
              @click="togglePptImage(img.url)"
            >
              <img :src="img.url" :alt="img.name" />
              <span class="ppt-image-check" v-if="selectedPptImages.includes(img.url)">✓</span>
            </div>
          </div>
          <p class="ppt-images-tip">点击选择图片，生成的PPT将优先使用这些图片</p>
          <button class="btn btn-sm btn-outline" @click="clearPptImages">清空素材</button>
        </div>

        <!-- 提交按钮 -->
        <div class="form-actions">
          <button
            class="btn btn-outline btn-lg"
            :disabled="!isValid || isSubmitting"
            @click="editOutline"
          >
            📝 编辑大纲
          </button>
          <button
            class="btn btn-primary btn-lg"
            :disabled="!isValid || isSubmitting"
            @click="handleSubmit"
          >
            <span v-if="isSubmitting" class="spinner"></span>
            <span v-else>✨ 开始生成</span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- 错误弹窗 -->
  <Teleport to="body">
    <div v-if="showErrorModal" class="error-modal-overlay" @click.self="showErrorModal = false">
      <div class="error-modal">
        <div class="error-icon" :class="errorType">
          {{ errorType === 'network' ? '📡' : errorType === 'validation' ? '⚠️' : '🔧' }}
        </div>
        <h3>出错了</h3>
        <p class="error-text">{{ errorMessage }}</p>
        <div class="error-hint" v-if="errorType === 'network'">
          <ul>
            <li>检查网络连接是否正常</li>
            <li>确认防火墙没有阻止请求</li>
          </ul>
        </div>
        <div class="error-actions">
          <button class="btn btn-primary" @click="handleSubmit">
            🔄 重试
          </button>
          <button class="btn btn-secondary" @click="showErrorModal = false">
            关闭
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useKeyboardShortcuts } from '../composables/useKeyboardShortcuts'
import { useStatistics } from '../composables/useStatistics'
import { useAutoSave } from '../composables/useAutoSave'
import { useSmartRecommendation } from '../composables/useSmartRecommendation'
import { useInteractionFeedback } from '../composables/useInteractionFeedback'
import { useRouter, useRoute } from 'vue-router'
import { api } from '../api/client'
import ThemePanel from '../components/ThemePanel.vue'

const router = useRouter()
const route = useRoute()

// Toast notifications
const { showSuccess, showError, showInfo } = useInteractionFeedback()

// 表单数据
const formData = ref<{
  userRequest: string
  slideCount: number
  scene: string
  style: string
  template: string
  themeColor: string
  textStyle: string
  shadowColor: string
  overlayTransparency: number
  useSmartLayout: boolean
  backgroundMode: string
  unifiedBackground: string
  slideBackgrounds: string[]
  layoutMode: string
  unifiedLayout: string
  slideLayouts: string[]
  includeCharts: boolean
  includePieChart: boolean
  includeBarChart: boolean
  includeLineChart: boolean
  addWatermark: boolean
  // 字体系统4级设置
  fontTitle: string
  fontSubtitle: string
  fontContent: string
  fontCaption: string
  fontLevel: number
  // 生成模式
  generationMode: string
  outputFormat: string
  quality: string
}>({
  userRequest: '',
  slideCount: 10,
  scene: 'business',
  style: 'professional',
  template: 'default',
  themeColor: '#165DFF',
  textStyle: 'transparent_overlay',
  shadowColor: '#000000',
  // 生成模式
  generationMode: 'standard',
  outputFormat: 'pptx',
  quality: 'standard',
  overlayTransparency: 30,
  useSmartLayout: false,
  backgroundMode: '统一',  // 统一或自定义
  unifiedBackground: '#165DFF',  // 统一背景色
  slideBackgrounds: [],  // 每页背景色数组
  // 字体系统4级设置
  fontTitle: '思源黑体',
  fontSubtitle: '思源黑体',
  fontContent: '思源宋体',
  fontCaption: '思源黑体',
  fontLevel: 1,
  layoutMode: '统一',  // 统一或自定义
  unifiedLayout: 'content_card',  // 统一布局
  slideLayouts: [],  // 每页布局数组
  includeCharts: false,  // 包含图表
  includePieChart: true,  // 饼图
  includeBarChart: true,  // 柱状图
  includeLineChart: false,  // 折线图
  addWatermark: false  // 添加水印
})

// PPT素材
const pptImages = ref<{ id: string; url: string; name: string }[]>([])
const selectedPptImages = ref<string[]>([])

// 加载PPT素材
const loadPptImages = () => {
  const saved = localStorage.getItem('ppt_images')
  if (saved) {
    pptImages.value = JSON.parse(saved)
  }
}

// 切换选择图片
const togglePptImage = (url: string) => {
  const index = selectedPptImages.value.indexOf(url)
  if (index > -1) {
    selectedPptImages.value.splice(index, 1)
  } else {
    selectedPptImages.value.push(url)
  }
}

// 清空素材
const clearPptImages = () => {
  localStorage.removeItem('ppt_images')
  pptImages.value = []
  selectedPptImages.value = []
}

// 验证错误
const errors = ref({
  userRequest: ''
})

// 提交状态
const isSubmitting = ref(false)

// 草稿保存状态
const draftSaved = ref(false)

// 高级参数折叠状态
const showAdvancedParams = ref(false)

// AI 智能推荐
const showRecommendation = ref(false)
const { recommendations, analyzeRequest } = useSmartRecommendation()

// 应用推荐
const applyRecommendation = (rec: any) => {
  if (rec.type === 'scene') {
    formData.value.scene = rec.value
  } else if (rec.type === 'style') {
    formData.value.style = rec.value
  } else if (rec.type === 'template') {
    formData.value.template = rec.value
  }
  showRecommendation.value = false
}

// 获取推荐类型名称
const getRecTypeName = (type: string) => {
  const names: Record<string, string> = {
    scene: '场景',
    style: '风格',
    template: '模板'
  }
  return names[type] || type
}

// 获取推荐值名称
const getRecValueName = (rec: any) => {
  if (rec.type === 'scene') {
    const names: Record<string, string> = {
      business: '💼 商务',
      education: '📚 教育',
      tech: '🚀 科技',
      creative: '💡 创意'
    }
    return names[rec.value] || rec.value
  }
  if (rec.type === 'style') {
    const names: Record<string, string> = {
      professional: '专业',
      simple: '简约',
      energetic: '活力',
      premium: '高端',
      creative: '创意'
    }
    return names[rec.value] || rec.value
  }
  return rec.value
}

// 主题定制事件处理
const onThemeChange = (colors: { primary: string; secondary: string; accent: string }) => {
  formData.value.themeColor = colors.primary
  // Also update background if unified
  if (formData.value.backgroundMode === '统一') {
    formData.value.unifiedBackground = colors.primary
  }
  // Save to localStorage
  localStorage.setItem('customTheme', JSON.stringify(colors))
}

const onDarkModeChange = (mode: string) => {
  // ThemePanel handles DOM updates, just log for tracking
  console.log('[CreateView] Dark mode changed to:', mode)
}

const onFontChange = (fonts: { header: string; body: string }) => {
  // Apply header font to title
  formData.value.fontTitle = fonts.header
  // Apply body font to content
  formData.value.fontContent = fonts.body
  // Save pairing
  localStorage.setItem('activePairing', JSON.stringify(fonts))
}

// 获取当前字体级别对应的字体
const getCurrentFont = () => {
  const levelMap: Record<number, string> = {
    1: formData.value.fontTitle,
    2: formData.value.fontSubtitle,
    3: formData.value.fontContent,
    4: formData.value.fontCaption
  }
  return levelMap[formData.value.fontLevel] || '思源黑体'
}

// 错误弹窗状态
const showErrorModal = ref(false)
const errorMessage = ref('')
const errorType = ref<'network' | 'validation' | 'server'>('network')

// API加载的配置数据（模板/场景/风格）
// BUG修复: 从后端API加载，而不是硬编码
const apiTemplates = ref<Array<{value: string; name: string; icon: string; preview: string; desc: string}>>([])
const apiScenes = ref<Array<{id: string; name: string}>>([])
const apiStyles = ref<Array<{id: string; name: string}>>([])
const configsLoaded = ref(false)

// 加载配置从后端API
const loadConfigsFromAPI = async () => {
  try {
    const [templatesRes, scenesRes, stylesRes] = await Promise.all([
      api.ppt.getTemplates().catch(() => null),
      api.ppt.getScenes().catch(() => null),
      api.ppt.getStyles().catch(() => null)
    ])

    // 转换模板数据
    if (templatesRes?.data && Array.isArray(templatesRes.data)) {
      apiTemplates.value = templatesRes.data.map((t: any) => ({
        value: t.id,
        name: t.name,
        icon: '📊',
        preview: t.colors && t.colors[0] ? `linear-gradient(135deg, ${t.colors[0]}, ${t.colors[1] || t.colors[0]})` : 'linear-gradient(135deg, #667eea, #764ba2)',
        desc: t.description || t.name
      }))
    }

    // 转换场景数据
    if (scenesRes?.data && Array.isArray(scenesRes.data)) {
      apiScenes.value = scenesRes.data.map((s: any) => ({
        id: s.id,
        name: s.name
      }))
    }

    // 转换风格数据
    if (stylesRes?.data && Array.isArray(stylesRes.data)) {
      apiStyles.value = stylesRes.data.map((s: any) => ({
        id: s.id,
        name: s.name
      }))
    }

    configsLoaded.value = true
    console.log('[CreateView] 配置已从API加载:', {
      templates: apiTemplates.value.length,
      scenes: apiScenes.value.length,
      styles: apiStyles.value.length
    })
  } catch (e) {
    console.warn('[CreateView] 从API加载配置失败，使用硬编码兜底:', e)
    configsLoaded.value = true  // 标记已尝试加载，避免重复
  }
}

// 使用API数据或硬编码兜底（computed确保响应式）
const templateOptionsComputed = computed(() => {
  return apiTemplates.value.length > 0 ? apiTemplates.value : templateOptions
})

// 友好的错误消息映射
const getFriendlyError = (error: any): { message: string; type: 'network' | 'validation' | 'server' } => {
  const status = error.response?.status
  const detail = error.response?.data?.detail

  if (!status || status === 0) {
    return {
      message: '网络连接失败，请检查您的网络设置',
      type: 'network'
    }
  }

  if (status === 400) {
    return {
      message: detail || '请求参数有误，请检查输入内容',
      type: 'validation'
    }
  }

  if (status === 422) {
    // Pydantic 验证错误，提取关键字段信息
    let errMsg = '参数验证失败'
    if (Array.isArray(detail)) {
      const msgs = detail.map((e: any) => `${e.loc?.join('.')}: ${e.msg}`).join('; ')
      errMsg = msgs || '参数验证失败'
    } else if (typeof detail === 'string') {
      errMsg = detail
    }
    return {
      message: errMsg,
      type: 'validation'
    }
  }

  if (status === 401) {
    return {
      message: '登录状态已过期，请刷新页面重试',
      type: 'server'
    }
  }

  if (status === 429) {
    return {
      message: '请求过于频繁，请稍后再试',
      type: 'server'
    }
  }

  if (status >= 500) {
    return {
      message: '服务器繁忙，请稍后重试',
      type: 'server'
    }
  }

  return {
    message: detail || '操作失败，请重试',
    type: 'server'
  }
}

// 字体系统选项 - 4级字体设置
const fontLevelOptions = [
  { value: 1, name: '一级字体', desc: '标题字体', font: '思源黑体 Bold', size: '56px' },
  { value: 2, name: '二级字体', desc: '副标题字体', font: '思源黑体 Medium', size: '40px' },
  { value: 3, name: '三级字体', desc: '正文字体', font: '思源宋体 Regular', size: '24px' },
  { value: 4, name: '四级字体', desc: '注释字体', font: '思源黑体 Light', size: '16px' }
]

// 字体族选项
const fontFamilyOptions = [
  { value: '思源黑体', name: '思源黑体', desc: '现代黑体，适合标题' },
  { value: '思源宋体', name: '思源宋体', desc: '传统宋体，适合正文' },
  { value: 'Noto Sans SC', name: 'Noto Sans', desc: '无衬线字体' },
  { value: 'Noto Serif SC', name: 'Noto Serif', desc: '衬线字体' },
  { value: '阿里巴巴普惠体', name: '阿里巴巴普惠体', desc: '阿里免费字体' },
  { value: '站酷高端黑', name: '站酷高端黑', desc: '创意黑体' },
  { value: '站酷快乐体', name: '站酷快乐体', desc: '手写风格' },
  { value: 'OPPOSans', name: 'OPPO Sans', desc: 'OPPO字体' }
]

// 主题色选项
const themeColors = [
  { value: '#165DFF', name: '科技蓝' },
  { value: '#34C759', name: '自然绿' },
  { value: '#FF9500', name: '活力橙' },
  { value: '#FF3B30', name: '热情红' },
  { value: '#AF52DE', name: '神秘紫' },
  { value: '#1A1A1A', name: '经典黑' },
  { value: '#5856D6', name: '暗夜紫' },
  { value: '#00B96B', name: '清新薄荷' },
  { value: '#FF2D55', name: '玫瑰粉' },
  { value: '#FFD60A', name: '阳光黄' },
  { value: '#64D2FF', name: '天空蓝' },
  { value: '#BF5AF2', name: '荧光紫' },
  { value: '#FF6B6B', name: '珊瑚红' },
  { value: '#4ECDC4', name: '海洋青' },
  { value: '#45B7D1', name: '天际蓝' },
  { value: '#96CEB4', name: '森林绿' }
]

// 模板选项
const templateOptions = [
  { value: 'default', name: '默认商务', icon: '📊', preview: 'linear-gradient(135deg, #667eea, #764ba2)', desc: '通用商务风格' },
  { value: 'modern', name: '现代简约', icon: '✨', preview: 'linear-gradient(135deg, #11998e, #38ef7d)', desc: '清新简洁风格' },
  { value: 'tech', name: '科技未来', icon: '🚀', preview: 'linear-gradient(135deg, #0f0c29, #302b63)', desc: '酷炫科技风格' },
  { value: 'classic', name: '经典大气', icon: '👔', preview: 'linear-gradient(135deg, #232526, #414345)', desc: '沉稳正式风格' },
  { value: 'nature', name: '自然清新', icon: '🌿', preview: 'linear-gradient(135deg, #56ab2f, #a8e063)', desc: '自然绿色风格' },
  { value: 'ocean', name: '海洋商务', icon: '🌊', preview: 'linear-gradient(135deg, #2193b0, #6dd5ed)', desc: '蓝色商务风格' },
  { value: 'sunset', name: '日落暖阳', icon: '🌅', preview: 'linear-gradient(135deg, #f093fb, #f5576c)', desc: '暖色调风格' },
  { value: 'minimal', name: '极简黑白', icon: '⬛', preview: 'linear-gradient(135deg, #304352, #d7d2cc)', desc: '极简主义风格' }
]

// 文字样式选项
const textStyleOptions = [
  {
    value: 'transparent_overlay',
    name: '半透明遮罩',
    desc: '在图片上添加半透明黑色层，文字更清晰',
    icon: '🎨'
  },
  {
    value: 'shadow',
    name: '文字阴影',
    desc: '白色文字带阴影效果，图片上清晰可见',
    icon: '✨'
  },
  {
    value: 'glow',
    name: '发光效果',
    desc: '文字边缘发光效果，科技感强',
    icon: '💫'
  },
  {
    value: 'outline',
    name: '描边效果',
    desc: '文字外描边，内部镂空，潮流风格',
    icon: '✏️'
  },
  {
    value: 'gradient',
    name: '渐变文字',
    desc: '文字使用渐变色，视觉冲击力强',
    icon: '🌈'
  },
  {
    value: 'neon',
    name: '霓虹灯效',
    desc: '霓虹灯效果文字，适合暗色背景',
    icon: '🌃'
  }
]

// 阴影颜色选项
const shadowColors = [
  { value: '#000000', name: '黑色' },
  { value: '#333333', name: '深灰' },
  { value: '#FFFF00', name: '黄色' },
  { value: '#FF0000', name: '红色' },
  { value: '#165DFF', name: '蓝色' },
  { value: '#34C759', name: '绿色' },
  { value: '#FF9500', name: '橙色' }
]

// 背景颜色选项
const backgroundColors = [
  { value: '#165DFF', name: '科技蓝' },
  { value: '#34C759', name: '自然绿' },
  { value: '#FF9500', name: '活力橙' },
  { value: '#FF3B30', name: '热情红' },
  { value: '#AF52DE', name: '神秘紫' },
  { value: '#1A1A1A', name: '经典黑' },
  { value: '#5856D6', name: '暗紫色' },
  { value: '#FFFFFF', name: '纯白色' }
]

// 布局类型选项
// 生成模式选项
const generationModeOptions = [
  { value: 'standard', name: '标准模式', icon: '⚡', desc: '平衡速度和质量，适合大多数场景', time: '约3-5分钟' },
  { value: 'fast', name: '快速模式', icon: '🚀', desc: '快速生成，适合预览和初稿', time: '约1-2分钟' },
  { value: 'quality', name: '高清模式', icon: '🎬', desc: '高清输出，适合正式演示', time: '约8-10分钟' },
  { value: 'stream', name: '流式模式', icon: '🌊', desc: '实时流式输出，边生成边预览', time: '实时' }
]

// 输出格式选项
const outputFormatOptions = [
  { value: 'pptx', name: 'PPTX', icon: '📊', desc: 'PowerPoint格式，可编辑' },
  { value: 'pdf', name: 'PDF', icon: '📄', desc: 'PDF格式，便于分享' },
  { value: 'svg', name: 'SVG', icon: '🎨', desc: '矢量格式，高清无损' },
  { value: 'png', name: 'PNG', icon: '🖼️', desc: '图片格式，高清图片' }
]

// 质量选项
const qualityOptions = [
  { value: 'standard', name: '标准', dpi: '1080p', desc: '适合屏幕展示' },
  { value: 'high', name: '高清', dpi: '1440p', desc: '适合大屏展示' },
  { value: 'ultra', name: '超清', dpi: '4K', desc: '适合打印输出' }
]

const layoutOptions = [
  { value: 'title_slide', name: '封面', icon: '📄', desc: '标题封面页', preview: 'full' },
  { value: 'content_card', name: '卡片', icon: '🃏', desc: '内容卡片布局', preview: 'card' },
  { value: 'two_column', name: '双栏', icon: '📊', desc: '左右双栏布局', preview: 'split' },
  { value: 'center_radiation', name: '中心辐射', icon: '🌀', desc: '中心发散布局', preview: 'radial' },
  { value: 'timeline', name: '时间线', icon: '📅', desc: '时间轴布局', preview: 'timeline' },
  { value: 'data_visualization', name: '数据可视化', icon: '📈', desc: '图表数据展示', preview: 'chart' },
  { value: 'quote', name: '金句', icon: '💬', desc: '引用金句布局', preview: 'quote' },
  { value: 'comparison', name: '对比', icon: '⚖️', desc: '左右对比布局', preview: 'compare' },
  { value: 'masonry', name: '瀑布流', icon: '🧱', desc: '不规则网格布局', preview: 'masonry' },
  { value: 'full_image', name: '全屏图', icon: '🖼️', desc: '全屏图片背景布局', preview: 'fullimg' },
  { value: 'process', name: '流程图', icon: '🔀', desc: '流程步骤展示布局', preview: 'process' },
  { value: 'team', name: '团队介绍', icon: '👥', desc: '人物卡片展示布局', preview: 'team' }
]

// 验证输入
const validateRequest = () => {
  if (!formData.value.userRequest.trim()) {
    errors.value.userRequest = '请输入需求描述'
  } else if (formData.value.userRequest.length < 10) {
    errors.value.userRequest = '需求描述至少需要 10 个字符'
  } else {
    errors.value.userRequest = ''
  }
}

// 表单是否有效
const isValid = computed(() => {
  return formData.value.userRequest.length >= 10 && formData.value.userRequest.length <= 2000
})

// 编辑大纲
const editOutline = () => {
  validateRequest()
  if (!isValid.value) return

  // 保存完整参数到 localStorage（备用）- 包含所有生成选项
  localStorage.setItem('ppt_outline_temp', JSON.stringify({
    // 基础参数
    scene: formData.value.scene,
    style: formData.value.style,
    template: formData.value.template,
    themeColor: formData.value.themeColor,
    // 字体系统
    fontTitle: formData.value.fontTitle,
    fontSubtitle: formData.value.fontSubtitle,
    fontContent: formData.value.fontContent,
    fontCaption: formData.value.fontCaption,
    // 文字样式
    textStyle: formData.value.textStyle,
    shadowColor: formData.value.shadowColor,
    overlayTransparency: formData.value.overlayTransparency,
    // 布局设置
    useSmartLayout: formData.value.useSmartLayout,
    layoutMode: formData.value.layoutMode === '统一' ? 'auto' : 'manual',
    // 生成设置
    generationMode: formData.value.generationMode,
    outputFormat: formData.value.outputFormat,
    quality: formData.value.quality
  }))

  // 跳转到大纲编辑页面，传递所有参数
  // BUG修复: 之前只传递了5个参数，现在传递完整生成选项
  router.push({
    path: '/outline',
    query: {
      request: formData.value.userRequest,
      style: formData.value.style,
      scene: formData.value.scene,
      template: formData.value.template,
      themeColor: formData.value.themeColor,
      // 新增：字体参数
      fontTitle: formData.value.fontTitle,
      fontSubtitle: formData.value.fontSubtitle,
      fontContent: formData.value.fontContent,
      fontCaption: formData.value.fontCaption,
      // 新增：样式参数
      textStyle: formData.value.textStyle,
      shadowColor: formData.value.shadowColor,
      overlayTransparency: String(formData.value.overlayTransparency),
      // 新增：布局参数
      useSmartLayout: String(formData.value.useSmartLayout),
      layoutMode: formData.value.layoutMode === '统一' ? 'auto' : 'manual',
      // 新增：生成参数
      generationMode: formData.value.generationMode,
      outputFormat: formData.value.outputFormat,
      quality: formData.value.quality,
      slideCount: String(formData.value.slideCount)
    }
  })
}

// 提交
const handleSubmit = async () => {
  validateRequest()
  if (!isValid.value) return

  isSubmitting.value = true

  // 构建背景设置
  let slideBackgrounds = null
  if (formData.value.useSmartLayout) {
    if (formData.value.backgroundMode === '统一') {
      // 统一背景：所有页面使用相同颜色
      slideBackgrounds = []
      for (let i = 0; i < formData.value.slideCount; i++) {
        slideBackgrounds.push({
          slide_index: i,
          background_type: 'color',
          background_color: formData.value.unifiedBackground
        })
      }
    } else {
      // 自定义每页背景
      slideBackgrounds = []
      for (let i = 0; i < formData.value.slideCount; i++) {
        slideBackgrounds.push({
          slide_index: i,
          background_type: 'color',
          background_color: formData.value.slideBackgrounds[i] || formData.value.themeColor
        })
      }
    }
  }

  // 构建布局设置
  let slideLayouts = null
  if (formData.value.useSmartLayout) {
    if (formData.value.layoutMode === '统一') {
      // 统一布局：所有页面使用相同布局
      slideLayouts = []
      for (let i = 0; i < formData.value.slideCount; i++) {
        // 首页强制使用封面布局
        const layout = i === 0 ? 'title_slide' : formData.value.unifiedLayout
        slideLayouts.push({
          slide_index: i,
          layout_type: layout
        })
      }
    } else {
      // 自定义每页布局
      slideLayouts = []
      for (let i = 0; i < formData.value.slideCount; i++) {
        // 首页强制使用封面布局
        const layout = i === 0 ? 'title_slide' : (formData.value.slideLayouts[i] || formData.value.unifiedLayout)
        slideLayouts.push({
          slide_index: i,
          layout_type: layout
        })
      }
    }
  }

  try {
    const response = await api.ppt.createTask({
      user_request: formData.value.userRequest,
      slide_count: formData.value.slideCount,
      scene: formData.value.scene,
      style: formData.value.style,
      template: formData.value.template,
      theme_color: formData.value.themeColor,
      text_style: formData.value.textStyle,
      shadow_color: formData.value.shadowColor,
      overlay_transparency: formData.value.overlayTransparency,
      use_smart_layout: formData.value.useSmartLayout,
      slide_backgrounds: slideBackgrounds,
      slide_layouts: slideLayouts,
      include_charts: formData.value.includeCharts,
      include_pie_chart: formData.value.includePieChart,
      include_bar_chart: formData.value.includeBarChart,
      include_line_chart: formData.value.includeLineChart,
      add_watermark: formData.value.addWatermark,
      // 字体系统4级设置
      font_title: formData.value.fontTitle,
      font_subtitle: formData.value.fontSubtitle,
      font_content: formData.value.fontContent,
      font_caption: formData.value.fontCaption,
      // 布局模式
      layout_mode: formData.value.layoutMode === '统一' ? 'auto' : 'manual',
      unified_layout: formData.value.layoutMode === '统一',
      // 生成模式
      generation_mode: formData.value.generationMode,
      output_format: formData.value.outputFormat,
      quality: formData.value.quality
    })

    const { task_id } = response.data

    // 保存到历史记录
    const history = JSON.parse(localStorage.getItem('ppt_history') || '[]')
    history.unshift({
      taskId: task_id,
      title: formData.value.userRequest.substring(0, 20),
      request: formData.value.userRequest,
      slideCount: formData.value.slideCount,
      style: formData.value.style,
      createdAt: new Date().toISOString()
    })
    // 只保留最近20条
    if (history.length > 20) history.pop()
    localStorage.setItem('ppt_history', JSON.stringify(history))

    // 记录统计数据
    const { recordGeneration } = useStatistics()
    recordGeneration(formData.value.slideCount, formData.value.style)

    // 跳转到生成页面
    router.push({
      path: '/generating',
      query: { taskId: task_id }
    })
  } catch (error: any) {
    isSubmitting.value = false
    console.error('生成PPT失败:', error?.response?.data || error)
    const friendlyError = getFriendlyError(error)
    errorMessage.value = friendlyError.message
    errorType.value = friendlyError.type
    showErrorModal.value = true
    showError('生成失败', friendlyError.message)
  } finally {
    isSubmitting.value = false
  }
}

// 自动保存草稿 - 必须在 setup 顶层调用
const { loadDraft, setupAutoSave, saveDraft: doSaveDraft, cleanup: cleanupAutoSave } = useAutoSave({
  key: 'create',
  data: formData,
  debounceMs: 2000,
  excludeKeys: ['userRequest']
})

// 页面加载时检查是否有场景参数
onMounted(() => {
  if (route.query.scene) {
    formData.value.scene = route.query.scene as string
  }
  // 加载PPT素材
  loadPptImages()
  // BUG修复: 从后端API加载模板/场景/风格配置
  loadConfigsFromAPI()

  // 加载草稿（如果有）
  const draft = loadDraft()
  if (draft) {
    // 只恢复非用户输入的设置
    formData.value.slideCount = draft.slideCount || formData.value.slideCount
    formData.value.scene = draft.scene || formData.value.scene
    formData.value.style = draft.style || formData.value.style
    formData.value.template = draft.template || formData.value.template
    formData.value.themeColor = draft.themeColor || formData.value.themeColor
    formData.value.textStyle = draft.textStyle || formData.value.textStyle
    formData.value.useSmartLayout = draft.useSmartLayout ?? formData.value.useSmartLayout
    formData.value.backgroundMode = draft.backgroundMode || formData.value.backgroundMode
    formData.value.layoutMode = draft.layoutMode || formData.value.layoutMode
    formData.value.includeCharts = draft.includeCharts ?? formData.value.includeCharts
    formData.value.addWatermark = draft.addWatermark ?? formData.value.addWatermark
  }

  // 启动自动保存
  setupAutoSave()

  // 监听数据变化并显示保存提示
  watch(formData, () => {
    draftSaved.value = true
    setTimeout(() => {
      draftSaved.value = false
    }, 3000)
  }, { deep: true })

  // 监听用户输入，显示AI推荐
  watch(() => formData.value.userRequest, (newVal) => {
    if (newVal && newVal.length >= 10) {
      recommendations.value = analyzeRequest(newVal)
      showRecommendation.value = recommendations.value.length > 0
    } else {
      showRecommendation.value = false
    }
  })
})

// 组件卸载时清理
onUnmounted(() => {
  cleanupAutoSave()
  // 离开前保存草稿
  doSaveDraft()
})

// 键盘快捷键
useKeyboardShortcuts([
  {
    key: 'Enter',
    ctrl: true,
    handler: () => {
      if (isValid.value && !isSubmitting.value) {
        handleSubmit()
      }
    },
    description: '提交表单'
  },
  {
    key: 's',
    ctrl: true,
    handler: () => {
      doSaveDraft()
      draftSaved.value = true
      showInfo('草稿已保存', 'Ctrl+S 快速保存')
      setTimeout(() => { draftSaved.value = false }, 3000)
    },
    description: '保存草稿 (Ctrl+S)'
  },
  {
    key: 'Escape',
    handler: () => {
      if (showErrorModal.value) {
        showErrorModal.value = false
      }
    },
    description: '关闭弹窗'
  }
])
</script>

<style scoped>
.create {
  min-height: 80vh;
  padding: 40px 0 80px;
  background: linear-gradient(180deg, #F5F5F5 0%, #fff 100%);
}

.create-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-title {
  font-size: 36px;
  font-weight: 700;
  color: #1A1A1A;
  margin-bottom: 8px;
}

.page-subtitle {
  font-size: 16px;
  color: #666;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.draft-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #E8F5E9;
  border-radius: 20px;
  font-size: 13px;
  color: #2E7D32;
}

.draft-icon {
  font-size: 12px;
}

.create-form {
  max-width: 700px;
  margin: 0 auto;
  background: #fff;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}

.form-section {
  margin-bottom: 28px;
}

.form-label {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
}

.form-hint {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 13px;
}

.label-tip {
  font-size: 12px;
  font-weight: normal;
  color: #999;
  margin-left: 8px;
}

.quick-examples {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.tip-label {
  font-size: 13px;
  color: #999;
}

.example-btn {
  padding: 4px 12px;
  background: #f0f7ff;
  border: 1px solid #d0e8ff;
  border-radius: 16px;
  font-size: 12px;
  color: #165DFF;
  cursor: pointer;
  transition: all 0.2s;
}

.example-btn:hover {
  background: #e0f0ff;
  border-color: #165DFF;
}

/* AI 智能推荐 */
.ai-recommendation {
  margin-top: 12px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f0f7ff, #fff5f0);
  border: 1px solid #e0d8ff;
  border-radius: 12px;
}

.recommendation-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 500;
  color: #165DFF;
}

.ai-icon {
  font-size: 16px;
}

.recommendation-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.recommendation-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #fff;
  border: 1px solid #d0d0d0;
  border-radius: 20px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.recommendation-btn:hover {
  border-color: #165DFF;
  background: #f0f7ff;
}

.rec-type {
  color: #999;
}

.rec-value {
  color: #333;
  font-weight: 500;
}

.chart-options {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.chart-type-select {
  margin-top: 12px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

@media (max-width: 600px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}

.slider-group {
  display: flex;
  align-items: center;
  gap: 16px;
}

.slider {
  flex: 1;
  height: 6px;
  -webkit-appearance: none;
  background: #E5E5E5;
  border-radius: 3px;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  background: linear-gradient(135deg, #165DFF, #5AC8FA);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(22, 93, 255, 0.3);
}

.slider-value {
  min-width: 60px;
  font-size: 15px;
  font-weight: 500;
  color: #165DFF;
}

/* 模板选择 */
.template-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.template-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s;
}

.template-preview {
  width: 100%;
  aspect-ratio: 16/9;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  border: 2px solid transparent;
}

.template-card.active .template-preview {
  border-color: #165DFF;
}

.template-icon {
  font-size: 24px;
}

.template-name {
  font-size: 13px;
  color: #333;
}

.template-card.active .template-name {
  color: #165DFF;
  font-weight: 500;
}

.theme-colors {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.theme-color {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  border: 3px solid transparent;
}

.theme-color:hover {
  transform: scale(1.1);
}

.theme-color.active {
  border-color: #333;
}

.check {
  color: #fff;
  font-weight: bold;
}

/* 文字样式选项 */
.text-style-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

@media (max-width: 600px) {
  .text-style-options {
    grid-template-columns: 1fr;
  }
}

.text-style-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border: 2px solid #E5E5E5;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.text-style-option:hover {
  border-color: #165DFF;
  background: #F0F7FF;
}

.text-style-option.active {
  border-color: #165DFF;
  background: #E6F0FF;
}

.option-icon {
  font-size: 24px;
}

.option-info {
  flex: 1;
}

.option-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.option-desc {
  font-size: 12px;
  color: #888;
  margin-top: 2px;
}

.form-actions {
  margin-top: 36px;
  text-align: center;
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-lg {
  padding: 16px 48px;
  font-size: 17px;
  min-width: 200px;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* 模式切换 */
.mode-toggle {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 600px) {
  .mode-toggle {
    grid-template-columns: 1fr;
  }
}

.mode-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 16px;
  border: 2px solid #E5E5E5;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.mode-option:hover {
  border-color: #165DFF;
  background: #F0F7FF;
}

.mode-option.active {
  border-color: #165DFF;
  background: #E6F0FF;
}

.mode-icon {
  font-size: 28px;
  margin-bottom: 8px;
}

.mode-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.mode-desc {
  font-size: 12px;
  color: #888;
}

/* 背景设置 */
.background-mode-toggle {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.bg-mode-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px;
  border: 2px solid #E5E5E5;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.bg-mode-option:hover {
  border-color: #165DFF;
}

.bg-mode-option.active {
  border-color: #165DFF;
  background: #E6F0FF;
}

.bg-mode-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.bg-mode-desc {
  font-size: 12px;
  color: #888;
}

.form-label-sub {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #666;
  margin-bottom: 8px;
  margin-top: 12px;
}

.unified-bg-setting {
  padding: 12px;
  background: #F9F9F9;
  border-radius: 8px;
}

.custom-bg-setting {
  max-height: 300px;
  overflow-y: auto;
  padding: 12px;
  background: #F9F9F9;
  border-radius: 8px;
}

.slide-bg-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #EEE;
}

.slide-bg-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.slide-index {
  min-width: 60px;
  font-size: 13px;
  font-weight: 500;
  color: #666;
}

.theme-color-sm {
  width: 32px;
  height: 32px;
}

/* 布局设置 */
.unified-layout-setting {
  margin-top: 12px;
}

.layout-options {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .layout-options {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .layout-option {
    padding: 10px 6px;
  }

  .layout-icon {
    font-size: 24px;
  }

  .layout-name {
    font-size: 13px;
  }

  .layout-options-sm {
    grid-template-columns: repeat(2, 1fr);
  }
}

.layout-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  border: 2px solid #E5E5E5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.layout-option:hover {
  border-color: #165DFF;
}

.layout-option.active {
  border-color: #165DFF;
  background: #E6F0FF;
}

.layout-icon {
  font-size: 20px;
  margin-bottom: 4px;
}

.layout-name {
  font-size: 12px;
  font-weight: 500;
  color: #333;
}

.custom-layout-setting {
  max-height: 300px;
  overflow-y: auto;
  padding: 12px;
  background: #F9F9F9;
  border-radius: 8px;
  margin-top: 12px;
}

.slide-layout-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #EEE;
}

.slide-layout-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.layout-options-sm {
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.layout-option-sm {
  padding: 8px 4px;
}

.layout-option-sm .layout-icon {
  font-size: 16px;
  margin-bottom: 2px;
}

.layout-option-sm .layout-name {
  font-size: 11px;
}

/* PPT素材 */
.ppt-images-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}

.ppt-image-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
}

.ppt-image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ppt-image-item.selected {
  border-color: #165DFF;
}

.ppt-image-check {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  background: #165DFF;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.ppt-images-tip {
  font-size: 13px;
  color: #666;
  margin-bottom: 12px;
}

.btn-sm {
  padding: 6px 16px;
  font-size: 13px;
}

.btn-outline {
  background: transparent;
  border: 1px solid #ddd;
  color: #666;
}

.btn-outline:hover {
  background: #f5f5f5;
}

@media (max-width: 768px) {
  .ppt-images-grid {
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
  animation: fadeIn 0.2s ease;
}

.error-modal {
  background: var(--white);
  border-radius: 20px;
  padding: 32px;
  text-align: center;
  max-width: 400px;
  margin: 20px;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.error-icon {
  font-size: 56px;
  margin-bottom: 16px;
}

.error-icon.network { animation: shake 0.5s ease; }

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.error-modal h3 {
  font-size: 22px;
  font-weight: 600;
  color: var(--gray-900);
  margin-bottom: 12px;
}

.error-text {
  font-size: 15px;
  color: var(--gray-500);
  margin-bottom: 16px;
  line-height: 1.6;
}

.error-hint {
  text-align: left;
  background: var(--gray-100);
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 20px;
}

.error-hint ul {
  margin: 0;
  padding-left: 20px;
}

.error-hint li {
  font-size: 13px;
  color: var(--gray-500);
  margin-bottom: 4px;
}

.error-hint li:last-child {
  margin-bottom: 0;
}

.error-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

/* 字体系统样式 */
.font-level-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.font-level-btn {
  flex: 1;
  padding: 12px 16px;
  background: #f5f5f5;
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.font-level-btn:hover {
  background: #e5e5e5;
}

.font-level-btn.active {
  background: #EEF2FF;
  border-color: #165DFF;
}

.level-num {
  font-size: 18px;
  font-weight: bold;
  color: #165DFF;
}

.level-name {
  font-size: 12px;
  color: #666;
}

.font-select-grid {
  margin-bottom: 16px;
}

.font-select-group {
  margin-bottom: 12px;
}

.form-label-sub {
  display: block;
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
  font-weight: 500;
}

.font-options {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 8px;
}

.font-option {
  padding: 12px;
  background: #f9f9f9;
  border: 2px solid #eee;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.font-option:hover {
  background: #f0f0f0;
  border-color: #ddd;
}

.font-option.active {
  background: #EEF2FF;
  border-color: #165DFF;
}

.font-option .font-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.font-option .font-desc {
  font-size: 11px;
  color: #999;
}

.font-preview {
  padding: 20px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  border-radius: 12px;
  color: white;
}

.font-preview .preview-title {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 8px;
}

.font-preview .preview-subtitle {
  font-size: 20px;
  margin-bottom: 12px;
  opacity: 0.9;
}

.font-preview .preview-content {
  font-size: 16px;
  line-height: 1.6;
  margin-bottom: 8px;
  opacity: 0.8;
}

.font-preview .preview-caption {
  font-size: 12px;
  opacity: 0.6;
}

/* 生成模式样式 */
.generation-mode-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.generation-mode-card {
  padding: 16px;
  background: #f9f9f9;
  border: 2px solid #eee;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
}

.generation-mode-card:hover {
  background: #f0f0f0;
  border-color: #ddd;
}

.generation-mode-card.active {
  background: #EEF2FF;
  border-color: #165DFF;
}

.generation-mode-card .mode-icon {
  font-size: 28px;
}

.generation-mode-card .mode-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.generation-mode-card .mode-desc {
  font-size: 11px;
  color: #666;
}

.generation-mode-card .mode-time {
  font-size: 10px;
  color: #165DFF;
  background: #EEF2FF;
  padding: 2px 8px;
  border-radius: 10px;
}

/* 输出格式样式 */
.output-format-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.output-format-card {
  padding: 16px;
  background: #f9f9f9;
  border: 2px solid #eee;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.output-format-card:hover {
  background: #f0f0f0;
  border-color: #ddd;
}

.output-format-card.active {
  background: #EEF2FF;
  border-color: #165DFF;
}

.output-format-card .format-icon {
  font-size: 24px;
}

.output-format-card .format-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.output-format-card .format-desc {
  font-size: 11px;
  color: #666;
}

/* 质量选择样式 */
.quality-toggle {
  display: flex;
  gap: 12px;
}

.quality-option {
  flex: 1;
  padding: 16px;
  background: #f9f9f9;
  border: 2px solid #eee;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.quality-option:hover {
  background: #f0f0f0;
  border-color: #ddd;
}

.quality-option.active {
  background: #EEF2FF;
  border-color: #165DFF;
}

.quality-option .quality-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.quality-option .quality-dpi {
  font-size: 12px;
  color: #165DFF;
  font-weight: 500;
}

.quality-option .quality-desc {
  font-size: 11px;
  color: #666;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .generation-mode-grid,
  .output-format-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .quality-toggle {
    flex-direction: column;
  }
}

/* 主题定制面板 */
.theme-panel-section {
  padding: 0;
  background: transparent;
  box-shadow: none;
  border: none;
}
</style>
