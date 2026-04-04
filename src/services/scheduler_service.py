# -*- coding: utf-8 -*-
"""
Scheduler Service — 定时任务调度服务

支持：
1. 定时生成 PPT（一次性 / 循环）
2. 批量定时导出
3. Webhook 触发器（外部事件触发定时任务）
4. 邮件投递调度

作者: Claude
日期: 2026-04-04
"""

import asyncio
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
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.date import DateTrigger
from apscheduler.triggers.interval import IntervalTrigger
from pydantic import BaseModel, Field

from ..config import settings
from ..utils import ensure_dir
from .webhook_service import get_webhook_service, WebhookEvent

logger = logging.getLogger(__name__)

# ── Data Paths ──────────────────────────────────────────────────────────────────

SCHEDULER_DATA_DIR = os.path.join(os.path.dirname(settings.OUTPUT_DIR), "data")
ensure_dir(SCHEDULER_DATA_DIR)
SCHEDULES_FILE = os.path.join(SCHEDULER_DATA_DIR, "schedules.json")
SCHEDULED_EMAILS_FILE = os.path.join(SCHEDULER_DATA_DIR, "scheduled_emails.json")


# ── Enums ─────────────────────────────────────────────────────────────────────

class ScheduleType(str, Enum):
    ONCE = "once"       # 一次性
    DAILY = "daily"      # 每天
    WEEKLY = "weekly"    # 每周
    MONTHLY = "monthly"  # 每月


