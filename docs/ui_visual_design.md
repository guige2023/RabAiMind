# RabAi Mind UI/视觉设计规范

## 1. 品牌视觉规范

### 1.1 品牌色系

```
┌─────────────────────────────────────────────────────────────────────┐
│                          品牌色系                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  主色 (Primary)                                                    │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ #165DFF - 科技蓝                                              │   │
│  │                                                             │   │
│  │ RGB: 21, 93, 255                                            │   │
│  │ HSL: 221°, 100%, 54%                                        │   │
│  │                                                             │   │
│  │ 使用场景: 按钮、链接、强调元素                                │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  辅助色 (Secondary)                                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ #0A84FF - 明亮蓝    │ #5AC8FA - 浅蓝     │ #64D2FF - 青色  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  中性色 (Neutral)                                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ #000000 - 纯黑    │ #333333 - 深灰    │ #666666 - 中灰   │   │
│  │ #999999 - 浅灰    │ #E5E5E5 - 边框    │ #F5F5F5 - 背景   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  功能色 (Functional)                                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 成功 #34C759  │ 警告 #FF9500  │ 错误 #FF3B30  │ 信息 #5AC8FA│   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 字体规范

```css
/* 字体族定义 */
:root {
  /* 主字体 - 思源黑体 / Source Han Sans */
  --font-primary: "Source Han Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;

  /* 等宽字体 - 用于代码 */
  --font-mono: "SF Mono", "Monaco", "Consolas", monospace;

  /* 标题字体 */
  --font-heading: "Source Han Sans SC Bold", "PingFang SC Bold", sans-serif;
}

/* 字号层级 */
.text-h1 { font-size: 48px; font-weight: 700; line-height: 1.2; }
.text-h2 { font-size: 36px; font-weight: 700; line-height: 1.25; }
.text-h3 { font-size: 28px; font-weight: 600; line-height: 1.3; }
.text-h4 { font-size: 24px; font-weight: 600; line-height: 1.35; }
.text-h5 { font-size: 20px; font-weight: 600; line-height: 1.4; }
.text-h6 { font-size: 18px; font-weight: 600; line-height: 1.4; }

.text-body { font-size: 16px; font-weight: 400; line-height: 1.6; }
.text-small { font-size: 14px; font-weight: 400; line-height: 1.5; }
.text-caption { font-size: 12px; font-weight: 400; line-height: 1.4; }
```

### 1.3 间距系统

```css
/* 基础间距单位: 4px */
:root {
  --space-1: 4px;   /* 4px */
  --space-2: 8px;   /* 8px */
  --space-3: 12px;  /* 12px */
  --space-4: 16px;  /* 16px */
  --space-5: 20px;  /* 20px */
  --space-6: 24px;  /* 24px */
  --space-8: 32px;  /* 32px */
  --space-10: 40px; /* 40px */
  --space-12: 48px; /* 48px */
  --space-16: 64px; /* 64px */
}

/* 常用间距组合 */
.padding-page { padding: 0 24px; }
.margin-section { margin: 48px 0; }
.gap-card { gap: 16px; }
```

---

## 2. PPT 模板视觉规范

### 2.1 模板尺寸标准

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PPT 模板尺寸                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  标准比例: 16:9                                                     │
│  ┌─────────────────────────────────────────────┐                   │
│  │                                             │                   │
│  │              1600 x 900 px                  │                   │
│  │              (比例 16:9)                    │                   │
│  │                                             │                   │
│  │  ┌─────────────────────────────────────┐   │                   │
│  │  │           幻灯片内容区域              │   │
│  │  │                                     │   │
│  │  │                                     │   │
│  │  └─────────────────────────────────────┘   │                   │
│  │           边距: 60px                        │                   │
│  └─────────────────────────────────────────────┘                   │
│                                                                     │
│  最小尺寸: 960 x 540 px (等比缩放)                                  │
│  最大尺寸: 3840 x 2160 px (4K)                                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 科技风模板设计

```svg
<!-- 科技风模板 - 标题页 -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900">
  <defs>
    <!-- 渐变背景 -->
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0A1628"/>
      <stop offset="100%" style="stop-color:#165DFF"/>
    </linearGradient>

    <!-- 科技感装饰 -->
    <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#165DFF"/>
      <stop offset="100%" style="stop-color:#5AC8FA"/>
    </linearGradient>
  </defs>

  <!-- 背景 -->
  <rect width="1600" height="900" fill="url(#bgGradient)"/>

  <!-- 装饰线条 -->
  <line x1="0" y1="450" x2="600" y2="450" stroke="url(#accentGradient)" stroke-width="2" opacity="0.5"/>
  <line x1="1000" y1="450" x2="1600" y2="450" stroke="url(#accentGradient)" stroke-width="2" opacity="0.5"/>

  <!-- 装饰圆点 -->
  <circle cx="800" cy="200" r="80" fill="none" stroke="#165DFF" stroke-width="1" opacity="0.3"/>
  <circle cx="800" cy="200" r="120" fill="none" stroke="#5AC8FA" stroke-width="1" opacity="0.2"/>

  <!-- 标题 -->
  <text x="800" y="420" font-family="Source Han Sans SC" font-size="64"
        font-weight="bold" fill="#FFFFFF" text-anchor="middle">
    智能科技 引领未来
  </text>

  <!-- 副标题 -->
  <text x="800" y="500" font-family="Source Han Sans SC" font-size="28"
        fill="#5AC8FA" text-anchor="middle">
    RabAi Mind AI 演示文稿生成平台
  </text>

  <!-- 底部信息 -->
  <text x="800" y="850" font-family="Source Han Sans SC" font-size="18"
        fill="#999999" text-anchor="middle">
    2026 · RabAi Mind
  </text>
