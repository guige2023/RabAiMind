# -*- coding: utf-8 -*-
"""
Sharing Service — Access Requests, Folders, Share Permissions & Sharing Analytics

R126: Presentation Sharing & Permissions
- Share link generator with custom permissions
- Team workspaces with shared presentations
- Presentation groups/folders for organization
- Access request workflow
- Sharing analytics - who's accessed shared links
"""

import json
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, asdict, field
from enum import Enum

SHARING_DIR = Path(__file__).parent.parent / "data" / "sharing"
SHARING_DIR.mkdir(parents=True, exist_ok=True)


class SharePermission(str, Enum):
    VIEW = "view"          # View only
    COMMENT = "comment"    # View + comment
    EDIT = "edit"          # View + edit
    DOWNLOAD = "download"  # View + download PPTX
    FULL = "full"          # All permissions


class AccessRequestStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    EXPIRED = "expired"


@dataclass
class SharePermissionGrant:
    share_id: str
    grantee_email: str
    permission: str = SharePermission.VIEW.value
    granted_by: str = ""
    granted_at: str = ""

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, d: dict) -> "SharePermissionGrant":
        return cls(**d)


@dataclass
class AccessRequest:
    id: str
    requester_id: str
    requester_email: str
    requester_name: str
    resource_type: str  # "ppt" | "workspace"
    resource_id: str
    resource_name: str
    permission_requested: str  # SharePermission value
    status: str = AccessRequestStatus.PENDING.value
    message: str = ""  # Optional message from requester
    owner_id: str = ""
    created_at: str = ""
    updated_at: str = ""
    expires_at: str = ""
    processed_by: str = ""
    processed_at: str = ""
    reject_reason: str = ""

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, d: dict) -> "AccessRequest":
        return cls(**d)


@dataclass
class ShareAccessLog:
    share_id: str
    access_time: str
    viewer_email: str = ""
    viewer_name: str = ""
    viewer_ip: str = ""
    viewer_user_agent: str = ""
    permission_used: str = ""
    device_type: str = ""  # desktop, mobile, tablet
    country: str = ""
    city: str = ""
    accessed_via: str = ""  # direct_link, email, social, qr_code

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, d: dict) -> "ShareAccessLog":
        return cls(**d)


@dataclass
class PresentationFolder:
    id: str
    workspace_id: str
    name: str
    parent_id: str = ""  # "" for root level
    ppt_ids: List[str] = field(default_factory=list)
    color: str = "#165DFF"
    icon: str = "📁"
    is_shared: bool = False
    shared_with: List[str] = field(default_factory=list)  # emails
    created_by: str = "default"
    created_at: str = ""
    updated_at: str = ""
    sort_order: int = 0

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, d: dict) -> "PresentationFolder":
        return cls(**d)


# ===== Storage =====

def _sharing_file(name: str) -> Path:
    return SHARING_DIR / f"{name}.json"


def _load_json(name: str) -> Dict[str, Any]:
    f = _sharing_file(name)
    if not f.exists():
        return {}
    try:
        return json.loads(f.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, FileNotFoundError):
        return {}


def _save_json(name: str, data: Dict):
    f = _sharing_dir = SHARING_DIR / f"{name}.json"
    f.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


# ===== Access Request Service =====

