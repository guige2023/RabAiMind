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
from ...core.http_client import http_client

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
    # R89 新参数
    show_animation: bool = Form(False),
    animation_type: str = Form("fade_in"),
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
            show_animation=show_animation,
            animation_type=animation_type,
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


# R89: 智能图表建议
@router.post("/chart/suggest")
async def suggest_chart_type(
    file: UploadFile = File(...),
):
    """
    R89: 根据上传的数据文件，智能推荐最佳图表类型
    - 分析数据特征（维度数量、数据范围、时间序列等）
    - 返回推荐图表类型及理由
    """
    try:
        content = await file.read()
        cg = ChartGenerator()
        df = cg.parse_file(content, file.filename)
        suggestion = cg.suggest_chart_type(df)
        return {
            "success": True,
            "suggestion": suggestion,
            "columns": cg.extract_columns(df)
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"智能图表建议失败: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"分析失败: {str(e)}")


# R89: 图表下钻数据
@router.post("/chart/drilldown")
async def get_chart_drilldown(
    file: UploadFile = File(...),
    label_col: str = Form(...),
    value_col: str = Form(...),
    label_value: str = Form(...),
    group_by: Optional[str] = Form(None),
):
    """
    R89: 获取图表数据点的下钻详情
    - label_value: 要下钻的具体行标签值
    - group_by: 可选的分组列
    返回该数据点的详细信息、与均值对比、分组数据
    """
    try:
        content = await file.read()
        cg = ChartGenerator()
        df = cg.parse_file(content, file.filename)
        drilldown = cg.get_drilldown_data(df, label_col, value_col, label_value, group_by)
        return drilldown
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"下钻数据获取失败: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"下钻失败: {str(e)}")


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
            "script_content_type": request.script_content_type.value if request.script_content_type else None,
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
async def download_ppt(
    request: Request,
    task_id: str,
    password: str = Query(default=""),
    biometric_token: str = Query(default=""),
):
    """下载 PPT 文件（支持密码保护和生物认证）"""
    # 速率限制检查
    rate_error = _check_rate_limit_middleware(request)
    if rate_error:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="请求过于频繁，请稍后再试"
        )

    # ---- Presentation Security Checks ----
    from ...core.security import get_presentation_security_manager, get_audit_logger
    security_mgr = get_presentation_security_manager()
    audit_logger = get_audit_logger()

    client_ip = request.headers.get("X-Forwarded-For", "").split(",")[0].strip() or \
                request.headers.get("X-Real-IP", "")

    # IP Allowlist check
    if not security_mgr.check_ip_allowed(task_id, client_ip):
        audit_logger.log(
            user_id="anonymous",
            role="anonymous",
            action="presentation:download_denied_ip",
            resource=task_id,
            extra={"client_ip": client_ip}
        )
        raise HTTPException(
            status_code=403,
            detail={"error": "IP_NOT_ALLOWED", "message": "您的IP地址不在允许范围内"}
        )

    # Biometric check
    if security_mgr.is_biometric_required(task_id):
        if not biometric_token:
            raise HTTPException(
                status_code=401,
                detail={"error": "BIOMETRIC_REQUIRED", "message": "此演示文稿需要生物认证才能下载"}
            )

    # Password check
    if security_mgr.has_password(task_id):
        if not password or not security_mgr.verify_password(task_id, password):
            audit_logger.log(
                user_id="anonymous",
                role="anonymous",
                action="presentation:download_denied_password",
                resource=task_id,
                extra={"client_ip": client_ip}
            )
            raise HTTPException(
                status_code=401,
                detail={"error": "PASSWORD_REQUIRED", "message": "此演示文稿需要密码才能下载"}
            )

    # Log access
    security_mgr.log_access(
        task_id=task_id,
        user_id="anonymous",
        action="downloaded",
        client_ip=client_ip,
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
    page_size: str = Field(default="A4", description="页面大小: A4 | Letter | 16:9 | 4:3 | 1:1 | 9:16")
    orientation: str = Field(default="landscape", description="方向: portrait | landscape")
    aspect_ratio: str = Field(default="16:9", description="幻灯片比例: 16:9 | 4:3 | 1:1 | 9:16")
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
        theme=options.theme,
        aspect_ratio=getattr(options, 'aspect_ratio', '16:9') or '16:9'
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
    resolution: str = Query("1080p", description="分辨率: 720p, 1080p, 4K"),
    watermark_enabled: bool = Query(False, description="启用水印"),
    watermark_text: str = Query("RabAiMind", description="水印文字"),
    watermark_opacity: float = Query(0.15, description="水印透明度 0-1"),
    watermark_angle: int = Query(-45, description="水印角度"),
    watermark_font_size: int = Query(48, description="水印字体大小"),
    watermark_color: str = Query("#888888", description="水印颜色"),
):
    """
    导出PNG图片序列（每页一张）

    支持水印功能，用于防截图保护。
    水印会绘制在每张幻灯片上，包含指定文字和样式。
    """
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

    # 水印辅助函数
    def apply_watermark_to_png(png_data: bytes, wm_text: str, wm_opacity: float,
                                wm_angle: int, wm_font_size: int, wm_color: str) -> bytes:
        """Apply diagonal watermark text to a PNG image using PIL."""
        try:
            from PIL import Image, ImageDraw, ImageFont
            import io as pil_io

            img = Image.open(pil_io.BytesIO(png_data)).convert("RGBA")
            overlay = Image.new("RGBA", img.size, (255, 255, 255, 0))
            draw = ImageDraw.Draw(overlay)

            # Parse color
            color_hex = wm_color.lstrip("#")
            r = int(color_hex[0:2], 16)
            g = int(color_hex[2:4], 16)
            b = int(color_hex[4:6], 16)
            wm_color_rgba = (r, g, b, int(255 * min(max(wm_opacity, 0), 1)))

            # Font size scaled to image
            scale_factor = img.width / 1920
            scaled_font_size = max(24, int(wm_font_size * scale_factor))

            try:
                font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", scaled_font_size)
            except Exception:
                font = ImageFont.load_default()

            # Calculate text size for tiling
            bbox = draw.textbbox((0, 0), wm_text, font=font)
            text_w = bbox[2] - bbox[0]
            text_h = bbox[3] - bbox[1]

            # Tile diagonal watermarks across the image
            spacing_x = int(text_w * 2.5)
            spacing_y = int(text_h * 3.0)

            import math
            angle_rad = math.radians(wm_angle)
            cos_a = abs(math.cos(angle_rad))
            sin_a = abs(math.sin(angle_rad))

            # Estimate rotated bounding box
            rotated_w = int(text_w * cos_a + text_h * sin_a)
            rotated_h = int(text_w * sin_a + text_h * cos_a)

            # Extend to cover full image diagonally
            diagonal = int(math.hypot(img.width, img.height))
            start_x = -diagonal
            end_x = img.width + diagonal
            start_y = -diagonal
            end_y = img.height + diagonal

            for y in range(start_y, end_y, spacing_y):
                for x in range(start_x, end_x, spacing_x):
                    # Rotate text
                    rotated_x = int(x * cos_a - y * sin_a)
                    rotated_y = int(x * sin_a + y * cos_a)
                    draw.text((rotated_x, rotated_y), wm_text, font=font, fill=wm_color_rgba)

            # Composite and convert back to RGB
            watermarked = Image.alpha_composite(img, overlay).convert("RGB")
            out_buf = pil_io.BytesIO()
            watermarked.save(out_buf, format="PNG")
            return out_buf.getvalue()
        except Exception as e:
            logger.warning(f"Watermark failed, returning original: {e}")
            return png_data

    try:
        import zipfile
        import io
        import httpx

        # 下载所有SVG并转换为PNG（使用共享连接池）
        png_files = []
        for i, svg_url in enumerate(svg_urls):
            # 构造完整URL
            if svg_url.startswith('/'):
                svg_url = f"http://localhost:{chr(123)}settings.API_PORT{chr(125)}{svg_url}"

            resp = await http_client.get(svg_url, timeout=httpx.Timeout(30.0))
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
                # Apply watermark if enabled
                if watermark_enabled:
                    png_data = apply_watermark_to_png(
                        png_data,
                        watermark_text,
                        watermark_opacity,
                        watermark_angle,
                        watermark_font_size,
                        watermark_color
                    )
                png_files.append((f"slide_{chr(123)}i+1:03d{chr(125)}.png", png_data))

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
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/checkpoints/{task_id}")
async def create_checkpoint(task_id: str, name: str = None, checkpoint_type: str = "auto"):
    """创建检查点（用于自动保存，每5分钟）"""
    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    try:
        result = tm.create_checkpoint(task_id, name, checkpoint_type)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


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
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/collaborative-lock/{task_id}")
async def acquire_collaborative_lock(task_id: str, user_id: str, slide_index: int = None):
    """获取协作编辑锁"""
    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    try:
        result = tm.acquire_collaborative_lock(task_id, user_id, slide_index)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/collaborative-lock/{task_id}")
