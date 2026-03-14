"""FastAPI应用入口"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logging import setup_logging
from app.core.exceptions import setup_exception_handlers, RequestLoggingMiddleware
from app.core.jwt_middleware import JWTMiddleware
from app.api.routes import files, agent, auth

# 初始化日志
setup_logging()

app = FastAPI(
    title=settings.app_name,
    description="RabAiMind 后端API",
    version="1.0.0",
    debug=settings.debug
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 请求日志中间件
app.add_middleware(RequestLoggingMiddleware)

# JWT鉴权中间件（API网关级别）
# 注意：需要在CORS之后添加
app.add_middleware(JWTMiddleware)

# 注册异常处理器
setup_exception_handlers(app)

# 注册路由
app.include_router(files.router, prefix=settings.api_prefix)
app.include_router(agent.router, prefix=settings.api_prefix)
app.include_router(auth.router, prefix=settings.api_prefix)


@app.get("/")
async def root():
    """健康检查"""
    return {
        "status": "ok",
        "app": settings.app_name,
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    """健康检查"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
