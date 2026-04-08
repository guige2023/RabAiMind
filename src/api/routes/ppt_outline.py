# -*- coding: utf-8 -*-
"""
PPT Outline Routes - 大纲相关路由

作者: Claude
日期: 2026-03-17
"""

from fastapi import APIRouter, HTTPException, Request, Query, Body, status
from fastapi.responses import JSONResponse
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field, field_validator
import logging
import re

logger = logging.getLogger(__name__)

from ...models import (
    GenerateRequest,
    SceneType,
    StyleType,
)
from ...services.task_manager import get_task_manager

router = APIRouter()


# ==================== Shared Models ====================

class OutlineSlide(BaseModel):
    """大纲中单个幻灯片的结构"""
    title: str = Field(..., min_length=1, max_length=200, description="幻灯片标题")
    content: Optional[Any] = Field(default=None, description="幻灯片内容（可以是字符串或列表）")
    layout: Optional[str] = Field(default=None, description="布局类型: title/center/left_text_right_image/card等")
    slide_type: Optional[str] = Field(default=None, description="幻灯片类型: title/toc/content/quote/data等")
    scene: Optional[str] = Field(default=None, description="场景类型")
    style: Optional[str] = Field(default=None, description="风格类型")


class OutlineSaveRequest(BaseModel):
    """保存大纲的请求模型（用于表单提交场景）"""
    outline: Dict[str, Any] = Field(..., description="大纲数据")

    @field_validator('outline')
    @classmethod
    def validate_outline_structure(cls, v: Dict[str, Any]) -> Dict[str, Any]:
        """验证大纲结构的基本完整性"""
        if not isinstance(v, dict):
            raise ValueError("outline 必须是对象")
        slides = v.get("slides")
        if slides is not None and not isinstance(slides, list):
            raise ValueError("outline.slides 必须是数组")
        if slides and len(slides) > 100:
            raise ValueError("幻灯片数量不能超过100页")
        return v


class OutlineSaveResponse(BaseModel):
    """保存大纲响应"""
    success: bool = True


class OutlineGetResponse(BaseModel):
    """获取大纲响应"""
    success: bool = True
    outline: Optional[Dict[str, Any]] = None


class CommitOutlineResponse(BaseModel):
    """提交大纲并返回 task_id 响应"""
    success: bool = True
    task_id: str


# ==================== Outline Persistence ====================

@router.post("/outline/save", response_model=OutlineSaveResponse)
async def save_outline(task_id: str = Query(..., description="任务ID"), outline: dict = Body(...)):
    """
    保存大纲到任务（支持跨设备继续编辑）

    将用户编辑的大纲数据持久化到指定任务，支持跨设备同步继续编辑。

    Args:
        task_id: 任务ID（必须是有效的UUID或字符串）
        outline: 大纲数据对象，结构为 {slides: [...], style: str, scene: str}

    Returns:
        success: 是否保存成功
    """
    import re
    if not re.match(r'^[a-zA-Z0-9_-]+$', task_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "INVALID_TASK_ID", "detail": "任务ID格式无效", "field": "task_id"}
        )
    tm = get_task_manager()
    tm.save_outline(task_id, outline)
    return OutlineSaveResponse(success=True)


@router.post("/outline/commit", response_model=CommitOutlineResponse)
async def commit_outline_and_generate(request: GenerateRequest):
    """
    两步式生成第一步：先保存大纲（不生成），返回 taskId

    前端在 OutlineEditView 保存后调用此端点，拿到 taskId 后再调用 /generate 开始实际生成。
    这样可以实现「先保存大纲 → 用户预览 → 确认后生成」的两阶段流程。

    Args:
        request: 包含 user_request, slide_count, scene, style 等生成参数

    Returns:
        success: 是否成功
        task_id: 创建的任务ID
    """
    tm = get_task_manager()
    outline = {
        "slides": request.pre_generated_slides,
        "scene": request.scene.value if request.scene else "business",
        "style": request.style.value if request.style else "professional",
        "user_request": request.user_request,
    }
    task_id = tm.create_task(
        user_request=request.user_request,
        slide_count=request.slide_count,
        scene=request.scene.value if request.scene else "business",
        style=request.style.value if request.style else "professional",
        layout_mode=request.layout_mode or "auto",
        color_scheme=request.theme_color or "#165DFF",
    )
    tm.save_outline(task_id, outline)
    return CommitOutlineResponse(success=True, task_id=task_id)


@router.get("/outline/{task_id}", response_model=OutlineGetResponse)
async def get_outline(task_id: str):
    """
    获取指定任务的大纲数据

    返回任务关联的大纲信息，包括幻灯片结构、场景、风格等。

    Args:
        task_id: 任务ID（必须是有效的UUID或字符串）

    Returns:
        success: 是否成功
        outline: 大纲数据对象，不存在时为 null
    """
    import re
    if not re.match(r'^[a-zA-Z0-9_-]+$', task_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "INVALID_TASK_ID", "detail": "任务ID格式无效", "field": "task_id"}
        )
    tm = get_task_manager()
    outline = tm.get_outline(task_id)
    return OutlineGetResponse(success=True, outline=outline)


# ==================== Outline Import/Export ====================

