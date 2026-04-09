"""
Scheduler API 路由

提供定时任务、批量调度、邮件投递的管理接口。

作者: Claude
日期: 2026-04-04
"""

import time
from typing import Any

from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel, Field

from ...services.scheduler_service import (
    ScheduleAction,
    ScheduleStatus,
    ScheduleType,
    get_scheduler_service,
)

router = APIRouter(prefix="/api/v1/schedules", tags=["schedules"])


# ── Request/Response Models ──────────────────────────────────────────────────

class CreateScheduleRequest(BaseModel):
    """创建定时任务请求"""
    name: str = Field(..., min_length=1, max_length=100, description="任务名称")
    action: str = Field(..., description="动作类型: generate | export | webhook | email")
    schedule_type: str = Field(..., description="调度类型: once | daily | weekly | monthly")
    # 时间配置
    run_at: str | None = Field(None, description="执行时间 (ISO8601)，用于 once 类型")
    cron_expression: str | None = Field(None, description="Cron 表达式（保留字段）")
    day_of_week: str | None = Field(None, description="周几执行: mon,tue,wed,thu,fri,sat,sun")
    day_of_month: int | None = Field(None, ge=1, le=31, description="每月几号执行 (1-31)")
    hour: int | None = Field(None, ge=0, le=23, description="执行小时 (0-23)")
    minute: int | None = Field(None, ge=0, le=59, description="执行分钟 (0-59)")
    # 动作参数
    generation: dict[str, Any] | None = Field(None, description="PPT生成参数（action=generate时）")
    export_config: dict[str, Any] | None = Field(None, description="导出配置（action=export时）")
    webhook_config: dict[str, Any] | None = Field(None, description="Webhook配置（action=webhook时）")
    email_config: dict[str, Any] | None = Field(None, description="邮件配置（action=email时）")
    user_id: str | None = Field(None, description="所属用户ID")


class UpdateScheduleRequest(BaseModel):
    """更新定时任务请求"""
    name: str | None = None
    status: str | None = None  # active | paused
    run_at: str | None = None
    day_of_week: str | None = None
    day_of_month: int | None = None
    hour: int | None = None
    minute: int | None = None
    generation: dict[str, Any] | None = None
    export_config: dict[str, Any] | None = None
    webhook_config: dict[str, Any] | None = None
    email_config: dict[str, Any] | None = None


class ScheduleResponse(BaseModel):
    """定时任务响应"""
    success: bool
    schedule: dict[str, Any] | None = None
    error: str | None = None


class ScheduleListResponse(BaseModel):
    """定时任务列表响应"""
    success: bool
    schedules: list[dict[str, Any]]
    total: int


# ── Email Models ──────────────────────────────────────────────────────────────

class CreateEmailRequest(BaseModel):
    """创建邮件投递配置"""
    schedule_id: str | None = Field(None, description="关联的定时任务ID")
    task_id: str | None = Field(None, description="关联的PPT任务ID")
    to_email: str = Field(..., description="收件人邮箱")
    to_name: str | None = Field(None, description="收件人姓名")
    subject: str = Field(..., description="邮件主题")
    body_html: str = Field(default="<p>您的PPT已生成，请查收附件。</p>", description="HTML正文")
    body_text: str | None = Field(None, description="纯文本正文")
    # SMTP配置（可选，从环境变量读取）
    smtp_host: str | None = None
    smtp_port: int | None = None
    smtp_user: str | None = None
    smtp_password: str | None = None
    from_email: str | None = None
    from_name: str | None = None


class TestEmailRequest(BaseModel):
    """发送测试邮件"""
    to_email: str
    to_name: str | None = None
    subject: str = Field(default="Test Email from RabAiMind")
    body_html: str = Field(default="<p>This is a test email from RabAiMind.</p>")
    body_text: str | None = None
    smtp_host: str | None = None
    smtp_port: int | None = None
    smtp_user: str | None = None
    smtp_password: str | None = None
    from_email: str | None = None
    from_name: str | None = None


# ── Helper ────────────────────────────────────────────────────────────────────

def _parse_action(action: str) -> ScheduleAction:
    try:
        return ScheduleAction(action)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"未知 action: {action}，可选: generate | export | webhook | email",
        )


def _parse_schedule_type(stype: str) -> ScheduleType:
    try:
        return ScheduleType(stype)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"未知 schedule_type: {stype}，可选: once | daily | weekly | monthly",
        )


