"""
核心模块测试

测试认证、异常处理、公共工具函数
"""
import pytest
import os
import json
import time
from unittest.mock import patch, MagicMock

import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.core.auth import (
    AuthManager,
    AuthError,
    TokenExpiredError,
    InvalidTokenError,
    InvalidAPIKeyError,
    get_auth_manager
)
from src.core.exceptions import (
    RabAiMindError,
    APIError,
    APIConnectionError,
    APITimeoutError,
    ValidationError,
    TaskNotFoundError,
    sanitize_error,
    get_http_status
)
from src.utils.common import (
    parse_json_from_response,
    escape_html,
    escape_url,
    truncate_text,
    sanitize_filename,
    hex_to_rgb,
    rgb_to_hex,
    calculate_brightness
)


class TestAuthManager:
    """认证管理器测试"""
    
    def test_auth_disabled_by_default(self):
        """默认情况下认证应该是禁用的"""
        with patch.dict(os.environ, {"API_AUTH_ENABLED": "false"}, clear=True):
            manager = AuthManager()
            manager._config = None
            manager._load_config()
            assert not manager.is_enabled
    
    def test_auth_enabled_with_jwt_secret(self):
        """启用认证时需要 JWT 密钥"""
        with patch.dict(os.environ, {
            "API_AUTH_ENABLED": "true",
            "JWT_SECRET": "test-secret-key-12345"
        }, clear=True):
            manager = AuthManager()
            manager._config = None
            manager._load_config()
            assert manager.is_enabled
    
    def test_create_and_verify_token(self):
        """测试创建和验证 Token"""
        with patch.dict(os.environ, {
            "API_AUTH_ENABLED": "true",
            "JWT_SECRET": "test-secret-key-12345"
        }, clear=True):
            manager = AuthManager()
            manager._config = None
            manager._load_config()
            
            # 创建 Token
            token = manager.create_token("user123", {"role": "admin"})
            assert token is not None
            assert len(token.split('.')) == 3
            
            # 验证 Token
            payload = manager.verify_token(token)
            assert payload["sub"] == "user123"
            assert payload["role"] == "admin"
    
    def test_invalid_token_raises_error(self):
        """无效 Token 应该抛出异常"""
        with patch.dict(os.environ, {
            "API_AUTH_ENABLED": "true",
            "JWT_SECRET": "test-secret-key-12345"
        }, clear=True):
            manager = AuthManager()
            manager._config = None
            manager._load_config()
            
            with pytest.raises(InvalidTokenError):
                manager.verify_token("invalid.token.here")
    
    def test_expired_token_raises_error(self):
        """过期 Token 应该抛出异常"""
        with patch.dict(os.environ, {
            "API_AUTH_ENABLED": "true",
            "JWT_SECRET": "test-secret-key-12345"
        }, clear=True):
            manager = AuthManager()
            manager._config = None
            manager._load_config()
            
            # 创建一个立即过期的 Token
            import base64
            import hmac
            import hashlib
            
            header = {"alg": "HS256", "typ": "JWT"}
            payload = {
                "sub": "user123",
                "iat": int(time.time()) - 3600,
                "exp": int(time.time()) - 1800  # 半小时前过期
            }
            
            header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip('=')
            payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip('=')
            
            message = f"{header_b64}.{payload_b64}"
            signature = hmac.new(
                b"test-secret-key-12345",
                message.encode(),
                hashlib.sha256
            ).digest()
            signature_b64 = base64.urlsafe_b64encode(signature).decode().rstrip('=')
            
            expired_token = f"{message}.{signature_b64}"
            
            with pytest.raises(TokenExpiredError):
                manager.verify_token(expired_token)
    
    def test_authenticate_without_auth_header(self):
        """无认证头时应该返回匿名用户（认证禁用时）"""
        with patch.dict(os.environ, {"API_AUTH_ENABLED": "false"}, clear=True):
            manager = AuthManager()
            manager._config = None
            manager._load_config()
            
            result = manager.authenticate()
            assert result["authenticated"] is True
            assert result["user_id"] == "anonymous"


