# RabAi Mind 缓存策略设计

## 1. 缓存架构概览

```
┌─────────────────────────────────────────────────────────────────────┐
│                          缓存分层架构                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐         │
│  │   L1 缓存   │     │   L2 缓存   │     │   L3 缓存   │         │
│  │  (内存)     │     │  (Redis)    │     │  (数据库)   │         │
│  │             │     │             │     │             │         │
│  │  - 热点数据 │     │  - 会话     │     │  - 持久化   │         │
│  │  - 模板缓存 │     │  - 任务状态 │     │  - 用户数据 │         │
│  │  - API响应  │     │  - 结果缓存 │     │             │         │
│  └─────────────┘     └─────────────┘     └─────────────┘         │
│                                                                     │
│  访问速度: L1 > L2 > L3                                            │
│  容量大小: L1 < L2 < L3                                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Redis 缓存策略

### 2.1 键设计规范

```python
# Redis 键命名规范
# 格式: 项目:模块:标识[:子标识]

# 任务相关键
TASK_PREFIX = "rabai:task:"           # 任务前缀
TASK_STATUS = "status"                # 任务状态
TASK_PROGRESS = "progress"            # 任务进度
TASK_RESULT = "result"                # 任务结果
TASK_ERROR = "error"                  # 错误信息

# 示例: rabai:task:uuid-123:status = "processing"

# 用户相关键
USER_PREFIX = "rabai:user:"           # 用户前缀
USER_SESSION = "session"              # 会话信息
USER_TOKEN = "token"                  # 认证令牌

# 模板相关键
TEMPLATE_PREFIX = "rabai:template:"   # 模板前缀
TEMPLATE_LIST = "list"                # 模板列表
TEMPLATE_DATA = "data"                # 模板数据

# 缓存相关键
CACHE_PREFIX = "rabai:cache:"         # 缓存前缀
API_RESPONSE = "api"                  # API 响应缓存
```

### 2.2 TTL 设计

```python
from enum import Enum

class CacheTTL(Enum):
    """缓存过期时间枚举

    单位: 秒
    """
    # 短缓存 (1-5分钟)
    TASK_STATUS = 60                  # 任务状态
    API_RESPONSE = 120                # API 响应

    # 中缓存 (15-60分钟)
    USER_SESSION = 1800               # 用户会话
    TEMPLATE_LIST = 3600             # 模板列表

    # 长缓存 (1-24小时)
    TEMPLATE_DATA = 86400            # 模板数据
    HOT_SLIDES = 43200               # 热门幻灯片

    # 极长缓存 (7天+)
    USER_PROFILE = 604800             # 用户配置

# 不同场景的 TTL 配置
TTL_CONFIG = {
    # 任务场景
    "task:creating": 3600,           # 创建中任务
    "task:completed": 86400,          # 已完成任务
    "task:failed": 3600,             # 失败任务

    # 用户场景
    "user:session": 1800,            # 会话
    "user:preferences": 86400,       # 用户偏好

    # 模板场景
    "template:list": 3600,           # 模板列表
    "template:detail": 86400,        # 模板详情
}
```

### 2.3 缓存策略模式

```python
from functools import wraps
import json
import hashlib

def cache_key(*args, **kwargs):
    """生成缓存键"""
    key_data = f"{':'.join(str(a) for a in args)}:{':'.join(f'{k}={v}' for k,v in sorted(kwargs.items()))}"
    return hashlib.md5(key_data.encode()).hexdigest()

