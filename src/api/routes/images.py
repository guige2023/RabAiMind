# -*- coding: utf-8 -*-
"""
图片搜索 API 路由

提供图片搜索功能，支持 Unsplash 和本地图片库
"""
from fastapi import APIRouter, HTTPException, status, Query
from typing import List, Optional
from pydantic import BaseModel, Field
import logging
import os
import httpx
import asyncio

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/images", tags=["images"])


class ImageResult(BaseModel):
    """图片搜索结果"""
    id: str
    url: str
    thumbnail_url: str
    width: int
    height: int
    description: Optional[str] = None
    source: str = "unsplash"
    author: Optional[str] = None
    author_url: Optional[str] = None


class ImageSearchResponse(BaseModel):
    """图片搜索响应"""
    success: bool
    total: int
    page: int
    per_page: int
    images: List[ImageResult]
    message: str = ""


UNSPLASH_ACCESS_KEY = os.getenv("UNSPLASH_ACCESS_KEY", "")


@router.get("/search", response_model=ImageSearchResponse)
async def search_images(
    q: str = Query(..., min_length=1, max_length=100, description="搜索关键词"),
    page: int = Query(1, ge=1, le=100, description="页码"),
    limit: int = Query(20, ge=1, le=50, description="每页数量")
):
    """
    搜索图片
    
    支持 Unsplash 图片搜索，返回高质量免费图片
    """
    if not q:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="搜索关键词不能为空"
        )
    
    images = []
    total = 0
    
    # 优先使用 Unsplash API
    if UNSPLASH_ACCESS_KEY:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    "https://api.unsplash.com/search/photos",
                    headers={
                        "Authorization": f"Client-ID {UNSPLASH_ACCESS_KEY}",
                        "Accept-Version": "v1"
                    },
                    params={
                        "query": q,
                        "page": page,
                        "per_page": limit,
                        "orientation": "landscape"  # PPT 通常使用横向图片
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    total = data.get("total", 0)
                    
                    for item in data.get("results", []):
                        images.append(ImageResult(
                            id=item.get("id", ""),
                            url=item.get("urls", {}).get("regular", ""),
                            thumbnail_url=item.get("urls", {}).get("small", ""),
                            width=item.get("width", 0),
                            height=item.get("height", 0),
                            description=item.get("description") or item.get("alt_description", ""),
                            source="unsplash",
                            author=item.get("user", {}).get("name", ""),
                            author_url=item.get("user", {}).get("links", {}).get("html", "")
                        ))
                else:
                    logger.warning(f"Unsplash API 返回错误: {response.status_code}")
                    
        except httpx.TimeoutException:
            logger.warning("Unsplash API 超时")
        except Exception as e:
            logger.warning(f"Unsplash API 调用失败: {type(e).__name__}")
    
    # 如果 Unsplash 不可用或无结果，使用占位图片
    if not images:
        # 使用 picsum.photos 作为备用图片源
        for i in range(min(limit, 10)):
            import random
            seed = random.randint(1, 1000)
            width, height = 800, 450
            images.append(ImageResult(
                id=f"picsum_{seed}_{i}",
                url=f"https://picsum.photos/seed/{seed}/{width}/{height}",
                thumbnail_url=f"https://picsum.photos/seed/{seed}/200/112",
                width=width,
                height=height,
                description=f"Placeholder image for '{q}'",
                source="picsum",
                author="Picsum Photos",
                author_url="https://picsum.photos"
            ))
        total = limit
    
    return ImageSearchResponse(
        success=True,
        total=total,
        page=page,
        per_page=limit,
        images=images,
        message=f"找到 {total} 张相关图片"
    )


@router.get("/random", response_model=ImageSearchResponse)
async def get_random_images(
    count: int = Query(10, ge=1, le=30, description="图片数量"),
    orientation: str = Query("landscape", description="方向: landscape/portrait/squarish")
):
    """
    获取随机图片
    
    返回指定数量的随机高质量图片
    """
    images = []
    
    if UNSPLASH_ACCESS_KEY:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    "https://api.unsplash.com/photos/random",
                    headers={
                        "Authorization": f"Client-ID {UNSPLASH_ACCESS_KEY}",
                        "Accept-Version": "v1"
                    },
                    params={
                        "count": count,
                        "orientation": orientation
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    
                    for item in data:
                        images.append(ImageResult(
                            id=item.get("id", ""),
                            url=item.get("urls", {}).get("regular", ""),
                            thumbnail_url=item.get("urls", {}).get("small", ""),
                            width=item.get("width", 0),
                            height=item.get("height", 0),
                            description=item.get("description") or item.get("alt_description", ""),
                            source="unsplash",
                            author=item.get("user", {}).get("name", ""),
                            author_url=item.get("user", {}).get("links", {}).get("html", "")
                        ))
                        
        except Exception as e:
            logger.warning(f"Unsplash 随机图片 API 调用失败: {type(e).__name__}")
    
    # 备用方案
    if not images:
        import random
        for i in range(count):
            seed = random.randint(1, 10000)
            width, height = 800, 450
            images.append(ImageResult(
                id=f"picsum_random_{seed}_{i}",
                url=f"https://picsum.photos/seed/{seed}/{width}/{height}",
                thumbnail_url=f"https://picsum.photos/seed/{seed}/200/112",
                width=width,
                height=height,
                description="Random placeholder image",
                source="picsum",
                author="Picsum Photos",
                author_url="https://picsum.photos"
            ))
    
    return ImageSearchResponse(
        success=True,
        total=len(images),
        page=1,
        per_page=count,
        images=images,
        message=f"获取 {len(images)} 张随机图片"
    )


@router.get("/categories")
async def get_image_categories():
    """
    获取图片分类列表
    
    返回常用的图片分类，便于用户选择
    """
    categories = [
        {"id": "business", "name": "商务", "icon": "💼", "keywords": ["office", "meeting", "business"]},
        {"id": "technology", "name": "科技", "icon": "💻", "keywords": ["computer", "technology", "digital"]},
        {"id": "nature", "name": "自然", "icon": "🌿", "keywords": ["nature", "landscape", "forest"]},
        {"id": "people", "name": "人物", "icon": "👥", "keywords": ["people", "team", "portrait"]},
        {"id": "abstract", "name": "抽象", "icon": "🎨", "keywords": ["abstract", "pattern", "texture"]},
        {"id": "education", "name": "教育", "icon": "📚", "keywords": ["education", "learning", "school"]},
        {"id": "finance", "name": "金融", "icon": "💰", "keywords": ["finance", "money", "investment"]},
        {"id": "health", "name": "健康", "icon": "🏥", "keywords": ["health", "medical", "wellness"]},
        {"id": "travel", "name": "旅行", "icon": "✈️", "keywords": ["travel", "vacation", "adventure"]},
        {"id": "food", "name": "美食", "icon": "🍽️", "keywords": ["food", "cooking", "restaurant"]}
    ]
    
    return {
        "success": True,
        "categories": categories
    }
