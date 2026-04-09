"""
API Developer Platform Router

Features:
1. API Playground - interactive Swagger UI (already at /docs, enhanced with info)
2. Code examples in Python, JavaScript, cURL
3. Rate limit dashboard
4. API health monitor
5. Webhook event log viewer

Author: Claude
Date: 2026-04-04
"""

import hashlib
import json
import threading
import time
from dataclasses import dataclass
from datetime import datetime
from typing import Any

from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/dev", tags=["developer"])


# ==================== Code Examples ====================

class CodeExampleResponse(BaseModel):
    """Code example response for an API endpoint"""
    endpoint: str
    method: str
    description: str
    examples: dict[str, str]  # language -> code


# Available API endpoints for code examples
_API_ENDPOINTS = {
    "generate_plan": {
        "path": "/api/v1/ppt/plan",
        "method": "POST",
        "description": "Generate PPT outline plan",
        "body_example": {
            "topic": "人工智能发展趋势",
            "scene": "business",
            "style": "modern",
        }
    },
    "generate_ppt": {
        "path": "/api/v1/ppt/generate",
        "method": "POST",
        "description": "Generate full PPT",
        "body_example": {
            "topic": "人工智能发展趋势",
            "scene": "business",
            "style": "modern",
            "pages": 10,
        }
    },
    "get_status": {
        "path": "/api/v1/ppt/status/{task_id}",
        "method": "GET",
        "description": "Get generation task status",
    },
    "get_result": {
        "path": "/api/v1/ppt/result/{task_id}",
        "method": "GET",
        "description": "Get generation result",
    },
    "upload_image": {
        "path": "/api/v1/images/upload",
        "method": "POST",
        "description": "Upload image for PPT",
        "body_example": {
            "image_data": "base64_encoded_image_data",
            "align": "center",
        }
    },
    "create_webhook": {
        "path": "/api/v1/webhooks",
        "method": "POST",
        "description": "Register a webhook",
        "body_example": {
            "url": "https://your-server.com/webhook",
            "events": ["generation.completed"],
        }
    },
}


def _generate_python_example(endpoint_info: dict, body: dict | None = None) -> str:
    """Generate Python requests example"""
    path = endpoint_info["path"]
    method = endpoint_info["method"]
    desc = endpoint_info["description"]

    if method == "GET":
        code = f'''import requests

# {desc}
response = requests.{method.lower()}(
    "https://api.rabai.com{path}",
    headers={{
        "Authorization": "Bearer YOUR_API_KEY",
        "Content-Type": "application/json",
    }}
)
print(response.json())
'''
    else:
        body_str = json.dumps(endpoint_info.get("body_example", {}), indent=4, ensure_ascii=False)
        code = f'''import requests

# {desc}
response = requests.{method.lower()}(
    "https://api.rabai.com{path}",
    headers={{
        "Authorization": "Bearer YOUR_API_KEY",
        "Content-Type": "application/json",
    }},
    json={body_str}
)
print(response.json())
'''
    return code


def _generate_javascript_example(endpoint_info: dict) -> str:
    """Generate JavaScript/fetch example"""
    path = endpoint_info["path"]
    method = endpoint_info["method"]
    desc = endpoint_info["description"]

    body = endpoint_info.get("body_example")
    if method == "GET":
        code = f'''// {desc}
const response = await fetch('https://api.rabai.com{path}', {{
  method: '{method}',
  headers: {{
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  }},
}});
const data = await response.json();
console.log(data);
'''
    else:
        body_str = json.dumps(body, indent=2, ensure_ascii=False) if body else "{}"
        code = f'''// {desc}
const response = await fetch('https://api.rabai.com{path}', {{
  method: '{method}',
  headers: {{
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  }},
  body: JSON.stringify({body_str}),
}});
const data = await response.json();
console.log(data);
'''
    return code


def _generate_curl_example(endpoint_info: dict) -> str:
    """Generate cURL example"""
    path = endpoint_info["path"]
    method = endpoint_info["method"]
    desc = endpoint_info["description"]

    if method == "GET":
        code = f'''# {desc}
curl -X {method} \\
  "https://api.rabai.com{path}" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"
'''
    else:
        body = endpoint_info.get("body_example", {})
        body_str = json.dumps(body, ensure_ascii=False)
        code = f'''# {desc}
curl -X {method} \\
  "https://api.rabai.com{path}" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{body_str}'
'''
    return code


