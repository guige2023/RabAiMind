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
        <button class="btn btn-outline" @click="exportCSV">
          📥 导出CSV
        </button>
        <button class="btn btn-outline" @click="exportDataStudio">
          📊 Google Data Studio
        </button>
        <button class="btn btn-primary" @click="openCustomReportBuilder">
          🛠️ 自定义报告
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

      <!-- Presentation Analytics Section -->
      <div class="presentation-analytics-section">
        <div class="section-header">
          <h2 class="section-title">👁 演示浏览分析</h2>
          <div class="section-actions">
            <input
              v-model="presTaskId"
              placeholder="输入任务ID查看分析"
              class="task-id-input"
              @keydown.enter="loadPresAnalytics"
            />
            <button class="btn btn-outline" @click="loadPresAnalytics" :disabled="presLoading || !presTaskId.trim()">
              🔍 查询
            </button>
            <button
              v-if="presAnalytics"
              class="btn btn-primary"
              @click="exportPresPDF"
            >
              📄 导出PDF报告
            </button>
          </div>
        </div>

        <div v-if="presLoading" class="pres-loading">
          <div class="loading-spinner small"></div>
          <span>加载演示分析数据...</span>
        </div>

        <div v-else-if="presError" class="pres-error">
          ⚠️ {{ presError }}
        </div>

        <div v-else-if="!presAnalytics && !presTaskId" class="pres-empty">
          <div class="pres-empty-icon">👁</div>
          <p>输入PPT任务ID，查看谁浏览了你的演示、每页停留时长、注意力热力图等</p>
          <div v-if="recentTasks.length > 0" class="recent-tasks">
            <span class="recent-label">最近演示：</span>
            <button
              v-for="task in recentTasks"
              :key="task.task_id"
              class="recent-task-btn"
              @click="selectPresTask(task.task_id)"
            >
              {{ task.task_id.slice(0, 8) }}...
            </button>
          </div>
        </div>

        <div v-else-if="presAnalytics" class="pres-content">
          <!-- Summary row -->
          <div class="pres-stats-grid">
            <div class="stat-card">
              <div class="stat-icon">👁</div>
              <div class="stat-info">
                <div class="stat-value">{{ presAnalytics.total_views }}</div>
                <div class="stat-label">浏览次数</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">👤</div>
              <div class="stat-info">
                <div class="stat-value">{{ presAnalytics.unique_viewers }}</div>
                <div class="stat-label">独立访客</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">📜</div>
              <div class="stat-info">
                <div class="stat-value">{{ presAnalytics.avg_scroll_depth_percent }}%</div>
                <div class="stat-label">平均滚动深度</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">✅</div>
              <div class="stat-info">
                <div class="stat-value">{{ presAnalytics.scroll_depth_reached_end_count }}</div>
                <div class="stat-label">完整阅读人数</div>
              </div>
            </div>
          </div>

          <!-- Two column: viewers + slide time -->
          <div class="two-col-grid">
            <!-- Viewer list -->
            <div class="panel">
              <div class="panel-header"><h3>👥 访客列表</h3></div>
              <div v-if="presAnalytics.viewer_list.length === 0" class="no-data-hint">暂无数据</div>
              <div v-else class="viewer-list">
                <div v-for="viewer in presAnalytics.viewer_list" :key="viewer.viewer_id" class="viewer-item">
                  <div class="viewer-avatar">{{ (viewer.viewer_name || 'A')[0].toUpperCase() }}</div>
                  <div class="viewer-info">
                    <div class="viewer-name">{{ viewer.viewer_name || 'Anonymous' }}</div>
                    <div class="viewer-meta">{{ viewer.session_count }} 次会话 | {{ formatDuration(viewer.total_duration_seconds) }}</div>
                  </div>
                  <div class="viewer-time">{{ formatDate(viewer.last_view) }}</div>
                </div>
              </div>
            </div>

            <!-- Slide time chart -->
            <div class="panel">
              <div class="panel-header"><h3>⏱ 每页停留时长</h3></div>
              <div v-if="presAnalytics.slide_stats.length === 0" class="no-data-hint">暂无数据</div>
              <div v-else class="slide-time-chart">
                <svg :viewBox="`0 0 ${slideChartW} ${slideChartH}`" class="slide-bar-chart">
                  <!-- Y axis -->
                  <line :x1="slidePad.left" :x2="slidePad.left" :y1="slidePad.top" :y2="slideChartH - slidePad.bottom" stroke="#e8e8e8" stroke-width="1"/>
                  <!-- X axis -->
                  <line :x1="slidePad.left" :x2="slideChartW - slidePad.right" :y1="slideChartH - slidePad.bottom" :y2="slideChartH - slidePad.bottom" stroke="#e8e8e8" stroke-width="1"/>
                  <!-- Bars -->
                  <rect
                    v-for="(stat, i) in presAnalytics.slide_stats"
                    :key="'sb-' + i"
                    :x="slideBarX(i)"
                    :y="slideBarY(stat.avg_time_seconds)"
                    :width="slideBarW"
                    :height="slideBarH(stat.avg_time_seconds)"
                    :fill="chartColors_list[i % chartColors_list.length]"
                    rx="3"
                    class="slide-bar"
                  >
                    <title>{{ (stat.slide_index + 1) }}页: {{ stat.avg_time_seconds }}秒</title>
                  </rect>
                  <!-- X labels -->
                  <text
                    v-for="(stat, i) in presAnalytics.slide_stats"
                    :key="'sl-' + i"
                    :x="slideBarX(i) + slideBarW / 2"
                    :y="slideChartH - slidePad.bottom + 14"
                    text-anchor="middle"
                    font-size="10"
                    fill="#8c8c8c"
                  >{{ stat.slide_index + 1 }}</text>
                  <!-- Y labels -->
                  <text
                    v-for="tick in slideYTicks"
                    :key="'sy-' + tick"
                    :x="slidePad.left - 4"
                    :y="slideBarY(tick) + 4"
                    text-anchor="end"
                    font-size="10"
                    fill="#8c8c8c"
                  >{{ tick }}s</text>
                </svg>
              </div>
            </div>
          </div>

          <!-- Heatmap Section -->
          <div class="panel">
            <div class="panel-header">
              <h3>🔥 注意力热力图</h3>
              <span class="heatmap-label">颜色越深 = 关注度越高</span>
            </div>
            <div v-if="Object.keys(presAnalytics.overview_heatmap || {}).length === 0" class="no-data-hint">暂无数据</div>
            <div v-else class="heatmap-grid" :style="{ '--grid-size': presAnalytics.heatmap_grid_size }">
              <div
                v-for="cell in heatmapCells"
                :key="cell.key"
                class="heatmap-cell"
                :style="{ background: heatmapColor(cell.weight) }"
                :title="`区域 ${cell.key}: ${(cell.weight * 100).toFixed(0)}%`"
              ></div>
            </div>
          </div>

          <!-- Scroll Depth Distribution -->
          <div class="panel">
            <div class="panel-header"><h3>📜 滚动深度分布</h3></div>
            <div v-if="presAnalytics.scroll_depth_samples === 0" class="no-data-hint">暂无数据</div>
            <div v-else class="scroll-info">
              <div class="scroll-stat-row">
                <span class="scroll-stat-label">平均滚动深度</span>
                <div class="scroll-bar-bg">
                  <div class="scroll-bar-fill" :style="{ width: presAnalytics.avg_scroll_depth_percent + '%' }"></div>
                </div>
                <span class="scroll-stat-value">{{ presAnalytics.avg_scroll_depth_percent }}%</span>
              </div>
              <div class="scroll-stat-row">
                <span class="scroll-stat-label">完整阅读（≥90%）</span>
                <div class="scroll-bar-bg">
                  <div class="scroll-bar-fill complete" :style="{ width: scrollCompletePercent + '%' }"></div>
                </div>
                <span class="scroll-stat-value">{{ presAnalytics.scroll_depth_reached_end_count }} / {{ presAnalytics.scroll_depth_samples }}</span>
              </div>
            </div>
          </div>

          <!-- Effectiveness Score Panel -->
          <div class="panel" v-if="presAnalytics?.effectiveness_score">
            <div class="panel-header">
              <h3>🎯 演示效果评分</h3>
              <span class="score-badge" :style="{ color: effectivenessLabel.color }">
                {{ effectivenessLabel.label }}
              </span>
            </div>
            <div class="effectiveness-content">
              <!-- Big score ring -->
              <div class="eff-score-ring-wrapper">
                <svg viewBox="0 0 120 120" class="score-ring">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="#f0f0f0" stroke-width="10"/>
                  <circle
                    cx="60" cy="60" r="52"
                    fill="none"
                    :stroke="effectivenessLabel.color"
                    stroke-width="10"
                    stroke-linecap="round"
                    :stroke-dasharray="`${effCircumference}`"
                    :stroke-dashoffset="`${effScoreOffset}`"
                    transform="rotate(-90 60 60)"
                    style="transition: stroke-dashoffset 1s ease"
                  />
                </svg>
                <div class="eff-score-number">
                  <span class="big-eff-score">{{ presAnalytics.effectiveness_score.total }}</span>
                  <span class="score-max">/100</span>
                </div>
              </div>
              <!-- Breakdown bars -->
              <div class="eff-breakdown">
                <div class="eff-breakdown-item" v-for="comp in effectivenessComponents" :key="comp.key">
                  <div class="eff-breakdown-header">
                    <span class="eff-breakdown-label">{{ comp.icon }} {{ comp.label }}</span>
                    <span class="eff-breakdown-value">{{ comp.value }}<span class="eff-max">/{{ comp.max }}</span></span>
                  </div>
                  <div class="eff-bar-bg">
                    <div
                      class="eff-bar-fill"
                      :style="{ width: (comp.value / comp.max * 100) + '%', background: comp.color }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
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

      <!-- Row 9: Monthly Email Summary Subscription -->
      <div class="panel email-panel">
        <div class="panel-header">
          <h3>📆 每月汇总邮件</h3>
        </div>
        <div class="email-content">
          <div class="email-toggle-row">
            <div class="email-desc">
              <div class="email-title">订阅每月数据报告</div>
              <div class="email-subtitle">每月1日发送上月使用统计、趋势分析和月环比变化</div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" v-model="monthlySubscribed" @change="toggleMonthlyEmail">
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div v-if="monthlySubscribed" class="email-status success">
            ✅ 已订阅 | 将发送至：{{ monthlyEmail }}
          </div>
          <div v-else class="email-status">
            📬 开启后每月1日自动收到您的月度数据报告
          </div>
          <div v-if="monthlyMessage" class="email-message" :class="{ error: monthlyEmailError }">
            {{ monthlyMessage }}
          </div>
        </div>
      </div>

      <!-- Custom Report Builder Modal -->
      <div v-if="showCustomReport" class="modal-mask" @click.self="showCustomReport = false">
        <div class="embed-modal" style="max-width:600px;">
          <div class="modal-header">
            <h3>🛠️ 自定义报告生成器</h3>
            <button class="close-btn" @click="showCustomReport = false">✕</button>
          </div>
          <div class="modal-body">
            <p class="report-desc">选择要包含在报告中的指标，生成定制化数据分析报告。</p>
            <div class="metrics-grid">
              <label v-for="m in availableMetrics" :key="m.key" class="metric-check-item">
                <input type="checkbox" v-model="selectedMetrics" :value="m.key">
                <span class="metric-check-label">{{ m.icon }} {{ m.label }}</span>
              </label>
            </div>
            <div class="report-format-row">
              <span class="format-label">导出格式：</span>
              <label class="format-radio">
                <input type="radio" v-model="reportFormat" value="json"> JSON
              </label>
              <label class="format-radio">
                <input type="radio" v-model="reportFormat" value="csv"> CSV
              </label>
            </div>
            <div v-if="customReportData" class="report-preview">
              <h4>📋 报告预览</h4>
              <pre class="report-pre">{{ JSON.stringify(customReportData, null, 2).slice(0, 2000) }}</pre>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" @click="showCustomReport = false">关闭</button>
            <button class="btn btn-outline" @click="buildCustomReport">🔍 生成预览</button>
            <button class="btn btn-primary" @click="downloadCustomReport">📥 下载报告</button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAnalytics } from '../composables/useAnalytics'
