<template>
  <div class="chart-editor-overlay" @click.self="close">
    <div class="chart-editor-panel">
      <div class="editor-header">
        <div class="header-left">
          <h3>📊 图表编辑器</h3>
          <p class="editor-tip">上传数据文件，选择图表类型，编辑图表数据</p>
        </div>
        <button class="btn-close" @click="close">✕</button>
      </div>

      <div class="editor-content">
        <!-- 左侧：文件上传 + 数据预览 -->
        <div class="data-section">
          <div class="section-title">📂 数据源</div>
          
          <!-- 文件上传 -->
          <div class="file-upload-area" 
               :class="{ 'has-file': uploadedFile }"
               @dragover.prevent="isDragging = true"
               @dragleave="isDragging = false"
               @drop.prevent="handleDrop"
               @click="triggerFileInput">
            <input 
              ref="fileInput" 
              type="file" 
              accept=".csv,.xlsx,.xls" 
              @change="handleFileSelect" 
              style="display:none" />
            <div v-if="!uploadedFile" class="upload-placeholder">
              <span class="upload-icon">📤</span>
              <p>拖拽或点击上传 CSV/Excel</p>
              <p class="upload-hint">支持 .csv, .xlsx, .xls 格式</p>
            </div>
            <div v-else class="file-info-display">
              <span class="file-icon">📄</span>
              <span class="file-name">{{ uploadedFile.name }}</span>
              <span class="file-size">{{ formatSize(uploadedFile.size) }}</span>
              <button class="btn-remove-file" @click.stop="removeFile">✕</button>
            </div>
          </div>

          <!-- 数据预览表格 -->
          <div v-if="columnInfo" class="data-preview">
            <div class="preview-header">
              <span>数据预览（前5行）</span>
              <span class="row-count">共 {{ columnInfo.row_count }} 行</span>
            </div>
            <div class="preview-table-wrapper">
              <table class="preview-table">
                <thead>
                  <tr>
                    <th v-for="col in columnInfo.all_columns" :key="col">{{ col }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, i) in columnInfo.preview" :key="i">
                    <td v-for="col in columnInfo.all_columns" :key="col">{{ row[col] }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- R62: Smart Fill -->
          <div v-if="columnInfo && columnInfo.numeric_columns.length > 0" class="smart-fill-section">
            <div class="section-title">🧠 智能填充（Smart Fill）</div>
            <div class="smart-fill-controls">
              <select v-model="smartFillTargetCol" class="col-select-input">
                <option value="">-- 选择要填充的列 --</option>
                <option v-for="col in columnInfo.all_columns" :key="col" :value="col">{{ col }}</option>
              </select>
              <select v-model="smartFillMethod" class="col-select-input">
                <option value="auto">自动（智能选择）</option>
                <option value="linear">线性插值</option>
                <option value="forward">前向填充</option>
                <option value="mean">均值填充</option>
              </select>
              <button
                class="btn-smart-fill"
                @click="runSmartFill"
                :disabled="!smartFillTargetCol || isSmartFilling">
                <span v-if="isSmartFilling">填充中...</span>
                <span v-else>🔮 AI 智能填充</span>
              </button>
            </div>
            <div v-if="smartFillResult" class="smart-fill-result">
              <span class="fill-badge">✅ 填充完成</span>
              <span class="fill-info">已使用「{{ smartFillMethod }}」方法填充「{{ smartFillTargetCol }}」列</span>
            </div>
          </div>

          <!-- R62: 数据刷新 -->
          <div v-if="uploadedFile" class="data-refresh-section">
            <div class="editor-header-row">
              <span class="section-title">🔄 数据刷新</span>
              <div class="refresh-controls">
                <label class="auto-refresh-label">
                  <input type="checkbox" v-model="autoRefreshEnabled" @change="toggleAutoRefresh" />
                  自动刷新(5s)
                </label>
                <button class="btn-refresh" @click="refreshData" :disabled="isRefreshing">
                  {{ isRefreshing ? '刷新中...' : '🔁 刷新数据' }}
                </button>
              </div>
            </div>
          </div>

          <!-- 数据编辑表格（R19） -->
          <div v-if="editableData.length > 0" class="data-editor">
            <div class="editor-header-row">
              <span class="section-title">✏️ 数据编辑</span>
              <button class="btn-add-row" @click="addDataRow">+ 添加行</button>
            </div>
            <div class="editable-table-wrapper">
              <table class="editable-table">
                <thead>
                  <tr>
                    <th v-for="col in columnInfo.all_columns" :key="col">{{ col }}</th>
                    <th v-if="editableData.length > 0" class="action-col">操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, rowIndex) in editableData" :key="rowIndex">
                    <td v-for="col in columnInfo.all_columns" :key="col">
                      <input 
                        type="text" 
                        v-model="row[col]" 
                        @input="onDataChange"
                        @dblclick="($event.target as HTMLInputElement).select()"
                        class="data-input" />
                    </td>
                    <td class="action-col">
                      <button class="btn-delete-row" @click="deleteDataRow(rowIndex)">🗑️</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- 右侧：图表配置 -->
        <div class="config-section">
          <!-- 图表类型选择 -->
          <div class="config-group">
            <div class="section-title">📊 图表类型</div>
            <div class="chart-type-grid">
              <button 
                v-for="type in chartTypes" 
                :key="type.id"
                class="chart-type-btn"
                :class="{ active: selectedChartType === type.id }"
                @click="selectedChartType = type.id">
                <span class="type-icon">{{ type.icon }}</span>
                <span class="type-name">{{ type.name }}</span>
              </button>
            </div>
          </div>

          <!-- 列选择 -->
          <div v-if="columnInfo" class="config-group">
            <div class="section-title">🎯 列选择</div>
            <div class="column-selectors">
              <div class="col-select">
                <label>标签列（X轴）</label>
                <select v-model="labelCol" class="col-select-input">
                  <option value="">-- 选择标签列 --</option>
                  <option v-for="col in columnInfo.label_columns" :key="col" :value="col">{{ col }}</option>
                  <option v-if="columnInfo.label_columns.length === 0" value="">无可用标签列</option>
                </select>
              </div>
              <div class="col-select">
                <label>数值列（Y轴）</label>
                <select v-model="valueCol" class="col-select-input">
                  <option value="">-- 选择数值列 --</option>
                  <option v-for="col in columnInfo.numeric_columns" :key="col" :value="col">{{ col }}</option>
                  <option v-if="columnInfo.numeric_columns.length === 0" value="">无可用数值列</option>
                </select>
              </div>
            </div>
          </div>

          <!-- R62: 图表模板 -->
          <div class="config-group">
            <div class="section-title">📐 图表模板</div>
            <div class="template-grid">
              <button
                v-for="tpl in chartTemplates"
                :key="tpl.id"
                class="template-btn"
                :class="{ active: selectedTemplate === tpl.id }"
                @click="selectedTemplate = tpl.id">
                <span class="tpl-icon">{{ tpl.icon }}</span>
                <span class="tpl-name">{{ tpl.name }}</span>
              </button>
            </div>
          </div>

          <!-- 颜色主题 -->
          <div class="config-group">
            <div class="section-title">🎨 颜色主题</div>
            <div class="theme-grid">
              <button 
                v-for="theme in colorThemes" 
                :key="theme.id"
                class="theme-btn"
                :class="{ active: selectedTheme === theme.id }"
                @click="selectedTheme = theme.id"
                :title="theme.name">
                <div class="theme-colors">
                  <span v-for="c in theme.colors" :key="c" :style="{ backgroundColor: c }"></span>
                </div>
                <span class="theme-name">{{ theme.name }}</span>
              </button>
            </div>
          </div>

          <!-- 图表设置 -->
          <div class="config-group">
            <div class="section-title">⚙️ 图表设置</div>
            <div class="setting-row">
              <label>图表标题</label>
              <input type="text" v-model="chartTitle" class="setting-input" placeholder="输入图表标题" />
            </div>
            <div class="setting-row">
              <label>显示图例</label>
              <switch :checked="showLegend" @change="onShowLegendChange($event)" class="setting-switch" />
            </div>
            <div class="setting-row">
              <label>显示坐标轴标签</label>
              <switch :checked="showAxisLabels" @change="onShowAxisLabelsChange($event)" class="setting-switch" />
            </div>
            <div class="setting-row">
              <label>显示数据标签</label>
              <switch :checked="showDataLabels" @change="onShowDataLabelsChange($event)" class="setting-switch" />
            </div>
            <!-- R62: 趋势线（仅折线图） -->
            <div class="setting-row" v-if="selectedChartType === 'line'">
              <label>显示趋势线</label>
              <switch :checked="showTrendLine" @change="onShowTrendLineChange($event)" class="setting-switch" />
            </div>

          <!-- R62: 图表标注 -->
          <div class="config-group" v-if="selectedChartType === 'line' || selectedChartType === 'bar'">
            <div class="section-title">🏷️ 图表标注</div>
            <div class="annotation-controls">
              <button class="btn-annotate" @click="showAnnotationPanel = !showAnnotationPanel">
                {{ showAnnotationPanel ? '隐藏标注' : '+ 添加标注' }}
              </button>
            </div>
            <div v-if="showAnnotationPanel" class="annotation-panel">
              <div class="annotation-row">
                <select v-model="newAnnotation.x" class="col-select-input">
                  <option value="">-- 选择X轴索引 --</option>
                  <option v-for="(lbl, i) in annotationLabels" :key="i" :value="i">{{ i }}: {{ lbl }}</option>
                </select>
              </div>
              <div class="annotation-row">
                <input type="text" v-model="newAnnotation.text" class="setting-input" placeholder="标注文字" />
              </div>
              <div class="annotation-row">
                <select v-model="newAnnotation.type" class="col-select-input">
                  <option value="label">标签</option>
                  <option value="arrow">箭头</option>
                  <option value="callout">气泡</option>
                  <option value="box">文本框</option>
                  <option value="circle">圆圈</option>
                </select>
                <input type="color" v-model="newAnnotation.color" class="color-picker" />
              </div>
              <button class="btn-add-annotation" @click="addAnnotation">➕ 添加标注</button>
              <div v-if="annotations.length > 0" class="annotation-list">
                <div v-for="(ann, i) in annotations" :key="i" class="annotation-item">
                  <span class="ann-type-badge">{{ ann.type }}</span>
                  <span class="ann-text">{{ ann.text }}</span>
                  <button class="btn-remove-ann" @click="removeAnnotation(i)">✕</button>
                </div>
              </div>
            </div>
          </div>
          </div>

          <!-- 预览 -->
          <div v-if="chartSvgUrl" class="chart-preview" :class="{ transitioning: isTransitioning }">
            <div class="preview-title">图表预览 <span class="theme-badge">{{ colorThemes.find(t => t.id === selectedTheme)?.name }}</span></div>
            <div class="preview-image-wrapper">
              <img 
                :src="chartSvgUrl" 
                alt="图表预览" 
                class="preview-img"
                :style="{ filter: themeFilters[selectedTheme] + ' drop-shadow(0 2px 8px rgba(0,0,0,0.15))' }"
              />
            </div>
          </div>

          <!-- 生成按钮 -->
          <div class="action-buttons">
            <button class="btn btn-outline" @click="close">取消</button>
            <button class="btn btn-primary" @click="generateChart" :disabled="!canGenerate">
              📊 生成图表
            </button>
            <button class="btn btn-success" @click="insertIntoSlide" :disabled="!chartSvgUrl">
              ➕ 插入到幻灯片
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { api } from '../api/client'

