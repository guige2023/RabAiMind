# -*- coding: utf-8 -*-
"""
Notification Service — 智能通知服务

管理 5 大通知类型：
1. Reminders     — 演示文稿审核日期提醒
2. Smart Alerts  — 内容更新智能提醒
3. Weekly Digest — 周报邮件摘要
4. Mention Alerts — @提及通知
5. Deadline Countdowns — 截止日期倒计时

作者: Claude
日期: 2026-04-04
"""

import hashlib
import json
import logging
import os
import secrets
import smtplib
import threading
import time
from datetime import datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from enum import Enum
from typing import Any, Dict, List, Optional

from ..config import settings
from ..utils import ensure_dir

logger = logging.getLogger(__name__)

# ── Data Paths ──────────────────────────────────────────────────────────────────

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "notifications")
ensure_dir(DATA_DIR)
REMINDERS_FILE = os.path.join(DATA_DIR, "reminders.json")
SMART_ALERTS_FILE = os.path.join(DATA_DIR, "smart_alerts.json")
MENTIONS_FILE = os.path.join(DATA_DIR, "mentions.json")
DIGEST_SUBS_FILE = os.path.join(DATA_DIR, "digest_subscribers.json")
GENERATION_NOTIFS_FILE = os.path.join(DATA_DIR, "generation_notifications.json")
LOCK = threading.Lock()

# ── Enums ─────────────────────────────────────────────────────────────────────

class ReminderStatus(str, Enum):
    PENDING = "pending"
    TRIGGERED = "triggered"
    DISMISSED = "dismissed"
    COMPLETED = "completed"


class AlertType(str, Enum):
    REVIEW_DATE = "review_date"          # 审核日期提醒
    CONTENT_UPDATE = "content_update"    # 内容更新提醒
    DEADLINE_APPROACHING = "deadline_approaching"  # 截止日期临近
    MENTION = "mention"                  # @提及
    WEEKLY_DIGEST = "weekly_digest"      # 周报摘要
    GENERATION_COMPLETE = "generation_complete"     # PPT生成完成
    COLLABORATOR_JOINED = "collaborator_joined"     # 协作者加入


# ── Helpers ────────────────────────────────────────────────────────────────────

def _now_ts() -> float:
    return time.time()


def _now_iso() -> str:
    return datetime.now().isoformat()


def _load_json(path: str, default: Any = None) -> Any:
    if not os.path.exists(path):
        return default if default is not None else {}
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default if default is not None else {}


def _save_json(path: str, data: Any):
    with LOCK:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)


def _gen_id(prefix: str = "") -> str:
    ts = hex(int(time.time() * 1000))[2:]
    rand = secrets.token_hex(4)
    return f"{prefix}{ts}{rand}" if prefix else f"{ts}{rand}"


# ── Reminder Model ─────────────────────────────────────────────────────────────

class Reminder:
    """演示文稿审核日期提醒"""
    def __init__(
        self,
        task_id: str,
        title: str,
        review_date: str,       # ISO8601
        remind_before_hours: int = 24,
        user_id: Optional[str] = None,
        notes: str = "",
        status: str = ReminderStatus.PENDING.value,
        notified_at: Optional[str] = None,
        created_at: Optional[str] = None,
        id: Optional[str] = None,
    ):
        self.id = id or _gen_id("rem_")
        self.task_id = task_id
        self.title = title
        self.review_date = review_date
        self.remind_before_hours = remind_before_hours
        self.user_id = user_id or "default"
        self.notes = notes
        self.status = status
        self.notified_at = notified_at
        self.created_at = created_at or _now_iso()

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "task_id": self.task_id,
            "title": self.title,
            "review_date": self.review_date,
            "remind_before_hours": self.remind_before_hours,
            "user_id": self.user_id,
            "notes": self.notes,
            "status": self.status,
            "notified_at": self.notified_at,
            "created_at": self.created_at,
        }

    @classmethod
    def from_dict(cls, d: dict) -> "Reminder":
        return cls(**{k: v for k, v in d.items() if k != "review_date_obj"})


# ── Smart Alert Model ──────────────────────────────────────────────────────────

class SmartAlert:
    """智能提醒规则 + 历史通知"""
    def __init__(
        self,
        task_id: str,
        rule_type: str,          # "content_age" | "data_staleness" | "review_cycle"
        title: str,
        message: str,
        trigger_after_days: int,
        user_id: Optional[str] = None,
        last_triggered: Optional[str] = None,
        notified: bool = False,
        dismissed: bool = False,
        created_at: Optional[str] = None,
        id: Optional[str] = None,
    ):
        self.id = id or _gen_id("alrt_")
        self.task_id = task_id
        self.rule_type = rule_type
        self.title = title
        self.message = message
        self.trigger_after_days = trigger_after_days
        self.user_id = user_id or "default"
        self.last_triggered = last_triggered
        self.notified = notified
        self.dismissed = dismissed
        self.created_at = created_at or _now_iso()

    def should_fire(self) -> bool:
        """检查是否应该触发提醒"""
        if self.dismissed:
            return False
        if not self.last_triggered:
            created = datetime.fromisoformat(self.created_at)
            return (datetime.now() - created).days >= self.trigger_after_days
        last = datetime.fromisoformat(self.last_triggered)
        return (datetime.now() - last).days >= self.trigger_after_days

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "task_id": self.task_id,
            "rule_type": self.rule_type,
            "title": self.title,
            "message": self.message,
            "trigger_after_days": self.trigger_after_days,
            "user_id": self.user_id,
            "last_triggered": self.last_triggered,
            "notified": self.notified,
            "dismissed": self.dismissed,
            "created_at": self.created_at,
        }

    @classmethod
    def from_dict(cls, d: dict) -> "SmartAlert":
        return cls(**{k: v for k, v in d.items()})


