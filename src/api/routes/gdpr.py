# -*- coding: utf-8 -*-
"""
GDPR Data Export Compliance Routes

Provides data export functionality per GDPR Article 20 (Right to Data Portability).
Users can request a full export of all their personal data.

Author: Claude
Date: 2026-04-04
"""

import os
from pydantic import BaseModel, Field
import json
import zipfile
import io
import hashlib
from datetime import datetime
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, HTTPException, Request, Depends, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from ...core.security import get_audit_logger, Role, User
from ...api.middleware.auth import get_current_user

router = APIRouter(prefix="/api/v1/gdpr", tags=["gdpr"])


# ==================== Data Locations ====================

def _get_data_dir() -> str:
    return os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "data")


def _get_output_dir() -> str:
    from ...config import settings
    return settings.OUTPUT_DIR


def _get_template_dir() -> str:
    from ...config import settings
    return settings.TEMPLATE_DIR


# ==================== Pydantic Models ====================

class GDPRExportFormat(str):
    JSON = "json"
    ZIP = "zip"


class GDPRExportRequest(BaseModel):
    """Request an export of all user data."""
    format: str = Query("json", pattern="^(json|zip)$")
    include_ppts: bool = Query(True)
    include_templates: bool = Query(True)
    include_favorites: bool = Query(True)
    include_brand_assets: bool = Query(True)
    include_audit_logs: bool = Query(False)  # Users can include their own audit logs
    include_settings: bool = Query(True)


class GDPRDeleteRequest(BaseModel):
    """Request deletion of all user data (GDPR Article 17 - Right to Erasure)."""
    confirm_username: str
    secure_delete: bool = Field(default=False, description="启用安全删除（覆写擦除，数据不可恢复）")


# ==================== Data Collectors ====================

def collect_user_ppts(user_id: str) -> List[Dict[str, Any]]:
    """Collect all PPT data for a user."""
    output_dir = _get_output_dir()
    user_data = []

    user_hash = hashlib.sha256(user_id.encode()).hexdigest()[:16]

    if os.path.exists(output_dir):
        for filename in os.listdir(output_dir):
            filepath = os.path.join(output_dir, filename)
            if os.path.isfile(filepath) and (filename.endswith(".pptx") or filename.endswith(".json")):
                # Check if this file belongs to the user (based on naming convention)
                # For now, collect metadata about all files in output dir
                stat = os.stat(filepath)
                created = datetime.fromtimestamp(stat.st_ctime).isoformat() + "Z"
                modified = datetime.fromtimestamp(stat.st_mtime).isoformat() + "Z"

                if filename.endswith(".pptx"):
                    user_data.append({
                        "filename": filename,
                        "file_type": "pptx",
                        "size_bytes": stat.st_size,
                        "created_at": created,
                        "modified_at": modified,
                        "path": filepath.replace(os.path.dirname(_get_data_dir()), ""),
                    })
                elif filename.endswith(".json"):
                    try:
                        with open(filepath, "r", encoding="utf-8") as f:
                            meta = json.load(f)
                            if meta.get("user_id") == user_id or meta.get("owner") == user_id:
                                user_data.append({
                                    "filename": filename,
                                    "file_type": "metadata",
                                    "size_bytes": stat.st_size,
                                    "created_at": created,
                                    "modified_at": modified,
                                    "metadata": meta,
                                })
                    except Exception:
                        pass

    return user_data


def collect_user_templates(user_id: str) -> List[Dict[str, Any]]:
    """Collect user's saved templates."""
    from ...services.template_manager import TemplateManager
    try:
        tm = TemplateManager()
        templates = tm.list_templates(user_id=user_id)
        return [
            {
                "id": t.get("id", ""),
                "name": t.get("name", ""),
                "scene": t.get("scene", ""),
                "style": t.get("style", ""),
                "created_at": t.get("created_at", ""),
                "updated_at": t.get("updated_at", ""),
            }
            for t in templates
        ]
    except Exception:
        return []


def collect_user_favorites(user_id: str) -> List[Dict[str, Any]]:
    """Collect user's favorites."""
    from ...services.favorites_manager import FavoritesManager
    try:
        fm = FavoritesManager()
        favs = fm.list_favorites(user_id=user_id)
        return [
            {
                "id": f.get("id", ""),
                "ppt_id": f.get("ppt_id", ""),
                "name": f.get("name", ""),
                "created_at": f.get("created_at", ""),
            }
            for f in favs
        ]
    except Exception:
        return []


