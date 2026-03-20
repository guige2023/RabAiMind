# -*- coding: utf-8 -*-
"""
API 路由定义

作者: Claude
日期: 2026-03-17
"""

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import FileResponse, JSONResponse
from typing import Dict, Any, List
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

        # 异步执行生成任务 - 保存 task 引用以便跟踪和取消
        async def run_task():
            try:
                await get_ppt_generator().generate(
                    task_id=task_id,
                    user_request=safe_request,  # 使用过滤后的安全输入
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
                    unified_layout=request.unified_layout
                )
            except Exception as e:
                # 任务失败处理
                logger.error(f"任务 {task_id} 生成失败")
                get_task_manager().fail_task(task_id, "GENERATION_ERROR", str(e))

        # 创建 task 并保存引用
        task = asyncio.create_task(run_task())
        get_task_manager().register_async_task(task_id, task)

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
        error=TaskError(**task["error"]) if task.get("error") else None
    )


@router.get("/preview/{task_id}")
async def get_task_preview(task_id: str):
    """获取任务预览图列表 - 用于实时预览"""
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
    output_dir = settings.OUTPUT_DIR

    # 查找该任务的所有SVG文件
    if os.path.exists(output_dir):
        for filename in os.listdir(output_dir):
            if filename.startswith(f"slide_") and filename.endswith(f"_{task_id}.svg"):
                slide_num = int(filename.split("_")[1])
                svg_files.append({
                    "slide_num": slide_num,
                    "filename": filename,
                    "url": f"/api/v1/ppt/svg/{task_id}/{slide_num}"
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

    filename = f"slide_{slide_num}_{task_id}.svg"
    filepath = os.path.join(settings.OUTPUT_DIR, filename)

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

    # 取消异步任务
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
        path=str(file_path),
        filename=f"presentation_{task_id}.pptx",
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation"
    )


@router.get("/export/pdf/{task_id}")
async def export_pdf(task_id: str):
    """导出PDF"""
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

        pdf_path = pptx_path.replace('.pptx', '.pdf')

        # 方法1: 尝试使用 LibreOffice 转换
        libreoffice_path = shutil.which('libreoffice') or shutil.which('soffice')

        if libreoffice_path:
            # 使用 LibreOffice 转换为 PDF
            result = subprocess.run(
                [libreoffice_path, "--headless", "--convert-to", "pdf", "--outdir",
                 os.path.dirname(pptx_path), pptx_path],
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
            expected_name = os.path.splitext(os.path.basename(pptx_path))[0] + ".pdf"
            expected_path = os.path.join(os.path.dirname(pptx_path), expected_name)

            if os.path.exists(expected_path) and expected_path != pdf_path:
                shutil.move(expected_path, pdf_path)

            if os.path.exists(pdf_path):
                return FileResponse(
                    path=pdf_path,
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
        from src.services.ppt_planner import plan_ppt, sanitize_prompt
        safe_request = sanitize_prompt(request.user_request)

        result = plan_ppt(
            user_request=safe_request,
            slide_count=request.slide_count,
            temperature=0.7
        )

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
