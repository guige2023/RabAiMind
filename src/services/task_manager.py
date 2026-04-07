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
import uuid
from typing import Dict, Any, Optional, List
from datetime import datetime
import os
from pathlib import Path

from ..utils import generate_task_id, get_timestamp, ensure_dir
from ..config import settings
from .history_sync_service import get_history_sync_service, HistorySyncService

logger = logging.getLogger(__name__)

MAX_TASKS = 1000  # 任务队列最大容量，超出时清理最老的已完成任务


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
        self._cancel_events: Dict[str, threading.Event] = {}  # 任务取消事件标志
        self._cancel_events_lock = threading.Lock()  # 保护_cancel_events的线程锁
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
            "undo_stack": [],  # 撤销栈（100+级别）
            "redo_stack": [],  # 重做栈（100+级别）
            "action_timeline": [],  # 完整时间线（所有操作，含分支）
            "checkpoints": [],  # 自动保存检查点（每5分钟）
            "collaborative_locks": {},  # 协作编辑锁
        }

        with self._task_lock:
            self.tasks[task_id] = task
            # 容量清理：字典过大时清理最老的已完成任务
            if len(self.tasks) > MAX_TASKS:
                completed = [(k, v) for k, v in self.tasks.items() if v.get('status') == 'completed']
                completed.sort(key=lambda x: x[1].get('created_at', ''))
                for k, _ in completed[:100]:  # 清理100个最老的已完成任务
                    if k in self.tasks:
                        del self.tasks[k]
                logger.info(f"[TaskManager] 容量超限，自动清理 {min(100, len(completed))} 个已完成任务")
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
                    # 清空重做栈（新操作入栈时）
                    self.tasks[task_id]["redo_stack"] = []

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

        # Track task completion in advanced analytics
        try:
            from .advanced_analytics_service import get_advanced_analytics_service
            get_advanced_analytics_service().update_task_status(task_id, "completed")
        except Exception:
            pass  # Non-critical

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

        # Track task failure in advanced analytics
        try:
            from .advanced_analytics_service import get_advanced_analytics_service
            get_advanced_analytics_service().update_task_status(task_id, "failed")
        except Exception:
            pass  # Non-critical

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
            slides_summary = task.get("result", {}).get("slides_summary", [])

            # 为版本存储SVG内容（用于视觉diff）
            svg_contents = []
            try:
                from .ppt_generator import PPTGenerator
                gen = PPTGenerator()
                for i, slide in enumerate(slides_summary):
                    svg_content = gen._generate_svg_smart_text(slide, i + 1)
                    svg_contents.append(svg_content)
            except Exception as e:
                logger.warning(f"生成版本SVG内容失败: {e}")
                svg_contents = []

            version_data = {
                "version_id": version_id,
                "task_id": task_id,
                "name": version_name or f"版本 {len(task.get('versions', [])) + 1}",
                "created_at": get_timestamp(),
                "tags": [],  # 版本标签列表
                "config": {
                    "scene": task.get("result", {}).get("scene", "business"),
                    "style": task.get("result", {}).get("style", "professional"),
                    "slides": slides_summary,
                },
                "svg_paths": task.get("result", {}).get("svg_paths", []),
                "svg_contents": svg_contents,  # 版本专属SVG内容（用于视觉diff）
                "pptx_path": task.get("result", {}).get("pptx_path", ""),
                "outline": task.get("outline", ""),
            }

            if "versions" not in task:
                task["versions"] = []
            task["versions"].append(version_data)

            return {"success": True, "version_id": version_id}

    # ========== 自动版本化（Significant Change Detection） ==========

    def detect_significant_change(self, task_id: str, old_state: dict, new_state: dict) -> dict:
        """
        检测是否发生了显著变化，用于触发自动版本创建
        显著变化包括：
        - 幻灯片数量变化 >= 2
        - 超过50%的幻灯片内容发生变更
        - 大纲结构发生重大变化
        - 主题/场景/风格变更
        """
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                return {"significant": False, "reason": "Task not found"}

            old_slides = old_state.get("slides_summary", []) or []
            new_slides = new_state.get("slides_summary", []) or []

            reasons = []

            # 1. 幻灯片数量大幅变化
            slide_diff = abs(len(new_slides) - len(old_slides))
            if len(new_slides) > len(old_slides) + 1:
                reasons.append(f"新增 {len(new_slides) - len(old_slides)} 页幻灯片")
            elif len(new_slides) < len(old_slides) - 1:
                reasons.append(f"删除 {len(old_slides) - len(new_slides)} 页幻灯片")

            # 2. 超过50%的幻灯片内容变化
            if old_slides and new_slides:
                changed = 0
                max_count = max(len(old_slides), len(new_slides))
                for i in range(max_count):
                    old_s = old_slides[i] if i < len(old_slides) else None
                    new_s = new_slides[i] if i < len(new_slides) else None
                    if old_s != new_s:
                        changed += 1
                change_ratio = changed / max_count if max_count > 0 else 0
                if change_ratio >= 0.5:
                    reasons.append(f"{int(change_ratio * 100)}% 幻灯片内容变更")

            # 3. 场景/风格变更
            old_scene = old_state.get("scene", "")
            new_scene = new_state.get("scene", "")
            old_style = old_state.get("style", "")
            new_style = new_state.get("style", "")
            if old_scene and new_scene and old_scene != new_scene:
                reasons.append(f"场景变更: {old_scene} → {new_scene}")
            if old_style and new_style and old_style != new_style:
                reasons.append(f"风格变更: {old_style} → {new_style}")

            # 4. 大纲结构重大变化
            old_outline = (old_state.get("outline") or "").strip()
            new_outline = (new_state.get("outline") or "").strip()
            if old_outline and new_outline:
                old_lines = len(old_outline.split('\n'))
                new_lines = len(new_outline.split('\n'))
                outline_diff = abs(new_lines - old_lines)
                if outline_diff >= 3:
                    reasons.append(f"大纲结构重大变化: {outline_diff} 行差异")

            significant = len(reasons) > 0
            return {
                "significant": significant,
                "reasons": reasons,
                "change_details": {
                    "slide_count_change": len(new_slides) - len(old_slides),
                    "old_slide_count": len(old_slides),
                    "new_slide_count": len(new_slides),
                    "scene_changed": old_scene != new_scene,
                    "style_changed": old_style != new_style,
                }
            }

    def auto_version_on_significant_change(self, task_id: str, auto_version_threshold: int = 3) -> dict:
        """
        检查是否需要自动创建版本
        当累积的显著变化达到阈值时自动创建版本
        auto_version_threshold: 累积多少次显著变化后自动创建版本
        """
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                return {"success": False, "message": "Task not found"}

            # 初始化计数器
            if "_significant_change_count" not in task:
                task["_significant_change_count"] = 0
                task["_last_auto_version_at"] = None

            count = task.get("_significant_change_count", 0)

            if count >= auto_version_threshold:
                # 创建自动版本
                auto_version_name = f"自动版本 (累积{count}次显著变化)"
                result = self.create_version(task_id, auto_version_name)
                # 重置计数器
                task["_significant_change_count"] = 0
                task["_last_auto_version_at"] = get_timestamp()
                # 标记为自动版本
                for v in task.get("versions", []):
                    if v["version_id"] == result.get("version_id"):
                        v["auto_created"] = True
                        v["auto_type"] = "significant_change"
                        break
                return {
                    "success": True,
                    "auto_created": True,
                    "version_id": result.get("version_id"),
                    "version_name": auto_version_name,
                    "changes_since_last": count,
                }

            return {
                "success": True,
                "auto_created": False,
                "significant_change_count": count,
                "threshold": auto_version_threshold,
                "remaining": auto_version_threshold - count,
            }

    def record_significant_change(self, task_id: str) -> dict:
        """记录一次显著变化"""
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                return {"success": False, "message": "Task not found"}

            if "_significant_change_count" not in task:
                task["_significant_change_count"] = 0

            task["_significant_change_count"] = task.get("_significant_change_count", 0) + 1
            task["_last_significant_change_at"] = get_timestamp()

            count = task.get("_significant_change_count", 0)
            return {
                "success": True,
                "significant_change_count": count,
                "last_recorded_at": task.get("_last_significant_change_at"),
            }

    def get_auto_version_status(self, task_id: str) -> dict:
        """获取自动版本化状态"""
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                return {"success": False, "message": "Task not found"}

            count = task.get("_significant_change_count", 0)
            last_change = task.get("_last_significant_change_at")
            last_auto = task.get("_last_auto_version_at")

            return {
                "success": True,
                "significant_change_count": count,
                "last_significant_change_at": last_change,
                "last_auto_version_at": last_auto,
                "auto_version_threshold": 3,
            }

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
                    "branch_id": v.get("branch_id"),
                    "branched_from": v.get("branched_from"),
                    "tags": v.get("tags", []),  # 版本标签
                }
                for v in sorted(task.get("versions", []), key=lambda x: x["created_at"])
            ]

    def add_version_tag(self, task_id: str, version_id: str, tag: str) -> dict:
        """为版本添加标签"""
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                raise ValueError(f"Task {task_id} not found")

            for v in task.get("versions", []):
                if v["version_id"] == version_id:
                    if "tags" not in v:
                        v["tags"] = []
                    if tag not in v["tags"]:
                        v["tags"].append(tag)
                    return {
                        "success": True,
                        "version_id": version_id,
                        "tag": tag,
                        "tags": v["tags"],
                    }

            raise ValueError(f"Version {version_id} not found")

    def remove_version_tag(self, task_id: str, version_id: str, tag: str) -> dict:
        """移除版本的标签"""
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                raise ValueError(f"Task {task_id} not found")

            for v in task.get("versions", []):
                if v["version_id"] == version_id:
                    if "tags" in v and tag in v["tags"]:
                        v["tags"].remove(tag)
                    return {
                        "success": True,
                        "version_id": version_id,
                        "removed_tag": tag,
                        "tags": v.get("tags", []),
                    }

            raise ValueError(f"Version {version_id} not found")

    def get_version_tags(self, task_id: str) -> dict:
        """获取所有版本标签统计"""
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                return {"success": True, "tags": {}}

            all_tags = {}
            for v in task.get("versions", []):
                for tag in v.get("tags", []):
                    if tag not in all_tags:
                        all_tags[tag] = []
                    all_tags[tag].append({
                        "version_id": v["version_id"],
                        "version_name": v["name"],
                    })

            return {"success": True, "tags": all_tags}

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

    def get_version_slide_svg(self, task_id: str, version_id: str, slide_index: int) -> dict:
        """获取指定版本的指定幻灯片SVG内容（用于视觉diff）
        如果版本没有预存SVG内容，则实时生成"""
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                raise ValueError(f"Task {task_id} not found")

            for v in task.get("versions", []):
                if v["version_id"] == version_id:
                    svg_contents = v.get("svg_contents", [])
                    slides = v.get("config", {}).get("slides", [])
                    
                    # 如果有预存SVG内容，直接返回
                    if svg_contents and slide_index >= 1 and slide_index <= len(svg_contents):
                        return {
                            "success": True,
                            "svg_content": svg_contents[slide_index - 1],
                            "slide_index": slide_index,
                            "version_id": version_id,
                            "version_name": v.get("name", version_id),
                        }
                    
                    # 否则从slides数据实时生成SVG
                    if slide_index < 1 or slide_index > len(slides):
                        raise ValueError(f"Slide {slide_index} not found in version {version_id}")
                    
                    slide = slides[slide_index - 1]
                    try:
                        from .ppt_generator import PPTGenerator
                        gen = PPTGenerator()
                        svg_content = gen._generate_svg_smart_text(slide, slide_index)
                    except Exception as e:
                        logger.warning(f"实时生成SVG失败: {e}")
                        svg_content = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" height="900">
  <rect width="1600" height="900" fill="#1e3a5f"/>
  <text x="800" y="450" text-anchor="middle" fill="white" font-size="36">第{slide_index}页</text>
