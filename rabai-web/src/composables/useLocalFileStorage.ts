/**
 * useLocalFileStorage - Local file storage for PPT files
 * 
 * Works in two modes:
 * 1. Desktop (Tauri): Uses native file dialogs and filesystem
 * 2. Web (PWA): Uses File System Access API with fallback to download
 */
import { ref } from 'vue'

export interface LocalFile {
  name: string
  path?: string
  data: Blob | ArrayBuffer
  size: number
  lastModified?: number
}

export interface LocalStorageStats {
  totalFiles: number
  totalSize: number
  oldestFile?: Date
  newestFile?: Date
}

const isDesktop = import.meta.env.VITE_APP_PLATFORM === 'desktop'

// IndexedDB for web local storage
const DB_NAME = 'rabai-mind-local'
const STORE_NAME = 'ppt-files'
const DB_VERSION = 1

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
        store.createIndex('name', 'name', { unique: false })
        store.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }
  })
}

export function useLocalFileStorage() {
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const savedFiles = ref<Array<{ id?: number; name: string; timestamp: number; size: number }>>([])

  // Save PPT to local storage
  const savePPT = async (data: Blob | ArrayBuffer, filename: string, metadata?: Record<string, any>): Promise<string | null> => {
    isLoading.value = true
    error.value = null

    try {
      // Try Tauri first (desktop)
      if (isDesktop) {
        try {
          const { save } = await import('@tauri-apps/plugin-dialog')
          const { writeFile, BaseDirectory } = await import('@tauri-apps/plugin-fs')
          
          const filePath = await save({
            defaultPath: filename,
            filters: [{ name: 'PowerPoint', extensions: ['pptx'] }]
          })
          
          if (!filePath) {
            isLoading.value = false
            return null // User cancelled
          }
          
          const arrayBuffer = data instanceof ArrayBuffer ? data : await data.arrayBuffer()
          await writeFile(filePath, new Uint8Array(arrayBuffer))
          
          isLoading.value = false
          return filePath
        } catch (e) {
          console.warn('[LocalStorage] Tauri not available, falling back to web:', e)
        }
      }

      // Try File System Access API (Chrome/Edge)
      if ('showSaveFilePicker' in window) {
        try {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: filename,
            types: [{
              description: 'PowerPoint',
              accept: { 'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'] }
            }]
          })
          const writable = await handle.createWritable()
          await writable.write(data)
          await writable.close()
          isLoading.value = false
          return filename
        } catch (e) {
          if ((e as Error).name === 'AbortError') {
            isLoading.value = false
            return null
          }
          console.warn('[LocalStorage] File System Access API failed, falling back to download:', e)
        }
      }

      // Fallback: download via blob URL
      const blob = data instanceof Blob ? data : new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      // Also save to IndexedDB for history
      await saveToIndexedDB(blob, filename, metadata)
      
      isLoading.value = false
      return filename
    } catch (e) {
      error.value = (e as Error).message
      isLoading.value = false
      return null
    }
  }

  // Load PPT from local storage
  const loadPPT = async (): Promise<LocalFile | null> => {
    isLoading.value = true
    error.value = null

    try {
      // Try Tauri first (desktop)
      if (isDesktop) {
        try {
          const { open } = await import('@tauri-apps/plugin-dialog')
          const { readFile } = await import('@tauri-apps/plugin-fs')
          
          const filePath = await open({
            multiple: false,
            filters: [{ name: 'PowerPoint', extensions: ['pptx'] }]
          })
          
          if (!filePath) {
            isLoading.value = false
            return null
          }
          
          const contents = await readFile(filePath as string)
          const name = (filePath as string).split('/').pop() || 'presentation.pptx'
          
          isLoading.value = false
          return {
            name,
            path: filePath as string,
            data: new Blob([contents], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }),
            size: contents.byteLength
          }
        } catch (e) {
          console.warn('[LocalStorage] Tauri open failed, falling back to web:', e)
        }
      }

      // Try File System Access API (Chrome/Edge)
      if ('showOpenFilePicker' in window) {
        try {
          const [handle] = await (window as any).showOpenFilePicker({
            types: [{
              description: 'PowerPoint',
              accept: { 'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'] }
            }]
          })
          const file = await handle.getFile()
          isLoading.value = false
          return {
            name: file.name,
            data: file,
            size: file.size,
            lastModified: file.lastModified
          }
        } catch (e) {
          if ((e as Error).name !== 'AbortError') {
            console.warn('[LocalStorage] File System Access API failed:', e)
          }
        }
      }

      // Fallback: hidden file input
      return new Promise((resolve) => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation'
        input.onchange = async () => {
          const file = input.files?.[0]
          if (!file) {
            isLoading.value = false
            resolve(null)
            return
          }
          isLoading.value = false
          resolve({
            name: file.name,
            data: file,
            size: file.size,
            lastModified: file.lastModified
          })
        }
        input.click()
      })
    } catch (e) {
      error.value = (e as Error).message
      isLoading.value = false
      return null
    }
  }

  // Save to IndexedDB (for offline/history)
  const saveToIndexedDB = async (data: Blob, name: string, metadata?: Record<string, any>) => {
    try {
      const db = await openIDB()
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite')
        const store = tx.objectStore(STORE_NAME)
        const request = store.add({
          data,
          name,
          timestamp: Date.now(),
          size: data.size,
          metadata
        })
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
    } catch (e) {
      console.error('[LocalStorage] IndexedDB save failed:', e)
    }
  }

  // List saved files from IndexedDB
  const listSavedFiles = async (): Promise<Array<{ id: number; name: string; timestamp: number; size: number }>> => {
    try {
      const db = await openIDB()
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly')
        const store = tx.objectStore(STORE_NAME)
        const request = store.getAll()
        request.onsuccess = () => {
          const files = (request.result || []).map((f: any) => ({
            id: f.id,
            name: f.name,
            timestamp: f.timestamp,
            size: f.size
          }))
          savedFiles.value = files
          resolve(files)
        }
        request.onerror = () => reject(request.error)
      })
    } catch (e) {
      console.error('[LocalStorage] List files failed:', e)
      return []
    }
  }

  // Load a specific file from IndexedDB
  const loadFromIndexedDB = async (id: number): Promise<LocalFile | null> => {
    try {
      const db = await openIDB()
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly')
        const store = tx.objectStore(STORE_NAME)
        const request = store.get(id)
        request.onsuccess = () => {
          const record = request.result
          if (!record) {
            resolve(null)
            return
          }
          resolve({
            name: record.name,
            data: record.data,
            size: record.size,
            lastModified: record.timestamp
          })
        }
        request.onerror = () => reject(request.error)
      })
    } catch (e) {
      console.error('[LocalStorage] Load from IDB failed:', e)
      return null
    }
  }

  // Delete a file from IndexedDB
  const deleteFromIndexedDB = async (id: number): Promise<boolean> => {
    try {
      const db = await openIDB()
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite')
        const store = tx.objectStore(STORE_NAME)
        const request = store.delete(id)
        request.onsuccess = () => resolve(true)
        request.onerror = () => reject(request.error)
      })
    } catch (e) {
      console.error('[LocalStorage] Delete failed:', e)
      return false
    }
  }

  // Get storage stats
  const getStorageStats = async (): Promise<LocalStorageStats> => {
    const files = await listSavedFiles()
    const totalSize = files.reduce((sum, f) => sum + f.size, 0)
    const timestamps = files.map(f => f.timestamp)
    return {
      totalFiles: files.length,
      totalSize,
      oldestFile: timestamps.length ? new Date(Math.min(...timestamps)) : undefined,
      newestFile: timestamps.length ? new Date(Math.max(...timestamps)) : undefined
    }
  }

  // Clear all local storage
  const clearStorage = async (): Promise<boolean> => {
    try {
      const db = await openIDB()
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite')
        const store = tx.objectStore(STORE_NAME)
        const request = store.clear()
        request.onsuccess = () => {
          savedFiles.value = []
          resolve(true)
        }
        request.onerror = () => reject(request.error)
      })
    } catch (e) {
      console.error('[LocalStorage] Clear failed:', e)
      return false
    }
  }

  // Check if running in desktop mode
  const isDesktopMode = () => isDesktop

  return {
    isLoading,
    error,
    savedFiles,
    savePPT,
    loadPPT,
    listSavedFiles,
    loadFromIndexedDB,
    deleteFromIndexedDB,
    getStorageStats,
    clearStorage,
    isDesktopMode
  }
}
