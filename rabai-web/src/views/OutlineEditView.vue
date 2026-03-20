<template>
  <div class="outline-edit-page">
    <div class="outline-header">
      <div class="header-left">
        <button class="btn-back" @click="goBack">
          ← 返回
        </button>
        <div class="header-info">
          <h1 class="page-title">编辑 PPT 大纲</h1>
          <p class="page-subtitle">调整每页标题和内容，确认后生成演示文稿</p>
        </div>
      </div>
      <div class="header-actions">
        <button class="btn btn-outline" @click="addSlide">
          + 添加页面
        </button>
        <button class="btn btn-primary" @click="generatePPT" :disabled="isGenerating">
          {{ isGenerating ? '生成中...' : '生成 PPT' }}
        </button>
      </div>
    </div>

    <!-- 大纲预览 -->
    <div class="outline-preview">
      <div class="outline-summary">
        <span class="summary-item">
          <span class="summary-icon">📄</span>
          {{ outline.slides.length }} 页
        </span>
        <span class="summary-item">
          <span class="summary-icon">⏱️</span>
          预计 {{ outline.slides.length * 30 }} 秒
        </span>
        <span class="summary-item">
          <span class="summary-icon">🎨</span>
          {{ getStyleName(outline.style) }}
        </span>
      </div>
    </div>

    <!-- 幻灯片列表 -->
    <div class="slides-container">
      <TransitionGroup name="slide" tag="div" class="slides-list">
        <div
          v-for="(slide, index) in outline.slides"
          :key="slide.id"
          class="slide-card"
          :class="{ active: activeSlide === index }"
          @click="activeSlide = index"
        >
          <div class="slide-number">{{ index + 1 }}</div>
          <div class="slide-content">
            <div class="slide-header">
              <input
                v-model="slide.title"
                type="text"
                class="slide-title-input"
                placeholder="页面标题"
                @click.stop
              />
              <button class="btn-icon btn-delete" @click.stop="deleteSlide(index)" title="删除页面">
                🗑️
              </button>
            </div>
            <div class="slide-body">
              <textarea
                v-model="slide.content"
                class="slide-content-input"
                placeholder="输入页面内容要点，每行一个要点..."
                rows="4"
                @click.stop
              ></textarea>
            </div>
            <div class="slide-footer">
              <select v-model="slide.layout" class="layout-select" @click.stop>
                <option value="title">标题页</option>
                <option value="content">内容页</option>
                <option value="two-column">双栏</option>
                <option value="image-left">左图右文</option>
                <option value="image-right">左文右图</option>
                <option value="centered">居中</option>
              </select>
              <span class="word-count">{{ getWordCount(slide.content) }} 字</span>
            </div>
          </div>
        </div>
      </TransitionGroup>

      <!-- 添加页面按钮 -->
      <div class="add-slide-card" @click="addSlide">
        <span class="add-icon">+</span>
        <span>添加新页面</span>
      </div>
    </div>

    <!-- 快捷操作 -->
    <div class="quick-actions">
      <button class="quick-action" @click="generateOutline">
        <span class="action-icon">✨</span>
        <span>AI 重新生成大纲</span>
      </button>
      <button class="quick-action" @click="loadTemplate">
        <span class="action-icon">📋</span>
        <span>加载模板</span>
      </button>
      <button class="quick-action" @click="clearAll">
        <span class="action-icon">🗑️</span>
        <span>清空所有</span>
      </button>
    </div>

    <!-- 加载中 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>正在生成大纲...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

interface Slide {
  id: string
  title: string
  content: string
  layout: 'title' | 'content' | 'two-column' | 'image-left' | 'image-right' | 'centered'
}

interface OutlineData {
  slides: Slide[]
  style: string
  theme: string
}

const activeSlide = ref(0)
const isLoading = ref(false)
const isGenerating = ref(false)

const outline = reactive<OutlineData>({
  slides: [],
  style: 'professional',
  theme: 'blue'
})

// 生成唯一ID
const generateId = () => Math.random().toString(36).substr(2, 9)