async def release_collaborative_lock(task_id: str, user_id: str, slide_index: int = None):
    """释放协作编辑锁"""
    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    try:
        result = tm.release_collaborative_lock(task_id, user_id, slide_index)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/collaborative-locks/{task_id}")
async def get_collaborative_locks(task_id: str):
    """获取当前协作锁状态"""
    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    return tm.get_collaborative_locks(task_id)


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
        raise HTTPException(status_code=404, detail=str(e))


# ========== 版本标签 ==========

@router.post("/versions/{task_id}/{version_id}/tag")
async def add_version_tag(task_id: str, version_id: str, tag: str = Body(..., description="标签名称")):
    """为版本添加标签"""
    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    try:
        result = tm.add_version_tag(task_id, version_id, tag)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/versions/{task_id}/{version_id}/tag/{tag}")
async def remove_version_tag(task_id: str, version_id: str, tag: str):
    """移除版本的标签"""
    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    try:
        result = tm.remove_version_tag(task_id, version_id, tag)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


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
    # 速率限制检查
    rate_error = _check_rate_limit_middleware(request)
    if rate_error:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="请求过于频繁，请稍后再试"
        )

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


# ========== 自动版本化 ==========

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


# ==================== Google Slides Import ====================

class ImportGoogleSlidesRequest(BaseModel):
    presentation_url: str = Field(..., description="Google Slides 分享链接或 presentation ID")
    access_token: Optional[str] = Field(None, description="OAuth access token (可选，有则用API导入)")


@router.post("/import/google-slides")
async def import_google_slides(
    request: Request,
    body: ImportGoogleSlidesRequest,
):
    """导入 Google Slides 内容并转换为 PPT 大纲"""
    rate_error = _check_rate_limit_middleware(request)
    if rate_error:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="请求过于频繁")

    from ...services.import_service import get_import_service
    result = await get_import_service().import_google_slides(
        body.presentation_url,
        body.access_token
    )
    return result


# ==================== Pinterest/Canopy Import ====================

class ImportPinterestRequest(BaseModel):
    board_url: str = Field(..., description="Pinterest board URL or user profile URL")
    access_token: Optional[str] = Field(None, description="Pinterest OAuth access token")


@router.post("/import/pinterest")
async def import_pinterest(
    request: Request,
    body: ImportPinterestRequest,
):
    """导入 Pinterest/Canopy board 内容并转换为 PPT 大纲"""
    rate_error = _check_rate_limit_middleware(request)
    if rate_error:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="请求过于频繁")

    from ...services.import_service import get_import_service
    result = await get_import_service().import_pinterest(
        body.board_url,
        body.access_token
    )
    return result



# ==================== Notion Import ====================

class ImportNotionRequest(BaseModel):
    page_url: str = Field(..., description="Notion 页面分享链接或 page ID")
    access_token: Optional[str] = Field(None, description="Notion Integration Token (ntn_xxx)")


@router.post("/import/notion")
async def import_notion(
    request: Request,
    body: ImportNotionRequest,
):
    """导入 Notion 页面内容并转换为 PPT 大纲"""
    rate_error = _check_rate_limit_middleware(request)
    if rate_error:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="请求过于频繁")

    if not body.page_url.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="请提供 Notion 页面链接")

    from ...services.import_service import get_import_service
    result = await get_import_service().import_notion(
        body.page_url,
        body.access_token
    )
    return result


# ==================== Google Docs Import ====================

class ImportGoogleDocsRequest(BaseModel):
    doc_url: str = Field(..., description="Google Docs 文档链接或 document ID")
    access_token: Optional[str] = Field(None, description="Google OAuth access token")


@router.post("/import/google-docs")
async def import_google_docs(
    request: Request,
    body: ImportGoogleDocsRequest,
):
    """导入 Google Docs 文档内容并转换为 PPT 大纲"""
    rate_error = _check_rate_limit_middleware(request)
    if rate_error:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="请求过于频繁")

    if not body.doc_url.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="请提供 Google Docs 链接")

    from ...services.import_service import get_import_service
    result = await get_import_service().import_google_docs(
        body.doc_url,
        body.access_token
    )
    return result



# ==================== Images Import ====================

class ImportImagesRequest(BaseModel):
    titles: Optional[List[str]] = Field(None, description="每张图片对应的标题列表")
    captions: Optional[List[str]] = Field(None, description="每张图片对应的描述列表")
    layout: str = Field(default="center", description="布局: center, left_image_right_text, left_text_right_image")
    scene: str = Field(default="general", description="场景类型")
    style: str = Field(default="professional", description="风格类型")


@router.post("/import/images")
async def import_images(
    request: Request,
    files: List[UploadFile] = File(...),
    titles: Optional[List[str]] = Form(None),
    captions: Optional[List[str]] = Form(None),
    layout: str = Form("center"),
    scene: str = Form("general"),
    style: str = Form("professional"),
):
    """导入 JPG/PNG 图片，转换为 PPT 大纲（每张图片一页）"""
    rate_error = _check_rate_limit_middleware(request)
    if rate_error:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="请求过于频繁")

    if not files:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="请上传至少一张图片")

    if len(files) > 50:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="最多支持 50 张图片")

    allowed_exts = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
    for f in files:
        ext = "." + f.filename.lower().split(".")[-1] if f.filename and "." in f.filename else ""
        if ext not in allowed_exts:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"仅支持图片格式: JPG, PNG, GIF, WEBP (文件 {f.filename} 不支持)"
            )

    # Read all image bytes
    image_data_list = []
    for f in files:
        content = await f.read()
        if len(content) > 20 * 1024 * 1024:  # 20MB per image
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"图片 {f.filename} 超过 20MB")
        image_data_list.append((f.filename or "image.jpg", content))

    from ...services.import_service import get_import_service
    result = await get_import_service().import_images(
        image_data_list=image_data_list,
        titles=titles,
        captions=captions,
        layout=layout,
        scene=scene,
        style=style
    )
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


# ─── R148: AI Script Content Generation 2.0 ────────────────────────────────

class ScriptContentRequest(BaseModel):
    content_type: str = Field(..., description="内容类型: story_arc, data_story, persuasion, audience_persona, competitor_analysis")
    topic: str = Field(..., description="PPT主题")
    scene: str = Field(default="business", description="场景类型")
    slide_count: int = Field(default=10, ge=3, le=30, description="幻灯片数量")
    audience: str = Field(default="", description="目标受众描述")
    brief_description: str = Field(default="", description="Brief描述（竞品分析用）")


