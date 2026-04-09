"""
API Rate Limiting & Quota Management Middleware

Features:
- Per-user rate limiting (requests per minute) — tier-aware
- Daily generation quota tracking (stored in data/quotas.json) — tier-aware
- HTTP 429 response with reset time when quota exceeded
- X-RateLimit-* response headers
- /api/v1/status endpoint for quota checking

Tier limits (from tiers.py):
- FREE: 60 req/min, 50 gens/day
- PRO: 300 req/min, 200 gens/day
- ENTERPRISE: 1000 req/min, unlimited

Author: Claude
Date: 2026-04-04
"""

import json
import logging
import os
import threading
import time
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any

from fastapi import Request, status
from fastapi.responses import JSONResponse

logger = logging.getLogger("rate_limit")

# ==================== Configuration ====================

# Default (FREE tier) limits — used when tiers module unavailable
DEFAULT_RATE_LIMIT_MAX_REQUESTS = int(os.getenv("RATE_LIMIT_MAX_REQUESTS", "60"))
DEFAULT_RATE_LIMIT_WINDOW_SECONDS = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))
DEFAULT_DAILY_QUOTA_GENERATIONS = int(os.getenv("DAILY_QUOTA_GENERATIONS", "50"))
QUOTA_FILE_PATH = os.getenv("QUOTA_FILE_PATH", "./data/quotas.json")

# ==================== Tier Integration ====================

def _get_tier_limits_fallback() -> dict[str, int]:
    """Fallback tier limits when tiers module can't be loaded."""
    return {
        "rate_limit_max_requests": DEFAULT_RATE_LIMIT_MAX_REQUESTS,
        "rate_limit_window_seconds": DEFAULT_RATE_LIMIT_WINDOW_SECONDS,
        "daily_generations": DEFAULT_DAILY_QUOTA_GENERATIONS,
    }


def _get_tier_limits_for_user(user_id: str) -> dict[str, int]:
    """Get rate limit and quota limits for a specific user based on their tier."""
    try:
        # Import here to avoid circular imports
        from ..routes.tiers import get_user_tier_limits
        tier, limits = get_user_tier_limits(user_id)
        return {
            "rate_limit_max_requests": limits["rate_limit_max_requests"],
            "rate_limit_window_seconds": limits["rate_limit_window_seconds"],
            "daily_generations": limits["daily_generations"],
            "tier": tier.value,
            "tier_name": limits["name"],
        }
    except Exception as e:
        logger.warning(f"Could not load tier limits for {user_id}: {e}")
        return {
            "rate_limit_max_requests": DEFAULT_RATE_LIMIT_MAX_REQUESTS,
            "rate_limit_window_seconds": DEFAULT_RATE_LIMIT_WINDOW_SECONDS,
            "daily_generations": DEFAULT_DAILY_QUOTA_GENERATIONS,
            "tier": "free",
            "tier_name": "免费版",
        }


# ==================== Data Structures ====================

@dataclass
class RateLimitInfo:
    """Rate limit status for a client"""
    requests: int = 0
    window_start: float = field(default_factory=time.time)
    limit: int = DEFAULT_RATE_LIMIT_MAX_REQUESTS
    window_seconds: int = DEFAULT_RATE_LIMIT_WINDOW_SECONDS
    tier: str = "free"
    tier_name: str = "免费版"

    def is_exceeded(self) -> bool:
        return self.requests >= self.limit

    def remaining(self) -> int:
        return max(0, self.limit - self.requests)

    def reset_at(self) -> float:
        return self.window_start + self.window_seconds

    def reset_in_seconds(self) -> int:
        return max(0, int(self.reset_at() - time.time()))


