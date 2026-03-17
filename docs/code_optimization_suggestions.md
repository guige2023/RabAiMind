# RabAi Mind 代码优化建议

## 一、高优先级优化

### 1.1 安全优化 - API 密钥管理

```python
# 优化前 (危险!)
API_KEY = "1d91e7e0-5761-4edb-a348-bc0b8b86affb"

# 优化后 (安全)
import os

class SecurityConfig:
    """安全配置类 - 统一管理密钥"""

    @staticmethod
    def get_volcano_api_key() -> str:
        """获取火山引擎 API 密钥"""
        api_key = os.environ.get("VOLCANO_API_KEY")
        if not api_key:
            raise ValueError("VOLCANO_API_KEY 环境变量未设置")
        return api_key

    @staticmethod
    def get_oss_config() -> dict:
        """获取 OSS 配置"""
        return {
            "endpoint": os.environ.get("OSS_ENDPOINT"),
            "access_key": os.environ.get("OSS_ACCESS_KEY"),
            "secret_key": os.environ.get("OSS_SECRET_KEY"),
            "bucket": os.environ.get("OSS_BUCKET")
        }
```

### 1.2 输入验证优化

```python
# 优化前
def generate_ppt(user_request, slide_count=10, scene="business"):
    # 没有验证
    pass

# 优化后
from dataclasses import dataclass
from typing import Optional
from enum import Enum

class SceneType(str, Enum):
    """场景类型枚举"""
    BUSINESS = "business"
    EDUCATION = "education"
    TECH = "tech"
    CREATIVE = "creative"

class StyleType(str, Enum):
    """风格类型枚举"""
    PROFESSIONAL = "professional"
    SIMPLE = "simple"
    ENERGETIC = "energetic"
    PREMIUM = "premium"

@dataclass
class GenerateRequest:
    """生成请求参数"""
    user_request: str
    slide_count: int = 10
    scene: SceneType = SceneType.BUSINESS
    style: StyleType = StyleType.PROFESSIONAL
    template: str = "default"
    theme_color: str = "#165DFF"

    def __post_init__(self):
        """验证参数"""
        if not self.user_request or len(self.user_request) < 10:
            raise ValueError("需求描述至少需要 10 个字符")
        if len(self.user_request) > 2000:
            raise ValueError("需求描述不能超过 2000 个字符")
        if not 5 <= self.slide_count <= 30:
            raise ValueError("幻灯片数量必须在 5-30 之间")
```

---

## 二、中优先级优化

### 2.1 日志系统优化

```python
# 优化前
def generate_ppt(user_request):
    print("开始生成...")  # 使用 print
    result = do_something()
    print("完成")  # 使用 print

# 优化后
import logging
from logging.handlers import RotatingFileHandler

def setup_logger(name: str, log_file: str) -> logging.Logger:
    """配置日志"""
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)

    # 格式化
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s'
    )

    # 文件处理器
    file_handler = RotatingFileHandler(
        log_file, maxBytes=10*1024*1024, backupCount=5
    )
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

    # 控制台处理器
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    return logger

logger = setup_logger("rabai_mind", "./logs/rabai_mind.log")

def generate_ppt(user_request):
    logger.info(f"开始生成 PPT, 请求: {user_request[:50]}...")
    try:
        result = do_something()
        logger.info("PPT 生成成功")
    except Exception as e:
        logger.error(f"PPT 生成失败: {str(e)}", exc_info=True)
        raise
```

### 2.2 统一错误处理

```python
# 优化前
def generate_ppt(user_request):
    try:
        result = do_something()
    except Exception as e:
        return {"error": str(e)}

# 优化后
from enum import Enum
from dataclasses import dataclass
from typing import Optional

class ErrorCode(str, Enum):
    """错误码"""
    VALIDATION_ERROR = "VALIDATION_ERROR"
    API_ERROR = "API_ERROR"
    RENDER_ERROR = "RENDER_ERROR"
    CONVERSION_ERROR = "CONVERSION_ERROR"
    UNKNOWN_ERROR = "UNKNOWN_ERROR"

@dataclass
class APIError:
    """API 错误"""
    code: ErrorCode
    message: str
    details: Optional[dict] = None

    def to_dict(self) -> dict:
        return {
            "success": False,
            "error": {
                "code": self.code.value,
                "message": self.message,
                "details": self.details
            }
        }

class APIException(Exception):
    """API 异常"""

    def __init__(self, code: ErrorCode, message: str, details: dict = None):
        self.error = APIError(code, message, details)
        super().__init__(message)

def handle_api_error(error: Exception) -> dict:
    """统一错误处理"""
    if isinstance(error, APIException):
        return error.error.to_dict()
    return APIError(
        ErrorCode.UNKNOWN_ERROR,
        str(error)
    ).to_dict()
```

---

## 三、低优先级优化

### 3.1 缓存优化

