# -*- coding: utf-8 -*-
"""
Security Routes — API Key Management, Audit Log, Secure Share, User Management

Author: Claude (R42)
Date: 2026-04-04
"""

import os
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, HTTPException, Request, Body, Query, Depends
from pydantic import BaseModel, Field
from enum import Enum

from ...core.security import (
    Role, User, RBAC,
    get_api_key_manager, get_audit_logger, get_secure_share_manager,
    get_presentation_security_manager,
    APIKeyManager, AuditLogger, SecureShareManager, PresentationSecurityManager,
)
from ...core.auth import auth_manager
from ...api.middleware.auth import get_current_user, get_current_admin

router = APIRouter(prefix="/api/v1/security", tags=["security"])


# ==================== Pydantic Models ====================

class RoleEnum(str, Enum):
    ADMIN = "admin"
    USER = "user"
    GUEST = "guest"


class APIKeyCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    role: RoleEnum = RoleEnum.USER
    expires_in_days: Optional[int] = Field(None, ge=1, le=365)
    allowed_ips: Optional[List[str]] = None
    rate_limit: Optional[int] = Field(None, ge=1)


class APIKeyCreateResponse(BaseModel):
    key_id: str
    name: str
    role: str
    raw_key: str  # Only shown once!
    created_at: str
    expires_at: Optional[str]


class SecureShareCreateRequest(BaseModel):
    resource_type: str = Field(..., pattern="^(ppt|template)$")
    resource_id: str
    password: Optional[str] = Field(None, min_length=4)
    expires_in_hours: int = Field(default=24, ge=1, le=720)
    allowed_ips: Optional[List[str]] = None
    role: RoleEnum = RoleEnum.GUEST
    anonymous_access: bool = Field(default=False, description="允许匿名访问（无需登录即可查看）")
    encryption_enabled: bool = Field(default=False, description="启用端到端加密（内容传输加密）")


class SecureShareCreateResponse(BaseModel):
    share_id: str
    access_url: str
    raw_token: str  # Only shown once!
    expires_at: str
    password_required: bool


class SecureShareAccessRequest(BaseModel):
    share_id: str
    access_token: str
    password: Optional[str] = None


class AuditLogQuery(BaseModel):
    user_id: str = ""
    action: str = ""
    resource: str = ""
    start_time: str = ""
    end_time: str = ""
    limit: int = Field(default=100, ge=1, le=1000)
    offset: int = Field(default=0, ge=0)


class UserCreateRequest(BaseModel):
    username: str = Field(..., min_length=2, max_length=50)
    email: str = ""
    role: RoleEnum = RoleEnum.USER
    password: Optional[str] = Field(None, min_length=6)


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    role: str
    user_id: str


# ==================== User Management (Admin) ====================

# In-memory user store (replace with DB in production)
_user_store: dict = {}


@router.post("/auth/login", response_model=TokenResponse)
async def login(req: LoginRequest, request: Request):
    """
    Login with username/password, returns JWT token.
    For demo: accepts any user in _user_store.
    """
    user_info = _user_store.get(req.username)
    if not user_info:
        # Auto-create user on first login (demo mode)
        user_info = {
            "user_id": f"user_{len(_user_store) + 1}",
            "username": req.username,
            "role": Role.USER.value,
            "is_active": True,
            "created_at": datetime.utcnow().isoformat() + "Z",
        }
        _user_store[req.username] = user_info

    # Check password if stored
    if user_info.get("password") and user_info["password"] != req.password:
        raise HTTPException(status_code=401, detail="用户名或密码错误")

    role = Role.from_string(user_info.get("role", "user"))
    token = auth_manager.create_token(
        user_id=user_info["user_id"],
        extra_data={
            "username": req.username,
            "role": role.value,
        }
    )
    return TokenResponse(
        access_token=token,
        expires_in=auth_manager._config.token_expire_hours * 3600,
        role=role.value,
        user_id=user_info["user_id"],
    )


@router.post("/users", response_model=dict)
async def create_user(
    req: UserCreateRequest,
    admin: User = Depends(get_current_admin),
):
    """Create a new user (admin only)."""
    if req.username in _user_store:
        raise HTTPException(status_code=409, detail="用户名已存在")

    user_id = f"user_{len(_user_store) + 1}"
    user_info = {
        "user_id": user_id,
        "username": req.username,
        "email": req.email,
        "role": req.role.value,
        "password": req.password,
        "is_active": True,
        "created_at": datetime.utcnow().isoformat() + "Z",
    }
    _user_store[req.username] = user_info
    return {k: v for k, v in user_info.items() if k != "password"}


@router.get("/users", response_model=List[dict])
async def list_users(admin: User = Depends(get_current_admin)):
    """List all users (admin only)."""
    return [
        {k: v for k, v in u.items() if k != "password"}
        for u in _user_store.values()
    ]


@router.delete("/users/{username}")
async def delete_user(username: str, admin: User = Depends(get_current_admin)):
    """Delete a user (admin only)."""
    if username not in _user_store:
        raise HTTPException(status_code=404, detail="用户不存在")
    del _user_store[username]
    return {"success": True, "message": f"用户 {username} 已删除"}


# ==================== API Key Management ====================

@router.post("/apikeys", response_model=APIKeyCreateResponse)
async def create_api_key(
    req: APIKeyCreateRequest,
    user: User = Depends(get_current_user),
):
    """
    Create a new API key for external integrations.
    Returns the raw key ONCE — it cannot be retrieved again.
    """
    manager = get_api_key_manager()
    key_info, raw_key = manager.create_key(
        name=req.name,
        role=Role.from_string(req.role.value),
        owner_id=user.user_id,
        expires_in_days=req.expires_in_days,
        allowed_ips=req.allowed_ips,
        rate_limit=req.rate_limit,
    )
    return APIKeyCreateResponse(
        key_id=key_info["key_id"],
        name=key_info["name"],
        role=key_info["role"],
        raw_key=raw_key,
        created_at=key_info["created_at"],
        expires_at=key_info.get("expires_at"),
    )


@router.get("/apikeys", response_model=List[dict])
async def list_api_keys(user: User = Depends(get_current_user)):
    """List all API keys for the current user (admin sees all)."""
    manager = get_api_key_manager()
    owner = user.user_id if user.role != Role.ADMIN else ""
    return manager.list_keys(owner_id=owner)


