// Enhanced Help Documentation - 帮助文档增强
import { ref, computed } from 'vue'

export type HelpCategory = 'getting-started' | 'features' | 'templates' | 'ai-generation' | 'editing' | 'export' | 'shortcuts' | 'troubleshooting' | 'faq'

export interface HelpArticle {
  id: string
  title: string
  titleEn: string
  category: HelpCategory
  content: string
  contentEn: string
  tags: string[]
  related: string[]
  lastUpdated: number
}

export interface HelpSection {
  id: HelpCategory
  name: string
  nameEn: string
  icon: string
  description: string
  articleCount: number
}

// 帮助文档分类
export const helpSections: HelpSection[] = [
  { id: 'getting-started', name: '快速开始', nameEn: 'Getting Started', icon: '🚀', description: '了解平台基本功能', articleCount: 5 },
  { id: 'features', name: '功能介绍', nameEn: 'Features', icon: '✨', description: '了解各功能使用方法', articleCount: 8 },
  { id: 'templates', name: '模板使用', nameEn: 'Templates', icon: '🎨', description: '模板选择和使用技巧', articleCount: 6 },
  { id: 'ai-generation', name: 'AI生成', nameEn: 'AI Generation', icon: '🤖', description: 'AI智能生成内容', articleCount: 5 },
  { id: 'editing', name: '内容编辑', nameEn: 'Editing', icon: '✏️', description: '编辑和调整PPT内容', articleCount: 7 },
  { id: 'export', name: '导出分享', nameEn: 'Export & Share', icon: '📤', description: '导出和分享您的作品', articleCount: 4 },
  { id: 'shortcuts', name: '快捷键', nameEn: 'Keyboard Shortcuts', icon: '⌨️', description: '提高效率的快捷键', articleCount: 1 },
  { id: 'troubleshooting', name: '常见问题', nameEn: 'Troubleshooting', icon: '🔧', description: '解决问题和故障排除', articleCount: 8 },
  { id: 'faq', name: 'FAQ', nameEn: 'FAQ', icon: '❓', description: '常见问题解答', articleCount: 10 }
]

