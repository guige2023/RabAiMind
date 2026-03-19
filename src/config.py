# -*- coding: utf-8 -*-
"""
RabAi Mind 配置文件

作者: Claude
日期: 2026-03-17
"""

import os
from typing import Optional
from pydantic import BaseModel
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """应用配置类"""

    # API 配置
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000

    # MCP 配置
    MCP_HOST: str = "0.0.0.0"
    MCP_PORT: int = 8080

    # 火山引擎配置
    VOLCANO_API_KEY: str = ""
    VOLCANO_SECRET: str = ""
    VOLCANO_ENDPOINT: str = "https://ark.cn-beijing.volces.com/api/v3"
    VOLCANO_PROJECT_ID: str = ""
    VOLCANO_TEXT_MODEL: str = "ep-20260303221115-dk4rt"
    VOLCANO_IMAGE_MODEL: str = "ep-20260314123401-jwqhn"

    # Redis 配置
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: Optional[str] = None
    REDIS_URL: Optional[str] = None

    # OSS 配置
    OSS_ENABLED: bool = False
    OSS_ENDPOINT: Optional[str] = None
    OSS_BUCKET: Optional[str] = None
    OSS_ACCESS_KEY: Optional[str] = None
    OSS_SECRET_KEY: Optional[str] = None

    # PPT 配置
    PPT_WIDTH: int = 1600
    PPT_HEIGHT: int = 900
    PPT_DEFAULT_SLIDES: int = 10
    PPT_MAX_SLIDES: int = 30

    # 日志配置
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "./logs/rabai_mind.log"

    # 路径配置
    OUTPUT_DIR: str = "./output"
    TEMPLATE_DIR: str = "./templates"
    WORKSPACE_DIR: str = "./workspace"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# 全局配置实例
settings = Settings()


def get_redis_url() -> str:
    """获取 Redis 连接 URL"""
    if settings.REDIS_URL:
        return settings.REDIS_URL
    if settings.REDIS_PASSWORD:
        return f"redis://:{settings.REDIS_PASSWORD}@{settings.REDIS_HOST}:{settings.REDIS_PORT}/0"
    return f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/0"