class TestExceptions:
    """异常类测试"""
    
    def test_rabaimind_error_to_dict(self):
        """测试异常转换为字典"""
        error = RabAiMindError("测试错误", "TEST_ERROR", {"key": "value"})
        result = error.to_dict()
        
        assert result["success"] is False
        assert result["error"]["code"] == "TEST_ERROR"
        assert result["error"]["message"] == "测试错误"
        assert result["error"]["details"]["key"] == "value"
    
    def test_api_connection_error(self):
        """测试 API 连接错误"""
        error = APIConnectionError("连接失败")
        assert error.error_code == "API_CONNECTION_ERROR"
        assert error.http_status == 503
    
    def test_api_timeout_error(self):
        """测试 API 超时错误"""
        error = APITimeoutError("请求超时")
        assert error.error_code == "API_TIMEOUT"
        assert error.http_status == 504
    
    def test_task_not_found_error(self):
        """测试任务未找到错误"""
        error = TaskNotFoundError("任务不存在")
        assert error.error_code == "TASK_NOT_FOUND"
        assert error.http_status == 404
    
    def test_sanitize_error(self):
        """测试错误消息脱敏"""
        # 自定义异常
        error = ValidationError("输入无效")
        assert sanitize_error(error) == "输入无效"
        
        # 未知异常
        error = Exception("Internal error with sensitive data")
        assert sanitize_error(error) == "服务暂时不可用，请稍后重试"
    
    def test_get_http_status(self):
        """测试获取 HTTP 状态码"""
        error = TaskNotFoundError("任务不存在")
        assert get_http_status(error) == 404
        
        error = Exception("未知错误")
        assert get_http_status(error) == 500


class TestCommonUtils:
    """公共工具函数测试"""
    
    def test_parse_json_from_response_direct(self):
        """测试直接解析 JSON"""
        content = '{"name": "test", "value": 123}'
        result = parse_json_from_response(content)
        assert result == {"name": "test", "value": 123}
    
    def test_parse_json_from_response_markdown_block(self):
        """测试从 Markdown 代码块解析 JSON"""
        content = '''
这是响应内容
```json
{"name": "test", "value": 456}
```
其他内容
'''
        result = parse_json_from_response(content)
        assert result == {"name": "test", "value": 456}
    
    def test_parse_json_from_response_invalid(self):
        """测试无效 JSON 返回 None"""
        content = "这不是 JSON"
        result = parse_json_from_response(content)
        assert result is None
    
    def test_escape_html(self):
        """测试 HTML 转义"""
        assert escape_html("<script>") == "&lt;script&gt;"
        assert escape_html('a"b') == "a&quot;b"
        assert escape_html("a'b") == "a&#39;b"
        assert escape_html("a&b") == "a&amp;b"
        assert escape_html("") == ""
        assert escape_html(None) == ""
    
    def test_escape_url(self):
        """测试 URL 转义"""
        assert escape_url('https://example.com?a=1&b=2') == "https://example.com?a=1&amp;b=2"
        assert escape_url('test"quote') == "test&quot;quote"
    
    def test_truncate_text(self):
        """测试文本截断"""
        text = "这是一段很长的文本需要被截断"
        result = truncate_text(text, 10)
        assert len(result) == 10
        assert result.endswith("...")
        
        # 短文本不截断
        short = "短文本"
        assert truncate_text(short, 10) == short
    
    def test_sanitize_filename(self):
        """测试文件名清理"""
        assert sanitize_filename("normal.txt") == "normal.txt"
        assert sanitize_filename("../../../etc/passwd") == ".._.._.._etc_passwd"
        assert sanitize_filename('file<>:"|?*.txt') == "file.txt"
        assert sanitize_filename("   .hidden.  ") == "hidden"
    
    def test_hex_to_rgb(self):
        """测试十六进制颜色转 RGB"""
        assert hex_to_rgb("165DFF") == (22, 93, 255)
        assert hex_to_rgb("#165DFF") == (22, 93, 255)
        assert hex_to_rgb("invalid") == (0, 0, 0)
    
    def test_rgb_to_hex(self):
        """测试 RGB 转十六进制颜色"""
        assert rgb_to_hex(22, 93, 255) == "#165DFF"
        assert rgb_to_hex(0, 0, 0) == "#000000"
        assert rgb_to_hex(255, 255, 255) == "#FFFFFF"
    
    def test_calculate_brightness(self):
        """测试颜色亮度计算"""
        # 白色亮度最高
        assert calculate_brightness("FFFFFF") == 255
        # 黑色亮度最低
        assert calculate_brightness("000000") == 0
        # 中等亮度
        brightness = calculate_brightness("808080")
        assert 100 < brightness < 150


class TestIntegration:
    """集成测试"""
    
    def test_full_auth_flow(self):
        """测试完整认证流程"""
        with patch.dict(os.environ, {
            "API_AUTH_ENABLED": "true",
            "JWT_SECRET": "integration-test-secret"
        }, clear=True):
            manager = AuthManager()
            manager._config = None
            manager._load_config()
            
            # 创建 Token
            token = manager.create_token("test_user")
            
            # 使用 Token 认证
            result = manager.authenticate(auth_header=f"Bearer {token}")
            
            assert result["authenticated"] is True
            assert result["user_id"] == "test_user"
            assert result["method"] == "jwt"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
