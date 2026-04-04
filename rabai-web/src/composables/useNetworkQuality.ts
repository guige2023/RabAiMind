/**
 * useNetworkQuality - Network connection quality detection and adaptive quality management
 * Uses Network Information API (where available) and active probing for quality decisions
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'

export type NetworkQuality = 'unknown' | 'slow-2g' | '2g' | '3g' | '4g' | 'wifi' | 'ethernet'

export interface NetworkQualityState {
  quality: NetworkQuality
  downlink: number         // Mbps (effective bandwidth)
  rtt: number             // ms (round-trip time)
  saveData: boolean       // user reduced data usage preference
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g' | 'unknown'
  online: boolean
  qualityLevel: number    // 0-3: 0=low, 1=medium, 2=high, 3=ultra
}

// Singleton state
const networkState = ref<NetworkQualityState>({
  quality: 'unknown',
  downlink: 0,
  rtt: 0,
  saveData: false,
  effectiveType: 'unknown',
  online: typeof navigator !== 'undefined' ? navigator.onLine : true,
  qualityLevel: 2  // default to high
})

let probeInterval: ReturnType<typeof setInterval> | null = null
let lastProbeTime = 0
let latencyHistory: number[] = []

// Active latency probe using a small fetch
async function probeLatency(): Promise<number> {
  const testUrls = [
    '/api/v1/status',
    '/favicon.ico'
  ]
  
  for (const url of testUrls) {
    try {
      const start = performance.now()
      await fetch(url + (url.includes('?') ? '&' : '?') + '_t=' + Date.now(), {
        method: 'HEAD',
        cache: 'no-store',
        mode: 'no-cors'
      })
      const end = performance.now()
      return Math.round(end - start)
    } catch {
      continue
    }
  }
  return -1
}

function updateQualityLevel(state: Partial<NetworkQualityState>) {
  const { effectiveType, downlink, rtt, saveData } = { ...networkState.value, ...state }
  
  let level = 3 // ultra
  
  if (saveData) {
    level = 0 // minimal
  } else if (effectiveType === 'slow-2g' || effectiveType === '2g') {
    level = 0
  } else if (effectiveType === '3g') {
    level = 1 // medium
  } else if (effectiveType === '4g') {
    if (downlink < 2) level = 1
    else if (downlink < 5) level = 2
    else level = 3
  } else {
    // wifi/ethernet
    if (downlink < 5) level = 2
    else level = 3
  }
  
  // Adjust based on latency
  if (rtt > 500) level = Math.min(level, 1)
  else if (rtt > 200) level = Math.min(level, 2)
  
  // Running average of latency
  if (latencyHistory.length > 5) latencyHistory.shift()
  
  networkState.value.qualityLevel = level
  return level
}

function initNetworkInfoAPI() {
  const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
  if (!conn) return

  const updateFromConnection = () => {
    const newState: Partial<NetworkQualityState> = {
      downlink: conn.downlink || 0,
      rtt: conn.rtt || 0,
      saveData: conn.saveData || false,
      effectiveType: conn.effectiveType || 'unknown',
      quality: mapEffectiveType(conn.effectiveType)
    }
    Object.assign(networkState.value, newState)
    updateQualityLevel(newState)
  }

  updateFromConnection()

  conn.addEventListener('change', updateFromConnection)
}

function mapEffectiveType(type: string): NetworkQuality {
  const map: Record<string, NetworkQuality> = {
    'slow-2g': 'slow-2g',
    '2g': '2g',
    '3g': '3g',
    '4g': '4g'
  }
  return map[type] || 'wifi'
}

function handleOnline() {
  networkState.value.online = true
  // Re-probe quality
  doActiveProbe()
}

function handleOffline() {
  networkState.value.online = false
  networkState.value.qualityLevel = 0
}

async function doActiveProbe() {
  if (lastProbeTime && Date.now() - lastProbeTime < 5000) return
  lastProbeTime = Date.now()
  
  const latency = await probeLatency()
  if (latency > 0) {
    latencyHistory.push(latency)
    const avgLatency = latencyHistory.reduce((a, b) => a + b, 0) / latencyHistory.length
    networkState.value.rtt = Math.round(avgLatency)
    updateQualityLevel({ rtt: Math.round(avgLatency) })
  }
}

export function useNetworkQuality() {
  const init = () => {
    initNetworkInfoAPI()
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Initial probe
    doActiveProbe()
    
    // Periodic probe every 30s
    probeInterval = setInterval(doActiveProbe, 30000)
  }

  const destroy = () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
    if (probeInterval) {
      clearInterval(probeInterval)
      probeInterval = null
    }
  }

  const forceProbe = async () => {
    await doActiveProbe()
  }

  // Quality level descriptions for UI
  const qualityLabel = computed(() => {
    const labels: Record<number, string> = {
      0: '省流模式',
      1: '标准',
      2: '高清',
      3: '超清'
    }
    return labels[networkState.value.qualityLevel] || '自动'
  })

  // Recommended settings based on quality
  const recommendedSettings = computed(() => {
    const level = networkState.value.qualityLevel
    
    return {
      // Preview image quality (0-100)
      previewQuality: level >= 3 ? 90 : level >= 2 ? 70 : level >= 1 ? 50 : 30,
      // Export quality
      exportQuality: level >= 3 ? 'ultra' : level >= 2 ? 'high' : level >= 1 ? 'medium' : 'low',
      // Animation speed
      animationsEnabled: level >= 1,
      // 3D transitions
      transitions3D: level >= 2,
      // Auto-save interval (ms) - faster on good networks
      autoSaveInterval: level >= 2 ? 60000 : 120000,
      // Thumbnail size
      thumbnailSize: level >= 2 ? 'large' : 'small',
      // Lazy loading threshold
      lazyLoadThreshold: level >= 2 ? 6 : 3,
      // Video recording quality
      recordingQuality: level >= 2 ? '1080p' : '720p',
      // WebGL effects
      webglEnabled: level >= 2,
    }
  })

  return {
    networkState,
    qualityLabel,
    recommendedSettings,
    init,
    destroy,
    forceProbe,
    updateQualityLevel: (state: Partial<NetworkQualityState>) => updateQualityLevel(state)
  }
}

// Singleton instance
let _initialized = false
const _quality = useNetworkQuality()

export function initNetworkQuality() {
  if (_initialized) return
  _initialized = true
  _quality.init()
}

export function getNetworkQuality() {
  return _quality
}
