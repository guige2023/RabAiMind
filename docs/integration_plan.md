# RabAi Mind 现有项目集成方案

## 一、集成概述

本文档说明如何将 `mcp-server-okppt` 和 `Mini-Agent` 两个现有项目集成到 RabAi Mind 平台中。

### 1.1 项目定位

| 项目 | 定位 | 复用方式 |
|------|------|----------|
| Mini-Agent | AI Agent 调度中枢 | 作为核心调度框架，封装业务逻辑 |
| mcp-server-okppt | PPT 转换引擎 | 作为 MCP 工具，提供 SVG→PPTX 能力 |

### 1.2 集成架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          集成后的系统架构                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │                      RabAi Mind 业务层                           │  │
│   │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │  │
│   │  │ 业务 Agent      │  │ 火山引擎封装   │  │ 文件处理       │    │  │
│   │  │(Coordinator)    │  │(Volcano)      │  │(FileHandler)  │    │  │
│   │  └────────────────┘  └────────────────┘  └────────────────┘    │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                    │                                   │
│                                    ▼                                   │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │                      Mini-Agent 框架层                           │  │
│   │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │  │
│   │  │ LLM 客户端     │  │ 工具系统       │  │ 会话管理        │    │  │
│   │  │(火山引擎/Anthropic)│ │(Tools)        │  │(Messages)      │    │  │
│   │  └────────────────┘  └────────────────┘  └────────────────┘    │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                    │                                   │
│                                    ▼                                   │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │                      MCP 工具层                                 │  │
│   │  ┌─────────────────────────────────────────────────────────┐  │  │
│   │  │              mcp-server-okppt (PPT 工具)                  │  │  │
│   │  │  ┌────────────┐  ┌────────────┐  ┌────────────┐        │  │  │
│   │  │  │ SVG 渲染   │  │ PPT 操作    │  │ 布局分析    │        │  │  │
│   │  │  └────────────┘  └────────────┘  └────────────┘        │  │  │
│   │  └─────────────────────────────────────────────────────────┘  │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 二、Mini-Agent 集成方案

### 2.1 目录结构整合

```
# 将 Mini-Agent 复制到项目中
rabai_mind/
├── mini_agent/              # 从 Mini-Agent 复制
│   ├── __init__.py
│   ├── agent.py            # 核心 Agent 类
│   ├── llm/                # LLM 客户端
│   ├── tools/              # 工具系统
│   └── ...
└── agents/                 # 业务 Agent
    ├── coordinator_agent.py  # 复用 mini_agent.Agent
    └── ...
```

### 2.2 业务 Agent 继承设计

```python
# agents/coordinator_agent.py
"""
Coordinator Agent - 协调其他 Agent 完成 PPT 生成任务

继承 Mini-Agent 的 Agent 类，封装业务逻辑
"""

import sys
import os
from typing import Dict, Any, List, Optional

# 添加 Mini-Agent 路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'mini_agent'))

from mini_agent.agent import Agent
from mini_agent.llm import LLMClient
from mini_agent.schema import Message


class CoordinatorAgent(Agent):
    """PPT 生成协调 Agent

    负责协调火山引擎 Agent、SVG Agent、OkPPT Agent 完成 PPT 生成流程
    """

    def __init__(self, config: Dict[str, Any]):
        # 初始化 LLM 客户端 (火山引擎)
        llm_client = self._init_llm_client(config)

        # 定义系统提示词
        system_prompt = self._get_system_prompt()

        # 初始化工具列表
        tools = self._init_tools()

        # 调用父类构造函数
        super().__init__(
            llm_client=llm_client,
            system_prompt=system_prompt,
            tools=tools,
            max_steps=config.get('max_steps', 30),
            workspace_dir=config.get('workspace_dir', './workspace')
        )

    def _init_llm_client(self, config: Dict[str, Any]) -> LLMClient:
        """初始化 LLM 客户端"""
        from mini_agent.llm.llm_wrapper import LLMWrapper
        return LLMWrapper(
            provider='anthropic',  # 或火山引擎
            api_key=config.get('api_key'),
            model=config.get('model', 'claude-sonnet-4-20250514')
        )

    def _get_system_prompt(self) -> str:
        """获取系统提示词"""
        return """你是 RabAi Mind PPT 生成平台的协调 Agent。

你的职责是:
1. 理解用户需求
2. 调度火山引擎生成 PPT 内容
3. 协调 SVG 渲染
4. 调用 OkPPT 转换工具生成 PPTX

工作流程:
1. 解析用户需求，提取关键信息
2. 调用火山引擎生成幻灯片内容
3. 生成 SVG 页面
4. 转换为 PPTX 格式
5. 返回结果给用户

请按照用户需求生成专业的演示文稿。
"""

    def _init_tools(self) -> List:
        """初始化工具列表"""
        # 这里添加业务工具
        # 可以是 Python 函数或 MCP 工具
        return []

    async def generate_ppt(self, user_request: str, options: Dict[str, Any]) -> Dict[str, Any]:
        """生成 PPT 的主入口

        Args:
            user_request: 用户需求描述
            options: 生成选项

        Returns:
            生成结果
        """
        # 添加用户消息
        self.add_user_message(f"请帮我生成一个 PPT：{user_request}")

        # 执行 Agent 循环
        result = await self.run()

        return result
```

