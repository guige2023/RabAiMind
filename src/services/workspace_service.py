# -*- coding: utf-8 -*-
"""
团队工作空间服务

R79: Multi-brand & Workspace Management
- 多品牌 Profile 管理
- 团队工作空间 + 角色权限
- 品牌包导出/导入
- 团队模板库
- 用量配额
"""

import json
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, asdict, field

WORKSPACE_DIR = Path(__file__).parent.parent / "data" / "workspaces"
WORKSPACE_DIR.mkdir(parents=True, exist_ok=True)

BRAND_PROFILES_DIR = Path(__file__).parent.parent / "data" / "brand_profiles"
BRAND_PROFILES_DIR.mkdir(parents=True, exist_ok=True)

TEAM_TEMPLATES_DIR = Path(__file__).parent.parent / "data" / "team_templates"
TEAM_TEMPLATES_DIR.mkdir(parents=True, exist_ok=True)


# ===== 数据模型 =====

@dataclass
class WorkspaceMember:
    id: str
    name: str
    email: str
    role: str = "editor"  # owner | editor | viewer | commenter
    avatar: str = ""
    joined_at: str = ""
    last_active_at: str = ""
    status: str = "online"  # online | away | offline
    color: str = "#165DFF"

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class WorkspaceInvitation:
    id: str
    email: str
    role: str = "editor"
    invited_by: str = ""
    invited_at: str = ""
    status: str = "pending"  # pending | accepted | declined
    expires_at: str = ""

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class Workspace:
    id: str
    name: str
    description: str = ""
    owner_id: str = "default"
    members: List[WorkspaceMember] = field(default_factory=list)
    invitations: List[WorkspaceInvitation] = field(default_factory=list)
    is_public: bool = False
    created_at: str = ""
    updated_at: str = ""
    # 配额配置
    quotas: Dict[str, Any] = field(default_factory=lambda: {
        "ppt_generations": {"limit": 100, "period": "monthly"},
        "storage_mb": {"limit": 500, "period": "monthly"},
        "members": {"limit": 10, "period": "constant"},
        "templates": {"limit": 50, "period": "constant"},
    })
    # 已用配额
    usage: Dict[str, int] = field(default_factory=lambda: {
        "ppt_generations": 0,
        "storage_mb": 0,
    })

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "owner_id": self.owner_id,
            "members": [m.to_dict() for m in self.members],
            "invitations": [i.to_dict() for i in self.invitations],
            "is_public": self.is_public,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "quotas": self.quotas,
            "usage": self.usage,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "Workspace":
        members = [WorkspaceMember(**m) for m in data.get("members", [])]
        invitations = [WorkspaceInvitation(**i) for i in data.get("invitations", [])]
        return cls(
            id=data["id"],
            name=data["name"],
            description=data.get("description", ""),
            owner_id=data.get("owner_id", "default"),
            members=members,
            invitations=invitations,
            is_public=data.get("is_public", False),
            created_at=data.get("created_at", ""),
            updated_at=data.get("updated_at", ""),
            quotas=data.get("quotas", {}),
            usage=data.get("usage", {}),
        )


@dataclass
class BrandProfile:
    profile_id: str
    workspace_id: str
    user_id: str
    profile_name: str
    profile_type: str = "personal"  # personal | company
    brand_name: str = ""
    primary_color: str = "#165DFF"
    secondary_color: str = "#0E42D2"
    accent_color: str = "#FF9500"
    fonts: List[str] = field(default_factory=lambda: ["思源黑体", "Arial"])
    logo_url: str = ""
    slogan: str = ""
    logo_data: str = ""
    logo_position: str = "bottom-right"
    powered_by_toggle: bool = True
    footer_text: str = ""
    white_label_mode: bool = False
    auto_color_detection: bool = False
    created_at: str = ""
    updated_at: str = ""

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict) -> "BrandProfile":
        return cls(**data)


@dataclass
class QuotaInfo:
    workspace_id: str
    quotas: Dict[str, Any] = field(default_factory=dict)
    usage: Dict[str, int] = field(default_factory=dict)
    reset_at: str = ""


