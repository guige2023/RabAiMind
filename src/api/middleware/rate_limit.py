# -*- coding: utf-8 -*-
"""
API Rate Limiting & Quota Management Middleware

Features:
- Per-user rate limiting (requests per minute)
- Daily generation quota tracking (stored in data/quotas.json)
- HTTP 429 response with reset time when quota exceeded
- X-RateLimit-* response headers
- /api/v1/status endpoint for quota checking

Author: Claude
Date: 2026-04-04
"""

import os
import json
import time
import threading
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, Tuple
from dataclasses import dataclass, field
from functools import lru_cache

from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse

logger = logging.getLogger("rate_limit")

# ==================== Configuration ====================

RATE_LIMIT_MAX_REQUESTS = int(os.getenv("RATE_LIMIT_MAX_REQUESTS", "60"))  # per window
RATE_LIMIT_WINDOW_SECONDS = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))  # 1 minute window
DAILY_QUOTA_GENERATIONS = int(os.getenv("DAILY_QUOTA_GENERATIONS", "50"))  # per day
QUOTA_FILE_PATH = os.getenv("QUOTA_FILE_PATH", "./data/quotas.json")

# ==================== Data Structures ====================

@dataclass
class RateLimitInfo:
    """Rate limit status for a client"""
    requests: int = 0
    window_start: float = field(default_factory=time.time)
    limit: int = RATE_LIMIT_MAX_REQUESTS
    window_seconds: int = RATE_LIMIT_WINDOW_SECONDS

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
    daily_limit: int = DAILY_QUOTA_GENERATIONS
    last_generation_at: Optional[str] = None

    def is_exceeded(self) -> bool:
        return self.generations_used >= self.daily_limit

    def remaining(self) -> int:
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

    def _read(self) -> Dict[str, Any]:
        try:
            with self._lock:
                with open(self._file_path, "r", encoding="utf-8") as f:
                    return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            return {}

    def _write(self, data: Dict[str, Any]):
        with self._lock:
            # Write to temp file then rename (atomic)
            tmp_path = self._file_path + ".tmp"
            with open(tmp_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            os.replace(tmp_path, self._file_path)

    def get_user_quota(self, user_id: str) -> QuotaInfo:
        data = self._read()
        user_data = data.get(user_id, {})
        quota = QuotaInfo(
            date=user_data.get("date", ""),
            generations_used=user_data.get("generations_used", 0),
            daily_limit=DAILY_QUOTA_GENERATIONS,
            last_generation_at=user_data.get("last_generation_at")
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

    def increment_generation(self, user_id: str) -> Tuple[QuotaInfo, bool]:
        """Increment generation count. Returns (quota_info, was_allowed)"""
        quota = self.get_user_quota(user_id)
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
        self._storage: Dict[str, RateLimitInfo] = {}
        self._lock = threading.Lock()

    def check(self, user_id: str) -> Tuple[RateLimitInfo, bool]:
        """Check and update rate limit. Returns (info, allowed)"""
        now = time.time()

        with self._lock:
            if user_id not in self._storage:
                self._storage[user_id] = RateLimitInfo(
                    requests=0,
                    window_start=now,
                    limit=RATE_LIMIT_MAX_REQUESTS,
                    window_seconds=RATE_LIMIT_WINDOW_SECONDS
                )

            info = self._storage[user_id]

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
        with self._lock:
            if user_id not in self._storage:
                return RateLimitInfo(
                    requests=0,
                    window_start=now,
                    limit=RATE_LIMIT_MAX_REQUESTS,
                    window_seconds=RATE_LIMIT_WINDOW_SECONDS
                )
            info = self._storage[user_id]
            # Reset if expired
            if now - info.window_start >= info.window_seconds:
                return RateLimitInfo(
                    requests=0,
                    window_start=now,
                    limit=RATE_LIMIT_MAX_REQUESTS,
                    window_seconds=RATE_LIMIT_WINDOW_SECONDS
                )
            return info


# ==================== Global Instances ====================

_quota_storage: Optional[QuotaStorage] = None
_rate_limiter: Optional[RateLimiter] = None


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
    1. X-User-ID header (for authenticated clients)
    2. Authorization header (JWT Bearer token)
    3. X-Forwarded-For / X-Real-IP (IP-based fallback)
    """
    # Check X-User-ID header first
    user_id = request.headers.get("X-User-ID")
    if user_id:
        return user_id

    # Try Authorization header
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

    # Fallback to IP
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        ip = forwarded.split(",")[0].strip()
    else:
        ip = request.headers.get("X-Real-IP", request.client.host if request.client else "unknown")

    # Normalize: replace dots and colons for safety
    safe_ip = ip.replace(".", "_").replace(":", "_")
    return f"ip_{safe_ip}"


# ==================== Quota Checking ====================

def check_quota(user_id: str) -> Tuple[QuotaInfo, bool]:
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
                "reset_in_hours": _hours_until_reset()
            }
        },
        headers={
            "X-RateLimit-Limit": str(quota.daily_limit),
            "X-RateLimit-Remaining": str(quota.remaining()),
            "X-RateLimit-Reset": quota.reset_at(),
            "Retry-After": str(_seconds_until_reset()),
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
                "reset_in_seconds": reset_in
            }
        },
        headers={
            "X-RateLimit-Limit": str(rate_info.limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": str(rate_info.reset_at()),
            "Retry-After": str(reset_in),
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

def build_rate_limit_headers(rate_info: RateLimitInfo, quota_info: QuotaInfo) -> Dict[str, str]:
    """Build X-RateLimit-* response headers"""
    return {
        "X-RateLimit-Limit": str(rate_info.limit),
        "X-RateLimit-Remaining": str(rate_info.remaining()),
        "X-RateLimit-Reset": str(int(rate_info.reset_at())),
        "X-Quota-Limit": str(quota_info.daily_limit),
        "X-Quota-Remaining": str(quota_info.remaining()),
        "X-Quota-Reset": quota_info.reset_at(),
    }


def add_rate_limit_headers(response, rate_info: RateLimitInfo, quota_info: QuotaInfo):
    """Add rate limit headers to an existing response"""
    headers = build_rate_limit_headers(rate_info, quota_info)
    for k, v in headers.items():
        response.headers[k] = v
    return response
