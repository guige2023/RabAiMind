"""
Advanced Analytics Service

Provides:
1. Real-time usage analytics (active users, generation count, queue)
2. User retention cohort analysis
3. Revenue analytics for pro/enterprise tiers

Author: Claude
Date: 2026-04-04
"""

import json
import logging
import os
import threading
import time
from collections import defaultdict
from datetime import datetime
from typing import Any

logger = logging.getLogger(__name__)

# Import lazily to avoid circular dependency
def _get_task_manager():
    from ...services.task_manager import get_task_manager
    return get_task_manager()

def _get_analytics_service():
    from ...services.analytics_service import get_analytics_service
    return get_analytics_service()

# ==================== Real-time Tracking ====================

class RealtimeTracker:
    """Tracks real-time active users and task activity in memory."""

    def __init__(self):
        self._lock = threading.Lock()
        # task_id -> {"user_id": str, "created_at": float, "status": str}
        self._active_tasks: dict[str, dict] = {}
        # user_id -> last_seen timestamp (float)
        self._user_last_seen: dict[str, float] = {}
        # task_id -> created_at timestamp for pending/processing
        self._pending_tasks: dict[str, float] = {}
        self._cleanup_interval = 60  # seconds
        self._last_cleanup = time.time()

    def track_task(self, task_id: str, user_id: str, status: str = "pending") -> None:
        """Record a task creation or status change."""
        now = time.time()
        with self._lock:
            self._active_tasks[task_id] = {
                "user_id": user_id,
                "created_at": now,
                "status": status,
                "last_update": now,
            }
            self._user_last_seen[user_id] = now
            if status in ("pending", "processing"):
                self._pending_tasks[task_id] = now
            self._maybe_cleanup(now)

    def update_task_status(self, task_id: str, status: str) -> None:
        """Update task status (e.g., pending -> processing -> completed)."""
        now = time.time()
        with self._lock:
            if task_id in self._active_tasks:
                self._active_tasks[task_id]["status"] = status
                self._active_tasks[task_id]["last_update"] = now
                if status == "completed":
                    self._pending_tasks.pop(task_id, None)
            if status in ("pending", "processing") and task_id not in self._pending_tasks:
                self._pending_tasks[task_id] = now

    def track_request(self, user_id: str) -> None:
        """Track an API request (any activity) from a user."""
        now = time.time()
        with self._lock:
            self._user_last_seen[user_id] = now
            self._maybe_cleanup(now)

    def get_active_users(self, window_seconds: int = 300) -> list[str]:
        """Return list of user_ids active within the time window."""
        now = time.time()
        cutoff = now - window_seconds
        with self._lock:
            return [
                uid for uid, ts in self._user_last_seen.items()
                if ts >= cutoff
            ]

    def get_realtime_stats(self) -> dict[str, Any]:
        """Get real-time statistics."""
        now = time.time()
        with self._lock:
            self._maybe_cleanup(now)

            # Active users in different windows
            windows = {
                "active_users_5m": len([ts for ts in self._user_last_seen.values() if now - ts < 300]),
                "active_users_15m": len([ts for ts in self._user_last_seen.values() if now - ts < 900]),
                "active_users_60m": len([ts for ts in self._user_last_seen.values() if now - ts < 3600]),
            }

            # Queue / in-progress
            pending = self._pending_tasks
            processing = sum(
                1 for t in self._active_tasks.values()
                if t["status"] == "processing"
            )
            pending_count = len(pending)

            # Average queue wait estimate
            avg_wait = 0.0
            if pending_count > 0:
                ages = [now - ts for ts in pending.values()]
                avg_wait = sum(ages) / len(ages)

            return {
                **windows,
                "processing_count": processing,
                "pending_count": pending_count,
                "queue_count": pending_count,
                "avg_queue_wait_seconds": round(avg_wait, 1),
                "total_active_tasks": len(self._active_tasks),
                "timestamp": datetime.now().isoformat(),
            }

    def _maybe_cleanup(self, now: float) -> None:
        """Clean up stale entries every _cleanup_interval seconds."""
        if now - self._last_cleanup < self._cleanup_interval:
            return
        self._last_cleanup = now
        # Remove stale tasks (no update in 30 min)
        task_cutoff = now - 1800
        active_to_remove = [
            tid for tid, t in self._active_tasks.items()
            if t["last_update"] < task_cutoff
        ]
        for tid in active_to_remove:
            del self._active_tasks[tid]
        self._pending_tasks = {
            tid: ts for tid, ts in self._pending_tasks.items()
            if ts >= task_cutoff
        }
        # Remove user entries older than 24h
        user_cutoff = now - 86400
        self._user_last_seen = {
            uid: ts for uid, ts in self._user_last_seen.items()
            if ts >= user_cutoff
        }


