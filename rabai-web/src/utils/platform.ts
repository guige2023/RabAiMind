/**
 * Platform detection utilities
 * Detects if running in: web browser, PWA, or Tauri desktop app
 */

export type Platform = 'web' | 'pwa' | 'desktop'

export function detectPlatform(): Platform {
  // Check for Tauri (desktop)
  if (typeof window !== 'undefined' && '__TAURI__' in window) {
    return 'desktop'
  }
  
  // Check for PWA (service worker + manifest)
  if (typeof window !== 'undefined') {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const isInWebAppiOS = (window as any).navigator?.standalone === true
    if (isStandalone || isInWebAppiOS || document.referrer.includes('localhost')) {
      // Additional check: is there a service worker registered?
      if ('serviceWorker' in navigator) {
        return 'pwa'
      }
    }
  }
  
  return 'web'
}

export function isDesktop(): boolean {
  return detectPlatform() === 'desktop'
}

export function isPWA(): boolean {
  return detectPlatform() === 'pwa'
}

export function isWeb(): boolean {
  return detectPlatform() === 'web'
}

// Tauri API helpers - these functions safely check for Tauri availability
export function hasTauriFS(): boolean {
  if (!isDesktop()) return false
  try {
    return typeof import('@tauri-apps/plugin-fs') !== 'undefined'
  } catch {
    return false
  }
}

export function hasTauriDialog(): boolean {
  if (!isDesktop()) return false
  try {
    return typeof import('@tauri-apps/plugin-dialog') !== 'undefined'
  } catch {
    return false
  }
}

export function hasFileSystemAccess(): boolean {
  if (typeof window === 'undefined') return false
  return 'showSaveFilePicker' in window || 'showOpenFilePicker' in window
}
