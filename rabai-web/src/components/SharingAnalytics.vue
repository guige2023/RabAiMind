<template>
  <div class="analytics-panel" :class="{ 'dark': isDark }">
    <!-- Header -->
    <div class="panel-header">
      <div class="header-title">
        <span class="title-icon">📊</span>
        <span>分享数据</span>
      </div>
      <button class="refresh-btn" @click="loadAll" :disabled="loading">🔄</button>
    </div>

    <!-- Tab Navigation -->
    <div class="tab-nav">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab-btn"
        :class="{ active: activeTab === tab.id }"
        @click="switchTab(tab.id)"
      >
        {{ tab.icon }} {{ tab.label }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
    </div>

    <!-- ==================== Tab: Overview ==================== -->
    <div v-else-if="activeTab === 'overview'" class="tab-content">
      <!-- Summary Stats -->
      <div class="summary-grid">
        <div class="stat-card">
          <div class="stat-value">{{ summary.total_shares || 0 }}</div>
          <div class="stat-label">总分享数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ summary.active_shares || 0 }}</div>
          <div class="stat-label">活跃链接</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ summary.total_accesses || 0 }}</div>
          <div class="stat-label">总访问量</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ summary.unique_viewers || 0 }}</div>
          <div class="stat-label">独立访客</div>
        </div>
      </div>

      <!-- Effectiveness Score -->
      <div v-if="presAnalytics?.effectiveness_score" class="effectiveness-card">
        <div class="section-label">🎯 演示效果评分</div>
        <div class="eff-score-display">
          <div class="eff-total" :style="{ color: effColor(presAnalytics.effectiveness_score.total) }">
            {{ presAnalytics.effectiveness_score.total }}
          </div>
          <div class="eff-max">/ 100</div>
          <div class="eff-label">{{ effLabel(presAnalytics.effectiveness_score.total) }}</div>
        </div>
        <div class="eff-breakdown">
          <div class="eff-item">
            <span class="eff-dot" style="background:#165DFF"></span>
            <span>触达力</span>
            <span class="eff-score">{{ presAnalytics.effectiveness_score.reach_score }}/20</span>
          </div>
          <div class="eff-item">
            <span class="eff-dot" style="background:#00C850"></span>
            <span>阅读深度</span>
            <span class="eff-score">{{ presAnalytics.effectiveness_score.depth_score }}/25</span>
          </div>
          <div class="eff-item">
            <span class="eff-dot" style="background:#FF9500"></span>
            <span>互动度</span>
            <span class="eff-score">{{ presAnalytics.effectiveness_score.engagement_score }}/20</span>
          </div>
          <div class="eff-item">
            <span class="eff-dot" style="background:#F53FAD"></span>
            <span>热点覆盖</span>
            <span class="eff-score">{{ presAnalytics.effectiveness_score.hotspot_score }}/15</span>
          </div>
          <div class="eff-item">
            <span class="eff-dot" style="background:#8E8E93"></span>
            <span>完成率</span>
            <span class="eff-score">{{ presAnalytics.effectiveness_score.completion_score }}/20</span>
          </div>
        </div>
      </div>

      <!-- Share List -->
      <div class="share-list">
        <div class="section-label">📢 分享链接详情</div>
        <div v-if="shareAnalytics.length === 0" class="empty-state-sm">
          <span>暂无分享链接</span>
        </div>
        <div
          v-else
          v-for="item in shareAnalytics"
          :key="item.share_id"
          class="share-item"
          :class="{ expanded: expandedShareId === item.share_id }"
        >
          <div class="share-header" @click="toggleExpand(item.share_id)">
            <div class="share-info">
              <div class="share-resource">
                <span class="resource-icon">{{ item.resource_type === 'ppt' ? '📊' : '📁' }}</span>
                <span class="resource-id">{{ item.resource_id.substring(0, 12) }}...</span>
              </div>
              <div class="share-stats">
                <span class="stat-pill">👁️ {{ item.total_accesses }}</span>
                <span class="stat-pill">👤 {{ item.unique_viewers }}</span>
              </div>
            </div>
            <div class="expand-arrow">{{ expandedShareId === item.share_id ? '▲' : '▼' }}</div>
          </div>

          <!-- Expanded Details -->
          <div v-if="expandedShareId === item.share_id" class="share-details">
            <div v-if="item.by_device && Object.keys(item.by_device).length > 0" class="detail-section">
              <div class="detail-label">📱 设备分布</div>
              <div class="breakdown-bar">
                <div
                  v-for="(count, device) in item.by_device"
                  :key="device"
                  class="bar-segment"
                  :style="{ width: `${(count / item.total_accesses) * 100}%`, background: deviceColor(device) }"
                ></div>
              </div>
              <div class="breakdown-legend">
                <div v-for="(count, device) in item.by_device" :key="device" class="legend-item">
                  <span class="legend-dot" :style="{ background: deviceColor(device) }"></span>
                  {{ deviceLabel(device) }}: {{ count }}
                </div>
              </div>
            </div>
            <div v-if="item.by_via && Object.keys(item.by_via).length > 0" class="detail-section">
              <div class="detail-label">🔗 访问来源</div>
              <div class="via-list">
                <div v-for="(count, via) in item.by_via" :key="via" class="via-item">
                  <span class="via-icon">{{ viaIcon(via) }}</span>
                  <span class="via-label">{{ viaLabel(via) }}</span>
                  <span class="via-count">{{ count }}</span>
                </div>
              </div>
            </div>
            <div v-if="recentAccesses[item.share_id]?.length > 0" class="detail-section">
              <div class="detail-label">🕐 最近访问</div>
              <div class="recent-list">
                <div v-for="(access, idx) in recentAccesses[item.share_id].slice(0, 5)" :key="idx" class="access-entry">
                  <div class="access-left">
                    <span>{{ deviceIcon(access.device_type) }}</span>
                    <div>
                      <div class="access-viewer">{{ access.viewer_name || access.viewer_email || '匿名' }}</div>
                      <div class="access-meta">
                        <span>{{ viaLabel(access.accessed_via) }}</span>
                        <span v-if="access.country"> · {{ access.country }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="access-time">{{ formatTime(access.access_time) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== Tab: Realtime ==================== -->
    <div v-else-if="activeTab === 'realtime'" class="tab-content">
      <!-- Live viewer count -->
      <div class="live-hero">
        <div class="live-indicator">
          <span class="live-dot"></span>
          <span>实时在线</span>
        </div>
        <div class="live-count">{{ liveStats.active_viewers_now || 0 }}</div>
        <div class="live-label">位观众正在浏览</div>
      </div>

      <!-- Live sessions list -->
      <div v-if="liveStats.active_sessions?.length > 0" class="live-sessions">
        <div class="section-label">🟢 活跃会话</div>
        <div v-for="session in liveStats.active_sessions" :key="session.session_id" class="live-session-item">
          <div class="live-avatar" :style="{ background: avatarColor(session.viewer_name) }">
            {{ (session.viewer_name || '?').charAt(0).toUpperCase() }}
          </div>
          <div class="live-session-info">
            <div class="live-session-name">{{ session.viewer_name || '匿名观众' }}</div>
            <div class="live-session-meta">
              第 {{ session.current_slide + 1 }} 页 · {{ session.elapsed_seconds }}秒
            </div>
          </div>
          <div class="live-elapsed">🕐 {{ session.elapsed_seconds }}s</div>
        </div>
      </div>
      <div v-else class="empty-state-sm">
        <span class="empty-icon-sm">🟢</span>
        <p>当前无活跃观众</p>
      </div>

      <!-- Engagement metrics -->
      <div class="engagement-grid">
        <div class="eng-card">
          <div class="eng-value">{{ liveStats.total_sessions || 0 }}</div>
          <div class="eng-label">总会话数</div>
        </div>
        <div class="eng-card">
          <div class="eng-value">{{ liveStats.completed_sessions || 0 }}</div>
          <div class="eng-label">已完成</div>
        </div>
        <div class="eng-card">
          <div class="eng-value">{{ liveStats.avg_duration_seconds || 0 }}s</div>
          <div class="eng-label">平均时长</div>
        </div>
        <div class="eng-card">
          <div class="eng-value">{{ liveStats.completion_rate_pct || 0 }}%</div>
          <div class="eng-label">完成率</div>
        </div>
      </div>
    </div>

    <!-- ==================== Tab: Geo ==================== -->
    <div v-else-if="activeTab === 'geo'" class="tab-content">
      <div class="geo-header">
        <div class="section-label">🌍 地理分布</div>
        <div class="geo-total">{{ geoData.total_locations || 0 }} 个国家/地区</div>
      </div>

      <!-- Country bars -->
      <div v-if="Object.keys(geoData.countries || {}).length > 0" class="geo-list">
        <div
          v-for="(count, country) in geoData.countries"
          :key="country"
          class="geo-item"
        >
          <div class="geo-country">
            <span class="geo-flag">{{ countryFlag(country) }}</span>
            <span class="geo-name">{{ country }}</span>
          </div>
          <div class="geo-bar-wrapper">
            <div
              class="geo-bar"
              :style="{ width: `${(count / maxGeoCount) * 100}%` }"
            ></div>
          </div>
          <div class="geo-count">{{ count }}</div>
        </div>
      </div>
      <div v-else class="empty-state-sm">
        <span class="empty-icon-sm">🌍</span>
        <p>暂无地理数据</p>
        <p class="empty-hint-sm">访客地理信息将自动收集</p>
      </div>

      <!-- Top cities -->
      <div v-if="Object.keys(geoData.cities || {}).length > 0" class="cities-section">
        <div class="section-label">🏙️ 热门城市</div>
        <div class="city-list">
          <div v-for="(count, city) in Object.entries(geoData.cities || {}).slice(0, 10)" :key="city[0]" class="city-item">
            <span class="city-name">{{ city[0] }}</span>
            <span class="city-count">{{ city[1] }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== Tab: Devices ==================== -->
    <div v-else-if="activeTab === 'devices'" class="tab-content">
      <!-- Browser breakdown -->
      <div class="section-label">🔍 浏览器分布</div>
      <div v-if="Object.keys(breakdown.browsers || {}).length > 0" class="browser-list">
        <div
          v-for="(count, browser) in breakdown.browsers"
          :key="browser"
          class="browser-item"
        >
          <div class="browser-info">
            <span class="browser-icon">{{ browserIcon(browser) }}</span>
            <span class="browser-name">{{ browser }}</span>
          </div>
          <div class="browser-bar-wrapper">
            <div
              class="browser-bar"
              :style="{ width: `${(count / breakdown.total_sessions) * 100}%`, background: browserColor(browser) }"
            ></div>
          </div>
          <div class="browser-count">{{ count }}</div>
          <div class="browser-pct">{{ Math.round((count / breakdown.total_sessions) * 100) }}%</div>
        </div>
      </div>
      <div v-else class="empty-state-sm">
        <span class="empty-icon-sm">🔍</span>
        <p>暂无浏览器数据</p>
      </div>

      <!-- Device breakdown -->
      <div class="section-label" style="margin-top:16px">📱 设备分布</div>
      <div v-if="Object.keys(breakdown.devices || {}).length > 0" class="device-pie">
        <div
          v-for="(count, device) in breakdown.devices"
          :key="device"
          class="device-slice"
        >
          <div class="device-label">
            <span class="device-dot" :style="{ background: deviceColor(device) }"></span>
            {{ deviceLabel(device) }}
          </div>
          <div class="device-count">{{ count }}</div>
          <div class="device-pct-label">{{ Math.round((count / breakdown.total_sessions) * 100) }}%</div>
        </div>
      </div>
      <div v-else class="empty-state-sm">
        <span class="empty-icon-sm">📱</span>
        <p>暂无设备数据</p>
      </div>
    </div>

    <!-- ==================== Tab: Slides ==================== -->
    <div v-else-if="activeTab === 'slides'" class="tab-content">
      <div class="section-label">⏱️ 每页平均时长热力图</div>

      <!-- Slide time heatmap -->
      <div v-if="slideHeatmap.slides?.length > 0" class="slide-heatmap">
        <div
          v-for="slide in slideHeatmap.slides"
          :key="slide.slide_index"
          class="heatmap-cell"
          :style="{
            background: heatmapColor(slide.intensity),
          }"
          :title="`第${slide.slide_index + 1}页: ${slide.avg_time_seconds}s (${slide.view_count}次浏览)`"
        >
          <div class="heatmap-slide-num">{{ slide.slide_index + 1 }}</div>
          <div class="heatmap-time">{{ slide.avg_time_seconds }}s</div>
        </div>
      </div>

      <!-- Slide stats table -->
      <div v-if="presAnalytics?.slide_stats?.length > 0" class="slide-stats-table">
        <div class="section-label" style="margin-top:12px">📊 幻灯片详情</div>
        <div class="slide-row header-row">
          <span>页码</span>
          <span>浏览</span>
          <span>平均时长</span>
          <span>总时长</span>
        </div>
        <div
          v-for="slide in presAnalytics.slide_stats"
          :key="slide.slide_index"
          class="slide-row"
        >
          <span class="slide-num">第{{ slide.slide_index + 1 }}页</span>
          <span class="slide-views">{{ slide.view_count }}</span>
          <span class="slide-avg">{{ slide.avg_time_seconds }}s</span>
          <span class="slide-total">{{ slide.total_time_seconds }}s</span>
        </div>
      </div>

      <div v-else class="empty-state-sm">
        <span class="empty-icon-sm">⏱️</span>
        <p>暂无幻灯片数据</p>
        <p class="empty-hint-sm">观众浏览时自动收集</p>
      </div>

      <!-- Scroll depth -->
      <div v-if="presAnalytics?.avg_scroll_depth_percent" class="scroll-depth-section">
        <div class="section-label" style="margin-top:12px">📜 滚动深度</div>
        <div class="scroll-bar-wrapper">
          <div class="scroll-bar-fill" :style="{ width: `${presAnalytics.avg_scroll_depth_percent}%` }"></div>
        </div>
        <div class="scroll-label">平均深度: {{ presAnalytics.avg_scroll_depth_percent }}%</div>
        <div class="scroll-sub">完整阅读: {{ presAnalytics.scroll_depth_reached_end_count || 0 }} 人</div>
      </div>
    </div>

    <!-- ==================== Tab: Conversions ==================== -->
    <div v-else-if="activeTab === 'conversions'" class="tab-content">
      <!-- CTA stats summary -->
      <div class="cta-summary">
        <div class="cta-stat-card">
          <div class="cta-stat-value">{{ ctaStats.total_clicks || 0 }}</div>
          <div class="cta-stat-label">总点击数</div>
        </div>
        <div class="cta-stat-card">
          <div class="cta-stat-value">{{ ctaStats.unique_clickers || 0 }}</div>
          <div class="cta-stat-label">独立点击者</div>
        </div>
      </div>

      <!-- CTA breakdown -->
      <div class="section-label">🎯 CTA 按钮点击分布</div>
      <div v-if="Object.keys(ctaStats.by_cta_label || {}).length > 0" class="cta-list">
        <div
          v-for="(count, label) in ctaStats.by_cta_label"
          :key="label"
          class="cta-item"
        >
          <div class="cta-label">{{ label }}</div>
          <div class="cta-bar-wrapper">
            <div
              class="cta-bar-fill"
              :style="{ width: `${(count / ctaStats.total_clicks) * 100}%` }"
            ></div>
          </div>
          <div class="cta-count">{{ count }}</div>
        </div>
      </div>
      <div v-else class="empty-state-sm">
        <span class="empty-icon-sm">🎯</span>
        <p>暂无 CTA 点击数据</p>
        <p class="empty-hint-sm">观众点击 CTA 按钮时自动收集</p>
      </div>

      <!-- Recent CTA clicks -->
      <div v-if="ctaStats.recent_clicks?.length > 0" class="recent-cta">
        <div class="section-label" style="margin-top:12px">🕐 最近点击</div>
        <div
          v-for="click in ctaStats.recent_clicks.slice(0, 10)"
          :key="click.id"
          class="cta-click-entry"
        >
          <div class="cta-click-left">
            <span class="cta-click-label">🎯 {{ click.cta_label }}</span>
            <span class="cta-click-viewer">{{ click.viewer_id?.substring(0, 8) || '匿名' }}</span>
          </div>
          <div class="cta-click-time">{{ formatTime(click.clicked_at) }}</div>
        </div>
      </div>
    </div>

    <!-- Empty overlay -->
    <div v-if="!loading && summary.total_shares === 0 && activeTab === 'overview'" class="empty-overlay">
      <span class="empty-icon">📢</span>
      <p>分享这个PPT给朋友，追踪谁看过你的作品</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import apiClient from '../api/client'

const props = defineProps<{ taskId?: string }>()

const isDark = ref(false)
const loading = ref(false)
const summary = ref<any>({})
const shareAnalytics = ref<any[]>([])
const expandedShareId = ref('')
const viewers = ref<Record<string, any[]>>({})
const recentAccesses = ref<Record<string, any[]>>({})
const activeTab = ref('overview')

// R134 Analytics
const presAnalytics = ref<any>(null)
const liveStats = ref<any>({})
const geoData = ref<any>({})
const breakdown = ref<any>({})
const slideHeatmap = ref<any>({})
const ctaStats = ref<any>({})

let liveInterval: ReturnType<typeof setInterval> | null = null

const tabs = [
  { id: 'overview', label: '概览', icon: '📊' },
  { id: 'realtime', label: '实时', icon: '🟢' },
  { id: 'geo', label: '地理', icon: '🌍' },
  { id: 'devices', label: '设备', icon: '📱' },
  { id: 'slides', label: '幻灯片', icon: '⏱️' },
  { id: 'conversions', label: '转化', icon: '🎯' },
]

const AVATAR_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F']

const deviceColor = (device: string): string => {
  const map: Record<string, string> = { desktop: '#165DFF', mobile: '#00C850', tablet: '#FF9500' }
  return map[device] || '#8E8E93'
}
const deviceLabel = (device: string): string => {
  const map: Record<string, string> = { desktop: '桌面', mobile: '手机', tablet: '平板' }
  return map[device] || device
}
const deviceIcon = (device: string): string => {
  const map: Record<string, string> = { desktop: '🖥️', mobile: '📱', tablet: '📲' }
  return map[device] || '💻'
}
const viaIcon = (via: string): string => {
  const map: Record<string, string> = { direct_link: '🔗', email: '📧', social: '🌐', qr_code: '📱', wechat: '💬' }
  return map[via] || '🔗'
}
const viaLabel = (via: string): string => {
  const map: Record<string, string> = { direct_link: '直接链接', email: '邮件', social: '社交媒体', qr_code: '二维码', wechat: '微信' }
  return map[via] || via
}
const avatarColor = (email: string): string => {
  let hash = 0
  for (let i = 0; i < (email?.length || 1); i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

const maxGeoCount = computed(() => {
  const countries = geoData.value?.countries || {}
  return Math.max(...Object.values(countries), 1)
})

const countryFlag = (country: string): string => {
  const flags: Record<string, string> = {
    'China': '🇨🇳', 'United States': '🇺🇸', 'United Kingdom': '🇬🇧', 'Japan': '🇯🇵',
    'Germany': '🇩🇪', 'France': '🇫🇷', 'South Korea': '🇰🇷', 'Canada': '🇨🇦',
    'Australia': '🇦🇺', 'India': '🇮🇳', 'Singapore': '🇸🇬', 'Hong Kong': '🇭🇰',
    'Taiwan': '🇹🇼', 'Netherlands': '🇳🇱', 'Brazil': '🇧🇷', 'Russia': '🇷🇺',
    'Unknown': '🌍',
  }
  return flags[country] || '🌍'
}

const browserIcon = (browser: string): string => {
  const map: Record<string, string> = { Chrome: '🔵', Safari: '🟠', Firefox: '🦊', Edge: '🟢', Opera: '🔴', IE: '📜', Other: '⚪' }
  return map[browser] || '⚪'
}
const browserColor = (browser: string): string => {
  const map: Record<string, string> = { Chrome: '#165DFF', Safari: '#FF9500', Firefox: '#FF6B3D', Edge: '#00C850', Opera: '#F53FAD', IE: '#8E8E93', Other: '#8E8E93' }
  return map[browser] || '#8E8E93'
}

const heatmapColor = (intensity: number): string => {
  // intensity 0-1: gray to blue
  if (intensity === 0) return '#f0f0f0'
  const r = Math.round(22 + (0 - 22) * intensity)
  const g = Math.round(93 + (149 - 93) * intensity)
  const b = Math.round(255 + (237 - 255) * intensity)
  return `rgb(${r}, ${g}, ${b})`
}

const effColor = (score: number): string => {
  if (score >= 80) return '#00B42A'
  if (score >= 60) return '#165DFF'
  if (score >= 40) return '#FF7D00'
  if (score >= 20) return '#F53FAD'
  return '#8E8E93'
}
const effLabel = (score: number): string => {
  if (score >= 80) return '卓越'
  if (score >= 60) return '优秀'
  if (score >= 40) return '良好'
  if (score >= 20) return '一般'
  return '待提升'
}

const formatTime = (iso: string): string => {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  } catch { return '' }
}

const switchTab = async (tabId: string) => {
  activeTab.value = tabId
  if (tabId === 'realtime' && props.taskId) {
    await loadLiveStats()
    startLivePolling()
  } else {
    stopLivePolling()
  }
  if (tabId === 'geo' && props.taskId && !geoData.value.countries) {
    await loadGeoData()
  }
  if (tabId === 'devices' && props.taskId && !breakdown.value.browsers) {
    await loadBreakdown()
  }
  if (tabId === 'slides' && props.taskId && !slideHeatmap.value.slides) {
    await loadSlideHeatmap()
  }
  if (tabId === 'conversions' && props.taskId && ctaStats.value.total_clicks === undefined) {
    await loadCtaStats()
  }
}

const startLivePolling = () => {
  stopLivePolling()
  liveInterval = setInterval(() => {
    if (props.taskId) loadLiveStats()
  }, 5000)
}
const stopLivePolling = () => {
  if (liveInterval) { clearInterval(liveInterval); liveInterval = null }
}

const loadAll = async () => {
  loading.value = true
  await Promise.all([loadSharingAnalytics(), loadPresAnalytics()])
  loading.value = false
}

const loadSharingAnalytics = async () => {
  try {
    const res = await apiClient.get('/sharing/analytics')
    summary.value = res.data.summary || {}
    shareAnalytics.value = res.data.by_share || []
  } catch { summary.value = {}; shareAnalytics.value = [] }
}

const loadPresAnalytics = async () => {
  if (!props.taskId) return
  try {
    const res = await apiClient.get(`/presentation-analytics/${props.taskId}`)
    presAnalytics.value = res.data
  } catch { presAnalytics.value = null }
}

const loadLiveStats = async () => {
  if (!props.taskId) return
  try {
    const res = await apiClient.get(`/presentation-analytics/live-stats/${props.taskId}`)
    liveStats.value = res.data
  } catch { liveStats.value = {} }
}

const loadGeoData = async () => {
  if (!props.taskId) return
  try {
    const res = await apiClient.get(`/presentation-analytics/${props.taskId}`)
    geoData.value = res.data.geo_distribution || {}
  } catch { geoData.value = {} }
}

const loadBreakdown = async () => {
  if (!props.taskId) return
  try {
    const res = await apiClient.get(`/presentation-analytics/${props.taskId}`)
    breakdown.value = res.data.browser_device_breakdown || {}
  } catch { breakdown.value = {} }
}

const loadSlideHeatmap = async () => {
  if (!props.taskId) return
  try {
    const res = await apiClient.get(`/presentation-analytics/${props.taskId}`)
    // Use slide_stats from full analytics as heatmap
    const slides = res.data.slide_stats || []
    const maxAvg = Math.max(...slides.map((s: any) => s.avg_time_seconds), 1)
    slideHeatmap.value = {
      slides: slides.map((s: any) => ({ ...s, intensity: s.avg_time_seconds / maxAvg })),
      max_avg_time: maxAvg,
    }
  } catch { slideHeatmap.value = {} }
}

const loadCtaStats = async () => {
  if (!props.taskId) return
  try {
    const res = await apiClient.get(`/presentation-analytics/cta-stats/${props.taskId}`)
    ctaStats.value = res.data
  } catch { ctaStats.value = {} }
}

const toggleExpand = async (shareId: string) => {
  if (expandedShareId.value === shareId) { expandedShareId.value = ''; return }
  expandedShareId.value = shareId
  if (!viewers.value[shareId]) {
    try {
      const res = await apiClient.get(`/sharing/analytics/share/${shareId}`)
      viewers.value[shareId] = res.data.viewers || []
      recentAccesses.value[shareId] = res.data.recent_accesses || []
    } catch { viewers.value[shareId] = []; recentAccesses.value[shareId] = [] }
  }
}

onMounted(() => {
  isDark.value = document.documentElement.classList.contains('dark') || false
  loadAll()
})

onUnmounted(() => { stopLivePolling() })
</script>

<style scoped>
.analytics-panel {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  max-width: 520px;
  max-height: 680px;
  display: flex;
  flex-direction: column;
}

.dark, :global(.dark) .analytics-panel { background: #1a1a1a; }

/* Header */
.panel-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px; border-bottom: 1px solid #f0f0f0; flex-shrink: 0;
}
.dark .panel-header { border-color: #333; }
.header-title { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600; color: #333; }
.dark .header-title { color: #eee; }
.refresh-btn { width: 28px; height: 28px; border: none; background: #f0f0f0; border-radius: 8px; cursor: pointer; font-size: 14px; }
.refresh-btn:hover { background: #e0e0e0; }
.refresh-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* Tab Nav */
.tab-nav {
  display: flex; flex-wrap: wrap; gap: 4px; padding: 8px 12px;
  background: #f8f9fa; border-bottom: 1px solid #f0f0f0; flex-shrink: 0;
}
.dark .tab-nav { background: #2a2a2a; border-color: #333; }
.tab-btn {
  flex: 1; min-width: 60px; padding: 5px 6px; border: none; background: transparent;
  border-radius: 8px; cursor: pointer; font-size: 11px; color: #666;
  transition: all 0.15s; white-space: nowrap;
}
.dark .tab-btn { color: #aaa; }
.tab-btn:hover { background: #e8f0ff; color: #165DFF; }
.dark .tab-btn:hover { background: #1a2a4a; color: #5AACFF; }
.tab-btn.active { background: #165DFF; color: white; font-weight: 600; }
.dark .tab-btn.active { background: #5AACFF; color: #1a1a1a; }

/* Tab Content */
.tab-content { flex: 1; overflow-y: auto; padding: 12px; }

/* Summary */
.summary-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px;
  background: #f0f0f0; border-radius: 10px; overflow: hidden; margin-bottom: 12px;
}
.dark .summary-grid { background: #333; }
.stat-card { background: white; text-align: center; padding: 10px 4px; }
.dark .stat-card { background: #1a1a1a; }
.stat-value { font-size: 18px; font-weight: 700; color: #165DFF; }
.dark .stat-value { color: #5AACFF; }
.stat-label { font-size: 10px; color: #888; margin-top: 2px; }

/* Effectiveness Score */
.effectiveness-card { background: #f8f9fa; border-radius: 12px; padding: 12px; margin-bottom: 12px; }
.dark .effectiveness-card { background: #2a2a2a; }
.eff-score-display { display: flex; align-items: baseline; gap: 4px; margin: 8px 0; }
.eff-total { font-size: 36px; font-weight: 800; }
.eff-max { font-size: 16px; color: #aaa; }
.eff-label { font-size: 13px; color: #888; margin-left: 4px; }
.eff-breakdown { display: flex; flex-direction: column; gap: 4px; }
.eff-item { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #666; }
.dark .eff-item { color: #aaa; }
.eff-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.eff-score { margin-left: auto; font-weight: 600; color: #333; }
.dark .eff-score { color: #eee; }

/* Share List */
.share-list { }
.section-label { font-size: 12px; color: #888; margin-bottom: 8px; font-weight: 500; }
.share-item { border: 1px solid #e0e0e0; border-radius: 10px; margin-bottom: 8px; overflow: hidden; }
.dark .share-item { border-color: #333; }
.share-item.expanded { border-color: #165DFF; }
.share-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; cursor: pointer; background: #f8f9fa; }
.dark .share-header { background: #2a2a2a; }
.share-header:hover { background: #f0f3ff; }
.dark .share-header:hover { background: #1a2a4a; }
.share-info { flex: 1; }
.share-resource { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
.resource-icon { font-size: 14px; }
.resource-id { font-size: 11px; color: #666; font-family: monospace; }
.dark .resource-id { color: #aaa; }
.share-stats { display: flex; gap: 6px; }
.stat-pill { font-size: 10px; padding: 2px 8px; background: #e8f0ff; color: #165DFF; border-radius: 10px; }
.dark .stat-pill { background: #1a2a4a; color: #5AACFF; }
.expand-arrow { font-size: 10px; color: #888; }
.share-details { padding: 10px; border-top: 1px solid #e0f0f0; background: white; }
.dark .share-details { border-color: #333; background: #1a1a1a; }
.detail-section { margin-bottom: 10px; }
.detail-section:last-child { margin-bottom: 0; }
.detail-label { font-size: 11px; font-weight: 500; color: #555; margin-bottom: 4px; }
.dark .detail-label { color: #aaa; }

/* Bar breakdown */
.breakdown-bar { display: flex; height: 6px; border-radius: 3px; overflow: hidden; background: #f0f0f0; margin-bottom: 4px; }
.dark .breakdown-bar { background: #333; }
.bar-segment { height: 100%; transition: width 0.3s; min-width: 2px; }
.breakdown-legend { display: flex; flex-wrap: wrap; gap: 6px; }
.legend-item { display: flex; align-items: center; gap: 4px; font-size: 10px; color: #666; }
.dark .legend-item { color: #aaa; }
.legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

/* Via */
.via-list { display: flex; flex-direction: column; gap: 3px; }
.via-item { display: flex; align-items: center; gap: 6px; padding: 5px 8px; background: #f8f9fa; border-radius: 6px; font-size: 11px; }
.dark .via-item { background: #2a2a2a; }
.via-icon { font-size: 12px; }
.via-label { flex: 1; color: #555; }
.dark .via-label { color: #aaa; }
.via-count { font-weight: 600; color: #165DFF; }
.dark .via-count { color: #5AACFF; }

/* Access entries */
.recent-list { display: flex; flex-direction: column; gap: 4px; }
.access-entry { display: flex; align-items: center; justify-content: space-between; padding: 6px 8px; background: #f8f9fa; border-radius: 6px; font-size: 11px; }
.dark .access-entry { background: #2a2a2a; }
.access-left { display: flex; align-items: center; gap: 6px; }
.access-viewer { font-size: 12px; font-weight: 500; color: #333; }
.dark .access-viewer { color: #eee; }
.access-meta { font-size: 10px; color: #888; }
.access-time { color: #aaa; font-size: 10px; flex-shrink: 0; }

/* Realtime */
.live-hero { text-align: center; padding: 20px; background: linear-gradient(135deg, #f0f7ff, #e8f0ff); border-radius: 12px; margin-bottom: 12px; }
.dark .live-hero { background: linear-gradient(135deg, #1a2a4a, #0a1a3a); }
.live-indicator { display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 12px; color: #00C850; margin-bottom: 8px; }
.live-dot { width: 8px; height: 8px; background: #00C850; border-radius: 50%; animation: pulse 1.5s infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
.live-count { font-size: 56px; font-weight: 800; color: #165DFF; line-height: 1; }
.dark .live-count { color: #5AACFF; }
.live-label { font-size: 13px; color: #888; margin-top: 4px; }

/* Live sessions */
.live-sessions { margin-bottom: 12px; }
.live-session-item { display: flex; align-items: center; gap: 8px; padding: 8px; background: #f8f9fa; border-radius: 8px; margin-bottom: 6px; }
.dark .live-session-item { background: #2a2a2a; }
.live-avatar { width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 12px; flex-shrink: 0; }
.live-session-info { flex: 1; min-width: 0; }
.live-session-name { font-size: 12px; font-weight: 500; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dark .live-session-name { color: #eee; }
.live-session-meta { font-size: 10px; color: #888; }
.live-elapsed { font-size: 10px; color: #00C850; flex-shrink: 0; }

/* Engagement grid */
.engagement-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
.eng-card { background: #f8f9fa; border-radius: 10px; padding: 12px; text-align: center; }
.dark .eng-card { background: #2a2a2a; }
.eng-value { font-size: 20px; font-weight: 700; color: #165DFF; }
.dark .eng-value { color: #5AACFF; }
.eng-label { font-size: 11px; color: #888; margin-top: 2px; }

/* Geo */
.geo-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.geo-total { font-size: 11px; color: #888; }
.geo-list { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
.geo-item { display: flex; align-items: center; gap: 8px; }
.geo-country { display: flex; align-items: center; gap: 4px; width: 100px; flex-shrink: 0; }
.geo-flag { font-size: 14px; }
.geo-name { font-size: 11px; color: #555; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dark .geo-name { color: #aaa; }
.geo-bar-wrapper { flex: 1; background: #f0f0f0; border-radius: 3px; height: 8px; overflow: hidden; }
.dark .geo-bar-wrapper { background: #333; }
.geo-bar { height: 100%; background: #165DFF; border-radius: 3px; transition: width 0.3s; min-width: 2px; }
.geo-count { width: 30px; text-align: right; font-size: 11px; font-weight: 600; color: #165DFF; flex-shrink: 0; }
.dark .geo-count { color: #5AACFF; }

/* Cities */
.cities-section { margin-top: 8px; }
.city-list { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
.city-item { display: flex; align-items: center; gap: 4px; padding: 4px 8px; background: #f8f9fa; border-radius: 6px; font-size: 11px; }
.dark .city-item { background: #2a2a2a; }
.city-name { color: #555; }
.dark .city-name { color: #aaa; }
.city-count { font-weight: 600; color: #165DFF; }
.dark .city-count { color: #5AACFF; }

/* Browser breakdown */
.browser-list { display: flex; flex-direction: column; gap: 6px; margin-top: 6px; }
.browser-item { display: flex; align-items: center; gap: 8px; }
.browser-info { display: flex; align-items: center; gap: 4px; width: 70px; flex-shrink: 0; }
.browser-icon { font-size: 12px; }
.browser-name { font-size: 11px; color: #555; }
.dark .browser-name { color: #aaa; }
.browser-bar-wrapper { flex: 1; background: #f0f0f0; border-radius: 3px; height: 8px; overflow: hidden; }
.dark .browser-bar-wrapper { background: #333; }
.browser-bar { height: 100%; border-radius: 3px; transition: width 0.3s; min-width: 2px; }
.browser-count { width: 24px; text-align: right; font-size: 11px; font-weight: 600; color: #333; flex-shrink: 0; }
.dark .browser-count { color: #eee; }
.browser-pct { width: 32px; text-align: right; font-size: 10px; color: #888; flex-shrink: 0; }

/* Device pie */
.device-pie { display: flex; gap: 8px; margin-top: 6px; }
.device-slice { flex: 1; background: #f8f9fa; border-radius: 10px; padding: 10px 8px; text-align: center; }
.dark .device-slice { background: #2a2a2a; }
.device-label { display: flex; align-items: center; justify-content: center; gap: 4px; font-size: 11px; color: #555; margin-bottom: 4px; }
.dark .device-label { color: #aaa; }
.device-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.device-count { font-size: 18px; font-weight: 700; color: #165DFF; }
.dark .device-count { color: #5AACFF; }
.device-pct-label { font-size: 10px; color: #888; }

/* Slide heatmap */
.slide-heatmap { display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; margin: 8px 0; }
.heatmap-cell { border-radius: 6px; padding: 8px 4px; text-align: center; transition: all 0.2s; cursor: default; min-height: 50px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.dark .heatmap-cell { border: 1px solid #333; }
.heatmap-slide-num { font-size: 11px; font-weight: 700; color: rgba(0,0,0,0.5); }
.dark .heatmap-slide-num { color: rgba(255,255,255,0.5); }
.heatmap-time { font-size: 10px; color: rgba(0,0,0,0.5); margin-top: 2px; }
.dark .heatmap-time { color: rgba(255,255,255,0.5); }

/* Slide stats table */
.slide-stats-table { margin-top: 4px; }
.slide-row { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 4px; padding: 5px 8px; font-size: 11px; border-bottom: 1px solid #f0f0f0; }
.dark .slide-row { border-color: #333; }
.slide-row.header-row { font-weight: 600; color: #888; background: #f8f9fa; border-radius: 6px 6px 0 0; }
.dark .slide-row.header-row { background: #2a2a2a; }
.slide-num { color: #555; }
.dark .slide-num { color: #aaa; }
.slide-views { color: #333; text-align: center; font-weight: 600; }
.dark .slide-views { color: #eee; }
.slide-avg { color: #165DFF; text-align: center; }
.dark .slide-avg { color: #5AACFF; }
.slide-total { color: #888; text-align: right; }

/* Scroll depth */
.scroll-depth-section { margin-top: 8px; }
.scroll-bar-wrapper { background: #f0f0f0; border-radius: 4px; height: 8px; overflow: hidden; margin: 6px 0; }
.dark .scroll-bar-wrapper { background: #333; }
.scroll-bar-fill { height: 100%; background: linear-gradient(90deg, #165DFF, #00C850); border-radius: 4px; transition: width 0.3s; }
.scroll-label { font-size: 12px; font-weight: 600; color: #333; }
.dark .scroll-label { color: #eee; }
.scroll-sub { font-size: 11px; color: #888; margin-top: 2px; }

/* CTA */
.cta-summary { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 12px; }
.cta-stat-card { background: linear-gradient(135deg, #fff7e6, #fff0db); border-radius: 12px; padding: 14px; text-align: center; border: 1px solid #ffd59e; }
.dark .cta-stat-card { background: linear-gradient(135deg, #2a2010, #1a1508); border-color: #5a4020; }
.cta-stat-value { font-size: 28px; font-weight: 800; color: #FF7D00; }
.dark .cta-stat-value { color: #FFAA44; }
.cta-stat-label { font-size: 11px; color: #888; margin-top: 2px; }
.cta-list { display: flex; flex-direction: column; gap: 6px; margin-top: 6px; }
.cta-item { display: flex; align-items: center; gap: 8px; }
.cta-label { width: 80px; font-size: 11px; color: #555; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex-shrink: 0; }
.dark .cta-label { color: #aaa; }
.cta-bar-wrapper { flex: 1; background: #f0f0f0; border-radius: 3px; height: 8px; overflow: hidden; }
.dark .cta-bar-wrapper { background: #333; }
.cta-bar-fill { height: 100%; background: #FF7D00; border-radius: 3px; transition: width 0.3s; }
.cta-count { width: 24px; text-align: right; font-size: 11px; font-weight: 600; color: #FF7D00; flex-shrink: 0; }

/* Recent CTA clicks */
.recent-cta { }
.cta-click-entry { display: flex; align-items: center; justify-content: space-between; padding: 6px 8px; background: #f8f9fa; border-radius: 6px; margin-bottom: 4px; font-size: 11px; }
.dark .cta-click-entry { background: #2a2a2a; }
.cta-click-left { display: flex; align-items: center; gap: 6px; }
.cta-click-label { color: #555; }
.dark .cta-click-label { color: #aaa; }
.cta-click-viewer { color: #888; font-size: 10px; }
.cta-click-time { color: #aaa; font-size: 10px; flex-shrink: 0; }

/* Empty states */
.empty-state-sm { text-align: center; padding: 20px 12px; color: #aaa; font-size: 12px; }
.empty-icon-sm { font-size: 28px; display: block; margin-bottom: 6px; }
.empty-hint-sm { font-size: 11px; color: #bbb; margin-top: 2px; }
.empty-state p, .empty-overlay p { margin: 0 0 4px; font-size: 13px; }

.loading-state { text-align: center; padding: 32px; flex: 1; }
.spinner { width: 28px; height: 28px; border: 3px solid #e0e0e0; border-top-color: #165DFF; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
@keyframes spin { to { transform: rotate(360deg); } }

.empty-overlay { text-align: center; padding: 32px 16px; color: #888; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); }
.empty-icon { font-size: 40px; display: block; margin-bottom: 8px; }
</style>
