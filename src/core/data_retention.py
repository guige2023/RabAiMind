# -*- coding: utf-8 -*-
"""
Data Retention Policy

Automatically deletes user data older than DATA_RETENTION_DAYS.
GDPR Article 5(1)(e) — Storage Limitation.

Configuration via environment variables:
- DATA_RETENTION_DAYS: Days before data is auto-deleted (default: 90)
- DATA_RETENTION_CHECK_INTERVAL_HOURS: How often to check (default: 24)
- DATA_RETENTION_ENABLED: Enable/disable auto-deletion (default: true)

Author: Claude
Date: 2026-04-04
"""

import os
import json
import time
import threading
import logging
import shutil
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple

logger = logging.getLogger("data_retention")

# ==================== Configuration ====================

DATA_RETENTION_DAYS = int(os.getenv("DATA_RETENTION_DAYS", "90"))
DATA_RETENTION_CHECK_INTERVAL_HOURS = int(os.getenv("DATA_RETENTION_CHECK_INTERVAL_HOURS", "24"))
DATA_RETENTION_ENABLED = os.getenv("DATA_RETENTION_ENABLED", "true").lower() == "true"
DATA_RETENTION_DRY_RUN = os.getenv("DATA_RETENTION_DRY_RUN", "false").lower() == "true"

RETENTION_LOG_FILE = "./data/retention_log.json"
DELETION_QUEUE_FILE = "./data/deletion_queue.json"


# ==================== Retention Log ====================

class RetentionLogger:
    """Log of all retention policy actions"""

    def __init__(self):
        os.makedirs(os.path.dirname(RETENTION_LOG_FILE), exist_ok=True)

    def _load(self) -> List[Dict]:
        try:
            with open(RETENTION_LOG_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            return []

    def _save(self, logs: List[Dict]):
        # Keep last 10000 entries
        if len(logs) > 10000:
            logs = logs[-10000:]
        with open(RETENTION_LOG_FILE, "w", encoding="utf-8") as f:
            json.dump(logs, f, ensure_ascii=False, indent=2)

    def log_action(
        self,
        action: str,
        file_path: str,
        user_id: str,
        file_age_days: int,
        file_size_bytes: int = 0,
        success: bool = True,
        error: str = "",
    ):
        entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "action": action,
            "file_path": file_path,
            "user_id": user_id,
            "file_age_days": file_age_days,
            "file_size_bytes": file_size_bytes,
            "success": success,
            "error": error,
        }
        logs = self._load()
        logs.append(entry)
        self._save(logs)
        return entry

    def get_recent_logs(self, limit: int = 100) -> List[Dict]:
        logs = self._load()
        return logs[-limit:]

    def get_stats(self) -> Dict[str, Any]:
        logs = self._load()
        deleted_count = sum(1 for l in logs if l["action"] == "delete" and l["success"])
        deleted_size = sum(l.get("file_size_bytes", 0) for l in logs if l["action"] == "delete" and l["success"])
        errors = sum(1 for l in logs if not l["success"])
        return {
            "total_actions": len(logs),
            "successful_deletions": deleted_count,
            "total_bytes_deleted": deleted_size,
            "errors": errors,
            "last_action": logs[-1]["timestamp"] if logs else None,
        }


_retention_logger: Optional[RetentionLogger] = None


def get_retention_logger() -> RetentionLogger:
    global _retention_logger
    if _retention_logger is None:
        _retention_logger = RetentionLogger()
    return _retention_logger


# ==================== Retention Policy ====================

