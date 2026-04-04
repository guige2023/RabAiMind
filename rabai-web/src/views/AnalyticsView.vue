<template>
  <div class="analytics-page">
    <!-- Header -->
    <div class="analytics-header">
      <div class="header-left">
        <router-link to="/" class="back-link">← 首页</router-link>
        <h1 class="page-title">📊 数据分析</h1>
      </div>
      <div class="header-actions">
        <button class="btn btn-outline" @click="refresh" :disabled="loading">
          🔄 {{ loading ? '加载中...' : '刷新' }}
        </button>
        <button class="btn btn-primary" @click="exportCSV">
          📥 导出CSV
        </button>
      </div>
    </div>

    <!-- Error state -->
    <div v-if="error" class="error-banner">
      <span>⚠️ {{ error }}</span>
      <button class="btn-close" @click="error = null">✕</button>
    </div>

    <!-- Loading state -->
    <div v-if="loading && !analyticsData" class="loading-state">
      <div class="loading-spinner"></div>
      <p>加载分析数据...</p>
    </div>

    <!-- Empty state -->
    <div v-else-if="!analyticsData || summary.total_generations === 0" class="empty-state">
      <div class="empty-icon">📊</div>
      <h2>暂无数据</h2>
      <p>开始生成 PPT 后，这里将展示你的使用统计数据</p>
      <router-link to="/create" class="btn btn-primary">🚀 开始创建 PPT</router-link>
    </div>

    <!-- Dashboard content -->
    <div v-else class="analytics-content">

      <!-- Row 1: Summary Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📑</div>
          <div class="stat-info">
            <div class="stat-value">{{ summary.total_generations }}</div>
            <div class="stat-label">PPT 生成总数</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-info">
            <div class="stat-value">{{ summary.total_slides }}</div>
            <div class="stat-label">幻灯片总数</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⏱</div>
          <div class="stat-info">
            <div class="stat-value">{{ formatTime(summary.total_time_seconds) }}</div>
            <div class="stat-label">累计生成耗时</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📐</div>
          <div class="stat-info">
            <div class="stat-value">{{ summary.avg_slides_per_ppt }}</div>
            <div class="stat-label">平均每PPT页数</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🎨</div>
          <div class="stat-info">
            <div class="stat-value">{{ summary.unique_templates_used }}</div>
            <div class="stat-label">使用模板数</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⚡</div>
          <div class="stat-info">
            <div class="stat-value">{{ formatTime(summary.avg_time_seconds) }}</div>
            <div class="stat-label">平均生成耗时</div>
          </div>
        </div>
      </div>

      <!-- Row 2: Productivity Score + Popular Templates -->
      <div class="two-col-grid">
        <!-- Productivity Score -->
        <div class="panel productivity-panel">
          <div class="panel-header">
            <h3>⚡ 生产力评分</h3>
            <span class="score-badge" :style="{ color: productivityLabel.color }">
              {{ productivityLabel.label }}
            </span>
          </div>
          <div class="productivity-content">
            <div class="score-display">
              <svg viewBox="0 0 120 120" class="score-ring">
                <!-- Background ring -->
                <circle cx="60" cy="60" r="52" fill="none" stroke="#f0f0f0" stroke-width="10"/>
                <!-- Score ring -->
                <circle
                  cx="60" cy="60" r="52"
                  fill="none"
                  :stroke="productivityLabel.color"
                  stroke-width="10"
                  stroke-linecap="round"
                  :stroke-dasharray="`${circumference}`"
                  :stroke-dashoffset="`${scoreOffset}`"
                  transform="rotate(-90 60 60)"
                  style="transition: stroke-dashoffset 1s ease"
                />
              </svg>
              <div class="score-number">
                <span class="big-score">{{ analyticsData.productivity_score }}</span>
                <span class="score-max">/100</span>
              </div>
            </div>
            <div class="score-breakdown">
              <div class="breakdown-item">
                <span class="b-label">📊 生成量</span>
                <div class="b-bar-bg"><div class="b-bar-fill" style="width: 40%"></div></div>
              </div>
              <div class="breakdown-item">
                <span class="b-label">⚡ 生成速度</span>
                <div class="b-bar-bg"><div class="b-bar-fill" style="width: 30%"></div></div>
              </div>
              <div class="breakdown-item">
                <span class="b-label">📅 活跃天数</span>
                <div class="b-bar-bg"><div class="b-bar-fill" style="width: 30%"></div></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Popular Templates Bar Chart -->
        <div class="panel templates-panel">
          <div class="panel-header">
            <h3>🎨 热门模板 TOP 10</h3>
          </div>
          <div class="bar-chart-container" v-if="analyticsData.popular_templates.length > 0">
            <svg :viewBox="`0 0 ${chartWidth} ${chartHeight}`" class="bar-chart">
              <!-- Y axis labels -->
              <text
                v-for="(item, i) in analyticsData.popular_templates"
                :key="'y-' + i"
                x="0"
                :y="barY(i) + labelOffset"
                class="chart-label"
                text-anchor="end"
              >{{ truncate(item.name, 10) }}</text>

              <!-- Bars -->
              <rect
                v-for="(item, i) in analyticsData.popular_templates"
                :key="'bar-' + i"
                :x="labelWidth"
                :y="barY(i) + barPadding / 2"
                :width="barWidth(item.count)"
                :height="barHeight"
                :fill="chartColors[i % chartColors.length]"
                rx="3"
                class="bar-rect"
              >
                <title>{{ item.name }}: {{ item.count }}</title>
              </rect>

              <!-- Count labels -->
              <text
                v-for="(item, i) in analyticsData.popular_templates"
                :key="'cnt-' + i"
                :x="labelWidth + barWidth(item.count) + 4"
                :y="barY(i) + labelOffset"
                class="chart-count"
              >{{ item.count }}</text>
            </svg>
          </div>
          <div v-else class="no-data-hint">暂无数据</div>
        </div>
      </div>

      <!-- Row 3: Daily Stats Line Chart -->
      <div class="panel daily-stats-panel">
        <div class="panel-header">
          <h3>📈 每日生成趋势（近30天）</h3>
          <span class="total-badge">累计 {{ dailyTotal }} 次</span>
        </div>
        <div class="line-chart-container" v-if="analyticsData.daily_stats.length > 0">
          <svg :viewBox="`0 0 ${lineChartWidth} ${lineChartHeight}`" class="line-chart">
            <!-- Y axis grid lines -->
            <line
              v-for="(tick, i) in yTicks"
              :key="'ygrid-' + i"
              :x1="padding.left"
              :x2="lineChartWidth - padding.right"
              :y1="yPos(tick)"
              :y2="yPos(tick)"
              stroke="#e8e8e8"
              stroke-width="1"
            />
            <!-- Y axis labels -->
            <text
              v-for="(tick, i) in yTicks"
              :key="'ylbl-' + i"
              :x="padding.left - 8"
              :y="yPos(tick) + 4"
              class="chart-label"
              text-anchor="end"
            >{{ tick }}</text>

            <!-- X axis labels (every 5 days) -->
            <text
              v-for="(stat, i) in analyticsData.daily_stats.filter((_, idx) => idx % 5 === 0)"
              :key="'xlbl-' + i"
              :x="xPos(analyticsData.daily_stats.filter((_, idx) => idx % 5 === 0).indexOf(stat))"
              :y="lineChartHeight - padding.bottom + 16"
              class="chart-label"
              text-anchor="middle"
            >{{ stat.day_label }}</text>

            <!-- Area fill -->
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#165DFF" stop-opacity="0.3"/>
                <stop offset="100%" stop-color="#165DFF" stop-opacity="0.02"/>
              </linearGradient>
            </defs>
            <path
              :d="areaPath"
              fill="url(#areaGradient)"
            />

            <!-- Line -->
            <path
              :d="linePath"
              fill="none"
              stroke="#165DFF"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />

            <!-- Dots for non-zero values -->
            <circle
              v-for="(stat, i) in analyticsData.daily_stats"
              :key="'dot-' + i"
              v-if="stat.count > 0"
              :cx="xPos(i)"
              :cy="yPos(stat.count)"
              r="3"
              fill="#165DFF"
            >
              <title>{{ stat.date }}: {{ stat.count }}次</title>
            </circle>
          </svg>
        </div>
        <div v-else class="no-data-hint">暂无数据</div>
      </div>

      <!-- Row 4: Weekly Activity Heatmap -->
      <div class="panel heatmap-panel">
        <div class="panel-header">
          <h3>🗓 周活跃热力图</h3>
          <div class="heatmap-legend">
            <span class="legend-label">少</span>
            <div class="legend-scale">
              <div v-for="n in 5" :key="n" class="legend-cell" :class="'level-' + (n-1)"></div>
            </div>
            <span class="legend-label">多</span>
          </div>
        </div>
        <div class="heatmap-container">
          <!-- Hour labels -->
          <div class="heatmap-row header-row">
            <div class="heatmap-cell day-label"></div>
            <div
              v-for="h in [6, 9, 12, 15, 18, 21]"
              :key="'h-' + h"
              class="heatmap-cell hour-label"
            >{{ h }}时</div>
          </div>
          <!-- Day rows -->
          <div
            v-for="row in analyticsData.weekly_activity"
            :key="row.day_idx"
            class="heatmap-row"
          >
            <div class="heatmap-cell day-label">{{ row.day }}</div>
            <div
              v-for="h in range(24)"
              :key="'c-' + h"
              class="heatmap-cell"
              :class="getHeatmapClass(row[String(h)])"
              :title="`${row.day} ${h}时: ${row[String(h)] || 0}次`"
            ></div>
          </div>
        </div>
      </div>

      <!-- Row 5: Style & Scene Popularity -->
      <div class="two-col-grid">
        <div class="panel">
          <div class="panel-header"><h3>🎯 风格分布</h3></div>
          <div class="mini-bar-list" v-if="analyticsData.popular_styles.length > 0">
            <div v-for="(item, i) in analyticsData.popular_styles.slice(0, 8)" :key="item.name" class="mini-bar-item">
              <span class="mini-bar-label">{{ item.name }}</span>
              <div class="mini-bar-track">
                <div
                  class="mini-bar-fill"
                  :style="{
                    width: barPercent(item.count) + '%',
                    background: chartColors[i % chartColors.length]
                  }"
                ></div>
              </div>
              <span class="mini-bar-count">{{ item.count }}</span>
            </div>
          </div>
          <div v-else class="no-data-hint">暂无数据</div>
        </div>
        <div class="panel">
          <div class="panel-header"><h3>🏷 场景分布</h3></div>
          <div class="mini-bar-list" v-if="analyticsData.popular_scenes.length > 0">
            <div v-for="(item, i) in analyticsData.popular_scenes.slice(0, 8)" :key="item.name" class="mini-bar-item">
              <span class="mini-bar-label">{{ sceneLabel(item.name) }}</span>
              <div class="mini-bar-track">
                <div
                  class="mini-bar-fill"
                  :style="{
                    width: barPercent(item.count) + '%',
                    background: chartColors[i % chartColors.length]
                  }"
                ></div>
              </div>
              <span class="mini-bar-count">{{ item.count }}</span>
            </div>
          </div>
          <div v-else class="no-data-hint">暂无数据</div>
        </div>
      </div>

      <!-- Row 6: Carbon Footprint Savings -->
      <div class="panel carbon-panel" v-if="analyticsData?.carbon_footprint">
        <div class="panel-header">
          <h3>🌱 碳排放节省计算器</h3>
          <span class="eco-badge">环保贡献</span>
        </div>
        <div class="carbon-content">
          <div class="carbon-stats">
            <div class="carbon-card highlight">
              <div class="carbon-icon">🌿</div>
              <div class="carbon-value">{{ analyticsData.carbon_footprint.trees_equivalent }}</div>
              <div class="carbon-label">相当于种树（棵）</div>
            </div>
            <div class="carbon-card">
              <div class="carbon-icon">💨</div>
              <div class="carbon-value">{{ analyticsData.carbon_footprint.kg_co2_saved }} kg</div>
              <div class="carbon-label">CO₂ 减排量</div>
            </div>
            <div class="carbon-card">
              <div class="carbon-icon">⏱</div>
              <div class="carbon-value">{{ analyticsData.carbon_footprint.time_saved_minutes }} 分钟</div>
              <div class="carbon-label">节省时间</div>
            </div>
            <div class="carbon-card">
              <div class="carbon-icon">📄</div>
              <div class="carbon-value">{{ analyticsData.carbon_footprint.paper_sheets_saved }} 张</div>
              <div class="carbon-label">节省纸张</div>
            </div>
            <div class="carbon-card">
              <div class="carbon-icon">💧</div>
              <div class="carbon-value">{{ analyticsData.carbon_footprint.liters_water_saved }} L</div>
              <div class="carbon-label">节约用水</div>
            </div>
          </div>
          <div class="carbon-note">
            💡 基于以下估算：传统制作每页 PPT 约 15 分钟，RabAiMind 约 2 分钟；电脑功耗 50W；中国电网 CO₂ 排放因子 0.528 kg/kWh
          </div>
        </div>
      </div>

      <!-- Row 7: Most Used Features Ranking -->
      <div class="panel features-panel" v-if="analyticsData?.most_used_features?.length > 0">
        <div class="panel-header">
          <h3>🏆 功能使用排行榜 TOP 10</h3>
        </div>
        <div class="features-list">
          <div
            v-for="feature in analyticsData.most_used_features"
            :key="feature.rank"
            class="feature-item"
          >
            <div class="feature-rank" :class="'rank-' + feature.rank">
              {{ feature.rank <= 3 ? ['🥇','🥈','🥉'][feature.rank-1] : '#' + feature.rank }}
            </div>
            <div class="feature-info">
              <div class="feature-name">{{ feature.name }}</div>
              <div class="feature-category">
                <span class="category-tag" :class="'cat-' + feature.category">
                  {{ feature.category === 'template' ? '📐 模板' : feature.category === 'style' ? '🎨 风格' : '🏷 场景' }}
                </span>
              </div>
            </div>
            <div class="feature-count">{{ feature.count }} 次</div>
          </div>
        </div>
      </div>

      <!-- Row 8: Weekly Email Summary Subscription -->
      <div class="panel email-panel">
        <div class="panel-header">
          <h3>📧 每周汇总邮件</h3>
        </div>
        <div class="email-content">
          <div class="email-toggle-row">
            <div class="email-desc">
              <div class="email-title">订阅每周数据报告</div>
              <div class="email-subtitle">每周一发送上周使用统计、碳排节省和排行榜变化</div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" v-model="emailSubscribed" @change="toggleWeeklyEmail">
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div v-if="emailSubscribed" class="email-status success">
            ✅ 已订阅 | 将发送至：{{ weeklyEmail }}
          </div>
          <div v-else class="email-status">
            📬 开启后每周一自动收到您的专属数据报告
          </div>
          <div v-if="emailMessage" class="email-message" :class="{ error: emailError }">
            {{ emailMessage }}
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAnalytics } from '../composables/useAnalytics'

