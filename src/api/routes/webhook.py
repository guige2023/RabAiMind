# -*- coding: utf-8 -*-
"""
Webhook API 路由

提供 Webhook 的注册、管理、测试功能。
集成 Zapier/Make (即插即用，无需额外配置)。

作者: Claude
日期: 2026-04-04
"""

import asyncio
import hashlib
import hmac
import json
import secrets
import time
from typing import Dict, Any, List, Optional

from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel, Field

from ...services.webhook_service import get_webhook_service, WebhookEvent
from ...config import settings

router = APIRouter(prefix="/api/v1/webhooks", tags=["webhooks"])


# ── Request/Response Models ─────────────────────────────────

class WebhookRegisterRequest(BaseModel):
    """注册 Webhook 请求"""
    url: str = Field(..., description="Webhook 回调地址 (HTTPS)", examples=["https://your-server.com/webhook"])
    events: List[str] = Field(
        ...,
        description="订阅的事件列表",
        examples=[["generation.completed", "generation.failed"]],
    )
    secret: Optional[str] = Field(
        None,
        description="签名密钥 (可选，不填则自动生成)，用于 X-RabAiMind-Signature HMAC-SHA256 验签",
    )
    active: bool = Field(True, description="是否启用")


class WebhookRegisterResponse(BaseModel):
    """注册成功响应"""
    webhook_id: str
    secret: str  # 返回密钥（仅创建时返回，之后不再暴露）
    url: str
    events: List[str]
    created_at: float


class WebhookUpdateRequest(BaseModel):
    """更新 Webhook 请求"""
    url: Optional[str] = None
    events: Optional[List[str]] = None
    active: Optional[bool] = None


class WebhookDeliveryTestRequest(BaseModel):
    """测试投递请求"""
    event: str = Field(..., description="测试事件类型")
    data: Optional[Dict[str, Any]] = Field(default_factory=dict, description="测试数据")


class WebhookDeliveryTestResponse(BaseModel):
    """测试投递响应"""
    delivery_id: str
    status: int
    body: Optional[str]
    signature: str  # 实际签名的 HMAC


# ── Helpers ─────────────────────────────────────────────────

def _parse_events(events: List[str]) -> List[WebhookEvent]:
    valid = set(WebhookEvent)
    parsed = []
    for e in events:
        try:
            parsed.append(WebhookEvent(e))
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"未知事件类型: {e}，可选: {[ev.value for ev in valid]}",
            )
    return parsed


def _generate_id() -> str:
    return hashlib.sha256(secrets.token_bytes(32)).hexdigest()[:16]


# ── Routes ───────────────────────────────────────────────────

@router.post(
    "",
    response_model=WebhookRegisterResponse,
    summary="注册 Webhook",
    description="""
注册一个新的 Webhook 端点。

**集成 Zapier / Make:**
1. 在 Zapier/Make 中创建 "Webhooks by Make" → "Custom Webhook" 触发器
2. 复制 Webhook URL，填入 `url` 参数
3. 订阅事件 `generation.completed`（PPT 生成完成）
4. Zapier 会自动获取测试事件，无需手动调用 `/test`

**签名验证:**
配置 `secret` 后，每个 POST 请求会携带 `X-RabAiMind-Signature` 头（HMAC-SHA256）。
验证方式（Python 示例）：
```python
import hmac, hashlib
expected = hmac.new(secret.encode(), body_bytes, hashlib.sha256).hexdigest()
assert hmac.compare_digest(expected, received_signature)
```

**可用事件:**
- `generation.started` — 生成任务开始
- `generation.progress` — 生成进度更新 (每页完成时)
- `generation.completed` — 生成成功完成
- `generation.failed` — 生成失败
- `task.cancelled` — 任务被取消
""",
)
async def register_webhook(body: WebhookRegisterRequest):
    webhook_id = _generate_id()
    secret = body.secret or secrets.token_urlsafe(32)
    events = _parse_events(body.events)

    ws = get_webhook_service()
    ws.register(webhook_id=webhook_id, url=body.url, events=events, secret=secret)

    return WebhookRegisterResponse(
        webhook_id=webhook_id,
        secret=secret,
        url=body.url,
        events=[e.value for e in events],
        created_at=time.time(),
    )


@router.get(
    "",
    summary="列出所有 Webhook",
    description="返回当前账号下所有已注册的 Webhook（不含 secret）",
)
async def list_webhooks():
    ws = get_webhook_service()
    return {"webhooks": ws.list_webhooks()}


