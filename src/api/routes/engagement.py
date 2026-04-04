# -*- coding: utf-8 -*-
"""
Social Engagement API Routes
"""

from fastapi import APIRouter, HTTPException, Request, Query
from typing import Optional, List, Dict
import logging
from pydantic import BaseModel, Field

from ...services.engagement_service import get_engagement_service
from ...models import ReactionType, ReactionRequest, ReactionResponse, ShareLinkRequest, ShareLinkResponse, ViewCountResponse, EngagementStats, PollVoteRequest, PollVoteResponse, QASubmitRequest, QASubmitResponse

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


# ==================== Polls ====================

class CreatePollRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=300)
    options: List[str] = Field(..., min_items=2, max_items=10)


@router.post("/polls/{task_id}", response_model=Dict)
async def create_poll(task_id: str, req: CreatePollRequest, request: Request):
    """Create a new poll for a slide"""
    service = get_engagement_service()
    result = service.create_poll(task_id, req.question, req.options)
    return result


@router.post("/polls/{task_id}/vote", response_model=PollVoteResponse)
async def vote_poll(task_id: str, req: PollVoteRequest, request: Request):
    """Vote on a poll"""
    service = get_engagement_service()
    user_id = _get_user_id(request)
    result = service.vote_poll(task_id, req.poll_id, user_id, req.option_index)
    if not result.get('success'):
        raise HTTPException(status_code=404, detail="Poll not found")
    return PollVoteResponse(**result)


@router.get("/polls/{task_id}/{poll_id}")
async def get_poll_results(task_id: str, poll_id: str):
    """Get poll results"""
    service = get_engagement_service()
    result = service.get_poll_results(task_id, poll_id)
    if not result.get('success'):
        raise HTTPException(status_code=404, detail="Poll not found")
    return result


@router.get("/polls/{task_id}")
async def get_polls_for_task(task_id: str):
    """Get all polls for a task"""
    service = get_engagement_service()
    return service.get_polls_for_task(task_id)


@router.post("/polls/{task_id}/{poll_id}/close")
async def close_poll(task_id: str, poll_id: str):
    """Close/deactivate a poll"""
    service = get_engagement_service()
    return service.close_poll(task_id, poll_id)


# ==================== Q&A ====================

@router.post("/qa/{task_id}", response_model=QASubmitResponse)
async def submit_qa(task_id: str, req: QASubmitRequest, request: Request):
    """Submit a Q&A question"""
    service = get_engagement_service()
    result = service.submit_qa(task_id, req.question, req.asker_name or "匿名用户")
    return QASubmitResponse(**result)


@router.get("/qa/{task_id}")
async def get_qa_list(task_id: str):
    """Get all Q&A for a task"""
    service = get_engagement_service()
    return service.get_qa_list(task_id)


@router.post("/qa/{task_id}/{qa_id}/upvote")
async def upvote_qa(task_id: str, qa_id: str, request: Request):
    """Upvote a Q&A question"""
    service = get_engagement_service()
    user_id = _get_user_id(request)
    return service.upvote_qa(task_id, qa_id, user_id)


@router.post("/qa/{task_id}/{qa_id}/answer")
async def answer_qa(task_id: str, qa_id: str, answer_text: str = Query(...), request: Request = None):
    """Mark a Q&A as answered"""
    service = get_engagement_service()
    return service.answer_qa(task_id, qa_id, answer_text)


# ==================== Lead Capture ====================

class LeadCaptureRequest(BaseModel):
    email: str = Field(..., description="Email address")
    name: Optional[str] = Field("", description="Name")
    company: Optional[str] = Field("", description="Company")


@router.post("/leads/{task_id}", response_model=Dict)
async def capture_lead(task_id: str, req: LeadCaptureRequest, request: Request):
    """Capture a lead (email collection) from embedded presentation"""
    import re
    # Validate email
    email = req.email.strip()
    if not re.match(r'^[^@]+@[^@]+\.[^@]+$', email):
        return {"success": False, "error": "Invalid email format"}
    
    service = get_engagement_service()
    result = service.add_lead_capture(
        task_id,
        email=email,
        name=req.name or "",
        company=req.company or ""
    )
    return result


@router.get("/leads/{task_id}", response_model=Dict)
async def get_leads(task_id: str):
    """Get all captured leads for a task"""
    service = get_engagement_service()
    return service.get_lead_captures(task_id)


@router.get("/leads/{task_id}/stats", response_model=Dict)
async def get_lead_stats(task_id: str):
    """Get lead capture statistics"""
    service = get_engagement_service()
    return service.get_lead_stats(task_id)


@router.post("/pixel/{task_id}/track", response_model=Dict)
async def track_pixel_view(task_id: str, request: Request):
    """Track a pixel view event from external website"""
    service = get_engagement_service()
    view_count = service.increment_view(task_id)
    stats = service.get_engagement_stats(task_id)
    return {"success": True, "task_id": task_id, "view_count": view_count, "tracked": True}