@router.post("/ai/script-content")
async def generate_script_content(request: Request, body: ScriptContentRequest):
    """R148: AI脚本内容生成 - 5种高级内容生成模式"""
    rate_error = _check_rate_limit_middleware(request)
    if rate_error:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="请求过于频繁")

    from ...services.script_content_service import get_script_content_service
    result = get_script_content_service().generate(
        content_type=body.content_type,
        topic=body.topic,
        scene=body.scene,
        slide_count=body.slide_count,
        audience=body.audience,
        brief_description=body.brief_description
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


# ─── Auto-Theme Suggestion API (R145) ───────────────────────────────────────

@router.get("/theme/suggest")
async def suggest_theme(
    content: str = "",
    title: str = "",
    scene: str = "",
    style: str = "",
):
    """
    智能主题推荐：根据内容上下文自动推荐最佳主题配色

    分析内容类型、行业领域和情感基调，返回推荐的主题配色方案
    """
    from ...services.smart_layout.content_analyzer import get_content_analyzer
    from ...services.smart_layout.color_scheme import get_color_scheme_generator

    # 分析内容类型
    analyzer = get_content_analyzer()
    analysis = analyzer.analyze(title or "", content or "")

    # 行业/场景关键词映射到主题
    SCENE_THEME_MAP = {
        "科技": {"primary": "#165DFF", "secondary": "#0E42D2", "accent": "#64D2FF", "style": "tech"},
        "商务": {"primary": "#165DFF", "secondary": "#364FC7", "accent": "#FF7D00", "style": "professional"},
        "金融": {"primary": "#1A1A2E", "secondary": "#165DFF", "accent": "#C6A87C", "style": "premium"},
        "教育": {"primary": "#34C759", "secondary": "#248A3D", "accent": "#FF9500", "style": "nature"},
        "医疗": {"primary": "#00B96B", "secondary": "#00875A", "accent": "#64D2FF", "style": "simple"},
        "创意": {"primary": "#722ED1", "secondary": "#EB2F96", "accent": "#13C2C2", "style": "creative"},
        "时尚": {"primary": "#FF2D55", "secondary": "#C41E3A", "accent": "#FFD60A", "style": "elegant"},
        "餐饮": {"primary": "#FF9500", "secondary": "#CC7A00", "accent": "#FF3B30", "style": "energetic"},
        "旅游": {"primary": "#007AFF", "secondary": "#0055CC", "accent": "#5AC8FA", "style": "nature"},
        "地产": {"primary": "#C6A87C", "secondary": "#8B7355", "accent": "#D4AF37", "style": "premium"},
        "互联网": {"primary": "#165DFF", "secondary": "#00B96B", "accent": "#FF7D00", "style": "tech"},
        "人工智能": {"primary": "#5856D6", "secondary": "#3634A3", "accent": "#BF5AF2", "style": "tech"},
        "创业": {"primary": "#FF9500", "secondary": "#FF3B30", "accent": "#FFD60A", "style": "energetic"},
        "企业": {"primary": "#165DFF", "secondary": "#364FC7", "accent": "#00B96B", "style": "professional"},
        "政府": {"primary": "#165DFF", "secondary": "#1A1A2E", "accent": "#FF3B30", "style": "professional"},
        "公益": {"primary": "#34C759", "secondary": "#30D158", "accent": "#FFD60A", "style": "nature"},
    }

    # 内容类型关键词
    CONTENT_THEME_MAP = {
        "title_slide": {"primary": "#165DFF", "secondary": "#0E42D2", "accent": "#C6A87C", "style": "premium"},
        "quote": {"primary": "#AF52DE", "secondary": "#5E5CE6", "accent": "#BF5AF2", "style": "elegant"},
        "timeline": {"primary": "#5856D6", "secondary": "#3634A3", "accent": "#FF9500", "style": "tech"},
        "comparison": {"primary": "#165DFF", "secondary": "#FF3B30", "accent": "#34C759", "style": "professional"},
        "data": {"primary": "#165DFF", "secondary": "#00B96B", "accent": "#FF7D00", "style": "simple"},
        "content": {"primary": "#165DFF", "secondary": "#364FC7", "accent": "#FF7D00", "style": "professional"},
    }

    # 基于场景优先匹配
    matched_theme = None
    if scene:
        for key, theme in SCENE_THEME_MAP.items():
            if key in scene:
                matched_theme = theme
                break

    # 基于内容关键词匹配
    if not matched_theme:
        scene_text = f"{scene} {title} {content}"
        for key, theme in SCENE_THEME_MAP.items():
            if key in scene_text:
                matched_theme = theme
                break

    # 基于内容类型兜底
    if not matched_theme:
        matched_theme = CONTENT_THEME_MAP.get(
            analysis.type,
            CONTENT_THEME_MAP["content"]
        )

    # 用户指定风格优先
    if style and style != "auto":
        color_gen = get_color_scheme_generator()
        palette = color_gen.get_palette(style)
        matched_theme = {
            "primary": palette.primary,
            "secondary": palette.secondary,
            "accent": palette.accent,
            "style": style,
        }

    # 构建推荐理由
    reasons = []
    if analysis.type != "content":
        reasons.append(f"内容类型「{analysis.type}」适合此配色")
    if scene:
        reasons.append(f"场景「{scene}」推荐此配色")
    if analysis.keywords:
        reasons.append(f"关键词：{', '.join(analysis.keywords[:3])}")

    return {
        "success": True,
        "theme": {
            "primary": matched_theme["primary"],
            "secondary": matched_theme["secondary"],
            "accent": matched_theme["accent"],
            "style": matched_theme["style"],
            "name": _get_theme_style_name_api(matched_theme["style"]),
        },
        "content_analysis": {
            "type": analysis.type,
            "keywords": analysis.keywords[:5],
            "density": analysis.density,
        },
        "reasons": reasons,
    }


def _get_theme_style_name_api(style: str) -> str:
    """获取主题风格的中文名称"""
    names = {
        "professional": "专业商务",
        "creative": "创意活力",
        "simple": "简约现代",
        "tech": "科技未来",
        "premium": "高端大气",
        "nature": "自然清新",
        "energetic": "活力动感",
        "elegant": "优雅知性",
    }
    return names.get(style, style)


# ==================== Additional Export Formats ====================

class ExportOdpRequest(BaseModel):
    """ODP export options"""
    pass


@router.get("/export/odp/{task_id}")
async def export_odp(
    request: Request,
    task_id: str,
):
    """导出 PPT 到 ODP (OpenDocument) 格式"""
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

    if not pptx_path or not os.path.exists(pptx_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PPTX 文件不存在")

    # Validate path
    output_dir = os.path.realpath(settings.OUTPUT_DIR)
    pptx_path_abs = os.path.realpath(pptx_path)
    if not pptx_path_abs.startswith(output_dir):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="文件路径不安全")

    # Generate ODP path
    odp_filename = f"presentation_{task_id}.odp"
    odp_path_abs = os.path.join(os.path.dirname(pptx_path_abs), odp_filename)

    from src.services.additional_export_service import get_additional_export_service
    export_service = get_additional_export_service()
    
    export_result = await export_service.export_to_odp(task_id, pptx_path_abs, odp_path_abs)
    
    if not export_result.get("success"):
        return JSONResponse(content=export_result, status_code=500)
    
    # Return file as download
    if os.path.exists(odp_path_abs):
        return FileResponse(
            path=str(odp_path_abs),
            filename=odp_filename,
            media_type="application/vnd.oasis.opendocument.presentation"
        )
    
    return JSONResponse(content=export_result)


class ExportKeynoteRequest(BaseModel):
    """Keynote export options"""
    pass


@router.get("/export/keynote/{task_id}")
async def export_keynote(
    request: Request,
    task_id: str,
):
    """导出 PPT 到 Keynote (.key) 格式"""
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

    if not pptx_path or not os.path.exists(pptx_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PPTX 文件不存在")

    # Validate path
    output_dir = os.path.realpath(settings.OUTPUT_DIR)
    pptx_path_abs = os.path.realpath(pptx_path)
    if not pptx_path_abs.startswith(output_dir):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="文件路径不安全")

    # Generate Keynote path
    key_filename = f"presentation_{task_id}.key.zip"
    key_path_abs = os.path.join(os.path.dirname(pptx_path_abs), key_filename)

    from src.services.additional_export_service import get_additional_export_service
    export_service = get_additional_export_service()
    
    export_result = await export_service.export_to_keynote(task_id, pptx_path_abs, key_path_abs)
    
    if not export_result.get("success"):
        return JSONResponse(content=export_result, status_code=500)
    
    # Return file as download
    output_file = export_result.get("output_path", key_path_abs)
    if os.path.exists(output_file):
        return FileResponse(
            path=str(output_file),
            filename=key_filename,
            media_type="application/zip"
        )
    
    return JSONResponse(content=export_result)


class ExportAudioRequest(BaseModel):
    """Audio export options"""
    voice: str = Field(default="zh-CN-XiaoxiaoNeural", description="edge-tts 语音")
    rate: str = Field(default="+0%", description="语速调整")
    volume: str = Field(default="+0%", description="音量调整")
    slides_content: Optional[List[Dict[str, Any]]] = Field(default=None, description="幻灯片内容列表")


@router.post("/export/audio/{task_id}")
async def export_audio(
    request: Request,
    task_id: str,
    body: ExportAudioRequest,
):
    """导出 PPT 叙述为 MP3 音频"""
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

    if not pptx_path or not os.path.exists(pptx_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PPTX 文件不存在")

    # Validate path
    output_dir = os.path.realpath(settings.OUTPUT_DIR)
    pptx_path_abs = os.path.realpath(pptx_path)
    if not pptx_path_abs.startswith(output_dir):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="文件路径不安全")

    # Generate MP3 path
    mp3_filename = f"presentation_{task_id}.mp3"
    mp3_path_abs = os.path.join(os.path.dirname(pptx_path_abs), mp3_filename)

    from src.services.additional_export_service import get_additional_export_service
    export_service = get_additional_export_service()
    
    # Use provided slides_content or try to get from task
    slides_content = body.slides_content if body else None
    if not slides_content:
        slides_content = result.get("slides_content")
    
    voice = "zh-CN-XiaoxiaoNeural"
    rate = "+0%"
    volume = "+0%"
    if body:
        voice = body.voice or voice
        rate = body.rate or rate
        volume = body.volume or volume
    
    export_result = await export_service.export_to_mp3(
        task_id, pptx_path_abs, mp3_path_abs,
        slides_content=slides_content,
        voice=voice, rate=rate, volume=volume
    )
    
    if not export_result.get("success"):
        return JSONResponse(content=export_result, status_code=500)
    
    # Return file as download
    output_file = export_result.get("output_path", mp3_path_abs)
    if os.path.exists(output_file):
        return FileResponse(
            path=str(output_file),
            filename=mp3_filename,
            media_type="audio/mpeg"
        )
    
    return JSONResponse(content=export_result)


# ==================== Video Export (MP4) ====================

class ExportVideoRequest(BaseModel):
    transition: str = Field(default="fade", description="过渡效果: fade, slide, zoom, none")
    duration_per_slide: int = Field(default=3, description="每页持续时间（秒）", ge=1, le=30)
    resolution: str = Field(default="1080p", description="分辨率: 720p, 1080p, 4k")
    include_audio: bool = Field(default=False, description="是否包含语音旁白")
    voice: str = Field(default="zh-CN-XiaoxiaoNeural", description="旁白语音")
    slide_range: Optional[str] = Field(None, description="页码范围，如 '1-10' 或 'all'")


@router.post("/export/video/{task_id}")
async def export_video(
    request: Request,
    task_id: str,
    body: ExportVideoRequest,
):
    """导出 PPT 为 MP4 视频，包含过渡动画和定时"""
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

    output_dir = os.path.realpath(settings.OUTPUT_DIR)
    pptx_path_abs = os.path.realpath(pptx_path)
    if not pptx_path_abs.startswith(output_dir):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="文件路径不安全")

    video_filename = f"presentation_{task_id}.mp4"
    video_path_abs = os.path.join(os.path.dirname(pptx_path_abs), video_filename)

    from src.services.additional_export_service import get_additional_export_service
    export_service = get_additional_export_service()

    # Get slides content for narration
    slides_content = None
    if body.include_audio:
        outline = result.get("outline", {})
        if isinstance(outline, dict):
            slides_content = outline.get("slides", [])

    export_result = await export_service.export_to_video(
        task_id, pptx_path_abs, video_path_abs,
        transition=body.transition,
        duration_per_slide=body.duration_per_slide,
        resolution=body.resolution,
        include_audio=body.include_audio,
        slides_content=slides_content,
        voice=body.voice,
        slide_range=body.slide_range
    )

    if not export_result.get("success"):
        return JSONResponse(content=export_result, status_code=500)

    output_file = export_result.get("output_path", video_path_abs)
    if os.path.exists(output_file):
        return FileResponse(
            path=str(output_file),
            filename=video_filename,
            media_type="video/mp4"
        )

    return JSONResponse(content=export_result)


