# -*- coding: utf-8 -*-
"""
任务管理器

作者: Claude
日期: 2026-03-17
"""

import time
import json
import threading
import asyncio
from typing import Dict, Any, Optional
from datetime import datetime
import os
from pathlib import Path

from ..utils import generate_task_id, get_timestamp, ensure_dir
from ..config import settings


class TaskManager:
    """任务管理器 - 管理PPT生成任务"""

    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        self.tasks: Dict[str, Dict] = {}
        self._task_lock = threading.Lock()
        self._async_tasks: Dict[str, asyncio.Task] = {}  # 保存异步任务引用
        self._async_tasks_lock = threading.Lock()  # 保护_async_tasks的线程锁
        self._cleanup_counter: int = 0  # 懒清理计数器
        self._cleanup_interval: int = 10  # 每10次操作清理一次
        self._max_task_age_minutes: int = 30  # 任务最大存活时间(分钟)
        ensure_dir(settings.OUTPUT_DIR)

    def create_task(
        self,
        user_request: str,
        slide_count: int = 10,
        scene: str = "business",
        style: str = "professional",
        template: str = "default",
        theme_color: str = "#165DFF"
    ) -> str:
        """创建新任务"""
        task_id = generate_task_id()

        task = {
            "task_id": task_id,
            "user_request": user_request,
            "slide_count": slide_count,
            "scene": scene,
            "style": style,
            "template": template,
            "theme_color": theme_color,
            "status": "pending",
            "progress": 0,
            "current_step": "初始化",
            "created_at": get_timestamp(),
            "updated_at": get_timestamp(),
            "result": None,
            "error": None
        }

        with self._task_lock:
            self.tasks[task_id] = task
            # 懒清理：每N次操作清理一次过期任务
            self._cleanup_counter += 1
            if self._cleanup_counter >= self._cleanup_interval:
                self._cleanup_counter = 0
                self._lazy_cleanup_unlocked()
        return task_id

    def get_task(self, task_id: str) -> Optional[Dict]:
        """获取任务"""
        return self.tasks.get(task_id)

    def update_progress(
        self,
        task_id: str,
        progress: int,
        current_step: str,
        status: str = "processing"
    ) -> None:
        """更新任务进度"""
        with self._task_lock:
            if task_id in self.tasks:
                self.tasks[task_id]["progress"] = progress
                self.tasks[task_id]["current_step"] = current_step
                self.tasks[task_id]["status"] = status
                self.tasks[task_id]["updated_at"] = get_timestamp()

    def complete_task(
        self,
        task_id: str,
        pptx_path: str,
        slide_count: int,
        file_size: int = 0,
        compression_ratio: float = 0.0
    ) -> None:
        """完成任务"""
        with self._task_lock:
            if task_id in self.tasks:
                file_path = Path(pptx_path)
                actual_size = file_path.stat().st_size if file_path.exists() else file_size

                self.tasks[task_id].update({
                    "status": "completed",
                    "progress": 100,
                    "current_step": "完成",
                    "updated_at": get_timestamp(),
                    "result": {
                        "pptx_path": pptx_path,
                        "slide_count": slide_count,
                        "file_size": actual_size,
                        "compression_ratio": compression_ratio,
                        "compatibility": {
                            "wps": True,
                            "office": True,
                            "mobile": True
                        }
                    }
                })

    def fail_task(self, task_id: str, error_code: str, error_message: str) -> None:
        """任务失败"""
        import logging
        logger = logging.getLogger(__name__)
        with self._task_lock:
            if task_id in self.tasks:
                self.tasks[task_id].update({
                    "status": "failed",
                    "updated_at": get_timestamp(),
                    "error": {
                        "code": error_code,
                        "message": error_message
                    }
                })
                logger.warning(f"任务 {task_id} 失败: [{error_code}] {error_message}")
            else:
                logger.warning(f"任务 {task_id} 不存在，无法标记为失败")

    def register_async_task(self, task_id: str, async_task: asyncio.Task) -> None:
        """注册异步任务引用（线程安全）"""
        with self._async_tasks_lock:
            self._async_tasks[task_id] = async_task

    def cancel_async_task(self, task_id: str) -> bool:
        """取消异步任务（线程安全）"""
        with self._async_tasks_lock:
            if task_id in self._async_tasks:
                async_task = self._async_tasks[task_id]
                if not async_task.done():
                    async_task.cancel()
                # 无论是否取消成功，都清理引用防止内存泄漏
                del self._async_tasks[task_id]
                return True
            return False

    def _cleanup_finished_async_tasks(self) -> None:
        """清理已完成的异步任务引用，防止内存泄漏（线程安全）"""
        with self._async_tasks_lock:
            finished = [tid for tid, task in self._async_tasks.items() if task.done()]
            for tid in finished:
                del self._async_tasks[tid]

    def cancel_task(self, task_id: str) -> bool:
        """取消任务"""
        with self._task_lock:
            if task_id in self.tasks:
                task = self.tasks[task_id]
                if task["status"] in ["pending", "processing"]:
                    task["status"] = "cancelled"
                    task["updated_at"] = get_timestamp()
                    return True
        return False

    def cleanup_old_tasks(self, max_age_hours: int = 24) -> int:
        """清理过期任务，防止OOM"""
        import time
        current_time = time.time()
        max_age_seconds = max_age_hours * 3600
        removed = 0

        with self._task_lock:
            tasks_to_remove = []
            for task_id, task in self.tasks.items():
                status = task.get("status", "")
                updated_at = task.get("updated_at", "")

                # 只清理已完成/失败/取消的任务
                if status in ["completed", "failed", "cancelled"]:
                    # 简单时间检查
                    if "T" in updated_at:
                        # ISO格式时间
                        from datetime import datetime
                        try:
                            task_time = datetime.fromisoformat(updated_at.replace("Z", "+00:00"))
                            age_hours = (datetime.now() - task_time.replace(tzinfo=None)).total_seconds() / 3600
                            if age_hours > max_age_hours:
                                tasks_to_remove.append(task_id)
                        except Exception:
                            pass

            for task_id in tasks_to_remove:
                del self.tasks[task_id]
                removed += 1

        # 清理对应的异步任务引用（需要单独加锁）
        with self._async_tasks_lock:
            for task_id in tasks_to_remove:
                if task_id in self._async_tasks:
                    del self._async_tasks[task_id]

        # 清理已完成的异步任务引用
        self._cleanup_finished_async_tasks()

        return removed

    def _lazy_cleanup_unlocked(self) -> None:
        """懒清理：已持有锁时调用，清理超过30分钟的已完成任务"""
        import logging
        logger = logging.getLogger(__name__)
        from datetime import datetime

        max_age_minutes = self._max_task_age_minutes
        tasks_to_remove = []

        for task_id, task in self.tasks.items():
            status = task.get("status", "")
            updated_at = task.get("updated_at", "")

            if status in ["completed", "failed", "cancelled"]:
                if "T" in updated_at:
                    try:
                        task_time = datetime.fromisoformat(updated_at.replace("Z", "+00:00"))
                        age_minutes = (datetime.now() - task_time.replace(tzinfo=None)).total_seconds() / 60
                        if age_minutes > max_age_minutes:
                            tasks_to_remove.append(task_id)
                    except Exception:
                        pass

        for task_id in tasks_to_remove:
            del self.tasks[task_id]

        if tasks_to_remove:
            logger.info(f"自动清理 {len(tasks_to_remove)} 个过期任务")


# 全局实例
_task_manager: TaskManager = None
_manager_lock = threading.Lock()  # 保护单例创建


def get_task_manager() -> TaskManager:
    """获取任务管理器实例（线程安全）"""
    global _task_manager
    if _task_manager is None:
        with _manager_lock:
            # 双重检查
            if _task_manager is None:
                _task_manager = TaskManager()
    return _task_manager
