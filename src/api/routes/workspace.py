"""
团队工作空间 API 路由

R79: Multi-brand & Workspace Management
- 多品牌切换（个人/公司主题）
- 团队工作空间（角色权限）
- 品牌包导出/导入
- 团队模板库
- 用量配额
"""

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ...services.workspace_service import get_workspace_service

router = APIRouter(prefix="/api/v1/workspace", tags=["workspace"])


# ===== 品牌 Profile 模型 =====

class BrandProfileSaveRequest(BaseModel):
    profile_id: str | None = None
    user_id: str = "default"
    profile_name: str = ""
    profile_type: str = "personal"  # personal | company
    brand_name: str = ""
    primary_color: str = "#165DFF"
    secondary_color: str = "#0E42D2"
    accent_color: str = "#FF9500"
    fonts: list[str] | None = None
    logo_url: str = ""
    slogan: str = ""
    logo_data: str = ""
    logo_position: str = "bottom-right"
    powered_by_toggle: bool = True
    footer_text: str = ""
    white_label_mode: bool = False
    auto_color_detection: bool = False


class BrandKitExportResponse(BaseModel):
    success: bool
    brand_kit: dict[str, Any] = {}
    message: str = ""


class BrandKitImportRequest(BaseModel):
    brand_kit: dict[str, Any]
    target_workspace_id: str | None = None


# ===== 配额模型 =====

class QuotaInfoResponse(BaseModel):
    success: bool
    workspace_id: str
    quotas: dict[str, Any] = {}
    usage: dict[str, Any] = {}
    reset_at: str = ""


class QuotaResetRequest(BaseModel):
    workspace_id: str
    quota_type: str  # ppt_generations | storage | members


# ===== Workspace CRUD =====

class WorkspaceCreateRequest(BaseModel):
    name: str
    description: str = ""
    owner_id: str = "default"


class WorkspaceUpdateRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    is_public: bool | None = None


class MemberInviteRequest(BaseModel):
    email: str
    role: str = "editor"  # editor | viewer | commenter


class MemberRoleUpdateRequest(BaseModel):
    role: str  # editor | viewer | commenter


# ===== 路由实现 =====

@router.get("/list")
async def list_workspaces(user_id: str = "default"):
    """获取用户所有工作空间"""
    ws = get_workspace_service()
    spaces = ws.list_workspaces(user_id)
    return {"success": True, "workspaces": [s.to_dict() for s in spaces]}


@router.post("/create")
async def create_workspace(req: WorkspaceCreateRequest):
    """创建新的工作空间"""
    ws = get_workspace_service()
    workspace = ws.create_workspace(
        name=req.name,
        owner_id=req.owner_id,
        description=req.description
    )
    return {"success": True, "workspace": workspace.to_dict()}


@router.get("/{workspace_id}")
async def get_workspace(workspace_id: str):
    """获取工作空间详情"""
    ws = get_workspace_service()
    workspace = ws.get_workspace(workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="工作空间不存在")
    return {"success": True, "workspace": workspace.to_dict()}


@router.put("/{workspace_id}")
async def update_workspace(workspace_id: str, req: WorkspaceUpdateRequest):
    """更新工作空间信息"""
    ws = get_workspace_service()
    workspace = ws.update_workspace(
        workspace_id,
        name=req.name,
        description=req.description,
        is_public=req.is_public
    )
    if not workspace:
        raise HTTPException(status_code=404, detail="工作空间不存在")
    return {"success": True, "workspace": workspace.to_dict()}


@router.delete("/{workspace_id}")
async def delete_workspace(workspace_id: str, user_id: str = "default"):
    """删除工作空间"""
    ws = get_workspace_service()
    result = ws.delete_workspace(workspace_id, user_id)
    return {"success": result, "message": "已删除工作空间" if result else "无权限或不存在"}


# ===== 成员管理 =====

@router.post("/{workspace_id}/members")
async def invite_member(workspace_id: str, req: MemberInviteRequest):
    """邀请成员加入工作空间"""
    ws = get_workspace_service()
    invitation = ws.invite_member(workspace_id, req.email, req.role)
    if not invitation:
        raise HTTPException(status_code=404, detail="工作空间不存在")
    return {"success": True, "invitation": invitation}


@router.get("/{workspace_id}/members")
async def list_members(workspace_id: str):
    """获取工作空间成员列表"""
    ws = get_workspace_service()
    workspace = ws.get_workspace(workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="工作空间不存在")
    return {"success": True, "members": workspace.members}