# ==================== Embed Widget API ====================

class EmbedConfigRequest(BaseModel):
    embed_type: str = Field(..., description="Type: iframe, floating_button, inline_preview, analytics, pixel, lead_capture")
    width: Optional[str] = "100%"
    height: Optional[str] = "600px"
    theme: Optional[str] = "light"  # light, dark, auto
    position: Optional[str] = "bottom-right"  # for floating button
    analytics_token: Optional[str] = None
    show_controls: Optional[bool] = True
    auto_slide: Optional[int] = 0  # 0 = disabled, seconds per slide
    start_slide: Optional[int] = 1
    lead_form_title: Optional[str] = "订阅更新"  # title for lead capture form
    lead_button_text: Optional[str] = "立即订阅"  # button text for lead capture


@router.get("/embed/{task_id}")
async def get_embed_config(request: Request, task_id: str):
    """Get embed configuration for a presentation"""
    user_id = get_user_id_from_request(request) or "anonymous"
    base_url = str(request.base_url).rstrip("/")
    
    return JSONResponse({
        "success": True,
        "embed_url": f"{base_url}/embed/{task_id}/viewer",
        "full_url": f"{base_url}/result?taskId={task_id}",
        "task_id": task_id,
        "available_themes": ["light", "dark", "auto"],
        "available_sizes": {
            "small": {"width": "320px", "height": "240px"},
            "medium": {"width": "640px", "height": "480px"},
            "large": {"width": "960px", "height": "720px"},
            "full": {"width": "100%", "height": "100vh"}
        }
    })


@router.post("/embed/{task_id}/generate")
async def generate_embed_code(request: Request, task_id: str, config: EmbedConfigRequest):
    """Generate embed code snippet for a presentation"""
    user_id = get_user_id_from_request(request) or "anonymous"
    base_url = str(request.base_url).rstrip("/")
    
    embed_url = f"{base_url}/embed/{task_id}/viewer"
    full_url = f"{base_url}/result?taskId={task_id}"
    
    if config.embed_type == "iframe":
        code = f'''<iframe 
  src="{embed_url}?theme={config.theme or "light"}&controls={str(config.show_controls).lower()}&auto_slide={config.auto_slide or 0}&start={config.start_slide or 1}"
  width="{config.width or "100%"}"
  height="{config.height or "600px"}"
  frameborder="0"
  allowfullscreen
  style="border-radius: 8px; box-shadow: 0 4px 24px rgba(0,0,0,0.12);"
></iframe>'''
    
    elif config.embed_type == "floating_button":
        position = config.position or "bottom-right"
        code = f'''<script>
(function() {{
  var btn = document.createElement('div');
  btn.id = 'rabai-fab-{task_id}';
  btn.innerHTML = '<svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="28" cy="28" r="28" fill="#165DFF"/><path d="M18 28h20M28 18v20" stroke="white" stroke-width="3" stroke-linecap="round"/></svg>';
  btn.style.cssText = 'position:fixed;{position}:24px;bottom:24px;cursor:pointer;z-index:99999;border:none;background:none;box-shadow:0 4px 16px rgba(22,93,255,0.4);border-radius:50%;transition:transform .2s;width:56px;height:56px;';
  btn.onmouseover = function(){{ this.style.transform='scale(1.1)'; }};
  btn.onmouseout = function(){{ this.style.transform='scale(1)'; }};
  btn.onclick = function(){{ window.open("{full_url}", "_blank"); }};
  document.body.appendChild(btn);
}})();
</script>'''
    
    elif config.embed_type == "inline_preview":
        code = f'''<div class="rabai-inline-preview" data-task="{task_id}" data-theme="{config.theme or "light"}" style="max-width:{config.width or "960px"};margin:0 auto;">
  <div style="aspect-ratio:16/9;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:12px;display:flex;align-items:center;justify-content:center;cursor:pointer;" onclick="window.open('{full_url}','_blank')">
    <div style="text-align:center;color:white;">
      <div style="font-size:32px;margin-bottom:8px;">📊</div>
      <div style="font-size:14px;font-weight:600;">点击查看完整演示</div>
    </div>
  </div>
</div>'''
    
    elif config.embed_type == "analytics":
        analytics_id = config.analytics_token or f"tk_{task_id[:8]}"
        code = f'''<script async src="{base_url}/static/analytics-widget.js" data-presentation="{task_id}" data-token="{analytics_id}"></script>
<div id="rabai-analytics-{task_id[:8]}" class="rabai-analytics-widget" style="font-family:system-ui;background:#f8f9fa;border-radius:8px;padding:16px;max-width:{config.width or "400px"};">
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
    <span style="font-size:20px;">📊</span>
    <strong style="font-size:14px;">演示分析</strong>
    <span style="margin-left:auto;font-size:11px;color:#888;">rabai.com</span>
  </div>
  <div id="rabai-stats-{task_id[:8]}" style="font-size:12px;color:#555;">
    正在加载统计数据...
  </div>
</div>
<script>
(function() {{
  var pid = "{task_id}";
  var token = "{analytics_id}";
  var el = document.getElementById("rabai-stats-" + pid.slice(0,8));
  if (!el) return;
  fetch("/{task_id}/analytics").then(function(r) {{ return r.json(); }}).then(function(data) {{
    if (data.success) {{
      el.innerHTML = '<div style="margin:4px 0;"><span style="color:#888;">👁 总浏览</span> <strong>' + (data.total_views||0) + '</strong></div><div style="margin:4px 0;"><span style="color:#888;">⏱ 平均停留</span> <strong>' + Math.round(data.avg_duration||0) + 's</strong></div>';
    }}
  }}).catch(function() {{ el.innerHTML = '<span style="color:#aaa;">暂无数据</span>'; }});
}})();
</script>'''
    
    elif config.embed_type == "pixel":
        pixel_id = config.analytics_token or f"px_{task_id[:8]}"
        code = f'''<script>
(function() {{
  var p = document.createElement('img');
  p.src = '{base_url}/api/v1/engagement/pixel/{task_id}/track?pixel_id={pixel_id}&t=' + new Date().getTime();
  p.width = 1; p.height = 1; p.style.display = 'none';
  p.alt = '';
  document.body.appendChild(p);
}})();
</script>
<noscript>
<img src="{base_url}/api/v1/engagement/pixel/{task_id}/track?pixel_id={pixel_id}&noscript=1" width="1" height="1" style="display:none;"/>
</noscript>'''
    
    elif config.embed_type == "lead_capture":
        form_title = config.lead_form_title or "订阅更新"
        btn_text = config.lead_button_text or "立即订阅"
        code = f'''<div id="rabai-lead-{task_id[:8]}" style="font-family:system-ui;background:#fff;border-radius:12px;padding:24px;max-width:{config.width or "400px"};margin:0 auto;box-shadow:0 2px 12px rgba(0,0,0,0.1);">
  <div style="text-align:center;margin-bottom:16px;">
    <div style="font-size:24px;margin-bottom:8px;">📬</div>
    <div style="font-size:16px;font-weight:600;color:#333;">{form_title}</div>
  </div>
  <form id="rabai-lead-form-{task_id[:8]}" onsubmit="return false;">
    <input type="email" id="rabai-email-{task_id[:8]}" placeholder="请输入邮箱" required style="width:100%;padding:10px 12px;border:1px solid #e0e0e0;border-radius:8px;margin-bottom:10px;font-size:14px;box-sizing:border-box;"/>
    <input type="text" id="rabai-name-{task_id[:8]}" placeholder="姓名（选填）" style="width:100%;padding:10px 12px;border:1px solid #e0e0e0;border-radius:8px;margin-bottom:10px;font-size:14px;box-sizing:border-box;"/>
    <input type="text" id="rabai-company-{task_id[:8]}" placeholder="公司（选填）" style="width:100%;padding:10px 12px;border:1px solid #e0e0e0;border-radius:8px;margin-bottom:12px;font-size:14px;box-sizing:border-box;"/>
    <button type="button" onclick="rabaiSubmitLead('{task_id}','{task_id[:8]}')" style="width:100%;padding:12px;background:#165DFF;color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;">{btn_text}</button>
  </form>
  <div id="rabai-lead-msg-{task_id[:8]}" style="margin-top:10px;text-align:center;font-size:13px;color:#555;display:none;"></div>
</div>
<script>
function rabaiSubmitLead(taskId, shortId) {{
  var email = document.getElementById('rabai-email-' + shortId).value;
  var name = document.getElementById('rabai-name-' + shortId).value;
  var company = document.getElementById('rabai-company-' + shortId).value;
  var msgEl = document.getElementById('rabai-lead-msg-' + shortId);
  if (!email || !email.includes('@')) {{ msgEl.style.display='block'; msgEl.style.color='#ff4d4f'; msgEl.textContent = '请输入有效的邮箱地址'; return; }}
  fetch('/api/v1/engagement/leads/' + taskId, {{
    method: 'POST',
    headers: {{'Content-Type': 'application/json'}},
    body: JSON.stringify({{email: email, name: name, company: company}})
  }}).then(function(r) {{ return r.json(); }}).then(function(data) {{
    msgEl.style.display = 'block';
    if (data.success) {{
      msgEl.style.color = '#00D4AA';
      msgEl.textContent = '✅ 订阅成功！';
      document.getElementById('rabai-lead-form-' + shortId).style.display = 'none';
    }} else {{
      msgEl.style.color = '#ff4d4f';
      msgEl.textContent = data.error || '提交失败，请重试';
    }}
  }}).catch(function() {{ msgEl.style.display='block'; msgEl.style.color='#ff4d4f'; msgEl.textContent = '网络错误，请重试'; }});
}}
</script>'''
    
    else:
        return JSONResponse({"success": False, "error": "Unknown embed type"}, status_code=400)
    
    return JSONResponse({
        "success": True,
        "embed_type": config.embed_type,
        "embed_code": code,
        "preview_url": embed_url,
        "task_id": task_id
    })


