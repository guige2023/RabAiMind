# -*- coding: utf-8 -*-
"""
Unit Tests for Task Modules (task_store, task_queue, task_versioning)

Tests for the refactored task management modules:
- TaskStore: task storage and retrieval
- TaskQueue: task progress and async management
- TaskVersioning: version management and diff

Author: Claude
Date: 2026-04-07
"""

import pytest
import os
import sys
import time
import threading
from unittest.mock import patch, MagicMock
from typing import Dict, Any

# Add project root to path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)


# ─── Imports ──────────────────────────────────────────────────────────────────

try:
    from src.services.task_store import TaskStore
    from src.services.task_queue import TaskQueue
    from src.services.task_versioning import TaskVersioning
    from src.services.task_manager import TaskManager, get_task_manager
except ImportError as e:
    pytest.skip(f"Cannot import required modules: {e}", allow_module_level=True)


# ─── Fixtures ─────────────────────────────────────────────────────────────────

@pytest.fixture
def task_store():
    """Create a fresh TaskStore for testing."""
    store = TaskStore()
    # Clear any restored tasks for clean test state
    store.tasks.clear()
    yield store
    # Cleanup
    store.tasks.clear()


@pytest.fixture
def task_queue(task_store):
    """Create a TaskQueue with TaskStore reference."""
    queue = TaskQueue(task_store)
    queue._sync_service = MagicMock()
    yield queue


@pytest.fixture
def task_versioning(task_store):
    """Create a TaskVersioning with TaskStore reference."""
    versioning = TaskVersioning(task_store)
    yield versioning


@pytest.fixture
def task_manager():
    """Get a TaskManager instance for testing."""
    manager = TaskManager()
    yield manager
    # Cleanup tasks created during test
    for task_id in list(manager.tasks.keys())[:]:
        manager.delete_task(task_id)


# ─── Test Class: TaskStore ────────────────────────────────────────────────────

class TestTaskStoreCreation:
    """Tests for TaskStore task creation."""

    def test_create_task_returns_valid_id(self, task_store):
        """Test that create_task returns a valid string ID."""
        task_id = task_store.create_task(user_request="Test request")
        assert isinstance(task_id, str)
        assert len(task_id) > 0

    def test_create_task_stores_task(self, task_store):
        """Test that created task is stored."""
        task_id = task_store.create_task(
            user_request="Test",
            slide_count=5,
            scene="business"
        )
        task = task_store.get_task(task_id)
        assert task is not None
        assert task["user_request"] == "Test"
        assert task["slide_count"] == 5
        assert task["scene"] == "business"
        assert task["status"] == "pending"

    def test_create_task_with_defaults(self, task_store):
        """Test task creation with default values."""
        task_id = task_store.create_task(user_request="Minimal")
        task = task_store.get_task(task_id)
        assert task["slide_count"] == 10
        assert task["scene"] == "business"
        assert task["style"] == "professional"
        assert task["template"] == "default"

    def test_get_task_returns_none_for_missing(self, task_store):
        """Test get_task returns None for non-existent task."""
        result = task_store.get_task("nonexistent_id")
        assert result is None

    def test_multiple_tasks_have_unique_ids(self, task_store):
        """Test that multiple tasks get unique IDs."""
        ids = [task_store.create_task(user_request=f"Task {i}") for i in range(5)]
        assert len(set(ids)) == 5


class TestTaskStoreRetrieval:
    """Tests for TaskStore retrieval operations."""

    def test_get_history_returns_all_tasks(self, task_store):
        """Test get_history without filter returns all tasks."""
        for i in range(3):
            task_store.create_task(user_request=f"Task {i}")

        history = task_store.get_history()
        assert len(history) == 3

    def test_get_history_with_status_filter(self, task_store):
        """Test get_history with status filter."""
        task_id = task_store.create_task(user_request="Test")
        task_store.tasks[task_id]["status"] = "completed"

        completed = task_store.get_history(status_filter="completed")
        assert len(completed) == 1
        assert task_id in completed

        pending = task_store.get_history(status_filter="pending")
        assert len(pending) == 0

    def test_delete_task_removes_task(self, task_store):
        """Test delete_task removes task from store."""
        task_id = task_store.create_task(user_request="To delete")
        assert task_store.get_task(task_id) is not None

        result = task_store.delete_task(task_id)
        assert result is True
        assert task_store.get_task(task_id) is None

    def test_delete_nonexistent_task_returns_false(self, task_store):
        """Test deleting non-existent task returns False."""
        result = task_store.delete_task("nonexistent")
        assert result is False


