"""Agent 记忆管理系统"""
import json
import time
from typing import Optional
from datetime import datetime
import redis.asyncio as redis
from app.core.config import settings


class MemoryManager:
    """Agent 记忆管理器 - 支持会话记忆和长期记忆"""

    def __init__(self, session_id: str, redis_client: Optional[redis.Redis] = None):
        self.session_id = session_id
        self.redis_client = redis_client
        self._local_cache = {}

        # Redis 键前缀
        self.session_key_prefix = f"agent:session:{session_id}"
        self.long_term_key_prefix = "agent:longterm"

    async def _get_redis(self) -> redis.Redis:
        """获取 Redis 连接"""
        if self.redis_client is None:
            self.redis_client = await redis.from_url(
                settings.redis_url,
                encoding="utf-8",
                decode_responses=True
            )
        return self.redis_client

    async def add_message(self, role: str, content: str, metadata: Optional[dict] = None):
        """添加消息到会话记忆"""
        redis_client = await self._get_redis()

        message = {
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat(),
            "metadata": metadata or {}
        }

        # 存储消息到 Redis 列表
        key = f"{self.session_key_prefix}:messages"
        await redis_client.rpush(key, json.dumps(message))

        # 设置过期时间（7天）
        await redis_client.expire(key, 7 * 24 * 60 * 60)

    async def get_messages(self, limit: int = 50) -> list[dict]:
        """获取会话消息历史"""
        redis_client = await self._get_redis()

        key = f"{self.session_key_prefix}:messages"
        messages = await redis_client.lrange(key, -limit, -1)

        result = []
        for msg in messages:
            try:
                result.append(json.loads(msg))
            except:
                continue

        return result

    async def clear_session(self):
        """清除会话记忆"""
        redis_client = await self._get_redis()

        # 删除会话相关的所有键
        keys = []
        async for key in redis_client.scan_iter(f"{self.session_key_prefix}:*"):
            keys.append(key)

        if keys:
            await redis_client.delete(*keys)

    async def save_session_summary(self, summary: str):
        """保存会话摘要（用于后续会话参考）"""
        redis_client = await self._get_redis()

        summary_data = {
            "session_id": self.session_id,
            "summary": summary,
            "timestamp": datetime.now().isoformat(),
        }

        key = f"{self.session_key_prefix}:summary"
        await redis_client.set(key, json.dumps(summary_data), ex=30 * 24 * 60 * 60)  # 30天

    async def get_session_summary(self) -> Optional[str]:
        """获取会话摘要"""
        redis_client = await self._get_redis()

        key = f"{self.session_key_prefix}:summary"
        data = await redis_client.get(key)

        if data:
            try:
                summary_data = json.loads(data)
                return summary_data.get("summary")
            except:
                return None

        return None

    async def add_to_long_term_memory(self, key: str, value: dict):
        """添加长期记忆"""
        redis_client = await self._get_redis()

        memory_key = f"{self.long_term_key_prefix}:{key}"
        await redis_client.set(
            memory_key,
            json.dumps(value),
            ex=365 * 24 * 60 * 60  # 1年
        )

    async def get_long_term_memory(self, key: str) -> Optional[dict]:
        """获取长期记忆"""
        redis_client = await self._get_redis()

        memory_key = f"{self.long_term_key_prefix}:{key}"
        data = await redis_client.get(memory_key)

        if data:
            try:
                return json.loads(data)
            except:
                return None

        return None

    async def search_long_term_memory(self, query: str) -> list[dict]:
        """搜索长期记忆（简单关键词匹配）"""
        redis_client = await self._get_redis()

        results = []
        async for key in redis_client.scan_iter(f"{self.long_term_key_prefix}:*"):
            if "summary" in key:
                continue

            data = await redis_client.get(key)
            if data and query.lower() in data.lower():
                try:
                    results.append(json.loads(data))
                except:
                    continue

        return results

    async def create_session_note(self, title: str, content: str, tags: list[str] = None):
        """创建会话笔记（Session Note Tool 功能）"""
        redis_client = await self._get_redis()

        note = {
            "title": title,
            "content": content,
            "tags": tags or [],
            "session_id": self.session_id,
            "created_at": datetime.now().isoformat(),
        }

        # 添加到笔记列表
        notes_key = f"{self.session_key_prefix}:notes"
        await redis_client.rpush(notes_key, json.dumps(note))
        await redis_client.expire(notes_key, 365 * 24 * 60 * 60)

    async def get_session_notes(self) -> list[dict]:
        """获取会话笔记"""
        redis_client = await self._get_redis()

        notes_key = f"{self.session_key_prefix}:notes"
        notes = await redis_client.lrange(notes_key, 0, -1)

        result = []
        for note in notes:
            try:
                result.append(json.loads(note))
            except:
                continue

        return result


class ContextManager:
    """上下文管理器 - 自动摘要长对话"""

    def __init__(self, max_tokens: int = 128000, summary_threshold: int = 100000):
        self.max_tokens = max_tokens
        self.summary_threshold = summary_threshold
        self._current_tokens = 0

    def estimate_tokens(self, text: str) -> int:
        """简单估算 token 数量（中英文混合）"""
        # 简单估算：中文约 1.5 token/字符，英文约 4 token/词
        chinese_chars = sum(1 for c in text if '\u4e00' <= c <= '\u9fff')
        english_words = sum(1 for c in text if c.isalpha() and not ('\u4e00' <= c <= '\u9fff'))

        return int(chinese_chars * 1.5 + english_words * 0.25)

    def should_summarize(self, messages: list[dict]) -> bool:
        """判断是否需要摘要"""
        total_tokens = 0
        for msg in messages:
            content = msg.get("content", "")
            if isinstance(content, str):
                total_tokens += self.estimate_tokens(content)

        return total_tokens > self.summary_threshold

    def format_messages_for_summary(self, messages: list[dict]) -> str:
        """格式化消息用于摘要"""
        formatted = []
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")

            if isinstance(content, list):
                text_parts = []
                for item in content:
                    if isinstance(item, dict) and item.get("type") == "text":
                        text_parts.append(item.get("text", ""))
                content = " ".join(text_parts)

            formatted.append(f"{role}: {content[:500]}...")

        return "\n".join(formatted)


# 全局上下文管理器实例
context_manager = ContextManager()