@router.get("/embed/{task_id}/analytics")
async def get_embed_analytics(request: Request, task_id: str):
    """Get analytics data for an embedded presentation"""
    try:
        analytics_service = get_presentation_analytics_service()
        analytics_data = analytics_service.get_analytics(task_id)
        return JSONResponse({
            "success": True,
            "task_id": task_id,
            "total_views": analytics_data.get("total_views", 0),
            "unique_viewers": analytics_data.get("unique_viewers", 0),
            "avg_duration": analytics_data.get("avg_duration", 0),
            "slide_views": analytics_data.get("slide_views", {}),
            "top_regions": analytics_data.get("top_regions", [])
        })
    except Exception:
        return JSONResponse({
            "success": True,
            "task_id": task_id,
            "total_views": 0,
            "unique_viewers": 0,
            "avg_duration": 0,
            "slide_views": {},
            "top_regions": []
        })


# ==================== Presentation Coach API ====================

class CoachAnalyzeRequest(BaseModel):
    """教练分析请求"""
    task_id: str
    slides: List[Dict[str, Any]]
    focus_areas: Optional[List[str]] = None  # 结构/内容/设计/参与度


class CoachPracticeRequest(BaseModel):
    """练习模式请求"""
    task_id: str
    slides: List[Dict[str, Any]]
    difficulty: str = "mixed"  # easy / moderate / hard / mixed
    count: int = 10


class CoachTimingRequest(BaseModel):
    """时间节奏请求"""
    task_id: str
    slides: List[Dict[str, Any]]
    total_minutes: float = 15.0


class CoachDeliveryRequest(BaseModel):
    """演讲技巧请求"""
    task_id: str
    slides: List[Dict[str, Any]]


class CoachAudienceRequest(BaseModel):
    """观众预测请求"""
    task_id: str
    slides: List[Dict[str, Any]]
    audience_profile: str = ""


@router.post("/coach/analyze")
async def coach_analyze(request: Request, body: CoachAnalyzeRequest):
    """AI演讲教练 - 分析幻灯片并给出反馈"""
    try:
        from ...services.presentation_coach import get_presentation_coach_service
        coach = get_presentation_coach_service()
        result = coach.analyze_slides(body.task_id, body.slides)
        return JSONResponse(result)
    except Exception as e:
        logger.error(f"Coach analyze error: {e}")
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)


@router.post("/coach/practice")
async def coach_practice(request: Request, body: CoachPracticeRequest):
    """AI演讲教练 - 生成练习问答"""
    try:
        from ...services.presentation_coach import get_presentation_coach_service
        coach = get_presentation_coach_service()
        result = coach.generate_practice_qa(body.task_id, body.slides, body.difficulty)
        return JSONResponse(result)
    except Exception as e:
        logger.error(f"Coach practice error: {e}")
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)


@router.post("/coach/timing")
async def coach_timing(request: Request, body: CoachTimingRequest):
    """AI演讲教练 - 时间节奏建议"""
    try:
        from ...services.presentation_coach import get_presentation_coach_service
        coach = get_presentation_coach_service()
        result = coach.get_timing_advice(body.task_id, body.slides, body.total_minutes)
        return JSONResponse(result)
    except Exception as e:
        logger.error(f"Coach timing error: {e}")
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)


@router.post("/coach/delivery")
async def coach_delivery(request: Request, body: CoachDeliveryRequest):
    """AI演讲教练 - 演讲技巧建议"""
    try:
        from ...services.presentation_coach import get_presentation_coach_service
        coach = get_presentation_coach_service()
        result = coach.get_delivery_tips(body.task_id, body.slides)
        return JSONResponse(result)
    except Exception as e:
        logger.error(f"Coach delivery error: {e}")
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)


@router.post("/coach/audience")
async def coach_audience(request: Request, body: CoachAudienceRequest):
    """AI演讲教练 - 预测观众可能提问"""
    try:
        from ...services.presentation_coach import get_presentation_coach_service
        coach = get_presentation_coach_service()
        result = coach.predict_audience_questions(body.task_id, body.slides, body.audience_profile)
        return JSONResponse(result)
    except Exception as e:
        logger.error(f"Coach audience error: {e}")
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)


@router.get("/coach/quick-score/{task_id}")
async def coach_quick_score(request: Request, task_id: str):
    """AI演讲教练 - 快速评分（无需AI调用）"""
    try:
        from ...services.presentation_coach import get_presentation_coach_service
        from ...services.task_manager import get_task_manager
        
        tm = get_task_manager()
        task = tm.get_task(task_id)
        
        if not task:
            return JSONResponse({"success": False, "error": "任务不存在"}, status_code=404)
        
        # 获取大纲数据
        slides = []
        if task.result and hasattr(task.result, 'outline'):
            outline = task.result.outline
            if isinstance(outline, dict) and 'slides' in outline:
                slides = outline['slides']
        
        coach = get_presentation_coach_service()
        score = coach.quick_score(slides)
        
        return JSONResponse({
            "success": True,
            "task_id": task_id,
            "quick_score": score,
            "note": "基于规则快速评分，详细评分请使用 /coach/analyze"
        })
    except Exception as e:
        logger.error(f"Quick score error: {e}")
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)