const props = defineProps<{
  taskId: string
}>()

const emit = defineEmits(['close', 'chartGenerated', 'insertIntoSlide'])

// 文件上传
const fileInput = ref<HTMLInputElement>()
const uploadedFile = ref<File | null>(null)
const isDragging = ref(false)
const columnInfo = ref<{
  all_columns: string[]
  label_columns: string[]
  numeric_columns: string[]
  row_count: number
  preview: any[]
} | null>(null)

// 图表配置
const chartTypes = [
  { id: 'bar', name: '柱状图', icon: '📊' },
  { id: 'line', name: '折线图', icon: '📈' },
  { id: 'pie', name: '饼图', icon: '🥧' },
  { id: 'horizontal_bar', name: '条形图', icon: '📉' },
  { id: 'stacked_bar', name: '堆叠图', icon: '📊' }
]

const colorThemes = [
  { id: 'blue', name: '科技蓝', colors: ['#165DFF', '#4080FF', '#95BCFF', '#ADC8FF'] },
  { id: 'green', name: '自然绿', colors: ['#34C759', '#63D688', '#98EAB3', '#C1F5D0'] },
  { id: 'sunset', name: '暖夕阳', colors: ['#FF9500', '#FF6B35', '#FFAB76', '#FFD4B8'] },
  { id: 'purple', name: '浪漫紫', colors: ['#7C3AED', '#A78BFA', '#C4B5FD', '#DDD6FE'] },
  { id: 'red', name: '活力红', colors: ['#FF2D55', '#FF6B8A', '#FF9CAD', '#FFCCD6'] }
]

