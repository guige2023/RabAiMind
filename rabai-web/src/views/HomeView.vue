<template>
  <div class="dashboard">
    <!-- Header -->
    <header class="dashboard-header">
      <div class="header-left">
        <h1 class="greeting">{{ greeting }}</h1>
        <p class="greeting-sub" v-if="summary.total_presentations > 0">
          已创建 <strong>{{ summary.total_presentations }}</strong> 个演示 ·
          本周 <strong>{{ summary.this_week_presentations }}</strong> 个
        </p>
      </div>
      <div class="header-actions">
        <router-link to="/create" class="btn btn-primary btn-create">
          <span>➕</span> 新建演示
        </router-link>
      </div>
    </header>

    <!-- Quick Actions -->
    <section class="section quick-actions">
      <div class="quick-actions-grid">
        <router-link to="/create" class="qa-card qa-primary">
          <div class="qa-icon">🚀</div>
          <div class="qa-content">
            <h3>AI 一键生成</h3>
            <p>输入需求，AI 自动生成专业 PPT</p>
          </div>
        </router-link>
        <router-link to="/create?scene=business" class="qa-card">
          <div class="qa-icon">💼</div>
          <div class="qa-content">
            <h3>商务汇报</h3>
            <p>工作汇报、商业计划</p>
          </div>
        </router-link>
        <router-link to="/create?scene=education" class="qa-card">
          <div class="qa-icon">📚</div>
          <div class="qa-content">
            <h3>教育培训</h3>
            <p>课件、培训、学术</p>
          </div>
        </router-link>
        <router-link to="/templates" class="qa-card">
          <div class="qa-icon">📑</div>
          <div class="qa-content">
            <h3>模板市场</h3>
            <p>浏览更多专业模板</p>
          </div>
        </router-link>
      </div>
    </section>

    <!-- Main Content Grid -->
    <div class="dashboard-grid">
      <!-- Left Column -->
      <div class="dashboard-left">

        <!-- Recent Presentations -->
        <section class="section">
          <div class="section-header">
            <h2 class="section-title">最近演示</h2>
            <router-link to="/history" class="section-more">查看全部 →</router-link>
          </div>

          <div v-if="loading && recentPresentations.length === 0" class="loading-state">
            <div class="skeleton-card" v-for="i in 3" :key="i"></div>
          </div>

          <div v-else-if="recentPresentations.length === 0" class="empty-state">
            <div class="empty-icon">📊</div>
            <p>还没有演示作品</p>
            <router-link to="/create" class="btn btn-primary btn-sm">立即创建第一个</router-link>
          </div>

          <div v-else class="recent-list">
            <router-link
              v-for="ppt in recentPresentations"
              :key="ppt.task_id"
              :to="`/result/${ppt.task_id}`"
              class="recent-card"
            >
              <div class="recent-thumb">
                <div class="thumb-placeholder" :style="{ background: thumbGradient(ppt.task_id) }">
                  <span class="thumb-slides">{{ ppt.slide_count }}P</span>
                </div>
              </div>
              <div class="recent-info">
                <h4 class="recent-title">{{ ppt.title }}</h4>
                <div class="recent-meta">
                  <span class="meta-tag scene-tag">{{ getSceneLabel(ppt.scene) }}</span>
                  <span class="meta-sep">·</span>
                  <span class="meta-time">{{ formatCreatedAt(ppt.created_at) }}</span>
                  <span v-if="ppt.duration_seconds" class="meta-sep">·</span>
                  <span v-if="ppt.duration_seconds" class="meta-time">{{ formatDuration(ppt.duration_seconds) }}</span>
                </div>
              </div>
              <div class="recent-arrow">›</div>
            </router-link>
          </div>
        </section>

        <!-- Suggested Templates -->
        <section class="section">
          <div class="section-header">
            <h2 class="section-title">为你推荐</h2>
            <router-link to="/templates" class="section-more">更多模板 →</router-link>
          </div>
          <div class="suggested-grid">
            <router-link
              v-for="tmpl in suggestedTemplates"
              :key="tmpl.name"
              :to="`/create?template=${tmpl.name}&scene=${tmpl.scene}&style=${tmpl.style}`"
              class="suggested-card"
            >
              <div class="suggested-preview" :style="{ background: tmplGradient(tmpl.name) }">
                <span class="suggested-icon">📄</span>
              </div>
              <div class="suggested-info">
                <h4 class="suggested-name">{{ tmpl.name }}</h4>
                <p class="suggested-reason">{{ tmpl.reason }}</p>
              </div>
            </router-link>
          </div>
        </section>

      </div>

      <!-- Right Column -->
      <div class="dashboard-right">

        <!-- Weekly Activity Chart -->
        <section class="section">
          <div class="section-header">
            <h2 class="section-title">本周活动</h2>
            <router-link to="/analytics" class="section-more">详情 →</router-link>
          </div>
          <div class="weekly-chart">
            <div class="chart-bars">
              <div
                v-for="stat in weeklyStats"
                :key="stat.date"
                class="bar-wrapper"
              >
                <div class="bar-value" v-if="stat.count > 0">{{ stat.count }}</div>
                <div class="bar-track">
                  <div
                    class="bar-fill"
                    :style="{
                      height: `${Math.max((stat.count / weeklyMaxCount) * 100, stat.count > 0 ? 8 : 0)}%`,
                    }"
                  ></div>
                </div>
                <div class="bar-label">{{ stat.weekday_label }}</div>
              </div>
            </div>
            <div class="chart-summary">
              <div class="chart-stat">
                <span class="cs-value">{{ summary.this_week_presentations }}</span>
                <span class="cs-label">本周演示</span>
              </div>
              <div class="chart-stat">
                <span class="cs-value">{{ summary.this_week_slides }}</span>
                <span class="cs-label">本周页数</span>
              </div>
              <div class="chart-stat">
                <span class="cs-value">{{ summary.total_presentations }}</span>
                <span class="cs-label">历史总数</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Team Activity Feed -->
        <section class="section">
          <div class="section-header">
            <h2 class="section-title">团队动态</h2>
            <span class="live-badge">● LIVE</span>
          </div>
          <div class="activity-feed">
            <div
              v-for="activity in teamActivity"
              :key="activity.id"
              class="activity-item"
            >
              <div
                class="activity-avatar"
                :style="{ background: avatarColor(activity.user_id) }"
              >
                {{ activity.user_name.charAt(0) }}
              </div>
              <div class="activity-content">
                <div class="activity-main">
                  <span class="activity-user">{{ activity.user_name }}</span>
                  <span class="activity-icon" :style="{ color: getActivityInfo(activity).color }">
                    {{ getActivityInfo(activity).icon }}
                  </span>
                  <span class="activity-text">{{ getActivityInfo(activity).text }}</span>
                </div>
                <div class="activity-target" v-if="activity.target">
                  <span class="target-text">{{ activity.target }}</span>
                  <span v-if="activity.slide_num" class="target-slide">第{{ activity.slide_num }}页</span>
                </div>
              </div>
              <div class="activity-time">{{ getActivityInfo(activity).relativeTime }}</div>
            </div>
          </div>
        </section>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useDashboard } from '../composables/useDashboard'