@router.delete("/{workspace_id}/members/{member_id}")
async def remove_member(workspace_id: str, member_id: str):
    """移除成员"""
    ws = get_workspace_service()
    result = ws.remove_member(workspace_id, member_id)
    return {"success": result}


@router.put("/{workspace_id}/members/{member_id}/role")
async def update_member_role(workspace_id: str, member_id: str, req: MemberRoleUpdateRequest):
    """更新成员角色"""
    ws = get_workspace_service()
    result = ws.update_member_role(workspace_id, member_id, req.role)
    return {"success": result}


# ===== 品牌 Profile =====

@router.get("/{workspace_id}/brands")
async def list_brand_profiles(workspace_id: str):
    """获取工作空间下所有品牌配置"""
    ws = get_workspace_service()
    brands = ws.list_brand_profiles(workspace_id)
    return {"success": True, "brands": [b.to_dict() for b in brands]}


@router.post("/{workspace_id}/brands")
async def save_brand_profile(workspace_id: str, req: BrandProfileSaveRequest):
    """保存品牌配置"""
    ws = get_workspace_service()
    profile = ws.save_brand_profile(
        workspace_id=workspace_id,
        profile_id=req.profile_id,
        user_id=req.user_id,
        profile_name=req.profile_name,
        profile_type=req.profile_type,
        brand_data=req.model_dump()
    )
    return {"success": True, "profile": profile.to_dict()}


@router.delete("/{workspace_id}/brands/{profile_id}")
async def delete_brand_profile(workspace_id: str, profile_id: str):
    """删除品牌配置"""
    ws = get_workspace_service()
    result = ws.delete_brand_profile(workspace_id, profile_id)
    return {"success": result}


@router.post("/{workspace_id}/brands/export")
async def export_brand_kit(workspace_id: str, profile_id: str):
    """导出品牌包（Brand Kit）"""
    ws = get_workspace_service()
    kit = ws.export_brand_kit(workspace_id, profile_id)
    if not kit:
        raise HTTPException(status_code=404, detail="品牌配置不存在")
    return {"success": True, "brand_kit": kit, "message": "品牌包导出成功"}


@router.post("/{workspace_id}/brands/import")
async def import_brand_kit(workspace_id: str, req: BrandKitImportRequest):
    """导入品牌包"""
    ws = get_workspace_service()
    profile = ws.import_brand_kit(workspace_id, req.brand_kit)
    if not profile:
        return {"success": False, "message": "品牌包格式无效"}
    return {"success": True, "profile": profile.to_dict(), "message": "品牌包导入成功"}


# ===== 团队模板库 =====

@router.get("/{workspace_id}/templates")
async def list_team_templates(workspace_id: str, user_id: str = "default"):
    """获取团队模板"""
    ws = get_workspace_service()
    templates = ws.list_team_templates(workspace_id, user_id)
    return {"success": True, "templates": templates}


@router.post("/{workspace_id}/templates/{template_id}/share")
async def share_template_to_team(workspace_id: str, template_id: str, user_id: str = "default"):
    """将模板分享到团队"""
    ws = get_workspace_service()
    result = ws.share_template_to_team(workspace_id, template_id, user_id)
    return {"success": result, "message": "模板已分享到团队" if result else "模板不存在"}


@router.delete("/{workspace_id}/templates/{template_id}/share")
async def unshare_template_from_team(workspace_id: str, template_id: str):
    """从团队取消分享模板"""
    ws = get_workspace_service()
    result = ws.unshare_template_from_team(workspace_id, template_id)
    return {"success": result}


# ===== 用量配额 =====

@router.get("/{workspace_id}/quotas")
async def get_workspace_quotas(workspace_id: str):
    """获取工作空间配额信息"""
    ws = get_workspace_service()
    quotas = ws.get_quotas(workspace_id)
    return {
        "success": True,
        "workspace_id": workspace_id,
        "quotas": quotas.quotas,
        "usage": quotas.usage,
        "reset_at": quotas.reset_at
    }


@router.post("/{workspace_id}/quotas/increment")
async def increment_quota(workspace_id: str, quota_type: str, amount: int = 1):
    """增加用量（内部接口，PPT生成时调用）"""
    ws = get_workspace_service()
    result = ws.increment_quota(workspace_id, quota_type, amount)
    return {"success": result}


@router.post("/{workspace_id}/quotas/reset")
async def reset_quota(workspace_id: str, quota_type: str = "all"):
    """重置配额（仅管理员）"""
    ws = get_workspace_service()
    result = ws.reset_quotas(workspace_id, quota_type)
    return {"success": result}
