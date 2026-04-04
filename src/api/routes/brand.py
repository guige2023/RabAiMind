# -*- coding: utf-8 -*-
"""
品牌中心 API 路由

R46: Custom Branding & White-label
- 自定义 LOGO 上传与放置
- "Powered by" 显示开关
- 自定义页脚文本
- White-label 全站重品牌
- 从 LOGO 自动提取品牌色
- R64: AI 智能提取图片主题色
- R104: 自定义域名、品牌套件、品牌邮件模板
"""

import base64
import io
import json
import logging
import time
import re
from collections import Counter

from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Optional

from ...services.brand_manager import get_brand_manager, BrandProfile, BrandKit

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/brand", tags=["brand"])


class BrandSaveRequest(BaseModel):
    user_id: str = "default"
    brand_name: str = ""
    primary_color: str = "#165DFF"
    secondary_color: str = "#0E42D2"
    accent_color: str = "#FF9500"
    fonts: Optional[List[str]] = None
    logo_url: str = ""
    slogan: str = ""
    # R46 扩展字段
    logo_data: str = ""
    logo_position: str = "bottom-right"
    powered_by_toggle: bool = True
    footer_text: str = ""
    white_label_mode: bool = False
    auto_color_detection: bool = False
    # R104: 自定义域名 & 邮件模板
    custom_domain: str = ""
    email_template_enabled: bool = True
    email_tagline: str = ""


class BrandKitRequest(BaseModel):
    user_id: str = "default"
    kit_id: str = ""
    kit_name: str = ""
    primary_color: str = "#165DFF"
    secondary_color: str = "#0E42D2"
    accent_color: str = "#FF9500"
    fonts: Optional[List[str]] = None
    logo_data: str = ""
    logo_position: str = "bottom-right"


class EmailShareRequest(BaseModel):
    user_id: str = "default"
    to_email: str = ""
    ppt_title: str = ""
    share_url: str = ""
    message: str = ""


class LogoUploadResponse(BaseModel):
    success: bool
    logo_data: str = ""   # base64
    message: str = ""


class ColorDetectionResponse(BaseModel):
    success: bool
    colors: List[str] = []  # ["#RRGGBB", ...]
    primary_color: str = ""
    secondary_color: str = ""
    accent_color: str = ""
    message: str = ""


# ===== 核心品牌保存/获取 =====

@router.post("/save")
async def save_brand(request: BrandSaveRequest):
    """保存品牌配置（含 R46+R104 扩展字段）"""
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
        logo_data=request.logo_data,
        logo_position=request.logo_position,
        powered_by_toggle=request.powered_by_toggle,
        footer_text=request.footer_text,
        white_label_mode=request.white_label_mode,
        auto_color_detection=request.auto_color_detection,
        custom_domain=request.custom_domain,
        email_template_enabled=request.email_template_enabled,
        email_tagline=request.email_tagline,
    )
    bm.save_brand(brand)

    # 如果有 LOGO data，保存到文件
    if request.logo_data:
        bm.save_logo(request.user_id, request.logo_data)

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


# ===== LOGO 上传 =====

@router.post("/upload-logo", response_model=LogoUploadResponse)
async def upload_logo(user_id: str = "default", file: UploadFile = File(...)):
    """上传 LOGO 图片，返回 base64 编码"""
    if not file.content_type or not file.content_type.startswith("image/"):
        return LogoUploadResponse(success=False, message="仅支持图片文件（PNG/JPG/SVG）")
    
    contents = await file.read()
    
    # 限制 2MB
    if len(contents) > 2 * 1024 * 1024:
        return LogoUploadResponse(success=False, message="图片大小不能超过 2MB")
    
    # 转为 base64
    b64 = base64.b64encode(contents).decode("utf-8")
    mime = file.content_type or "image/png"
    data_uri = f"data:{mime};base64,{b64}"
    
    # 保存到文件
    bm = get_brand_manager()
    bm.save_logo(user_id, data_uri)
    
    return LogoUploadResponse(
        success=True,
        logo_data=data_uri,
        message="LOGO 上传成功"
    )


# ===== 颜色提取 =====