class AccessRequestService:
    """Manages access requests for presentations and workspaces"""

    def __init__(self):
        self.storage_key = "access_requests"

    def _requests_file(self) -> Path:
        return _sharing_file(self.storage_key)

    def _load_requests(self) -> List[AccessRequest]:
        f = self._requests_file()
        if not f.exists():
            return []
        try:
            data = json.loads(f.read_text(encoding="utf-8"))
            return [AccessRequest.from_dict(r) for r in data]
        except Exception:
            return []

    def _save_requests(self, requests: List[AccessRequest]):
        self._sharing_dir = SHARING_DIR
        self._sharing_dir.mkdir(parents=True, exist_ok=True)
        self._requests_file().write_text(
            json.dumps([r.to_dict() for r in requests], ensure_ascii=False, indent=2),
            encoding="utf-8"
        )

    def create_request(
        self,
        requester_id: str,
        requester_email: str,
        requester_name: str,
        resource_type: str,
        resource_id: str,
        resource_name: str,
        permission_requested: str,
        owner_id: str,
        message: str = "",
    ) -> AccessRequest:
        """Create a new access request"""
        now = datetime.now().isoformat()
        req = AccessRequest(
            id=f"ar_{uuid.uuid4().hex[:12]}",
            requester_id=requester_id,
            requester_email=requester_email,
            requester_name=requester_name,
            resource_type=resource_type,
            resource_id=resource_id,
            resource_name=resource_name,
            permission_requested=permission_requested,
            status=AccessRequestStatus.PENDING.value,
            message=message,
            owner_id=owner_id,
            created_at=now,
            updated_at=now,
            expires_at=(datetime.now() + timedelta(days=7)).isoformat(),
        )
        requests = self._load_requests()
        requests.append(req)
        self._save_requests(requests)
        return req

    def get_request(self, request_id: str) -> Optional[AccessRequest]:
        requests = self._load_requests()
        for r in requests:
            if r.id == request_id:
                return r
        return None

    def list_requests_for_owner(self, owner_id: str, status: str = "") -> List[AccessRequest]:
        """List all access requests for a resource owner"""
        requests = self._load_requests()
        result = [r for r in requests if r.owner_id == owner_id]
        if status:
            result = [r for r in result if r.status == status]
        return sorted(result, key=lambda r: r.created_at, reverse=True)

    def list_requests_for_requester(self, requester_id: str) -> List[AccessRequest]:
        """List all access requests made by a user"""
        requests = self._load_requests()
        return sorted(
            [r for r in requests if r.requester_id == requester_id],
            key=lambda r: r.created_at, reverse=True
        )

    def list_requests_for_resource(self, resource_type: str, resource_id: str) -> List[AccessRequest]:
        """List all requests for a specific resource (for workspace context)"""
        requests = self._load_requests()
        return sorted(
            [r for r in requests if r.resource_type == resource_type and r.resource_id == resource_id],
            key=lambda r: r.created_at, reverse=True
        )

    def approve_request(self, request_id: str, approver_id: str) -> Optional[AccessRequest]:
        """Approve an access request"""
        requests = self._load_requests()
        for r in requests:
            if r.id == request_id and r.status == AccessRequestStatus.PENDING.value:
                r.status = AccessRequestStatus.APPROVED.value
                r.processed_by = approver_id
                r.processed_at = datetime.now().isoformat()
                r.updated_at = datetime.now().isoformat()
                self._save_requests(requests)
                return r
        return None

    def reject_request(self, request_id: str, rejecter_id: str, reason: str = "") -> Optional[AccessRequest]:
        """Reject an access request"""
        requests = self._load_requests()
        for r in requests:
            if r.id == request_id and r.status == AccessRequestStatus.PENDING.value:
                r.status = AccessRequestStatus.REJECTED.value
                r.processed_by = rejecter_id
                r.processed_at = datetime.now().isoformat()
                r.updated_at = datetime.now().isoformat()
                r.reject_reason = reason
                self._save_requests(requests)
                return r
        return None

    def cancel_request(self, request_id: str, requester_id: str) -> bool:
        """Cancel a pending access request (by requester)"""
        requests = self._load_requests()
        for r in requests:
            if r.id == request_id and r.requester_id == requester_id and r.status == AccessRequestStatus.PENDING.value:
                requests.remove(r)
                self._save_requests(requests)
                return True
        return False

    def pending_count(self, owner_id: str) -> int:
        """Count pending requests for an owner"""
        requests = self._load_requests()
        return sum(1 for r in requests if r.owner_id == owner_id and r.status == AccessRequestStatus.PENDING.value)


