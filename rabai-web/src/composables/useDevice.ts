// useDevice.ts - 设备信息模块
import { ref, computed } from 'vue'
import { useMediaQuery } from './useMediaQuery'

export interface DeviceInfo {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isIOS: boolean
  isAndroid: boolean
  isWindows: boolean
  isMac: boolean
  isLinux: boolean
  isSafari: boolean
  isChrome: boolean
  isFirefox: boolean
  isEdge: boolean
  isWeChat: boolean
  isAlipay: boolean
  isMobileBrowser: boolean
}

export function useDevice() {
  const ua = navigator.userAgent

  const isMobile = useMediaQuery('(max-width: 767px)')
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)')
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const isAndroid = /Android/.test(ua)
  const isWindows = /Win/.test(ua)
  const isMac = /Mac/.test(ua)
  const isLinux = /Linux/.test(ua)

  const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua)
  const isChrome = /Chrome/.test(ua) && !/Edge/.test(ua)
  const isFirefox = /Firefox/.test(ua)
  const isEdge = /Edg/.test(ua)

  const isWeChat = /MicroMessenger/.test(ua)
  const isAlipay = /AlipayClient/.test(ua)

  const isMobileBrowser = computed(() => isMobile.value || /Mobile/.test(ua))

  const deviceType = computed(() => {
    if (isMobile.value) return 'mobile'
    if (isTablet.value) return 'tablet'
    return 'desktop'
  })

  const os = computed(() => {
    if (isIOS.value) return 'ios'
    if (isAndroid.value) return 'android'
    if (isWindows.value) return 'windows'
    if (isMac.value) return 'macos'
    if (isLinux.value) return 'linux'
    return 'unknown'
  })

  const browser = computed(() => {
    if (isEdge.value) return 'edge'
    if (isChrome.value) return 'chrome'
    if (isFirefox.value) return 'firefox'
    if (isSafari.value) return 'safari'
    return 'unknown'
  })

  const info = computed<DeviceInfo>(() => ({
    isMobile: isMobile.value,
    isTablet: isTablet.value,
    isDesktop: isDesktop.value,
    isIOS: isIOS.value,
    isAndroid: isAndroid.value,
    isWindows: isWindows.value,
    isMac: isMac.value,
    isLinux: isLinux.value,
    isSafari: isSafari.value,
    isChrome: isChrome.value,
    isFirefox: isFirefox.value,
    isEdge: isEdge.value,
    isWeChat: isWeChat.value,
    isAlipay: isAlipay.value,
    isMobileBrowser: isMobileBrowser.value
  }))

  return { info, deviceType, os, browser, ua }
}

export default useDevice
