<template>
  <div v-if="show" class="modal-mask" @click.self="$emit('close')">
    <div class="share-panel">
      <!-- Header -->
      <div class="panel-header">
        <h3>🔗 分享与物理触发</h3>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <!-- Tab Navigation -->
      <div class="tab-nav">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="tab-btn"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ tab.icon }} {{ tab.label }}
        </button>
      </div>

      <div class="panel-body">
        <!-- Loading -->
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>加载中...</p>
        </div>

        <!-- ==================== Tab: QR Code ==================== -->
        <div v-else-if="activeTab === 'qr'" class="tab-content">
          <div class="section-title">📱 二维码分享</div>

          <!-- URL Input -->
          <div class="form-item">
            <label>分享链接</label>
            <input :value="shareUrl" class="form-input" readonly />
          </div>

          <!-- Short URL Section -->
          <div class="short-url-section">
            <div class="form-item">
              <label>短链接</label>
              <div class="short-url-row">
                <input v-model="shortUrlResult" class="form-input" readonly />
                <button class="btn btn-sm btn-primary" @click="createShortUrl" :disabled="shortUrlLoading">
                  {{ shortUrlResult ? '刷新' : '生成短链接' }}
                </button>
              </div>
            </div>
          </div>

          <!-- QR Code Display -->
          <div class="qr-display">
            <div v-if="qrLoading" class="qr-loading">
              <div class="spinner small"></div>
            </div>
            <img
              v-else-if="qrDataUrl"
              :src="qrDataUrl"
              alt="QR Code"
              class="qr-image"
            />
            <div v-else class="qr-placeholder">
              <span>点击"生成二维码"获取</span>
            </div>
          </div>

          <!-- QR Actions -->
          <div class="qr-actions">
            <button class="btn btn-outline" @click="downloadQR">
              ⬇️ 下载二维码
            </button>
            <button class="btn btn-outline" @click="copyShortUrl">
              📋 复制短链接
            </button>
          </div>

          <!-- QR Analytics -->
          <div v-if="shortCode && qrAnalytics" class="qr-analytics">
            <div class="section-title">📊 扫码统计</div>
            <div class="analytics-grid">
              <div class="stat-mini">
                <span class="stat-val">{{ qrAnalytics.qr_scans || 0 }}</span>
                <span class="stat-lbl">扫码次数</span>
              </div>
              <div class="stat-mini">
                <span class="stat-val">{{ qrAnalytics.nfc_taps || 0 }}</span>
                <span class="stat-lbl">NFC触碰</span>
              </div>
              <div class="stat-mini">
                <span class="stat-val">{{ qrAnalytics.beacon_triggers || 0 }}</span>
                <span class="stat-lbl">信标触发</span>
              </div>
              <div class="stat-mini">
                <span class="stat-val">{{ qrAnalytics.total_accesses || 0 }}</span>
                <span class="stat-lbl">总访问</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ==================== Tab: NFC ==================== -->
        <div v-else-if="activeTab === 'nfc'" class="tab-content">
          <div class="section-title">🏷️ NFC标签写入</div>

          <div v-if="!nfcSupported" class="nfc-not-supported">
            <div class="nfc-icon">📡</div>
            <p>您的浏览器不支持 Web NFC</p>
            <p class="nfc-hint">请使用 Chrome for Android 或 Safari (iOS 13+)</p>
          </div>

          <template v-else>
            <div class="nfc-info">
              <p>📋 将手机靠近NFC标签，即可自动打开此演示文稿</p>
            </div>

            <!-- NFC Data Preview -->
            <div class="nfc-preview">
              <div class="nfc-preview-label">写入内容</div>
              <div class="nfc-preview-url">{{ nfcWriteUrl || shareUrl }}</div>
              <div class="nfc-preview-short" v-if="shortCode">
                短码: <code>{{ shortCode }}</code>
              </div>
            </div>

            <!-- NFC Write Button -->
            <div class="nfc-write-section">
              <button
                class="btn btn-primary btn-lg nfc-write-btn"
                @click="writeNFCTag"
                :disabled="nfcWriting"
              >
                <span v-if="nfcWriting">⏳ 等待触碰...</span>
                <span v-else-if="nfcSuccess">✅ 写入成功!</span>
                <span v-else>🏷️ 写入NFC标签</span>
              </button>
              <p class="nfc-hint-text">将手机背面上方贴近NFC标签</p>
            </div>

            <div v-if="nfcSuccess" class="nfc-success-msg">
              <span>✅ NFC标签写入成功! 下次触碰标签即可打开PPT。</span>
            </div>

            <!-- Record NFC tap when sharing via NFC -->
            <div class="form-item" style="margin-top: 16px;">
              <label class="toggle-label">
                <input type="checkbox" v-model="recordNFCTap" class="toggle-checkbox" />
                <span>触碰后记录分析数据</span>
              </label>
            </div>
          </template>
        </div>

        <!-- ==================== Tab: Bluetooth Beacon ==================== -->
        <div v-else-if="activeTab === 'beacon'" class="tab-content">
          <div class="section-title">📡 蓝牙信标配置</div>

          <div v-if="!bluetoothSupported" class="beacon-not-supported">
            <div class="beacon-icon">📡</div>
            <p>您的浏览器不支持 Web Bluetooth</p>
            <p class="beacon-hint">请使用 Chrome (Desktop/Android)</p>
          </div>

          <template v-else>
            <!-- Existing Beacons -->
            <div class="beacon-list" v-if="beacons.length > 0">
              <div class="section-sub-title">已配置的信标</div>
              <div
                v-for="beacon in beacons"
                :key="beacon.beacon_id"
                class="beacon-item"
              >
                <div class="beacon-info">
                  <div class="beacon-name">{{ beacon.name }}</div>
                  <div class="beacon-uuid">UUID: {{ beacon.uuid }}</div>
                  <div class="beacon-stats">
                    <span>触发 {{ beacon.trigger_count || 0 }} 次</span>
                    <span :class="['beacon-status', beacon.active ? 'active' : 'inactive']">
                      {{ beacon.active ? '🟢 活跃' : '🔴 停用' }}
                    </span>
                  </div>
                </div>
                <div class="beacon-actions">
                  <button class="btn btn-sm" @click="toggleBeacon(beacon)">
                    {{ beacon.active ? '停用' : '启用' }}
                  </button>
                  <button class="btn btn-sm btn-danger" @click="deleteBeacon(beacon.beacon_id)">
                    删除
                  </button>
                </div>
              </div>
            </div>

            <!-- Create New Beacon -->
            <div class="create-beacon-section">
              <div class="section-sub-title">创建新信标</div>

              <div class="form-item">
                <label>信标名称</label>
                <input v-model="newBeacon.name" class="form-input" placeholder="如: 会议室入口" />
              </div>

              <div class="form-row">
                <div class="form-item">
                  <label>Major</label>
                  <input v-model.number="newBeacon.major" type="number" class="form-input" min="1" max="65535" />
                </div>
                <div class="form-item">
                  <label>Minor</label>
                  <input v-model.number="newBeacon.minor" type="number" class="form-input" min="1" max="65535" />
                </div>
              </div>

              <div class="form-item">
                <label>UUID</label>
                <input v-model="newBeacon.uuid" class="form-input" placeholder="iBeacon UUID (自动生成)" />
              </div>

              <div class="form-item">
                <label>触发URL</label>
                <input v-model="newBeacon.url" class="form-input" :placeholder="shareUrl" />
              </div>

              <button class="btn btn-primary" @click="createBeacon" :disabled="beaconCreating">
                {{ beaconCreating ? '创建中...' : '➕ 创建信标' }}
              </button>
            </div>

            <!-- Beacon Broadcast -->
            <div class="beacon-broadcast-section">
              <div class="section-sub-title">🔊 广播信标 (测试)</div>
              <p class="beacon-hint">使用 Web Bluetooth 广播 iBeacon 格式信标</p>
              <button
                class="btn btn-outline btn-lg"
                @click="startBeaconBroadcast"
                :disabled="broadcasting"
              >
                {{ broadcasting ? '⏳ 广播中...' : '📡 开始广播' }}
              </button>
              <button
                v-if="broadcasting"
                class="btn btn-danger btn-lg"
                @click="stopBeaconBroadcast"
              >
                ⏹ 停止广播
              </button>
            </div>
          </template>
        </div>

        <!-- ==================== Tab: URL Shortener ==================== -->
        <div v-else-if="activeTab === 'shortener'" class="tab-content">
          <div class="section-title">🔗 短链接管理</div>

          <div v-if="shortUrls.length === 0 && !loading" class="empty-state">
            <p>暂无短链接</p>
          </div>

          <div v-else class="short-url-list">
            <div
              v-for="su in shortUrls"
              :key="su.short_code"
              class="short-url-item"
            >
              <div class="su-info">
                <div class="su-url">{{ su.short_url }}</div>
                <div class="su-original">{{ su.original_url.substring(0, 50) }}...</div>
                <div class="su-stats">
                  <span>扫码 {{ su.qr_scans || 0 }}</span>
                  <span>NFC {{ su.nfc_taps || 0 }}</span>
                  <span>信标 {{ su.beacon_triggers || 0 }}</span>
                  <span>访问 {{ su.total_accesses || 0 }}</span>
                </div>
              </div>
              <div class="su-actions">
                <button class="btn btn-sm" @click="copyText(su.short_url)">复制</button>
                <button class="btn btn-sm btn-danger" @click="deleteShortUrl(su.short_code)">删除</button>
              </div>
            </div>
          </div>

          <!-- Create Short URL -->
          <div class="create-short-section">
            <div class="section-sub-title">生成新短链接</div>
            <div class="form-item">
              <label>原始URL</label>
              <input v-model="newShortUrl" class="form-input" placeholder="https://..." />
            </div>
            <button class="btn btn-primary" @click="createShortUrlManual" :disabled="!newShortUrl">
              生成短链接
            </button>
          </div>
        </div>

        <!-- ==================== Tab: Analytics ==================== -->
        <div v-else-if="activeTab === 'analytics'" class="tab-content">
          <div class="section-title">📊 分享数据分析</div>

          <div v-if="shortUrls.length === 0" class="empty-state">
            <p>先生成短链接后查看分析数据</p>
          </div>

          <template v-else>
            <!-- Overall Stats -->
            <div class="analytics-overview">
              <div class="analytics-kpi">
                <div class="kpi-val">{{ totalQRScans }}</div>
                <div class="kpi-lbl">二维码扫描</div>
              </div>
              <div class="analytics-kpi">
                <div class="kpi-val">{{ totalNFCTaps }}</div>
                <div class="kpi-lbl">NFC触碰</div>
              </div>
              <div class="analytics-kpi">
                <div class="kpi-val">{{ totalBeaconTriggers }}</div>
                <div class="kpi-lbl">信标触发</div>
              </div>
              <div class="analytics-kpi">
                <div class="kpi-val">{{ totalAccesses }}</div>
                <div class="kpi-lbl">总访问</div>
              </div>
            </div>

            <!-- Per-URL breakdown -->
            <div class="analytics-breakdown">
              <div class="section-sub-title">各链接详情</div>
              <div
                v-for="su in shortUrls"
                :key="su.short_code"
                class="analytics-row"
              >
                <div class="ar-url">{{ su.short_url }}</div>
                <div class="ar-bars">
                  <div class="ar-bar-group">
                    <div class="ar-bar-label">扫码</div>
                    <div class="ar-bar">
                      <div class="ar-bar-fill" :style="{ width: barWidth(su.qr_scans) + '%', background: '#165DFF' }"></div>
                    </div>
                    <div class="ar-bar-val">{{ su.qr_scans || 0 }}</div>
                  </div>
                  <div class="ar-bar-group">
                    <div class="ar-bar-label">NFC</div>
                    <div class="ar-bar">
                      <div class="ar-bar-fill" :style="{ width: barWidth(su.nfc_taps) + '%', background: '#00C850' }"></div>
                    </div>
                    <div class="ar-bar-val">{{ su.nfc_taps || 0 }}</div>
                  </div>
                  <div class="ar-bar-group">
                    <div class="ar-bar-label">信标</div>
                    <div class="ar-bar">
                      <div class="ar-bar-fill" :style="{ width: barWidth(su.beacon_triggers) + '%', background: '#FF9500' }"></div>
                    </div>
                    <div class="ar-bar-val">{{ su.beacon_triggers || 0 }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Physical Access Funnel -->
            <div class="access-funnel">
              <div class="section-sub-title">物理访问漏斗</div>
              <div class="funnel-steps">
                <div class="funnel-step">
                  <div class="funnel-icon">📱</div>
                  <div class="funnel-count">{{ totalQRScans }}</div>
                  <div class="funnel-label">扫码</div>
                </div>
                <div class="funnel-arrow">→</div>
                <div class="funnel-step">
                  <div class="funnel-icon">🏷️</div>
                  <div class="funnel-count">{{ totalNFCTaps }}</div>
                  <div class="funnel-label">NFC触碰</div>
                </div>
                <div class="funnel-arrow">→</div>
                <div class="funnel-step">
                  <div class="funnel-icon">📡</div>
                  <div class="funnel-count">{{ totalBeaconTriggers }}</div>
                  <div class="funnel-label">信标触发</div>
                </div>
                <div class="funnel-arrow">→</div>
                <div class="funnel-step highlight">
                  <div class="funnel-icon">🎯</div>
                  <div class="funnel-count">{{ totalAccesses }}</div>
                  <div class="funnel-label">访问</div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import api from '../api/client'

const props = defineProps<{
  show: boolean
  taskId: string
  pptId?: string
  shareUrl?: string
  title?: string
}>()

const emit = defineEmits(['close'])

// State
const activeTab = ref('qr')
const loading = ref(false)
const shortUrlLoading = ref(false)
const qrLoading = ref(false)
const qrDataUrl = ref('')
const shortCode = ref('')
const shortUrlResult = ref('')
const qrAnalytics = ref<any>(null)

// NFC state
const nfcSupported = ref('NDEFReader' in window)
const nfcWriting = ref(false)
const nfcSuccess = ref(false)
const recordNFCTap = ref(true)
const nfcWriteUrl = ref('')

// Beacon state
const bluetoothSupported = ref('bluetooth' in navigator)
const beacons = ref<any[]>([])
const beaconCreating = ref(false)
const broadcasting = ref(false)
let broadcastController: any = null

const newBeacon = ref({
  name: '',
  uuid: '',
  major: 1,
  minor: 1,
  url: '',
})

// Short URL state
const shortUrls = ref<any[]>([])
const newShortUrl = ref('')

const tabs = [
  { id: 'qr', label: '二维码', icon: '📱' },
  { id: 'nfc', label: 'NFC标签', icon: '🏷️' },
  { id: 'beacon', label: '蓝牙信标', icon: '📡' },
  { id: 'shortener', label: '短链接', icon: '🔗' },
  { id: 'analytics', label: '数据分析', icon: '📊' },
]

// Computed
const effectiveShareUrl = computed(() => props.shareUrl || `${window.location.origin}/result?taskId=${props.taskId}`)

const totalQRScans = computed(() => shortUrls.value.reduce((a, b) => a + (b.qr_scans || 0), 0))
const totalNFCTaps = computed(() => shortUrls.value.reduce((a, b) => a + (b.nfc_taps || 0), 0))
const totalBeaconTriggers = computed(() => shortUrls.value.reduce((a, b) => a + (b.beacon_triggers || 0), 0))
const totalAccesses = computed(() => shortUrls.value.reduce((a, b) => a + (b.total_accesses || 0), 0))

const maxStat = computed(() => Math.max(totalQRScans.value, totalNFCTaps.value, totalBeaconTriggers.value, 1))

const barWidth = (val: number) => {
  return maxStat.value > 0 ? Math.round((val / maxStat.value) * 100) : 0
}

// Watch show to load data
watch(() => props.show, (val) => {
  if (val) {
    activeTab.value = 'qr'
    loadShortUrls()
    loadBeacons()
  }
})

// Actions
const loadShortUrls = async () => {
  try {
    loading.value = true
    const res = await api.shareEnhancements.listShortUrls()
    if (res.data.success) {
      shortUrls.value = res.data.short_urls || []
      // Auto-select the first short URL for current PPT
      const current = shortUrls.value.find(s => s.original_url?.includes(props.taskId))
      if (current) {
        shortCode.value = current.short_code
        shortUrlResult.value = current.short_url
        await loadQRAnalytics()
      }
    }
  } catch (e) {
    console.warn('Load short URLs failed:', e)
  } finally {
    loading.value = false
  }
}

const loadQRAnalytics = async () => {
  if (!shortCode.value) return
  try {
    const res = await api.shareEnhancements.getShortUrlAnalytics(shortCode.value)
    if (res.data.success) {
      qrAnalytics.value = res.data
    }
  } catch (e) {
    console.warn('Load QR analytics failed:', e)
  }
}

const createShortUrl = async () => {
  try {
    shortUrlLoading.value = true
    qrLoading.value = true
    const res = await api.shareEnhancements.createShortUrl({
      original_url: effectiveShareUrl.value,
      ppt_id: props.pptId || props.taskId,
      title: props.title || 'RabAi Mind PPT',
    })
    if (res.data.success) {
      shortCode.value = res.data.short_code
      shortUrlResult.value = res.data.short_url
      qrDataUrl.value = generateQRUrl(res.data.short_url)
      await loadShortUrls()
      await loadQRAnalytics()
    }
  } catch (e) {
    console.error('Create short URL failed:', e)
    // Fallback: generate QR with original URL
    qrDataUrl.value = generateQRUrl(effectiveShareUrl.value)
  } finally {
    shortUrlLoading.value = false
    qrLoading.value = false
  }
}

const generateQRUrl = (url: string) => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(url)}`
}

const downloadQR = () => {
  const url = qrDataUrl.value || generateQRUrl(shortUrlResult.value || effectiveShareUrl.value)
  const a = document.createElement('a')
  a.href = url
  a.download = `rabai-share-${shortCode.value || 'qr'}.png`
  a.click()
}

const copyShortUrl = async () => {
  const url = shortUrlResult.value || effectiveShareUrl.value
  await copyText(url)
  alert('短链接已复制!')
}

const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const input = document.createElement('input')
    input.value = text
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)
  }
}

// NFC Writing
const writeNFCTag = async () => {
  if (!nfcSupported.value) return
  try {
    nfcWriting.value = true
    nfcSuccess.value = false
    const ndef = new (window as any).NDEFReader()
    const writeUrl = shortUrlResult.value || effectiveShareUrl.value
    nfcWriteUrl.value = writeUrl
    await ndef.write(writeUrl, { recordType: 'url' })
    nfcSuccess.value = true
    // Record NFC tap
    if (recordNFCTap.value && shortCode.value) {
      await api.shareEnhancements.recordNFCTap(shortCode.value)
      await loadQRAnalytics()
    }
  } catch (e: any) {
    console.error('NFC write failed:', e)
    alert('NFC写入失败: ' + (e.message || '请确保贴近NFC标签'))
  } finally {
    nfcWriting.value = false
  }
}

// Beacon Management
const loadBeacons = async () => {
  try {
    const res = await api.shareEnhancements.listBeacons(props.pptId || props.taskId)
    if (res.data.success) {
      beacons.value = res.data.beacons || []
    }
  } catch (e) {
    console.warn('Load beacons failed:', e)
  }
}

const createBeacon = async () => {
  if (!newBeacon.value.name) {
    alert('请输入信标名称')
    return
  }
  try {
    beaconCreating.value = true
    const res = await api.shareEnhancements.createBeacon({
      ppt_id: props.pptId || props.taskId,
      name: newBeacon.value.name,
      uuid: newBeacon.value.uuid || undefined,
      major: newBeacon.value.major,
      minor: newBeacon.value.minor,
      url: newBeacon.value.url || effectiveShareUrl.value,
    })
    if (res.data.success) {
      beacons.value.push(res.data.beacon)
      newBeacon.value = { name: '', uuid: '', major: 1, minor: 1, url: '' }
      await loadShortUrls()
    }
  } catch (e) {
    console.error('Create beacon failed:', e)
  } finally {
    beaconCreating.value = false
  }
}

const toggleBeacon = async (beacon: any) => {
  try {
    await api.shareEnhancements.updateBeacon(beacon.beacon_id, { active: !beacon.active })
    beacon.active = !beacon.active
  } catch (e) {
    console.error('Toggle beacon failed:', e)
  }
}

const deleteBeacon = async (beaconId: string) => {
  if (!confirm('确定删除此信标?')) return
  try {
    await api.shareEnhancements.deleteBeacon(beaconId)
    beacons.value = beacons.value.filter(b => b.beacon_id !== beaconId)
  } catch (e) {
    console.error('Delete beacon failed:', e)
  }
}

const startBeaconBroadcast = async () => {
  if (!bluetoothSupported.value) return
  try {
    broadcasting.value = true
    // Web Bluetooth iBeacon broadcast simulation
    // Note: Full iBeacon broadcast requires native implementation
    // This is a simulation using the Web Bluetooth API
    const device = await (navigator as any).bluetooth.requestDevice({
      filters: [{ services: ['0000fff0-0000-1000-8000-00805f9b34fb'] }],
      optionalServices: ['0000fff0-0000-1000-8000-00805f9b34fb'],
    })
    if (!device) {
      broadcasting.value = false
      return
    }
    const server = await device.gatt?.connect()
    if (!server) {
      broadcasting.value = false
      return
    }
    // Show success - in production, you'd use a native bridge for actual beacon advertising
    alert('📡 蓝牙信标广播已启动 (模拟模式)\n在生产环境中需要原生应用支持实际的 iBeacon 广播。')
    broadcasting.value = false
  } catch (e: any) {
    broadcasting.value = false
    if (e.name !== 'NotFoundError') {
      console.error('Beacon broadcast failed:', e)
    }
  }
}

const stopBeaconBroadcast = () => {
  broadcasting.value = false
  if (broadcastController) {
    broadcastController.abort()
    broadcastController = null
  }
}

// Short URL Management
const createShortUrlManual = async () => {
  if (!newShortUrl.value) return
  try {
    shortUrlLoading.value = true
    const res = await api.shareEnhancements.createShortUrl({
      original_url: newShortUrl.value,
      ppt_id: props.pptId || props.taskId,
      title: props.title || '',
    })
    if (res.data.success) {
      shortUrls.value.push(res.data)
      newShortUrl.value = ''
    }
  } catch (e) {
    console.error('Create short URL failed:', e)
  } finally {
    shortUrlLoading.value = false
  }
}

const deleteShortUrl = async (shortCode: string) => {
  if (!confirm('确定删除此短链接?')) return
  try {
    await api.shareEnhancements.deleteShortUrl(shortCode)
    shortUrls.value = shortUrls.value.filter(s => s.short_code !== shortCode)
  } catch (e) {
    console.error('Delete short URL failed:', e)
  }
}
</script>

<style scoped>
.share-panel {
  background: #1a1a2e;
  border-radius: 16px;
  width: 480px;
  max-width: 95vw;
  max-height: 85vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  color: #e8e8f0;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: #888;
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
}

.tab-nav {
  display: flex;
  padding: 8px 12px;
  gap: 4px;
  overflow-x: auto;
  background: rgba(0,0,0,0.2);
}

.tab-btn {
  padding: 6px 12px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #999;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.tab-btn.active {
  background: #165DFF;
  color: #fff;
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px;
  color: #888;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255,255,255,0.1);
  border-top-color: #165DFF;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner.small {
  width: 20px;
  height: 20px;
  border-width: 2px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 4px;
}

.section-sub-title {
  font-size: 13px;
  font-weight: 600;
  color: #aaa;
  margin-bottom: 8px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-item label {
  font-size: 12px;
  color: #aaa;
}

.form-input {
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 8px;
  padding: 8px 12px;
  color: #e8e8f0;
  font-size: 13px;
  width: 100%;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #165DFF;
}

.form-textarea {
  resize: vertical;
  min-height: 60px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.btn {
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.btn-sm {
  padding: 5px 10px;
  font-size: 12px;
}

.btn-lg {
  padding: 12px 20px;
  font-size: 14px;
}

.btn-primary {
  background: #165DFF;
  color: #fff;
}

.btn-primary:hover {
  background: #0e4dd8;
}

.btn-primary:disabled {
  background: #3a5a9a;
  cursor: not-allowed;
}

.btn-outline {
  background: transparent;
  border: 1px solid rgba(255,255,255,0.2);
  color: #e8e8f0;
}

.btn-outline:hover {
  background: rgba(255,255,255,0.05);
}

.btn-danger {
  background: #d93025;
  color: #fff;
}

.btn-danger:hover {
  background: #b71c1c;
}

/* Short URL */
.short-url-row {
  display: flex;
  gap: 8px;
}

.short-url-row .form-input {
  flex: 1;
}

/* QR Code */
.qr-display {
  display: flex;
  justify-content: center;
  padding: 16px;
  background: #fff;
  border-radius: 12px;
}

.qr-image {
  width: 200px;
  height: 200px;
}

.qr-placeholder {
  width: 200px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-radius: 8px;
  color: #999;
  font-size: 13px;
}

.qr-loading {
  width: 200px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-radius: 8px;
}

.qr-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

/* QR Analytics */
.qr-analytics {
  background: rgba(255,255,255,0.05);
  border-radius: 12px;
  padding: 12px;
}

.analytics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.stat-mini {
  background: rgba(255,255,255,0.08);
  border-radius: 8px;
  padding: 8px 4px;
  text-align: center;
}

.stat-val {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
}

.stat-lbl {
  display: block;
  font-size: 10px;
  color: #888;
  margin-top: 2px;
}

/* NFC */
.nfc-not-supported {
  text-align: center;
  padding: 32px;
  color: #888;
}

.nfc-icon, .beacon-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.nfc-hint, .beacon-hint {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.nfc-preview {
  background: rgba(255,255,255,0.05);
  border-radius: 8px;
  padding: 12px;
}

.nfc-preview-label {
  font-size: 11px;
  color: #888;
  margin-bottom: 4px;
}

.nfc-preview-url {
  font-size: 13px;
  color: #165DFF;
  word-break: break-all;
}

.nfc-preview-short code {
  font-size: 12px;
  color: #00C850;
  background: rgba(0,200,80,0.1);
  padding: 2px 6px;
  border-radius: 4px;
}

.nfc-write-section {
  text-align: center;
  padding: 16px 0;
}

.nfc-write-btn {
  width: 100%;
  max-width: 280px;
}

.nfc-hint-text {
  font-size: 12px;
  color: #666;
  margin-top: 8px;
}

.nfc-success-msg {
  background: rgba(0,200,80,0.15);
  border: 1px solid rgba(0,200,80,0.3);
  border-radius: 8px;
  padding: 10px;
  text-align: center;
  font-size: 13px;
  color: #00C850;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  cursor: pointer;
}

.toggle-checkbox {
  width: 16px;
  height: 16px;
}

/* Beacon */
.beacon-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.beacon-item {
  background: rgba(255,255,255,0.05);
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.beacon-name {
  font-size: 13px;
  font-weight: 600;
  color: #fff;
}

.beacon-uuid {
  font-size: 10px;
  color: #666;
  margin-top: 2px;
}

.beacon-stats {
  display: flex;
  gap: 8px;
  margin-top: 4px;
  font-size: 11px;
  color: #888;
}

.beacon-status.active { color: #00C850; }
.beacon-status.inactive { color: #d93025; }

.beacon-actions {
  display: flex;
  gap: 4px;
}

.create-beacon-section, .beacon-broadcast-section {
  background: rgba(255,255,255,0.05);
  border-radius: 8px;
  padding: 12px;
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.beacon-not-supported {
  text-align: center;
  padding: 32px;
  color: #888;
}

/* Short URL List */
.short-url-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.short-url-item {
  background: rgba(255,255,255,0.05);
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.su-url {
  font-size: 13px;
  font-weight: 600;
  color: #165DFF;
}

.su-original {
  font-size: 11px;
  color: #666;
  margin-top: 2px;
}

.su-stats {
  display: flex;
  gap: 8px;
  margin-top: 4px;
  font-size: 11px;
  color: #888;
}

.su-actions {
  display: flex;
  gap: 4px;
}

.create-short-section {
  background: rgba(255,255,255,0.05);
  border-radius: 8px;
  padding: 12px;
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Analytics */
.analytics-overview {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.analytics-kpi {
  background: rgba(255,255,255,0.05);
  border-radius: 8px;
  padding: 12px 8px;
  text-align: center;
}

.kpi-val {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
}

.kpi-lbl {
  font-size: 10px;
  color: #888;
  margin-top: 2px;
}

.analytics-breakdown {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.analytics-row {
  background: rgba(255,255,255,0.05);
  border-radius: 8px;
  padding: 10px 12px;
}

.ar-url {
  font-size: 12px;
  color: #165DFF;
  margin-bottom: 8px;
  word-break: break-all;
}

.ar-bars {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ar-bar-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ar-bar-label {
  font-size: 10px;
  color: #888;
  width: 24px;
}

.ar-bar {
  flex: 1;
  height: 6px;
  background: rgba(255,255,255,0.1);
  border-radius: 3px;
  overflow: hidden;
}

.ar-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}

.ar-bar-val {
  font-size: 10px;
  color: #aaa;
  width: 20px;
  text-align: right;
}

.access-funnel {
  background: rgba(255,255,255,0.05);
  border-radius: 8px;
  padding: 12px;
  margin-top: 8px;
}

.funnel-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

.funnel-step {
  text-align: center;
  padding: 8px;
  background: rgba(255,255,255,0.05);
  border-radius: 8px;
  min-width: 70px;
}

.funnel-step.highlight {
  background: rgba(22, 93, 255, 0.2);
  border: 1px solid rgba(22, 93, 255, 0.4);
}

.funnel-icon {
  font-size: 20px;
}

.funnel-count {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
}

.funnel-label {
  font-size: 10px;
  color: #888;
  margin-top: 2px;
}

.funnel-arrow {
  color: #555;
  font-size: 18px;
}

.empty-state {
  text-align: center;
  padding: 32px;
  color: #666;
}
</style>
