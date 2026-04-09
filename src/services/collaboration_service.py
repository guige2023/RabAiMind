# -*- coding: utf-8 -*-
"""
实时协作服务 (R71)

提供:
- Presence: 在线用户状态管理
- Live Cursor: 他人光标位置广播
- Follow Mode: 跟随某人视口
- Conflict Resolution: 操作转换 (OT) 冲突处理
- Comment Threads: 带 @mention 的评论

作者: Claude
日期: 2026-04-04
"""

import asyncio
import json
import logging
import time
import uuid
from collections import defaultdict
from dataclasses import dataclass, field, asdict
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Set, Any
from enum import Enum

logger = logging.getLogger(__name__)


class CursorStyle(str, Enum):
    """光标样式"""
    POINTER = "pointer"
    TEXT = "text"
    CROSSHAIR = "crosshair"


@dataclass
class CursorPosition:
    """光标位置信息"""
    user_id: str
    user_name: str
    user_avatar: str = ""
    x: float = 0.0          # 归一化 0-1 相对坐标
    y: float = 0.0
    slide_num: int = 1       # 当前幻灯片
    viewport_x: float = 0.0  # 视口偏移
    viewport_y: float = 0.0
    viewport_zoom: float = 1.0
    cursor_style: str = CursorStyle.POINTER.value
    color: str = "#3B82F6"   # 用户颜色
    last_update: float = field(default_factory=time.time)
    is_editing: bool = False
    selection: Optional[Dict] = None  # 选中文本区域


@dataclass
class PresenceInfo:
    """在线用户信息"""
    user_id: str
    user_name: str
    user_avatar: str = ""
    role: str = "viewer"    # owner | editor | viewer | commenter
    color: str = "#3B82F6"
    slide_num: int = 1
    viewport_x: float = 0.0
    viewport_y: float = 0.0
    viewport_zoom: float = 1.0
    last_ping: float = field(default_factory=time.time)
    is_following: Optional[str] = None  # 正在跟随的用户ID
    following_since: Optional[float] = None


@dataclass
class CommentMention:
    """@提及"""
    user_id: str
    user_name: str
    start: int
    end: int  # 在文本中的位置范围


@dataclass
class Comment:
    """评论"""
    id: str
    task_id: str
    slide_num: int
    author_id: str
    author_name: str
    content: str
    author_avatar: str = ""
    mentions: List[Dict] = field(default_factory=list)
    resolved: bool = False
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = field(default_factory=lambda: datetime.now().isoformat())
    replies: List[Dict] = field(default_factory=list)


class OperationType(str, Enum):
    """操作类型 (用于 OT)"""
    INSERT = "insert"
    DELETE = "delete"
    REPLACE = "replace"
    MOVE_SLIDE = "move_slide"
    STYLE_CHANGE = "style_change"
    ELEMENT_ADD = "element_add"
    ELEMENT_DELETE = "element_delete"
    ELEMENT_MOVE = "element_move"
    ELEMENT_RESIZE = "element_resize"


@dataclass
class Operation:
    """协作操作 (OT)"""
    id: str
    task_id: str
    user_id: str
    type: str
    slide_num: int
    element_id: Optional[str] = None
    position: Optional[Dict] = None   # insert/delete 位置
    data: Optional[Dict] = None        # 操作数据
    version: int = 0                   # 操作版本号
    timestamp: float = field(default_factory=time.time)
    # OT fields
    base_version: int = 0              # 客户端应用前的基准版本
    client_id: str = ""               # 客户端标识


@dataclass
class SuggestEdit:
    """编辑建议（非破坏性修改建议）"""
    id: str
    task_id: str
    slide_num: int
    author_id: str
    author_name: str
    author_avatar: str = ""
    edit_type: str = "text"   # text | image | layout | style
    original_content: Dict = field(default_factory=dict)
    suggested_content: Dict = field(default_factory=dict)
    reason: str = ""
    status: str = "pending"  # pending | accepted | rejected
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    resolved_by: Optional[str] = None
    resolved_at: Optional[str] = None