@router.delete("/apikeys/{key_id}")
async def revoke_api_key(
    key_id: str,
    user: User = Depends(get_current_user),
):
    """Revoke an API key."""
    manager = get_api_key_manager()
    # Non-admin can only revoke their own keys
    if user.role != Role.ADMIN:
        keys = manager.list_keys(owner_id=user.user_id)
        key_ids = [k["key_id"] for k in keys]
        if key_id not in key_ids:
            raise HTTPException(status_code=403, detail="只能撤销自己的 API Key")
    success = manager.revoke_key(key_id)
    if not success:
        raise HTTPException(status_code=404, detail="API Key 不存在")
    return {"success": True, "message": "API Key 已撤销"}


# ==================== Secure Share ====================

@router.post("/shares", response_model=SecureShareCreateResponse)
async def create_secure_share(
    req: SecureShareCreateRequest,
    user: User = Depends(get_current_user),
):
    """
    Create a secure share link with optional password and expiration.
    The raw access_token is returned ONCE and cannot be retrieved.
    """
    manager = get_secure_share_manager()
    share_info, raw_token = manager.create_share(
        resource_type=req.resource_type,
        resource_id=req.resource_id,
        created_by=user.user_id,
        password=req.password,
        expires_in_hours=req.expires_in_hours,
        allowed_ips=req.allowed_ips,
        role=Role.from_string(req.role.value),
        anonymous_access=req.anonymous_access,
        encryption_enabled=req.encryption_enabled,
    )

    base_url = os.getenv("API_BASE_URL", "http://localhost:8003")
    access_url = f"{base_url}/api/v1/share/{share_info['share_id']}"

    return SecureShareCreateResponse(
        share_id=share_info["share_id"],
        access_url=access_url,
        raw_token=raw_token,
        expires_at=share_info["expires_at"],
        password_required=bool(req.password),
    )


@router.get("/shares", response_model=List[dict])
async def list_secure_shares(user: User = Depends(get_current_user)):
    """List all secure shares created by the current user (admin sees all)."""
    manager = get_secure_share_manager()
    owner = user.user_id if user.role != Role.ADMIN else ""
    return manager.list_shares(owner_id=owner)


@router.post("/shares/verify")
async def verify_share_access(req: SecureShareAccessRequest, request: Request):
    """
    Verify share access (for debugging / testing).
    Returns whether access is granted and share info.
    """
    manager = get_secure_share_manager()
    client_ip = request.headers.get("X-Forwarded-For", "").split(",")[0].strip() or \
                request.headers.get("X-Real-IP", "")
    allowed, reason, share_info = manager.verify_access(
        share_id=req.share_id,
        access_token=req.access_token,
        password=req.password,
        client_ip=client_ip,
    )
    if not allowed:
        raise HTTPException(status_code=403, detail={"error": "ACCESS_DENIED", "reason": reason})
    return {
        "success": True,
        "share_id": req.share_id,
        "resource_type": share_info.get("resource_type"),
        "resource_id": share_info.get("resource_id"),
        "role": share_info.get("role"),
        "expires_at": share_info.get("expires_at"),
    }


@router.get("/shares/{share_id}")
async def get_share_info(
    share_id: str,
    request: Request,
):
    """
    Get share info (unauthenticated — only safe, non-sensitive fields).
    Reveals whether anonymous access and encryption are enabled (without secrets).
    """
    manager = get_secure_share_manager()
    shares = manager.list_shares()
    for s in shares:
        if s["share_id"] == share_id:
            return {
                "share_id": share_id,
                "resource_type": s.get("resource_type"),
                "created_at": s.get("created_at"),
                "expires_at": s.get("expires_at"),
                "password_required": bool(s.get("hashed_password")),
                "is_active": s.get("is_active"),
                "access_count": s.get("access_count", 0),
                "anonymous_access": s.get("anonymous_access", False),
                "encryption_enabled": s.get("encryption_enabled", False),
            }
    raise HTTPException(status_code=404, detail="Share not found")


@router.delete("/shares/{share_id}")
async def revoke_secure_share(
    share_id: str,
    user: User = Depends(get_current_user),
):
    """Revoke a secure share link."""
    manager = get_secure_share_manager()
    shares = manager.list_shares(owner_id=user.user_id)
    share_ids = [s["share_id"] for s in shares]
    if user.role != Role.ADMIN and share_id not in share_ids:
        raise HTTPException(status_code=403, detail="只能撤销自己的 Share Link")
    success = manager.revoke_share(share_id)
    if not success:
        raise HTTPException(status_code=404, detail="Share 不存在")
    return {"success": True, "message": "Share Link 已撤销"}


@router.get("/share/anonymous/{share_id}")
async def anonymous_share_access(
    share_id: str,
    access_token: str = Query(...),
    password: str = Query(""),
    request: Request = None,
):
    """
    Anonymous share access — no login required.
    Requires valid access_token. Optionally requires password.
    Returns share metadata and resource info.

    Use this endpoint when anonymous_access=True on the share.
    """
    manager = get_secure_share_manager()
    client_ip = ""
    if request:
        client_ip = request.headers.get("X-Forwarded-For", "").split(",")[0].strip() or \
                    request.headers.get("X-Real-IP", "")

    allowed, reason, share_info = manager.verify_access(
        share_id=share_id,
        access_token=access_token,
        password=password,
        client_ip=client_ip,
    )

    if not allowed:
        raise HTTPException(
            status_code=403,
            detail={"error": "ACCESS_DENIED", "reason": reason}
        )

    # Check anonymous_access flag
    if not share_info.get("anonymous_access", False):
        raise HTTPException(
            status_code=403,
            detail={"error": "ANONYMOUS_NOT_ALLOWED", "message": "此分享不允许匿名访问，请先登录"}
        )

    # Record access
    manager.record_access(share_id)

    return {
        "success": True,
        "share_id": share_id,
        "resource_type": share_info.get("resource_type"),
        "resource_id": share_info.get("resource_id"),
        "role": share_info.get("role"),
        "expires_at": share_info.get("expires_at"),
        "encryption_enabled": share_info.get("encryption_enabled", False),
        "access_mode": "anonymous",
    }


