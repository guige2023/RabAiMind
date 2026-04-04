# -*- coding: utf-8 -*-
"""
Developer Platform Service — Webhook Event Log Storage

Stores webhook delivery attempts for the webhook event log viewer.
Thread-safe, JSON-file backed.

Author: Claude
Date: 2026-04-04
"""

import json
import os
import threading
import time
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, asdict, field
from datetime import datetime
import hashlib


# ── Data Models ───────────────────────────────────────────────

@dataclass
class WebhookDeliveryLog:
    """A single webhook delivery attempt log entry"""
    delivery_id: str
    webhook_id: str
    event: str
    payload: Dict[str, Any]
    url: str
    attempt: int
    max_attempts: int
    response_status: Optional[int]
    response_body: Optional[str]
    error: Optional[str]
    duration_ms: Optional[int]
    created_at: float = field(default_factory=time.time)
    delivered: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            **asdict(self),
            "created_at_iso": datetime.utcfromtimestamp(self.created_at).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "duration_ms": self.duration_ms,
        }


# ── Storage ──────────────────────────────────────────────────

class DeveloperService:
    """
    Stores webhook delivery logs and API health status.
    Used by the Developer Platform (API Playground, Webhook Event Log Viewer).
    """

    LOG_DIR = "./data/developer"
    WEBHOOK_LOG_FILE = os.path.join(LOG_DIR, "webhook_delivery_logs.jsonl")
    HEALTH_FILE = os.path.join(LOG_DIR, "health_status.json")

    def __init__(self):
        self._lock = threading.Lock()
        self._ensure_storage()

    def _ensure_storage(self):
        os.makedirs(self.LOG_DIR, exist_ok=True)

    # ── Webhook Delivery Log ────────────────────────────────

    def log_webhook_delivery(
        self,
        webhook_id: str,
        event: str,
        payload: Dict[str, Any],
        url: str,
        attempt: int = 1,
        max_attempts: int = 3,
        response_status: Optional[int] = None,
        response_body: Optional[str] = None,
        error: Optional[str] = None,
        duration_ms: Optional[int] = None,
    ) -> WebhookDeliveryLog:
        """Append a webhook delivery log entry."""
        delivery_id = hashlib.sha256(
            f"{webhook_id}{event}{time.time_ns()}".encode()
        ).hexdigest()[:16]

        log = WebhookDeliveryLog(
            delivery_id=delivery_id,
            webhook_id=webhook_id,
            event=event,
            payload=payload,
            url=url,
            attempt=attempt,
            max_attempts=max_attempts,
            response_status=response_status,
            response_body=response_body,
            error=error,
            duration_ms=duration_ms,
            delivered=response_status is not None and 200 <= response_status < 300,
        )

        with self._lock:
            with open(self.WEBHOOK_LOG_FILE, "a", encoding="utf-8") as f:
                f.write(json.dumps(log.to_dict(), ensure_ascii=False) + "\n")

        return log

    def get_webhook_logs(
        self,
        webhook_id: Optional[str] = None,
        event: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> Dict[str, Any]:
        """
        Retrieve webhook delivery logs with optional filters.
        Returns paginated results.
        """
        logs: List[Dict[str, Any]] = []
        total = 0

        with self._lock:
            if not os.path.exists(self.WEBHOOK_LOG_FILE):
                return {"logs": [], "total": 0, "limit": limit, "offset": offset}

            with open(self.WEBHOOK_LOG_FILE, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        entry = json.loads(line)
                        total += 1

                        # Apply filters
                        if webhook_id and entry.get("webhook_id") != webhook_id:
                            continue
                        if event and entry.get("event") != event:
                            continue

                        logs.append(entry)
                    except json.JSONDecodeError:
                        continue

        # Sort by created_at desc, apply pagination
        logs.sort(key=lambda x: x.get("created_at", 0), reverse=True)
        paginated = logs[offset : offset + limit]

        return {
            "logs": paginated,
            "total": total,
            "filtered": len(logs),
            "limit": limit,
            "offset": offset,
            "has_more": offset + limit < len(logs),
        }

    def get_webhook_stats(self) -> Dict[str, Any]:
        """Aggregate statistics for webhook deliveries."""
        total = 0
        success = 0
        failed = 0
        events: Dict[str, int] = {}

        with self._lock:
            if not os.path.exists(self.WEBHOOK_LOG_FILE):
                return {"total": 0, "success": 0, "failed": 0, "success_rate": 100.0, "events": {}}

            with open(self.WEBHOOK_LOG_FILE, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        entry = json.loads(line)
                        total += 1
                        if entry.get("delivered"):
                            success += 1
                        else:
                            failed += 1
                        evt = entry.get("event", "unknown")
                        events[evt] = events.get(evt, 0) + 1
                    except json.JSONDecodeError:
                        continue

        return {
            "total": total,
            "success": success,
            "failed": failed,
            "success_rate": round(success / total * 100, 1) if total > 0 else 100.0,
            "events": events,
        }

    # ── Health Status ────────────────────────────────────────

    def update_health_status(self, component: str, status: str, detail: str = ""):
        """Update health status for a component."""
        with self._lock:
            health = {}
            if os.path.exists(self.HEALTH_FILE):
                try:
                    with open(self.HEALTH_FILE, "r", encoding="utf-8") as f:
                        health = json.load(f)
                except (json.JSONDecodeError, FileNotFoundError):
                    health = {}

            health[component] = {
                "status": status,
                "detail": detail,
                "updated_at": time.time(),
                "updated_at_iso": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
            }

            with open(self.HEALTH_FILE, "w", encoding="utf-8") as f:
                json.dump(health, f, ensure_ascii=False, indent=2)

    def get_health_status(self) -> Dict[str, Any]:
        """Get current health status snapshot."""
        with self._lock:
            if not os.path.exists(self.HEALTH_FILE):
                return {}
            try:
                with open(self.HEALTH_FILE, "r", encoding="utf-8") as f:
                    return json.load(f)
            except (json.JSONDecodeError, FileNotFoundError):
                return {}


# ── Singleton ────────────────────────────────────────────────

_developer_service: Optional[DeveloperService] = None


def get_developer_service() -> DeveloperService:
    global _developer_service
    if _developer_service is None:
        _developer_service = DeveloperService()
    return _developer_service