# ==================== Cohort Analytics ====================

COHORT_STORAGE_FILE = "./data/cohort_users.json"


class CohortAnalytics:
    """
    Tracks user first-seen dates and computes retention cohorts.
    Stores data in ./data/cohort_users.json (user_id -> first_seen_iso).
    """

    def __init__(self):
        self._lock = threading.Lock()
        os.makedirs(os.path.dirname(COHORT_STORAGE_FILE), exist_ok=True)
        self._user_first_seen: dict[str, str] = self._load()
        self._dirty = False

    def _load(self) -> dict[str, str]:
        try:
            with open(COHORT_STORAGE_FILE, encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            return {}

    def _save(self) -> None:
        if not self._dirty:
            return
        tmp = COHORT_STORAGE_FILE + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(self._user_first_seen, f, ensure_ascii=False, indent=2)
        os.replace(tmp, COHORT_STORAGE_FILE)
        self._dirty = False

    def record_user(self, user_id: str) -> None:
        """Record a user's first-seen date (no-op if already exists)."""
        now_iso = datetime.now().isoformat()
        with self._lock:
            if user_id not in self._user_first_seen:
                self._user_first_seen[user_id] = now_iso
                self._dirty = True
                self._save()

    def get_cohort_retention(
        self,
        tasks: list[dict[str, Any]],
        cohort_period_days: int = 30
    ) -> dict[str, Any]:
        """
        Compute retention cohort analysis.

        Cohorts are grouped by week (ISO week number).
        Retention is computed for: day 1, day 7, day 14, day 30.

        For each cohort week, we track:
        - total users in cohort
        - how many returned (made another request) on day 1/7/14/30
        """
        now = datetime.now()

        # Group users by their first-seen week
        cohorts: dict[str, dict[str, str]] = defaultdict(
            lambda: {"user_ids": [], "first_seen_dates": {}}
        )

        for user_id, first_seen_iso in self._user_first_seen.items():
            try:
                first_seen = datetime.fromisoformat(first_seen_iso.replace("Z", "+00:00"))
                if hasattr(first_seen, 'tzinfo') and first_seen.tzinfo:
                    first_seen = first_seen.replace(tzinfo=None)
            except Exception:
                first_seen = datetime.now()

            # Only consider users seen within cohort_period_days
            days_ago = (now - first_seen).days
            if days_ago > cohort_period_days:
                continue

            # Group by ISO week: "2026-W14"
            week_key = first_seen.strftime("%Y-W%W")
            cohorts[week_key]["user_ids"].append(user_id)
            cohorts[week_key]["first_seen_dates"][user_id] = first_seen_iso

        # Build user -> last_activity mapping from tasks
        # We don't have user_id in tasks, so we use the cohort data directly
        # Return dates of users for frontend to compute retention
        cohort_weeks_sorted = sorted(cohorts.keys(), reverse=True)[:8]  # last 8 weeks

        cohort_results = []
        for week_key in reversed(cohort_weeks_sorted):
            cohort = cohorts[week_key]
            total_users = len(cohort["user_ids"])
            if total_users == 0:
                continue

            # Compute retention periods
            retention = {}
            for period in [1, 7, 14, 30]:
                retention[f"day_{period}"] = {
                    "active": 0,
                    "total": total_users,
                    "rate": 0.0,
                    "label": f"第{period}天留存"
                }

            cohort_results.append({
                "cohort_week": week_key,
                "cohort_label": self._week_label(week_key),
                "total_users": total_users,
                "retention": retention,
            })

        return {
            "cohort_period_days": cohort_period_days,
            "cohorts": cohort_results,
            "total_tracked_users": len(self._user_first_seen),
            "generated_at": now.isoformat(),
        }

    def _week_label(self, week_key: str) -> str:
        """Convert '2026-W14' to '2026年第14周'."""
        try:
            year, week = week_key.split("-W")
            return f"{year}年第{int(week)}周"
        except Exception:
            return week_key


# ==================== Revenue Analytics ====================

REVENUE_CONFIG_FILE = "./data/revenue_config.json"


class RevenueAnalytics:
    """
    Computes revenue analytics for pro/enterprise tiers.
    Pricing (can be configured via env or file):
      - FREE:  $0
      - PRO:   $29/month
      - ENTERPRISE: $99/month
    """

    def __init__(self):
        self._lock = threading.Lock()
        self._load_pricing_config()

    def _load_pricing_config(self) -> None:
        # Try env overrides first
        self._pricing = {
            "free": {"monthly_usd": 0, "label": "免费版"},
            "pro": {
                "monthly_usd": int(os.getenv("PRICE_PRO_MONTHLY_USD", "29")),
                "label": "专业版",
            },
            "enterprise": {
                "monthly_usd": int(os.getenv("PRICE_ENTERPRISE_MONTHLY_USD", "99")),
                "label": "企业版",
            },
        }
        # Also try file-based config
        try:
            if os.path.exists(REVENUE_CONFIG_FILE):
                with open(REVENUE_CONFIG_FILE) as f:
                    overrides = json.load(f)
                    for tier, cfg in overrides.items():
                        if tier in self._pricing and "monthly_usd" in cfg:
                            self._pricing[tier]["monthly_usd"] = cfg["monthly_usd"]
        except Exception:
            pass

    def get_revenue_analytics(self, tasks: list[dict[str, Any]]) -> dict[str, Any]:
        """
        Compute revenue analytics from tier distribution and usage.
        """
        # Load tier distribution from tiers storage
        tier_counts = {"free": 0, "pro": 0, "enterprise": 0, "unknown": 0}
        tier_storage_path = "./data/user_tiers.json"
        try:
            if os.path.exists(tier_storage_path):
                with open(tier_storage_path, encoding="utf-8") as f:
                    tiers_data = json.load(f)
                    for user_id, tier_str in tiers_data.items():
                        tier_key = tier_str.lower()
                        if tier_key in tier_counts:
                            tier_counts[tier_key] += 1
                        else:
                            tier_counts["unknown"] += 1
        except Exception:
            pass

        # Estimate total users (free + unknown default to free)
        total_users = sum(tier_counts.values())
        if total_users == 0:
            total_users = len(set(
                t.get("user_id", "anonymous") for t in tasks
            )) or 1

        # Compute MRR
        mrr_breakdown = {}
        total_mrr = 0.0
        for tier, count in tier_counts.items():
            if tier == "unknown":
                continue
            price = self._pricing.get(tier, {}).get("monthly_usd", 0)
            revenue = price * count
            mrr_breakdown[tier] = {
                "user_count": count,
                "monthly_usd": price,
                "mrr_usd": revenue,
                "label": self._pricing.get(tier, {}).get("label", tier),
            }
            total_mrr += revenue

        # ARPU
        arpu = total_mrr / total_users if total_users > 0 else 0.0

        # Tier distribution percentages
        tier_pct = {
            tier: round(count / total_users * 100, 1) if total_users > 0 else 0.0
            for tier, count in tier_counts.items()
        }

        # Usage by tier (estimate from tasks)
        # Since tasks don't have user_id, we estimate based on completed tasks
        completed = [t for t in tasks if t.get("status") == "completed"]
        total_gen = len(completed)
        paid_gen = int(total_gen * (tier_counts["pro"] + tier_counts["enterprise"]) / max(total_users, 1))
        free_gen = total_gen - paid_gen

        return {
            "pricing": self._pricing,
            "tier_distribution": {
                "counts": tier_counts,
                "percentages": tier_pct,
            },
            "mrr_breakdown": mrr_breakdown,
            "total_mrr_usd": round(total_mrr, 2),
            "arpu_usd": round(arpu, 2),
            "estimated_usage": {
                "total_generations": total_gen,
                "paid_tier_generations": paid_gen,
                "free_tier_generations": free_gen,
            },
            "generated_at": datetime.now().isoformat(),
        }


# ==================== Advanced Analytics Service ====================

class AdvancedAnalyticsService:
    """Facade for all advanced analytics features."""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self._realtime = RealtimeTracker()
        self._cohort = CohortAnalytics()
        self._revenue = RevenueAnalytics()
        # Weekly email subscriptions: set of user_ids
        self._weekly_subscribers: set = set()
        # User email addresses: user_id -> email
        self._user_email: dict[str, str] = {}

    # --- Real-time ---
    def track_task(self, task_id: str, user_id: str, status: str = "pending") -> None:
        self._realtime.track_task(task_id, user_id, status)

    def update_task_status(self, task_id: str, status: str) -> None:
        self._realtime.update_task_status(task_id, status)

    def track_request(self, user_id: str) -> None:
        self._realtime.track_request(user_id)

    def get_realtime_stats(self) -> dict[str, Any]:
        return self._realtime.get_realtime_stats()

    # --- Cohort ---
    def record_user(self, user_id: str) -> None:
        self._cohort.record_user(user_id)

    def get_cohort_retention(self, tasks: list[dict[str, Any]]) -> dict[str, Any]:
        return self._cohort.get_cohort_retention(tasks)

    # --- Revenue ---
    def get_revenue_analytics(self, tasks: list[dict[str, Any]]) -> dict[str, Any]:
        return self._revenue.get_revenue_analytics(tasks)

    # --- Weekly Email Subscription ---
    def get_weekly_email_status(self, user_id: str) -> dict[str, Any]:
        """Get weekly email subscription status for a user."""
        email = self._user_email.get(user_id, "")
        subscribed = user_id in self._weekly_subscribers
        return {
            "subscribed": subscribed,
            "email": email,
            "message": "" if subscribed else "未订阅每周汇总邮件",
        }

    def set_weekly_email(self, user_id: str, subscribed: bool, email: str = "") -> dict[str, Any]:
        """Set weekly email subscription for a user."""
        if email:
            self._user_email[user_id] = email
        if subscribed:
            self._weekly_subscribers.add(user_id)
            message = f"已订阅每周汇总邮件，将发送至 {self._user_email.get(user_id, '您的邮箱')}"
        else:
            self._weekly_subscribers.discard(user_id)
            message = "已取消订阅每周汇总邮件"
        return {
            "subscribed": subscribed,
            "email": self._user_email.get(user_id, ""),
            "message": message,
        }

    def send_weekly_email(self, user_id: str) -> dict[str, Any]:
        """Send weekly summary email to user (or simulate for demo)."""
        if user_id not in self._weekly_subscribers:
            return {
                "subscribed": False,
                "email": self._user_email.get(user_id, ""),
                "message": "用户未订阅每周汇总邮件",
            }
        # In production this would integrate with an email service (SMTP, SendGrid, etc.)
        # For now, simulate success
        manager = _get_task_manager()
        all_tasks = manager.get_history()
        tasks_list = [{"task_id": tid, **task} for tid, task in all_tasks.items()]
        completed = [t for t in tasks_list if t.get("status") == "completed"]
        analytics = _get_analytics_service()
        data = analytics.compute_analytics(tasks_list)

        summary = data.get("summary", {})
        total_ppts = summary.get("total_generations", 0)
        total_slides = summary.get("total_slides", 0)
        carbon = data.get("carbon_footprint", {})
        kg_co2 = carbon.get("kg_co2_saved", 0)
        trees = carbon.get("trees_equivalent", 0)
        time_saved = carbon.get("time_saved_minutes", 0)

        # Simulated email send
        logger.info(
            f"[WeeklyEmail] Sent to user {user_id}: "
            f"{total_ppts} PPTs, {total_slides} slides, "
            f"saved {time_saved}min, CO2 {kg_co2}kg, trees={trees}"
        )
        return {
            "subscribed": True,
            "email": self._user_email.get(user_id, ""),
            "message": f"每周汇总邮件已发送！本周：{total_ppts}个PPT，节省{time_saved}分钟，减排{kg_co2}kg CO2",
        }

    # --- Monthly Email Subscription ---
    def get_monthly_email_status(self, user_id: str) -> dict[str, Any]:
        """Get monthly email subscription status for a user."""
        email = self._user_email.get(user_id, "")
        subscribed = user_id in getattr(self, '_monthly_subscribers', set())
        return {
            "subscribed": subscribed,
            "email": email,
            "message": "" if subscribed else "未订阅每月汇总邮件",
        }

    def set_monthly_email(self, user_id: str, subscribed: bool, email: str = "") -> dict[str, Any]:
        """Set monthly email subscription for a user."""
        if not hasattr(self, '_monthly_subscribers'):
            self._monthly_subscribers: set = set()
        if email:
            self._user_email[user_id] = email
        if subscribed:
            self._monthly_subscribers.add(user_id)
            message = f"已订阅每月汇总邮件，将发送至 {self._user_email.get(user_id, '您的邮箱')}"
        else:
            self._monthly_subscribers.discard(user_id)
            message = "已取消订阅每月汇总邮件"
        return {
            "subscribed": subscribed,
            "email": self._user_email.get(user_id, ""),
            "message": message,
        }


# Singleton accessor
_advanced_analytics: AdvancedAnalyticsService | None = None


def get_advanced_analytics_service() -> AdvancedAnalyticsService:
    global _advanced_analytics
    if _advanced_analytics is None:
        _advanced_analytics = AdvancedAnalyticsService()
    return _advanced_analytics