import { usePresentationAnalytics } from '../composables/usePresentationAnalytics'

const { analyticsData, loading, error, fetchAnalytics, exportCSV, formatTime, productivityLabel, chartColors } = useAnalytics()
const { analytics: presAnalytics, loading: presLoading, error: presError, loadAnalytics, exportPDF } = usePresentationAnalytics()

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

// Presentation Analytics
const presTaskId = ref('')

// Recent tasks from generation analytics (for quick selection)
const recentTasks = computed(() => {
  // Use task history from analyticsData if available
  const history = analyticsData.value?.history ?? []
  return history.slice(0, 5).map((t: any) => ({ task_id: t.task_id || t.id || '' }))
})

const loadPresAnalytics = async () => {
  if (!presTaskId.value.trim()) return
  await loadAnalytics(presTaskId.value.trim())
}

const selectPresTask = (taskId: string) => {
  presTaskId.value = taskId
  loadPresAnalytics()
}

const exportPresPDF = async () => {
  if (!presTaskId.value.trim()) return
  try {
    await exportPDF(presTaskId.value.trim())
  } catch (e: any) {
    alert('导出失败: ' + (e.message || '未知错误'))
  }
}

const formatDuration = (seconds: number) => {
  if (!seconds || seconds <= 0) return '0秒'
  if (seconds < 60) return Math.round(seconds) + '秒'
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return s > 0 ? `${m}分${s}秒` : `${m}分钟`
}

