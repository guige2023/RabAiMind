"""
FastAPI 接口服务

提供 Web/小程序接口，文件下载、异步任务等
"""

import os
import sys
from typing import Optional

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
import uvicorn

from agents.api_interface_agent import (
    APIInterfaceAgent,
    create_api_agent,
    TaskStatus
)


# 创建应用
app = FastAPI(
    title="RabAi Mind PPT API",
    description="AI PPT 生成平台接口",
    version="1.0.0"
)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 初始化 Agent
_config = {
    "output_dir": os.environ.get("OUTPUT_DIR", "./output"),
    "template_dir": os.environ.get("TEMPLATE_DIR", "./templates")
}

_api_agent: Optional[APIInterfaceAgent] = None


def get_api_agent() -> APIInterfaceAgent:
    """获取 API Agent"""
    global _api_agent
    if _api_agent is None:
        _api_agent = create_api_agent(_config)

        # 设置调度器
        from rabai_mind_agent import get_agent
        _api_agent.set_coordinator(get_agent())

    return _api_agent


# 注册路由
_api_agent = get_api_agent()
_api_agent._register_routes(app)


# 额外路由
@app.get("/")
async def root():
    """根路径"""
    return {
        "name": "RabAi Mind PPT API",
        "version": "1.0.0",
        "description": "AI PPT 生成平台",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """健康检查"""
    return {
        "status": "healthy",
        "service": "rabai-mind-ppt-api"
    }


@app.get("/api/v1/info")
async def get_service_info():
    """获取服务信息"""
    return {
        "name": "RabAi Mind",
        "version": "1.0.0",
        "features": [
            "AI PPT 生成",
            "多场景支持",
            "SVG 渲染",
            "PPTX 转换优化",
            "MCP 协议支持"
        ]
    }


def run_server(
    host: str = "0.0.0.0",
    port: int = 8000,
    reload: bool = False
):
    """运行服务器"""
    uvicorn.run(
        "api:app",
        host=host,
        port=port,
        reload=reload,
        log_level="info"
    )


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="RabAi Mind API 服务")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="监听地址")
    parser.add_argument("--port", type=int, default=8000, help="监听端口")
    parser.add_argument("--reload", action="store_true", help="自动重载")

    args = parser.parse_args()

    run_server(args.host, args.port, args.reload)
