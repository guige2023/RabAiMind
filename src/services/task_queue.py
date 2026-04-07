# -*- coding: utf-8 -*-
"""
Task Queue Module - Task progress and queue management

This module handles task progress tracking, async task management,
and cancellation. Extracted from task_manager.py to improve code organization.

Author: Claude
Date: 2026-04-07
"""

import time
import logging
import threading
import asyncio
from typing import Dict, Any, Optional

from ..utils import get_timestamp
from ..constants import (
    THREAD_JOIN_TIMEOUT,
    CANCEL_TASK_TIMEOUT,
    BACKGROUND_IMAGE_TIMEOUT,
)
from .history_sync_service import get_history_sync_service
from .advanced_analytics_service import get_advanced_analytics_service

logger = logging.getLogger(__name__)


class TaskQueue:
    """Task queue and progress management.

    This class is responsible for:
    - Updating task progress
    - Managing async tasks
    - Task cancellation
    - Cloud sync on completion/failure
    """

    def __init__(self, task_store=None):
        """Initialize TaskQueue.

        Args:
            task_store: Reference to TaskStore for accessing tasks.
        """
        self._task_store = task_store
        self._async_tasks: Dict[str, Any] = {}
        self._async_tasks_lock = threading.Lock()
        self._cancel_events: Dict[str, threading.Event] = {}
        self._cancel_events_lock = threading.Lock()
        self._sync_service = get_history_sync_service()

    def set_task_store(self, task_store) -> None:
        """Set the task store reference."""
        self._task_store = task_store

    def update_progress(
        self,
        task_id: str,
        progress: int,
        current_step: str,
        status: str = "processing"
    ) -> None:
        """Update task progress and status.

        Args:
            task_id: The unique identifier of the task.
            progress: Progress percentage (0-100).
            current_step: Human-readable description of current step.
            status: Task status.
        """
        if self._task_store is None:
            return

        task = self._task_store.get_task(task_id)
        if task is None:
            return

        with self._task_store._task_lock:
            if task_id in self._task_store.tasks:
                self._task_store.tasks[task_id]["progress"] = progress
                self._task_store.tasks[task_id]["current_step"] = current_step
                self._task_store.tasks[task_id]["status"] = status
                self._task_store.tasks[task_id]["updated_at"] = get_timestamp()

    def complete_task(
        self,
        task_id: str,
        pptx_path: str,
        slide_count: int,
        file_size: int = 0,
        compression_ratio: float = 0.0,
        quality: str = "standard",
        output_format: str = "pptx",
        slides_summary: Optional[list] = None,
        svg_paths: Optional[list] = None
    ) -> None:
        """Mark a task as completed.

        Args:
            task_id: The unique identifier of the task.
            pptx_path: Absolute path to the generated PPTX file.
            slide_count: Number of slides in the presentation.
            file_size: Size of the generated file in bytes.
            compression_ratio: Compression ratio achieved.
            quality: Output quality level.
            output_format: File format.
            slides_summary: Optional list of slide summaries.
            svg_paths: Optional list of paths to intermediate SVG files.
        """
        if self._task_store is None:
            return

        task = self._task_store.get_task(task_id)
        if task is None:
            return

        task_copy = None
        with self._task_store._task_lock:
            if task_id in self._task_store.tasks:
                from pathlib import Path
                file_path = Path(pptx_path)
                actual_size = file_path.stat().st_size if file_path.exists() else file_size

                self._task_store.tasks[task_id].update({
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
                        },
                        "slides_summary": slides_summary or [],
                        "svg_paths": svg_paths or [],
                        "scene": self._task_store.tasks[task_id].get("scene", "business"),
                        "style": self._task_store.tasks[task_id].get("style", "professional"),
                    }
                })
                task_copy = dict(self._task_store.tasks[task_id])

        # Cloud sync outside lock
        if task_copy:
            self._sync_service.push_task(task_id, task_copy)

            # Track in analytics
            try:
                get_advanced_analytics_service().update_task_status(task_id, "completed")
            except Exception:
                pass

    def fail_task(self, task_id: str, error_code: str, error_message: str) -> None:
        """Mark a task as failed.

        Args:
            task_id: The unique identifier of the task.
            error_code: Short machine-readable error code.
            error_message: Human-readable error description.
        """
        if self._task_store is None:
            return

        task = self._task_store.get_task(task_id)
        if task is None:
            return

        task_copy = None
        with self._task_store._task_lock:
            if task_id in self._task_store.tasks:
                self._task_store.tasks[task_id].update({
                    "status": "failed",
                    "updated_at": get_timestamp(),
                    "error": {
                        "code": error_code,
                        "message": error_message
                    }
                })
                logger.warning(f"Task {task_id} failed: [{error_code}] {error_message}")
                task_copy = dict(self._task_store.tasks[task_id])
            else:
                logger.warning(f"Task {task_id} not found, cannot mark as failed")

        if task_copy:
            self._sync_service.push_task(task_id, task_copy)

            try:
                get_advanced_analytics_service().update_task_status(task_id, "failed")
            except Exception:
                pass

    def cancel_task(self, task_id: str) -> bool:
        """Cancel a task.

        Args:
            task_id: The unique identifier of the task.

        Returns:
            True if cancelled, False if not found or already cancelled.
        """
        if self._task_store is None:
            return False

        with self._task_store._task_lock:
            if task_id not in self._task_store.tasks:
                return False

            task = self._task_store.tasks[task_id]
            status = task.get("status", "pending")

            if status in ("cancelled", "completed", "failed"):
                return False

            task["status"] = "cancelled"
            task["updated_at"] = get_timestamp()

        # Signal cancellation
        cancel_event = self.get_cancel_event(task_id)
        if cancel_event:
            cancel_event.set()

        return True

    def get_cancel_event(self, task_id: str) -> Optional[threading.Event]:
        """Get or create a cancel event for a task.

        Args:
            task_id: The unique identifier of the task.

        Returns:
            threading.Event object for the task.
        """
        with self._cancel_events_lock:
            if task_id not in self._cancel_events:
                self._cancel_events[task_id] = threading.Event()
            return self._cancel_events[task_id]

    def clear_cancel_event(self, task_id: str) -> None:
        """Clear and remove a cancel event for a task.

        Args:
            task_id: The unique identifier of the task.
        """
        with self._cancel_events_lock:
            if task_id in self._cancel_events:
                del self._cancel_events[task_id]

    def register_async_task(self, task_id: str, async_task: Any) -> None:
        """Register an async task reference.

        Args:
            task_id: The unique identifier of the task.
            async_task: The async task reference.
        """
        with self._async_tasks_lock:
            self._async_tasks[task_id] = async_task

    def unregister_async_task(self, task_id: str) -> None:
        """Unregister an async task reference.

        Args:
            task_id: The unique identifier of the task.
        """
        with self._async_tasks_lock:
            if task_id in self._async_tasks:
                del self._async_tasks[task_id]

    def get_async_task(self, task_id: str) -> Optional[Any]:
        """Get an async task reference.

        Args:
            task_id: The unique identifier of the task.

        Returns:
            The async task reference or None.
        """
        with self._async_tasks_lock:
            return self._async_tasks.get(task_id)

    async def cancel_async_task_and_wait(self, task_id: str, timeout: float = CANCEL_TASK_TIMEOUT) -> bool:
        """Cancel an async task and wait for it to complete.

        Args:
            task_id: The unique identifier of the task.
            timeout: Maximum time to wait in seconds.

        Returns:
            True if cancelled successfully.
        """
        cancel_event = self.get_cancel_event(task_id)
        if cancel_event:
            cancel_event.set()

        async_task = self.get_async_task(task_id)
        if async_task is None:
            return True

        try:
            if asyncio.isfuture(async_task):
                await asyncio.wait_for(async_task, timeout=timeout)
            elif asyncio.istask(async_task):
                try:
                    await asyncio.wait_for(async_task, timeout=timeout)
                except asyncio.TimeoutError:
                    async_task.cancel()
            return True
        except (asyncio.CancelledError, asyncio.TimeoutError):
            return True
        except Exception as e:
            logger.warning(f"Error cancelling async task {task_id}: {e}")
            return False

    def is_cancelled(self, task_id: str) -> bool:
        """Check if a task has been cancelled.

        Args:
            task_id: The unique identifier of the task.

        Returns:
            True if cancelled.
        """
        cancel_event = self.get_cancel_event(task_id)
        return cancel_event.is_set() if cancel_event else False

    def wait_for_cancellation(self, task_id: str, timeout: float = CANCEL_TASK_TIMEOUT) -> bool:
        """Wait for a task to be cancelled.

        Args:
            task_id: The unique identifier of the task.
            timeout: Maximum time to wait in seconds.

        Returns:
            True if cancelled within timeout.
        """
        cancel_event = self.get_cancel_event(task_id)
        if cancel_event:
            return cancel_event.wait(timeout=timeout)
        return True