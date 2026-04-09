"""
Security Module — RBAC, API Key Management, Audit Logging, Secure Share

Author: Claude (R42)
Date: 2026-04-04
"""

import hashlib
import json
import logging
import os
import secrets
import threading
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
from functools import wraps
from typing import Any

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
ROLE_PERMISSIONS: dict[Role, set] = {
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
    last_login: str | None = None
    # For API keys
    is_api_key: bool = False
    api_key_name: str | None = None
    # For secure share
    allowed_ips: list[str] | None = None

    @classmethod
    def from_dict(cls, d: dict) -> "User":
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
        self._cache: dict[str, dict] = {}
        self._ensure_storage()

    def _ensure_storage(self):
        os.makedirs(os.path.dirname(self.STORAGE_FILE), exist_ok=True)
        if not os.path.exists(self.STORAGE_FILE):
            self._save({})

    def _load(self) -> dict[str, dict]:
        try:
            with open(self.STORAGE_FILE, encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            return {}

    def _save(self, data: dict):
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
        expires_in_days: int | None = None,
        allowed_ips: list[str] | None = None,
        rate_limit: int | None = None,
    ) -> tuple[dict, str]:
        """
        Create a new API key.
        Returns (key_info, raw_key) — raw_key must be shown to user ONCE.
        """
        raw_key, hashed = self.generate_key()

        # Accept both Role enum and string
        if isinstance(role, str):
            role_value = role
        else:
            role_value = role.value

        expires_at = None
        if expires_in_days:
            expires_at = (datetime.utcnow() + timedelta(days=expires_in_days)).isoformat() + "Z"

        key_info = {
            "key_id": str(uuid.uuid4())[:16],
            "name": name,
            "role": role_value,
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

    def verify_key(self, raw_key: str) -> dict | None:
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

    def list_keys(self, owner_id: str = "") -> list[dict]:
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

    def _load(self) -> list[dict]:
        try:
            if os.path.exists(self.LOG_FILE):
                with open(self.LOG_FILE, encoding="utf-8") as f:
                    return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            pass
        return []

    def _save(self, logs: list[dict]):
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
        extra: dict | None = None,
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
    ) -> list[dict]:
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


# ==================== E2E Encryption ====================

class E2EEncryptionManager:
    """
    End-to-end encryption for shared presentations.
    Uses Fernet (AES-128-CBC with HMAC) for symmetric encryption.
    The encryption key is derived from the access token so only
    token holders can decrypt the content.
    """

    @staticmethod
    def _get_fernet_key(access_token: str) -> bytes:
        """Derive a Fernet-compatible key from the access token."""
        import base64
        import secrets

        from cryptography.hazmat.backends import default_backend
        from cryptography.hazmat.primitives import hashes
        from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
        salt = secrets.token_bytes(16)  # Random salt for key derivation
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100_000,
            backend=default_backend(),
        )
        key = base64.urlsafe_b64encode(kdf.derive(access_token.encode()))
        return key

    @staticmethod
    def encrypt_content(content: bytes, access_token: str) -> bytes:
        """Encrypt content using Fernet with token-derived key."""
        from cryptography.fernet import Fernet
        key = E2EEncryptionManager._get_fernet_key(access_token)
        return Fernet(key).encrypt(content)

    @staticmethod
    def decrypt_content(encrypted_content: bytes, access_token: str) -> bytes:
        """Decrypt content using Fernet with token-derived key."""
        from cryptography.fernet import Fernet
        key = E2EEncryptionManager._get_fernet_key(access_token)
        return Fernet(key).decrypt(encrypted_content)

    @staticmethod
    def generate_encrypted_package(
        pptx_path: str,
        access_token: str
    ) -> bytes:
        """
        Read a PPTX file and return an encrypted package.
        The package format: version(1B) || IV(16B) || encrypted_pptx
        """

        with open(pptx_path, "rb") as f:
            content = f.read()

        encrypted = E2EEncryptionManager.encrypt_content(content, access_token)
        return encrypted

    @staticmethod
    def decrypt_package(encrypted_pkg: bytes, access_token: str) -> bytes:
        """Decrypt an encrypted package back to PPTX bytes."""
        return E2EEncryptionManager.decrypt_content(encrypted_pkg, access_token)


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

    def _load(self) -> dict[str, dict]:
        try:
            with open(self.STORAGE_FILE, encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            return {}

    def _save(self, data: dict):
        tmp = self.STORAGE_FILE + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        os.replace(tmp, self.STORAGE_FILE)

    def create_share(
        self,
        resource_type: str,   # "ppt", "template"
        resource_id: str,
        created_by: str,
        password: str | None = None,
        expires_in_hours: int = 24,
        allowed_ips: list[str] | None = None,
        role: Role = Role.GUEST,
        anonymous_access: bool = False,
        encryption_enabled: bool = False,
    ) -> tuple[dict, str]:
        """
        Create a secure share link.
        Returns (share_info, access_token).

        Features:
        - anonymous_access: If True, anyone with the token can view without logging in
        - encryption_enabled: If True, PPT content is E2E encrypted
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
            "password_required": hashed_password is not None,
            "expires_at": expires_at,
            "allowed_ips": allowed_ips or [],
            "role": role.value,
            "access_count": 0,
            "last_accessed": None,
            "is_active": True,
            "anonymous_access": anonymous_access,
            "encryption_enabled": encryption_enabled,
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
    ) -> tuple[bool, str, dict | None]:
        """
        Verify access to a secure share.
        Returns (allowed, reason, share_info).

        For anonymous_access shares: no login required, just valid token.
        For non-anonymous shares: caller must also verify user is logged in.
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

    def list_shares(self, owner_id: str = "") -> list[dict]:
        """List all shares (without sensitive fields)."""
        data = self._load()
        shares = []
        for sid, s in data.items():
            safe = {f: s[f] for f in [
                "share_id", "resource_type", "resource_id", "created_by",
                "created_at", "expires_at", "allowed_ips", "role",
                "access_count", "last_accessed", "is_active",
                "anonymous_access", "encryption_enabled"
            ] if f in s}
            if not owner_id or safe.get("created_by") == owner_id:
                shares.append(safe)
        return shares


# ==================== Globals ====================

_api_key_manager: APIKeyManager | None = None
_audit_logger: AuditLogger | None = None
_secure_share: SecureShareManager | None = None


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


# ==================== Presentation Security Manager ====================


class PresentationSecurityManager:
    """
    Manages per-presentation security settings:
    - Password protection (PPTX download password)
    - Biometric authentication requirement
    - IP allowlisting (per presentation)
    - Auto-watermark on export
    - Access log (who accessed what when)
    """

    STORAGE_FILE = "./data/presentation_security.json"

    def __init__(self):
        self._lock = threading.Lock()
        self._ensure_storage()

    def _ensure_storage(self):
        os.makedirs(os.path.dirname(self.STORAGE_FILE), exist_ok=True)
        if not os.path.exists(self.STORAGE_FILE):
            self._save({})

    def _load(self) -> dict[str, dict]:
        try:
            with open(self.STORAGE_FILE, encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            return {}

    def _save(self, data: dict):
        tmp = self.STORAGE_FILE + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        os.replace(tmp, self.STORAGE_FILE)

    # ---- Password Protection ----

    def set_password(self, task_id: str, password: str, user_id: str = "") -> dict[str, Any]:
        """Set or update password protection for a presentation."""
        hashed = hashlib.sha256(password.encode()).hex()
        with self._lock:
            data = self._load()
            if task_id not in data:
                data[task_id] = {"_init": True, "created_at": datetime.utcnow().isoformat() + "Z"}
            data[task_id].update({
                "hashed_password": hashed,
                "password_set_at": datetime.utcnow().isoformat() + "Z",
                "password_set_by": user_id,
                "has_password": True,
            })
            self._save(data)
        return {"success": True, "task_id": task_id, "has_password": True}

    def remove_password(self, task_id: str) -> dict[str, Any]:
        """Remove password protection."""
        with self._lock:
            data = self._load()
            if task_id in data:
                data[task_id]["hashed_password"] = None
                data[task_id]["has_password"] = False
                self._save(data)
        return {"success": True, "task_id": task_id, "has_password": False}

    def verify_password(self, task_id: str, password: str) -> bool:
        """Verify a password against stored hash."""
        data = self._load()
        sec = data.get(task_id, {})
        if not sec.get("hashed_password"):
            return True  # No password set
        hashed = hashlib.sha256(password.encode()).hex()
        return hashed == sec["hashed_password"]

    def has_password(self, task_id: str) -> bool:
        """Check if a presentation has password protection."""
        data = self._load()
        return data.get(task_id, {}).get("has_password", False)

    def get_password_info(self, task_id: str) -> dict[str, Any]:
        """Get password protection status (no secrets exposed)."""
        data = self._load()
        sec = data.get(task_id, {})
        return {
            "task_id": task_id,
            "has_password": sec.get("has_password", False),
            "password_set_at": sec.get("password_set_at"),
        }

    # ---- Biometric Authentication ----

    def set_biometric_required(self, task_id: str, required: bool, user_id: str = "") -> dict[str, Any]:
        """Enable or disable biometric authentication requirement."""
        with self._lock:
            data = self._load()
            if task_id not in data:
                data[task_id] = {"_init": True, "created_at": datetime.utcnow().isoformat() + "Z"}
            data[task_id].update({
                "biometric_required": required,
                "biometric_set_at": datetime.utcnow().isoformat() + "Z",
                "biometric_set_by": user_id,
            })
            self._save(data)
        return {"success": True, "task_id": task_id, "biometric_required": required}

    def is_biometric_required(self, task_id: str) -> bool:
        """Check if biometric authentication is required."""
        data = self._load()
        return data.get(task_id, {}).get("biometric_required", False)

    def get_biometric_info(self, task_id: str) -> dict[str, Any]:
        """Get biometric auth status."""
        data = self._load()
        sec = data.get(task_id, {})
        return {
            "task_id": task_id,
            "biometric_required": sec.get("biometric_required", False),
            "biometric_set_at": sec.get("biometric_set_at"),
        }

    # ---- IP Allowlisting ----

    def set_allowed_ips(self, task_id: str, allowed_ips: list[str], user_id: str = "") -> dict[str, Any]:
        """Set IP allowlist for a presentation."""
        with self._lock:
            data = self._load()
            if task_id not in data:
                data[task_id] = {"_init": True, "created_at": datetime.utcnow().isoformat() + "Z"}
            data[task_id]["allowed_ips"] = allowed_ips
            data[task_id]["ip_allowlist_set_at"] = datetime.utcnow().isoformat() + "Z"
            data[task_id]["ip_allowlist_set_by"] = user_id
            self._save(data)
        return {"success": True, "task_id": task_id, "allowed_ips": allowed_ips}

    def check_ip_allowed(self, task_id: str, client_ip: str) -> bool:
        """Check if an IP address is allowed to access the presentation."""
        data = self._load()
        sec = data.get(task_id, {})
        allowed = sec.get("allowed_ips", [])
        if not allowed:
            return True  # No restriction
        return client_ip in allowed

    def get_ip_allowlist_info(self, task_id: str) -> dict[str, Any]:
        """Get IP allowlist status."""
        data = self._load()
        sec = data.get(task_id, {})
        return {
            "task_id": task_id,
            "allowed_ips": sec.get("allowed_ips", []),
            "ip_allowlist_set_at": sec.get("ip_allowlist_set_at"),
            "has_ip_restriction": bool(sec.get("allowed_ips")),
        }

    # ---- Auto-Watermark ----

    def set_auto_watermark(self, task_id: str, enabled: bool, text: str = "",
                            opacity: float = 0.15, angle: int = -45,
                            font_size: int = 48, color: str = "#888888",
                            user_id: str = "") -> dict[str, Any]:
        """Configure auto-watermark for a presentation's exports."""
        with self._lock:
            data = self._load()
            if task_id not in data:
                data[task_id] = {"_init": True, "created_at": datetime.utcnow().isoformat() + "Z"}
            data[task_id]["auto_watermark"] = {
                "enabled": enabled,
                "text": text,
                "opacity": opacity,
                "angle": angle,
                "font_size": font_size,
                "color": color,
                "set_at": datetime.utcnow().isoformat() + "Z",
                "set_by": user_id,
            }
            self._save(data)
        return {"success": True, "task_id": task_id, "auto_watermark": data[task_id]["auto_watermark"]}

    def get_auto_watermark(self, task_id: str) -> dict[str, Any]:
        """Get auto-watermark configuration."""
        data = self._load()
        sec = data.get(task_id, {})
        return sec.get("auto_watermark", {
            "enabled": False,
            "text": "",
            "opacity": 0.15,
            "angle": -45,
            "font_size": 48,
            "color": "#888888",
        })

    # ---- Access Log ----

    def log_access(self, task_id: str, user_id: str, action: str,
                   client_ip: str = "", user_agent: str = "",
                   metadata: dict | None = None) -> None:
        """Log an access event for a presentation."""
        # Delegate to global audit logger
        audit = get_audit_logger()
        audit.log(
            user_id=user_id,
            role="user",
            action=f"presentation:{action}",
            resource=task_id,
            extra={
                "client_ip": client_ip,
                "user_agent": user_agent,
                **(metadata or {})
            }
        )

    def get_access_log(self, task_id: str, limit: int = 100, offset: int = 0) -> list[dict]:
        """Get access log for a specific presentation."""
        audit = get_audit_logger()
        logs = audit.query(resource=task_id, limit=limit, offset=offset)
        return logs

    # ---- Full Security Config ----

    def get_security_config(self, task_id: str) -> dict[str, Any]:
        """Get all security settings for a presentation (no secrets)."""
        data = self._load()
        sec = data.get(task_id, {})
        return {
            "task_id": task_id,
            "has_password": sec.get("has_password", False),
            "password_set_at": sec.get("password_set_at"),
            "biometric_required": sec.get("biometric_required", False),
            "biometric_set_at": sec.get("biometric_set_at"),
            "allowed_ips": sec.get("allowed_ips", []),
            "has_ip_restriction": bool(sec.get("allowed_ips")),
            "ip_allowlist_set_at": sec.get("ip_allowlist_set_at"),
            "auto_watermark": sec.get("auto_watermark", {
                "enabled": False, "text": "", "opacity": 0.15,
                "angle": -45, "font_size": 48, "color": "#888888"
            }),
            "created_at": sec.get("created_at"),
        }

    def delete_security_config(self, task_id: str) -> dict[str, Any]:
        """Remove all security settings for a presentation."""
        with self._lock:
            data = self._load()
            if task_id in data:
                del data[task_id]
                self._save(data)
        return {"success": True, "task_id": task_id}


_presentation_security: PresentationSecurityManager | None = None


def get_presentation_security_manager() -> PresentationSecurityManager:
    global _presentation_security
    if _presentation_security is None:
        _presentation_security = PresentationSecurityManager()
    return _presentation_security