</svg>
```

### 2.3 模板类型

| 模板名称 | 风格 | 主色调 | 适用场景 |
|----------|------|--------|----------|
| 科技风 | 科技/现代 | #165DFF + #0A1628 | 科技公司、技术分享 |
| 商务风 | 专业/简洁 | #1A1A2E + #16213E | 商业汇报、企业介绍 |
| 活力风 | 活泼/创意 | #FF6B6B + #4ECDC4 | 营销活动、创意展示 |
| 学术风 | 严谨/典雅 | #2C3E50 + #ECF0F1 | 学术报告、论文答辩 |

---

## 3. Web 端 UI 组件

### 3.1 组件库结构

```
web/src/
├── components/
│   ├── common/              # 通用组件
│   │   ├── Button.vue       # 按钮
│   │   ├── Input.vue        # 输入框
│   │   ├── Select.vue       # 下拉选择
│   │   ├── Modal.vue        # 弹窗
│   │   ├── Slider.vue       # 滑块
│   │   └── Tooltip.vue      # 提示
│   │
│   ├── ppt/                 # PPT 相关组件
│   │   ├── PptPreview.vue  # PPT 预览
│   │   ├── SlideEditor.vue # 幻灯片编辑
│   │   ├── SlideThumbnail.vue
│   │   └── TemplateCard.vue # 模板卡片
│   │
│   ├── task/                # 任务相关组件
│   │   ├── TaskProgress.vue # 任务进度
│   │   ├── TaskStatus.vue   # 任务状态
│   │   └── TaskList.vue     # 任务列表
│   │
│   └── layout/              # 布局组件
│       ├── Header.vue       # 页头
│       ├── Footer.vue       # 页脚
│       └── Sidebar.vue      # 侧边栏
```

### 3.2 按钮组件

```vue
<!-- Button.vue -->
<template>
  <button
    :class="[
      'rabai-btn',
      `rabai-btn--${type}`,
      `rabai-btn--${size}`,
      { 'rabai-btn--disabled': disabled }
    ]"
    :disabled="disabled"
    @click="handleClick"
  >
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
// 按钮组件 - 支持多种类型和尺寸

interface Props {
  type?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost'
  size?: 'large' | 'medium' | 'small'
  disabled?: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'primary',
  size: 'medium',
  disabled: false,
  loading: false
})

const emit = defineEmits(['click'])

const handleClick = (e: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', e)
  }
}
</script>

<style scoped>
/* 按钮样式 */
.rabai-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 24px;
  font-family: var(--font-primary);
  font-size: 16px;
  font-weight: 500;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.rabai-btn--primary {
  background: linear-gradient(135deg, #165DFF 0%, #0A84FF 100%);
  color: #FFFFFF;
}

.rabai-btn--primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(22, 93, 255, 0.4);
}

.rabai-btn--primary:active {
  transform: translateY(0);
}

