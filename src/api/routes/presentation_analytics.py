# -*- coding: utf-8 -*-
"""
Presentation Analytics API Route

Provides analytics endpoints for:
- POST /view/start - Start a view session
- POST /heartbeat - Track slide view time
- POST /heatmap - Record heatmap attention data
- POST /scroll - Record scroll depth
- POST /view/end - End a view session
- GET /{task_id} - Get full analytics
- GET /{task_id}/report - Download PDF report

Author: Claude
Date: 2026-04-04
"""

from fastapi import APIRouter, Request, Query
from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime

from ...services.presentation_analytics_service import get_presentation_analytics_service
from ...api.middleware.rate_limit import get_user_id_from_request

router = APIRouter(prefix="/api/v1/presentation-analytics", tags=["presentation-analytics"])


# ==================== Request/Response Models ====================

class ViewStartRequest(BaseModel):
    task_id: str
    viewer_id: Optional[str] = None
    viewer_name: Optional[str] = "Anonymous"


class ViewStartResponse(BaseModel):
    success: bool
    session_id: str
    viewer_id: str


class HeartbeatRequest(BaseModel):
    session_id: str
    slide_index: int
    duration_seconds: float = 0


class HeatmapRequest(BaseModel):
    session_id: str
    slide_index: int
    points: List[dict]  # [{"x": 0.0-1.0, "y": 0.0-1.0, "weight": 1.0}, ...]


class ScrollRequest(BaseModel):
    session_id: str
    scroll_percent: float  # 0-100


class ViewEndRequest(BaseModel):
    session_id: str
    duration_seconds: float = 0


class EffectivenessScoreResponse(BaseModel):
    total: float = 0
    reach_score: float = 0
    depth_score: float = 0
    engagement_score: float = 0
    hotspot_score: float = 0
    completion_score: float = 0


class AnalyticsResponse(BaseModel):
    success: bool
    task_id: str
    total_views: int = 0
    unique_viewers: int = 0
    viewer_list: List[dict] = []
    slide_stats: List[dict] = []
    avg_scroll_depth_percent: float = 0
    scroll_depth_reached_end_count: int = 0
    scroll_depth_samples: int = 0
    heatmap_grid_size: int = 8
    overview_heatmap: dict = {}
    effectiveness_score: Optional[dict] = None


# ==================== Routes ====================

@router.post("/view/start")
async def start_view_session(request: Request, body: ViewStartRequest) -> ViewStartResponse:
    """Start a new view session for a presentation"""
    user_id = get_user_id_from_request(request)
    viewer_id = body.viewer_id or user_id or "anonymous"
    viewer_name = body.viewer_name or "Anonymous"

    service = get_presentation_analytics_service()
    session_id = service.track_view_start(body.task_id, viewer_id, viewer_name)

    return ViewStartResponse(
        success=True,
        session_id=session_id,
        viewer_id=viewer_id
    )


@router.post("/heartbeat")
async def track_heartbeat(body: HeartbeatRequest) -> dict:
    """Track time spent on current slide (heartbeat)"""
    service = get_presentation_analytics_service()
    result = service.track_slide_view(
        session_id=body.session_id,
        slide_index=body.slide_index,
        duration_seconds=body.duration_seconds,
    )
    return result


@router.post("/heatmap")
async def track_heatmap(body: HeatmapRequest) -> dict:
    """Record heatmap attention data for a slide"""
    service = get_presentation_analytics_service()
    result = service.track_heatmap(
        session_id=body.session_id,
        slide_index=body.slide_index,
        heatmap_points=body.points,
    )
    return result


@router.post("/scroll")
async def track_scroll(body: ScrollRequest) -> dict:
    """Record scroll depth for web-hosted presentations"""
    service = get_presentation_analytics_service()
    result = service.track_scroll_depth(
        session_id=body.session_id,
        scroll_percent=body.scroll_percent,
    )
    return result


@router.post("/view/end")
async def end_view_session(body: ViewEndRequest) -> dict:
    """End a view session"""
    service = get_presentation_analytics_service()
    result = service.end_session(
        session_id=body.session_id,
        duration_seconds=body.duration_seconds,
    )
    return result


@router.get("/{task_id}")
async def get_analytics(task_id: str) -> AnalyticsResponse:
    """Get full analytics for a presentation"""
    service = get_presentation_analytics_service()
    analytics = service.get_presentation_analytics(task_id)
    return analytics


@router.get("/{task_id}/report")
async def get_analytics_report(task_id: str) -> Any:
    """Download analytics report as PDF (falls back to HTML if PDF fails)"""
    service = get_presentation_analytics_service()
    pdf_bytes = service.generate_pdf_report(task_id)

    if pdf_bytes.startswith(b'<!DOCTYPE') or pdf_bytes.startswith(b'<html'):
        # Fallback HTML
        from starlette.responses import Response
        return Response(
            content=pdf_bytes,
            media_type="text/html; charset=utf-8",
            headers={"Content-Disposition": f"inline; filename=analytics_{task_id}.html"}
        )

    from starlette.responses import Response
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=analytics_{task_id}.pdf"}
    )


