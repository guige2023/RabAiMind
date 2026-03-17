# RabAi Mind 各端交互规范

## 一、Web端交互规范

### 1.1 页面结构

| 页面 | 路由 | 功能描述 |
|------|------|----------|
| 首页 | `/` | 引导入口、特性展示、快速开始 |
| 输入页 | `/create` | 需求输入、参数配置 |
| 生成页 | `/generating` | 进度展示、实时预览 |
| 结果页 | `/result` | 预览、下载、分享 |
| 历史页 | `/history` | 历史记录列表 |
| 详情页 | `/detail/:id` | 查看具体生成记录 |

### 1.2 接口规范

#### 1.2.1 提交生成任务

```
POST /api/v1/generate

请求头:
  Content-Type: application/json
  Authorization: Bearer {token}  # 可选

请求体:
{
  "user_request": "string",      // 用户需求描述 (必填, 10-2000字符)
  "slide_count": 10,             // 幻灯片数量 (可选, 默认10, 范围5-30)
  "scene": "business",           // 场景类型 (可选: business/education/tech/creative)
  "style": "professional",       // 风格 (可选: professional/simple/energetic/premium)
  "template": "default",         // 模板 (可选: default/modern/classic)
  "theme_color": "#165DFF",      // 主题色 (可选)
  "callback_url": "string"       // 回调地址 (可选)
}

响应 (202 Accepted):
{
  "success": true,
  "task_id": "uuid-string",
  "status": "pending",
  "message": "任务已提交",
  "estimated_time": 120          // 预计耗时(秒)
}

响应 (400 Bad Request):
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "用户需求不能为空",
  "details": {
    "field": "user_request",
    "reason": "required"
  }
}
```

#### 1.2.2 查询任务状态

```
GET /api/v1/task/{task_id}

响应 (200 OK):
{
  "success": true,
  "task_id": "uuid-string",
  "status": "processing",       // pending/processing/completed/failed/cancelled
  "progress": 65,                // 进度百分比 (0-100)
  "current_step": "generating",  // 当前步骤
  "created_at": "2026-03-17T10:00:00Z",
  "updated_at": "2026-03-17T10:01:30Z",
  "result": {
    "pptx_url": "/api/v1/download/xxx",
    "slide_count": 10,
    "file_size": 2048576
  },
  "error": null                  // 失败时才有值
}

响应 (404 Not Found):
{
  "success": false,
  "error": "TASK_NOT_FOUND",
  "message": "任务不存在"
}
```

#### 1.2.3 取消任务

```
POST /api/v1/task/{task_id}/cancel

响应 (200 OK):
{
  "success": true,
  "task_id": "uuid-string",
  "status": "cancelled",
  "message": "任务已取消"
}
```

#### 1.2.4 下载文件

```
GET /api/v1/download/{task_id}

响应:
  Content-Type: application/vnd.openxmlformats-officedocument.presentationml.presentation
  Content-Disposition: attachment; filename="presentation.pptx"

  [二进制文件流]
```

#### 1.2.5 预览SVG

```
GET /api/v1/preview/{task_id}?type=svg&slide=1

响应 (200 OK):
{
  "success": true,
  "slides": [
    {
      "slide_number": 1,
      "title": "幻灯片标题",
      "svg_url": "/api/v1/files/xxx/slide_1.svg",
      "thumbnail_url": "/api/v1/files/xxx/slide_1_thumb.jpg"
    }
  ]
}
```

### 1.3 前端状态管理

```typescript
// 任务状态机
interface TaskState {
  taskId: string | null;
  status: 'idle' | 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  currentStep: string;
  result: TaskResult | null;
  error: TaskError | null;
}

// 状态转换
// idle → pending → processing → completed
// idle → pending → processing → failed
// processing → cancelled
```

### 1.4 Web端错误码