@router.get("/share/encrypted/{share_id}")
async def get_encrypted_share_content(
    share_id: str,
    access_token: str = Query(...),
    password: str = Query(""),
    request: Request = None,
):
    """
    Get E2E-encrypted presentation content for a share.
    The content is encrypted client-side and only decryptable with the access_token.

    Returns the encrypted binary package (application/octet-stream).
    Caller is responsible for client-side decryption.
    """
    from fastapi.responses import StreamingResponse
    from ...core.security import E2EEncryptionManager

    manager = get_secure_share_manager()
    client_ip = ""
    if request:
        client_ip = request.headers.get("X-Forwarded-For", "").split(",")[0].strip() or \
                    request.headers.get("X-Real-IP", "")

    allowed, reason, share_info = manager.verify_access(
        share_id=share_id,
        access_token=access_token,
        password=password,
        client_ip=client_ip,
    )

    if not allowed:
        raise HTTPException(status_code=403, detail={"error": "ACCESS_DENIED", "reason": reason})

    if not share_info.get("encryption_enabled", False):
        raise HTTPException(
            status_code=400,
            detail={"error": "ENCRYPTION_NOT_ENABLED", "message": "此分享未启用端到端加密"}
        )

    # Get PPTX path from resource_id
    from ...services.task_manager import get_task_manager
    task_manager = get_task_manager()
    task = task_manager.get_task(share_info.get("resource_id", ""))

    if not task:
        raise HTTPException(status_code=404, detail="Resource not found")

    result = task.get("result", {})
    pptx_path = result.get("pptx_path")

    if not pptx_path or not os.path.exists(pptx_path):
        raise HTTPException(status_code=404, detail="Presentation file not found")

    # Generate encrypted package
    encrypted_pkg = E2EEncryptionManager.generate_encrypted_package(pptx_path, access_token)

    manager.record_access(share_id)

    return StreamingResponse(
        iter([encrypted_pkg]),
        media_type="application/octet-stream",
        headers={
            "Content-Disposition": f"attachment; filename=presentation_{share_id}.enc",
            "X-Encryption-Version": "1",
            "X-Resource-Type": share_info.get("resource_type", "ppt"),
        }
    )


@router.post("/share/decrypt")
async def decrypt_share_content(
    encrypted_data: bytes,
    access_token: str,
):
    """
    Server-side decryption helper (for trusted clients).
    WARNING: Exposes the decrypted content. Use /share/encrypted/{id} for client-side decryption.

    For advanced use cases where decryption must happen server-side.
    """
    from fastapi.responses import StreamingResponse
    from ...core.security import E2EEncryptionManager

    try:
        decrypted = E2EEncryptionManager.decrypt_package(encrypted_data, access_token)
        return StreamingResponse(
            iter([decrypted]),
            media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
            headers={"Content-Disposition": "attachment; filename=presentation.pptx"}
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail={"error": "DECRYPTION_FAILED", "message": str(e)})


# ==================== Audit Log ====================

@router.get("/audit", response_model=List[dict])
async def query_audit_log(
    user_id: str = Query("", description="Filter by user_id"),
    action: str = Query("", description="Filter by action/path"),
    resource: str = Query("", description="Filter by resource"),
    start_time: str = Query("", description="ISO timestamp, e.g. 2026-04-01T00:00:00Z"),
    end_time: str = Query("", description="ISO timestamp"),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_admin),  # admin only
):
    """
    Query audit logs with filters (admin only).
    """
    logger_ = get_audit_logger()
    logs = logger_.query(
        user_id=user_id,
        action=action,
        resource=resource,
        start_time=start_time,
        end_time=end_time,
        limit=limit,
        offset=offset,
    )
    return logs


@router.get("/permissions")
async def get_my_permissions(user: User = Depends(get_current_user)):
    """Get current user's permissions based on role."""
    from ...core.security import ROLE_PERMISSIONS
    return {
        "user_id": user.user_id,
        "role": user.role.value,
        "permissions": sorted(ROLE_PERMISSIONS.get(user.role, set())),
    }


# ==================== Audit Trail Dashboard (Admin) ====================


@router.get("/audit/dashboard")
async def get_audit_dashboard(
    days: int = Query(7, ge=1, le=90, description="Time window in days"),
    current_user: User = Depends(get_current_admin),
):
    """
    Audit Trail Dashboard — Admin only.

    Returns aggregated statistics for the admin dashboard:
    - Total events over time
    - Events by action type
    - Most active users
    - Error rate
    - Recent critical events
    """
    logger_ = get_audit_logger()
    all_logs = logger_._load()

    # Calculate time window
    cutoff = datetime.utcnow() - timedelta(days=days)
    cutoff_str = cutoff.isoformat() + "Z"

    # Filter to time window
    window_logs = [l for l in all_logs if l.get("timestamp", "") >= cutoff_str]

    # Total events
    total_events = len(window_logs)

    # Events by action (top 20)
    action_counts: Dict[str, int] = {}
    for log in window_logs:
        action = log.get("action", "unknown")
        action_counts[action] = action_counts.get(action, 0) + 1
    top_actions = sorted(action_counts.items(), key=lambda x: x[1], reverse=True)[:20]

    # Events by user (top 20)
    user_counts: Dict[str, int] = {}
    for log in window_logs:
        uid = log.get("user_id", "unknown")
        user_counts[uid] = user_counts.get(uid, 0) + 1
    top_users = sorted(user_counts.items(), key=lambda x: x[1], reverse=True)[:20]

    # Events by role
    role_counts: Dict[str, int] = {}
    for log in window_logs:
        role = log.get("role", "unknown")
        role_counts[role] = role_counts.get(role, 0) + 1

    # Error rate
    error_count = sum(1 for l in window_logs if l.get("status_code", 200) >= 400 or l.get("error"))
    error_rate = error_count / max(total_events, 1) * 100

    # Events by day (last N days)
    daily_counts: Dict[str, int] = {}
    for log in window_logs:
        ts = log.get("timestamp", "")
        if ts:
            day = ts[:10]  # YYYY-MM-DD
            daily_counts[day] = daily_counts.get(day, 0) + 1

    # Fill in missing days
    daily_series = []
    for i in range(days):
        day = (cutoff + timedelta(days=i)).strftime("%Y-%m-%d")
        daily_series.append({"date": day, "count": daily_counts.get(day, 0)})

    # Resource access breakdown
    resource_counts: Dict[str, int] = {}
    for log in window_logs:
        res = log.get("resource", "") or log.get("path", "")
        if res:
            # Normalize paths
            res = res.split("?")[0]  # strip query params
            resource_counts[res] = resource_counts.get(res, 0) + 1
    top_resources = sorted(resource_counts.items(), key=lambda x: x[1], reverse=True)[:15]

    # Recent critical events (errors + auth failures)
    critical_events = [
        l for l in window_logs
        if l.get("status_code", 200) >= 400
        or l.get("error")
        or l.get("action") in ("login_failed", "auth_failed", "gdpr_delete_request", "tier_changed_by_admin")
    ][-50:]  # last 50

    # Auth success vs failure
    auth_events = [l for l in window_logs if "auth" in l.get("action", "").lower() or "login" in l.get("action", "").lower()]
    auth_success = sum(1 for l in auth_events if l.get("status_code", 200) < 400)
    auth_failure = sum(1 for l in auth_events if l.get("status_code", 200) >= 400)

    return {
        "success": True,
        "period": {
            "days": days,
            "from": cutoff_str,
            "to": datetime.utcnow().isoformat() + "Z",
        },
        "summary": {
            "total_events": total_events,
            "unique_users": len(user_counts),
            "unique_actions": len(action_counts),
            "error_count": error_count,
            "error_rate_percent": round(error_rate, 2),
        },
        "daily_series": daily_series,
        "top_actions": [{"action": a, "count": c} for a, c in top_actions],
        "top_users": [{"user_id": u, "count": c} for u, c in top_users],
        "top_resources": [{"resource": r, "count": c} for r, c in top_resources],
        "by_role": role_counts,
        "auth_stats": {
            "success": auth_success,
            "failure": auth_failure,
            "failure_rate_percent": round(auth_failure / max(auth_success + auth_failure, 1) * 100, 2),
        },
        "critical_events": critical_events[-20:],  # last 20 critical
    }


