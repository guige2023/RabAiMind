"""
Task Manager - Main entry point for task management

This module provides the unified TaskManager interface that combines
TaskStore, TaskQueue, and TaskVersioning functionality.

Author: Claude
Date: 2026-04-07 (refactored)
"""

import logging
import threading
import time
import uuid
from typing import Any

from ..constants import (
    CONTENT_LAYOUT_MIN_LENGTH,
    CONTENT_MAX_LENGTH,
    CONTENT_MIN_LENGTH,
    LANGUAGE_DETECTION_CONFIDENCE,
    MAX_ACTION_LOG,
    MAX_ACTION_TIMELINE,
    MAX_CHECKPOINTS,
    MAX_SLIDE_CHANGES,
    MAX_UNDO_STACK,
    SLIDE_COUNT_MAX,
    SLIDE_COUNT_MIN,
    TITLE_MAX_LENGTH,
    TITLE_MIN_LENGTH,
    TITLE_TRUNCATE_LENGTH,
)
from ..utils import get_timestamp
from .task_queue import TaskQueue
from .task_store import TaskStore
from .task_versioning import TaskVersioning

logger = logging.getLogger(__name__)


class TaskManager:
    """Task Manager - Unified interface for task management.

    This class combines TaskStore, TaskQueue, and TaskVersioning to provide
    a complete task management solution. It delegates to the appropriate
    component while maintaining backward compatibility.
    """

    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True

        # Initialize components
        self._task_store = TaskStore()
        self._task_queue = TaskQueue(self._task_store)
        self._task_versioning = TaskVersioning(self._task_store)

        # Backward compatibility - expose internal state
        self.tasks = self._task_store.tasks
        self._task_lock = self._task_store._task_lock
        self._async_tasks = self._task_queue._async_tasks
        self._async_tasks_lock = self._task_queue._async_tasks_lock
        self._cancel_events = self._task_queue._cancel_events
        self._cancel_events_lock = self._task_queue._cancel_events_lock

    # ========== Delegated TaskStore Methods ==========

    def create_task(
        self,
        user_request: str,
        slide_count: int = 10,
        scene: str = "business",
        style: str = "professional",
        template: str = "default",
        theme_color: str = "#165DFF",
        layout_mode: str = "auto",
        color_scheme: str = "#165DFF",
    ) -> str:
        """Create a new PPT generation task."""
        return self._task_store.create_task(
            user_request=user_request,
            slide_count=slide_count,
            scene=scene,
            style=style,
            template=template,
            theme_color=theme_color,
            layout_mode=layout_mode,
            color_scheme=color_scheme,
        )

    def get_task(self, task_id: str) -> dict | None:
        """Retrieve a task by its ID."""
        return self._task_store.get_task(task_id)

    def get_history(self, status_filter: str | None = None) -> dict[str, dict]:
        """Get history of tasks, optionally filtered by status."""
        return self._task_store.get_history(status_filter)

    def force_sync_all(self) -> int:
        """Force sync all current tasks to cloud storage."""
        return self._task_store.force_sync_all()

    def save_outline(self, task_id: str, outline: dict) -> None:
        """Save presentation outline to a task."""
        self._task_store.save_outline(task_id, outline)

    def get_outline(self, task_id: str) -> dict | None:
        """Get outline for a task."""
        return self._task_store.get_outline(task_id)

    def update_task_params(self, task_id: str, params: dict) -> None:
        """Update task parameters."""
        self._task_store.update_task_params(task_id, params)

    def delete_task(self, task_id: str) -> bool:
        """Delete a task."""
        return self._task_store.delete_task(task_id)

    # ========== Delegated TaskQueue Methods ==========

    def update_progress(
        self,
        task_id: str,
        progress: int,
        current_step: str,
        status: str = "processing"
    ) -> None:
        """Update task progress and status."""
        self._task_queue.update_progress(task_id, progress, current_step, status)

    def complete_task(
        self,
        task_id: str,
        pptx_path: str,
        slide_count: int,
        file_size: int = 0,
        compression_ratio: float = 0.0,
        quality: str = "standard",
        output_format: str = "pptx",
        slides_summary: list[dict] | None = None,
        svg_paths: list[str] | None = None
    ) -> None:
        """Mark a task as completed with generated file information."""
        self._task_queue.complete_task(
            task_id=task_id,
            pptx_path=pptx_path,
            slide_count=slide_count,
            file_size=file_size,
            compression_ratio=compression_ratio,
            quality=quality,
            output_format=output_format,
            slides_summary=slides_summary,
            svg_paths=svg_paths,
        )
        # Auto-create initial version on completion
        self._task_versioning.create_version(task_id, "初始版本")

    def fail_task(self, task_id: str, error_code: str, error_message: str) -> None:
        """Mark a task as failed with error information."""
        self._task_queue.fail_task(task_id, error_code, error_message)

    def cancel_task(self, task_id: str) -> bool:
        """Cancel a task."""
        return self._task_queue.cancel_task(task_id)

    def get_cancel_event(self, task_id: str):
        """Get or create a cancel event for a task."""
        return self._task_queue.get_cancel_event(task_id)

    def clear_cancel_event(self, task_id: str) -> None:
        """Clear and remove a cancel event for a task."""
        self._task_queue.clear_cancel_event(task_id)

    def register_async_task(self, task_id: str, async_task: Any) -> None:
        """Register an async task reference."""
        self._task_queue.register_async_task(task_id, async_task)

    def unregister_async_task(self, task_id: str) -> None:
        """Unregister an async task reference."""
        self._task_queue.unregister_async_task(task_id)

    async def cancel_async_task_and_wait(self, task_id: str, timeout: float = 5.0) -> bool:
        """Cancel an async task and wait for it to complete."""
        return await self._task_queue.cancel_async_task_and_wait(task_id, timeout)

    def is_cancelled(self, task_id: str) -> bool:
        """Check if a task has been cancelled."""
        return self._task_queue.is_cancelled(task_id)

    def wait_for_cancellation(self, task_id: str, timeout: float = 5.0) -> bool:
        """Wait for a task to be cancelled."""
        return self._task_queue.wait_for_cancellation(task_id, timeout)

    # ========== Delegated TaskVersioning Methods ==========

    def create_version(self, task_id: str, version_name: str = None) -> dict:
        """Create a task snapshot version."""
        return self._task_versioning.create_version(task_id, version_name)

    def detect_significant_change(self, task_id: str, old_state: dict, new_state: dict) -> dict:
        """Detect if a significant change occurred."""
        return self._task_versioning.detect_significant_change(task_id, old_state, new_state)

    def auto_version_on_significant_change(self, task_id: str, auto_version_threshold: int = 3) -> dict:
        """Check and create auto-version if threshold reached."""
        return self._task_versioning.auto_version_on_significant_change(task_id, auto_version_threshold)

    def record_significant_change(self, task_id: str) -> dict:
        """Record a significant change occurrence."""
        return self._task_versioning.record_significant_change(task_id)

    def get_auto_version_status(self, task_id: str) -> dict:
        """Get auto-versioning status for a task."""
        return self._task_versioning.get_auto_version_status(task_id)

    def list_versions(self, task_id: str) -> list:
        """List all versions of a task."""
        return self._task_versioning.list_versions(task_id)

    def get_version(self, task_id: str, version_id: str) -> dict:
        """Get a specific version."""
        return self._task_versioning.get_version(task_id, version_id)

    def get_version_slide_svg(self, task_id: str, version_id: str, slide_index: int) -> dict:
        """Get SVG content for a specific slide in a version."""
        return self._task_versioning.get_version_slide_svg(task_id, version_id, slide_index)

    def rollback_version(self, task_id: str, version_id: str) -> dict:
        """Rollback to a specific version."""
        return self._task_versioning.rollback_version(task_id, version_id)

    def diff_versions(self, task_id: str, version_id_a: str, version_id_b: str) -> dict:
        """Compare two versions."""
        return self._task_versioning.diff_versions(task_id, version_id_a, version_id_b)

    def add_version_tag(self, task_id: str, version_id: str, tag: str) -> dict:
        """Add a tag to a version."""
        return self._task_versioning.add_version_tag(task_id, version_id, tag)

    def remove_version_tag(self, task_id: str, version_id: str, tag: str) -> dict:
        """Remove a tag from a version."""
        return self._task_versioning.remove_version_tag(task_id, version_id, tag)

    def get_version_tags(self, task_id: str) -> dict:
        """Get all version tags."""
        return self._task_versioning.get_version_tags(task_id)

    # ========== Action Log & Undo/Redo Methods ==========

    def log_action(self, task_id: str, action_type: str, description: str, undo_data: dict = None, branch_id: str = None) -> str:
        """Record user action to action log."""
        action_id = str(uuid.uuid4())[:8]
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                return action_id

            entry = {
                "action_id": action_id,
                "action_type": action_type,
                "description": description,
                "timestamp": get_timestamp(),
                "undo_data": undo_data,
                "branch_id": branch_id,
            }

            # Action log (max 100)
            if "action_log" not in task:
                task["action_log"] = []
            task["action_log"].append(entry)
            if len(task["action_log"]) > MAX_ACTION_LOG:
                task["action_log"] = task["action_log"][-MAX_ACTION_LOG:]

            # Action timeline (max 200)
            if "action_timeline" not in task:
                task["action_timeline"] = []
            task["action_timeline"].append(entry)
            if len(task["action_timeline"]) > MAX_ACTION_TIMELINE:
                task["action_timeline"] = task["action_timeline"][-MAX_ACTION_TIMELINE:]

            # Undo stack (max 100)
            if undo_data is not None:
                if "undo_stack" not in task:
                    task["undo_stack"] = []
                task["undo_stack"].append(entry)
                task["redo_stack"] = []
                if len(task["undo_stack"]) > MAX_UNDO_STACK:
                    task["undo_stack"] = task["undo_stack"][-MAX_UNDO_STACK:]

        return action_id

    def get_action_log(self, task_id: str, limit: int = 20) -> list:
        """Get action log."""
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                return []
            log = task.get("action_log", [])
            return log[-limit:] if limit > 0 else log

    def get_undo_stack(self, task_id: str) -> list:
        """Get undo stack."""
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                return []
            return task.get("undo_stack", [])

    def undo(self, task_id: str) -> dict:
        """Undo the last operation."""
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                return {"success": False, "message": "Task not found"}

            undo_stack = task.get("undo_stack", [])
            if not undo_stack:
                return {"success": False, "message": "无可撤销的操作"}

            action = undo_stack.pop()
            action_type = action.get("action_type")
            undo_data = action.get("undo_data", {})

            if action_type == "outline_edit":
                old_outline = undo_data.get("old_outline")
                if old_outline:
                    task["outline"] = old_outline
                    task["updated_at"] = get_timestamp()
            elif action_type == "slide_regenerate":
                old_svg_content = undo_data.get("old_svg_content")
                svg_path = undo_data.get("svg_path")
                if old_svg_content and svg_path:
                    import os
                    os.makedirs(os.path.dirname(svg_path), exist_ok=True)
                    with open(svg_path, 'w', encoding='utf-8') as f:
                        f.write(old_svg_content)
                    task["updated_at"] = get_timestamp()
            elif action_type == "rollback":
                rollback_data = undo_data.get("rollback_snapshot")
                if rollback_data:
                    task["result"] = rollback_data.get("result", {})
                    task["outline"] = rollback_data.get("outline", "")
                    task["updated_at"] = get_timestamp()
            elif action_type == "slide_image":
                old_image_path = undo_data.get("old_image_path")
                slide_index = undo_data.get("slide_index")
                if old_image_path and slide_index is not None:
                    if "result" not in task:
                        task["result"] = {}
                    svg_paths = task["result"].get("svg_paths", [])
                    if slide_index <= len(svg_paths):
                        svg_paths[slide_index - 1] = old_image_path
                        task["result"]["svg_paths"] = svg_paths
                    task["updated_at"] = get_timestamp()

            undo_log_entry = {
                "action_id": str(uuid.uuid4())[:8],
                "action_type": "undo",
                "description": f"撤销: {action.get('description', '')}",
                "timestamp": get_timestamp(),
                "undo_data": None,
            }
            if "action_log" not in task:
                task["action_log"] = []
            task["action_log"].append(undo_log_entry)
            if "action_timeline" not in task:
                task["action_timeline"] = []
            task["action_timeline"].append(undo_log_entry)
            if len(task["action_timeline"]) > MAX_ACTION_TIMELINE:
                task["action_timeline"] = task["action_timeline"][-MAX_ACTION_TIMELINE:]

            return {
                "success": True,
                "undone_action": action.get("description", ""),
                "action_type": action_type,
            }

    def redo(self, task_id: str) -> dict:
        """Redo the last undone operation."""
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                return {"success": False, "message": "Task not found"}

            redo_stack = task.get("redo_stack", [])
            if not redo_stack:
                return {"success": False, "message": "无可重做的操作"}

            action = redo_stack.pop()
            undo_stack = task.get("undo_stack", [])
            undo_stack.append(action)
            task["undo_stack"] = undo_stack

            action_type = action.get("action_type")
            undo_data = action.get("undo_data", {})

            if action_type == "outline_edit":
                new_outline = undo_data.get("new_outline")
                if new_outline:
                    task["outline"] = new_outline
                    task["updated_at"] = get_timestamp()
            elif action_type == "slide_regenerate":
                task["updated_at"] = get_timestamp()
            elif action_type == "slide_image":
                new_image_path = undo_data.get("new_image_path")
                slide_index = undo_data.get("slide_index")
                if new_image_path and slide_index is not None:
                    if "result" not in task:
                        task["result"] = {}
                    svg_paths = task["result"].get("svg_paths", [])
                    if slide_index <= len(svg_paths):
                        svg_paths[slide_index - 1] = new_image_path
                        task["result"]["svg_paths"] = svg_paths
                    task["updated_at"] = get_timestamp()
            elif action_type == "rollback":
                rollback_data = undo_data.get("rollback_snapshot")
                if rollback_data:
                    task["result"] = rollback_data.get("result", {})
                    task["outline"] = rollback_data.get("outline", "")
                    task["updated_at"] = get_timestamp()

            redo_log_entry = {
                "action_id": str(uuid.uuid4())[:8],
                "action_type": "redo",
                "description": f"重做: {action.get('description', '')}",
                "timestamp": get_timestamp(),
                "undo_data": None,
            }
            if "action_log" not in task:
                task["action_log"] = []
            task["action_log"].append(redo_log_entry)
            if "action_timeline" not in task:
                task["action_timeline"] = []
            task["action_timeline"].append(redo_log_entry)
            if len(task["action_timeline"]) > MAX_ACTION_TIMELINE:
                task["action_timeline"] = task["action_timeline"][-MAX_ACTION_TIMELINE:]

            return {
                "success": True,
                "redone_action": action.get("description", ""),
                "action_type": action_type,
            }

    def get_redo_stack(self, task_id: str) -> list:
        """Get redo stack."""
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                return []
            return task.get("redo_stack", [])

    def get_action_timeline(self, task_id: str, limit: int = 100) -> list:
        """Get complete action timeline."""
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                return []
            timeline = task.get("action_timeline", [])
            return timeline[-limit:] if limit > 0 else timeline

    def undo_by_action_id(self, task_id: str, action_id: str, force: bool = False) -> dict:
        """Undo a specific action by ID."""
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                return {"success": False, "message": "Task not found"}

            undo_stack = task.get("undo_stack", [])
            target_index = None
            for i, entry in enumerate(undo_stack):
                if entry.get("action_id") == action_id:
                    target_index = i
                    break

            if target_index is None:
                return {"success": False, "message": f"未找到操作 {action_id}"}

            target_entry = undo_stack[target_index]

            if force:
                # Branch undo
                entries_to_redo = []
                for i in range(len(undo_stack) - 1, target_index - 1, -1):
                    entries_to_redo.append(undo_stack.pop())

                if "redo_stack" not in task:
                    task["redo_stack"] = []
                task["redo_stack"].extend(reversed(entries_to_redo))

                for entry in entries_to_redo:
                    self._execute_undo_entry(task, entry)

                branch_undo_entry = {
                    "action_id": str(uuid.uuid4())[:8],
                    "action_type": "branch_undo",
                    "description": f"分支撤销: {entries_to_redo[0].get('description', '')}",
                    "timestamp": get_timestamp(),
                    "undo_data": None,
                    "branch_id": f"branch_undo_{int(time.time() * 1000)}",
                }
                if "action_timeline" not in task:
                    task["action_timeline"] = []
                task["action_timeline"].append(branch_undo_entry)

                return {
                    "success": True,
                    "mode": "branch_undo",
                    "undone_action": entries_to_redo[0].get("description", ""),
                    "affected_actions": len(entries_to_redo),
                }
            else:
                # Selective undo
                undo_stack.pop(target_index)
                if "redo_stack" not in task:
                    task["redo_stack"] = []
                task["redo_stack"].append(target_entry)

                selective_undo_entry = {
                    "action_id": str(uuid.uuid4())[:8],
                    "action_type": "selective_undo",
                    "description": f"选择性撤销: {target_entry.get('description', '')}",
                    "timestamp": get_timestamp(),
                    "undo_data": {
                        "original_action_id": action_id,
                        "original_action_type": target_entry.get("action_type"),
                        "inverse_data": target_entry.get("undo_data"),
                    },
                    "branch_id": f"selective_undo_{int(time.time() * 1000)}",
                }
                if "action_timeline" not in task:
                    task["action_timeline"] = []
                task["action_timeline"].append(selective_undo_entry)

                return {
                    "success": True,
                    "mode": "selective_undo",
                    "undone_action": target_entry.get("description", ""),
                    "action_type": target_entry.get("action_type"),
                    "affected_actions": 1,
                    "warning": "选择性撤销仅移除操作记录，实际内容变更可能被后续操作覆盖",
                }

    def _execute_undo_entry(self, task: dict, entry: dict) -> None:
        """Execute a single undo entry."""
        action_type = entry.get("action_type")
        undo_data = entry.get("undo_data", {})

        if action_type == "outline_edit":
            old_outline = undo_data.get("old_outline")
            if old_outline:
                task["outline"] = old_outline
                task["updated_at"] = get_timestamp()
        elif action_type == "slide_regenerate":
            old_svg_content = undo_data.get("old_svg_content")
            svg_path = undo_data.get("svg_path")
            if old_svg_content and svg_path:
                import os
                os.makedirs(os.path.dirname(svg_path), exist_ok=True)
                with open(svg_path, 'w', encoding='utf-8') as f:
                    f.write(old_svg_content)
                task["updated_at"] = get_timestamp()
        elif action_type == "slide_image":
            old_image_path = undo_data.get("old_image_path")
            slide_index = undo_data.get("slide_index")
            if old_image_path and slide_index is not None:
                if "result" not in task:
                    task["result"] = {}
                svg_paths = task["result"].get("svg_paths", [])
                if slide_index <= len(svg_paths):
                    svg_paths[slide_index - 1] = old_image_path
                    task["result"]["svg_paths"] = svg_paths
                task["updated_at"] = get_timestamp()

    # ========== Checkpoint Methods ==========

    def create_checkpoint(self, task_id: str, name: str = None, checkpoint_type: str = "auto") -> dict:
        """Create a checkpoint (for autosave)."""
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                return {"success": False, "message": "Task not found"}

            checkpoint_id = f"cp_{int(time.time() * 1000)}"
            checkpoint = {
                "checkpoint_id": checkpoint_id,
                "name": name or "自动检查点",
                "type": checkpoint_type,
                "created_at": get_timestamp(),
                "outline": task.get("outline"),
                "result": task.get("result"),
                "params": task.get("params"),
                "action_count": len(task.get("action_timeline", [])),
            }

            if "checkpoints" not in task:
                task["checkpoints"] = []
            task["checkpoints"].append(checkpoint)

            if len(task["checkpoints"]) > MAX_CHECKPOINTS:
                task["checkpoints"] = task["checkpoints"][-MAX_CHECKPOINTS:]

            self._add_to_timeline(task, {
                "action_id": str(uuid.uuid4())[:8],
                "action_type": "checkpoint",
                "description": f"创建检查点: {checkpoint['name']}",
                "timestamp": get_timestamp(),
                "undo_data": None,
            })

            return {"success": True, "checkpoint_id": checkpoint_id, "checkpoint": checkpoint}

    def get_checkpoints(self, task_id: str, limit: int = 20) -> list:
        """Get checkpoint list."""
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                return []
            checkpoints = task.get("checkpoints", [])
            return checkpoints[-limit:] if limit > 0 else checkpoints

    def restore_checkpoint(self, task_id: str, checkpoint_id: str) -> dict:
        """Restore from a checkpoint."""
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                return {"success": False, "message": "Task not found"}

            checkpoints = task.get("checkpoints", [])
            target_cp = None
            for cp in checkpoints:
                if cp.get("checkpoint_id") == checkpoint_id:
                    target_cp = cp
                    break

            if not target_cp:
                return {"success": False, "message": f"检查点 {checkpoint_id} 不存在"}

            snapshot = {
                "outline": task.get("outline"),
                "result": task.get("result"),
                "params": task.get("params"),
            }

            task["outline"] = target_cp.get("outline")
            task["result"] = target_cp.get("result")
            task["params"] = target_cp.get("params")
            task["updated_at"] = get_timestamp()

            restore_entry = {
                "action_id": str(uuid.uuid4())[:8],
                "action_type": "checkpoint_restore",
                "description": f"从检查点恢复: {target_cp.get('name', checkpoint_id)}",
                "timestamp": get_timestamp(),
                "undo_data": {"rollback_snapshot": snapshot},
            }
            self._add_to_timeline(task, restore_entry)
            task["undo_stack"].append(restore_entry)
            task["redo_stack"] = []

            return {"success": True, "message": f"已从 {target_cp.get('name')} 恢复"}

    def _add_to_timeline(self, task: dict, entry: dict) -> None:
        """Add entry to timeline."""
        if "action_timeline" not in task:
            task["action_timeline"] = []
        task["action_timeline"].append(entry)
        if len(task["action_timeline"]) > MAX_ACTION_TIMELINE:
            task["action_timeline"] = task["action_timeline"][-MAX_ACTION_TIMELINE:]

    # ========== Collaborative Lock Methods ==========

    def acquire_collaborative_lock(self, task_id: str, user_id: str, slide_index: int = None) -> dict:
        """Acquire collaborative editing lock."""
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                return {"success": False, "message": "Task not found"}

            if "collaborative_locks" not in task:
                task["collaborative_locks"] = {}

            locks = task["collaborative_locks"]
            target = f"slide_{slide_index}" if slide_index is not None else "outline"

            if target in locks:
                existing = locks[target]
                if existing.get("user_id") != user_id:
                    return {
                        "success": False,
                        "message": f"{target} 已被用户 {existing.get('user_id')} 锁定",
                        "locked_by": existing.get("user_id"),
                        "locked_at": existing.get("locked_at"),
                    }

            locks[target] = {
                "user_id": user_id,
                "slide_index": slide_index,
                "locked_at": get_timestamp(),
            }
            return {"success": True, "locked": target, "user_id": user_id}

    def release_collaborative_lock(self, task_id: str, user_id: str, slide_index: int = None) -> dict:
        """Release collaborative editing lock."""
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                return {"success": False, "message": "Task not found"}

            locks = task.get("collaborative_locks", {})
            target = f"slide_{slide_index}" if slide_index is not None else "outline"

            if target in locks and locks[target].get("user_id") == user_id:
                del locks[target]
                return {"success": True, "released": target}
            return {"success": False, "message": "未找到锁或用户不匹配"}

    # ========== Additional Methods (keeping existing functionality) ==========

    def _lazy_cleanup_unlocked(self) -> None:
        """Lazy cleanup of expired tasks."""
        self._task_store._lazy_cleanup_unlocked()

    def _try_cloud_restore(self) -> None:
        """Attempt to restore tasks from cloud on startup."""
        self._task_store._try_cloud_restore()

    # ========== Language Detection ==========

    def detect_language(self, text: str) -> dict:
        """Detect language of text."""
        if not text or len(text.strip()) < 3:
            return {"locale": "en", "confidence": 0.0}

        chinese_chars = sum(1 for c in text if '\u4e00' <= c <= '\u9fff')
        total_chars = len(text.strip())

        if total_chars > 0:
            chinese_ratio = chinese_chars / total_chars
            if chinese_ratio > 0.3:
                return {"locale": "zh", "confidence": chinese_ratio}

        return {"locale": "en", "confidence": LANGUAGE_DETECTION_CONFIDENCE}

    # ========== A/B Testing ==========

    def create_ab_test(self, task_id: str, variant_count: int = 2) -> dict:
        """Create A/B test variants for a task."""
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                return {"success": False, "message": "Task not found"}

            test_id = f"ab_{int(time.time() * 1000)}"
            variants = []

            base_outline = task.get("outline", {})
            base_params = task.get("params", {})

            for i in range(variant_count):
                variant = {
                    "variant_id": f"{test_id}_v{i + 1}",
                    "name": f"Variant {i + 1}",
                    "outline": dict(base_outline),
                    "params": dict(base_params),
                    "metrics": {
                        "views": 0,
                        "click_count": 0,
                        "time_spent_ms": 0,
                    },
                }
                variants.append(variant)

            if "ab_tests" not in task:
                task["ab_tests"] = []
            task["ab_tests"].append({
                "test_id": test_id,
                "variants": variants,
                "created_at": get_timestamp(),
                "status": "active",
            })

            return {
                "success": True,
                "test_id": test_id,
                "variants": variants,
            }

    def record_ab_metrics(self, task_id: str, test_id: str, variant_id: str, metrics: dict) -> dict:
        """Record A/B test metrics."""
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                return {"success": False, "message": "Task not found"}

            ab_tests = task.get("ab_tests", [])
            for test in ab_tests:
                if test.get("test_id") == test_id:
                    for variant in test.get("variants", []):
                        if variant.get("variant_id") == variant_id:
                            for key, value in metrics.items():
                                if key in variant.get("metrics", {}):
                                    variant["metrics"][key] += value
                            return {"success": True}

            return {"success": False, "message": "Test or variant not found"}

    def get_ab_test_results(self, task_id: str, test_id: str) -> dict:
        """Get A/B test results."""
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                return {"success": False, "message": "Task not found"}

            ab_tests = task.get("ab_tests", [])
            for test in ab_tests:
                if test.get("test_id") == test_id:
                    variants = test.get("variants", [])
                    results = []
                    for v in variants:
                        metrics = v.get("metrics", {})
                        views = metrics.get("views", 0)
                        time_s = metrics.get("time_spent_ms", 0) / 1000
                        results.append({
                            "variant_id": v["variant_id"],
                            "name": v["name"],
                            "views": views,
                            "engagement_rate": round(metrics.get("click_count", 0) / views * 100, 1) if views > 0 else 0,
                            "avg_time_seconds": round(time_s / views, 1) if views > 0 else 0,
                        })
                    return {"success": True, "results": results}

            return {"success": False, "message": "Test not found"}

    # ========== Slide Change Tracking ==========

    def record_slide_change(self, task_id: str, slide_index: int, change_type: str, old_value: Any = None, new_value: Any = None) -> None:
        """Record a slide change."""
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                return

            if "slide_changes" not in task:
                task["slide_changes"] = []

            change = {
                "timestamp": get_timestamp(),
                "slide_index": slide_index,
                "change_type": change_type,
                "old_value": old_value,
                "new_value": new_value,
            }
            task["slide_changes"].append(change)

            if len(task["slide_changes"]) > MAX_SLIDE_CHANGES:
                task["slide_changes"] = task["slide_changes"][-MAX_SLIDE_CHANGES:]

    # ========== Presentation Coach / Suggestions ==========

    def get_coaching_suggestions(self, task_id: str) -> list:
        """Get presentation coaching suggestions."""
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                return []

            suggestions = []
            outline = task.get("outline", {})
            slides = outline.get("slides", [])
            total_slides = len(slides)

            if total_slides < SLIDE_COUNT_MIN:
                suggestions.append({
                    "type": "slide_count", "priority": "medium",
                    "title": "幻灯片数量偏少",
                    "description": f"建议增加更多内容，当前仅 {total_slides} 页",
                    "action": f"目标: {SLIDE_COUNT_MIN}-{SLIDE_COUNT_MAX} 页"
                })
            elif total_slides > SLIDE_COUNT_MAX:
                suggestions.append({
                    "type": "slide_count", "priority": "medium",
                    "title": "幻灯片数量偏多",
                    "description": f"内容可能过于冗长，建议精简到 {SLIDE_COUNT_MAX} 页以内",
                    "action": f"当前: {total_slides} 页"
                })

            for index, slide in enumerate(slides):
                title = slide.get("title", "")
                content = slide.get("content", "")
                layout = slide.get("layout", "")

                if len(title) > TITLE_MAX_LENGTH:
                    suggestions.append({
                        "type": "title", "priority": "high", "slide": index + 1,
                        "title": "标题过长",
                        "description": f"第 {index + 1} 页标题超过 {TITLE_MAX_LENGTH} 字符",
                        "action": f"建议精简标题，当前：{title[:TITLE_TRUNCATE_LENGTH]}..."
                    })

                content_len = len(content)
                if content_len > CONTENT_MAX_LENGTH:
                    suggestions.append({
                        "type": "content_density", "priority": "high", "slide": index + 1,
                        "title": "内容过密",
                        "description": f"第 {index + 1} 页内容超过 {CONTENT_MAX_LENGTH} 字符",
                        "action": "建议分段或分页"
                    })
                elif content_len < CONTENT_MIN_LENGTH and index > 0:
                    suggestions.append({
                        "type": "content_empty", "priority": "medium", "slide": index + 1,
                        "title": "内容过少",
                        "description": f"第 {index + 1} 页内容不足 {CONTENT_MIN_LENGTH} 字符",
                        "action": "建议补充更多内容"
                    })

                if layout in ("title", "center") and index > 0 and content_len < CONTENT_LAYOUT_MIN_LENGTH:
                    suggestions.append({
                        "type": "layout", "priority": "low", "slide": index + 1,
                        "title": "页面利用率低",
                        "description": f"第 {index + 1} 页使用 '{layout}' 布局但内容较少",
                        "action": "建议使用更丰富的布局或增加内容"
                    })

                content_lower = content.lower()
                has_data_keywords = any(kw in content_lower for kw in ["数据", "增长", "比例", "趋势", "分析", "统计", "数字", "百分", "%", "数据来源"])
                if not has_data_keywords and index > 0:
                    suggestions.append({
                        "type": "visual", "priority": "low", "slide": index + 1,
                        "title": "缺少数据支撑",
                        "description": f"第 {index + 1} 页未检测到数据内容",
                        "action": "建议添加图表或数据卡片"
                    })

                if index == 0:
                    if not title or len(title) < TITLE_MIN_LENGTH:
                        suggestions.append({
                            "type": "cover", "priority": "high", "slide": 1,
                            "title": "封面标题缺失",
                            "description": "封面缺少有效标题",
                            "action": "建议添加明确的演示标题"
                        })

            return suggestions


# ========== Singleton Instance ==========

_task_manager: TaskManager = None
_manager_lock = threading.Lock()


def get_task_manager() -> TaskManager:
    """Get the TaskManager singleton instance (thread-safe).

    Returns:
        The singleton TaskManager instance.
    """
    global _task_manager
    if _task_manager is None:
        with _manager_lock:
            if _task_manager is None:
                _task_manager = TaskManager()
    return _task_manager