const selectedChartType = ref('bar')
const selectedTheme = ref('blue')
const labelCol = ref('')
const valueCol = ref('')
const chartTitle = ref('')
const showLegend = ref(true)
const showAxisLabels = ref(true)
const showDataLabels = ref(true)

// 图表预览
const chartSvgUrl = ref('')

// R62: 图表模板
const chartTemplates = [
  { id: 'default', name: '默认风格', icon: '📋' },
  { id: 'business', name: '商务风格', icon: '💼' },
  { id: 'academic', name: '学术风格', icon: '🎓' },
  { id: 'infographic', name: '信息图风格', icon: '🎨' },
]
const selectedTemplate = ref('default')

// R62: Smart Fill
const smartFillTargetCol = ref('')
const smartFillMethod = ref('auto')
const isSmartFilling = ref(false)
const smartFillResult = ref<{ filled_col: string; fill_method: string } | null>(null)

// R62: 数据刷新
const isRefreshing = ref(false)
const autoRefreshEnabled = ref(false)
let autoRefreshTimer: number | null = null

// R62: 趋势线
const showTrendLine = ref(false)

// Handlers for switch change events
const onShowLegendChange = (e: Event) => { showLegend.value = (e as CustomEvent).detail.value }
const onShowAxisLabelsChange = (e: Event) => { showAxisLabels.value = (e as CustomEvent).detail.value }
const onShowDataLabelsChange = (e: Event) => { showDataLabels.value = (e as CustomEvent).detail.value }
const onShowTrendLineChange = (e: Event) => {
  showTrendLine.value = (e as CustomEvent).detail.value
  onConfigChange()
}