const { analyticsData, loading, error, fetchAnalytics, exportCSV, formatTime, productivityLabel, chartColors } = useAnalytics()

const padding = { top: 20, right: 20, bottom: 36, left: 48 }
const lineChartWidth = 800
const lineChartHeight = 200
const chartWidth = 360
const chartHeight = 280
const labelWidth = 60
const labelOffset = 14
const barPadding = 16
const barHeight = 16

const chartColors_list = [
  '#165DFF', '#00B42A', '#FF7D00', '#F53FAD', '#722ED1',
  '#0FC6C2', '#FADB14', '#EB5757', '#2D8768', '#33679A'
]

const circumference = 2 * Math.PI * 52  // ~326.7

const scoreOffset = computed(() => {
  const score = analyticsData.value?.productivity_score ?? 0
  return circumference - (circumference * score / 100)
})

const summary = computed(() => analyticsData.value?.summary ?? {
  total_generations: 0, total_slides: 0, total_time_seconds: 0,
  avg_time_seconds: 0, avg_slides_per_ppt: 0, unique_templates_used: 0
})

const maxCount = computed(() => {
  const templates = analyticsData.value?.popular_templates ?? []
  return Math.max(...templates.map(t => t.count), 1)
})

const maxStyleCount = computed(() => {
  const styles = analyticsData.value?.popular_styles ?? []
  return Math.max(...styles.map(s => s.count), 1)
})

