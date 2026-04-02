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
              <switch :checked="showLegend" @change="showLegend = $event.detail.value" class="setting-switch" />
            </div>
            <div class="setting-row">
              <label>显示坐标轴标签</label>
              <switch :checked="showAxisLabels" @change="showAxisLabels = $event.detail.value" class="setting-switch" />
            </div>
            <div class="setting-row">
              <label>显示数据标签</label>
              <switch :checked="showDataLabels" @change="showDataLabels = $event.detail.value" class="setting-switch" />
            </div>
          </div>

          <!-- 预览 -->
          <div v-if="chartSvgUrl" class="chart-preview">
            <div class="preview-title">图表预览</div>
            <img :src="chartSvgUrl" alt="图表预览" class="preview-img" />
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

// 生成图表预览
const generateChartPreview = async () => {
  if (!uploadedFile.value || !labelCol.value || !valueCol.value) return
  
  try {
    const response = await api.ppt.uploadChart({
      taskId: props.taskId,
      file: uploadedFile.value,
      chartType: selectedChartType.value,
      labelCol: labelCol.value,
      valueCol: valueCol.value
    })
    
    if (response.data.success && response.data.svg_urls.length > 0) {
      chartSvgUrl.value = response.data.svg_urls[0]
    }
  } catch (err) {
    console.error('生成图表失败:', err)
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
watch([selectedChartType, labelCol, valueCol, selectedTheme], () => {
  if (uploadedFile.value && labelCol.value && valueCol.value) {
    generateChartPreview()
  }
})

const close = () => {
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
}

.preview-img {
  max-width: 100%;
  max-height: 200px;
  border-radius: 8px;
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
</style>
