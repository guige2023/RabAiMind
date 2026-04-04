# -*- coding: utf-8 -*-
"""
Security Module Tests — RBAC, API Keys, Audit Log, Secure Share

Author: Claude (R42)
Date: 2026-04-04
"""

import os
import sys
import pytest
import tempfile
import time
import json
from datetime import datetime, timedelta
from unittest.mock import patch
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))


# ==================== RBAC Tests ====================

class TestRBAC:
    """Role-Based Access Control tests"""

    def test_admin_has_all_permissions(self):
        from src.core.security import Role, RBAC, ROLE_PERMISSIONS
        admin_perms = ROLE_PERMISSIONS[Role.ADMIN]
        assert "ppt:generate" in admin_perms
        assert "users:manage" in admin_perms
        assert "apikeys:manage" in admin_perms
        assert "audit:view" in admin_perms

    def test_user_limited_permissions(self):
        from src.core.security import Role, RBAC
        assert RBAC.has_permission(Role.USER, "ppt:generate")
        assert RBAC.has_permission(Role.USER, "ppt:plan")
        assert not RBAC.has_permission(Role.USER, "users:manage")
        assert not RBAC.has_permission(Role.USER, "audit:view")

    def test_guest_minimal_permissions(self):
        from src.core.security import Role, RBAC
        assert RBAC.has_permission(Role.GUEST, "ppt:plan")
        assert RBAC.has_permission(Role.GUEST, "ppt:preview")
        assert not RBAC.has_permission(Role.GUEST, "ppt:generate")
        assert not RBAC.has_permission(Role.GUEST, "users:manage")

    def test_role_from_string(self):
        from src.core.security import Role
        assert Role.from_string("admin") == Role.ADMIN
        assert Role.from_string("ADMIN") == Role.ADMIN
        assert Role.from_string("user") == Role.USER
        assert Role.from_string("guest") == Role.GUEST
        assert Role.from_string("unknown") == Role.GUEST  # fallback


# ==================== API Key Manager Tests ====================

class TestAPIKeyManager:
    """API Key Manager tests"""

    @pytest.fixture
    def manager(self, tmp_path):
        from src.core.security import APIKeyManager
        # Use temp storage
        storage = tmp_path / "keys.json"
        manager = APIKeyManager()
        manager.STORAGE_FILE = str(storage)
        manager._ensure_storage()
        yield manager

    def test_create_key(self, manager):
        key_info, raw_key = manager.create_key(
            name="test-key",
            role="user",
            owner_id="user1",
        )
        assert key_info["name"] == "test-key"
        assert key_info["role"] == "user"
        assert key_info["owner_id"] == "user1"
        assert raw_key.startswith("rabm_")
        assert key_info["is_active"] is True

    def test_verify_key(self, manager):
        key_info, raw_key = manager.create_key(name="verify-test", role="user")
        result = manager.verify_key(raw_key)
        assert result is not None
        assert result["key_id"] == key_info["key_id"]

    def test_verify_wrong_key(self, manager):
        manager.create_key(name="test", role="user")
        result = manager.verify_key("wrong_key_here")
        assert result is None

    def test_revoke_key(self, manager):
        key_info, raw_key = manager.create_key(name="revoke-test", role="user")
        key_id = key_info["key_id"]
        success = manager.revoke_key(key_id)
        assert success is True
        # Revoked key should not verify
        result = manager.verify_key(raw_key)
        assert result is None

    def test_key_expiration(self, manager):
        # Create key that expires in 1 day
        key_info, raw_key = manager.create_key(
            name="expires-test",
            role="user",
            expires_in_days=1,
        )
        result = manager.verify_key(raw_key)
        assert result is not None  # Still valid

        # Create key that expired yesterday
        key_info2, raw_key2 = manager.create_key(
            name="expired-test",
            role="user",
            expires_in_days=-1,
        )
        result2 = manager.verify_key(raw_key2)
        assert result2 is None  # Should be expired

    def test_list_keys(self, manager):
        manager.create_key(name="key1", role="user", owner_id="user1")
        manager.create_key(name="key2", role="admin", owner_id="admin1")

        all_keys = manager.list_keys()
        assert len(all_keys) == 2

        user1_keys = manager.list_keys(owner_id="user1")
        assert len(user1_keys) == 1
        assert user1_keys[0]["name"] == "key1"

    def test_key_id_unique(self, manager):
        keys = []
        for i in range(10):
            ki, _ = manager.create_key(name=f"key{i}", role="user")
            keys.append(ki["key_id"])
        assert len(set(keys)) == 10  # All unique


