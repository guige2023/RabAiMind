"""
Notification API Routes — 智能通知 API

Endpoints:
- Reminders CRUD
- Smart Alert rules CRUD
- Weekly digest subscription
- @Mention send/list/read
- Deadline countdowns
- Unified active alerts feed

作者: Claude
日期: 2026-04-04
"""

from datetime import datetime
from typing import Any

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from ...services.notification_service import (
    _load_comment_email_prefs,
    _save_comment_email_prefs,
    get_notification_service,
)

router = APIRouter(prefix="/api/v1/notifications", tags=["notifications"])


# ── Helpers ────────────────────────────────────────────────────────────────────

def _uid(req: Request) -> str:
    h = req.headers.get("Authorization", "")
    if h.startswith("Bearer "):
        return h[7:20]
    ip = req.client.host if req.client else "anon"
    return f"u_{abs(hash(ip)) % 99999}"


# ── Shared Response Models ─────────────────────────────────────────────────────

class NotificationResponse(BaseModel):
    success: bool
    data: Any | None = None
    error: str | None = None


# ── Reminder Models ─────────────────────────────────────────────────────────────

class CreateReminderRequest(BaseModel):
    task_id: str = Field(..., description="关联的PPT任务ID")
    title: str = Field(..., min_length=1, max_length=200, description="演示文稿标题")
    review_date: str = Field(..., description="审核日期 ISO8601，如 2026-04-10T10:00:00")
    remind_before_hours: int = Field(default=24, ge=1, le=168, description="提前多少小时提醒")
    notes: str = Field(default="", max_length=500, description="备注")


class UpdateReminderRequest(BaseModel):
    title: str | None = None
    review_date: str | None = None
    remind_before_hours: int | None = Field(None, ge=1, le=168)
    notes: str | None = None
    status: str | None = None


# ── Smart Alert Models ─────────────────────────────────────────────────────────

class CreateSmartAlertRequest(BaseModel):
    task_id: str = Field(..., description="关联的PPT任务ID")
    rule_type: str = Field(..., description="规则类型: content_age | data_staleness | review_cycle")
    title: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., max_length=500)
    trigger_after_days: int = Field(default=7, ge=1, le=365, description="多少天后触发提醒")


# ── Mention Models ──────────────────────────────────────────────────────────────

class SendMentionRequest(BaseModel):
    task_id: str = Field(..., description="关联的PPT任务ID")
    from_user: str = Field(..., description="发送者")
    to_user: str = Field(..., description="接收者 (@目标)")
    message: str = Field(..., min_length=1, max_length=500, description="@提及内容")
    slide_ref: str | None = Field(None, description="关联的幻灯片引用")


# ── Deadline Models ─────────────────────────────────────────────────────────────

class CreateDeadlineRequest(BaseModel):
    task_id: str = Field(..., description="关联的PPT任务ID")
    title: str = Field(..., min_length=1, max_length=200)
    deadline: str = Field(..., description="截止日期 ISO8601")
    notification_hours: list[int] = Field(
        default=[24, 1],
        description="提前多少小时发送提醒列表，如 [24, 2, 1]"
    )


class UpdateDeadlineRequest(BaseModel):
    title: str | None = None
    deadline: str | None = None
    notification_hours: list[int] | None = None


# ── Digest Models ───────────────────────────────────────────────────────────────

class SubscribeDigestRequest(BaseModel):
    email: str = Field(..., description="订阅邮箱")
    name: str = Field(default="", description="订阅者姓名")
    day_of_week: int = Field(default=1, ge=0, le=6, description="0=周一, 1=周二 ... 6=周日")
    hour: int = Field(default=9, ge=0, le=23)
    minute: int = Field(default=0, ge=0, le=59)


class UpdateDigestRequest(BaseModel):
    email: str | None = None
    name: str | None = None
    enabled: bool | None = None
    day_of_week: int | None = Field(None, ge=0, le=6)
    hour: int | None = Field(None, ge=0, le=23)
    minute: int | None = Field(None, ge=0, le=59)


# ════════════════════════════════════════════════════════════════════════════════
# REMINDERS
# ════════════════════════════════════════════════════════════════════════════════

