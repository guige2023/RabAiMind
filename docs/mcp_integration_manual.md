# RabAi Mind MCP 对接手册

## 文档信息

| 项目 | 内容 |
|------|------|
| 文档名称 | RabAi Mind MCP 对接手册 |
| 版本号 | v1.0.0 |
| 创建日期 | 2026-03-17 |
| MCP 开发工程师 | MCP 开发 Agent |

---

## 一、概述

### 1.1 什么是 MCP

MCP (Model Context Protocol) 是一个用于 AI 模型与外部系统交互的协议。RabAi Mind 通过 MCP 协议提供 PPT 生成能力，可以被 Claude Desktop、Cursor 等 AI 客户端调用。

### 1.2 功能清单

| 功能 | 说明 |
|------|------|
| 生成 PPT | 根据用户需求生成 AI PPT |
| 查询状态 | 查询任务生成状态 |
| 下载 PPT | 获取生成的 PPT 文件 |
| 预览 PPT | 获取 PPT 预览图 |
| 取消任务 | 取消正在进行的任务 |
| 优化 SVG | 优化 SVG 内容 |

---

## 二、快速开始

### 2.1 环境要求

| 要求 | 最低版本 |
|------|----------|
| Python | 3.10+ |
| FastAPI | 0.100+ |
| Redis | 6.0+ (可选) |

### 2.2 安装依赖

```bash
# 克隆项目
git clone https://github.com/your-repo/rabai-mind.git
cd rabai-mind

# 安装依赖
pip install -r requirements.txt

# 设置环境变量
export VOLCANO_API_KEY="your-api-key"
```

### 2.3 启动 MCP 服务

```bash
# 启动 MCP 服务 (默认端口 8080)
python mcp_server.py --port 8080

# 或使用优化版本
python mcp_server_optimized.py --port 8080

# 后台运行
nohup python mcp_server.py --port 8080 > mcp.log 2>&1 &
```

---

## 三、Claude Desktop 配置

### 3.1 获取 MCP 配置

MCP 服务启动后，运行以下命令生成配置文件：

```bash
python -m mcp_server --save-config
```

这会在当前目录生成 `mcp.json` 文件。

### 3.2 配置 Claude Desktop

1. 打开 Claude Desktop 设置
2. 点击 "Developer" → "Edit Config"
3. 在 `claude_desktop_config.json` 中添加：

```json
{
  "mcpServers": {
    "rabai-mind": {
      "command": "python",
      "args": [
        "-m",
        "mcp_server",
        "--mcp"
      ],
      "env": {
        "VOLCANO_API_KEY": "your-api-key"
      }
    }
  }
}
```

### 3.3 验证配置

1. 重启 Claude Desktop
2. 在对话中使用工具：

```
用户：帮我创建一个关于人工智能的PPT

Claude (调用 generate_ppt 工具):
{
  "user_request": "人工智能发展趋势",
  "slide_count": 10,
  "scene": "tech",
  "style": "professional"
}
→ 任务已提交，task_id: xxx
```

---

## 四、Cursor 配置

### 4.1 配置步骤

1. 打开 Cursor 设置
2. 进入 "Extensions" → "MCP"
3. 点击 "Add MCP Server"
4. 填写配置：

```json
{
  "name": "RabAi Mind",
  "command": "python",
  "args": [
    "-m",
    "mcp_server"
  ],
  "env": {
    "VOLCANO_API_KEY": "your-api-key"
  }
}
```

### 4.2 使用方式

在 Cursor 的 AI 聊天中，可以直接调用 PPT 生成工具：

```
@rabai-mind 生成一个关于量子计算的PPT
```

---

## 五、API 接口

### 5.1 工具列表

#### 5.1.1 generate_ppt

生成 AI PPT 演示文稿。

```json
{
  "name": "generate_ppt",
  "description": "根据用户需求生成 AI PPT 演示文稿",
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
        "description": "视觉风格",
        "enum": ["professional", "simple", "energetic", "premium"],
        "default": "professional"
      },
      "template": {
        "type": "string",
        "description": "模板类型",
        "enum": ["default", "modern", "classic", "tech"],
        "default": "default"
      },
      "theme_color": {
        "type": "string",
        "description": "主题色",
        "default": "#165DFF"
      }
    },
    "required": ["user_request"]
  }
}
```

#### 5.1.2 get_task_status

查询任务状态。

```json
{
  "name": "get_task_status",
  "description": "查询 PPT 生成任务的状态和进度",
  "inputSchema": {
    "type": "object",
    "properties": {
      "task_id": {
        "type": "string",
        "description": "任务 ID"
      }
    },
    "required": ["task_id"]
  }
}
```

#### 5.1.3 download_ppt

下载 PPT 文件。

```json
{
  "name": "download_ppt",
  "description": "下载生成的 PPT 文件",
  "inputSchema": {
    "type": "object",
    "properties": {
      "task_id": {
        "type": "string",
        "description": "任务 ID"
      }
    },
    "required": ["task_id"]
  }
}
```

#### 5.1.4 cancel_task

取消任务。

```json
{
  "name": "cancel_task",
  "description": "取消正在进行的 PPT 生成任务",
  "inputSchema": {
    "type": "object",
    "properties": {
      "task_id": {
        "type": "string",
        "description": "任务 ID"
      }
    },
    "required": ["task_id"]
  }
}
```

#### 5.1.5 preview_ppt

预览 PPT。

```json
{
  "name": "preview_ppt",
  "description": "获取 PPT 预览图或 SVG 内容",
  "inputSchema": {
    "type": "object",
    "properties": {
      "task_id": {
        "type": "string",
        "description": "任务 ID"
      },
      "slide_index": {
        "type": "integer",
        "description": "幻灯片索引",
        "default": 1
      }
    },
    "required": ["task_id"]
  }
}
```

