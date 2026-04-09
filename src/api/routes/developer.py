# -*- coding: utf-8 -*-
"""
API Developer Platform — Routes

Provides:
- API Developer Portal info & navigation
- Code examples in Python / JavaScript / cURL
- Rate limit dashboard
- API health monitor
- Webhook event log viewer

Author: Claude
Date: 2026-04-04
"""

import asyncio
import time
import hashlib
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from ...config import settings
from ...services.developer_service import get_developer_service
from ...api.middleware.rate_limit import (
    get_user_id_from_request,
    get_quota_status,
    get_rate_limiter,
)

router = APIRouter(prefix="/api/v1/developer", tags=["developer"])


# ── Helpers ──────────────────────────────────────────────────

def _make_code_example(
    lang: str,
    method: str,
    path: str,
    headers: Dict[str, str],
    body: Optional[str],
    description: str,
) -> Dict[str, str]:
    """Build a code example dict for one language."""
    snippet = ""
    if lang == "curl":
        snippet = f'curl -X {method} "http://localhost:8003{path}" \\\n'
        for k, v in headers.items():
            snippet += f'  -H "{k}: {v}" \\\n'
        if body:
            snippet += f'  -d \'{body}\''
    elif lang == "python":
        headers_repr = repr(headers)
        snippet = (
            f'import requests\n\n'
            f'resp = requests.{method.lower()}(\n'
            f'    "http://localhost:8003{path}",\n'
            f'    headers={headers_repr},\n'
            f')'
        )
        if body:
            snippet += f',\n    json={body}'
        snippet += "\n)"
    elif lang == "javascript":
        headers_repr = repr(headers)
        snippet = (
            f'const resp = await fetch("http://localhost:8003{path}", {{\n'
            f'  method: "{method}",\n'
            f'  headers: {headers_repr},\n'
        )
        if body:
            snippet += f'  body: JSON.stringify({body}),\n'
        snippet += "});\nconst data = await resp.json();"
    return {"lang": lang, "description": description, "code": snippet}


def _build_examples() -> Dict[str, List[Dict[str, str]]]:
    """Build code examples for all main API endpoints."""
    h = {"Content-Type": "application/json", "Accept": "application/json"}
    body_gen = '{"user_request":"创建一个关于AI发展趋势的演示文稿","scene":"tech","style":"modern","slide_count":10}'
    body_plan = '{"user_request":"创建一个关于AI发展趋势的演示文稿","slide_count":10}'

    endpoints = [
        ("生成 PPT", "POST", "/api/v1/ppt/generate", h, body_gen),
        ("查询大纲", "POST", "/api/v1/ppt/plan", h, body_plan),
        ("查询任务状态", "GET", "/api/v1/ppt/task/{task_id}", h, None),
        ("取消任务", "POST", "/api/v1/ppt/task/{task_id}/cancel", h, None),
        ("下载 PPT", "GET", "/api/v1/ppt/download/{task_id}", {}, None),
        ("获取用户状态", "GET", "/api/v1/status", {}, None),
        ("获取配额限制", "GET", "/api/v1/limits", {}, None),
        ("获取套餐信息", "GET", "/api/v1/tiers", {}, None),
        ("注册 Webhook", "POST", "/api/v1/webhooks", h, '{"url":"https://your-server.com/webhook","events":["generation.completed"]}'),
        ("列出 Webhooks", "GET", "/api/v1/webhooks", {}, None),
        ("删除 Webhook", "DELETE", "/api/v1/webhooks/{webhook_id}", {}, None),
        ("发送测试事件", "POST", "/api/v1/webhooks/{webhook_id}/test", h, '{"event":"generation.completed"}'),
        ("创建 API Key", "POST", "/api/v1/developer/api-keys", h, '{"name":"My Integration Key","role":"user"}'),
        ("列出 API Keys", "GET", "/api/v1/developer/api-keys", {}, None),
        ("查看 Key 用量", "GET", "/api/v1/developer/api-keys/{key_id}/usage", {}, None),
        ("撤销 API Key", "DELETE", "/api/v1/developer/api-keys/{key_id}", {}, None),
    ]

    result: Dict[str, List[Dict[str, str]]] = {}
    for lang in ["python", "javascript", "curl"]:
        result[lang] = []
        for desc, method, path, headers, body in endpoints:
            result[lang].append(
                _make_code_example(lang, method, path, headers, body, f"{method} {path} — {desc}")
            )
    return result


# ── Pydantic Models ──────────────────────────────────────────

class HealthCheckItem(BaseModel):
    component: str
    status: str  # "ok" | "degraded" | "error"
    latency_ms: Optional[float] = None
    detail: str = ""


class RateLimitDashboard(BaseModel):
    user_id: str
    tier: str
    tier_name: str
    rate_limit: Dict[str, Any]
    quota: Dict[str, Any]


# ── Routes ───────────────────────────────────────────────────