---

## 三、mcp-server-okppt 集成方案

### 3.1 目录结构整合

```
# 将 mcp-server-okppt 作为子模块
rabai_mind/
├── mcp_server_okppt/        # 从 mcp-server-okppt 复制
│   ├── src/
│   │   └── mcp_server_okppt/
│   │       ├── __init__.py
│   │       ├── server.py       # MCP 服务器
│   │       ├── svg_module.py   # SVG 模块
│   │       └── ppt_operations.py
│   └── ...
└── agents/
    └── okppt_agent.py          # 业务封装
```

### 3.2 OkPPT Agent 封装

```python
# agents/okppt_agent.py
"""
OkPPT Agent - PPT 转换 Agent

封装 mcp-server-okppt 的功能
"""

import sys
import os
from typing import Dict, Any, List, Optional

# 添加 mcp-server-okppt 路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'mcp_server_okppt', 'src'))

from mcp_server_okppt.svg_module import (
    insert_svg_to_pptx,
    create_svg_file,
    get_pptx_slide_count
)
from mcp_server_okppt.ppt_operations import (
    analyze_layout_details,
    insert_layout,
    clear_placeholder_content,
    assign_placeholder_content
)


class OkPPTAgent:
    """OkPPT 转换 Agent

    负责 SVG 到 PPTX 的转换
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.output_dir = self.config.get('output_dir', './output')
        os.makedirs(self.output_dir, exist_ok=True)

    def convert_svg_to_pptx(
        self,
        svg_files: List[str],
        output_path: str = None
    ) -> Dict[str, Any]:
        """将 SVG 文件转换为 PPTX

        Args:
            svg_files: SVG 文件路径列表
            output_path: 输出 PPTX 路径

        Returns:
            转换结果
        """
        if not output_path:
            output_path = os.path.join(self.output_dir, 'presentation.pptx')

        try:
            # 逐个插入 SVG 到 PPTX
            pptx_path = None
            for svg_file in svg_files:
                pptx_path = insert_svg_to_pptx(
                    svg_file,
                    pptx_path or output_path
                )

            # 获取幻灯片数量
            slide_count = get_pptx_slide_count(pptx_path)

            return {
                'success': True,
                'pptx_path': pptx_path,
                'slide_count': slide_count
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    def optimize_pptx(self, pptx_path: str) -> Dict[str, Any]:
        """优化 PPTX 文件

        Args:
            pptx_path: PPTX 文件路径

        Returns:
            优化结果
        """
        # 这里可以添加优化逻辑
        return {
            'success': True,
            'pptx_path': pptx_path
        }
```

---

## 四、集成示例

### 4.1 主流程集成