class TestTaskStoreOutline:
    """Tests for TaskStore outline operations."""

    def test_save_and_get_outline(self, task_store):
        """Test saving and retrieving outline."""
        task_id = task_store.create_task(user_request="Test")
        outline = {"slides": [{"title": "Slide 1"}, {"Title": "Slide 2"}]}

        task_store.save_outline(task_id, outline)
        retrieved = task_store.get_outline(task_id)
        assert retrieved == outline

    def test_save_outline_nonexistent_task(self, task_store):
        """Test saving outline to non-existent task is no-op."""
        task_store.save_outline("nonexistent", {"slides": []})
        # Should not raise

    def test_update_task_params(self, task_store):
        """Test updating task parameters."""
        task_id = task_store.create_task(user_request="Test")
        params = {"theme_color": "#FF0000", "custom_option": True}

        task_store.update_task_params(task_id, params)
        task = task_store.get_task(task_id)
        assert task["params"] == params


# ─── Test Class: TaskQueue ───────────────────────────────────────────────────

class TestTaskQueueProgress:
    """Tests for TaskQueue progress updates."""

    def test_update_progress_changes_values(self, task_queue, task_store):
        """Test update_progress modifies task correctly."""
        task_id = task_store.create_task(user_request="Test")

        task_queue.update_progress(task_id, 50, "Processing images...")
        task = task_store.get_task(task_id)
        assert task["progress"] == 50
        assert task["current_step"] == "Processing images..."
        assert task["status"] == "processing"

    def test_update_progress_custom_status(self, task_queue, task_store):
        """Test update_progress uses custom status."""
        task_id = task_store.create_task(user_request="Test")

        task_queue.update_progress(task_id, 100, "Done", status="completed")
        task = task_store.get_task(task_id)
        assert task["status"] == "completed"

    def test_update_progress_nonexistent_task(self, task_queue):
        """Test update_progress with non-existent task is no-op."""
        # Should not raise
        task_queue.update_progress("nonexistent", 50, "Step")


class TestTaskQueueCancellation:
    """Tests for TaskQueue cancellation."""

    def test_get_cancel_event_creates_event(self, task_queue):
        """Test get_cancel_event creates and returns an event."""
        event = task_queue.get_cancel_event("test_task")
        assert isinstance(event, threading.Event)
        assert not event.is_set()

    def test_cancel_task_sets_status(self, task_queue, task_store):
        """Test cancel_task updates task status."""
        task_id = task_store.create_task(user_request="Test")

        result = task_queue.cancel_task(task_id)
        assert result is True
        assert task_store.get_task(task_id)["status"] == "cancelled"

    def test_cancel_already_cancelled_returns_false(self, task_queue, task_store):
        """Test cancelling already cancelled task returns False."""
        task_id = task_store.create_task(user_request="Test")
        task_queue.cancel_task(task_id)

        result = task_queue.cancel_task(task_id)
        assert result is False

    def test_cancel_nonexistent_returns_false(self, task_queue):
        """Test cancelling non-existent task returns False."""
        result = task_queue.cancel_task("nonexistent")
        assert result is False

    def test_is_cancelled_after_cancel(self, task_queue, task_store):
        """Test is_cancelled returns True after cancel."""
        task_id = task_store.create_task(user_request="Test")
        event = task_queue.get_cancel_event(task_id)

        assert not task_queue.is_cancelled(task_id)
        event.set()
        assert task_queue.is_cancelled(task_id)

    def test_clear_cancel_event(self, task_queue, task_store):
        """Test clear_cancel_event removes the event."""
        task_id = task_store.create_task(user_request="Test")
        task_queue.get_cancel_event(task_id)

        task_queue.clear_cancel_event(task_id)
        # After clear, a new event is created (not set)
        new_event = task_queue.get_cancel_event(task_id)
        assert not new_event.is_set()


