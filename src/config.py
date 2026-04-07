# -*- coding: utf-8 -*-
"""
RabAi Mind 配置文件

所有配置通过环境变量读取，Settings 类是唯一配置来源。
config.yaml 仅作文档参考。

作者: Claude
日期: 2026-03-17
"""

import os
import platform
import shutil
from typing import List, Optional
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings

# 加载 .env 文件
from dotenv import load_dotenv
load_dotenv()


def _get_okppt_server_path_default() -> str:
    """Get the default okppt server path based on OS.
    
    Priority:
    1. If uvx is available (cross-platform, no install needed) -> use 'uvx'
    2. Linux: /usr/local/bin/mcp-server-okppt
    3. macOS (Darwin): check ~/local/bin and standard brew paths
    4. Windows: check %LOCALAPPDATA%\\mcp-server-okppt\\bin
    """
    # uvx is the preferred cross-platform approach (no install needed)
    if shutil.which("uvx"):
        return "uvx"
    
    system = platform.system()
    if system == "Darwin":
        # macOS: check brew prefix first, then common paths
        brew_prefix = shutil.which("brew", "/usr/local/bin/brew")
        if brew_prefix:
            # Try to find brew prefix
            import subprocess
            try:
                prefix_result = subprocess.run(
                    ["brew", "--prefix"], capture_output=True, text=True, timeout=5
                )
                if prefix_result.returncode == 0:
                    prefix = prefix_result.stdout.strip()
                    candidate = f"{prefix}/bin/mcp-server-okppt"
                    if os.path.exists(candidate):
                        return candidate
            except Exception:
                pass
        # Fallback for macOS
        for candidate in [
            "/usr/local/bin/mcp-server-okppt",
            "/opt/homebrew/bin/mcp-server-okppt",
            os.path.expanduser("~/local/bin/mcp-server-okppt"),
        ]:
            if os.path.exists(candidate):
                return candidate
        return "mcp-server-okppt"  # rely on PATH on macOS
    elif system == "Windows":
        local_appdata = os.environ.get("LOCALAPPDATA", "")
        candidate = os.path.join(local_appdata, "mcp-server-okppt", "bin", "mcp-server-okppt.exe")
        if os.path.exists(candidate):
            return candidate
        return "mcp-server-okppt"  # rely on PATH on Windows
    else:
        # Linux
        if os.path.exists("/usr/local/bin/mcp-server-okppt"):
            return "/usr/local/bin/mcp-server-okppt"
        return "mcp-server-okppt"  # rely on PATH