</svg>'''
                    
                    return {
                        "success": True,
                        "svg_content": svg_content,
                        "slide_index": slide_index,
                        "version_id": version_id,
                        "version_name": v.get("name", version_id),
                    }

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
            slides_summary = task.get("result", {}).get("slides_summary", [])
            rollback_svg_contents = []
            try:
                from .ppt_generator import PPTGenerator
                gen = PPTGenerator()
                for i, slide in enumerate(slides_summary):
                    svg_content = gen._generate_svg_smart_text(slide, i + 1)
                    rollback_svg_contents.append(svg_content)
            except Exception as e:
                logger.warning(f"生成回滚快照SVG内容失败: {e}")
            rollback_snapshot = {
                "version_id": rollback_snapshot_id,
                "task_id": task_id,
                "name": "回滚前快照",
                "created_at": get_timestamp(),
                "config": {
                    "scene": task.get("result", {}).get("scene", "business"),
                    "style": task.get("result", {}).get("style", "professional"),
                    "slides": slides_summary,
                },
                "svg_paths": task.get("result", {}).get("svg_paths", []),
                "svg_contents": rollback_svg_contents,
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

            # 创建回滚后新版本标记（使用目标版本的SVG内容）
            post_rollback_id = f"v{int(time.time() * 1000)}"
            post_rollback_version = {
                "version_id": post_rollback_id,
                "task_id": task_id,
                "name": f"回滚到: {v['name']}",
                "created_at": get_timestamp(),
                "config": v["config"],
                "svg_paths": v["svg_paths"],
                "svg_contents": v.get("svg_contents", []),
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
            task["action_timeline"].append(rollback_entry)
            if len(task["undo_stack"]) > 100:
                task["undo_stack"] = task["undo_stack"][-100:]
            if len(task["action_timeline"]) > 200:
                task["action_timeline"] = task["action_timeline"][-200:]

        return {"success": True, "message": f"已回滚到 {v['name']}"}

    def diff_versions(self, task_id: str, version_id_a: str, version_id_b: str) -> dict:
        """对比两个版本的差异 - 增强视觉diff"""
        v_a = self.get_version(task_id, version_id_a)["version"]
        v_b = self.get_version(task_id, version_id_b)["version"]

        slides_a = v_a.get("config", {}).get("slides", [])
        slides_b = v_b.get("config", {}).get("slides", [])

        svg_paths_a = v_a.get("svg_paths", [])
        svg_paths_b = v_b.get("svg_paths", [])

        diff = []
        max_len = max(len(slides_a), len(slides_b))
        total_changes = 0

        for i in range(max_len):
            slide_a = slides_a[i] if i < len(slides_a) else None
            slide_b = slides_b[i] if i < len(slides_b) else None

            if slide_a != slide_b:
                # 分析具体变更类型
                change_types = []
                if slide_a is None:
                    change_types.append("新增幻灯片")
                elif slide_b is None:
                    change_types.append("删除幻灯片")
                else:
                    if slide_a.get("title") != slide_b.get("title"):
                        change_types.append("标题变更")
                    if slide_a.get("content") != slide_b.get("content"):
                        change_types.append("内容变更")
                    if slide_a.get("layout") != slide_b.get("layout"):
                        change_types.append("布局变更")
                    if slide_a.get("background") != slide_b.get("background"):
                        change_types.append("背景变更")
                    if slide_a.get("theme") != slide_b.get("theme"):
                        change_types.append("主题变更")

                # SVG路径对比
                svg_a = svg_paths_a[i] if i < len(svg_paths_a) else None
                svg_b = svg_paths_b[i] if i < len(svg_paths_b) else None
                svg_changed = svg_a != svg_b

                # 文本内容差异（前50字预览）
                content_preview_a = (slide_a.get("content", "") or "")[:50] if slide_a else None
                content_preview_b = (slide_b.get("content", "") or "")[:50] if slide_b else None

                # 计算文本diff
                text_diff = []
                if slide_a and slide_b:
                    text_a = (slide_a.get("content") or "").split('\n')
                    text_b = (slide_b.get("content") or "").split('\n')
                    # 简单的行级diff
                    added = set(text_b) - set(text_a)
                    removed = set(text_a) - set(text_b)
                    if added:
                        text_diff.append({"type": "added", "lines": list(added)[:5]})
                    if removed:
                        text_diff.append({"type": "removed", "lines": list(removed)[:5]})

                diff.append({
                    "slide_index": i + 1,
                    "slide_a_version_id": version_id_a,
                    "slide_b_version_id": version_id_b,
                    "before": slide_a,
                    "after": slide_b,
                    "changed": True,
                    "change_types": change_types,
                    "svg_a_path": svg_a,
                    "svg_b_path": svg_b,
                    "svg_changed": svg_changed,
                    "content_preview_a": content_preview_a,
                    "content_preview_b": content_preview_b,
                    "text_diff": text_diff,
                })
                total_changes += 1
            else:
                # 幻灯片相同，但检查SVG是否有变化
                svg_a = svg_paths_a[i] if i < len(svg_paths_a) else None
                svg_b = svg_paths_b[i] if i < len(svg_paths_b) else None
                if svg_a != svg_b:
                    diff.append({
                        "slide_index": i + 1,
                        "slide_a_version_id": version_id_a,
                        "slide_b_version_id": version_id_b,
                        "before": slide_a,
                        "after": slide_b,
                        "changed": False,
                        "change_types": ["SVG渲染变更"],
                        "svg_a_path": svg_a,
                        "svg_b_path": svg_b,
                        "svg_changed": True,
                        "content_preview_a": None,
                        "content_preview_b": None,
                        "text_diff": [],
                    })
                    total_changes += 1

        # 版本摘要
        version_summary = {
            "version_a": {
                "version_id": version_id_a,
                "name": v_a["name"],
                "slide_count": len(slides_a),
                "created_at": v_a["created_at"],
            },
            "version_b": {
                "version_id": version_id_b,
                "name": v_b["name"],
                "slide_count": len(slides_b),
                "created_at": v_b["created_at"],
            },
        }

        return {
            "success": True,
            "version_a": v_a["name"],
            "version_b": v_b["name"],
            "version_a_id": version_id_a,
            "version_b_id": version_id_b,
            "diff": diff,
            "total_changes": total_changes,
            "version_summary": version_summary,
        }

    # ========== 操作日志 & 撤销栈 ==========

    def log_action(self, task_id: str, action_type: str, description: str, undo_data: dict = None, branch_id: str = None) -> str:
        """记录用户操作到操作日志（最多100条），并压入撤销栈（100+级别）
        
        Returns the action_id of the logged action.
        """
        action_id = str(uuid.uuid4())[:8]  # 生成8位唯一ID
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                return action_id

            entry = {
                "action_id": action_id,
                "action_type": action_type,
                "description": description,
                "timestamp": get_timestamp(),
                "undo_data": undo_data,  # 撤销所需的数据
                "branch_id": branch_id,  # 分支ID（用于协作分支）
            }

            # 写入操作日志（最多100条）
            if "action_log" not in task:
                task["action_log"] = []
            task["action_log"].append(entry)
            if len(task["action_log"]) > 100:
                task["action_log"] = task["action_log"][-100:]

            # 写入完整时间线（200条）
            if "action_timeline" not in task:
                task["action_timeline"] = []
            task["action_timeline"].append(entry)
            if len(task["action_timeline"]) > 200:
                task["action_timeline"] = task["action_timeline"][-200:]

            # 压入撤销栈（100+级别）
            if undo_data is not None:
                if "undo_stack" not in task:
                    task["undo_stack"] = []
                task["undo_stack"].append(entry)
                # 清空重做栈（新操作入栈时）
                task["redo_stack"] = []
                if len(task["undo_stack"]) > 100:
                    task["undo_stack"] = task["undo_stack"][-100:]
        return action_id

    def get_action_log(self, task_id: str, limit: int = 20) -> list:
        """获取操作日志（最近limit条，默认20条）"""
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                return []
            log = task.get("action_log", [])
            return log[-limit:] if limit > 0 else log

    def get_undo_stack(self, task_id: str) -> list:
        """获取撤销栈（无限）"""
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

            # 记录撤销操作本身到日志和时间线
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
            if len(task["action_timeline"]) > 200:
                task["action_timeline"] = task["action_timeline"][-200:]

            return {
                "success": True,
                "undone_action": action.get("description", ""),
                "action_type": action_type,
            }

    def redo(self, task_id: str) -> dict:
        """重做上一个撤销的操作，返回被重做的操作信息"""
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                raise ValueError(f"Task {task_id} not found")

            redo_stack = task.get("redo_stack", [])
            if not redo_stack:
                return {"success": False, "message": "无可重做的操作"}

            # 弹出最后一个重做操作
            action = redo_stack.pop()

            # 将操作移回撤销栈（这样可以继续撤销/重做）
            undo_stack = task.get("undo_stack", [])
            undo_stack.append(action)
            task["undo_stack"] = undo_stack

            # 根据操作类型执行重做（与撤销相反的操作）
            action_type = action.get("action_type")
            undo_data = action.get("undo_data", {})

            if action_type == "outline_edit":
                # 重做大纲编辑：恢复新的大纲（undo_data里的new_outline）
                new_outline = undo_data.get("new_outline")
                if new_outline:
                    task["outline"] = new_outline
                    task["updated_at"] = get_timestamp()

            elif action_type == "slide_regenerate":
                # 重做幻灯片重生成：重新生成（这里只是标记，需要重新调用生成API）
                task["updated_at"] = get_timestamp()

            elif action_type == "slide_image":
                # 重做图片更新：重新应用新图片
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
                # 重做回滚：重新执行回滚
                rollback_data = undo_data.get("rollback_snapshot")
                if rollback_data:
                    task["result"] = rollback_data.get("result", {})
                    task["outline"] = rollback_data.get("outline", "")
                    task["updated_at"] = get_timestamp()

            # 记录重做操作到日志和时间线
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
            if len(task["action_timeline"]) > 200:
                task["action_timeline"] = task["action_timeline"][-200:]

            return {
                "success": True,
                "redone_action": action.get("description", ""),
                "action_type": action_type,
            }

    def get_redo_stack(self, task_id: str) -> list:
        """获取重做栈"""
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                return []
            return task.get("redo_stack", [])

    def get_action_timeline(self, task_id: str, limit: int = 100) -> list:
        """获取完整操作时间线（用于可视化撤销时间线）"""
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                return []
            timeline = task.get("action_timeline", [])
            return timeline[-limit:] if limit > 0 else timeline

    def undo_by_action_id(self, task_id: str, action_id: str, force: bool = False) -> dict:
        """
        撤销指定操作（选择性撤销）- 仅撤销目标操作，不影响其他操作
        force=True 时执行"分支撤销"（撤销目标及其后续所有操作）
        force=False（默认）时仅撤销目标操作（可能产生冲突，但保留其他操作）
        """
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                raise ValueError(f"Task {task_id} not found")

            undo_stack = task.get("undo_stack", [])
            # 找到指定action_id的操作
            target_index = None
            for i, entry in enumerate(undo_stack):
                if entry.get("action_id") == action_id:
                    target_index = i
                    break

            if target_index is None:
                return {"success": False, "message": f"未找到操作 {action_id}"}

            target_entry = undo_stack[target_index]

            if force:
                # 分支撤销：撤销目标及其后续所有操作
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
                # 选择性撤销：仅撤销目标操作，保留其他操作
                # 将目标从undo_stack移除，加入redo_stack
                undo_stack.pop(target_index)

                if "redo_stack" not in task:
                    task["redo_stack"] = []
                task["redo_stack"].append(target_entry)

                # 记录被撤销的操作到时间线（不执行实际撤销，保留其他操作状态）
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
        """执行单个撤销条目"""
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
                import os as _os
                _os.makedirs(_os.path.dirname(svg_path), exist_ok=True)
                with open(svg_path, 'w', encoding='utf-8') as _f:
                    _f.write(old_svg_content)
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

    # ========== 检查点系统（自动保存） ==========

    def create_checkpoint(self, task_id: str, name: str = None, checkpoint_type: str = "auto") -> dict:
        """创建检查点（用于自动保存，每5分钟）"""
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                raise ValueError(f"Task {task_id} not found")

            checkpoint_id = f"cp_{int(time.time() * 1000)}"
            checkpoint = {
                "checkpoint_id": checkpoint_id,
                "name": name or f"自动检查点",
                "type": checkpoint_type,  # auto, manual
                "created_at": get_timestamp(),
                "outline": task.get("outline"),
                "result": task.get("result"),
                "params": task.get("params"),
                "action_count": len(task.get("action_timeline", [])),
            }

            if "checkpoints" not in task:
                task["checkpoints"] = []
            task["checkpoints"].append(checkpoint)

            # 保留最近50个检查点
            if len(task["checkpoints"]) > 50:
                task["checkpoints"] = task["checkpoints"][-50:]

            # 记录到时间线
            self._add_to_timeline(task, {
                "action_id": str(uuid.uuid4())[:8],
                "action_type": "checkpoint",
                "description": f"创建检查点: {checkpoint['name']}",
                "timestamp": get_timestamp(),
                "undo_data": None,
            })

            return {"success": True, "checkpoint_id": checkpoint_id, "checkpoint": checkpoint}

    def get_checkpoints(self, task_id: str, limit: int = 20) -> list:
        """获取检查点列表"""
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                return []
            checkpoints = task.get("checkpoints", [])
            return checkpoints[-limit:] if limit > 0 else checkpoints

    def restore_checkpoint(self, task_id: str, checkpoint_id: str) -> dict:
        """从检查点恢复"""
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                raise ValueError(f"Task {task_id} not found")

            checkpoints = task.get("checkpoints", [])
            target_cp = None
            for cp in checkpoints:
                if cp.get("checkpoint_id") == checkpoint_id:
                    target_cp = cp
                    break

            if not target_cp:
                return {"success": False, "message": f"检查点 {checkpoint_id} 不存在"}

            # 保存当前状态作为回滚快照
            snapshot = {
                "outline": task.get("outline"),
                "result": task.get("result"),
                "params": task.get("params"),
            }

            # 恢复到检查点状态
            task["outline"] = target_cp.get("outline")
            task["result"] = target_cp.get("result")
            task["params"] = target_cp.get("params")
            task["updated_at"] = get_timestamp()

            # 记录恢复操作
            restore_entry = {
                "action_id": str(uuid.uuid4())[:8],
                "action_type": "checkpoint_restore",
                "description": f"从检查点恢复: {target_cp.get('name', checkpoint_id)}",
                "timestamp": get_timestamp(),
                "undo_data": {"rollback_snapshot": snapshot},
            }
            self._add_to_timeline(task, restore_entry)
            task["undo_stack"].append(restore_entry)
            task["redo_stack"] = []  # 清空重做栈

            return {"success": True, "message": f"已从 {target_cp.get('name')} 恢复"}

    def _add_to_timeline(self, task: dict, entry: dict) -> None:
        """添加条目到时间线"""
        if "action_timeline" not in task:
            task["action_timeline"] = []
        task["action_timeline"].append(entry)
        if len(task["action_timeline"]) > 200:
            task["action_timeline"] = task["action_timeline"][-200:]

    # ========== 协作编辑锁 ==========

    def acquire_collaborative_lock(self, task_id: str, user_id: str, slide_index: int = None) -> dict:
        """获取协作编辑锁（防止多用户同时编辑同一幻灯片）"""
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                raise ValueError(f"Task {task_id} not found")

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
        """释放协作编辑锁"""
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                raise ValueError(f"Task {task_id} not found")

            locks = task.get("collaborative_locks", {})
            target = f"slide_{slide_index}" if slide_index is not None else "outline"

            if target in locks and locks[target].get("user_id") == user_id:
                del locks[target]
                return {"success": True, "released": target}
            return {"success": False, "message": "未找到锁或用户不匹配"}

    def get_collaborative_locks(self, task_id: str) -> dict:
        """获取当前协作锁状态"""
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                return {"success": False, "message": "Task not found"}
            return {
                "success": True,
                "locks": task.get("collaborative_locks", {}),
            }

    def branch_version(self, task_id: str, version_id: str, branch_name: str = None) -> dict:
        """从指定版本创建分支（版本分支）"""
        version = self.get_version(task_id, version_id)
        if not version.get("success"):
            raise ValueError(f"Cannot branch: version {version_id} not found")

        v = version["version"]
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                raise ValueError(f"Task {task_id} not found")

            branch_id = f"branch_{int(time.time() * 1000)}"
            branch_version_id = f"v{int(time.time() * 1000)}"
            branch_version_data = {
                "version_id": branch_version_id,
                "task_id": task_id,
                "name": branch_name or f"分支: {v['name']}",
                "created_at": get_timestamp(),
                "config": v.get("config", {}),
                "svg_paths": v.get("svg_paths", []),
                "pptx_path": v.get("pptx_path", ""),
                "outline": v.get("outline", ""),
                "branched_from": version_id,  # 记录从哪个版本分支
                "branch_id": branch_id,  # 同一分支的版本共享branch_id
            }
            if "versions" not in task:
                task["versions"] = []
            task["versions"].append(branch_version_data)

            # 记录操作日志
            branch_entry = {
                "action_type": "branch",
                "description": f"从 {v['name']} 创建分支",
                "timestamp": get_timestamp(),
                "undo_data": None,
            }
            if "action_log" not in task:
                task["action_log"] = []
            task["action_log"].append(branch_entry)

            return {"success": True, "version_id": branch_version_id, "branch_id": branch_id}

    def merge_version(self, task_id: str, source_version_id: str, target_version_id: str = None, strategy: str = "branch_wins", slide_resolutions: dict = None) -> dict:
        """
        合并分支版本到目标版本（默认合并到当前最新版本）
        strategy: 'branch_wins' | 'main_wins' | 'newest_first' | 'manual'（手动解决冲突）
        slide_resolutions: dict of {slide_index: 'source' | 'target'} for manual conflict resolution
        """
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                raise ValueError(f"Task {task_id} not found")

            source = None
            target = None
            for v in task.get("versions", []):
                if v["version_id"] == source_version_id:
                    source = v
                if target_version_id and v["version_id"] == target_version_id:
                    target = v

            if not source:
                raise ValueError(f"Source version {source_version_id} not found")

            # 如果没有指定目标版本，查找当前分支的最新版本
            if not target:
                branch_id = source.get("branch_id")
                if branch_id:
                    branch_versions = [v for v in task.get("versions", []) if v.get("branch_id") == branch_id]
                    if branch_versions:
                        target = sorted(branch_versions, key=lambda x: x["created_at"])[-1]

            # ===== 冲突检测 =====
            current_result = task.get("result", {})
            target_svg_paths = target.get("svg_paths", []) if target else current_result.get("svg_paths", [])
            source_svg_paths = source.get("svg_paths", [])
            target_slides = target.get("config", {}).get("slides", []) if target else []
            source_slides = source.get("config", {}).get("slides", [])

            conflicts = []
            max_slides = max(len(target_svg_paths), len(source_svg_paths))
            for i in range(max_slides):
                target_svg = target_svg_paths[i] if i < len(target_svg_paths) else None
                source_svg = source_svg_paths[i] if i < len(source_svg_paths) else None
                # 冲突：两边都有SVG且不相同
                if target_svg and source_svg and target_svg != source_svg:
                    target_slide = target_slides[i] if i < len(target_slides) else {}
                    source_slide = source_slides[i] if i < len(source_slides) else {}
                    # 检查slide内容是否也不同
                    if target_slide != source_slide:
                        conflicts.append({
                            "slide_index": i + 1,
                            "source_svg": source_svg,
                            "target_svg": target_svg,
                            "source_title": source_slide.get("title", f"第{i+1}页"),
                            "target_title": target_slide.get("title", f"第{i+1}页"),
                            "conflict_type": "svg_and_content_modified",
                        })

            # 如果有冲突且不是manual策略，先返回冲突信息
            if conflicts and strategy != "manual":
                return {
                    "success": True,
                    "has_conflicts": True,
                    "conflicts": conflicts,
                    "conflict_count": len(conflicts),
                    "source_version_id": source_version_id,
                    "target_version_id": target_version_id or "current",
                    "strategy": strategy,
                    "requires_resolution": True,
                    "message": f"检测到 {len(conflicts)} 个冲突，请使用 strategy='manual' 和 slide_resolutions 参数解决冲突",
                }

            # ===== 执行合并 =====
            slide_resolutions = slide_resolutions or {}
            merged_svg_paths = []
            merged_slides = []

            for i in range(max_slides):
                target_svg = target_svg_paths[i] if i < len(target_svg_paths) else None
                source_svg = source_svg_paths[i] if i < len(source_svg_paths) else None
                target_slide = target_slides[i] if i < len(target_slides) else None
                source_slide = source_slides[i] if i < len(source_slides) else None

                if strategy == "manual" and i in slide_resolutions:
                    # 手动解决冲突
                    chosen = slide_resolutions[i]
                    if chosen == "source":
                        merged_svg_paths.append(source_svg)
                        merged_slides.append(source_slide)
                    else:
                        merged_svg_paths.append(target_svg)
                        merged_slides.append(target_slide)
                elif strategy == "branch_wins":
                    merged_svg_paths.append(source_svg if source_svg else target_svg)
                    merged_slides.append(source_slide if source_slide else target_slide)
                elif strategy == "main_wins":
                    merged_svg_paths.append(target_svg if target_svg else source_svg)
                    merged_slides.append(target_slide if target_slide else source_slide)
                else:
                    # newest_first
                    source_time = source.get("created_at", "")
                    target_time = target.get("created_at", "") if target else ""
                    if source_time >= target_time:
                        merged_svg_paths.append(source_svg if source_svg else target_svg)
                        merged_slides.append(source_slide if source_slide else target_slide)
                    else:
                        merged_svg_paths.append(target_svg if target_svg else source_svg)
                        merged_slides.append(target_slide if target_slide else source_slide)

            # 处理新增的幻灯片（一边有，一边没有）
            for i in range(max_slides, len(source_svg_paths)):
                merged_svg_paths.append(source_svg_paths[i])
                merged_slides.append(source_slides[i] if i < len(source_slides) else {})

            # 创建合并后的新版本
            merge_version_id = f"v{int(time.time() * 1000)}"
            merge_branch_id = source.get("branch_id", "merged")
            merge_name = f"合并: {source.get('name', source_version_id)}"
            if target:
                merge_name = f"合并「{target.get('name', target_version_id)}」←「{source.get('name', source_version_id)}」"

            # 构建config
            merged_config = {
                "scene": source.get("config", {}).get("scene", "business"),
                "style": source.get("config", {}).get("style", "professional"),
                "slides": merged_slides,
            }

            merge_version_data = {
                "version_id": merge_version_id,
                "task_id": task_id,
                "name": merge_name,
                "created_at": get_timestamp(),
                "tags": [],
                "config": merged_config,
                "svg_paths": merged_svg_paths,
                "svg_contents": [""],  # 合并后版本SVG内容待生成（首次访问时生成）
                "pptx_path": source.get("pptx_path", "") or (target.get("pptx_path", "") if target else ""),
                "outline": source.get("outline", "") or (target.get("outline", "") if target else ""),
                "branched_from": source_version_id,
                "branch_id": merge_branch_id,
                "merged_from": {
                    "source": source_version_id,
                    "target": target_version_id or "current",
                    "strategy": strategy,
                    "conflicts_resolved": len(conflicts) if strategy == "manual" else 0,
                }
            }

            if "versions" not in task:
                task["versions"] = []
            task["versions"].append(merge_version_data)

            # 记录操作日志
            merge_entry = {
                "action_type": "merge",
                "description": f"合并分支 {source.get('name', source_version_id)} 到 {'当前版本' if not target else target.get('name', target_version_id)}",
                "timestamp": get_timestamp(),
                "undo_data": {
                    "source_version": source_version_id,
                    "target_version": target_version_id,
                    "strategy": strategy,
                },
                "branch_id": merge_branch_id,
            }
            if "action_log" not in task:
                task["action_log"] = []
            task["action_log"].append(merge_entry)
            if "action_timeline" not in task:
                task["action_timeline"] = []
            task["action_timeline"].append(merge_entry)

            return {
                "success": True,
                "has_conflicts": bool(conflicts) and strategy != "manual",
                "conflicts": conflicts if strategy == "manual" else [],
                "conflict_count": len(conflicts),
                "version_id": merge_version_id,
                "merged_from": source_version_id,
                "merged_to": target_version_id or "current",
                "strategy": strategy,
                "merged_slide_count": len(merged_svg_paths),
            }

    def auto_save(self, task_id: str, state: dict) -> dict:
        """保存自动保存状态（用于崩溃恢复）"""
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                raise ValueError(f"Task {task_id} not found")
            task["_auto_save"] = {
                "state": state,
                "saved_at": get_timestamp(),
            }
            return {"success": True, "saved_at": get_timestamp()}

    def get_auto_save(self, task_id: str) -> dict:
        """获取自动保存状态"""
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                return {"success": False, "message": "Task not found"}
            auto_save = task.get("_auto_save")
            if not auto_save:
                return {"success": False, "message": "No auto-save found"}
            return {"success": True, "state": auto_save["state"], "saved_at": auto_save["saved_at"]}

    def register_async_task(self, task_id: str, async_task: asyncio.Task) -> None:
        """注册异步任务引用（线程安全）"""
        with self._async_tasks_lock:
            self._async_tasks[task_id] = async_task

    def get_cancel_event(self, task_id: str) -> threading.Event:
        """获取任务的取消事件标志（线程安全）
        
        PPTGenerator 在循环中应定期检查 cancel_event.is_set() 以响应取消请求。
        """
        with self._cancel_events_lock:
            if task_id not in self._cancel_events:
                self._cancel_events[task_id] = threading.Event()
            return self._cancel_events[task_id]

    def clear_cancel_event(self, task_id: str) -> None:
        """清除任务的取消事件标志（线程安全）"""
        with self._cancel_events_lock:
            if task_id in self._cancel_events:
                del self._cancel_events[task_id]

    def cancel_async_task(self, task_id: str) -> bool:
        """取消异步任务（线程安全）
        
        支持 asyncio.Task 和 threading.Thread 两种类型。
        同时设置 cancel_event 以停止正在运行的工作线程。
        """
        with self._async_tasks_lock:
            if task_id not in self._async_tasks:
                return False
            async_task = self._async_tasks[task_id]
        # 设置取消事件，通知工作线程立即停止
        self.get_cancel_event(task_id).set()
        # asyncio.Task 有 done() 方法，threading.Thread 有 is_alive() 方法
        if hasattr(async_task, 'done'):
            if async_task.done():
                with self._async_tasks_lock:
                    del self._async_tasks[task_id]
                return True
            async_task.cancel()
        elif hasattr(async_task, 'is_alive'):
            if not async_task.is_alive():
                with self._async_tasks_lock:
                    del self._async_tasks[task_id]
                return True
            # threading.Thread 不能强制取消，只能等待
            async_task.join(timeout=1.0)
        return True

    async def cancel_async_task_and_wait(self, task_id: str, timeout: float = 5.0) -> bool:
        """异步取消并等待任务结束（用于需要确保任务真正停止的场景）"""
        # 设置取消事件，通知工作线程立即停止
        self.get_cancel_event(task_id).set()
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
        cancelled = False
        # 设置取消事件，通知正在运行的工作线程立即停止
        self.get_cancel_event(task_id).set()
        with self._task_lock:
            if task_id in self.tasks:
                task = self.tasks[task_id]
                if task["status"] in ["pending", "processing"]:
                    task["status"] = "cancelled"
                    task["updated_at"] = get_timestamp()
                    cancelled = True
        # Track cancellation in advanced analytics
        if cancelled:
            try:
                from .advanced_analytics_service import get_advanced_analytics_service
                get_advanced_analytics_service().update_task_status(task_id, "cancelled")
            except Exception:
                pass
        return cancelled

    def delete_task(self, task_id: str) -> bool:
        """删除任务（批量操作使用）"""
        with self._task_lock:
            if task_id in self.tasks:
                del self.tasks[task_id]
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

    def detect_language(self, task_id: str) -> dict:
        """检测PPT内容的语言"""
        import re
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                raise ValueError(f"Task {task_id} not found")

        # Extract text from outline and slides
        texts = []
        outline = task.get("outline", {})
        if outline:
            # Extract from outline structure
            slides = outline.get("slides", [])
            for slide in slides:
                title = slide.get("title", "")
                bullets = slide.get("bullets", [])
                if title:
                    texts.append(str(title))
                if bullets:
                    for b in bullets:
                        if isinstance(b, str):
                            texts.append(b)
                        elif isinstance(b, dict):
                            texts.append(str(b.get("text", "")))

        # Also try result slides
        result = task.get("result", {})
        if result:
            slides_summary = result.get("slides_summary", [])
            for slide in slides_summary:
                title = slide.get("title", "")
                content = slide.get("content", "")
                if title:
                    texts.append(str(title))
                if content:
                    texts.append(str(content))

        full_text = " ".join(texts)[:2000]  # Limit to 2000 chars

        # Character-based language detection
        detected = self._detect_lang_from_text(full_text)
        return {
            "success": True,
            "detected_locale": detected["locale"],
            "confidence": detected["confidence"],
            "text_sample": full_text[:200],
        }

    def _detect_lang_from_text(self, text: str) -> dict:
        """Detect language from text using character analysis"""
        if not text:
            return {"locale": "en", "confidence": 0.5}

        # Arabic
        if re.search(r'[\u0600-\u06FF]', text):
            return {"locale": "ar", "confidence": 0.9}
        # Hebrew
        if re.search(r'[\u0590-\u05FF]', text):
            return {"locale": "he", "confidence": 0.9}
        # Japanese Hiragana/Katakana
        if re.search(r'[\u3040-\u309F\u30A0-\u30FF]', text):
            return {"locale": "ja", "confidence": 0.9}
        # Korean Hangul
        if re.search(r'[\uAC00-\uD7AF]', text):
            return {"locale": "ko", "confidence": 0.9}
        # Chinese
        if re.search(r'[\u4E00-\u9FFF]', text):
            return {"locale": "zh", "confidence": 0.9}
        # Spanish indicators
        if re.search(r'\b(el|la|los|las|un|una|de|que|es|en|con|para|por|está|son|tiene)\b', text, re.I) and \
           re.search(r'[áéíóúñü¿¡]', text):
            return {"locale": "es", "confidence": 0.7}
        # French indicators
        if re.search(r'\b(le|la|les|un|une|de|du|des|que|qui|est|et|en|avec|pour|dans)\b', text, re.I) and \
           re.search(r'[àâäéèêëïîôùûüÿçœæ]', text, re.I):
            return {"locale": "fr", "confidence": 0.7}
        # Default to English
        return {"locale": "en", "confidence": 0.5}

    def localize(self, task_id: str, target_locale: str, source_locale: str = None, apply_rtl: bool = False) -> dict:
        """翻译PPT内容到目标语言"""
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                raise ValueError(f"Task {task_id} not found")
            if task.get("status") != "completed":
                raise ValueError(f"Task {task_id} is not completed")

        # Detect source if not provided
        if not source_locale:
            detected = self._detect_lang_from_text("")
            source_locale = detected["locale"]

        # Create new task for localized version
        new_task_id = self.create_task(
            user_request=f"[Localized from {task_id}] {task.get('user_request', '')}",
            slide_count=task.get("slide_count", 10),
            scene=task.get("scene", "business"),
            style=task.get("style", "professional"),
            template=task.get("template", "default"),
            theme_color=task.get("theme_color", "#165DFF"),
            layout_mode=task.get("layout_mode", "auto"),
            color_scheme=task.get("color_scheme", "#165DFF"),
        )

        with self._task_lock:
            new_task = self.tasks[new_task_id]
            # Copy the outline for translation
            old_outline = task.get("outline", {})
            if old_outline:
                new_task["outline"] = self._translate_outline(old_outline, source_locale, target_locale)

            # Store locale metadata
            new_task["_localized_from"] = task_id
            new_task["_source_locale"] = source_locale
            new_task["_target_locale"] = target_locale
            new_task["_apply_rtl"] = apply_rtl

            # Mark as completed since we translated in-place
            new_task["status"] = "completed"
            new_task["progress"] = 100
            new_task["current_step"] = "已完成"
            new_task["updated_at"] = get_timestamp()

        return {
            "success": True,
            "task_id": task_id,
            "new_task_id": new_task_id,
            "target_locale": target_locale,
            "source_locale": source_locale,
            "slides_localized": len(new_task.get("outline", {}).get("slides", [])),
            "message": f"Successfully localized to {target_locale}"
        }

    def _translate_outline(self, outline: dict, source: str, target: str) -> dict:
        """Translate outline structure to target language using AI"""
        slides = outline.get("slides", [])
        translated_slides = []
        for slide in slides:
            translated_slide = dict(slide)
            # Translate title
            if slide.get("title"):
                translated_slide["title"] = self._translate_text(slide["title"], source, target)
            # Translate bullets
            bullets = slide.get("bullets", [])
            translated_bullets = []
            for b in bullets:
                if isinstance(b, str):
                    translated_bullets.append(self._translate_text(b, source, target))
                elif isinstance(b, dict):
                    translated_bullets.append({
                        "text": self._translate_text(b.get("text", ""), source, target),
                        "level": b.get("level", 0),
                    })
                else:
                    translated_bullets.append(b)
            translated_slide["bullets"] = translated_bullets
            # Translate notes
            if slide.get("notes"):
                translated_slide["notes"] = self._translate_text(slide["notes"], source, target)
            translated_slides.append(translated_slide)
        return dict(outline, slides=translated_slides)

    def _translate_text(self, text: str, source: str, target: str) -> str:
        """Translate a single text using AI API"""
        if not text or not text.strip():
            return text
        try:
            from .volc_api import VolcEngineAPI
            api = VolcEngineAPI()
            system_prompt = f"You are a professional translator. Translate the following text from {source} to {target}. Only output the translated text, nothing else."
            result = api.chat([{"role": "user", "content": text}], system_prompt=system_prompt)
            if result and isinstance(result, dict):
                return result.get("content", text)
            return text
        except Exception as e:
            import logging
            logging.warning(f"Translation failed: {e}")
            return text  # Return original on failure

    def list_language_versions(self, task_id: str) -> dict:
        """列出某个PPT的所有语言版本"""
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                raise ValueError(f"Task {task_id} not found")

            versions = []
            # The task itself
            source_locale = task.get("_source_locale") or task.get("_target_locale") or ""
            target_locale = task.get("_target_locale")
            # If this task has a _source_locale, it's a translated version
            if task.get("_localized_from"):
                source_task = self.tasks.get(task["_localized_from"])
                if source_task:
                    versions.append({
                        "task_id": task["_localized_from"],
                        "locale": source_task.get("_source_locale") or source_task.get("_target_locale") or "zh",
                        "locale_name": self._get_locale_name(source_task.get("_source_locale") or "zh"),
                        "is_original": True,
                        "is_rtl": False,
                        "created_at": source_task.get("created_at", ""),
                    })
            else:
                # This is the original - add it
                versions.append({
                    "task_id": task_id,
                    "locale": source_locale or "zh",
                    "locale_name": self._get_locale_name(source_locale or "zh"),
                    "is_original": True,
                    "is_rtl": {'ar', 'he'}.__contains__(source_locale or "zh"),
                    "created_at": task.get("created_at", ""),
                })

            # Find all tasks that were localized FROM this task
            for tid, t in self.tasks.items():
                if t.get("_localized_from") == task_id:
                    versions.append({
                        "task_id": tid,
                        "locale": t.get("_target_locale", ""),
                        "locale_name": self._get_locale_name(t.get("_target_locale", "")),
                        "is_original": False,
                        "is_rtl": t.get("_apply_rtl", False),
                        "created_at": t.get("created_at", ""),
                    })
                # Also check if this task was localized from a parent of task_id
                if task.get("_localized_from") and t.get("_localized_from") == task.get("_localized_from"):
                    # Skip - already found
                    pass

            # Also find other translated versions linked through _localized_from chain
            # Get all tasks that share the same root
            root_id = task.get("_localized_from") or task_id
            for tid, t in self.tasks.items():
                if tid != task_id and tid not in [v["task_id"] for v in versions]:
                    if t.get("_localized_from") == root_id:
                        versions.append({
                            "task_id": tid,
                            "locale": t.get("_target_locale", ""),
                            "locale_name": self._get_locale_name(t.get("_target_locale", "")),
                            "is_original": False,
                            "is_rtl": t.get("_apply_rtl", False),
                            "created_at": t.get("created_at", ""),
                        })

            return {
                "success": True,
                "root_task_id": root_id,
                "versions": versions,
                "count": len(versions),
            }

    def _get_locale_name(self, code: str) -> str:
        """Get human-readable locale name"""
        names = {
            "zh": "中文", "en": "English", "ja": "日本語",
            "ko": "한국어", "es": "Español", "fr": "Français",
            "ar": "العربية", "he": "עברית",
        }
        return names.get(code, code)

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
    # ========== A/B Testing ==========

    def create_ab_test(self, task_id: str, slide_index: int, variant_count: int = 2) -> dict:
        """为指定幻灯片创建A/B测试（生成多个变体）"""
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                raise ValueError(f"Task {task_id} not found")

            slides_summary = task.get("result", {}).get("slides_summary", [])
            if slide_index < 0 or slide_index >= len(slides_summary):
                raise ValueError(f"Slide {slide_index + 1} not found")

            original_slide = slides_summary[slide_index]
            test_id = f"ab_{int(time.time() * 1000)}"

            variants = []
            for i in range(variant_count):
                variant_slide = self._generate_slide_variant(original_slide, i, slide_index)
                variants.append({
                    "variant_id": f"{test_id}_v{i + 1}",
                    "slide_data": variant_slide,
                    "view_count": 0,
                    "click_count": 0,
                    "time_spent_ms": 0,
                    "created_at": get_timestamp(),
                })

            ab_test = {
                "test_id": test_id,
                "task_id": task_id,
                "slide_index": slide_index,
                "original_slide": original_slide,
                "variants": variants,
                "winner": None,
                "status": "running",
                "created_at": get_timestamp(),
                "total_views": 0,
            }

            if "ab_tests" not in task:
                task["ab_tests"] = []
            task["ab_tests"].append(ab_test)

            return {"success": True, "test_id": test_id, "variants": variants}

    def _generate_slide_variant(self, original: dict, variant_num: int, slide_index: int) -> dict:
        """为A/B测试生成幻灯片变体"""
        variant = dict(original)
        variant["variant_num"] = variant_num + 1

        if variant_num == 0:
            if "content" in variant and len(variant["content"]) > 200:
                lines = variant["content"].split("\n")
                variant["content"] = "\n".join(lines[:max(1, len(lines) // 2)])
                variant["_variant_strategy"] = "simplified"
        elif variant_num == 1:
            variant["_variant_strategy"] = "enhanced_visual"
            if "layout" in variant:
                layouts = ["left_text_right_image", "center", "two_column", "image_focus"]
                current = variant.get("layout", "")
                if current in layouts:
                    idx = layouts.index(current)
                    variant["layout"] = layouts[(idx + 1) % len(layouts)]

        return variant

    def list_ab_tests(self, task_id: str) -> list:
        """列出任务的所有A/B测试"""
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                return []
            tests = task.get("ab_tests", [])
            return [
                {
                    "test_id": t["test_id"],
                    "slide_index": t["slide_index"],
                    "variant_count": len(t["variants"]),
                    "status": t["status"],
                    "winner": t.get("winner"),
                    "created_at": t["created_at"],
                    "total_views": t.get("total_views", 0),
                }
                for t in tests
            ]

    def get_ab_test(self, task_id: str, test_id: str) -> dict:
        """获取A/B测试详情及性能对比"""
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                raise ValueError(f"Task {task_id} not found")

            for t in task.get("ab_tests", []):
                if t["test_id"] == test_id:
                    performance = []
                    for v in t["variants"]:
                        time_s = v.get("time_spent_ms", 0) / 1000
                        views = max(v.get("view_count", 0), 1)
                        performance.append({
                            "variant_id": v["variant_id"],
                            "views": v.get("view_count", 0),
                            "clicks": v.get("click_count", 0),
                            "avg_time_seconds": round(time_s / views, 1),
                            "engagement_rate": round(v.get("click_count", 0) / views * 100, 1) if views > 0 else 0,
                        })

                    if t["status"] == "completed" and t.get("winner"):
                        for v in t["variants"]:
                            v["is_winner"] = v["variant_id"] == t["winner"]
                    else:
                        best = max(performance, key=lambda x: x["engagement_rate"]) if performance else None
                        for p in performance:
                            p["is_winner"] = (best and p["variant_id"] == best["variant_id"])

                    return {"success": True, "test": {**t, "performance": performance}}

            raise ValueError(f"ABTest {test_id} not found")

    def track_ab_view(self, task_id: str, test_id: str, variant_id: str, time_spent_ms: int = 0) -> dict:
        """记录A/B测试变体的一次查看"""
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                raise ValueError(f"Task {task_id} not found")

            for t in task.get("ab_tests", []):
                if t["test_id"] == test_id:
                    for v in t["variants"]:
                        if v["variant_id"] == variant_id:
                            v["view_count"] = v.get("view_count", 0) + 1
                            v["time_spent_ms"] = v.get("time_spent_ms", 0) + time_spent_ms
                            t["total_views"] = t.get("total_views", 0) + 1
                            return {"success": True}

            raise ValueError(f"Variant {variant_id} not found in test {test_id}")

    def track_ab_click(self, task_id: str, test_id: str, variant_id: str) -> dict:
        """记录A/B测试变体的一次点击"""
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                raise ValueError(f"Task {task_id} not found")

            for t in task.get("ab_tests", []):
                if t["test_id"] == test_id:
                    for v in t["variants"]:
                        if v["variant_id"] == variant_id:
                            v["click_count"] = v.get("click_count", 0) + 1
                            return {"success": True}

            raise ValueError(f"Variant {variant_id} not found")

    def select_ab_winner(self, task_id: str, test_id: str, variant_id: str) -> dict:
        """选择A/B测试的获胜变体并应用"""
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                raise ValueError(f"Task {task_id} not found")

            for t in task.get("ab_tests", []):
                if t["test_id"] == test_id:
                    winner_variant = None
                    for v in t["variants"]:
                        if v["variant_id"] == variant_id:
                            winner_variant = v
                            break

                    if not winner_variant:
                        raise ValueError(f"Variant {variant_id} not found")

                    t["winner"] = variant_id
                    t["status"] = "completed"

                    slide_index = t["slide_index"]
                    slides_summary = task.get("result", {}).get("slides_summary", [])
                    if slide_index < len(slides_summary):
                        winner_data = winner_variant.get("slide_data", {})
                        slides_summary[slide_index] = {
                            **slides_summary[slide_index],
                            "title": winner_data.get("title", slides_summary[slide_index].get("title")),
                            "content": winner_data.get("content", slides_summary[slide_index].get("content")),
                            "layout": winner_data.get("layout", slides_summary[slide_index].get("layout")),
                            "_ab_winner": variant_id,
                        }

                    self.create_version(task_id, f"A/B获胜应用: {winner_variant['variant_id']}")

                    return {"success": True, "winner": variant_id}

            raise ValueError(f"ABTest {test_id} not found")

    def delete_ab_test(self, task_id: str, test_id: str) -> dict:
        """删除A/B测试"""
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                raise ValueError(f"Task {task_id} not found")

            ab_tests = task.get("ab_tests", [])
            for i, t in enumerate(ab_tests):
                if t["test_id"] == test_id:
                    ab_tests.pop(i)
                    return {"success": True, "message": f"Test {test_id} deleted"}

            raise ValueError(f"ABTest {test_id} not found")

    # ========== 幻灯片级版本历史 ==========

    def get_slide_version_history(self, task_id: str, slide_index: int) -> list:
        """获取指定幻灯片的版本历史"""
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                return []

            history = []
            for v in task.get("versions", []):
                slides = v.get("config", {}).get("slides", [])
                if slide_index < len(slides):
                    history.append({
                        "version_id": v["version_id"],
                        "version_name": v["name"],
                        "slide_index": slide_index,
                        "slide_data": slides[slide_index],
                        "created_at": v["created_at"],
                        "branch_id": v.get("branch_id"),
                    })

            return sorted(history, key=lambda x: x["created_at"])

    def record_slide_change(self, task_id: str, slide_index: int, change_type: str, old_data: dict, new_data: dict) -> None:
        """记录幻灯片的变更（用于自动版本追踪）"""
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                return

            if "slide_changes" not in task:
                task["slide_changes"] = []

            task["slide_changes"].append({
                "slide_index": slide_index,
                "change_type": change_type,
                "old_data": old_data,
                "new_data": new_data,
                "timestamp": get_timestamp(),
            })
            if len(task["slide_changes"]) > 200:
                task["slide_changes"] = task["slide_changes"][-200:]

    # ========== 智能改进建议 ==========

    def suggest_improvements(self, task_id: str) -> dict:
        """基于分析和设计原则生成幻灯片改进建议"""
        with self._task_lock:
            task = self.tasks.get(task_id)
            if not task:
                raise ValueError(f"Task {task_id} not found")

            suggestions = []
            slides_summary = task.get("result", {}).get("slides_summary", [])
            task_scene = task.get("result", {}).get("scene", "business")
            task_style = task.get("result", {}).get("style", "professional")

            for i, slide in enumerate(slides_summary):
                slide_suggestions = self._analyze_slide(slide, i, task_scene, task_style)
                suggestions.extend(slide_suggestions)

            total_slides = len(slides_summary)
            if total_slides < 5:
                suggestions.append({
                    "type": "structure", "priority": "medium", "slide": None,
                    "title": "内容较少",
                    "description": f"PPT仅{total_slides}页，建议增加到8-15页以提升完整性",
                    "action": "建议添加更多内容页，如数据页、案例页等"
                })
            elif total_slides > 20:
                suggestions.append({
                    "type": "structure", "priority": "low", "slide": None,
                    "title": "页数偏多",
                    "description": f"PPT共{total_slides}页，建议精简以提升观看体验",
                    "action": "考虑合并相近内容或删除次要页面"
                })

            if suggestions:
                suggestions.append({
                    "type": "ab_test", "priority": "medium", "slide": None,
                    "title": "启用A/B测试",
                    "description": "对关键页面进行A/B测试可提升整体效果",
                    "action": "点击'A/B测试'按钮为重要页面创建变体"
                })

            return {
                "success": True,
                "suggestions": suggestions,
                "total_slides": total_slides,
                "suggestion_count": len(suggestions),
            }

    def _analyze_slide(self, slide: dict, index: int, scene: str, style: str) -> list:
        """分析单个幻灯片并生成建议"""
        suggestions = []
        title = slide.get("title", "")
        content = slide.get("content", "")
        layout = slide.get("layout", "")

        if len(title) > 40:
            suggestions.append({
                "type": "title", "priority": "high", "slide": index + 1,
                "title": "标题过长",
                "description": f"第{index + 1}页标题超过40字符，不利于快速阅读",
                "action": f"建议精简标题，当前：{title[:30]}..."
            })

        content_len = len(content)
        if content_len > 500:
            suggestions.append({
                "type": "content_density", "priority": "high", "slide": index + 1,
                "title": "内容过密",
                "description": f"第{index + 1}页内容超过500字符，信息过载",
                "action": "建议分段或分页，每页重点突出1-2个核心信息"
            })
        elif content_len < 20 and index > 0:
            suggestions.append({
                "type": "content_empty", "priority": "medium", "slide": index + 1,
                "title": "内容过少",
                "description": f"第{index + 1}页内容不足20字符",
                "action": "建议补充更多内容或使用视觉元素填充"
            })

        if layout in ("title", "center") and index > 0 and content_len < 50:
            suggestions.append({
                "type": "layout", "priority": "low", "slide": index + 1,
                "title": "页面利用率低",
                "description": f"第{index + 1}页使用'{layout}'布局但内容较少",
                "action": "建议使用更丰富的布局或增加内容"
            })

        content_lower = content.lower()
        has_data_keywords = any(kw in content_lower for kw in ["数据", "增长", "比例", "趋势", "分析", "统计", "数字", "百分", "%", "数据来源"])
        if not has_data_keywords and index > 0:
            suggestions.append({
                "type": "visual", "priority": "low", "slide": index + 1,
                "title": "缺少数据支撑",
                "description": f"第{index + 1}页未检测到数据内容",
                "action": "建议添加图表或数据卡片增强说服力"
            })

        if index == 0:
            if not title or len(title) < 3:
                suggestions.append({
                    "type": "cover", "priority": "high", "slide": 1,
                    "title": "封面标题缺失",
                    "description": "封面缺少有效标题",
                    "action": "建议添加明确的演示标题"
                })

        return suggestions



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