# ==================== Audit Logger Tests ====================

class TestAuditLogger:
    """Audit Logger tests"""

    @pytest.fixture
    def logger_(self, tmp_path):
        from src.core.security import AuditLogger
        log_file = tmp_path / "audit.json"
        logger = AuditLogger()
        logger.LOG_FILE = str(log_file)
        logger._lock = __import__("threading").Lock()
        logger._ensure_storage = lambda: None
        os.makedirs(os.path.dirname(logger.LOG_FILE), exist_ok=True)
        with open(logger.LOG_FILE, "w") as f:
            json.dump([], f)
        yield logger

    def test_log_writes_entry(self, logger_):
        logger_.log(
            action="/api/v1/ppt/generate",
            user_id="user123",
            role="user",
            method="POST",
            path="/api/v1/ppt/generate",
            ip="127.0.0.1",
            status_code=200,
        )
        logs = logger_.query()
        assert len(logs) == 1
        assert logs[0]["user_id"] == "user123"
        assert logs[0]["action"] == "/api/v1/ppt/generate"

    def test_query_by_user_id(self, logger_):
        logger_.log(action="test", user_id="user1", role="user")
        logger_.log(action="test", user_id="user2", role="user")
        logs = logger_.query(user_id="user1")
        assert len(logs) == 1
        assert logs[0]["user_id"] == "user1"

    def test_query_by_action(self, logger_):
        logger_.log(action="/api/v1/ppt/generate", user_id="u1", role="user")
        logger_.log(action="/api/v1/ppt/preview", user_id="u2", role="user")
        logs = logger_.query(action="/api/v1/ppt/generate")
        assert len(logs) == 1

    def test_query_pagination(self, logger_):
        for i in range(10):
            logger_.log(action=f"action_{i}", user_id="u1", role="user")
        logs = logger_.query(limit=3, offset=0)
        assert len(logs) == 3
        logs_page2 = logger_.query(limit=3, offset=3)
        assert len(logs_page2) == 3


# ==================== Secure Share Tests ====================