const barWidth = (count: number) => {
  const maxW = chartWidth - labelWidth - 60
  return Math.max(2, (count / maxCount.value) * maxW)
}

const barY = (i: number) => i * (barHeight + barPadding)

const barPercent = (count: number) => {
  return Math.min(100, (count / maxStyleCount.value) * 100)
}

const truncate = (s: string, len: number) => s.length > len ? s.slice(0, len) + '…' : s

// Line chart helpers
const innerWidth = computed(() => lineChartWidth - padding.left - padding.right)
const innerHeight = computed(() => lineChartHeight - padding.top - padding.bottom)

const maxDaily = computed(() => {
  const stats = analyticsData.value?.daily_stats ?? []
  return Math.max(...stats.map(s => s.count), 1)
})

const yTicks = computed(() => {
  const m = maxDaily.value
  if (m <= 1) return [0, 1]
  if (m <= 5) return [0, 2, 4, 5]
  if (m <= 10) return [0, 2, 4, 6, 8, 10]
  const step = Math.ceil(m / 4)
  return [0, step, step * 2, step * 3, m]
})

const xPos = (i: number) => {
  const stats = analyticsData.value?.daily_stats ?? []
  if (stats.length <= 1) return padding.left + innerWidth.value / 2
  return padding.left + (i / (stats.length - 1)) * innerWidth.value
}