def _parse_status(status_str: str) -> ScheduleStatus:
    try:
        return ScheduleStatus(status_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"未知 status: {status_str}，可选: active | paused | completed",
        )


def _format_schedule(sched) -> dict[str, Any]:
    return {
        "id": sched.id,
        "name": sched.name,
        "action": sched.action.value,
        "schedule_type": sched.schedule_type.value,
        "run_at": sched.run_at,
        "cron_expression": sched.cron_expression,
        "day_of_week": sched.day_of_week,
        "day_of_month": sched.day_of_month,
        "hour": sched.hour,
        "minute": sched.minute,
        "params": sched.params,
        "status": sched.status.value,
        "created_at": sched.created_at,
        "updated_at": sched.updated_at,
        "last_run_at": sched.last_run_at,
        "next_run_at": sched.next_run_at,
        "run_count": sched.run_count,
        "user_id": sched.user_id,
        "task_ids": sched.task_ids,
    }


# ── Schedule Routes ───────────────────────────────────────────────────────────

@router.post(
    "",
    response_model=ScheduleResponse,
    summary="创建定时任务",
    description="""
创建一个新的定时任务。

**调度类型 (schedule_type):**
- `once` — 一次性任务，使用 `run_at` 指定执行时间
- `daily` — 每天定时，使用 `hour`/`minute` 指定时间
- `weekly` — 每周定时，使用 `day_of_week` + `hour`/`minute`
- `monthly` — 每月定时，使用 `day_of_month` + `hour`/`minute`

**动作类型 (action):**
- `generate` — 定时生成PPT，使用 `generation` 参数
- `export` — 定时批量导出，使用 `export_config` 参数
- `webhook` — 触发 Webhook 事件，使用 `webhook_config` 参数
- `email` — 发送邮件，使用 `email_config` 参数

**generation 参数示例:**
```json
{
  "user_request": "生成Q1季度报告PPT",
  "slide_count": 10,
  "scene": "business",
  "style": "professional",
  "theme_color": "#165DFF",
  "generation_mode": "quality",
  "output_format": "pptx"
}
```

**export_config 参数示例:**
```json
{
  "task_ids": ["abc123", "def456"],
  "format": "pptx",
  "quality": "high"
}
```

**email_config 参数示例:**
```json
{
  "to_email": "user@example.com",
  "subject": "您的Q1报告已生成",
  "body_html": "<p>请查收附件中的PPT。</p>"
}
```
""",
)
async def create_schedule(request: Request, body: CreateScheduleRequest):
    action = _parse_action(body.action)
    schedule_type = _parse_schedule_type(body.schedule_type)

    if body.schedule_type == "once" and not body.run_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="schedule_type=once 时必须提供 run_at 参数",
        )

    params: dict[str, Any] = {}
    if body.generation:
        params["generation"] = body.generation
    if body.export_config:
        params["export_config"] = body.export_config
        params["task_ids"] = body.export_config.get("task_ids", [])
    if body.webhook_config:
        params["webhook_config"] = body.webhook_config
    if body.email_config:
        params["email"] = body.email_config

    svc = get_scheduler_service()
    sched = svc.create_schedule(
        name=body.name,
        action=action,
        schedule_type=schedule_type,
        params=params,
        run_at=body.run_at,
        cron_expression=body.cron_expression,
        day_of_week=body.day_of_week,
        day_of_month=body.day_of_month,
        hour=body.hour if body.hour is not None else 9,
        minute=body.minute if body.minute is not None else 0,
        user_id=body.user_id,
    )

    return ScheduleResponse(success=True, schedule=_format_schedule(sched))


@router.get(
    "",
    response_model=ScheduleListResponse,
    summary="列出所有定时任务",
    description="返回当前账号下所有定时任务（支持按 status 过滤）",
)
async def list_schedules(
    request: Request,
    status: str | None = None,
    user_id: str | None = None,
):
    svc = get_scheduler_service()
    status_enum = _parse_status(status) if status else None
    schedules = svc.list_schedules(user_id=user_id, status=status_enum)
    return ScheduleListResponse(
        success=True,
        schedules=[_format_schedule(s) for s in schedules],
        total=len(schedules),
    )


# ── Webhook Trigger Routes ────────────────────────────────────────────────────

class WebhookTriggerRequest(BaseModel):
    """Webhook 触发请求"""
    event: str = Field(..., description="事件类型: generation.started | generation.completed | ...")
    data: dict[str, Any] = Field(default_factory=dict, description="事件数据")
    task_id: str | None = Field(None, description="关联的任务ID")


