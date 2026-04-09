"""
PPT History Routes - 历史记录、版本管理、协作编辑路由

作者: Claude
日期: 2026-03-17
"""

import logging
from typing import Any

from fastapi import APIRouter, Body, HTTPException, Query, Request, status
from pydantic import BaseModel

logger = logging.getLogger(__name__)

from ...services.history_sync_service import get_history_sync_service
from ...services.task_manager import get_task_manager

router = APIRouter()


# ==================== History Response Models ====================

class HistoryResponse(BaseModel):
    """历史记录响应"""
    success: bool
    total: int
    tasks: list[dict[str, Any]]
    sync_enabled: bool


# ==================== History Endpoints (Cloud Sync) ====================

@router.get("/history", response_model=HistoryResponse)
async def get_task_history(status: str | None = None):
    """
    获取任务历史记录（支持云端同步）
    
    换设备后可通过此接口获取历史任务。
    
    Args:
        status: 可选，筛选状态 (pending/processing/completed/failed/cancelled)
    """
    manager = get_task_manager()
    sync_service = get_history_sync_service()

    all_tasks = manager.get_history(status_filter=status)

    # 转换为列表
    tasks_list = [
        {**task, "task_id": tid}
        for tid, task in all_tasks.items()
    ]

    # 按 updated_at 降序排序
    tasks_list.sort(
        key=lambda x: x.get("updated_at", ""),
        reverse=True
    )

    return HistoryResponse(
        success=True,
        total=len(tasks_list),
        tasks=tasks_list,
        sync_enabled=sync_service.is_enabled()
    )


@router.post("/history/sync", response_model=BaseModel)
async def force_sync_history():
    """强制同步所有任务到云端"""
    manager = get_task_manager()
    sync_service = get_history_sync_service()

    if not sync_service.is_enabled():
        return {"success": False, "message": "OSS 未启用，无法同步"}

    count = manager.force_sync_all()
    return {"success": True, "message": f"已同步 {count} 个任务到云端", "synced_count": count}


# ==================== Version Management ====================

@router.get("/versions/{task_id}")
async def list_task_versions(task_id: str):
    """列出任务的所有版本"""
    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    versions = tm.list_versions(task_id)
    return {"success": True, "versions": versions}


@router.get("/versions/{task_id}/{version_id}")
async def get_task_version(task_id: str, version_id: str):
    """获取指定版本的详细信息"""
    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    try:
        result = tm.get_version(task_id, version_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail={"error": "ENDPOINT_ERROR", "detail": str(e)})


@router.post("/versions/{task_id}/{version_id}/rollback")
async def rollback_task_version(task_id: str, version_id: str):
    """回滚到指定版本"""
    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    try:
        return tm.rollback_version(task_id, version_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail={"error": "ENDPOINT_ERROR", "detail": str(e)})


@router.get("/versions/{task_id}/diff")
async def diff_task_versions(
    task_id: str,
    version_a: str = Query(..., description="版本A的version_id"),
    version_b: str = Query(..., description="版本B的version_id"),
):
    """对比两个版本"""
    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    try:
        return tm.diff_versions(task_id, version_a, version_b)
    except ValueError as e:
        raise HTTPException(status_code=404, detail={"error": "ENDPOINT_ERROR", "detail": str(e)})


@router.post("/versions/{task_id}/snapshot")
async def create_task_snapshot(task_id: str, name: str = None):
    """手动创建快照"""
    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    try:
        return tm.create_version(task_id, name)
    except ValueError as e:
        raise HTTPException(status_code=404, detail={"error": "ENDPOINT_ERROR", "detail": str(e)})


# ==================== Auto Versioning ====================

@router.get("/versions/{task_id}/auto-version/status")
async def get_auto_version_status(task_id: str):
    """获取自动版本化状态"""
    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    return tm.get_auto_version_status(task_id)


@router.post("/versions/{task_id}/significant-change/record")
async def record_significant_change(task_id: str):
    """记录一次显著变化（由编辑操作触发）"""
    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    result = tm.record_significant_change(task_id)
    # 同时检查是否需要自动创建版本
    auto_result = tm.auto_version_on_significant_change(task_id)
    return {**result, "auto_version": auto_result}