# ===== Folder Service =====

class FolderService:
    """Manages presentation folders/groups"""

    def __init__(self):
        self.storage_key = "presentation_folders"

    def _folders_file(self) -> Path:
        return _sharing_file(self.storage_key)

    def _load_folders(self) -> List[PresentationFolder]:
        f = self._folders_file()
        if not f.exists():
            return []
        try:
            data = json.loads(f.read_text(encoding="utf-8"))
            return [PresentationFolder.from_dict(d) for d in data]
        except Exception:
            return []

    def _save_folders(self, folders: List[PresentationFolder]):
        SHARING_DIR.mkdir(parents=True, exist_ok=True)
        self._folders_file().write_text(
            json.dumps([fo.to_dict() for fo in folders], ensure_ascii=False, indent=2),
            encoding="utf-8"
        )

    def create_folder(
        self,
        workspace_id: str,
        name: str,
        created_by: str = "default",
        parent_id: str = "",
        color: str = "#165DFF",
        icon: str = "📁",
    ) -> PresentationFolder:
        """Create a new folder"""
        now = datetime.now().isoformat()
        folder = PresentationFolder(
            id=f"fld_{uuid.uuid4().hex[:10]}",
            workspace_id=workspace_id,
            name=name,
            parent_id=parent_id,
            color=color,
            icon=icon,
            created_by=created_by,
            created_at=now,
            updated_at=now,
        )
        folders = self._load_folders()
        folders.append(folder)
        self._save_folders(folders)
        return folder

    def get_folder(self, folder_id: str) -> Optional[PresentationFolder]:
        folders = self._load_folders()
        for f in folders:
            if f.id == folder_id:
                return f
        return None

    def list_folders(self, workspace_id: str, parent_id: str = "") -> List[PresentationFolder]:
        """List folders in a workspace, optionally filtered by parent"""
        folders = self._load_folders()
        return sorted(
            [f for f in folders if f.workspace_id == workspace_id and f.parent_id == parent_id],
            key=lambda f: f.sort_order
        )

    def update_folder(
        self,
        folder_id: str,
        name: str = None,
        parent_id: str = None,
        color: str = None,
        icon: str = None,
        sort_order: int = None,
    ) -> Optional[PresentationFolder]:
        """Update a folder"""
        folders = self._load_folders()
        for f in folders:
            if f.id == folder_id:
                if name is not None:
                    f.name = name
                if parent_id is not None:
                    f.parent_id = parent_id
                if color is not None:
                    f.color = color
                if icon is not None:
                    f.icon = icon
                if sort_order is not None:
                    f.sort_order = sort_order
                f.updated_at = datetime.now().isoformat()
                self._save_folders(folders)
                return f
        return None

    def delete_folder(self, folder_id: str) -> bool:
        """Delete a folder (does not delete the PPTs inside)"""
        folders = self._load_folders()
        before = len(folders)
        folders = [f for f in folders if f.id != folder_id]
        if len(folders) < before:
            self._save_folders(folders)
            return True
        return False

    def add_ppt_to_folder(self, folder_id: str, ppt_id: str) -> bool:
        """Add a PPT to a folder"""
        folders = self._load_folders()
        for f in folders:
            if f.id == folder_id and ppt_id not in f.ppt_ids:
                f.ppt_ids.append(ppt_id)
                f.updated_at = datetime.now().isoformat()
                self._save_folders(folders)
                return True
        return False

    def remove_ppt_from_folder(self, folder_id: str, ppt_id: str) -> bool:
        """Remove a PPT from a folder"""
        folders = self._load_folders()
        for f in folders:
            if f.id == folder_id:
                if ppt_id in f.ppt_ids:
                    f.ppt_ids.remove(ppt_id)
                    f.updated_at = datetime.now().isoformat()
                    self._save_folders(folders)
                    return True
                return False
        return False

    def move_ppt_to_folder(self, ppt_id: str, from_folder_id: str, to_folder_id: str) -> bool:
        """Move a PPT from one folder to another"""
        self.remove_ppt_from_folder(from_folder_id, ppt_id)
        return self.add_ppt_to_folder(to_folder_id, ppt_id)

    def share_folder(self, folder_id: str, emails: List[str]) -> Optional[PresentationFolder]:
        """Share a folder with specific emails"""
        folders = self._load_folders()
        for f in folders:
            if f.id == folder_id:
                f.shared_with = list(set(f.shared_with + emails))
                f.is_shared = True
                f.updated_at = datetime.now().isoformat()
                self._save_folders(folders)
                return f
        return None

    def unshare_folder(self, folder_id: str, email: str = "") -> Optional[PresentationFolder]:
        """Unshare a folder"""
        folders = self._load_folders()
        for f in folders:
            if f.id == folder_id:
                if email:
                    f.shared_with = [e for e in f.shared_with if e != email]
                    if not f.shared_with:
                        f.is_shared = False
                else:
                    f.shared_with = []
                    f.is_shared = False
                f.updated_at = datetime.now().isoformat()
                self._save_folders(folders)
                return f
        return None

    def get_ppt_folders(self, ppt_id: str) -> List[PresentationFolder]:
        """Get all folders containing a specific PPT"""
        folders = self._load_folders()
        return [f for f in folders if ppt_id in f.ppt_ids]

    def reorder_folders(self, workspace_id: str, folder_ids: List[str]):
        """Reorder folders in a workspace"""
        folders = self._load_folders()
        for i, fid in enumerate(folder_ids):
            for f in folders:
                if f.id == fid and f.workspace_id == workspace_id:
                    f.sort_order = i
        self._save_folders(folders)