# ── Mention Model ───────────────────────────────────────────────────────────────

class MentionNotification:
    """@提及通知"""
    def __init__(
        self,
        task_id: str,
        from_user: str,
        to_user: str,
        message: str,
        slide_ref: Optional[str] = None,
        read: bool = False,
        id: Optional[str] = None,
        created_at: Optional[str] = None,
    ):
        self.id = id or _gen_id("mnt_")
        self.task_id = task_id
        self.from_user = from_user
        self.to_user = to_user
        self.message = message
        self.slide_ref = slide_ref
        self.read = read
        self.created_at = created_at or _now_iso()

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "task_id": self.task_id,
            "from_user": self.from_user,
            "to_user": self.to_user,
            "message": self.message,
            "slide_ref": self.slide_ref,
            "read": self.read,
            "created_at": self.created_at,
        }

    @classmethod
    def from_dict(cls, d: dict) -> "MentionNotification":
        return cls(**{k: v for k, v in d.items()})


# ── Generation / Collaborator Notification Model ────────────────────────────────

class GenerationNotification:
    """PPT生成完成 / 协作者加入通知"""
    def __init__(
        self,
        notif_type: str,        # "generation_complete" | "collaborator_joined"
        task_id: str,
        title: str,
        message: str,
        user_id: Optional[str] = None,
        task_title: Optional[str] = None,
        collaborator_name: Optional[str] = None,
        read: bool = False,
        id: Optional[str] = None,
        created_at: Optional[str] = None,
    ):
        self.id = id or _gen_id("gntf_")
        self.notif_type = notif_type
        self.task_id = task_id
        self.title = title
        self.message = message
        self.user_id = user_id or "default"
        self.task_title = task_title
        self.collaborator_name = collaborator_name
        self.read = read
        self.created_at = created_at or _now_iso()

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "notif_type": self.notif_type,
            "task_id": self.task_id,
            "title": self.title,
            "message": self.message,
            "user_id": self.user_id,
            "task_title": self.task_title,
            "collaborator_name": self.collaborator_name,
            "read": self.read,
            "created_at": self.created_at,
        }

    @classmethod
    def from_dict(cls, d: dict) -> "GenerationNotification":
        return cls(**{k: v for k, v in d.items()})


# ── Digest Subscriber Model ───────────────────────────────────────────────────

class DigestSubscriber:
    """周报邮件订阅"""
    def __init__(
        self,
        user_id: str,
        email: str,
        name: str = "",
        enabled: bool = True,
        day_of_week: int = 1,     # 0=Mon, 1=Tue ... 6=Sun
        hour: int = 9,
        minute: int = 0,
        last_sent: Optional[str] = None,
        id: Optional[str] = None,
        created_at: Optional[str] = None,
    ):
        self.id = id or _gen_id("sub_")
        self.user_id = user_id
        self.email = email
        self.name = name
        self.enabled = enabled
        self.day_of_week = day_of_week
        self.hour = hour
        self.minute = minute
        self.last_sent = last_sent
        self.created_at = created_at or _now_iso()

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "email": self.email,
            "name": self.name,
            "enabled": self.enabled,
            "day_of_week": self.day_of_week,
            "hour": self.hour,
            "minute": self.minute,
            "last_sent": self.last_sent,
            "created_at": self.created_at,
        }

    @classmethod
    def from_dict(cls, d: dict) -> "DigestSubscriber":
        return cls(**{k: v for k, v in d.items()})


# ── Deadline Model ─────────────────────────────────────────────────────────────

class DeadlineCountdown:
    """截止日期倒计时"""
    def __init__(
        self,
        task_id: str,
        title: str,
        deadline: str,           # ISO8601
        user_id: Optional[str] = None,
        reminded: bool = False,
        notification_hours: List[int] = None,  # [24, 48, 1] hours before
        id: Optional[str] = None,
        created_at: Optional[str] = None,
    ):
        self.id = id or _gen_id("ddl_")
        self.task_id = task_id
        self.title = title
        self.deadline = deadline
        self.user_id = user_id or "default"
        self.reminded = reminded
        self.notification_hours = notification_hours or [24, 1]
        self.created_at = created_at or _now_iso()

    def hours_until(self) -> float:
        dl = datetime.fromisoformat(self.deadline)
        delta = dl - datetime.now()
        return delta.total_seconds() / 3600

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "task_id": self.task_id,
            "title": self.title,
            "deadline": self.deadline,
            "user_id": self.user_id,
            "reminded": self.reminded,
            "notification_hours": self.notification_hours,
            "hours_remaining": round(self.hours_until(), 1),
            "created_at": self.created_at,
        }

    @classmethod
    def from_dict(cls, d: dict) -> "DeadlineCountdown":
        return cls(**{k: v for k, v in d.items()})


