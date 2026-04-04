// Background Sync - Offline change queue and synchronization
import { ref, computed, onMounted, onUnmounted } from 'vue'

export interface OfflineChange {
  id: string
  type: 'create' | 'update' | 'delete'
  entity: string
  entityId: string
  data: any
  timestamp: number
  retries: number
  lastError?: string
}

export interface SyncState {
  isOnline: boolean
  isSyncing: boolean
  lastSyncTime: number | null
  pendingCount: number
  failedCount: number
  syncProgress: number // 0-100
}

const OFFLINE_QUEUE_KEY = 'rabai_offline_queue'
const SYNC_STATE_KEY = 'rabai_sync_state'
const MAX_RETRIES = 5
const SYNC_BATCH_SIZE = 10

class BackgroundSyncClass {
  // Sync state
  readonly state = ref<SyncState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSyncing: false,
    lastSyncTime: null,
    pendingCount: 0,
    failedCount: 0,
    syncProgress: 0
  })

  // Offline queue
  private queue: OfflineChange[] = []

  // Sync interval
  private syncInterval: number | null = null
  private readonly defaultSyncInterval = 30000 // 30 seconds

  // Event listeners for state changes
  private listeners: ((state: SyncState) => void)[] = []

  constructor() {
    this.loadQueue()
    this.loadState()
  }

  // Load queue from localStorage
  private loadQueue() {
    try {
      const saved = localStorage.getItem(OFFLINE_QUEUE_KEY)
      if (saved) {
        this.queue = JSON.parse(saved)
      }
    } catch {
      this.queue = []
    }
    this.updatePendingCount()
  }

  // Save queue to localStorage
  private saveQueue() {
    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(this.queue))
    } catch (e) {
      console.error('Failed to save offline queue:', e)
    }
  }

  // Load sync state
  private loadState() {
    try {
      const saved = localStorage.getItem(SYNC_STATE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        this.state.value.lastSyncTime = parsed.lastSyncTime || null
      }
    } catch {
      // Ignore
    }
  }

  // Save sync state
  private saveState() {
    try {
      localStorage.setItem(SYNC_STATE_KEY, JSON.stringify({
        lastSyncTime: this.state.value.lastSyncTime
      }))
    } catch {
      // Ignore
    }
  }

  // Update pending count
  private updatePendingCount() {
    this.state.value.pendingCount = this.queue.length
    this.state.value.failedCount = this.queue.filter(c => c.retries >= MAX_RETRIES).length
  }

  // Check if online
  get isOnline(): boolean {
    return this.state.value.isOnline
  }

  // Add a change to the queue
  addChange(change: Omit<OfflineChange, 'id' | 'timestamp' | 'retries'>): string {
    const id = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const offlineChange: OfflineChange = {
      ...change,
      id,
      timestamp: Date.now(),
      retries: 0
    }

    this.queue.push(offlineChange)
    this.saveQueue()
    this.updatePendingCount()

    // Try immediate sync if online
    if (this.state.value.isOnline && !this.state.value.isSyncing) {
      this.sync()
    }

    return id
  }

  // Remove a change from the queue
  removeChange(id: string) {
    this.queue = this.queue.filter(c => c.id !== id)
    this.saveQueue()
    this.updatePendingCount()
  }

  // Retry a failed change
  retryChange(id: string) {
    const change = this.queue.find(c => c.id === id)
    if (change) {
      change.retries = 0
      change.lastError = undefined
      this.saveQueue()
      this.updatePendingCount()
      this.sync()
    }
  }

  // Clear all pending changes
  clearQueue() {
    this.queue = []
    this.saveQueue()
    this.updatePendingCount()
  }

  // Clear only failed changes
  clearFailed() {
    this.queue = this.queue.filter(c => c.retries < MAX_RETRIES)
    this.saveQueue()
    this.updatePendingCount()
  }

  // Get pending changes
  getPendingChanges(): OfflineChange[] {
    return [...this.queue].sort((a, b) => a.timestamp - b.timestamp)
  }

  // Get failed changes
  getFailedChanges(): OfflineChange[] {
    return this.queue.filter(c => c.retries >= MAX_RETRIES)
  }

  // Sync all pending changes
  async sync(): Promise<{ success: number; failed: number }> {
    if (!this.state.value.isOnline || this.state.value.isSyncing) {
      return { success: 0, failed: 0 }
    }

    if (this.queue.length === 0) {
      return { success: 0, failed: 0 }
    }

    this.state.value.isSyncing = true
    this.state.value.syncProgress = 0

    let success = 0
    let failed = 0
    const toSync = this.queue.filter(c => c.retries < MAX_RETRIES)

    // Process in batches
    for (let i = 0; i < toSync.length; i += SYNC_BATCH_SIZE) {
      const batch = toSync.slice(i, i + SYNC_BATCH_SIZE)

      for (const change of batch) {
        try {
          await this.syncChange(change)
          // Remove successful change
          this.queue = this.queue.filter(c => c.id !== change.id)
          success++
        } catch (e: any) {
          // Update retry count
          const existing = this.queue.find(c => c.id === change.id)
          if (existing) {
            existing.retries++
            existing.lastError = e?.message || 'Unknown error'
          }
          failed++
        }
      }

      // Update progress
      this.state.value.syncProgress = Math.round(((i + batch.length) / toSync.length) * 100)
    }

    this.saveQueue()
    this.updatePendingCount()

    this.state.value.isSyncing = false
    this.state.value.lastSyncTime = Date.now()
    this.state.value.syncProgress = 100
    this.saveState()

    // Notify listeners
    this.notifyListeners()

    return { success, failed }
  }

  // Sync a single change (mock implementation - replace with actual API)
  private async syncChange(change: OfflineChange): Promise<void> {
    // Simulate API call - replace with actual backend sync
    // This is a placeholder that always succeeds
    // In production, replace with:
    // const response = await fetch(`/api/${change.entity}/${change.entityId}`, {
    //   method: change.type === 'delete' ? 'DELETE' : change.type === 'create' ? 'POST' : 'PUT',
    //   body: JSON.stringify(change.data)
    // })
    // if (!response.ok) throw new Error(await response.text())

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // For demo, randomly fail some to show retry logic
        if (Math.random() < 0.05) { // 5% failure rate for demo
          reject(new Error('Network error'))
        } else {
          resolve()
        }
      }, 100)
    })
  }

  // Set online status
  setOnline(online: boolean) {
    const wasOffline = !this.state.value.isOnline
    this.state.value.isOnline = online

    if (online && wasOffline) {
      // Back online - trigger sync
      this.sync()
    }
  }

  // Start auto-sync
  startAutoSync(intervalMs?: number) {
    this.stopAutoSync()

    const interval = intervalMs || this.defaultSyncInterval
    this.syncInterval = window.setInterval(() => {
      if (this.state.value.isOnline && !this.state.value.isSyncing && this.queue.length > 0) {
        this.sync()
      }
    }, interval)
  }

  // Stop auto-sync
  stopAutoSync() {
    if (this.syncInterval !== null) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }

  // Add state change listener
  addListener(listener: (state: SyncState) => void) {
    this.listeners.push(listener)
  }

  // Remove listener
  removeListener(listener: (state: SyncState) => void) {
    this.listeners = this.listeners.filter(l => l !== listener)
  }

  // Notify all listeners
  private notifyListeners() {
    this.listeners.forEach(l => l(this.state.value))
  }

  // Get sync summary
  getSummary() {
    return {
      isOnline: this.state.value.isOnline,
      isSyncing: this.state.value.isSyncing,
      lastSyncTime: this.state.value.lastSyncTime,
      pendingCount: this.state.value.pendingCount,
      failedCount: this.state.value.failedCount,
      syncProgress: this.state.value.syncProgress,
      queue: this.getPendingChanges()
    }
  }

  // Destroy
  destroy() {
    this.stopAutoSync()
    this.listeners = []
  }
}