// R62: 图表标注
const showAnnotationPanel = ref(false)
const annotations = ref<Array<{
  type: string
  x: number | string
  y: number
  text: string
  color: string
}>>([])
const newAnnotation = ref({
  type: 'label',
  x: '',
  y: 0,
  text: '',
  color: '#FF2D55'
})

// 标注用的标签列表（用于选择X索引）
const annotationLabels = computed(() => {
  if (!columnInfo.value || !labelCol.value) return []
  return editableData.value.map(r => String(r[labelCol.value]))
})
// 过渡动画状态
const isTransitioning = ref(false)
// 主题颜色映射（用于CSS滤镜）
const themeFilters: Record<string, string> = {
  blue: 'hue-rotate(0deg) saturate(1)',
  green: 'hue-rotate(80deg) saturate(0.8)',
  sunset: 'hue-rotate(-30deg) saturate(1.2)',
  purple: 'hue-rotate(250deg) saturate(1)',
  red: 'hue-rotate(330deg) saturate(1.3)'
}

// 可编辑数据（R19）
const editableData = ref<Record<string, any>[]>([])

// 是否可以生成
const canGenerate = computed(() => {
  return uploadedFile.value && labelCol.value && valueCol.value
})

// 格式化文件大小
const formatSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// 触发文件选择
const triggerFileInput = () => {
  fileInput.value?.click()
}

// 处理文件选择
const handleFileSelect = async (e: Event) => {
  const input = e.target as HTMLInputElement
  if (input.files && input.files[0]) {
    await processFile(input.files[0])
  }
}

// 处理拖拽
const handleDrop = async (e: DragEvent) => {
  isDragging.value = false
  const file = e.dataTransfer?.files[0]
  if (file) {
    const validTypes = ['.csv', '.xlsx', '.xls']
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (validTypes.includes(ext)) {
      await processFile(file)
    } else {
      alert('请上传 CSV 或 Excel 文件')
    }
  }
}

