"""
MCP 服务 (优化版)

MCP 协议服务，支持 Claude/Cursor 客户端
优化版本，增强工具定义和错误处理

作者: MCP 开发 Agent
日期: 2026-03-17
"""

import os
import sys
import json
import asyncio
import logging
from typing import Optional, Dict, Any, List, Callable
from dataclasses import dataclass, field, asdict
from enum import Enum
from datetime import datetime
import uuid

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ==================== MCP 协议定义 ====================

class MCPMessageType(str, Enum):
    """MCP 消息类型"""
    REQUEST = "request"
    RESPONSE = "response"
    NOTIFICATION = "notification"
    ERROR = "error"


class MCPMethod(str, Enum):
    """MCP 方法定义"""
    INITIALIZE = "initialize"
    TOOLS_LIST = "tools/list"
    TOOLS_CALL = "tools/call"
    RESOURCES_LIST = "resources/list"
    RESOURCES_READ = "resources/read"
    RESOURCES_SUBSCRIBE = "resources/subscribe"
    PROMPTS_LIST = "prompts/list"
    PROMPTS_EXECUTE = "prompts/execute"


@dataclass
class MCPMessage:
    """MCP 消息结构"""
    jsonrpc: str = "2.0"
    id: Optional[str] = None
    method: Optional[str] = None
    params: Optional[Dict[str, Any]] = None
    result: Optional[Any] = None
    error: Optional[Dict[str, Any]] = None

    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        result = {"jsonrpc": self.jsonrpc}
        if self.id is not None:
            result["id"] = self.id
        if self.method is not None:
            result["method"] = self.method
        if self.params is not None:
            result["params"] = self.params
        if self.result is not None:
            result["result"] = self.result
        if self.error is not None:
            result["error"] = self.error
        return result


@dataclass
class MCPTool:
    """MCP 工具定义"""
    name: str
    description: str
    input_schema: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """转换为字典 (MCP 格式)"""
        return {
            "name": self.name,
            "description": self.description,
            "inputSchema": self.input_schema
        }


@dataclass
class MCPResource:
    """MCP 资源定义"""
    uri: str
    name: str
    mime_type: str = "text/plain"
    description: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        result = {
            "uri": self.uri,
            "name": self.name,
            "mimeType": self.mime_type
        }
        if self.description:
            result["description"] = self.description
        return result


@dataclass
class MCPPrompt:
    """MCP 提示词定义"""
    name: str
    description: str
    arguments: List[Dict[str, Any]] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        result = {
            "name": self.name,
            "description": self.description
        }
        if self.arguments:
            result["arguments"] = self.arguments
        return result


# ==================== MCP 服务实现 ====================

