# -*- coding: utf-8 -*-
"""
任务管理器

作者: Claude
日期: 2026-03-17
"""

import time
import json
import threading
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


# 全局实例
_task_manager: TaskManager = None


def get_task_manager() -> TaskManager:
    """获取任务管理器实例"""
    global _task_manager
    if _task_manager is None:
        _task_manager = TaskManager()
    return _task_manager