// 获取风格名称
const getStyleName = (style: string) => {
  const styleMap: Record<string, string> = {
    professional: '专业商务',
    simple: '简约现代',
    energetic: '活力创意',
    premium: '高端奢华',
    tech: '科技感',
    creative: '创意艺术'
  }
  return styleMap[style] || style
}

// 获取字数
const getWordCount = (content: string) => {
  return content ? content.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '').length : 0
}

// 返回
const goBack = () => {
  router.back()
}

// 添加页面
const addSlide = () => {
  outline.slides.push({
    id: generateId(),
    title: '',
    content: '',
    layout: 'content'
  })
  activeSlide.value = outline.slides.length - 1
}

// 删除页面
const deleteSlide = (index: number) => {
  if (outline.slides.length <= 1) {
    alert('至少保留一页')
    return
  }
  outline.slides.splice(index, 1)
  if (activeSlide.value >= outline.slides.length) {
    activeSlide.value = outline.slides.length - 1
  }
}

// 布局类型映射
const mapLayoutType = (layout: string) => {
  const map: Record<string, string> = {
    'title_slide': 'title',
    'content': 'content',
    'content_card': 'content',
    'two_column': 'two-column',
    'left_text_right_image': 'image-right',
    'left_image_right_text': 'image-left',
    'three_column': 'three-column',
    'center': 'centered',
    'center_radiation': 'centered',
    'toc': 'toc',
    'timeline': 'timeline',
    'data_visualization': 'chart',
    'quote': 'quote',
    'comparison': 'comparison',
    'thank_you': 'end'
  }
  return map[layout] || 'content'
}

