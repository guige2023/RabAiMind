"""JWT认证中间件"""
from typing import Optional, List
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.services.auth_service import verify_token
from app.schemas.user import TokenData


class JWTMiddleware(BaseHTTPMiddleware):
    """JWT鉴权中间件 - 用于API网关级别的Token验证"""
    
    # 不需要认证的路径
    EXCLUDED_PATHS = [
        "/",
        "/health",
        "/api/v1/auth/login",
        "/api/v1/auth/register",
        "/docs",
        "/redoc",
        "/openapi.json",
    ]
    
    # 需要特定权限的路径
    PERMISSION_REQUIRED_PATHS = {
        "/api/v1/files": ["files:read"],
        "/api/v1/agent": ["agent:execute"],
    }
    
    async def dispatch(self, request: Request, call_next):
        """处理请求"""
        # 检查是否在排除路径中
        if self._is_excluded_path(request.url.path):
            return await call_next(request)
        
        # 获取Token
        auth_header = request.headers.get("Authorization")
        
        if not auth_header:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "缺少认证凭据", "code": "MISSING_CREDENTIALS"},
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        if not auth_header.startswith("Bearer "):
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "无效的认证格式", "code": "INVALID_AUTH_FORMAT"},
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        token = auth_header.replace("Bearer ", "")
        token_data = verify_token(token)
        
        if token_data is None:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "无效或已过期的Token", "code": "INVALID_TOKEN"},
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        # 将token数据添加到请求状态
        request.state.token_data = token_data
        request.state.user_id = token_data.user_id
        
        # 检查权限
        permission_error = self._check_permissions(request.url.path)
        if permission_error:
            return permission_error
        
        return await call_next(request)
    
    def _is_excluded_path(self, path: str) -> bool:
        """检查路径是否需要认证"""
        for excluded in self.EXCLUDED_PATHS:
            if path.startswith(excluded):
                return True
        return False
    
    def _check_permissions(self, path: str) -> Optional[JSONResponse]:
        """检查路径权限"""
        for path_pattern, required_permissions in self.PERMISSION_REQUIRED_PATHS.items():
            if path.startswith(path_pattern):
                # TODO: 实现基于权限的检查
                # 当前仅做路径级别的基础检查
                pass
        return None


def require_permissions(required_permissions: List[str]):
    """权限要求装饰器"""
    def dependency(request: Request):
        # 从request.state获取token_data进行权限检查
        token_data = getattr(request.state, "token_data", None)
        if not token_data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="需要认证"
            )
        
        # TODO: 实现基于用户角色的权限检查
        # 当前为占位实现
        return True
    
    return dependency