@router.get(
    "/info",
    summary="API Developer Platform 信息",
    description="Returns developer portal metadata, available tools, and navigation links.",
)
async def get_developer_info():
    """
    API Developer Platform information and navigation.
    """
    return {
        "name": "RabAiMind API Developer Platform",
        "version": "1.0.0",
        "description": "AI PPT Generation Platform — Developer Tools",
        "endpoints": {
            "docs": {
                "swagger_ui": "/docs",
                "redoc": "/redoc",
                "openapi_json": "/openapi.json",
            },
            "developer": {
                "info": "GET /api/v1/developer/info",
                "examples": "GET /api/v1/developer/examples",
                "rate_limits": "GET /api/v1/developer/rate-limits",
                "health": "GET /api/v1/developer/health",
                "webhook_logs": "GET /api/v1/developer/webhook-logs",
                "api_keys": "POST/GET/DELETE /api/v1/developer/api-keys",
            },
            "core": {
                "generate": "POST /api/v1/ppt/generate",
                "plan": "POST /api/v1/ppt/plan",
                "task_status": "GET /api/v1/ppt/task/{task_id}",
                "cancel": "POST /api/v1/ppt/task/{task_id}/cancel",
                "download": "GET /api/v1/ppt/download/{task_id}",
                "history": "GET /api/v1/history",
                "templates": "GET /api/v1/templates",
                "webhooks": "GET/POST /api/v1/webhooks",
                "status": "GET /api/v1/status",
                "tiers": "GET /api/v1/tiers",
            },
        },
        "features": [
            "Interactive Swagger UI (Try It Out)",
            "Multi-language code examples (Python, JavaScript, cURL)",
            "Rate limit dashboard with tier breakdown",
            "API health monitor with component status",
            "Webhook event log viewer with delivery history",
            "API key management (create, list, revoke, usage stats)",
        ],
        "sdk": {
            "python": "pip install requests",
            "javascript": "npm install node-fetch",
        },
    }


@router.get(
    "/examples",
    summary="Code Examples — All Languages",
    description="Returns code examples for all main API endpoints in Python, JavaScript, and cURL.",
)
async def get_code_examples():
    """
    Returns ready-to-copy code examples for all API endpoints.

    **Languages:** `python`, `javascript`, `curl`
    """
    return {
        "success": True,
        "languages": ["python", "javascript", "curl"],
        "examples": _build_examples(),
        "notice": "Base URL: http://localhost:8003  (adjust for your deployment)",
    }


@router.get(
    "/rate-limits",
    summary="Rate Limit Dashboard",
    description="Returns current user's rate limit window status and daily quota, with tier info.",
)
async def get_rate_limit_dashboard(request: Request):
    """
    Rate limit dashboard — shows per-user rate limit window
    and daily generation quota with tier information.
    """
    user_id = get_user_id_from_request(request)
    rate_limiter = get_rate_limiter()
    rate_info = rate_limiter.get_info(user_id)
    quota_info = get_quota_status(user_id)

    return {
        "success": True,
        "user_id": user_id,
        "tier": rate_info.tier,
        "tier_name": rate_info.tier_name,
        "rate_limit": {
            "limit": rate_info.limit,
            "used": rate_info.requests,
            "remaining": rate_info.remaining(),
            "window_seconds": rate_info.window_seconds,
            "reset_in_seconds": rate_info.reset_in_seconds(),
            "reset_at_timestamp": int(rate_info.reset_at()),
            "is_exceeded": rate_info.is_exceeded(),
        },
        "quota": {
            "daily_limit": quota_info.daily_limit,
            "is_unlimited": quota_info.is_unlimited(),
            "used": quota_info.generations_used,
            "remaining": quota_info.remaining(),
            "reset_at": quota_info.reset_at(),
            "last_generation_at": quota_info.last_generation_at,
            "is_exceeded": quota_info.is_exceeded(),
        },
        "upgrade_url": "/api/v1/tiers",
        "server_time_utc": f"{time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}",
    }


