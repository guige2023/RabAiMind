# -*- coding: utf-8 -*-
"""
Zapier / Make 集成路由

提供符合 Zapier/Make 要求的 API 接口格式：
- REST API Key 认证
- Zapier 兼容的 Webhook 接收端点
- 可发现性 endpoint (/api-key-info)
- 兼容 Zapier 自定义 API 集成格式的 OAuth 草稿

用法：
1. API Key 模式：Header `X-API-Key: your-api-key`
2. Webhook 模式：使用 /api/v1/webhooks/zapier/{api_key}/receive
3. OAuth 模式（草稿）：GET /api/v1/zapier/oauth/authorize → POST /api/v1/zapier/oauth/token

作者: Claude
日期: 2026-04-04
"""

import secrets
import time
from typing import Dict, Any, Optional, List

from fastapi import APIRouter, HTTPException, Header, Query, status, Request
from pydantic import BaseModel

from ...config import settings

router = APIRouter(prefix="/api/v1/zapier", tags=["zapier-integration"])


# ── Mock API Key 存储（生产环境应使用数据库） ───────────────────────────────

_api_keys: Dict[str, Dict[str, Any]] = {}  # key → {user_id, scopes, created_at, label}


# ── Models ──────────────────────────────────────────────────

class APIKeyCreateRequest(BaseModel):
    label: str = "Zapier Integration"
    scopes: List[str] = ["ppt:read", "ppt:write", "webhook:manage"]


class APIKeyCreateResponse(BaseModel):
    api_key: str
    label: str
    scopes: List[str]
    created_at: float


class APIKeyInfo(BaseModel):
    key_id: str  # 只显示后4位
    label: str
    scopes: List[str]
    created_at: float
    last_used: Optional[float] = None


class ZapierTriggerPayload(BaseModel):
    """Zapier Trigger 触发器载荷（用于 webhook 等）"""
    event: str
    timestamp: int
    task_id: str
    data: Dict[str, Any]


# ── API Key 认证依赖 ────────────────────────────────────────

async def verify_api_key(x_api_key: Optional[str] = Header(None)) -> Dict[str, Any]:
    """验证 API Key，返回关联的 key info"""
    if not x_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="缺少 X-API-Key Header",
            headers={"WWW-Authenticate": "ApiKey"},
        )
    if x_api_key not in _api_keys:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的 API Key",
        )
    key_info = _api_keys[x_api_key]
    key_info["last_used"] = time.time()
    return key_info


# ── Routes ──────────────────────────────────────────────────

@router.get(
    "/api-key-info",
    summary="获取当前 API Key 信息",
    description="""
返回当前 API Key 的信息（不含明文 key）。

**Zapier 自定义 API 集成要求:**
Zapier 会自动在发出请求时带上 `X-API-Key`，本端点用于验证 key 是否有效。
""",
)
async def get_api_key_info(x_api_key: str = Header(..., alias="X-API-Key")):
    key_info = _api_keys.get(x_api_key)
    if not key_info:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="无效的 API Key")
    key_info["last_used"] = time.time()
    key_id = f"****{x_api_key[-4:]}"
    return APIKeyInfo(
        key_id=key_id,
        label=key_info["label"],
        scopes=key_info["scopes"],
        created_at=key_info["created_at"],
        last_used=key_info.get("last_used"),
    )


@router.post(
    "/api-keys",
    response_model=APIKeyCreateResponse,
    summary="创建 API Key（Zapier/Make 集成用）",
    description="""
创建一组新的 API Key，用于 Zapier/Make 等第三方自动化平台。

**Zapier/Make 配置步骤:**
1. 在 RabAiMind 中创建 API Key（本端点）
2. 复制返回的 `api_key`
3. 在 Zapier 中配置「Custom API Authentication」：
   - Key Header Name: `X-API-Key`
   - Key Value: 复制的 `api_key`
4. 测试连接（调用 GET /api/v1/zapier/api-key-info）

**权限说明:**
- `ppt:read` — 读取 PPT 状态和结果
- `ppt:write` — 创建 PPT 生成任务
- `webhook:manage` — 管理 Webhook
""",
)
async def create_api_key(body: APIKeyCreateRequest = APIKeyCreateRequest()):
    import hashlib
    api_key = f"rabai_{secrets.token_urlsafe(32)}"
    key_id = hashlib.sha256(api_key.encode()).hexdigest()[:8]

    _api_keys[api_key] = {
        "key_id": key_id,
        "user_id": "zapier_user",
        "label": body.label,
        "scopes": body.scopes,
        "created_at": time.time(),
        "last_used": None,
    }

    return APIKeyCreateResponse(
        api_key=api_key,
        label=body.label,
        scopes=body.scopes,
        created_at=time.time(),
    )


@router.delete(
    "/api-keys/{api_key_prefix}",
    summary="删除 API Key",
    description="删除指定的 API Key（api_key_prefix 为 key 的后8位）",
)
async def delete_api_key(api_key_prefix: str):
    to_delete = None
    for key, info in _api_keys.items():
        if key.endswith(api_key_prefix) or info["key_id"] == api_key_prefix:
            to_delete = key
            break
    if not to_delete:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API Key 不存在")
    del _api_keys[to_delete]
    return {"success": True}


# ── OAuth 草稿（Zapier OAuth1/2 兼容）──────────────────────