@router.patch(
    "/{webhook_id}",
    response_model=WebhookRegisterResponse,
    summary="更新 Webhook",
    description="更新 Webhook 的 URL、事件订阅或启用状态",
)
async def update_webhook(webhook_id: str, body: WebhookUpdateRequest):
    ws = get_webhook_service()
    webhooks = ws.list_webhooks()

    if not any(w["id"] == webhook_id for w in webhooks):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Webhook 不存在")

    # 重新注册（更新）
    existing = None
    for w in webhooks:
        if w["id"] == webhook_id:
            existing = w
            break

    new_url = body.url or existing["url"]
    new_events = (
        _parse_events(body.events) if body.events is not None
        else [WebhookEvent(e) for e in existing["events"]]
    )
    new_active = body.active if body.active is not None else existing["active"]

    ws.unregister(webhook_id)
    ws.register(webhook_id=webhook_id, url=new_url, events=new_events, active=new_active)

    return WebhookRegisterResponse(
        webhook_id=webhook_id,
        secret="***",  # 不暴露
        url=new_url,
        events=[e.value for e in new_events],
        created_at=existing["created_at"],
    )


@router.delete(
    "/{webhook_id}",
    summary="删除 Webhook",
    description="注销指定的 Webhook",
)
async def delete_webhook(webhook_id: str):
    ws = get_webhook_service()
    if not ws.unregister(webhook_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Webhook 不存在")
    return {"success": True}


@router.post(
    "/{webhook_id}/test",
    response_model=WebhookDeliveryTestResponse,
    summary="发送测试事件",
    description="""
向指定 Webhook 发送一个测试事件，用于验证回调地址是否可达。

**Zapier/Make 集成提示:** 首次配置 Webhook 时，Zapier/Make 会等待一个测试事件。
点击本接口即可触发，Zapier/Make 收到后即可激活 Zap。
""",
)
async def test_webhook(webhook_id: str, body: WebhookDeliveryTestRequest):
    ws = get_webhook_service()
    webhooks = ws.list_webhooks()

    if not any(w["id"] == webhook_id for w in webhooks):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Webhook 不存在")

    payload = {
        "event": body.event,
        "timestamp": int(time.time()),
        "task_id": "test_task_id",
        "data": body.data or {},
    }
    payload_json = json.dumps(payload, ensure_ascii=False)

    # 查找 webhook 获取 secret
    reg = None
    import asyncio
    async with asyncio.Lock():
        for wid, r in ws._registrations.items():
            if wid == webhook_id:
                reg = r
                break

    if not reg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Webhook 不存在")

    headers = {
        "Content-Type": "application/json",
        "X-RabAiMind-Event": body.event,
        "X-RabAiMind-Delivery": f"test_{int(time.time() * 1000)}",
    }
    signature = ""
    if reg.secret:
        signature = WebhookService.sign_payload(payload_json, reg.secret)
        headers["X-RabAiMind-Signature"] = signature

    delivery_id = headers["X-RabAiMind-Delivery"]

    try:
        import aiohttp
        async with aiohttp.ClientSession() as session:
            async with session.post(
                reg.url,
                data=payload_json,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=10),
            ) as resp:
                body_text = await resp.text()
                return WebhookDeliveryTestResponse(
                    delivery_id=delivery_id,
                    status=resp.status,
                    body=body_text[:500] if body_text else None,
                    signature=signature,
                )
    except Exception as e:
        return WebhookDeliveryTestResponse(
            delivery_id=delivery_id,
            status=0,
            body=str(e),
            signature=signature,
        )


# Zapier/Make-compatible: 接收 POST /api/v1/webhooks/zapier/{api_key}/receive
@router.post(
    "/zapier/{api_key}/receive",
    summary="[Zapier/Make 集成] 接收事件",
    description="""
**Zapier/Make 专用端点（免鉴权）**

Zapier/Make 通过此端点接收事件推送。
使用方式：
1. 在 RabAiMind 后台创建 Webhook，获取 `api_key`（即 webhook_id）
2. 在 Zapier/Make 中配置自定义 Webhook URL：
   `https://your-api-domain.com/api/v1/webhooks/zapier/{api_key}/receive`
3. 订阅事件，完成自动化流程

此端点兼容 Zapier Webhooks 格式（JSON body + 标准 header）。
""",
)
async def zapier_receive(api_key: str, request: Request):
    ws = get_webhook_service()
    body = await request.json()

    event = body.get("event", "custom.event")
    task_id = body.get("task_id", api_key)
    data = body.get("data", {})

    # 分发给所有匹配的注册 Webhook
    try:
        event_enum = WebhookEvent(event)
    except ValueError:
        event_enum = WebhookEvent.GENERATION_COMPLETED

    await ws.dispatch(event_enum, task_id, data)

    return {"status": "received", "event": event}


# ── OpenAPI Schema 增强 (通过 response_model 注解已自动注册) ───────────────
# FastAPI 自动根据 response_model 生成 OpenAPI schema
# 额外通过 router_openapi_overrides 提供更详细的字段描述

from fastapi.openapi.utils import get_openapi


def webhook_openapi():
    """返回 Webhook 相关 OpenAPI schema 片段（供外部文档引用）"""
    return {
        "/api/v1/webhooks": {
            "post": {
                "summary": "注册 Webhook",
                "description": "注册一个新的 Webhook 端点，支持 Zapier/Make",
            }
        }
    }


from ...services.webhook_service import WebhookService  # noqa: E402,F401