@router.get("/audit/stats")
async def get_audit_stats(
    current_user: User = Depends(get_current_admin),
):
    """
    Quick audit statistics for the admin panel.
    Returns just the essentials for a dashboard widget.
    """
    logger_ = get_audit_logger()
    all_logs = logger_._load()

    now = datetime.utcnow()
    today_str = now.strftime("%Y-%m-%d")
    yesterday = now - timedelta(days=1)
    yesterday_str = yesterday.strftime("%Y-%m-%d")
    hour_ago = now - timedelta(hours=1)
    hour_ago_str = hour_ago.isoformat() + "Z"

    today_logs = [l for l in all_logs if l.get("timestamp", "").startswith(today_str)]
    yesterday_logs = [l for l in all_logs if l.get("timestamp", "").startswith(yesterday_str)]
    last_hour = [l for l in all_logs if l.get("timestamp", "") >= hour_ago_str]

    errors_today = sum(1 for l in today_logs if l.get("status_code", 200) >= 400 or l.get("error"))

    return {
        "total_logs": len(all_logs),
        "today_events": len(today_logs),
        "yesterday_events": len(yesterday_logs),
        "last_hour_events": len(last_hour),
        "errors_today": errors_today,
        "error_rate_today_percent": round(errors_today / max(len(today_logs), 1) * 100, 2),
        "updated_at": now.isoformat() + "Z",
    }