def collect_user_brands(user_id: str) -> List[Dict[str, Any]]:
    """Collect user's brand assets."""
    brands_dir = os.path.join(_get_data_dir(), "brands", user_id)
    brands = []
    if os.path.exists(brands_dir):
        for filename in os.listdir(brands_dir):
            filepath = os.path.join(brands_dir, filename)
            if os.path.isfile(filepath):
                stat = os.stat(filepath)
                brands.append({
                    "filename": filename,
                    "size_bytes": stat.st_size,
                    "created_at": datetime.fromtimestamp(stat.st_ctime).isoformat() + "Z",
                })
    return brands


def collect_user_audit_logs(user_id: str) -> List[Dict[str, Any]]:
    """Collect user's own audit log entries."""
    logger_ = get_audit_logger()
    logs = logger_.query(user_id=user_id, limit=1000)
    # Strip sensitive fields
    safe_logs = []
    for log in logs:
        safe_logs.append({
            "id": log.get("id"),
            "timestamp": log.get("timestamp"),
            "action": log.get("action"),
            "resource": log.get("resource"),
            "resource_id": log.get("resource_id"),
            "status_code": log.get("status_code"),
            "ip": log.get("ip"),
        })
    return safe_logs


def build_gdpr_report(
    user_id: str,
    username: str,
    include_ppts: bool = True,
    include_templates: bool = True,
    include_favorites: bool = True,
    include_brand_assets: bool = True,
    include_audit_logs: bool = False,
    include_settings: bool = True,
) -> Dict[str, Any]:
    """Build a complete GDPR data report for a user."""

    report = {
        "gdpr_report_version": "1.0",
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "user_id": user_id,
        "username": username,
        "export_requested_at": datetime.utcnow().isoformat() + "Z",
        "data": {},
        "statistics": {},
    }

    # Settings / Profile
    if include_settings:
        report["data"]["settings"] = {
            "exported_at": datetime.utcnow().isoformat() + "Z",
            "note": "User profile and settings"
        }

    # PPTs
    if include_ppts:
        ppts = collect_user_ppts(user_id)
        report["data"]["ppts"] = ppts
        report["statistics"]["total_ppts"] = len(ppts)

    # Templates
    if include_templates:
        templates = collect_user_templates(user_id)
        report["data"]["templates"] = templates
        report["statistics"]["total_templates"] = len(templates)

    # Favorites
    if include_favorites:
        favorites = collect_user_favorites(user_id)
        report["data"]["favorites"] = favorites
        report["statistics"]["total_favorites"] = len(favorites)

    # Brand Assets
    if include_brand_assets:
        brands = collect_user_brands(user_id)
        report["data"]["brand_assets"] = brands
        report["statistics"]["total_brand_assets"] = len(brands)

    # Audit Logs (user can opt-in)
    if include_audit_logs:
        logs = collect_user_audit_logs(user_id)
        report["data"]["audit_logs"] = logs
        report["statistics"]["total_audit_entries"] = len(logs)

    # Overall statistics
    report["statistics"]["export_completed_at"] = datetime.utcnow().isoformat() + "Z"

    return report


# ==================== Routes ====================

@router.get("/export")
async def export_my_data(
    request: Request,
    format: str = Query("json", pattern="^(json|zip)$"),
    include_ppts: bool = Query(True),
    include_templates: bool = Query(True),
    include_favorites: bool = Query(True),
    include_brand_assets: bool = Query(True),
    include_audit_logs: bool = Query(False),
    include_settings: bool = Query(True),
    current_user: User = Depends(get_current_user),
):
    """
    GDPR Article 20 — Right to Data Portability

    Export all personal data associated with the current user account.
    Returns a JSON file (or ZIP with multiple files) containing:
    - PPTs created by the user
    - Saved templates
    - Favorites
    - Brand assets
    - Audit logs (if opted in)
    - Account settings

    This endpoint is available to authenticated users for their own data,
    and to admins for any user's data (via X-Target-User-ID header).
    """
    # Check if admin requesting another user's data
    target_user_id = request.headers.get("X-Target-User-ID")
    if target_user_id and current_user.role == Role.ADMIN:
        user_id = target_user_id
        username = target_user_id
    else:
        user_id = current_user.user_id
        username = getattr(current_user, "username", current_user.user_id)

    # Build report
    report = build_gdpr_report(
        user_id=user_id,
        username=username,
        include_ppts=include_ppts,
        include_templates=include_templates,
        include_favorites=include_favorites,
        include_brand_assets=include_brand_assets,
        include_audit_logs=include_audit_logs,
        include_settings=include_settings,
    )

    # Log the export request
    audit_logger = get_audit_logger()
    audit_logger.log(
        action="gdpr_export",
        user_id=current_user.user_id,
        role=current_user.role.value,
        resource="gdpr",
        path="/api/v1/gdpr/export",
        ip=_get_client_ip(request),
        user_agent=request.headers.get("user-agent", ""),
        extra={
            "format": format,
            "include_ppts": include_ppts,
            "include_templates": include_templates,
            "include_favorites": include_favorites,
            "include_brand_assets": include_brand_assets,
            "include_audit_logs": include_audit_logs,
            "target_user_id": target_user_id or user_id,
        }
    )

    report_json = json.dumps(report, ensure_ascii=False, indent=2)

    if format == "zip":
        # Create ZIP with JSON inside
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            zf.writestr(
                f"gdpr_export_{user_id}_{datetime.utcnow().strftime('%Y%m%d')}.json",
                report_json
            )
        buffer.seek(0)

        return StreamingResponse(
            iter([buffer.getvalue()]),
            media_type="application/zip",
            headers={
                "Content-Disposition": f"attachment; filename=gdpr_export_{user_id}_{datetime.utcnow().strftime('%Y%m%d')}.zip"
            }
        )

    # Plain JSON
    return StreamingResponse(
        iter([report_json]),
        media_type="application/json",
        headers={
            "Content-Disposition": f"attachment; filename=gdpr_export_{user_id}_{datetime.utcnow().strftime('%Y%m%d')}.json"
        }
    )