const {
  fetchDashboard,
  loading,
  recentPresentations,
  weeklyStats,
  suggestedTemplates,
  teamActivity,
  summary,
  weeklyMaxCount,
  formatDuration,
  formatCreatedAt,
  getActivityInfo,
  getSceneLabel,
} = useDashboard()

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return '上午好 ☀️'
  if (hour < 18) return '下午好 🌤️'
  return '晚上好 🌙'
})

const thumbGradient = (id: string): string => {
  const colors = ['#165DFF,#4285F4', '#7C3AED,#A78BFA', '#059669,#34D399', '#EA580C,#FB923C']
  const idx = id.charCodeAt(0) % colors.length
  return `linear-gradient(135deg, ${colors[idx]})`
}

const tmplGradient = (name: string): string => {
  const map: Record<string, string> = {
    default: '#1E293B,#334155',
    corporate: '#165DFF,#3B82F6',
    minimal: '#64748B,#94A3B8',
    creative: '#7C3AED,#A855F7',
  }
  return `linear-gradient(135deg, ${map[name] || '#334155,#475569'})`
}

const avatarColors = ['#165DFF', '#7C3AED', '#059669', '#EA580C', '#DB2777', '#0891B2']
const avatarColor = (userId: string): string => {
  const idx = userId.charCodeAt(0) % avatarColors.length
  return avatarColors[idx]
}