const formatDate = (isoStr: string) => {
  if (!isoStr) return '-'
  try {
    const d = new Date(isoStr)
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
  } catch {
    return '-'
  }
}

// Slide time chart helpers
const slideChartW = 500
const slideChartH = 160
const slidePad = { top: 10, right: 20, bottom: 30, left: 40 }

const slideMaxTime = computed(() => {
  const stats = presAnalytics.value?.slide_stats ?? []
  return Math.max(...stats.map((s: any) => s.avg_time_seconds), 10)
})

const slideYTicks = computed(() => {
  const m = slideMaxTime.value
  if (m <= 10) return [0, 5, 10]
  const step = Math.ceil(m / 4)
  return [0, step, step * 2, step * 3, m]
})

const slideBarW = computed(() => {
  const stats = presAnalytics.value?.slide_stats ?? []
  if (stats.length === 0) return 20
  const available = slideChartW - slidePad.left - slidePad.right
  return Math.max(8, Math.min(40, available / stats.length - 4))
})

const slideBarX = (i: number) => slidePad.left + i * (slideBarW.value + 4)

const slideBarY = (value: number) => {
  const innerH = slideChartH - slidePad.top - slidePad.bottom
  return slidePad.top + innerH - (value / slideMaxTime.value) * innerH
}