@router.get("/audit/chart")
async def get_audit_chart_data(
    metric: str = Query("events", pattern="^(events|errors|users)$"),
    period: str = Query("7d", pattern="^(24h|7d|30d|90d)$"),
    current_user: User = Depends(get_current_admin),
):
    """
    Chart data for audit dashboard.

    metric: events | errors | users
    period: 24h (hourly) | 7d (daily) | 30d (daily) | 90d (weekly)
    """
    logger_ = get_audit_logger()
    all_logs = logger_._load()

    period_days = {"24h": 1, "7d": 7, "30d": 30, "90d": 90}[period]
    cutoff = datetime.utcnow() - timedelta(days=period_days)
    cutoff_str = cutoff.isoformat() + "Z"

    window_logs = [l for l in all_logs if l.get("timestamp", "") >= cutoff_str]

    # Build time buckets
    if period == "24h":
        # Hourly buckets
        buckets: Dict[str, Dict] = {}
        for i in range(24):
            h = (datetime.utcnow() - timedelta(hours=23 - i))
            key = h.strftime("%Y-%m-%dT%H:00")
            buckets[key] = {"events": 0, "errors": 0, "users": set()}
        for log in window_logs:
            ts = log.get("timestamp", "")
            if ts:
                hour_key = ts[:14] + ":00"
                if hour_key in buckets:
                    buckets[hour_key]["events"] += 1
                    if log.get("status_code", 200) >= 400 or log.get("error"):
                        buckets[hour_key]["errors"] += 1
                    buckets[hour_key]["users"].add(log.get("user_id", ""))
        series = [
            {"timestamp": k, "events": v["events"], "errors": v["errors"], "unique_users": len(v["users"])}
            for k, v in sorted(buckets.items())
        ]
    else:
        # Daily or weekly buckets
        is_weekly = period == "90d"
        buckets: Dict[str, Dict] = {}
        for i in range(period_days if not is_weekly else (period_days // 7 + 1)):
            d = datetime.utcnow() - timedelta(days=period_days - 1 - i if not is_weekly else (period_days - 1 - i * 7))
            if is_weekly:
                # Align to week start (Monday)
                days_since_monday = d.weekday()
                d = d - timedelta(days=days_since_monday)
            key = d.strftime("%Y-%m-%d")
            buckets[key] = {"events": 0, "errors": 0, "users": set()}

        for log in window_logs:
            ts = log.get("timestamp", "")[:10]
            if ts in buckets:
                buckets[ts]["events"] += 1
                if log.get("status_code", 200) >= 400 or log.get("error"):
                    buckets[ts]["errors"] += 1
                buckets[ts]["users"].add(log.get("user_id", ""))

        series = [
            {"timestamp": k, "events": v["events"], "errors": v["errors"], "unique_users": len(v["users"])}
            for k, v in sorted(buckets.items())
        ]

    return {
        "metric": metric,
        "period": period,
        "data": series,
    }


@router.get("/audit/users/{user_id}")
async def get_user_audit_trail(
    user_id: str,
    days: int = Query(30, ge=1, le=90),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_admin),
):
    """
    Get complete audit trail for a specific user (admin only).
    """
    logger_ = get_audit_logger()
    cutoff = datetime.utcnow() - timedelta(days=days)
    cutoff_str = cutoff.isoformat() + "Z"

    all_logs = logger_._load()
    user_logs = [
        l for l in all_logs
        if l.get("user_id") == user_id and l.get("timestamp", "") >= cutoff_str
    ]
    user_logs = sorted(user_logs, key=lambda x: x.get("timestamp", ""), reverse=True)[:limit]

    return {
        "user_id": user_id,
        "total_events": len(user_logs),
        "period_days": days,
        "events": user_logs,
    }


# ==================== Presentation Security Routes ====================


class PresentationPasswordRequest(BaseModel):
    password: str = Field(..., min_length=4, max_length=64)


class PresentationBiometricRequest(BaseModel):
    biometric_required: bool


class PresentationIPAllowlistRequest(BaseModel):
    allowed_ips: List[str] = Field(default_factory=list, description="允许的IP地址列表，空列表表示清除IP限制")


class PresentationWatermarkRequest(BaseModel):
    enabled: bool = Field(default=False)
    text: str = Field(default="", max_length=200)
    opacity: float = Field(default=0.15, ge=0.05, le=0.5)
    angle: int = Field(default=-45, ge=-90, le=90)
    font_size: int = Field(default=48, ge=12, le=200)
    color: str = Field(default="#888888")


class PresentationBiometricVerifyRequest(BaseModel):
    """Biometric verification request (browser WebAuthn assertion passed)."""
    task_id: str
    assertion: str = Field(default="", description="Base64-encoded WebAuthn assertion")


# ---- Password Protection ----

@router.post("/presentation/{task_id}/password")
async def set_presentation_password(
    task_id: str,
    req: PresentationPasswordRequest,
    user: User = Depends(get_current_user),
):
    """Set or update password protection for a presentation."""
    manager = get_presentation_security_manager()
    result = manager.set_password(task_id, req.password, user.user_id)
    # Log the action
    get_audit_logger().log(
        user_id=user.user_id,
        action="presentation:password_set",
        resource=task_id,
        details={"role": user.role.value}
    )
    return result


@router.delete("/presentation/{task_id}/password")
async def remove_presentation_password(
    task_id: str,
    user: User = Depends(get_current_user),
):
    """Remove password protection from a presentation."""
    manager = get_presentation_security_manager()
    result = manager.remove_password(task_id)
    get_audit_logger().log(
        user_id=user.user_id,
        action="presentation:password_removed",
        resource=task_id,
        details={"role": user.role.value}
    )
    return result


@router.get("/presentation/{task_id}/password")
async def get_presentation_password_status(task_id: str):
    """Get password protection status (no secrets exposed)."""
    manager = get_presentation_security_manager()
    return manager.get_password_info(task_id)


@router.post("/presentation/{task_id}/password/verify")
async def verify_presentation_password(
    task_id: str,
    req: PresentationPasswordRequest,
    request: Request,
):
    """Verify a password to unlock download. Used before download."""
    manager = get_presentation_security_manager()
    client_ip = request.headers.get("X-Forwarded-For", "").split(",")[0].strip() or \
                request.headers.get("X-Real-IP", "")

    # Check IP restriction first
    if not manager.check_ip_allowed(task_id, client_ip):
        get_audit_logger().log(
            user_id="anonymous",
            action="presentation:access_denied_ip",
            resource=task_id,
            details={"client_ip": client_ip, "reason": "IP not allowed"}
        )
        raise HTTPException(
            status_code=403,
            detail={"error": "IP_NOT_ALLOWED", "message": "您的IP地址不在允许范围内"}
        )

    if not manager.verify_password(task_id, req.password):
        get_audit_logger().log(
            user_id="anonymous",
            action="presentation:password_failed",
            resource=task_id,
            details={"client_ip": client_ip}
        )
        raise HTTPException(
            status_code=401,
            detail={"error": "INVALID_PASSWORD", "message": "密码错误"}
        )

    get_audit_logger().log(
        user_id="anonymous",
        action="presentation:password_verified",
        resource=task_id,
        details={"client_ip": client_ip}
    )
    return {"success": True, "verified": True, "task_id": task_id}


# ---- Biometric Authentication ----

@router.post("/presentation/{task_id}/biometric")
async def set_presentation_biometric(
    task_id: str,
    req: PresentationBiometricRequest,
    user: User = Depends(get_current_user),
):
    """Enable or disable biometric authentication requirement."""
    manager = get_presentation_security_manager()
    result = manager.set_biometric_required(task_id, req.biometric_required, user.user_id)
    get_audit_logger().log(
        user_id=user.user_id,
        action=f"presentation:biometric_{'enabled' if req.biometric_required else 'disabled'}",
        resource=task_id,
        details={"role": user.role.value}
    )
    return result


@router.get("/presentation/{task_id}/biometric")
async def get_presentation_biometric_status(task_id: str):
    """Get biometric authentication status."""
    manager = get_presentation_security_manager()
    return manager.get_biometric_info(task_id)


@router.post("/presentation/{task_id}/biometric/verify")
async def verify_presentation_biometric(
    task_id: str,
    req: PresentationBiometricVerifyRequest,
    user: User = Depends(get_current_user),
    request: Request = None,
):
    """
    Verify biometric authentication for a sensitive presentation.
    The frontend uses WebAuthn (TouchID/FaceID) and sends the assertion.
    For demo: accepts any non-empty assertion as valid.
    """
    client_ip = ""
    if request:
        client_ip = request.headers.get("X-Forwarded-For", "").split(",")[0].strip() or \
                    request.headers.get("X-Real-IP", "")

    manager = get_presentation_security_manager()

    # Check IP restriction
    if not manager.check_ip_allowed(task_id, client_ip):
        get_audit_logger().log(
            user_id=user.user_id,
            action="presentation:access_denied_ip",
            resource=task_id,
            details={"client_ip": client_ip}
        )
        raise HTTPException(
            status_code=403,
            detail={"error": "IP_NOT_ALLOWED", "message": "您的IP地址不在允许范围内"}
        )

    if not manager.is_biometric_required(task_id):
        return {"success": True, "verified": True, "biometric_required": False}

    # Demo: accept non-empty assertion as valid
    # In production, this would verify the WebAuthn assertion
    if not req.assertion:
        get_audit_logger().log(
            user_id=user.user_id,
            action="presentation:biometric_failed",
            resource=task_id,
            details={"client_ip": client_ip}
        )
        raise HTTPException(
            status_code=401,
            detail={"error": "BIOMETRIC_FAILED", "message": "生物认证失败"}
        )

    get_audit_logger().log(
        user_id=user.user_id,
        action="presentation:biometric_verified",
        resource=task_id,
        details={"client_ip": client_ip}
    )
    return {"success": True, "verified": True, "task_id": task_id, "biometric_required": True}


# ---- IP Allowlisting ----

@router.post("/presentation/{task_id}/ip-allowlist")
async def set_presentation_ip_allowlist(
    task_id: str,
    req: PresentationIPAllowlistRequest,
    user: User = Depends(get_current_user),
):
    """Set IP allowlist for a presentation."""
    manager = get_presentation_security_manager()
    result = manager.set_allowed_ips(task_id, req.allowed_ips, user.user_id)
    get_audit_logger().log(
        user_id=user.user_id,
        action="presentation:ip_allowlist_updated",
        resource=task_id,
        details={"allowed_ips": req.allowed_ips, "role": user.role.value}
    )
    return result


@router.get("/presentation/{task_id}/ip-allowlist")
async def get_presentation_ip_allowlist(task_id: str):
    """Get IP allowlist status."""
    manager = get_presentation_security_manager()
    return manager.get_ip_allowlist_info(task_id)


# ---- Auto-Watermark ----

@router.post("/presentation/{task_id}/watermark")
async def set_presentation_watermark(
    task_id: str,
    req: PresentationWatermarkRequest,
    user: User = Depends(get_current_user),
):
    """Configure auto-watermark for a presentation's exports."""
    manager = get_presentation_security_manager()
    result = manager.set_auto_watermark(
        task_id,
        enabled=req.enabled,
        text=req.text,
        opacity=req.opacity,
        angle=req.angle,
        font_size=req.font_size,
        color=req.color,
        user_id=user.user_id,
    )
    get_audit_logger().log(
        user_id=user.user_id,
        action="presentation:watermark_updated",
        resource=task_id,
        details={"enabled": req.enabled, "text": req.text}
    )
    return result


@router.get("/presentation/{task_id}/watermark")
async def get_presentation_watermark(task_id: str):
    """Get auto-watermark configuration."""
    manager = get_presentation_security_manager()
    return manager.get_auto_watermark(task_id)


# ---- Access Log ----

@router.get("/presentation/{task_id}/access-log")
async def get_presentation_access_log(
    task_id: str,
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
):
    """Get access log for a specific presentation."""
    manager = get_presentation_security_manager()
    logs = manager.get_access_log(task_id, limit=limit, offset=offset)
    return {
        "task_id": task_id,
        "total": len(logs),
        "logs": logs,
    }


# ---- Full Security Config ----

@router.get("/presentation/{task_id}/security")
async def get_presentation_security_config(
    task_id: str,
    user: User = Depends(get_current_user),
):
    """Get all security settings for a presentation."""
    manager = get_presentation_security_manager()
    return manager.get_security_config(task_id)


@router.delete("/presentation/{task_id}/security")
async def delete_presentation_security(
    task_id: str,
    user: User = Depends(get_current_user),
):
    """Remove all security settings from a presentation."""
    manager = get_presentation_security_manager()
    result = manager.delete_security_config(task_id)
    get_audit_logger().log(
        user_id=user.user_id,
        action="presentation:security_deleted",
        resource=task_id,
        details={"role": user.role.value}
    )
    return result


# ---- Password-Protected PPTX Download (with msoffcrypto) ----

@router.post("/presentation/{task_id}/download/verify")
async def verify_download_access(
    task_id: str,
    password: str = Query(default=""),
    biometric_token: str = Query(default=""),
    request: Request = None,
    user: User = Depends(get_current_user),
):
    """
    Pre-flight check before downloading a protected presentation.
    Returns download token if access is granted.
    """
    client_ip = ""
    if request:
        client_ip = request.headers.get("X-Forwarded-For", "").split(",")[0].strip() or \
                    request.headers.get("X-Real-IP", "")

    manager = get_presentation_security_manager()

    # Check IP restriction
    if not manager.check_ip_allowed(task_id, client_ip):
        raise HTTPException(
            status_code=403,
            detail={"error": "IP_NOT_ALLOWED", "message": "您的IP地址不在允许范围内"}
        )

    # Check biometric requirement
    if manager.is_biometric_required(task_id) and not biometric_token:
        raise HTTPException(
            status_code=401,
            detail={"error": "BIOMETRIC_REQUIRED", "message": "此演示文稿需要生物认证"}
        )

    # Check password
    if manager.has_password(task_id):
        if not password or not manager.verify_password(task_id, password):
            raise HTTPException(
                status_code=401,
                detail={"error": "PASSWORD_REQUIRED", "message": "此演示文稿需要密码"}
            )

    # All checks passed — generate a one-time download token
    token = secrets.token_urlsafe(32)
    download_token = hashlib.sha256(token.encode()).hex()

    # Store token with expiry (5 minutes)
    import threading
    _dt_lock = threading.Lock()
    global _download_tokens
    if '_download_tokens' not in globals():
        _download_tokens = {}
    with _dt_lock:
        _download_tokens[download_token] = {
            "task_id": task_id,
            "user_id": user.user_id if user else "anonymous",
            "expires_at": (datetime.utcnow() + timedelta(minutes=5)).isoformat() + "Z",
        }

    # Log successful access
    manager.log_access(
        task_id=task_id,
        user_id=user.user_id if user else "anonymous",
        action="download_access_granted",
        client_ip=client_ip,
    )

    return {
        "success": True,
        "download_token": token,
        "expires_in_seconds": 300,
        "task_id": task_id,
    }


# ==================== Org-Level IP Allowlist Routes ====================

class OrgIPAllowlistRequest(BaseModel):
    allowed_ips: List[str] = Field(default_factory=list, description="允许的IP地址或CIDR列表，空列表表示清除限制")
    mode: str = Field(default="allow", pattern="^(allow|deny)$")


class OrgIPDenyRequest(BaseModel):
    denied_ips: List[str] = Field(default_factory=list, description="禁止的IP地址或CIDR列表")


@router.post("/org/ip-allowlist")
async def set_org_ip_allowlist(
    req: OrgIPAllowlistRequest,
    current_user: User = Depends(get_current_admin),
):
    """
    Set organization-level IP allowlist (admin only).
    
    When an IP allowlist is set, only requests from allowed IP addresses
    will be permitted for all users in the organization.
    """
    from ...core.org_security import get_org_ip_allowlist_manager
    manager = get_org_ip_allowlist_manager()

    try:
        result = manager.set_allowed_ips(
            org_id="default",
            allowed_ips=req.allowed_ips,
            updated_by=current_user.user_id,
        )
        get_audit_logger().log(
            action="org:ip_allowlist_updated",
            user_id=current_user.user_id,
            role=current_user.role.value,
            path="/api/v1/security/org/ip-allowlist",
            extra={"allowed_ips": req.allowed_ips, "mode": req.mode}
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail={"error": "INVALID_IP", "message": str(e)})


@router.post("/org/ip-denylist")
async def set_org_ip_denylist(
    req: OrgIPDenyRequest,
    current_user: User = Depends(get_current_admin),
):
    """Set organization-level IP denylist (blacklist) (admin only)."""
    from ...core.org_security import get_org_ip_allowlist_manager
    manager = get_org_ip_allowlist_manager()

    try:
        result = manager.set_denied_ips(
            org_id="default",
            denied_ips=req.denied_ips,
            updated_by=current_user.user_id,
        )
        get_audit_logger().log(
            action="org:ip_denylist_updated",
            user_id=current_user.user_id,
            role=current_user.role.value,
            path="/api/v1/security/org/ip-denylist",
            extra={"denied_ips": req.denied_ips}
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail={"error": "INVALID_IP", "message": str(e)})


@router.delete("/org/ip-allowlist")
async def clear_org_ip_allowlist(
    current_user: User = Depends(get_current_admin),
):
    """Clear all organization-level IP restrictions (admin only)."""
    from ...core.org_security import get_org_ip_allowlist_manager
    manager = get_org_ip_allowlist_manager()
    result = manager.clear_restrictions(org_id="default")
    get_audit_logger().log(
        action="org:ip_allowlist_cleared",
        user_id=current_user.user_id,
        role=current_user.role.value,
        path="/api/v1/security/org/ip-allowlist",
    )
    return result


@router.get("/org/ip-allowlist")
async def get_org_ip_allowlist(
    current_user: User = Depends(get_current_admin),
):
    """Get organization-level IP allowlist configuration (admin only)."""
    from ...core.org_security import get_org_ip_allowlist_manager
    manager = get_org_ip_allowlist_manager()
    return manager.get_ip_config(org_id="default")


@router.get("/org/ip-allowlist/check")
async def check_my_ip_allowlist(
    request: Request,
    current_user: User = Depends(get_current_user),
):
    """Check if the current request's IP is allowed under org IP policy."""
    from ...core.org_security import get_org_ip_allowlist_manager
    manager = get_org_ip_allowlist_manager()

    client_ip = request.headers.get("X-Forwarded-For", "").split(",")[0].strip() or \
                request.headers.get("X-Real-IP", "")
    if not client_ip:
        client_ip = request.client.host if request.client else "unknown"

    allowed = manager.is_ip_allowed(org_id="default", client_ip=client_ip)
    config = manager.get_ip_config(org_id="default")

    return {
        "client_ip": client_ip,
        "is_allowed": allowed,
        "has_restrictions": config.get("has_restrictions", False),
        "mode": config.get("mode", "allow"),
    }


# ==================== Custom Role Management Routes ====================

class CustomRoleCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    description: str = Field(default="", max_length=200)
    permissions: List[str] = Field(..., min_items=1)


class CustomRoleUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=50)
    description: Optional[str] = Field(None, max_length=200)
    permissions: Optional[List[str]] = Field(None, min_items=1)
    is_active: Optional[bool] = None


