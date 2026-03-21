# -*- coding: utf-8 -*-
"""
模板API路由
"""
from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel

from ...services.template_manager import get_template_manager, Template


router = APIRouter(prefix="/api/v1/templates", tags=["templates"])


class TemplateResponse(BaseModel):
    id: str
    name: str
    description: str
    category: str
    style: str
    thumbnail: str
    colors: List[str]
    fonts: List[str]


@router.get("/list", response_model=List[TemplateResponse])
async def list_templates(
    category: Optional[str] = None,
    style: Optional[str] = None
):
    """获取模板列表"""
    manager = get_template_manager()
    templates = manager.list_templates(category=category, style=style)
    
    return [
        TemplateResponse(
            id=t.id,
            name=t.name,
            description=t.description,
            category=t.category,
            style=t.style,
            thumbnail=t.thumbnail,
            colors=t.colors,
            fonts=t.fonts
        )
        for t in templates
    ]


@router.get("/categories")
async def get_categories():
    """获取所有模板分类"""
    manager = get_template_manager()
    return {"categories": manager.get_categories()}


@router.get("/styles")
async def get_styles():
    """获取所有模板风格"""
    manager = get_template_manager()
    return {"styles": manager.get_styles()}


@router.get("/search", response_model=List[TemplateResponse])
async def search_templates(
    q: str = "",
    category: Optional[str] = None,
    style: Optional[str] = None,
    limit: int = 20
):
    """
    搜索模板

    Args:
        q: 搜索关键词（匹配名称和描述）
        category: 可选，按分类筛选
        style: 可选，按风格筛选
        limit: 返回数量限制，默认20
    """
    manager = get_template_manager()
    templates = manager.search_templates(query=q, category=category, style=style, limit=limit)

    return [
        TemplateResponse(
            id=t.id,
            name=t.name,
            description=t.description,
            category=t.category,
            style=t.style,
            thumbnail=t.thumbnail,
            colors=t.colors,
            fonts=t.fonts
        )
        for t in templates
    ]


@router.get("/{template_id}", response_model=TemplateResponse)
async def get_template(template_id: str):
    """获取指定模板"""
    manager = get_template_manager()
    template = manager.get_template(template_id)
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"模板 {template_id} 不存在"
        )
    
    return TemplateResponse(
        id=template.id,
        name=template.name,
        description=template.description,
        category=template.category,
        style=template.style,
        thumbnail=template.thumbnail,
        colors=template.colors,
        fonts=template.fonts
    )