const yPos = (value: number) => {
  return padding.top + innerHeight.value - (value / maxDaily.value) * innerHeight.value
}

const buildLinePath = (coords: [number, number][]) => {
  if (coords.length === 0) return ''
  let d = `M ${coords[0][0]} ${coords[0][1]}`
  for (let i = 1; i < coords.length; i++) {
    d += ` L ${coords[i][0]} ${coords[i][1]}`
  }
  return d
}

const linePath = computed(() => {
  const stats = analyticsData.value?.daily_stats ?? []
  const coords: [number, number][] = stats.map((s, i) => [xPos(i), yPos(s.count)])
  return buildLinePath(coords)
})

const areaPath = computed(() => {
  const stats = analyticsData.value?.daily_stats ?? []
  if (stats.length === 0) return ''
  const bottom = padding.top + innerHeight.value
  const coords: [number, number][] = stats.map((s, i) => [xPos(i), yPos(s.count)])
  let d = `M ${coords[0][0]} ${bottom}`
  for (const [x, y] of coords) {
    d += ` L ${x} ${y}`
  }
  d += ` L ${coords[coords.length - 1][0]} ${bottom} Z`
  return d
})

const dailyTotal = computed(() => {
  const stats = analyticsData.value?.daily_stats ?? []
  return stats.reduce((sum, s) => sum + s.count, 0)
})