// 帮助文档内容
export const helpArticles: HelpArticle[] = [
  // 快速开始
  {
    id: 'gs-1',
    title: '快速开始指南',
    titleEn: 'Quick Start Guide',
    category: 'getting-started',
    content: `
## 欢迎使用RabAi Mind

RabAi Mind是一个强大的AI PPT生成平台，帮助您快速创建专业的演示文稿。

### 5分钟快速入门

1. **创建新PPT**
   - 点击首页的"创建PPT"按钮
   - 或使用快捷键 Ctrl+N

2. **描述您的主题**
   - 输入您想创建的PPT主题
   - 例如："创建一个关于人工智能发展的商业计划书"

3. **选择模板**
   - 浏览模板市场
   - 选择适合您主题的模板

4. **AI生成内容**
   - 等待AI自动生成内容
   - 可以随时修改调整

5. **导出分享**
   - 支持多种格式导出
   - 或生成分享链接
    `,
    contentEn: `
## Welcome to RabAi Mind

RabAi Mind is a powerful AI PPT generation platform that helps you create professional presentations quickly.

### Quick Start in 5 Minutes

1. **Create a New PPT**
   - Click "Create PPT" on the home page
   - Or use shortcut Ctrl+N

2. **Describe Your Topic**
   - Enter the topic for your PPT
   - Example: "Create a business plan about AI development"

3. **Choose a Template**
   - Browse the template market
   - Select a template suitable for your topic

4. **AI Generates Content**
   - Wait for AI to generate content
   - You can modify and adjust anytime

5. **Export & Share**
   - Support multiple export formats
   - Or generate a share link
    `,
    tags: ['入门', '新手', '基础'],
    related: ['gs-2', 'gs-3'],
    lastUpdated: Date.now()
  },
  {
    id: 'gs-2',
    title: '界面介绍',
    titleEn: 'Interface Introduction',
    category: 'getting-started',
    content: `
## 界面概览

### 顶部导航
- **Logo**: 返回首页
- **导航菜单**: 首页、创建PPT、模板市场、素材库、历史
- **工具栏**: 搜索、主题切换、帮助

### 主要区域
- **首页**: 快速入口和推荐
- **创建页**: 输入主题和AI生成
- **模板市场**: 浏览和选择模板
- **编辑页**: 调整和编辑内容
    `,
    contentEn: `
## Interface Overview

### Top Navigation
- **Logo**: Return to home
- **Navigation Menu**: Home, Create PPT, Template Market, Media Library, History
- **Toolbar**: Search, Theme Toggle, Help

### Main Areas
- **Home**: Quick access and recommendations
- **Create Page**: Enter topic and AI generation
- **Template Market**: Browse and select templates
- **Edit Page**: Adjust and edit content
    `,
    tags: ['界面', '布局', '导航'],
    related: ['gs-1'],
    lastUpdated: Date.now()
  },
  // AI生成
  {
    id: 'ai-1',
    title: '如何获得更好的AI生成结果',
    titleEn: 'How to Get Better AI Results',
    category: 'ai-generation',
    content: `
## 优化AI生成的技巧

### 1. 详细描述主题
❌ 差："关于营销的PPT"
✅ 好："创建一个面向企业高管的年度营销总结报告，包含数据分析和下一年计划"

### 2. 指定目标受众
- 告诉AI您的受众是谁
- 例如："面向技术人员"或"面向投资者"

### 3. 选择合适的语气
- 专业正式
- 轻松活泼
- 学术严谨
- 创意独特

### 4. 指定风格偏好
- 科技感
- 简约风格
- 中国风
- 商务风格
    `,
    contentEn: `
## Tips for Better AI Results

### 1. Describe in Detail
❌ Poor: "About marketing PPT"
✅ Good: "Create an annual marketing summary report for corporate executives, including data analysis and next year's plan"

### 2. Specify Target Audience
- Tell AI who your audience is
- Example: "For technical staff" or "For investors"

### 3. Choose Appropriate Tone
- Professional & Formal
- Casual & Friendly
- Academic & Rigorous
- Creative & Unique

### 4. Specify Style Preferences
- Tech Style
- Minimalist
- Chinese Style
- Business Style
    `,
    tags: ['AI', '提示词', '技巧'],
    related: ['ai-2', 'ai-3'],
    lastUpdated: Date.now()
  },
  // 快捷键
  {
    id: 'sc-1',
    title: '键盘快捷键完整列表',
    titleEn: 'Complete Keyboard Shortcuts',
    category: 'shortcuts',
    content: `
## 快捷键列表

### 导航快捷键
| 快捷键 | 功能 |
|--------|------|
| Ctrl+N | 新建PPT |
| Ctrl+K | 搜索 |
| Ctrl+T | 模板市场 |
| F1 | 帮助 |

### 编辑快捷键
| 快捷键 | 功能 |
|--------|------|
| Ctrl+Z | 撤销 |
| Ctrl+Shift+Z | 重做 |
| Ctrl+C | 复制 |
| Ctrl+V | 粘贴 |
| Ctrl+X | 剪切 |
| Ctrl+A | 全选 |
| Delete | 删除 |

### 视图快捷键
| 快捷键 | 功能 |
|--------|------|
| Ctrl+= | 放大 |
| Ctrl+- | 缩小 |
| Ctrl+0 | 重置缩放 |
| F11 | 全屏 |
    `,
    contentEn: `
## Keyboard Shortcuts

### Navigation
| Shortcut | Action |
|----------|--------|
| Ctrl+N | New PPT |
| Ctrl+K | Search |
| Ctrl+T | Templates |
| F1 | Help |

### Editing
| Shortcut | Action |
|----------|--------|
| Ctrl+Z | Undo |
| Ctrl+Shift+Z | Redo |
| Ctrl+C | Copy |
| Ctrl+V | Paste |
| Ctrl+X | Cut |
| Ctrl+A | Select All |
| Delete | Delete |

### View
| Shortcut | Action |
|----------|--------|
| Ctrl+= | Zoom In |
| Ctrl+- | Zoom Out |
| Ctrl+0 | Reset Zoom |
| F11 | Fullscreen |
    `,
    tags: ['快捷键', '效率', '键盘'],
    related: [],
    lastUpdated: Date.now()
  },
  // 故障排除
  {
    id: 'ts-1',
    title: '常见问题解决方案',
    titleEn: 'Common Problems Solutions',
    category: 'troubleshooting',
    content: `
## 常见问题

### 1. AI生成失败
**症状**: 点击生成后没有反应或报错

**解决方案**:
- 检查网络连接
- 刷新页面重试
- 简化主题描述

### 2. 页面加载缓慢
**症状**: 页面打开很慢

**解决方案**:
- 清除浏览器缓存
- 检查网络速度
- 尝试使用Chrome浏览器

### 3. 导出文件损坏
**症状**: 导出的PPT无法打开

**解决方案**:
- 重新导出
- 尝试其他格式
- 清除浏览器缓存后重试
    `,
    contentEn: `
## Common Problems

### 1. AI Generation Failed
**Symptom**: No response or error after clicking generate

**Solutions**:
- Check network connection
- Refresh and try again
- Simplify the topic description

### 2. Page Loads Slowly
**Symptom**: Pages take long to load

**Solutions**:
- Clear browser cache
- Check network speed
- Try using Chrome browser

### 3. Exported File Corrupted
**Symptom**: Exported PPT cannot be opened

**Solutions**:
- Re-export
- Try other formats
- Clear browser cache and try again
    `,
    tags: ['问题', '故障', '解决'],
    related: ['ts-2', 'ts-3'],
    lastUpdated: Date.now()
  }
]