| 错误码 | HTTP状态码 | 说明 | 处理方式 |
|--------|------------|------|----------|
| VALIDATION_ERROR | 400 | 参数校验失败 | 提示具体字段错误 |
| TASK_NOT_FOUND | 404 | 任务不存在 | 引导重新创建 |
| TASK_EXPIRED | 410 | 任务已过期 | 提示重新生成 |
| RATE_LIMIT | 429 | 请求过于频繁 | 提示稍后重试 |
| SERVER_ERROR | 500 | 服务器错误 | 提示稍后重试 |

---

## 二、小程序端交互规范

### 2.1 页面结构

| 页面 | 功能描述 |
|------|----------|
| 首页 | 快捷入口、模板推荐 |
| 创建页 | 语音/文字输入需求 |
| 生成页 | 微信推送通知进度 |
| 结果页 | 预览、发送给朋友 |

### 2.2 接口规范

#### 2.2.1 微信登录

```
POST /api/v1/auth/wx_login

请求体:
{
  "code": "微信授权code"
}

响应:
{
  "success": true,
  "token": "jwt-token",
  "user_id": "user-id"
}
```

#### 2.2.2 提交生成任务 (小程序)

```
POST /api/v1/generate

请求头:
  Authorization: Bearer {token}

请求体:
{
  "user_request": "string",
  "slide_count": 10,
  "scene": "business",
  "style": "professional",
  "notify_type": "wechat",        // 通知类型
  "openid": "wx-openid"           // 微信openid
}
```

### 2.3 微信通知模板

```
标题: PPT生成完成
内容: 您创建的"XXX"演示文稿已生成完成，点击查看详情。
```

---

## 三、MCP协议交互规范

### 3.1 MCP服务配置

```json
{
  "mcpServers": {
    "rabai-mind": {
      "command": "python",
      "args": ["mcp_server.py"],
      "env": {
        "API_KEY": "${RABAI_API_KEY}"
      }
    }
  }
}
```

### 3.2 MCP工具定义

#### 3.2.1 generate_ppt

```json
{
  "name": "generate_ppt",
  "description": "根据用户需求生成PPT演示文稿",
  "inputSchema": {
    "type": "object",
    "properties": {
      "user_request": {
        "type": "string",
        "description": "用户需求描述"
      },
      "slide_count": {
        "type": "integer",
        "description": "幻灯片数量",
        "default": 10,
        "minimum": 5,
        "maximum": 30
      },
      "scene": {
        "type": "string",
        "description": "场景类型",
        "enum": ["business", "education", "tech", "creative"],
        "default": "business"
      },
      "style": {
        "type": "string",
        "description": "风格",
        "enum": ["professional", "simple", "energetic", "premium"],
        "default": "professional"
      }
    },
    "required": ["user_request"]
  }
}
```

#### 3.2.2 get_task_status

```json
{
  "name": "get_task_status",
  "description": "查询PPT生成任务状态",
  "inputSchema": {
    "type": "object",
    "properties": {
      "task_id": {
        "type": "string",
        "description": "任务ID"
      }
    },
    "required": ["task_id"]
  }
}
```

#### 3.2.3 download_ppt

```json
{
  "name": "download_ppt",
  "description": "下载生成的PPT文件",
  "inputSchema": {
    "type": "object",
    "properties": {
      "task_id": {
        "type": "string",
        "description": "任务ID"
      }
    },
    "required": ["task_id"]
  }
}
```

### 3.3 Claude调用示例

```
用户: 帮我创建一个关于人工智能发展趋势的PPT

Claude → generate_ppt({
  user_request: "人工智能发展趋势分析",
  slide_count: 10,
  scene: "tech",
  style: "professional"
})

→ 返回 task_id
→ 轮询 get_task_status
→ 下载 download_ppt
```

---

## 四、响应规范

### 4.1 统一响应格式

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-03-17T10:00:00Z",
    "request_id": "req-uuid"
  }
}
```

### 4.2 错误响应格式

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": { ... }
  },
  "meta": {
    "timestamp": "2026-03-17T10:00:00Z",
    "request_id": "req-uuid"
  }
}
```

### 4.3 分页响应格式

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total": 100,
    "total_pages": 5
  }
}
```
