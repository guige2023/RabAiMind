"""Agent API 路由"""
import json
import uuid
from typing import Optional
from fastapi import APIRouter, HTTPException, Header, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sse_starlette.sse import EventSourceResponse

from app.agents.agent import Agent

router = APIRouter(prefix="/agent", tags=["Agent"])


# ============== Schemas ==============

class ChatMessage(BaseModel):
    """聊天消息"""
    message: str = Field(..., description="用户消息")
    history: Optional[list[dict]] = Field(default=None, description="对话历史")
    stream: bool = Field(default=True, description="是否流式返回")


class ChatResponse(BaseModel):
    """聊天响应"""
    session_id: str
    content: str
    usage: Optional[dict] = None


class ToolCallEvent(BaseModel):
    """工具调用事件"""
    tool: str
    input: dict
    result: Optional[dict] = None


class NoteCreate(BaseModel):
    """创建笔记"""
    title: str
    content: str
    tags: Optional[list[str]] = None


# ============== Agent 实例管理 ==============

# 简单内存存储，实际应该用 Redis
agents: dict[str, Agent] = {}


def get_or_create_agent(session_id: str, user_id: Optional[str] = None) -> Agent:
    """获取或创建 Agent 实例"""
    if session_id not in agents:
        agents[session_id] = Agent(session_id=session_id, user_id=user_id)
    return agents[session_id]


# ============== API 端点 ==============

@router.post("/chat")
async def chat(
    request: ChatMessage,
    session_id: Optional[str] = Header(default=None, description="会话ID"),
    user_id: Optional[str] = Header(default=None, description="用户ID"),
):
    """
    SSE 流式对话接口

    支持多轮对话和文件引用
    """
    # 生成或使用会话ID
    current_session_id = session_id or str(uuid.uuid4())

    # 获取 Agent 实例
    agent = get_or_create_agent(current_session_id, user_id)

    async def event_generator():
        """SSE 事件流生成器"""
        try:
            # 发送会话ID
            yield {
                "event": "session",
                "data": json.dumps({"session_id": current_session_id})
            }

            # 流式对话
            async for event in agent.chat(
                message=request.message,
                history=request.history,
                stream=request.stream,
            ):
                event_type = event.get("type", "content")

                if event_type == "content":
                    yield {
                        "event": "content",
                        "data": json.dumps({"content": event.get("content", "")})
                    }
                elif event_type == "tool_call_start":
                    yield {
                        "event": "tool_call",
                        "data": json.dumps({
                            "tool": event.get("tool"),
                            "input": event.get("input"),
                            "status": "started"
                        })
                    }
                elif event_type == "tool_result":
                    yield {
                        "event": "tool_result",
                        "data": json.dumps({
                            "tool": event.get("tool"),
                            "result": event.get("result")
                        })
                    }
                elif event_type == "message":
                    yield {
                        "event": "message",
                        "data": json.dumps({
                            "content": event.get("content"),
                            "usage": event.get("usage")
                        })
                    }

            # 发送完成信号
            yield {
                "event": "done",
                "data": json.dumps({"session_id": current_session_id})
            }

        except Exception as e:
            yield {
                "event": "error",
                "data": json.dumps({"error": str(e)})
            }

    return EventSourceResponse(event_generator())


@router.post("/chat/sync")
async def chat_sync(
    request: ChatMessage,
    session_id: Optional[str] = Header(default=None),
    user_id: Optional[str] = Header(default=None),
):
    """
    同步对话接口（非流式）
    """
    current_session_id = session_id or str(uuid.uuid4())
    agent = get_or_create_agent(current_session_id, user_id)

    # 收集所有回复
    full_content = ""

    async for event in agent.chat(
        message=request.message,
        history=request.history,
        stream=False,
    ):
        if event.get("type") == "content":
            full_content += event.get("content", "")
        elif event.get("type") == "message":
            full_content = event.get("content", "")

    return ChatResponse(
        session_id=current_session_id,
        content=full_content
    )


@router.post("/session/reset")
async def reset_session(
    session_id: str = Header(..., description="会话ID"),
):
    """重置会话"""
    if session_id in agents:
        await agents[session_id].reset_session()
        return {"status": "ok", "message": "Session reset successfully"}
    else:
        raise HTTPException(status_code=404, detail="Session not found")


@router.get("/session/{session_id}/history")
async def get_history(
    session_id: str,
    limit: int = 50,
):
    """获取对话历史"""
    if session_id not in agents:
        raise HTTPException(status_code=404, detail="Session not found")

    agent = agents[session_id]
    messages = await agent.memory_manager.get_messages(limit=limit)

    return {
        "session_id": session_id,
        "messages": messages,
        "count": len(messages)
    }


@router.post("/session/{session_id}/notes")
async def create_note(
    session_id: str,
    request: NoteCreate,
):
    """创建会话笔记"""
    if session_id not in agents:
        raise HTTPException(status_code=404, detail="Session not found")

    agent = agents[session_id]
    await agent.create_note(
        title=request.title,
        content=request.content,
        tags=request.tags,
    )

    return {"status": "ok", "message": "Note created successfully"}


@router.get("/session/{session_id}/notes")
async def get_notes(session_id: str):
    """获取会话笔记"""
    if session_id not in agents:
        raise HTTPException(status_code=404, detail="Session not found")

    agent = agents[session_id]
    notes = await agent.get_notes()

    return {
        "session_id": session_id,
        "notes": notes,
        "count": len(notes)
    }


@router.post("/tool/text")
async def generate_text(
    prompt: str,
    max_tokens: int = 2048,
    temperature: float = 0.7,
):
    """直接调用文本生成工具"""
    tool = Agent().text_tool
    result = await tool.execute(
        prompt=prompt,
        max_tokens=max_tokens,
        temperature=temperature,
    )

    if result.get("success"):
        return result
    else:
        raise HTTPException(status_code=500, detail=result.get("error"))


@router.post("/tool/image")
async def generate_image(
    prompt: str,
    size: str = "1024x1024",
    num_images: int = 1,
):
    """直接调用图像生成工具"""
    tool = Agent().image_tool
    result = await tool.execute(
        prompt=prompt,
        size=size,
        num_images=num_images,
    )

    if result.get("success"):
        return result
    else:
        raise HTTPException(status_code=500, detail=result.get("error"))


@router.post("/tool/search")
async def search(
    query: str,
    max_results: int = 5,
):
    """直接调用搜索工具"""
    tool = Agent().search_client
    result = await tool.execute(
        query=query,
        max_results=max_results,
    )

    if result.get("success"):
        return result
    else:
        raise HTTPException(status_code=500, detail=result.get("error"))


@router.get("/tools")
async def list_tools():
    """列出所有可用工具"""
    agent = Agent()
    return {
        "tools": agent.get_tools_schema()
    }