@router.post("/reminders", summary="创建审核日期提醒")
async def create_reminder(req: Request, body: CreateReminderRequest):
    svc = get_notification_service()
    reminder = svc.create_reminder(
        task_id=body.task_id,
        title=body.title,
        review_date=body.review_date,
        remind_before_hours=body.remind_before_hours,
        user_id=_uid(req),
        notes=body.notes,
    )
    return NotificationResponse(success=True, data=reminder.to_dict())


@router.get("/reminders", summary="列出提醒列表")
async def list_reminders(req: Request, status: str | None = None):
    svc = get_notification_service()
    user_id = _uid(req)
    reminders = svc.list_reminders(user_id=user_id, status=status)
    return NotificationResponse(success=True, data=[r.to_dict() for r in reminders])


@router.get("/reminders/{reminder_id}", summary="获取提醒详情")
async def get_reminder(reminder_id: str):
    svc = get_notification_service()
    r = svc.get_reminder(reminder_id)
    if not r:
        raise HTTPException(status_code=404, detail="Reminder not found")
    return NotificationResponse(success=True, data=r.to_dict())


@router.patch("/reminders/{reminder_id}", summary="更新提醒")
async def update_reminder(reminder_id: str, body: UpdateReminderRequest):
    svc = get_notification_service()
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    r = svc.update_reminder(reminder_id, **updates)
    if not r:
        raise HTTPException(status_code=404, detail="Reminder not found")
    return NotificationResponse(success=True, data=r.to_dict())


@router.delete("/reminders/{reminder_id}", summary="删除提醒")
async def delete_reminder(reminder_id: str):
    svc = get_notification_service()
    if not svc.delete_reminder(reminder_id):
        raise HTTPException(status_code=404, detail="Reminder not found")
    return NotificationResponse(success=True, data={"reminder_id": reminder_id})


@router.post("/reminders/due", summary="检查到期提醒并标记为已触发")
async def check_due_reminders(req: Request):
    svc = get_notification_service()
    user_id = _uid(req)
    due = svc.check_due_reminders(user_id)
    triggered = []
    for r in due:
        svc.trigger_reminder(r.id)
        triggered.append(r.to_dict())
    return NotificationResponse(success=True, data={"due_count": len(due), "triggered": triggered})


# ════════════════════════════════════════════════════════════════════════════════
# SMART ALERTS
# ════════════════════════════════════════════════════════════════════════════════

@router.post("/smart-alerts", summary="创建智能提醒规则")
async def create_smart_alert(req: Request, body: CreateSmartAlertRequest):
    svc = get_notification_service()
    alert = svc.create_smart_alert(
        task_id=body.task_id,
        rule_type=body.rule_type,
        title=body.title,
        message=body.message,
        trigger_after_days=body.trigger_after_days,
        user_id=_uid(req),
    )
    return NotificationResponse(success=True, data=alert.to_dict())


@router.get("/smart-alerts", summary="列出智能提醒")
async def list_smart_alerts(req: Request, undismissed_only: bool = True):
    svc = get_notification_service()
    alerts = svc.list_smart_alerts(user_id=_uid(req), undismissed_only=undismissed_only)
    return NotificationResponse(success=True, data=[a.to_dict() for a in alerts])


@router.delete("/smart-alerts/{alert_id}", summary="删除智能提醒")
async def delete_smart_alert(alert_id: str):
    svc = get_notification_service()
    if not svc.delete_smart_alert(alert_id):
        raise HTTPException(status_code=404, detail="Smart alert not found")
    return NotificationResponse(success=True, data={"alert_id": alert_id})


@router.post("/smart-alerts/{alert_id}/dismiss", summary="忽略智能提醒")
async def dismiss_smart_alert(alert_id: str):
    svc = get_notification_service()
    if not svc.dismiss_smart_alert(alert_id):
        raise HTTPException(status_code=404, detail="Smart alert not found")
    return NotificationResponse(success=True, data={"alert_id": alert_id, "dismissed": True})


# ════════════════════════════════════════════════════════════════════════════════
# MENTIONS
# ════════════════════════════════════════════════════════════════════════════════

@router.post("/mentions", summary="发送@提及")
async def send_mention(req: Request, body: SendMentionRequest):
    svc = get_notification_service()
    mention = svc.create_mention(
        task_id=body.task_id,
        from_user=body.from_user,
        to_user=body.to_user,
        message=body.message,
        slide_ref=body.slide_ref,
    )
    return NotificationResponse(success=True, data=mention.to_dict())


