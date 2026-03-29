# -*- coding: utf-8 -*-
"""
任务管理器

作者: Claude
日期: 2026-03-17
"""

import time
import json
import logging
import threading
import asyncio
from typing import Dict, Any, Optional
from datetime import datetime
import os
from pathlib import Path

from ..utils import generate_task_id, get_timestamp, ensure_dir
from ..config import settings
from .history_sync_service import get_history_sync_service, HistorySyncService

logger = logging.getLogger(__name__)


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
        self._sync_service: HistorySyncService = get_history_sync_service()
        self._sync_initialized: bool = False  # 是否已完成首次同步
        ensure_dir(settings.OUTPUT_DIR)

        # 启动时尝试从云端拉取历史记录
        self._try_cloud_restore()

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

    def get_history(self, status_filter: Optional[str] = None) -> Dict[str, Dict]:
        """
        获取历史任务列表（包含云端同步的历史）
        
        Args:
            status_filter: 可选，筛选状态 (pending/processing/completed/failed/cancelled)
            
        Returns:
            {task_id: task_data}
        """
        with self._task_lock:
            if status_filter:
                return {
                    tid: task
                    for tid, task in self.tasks.items()
                    if task.get("status") == status_filter
                }
            return dict(self.tasks)

    def force_sync_all(self) -> int:
        """
        强制同步所有当前任务到云端
        
        Returns:
            成功同步的任务数
        """
        count = 0
        with self._task_lock:
            task_ids = list(self.tasks.keys())
        
        for task_id in task_ids:
            with self._task_lock:
                task = self.tasks.get(task_id)
            if task:
                if self._sync_service.push_task(task_id, task):
                    count += 1
        
        return count

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
        compression_ratio: float = 0.0,
        quality: str = "standard",
        output_format: str = "pptx"
    ) -> None:
        """完成任务，并同步到云端"""
        task_copy = None
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
                        "quality": quality,
                        "output_format": output_format,
                        "compatibility": {
                            "wps": True,
                            "office": True,
                            "mobile": True
                        }
                    }
                })
                # 保存一份用于云端推送（避免锁竞争）
                task_copy = dict(self.tasks[task_id])

        # 云端同步（在锁外执行，避免阻塞）
        if task_copy:
            self._sync_service.push_task(task_id, task_copy)

    def fail_task(self, task_id: str, error_code: str, error_message: str) -> None:
        """任务失败，并同步到云端"""
        task_copy = None
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
                task_copy = dict(self.tasks[task_id])
            else:
                logger.warning(f"任务 {task_id} 不存在，无法标记为失败")

        # 云端同步
        if task_copy:
            self._sync_service.push_task(task_id, task_copy)

    def register_async_task(self, task_id: str, async_task: asyncio.Task) -> None:
        """注册异步任务引用（线程安全）"""
        with self._async_tasks_lock:
            self._async_tasks[task_id] = async_task

    def cancel_async_task(self, task_id: str) -> bool:
        """取消异步任务（线程安全）
        
        注意：此方法只发起取消。任务的 CancelledError 传播和状态更新由
        run_task() 中的 CancelledError 处理器完成。
        """
        with self._async_tasks_lock:
            if task_id not in self._async_tasks:
                return False
            async_task = self._async_tasks[task_id]
            if async_task.done():
                del self._async_tasks[task_id]
                return True
            # 发起取消，CancelledError 会在 run_task 中被捕获并处理
            async_task.cancel()
            return True

    async def cancel_async_task_and_wait(self, task_id: str, timeout: float = 5.0) -> bool:
        """异步取消并等待任务结束（用于需要确保任务真正停止的场景）"""
        with self._async_tasks_lock:
            if task_id not in self._async_tasks:
                return False
            async_task = self._async_tasks[task_id]
            if async_task.done():
                del self._async_tasks[task_id]
                return True
            async_task.cancel()

        # 等待任务真正结束（带超时保护）
        try:
            await asyncio.wait_for(asyncio.shield(async_task), timeout)
        except (asyncio.CancelledError, asyncio.TimeoutError):
            pass
        except Exception:
            pass

        # 清理引用
        with self._async_tasks_lock:
            if task_id in self._async_tasks and self._async_tasks[task_id].done():
                del self._async_tasks[task_id]
        return True

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

    def _try_cloud_restore(self) -> None:
        """
        启动时从云端恢复历史任务
        
        流程:
        1. 从 OSS 拉取远程任务列表
        2. 与本地任务合并（last-write-wins）
        3. 仅恢复非过期任务（completed/failed 在 max_task_age_minutes 内）
        """
        try:
            remote_tasks = self._sync_service.pull_all_tasks()
            if not remote_tasks:
                logger.info("[TaskManager] 云端无历史任务")
                return

            # 过滤：只恢复未过期的已完成/失败任务
            current_time = datetime.now()
            valid_remote = {}
            for task_id, task in remote_tasks.items():
                status = task.get("status", "")
                updated_at = task.get("updated_at", "")
                
                # 只恢复有结果的任务（已完成/失败）
                if status not in ["completed", "failed"]:
                    continue
                
                # 检查是否过期
                if updated_at and "T" in updated_at:
                    try:
                        task_time = datetime.fromisoformat(updated_at.replace("Z", "+00:00"))
                        age_minutes = (current_time - task_time.replace(tzinfo=None)).total_seconds() / 60
                        if age_minutes > self._max_task_age_minutes:
                            continue  # 跳过过期任务
                    except Exception:
                        pass
                
                valid_remote[task_id] = task

            with self._task_lock:
                # 与本地合并
                merged = self._sync_service.resolve_and_merge(self.tasks, valid_remote)
                self.tasks = merged

            logger.info(f"[TaskManager] 从云端恢复 {len(valid_remote)} 个有效任务，"
                        f"合并后共 {len(self.tasks)} 个任务")
            self._sync_initialized = True

        except Exception as e:
            logger.warning(f"[TaskManager] 云端恢复失败，使用本地状态: {e}")

    def _lazy_cleanup_unlocked(self) -> None:
        """懒清理：已持有锁时调用，清理超过30分钟的已完成任务"""
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
