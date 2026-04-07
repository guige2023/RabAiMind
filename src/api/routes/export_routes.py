# -*- coding: utf-8 -*-
"""
Export-related API routes.

Handles downloading PPT files and exporting to various formats
(PDF, PNG, ODP, Keynote, Audio, Video).
"""

from fastapi import APIRouter, HTTPException, Request, Query
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import logging
import os

from ._base_routes import (
    _check_rate_limit_middleware,
    validate_task_id,
    validate_output_path,
    create_router,
    settings,
)

logger = logging.getLogger(__name__)

router = create_router(prefix="/api/v1/ppt", tags=["ppt-export"])


# ==================== File Download ====================

@router.get("/download/{task_id}")
async def download_ppt(
    request: Request,
    task_id: str,
    password: str = Query(default=""),
    biometric_token: str = Query(default=""),
):
    """下载 PPT 文件（支持密码保护和生物认证）"""
    from ...services.task_manager import get_task_manager
    from ...core.security import get_presentation_security_manager, get_audit_logger

    # 速率限制检查
    rate_error = _check_rate_limit_middleware(request)
    if rate_error:
        raise HTTPException(
            status_code=429,
            detail="请求过于频繁，请稍后再试"
        )

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
            status_code=404,
            detail=f"任务 {task_id} 不存在"
        )

    if task["status"] != "completed":
        raise HTTPException(
            status_code=400,
            detail=f"任务尚未完成，当前状态: {task['status']}"
        )

    result = task.get("result", {})
    file_path = result.get("pptx_path")

    if not file_path:
        raise HTTPException(
            status_code=400,
            detail="文件路径无效"
        )

    # 规范化路径并验证
    output_dir = os.path.realpath(settings.OUTPUT_DIR)
    file_path_abs = os.path.realpath(file_path)

    if not file_path_abs.startswith(output_dir):
        raise HTTPException(
            status_code=400,
            detail="文件路径不安全"
        )

    if not os.path.exists(file_path_abs):
        raise HTTPException(
            status_code=404,
            detail="文件不存在"
        )

    return FileResponse(
        path=str(file_path_abs),
        filename=f"presentation_{task_id}.pptx",
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation"
    )


# ==================== PDF Export ====================

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


@router.get("/export/pdf/{task_id}")
async def export_pdf(request: Request, task_id: str):
    """导出PDF"""
    from ...services.task_manager import get_task_manager

    rate_error = _check_rate_limit_middleware(request)
    if rate_error:
        raise HTTPException(
            status_code=429,
            detail="请求过于频繁，请稍后再试"
        )

    task = get_task_manager().get_task(task_id)
    if not task:
        raise HTTPException(
            status_code=404,
            detail=f"任务 {task_id} 不存在"
        )

    if task["status"] != "completed":
        raise HTTPException(
            status_code=400,
            detail="任务尚未完成"
        )

    result = task.get("result", {})
    pptx_path = result.get("pptx_path")

    if not pptx_path:
        raise HTTPException(
            status_code=400,
            detail="文件路径无效"
        )

    output_dir = os.path.realpath(settings.OUTPUT_DIR)
    pptx_path_abs = os.path.realpath(pptx_path)

    if not pptx_path_abs.startswith(output_dir):
        raise HTTPException(
            status_code=400,
            detail="文件路径不安全"
        )

    if not os.path.exists(pptx_path_abs):
        raise HTTPException(
            status_code=404,
            detail="PPTX文件不存在"
        )

    try:
        import subprocess
        import shutil

        pdf_path = pptx_path_abs.replace('.pptx', '.pdf')
        pdf_path_abs = os.path.realpath(pdf_path)

        if not pdf_path_abs.startswith(output_dir):
            raise HTTPException(
                status_code=400,
                detail="文件路径不安全"
            )

        libreoffice_path = shutil.which('libreoffice') or shutil.which('soffice')

        if libreoffice_path:
            result = subprocess.run(
                [libreoffice_path, "--headless", "--convert-to", "pdf", "--outdir",
                 os.path.dirname(pptx_path_abs), pptx_path_abs],
                capture_output=True,
                timeout=120
            )

            if result.returncode != 0:
                logger.error(f"LibreOffice PDF转换失败: {result.stderr.decode('utf-8', errors='ignore') if result.stderr else '未知错误'}")
                raise HTTPException(
                    status_code=500,
                    detail="PDF转换失败"
                )

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
            status_code=503,
            detail="PDF转换服务不可用，请安装 LibreOffice"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="PDF转换失败，请稍后重试"
        )


