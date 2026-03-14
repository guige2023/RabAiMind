"""MCP 搜索客户端模块"""
import json
from typing import Optional
import httpx
from app.core.config import settings


class MCPSearchClient:
    """MiniMax 官方 MCP 搜索服务器客户端"""

    def __init__(
        self,
        server_url: Optional[str] = None,
        api_key: Optional[str] = None,
    ):
        self.server_url = server_url or settings.mcp_server_url
        self.api_key = api_key or settings.minimax_api_key

    def get_schema(self) -> dict:
        """获取工具定义"""
        return {
            "name": "mcp_search",
            "description": "使用 MiniMax MCP 搜索服务器获取实时信息和网络搜索结果",
            "input_schema": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "搜索查询关键词"
                    },
                    "max_results": {
                        "type": "integer",
                        "description": "最大返回结果数",
                        "default": 5
                    }
                },
                "required": ["query"]
            }
        }

    async def execute(self, **kwargs) -> dict:
        """执行搜索查询"""
        query = kwargs.get("query", "")
        max_results = kwargs.get("max_results", 5)

        # 调用 MCP 搜索 API
        # 注意：这里使用 SSE 方式连接 MCP 服务器
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }

        body = {
            "jsonrpc": "2.0",
            "method": "tools/call",
            "params": {
                "name": "search",
                "arguments": {
                    "query": query,
                    "max_results": max_results
                }
            },
            "id": 1
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.server_url,
                    headers=headers,
                    json=body
                )

                if response.status_code == 200:
                    result = response.json()
                    return {
                        "success": True,
                        "results": result.get("result", []),
                    }
                else:
                    return {
                        "success": False,
                        "error": f"HTTP Error: {response.status_code}",
                        "detail": response.text,
                    }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
            }

    async def search_stream(self, query: str, max_results: int = 5):
        """流式搜索（实时信息流）"""
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }

        body = {
            "jsonrpc": "2.0",
            "method": "tools/call",
            "params": {
                "name": "search_stream",
                "arguments": {
                    "query": query,
                    "max_results": max_results
                }
            },
            "id": 1
        }

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                async with client.stream(
                    "POST",
                    self.server_url,
                    headers=headers,
                    json=body
                ) as response:
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            data = line[6:]
                            if data:
                                try:
                                    yield json.loads(data)
                                except:
                                    yield {"type": "text", "content": data}
        except Exception as e:
            yield {"type": "error", "error": str(e)}


class MCPClient:
    """通用 MCP 客户端 - 用于连接其他 MCP 服务器"""

    def __init__(
        self,
        server_url: str,
        api_key: Optional[str] = None,
    ):
        self.server_url = server_url
        self.api_key = api_key
        self.session_id = None

    async def initialize(self) -> dict:
        """初始化 MCP 会话"""
        headers = {
            "Content-Type": "application/json",
        }
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        body = {
            "jsonrpc": "2.0",
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {
                    "tools": {},
                    "resources": {},
                },
                "clientInfo": {
                    "name": "rabaimind-agent",
                    "version": "1.0.0"
                }
            },
            "id": 1
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.server_url,
                    headers=headers,
                    json=body
                )

                if response.status_code == 200:
                    result = response.json()
                    self.session_id = result.get("result", {}).get("sessionId")
                    return {
                        "success": True,
                        "server_info": result.get("result", {}).get("serverInfo", {}),
                    }
                else:
                    return {
                        "success": False,
                        "error": f"HTTP Error: {response.status_code}",
                    }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
            }

    async def list_tools(self) -> dict:
        """列出可用工具"""
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        if self.session_id:
            headers["Mcp-Session-Id"] = self.session_id

        body = {
            "jsonrpc": "2.0",
            "method": "tools/list",
            "params": {},
            "id": 2
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.server_url,
                    headers=headers,
                    json=body
                )

                if response.status_code == 200:
                    result = response.json()
                    return {
                        "success": True,
                        "tools": result.get("result", {}).get("tools", []),
                    }
                else:
                    return {
                        "success": False,
                        "error": f"HTTP Error: {response.status_code}",
                    }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
            }

    async def call_tool(self, name: str, arguments: dict) -> dict:
        """调用工具"""
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        if self.session_id:
            headers["Mcp-Session-Id"] = self.session_id

        body = {
            "jsonrpc": "2.0",
            "method": "tools/call",
            "params": {
                "name": name,
                "arguments": arguments
            },
            "id": 3
        }

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    self.server_url,
                    headers=headers,
                    json=body
                )

                if response.status_code == 200:
                    result = response.json()
                    return {
                        "success": True,
                        "result": result.get("result", {}),
                    }
                else:
                    return {
                        "success": False,
                        "error": f"HTTP Error: {response.status_code}",
                        "detail": response.text,
                    }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
            }
