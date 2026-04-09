"""
User Service

Manages user preferences, profiles, and data export.
Simple JSON file-based storage (no database dependency).

Author: Claude
Date: 2026-04-04
"""

import json
import logging
import os
from datetime import datetime
from typing import Any

logger = logging.getLogger(__name__)

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
PREFS_FILE = os.path.join(DATA_DIR, "user_preferences.json")
PROFILE_FILE = os.path.join(DATA_DIR, "user_profile.json")
STATS_FILE = os.path.join(DATA_DIR, "user_stats.json")

# Default preferences
DEFAULT_PREFERENCES = {
    "theme": "auto",
    "language": "zh",
    "notifications": {
        "email_on_complete": True,
        "push_on_complete": True,
        "weekly_summary": False,
        "collab_joined_push": True,
        "collab_joined_email": False,
    },
    "accessibility": {
        "reduce_motion": False,
        "high_contrast": False,
        "font_size": "medium"
    },
    "editor": {
        "auto_save": True,
        "auto_save_interval": 30,
        "show_grid": True,
        "snap_to_grid": True
    },
    # R129: PPT generation defaults
    "ppt_generation": {
        "default_category": "business",
        "default_style": "modern",
        "default_slide_count": 10,
        "auto_enhance": True,
        "include_transitions": True
    },
    # R129: Export defaults
    "export": {
        "default_format": "pptx",
        "default_quality": "high",
        "include_notes": True,
        "include_speaker_guide": False
    },
    # R129: Presentation mode defaults
    "presentation": {
        "auto_advance": False,
        "auto_advance_seconds": 10,
        "show_progress_bar": True,
        "show_timer": True,
        "laser_pointer_enabled": True
    }
}

# Default profile
DEFAULT_PROFILE = {
    "name": "",
    "email": "",
    "avatar": "",
    "created_at": ""
}

# Ensure data directory exists
os.makedirs(DATA_DIR, exist_ok=True)


def _load_json(path: str, default: Any) -> Any:
    """Load JSON from file, return default if missing/error."""
    try:
        if os.path.exists(path):
            with open(path, encoding="utf-8") as f:
                return json.load(f)
    except Exception as e:
        logger.warning(f"Failed to load {path}: {e}")
    return default


def _save_json(path: str, data: Any) -> None:
    """Save JSON to file atomically."""
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    os.replace(tmp, path)


