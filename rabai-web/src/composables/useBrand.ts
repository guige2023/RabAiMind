/**
 * useBrand composable - 全局品牌状态管理
 * R104: White-label & Branding
 * 
 * 提供全局品牌配置状态，支持:
 * - White-label 模式（隐藏 RabAiMind 标识）
 * - 品牌配色自动应用到全局 CSS 变量
 * - 品牌 LOGO 显示
 * - 自定义域名
 */

import { ref, computed, watch } from 'vue'
import { apiClient } from '../api/client'

export interface BrandProfile {
  brand_name: string
  primary_color: string
  secondary_color: string
  accent_color: string
  fonts: string[]
  slogan: string
  logo_data: string
  logo_position: string
  powered_by_toggle: boolean
  footer_text: string
  white_label_mode: boolean
  auto_color_detection: boolean
  custom_domain: string
  brand_kits: BrandKit[]
  email_template_enabled: boolean
  email_tagline: string
}

export interface BrandKit {
  kit_id: string
  kit_name: string
  primary_color: string
  secondary_color: string
  accent_color: string
  fonts: string[]
  logo_data: string
  logo_position: string
  created_at: string
}

// 全局单例
const brand = ref<BrandProfile | null>(null)
const brandLoading = ref(false)
const brandLoaded = ref(false)

// 获取分享时使用的域名（自定义域名优先）
const shareDomain = computed(() => {
  if (brand.value?.custom_domain) {
    return brand.value.custom_domain
  }
  return window.location.hostname
})

// 是否启用 White-label 模式
const isWhiteLabel = computed(() => brand.value?.white_label_mode ?? false)

// 显示的品牌名称（白标时用用户品牌名，否则用默认）
const displayBrandName = computed(() => {
  if (isWhiteLabel.value && brand.value?.brand_name) {
    return brand.value.brand_name
  }
  return 'RabAi Mind'
})

// 品牌主色
const primaryColor = computed(() => brand.value?.primary_color ?? '#165DFF')

// 品牌辅色
const secondaryColor = computed(() => brand.value?.secondary_color ?? '#0E42D2')

// 品牌强调色
const accentColor = computed(() => brand.value?.accent_color ?? '#FF9500')

// 品牌 LOGO
const brandLogo = computed(() => brand.value?.logo_data ?? '')

// 品牌口号
const brandSlogan = computed(() => brand.value?.slogan ?? '')

// 自定义页脚文本
const footerText = computed(() => brand.value?.footer_text ?? '')

// 是否显示 Powered by
const showPoweredBy = computed(() => {
  return brand.value?.powered_by_toggle !== false && !isWhiteLabel.value
})

// 品牌套件列表
const brandKits = computed(() => brand.value?.brand_kits ?? [])

// 加载品牌配置
const loadBrand = async (userId: string = 'default') => {
  brandLoading.value = true
  try {
    const res = await apiClient.get(`/brand/get/${userId}`)
    if (res.data?.brand) {
      brand.value = res.data.brand
      applyBrandCSS(res.data.brand)
      brandLoaded.value = true
    } else {
      // 没有品牌配置，使用默认值
      brand.value = null
      applyDefaultCSS()
    }
  } catch (e) {
    console.warn('加载品牌配置失败:', e)
    brand.value = null
    applyDefaultCSS()
  } finally {
    brandLoading.value = false
  }
}

// 将品牌颜色应用到全局 CSS 变量
const applyBrandCSS = (b: BrandProfile) => {
  const root = document.documentElement
  root.style.setProperty('--brand-primary', b.primary_color || '#165DFF')
  root.style.setProperty('--brand-secondary', b.secondary_color || '#0E42D2')
  root.style.setProperty('--brand-accent', b.accent_color || '#FF9500')

  // 生成渐变色
  const gradient = `linear-gradient(135deg, ${b.primary_color || '#165DFF'} 0%, ${b.secondary_color || '#0E42D2'} 100%)`
  root.style.setProperty('--brand-gradient', gradient)
}

const applyDefaultCSS = () => {
  const root = document.documentElement
  root.style.setProperty('--brand-primary', '#165DFF')
  root.style.setProperty('--brand-secondary', '#0E42D2')
  root.style.setProperty('--brand-accent', '#FF9500')
  root.style.setProperty('--brand-gradient', 'linear-gradient(135deg, #165DFF 0%, #0E42D2 100%)')
}

// 保存品牌配置
const saveBrand = async (data: Partial<BrandProfile>, userId: string = 'default') => {
  const payload = {
    user_id: userId,
    ...data,
    fonts: Array.isArray(data.fonts) ? data.fonts : (data.fonts as any)?.split(',').map((f: string) => f.trim()).filter(Boolean) ?? ['思源黑体', 'Arial'],
  }
  await apiClient.post('/brand/save', payload)
  await loadBrand(userId)
}

// 保存品牌套件
const saveBrandKit = async (kit: Omit<BrandKit, 'kit_id' | 'created_at'>, userId: string = 'default') => {
  const payload = {
    user_id: userId,
    ...kit,
    fonts: Array.isArray(kit.fonts) ? kit.fonts : ['思源黑体', 'Arial'],
  }
  const res = await apiClient.post('/brand/kit/save', payload)
  await loadBrand(userId)
  return res.data.kit_id
}

// 删除品牌套件
const deleteBrandKit = async (kitId: string, userId: string = 'default') => {
  await apiClient.delete(`/brand/kit/${userId}/${kitId}`)
  await loadBrand(userId)
}

// 应用品牌套件
const applyBrandKit = async (kitId: string, userId: string = 'default') => {
  await apiClient.post(`/brand/kit/apply/${userId}/${kitId}`)
  await loadBrand(userId)
}

// 发送品牌化分享邮件
const sendBrandingEmail = async (params: {
  to_email: string
  ppt_title: string
  share_url: string
  message?: string
  userId?: string
}) => {
  const userId = params.userId ?? 'default'
  const res = await apiClient.post('/brand/email/send', {
    user_id: userId,
    to_email: params.to_email,
    ppt_title: params.ppt_title,
    share_url: params.share_url,
    message: params.message ?? '',
  })
  return res.data
}

// 监听 white_label_mode 变化，动态更新 body class
watch(isWhiteLabel, (wl) => {
  if (wl) {
    document.body.classList.add('white-label-mode')
  } else {
    document.body.classList.remove('white-label-mode')
  }
})

export function useBrand() {
  return {
    brand,
    brandLoading,
    brandLoaded,
    isWhiteLabel,
    displayBrandName,
    primaryColor,
    secondaryColor,
    accentColor,
    brandLogo,
    brandSlogan,
    footerText,
    showPoweredBy,
    brandKits,
    shareDomain,
    loadBrand,
    saveBrand,
    saveBrandKit,
    deleteBrandKit,
    applyBrandKit,
    sendBrandingEmail,
    applyBrandCSS,
  }
}