# ========== R127: AI Presentation Coach 2.0 - New Endpoints ==========

class CoachSpeakingPaceRequest(BaseModel):
    """语速分析请求"""
    task_id: str
    slides: List[Dict[str, Any]]
    total_minutes: float = 15.0
    actual_words: Optional[int] = None


class CoachContentDimensionsRequest(BaseModel):
    """内容维度分析请求"""
    task_id: str
    slides: List[Dict[str, Any]]


class CoachVisualDesignRequest(BaseModel):
    """视觉设计分析请求"""
    task_id: str
    slides: List[Dict[str, Any]]


class CoachEngagementRequest(BaseModel):
    """观众参与度预测请求"""
    task_id: str
    slides: List[Dict[str, Any]]
    audience_profile: str = ""


class CoachPersonalizedRequest(BaseModel):
    """个性化教练请求"""
    task_id: str
    slides: List[Dict[str, Any]]
    user_id: str = "default"


class CoachLiveSessionRequest(BaseModel):
    """R138: AI演讲教练 3.0 - 实时演讲分析请求"""
    task_id: str
    slides: List[Dict[str, Any]]
    # 实时阶段数据（每段话的分析结果）
    speech_transcript: str = ""  # 演讲转录文本
    filler_words_detected: List[Dict[str, Any]] = []  # [{word, count, timestamps}]
    current_wpm: float = 0.0
    total_words_spoken: int = 0
    speaking_duration_seconds: float = 0.0
    # 眼神接触数据
    eye_contact_ratio: float = 0.0  # 0.0-1.0，眼神接触比例
    gaze_away_count: int = 0
    # 置信度相关
    filler_word_ratio: float = 0.0  # 填充词比例
    pace_score: float = 0.0  # 节奏评分 0-10
    confidence_score: float = 0.0  # 置信度评分 0-10
    delivery_session_id: Optional[str] = ""


@router.post("/coach/speaking-pace")
async def coach_speaking_pace(request: Request, body: CoachSpeakingPaceRequest):
    """AI演讲教练 - 语速分析（Delivery Coach）"""
    try:
        from ...services.presentation_coach import get_presentation_coach_service
        coach = get_presentation_coach_service()
        result = coach.analyze_speaking_pace(body.task_id, body.slides, body.total_minutes, body.actual_words)
        return JSONResponse(result)
    except Exception as e:
        logger.error(f"Speaking pace error: {e}")
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)


@router.post("/coach/content-dimensions")
async def coach_content_dimensions(request: Request, body: CoachContentDimensionsRequest):
    """AI演讲教练 - 内容维度评分（Content Score）"""
    try:
        from ...services.presentation_coach import get_presentation_coach_service
        coach = get_presentation_coach_service()
        result = coach.analyze_content_dimensions(body.task_id, body.slides)
        return JSONResponse(result)
    except Exception as e:
        logger.error(f"Content dimensions error: {e}")
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)


@router.post("/coach/visual-design")
async def coach_visual_design(request: Request, body: CoachVisualDesignRequest):
    """AI演讲教练 - 视觉设计反馈（Visual Design Feedback）"""
    try:
        from ...services.presentation_coach import get_presentation_coach_service
        coach = get_presentation_coach_service()
        result = coach.analyze_visual_design(body.task_id, body.slides)
        return JSONResponse(result)
    except Exception as e:
        logger.error(f"Visual design error: {e}")
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)


@router.post("/coach/engagement")
async def coach_engagement(request: Request, body: CoachEngagementRequest):
    """AI演讲教练 - 观众参与度预测（Audience Engagement Prediction）"""
    try:
        from ...services.presentation_coach import get_presentation_coach_service
        coach = get_presentation_coach_service()
        result = coach.predict_audience_engagement(body.task_id, body.slides, body.audience_profile)
        return JSONResponse(result)
    except Exception as e:
        logger.error(f"Engagement prediction error: {e}")
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)


@router.post("/coach/personalized")
async def coach_personalized(request: Request, body: CoachPersonalizedRequest):
    """AI演讲教练 - 个性化教练（Personalized Coaching）"""
    try:
        from ...services.presentation_coach import get_presentation_coach_service
        coach = get_presentation_coach_service()
        result = coach.get_personalized_coaching(body.task_id, body.slides, body.user_id)
        return JSONResponse(result)
    except Exception as e:
        logger.error(f"Personalized coaching error: {e}")
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)


@router.post("/coach/live-session")
async def coach_live_session(request: Request, body: CoachLiveSessionRequest):
    """R138: AI演讲教练 3.0 - 实时演讲分析（Live Delivery Coach）"""
    try:
        from ...services.presentation_coach import get_presentation_coach_service
        coach = get_presentation_coach_service()
        result = coach.analyze_live_delivery(
            task_id=body.task_id,
            slides=body.slides,
            transcript=body.speech_transcript,
            filler_words=body.filler_words_detected,
            current_wpm=body.current_wpm,
            total_words=body.total_words_spoken,
            duration_seconds=body.speaking_duration_seconds,
            eye_contact_ratio=body.eye_contact_ratio,
            gaze_away_count=body.gaze_away_count,
            filler_word_ratio=body.filler_word_ratio,
            pace_score=body.pace_score,
            confidence_score=body.confidence_score,
            session_id=body.delivery_session_id,
        )
        return JSONResponse(result)
    except Exception as e:
        logger.error(f"Live session coaching error: {e}")
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)


# ========== A/B Testing ==========

# ========== A/B Testing ==========

@router.post("/ab_test/{task_id}")
async def create_ab_test(task_id: str, slide_index: int = Query(..., ge=0), variant_count: int = Query(2, ge=2, le=4)):
    """为指定幻灯片创建A/B测试"""
    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    try:
        return tm.create_ab_test(task_id, slide_index, variant_count)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/ab_test/{task_id}")
async def list_ab_tests(task_id: str):
    """列出任务的所有A/B测试"""
    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    tests = tm.list_ab_tests(task_id)
    return {"success": True, "tests": tests}