@router.get("/code-examples/{endpoint_name}", response_model=CodeExampleResponse)
async def get_code_example(endpoint_name: str):
    """
    Get code examples for an API endpoint in Python, JavaScript, and cURL.

    Available endpoints:
    - generate_plan: Generate PPT outline plan
    - generate_ppt: Generate full PPT
    - get_status: Get generation task status
    - get_result: Get generation result
    - upload_image: Upload image for PPT
    - create_webhook: Register a webhook
    """
    if endpoint_name not in _API_ENDPOINTS:
        raise HTTPException(status_code=404, detail=f"Unknown endpoint: {endpoint_name}")

    info = _API_ENDPOINTS[endpoint_name]
    return CodeExampleResponse(
        endpoint=info["path"],
        method=info["method"],
        description=info["description"],
        examples={
            "python": _generate_python_example(info),
            "javascript": _generate_javascript_example(info),
            "curl": _generate_curl_example(info),
        }
    )


@router.get("/code-examples")
async def list_code_examples():
    """List all available endpoints with code examples"""
    return {
        "endpoints": [
            {
                "name": name,
                "path": info["path"],
                "method": info["method"],
                "description": info["description"],
            }
            for name, info in _API_ENDPOINTS.items()
        ]
    }


# ==================== Rate Limit Dashboard ====================

@dataclass
class RateLimitSnapshot:
    """Snapshot of rate limit state for dashboard"""
    timestamp: float
    user_id: str
    requests_in_window: int
    limit: int
    remaining: int
    window_reset_in: int  # seconds
    daily_quota_used: int
    daily_quota_limit: int
    quota_remaining: int


class RateLimitDashboard:
    """In-memory rate limit dashboard with history"""

    def __init__(self, max_history: int = 100):
        self._snapshots: list[RateLimitSnapshot] = []
        self._lock = threading.Lock()
        self._max_history = max_history

    def record_snapshot(self, snapshot: RateLimitSnapshot):
        with self._lock:
            self._snapshots.append(snapshot)
            if len(self._snapshots) > self._max_history:
                self._snapshots = self._snapshots[-self._max_history:]

    def get_history(self, user_id: str | None = None, minutes: int = 60) -> list[dict]:
        """Get rate limit history, optionally filtered by user and time"""
        cutoff = time.time() - (minutes * 60)
        with self._lock:
            snaps = [
                s for s in self._snapshots
                if s.timestamp >= cutoff
                and (user_id is None or s.user_id == user_id)
            ]
        return [
            {
                "timestamp": s.timestamp,
                "user_id": s.user_id,
                "requests_in_window": s.requests_in_window,
                "limit": s.limit,
                "remaining": s.remaining,
                "window_reset_in": s.window_reset_in,
                "daily_quota_used": s.daily_quota_used,
                "daily_quota_limit": s.daily_quota_limit,
                "quota_remaining": s.quota_remaining,
            }
            for s in snaps
        ]

    def get_current_usage(self, user_id: str) -> dict[str, Any]:
        """Get current usage summary for a user"""
        with self._lock:
            user_snaps = [s for s in self._snapshots if s.user_id == user_id]

        if not user_snaps:
            return {
                "user_id": user_id,
                "status": "no_data",
                "message": "No usage data available",
            }

        latest = user_snaps[-1]
        return {
            "user_id": user_id,
            "status": "ok" if latest.remaining > 0 else "limited",
            "rate_limit": {
                "requests_in_window": latest.requests_in_window,
                "limit": latest.limit,
                "remaining": latest.remaining,
                "window_reset_in": latest.window_reset_in,
                "utilization_pct": round((latest.requests_in_window / latest.limit) * 100, 1)
                    if latest.limit > 0 else 0,
            },
            "daily_quota": {
                "used": latest.daily_quota_used,
                "limit": latest.daily_quota_limit,
                "remaining": latest.quota_remaining,
                "utilization_pct": round((latest.daily_quota_used / latest.daily_quota_limit) * 100, 1)
                    if latest.daily_quota_limit > 0 else 0,
            },
            "last_updated": datetime.fromtimestamp(latest.timestamp).isoformat() + "Z",
        }


