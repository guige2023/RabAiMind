# -*- coding: utf-8 -*-
"""
PPT Advanced Routes - AI功能、布局、主题、嵌入、教练、A/B测试等高级路由

作者: Claude
日期: 2026-03-17
"""

from fastapi import APIRouter, HTTPException, Request, Query, Body, UploadFile, File, Form
from fastapi.responses import JSONResponse, StreamingResponse
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
import logging
import re
import zipfile
import io
import os

logger = logging.getLogger(__name__)

from ...services.task_manager import get_task_manager

router = APIRouter()


# ==================== Single Slide Regeneration ====================

@router.post("/regenerate/{task_id}/{slide_index}")
async def regenerate_single_slide(task_id: str, slide_index: int, request: Request):
    """重新生成某一页幻灯片
    
    Args:
        task_id: 任务ID
        slide_index: 页码（1-based）
        request: 包含 scene, style, content, layout 等参数
    """
    from ...api.middleware.rate_limit import (
        get_user_id_from_request,
        get_rate_limiter,
        rate_limit_exceeded_response,
    )
    from ...services.task_manager import get_task_manager
    from ...services.ppt_generator import PPTGenerator
    from ...config import settings

    # 速率限制检查
    user_id = get_user_id_from_request(request)
    rate_limiter = get_rate_limiter()
    rate_info, allowed = rate_limiter.check(user_id)
    if not allowed:
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
                "svg_url": f"{request.base_url}api/v1/ppt/svg/{task_id}/{slide_index}",
                "slide_index": slide_index
            },
            "message": "单页重生成成功"
        }
    except Exception as e:
        logger.error(f"单页重生成失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "ENDPOINT_ERROR", "detail": f"重生成失败: {str(e)}"}
        )


# ==================== Single Slide Image Operations ====================

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
    """更新单页幻灯片的图片"""
    from ...services.task_manager import get_task_manager
    from ...services.ppt_generator import PPTGenerator
    from ...config import settings

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
        new_image_url = None
        message = "图片已移除"

    elif request.action == "regenerate":
        try:
            from ...services.content_generator import get_content_generator
            content_gen = get_content_generator()

            params = task.get("params", {})
            slides_content = params.get("slides_content", [])

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
                detail={"error": "ENDPOINT_ERROR", "detail": f"重新生成图片失败: {str(e)}"}
            )

    elif request.image_url:
        new_image_url = request.image_url
        message = "图片已更新"
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="无效的操作或图片URL"
        )

    # 更新slides_content中的图片
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
            detail={"error": "ENDPOINT_ERROR", "detail": f"更新图片失败: {str(e)}"}
        )


@router.post("/image/{task_id}/{slide_index}/upload", response_model=SlideImageResponse)
async def upload_slide_image(task_id: str, slide_index: int, request: Request):
    """上传单页幻灯片的图片"""
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
            detail={"error": "ENDPOINT_ERROR", "detail": f"上传图片失败: {str(e)}"}
        )


# ==================== Batch Operations ====================

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
    outlines: List[Any] = Field(..., description="多个大纲配置，并行生成")


@router.post("/batch/export")
async def batch_export_ppt(
    http_request: Request,
    request: BatchExportRequest
):
    """批量导出多个PPT为ZIP文件"""
    from ...api.middleware.rate_limit import (
        get_user_id_from_request,
        get_rate_limiter,
        rate_limit_exceeded_response,
    )

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
                zf.write(file_path, f"{safe_name}_{tid[:8]}.pptx")
            elif request.format == "png":
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
    from ...api.middleware.rate_limit import (
        get_user_id_from_request,
        get_rate_limiter,
        rate_limit_exceeded_response,
    )

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
    from ...api.middleware.rate_limit import (
        get_user_id_from_request,
        get_rate_limiter,
        rate_limit_exceeded_response,
    )

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


@router.post("/generate/parallel")
async def generate_parallel_ppt(
    http_request: Request,
    request: BatchGenerateRequest
):
    """并行生成多个PPT（接受多个大纲配置）"""
    import threading
    from ...api.middleware.rate_limit import (
        get_user_id_from_request,
        get_rate_limiter,
        rate_limit_exceeded_response,
    )
    from ...services.ppt_generator import get_ppt_generator

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


