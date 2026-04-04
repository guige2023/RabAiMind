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
from typing import Dict, Any, Optional, List
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
        self._async_tasks: Dict[str, Any] = {}  # 保存异步任务引用(asyncio.Task 或 threading.Thread)
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
        theme_color: str = "#165DFF",
        layout_mode: str = "auto",
        color_scheme: str = "#165DFF",
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
            "layout_mode": layout_mode,
            "color_scheme": color_scheme,
            "status": "pending",
            "progress": 0,
            "current_step": "初始化",
            "created_at": get_timestamp(),
            "updated_at": get_timestamp(),
            "result": None,
            "error": None,
            "params": {},  # BUG修复: 存储完整生成参数，用于单页重生成等场景
            "action_log": [],  # 操作日志（最多100条）
            "undo_stack": [],  # 撤销栈（最多10条）
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

    def save_outline(self, task_id: str, outline: Dict) -> None:
        """保存大纲到任务（支持跨设备继续编辑）"""
        with self._task_lock:
            if task_id in self.tasks:
                old_outline = self.tasks[task_id].get("outline")
                self.tasks[task_id]["outline"] = outline
                self.tasks[task_id]["updated_at"] = get_timestamp()
                # 记录操作日志和撤销数据（在锁内直接添加，避免死锁）
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
                    if len(self.tasks[task_id]["undo_stack"]) > 10:
                        self.tasks[task_id]["undo_stack"] = self.tasks[task_id]["undo_stack"][-10:]

    def get_outline(self, task_id: str) -> Optional[Dict]:
        """获取大纲"""
        with self._task_lock:
            task = self.tasks.get(task_id)
            return task.get("outline") if task else None

    def update_task_params(self, task_id: str, params: Dict) -> None:
        """更新任务参数（用于存储完整生成选项，支持后续重生成等操作）"""
        with self._task_lock:
            if task_id in self.tasks:
                self.tasks[task_id]["params"] = params
                self.tasks[task_id]["updated_at"] = get_timestamp()

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
        output_format: str = "pptx",
        slides_summary: Optional[List[Dict]] = None,
        svg_paths: Optional[List[str]] = None
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
                        },
                        "slides_summary": slides_summary or [],
                        "svg_paths": svg_paths or [],
                        "scene": self.tasks[task_id].get("scene", "business"),
                        "style": self.tasks[task_id].get("style", "professional"),
                    }
                })
                # 保存一份用于云端推送（避免锁竞争）
                task_copy = dict(self.tasks[task_id])

        # 云端同步（在锁外执行，避免阻塞）
        if task_copy:
            # 自动创建第一个版本
            self.create_version(task_id, "初始版本")
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

    def save_outline(self, task_id: str, outline: dict) -> None:
        """保存大纲到任务"""
        with self._task_lock:
            if task_id in self.tasks:
                self.tasks[task_id]["outline"] = outline

    def get_outline(self, task_id: str) -> Optional[dict]:
        """获取大纲"""
        with self._task_lock:
            task = self.tasks.get(task_id, {})
            return task.get("outline")

    def create_version(self, task_id: str, version_name: str = None) -> dict:
        """创建任务快照版本"""
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                raise ValueError(f"Task {task_id} not found")

            version_id = f"v{int(time.time() * 1000)}"
            version_data = {
                "version_id": version_id,
                "task_id": task_id,
                "name": version_name or f"版本 {len(task.get('versions', [])) + 1}",
                "created_at": get_timestamp(),
                "config": {
                    "scene": task.get("result", {}).get("scene", "business"),
                    "style": task.get("result", {}).get("style", "professional"),
                    "slides": task.get("result", {}).get("slides_summary", []),
                },
                "svg_paths": task.get("result", {}).get("svg_paths", []),
                "pptx_path": task.get("result", {}).get("pptx_path", ""),
                "outline": task.get("outline", ""),
            }

            if "versions" not in task:
                task["versions"] = []
            task["versions"].append(version_data)

            return {"success": True, "version_id": version_id}

    def list_versions(self, task_id: str) -> list:
        """列出任务所有版本"""
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                return []
            return [
                {
                    "version_id": v["version_id"],
                    "name": v["name"],
                    "created_at": v["created_at"],
                    "slide_count": len(v.get("config", {}).get("slides", [])),
                }
                for v in sorted(task.get("versions", []), key=lambda x: x["created_at"])
            ]

    def get_version(self, task_id: str, version_id: str) -> dict:
        """获取指定版本详情"""
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                raise ValueError(f"Task {task_id} not found")

            for v in task.get("versions", []):
                if v["version_id"] == version_id:
                    return {"success": True, "version": v}

            raise ValueError(f"Version {version_id} not found")

    def rollback_version(self, task_id: str, version_id: str) -> dict:
        """回滚到指定版本"""
        version = self.get_version(task_id, version_id)
        if not version.get("success"):
            raise ValueError(f"Cannot rollback: version not found")

        v = version["version"]

        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                raise ValueError(f"Task {task_id} not found")

            # 保存当前为新版本（回滚前的快照）
            rollback_snapshot_id = f"v{int(time.time() * 1000)}"
            rollback_snapshot = {
                "version_id": rollback_snapshot_id,
                "task_id": task_id,
                "name": "回滚前快照",
                "created_at": get_timestamp(),
                "config": {
                    "scene": task.get("result", {}).get("scene", "business"),
                    "style": task.get("result", {}).get("style", "professional"),
                    "slides": task.get("result", {}).get("slides_summary", []),
                },
                "svg_paths": task.get("result", {}).get("svg_paths", []),
                "pptx_path": task.get("result", {}).get("pptx_path", ""),
                "outline": task.get("outline", ""),
            }
            if "versions" not in task:
                task["versions"] = []
            task["versions"].append(rollback_snapshot)

            # 恢复版本数据
            if task.get("result"):
                task["result"]["scene"] = v["config"]["scene"]
                task["result"]["style"] = v["config"]["style"]
                task["result"]["slides_summary"] = v["config"]["slides"]
                task["result"]["svg_paths"] = v["svg_paths"]
                task["result"]["pptx_path"] = v["pptx_path"]
            task["outline"] = v.get("outline", "")

            # 创建回滚后新版本标记
            post_rollback_id = f"v{int(time.time() * 1000)}"
            post_rollback_version = {
                "version_id": post_rollback_id,
                "task_id": task_id,
                "name": f"回滚到: {v['name']}",
                "created_at": get_timestamp(),
                "config": v["config"],
                "svg_paths": v["svg_paths"],
                "pptx_path": v["pptx_path"],
                "outline": v.get("outline", ""),
            }
            task["versions"].append(post_rollback_version)

            # 记录操作日志和撤销数据（在锁内直接添加，避免死锁）
            rollback_entry = {
                "action_type": "rollback",
                "description": f"回滚到: {v['name']}",
                "timestamp": get_timestamp(),
                "undo_data": {"rollback_snapshot": rollback_snapshot},
            }
            if "action_log" not in task:
                task["action_log"] = []
            task["action_log"].append(rollback_entry)
            if "undo_stack" not in task:
                task["undo_stack"] = []
            task["undo_stack"].append(rollback_entry)
            if len(task["undo_stack"]) > 10:
                task["undo_stack"] = task["undo_stack"][-10:]

        return {"success": True, "message": f"已回滚到 {v['name']}"}

    def diff_versions(self, task_id: str, version_id_a: str, version_id_b: str) -> dict:
        """对比两个版本的差异"""
        v_a = self.get_version(task_id, version_id_a)["version"]
        v_b = self.get_version(task_id, version_id_b)["version"]

        slides_a = v_a.get("config", {}).get("slides", [])
        slides_b = v_b.get("config", {}).get("slides", [])

        diff = []
        max_len = max(len(slides_a), len(slides_b))

        for i in range(max_len):
            slide_a = slides_a[i] if i < len(slides_a) else None
            slide_b = slides_b[i] if i < len(slides_b) else None

            if slide_a != slide_b:
                diff.append({
                    "slide_index": i + 1,
                    "before": slide_a,
                    "after": slide_b,
                    "changed": slide_a is None or slide_b is None or
                               slide_a.get("title") != slide_b.get("title") or
                               slide_a.get("content") != slide_b.get("content")
                })

        return {
            "success": True,
            "version_a": v_a["name"],
            "version_b": v_b["name"],
            "diff": diff,
            "total_changes": len(diff)
        }

    # ========== 操作日志 & 撤销栈 ==========

    def log_action(self, task_id: str, action_type: str, description: str, undo_data: dict = None) -> None:
        """记录用户操作到操作日志（最多100条），并压入撤销栈（最多10条）"""
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                return

            entry = {
                "action_type": action_type,
                "description": description,
                "timestamp": get_timestamp(),
                "undo_data": undo_data,  # 撤销所需的数据
            }

            # 写入操作日志（最多100条）
            if "action_log" not in task:
                task["action_log"] = []
            task["action_log"].append(entry)
            if len(task["action_log"]) > 100:
                task["action_log"] = task["action_log"][-100:]

            # 压入撤销栈（最多10条）
            if undo_data is not None:
                if "undo_stack" not in task:
                    task["undo_stack"] = []
                task["undo_stack"].append(entry)
                if len(task["undo_stack"]) > 10:
                    task["undo_stack"] = task["undo_stack"][-10:]

    def get_action_log(self, task_id: str, limit: int = 20) -> list:
        """获取操作日志（最近limit条，默认20条）"""
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                return []
            log = task.get("action_log", [])
            return log[-limit:] if limit > 0 else log

    def get_undo_stack(self, task_id: str) -> list:
        """获取撤销栈（最近10条）"""
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                return []
            return task.get("undo_stack", [])

    def undo(self, task_id: str) -> dict:
        """撤销上一个操作，返回被撤销的操作信息"""
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                raise ValueError(f"Task {task_id} not found")

            undo_stack = task.get("undo_stack", [])
            if not undo_stack:
                return {"success": False, "message": "无可撤销的操作"}

            # 弹出最后一个操作
            action = undo_stack.pop()

            # 根据操作类型执行撤销
            action_type = action.get("action_type")
            undo_data = action.get("undo_data", {})

            if action_type == "outline_edit":
                # 撤销大纲编辑：恢复之前的大纲
                old_outline = undo_data.get("old_outline")
                if old_outline:
                    task["outline"] = old_outline
                    task["updated_at"] = get_timestamp()

            elif action_type == "slide_regenerate":
                # 撤销幻灯片重生成：恢复之前的SVG内容到文件
                old_svg_content = undo_data.get("old_svg_content")
                svg_path = undo_data.get("svg_path")
                slide_index = undo_data.get("slide_index")
                if old_svg_content and svg_path:
                    import os as _os
                    _os.makedirs(_os.path.dirname(svg_path), exist_ok=True)
                    with open(svg_path, 'w', encoding='utf-8') as _f:
                        _f.write(old_svg_content)
                    logger.info(f"[undo] 已恢复第{slide_index}页SVG到旧版本")
                    task["updated_at"] = get_timestamp()

            elif action_type == "rollback":
                # 撤销回滚：恢复到回滚前的状态（需要特殊处理）
                # 回滚操作本身已经有快照，所以撤销回滚就是恢复到快照
                rollback_data = undo_data.get("rollback_snapshot")
                if rollback_data:
                    task["result"] = rollback_data.get("result", {})
                    task["outline"] = rollback_data.get("outline", "")
                    task["updated_at"] = get_timestamp()

            elif action_type == "slide_image":
                # 撤销图片更新
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

            # 记录撤销操作本身到日志
            undo_log_entry = {
                "action_type": "undo",
                "description": f"撤销: {action.get('description', '')}",
                "timestamp": get_timestamp(),
                "undo_data": None,
            }
            if "action_log" not in task:
                task["action_log"] = []
            task["action_log"].append(undo_log_entry)

            return {
                "success": True,
                "undone_action": action.get("description", ""),
                "action_type": action_type,
            }

    def register_async_task(self, task_id: str, async_task: asyncio.Task) -> None:
        """注册异步任务引用（线程安全）"""
        with self._async_tasks_lock:
            self._async_tasks[task_id] = async_task

    def cancel_async_task(self, task_id: str) -> bool:
        """取消异步任务（线程安全）
        
        支持 asyncio.Task 和 threading.Thread 两种类型。
        """
        with self._async_tasks_lock:
            if task_id not in self._async_tasks:
                return False
            async_task = self._async_tasks[task_id]
            # asyncio.Task 有 done() 方法，threading.Thread 有 is_alive() 方法
            if hasattr(async_task, 'done'):
                if async_task.done():
                    del self._async_tasks[task_id]
                    return True
                async_task.cancel()
            elif hasattr(async_task, 'is_alive'):
                if not async_task.is_alive():
                    del self._async_tasks[task_id]
                    return True
                # threading.Thread 不能强制取消，只能等待
                async_task.join(timeout=1.0)
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
