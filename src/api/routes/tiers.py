# -*- coding: utf-8 -*-
"""
Rate Limit Tiers — Free/Pro/Enterprise

Provides tiered rate limiting and quota management:
- FREE: 60 req/min, 50 gens/day
- PRO: 300 req/min, 200 gens/day
- ENTERPRISE: 1000 req/min, unlimited gens

Author: Claude
Date: 2026-04-04
"""

import os
import json
import threading
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

from fastapi import APIRouter, HTTPException, Request, Depends, Query
from pydantic import BaseModel

from ...core.security import Role, User
from ...api.middleware.auth import get_current_user, get_current_admin

logger = logging.getLogger("tiers")

router = APIRouter(prefix="/api/v1/tiers", tags=["tiers"])


# ==================== Tier Definitions ====================

class Tier(str, Enum):
    FREE = "free"
    PRO = "pro"
    ENTERPRISE = "enterprise"


TIER_LIMITS = {
    Tier.FREE: {
        "rate_limit_max_requests": 60,
        "rate_limit_window_seconds": 60,
        "daily_generations": 50,
        "max_file_size_mb": 10,
        "concurrent_generations": 1,
        "api_key_limit": 1,
        "sso_enabled": False,
        "gdpr_export": True,
        "custom_brand": False,
        "priority_support": False,
        "name": "免费版",
        "description": "适合个人用户入门使用",
    },
    Tier.PRO: {
        "rate_limit_max_requests": 300,
        "rate_limit_window_seconds": 60,
        "daily_generations": 200,
        "max_file_size_mb": 50,
        "concurrent_generations": 3,
        "api_key_limit": 5,
        "sso_enabled": True,
        "gdpr_export": True,
        "custom_brand": True,
        "priority_support": False,
        "name": "专业版",
        "description": "适合团队和专业人士",
    },
    Tier.ENTERPRISE: {
        "rate_limit_max_requests": 1000,
        "rate_limit_window_seconds": 60,
        "daily_generations": -1,  # unlimited
        "max_file_size_mb": 200,
        "concurrent_generations": 10,
        "api_key_limit": -1,  # unlimited
        "sso_enabled": True,
        "gdpr_export": True,
        "custom_brand": True,
        "priority_support": True,
        "name": "企业版",
        "description": "适合企业大规模使用",
    },
}

# Environment variable overrides (for easy per-deployment config)
# Apply environment variable overrides for tier limits
for tier_key in list(TIER_LIMITS.keys()):
    env_prefix = f"TIER_{tier_key.value.upper()}_"
    tier = TIER_LIMITS[tier_key]
    env_max = os.getenv(f"{env_prefix}RATE_LIMIT")
    if env_max:
        tier["rate_limit_max_requests"] = int(env_max)
    env_gen = os.getenv(f"{env_prefix}GENERATIONS")
    if env_gen:
        tier["daily_generations"] = int(env_gen)


# ==================== User Tier Storage ====================

TIER_STORAGE_FILE = "./data/user_tiers.json"