class CustomRoleAssignRequest(BaseModel):
    user_id: str
    role_id: str


@router.post("/roles")
async def create_custom_role(
    req: CustomRoleCreateRequest,
    current_user: User = Depends(get_current_admin),
):
    """
    Create a new custom role with a custom permission set (admin only).
    
    Custom roles can be assigned to users to grant fine-grained permissions.
    """
    from ...core.org_security import get_custom_role_manager
    manager = get_custom_role_manager()

    try:
        role = manager.create_role(
            name=req.name,
            description=req.description,
            permissions=req.permissions,
            created_by=current_user.user_id,
        )
        get_audit_logger().log(
            action="rbac:custom_role_created",
            user_id=current_user.user_id,
            role=current_user.role.value,
            path="/api/v1/security/roles",
            extra={"role_id": role["role_id"], "name": req.name, "permissions": req.permissions}
        )
        return role
    except ValueError as e:
        raise HTTPException(status_code=400, detail={"error": "INVALID_ROLE", "message": str(e)})


@router.get("/roles", response_model=List[dict])
async def list_custom_roles(
    include_inactive: bool = Query(False),
    current_user: User = Depends(get_current_admin),
):
    """List all custom roles (admin only)."""
    from ...core.org_security import get_custom_role_manager
    manager = get_custom_role_manager()
    return manager.list_roles(include_inactive=include_inactive)


