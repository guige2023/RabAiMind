# -*- coding: utf-8 -*-
"""
API Key Management Routes — Developer Platform v2.2

Provides:
- POST   /api/v1/developer/api-keys        — Create a new API key
- GET    /api/v1/developer/api-keys        — List all API keys (no raw key)
- DELETE /api/v1/developer/api-keys/{id}  — Revoke an API key
- GET    /api/v1/developer/api-keys/{id}/usage — Get usage stats for a key

Author: Claude
Date: 2026-04-09
"""

import time
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from ...config import settings
from ...core.security import get_api_key_manager, Role
from ...api.middleware.rate_limit import get_user_id_from_request


router = APIRouter(prefix="/api/v1/developer/api-keys", tags=["developer"])


# ── Request / Response Models ────────────────────────────────────────────────

class CreateAPIKeyRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Human-readable name for this key")
    role: str = Field(default="user", description="Role: 'user', 'admin', or 'developer'")
    expires_in_days: Optional[int] = Field(default=None, ge=1, le=365, description="Days until expiration (optional)")
    allowed_ips: Optional[List[str]] = Field(default=None, description="Whitelist of IP addresses (optional)")
    rate_limit: Optional[int] = Field(default=None, ge=1, description="Custom rate limit (req/min, optional)")


class APIKeyResponse(BaseModel):
    key_id: str
    name: str
    role: str
    owner_id: str
    created_at: str
    expires_at: Optional[str]
    allowed_ips: List[str]
    rate_limit: Optional[int]
    is_active: bool
    last_used: Optional[str]
    use_count: int


class CreatedAPIKeyResponse(APIKeyResponse):
    raw_key: str = Field(..., description="⚠️ Show this ONLY once! Save it securely.")
    raw_key_preview: str = Field(..., description="First 12 chars of the key for identification")


# ── Helpers ──────────────────────────────────────────────────────────────────

def _get_user_id(request: Request) -> str:
    """Extract user_id from request (JWT or API key auth)."""
    uid = get_user_id_from_request(request)
    if not uid:
        raise HTTPException(status_code=401, detail="Authentication required")
    return uid


def _role_to_enum(role_str: str) -> Role:
    """Convert role string to Role enum."""
    mapping = {
        "user": Role.USER,
        "admin": Role.ADMIN,
    }
    return mapping.get(role_str.lower(), Role.USER)


# ── Routes ──────────────────────────────────────────────────────────────────

@router.post(
    "",
    response_model=CreatedAPIKeyResponse,
    summary="Create API Key",
    description="Create a new API key for external integrations. The raw key is returned **only once** — store it securely immediately.",
)
async def create_api_key(request: Request, body: CreateAPIKeyRequest):
    """
    Create a new API key.

    The raw key is returned ONLY in this response and never again.
    Use X-API-Key header to authenticate with the key.
    """
    user_id = _get_user_id(request)
    role = _role_to_enum(body.role)

    # Check max keys per user (prevent abuse)
    manager = get_api_key_manager()
    existing = manager.list_keys(owner_id=user_id)
    if len(existing) >= 10:
        raise HTTPException(
            status_code=429,
            detail="Maximum 10 API keys per user. Revoke an existing key first.",
        )

    key_info, raw_key = manager.create_key(
        name=body.name,
        role=role,
        owner_id=user_id,
        expires_in_days=body.expires_in_days,
        allowed_ips=body.allowed_ips,
        rate_limit=body.rate_limit,
    )

    return CreatedAPIKeyResponse(
        **{
            "key_id": key_info["key_id"],
            "name": key_info["name"],
            "role": key_info["role"],
            "owner_id": key_info["owner_id"],
            "created_at": key_info["created_at"],
            "expires_at": key_info["expires_at"],
            "allowed_ips": key_info.get("allowed_ips", []),
            "rate_limit": key_info.get("rate_limit"),
            "is_active": key_info["is_active"],
            "last_used": key_info.get("last_used"),
            "use_count": key_info.get("use_count", 0),
        },
        raw_key=raw_key,
        raw_key_preview=raw_key[:12] + "...",
    )


