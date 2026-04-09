"""
品牌资产 API 路由

支持多品牌资产管理（创建、查询、更新、删除、Logo上传、应用到PPT）

作者: Claude
日期: 2026-04-09
"""

import base64
import logging

from fastapi import APIRouter, File, HTTPException, Query, UploadFile
from pydantic import BaseModel

from ...services.brand_service import get_brand_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/brand", tags=["brand-assets"])


# ========== 请求/响应模型 ==========

class BrandCreateRequest(BaseModel):
    user_id: str = "default"
    name: str = ""
    primary_color: str = "#165DFF"
    secondary_color: str = "#0E42D2"
    font_family: str = "思源黑体"
    logo_url: str | None = None


class BrandUpdateRequest(BaseModel):
    name: str | None = None
    primary_color: str | None = None
    secondary_color: str | None = None
    font_family: str | None = None
    logo_url: str | None = None


class LogoUploadResponse(BaseModel):
    success: bool
    logo_url: str = ""
    message: str = ""


class BrandApplyResponse(BaseModel):
    success: bool
    message: str = ""
    theme: dict = {}


# ========== 品牌 CRUD API ==========

@router.get("")
async def list_brands(user_id: str = Query("default", description="用户ID")):
    """列出用户所有品牌"""
    bs = get_brand_service()
    brands = bs.get_user_brands(user_id)
    return {
        "success": True,
        "brands": [b.to_dict() for b in brands],
        "count": len(brands)
    }


@router.post("")
async def create_brand(request: BrandCreateRequest):
    """创建品牌"""
    if not request.name:
        raise HTTPException(status_code=400, detail="品牌名称不能为空")

    bs = get_brand_service()
    brand = bs.create_brand(
        user_id=request.user_id,
        name=request.name,
        primary_color=request.primary_color,
        secondary_color=request.secondary_color,
        font_family=request.font_family,
        logo_url=request.logo_url
    )
    return {
        "success": True,
        "brand": brand.to_dict(),
        "message": "品牌创建成功"
    }


@router.get("/{brand_id}")
async def get_brand(brand_id: str):
    """获取单个品牌"""
    bs = get_brand_service()
    brand = bs.get_brand(brand_id)
    if not brand:
        raise HTTPException(status_code=404, detail="品牌不存在")
    return {
        "success": True,
        "brand": brand.to_dict()
    }


@router.put("/{brand_id}")
async def update_brand(brand_id: str, request: BrandUpdateRequest):
    """更新品牌"""
    bs = get_brand_service()
    brand = bs.update_brand(
        brand_id=brand_id,
        name=request.name,
        primary_color=request.primary_color,
        secondary_color=request.secondary_color,
        font_family=request.font_family,
        logo_url=request.logo_url
    )
    if not brand:
        raise HTTPException(status_code=404, detail="品牌不存在")
    return {
        "success": True,
        "brand": brand.to_dict(),
        "message": "品牌更新成功"
    }


@router.delete("/{brand_id}")
async def delete_brand(brand_id: str):
    """删除品牌"""
    bs = get_brand_service()
    result = bs.delete_brand(brand_id)
    if not result:
        raise HTTPException(status_code=404, detail="品牌不存在")
    return {
        "success": True,
        "message": "品牌删除成功"
    }


# ========== Logo 上传 ==========

@router.post("/{brand_id}/logo", response_model=LogoUploadResponse)
async def upload_logo(brand_id: str, file: UploadFile = File(...)):
    """上传品牌 Logo（支持 OSS 或本地存储）"""
    # 验证文件类型
    if not file.content_type or not file.content_type.startswith("image/"):
        return LogoUploadResponse(
            success=False,
            logo_url="",
            message="仅支持图片文件（PNG、JPG、SVG）"
        )

    # 读取文件内容
    contents = await file.read()

    # 限制 2MB
    if len(contents) > 2 * 1024 * 1024:
        return LogoUploadResponse(
            success=False,
            logo_url="",
            message="图片大小不能超过 2MB"
        )

    # 转为 base64
    b64_data = base64.b64encode(contents).decode("utf-8")

    # 保存 Logo
    bs = get_brand_service()
    logo_url = bs.save_logo(brand_id, b64_data)

    if not logo_url:
        return LogoUploadResponse(
            success=False,
            logo_url="",
            message="Logo 保存失败"
        )

    return LogoUploadResponse(
        success=True,
        logo_url=logo_url,
        message="Logo 上传成功"
    )


# ========== 品牌应用 ==========

@router.get("/{brand_id}/apply/{task_id}", response_model=BrandApplyResponse)
async def apply_brand_to_ppt(brand_id: str, task_id: str):
    """将品牌应用到 PPT 任务

    - 修改 PPT 主题色
    - 替换 Logo 位置
    - 应用指定字体
    """
    bs = get_brand_service()
    theme = bs.apply_brand_to_ppt(brand_id, task_id)

    if not theme:
        raise HTTPException(status_code=404, detail="品牌或任务不存在")

    return BrandApplyResponse(
        success=True,
        message=f"品牌已应用到任务 {task_id}",
        theme=theme
    )


@router.get("/{brand_id}/preview")
async def get_brand_preview(brand_id: str):
    """获取品牌预览数据"""
    bs = get_brand_service()
    preview = bs.get_brand_preview(brand_id)

    if not preview:
        raise HTTPException(status_code=404, detail="品牌不存在")

    return {
        "success": True,
        "preview": preview
    }


# ========== 批量操作 ==========

class BrandBatchApplyRequest(BaseModel):
    brand_ids: list[str]
    task_ids: list[str]


@router.post("/batch-apply")
async def batch_apply_brand(request: BrandBatchApplyRequest):
    """批量将品牌应用到多个 PPT 任务"""
    if len(request.brand_ids) != len(request.task_ids):
        raise HTTPException(
            status_code=400,
            detail="品牌ID列表和任务ID列表长度必须一致"
        )

    bs = get_brand_service()
    results = []

    for brand_id, task_id in zip(request.brand_ids, request.task_ids):
        theme = bs.apply_brand_to_ppt(brand_id, task_id)
        results.append({
            "brand_id": brand_id,
            "task_id": task_id,
            "success": theme is not None,
            "theme": theme or {}
        })

    success_count = sum(1 for r in results if r["success"])

    return {
        "success": True,
        "message": f"成功应用 {success_count}/{len(results)} 个品牌",
        "results": results
    }