@router.get("/roles/{role_id}", response_model=dict)
async def get_custom_role(
    role_id: str,
    current_user: User = Depends(get_current_admin),
):
    """Get a specific custom role (admin only)."""
    from ...core.org_security import get_custom_role_manager
    manager = get_custom_role_manager()
    try:
        return manager.get_role(role_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail={"success": False, "error": str(e)})


@router.put("/roles/{role_id}")
async def update_custom_role(
    role_id: str,
    req: CustomRoleUpdateRequest,
    current_user: User = Depends(get_current_admin),
):
    """Update a custom role (admin only)."""
    from ...core.org_security import get_custom_role_manager
    manager = get_custom_role_manager()

    try:
        role = manager.update_role(
            role_id=role_id,
            name=req.name,
            description=req.description,
            permissions=req.permissions,
            is_active=req.is_active,
        )
        get_audit_logger().log(
            action="rbac:custom_role_updated",
            user_id=current_user.user_id,
            role=current_user.role.value,
            path=f"/api/v1/security/roles/{role_id}",
            extra={"changes": {k: v for k, v in req.model_dump().items() if v is not None}}
        )
        return role
    except ValueError as e:
        raise HTTPException(status_code=400, detail={"error": "INVALID_ROLE", "message": str(e)})


@router.delete("/roles/{role_id}")
async def delete_custom_role(
    role_id: str,
    current_user: User = Depends(get_current_admin),
):
    """Soft-delete a custom role (marks as inactive) (admin only)."""
    from ...core.org_security import get_custom_role_manager
    manager = get_custom_role_manager()

    try:
        result = manager.delete_role(role_id)
        get_audit_logger().log(
            action="rbac:custom_role_deleted",
            user_id=current_user.user_id,
            role=current_user.role.value,
            path=f"/api/v1/security/roles/{role_id}",
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail={"error": "INVALID_ROLE", "message": str(e)})


