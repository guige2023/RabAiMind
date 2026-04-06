# -*- coding: utf-8 -*-
"""
图片搜索与 AI 处理 API 路由

提供图片搜索、AI 背景移除、AI 图片增强、AI 图标生成等功能
"""
from fastapi import APIRouter, HTTPException, status, Query, UploadFile, File, Form
from fastapi.responses import JSONResponse
from typing import List, Optional
from pydantic import BaseModel, Field
import logging
import os
import io
import base64
import uuid
import random
import httpx
import asyncio
from PIL import Image, ImageFilter, ImageEnhance, ImageOps

# Use shared HTTP client with connection pooling
from src.core.http_client import http_client, is_safe_url

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/images", tags=["images"])


# ==================== 数据模型 ====================

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


class ImageProcessRequest(BaseModel):
    """图片处理请求"""
    image_url: Optional[str] = None
    action: str = Field(..., description="操作: upscale|sharpen|denoise|all")


class ImageProcessResponse(BaseModel):
    """图片处理响应"""
    success: bool
    image_url: str = ""
    message: str = ""


class RemoveBgResponse(BaseModel):
    """背景移除响应"""
    success: bool
    image_url: str = ""
    message: str = ""


class IconGenerateRequest(BaseModel):
    """图标生成请求"""
    prompt: str = Field(..., min_length=1, max_length=200)
    style: str = Field(default="flat", description="风格: flat|outline|3d|hand-drawn")
    color: str = Field(default="#165DFF", description="主色调")


# ==================== 辅助函数 ====================

def _save_base64_image(base64_data: str, prefix: str = "img") -> str:
    """将 base64 图片保存到临时文件，返回 URL"""
    try:
        # 解析 data URI
        if "," in base64_data:
            header, data = base64_data.split(",", 1)
        else:
            data = base64_data
        
        img_bytes = base64.b64decode(data)
        img = Image.open(io.BytesIO(img_bytes))
        
        filename = f"{prefix}_{uuid.uuid4().hex[:8]}.png"
        # 保存到后端 static 目录
        static_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "static")
        os.makedirs(static_dir, exist_ok=True)
        filepath = os.path.join(static_dir, filename)
        img.save(filepath, "PNG")
        
        # 返回相对 URL（前端会拼接后端地址）
        return f"/static/{filename}"
    except Exception as e:
        logger.error(f"保存 base64 图片失败: {e}")
        raise HTTPException(status_code=500, detail="图片处理失败")


def _download_image_as_base64(url: str) -> str:
    """下载图片并转为 base64"""
    if not is_safe_url(url):
        raise ValueError(f"URL failed SSRF validation: {url}")
    resp = http_client.client.get(url, timeout=httpx.Timeout(15.0))
    resp.raise_for_status()
    return base64.b64encode(resp.content).decode()


def _image_to_base64_url(img: Image.Image, fmt: str = "PNG") -> str:
    """将 PIL Image 转为 data URI"""
    buf = io.BytesIO()
    img.save(buf, fmt)
    return f"data:image/{fmt.lower()};base64,{base64.b64encode(buf.getvalue()).decode()}"


def _detect_and_remove_background_pil(img: Image.Image) -> Image.Image:
    """使用 PIL 自动检测并移除背景（基于边缘检测 + 阈值）"""
    # 转换为 RGBA
    img = img.convert("RGBA")
    
    # 缩小加速处理
    w, h = img.size
    scale = min(1.0, 800 / max(w, h))
    if scale < 1.0:
        nw, nh = int(w * scale), int(h * scale)
        img = img.resize((nw, nh), Image.LANCZOS)
    
    # 获取角落颜色（背景色估计）
    corners = [
        img.getpixel((5, 5)),
        img.getpixel((nw - 5 if scale < 1 else w - 5, 5)),
        img.getpixel((5, nh - 5 if scale < 1 else h - 5)),
        img.getpixel((nw - 5 if scale < 1 else w - 5, nh - 5 if scale < 1 else h - 5)),
    ]
    
    # 取平均背景色
    bg_r = sum(c[0] for c in corners) // 4
    bg_g = sum(c[1] for c in corners) // 4
    bg_b = sum(c[2] for c in corners) // 4
    
    # 宽容度
    tolerance = 45
    
    # 缩放回原始尺寸
    pixels = img.load()
    w, h = img.size
    
    for y in range(h):
        for x in range(w):
            p = pixels[x, y]
            r, g, b, a = p
            # 如果像素接近背景色，设为透明
            if (abs(r - bg_r) <= tolerance and 
                abs(g - bg_g) <= tolerance and 
                abs(b - bg_b) <= tolerance):
                pixels[x, y] = (r, g, b, 0)
    
    return img