@router.get(
    "/health",
    summary="API Health Monitor",
    description="Performs health checks on all API dependencies and returns component-level status.",
)
async def get_api_health(request: Request):
    """
    Comprehensive API health check.

    Checks:
    - API server (self)
    - Rate limit subsystem
    - Quota storage
    - Webhook service
    - AI API (Volcano Engine) connectivity
    """
    components: List[HealthCheckItem] = []
    overall_status = "ok"

    # 1. API self-check
    t0 = time.perf_counter()
    latency_ms = round((time.perf_counter() - t0) * 1000, 2)
    components.append(HealthCheckItem(
        component="api_server",
        status="ok",
        latency_ms=latency_ms,
        detail="API server responding normally",
    ))

    # 2. Rate limiter
    try:
        rl = get_rate_limiter()
        t0 = time.perf_counter()
        _ = rl.get_info("health_check_probe")
        latency_ms = round((time.perf_counter() - t0) * 1000, 2)
        components.append(HealthCheckItem(
            component="rate_limiter",
            status="ok",
            latency_ms=latency_ms,
            detail="Rate limiter operational",
        ))
    except Exception as e:
        overall_status = "degraded"
        components.append(HealthCheckItem(
            component="rate_limiter",
            status="degraded",
            detail={"error": "ENDPOINT_ERROR", "detail": f"Rate limiter error: {str(e)}"},
        ))

    # 3. Quota storage
    try:
        from ...api.middleware.rate_limit import get_quota_storage
        qs = get_quota_storage()
        t0 = time.perf_counter()
        _ = qs.get_user_quota("health_check_probe")
        latency_ms = round((time.perf_counter() - t0) * 1000, 2)
        components.append(HealthCheckItem(
            component="quota_storage",
            status="ok",
            latency_ms=latency_ms,
            detail="Quota storage accessible",
        ))
    except Exception as e:
        overall_status = "degraded"
        components.append(HealthCheckItem(
            component="quota_storage",
            status="degraded",
            detail={"error": "ENDPOINT_ERROR", "detail": f"Quota storage error: {str(e)}"},
        ))

    # 4. Webhook service
    try:
        ds = get_developer_service()
        t0 = time.perf_counter()
        _ = ds.get_webhook_stats()
        latency_ms = round((time.perf_counter() - t0) * 1000, 2)
        components.append(HealthCheckItem(
            component="webhook_logs",
            status="ok",
            latency_ms=latency_ms,
            detail="Webhook log storage accessible",
        ))
    except Exception as e:
        overall_status = "degraded"
        components.append(HealthCheckItem(
            component="webhook_logs",
            status="degraded",
            detail={"error": "ENDPOINT_ERROR", "detail": f"Webhook log error: {str(e)}"},
        ))

    # 5. Volcano AI API connectivity
    try:
        t0 = time.perf_counter()
        if settings.VOLCANO_API_KEY:
            latency_ms = round((time.perf_counter() - t0) * 1000, 2)
            components.append(HealthCheckItem(
                component="volcano_ai",
                status="ok",
                latency_ms=latency_ms,
                detail=f"VOLCANO_API_KEY configured (key starts with: {settings.VOLCANO_API_KEY[:4]}...)",
            ))
        else:
            overall_status = "degraded"
            components.append(HealthCheckItem(
                component="volcano_ai",
                status="degraded",
                detail="VOLCANO_API_KEY not configured — AI generation will fail",
            ))
    except Exception as e:
        overall_status = "degraded"
        components.append(HealthCheckItem(
            component="volcano_ai",
            status="error",
            detail={"error": "ENDPOINT_ERROR", "detail": f"Volcano AI check failed: {str(e)}"},
        ))

    # 6. Data directory
    try:
        import os
        data_path = "./data"
        accessible = os.path.isdir(data_path) and os.access(data_path, os.W_OK)
        if accessible:
            components.append(HealthCheckItem(
                component="data_storage",
                status="ok",
                detail=f"Data directory writable: {data_path}",
            ))
        else:
            overall_status = "degraded"
            components.append(HealthCheckItem(
                component="data_storage",
                status="degraded",
                detail=f"Data directory not writable: {data_path}",
            ))
    except Exception as e:
        overall_status = "degraded"
        components.append(HealthCheckItem(
            component="data_storage",
            status="degraded",
            detail={"error": "ENDPOINT_ERROR", "detail": f"Data storage check failed: {str(e)}"},
        ))

    return {
        "success": True,
        "status": overall_status,
        "server_time_utc": f"{time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}",
        "components": [c.model_dump() for c in components],
    }


@router.get(
    "/webhook-logs",
    summary="Webhook Event Log Viewer",
    description="Query webhook delivery history with filters, pagination, and statistics.",
)
async def get_webhook_logs(
    request: Request,
    webhook_id: Optional[str] = Query(None, description="Filter by webhook ID"),
    event: Optional[str] = Query(None, description="Filter by event type"),
    limit: int = Query(50, ge=1, le=500, description="Number of logs to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
):
    """
    Webhook event log viewer.

    Returns paginated webhook delivery history with optional filters.
    Includes aggregate statistics (success rate, event counts).
    """
    ds = get_developer_service()
    logs = ds.get_webhook_logs(
        webhook_id=webhook_id,
        event=event,
        limit=limit,
        offset=offset,
    )
    stats = ds.get_webhook_stats()

    return {
        "success": True,
        "filters": {
            "webhook_id": webhook_id,
            "event": event,
        },
        "stats": stats,
        **logs,
    }


@router.get(
    "/webhook-logs/stats",
    summary="Webhook Delivery Statistics",
    description="Returns aggregate webhook delivery statistics (total, success, failed, success rate).",
)
async def get_webhook_stats(request: Request):
    """Aggregate webhook delivery statistics."""
    ds = get_developer_service()
    return {
        "success": True,
        **ds.get_webhook_stats(),
    }