.rabai-btn--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
```

### 3.3 页面布局

```vue
<!-- AppLayout.vue -->
<template>
  <div class="app-layout">
    <Header />
    <main class="app-main">
      <router-view />
    </main>
    <Footer />
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #F5F5F5;
}

.app-main {
  flex: 1;
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}
</style>
```

---

## 4. SVG 渲染样式规范

### 4.1 SVG 基础规范

```xml
<!-- SVG 基础规范 -->
<svg xmlns="http://www.w3.org/2000/svg"
     xmlns:xlink="http://www.w3.org/1999/xlink"
     viewBox="0 0 1600 900"
     width="1600"
     height="900"
     preserveAspectRatio="xMidYMid meet">

  <!-- 必须包含 defs 定义 -->
  <defs>
    <!-- 字体定义 -->
    <style type="text/css">
      @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&amp;display=swap');
      .title { font-family: 'Noto Sans SC', sans-serif; font-weight: 700; }
      .body { font-family: 'Noto Sans SC', sans-serif; font-weight: 400; }
    </style>
  </defs>

  <!-- 背景 -->
  <rect width="100%" height="100%" fill="#FFFFFF"/>

  <!-- 内容区域 -->
  <g id="content">
    <!-- 幻灯片内容 -->
  </g>
</svg>
```

### 4.2 元素布局规范

```python
# SVG 布局常量
LAYOUT = {
    # 页面边距
    "margin": {
        "top": 60,
        "right": 60,
        "bottom": 60,
        "left": 60
    },

    # 标题区域
    "title": {
        "x": 60,
        "y": 120,
        "width": 1480,
        "height": 80,
        "font_size": 48,
        "font_weight": "bold"
    },

    # 内容区域
    "content": {
        "x": 60,
        "y": 220,
        "width": 1480,
        "height": 580
    },

    # 底部区域
    "footer": {
        "y": 840,
        "height": 40,
        "font_size": 14
    },

    # 元素间距
    "spacing": {
        "title_content": 20,
        "content_items": 24,
        "paragraph": 16
    }
}
```

### 4.3 颜色填充规范

```python
# PPT 主题颜色配置
THEME_COLORS = {
    "default": {
        "primary": "#165DFF",      # 主色
        "secondary": "#0A84FF",    # 辅色
        "background": "#FFFFFF",   # 背景
        "text_primary": "#000000", # 主文字
        "text_secondary": "#666666" # 次要文字
    },

    "tech": {
        "primary": "#165DFF",
        "secondary": "#0A1628",
        "background": "#0A1628",
        "text_primary": "#FFFFFF",
        "text_secondary": "#5AC8FA"
    },

    "business": {
        "primary": "#1A1A2E",
        "secondary": "#16213E",
        "background": "#FFFFFF",
        "text_primary": "#000000",
        "text_secondary": "#666666"
    },

    "vibrant": {
        "primary": "#FF6B6B",
        "secondary": "#4ECDC4",
        "background": "#FFFFFF",
        "text_primary": "#000000",
        "text_secondary": "#666666"
    }
}
```

---

## 5. 交互规范

### 5.1 动画规范

```css
/* 过渡动画 */
.transition-fast { transition: all 0.15s ease; }
.transition-normal { transition: all 0.25s ease; }
.transition-slow { transition: all 0.4s ease; }

/* 按钮悬停动画 */
.btn-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(22, 93, 255, 0.3);
}

/* 进度条动画 */
@keyframes progress {
  0% { width: 0%; }
  100% { width: var(--progress); }
}

.progress-bar {
  animation: progress 0.3s ease-out;
}

/* 加载动画 */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-spinner {
  animation: spin 1s linear infinite;
}
```

### 5.2 响应式断点

```css
/* 响应式断点 */
:root {
  --breakpoint-sm: 640px;   /* 手机横屏 */
  --breakpoint-md: 768px;   /* 平板 */
  --breakpoint-lg: 1024px;  /* 小屏笔记本 */
  --breakpoint-xl: 1280px;  /* 桌面 */
  --breakpoint-2xl: 1536px; /* 大屏 */
}

/* 响应式布局 */
@media (max-width: 768px) {
  .container {
    padding: 0 16px;
  }

  .text-h1 { font-size: 32px; }
  .text-h2 { font-size: 24px; }
}

@media (min-width: 1024px) {
  .container {
    max-width: 1200px;
    margin: 0 auto;
  }
}
```