@router.post("/roles/assign")
async def assign_custom_role_to_user(
    req: CustomRoleAssignRequest,
    current_user: User = Depends(get_current_admin),
):
    """Assign a custom role to a user (admin only)."""
    from ...core.org_security import get_custom_role_manager
    manager = get_custom_role_manager()

    try:
        result = manager.assign_role_to_user(user_id=req.user_id, role_id=req.role_id)
        get_audit_logger().log(
            action="rbac:role_assigned",
            user_id=current_user.user_id,
            role=current_user.role.value,
            path="/api/v1/security/roles/assign",
            extra={"target_user": req.user_id, "role_id": req.role_id}
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail={"error": "INVALID_ASSIGNMENT", "message": str(e)})


@router.get("/roles/assign/{user_id}")
async def get_user_custom_roles(
    user_id: str,
    current_user: User = Depends(get_current_admin),
):
    """Get all custom roles assigned to a user (admin only)."""
    from ...core.org_security import get_custom_role_manager
    manager = get_custom_role_manager()
    return manager.get_user_roles(user_id)


@router.get("/roles/permissions")
async def get_available_permissions(
    current_user: User = Depends(get_current_admin),
):
    """Get all available permissions that can be assigned to custom roles (admin only)."""
    from ...core.org_security import get_custom_role_manager
    manager = get_custom_role_manager()
    return {
        "valid_permissions": sorted(manager.VALID_PERMISSIONS),
        "categories": {
            "ppt": [p for p in manager.VALID_PERMISSIONS if p.startswith("ppt:")],
            "template": [p for p in manager.VALID_PERMISSIONS if p.startswith("template:")],
            "favorites": [p for p in manager.VALID_PERMISSIONS if p.startswith("favorites:")],
            "brand": [p for p in manager.VALID_PERMISSIONS if p.startswith("brand:")],
            "images": [p for p in manager.VALID_PERMISSIONS if p.startswith("images:")],
            "analytics": [p for p in manager.VALID_PERMISSIONS if p.startswith("analytics:")],
            "admin": [p for p in manager.VALID_PERMISSIONS if p in ("users:manage", "apikeys:manage", "audit:view", "settings:manage")],
            "org": [p for p in manager.VALID_PERMISSIONS if p.startswith("org:")],
            "gdpr": [p for p in manager.VALID_PERMISSIONS if p.startswith("gdpr:")],
            "sso": [p for p in manager.VALID_PERMISSIONS if p.startswith("sso:")],
            "share": [p for p in manager.VALID_PERMISSIONS if p.startswith("share:")],
            "data": [p for p in manager.VALID_PERMISSIONS if p.startswith("data:")],
        }
    }


# ==================== SOC2 Compliance Routes ====================

@router.get("/soc2/attestation")
async def get_soc2_attestation(
    current_user: User = Depends(get_current_admin),
):
    """
    Get SOC2 compliance attestation document (admin only).
    
    This document summarizes the compliance posture across all
    Trust Service Criteria (TSC) for SOC2 Type II reporting.
    """
    from ...core.org_security import get_soc2_compliance_manager
    manager = get_soc2_compliance_manager()
    return manager.generate_compliance_attestation()


@router.get("/soc2/data-inventory")
async def get_soc2_data_inventory(
    user_id: str = Query("", description="Filter by user_id (admin sees all)"),
    current_user: User = Depends(get_current_admin),
):
    """
    Get data inventory report (SOC2 CC6.1) (admin only).
    
    Lists all data stores, file types, sizes, and retention status.
    """
    from ...core.org_security import get_soc2_compliance_manager
    manager = get_soc2_compliance_manager()
    return manager.get_data_inventory(user_id=user_id or current_user.user_id)


@router.get("/soc2/access-controls")
async def get_soc2_access_controls(
    current_user: User = Depends(get_current_admin),
):
    """
    Get access controls report (SOC2 CC6.2) (admin only).
    
    Shows all users, their roles, and permission sets.
    """
    from ...core.org_security import get_soc2_compliance_manager
    manager = get_soc2_compliance_manager()
    return manager.get_access_controls_report()


@router.get("/soc2/encryption")
async def get_soc2_encryption_report(
    current_user: User = Depends(get_current_admin),
):
    """
    Get encryption status report (SOC2 CC6.7) (admin only).
    """
    from ...core.org_security import get_soc2_compliance_manager
    manager = get_soc2_compliance_manager()
    return manager.get_encryption_report()


@router.get("/soc2/audit-trail")
async def get_soc2_audit_trail_report(
    days: int = Query(90, ge=1, le=365),
    current_user: User = Depends(get_current_admin),
):
    """
    Get audit trail report (SOC2 CC7.2) (admin only).
    
    Shows comprehensive audit statistics for the specified period.
    """
    from ...core.org_security import get_soc2_compliance_manager
    manager = get_soc2_compliance_manager()
    return manager.get_audit_trail_report(days=days)