@router.post(
    "/webhooks/trigger",
    summary="触发 Webhook 事件",
    description="""
从外部系统触发 Webhook 事件。

**可用事件:**
- `generation.started` — 生成开始
- `generation.progress` — 生成进度更新
- `generation.completed` — 生成完成
- `generation.failed` — 生成失败
- `task.cancelled` — 任务取消

外部系统（如 Zapier/Make）可通过此接口推送事件，触发 RabAiMind 的自动化流程。
""",
)
async def trigger_webhook(request: Request, body: WebhookTriggerRequest):
    from ...services.webhook_service import WebhookEvent, get_webhook_service

    try:
        event = WebhookEvent(body.event)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"未知事件类型: {body.event}",
        )

    ws = get_webhook_service()
    await ws.dispatch(event, body.task_id or "webhook_trigger", body.data)
    return {"success": True, "event": body.event, "dispatched": True}


# ── Batch Scheduled Export ────────────────────────────────────────────────────

class BatchScheduledExportRequest(BaseModel):
    """批量定时导出请求"""
    schedules: list[dict[str, Any]] = Field(
        ...,
        description="导出配置列表，每个包含 task_ids, format, quality, schedule_type, hour, minute",
        min_length=1,
        max_length=10,
    )


@router.post(
    "/batch-export",
    summary="批量定时导出",
    description="""
创建一个或多个定时导出任务。每个任务可独立配置执行时间。

**请求示例:**
```json
{
  "schedules": [
    {
      "name": "每日导出",
      "schedule_type": "daily",
      "hour": 8,
      "minute": 0,
      "export_config": {
        "task_ids": ["task1", "task2"],
        "format": "pptx",
        "quality": "high"
      }
    },
    {
      "name": "每周导出",
      "schedule_type": "weekly",
      "day_of_week": "mon",
      "hour": 9,
      "minute": 0,
      "export_config": {
        "task_ids": ["task3"],
        "format": "pdf"
      }
    }
  ]
}
```
""",
)
async def create_batch_exports(request: Request, body: BatchScheduledExportRequest):
    svc = get_scheduler_service()
    created = []
    for cfg in body.schedules:
        sched = svc.create_schedule(
            name=cfg.get("name", "批量导出任务"),
            action=ScheduleAction.EXPORT,
            schedule_type=_parse_schedule_type(cfg.get("schedule_type", "daily")),
            params={
                "export_config": cfg.get("export_config", {}),
                "task_ids": cfg.get("export_config", {}).get("task_ids", []),
            },
            hour=cfg.get("hour", 9),
            minute=cfg.get("minute", 0),
            day_of_week=cfg.get("day_of_week"),
            day_of_month=cfg.get("day_of_month"),
        )
        created.append(_format_schedule(sched))

    return {"success": True, "created": created, "count": len(created)}


# ── Email Routes ─────────────────────────────────────────────────────────────

@router.post(
    "/emails",
    summary="创建邮件投递配置",
    description="创建邮件发送配置（可与定时任务关联）",
)
async def create_scheduled_email(request: Request, body: CreateEmailRequest):
    svc = get_scheduler_service()
    email = svc.create_scheduled_email(
        schedule_id=body.schedule_id,
        task_id=body.task_id,
        to_email=body.to_email,
        to_name=body.to_name,
        subject=body.subject,
        body_html=body.body_html,
        body_text=body.body_text,
        smtp_host=body.smtp_host,
        smtp_port=body.smtp_port,
        smtp_user=body.smtp_user,
        smtp_password=body.smtp_password,
        from_email=body.from_email,
        from_name=body.from_name,
    )
    return {
        "success": True,
        "email": {
            "id": email.id,
            "schedule_id": email.schedule_id,
            "task_id": email.task_id,
            "to_email": email.to_email,
            "to_name": email.to_name,
            "subject": email.subject,
            "status": email.status.value,
            "created_at": email.created_at,
        },
    }


@router.get(
    "/emails",
    summary="列出邮件投递配置",
)
async def list_emails(request: Request, schedule_id: str | None = None):
    svc = get_scheduler_service()
    emails = svc.list_scheduled_emails(schedule_id=schedule_id)
    return {
        "success": True,
        "emails": [
            {
                "id": e.id,
                "schedule_id": e.schedule_id,
                "task_id": e.task_id,
                "to_email": e.to_email,
                "to_name": e.to_name,
                "subject": e.subject,
                "status": e.status.value,
                "sent_at": e.sent_at,
                "error": e.error,
                "created_at": e.created_at,
            }
            for e in emails
        ],
        "total": len(emails),
    }