def _check_rate_limit_middleware(request: Request) -> Optional[JSONResponse]:
    """Check rate limit, return error response if exceeded, else None."""
    from ...api.middleware.rate_limit import (
        get_user_id_from_request,
        get_rate_limiter,
        rate_limit_exceeded_response,
    )
    user_id = get_user_id_from_request(request)
    rate_limiter = get_rate_limiter()
    rate_info, allowed = rate_limiter.check(user_id)
    if not allowed:
        return rate_limit_exceeded_response(rate_info)
    return None


# ==================== Import Endpoints ====================

class ImportURLRequest(BaseModel):
    url: str = Field(..., description="网页 URL")


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


# ==================== Lark (Feishu) Import ====================

class ImportLarkRequest(BaseModel):
    doc_url: str = Field(..., description="飞书文档分享链接或 doc ID")
    access_token: Optional[str] = Field(None, description="飞书 access token (可选)")

@router.post("/import/lark")
async def import_lark(
    request: Request,
    body: ImportLarkRequest,
):
    """导入飞书文档内容并转换为 PPT 大纲"""
    rate_error = _check_rate_limit_middleware(request)
    if rate_error:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="请求过于频繁")

    if not body.doc_url.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="请提供飞书文档链接")

    from ...services.lark_import_service import get_lark_import_service
    result = await get_lark_import_service().import_from_lark(
        body.doc_url,
        body.access_token
    )
    return result


# ==================== Markdown Import ====================

class ImportMarkdownRequest(BaseModel):
    content: str = Field(..., description="Markdown 格式的文本内容")
    title: Optional[str] = Field(None, description="文档标题（可选，默认从内容提取）")

