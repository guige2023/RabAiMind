"""
MCP 服务 Agent

负责 MCP（Model Context Protocol）服务扩展：
- 工具注册与管理
- 协议转换
- 请求路由
"""
import logging
from typing import Dict, Any, Callable, Optional

logger = logging.getLogger(__name__)


class MCPServiceAgent:
    """MCP 服务 Agent"""

    def __init__(self):
        self.name = "MCPServiceAgent"
        self.version = "1.0.0"
        self.tools: Dict[str, Callable] = {}
        self.sessions: Dict[str, dict] = {}

    def register_tool(self, name: str, handler: Callable, schema: Optional[dict] = None):
        """
        注册 MCP 工具

        Args:
            name: 工具名称
            handler: 处理函数 async def(params) -> dict
            schema: 工具参数 JSON Schema
        """
        self.tools[name] = {
            "handler": handler,
            "schema": schema or {},
            "name": name
        }
        logger.info(f"MCPService: 注册工具 {name}")

    def execute(self, tool: str, params: dict, session_id: Optional[str] = None) -> dict:
        """
        执行 MCP 工具

        Args:
            tool: 工具名称
            params: 工具参数
            session_id: 会话 ID
        Returns:
            执行结果
        """
        if tool not in self.tools:
            return {"error": f"Tool {tool} not found", "available": list(self.tools.keys())}

        try:
            handler = self.tools[tool]["handler"]
            result = handler(params)
            logger.info(f"MCPService: 执行 {tool} 成功")
            return {"status": "ok", "result": result}
        except Exception as e:
            logger.error(f"MCPService: 执行 {tool} 失败: {e}")
            return {"status": "error", "error": str(e)}

    def list_tools(self) -> dict:
        """列出所有可用工具"""
        return {
            "tools": [
                {"name": name, "schema": info["schema"]}
                for name, info in self.tools.items()
            ]
        }

    def health_check(self) -> dict:
        """健康检查"""
        return {"status": "ok", "version": self.version, "tools_count": len(self.tools)}