onMounted(() => {
  fetchDashboard()
})
</script>

<style scoped>
/* ── Layout ──────────────────────────────────────────────────── */
.dashboard {
  min-height: 100vh;
  background: #F5F7FA;
  padding: 0 24px 48px;
}

/* ── Header ──────────────────────────────────────────────────── */
.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28px 0 24px;
  border-bottom: 1px solid #E5E7EB;
  margin-bottom: 24px;
}

.greeting {
  font-size: 26px;
  font-weight: 700;
  color: #1A1A1A;
  margin: 0 0 4px;
}

.greeting-sub {
  font-size: 14px;
  color: #6B7280;
  margin: 0;
}

.btn-create {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #165DFF;
  color: #fff;
  border-radius: 10px;
  font-weight: 600;
  font-size: 15px;
  text-decoration: none;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(22, 93, 255, 0.3);
}

.btn-create:hover {
  background: #1250D3;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(22, 93, 255, 0.4);
}

/* ── Section Commons ─────────────────────────────────────────── */
.section {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1A1A1A;
  margin: 0;
}

.section-more {
  font-size: 13px;
  color: #165DFF;
  text-decoration: none;
  font-weight: 500;
}

.live-badge {
  font-size: 11px;
  font-weight: 700;
  color: #22C55E;
  letter-spacing: 0.05em;
}

/* ── Quick Actions ───────────────────────────────────────────── */
.quick-actions {
  margin-bottom: 20px;
}

.quick-actions-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 12px;
}

.qa-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  text-decoration: none;
  transition: all 0.2s;
  cursor: pointer;
}

.qa-card:hover {
  border-color: #165DFF;
  background: #F0F5FF;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(22, 93, 255, 0.1);
}

.qa-primary {
  background: linear-gradient(135deg, #165DFF, #4285F4);
  border-color: #165DFF;
  color: #fff;
  padding: 20px;
}

.qa-primary h3, .qa-primary p {
  color: #fff !important;
}

.qa-primary .qa-icon {
  font-size: 28px;
}

.qa-icon {
  font-size: 22px;
  flex-shrink: 0;
}

.qa-content h3 {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A1A;
  margin: 0 0 2px;
}

.qa-content p {
  font-size: 12px;
  color: #6B7280;
  margin: 0;
}

/* ── Dashboard Grid ──────────────────────────────────────────── */
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 16px;
  align-items: start;
}

.dashboard-left { display: flex; flex-direction: column; gap: 0; }
.dashboard-right { display: flex; flex-direction: column; gap: 0; }

/* ── Recent Presentations ─────────────────────────────────────── */
.recent-list { display: flex; flex-direction: column; gap: 8px; }

.recent-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px;
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  text-decoration: none;
  transition: all 0.2s;
}

.recent-card:hover {
  border-color: #165DFF;
  background: #F0F5FF;
  box-shadow: 0 2px 8px rgba(22, 93, 255, 0.08);
}

.recent-thumb { flex-shrink: 0; }

