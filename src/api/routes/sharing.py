"""
Sharing Routes — Access Requests, Folders, Sharing Analytics, Permission Grants

R126: Presentation Sharing & Permissions
"""


from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from ...api.middleware.auth import get_current_user
from ...core.security import Role, User
from ...services.sharing_service import (
    AccessRequestStatus,
    get_access_request_service,
    get_folder_service,
    get_permission_grant_service,
    get_sharing_analytics_service,
)

router = APIRouter(prefix="/api/v1/sharing", tags=["sharing"])


# ==================== Pydantic Models ====================

class AccessRequestCreate(BaseModel):
    resource_type: str = Field(..., pattern="^(ppt|workspace)$")
    resource_id: str
    resource_name: str = ""
    permission_requested: str = Field(default="view", pattern="^(view|comment|edit|download|full)$")
    message: str = ""


class AccessRequestApprove(BaseModel):
    request_id: str


class AccessRequestReject(BaseModel):
    request_id: str
    reason: str = ""


class FolderCreate(BaseModel):
    workspace_id: str = "default"
    name: str
    parent_id: str = ""
    color: str = "#165DFF"
    icon: str = "📁"


class FolderUpdate(BaseModel):
    name: str | None = None
    parent_id: str | None = None
    color: str | None = None
    icon: str | None = None
    sort_order: int | None = None


class FolderShare(BaseModel):
    emails: list[str] = Field(default_factory=list)


class PermissionGrantRequest(BaseModel):
    share_id: str
    grantee_email: str
    permission: str = Field(..., pattern="^(view|comment|edit|download|full)$")


class ShareAnalyticsQuery(BaseModel):
    owner_id: str = ""


# ==================== Access Request Routes ====================

@router.post("/access-requests")
async def create_access_request(
    req: AccessRequestCreate,
    user: User = Depends(get_current_user),
):
    """Request access to a presentation or workspace"""
    svc = get_access_request_service()

    # Determine owner_id (for PPT, look up from task_manager)
    owner_id = "default"
    if req.resource_type == "ppt":
        from ...services.task_manager import get_task_manager
        tm = get_task_manager()
        task = tm.get_task(req.resource_id)
        if task:
            owner_id = task.get("user_id", "default")

    # Check if there's already a pending request
    existing = svc.list_requests_for_resource(req.resource_type, req.resource_id)
    pending = [r for r in existing if r.requester_id == user.user_id and r.status == AccessRequestStatus.PENDING.value]
    if pending:
        raise HTTPException(status_code=409, detail="已有待处理的访问请求")

    ar = svc.create_request(
        requester_id=user.user_id,
        requester_email=user.email or f"{user.user_id}@example.com",
        requester_name=user.username or user.user_id,
        resource_type=req.resource_type,
        resource_id=req.resource_id,
        resource_name=req.resource_name,
        permission_requested=req.permission_requested,
        owner_id=owner_id,
        message=req.message,
    )
    return {"success": True, "access_request": ar.to_dict()}


@router.get("/access-requests/pending-count")
async def get_pending_request_count(user: User = Depends(get_current_user)):
    """Get count of pending access requests for current user (owner)"""
    svc = get_access_request_service()
    return {"pending_count": svc.pending_count(user.user_id)}


@router.get("/access-requests/owner")
async def list_owner_requests(
    status: str = Query("", description="Filter by status: pending, approved, rejected"),
    user: User = Depends(get_current_user),
):
    """List all access requests for resources owned by current user"""
    svc = get_access_request_service()
    requests = svc.list_requests_for_owner(user.user_id, status=status)
    return {"success": True, "requests": [r.to_dict() for r in requests]}


@router.get("/access-requests/mine")
async def list_my_requests(user: User = Depends(get_current_user)):
    """List all access requests made by current user"""
    svc = get_access_request_service()
    requests = svc.list_requests_for_requester(user.user_id)
    return {"success": True, "requests": [r.to_dict() for r in requests]}


@router.post("/access-requests/{request_id}/approve")
async def approve_access_request(
    request_id: str,
    user: User = Depends(get_current_user),
):
    """Approve an access request (owner only)"""
    svc = get_access_request_service()
    ar = svc.get_request(request_id)
    if not ar:
        raise HTTPException(status_code=404, detail="请求不存在")
    if ar.owner_id != user.user_id and user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="只有资源所有者可以审批")

    result = svc.approve_request(request_id, user.user_id)
    return {"success": True, "request": result.to_dict()}


