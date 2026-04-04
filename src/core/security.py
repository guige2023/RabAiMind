# -*- coding: utf-8 -*-
"""
Security Module — RBAC, API Key Management, Audit Logging, Secure Share

Author: Claude (R42)
Date: 2026-04-04
"""

import os
import json
import time
import uuid
import hashlib
import secrets
import threading
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List, Literal
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from functools import wraps

logger = logging.getLogger("security")


# ==================== Enums ====================

class Role(str, Enum):
    ADMIN = "admin"
    USER = "user"
    GUEST = "guest"

    @classmethod
    def from_string(cls, s: str) -> "Role":
        try:
            return cls(s.lower())
        except ValueError:
            return Role.GUEST


# ==================== RBAC ====================

# Permission map: role -> set of allowed actions
ROLE_PERMISSIONS: Dict[Role, set] = {
    Role.ADMIN: {
        # Full access
        "ppt:generate", "ppt:edit", "ppt:delete", "ppt:export",
        "ppt:plan", "ppt:preview", "ppt:versions", "ppt:rollback",
        "template:list", "template:create", "template:delete", "template:manage",
        "favorites:list", "favorites:add", "favorites:remove",
        "brand:list", "brand:create", "brand:delete",
        "images:upload", "images:delete",
        "analytics:view",
        "users:manage",           # admin-only
        "apikeys:manage",         # admin-only
        "audit:view",             # admin-only
        "settings:manage",        # admin-only
    },
    Role.USER: {
        "ppt:generate", "ppt:edit", "ppt:export",
        "ppt:plan", "ppt:preview", "ppt:versions", "ppt:rollback",
        "template:list",
        "favorites:list", "favorites:add", "favorites:remove",
        "brand:list", "brand:create",
        "images:upload",
    },
    Role.GUEST: {
        "ppt:plan", "ppt:preview",
        "template:list",
    },
}


@dataclass
class User:
    user_id: str
    role: Role = Role.GUEST
    username: str = ""
    email: str = ""
    is_active: bool = True
    created_at: str = ""
    last_login: Optional[str] = None
    # For API keys
    is_api_key: bool = False
    api_key_name: Optional[str] = None
    # For secure share
    allowed_ips: Optional[List[str]] = None

    @classmethod
    def from_dict(cls, d: Dict) -> "User":
        return cls(
            user_id=d.get("user_id", ""),
            role=Role.from_string(d.get("role", "guest")),
            username=d.get("username", ""),
            email=d.get("email", ""),
            is_active=d.get("is_active", True),
            created_at=d.get("created_at", ""),
            last_login=d.get("last_login"),
            is_api_key=d.get("is_api_key", False),
            api_key_name=d.get("api_key_name"),
            allowed_ips=d.get("allowed_ips"),
        )


class RBAC:
    """Role-Based Access Control"""

    @staticmethod
    def has_permission(role: Role, action: str) -> bool:
        return action in ROLE_PERMISSIONS.get(role, set())

    @staticmethod
    def require_permission(action: str):
        """Decorator to enforce permission on a route handler."""
        def decorator(func):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                # Extract user from kwargs or request
                request = kwargs.get("request")
                if request:
                    user = getattr(request.state, "user", None)
                    if user and not RBAC.has_permission(user.role, action):
                        from fastapi import HTTPException
                        raise HTTPException(
                            status_code=403,
                            detail={
                                "error": "FORBIDDEN",
                                "message": f"权限不足，需要: {action}",
                                "required_role": action,
                            }
                        )
                return await func(*args, **kwargs)
            return wrapper
        return decorator


# ==================== API Key Manager ====================