@dataclass
class QuotaInfo:
    """Daily quota status for a user"""
    date: str = ""  # YYYY-MM-DD
    generations_used: int = 0
    daily_limit: int = DEFAULT_DAILY_QUOTA_GENERATIONS
    last_generation_at: str | None = None
    tier: str = "free"
    tier_name: str = "免费版"

    def is_exceeded(self) -> bool:
        # -1 means unlimited
        if self.daily_limit == -1:
            return False
        return self.generations_used >= self.daily_limit

    def remaining(self) -> int:
        # -1 means unlimited
        if self.daily_limit == -1:
            return -1
        return max(0, self.daily_limit - self.generations_used)

    def reset_at(self) -> str:
        """Next reset time = midnight UTC of the next day"""
        today = datetime.utcnow().strftime("%Y-%m-%d")
        tomorrow = datetime.strptime(today, "%Y-%m-%d") + timedelta(days=1)
        return tomorrow.strftime("%Y-%m-%dT00:00:00Z")

    def needs_reset(self) -> bool:
        """Check if quota needs to be reset for a new day"""
        today = datetime.utcnow().strftime("%Y-%m-%d")
        return self.date != today

    def is_unlimited(self) -> bool:
        return self.daily_limit == -1


# ==================== Storage ====================

class QuotaStorage:
    """Thread-safe JSON-based quota storage"""

    def __init__(self, file_path: str = QUOTA_FILE_PATH):
        self._file_path = file_path
        self._lock = threading.Lock()
        self._ensure_file()

    def _ensure_file(self):
        os.makedirs(os.path.dirname(self._file_path), exist_ok=True)
        if not os.path.exists(self._file_path):
            with open(self._file_path, "w", encoding="utf-8") as f:
                json.dump({}, f)

    def _read(self) -> dict[str, Any]:
        try:
            with self._lock:
                with open(self._file_path, encoding="utf-8") as f:
                    return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            return {}

    def _write(self, data: dict[str, Any]):
        with self._lock:
            tmp_path = self._file_path + ".tmp"
            with open(tmp_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            os.replace(tmp_path, self._file_path)

    def get_user_quota(self, user_id: str) -> QuotaInfo:
        tier_info = _get_tier_limits_for_user(user_id)
        daily_limit = tier_info["daily_generations"]

        data = self._read()
        user_data = data.get(user_id, {})
        quota = QuotaInfo(
            date=user_data.get("date", ""),
            generations_used=user_data.get("generations_used", 0),
            daily_limit=daily_limit,
            last_generation_at=user_data.get("last_generation_at"),
            tier=tier_info["tier"],
            tier_name=tier_info["tier_name"],
        )
        # Reset if new day
        if quota.needs_reset():
            quota.date = datetime.utcnow().strftime("%Y-%m-%d")
            quota.generations_used = 0
            self.save_user_quota(user_id, quota)
        return quota

    def save_user_quota(self, user_id: str, quota: QuotaInfo):
        data = self._read()
        data[user_id] = {
            "date": quota.date,
            "generations_used": quota.generations_used,
            "last_generation_at": quota.last_generation_at
        }
        self._write(data)

    def increment_generation(self, user_id: str) -> tuple[QuotaInfo, bool]:
        """Increment generation count. Returns (quota_info, was_allowed)"""
        quota = self.get_user_quota(user_id)
        if quota.is_unlimited():
            # Unlimited — just track usage
            quota.generations_used += 1
            quota.date = datetime.utcnow().strftime("%Y-%m-%d")
            quota.last_generation_at = datetime.utcnow().isoformat()
            self.save_user_quota(user_id, quota)
            return quota, True
        if quota.is_exceeded():
            return quota, False
        quota.generations_used += 1
        quota.date = datetime.utcnow().strftime("%Y-%m-%d")
        quota.last_generation_at = datetime.utcnow().isoformat()
        self.save_user_quota(user_id, quota)
        return quota, True


# ==================== Rate Limiter ====================

class RateLimiter:
    """In-memory per-user rate limiter (thread-safe)"""

    def __init__(self):
        self._storage: dict[str, RateLimitInfo] = {}
        self._lock = threading.Lock()

    def _get_limits_for_user(self, user_id: str) -> tuple[int, int, str, str]:
        tier_info = _get_tier_limits_for_user(user_id)
        return (
            tier_info["rate_limit_max_requests"],
            tier_info["rate_limit_window_seconds"],
            tier_info["tier"],
            tier_info["tier_name"],
        )

    def check(self, user_id: str) -> tuple[RateLimitInfo, bool]:
        """Check and update rate limit. Returns (info, allowed)"""
        now = time.time()
        max_req, window_sec, tier, tier_name = self._get_limits_for_user(user_id)

        with self._lock:
            if user_id not in self._storage:
                self._storage[user_id] = RateLimitInfo(
                    requests=0,
                    window_start=now,
                    limit=max_req,
                    window_seconds=window_sec,
                    tier=tier,
                    tier_name=tier_name,
                )

            info = self._storage[user_id]

            # Update limits if tier changed
            info.limit = max_req
            info.window_seconds = window_sec
            info.tier = tier
            info.tier_name = tier_name

            # Reset window if expired
            if now - info.window_start >= info.window_seconds:
                info.requests = 0
                info.window_start = now

            if info.is_exceeded():
                return info, False

            info.requests += 1
            return info, True

    def get_info(self, user_id: str) -> RateLimitInfo:
        now = time.time()
        max_req, window_sec, tier, tier_name = self._get_limits_for_user(user_id)

        with self._lock:
            if user_id not in self._storage:
                return RateLimitInfo(
                    requests=0,
                    window_start=now,
                    limit=max_req,
                    window_seconds=window_sec,
                    tier=tier,
                    tier_name=tier_name,
                )

            info = self._storage[user_id]
            # Update limits if tier changed
            info.limit = max_req
            info.window_seconds = window_sec
            info.tier = tier
            info.tier_name = tier_name

            # Reset if expired
            if now - info.window_start >= info.window_seconds:
                return RateLimitInfo(
                    requests=0,
                    window_start=now,
                    limit=max_req,
                    window_seconds=window_sec,
                    tier=tier,
                    tier_name=tier_name,
                )
            return info


# ==================== Global Instances ====================

_quota_storage: QuotaStorage | None = None
_rate_limiter: RateLimiter | None = None


def get_quota_storage() -> QuotaStorage:
    global _quota_storage
    if _quota_storage is None:
        _quota_storage = QuotaStorage()
    return _quota_storage


def get_rate_limiter() -> RateLimiter:
    global _rate_limiter
    if _rate_limiter is None:
        _rate_limiter = RateLimiter()
    return _rate_limiter


# ==================== User Identification ====================

def get_user_id_from_request(request: Request) -> str:
    """
    Extract user_id from request.
    Priority:
    1. Authorization header (JWT Bearer token) - primary authentication
    2. X-User-ID header - only for trusted internal/debug requests
    3. X-Forwarded-For / X-Real-IP - IP-based fallback (rate limiting only)
    """
    import os
    # Debug mode check - only trust X-User-ID in trusted environments
    is_trusted = os.getenv("RABAIMIND_TRUSTED_IP", "false").lower() == "true"

    # Try Authorization header first (JWT is authenticated)
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        try:
            from ...core.auth import get_auth_manager
            auth = get_auth_manager()
            payload = auth.verify_token(auth_header[7:])
            user_id = payload.get("sub", "unknown")
            return f"user_{user_id}"
        except Exception:
            pass

    # X-User-ID only trusted in debug/trusted mode (not for production)
    if is_trusted:
        user_id = request.headers.get("X-User-ID")
        if user_id:
            return user_id

    # Fallback to IP (least trusted, only for rate limiting)
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        ip = forwarded.split(",")[0].strip()
    else:
        ip = request.headers.get("X-Real-IP", request.client.host if request.client else "unknown")

    safe_ip = ip.replace(".", "_").replace(":", "_")
    return f"ip_{safe_ip}"


# ==================== Quota Checking ====================

def check_quota(user_id: str) -> tuple[QuotaInfo, bool]:
    """Check if user has remaining daily generation quota"""
    storage = get_quota_storage()
    quota, allowed = storage.increment_generation(user_id)
    return quota, allowed


def get_quota_status(user_id: str) -> QuotaInfo:
    """Get current quota status without incrementing"""
    storage = get_quota_storage()
    return storage.get_user_quota(user_id)


# ==================== HTTP 429 Response ====================

def quota_exceeded_response(quota: QuotaInfo) -> JSONResponse:
    """Return HTTP 429 with reset time and helpful headers"""
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content={
            "success": False,
            "error": "QUOTA_EXCEEDED",
            "message": f"每日生成配额已用完（{quota.daily_limit}次/天）",
            "detail": {
                "daily_limit": quota.daily_limit,
                "used": quota.generations_used,
                "remaining": quota.remaining(),
                "reset_at": quota.reset_at(),
                "reset_in_hours": _hours_until_reset(),
                "tier": quota.tier,
                "tier_name": quota.tier_name,
                "upgrade_url": "/api/v1/tiers",
            }
        },
        headers={
            "X-RateLimit-Limit": str(quota.daily_limit),
            "X-RateLimit-Remaining": str(quota.remaining()),
            "X-RateLimit-Reset": quota.reset_at(),
            "Retry-After": str(_seconds_until_reset()),
            "X-Quota-Tier": quota.tier,
            "X-Quota-Tier-Name": quota.tier_name,
            "Content-Type": "application/json; charset=utf-8"
        }
    )


