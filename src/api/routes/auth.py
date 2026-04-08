"""
API 认证中间件

简化实现：X-API-Key 请求头校验
"""
import os
from fastapi import HTTPException, Security
from fastapi.security import APIKeyHeader

API_KEY = os.getenv("API_KEY", "")
# P0 Fix: 强制启用认证，不再允许通过环境变量关闭
AUTH_ENABLED = True

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_api_key(api_key: str = Security(api_key_header)):
    if not AUTH_ENABLED:
        return True

    if not api_key:
        raise HTTPException(status_code=401, detail="缺少 API Key")

    if api_key != API_KEY:
        raise HTTPException(status_code=403, detail="无效的 API Key")

    return True
