"""
MCP 服务 Agent (MCP Service Agent)

负责扩展 mcp-server-okppt 的 MCP 协议，适配 Claude/Cursor 客户端
"""

import os
import json
import asyncio
from typing import Dict, Any, List, Optional, Callable
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime
import uuid

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from starlette.requests import Request
from starlette.responses import JSONResponse


class MCPMessageType(str, Enum):
    """MCP 消息类型"""
    REQUEST = "request"
    RESPONSE = "response"
    NOTIFICATION = "notification"
    ERROR = "error"


class MCPMethod(str, Enum):
    """MCP 方法"""
    INITIALIZE = "initialize"
    TOOLS_LIST = "tools/list"
    TOOLS_CALL = "tools/call"
    RESOURCES_LIST = "resources/list"
    RESOURCES_READ = "resources/read"
    PROMPTS_LIST = "prompts/list"
    PROMPTS_EXECUTE = "prompts/execute"


@dataclass
class MCPMessage:
    """MCP 消息"""
    jsonrpc: str = "2.0"
    id: Optional[str] = None
    method: Optional[str] = None
    params: Optional[Dict] = None
    result: Optional[Any] = None
    error: Optional[Dict] = None


@dataclass
class MCPTool:
    """MCP 工具"""
    name: str
    description: str
    input_schema: Dict[str, Any]


class MCPService:
    """MCP 服务"""

    def __init__(self, config: Optional[Dict] = None):
        self.config = config or {}
        self.tools: Dict[str, Callable] = {}
        self._register_default_tools()

    def _register_default_tools(self):
        """注册默认工具"""
        # 这些工具会通过 MCP 暴露
        self.register_tool(
            "generate_ppt",
            "生成 AI PPT",
            {
                "type": "object",
                "properties": {
                    "user_request": {
                        "type": "string",
                        "description": "用户需求描述"
                    },
                    "slide_count": {
                        "type": "integer",
                        "description": "幻灯片数量",
                        "default": 10
                    },
                    "scene": {
                        "type": "string",
                        "description": "场景类型",
                        "enum": ["business", "education", "marketing", "technology", "personal"],
                        "default": "business"
                    }
                },
                "required": ["user_request"]
            }
        )

        self.register_tool(
            "optimize_svg",
            "优化 SVG 内容",
            {
                "type": "object",
                "properties": {
                    "svg_content": {
                        "type": "string",
                        "description": "SVG 内容"
                    }
                },
                "required": ["svg_content"]
            }
        )

    def register_tool(self, name: str, description: str, input_schema: Dict):
        """注册工具"""
        self.tools[name] = MCPTool(
            name=name,
            description=description,
            input_schema=input_schema
        )

    def get_tools(self) -> List[MCPTool]:
        """获取工具列表"""
        return list(self.tools.values())

    async def handle_message(self, message: MCPMessage) -> MCPMessage:
        """处理 MCP 消息"""
        try:
            method = message.method

            if method == MCPMethod.INITIALIZE:
                result = {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {
                        "tools": {"listChanged": True},
                        "resources": {"subscribe": True},
                        "prompts": {"listChanged": True}
                    },
                    "serverInfo": {
                        "name": "rabai-mind-mcp",
                        "version": "1.0.0"
                    }
                }
                return MCPMessage(id=message.id, result=result)

            elif method == MCPMethod.TOOLS_LIST:
                tools = [
                    {
                        "name": tool.name,
                        "description": tool.description,
                        "inputSchema": tool.input_schema
                    }
                    for tool in self.get_tools()
                ]
                return MCPMessage(id=message.id, result={"tools": tools})

            elif method == MCPMethod.TOOLS_CALL:
                params = message.params or {}
                tool_name = params.get("name")
                tool_args = params.get("arguments", {})

                if tool_name not in self.tools:
                    return MCPMessage(
                        id=message.id,
                        error={
                            "code": -32601,
                            "message": f"Tool not found: {tool_name}"
                        }
                    )

                # 执行工具（这里需要调用实际的工具函数）
                # result = await self._execute_tool(tool_name, tool_args)
                result = {"status": "success", "message": f"Tool {tool_name} executed"}

                return MCPMessage(id=message.id, result=result)

            else:
                return MCPMessage(
                    id=message.id,
                    error={
                        "code": -32601,
                        "message": f"Method not found: {method}"
                    }
                )

        except Exception as e:
            return MCPMessage(
                id=message.id,
                error={
                    "code": -32603,
                    "message": str(e)
                }
            )