def rate_limit_exceeded_response(rate_info: RateLimitInfo) -> JSONResponse:
    """Return HTTP 429 when rate limit exceeded"""
    reset_in = rate_info.reset_in_seconds()
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content={
            "success": False,
            "error": "RATE_LIMIT_EXCEEDED",
            "message": f"请求过于频繁，请 {reset_in} 秒后重试",
            "detail": {
                "limit": rate_info.limit,
                "window_seconds": rate_info.window_seconds,
                "reset_in_seconds": reset_in,
                "tier": rate_info.tier,
                "tier_name": rate_info.tier_name,
                "upgrade_url": "/api/v1/tiers",
            }
        },
        headers={
            "X-RateLimit-Limit": str(rate_info.limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": str(int(rate_info.reset_at())),
            "Retry-After": str(reset_in),
            "X-Quota-Tier": rate_info.tier,
            "X-Quota-Tier-Name": rate_info.tier_name,
            "Content-Type": "application/json; charset=utf-8"
        }
    )


def _seconds_until_reset() -> int:
    """Seconds until midnight UTC (quota reset)"""
    now = datetime.utcnow()
    tomorrow = datetime.strptime(now.strftime("%Y-%m-%d"), "%Y-%m-%d") + timedelta(days=1)
    return max(1, int((tomorrow - now).total_seconds()))