# ===== Sharing Analytics Service =====

class SharingAnalyticsService:
    """Tracks and reports who's accessed shared links"""

    def __init__(self):
        self.storage_key = "share_access_logs"

    def _logs_file(self) -> Path:
        return _sharing_file(self.storage_key)

    def _load_logs(self) -> List[ShareAccessLog]:
        f = self._logs_file()
        if not f.exists():
            return []
        try:
            data = json.loads(f.read_text(encoding="utf-8"))
            return [ShareAccessLog.from_dict(d) for d in data]
        except Exception:
            return []

    def _save_logs(self, logs: List[ShareAccessLog]):
        SHARING_DIR.mkdir(parents=True, exist_ok=True)
        # Keep last 50k entries
        if len(logs) > 50_000:
            logs = logs[-50_000:]
        self._logs_file().write_text(
            json.dumps([l.to_dict() for l in logs], ensure_ascii=False, indent=2),
            encoding="utf-8"
        )

    def record_access(
        self,
        share_id: str,
        viewer_email: str = "",
        viewer_name: str = "",
        viewer_ip: str = "",
        viewer_user_agent: str = "",
        permission_used: str = "",
        device_type: str = "desktop",
        country: str = "",
        city: str = "",
        accessed_via: str = "direct_link",
    ) -> ShareAccessLog:
        """Record a share access event"""
        log = ShareAccessLog(
            share_id=share_id,
            access_time=datetime.now().isoformat(),
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
        logs = self._load_logs()
        logs.append(log)
        self._save_logs(logs)
        return log

    def get_share_access_history(self, share_id: str, limit: int = 100) -> List[ShareAccessLog]:
        """Get all access records for a specific share"""
        logs = self._load_logs()
        return sorted(
            [l for l in logs if l.share_id == share_id],
            key=lambda l: l.access_time, reverse=True
        )[:limit]

    def get_sharing_analytics(self, owner_id: str) -> Dict[str, Any]:
        """Get comprehensive sharing analytics for an owner"""
        from ..core.security import get_secure_share_manager

        share_mgr = get_secure_share_manager()
        shares = share_mgr.list_shares(owner_id=owner_id)
        share_ids = [s["share_id"] for s in shares]

        logs = self._load_logs()
        relevant = [l for l in logs if l.share_id in share_ids]

        # Aggregate by share
        by_share: Dict[str, Dict] = {}
        for log in relevant:
            sid = log.share_id
            if sid not in by_share:
                share_info = next((s for s in shares if s["share_id"] == sid), {})
                by_share[sid] = {
                    "share_id": sid,
                    "resource_type": share_info.get("resource_type", ""),
                    "resource_id": share_info.get("resource_id", ""),
                    "total_accesses": 0,
                    "unique_viewers": set(),
                    "recent_accesses": [],
                    "first_access": None,
                    "last_access": None,
                    "by_device": {},
                    "by_country": {},
                    "by_via": {},
                }
            entry = by_share[sid]
            entry["total_accesses"] += 1
            entry["unique_viewers"].add(log.viewer_email or log.viewer_ip or "anonymous")
            entry["recent_accesses"].append(log.to_dict())
            if len(entry["recent_accesses"]) <= 10:
                pass  # already appended
            # Track first/last
            if not entry["first_access"] or log.access_time < entry["first_access"]:
                entry["first_access"] = log.access_time
            if not entry["last_access"] or log.access_time > entry["last_access"]:
                entry["last_access"] = log.access_time
            # By device
            dev = log.device_type or "unknown"
            entry["by_device"][dev] = entry["by_device"].get(dev, 0) + 1
            # By country
            cty = log.country or "Unknown"
            entry["by_country"][cty] = entry["by_country"].get(cty, 0) + 1
            # By via
            via = log.accessed_via or "direct_link"
            entry["by_via"][via] = entry["by_via"].get(via, 0) + 1

        # Build result
        result = []
        for sid, data in by_share.items():
            result.append({
                "share_id": sid,
                "resource_type": data["resource_type"],
                "resource_id": data["resource_id"],
                "total_accesses": data["total_accesses"],
                "unique_viewers": len(data["unique_viewers"]),
                "first_access": data["first_access"],
                "last_access": data["last_access"],
                "recent_accesses": sorted(data["recent_accesses"], key=lambda x: x["access_time"], reverse=True)[:10],
                "by_device": data["by_device"],
                "by_country": data["by_country"],
                "by_via": data["by_via"],
            })

        # Total stats
        total_shares = len(shares)
        active_shares = sum(1 for s in shares if s.get("is_active", True))
        total_accesses = len(relevant)
        unique_viewers = len(set(l.viewer_email or l.viewer_ip for l in relevant if l.viewer_email or l.viewer_ip))

        return {
            "summary": {
                "total_shares": total_shares,
                "active_shares": active_shares,
                "total_accesses": total_accesses,
                "unique_viewers": unique_viewers,
            },
            "by_share": sorted(result, key=lambda x: x["total_accesses"], reverse=True),
        }

    def get_viewer_list(self, share_id: str) -> List[Dict[str, Any]]:
        """Get list of unique viewers for a share with access counts"""
        logs = self._load_logs()
        share_logs = [l for l in logs if l.share_id == share_id]

        viewer_map: Dict[str, Dict] = {}
        for log in share_logs:
            key = log.viewer_email or log.viewer_ip or "anonymous"
            if key not in viewer_map:
                viewer_map[key] = {
                    "viewer_email": log.viewer_email,
                    "viewer_name": log.viewer_name,
                    "viewer_ip": log.viewer_ip,
                    "access_count": 0,
                    "first_access": log.access_time,
                    "last_access": log.access_time,
                    "devices": set(),
                    "countries": set(),
                    "access_vias": set(),
                }
            v = viewer_map[key]
            v["access_count"] += 1
            if log.access_time < v["first_access"]:
                v["first_access"] = log.access_time
            if log.access_time > v["last_access"]:
                v["last_access"] = log.access_time
            if log.device_type:
                v["devices"].add(log.device_type)
            if log.country:
                v["countries"].add(log.country)
            if log.accessed_via:
                v["access_vias"].add(log.accessed_via)

        result = []
        for key, v in viewer_map.items():
            result.append({
                "viewer_email": v["viewer_email"],
                "viewer_name": v["viewer_name"],
                "viewer_ip": v["viewer_ip"],
                "access_count": v["access_count"],
                "first_access": v["first_access"],
                "last_access": v["last_access"],
                "devices": list(v["devices"]),
                "countries": list(v["countries"]),
                "access_vias": list(v["access_vias"]),
            })
        return sorted(result, key=lambda x: x["last_access"], reverse=True)


# ===== Permission Grants Service =====

class PermissionGrantService:
    """Manages per-email permission grants on shares"""

    def __init__(self):
        self.storage_key = "permission_grants"

    def _grants_file(self) -> Path:
        return _sharing_file(self.storage_key)

    def _load_grants(self) -> List[SharePermissionGrant]:
        f = self._grants_file()
        if not f.exists():
            return []
        try:
            data = json.loads(f.read_text(encoding="utf-8"))
            return [SharePermissionGrant.from_dict(d) for d in data]
        except Exception:
            return []

    def _save_grants(self, grants: List[SharePermissionGrant]):
        SHARING_DIR.mkdir(parents=True, exist_ok=True)
        self._grants_file().write_text(
            json.dumps([g.to_dict() for g in grants], ensure_ascii=False, indent=2),
            encoding="utf-8"
        )

    def grant_permission(
        self,
        share_id: str,
        grantee_email: str,
        permission: str,
        granted_by: str = "default",
    ) -> SharePermissionGrant:
        """Grant a specific permission to an email on a share"""
        grants = self._load_grants()
        # Remove existing grant for this share+email combo
        grants = [g for g in grants if not (g.share_id == share_id and g.grantee_email == grantee_email)]
        grant = SharePermissionGrant(
            share_id=share_id,
            grantee_email=grantee_email,
            permission=permission,
            granted_by=granted_by,
            granted_at=datetime.now().isoformat(),
        )
        grants.append(grant)
        self._save_grants(grants)
        return grant

    def revoke_permission(self, share_id: str, grantee_email: str) -> bool:
        grants = self._load_grants()
        before = len(grants)
        grants = [g for g in grants if not (g.share_id == share_id and g.grantee_email == grantee_email)]
        if len(grants) < before:
            self._save_grants(grants)
            return True
        return False

    def get_permission(self, share_id: str, grantee_email: str) -> Optional[str]:
        """Get the permission level for an email on a share"""
        grants = self._load_grants()
        for g in grants:
            if g.share_id == share_id and g.grantee_email == grantee_email:
                return g.permission
        return None

    def list_grants_for_share(self, share_id: str) -> List[SharePermissionGrant]:
        grants = self._load_grants()
        return [g for g in grants if g.share_id == share_id]


# ===== Singleton factories =====

_access_request_service: Optional[AccessRequestService] = None
_folder_service: Optional[FolderService] = None
_sharing_analytics: Optional[SharingAnalyticsService] = None
_permission_grants: Optional[PermissionGrantService] = None


def get_access_request_service() -> AccessRequestService:
    global _access_request_service
    if _access_request_service is None:
        _access_request_service = AccessRequestService()
    return _access_request_service


def get_folder_service() -> FolderService:
    global _folder_service
    if _folder_service is None:
        _folder_service = FolderService()
    return _folder_service


def get_sharing_analytics_service() -> SharingAnalyticsService:
    global _sharing_analytics
    if _sharing_analytics is None:
        _sharing_analytics = SharingAnalyticsService()
    return _sharing_analytics


def get_permission_grant_service() -> PermissionGrantService:
    global _permission_grants
    if _permission_grants is None:
        _permission_grants = PermissionGrantService()
    return _permission_grants