class MCPServiceAgent:
    """
    MCP 服务 Agent

    负责:
    - 扩展 mcp-server-okppt 的 MCP 协议
    - 适配 Claude/Cursor 客户端
    - mcp.json 配置
    """

    def __init__(self, config: Optional[Dict] = None):
        self.config = config or {}
        self.host = self.config.get("host", "0.0.0.0")
        self.port = self.config.get("port", 8080)
        self.service = MCPService(config)
        self.app = None
        self._coordinator = None
        self._connection_manager = None

    def set_coordinator(self, coordinator):
        """设置调度器"""
        self._coordinator = coordinator

    def create_app(self) -> FastAPI:
        """创建 MCP 服务应用"""
        from fastapi import FastAPI

        app = FastAPI(
            title="RabAi Mind MCP Service",
            description="MCP 协议服务",
            version="1.0.0"
        )

        self._register_routes(app)
        self.app = app
        return app

    def _register_routes(self, app: FastAPI):
        """注册路由"""

        @app.get("/")
        async def root():
            return {
                "name": "RabAi Mind MCP Service",
                "version": "1.0.0"
            }

        @app.get("/health")
        async def health():
            return {"status": "healthy"}

        @app.get("/mcp/v1/tools")
        async def list_tools():
            """MCP: 列出工具"""
            tools = self.service.get_tools()
            return {
                "tools": [
                    {
                        "name": t.name,
                        "description": t.description,
                        "inputSchema": t.input_schema
                    }
                    for t in tools
                ]
            }

        @app.post("/mcp/v1/tools/call")
        async def call_tool(request: Dict):
            """MCP: 调用工具"""
            try:
                tool_name = request.get("name")
                tool_args = request.get("arguments", {})

                if not self._coordinator:
                    return {"error": "Coordinator not set"}

                # 执行 PPT 生成
                if tool_name == "generate_ppt":
                    result = self._coordinator.generate_ppt(
                        user_request=tool_args.get("user_request", ""),
                        options={
                            "slide_count": tool_args.get("slide_count", 10),
                            "scene": tool_args.get("scene", "business"),
                            "style": tool_args.get("style", "professional")
                        }
                    )
                    return result

                return {"error": f"Unknown tool: {tool_name}"}

            except Exception as e:
                return {"error": str(e)}

        @app.get("/mcp/v1/resources")
        async def list_resources():
            """MCP: 列出资源"""
            return {
                "resources": [
                    {
                        "uri": "ppt://templates",
                        "name": "PPT Templates",
                        "mimeType": "application/vnd.openxmlformats-officedocument.presentationml.presentation"
                    }
                ]
            }

        @app.get("/mcp/v1/prompts")
        async def list_prompts():
            """MCP: 列出提示词"""
            return {
                "prompts": [
                    {
                        "name": "generate_business_ppt",
                        "description": "生成商业计划书 PPT",
                        "arguments": [
                            {"name": "topic", "required": True}
                        ]
                    },
                    {
                        "name": "generate_education_ppt",
                        "description": "生成教学课件 PPT",
                        "arguments": [
                            {"name": "subject", "required": True}
                        ]
                    }
                ]
            }

        @app.websocket("/ws/mcp")
        async def websocket_mcp(websocket: WebSocket):
            """WebSocket MCP 连接"""
            await websocket.accept()

            try:
                while True:
                    data = await websocket.receive_text()
                    message = json.loads(data)

                    # 处理消息
                    response = await self.service.handle_message(
                        MCPMessage(**message)
                    )

                    # 发送响应
                    await websocket.send_text(json.dumps({
                        "jsonrpc": response.jsonrpc,
                        "id": response.id,
                        "result": response.result,
                        "error": response.error
                    }))

            except WebSocketDisconnect:
                pass

    def generate_mcp_config(self) -> Dict[str, Any]:
        """生成 MCP 配置文件"""
        return {
            "mcpServers": {
                "rabai-mind": {
                    "command": "python",
                    "args": [
                        "-m",
                        "rabai_mind_agent",
                        "--mcp"
                    ],
                    "env": {
                        "VOLCANO_API_KEY": os.environ.get("VOLCANO_API_KEY", ""),
                        "VOLCANO_SECRET": os.environ.get("VOLCANO_SECRET", "")
                    }
                }
            }
        }

    def save_mcp_config(self, path: str = "./mcp.json"):
        """保存 MCP 配置"""
        config = self.generate_mcp_config()

        with open(path, "w", encoding="utf-8") as f:
            json.dump(config, f, indent=2)

        return path


def create_mcp_agent(config: Optional[Dict] = None) -> MCPServiceAgent:
    """创建 MCP 服务 Agent"""
    return MCPServiceAgent(config)