const slideBarH = (value: number) => {
  const innerH = slideChartH - slidePad.top - slidePad.bottom
  return (value / slideMaxTime.value) * innerH
}

// Heatmap helpers
const heatmapCells = computed(() => {
  const grid = presAnalytics.value?.heatmap_grid_size ?? 8
  const data = presAnalytics.value?.overview_heatmap ?? {}
  const cells = []
  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < grid; x++) {
      const key = `${x},${y}`
      cells.push({ key, weight: data[key] ?? 0 })
    }
  }
  return cells
})

const heatmapColor = (weight: number) => {
  if (weight <= 0) return '#f5f5f5'
  if (weight < 0.2) return '#d9f0ff'
  if (weight < 0.4) return '#91d5ff'
  if (weight < 0.6) return '#40a9ff'
  if (weight < 0.8) return '#1890ff'
  return '#003eb3'
}

const scrollCompletePercent = computed(() => {
  const samples = presAnalytics.value?.scroll_depth_samples ?? 0
  const complete = presAnalytics.value?.scroll_depth_reached_end_count ?? 0
  if (samples === 0) return 0
  return Math.round((complete / samples) * 100)
})

// Effectiveness score computed
const effCircumference = 2 * Math.PI * 52

const effScoreOffset = computed(() => {
  const score = presAnalytics.value?.effectiveness_score?.total ?? 0
  return effCircumference - (effCircumference * score / 100)
})