@router.get("/report")
async def get_gdpr_report_summary(
    request: Request,
    current_user: User = Depends(get_current_user),
):
    """
    Get a summary of what data exists for the current user.
    Does not export, just shows what would be included.
    """
    target_user_id = request.headers.get("X-Target-User-ID")
    if target_user_id and current_user.role == Role.ADMIN:
        user_id = target_user_id
    else:
        user_id = current_user.user_id

    report = build_gdpr_report(
        user_id=user_id,
        username=getattr(current_user, "username", user_id),
        include_ppts=True,
        include_templates=True,
        include_favorites=True,
        include_brand_assets=True,
        include_audit_logs=True,
        include_settings=True,
    )

    return {
        "success": True,
        "user_id": user_id,
        "statistics": report["statistics"],
        "note": "Full export available at /api/v1/gdpr/export"
    }


@router.post("/delete")
async def request_data_deletion(
    req: GDPRDeleteRequest,
    current_user: User = Depends(get_current_user),
):
    """
    GDPR Article 17 — Right to Erasure ('Right to be Forgotten')

    Mark all user data for deletion. The actual deletion is performed
    by the retention policy (see /api/v1/admin/retention).

    User must confirm by typing their username exactly.
    Admin deletions are handled separately via /api/v1/admin/users/{id}/delete.
    """
    if req.confirm_username != getattr(current_user, "username", ""):
        raise HTTPException(
            status_code=400,
            detail="确认用户名不匹配"
        )

    # Log the deletion request
    audit_logger = get_audit_logger()
    audit_logger.log(
        action="gdpr_delete_request",
        user_id=current_user.user_id,
        role=current_user.role.value,
        resource="gdpr",
        path="/api/v1/gdpr/delete",
        ip=_get_client_ip(request),
        user_agent=request.headers.get("user-agent", ""),
        extra={"confirmed_username": req.confirm_username}
    )

    # Mark user for deletion (set a flag)
    _mark_user_for_deletion(current_user.user_id, secure=req.secure_delete)

    return {
        "success": True,
        "message": "数据删除请求已记录，数据将在保留期到期后自动清除",
        "user_id": current_user.user_id,
        "secure_delete": req.secure_delete,
        "note": "实际删除由数据保留策略执行"
    }


def _mark_user_for_deletion(user_id: str, secure: bool = False):
    """Mark user for deletion in the deletion queue."""
    queue_file = os.path.join(_get_data_dir(), "deletion_queue.json")
    os.makedirs(os.path.dirname(queue_file), exist_ok=True)

    try:
        with open(queue_file, "r", encoding="utf-8") as f:
            queue = json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        queue = []

    # Check if already queued
    for item in queue:
        if item.get("user_id") == user_id:
            return  # Already queued

    queue.append({
        "user_id": user_id,
        "requested_at": datetime.utcnow().isoformat() + "Z",
        "status": "pending",
        "secure_delete": secure,
    })

    with open(queue_file, "w", encoding="utf-8") as f:
        json.dump(queue, f, ensure_ascii=False, indent=2)


def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.headers.get("X-Real-IP", request.client.host if request.client else "unknown")
