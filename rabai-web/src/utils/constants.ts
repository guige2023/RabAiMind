// PPT布局常量 - 前后端共享
// 与 src/models/__init__.py 中的 LayoutType 枚举保持同步

// 布局类型枚举
export enum LayoutType {
  TITLE_SLIDE = 'title_slide',
  CONTENT_CARD = 'content_card',
  TWO_COLUMN = 'two_column',
  CENTER_RADIATION = 'center_radiation',
  TIMELINE = 'timeline',
  DATA_VISUALIZATION = 'data_visualization',
  QUOTE = 'quote',
  COMPARISON = 'comparison',
  TOC = 'toc',
  THANK_YOU = 'thank_you',
  LEFT_TEXT_RIGHT_IMAGE = 'left_text_right_image',
  LEFT_IMAGE_RIGHT_TEXT = 'left_image_right_text',
  THREE_COLUMN = 'three_column',
  MASONRY = 'masonry',
  FULL_IMAGE = 'full_image',
  PROCESS = 'process',
  TEAM = 'team'
}

// 布局选项配置
export const LAYOUT_OPTIONS = [
  { value: LayoutType.TITLE_SLIDE, name: '封面', icon: '📄', desc: '标题封面页' },
  { value: LayoutType.CONTENT_CARD, name: '卡片', icon: '🃏', desc: '内容卡片布局' },
  { value: LayoutType.TWO_COLUMN, name: '双栏', icon: '📊', desc: '左右双栏布局' },
  { value: LayoutType.CENTER_RADIATION, name: '中心辐射', icon: '🌀', desc: '中心发散布局' },
  { value: LayoutType.TIMELINE, name: '时间线', icon: '📅', desc: '时间轴布局' },
  { value: LayoutType.DATA_VISUALIZATION, name: '数据可视化', icon: '📈', desc: '图表数据展示' },
  { value: LayoutType.QUOTE, name: '金句', icon: '💬', desc: '引用金句布局' },
  { value: LayoutType.COMPARISON, name: '对比', icon: '⚖️', desc: '左右对比布局' },
  { value: LayoutType.TOC, name: '目录', icon: '📑', desc: '目录页布局' },
  { value: LayoutType.THANK_YOU, name: '结束页', icon: '🙏', desc: '感谢页布局' },
  { value: LayoutType.LEFT_TEXT_RIGHT_IMAGE, name: '左文右图', icon: '📝🖼️', desc: '左侧文字右侧图片' },
  { value: LayoutType.LEFT_IMAGE_RIGHT_TEXT, name: '左图右文', icon: '🖼️📝', desc: '左侧图片右侧文字' },
  { value: LayoutType.THREE_COLUMN, name: '三栏', icon: '📋', desc: '三栏并列布局' },
  { value: LayoutType.MASONRY, name: '瀑布流', icon: '🧱', desc: '不规则网格布局' },
  { value: LayoutType.FULL_IMAGE, name: '全屏图', icon: '🖼️', desc: '全屏图片背景布局' },
  { value: LayoutType.PROCESS, name: '流程图', icon: '🔀', desc: '流程步骤展示布局' },
  { value: LayoutType.TEAM, name: '团队介绍', icon: '👥', desc: '人物卡片展示布局' }
]

// 场景类型枚举
export enum SceneType {
  BUSINESS = 'business',
  EDUCATION = 'education',
  TECH = 'tech',
  CREATIVE = 'creative',
  MARKETING = 'marketing',
  FINANCE = 'finance',
  MEDICAL = 'medical',
  GOVERNMENT = 'government'
}

// 风格类型枚举
export enum StyleType {
  PROFESSIONAL = 'professional',
  SIMPLE = 'simple',
  ENERGETIC = 'energetic',
  PREMIUM = 'premium',
  CREATIVE = 'creative',
  TECH = 'tech',
  NATURE = 'nature',
  ELEGANT = 'elegant',
  PLAYFUL = 'playful',
  MINIMALIST = 'minimalist'
}

// 文字样式类型枚举
export enum TextStyleType {
  TRANSPARENT_OVERLAY = 'transparent_overlay',
  SHADOW = 'shadow',
  GLOW = 'glow',
  OUTLINE = 'outline',
  GRADIENT = 'gradient',
  NEON = 'neon'
}

// 模板类型枚举
export enum TemplateType {
  DEFAULT = 'default',
  MODERN = 'modern',
  CLASSIC = 'classic',
  TECH = 'tech',
  NATURE = 'nature',
  OCEAN = 'ocean',
  SUNSET = 'sunset',
  MINIMAL = 'minimal'
}

// 常用颜色
export const THEME_COLORS = [
  { value: '#165DFF', name: '科技蓝' },
  { value: '#34C759', name: '自然绿' },
  { value: '#FF9500', name: '活力橙' },
  { value: '#FF3B30', name: '热情红' },
  { value: '#AF52DE', name: '神秘紫' },
  { value: '#1A1A1A', name: '经典黑' },
  { value: '#5856D6', name: '暗夜紫' },
  { value: '#00B96B', name: '清新薄荷' },
  { value: '#FF2D55', name: '玫瑰粉' },
  { value: '#FFD60A', name: '阳光黄' },
  { value: '#64D2FF', name: '天空蓝' },
  { value: '#BF5AF2', name: '荧光紫' },
  { value: '#FF6B6B', name: '珊瑚红' },
  { value: '#4ECDC4', name: '海洋青' },
  { value: '#45B7D1', name: '天际蓝' },
  { value: '#96CEB4', name: '森林绿' }
]

// 工具函数：Points to English Metric Units (EMU)
// 1 point = 12700 EMU
export const ptToEmu = (pt: number): number => {
  return Math.round(pt * 12700)
}

// 工具函数：EMU to Points
export const emuToPt = (emu: number): number => {
  return emu / 12700
}

// 工具函数：英寸转EMU
export const inchToEmu = (inch: number): number => {
  return Math.round(inch * 914400)
}

// 工具函数：厘米转EMU
export const cmToEmu = (cm: number): number => {
  return Math.round(cm * 360000)
}

// 工具函数：像素转EMU (基于96 DPI)
export const pxToEmu = (px: number): number => {
  return Math.round(px * 9525)
}

// 标准幻灯片尺寸 (宽高比 16:9)
export const SLIDE_SIZE = {
  width: 13.5,  // 英寸
  height: 7.5,  // 英寸
  width_emu: inchToEmu(13.5),
  height_emu: inchToEmu(7.5)
}

// 标准边距 (1英寸 = 914400 EMU)
export const SLIDE_MARGIN = {
  top: 0.5,
  bottom: 0.5,
  left: 0.75,
  right: 0.75
}