// 处理文件
const processFile = async (file: File) => {
  uploadedFile.value = file
  
  try {
    // 预览列信息
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.ppt.previewChart(props.taskId, file)
    
    if (response.data.success) {
      columnInfo.value = response.data.columns
      // 自动选择第一列
      if (columnInfo.value.label_columns.length > 0) {
        labelCol.value = columnInfo.value.label_columns[0]
      }
      if (columnInfo.value.numeric_columns.length > 0) {
        valueCol.value = columnInfo.value.numeric_columns[0]
      }
      // 初始化可编辑数据
      editableData.value = response.data.columns.preview.map((row: any) => ({ ...row }))
    }
  } catch (err) {
    console.error('预览文件失败:', err)
    alert('文件解析失败，请检查格式')
  }
}

// 移除文件
const removeFile = () => {
  uploadedFile.value = null
  columnInfo.value = null
  chartSvgUrl.value = ''
  editableData.value = []
  labelCol.value = ''
  valueCol.value = ''
}

// 添加数据行
const addDataRow = () => {
  if (!columnInfo.value) return
  const newRow: Record<string, any> = {}
  columnInfo.value.all_columns.forEach(col => {
    newRow[col] = ''
  })
  editableData.value.push(newRow)
}

// 删除数据行
const deleteDataRow = (index: number) => {
  editableData.value.splice(index, 1)
  onDataChange()
}

// 数据变更时重新生成预览
let dataChangeTimer: number | null = null
const onDataChange = () => {
  if (dataChangeTimer) clearTimeout(dataChangeTimer)
  dataChangeTimer = window.setTimeout(() => {
    // 如果已经有svg url，重新生成
    if (chartSvgUrl.value) {
      generateChartPreview()
    }
  }, 800)
}