class UserService:
    """User preferences, profile, and data management."""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self._preferences: dict[str, Any] = _load_json(PREFS_FILE, DEFAULT_PREFERENCES.copy())
        self._profile: dict[str, Any] = _load_json(PROFILE_FILE, DEFAULT_PROFILE.copy())
        self._ensure_defaults()

    def _ensure_defaults(self):
        """Ensure all default keys exist in preferences."""
        for key, val in DEFAULT_PREFERENCES.items():
            if key not in self._preferences:
                self._preferences[key] = val

    # ── Preferences ────────────────────────────────────────────────

    def get_preferences(self) -> dict[str, Any]:
        """Get all user preferences."""
        return self._preferences.copy()

    def update_preferences(self, updates: dict[str, Any]) -> dict[str, Any]:
        """Merge updates into preferences and save."""
        # Validate nested keys
        if "notifications" in updates:
            for k, v in updates["notifications"].items():
                if k in self._preferences.get("notifications", {}):
                    self._preferences["notifications"][k] = v
        if "accessibility" in updates:
            for k, v in updates["accessibility"].items():
                if k in self._preferences.get("accessibility", {}):
                    self._preferences["accessibility"][k] = v
        if "editor" in updates:
            for k, v in updates["editor"].items():
                if k in self._preferences.get("editor", {}):
                    self._preferences["editor"][k] = v
        if "theme" in updates:
            if updates["theme"] in ("light", "dark", "auto"):
                self._preferences["theme"] = updates["theme"]
        if "language" in updates:
            if updates["language"] in ("zh", "en", "ja", "ko"):
                self._preferences["language"] = updates["language"]
        # R129: Handle new preference categories
        if "ppt_generation" in updates:
            for k, v in updates["ppt_generation"].items():
                if k in self._preferences.get("ppt_generation", {}):
                    self._preferences["ppt_generation"][k] = v
        if "export" in updates:
            for k, v in updates["export"].items():
                if k in self._preferences.get("export", {}):
                    self._preferences["export"][k] = v
        if "presentation" in updates:
            for k, v in updates["presentation"].items():
                if k in self._preferences.get("presentation", {}):
                    self._preferences["presentation"][k] = v

        _save_json(PREFS_FILE, self._preferences)
        return self.get_preferences()

    def reset_preferences(self) -> dict[str, Any]:
        """Reset all preferences to defaults."""
        self._preferences = DEFAULT_PREFERENCES.copy()
        _save_json(PREFS_FILE, self._preferences)
        return self.get_preferences()

    # ── Profile ─────────────────────────────────────────────────────

    def get_profile(self) -> dict[str, Any]:
        """Get user profile."""
        return self._profile.copy()

    def update_profile(self, updates: dict[str, Any]) -> dict[str, Any]:
        """Update profile fields (name, email, avatar)."""
        allowed = {"name", "email", "avatar"}
        for key, val in updates.items():
            if key in allowed:
                self._profile[key] = val
        _save_json(PROFILE_FILE, self._profile)
        return self.get_profile()

    def update_password(self, old_password: str, new_password: str) -> dict[str, str]:
        """
        Change password.
        For demo: simple check (old_password must be non-empty, new must be 6+ chars).
        Returns {"success": true} or {"error": "..."}.
        """
        if not old_password:
            return {"error": "旧密码不能为空"}
        if len(new_password) < 6:
            return {"error": "新密码至少6个字符"}
        # In production: verify old_password hash, then store new hash
        return {"success": True}

    # ── Stats ──────────────────────────────────────────────────────

    def get_stats(self, tasks: list) -> dict[str, Any]:
        """
        Compute personal usage stats from task history.
        Returns summary similar to analytics but scoped to user.
        """
        completed = [t for t in tasks if t.get("status") == "completed"]
        total = len(completed)
        total_slides = sum(t.get("slide_count", 0) or 0 for t in completed)
        total_time = 0
        for t in completed:
            created = t.get("created_at", "")
            updated = t.get("updated_at", "")
            if created and updated:
                try:
                    c = datetime.fromisoformat(created.replace("Z", "+00:00"))
                    u = datetime.fromisoformat(updated.replace("Z", "+00:00"))
                    delta = (u - c).total_seconds()
                    if 0 < delta < 7200:
                        total_time += delta
                except Exception:
                    pass

        # Per-template count
        templates: dict[str, int] = {}
        for t in completed:
            tmpl = t.get("template", "default") or "default"
            templates[tmpl] = templates.get(tmpl, 0) + 1

        # Per-style count
        styles: dict[str, int] = {}
        for t in completed:
            style = t.get("style", "professional") or "professional"
            styles[style] = styles.get(style, 0) + 1

        # Recent 7 days activity
        recent_days: dict[str, int] = {}
        now = datetime.now()
        for i in range(7):
            day = (now - datetime.timedelta(days=i)).strftime("%Y-%m-%d")
            recent_days[day] = 0
        for t in completed:
            created = t.get("created_at", "")
            if created:
                day = created[:10]
                if day in recent_days:
                    recent_days[day] += 1

        return {
            "total_generations": total,
            "total_slides": total_slides,
            "total_time_seconds": total_time,
            "avg_slides": round(total_slides / total, 1) if total > 0 else 0,
            "avg_time_seconds": round(total_time / total, 1) if total > 0 else 0,
            "templates_used": len(templates),
            "top_templates": sorted(templates.items(), key=lambda x: -x[1])[:5],
            "top_styles": sorted(styles.items(), key=lambda x: -x[1])[:5],
            "recent_7days": [{"date": k, "count": v} for k, v in sorted(recent_days.items())],
            "success": True
        }

    # ── Data Export ─────────────────────────────────────────────────

    def export_all_data(self, tasks: list) -> dict[str, Any]:
        """Export all user data as a JSON blob."""
        return {
            "exported_at": datetime.now().isoformat(),
            "profile": self.get_profile(),
            "preferences": self.get_preferences(),
            "stats": self.get_stats(tasks),
            "tasks": tasks,
            "success": True
        }


def get_user_service() -> UserService:
    return UserService()