export function useEnhancedHelp() {
  // 当前分类
  const currentCategory = ref<HelpCategory>('getting-started')

  // 当前文章
  const currentArticle = ref<HelpArticle | null>(null)

  // 搜索关键词
  const searchQuery = ref('')

  // 搜索结果
  const searchResults = ref<HelpArticle[]>([])

  // 最近查看
  const recentArticles = ref<string[]>([])

  // 收藏的文章
  const favorites = ref<string[]>([])

  // 选择分类
  const selectCategory = (category: HelpCategory) => {
    currentCategory.value = category
    currentArticle.value = null
  }

  // 选择文章
  const selectArticle = (articleId: string) => {
    const article = helpArticles.find(a => a.id === articleId)
    if (article) {
      currentArticle.value = article
      addToRecent(articleId)
    }
  }

  // 添加到最近查看
  const addToRecent = (articleId: string) => {
    const index = recentArticles.value.indexOf(articleId)
    if (index > -1) {
      recentArticles.value.splice(index, 1)
    }
    recentArticles.value.unshift(articleId)
    if (recentArticles.value.length > 10) {
      recentArticles.value.pop()
    }
    saveRecent()
  }

  // 收藏/取消收藏
  const toggleFavorite = (articleId: string) => {
    const index = favorites.value.indexOf(articleId)
    if (index > -1) {
      favorites.value.splice(index, 1)
    } else {
      favorites.value.push(articleId)
    }
    saveFavorites()
  }

  // 搜索
  const search = (query: string) => {
    searchQuery.value = query

    if (!query.trim()) {
      searchResults.value = []
      return
    }

    const lowerQuery = query.toLowerCase()
    searchResults.value = helpArticles.filter(article =>
      article.title.toLowerCase().includes(lowerQuery) ||
      article.titleEn.toLowerCase().includes(lowerQuery) ||
      article.content.toLowerCase().includes(lowerQuery) ||
      article.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    )
  }

  // 获取分类文章
  const getCategoryArticles = (category: HelpCategory): HelpArticle[] => {
    return helpArticles.filter(a => a.category === category)
  }

  // 获取收藏文章
  const getFavoriteArticles = (): HelpArticle[] => {
    return favorites.value.map(id => helpArticles.find(a => a.id === id)).filter(Boolean) as HelpArticle[]
  }

  // 获取最近文章
  const getRecentArticles = (): HelpArticle[] => {
    return recentArticles.value.map(id => helpArticles.find(a => a.id === id)).filter(Boolean) as HelpArticle[]
  }

  // 保存到localStorage
  const saveRecent = () => {
    localStorage.setItem('help_recent', JSON.stringify(recentArticles.value))
  }

  const saveFavorites = () => {
    localStorage.setItem('help_favorites', JSON.stringify(favorites.value))
  }

  // 加载
  const load = () => {
    try {
      const recent = localStorage.getItem('help_recent')
      if (recent) recentArticles.value = JSON.parse(recent)

      const fav = localStorage.getItem('help_favorites')
      if (fav) favorites.value = JSON.parse(fav)
    } catch { /* ignore */ }
  }

  // 获取相关文章
  const getRelatedArticles = (articleId: string): HelpArticle[] => {
    const article = helpArticles.find(a => a.id === articleId)
    if (!article) return []

    return article.related
      .map(id => helpArticles.find(a => a.id === id))
      .filter(Boolean) as HelpArticle[]
  }

  // 热门文章
  const popularArticles = computed(() => {
    return helpArticles.slice(0, 5)
  })

  // 统计
  const stats = computed(() => ({
    totalArticles: helpArticles.length,
    totalSections: helpSections.length,
    favoritesCount: favorites.value.length,
    recentCount: recentArticles.value.length
  }))

  return {
    // 数据
    sections: helpSections,
    articles: helpArticles,
    // 状态
    currentCategory,
    currentArticle,
    searchQuery,
    searchResults,
    recentArticles,
    favorites,
    // 计算属性
    popularArticles,
    stats,
    // 方法
    selectCategory,
    selectArticle,
    toggleFavorite,
    search,
    getCategoryArticles,
    getFavoriteArticles,
    getRecentArticles,
    getRelatedArticles,
    load
  }
}

export default useEnhancedHelp