const effectivenessLabel = computed(() => {
  const score = presAnalytics.value?.effectiveness_score?.total ?? 0
  if (score >= 80) return { label: '卓越', color: '#00B42A' }
  if (score >= 60) return { label: '优秀', color: '#165DFF' }
  if (score >= 40) return { label: '良好', color: '#FF7D00' }
  if (score >= 20) return { label: '一般', color: '#F53FAD' }
  return { label: '待提升', color: '#8c8c8c' }
})

const effectivenessComponents = computed(() => {
  const es = presAnalytics.value?.effectiveness_score
  if (!es) return []
  return [
    { key: 'reach', icon: '👥', label: '触达力', value: es.reach_score, max: 20, color: '#165DFF' },
    { key: 'depth', icon: '📜', label: '阅读深度', value: es.depth_score, max: 25, color: '#00B42A' },
    { key: 'engagement', icon: '⚡', label: '互动度', value: es.engagement_score, max: 20, color: '#FF7D00' },
    { key: 'hotspot', icon: '🔥', label: '热点覆盖', value: es.hotspot_score, max: 15, color: '#F53FAD' },
    { key: 'completion', icon: '✅', label: '完成率', value: es.completion_score, max: 20, color: '#722ED1' },
  ]
})

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

// Monthly email subscription
const monthlySubscribed = ref(false)
const monthlyEmail = ref('')
const monthlyMessage = ref('')
const monthlyEmailError = ref(false)

const toggleMonthlyEmail = async () => {
  monthlyEmailError.value = false
  monthlyMessage.value = ''
  try {
    const resp = await fetch('/api/v1/analytics/monthly-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscribed: monthlySubscribed.value, email: monthlyEmail.value })
    })
    const data = await resp.json()
    monthlyMessage.value = data.message || (monthlySubscribed.value ? '已订阅每月汇总邮件' : '已取消订阅')
    if (!resp.ok) monthlyEmailError.value = true
  } catch (e: any) {
    monthlyMessage.value = '设置失败: ' + (e.message || '网络错误')
    monthlyEmailError.value = true
    monthlySubscribed.value = !monthlySubscribed.value
  }
}

const loadMonthlyEmailStatus = async () => {
  try {
    const resp = await fetch('/api/v1/analytics/monthly-email')
    if (resp.ok) {
      const data = await resp.json()
      monthlySubscribed.value = data.subscribed
      monthlyEmail.value = data.email || ''
    }
  } catch (e) {
    // Silently fail
  }
}

// Google Data Studio export
const exportDataStudio = () => {
  window.open('/api/v1/analytics/export/datastudio', '_blank')
}

// Custom report builder
const showCustomReport = ref(false)
const reportFormat = ref('json')
const customReportData = ref<Record<string, any> | null>(null)

