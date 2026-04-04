# -*- coding: utf-8 -*-
"""
实时协作 WebSocket 路由 (R71)

提供:
- /ws/collaborate/{task_id} - WebSocket 连接端点
- /api/v1/collaboration/comments - REST 评论 API

作者: Claude
日期: 2026-04-04
"""

import asyncio
import json
import logging
import time
from dataclasses import asdict
from typing import Dict, Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, Body
from starlette.websockets import WebSocketState

from ...services.collaboration_service import (
    get_collaboration_service,
    CursorPosition,
    Operation,
    OperationType,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/collaboration", tags=["collaboration"])


# ─── WebSocket Endpoint ───────────────────────────────────────────────────────

@router.websocket("/ws/{task_id}")
async def collaboration_websocket(
    websocket: WebSocket,
    task_id: str,
    user_id: str = Query(...),
    user_name: str = Query(...),
    user_avatar: str = Query(default=""),
    role: str = Query(default="viewer"),
):
    """
    实时协作 WebSocket 端点
    
    连接后接收消息类型:
    - cursor_move: 光标移动
    - presence_update: 状态更新 (切换幻灯片等)
    - operation: 协作操作 (OT)
    - follow: 跟随/取消跟随
    - ping: 心跳
    
    发送消息类型:
    - cursor_update: 他人光标移动
    - presence_update: 他人状态变化
    - operation_applied: 操作被接受
    - comment_added/replied/resolved: 评论变化
    - follow_started/ended: 跟随变化
    - user_joined/left: 用户加入/离开
    """
    service = get_collaboration_service()
    
    # 注册连接
    presence = service.register_connection(task_id, user_id, user_name, user_avatar, role, websocket)
    
    # 发送当前状态给新连接
    await websocket.send_json({
        "type": "init",
        "user_id": user_id,
        "color": presence.color,
        "presence_list": service.get_presence_list(task_id),
        "cursors": {uid: cursor.__dict__ for uid, cursor in service.get_cursors(task_id).items()},
        "comments": service.get_comments(task_id),
        "server_version": service.operation_versions.get(task_id, 0),
    })
    
    # 广播用户加入
    await service._broadcast_to_task(task_id, {
        "type": "user_joined",
        "user_id": user_id,
        "user_name": user_name,
        "user_avatar": user_avatar,
        "role": role,
        "color": presence.color,
    }, exclude_user=user_id)
    
    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")
            
            if msg_type == "ping":
                await websocket.send_json({"type": "pong", "timestamp": time.time()})
            
            elif msg_type == "cursor_move":
                # 高频: 只更新光标位置
                cursor = CursorPosition(
                    user_id=user_id,
                    user_name=user_name,
                    user_avatar=user_avatar,
                    x=data.get("x", 0),
                    y=data.get("y", 0),
                    slide_num=data.get("slide_num", 1),
                    viewport_x=data.get("viewport_x", 0),
                    viewport_y=data.get("viewport_y", 0),
                    viewport_zoom=data.get("viewport_zoom", 1.0),
                    cursor_style=data.get("cursor_style", "pointer"),
                    color=presence.color,
                    is_editing=data.get("is_editing", False),
                    selection=data.get("selection"),
                )
                # 使用小延迟批量处理，避免过于频繁
                await service.update_cursor(task_id, user_id, cursor)
            
            elif msg_type == "presence_update":
                await service.update_presence(
                    task_id,
                    user_id,
                    slide_num=data.get("slide_num"),
                    viewport=data.get("viewport"),
                )
            
            elif msg_type == "operation":
                # 协作操作 (OT)
                op = Operation(
                    id=data.get("id", f"{user_id}_{int(time.time()*1000)}"),
                    task_id=task_id,
                    user_id=user_id,
                    type=data.get("operation_type", OperationType.STYLE_CHANGE.value),
                    slide_num=data.get("slide_num", 1),
                    element_id=data.get("element_id"),
                    position=data.get("position"),
                    data=data.get("data"),
                    base_version=data.get("base_version", 0),
                )
                result = await service.apply_operation(task_id, op)
                await websocket.send_json({
                    "type": "operation_result",
                    "operation_id": op.id,
                    **result,
                })
            
            elif msg_type == "follow":
                followed_id = data.get("followed_user_id")
                if followed_id:
                    await service.follow_user(task_id, user_id, followed_id)
                else:
                    await service.unfollow_user(task_id, user_id)
            
            elif msg_type == "get_follow_viewport":
                # 主动请求被跟随者的视口
                viewport = service.get_viewport_to_follow(task_id, user_id)
                await websocket.send_json({
                    "type": "follow_viewport",
                    "viewport": viewport,
                })
            
            elif msg_type == "comment_add":
                comment = await service.add_comment(
                    task_id=task_id,
                    slide_num=data.get("slide_num", 1),
                    author_id=user_id,
                    author_name=user_name,
                    author_avatar=user_avatar,
                    content=data.get("content", ""),
                    mentions=data.get("mentions", []),
                )
                # Send email notifications to @mentioned users
                if data.get("mentions"):
                    try:
                        from ...services.notification_service import get_notification_service
                        notif_svc = get_notification_service()
                        ppt_title = data.get("ppt_title", f"PPT {task_id}")
                        thread_url = data.get("thread_url", "")
                        # Fire-and-forget email sending (don't block the WebSocket)
                        asyncio.create_task(asyncio.to_thread(
                            notif_svc.notify_comment_added,
                            ppt_title=ppt_title,
                            slide_num=data.get("slide_num", 1),
                            author_name=user_name,
                            content=data.get("content", ""),
                            mentions=data.get("mentions", []),
                            is_reply=False,
                            thread_url=thread_url,
                        ))
                    except Exception as e:
                        logger.error(f"[collaboration] Failed to send comment email notifications: {e}")
                await websocket.send_json({
                    "type": "comment_result",
                    "success": True,
                    "comment": comment.__dict__,
                })
            
            elif msg_type == "comment_reply":
                reply = await service.reply_comment(
                    task_id=task_id,
                    comment_id=data.get("comment_id"),
                    author_id=user_id,
                    author_name=user_name,
                    author_avatar=user_avatar,
                    content=data.get("content", ""),
                    mentions=data.get("mentions", []),
                )
                # Send email notifications to @mentioned users on replies
                if reply and data.get("mentions"):
                    try:
                        from ...services.notification_service import get_notification_service
                        notif_svc = get_notification_service()
                        ppt_title = data.get("ppt_title", f"PPT {task_id}")
                        thread_url = data.get("thread_url", "")
                        asyncio.create_task(asyncio.to_thread(
                            notif_svc.notify_comment_added,
                            ppt_title=ppt_title,
                            slide_num=data.get("slide_num", 1),
                            author_name=user_name,
                            content=data.get("content", ""),
                            mentions=data.get("mentions", []),
                            is_reply=True,
                            reply_preview=data.get("content", "")[:100],
                            thread_url=thread_url,
                        ))
                    except Exception as e:
                        logger.error(f"[collaboration] Failed to send reply email notifications: {e}")
                await websocket.send_json({
                    "type": "comment_result",
                    "success": reply is not None,
                    "reply": reply,
                })
            
            elif msg_type == "comment_resolve":
                await service.resolve_comment(
                    task_id=task_id,
                    comment_id=data.get("comment_id"),
                    resolved=data.get("resolved", True),
                )
            
            elif msg_type == "get_operations_since":
                # 同步: 获取自某版本以来的所有操作
                since_ver = data.get("since_version", 0)
                ops = service.get_operations_since(task_id, since_ver)
                await websocket.send_json({
                    "type": "operations_sync",
                    "operations": ops,
                    "server_version": service.operation_versions.get(task_id, 0),
                })
            
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"WebSocket error for {user_id} in {task_id}: {e}")
    finally:
        service.unregister_connection(task_id, user_id)
        await service._broadcast_to_task(task_id, {
            "type": "user_left",
            "user_id": user_id,
        })


