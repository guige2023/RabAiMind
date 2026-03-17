"""
MCP 服务

MCP 协议服务，端口 8080
"""

import os
import sys
import json
from typing import Optional

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
import uvicorn

from agents.mcp_service_agent import MCPServiceAgent, create_mcp_agent


# 创建应用
app = FastAPI(
    title="RabAi Mind MCP Service",
    description="MCP 协议服务",
    version="1.0.0"
)

# 初始化 MCP Agent
_config = {
    "host": "0.0.0.0",
    "port": 8080
}

_mcp_agent: Optional[MCPServiceAgent] = None


def get_mcp_agent() -> MCPServiceAgent:
    """获取 MCP Agent"""
    global _mcp_agent
    if _mcp_agent is None:
        _mcp_agent = create_mcp_agent(_config)

        # 设置调度器
        from rabai_mind_agent import get_agent
        _mcp_agent.set_coordinator(get_agent())

    return _mcp_agent


# 注册路由
_mcp_agent = get_mcp_agent()
_mcp_agent._register_routes(app)


# 额外路由
@app.get("/")
async def root():
    """根路径"""
    return {
        "name": "RabAi Mind MCP Service",
        "version": "1.0.0",
        "description": "MCP 协议服务"
    }


@app.get("/health")
async def health_check():
    """健康检查"""
    return {
        "status": "healthy",
        "service": "rabai-mind-mcp"
    }


def run_mcp_server(
    host: str = "0.0.0.0",
    port: int = 8080,
    reload: bool = False
):
    """运行 MCP 服务器"""
    uvicorn.run(
        "mcp_server:app",
        host=host,
        port=port,
        reload=reload,
        log_level="info"
    )


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="RabAi Mind MCP 服务")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="监听地址")
    parser.add_argument("--port", type=int, default=8080, help="监听端口")
    parser.add_argument("--reload", action="store_true", help="自动重载")

    args = parser.parse_args()

    run_mcp_server(args.host, args.port, args.reload)
