// Slide Master - 幻灯片母版系统
import { ref, computed } from 'vue'

export interface MasterSlide {
  id: string
  name: string
  type: 'title' | 'content' | 'section' | 'blank' | 'custom'
  thumbnail: string
  background: string
  elements: MasterElement[]
  isDefault: boolean
}

export interface MasterElement {
  id: string
  type: 'text' | 'image' | 'shape' | 'placeholder' | 'pageNumber' | 'date'
  position: { x: number; y: number }
  size: { width: number; height: number }
  style: Record<string, any>
  content?: string
  placeholderType?: 'title' | 'subtitle' | 'body' | 'image' | 'chart' | 'table'
}

export interface ThemeVariant {
  id: string
  name: string
  nameEn: string
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    text: string
  }
  fonts: {
    title: string
    body: string
  }
}

export function useSlideMaster() {
  // 母版幻灯片列表
  const masterSlides = ref<MasterSlide[]>([
    {
      id: 'master_title',
      name: '标题页',
      type: 'title',
      thumbnail: '/masters/title.png',
      background: '#ffffff',
      elements: [
        { id: 'el1', type: 'placeholder', position: { x: 100, y: 80 }, size: { width: 760, height: 100 }, style: { fontSize: 54, fontWeight: 'bold', align: 'center' }, placeholderType: 'title' },
        { id: 'el2', type: 'placeholder', position: { x: 180, y: 200 }, size: { width: 600, height: 60 }, style: { fontSize: 28, align: 'center', color: '#666666' }, placeholderType: 'subtitle' },
        { id: 'el3', type: 'shape', position: { x: 400, y: 480 }, size: { width: 160, height: 6 }, style: { background: 'primary', borderRadius: 3 } }
      ],
      isDefault: true
    },
    {
      id: 'master_content',
      name: '内容页',
      type: 'content',
      thumbnail: '/masters/content.png',
      background: '#ffffff',
      elements: [
        { id: 'el1', type: 'placeholder', position: { x: 60, y: 40 }, size: { width: 840, height: 60 }, style: { fontSize: 40, fontWeight: 'bold' }, placeholderType: 'title' },
        { id: 'el2', type: 'placeholder', position: { x: 60, y: 120 }, size: { width: 840, height: 380 }, style: { fontSize: 20 }, placeholderType: 'body' },
        { id: 'el3', type: 'pageNumber', position: { x: 900, y: 500 }, size: { width: 40, height: 20 }, style: { fontSize: 12, align: 'right' } }
      ],
      isDefault: true
    },
    {
      id: 'master_section',
      name: '章节页',
      type: 'section',
      thumbnail: '/masters/section.png',
      background: '#1e40af',
      elements: [
        { id: 'el1', type: 'placeholder', position: { x: 100, y: 180 }, size: { width: 760, height: 80 }, style: { fontSize: 48, fontWeight: 'bold', align: 'center', color: '#ffffff' }, placeholderType: 'title' },
        { id: 'el2', type: 'shape', position: { x: 380, y: 280 }, size: { width: 200, height: 4 }, style: { background: '#ffffff', opacity: 0.5 } }
      ],
      isDefault: true
    },
    {
      id: 'master_blank',
      name: '空白页',
      type: 'blank',
      thumbnail: '/masters/blank.png',
      background: '#ffffff',
      elements: [],
      isDefault: true
    }
  ])

  // 主题变体
  const themeVariants = ref<ThemeVariant[]>([
    { id: 'theme_blue', name: '商务蓝', nameEn: 'Business Blue', colors: { primary: '#1e40af', secondary: '#3b82f6', accent: '#06b6d4', background: '#ffffff', text: '#1e293b' }, fonts: { title: 'noto-sans-sc', body: 'noto-sans-sc' } },
    { id: 'theme_purple', name: '优雅紫', nameEn: 'Elegant Purple', colors: { primary: '#7c3aed', secondary: '#a855f7', accent: '#ec4899', background: '#faf5ff', text: '#1e293b' }, fonts: { title: 'noto-serif-sc', body: 'noto-sans-sc' } },
    { id: 'theme_green', name: '自然绿', nameEn: 'Nature Green', colors: { primary: '#059669', secondary: '#10b981', accent: '#34d399', background: '#ecfdf5', text: '#064e3b' }, fonts: { title: 'noto-sans-sc', body: 'noto-sans-sc' } },
    { id: 'theme_orange', name: '活力橙', nameEn: 'Vibrant Orange', colors: { primary: '#ea580c', secondary: '#f97316', accent: '#fb923c', background: '#fff7ed', text: '#1e293b' }, fonts: { title: 'noto-sans-sc', body: 'noto-sans-sc' } },
    { id: 'theme_dark', name: '暗夜黑', nameEn: 'Dark Night', colors: { primary: '#6366f1', secondary: '#818cf8', accent: '#a78bfa', background: '#0f172a', text: '#f8fafc' }, fonts: { title: 'noto-sans-sc', body: 'noto-sans-sc' } }
  ])

  // 当前选中的母版
  const selectedMaster = ref<MasterSlide | null>(null)

  // 当前主题
  const currentTheme = ref<ThemeVariant | null>(null)

  // 创建自定义母版
  const createMaster = (master: Omit<MasterSlide, 'id'>): MasterSlide => {
    const newMaster: MasterSlide = {
      ...master,
      id: `master_${Date.now()}`
    }
    masterSlides.value.push(newMaster)
    return newMaster
  }

  // 复制母版
  const duplicateMaster = (masterId: string): MasterSlide | null => {
    const master = masterSlides.value.find(m => m.id === masterId)
    if (!master) return null

    return createMaster({
      ...master,
      name: `${master.name} (副本)`,
      isDefault: false,
      elements: master.elements.map(el => ({ ...el, id: `el_${Date.now()}_${Math.random()}` }))
    })
  }

  // 删除母版
  const deleteMaster = (masterId: string): boolean => {
    const master = masterSlides.value.find(m => m.id === masterId)
    if (!master || master.isDefault) return false

    const index = masterSlides.value.findIndex(m => m.id === masterId)
    if (index > -1) {
      masterSlides.value.splice(index, 1)
      return true
    }
    return false
  }

  // 应用母版
  const applyMaster = (masterId: string): MasterSlide | null => {
    const master = masterSlides.value.find(m => m.id === masterId)
    if (master) {
      selectedMaster.value = master
    }
    return master
  }

  // 更新母版
  const updateMaster = (masterId: string, updates: Partial<MasterSlide>) => {
    const master = masterSlides.value.find(m => m.id === masterId)
    if (master) {
      Object.assign(master, updates)
    }
  }

  // 添加元素到母版
  const addElementToMaster = (masterId: string, element: Omit<MasterElement, 'id'>): MasterElement | null => {
    const master = masterSlides.value.find(m => m.id === masterId)
    if (!master) return null

    const newElement: MasterElement = {
      ...element,
      id: `el_${Date.now()}`
    }
    master.elements.push(newElement)
    return newElement
  }

  // 从母版移除元素
  const removeElementFromMaster = (masterId: string, elementId: string): boolean => {
    const master = masterSlides.value.find(m => m.id === masterId)
    if (!master) return false

    const index = master.elements.findIndex(e => e.id === elementId)
    if (index > -1) {
      master.elements.splice(index, 1)
      return true
    }
    return false
  }

  // 应用主题
  const applyTheme = (themeId: string): ThemeVariant | null => {
    const theme = themeVariants.value.find(t => t.id === themeId)
    if (theme) {
      currentTheme.value = theme
    }
    return theme
  }

  // 创建自定义主题
  const createTheme = (theme: Omit<ThemeVariant, 'id'>): ThemeVariant => {
    const newTheme: ThemeVariant = {
      ...theme,
      id: `theme_${Date.now()}`
    }
    themeVariants.value.push(newTheme)
    return newTheme
  }

  // 获取母版类型
  const getMastersByType = computed(() => {
    const types: Record<string, MasterSlide[]> = {}
    masterSlides.value.forEach(master => {
      if (!types[master.type]) {
        types[master.type] = []
      }
      types[master.type].push(master)
    })
    return types
  })

  // 导出母版配置
  const exportMasterConfig = (masterId: string): string => {
    const master = masterSlides.value.find(m => m.id === masterId)
    if (!master) return ''

    return JSON.stringify({
      master,
      theme: currentTheme.value
    }, null, 2)
  }

  // 统计
  const stats = computed(() => ({
    totalMasters: masterSlides.value.length,
    defaultMasters: masterSlides.value.filter(m => m.isDefault).length,
    customMasters: masterSlides.value.filter(m => !m.isDefault).length,
    totalThemes: themeVariants.value.length,
    currentTheme: currentTheme.value?.name || '未选择'
  }))

  return {
    masterSlides,
    themeVariants,
    selectedMaster,
    currentTheme,
    createMaster,
    duplicateMaster,
    deleteMaster,
    applyMaster,
    updateMaster,
    addElementToMaster,
    removeElementFromMaster,
    applyTheme,
    createTheme,
    getMastersByType,
    exportMasterConfig,
    stats
  }
}

export default useSlideMaster