@router.delete(
    "/emails/{email_id}",
    summary="删除邮件投递配置",
)
async def delete_email(email_id: str):
    svc = get_scheduler_service()
    if not svc.delete_scheduled_email(email_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Email not found")
    return {"success": True, "email_id": email_id}


@router.post(
    "/emails/test",
    summary="发送测试邮件",
    description="使用提供的SMTP配置发送测试邮件，验证邮件投递是否正常",
)
async def send_test_email(request: Request, body: TestEmailRequest):
    svc = get_scheduler_service()
    result = svc.send_test_email(body.model_dump())
    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result.get("error", "Failed to send test email"),
        )
    return {"success": True, "result": result}


# ── Recurring Presentation Routes ────────────────────────────────────────────

class RecurringPresentationRequest(BaseModel):
    """创建循环演示文稿请求"""
    name: str = Field(..., description="任务名称")
    generation: dict[str, Any] = Field(..., description="PPT生成参数")
    recurrence: str = Field(..., description="循环类型: daily | weekly | monthly")
    day_of_week: str | None = Field(None, description="周几: mon,tue,wed,thu,fri,sat,sun")
    day_of_month: int | None = Field(None, ge=1, le=31)
    hour: int = Field(default=9, ge=0, le=23)
    minute: int = Field(default=0, ge=0, le=59)
    user_id: str | None = None
    # 自动邮件配置（可选）
    auto_email: dict[str, Any] | None = Field(None, description="生成完成后自动发送邮件")


@router.post(
    "/recurring",
    summary="创建循环演示文稿",
    description="""
创建一个定期自动更新的演示文稿任务。

**使用场景：**
- 每日站会汇报：每天早上9点自动生成「今日工作安排」PPT
- 周报：每周一早上8点自动生成「上周周报」
- 月报：每月1号早上9点自动生成「月度总结」

**auto_email 配置示例:**
```json
{
  "to_email": "team@example.com",
  "subject": "每日站会汇报",
  "body_html": "<p>今日站会PPT已生成，请查收附件。</p>"
}
```
""",
)
async def create_recurring_presentation(request: Request, body: RecurringPresentationRequest):
    svc = get_scheduler_service()

    try:
        recurrence_type = ScheduleType(body.recurrence)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"未知 recurrence: {body.recurrence}，可选: daily | weekly | monthly",
        )

    # 先创建定时生成任务
    params: dict[str, Any] = {"generation": body.generation}

    # 如果有自动邮件，创建邮件配置
    email_id = None
    if body.auto_email:
        email = svc.create_scheduled_email(
            to_email=body.auto_email.get("to_email", ""),
            to_name=body.auto_email.get("to_name"),
            subject=body.auto_email.get("subject", "您的PPT已生成"),
            body_html=body.auto_email.get("body_html", "<p>请查收附件。</p>"),
            body_text=body.auto_email.get("body_text"),
        )
        email_id = email.id
        params["email_id"] = email_id
        params["auto_email"] = body.auto_email

    sched = svc.create_schedule(
        name=body.name,
        action=ScheduleAction.GENERATE,
        schedule_type=recurrence_type,
        params=params,
        hour=body.hour,
        minute=body.minute,
        day_of_week=body.day_of_week,
        day_of_month=body.day_of_month,
        user_id=body.user_id,
    )

    # 更新邮件配置关联 schedule_id
    if email_id:
        email_obj = svc.get_scheduled_email(email_id)
        if email_obj:
            email_obj.schedule_id = sched.id
            svc._persist_emails()

    return {
        "success": True,
        "schedule": _format_schedule(sched),
        "email_id": email_id,
    }


@router.get(
    "/recurring",
    summary="列出循环演示文稿",
    description="返回所有循环演示文稿任务（action=generate 且非 once）",
)
async def list_recurring_presentations(request: Request, user_id: str | None = None):
    svc = get_scheduler_service()
    schedules = svc.list_schedules(user_id=user_id)
    recurring = [
        _format_schedule(s)
        for s in schedules
        if s.action == ScheduleAction.GENERATE and s.schedule_type != ScheduleType.ONCE
    ]
    return {"success": True, "schedules": recurring, "total": len(recurring)}


