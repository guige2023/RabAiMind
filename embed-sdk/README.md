# RabAiMind Embed SDK

在任意第三方网站嵌入 RabAiMind PPT 创建组件。

## 功能特性

- 🚀 **3 种嵌入方式**：iframe 直接嵌入、Web Component、自定义按钮弹窗
- 🎨 **主题支持**：light / dark / auto
- 🔐 **API Key 认证**：支持 X-API-Key Header
- 📡 **事件回调**：生成完成、进度更新、错误处理
- 🌐 **跨域安全**：基于 postMessage 通信，API Key 不暴露

---

## 快速开始

### 方式一：CDN 引入（推荐）

```html
<!-- 引入 SDK -->
<script src="https://cdn.rabaimind.com/embed-sdk/rabaimind-embed.js"></script>

<!-- 初始化 -->
<div id="ppt-container" style="width:800px;height:600px;"></div>

<script>
  const sdk = RabAiMind.init({
    container: '#ppt-container',
    apiUrl: 'https://api.rabaimind.com',   // 替换为你的 API 地址
    apiKey: 'your-api-key',                  // 替换为你的 API Key
    theme: 'light',
    onReady: () => console.log('✅ RabAiMind 已就绪'),
    onComplete: (taskId, result) => {
      console.log('PPT 生成完成', taskId);
      // 触发下载
      window.open(sdk.getDownloadUrl(taskId));
    },
    onError: (err) => console.error('❌ 出错:', err),
  });

  // 3 秒后自动生成（示例）
  setTimeout(() => {
    sdk.generate({
      userRequest: '请生成一份关于 AI 发展趋势的 PPT',
      scene: 'business',
      style: 'professional',
    });
  }, 1000);
</script>
```

### 方式二：Web Component（零配置）

```html
<!-- 直接使用自定义标签 -->
<rabaimind-embed
  api-url="https://api.rabaimind.com"
  api-key="your-api-key"
  theme="light"
  default-scene="business"
  default-style="professional"
  width="800"
  height="600"
></rabaimind-embed>

<script type="module" src="https://cdn.rabaimind.com/embed-sdk/rabaimind-embed.js"></script>

<script>
  // 监听事件
  document.querySelector('rabaimind-embed').addEventListener('complete', (e) => {
    console.log('PPT 完成', e.detail.taskId);
  });
</script>
```

### 方式三：弹窗模式（点击按钮触发）

```html
<button id="create-ppt-btn">📊 创建 PPT</button>

<script>
document.getElementById('create-ppt-btn').addEventListener('click', () => {
  const sdk = RabAiMind.openDialog({
    apiUrl: 'https://api.rabaimind.com',
    apiKey: 'your-api-key',
    width: 800,
    height: 650,
    onComplete: (taskId) => {
      // 自动下载
      window.location.href = sdk.getDownloadUrl(taskId);
    },
  });
});
</script>
```

---

## API 参考

### `RabAiMind.init(options)`

初始化 SDK，返回 SDK 实例。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `container` | string \| HTMLElement | ✅ | CSS 选择器或 DOM 元素 |
| `apiUrl` | string | ✅ | API 服务器地址 |
| `apiKey` | string | ❌ | API Key（无则匿名） |
| `theme` | string | ❌ | `light` / `dark` / `auto`（默认 auto） |
| `width` | number | ❌ | 宽度 px（默认 800） |
| `height` | number | ❌ | 高度 px（默认 600） |
| `locale` | string | ❌ | 语言 `zh-CN` / `en`（默认 zh-CN） |
| `defaultScene` | string | ❌ | 默认场景（默认 general） |
| `defaultStyle` | string | ❌ | 默认风格（默认 professional） |
| `defaultTitle` | string | ❌ | 默认 PPT 标题 |
| `onReady` | function | ❌ | SDK 就绪回调 |
| `onComplete` | function | ❌ | 生成完成回调 `(taskId, result) => {}` |
| `onError` | function | ❌ | 错误回调 `(error) => {}` |
| `onStatusChange` | function | ❌ | 状态变更回调 `(status) => {}` |

### `sdk.generate(options)`

触发 PPT 生成。

| 参数 | 类型 | 说明 |
|------|------|------|
| `userRequest` | string | 用户输入内容/主题 |
| `scene` | string | 场景类型 |
| `style` | string | 风格 |
| `title` | string | PPT 标题 |
| `slides` | Array | 自定义幻灯片大纲 |