// R62: Smart Fill 执行
const runSmartFill = async () => {
  if (!uploadedFile.value || !smartFillTargetCol.value) return
  isSmartFilling.value = true
  smartFillResult.value = null
  try {
    const formData = new FormData()
    formData.append('file', uploadedFile.value)
    formData.append('target_col', smartFillTargetCol.value)
    formData.append('method', smartFillMethod.value)
    const resp = await api.post('/api/v1/ppt/chart/smart-fill', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    if (resp.data.success) {
      // 用填充后的数据替换可编辑数据预览
      if (resp.data.filled_preview && resp.data.filled_preview.length > 0) {
        editableData.value = resp.data.filled_preview
        columnInfo.value = {
          ...columnInfo.value!,
          row_count: resp.data.row_count,
          preview: resp.data.filled_preview.slice(0, 5)
        }
      }
      smartFillResult.value = {
        filled_col: resp.data.filled_col,
        fill_method: resp.data.fill_method
      }
      // 重新生成预览
      await generateChartPreview()
    }
  } catch (err) {
    console.error('Smart Fill 失败:', err)
    alert('智能填充失败，请重试')
  } finally {
    isSmartFilling.value = false
  }
}

// R62: 数据刷新
const refreshData = async () => {
  if (!uploadedFile.value) return
  isRefreshing.value = true
  try {
    const response = await api.ppt.previewChart(props.taskId, uploadedFile.value)
    if (response.data.success) {
      columnInfo.value = response.data.columns
      editableData.value = response.data.columns.preview.map((row: any) => ({ ...row }))
    }
  } catch (err) {
    console.error('刷新数据失败:', err)
  } finally {
    isRefreshing.value = false
  }
}

// R62: 自动刷新开关
const toggleAutoRefresh = () => {
  if (autoRefreshEnabled.value) {
    autoRefreshTimer = window.setInterval(() => {
      refreshData()
    }, 5000)
  } else {
    if (autoRefreshTimer) {
      clearInterval(autoRefreshTimer)
      autoRefreshTimer = null
    }
  }
}

// R62: 添加标注
const addAnnotation = () => {
  if (!newAnnotation.value.x && newAnnotation.value.x !== 0) {
    alert('请选择X轴索引')
    return
  }
  if (!newAnnotation.value.text) {
    alert('请输入标注文字')
    return
  }
  // 计算Y值（从editableData中获取对应行的value）
  const xIdx = Number(newAnnotation.value.x)
  const rowData = editableData.value[xIdx]
  const yVal = rowData ? parseFloat(rowData[valueCol.value]) || 0 : 0
  annotations.value.push({
    type: newAnnotation.value.type,
    x: xIdx,
    y: yVal,
    text: newAnnotation.value.text,
    color: newAnnotation.value.color
  })
  newAnnotation.value.text = ''
  // 重新生成预览
  onConfigChange()
}

// R62: 移除标注
const removeAnnotation = (index: number) => {
  annotations.value.splice(index, 1)
  onConfigChange()
}

// R62: 配置变更时重新生成
const onConfigChange = () => {
  if (uploadedFile.value && labelCol.value && valueCol.value) {
    generateChartPreview()
  }
}

// 生成图表预览（带过渡动画）
const generateChartPreview = async () => {
  if (!uploadedFile.value || !labelCol.value || !valueCol.value) return
  
  // 触发过渡动画
  if (chartSvgUrl.value) {
    isTransitioning.value = true
    await new Promise(r => setTimeout(r, 150))
  }
  
  try {
    const response = await api.ppt.uploadChart({
      taskId: props.taskId,
      file: uploadedFile.value,
      chartType: selectedChartType.value,
      labelCol: labelCol.value,
      valueCol: valueCol.value,
      themeId: selectedTemplate.value,
      showTrendLine: showTrendLine.value,
      annotations: annotations.value
    })
    
    if (response.data.success && response.data.svg_urls.length > 0) {
      chartSvgUrl.value = response.data.svg_urls[0]
    }
  } catch (err) {
    console.error('生成图表失败:', err)
  } finally {
    isTransitioning.value = false
  }
}

// 生成图表
const generateChart = async () => {
  if (!canGenerate.value) return
  await generateChartPreview()
  emit('chartGenerated', {
    svgUrl: chartSvgUrl.value,
    chartType: selectedChartType.value,
    labelCol: labelCol.value,
    valueCol: valueCol.value,
    theme: selectedTheme.value,
    title: chartTitle.value,
    showLegend: showLegend.value,
    showAxisLabels: showAxisLabels.value,
    showDataLabels: showDataLabels.value
  })
}

// 插入到幻灯片
const insertIntoSlide = () => {
  if (!chartSvgUrl.value) return
  emit('insertIntoSlide', {
    svgUrl: chartSvgUrl.value,
    chartType: selectedChartType.value,
    labelCol: labelCol.value,
    valueCol: valueCol.value,
    theme: selectedTheme.value,
    title: chartTitle.value,
    showLegend: showLegend.value,
    showAxisLabels: showAxisLabels.value,
    showDataLabels: showDataLabels.value
  })
  close()
}

// 监听配置变化，自动重新生成预览
watch([selectedChartType, labelCol, valueCol, selectedTheme, selectedTemplate, showTrendLine], () => {
  if (uploadedFile.value && labelCol.value && valueCol.value) {
    generateChartPreview()
  }
})

// R62: 清理 auto-refresh 定时器
const close = () => {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer)
    autoRefreshTimer = null
  }
  emit('close')
}
</script>