@router.post("/access-requests/{request_id}/reject")
async def reject_access_request(
    request_id: str,
    body: AccessRequestReject,
    user: User = Depends(get_current_user),
):
    """Reject an access request (owner only)"""
    svc = get_access_request_service()
    ar = svc.get_request(request_id)
    if not ar:
        raise HTTPException(status_code=404, detail="请求不存在")
    if ar.owner_id != user.user_id and user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="只有资源所有者可以拒绝")

    result = svc.reject_request(request_id, user.user_id, body.reason)
    return {"success": True, "request": result.to_dict()}


@router.delete("/access-requests/{request_id}")
async def cancel_access_request(
    request_id: str,
    user: User = Depends(get_current_user),
):
    """Cancel a pending access request (requester only)"""
    svc = get_access_request_service()
    success = svc.cancel_request(request_id, user.user_id)
    if not success:
        raise HTTPException(status_code=404, detail="请求不存在或无法取消")
    return {"success": True}


# ==================== Folder Routes ====================

@router.post("/folders")
async def create_folder(
    req: FolderCreate,
    user: User = Depends(get_current_user),
):
    """Create a new presentation folder"""
    svc = get_folder_service()
    folder = svc.create_folder(
        workspace_id=req.workspace_id,
        name=req.name,
        created_by=user.user_id,
        parent_id=req.parent_id,
        color=req.color,
        icon=req.icon,
    )
    return {"success": True, "folder": folder.to_dict()}


@router.get("/folders")
async def list_folders(
    workspace_id: str = Query("default"),
    parent_id: str = Query(""),
    user: User = Depends(get_current_user),
):
    """List folders in a workspace"""
    svc = get_folder_service()
    folders = svc.list_folders(workspace_id, parent_id)
    return {"success": True, "folders": [f.to_dict() for f in folders]}


@router.get("/folders/{folder_id}")
async def get_folder(
    folder_id: str,
    user: User = Depends(get_current_user),
):
    """Get a folder by ID"""
    svc = get_folder_service()
    folder = svc.get_folder(folder_id)
    if not folder:
        raise HTTPException(status_code=404, detail="文件夹不存在")
    return {"success": True, "folder": folder.to_dict()}


@router.put("/folders/{folder_id}")
async def update_folder(
    folder_id: str,
    req: FolderUpdate,
    user: User = Depends(get_current_user),
):
    """Update a folder"""
    svc = get_folder_service()
    folder = svc.update_folder(
        folder_id=folder_id,
        name=req.name,
        parent_id=req.parent_id,
        color=req.color,
        icon=req.icon,
        sort_order=req.sort_order,
    )
    if not folder:
        raise HTTPException(status_code=404, detail="文件夹不存在")
    return {"success": True, "folder": folder.to_dict()}


@router.delete("/folders/{folder_id}")
async def delete_folder(
    folder_id: str,
    user: User = Depends(get_current_user),
):
    """Delete a folder"""
    svc = get_folder_service()
    folder = svc.get_folder(folder_id)
    if not folder:
        raise HTTPException(status_code=404, detail="文件夹不存在")
    success = svc.delete_folder(folder_id)
    return {"success": success}


@router.post("/folders/{folder_id}/ppt/{ppt_id}")
async def add_ppt_to_folder(
    folder_id: str,
    ppt_id: str,
    user: User = Depends(get_current_user),
):
    """Add a PPT to a folder"""
    svc = get_folder_service()
    success = svc.add_ppt_to_folder(folder_id, ppt_id)
    if not success:
        raise HTTPException(status_code=404, detail="文件夹不存在")
    return {"success": True}


@router.delete("/folders/{folder_id}/ppt/{ppt_id}")
async def remove_ppt_from_folder(
    folder_id: str,
    ppt_id: str,
    user: User = Depends(get_current_user),
):
    """Remove a PPT from a folder"""
    svc = get_folder_service()
    success = svc.remove_ppt_from_folder(folder_id, ppt_id)
    return {"success": success}


@router.post("/folders/{folder_id}/share")
async def share_folder(
    folder_id: str,
    req: FolderShare,
    user: User = Depends(get_current_user),
):
    """Share a folder with specific emails"""
    svc = get_folder_service()
    folder = svc.share_folder(folder_id, req.emails)
    if not folder:
        raise HTTPException(status_code=404, detail="文件夹不存在")
    return {"success": True, "folder": folder.to_dict()}