class APIKeyManager:
    """Manages API keys for external integrations"""

    STORAGE_FILE = "./data/api_keys.json"

    def __init__(self):
        self._lock = threading.Lock()
        self._cache: Dict[str, Dict] = {}
        self._ensure_storage()

    def _ensure_storage(self):
        os.makedirs(os.path.dirname(self.STORAGE_FILE), exist_ok=True)
        if not os.path.exists(self.STORAGE_FILE):
            self._save({})

    def _load(self) -> Dict[str, Dict]:
        try:
            with open(self.STORAGE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            return {}

    def _save(self, data: Dict):
        tmp = self.STORAGE_FILE + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        os.replace(tmp, self.STORAGE_FILE)

    @staticmethod
    def _hash_key(key: str) -> str:
        return hashlib.sha256(key.encode()).hexdigest()

    @staticmethod
    def generate_key(prefix: str = "rabm") -> tuple[str, str]:
        """Generate a new API key. Returns (raw_key, hashed_key). Raw key shown only once."""
        raw = f"{prefix}_{secrets.token_hex(24)}"
        return raw, APIKeyManager._hash_key(raw)

    def create_key(
        self,
        name: str,
        role: Role = Role.USER,
        owner_id: str = "",
        expires_in_days: Optional[int] = None,
        allowed_ips: Optional[List[str]] = None,
        rate_limit: Optional[int] = None,
    ) -> tuple[Dict, str]:
        """
        Create a new API key.
        Returns (key_info, raw_key) — raw_key must be shown to user ONCE.
        """
        raw_key, hashed = self.generate_key()

        expires_at = None
        if expires_in_days:
            expires_at = (datetime.utcnow() + timedelta(days=expires_in_days)).isoformat() + "Z"

        key_info = {
            "key_id": str(uuid.uuid4())[:16],
            "name": name,
            "role": role.value,
            "owner_id": owner_id,
            "hashed_key": hashed,
            "created_at": datetime.utcnow().isoformat() + "Z",
            "expires_at": expires_at,
            "allowed_ips": allowed_ips or [],
            "rate_limit": rate_limit,
            "is_active": True,
            "last_used": None,
            "use_count": 0,
        }

        with self._lock:
            data = self._load()
            data[key_info["key_id"]] = key_info
            self._save(data)
            self._cache[key_info["key_id"]] = key_info

        return key_info, raw_key

    def verify_key(self, raw_key: str) -> Optional[Dict]:
        """Verify a raw API key. Returns key_info if valid, None otherwise."""
        hashed = self._hash_key(raw_key)
        data = self._load()

        for key_id, info in data.items():
            if info.get("hashed_key") == hashed and info.get("is_active"):
                # Check expiration
                if info.get("expires_at"):
                    expires = datetime.fromisoformat(info["expires_at"].replace("Z", "+00:00"))
                    if datetime.utcnow() > expires.replace(tzinfo=None):
                        return None
                return info
        return None

    def revoke_key(self, key_id: str) -> bool:
        """Revoke an API key by key_id."""
        with self._lock:
            data = self._load()
            if key_id in data:
                data[key_id]["is_active"] = False
                self._save(data)
                return True
            return False

    def list_keys(self, owner_id: str = "") -> List[Dict]:
        """List all API keys (without raw key or hash)."""
        data = self._load()
        keys = []
        for k, v in data.items():
            safe = {f: v[f] for f in [
                "key_id", "name", "role", "owner_id", "created_at",
                "expires_at", "allowed_ips", "rate_limit", "is_active",
                "last_used", "use_count"
            ] if f in v}
            if not owner_id or safe.get("owner_id") == owner_id:
                keys.append(safe)
        return keys

    def update_last_used(self, key_id: str):
        """Update last_used timestamp and increment count."""
        with self._lock:
            data = self._load()
            if key_id in data:
                data[key_id]["last_used"] = datetime.utcnow().isoformat() + "Z"
                data[key_id]["use_count"] = data[key_id].get("use_count", 0) + 1
                self._save(data)


# ==================== Audit Logger ====================

class AuditLogger:
    """Audit log for all user actions"""

    LOG_FILE = "./data/audit.json"
    MAX_SIZE_MB = 100

    def __init__(self):
        self._lock = threading.Lock()
        os.makedirs(os.path.dirname(self.LOG_FILE), exist_ok=True)

    def _load(self) -> List[Dict]:
        try:
            if os.path.exists(self.LOG_FILE):
                with open(self.LOG_FILE, "r", encoding="utf-8") as f:
                    return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            pass
        return []

    def _save(self, logs: List[Dict]):
        # Enforce size limit
        if len(logs) > 100_000:
            logs = logs[-80_000:]
        tmp = self.LOG_FILE + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(logs, f, ensure_ascii=False, indent=2)
        os.replace(tmp, self.LOG_FILE)

    def log(
        self,
        action: str,
        user_id: str,
        role: str,
        resource: str = "",
        resource_id: str = "",
        method: str = "",
        path: str = "",
        ip: str = "",
        user_agent: str = "",
        status_code: int = 200,
        duration_ms: int = 0,
        extra: Optional[Dict] = None,
        auth_method: str = "unknown",
        api_key_id: str = "",
        error: str = "",
    ):
        """Log a user action."""
        entry = {
            "id": str(uuid.uuid4()),
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "action": action,
            "user_id": user_id,
            "role": role,
            "resource": resource,
            "resource_id": resource_id,
            "method": method,
            "path": path,
            "ip": ip,
            "user_agent": user_agent,
            "status_code": status_code,
            "duration_ms": duration_ms,
            "extra": extra or {},
            "auth_method": auth_method,
            "api_key_id": api_key_id,
            "error": error,
        }
        with self._lock:
            logs = self._load()
            logs.append(entry)
            self._save(logs)

    def query(
        self,
        user_id: str = "",
        action: str = "",
        resource: str = "",
        start_time: str = "",
        end_time: str = "",
        limit: int = 100,
        offset: int = 0,
    ) -> List[Dict]:
        """Query audit logs with filters."""
        logs = self._load()
        filtered = []
        for log in reversed(logs):
            if user_id and log.get("user_id") != user_id:
                continue
            if action and log.get("action") != action:
                continue
            if resource and log.get("resource") != resource:
                continue
            if start_time and log.get("timestamp") < start_time:
                continue
            if end_time and log.get("timestamp") > end_time:
                continue
            filtered.append(log)

        return filtered[offset:offset + limit]


# ==================== Secure Share ====================

class SecureShareManager:
    """Manages secure share links with expiration and password protection"""

    STORAGE_FILE = "./data/secure_shares.json"

    def __init__(self):
        self._lock = threading.Lock()
        self._ensure_storage()

    def _ensure_storage(self):
        os.makedirs(os.path.dirname(self.STORAGE_FILE), exist_ok=True)
        if not os.path.exists(self.STORAGE_FILE):
            self._save({})

    def _load(self) -> Dict[str, Dict]:
        try:
            with open(self.STORAGE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            return {}

    def _save(self, data: Dict):
        tmp = self.STORAGE_FILE + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        os.replace(tmp, self.STORAGE_FILE)

    def create_share(
        self,
        resource_type: str,   # "ppt", "template"
        resource_id: str,
        created_by: str,
        password: Optional[str] = None,
        expires_in_hours: int = 24,
        allowed_ips: Optional[List[str]] = None,
        role: Role = Role.GUEST,
    ) -> tuple[Dict, str]:
        """
        Create a secure share link.
        Returns (share_info, access_token).
        """
        raw_token = secrets.token_urlsafe(32)
        share_id = str(uuid.uuid4())[:12]

        hashed_token = hashlib.sha256(raw_token.encode()).hexdigest()
        hashed_password = None
        if password:
            hashed_password = hashlib.sha256(password.encode()).hexdigest()

        expires_at = (datetime.utcnow() + timedelta(hours=expires_in_hours)).isoformat() + "Z"

        share_info = {
            "share_id": share_id,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "created_by": created_by,
            "created_at": datetime.utcnow().isoformat() + "Z",
            "hashed_token": hashed_token,
            "hashed_password": hashed_password,
            "expires_at": expires_at,
            "allowed_ips": allowed_ips or [],
            "role": role.value,
            "access_count": 0,
            "last_accessed": None,
            "is_active": True,
        }

        with self._lock:
            data = self._load()
            data[share_id] = share_info
            self._save(data)

        return share_info, raw_token

    def verify_access(
        self,
        share_id: str,
        access_token: str = "",
        password: str = "",
        client_ip: str = "",
    ) -> tuple[bool, str, Optional[Dict]]:
        """
        Verify access to a secure share.
        Returns (allowed, reason, share_info).
        """
        data = self._load()
        share = data.get(share_id)

        if not share:
            return False, "Share not found", None

        if not share.get("is_active", True):
            return False, "Share link has been revoked", None

        # Check expiration
        if share.get("expires_at"):
            expires = datetime.fromisoformat(share["expires_at"].replace("Z", "+00:00"))
            if datetime.utcnow() > expires.replace(tzinfo=None):
                return False, "Share link has expired", None

        # Check token
        hashed = hashlib.sha256(access_token.encode()).hexdigest()
        if hashed != share.get("hashed_token"):
            return False, "Invalid access token", None

        # Check password
        if share.get("hashed_password"):
            if not password:
                return False, "Password required", None
            hp = hashlib.sha256(password.encode()).hexdigest()
            if hp != share["hashed_password"]:
                return False, "Invalid password", None

        # Check IP restriction
        if share.get("allowed_ips"):
            if client_ip not in share["allowed_ips"]:
                return False, "IP not allowed", None

        return True, "OK", share

    def record_access(self, share_id: str):
        """Record a successful access."""
        with self._lock:
            data = self._load()
            if share_id in data:
                data[share_id]["access_count"] = data[share_id].get("access_count", 0) + 1
                data[share_id]["last_accessed"] = datetime.utcnow().isoformat() + "Z"
                self._save(data)

    def revoke_share(self, share_id: str) -> bool:
        """Revoke a share link."""
        with self._lock:
            data = self._load()
            if share_id in data:
                data[share_id]["is_active"] = False
                self._save(data)
                return True
            return False

    def list_shares(self, owner_id: str = "") -> List[Dict]:
        """List all shares (without sensitive fields)."""
        data = self._load()
        shares = []
        for sid, s in data.items():
            safe = {f: s[f] for f in [
                "share_id", "resource_type", "resource_id", "created_by",
                "created_at", "expires_at", "allowed_ips", "role",
                "access_count", "last_accessed", "is_active"
            ] if f in s}
            if not owner_id or safe.get("created_by") == owner_id:
                shares.append(safe)
        return shares


# ==================== Globals ====================

_api_key_manager: Optional[APIKeyManager] = None
_audit_logger: Optional[AuditLogger] = None
_secure_share: Optional[SecureShareManager] = None


def get_api_key_manager() -> APIKeyManager:
    global _api_key_manager
    if _api_key_manager is None:
        _api_key_manager = APIKeyManager()
    return _api_key_manager


def get_audit_logger() -> AuditLogger:
    global _audit_logger
    if _audit_logger is None:
        _audit_logger = AuditLogger()
    return _audit_logger


def get_secure_share_manager() -> SecureShareManager:
    global _secure_share
    if _secure_share is None:
        _secure_share = SecureShareManager()
    return _secure_share