// AI重新生成大纲
const generateOutline = async () => {
  isLoading.value = true
  try {
    const request = route.query.request as string || '商务演示'

    // 尝试调用后端API生成大纲
    try {
      const { api } = await import('../api/client')
      const response = await api.ppt.plan(request)
      if (response && response.data && response.data.slides) {
        // 使用API返回的大纲
        outline.slides = response.data.slides.map((s: any, i: number) => ({
          id: generateId(),
          title: s.title || `第${i + 1}页`,
          content: Array.isArray(s.content) ? s.content.join('\n') : (s.content || ''),
          layout: mapLayoutType(s.layout || s.slide_type || 'content')
        }))
        isLoading.value = false
        return
      }
    } catch (apiError) {
      console.warn('API调用失败，使用本地智能生成:', apiError)
    }

    // API不可用时使用本地智能生成
    await new Promise(resolve => setTimeout(resolve, 800))

    // 智能生成基于用户请求
    const requestLower = request.toLowerCase()
    let slideData: any[]

    if (requestLower.includes('商务') || requestLower.includes('企业') || requestLower.includes('公司')) {
      slideData = [
        { title: request, content: '副标题\n演讲者：姓名', layout: 'title' },
        { title: '目录', content: '一、行业概述\n二、市场分析\n三、竞争格局\n四、发展策略\n五、总结展望', layout: 'content' },
        { title: '行业概述', content: '• 行业定义与发展历程\n• 市场规模与增长趋势\n• 政策环境分析', layout: 'content' },
        { title: '市场分析', content: '• 目标市场定位\n• 用户需求洞察\n• 市场份额分析', layout: 'two-column' },
        { title: '竞争格局', content: '• 主要竞争对手\n• 竞争优势分析\n• 差异化策略', layout: 'content' },
        { title: '发展策略', content: '• 短期目标\n• 中期规划\n• 长期愿景', layout: 'content' },
        { title: '总结与展望', content: '• 核心观点回顾\n• 下一步行动计划\n• 感谢聆听', layout: 'centered' }
      ]
    } else if (requestLower.includes('教育') || requestLower.includes('培训') || requestLower.includes('课程')) {
      slideData = [
        { title: request, content: '课程名称\n讲师：姓名', layout: 'title' },
        { title: '课程目录', content: '第一章：基础知识\n第二章：核心要点\n第三章：实战应用\n第四章：总结复习', layout: 'content' },
        { title: '第一章：基础知识', content: '• 知识点1\n• 知识点2\n• 知识点3', layout: 'content' },
        { title: '第二章：核心要点', content: '• 核心概念\n• 案例分析\n• 实践方法', layout: 'two-column' },
        { title: '第三章：实战应用', content: '• 实战演练\n• 常见问题\n• 解决方案', layout: 'content' },
        { title: '第四章：总结复习', content: '• 知识回顾\n• 重点总结\n• 课后作业', layout: 'content' },
        { title: '谢谢观看', content: '感谢您的聆听\n欢迎提问交流', layout: 'centered' }
      ]
    } else if (requestLower.includes('数据') || requestLower.includes('报告') || requestLower.includes('分析')) {
      slideData = [
        { title: request, content: '报告周期：2024年\n汇报部门：数据分析部', layout: 'title' },
        { title: '报告摘要', content: '• 核心发现\n• 关键指标\n• 建议行动', layout: 'content' },
        { title: '数据概览', content: '• 总体数据\n• 趋势分析\n• 对比数据', layout: 'content' },
        { title: '详细分析', content: '• 维度一分析\n• 维度二分析\n• 维度三分析', layout: 'two-column' },
        { title: '洞察发现', content: '• 主要发现1\n• 主要发现2\n• 主要发现3', layout: 'content' },
        { title: '建议方案', content: '• 短期行动\n• 中期优化\n• 长期规划', layout: 'content' },
        { title: '总结', content: '• 核心结论\n• 下一步计划', layout: 'centered' }
      ]
    } else if (requestLower.includes('产品') || requestLower.includes('发布')) {
      slideData = [
        { title: request, content: '产品名称\n发布会主题', layout: 'title' },
        { title: '产品介绍', content: '• 核心功能\n• 创新亮点\n• 使用体验', layout: 'content' },
        { title: '产品特点', content: '• 特点一\n• 特点二\n• 特点三', layout: 'two-column' },
        { title: '应用场景', content: '• 场景一\n• 场景二\n• 场景三', layout: 'content' },
        { title: '定价与发售', content: '• 价格方案\n• 优惠政策\n• 上市时间', layout: 'content' },
        { title: '谢谢观看', content: '感谢您的关注\n欢迎预订', layout: 'centered' }
      ]
    } else {
      // 默认通用模板
      slideData = [
        { title: request, content: '副标题\n演讲者信息', layout: 'title' },
        { title: '目录', content: '第一部分：背景\n第二部分：内容\n第三部分：总结', layout: 'content' },
        { title: '第一部分', content: '• 要点1\n• 要点2\n• 要点3', layout: 'content' },
        { title: '第二部分', content: '• 要点1\n• 要点2\n• 要点3', layout: 'two-column' },
        { title: '第三部分', content: '• 总结1\n• 总结2\n• 总结3', layout: 'content' },
        { title: '谢谢观看', content: '感谢您的聆听\n欢迎提问', layout: 'centered' }
      ]
    }

    outline.slides = slideData.map((s) => ({
      id: generateId(),
      title: s.title,
      content: s.content,
      layout: s.layout
    }))
  } catch (e) {
    console.error('生成失败:', e)
    alert('生成失败，请重试')
  } finally {
    isLoading.value = false
  }
}

