# Paperclip + OpenClaw 配置全过程总结

## 目录

1. [系统概述](#系统概述)
2. [环境准备](#环境准备)
3. [Paperclip 配置](#paperclip-配置)
4. [OpenClaw 配置](#openclaw-配置)
5. [Agent 配置](#agent-配置)
6. [任务创建机制](#任务创建机制)
7. [项目启动流程](#项目启动流程)
8. [常见问题与解决方案](#常见问题与解决方案)

---

## 系统概述

### 架构说明

```
┌─────────────────────────────────────────────────────────────┐
│                     Paperclip (任务管理)                      │
│  - 管理 Agent 和任务                                          │
│  - 提供心跳机制                                               │
│  - API 端口: 3100                                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   OpenClaw Gateway (AI 执行)                  │
│  - 执行 Agent 心跳                                            │
│  - 读取 Agent 配置文件                                        │
│  - WebSocket 端口: 18790                                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Agent 配置文件                              │
│  - SOUL.md: Agent 身份和职责                                  │
│  - heartbeat.md: 心跳执行流程                                 │
│  - 位置: ~/.openclaw/agents/{agent_id}/agent/                │
└─────────────────────────────────────────────────────────────┘
```

### 关键配置文件位置

| 文件 | 路径 | 说明 |
|------|------|------|
| OpenClaw 配置 | `~/.openclaw/openclaw.json` | OpenClaw 主配置 |
| Agent 配置 | `~/.openclaw/agents/{agent_id}/agent/` | Agent SOUL.md 等 |
| 任务创建 Skill | `~/.openclaw/.trae/skills/create-task/SKILL.md` | 任务创建模板 |
| 项目工作流 | `~/.openclaw/workspace/project-workflow.md` | 项目启动流程 |
| 项目代码 | `~/.openclaw/workspace/RabAiMind/` | 项目代码目录 |

---

## 环境准备

### 1. 启动 Paperclip

```bash
cd /Users/guige876/ai-dev-company/paperclip-app
pnpm dev
```

Paperclip 服务将在 `http://127.0.0.1:3100` 启动。

### 2. 启动 OpenClaw Gateway

```bash
openclaw gateway --force
```

OpenClaw Gateway 将在 `ws://127.0.0.1:18790` 启动。

---

## Paperclip 配置

### 1. 创建公司

```bash
curl -X POST "http://127.0.0.1:3100/api/companies" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "AI Dev Studio",
    "description": "AI 驱动的软件开发公司"
  }'
```

返回的公司 ID: `62c20d45-91c2-41b5-b3a8-1a109918c361`

### 2. 创建 Agent

```bash
curl -X POST "http://127.0.0.1:3100/api/companies/{company_id}/agents" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "CEO",
    "role": "ceo",
    "title": "首席执行官",
    "status": "active",
    "adapterType": "openclaw",
    "adapterConfig": {
      "url": "ws://127.0.0.1:18790",
      "scopes": ["operator.admin", "operator.write", "operator.read"],
      "authToken": "openclaw-local-token",
      "waitTimeoutMs": 1800000,
      "disableDeviceAuth": false
    }
  }'
```

### 3. 设置 Agent 权限

```bash
curl -X PATCH "http://127.0.0.1:3100/api/agents/{agent_id}/permissions" \
  -H "Content-Type: application/json" \
  -d '{"canCreateAgents": true}'
```

### 4. 创建项目

```bash
curl -X POST "http://127.0.0.1:3100/api/companies/{company_id}/projects" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "RabAiMind",
    "description": "AI 生成 PPT 的功能网站和小程序",
    "status": "planned"
  }'
```

---

## OpenClaw 配置

### 1. 主配置文件

`~/.openclaw/openclaw.json`:

```json
{
  "gateway": {
    "port": 18790,
    "host": "127.0.0.1"
  },
  "auth": {
    "tokens": ["openclaw-local-token"]
  },
  "agents": {
    "directory": "~/.openclaw/agents"
  }
}
```

### 2. Agent 配置目录结构

```
~/.openclaw/agents/
├── {agent_id}/
│   └── agent/
│       ├── SOUL.md          # Agent 身份和职责
│       ├── heartbeat.md     # 心跳执行流程
│       └── memory/          # 记忆存储
```

### 3. Agent ID 映射表

| 角色 | Agent ID |
|------|----------|
| CEO | 841a0fdf-8d10-4875-bdef-568ebe2d841f |
| CTO | 6d2cc1fd-07dd-4ecc-9869-2941944cb471 |
| COO | c26cbb3b-fae2-425a-9fb3-5c11d63896d1 |
| 产品总监 | 2f324fc6-613c-40d5-80d2-f1ede2bb2d3c |
| 前端Leader | dce1448c-ec31-4b23-b0c3-d1a8dc0711dc |
| 后端Leader | 6f6d7107-4ebb-48af-85b0-5f858f994483 |
| 前端工程师 | 5c94b676-5b47-4bbb-a2f6-7b85d5619cc2 |
| 后端工程师 | d1e7aaf0-db44-4706-bb2b-72f55c279774 |
| 测试工程师 | d4a3c534-0886-49f2-a493-8834d9448983 |
| 运维工程师 | 69bc324e-3192-4bfd-acf8-449e3cbe9dad |
| 产品经理 | 8fe9c002-446a-4810-b6cf-ecc49f7e5ce3 |
| 设计师 | acb0be94-da13-4346-b51a-4ba59b525aeb |

---

## Agent 配置

### SOUL.md 模板

```markdown
# {角色名称}

## Identity
你是 AI Dev Studio 的{角色}，负责{职责}。

## 项目目录 - 重要！

### 主项目目录
\`\`\`
/Users/guige876/.openclaw/workspace/RabAiMind
\`\`\`

### 工作目录说明
- **所有代码修改都在项目目录下**
- 使用 `cd /Users/guige876/.openclaw/workspace/RabAiMind` 切换目录

## Mission
{使命描述}

## Role
- {职责1}
- {职责2}

## Principles
1. {原则1}
2. {原则2}

## 任务创建技能 - 必须实际调用 API

### 重要：不要只说"分配任务"，必须实际创建！

当你需要分配任务时，**必须调用以下 API**：

\`\`\`bash
POST /api/companies/62c20d45-91c2-41b5-b3a8-1a109918c361/issues
\`\`\`

### 必填参数

\`\`\`json
{
  "title": "任务标题",
  "description": "任务描述（包含项目目录）",
  "status": "todo",
  "assigneeAgentId": "分配给的agent ID",
  "priority": "high"
}
\`\`\`

### 关键规则

1. **status 必须是 "todo"** - 任务才会被触发执行
2. **必须等待 API 响应** - 确认任务创建成功
3. **报告实际的任务 ID** - 如 "已创建任务 AI-18"

### 错误示范 vs 正确示范

- ❌ 错误：说"已分配任务"但没有调用 API
- ✅ 正确：调用 API 创建任务，报告"已创建任务 AI-XX"
```

### 心跳配置 (heartbeat.md)

```markdown
# 心跳配置

## 心跳参数

\`\`\`json
{
  "heartbeat": {
    "enabled": true,
    "intervalSec": 900,
    "cooldownSec": 10,
    "wakeOnDemand": true,
    "maxConcurrentRuns": 1
  }
}
\`\`\`

## 心跳执行流程

### 步骤 1: 检查自己的任务

\`\`\`bash
GET /api/companies/{company_id}/issues?assigneeAgentId={自己的ID}&status=todo,in_progress
\`\`\`

### 步骤 2: 检查下属的任务（领导角色）

\`\`\`bash
GET /api/companies/{company_id}/issues?assigneeAgentId={下属ID}&status=in_progress
\`\`\`

### 步骤 3: 主动追问和协调

在评论区添加追问：

\`\`\`bash
POST /api/issues/{issue_id}/comments
{
  "body": "【进度检查】\n\n请汇报当前进度..."
}
\`\`\`
```

---

## 任务创建机制

### 1. 任务创建 Skill

位置: `~/.openclaw/.trae/skills/create-task/SKILL.md`

### 2. 创建任务 API

```bash
curl -X POST "http://127.0.0.1:3100/api/companies/62c20d45-91c2-41b5-b3a8-1a109918c361/issues" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "任务标题",
    "description": "在 /Users/guige876/.openclaw/workspace/RabAiMind/backend 目录下实现功能...",
    "status": "todo",
    "assigneeAgentId": "d1e7aaf0-db44-4706-bb2b-72f55c279774",
    "priority": "high",
    "labels": ["backend", "api"]
  }'
```

### 3. 任务描述模板

任务描述应该包含：

1. **工作目录**: 明确指出代码在哪个目录
2. **具体要求**: 详细的技术要求
3. **参考文件**: 相关的现有文件路径

示例：

```json
{
  "description": "在 /Users/guige876/.openclaw/workspace/RabAiMind/backend 目录下实现 Redis 限流功能。\n\n要求：\n1. 在 backend/app/services/ 目录下创建 rate_limiter.py\n2. 使用 Redis 实现滑动窗口限流\n3. 限流规则：每用户每分钟100次请求\n\n参考：\n- backend/app/core/config.py - 配置文件\n- backend/app/main.py - 主入口"
}
```

### 4. 触发 Agent 心跳

```bash
curl -X POST "http://127.0.0.1:3100/api/agents/{agent_id}/wakeup" \
  -H "Content-Type: application/json" \
  -d '{"source": "on_demand"}'
```

---

## 项目启动流程

### 正确的项目启动顺序

```
阶段 1: 需求分析与设计文档
    ↓
阶段 2: 技术架构设计
    ↓
阶段 3: CEO 组织头脑风暴
    ↓
阶段 4: 开发计划制定
    ↓
阶段 5: 任务分配与开发启动
```

### 阶段详情

| 阶段 | 负责人 | 产出物 |
|------|--------|--------|
| 1. 需求分析 | 产品总监、产品经理 | PRD 文档 |
| 2. 技术架构 | CTO、后端Leader、前端Leader | 架构设计文档 |
| 3. 头脑风暴 | CEO | 完善的方案 |
| 4. 开发计划 | CEO、CTO | 开发计划文档 |
| 5. 开发启动 | 各领导角色 | 具体开发任务 |

---

## 常见问题与解决方案

### 问题 1: Agent 不创建任务，只说"已分配"

**原因**: AI 模型没有实际调用 API

**解决方案**:
1. 在 SOUL.md 中添加明确的任务创建指令
2. 使用 Skill 文件提供 API 调用模板
3. 强调"必须实际调用 API"

### 问题 2: Agent 不知道项目目录

**原因**: Paperclip workspace 的 `cwd` 为 `null`

**解决方案**:
1. 在每个 Agent 的 SOUL.md 中添加项目目录配置
2. 任务描述中包含工作目录信息
3. 使用完整路径描述任务

### 问题 3: 路径显示为 /Users/[]/ 格式

**原因**: 这是 Paperclip 的用户名脱敏机制

**说明**:
- Paperclip 会将用户名（如 `guige876`）替换为 `[]`
- 这是安全特性，用于保护用户隐私
- `/Users/guige876/` 在日志和评论中会显示为 `/Users/[]/`

**解决方案**:
- Agent 应该使用完整的绝对路径 `/Users/guige876/.openclaw/workspace/RabAiMind`
- 不要依赖日志中的路径格式

### 问题 4: Agent 等待依赖任务，但依赖已完成

**原因**: Agent 没有主动检查依赖任务状态

**解决方案**:
1. 在领导角色的 SOUL.md 中添加主动检查机制
2. 配置已完成的依赖任务列表
3. CEO 主动告知依赖状态

### 问题 4: 心跳运行失败

**原因**: adapterConfig 配置不完整

**解决方案**:
检查 adapterConfig 是否包含：
- `url`: `ws://127.0.0.1:18790`
- `scopes`: `["operator.admin", "operator.write", "operator.read"]`
- `authToken`: `openclaw-local-token`
- `waitTimeoutMs`: `1800000`

### 问题 5: Agent 没有权限创建任务

**原因**: `canCreateAgents` 权限未设置

**解决方案**:
```bash
curl -X PATCH "http://127.0.0.1:3100/api/agents/{agent_id}/permissions" \
  -H "Content-Type: application/json" \
  -d '{"canCreateAgents": true}'
```

---

## GitHub 代码推送配置

### 运维工程师职责

运维工程师负责将代码推送到 GitHub 仓库。

### 仓库信息

- **仓库地址**: https://github.com/guige2023/RabAiMind
- **默认分支**: main

### 推送流程

```bash
# 1. 配置 Git
git config --global user.name "AI Dev Studio"
git config --global user.email "ai-dev-studio@example.com"

# 2. 克隆仓库（首次）
cd /Users/guige876/.openclaw/workspace
git clone https://{token}@github.com/guige2023/RabAiMind.git

# 3. 推送代码
cd RabAiMind
git add .
git commit -m "feat: 更新代码"
git push origin main
```

---

## 附录

### API 端点汇总

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/companies/{id}` | GET | 获取公司信息 |
| `/api/companies/{id}/agents` | GET/POST | 获取/创建 Agent |
| `/api/agents/{id}` | GET/PATCH | 获取/更新 Agent |
| `/api/agents/{id}/permissions` | PATCH | 更新 Agent 权限 |
| `/api/agents/{id}/wakeup` | POST | 触发 Agent 心跳 |
| `/api/companies/{id}/issues` | GET/POST | 获取/创建任务 |
| `/api/issues/{id}` | GET/PATCH | 获取/更新任务 |
| `/api/issues/{id}/comments` | GET/POST | 获取/添加评论 |

### 项目目录结构

```
/Users/guige876/.openclaw/
├── openclaw.json              # OpenClaw 主配置
├── agents/                    # Agent 配置目录
│   └── {agent_id}/
│       └── agent/
│           ├── SOUL.md        # Agent 身份
│           └── heartbeat.md   # 心跳配置
├── workspace/                 # 项目工作目录
│   ├── RabAiMind/            # 项目代码
│   │   ├── backend/          # 后端代码
│   │   └── README.md
│   └── project-workflow.md   # 项目流程文档
└── .trae/
    └── skills/
        └── create-task/
            └── SKILL.md      # 任务创建 Skill
```

---

## 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0 | 2026-03-14 | 初始版本 |

---

*本文档记录了 Paperclip + OpenClaw 的完整配置过程，供后续参考和维护使用。*