// Singleton instance
export const backgroundSync = new BackgroundSyncClass()

// Initialize online/offline listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => backgroundSync.setOnline(true))
  window.addEventListener('offline', () => backgroundSync.setOnline(false))
}

// Vue composable wrapper
export function useBackgroundSync() {
  const addChange = (change: Omit<OfflineChange, 'id' | 'timestamp' | 'retries'>) => {
    return backgroundSync.addChange(change)
  }

  const removeChange = (id: string) => {
    backgroundSync.removeChange(id)
  }

  const retryChange = (id: string) => {
    backgroundSync.retryChange(id)
  }

  const sync = () => backgroundSync.sync()
  const clearQueue = () => backgroundSync.clearQueue()
  const clearFailed = () => backgroundSync.clearFailed()
  const startAutoSync = (interval?: number) => backgroundSync.startAutoSync(interval)
  const stopAutoSync = () => backgroundSync.stopAutoSync()
  const getSummary = () => backgroundSync.getSummary()
  const getPendingChanges = () => backgroundSync.getPendingChanges()
  const getFailedChanges = () => backgroundSync.getFailedChanges()

  return {
    state: backgroundSync.state,
    isOnline: computed(() => backgroundSync.state.value.isOnline),
    isSyncing: computed(() => backgroundSync.state.value.isSyncing),
    lastSyncTime: computed(() => backgroundSync.state.value.lastSyncTime),
    pendingCount: computed(() => backgroundSync.state.value.pendingCount),
    failedCount: computed(() => backgroundSync.state.value.failedCount),
    syncProgress: computed(() => backgroundSync.state.value.syncProgress),
    addChange,
    removeChange,
    retryChange,
    sync,
    clearQueue,
    clearFailed,
    startAutoSync,
    stopAutoSync,
    getSummary,
    getPendingChanges,
    getFailedChanges
  }
}

export default backgroundSync
