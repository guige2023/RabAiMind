"""
多端 API 接口 Agent

负责路由管理：
- 接口版本管理
- 请求认证
- 限流控制
"""
import logging
import time
from typing import Dict, Any, Optional
from collections import defaultdict

logger = logging.getLogger(__name__)


class RateLimiter:
    """简单限流器"""

    def __init__(self, max_calls: int = 100, window: int = 60):
        self.max_calls = max_calls
        self.window = window
        self.calls: Dict[str, list] = defaultdict(list)

    def is_allowed(self, key: str) -> bool:
        now = time.time()
        self.calls[key] = [t for t in self.calls[key] if now - t < self.window]
        if len(self.calls[key]) >= self.max_calls:
            return False
        self.calls[key].append(now)
        return True


class APIInterfaceAgent:
    """多端 API 接口 Agent"""

    def __init__(self):
        self.name = "APIInterfaceAgent"
        self.version = "1.0.0"
        self.rate_limiter = RateLimiter(max_calls=100, window=60)
        self.api_keys: Dict[str, str] = {}

    def register_api_key(self, client_id: str, api_key: str):
        """注册 API Key"""
        self.api_keys[client_id] = api_key

    def verify_request(self, client_id: str, api_key: str) -> bool:
        """验证请求合法性"""
        return self.api_keys.get(client_id) == api_key

    def route_request(self, request: dict) -> dict:
        """
        路由请求到对应服务

        Args:
            request: {service, method, params}
        Returns:
            {status, data/error}
        """
        service = request.get("service")
        method = request.get("method")
        params = request.get("params", {})

        # 限流检查
        client_id = request.get("client_id", "anonymous")
        if not self.rate_limiter.is_allowed(client_id):
            return {"status": "error", "code": "RATE_LIMITED", "msg": "请求过于频繁"}

        # TODO: 接入真实路由逻辑
        logger.info(f"APIInterface: {service}.{method}")

        return {"status": "ok", "service": service, "method": method}

    def health_check(self) -> dict:
        """健康检查"""
        return {"status": "ok", "version": self.version}