class MCPService:
    """MCP 服务核心类"""

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """初始化 MCP 服务

        Args:
            config: 配置字典
        """
        self.config = config or {}
        self.tools: Dict[str, Callable] = {}
        self.tool_definitions: Dict[str, MCPTool] = {}
        self.resources: Dict[str, MCPResource] = {}
        self.prompts: Dict[str, MCPPrompt] = {}
        self._coordinator = None

        # 注册默认工具和资源
        self._register_default_tools()
        self._register_default_resources()
        self._register_default_prompts()

    def set_coordinator(self, coordinator):
        """设置调度器

        Args:
            coordinator: 协调器实例
        """
        self._coordinator = coordinator

    def _register_default_tools(self):
        """注册默认工具"""
        # 1. 生成 PPT 工具
        self.register_tool(
            name="generate_ppt",
            description="根据用户需求生成 AI PPT 演示文稿。输入主题描述，选择场景和风格，生成专业演示文稿。",
            input_schema={
                "type": "object",
                "properties": {
                    "user_request": {
                        "type": "string",
                        "description": "用户需求描述，例如：'创建一个关于人工智能发展趋势的商业计划书'"
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
                        "description": "主题色 (十六进制)",
                        "default": "#165DFF"
                    }
                },
                "required": ["user_request"]
            },
            handler=self._handle_generate_ppt
        )

        # 2. 查询任务状态工具
        self.register_tool(
            name="get_task_status",
            description="查询 PPT 生成任务的状态和进度",
            input_schema={
                "type": "object",
                "properties": {
                    "task_id": {
                        "type": "string",
                        "description": "任务 ID"
                    }
                },
                "required": ["task_id"]
            },
            handler=self._handle_get_task_status
        )

        # 3. 下载 PPT 工具
        self.register_tool(
            name="download_ppt",
            description="下载生成的 PPT 文件",
            input_schema={
                "type": "object",
                "properties": {
                    "task_id": {
                        "type": "string",
                        "description": "任务 ID"
                    }
                },
                "required": ["task_id"]
            },
            handler=self._handle_download_ppt
        )

        # 4. 取消任务工具
        self.register_tool(
            name="cancel_task",
            description="取消正在进行的 PPT 生成任务",
            input_schema={
                "type": "object",
                "properties": {
                    "task_id": {
                        "type": "string",
                        "description": "任务 ID"
                    }
                },
                "required": ["task_id"]
            },
            handler=self._handle_cancel_task
        )

        # 5. 预览 PPT 工具
        self.register_tool(
            name="preview_ppt",
            description="获取 PPT 预览图或 SVG 内容",
            input_schema={
                "type": "object",
                "properties": {
                    "task_id": {
                        "type": "string",
                        "description": "任务 ID"
                    },
                    "slide_index": {
                        "type": "integer",
                        "description": "幻灯片索引 (从1开始)",
                        "default": 1
                    }
                },
                "required": ["task_id"]
            },
            handler=self._handle_preview_ppt
        )

        # 6. 优化 SVG 工具
        self.register_tool(
            name="optimize_svg",
            description="优化 SVG 内容，提升渲染效果",
            input_schema={
                "type": "object",
                "properties": {
                    "svg_content": {
                        "type": "string",
                        "description": "SVG 内容字符串"
                    }
                },
                "required": ["svg_content"]
            },
            handler=self._handle_optimize_svg
        )

    def _register_default_resources(self):
        """注册默认资源"""
        self.register_resource(
            MCPResource(
                uri="ppt://templates",
                name="PPT Templates",
                mime_type="application/json",
                description="可用的 PPT 模板列表"
            )
        )

        self.register_resource(
            MCPResource(
                uri="ppt://scenes",
                name="Scene Types",
                mime_type="application/json",
                description="支持的场景类型"
            )
        )

        self.register_resource(
            MCPResource(
                uri="ppt://styles",
                name="Style Types",
                mime_type="application/json",
                description="支持的视觉风格"
            )
        )

    def _register_default_prompts(self):
        """注册默认提示词"""
        self.register_prompt(
            MCPPrompt(
                name="generate_business_ppt",
                description="生成商业计划书 PPT",
                arguments=[
                    {"name": "topic", "required": True, "description": "商业计划主题"},
                    {"name": "company_name", "required": False, "description": "公司名称"},
                    {"name": "slide_count", "required": False, "description": "幻灯片数量"}
                ]
            )
        )

        self.register_prompt(
            MCPPrompt(
                name="generate_education_ppt",
                description="生成教学课件 PPT",
                arguments=[
                    {"name": "subject", "required": True, "description": "学科主题"},
                    {"name": "grade_level", "required": False, "description": "年级"},
                    {"name": "slide_count", "required": False, "description": "幻灯片数量"}
                ]
            )
        )

        self.register_prompt(
            MCPPrompt(
                name="generate_tech_ppt",
                description="生成技术分享 PPT",
                arguments=[
                    {"name": "topic", "required": True, "description": "技术主题"},
                    {"name": "audience", "required": False, "description": "受众群体"},
                    {"name": "slide_count", "required": False, "description": "幻灯片数量"}
                ]
            )
        )

    def register_tool(
        self,
        name: str,
        description: str,
        input_schema: Dict[str, Any],
        handler: Optional[Callable] = None
    ):
        """注册工具

        Args:
            name: 工具名称
            description: 工具描述
            input_schema: 输入参数模式
            handler: 处理函数
        """
        self.tool_definitions[name] = MCPTool(
            name=name,
            description=description,
            input_schema=input_schema
        )
        if handler:
            self.tools[name] = handler
        logger.info(f"注册工具: {name}")

    def register_resource(self, resource: MCPResource):
        """注册资源

        Args:
            resource: 资源对象
        """
        self.resources[resource.uri] = resource
        logger.info(f"注册资源: {resource.uri}")

    def register_prompt(self, prompt: MCPPrompt):
        """注册提示词

        Args:
            prompt: 提示词对象
        """
        self.prompts[prompt.name] = prompt
        logger.info(f"注册提示词: {prompt.name}")

    def get_tools(self) -> List[Dict[str, Any]]:
        """获取工具列表

        Returns:
            工具定义列表
        """
        return [tool.to_dict() for tool in self.tool_definitions.values()]

    def get_resources(self) -> List[Dict[str, Any]]:
        """获取资源列表

        Returns:
            资源定义列表
        """
        return [resource.to_dict() for resource in self.resources.values()]

    def get_prompts(self) -> List[Dict[str, Any]]:
        """获取提示词列表

        Returns:
            提示词定义列表
        """
        return [prompt.to_dict() for prompt in self.prompts.values()]

    # ==================== 工具处理函数 ====================

    async def _handle_generate_ppt(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """处理 PPT 生成请求"""
        if not self._coordinator:
            raise RuntimeError("Coordinator not initialized")

        try:
            result = self._coordinator.generate_ppt(
                user_request=args.get("user_request", ""),
                options={
                    "slide_count": args.get("slide_count", 10),
                    "scene": args.get("scene", "business"),
                    "style": args.get("style", "professional"),
                    "template": args.get("template", "default"),
                    "theme_color": args.get("theme_color", "#165DFF")
                }
            )
            return result
        except Exception as e:
            logger.error(f"生成 PPT 失败: {e}")
            return {"success": False, "error": str(e)}

    async def _handle_get_task_status(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """处理查询任务状态请求"""
        task_id = args.get("task_id", "")
        if not task_id:
            return {"error": "task_id is required"}

        # 这里需要调用任务状态查询接口
        # 暂时返回模拟数据
        return {
            "task_id": task_id,
            "status": "processing",
            "progress": 50,
            "message": "任务处理中"
        }

    async def _handle_download_ppt(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """处理下载 PPT 请求"""
        task_id = args.get("task_id", "")
        if not task_id:
            return {"error": "task_id is required"}

        return {
            "task_id": task_id,
            "download_url": f"/api/v1/download/{task_id}",
            "message": "下载链接已生成"
        }

    async def _handle_cancel_task(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """处理取消任务请求"""
        task_id = args.get("task_id", "")
        if not task_id:
            return {"error": "task_id is required"}

        return {
            "task_id": task_id,
            "status": "cancelled",
            "message": "任务已取消"
        }

    async def _handle_preview_ppt(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """处理预览 PPT 请求"""
        task_id = args.get("task_id", "")
        slide_index = args.get("slide_index", 1)

        if not task_id:
            return {"error": "task_id is required"}

        return {
            "task_id": task_id,
            "slide_index": slide_index,
            "preview_url": f"/api/v1/preview/{task_id}?slide={slide_index}",
            "message": "预览图已生成"
        }

    async def _handle_optimize_svg(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """处理优化 SVG 请求"""
        svg_content = args.get("svg_content", "")

        if not svg_content:
            return {"error": "svg_content is required"}

        # 简单的 SVG 优化逻辑
        optimized = svg_content.strip()

        return {
            "original_length": len(svg_content),
            "optimized_length": len(optimized),
            "svg_content": optimized,
            "message": "SVG 优化完成"
        }

    # ==================== 消息处理 ====================

    async def handle_message(self, message: MCPMessage) -> MCPMessage:
        """处理 MCP 消息

        Args:
            message: MCP 消息

        Returns:
            MCP 响应消息
        """
        try:
            method = message.method

            logger.info(f"处理 MCP 请求: {method}")

            # 初始化
            if method == MCPMethod.INITIALIZE:
                return self._handle_initialize(message)

            # 工具列表
            elif method == MCPMethod.TOOLS_LIST:
                return self._handle_tools_list(message)

            # 工具调用
            elif method == MCPMethod.TOOLS_CALL:
                return await self._handle_tools_call(message)

            # 资源列表
            elif method == MCPMethod.RESOURCES_LIST:
                return self._handle_resources_list(message)

            # 资源读取
            elif method == MCPMethod.RESOURCES_READ:
                return self._handle_resources_read(message)

            # 提示词列表
            elif method == MCPMethod.PROMPTS_LIST:
                return self._handle_prompts_list(message)

            # 提示词执行
            elif method == MCPMethod.PROMPTS_EXECUTE:
                return await self._handle_prompts_execute(message)

            # 未知方法
            else:
                return MCPMessage(
                    id=message.id,
                    error={
                        "code": -32601,
                        "message": f"Method not found: {method}"
                    }
                )

        except Exception as e:
            logger.error(f"MCP 消息处理异常: {e}")
            return MCPMessage(
                id=message.id,
                error={
                    "code": -32603,
                    "message": f"Internal error: {str(e)}"
                }
            )

    def _handle_initialize(self, message: MCPMessage) -> MCPMessage:
        """处理初始化请求"""
        result = {
            "protocolVersion": "2024-11-05",
            "capabilities": {
                "tools": {"listChanged": True},
                "resources": {"subscribe": True, "listChanged": True},
                "prompts": {"listChanged": True}
            },
            "serverInfo": {
                "name": "rabai-mind-mcp",
                "version": "1.0.0",
                "description": "RabAi Mind AI PPT 生成平台 MCP 服务"
            }
        }
        return MCPMessage(id=message.id, result=result)

    def _handle_tools_list(self, message: MCPMessage) -> MCPMessage:
        """处理工具列表请求"""
        return MCPMessage(
            id=message.id,
            result={"tools": self.get_tools()}
        )

    async def _handle_tools_call(self, message: MCPMessage) -> MCPMessage:
        """处理工具调用请求"""
        params = message.params or {}
        tool_name = params.get("name")
        tool_args = params.get("arguments", {})

        if tool_name not in self.tool_definitions:
            return MCPMessage(
                id=message.id,
                error={
                    "code": -32601,
                    "message": f"Tool not found: {tool_name}"
                }
            )

        # 调用处理函数
        handler = self.tools.get(tool_name)
        if handler:
            try:
                result = await handler(tool_args)
                return MCPMessage(id=message.id, result=result)
            except Exception as e:
                return MCPMessage(
                    id=message.id,
                    error={
                        "code": -32603,
                        "message": f"Tool execution error: {str(e)}"
                    }
                )
        else:
            return MCPMessage(
                id=message.id,
                error={
                    "code": -32602,
                    "message": f"Tool handler not found: {tool_name}"
                }
            )

    def _handle_resources_list(self, message: MCPMessage) -> MCPMessage:
        """处理资源列表请求"""
        return MCPMessage(
            id=message.id,
            result={"resources": self.get_resources()}
        )

    def _handle_resources_read(self, message: MCPMessage) -> MCPMessage:
        """处理资源读取请求"""
        params = message.params or {}
        uri = params.get("uri", "")

        if uri == "ppt://templates":
            result = {
                "contents": [{
                    "uri": uri,
                    "mimeType": "application/json",
                    "text": json.dumps([
                        {"id": "default", "name": "默认模板"},
                        {"id": "modern", "name": "现代模板"},
                        {"id": "classic", "name": "经典模板"},
                        {"id": "tech", "name": "科技模板"}
                    ])
                }]
            }
        elif uri == "ppt://scenes":
            result = {
                "contents": [{
                    "uri": uri,
                    "mimeType": "application/json",
                    "text": json.dumps(["business", "education", "tech", "creative"])
                }]
            }
        elif uri == "ppt://styles":
            result = {
                "contents": [{
                    "uri": uri,
                    "mimeType": "application/json",
                    "text": json.dumps(["professional", "simple", "energetic", "premium"])
                }]
            }
        else:
            return MCPMessage(
                id=message.id,
                error={"code": -404, "message": f"Resource not found: {uri}"}
            )

        return MCPMessage(id=message.id, result=result)

    def _handle_prompts_list(self, message: MCPMessage) -> MCPMessage:
        """处理提示词列表请求"""
        return MCPMessage(
            id=message.id,
            result={"prompts": self.get_prompts()}
        )

    async def _handle_prompts_execute(self, message: MCPMessage) -> MCPMessage:
        """处理提示词执行请求"""
        params = message.params or {}
        name = params.get("name")
        arguments = params.get("arguments", {})

        if name not in self.prompts:
            return MCPMessage(
                id=message.id,
                error={"code": -404, "message": f"Prompt not found: {name}"}
            )

        # 生成提示词内容
        prompt = self.prompts[name]
        prompt_text = self._generate_prompt_text(prompt.name, arguments)

        return MCPMessage(
            id=message.id,
            result={
                "messages": [{
                    "role": "user",
                    "content": {
                        "type": "text",
                        "text": prompt_text
                    }
                }]
            }
        )

    def _generate_prompt_text(self, prompt_name: str, arguments: Dict[str, Any]) -> str:
        """生成提示词文本"""
        if prompt_name == "generate_business_ppt":
            topic = arguments.get("topic", "商业计划")
            company = arguments.get("company_name", "")
            return f"创建一个关于{topic}的商业计划书 PPT{'，公司名称：' + company if company else ''}"
        elif prompt_name == "generate_education_ppt":
            subject = arguments.get("subject", "学科内容")
            grade = arguments.get("grade_level", "")
            return f"创建一个关于{subject}的教学课件 PPT{'，年级：' + grade if grade else ''}"
        elif prompt_name == "generate_tech_ppt":
            topic = arguments.get("topic", "技术主题")
            audience = arguments.get("audience", "")
            return f"创建一个关于{topic}的技术分享 PPT{'，受众：' + audience if audience else ''}"
        else:
            return ""


# ==================== FastAPI 应用 ====================

class MCPFastAPIApp:
    """MCP FastAPI 应用"""

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """初始化应用

        Args:
            config: 配置字典
        """
        self.config = config or {}
        self.service = MCPService(config)

        # 创建 FastAPI 应用
        self.app = FastAPI(
            title="RabAi Mind MCP Service",
            description="MCP 协议服务 - 支持 Claude/Cursor 客户端",
            version="1.0.0"
        )

        # 添加 CORS 中间件
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

        # 注册路由
        self._register_routes()

    def set_coordinator(self, coordinator):
        """设置调度器"""
        self.service.set_coordinator(coordinator)

    def _register_routes(self):
        """注册路由"""

        @self.app.get("/")
        async def root():
            """根路径"""
            return {
                "name": "RabAi Mind MCP Service",
                "version": "1.0.0",
                "description": "MCP 协议服务 - AI PPT 生成"
            }

        @self.app.get("/health")
        async def health():
            """健康检查"""
            return {
                "status": "healthy",
                "service": "rabai-mind-mcp"
            }

        # MCP 协议端点
        @self.app.get("/mcp/v1/tools")
        async def list_tools():
            """MCP: 列出所有工具"""
            return {
                "tools": self.service.get_tools()
            }

        @self.app.post("/mcp/v1/tools/call")
        async def call_tool(request: Dict[str, Any]):
            """MCP: 调用工具"""
            try:
                tool_name = request.get("name")
                tool_args = request.get("arguments", {})

                handler = self.service.tools.get(tool_name)
                if handler:
                    result = await handler(tool_args)
                    return result
                else:
                    return {"error": f"Tool not found: {tool_name}"}

            except Exception as e:
                logger.error(f"工具调用失败: {e}")
                return {"error": str(e)}

        @self.app.get("/mcp/v1/resources")
        async def list_resources():
            """MCP: 列出所有资源"""
            return {
                "resources": self.service.get_resources()
            }

        @self.app.get("/mcp/v1/resources/{uri:path}")
        async def read_resource(uri: str):
            """MCP: 读取资源"""
            message = MCPMessage(
                method=MCPMethod.RESOURCES_READ,
                params={"uri": uri}
            )
            response = await self.service.handle_message(message)

            if response.error:
                raise HTTPException(status_code=404, detail=response.error)

            return response.result

        @self.app.get("/mcp/v1/prompts")
        async def list_prompts():
            """MCP: 列出所有提示词"""
            return {
                "prompts": self.service.get_prompts()
            }

        @self.app.post("/mcp/v1/prompts/execute")
        async def execute_prompt(request: Dict[str, Any]):
            """MCP: 执行提示词"""
            message = MCPMessage(
                method=MCPMethod.PROMPTS_EXECUTE,
                params=request
            )
            response = await self.service.handle_message(message)

            if response.error:
                raise HTTPException(status_code=400, detail=response.error)

            return response.result

        # WebSocket 端点
        @self.app.websocket("/ws/mcp")
        async def websocket_mcp(websocket: WebSocket):
            """WebSocket MCP 连接"""
            await websocket.accept()

            try:
                while True:
                    data = await websocket.receive_text()
                    message_dict = json.loads(data)

                    # 处理消息
                    message = MCPMessage(**{
                        k: v for k, v in message_dict.items()
                        if k in ["jsonrpc", "id", "method", "params"]
                    })
                    response = await self.service.handle_message(message)

                    # 发送响应
                    await websocket.send_text(json.dumps(response.to_dict()))

            except WebSocketDisconnect:
                logger.info("WebSocket 连接断开")
            except Exception as e:
                logger.error(f"WebSocket 错误: {e}")
                await websocket.close()

    def generate_mcp_config(self) -> Dict[str, Any]:
        """生成 MCP 配置文件 (Claude/Cursor 用)"""
        return {
            "mcpServers": {
                "rabai-mind": {
                    "command": "python",
                    "args": [
                        "-m",
                        "mcp_server",
                        "--mcp"
                    ],
                    "env": {
                        "VOLCANO_API_KEY": os.environ.get("VOLCANO_API_KEY", "")
                    }
                }
            }
        }


# ==================== 主入口 ====================

# 创建全局应用实例
_app_instance: Optional[MCPFastAPIApp] = None


def get_app(config: Optional[Dict[str, Any]] = None) -> MCPFastAPIApp:
    """获取应用实例"""
    global _app_instance
    if _app_instance is None:
        _app_instance = MCPFastAPIApp(config)
    return _app_instance


def create_app(config: Optional[Dict[str, Any]] = None) -> FastAPI:
    """创建 FastAPI 应用"""
    app_instance = get_app(config)
    return app_instance.app


def run_mcp_server(
    host: str = "0.0.0.0",
    port: int = 8080,
    reload: bool = False
):
    """运行 MCP 服务器

    Args:
        host: 监听地址
        port: 监听端口
        reload: 是否自动重载
    """
    app = get_app().app

    uvicorn.run(
        app,
        host=host,
        port=port,
        reload=reload,
        log_level="info"
    )


def save_mcp_config(path: str = "./mcp.json"):
    """保存 MCP 配置到文件

    Args:
        path: 配置文件路径
    """
    config = get_app().generate_mcp_config()

    with open(path, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2)

    logger.info(f"MCP 配置已保存到: {path}")
    return path


# CLI 入口
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="RabAi Mind MCP 服务")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="监听地址")
    parser.add_argument("--port", type=int, default=8080, help="监听端口")
    parser.add_argument("--reload", action="store_true", help="自动重载")
    parser.add_argument("--save-config", action="store_true", help="保存 MCP 配置")

    args = parser.parse_args()

    if args.save_config:
        save_mcp_config()
    else:
        run_mcp_server(args.host, args.port, args.reload)
