# -*- coding: utf-8 -*-
"""
RabAi Mind API 主入口

所有配置通过 Settings 类读取，Settings 是唯一配置来源。
CORS 配置从环境变量 CORS_ORIGINS 读取（逗号分隔）。

作者: Claude
日期: 2026-03-17
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from .api import api_router
from .config import settings, get_cors_origins
from .utils import setup_logger

# Import auth middleware
from .api.middleware.auth import AuthMiddleware

# Import shared HTTP client for connection pooling
from .core.http_client import http_client

# 配置日志
logger = setup_logger("api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    # Startup
    logger.info("RabAi Mind API 启动中...")
    logger.info(f"配置: 端口={settings.API_PORT}, 日志级别={settings.LOG_LEVEL}")
    logger.info(f"CORS 允许源: {settings.CORS_ORIGINS}")

    # 启动 HTTP 连接池
    await http_client.start()
    logger.info("✅ HTTP 连接池 (connection pool) 已启动")

    # 启动调度器（定时任务服务）
    from .services.scheduler_service import get_scheduler_service
    scheduler = get_scheduler_service()
    try:
        scheduler.start()
        logger.info("✅ 调度器 (SchedulerService) 已启动")
    except Exception as e:
        logger.warning(f"⚠️ 调度器启动失败: {e}")

    # P0 修复: 校验 VOLCANO_API_KEY
    if not settings.VOLCANO_API_KEY:
        logger.warning("⚠️ VOLCANO_API_KEY 未配置，AI 生成功能将无法使用！")
    else:
        logger.info(f"✅ VOLCANO_API_KEY 已配置 (key前4位: {settings.VOLCANO_API_KEY[:4]}...)")

    # P0 修复: 校验认证配置
    if settings.API_AUTH_ENABLED:
        if not settings.JWT_SECRET:
            raise ValueError("JWT_SECRET must be set when API_AUTH_ENABLED=true")
        logger.info("✅ API 认证已启用，JWT_SECRET 已配置")

    yield

    # Shutdown
    logger.info("RabAi Mind API 关闭中...")

    # 关闭 HTTP 连接池
    await http_client.close()
    logger.info("✅ HTTP 连接池已关闭")

    # 停止调度器
    from .services.scheduler_service import get_scheduler_service
    try:
        get_scheduler_service().stop()
        logger.info("✅ 调度器 (SchedulerService) 已停止")
    except Exception as e:
        logger.warning(f"⚠️ 调度器停止失败: {e}")


# 创建 FastAPI 应用
app = FastAPI(
    title="RabAi Mind API",
    description="AI PPT 生成平台接口",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# 配置 CORS — 从环境变量读取
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册认证中间件 — 应用到所有 /api/v1/* 路由
app.add_middleware(AuthMiddleware)


# 注册路由
app.include_router(api_router)


# WebSocket 路由 — 协作服务 (已通过 api_router 挂载: /api/v1/collaboration/ws/{task_id})

@app.websocket("/ws/ping")
async def ws_ping(websocket: WebSocket):
    """WebSocket 健康检查"""
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except Exception:
        pass


# ── Remote Control WebSocket ────────────────────────────────────────────────────
# 路由: ws://host:port/ws/remote?room=XXXXXX&host=0|1
# 协议: JSON { type, command?, payload? }
# 房间容量: 主持人1个 + 最多10个观众

from typing import Optional
import asyncio
import json
import random
import string
import time


def _generate_room_code() -> str:
    """生成6位房间码"""
    chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    return ''.join(random.choices(chars, k=6))


class RemoteControlRoom:
    """单个远程控制房间"""
    def __init__(self, code: str):
        self.code = code
        self.host_ws: Optional[WebSocket] = None
        self.participants: list[WebSocket] = []
        self.created_at = time.time()

    @property
    def participant_count(self) -> int:
        return len(self.participants)

    def is_full(self) -> bool:
        return self.participant_count >= 10

    def add_host(self, ws: WebSocket):
        self.host_ws = ws

    def add_participant(self, ws: WebSocket):
        if self.is_full():
            return False
        self.participants.append(ws)
        return True

    def remove(self, ws: WebSocket):
        if self.host_ws == ws:
            self.host_ws = None
        if ws in self.participants:
            self.participants.remove(ws)

    def broadcast_to_participants(self, msg: str, exclude: Optional[WebSocket] = None):
        """主持人发送命令给所有观众"""
        for p in self.participants:
            if p != exclude:
                try:
                    asyncio.create_task(p.send_text(msg))
                except Exception:
                    pass

    def broadcast_to_all(self, msg: str, exclude: Optional[WebSocket] = None):
        """广播给所有人（主持人+观众）"""
        if self.host_ws and self.host_ws != exclude:
            try:
                asyncio.create_task(self.host_ws.send_text(msg))
            except Exception:
                pass
        for p in self.participants:
            if p != exclude:
                try:
                    asyncio.create_task(p.send_text(msg))
                except Exception:
                    pass

    def close(self):
        """关闭房间，通知所有连接"""
        msg = json.dumps({"type": "room_closed", "reason": "Host ended session"})
        self.broadcast_to_all(msg)
        for ws in list(self.participants):
            try:
                asyncio.create_task(ws.close())
            except Exception:
                pass
        if self.host_ws:
            try:
                asyncio.create_task(self.host_ws.close())
            except Exception:
                pass


class RemoteControlManager:
    """全局远程控制房间管理器"""
    _rooms: dict[str, RemoteControlRoom] = {}
    _lock = asyncio.Lock()

    @classmethod
    async def get_or_create_room(cls, code: str) -> RemoteControlRoom:
        async with cls._lock:
            if code not in cls._rooms:
                cls._rooms[code] = RemoteControlRoom(code)
            return cls._rooms[code]

    @classmethod
    async def get_room(cls, code: str) -> Optional[RemoteControlRoom]:
        async with cls._lock:
            return cls._rooms.get(code)

    @classmethod
    async def remove_room(cls, code: str):
        async with cls._lock:
            if code in cls._rooms:
                cls._rooms[code].close()
                del cls._rooms[code]


@app.websocket("/ws/remote")
async def ws_remote_control(websocket: WebSocket):
    """远程演示控制 WebSocket 端点"""
    # 解析 query params
    room_code = None
    is_host = False
    try:
        params = dict(websocket.query_params)
        room_code = params.get("room", "").upper()
        is_host = params.get("host", "0") == "1"
    except Exception:
        pass

    if not room_code or len(room_code) != 6:
        await websocket.close(code=4000, reason="Invalid room code")
        return

    # 获取或创建房间
    room = await RemoteControlManager.get_or_create_room(room_code)

    # 主持人独占房间（如果房间已有主持人，新连接变为观众）
    if is_host and room.host_ws and room.host_ws != websocket:
        # 原主持人被替换
        try:
            await room.host_ws.close()
        except Exception:
            pass

    # 添加到房间
    if is_host:
        room.add_host(websocket)
    else:
        if not room.add_participant(websocket):
            await websocket.close(code=4001, reason="Room full")
            return

    await websocket.accept()

    # 发送 ack
    ack_msg = json.dumps({
        "type": "ack",
        "room": room_code,
        "participantCount": room.participant_count,
        "isHost": is_host
    })
    await websocket.send_text(ack_msg)

    # 通知主持人有新人加入
    if room.host_ws and room.host_ws != websocket:
        await room.host_ws.send_text(json.dumps({
            "type": "participant_count",
            "count": room.participant_count
        }))

    # 主消息循环
    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
            except json.JSONDecodeError:
                continue

            msg_type = msg.get("type", "")

            if msg_type == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))

            elif msg_type == "command":
                # 主持人发送命令 → 转发给所有观众
                if websocket == room.host_ws:
                    cmd = msg.get("command", "")
                    payload = msg.get("payload", {})
                    forward = json.dumps({"type": "command", "command": cmd, "payload": payload})
                    room.broadcast_to_participants(forward)

            elif msg_type == "leave":
                # 主动离开
                break

    except Exception:
        pass

    finally:
        # 清理连接
        was_host = websocket == room.host_ws
        room.remove(websocket)

        if was_host:
            # 主持人离开 → 关闭房间
            await RemoteControlManager.remove_room(room_code)
        else:
            # 观众离开 → 通知主持人
            if room.host_ws:
                try:
                    await room.host_ws.send_text(json.dumps({
                        "type": "participant_count",
                        "count": room.participant_count
                    }))
                except Exception:
                    pass

            # 如果房间空了，清理
            if not room.host_ws and room.participant_count == 0:
                await RemoteControlManager.remove_room(room_code)


# 运行服务
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "src.api:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=True,
        log_level=settings.LOG_LEVEL.lower()
    )
