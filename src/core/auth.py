"""
API 认证模块

支持 JWT Token 和 API Key 两种认证方式
"""
import os
import time
import hashlib
import secrets
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)


@dataclass
class AuthConfig:
    auth_enabled: bool = False
    jwt_secret: str = ""
    api_key: str = ""
    token_expire_hours: int = 24


class AuthError(Exception):
    auth_failed: bool = True
    error_code: str
    message: str
    
    def __init__(self, message: str, error_code: str = "AUTH_FAILED"):
        self.message = message
        self.error_code = error_code
        super().__init__(message)


class TokenExpiredError(AuthError):
    def __init__(self, message: str = "Token 已过期"):
        super().__init__(message, "TOKEN_EXPIRED")


class InvalidTokenError(AuthError):
    def __init__(self, message: str = "无效的 Token"):
        super().__init__(message, "INVALID_TOKEN")


class InvalidAPIKeyError(AuthError):
    def __init__(self, message: str = "无效的 API Key"):
        super().__init__(message, "INVALID_API_KEY")


class AuthManager:
    _instance = None
    _config: Optional[AuthConfig] = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if self._config is None:
            self._load_config()
    
    def _load_config(self):
        # P0 Fix: 强制启用认证，不再允许通过环境变量关闭
        auth_enabled = True  # 始终启用认证
        jwt_secret = os.getenv("JWT_SECRET", "")
        api_key = os.getenv("API_KEY", "")
        
        if auth_enabled and not jwt_secret:
            raise ValueError(
                "JWT_SECRET 环境变量未设置。请在 .env 中配置 JWT_SECRET（认证已启用）。"
                "示例: JWT_SECRET=$(openssl rand -hex 32)"
            )
        
        self._config = AuthConfig(
            auth_enabled=auth_enabled,
            jwt_secret=jwt_secret,
            api_key=api_key,
            token_expire_hours=int(os.getenv("TOKEN_EXPIRE_HOURS", "24"))
        )
        
        if auth_enabled:
            logger.info("API 认证已启用")
        else:
            logger.info("API 认证未启用（开发模式）")
    
    @property
    def is_enabled(self) -> bool:
        return self._config.auth_enabled
    
    def create_token(self, user_id: str, extra_data: Optional[Dict] = None) -> str:
        if not self._config.jwt_secret:
            raise AuthError("JWT 密钥未配置")
        
        import hmac
        import json
        import base64
        
        now = int(time.time())
        expire = now + (self._config.token_expire_hours * 3600)
        
        header = {"alg": "HS256", "typ": "JWT"}
        payload = {
            "sub": user_id,
            "iat": now,
            "exp": expire,
            **(extra_data or {})
        }
        
        header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip('=')
        payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip('=')
        
        message = f"{header_b64}.{payload_b64}"
        signature = hmac.new(
            self._config.jwt_secret.encode(),
            message.encode(),
            hashlib.sha256
        ).digest()
        signature_b64 = base64.urlsafe_b64encode(signature).decode().rstrip('=')
        
        return f"{message}.{signature_b64}"
    
    def verify_token(self, token: str) -> Dict[str, Any]:
        if not self._config.jwt_secret:
            raise AuthError("JWT 密钥未配置")
        
        import hmac
        import json
        import base64
        
        try:
            parts = token.split('.')
            if len(parts) != 3:
                raise InvalidTokenError("Token 格式错误")
            
            header_b64, payload_b64, signature_b64 = parts
            
            message = f"{header_b64}.{payload_b64}"
            expected_signature = hmac.new(
                self._config.jwt_secret.encode(),
                message.encode(),
                hashlib.sha256
            ).digest()
            expected_sig_b64 = base64.urlsafe_b64encode(expected_signature).decode().rstrip('=')
            
            if not hmac.compare_digest(signature_b64.encode(), expected_sig_b64.encode()):
                raise InvalidTokenError("签名验证失败")
            
            payload_json = base64.urlsafe_b64decode(payload_b64 + '==').decode()
            payload = json.loads(payload_json)
            
            if payload.get("exp", 0) < int(time.time()):
                raise TokenExpiredError()
            
            return payload
            
        except (json.JSONDecodeError, base64.binascii.Error) as e:
            raise InvalidTokenError(f"Token 解析失败: {str(e)}")
    
    def verify_api_key(self, api_key: str) -> bool:
        if not self._config.api_key:
            raise AuthError("API Key 未配置")
        
        return secrets.compare_digest(api_key, self._config.api_key)
    
    def authenticate(self, auth_header: Optional[str] = None, api_key: Optional[str] = None) -> Dict[str, Any]:
        if not self.is_enabled:
            return {"authenticated": True, "user_id": "anonymous"}
        
        if auth_header:
            if auth_header.startswith("Bearer "):
                token = auth_header[7:]
                return {
                    "authenticated": True,
                    "user_id": self.verify_token(token).get("sub"),
                    "method": "jwt"
                }
        
        if api_key:
            if self.verify_api_key(api_key):
                return {
                    "authenticated": True,
                    "user_id": "api_user",
                    "method": "api_key"
                }
            raise InvalidAPIKeyError()
        
        raise AuthError("缺少认证信息")


auth_manager = AuthManager()


def get_auth_manager() -> AuthManager:
    return auth_manager
