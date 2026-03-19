# RabAiMind Composables

## 项目概述

RabAiMind 是一个AI驱动的PPT生成平台，使用Vue 3 + TypeScript开发。

## 架构

### 模块分层

```
src/composables/
├── modules/           # 统一导出
│   └── index.ts
├── useAI.ts          # AI统一模块
├── useExperience.ts  # 体验统一模块
├── useTemplate.ts    # 模板统一模块
├── useEditor.ts      # 编辑器模块
├── useMedia.ts       # 媒体模块
├── useExport.ts      # 导出模块
└── *.ts             # 其他功能模块
```

### 功能分组

| 分组 | 模块 |
|------|------|
| AI | useAI, useAIChat, useAIGenerationOptimizer |
| 体验 | useExperience, useUserExperience |
| 编辑 | useEditor, useRealTimePreview, usePerPagePreview |
| 媒体 | useMedia, useImageProcessor |
| 模板 | useTemplate, useTemplateMatcher |
| 主题 | useThemeManager, useThemeMarket |
| 字体 | useFontManager, useChineseFonts |
| 导出 | useExport, useMultiFormatExport |
| 协作 | useCollaborativeEdit |
| 核心 | useStateManager, useAppErrorHandler, usePerformanceMonitor |

## 核心模块

### useStateManager
统一状态管理，支持历史记录、持久化、验证。

### useAppErrorHandler
全局错误处理与恢复。

### usePerformanceMonitor
性能监控与优化建议。

### useFeatureIntegrator
功能模块集成与协调。

## 使用示例

```typescript
import { useAI, useEditor, useExport } from '@/composables/modules'

// AI对话
const ai = useAI()
await ai.sendMessage('生成PPT')

// 编辑器
const editor = useEditor()
editor.addSlide()

// 导出
const exporter = useExport()
await exporter.exportFile(slides)
```

## 开发规范

1. 单一职责 - 每个composable专注一个功能
2. 命名规范 - useXxx格式
3. 类型完整 - 完整的TypeScript类型
4. 文档注释 - 导出函数需注释