// 加载模板
const loadTemplate = () => {
  const templates: { name: string; slides: Slide[] }[] = [
    {
      name: '1. 商业计划书',
      slides: [
        { id: generateId(), title: '公司介绍', content: '公司背景\n核心业务\n团队介绍', layout: 'title' as const },
        { id: generateId(), title: '市场分析', content: '行业规模\n目标用户\n竞争分析', layout: 'content' as const },
        { id: generateId(), title: '产品服务', content: '产品特点\n核心优势\n商业模式', layout: 'two-column' as const },
        { id: generateId(), title: '发展规划', content: '短期目标\n中期规划\n长期愿景', layout: 'content' as const }
      ]
    },
    {
      name: '2. 产品发布会',
      slides: [
        { id: generateId(), title: '新品发布', content: '产品名称\n发布主题\n演讲嘉宾', layout: 'title' as const },
        { id: generateId(), title: '产品介绍', content: '核心功能\n创新亮点\n使用体验', layout: 'content' as const },
        { id: generateId(), title: '产品演示', content: '演示环节\n互动问答', layout: 'image-right' as const },
        { id: generateId(), title: '定价与上市', content: '价格方案\n优惠政策\n上市时间', layout: 'content' as const }
      ]
    },
    {
      name: '3. 培训课件',
      slides: [
        { id: generateId(), title: '培训主题', content: '培训目标\n课程大纲', layout: 'title' as const },
        { id: generateId(), title: '知识点一', content: '概念讲解\n案例分析', layout: 'content' as const },
        { id: generateId(), title: '知识点二', content: '方法论\n实践操作', layout: 'content' as const },
        { id: generateId(), title: '总结与问答', content: '要点回顾\n课后作业\n问答环节', layout: 'centered' as const }
      ]
    },
    {
      name: '4. 年度总结',
      slides: [
        { id: generateId(), title: '年度工作总结', content: '年度回顾\n核心成就', layout: 'title' as const },
        { id: generateId(), title: '业绩数据', content: '关键指标\n同比分析\n环比趋势', layout: 'two-column' as const },
        { id: generateId(), title: '团队成就', content: '团队建设\n人才培养\n文化建设', layout: 'content' as const },
        { id: generateId(), title: '明年计划', content: '目标设定\n战略方向\n资源规划', layout: 'content' as const }
      ]
    },
    {
      name: '5. 项目汇报',
      slides: [
        { id: generateId(), title: '项目概述', content: '项目背景\n项目目标\n团队成员', layout: 'title' as const },
        { id: generateId(), title: '项目进度', content: '里程碑\n已完成工作\n进行中工作', layout: 'content' as const },
        { id: generateId(), title: '问题与解决', content: '遇到的问题\n解决方案\n风险控制', layout: 'two-column' as const },
        { id: generateId(), title: '下一步计划', content: '后续安排\n资源需求\n预期成果', layout: 'content' as const }
      ]
    },
    {
      name: '6. 公司介绍',
      slides: [
        { id: generateId(), title: '公司介绍', content: '公司名称\n创立时间\n发展历程', layout: 'title' as const },
        { id: generateId(), title: '核心业务', content: '主要产品\n服务领域\n客户群体', layout: 'content' as const },
        { id: generateId(), title: '竞争优势', content: '技术优势\n团队优势\n资源优势', layout: 'two-column' as const },
        { id: generateId(), title: '发展愿景', content: '战略目标\n未来规划\n合作期待', layout: 'centered' as const }
      ]
    },
    {
      name: '7. 融资路演',
      slides: [
        { id: generateId(), title: '融资计划', content: '项目名称\n融资轮次\n融资金额', layout: 'title' as const },
        { id: generateId(), title: '商业模式', content: '产品定位\n盈利模式\n市场空间', layout: 'content' as const },
        { id: generateId(), title: '竞争优势', content: '核心竞争力\n技术壁垒\n团队优势', layout: 'two-column' as const },
        { id: generateId(), title: '融资用途', content: '资金分配\n使用计划\n预期回报', layout: 'content' as const },
        { id: generateId(), title: '联系方式', content: '联系人\n电话\n邮箱', layout: 'centered' as const }
      ]
    },
    {
      name: '8. 党建汇报',
      slides: [
        { id: generateId(), title: '党建工作汇报', content: '党组织名称\n汇报时间', layout: 'title' as const },
        { id: generateId(), title: '组织建设', content: '党员情况\n组织活动\n制度建设', layout: 'content' as const },
        { id: generateId(), title: '思想建设', content: '理论学习\n主题教育\n思想动态', layout: 'content' as const },
        { id: generateId(), title: '下一步计划', content: '工作目标\n重点任务', layout: 'centered' as const }
      ]
    }
  ]

  const choice = prompt(`选择模板:\n${templates.map(t => t.name).join('\n')}`)
  const index = parseInt(choice || '0') - 1
  if (index >= 0 && index < templates.length) {
    outline.slides = templates[index].slides.map(s => ({ ...s, id: generateId() }))
  }
}

// 清空所有
const clearAll = () => {
  if (confirm('确定要清空所有页面吗？')) {
    outline.slides = [{ id: generateId(), title: '', content: '', layout: 'content' as const }]
    activeSlide.value = 0
  }
}