const availableMetrics = [
  { key: 'summary', label: '总体概览', icon: '📊' },
  { key: 'popular_templates', label: '热门模板', icon: '📐' },
  { key: 'popular_styles', label: '热门风格', icon: '🎨' },
  { key: 'popular_scenes', label: '热门场景', icon: '🏷' },
  { key: 'daily_stats', label: '每日统计', icon: '📅' },
  { key: 'weekly_activity', label: '周活跃度', icon: '🔥' },
  { key: 'productivity_score', label: '生产力分数', icon: '⚡' },
  { key: 'carbon_footprint', label: '碳排放节省', icon: '🌱' },
  { key: 'most_used_features', label: '功能使用排行', icon: '✨' },
  { key: 'realtime', label: '实时统计', icon: '⏱' },
  { key: 'cohort', label: '用户留存', icon: '👥' },
]

const selectedMetrics = ref([
  'summary', 'popular_templates', 'popular_styles',
  'popular_scenes', 'daily_stats', 'productivity_score'
])

const openCustomReportBuilder = () => {
  showCustomReport.value = true
  customReportData.value = null
}

const buildCustomReport = async () => {
  try {
    const resp = await fetch('/api/v1/analytics/report/custom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metrics: selectedMetrics.value, format: reportFormat.value })
    })
    if (resp.ok) {
      customReportData.value = await resp.json()
    }
  } catch (e) {
    console.warn('Custom report build failed:', e)
  }
}