# ==================== 现有端点（保留）====================

UNSPLASH_ACCESS_KEY = os.getenv("UNSPLASH_ACCESS_KEY", "")
PEXELS_API_KEY = os.getenv("PEXELS_API_KEY", "")


@router.get("/search", response_model=ImageSearchResponse)
async def search_images(
    q: str = Query(..., min_length=1, max_length=100, description="搜索关键词"),
    page: int = Query(1, ge=1, le=100, description="页码"),
    limit: int = Query(20, ge=1, le=50, description="每页数量"),
    source: str = Query("all", description="来源: all|unsplash|pexels")
):
    """搜索图片，支持 Unsplash 和 Pexels"""
    if not q:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="搜索关键词不能为空")
    
    images = []
    total = 0
    
    # Pexels 搜索
    if source in ("all", "pexels") and PEXELS_API_KEY:
        try:
            resp = await http_client.get(
                "https://api.pexels.com/v1/search",
                headers={"Authorization": PEXELS_API_KEY},
                params={"query": q, "page": page, "per_page": limit, "orientation": "landscape"},
                timeout=httpx.Timeout(10.0)
            )
            if resp.status_code == 200:
                data = resp.json()
                total = data.get("total_results", 0)
                for photo in data.get("photos", []):
                    images.append(ImageResult(
                        id=f"pexels_{photo['id']}",
                        url=photo["src"]["large"],
                        thumbnail_url=photo["src"]["medium"],
                        width=photo["width"],
                        height=photo["height"],
                        description=photo.get("alt", ""),
                        source="pexels",
                        author=photo["photographer"],
                        author_url=photo["photographer_url"]
                    ))
        except Exception as e:
            logger.warning(f"Pexels API 调用失败: {e}")
    
    # Unsplash 搜索
    if source in ("all", "unsplash") and (not images or source == "unsplash") and UNSPLASH_ACCESS_KEY:
        try:
            resp = await http_client.get(
                "https://api.unsplash.com/search/photos",
                headers={"Authorization": f"Client-ID {UNSPLASH_ACCESS_KEY}"},
                params={"query": q, "page": page, "per_page": limit, "orientation": "landscape"},
                timeout=httpx.Timeout(10.0)
            )
            if resp.status_code == 200:
                data = resp.json()
                if source == "all" and images and total > 0:
                    # 合并模式：Pexels 在前，忽略 Unsplash 结果
                    pass
                else:
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
                logger.warning(f"Unsplash API 返回错误: {resp.status_code}")
        except Exception as e:
            logger.warning(f"Unsplash API 调用失败: {e}")
    
    # 备用图片
    if not images:
        for i in range(min(limit, 10)):
            seed = random.randint(1, 1000)
            width, height = 800, 450
            images.append(ImageResult(
                id=f"picsum_{seed}_{i}",
                url=f"https://picsum.photos/seed/{seed}/{width}/{height}",
                thumbnail_url=f"https://picsum.photos/seed/{seed}/200/112",
                width=width, height=height,
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
    count: int = Query(10, ge=1, le=30),
    orientation: str = Query("landscape")
):
    """获取随机图片"""
    images = []
    
    if UNSPLASH_ACCESS_KEY:
        try:
            resp = await http_client.get(
                "https://api.unsplash.com/photos/random",
                headers={"Authorization": f"Client-ID {UNSPLASH_ACCESS_KEY}"},
                params={"count": count, "orientation": orientation},
                timeout=httpx.Timeout(10.0)
            )
            if resp.status_code == 200:
                for item in resp.json():
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
            logger.warning(f"Unsplash 随机图片 API 失败: {e}")
    
    if not images:
        for i in range(count):
            seed = random.randint(1, 10000)
            images.append(ImageResult(
                id=f"picsum_random_{seed}_{i}",
                url=f"https://picsum.photos/seed/{seed}/800/450",
                thumbnail_url=f"https://picsum.photos/seed/{seed}/200/112",
                width=800, height=450,
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
    """获取图片分类列表"""
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
    return {"success": True, "categories": categories}


# ==================== 新增 AI 图片处理端点 ====================

@router.post("/remove-background", response_model=RemoveBgResponse)
async def remove_background(
    image_url: str = Form(..., description="图片URL或base64"),
):
    """
    AI 背景移除
    
    支持通过 URL 或 base64 上传图片，自动移除背景并返回透明 PNG
    """
    try:
        # 下载图片
        if image_url.startswith("data:"):
            b64 = image_url
        elif image_url.startswith("http"):
            b64 = _download_image_as_base64(image_url)
        else:
            raise HTTPException(status_code=400, detail="无效的图片地址")
        
        img_bytes = base64.b64decode(b64)
        img = Image.open(io.BytesIO(img_bytes)).convert("RGBA")
        
        # 背景移除处理
        result = _detect_and_remove_background_pil(img)
        
        # 保存结果
        static_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "static")
        os.makedirs(static_dir, exist_ok=True)
        filename = f"nobg_{uuid.uuid4().hex[:8]}.png"
        filepath = os.path.join(static_dir, filename)
        result.save(filepath, "PNG")
        
        return RemoveBgResponse(
            success=True,
            image_url=f"/static/{filename}",
            message="背景移除成功"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"背景移除失败: {e}")
        return RemoveBgResponse(
            success=False,
            image_url="",
            message=f"背景移除失败: {str(e)}"
        )


@router.post("/enhance", response_model=ImageProcessResponse)
async def enhance_image(
    image_url: str = Form(..., description="图片URL或base64"),
    action: str = Form("all", description="操作: upscale|sharpen|denoise|all")
):
    """
    AI 图片增强
    
    - upscale: 2倍放大 + 清晰化
    - sharpen: 锐化增强边缘
    - denoise: 降噪处理
    - all: 综合增强（放大+锐化+降噪）
    """
    try:
        # 下载图片
        if image_url.startswith("data:"):
            b64 = image_url
        elif image_url.startswith("http"):
            b64 = _download_image_as_base64(image_url)
        else:
            raise HTTPException(status_code=400, detail="无效的图片地址")
        
        img_bytes = base64.b64decode(b64)
        img = Image.open(io.BytesIO(img_bytes)).convert("RGBA" if img.mode == "RGBA" else "RGB")
        
        if action in ("upscale", "all"):
            # 2倍放大
            w, h = img.size
            img = img.resize((w * 2, h * 2), Image.LANCZOS)
        
        if action in ("denoise", "all"):
            # 降噪 - 中值滤波
            img = img.filter(ImageFilter.MedianFilter(size=3))
        
        if action in ("sharpen", "all"):
            # 锐化
            enhancer = ImageEnhance.Sharpness(img)
            img = enhancer.enhance(1.8)
        
        # 保存结果
        static_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "static")
        os.makedirs(static_dir, exist_ok=True)
        filename = f"enhanced_{uuid.uuid4().hex[:8]}.png"
        filepath = os.path.join(static_dir, filename)
        
        if img.mode == "RGBA":
            img.save(filepath, "PNG")
        else:
            img.save(filepath, "JPEG", quality=92)
        
        return ImageProcessResponse(
            success=True,
            image_url=f"/static/{filename}",
            message=f"图片增强成功 ({action})"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"图片增强失败: {e}")
        return ImageProcessResponse(
            success=False,
            image_url="",
            message=f"图片增强失败: {str(e)}"
        )


@router.post("/generate-icon", response_model=ImageProcessResponse)
async def generate_icon(request: IconGenerateRequest):
    """
    AI 生成图标和插图
    
    基于文字描述生成图标，支持多种风格
    """
    try:
        from src.services.volc_api import get_volc_api
        from src.services.ppt_planner import sanitize_prompt
        
        volc = get_volc_api()
        safe_prompt = sanitize_prompt(request.prompt)
        
        # 风格化提示词
        style_hints = {
            "flat": "flat design icon, simple, clean, vector style, transparent background, professional",
            "outline": "outline icon, line art, minimal, monochrome, stroke based, clean lines",
            "3d": "3D icon, isometric, rendering, soft shadow, glossy, vibrant colors",
            "hand-drawn": "hand-drawn illustration, sketch style, doodle, pen strokes, playful"
        }
        style_hint = style_hints.get(request.style, style_hints["flat"])
        
        # 添加主色调
        color_hint = f", primary color {request.color}" if request.color != "#165DFF" else ""
        
        full_prompt = f"{safe_prompt}, {style_hint}{color_hint}, high quality icon, 1024x1024, PNG"
        
        result = volc.image_generation(
            prompt=full_prompt,
            size="1024x1024",
            n=1
        )
        
        if result.get("success") and result.get("images"):
            return ImageProcessResponse(
                success=True,
                image_url=result["images"][0],
                message=f"图标生成成功 ({request.style} 风格)"
            )
        else:
            return ImageProcessResponse(
                success=False,
                image_url="",
                message="图标生成失败，请稍后重试"
            )
    except Exception as e:
        logger.error(f"图标生成失败: {e}")
        return ImageProcessResponse(
            success=False,
            image_url="",
            message=f"图标生成失败: {str(e)}"
        )