@router.get("/outline/export/{task_id}")
async def export_outline_json(task_id: str):
    """
    导出大纲为 JSON 格式（支持跨设备同步）

    导出任务的大纲数据以及关联的版本历史，供跨设备导入使用。

    Args:
        task_id: 任务ID

    Returns:
        success: 是否成功
        outline: 大纲数据
        metadata: 任务元数据（场景、风格、版本列表、导出时间）
    """
    import re
    if not re.match(r'^[a-zA-Z0-9_-]+$', task_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "INVALID_TASK_ID", "detail": "任务ID格式无效", "field": "task_id"}
        )
    from ...services.task_manager import get_task_manager
    from ...services.utils import get_timestamp

    tm = get_task_manager()
    outline = tm.get_outline(task_id)
    task = tm.get_task(task_id)
    versions = tm.list_versions(task_id)

    return {
        "success": True,
        "outline": outline,
        "metadata": {
            "task_id": task_id,
            "scene": task.get("scene") if task else None,
            "style": task.get("style") if task else None,
            "versions": versions,
            "exported_at": get_timestamp(),
        }
    }


@router.post("/outline/import")
async def import_outline_json():
    """
    获取大纲导入模板 JSON（用于跨设备同步）

    返回一个标准的大纲模板结构，用户/设备可据此填写数据后调用 /outline/save/{task_id} 保存。

    Returns:
        success: 是否成功
        template: 大纲模板（包含 slides 数组和 scene/style 字段）
        instructions: 使用说明
    """
    from ...services.utils import get_timestamp

    template = {
        "version": "1.0",
        "slides": [
            {"title": "封面标题", "content": "副标题", "layout": "title", "slide_type": "title"},
            {"title": "目录", "content": "内容1\n内容2\n内容3", "layout": "center", "slide_type": "toc"},
            {"title": "内容页", "content": "核心内容", "layout": "left_text_right_image", "slide_type": "content"},
        ],
        "scene": "business",
        "style": "professional",
    }
    return {
        "success": True,
        "template": template,
        "instructions": "填写 slides 数组后，调用 /outline/save 接口保存到任务"
    }


@router.post("/outline/save/{task_id}")
async def save_outline_json(task_id: str, request: Dict[str, Any]):
    """
    保存导入的大纲 JSON 到指定任务

    通常在 /outline/import 返回模板后，用户填写完大纲数据调用此接口保存。

    Args:
        task_id: 目标任务ID
        request: 包含 outline 字段的大纲数据

    Returns:
        success: 是否成功
        message: 操作结果描述
    """
    import re
    if not re.match(r'^[a-zA-Z0-9_-]+$', task_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "INVALID_TASK_ID", "detail": "任务ID格式无效", "field": "task_id"}
        )
    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    outline = request.get("outline", request)
    tm.save_outline(task_id, outline)

    return {"success": True, "message": "大纲已保存"}


# ==================== PPT Planning ====================

class PlanRequest(BaseModel):
    """PPT规划请求"""
    user_request: str = Field(..., min_length=1, max_length=5000, description="用户需求")
    slide_count: int = Field(default=5, ge=1, le=50, description="幻灯片数量")
    scene: SceneType = Field(default=SceneType.BUSINESS, description="场景类型")
    style: StyleType = Field(default=StyleType.PROFESSIONAL, description="风格类型")


class PlanResponse(BaseModel):
    """PPT规划响应"""
    success: bool
    slides: List[Dict[str, Any]]
    message: str = ""


@router.post("/plan", response_model=PlanResponse)
async def plan_ppt(http_request: Request, request: PlanRequest):
    """生成PPT大纲"""
    from ...api.middleware.rate_limit import (
        get_user_id_from_request,
        get_rate_limiter,
        rate_limit_exceeded_response,
    )
    
    # 速率限制检查
    user_id = get_user_id_from_request(http_request)
    rate_limiter = get_rate_limiter()
    rate_info, allowed = rate_limiter.check(user_id)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="请求过于频繁，请稍后再试"
        )

    try:
        from src.services.ppt_planner import plan_ppt as plan_service, sanitize_prompt
        import threading
        import asyncio
        
        safe_request = sanitize_prompt(request.user_request)

        # P2 修复: 使用 threading.Thread 替代 asyncio.to_thread
        result_holder = {}
        def run_plan():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                result_holder["value"] = plan_service(
                    user_request=safe_request,
                    slide_count=request.slide_count,
                    scene=request.scene.value,
                    style=request.style.value,
                    temperature=0.7
                )
            except Exception as e:
                logger.error(f"PPT大纲生成失败: {e}")
                result_holder["value"] = None
            finally:
                loop.close()

        thread = threading.Thread(target=run_plan, daemon=True)
        thread.start()
        thread.join(timeout=120)
        result = result_holder.get("value")

        if result:
            return PlanResponse(
                success=True,
                slides=result,
                message="PPT大纲生成成功"
            )
        else:
            return PlanResponse(
                success=False,
                slides=[],
                message="大纲生成失败"
            )
    except Exception as e:
        logger.error(f"PPT大纲生成失败: {type(e).__name__}")
        return PlanResponse(
            success=False,
            slides=[],
            message="大纲生成失败，请稍后重试"
        )