class TestTaskQueueComplete:
    """Tests for TaskQueue task completion."""

    def test_complete_task_updates_status(self, task_queue, task_store):
        """Test complete_task sets status to completed."""
        task_id = task_store.create_task(user_request="Test")

        # Create a temp file for the test
        import tempfile
        with tempfile.NamedTemporaryFile(suffix=".pptx", delete=False) as f:
            pptx_path = f.name

        try:
            task_queue.complete_task(
                task_id=task_id,
                pptx_path=pptx_path,
                slide_count=5,
                file_size=1024
            )
            task = task_store.get_task(task_id)
            assert task["status"] == "completed"
            assert task["progress"] == 100
            assert task["result"]["slide_count"] == 5
        finally:
            os.unlink(pptx_path)


class TestTaskQueueFail:
    """Tests for TaskQueue task failure."""

    def test_fail_task_updates_status(self, task_queue, task_store):
        """Test fail_task sets status to failed."""
        task_id = task_store.create_task(user_request="Test")

        task_queue.fail_task(task_id, "ERROR_CODE", "Error message")
        task = task_store.get_task(task_id)
        assert task["status"] == "failed"
        assert task["error"]["code"] == "ERROR_CODE"
        assert task["error"]["message"] == "Error message"


# ─── Test Class: TaskVersioning ──────────────────────────────────────────────

class TestTaskVersioning:
    """Tests for TaskVersioning functionality."""

    def test_create_version_returns_version_id(self, task_versioning, task_store):
        """Test create_version returns a version_id."""
        task_id = task_store.create_task(user_request="Test")
        # Set up minimal result data
        task_store.tasks[task_id]["result"] = {
            "slides_summary": [{"title": "Slide 1"}],
            "scene": "business",
            "style": "professional"
        }

        result = task_versioning.create_version(task_id, "Test Version")
        assert result["success"] is True
        assert "version_id" in result

    def test_create_version_invalid_task(self, task_versioning):
        """Test create_version with invalid task returns error."""
        result = task_versioning.create_version("nonexistent", "Version")
        assert result["success"] is False

    def test_detect_significant_change_detects_slide_count(self, task_versioning, task_store):
        """Test detect_significant_change detects slide count changes."""
        task_id = task_store.create_task(user_request="Test")

        old_state = {"slides_summary": [{"title": "A"}, {"title": "B"}]}
        new_state = {"slides_summary": [{"title": "A"}, {"title": "B"}, {"title": "C"}, {"title": "D"}, {"title": "E"}]}

        result = task_versioning.detect_significant_change(task_id, old_state, new_state)
        assert result["significant"] is True
        assert any("新增" in r for r in result["reasons"])

    def test_detect_significant_change_detects_scene_change(self, task_versioning, task_store):
        """Test detect_significant_change detects scene changes."""
        task_id = task_store.create_task(user_request="Test")

        old_state = {"slides_summary": [], "scene": "business", "style": "professional"}
        new_state = {"slides_summary": [], "scene": "academic", "style": "professional"}

        result = task_versioning.detect_significant_change(task_id, old_state, new_state)
        assert result["significant"] is True
        assert any("场景变更" in r for r in result["reasons"])

    def test_record_significant_change_increments_count(self, task_versioning, task_store):
        """Test record_significant_change increments counter."""
        task_id = task_store.create_task(user_request="Test")

        result1 = task_versioning.record_significant_change(task_id)
        assert result1["significant_change_count"] == 1

        result2 = task_versioning.record_significant_change(task_id)
        assert result2["significant_change_count"] == 2

    def test_list_versions_empty(self, task_versioning, task_store):
        """Test list_versions returns empty list for task with no versions."""
        task_id = task_store.create_task(user_request="Test")
        versions = task_versioning.list_versions(task_id)
        assert versions == []

    def test_list_versions_after_create(self, task_versioning, task_store):
        """Test list_versions returns versions after creation."""
        task_id = task_store.create_task(user_request="Test")
        task_store.tasks[task_id]["result"] = {
            "slides_summary": [{"title": "Slide 1"}],
            "scene": "business",
            "style": "professional"
        }

        task_versioning.create_version(task_id, "Version 1")
        task_versioning.create_version(task_id, "Version 2")

        versions = task_versioning.list_versions(task_id)
        assert len(versions) == 2
        assert versions[0]["name"] == "Version 1"
        assert versions[1]["name"] == "Version 2"

    def test_get_version_returns_version(self, task_versioning, task_store):
        """Test get_version returns correct version."""
        task_id = task_store.create_task(user_request="Test")
        task_store.tasks[task_id]["result"] = {
            "slides_summary": [{"title": "Slide 1"}],
            "scene": "business",
            "style": "professional"
        }

        create_result = task_versioning.create_version(task_id, "My Version")
        version_id = create_result["version_id"]

        result = task_versioning.get_version(task_id, version_id)
        assert result["success"] is True
        assert result["version"]["name"] == "My Version"

    def test_get_version_invalid_id(self, task_versioning, task_store):
        """Test get_version with invalid version ID."""
        task_id = task_store.create_task(user_request="Test")
        result = task_versioning.get_version(task_id, "invalid_id")
        assert result["success"] is False

    def test_add_version_tag(self, task_versioning, task_store):
        """Test adding a tag to a version."""
        task_id = task_store.create_task(user_request="Test")
        task_store.tasks[task_id]["result"] = {
            "slides_summary": [{"title": "Slide 1"}],
            "scene": "business",
            "style": "professional"
        }

        create_result = task_versioning.create_version(task_id, "Version")
        version_id = create_result["version_id"]

        result = task_versioning.add_version_tag(task_id, version_id, "important")
        assert result["success"] is True
        assert "important" in result["tags"]

    def test_remove_version_tag(self, task_versioning, task_store):
        """Test removing a tag from a version."""
        task_id = task_store.create_task(user_request="Test")
        task_store.tasks[task_id]["result"] = {
            "slides_summary": [{"title": "Slide 1"}],
            "scene": "business",
            "style": "professional"
        }

        create_result = task_versioning.create_version(task_id, "Version")
        version_id = create_result["version_id"]

        task_versioning.add_version_tag(task_id, version_id, "important")
        result = task_versioning.remove_version_tag(task_id, version_id, "important")
        assert result["success"] is True
        assert "important" not in result["tags"]

    def test_get_version_tags(self, task_versioning, task_store):
        """Test getting all version tags."""
        task_id = task_store.create_task(user_request="Test")
        task_store.tasks[task_id]["result"] = {
            "slides_summary": [{"title": "Slide 1"}],
            "scene": "business",
            "style": "professional"
        }

        v1_result = task_versioning.create_version(task_id, "V1")
        v2_result = task_versioning.create_version(task_id, "V2")

        task_versioning.add_version_tag(task_id, v1_result["version_id"], "draft")
        task_versioning.add_version_tag(task_id, v2_result["version_id"], "final")

        result = task_versioning.get_version_tags(task_id)
        assert "draft" in result["tags"]
        assert "final" in result["tags"]


