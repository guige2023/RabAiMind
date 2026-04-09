"""
Shared base utilities for API routes.

This module contains common imports, middleware helpers, and utilities
used across all route modules.
"""

import logging
import re
import time
from typing import Any

from fastapi import APIRouter, HTTPException, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from src.config import settings  # noqa: F401

logger = logging.getLogger(__name__)

# Service startup time for uptime calculation
_server_start_time = time.time()


# ==================== Rate Limit Middleware ====================

def _check_rate_limit_middleware(request: Request) -> JSONResponse | None:
    """Check rate limit, return error response if exceeded, else None."""
    from ...api.middleware.rate_limit import (
        get_rate_limiter,
        get_user_id_from_request,
        rate_limit_exceeded_response,
    )
    user_id = get_user_id_from_request(request)
    rate_limiter = get_rate_limiter()
    rate_info, allowed = rate_limiter.check(user_id)
    if not allowed:
        return rate_limit_exceeded_response(rate_info)
    return None


# ==================== Path Validation Helpers ====================

# validate_task_id is defined in the Input Validation Helpers section below
pass


def validate_output_path(file_path: str, output_dir: str) -> str:
    """
    Validate and normalize file path to prevent path traversal attacks.
    Returns the absolute validated path.
    """
    import os
    if not file_path:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="文件路径无效"
        )
    output_dir_abs = os.path.realpath(output_dir)
    file_path_abs = os.path.realpath(file_path)
    if not file_path_abs.startswith(output_dir_abs):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="文件路径不安全"
        )
    return file_path_abs


# ==================== Task Validation Helpers ====================

def validate_task_completed(task_id: str) -> dict[str, Any]:
    """Validate task exists and is completed, return task data."""
    from ...services.task_manager import get_task_manager
    task_manager = get_task_manager()
    task = task_manager.get_task(task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"任务 {task_id} 不存在"
        )
    if task["status"] != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"任务尚未完成，当前状态: {task['status']}"
        )
    return task


# ==================== Router Factory ====================

def create_router(prefix: str, tags: list[str]) -> APIRouter:
    """Create a new APIRouter with standard prefix and tags."""
    return APIRouter(prefix=prefix, tags=tags)


# ==================== Common Model Exports ====================


# Re-export settings for backward compatibility with export_routes.py


# ==================== Standard Error Response ====================

class APIErrorResponse(BaseModel):
    """Standard error response format for all API endpoints."""
    error: str = Field(..., description="机器可读的错误代码")
    detail: str | None = Field(None, description="人类可读的错误描述")
    field: str | None = Field(None, description="如果是字段验证错误，标识具体字段")


def api_error(error: str, detail: str | None = None, field: str | None = None) -> dict[str, Any]:
    """Create a standardized error response dict."""
    result: dict[str, Any] = {"error": error}
    if detail is not None:
        result["detail"] = detail
    if field is not None:
        result["field"] = field
    return result


def raise_api_error(error: str, detail: str | None = None, field: str | None = None, status_code: int = 400):
    """Raise an HTTPException with standardized error format."""
    raise HTTPException(
        status_code=status_code,
        detail=api_error(error, detail, field)
    )


def raise_not_found(resource: str, identifier: str):
    """Raise a 404 Not Found error with standard format."""
    raise_api_error(f"{resource.upper()}_NOT_FOUND", f"{resource} {identifier} 不存在", status_code=404)


def raise_bad_request(error: str, detail: str | None = None, field: str | None = None):
    """Raise a 400 Bad Request error with standard format."""
    raise_api_error(error, detail, field, status_code=400)


def raise_internal_error(operation: str):
    """Raise a 500 Internal Server Error (without exposing internal details)."""
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=api_error("INTERNAL_ERROR", "服务器内部错误，请稍后重试")
    )


# ==================== Input Validation Helpers ====================

def validate_task_id(task_id: str) -> None:
    """Validate task_id format to prevent injection attacks."""
    if not re.match(r'^[a-zA-Z0-9_-]+$', task_id):
        raise_bad_request("INVALID_TASK_ID", f"任务ID格式无效: {task_id}", "task_id")


def validate_pagination(limit: int, default: int = 20, max_limit: int = 100) -> int:
    """Validate and clamp pagination limit."""
    if limit < 1:
        return default
    return min(limit, max_limit)


# ==================== Safe JSON Response ====================

def json_response(data: dict[str, Any], status_code: int = 200) -> JSONResponse:
    """Create a JSONResponse with consistent structure."""
    return JSONResponse(content=data, status_code=status_code)


def success_response(data: Any = None, **kwargs) -> dict[str, Any]:
    """Create a standardized success response."""
    result: dict[str, Any] = {"success": True}
    if data is not None:
        result["data"] = data
    result.update(kwargs)
    return result