# ===== 头像颜色 =====

AVATAR_COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
]

def _get_avatar_color(name: str) -> str:
    h = sum(ord(c) for c in name)
    return AVATAR_COLORS[h % len(AVATAR_COLORS)]


# ===== Workspace Service =====

class WorkspaceService:
    def __init__(self):
        self.workspaces_dir = WORKSPACE_DIR
        self.brand_profiles_dir = BRAND_PROFILES_DIR
        self.team_templates_dir = TEAM_TEMPLATES_DIR

    # ===== 工作空间 =====

    def _workspace_file(self, workspace_id: str) -> Path:
        return self.workspaces_dir / f"{workspace_id}.json"

    def _brand_file(self, workspace_id: str) -> Path:
        return self.brand_profiles_dir / f"{workspace_id}_profiles.json"

    def _team_templates_file(self, workspace_id: str) -> Path:
        return self.team_templates_dir / f"{workspace_id}_templates.json"

    def list_workspaces(self, user_id: str) -> List[Workspace]:
        """列出用户所有工作空间"""
        workspaces = []
        if not self.workspaces_dir.exists():
            return workspaces
        for f in self.workspaces_dir.glob("*.json"):
            try:
                data = json.loads(f.read_text())
                ws = Workspace.from_dict(data)
                # 包含自己是成员或创建者的工作空间
                if ws.owner_id == user_id or any(m.id == user_id or m.email == user_id for m in ws.members):
                    workspaces.append(ws)
            except Exception:
                continue
        return workspaces

    def create_workspace(self, name: str, owner_id: str = "default", description: str = "") -> Workspace:
        """创建工作空间"""
        now = datetime.now().isoformat()
        owner = WorkspaceMember(
            id=owner_id,
            name="Owner",
            email=f"{owner_id}@example.com",
            role="owner",
            joined_at=now,
            last_active_at=now,
            status="online",
            color="#165DFF"
        )
        ws = Workspace(
            id=f"ws_{uuid.uuid4().hex[:12]}",
            name=name,
            description=description,
            owner_id=owner_id,
            members=[owner],
            invitations=[],
            created_at=now,
            updated_at=now,
        )
        self._save_workspace(ws)
        return ws

    def get_workspace(self, workspace_id: str) -> Optional[Workspace]:
        f = self._workspace_file(workspace_id)
        if not f.exists():
            return None
        return Workspace.from_dict(json.loads(f.read_text()))

    def update_workspace(self, workspace_id: str, name=None, description=None, is_public=None) -> Optional[Workspace]:
        ws = self.get_workspace(workspace_id)
        if not ws:
            return None
        if name is not None:
            ws.name = name
        if description is not None:
            ws.description = description
        if is_public is not None:
            ws.is_public = is_public
        ws.updated_at = datetime.now().isoformat()
        self._save_workspace(ws)
        return ws

    def delete_workspace(self, workspace_id: str, user_id: str) -> bool:
        ws = self.get_workspace(workspace_id)
        if not ws or ws.owner_id != user_id:
            return False
        f = self._workspace_file(workspace_id)
        if f.exists():
            f.unlink()
        return True

    def _save_workspace(self, ws: Workspace):
        self.workspaces_dir.mkdir(parents=True, exist_ok=True)
        self._workspace_file(ws.id).write_text(
            json.dumps(ws.to_dict(), ensure_ascii=False, indent=2)
        )

    # ===== 成员管理 =====

    def invite_member(self, workspace_id: str, email: str, role: str) -> Optional[WorkspaceInvitation]:
        ws = self.get_workspace(workspace_id)
        if not ws:
            return None
        inv = WorkspaceInvitation(
            id=f"inv_{uuid.uuid4().hex[:8]}",
            email=email,
            role=role,
            invited_by=ws.owner_id,
            invited_at=datetime.now().isoformat(),
            status="pending",
            expires_at=(datetime.now() + timedelta(days=7)).isoformat()
        )
        ws.invitations.append(inv)
        ws.updated_at = datetime.now().isoformat()
        self._save_workspace(ws)
        return inv

    def remove_member(self, workspace_id: str, member_id: str) -> bool:
        ws = self.get_workspace(workspace_id)
        if not ws:
            return False
        if ws.owner_id == member_id:
            return False  # 不能删除 owner
        ws.members = [m for m in ws.members if m.id != member_id]
        ws.updated_at = datetime.now().isoformat()
        self._save_workspace(ws)
        return True

    def update_member_role(self, workspace_id: str, member_id: str, role: str) -> bool:
        ws = self.get_workspace(workspace_id)
        if not ws:
            return False
        for m in ws.members:
            if m.id == member_id and m.role != "owner":
                m.role = role
                ws.updated_at = datetime.now().isoformat()
                self._save_workspace(ws)
                return True
        return False

    # ===== 品牌 Profile =====

    def list_brand_profiles(self, workspace_id: str) -> List[BrandProfile]:
        f = self._brand_file(workspace_id)
        if not f.exists():
            return []
        try:
            data = json.loads(f.read_text())
            return [BrandProfile.from_dict(p) for p in data]
        except Exception:
            return []

    def save_brand_profile(self, workspace_id: str, profile_id: str, user_id: str,
                           profile_name: str, profile_type: str, brand_data: dict) -> BrandProfile:
        """保存品牌配置（新建或更新）"""
        profiles = self.list_brand_profiles(workspace_id)
        
        if profile_id:
            # 更新
            for p in profiles:
                if p.profile_id == profile_id:
                    for k, v in brand_data.items():
                        if hasattr(p, k) and k not in ("profile_id", "workspace_id"):
                            setattr(p, k, v)
                    p.updated_at = datetime.now().isoformat()
                    self._save_brand_profiles(workspace_id, profiles)
                    return p
            # 没找到，新建
            profile_id = None

        # 新建
        now = datetime.now().isoformat()
        profile = BrandProfile(
            profile_id=profile_id or f"bp_{uuid.uuid4().hex[:10]}",
            workspace_id=workspace_id,
            user_id=user_id,
            profile_name=profile_name,
            profile_type=profile_type,
            brand_name=brand_data.get("brand_name", ""),
            primary_color=brand_data.get("primary_color", "#165DFF"),
            secondary_color=brand_data.get("secondary_color", "#0E42D2"),
            accent_color=brand_data.get("accent_color", "#FF9500"),
            fonts=brand_data.get("fonts", ["思源黑体", "Arial"]),
            logo_url=brand_data.get("logo_url", ""),
            slogan=brand_data.get("slogan", ""),
            logo_data=brand_data.get("logo_data", ""),
            logo_position=brand_data.get("logo_position", "bottom-right"),
            powered_by_toggle=brand_data.get("powered_by_toggle", True),
            footer_text=brand_data.get("footer_text", ""),
            white_label_mode=brand_data.get("white_label_mode", False),
            auto_color_detection=brand_data.get("auto_color_detection", False),
            created_at=now,
            updated_at=now,
        )
        profiles.append(profile)
        self._save_brand_profiles(workspace_id, profiles)
        return profile

    def delete_brand_profile(self, workspace_id: str, profile_id: str) -> bool:
        profiles = self.list_brand_profiles(workspace_id)
        before = len(profiles)
        profiles = [p for p in profiles if p.profile_id != profile_id]
        if len(profiles) < before:
            self._save_brand_profiles(workspace_id, profiles)
            return True
        return False

    def _save_brand_profiles(self, workspace_id: str, profiles: List[BrandProfile]):
        self.brand_profiles_dir.mkdir(parents=True, exist_ok=True)
        self._brand_file(workspace_id).write_text(
            json.dumps([p.to_dict() for p in profiles], ensure_ascii=False, indent=2)
        )

    # ===== 品牌包导出/导入 =====

    def export_brand_kit(self, workspace_id: str, profile_id: str) -> Optional[Dict[str, Any]]:
        profiles = self.list_brand_profiles(workspace_id)
        for p in profiles:
            if p.profile_id == profile_id:
                return {
                    "version": "1.0",
                    "exported_at": datetime.now().isoformat(),
                    "profile": p.to_dict()
                }
        return None

    def import_brand_kit(self, workspace_id: str, brand_kit: Dict[str, Any]) -> Optional[BrandProfile]:
        try:
            if "profile" not in brand_kit:
                return None
            pdata = brand_kit["profile"]
            pdata["workspace_id"] = workspace_id
            pdata["profile_id"] = f"bp_{uuid.uuid4().hex[:10]}"
            pdata["created_at"] = datetime.now().isoformat()
            pdata["updated_at"] = datetime.now().isoformat()
            profile = BrandProfile.from_dict(pdata)
            profiles = self.list_brand_profiles(workspace_id)
            profiles.append(profile)
            self._save_brand_profiles(workspace_id, profiles)
            return profile
        except Exception:
            return None

    # ===== 团队模板 =====

    def list_team_templates(self, workspace_id: str, user_id: str) -> List[Dict[str, Any]]:
        f = self._team_templates_file(workspace_id)
        if not f.exists():
            return []
        try:
            return json.loads(f.read_text())
        except Exception:
            return []

    def share_template_to_team(self, workspace_id: str, template_id: str, user_id: str) -> bool:
        """将用户模板分享到团队"""
        from .template_manager import get_template_manager
        tm = get_template_manager()
        user_templates = tm.get_user_templates(user_id)
        
        template = None
        for t in user_templates:
            if t.get("id") == template_id:
                template = dict(t)
                break
        
        if not template:
            return False

        # 标记为团队模板
        template["shared_by"] = user_id
        template["shared_at"] = datetime.now().isoformat()
        template["visibility"] = "workspace"
        
        templates = self.list_team_templates(workspace_id, user_id)
        # 避免重复分享
        if not any(t.get("id") == template_id for t in templates):
            templates.append(template)
            self.team_templates_dir.mkdir(parents=True, exist_ok=True)
            self._team_templates_file(workspace_id).write_text(
                json.dumps(templates, ensure_ascii=False, indent=2)
            )
        return True

    def unshare_template_from_team(self, workspace_id: str, template_id: str) -> bool:
        templates = self.list_team_templates(workspace_id, "")
        before = len(templates)
        templates = [t for t in templates if t.get("id") != template_id]
        if len(templates) < before:
            self._team_templates_file(workspace_id).write_text(
                json.dumps(templates, ensure_ascii=False, indent=2)
            )
            return True
        return False

    # ===== 配额 =====

    def get_quotas(self, workspace_id: str) -> QuotaInfo:
        ws = self.get_workspace(workspace_id)
        if not ws:
            return QuotaInfo(workspace_id=workspace_id)
        reset_at = (datetime.now() + timedelta(days=30)).isoformat()
        return QuotaInfo(
            workspace_id=workspace_id,
            quotas=ws.quotas,
            usage=ws.usage,
            reset_at=reset_at
        )

    def increment_quota(self, workspace_id: str, quota_type: str, amount: int = 1) -> bool:
        ws = self.get_workspace(workspace_id)
        if not ws:
            return False
        if quota_type not in ws.usage:
            ws.usage[quota_type] = 0
        ws.usage[quota_type] = ws.usage.get(quota_type, 0) + amount
        self._save_workspace(ws)
        return True

    def reset_quotas(self, workspace_id: str, quota_type: str = "all") -> bool:
        ws = self.get_workspace(workspace_id)
        if not ws:
            return False
        if quota_type == "all":
            ws.usage = {k: 0 for k in ws.usage}
        elif quota_type in ws.usage:
            ws.usage[quota_type] = 0
        self._save_workspace(ws)
        return True


# ===== 全局单例 =====

_workspace_service = None

def get_workspace_service() -> WorkspaceService:
    global _workspace_service
    if _workspace_service is None:
        _workspace_service = WorkspaceService()
    return _workspace_service
