<template>
  <div class="template-selector">
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
    <div class="template-grid">
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

const emit = defineEmits(['select'])

const activeCategory = ref('all')
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
</style>