@dataclass
class ActivityEntry:
    """活动动态条目"""
    id: str
    task_id: str
    activity_type: str  # join | leave | edit | comment | suggest | resolve | share | download | create_slide | delete_slide | regenerate | apply_template
    user_id: str
    user_name: str
    user_avatar: str = ""
    target: str = ""   # 操作目标（如幻灯片号、评论内容摘要）
    details: str = ""   # 额外详情
    slide_num: Optional[int] = None
    timestamp: float = field(default_factory=time.time)
    read: bool = False


class CollaborationService:
    """
    实时协作核心服务
    
    管理:
    - WebSocket 连接池
    - Presence (在线状态)
    - Cursor (光标位置)
    - Follow Mode (跟随)
    - Operation Transform (冲突解决)
    - Comments (评论)
    """
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._init()
        return cls._instance
    
    def _init(self):
        """初始化"""
        # WebSocket 连接管理: task_id -> {user_id -> {websocket, last_heartbeat}}
        self.connections: Dict[str, Dict[str, Dict[str, Any]]] = defaultdict(dict)
        
        # Presence: task_id -> {user_id -> PresenceInfo}
        self.presence: Dict[str, Dict[str, PresenceInfo]] = defaultdict(dict)
        
        # Cursors: task_id -> {user_id -> CursorPosition}
        self.cursors: Dict[str, Dict[str, CursorPosition]] = defaultdict(dict)
        
        # Operation history: task_id -> [operations] (用于 OT 重放)
        self.operations: Dict[str, List[Operation]] = defaultdict(list)
        self.operation_versions: Dict[str, int] = defaultdict(int)  # task_id -> current version
        
        # Follow mode: task_id -> {follower_id -> followed_id}
        self.following: Dict[str, Dict[str, str]] = defaultdict(dict)
        
        # Comments: task_id -> [Comment]
        self.comments: Dict[str, List[Comment]] = defaultdict(list)

        # Suggest Edits: task_id -> [SuggestEdit]
        self.suggest_edits: Dict[str, List[SuggestEdit]] = defaultdict(list)

        # Activity Feed: task_id -> [ActivityEntry]
        self.activity_feed: Dict[str, List[ActivityEntry]] = defaultdict(list)

        # 锁
        self._lock = asyncio.Lock()
        
        # 广播队列
        self._broadcast_queues: Dict[str, Dict[str, asyncio.Queue]] = defaultdict(dict)
        
        # 心跳清理任务
        self._cleanup_task: Optional[asyncio.Task] = None
        self._shutdown = False
        logger.info("CollaborationService initialized")
    
    # ─── Connection Management ───────────────────────────────────────────────
    
    def register_connection(self, task_id: str, user_id: str, user_name: str,
                           user_avatar: str, role: str, websocket) -> PresenceInfo:
        """注册新的 WebSocket 连接"""
        color = self._generate_user_color(user_id)
        presence = PresenceInfo(
            user_id=user_id,
            user_name=user_name,
            user_avatar=user_avatar,
            role=role,
            color=color,
            last_ping=time.time(),
        )
        
        # 存储连接时记录时间戳
        self.connections[task_id][user_id] = {
            "websocket": websocket,
            "last_heartbeat": time.time(),
            "user_name": user_name,
        }
        self.presence[task_id][user_id] = presence
        
        # 启动心跳清理任务（如果尚未启动）
        self._start_cleanup_task()
        
        logger.info(f"User {user_id} connected to task {task_id} (role={role})")
        return presence
    
    def unregister_connection(self, task_id: str, user_id: str):
        """注销连接"""
        if task_id in self.connections and user_id in self.connections[task_id]:
            del self.connections[task_id][user_id]
        if task_id in self.presence and user_id in self.presence[task_id]:
            del self.presence[task_id][user_id]
        if task_id in self.cursors and user_id in self.cursors[task_id]:
            del self.cursors[task_id][user_id]
        
        # 清除跟随关系
        if task_id in self.following:
            if user_id in self.following[task_id]:
                del self.following[task_id][user_id]
            # 清除被他人跟随的情况
            for follower_id, followed_id in list(self.following[task_id].items()):
                if followed_id == user_id:
                    del self.following[task_id][follower_id]
        
        logger.info(f"User {user_id} disconnected from task {task_id}")
    
    def update_heartbeat(self, task_id: str, user_id: str):
        """更新心跳时间戳"""
        if task_id in self.connections and user_id in self.connections[task_id]:
            self.connections[task_id][user_id]["last_heartbeat"] = time.time()
    
    def _start_cleanup_task(self):
        """启动心跳清理任务"""
        if self._cleanup_task is None or self._cleanup_task.done():
            self._cleanup_task = asyncio.create_task(self._cleanup_loop())
    
    async def _cleanup_loop(self):
        """定期清理超时连接"""
        while not self._shutdown:
            try:
                await asyncio.sleep(10)  # 每10秒检查一次
                await self._cleanup_dead_connections()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Cleanup loop error: {e}")
    
    async def _cleanup_dead_connections(self):
        """清理超时无心跳的连接"""
        timeout = 30  # 30秒无心跳视为断开
        now = time.time()
        dead_tasks = []
        
        async with self._lock:
            for task_id, connections in list(self.connections.items()):
                dead_users = []
                for user_id, conn_info in connections.items():
                    last_hb = conn_info.get("last_heartbeat", 0)
                    if now - last_hb > timeout:
                        dead_users.append(user_id)
                
                for user_id in dead_users:
                    logger.warning(f"Cleaning up dead connection: {user_id} in task {task_id} (timeout)")
                    self.unregister_connection(task_id, user_id)
                    dead_tasks.append((task_id, user_id))
        
        # 广播用户离开
        for task_id, user_id in dead_tasks:
            await self._broadcast_to_task(task_id, {
                "type": "user_left",
                "user_id": user_id,
                "reason": "timeout",
            })
    
    def shutdown(self):
        """关闭服务，清理所有资源"""
        self._shutdown = True
        if self._cleanup_task and not self._cleanup_task.done():
            self._cleanup_task.cancel()
    
    # ─── Presence ─────────────────────────────────────────────────────────────
    
    async def update_presence(self, task_id: str, user_id: str, slide_num: int = None,
                              viewport: Dict = None, is_following: str = None):
        """更新用户存在状态"""
        presence = self.presence.get(task_id, {}).get(user_id)
        if not presence:
            return
        
        if slide_num is not None:
            presence.slide_num = slide_num
        if viewport:
            presence.viewport_x = viewport.get("x", 0)
            presence.viewport_y = viewport.get("y", 0)
            presence.viewport_zoom = viewport.get("zoom", 1.0)
        if is_following is not None:
            presence.is_following = is_following
            presence.following_since = time.time() if is_following else None
        
        presence.last_ping = time.time()
        
        # 广播 presence 变化
        await self._broadcast_to_task(task_id, {
            "type": "presence_update",
            "user_id": user_id,
            "data": asdict(presence),
        }, exclude_user=user_id)
    
    # ─── Cursor ───────────────────────────────────────────────────────────────
    
    async def update_cursor(self, task_id: str, user_id: str, cursor: CursorPosition):
        """更新用户光标位置"""
        cursor.last_update = time.time()
        self.cursors[task_id][user_id] = cursor
        
        # 广播光标变化 (高频，只广播给其他人)
        await self._broadcast_to_task(task_id, {
            "type": "cursor_update",
            "user_id": user_id,
            "cursor": asdict(cursor),
        }, exclude_user=user_id)
    
    def get_cursors(self, task_id: str) -> Dict[str, CursorPosition]:
        """获取所有光标"""
        return dict(self.cursors.get(task_id, {}))
    
    # ─── Follow Mode ──────────────────────────────────────────────────────────
    
    async def follow_user(self, task_id: str, follower_id: str, followed_id: str):
        """跟随某用户"""
        self.following[task_id][follower_id] = followed_id
        
        # 更新被跟随者的 following_since
        followed_presence = self.presence.get(task_id, {}).get(followed_id)
        if followed_presence:
            followed_presence.is_following = followed_id
            followed_presence.following_since = time.time()
        
        await self._broadcast_to_task(task_id, {
            "type": "follow_started",
            "follower_id": follower_id,
            "followed_id": followed_id,
        }, exclude_user=follower_id)
        
        logger.info(f"User {follower_id} started following {followed_id} in task {task_id}")
    
    async def unfollow_user(self, task_id: str, follower_id: str):
        """取消跟随"""
        followed_id = self.following.get(task_id, {}).pop(follower_id, None)
        
        await self._broadcast_to_task(task_id, {
            "type": "follow_ended",
            "follower_id": follower_id,
        }, exclude_user=follower_id)
        
        logger.info(f"User {follower_id} unfollowed in task {task_id}")
    
    def get_viewport_to_follow(self, task_id: str, user_id: str) -> Optional[Dict]:
        """获取被跟随用户的视口 (用于同步)"""
        followed_id = self.following.get(task_id, {}).get(user_id)
        if not followed_id:
            return None
        
        presence = self.presence.get(task_id, {}).get(followed_id)
        if not presence:
            return None
        
        return {
            "user_id": followed_id,
            "user_name": presence.user_name,
            "slide_num": presence.slide_num,
            "viewport_x": presence.viewport_x,
            "viewport_y": presence.viewport_y,
            "viewport_zoom": presence.viewport_zoom,
        }
    
    # ─── Operation Transform (Conflict Resolution) ─────────────────────────────
    
    async def apply_operation(self, task_id: str, op: Operation) -> Dict[str, Any]:
        """
        应用操作并解决冲突
        
        使用简化的 OT (Operation Transform):
        1. 接收客户端操作 (base_version = 客户端已知版本)
        2. 将 base_version 之后的所有操作转换为相对于新操作
        3. 应用转换后的操作
        4. 返回转换后的需要重做的操作列表给其他客户端
        """
        async with self._lock:
            current_version = self.operation_versions[task_id]
            
            # Transform: 转换新操作以适应 base_version 之后的其他操作
            transformed_ops = []
            for existing_op in self.operations[task_id]:
                if existing_op.version > op.base_version:
                    # 转换 existing_op 使其相对于新操作
                    transformed = self._transform_op(existing_op, op)
                    if transformed:
                        transformed_ops.append(transformed)
            
            # 应用操作
            op.version = current_version + 1
            self.operations[task_id].append(op)
            self.operation_versions[task_id] = op.version
            
            # 广播转换后的操作给其他客户端
            if transformed_ops or True:  # 始终广播，让客户端知道版本变化
                await self._broadcast_to_task(task_id, {
                    "type": "operation_applied",
                    "operation": asdict(op),
                    "transformed_ops": [asdict(t) for t in transformed_ops],
                    "server_version": op.version,
                }, exclude_user=op.user_id)
            
            return {
                "accepted": True,
                "version": op.version,
                "transformed_ops": [asdict(t) for t in transformed_ops],
            }
    
    def _transform_op(self, op1: Operation, op2: Operation) -> Optional[Operation]:
        """
        转换两个并发操作以解决冲突
        
        简化 OT 规则:
        - 如果两个操作作用于不同元素或不同位置 → 无需转换
        - 如果作用于同一元素 → 根据类型转换
        """
        # 不同元素: 无冲突
        if op1.element_id and op2.element_id and op1.element_id != op2.element_id:
            return op1
        
        # 不同幻灯片: 无冲突
        if op1.slide_num != op2.slide_num:
            return op1
        
        # 同一元素/同一幻灯片: 需要转换
        # 策略: 后者优先 (Last-Write-Wins for conflicting element operations)
        # 对于文字内容使用 OT 转换
        
        if op1.type == OperationType.INSERT.value and op2.type == OperationType.INSERT.value:
            if op1.position and op2.position:
                p1 = op1.position
                p2 = op2.position
                # 如果 op2 的插入位置在 op1 之后，op1 的位置需要偏移
                if p2.get("index", 0) >= p1.get("index", 0):
                    if op1.position:
                        op1.position["index"] = p1.get("index", 0) + p2.data.get("length", 1) if p2.get("index", 0) == p1.get("index", 0) else p1.get("index", 0)
            return op1
        
        if op1.type == OperationType.DELETE.value and op2.type == OperationType.DELETE.value:
            # 简单 LWW: 保留 op2 (后来的优先)
            return None
        
        # 默认: 保留 op1，让 op2 重试
        return op1
    
    def get_operations_since(self, task_id: str, since_version: int) -> List[Dict]:
        """获取指定版本之后的操作"""
        ops = [asdict(op) for op in self.operations.get(task_id, [])
               if op.version > since_version]
        return ops
    
    # ─── Comments ─────────────────────────────────────────────────────────────
    
    async def add_comment(self, task_id: str, slide_num: int, author_id: str,
                          author_name: str, author_avatar: str, content: str,
                          mentions: List[Dict] = None) -> Comment:
        """添加评论"""
        comment = Comment(
            id=str(uuid.uuid4()),
            task_id=task_id,
            slide_num=slide_num,
            author_id=author_id,
            author_name=author_name,
            author_avatar=author_avatar,
            content=content,
            mentions=mentions or [],
        )
        self.comments[task_id].append(comment)
        
        await self._broadcast_to_task(task_id, {
            "type": "comment_added",
            "comment": asdict(comment),
        })
        
        return comment
    
    async def reply_comment(self, task_id: str, comment_id: str, author_id: str,
                            author_name: str, author_avatar: str, content: str,
                            mentions: List[Dict] = None):
        """回复评论"""
        comment = next((c for c in self.comments[task_id] if c.id == comment_id), None)
        if not comment:
            return None
        
        reply = {
            "id": str(uuid.uuid4()),
            "author_id": author_id,
            "author_name": author_name,
            "author_avatar": author_avatar,
            "content": content,
            "mentions": mentions or [],
            "created_at": datetime.now().isoformat(),
        }
        comment.replies.append(reply)
        comment.updated_at = datetime.now().isoformat()
        
        await self._broadcast_to_task(task_id, {
            "type": "comment_replied",
            "task_id": task_id,
            "comment_id": comment_id,
            "reply": reply,
        })
        
        return reply
    
    async def resolve_comment(self, task_id: str, comment_id: str, resolved: bool = True):
        """解决/重新打开评论"""
        comment = next((c for c in self.comments[task_id] if c.id == comment_id), None)
        if comment:
            comment.resolved = resolved
            comment.updated_at = datetime.now().isoformat()
            await self._broadcast_to_task(task_id, {
                "type": "comment_resolved",
                "task_id": task_id,
                "comment_id": comment_id,
                "resolved": resolved,
            })
    
    def get_comments(self, task_id: str, slide_num: int = None) -> List[Dict]:
        """获取评论"""
        comments = self.comments.get(task_id, [])
        if slide_num is not None:
            comments = [c for c in comments if c.slide_num == slide_num]
        return [asdict(c) for c in comments]
    
    # ─── Broadcast ─────────────────────────────────────────────────────────────
    
    async def _broadcast_to_task(self, task_id: str, message: Dict,
                                  exclude_user: str = None):
        """广播消息给任务的所有连接"""
        connections = self.connections.get(task_id, {})
        dead_connections = []
        
        for uid, conn_info in connections.items():
            if exclude_user and uid == exclude_user:
                continue
            try:
                ws = conn_info.get("websocket")
                if ws:
                    await ws.send_json(message)
            except Exception as e:
                logger.warning(f"Failed to send to {uid}: {e}")
                dead_connections.append(uid)
        
        # 清理死连接
        for uid in dead_connections:
            self.unregister_connection(task_id, uid)
    
    # ─── Helpers ───────────────────────────────────────────────────────────────
    
    def _generate_user_color(self, user_id: str) -> str:
        """为用户生成一致的颜色"""
        colors = [
            "#3B82F6", "#EF4444", "#10B981", "#F59E0B",
            "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16",
        ]
        hash_val = sum(ord(c) for c in user_id)
        return colors[hash_val % len(colors)]
    
    # ─── Suggest Edits ──────────────────────────────────────────────────────────

    async def add_suggest_edit(
        self,
        task_id: str,
        slide_num: int,
        author_id: str,
        author_name: str,
        author_avatar: str,
        edit_type: str,
        original_content: Dict,
        suggested_content: Dict,
        reason: str,
    ) -> SuggestEdit:
        """添加编辑建议"""
        edit = SuggestEdit(
            id=f"sug_{uuid.uuid4().hex[:12]}",
            task_id=task_id,
            slide_num=slide_num,
            author_id=author_id,
            author_name=author_name,
            author_avatar=author_avatar,
            edit_type=edit_type,
            original_content=original_content,
            suggested_content=suggested_content,
            reason=reason,
        )
        self.suggest_edits[task_id].append(edit)
        await self._broadcast_to_task(task_id, {
            "type": "suggest_edit_added",
            "edit": asdict(edit),
        })
        # Also log as activity
        await self.log_activity(task_id, "suggest", author_id, author_name, author_avatar,
                                target=f"第{slide_num}页", details=reason, slide_num=slide_num)
        return edit

    async def resolve_suggest_edit(
        self, task_id: str, edit_id: str, status: str, resolved_by: str
    ) -> bool:
        """接受/拒绝编辑建议"""
        edit = next((e for e in self.suggest_edits[task_id] if e.id == edit_id), None)
        if not edit:
            return False
        edit.status = status
        edit.resolved_by = resolved_by
        edit.resolved_at = datetime.now().isoformat()
        await self._broadcast_to_task(task_id, {
            "type": "suggest_edit_resolved",
            "edit_id": edit_id,
            "status": status,
            "resolved_by": resolved_by,
        })
        action = "accepted" if status == "accepted" else "rejected"
        await self.log_activity(task_id, "resolve", resolved_by, resolved_by,
                                target=f"建议", details=f"{action}了第{edit.slide_num}页的编辑建议")
        return True

    def get_suggest_edits(self, task_id: str, slide_num: int = None) -> List[Dict]:
        """获取编辑建议列表"""
        edits = self.suggest_edits.get(task_id, [])
        if slide_num is not None:
            edits = [e for e in edits if e.slide_num == slide_num]
        return [asdict(e) for e in edits]

    # ─── Activity Feed ─────────────────────────────────────────────────────────

    async def log_activity(
        self,
        task_id: str,
        activity_type: str,
        user_id: str,
        user_name: str,
        user_avatar: str = "",
        target: str = "",
        details: str = "",
        slide_num: Optional[int] = None,
    ) -> ActivityEntry:
        """记录活动动态"""
        entry = ActivityEntry(
            id=f"act_{uuid.uuid4().hex[:12]}",
            task_id=task_id,
            activity_type=activity_type,
            user_id=user_id,
            user_name=user_name,
            user_avatar=user_avatar,
            target=target,
            details=details,
            slide_num=slide_num,
        )
        self.activity_feed[task_id].insert(0, entry)
        # Keep max 500 entries per task
        if len(self.activity_feed[task_id]) > 500:
            self.activity_feed[task_id] = self.activity_feed[task_id][:500]
        await self._broadcast_to_task(task_id, {
            "type": "activity_logged",
            "activity": asdict(entry),
        })
        return entry

    def get_activity_feed(
        self,
        task_id: str,
        activity_type: str = None,
        user_id: str = None,
        limit: int = 100,
    ) -> List[Dict]:
        """获取活动动态列表"""
        entries = self.activity_feed.get(task_id, [])
        if activity_type:
            entries = [e for e in entries if e.activity_type == activity_type]
        if user_id:
            entries = [e for e in entries if e.user_id == user_id]
        return [asdict(e) for e in entries[:limit]]

    def mark_activity_read(self, task_id: str, activity_id: str) -> bool:
        """标记活动为已读"""
        entry = next((e for e in self.activity_feed[task_id] if e.id == activity_id), None)
        if entry:
            entry.read = True
            return True
        return False

    def mark_all_activities_read(self, task_id: str) -> int:
        """全部标记为已读，返回标记数量"""
        count = 0
        for entry in self.activity_feed[task_id]:
            if not entry.read:
                entry.read = True
                count += 1
        return count

    def get_presence_list(self, task_id: str) -> List[Dict]:
        """获取在线用户列表"""
        return [asdict(p) for p in self.presence.get(task_id, {}).values()]


def get_collaboration_service() -> CollaborationService:
    """获取单例实例"""
    return CollaborationService()