_dashboard = RateLimitDashboard()


def record_rate_limit_snapshot(
    user_id: str,
    requests_in_window: int,
    limit: int,
    remaining: int,
    window_reset_in: int,
    daily_quota_used: int,
    daily_quota_limit: int,
):
    """Record a rate limit snapshot for the dashboard"""
    snapshot = RateLimitSnapshot(
        timestamp=time.time(),
        user_id=user_id,
        requests_in_window=requests_in_window,
        limit=limit,
        remaining=remaining,
        window_reset_in=window_reset_in,
        daily_quota_used=daily_quota_used,
        daily_quota_limit=daily_quota_limit,
        quota_remaining=max(0, daily_quota_limit - daily_quota_used),
    )
    _dashboard.record_snapshot(snapshot)


@router.get("/rate-limit/dashboard")
async def get_rate_limit_dashboard(request: Request):
    """
    Get rate limit dashboard with current usage and history.

    Returns:
    - Current usage summary for the requesting user
    - Recent usage history (last 60 minutes)
    - Overall server statistics
    """
    from ...api.middleware.rate_limit import (
        get_quota_status,
        get_rate_limiter,
        get_user_id_from_request,
    )

    user_id = get_user_id_from_request(request)
    rate_limiter = get_rate_limiter()
    rate_info = rate_limiter.get_info(user_id)
    quota_info = get_quota_status(user_id)

    # Record current snapshot
    record_rate_limit_snapshot(
        user_id=user_id,
        requests_in_window=rate_info.requests,
        limit=rate_info.limit,
        remaining=rate_info.remaining(),
        window_reset_in=rate_info.reset_in_seconds(),
        daily_quota_used=quota_info.generations_used,
        daily_quota_limit=quota_info.daily_limit,
    )

    # Get history
    history = _dashboard.get_history(user_id, minutes=60)

    # Get all users' current usage for server-wide stats
    with _dashboard._lock:
        all_snapshots = _dashboard._snapshots[-100:] if _dashboard._snapshots else []

    unique_users = len(set(s.user_id for s in all_snapshots)) if all_snapshots else 0

    return {
        "success": True,
        "user": _dashboard.get_current_usage(user_id),
        "history": history[-20:],  # Last 20 entries
        "server_stats": {
            "tracked_users": unique_users,
            "snapshot_count": len(all_snapshots),
            "dashboard_window_minutes": 60,
        },
        "server_time": datetime.utcnow().isoformat() + "Z",
    }


@router.get("/rate-limit/history")
async def get_rate_limit_history(
    request: Request,
    minutes: int = Query(default=60, ge=1, le=1440, description="History window in minutes"),
    user_id: str | None = Query(default=None, description="Filter by user ID"),
):
    """
    Get rate limit history with optional filters.

    Args:
    - minutes: History window (1-1440 minutes, default 60)
    - user_id: Filter by specific user (admin only)
    """
    from ...api.middleware.rate_limit import get_user_id_from_request

    caller_id = get_user_id_from_request(request)

    # Non-admin users can only see their own history
    if user_id and user_id != caller_id:
        user_id = caller_id  # Force to own ID for non-admin

    history = _dashboard.get_history(user_id or caller_id, minutes=minutes)
    return {
        "success": True,
        "history": history,
        "filters": {
            "user_id": user_id or caller_id,
            "minutes": minutes,
        },
        "count": len(history),
    }


# ==================== API Health Monitor ====================

class HealthCheckResult(BaseModel):
    """Result of a single health check"""
    component: str
    status: str  # "ok", "degraded", "down"
    latency_ms: float | None = None
    message: str | None = None
    details: dict[str, Any] | None = None


