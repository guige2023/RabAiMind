# -*- coding: utf-8 -*-
"""
Social Engagement API Routes
"""

from fastapi import APIRouter, HTTPException, Request, Query
from typing import Optional
import logging

from ...services.engagement_service import get_engagement_service
from ...models import ReactionType, ReactionRequest, ReactionResponse, ShareLinkRequest, ShareLinkResponse, ViewCountResponse, EngagementStats

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/engagement", tags=["engagement"])


def _get_user_id(request: Request) -> str:
    """Get user ID from request headers or use anonymous"""
    # Try to get from auth header or use a simple hash of IP as fallback
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        # In production, decode JWT here
        return auth_header[7:20]  # simplified
    # Fallback to anonymous based on IP
    client_ip = request.client.host if request.client else 'anonymous'
    return f"anon_{hash(client_ip) % 100000}"


# ==================== View Counter ====================

@router.post("/view/{task_id}", response_model=ViewCountResponse)
async def record_view(task_id: str, request: Request):
    """Record a view for a public presentation"""
    service = get_engagement_service()
    view_count = service.increment_view(task_id)
    stats = service.get_engagement_stats(task_id)
    return ViewCountResponse(
        success=True,
        task_id=task_id,
        view_count=view_count,
        is_public=stats.get('is_public', False)
    )


@router.get("/stats/{task_id}", response_model=EngagementStats)
async def get_engagement_stats(task_id: str):
    """Get engagement stats for a presentation"""
    service = get_engagement_service()
    stats = service.get_engagement_stats(task_id)
    return EngagementStats(**stats)


# ==================== Reactions ====================

@router.post("/react", response_model=ReactionResponse)
async def add_reaction(req: ReactionRequest, request: Request):
    """Add or update a reaction"""
    service = get_engagement_service()
    user_id = _get_user_id(request)
    
    # If same reaction type is sent, toggle (remove)
    current = service.get_user_reaction(req.task_id, user_id)
    if current == req.reaction_type.value:
        # Toggle off
        result = service.remove_reaction(req.task_id, user_id)
    else:
        result = service.add_reaction(req.task_id, user_id, req.reaction_type.value)
    
    return ReactionResponse(**result)


@router.delete("/react/{task_id}", response_model=ReactionResponse)
async def remove_reaction(task_id: str, request: Request):
    """Remove user's reaction"""
    service = get_engagement_service()
    user_id = _get_user_id(request)
    result = service.remove_reaction(task_id, user_id)
    return ReactionResponse(**result)


@router.get("/reaction/{task_id}")
async def get_user_reaction_status(task_id: str, request: Request):
    """Get current user's reaction status"""
    service = get_engagement_service()
    user_id = _get_user_id(request)
    reaction = service.get_user_reaction(task_id, user_id)
    stats = service.get_engagement_stats(task_id)
    return {
        "success": True,
        "task_id": task_id,
        "user_reaction": reaction,
        "total_likes": stats.get('likes', 0),
        "total_fires": stats.get('fires', 0),
        "total_hearts": stats.get('hearts', 0)
    }


# ==================== Share Link ====================

@router.post("/share-link", response_model=ShareLinkResponse)
async def set_share_link(req: ShareLinkRequest, request: Request):
    """Set custom share link metadata"""
    service = get_engagement_service()
    # Increment share count
    service.increment_share_count(req.task_id)
    result = service.set_share_link(
        req.task_id, req.title, req.description, req.thumbnail
    )
    return ShareLinkResponse(**result)


@router.get("/share-link/{task_id}", response_model=ShareLinkResponse)
async def get_share_link(task_id: str):
    """Get share link metadata"""
    service = get_engagement_service()
    result = service.get_share_link(task_id)
    return ShareLinkResponse(**result)


# ==================== Public/Private ====================

@router.post("/public/{task_id}")
async def set_public_status(task_id: str, is_public: bool = Query(True)):
    """Set presentation as public or private"""
    service = get_engagement_service()
    result = service.set_public(task_id, is_public)
    return result


@router.get("/public/{task_id}")
async def get_public_status(task_id: str):
    """Get public status"""
    service = get_engagement_service()
    stats = service.get_engagement_stats(task_id)
    return {
        "success": True,
        "task_id": task_id,
        "is_public": stats.get('is_public', False)
    }