```python
# 添加缓存装饰器
from functools import wraps
import hashlib
import json

def cache_result(ttl: int = 3600):
    """缓存装饰器

    Args:
        ttl: 缓存过期时间(秒)
    """
    def decorator(func):
        cache = {}

        @wraps(func)
        def wrapper(*args, **kwargs):
            # 生成缓存键
            key = hashlib.md5(
                f"{func.__name__}:{json.dumps(args)}:{json.dumps(kwargs)}".encode()
            ).hexdigest()

            # 检查缓存
            if key in cache:
                import time
                if time.time() - cache[key]["timestamp"] < ttl:
                    return cache[key]["result"]

            # 执行函数
            result = func(*args, **kwargs)

            # 存入缓存
            cache[key] = {
                "result": result,
                "timestamp": time.time()
            }

            return result

        return wrapper
    return decorator

# 使用示例
@cache_result(ttl=3600)
def get_template_list():
    """获取模板列表 (缓存 1 小时)"""
    return load_templates()
```

### 3.2 性能优化

```python
# 添加连接池
import httpx
from contextlib import asynccontextmanager

class HTTPClient:
    """HTTP 客户端 - 连接池"""

    _client: httpx.AsyncClient = None

    @classmethod
    @asynccontextmanager
    async def get_client(cls):
        """获取 HTTP 客户端"""
        if cls._client is None:
            cls._client = httpx.AsyncClient(
                limits=httpx.Limits(
                    max_keepalive_connections=20,
                    max_connections=100
                ),
                timeout=30.0
            )
        try:
            yield cls._client
        finally:
            # 不关闭连接池，复用连接
            pass

# 使用示例
async def call_api():
    async with HTTPClient.get_client() as client:
        response = await client.post(url, json=data)
        return response.json()
```

---

## 四、代码结构优化

### 4.1 项目结构优化

```
rabai_mind/
├── src/                      # 源代码
│   ├── api/                  # API 层
│   │   ├── routes/          # 路由
│   │   ├── middleware/       # 中间件
│   │   └── dependencies/    # 依赖注入
│   ├── agents/               # Agent 层
│   │   ├── base.py          # 基类
│   │   ├── volcano.py       # 火山引擎
│   │   ├── svg.py           # SVG 渲染
│   │   └── okppt.py         # PPT 转换
│   ├── services/            # 服务层
│   │   ├── cache.py         # 缓存服务
│   │   ├── storage.py       # 存储服务
│   │   └── notification.py  # 通知服务
│   ├── models/              # 数据模型
│   │   ├── request.py       # 请求模型
│   │   └── response.py      # 响应模型
│   ├── utils/               # 工具函数
│   │   ├── logger.py        # 日志
│   │   ├── validator.py     # 验证
│   │   └── security.py      # 安全
│   └── config.py            # 配置
├── tests/                   # 测试
├── docs/                    # 文档
└── scripts/                 # 脚本
```

### 4.2 配置管理优化

```python
# config/settings.py
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    """应用配置"""

    # API 配置
    volcano_api_key: str
    volcano_endpoint: str = "https://ark.cn-beijing.volces.com/api/v3"

    # 服务配置
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    mcp_port: int = 8080

    # Redis 配置
    redis_url: Optional[str] = None

    # OSS 配置
    oss_endpoint: Optional[str] = None
    oss_bucket: Optional[str] = None

    # 日志
    log_level: str = "INFO"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
```

---

## 五、测试优化

### 5.1 单元测试优化

```python
# tests/test_volcano_agent.py
import pytest
from unittest.mock import Mock, patch, AsyncMock

class TestVolcanoAgent:
    """火山引擎 Agent 测试"""

    @pytest.fixture
    def agent(self):
        from agents.volcano_agent import VolcanoAgent
        return VolcanoAgent({"max_retries": 1})

    @pytest.mark.parametrize("scene,style", [
        ("business", "professional"),
        ("education", "simple"),
        ("tech", "energetic"),
    ])
    def test_generate_with_different_params(self, agent, scene, style):
        """参数化测试"""
        with patch.object(agent.client, 'generate_text') as mock:
            mock.return_value = {"content": "测试内容"}
            result = agent.generate_text_content("测试", scene=scene, style=style)
            assert result.text == "测试内容"

    def test_validation_error(self, agent):
        """测试验证错误"""
        with pytest.raises(ValueError):
            agent.generate_text_content("")  # 空输入
```

---

## 六、总结

| 优化类型 | 优先级 | 预计工作量 |
|----------|--------|------------|
| 安全优化 - API 密钥 | P0 | 30分钟 |
| 输入验证 | P0 | 1小时 |
| 日志系统 | P1 | 2小时 |
| 统一错误处理 | P1 | 1小时 |
| 缓存优化 | P2 | 2小时 |
| 性能优化 | P2 | 2小时 |
| 代码结构 | P3 | 4小时 |

建议按优先级逐步实施优化。