# ─── REST API: Comments ───────────────────────────────────────────────────────

@router.get("/comments/{task_id}")
async def get_comments(task_id: str, slide_num: int = None):
    """获取评论"""
    service = get_collaboration_service()
    return {"success": True, "comments": service.get_comments(task_id, slide_num)}


@router.post("/comments/{task_id}")
async def add_comment(
    task_id: str,
    request: Dict = Body(...),
):
    """添加评论 (REST 备选)"""
    service = get_collaboration_service()
    comment = await service.add_comment(
        task_id=task_id,
        slide_num=request.get("slide_num", 1),
        author_id=request.get("author_id", ""),
        author_name=request.get("author_name", "Anonymous"),
        author_avatar=request.get("author_avatar", ""),
        content=request.get("content", ""),
        mentions=request.get("mentions", []),
    )
    # Send email notifications to @mentioned users
    mentions = request.get("mentions", [])
    if mentions:
        try:
            from ...services.notification_service import get_notification_service
            notif_svc = get_notification_service()
            notif_svc.notify_comment_added(
                ppt_title=request.get("ppt_title", f"PPT {task_id}"),
                slide_num=request.get("slide_num", 1),
                author_name=request.get("author_name", "Anonymous"),
                content=request.get("content", ""),
                mentions=mentions,
                is_reply=False,
                thread_url=request.get("thread_url", ""),
            )
        except Exception as e:
            logger.error(f"[collaboration REST] Failed to send comment email notifications: {e}")
    return {"success": True, "comment": asdict(comment)}


