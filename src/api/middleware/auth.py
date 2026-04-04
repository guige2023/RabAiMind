# -*- coding: utf-8 -*-
"""
Authentication Middleware — JWT + API Key + Secure Share Token

Applies JWT Bearer auth to all /api/v1/* routes.
Supports X-API-Key header for external integrations.
Supports X-Share-Token + X-Share-Password for secure share access.

Author: Claude (R42)
Date: 2026-04-04
"""

import time
import logging
from typing import Optional, Callable
from functools import lru_cache

from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from ...core.auth import auth_manager, AuthError
from ...core.security import (
    Role, User, RBAC,
    get_api_key_manager, get_audit_logger, get_secure_share_manager,
)

logger = logging.getLogger("auth_middleware")

# Paths that don't require authentication
PUBLIC_PATHS = {
    "/", "/docs", "/redoc", "/openapi.json",
    "/api/v1/status", "/api/v1/limits",
    "/api/v1/auth/login",        # if exists
    "/health", "/ping",
}

# Paths for secure share access (token-based, not user-based)
SECURE_SHARE_PATHS = {
    "/api/v1/share/",   # share access endpoints
}


class AuthState:
    """Holds authenticated user state for a request"""
    def __init__(
        self,
        user: User,
        auth_method: str = "none",
        api_key_id: str = "",
        share_id: str = "",
        share_role: Role = Role.GUEST,
    ):
        self.user = user
        self.auth_method = auth_method
        self.api_key_id = api_key_id
        self.share_id = share_id
        self.share_role = share_role