@router.get("/mentions", summary="列出收到的@提及")
async def list_mentions(req: Request, unread_only: bool = False):
    svc = get_notification_service()
    to_user = _uid(req)
    mentions = svc.list_mentions(to_user=to_user, unread_only=unread_only)
    count = svc.get_unread_mention_count(to_user)
    return NotificationResponse(success=True, data={
        "mentions": [m.to_dict() for m in mentions],
        "unread_count": count,
    })


@router.post("/mentions/{mention_id}/read", summary="标记@提及为已读")
async def mark_mention_read(mention_id: str):
    svc = get_notification_service()
    if not svc.mark_mention_read(mention_id):
        raise HTTPException(status_code=404, detail="Mention not found")
    return NotificationResponse(success=True, data={"mention_id": mention_id, "read": True})


@router.post("/mentions/read-all", summary="标记全部@提及为已读")
async def mark_all_mentions_read(req: Request):
    svc = get_notification_service()
    count = svc.mark_all_mentions_read(_uid(req))
    return NotificationResponse(success=True, data={"marked_read": count})


# ════════════════════════════════════════════════════════════════════════════════
# WEEKLY DIGEST
# ════════════════════════════════════════════════════════════════════════════════

@router.post("/digest/subscribe", summary="订阅周报邮件")
async def subscribe_digest(req: Request, body: SubscribeDigestRequest):
    svc = get_notification_service()
    user_id = _uid(req)
    # Check if already subscribed
    existing = svc.get_user_digest_sub(user_id)
    if existing:
        # Update existing
        updated = svc.update_digest_sub(existing.id, email=body.email, name=body.name,
                                        day_of_week=body.day_of_week, hour=body.hour, minute=body.minute)
        return NotificationResponse(success=True, data=updated.to_dict())
    sub = svc.subscribe_digest(
        user_id=user_id,
        email=body.email,
        name=body.name,
        day_of_week=body.day_of_week,
        hour=body.hour,
        minute=body.minute,
    )
    return NotificationResponse(success=True, data=sub.to_dict())


@router.get("/digest/status", summary="查询周报订阅状态")
async def get_digest_status(req: Request):
    svc = get_notification_service()
    sub = svc.get_user_digest_sub(_uid(req))
    if not sub:
        return NotificationResponse(success=True, data={"subscribed": False})
    return NotificationResponse(success=True, data={
        "subscribed": True,
        "subscriber": sub.to_dict(),
    })


@router.delete("/digest/unsubscribe", summary="取消周报订阅")
async def unsubscribe_digest(req: Request):
    svc = get_notification_service()
    sub = svc.get_user_digest_sub(_uid(req))
    if not sub:
        raise HTTPException(status_code=404, detail="Not subscribed")
    svc.unsubscribe_digest(sub.id)
    return NotificationResponse(success=True, data={"unsubscribed": True})


@router.patch("/digest/settings", summary="更新周报设置")
async def update_digest_settings(req: Request, body: UpdateDigestRequest):
    svc = get_notification_service()
    sub = svc.get_user_digest_sub(_uid(req))
    if not sub:
        raise HTTPException(status_code=404, detail="Not subscribed")
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    updated = svc.update_digest_sub(sub.id, **updates)
    return NotificationResponse(success=True, data=updated.to_dict())


@router.post("/digest/test", summary="发送测试周报邮件")
async def test_digest_email(req: Request):
    svc = get_notification_service()
    sub = svc.get_user_digest_sub(_uid(req))
    if not sub:
        raise HTTPException(status_code=404, detail="Not subscribed")
    result = svc.send_digest_email(sub.id)
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Failed to send"))
    return NotificationResponse(success=True, data=result)


# ════════════════════════════════════════════════════════════════════════════════
# DEADLINE COUNTDOWNS
# ════════════════════════════════════════════════════════════════════════════════

@router.post("/deadlines", summary="创建截止日期倒计时")
async def create_deadline(req: Request, body: CreateDeadlineRequest):
    svc = get_notification_service()
    ddl = svc.create_deadline(
        task_id=body.task_id,
        title=body.title,
        deadline=body.deadline,
        user_id=_uid(req),
        notification_hours=body.notification_hours,
    )
    return NotificationResponse(success=True, data=ddl.to_dict())


@router.get("/deadlines", summary="列出截止日期倒计时")
async def list_deadlines(req: Request, active_only: bool = True):
    svc = get_notification_service()
    dls = svc.list_deadlines(user_id=_uid(req), active_only=active_only)
    return NotificationResponse(success=True, data=[d.to_dict() for d in dls])


