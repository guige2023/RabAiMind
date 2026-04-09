# -*- coding: utf-8 -*-
"""
Publish Routes — One-Click Publish PPT as Web Page

Generates a standalone, beautiful HTML page for any completed PPT.
Features:
- Beautiful slide viewer (thumbnail navigation)
- Password protection support
- QR code for mobile access
- Embed code generation
- Custom branding (optional logo/title)
- View analytics

Author: Claude
Date: 2026-04-09
"""

import json
import os
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

import httpx
from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from pydantic import BaseModel, Field

from ...config import settings
from ...api.middleware.rate_limit import get_user_id_from_request
from ...services.share_link_service import (
    get_share_link_service,
    SharePermission,
)

router = APIRouter(prefix="/api/v1/publish", tags=["publish"])


# ── Storage ────────────────────────────────────────────────────────────────────

PUBLISH_DIR = Path("./data/publish")
PUBLISH_DIR.mkdir(parents=True, exist_ok=True)

PUBLISH_INDEX_FILE = PUBLISH_DIR / "publish_index.json"


def _load_index() -> Dict[str, Any]:
    try:
        with open(PUBLISH_INDEX_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        return {}


def _save_index(index: Dict[str, Any]) -> None:
    with open(PUBLISH_INDEX_FILE, "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=2)


def _load_publish(publish_id: str) -> Optional[Dict[str, Any]]:
    index = _load_index()
    return index.get(publish_id)


def _save_publish(publish_id: str, data: Dict[str, Any]) -> None:
    index = _load_index()
    index[publish_id] = data
    _save_index(index)


# ── HTML Template ─────────────────────────────────────────────────────────────

PUBLISH_HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title}</title>
  <style>
    :root {{
      --primary: {primary_color};
      --bg: {bg_color};
      --text: {text_color};
      --accent: {accent_color};
    }}
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; }}
    .header {{ background: {header_bg}; padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(0,0,0,0.08); }}
    .header-title {{ font-size: 16px; font-weight: 600; color: var(--primary); }}
    .header-brand {{ font-size: 12px; color: #888; }}
    .slides-container {{ max-width: 1200px; margin: 32px auto; padding: 0 16px; }}
    .slide-wrapper {{ background: white; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.1); overflow: hidden; margin-bottom: 32px; }}
    .slide-wrapper img {{ width: 100%; height: auto; display: block; }}
    .slide-caption {{ padding: 12px 20px; font-size: 13px; color: #666; border-top: 1px solid #f0f0f0; }}
    .thumbnail-nav {{ display: flex; gap: 8px; overflow-x: auto; padding: 16px 0; justify-content: center; flex-wrap: wrap; }}
    .thumbnail {{ width: 80px; height: 45px; border-radius: 6px; overflow: hidden; cursor: pointer; opacity: 0.5; transition: all 0.2s; border: 2px solid transparent; flex-shrink: 0; }}
    .thumbnail:hover, .thumbnail.active {{ opacity: 1; border-color: var(--primary); }}
    .thumbnail img {{ width: 100%; height: 100%; object-fit: cover; }}
    .password-overlay {{ position: fixed; inset: 0; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 1000; }}
    .password-box {{ background: white; padding: 32px; border-radius: 16px; width: 360px; text-align: center; }}
    .password-box h2 {{ font-size: 18px; margin-bottom: 8px; }}
    .password-box p {{ font-size: 14px; color: #666; margin-bottom: 24px; }}
    .password-box input {{ width: 100%; padding: 12px 16px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px; margin-bottom: 16px; text-align: center; }}
    .password-box button {{ width: 100%; padding: 12px; background: var(--primary); color: white; border: none; border-radius: 8px; font-size: 15px; cursor: pointer; }}
    .password-box button:hover {{ opacity: 0.9; }}
    .embed-section {{ max-width: 1200px; margin: 0 auto 32px; padding: 0 16px; }}
    .embed-box {{ background: #1a1a2e; color: #a8dadc; padding: 20px; border-radius: 8px; font-family: 'Courier New', monospace; font-size: 13px; overflow-x: auto; white-space: pre; }}
    .footer {{ text-align: center; padding: 24px; font-size: 12px; color: #aaa; }}
    @media (max-width: 768px) {{ .slide-wrapper {{ border-radius: 0; }} .slides-container {{ margin-top: 16px; }} }}
  </style>
</head>
<body>

<div class="header">
  <span class="header-title">{title}</span>
  <span class="header-brand">由 RabAiMind 驱动</span>
</div>

<div class="slides-container">
  {slides_html}
</div>

<div class="embed-section">
  <h3 style="margin-bottom:12px;font-size:14px;color:#666;">嵌入代码</h3>
  <div class="embed-box">{embed_code}</div>
</div>

<div class="footer">
  阅读 {view_count} 次 · {publish_date}
</div>

<script>
  const slides = document.querySelectorAll('.slide-wrapper');
  const thumbs = document.querySelectorAll('.thumbnail');
  function showSlide(idx) {{
    slides.forEach((s,i) => s.style.display = i === idx ? 'block' : 'none');
    thumbs.forEach((t,i) => t.classList.toggle('active', i === idx));
    window.scrollTo({{ top: slides[0].offsetTop - 80, behavior: 'smooth' }});
  }}
  thumbs.forEach((t, i) => t.addEventListener('click', () => showSlide(i)));
  if (slides.length > 0) showSlide(0);
</script>
</body>
</html>
"""


def _build_slides_html(slides: List[Dict[str, Any]]) -> str:
    """Build HTML for all slides."""
    html_parts = []
    for i, slide in enumerate(slides):
        caption = slide.get("caption", f"第 {i+1} 页")
        img_data = slide.get("image_data", "")
        html_parts.append(
            f'<div class="slide-wrapper" id="slide-{i}">'
            f'<img src="{img_data}" alt="{caption}" loading="lazy" />'
            f'<div class="slide-caption">{caption}</div></div>'
        )
    return "\n".join(html_parts)


# ── Pydantic Models ────────────────────────────────────────────────────────────

class PublishRequest(BaseModel):
    task_id: str = Field(..., description="PPT task ID to publish")
    title: Optional[str] = Field(None, description="Custom page title (optional)")
    password: Optional[str] = Field(None, description="Password protection (optional)")
    primary_color: str = Field(default="#6366f1", description="Primary brand color")
    bg_color: str = Field(default="#f8fafc", description="Background color")
    header_bg: str = Field(default="white", description="Header background")
    text_color: str = Field(default="#1e293b", description="Text color")
    accent_color: str = Field(default="#818cf8", description="Accent color")
    enable_embed: bool = Field(default=True, description="Include embed code")
    custom_logo_url: Optional[str] = Field(None, description="Custom logo URL")


class PublishResponse(BaseModel):
    publish_id: str
    page_url: str
    qr_code_base64: Optional[str]
    embed_code: str
    title: str
    created_at: str
    has_password: bool
    slide_count: int
    view_count: int


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post(
    "/page",
    response_model=PublishResponse,
    summary="Generate Publish Page",
    description="Generate a beautiful standalone web page for a completed PPT. Returns URL, QR code, and embed code.",
)
async def create_publish_page(request: Request, body: PublishRequest):
    """
    One-click publish: generate a public web page for a PPT.
    The page includes a slide viewer, thumbnail navigation, QR code, and embed code.
    """
    user_id = get_user_id_from_request(request) or "anonymous"

    # Get task data
    from ...services.task_manager import get_task_manager
    task_mgr = get_task_manager()
    task = task_mgr.get_task(body.task_id)
    if not task:
        raise HTTPException(status_code=404, detail="PPT task not found")

    result = task.get("result", {}) if task else {}
    slides_data = result.get("slides_summary", [])
    if not slides_data:
        slides_data = [{"caption": f"Slide {i+1}", "image_data": ""} for i in range(result.get("total_slides", 1) or 1)]

    publish_id = uuid.uuid4().hex[:12]
    title = body.title or task.get("title", task.get("user_request", "PPT演示文稿"))

    # Build slide HTML
    slides_html = _build_slides_html(slides_data)

    # Embed code
    page_url = f"/p/{publish_id}"
    embed_code = (
        f'<iframe src="{page_url}" width="100%" height="600" '
        f'frameborder="0" allowfullscreen></iframe>'
    ) if body.enable_embed else ""

    # Generate QR code
    qr_b64 = None
    try:
        from qrcode import QRCode
        from PIL import Image
        import io
        import base64
        qr = QRCode(version=1, box_size=10, border=4)
        qr.add_data(page_url)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        qr_b64 = base64.b64encode(buf.getvalue()).decode()
        qr_b64 = f"data:image/png;base64,{qr_b64}"
    except Exception:
        pass  # QR generation is optional

    # Store published page
    publish_data = {
        "publish_id": publish_id,
        "task_id": body.task_id,
        "title": title,
        "slides": slides_data,
        "slides_html": slides_html,
        "password": body.password or "",
        "has_password": bool(body.password),
        "primary_color": body.primary_color,
        "bg_color": body.bg_color,
        "header_bg": body.header_bg,
        "text_color": body.text_color,
        "accent_color": body.accent_color,
        "embed_code": embed_code,
        "view_count": 0,
        "created_at": datetime.utcnow().isoformat() + "Z",
        "created_by": user_id,
    }
    _save_publish(publish_id, publish_data)

    return PublishResponse(
        publish_id=publish_id,
        page_url=page_url,
        qr_code_base64=qr_b64,
        embed_code=embed_code,
        title=title,
        created_at=publish_data["created_at"],
        has_password=bool(body.password),
        slide_count=len(slides_data),
        view_count=0,
    )


@router.get(
    "/{publish_id}",
    summary="View Published Page",
    description="Serves the published HTML page for a given publish_id.",
)
async def view_published_page(request: Request, publish_id: str):
    """
    Serve the published HTML page.
    Supports password protection if set.
    """
    # Check password
    pw_from_query = request.query_params.get("pw", "")
    pw_from_header = request.headers.get("X-Publish-Password", "")

    data = _load_publish(publish_id)
    if not data:
        raise HTTPException(status_code=404, detail="Published page not found")

    # Increment view count
    data["view_count"] = data.get("view_count", 0) + 1
    _save_publish(publish_id, data)

    # Password check
    stored_pw = data.get("password", "")
    if stored_pw and pw_from_query != stored_pw and pw_from_header != stored_pw:
        # Return password prompt HTML
        return HTMLResponse(
            content=f"""<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Password Required</title></head>
            <body style="display:flex;align-items:center;justify-content:center;height:100vh;background:#f8fafc;font-family:-apple-system,sans-serif;">
            <div style="background:white;padding:40px;border-radius:16px;text-align:center;width:360px;box-shadow:0 4px 24px rgba(0,0,0,0.1);">
              <h2 style="margin-bottom:8px;">🔐 密码保护</h2>
              <p style="color:#666;margin-bottom:24px;">此页面受密码保护，请输入密码访问</p>
              <form method="get" style="display:flex;flex-direction:column;gap:12px;">
                <input name="pw" type="password" placeholder="输入密码" style="padding:12px;border:1px solid #ddd;border-radius:8px;font-size:16px;text-align:center;" />
                <button type="submit" style="padding:12px;background:{data.get('primary_color','#6366f1')};color:white;border:none;border-radius:8px;cursor:pointer;font-size:15px;">访问页面</button>
              </form>
            </div></body></html>""",
            status_code=401,
            media_type="text/html",
        )

    # Render the page
    page_html = PUBLISH_HTML_TEMPLATE.format(
        title=data.get("title", "PPT演示"),
        slides_html=data.get("slides_html", ""),
        embed_code=data.get("embed_code", ""),
        primary_color=data.get("primary_color", "#6366f1"),
        bg_color=data.get("bg_color", "#f8fafc"),
        header_bg=data.get("header_bg", "white"),
        text_color=data.get("text_color", "#1e293b"),
        accent_color=data.get("accent_color", "#818cf8"),
        view_count=data.get("view_count", 0),
        publish_date=data.get("created_at", "")[:10],
    )
    return HTMLResponse(content=page_html, media_type="text/html")


@router.get(
    "/{publish_id}/qr",
    summary="Get QR Code",
    description="Returns the QR code for a published page as a PNG image.",
)
async def get_publish_qr(request: Request, publish_id: str):
    """Return QR code PNG for the published page URL."""
    import io
    import base64

    data = _load_publish(publish_id)
    if not data:
        raise HTTPException(status_code=404, detail="Published page not found")

    try:
        from qrcode import QRCode
        from PIL import Image

        page_url = f"/p/{publish_id}"
        qr = QRCode(version=1, box_size=10, border=4)
        qr.add_data(page_url)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return HTMLResponse(
            content=buf.getvalue(),
            media_type="image/png",
            headers={"Content-Disposition": f"inline; filename=qr_{publish_id}.png"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"QR generation failed: {e}")


@router.get(
    "",
    summary="List My Published Pages",
    description="List all published pages created by the current user.",
)
async def list_published_pages(request: Request):
    """List all published pages for the authenticated user."""
    user_id = get_user_id_from_request(request) or "anonymous"
    index = _load_index()
    results = []
    for pid, data in index.items():
        if data.get("created_by") == user_id:
            results.append({
                "publish_id": pid,
                "title": data.get("title"),
                "page_url": f"/p/{pid}",
                "has_password": data.get("has_password"),
                "slide_count": len(data.get("slides", [])),
                "view_count": data.get("view_count", 0),
                "created_at": data.get("created_at"),
            })
    return {"success": True, "pages": results, "total": len(results)}


@router.delete(
    "/{publish_id}",
    summary="Unpublish Page",
    description="Remove a published page. Takes effect immediately.",
)
async def unpublish_page(request: Request, publish_id: str):
    """Delete (unpublish) a page."""
    user_id = get_user_id_from_request(request) or "anonymous"
    index = _load_index()
    if publish_id not in index:
        raise HTTPException(status_code=404, detail="Published page not found")
    data = index[publish_id]
    if data.get("created_by") != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this page")
    del index[publish_id]
    _save_index(index)
    return {"success": True, "message": "Page unpublished successfully"}


@router.get(
    "/{publish_id}/stats",
    summary="View Stats",
    description="Get view count and basic analytics for a published page.",
)
async def get_publish_stats(request: Request, publish_id: str):
    """Get view statistics for a published page."""
    data = _load_publish(publish_id)
    if not data:
        raise HTTPException(status_code=404, detail="Published page not found")
    return {
        "success": True,
        "publish_id": publish_id,
        "title": data.get("title"),
        "view_count": data.get("view_count", 0),
        "has_password": data.get("has_password"),
        "slide_count": len(data.get("slides", [])),
        "created_at": data.get("created_at"),
    }
