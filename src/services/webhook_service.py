# -*- coding: utf-8 -*-
"""
Webhook Service — 事件推送服务

支持向第三方 URL 推送 PPT 生成进度和完成事件。
集成到 task_manager，在关键状态变更时触发。

作者: Claude
日期: 2026-04-04
"""

import aiohttp
import asyncio
import hashlib
import hmac
import json
import logging
import time
from typing import Dict, Any, Optional, List
from enum import Enum
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class WebhookEvent(str, Enum):
    """Webhook 事件类型"""
    GENERATION_STARTED = "generation.started"
    GENERATION_PROGRESS = "generation.progress"
    GENERATION_COMPLETED = "generation.completed"
    GENERATION_FAILED = "generation.failed"
    TASK_CANCELLED = "task.cancelled"


class WebhookRegistration(BaseModel):
    """Webhook 注册信息"""
    url: str
    events: List[WebhookEvent]
    secret: Optional[str] = None
    active: bool = True
    created_at: float = 0.0


class WebhookDelivery(BaseModel):
    """Webhook 投递记录"""
    id: str
    event: WebhookEvent
    payload: Dict[str, Any]
    attempt: int = 1
    max_attempts: int = 3
    next_retry: float = 0.0
    response_status: Optional[int] = None
    response_body: Optional[str] = None
    delivered_at: Optional[float] = None