class ScheduleStatus(str, Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"  # 一次性任务执行完毕


class ScheduleAction(str, Enum):
    GENERATE = "generate"          # 生成PPT
    EXPORT = "export"              # 导出（pptx/pdf/png）
    WEBHOOK_TRIGGER = "webhook"    # 触发webhook
    EMAIL_DELIVERY = "email"       # 发送邮件


# ── Models ─────────────────────────────────────────────────────────────────────

class GenerationParams(BaseModel):
    """生成PPT的参数（用于定时生成）"""
    user_request: str = Field(..., description="PPT需求描述")
    slide_count: int = Field(default=10, ge=5, le=30)
    scene: str = Field(default="business")
    style: str = Field(default="professional")
    template: str = Field(default="default")
    theme_color: str = Field(default="#165DFF")
    text_style: str = Field(default="transparent_overlay")
    font_title: str = Field(default="思源黑体")
    font_subtitle: str = Field(default="思源黑体")
    font_content: str = Field(default="思源宋体")
    layout_mode: str = Field(default="auto")
    generation_mode: str = Field(default="standard")
    output_format: str = Field(default="pptx")


class Schedule(BaseModel):
    """定时任务"""
    id: str
    name: str = Field(..., description="任务名称")
    action: ScheduleAction
    schedule_type: ScheduleType
    # 时间配置
    run_at: Optional[str] = Field(None, description="执行时间 (ISO8601)，用于 once 类型")
    cron_expression: Optional[str] = Field(None, description="Cron 表达式，用于 weekly/monthly")
    # 循环间隔（用于 daily/weekly/monthly）
    day_of_week: Optional[str] = Field(None, description="周几执行 (0-6, mon-sun)，用于 weekly")
    day_of_month: Optional[int] = Field(None, ge=1, le=31, description="每月几号，用于 monthly")
    hour: Optional[int] = Field(None, ge=0, le=23)
    minute: Optional[int] = Field(None, ge=0, le=59)
    # 动作参数
    params: Dict[str, Any] = Field(default_factory=dict, description="动作参数（如生成参数/导出配置）")
    # 元信息
    status: ScheduleStatus = ScheduleStatus.ACTIVE
    created_at: float = Field(default_factory=time.time)
    updated_at: float = Field(default_factory=time.time)
    last_run_at: Optional[float] = None
    next_run_at: Optional[float] = None
    run_count: int = 0
    # 关联
    user_id: Optional[str] = Field(None, description="所属用户")
    task_ids: List[str] = Field(default_factory=list, description="关联的任务ID列表")
    webhook_event: Optional[str] = Field(None, description="触发的 webhook 事件")


class ScheduledEmail(BaseModel):
    """邮件投递配置"""
    id: str
    schedule_id: Optional[str] = Field(None, description="关联的定时任务ID")
    task_id: Optional[str] = Field(None, description="关联的PPT任务ID")
    # 收件人
    to_email: str
    to_name: Optional[str] = None
    # 内容
    subject: str
    body_html: str
    body_text: Optional[str] = None
    # SMTP 配置（从环境变量读取，不需要每次请求）
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_from_email: Optional[str] = None
    smtp_from_name: Optional[str] = None
    # 状态
    status: ScheduleStatus = ScheduleStatus.ACTIVE
    created_at: float = Field(default_factory=time.time)
    sent_at: Optional[float] = None
    error: Optional[str] = None


# ── Persistence ───────────────────────────────────────────────────────────────

def _load_schedules() -> List[Dict]:
    if os.path.exists(SCHEDULES_FILE):
        try:
            with open(SCHEDULES_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []
    return []


def _save_schedules(schedules: List[Dict]):
    with open(SCHEDULES_FILE, "w", encoding="utf-8") as f:
        json.dump(schedules, f, ensure_ascii=False, indent=2)


def _load_emails() -> List[Dict]:
    if os.path.exists(SCHEDULED_EMAILS_FILE):
        try:
            with open(SCHEDULED_EMAILS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []
    return []


def _save_emails(emails: List[Dict]):
    with open(SCHEDULED_EMAILS_FILE, "w", encoding="utf-8") as f:
        json.dump(emails, f, ensure_ascii=False, indent=2)


# ── SchedulerService ─────────────────────────────────────────────────────────

class SchedulerService:
    """定时任务调度服务"""

    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        self._schedules: Dict[str, Schedule] = {}
        self._emails: Dict[str, ScheduledEmail] = {}
        self._scheduler: Optional[BackgroundScheduler] = None
        self._scheduler_lock = threading.Lock()
        self._started = False
        self._loop: Optional[asyncio.AbstractEventLoop] = None

        # Load persisted data
        self._load_all()

    # ── Persistence ──────────────────────────────────────────────────────────

    def _load_all(self):
        """从磁盘加载所有持久化数据"""
        for d in _load_schedules():
            try:
                s = Schedule(**d)
                self._schedules[s.id] = s
            except Exception as e:
                logger.warning(f"加载 schedule 失败: {e}")

        for d in _load_emails():
            try:
                e = ScheduledEmail(**d)
                self._emails[e.id] = e
            except Exception as e:
                logger.warning(f"加载 scheduled_email 失败: {e}")

    def _persist_schedules(self):
        _save_schedules([s.model_dump() for s in self._schedules.values()])

    def _persist_emails(self):
        _save_emails([e.model_dump() for e in self._emails.values()])

    # ── Scheduler Lifecycle ──────────────────────────────────────────────────

    def start(self, loop: Optional[asyncio.AbstractEventLoop] = None):
        """启动调度器（在 FastAPI startup 时调用）"""
        with self._scheduler_lock:
            if self._started:
                return
            self._loop = loop
            self._scheduler = BackgroundScheduler(timezone="Asia/Shanghai")
            self._scheduler.start()
            self._started = True
            logger.info(f"SchedulerService 启动，共加载 {len(self._schedules)} 个任务")

            # 重新注册所有活跃任务
            for sched in self._schedules.values():
                if sched.status == ScheduleStatus.ACTIVE:
                    self._register_job(sched)

    def stop(self):
        """停止调度器（在 FastAPI shutdown 时调用）"""
        with self._scheduler_lock:
            if not self._started:
                return
            if self._scheduler:
                self._scheduler.shutdown(wait=False)
                self._scheduler = None
            self._started = False
            logger.info("SchedulerService 已停止")

    # ── Job ID Helpers ────────────────────────────────────────────────────────

    @staticmethod
    def _job_id(schedule_id: str) -> str:
        return f"schedule_{schedule_id}"

    @staticmethod
    def _generate_id() -> str:
        return hashlib.sha256(secrets.token_bytes(32)).hexdigest()[:16]

    # ── Schedule CRUD ─────────────────────────────────────────────────────────

    def create_schedule(
        self,
        name: str,
        action: ScheduleAction,
        schedule_type: ScheduleType,
        params: Optional[Dict[str, Any]] = None,
        run_at: Optional[str] = None,
        cron_expression: Optional[str] = None,
        day_of_week: Optional[str] = None,
        day_of_month: Optional[int] = None,
        hour: Optional[int] = None,
        minute: Optional[int] = None,
        user_id: Optional[str] = None,
    ) -> Schedule:
        """创建定时任务"""
        sid = self._generate_id()
        params = params or {}

        # 计算 next_run_at
        next_run = self._calc_next_run(schedule_type, run_at, day_of_week, day_of_month, hour, minute)

        sched = Schedule(
            id=sid,
            name=name,
            action=action,
            schedule_type=schedule_type,
            params=params,
            run_at=run_at,
            cron_expression=cron_expression,
            day_of_week=day_of_week,
            day_of_month=day_of_month,
            hour=hour if hour is not None else 9,
            minute=minute if minute is not None else 0,
            user_id=user_id,
            next_run_at=next_run,
        )

        self._schedules[sid] = sched
        self._persist_schedules()

        if sched.status == ScheduleStatus.ACTIVE:
            self._register_job(sched)

        logger.info(f"创建定时任务: id={sid} name={name} action={action.value} type={schedule_type.value}")
        return sched

    def get_schedule(self, schedule_id: str) -> Optional[Schedule]:
        return self._schedules.get(schedule_id)

    def list_schedules(self, user_id: Optional[str] = None, status: Optional[ScheduleStatus] = None) -> List[Schedule]:
        """列出所有定时任务"""
        results = list(self._schedules.values())
        if user_id:
            results = [s for s in results if s.user_id == user_id]
        if status:
            results = [s for s in results if s.status == status]
        return sorted(results, key=lambda s: s.created_at, reverse=True)

    def update_schedule(self, schedule_id: str, **kwargs) -> Optional[Schedule]:
        """更新定时任务"""
        sched = self._schedules.get(schedule_id)
        if not sched:
            return None

        # 移除不允许直接更新的字段
        kwargs.pop("id", None)
        kwargs.pop("created_at", None)

        for key, val in kwargs.items():
            if hasattr(sched, key) and val is not None:
                setattr(sched, key, val)

        sched.updated_at = time.time()

        # 重新计算 next_run
        sched.next_run_at = self._calc_next_run(
            sched.schedule_type,
            sched.run_at,
            sched.day_of_week,
            sched.day_of_month,
            sched.hour,
            sched.minute,
        )

        # 重新注册 job
        self._remove_job(schedule_id)
        if sched.status == ScheduleStatus.ACTIVE:
            self._register_job(sched)

        self._persist_schedules()
        logger.info(f"更新定时任务: id={schedule_id}")
        return sched

    def delete_schedule(self, schedule_id: str) -> bool:
        """删除定时任务"""
        self._remove_job(schedule_id)
        if schedule_id in self._schedules:
            del self._schedules[schedule_id]
            self._persist_schedules()
            logger.info(f"删除定时任务: id={schedule_id}")
            return True
        return False

    def pause_schedule(self, schedule_id: str) -> bool:
        """暂停定时任务"""
        sched = self._schedules.get(schedule_id)
        if not sched:
            return False
        sched.status = ScheduleStatus.PAUSED
        sched.updated_at = time.time()
        self._remove_job(schedule_id)
        self._persist_schedules()
        logger.info(f"暂停定时任务: id={schedule_id}")
        return True

    def resume_schedule(self, schedule_id: str) -> bool:
        """恢复定时任务"""
        sched = self._schedules.get(schedule_id)
        if not sched:
            return False
        sched.status = ScheduleStatus.ACTIVE
        sched.updated_at = time.time()
        sched.next_run_at = self._calc_next_run(
            sched.schedule_type, sched.run_at,
            sched.day_of_week, sched.day_of_month, sched.hour, sched.minute,
        )
        self._register_job(sched)
        self._persist_schedules()
        logger.info(f"恢复定时任务: id={schedule_id}")
        return True

    def trigger_now(self, schedule_id: str) -> Dict[str, Any]:
        """立即触发一个定时任务"""
        sched = self._schedules.get(schedule_id)
        if not sched:
            return {"success": False, "error": "Schedule not found"}

        return self._execute_schedule(sched)

    # ── Next Run Calculation ─────────────────────────────────────────────────

    def _calc_next_run(
        self,
        schedule_type: ScheduleType,
        run_at: Optional[str],
        day_of_week: Optional[str],
        day_of_month: Optional[int],
        hour: int,
        minute: int,
    ) -> Optional[float]:
        """计算下次执行时间戳"""
        now = datetime.now()
        h = hour if hour is not None else 9
        m = minute if minute is not None else 0

        if schedule_type == ScheduleType.ONCE:
            if not run_at:
                return None
            try:
                dt = datetime.fromisoformat(run_at.replace("Z", "+08:00"))
                return dt.timestamp() if dt > now else None
            except Exception:
                return None

        elif schedule_type == ScheduleType.DAILY:
            next_dt = now.replace(hour=h, minute=m, second=0, microsecond=0)
            if next_dt <= now:
                next_dt += timedelta(days=1)
            return next_dt.timestamp()

        elif schedule_type == ScheduleType.WEEKLY:
            # day_of_week: "mon","tue",... or "0","1",...
            day_map = {"mon": 0, "tue": 1, "wed": 2, "thu": 3, "fri": 4, "sat": 5, "sun": 6}
            if day_of_week is not None:
                try:
                    target_day = day_map.get(day_of_week.lower(), int(day_of_week) % 7)
                except Exception:
                    target_day = 0
            else:
                target_day = 0

            next_dt = now.replace(hour=h, minute=m, second=0, microsecond=0)
            days_ahead = (target_day - next_dt.weekday()) % 7
            if days_ahead == 0 and next_dt <= now:
                days_ahead = 7
            next_dt += timedelta(days=days_ahead)
            return next_dt.timestamp()

        elif schedule_type == ScheduleType.MONTHLY:
            target_day = day_of_month or 1
            next_dt = now.replace(day=target_day, hour=h, minute=m, second=0, microsecond=0)
            if next_dt <= now:
                # 下个月
                if now.month == 12:
                    next_dt = next_dt.replace(year=now.year + 1, month=1)
                else:
                    next_dt = next_dt.replace(month=now.month + 1)
            return next_dt.timestamp()

        return None

    # ── APScheduler Job Registration ─────────────────────────────────────────

    def _register_job(self, sched: Schedule):
        """向 APScheduler 注册任务"""
        if not self._scheduler:
            return

        job_id = self._job_id(sched.id)
        try:
            self._scheduler.remove_job(job_id)
        except Exception:
            pass

        h = sched.hour if sched.hour is not None else 9
        m = sched.minute if sched.minute is not None else 0

        if sched.schedule_type == ScheduleType.ONCE:
            if not sched.run_at:
                return
            try:
                run_dt = datetime.fromisoformat(sched.run_at.replace("Z", "+08:00"))
                trigger = DateTrigger(run_date=run_dt)
            except Exception:
                return

        elif sched.schedule_type == ScheduleType.DAILY:
            trigger = CronTrigger(hour=h, minute=m, timezone="Asia/Shanghai")

        elif sched.schedule_type == ScheduleType.WEEKLY:
            dow = sched.day_of_week or "mon"
            trigger = CronTrigger(day_of_week=dow, hour=h, minute=m, timezone="Asia/Shanghai")

        elif sched.schedule_type == ScheduleType.MONTHLY:
            dom = sched.day_of_month or 1
            trigger = CronTrigger(day=dom, hour=h, minute=m, timezone="Asia/Shanghai")

        else:
            return

        self._scheduler.add_job(
            self._execute_schedule_wrapper,
            trigger=trigger,
            args=[sched.id],
            id=job_id,
            replace_existing=True,
            misfire_grace_time=300,  # 5分钟内的错过任务补偿执行
        )

    def _remove_job(self, schedule_id: str):
        """从 APScheduler 移除任务"""
        if not self._scheduler:
            return
        try:
            self._scheduler.remove_job(self._job_id(schedule_id))
        except Exception:
            pass

    # ── Execution ────────────────────────────────────────────────────────────

    def _execute_schedule_wrapper(self, schedule_id: str):
        """APScheduler 回调包装（在线程池执行）"""
        try:
            result = self._execute_schedule_by_id(schedule_id)
            logger.info(f"定时任务执行完成: id={schedule_id} result={result}")
        except Exception as e:
            logger.error(f"定时任务执行失败: id={schedule_id} error={e}")

    def _execute_schedule_by_id(self, schedule_id: str) -> Dict[str, Any]:
        """根据 ID 执行调度任务"""
        sched = self._schedules.get(schedule_id)
        if not sched:
            return {"success": False, "error": "Schedule not found"}

        return self._execute_schedule(sched)

    def _execute_schedule(self, sched: Schedule) -> Dict[str, Any]:
        """执行一个调度任务"""
        sched.last_run_at = time.time()
        sched.run_count += 1
        self._persist_schedules()

        # 一次性任务执行后标记为完成
        if sched.schedule_type == ScheduleType.ONCE:
            sched.status = ScheduleStatus.COMPLETED
            self._remove_job(sched.id)
            self._persist_schedules()

        action = sched.action

        if action == ScheduleAction.GENERATE:
            return self._do_generate(sched)
        elif action == ScheduleAction.EXPORT:
            return self._do_export(sched)
        elif action == ScheduleAction.WEBHOOK_TRIGGER:
            return self._do_webhook(sched)
        elif action == ScheduleAction.EMAIL_DELIVERY:
            return self._do_email_delivery(sched)
        else:
            return {"success": False, "error": f"Unknown action: {action}"}

    def _do_generate(self, sched: Schedule) -> Dict[str, Any]:
        """执行 PPT 生成"""
        from .ppt_generator import get_ppt_generator
        from .task_manager import get_task_manager

        params = sched.params or {}
        gen_params = params.get("generation", {})

        tm = get_task_manager()
        task_id = tm.create_task(
            user_request=gen_params.get("user_request", "Scheduled PPT generation"),
            slide_count=gen_params.get("slide_count", 10),
            scene=gen_params.get("scene", "business"),
            style=gen_params.get("style", "professional"),
            template=gen_params.get("template", "default"),
            theme_color=gen_params.get("theme_color", "#165DFF"),
        )

        # 异步执行生成
        def run():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                loop.run_until_complete(
                    get_ppt_generator().generate(
                        task_id=task_id,
                        user_request=gen_params.get("user_request", "Scheduled PPT generation"),
                        slide_count=gen_params.get("slide_count", 10),
                        scene=gen_params.get("scene", "business"),
                        style=gen_params.get("style", "professional"),
                        template=gen_params.get("template", "default"),
                        theme_color=gen_params.get("theme_color", "#165DFF"),
                        text_style=gen_params.get("text_style", "transparent_overlay"),
                        font_title=gen_params.get("font_title", "思源黑体"),
                        font_content=gen_params.get("font_content", "思源宋体"),
                        generation_mode=gen_params.get("generation_mode", "standard"),
                        output_format=gen_params.get("output_format", "pptx"),
                        layout_mode=gen_params.get("layout_mode", "auto"),
                        pre_generated_slides=gen_params.get("pre_generated_slides"),
                    )
                )
            except Exception as e:
                logger.error(f"Scheduled generation failed: {e}")
                tm.fail_task(task_id, "SCHEDULED_GENERATION_ERROR", str(e))
            finally:
                loop.close()

        thread = threading.Thread(target=run, daemon=True)
        thread.start()
        tm.register_async_task(task_id, thread)

        sched.task_ids.append(task_id)
        self._persist_schedules()

        # 触发 webhook 事件
        self._dispatch_webhook(WebhookEvent.GENERATION_STARTED, task_id, {"schedule_id": sched.id})

        return {"success": True, "task_id": task_id, "action": "generate"}

    def _do_export(self, sched: Schedule) -> Dict[str, Any]:
        """执行批量导出"""
        from .task_manager import get_task_manager
        import glob

        params = sched.params or {}
        task_ids = params.get("task_ids", [])
        export_format = params.get("format", "pptx")
        quality = params.get("quality", "high")

        tm = get_task_manager()
        exported = []
        errors = []

        for tid in task_ids:
            task = tm.get_task(tid)
            if not task or task.get("status") != "completed":
                errors.append({"task_id": tid, "error": "Task not found or not completed"})
                continue

            result = task.get("result", {})
            pptx_path = result.get("pptx_path")
            if pptx_path and os.path.exists(pptx_path):
                exported.append({"task_id": tid, "path": pptx_path, "format": export_format})

        sched.task_ids.extend([e["task_id"] for e in exported])
        self._persist_schedules()

        return {
            "success": True,
            "action": "export",
            "exported": exported,
            "errors": errors,
            "total": len(exported),
        }

    def _do_webhook(self, sched: Schedule) -> Dict[str, Any]:
        """触发 Webhook 事件"""
        params = sched.params or {}
        event_name = params.get("event", "schedule.triggered")
        task_id = params.get("task_id", sched.id)
        data = params.get("data", {})

        try:
            event = WebhookEvent(event_name)
        except ValueError:
            event = WebhookEvent.GENERATION_STARTED

        ws = get_webhook_service()
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(ws.dispatch(event, task_id, {**data, "schedule_id": sched.id}))
        finally:
            loop.close()

        return {"success": True, "action": "webhook", "event": event_name}

    def _do_email_delivery(self, sched: Schedule) -> Dict[str, Any]:
        """执行邮件发送"""
        from .task_manager import get_task_manager

        params = sched.params or {}
        email_config = params.get("email", {})
        task_id = params.get("task_id")

        # 获取 PPT 任务的 PPTX 路径
        pptx_path = None
        if task_id:
            tm = get_task_manager()
            task = tm.get_task(task_id)
            if task and task.get("status") == "completed":
                result = task.get("result", {})
                pptx_path = result.get("pptx_path")

        return self._send_email(
            to_email=email_config.get("to_email"),
            to_name=email_config.get("to_name"),
            subject=email_config.get("subject", "Your PPT is ready"),
            body_html=email_config.get("body_html", ""),
            body_text=email_config.get("body_text"),
            pptx_path=pptx_path,
            smtp_host=email_config.get("smtp_host") or os.getenv("SMTP_HOST"),
            smtp_port=email_config.get("smtp_port") or int(os.getenv("SMTP_PORT", "587")),
            smtp_user=email_config.get("smtp_user") or os.getenv("SMTP_USER"),
            smtp_password=email_config.get("smtp_password") or os.getenv("SMTP_PASSWORD"),
            from_email=email_config.get("from_email") or os.getenv("SMTP_FROM_EMAIL"),
            from_name=email_config.get("from_name") or os.getenv("SMTP_FROM_NAME", "RabAiMind"),
        )

    def _dispatch_webhook(self, event: WebhookEvent, task_id: str, data: Dict[str, Any]):
        """分发 Webhook 事件（异步）"""
        ws = get_webhook_service()
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(ws.dispatch(event, task_id, data))
        except Exception as e:
            logger.warning(f"Webhook dispatch failed: {e}")
        finally:
            loop.close()

    # ── Email Sending ────────────────────────────────────────────────────────

    def _send_email(
        self,
        to_email: str,
        to_name: Optional[str] = None,
        subject: str = "",
        body_html: str = "",
        body_text: Optional[str] = None,
        pptx_path: Optional[str] = None,
        smtp_host: Optional[str] = None,
        smtp_port: int = 587,
        smtp_user: Optional[str] = None,
        smtp_password: Optional[str] = None,
        from_email: Optional[str] = None,
        from_name: str = "RabAiMind",
    ) -> Dict[str, Any]:
        """发送邮件"""
        if not smtp_host or not smtp_user or not smtp_password:
            return {"success": False, "error": "SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASSWORD env vars."}

        if not to_email:
            return {"success": False, "error": "No recipient email"}

        try:
            msg = MIMEMultipart("mixed")
            msg["Subject"] = subject
            msg["From"] = f"{from_name} <{from_email or smtp_user}>"
            msg["To"] = to_email
            if to_name:
                msg["To"] = f"{to_name} <{to_email}>"

            # 正文
            body_container = MIMEMultipart("alternative")
            if body_text:
                body_container.attach(MIMEText(body_text, "plain", "utf-8"))
            body_container.attach(MIMEText(body_html, "html", "utf-8"))
            msg.attach(body_container)

            # 附件：PPTX
            if pptx_path and os.path.exists(pptx_path):
                from email.mime.base import MIMEBase
                from email import encoders

                with open(pptx_path, "rb") as f:
                    part = MIMEBase("application", "octet-stream")
                    part.set_payload(f.read())
                encoders.encode_base64(part)
                filename = os.path.basename(pptx_path)
                part.add_header("Content-Disposition", f"attachment; filename={filename}")
                msg.attach(part)

            # 发送
            with smtplib.SMTP(smtp_host, smtp_port, timeout=30) as server:
                server.ehlo()
                server.starttls()
                server.login(smtp_user, smtp_password)
                server.sendmail(from_email or smtp_user, [to_email], msg.as_string())

            logger.info(f"邮件发送成功: to={to_email} subject={subject}")
            return {"success": True, "to": to_email, "subject": subject}

        except Exception as e:
            logger.error(f"邮件发送失败: {e}")
            return {"success": False, "error": str(e)}

    # ── Scheduled Emails CRUD ───────────────────────────────────────────────

    def create_scheduled_email(
        self,
        schedule_id: Optional[str] = None,
        task_id: Optional[str] = None,
        to_email: str = "",
        to_name: Optional[str] = None,
        subject: str = "",
        body_html: str = "",
        body_text: Optional[str] = None,
        smtp_host: Optional[str] = None,
        smtp_port: Optional[int] = None,
        smtp_user: Optional[str] = None,
        smtp_password: Optional[str] = None,
        from_email: Optional[str] = None,
        from_name: Optional[str] = None,
    ) -> ScheduledEmail:
        """创建邮件投递配置"""
        eid = self._generate_id()
        email = ScheduledEmail(
            id=eid,
            schedule_id=schedule_id,
            task_id=task_id,
            to_email=to_email,
            to_name=to_name,
            subject=subject,
            body_html=body_html,
            body_text=body_text,
            smtp_host=smtp_host,
            smtp_port=smtp_port,
            smtp_user=smtp_user,
            smtp_password=smtp_password,
            smtp_from_email=from_email,
            smtp_from_name=from_name,
        )
        self._emails[eid] = email
        self._persist_emails()
        logger.info(f"创建邮件投递配置: id={eid} to={to_email}")
        return email

    def get_scheduled_email(self, email_id: str) -> Optional[ScheduledEmail]:
        return self._emails.get(email_id)

    def list_scheduled_emails(self, schedule_id: Optional[str] = None) -> List[ScheduledEmail]:
        results = list(self._emails.values())
        if schedule_id:
            results = [e for e in results if e.schedule_id == schedule_id]
        return sorted(results, key=lambda e: e.created_at, reverse=True)

    def delete_scheduled_email(self, email_id: str) -> bool:
        if email_id in self._emails:
            del self._emails[email_id]
            self._persist_emails()
            return True
        return False

    def send_test_email(self, email_config: Dict[str, Any]) -> Dict[str, Any]:
        """发送测试邮件"""
        return self._send_email(
            to_email=email_config.get("to_email", ""),
            to_name=email_config.get("to_name"),
            subject=email_config.get("subject", "Test Email from RabAiMind"),
            body_html=email_config.get("body_html", "<p>This is a test email.</p>"),
            body_text=email_config.get("body_text", "This is a test email."),
            smtp_host=email_config.get("smtp_host") or os.getenv("SMTP_HOST"),
            smtp_port=int(email_config.get("smtp_port") or os.getenv("SMTP_PORT", "587")),
            smtp_user=email_config.get("smtp_user") or os.getenv("SMTP_USER"),
            smtp_password=email_config.get("smtp_password") or os.getenv("SMTP_PASSWORD"),
            from_email=email_config.get("from_email") or os.getenv("SMTP_FROM_EMAIL"),
            from_name=email_config.get("from_name") or os.getenv("SMTP_FROM_NAME", "RabAiMind"),
        )


# ── Global Singleton ───────────────────────────────────────────────────────────

_scheduler_service: Optional[SchedulerService] = None


def get_scheduler_service() -> SchedulerService:
    global _scheduler_service
    if _scheduler_service is None:
        _scheduler_service = SchedulerService()
    return _scheduler_service