@router.get("/ab_test/{task_id}/{test_id}")
async def get_ab_test(task_id: str, test_id: str):
    """获取A/B测试详情及性能对比"""
    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    try:
        return tm.get_ab_test(task_id, test_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/ab_test/{task_id}/{test_id}/view")
async def track_ab_view(task_id: str, test_id: str, variant_id: str = Query(...), time_spent_ms: int = Query(0)):
    """记录A/B测试变体查看"""
    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    try:
        return tm.track_ab_view(task_id, test_id, variant_id, time_spent_ms)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/ab_test/{task_id}/{test_id}/click")
async def track_ab_click(task_id: str, test_id: str, variant_id: str = Query(...)):
    """记录A/B测试变体点击"""
    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    try:
        return tm.track_ab_click(task_id, test_id, variant_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/ab_test/{task_id}/{test_id}/select")
async def select_ab_winner(task_id: str, test_id: str, variant_id: str = Query(...)):
    """选择A/B测试获胜变体并应用到幻灯片"""
    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    try:
        return tm.select_ab_winner(task_id, test_id, variant_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/ab_test/{task_id}/{test_id}")
async def delete_ab_test(task_id: str, test_id: str):
    """删除A/B测试"""
    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    try:
        return tm.delete_ab_test(task_id, test_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ========== 幻灯片级版本历史 ==========

@router.get("/slide_history/{task_id}/{slide_index}")
async def get_slide_history(task_id: str, slide_index: int):
    """获取指定幻灯片的版本历史"""
    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    history = tm.get_slide_version_history(task_id, slide_index)
    return {"success": True, "history": history}


# ========== 智能改进建议 ==========

@router.get("/suggest_improve/{task_id}")
async def suggest_improvements(task_id: str):
    """基于分析生成幻灯片改进建议"""
    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    try:
        return tm.suggest_improvements(task_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ========== 内容语言检测 ==========

@router.get("/detect_language/{task_id}")
async def detect_content_language(task_id: str):
    """检测PPT内容的语言"""
    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    try:
        return tm.detect_language(task_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ========== 演示文稿本地化/翻译 ==========

@router.post("/localize/{task_id}")
async def localize_presentation(
    task_id: str,
    target_locale: str = Query(..., description="目标语言代码，如 en, zh, ar, he"),
    source_locale: Optional[str] = Query(None, description="源语言代码，如不提供则自动检测"),
    apply_rtl: bool = Query(False, description="是否应用RTL布局"),
):
    """将演示文稿翻译为指定语言"""
    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    try:
        return tm.localize(task_id, target_locale, source_locale, apply_rtl)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/language_versions/{task_id}")
async def list_language_versions(task_id: str):
    """列出某个PPT的所有语言版本"""
    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    try:
        return tm.list_language_versions(task_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ============ R118: Smart Content Suggestions ============

class SmartContentRequest(BaseModel):
    topic: str = Field(default="", description="PPT主题")
    slides: List[Dict[str, Any]] = Field(default_factory=list, description="幻灯片列表")
    style: str = Field(default="professional", description="风格")
    scene: str = Field(default="business", description="场景")
    page_count: int = Field(default=10, description="页数")


@router.post("/suggest/content-boost")
async def suggest_content_boost(request: SmartContentRequest):
    """
    R118: 内容增强 - AI 建议相关的内容补充
    """
    from ...services.smart_content_service import get_smart_content_service
    service = get_smart_content_service()
    result = service.content_boost(
        topic=request.topic,
        slides=request.slides,
        style=request.style,
        scene=request.scene
    )
    return result


@router.post("/suggest/citations")
async def suggest_citations(request: SmartContentRequest):
    """
    R118: 引用查找 - 自动为声明找到来源
    """
    from ...services.smart_content_service import get_smart_content_service
    service = get_smart_content_service()
    result = service.citation_finder(
        topic=request.topic,
        slides=request.slides
    )
    return result


@router.post("/suggest/images")
async def suggest_images(request: SmartContentRequest):
    """
    R118: 图片建议 - 基于内容推荐相关图片
    """
    from ...services.smart_content_service import get_smart_content_service
    service = get_smart_content_service()
    result = service.image_suggestions(
        topic=request.topic,
        slides=request.slides
    )
    return result


@router.post("/suggest/quotes")
async def suggest_quotes(request: SmartContentRequest):
    """
    R118: 引用语建议 - 从知识库推荐相关引用
    """
    from ...services.smart_content_service import get_smart_content_service
    service = get_smart_content_service()
    result = service.quote_suggestions(
        topic=request.topic,
        slides=request.slides,
        style=request.style,
        scene=request.scene
    )
    return result


@router.post("/suggest/related")
async def suggest_related_presentations(request: SmartContentRequest):
    """
    R118: 相关演示文稿 - 链接相关演示文稿
    """
    from ...services.smart_content_service import get_smart_content_service
    service = get_smart_content_service()
    result = service.related_presentations(
        topic=request.topic,
        slides=request.slides,
        style=request.style,
        scene=request.scene,
        page_count=request.page_count
    )
    return result




# ==================== 备份管理 R125 ====================

@router.get("/backups")
async def list_backups(task_id: str = Query(None)):
    """
    R125: 列出备份历史
    - task_id: 如果指定，只返回该任务的备份；否则返回所有任务最新备份
    """
    from ...services.backup_service import get_backup_service
    bs = get_backup_service()
    backups = bs.list_backups(task_id)
    return {"success": True, "backups": backups, "count": len(backups)}


@router.post("/backups/{task_id}")
async def create_backup(
    task_id: str,
    name: str = Body(None),
    backup_type: str = Body("manual"),
):
    """
    R125: 创建备份
    - 备份当前任务的完整数据（配置+结果+PPTX）
    """
    from ...services.backup_service import get_backup_service
    from ...services.task_manager import get_task_manager
    
    tm = get_task_manager()
    task_data = tm.get_task(task_id)
    if not task_data:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
    
    bs = get_backup_service()
    result = bs.create_backup(
        task_id=task_id,
        task_data=task_data,
        backup_name=name,
        include_pptx=True,
        include_svg=True,
        backup_type=backup_type,
    )
    return result


@router.get("/backups/{task_id}/{backup_id}")
async def get_backup_detail(task_id: str, backup_id: str):
    """R125: 获取备份详情"""
    from ...services.backup_service import get_backup_service
    bs = get_backup_service()
    backup = bs.get_backup(backup_id, task_id)
    if not backup:
        raise HTTPException(status_code=404, detail="Backup not found")
    return {"success": True, "backup": backup}


@router.get("/backups/{task_id}/{backup_id}/slides")
async def get_backup_slides(task_id: str, backup_id: str):
    """R125: 获取备份中的幻灯片列表（用于选择性恢复）"""
    from ...services.backup_service import get_backup_service
    bs = get_backup_service()
    slides = bs.get_backup_slides(backup_id, task_id)
    if slides is None:
        raise HTTPException(status_code=404, detail="Backup not found")
    return {"success": True, "slides": slides}


@router.post("/backups/{task_id}/{backup_id}/restore")
async def restore_from_backup(
    task_id: str,
    backup_id: str,
    restore_type: str = Body("full"),  # full | slides | config
    selected_slide_nums: List[int] = Body(None),
):
    """
    R125: 从备份恢复
    - restore_type=full: 全量恢复（覆盖当前）
    - restore_type=slides: 选择性恢复（只恢复指定页）
    - restore_type=config: 只恢复配置（场景/风格/模板等）
    """
    from ...services.backup_service import get_backup_service
    from ...services.task_manager import get_task_manager
    
    bs = get_backup_service()
    
    # 全量恢复需要更新任务数据
    if restore_type == "full":
        result = bs.restore_backup(backup_id, task_id, "full")
        if result.get("data"):
            tm = get_task_manager()
            task_data = result["data"]
            # 更新任务
            if task_id in tm.tasks:
                tm.tasks[task_id].update(task_data)
                tm.tasks[task_id]["updated_at"] = get_timestamp()
        return result
    
    elif restore_type == "slides":
        if not selected_slide_nums:
            raise HTTPException(status_code=400, detail="selected_slide_nums required for slides restore")
        return bs.restore_backup(backup_id, task_id, "slides", selected_slide_nums)
    
    elif restore_type == "config":
        result = bs.restore_backup(backup_id, task_id, "config")
        if result.get("config"):
            tm = get_task_manager()
            if task_id in tm.tasks:
                cfg = result["config"]
                if task_id in tm.tasks:
                    tm.tasks[task_id]["scene"] = cfg.get("scene", tm.tasks[task_id].get("scene"))
                    tm.tasks[task_id]["style"] = cfg.get("style", tm.tasks[task_id].get("style"))
                    tm.tasks[task_id]["template"] = cfg.get("template", tm.tasks[task_id].get("template"))
                    tm.tasks[task_id]["theme_color"] = cfg.get("theme_color", tm.tasks[task_id].get("theme_color"))
                    tm.tasks[task_id]["layout_mode"] = cfg.get("layout_mode", tm.tasks[task_id].get("layout_mode"))
                tm.tasks[task_id]["updated_at"] = get_timestamp()
        return result
    
    else:
        raise HTTPException(status_code=400, detail=f"Invalid restore_type: {restore_type}")


@router.delete("/backups/{task_id}/{backup_id}")
async def delete_backup(task_id: str, backup_id: str):
    """R125: 删除备份"""
    from ...services.backup_service import get_backup_service
    bs = get_backup_service()
    result = bs.delete_backup(backup_id, task_id)
    return result


@router.get("/backups/{task_id}/{backup_id}/download")
async def download_backup(task_id: str, backup_id: str):
    """R125: 下载备份文件（.rabak）"""
    from ...services.backup_service import get_backup_service
    bs = get_backup_service()
    try:
        export_path = bs.export_backup_file(backup_id, task_id)
        return FileResponse(
            export_path,
            media_type="application/octet-stream",
            filename=f"backup_{backup_id}.rabak",
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/backups/import")
async def import_backup(file: UploadFile = File(...)):
    """R125: 导入备份文件（.rabak）"""
    import tempfile
    import os
    from ...services.backup_service import get_backup_service
    
    bs = get_backup_service()
    
    # 保存上传文件到临时位置
    with tempfile.NamedTemporaryFile(suffix=".rabak", delete=False) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name
    
    try:
        result = bs.import_backup_file(tmp_path)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)

# ==================== R152: Advanced Slide Notes & Annotations ====================

class SlideNotesUpdate(BaseModel):
    """更新幻灯片备注请求"""
    slide_index: int
    notes: Optional[str] = None
    rich_notes: Optional[str] = None
    speaker_notes: Optional[str] = None


class SlideAnnotationsUpdate(BaseModel):
    """更新幻灯片标注请求"""
    slide_index: int
    annotations: List[Dict[str, Any]] = []


class StickyNoteItem(BaseModel):
    """便签数据"""
    id: str
    slide_index: int
    content: str
    author: str
    color: str = "#FFE066"
    position_x: float = 0
    position_y: float = 0
    created_at: Optional[str] = None


class StickyNoteCreate(BaseModel):
    """创建便签请求"""
    slide_index: int
    content: str
    author: str
    color: str = "#FFE066"
    position_x: float = 0
    position_y: float = 0


class NotesTemplateItem(BaseModel):
    """备注模板"""
    id: str
    name: str
    description: str
    template_type: str  # business | education | tech | marketing |通用
    content: str
    created_at: Optional[str] = None


class NotesTemplateCreate(BaseModel):
    """创建备注模板"""
    name: str
    description: str = ""
    template_type: str = "通用"
    content: str


@router.patch("/slides/{task_id}/notes")
async def update_slide_notes(task_id: str, update: SlideNotesUpdate):
    """R152: 更新幻灯片备注（支持富文本和演讲者私有备注）"""
    from ...services.task_manager import get_task_manager
    tm = get_task_manager()
    
    try:
        outline = tm.get_outline(task_id)
        slides = outline.get("slides", [])
        
        if update.slide_index < 0 or update.slide_index >= len(slides):
            raise HTTPException(status_code=404, detail="Slide not found")
        
        slide = slides[update.slide_index]
        if update.notes is not None:
            slide["notes"] = update.notes
        if update.rich_notes is not None:
            slide["rich_notes"] = update.rich_notes
        if update.speaker_notes is not None:
            slide["speaker_notes"] = update.speaker_notes
        
        tm.save_outline(task_id, outline)
        return {"success": True, "slide_index": update.slide_index}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/slides/{task_id}/sticky-notes")
async def update_slide_sticky_notes(task_id: str, update: SlideNotesUpdate):
    """R152: 更新幻灯片便签数据"""
    from ...services.task_manager import get_task_manager
    tm = get_task_manager()
    
    try:
        outline = tm.get_outline(task_id)
        slides = outline.get("slides", [])
        
        if update.slide_index < 0 or update.slide_index >= len(slides):
            raise HTTPException(status_code=404, detail="Slide not found")
        
        if update.sticky_notes is not None:
            slides[update.slide_index]["sticky_notes"] = update.sticky_notes
        
        tm.save_outline(task_id, outline)
        return {"success": True, "slide_index": update.slide_index}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/annotations/{task_id}/{slide_index}")
async def save_slide_annotations(task_id: str, slide_index: int, annotations: List[Dict[str, Any]]):
    """R152: 保存幻灯片标注（演示模式涂鸦）"""
    from ...services.task_manager import get_task_manager
    tm = get_task_manager()
    
    try:
        outline = tm.get_outline(task_id)
        slides = outline.get("slides", [])
        
        if slide_index < 0 or slide_index >= len(slides):
            raise HTTPException(status_code=404, detail="Slide not found")
        
        slides[slide_index]["annotations"] = annotations
        tm.save_outline(task_id, outline)
        return {"success": True, "slide_index": slide_index, "count": len(annotations)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sticky-notes/{task_id}")
async def get_sticky_notes(task_id: str):
    """R152: 获取任务的所有便签"""
    from ...services.task_manager import get_task_manager
    tm = get_task_manager()
    
    try:
        outline = tm.get_outline(task_id)
        slides = outline.get("slides", [])
        
        all_sticky = []
        for idx, slide in enumerate(slides):
            sticky = slide.get("sticky_notes", [])
            for s in sticky:
                all_sticky.append({**s, "slide_index": idx})
        
        return {"success": True, "sticky_notes": all_sticky}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sticky-notes/{task_id}")
async def add_sticky_note(task_id: str, note: StickyNoteCreate):
    """R152: 添加便签"""
    from ...services.task_manager import get_task_manager
    from datetime import datetime
    tm = get_task_manager()
    
    try:
        outline = tm.get_outline(task_id)
        slides = outline.get("slides", [])
        
        if note.slide_index < 0 or note.slide_index >= len(slides):
            raise HTTPException(status_code=404, detail="Slide not found")
        
        import uuid
        new_note = {
            "id": str(uuid.uuid4())[:8],
            "slide_index": note.slide_index,
            "content": note.content,
            "author": note.author,
            "color": note.color,
            "position_x": note.position_x,
            "position_y": note.position_y,
            "created_at": datetime.now().isoformat(),
        }
        
        if "sticky_notes" not in slides[note.slide_index]:
            slides[note.slide_index]["sticky_notes"] = []
        slides[note.slide_index]["sticky_notes"].append(new_note)
        
        tm.save_outline(task_id, outline)
        return {"success": True, "note": new_note}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/sticky-notes/{task_id}/{note_id}")
async def delete_sticky_note(task_id: str, note_id: str):
    """R152: 删除便签"""
    from ...services.task_manager import get_task_manager
    tm = get_task_manager()
    
    try:
        outline = tm.get_outline(task_id)
        slides = outline.get("slides", [])
        
        found = False
        for slide in slides:
            sticky = slide.get("sticky_notes", [])
            slide["sticky_notes"] = [s for s in sticky if s.get("id") != note_id]
            if len(slide["sticky_notes"]) < len(sticky):
                found = True
        
        if not found:
            raise HTTPException(status_code=404, detail="Note not found")
        
        tm.save_outline(task_id, outline)
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Notes Templates ====================

# In-memory store for notes templates (in production, use database)
NOTES_TEMPLATES_STORE = [
    {
        "id": "tpl-business-1",
        "name": "商业汇报模板",
        "description": "适用于季度汇报、项目汇报",
        "template_type": "business",
        "content": "【背景】<br>本次汇报聚焦于...<br><br>【核心成果】<br>• 成果1：...<br>• 成果2：...<br><br>【关键数据】<br>- 指标1：...<br>- 指标2：...<br><br>【下一步计划】<br>1. ...<br>2. ...",
        "created_at": "2026-01-01T00:00:00",
    },
    {
        "id": "tpl-education-1",
        "name": "教学演示模板",
        "description": "适用于课堂教学、学术报告",
        "template_type": "education",
        "content": "【教学目标】<br>本节课我们将学习...<br><br>【重点难点】<br>• 重点：...<br>• 难点：...<br><br>【案例分析】<br>...<br><br>【思考题】<br>1. ...<br>2. ...",
        "created_at": "2026-01-01T00:00:00",
    },
    {
        "id": "tpl-tech-1",
        "name": "技术分享模板",
        "description": "适用于技术分享会、架构讲解",
        "template_type": "tech",
        "content": "【背景介绍】<br>今天分享的主题是...<br><br>【技术方案】<br>我们采用了以下方案：<br>• 方案A：...<br>• 方案B：...<br><br>【代码示例】<br>```<br>...<br>```<br><br>【Q&A】<br>",
        "created_at": "2026-01-01T00:00:00",
    },
    {
        "id": "tpl-marketing-1",
        "name": "营销提案模板",
        "description": "适用于营销方案、客户提案",
        "template_type": "marketing",
        "content": "【市场洞察】<br>当前市场趋势显示...<br><br>【目标受众】<br>我们的目标用户是...<br><br>【核心策略】<br>• 策略1：...<br>• 策略2：...<br><br>【预期效果】<br>- 品牌提升：...<br>- 转化提升：...",
        "created_at": "2026-01-01T00:00:00",
    },
    {
        "id": "tpl-general-1",
        "name": "通用备注模板",
        "description": "适用于各类演示的通用备注",
        "template_type": "通用",
        "content": "【开场】<br>各位好，今天我将分享...<br><br>【要点1】<br>首先，...<br><br>【要点2】<br>其次，...<br><br>【总结】<br>综上所述，...<br><br>【问答】<br>",
        "created_at": "2026-01-01T00:00:00",
    },
]


@router.get("/notes-templates")
async def get_notes_templates(template_type: Optional[str] = None):
    """R152: 获取备注模板列表"""
    if template_type:
        filtered = [t for t in NOTES_TEMPLATES_STORE if t["template_type"] == template_type]
        return {"success": True, "templates": filtered}
    return {"success": True, "templates": NOTES_TEMPLATES_STORE}


@router.post("/notes-templates")
async def create_notes_template(tpl: NotesTemplateCreate):
    """R152: 创建自定义备注模板"""
    import uuid
    from datetime import datetime
    new_tpl = {
        "id": f"tpl-custom-{uuid.uuid4().hex[:8]}",
        "name": tpl.name,
        "description": tpl.description,
        "template_type": tpl.template_type,
        "content": tpl.content,
        "created_at": datetime.now().isoformat(),
    }
    NOTES_TEMPLATES_STORE.append(new_tpl)
    return {"success": True, "template": new_tpl}


@router.delete("/notes-templates/{template_id}")
async def delete_notes_template(template_id: str):
    """R152: 删除自定义备注模板"""
    global NOTES_TEMPLATES_STORE
    if template_id.startswith("tpl-custom-"):
        before = len(NOTES_TEMPLATES_STORE)
        NOTES_TEMPLATES_STORE = [t for t in NOTES_TEMPLATES_STORE if t["id"] != template_id]
        if len(NOTES_TEMPLATES_STORE) == before:
            raise HTTPException(status_code=404, detail="Template not found")
        return {"success": True}
    raise HTTPException(status_code=403, detail="Cannot delete built-in templates")
