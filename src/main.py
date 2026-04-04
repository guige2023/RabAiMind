# -*- coding: utf-8 -*-
"""
RabAi Mind API 主入口

所有配置通过 Settings 类读取，Settings 是唯一配置来源。
CORS 配置从环境变量 CORS_ORIGINS 读取（逗号分隔）。

作者: Claude
日期: 2026-03-17
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import api_router
from .config import settings, get_cors_origins
from .utils import setup_logger

# Import auth middleware
from .api.middleware.auth import AuthMiddleware

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

# 配置 CORS — 从环境变量读取
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册认证中间件 — 应用到所有 /api/v1/* 路由
app.add_middleware(AuthMiddleware)


# 注册路由
app.include_router(api_router)


@app.on_event("startup")
async def startup_event():
    """启动事件"""
    logger.info("RabAi Mind API 启动中...")
    logger.info(f"配置: 端口={settings.API_PORT}, 日志级别={settings.LOG_LEVEL}")
    logger.info(f"CORS 允许源: {settings.CORS_ORIGINS}")

    # 启动调度器（定时任务服务）
    from .services.scheduler_service import get_scheduler_service
    scheduler = get_scheduler_service()
    try:
        scheduler.start()
        logger.info("✅ 调度器 (SchedulerService) 已启动")
    except Exception as e:
        logger.warning(f"⚠️ 调度器启动失败: {e}")

    # P0 修复: 校验 VOLCANO_API_KEY
    if not settings.VOLCANO_API_KEY:
        logger.warning("⚠️ VOLCANO_API_KEY 未配置，AI 生成功能将无法使用！")
    else:
        logger.info(f"✅ VOLCANO_API_KEY 已配置 (key前4位: {settings.VOLCANO_API_KEY[:4]}...)")

    # P0 修复: 校验认证配置
    if settings.API_AUTH_ENABLED:
        if settings.JWT_SECRET == "your-secret-key-change-in-production":
            logger.warning("⚠️ API_AUTH 已启用但使用了默认 JWT_SECRET，请在 .env 中设置强密钥！")
        else:
            logger.info("✅ API 认证已启用")


@app.on_event("shutdown")
async def shutdown_event():
    """关闭事件"""
    logger.info("RabAi Mind API 关闭")

    # 停止调度器
    from .services.scheduler_service import get_scheduler_service
    try:
        get_scheduler_service().stop()
        logger.info("✅ 调度器 (SchedulerService) 已停止")
    except Exception as e:
        logger.warning(f"⚠️ 调度器停止失败: {e}")


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
