import { ref, onMounted } from 'vue'

export interface PWAInstallState {
  isStandalone: boolean
  isMobile: boolean
  canInstall: boolean
  deferredPrompt: any | null
  installDismissed: boolean
  showInstallUI: boolean
}

const isStandalone = ref(false)
const isMobile = ref(false)
const canInstall = ref(false)
const deferredPrompt = ref<any | null>(null)
const installDismissed = ref(false)

export function usePWAInstall() {
  onMounted(() => {
    // Detect standalone mode (PWA already installed)
    isStandalone.value = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true
      || document.referrer.includes('android-app://')

    // Detect mobile device
    isMobile.value = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || window.innerWidth < 768

    // Check if already dismissed this session
    const dismissed = sessionStorage.getItem('pwa-install-dismissed')
    installDismissed.value = dismissed === 'true'

    // Listen for install prompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      deferredPrompt.value = e
      // Show prompt only on mobile and not yet dismissed
      canInstall.value = isMobile.value && !installDismissed.value && !isStandalone.value
    }

    const handleAppInstalled = () => {
      isStandalone.value = true
      canInstall.value = false
      deferredPrompt.value = null
      sessionStorage.removeItem('pwa-install-dismissed')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Listen for display-mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    const handleDisplayChange = (e: MediaQueryListEvent) => {
      isStandalone.value = e.matches
    }
    mediaQuery.addEventListener('change', handleDisplayChange)

    // On iOS, check if in homescreen mode
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      // iOS doesn't fire beforeinstallprompt, so we detect standalone differently
      if (document.visibilityState === 'hidden' && !installDismissed.value) {
        // Coming back from homescreen
        isStandalone.value = true
      }
    }
  })

  const installApp = async () => {
    if (!deferredPrompt.value) return false

    try {
      deferredPrompt.value.prompt()
      const { outcome } = await deferredPrompt.value.userChoice

      if (outcome === 'accepted') {
        canInstall.value = false
        deferredPrompt.value = null
        return true
      } else {
        // User dismissed
        dismissInstall()
        return false
      }
    } catch (err) {
      console.error('[PWA Install] Failed:', err)
      return false
    }
  }

  const dismissInstall = () => {
    installDismissed.value = true
    canInstall.value = false
    sessionStorage.setItem('pwa-install-dismissed', 'true')
  }

  return {
    isStandalone,
    isMobile,
    canInstall,
    deferredPrompt,
    installDismissed,
    installApp,
    dismissInstall
  }
}