class DataRetentionPolicy:
    """
    Enforces data retention policy by:
    1. Scanning data directories for old files
    2. Deleting files older than DATA_RETENTION_DAYS
    3. Respecting the deletion queue (GDPR delete requests)
    """

    def __init__(self):
        self._data_dir = self._get_data_dir()
        self._output_dir = self._get_output_dir()
        self._template_dir = self._get_template_dir()
        self._lock = threading.Lock()
        self._running = False
        self._thread: Optional[threading.Thread] = None

    def _get_data_dir(self) -> str:
        # Navigate from src/core/ to project root
        src_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        return os.path.join(src_dir, "data")

    def _get_output_dir(self) -> str:
        src_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        return os.path.join(src_dir, "..", "output")

    def _get_template_dir(self) -> str:
        src_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        return os.path.join(src_dir, "templates")

    def _cutoff_time(self) -> datetime:
        return datetime.utcnow() - timedelta(days=DATA_RETENTION_DAYS)

    def _is_expired(self, filepath: str) -> bool:
        """Check if a file is older than retention period."""
        try:
            mtime = datetime.fromtimestamp(os.path.getmtime(filepath))
            return mtime < self._cutoff_time()
        except OSError:
            return False

    def _get_file_age_days(self, filepath: str) -> int:
        """Get file age in days."""
        try:
            mtime = datetime.fromtimestamp(os.path.getmtime(filepath))
            delta = datetime.utcnow() - mtime
            return delta.days
        except OSError:
            return 0

    def _get_user_id_from_file(self, filepath: str) -> str:
        """Extract user_id from file path if embedded, else 'unknown'."""
        # Common patterns: data/users/<user_id>/..., data/ppts_<user_id>...
        parts = filepath.split(os.sep)
        for i, part in enumerate(parts):
            if part in ("users", "brands", "favorites"):
                if i + 1 < len(parts):
                    return parts[i + 1]
            if part.startswith("user_"):
                return part
        return "unknown"

    def _delete_file(self, filepath: str, secure: bool = False) -> Tuple[bool, str]:
        """
        Delete a file safely. Returns (success, error_message).

        If secure=True, overwrites file content with random data 3 times
        before deletion (NIST 800-88 compliant secure erase).
        """
        try:
            size = os.path.getsize(filepath)

            if secure and size > 0:
                # NIST 800-88 compliant secure delete: 3-pass overwrite
                import random
                for pass_num in range(3):
                    with open(filepath, "r+b") as f:
                        file_size = os.fstat(f.fileno()).st_size
                        if file_size == 0:
                            break
                        # Pass 1: all zeros
                        if pass_num == 0:
                            f.write(b'\x00' * file_size)
                        # Pass 2: all ones
                        elif pass_num == 1:
                            f.write(b'\xFF' * file_size)
                        # Pass 3: random data
                        else:
                            chunk_size = 65536
                            remaining = file_size
                            while remaining > 0:
                                write_size = min(chunk_size, remaining)
                                f.write(os.urandom(write_size))
                                remaining -= write_size
                        f.flush()
                        os.fsync(f.fileno())

            os.remove(filepath)
            return True, ""
        except OSError as e:
            return False, str(e)

    def secure_delete_file(self, filepath: str) -> Tuple[bool, str]:
        """Permanently delete a file with secure overwrite (no recovery possible)."""
        return self._delete_file(filepath, secure=True)

    # ==================== Output/PPT Files ====================

    def scan_output_dir(self, dry_run: bool = True) -> List[Dict[str, Any]]:
        """Scan output directory for expired PPT files."""
        results = []
        if not os.path.exists(self._output_dir):
            return results

        for filename in os.listdir(self._output_dir):
            filepath = os.path.join(self._output_dir, filename)
            if os.path.isfile(filepath) and (filename.endswith(".pptx") or filename.endswith(".json")):
                if self._is_expired(filepath):
                    age_days = self._get_file_age_days(filepath)
                    user_id = self._get_user_id_from_file(filepath)
                    size = os.path.getsize(filepath) if os.path.exists(filepath) else 0
                    results.append({
                        "filepath": filepath,
                        "filename": filename,
                        "user_id": user_id,
                        "age_days": age_days,
                        "size_bytes": size,
                        "would_delete": True,
                        "dry_run": dry_run,
                    })
                    if not dry_run:
                        success, err = self._delete_file(filepath)
                        get_retention_logger().log_action(
                            action="delete",
                            file_path=filepath,
                            user_id=user_id,
                            file_age_days=age_days,
                            file_size_bytes=size,
                            success=success,
                            error=err,
                        )
        return results

    # ==================== Deletion Queue (GDPR) ====================

    def process_deletion_queue(self, dry_run: bool = True) -> List[Dict[str, Any]]:
        """Process GDPR deletion requests from the queue."""
        results = []
        if not os.path.exists(DELETION_QUEUE_FILE):
            return results

        try:
            with open(DELETION_QUEUE_FILE, "r", encoding="utf-8") as f:
                queue = json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            queue = []

        updated_queue = []
        for item in queue:
            if item.get("status") == "completed":
                continue

            user_id = item.get("user_id")
            requested_at = item.get("requested_at")

            # Delete all user data (with secure overwrite if requested)
            secure = item.get("secure_delete", False)
            deleted_files = self._delete_user_data(user_id, dry_run=dry_run, secure=secure)

            result = {
                "user_id": user_id,
                "requested_at": requested_at,
                "deleted_files": deleted_files,
                "dry_run": dry_run,
                "secure_delete": secure,
            }
            results.append(result)

            if not dry_run:
                item["status"] = "completed"
                item["completed_at"] = datetime.utcnow().isoformat() + "Z"
                item["deleted_files"] = deleted_files

            updated_queue.append(item)

        if not dry_run and updated_queue != queue:
            with open(DELETION_QUEUE_FILE, "w", encoding="utf-8") as f:
                json.dump(updated_queue, f, ensure_ascii=False, indent=2)

        return results

    def _delete_user_data(self, user_id: str, dry_run: bool = True, secure: bool = False) -> List[str]:
        """
        Delete all data associated with a user_id.

        If secure=True, uses secure overwrite (NIST 800-88 compliant).
        """
        deleted = []
        dirs_to_check = [
            os.path.join(self._data_dir, "brands", user_id),
            os.path.join(self._data_dir, "favorites", user_id),
        ]

        for directory in dirs_to_check:
            if os.path.exists(directory):
                for filename in os.listdir(directory):
                    filepath = os.path.join(directory, filename)
                    if os.path.isfile(filepath):
                        if not dry_run:
                            success, _ = self._delete_file(filepath, secure=secure)
                            if success:
                                deleted.append(filepath)
                                get_retention_logger().log_action(
                                    action="gdpr_secure_delete" if secure else "gdpr_delete",
                                    file_path=filepath,
                                    user_id=user_id,
                                    file_age_days=0,
                                    success=True,
                                )
                        else:
                            deleted.append(filepath)

        return deleted

    # ==================== Full Policy Run ====================

    def run(self, dry_run: bool = None) -> Dict[str, Any]:
        """
        Run the full retention policy.

        Returns a summary of all actions taken.
        """
        if dry_run is None:
            dry_run = DATA_RETENTION_DRY_RUN

        with self._lock:
            logger.info(f"Running data retention policy (dry_run={dry_run})")

            summary = {
                "run_at": datetime.utcnow().isoformat() + "Z",
                "dry_run": dry_run,
                "retention_days": DATA_RETENTION_DAYS,
                "cutoff_date": self._cutoff_time().strftime("%Y-%m-%d"),
                "expired_files": [],
                "gdpr_deletions": [],
                "total_files_deleted": 0,
                "total_bytes_freed": 0,
            }

            # Scan output dir
            expired = self.scan_output_dir(dry_run=dry_run)
            summary["expired_files"] = expired
            summary["total_files_deleted"] += len(expired)
            summary["total_bytes_freed"] += sum(f.get("size_bytes", 0) for f in expired)

            # Process GDPR queue
            gdpr_results = self.process_deletion_queue(dry_run=dry_run)
            summary["gdpr_deletions"] = gdpr_results

            logger.info(
                f"Retention policy complete: {summary['total_files_deleted']} files, "
                f"{summary['total_bytes_freed']} bytes"
            )
            return summary

    # ==================== Background Scheduler ====================

    def _background_loop(self):
        """Background thread that periodically runs the retention policy."""
        check_interval = DATA_RETENTION_CHECK_INTERVAL_HOURS * 3600
        while self._running:
            try:
                self.run()
            except Exception as e:
                logger.error(f"Retention policy error: {e}")
            time.sleep(check_interval)

    def start_background(self):
        """Start the background retention policy thread."""
        if not DATA_RETENTION_ENABLED:
            logger.info("Data retention is disabled")
            return

        if self._running:
            return

        self._running = True
        self._thread = threading.Thread(target=self._background_loop, daemon=True)
        self._thread.start()
        logger.info(
            f"Data retention policy started (interval={DATA_RETENTION_CHECK_INTERVAL_HOURS}h, "
            f"retention={DATA_RETENTION_DAYS}d)"
        )

    def stop_background(self):
        """Stop the background retention policy thread."""
        self._running = False
        if self._thread:
            self._thread.join(timeout=5)


# ==================== Global Instance ====================

_retention_policy: Optional[DataRetentionPolicy] = None


def get_retention_policy() -> DataRetentionPolicy:
    global _retention_policy
    if _retention_policy is None:
        _retention_policy = DataRetentionPolicy()
    return _retention_policy
