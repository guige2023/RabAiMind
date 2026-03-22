#!/usr/bin/env python3
"""
MCP Server for RabAi Mind PPT Generation

支持 Claude/Cursor 通过 MCP 协议调用 PPT 生成能力
"""

import os
import sys
import json
import asyncio
import logging
from typing import Any, Dict, List, Optional
from datetime import datetime
import uuid

logger = logging.getLogger(__name__)

# 添加项目路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.services.ppt_generator import PPTGenerator
from src.services.task_manager import get_task_manager


class MCPServer:
    """MCP 服务器 - 提供工具调用能力"""

    def __init__(self):
        self.generator = PPTGenerator()
        self.tools = self._register_tools()

    def _register_tools(self) -> Dict[str, Dict]:
        """注册可用工具"""
        return {
            "generate_ppt": {
                "description": "生成 PPT 演示文稿",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "user_request": {
                            "type": "string",
                            "description": "PPT 内容描述"
                        },
                        "slide_count": {
                            "type": "integer",
                            "description": "幻灯片数量",
                            "default": 10
                        },
                        "scene": {
                            "type": "string",
                            "description": "场景类型",
                            "enum": ["business", "education", "tech", "creative", "marketing", "finance", "medical", "government"],
                            "default": "business"
                        },
                        "style": {
                            "type": "string",
                            "description": "风格类型",
                            "enum": ["professional", "simple", "energetic", "premium"],
                            "default": "professional"
                        },
                        "theme_color": {
                            "type": "string",
                            "description": "主题色，如 #165DFF"
                        }
                    },
                    "required": ["user_request"]
                }
            },
            "get_task_status": {
                "description": "获取 PPT 生成任务状态",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "task_id": {
                            "type": "string",
                            "description": "任务 ID"
                        }
                    },
                    "required": ["task_id"]
                }
            },
            "list_templates": {
                "description": "获取可用模板列表",
                "input_schema": {
                    "type": "object",
                    "properties": {}
                }
            },
            "get_scenes": {
                "description": "获取支持的场景类型",
                "input_schema": {
                    "type": "object",
                    "properties": {}
                }
            }
        }

    async def handle_request(self, method: str, params: Dict) -> Any:
        """处理 MCP 请求"""
        if method == "initialize":
            return {
                "protocolVersion": "2024-11-05",
                "serverInfo": {
                    "name": "rabai-mind",
                    "version": "1.0.0"
                },
                "capabilities": {
                    "tools": {}
                }
            }

        elif method == "tools/list":
            return {"tools": [
                {
                    "name": name,
                    "description": info["description"],
                    "inputSchema": info["input_schema"]
                }
                for name, info in self.tools.items()
            ]}

        elif method == "tools/call":
            tool_name = params.get("name")
            tool_args = params.get("arguments", {})

            if tool_name == "generate_ppt":
                return await self._generate_ppt(tool_args)
            elif tool_name == "get_task_status":
                return await self._get_task_status(tool_args)
            elif tool_name == "list_templates":
                return await self._list_templates()
            elif tool_name == "get_scenes":
                return await self._get_scenes()
            else:
                raise ValueError(f"Unknown tool: {tool_name}")

        return None

    async def _generate_ppt(self, args: Dict) -> Dict:
        """生成 PPT"""
        task_id = f"mcp_{uuid.uuid4().hex[:12]}"

        result = await self.generator.generate(
            task_id=task_id,
            user_request=args.get("user_request", ""),
            slide_count=args.get("slide_count", 10),
            scene=args.get("scene", "business"),
            style=args.get("style", "professional"),
            theme_color=args.get("theme_color", "#165DFF")
        )

        return {
            "success": result.get("success", False),
            "task_id": task_id,
            "pptx_path": result.get("pptx_path"),
            "slide_count": result.get("slide_count"),
            "message": "PPT 生成完成" if result.get("success") else "生成失败"
        }

    async def _get_task_status(self, args: Dict) -> Dict:
        """获取任务状态"""
        task_manager = get_task_manager()
        task = task_manager.get_task(args.get("task_id", ""))

        if not task:
            return {"error": "任务不存在"}

        return {
            "task_id": task["task_id"],
            "status": task["status"],
            "progress": task.get("progress", 0),
            "current_step": task.get("current_step", ""),
            "result": task.get("result", {})
        }

    async def _list_templates(self) -> Dict:
        """列出模板"""
        return {
            "templates": [
                {"id": "default", "name": "默认模板"},
                {"id": "modern", "name": "现代模板"},
                {"id": "tech", "name": "科技模板"},
                {"id": "classic", "name": "经典模板"}
            ]
        }

    async def _get_scenes(self) -> Dict:
        """获取场景类型"""
        return {
            "scenes": [
                {"id": "business", "name": "商务"},
                {"id": "education", "name": "教育"},
                {"id": "tech", "name": "科技"},
                {"id": "creative", "name": "创意"},
                {"id": "marketing", "name": "营销"},
                {"id": "finance", "name": "金融"},
                {"id": "medical", "name": "医疗"},
                {"id": "government", "name": "政府"}
            ]
        }


async def main():
    """主入口"""
    import argparse

    parser = argparse.ArgumentParser(description="RabAi Mind MCP Server")
    parser.add_argument("--port", type=int, default=8080, help="端口")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="主机")
    args = parser.parse_args()

    mcp = MCPServer()

    # 简单的 HTTP 服务器处理 MCP 请求
    from aiohttp import web

    async def handle_jsonrpc(request):
        """处理 JSON-RPC 请求"""
        data = await request.json()

        method = data.get("method")
        params = data.get("params", {})
        msg_id = data.get("id")

        try:
            result = await mcp.handle_request(method, params)
            response = {
                "jsonrpc": "2.0",
                "id": msg_id,
                "result": result
            }
        except Exception as e:
            response = {
                "jsonrpc": "2.0",
                "id": msg_id,
                "error": {
                    "code": -32603,
                    "message": str(e)
                }
            }

        return web.json_response(response)

    app = web.Application()
    app.router.add_post("/", handle_jsonrpc)

    logger.info(f"MCP Server 启动: http://{args.host}:{args.port}")
    logger.info(f"可用工具: {list(mcp.tools.keys())}")

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, args.host, args.port)
    await site.start()

    # 保持运行
    await asyncio.Event().wait()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("MCP Server 已停止")