@router.patch("/deadlines/{deadline_id}", summary="更新截止日期")
async def update_deadline(deadline_id: str, body: UpdateDeadlineRequest):
    svc = get_notification_service()
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    d = svc.update_deadline(deadline_id, **updates)
    if not d:
        raise HTTPException(status_code=404, detail="Deadline not found")
    return NotificationResponse(success=True, data=d.to_dict())


@router.delete("/deadlines/{deadline_id}", summary="删除截止日期")
async def delete_deadline(deadline_id: str):
    svc = get_notification_service()
    if not svc.delete_deadline(deadline_id):
        raise HTTPException(status_code=404, detail="Deadline not found")
    return NotificationResponse(success=True, data={"deadline_id": deadline_id})


@router.get("/deadlines/upcoming", summary="获取即将到期的截止日期（72小时）")
async def get_upcoming_deadlines(req: Request, hours: int = 72):
    svc = get_notification_service()
    dls = svc.get_upcoming_deadlines(user_id=_uid(req), hours=hours)
    return NotificationResponse(success=True, data=[d.to_dict() for d in dls])


# ════════════════════════════════════════════════════════════════════════════════
# UNIFIED ALERTS FEED
# ════════════════════════════════════════════════════════════════════════════════

@router.get("/alerts", summary="统一提醒列表（所有类型的未处理提醒）")
async def get_all_alerts(req: Request):
    svc = get_notification_service()
    alerts = svc.get_all_active_alerts(user_id=_uid(req))
    return NotificationResponse(success=True, data={
        "alerts": alerts,
        "total": len(alerts),
        "timestamp": datetime.now().isoformat(),
    })


@router.post("/alerts/check", summary="检查并触发到期提醒")
async def check_and_trigger_alerts(req: Request):
    """调用此接口检查是否有到期的提醒，返回并触发"""
    svc = get_notification_service()
    user_id = _uid(req)

    # Trigger due reminders
    due = svc.check_due_reminders(user_id)
    for r in due:
        svc.trigger_reminder(r.id)

    # Get due smart alerts and mark as notified
    due_alerts = svc.check_due_smart_alerts()
    due_for_user = [a for a in due_alerts if a.user_id == user_id]
    for a in due_for_user:
        a.last_triggered = datetime.now().isoformat()
        a.notified = True

    svc._persist_smart_alerts()

    return NotificationResponse(success=True, data={
        "reminders_triggered": len(due),
        "smart_alerts_due": len(due_for_user),
        "all_alerts": svc.get_all_active_alerts(user_id),
    })


# ════════════════════════════════════════════════════════════════════════════════
# GENERATION & COLLABORATOR NOTIFICATIONS
# ════════════════════════════════════════════════════════════════════════════════

class CreateGenerationNotifRequest(BaseModel):
    notif_type: str = Field(..., description="generation_complete | collaborator_joined")
    task_id: str = Field(..., description="关联的PPT任务ID")
    title: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., max_length=500)
    task_title: str | None = Field(None, max_length=200)
    collaborator_name: str | None = Field(None, max_length=100)


@router.post("/generation", summary="创建生成/协作者通知（内部调用）")
async def create_generation_notification(req: Request, body: CreateGenerationNotifRequest):
    svc = get_notification_service()
    notif = svc.create_generation_notification(
        notif_type=body.notif_type,
        task_id=body.task_id,
        title=body.title,
        message=body.message,
        user_id=_uid(req),
        task_title=body.task_title,
        collaborator_name=body.collaborator_name,
    )
    return NotificationResponse(success=True, data=notif.to_dict())


@router.get("/generation", summary="列出生成/协作者通知")
async def list_generation_notifications(
    req: Request,
    notif_type: str | None = None,
    unread_only: bool = False,
):
    svc = get_notification_service()
    notifs = svc.list_generation_notifications(
        user_id=_uid(req),
        notif_type=notif_type,
        unread_only=unread_only,
    )
    unread_count = svc.get_unread_generation_count(user_id=_uid(req))
    return NotificationResponse(success=True, data={
        "notifications": [n.to_dict() for n in notifs],
        "unread_count": unread_count,
    })