```python
# rabai_mind_agent.py
"""
RabAi Mind 主 Agent

集成 Mini-Agent 和 mcp-server-okppt
"""

import os
import sys
from typing import Dict, Any, Optional

# 路径配置
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
MINI_AGENT_PATH = os.path.join(PROJECT_ROOT, 'mini_agent')
MCP_OKPPT_PATH = os.path.join(PROJECT_ROOT, 'mcp_server_okppt', 'src')

# 添加到 Python 路径
sys.path.insert(0, MINI_AGENT_PATH)
sys.path.insert(0, MCP_OKPPT_PATH)


class RabAiMindAgent:
    """RabAi Mind 主 Agent

    整合 Mini-Agent 框架和 mcp-server-okppt 工具
    """

    def __init__(self, config: Optional[Dict] = None):
        self.config = config or {}

        # 初始化各组件
        self._init_coordinator()
        self._init_okppt_agent()

    def _init_coordinator(self):
        """初始化协调 Agent"""
        from agents.coordinator_agent import CoordinatorAgent
        self.coordinator = CoordinatorAgent(self.config.get('coordinator', {}))

    def _init_okppt_agent(self):
        """初始化 OkPPT Agent"""
        from agents.okppt_agent import OkPPTAgent
        self.okppt_agent = OkPPTAgent(self.config.get('okppt', {}))

    def generate_ppt(
        self,
        user_request: str,
        options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """生成 PPT 的主入口

        Args:
            user_request: 用户需求描述
            options: 生成选项

        Returns:
            生成结果
        """
        options = options or {}

        try:
            # 步骤 1: 协调 Agent 生成内容
            print("[1/4] 解析需求，生成内容...")
            slides = self.coordinator.generate_content(
                user_request=user_request,
                slide_count=options.get('slide_count', 10),
                scene=options.get('scene', 'business'),
                style=options.get('style', 'professional')
            )

            # 步骤 2: 生成 SVG
            print("[2/4] 渲染 SVG...")
            svg_files = self.coordinator.render_svg(slides)

            # 步骤 3: 转换为 PPTX
            print("[3/4] 转换为 PPTX...")
            result = self.okppt_agent.convert_svg_to_pptx(svg_files)

            if not result['success']:
                return {
                    'success': False,
                    'error': f"PPTX 转换失败: {result['error']}"
                }

            # 步骤 4: 优化 PPTX
            print("[4/4] 优化 PPTX...")
            self.okppt_agent.optimize_pptx(result['pptx_path'])

            return {
                'success': True,
                'pptx_path': result['pptx_path'],
                'slide_count': result['slide_count']
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }


# 全局实例
_agent_instance: Optional[RabAiMindAgent] = None


def get_agent(config: Optional[Dict] = None) -> RabAiMindAgent:
    """获取全局 Agent 实例"""
    global _agent_instance
    if _agent_instance is None:
        _agent_instance = RabAiMindAgent(config)
    return _agent_instance
```

---

## 五、部署配置

### 5.1 Docker 集成

```dockerfile
# Dockerfile
FROM python:3.10-slim

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    libreoffice \
    && rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 复制项目文件
COPY . /app

# 安装 Python 依赖
RUN pip install -r requirements.txt

# 暴露端口
EXPOSE 8000 8080

# 启动命令
CMD ["python", "api.py"]
```

### 5.2 docker-compose.yaml

```yaml
version: '3.8'

services:
  # FastAPI 主服务
  api:
    build: .
    ports:
      - "8000:8000"
      - "8080:8080"
    environment:
      - VOLCANO_API_KEY=${VOLCANO_API_KEY}
      - REDIS_URL=redis://redis:6379
      - MINIO_ENDPOINT=${MINIO_ENDPOINT}
    volumes:
      - ./output:/app/output
    depends_on:
      - redis
    restart: unless-stopped

  # Redis
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped

  # Worker
  worker:
    build: .
    command: python -m worker
    environment:
      - VOLCANO_API_KEY=${VOLCANO_API_KEY}
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
    restart: unless-stopped
```

---

## 六、总结

| 组件 | 来源 | 集成方式 |
|------|------|----------|
| Mini-Agent | 复用现有 | 作为核心框架，子类化 Agent 类 |
| mcp-server-okppt | 复用现有 | 作为 MCP 工具封装 |
| FastAPI | 新增 | Web 接口层 |
| Vue3 | 新增 | 前端界面 |

---

**文档版本历史**

| 版本 | 日期 | 修改人 | 修改内容 |
|------|------|--------|----------|
| v1.0.0 | 2026-03-17 | 技术架构师 Agent | 初始版本 |
