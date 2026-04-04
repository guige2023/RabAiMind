# -*- coding: utf-8 -*-
"""
API 路由定义

作者: Claude
日期: 2026-03-17
"""

from fastapi import APIRouter, HTTPException, Request, status, UploadFile, File, Form, Query, Body
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field, field_validator
import asyncio
import logging
import re
import threading
import time

logger = logging.getLogger(__name__)

from ...models import (
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
from ...services.task_manager import get_task_manager
from ...services.ppt_generator import get_ppt_generator
from ...services.chart_generator import ChartGenerator
from ...services.history_sync_service import get_history_sync_service
from ...services.template_manager import get_template_manager
from ...services.advanced_analytics_service import get_advanced_analytics_service
from ...config import settings

from ...api.middleware.rate_limit import (
    get_user_id_from_request,
    get_rate_limiter,
    check_quota,
    quota_exceeded_response,
    rate_limit_exceeded_response,
    add_rate_limit_headers,
    get_quota_status,
)

# 创建路由
router = APIRouter(prefix="/api/v1/ppt", tags=["ppt"])


def _check_rate_limit_middleware(request: Request) -> Optional[JSONResponse]:
    """Check rate limit, return error response if exceeded, else None."""
    user_id = get_user_id_from_request(request)
    rate_limiter = get_rate_limiter()
    rate_info, allowed = rate_limiter.check(user_id)
    if not allowed:
        return rate_limit_exceeded_response(rate_info)
    return None


# ==================== 图表上传与生成 ====================

@router.post("/chart/upload/{task_id}")
async def upload_chart_file(
    task_id: str,
    file: UploadFile = File(...),
    chart_type: str = Form("bar"),
    label_col: str = Form(""),
    value_col: str = Form(""),
    # R62 新参数
    theme_id: str = Form("default"),
    show_trend_line: bool = Form(False),
    annotations_json: str = Form("[]"),
):
    """上传 CSV/Excel 文件，生成图表 SVG（R62: 支持模板/趋势线/标注）"""
    import json
    try:
        annotations = json.loads(annotations_json) if annotations_json and annotations_json != "[]" else None
    except Exception:
        annotations = None
    try:
        content = await file.read()
        cg = ChartGenerator()
        result = cg.process_upload(
            content, file.filename, chart_type,
            label_col, value_col, task_id,
            theme_id=theme_id,
            annotations=annotations,
            show_trend_line=show_trend_line,
        )
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"图表生成失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"图表生成失败: {str(e)}"
        )


@router.post("/chart/preview/{task_id}")
async def preview_chart_columns(
    task_id: str,
    file: UploadFile = File(...),
):
    """上传 CSV/Excel，预览列信息（不生成图表）"""
    try:
        content = await file.read()
        cg = ChartGenerator()
        df = cg.parse_file(content, file.filename)
        cols = cg.extract_columns(df)
        return {
            "success": True,
            "columns": cols
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"文件解析失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"文件解析失败: {str(e)}"
        )


# R62: Smart Fill 智能填充缺失数据
@router.post("/chart/smart-fill")
async def smart_fill_chart_data(
    file: UploadFile = File(...),
    target_col: str = Form(...),
    method: str = Form("auto"),
):
    """
    R62: AI 智能填充缺失值
    - file: CSV/Excel 文件
    - target_col: 需要填充的目标列
    - method: auto/linear/forward/mean
    返回填充后的完整数据预览
    """
    try:
        content = await file.read()
        cg = ChartGenerator()
        df = cg.parse_file(content, file.filename)
        cols_info = cg.extract_columns(df)
        
        # 执行智能填充
        df_filled = cg.smart_fill_data(df, target_col, method)
        
        return {
            "success": True,
            "original_columns": cols_info,
            "filled_preview": df_filled.to_dict("records"),
            "row_count": len(df_filled),
            "filled_col": target_col,
            "fill_method": method,
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Smart Fill 失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Smart Fill 失败: {str(e)}"
        )


# R62: 图表模板列表
@router.get("/chart/templates")
async def get_chart_templates():
    """R62: 获取可用图表模板列表"""
    from ...services.chart_generator import CHART_TEMPLATES, CHART_STYLE_PRESETS
    return {
        "success": True,
        "templates": CHART_STYLE_PRESETS,
        "details": CHART_TEMPLATES,
    }


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


# ==================== 大纲持久化 ====================

@router.post("/outline/save")
async def save_outline(task_id: str = Query(...), outline: dict = Body(...)):
    """
    保存大纲到任务（支持跨设备继续编辑）
    outline: {slides: [{title, content, layout, slide_type}], style, scene}
    """
    tm = get_task_manager()
    tm.save_outline(task_id, outline)
    return {"success": True}


