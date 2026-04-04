# -*- coding: utf-8 -*-
"""
Analytics API Route

Provides analytics endpoints for:
- Full analytics dashboard (GET /)
- Real-time usage stats (GET /realtime)
- User retention cohort analysis (GET /cohort)
- Revenue analytics (GET /revenue)
- CSV export (GET /export/csv)

Author: Claude
Date: 2026-04-04
"""

from fastapi import APIRouter, Request
from pydantic import BaseModel
from starlette.responses import StreamingResponse as CSVResponse
from typing import Any
import csv
import io

from ...services.analytics_service import get_analytics_service
from ...services.advanced_analytics_service import get_advanced_analytics_service
from ...services.task_manager import get_task_manager
from ...api.middleware.rate_limit import get_user_id_from_request

router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])


class AnalyticsResponse(BaseModel):
    """Analytics response"""
    pass


@router.get("")
async def get_analytics(request: Request) -> AnalyticsResponse:
    """
    Get full analytics dashboard data.

    Computes usage statistics, template popularity, weekly activity heatmap,
    and productivity score from task history.
    Also includes real-time stats, cohort retention, and revenue analytics.
    """
    user_id = get_user_id_from_request(request)
    manager = get_task_manager()
    analytics = get_analytics_service()
    advanced = get_advanced_analytics_service()

    # Record current user for cohort tracking
    advanced.record_user(user_id)

    # Get all tasks (completed + all statuses for context)
    all_tasks = manager.get_history()
    tasks_list = [
        {**task, "task_id": tid}
        for tid, task in all_tasks.items()
    ]

    result = analytics.compute_analytics(tasks_list)

    # Attach real-time, cohort, and revenue analytics
    result["realtime"] = advanced.get_realtime_stats()
    result["cohort"] = advanced.get_cohort_retention(tasks_list)
    result["revenue"] = advanced.get_revenue_analytics(tasks_list)

    result["success"] = True
    result["user_id"] = user_id

    return result


@router.get("/realtime")
async def get_realtime_analytics(request: Request) -> AnalyticsResponse:
    """
    Get real-time usage analytics.

    Returns:
    - active_users_5m / 15m / 60m: users with activity in those windows
    - processing_count: currently running generations
    - pending_count: queued tasks
    - queue_count: alias for pending_count
    - avg_queue_wait_seconds: estimated wait time
    - total_active_tasks: all tracked tasks
    """
    user_id = get_user_id_from_request(request)
    advanced = get_advanced_analytics_service()
    advanced.track_request(user_id)

    stats = advanced.get_realtime_stats()
    stats["success"] = True
    stats["user_id"] = user_id
    return stats


@router.get("/cohort")
async def get_cohort_analytics(request: Request) -> AnalyticsResponse:
    """
    Get user retention cohort analysis.

    Cohorts are grouped by ISO week. Each cohort shows:
    - total_users in the cohort week
    - retention rates at day 1/7/14/30

    Also returns total_tracked_users.
    """
    user_id = get_user_id_from_request(request)
    advanced = get_advanced_analytics_service()
    advanced.record_user(user_id)

    manager = get_task_manager()
    all_tasks = manager.get_history()
    tasks_list = [
        {**task, "task_id": tid}
        for tid, task in all_tasks.items()
    ]

    result = advanced.get_cohort_retention(tasks_list)
    result["success"] = True
    result["user_id"] = user_id
    return result


@router.get("/revenue")
async def get_revenue_analytics(request: Request) -> AnalyticsResponse:
    """
    Get revenue analytics for pro/enterprise tiers.

    Returns:
    - pricing: current pricing config per tier
    - tier_distribution: user counts and percentages by tier
    - mrr_breakdown: MRR per tier
    - total_mrr_usd: total monthly recurring revenue
    - arpu_usd: average revenue per user
    - estimated_usage: generation breakdown by tier
    """
    user_id = get_user_id_from_request(request)
    advanced = get_advanced_analytics_service()
    advanced.record_user(user_id)

    manager = get_task_manager()
    all_tasks = manager.get_history()
    tasks_list = [
        {**task, "task_id": tid}
        for tid, task in all_tasks.items()
    ]

    result = advanced.get_revenue_analytics(tasks_list)
    result["success"] = True
    result["user_id"] = user_id
    return result


@router.get("/export/csv")
async def export_analytics_csv(request: Request) -> CSVResponse:
    """
    Export analytics data as CSV.

    Returns a CSV with columns:
    - date, template, style, scene, slide_count, status, created_at, updated_at
    """
    manager = get_task_manager()
    all_tasks = manager.get_history()
    tasks_list = [
        {**task, "task_id": tid}
        for tid, task in all_tasks.items()
    ]

    # Build CSV
    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow([
        "task_id", "date", "template", "style", "scene",
        "slide_count", "status", "created_at", "updated_at"
    ])

    for task in tasks_list:
        created = task.get("created_at", "")
        # Extract date from timestamp
        date = created[:10] if created else ""
        writer.writerow([
            task.get("task_id", ""),
            date,
            task.get("template", ""),
            task.get("style", ""),
            task.get("scene", ""),
            task.get("slide_count", 0),
            task.get("status", ""),
            created,
            task.get("updated_at", "")
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=rabai_analytics.csv"
        }
    )


class WeeklyEmailRequest(BaseModel):
    subscribed: bool
    email: str = ""


class WeeklyEmailResponse(BaseModel):
    subscribed: bool
    email: str
    message: str


@router.get("/weekly-email")
async def get_weekly_email_status(request: Request) -> WeeklyEmailResponse:
    """
    Get weekly email subscription status.
    """
    user_id = get_user_id_from_request(request)
    advanced = get_advanced_analytics_service()
    status = advanced.get_weekly_email_status(user_id)
    return WeeklyEmailResponse(**status)


@router.post("/weekly-email")
async def set_weekly_email(request: Request, body: WeeklyEmailRequest) -> WeeklyEmailResponse:
    """
    Subscribe or unsubscribe from weekly summary emails.

    Body:
    - subscribed: bool - whether to subscribe
    - email: str - email address (optional, uses stored email if empty)
    """
    user_id = get_user_id_from_request(request)
    advanced = get_advanced_analytics_service()
    status = advanced.set_weekly_email(user_id, body.subscribed, body.email)
    return WeeklyEmailResponse(**status)


@router.post("/weekly-email/send")
async def send_weekly_email(request: Request) -> WeeklyEmailResponse:
    """
    Manually trigger weekly summary email (for testing).
    """
    user_id = get_user_id_from_request(request)
    advanced = get_advanced_analytics_service()
    status = advanced.send_weekly_email(user_id)
    return WeeklyEmailResponse(**status)