def _hours_until_reset() -> int:
    return max(1, (_seconds_until_reset() + 3599) // 3600)


# ==================== Rate Limit Headers Helper ====================

def build_rate_limit_headers(rate_info: RateLimitInfo, quota_info: QuotaInfo) -> dict[str, str]:
    """Build X-RateLimit-* response headers"""
    return {
        "X-RateLimit-Limit": str(rate_info.limit),
        "X-RateLimit-Remaining": str(rate_info.remaining()),
        "X-RateLimit-Reset": str(int(rate_info.reset_at())),
        "X-Quota-Limit": str(quota_info.daily_limit),
        "X-Quota-Remaining": str(quota_info.remaining()),
        "X-Quota-Reset": quota_info.reset_at(),
        "X-Quota-Tier": quota_info.tier,
    }


def add_rate_limit_headers(response, rate_info: RateLimitInfo, quota_info: QuotaInfo):
    """Add rate limit headers to an existing response"""
    headers = build_rate_limit_headers(rate_info, quota_info)
    for k, v in headers.items():
        response.headers[k] = v
    return response


# ==================== Backward-compatible exports ====================

# Keep these for any code that imports directly from this module
RATE_LIMIT_MAX_REQUESTS = DEFAULT_RATE_LIMIT_MAX_REQUESTS
RATE_LIMIT_WINDOW_SECONDS = DEFAULT_RATE_LIMIT_WINDOW_SECONDS
DAILY_QUOTA_GENERATIONS = DEFAULT_DAILY_QUOTA_GENERATIONS