# ─── Suggest Edits ────────────────────────────────────────────────────────────

@router.get("/suggest-edits/{task_id}")
async def get_suggest_edits(task_id: str, slide_num: int = None):
    """获取编辑建议列表"""
    service = get_collaboration_service()
    return {"success": True, "edits": service.get_suggest_edits(task_id, slide_num)}


@router.post("/suggest-edits/{task_id}")
async def add_suggest_edit(task_id: str, request: Dict = Body(...)):
    """添加编辑建议"""
    service = get_collaboration_service()
    edit = await service.add_suggest_edit(
        task_id=task_id,
        slide_num=request.get("slide_num", 1),
        author_id=request.get("author_id", ""),
        author_name=request.get("author_name", "Anonymous"),
        author_avatar=request.get("author_avatar", ""),
        edit_type=request.get("edit_type", "text"),
        original_content=request.get("original_content", {}),
        suggested_content=request.get("suggested_content", {}),
        reason=request.get("reason", ""),
    )
    return {"success": True, "edit": asdict(edit)}


@router.put("/suggest-edits/{task_id}/{edit_id}")
async def resolve_suggest_edit(
    task_id: str,
    edit_id: str,
    request: Dict = Body(...),
):
    """接受/拒绝编辑建议"""
    service = get_collaboration_service()
    result = await service.resolve_suggest_edit(
        task_id=task_id,
        edit_id=edit_id,
        status=request.get("status", "pending"),
        resolved_by=request.get("resolved_by", ""),
    )
    return {"success": result}


# ─── Activity Feed ───────────────────────────────────────────────────────────

@router.get("/activity-feed/{task_id}")
async def get_activity_feed(
    task_id: str,
    activity_type: str = None,
    user_id: str = None,
    limit: int = 100,
):
    """获取活动动态"""
    service = get_collaboration_service()
    return {
        "success": True,
        "activities": service.get_activity_feed(task_id, activity_type, user_id, limit),
    }


@router.post("/activity-feed/{task_id}")
async def log_activity(task_id: str, request: Dict = Body(...)):
    """记录活动动态"""
    service = get_collaboration_service()
    entry = await service.log_activity(
        task_id=task_id,
        activity_type=request.get("activity_type", "edit"),
        user_id=request.get("user_id", ""),
        user_name=request.get("user_name", "Anonymous"),
        user_avatar=request.get("user_avatar", ""),
        target=request.get("target", ""),
        details=request.get("details", ""),
        slide_num=request.get("slide_num"),
    )
    return {"success": True, "activity": asdict(entry)}


@router.post("/activity-feed/{task_id}/mark-read/{activity_id}")
async def mark_activity_read(task_id: str, activity_id: str):
    """标记单条活动为已读"""
    service = get_collaboration_service()
    result = service.mark_activity_read(task_id, activity_id)
    return {"success": result}


@router.post("/activity-feed/{task_id}/mark-all-read")
async def mark_all_activities_read(task_id: str):
    """全部标记为已读"""
    service = get_collaboration_service()
    count = service.mark_all_activities_read(task_id)
    return {"success": True, "count": count}


# ─── Email Share ─────────────────────────────────────────────────────────────

@router.post("/share/email")
async def share_via_email(request: Dict = Body(...)):
    """通过邮件分享PPT"""
    from ...services.email_service import send_ppt_share_email, is_email_configured

    to_email = request.get("to_email", "")
    from_name = request.get("from_name", "RabAiMind 用户")
    ppt_title = request.get("ppt_title", "演示文稿")
    share_url = request.get("share_url", "")
    message = request.get("message", "")

    if not to_email or not share_url:
        return {"success": False, "message": "缺少必要参数"}

    if not is_email_configured():
        # Fallback: return mailto link
        subject = f"📄 {from_name} 邀请你查看: {ppt_title}"
        body = f"来看看我的演示文稿: {share_url}"
        if message:
            body = f"{message}\n\n{body}"
        mailto = f"mailto:{to_email}?subject={quote(subject)}&body={quote(body)}"
        return {
            "success": False,
            "fallback": "mailto",
            "mailto_url": mailto,
            "message": "SMTP未配置，已生成邮件链接"
        }

    success = send_ppt_share_email(
        to_email=to_email,
        from_name=from_name,
        ppt_title=ppt_title,
        share_url=share_url,
        message=message,
    )

    return {
        "success": success,
        "message": "邮件已发送" if success else "邮件发送失败"
    }


from urllib.parse import quote