#### 5.1.6 optimize_svg

优化 SVG。

```json
{
  "name": "optimize_svg",
  "description": "优化 SVG 内容",
  "inputSchema": {
    "type": "object",
    "properties": {
      "svg_content": {
        "type": "string",
        "description": "SVG 内容字符串"
      }
    },
    "required": ["svg_content"]
  }
}
```

### 5.2 REST API

| 接口 | 方法 | 说明 |
|------|------|------|
| /mcp/v1/tools | GET | 获取工具列表 |
| /mcp/v1/tools/call | POST | 调用工具 |
| /mcp/v1/resources | GET | 获取资源列表 |
| /mcp/v1/prompts | GET | 获取提示词列表 |
| /mcp/v1/prompts/execute | POST | 执行提示词 |

### 5.3 WebSocket API

| 端点 | 说明 |
|------|------|
| /ws/mcp | WebSocket MCP 连接 |

---

## 六、使用示例

### 6.1 Claude Desktop 示例

```
用户: 创建一个关于区块链技术的商业计划书PPT

Claude: (调用 generate_ppt 工具)
{
  "user_request": "区块链技术商业计划书",
  "slide_count": 12,
  "scene": "business",
  "style": "professional",
  "template": "modern"
}

→ 任务已提交，task_id: abc123

Claude: (调用 get_task_status 查询进度)
{
  "task_id": "abc123"
}

→ 任务状态: processing, 进度: 45%

[等待任务完成...]

Claude: (再次查询)
→ 任务状态: completed, 文件已生成

Claude: (调用 download_ppt 下载文件)
{
  "task_id": "abc123"
}

→ 下载链接: /api/v1/download/abc123
```

### 6.2 cURL 示例

```bash
# 列出工具
curl http://localhost:8080/mcp/v1/tools

# 调用生成工具
curl -X POST http://localhost:8080/mcp/v1/tools/call \
  -H "Content-Type: application/json" \
  -d '{
    "name": "generate_ppt",
    "arguments": {
      "user_request": "测试PPT",
      "slide_count": 5
    }
  }'

# 查询任务状态
curl http://localhost:8080/mcp/v1/task/abc123

# 列出资源
curl http://localhost:8080/mcp/v1/resources
```

### 6.3 Python 示例

```python
import requests
import json

# MCP 服务地址
MCP_URL = "http://localhost:8080"

# 调用生成工具
def generate_ppt(user_request, slide_count=10, scene="business"):
    response = requests.post(
        f"{MCP_URL}/mcp/v1/tools/call",
        json={
            "name": "generate_ppt",
            "arguments": {
                "user_request": user_request,
                "slide_count": slide_count,
                "scene": scene
            }
        }
    )
    return response.json()

# 查询任务状态
def get_task_status(task_id):
    response = requests.get(f"{MCP_URL}/mcp/v1/task/{task_id}")
    return response.json()

# 使用示例
result = generate_ppt("创建一个关于AI的PPT")
print(result)
```

---

## 七、错误处理

### 7.1 错误码

| 错误码 | 说明 |
|--------|------|
| -32600 | 无效请求 |
| -32601 | 方法未找到 |
| -32602 | 无效参数 |
| -32603 | 内部错误 |
| -404 | 资源未找到 |

### 7.2 常见错误

| 错误 | 原因 | 解决方案 |
|------|------|----------|
| Tool not found | 工具名称错误 | 检查工具名称拼写 |
| Coordinator not initialized | 服务未正确初始化 | 重启服务 |
| VOLCANO_API_KEY not set | 未设置 API 密钥 | 设置环境变量 |
| Task not found | 任务 ID 错误 | 检查任务 ID |

---

## 八、配置选项

### 8.1 环境变量

| 变量名 | 必填 | 说明 |
|--------|------|------|
| VOLCANO_API_KEY | 是 | 火山引擎 API 密钥 |
| REDIS_URL | 否 | Redis 连接地址 |
| LOG_LEVEL | 否 | 日志级别 (DEBUG/INFO/WARNING/ERROR) |

### 8.2 启动参数

| 参数 | 默认值 | 说明 |
|------|--------|------|
| --host | 0.0.0.0 | 监听地址 |
| --port | 8080 | 监听端口 |
| --reload | False | 自动重载 |

---

## 九、故障排查

### 9.1 服务无法启动

```bash
# 检查端口是否被占用
lsof -i :8080

# 检查依赖是否安装
pip install -r requirements.txt

# 查看日志
tail -f mcp.log
```

### 9.2 工具无法调用

```bash
# 检查 MCP 服务是否运行
curl http://localhost:8080/health

# 检查工具列表
curl http://localhost:8080/mcp/v1/tools
```

### 9.3 PPT 生成失败

```bash
# 检查 API 密钥
echo $VOLCANO_API_KEY

# 检查火山引擎服务状态
```

---

## 十、附录

### 10.1 完整 MCP 配置示例

```json
{
  "mcpServers": {
    "rabai-mind": {
      "command": "python",
      "args": [
        "-m",
        "mcp_server"
      ],
      "env": {
        "VOLCANO_API_KEY": "your-api-key-here",
        "LOG_LEVEL": "INFO"
      }
    }
  }
}
```

### 10.2 版本历史

| 版本 | 日期 | 修改内容 |
|------|------|----------|
| v1.0.0 | 2026-03-17 | 初始版本 |

---

**技术支持**: 如有问题，请提交 Issue 或联系维护者。
