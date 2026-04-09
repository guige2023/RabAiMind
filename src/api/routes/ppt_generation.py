"""
PPT Generation Routes - 生成相关路由

作者: Claude
日期: 2026-03-17
"""

import logging
import re
import time

from fastapi import APIRouter, HTTPException, Request, status
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field, field_validator

logger = logging.getLogger(__name__)

from ...api.middleware.rate_limit import (
    check_quota,
    get_rate_limiter,
    get_user_id_from_request,
    rate_limit_exceeded_response,
)
from ...config import settings
from ...models import (
    APIInfo,
    GenerateRequest,
    GenerateResponse,
    HealthResponse,
    TaskError,
    TaskResult,
    TaskStatus,
    TaskStatusResponse,
)
from ...services.advanced_analytics_service import get_advanced_analytics_service
from ...services.ppt_generator import get_ppt_generator
from ...services.task_manager import get_task_manager

router = APIRouter()


def _check_rate_limit_middleware(request: Request) -> JSONResponse | None:
    """Check rate limit, return error response if exceeded, else None."""
    user_id = get_user_id_from_request(request)
    rate_limiter = get_rate_limiter()
    rate_info, allowed = rate_limiter.check(user_id)
    if not allowed:
        return rate_limit_exceeded_response(rate_info)
    return None


# ==================== Health Check ====================

@router.get("/health", response_model=HealthResponse)
async def health_check():
    """健康检查"""
    _server_start_time = time.time()
    return HealthResponse(
        status="healthy",
        service="rabai-mind-api",
        version=settings.VERSION,
        uptime=time.time() - _server_start_time
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


# ==================== PPT Generation ====================

@router.post("/generate", response_model=GenerateResponse)
async def generate_ppt(http_request: Request, request: GenerateRequest):
    """提交 PPT 生成任务"""
    # 速率限制检查（基于用户/IP）
    rate_error = _check_rate_limit_middleware(http_request)
    if rate_error:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=rate_error.body.decode() if hasattr(rate_error, 'body') else "请求过于频繁，请稍后再试"
        )

    # 获取用户ID
    user_id = get_user_id_from_request(http_request)

    # 配额检查（每日生成次数限制）
    quota_info, quota_allowed = check_quota(user_id)
    if not quota_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error": "QUOTA_EXCEEDED",
                "message": f"每日生成配额已用完（{quota_info.daily_limit}次/天）",
                "reset_at": quota_info.reset_at()
            }
        )

    try:
        # 用户输入过滤：防止Prompt注入
        from src.services.ppt_planner import sanitize_prompt
        safe_request = sanitize_prompt(request.user_request)

        # 创建任务
        task_id = get_task_manager().create_task(
            user_request=safe_request,
            slide_count=request.slide_count,
            scene=request.scene.value,
            style=request.style.value,
            template=request.template.value,
            theme_color=request.theme_color
        )

        # Track task creation in advanced analytics (real-time + cohort)
        try:
            adv = get_advanced_analytics_service()
            adv.track_task(task_id, user_id, "pending")
            adv.record_user(user_id)
            adv.track_request(user_id)
        except Exception as e:
            logger.warning(f"[AdvancedAnalytics] track_task failed: {e}")

        # BUG修复: 存储完整生成参数到 task["params"]，用于单页重生成等场景
        get_task_manager().update_task_params(task_id, {
            "scene": request.scene.value,
            "style": request.style.value,
            "template": request.template.value,
            "theme_color": request.theme_color,
            "text_style": request.text_style.value,
            "shadow_color": request.shadow_color,
            "overlay_transparency": request.overlay_transparency,
            "use_smart_layout": request.use_smart_layout,
            "font_title": request.font_title,
            "font_subtitle": request.font_subtitle,
            "font_content": request.font_content,
            "font_caption": request.font_caption,
            "layout_mode": request.layout_mode,
            "unified_layout": request.unified_layout,
            "generation_mode": request.generation_mode,
            "output_format": request.output_format,
            "quality": request.quality,
            "script_content_type": request.script_content_type.value if request.script_content_type else None,
        })

        # P2 修复: 使用 threading.Thread 替代 asyncio.create_task
        import threading
        def run_generation():
            import asyncio
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                result = loop.run_until_complete(
                    get_ppt_generator().generate(
                        task_id=task_id,
                        user_request=safe_request,
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
                        slide_layouts=request.slide_layouts,
                        include_charts=request.include_charts,
                        include_pie_chart=request.include_pie_chart,
                        include_bar_chart=request.include_bar_chart,
                        include_line_chart=request.include_line_chart,
                        add_watermark=request.add_watermark,
                        font_title=request.font_title,
                        font_subtitle=request.font_subtitle,
                        font_content=request.font_content,
                        font_caption=request.font_caption,
                        generation_mode=request.generation_mode,
                        output_format=request.output_format,
                        quality=request.quality,
                        layout_mode=request.layout_mode,
                        unified_layout=request.unified_layout,
                        pre_generated_slides=request.pre_generated_slides,
                        script_content_type=request.script_content_type.value if request.script_content_type else None
                    )
                )
            except Exception as e:
                logger.error(f"任务 {task_id} 生成失败: {e}")
                get_task_manager().fail_task(task_id, "GENERATION_ERROR", str(e))
                try:
                    get_advanced_analytics_service().update_task_status(task_id, "failed")
                except Exception:
                    pass
            finally:
                loop.close()

        thread = threading.Thread(target=run_generation, daemon=True)
        thread.start()
        get_task_manager().register_async_task(task_id, thread)

        return GenerateResponse(
            success=True,
            task_id=task_id,
            status=TaskStatus.PENDING,
            message="PPT 生成任务已创建",
            estimated_time=120
        )

    except Exception:
        # 错误信息脱敏，不泄露内部细节
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="服务器内部错误，请稍后重试"
        )


