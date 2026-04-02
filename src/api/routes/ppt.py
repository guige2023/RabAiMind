# -*- coding: utf-8 -*-
"""
API 路由定义

作者: Claude
日期: 2026-03-17
"""

from fastapi import APIRouter, HTTPException, Request, status, UploadFile, File, Form, Query, Body
from fastapi.responses import FileResponse, JSONResponse
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
from ...config import settings

# 创建路由
router = APIRouter(prefix="/api/v1/ppt", tags=["ppt"])

# ==================== 安全警告 ====================
# ⚠️ 安全警告：
# 1. 当前API无认证保护，建议生产环境添加JWT/API Key认证
# 2. 建议添加速率限制防止滥用（如 @router.middleware 添加限流）
# 3. 用户输入已做基本过滤，建议根据业务需求加强

# 简单速率限制（内存中）
_rate_limit_storage: Dict[str, List[float]] = {}
_RATE_LIMIT_MAX = 20  # 每分钟最大请求数
_RATE_LIMIT_WINDOW = 60  # 时间窗口秒
_rate_limit_lock = threading.Lock()  # 线程安全锁


def _check_rate_limit(client_id: str = "default") -> bool:
    """简单速率限制检查（线程安全）"""
    import time
    now = time.time()

    with _rate_limit_lock:
        if client_id not in _rate_limit_storage:
            _rate_limit_storage[client_id] = []

        # 清理过期记录
        _rate_limit_storage[client_id] = [
            t for t in _rate_limit_storage[client_id]
            if now - t < _RATE_LIMIT_WINDOW
        ]

        # 检查限制
        if len(_rate_limit_storage[client_id]) >= _RATE_LIMIT_MAX:
            return False

        # 记录请求
        _rate_limit_storage[client_id].append(now)
        return True


# ==================== 图表上传与生成 ====================

@router.post("/chart/upload/{task_id}")
async def upload_chart_file(
    task_id: str,
    file: UploadFile = File(...),
    chart_type: str = Form("bar"),
    label_col: str = Form(""),
    value_col: str = Form(""),
):
    """上传 CSV/Excel 文件，生成图表 SVG"""
    try:
        content = await file.read()
        cg = ChartGenerator()
        result = cg.process_upload(
            content, file.filename, chart_type,
            label_col, value_col, task_id
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
async def generate_ppt(request: GenerateRequest):
    """提交 PPT 生成任务"""
    # 速率限制检查
    if not _check_rate_limit():
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="请求过于频繁，请稍后再试"
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
    if not _check_rate_limit():
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
async def get_svg_file(task_id: str, slide_num: int):
    """获取单个SVG文件"""
    # 速率限制检查
    if not _check_rate_limit():
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
async def download_ppt(task_id: str):
    """下载 PPT 文件"""
    # 速率限制检查
    if not _check_rate_limit():
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
async def export_pdf(task_id: str):
    """导出PDF"""
    # 速率限制检查
    if not _check_rate_limit():
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
async def generate_image(request: ImageGenerationRequest):
    """AI生成图片"""
    # 速率限制检查
    if not _check_rate_limit():
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
async def plan_ppt(request: PlanRequest):
    """生成PPT大纲"""
    # 速率限制检查
    if not _check_rate_limit():
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
    if not _check_rate_limit():
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
        with open(svg_path, 'w', encoding='utf-8') as f:
            f.write(svg_code)
        
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
