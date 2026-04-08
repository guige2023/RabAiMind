# -*- coding: utf-8 -*-
"""
Share Link Routes — PPT分享链接功能
Phase 2.1: 分享链接功能

POST /share - 生成分享链接
GET /share/{share_code} - 获取分享内容
GET /share/{share_code}/qr - 获取二维码
DELETE /share/{share_id} - 删除分享链接
"""

from fastapi import APIRouter, HTTPException, Query, Depends, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Optional, List

from ....services.share_link_service import (
    get_share_link_service, 
    SharePermission,
)
from ....core.security import User
from ....api.middleware.auth import get_current_user, get_current_user_optional

router = APIRouter(prefix="/api/v1/share-link", tags=["share-link"])


# ==================== Request/Response Models ====================

class ShareLinkCreate(BaseModel):
    """创建分享链接请求"""
    ppt_id: str = Field(..., description="PPT任务ID")
    ppt_title: str = Field(default="", description="PPT标题")
    permission: str = Field(default="view", description="权限: view, comment, edit, download")
    expires_in_hours: Optional[int] = Field(None, description="过期小时数 (None=永不过期)")
    password: Optional[str] = Field(None, description="密码保护 (可选)")


class ShareLinkUpdate(BaseModel):
    """更新分享链接请求"""
    permission: Optional[str] = Field(None, description="权限级别")
    expires_in_hours: Optional[int] = Field(None, description="过期小时数 (None=永不过期, 0=立即过期)")
    password: Optional[str] = Field(None, description="密码 (空字符串=清除密码)")


class ShareLinkResponse(BaseModel):
    """分享链接响应"""
    share_id: str
    share_code: str
    share_url: str
    ppt_id: str
    ppt_title: str
    permission: str
    created_at: str
    expires_at: str
    access_count: int
    is_active: bool
    has_password: bool
    qr_code_data: Optional[str] = None


class ShareLinkVerify(BaseModel):
    """验证分享访问"""
    password: str = Field(default="", description="密码 (如果需要)")


# ==================== Share Link Routes ====================

@router.post("", response_model=ShareLinkResponse)
async def create_share_link(
    req: ShareLinkCreate,
    user: User = Depends(get_current_user),
):
    """
    生成分享链接
    
    - 生成8位分享码
    - 支持设置过期时间
    - 支持密码保护
    - 自动生成二维码
    """
    svc = get_share_link_service()
    
    # 验证权限级别
    valid_permissions = [p.value for p in SharePermission]
    if req.permission not in valid_permissions:
        raise HTTPException(status_code=400, detail=f"无效的权限级别，可选值: {valid_permissions}")
    
    # 创建分享链接
    link = svc.create_share_link(
        ppt_id=req.ppt_id,
        ppt_title=req.ppt_title or "PPT分享",
        owner_id=user.user_id,
        permission=req.permission,
        expires_in_hours=req.expires_in_hours,
        password=req.password or "",
    )
    
    return ShareLinkResponse(
        share_id=link.share_id,
        share_code=link.share_code,
        share_url=f"/share/{link.share_code}",
        ppt_id=link.ppt_id,
        ppt_title=link.ppt_title,
        permission=link.permission,
        created_at=link.created_at,
        expires_at=link.expires_at,
        access_count=link.access_count,
        is_active=link.is_active,
        has_password=bool(link.password),
        qr_code_data=link.qr_code_data or None,
    )


@router.get("/{share_code}", response_model=ShareLinkResponse)
async def get_share_link(
    share_code: str,
    request: Request,
):
    """
    获取分享链接信息 (公开接口)
    
    返回分享链接基本信息，不包含敏感数据
    """
    svc = get_share_link_service()
    link = svc.get_by_code(share_code)
    
    if not link:
        raise HTTPException(status_code=404, detail="分享链接不存在")
    
    if not link.is_active:
        raise HTTPException(status_code=410, detail="分享链接已失效")
    
    if link.is_expired():
        raise HTTPException(status_code=410, detail="分享链接已过期")
    
    return ShareLinkResponse(
        share_id=link.share_id,
        share_code=link.share_code,
        share_url=f"/share/{link.share_code}",
        ppt_id=link.ppt_id,
        ppt_title=link.ppt_title,
        permission=link.permission,
        created_at=link.created_at,
        expires_at=link.expires_at,
        access_count=link.access_count,
        is_active=link.is_active,
        has_password=bool(link.password),
        qr_code_data=None,  # 不暴露二维码数据
    )