@router.get(
    "",
    response_model=List[APIKeyResponse],
    summary="List API Keys",
    description="List all API keys for the authenticated user. Raw keys are never returned.",
)
async def list_api_keys(request: Request):
    """
    List all API keys for the current user.
    Raw keys are never stored or returned after creation.
    """
    user_id = _get_user_id(request)
    manager = get_api_key_manager()
    keys = manager.list_keys(owner_id=user_id)
    return [APIKeyResponse(**k) for k in keys]


@router.delete(
    "/{key_id}",
    summary="Revoke API Key",
    description="Revoke (deactivate) an API key. This takes effect immediately.",
)
async def revoke_api_key(request: Request, key_id: str):
    """
    Revoke an API key by its key_id.
    The key is soft-revoked (is_active=False) and can no longer be used.
    """
    user_id = _get_user_id(request)
    manager = get_api_key_manager()

    # Security: only owner can revoke their own keys
    keys = manager.list_keys(owner_id=user_id)
    key_ids = [k["key_id"] for k in keys]
    if key_id not in key_ids:
        raise HTTPException(status_code=404, detail="API key not found")

    success = manager.revoke_key(key_id)
    if not success:
        raise HTTPException(status_code=404, detail="API key not found")

    return {
        "success": True,
        "key_id": key_id,
        "revoked_at": f"{time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}",
        "message": "API key has been revoked. Any in-flight requests may still succeed for up to 60 seconds.",
    }


@router.get(
    "/{key_id}/usage",
    summary="API Key Usage Stats",
    description="Get usage statistics for a specific API key (last used, total requests, etc.).",
)
async def get_key_usage(request: Request, key_id: str):
    """
    Get usage statistics for a specific API key.
    """
    user_id = _get_user_id(request)
    manager = get_api_key_manager()

    # Security: only owner can view their own key usage
    keys = manager.list_keys(owner_id=user_id)
    key_ids = [k["key_id"] for k in keys]
    if key_id not in key_ids:
        raise HTTPException(status_code=404, detail="API key not found")

    # Re-load full key info
    all_keys = manager.list_keys(owner_id=user_id)
    key_info = next((k for k in all_keys if k["key_id"] == key_id), None)
    if not key_info:
        raise HTTPException(status_code=404, detail="API key not found")

    return {
        "success": True,
        "key_id": key_id,
        "name": key_info["name"],
        "is_active": key_info["is_active"],
        "use_count": key_info.get("use_count", 0),
        "last_used": key_info.get("last_used"),
        "created_at": key_info["created_at"],
        "expires_at": key_info.get("expires_at"),
        "rate_limit": key_info.get("rate_limit"),
    }


@router.get(
    "/{key_id}/test",
    summary="Test API Key",
    description="Test if an API key is valid by sending a test request. Does not count toward rate limits.",
)
async def test_api_key(request: Request, key_id: str):
    """
    Test if an API key is valid and active.
    Returns basic info about the key without affecting rate limits.
    """
    user_id = _get_user_id(request)
    manager = get_api_key_manager()

    keys = manager.list_keys(owner_id=user_id)
    key_ids = [k["key_id"] for k in keys]
    if key_id not in key_ids:
        raise HTTPException(status_code=404, detail="API key not found")

    key_info = next((k for k in keys if k["key_id"] == key_id), None)
    if not key_info:
        raise HTTPException(status_code=404, detail="API key not found")

    return {
        "success": True,
        "valid": key_info["is_active"],
        "key_id": key_id,
        "name": key_info["name"],
        "role": key_info["role"],
        "message": "API key is valid and active."
                   if key_info["is_active"]
                   else "API key has been revoked.",
    }
