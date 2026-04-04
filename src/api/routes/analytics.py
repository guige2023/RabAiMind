# -*- coding: utf-8 -*-
"""
Analytics API Route

Provides analytics endpoints for usage statistics, template popularity,
weekly activity heatmap, productivity score, and CSV export.

Author: Claude
Date: 2026-04-04
"""

from fastapi import APIRouter, Request, Response
from starlette.responses import StreamingResponse
from typing import Dict, Any, Optional
import csv
import io

from ...services.analytics_service import get_analytics_service
from ...services.task_manager import get_task_manager
from ...api.middleware.rate_limit import get_user_id_from_request

router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])


class AnalyticsResponse(Dict[str, Any]):
    """Analytics response"""
    pass


@router.get("")
async def get_analytics(request: Request) -> AnalyticsResponse:
    """
    Get full analytics dashboard data.
    
    Computes usage statistics, template popularity, weekly activity heatmap,
    and productivity score from task history.
    """
    user_id = get_user_id_from_request(request)
    manager = get_task_manager()
    analytics = get_analytics_service()
    
    # Get all tasks (completed + all statuses for context)
    all_tasks = manager.get_history()
    tasks_list = [
        {**task, "task_id": tid}
        for tid, task in all_tasks.items()
    ]
    
    result = analytics.compute_analytics(tasks_list)
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