@router.post("/detect-colors", response_model=ColorDetectionResponse)
async def detect_colors(file: UploadFile = File(...)):
    """从 LOGO 图片自动提取品牌配色"""
    if not file.content_type or not file.content_type.startswith("image/"):
        return ColorDetectionResponse(success=False, message="仅支持图片文件")
    
    contents = await file.read()
    
    if len(contents) > 2 * 1024 * 1024:
        return ColorDetectionResponse(success=False, message="图片大小不能超过 2MB")
    
    colors = _extract_colors_from_image(contents)
    
    if not colors:
        return ColorDetectionResponse(success=False, message="无法从图片提取颜色，请手动设置")
    
    return ColorDetectionResponse(
        success=True,
        colors=colors,
        primary_color=colors[0] if len(colors) > 0 else "#165DFF",
        secondary_color=colors[1] if len(colors) > 1 else "#0E42D2",
        accent_color=colors[2] if len(colors) > 2 else "#FF9500",
        message=f"检测到 {len(colors)} 种颜色"
    )


def _extract_colors_from_image(image_bytes: bytes) -> List[str]:
    """从图片字节提取主要颜色"""
    try:
        from PIL import Image
        import io
        
        img = Image.open(io.BytesIO(image_bytes))
        img = img.convert("RGB")
        img.thumbnail((50, 50))
        
        pixels = list(img.getdata())
        color_counts = Counter(pixels)
        
        colors = []
        for (r, g, b), count in color_counts.most_common(20):
            brightness = (r * 299 + g * 587 + b * 114) / 1000
            saturation = (max(r, g, b) - min(r, g, b)) / 255.0
            if brightness < 30 or brightness > 225 or saturation < 0.1:
                continue
            hex_color = f"#{r:02X}{g:02X}{b:02X}"
            colors.append(hex_color)
            if len(colors) >= 5:
                break
        
        return colors
        
    except ImportError:
        return ["#165DFF", "#0E42D2", "#FF9500"]
    except Exception:
        return []


# ===== 品牌套件 API (R104) =====

@router.post("/kit/save")
async def save_brand_kit(request: BrandKitRequest):
    """保存品牌套件"""
    bm = get_brand_manager()
    if request.fonts is None:
        request.fonts = ["思源黑体", "Arial"]

    kit = BrandKit(
        kit_id=request.kit_id,
        kit_name=request.kit_name,
        primary_color=request.primary_color,
        secondary_color=request.secondary_color,
        accent_color=request.accent_color,
        fonts=request.fonts,
        logo_data=request.logo_data,
        logo_position=request.logo_position,
    )
    kit_id = bm.save_brand_kit(request.user_id, kit)
    return {"success": True, "kit_id": kit_id, "message": "品牌套件已保存"}


@router.get("/kit/list/{user_id}")
async def list_brand_kits(user_id: str = "default"):
    """获取品牌套件列表"""
    bm = get_brand_manager()
    kits = bm.get_brand_kits(user_id)
    return {
        "success": True,
        "kits": [k.to_dict() for k in kits]
    }


@router.delete("/kit/{user_id}/{kit_id}")
async def delete_brand_kit(user_id: str, kit_id: str):
    """删除品牌套件"""
    bm = get_brand_manager()
    result = bm.delete_brand_kit(user_id, kit_id)
    return {"success": result, "message": "品牌套件已删除" if result else "品牌套件不存在"}


@router.post("/kit/apply/{user_id}/{kit_id}")
async def apply_brand_kit(user_id: str, kit_id: str):
    """应用品牌套件到主品牌配置"""
    bm = get_brand_manager()
    kit = bm.apply_brand_kit(user_id, kit_id)
    if not kit:
        return {"success": False, "message": "品牌套件不存在"}
    return {"success": True, "message": "品牌套件已应用", "kit": kit.to_dict()}


# ===== 品牌邮件发送 API (R104) =====