```js
sdk.generate({
  userRequest: '生成一份关于产品发布会的 PPT',
  scene: 'marketing',
  style: 'creative',
  title: '2026 新品发布会',
});
```

### `sdk.getStatus(taskId)`

查询生成任务状态（返回 Promise）。

```js
const status = await sdk.getStatus('task_id_xxx');
console.log(status.status, status.progress);  // 'generating', 45
```

### `sdk.getDownloadUrl(taskId)`

获取 PPT 下载地址。

```js
const url = sdk.getDownloadUrl('task_id_xxx');
// => 'https://api.rabaimind.com/api/v1/ppt/download/task_id_xxx'
```

### `sdk.pollUntilComplete(taskId, onProgress, interval)`

轮询直到 PPT 生成完成（自动处理重试）。

```js
sdk.pollUntilComplete(
  'task_id_xxx',
  (status, progress) => {
    document.getElementById('progress').textContent = `生成中 ${progress}%`;
  },
  3000  // 每 3 秒轮询
);
```

### `sdk.destroy()`

销毁 SDK 实例，清理 iframe 和定时器。

---

## Web Component API

```html
<rabaimind-embed
  api-url="..."
  api-key="..."
  theme="light"
  width="800"
  height="600"
  default-scene="business"
  default-style="professional"
  default-title="我的 PPT"
></rabaimind-embed>
```

**属性**：`api-url`, `api-key`, `theme`, `width`, `height`, `default-scene`, `default-style`, `default-title`

**方法**（通过 JS 获取元素后调用）：
```js
const el = document.querySelector('rabaimind-embed');
el.generate({ userRequest: '...' });
el.getDownloadUrl(taskId);
el.getStatus(taskId);
```

**事件**：
- `ready` — 组件就绪
- `complete` — PPT 生成完成（`e.detail.taskId`, `e.detail.result`）
- `error` — 发生错误（`e.detail.error`）

---

## 事件列表（onStatusChange）

```js
sdk.on('status-change', (status) => {
  // status: { status: 'queued'|'generating'|'completed'|'failed', progress: 0-100, taskId }
  console.log(status.status, status.progress);
});
```

---

## 嵌入页面示例

### React

```jsx
import { useEffect, useRef } from 'react';

function PptCreator() {
  const containerRef = useRef(null);

  useEffect(() => {
    const sdk = window.RabAiMind.init({
      container: containerRef.current,
      apiUrl: 'https://api.rabaimind.com',
      apiKey: 'xxx',
      onComplete: (taskId) => console.log('Done', taskId),
    });
    return () => sdk.destroy();
  }, []);

  return <div ref={containerRef} style={{ width: 800, height: 600 }} />;
}
```

### Vue

```vue
<template>
  <div ref="container" style="width:800px;height:600px;"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const container = ref(null);
let sdk = null;

onMounted(() => {
  sdk = window.RabAiMind.init({
    container: container.value,
    apiUrl: 'https://api.rabaimind.com',
    apiKey: 'xxx',
    onComplete: (taskId) => console.log('Done', taskId),
  });
});

onUnmounted(() => sdk?.destroy());
</script>
```

---

## 安全说明

1. **API Key 保护**：API Key 通过 postMessage 发送到 iframe，**不会**出现在父页面 URL 或控制台。
2. **建议**：生产环境使用后端代理，父网站只传匿名请求，由后端附加 Key。
3. **CORS**：确保 API 服务器已配置允许嵌入来源的 CORS。

---

## iframe 嵌入（纯 HTML，无需 JS）

```html
<iframe
  src="https://api.rabaimind.com/embed?theme=light&locale=zh-CN&sdk=1"
  width="800"
  height="600"
  frameborder="0"
  allow="clipboard-write"
  title="RabAiMind PPT Creator"
></iframe>
```

Query 参数：
- `theme` — `light` / `dark` / `auto`
- `locale` — `zh-CN` / `en`
- `scene` — 默认场景
- `style` — 默认风格
- `title` — 默认标题
- `api_key` — API Key（不推荐，URL 会暴露）

---

## 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0.0 | 2026-04-04 | 初始版本：iframe + Web Component + Dialog 模式 |