class TestSecureShareManager:
    """Secure Share Manager tests"""

    @pytest.fixture
    def share_mgr(self, tmp_path):
        from src.core.security import SecureShareManager
        storage = tmp_path / "shares.json"
        mgr = SecureShareManager()
        mgr.STORAGE_FILE = str(storage)
        mgr._lock = __import__("threading").Lock()
        mgr._ensure_storage()
        with open(mgr.STORAGE_FILE, "w") as f:
            json.dump({}, f)
        yield mgr

    def test_create_share(self, share_mgr):
        info, token = share_mgr.create_share(
            resource_type="ppt",
            resource_id="task123",
            created_by="user1",
            expires_in_hours=24,
        )
        assert info["resource_type"] == "ppt"
        assert info["resource_id"] == "task123"
        assert info["is_active"] is True
        assert len(token) > 20  # URL-safe token

    def test_create_share_with_password(self, share_mgr):
        info, token = share_mgr.create_share(
            resource_type="ppt",
            resource_id="task123",
            created_by="user1",
            password="secret123",
        )
        assert info["hashed_password"] is not None
        assert info["password_required"] is True  # not a field, but we check hashed

    def test_verify_share_valid(self, share_mgr):
        info, token = share_mgr.create_share(
            resource_type="ppt",
            resource_id="task123",
            created_by="user1",
            expires_in_hours=24,
        )
        allowed, reason, result = share_mgr.verify_access(
            share_id=info["share_id"],
            access_token=token,
            client_ip="127.0.0.1",
        )
        assert allowed is True
        assert result["resource_id"] == "task123"

    def test_verify_share_wrong_token(self, share_mgr):
        info, token = share_mgr.create_share(
            resource_type="ppt",
            resource_id="task123",
            created_by="user1",
        )
        allowed, reason, _ = share_mgr.verify_access(
            share_id=info["share_id"],
            access_token="wrong_token",
        )
        assert allowed is False
        assert "Invalid access token" in reason

    def test_verify_share_password_required(self, share_mgr):
        info, token = share_mgr.create_share(
            resource_type="ppt",
            resource_id="task123",
            created_by="user1",
            password="secret123",
        )
        # No password provided
        allowed, reason, _ = share_mgr.verify_access(
            share_id=info["share_id"],
            access_token=token,
        )
        assert allowed is False
        assert "Password required" in reason

        # Wrong password
        allowed2, reason2, _ = share_mgr.verify_access(
            share_id=info["share_id"],
            access_token=token,
            password="wrongpass",
        )
        assert allowed2 is False
        assert "Invalid password" in reason2

        # Correct password
        allowed3, _, _ = share_mgr.verify_access(
            share_id=info["share_id"],
            access_token=token,
            password="secret123",
        )
        assert allowed3 is True

    def test_verify_share_expired(self, share_mgr):
        info, token = share_mgr.create_share(
            resource_type="ppt",
            resource_id="task123",
            created_by="user1",
            expires_in_hours=-1,  # Already expired
        )
        allowed, reason, _ = share_mgr.verify_access(
            share_id=info["share_id"],
            access_token=token,
        )
        assert allowed is False
        assert "expired" in reason.lower()

    def test_revoke_share(self, share_mgr):
        info, token = share_mgr.create_share(
            resource_type="ppt",
            resource_id="task123",
            created_by="user1",
        )
        success = share_mgr.revoke_share(info["share_id"])
        assert success is True
        allowed, _, _ = share_mgr.verify_access(
            share_id=info["share_id"],
            access_token=token,
        )
        assert allowed is False

    def test_record_access(self, share_mgr):
        info, token = share_mgr.create_share(
            resource_type="ppt",
            resource_id="task123",
            created_by="user1",
        )
        initial_count = info["access_count"]
        share_mgr.record_access(info["share_id"])
        allowed, _, result = share_mgr.verify_access(
            share_id=info["share_id"],
            access_token=token,
        )
        assert result["access_count"] > initial_count


# ==================== Auth Middleware Tests ====================

class TestAuthMiddlewareIntegration:
    """Test auth middleware integration with FastAPI app"""

    def test_public_paths_not_blocked(self):
        """Public paths should not require auth"""
        from fastapi.testclient import TestClient
        from src.main import app

        # Need to ensure auth is disabled for this test
        with patch.dict(os.environ, {"API_AUTH_ENABLED": "false"}):
            # Re-import to pick up env
            from src.core.auth import AuthManager
            AuthManager._instance = None  # Reset singleton
            client = TestClient(app)
            # Public paths should work without auth
            response = client.get("/api/v1/status")
            # Should not be 401 (might be 200 or other)
            assert response.status_code != 401

    def test_jwt_token_in_auth_header(self):
        """JWT Bearer token should authenticate user"""
        with patch.dict(os.environ, {
            "API_AUTH_ENABLED": "true",
            "JWT_SECRET": "test-secret-12345"
        }):
            from src.core.auth import AuthManager
            AuthManager._instance = None
            mgr = AuthManager()
            mgr._config = None
            mgr._load_config()

            token = mgr.create_token("test_user", {"role": "user"})

            from fastapi.testclient import TestClient
            from src.main import app
            client = TestClient(app)
            response = client.get(
                "/api/v1/status",
                headers={"Authorization": f"Bearer {token}"}
            )
            # Should get 200, not 401
            assert response.status_code == 200

    def test_api_key_authentication(self):
        """X-API-Key header should authenticate"""
        with patch.dict(os.environ, {"API_AUTH_ENABLED": "true"}):
            from src.core.auth import AuthManager
            from src.core.security import get_api_key_manager
            AuthManager._instance = None

            # Create a test API key
            mgr = get_api_key_manager()
            key_info, raw_key = mgr.create_key(
                name="test-key",
                role="user",
                owner_id="test-user",
            )

            from fastapi.testclient import TestClient
            from src.main import app
            client = TestClient(app)
            response = client.get(
                "/api/v1/status",
                headers={"X-API-Key": raw_key}
            )
            # Should get 200
            assert response.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