@router.post("/email/send")
async def send_branded_email(request: EmailShareRequest):
    """发送品牌化分享邮件"""
    bm = get_brand_manager()
    brand = bm.get_brand(request.user_id)

    try:
        from ...services.email_service import send_ppt_share_email
    except ImportError:
        return {"success": False, "message": "邮件服务未配置"}

    # 获取品牌配置
    if brand:
        primary = brand.primary_color
        secondary = brand.secondary_color
        brand_name = brand.brand_name
        logo_data = brand.logo_data
        email_tagline = brand.email_tagline
        white_label = brand.white_label_mode
        email_enabled = brand.email_template_enabled
    else:
        primary = "#165DFF"
        secondary = "#0E42D2"
        brand_name = "RabAiMind"
        logo_data = ""
        email_tagline = ""
        white_label = False
        email_enabled = True

    sent = send_ppt_share_email(
        to_email=request.to_email,
        from_name=brand_name or "RabAiMind",
        ppt_title=request.ppt_title,
        share_url=request.share_url,
        message=request.message,
        primary_color=primary,
        secondary_color=secondary,
        logo_data=logo_data,
        email_tagline=email_tagline,
        white_label=white_label,
        use_branded_template=email_enabled,
    )

    if sent:
        return {"success": True, "message": "邮件发送成功"}
    else:
        return {"success": False, "message": "邮件发送失败，请检查 SMTP 配置"}


# ===== AI 智能主题色提取 (R64) =====

class AIExtractResponse(BaseModel):
    success: bool
    colors: List[str] = []
    primary_color: str = ""
    secondary_color: str = ""
    accent_color: str = ""
    color_names: List[str] = []
    theme_description: str = ""
    message: str = ""


def _call_volcano_vision(prompt: str, image_b64: str, max_retries: int = 2) -> Optional[str]:
    """调用火山引擎视觉理解 API"""
    try:
        from ...config import settings
        import requests

        cfg = {
            "api_key": settings.VOLCANO_API_KEY,
            "endpoint": settings.VOLCANO_ENDPOINT,
            "project_id": settings.VOLCANO_PROJECT_ID,
        }

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {cfg['api_key']}"
        }

        vision_model = getattr(settings, 'VOLCANO_IMAGE_MODEL', None)
        if not vision_model:
            return None

        data = {
            "model": vision_model,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"}},
                        {"type": "text", "text": prompt}
                    ]
                }
            ],
            "max_tokens": 512,
            "temperature": 0.3
        }

        url = (cfg['endpoint'].rstrip('/') + "/chat/completions") if not cfg['project_id'] else (cfg['endpoint'].rstrip('/') + f"/projects/{cfg['project_id']}/chat/completions")

        resp = requests.post(url, headers=headers, json=data, timeout=(30, 60), verify=False)
        if resp.status_code == 200:
            result = resp.json()
            return result.get("choices", [{}])[0].get("message", {}).get("content", "")
        else:
            logger.warning(f"Vision API failed: {resp.status_code} {resp.text[:200]}")
            return None
    except Exception as e:
        logger.warning(f"Vision API error: {e}")
        return None


def _call_volcano_text(prompt: str, max_retries: int = 2) -> Optional[str]:
    """调用火山引擎文本 API 分析颜色描述"""
    try:
        from ...config import settings
        import requests

        cfg = {
            "api_key": settings.VOLCANO_API_KEY,
            "endpoint": settings.VOLCANO_ENDPOINT,
            "project_id": settings.VOLCANO_PROJECT_ID,
            "model": settings.VOLCANO_TEXT_MODEL,
        }

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {cfg['api_key']}"
        }

        data = {
            "model": cfg["model"],
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.3,
            "max_tokens": 400
        }

        url = (cfg['endpoint'].rstrip('/') + "/chat/completions") if not cfg['project_id'] else (cfg['endpoint'].rstrip('/') + f"/projects/{cfg['project_id']}/chat/completions")

        for attempt in range(max_retries):
            resp = requests.post(url, headers=headers, json=data, timeout=(30, 60), verify=False)
            if resp.status_code == 200:
                result = resp.json()
                return result.get("choices", [{}])[0].get("message", {}).get("content", "")
            elif resp.status_code == 429:
                wait_time = (attempt + 1) * 2
                logger.warning(f"API rate limited, waiting {wait_time}s")
                time.sleep(wait_time)
                continue
            else:
                logger.warning(f"Text API failed: {resp.status_code}")
                break
        return None
    except Exception as e:
        logger.warning(f"Text API error: {e}")
        return None


