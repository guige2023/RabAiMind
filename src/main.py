# -*- coding: utf-8 -*-
"""
RabAi Mind API 主入口

作者: Claude
日期: 2026-03-17
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import api_router
from .config import settings
from .utils import setup_logger

# 配置日志
logger = setup_logger("api")

# 创建 FastAPI 应用
app = FastAPI(
    title="RabAi Mind API",
    description="AI PPT 生成平台接口",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# 配置 CORS - 限制允许的源
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 注册路由
app.include_router(api_router)


@app.on_event("startup")
async def startup_event():
    """启动事件"""
    logger.info("RabAi Mind API 启动中...")
    logger.info(f"配置: 端口={settings.API_PORT}, 日志级别={settings.LOG_LEVEL}")


@app.on_event("shutdown")
async def shutdown_event():
    """关闭事件"""
    logger.info("RabAi Mind API 关闭")


# 运行服务
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "src.api:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=True,
        log_level=settings.LOG_LEVEL.lower()
    )