@router.post("/export/enhanced-pdf/{task_id}")
async def export_enhanced_pdf(
    request: Request,
    task_id: str,
    options: PdfExportOptions = None
):
    """增强PDF导出 - 支持幻灯片/备注页/讲义格式、自定义页面、水印、页眉页脚"""
    from ...services.task_manager import get_task_manager

    if options is None:
        options = PdfExportOptions()

    rate_error = _check_rate_limit_middleware(request)
    if rate_error:
        raise HTTPException(
            status_code=429,
            detail="请求过于频繁，请稍后再试"
        )

    task = get_task_manager().get_task(task_id)
    if not task:
        raise HTTPException(
            status_code=404,
            detail=f"任务 {task_id} 不存在"
        )

    if task["status"] != "completed":
        raise HTTPException(
            status_code=400,
            detail="任务尚未完成"
        )

    result = task.get("result", {})
    pptx_path = result.get("pptx_path")

    if not pptx_path:
        raise HTTPException(
            status_code=400,
            detail="PPTX路径无效"
        )

    output_dir = os.path.realpath(settings.OUTPUT_DIR)
    pptx_path_abs = os.path.realpath(pptx_path)

    if not pptx_path_abs.startswith(output_dir):
        raise HTTPException(
            status_code=400,
            detail="文件路径不安全"
        )

    if not os.path.exists(pptx_path_abs):
        raise HTTPException(
            status_code=404,
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

    suffix = f"_{options.mode}"
    if options.mode == "handout":
        suffix += f"_{options.handout_layout}up"
    if options.watermark_enabled:
        suffix += "_watermarked"

    pdf_filename = f"presentation_{task_id}{suffix}.pdf"
    pdf_path_abs = os.path.join(os.path.dirname(pptx_path_abs), pdf_filename)
    pdf_path_abs = os.path.realpath(pdf_path_abs)

    if not pdf_path_abs.startswith(output_dir):
        raise HTTPException(
            status_code=400,
            detail="输出路径不安全"
        )

    try:
        export_service = get_enhanced_pdf_export_service()

        if not export_service.is_available():
            return await _fallback_export_pdf_libreoffice(task_id, pptx_path_abs, pdf_path_abs)

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
            return await _fallback_export_pdf_libreoffice(task_id, pptx_path_abs, pdf_path_abs)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Enhanced PDF export failed: {e}")
        return await _fallback_export_pdf_libreoffice(task_id, pptx_path_abs, pdf_path_abs)


async def _fallback_export_pdf_libreoffice(
    task_id: str,
    pptx_path_abs: str,
    pdf_path_abs: str
):
    """Fallback to LibreOffice PDF conversion"""
    try:
        import subprocess
        import shutil

        libreoffice_path = shutil.which('libreoffice') or shutil.which('soffice')

        if not libreoffice_path:
            raise HTTPException(
                status_code=503,
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
                status_code=500,
                detail="PDF转换失败"
            )

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
            status_code=500,
            detail="PDF转换失败"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"LibreOffice fallback failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="PDF转换失败，请稍后重试"
        )