@router.patch("/generation/{notif_id}/read", summary="标记生成通知为已读")
async def mark_generation_notification_read(notif_id: str):
    svc = get_notification_service()
    ok = svc.mark_generation_notification_read(notif_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Notification not found")
    return NotificationResponse(success=True, data={"notif_id": notif_id, "read": True})


@router.post("/generation/read-all", summary="标记全部生成通知为已读")
async def mark_all_generation_notifications_read(req: Request):
    svc = get_notification_service()
    count = svc.mark_all_generation_notifications_read(user_id=_uid(req))
    return NotificationResponse(success=True, data={"marked_read": count})


# ════════════════════════════════════════════════════════════════════════════════
# NOTIFICATION PREFERENCES
# ════════════════════════════════════════════════════════════════════════════════

@router.get("/preferences", summary="获取通知偏好设置")
async def get_notification_preferences(req: Request):
    """获取用户通知偏好（从 user_service 读取）"""
    from ...services.user_service import get_user_service
    user_svc = get_user_service()
    prefs = user_svc.get_preferences()
    notif_prefs = prefs.get("notifications", {})
    return NotificationResponse(success=True, data=notif_prefs)


class UpdateNotificationPrefsRequest(BaseModel):
    email_on_complete: bool | None = None
    push_on_complete: bool | None = None
    weekly_summary: bool | None = None
    collab_joined_push: bool | None = None
    collab_joined_email: bool | None = None


@router.put("/preferences", summary="更新通知偏好设置")
async def update_notification_preferences(req: Request, body: UpdateNotificationPrefsRequest):
    """更新用户通知偏好（写入 user_service）"""
    from ...services.user_service import get_user_service
    user_svc = get_user_service()
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    user_svc.update_preferences({"notifications": updates})
    return NotificationResponse(success=True, data={"updated": updates})


# ════════════════════════════════════════════════════════════════════════════════
# COMMENT EMAIL NOTIFICATIONS
# ════════════════════════════════════════════════════════════════════════════════

class RegisterCommentEmailRequest(BaseModel):
    email: str = Field(..., description="用于接收评论通知的邮箱")
    name: str = Field(default="", description="用户显示名称")
    enabled: bool = Field(default=True, description="是否启用评论邮件通知")


class UpdateCommentEmailRequest(BaseModel):
    email: str | None = None
    name: str | None = None
    enabled: bool | None = None


@router.put("/comment-email", summary="注册/更新评论邮件通知邮箱")
async def register_comment_email(req: Request, body: RegisterCommentEmailRequest):
    """注册邮箱用于接收评论 @mention 邮件通知"""
    svc = get_notification_service()
    prefs = svc.register_comment_email(
        user_id=_uid(req),
        email=body.email,
        name=body.name,
        enabled=body.enabled,
    )
    return NotificationResponse(success=True, data=prefs.to_dict())


@router.get("/comment-email", summary="获取评论邮件通知状态")
async def get_comment_email_status(req: Request):
    """查询当前用户的评论邮件通知配置"""
    svc = get_notification_service()
    prefs = svc.get_comment_email_prefs(_uid(req))
    if not prefs:
        return NotificationResponse(success=True, data={"registered": False, "email": "", "enabled": False})
    return NotificationResponse(success=True, data={
        "registered": True,
        "email": prefs.email,
        "name": prefs.name,
        "enabled": prefs.enabled,
    })


@router.patch("/comment-email", summary="更新评论邮件通知设置")
async def update_comment_email(req: Request, body: UpdateCommentEmailRequest):
    """部分更新评论邮件通知设置"""
    svc = get_notification_service()
    existing = svc.get_comment_email_prefs(_uid(req))
    if not existing:
        raise HTTPException(status_code=404, detail="未注册评论邮件通知，请先调用 PUT /comment-email")

    prefs = svc.register_comment_email(
        user_id=_uid(req),
        email=body.email if body.email is not None else existing.email,
        name=body.name if body.name is not None else existing.name,
        enabled=body.enabled if body.enabled is not None else existing.enabled,
    )
    return NotificationResponse(success=True, data=prefs.to_dict())


@router.delete("/comment-email", summary="取消评论邮件通知")
async def delete_comment_email(req: Request):
    """取消评论邮件通知（删除已注册的邮箱）"""
    svc = get_notification_service()
    prefs = _load_comment_email_prefs()
    uid = _uid(req)
    if uid in prefs:
        del prefs[uid]
        _save_comment_email_prefs(prefs)
    return NotificationResponse(success=True, data={"deleted": True})