def _parse_ai_color_response(content: str, default_colors: List[str]) -> dict:
    """解析 AI 返回的颜色响应"""
    result = {
        "colors": default_colors[:3],
        "color_names": [],
        "theme_description": ""
    }

    if not content:
        return result

    json_match = re.search(r'\{[\s\S]*\}', content)
    if json_match:
        try:
            parsed = json.loads(json_match.group(0))
            if "primary" in parsed:
                result["colors"] = [parsed.get("primary", ""), parsed.get("secondary", ""), parsed.get("accent", "")]
                result["colors"] = [c for c in result["colors"] if c and re.match(r'^#[0-9A-Fa-f]{6}$', c)]
            if "color_names" in parsed:
                result["color_names"] = parsed.get("color_names", [])
            if "description" in parsed:
                result["theme_description"] = parsed.get("description", "")
            return result
        except json.JSONDecodeError:
            pass

    hex_colors = re.findall(r'#[0-9A-Fa-f]{6}', content)
    if hex_colors:
        result["colors"] = hex_colors[:3]

    return result


@router.post("/ai-extract-colors", response_model=AIExtractResponse)
async def ai_extract_colors(file: UploadFile = File(...)):
    """R64: AI 智能提取图片主题色"""
    if not file.content_type or not file.content_type.startswith("image/"):
        return AIExtractResponse(success=False, message="仅支持图片文件（PNG/JPG/SVG）")

    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        return AIExtractResponse(success=False, message="图片大小不能超过 5MB")

    pil_colors = _extract_colors_from_image(contents)
    if not pil_colors:
        pil_colors = ["#165DFF", "#0E42D2", "#FF9500"]

    image_b64 = base64.b64encode(contents).decode("utf-8")
    vision_prompt = (
        "你是一个专业的品牌色彩分析 AI。请分析这张图片，输出一个 JSON 对象，包含以下字段：\n"
        "- primary: 主色调的十六进制颜色代码（如 #165DFF）\n"
        "- secondary: 副色调的十六进制颜色代码\n"
        "- accent: 强调色的十六进制颜色代码\n"
        "- color_names: 三个颜色的中文名称数组（如 [\"深蓝\", \"浅灰\", \"金色\"]）\n"
        "- description: 一句话描述这个配色的风格特点（10字以内）\n"
        "只输出 JSON，不要其他内容。"
    )

    ai_colors = None
    ai_result = _call_volcano_vision(vision_prompt, image_b64)

    if ai_result:
        ai_colors = _parse_ai_color_response(ai_result, pil_colors)
    else:
        color_desc = ", ".join(pil_colors[:5])
        text_prompt = (
            f"给定颜色色板：{color_desc}。"
            "请分析这些颜色，输出一个 JSON 对象：\n"
            "- primary: 最适合作为主色的十六进制代码\n"
            "- secondary: 副色十六进制代码\n"
            "- accent: 强调色十六进制代码\n"
            "- color_names: 三个颜色的中文名称\n"
            "- description: 配色风格描述（10字以内）\n"
            "只输出 JSON。"
        )
        text_result = _call_volcano_text(text_prompt)
        if text_result:
            ai_colors = _parse_ai_color_response(text_result, pil_colors)

    if ai_colors:
        final_colors = ai_colors["colors"] if ai_colors["colors"] else pil_colors[:3]
    else:
        final_colors = pil_colors[:3]

    while len(final_colors) < 3:
        final_colors.append(pil_colors[len(final_colors) % len(pil_colors)])

    return AIExtractResponse(
        success=True,
        colors=final_colors,
        primary_color=final_colors[0] if len(final_colors) > 0 else "#165DFF",
        secondary_color=final_colors[1] if len(final_colors) > 1 else "#0E42D2",
        accent_color=final_colors[2] if len(final_colors) > 2 else "#FF9500",
        color_names=ai_colors.get("color_names", []) if ai_colors else [],
        theme_description=ai_colors.get("theme_description", "") if ai_colors else "",
        message="成功提取 " + str(len(final_colors)) + " 种主题色"
    )