// Heatmap helpers
const range = (n: number) => Array.from({ length: n }, (_, i) => i)

const getHeatmapClass = (count: number | undefined) => {
  const c = count ?? 0
  if (c === 0) return 'level-0'
  if (c === 1) return 'level-1'
  if (c <= 3) return 'level-2'
  if (c <= 6) return 'level-3'
  return 'level-4'
}

const sceneLabel = (scene: string) => {
  const map: Record<string, string> = {
    business: '💼 商务', education: '📚 教育', tech: '💻 科技',
    creative: '🎨 创意', marketing: '📣 营销', finance: '💰 金融',
    medical: '🏥 医疗', government: '🏛 政府'
  }
  return map[scene] || scene
}

const refresh = () => fetchAnalytics(true)

// Weekly email subscription
const emailSubscribed = ref(false)
const weeklyEmail = ref('')
const emailMessage = ref('')
const emailError = ref(false)

const toggleWeeklyEmail = async () => {
  emailError.value = false
  emailMessage.value = ''
  try {
    const base = '/api/v1/analytics/weekly-email'
    const resp = await fetch(base, {
      method: emailSubscribed.value ? 'POST' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscribed: emailSubscribed.value, email: weeklyEmail.value })
    })
    const data = await resp.json()
    emailMessage.value = data.message || (emailSubscribed.value ? '已订阅每周汇总邮件' : '已取消订阅')
    if (!resp.ok) emailError.value = true
  } catch (e: any) {
    emailMessage.value = '设置失败: ' + (e.message || '网络错误')
    emailError.value = true
    emailSubscribed.value = !emailSubscribed.value // revert
  }
}

const loadWeeklyEmailStatus = async () => {
  try {
    const resp = await fetch('/api/v1/analytics/weekly-email')
    if (resp.ok) {
      const data = await resp.json()
      emailSubscribed.value = data.subscribed
      weeklyEmail.value = data.email || ''
    }
  } catch (e) {
    // Silently fail
  }
}