# ==================== PNG Export ====================

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
    """导出PNG图片序列（每页一张），支持水印功能"""
    from ...services.task_manager import get_task_manager
    from ...core.http_client import http_client, is_safe_url

    rate_error = _check_rate_limit_middleware(request)
    if rate_error:
        raise HTTPException(
            status_code=429,
            detail="请求过于频繁，请稍后再试"
        )

    task = get_task_manager().get_task(task_id)
    if not task:
        raise HTTPException(
            status_code=404,
            detail=f"任务 {task_id} 不存在"
        )

    if task["status"] != "completed":
        raise HTTPException(
            status_code=400,
            detail="任务尚未完成"
        )

    result = task.get("result", {})
    svg_urls = result.get("svg_urls", [])

    if not svg_urls:
        raise HTTPException(
            status_code=400,
            detail="没有可导出的幻灯片"
        )

    resolution_map = {
        "720p": (1280, 720),
        "1080p": (1920, 1080),
        "4K": (3840, 2160)
    }
    width, height = resolution_map.get(resolution, (1920, 1080))

    def apply_watermark_to_png(png_data: bytes, wm_text: str, wm_opacity: float,
                                wm_angle: int, wm_font_size: int, wm_color: str) -> bytes:
        """Apply diagonal watermark text to a PNG image using PIL."""
        try:
            from PIL import Image, ImageDraw, ImageFont
            import io as pil_io

            img = Image.open(pil_io.BytesIO(png_data)).convert("RGBA")
            overlay = Image.new("RGBA", img.size, (255, 255, 255, 0))
            draw = ImageDraw.Draw(overlay)

            color_hex = wm_color.lstrip("#")
            r = int(color_hex[0:2], 16)
            g = int(color_hex[2:4], 16)
            b = int(color_hex[4:6], 16)
            wm_color_rgba = (r, g, b, int(255 * min(max(wm_opacity, 0), 1)))

            scale_factor = img.width / 1920
            scaled_font_size = max(24, int(wm_font_size * scale_factor))

            try:
                font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", scaled_font_size)
            except Exception:
                font = ImageFont.load_default()

            bbox = draw.textbbox((0, 0), wm_text, font=font)
            text_w = bbox[2] - bbox[0]
            text_h = bbox[3] - bbox[1]

            spacing_x = int(text_w * 2.5)
            spacing_y = int(text_h * 3.0)

            import math
            angle_rad = math.radians(wm_angle)
            cos_a = abs(math.cos(angle_rad))
            sin_a = abs(math.sin(angle_rad))

            rotated_w = int(text_w * cos_a + text_h * sin_a)
            rotated_h = int(text_w * sin_a + text_h * cos_a)

            diagonal = int(math.hypot(img.width, img.height))
            start_x = -diagonal
            end_x = img.width + diagonal
            start_y = -diagonal
            end_y = img.height + diagonal

            for y in range(start_y, end_y, spacing_y):
                for x in range(start_x, end_x, spacing_x):
                    rotated_x = int(x * cos_a - y * sin_a)
                    rotated_y = int(x * sin_a + y * cos_a)
                    draw.text((rotated_x, rotated_y), wm_text, font=font, fill=wm_color_rgba)

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

        png_files = []
        for i, svg_url in enumerate(svg_urls):
            if svg_url.startswith('/'):
                svg_url = f"http://localhost:{settings.API_PORT}{svg_url}"

            if not is_safe_url(svg_url):
                logger.warning(f"SSRF blocked: {svg_url}")
                continue

            resp = await http_client.get(svg_url, timeout=httpx.Timeout(30.0))
            if resp.status_code != 200:
                continue

            svg_content = resp.content

            try:
                import cairosvg
                png_data = cairosvg.svg2png(
                    bytestring=svg_content,
                    output_width=width,
                    output_height=height
                )
            except ImportError:
                png_data = None

            if png_data:
                if watermark_enabled:
                    png_data = apply_watermark_to_png(
                        png_data,
                        watermark_text,
                        watermark_opacity,
                        watermark_angle,
                        watermark_font_size,
                        watermark_color
                    )
                png_files.append((f"slide_{i+1:03d}.png", png_data))

        if not png_files:
            raise HTTPException(
                status_code=500,
                detail="图片转换失败，请安装 cairosvg: pip install cairosvg"
            )

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
            status_code=500,
            detail={"success": False, "error": f"PNG导出失败: {str(e)}"}
        )


# ==================== Additional Export Formats ====================

class ExportOdpRequest(BaseModel):
    """ODP export options"""
    pass