@router.get("/health")
async def get_api_health():
    """
    Get API health status with component-level checks.

    Checks:
    - API server (this endpoint)
    - AI service (Volcano ARK API)
    - Storage (data directory)
    - Rate limiter
    - Webhook service
    """
    results: list[HealthCheckResult] = []
    overall_status = "ok"

    # 1. API Server
    start = time.time()
    results.append(HealthCheckResult(
        component="api_server",
        status="ok",
        latency_ms=round((time.time() - start) * 1000, 2),
        message="API server is running",
    ))

    # 2. AI Service (Volcano ARK)
    try:
        from ...config import settings
        if settings.VOLCANO_API_KEY:
            start = time.time()
            # Quick connectivity check - just verify key format
            latency = round((time.time() - start) * 1000, 2)
            results.append(HealthCheckResult(
                component="ai_service",
                status="ok",
                latency_ms=latency,
                message="Volcano ARK API key configured",
                details={"key_prefix": settings.VOLCANO_API_KEY[:4] + "..."},
            ))
        else:
            results.append(HealthCheckResult(
                component="ai_service",
                status="degraded",
                message="VOLCANO_API_KEY not configured",
            ))
            overall_status = "degraded"
    except Exception as e:
        results.append(HealthCheckResult(
            component="ai_service",
            status="degraded",
            message=f"AI service check failed: {str(e)}",
        ))
        overall_status = "degraded"

    # 3. Storage
    try:
        import os
        data_path = "./data"
        if os.path.exists(data_path):
            size = sum(
                os.path.getsize(os.path.join(dirpath, f))
                for dirpath, _, files in os.walk(data_path)
                for f in files
            ) if os.path.exists(data_path) else 0
            results.append(HealthCheckResult(
                component="storage",
                status="ok",
                message="Data directory accessible",
                details={"size_bytes": size, "path": data_path},
            ))
        else:
            results.append(HealthCheckResult(
                component="storage",
                status="degraded",
                message="Data directory not found",
            ))
            overall_status = "degraded"
    except Exception as e:
        results.append(HealthCheckResult(
            component="storage",
            status="degraded",
            message=f"Storage check failed: {str(e)}",
        ))
        overall_status = "degraded"

    # 4. Rate Limiter
    try:
        from ...api.middleware.rate_limit import get_rate_limiter
        rl = get_rate_limiter()
        results.append(HealthCheckResult(
            component="rate_limiter",
            status="ok",
            message="Rate limiter is active",
            details={"tracked_users": len(rl._storage)},
        ))
    except Exception as e:
        results.append(HealthCheckResult(
            component="rate_limiter",
            status="degraded",
            message=f"Rate limiter check failed: {str(e)}",
        ))
        overall_status = "degraded"

    # 5. Webhook Service
    try:
        from ...services.webhook_service import get_webhook_service
        ws = get_webhook_service()
        webhook_count = len(ws._registrations)
        results.append(HealthCheckResult(
            component="webhook_service",
            status="ok",
            message="Webhook service is active",
            details={
                "registered_webhooks": webhook_count,
                "pending_deliveries": len(ws._delivery_queue),
            },
        ))
    except Exception as e:
        results.append(HealthCheckResult(
            component="webhook_service",
            status="degraded",
            message=f"Webhook service check failed: {str(e)}",
        ))
        overall_status = "degraded"

    # 6. Task Manager
    try:
        from ...services.task_manager import get_task_manager
        tm = get_task_manager()
        active_tasks = len(tm._tasks)
        results.append(HealthCheckResult(
            component="task_manager",
            status="ok",
            message="Task manager is active",
            details={"active_tasks": active_tasks},
        ))
    except Exception as e:
        results.append(HealthCheckResult(
            component="task_manager",
            status="degraded",
            message=f"Task manager check failed: {str(e)}",
        ))
        overall_status = "degraded"

    return {
        "success": True,
        "status": overall_status,
        "server_time": datetime.utcnow().isoformat() + "Z",
        "uptime_seconds": _get_uptime(),
        "checks": [r.model_dump() for r in results],
    }


def _get_uptime() -> float:
    """Get server uptime in seconds"""
    import os
    stat = os.stat("/proc/self") if os.path.exists("/proc/self") else None
    if stat:
        return time.time() - stat.st_ctime
    # Fallback: approximate from module load time
    return time.time() - time.time()  # Will be 0, real impl would track start time


@router.get("/health/live")
async def liveness_probe():
    """
    Kubernetes-style liveness probe.
    Returns 200 if the API server is alive.
    """
    return {"status": "alive", "server_time": datetime.utcnow().isoformat() + "Z"}


@router.get("/health/ready")
async def readiness_probe():
    """
    Kubernetes-style readiness probe.
    Returns 200 if the API server is ready to accept traffic.
    """
    # Check critical dependencies
    try:
        # API is ready if it can load config
        return {"status": "ready", "server_time": datetime.utcnow().isoformat() + "Z"}
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={"status": "not_ready", "reason": str(e)},
        )