class TierStorage:
    """Maps user_id -> tier, persisted in JSON"""

    def __init__(self):
        self._lock = threading.Lock()
        os.makedirs(os.path.dirname(TIER_STORAGE_FILE), exist_ok=True)
        if not os.path.exists(TIER_STORAGE_FILE):
            self._save({})

    def _load(self) -> Dict[str, str]:
        try:
            with open(TIER_STORAGE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            return {}

    def _save(self, data: Dict[str, str]):
        tmp = TIER_STORAGE_FILE + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        os.replace(tmp, TIER_STORAGE_FILE)

    def get_tier(self, user_id: str) -> Tier:
        data = self._load()
        tier_str = data.get(user_id, Tier.FREE.value)
        try:
            return Tier(tier_str)
        except ValueError:
            return Tier.FREE

    def set_tier(self, user_id: str, tier: Tier) -> bool:
        with self._lock:
            data = self._load()
            data[user_id] = tier.value
            self._save(data)
            return True

    def list_tiers(self) -> Dict[str, str]:
        return self._load()

    def remove_tier(self, user_id: str) -> bool:
        with self._lock:
            data = self._load()
            if user_id in data:
                del data[user_id]
                self._save(data)
                return True
            return False


_tier_storage: Optional[TierStorage] = None


def get_tier_storage() -> TierStorage:
    global _tier_storage
    if _tier_storage is None:
        _tier_storage = TierStorage()
    return _tier_storage


# ==================== Tier-Aware Rate Limit Integration ====================

def get_tier_limits(tier: Tier) -> Dict[str, Any]:
    """Get rate limit and quota values for a given tier."""
    limits = TIER_LIMITS.get(tier, TIER_LIMITS[Tier.FREE]).copy()
    return limits


def get_user_tier_limits(user_id: str) -> Tuple[Tier, Dict[str, Any]]:
    """Get the tier and limits for a specific user."""
    storage = get_tier_storage()
    tier = storage.get_tier(user_id)
    return tier, get_tier_limits(tier)


# ==================== Pydantic Models ====================

class TierInfo(BaseModel):
    tier: str
    name: str
    description: str
    rate_limit_max_requests: int
    rate_limit_window_seconds: int
    daily_generations: int
    max_file_size_mb: int
    concurrent_generations: int
    api_key_limit: int
    sso_enabled: bool
    gdpr_export: bool
    custom_brand: bool
    priority_support: bool


class UserTierInfo(BaseModel):
    user_id: str
    tier: str
    limits: TierInfo


class TierUpgradeRequest(BaseModel):
    tier: str


class TierChangeRequest(BaseModel):
    user_id: str
    tier: str


# ==================== Routes ====================

@router.get("", response_model=list)
async def list_tiers():
    """
    List all available tiers with their limits.

    No authentication required.
    """
    result = []
    for tier_key, tier_info in TIER_LIMITS.items():
        result.append(TierInfo(
            tier=tier_key.value,
            name=tier_info["name"],
            description=tier_info["description"],
            rate_limit_max_requests=tier_info["rate_limit_max_requests"],
            rate_limit_window_seconds=tier_info["rate_limit_window_seconds"],
            daily_generations=tier_info["daily_generations"],
            max_file_size_mb=tier_info["max_file_size_mb"],
            concurrent_generations=tier_info["concurrent_generations"],
            api_key_limit=tier_info["api_key_limit"],
            sso_enabled=tier_info["sso_enabled"],
            gdpr_export=tier_info["gdpr_export"],
            custom_brand=tier_info["custom_brand"],
            priority_support=tier_info["priority_support"],
        ))
    return result


@router.get("/my", response_model=UserTierInfo)
async def get_my_tier(current_user: User = Depends(get_current_user)):
    """
    Get current user's tier and associated limits.
    """
    tier, limits = get_user_tier_limits(current_user.user_id)
    return UserTierInfo(
        user_id=current_user.user_id,
        tier=tier.value,
        limits=TierInfo(
            tier=tier.value,
            name=limits["name"],
            description=limits["description"],
            rate_limit_max_requests=limits["rate_limit_max_requests"],
            rate_limit_window_seconds=limits["rate_limit_window_seconds"],
            daily_generations=limits["daily_generations"],
            max_file_size_mb=limits["max_file_size_mb"],
            concurrent_generations=limits["concurrent_generations"],
            api_key_limit=limits["api_key_limit"],
            sso_enabled=limits["sso_enabled"],
            gdpr_export=limits["gdpr_export"],
            custom_brand=limits["custom_brand"],
            priority_support=limits["priority_support"],
        )
    )


@router.post("/upgrade")
async def upgrade_tier(
    req: TierUpgradeRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Upgrade to a higher tier (self-service).

    In production, this would integrate with a payment provider.
    For now, just sets the tier.
    """
    try:
        new_tier = Tier(req.tier.lower())
    except ValueError:
        raise HTTPException(status_code=400, detail="无效的套餐级别")

    current_tier, _ = get_user_tier_limits(current_user.user_id)

    # Only allow upgrades (not downgrades via this endpoint)
    tier_order = [Tier.FREE, Tier.PRO, Tier.ENTERPRISE]
    if tier_order.index(new_tier) <= tier_order.index(current_tier):
        raise HTTPException(
            status_code=400,
            detail="降级请联系客服"
        )

    storage = get_tier_storage()
    storage.set_tier(current_user.user_id, new_tier)

    # Log the change
    from ...core.security import get_audit_logger
    get_audit_logger().log(
        action="tier_upgrade",
        user_id=current_user.user_id,
        role=current_user.role.value,
        path="/api/v1/tiers/upgrade",
        extra={"old_tier": current_tier.value, "new_tier": new_tier.value}
    )

    return {
        "success": True,
        "message": f"已升级到 {TIER_LIMITS[new_tier]['name']}",
        "tier": new_tier.value,
        "limits": get_tier_limits(new_tier),
    }


# ==================== Admin Tier Management ====================

@router.get("/admin/users", response_model=Dict[str, str])
async def list_user_tiers(admin: User = Depends(get_current_admin)):
    """
    List all user tier assignments (admin only).
    """
    storage = get_tier_storage()
    return storage.list_tiers()


@router.get("/admin/users/{user_id}", response_model=UserTierInfo)
async def get_user_tier(
    user_id: str,
    admin: User = Depends(get_current_admin),
):
    """
    Get a specific user's tier (admin only).
    """
    tier, limits = get_user_tier_limits(user_id)
    return UserTierInfo(
        user_id=user_id,
        tier=tier.value,
        limits=TierInfo(
            tier=tier.value,
            name=limits["name"],
            description=limits["description"],
            rate_limit_max_requests=limits["rate_limit_max_requests"],
            rate_limit_window_seconds=limits["rate_limit_window_seconds"],
            daily_generations=limits["daily_generations"],
            max_file_size_mb=limits["max_file_size_mb"],
            concurrent_generations=limits["concurrent_generations"],
            api_key_limit=limits["api_key_limit"],
            sso_enabled=limits["sso_enabled"],
            gdpr_export=limits["gdpr_export"],
            custom_brand=limits["custom_brand"],
            priority_support=limits["priority_support"],
        )
    )


@router.post("/admin/users/{user_id}")
async def set_user_tier(
    user_id: str,
    req: TierChangeRequest,
    admin: User = Depends(get_current_admin),
):
    """
    Set a user's tier (admin only).
    """
    try:
        new_tier = Tier(req.tier.lower())
    except ValueError:
        raise HTTPException(status_code=400, detail="无效的套餐级别")

    storage = get_tier_storage()
    old_tier = storage.get_tier(user_id)
    storage.set_tier(user_id, new_tier)

    # Log the change
    from ...core.security import get_audit_logger
    get_audit_logger().log(
        action="tier_changed_by_admin",
        user_id=user_id,
        role=admin.role.value,
        path=f"/api/v1/tiers/admin/users/{user_id}",
        extra={
            "old_tier": old_tier.value,
            "new_tier": new_tier.value,
            "admin_id": admin.user_id,
        }
    )

    return {
        "success": True,
        "user_id": user_id,
        "old_tier": old_tier.value,
        "new_tier": new_tier.value,
        "limits": get_tier_limits(new_tier),
    }


@router.delete("/admin/users/{user_id}")
async def reset_user_tier(
    user_id: str,
    admin: User = Depends(get_current_admin),
):
    """
    Reset a user back to FREE tier (admin only).
    """
    storage = get_tier_storage()
    old_tier = storage.get_tier(user_id)
    success = storage.remove_tier(user_id)

    if not success and old_tier == Tier.FREE:
        pass  # Already at FREE

    get_audit_logger().log(
        action="tier_reset_by_admin",
        user_id=user_id,
        role=admin.role.value,
        path=f"/api/v1/tiers/admin/users/{user_id}",
        extra={"old_tier": old_tier.value, "admin_id": admin.user_id}
    )

    return {
        "success": True,
        "user_id": user_id,
        "message": f"已重置为免费版"
    }


@router.get("/admin/stats")
async def get_tier_statistics(admin: User = Depends(get_current_admin)):
    """
    Get tier distribution statistics (admin only).
    """
    storage = get_tier_storage()
    tiers = storage.list_tiers()

    stats = {t.value: 0 for t in Tier}
    stats["unset (free)"] = 0

    for user_id, tier_str in tiers.items():
        if tier_str in stats:
            stats[tier_str] += 1
        else:
            stats["unset (free)"] += 1

    return {
        "total_users": len(tiers),
        "tier_distribution": stats,
        "tiers": {
            tier.value: {
                "name": TIER_LIMITS[tier]["name"],
                "rate_limit": TIER_LIMITS[tier]["rate_limit_max_requests"],
                "daily_generations": TIER_LIMITS[tier]["daily_generations"],
                "user_count": stats.get(tier.value, 0),
            }
            for tier in Tier
        }
    }