@router.get("/export/odp/{task_id}")
async def export_odp(request: Request, task_id: str):
    """导出 PPT 到 ODP (OpenDocument) 格式"""
    from ...services.task_manager import get_task_manager

    rate_error = _check_rate_limit_middleware(request)
    if rate_error:
        raise HTTPException(status_code=429, detail="请求过于频繁")

    task = get_task_manager().get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail=f"任务 {task_id} 不存在")

    if task["status"] != "completed":
        raise HTTPException(status_code=400, detail="任务尚未完成")

    result = task.get("result", {})
    pptx_path = result.get("pptx_path")

    if not pptx_path or not os.path.exists(pptx_path):
        raise HTTPException(status_code=404, detail="PPTX 文件不存在")

    output_dir = os.path.realpath(settings.OUTPUT_DIR)
    pptx_path_abs = os.path.realpath(pptx_path)
    if not pptx_path_abs.startswith(output_dir):
        raise HTTPException(status_code=400, detail="文件路径不安全")

    odp_filename = f"presentation_{task_id}.odp"
    odp_path_abs = os.path.join(os.path.dirname(pptx_path_abs), odp_filename)

    from src.services.additional_export_service import get_additional_export_service
    export_service = get_additional_export_service()

    export_result = await export_service.export_to_odp(task_id, pptx_path_abs, odp_path_abs)

    if not export_result.get("success"):
        return JSONResponse(content=export_result, status_code=500)

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
async def export_keynote(request: Request, task_id: str):
    """导出 PPT 到 Keynote (.key) 格式"""
    from ...services.task_manager import get_task_manager

    rate_error = _check_rate_limit_middleware(request)
    if rate_error:
        raise HTTPException(status_code=429, detail="请求过于频繁")

    task = get_task_manager().get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail=f"任务 {task_id} 不存在")

    if task["status"] != "completed":
        raise HTTPException(status_code=400, detail="任务尚未完成")

    result = task.get("result", {})
    pptx_path = result.get("pptx_path")

    if not pptx_path or not os.path.exists(pptx_path):
        raise HTTPException(status_code=404, detail="PPTX 文件不存在")

    output_dir = os.path.realpath(settings.OUTPUT_DIR)
    pptx_path_abs = os.path.realpath(pptx_path)
    if not pptx_path_abs.startswith(output_dir):
        raise HTTPException(status_code=400, detail="文件路径不安全")

    key_filename = f"presentation_{task_id}.key.zip"
    key_path_abs = os.path.join(os.path.dirname(pptx_path_abs), key_filename)

    from src.services.additional_export_service import get_additional_export_service
    export_service = get_additional_export_service()

    export_result = await export_service.export_to_keynote(task_id, pptx_path_abs, key_path_abs)

    if not export_result.get("success"):
        return JSONResponse(content=export_result, status_code=500)

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
    from ...services.task_manager import get_task_manager

    rate_error = _check_rate_limit_middleware(request)
    if rate_error:
        raise HTTPException(status_code=429, detail="请求过于频繁")

    task = get_task_manager().get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail=f"任务 {task_id} 不存在")

    if task["status"] != "completed":
        raise HTTPException(status_code=400, detail="任务尚未完成")

    result = task.get("result", {})
    pptx_path = result.get("pptx_path")

    if not pptx_path or not os.path.exists(pptx_path):
        raise HTTPException(status_code=404, detail="PPTX 文件不存在")

    output_dir = os.path.realpath(settings.OUTPUT_DIR)
    pptx_path_abs = os.path.realpath(pptx_path)
    if not pptx_path_abs.startswith(output_dir):
        raise HTTPException(status_code=400, detail="文件路径不安全")

    audio_filename = f"presentation_{task_id}.mp3"
    audio_path_abs = os.path.join(os.path.dirname(pptx_path_abs), audio_filename)

    from src.services.additional_export_service import get_additional_export_service
    export_service = get_additional_export_service()

    # Get slides content for narration
    slides_content = None
    if body.include_audio if hasattr(body, 'include_audio') else True:
        outline = result.get("outline", {})
        if isinstance(outline, dict):
            slides_content = outline.get("slides", [])

    export_result = await export_service.export_to_audio(
        task_id, pptx_path_abs, audio_path_abs,
        voice=body.voice,
        rate=body.rate,
        volume=body.volume,
        slides_content=slides_content or body.slides_content
    )

    if not export_result.get("success"):
        return JSONResponse(content=export_result, status_code=500)

    output_file = export_result.get("output_path", audio_path_abs)
    if os.path.exists(output_file):
        return FileResponse(
            path=str(output_file),
            filename=audio_filename,
            media_type="audio/mpeg"
        )

    return JSONResponse(content=export_result)


class ExportVideoRequest(BaseModel):
    """Video export options"""
    resolution: str = Field(default="1080p", description="分辨率: 720p, 1080p, 4K")
    duration_per_slide: int = Field(default=5, description="每张幻灯片持续时间(秒)")
    transition: str = Field(default="fade", description="转场效果: fade, slide, none")
    include_audio: bool = Field(default=True, description="包含音频")
    voice: str = Field(default="zh-CN-XiaoxiaoNeural", description="语音")
    slide_range: Optional[str] = Field(default=None, description="幻灯片范围，如 '1-5'")
    slides_content: Optional[List[Dict[str, Any]]] = Field(default=None, description="幻灯片内容")


@router.post("/export/video/{task_id}")
async def export_video(
    request: Request,
    task_id: str,
    body: ExportVideoRequest,
):
    """导出 PPT 为 MP4 视频"""
    from ...services.task_manager import get_task_manager

    rate_error = _check_rate_limit_middleware(request)
    if rate_error:
        raise HTTPException(status_code=429, detail="请求过于频繁")

    task = get_task_manager().get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail=f"任务 {task_id} 不存在")

    if task["status"] != "completed":
        raise HTTPException(status_code=400, detail="任务尚未完成")

    result = task.get("result", {})
    pptx_path = result.get("pptx_path")

    if not pptx_path or not os.path.exists(pptx_path):
        raise HTTPException(status_code=404, detail="PPTX 文件不存在")

    output_dir = os.path.realpath(settings.OUTPUT_DIR)
    pptx_path_abs = os.path.realpath(pptx_path)
    if not pptx_path_abs.startswith(output_dir):
        raise HTTPException(status_code=400, detail="文件路径不安全")

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
