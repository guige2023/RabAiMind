<template>
  <div class="settings-page">
    <!-- Header -->
    <div class="settings-header">
      <div class="header-left">
        <router-link to="/" class="back-link">← 首页</router-link>
        <h1 class="page-title">⚙️ 设置</h1>
      </div>
    </div>

    <!-- Tab Navigation -->
    <div class="settings-tabs" role="tablist">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab-btn"
        :class="{ active: activeTab === tab.id }"
        role="tab"
        :aria-selected="activeTab === tab.id"
        @click="activeTab = tab.id"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        <span class="tab-label">{{ tab.label }}</span>
      </button>
    </div>

    <!-- Tab Content -->
    <div class="settings-content">

      <!-- ── Preferences Tab ─────────────────────────────────── -->
      <div v-if="activeTab === 'preferences'" class="tab-panel" role="tabpanel">
        <h2 class="section-title">偏好设置</h2>

        <!-- Theme -->
        <div class="setting-group">
          <div class="setting-label">
            <span class="label-icon">🎨</span>
            <div>
              <div class="label-title">主题模式</div>
              <div class="label-desc">选择深色/浅色/自动跟随系统</div>
            </div>
          </div>
          <div class="setting-control">
            <div class="theme-options">
              <button
                v-for="opt in themeOptions"
                :key="opt.value"
                class="theme-opt"
                :class="{ active: prefs.theme === opt.value }"
                @click="updatePref('theme', opt.value)"
              >
                <span class="opt-icon">{{ opt.icon }}</span>
                <span class="opt-label">{{ opt.label }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Language -->
        <div class="setting-group">
          <div class="setting-label">
            <span class="label-icon">🌐</span>
            <div>
              <div class="label-title">界面语言</div>
              <div class="label-desc">选择显示语言</div>
            </div>
          </div>
          <div class="setting-control">
            <select class="select-input" :value="prefs.language" @change="updatePref('language', ($event.target as HTMLSelectElement).value)">
              <option value="zh">中文</option>
              <option value="en">English</option>
              <option value="ja">日本語</option>
              <option value="ko">한국어</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="ar">العربية (RTL)</option>
              <option value="he">עברית (RTL)</option>
            </select>
          </div>
        </div>

        <!-- Notifications -->
        <div class="setting-group">
          <div class="setting-label">
            <span class="label-icon">🔔</span>
            <div>
              <div class="label-title">通知设置</div>
              <div class="label-desc">管理消息推送方式</div>
            </div>
          </div>
          <div class="setting-control notification-controls">
            <label class="toggle-row">
              <span>PPT 生成完成时发送邮件</span>
              <input type="checkbox" :checked="prefs.notifications?.email_on_complete" @change="updateNotif('email_on_complete', ($event.target as HTMLInputElement).checked)" />
              <span class="toggle-slider"></span>
            </label>
            <label class="toggle-row">
              <span>PPT 生成完成时推送通知</span>
              <input type="checkbox" :checked="prefs.notifications?.push_on_complete" @change="updateNotif('push_on_complete', ($event.target as HTMLInputElement).checked)" />
              <span class="toggle-slider"></span>
            </label>
            <label class="toggle-row">
              <span>每周使用摘要</span>
              <input type="checkbox" :checked="prefs.notifications?.weekly_summary" @change="updateNotif('weekly_summary', ($event.target as HTMLInputElement).checked)" />
              <span class="toggle-slider"></span>
            </label>
            <label class="toggle-row">
              <span>协作者加入时推送通知</span>
              <input type="checkbox" :checked="prefs.notifications?.collab_joined_push" @change="updateNotif('collab_joined_push', ($event.target as HTMLInputElement).checked)" />
              <span class="toggle-slider"></span>
            </label>
            <label class="toggle-row">
              <span>协作者加入时发送邮件</span>
              <input type="checkbox" :checked="prefs.notifications?.collab_joined_email" @change="updateNotif('collab_joined_email', ($event.target as HTMLInputElement).checked)" />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>

        <!-- Accessibility -->
        <div class="setting-group">
          <div class="setting-label">
            <span class="label-icon">♿</span>
            <div>
              <div class="label-title">无障碍设置</div>
              <div class="label-desc">辅助功能选项</div>
            </div>
          </div>
          <div class="setting-control notification-controls">
            <label class="toggle-row">
              <span>减少动画效果</span>
              <input type="checkbox" :checked="prefs.accessibility?.reduce_motion" @change="updateAcc('reduce_motion', ($event.target as HTMLInputElement).checked)" />
              <span class="toggle-slider"></span>
            </label>
            <label class="toggle-row">
              <span>高对比度模式</span>
              <input type="checkbox" :checked="prefs.accessibility?.high_contrast" @change="updateAcc('high_contrast', ($event.target as HTMLInputElement).checked)" />
              <span class="toggle-slider"></span>
            </label>
            <div class="select-row">
              <span>字体大小</span>
              <select class="select-input" :value="prefs.accessibility?.font_size || 'medium'" @change="updateAcc('font_size', ($event.target as HTMLSelectElement).value)">
                <option value="small">小</option>
                <option value="medium">中</option>
                <option value="large">大</option>
              </select>
            </div>
            <!-- R155: Dyslexia-friendly font -->
            <label class="toggle-row">
              <span>阅读障碍友好字体 (OpenDyslexic)</span>
              <input type="checkbox" :checked="prefs.accessibility?.dyslexia_font" @change="updateAcc('dyslexia_font', ($event.target as HTMLInputElement).checked)" />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>

        <!-- Mobile Data Settings -->
        <div class="setting-group">
          <div class="setting-label">
            <span class="label-icon">📡</span>
            <div>
              <div class="label-title">流量节省模式</div>
              <div class="label-desc">减少图片质量、禁用动画，节省移动数据</div>
            </div>
          </div>
          <div class="setting-control notification-controls">
            <label class="toggle-row">
              <span>启用流量节省</span>
              <input type="checkbox" :checked="isReduceData" @change="toggleReduceData" />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>

        <!-- Offline Download (Mobile) -->
        <div class="setting-group">
          <div class="setting-label">
            <span class="label-icon">📲</span>
            <div>
              <div class="label-title">下载 App 离线使用</div>
              <div class="label-desc">安装 RabAi Mind 应用，无网也能查看和演示</div>
            </div>
          </div>
          <div class="setting-control">
            <button class="btn btn-primary" @click="handleInstallApp" :disabled="installingApp">
              {{ installingApp ? '处理中...' : '📲 下载 App' }}
            </button>
          </div>
        </div>

        <!-- Editor Settings -->
        <div class="setting-group">
          <div class="setting-label">
            <span class="label-icon">✏️</span>
            <div>
              <div class="label-title">编辑器设置</div>
              <div class="label-desc">编辑体验配置</div>
            </div>
          </div>
          <div class="setting-control notification-controls">
            <label class="toggle-row">
              <span>自动保存</span>
              <input type="checkbox" :checked="prefs.editor?.auto_save" @change="updateEditor('auto_save', ($event.target as HTMLInputElement).checked)" />
              <span class="toggle-slider"></span>
            </label>
            <label class="toggle-row">
              <span>显示网格线</span>
              <input type="checkbox" :checked="prefs.editor?.show_grid" @change="updateEditor('show_grid', ($event.target as HTMLInputElement).checked)" />
              <span class="toggle-slider"></span>
            </label>
            <label class="toggle-row">
              <span>吸附到网格</span>
              <input type="checkbox" :checked="prefs.editor?.snap_to_grid" @change="updateEditor('snap_to_grid', ($event.target as HTMLInputElement).checked)" />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>

        <!-- Reset -->
        <div class="setting-group reset-group">
          <div class="setting-label">
            <span class="label-icon">🔄</span>
            <div>
              <div class="label-title">恢复默认</div>
              <div class="label-desc">将所有设置重置为默认值</div>
            </div>
          </div>
          <div class="setting-control">
            <button class="btn btn-danger" @click="resetAll" :disabled="resetting">
              {{ resetting ? '重置中...' : '🔄 恢复默认设置' }}
            </button>
          </div>
        </div>
      </div>

      <!-- ── Account Tab ─────────────────────────────────────── -->
      <div v-if="activeTab === 'account'" class="tab-panel" role="tabpanel">
        <h2 class="section-title">账户设置</h2>

        <!-- Profile -->
        <div class="setting-group">
          <div class="setting-label">
            <span class="label-icon">👤</span>
            <div>
              <div class="label-title">个人信息</div>
              <div class="label-desc">管理你的账户资料</div>
            </div>
          </div>
          <div class="setting-control profile-form">
            <div class="form-field">
              <label>姓名</label>
              <input type="text" class="input" v-model="profile.name" placeholder="你的姓名" />
            </div>
            <div class="form-field">
              <label>邮箱</label>
              <input type="email" class="input" v-model="profile.email" placeholder="your@email.com" />
            </div>
            <button class="btn btn-primary" @click="saveProfile" :disabled="savingProfile">
              {{ savingProfile ? '保存中...' : '💾 保存个人信息' }}
            </button>
            <span v-if="profileMsg" class="success-msg">{{ profileMsg }}</span>
          </div>
        </div>

        <!-- Password -->
        <div class="setting-group">
          <div class="setting-label">
            <span class="label-icon">🔒</span>
            <div>
              <div class="label-title">修改密码</div>
              <div class="label-desc">更新账户密码</div>
            </div>
          </div>
          <div class="setting-control profile-form">
            <div class="form-field">
              <label>旧密码</label>
              <input type="password" class="input" v-model="password.old" placeholder="输入旧密码" />
            </div>
            <div class="form-field">
              <label>新密码</label>
              <input type="password" class="input" v-model="password.new" placeholder="输入新密码（至少6位）" />
            </div>
            <button class="btn btn-primary" @click="changePassword" :disabled="changingPw">
              {{ changingPw ? '修改中...' : '🔒 修改密码' }}
            </button>
            <span v-if="pwMsg" class="success-msg" :class="{ 'error-msg': pwError }">{{ pwMsg }}</span>
          </div>
        </div>
      </div>

      <!-- ── Stats Tab ──────────────────────────────────────── -->
      <div v-if="activeTab === 'stats'" class="tab-panel" role="tabpanel">
        <h2 class="section-title">📊 使用统计</h2>

        <div v-if="statsLoading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>加载统计数据...</p>
        </div>

        <div v-else-if="stats" class="stats-dashboard">
          <!-- Summary Cards -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">📑</div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.total_generations || 0 }}</div>
                <div class="stat-label">PPT 生成总数</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">🎞️</div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.total_slides || 0 }}</div>
                <div class="stat-label">幻灯片总数</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">⏱</div>
              <div class="stat-info">
                <div class="stat-value">{{ formatTime(stats.total_time_seconds || 0) }}</div>
                <div class="stat-label">累计生成耗时</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">📐</div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.avg_slides || 0 }}</div>
                <div class="stat-label">平均每PPT页数</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">🎨</div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.templates_used || 0 }}</div>
                <div class="stat-label">使用模板数</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">⚡</div>
              <div class="stat-info">
                <div class="stat-value">{{ formatTime(stats.avg_time_seconds || 0) }}</div>
                <div class="stat-label">平均生成耗时</div>
              </div>
            </div>
          </div>

          <!-- Top Templates -->
          <div class="panel" v-if="stats.top_templates?.length">
            <div class="panel-header"><h3>🎨 常用模板 TOP 5</h3></div>
            <div class="rank-list">
              <div v-for="(item, i) in stats.top_templates" :key="i" class="rank-item">
                <span class="rank-num">{{ i + 1 }}</span>
                <span class="rank-name">{{ item[0] }}</span>
                <span class="rank-count">{{ item[1] }}次</span>
              </div>
            </div>
          </div>

          <!-- Top Styles -->
          <div class="panel" v-if="stats.top_styles?.length">
            <div class="panel-header"><h3>✨ 常用风格 TOP 5</h3></div>
            <div class="rank-list">
              <div v-for="(item, i) in stats.top_styles" :key="i" class="rank-item">
                <span class="rank-num">{{ i + 1 }}</span>
                <span class="rank-name">{{ item[0] }}</span>
                <span class="rank-count">{{ item[1] }}次</span>
              </div>
            </div>
          </div>

          <!-- Recent 7 Days -->
          <div class="panel" v-if="stats.recent_7days?.length">
            <div class="panel-header"><h3>📅 近7天活动</h3></div>
            <div class="activity-bars">
              <div v-for="day in stats.recent_7days" :key="day.date" class="activity-bar-item">
                <span class="day-label">{{ day.date.slice(5) }}</span>
                <div class="bar-track">
                  <div class="bar-fill" :style="{ width: maxActivity > 0 ? (day.count / maxActivity * 100) + '%' : '0%' }"></div>
                </div>
                <span class="day-count">{{ day.count }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <p>暂无统计数据</p>
        </div>
      </div>

      <!-- ── Performance Tab ─────────────────────────────────── -->
      <div v-if="activeTab === 'performance'" class="tab-panel" role="tabpanel">
        <h2 class="section-title">🚀 性能优化</h2>

        <!-- Power Saver Mode -->
        <div class="setting-group">
          <div class="setting-label">
            <span class="label-icon">🔋</span>
            <div>
              <div class="label-title">省电/低性能模式</div>
              <div class="label-desc">减少动画、延迟加载图片、降低图片质量以节省电量和流量</div>
            </div>
          </div>
          <div class="setting-control notification-controls">
            <label class="toggle-row">
              <span>启用省电模式</span>
              <input type="checkbox" :checked="isPowerSaver" @change="togglePowerSaver" />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>

        <!-- Power Saver Options -->
        <div v-if="isPowerSaver" class="setting-group">
          <div class="setting-label">
            <span class="label-icon">⚡</span>
            <div>
              <div class="label-title">省电选项</div>
              <div class="label-desc">自定义省电模式的行为</div>
            </div>
          </div>
          <div class="setting-control notification-controls">
            <label class="toggle-row">
              <span>禁用动画</span>
              <input type="checkbox" v-model="powerSaverOptions.animationsDisabled" />
              <span class="toggle-slider"></span>
            </label>
            <label class="toggle-row">
              <span>延迟加载图片</span>
              <input type="checkbox" v-model="powerSaverOptions.lazyLoadImages" />
              <span class="toggle-slider"></span>
            </label>
            <label class="toggle-row">
              <span>压缩图片</span>
              <input type="checkbox" v-model="powerSaverOptions.compressImages" />
              <span class="toggle-slider"></span>
            </label>
            <label class="toggle-row">
              <span>减少DOM复杂度</span>
              <input type="checkbox" v-model="powerSaverOptions.reduceDOM" />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>

        <!-- Performance Profiler -->
        <div class="setting-group">
          <div class="setting-label">
            <span class="label-icon">📊</span>
            <div>
              <div class="label-title">性能监控面板</div>
              <div class="label-desc">显示实时FPS、内存使用、渲染时间等性能指标</div>
            </div>
          </div>
          <div class="setting-control">
            <button class="btn" @click="toggleProfilerPanel" :class="profilerVisible ? 'btn-primary' : 'btn-secondary'">
              {{ profilerVisible ? '🟢 性能面板已开启' : '⚪ 开启性能面板' }}
            </button>
          </div>
        </div>

        <!-- Performance Summary -->
        <div class="panel" v-if="perfSummary">
          <div class="panel-header"><h3>📈 当前性能</h3></div>
          <div class="stats-grid">
            <div class="stat-card">
              <span class="stat-icon">🎬</span>
              <div>
                <div class="stat-value" :class="perfSummary.fps.grade">{{ perfSummary.fps.current }} FPS</div>
                <div class="stat-label">平均 {{ perfSummary.fps.average }} FPS</div>
              </div>
            </div>
            <div class="stat-card">
              <span class="stat-icon">💾</span>
              <div>
                <div class="stat-value" :class="perfSummary.memory.grade">{{ perfSummary.memory.used }}MB</div>
                <div class="stat-label">限制 {{ perfSummary.memory.limit }}MB</div>
              </div>
            </div>
            <div class="stat-card">
              <span class="stat-icon">🏗️</span>
              <div>
                <div class="stat-value">{{ perfSummary.domNodes.toLocaleString() }}</div>
                <div class="stat-label">DOM节点数</div>
              </div>
            </div>
            <div class="stat-card">
              <span class="stat-icon">⏱️</span>
              <div>
                <div class="stat-value">{{ perfSummary.longTasks }}</div>
                <div class="stat-label">慢任务数</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Startup Optimization -->
        <div class="setting-group">
          <div class="setting-label">
            <span class="label-icon">⚡</span>
            <div>
              <div class="label-title">启动优化</div>
              <div class="label-desc">加快应用启动速度</div>
            </div>
          </div>
          <div class="setting-control notification-controls">
            <label class="toggle-row">
              <span>预加载关键资源</span>
              <input type="checkbox" v-model="startupOptions.preloadCritical" />
              <span class="toggle-slider"></span>
            </label>
            <label class="toggle-row">
              <span>延迟加载非首屏组件</span>
              <input type="checkbox" v-model="startupOptions.lazyLoadComponents" />
              <span class="toggle-slider"></span>
            </label>
            <label class="toggle-row">
              <span>启用 Service Worker 缓存</span>
              <input type="checkbox" v-model="startupOptions.serviceWorkerCache" />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>

        <!-- Startup Time Measurement -->
        <div class="panel">
          <div class="panel-header"><h3>⏱️ 启动时间</h3></div>
          <div v-if="startupTime" class="startup-metrics">
            <div class="startup-metric">
              <span class="startup-label">首次内容绘制</span>
              <span class="startup-value">{{ startupTime.fcp }}ms</span>
            </div>
            <div class="startup-metric">
              <span class="startup-label">最大内容绘制</span>
              <span class="startup-value">{{ startupTime.lcp }}ms</span>
            </div>
            <div class="startup-metric">
              <span class="startup-label">DOM加载完成</span>
              <span class="startup-value">{{ startupTime.domContentLoaded }}ms</span>
            </div>
            <div class="startup-metric">
              <span class="startup-label">页面完全加载</span>
              <span class="startup-value">{{ startupTime.load }}ms</span>
            </div>
          </div>
          <div v-else class="empty-state">
            <p>正在测量启动时间...</p>
          </div>
        </div>
      </div>

      <!-- ── Cache Tab ───────────────────────────────────────── -->
      <div v-if="activeTab === 'cache'" class="tab-panel" role="tabpanel">
        <h2 class="section-title">💾 缓存管理</h2>
        <CacheManager />
      </div>

      <!-- ── Sync Tab ────────────────────────────────────────── -->
      <div v-if="activeTab === 'sync'" class="tab-panel" role="tabpanel">
        <h2 class="section-title">☁️ 离线同步</h2>
        <SyncStatus />
      </div>

      <!-- ── Export Tab ──────────────────────────────────────── -->
      <div v-if="activeTab === 'export'" class="tab-panel" role="tabpanel">
        <h2 class="section-title">📦 数据导出</h2>

        <div class="setting-group">
          <div class="setting-label">
            <span class="label-icon">📄</span>
            <div>
              <div class="label-title">导出所有数据 (JSON)</div>
              <div class="label-desc">下载你的所有个人数据：个人信息、偏好设置、统计数据和任务历史</div>
            </div>
          </div>
          <div class="setting-control">
            <button class="btn btn-primary btn-lg" @click="exportData" :disabled="exporting">
              {{ exporting ? '导出中...' : '📥 导出 JSON 数据' }}
            </button>
          </div>
        </div>

        <div class="export-info">
          <h3>📋 导出的数据包含</h3>
          <ul>
            <li>👤 个人信息（姓名、邮箱）</li>
            <li>⚙️ 偏好设置（主题、语言、通知）</li>
            <li>📊 使用统计（生成次数、幻灯片数、模板使用）</li>
            <li>📋 任务历史记录（所有 PPT 生成记录）</li>
          </ul>
          <p class="export-note">数据以 JSON 格式导出，可用于备份或迁移账户。</p>
        </div>

        <!-- GDPR Delete All My Data -->
        <div class="danger-zone">
          <h2 class="section-title danger-title">🗑️ GDPR 数据删除（不可逆）</h2>
          <div class="setting-group danger-group">
            <div class="setting-label">
              <span class="label-icon">⚠️</span>
              <div>
                <div class="label-title">删除所有我的数据</div>
                <div class="label-desc">
                  根据 GDPR 第17条（被遗忘权），彻底删除您的所有个人数据。<br/>
                  删除后，所有PPT、模板、品牌资产、收藏记录将被永久清除。
                </div>
              </div>
            </div>
            <div class="setting-control">
              <label class="secure-delete-toggle">
                <input type="checkbox" v-model="secureDelete" />
                <span>🔒 安全删除（覆写擦除，数据不可恢复）</span>
              </label>
              <button
                class="btn btn-danger btn-lg"
                @click="deleteAllMyData"
                :disabled="deleting || !deleteConfirmText"
              >
                {{ deleting ? '删除中...' : '🗑️ 删除所有我的数据' }}
              </button>
            </div>
          </div>
          <div class="delete-confirm-row">
            <input
              v-model="deleteConfirmText"
              class="form-input"
              placeholder="输入「删除」确认"
              style="max-width: 200px;"
            />
          </div>
          <p class="danger-note">
            ⚠️ 此操作不可撤销。数据删除后无法恢复，请在执行前使用上方"导出JSON数据"功能备份。
          </p>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import axios from '../api/client'
import { useAccessibility } from '../composables/useAccessibility'
import { useI18n } from '../composables/useI18n'
import { usePerformanceMode } from '../composables/usePerformanceMode'
import { usePerformanceProfiler } from '../composables/usePerformanceProfiler'
import { useBackgroundSync } from '../composables/useBackgroundSync'
import { usePWAInstall } from '../composables/usePWAInstall'
import PerformanceProfiler from '../components/PerformanceProfiler.vue'
import CacheManager from '../components/CacheManager.vue'
import SyncStatus from '../components/SyncStatus.vue'

const activeTab = ref('preferences')
const tabs = [
  { id: 'preferences', label: '偏好设置', icon: '⚙️' },
  { id: 'account', label: '账户', icon: '👤' },
  { id: 'stats', label: '使用统计', icon: '📊' },
  { id: 'performance', label: '性能优化', icon: '🚀' },
  { id: 'cache', label: '缓存管理', icon: '💾' },
  { id: 'sync', label: '离线同步', icon: '☁️' },
  { id: 'export', label: '数据导出', icon: '📦' },
  { id: 'security', label: '安全设置', icon: '🔐' },
]

const themeOptions = [
  { value: 'light', label: '浅色', icon: '☀️' },
  { value: 'dark', label: '深色', icon: '🌙' },
  { value: 'auto', label: '跟随系统', icon: '💻' },
]

// ── Preferences ──────────────────────────────────────────────────────────────
const prefs = reactive<any>({
  theme: 'auto',
  language: 'zh',
  notifications: { email_on_complete: true, push_on_complete: true, weekly_summary: false, collab_joined_push: true, collab_joined_email: false },
  accessibility: { reduce_motion: false, high_contrast: false, font_size: 'medium', dyslexia_font: false },
  editor: { auto_save: true, show_grid: true, snap_to_grid: true },
})
const resetting = ref(false)

// ── Mobile Data / Performance Mode ──────────────────────────────────────────
const { isPerformanceMode, togglePerformanceMode } = usePerformanceMode()
const isReduceData = isPerformanceMode

const toggleReduceData = async () => {
  togglePerformanceMode()
  try {
    await axios.put('/user/preferences', { performance_mode: !isReduceData.value })
  } catch (e) {
    console.error('Failed to save performance mode preference', e)
  }
}

// ── Performance Tab ─────────────────────────────────────────────────────────
const { isRunning: profilerRunning, isVisible: profilerVisible, toggle: toggleProfiler, getSummary: getProfilerSummary } = usePerformanceProfiler()

// Power saver mode
const isPowerSaver = ref(false)
const powerSaverOptions = reactive({
  animationsDisabled: true,
  lazyLoadImages: true,
  compressImages: true,
  reduceDOM: false
})

const togglePowerSaver = () => {
  isPowerSaver.value = !isPowerSaver.value
  localStorage.setItem('rabai_power_saver', JSON.stringify(isPowerSaver.value))
  localStorage.setItem('rabai_power_saver_options', JSON.stringify(powerSaverOptions))
}

// Load power saver state
const loadPowerSaverState = () => {
  try {
    const saved = localStorage.getItem('rabai_power_saver')
    if (saved !== null) {
      isPowerSaver.value = JSON.parse(saved)
    }
    const savedOptions = localStorage.getItem('rabai_power_saver_options')
    if (savedOptions) {
      Object.assign(powerSaverOptions, JSON.parse(savedOptions))
    }
  } catch {}
}

// Performance summary
const perfSummary = ref<any>(null)

const updatePerfSummary = () => {
  if (profilerRunning.value) {
    perfSummary.value = getProfilerSummary()
  }
}

// Toggle profiler panel
const toggleProfilerPanel = () => {
  toggleProfiler()
  if (profilerRunning.value) {
    updatePerfSummary()
  }
}

// Startup optimization options
const startupOptions = reactive({
  preloadCritical: true,
  lazyLoadComponents: true,
  serviceWorkerCache: true
})

// Startup time measurement
const startupTime = ref<{ fcp: number; lcp: number; domContentLoaded: number; load: number } | null>(null)

const measureStartupTime = () => {
  if (window.performance) {
    const nav = performance.getEntriesByEntries('navigation')[0] as PerformanceNavigationTiming
    if (nav) {
      const paintEntries = performance.getEntriesByType('paint')
      const fcp = paintEntries.find(e => e.name === 'first-contentful-paint')
      const lcp = (performance.getEntriesByType('largest-contentful-paint')[0] as any)?.startTime || 0

      startupTime.value = {
        fcp: Math.round(fcp?.startTime || 0),
        lcp: Math.round(lcp),
        domContentLoaded: Math.round(nav.domContentLoadedEventEnd - nav.fetchStart),
        load: Math.round(nav.loadEventEnd - nav.fetchStart)
      }
    }
  }
}

// Auto-update performance summary
let perfInterval: number | null = null

onMounted(() => {
  loadPowerSaverState()
  measureStartupTime()
  if (profilerRunning.value) {
    perfInterval = window.setInterval(updatePerfSummary, 2000)
  }
})

// Load startup options
const loadStartupOptions = () => {
  try {
    const saved = localStorage.getItem('rabai_startup_options')
    if (saved) {
      Object.assign(startupOptions, JSON.parse(saved))
    }
  } catch {}
}

// Watch startup options changes
import { watch } from 'vue'
watch(startupOptions, (val) => {
  localStorage.setItem('rabai_startup_options', JSON.stringify(val))
}, { deep: true })

// ── Offline / PWA Install ───────────────────────────────────────────────────
const { installApp, canInstall } = usePWAInstall()
const installingApp = ref(false)

const handleInstallApp = async () => {
  if (canInstall.value) {
    installingApp.value = true
    await installApp()
    installingApp.value = false
  } else {
    // iOS doesn't support beforeinstallprompt - guide user manually
    alert('在 iOS 上：点击 Safari 的分享按钮 → "添加到主屏幕"\n\n在 Android 上：点击浏览器菜单 → "安装应用"')
  }
}

const loadPrefs = async () => {
  try {
    const res = await axios.get('/user/preferences')
    if (res.data.success) {
      Object.assign(prefs, res.data.data)
    }
  } catch (e) {
    console.error('Failed to load preferences', e)
  }
}

const updatePref = async (key: string, value: any) => {
  prefs[key] = value
  if (key === 'language') {
    setLocale(value)
  }
  try {
    await axios.put('/user/preferences', { [key]: value })
  } catch (e) {
    console.error('Failed to update preference', e)
  }
}

const updateNotif = async (key: string, value: boolean) => {
  prefs.notifications[key] = value
  try {
    await axios.put('/user/preferences', { notifications: { [key]: value } })
  } catch (e) {
    console.error('Failed to update notification', e)
  }
}

const { setHighContrast, setFontSize, setDyslexiaFont } = useAccessibility()
const { setLocale } = useI18n()

const updateAcc = async (key: string, value: any) => {
  prefs.accessibility[key] = value
  // Apply locally in real-time
  if (key === 'high_contrast') {
    setHighContrast(Boolean(value))
  } else if (key === 'font_size') {
    setFontSize(value)
  } else if (key === 'dyslexia_font') {
    setDyslexiaFont(Boolean(value))
  }
  try {
    await axios.put('/user/preferences', { accessibility: { [key]: value } })
  } catch (e) {
    console.error('Failed to update accessibility', e)
  }
}

const updateEditor = async (key: string, value: any) => {
  prefs.editor[key] = value
  try {
    await axios.put('/user/preferences', { editor: { [key]: value } })
  } catch (e) {
    console.error('Failed to update editor', e)
  }
}

const resetAll = async () => {
  if (!confirm('确定要恢复所有设置为默认值吗？')) return
  resetting.value = true
  try {
    const res = await axios.post('/user/preferences/reset')
    if (res.data.success) {
      Object.assign(prefs, res.data.data)
    }
  } catch (e) {
    console.error('Failed to reset preferences', e)
  } finally {
    resetting.value = false
  }
}

// ── Account ─────────────────────────────────────────────────────────────────
const profile = reactive({ name: '', email: '' })
const savingProfile = ref(false)
const profileMsg = ref('')
const password = reactive({ old: '', new: '' })
const changingPw = ref(false)
const pwMsg = ref('')
const pwError = ref(false)

const loadProfile = async () => {
  try {
    const res = await axios.get('/user/profile')
    if (res.data.success) {
      Object.assign(profile, res.data.data)
    }
  } catch (e) {
    console.error('Failed to load profile', e)
  }
}

const saveProfile = async () => {
  savingProfile.value = true
  profileMsg.value = ''
  try {
    const res = await axios.put('/user/profile', { name: profile.name, email: profile.email })
    if (res.data.success) {
      profileMsg.value = '✓ 个人信息已保存'
      setTimeout(() => { profileMsg.value = '' }, 3000)
    }
  } catch (e) {
    profileMsg.value = '保存失败'
  } finally {
    savingProfile.value = false
  }
}

const changePassword = async () => {
  pwMsg.value = ''
  pwError.value = false
  if (!password.old || !password.new) {
    pwMsg.value = '请填写旧密码和新密码'
    pwError.value = true
    return
  }
  changingPw.value = true
  try {
    const res = await axios.put('/user/password', { old_password: password.old, new_password: password.new })
    if (res.data.success) {
      pwMsg.value = '✓ 密码修改成功'
      password.old = ''
      password.new = ''
      setTimeout(() => { pwMsg.value = '' }, 3000)
    } else {
      pwMsg.value = res.data.message || '修改失败'
      pwError.value = true
    }
  } catch (e: any) {
    pwMsg.value = e?.response?.data?.message || '修改失败'
    pwError.value = true
  } finally {
    changingPw.value = false
  }
}

// ── Stats ───────────────────────────────────────────────────────────────────
const stats = ref<any>(null)
const statsLoading = ref(false)

const maxActivity = computed(() => {
  if (!stats.value?.recent_7days) return 1
  return Math.max(...stats.value.recent_7days.map((d: any) => d.count), 1)
})

const loadStats = async () => {
  statsLoading.value = true
  try {
    const res = await axios.get('/user/stats')
    if (res.data.success) {
      stats.value = res.data.data
    }
  } catch (e) {
    console.error('Failed to load stats', e)
  } finally {
    statsLoading.value = false
  }
}

const formatTime = (seconds: number) => {
  if (!seconds || seconds < 60) return `${Math.round(seconds)}s`
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

// ── Export ──────────────────────────────────────────────────────────────────
const exporting = ref(false)
const deleting = ref(false)
const deleteConfirmText = ref('')
const secureDelete = ref(false)

const exportData = async () => {
  exporting.value = true
  try {
    const res = await axios.get('/user/export')
    if (res.data.success) {
      const blob = new Blob([JSON.stringify(res.data.data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `rabai_export_${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
  } catch (e) {
    console.error('Failed to export data', e)
    alert('导出失败，请重试')
  } finally {
    exporting.value = false
  }
}

const deleteAllMyData = async () => {
  if (deleteConfirmText.value !== '删除') {
    alert('请在上方输入「删除」确认')
    return
  }
  if (!confirm(`确定要删除所有数据吗？${secureDelete.value ? '（安全删除，数据不可恢复）' : ''}此操作不可撤销！`)) {
    return
  }
  deleting.value = true
  try {
    // Get current username from profile
    const username = profile.name || ''
    await axios.post('/gdpr/delete', {
      confirm_username: username,
      secure_delete: secureDelete.value,
    })
    alert('数据删除请求已记录，数据将在保留期到期后自动清除')
    deleteConfirmText.value = ''
  } catch (e: any) {
    console.error('Failed to delete data', e)
    const msg = e?.response?.data?.detail || '删除失败，请重试'
    alert(typeof msg === 'string' ? msg : JSON.stringify(msg))
  } finally {
    deleting.value = false
  }
}

// ── Init ────────────────────────────────────────────────────────────────────
onMounted(async () => {
  await loadPrefs()
  await loadProfile()
  if (activeTab.value === 'stats') {
    await loadStats()
  }
})

// Watch tab changes
import { watch } from 'vue'
watch(activeTab, async (tab) => {
  if (tab === 'stats' && !stats.value) {
    await loadStats()
  }
})
</script>

<style scoped>
.settings-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px 16px;
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.back-link {
  color: var(--primary);
  text-decoration: none;
  font-size: 14px;
  margin-right: 12px;
}

.back-link:hover {
  text-decoration: underline;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
}

.settings-tabs {
  display: flex;
  gap: 4px;
  border-bottom: 2px solid var(--gray-200);
  margin-bottom: 24px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  color: var(--gray-500);
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: all 0.2s;
  border-radius: 6px 6px 0 0;
}

.tab-btn:hover {
  color: var(--primary);
  background: var(--gray-100);
}

.tab-btn.active {
  color: var(--primary);
  border-bottom-color: var(--primary);
  font-weight: 600;
}

.tab-icon {
  font-size: 16px;
}

.settings-content {
  background: var(--white);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  padding: 24px;
}

:root.dark .settings-content {
  background: var(--gray-900);
}

.tab-panel {
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--gray-200);
}

.setting-group {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid var(--gray-100);
  gap: 16px;
}

.setting-group:last-child {
  border-bottom: none;
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.label-icon {
  font-size: 20px;
  width: 36px;
  text-align: center;
}

.label-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--gray-700);
}

.label-desc {
  font-size: 12px;
  color: var(--gray-500);
  margin-top: 2px;
}

:root.dark .label-title {
  color: var(--gray-100);
}

.setting-control {
  flex-shrink: 0;
}

/* Theme options */
.theme-options {
  display: flex;
  gap: 6px;
}

.theme-opt {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 14px;
  border: 2px solid var(--gray-200);
  border-radius: var(--radius-md);
  background: none;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.theme-opt:hover {
  border-color: var(--primary);
}

.theme-opt.active {
  border-color: var(--primary);
  background: rgba(22, 93, 255, 0.08);
  color: var(--primary);
}

.opt-icon {
  font-size: 18px;
}

/* Select */
.select-input {
  padding: 8px 12px;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  background: var(--white);
  color: var(--gray-700);
  font-size: 14px;
  cursor: pointer;
}

:root.dark .select-input {
  background: var(--gray-800);
  border-color: var(--gray-200);
  color: var(--gray-100);
}

/* Toggle */
.toggle-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  cursor: pointer;
  font-size: 14px;
  color: var(--gray-700);
}

:root.dark .toggle-row {
  color: var(--gray-100);
}

.toggle-row input[type="checkbox"] {
  display: none;
}

.toggle-slider {
  position: relative;
  width: 40px;
  height: 22px;
  background: var(--gray-200);
  border-radius: 11px;
  transition: background 0.2s;
  flex-shrink: 0;
}

.toggle-slider::after {
  content: '';
  position: absolute;
  width: 18px;
  height: 18px;
  background: white;
  border-radius: 50%;
  top: 2px;
  left: 2px;
  transition: transform 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.toggle-row input:checked + .toggle-slider {
  background: var(--primary);
}

.toggle-row input:checked + .toggle-slider::after {
  transform: translateX(18px);
}

.select-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  font-size: 14px;
  color: var(--gray-700);
}

:root.dark .select-row {
  color: var(--gray-100);
}

.notification-controls {
  min-width: 220px;
}

/* Reset */
.reset-group {
  margin-top: 16px;
  padding-top: 24px;
  border-top: 1px solid var(--gray-200);
}

/* Buttons */
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-dark);
}

.btn-danger {
  background: var(--error);
  color: white;
}

.btn-danger:hover:not(:disabled) {
  opacity: 0.85;
}

.btn-outline {
  background: transparent;
  border: 1px solid var(--gray-200);
  color: var(--gray-700);
}

.btn-lg {
  padding: 12px 28px;
  font-size: 15px;
}

/* Profile form */
.profile-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 280px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-field label {
  font-size: 13px;
  font-weight: 500;
  color: var(--gray-500);
}

.input {
  padding: 10px 12px;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  font-size: 14px;
  background: var(--white);
  color: var(--gray-700);
  width: 100%;
}

.input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(22, 93, 255, 0.15);
}

:root.dark .input {
  background: var(--gray-800);
  border-color: var(--gray-200);
  color: var(--gray-100);
}

.success-msg {
  color: var(--success);
  font-size: 13px;
}

.error-msg {
  color: var(--error);
}

/* Stats */
.stats-dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}

.stat-card {
  background: var(--gray-100);
  border-radius: var(--radius-lg);
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

:root.dark .stat-card {
  background: var(--gray-800);
}

.stat-icon {
  font-size: 28px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--gray-700);
}

.stat-label {
  font-size: 12px;
  color: var(--gray-500);
  margin-top: 2px;
}

:root.dark .stat-value {
  color: var(--gray-100);
}

/* Panels */
.panel {
  background: var(--gray-100);
  border-radius: var(--radius-lg);
  padding: 16px;
}

:root.dark .panel {
  background: var(--gray-800);
}

.panel-header h3 {
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 12px;
}

/* Rank list */
.rank-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rank-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
}

.rank-num {
  width: 24px;
  height: 24px;
  background: var(--primary);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

.rank-name {
  flex: 1;
  color: var(--gray-700);
  font-weight: 500;
}

.rank-count {
  color: var(--gray-500);
  font-size: 13px;
}

:root.dark .rank-name {
  color: var(--gray-100);
}

/* Activity bars */
.activity-bars {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.activity-bar-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}

.day-label {
  width: 50px;
  color: var(--gray-500);
  flex-shrink: 0;
}

.bar-track {
  flex: 1;
  height: 8px;
  background: var(--gray-200);
  border-radius: 4px;
  overflow: hidden;
}

:root.dark .bar-track {
  background: var(--gray-700);
}

.bar-fill {
  height: 100%;
  background: var(--primary);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.day-count {
  width: 24px;
  text-align: right;
  color: var(--gray-500);
  font-size: 12px;
}

/* Export info */
.export-info {
  margin-top: 24px;
  padding: 16px;
  background: var(--gray-100);
  border-radius: var(--radius-lg);
}

:root.dark .export-info {
  background: var(--gray-800);
}

.export-info h3 {
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 12px;
}

.export-info ul {
  list-style: none;
  padding: 0;
  margin: 0 0 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.export-info li {
  font-size: 14px;
  color: var(--gray-700);
}

:root.dark .export-info li {
  color: var(--gray-100);
}

.export-note {
  font-size: 12px;
  color: var(--gray-500);
  margin: 0;
}

/* GDPR Delete Zone */
.danger-zone {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 2px dashed #ef4444;
}

.danger-title {
  color: #ef4444 !important;
}

.danger-group {
  border-color: #fca5a5;
  background: #fff5f5;
}

.secure-delete-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #666;
  margin-bottom: 12px;
  cursor: pointer;
}

.secure-delete-toggle input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.delete-confirm-row {
  margin-top: 12px;
}

.danger-note {
  font-size: 12px;
  color: #ef4444;
  margin: 8px 0 0 0;
}

/* Loading */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  gap: 12px;
  color: var(--gray-500);
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--gray-200);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: var(--gray-500);
}

/* Performance Tab */
.startup-metrics {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.startup-metric {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--gray-100);
  border-radius: 6px;
}

:root.dark .startup-metric {
  background: var(--gray-700);
}

.startup-label {
  font-size: 13px;
  color: var(--gray-600);
}

:root.dark .startup-label {
  color: var(--gray-400);
}

.startup-value {
  font-size: 14px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--primary);
}

.fps-good { color: #34C759; }
.fps-warning { color: #FF9500; }
.fps-poor { color: #FF3B30; }

.memory-good { color: #34C759; }
.memory-warning { color: #FF9500; }
.memory-poor { color: #FF3B30; }

.stat-card .stat-value.good { color: #34C759; }
.stat-card .stat-value.warning { color: #FF9500; }
.stat-card .stat-value.poor { color: #FF3B30; }
</style>