onMounted(() => {
  fetchAnalytics()
  loadWeeklyEmailStatus()
})
</script>

<style scoped>
.analytics-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 24px;
}

.analytics-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.back-link {
  color: #165DFF;
  text-decoration: none;
  font-size: 14px;
  margin-right: 12px;
}

.back-link:hover { text-decoration: underline; }

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #1f1f1f;
  margin: 0;
}

.header-actions { display: flex; gap: 12px; }

.error-banner {
  background: #fff2f0;
  border: 1px solid #ffccc7;
  color: #ff4d4f;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: #8c8c8c;
}

.empty-icon { font-size: 64px; margin-bottom: 16px; }

.empty-state h2 { margin: 0 0 8px; color: #1f1f1f; }
.empty-state p { margin: 0 0 24px; }

.loading-spinner {
  width: 40px; height: 40px;
  border: 3px solid #e8e8e8;
  border-top-color: #165DFF;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin { to { transform: rotate(360deg); } }

.analytics-content { display: flex; flex-direction: column; gap: 20px; }

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  transition: box-shadow 0.2s;
}
.stat-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); }

.stat-icon { font-size: 28px; }

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1f1f1f;
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: #8c8c8c;
  margin-top: 2px;
}

/* Two-column layout */
.two-col-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 20px;
}

@media (max-width: 900px) {
  .two-col-grid { grid-template-columns: 1fr; }
}

/* Panels */
.panel {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.panel-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1f1f1f;
  margin: 0;
}

.no-data-hint {
  text-align: center;
  color: #bfbfbf;
  padding: 40px 0;
  font-size: 14px;
}

/* Productivity Score */
.score-badge {
  font-size: 14px;
  font-weight: 600;
}

.productivity-content {
  display: flex;
  align-items: center;
  gap: 32px;
}

.score-display {
  position: relative;
  width: 120px;
  height: 120px;
  flex-shrink: 0;
}

.score-ring {
  width: 120px;
  height: 120px;
}

.score-ring circle {
  transition: stroke-dashoffset 1s ease;
}