# ==================== CTA / Conversion Tracking ====================

class CTAClickRequest(BaseModel):
    task_id: str
    session_id: str
    viewer_id: str = "anonymous"
    cta_label: str = "Contact Us"
    cta_url: str = ""


@router.post("/cta-click")
async def track_cta_click(body: CTAClickRequest) -> dict:
    """Track a CTA button click for conversion goals"""
    service = get_presentation_analytics_service()
    result = service.track_cta_click(
        task_id=body.task_id,
        session_id=body.session_id,
        viewer_id=body.viewer_id,
        cta_label=body.cta_label,
        cta_url=body.cta_url,
    )
    return result


@router.get("/cta-stats/{task_id}")
async def get_cta_stats(task_id: str) -> dict:
    """Get CTA click statistics for a presentation"""
    service = get_presentation_analytics_service()
    stats = service.get_cta_stats(task_id)
    return {"success": True, "task_id": task_id, **stats}


# ==================== Live / Real-time Stats ====================

@router.get("/live-stats/{task_id}")
async def get_live_stats(task_id: str) -> dict:
    """Get real-time viewer stats (active viewers now)"""
    service = get_presentation_analytics_service()
    stats = service.get_live_stats(task_id)
    return {"success": True, "task_id": task_id, **stats}


# ==================== Slide Time Heatmap ====================

@router.get("/{task_id}/slide-heatmap")
async def get_slide_heatmap(
    task_id: str,
    total_slides: int = Query(default=10, ge=1, le=100),
) -> dict:
    """Get average time per slide as a heatmap"""
    service = get_presentation_analytics_service()
    heatmap = service.get_slide_time_heatmap(task_id, total_slides)
    return {"success": True, "task_id": task_id, **heatmap}


# ==================== Browser/Device Breakdown ====================

@router.get("/{task_id}/breakdown")
async def get_browser_device_breakdown(task_id: str) -> dict:
    """Get browser and device breakdown for a presentation"""
    service = get_presentation_analytics_service()
    breakdown = service.get_browser_device_breakdown(task_id)
    return {"success": True, "task_id": task_id, **breakdown}
# ==================== R156: A/B Testing Routes ====================

class ABVersionRequest(BaseModel):
    task_id: str
    slide_index: int
    version_key: str  # "A" or "B"
    content_md5: str
    metadata: Optional[dict] = None


class ABAssignmentRequest(BaseModel):
    task_id: str
    session_id: str
    slide_index: int
    version_key: str


@router.post("/ab/version")
async def save_ab_version(body: ABVersionRequest) -> dict:
    """Save a slide version for A/B testing"""
    service = get_presentation_analytics_service()
    result = service.save_ab_version(
        task_id=body.task_id,
        slide_index=body.slide_index,
        version_key=body.version_key,
        content_md5=body.content_md5,
        metadata=body.metadata,
    )
    return result


@router.post("/ab/assign")
async def track_ab_assignment(body: ABAssignmentRequest) -> dict:
    """Track which version a viewer was assigned to"""
    service = get_presentation_analytics_service()
    result = service.track_ab_assignment(
        task_id=body.task_id,
        session_id=body.session_id,
        slide_index=body.slide_index,
        version_key=body.version_key,
    )
    return result


@router.get("/ab/results/{task_id}/{slide_index}")
async def get_ab_test_results(task_id: str, slide_index: int) -> dict:
    """Get A/B test comparison results for a slide"""
    service = get_presentation_analytics_service()
    result = service.get_ab_test_results(task_id=task_id, slide_index=slide_index)
    return result


# ==================== R156: Story Flow Analysis ====================

@router.get("/story-flow/{task_id}")
async def get_story_flow(task_id: str) -> dict:
    """Analyze narrative engagement across slides"""
    service = get_presentation_analytics_service()
    result = service.get_story_flow_analysis(task_id)
    return result


# ==================== R156: Predicted Conversion Score ====================

@router.get("/conversion-score/{task_id}")
async def get_conversion_score(task_id: str) -> dict:
    """Get AI-predicted conversion score"""
    service = get_presentation_analytics_service()
    result = service.get_predicted_conversion_score(task_id)
    return result


# ==================== R156: Comparative Benchmarks ====================

@router.get("/benchmarks/{task_id}")
async def get_benchmarks(
    task_id: str,
    category: str = Query(default="business"),
) -> dict:
    """Compare presentation performance against industry benchmarks"""
    service = get_presentation_analytics_service()
    result = service.get_comparative_benchmarks(task_id, category)
    return result


# ==================== R156: Per-Slide Heatmaps ====================

@router.get("/slide-heatmaps/{task_id}")
async def get_per_slide_heatmaps(task_id: str) -> dict:
    """Get per-slide attention heatmaps (not just aggregated overview)"""
    service = get_presentation_analytics_service()
    result = service.get_slide_heatmaps(task_id)
    return result