<style scoped>
.chart-editor-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-editor-panel {
  width: 95%;
  max-width: 1200px;
  height: 85vh;
  background: white;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-header {
  padding: 16px 24px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e5e5;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.editor-header h3 {
  margin: 0;
  font-size: 20px;
}

.editor-tip {
  margin: 4px 0 0;
  font-size: 13px;
  color: #666;
}

.btn-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
}

.btn-close:hover {
  background: #e5e5e5;
}

.editor-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* 左侧数据区 */
.data-section {
  width: 45%;
  border-right: 1px solid #e5e5e5;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-title {
  font-weight: 600;
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
}

/* 文件上传 */
.file-upload-area {
  border: 2px dashed #e5e5e5;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.file-upload-area:hover {
  border-color: #165DFF;
  background: #f0f5ff;
}

.file-upload-area.has-file {
  border-style: solid;
  border-color: #34C759;
  background: #f0fdf4;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.upload-icon {
  font-size: 32px;
}

.upload-placeholder p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.upload-hint {
  font-size: 12px !important;
  color: #999 !important;
}

.file-info-display {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.file-icon {
  font-size: 20px;
}

.file-name {
  font-weight: 500;
  color: #333;
}

.file-size {
  color: #999;
  font-size: 13px;
}

.btn-remove-file {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  color: #999;
}

.btn-remove-file:hover {
  color: #dc2626;
}

/* 数据预览 */
.data-preview {
  background: #f9fafb;
  border-radius: 8px;
  overflow: hidden;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: #e5e5e5;
  font-size: 12px;
  font-weight: 500;
}

.row-count {
  color: #666;
}

.preview-table-wrapper {
  overflow-x: auto;
  max-height: 150px;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.preview-table th {
  background: #f0f0f0;
  padding: 6px 8px;
  text-align: left;
  font-weight: 600;
  white-space: nowrap;
  border-bottom: 1px solid #ddd;
}

.preview-table td {
  padding: 5px 8px;
  border-bottom: 1px solid #eee;
  white-space: nowrap;
}

/* 数据编辑器 */
.data-editor {
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  overflow: hidden;
}

.editor-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e5e5;
}

.btn-add-row {
  padding: 4px 10px;
  background: #165DFF;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.editable-table-wrapper {
  overflow-x: auto;
  max-height: 200px;
}

.editable-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.editable-table th {
  background: #f0f0f0;
  padding: 6px 8px;
  text-align: left;
  font-weight: 600;
  white-space: nowrap;
  position: sticky;
  top: 0;
}

.editable-table td {
  padding: 4px 4px;
  border-bottom: 1px solid #eee;
}

.editable-table .action-col {
  width: 40px;
  text-align: center;
}

.data-input {
  width: 100%;
  padding: 4px 6px;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  font-size: 12px;
  min-width: 60px;
}

.data-input:focus {
  border-color: #165DFF;
  outline: none;
}

.btn-delete-row {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
  padding: 2px 4px;
}

.btn-delete-row:hover {
  color: #dc2626;
}

/* 右侧配置区 */
.config-section {
  width: 55%;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.config-group {
  background: #f9fafb;
  border-radius: 8px;
  padding: 12px;
}

/* 图表类型选择 */
.chart-type-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.chart-type-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  background: white;
  border: 2px solid #e5e5e5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.chart-type-btn:hover {
  border-color: #165DFF;
  background: #f0f5ff;
}

.chart-type-btn.active {
  border-color: #165DFF;
  background: #EEF2FF;
}

.type-icon {
  font-size: 24px;
}

.type-name {
  font-size: 11px;
  color: #333;
}

/* 列选择 */
.column-selectors {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.col-select {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.col-select label {
  font-size: 12px;
  color: #666;
}

.col-select-input {
  padding: 8px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  font-size: 13px;
  background: white;
}

/* 颜色主题 */
.theme-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.theme-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 4px;
  background: white;
  border: 2px solid #e5e5e5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.theme-btn:hover {
  border-color: #888;
}

.theme-btn.active {
  border-color: #165DFF;
  background: #EEF2FF;
}

.theme-colors {
  display: flex;
  gap: 2px;
}

.theme-colors span {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.theme-name {
  font-size: 10px;
  color: #666;
}

/* 图表设置 */
.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid #e5e5e5;
}

.setting-row:last-child {
  border-bottom: none;
}

.setting-row label {
  font-size: 13px;
  color: #333;
}

.setting-input {
  padding: 6px 8px;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  font-size: 13px;
  width: 180px;
}

/* 图表预览 */
.chart-preview {
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  padding: 12px;
  text-align: center;
}

.preview-title {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.theme-badge {
  font-size: 10px;
  padding: 2px 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 10px;
  font-weight: normal;
}

.preview-image-wrapper {
  position: relative;
  display: inline-block;
  overflow: hidden;
  border-radius: 8px;
}

.preview-img {
  max-width: 100%;
  max-height: 200px;
  border-radius: 8px;
  transition: transform 0.3s ease, opacity 0.2s ease, filter 0.3s ease;
}

.chart-preview.transitioning .preview-img {
  opacity: 0.6;
  transform: scale(0.98);
}

.chart-preview:not(.transitioning) .preview-img {
  opacity: 1;
  transform: scale(1);
}

/* 图表类型按钮过渡 */
.chart-type-btn {
  transition: all 0.2s ease;
}

.chart-type-btn:active {
  transform: scale(0.95);
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding: 8px 0;
}

.btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-outline {
  background: white;
  border: 1px solid #ddd;
  color: #333;
}

.btn-outline:hover:not(:disabled) {
  background: #f5f5f5;
}

.btn-primary {
  background: #165DFF;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0e42d2;
}

.btn-success {
  background: #34C759;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #2da94e;
}

/* ChartEditor Mobile - Full screen on mobile */
@media (max-width: 767px) {
  .chart-editor-overlay {
    align-items: flex-end;
  }

  .chart-editor-panel {
    width: 100%;
    max-width: 100%;
    height: 90vh;
    border-radius: 20px 20px 0 0;
    overflow-y: auto;
  }

  .editor-content {
    flex-direction: column;
  }

  .data-section {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #e5e5e5;
  }

  .preview-section {
    width: 100%;
    flex: 1;
    min-height: 200px;
  }
}

@media (min-width: 768px) and (max-width: 1024px) {
  .chart-editor-panel {
    width: 95%;
    height: 90vh;
  }

  .editor-content {
    overflow-y: auto;
  }

  .data-section {
    width: 50%;
  }

  .preview-section {
    width: 50%;
  }
}

/* R62: Smart Fill */
.smart-fill-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  padding: 12px;
  color: white;
}

.smart-fill-controls {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.smart-fill-controls .col-select-input {
  flex: 1;
  min-width: 120px;
  padding: 6px 8px;
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: 6px;
  background: rgba(255,255,255,0.15);
  color: white;
  font-size: 12px;
}

.smart-fill-controls .col-select-input option {
  background: #333;
  color: white;
}

.btn-smart-fill {
  padding: 6px 14px;
  background: rgba(255,255,255,0.25);
  border: 1px solid rgba(255,255,255,0.4);
  border-radius: 6px;
  color: white;
  cursor: pointer;
  font-size: 12px;
  white-space: nowrap;
  transition: background 0.2s;
}

.btn-smart-fill:hover:not(:disabled) {
  background: rgba(255,255,255,0.35);
}

.btn-smart-fill:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.smart-fill-result {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.fill-badge {
  background: rgba(255,255,255,0.3);
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}

.fill-info {
  opacity: 0.9;
}

/* R62: 数据刷新 */
.data-refresh-section {
  background: #f0f9ff;
  border: 1px solid #e0f2fe;
  border-radius: 8px;
  padding: 8px 12px;
}

.refresh-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.auto-refresh-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
  cursor: pointer;
}

.btn-refresh {
  padding: 4px 12px;
  background: #0ea5e9;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.btn-refresh:hover:not(:disabled) {
  background: #0284c7;
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* R62: 图表模板 */
.template-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.template-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 8px 4px;
  background: white;
  border: 2px solid #e5e5e5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.template-btn:hover {
  border-color: #888;
}

.template-btn.active {
  border-color: #165DFF;
  background: #EEF2FF;
}

.tpl-icon {
  font-size: 18px;
}

.tpl-name {
  font-size: 10px;
  color: #666;
  text-align: center;
}

/* R62: 图表标注 */
.annotation-controls {
  margin-bottom: 8px;
}

.btn-annotate {
  padding: 4px 12px;
  background: #f59e0b;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.btn-annotate:hover {
  background: #d97706;
}

.annotation-panel {
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 8px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.annotation-row {
  display: flex;
  gap: 6px;
  align-items: center;
}

.annotation-row .col-select-input,
.annotation-row .setting-input {
  flex: 1;
  padding: 5px 8px;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  font-size: 12px;
}

.color-picker {
  width: 36px;
  height: 32px;
  padding: 2px;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  cursor: pointer;
}

.btn-add-annotation {
  padding: 5px 12px;
  background: #f59e0b;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  align-self: flex-start;
}

.btn-add-annotation:hover {
  background: #d97706;
}

.annotation-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 100px;
  overflow-y: auto;
}

.annotation-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: white;
  border-radius: 4px;
  font-size: 11px;
}

.ann-type-badge {
  background: #e5e5e5;
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 10px;
  color: #666;
}

.ann-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-remove-ann {
  background: none;
  border: none;
  cursor: pointer;
  color: #999;
  font-size: 10px;
  padding: 0 2px;
}

.btn-remove-ann:hover {
  color: #dc2626;
}
</style>