.thumb-placeholder {
  width: 64px;
  height: 42px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.thumb-slides {
  font-size: 11px;
  font-weight: 700;
  color: rgba(255,255,255,0.95);
  background: rgba(0,0,0,0.2);
  padding: 2px 6px;
  border-radius: 4px;
}

.recent-info { flex: 1; min-width: 0; }

.recent-title {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A1A;
  margin: 0 0 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.recent-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #6B7280;
}

.meta-tag {
  display: inline-flex;
  align-items: center;
  padding: 1px 8px;
  background: #F0F5FF;
  color: #165DFF;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
}

.meta-sep { color: #D1D5DB; }
.meta-time { color: #9CA3AF; }

.recent-arrow {
  font-size: 22px;
  color: #D1D5DB;
  flex-shrink: 0;
}

/* ── Suggested Templates ─────────────────────────────────────── */
.suggested-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.suggested-card {
  text-decoration: none;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #E5E7EB;
  transition: all 0.2s;
  background: #fff;
}

.suggested-card:hover {
  border-color: #165DFF;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(22, 93, 255, 0.12);
}

.suggested-preview {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.suggested-icon { font-size: 24px; opacity: 0.7; }

.suggested-info { padding: 10px; }

.suggested-name {
  font-size: 13px;
  font-weight: 600;
  color: #1A1A1A;
  margin: 0 0 2px;
}

.suggested-reason {
  font-size: 11px;
  color: #9CA3AF;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Weekly Chart ────────────────────────────────────────────── */
.weekly-chart { padding: 4px 0; }

.chart-bars {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 80px;
  margin-bottom: 12px;
}

.bar-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  height: 100%;
}

.bar-value {
  font-size: 10px;
  font-weight: 700;
  color: #165DFF;
  height: 14px;
}

.bar-track {
  flex: 1;
  width: 100%;
  background: #F3F4F6;
  border-radius: 4px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}

.bar-fill {
  width: 100%;
  background: linear-gradient(180deg, #165DFF, #4285F4);
  border-radius: 4px;
  transition: height 0.4s ease;
  min-height: 4px;
}

.bar-label {
  font-size: 11px;
  color: #9CA3AF;
  white-space: nowrap;
}

.chart-summary {
  display: flex;
  gap: 0;
  border-top: 1px solid #F3F4F6;
  padding-top: 12px;
}

.chart-stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 0 4px;
}

.chart-stat + .chart-stat {
  border-left: 1px solid #F3F4F6;
}

.cs-value {
  font-size: 20px;
  font-weight: 700;
  color: #1A1A1A;
}

.cs-label {
  font-size: 11px;
  color: #9CA3AF;
}

/* ── Team Activity ───────────────────────────────────────────── */
.activity-feed { display: flex; flex-direction: column; gap: 0; }

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #F3F4F6;
}

.activity-item:last-child { border-bottom: none; }

.activity-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.activity-content { flex: 1; min-width: 0; }

.activity-main {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  font-size: 13px;
}

.activity-user {
  font-weight: 600;
  color: #1A1A1A;
}

.activity-icon { font-size: 14px; }

.activity-text {
  color: #4B5563;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.activity-target {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
}

.target-text {
  font-size: 12px;
  color: #6B7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.target-slide {
  font-size: 11px;
  color: #9CA3AF;
  background: #F3F4F6;
  padding: 1px 6px;
  border-radius: 10px;
  flex-shrink: 0;
}

.activity-time {
  font-size: 11px;
  color: #9CA3AF;
  flex-shrink: 0;
  margin-top: 2px;
}

/* ── Empty / Loading States ──────────────────────────────────── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px 0;
  color: #9CA3AF;
}

.empty-icon { font-size: 40px; }

.empty-state p { font-size: 14px; margin: 0; }

.btn-sm {
  padding: 8px 20px;
  font-size: 13px;
  background: #165DFF;
  color: #fff;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
}

.skeleton-card {
  height: 66px;
  background: linear-gradient(90deg, #F3F4F6 25%, #E5E7EB 50%, #F3F4F6 75%);
  background-size: 200% 100%;
  border-radius: 12px;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── Responsive ─────────────────────────────────────────────── */
@media (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .quick-actions-grid {
    grid-template-columns: 1fr 1fr;
  }

  .suggested-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .dashboard { padding: 0 16px 32px; }

  .dashboard-header { flex-direction: column; align-items: flex-start; gap: 16px; }

  .greeting { font-size: 22px; }

  .quick-actions-grid { grid-template-columns: 1fr; }

  .btn-create { width: 100%; justify-content: center; }
}
</style>