@router.post("/versions/{task_id}/significant-change/detect")
async def detect_significant_change(
    task_id: str,
    old_state: dict = Body(..., description="变更前状态"),
    new_state: dict = Body(..., description="变更后状态"),
):
    """检测显著变化"""
    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    return tm.detect_significant_change(task_id, old_state, new_state)


@router.post("/versions/{task_id}/auto-version/check")
async def check_auto_version(task_id: str):
    """检查是否需要自动创建版本"""
    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    return tm.auto_version_on_significant_change(task_id)


# ==================== Version Branching & Merging ====================

@router.post("/versions/{task_id}/{version_id}/branch")
async def branch_from_version(task_id: str, version_id: str, name: str = None):
    """从指定版本创建分支"""
    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    try:
        result = tm.branch_version(task_id, version_id, name)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail={"error": "ENDPOINT_ERROR", "detail": str(e)})


@router.post("/versions/{task_id}/merge")
async def merge_versions(
    task_id: str,
    source_version_id: str = Body(..., description="要合并的源版本ID"),
    target_version_id: str = Body(None, description="目标版本ID，不传则合并到当前最新"),
    strategy: str = Body("branch_wins", description="合并策略: branch_wins/main_wins/newest_first/manual"),
    slide_resolutions: dict = Body(None, description="手动冲突解决: {slide_index: 'source'|'target'}"),
):
    """合并分支版本到目标版本（支持冲突解决）"""
    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    try:
        result = tm.merge_version(task_id, source_version_id, target_version_id, strategy, slide_resolutions)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail={"error": "ENDPOINT_ERROR", "detail": str(e)})


# ==================== Version Tags ====================

@router.post("/versions/{task_id}/{version_id}/tag")
async def add_version_tag(task_id: str, version_id: str, tag: str = Body(..., description="标签名称")):
    """为版本添加标签"""
    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    try:
        result = tm.add_version_tag(task_id, version_id, tag)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail={"error": "ENDPOINT_ERROR", "detail": str(e)})


@router.delete("/versions/{task_id}/{version_id}/tag/{tag}")
async def remove_version_tag(task_id: str, version_id: str, tag: str):
    """移除版本的标签"""
    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    try:
        result = tm.remove_version_tag(task_id, version_id, tag)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail={"error": "ENDPOINT_ERROR", "detail": str(e)})


@router.get("/versions/{task_id}/tags")
async def get_all_version_tags(task_id: str):
    """获取所有版本标签统计"""
    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    return tm.get_version_tags(task_id)


@router.get("/versions/{task_id}/{version_id}/slide/{slide_index}/svg")
async def get_version_slide_svg(
    request: Request,
    task_id: str,
    version_id: str,
    slide_index: int
):
    """获取指定版本的指定幻灯片SVG内容（用于视觉diff）"""
    from ...api.middleware.rate_limit import (
        get_rate_limiter,
        get_user_id_from_request,
    )

    # 速率限制检查
    user_id = get_user_id_from_request(request)
    rate_limiter = get_rate_limiter()
    rate_info, allowed = rate_limiter.check(user_id)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="请求过于频繁，请稍后再试"
        )

    from fastapi.responses import Response

    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    result = tm.get_version_slide_svg(task_id, version_id, slide_index)
    svg_content = result.get("svg_content", "")

    return Response(
        content=svg_content,
        media_type="image/svg+xml",
        headers={
            "Content-Disposition": f"inline; filename=slide_{slide_index}.svg",
            "Cache-Control": "private, max-age=3600",
        }
    )


# ==================== Collaborative Editing ====================

@router.post("/collaborative-lock/{task_id}")
async def acquire_collaborative_lock(task_id: str, user_id: str, slide_index: int = None):
    """获取协作编辑锁"""
    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    try:
        result = tm.acquire_collaborative_lock(task_id, user_id, slide_index)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail={"error": "ENDPOINT_ERROR", "detail": str(e)})


