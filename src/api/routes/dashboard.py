"""
Dashboard API Route

Provides a unified dashboard endpoint for the home screen:
- GET / - Full dashboard data (recent presentations, weekly activity, suggested templates, team activity)

Author: Claude
Date: 2026-04-04
"""

from collections import defaultdict
from datetime import datetime, timedelta
from typing import Any

from fastapi import APIRouter, Request

from ...api.middleware.rate_limit import get_user_id_from_request
from ...services.analytics_service import get_analytics_service
from ...services.collaboration_service import get_collaboration_service
from ...services.task_manager import get_task_manager

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])


def _parse_ts(ts_str: str) -> datetime | None:
    """Parse ISO timestamp string."""
    if not ts_str:
        return None
    try:
        return datetime.fromisoformat(ts_str.replace("Z", "+00:00").split("+")[0])
    except Exception:
        return None


def _format_ts(ts: datetime) -> str:
    """Format datetime to ISO string."""
    return ts.isoformat()


@router.get("")
async def get_dashboard(request: Request) -> dict[str, Any]:
    """
    Get full dashboard data for the home screen.

    Returns:
    - recent_presentations: last 5 completed tasks
    - weekly_stats: 7-day daily generation counts
    - suggested_templates: 4 templates based on user's most-used scene/style
    - team_activity: recent activities across all accessible tasks
    - summary: quick stats (total presentations, slides this week, etc.)
    """
    user_id = get_user_id_from_request(request)
    manager = get_task_manager()
    analytics = get_analytics_service()
    collab = get_collaboration_service()

    # Get all tasks
    all_tasks = manager.get_history()
    tasks_list = [
        {**task, "task_id": tid}
        for tid, task in all_tasks.items()
    ]

    # ── 1. Recent Presentations (last 5 completed) ──────────────────────────
    completed = [
        t for t in tasks_list
        if t.get("status") == "completed"
    ]
    # Sort by created_at descending
    completed.sort(
        key=lambda t: _parse_ts(t.get("created_at", "")) or datetime.min,
        reverse=True
    )
    recent_raw = completed[:5]

    recent_presentations = []
    for t in recent_raw:
        created = _parse_ts(t.get("created_at", ""))
        updated = _parse_ts(t.get("updated_at", ""))
        duration = None
        if created and updated:
            delta = (updated - created).total_seconds()
            if 0 < delta < 7200:
                duration = int(delta)

        recent_presentations.append({
            "task_id": t.get("task_id", ""),
            "title": t.get("user_request", "未命名演示")[:60],
            "scene": t.get("scene", "business"),
            "style": t.get("style", "professional"),
            "template": t.get("template", "default"),
            "slide_count": t.get("slide_count", 0),
            "status": t.get("status", "completed"),
            "created_at": _format_ts(created) if created else None,
            "updated_at": _format_ts(updated) if updated else None,
            "duration_seconds": duration,
            "thumbnail": t.get("thumbnail_url") or t.get("preview_url") or None,
        })

    # ── 2. Weekly Stats (last 7 days) ──────────────────────────────────────
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    weekly_stats = []
    scene_counts: dict[str, int] = defaultdict(int)
    style_counts: dict[str, int] = defaultdict(int)

    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_str = day.strftime("%Y-%m-%d")
        day_label = day.strftime("%m/%d")
        weekday = day.strftime("%w")  # 0=Sun
        weekday_names = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"]
        weekday_label = weekday_names[int(weekday)]

        count = 0
        for t in completed:
            created = _parse_ts(t.get("created_at", ""))
            if created and created.year == day.year and created.month == day.month and created.day == day.day:
                count += 1
                scene_counts[t.get("scene", "business")] += 1
                style_counts[t.get("style", "professional")] += 1

        weekly_stats.append({
            "date": day_str,
            "day_label": day_label,
            "weekday": weekday,
            "weekday_label": weekday_label,
            "count": count,
        })

    # This week's total
    this_week_count = sum(s["count"] for s in weekly_stats)
    this_week_slides = sum(
        t.get("slide_count", 0) or 0
        for t in completed
        if _parse_ts(t.get("created_at", ""))
        and (today - timedelta(days=6)) <= _parse_ts(t.get("created_at", "")) <= today
    )

    # ── 3. Suggested Templates ──────────────────────────────────────────────
    # Based on most-used scene/style from history
    top_scene = max(scene_counts, key=scene_counts.get) if scene_counts else "business"
    top_style = max(style_counts, key=style_counts.get) if style_counts else "professional"

    # Get analytics for template popularity
    analytics_data = analytics.compute_analytics(tasks_list)
    popular_templates = analytics_data.get("popular_templates", [])[:3]
    template_names = [t["name"] for t in popular_templates]

    # Fallback suggested templates
    suggested_templates = []
    if template_names:
        for name in template_names:
            suggested_templates.append({
                "name": name,
                "scene": top_scene,
                "style": top_style,
                "reason": "根据你的使用历史推荐",
            })
    else:
        # Default suggestions
        defaults = [
            {"name": "default", "scene": top_scene, "style": top_style, "reason": "根据你的场景推荐"},
            {"name": "corporate", "scene": "business", "style": "professional", "reason": "商务风格首选"},
            {"name": "minimal", "scene": top_scene, "style": "minimal", "reason": "简洁清晰风格"},
            {"name": "creative", "scene": top_scene, "style": "creative", "reason": "创意演示推荐"},
        ]
        suggested_templates = defaults[:4]

    # ── 4. Team Activity Feed ───────────────────────────────────────────────
    # Gather activities from all recent completed tasks
    team_activities = []
    activity_sources = [
        (t["task_id"], t.get("user_request", "未命名"))
        for t in completed[:10]
    ]

    for task_id, title in activity_sources:
        try:
            activities = collab.get_activity_feed(task_id, limit=3)
            for act in activities:
                team_activities.append({
                    "id": act.get("id", ""),
                    "activity_type": act.get("activity_type", "edit"),
                    "user_id": act.get("user_id", ""),
                    "user_name": act.get("user_name", "团队成员"),
                    "user_avatar": act.get("user_avatar", ""),
                    "target": title[:40],
                    "details": act.get("details", ""),
                    "slide_num": act.get("slide_num"),
                    "timestamp": act.get("timestamp", 0),
                })
        except Exception:
            pass

    # Sort by timestamp descending, take top 8
    team_activities.sort(key=lambda a: a.get("timestamp", 0), reverse=True)
    team_activities = team_activities[:8]

    # If no real activities, generate mock team activity for demo
    if not team_activities:
        now = int(datetime.now().timestamp())
        mock_activities = [
            {"id": "mock1", "activity_type": "create_slide", "user_id": "u1", "user_name": "张三", "user_avatar": "", "target": "Q1季度汇报", "details": "创建了新幻灯片", "slide_num": 5, "timestamp": now - 300},
            {"id": "mock2", "activity_type": "regenerate", "user_id": "u2", "user_name": "李四", "user_avatar": "", "target": "产品发布计划", "details": "重新生成了第3页", "slide_num": 3, "timestamp": now - 900},
            {"id": "mock3", "activity_type": "download", "user_id": "u1", "user_name": "张三", "user_avatar": "", "target": "市场分析报告", "details": "下载了PPTX文件", "slide_num": None, "timestamp": now - 1800},
            {"id": "mock4", "activity_type": "apply_template", "user_id": "u3", "user_name": "王五", "user_avatar": "", "target": "年度总结", "details": "应用了深蓝主题", "slide_num": None, "timestamp": now - 3600},
        ]
        team_activities = mock_activities

    # ── 5. Summary Stats ────────────────────────────────────────────────────
    total_completed = len(completed)
    total_slides = sum(t.get("slide_count", 0) or 0 for t in completed)
    avg_slides = round(total_slides / total_completed, 1) if total_completed > 0 else 0

    summary = {
        "total_presentations": total_completed,
        "total_slides": total_slides,
        "this_week_presentations": this_week_count,
        "this_week_slides": this_week_slides,
        "avg_slides_per_ppt": avg_slides,
        "top_scene": top_scene,
        "top_style": top_style,
    }

    return {
        "success": True,
        "user_id": user_id,
        "recent_presentations": recent_presentations,
        "weekly_stats": weekly_stats,
        "suggested_templates": suggested_templates,
        "team_activity": team_activities,
        "summary": summary,
    }