# ─── Test Class: TaskManager Integration ─────────────────────────────────────

class TestTaskManagerDelegation:
    """Tests to verify TaskManager delegates correctly."""

    def test_task_manager_has_store(self, task_manager):
        """Test TaskManager has _task_store."""
        assert hasattr(task_manager, "_task_store")
        assert isinstance(task_manager._task_store, TaskStore)

    def test_task_manager_has_queue(self, task_manager):
        """Test TaskManager has _task_queue."""
        assert hasattr(task_manager, "_task_queue")
        assert isinstance(task_manager._task_queue, TaskQueue)

    def test_task_manager_has_versioning(self, task_manager):
        """Test TaskManager has _task_versioning."""
        assert hasattr(task_manager, "_task_versioning")
        assert isinstance(task_manager._task_versioning, TaskVersioning)

    def test_delegated_create_task(self, task_manager):
        """Test TaskManager.create_task delegates to store."""
        task_id = task_manager.create_task(user_request="Delegated test")
        assert task_manager.get_task(task_id) is not None

    def test_delegated_update_progress(self, task_manager):
        """Test TaskManager.update_progress delegates to queue."""
        task_id = task_manager.create_task(user_request="Test")
        task_manager.update_progress(task_id, 50, "Halfway")
        task = task_manager.get_task(task_id)
        assert task["progress"] == 50

    def test_delegated_version_creation(self, task_manager):
        """Test TaskManager.create_version delegates to versioning."""
        task_id = task_manager.create_task(user_request="Test")
        task_manager.tasks[task_id]["result"] = {
            "slides_summary": [{"title": "Slide 1"}],
            "scene": "business",
            "style": "professional"
        }

        result = task_manager.create_version(task_id, "Manager Version")
        assert result["success"] is True


# ─── Main ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    pytest.main([__file__, "-v"])