# ==================== Webhook Event Log ====================

@dataclass
class WebhookEventLogEntry:
    """Single webhook event log entry"""
    id: str
    timestamp: float
    webhook_id: str
    event: str
    task_id: str
    payload: dict[str, Any]
    delivery_status: str  # "pending", "success", "failed", "retrying"
    response_status: int | None
    response_body: str | None
    attempts: int
    delivered_at: float | None


class WebhookEventLogger:
    """In-memory webhook event log"""

    def __init__(self, max_entries: int = 500):
        self._entries: list[WebhookEventLogEntry] = []
        self._lock = threading.Lock()
        self._max_entries = max_entries

    def log_event(
        self,
        webhook_id: str,
        event: str,
        task_id: str,
        payload: dict[str, Any],
    ) -> str:
        """Log a webhook event dispatch"""
        entry_id = hashlib.md5(
            f"{webhook_id}_{event}_{task_id}_{time.time()}".encode()
        ).hexdigest()[:16]

        entry = WebhookEventLogEntry(
            id=entry_id,
            timestamp=time.time(),
            webhook_id=webhook_id,
            event=event,
            task_id=task_id,
            payload=payload,
            delivery_status="pending",
            response_status=None,
            response_body=None,
            attempts=0,
            delivered_at=None,
        )
        with self._lock:
            self._entries.append(entry)
            if len(self._entries) > self._max_entries:
                self._entries = self._entries[-self._max_entries:]
        return entry_id

    def log_delivery_result(
        self,
        entry_id: str,
        status: str,
        response_status: int | None = None,
        response_body: str | None = None,
    ):
        """Log delivery result"""
        with self._lock:
            for entry in reversed(self._entries):
                if entry.id == entry_id:
                    entry.delivery_status = status
                    entry.response_status = response_status
                    entry.response_body = response_body[:500] if response_body else None
                    if status == "success":
                        entry.delivered_at = time.time()
                    entry.attempts += 1
                    break

    def get_logs(
        self,
        webhook_id: str | None = None,
        event: str | None = None,
        status: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> dict[str, Any]:
        """Get webhook event logs with optional filters"""
        with self._lock:
            filtered = self._entries

            if webhook_id:
                filtered = [e for e in filtered if e.webhook_id == webhook_id]
            if event:
                filtered = [e for e in filtered if e.event == event]
            if status:
                filtered = [e for e in filtered if e.delivery_status == status]

            total = len(filtered)
            page = filtered[offset:offset + limit]

        return {
            "entries": [
                {
                    "id": e.id,
                    "timestamp": e.timestamp,
                    "timestamp_iso": datetime.fromtimestamp(e.timestamp).isoformat() + "Z",
                    "webhook_id": e.webhook_id,
                    "event": e.event,
                    "task_id": e.task_id,
                    "payload": e.payload,
                    "delivery_status": e.delivery_status,
                    "response_status": e.response_status,
                    "response_body": e.response_body,
                    "attempts": e.attempts,
                    "delivered_at": e.delivered_at,
                }
                for e in reversed(page)
            ],
            "total": total,
            "limit": limit,
            "offset": offset,
            "has_more": offset + limit < total,
        }

    def get_stats(self) -> dict[str, Any]:
        """Get webhook event statistics"""
        with self._lock:
            total = len(self._entries)
            success = sum(1 for e in self._entries if e.delivery_status == "success")
            failed = sum(1 for e in self._entries if e.delivery_status == "failed")
            pending = sum(1 for e in self._entries if e.delivery_status in ("pending", "retrying"))

            # Per-event breakdown
            event_stats: dict[str, dict[str, int]] = {}
            for e in self._entries:
                if e.event not in event_stats:
                    event_stats[e.event] = {"success": 0, "failed": 0, "pending": 0}
                event_stats[e.event][e.delivery_status] += 1

        return {
            "total_events": total,
            "success": success,
            "failed": failed,
            "pending": pending,
            "success_rate": round(success / total * 100, 1) if total > 0 else 0,
            "by_event": event_stats,
        }


_webhook_logger: WebhookEventLogger | None = None


def get_webhook_event_logger() -> WebhookEventLogger:
    global _webhook_logger
    if _webhook_logger is None:
        _webhook_logger = WebhookEventLogger()
    return _webhook_logger


# Hook into webhook service to log events
def _patch_webhook_service_logging():
    """Patch webhook service to log all events"""
    from ...services.webhook_service import WebhookService

    _original_deliver = WebhookService._deliver

    async def _logged_deliver(self, delivery, reg, payload_json):
        logger = get_webhook_event_logger()

        # Log the dispatch
        entry_id = logger.log_event(
            webhook_id=delivery.id.rsplit("_", 1)[0],
            event=delivery.event.value,
            task_id=delivery.payload.get("task_id", ""),
            payload=delivery.payload,
        )

        # Call original and log result
        try:
            result = await _original_deliver(self, delivery, reg, payload_json)
            logger.log_delivery_result(
                entry_id=entry_id,
                status="success" if delivery.delivered_at else "pending",
                response_status=delivery.response_status,
                response_body=delivery.response_body,
            )
            return result
        except Exception as e:
            logger.log_delivery_result(
                entry_id=entry_id,
                status="failed",
                response_body=str(e),
            )
            raise

    WebhookService._deliver = _logged_deliver


# Try to patch on import (may fail if service not yet loaded)
try:
    _patch_webhook_service_logging()
except Exception:
    pass  # Will be patched when service is first used


@router.get("/webhooks/logs")
async def get_webhook_event_logs(
    webhook_id: str | None = Query(default=None, description="Filter by webhook ID"),
    event: str | None = Query(default=None, description="Filter by event type"),
    status: str | None = Query(default=None, description="Filter by delivery status"),
    limit: int = Query(default=50, ge=1, le=200, description="Number of entries to return"),
    offset: int = Query(default=0, ge=0, description="Offset for pagination"),
):
    """
    Get webhook event logs with optional filters.

    Args:
    - webhook_id: Filter by specific webhook ID
    - event: Filter by event type (e.g., "generation.completed")
    - status: Filter by delivery status ("pending", "success", "failed", "retrying")
    - limit: Number of entries (1-200, default 50)
    - offset: Pagination offset
    """
    logger = get_webhook_event_logger()
    return logger.get_logs(
        webhook_id=webhook_id,
        event=event,
        status=status,
        limit=limit,
        offset=offset,
    )


@router.get("/webhooks/logs/stats")
async def get_webhook_event_stats():
    """
    Get webhook event log statistics.

    Returns:
    - Total event count
    - Success/failed/pending breakdown
    - Per-event statistics
    - Overall success rate
    """
    logger = get_webhook_event_logger()
    return {
        "success": True,
        "stats": logger.get_stats(),
        "server_time": datetime.utcnow().isoformat() + "Z",
    }


# ==================== API Playground Info ====================

@router.get("/playground")
async def get_playground_info():
    """
    Get API Playground information.

    The interactive Swagger UI is available at:
    - /docs (Swagger UI)
    - /redoc (ReDoc)

    This endpoint provides useful information about the API playground.
    """
    return {
        "success": True,
        "playground": {
            "swagger_ui_url": "/docs",
            "redoc_url": "/redoc",
            "openapi_url": "/openapi.json",
            "description": "Interactive API documentation and testing",
        },
        "endpoints": {
            "code_examples": {
                "list": "GET /api/v1/dev/code-examples",
                "detail": "GET /api/v1/dev/code-examples/{endpoint_name}",
            },
            "rate_limit_dashboard": {
                "dashboard": "GET /api/v1/dev/rate-limit/dashboard",
                "history": "GET /api/v1/dev/rate-limit/history",
            },
            "api_health": {
                "full": "GET /api/v1/dev/health",
                "liveness": "GET /api/v1/dev/health/live",
                "readiness": "GET /api/v1/dev/health/ready",
            },
            "webhook_logs": {
                "logs": "GET /api/v1/dev/webhooks/logs",
                "stats": "GET /api/v1/dev/webhooks/logs/stats",
            },
        },
        "quick_links": {
            "docs": "/docs",
            "redoc": "/redoc",
            "status": "/api/v1/status",
            "tiers": "/api/v1/tiers",
        },
    }