// 生成PPT
const generatePPT = async () => {
  // 验证
  const emptySlides = outline.slides.filter(s => !s.title.trim())
  if (emptySlides.length > 0) {
    alert('请填写所有页面的标题')
    return
  }

  isGenerating.value = true

  try {
    // 保存大纲到本地存储
    localStorage.setItem('ppt_outline', JSON.stringify(outline))

    // 跳转到生成页面
    router.push({
      path: '/generating',
      query: {
        request: route.query.request as string,
        style: outline.style,
        slideCount: outline.slides.length.toString()
      }
    })
  } catch (e) {
    alert('生成失败，请重试')
    isGenerating.value = false
  }
}

// 页面加载时初始化
onMounted(() => {
  // 检查是否有保存的大纲
  const savedOutline = localStorage.getItem('ppt_outline_temp')
  if (savedOutline) {
    const parsed = JSON.parse(savedOutline)
    Object.assign(outline, parsed)
    localStorage.removeItem('ppt_outline_temp')
  } else if (outline.slides.length === 0) {
    // 生成初始大纲
    generateOutline()
  }
})
</script>

<style scoped>
.outline-edit-page {
  min-height: 100vh;
  background: var(--gray-100, #f5f5f5);
  padding: 24px;
}

.outline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.btn-back {
  padding: 10px 16px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-back:hover {
  background: #f5f5f5;
}

.header-info .page-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.header-info .page-subtitle {
  font-size: 14px;
  color: #666;
  margin: 4px 0 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #165DFF;
  color: white;
}

.btn-primary:hover {
  background: #0e42d2;
}

.btn-primary:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}

.btn-outline {
  background: white;
  border: 1px solid #ddd;
  color: #333;
}

.btn-outline:hover {
  background: #f5f5f5;
}

/* 大纲预览 */
.outline-preview {
  background: white;
  border-radius: 12px;
  padding: 16px 24px;
  margin-bottom: 24px;
}

.outline-summary {
  display: flex;
  gap: 24px;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
}

.summary-icon {
  font-size: 16px;
}

/* 幻灯片列表 */
.slides-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.slides-list {
  display: contents;
}

.slide-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
  position: relative;
}

.slide-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.slide-card.active {
  border-color: #165DFF;
  box-shadow: 0 4px 16px rgba(22, 93, 255, 0.2);
}

.slide-number {
  position: absolute;
  top: -10px;
  left: -10px;
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
}

.slide-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.slide-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.slide-title-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 500;
  outline: none;
  transition: border-color 0.2s;
}

.slide-title-input:focus {
  border-color: #165DFF;
}

.btn-icon {
  padding: 6px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 14px;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.btn-icon:hover {
  opacity: 1;
}

.btn-delete:hover {
  color: #dc2626;
}

.slide-body {
  flex: 1;
}

.slide-content-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  font-size: 14px;
  line-height: 1.6;
  resize: vertical;
  outline: none;
  transition: border-color 0.2s;
  font-family: inherit;
}

.slide-content-input:focus {
  border-color: #165DFF;
}

.slide-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.layout-select {
  padding: 4px 8px;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  font-size: 12px;
  background: white;
  cursor: pointer;
}

.word-count {
  font-size: 12px;
  color: #999;
}

/* 添加页面卡片 */
.add-slide-card {
  background: white;
  border: 2px dashed #ddd;
  border-radius: 12px;
  padding: 40px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 200px;
}

.add-slide-card:hover {
  border-color: #165DFF;
  color: #165DFF;
}

.add-icon {
  font-size: 32px;
  font-weight: 300;
}

/* 快捷操作 */
.quick-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.quick-action {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-action:hover {
  background: #f9fafb;
  border-color: #165DFF;
}

.action-icon {
  font-size: 16px;
}

/* 动画 */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

/* 加载中 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  z-index: 100;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e5e5;
  border-top-color: #165DFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 移动端 */
@media (max-width: 768px) {
  .outline-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-left {
    flex-direction: column;
    align-items: stretch;
  }

  .header-actions {
    justify-content: stretch;
  }

  .header-actions .btn {
    flex: 1;
  }

  .slides-container {
    grid-template-columns: 1fr;
  }
}
</style>
