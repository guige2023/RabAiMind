"""核心配置模块"""
from typing import Optional
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """应用配置"""
    
    # App
    app_name: str = "RabAiMind API"
    debug: bool = True
    api_prefix: str = "/api/v1"
    
    # Database
    database_url: str = "postgresql+asyncpg://user:password@localhost:5432/rabaimind"
    
    # Redis
    redis_url: str = "redis://localhost:6379/0"
    
    # Baidu BOS
    bos_endpoint: str = ""
    bos_access_key_id: str = ""
    bos_secret_access_key: str = ""
    bos_bucket_name: str = "rabaimind-files"
    
    # JWT
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30 * 24 * 60  # 30 days
    
    # CORS
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:8000"]
    
    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """获取配置单例"""
    return Settings()


settings = get_settings()
