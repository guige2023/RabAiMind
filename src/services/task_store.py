# -*- coding: utf-8 -*-
"""
Task Store Module - Task persistence and retrieval

This module handles task storage, retrieval, and lifecycle management.
Extracted from task_manager.py to improve code organization.

Author: Claude
Date: 2026-04-07
"""

import time
import logging
import threading
import uuid
import json
from typing import Dict, Any, Optional, List

from ..utils import generate_task_id, get_timestamp, ensure_dir
from ..config import settings, get_redis_url
from ..constants import (
    MAX_TASKS,
    MAX_COMPLETED_CLEANUP,
    MAX_TASK_AGE_MINUTES,
)
from .history_sync_service import get_history_sync_service, HistorySyncService

logger = logging.getLogger(__name__)


class TaskStore:
    """Task storage and retrieval operations.

    This class is responsible for:
    - Creating and storing tasks
    - Retrieving tasks by ID
    - Managing task lifecycle (history, sync)
    - Capacity management and cleanup
    - Redis-backed persistence for crash recovery
    """

    # Redis key prefix for task storage
    _REDIS_TASK_PREFIX = "task:"
    _REDIS_ALL_TASKS_KEY = "tasks:all_ids"
    _REDIS_SYNC_LOCK_KEY = "tasks:sync_lock"

    def __init__(self):
        self._memory_tasks: Dict[str, Dict] = {}  # Local cache
        self._task_lock = threading.Lock()
        self._cleanup_counter: int = 0
        self._cleanup_interval: int = 10
        self._max_task_age_minutes: int = MAX_TASK_AGE_MINUTES
        self._sync_service: HistorySyncService = get_history_sync_service()
        self._sync_initialized: bool = False
        self._redis_client = None
        self._redis_enabled = False
        self._persist_thread: Optional[threading.Thread] = None
        self._persist_stop_event = threading.Event()
        ensure_dir(settings.OUTPUT_DIR)

        # Initialize Redis connection
        self._init_redis()

        # Start cloud restore on initialization
        self._try_cloud_restore()

        # Start periodic persistence thread
        self._start_periodic_persist()

    def _init_redis(self) -> None:
        """Initialize Redis connection for task persistence."""
        try:
            import redis
            redis_url = get_redis_url()
            if redis_url:
                self._redis_client = redis.from_url(
                    redis_url,
                    decode_responses=True,
                    socket_connect_timeout=5,
                    socket_timeout=5
                )
                # Test connection
                self._redis_client.ping()
                self._redis_enabled = True
                logger.info(f"[TaskStore] Redis connected: {redis_url}")
            else:
                logger.warning("[TaskStore] Redis URL not configured, using memory-only storage")
        except Exception as e:
            logger.warning(f"[TaskStore] Redis connection failed: {e}, using memory-only storage")
            self._redis_client = None
            self._redis_enabled = False

    def _start_periodic_persist(self) -> None:
        """Start background thread for periodic Redis persistence."""
        if not self._redis_enabled:
            return
        self._persist_stop_event.clear()
        self._persist_thread = threading.Thread(
            target=self._periodic_persist_worker,
            daemon=True,
            name="TaskStore-Persist"
        )
        self._persist_thread.start()
        logger.info("[TaskStore] Periodic persistence thread started")

    def _periodic_persist_worker(self) -> None:
        """Background worker that periodically syncs tasks to Redis."""
        while not self._persist_stop_event.wait(timeout=30):  # Sync every 30 seconds
            try:
                self._sync_all_to_redis()
            except Exception as e:
                logger.warning(f"[TaskStore] Periodic persist failed: {e}")

    def _sync_all_to_redis(self) -> int:
        """Sync all in-memory tasks to Redis. Returns count of synced tasks."""
        if not self._redis_enabled:
            return 0
        count = 0
        with self._task_lock:
            task_ids = list(self._memory_tasks.keys())
        for task_id in task_ids:
            try:
                with self._task_lock:
                    task = self._memory_tasks.get(task_id)
                if task:
                    self._redis_client.hset(
                        self._REDIS_TASK_PREFIX + task_id,
                        mapping={"data": json.dumps(task)}
                    )
                    count += 1
            except Exception as e:
                logger.warning(f"[TaskStore] Failed to persist task {task_id}: {e}")
        if count > 0:
            logger.debug(f"[TaskStore] Persisted {count} tasks to Redis")
        return count

    def _load_from_redis(self) -> Dict[str, Dict]:
        """Load all tasks from Redis into memory cache."""
        if not self._redis_enabled:
            return {}
        result = {}
        try:
            keys = self._redis_client.keys(self._REDIS_TASK_PREFIX + "*")
            for key in keys:
                task_id = key.replace(self._REDIS_TASK_PREFIX, "")
                data = self._redis_client.hget(key, "data")
                if data:
                    try:
                        result[task_id] = json.loads(data)
                    except json.JSONDecodeError:
                        logger.warning(f"[TaskStore] Invalid JSON for task {task_id}")
        except Exception as e:
            logger.warning(f"[TaskStore] Failed to load from Redis: {e}")
        return result

    def _restore_from_redis(self) -> None:
        """Restore tasks from Redis on startup."""
        if not self._redis_enabled:
            return
        try:
            redis_tasks = self._load_from_redis()
            with self._task_lock:
                for task_id, task_data in redis_tasks.items():
                    if task_id not in self._memory_tasks:
                        self._memory_tasks[task_id] = task_data
            if redis_tasks:
                logger.info(f"[TaskStore] Restored {len(redis_tasks)} tasks from Redis")
        except Exception as e:
            logger.warning(f"[TaskStore] Redis restore failed: {e}")

    # ─── Property-based task access (for backward compatibility) ────────────────

    @property
    def tasks(self) -> Dict[str, Dict]:
        """Return the in-memory tasks dict for backward compatibility."""
        return self._memory_tasks

    # ─── Core task operations ───────────────────────────────────────────────────

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
        """Create a new PPT generation task.

        Creates a new task with the specified parameters and returns a unique
        task ID that can be used to track progress and retrieve results.

        Args:
            user_request: Natural language description of the presentation content.
            slide_count: Target number of slides (default: 10).
            scene: Visual style/scene category.
            style: Typography and design style.
            template: Template name to use.
            theme_color: Primary color in hex format.
            layout_mode: Layout selection mode.
            color_scheme: Color scheme in hex format.

        Returns:
            A unique task_id string.
        """
        task_id = generate_task_id()

        task = {
            "task_id": task_id,
            "user_request": user_request,
            "slide_count": slide_count,
            "scene": scene,
            "style": style,
            "template": template,
            "theme_color": theme_color,
            "layout_mode": layout_mode,
            "color_scheme": color_scheme,
            "status": "pending",
            "progress": 0,
            "current_step": "初始化",
            "created_at": get_timestamp(),
            "updated_at": get_timestamp(),
            "result": None,
            "error": None,
            "params": {},
            "action_log": [],
            "undo_stack": [],
            "redo_stack": [],
            "action_timeline": [],
            "checkpoints": [],
            "collaborative_locks": {},
        }

        with self._task_lock:
            self.tasks[task_id] = task
            # Capacity cleanup
            if len(self.tasks) > MAX_TASKS:
                completed = [(k, v) for k, v in self.tasks.items() if v.get('status') == 'completed']
                completed.sort(key=lambda x: x[1].get('created_at', ''))
                for k, _ in completed[:MAX_COMPLETED_CLEANUP]:
                    if k in self.tasks:
                        del self.tasks[k]
                logger.info(f"[TaskStore] Capacity exceeded, cleaned {min(100, len(completed))} completed tasks")

            # Lazy cleanup
            self._cleanup_counter += 1
            if self._cleanup_counter >= self._cleanup_interval:
                self._cleanup_counter = 0
                self._lazy_cleanup_unlocked()

        return task_id

    def get_task(self, task_id: str) -> Optional[Dict]:
        """Retrieve a task by its ID.

        Args:
            task_id: The unique identifier of the task.

        Returns:
            The task dictionary if found, None otherwise.
        """
        return self.tasks.get(task_id)

    def get_history(self, status_filter: Optional[str] = None) -> Dict[str, Dict]:
        """Get history of tasks, optionally filtered by status.

        Args:
            status_filter: Optional filter to return only tasks with this status.

        Returns:
            Dictionary mapping task_id to task data dict.
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
        """Force sync all current tasks to Redis and cloud storage.

        Returns:
            Number of tasks successfully synced.
        """
        count = 0
        with self._task_lock:
            task_ids = list(self._memory_tasks.keys())

        # First, sync all to Redis
        for task_id in task_ids:
            with self._task_lock:
                task = self._memory_tasks.get(task_id)
            if task and self._redis_enabled:
                try:
                    self._redis_client.hset(
                        self._REDIS_TASK_PREFIX + task_id,
                        mapping={"data": json.dumps(task)}
                    )
                    count += 1
                except Exception as e:
                    logger.warning(f"[TaskStore] Redis sync failed for {task_id}: {e}")

        # Then, sync to cloud (OSS) via HistorySyncService
        cloud_count = 0
        for task_id in task_ids:
            with self._task_lock:
                task = self._memory_tasks.get(task_id)
            if task:
                if self._sync_service.push_task(task_id, task):
                    cloud_count += 1

        return count if count > 0 else cloud_count

    def save_outline(self, task_id: str, outline: Dict) -> None:
        """Save presentation outline to a task.

        Args:
            task_id: The unique identifier of the task.
            outline: Dictionary containing the outline structure.
        """
        with self._task_lock:
            if task_id in self.tasks:
                old_outline = self.tasks[task_id].get("outline")
                self.tasks[task_id]["outline"] = outline
                self.tasks[task_id]["updated_at"] = get_timestamp()

                if old_outline != outline:
                    slide_count = len(outline.get("slides", [])) if outline else 0
                    entry = {
                        "action_type": "outline_edit",
                        "description": f"编辑大纲 ({slide_count}页)",
                        "timestamp": get_timestamp(),
                        "undo_data": {"old_outline": old_outline},
                    }
                    if "action_log" not in self.tasks[task_id]:
                        self.tasks[task_id]["action_log"] = []
                    self.tasks[task_id]["action_log"].append(entry)
                    if len(self.tasks[task_id]["action_log"]) > 100:
                        self.tasks[task_id]["action_log"] = self.tasks[task_id]["action_log"][-100:]
                    if "undo_stack" not in self.tasks[task_id]:
                        self.tasks[task_id]["undo_stack"] = []
                    self.tasks[task_id]["undo_stack"].append(entry)
                    self.tasks[task_id]["redo_stack"] = []

    def get_outline(self, task_id: str) -> Optional[Dict]:
        """Get outline for a task."""
        with self._task_lock:
            task = self.tasks.get(task_id)
            return task.get("outline") if task else None

    def update_task_params(self, task_id: str, params: Dict) -> None:
        """Update task parameters."""
        with self._task_lock:
            if task_id in self.tasks:
                self.tasks[task_id]["params"] = params
                self.tasks[task_id]["updated_at"] = get_timestamp()

    def delete_task(self, task_id: str) -> bool:
        """Delete a task.

        Args:
            task_id: The unique identifier of the task.

        Returns:
            True if deleted, False if not found.
        """
        with self._task_lock:
            if task_id in self._memory_tasks:
                del self._memory_tasks[task_id]
                # Also delete from Redis
                if self._redis_enabled:
                    try:
                        self._redis_client.delete(self._REDIS_TASK_PREFIX + task_id)
                    except Exception as e:
                        logger.warning(f"[TaskStore] Redis delete failed for {task_id}: {e}")
                return True
            return False

    def _lazy_cleanup_unlocked(self) -> None:
        """Lazy cleanup of expired tasks. Must be called with _task_lock held."""
        now = get_timestamp()
        tasks_to_delete = []

        for task_id, task in self.tasks.items():
            status = task.get("status", "pending")
            updated_at = task.get("updated_at", "")

            # Only clean up completed/failed tasks older than MAX_TASK_AGE_MINUTES
            if status in ("completed", "failed"):
                try:
                    from ..utils import parse_timestamp
                    age_minutes = (time.time() - parse_timestamp(updated_at)) / 60
                    if age_minutes > self._max_task_age_minutes:
                        tasks_to_delete.append(task_id)
                except Exception:
                    pass

        for task_id in tasks_to_delete:
            if task_id in self.tasks:
                del self.tasks[task_id]

        if tasks_to_delete:
            logger.info(f"[TaskStore] Lazy cleanup removed {len(tasks_to_delete)} expired tasks")

    def _try_cloud_restore(self) -> None:
        """Attempt to restore tasks from Redis first, then cloud storage on startup."""
        try:
            if not self._sync_initialized:
                # First, restore from Redis (fast local recovery)
                self._restore_from_redis()

                # Then, try cloud restore for multi-device sync
                tasks = self._sync_service.pull_all_tasks()
                if tasks:
                    with self._task_lock:
                        for task_id, task_data in tasks.items():
                            if task_id not in self._memory_tasks:
                                self._memory_tasks[task_id] = task_data
                    logger.info(f"[TaskStore] Restored {len(tasks)} tasks from cloud")
                self._sync_initialized = True
        except Exception as e:
            logger.warning(f"[TaskStore] Cloud restore failed: {e}")

    def get_all_tasks(self) -> Dict[str, Dict]:
        """Get all tasks (internal use)."""
        return self.tasks

    def set_task(self, task_id: str, task_data: Dict) -> None:
        """Set task data directly (internal use)."""
        with self._task_lock:
            self.tasks[task_id] = task_data