@router.delete("/folders/{folder_id}/share")
async def unshare_folder(
    folder_id: str,
    email: str = Query(""),
    user: User = Depends(get_current_user),
):
    """Unshare a folder"""
    svc = get_folder_service()
    folder = svc.unshare_folder(folder_id, email)
    if not folder:
        raise HTTPException(status_code=404, detail="文件夹不存在")
    return {"success": True, "folder": folder.to_dict()}


@router.get("/folders/ppt/{ppt_id}")
async def get_ppt_folders(
    ppt_id: str,
    user: User = Depends(get_current_user),
):
    """Get all folders containing a specific PPT"""
    svc = get_folder_service()
    folders = svc.get_ppt_folders(ppt_id)
    return {"success": True, "folders": [f.to_dict() for f in folders]}


@router.post("/folders/reorder")
async def reorder_folders(
    workspace_id: str = "default",
    folder_ids: list[str] = Query(default=[]),
    user: User = Depends(get_current_user),
):
    """Reorder folders in a workspace"""
    svc = get_folder_service()
    svc.reorder_folders(workspace_id, folder_ids)
    return {"success": True}


# ==================== Sharing Analytics Routes ====================

@router.get("/analytics")
async def get_sharing_analytics(
    user: User = Depends(get_current_user),
):
    """Get sharing analytics for current user (owner of shares)"""
    svc = get_sharing_analytics_service()
    analytics = svc.get_sharing_analytics(user.user_id)
    return {"success": True, **analytics}


@router.get("/analytics/share/{share_id}")
async def get_share_analytics(
    share_id: str,
    user: User = Depends(get_current_user),
):
    """Get detailed analytics for a specific share"""
    svc = get_sharing_analytics_service()
    history = svc.get_share_access_history(share_id)
    viewers = svc.get_viewer_list(share_id)
    return {
        "success": True,
        "share_id": share_id,
        "total_accesses": len(history),
        "recent_accesses": [h.to_dict() for h in history[:20]],
        "viewers": viewers,
    }


@router.get("/analytics/viewers/{share_id}")
async def get_share_viewers(
    share_id: str,
    user: User = Depends(get_current_user),
):
    """Get list of unique viewers for a share"""
    svc = get_sharing_analytics_service()
    viewers = svc.get_viewer_list(share_id)
    return {"success": True, "share_id": share_id, "viewers": viewers}


# ==================== Permission Grant Routes ====================

@router.post("/permissions/grant")
async def grant_permission(
    req: PermissionGrantRequest,
    user: User = Depends(get_current_user),
):
    """Grant a specific permission level to an email on a share"""
    svc = get_permission_grant_service()
    grant = svc.grant_permission(
        share_id=req.share_id,
        grantee_email=req.grantee_email,
        permission=req.permission,
        granted_by=user.user_id,
    )
    return {"success": True, "grant": grant.to_dict()}


@router.delete("/permissions/{share_id}/{grantee_email}")
async def revoke_permission(
    share_id: str,
    grantee_email: str,
    user: User = Depends(get_current_user),
):
    """Revoke a permission grant"""
    svc = get_permission_grant_service()
    success = svc.revoke_permission(share_id, grantee_email)
    return {"success": success}


@router.get("/permissions/{share_id}")
async def list_share_permissions(
    share_id: str,
    user: User = Depends(get_current_user),
):
    """List all permission grants for a share"""
    svc = get_permission_grant_service()
    grants = svc.list_grants_for_share(share_id)
    return {"success": True, "grants": [g.to_dict() for g in grants]}


# ==================== Record Access (called by share endpoints) ====================

@router.post("/record-access")
async def record_share_access(
    share_id: str,
    viewer_email: str = Query(""),
    viewer_name: str = Query(""),
    viewer_ip: str = Query(""),
    viewer_user_agent: str = Query(""),
    permission_used: str = Query("view"),
    device_type: str = Query("desktop"),
    country: str = Query(""),
    city: str = Query(""),
    accessed_via: str = Query("direct_link"),
):
    """Record a share access event (called internally by share endpoints)"""
    svc = get_sharing_analytics_service()
    log = svc.record_access(
        share_id=share_id,
        viewer_email=viewer_email,
        viewer_name=viewer_name,
        viewer_ip=viewer_ip,
        viewer_user_agent=viewer_user_agent,
        permission_used=permission_used,
        device_type=device_type,
        country=country,
        city=city,
        accessed_via=accessed_via,
    )
    return {"success": True, "log_id": log.share_id}