@router.post("/{share_code}/verify")
async def verify_share_access(
    share_code: str,
    body: ShareLinkVerify,
    request: Request,
):
    """
    验证分享访问权限 (公开接口)
    
    - 验证密码是否正确
    - 记录访问
    - 返回PPT信息
    """
    svc = get_share_link_service()
    result = svc.verify_share_access(share_code, body.password)
    
    if not result["valid"]:
        if result.get("requires_password"):
            return JSONResponse(
                status_code=401,
                content={
                    "valid": False,
                    "error": result["error"],
                    "requires_password": True,
                }
            )
        raise HTTPException(status_code=400, detail=result["error"])
    
    return {
        "valid": True,
        "ppt_id": result["ppt_id"],
        "permission": result["link"].permission,
        "requires_password": result["requires_password"],
    }


@router.get("/{share_code}/qr")
async def get_share_qr_code(
    share_code: str,
):
    """
    获取分享二维码 (公开接口)
    
    返回二维码图片Base64数据
    """
    svc = get_share_link_service()
    link = svc.get_by_code(share_code)
    
    if not link:
        raise HTTPException(status_code=404, detail="分享链接不存在")
    
    if not link.is_active or link.is_expired():
        raise HTTPException(status_code=410, detail="分享链接已失效或过期")
    
    if not link.qr_code_data:
        raise HTTPException(status_code=404, detail="二维码不存在")
    
    return {
        "share_code": share_code,
        "qr_code_data": link.qr_code_data,
        "share_url": f"/share/{share_code}",
    }


@router.get("")
async def list_my_share_links(
    user: User = Depends(get_current_user),
):
    """列出当前用户的所有分享链接"""
    svc = get_share_link_service()
    links = svc.list_user_links(user.user_id)
    
    return {
        "success": True,
        "count": len(links),
        "share_links": [
            {
                "share_id": link.share_id,
                "share_code": link.share_code,
                "share_url": f"/share/{link.share_code}",
                "ppt_id": link.ppt_id,
                "ppt_title": link.ppt_title,
                "permission": link.permission,
                "created_at": link.created_at,
                "expires_at": link.expires_at,
                "access_count": link.access_count,
                "is_active": link.is_active,
                "is_expired": link.is_expired(),
                "has_password": bool(link.password),
            }
            for link in sorted(links, key=lambda x: x.created_at, reverse=True)
        ],
    }


@router.put("/{share_id}")
async def update_share_link(
    share_id: str,
    req: ShareLinkUpdate,
    user: User = Depends(get_current_user),
):
    """更新分享链接设置"""
    svc = get_share_link_service()
    
    # 验证权限级别
    if req.permission is not None:
        valid_permissions = [p.value for p in SharePermission]
        if req.permission not in valid_permissions:
            raise HTTPException(status_code=400, detail=f"无效的权限级别")
    
    link = svc.update_link(
        share_id=share_id,
        owner_id=user.user_id,
        expires_in_hours=req.expires_in_hours,
        permission=req.permission,
        password=req.password,
    )
    
    if not link:
        raise HTTPException(status_code=404, detail="分享链接不存在或无权限")
    
    return {
        "success": True,
        "share_id": link.share_id,
        "share_code": link.share_code,
        "expires_at": link.expires_at,
        "permission": link.permission,
        "has_password": bool(link.password),
    }


@router.delete("/{share_id}")
async def delete_share_link(
    share_id: str,
    user: User = Depends(get_current_user),
):
    """删除分享链接"""
    svc = get_share_link_service()
    success = svc.delete_link(share_id, user.user_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="分享链接不存在或无权限")
    
    return {"success": True}


@router.post("/{share_id}/deactivate")
async def deactivate_share_link(
    share_id: str,
    user: User = Depends(get_current_user),
):
    """禁用分享链接"""
    svc = get_share_link_service()
    success = svc.deactivate_link(share_id, user.user_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="分享链接不存在或无权限")
    
    return {"success": True}


@router.get("/{share_id}/analytics")
async def get_share_analytics(
    share_id: str,
    user: User = Depends(get_current_user),
):
    """获取分享链接统计"""
    svc = get_share_link_service()
    analytics = svc.get_link_analytics(share_id, user.user_id)
    
    if not analytics:
        raise HTTPException(status_code=404, detail="分享链接不存在或无权限")
    
    return {"success": True, **analytics}