class Settings(BaseSettings):
    """应用配置类 — 唯一配置来源，所有值从环境变量读取"""

    # ========== API 服务配置 ==========
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_AUTH_ENABLED: bool = False
    API_KEY: Optional[str] = None
    VERSION: str = "1.0.0"
    JWT_SECRET: str = Field(default="")
    MAX_UPLOAD_SIZE: int = 52428800  # 50MB

    # ========== MCP 服务配置 ==========
    MCP_HOST: str = "0.0.0.0"
    MCP_PORT: int = 8080
    MCP_OKPPT_SERVER_PATH: str = ""
    MCP_MAX_REQUEST_SIZE: int = 10485760  # 10MB
    MCP_HEARTBEAT_INTERVAL: int = 30

    # ========== 火山引擎配置 ==========
    VOLCANO_API_KEY: str = ""
    VOLCANO_SECRET: str = ""
    VOLCANO_ENDPOINT: str = "https://ark.cn-beijing.volces.com/api/v3"
    VOLCANO_PROJECT_ID: str = ""
    VOLCANO_TEXT_MODEL: str = "ep-20260303221115-dk4rt"
    VOLCANO_IMAGE_MODEL: str = "ep-20260314123401-jwqhn"
    VOLCANO_TIMEOUT: int = 120

    # ========== Redis 配置 ==========
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: Optional[str] = None
    REDIS_URL: Optional[str] = None
    REDIS_DB: int = 0

    # ========== OSS 配置 ==========
    OSS_ENABLED: bool = False
    OSS_ENDPOINT: Optional[str] = None
    OSS_BUCKET: Optional[str] = None
    OSS_ACCESS_KEY: Optional[str] = None
    OSS_SECRET_KEY: Optional[str] = None

    # ========== PPT 生成配置 ==========
    PPT_WIDTH: int = 1600
    PPT_HEIGHT: int = 900
    PPT_DEFAULT_SLIDES: int = 10
    PPT_MAX_SLIDES: int = 30
    PPT_ASPECT_RATIO: str = "16:9"
    PPT_OUTPUT_FORMATS: str = "pptx,pdf,images"  # comma-separated
    PPT_TEMPLATE_DEFAULT: str = "default"
    PPT_TEMPLATE_DIR: str = "./templates"
    PPT_SVG_VIEWBOX: str = "0 0 1600 900"
    PPT_SVG_EMBED_IMAGES: bool = True
    PPT_SVG_OPTIMIZE_PATHS: bool = True
    # 图片生成 Fallback 策略
    #   - "all"      : 第1级 Unsplash（验证后）+ 第2级本地 SVG（默认）
    #   - "unsplash" : 仅 Unsplash（验证后），全部失败则无图
    #   - "none"     : 跳过所有外部图片，直接使用本地 SVG
    IMAGE_FALLBACK_STRATEGY: str = "all"

    # ========== Agent 配置 ==========
    AGENT_COORDINATOR_MAX_STEPS: int = 30
    AGENT_COORDINATOR_TIMEOUT: int = 600
    AGENT_QUALITY_SVG_SCHEMA_PATH: str = "./schemas/svg_schema.json"
    AGENT_QUALITY_PPTX_VALIDATOR: str = "libreoffice"
    AGENT_VOLCANO_TEXT_MAX_TOKENS: int = 32000
    AGENT_VOLCANO_IMAGE_MAX_SIZE: int = 2048
    AGENT_OPTIMIZER_COMPRESSION_ENABLED: bool = True
    AGENT_OPTIMIZER_COMPRESS_QUALITY: int = 80

    # ========== 日志配置 ==========
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    LOG_FILE: str = "./logs/rabai_mind.log"
    LOG_MAX_BYTES: int = 10485760  # 10MB
    LOG_BACKUP_COUNT: int = 5

    # ========== 任务队列配置 ==========
    TASK_QUEUE_BACKEND: str = "memory"  # memory / redis

    # ========== CORS 配置 ==========
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173,http://localhost:5174,http://127.0.0.1:3000,http://127.0.0.1:5173,http://127.0.0.1:5174"

    # ========== 路径配置 ==========
    OUTPUT_DIR: str = "./output"
    TEMPLATE_DIR: str = "./templates"
    WORKSPACE_DIR: str = "./workspace"
    SCHEMA_DIR: str = "./schemas"

    def model_post_init(self, __context) -> None:
        """Resolve OS-specific defaults and validate critical config after initialization."""
        # Resolve MCP_OKPPT_SERVER_PATH - if empty, use OS-specific default
        if not self.MCP_OKPPT_SERVER_PATH:
            object.__setattr__(self, "MCP_OKPPT_SERVER_PATH", _get_okppt_server_path_default())

        # Validate critical environment variables at startup
        self._validate_critical_vars()

    def _validate_critical_vars(self) -> None:
        """Raise an error at startup if any critical env var is empty."""
        missing = []
        if not self.VOLCANO_API_KEY:
            missing.append("VOLCANO_API_KEY")
        if not self.VOLCANO_TEXT_MODEL:
            missing.append("VOLCANO_TEXT_MODEL")
        if missing:
            raise ValueError(
                f"[config] Missing required environment variables: {', '.join(missing)}. "
                f"Please set them in .env before starting the server."
            )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"  # 允许 .env 中存在未定义的字段


# 全局配置实例
settings = Settings()


def get_redis_url() -> str:
    """获取 Redis 连接 URL"""
    if settings.REDIS_URL:
        return settings.REDIS_URL
    if settings.REDIS_PASSWORD:
        return f"redis://:{settings.REDIS_PASSWORD}@{settings.REDIS_HOST}:{settings.REDIS_PORT}/{settings.REDIS_DB}"
    return f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/{settings.REDIS_DB}"


def get_cors_origins() -> List[str]:
    """解析 CORS_ORIGINS 环境变量（逗号分隔）"""
    return [origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()]


def get_ppt_output_formats() -> List[str]:
    """解析 PPT_OUTPUT_FORMATS 环境变量（逗号分隔）"""
    return [fmt.strip() for fmt in settings.PPT_OUTPUT_FORMATS.split(",") if fmt.strip()]
