# -*- coding: utf-8 -*-
"""
API 路由定义

作者: Claude
日期: 2026-03-17
"""

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import FileResponse, JSONResponse
from typing import Dict, Any, List
from pydantic import BaseModel, Field
import asyncio
import time

from src.models import (
    GenerateRequest,
    GenerateResponse,
    TaskStatusResponse,
    TaskStatus,
    TaskResult,
    TaskError,
    HealthResponse,
    APIInfo,
    SceneType,
    StyleType,
    LayoutType
)
from src.services.task_manager import get_task_manager
from src.services.ppt_generator import get_ppt_generator

# 创建路由
router = APIRouter(prefix="/api/v1/ppt", tags=["ppt"])


# ==================== 健康检查 ====================

@router.get("/health", response_model=HealthResponse)
async def health_check():
    """健康检查"""
    return HealthResponse(
        status="healthy",
        service="rabai-mind-api"
    )


@router.get("/info", response_model=APIInfo)
async def get_api_info():
    """获取API信息"""
    return APIInfo(
        name="RabAi Mind",
        version="1.0.0",
        features=[
            "AI PPT 生成",
            "多场景支持",
            "SVG 渲染",
            "PPTX 转换优化",
            "MCP 协议支持"
        ]
    )


# ==================== PPT 生成 ====================

@router.post("/generate", response_model=GenerateResponse)
async def generate_ppt(request: GenerateRequest):
    """提交 PPT 生成任务"""
    try:
        # 创建任务
        task_id = get_task_manager().create_task(
            user_request=request.user_request,
            slide_count=request.slide_count,
            scene=request.scene.value,
            style=request.style.value,
            template=request.template.value,
            theme_color=request.theme_color
        )

        # 异步执行生成任务 - 使用 asyncio.create_task 在后台运行
        asyncio.create_task(
            get_ppt_generator().generate(
                task_id=task_id,
                user_request=request.user_request,
                slide_count=request.slide_count,
                scene=request.scene.value,
                style=request.style.value,
                template=request.template.value,
                theme_color=request.theme_color,
                text_style=request.text_style.value,
                shadow_color=request.shadow_color,
                overlay_transparency=request.overlay_transparency,
                use_smart_layout=request.use_smart_layout,
                slide_backgrounds=request.slide_backgrounds,
                slide_layouts=request.slide_layouts
            )
        )

        return GenerateResponse(
            success=True,
            task_id=task_id,
            status=TaskStatus.PENDING,
            message="PPT 生成任务已创建",
            estimated_time=120
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# ==================== 任务状态 ====================

@router.get("/task/{task_id}", response_model=TaskStatusResponse)
async def get_task_status(task_id: str):
    """获取任务状态"""
    task = get_task_manager().get_task(task_id)

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"任务 {task_id} 不存在"
        )

    return TaskStatusResponse(
        success=True,
        task_id=task_id,
        status=TaskStatus(task["status"]),
        progress=task.get("progress", 0),
        current_step=task.get("current_step", ""),
        created_at=task["created_at"],
        updated_at=task.get("updated_at", task["created_at"]),
        result=TaskResult(**task["result"]) if task.get("result") else None,
        error=TaskError(**task["error"]) if task.get("error") else None
    )


@router.delete("/task/{task_id}")
async def cancel_task(task_id: str):
    """取消任务"""
    success = get_task_manager().cancel_task(task_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"任务 {task_id} 不存在或无法取消"
        )

    return {"success": True, "task_id": task_id, "status": "cancelled"}


# ==================== 文件下载 ====================

@router.get("/download/{task_id}")
async def download_ppt(task_id: str):
    """下载 PPT 文件"""
    task = get_task_manager().get_task(task_id)

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"任务 {task_id} 不存在"
        )

    if task["status"] != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"任务尚未完成，当前状态: {task['status']}"
        )

    result = task.get("result", {})
    file_path = result.get("pptx_path")

    # 检查文件是否存在
    import os
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="文件不存在"
        )

    return FileResponse(
        path=str(file_path),
        filename=f"presentation_{task_id}.pptx",
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation"
    )


# ==================== 模板列表 ====================

@router.get("/templates")
async def get_templates():
    """获取模板列表"""
    templates = [
        {
            "id": "default",
            "name": "默认模板",
            "description": "通用商务模板",
            "thumbnail": "/templates/default.png"
        },
        {
            "id": "modern",
            "name": "现代模板",
            "description": "简约现代设计",
            "thumbnail": "/templates/modern.png"
        },
        {
            "id": "tech",
            "name": "科技模板",
            "description": "科技感风格",
            "thumbnail": "/templates/tech.png"
        },
        {
            "id": "classic",
            "name": "经典模板",
            "description": "传统商务风格",
            "thumbnail": "/templates/classic.png"
        }
    ]
    return templates


# ==================== 场景和风格 ====================

@router.get("/scenes")
async def get_scenes():
    """获取场景类型"""
    return [
        {"id": "business", "name": "商务", "description": "商业演示"},
        {"id": "education", "name": "教育", "description": "教学课件"},
        {"id": "tech", "name": "科技", "description": "技术分享"},
        {"id": "creative", "name": "创意", "description": "创意展示"}
    ]


@router.get("/styles")
async def get_styles():
    """获取风格类型"""
    return [
        {"id": "professional", "name": "专业", "description": "商务专业风格"},
        {"id": "simple", "name": "简约", "description": "简洁大方风格"},
        {"id": "energetic", "name": "活力", "description": "充满活力风格"},
        {"id": "premium", "name": "高端", "description": "高端大气风格"}
    ]


# ==================== AI 生图 ====================

class ImageGenerationRequest(BaseModel):
    """AI生图请求"""
    prompt: str = Field(..., min_length=1, max_length=500, description="图片描述")
    size: str = Field(default="1024x1024", description="图片尺寸")
    n: int = Field(default=1, ge=1, le=4, description="生成数量")


class ImageGenerationResponse(BaseModel):
    """AI生图响应"""
    success: bool
    images: List[str]
    message: str = ""


@router.post("/ai-image", response_model=ImageGenerationResponse)
async def generate_image(request: ImageGenerationRequest):
    """AI生成图片"""
    try:
        from src.services.volc_api import get_volc_api
        volc = get_volc_api()

        # 调用AI生图
        result = volc.image_generation(
            prompt=request.prompt,
            size=request.size,
            n=request.n
        )

        if result.get("success"):
            return ImageGenerationResponse(
                success=True,
                images=result.get("images", []),
                message="图片生成成功"
            )
        else:
            return ImageGenerationResponse(
                success=False,
                images=[],
                message=result.get("error", "生成失败")
            )

    except Exception as e:
        return ImageGenerationResponse(
            success=False,
            images=[],
            message=str(e)
        )
