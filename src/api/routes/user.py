"""
User API Route

Provides user preferences, profile, password, stats, and data export endpoints.

Author: Claude
Date: 2026-04-04
"""

from typing import Any

from fastapi import APIRouter, Body, Request

from ...api.middleware.rate_limit import get_user_id_from_request
from ...services.task_manager import get_task_manager
from ...services.user_service import get_user_service

router = APIRouter(prefix="/api/v1/user", tags=["user"])


# ── Preferences ──────────────────────────────────────────────────────────────

@router.get("/preferences")
async def get_preferences(request: Request) -> dict[str, Any]:
    """Get all user preferences (theme, language, notifications, etc.)."""
    get_user_id_from_request(request)
    svc = get_user_service()
    return {"success": True, "data": svc.get_preferences()}


@router.put("/preferences")
async def update_preferences(request: Request, updates: dict[str, Any] = Body(...)) -> dict[str, Any]:
    """Update user preferences (partial update)."""
    get_user_id_from_request(request)
    svc = get_user_service()
    data = svc.update_preferences(updates)
    return {"success": True, "data": data}


@router.post("/preferences/reset")
async def reset_preferences(request: Request) -> dict[str, Any]:
    """Reset all preferences to defaults."""
    get_user_id_from_request(request)
    svc = get_user_service()
    data = svc.reset_preferences()
    return {"success": True, "data": data, "message": "已恢复默认设置"}


# ── Profile ─────────────────────────────────────────────────────────────────

@router.get("/profile")
async def get_profile(request: Request) -> dict[str, Any]:
    """Get user profile (name, email, avatar)."""
    get_user_id_from_request(request)
    svc = get_user_service()
    return {"success": True, "data": svc.get_profile()}


@router.put("/profile")
async def update_profile(request: Request, updates: dict[str, Any] = Body(...)) -> dict[str, Any]:
    """Update user profile."""
    get_user_id_from_request(request)
    svc = get_user_service()
    data = svc.update_profile(updates)
    return {"success": True, "data": data, "message": "个人信息已更新"}


@router.put("/password")
async def change_password(request: Request, payload: dict[str, str] = Body(...)) -> dict[str, Any]:
    """Change password. Requires old_password and new_password."""
    get_user_id_from_request(request)
    svc = get_user_service()
    old = payload.get("old_password", "")
    new = payload.get("new_password", "")
    result = svc.update_password(old, new)
    if "error" in result:
        return {"success": False, "message": result["error"]}
    return {"success": True, "message": "密码已修改"}


# ── Stats ───────────────────────────────────────────────────────────────────

@router.get("/stats")
async def get_user_stats(request: Request) -> dict[str, Any]:
    """Get personal usage statistics."""
    get_user_id_from_request(request)
    svc = get_user_service()
    manager = get_task_manager()
    tasks = [
        {**task, "task_id": tid}
        for tid, task in manager.get_history().items()
    ]
    stats = svc.get_stats(tasks)
    return {"success": True, "data": stats}


# ── Data Export ──────────────────────────────────────────────────────────────

@router.get("/export")
async def export_user_data(request: Request) -> dict[str, Any]:
    """Export all user data as JSON (profile, preferences, stats, tasks)."""
    get_user_id_from_request(request)
    svc = get_user_service()
    manager = get_task_manager()
    tasks = [
        {**task, "task_id": tid}
        for tid, task in manager.get_history().items()
    ]
    data = svc.export_all_data(tasks)
    return {"success": True, "data": data}