@router.post("/outline/commit")
async def commit_outline_and_generate(request: GenerateRequest):
    """
    两步式生成第一步：先保存大纲（不生成），返回 taskId
    前端在 OutlineEditView 保存后调用此端点，拿到 taskId
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
    return {"success": True, "task_id": task_id}


@router.get("/outline/{task_id}")
async def get_outline(task_id: str):
    """获取大纲"""
    tm = get_task_manager()
    outline = tm.get_outline(task_id)
    return {"success": True, "outline": outline}


# ==================== 历史记录（云端同步） ====================

class HistoryResponse(BaseModel):
    """历史记录响应"""
    success: bool
    total: int
    tasks: List[Dict[str, Any]]
    sync_enabled: bool


@router.get("/history", response_model=HistoryResponse)
async def get_task_history(status: Optional[str] = None):
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


# ==================== PPT 生成 ====================

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
        })

        # P2 修复: 使用 threading.Thread 替代 asyncio.create_task
        # asyncio.to_thread 在 create_task 内调用时与 Python 3.14 + uvicorn 不兼容，会永久挂住
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
                        pre_generated_slides=request.pre_generated_slides
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

    except Exception as e:
        # 错误信息脱敏，不泄露内部细节
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="服务器内部错误，请稍后重试"
        )


# ==================== 任务状态 ====================

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
    from ...config import settings

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
    from ...config import settings

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
            detail=f"SVG文件不存在"
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
    from ...config import settings

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


# ==================== 文件下载 ====================

@router.get("/download/{task_id}")
async def download_ppt(request: Request, task_id: str):
    """下载 PPT 文件"""
    # 速率限制检查
    rate_error = _check_rate_limit_middleware(request)
    if rate_error:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="请求过于频繁，请稍后再试"
        )

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

    # 路径安全验证：防止路径遍历攻击
    if not file_path:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="文件路径无效"
        )

    # 规范化路径并验证（使用realpath防止符号链接绕过）
    output_dir = os.path.realpath(settings.OUTPUT_DIR)
    file_path_abs = os.path.realpath(file_path)

    # 确保路径在允许的目录内
    if not file_path_abs.startswith(output_dir):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="文件路径不安全"
        )

    if not os.path.exists(file_path_abs):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="文件不存在"
        )

    return FileResponse(
        path=str(file_path_abs),
        filename=f"presentation_{task_id}.pptx",
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation"
    )


@router.get("/export/pdf/{task_id}")
async def export_pdf(request: Request, task_id: str):
    """导出PDF"""
    # 速率限制检查
    rate_error = _check_rate_limit_middleware(request)
    if rate_error:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="请求过于频繁，请稍后再试"
        )

    task = get_task_manager().get_task(task_id)

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"任务 {task_id} 不存在"
        )

    if task["status"] != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"任务尚未完成"
        )

    result = task.get("result", {})
    pptx_path = result.get("pptx_path")

    import os
    # 路径安全验证：防止路径遍历攻击
    if not pptx_path:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="文件路径无效"
        )

    # 规范化路径并验证（使用realpath防止符号链接绕过）
    output_dir = os.path.realpath(settings.OUTPUT_DIR)
    pptx_path_abs = os.path.realpath(pptx_path)

    # 确保路径在允许的目录内
    if not pptx_path_abs.startswith(output_dir):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="文件路径不安全"
        )

    if not os.path.exists(pptx_path_abs):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PPTX文件不存在"
        )

    try:
        import subprocess
        import shutil

        # 使用验证后的路径计算PDF路径
        pdf_path = pptx_path_abs.replace('.pptx', '.pdf')
        # 验证PDF路径也在允许目录内
        pdf_path_abs = os.path.realpath(pdf_path)
        if not pdf_path_abs.startswith(output_dir):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="文件路径不安全"
            )

        # 方法1: 尝试使用 LibreOffice 转换
        libreoffice_path = shutil.which('libreoffice') or shutil.which('soffice')

        if libreoffice_path:
            # 使用 LibreOffice 转换为 PDF
            result = subprocess.run(
                [libreoffice_path, "--headless", "--convert-to", "pdf", "--outdir",
                 os.path.dirname(pptx_path_abs), pptx_path_abs],
                capture_output=True,
                timeout=120
            )

            # 检查转换是否成功
            if result.returncode != 0:
                logger.error(f"LibreOffice PDF转换失败: {result.stderr.decode('utf-8', errors='ignore') if result.stderr else '未知错误'}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="PDF转换失败"
                )

            # LibreOffice 会自动命名输出文件
            expected_name = os.path.splitext(os.path.basename(pptx_path_abs))[0] + ".pdf"
            expected_path = os.path.join(os.path.dirname(pptx_path_abs), expected_name)

            if os.path.exists(expected_path) and expected_path != pdf_path_abs:
                shutil.move(expected_path, pdf_path_abs)

            if os.path.exists(pdf_path_abs):
                return FileResponse(
                    path=str(pdf_path_abs),
                    filename=f"presentation_{task_id}.pdf",
                    media_type="application/pdf"
                )

        # 方法2: 如果没有 LibreOffice，返回错误提示
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="PDF转换服务不可用，请安装 LibreOffice: sudo apt-get install libreoffice"
        )
    except HTTPException:
        raise
    except Exception as e:
        # 错误信息脱敏
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="PDF转换失败，请稍后重试"
        )


# ==================== Enhanced PDF Export ====================

class PdfExportOptions(BaseModel):
    """Enhanced PDF export options"""
    mode: str = Field(default="slides", description="导出模式: slides(幻灯片) | notes(备注页) | handout(讲义)")
    page_size: str = Field(default="A4", description="页面大小: A4 | Letter | 16:9 | 4:3")
    orientation: str = Field(default="landscape", description="方向: portrait | landscape")
    handout_layout: str = Field(default="3", description="讲义布局(每页几张): 1 | 2 | 3 | 6")
    notes_position: str = Field(default="below", description="备注位置: below | right | separate")
    notes_font_size: int = Field(default=10, description="备注字体大小")
    watermark_enabled: bool = Field(default=False, description="启用水印")
    watermark_text: str = Field(default="CONFIDENTIAL", description="水印文字")
    watermark_opacity: float = Field(default=0.15, description="水印透明度 0-1")
    watermark_angle: int = Field(default=45, description="水印角度")
    watermark_font_size: int = Field(default=48, description="水印字体大小")
    watermark_color: str = Field(default="#888888", description="水印颜色")
    header_footer_enabled: bool = Field(default=False, description="启用页眉页脚")
    header_text: str = Field(default="", description="页眉文字")
    footer_text: str = Field(default="", description="页脚文字")
    page_number_format: str = Field(default="Page {current} of {total}", description="页码格式")
    header_footer_font_size: int = Field(default=10, description="页眉页脚字体大小")
    header_footer_color: str = Field(default="#666666", description="页眉页脚颜色")
    theme: str = Field(default="light", description="主题: light | dark")


@router.post("/export/enhanced-pdf/{task_id}")
async def export_enhanced_pdf(
    request: Request,
    task_id: str,
    options: PdfExportOptions = None
):
    """增强PDF导出 - 支持幻灯片/备注页/讲义格式、自定义页面、水印、页眉页脚"""
    if options is None:
        options = PdfExportOptions()
    
    rate_error = _check_rate_limit_middleware(request)
    if rate_error:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="请求过于频繁，请稍后再试"
        )
    
    task = get_task_manager().get_task(task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"任务 {task_id} 不存在"
        )
    
    if task["status"] != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="任务尚未完成"
        )
    
    result = task.get("result", {})
    pptx_path = result.get("pptx_path")
    
    if not pptx_path:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PPTX路径无效"
        )
    
    import os
    output_dir = os.path.realpath(settings.OUTPUT_DIR)
    pptx_path_abs = os.path.realpath(pptx_path)
    
    if not pptx_path_abs.startswith(output_dir):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="文件路径不安全"
        )
    
    if not os.path.exists(pptx_path_abs):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PPTX文件不存在"
        )
    
    # Build watermark settings
    from src.services.pdf_export_service import (
        PdfExportOptions as ServicePdfOptions,
        WatermarkSettings,
        HeaderFooterSettings,
        get_enhanced_pdf_export_service
    )
    
    watermark = WatermarkSettings(
        enabled=options.watermark_enabled,
        text=options.watermark_text,
        opacity=options.watermark_opacity,
        angle=options.watermark_angle,
        font_size=options.watermark_font_size,
        color=options.watermark_color
    )
    
    header_footer = HeaderFooterSettings(
        enabled=options.header_footer_enabled,
        header_text=options.header_text,
        footer_text=options.footer_text,
        page_number_format=options.page_number_format,
        header_font_size=options.header_footer_font_size,
        footer_font_size=options.header_footer_font_size,
        font_color=options.header_footer_color
    )
    
    service_options = ServicePdfOptions(
        mode=options.mode,
        page_size=options.page_size,
        orientation=options.orientation,
        handout_layout=options.handout_layout,
        notes_position=options.notes_position,
        notes_font_size=options.notes_font_size,
        watermark=watermark,
        header_footer=header_footer,
        theme=options.theme
    )
    
    # Generate output filename based on options
    suffix = f"_{options.mode}"
    if options.mode == "handout":
        suffix += f"_{options.handout_layout}up"
    if options.watermark_enabled:
        suffix += "_watermarked"
    
    pdf_filename = f"presentation_{task_id}{suffix}.pdf"
    pdf_path_abs = os.path.join(os.path.dirname(pptx_path_abs), pdf_filename)
    
    # Validate output path
    pdf_path_abs = os.path.realpath(pdf_path_abs)
    if not pdf_path_abs.startswith(output_dir):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="输出路径不安全"
        )
    
    try:
        export_service = get_enhanced_pdf_export_service()
        
        if not export_service.is_available():
            # Fallback: try LibreOffice conversion
            return await _fallback_export_pdf_libreoffice(request, task_id, pptx_path_abs, pdf_path_abs)
        
        # Use enhanced export service
        export_result = await export_service.export_pdf(
            pptx_path_abs,
            pdf_path_abs,
            service_options
        )
        
        if export_result.get("success"):
            return FileResponse(
                path=str(pdf_path_abs),
                filename=pdf_filename,
                media_type="application/pdf"
            )
        else:
            # Fallback to LibreOffice
            return await _fallback_export_pdf_libreoffice(request, task_id, pptx_path_abs, pdf_path_abs)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Enhanced PDF export failed: {e}")
        # Fallback to basic export
        return await _fallback_export_pdf_libreoffice(request, task_id, pptx_path_abs, pdf_path_abs)


async def _fallback_export_pdf_libreoffice(
    request: Request,
    task_id: str,
    pptx_path_abs: str,
    pdf_path_abs: str
) -> FileResponse:
    """Fallback to LibreOffice PDF conversion"""
    try:
        import subprocess
        import shutil
        
        libreoffice_path = shutil.which('libreoffice') or shutil.which('soffice')
        
        if not libreoffice_path:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="PDF转换服务不可用，请安装 LibreOffice"
            )
        
        result = subprocess.run(
            [libreoffice_path, "--headless", "--convert-to", "pdf", "--outdir",
             os.path.dirname(pptx_path_abs), pptx_path_abs],
            capture_output=True,
            timeout=120
        )
        
        if result.returncode != 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="PDF转换失败"
            )
        
        # Rename to our target path
        expected_name = os.path.splitext(os.path.basename(pptx_path_abs))[0] + ".pdf"
        expected_path = os.path.join(os.path.dirname(pptx_path_abs), expected_name)
        
        if os.path.exists(expected_path) and expected_path != pdf_path_abs:
            shutil.move(expected_path, pdf_path_abs)
        
        if os.path.exists(pdf_path_abs):
            return FileResponse(
                path=str(pdf_path_abs),
                filename=f"presentation_{task_id}.pdf",
                media_type="application/pdf"
            )
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="PDF转换失败"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"LibreOffice fallback failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="PDF转换失败，请稍后重试"
        )


@router.get("/export/png/{task_id}")
async def export_png_sequence(
    request: Request,
    task_id: str,
    resolution: str = Query("1080p", description="分辨率: 720p, 1080p, 4K")
):
    """导出PNG图片序列（每页一张）"""
    rate_error = _check_rate_limit_middleware(request)
    if rate_error:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="请求过于频繁，请稍后再试"
        )

    task = get_task_manager().get_task(task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"任务 {task_id} 不存在"
        )

    if task["status"] != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="任务尚未完成"
        )

    result = task.get("result", {})
    svg_urls = result.get("svg_urls", [])

    if not svg_urls:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="没有可导出的幻灯片"
        )

    # 分辨率设置
    resolution_map = {
        "720p": (1280, 720),
        "1080p": (1920, 1080),
        "4K": (3840, 2160)
    }
    width, height = resolution_map.get(resolution, (1920, 1080))

    try:
        import zipfile
        import io
        import httpx

        # 下载所有SVG并转换为PNG
        png_files = []
        async with httpx.AsyncClient(timeout=30.0) as client:
            for i, svg_url in enumerate(svg_urls):
                # 构造完整URL
                if svg_url.startswith('/'):
                    svg_url = f"http://localhost:{settings.API_PORT}{svg_url}"

                resp = await client.get(svg_url)
                if resp.status_code != 200:
                    continue

                svg_content = resp.content

                # 使用 cairosvg 或内置转换
                try:
                    import cairosvg
                    png_data = cairosvg.svg2png(
                        bytestring=svg_content,
                        output_width=width,
                        output_height=height
                    )
                except ImportError:
                    # cairosvg 不可用，返回占位信息
                    png_data = None

                if png_data:
                    png_files.append((f"slide_{i+1:03d}.png", png_data))

        if not png_files:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="图片转换失败，请安装 cairosvg: pip install cairosvg"
            )

        # 打包为 ZIP
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
            for filename, data in png_files:
                zf.writestr(filename, data)

        zip_buffer.seek(0)

        return StreamingResponse(
            zip_buffer,
            media_type="application/zip",
            headers={
                "Content-Disposition": f"attachment; filename=slides_{resolution}_{task_id}.zip"
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"PNG导出失败: {str(e)}"
        )


# ==================== 模板列表 ====================

@router.get("/templates")
async def get_templates():
    """获取模板列表（重定向到真实 TemplateManager）"""
    manager = get_template_manager()
    templates = manager.list_templates()
    return [
        {
            "id": t.id,
            "name": t.name,
            "description": t.description,
            "category": t.category,
            "style": t.style,
            "thumbnail": t.thumbnail,
            "colors": t.colors,
            "fonts": t.fonts,
        }
        for t in templates
    ]


@router.post("/templates")
async def create_template(request: dict):
    """保存用户模板"""
    import uuid
    from datetime import datetime
    
    manager = get_template_manager()
    
    # 生成模板ID
    template_id = f"user_{uuid.uuid4().hex[:12]}"
    
    # 构建模板数据
    template_data = {
        "id": template_id,
        "name": request.get("name", "未命名模板"),
        "description": request.get("description", ""),
        "category": request.get("scene", "business"),
        "style": request.get("style", "professional"),
        "thumbnail": request.get("thumbnail", ""),
        "colors": request.get("colors", ["#165DFF", "#FFFFFF"]),
        "fonts": request.get("fonts", ["思源黑体", "Arial"]),
        "is_ugc": True,
        "author": "current_user",
        "visibility": request.get("visibility", "private"),
        "created_at": datetime.now().isoformat(),
        "layout": request.get("layout", {}),
        "applicable_scenes": request.get("applicable_scenes", []),
        "example": request.get("description", ""),
    }
    
    manager.add_user_template(template_data)
    
    return {"success": True, "template_id": template_id, "template": template_data}


@router.get("/templates/my")
async def get_my_templates():
    """获取当前用户的模板列表"""
    manager = get_template_manager()
    templates = manager.get_user_templates("current_user")
    return {
        "success": True,
        "templates": templates
    }


@router.delete("/templates/{template_id}")
async def delete_template(template_id: str):
    """删除用户模板"""
    manager = get_template_manager()
    
    # 检查是否是用户模板
    user_templates = manager.get_user_templates("current_user")
    if not any(t.get("id") == template_id for t in user_templates):
        return {"success": False, "error": "模板不存在或无权删除"}
    
    manager.remove_user_template(template_id)
    return {"success": True}


@router.patch("/templates/{template_id}")
async def update_template(template_id: str, request: dict):
    """更新/重命名用户模板"""
    manager = get_template_manager()
    
    # 检查是否是用户模板
    user_templates = manager.get_user_templates("current_user")
    if not any(t.get("id") == template_id for t in user_templates):
        return {"success": False, "error": "模板不存在或无权修改"}
    
    # 更新用户模板
    for i, t in enumerate(manager.user_templates):
        if t.get("id") == template_id:
            if "name" in request:
                manager.user_templates[i]["name"] = request["name"]
            if "description" in request:
                manager.user_templates[i]["description"] = request["description"]
            manager._save_user_templates()
            return {"success": True, "template": manager.user_templates[i]}
    
    return {"success": False, "error": "模板不存在"}


# ==================== PPT 内容搜索 ====================

class PPTSearchResult(BaseModel):
    task_id: str
    title: str
    slide_num: int
    matched_text: str
    context: str  # 前后文

class PPTSearchResponse(BaseModel):
    success: bool
    query: str
    total: int
    results: List[PPTSearchResult]


@router.post("/search", response_model=PPTSearchResponse)
async def search_ppt_content(
    http_request: Request,
    query: str = Body(..., embed=True),
    limit: int = Body(20, embed=True)
):
    """
    搜索 PPT 内容（在所有历史任务的幻灯片文本中搜索）
    
    Args:
        query: 搜索关键词
        limit: 最大返回结果数
    """
    if not query or len(query.strip()) < 2:
        return PPTSearchResponse(success=False, query=query, total=0, results=[])
    
    manager = get_task_manager()
    all_tasks = manager.get_history()
    
    results: List[PPTSearchResult] = []
    query_lower = query.lower().strip()
    
    for task_id, task in all_tasks.items():
        # 只搜索已完成的任务
        if task.get("status") != "completed":
            continue
        
        # 获取大纲中的幻灯片内容
        outline = task.get("outline")
        if not outline:
            continue
        
        slides = outline.get("slides", [])
        
        # 也检查 slides_summary
        if not slides:
            slides = task.get("result", {}).get("slides_summary", [])
        
        for idx, slide in enumerate(slides):
            title = slide.get("title", "") or ""
            content = slide.get("content", "") or ""
            combined = f"{title} {content}".lower()
            
            if query_lower in combined:
                # 提取匹配上下文
                idx_in_content = combined.find(query_lower)
                start = max(0, idx_in_content - 20)
                end = min(len(combined), idx_in_content + len(query) + 20)
                context = combined[start:end].strip()
                
                # 获取任务标题
                task_title = task.get("title", "") or task.get("request", "未命名PPT")[:50]
                
                results.append(PPTSearchResult(
                    task_id=task_id,
                    title=task_title,
                    slide_num=idx + 1,
                    matched_text=query,
                    context=f"...{context}..."
                ))
                
                if len(results) >= limit:
                    break
        
        if len(results) >= limit:
            break
    
    return PPTSearchResponse(
        success=True,
        query=query,
        total=len(results),
        results=results
    )


# ==================== 场景和风格 ====================

@router.get("/scenes")
async def get_scenes():
    """获取场景类型"""
    return [
        {"id": "business", "name": "商务", "description": "商业演示"},
        {"id": "education", "name": "教育", "description": "教学课件"},
        {"id": "tech", "name": "科技", "description": "技术分享"},
        {"id": "creative", "name": "创意", "description": "创意展示"},
        {"id": "marketing", "name": "营销", "description": "市场营销推广"},
        {"id": "finance", "name": "金融", "description": "金融财务报告"},
        {"id": "medical", "name": "医疗", "description": "医疗健康领域"},
        {"id": "government", "name": "政府", "description": "政府公文演示"}
    ]


@router.get("/styles")
async def get_styles():
    """获取风格类型"""
    return [
        {"id": "professional", "name": "专业", "description": "商务专业风格"},
        {"id": "simple", "name": "简约", "description": "简洁大方风格"},
        {"id": "energetic", "name": "活力", "description": "充满活力风格"},
        {"id": "premium", "name": "高端", "description": "高端大气风格"},
        {"id": "creative", "name": "创意", "description": "创意无限风格"},
        {"id": "fresh", "name": "清新", "description": "小清新风格"},
        {"id": "tech", "name": "科技", "description": "科技感风格"},
        {"id": "elegant", "name": "优雅", "description": "优雅精致风格"},
        {"id": "playful", "name": "活泼", "description": "活泼可爱风格"},
        {"id": "minimalist", "name": "极简", "description": "极简主义风格"}
    ]


# ==================== AI 生图 ====================

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
    images: List[str]
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
        from src.services.volc_api import get_volc_api
        from src.services.ppt_planner import sanitize_prompt
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


# ==================== PPT 大纲规划 ====================

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
    # 速率限制检查
    rate_error = _check_rate_limit_middleware(http_request)
    if rate_error:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="请求过于频繁，请稍后再试"
        )

    try:
        from src.services.ppt_planner import plan_ppt as plan_service, sanitize_prompt
        safe_request = sanitize_prompt(request.user_request)

        # P2 修复: 使用 threading.Thread 替代 asyncio.to_thread
        # asyncio.to_thread 在 Python 3.14 + uvicorn 下会永久挂住
        # BUG修复: 传递 scene 和 style 参数，让 AI 根据场景/风格生成不同大纲
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


@router.get("/outline/export/{task_id}")
async def export_outline_json(task_id: str):
    """导出大纲为 JSON（支持跨设备同步）"""
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
    """导入大纲 JSON（跨设备同步）- 返回模板，实际导入由 /outline/save 处理"""
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
    """保存导入的大纲 JSON 到任务"""
    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    outline = request.get("outline", request)
    tm.save_outline(task_id, outline)

    return {"success": True, "message": "大纲已保存"}


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
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/versions/{task_id}/{version_id}/rollback")
async def rollback_task_version(task_id: str, version_id: str):
    """回滚到指定版本"""
    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    try:
        return tm.rollback_version(task_id, version_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


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
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/versions/{task_id}/snapshot")
async def create_task_snapshot(task_id: str, name: str = None):
    """手动创建快照"""
    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    try:
        return tm.create_version(task_id, name)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


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
        raise HTTPException(status_code=404, detail=str(e))


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
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/versions/{task_id}/{version_id}/branch")
async def branch_from_version(task_id: str, version_id: str, name: str = None):
    """从指定版本创建分支"""
    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    try:
        result = tm.branch_version(task_id, version_id, name)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/autosave/{task_id}")
async def auto_save_state(task_id: str, state: dict = Body(...)):
    """保存自动保存状态（用于崩溃恢复）"""
    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    try:
        result = tm.auto_save(task_id, state)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/autosave/{task_id}")
async def get_auto_save_state(task_id: str):
    """获取自动保存状态"""
    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    try:
        result = tm.get_auto_save(task_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/regenerate/{task_id}/{slide_index}")
async def regenerate_single_slide(task_id: str, slide_index: int, request: Request):
    """重新生成某一页幻灯片
    
    Args:
        task_id: 任务ID
        slide_index: 页码（1-based）
        request: 包含 scene, style, content, layout 等参数
    """
    from ...services.task_manager import get_task_manager
    from ...services.ppt_generator import PPTGenerator
    from ...config import settings
    import os

    # 速率限制检查
    rate_error = _check_rate_limit_middleware(request)
    if rate_error:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="请求过于频繁，请稍后再试"
        )

    # 验证task_id格式
    if not re.match(r'^[a-zA-Z0-9_-]+$', task_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="无效的任务ID格式"
        )

    tm = get_task_manager()
    task = tm.get_task(task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"任务 {task_id} 不存在"
        )

    body = await request.json()
    scene = body.get("scene", "business")
    style = body.get("style", "professional")
    content = body.get("content", "")
    layout = body.get("layout", "content")
    title = body.get("title", f"第 {slide_index} 页")
    # applyTuning 可以覆盖 task params 中的 layout_mode 和 unified_layout
    # 当用户显式选择布局时，应使用 manual 模式 + 独立布局（每个slide用自己的）
    layout_mode_override = body.get("layout_mode", None)
    unified_layout_override = body.get("unified_layout", None)
    reset_first_layout = body.get("reset_first_layout", False)

    # 构建slide数据
    slide_data = {
        "title": title,
        "content": content,
        "slide_type": "title" if layout == "title" else "content",
        "layout": layout,
        "scene": scene,
        "style": style
    }

    # 调用PPTGenerator生成单页SVG
    gen = PPTGenerator()

    # BUG修复: 从 task["params"] 获取完整生成参数，不再使用硬编码
    task_params = task.get("params", {})
    theme_color = task_params.get("theme_color", "#165DFF")
    use_smart_layout = task_params.get("use_smart_layout", False)
    text_style = task_params.get("text_style", "transparent_overlay")
    shadow_color = task_params.get("shadow_color", "#000000")
    overlay_transparency = task_params.get("overlay_transparency", 30)
    font_title = task_params.get("font_title", "思源黑体")
    font_subtitle = task_params.get("font_subtitle", "思源黑体")
    font_content = task_params.get("font_content", "思源宋体")
    font_caption = task_params.get("font_caption", "思源黑体")
    layout_mode = task_params.get("layout_mode", "auto")
    unified_layout = task_params.get("unified_layout", True)
    # applyTuning 可以覆盖这些设置
    if layout_mode_override is not None:
        layout_mode = layout_mode_override
    if unified_layout_override is not None:
        unified_layout = unified_layout_override

    # 关键修复: 当 layout_mode='manual' 时，必须启用 smart_layout 才能使布局参数生效
    if layout_mode == 'manual' and not use_smart_layout:
        use_smart_layout = True
        logger.info(f"[regenerateSlide] layout_mode=manual, 强制启用 use_smart_layout")

    # 重置首页布局状态（applyTuning 时需要）
    if reset_first_layout:
        gen._first_page_layout = None

    try:
        if use_smart_layout:
            svg_code = gen._generate_svg_smart_layout(
                slide_data,
                slide_index,
                theme_color,
                style,
                layout,
                text_style=text_style,
                shadow_color=shadow_color,
                overlay_transparency=overlay_transparency,
                font_title=font_title,
                font_subtitle=font_subtitle,
                font_content=font_content,
                font_caption=font_caption,
                layout_mode=layout_mode,
                unified_layout=unified_layout
            )
        else:
            svg_code = gen._generate_svg(slide_data, slide_index)
        
        # 保存SVG文件到任务目录
        task_output_dir = os.path.join(settings.OUTPUT_DIR, task_id)
        os.makedirs(task_output_dir, exist_ok=True)
        svg_path = os.path.join(task_output_dir, f"slide_{slide_index}.svg")
        # 读取旧SVG内容用于撤销
        old_svg_content = None
        if os.path.exists(svg_path):
            with open(svg_path, 'r', encoding='utf-8') as f:
                old_svg_content = f.read()
        with open(svg_path, 'w', encoding='utf-8') as f:
            f.write(svg_code)
        # 记录操作日志
        tm.log_action(
            task_id,
            action_type="slide_regenerate",
            description=f"重生成第{slide_index}页",
            undo_data={"old_svg_content": old_svg_content, "slide_index": slide_index, "svg_path": svg_path}
        )
        
        # 重建PPTX（布局变化后需要更新）
        try:
            import glob
            svg_files = sorted(glob.glob(os.path.join(task_output_dir, "slide_*.svg")))
            if svg_files:
                pptx_path = os.path.join(task_output_dir, f"presentation_{task_id}.pptx")
                gen._svg_to_ppt(
                    svg_files, pptx_path,
                    text_style=task_params.get("text_style", "transparent_overlay"),
                    shadow_color=task_params.get("shadow_color", "#000000"),
                    overlay_transparency=task_params.get("overlay_transparency", 30),
                    use_smart_layout=use_smart_layout,
                    font_title=task_params.get("font_title", "微软雅黑"),
                    font_subtitle=task_params.get("font_subtitle", "微软雅黑"),
                    font_content=task_params.get("font_content", "微软宋体"),
                    font_caption=task_params.get("font_caption", "微软雅黑")
                )
                logger.info(f"PPTX已重建: {pptx_path}")
        except Exception as e:
            logger.warning(f"PPTX重建失败（SVG已更新）: {e}")
        
        return {
            "success": True,
            "data": {
                # BUG修复: 使用绝对URL而非相对路径，否则浏览器无法正确加载SVG
                "svg_url": f"{request.base_url}api/v1/ppt/svg/{task_id}/{slide_index}",
                "slide_index": slide_index
            },
            "message": "单页重生成成功"
        }
    except Exception as e:
        logger.error(f"单页重生成失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"重生成失败: {str(e)}"
        )


# ==================== 单页图片操作 ====================

class SlideImageRequest(BaseModel):
    """单页图片请求"""
    image_url: Optional[str] = Field(None, description="图片URL（用户上传或外部链接）")
    action: str = Field("set", description="操作类型: set=设置图片, remove=移除图片, regenerate=重新生成")


class SlideImageResponse(BaseModel):
    """单页图片响应"""
    success: bool
    image_url: Optional[str] = None
    message: str = ""


@router.put("/image/{task_id}/{slide_index}", response_model=SlideImageResponse)
async def update_slide_image(task_id: str, slide_index: int, request: SlideImageRequest):
    """更新单页幻灯片的图片

    Args:
        task_id: 任务ID
        slide_index: 页码（1-based）
        request: 包含 image_url 和 action
    """
    from ...services.task_manager import get_task_manager
    from ...services.ppt_generator import PPTGenerator
    from ...config import settings
    import os
    import shutil

    # 验证task_id格式
    if not re.match(r'^[a-zA-Z0-9_-]+$', task_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="无效的任务ID格式"
        )

    tm = get_task_manager()
    task = tm.get_task(task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"任务 {task_id} 不存在"
        )

    # 获取任务输出目录
    task_output_dir = os.path.join(settings.OUTPUT_DIR, task_id)
    os.makedirs(task_output_dir, exist_ok=True)

    # 处理不同操作
    if request.action == "remove":
        # 移除图片：设置为空，使用SVG占位图
        new_image_url = None
        message = "图片已移除"

    elif request.action == "regenerate":
        # 重新生成AI图片
        try:
            from ...services.content_generator import get_content_generator
            content_gen = get_content_generator()

            # 从任务参数获取提示词或使用默认提示词
            params = task.get("params", {})
            slides_content = params.get("slides_content", [])

            # 尝试找到该页的内容用于生成提示词
            slide_content = None
            if slides_content and slide_index <= len(slides_content):
                slide_content = slides_content[slide_index - 1]

            if slide_content:
                title = slide_content.get("title", "")
                content = slide_content.get("content", [])
                slide_type = slide_content.get("slide_type", "content")
                prompt = content_gen._build_image_prompt(title, content, slide_type)
            else:
                prompt = "Professional business presentation background, modern corporate style"

            image_url = content_gen.generate_image(prompt=prompt)
            if image_url:
                new_image_url = image_url
                message = "图片重新生成成功"
            else:
                raise Exception("AI图片生成失败")
        except Exception as e:
            logger.error(f"重新生成图片失败: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"重新生成图片失败: {str(e)}"
            )

    elif request.image_url:
        # 设置指定图片URL
        new_image_url = request.image_url
        message = "图片已更新"
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="无效的操作或图片URL"
        )

    # 更新slides_content中的图片（如果任务有该数据）
    try:
        params = task.get("params", {})
        slides_content = params.get("slides_content", [])
        if slides_content and slide_index <= len(slides_content):
            slides_content[slide_index - 1]["image_url"] = new_image_url
            params["slides_content"] = slides_content
            task["params"] = params
            tm.update_task(task_id, **task)
    except Exception as e:
        logger.warning(f"更新任务图片数据失败: {e}")

    # 重新生成该页SVG
    try:
        gen = PPTGenerator()
        if slides_content and slide_index <= len(slides_content):
            slide_data = slides_content[slide_index - 1]
            slide_data["image_url"] = new_image_url
        else:
            slide_data = {"title": f"第 {slide_index} 页", "content": [], "image_url": new_image_url}

        # 使用智能布局生成
        svg_code = gen._generate_svg_smart_layout(
            slide_data,
            slide_index,
            theme_color=params.get("theme_color", "#165DFF"),
            style=params.get("style", "professional"),
            user_layout=slide_data.get("layout"),
            text_style=params.get("text_style", "transparent_overlay"),
            layout_mode="auto",
            unified_layout=False
        )

        # 保存SVG
        svg_path = os.path.join(task_output_dir, f"slide_{slide_index}.svg")
        with open(svg_path, 'w', encoding='utf-8') as f:
            f.write(svg_code)

        # 重建PPTX
        import glob
        svg_files = sorted(glob.glob(os.path.join(task_output_dir, "slide_*.svg")))
        if svg_files:
            pptx_path = os.path.join(task_output_dir, f"presentation_{task_id}.pptx")
            gen._svg_to_ppt(
                svg_files, pptx_path,
                text_style=params.get("text_style", "transparent_overlay"),
                use_smart_layout=True,
                font_title=params.get("font_title", "微软雅黑"),
                font_subtitle=params.get("font_subtitle", "微软雅黑"),
                font_content=params.get("font_content", "微软雅黑"),
                font_caption=params.get("font_caption", "微软雅黑")
            )

        return SlideImageResponse(
            success=True,
            image_url=new_image_url,
            message=message
        )
    except Exception as e:
        logger.error(f"更新幻灯片图片失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"更新图片失败: {str(e)}"
        )


@router.post("/image/{task_id}/{slide_index}/upload", response_model=SlideImageResponse)
async def upload_slide_image(task_id: str, slide_index: int, request: Request):
    """上传单页幻灯片的图片

    Args:
        task_id: 任务ID
        slide_index: 页码（1-based）
    """
    from ...services.task_manager import get_task_manager
    from ...config import settings
    import uuid

    # 验证task_id格式
    if not re.match(r'^[a-zA-Z0-9_-]+$', task_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="无效的任务ID格式"
        )

    tm = get_task_manager()
    task = tm.get_task(task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"任务 {task_id} 不存在"
        )

    try:
        # 解析 multipart form data
        form = await request.form()
        file = form.get("file")

        if not file:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="未找到上传文件"
            )

        # 验证文件类型
        allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"不支持的文件类型: {file.content_type}"
            )

        # 保存文件
        task_output_dir = os.path.join(settings.OUTPUT_DIR, task_id)
        os.makedirs(task_output_dir, exist_ok=True)

        ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
        filename = f"slide_{slide_index}_image_{uuid.uuid4().hex[:8]}.{ext}"
        file_path = os.path.join(task_output_dir, filename)

        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)

        # 构建访问URL（相对路径）
        image_url = f"/api/v1/ppt/image/file/{task_id}/{filename}"

        # 递归调用 update_slide_image
        return await update_slide_image(
            task_id, slide_index,
            SlideImageRequest(image_url=image_url, action="set")
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"上传图片失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"上传图片失败: {str(e)}"
        )


# ==================== 批量操作 ====================

class BatchExportRequest(BaseModel):
    task_ids: List[str]
    format: str = Field(default="pptx", description="导出格式: pptx, pdf, png")
    quality: str = Field(default="high", description="导出质量: low, medium, high")


class BatchDeleteRequest(BaseModel):
    task_ids: List[str]


class BatchThemeRequest(BaseModel):
    task_ids: List[str]
    theme_primary: str = Field(default="#165DFF")
    theme_secondary: str = Field(default="#0E42D2")
    theme_accent: str = Field(default="#00C6FF")
    apply_to_all: bool = Field(default=True, description="是否应用到所有幻灯片")


class BatchGenerateRequest(BaseModel):
    outlines: List[GenerateRequest] = Field(..., description="多个大纲配置，并行生成")


@router.post("/batch/export")
async def batch_export_ppt(
    http_request: Request,
    request: BatchExportRequest
):
    """批量导出多个PPT为ZIP文件"""
    import zipfile
    import io
    import os

    rate_error = _check_rate_limit_middleware(http_request)
    if rate_error:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="请求过于频繁")

    tm = get_task_manager()
    valid_tasks = []
    missing = []

    for tid in request.task_ids:
        task = tm.get_task(tid)
        if not task:
            missing.append(tid)
            continue
        if task["status"] != "completed":
            missing.append(tid)
            continue
        result = task.get("result", {})
        file_path = result.get("pptx_path")
        if file_path and os.path.exists(file_path):
            valid_tasks.append((tid, task, file_path))

    if not valid_tasks:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"没有可导出的完成任务，有效: {len(valid_tasks)}, 缺失: {missing}"
        )

    # 创建ZIP
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for tid, task, file_path in valid_tasks:
            title = task.get("title", task.get("user_request", ""))[:50]
            safe_name = re.sub(r'[\\/:*?"<>|]', "_", title) or f"ppt_{tid[:8]}"
            ext = "pptx" if request.format == "pptx" else request.format
            arcname = f"{safe_name}_{tid[:8]}.{ext}"

            if request.format == "pptx":
                zf.write(file_path, arcname)
            elif request.format == "pdf":
                # 导出PDF需要转换，暂时用原PPTX
                zf.write(file_path, f"{safe_name}_{tid[:8]}.pptx")
            elif request.format == "png":
                # PNG序列暂不支持批量打包到ZIP，返回PPTX
                zf.write(file_path, f"{safe_name}_{tid[:8]}.pptx")

    zip_buffer.seek(0)
    return StreamingResponse(
        iter([zip_buffer.getvalue()]),
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename=batch_export_{len(valid_tasks)}ppts.zip"}
    )


@router.post("/batch/delete")
async def batch_delete_tasks(
    http_request: Request,
    request: BatchDeleteRequest
):
    """批量删除任务"""
    import os

    rate_error = _check_rate_limit_middleware(http_request)
    if rate_error:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="请求过于频繁")

    tm = get_task_manager()
    deleted = []
    errors = []

    for tid in request.task_ids:
        try:
            task = tm.get_task(tid)
            if not task:
                errors.append({"task_id": tid, "error": "任务不存在"})
                continue

            # 删除关联文件
            result = task.get("result", {})
            file_path = result.get("pptx_path")
            if file_path and os.path.exists(file_path):
                os.remove(file_path)

            # 删除任务
            tm.delete_task(tid)
            deleted.append(tid)
        except Exception as e:
            logger.error(f"删除任务 {tid} 失败: {e}")
            errors.append({"task_id": tid, "error": str(e)})

    return {
        "success": True,
        "deleted": deleted,
        "errors": errors,
        "summary": f"成功删除 {len(deleted)} 个任务，{len(errors)} 个失败"
    }


@router.post("/batch/apply-theme")
async def batch_apply_theme(
    http_request: Request,
    request: BatchThemeRequest
):
    """批量应用主题颜色到多个任务"""
    from ...services.theme_applier import apply_theme_to_task

    rate_error = _check_rate_limit_middleware(http_request)
    if rate_error:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="请求过于频繁")

    tm = get_task_manager()
    updated = []
    errors = []

    for tid in request.task_ids:
        try:
            task = tm.get_task(tid)
            if not task:
                errors.append({"task_id": tid, "error": "任务不存在"})
                continue

            apply_theme_to_task(
                task_id=tid,
                theme_primary=request.theme_primary,
                theme_secondary=request.theme_secondary,
                theme_accent=request.theme_accent
            )
            updated.append(tid)
        except Exception as e:
            logger.error(f"应用主题到任务 {tid} 失败: {e}")
            errors.append({"task_id": tid, "error": str(e)})

    return {
        "success": True,
        "updated": updated,
        "errors": errors,
        "summary": f"成功更新 {len(updated)} 个任务，{len(errors)} 个失败"
    }


@router.post("/generate/parallel", response_model=Dict[str, Any])
async def generate_parallel_ppt(
    http_request: Request,
    request: BatchGenerateRequest
):
    """并行生成多个PPT（接受多个大纲配置）"""
    import threading

    rate_error = _check_rate_limit_middleware(http_request)
    if rate_error:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="请求过于频繁")

    user_id = get_user_id_from_request(http_request)

    # 配额检查
    if len(request.outlines) > 5:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="单次最多并行5个任务")

    task_ids = []

    for idx, outline_req in enumerate(request.outlines):
        safe_request = outline_req.user_request

        task_id = get_task_manager().create_task(
            user_request=safe_request,
            slide_count=outline_req.slide_count,
            scene=outline_req.scene.value,
            style=outline_req.style.value,
            template=outline_req.template.value,
            theme_color=outline_req.theme_color
        )
        task_ids.append(task_id)

        get_task_manager().update_task_params(task_id, {
            "scene": outline_req.scene.value,
            "style": outline_req.style.value,
            "template": outline_req.template.value,
            "theme_color": outline_req.theme_color,
        })

        def run_generation(task_id=task_id, req=outline_req, idx=idx):
            import asyncio
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                result = loop.run_until_complete(
                    get_ppt_generator().generate(
                        task_id=task_id,
                        user_request=req.user_request,
                        slide_count=req.slide_count,
                        scene=req.scene.value,
                        style=req.style.value,
                        template=req.template.value,
                        theme_color=req.theme_color,
                        text_style=req.text_style.value,
                        shadow_color=req.shadow_color,
                        overlay_transparency=req.overlay_transparency,
                        use_smart_layout=req.use_smart_layout,
                        slide_backgrounds=req.slide_backgrounds,
                        slide_layouts=req.slide_layouts,
                        include_charts=req.include_charts,
                        include_pie_chart=req.include_pie_chart,
                        include_bar_chart=req.include_bar_chart,
                        include_line_chart=req.include_line_chart,
                        add_watermark=req.add_watermark,
                        font_title=req.font_title,
                        font_subtitle=req.font_subtitle,
                        font_content=req.font_content,
                        font_caption=req.font_caption,
                        generation_mode=req.generation_mode,
                        output_format=req.output_format,
                        quality=req.quality,
                        layout_mode=req.layout_mode,
                        unified_layout=req.unified_layout,
                        pre_generated_slides=req.pre_generated_slides
                    )
                )
            except Exception as e:
                logger.error(f"并行任务 {task_id} 生成失败: {e}")
                get_task_manager().fail_task(task_id, "GENERATION_ERROR", str(e))
            finally:
                loop.close()

        thread = threading.Thread(target=run_generation, daemon=True)
        thread.start()
        get_task_manager().register_async_task(task_id, thread)

    return {
        "success": True,
        "task_ids": task_ids,
        "count": len(task_ids),
        "message": f"已创建 {len(task_ids)} 个并行生成任务"
    }


# ==================== Import Endpoints ====================

@router.post("/import/pdf")
async def import_pdf(
    request: Request,
    file: UploadFile = File(...),
):
    """导入 PDF 文件，提取内容并转换为 PPT 大纲"""
    rate_error = _check_rate_limit_middleware(request)
    if rate_error:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="请求过于频繁")

    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="仅支持 PDF 文件")

    content = await file.read()
    if len(content) > 50 * 1024 * 1024:  # 50MB limit
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="文件大小不能超过 50MB")

    from ...services.import_service import get_import_service
    result = await get_import_service().import_pdf(content, file.filename)
    return result


@router.post("/import/docx")
async def import_docx(
    request: Request,
    file: UploadFile = File(...),
):
    """导入 Word 文件，提取内容并转换为 PPT 大纲"""
    rate_error = _check_rate_limit_middleware(request)
    if rate_error:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="请求过于频繁")

    allowed_exts = ['.docx', '.doc']
    ext = '.' + file.filename.lower().split('.')[-1] if '.' in file.filename else ''
    if ext not in allowed_exts:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="仅支持 Word 文件 (.docx, .doc)")

    content = await file.read()
    if len(content) > 50 * 1024 * 1024:  # 50MB limit
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="文件大小不能超过 50MB")

    from ...services.import_service import get_import_service
    result = await get_import_service().import_docx(content, file.filename)
    return result


class ImportURLRequest(BaseModel):
    url: str = Field(..., description="网页 URL")


@router.post("/import/url")
async def import_url(
    request: Request,
    body: ImportURLRequest,
):
    """导入网页内容，提取内容并转换为 PPT 大纲"""
    rate_error = _check_rate_limit_middleware(request)
    if rate_error:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="请求过于频繁")

    from ...services.import_service import get_import_service
    result = await get_import_service().import_url(body.url)
    return result


# ==================== Export Endpoints (Google Slides / Notion) ====================

class ExportGoogleSlidesRequest(BaseModel):
    title: str = Field(default="PPT Export", description="Google Slides 标题")


@router.post("/export/google-slides/{task_id}")
async def export_google_slides(
    request: Request,
    task_id: str,
    body: ExportGoogleSlidesRequest = None,
):
    """导出 PPT 到 Google Slides"""
    rate_error = _check_rate_limit_middleware(request)
    if rate_error:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="请求过于频繁")

    task = get_task_manager().get_task(task_id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"任务 {task_id} 不存在")

    if task["status"] != "completed":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="任务尚未完成")

    result = task.get("result", {})
    pptx_path = result.get("pptx_path")

    import os
    if not pptx_path or not os.path.exists(pptx_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PPTX 文件不存在")

    from ...services.export_service import get_export_service
    title = body.title if body else "PPT Export"
    export_result = await get_export_service().export_to_google_slides(task_id, pptx_path, title)
    return export_result


class ExportNotionRequest(BaseModel):
    title: str = Field(default="PPT Export", description="Notion 页面标题")
    slides_content: Optional[List[Dict[str, Any]]] = Field(default=None, description="幻灯片内容列表")


@router.post("/export/notion/{task_id}")
async def export_notion(
    request: Request,
    task_id: str,
    body: ExportNotionRequest = None,
):
    """导出 PPT 内容到 Notion"""
    rate_error = _check_rate_limit_middleware(request)
    if rate_error:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="请求过于频繁")

    task = get_task_manager().get_task(task_id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"任务 {task_id} 不存在")

    if task["status"] != "completed":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="任务尚未完成")

    result = task.get("result", {})
    pptx_path = result.get("pptx_path")

    import os
    if not pptx_path or not os.path.exists(pptx_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PPTX 文件不存在")

    from ...services.export_service import get_export_service
    title = "PPT Export"
    slides_content = None
    if body:
        title = body.title or title
        slides_content = body.slides_content

    export_result = await get_export_service().export_to_notion(task_id, pptx_path, title, slides_content)
    return export_result


# ==================== Advanced AI Features ====================

class SmartCopyRequest(BaseModel):
    source_slides: List[Dict[str, Any]] = Field(..., description="源PPT幻灯片列表")
    target_theme: str = Field(..., description="目标PPT主题")
    target_style: str = Field("professional", description="目标风格")
    target_page_count: int = Field(5, description="目标页数")


@router.post("/ai/smart-copy")
async def smart_copy(request: Request, body: SmartCopyRequest):
    """智能复制：分析源PPT内容，选择性迁移到目标主题"""
    rate_error = _check_rate_limit_middleware(request)
    if rate_error:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="请求过于频繁")

    from ...services.advanced_ai_features import get_advanced_ai_service
    result = get_advanced_ai_service().smart_copy(
        source_slides=body.source_slides,
        target_theme=body.target_theme,
        target_style=body.target_style,
        target_page_count=body.target_page_count
    )
    return result


class ExtendContentRequest(BaseModel):
    outline: List[Dict[str, Any]] = Field(..., description="简略大纲")
    topic: str = Field(..., description="PPT主题")
    audience: str = Field("商务人士", description="目标受众")
    style: str = Field("professional", description="风格")


@router.post("/ai/extend-content")
async def extend_content(request: Request, body: ExtendContentRequest):
    """AI内容扩展：将简略大纲扩展为详细的幻灯片内容"""
    rate_error = _check_rate_limit_middleware(request)
    if rate_error:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="请求过于频繁")

    from ...services.advanced_ai_features import get_advanced_ai_service
    result = get_advanced_ai_service().extend_content(
        outline=body.outline,
        topic=body.topic,
        audience=body.audience,
        style=body.style
    )
    return result


class SpeakerNotesRequest(BaseModel):
    slides: List[Dict[str, Any]] = Field(..., description="幻灯片列表（最多20页）")
    total_duration: int = Field(10, description="总演讲时长（分钟）")


@router.post("/ai/speaker-notes")
async def generate_speaker_notes(request: Request, body: SpeakerNotesRequest):
    """自动生成演讲者备注"""
    rate_error = _check_rate_limit_middleware(request)
    if rate_error:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="请求过于频繁")

    if len(body.slides) > 20:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="最多支持20页幻灯片")

    from ...services.advanced_ai_features import get_advanced_ai_service
    result = get_advanced_ai_service().generate_speaker_notes(
        slides=body.slides,
        total_duration=body.total_duration
    )
    return result


class DesignCheckRequest(BaseModel):
    slides: List[Dict[str, Any]] = Field(..., description="幻灯片列表（最多30页）")
    style_theme: str = Field("business", description="风格主题")
    brand_colors: Optional[List[str]] = Field(None, description="品牌配色")


@router.post("/ai/design-check")
async def check_design_consistency(request: Request, body: DesignCheckRequest):
    """设计一致性检查：扫描幻灯片的设计违规问题"""
    rate_error = _check_rate_limit_middleware(request)
    if rate_error:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="请求过于频繁")

    if len(body.slides) > 30:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="最多支持30页幻灯片")

    from ...services.advanced_ai_features import get_advanced_ai_service
    result = get_advanced_ai_service().check_design_consistency(
        slides=body.slides,
        style_theme=body.style_theme,
        brand_colors=body.brand_colors
    )
    return result


class ProfessionalPolishRequest(BaseModel):
    slides: List[Dict[str, Any]] = Field(..., description="幻灯片列表（最多20页）")
    target_style: str = Field("business", description="目标风格")
    use_case: str = Field("商务演示", description="使用场景")


@router.post("/ai/polish")
async def professional_polish(request: Request, body: ProfessionalPolishRequest):
    """一键专业优化：对PPT进行全方位的专业级优化"""
    rate_error = _check_rate_limit_middleware(request)
    if rate_error:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="请求过于频繁")

    if len(body.slides) > 20:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="最多支持20页幻灯片")

    from ...services.advanced_ai_features import get_advanced_ai_service
    result = get_advanced_ai_service().professional_polish(
        slides=body.slides,
        target_style=body.target_style,
        use_case=body.use_case
    )
    return result


# ─── Layout Suggestions API (R55) ─────────────────────────────────────────

@router.get("/layouts/suggest")
async def suggest_layouts(
    title: str = "",
    content: str = "",
):
    """
    智能布局推荐：根据幻灯片内容分析，推荐最佳布局
    
    分析内容类型（列表/对比/时间线/数据/金句等），返回多个布局建议
    """
    from ...services.smart_layout.content_analyzer import get_content_analyzer
    from ...services.smart_layout.layout_strategy import get_layout_strategy

    analyzer = get_content_analyzer()
    strategy = get_layout_strategy()

    # 分析内容
    analysis = analyzer.analyze(title, content)

    # 获取推荐布局
    primary_layout = strategy.select_layout({
        "type": analysis.type,
        "density": analysis.density,
        "element_count": analysis.element_count,
        "has_timeline": analysis.has_timeline,
        "has_comparison": analysis.has_comparison,
        "keywords": analysis.keywords,
    })

    # 获取备选布局
    suggestions = strategy.suggest_layouts_for_content({
        "type": analysis.type,
        "density": analysis.density,
        "element_count": analysis.element_count,
        "has_timeline": analysis.has_timeline,
        "has_comparison": analysis.has_comparison,
        "keywords": analysis.keywords,
    })

    # 构建布局详情
    layout_details = []
    all_layouts = strategy.get_all_layouts()
    for i, layout_type in enumerate(suggestions):
        layout_info = all_layouts.get(layout_type, all_layouts["content_card"])
        layout_details.append({
            "type": layout_type,
            "name": layout_info["name"],
            "description": layout_info["description"],
            "confidence": 1.0 - i * 0.2,  # 递减置信度
            "is_primary": i == 0,
        })

    return {
        "success": True,
        "content_type": analysis.type,
        "content_type_display": {
            "title_slide": "封面页",
            "content": "内容页",
            "quote": "金句页",
            "timeline": "时间线",
            "comparison": "对比页",
            "data": "数据页",
        }.get(analysis.type, "内容页"),
        "density": analysis.density,
        "element_count": analysis.element_count,
        "has_timeline": analysis.has_timeline,
        "has_comparison": analysis.has_comparison,
        "keywords": analysis.keywords,
        "primary_layout": primary_layout,
        "suggestions": layout_details,
    }


@router.get("/layouts/all")
async def get_all_layouts():
    """获取所有可用布局"""
    from ...services.smart_layout.layout_strategy import get_layout_strategy
    strategy = get_layout_strategy()
    all_layouts = strategy.get_all_layouts()
    
    layout_list = []
    for layout_type, info in all_layouts.items():
        layout_list.append({
            "type": layout_type,
            "name": info["name"],
            "description": info["description"],
            "typical_use": info.get("typical_use", []),
            "elements": info.get("elements", []),
        })
    
    return {"success": True, "layouts": layout_list}


# ─── Template Learning / Layout Preference Tracking (R55) ──────────────────

@router.post("/templates/preferences")
async def save_layout_preference(
    user_id: str = "anonymous",
    template_id: str = "",
    layout_type: str = "",
    content_type: str = "",
    scene: str = "",
    style: str = "",
    action: str = "apply",  # apply | dismiss | regenerate
):
    """
    记录用户的布局偏好（模板学习）
    
    当用户应用、忽略或重新生成布局时记录，帮助系统学习用户偏好
    """
    from ...services.search_analytics import get_user_history
    
    history = get_user_history()
    
    # 记录布局偏好
    history.record_layout_preference(
        user_id=user_id,
        template_id=template_id,
        layout_type=layout_type,
        content_type=content_type,
        scene=scene,
        style=style,
        action=action,
    )
    
    return {"success": True, "action": action}


@router.get("/templates/preferences")
async def get_layout_preferences(
    user_id: str = "anonymous",
    content_type: str = "",
    limit: int = 3,
):
    """
    获取用户的布局偏好（基于学习历史）
    """
    from ...services.search_analytics import get_user_history
    
    history = get_user_history()
    preferences = history.get_layout_preferences(
        user_id=user_id,
        content_type=content_type,
        limit=limit,
    )
    
    return {"success": True, "preferences": preferences, "user_id": user_id}
