/**
 * useClipboardAndContent.ts
 * Clipboard & Content Integration Composable
 * Features:
 * 1. Paste from clipboard (images + text detection)
 * 2. Drag files from desktop to upload
 * 3. Paste as new slide (intelligent parsing)
 * 4. Import from screenshot (OCR + smart layout)
 * 5. Clipboard history for recently copied elements
 */
import { ref, onMounted, onUnmounted } from 'vue'

export interface ClipboardItem {
  id: string
  type: 'text' | 'image'
  content: string          // text content or base64 data URL
  timestamp: number
  preview?: string         // short preview for history
  name?: string           // filename for images
}

const MAX_HISTORY = 20
const STORAGE_KEY = 'rabai_clipboard_history'

// Global clipboard history (shared across sessions)
const clipboardHistory = ref<ClipboardItem[]>([])
const isDragOver = ref(false)
const pendingPasteContent = ref<ClipboardItem | null>(null)
const showClipboardHistory = ref(false)
const showPastePreview = ref(false)
const isProcessingOCR = ref(false)

// Load history from localStorage
function loadHistory() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      clipboardHistory.value = JSON.parse(saved)
    }
  } catch (e) {
    clipboardHistory.value = []
  }
}

// Save history to localStorage
function saveHistory() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clipboardHistory.value))
  } catch (e) {
    console.warn('[ClipboardHistory] Failed to save:', e)
  }
}

// Add item to clipboard history
function addToHistory(item: ClipboardItem) {
  // Avoid duplicates
  const existing = clipboardHistory.value.findIndex(h =>
    h.type === item.type && h.content === item.content
  )
  if (existing >= 0) {
    // Move to top
    clipboardHistory.value.splice(existing, 1)
  }
  clipboardHistory.value.unshift(item)
  if (clipboardHistory.value.length > MAX_HISTORY) {
    clipboardHistory.value = clipboardHistory.value.slice(0, MAX_HISTORY)
  }
  saveHistory()
}

// Clear clipboard history
function clearHistory() {
  clipboardHistory.value = []
  localStorage.removeItem(STORAGE_KEY)
}

// Read text from clipboard
async function readClipboardText(): Promise<string | null> {
  try {
    const text = await navigator.clipboard.readText()
    return text
  } catch (e) {
    console.warn('[Clipboard] Cannot read text:', e)
    return null
  }
}

// Read image from clipboard
async function readClipboardImage(): Promise<string | null> {
  try {
    const items = await navigator.clipboard.read()
    for (const item of items) {
      for (const type of item.types) {
        if (type.startsWith('image/')) {
          const blob = await item.getType(type)
          return await blobToDataURL(blob)
        }
      }
    }
  } catch (e) {
    console.warn('[Clipboard] Cannot read image:', e)
  }
  return null
}

// Convert Blob to data URL
function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// Read files from DataTransfer (drag & drop)
function readDroppedFiles(files: FileList | File[]): { text: string[], images: { name: string, dataURL: string }[] } {
  const textFiles: string[] = []
  const imageFiles: { name: string, dataURL: string }[] = []
  return { text: textFiles, images: imageFiles }
}

// Parse dropped files - returns promises
async function processDroppedFiles(files: FileList | File[]): Promise<{
  text: string[]
  images: { name: string, dataURL: string }[]
}> {
  const textFiles: string[] = []
  const imageFiles: { name: string, dataURL: string }[] = []

  for (const file of Array.from(files)) {
    if (file.type.startsWith('image/')) {
      try {
        const dataURL = await blobToDataURL(file)
        imageFiles.push({ name: file.name, dataURL })
      } catch (e) {
        console.warn('[Clipboard] Failed to read image file:', file.name, e)
      }
    } else if (file.type === 'text/plain' || file.type === 'text/html') {
      try {
        const text = await file.text()
        if (text.trim()) textFiles.push(text)
      } catch (e) {
        console.warn('[Clipboard] Failed to read text file:', file.name, e)
      }
    }
  }

  return { text: textFiles, images: imageFiles }
}

// OCR via Tesseract.js (client-side)
async function performOCR(imageDataURL: string): Promise<string> {
  // Dynamic import to avoid loading Tesseract unless needed
  try {
    const Tesseract = await import('tesseract.js')
    const result = await Tesseract.recognize(imageDataURL, 'eng+chi_sim', {
      
    })
    return result.data.text
  } catch (e) {
    console.warn('[OCR] Tesseract failed, trying backend API:', e)
    // Fallback to backend OCR API
    return await performOCRBackend(imageDataURL)
  }
}

// Backend OCR fallback
async function performOCRBackend(imageDataURL: string): Promise<string> {
  try {
    const formData = new FormData()
    // Convert data URL to Blob
    const blob = await fetch(imageDataURL).then(r => r.blob())
    formData.append('file', blob, 'screenshot.png')

    const res = await fetch('/api/v1/ocr', {
      method: 'POST',
      body: formData
    })
    const data = await res.json()
    if (data.success) return data.text
    throw new Error(data.detail || 'OCR failed')
  } catch (e) {
    console.error('[OCR] Backend OCR failed:', e)
    throw e
  }
}

// Smart parse text content into slide structure
function smartParseText(text: string): { title: string; content: string[]; layout: string } {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)

  if (lines.length === 0) {
    return { title: '新页面', content: [], layout: 'content' }
  }

  // Heuristic: if first line is short (<30 chars) and looks like a title, use it as title
  const firstLine = lines[0]
  const isTitle = firstLine.length < 40 && !firstLine.startsWith('-') && !firstLine.startsWith('•')

  if (isTitle && lines.length > 1) {
    // Check layout: if many lines start with numbers, might be timeline
    const numberedCount = lines.filter(l => /^\d+[\.、]/.test(l)).length
    const bulletCount = lines.filter(l => /^[-•*]/.test(l)).length

    let layout = 'content'
    if (numberedCount >= lines.length * 0.6) layout = 'timeline'
    else if (bulletCount >= lines.length * 0.6) layout = 'card'
    else if (lines.length <= 3) layout = 'center_radiation'

    return {
      title: firstLine.replace(/[.:,，。：]$/, ''),
      content: lines.slice(1),
      layout
    }
  } else {
    // No clear title - treat first few short lines as potential bullets
    const bullets = lines.map(l => l.replace(/^[-•*]\s*/, ''))
    return {
      title: '新页面',
      content: bullets,
      layout: bullets.length <= 3 ? 'center_radiation' : 'content'
    }
  }
}

// Create a clipboard item from pasted content
function createClipboardItem(type: 'text' | 'image', content: string, name?: string): ClipboardItem {
  return {
    id: `clip_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    content,
    timestamp: Date.now(),
    preview: type === 'text'
      ? content.slice(0, 60) + (content.length > 60 ? '...' : '')
      : content.slice(0, 60) + '...',
    name
  }
}

// Export composable
export function useClipboardAndContent() {
  return {
    // State
    clipboardHistory,
    isDragOver,
    pendingPasteContent,
    showClipboardHistory,
    showPastePreview,
    isProcessingOCR,

    // History management
    loadHistory,
    clearHistory,

    // Clipboard operations
    readClipboardText,
    readClipboardImage,
    addToHistory,
    createClipboardItem,

    // File operations
    processDroppedFiles,

    // OCR
    performOCR,

    // Smart parsing
    smartParseText,
  }
}