@router.get(
    "/oauth/authorize",
    summary="[OAuth 草稿] 授权页",
    description="""
OAuth2 授权端点（草稿，生产需对接真实用户系统）。

Zapier OAuth 流程:
1. 跳转此端点 authorization
2. 用户授权后回调 redirect_uri
3. 交换 authorization_code 为 access_token
""",
)
async def oauth_authorize(
    response_type: str = Query(...),
    client_id: str = Query(...),
    redirect_uri: str = Query(...),
    state: Optional[str] = Query(None),
):
    if response_type != "code":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="response_type 必须是 code")
    # 草稿：直接返回成功（真实场景需用户登录+授权确认页）
    code = secrets.token_urlsafe(32)
    import urllib.parse
    params = {"code": code}
    if state:
        params["state"] = state
    return {
        "authorization_url": f"{redirect_uri}?{urllib.parse.urlencode(params)}",
        "note": "OAuth draft — implement user login and consent page for production",
    }


@router.post(
    "/oauth/token",
    summary="[OAuth 草稿] 获取 Access Token",
    description="OAuth2 Token 交换端点（草稿）",
)
async def oauth_token(
    grant_type: str = Query(...),
    code: Optional[str] = Query(None),
    client_id: str = Query(...),
    client_secret: Optional[str] = Query(None),
):
    if grant_type == "authorization_code":
        if not code:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="缺少 code")
        # 草稿：直接返回 token
        return {
            "access_token": f"rabai_oauth_{secrets.token_urlsafe(32)}",
            "token_type": "Bearer",
            "expires_in": 3600,
            "refresh_token": secrets.token_urlsafe(32),
        }
    elif grant_type == "refresh_token":
        return {
            "access_token": f"rabai_oauth_{secrets.token_urlsafe(32)}",
            "token_type": "Bearer",
            "expires_in": 3600,
        }
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"不支持的 grant_type: {grant_type}")


# ── Zapier Trigger Endpoints ────────────────────────────────

@router.get(
    "/triggers/ppt_completed",
    summary="[Zapier Trigger] PPT 生成完成",
    description="""
Zapier Trigger 示例：监听 PPT 生成完成事件。
返回最近完成的生成任务列表（最多 50 条）。

Zapier 配置:
- Trigger Type: Custom Pull Request
- Polling URL: GET /api/v1/zapier/triggers/ppt_completed
- 映射字段: task_id, created_at, download_url
""",
)
async def trigger_ppt_completed(
    x_api_key: str = Header(..., alias="X-API-Key"),
    limit: int = Query(50, ge=1, le=50),
):
    await verify_api_key(x_api_key)
    # 草稿：从 task_manager 获取最近完成的任务
    from ...services.task_manager import get_task_manager
    tm = get_task_manager()
    # 返回空列表草稿（真实场景接入数据库）
    return {"results": [], "count": 0}


@router.get(
    "/triggers/ppt_failed",
    summary="[Zapier Trigger] PPT 生成失败",
    description="Zapier Trigger：监听 PPT 生成失败事件",
)
async def trigger_ppt_failed(
    x_api_key: str = Header(..., alias="X-API-Key"),
    limit: int = Query(50, ge=1, le=50),
):
    await verify_api_key(x_api_key)
    return {"results": [], "count": 0}


# ── Zapier Action Endpoints ─────────────────────────────────

@router.post(
    "/actions/generate_ppt",
    summary="[Zapier Action] 创建 PPT 生成任务",
    description="""
Zapier Action 示例：创建新的 PPT 生成任务。

Zapier 配置:
- Action Type: Custom Request
- Method: POST
- URL: GET /api/v1/zapier/actions/generate_ppt
- Body Type: JSON
""",
)
async def action_generate_ppt(
    x_api_key: str = Header(..., alias="X-API-Key"),
    request: Request = None,
):
    await verify_api_key(x_api_key)
    body = await request.json()
    # 转发到主 API
    from ...api.routes.ppt import router as ppt_router
    # 简化：返回 task_id，实际转发逻辑在主 API
    return {
        "task_id": f"zapier_{int(time.time())}",
        "status": "queued",
        "message": "任务已排队，实际生成调用 /api/v1/ppt/generate",
    }


# ── 公开 discover endpoint（Zapier App 可见性）──────────────

@router.get(
    "/.well-known/ai-plugin.json",
    summary="AI Plugin Manifest（OpenAI GPT 集成用）",
    description="""
返回 AI Plugin manifest，用于在 OpenAI GPT 商店中发现 RabAiMind API。
""",
)
async def ai_plugin_manifest():
    """返回 AI Plugin manifest（符合 OpenAI 规范）"""
    return {
        "schema_version": "v1",
        "name_for_human": "RabAiMind PPT",
        "name_for_model": "rabaimind",
        "description_for_human": "AI-powered PPT generation platform",
        "description_for_model": "Generate professional PPT presentations using AI. "
        "Create slides from text outlines, apply themes, export to PPTX/PDF.",
        "auth": {"type": "api_key", "verification_tokens": {}},
        "api": {
            "type": "openapi",
            "url": "/docs",
        },
        "logo_url": "/static/logo.png",
        "contact_email": "support@rabaimind.com",
        "legal_info_url": "/legal",
    }


# ── Make.com compatible search ──────────────────────────────

@router.get(
    "/search/ppt_tasks",
    summary="[Make.com Search] 搜索 PPT 任务",
    description="""
Make.com Search 模块兼容端点。
按条件搜索 PPT 生成任务历史。
""",
)
async def search_ppt_tasks(
    x_api_key: str = Header(..., alias="X-API-Key"),
    status_filter: Optional[str] = Query(None, alias="status"),
    limit: int = Query(20, ge=1, le=100),
):
    await verify_api_key(x_api_key)
    # 草稿
    return {"results": [], "count": 0}