@router.post("/import/markdown")
async def import_markdown(
    request: Request,
    body: ImportMarkdownRequest,
):
    """导入 Markdown 内容并转换为 PPT 大纲"""
    rate_error = _check_rate_limit_middleware(request)
    if rate_error:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="请求过于频繁")

    if not body.content.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Markdown 内容不能为空")

    from ...services.markdown_import_service import get_markdown_import_service
    result = await get_markdown_import_service().import_markdown(
        body.content,
        body.title
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
            "confidence": 1.0 - i * 0.2,
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
    """
    from ...services.smart_layout.content_analyzer import get_content_analyzer
    from ...services.smart_layout.color_scheme import get_color_scheme_generator

    analyzer = get_content_analyzer()
    analysis = analyzer.analyze(title or "", content or "")

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

    CONTENT_THEME_MAP = {
        "title_slide": {"primary": "#165DFF", "secondary": "#0E42D2", "accent": "#C6A87C", "style": "premium"},
        "quote": {"primary": "#AF52DE", "secondary": "#5E5CE6", "accent": "#BF5AF2", "style": "elegant"},
        "timeline": {"primary": "#5856D6", "secondary": "#3634A3", "accent": "#FF9500", "style": "tech"},
        "comparison": {"primary": "#165DFF", "secondary": "#FF3B30", "accent": "#34C759", "style": "professional"},
        "data": {"primary": "#165DFF", "secondary": "#00B96B", "accent": "#FF7D00", "style": "simple"},
        "content": {"primary": "#165DFF", "secondary": "#364FC7", "accent": "#FF7D00", "style": "professional"},
    }

    matched_theme = None
    if scene:
        for key, theme in SCENE_THEME_MAP.items():
            if key in scene:
                matched_theme = theme
                break

    if not matched_theme:
        scene_text = f"{scene} {title} {content}"
        for key, theme in SCENE_THEME_MAP.items():
            if key in scene_text:
                matched_theme = theme
                break

    if not matched_theme:
        matched_theme = CONTENT_THEME_MAP.get(
            analysis.type,
            CONTENT_THEME_MAP["content"]
        )

    if style and style != "auto":
        color_gen = get_color_scheme_generator()
        palette = color_gen.get_palette(style)
        matched_theme = {
            "primary": palette.primary,
            "secondary": palette.secondary,
            "accent": palette.accent,
            "style": style,
        }

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


# ==================== Embed Widget API ====================

class EmbedConfigRequest(BaseModel):
    embed_type: str = Field(..., description="Type: iframe, floating_button, inline_preview, analytics, pixel, lead_capture")
    width: Optional[str] = "100%"
    height: Optional[str] = "600px"
    theme: Optional[str] = "light"
    position: Optional[str] = "bottom-right"
    analytics_token: Optional[str] = None
    show_controls: Optional[bool] = True
    auto_slide: Optional[int] = 0
    start_slide: Optional[int] = 1
    lead_form_title: Optional[str] = "订阅更新"
    lead_button_text: Optional[str] = "立即订阅"


@router.get("/embed/{task_id}")
async def get_embed_config(request: Request, task_id: str):
    """Get embed configuration for a presentation"""
    from ...api.middleware.rate_limit import get_user_id_from_request
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
    from ...api.middleware.rate_limit import get_user_id_from_request
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
</div>'''
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
</div>'''
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
        from ...services.presentation_analytics import get_presentation_analytics_service
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
    task_id: str
    slides: List[Dict[str, Any]]
    focus_areas: Optional[List[str]] = None


class CoachPracticeRequest(BaseModel):
    task_id: str
    slides: List[Dict[str, Any]]
    difficulty: str = "mixed"
    count: int = 10


class CoachTimingRequest(BaseModel):
    task_id: str
    slides: List[Dict[str, Any]]
    total_minutes: float = 15.0


class CoachDeliveryRequest(BaseModel):
    task_id: str
    slides: List[Dict[str, Any]]


class CoachAudienceRequest(BaseModel):
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


# ==================== A/B Testing ====================

@router.post("/ab_test/{task_id}")
async def create_ab_test(task_id: str, slide_index: int = Query(..., ge=0), variant_count: int = Query(2, ge=2, le=4)):
    """为指定幻灯片创建A/B测试"""
    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    try:
        return tm.create_ab_test(task_id, slide_index, variant_count)
    except ValueError as e:
        raise HTTPException(status_code=404, detail={"error": "ENDPOINT_ERROR", "detail": str(e)})


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
        raise HTTPException(status_code=404, detail={"error": "ENDPOINT_ERROR", "detail": str(e)})


@router.post("/ab_test/{task_id}/{test_id}/view")
async def track_ab_view(task_id: str, test_id: str, variant_id: str = Query(...), time_spent_ms: int = Query(0)):
    """记录A/B测试变体查看"""
    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    try:
        return tm.track_ab_view(task_id, test_id, variant_id, time_spent_ms)
    except ValueError as e:
        raise HTTPException(status_code=404, detail={"error": "ENDPOINT_ERROR", "detail": str(e)})


@router.post("/ab_test/{task_id}/{test_id}/click")
async def track_ab_click(task_id: str, test_id: str, variant_id: str = Query(...)):
    """记录A/B测试变体点击"""
    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    try:
        return tm.track_ab_click(task_id, test_id, variant_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail={"error": "ENDPOINT_ERROR", "detail": str(e)})


@router.post("/ab_test/{task_id}/{test_id}/select")
async def select_ab_winner(task_id: str, test_id: str, variant_id: str = Query(...)):
    """选择A/B测试获胜变体并应用到幻灯片"""
    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    try:
        return tm.select_ab_winner(task_id, test_id, variant_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail={"error": "ENDPOINT_ERROR", "detail": str(e)})


@router.delete("/ab_test/{task_id}/{test_id}")
async def delete_ab_test(task_id: str, test_id: str):
    """删除A/B测试"""
    from ...services.task_manager import get_task_manager

    tm = get_task_manager()
    try:
        return tm.delete_ab_test(task_id, test_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail={"error": "ENDPOINT_ERROR", "detail": str(e)})


# ==================== Smart Content Suggestions ====================

class SmartContentRequest(BaseModel):
    topic: str = Field(default="", description="PPT主题")
    slides: List[Dict[str, Any]] = Field(default_factory=list, description="幻灯片列表")
    style: str = Field(default="professional", description="风格")
    scene: str = Field(default="business", description="场景")
    page_count: int = Field(default=10, description="页数")


@router.post("/suggest/content-boost")
async def suggest_content_boost(request: SmartContentRequest):
    """R118: 内容增强 - AI 建议相关的内容补充"""
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
    """R118: 引用查找 - 自动为声明找到来源"""
    from ...services.smart_content_service import get_smart_content_service
    service = get_smart_content_service()
    result = service.citation_finder(
        topic=request.topic,
        slides=request.slides
    )
    return result


@router.post("/suggest/images")
async def suggest_images(request: SmartContentRequest):
    """R118: 图片建议 - 基于内容推荐相关图片"""
    from ...services.smart_content_service import get_smart_content_service
    service = get_smart_content_service()
    result = service.image_suggestions(
        topic=request.topic,
        slides=request.slides
    )
    return result


@router.post("/suggest/quotes")
async def suggest_quotes(request: SmartContentRequest):
    """R118: 引用语建议 - 从知识库推荐相关引用"""
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
    """R118: 相关演示文稿 - 链接相关演示文稿"""
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


# ========== R127: AI Presentation Coach 2.0 - New Endpoints ==========

class CoachSpeakingPaceRequest(BaseModel):
    task_id: str
    slides: List[Dict[str, Any]]
    total_minutes: float = 15.0
    actual_words: Optional[int] = None


class CoachContentDimensionsRequest(BaseModel):
    task_id: str
    slides: List[Dict[str, Any]]


class CoachVisualDesignRequest(BaseModel):
    task_id: str
    slides: List[Dict[str, Any]]


class CoachEngagementRequest(BaseModel):
    task_id: str
    slides: List[Dict[str, Any]]
    audience_profile: str = ""


class CoachPersonalizedRequest(BaseModel):
    task_id: str
    slides: List[Dict[str, Any]]
    user_id: str = "default"


class CoachLiveSessionRequest(BaseModel):
    """R138: AI演讲教练 3.0 - 实时演讲分析请求"""
    task_id: str
    slides: List[Dict[str, Any]]
    speech_transcript: str = ""
    filler_words_detected: List[Dict[str, Any]] = []
    current_wpm: float = 0.0
    total_words_spoken: int = 0
    speaking_duration_seconds: float = 0.0
    eye_contact_ratio: float = 0.0
    gaze_away_count: int = 0
    filler_word_ratio: float = 0.0
    pace_score: float = 0.0
    confidence_score: float = 0.0
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


# ========== Slide Version History ==========

@router.get("/slide_history/{task_id}/{slide_index}")
async def get_slide_history(task_id: str, slide_index: int):
    """获取指定幻灯片的版本历史"""
    from ...services.task_manager import get_task_manager
    tm = get_task_manager()
    history = tm.get_slide_version_history(task_id, slide_index)
    return {"success": True, "history": history}


# ========== Smart Improvement Suggestions ==========

@router.get("/suggest_improve/{task_id}")
async def suggest_improvements(task_id: str):
    """基于分析生成幻灯片改进建议"""
    from ...services.task_manager import get_task_manager
    tm = get_task_manager()
    try:
        return tm.suggest_improvements(task_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail={"error": "ENDPOINT_ERROR", "detail": str(e)})


# ========== Content Language Detection ==========

@router.get("/detect_language/{task_id}")
async def detect_content_language(task_id: str):
    """检测PPT内容的语言"""
    from ...services.task_manager import get_task_manager
    tm = get_task_manager()
    try:
        return tm.detect_language(task_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail={"error": "ENDPOINT_ERROR", "detail": str(e)})


# ========== Presentation Localization/Translation ==========

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
        raise HTTPException(status_code=400, detail={"error": "ENDPOINT_ERROR", "detail": str(e)})


@router.get("/language_versions/{task_id}")
async def list_language_versions(task_id: str):
    """列出某个PPT的所有语言版本"""
    from ...services.task_manager import get_task_manager
    tm = get_task_manager()
    try:
        return tm.list_language_versions(task_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail={"error": "ENDPOINT_ERROR", "detail": str(e)})