.score-number {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.big-score {
  font-size: 32px;
  font-weight: 700;
  color: #1f1f1f;
  line-height: 1;
}

.score-max {
  font-size: 12px;
  color: #bfbfbf;
}

.score-breakdown {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.breakdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.b-label {
  font-size: 13px;
  color: #595959;
  width: 80px;
  flex-shrink: 0;
}

.b-bar-bg {
  flex: 1;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.b-bar-fill {
  height: 100%;
  background: #165DFF;
  border-radius: 4px;
  transition: width 1s ease;
}

/* Bar Chart */
.bar-chart-container {
  overflow-x: auto;
}

.bar-chart {
  width: 100%;
  height: 280px;
  overflow: visible;
}

.bar-rect {
  transition: width 0.6s ease;
}

.chart-label {
  font-size: 11px;
  fill: #595959;
  font-family: sans-serif;
}

.chart-count {
  font-size: 11px;
  fill: #8c8c8c;
  font-family: sans-serif;
}

/* Line Chart */
.line-chart-container {
  overflow-x: auto;
}

.line-chart {
  width: 100%;
  height: 200px;
  min-width: 600px;
}

/* Heatmap */
.heatmap-legend {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #8c8c8c;
}

.legend-scale {
  display: flex;
  gap: 2px;
}

.legend-cell {
  width: 16px;
  height: 16px;
  border-radius: 3px;
}

.level-0 { background: #f5f5f5; }
.level-1 { background: #d9f0ff; }
.level-2 { background: #91d5ff; }
.level-3 { background: #1890ff; }
.level-4 { background: #003eb3; }

.heatmap-container {
  overflow-x: auto;
}

.heatmap-row {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-bottom: 2px;
}

.heatmap-cell {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  flex-shrink: 0;
  cursor: default;
  transition: transform 0.15s;
}

.heatmap-cell:hover { transform: scale(1.2); z-index: 1; }

.hour-label {
  width: 28px;
  height: 20px;
  background: transparent;
  font-size: 10px;
  color: #8c8c8c;
  display: flex;
  align-items: center;
  justify-content: center;
}

.day-label {
  width: 40px;
  font-size: 12px;
  color: #595959;
  background: transparent;
  flex-shrink: 0;
}

/* Mini bar list */
.mini-bar-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mini-bar-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mini-bar-label {
  font-size: 13px;
  color: #595959;
  width: 70px;
  flex-shrink: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mini-bar-track {
  flex: 1;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.mini-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.6s ease;
}

.mini-bar-count {
  font-size: 12px;
  color: #8c8c8c;
  width: 24px;
  text-align: right;
  flex-shrink: 0;
}

/* Total badge */
.total-badge {
  font-size: 13px;
  color: #8c8c8c;
  background: #f5f5f5;
  padding: 4px 10px;
  border-radius: 12px;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-primary {
  background: #165DFF;
  color: white;
}

.btn-primary:hover { background: #3d7bff; }

.btn-outline {
  background: white;
  color: #595959;
  border: 1px solid #d9d9d9;
}

.btn-outline:hover { border-color: #165DFF; color: #165DFF; }

.btn-close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  color: #8c8c8c;
  padding: 0;
}

/* Carbon Footprint Panel */
.carbon-panel .eco-badge {
  font-size: 12px;
  background: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
  padding: 3px 10px;
  border-radius: 12px;
}

.carbon-content {}

.carbon-stats {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

@media (max-width: 900px) {
  .carbon-stats { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 600px) {
  .carbon-stats { grid-template-columns: repeat(2, 1fr); }
}

.carbon-card {
  background: #fafafa;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  border: 1px solid #f0f0f0;
  transition: all 0.2s;
}

.carbon-card.highlight {
  background: linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%);
  border-color: #b7eb8f;
}

.carbon-icon { font-size: 28px; margin-bottom: 8px; }

.carbon-value {
  font-size: 22px;
  font-weight: 700;
  color: #1f1f1f;
  line-height: 1.2;
}

.carbon-label {
  font-size: 12px;
  color: #8c8c8c;
  margin-top: 4px;
}

.carbon-note {
  font-size: 12px;
  color: #8c8c8c;
  background: #fafafa;
  border-radius: 8px;
  padding: 10px 14px;
  line-height: 1.5;
}

/* Most Used Features Panel */
.features-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #fafafa;
  transition: background 0.2s;
}

.feature-item:hover { background: #f0f7ff; }

.feature-rank {
  font-size: 18px;
  width: 36px;
  text-align: center;
  flex-shrink: 0;
}

.rank-1 { color: #faad14; }
.rank-2 { color: #8c8c8c; }
.rank-3 { color: #d48806; }

.feature-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.feature-name {
  font-size: 14px;
  font-weight: 500;
  color: #1f1f1f;
}

.category-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  display: inline-block;
}
.cat-template { background: #e6f4ff; color: #165DFF; }
.cat-style { background: #fff0f6; color: #F53FAD; }
.cat-scene { background: #f9f0ff; color: #722ED1; }

.feature-count {
  font-size: 14px;
  font-weight: 600;
  color: #595959;
  flex-shrink: 0;
}

/* Weekly Email Panel */
.email-content {}

.email-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.email-desc { flex: 1; }

.email-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f1f1f;
  margin-bottom: 4px;
}

.email-subtitle {
  font-size: 13px;
  color: #8c8c8c;
}

/* Toggle switch */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 26px;
  flex-shrink: 0;
}

.toggle-switch input { opacity: 0; width: 0; height: 0; }

.toggle-slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background-color: #ccc;
  transition: 0.3s;
  border-radius: 26px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

.toggle-switch input:checked + .toggle-slider {
  background-color: #52c41a;
}

.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(22px);
}

.email-status {
  font-size: 13px;
  color: #8c8c8c;
  padding: 8px 12px;
  background: #fafafa;
  border-radius: 8px;
  margin-bottom: 8px;
}

.email-status.success {
  color: #52c41a;
  background: #f6ffed;
}

.email-message {
  font-size: 13px;
  color: #52c41a;
  padding: 8px 12px;
  background: #f6ffed;
  border-radius: 8px;
  border: 1px solid #b7eb8f;
}

.email-message.error {
  color: #ff4d4f;
  background: #fff2f0;
  border-color: #ffccc7;
}
</style>