class WebhookService:
    """Webhook 管理与投递服务"""

    def __init__(self):
        self._registrations: Dict[str, WebhookRegistration] = {}
        self._delivery_queue: List[WebhookDelivery] = []
        self._lock: asyncio.Lock = asyncio.Lock()
        self._dispatched_events: Dict[str, int] = {}  # event_key → count

    # ── 管理 API ───────────────────────────────────────────────

    def register(
        self,
        webhook_id: str,
        url: str,
        events: List[WebhookEvent],
        secret: Optional[str] = None,
        active: bool = True,
    ) -> str:
        """注册一个 Webhook"""
        reg = WebhookRegistration(
            url=url,
            events=events,
            secret=secret,
            active=active,
            created_at=time.time(),
        )
        self._registrations[webhook_id] = reg
        logger.info(
            f"Webhook 注册: id={webhook_id} url={url} "
            f"events={[e.value for e in events]}"
        )
        return webhook_id

    def unregister(self, webhook_id: str) -> bool:
        """注销 Webhook"""
        if webhook_id in self._registrations:
            del self._registrations[webhook_id]
            logger.info(f"Webhook 注销: id={webhook_id}")
            return True
        return False

    def list_webhooks(self) -> List[Dict[str, Any]]:
        """列出所有注册的 Webhook"""
        return [
            {
                "id": wid,
                "url": reg.url,
                "events": [e.value for e in reg.events],
                "active": reg.active,
                "created_at": reg.created_at,
            }
            for wid, reg in self._registrations.items()
        ]

    def toggle(self, webhook_id: str, active: bool) -> bool:
        """启用/禁用 Webhook"""
        if webhook_id in self._registrations:
            self._registrations[webhook_id].active = active
            return True
        return False

    # ── 签名 ──────────────────────────────────────────────────

    @staticmethod
    def sign_payload(payload_json: str, secret: str) -> str:
        """使用 HMAC-SHA256 对载荷签名"""
        return hmac.new(
            secret.encode("utf-8"),
            payload_json.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

    # ── 投递 ──────────────────────────────────────────────────

    async def dispatch(
        self, event: WebhookEvent, task_id: str, data: Dict[str, Any]
    ):
        """分发事件到所有匹配的已注册 Webhook"""
        async with self._lock:
            matching = [
                (wid, reg)
                for wid, reg in self._registrations.items()
                if reg.active and event in reg.events
            ]

        if not matching:
            return

        payload = {
            "event": event.value,
            "timestamp": int(time.time()),
            "task_id": task_id,
            "data": data,
        }
        payload_json = json.dumps(payload, ensure_ascii=False)

        delivery_tasks = []
        for webhook_id, reg in matching:
            delivery = WebhookDelivery(
                id=f"{webhook_id}_{int(time.time() * 1000)}",
                event=event,
                payload=payload,
                max_attempts=3,
                next_retry=time.time(),
            )
            self._delivery_queue.append(delivery)
            delivery_tasks.append(
                self._deliver(delivery, reg, payload_json)
            )

        if delivery_tasks:
            # 启动后台队列处理器
            asyncio.create_task(self._process_queue())
            # 立即触发第一次投递
            await asyncio.gather(*delivery_tasks, return_exceptions=True)

    async def _process_queue(self):
        """后台轮询重试队列"""
        while True:
            await asyncio.sleep(5)
            now = time.time()
            async with self._lock:
                due = [d for d in self._delivery_queue if d.next_retry <= now]
                for d in due:
                    self._delivery_queue.remove(d)

            if not due:
                continue

            for delivery in due:
                if delivery.attempt > delivery.max_attempts:
                    logger.warning(
                        f"Webhook 投递超过最大重试次数: {delivery.id}"
                    )
                    continue

                webhook_id = delivery.id.rsplit("_", 1)[0]
                async with self._lock:
                    reg = self._registrations.get(webhook_id)
                if not reg or not reg.active:
                    continue

                asyncio.create_task(
                    self._deliver(
                        delivery,
                        reg,
                        json.dumps(delivery.payload, ensure_ascii=False),
                    )
                )

    async def _deliver(
        self,
        delivery: WebhookDelivery,
        reg: WebhookRegistration,
        payload_json: str,
    ):
        """执行一次 HTTP POST 投递"""
        headers = {"Content-Type": "application/json"}
        if reg.secret:
            headers["X-RabAiMind-Signature"] = self.sign_payload(
                payload_json, reg.secret
            )
        headers["X-RabAiMind-Event"] = delivery.event.value
        headers["X-RabAiMind-Delivery"] = delivery.id

        # Log attempt start via developer_service (import lazily to avoid circular)
        import_time = time.time()
        logged_delivery_id = delivery.id
        logged_webhook_id = list(self._registrations.keys())[
            list(self._registrations.values()).index(reg)
        ] if reg in self._registrations.values() else "unknown"

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    reg.url,
                    data=payload_json,
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=15),
                ) as resp:
                    delivery.response_status = resp.status
                    duration_ms = int((time.time() - import_time) * 1000)
                    try:
                        delivery.response_body = await resp.text()
                    except Exception:
                        delivery.response_body = None

                    # ── Log delivery to developer service ──────────────────
                    try:
                        from .developer_service import get_developer_service
                        ds = get_developer_service()
                        ds.log_webhook_delivery(
                            webhook_id=logged_webhook_id,
                            event=delivery.event.value,
                            payload=delivery.payload,
                            url=reg.url,
                            attempt=delivery.attempt,
                            max_attempts=delivery.max_attempts,
                            response_status=resp.status,
                            response_body=delivery.response_body,
                            duration_ms=duration_ms,
                        )
                    except Exception:
                        pass  # non-critical
                    # ───────────────────────────────────────────────────

                    if resp.status < 300:
                        delivery.delivered_at = time.time()
                        logger.info(
                            f"Webhook 投递成功: {delivery.id} status={resp.status}"
                        )
                        return

            # 失败，准备重试
            delivery.attempt += 1
            backoff = min(60, 5 * (2 ** (delivery.attempt - 2)))
            delivery.next_retry = time.time() + backoff
            async with self._lock:
                self._delivery_queue.append(delivery)
            logger.warning(
                f"Webhook 投递失败(尝试{delivery.attempt}): {delivery.id} "
                f"status={delivery.response_status} 将在 {backoff}s 后重试"
            )

        except asyncio.TimeoutError:
            delivery.response_status = 408
            duration_ms = int((time.time() - import_time) * 1000)
            delivery.attempt += 1
            delivery.next_retry = time.time() + 30
            async with self._lock:
                self._delivery_queue.append(delivery)
            logger.warning(f"Webhook 投递超时: {delivery.id}")
            # Log failure
            try:
                from .developer_service import get_developer_service
                ds = get_developer_service()
                ds.log_webhook_delivery(
                    webhook_id=logged_webhook_id,
                    event=delivery.event.value,
                    payload=delivery.payload,
                    url=reg.url,
                    attempt=delivery.attempt - 1,
                    max_attempts=delivery.max_attempts,
                    response_status=408,
                    response_body="Request timeout",
                    error="Timeout",
                    duration_ms=duration_ms,
                )
            except Exception:
                pass

        except Exception as e:
            delivery.response_status = 0
            duration_ms = int((time.time() - import_time) * 1000)
            delivery.attempt += 1
            delivery.next_retry = time.time() + 30
            async with self._lock:
                self._delivery_queue.append(delivery)
            logger.error(f"Webhook 投递异常: {delivery.id} error={e}")
            # Log failure
            try:
                from .developer_service import get_developer_service
                ds = get_developer_service()
                ds.log_webhook_delivery(
                    webhook_id=logged_webhook_id,
                    event=delivery.event.value,
                    payload=delivery.payload,
                    url=reg.url,
                    attempt=delivery.attempt - 1,
                    max_attempts=delivery.max_attempts,
                    response_status=0,
                    error=str(e),
                    duration_ms=duration_ms,
                )
            except Exception:
                pass


# 全局单例
_webhook_service: Optional[WebhookService] = None


def get_webhook_service() -> WebhookService:
    global _webhook_service
    if _webhook_service is None:
        _webhook_service = WebhookService()
    return _webhook_service
