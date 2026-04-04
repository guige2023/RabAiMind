# -*- coding: utf-8 -*-
"""
API Status & Health Endpoint

Provides quota and rate limit status for users.

Author: Claude
Date: 2026-04-04
"""

from fastapi import APIRouter, Request, Response
from typing import Dict, Any, Optional
from datetime import datetime

from ...api.middleware.rate_limit import (
    get_user_id_from_request,
    get_quota_status,
    get_rate_limiter,
    build_rate_limit_headers,
    add_rate_limit_headers,
    RATE_LIMIT_MAX_REQUESTS,
    RATE_LIMIT_WINDOW_SECONDS,
    DAILY_QUOTA_GENERATIONS,
)

router = APIRouter(prefix="/api/v1", tags=["status"])


class StatusResponse:
    """Status response model"""
    def __init__(
        self,
        success: bool,
        user_id: str,
        rate_limit: Dict[str, Any],
        quota: Dict[str, Any],
        server_time: str,
        version: str = "1.0.0"
    ):
        self.success = success
        self.user_id = user_id
        self.rate_limit = rate_limit
        self.quota = quota
        self.server_time = server_time
        self.version = version

    def dict(self):
        return {
            "success": self.success,
            "user_id": self.user_id,
            "rate_limit": self.rate_limit,
            "quota": self.quota,
            "server_time": self.server_time,
            "version": self.version
        }


@router.get("/status")
async def get_status(request: Request, response: Response):
    """
    Get current user's rate limit and quota status.

    Returns:
        - user_id: Identified user ID
        - rate_limit: Current rate limit window status
        - quota: Daily generation quota status
        - server_time: Current server UTC time

    Headers added:
        - X-RateLimit-Limit: Max requests per window
        - X-RateLimit-Remaining: Remaining requests in current window
        - X-RateLimit-Reset: Unix timestamp when rate limit resets
        - X-Quota-Limit: Daily generation limit
        - X-Quota-Remaining: Remaining generations for today
        - X-Quota-Reset: ISO timestamp when quota resets (midnight UTC)
    """
    user_id = get_user_id_from_request(request)

    # Get rate limit info
    rate_limiter = get_rate_limiter()
    rate_info = rate_limiter.get_info(user_id)

    # Get quota info
    quota_info = get_quota_status(user_id)

    # Add headers to response
    add_rate_limit_headers(response, rate_info, quota_info)

    return StatusResponse(
        success=True,
        user_id=user_id,
        rate_limit={
            "limit": rate_info.limit,
            "used": rate_info.requests,
            "remaining": rate_info.remaining(),
            "window_seconds": rate_info.window_seconds,
            "reset_in_seconds": rate_info.reset_in_seconds(),
            "reset_at_timestamp": int(rate_info.reset_at())
        },
        quota={
            "daily_limit": quota_info.daily_limit,
            "used": quota_info.generations_used,
            "remaining": quota_info.remaining(),
            "reset_at": quota_info.reset_at(),
            "last_generation_at": quota_info.last_generation_at
        },
        server_time=datetime.utcnow().isoformat() + "Z",
        version="1.0.0"
    ).dict()


@router.get("/limits")
async def get_limits():
    """
    Get server's rate limit and quota configuration.

    This endpoint does not require authentication and returns
    the server's configured limits.
    """
    return {
        "success": True,
        "rate_limit": {
            "max_requests": RATE_LIMIT_MAX_REQUESTS,
            "window_seconds": RATE_LIMIT_WINDOW_SECONDS
        },
        "quota": {
            "daily_generations": DAILY_QUOTA_GENERATIONS
        },
        "version": "1.0.0"
    }
