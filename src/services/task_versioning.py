"""
Task Versioning Module - Version management and diff

This module handles task versioning, rollback, and version comparison.
Extracted from task_manager.py to improve code organization.

Author: Claude
Date: 2026-04-07
"""

import logging
import time

from ..constants import (
    AUTO_VERSION_THRESHOLD,
    CONTENT_PREVIEW_LENGTH,
    OUTLINE_DIFF_THRESHOLD,
    SIGNIFICANT_CHANGE_RATIO,
    TEXT_DIFF_MAX_LINES,
)
from ..utils import get_timestamp

logger = logging.getLogger(__name__)


class TaskVersioning:
    """Task versioning and rollback operations.

    This class is responsible for:
    - Creating and managing task versions
    - Detecting significant changes
    - Rollback operations
    - Version comparison and diff
    """

    def __init__(self, task_store=None):
        """Initialize TaskVersioning.

        Args:
            task_store: Reference to TaskStore for accessing tasks.
        """
        self._task_store = task_store

    def set_task_store(self, task_store) -> None:
        """Set the task store reference."""
        self._task_store = task_store

    def create_version(self, task_id: str, version_name: str = None) -> dict:
        """Create a task snapshot version.

        Args:
            task_id: The unique identifier of the task.
            version_name: Optional name for the version.

        Returns:
            Dict with success status and version_id.
        """
        if self._task_store is None:
            return {"success": False, "message": "TaskStore not initialized"}

        with self._task_store._task_lock:
            task = self._task_store.tasks.get(task_id)
            if not task:
                return {"success": False, "message": f"Task {task_id} not found"}

            version_id = f"v{int(time.time() * 1000)}"
            slides_summary = task.get("result", {}).get("slides_summary", [])

            # Generate SVG content for visual diff
            svg_contents = []
            try:
                from .ppt_generator import PPTGenerator
                gen = PPTGenerator()
                for i, slide in enumerate(slides_summary):
                    svg_content = gen._generate_svg_smart_text(slide, i + 1)
                    svg_contents.append(svg_content)
            except Exception as e:
                logger.warning(f"Failed to generate version SVG content: {e}")
                svg_contents = []

            version_data = {
                "version_id": version_id,
                "task_id": task_id,
                "name": version_name or f"版本 {len(task.get('versions', [])) + 1}",
                "created_at": get_timestamp(),
                "tags": [],
                "config": {
                    "scene": task.get("result", {}).get("scene", "business"),
                    "style": task.get("result", {}).get("style", "professional"),
                    "slides": slides_summary,
                },
                "svg_paths": task.get("result", {}).get("svg_paths", []),
                "svg_contents": svg_contents,
                "pptx_path": task.get("result", {}).get("pptx_path", ""),
                "outline": task.get("outline", ""),
            }

            if "versions" not in task:
                task["versions"] = []
            task["versions"].append(version_data)

            return {"success": True, "version_id": version_id}

    def detect_significant_change(self, task_id: str, old_state: dict, new_state: dict) -> dict:
        """Detect if a significant change occurred.

        Significant changes include:
        - Slide count change >= 2
        - More than 50% content changed
        - Major outline structure change
        - Theme/scene/style change

        Args:
            task_id: The unique identifier of the task.
            old_state: Previous task state.
            new_state: New task state.

        Returns:
            Dict with significant flag and reasons.
        """
        if self._task_store is None:
            return {"significant": False, "reason": "TaskStore not initialized"}

        with self._task_store._task_lock:
            task = self._task_store.tasks.get(task_id)
            if not task:
                return {"significant": False, "reason": "Task not found"}

            old_slides = old_state.get("slides_summary", []) or []
            new_slides = new_state.get("slides_summary", []) or []

            reasons = []

            # 1. Large slide count change
            slide_diff = abs(len(new_slides) - len(old_slides))
            if len(new_slides) > len(old_slides) + 1:
                reasons.append(f"新增 {len(new_slides) - len(old_slides)} 页幻灯片")
            elif len(new_slides) < len(old_slides) - 1:
                reasons.append(f"删除 {len(old_slides) - len(new_slides)} 页幻灯片")

            # 2. More than 50% content changed
            if old_slides and new_slides:
                changed = 0
                max_count = max(len(old_slides), len(new_slides))
                for i in range(max_count):
                    old_s = old_slides[i] if i < len(old_slides) else None
                    new_s = new_slides[i] if i < len(new_slides) else None
                    if old_s != new_s:
                        changed += 1
                change_ratio = changed / max_count if max_count > 0 else 0
                if change_ratio >= SIGNIFICANT_CHANGE_RATIO:
                    reasons.append(f"{int(change_ratio * 100)}% 幻灯片内容变更")

            # 3. Scene/style change
            old_scene = old_state.get("scene", "")
            new_scene = new_state.get("scene", "")
            old_style = old_state.get("style", "")
            new_style = new_state.get("style", "")
            if old_scene and new_scene and old_scene != new_scene:
                reasons.append(f"场景变更: {old_scene} → {new_scene}")
            if old_style and new_style and old_style != new_style:
                reasons.append(f"风格变更: {old_style} → {new_style}")

            # 4. Major outline structure change
            old_outline = (old_state.get("outline") or "").strip()
            new_outline = (new_state.get("outline") or "").strip()
            if old_outline and new_outline:
                old_lines = len(old_outline.split('\n'))
                new_lines = len(new_outline.split('\n'))
                outline_diff = abs(new_lines - old_lines)
                if outline_diff >= OUTLINE_DIFF_THRESHOLD:
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

    def auto_version_on_significant_change(self, task_id: str, auto_version_threshold: int = None) -> dict:
        """Check and create auto-version if threshold reached.

        Args:
            task_id: The unique identifier of the task.
            auto_version_threshold: Changes needed before auto-version.

        Returns:
            Dict with auto-creation status.
        """
        if auto_version_threshold is None:
            auto_version_threshold = AUTO_VERSION_THRESHOLD

        if self._task_store is None:
            return {"success": False, "message": "TaskStore not initialized"}

        with self._task_store._task_lock:
            task = self._task_store.tasks.get(task_id)
            if not task:
                return {"success": False, "message": f"Task {task_id} not found"}

            # Initialize counters
            if "_significant_change_count" not in task:
                task["_significant_change_count"] = 0
                task["_last_auto_version_at"] = None

            count = task.get("_significant_change_count", 0)

            if count >= auto_version_threshold:
                # Create auto version
                auto_version_name = f"自动版本 (累积{count}次显著变化)"
                result = self.create_version(task_id, auto_version_name)
                # Reset counter
                task["_significant_change_count"] = 0
                task["_last_auto_version_at"] = get_timestamp()
                # Mark as auto-created
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
        """Record a significant change occurrence.

        Args:
            task_id: The unique identifier of the task.

        Returns:
            Dict with change count.
        """
        if self._task_store is None:
            return {"success": False, "message": "TaskStore not initialized"}

        with self._task_store._task_lock:
            task = self._task_store.tasks.get(task_id)
            if not task:
                return {"success": False, "message": f"Task {task_id} not found"}

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
        """Get auto-versioning status for a task.

        Args:
            task_id: The unique identifier of the task.

        Returns:
            Dict with auto-version status.
        """
        if self._task_store is None:
            return {"success": False, "message": "TaskStore not initialized"}

        with self._task_store._task_lock:
            task = self._task_store.tasks.get(task_id)
            if not task:
                return {"success": False, "message": f"Task {task_id} not found"}

            count = task.get("_significant_change_count", 0)
            last_change = task.get("_last_significant_change_at")
            last_auto = task.get("_last_auto_version_at")

            return {
                "success": True,
                "significant_change_count": count,
                "last_significant_change_at": last_change,
                "last_auto_version_at": last_auto,
                "auto_version_threshold": AUTO_VERSION_THRESHOLD,
            }

    def list_versions(self, task_id: str) -> list:
        """List all versions of a task.

        Args:
            task_id: The unique identifier of the task.

        Returns:
            List of version summaries.
        """
        if self._task_store is None:
            return []

        with self._task_store._task_lock:
            task = self._task_store.tasks.get(task_id)
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
                    "tags": v.get("tags", []),
                }
                for v in sorted(task.get("versions", []), key=lambda x: x["created_at"])
            ]

    def get_version(self, task_id: str, version_id: str) -> dict:
        """Get a specific version.

        Args:
            task_id: The unique identifier of the task.
            version_id: The version identifier.

        Returns:
            Dict with version data.
        """
        if self._task_store is None:
            return {"success": False, "message": "TaskStore not initialized"}

        with self._task_store._task_lock:
            task = self._task_store.tasks.get(task_id)
            if not task:
                return {"success": False, "message": f"Task {task_id} not found"}

            for v in task.get("versions", []):
                if v["version_id"] == version_id:
                    return {"success": True, "version": v}

            return {"success": False, "message": f"Version {version_id} not found"}

    def get_version_slide_svg(self, task_id: str, version_id: str, slide_index: int) -> dict:
        """Get SVG content for a specific slide in a version.

        Args:
            task_id: The unique identifier of the task.
            version_id: The version identifier.
            slide_index: 1-based slide index.

        Returns:
            Dict with SVG content.
        """
        if self._task_store is None:
            return {"success": False, "message": "TaskStore not initialized"}

        with self._task_store._task_lock:
            task = self._task_store.tasks.get(task_id)
            if not task:
                return {"success": False, "message": f"Task {task_id} not found"}

            for v in task.get("versions", []):
                if v["version_id"] == version_id:
                    svg_contents = v.get("svg_contents", [])
                    slides = v.get("config", {}).get("slides", [])

                    # Return pre-stored SVG content if available
                    if svg_contents and slide_index >= 1 and slide_index <= len(svg_contents):
                        return {
                            "success": True,
                            "svg_content": svg_contents[slide_index - 1],
                            "slide_index": slide_index,
                            "version_id": version_id,
                            "version_name": v.get("name", version_id),
                        }

                    # Generate SVG from slides data
                    if slide_index < 1 or slide_index > len(slides):
                        return {"success": False, "message": f"Slide {slide_index} not found"}

                    slide = slides[slide_index - 1]
                    try:
                        from .ppt_generator import PPTGenerator
                        gen = PPTGenerator()
                        svg_content = gen._generate_svg_smart_text(slide, slide_index)
                    except Exception as e:
                        logger.warning(f"Failed to generate SVG: {e}")
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

            return {"success": False, "message": f"Version {version_id} not found"}

    def rollback_version(self, task_id: str, version_id: str) -> dict:
        """Rollback to a specific version.

        Args:
            task_id: The unique identifier of the task.
            version_id: The version to rollback to.

        Returns:
            Dict with rollback status.
        """
        if self._task_store is None:
            return {"success": False, "message": "TaskStore not initialized"}

        version_result = self.get_version(task_id, version_id)
        if not version_result.get("success"):
            return {"success": False, "message": "Cannot rollback: version not found"}

        v = version_result["version"]

        with self._task_store._task_lock:
            task = self._task_store.tasks.get(task_id)
            if not task:
                return {"success": False, "message": f"Task {task_id} not found"}

            # Save current state as rollback snapshot
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
                logger.warning(f"Failed to generate rollback snapshot SVG: {e}")

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

            # Restore version data
            if task.get("result"):
                task["result"]["scene"] = v["config"]["scene"]
                task["result"]["style"] = v["config"]["style"]
                task["result"]["slides_summary"] = v["config"]["slides"]
                task["result"]["svg_paths"] = v["svg_paths"]
                task["result"]["pptx_path"] = v["pptx_path"]
            task["outline"] = v.get("outline", "")

            # Create post-rollback version marker
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

            # Record operation
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
        """Compare two versions.

        Args:
            task_id: The unique identifier of the task.
            version_id_a: First version ID.
            version_id_b: Second version ID.

        Returns:
            Dict with diff results.
        """
        if self._task_store is None:
            return {"success": False, "message": "TaskStore not initialized"}

        version_a_result = self.get_version(task_id, version_id_a)
        version_b_result = self.get_version(task_id, version_id_b)

        if not version_a_result.get("success") or not version_b_result.get("success"):
            return {"success": False, "message": "One or both versions not found"}

        v_a = version_a_result["version"]
        v_b = version_b_result["version"]

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

                svg_a = svg_paths_a[i] if i < len(svg_paths_a) else None
                svg_b = svg_paths_b[i] if i < len(svg_paths_b) else None
                svg_changed = svg_a != svg_b

                content_preview_a = (slide_a.get("content", "") or "")[:CONTENT_PREVIEW_LENGTH] if slide_a else None
                content_preview_b = (slide_b.get("content", "") or "")[:CONTENT_PREVIEW_LENGTH] if slide_b else None

                text_diff = []
                if slide_a and slide_b:
                    text_a = (slide_a.get("content") or "").split('\n')
                    text_b = (slide_b.get("content") or "").split('\n')
                    added = set(text_b) - set(text_a)
                    removed = set(text_a) - set(text_b)
                    if added:
                        text_diff.append({"type": "added", "lines": list(added)[:TEXT_DIFF_MAX_LINES]})
                    if removed:
                        text_diff.append({"type": "removed", "lines": list(removed)[:TEXT_DIFF_MAX_LINES]})

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

    def add_version_tag(self, task_id: str, version_id: str, tag: str) -> dict:
        """Add a tag to a version.

        Args:
            task_id: The unique identifier of the task.
            version_id: The version identifier.
            tag: Tag to add.

        Returns:
            Dict with operation status.
        """
        if self._task_store is None:
            return {"success": False, "message": "TaskStore not initialized"}

        with self._task_store._task_lock:
            task = self._task_store.tasks.get(task_id)
            if not task:
                return {"success": False, "message": f"Task {task_id} not found"}

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

            return {"success": False, "message": f"Version {version_id} not found"}

    def remove_version_tag(self, task_id: str, version_id: str, tag: str) -> dict:
        """Remove a tag from a version.

        Args:
            task_id: The unique identifier of the task.
            version_id: The version identifier.
            tag: Tag to remove.

        Returns:
            Dict with operation status.
        """
        if self._task_store is None:
            return {"success": False, "message": "TaskStore not initialized"}

        with self._task_store._task_lock:
            task = self._task_store.tasks.get(task_id)
            if not task:
                return {"success": False, "message": f"Task {task_id} not found"}

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

            return {"success": False, "message": f"Version {version_id} not found"}

    def get_version_tags(self, task_id: str) -> dict:
        """Get all version tags.

        Args:
            task_id: The unique identifier of the task.

        Returns:
            Dict with all tags.
        """
        if self._task_store is None:
            return {"success": True, "tags": {}}

        with self._task_store._task_lock:
            task = self._task_store.tasks.get(task_id)
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
