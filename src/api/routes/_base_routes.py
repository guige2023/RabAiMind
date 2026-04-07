# -*- coding: utf-8 -*-
"""
Shared base utilities for API routes.

This module contains common imports, middleware helpers, and utilities
used across all route modules.
"""

from fastapi import APIRouter, Request, HTTPException, status, UploadFile, File, Form, Query, Body
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from typing import Dict, Any, List, Optional, Callable
from pydantic import BaseModel, Field
import logging
import time
import re

logger = logging.getLogger(__name__)

# Service startup time for uptime calculation
_server_start_time = time.time()


# ==================== Rate Limit Middleware ====================

def _check_rate_limit_middleware(request: Request) -> Optional[JSONResponse]:
    """Check rate limit, return error response if exceeded, else None."""
    from ...api.middleware.rate_limit import (
        get_user_id_from_request,
        get_rate_limiter,
        rate_limit_exceeded_response,
    )
    user_id = get_user_id_from_request(request)
    rate_limiter = get_rate_limiter()
    rate_info, allowed = rate_limiter.check(user_id)
    if not allowed:
        return rate_limit_exceeded_response(rate_info)
    return None


# ==================== Path Validation Helpers ====================

def validate_task_id(task_id: str) -> None:
    """Validate task_id format to prevent injection attacks."""
    if not re.match(r'^[a-zA-Z0-9_-]+$', task_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="无效的任务ID格式"
        )


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

def validate_task_completed(task_id: str) -> Dict[str, Any]:
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

def create_router(prefix: str, tags: List[str]) -> APIRouter:
    """Create a new APIRouter with standard prefix and tags."""
    return APIRouter(prefix=prefix, tags=tags)


# ==================== Common Model Exports ====================

from ...models import (
    GenerateRequest,
    GenerateResponse,
    TaskStatusResponse,
    TaskStatus,
    TaskResult,
    TaskError,
    HealthResponse,
    APIInfo,
    SceneType,
    StyleType,
    LayoutType
)
