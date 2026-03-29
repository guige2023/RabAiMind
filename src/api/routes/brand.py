# -*- coding: utf-8 -*-
"""
品牌中心 API 路由

作者: Claude
日期: 2026-03-29
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

from ...services.brand_manager import get_brand_manager, BrandProfile

router = APIRouter(prefix="/api/v1/brand", tags=["brand"])


class BrandSaveRequest(BaseModel):
    user_id: str = "default"
    brand_name: str
    primary_color: str = "#165DFF"
    secondary_color: str = "#0E42D2"
    accent_color: str = "#FF9500"
    fonts: List[str] = None
    logo_url: str = ""
    slogan: str = ""


@router.post("/save")
async def save_brand(request: BrandSaveRequest):
    """保存品牌配置"""
    bm = get_brand_manager()
    if request.fonts is None:
        request.fonts = ["思源黑体", "Arial"]

    brand = BrandProfile(
        user_id=request.user_id,
        brand_name=request.brand_name,
        primary_color=request.primary_color,
        secondary_color=request.secondary_color,
        accent_color=request.accent_color,
        fonts=request.fonts,
        logo_url=request.logo_url,
        slogan=request.slogan,
    )
    bm.save_brand(brand)
    return {"success": True, "message": "品牌配置已保存"}


@router.get("/get/{user_id}")
async def get_brand(user_id: str = "default"):
    """获取品牌配置"""
    bm = get_brand_manager()
    brand = bm.get_brand(user_id)
    if not brand:
        return {"success": True, "brand": None}
    return {"success": True, "brand": brand.to_dict()}


@router.delete("/delete/{user_id}")
async def delete_brand(user_id: str = "default"):
    """删除品牌配置"""
    bm = get_brand_manager()
    result = bm.delete_brand(user_id)
    return {"success": result, "message": "品牌配置已删除" if result else "品牌配置不存在"}