# ── Notification Service ───────────────────────────────────────────────────────

class NotificationService:
    """统一通知服务"""

    _instance: Optional["NotificationService"] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if getattr(self, "_initialized", False):
            return
        self._initialized = True
        self._lock = LOCK

        # In-memory caches
        self._reminders: Dict[str, Reminder] = {}
        self._smart_alerts: Dict[str, SmartAlert] = {}
        self._mentions: Dict[str, MentionNotification] = {}
        self._digest_subs: Dict[str, DigestSubscriber] = {}
        self._deadlines: Dict[str, DeadlineCountdown] = {}
        self._generation_notifs: Dict[str, GenerationNotification] = {}

        self._load_all()

    def _load_all(self):
        self._reminders = self._load(REMINDERS_FILE, Reminder)
        self._smart_alerts = self._load(SMART_ALERTS_FILE, SmartAlert)
        self._mentions = self._load(MENTIONS_FILE, MentionNotification)
        self._digest_subs = self._load(DIGEST_SUBS_FILE, DigestSubscriber)
        # Deadlines stored alongside reminders for simplicity
        deadlines_path = os.path.join(DATA_DIR, "deadlines.json")
        self._deadlines = self._load(deadlines_path, DeadlineCountdown)
        self._generation_notifs = self._load(GENERATION_NOTIFS_FILE, GenerationNotification)

    def _load(self, path: str, cls):
        result = {}
        data = _load_json(path, {})
        for k, v in data.items():
            try:
                result[k] = cls.from_dict(v)
            except Exception:
                pass
        return result

    def _persist_reminders(self):
        _save_json(REMINDERS_FILE, {k: v.to_dict() for k, v in self._reminders.items()})

    def _persist_smart_alerts(self):
        _save_json(SMART_ALERTS_FILE, {k: v.to_dict() for k, v in self._smart_alerts.items()})

    def _persist_mentions(self):
        _save_json(MENTIONS_FILE, {k: v.to_dict() for k, v in self._mentions.items()})

    def _persist_digest_subs(self):
        _save_json(DIGEST_SUBS_FILE, {k: v.to_dict() for k, v in self._digest_subs.items()})

    def _persist_deadlines(self):
        path = os.path.join(DATA_DIR, "deadlines.json")
        _save_json(path, {k: v.to_dict() for k, v in self._deadlines.items()})

    def _persist_generation_notifs(self):
        _save_json(GENERATION_NOTIFS_FILE, {k: v.to_dict() for k, v in self._generation_notifs.items()})

    # ==================== REMINDERS ====================

    def create_reminder(
        self,
        task_id: str,
        title: str,
        review_date: str,
        remind_before_hours: int = 24,
        user_id: Optional[str] = None,
        notes: str = "",
    ) -> Reminder:
        reminder = Reminder(
            task_id=task_id,
            title=title,
            review_date=review_date,
            remind_before_hours=remind_before_hours,
            user_id=user_id,
            notes=notes,
        )
        self._reminders[reminder.id] = reminder
        self._persist_reminders()
        return reminder

    def list_reminders(self, user_id: Optional[str] = None, status: Optional[str] = None) -> List[Reminder]:
        results = list(self._reminders.values())
        if user_id:
            results = [r for r in results if r.user_id == user_id]
        if status:
            results = [r for r in results if r.status == status]
        results.sort(key=lambda r: r.review_date)
        return results

    def get_reminder(self, reminder_id: str) -> Optional[Reminder]:
        return self._reminders.get(reminder_id)

    def update_reminder(self, reminder_id: str, **updates) -> Optional[Reminder]:
        r = self._reminders.get(reminder_id)
        if not r:
            return None
        for k, v in updates.items():
            if hasattr(r, k) and k not in ("id", "created_at"):
                setattr(r, k, v)
        self._persist_reminders()
        return r

    def delete_reminder(self, reminder_id: str) -> bool:
        if reminder_id in self._reminders:
            del self._reminders[reminder_id]
            self._persist_reminders()
            return True
        return False

    def trigger_reminder(self, reminder_id: str) -> Optional[Reminder]:
        r = self._reminders.get(reminder_id)
        if not r:
            return None
        r.status = ReminderStatus.TRIGGERED.value
        r.notified_at = _now_iso()
        self._persist_reminders()
        return r

    def check_due_reminders(self, user_id: Optional[str] = None) -> List[Reminder]:
        """返回所有已到期的提醒（未触发且在提醒时间之前）"""
        now = datetime.now()
        due = []
        for r in self._reminders.values():
            if r.status != ReminderStatus.PENDING.value:
                continue
            if user_id and r.user_id != user_id:
                continue
            review_dt = datetime.fromisoformat(r.review_date)
            trigger_dt = review_dt - timedelta(hours=r.remind_before_hours)
            if now >= trigger_dt:
                due.append(r)
        return due

    # ==================== SMART ALERTS ====================

    def create_smart_alert(
        self,
        task_id: str,
        rule_type: str,
        title: str,
        message: str,
        trigger_after_days: int,
        user_id: Optional[str] = None,
    ) -> SmartAlert:
        alert = SmartAlert(
            task_id=task_id,
            rule_type=rule_type,
            title=title,
            message=message,
            trigger_after_days=trigger_after_days,
            user_id=user_id,
        )
        self._smart_alerts[alert.id] = alert
        self._persist_smart_alerts()
        return alert

    def list_smart_alerts(self, user_id: Optional[str] = None, undismissed_only: bool = True) -> List[SmartAlert]:
        results = list(self._smart_alerts.values())
        if user_id:
            results = [a for a in results if a.user_id == user_id]
        if undismissed_only:
            results = [a for a in results if not a.dismissed]
        results.sort(key=lambda a: a.created_at, reverse=True)
        return results

    def dismiss_smart_alert(self, alert_id: str) -> bool:
        a = self._smart_alerts.get(alert_id)
        if not a:
            return False
        a.dismissed = True
        self._persist_smart_alerts()
        return True

    def delete_smart_alert(self, alert_id: str) -> bool:
        if alert_id in self._smart_alerts:
            del self._smart_alerts[alert_id]
            self._persist_smart_alerts()
            return True
        return False

    def check_due_smart_alerts(self) -> List[SmartAlert]:
        return [a for a in self._smart_alerts.values() if a.should_fire() and not a.dismissed]

    def acknowledge_smart_alert(self, alert_id: str) -> bool:
        """标记智能提醒为已通知"""
        a = self._smart_alerts.get(alert_id)
        if not a:
            return False
        a.last_triggered = _now_iso()
        a.notified = True
        self._persist_smart_alerts()
        return True

    def acknowledge_all_smart_alerts_for_user(self, user_id: str) -> int:
        """批量标记用户的所有到期提醒为已通知"""
        count = 0
        due = self.check_due_smart_alerts()
        for a in due:
            if a.user_id == user_id:
                a.last_triggered = _now_iso()
                a.notified = True
                count += 1
        if count:
            self._persist_smart_alerts()
        return count

    # ==================== MENTIONS ====================

    def create_mention(
        self,
        task_id: str,
        from_user: str,
        to_user: str,
        message: str,
        slide_ref: Optional[str] = None,
    ) -> MentionNotification:
        mention = MentionNotification(
            task_id=task_id,
            from_user=from_user,
            to_user=to_user,
            message=message,
            slide_ref=slide_ref,
        )
        self._mentions[mention.id] = mention
        self._persist_mentions()
        return mention

    def list_mentions(self, to_user: str, unread_only: bool = False) -> List[MentionNotification]:
        mentions = [m for m in self._mentions.values() if m.to_user == to_user]
        if unread_only:
            mentions = [m for m in mentions if not m.read]
        mentions.sort(key=lambda m: m.created_at, reverse=True)
        return mentions

    def mark_mention_read(self, mention_id: str) -> bool:
        m = self._mentions.get(mention_id)
        if not m:
            return False
        m.read = True
        self._persist_mentions()
        return True

    def mark_all_mentions_read(self, to_user: str) -> int:
        count = 0
        for m in self._mentions.values():
            if m.to_user == to_user and not m.read:
                m.read = True
                count += 1
        if count:
            self._persist_mentions()
        return count

    def get_unread_mention_count(self, to_user: str) -> int:
        return sum(1 for m in self._mentions.values() if m.to_user == to_user and not m.read)

    # ==================== WEEKLY DIGEST ====================

    def subscribe_digest(
        self,
        user_id: str,
        email: str,
        name: str = "",
        day_of_week: int = 1,
        hour: int = 9,
        minute: int = 0,
    ) -> DigestSubscriber:
        sub = DigestSubscriber(
            user_id=user_id,
            email=email,
            name=name,
            day_of_week=day_of_week,
            hour=hour,
            minute=minute,
        )
        self._digest_subs[sub.id] = sub
        self._persist_digest_subs()
        return sub

    def unsubscribe_digest(self, subscriber_id: str) -> bool:
        if subscriber_id in self._digest_subs:
            del self._digest_subs[subscriber_id]
            self._persist_digest_subs()
            return True
        return False

    def list_digest_subscribers(self, enabled_only: bool = True) -> List[DigestSubscriber]:
        subs = list(self._digest_subs.values())
        if enabled_only:
            subs = [s for s in subs if s.enabled]
        return subs

    def get_user_digest_sub(self, user_id: str) -> Optional[DigestSubscriber]:
        for s in self._digest_subs.values():
            if s.user_id == user_id:
                return s
        return None

    def update_digest_sub(self, subscriber_id: str, **updates) -> Optional[DigestSubscriber]:
        s = self._digest_subs.get(subscriber_id)
        if not s:
            return None
        for k, v in updates.items():
            if hasattr(s, k) and k not in ("id", "created_at"):
                setattr(s, k, v)
        self._persist_digest_subs()
        return s

    def generate_digest_email_html(self, user_id: str) -> str:
        """生成周报邮件 HTML 内容"""
        now = datetime.now()
        week_start = now - timedelta(days=7)

        # Gather data
        reminders = self.list_reminders(user_id=user_id, status=ReminderStatus.PENDING.value)
        smart_alerts = self.list_smart_alerts(user_id=user_id, undismissed_only=True)
        deadlines = [d for d in self._deadlines.values() if d.user_id == user_id and d.hours_until() > 0]
        mentions = self.list_mentions(to_user=user_id)

        # Sort deadlines
        deadlines.sort(key=lambda d: d.deadline)

        reminders_html = ""
        if reminders:
            reminders_html = "<h3>📅 待审核演示文稿</h3><ul>"
            for r in reminders[:5]:
                review_dt = datetime.fromisoformat(r.review_date)
                reminders_html += f"<li><strong>{r.title}</strong> — 审核日期: {review_dt.strftime('%Y-%m-%d %H:%M')}</li>"
            reminders_html += "</ul>"
        else:
            reminders_html = "<p>本周没有待审核的演示文稿 ✅</p>"

        alerts_html = ""
        if smart_alerts:
            alerts_html = "<h3>⚠️ 需要更新的内容</h3><ul>"
            for a in smart_alerts[:5]:
                alerts_html += f"<li><strong>{a.title}</strong>: {a.message}</li>"
            alerts_html += "</ul>"
        else:
            alerts_html = "<p>没有需要更新的内容 ✅</p>"

        deadlines_html = ""
        if deadlines:
            deadlines_html = "<h3>⏰ 即将到期</h3><ul>"
            for d in deadlines[:5]:
                hrs = d.hours_until()
                if hrs < 1:
                    deadlines_html += f"<li><strong>{d.title}</strong> — 不到1小时后到期!</li>"
                else:
                    deadlines_html += f"<li><strong>{d.title}</strong> — {round(hrs, 1)} 小时后到期</li>"
            deadlines_html += "</ul>"
        else:
            deadlines_html = "<p>没有即将到期的截止日期 ✅</p>"

        mentions_html = ""
        if mentions:
            mentions_html = "<h3>💬 @提及动态</h3><ul>"
            for m in mentions[:3]:
                mentions_html += f"<li><strong>@{m.from_user}</strong>: {m.message[:50]}...</li>"
            mentions_html += "</ul>"

        html = f"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #165DFF;">📊 RabAiMind 周报</h1>
            <p style="color: #666;">{week_start.strftime('%Y-%m-%d')} ~ {now.strftime('%Y-%m-%d')}</p>
            <hr>
            {reminders_html}
            <hr>
            {alerts_html}
            <hr>
            {deadlines_html}
            {mentions_html}
            <hr>
            <p style="color: #999; font-size: 12px;">
                RabAiMind AI PPT 生成平台 · 您收到这封邮件是因为订阅了周报通知<br>
                <a href="#">管理订阅</a> · <a href="#">取消订阅</a>
            </p>
        </body>
        </html>
        """
        return html

    def send_digest_email(self, subscriber_id: str) -> dict:
        """发送周报邮件"""
        sub = self._digest_subs.get(subscriber_id)
        if not sub or not sub.enabled:
            return {"success": False, "error": "Subscriber not found or disabled"}

        html = self.generate_digest_email_html(sub.user_id)
        smtp = getattr(settings, "SMTP_HOST", None)
        if not smtp:
            logger.warning(f"[NotificationService] SMTP not configured, skipping digest email to {sub.email}")
            return {"success": False, "error": "SMTP not configured"}

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = f"📊 RabAiMind 周报 — {datetime.now().strftime('%Y-%m-%d')}"
            msg["From"] = f"{getattr(settings, 'SMTP_FROM_NAME', 'RabAiMind')} <{getattr(settings, 'SMTP_FROM_EMAIL', '')}>"
            msg["To"] = sub.email
            msg.attach(MIMEText(html, "html", "utf-8"))

            with smtplib.SMTP(smtp, getattr(settings, "SMTP_PORT", 587)) as server:
                server.ehlo()
                server.starttls()
                user = getattr(settings, "SMTP_USER", None)
                pw = getattr(settings, "SMTP_PASSWORD", None)
                if user and pw:
                    server.login(user, pw)
                server.send_message(msg)

            sub.last_sent = _now_iso()
            self._persist_digest_subs()
            return {"success": True, "email": sub.email}
        except Exception as e:
            logger.error(f"[NotificationService] Failed to send digest email: {e}")
            return {"success": False, "error": str(e)}

    # ==================== DEADLINE COUNTDOWNS ====================

    def create_deadline(
        self,
        task_id: str,
        title: str,
        deadline: str,
        user_id: Optional[str] = None,
        notification_hours: Optional[List[int]] = None,
    ) -> DeadlineCountdown:
        ddl = DeadlineCountdown(
            task_id=task_id,
            title=title,
            deadline=deadline,
            user_id=user_id,
            notification_hours=notification_hours or [24, 1],
        )
        self._deadlines[ddl.id] = ddl
        self._persist_deadlines()
        return ddl

    def list_deadlines(self, user_id: Optional[str] = None, active_only: bool = True) -> List[DeadlineCountdown]:
        results = list(self._deadlines.values())
        if user_id:
            results = [d for d in results if d.user_id == user_id]
        if active_only:
            results = [d for d in results if d.hours_until() > 0]
        results.sort(key=lambda d: d.deadline)
        return results

    def delete_deadline(self, deadline_id: str) -> bool:
        if deadline_id in self._deadlines:
            del self._deadlines[deadline_id]
            self._persist_deadlines()
            return True
        return False

    def update_deadline(self, deadline_id: str, **updates) -> Optional[DeadlineCountdown]:
        d = self._deadlines.get(deadline_id)
        if not d:
            return None
        for k, v in updates.items():
            if hasattr(d, k) and k not in ("id", "created_at"):
                setattr(d, k, v)
        self._persist_deadlines()
        return d

    def get_upcoming_deadlines(self, user_id: Optional[str] = None, hours: int = 72) -> List[DeadlineCountdown]:
        """获取接下来 N 小时内即将到期的截止日期"""
        results = []
        for d in self._deadlines.values():
            if user_id and d.user_id != user_id:
                continue
            hrs = d.hours_until()
            if 0 < hrs <= hours:
                results.append(d)
        results.sort(key=lambda x: x.deadline)
        return results

    # ==================== GENERATION NOTIFICATIONS ====================

    def create_generation_notification(
        self,
        notif_type: str,
        task_id: str,
        title: str,
        message: str,
        user_id: Optional[str] = None,
        task_title: Optional[str] = None,
        collaborator_name: Optional[str] = None,
    ) -> GenerationNotification:
        """创建生成完成/协作者加入通知"""
        notif = GenerationNotification(
            notif_type=notif_type,
            task_id=task_id,
            title=title,
            message=message,
            user_id=user_id,
            task_title=task_title,
            collaborator_name=collaborator_name,
        )
        self._generation_notifs[notif.id] = notif
        self._persist_generation_notifs()
        return notif

    def list_generation_notifications(
        self,
        user_id: Optional[str] = None,
        notif_type: Optional[str] = None,
        unread_only: bool = False,
    ) -> List[GenerationNotification]:
        """列出生成/协作者通知"""
        results = []
        for n in self._generation_notifs.values():
            if user_id and n.user_id != user_id:
                continue
            if notif_type and n.notif_type != notif_type:
                continue
            if unread_only and n.read:
                continue
            results.append(n)
        results.sort(key=lambda x: x.created_at, reverse=True)
        return results

    def get_unread_generation_count(self, user_id: Optional[str] = None) -> int:
        """获取未读的生成/协作者通知数量"""
        return sum(
            1 for n in self._generation_notifs.values()
            if not n.read and (not user_id or n.user_id == user_id)
        )

    def mark_generation_notification_read(self, notif_id: str) -> bool:
        """标记单条通知为已读"""
        if notif_id in self._generation_notifs:
            self._generation_notifs[notif_id].read = True
            self._persist_generation_notifs()
            return True
        return False

    def mark_all_generation_notifications_read(self, user_id: Optional[str] = None) -> int:
        """标记所有通知为已读，返回数量"""
        count = 0
        for n in self._generation_notifs.values():
            if not n.read and (not user_id or n.user_id == user_id):
                n.read = True
                count += 1
        if count > 0:
            self._persist_generation_notifs()
        return count

    # ==================== COMMENT EMAIL NOTIFICATIONS ====================

    def register_comment_email(
        self,
        user_id: str,
        email: str,
        name: str = "",
        enabled: bool = True,
    ) -> CommentEmailPrefs:
        """注册/更新用户评论邮件通知偏好"""
        prefs = _load_comment_email_prefs()
        existing = prefs.get(user_id)
        if existing:
            # Update existing
            existing["email"] = email
            existing["name"] = name
            existing["enabled"] = enabled
            prefs[user_id] = existing
        else:
            prefs[user_id] = CommentEmailPrefs(
                user_id=user_id,
                email=email,
                name=name,
                enabled=enabled,
            ).to_dict()
        _save_comment_email_prefs(prefs)
        return CommentEmailPrefs.from_dict(prefs[user_id])

    def get_comment_email_prefs(self, user_id: str) -> Optional[CommentEmailPrefs]:
        """获取用户评论邮件偏好"""
        prefs = _load_comment_email_prefs()
        data = prefs.get(user_id)
        if data:
            return CommentEmailPrefs.from_dict(data)
        return None

    def send_comment_notification_email(
        self,
        to_user_id: str,
        from_user_name: str,
        ppt_title: str,
        slide_num: int,
        content: str,
        is_reply: bool = False,
        reply_preview: str = "",
        thread_url: str = "",
    ) -> dict:
        """
        发送评论通知邮件给被 @提及 的用户。
        返回 {'success': True/False, 'email': xxx} 或 {'success': False, 'error': ...}
        """
        prefs_data = _load_comment_email_prefs()
        user_prefs = prefs_data.get(to_user_id)

        if not user_prefs:
            return {"success": False, "error": "User has no email registered for notifications"}

        if not user_prefs.get("enabled", True):
            return {"success": False, "error": "User has disabled comment email notifications"}

        email = user_prefs.get("email", "")
        if not email:
            return {"success": False, "error": "No email address configured"}

        html = _build_comment_email_html(
            from_name=from_user_name,
            ppt_title=ppt_title,
            slide_num=slide_num,
            content=content,
            reply_preview=reply_preview,
            is_reply=is_reply,
            thread_url=thread_url,
        )

        subject = f"💬 {from_user_name} 在「{ppt_title}」发表了评论"
        if is_reply:
            subject = f"💬 {from_user_name} 回复了你的评论"

        # Use notification service SMTP settings
        smtp = getattr(settings, "SMTP_HOST", None) or os.getenv("SMTP_HOST", "")
        if not smtp:
            logger.warning(f"[NotificationService] SMTP not configured, skipping comment email to {email}")
            return {"success": False, "error": "SMTP not configured"}

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = os.getenv("SMTP_FROM", os.getenv("SMTP_USER", "noreply@rabai.com"))
            msg["To"] = email
            msg.attach(MIMEText(html, "html", "utf-8"))

            smtp_port = int(os.getenv("SMTP_PORT", "587"))
            smtp_user = os.getenv("SMTP_USER", "")
            smtp_password = os.getenv("SMTP_PASSWORD", "")

            with smtplib.SMTP(smtp, smtp_port) as server:
                server.ehlo()
                server.starttls()
                if smtp_user and smtp_password:
                    server.login(smtp_user, smtp_password)
                server.sendmail(msg["From"], [email], msg.as_string())

            logger.info(f"[NotificationService] Comment email sent to {email}")
            return {"success": True, "email": email}
        except Exception as e:
            logger.error(f"[NotificationService] Failed to send comment email to {email}: {e}")
            return {"success": False, "error": str(e)}

    def notify_comment_added(
        self,
        ppt_title: str,
        slide_num: int,
        author_name: str,
        content: str,
        mentions: List[Dict],
        is_reply: bool = False,
        reply_preview: str = "",
        thread_url: str = "",
    ) -> List[dict]:
        """
        当评论添加时，发送邮件通知给所有被 @提及 的用户。
        返回每用户的发送结果列表。
        """
        results = []
        for mention in mentions:
            user_id = mention.get("user_id", "")
            if not user_id:
                continue
            result = self.send_comment_notification_email(
                to_user_id=user_id,
                from_user_name=author_name,
                ppt_title=ppt_title,
                slide_num=slide_num,
                content=content,
                is_reply=is_reply,
                reply_preview=reply_preview,
                thread_url=thread_url,
            )
            results.append({"user_id": user_id, **result})
        return results

    # ==================== UNIFIED ALERTS LIST ====================

    def get_all_active_alerts(self, user_id: Optional[str] = None) -> List[dict]:
        """返回所有未处理的提醒（统一视图）"""
        alerts = []

        # Due reminders
        for r in self.check_due_reminders(user_id):
            alerts.append({
                "type": AlertType.REVIEW_DATE.value,
                "id": r.id,
                "task_id": r.task_id,
                "title": r.title,
                "message": f"演示文稿「{r.title}」审核日期为 {r.review_date}，请及时处理",
                "sub_message": r.notes,
                "created_at": r.created_at,
                "priority": "high",
            })

        # Due smart alerts
        for a in self.check_due_smart_alerts():
            if user_id and a.user_id != user_id:
                continue
            alerts.append({
                "type": AlertType.CONTENT_UPDATE.value,
                "id": a.id,
                "task_id": a.task_id,
                "title": a.title,
                "message": a.message,
                "sub_message": f"内容已 {a.trigger_after_days} 天未更新",
                "created_at": a.created_at,
                "priority": "medium",
            })

        # Upcoming deadlines (within 72h)
        for d in self.get_upcoming_deadlines(user_id, hours=72):
            hrs = d.hours_until()
            if hrs < 1:
                urgency = "紧急"
            elif hrs < 24:
                urgency = "今日到期"
            else:
                urgency = f"{round(hrs)} 小时后到期"
            alerts.append({
                "type": AlertType.DEADLINE_APPROACHING.value,
                "id": d.id,
                "task_id": d.task_id,
                "title": d.title,
                "message": f"「{d.title}」{urgency}",
                "sub_message": f"截止时间: {d.deadline}",
                "hours_remaining": round(hrs, 1),
                "created_at": d.created_at,
                "priority": "high" if hrs < 24 else "medium",
            })

        # Unread mentions
        for m in self.list_mentions(user_id, unread_only=True):
            alerts.append({
                "type": AlertType.MENTION.value,
                "id": m.id,
                "task_id": m.task_id,
                "title": f"@{m.from_user} 提到了你",
                "message": m.message[:80],
                "slide_ref": m.slide_ref,
                "created_at": m.created_at,
                "priority": "medium",
            })

        # Unread generation/collaborator notifications
        for n in self.list_generation_notifications(user_id, unread_only=True):
            alerts.append({
                "type": n.notif_type,
                "id": n.id,
                "task_id": n.task_id,
                "title": n.title,
                "message": n.message,
                "created_at": n.created_at,
                "priority": "medium",
            })

        # Sort by priority then time
        priority_order = {"high": 0, "medium": 1, "low": 2}
        alerts.sort(key=lambda x: (priority_order.get(x["priority"], 2), x["created_at"]))
        return alerts


# ── Comment Email Notification ────────────────────────────────────────────────

# In-memory store for user email preferences (user_id -> {email, enabled})
# Persisted to JSON
COMMENT_EMAIL_PREFS_FILE = os.path.join(DATA_DIR, "comment_email_prefs.json")


def _load_comment_email_prefs() -> Dict[str, dict]:
    return _load_json(COMMENT_EMAIL_PREFS_FILE, {})


def _save_comment_email_prefs(prefs: Dict[str, dict]):
    _save_json(COMMENT_EMAIL_PREFS_FILE, prefs)


class CommentEmailPrefs:
    """用户评论邮件通知偏好"""

    def __init__(
        self,
        user_id: str,
        email: str = "",
        enabled: bool = True,
        name: str = "",
        id: Optional[str] = None,
        created_at: Optional[str] = None,
    ):
        self.id = id or _gen_id("cep_")
        self.user_id = user_id
        self.email = email
        self.enabled = enabled
        self.name = name
        self.created_at = created_at or _now_iso()

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "email": self.email,
            "enabled": self.enabled,
            "name": self.name,
            "created_at": self.created_at,
        }

    @classmethod
    def from_dict(cls, d: dict) -> "CommentEmailPrefs":
        return cls(**{k: v for k, v in d.items()})


def _build_comment_email_html(
    from_name: str,
    ppt_title: str,
    slide_num: int,
    content: str,
    reply_preview: str = "",
    is_reply: bool = False,
    thread_url: str = "",
    primary_color: str = "#165DFF",
) -> str:
    """Build HTML email for a new comment notification."""
    header_title = f"💬 {from_name} 在幻灯片 {slide_num} 发表了评论"
    if is_reply:
        header_title = f"💬 {from_name} 回复了你的评论"

    # Truncate long content
    display_content = content[:300] + ("..." if len(content) > 300 else "")

    html_body = f"""
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, {primary_color} 0%, #0E42D2 100%); padding: 28px 32px; border-radius: 16px 16px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 22px;">{header_title}</h1>
        <p style="color: rgba(255,255,255,0.85); font-size: 14px; margin: 8px 0 0;">{ppt_title}</p>
      </div>
      <div style="background: #f8f9fa; padding: 32px; border-radius: 0 0 16px 16px; border: 1px solid #e0e0e0; border-top: none;">
        <div style="background: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; border-left: 4px solid {primary_color};">
          <p style="margin: 0 0 12px; font-size: 14px; color: #888;">
            <strong style="color: #333;">{from_name}</strong> 在第 {slide_num} 页说:
          </p>
          <p style="margin: 0; font-size: 15px; color: #1a1a1a; line-height: 1.6;">{display_content}</p>
        </div>
        {f'<div style="background: #fff8f0; padding: 16px; border-radius: 8px; margin-bottom: 20px; font-size: 14px; color: #666;">\n          <strong>💬 回复内容:</strong> {reply_preview[:100]}...\n        </div>' if is_reply and reply_preview else ''}
        <div style="text-align: center; margin: 24px 0;">
          <a href="{thread_url}"
             style="display: inline-block; background: linear-gradient(135deg, {primary_color}, #0E42D2); color: white; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-size: 15px; font-weight: 600; box-shadow: 0 4px 12px rgba(22,93,255,0.3);">
             查看并回复评论 →
          </a>
        </div>
        <p style="font-size: 12px; color: #aaa; text-align: center; margin-top: 24px;">
          你收到这封邮件是因为有人在评论中 @提及了你 · <a href="{thread_url}" style="color: {primary_color};">查看幻灯片</a>
        </p>
        <p style="font-size: 11px; color: #ccc; text-align: center; margin-top: 16px;">
          RabAiMind AI PPT 生成平台 · <a href="#" style="color: #ccc;">取消邮件通知</a>
        </p>
      </div>
    </body>
    </html>
    """
    return html_body


# ── Singleton Access ────────────────────────────────────────────────────────────

_notification_service: Optional[NotificationService] = None

def get_notification_service() -> NotificationService:
    global _notification_service
    if _notification_service is None:
        _notification_service = NotificationService()
    return _notification_service