def redis_cache(prefix: str, ttl: int = 3600):
    """Redis 缓存装饰器

    Args:
        prefix: 缓存键前缀
        ttl: 过期时间(秒)

    Example:
        @redis_cache("ppt:generate", ttl=1800)
        def generate_ppt(request):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # 生成缓存键
            key = f"{prefix}:{cache_key(*args, **kwargs)}"

            # 尝试从缓存获取
            cached = redis_client.get(key)
            if cached:
                return json.loads(cached)

            # 执行函数
            result = func(*args, **kwargs)

            # 存入缓存
            redis_client.setex(key, ttl, json.dumps(result))

            return result
        return wrapper
    return decorator
```

---

## 3. 任务状态缓存

### 3.1 任务状态存储结构

```python
import redis
from typing import Dict, Any, Optional

class TaskCache:
    """任务缓存管理类"""

    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.prefix = "rabai:task:"

    def _get_key(self, task_id: str, field: str) -> str:
        """获取完整的缓存键"""
        return f"{self.prefix}{task_id}:{field}"

    def create_task(self, task_id: str, data: Dict[str, Any]) -> None:
        """创建任务缓存

        Args:
            task_id: 任务ID
            data: 任务初始数据
        """
        pipe = self.redis.pipeline()

        # 存储任务基本信息
        pipe.hset(self._get_key(task_id, "info"), mapping={
            "task_id": task_id,
            "status": "pending",
            "created_at": data.get("created_at", ""),
            "user_request": data.get("user_request", "")
        })

        # 设置过期时间 (7天)
        pipe.expire(self._get_key(task_id, "info"), 604800)

        # 初始化进度
        pipe.set(self._get_key(task_id, "progress"), 0)
        pipe.expire(self._get_key(task_id, "progress"), 604800)

        pipe.execute()

    def update_status(self, task_id: str, status: str, progress: int = None) -> None:
        """更新任务状态

        Args:
            task_id: 任务ID
            status: 任务状态
            progress: 进度百分比 (可选)
        """
        pipe = self.redis.pipeline()

        # 更新状态
        pipe.hset(self._get_key(task_id, "info"), "status", status)
        pipe.hset(self._get_key(task_id, "info"), "updated_at", "now()")

        # 更新进度
        if progress is not None:
            pipe.set(self._get_key(task_id, "progress"), progress)

        pipe.execute()

    def get_status(self, task_id: str) -> Optional[Dict[str, Any]]:
        """获取任务状态

        Args:
            task_id: 任务ID

        Returns:
            任务状态字典
        """
        info = self.redis.hgetall(self._get_key(task_id, "info"))
        progress = self.redis.get(self._get_key(task_id, "progress"))

        if not info:
            return None

        return {
            "task_id": info.get(b"task_id", b"").decode(),
            "status": info.get(b"status", b"").decode(),
            "progress": int(progress) if progress else 0,
            "created_at": info.get(b"created_at", b"").decode(),
            "updated_at": info.get(b"updated_at", b"").decode()
        }

    def set_result(self, task_id: str, result: Dict[str, Any]) -> None:
        """存储任务结果

        Args:
            task_id: 任务ID
            result: 任务结果
        """
        # 存储结果 (7天过期)
        self.redis.setex(
            self._get_key(task_id, "result"),
            604800,
            json.dumps(result)
        )

        # 更新状态为完成
        self.update_status(task_id, "completed", 100)
```

---

## 4. 模板缓存策略

### 4.1 模板缓存设计

```python
class TemplateCache:
    """模板缓存管理类"""

    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.prefix = "rabai:template:"

    def get_template_list(self, force_refresh: bool = False) -> List[Dict]:
        """获取模板列表

        Args:
            force_refresh: 是否强制刷新缓存

        Returns:
            模板列表
        """
        cache_key = f"{self.prefix}list"

        # 非强制刷新时尝试从缓存获取
        if not force_refresh:
            cached = self.redis.get(cache_key)
            if cached:
                return json.loads(cached)

        # 从数据库/文件系统加载
        templates = self._load_templates_from_disk()

        # 存入缓存 (1小时过期)
        self.redis.setex(cache_key, 3600, json.dumps(templates))

        return templates

    def get_template_data(self, template_id: str) -> Optional[Dict]:
        """获取模板详情

        Args:
            template_id: 模板ID

        Returns:
            模板数据
        """
        cache_key = f"{self.prefix}{template_id}:data"

        # 尝试从缓存获取
        cached = self.redis.get(cache_key)
        if cached:
            return json.loads(cached)

        # 从文件系统加载
        template_data = self._load_template_from_disk(template_id)

        if template_data:
            # 存入缓存 (24小时过期)
            self.redis.setex(cache_key, 86400, json.dumps(template_data))

        return template_data

    def invalidate_template(self, template_id: str) -> None:
        """清除模板缓存

        Args:
            template_id: 模板ID
        """
        # 清除详情缓存
        self.redis.delete(f"{self.prefix}{template_id}:data")

        # 清除列表缓存 (下次会自动刷新)
        self.redis.delete(f"{self.prefix}list")
```

---

## 5. 分布式锁

### 5.1 任务锁设计

```python
import time
from contextlib import contextmanager

class DistributedLock:
    """分布式锁管理类"""

    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client

    @contextmanager
    def lock(self, lock_key: str, timeout: int = 30, retry_times: int = 3):
        """获取分布式锁

        Args:
            lock_key: 锁键
            timeout: 锁超时时间(秒)
            retry_times: 重试次数

        Example:
            with distributed_lock.lock("task:generate:123"):
                # 执行需要锁的操作
                ...
        """
        lock_value = str(time.time())
        acquire_key = f"lock:{lock_key}"

        # 尝试获取锁
        for i in range(retry_times):
            if self.redis.set(acquire_key, lock_value, nx=True, ex=timeout):
                try:
                    yield True
                finally:
                    # 释放锁 (只释放自己的锁)
                    if self.redis.get(acquire_key) == lock_value.encode():
                        self.redis.delete(acquire_key)
                return
            time.sleep(0.1)

        raise RuntimeError(f"无法获取锁: {lock_key}")

    def is_locked(self, lock_key: str) -> bool:
        """检查锁是否被持有"""
        return self.redis.exists(f"lock:{lock_key}") > 0
```

---

## 6. 缓存监控

### 6.1 缓存命中率监控

```python
class CacheMonitor:
    """缓存监控类"""

    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client

    def get_cache_stats(self) -> Dict[str, Any]:
        """获取缓存统计信息

        Returns:
            缓存统计字典
        """
        info = self.redis.info("stats")

        return {
            "total_keys": self.redis.dbsize(),
            "hits": info.get("keyspace_hits", 0),
            "misses": info.get("keyspace_misses", 0),
            "hit_rate": self._calculate_hit_rate(info),
            "memory_used": self.redis.info("memory").get("used_memory_human")
        }

    def _calculate_hit_rate(self, info: Dict) -> float:
        """计算缓存命中率"""
        hits = info.get("keyspace_hits", 0)
        misses = info.get("keyspace_misses", 0)
        total = hits + misses

        if total == 0:
            return 0.0

        return round((hits / total) * 100, 2)

    def get_key_pattern_stats(self, pattern: str) -> Dict[str, int]:
        """获取指定模式的键统计

        Args:
            pattern: 键模式

        Returns:
            键统计字典
        """
        keys = self.redis.keys(pattern)

        return {
            "pattern": pattern,
            "count": len(keys),
            "keys": [k.decode() if isinstance(k, bytes) else k for k in keys[:10]]
        }
```

---

## 7. 缓存策略总结

| 缓存类型 | 存储介质 | 过期时间 | 适用场景 |
|----------|----------|----------|----------|
| 任务状态 | Redis | 7天 | 任务查询 |
| 用户会话 | Redis | 30分钟 | 认证 |
| 模板列表 | Redis | 1小时 | 首页加载 |
| 模板详情 | Redis | 24小时 | 模板编辑 |
| API响应 | Redis | 2分钟 | 重复请求 |
| 热点数据 | 内存 | 进程周期 | 高频访问 |

---

**文档版本历史**

| 版本 | 日期 | 修改人 | 修改内容 |
|------|------|--------|----------|
| v1.0.0 | 2026-03-17 | 技术架构师 Agent | 初始版本 |