def _extract_user_from_jwt(request: Request) -> Optional[User]:
    """Extract user from JWT Bearer token."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header[7:]
    try:
        payload = auth_manager.verify_token(token)
        return User(
            user_id=payload.get("sub", ""),
            role=Role.from_string(payload.get("role", "guest")),
            username=payload.get("username", ""),
            email=payload.get("email", ""),
            is_active=True,
        )
    except Exception as e:
        logger.debug(f"JWT verify failed: {e}")
        return None


def _extract_user_from_api_key(request: Request) -> Optional[tuple[User, str]]:
    """Extract user from X-API-Key header. Returns (User, key_id)."""
    raw_key = request.headers.get("X-API-Key", "")
    if not raw_key:
        return None
    try:
        manager = get_api_key_manager()
        key_info = manager.verify_key(raw_key)
        if not key_info:
            return None
        manager.update_last_used(key_info["key_id"])
        return User(
            user_id=key_info.get("owner_id") or f"key_{key_info['key_id']}",
            role=Role.from_string(key_info.get("role", "user")),
            is_api_key=True,
            api_key_name=key_info.get("name"),
        ), key_info["key_id"]
    except Exception as e:
        logger.debug(f"API key verify failed: {e}")
        return None


def _extract_user_from_share(request: Request) -> Optional[tuple[User, str, str]]:
    """
    Extract user from secure share token (X-Share-ID + X-Share-Token + X-Share-Password).
    Returns (User, share_id, share_role).
    """
    share_id = request.headers.get("X-Share-ID", "")
    access_token = request.headers.get("X-Share-Token", "")
    password = request.headers.get("X-Share-Password", "")
    if not share_id or not access_token:
        return None

    try:
        manager = get_secure_share_manager()
        client_ip = _get_client_ip(request)
        allowed, reason, share_info = manager.verify_access(
            share_id=share_id,
            access_token=access_token,
            password=password,
            client_ip=client_ip,
        )
        if not allowed:
            return None
        manager.record_access(share_id)
        return User(
            user_id=f"share_{share_id}",
            role=Role.from_string(share_info.get("role", "guest")),
        ), share_id, share_info.get("role", "guest")
    except Exception as e:
        logger.debug(f"Share verify failed: {e}")
        return None


def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.headers.get("X-Real-IP", request.client.host if request.client else "unknown")


def _audit_log(request: Request, user: User, status_code: int, duration_ms: int, error: str = ""):
    """Log the request to audit log."""
    try:
        auth_method = getattr(request.state, "auth_method", "unknown")
        api_key_id = getattr(request.state, "api_key_id", "")
        share_id = getattr(request.state, "share_id", "")

        get_audit_logger().log(
            action=request.url.path,
            user_id=user.user_id,
            role=user.role.value,
            method=request.method,
            path=str(request.url.path),
            ip=_get_client_ip(request),
            user_agent=request.headers.get("User-Agent", ""),
            status_code=status_code,
            duration_ms=duration_ms,
            auth_method=auth_method,
            api_key_id=api_key_id,
            error=error,
            extra={"query": str(request.query_params)},
        )
    except Exception as e:
        logger.warning(f"Audit log failed: {e}")


class AuthMiddleware(BaseHTTPMiddleware):
    """
    Intercepts all /api/v1/* requests and enforces authentication.
    """

    async def dispatch(self, request: Request, call_next: Callable):
        path = request.url.path

        # Skip auth for public paths
        if path in PUBLIC_PATHS or not path.startswith("/api/v1"):
            return await call_next(request)

        start_time = time.time()
        user: Optional[User] = None
        auth_method = "none"
        api_key_id = ""
        share_id = ""

        try:
            # 1. Try JWT Bearer
            jwt_user = _extract_user_from_jwt(request)
            if jwt_user:
                user = jwt_user
                auth_method = "jwt"
                logger.debug(f"JWT auth: user={user.user_id}, role={user.role}")

            # 2. Try API Key
            if not user:
                key_result = _extract_user_from_api_key(request)
                if key_result:
                    user, api_key_id = key_result
                    auth_method = "api_key"
                    logger.debug(f"API key auth: user={user.user_id}, key={api_key_id}")

            # 3. Try Secure Share token
            if not user and path.startswith("/api/v1/share/"):
                share_result = _extract_user_from_share(request)
                if share_result:
                    user, share_id, _ = share_result
                    auth_method = "share_token"

            # 4. If auth disabled globally, allow as anonymous
            if not user and not auth_manager.is_enabled:
                user = User(user_id="anonymous", role=Role.GUEST)
                auth_method = "none"

            # 5. No auth found — reject
            if not user:
                duration_ms = int((time.time() - start_time) * 1000)
                _audit_log(request, User(user_id="anonymous", role=Role.GUEST), 401, duration_ms, "Missing auth")
                return JSONResponse(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    content={
                        "success": False,
                        "error": "UNAUTHORIZED",
                        "message": "请提供认证信息：Bearer Token 或 X-API-Key",
                        "detail": {
                            "supported_methods": ["Bearer JWT", "X-API-Key", "X-Share-ID + X-Share-Token"],
                        }
                    }
                )

            # Attach user state
            request.state.user = user
            request.state.auth_method = auth_method
            request.state.api_key_id = api_key_id
            request.state.share_id = share_id

            # Proceed
            response = await call_next(request)
            duration_ms = int((time.time() - start_time) * 1000)
            _audit_log(request, user, response.status_code, duration_ms)

            # Add auth info headers
            response.headers["X-Auth-Method"] = auth_method
            response.headers["X-User-ID"] = user.user_id
            response.headers["X-User-Role"] = user.role.value
            return response

        except HTTPException:
            raise
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            if user:
                _audit_log(request, user, 500, duration_ms, str(e))
            logger.exception(f"Auth middleware error: {e}")
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"success": False, "error": "SERVER_ERROR", "message": "服务器内部错误"}
            )


def require_role(*allowed_roles: Role):
    """Dependency to require specific roles."""
    async def check_role(request: Request) -> User:
        user: User = getattr(request.state, "user", None)
        if not user:
            raise HTTPException(status_code=401, detail="未认证")
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail={
                    "error": "FORBIDDEN",
                    "message": f"权限不足，当前角色: {user.role.value}，需要: {[r.value for r in allowed_roles]}",
                }
            )
        return user
    return check_role


def require_auth(request: Request) -> User:
    """Simple auth check dependency."""
    user: User = getattr(request.state, "user", None)
    if not user:
        raise HTTPException(status_code=401, detail="未认证")
    return user


# Shortcut dependencies for use in routes
async def get_current_user(request: Request) -> User:
    """Get the current authenticated user from request state."""
    user = getattr(request.state, "user", None)
    if not user:
        raise HTTPException(status_code=401, detail="未认证")
    return user


async def get_current_admin(request: Request) -> User:
    """Require admin role."""
    user = await get_current_user(request)
    if user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="需要管理员权限")
    return user