# ==================== Task Status ====================

@router.get("/task/{task_id}", response_model=TaskStatusResponse)
async def get_task_status(task_id: str):
    """获取任务状态"""
    # 验证task_id格式
    if not re.match(r'^[a-zA-Z0-9_-]+$', task_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="无效的任务ID格式"
        )

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
        error=TaskError(**task["error"]) if task.get("error") else None,
        user_request=task.get("user_request"),
    )


@router.get("/preview/{task_id}")
async def get_task_preview(request: Request, task_id: str):
    """获取任务预览图列表 - 用于实时预览"""
    # 速率限制检查
    rate_error = _check_rate_limit_middleware(request)
    if rate_error:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="请求过于频繁，请稍后再试"
        )

    import os

    # 验证task_id格式
    if not re.match(r'^[a-zA-Z0-9_-]+$', task_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="无效的任务ID格式"
        )

    task = get_task_manager().get_task(task_id)

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"任务 {task_id} 不存在"
        )

    # 获取SVG文件列表
    svg_files = []
    task_output_dir = os.path.join(settings.OUTPUT_DIR, task_id)

    # 查找该任务目录中的SVG文件
    if os.path.exists(task_output_dir):
        for filename in os.listdir(task_output_dir):
            if filename.startswith("slide_") and filename.endswith(".svg"):
                slide_num = int(filename.replace("slide_", "").replace(".svg", ""))
                svg_files.append({
                    "slide_num": slide_num,
                    "filename": filename,
                    "url": f"{request.base_url}api/v1/ppt/svg/{task_id}/{slide_num}"
                })

    # 按页码排序
    svg_files.sort(key=lambda x: x["slide_num"])

    return {
        "success": True,
        "task_id": task_id,
        "slides": svg_files,
        "total": len(svg_files)
    }


