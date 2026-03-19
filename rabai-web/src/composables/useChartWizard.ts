// Chart Wizard - 图表向导
import { ref, computed } from 'vue'

export type ChartType = 'bar' | 'line' | 'pie' | 'doughnut' | 'area' | 'scatter' | 'radar' | 'funnel' | 'waterfall' | 'treemap'

export interface ChartData {
  labels: string[]
  datasets: ChartDataset[]
}

export interface ChartDataset {
  label: string
  data: number[]
  backgroundColor?: string | string[]
  borderColor?: string | string[]
  borderWidth?: number
  fill?: boolean
}

export interface ChartOptions {
  title: string
  subtitle?: string
  legend: 'top' | 'bottom' | 'left' | 'right' | 'none'
  axes: {
    x: { show: boolean; title: string; grid: boolean }
    y: { show: boolean; title: string; grid: boolean; min?: number; max?: number }
  }
  colors: string[]
  animation: boolean
  tooltip: boolean
  dataLabels: boolean
}

export interface ChartPreset {
  id: string
  name: string
  type: ChartType
  icon: string
  description: string
}

export interface ChartTemplate {
  id: string
  name: string
  type: ChartType
  data: ChartData
  options: ChartOptions
}

export function useChartWizard() {
  // 当前图表类型
  const chartType = ref<ChartType>('bar')

  // 图表数据
  const chartData = ref<ChartData>({
    labels: ['一月', '二月', '三月', '四月', '五月', '六月'],
    datasets: [
      { label: '销售额', data: [12000, 19000, 3000, 5000, 2000, 30000], backgroundColor: '#3b82f6', borderColor: '#3b82f6', borderWidth: 1 },
      { label: '利润', data: [8000, 12000, 2000, 3000, 1500, 20000], backgroundColor: '#10b981', borderColor: '#10b981', borderWidth: 1 }
    ]
  })

  // 图表选项
  const chartOptions = ref<ChartOptions>({
    title: '销售数据',
    subtitle: '2024年上半年',
    legend: 'top',
    axes: {
      x: { show: true, title: '月份', grid: true },
      y: { show: true, title: '金额', grid: true, min: 0 }
    },
    colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
    animation: true,
    tooltip: true,
    dataLabels: false
  })

  // 图表预设
  const presets = ref<ChartPreset[]>([
    { id: 'preset_bar', name: '柱状图', type: 'bar', icon: '📊', description: '比较不同类别的数值' },
    { id: 'preset_line', name: '折线图', type: 'line', icon: '📈', description: '显示数据趋势变化' },
    { id: 'preset_pie', name: '饼图', type: 'pie', icon: '🥧', description: '显示部分占总体的比例' },
    { id: 'preset_doughnut', name: '环形图', type: 'doughnut', icon: '🍩', description: '显示部分占总体的比例' },
    { id: 'preset_area', name: '面积图', type: 'area', icon: '📉', description: '强调数据总量变化' },
    { id: 'preset_scatter', name: '散点图', type: 'scatter', icon: '⚡', description: '显示两个变量的关系' },
    { id: 'preset_radar', name: '雷达图', type: 'radar', icon: '🕸️', description: '多维度比较分析' },
    { id: 'preset_funnel', name: '漏斗图', type: 'funnel', icon: '🔻', description: '显示流程转化' },
    { id: 'preset_waterfall', name: '瀑布图', type: 'waterfall', icon: '�瀑布', description: '显示增减变化' },
    { id: 'preset_treemap', name: '树图', type: 'treemap', icon: '🌳', description: '显示层次结构数据' }
  ])

  // 图表模板
  const templates = ref<ChartTemplate[]>([
    {
      id: 'template_sales',
      name: '月度销售额',
      type: 'bar',
      data: { labels: ['1月', '2月', '3月', '4月', '5月', '6月'], datasets: [{ label: '销售额', data: [12000, 19000, 15000, 22000, 18000, 25000], backgroundColor: '#3b82f6' }] },
      options: { title: '月度销售额', legend: 'top', axes: { x: { show: true, title: '月份', grid: true }, y: { show: true, title: '金额', grid: true } }, colors: ['#3b82f6'], animation: true, tooltip: true, dataLabels: false }
    },
    {
      id: 'template_trend',
      name: '趋势分析',
      type: 'line',
      data: { labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'], datasets: [{ label: '访问量', data: [120, 192, 150, 220, 180, 300, 250], borderColor: '#10b981', fill: true, backgroundColor: 'rgba(16, 185, 129, 0.1)' }] },
      options: { title: '周访问趋势', legend: 'none', axes: { x: { show: true, title: '日期', grid: false }, y: { show: true, title: '访问量', grid: true } }, colors: ['#10b981'], animation: true, tooltip: true, dataLabels: false }
    },
    {
      id: 'template_share',
      name: '市场份额',
      type: 'pie',
      data: { labels: ['产品A', '产品B', '产品C', '产品D'], datasets: [{ label: '份额', data: [35, 25, 20, 20], backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'] }] },
      options: { title: '产品市场份额', legend: 'right', axes: { x: { show: false, title: '', grid: false }, y: { show: false, title: '', grid: false } }, colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'], animation: true, tooltip: true, dataLabels: true }
    }
  ])

  // 更新数据
  const updateData = (data: Partial<ChartData>) => {
    Object.assign(chartData.value, data)
  }

  // 添加数据集
  const addDataset = (dataset: ChartDataset) => {
    chartData.value.datasets.push(dataset)
  }

  // 移除数据集
  const removeDataset = (index: number) => {
    if (index >= 0 && index < chartData.value.datasets.length) {
      chartData.value.datasets.splice(index, 1)
    }
  }

  // 更新数据集
  const updateDataset = (index: number, updates: Partial<ChartDataset>) => {
    if (index >= 0 && index < chartData.value.datasets.length) {
      Object.assign(chartData.value.datasets[index], updates)
    }
  }

  // 添加标签
  const addLabel = (label: string) => {
    chartData.value.labels.push(label)
    chartData.value.datasets.forEach(ds => ds.data.push(0))
  }

  // 移除标签
  const removeLabel = (index: number) => {
    if (index >= 0 && index < chartData.value.labels.length) {
      chartData.value.labels.splice(index, 1)
      chartData.value.datasets.forEach(ds => ds.data.splice(index, 1))
    }
  }

  // 设置图表类型
  const setChartType = (type: ChartType) => {
    chartType.value = type
  }

  // 应用预设
  const applyPreset = (presetId: string) => {
    const preset = presets.value.find(p => p.id === presetId)
    if (preset) {
      chartType.value = preset.type
    }
  }

  // 应用模板
  const applyTemplate = (templateId: string) => {
    const template = templates.value.find(t => t.id === templateId)
    if (template) {
      chartType.value = template.type
      chartData.value = JSON.parse(JSON.stringify(template.data))
      chartOptions.value = JSON.parse(JSON.stringify(template.options))
    }
  }

  // 更新选项
  const updateOptions = (options: Partial<ChartOptions>) => {
    Object.assign(chartOptions.value, options)
  }

  // 生成随机数据
  const generateRandomData = (count: number, min: number, max: number): number[] => {
    return Array.from({ length: count }, () => Math.floor(Math.random() * (max - min + 1)) + min)
  }

  // 创建示例图表
  const createSampleChart = (type: ChartType) => {
    chartType.value = type

    const labels = ['A', 'B', 'C', 'D', 'E']
    const dataset = {
      label: '数据',
      data: generateRandomData(5, 10, 100),
      backgroundColor: chartOptions.value.colors[0],
      borderColor: chartOptions.value.colors[0],
      borderWidth: 1
    }

    chartData.value = { labels, datasets: [dataset] }
  }

  // 导入CSV数据
  const importCSV = (csv: string): boolean => {
    try {
      const lines = csv.trim().split('\n')
      if (lines.length < 2) return false

      const labels = lines[0].split(',').slice(1)
      const datasets: ChartDataset[] = []

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',')
        if (parts.length < 2) continue

        datasets.push({
          label: parts[0],
          data: parts.slice(1).map(Number),
          backgroundColor: chartOptions.value.colors[i - 1] || '#3b82f6',
          borderColor: chartOptions.value.colors[i - 1] || '#3b82f6'
        })
      }

      chartData.value = { labels, datasets }
      return true
    } catch {
      return false
    }
  }

  // 导出为JSON
  const exportJSON = computed(() => JSON.stringify({
    type: chartType.value,
    data: chartData.value,
    options: chartOptions.value
  }, null, 2))

  // 按类型获取预设
  const getPresetsByType = computed(() => {
    const types: Record<string, ChartPreset[]> = {}
    presets.value.forEach(preset => {
      if (!types[preset.type]) {
        types[preset.type] = []
      }
      types[preset.type].push(preset)
    })
    return types
  })

  // 统计
  const stats = computed(() => ({
    chartType: chartType.value,
    labelsCount: chartData.value.labels.length,
    datasetsCount: chartData.value.datasets.length,
    totalDataPoints: chartData.value.labels.length * chartData.value.datasets.length,
    hasTitle: !!chartOptions.value.title,
    legendPosition: chartOptions.value.legend
  }))

  return {
    chartType,
    chartData,
    chartOptions,
    presets,
    templates,
    updateData,
    addDataset,
    removeDataset,
    updateDataset,
    addLabel,
    removeLabel,
    setChartType,
    applyPreset,
    applyTemplate,
    updateOptions,
    createSampleChart,
    importCSV,
    exportJSON,
    getPresetsByType,
    stats
  }
}

export default useChartWizard