@router.delete("/collaborative-lock/{task_id}")
async def release_collaborative_lock(task_id: str, user_id: str, slide_index: int = None):
    """释放协作编辑锁"""
    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    try:
        result = tm.release_collaborative_lock(task_id, user_id, slide_index)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail={"error": "ENDPOINT_ERROR", "detail": str(e)})


@router.get("/collaborative-locks/{task_id}")
async def get_collaborative_locks(task_id: str):
    """获取当前协作锁状态"""
    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    return tm.get_collaborative_locks(task_id)


# ==================== Undo/Redo ====================

@router.get("/action_log/{task_id}")
async def get_action_log(task_id: str, limit: int = Query(20, ge=1, le=100)):
    """获取操作日志"""
    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    log = tm.get_action_log(task_id, limit)
    return {"success": True, "action_log": log}


@router.get("/undo_stack/{task_id}")
async def get_undo_stack(task_id: str):
    """获取撤销栈"""
    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    stack = tm.get_undo_stack(task_id)
    return {"success": True, "undo_stack": stack}


@router.post("/undo/{task_id}")
async def undo_last_action(task_id: str):
    """撤销上一个操作"""
    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    try:
        result = tm.undo(task_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail={"error": "ENDPOINT_ERROR", "detail": str(e)})


@router.get("/redo_stack/{task_id}")
async def get_redo_stack(task_id: str):
    """获取重做栈"""
    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    stack = tm.get_redo_stack(task_id)
    return {"success": True, "redo_stack": stack}


@router.post("/redo/{task_id}")
async def redo_last_action(task_id: str):
    """重做上一个撤销的操作"""
    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    try:
        result = tm.redo(task_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail={"error": "ENDPOINT_ERROR", "detail": str(e)})


@router.get("/timeline/{task_id}")
async def get_action_timeline(task_id: str, limit: int = 100):
    """获取完整操作时间线（用于可视化撤销时间线）"""
    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    timeline = tm.get_action_timeline(task_id, limit)
    return {"success": True, "timeline": timeline}


@router.post("/undo/{task_id}/{action_id}")
async def undo_by_action_id(task_id: str, action_id: str, force: bool = False):
    """
    撤销指定操作（选择性撤销）
    force=False（默认）：仅撤销目标操作，保留其他操作
    force=True：分支撤销，撤销目标及其后续所有操作
    """
    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    try:
        result = tm.undo_by_action_id(task_id, action_id, force)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail={"error": "ENDPOINT_ERROR", "detail": str(e)})


# ==================== Checkpoints ====================

@router.post("/checkpoints/{task_id}")
async def create_checkpoint(task_id: str, name: str = None, checkpoint_type: str = "auto"):
    """创建检查点（用于自动保存，每5分钟）"""
    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    try:
        result = tm.create_checkpoint(task_id, name, checkpoint_type)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail={"error": "ENDPOINT_ERROR", "detail": str(e)})


@router.get("/checkpoints/{task_id}")
async def get_checkpoints(task_id: str, limit: int = 20):
    """获取检查点列表"""
    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    checkpoints = tm.get_checkpoints(task_id, limit)
    return {"success": True, "checkpoints": checkpoints}


@router.post("/checkpoints/{task_id}/{checkpoint_id}/restore")
async def restore_checkpoint(task_id: str, checkpoint_id: str):
    """从检查点恢复"""
    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    try:
        result = tm.restore_checkpoint(task_id, checkpoint_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail={"error": "ENDPOINT_ERROR", "detail": str(e)})


# ==================== Autosave ====================

@router.post("/autosave/{task_id}")
async def auto_save_state(task_id: str, state: dict = Body(...)):
    """保存自动保存状态（用于崩溃恢复）"""
    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    try:
        result = tm.auto_save(task_id, state)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail={"error": "ENDPOINT_ERROR", "detail": str(e)})


@router.get("/autosave/{task_id}")
async def get_auto_save_state(task_id: str):
    """获取自动保存状态"""
    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    try:
        result = tm.get_auto_save(task_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail={"error": "ENDPOINT_ERROR", "detail": str(e)})