const downloadCustomReport = async () => {
  try {
    const resp = await fetch('/api/v1/analytics/report/custom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metrics: selectedMetrics.value, format: reportFormat.value })
    })
    if (resp.ok) {
      const data = await resp.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `rabai_custom_report_${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
  } catch (e) {
    console.warn('Download failed:', e)
  }
}

onMounted(() => {
  fetchAnalytics()
  loadWeeklyEmailStatus()
  loadMonthlyEmailStatus()
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

/* Effectiveness Score Panel */
.effectiveness-content {
  display: flex;
  align-items: center;
  gap: 32px;
}

.eff-score-ring-wrapper {
  position: relative;
  width: 120px;
  height: 120px;
  flex-shrink: 0;
}

.eff-score-number {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.big-eff-score {
  font-size: 32px;
  font-weight: 700;
  color: #1f1f1f;
  line-height: 1;
}

.eff-breakdown {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.eff-breakdown-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.eff-breakdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.eff-breakdown-label {
  font-size: 13px;
  color: #595959;
}

.eff-breakdown-value {
  font-size: 13px;
  font-weight: 600;
  color: #1f1f1f;
}

.eff-max {
  font-size: 11px;
  color: #bfbfbf;
  font-weight: 400;
}

.eff-bar-bg {
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.eff-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.8s ease;
}

/* Presentation loading / empty */
.pres-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  color: #8c8c8c;
  font-size: 14px;
}

.pres-error {
  background: #fff2f0;
  border: 1px solid #ffccc7;
  color: #ff4d4f;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
}

.pres-empty {
  text-align: center;
  padding: 40px 20px;
  color: #8c8c8c;
}

.pres-empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.pres-empty p {
  font-size: 14px;
  margin: 0 0 16px;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.recent-tasks {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
}

.recent-label {
  font-size: 13px;
  color: #8c8c8c;
}

.recent-task-btn {
  background: #f5f7fa;
  border: 1px solid #e8e8e8;
  border-radius: 16px;
  padding: 4px 12px;
  font-size: 12px;
  color: #595959;
  cursor: pointer;
  transition: all 0.2s;
}

.recent-task-btn:hover {
  border-color: #165DFF;
  color: #165DFF;
  background: #f0f7ff;
}

/* Slide bar chart hover */
.slide-bar {
  transition: opacity 0.2s;
}

.slide-bar:hover {
  opacity: 0.8;
}

/* Heatmap label */
.heatmap-label {
  font-size: 12px;
  color: #8c8c8c;
}

/* Presentation analytics section header */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f1f1f;
  margin: 0;
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.task-id-input {
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  font-size: 13px;
  width: 200px;
  outline: none;
  transition: border-color 0.2s;
}

.task-id-input:focus {
  border-color: #165DFF;
}

/* Viewer list */
.viewer-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 240px;
  overflow-y: auto;
}

.viewer-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  background: #fafafa;
  transition: background 0.2s;
}

.viewer-item:hover {
  background: #f0f7ff;
}

.viewer-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #165DFF 0%, #722ED1 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  flex-shrink: 0;
}

.viewer-info {
  flex: 1;
}

.viewer-name {
  font-size: 14px;
  font-weight: 500;
  color: #1f1f1f;
}

.viewer-meta {
  font-size: 12px;
  color: #8c8c8c;
  margin-top: 2px;
}

.viewer-time {
  font-size: 12px;
  color: #8c8c8c;
  flex-shrink: 0;
}

/* Scroll info */
.scroll-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.scroll-stat-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.scroll-stat-label {
  font-size: 13px;
  color: #595959;
  width: 100px;
  flex-shrink: 0;
}

.scroll-bar-bg {
  flex: 1;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.scroll-bar-fill {
  height: 100%;
  background: #165DFF;
  border-radius: 4px;
  transition: width 0.8s ease;
}

.scroll-bar-fill.complete {
  background: linear-gradient(90deg, #00B42A, #52c41a);
}

.scroll-stat-value {
  font-size: 13px;
  font-weight: 600;
  color: #1f1f1f;
  width: 60px;
  text-align: right;
  flex-shrink: 0;
}

/* Heatmap grid */
.heatmap-grid {
  display: grid;
  grid-template-columns: repeat(var(--grid-size), 1fr);
  gap: 2px;
  max-width: 400px;
}

.heatmap-cell {
  aspect-ratio: 1;
  border-radius: 4px;
  cursor: default;
  transition: transform 0.15s;
}

.heatmap-cell:hover {
  transform: scale(1.15);
  z-index: 1;
}

/* Slide time chart */
.slide-time-chart {
  overflow-x: auto;
}

.slide-bar-chart {
  width: 100%;
  min-width: 300px;
  height: 160px;
}

.loading-spinner.small {
  width: 24px;
  height: 24px;
  border-width: 2px;
}

/* Presentation stats grid */
.pres-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

@media (max-width: 768px) {
  .pres-stats-grid { grid-template-columns: repeat(2, 1fr); }
  .effectiveness-content { flex-direction: column; }
  .eff-score-ring-wrapper { align-self: center; }
  .task-id-input { width: 140px; }
}

/* Custom Report Builder Modal */
.modal-mask {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.embed-modal {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e8e8e8;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #8c8c8c;
  padding: 4px 8px;
}

.close-btn:hover { color: #1f1f1f; }

.modal-body {
  padding: 20px 24px;
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 16px 24px;
  border-top: 1px solid #e8e8e8;
}

.report-desc {
  color: #666;
  font-size: 14px;
  margin-bottom: 16px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 10px;
  margin-bottom: 16px;
}

.metric-check-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #f5f7fa;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.15s;
}

.metric-check-item:hover { background: #e8f0fe; }

.metric-check-item input { cursor: pointer; }

.metric-check-label { flex: 1; }

.report-format-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.format-label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.format-radio {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  cursor: pointer;
}

.report-preview {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 16px;
}

.report-preview h4 {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 600;
}

.report-pre {
  background: #1f1f1f;
  color: #a5d6a7;
  padding: 12px;
  border-radius: 6px;
  font-size: 11px;
  overflow-x: auto;
  max-height: 300px;
  margin: 0;
}
</style>