# ── Status ────────────────────────────────────────────────────────────────────

@router.get(
    "/status",
    summary="获取调度器状态",
    description="返回调度器的运行状态、任务数量和即将执行的任务",
)
async def get_scheduler_status(request: Request):
    svc = get_scheduler_service()
    schedules = svc.list_schedules()

    active = [s for s in schedules if s.status == ScheduleStatus.ACTIVE]
    paused = [s for s in schedules if s.status == ScheduleStatus.PAUSED]

    # 找出即将执行的任务（未来24小时内）
    now = time.time()
    upcoming = [
        _format_schedule(s)
        for s in active
        if s.next_run_at and s.next_run_at <= now + 86400
    ]
    upcoming.sort(key=lambda s: s.get("next_run_at", 0))

    return {
        "success": True,
        "running": svc._started,
        "total_schedules": len(schedules),
        "active_count": len(active),
        "paused_count": len(paused),
        "upcoming": upcoming[:10],
    }


# ── Individual Schedule Routes (/{schedule_id}) ────────────────────────────────
# NOTE: These are defined LAST to avoid catching specific routes like /recurring, /emails, /status


@router.get(
    "/{schedule_id}",
    response_model=ScheduleResponse,
    summary="获取定时任务详情",
)
async def get_schedule(schedule_id: str):
    svc = get_scheduler_service()
    sched = svc.get_schedule(schedule_id)
    if not sched:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found")
    return ScheduleResponse(success=True, schedule=_format_schedule(sched))


@router.patch(
    "/{schedule_id}",
    response_model=ScheduleResponse,
    summary="更新定时任务",
    description="更新定时任务的时间、参数或状态",
)
async def update_schedule(schedule_id: str, body: UpdateScheduleRequest):
    svc = get_scheduler_service()
    sched = svc.get_schedule(schedule_id)
    if not sched:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found")

    updates: dict[str, Any] = {}
    if body.name is not None:
        updates["name"] = body.name
    if body.status is not None:
        updates["status"] = _parse_status(body.status)
    if body.run_at is not None:
        updates["run_at"] = body.run_at
    if body.day_of_week is not None:
        updates["day_of_week"] = body.day_of_week
    if body.day_of_month is not None:
        updates["day_of_month"] = body.day_of_month
    if body.hour is not None:
        updates["hour"] = body.hour
    if body.minute is not None:
        updates["minute"] = body.minute
    if body.generation is not None:
        updates["params"] = {**sched.params, "generation": body.generation}
    if body.export_config is not None:
        updates["params"] = {**sched.params, "export_config": body.export_config}
        updates["params"]["task_ids"] = body.export_config.get("task_ids", [])
    if body.webhook_config is not None:
        updates["params"] = {**sched.params, "webhook_config": body.webhook_config}
    if body.email_config is not None:
        updates["params"] = {**sched.params, "email": body.email_config}

    updated = svc.update_schedule(schedule_id, **updates)
    return ScheduleResponse(success=True, schedule=_format_schedule(updated))


@router.delete(
    "/{schedule_id}",
    summary="删除定时任务",
)
async def delete_schedule(schedule_id: str):
    svc = get_scheduler_service()
    if not svc.delete_schedule(schedule_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found")
    return {"success": True, "schedule_id": schedule_id}


@router.post(
    "/{schedule_id}/pause",
    summary="暂停定时任务",
)
async def pause_schedule(schedule_id: str):
    svc = get_scheduler_service()
    if not svc.pause_schedule(schedule_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found")
    return {"success": True, "schedule_id": schedule_id, "status": "paused"}


@router.post(
    "/{schedule_id}/resume",
    summary="恢复定时任务",
)
async def resume_schedule(schedule_id: str):
    svc = get_scheduler_service()
    if not svc.resume_schedule(schedule_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found")
    sched = svc.get_schedule(schedule_id)
    return {"success": True, "schedule_id": schedule_id, "status": sched.status.value if sched else "active"}


@router.post(
    "/{schedule_id}/trigger",
    summary="立即触发定时任务",
    description="立即执行定时任务，不等待预定时间",
)
async def trigger_schedule(schedule_id: str):
    svc = get_scheduler_service()
    result = svc.trigger_now(schedule_id)
    if not result.get("success") and "not found" in result.get("error", "").lower():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found")
    return {"success": True, "result": result}