@router.get("/svg/{task_id}/{slide_num}")
async def get_svg_file(request: Request, task_id: str, slide_num: int):
    """获取单个SVG文件"""
    # 速率限制检查
    rate_error = _check_rate_limit_middleware(request)
    if rate_error:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="请求过于频繁，请稍后再试"
        )

    import os

    # 防止路径遍历攻击：严格验证task_id格式
    if not task_id or not slide_num or not re.match(r'^[a-zA-Z0-9_-]+$', task_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="无效的参数"
        )

    # 验证slide_num是正整数
    if slide_num < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="无效的页码"
        )

    filename = f"slide_{slide_num}.svg"
    filepath = os.path.join(settings.OUTPUT_DIR, task_id, filename)

    if not os.path.exists(filepath):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SVG文件不存在"
        )

    return FileResponse(
        filepath,
        media_type="image/svg+xml",
        headers={"Cache-Control": "no-cache"}
    )


@router.get("/image/file/{task_id}/{filename}")
async def get_task_image_file(task_id: str, filename: str):
    """获取任务目录下的图片文件"""
    import os

    # 防止路径遍历攻击
    if not re.match(r'^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|gif|webp)$', filename, re.IGNORECASE):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="无效的文件名"
        )

    filepath = os.path.join(settings.OUTPUT_DIR, task_id, filename)

    if not os.path.exists(filepath):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="图片文件不存在"
        )

    # 根据扩展名确定 media_type
    ext = filename.lower().split(".")[-1]
    media_types = {
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "gif": "image/gif",
        "webp": "image/webp"
    }
    media_type = media_types.get(ext, "application/octet-stream")

    return FileResponse(
        filepath,
        media_type=media_type,
        headers={"Cache-Control": "no-cache"}
    )


@router.delete("/task/{task_id}")
async def cancel_task(task_id: str):
    """取消任务"""
    # 验证task_id格式
    if not re.match(r'^[a-zA-Z0-9_-]+$', task_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="无效的任务ID格式"
        )

    task_manager = get_task_manager()

    # 取消数据库状态
    db_success = task_manager.cancel_task(task_id)

    # 取消异步任务（等待其真正停止，确保 CancelledError 传播）
    try:
        await task_manager.cancel_async_task_and_wait(task_id, timeout=5.0)
    except Exception:
        # 即使等待出错也要清理引用
        task_manager.cancel_async_task(task_id)

    if not db_success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"任务 {task_id} 不存在或无法取消"
        )

    return {"success": True, "task_id": task_id, "status": "cancelled"}


# ==================== AI Image Generation ====================

class ImageGenerationRequest(BaseModel):
    """AI生图请求"""
    prompt: str = Field(..., min_length=1, max_length=500, description="图片描述")
    size: str = Field(default="1024x1024", description="图片尺寸")
    n: int = Field(default=1, ge=1, le=4, description="生成数量")

    @field_validator('size')
    @classmethod
    def validate_size(cls, v):
        import re
        if not re.match(r'^\d+x\d+$', v):
            raise ValueError('尺寸格式无效，请使用如"1024x1024"格式')
        # 验证尺寸范围 (256-4096)
        width, height = map(int, v.split('x'))
        if width < 256 or width > 4096 or height < 256 or height > 4096:
            raise ValueError('尺寸必须在256x256到4096x4096之间')
        return v


class ImageGenerationResponse(BaseModel):
    """AI生图响应"""
    success: bool
    images: list[str]
    message: str = ""


@router.post("/ai-image", response_model=ImageGenerationResponse)
async def generate_image(http_request: Request, request: ImageGenerationRequest):
    """AI生成图片"""
    # 速率限制检查
    rate_error = _check_rate_limit_middleware(http_request)
    if rate_error:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="请求过于频繁，请稍后再试"
        )

    try:
        from src.services.ppt_planner import sanitize_prompt
        from src.services.volc_api import get_volc_api
        volc = get_volc_api()
        safe_prompt = sanitize_prompt(request.prompt)

        # 调用AI生图
        result = volc.image_generation(
            prompt=safe_prompt,
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
                message="图片生成失败，请稍后重试"
            )

    except Exception as e:
        logger.error(f"AI图片生成失败: {type(e).__name__}")
        return ImageGenerationResponse(
            success=False,
            images=[],
            message="图片生成失败，请稍后重试"
        )
