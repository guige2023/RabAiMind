"""Mini-Agent 核心引擎"""
import json
import uuid
from typing import AsyncIterator, Optional
from app.agents.adapters.minimax_adapter import MiniMaxAdapter
from app.agents.tools.volcengine_tools import (
    VolcengineTextTool,
    VolcengineImageTool,
    VolcengineServiceTool,
)
from app.agents.mcp import MCPSearchClient
from app.agents.memory import MemoryManager


class Agent:
    """Mini-Agent 核心引擎"""

    def __init__(
        self,
        session_id: Optional[str] = None,
        user_id: Optional[str] = None,
    ):
        self.session_id = session_id or str(uuid.uuid4())
        self.user_id = user_id

        # 初始化各组件
        self.adapter = MiniMaxAdapter()
        self.memory_manager = MemoryManager(self.session_id)

        # 初始化工具
        self.text_tool = VolcengineTextTool()
        self.image_tool = VolcengineImageTool()
        self.service_tool = VolcengineServiceTool()
        self.search_client = MCPSearchClient()

        # 系统提示词
        self.system_prompt = self._build_system_prompt()

    def _build_system_prompt(self) -> str:
        """构建系统提示词"""
        return """你是一个智能助手，可以帮助用户完成各种任务。

你可以使用以下工具：
1. volcengine_text_generation - 生成文本内容
2. volcengine_image_generation - 生成图像
3. volcengine_service_call - 调用微服务
4. mcp_search - 搜索实时信息

请根据用户需求合理使用工具。"""

    def get_tools_schema(self) -> list[dict]:
        """获取所有工具的 schema 定义"""
        return [
            self.text_tool.get_schema(),
            self.image_tool.get_schema(),
            self.service_tool.get_schema(),
            self.search_client.get_schema(),
        ]

    async def execute_tool(self, tool_name: str, arguments: dict) -> dict:
        """执行工具调用"""
        tool_map = {
            "volcengine_text_generation": self.text_tool,
            "volcengine_image_generation": self.image_tool,
            "volcengine_service_call": self.service_tool,
            "mcp_search": self.search_client,
        }

        tool = tool_map.get(tool_name)
        if not tool:
            return {
                "success": False,
                "error": f"Unknown tool: {tool_name}"
            }

        return await tool.execute(**arguments)

    async def chat(
        self,
        message: str,
        history: Optional[list[dict]] = None,
        stream: bool = True,
    ) -> AsyncIterator[dict]:
        """
        对话接口

        Args:
            message: 用户消息
            history: 对话历史
            stream: 是否流式返回
        """
        # 构建消息列表
        messages = history or []

        # 获取会话记忆
        memory_messages = await self.memory_manager.get_messages(limit=20)
        if memory_messages and not history:
            # 如果没有传入历史，使用记忆中的历史
            messages = memory_messages + [{"role": "user", "content": message}]
        else:
            messages.append({"role": "user", "content": message})

        # 保存用户消息到记忆
        await self.memory_manager.add_message("user", message)

        # 获取工具定义
        tools = self.get_tools_schema()

        if stream:
            # 流式响应
            async for event in self._chat_stream(messages, tools):
                yield event
        else:
            # 非流式响应
            result = await self._chat_once(messages, tools)
            yield result

    async def _chat_stream(
        self,
        messages: list[dict],
        tools: list[dict],
    ) -> AsyncIterator[dict]:
        """流式对话"""
        tool_call_buffer = {}
        current_text = ""

        # 使用带工具的流式调用
        async for chunk in self.adapter.chat_stream(
            messages=messages,
            system_prompt=self.system_prompt,
            tools=tools,
        ):
            current_text += chunk

            # 解析工具调用
            # 这里简化处理，实际需要更复杂的解析
            yield {
                "type": "content",
                "content": chunk,
            }

        # 保存助手回复到记忆
        await self.memory_manager.add_message("assistant", current_text)

    async def _chat_once(
        self,
        messages: list[dict],
        tools: list[dict],
    ) -> dict:
        """单次对话（带工具执行循环）"""
        # 使用带工具执行的对话
        has_tool_call = False

        async for event in self.adapter.chat_with_tools(
            messages=messages,
            system_prompt=self.system_prompt,
            tools=tools,
        ):
            if event.get("type") == "tool_call":
                # 执行工具
                tool_name = event.get("tool")
                tool_input = event.get("input", {})

                yield {
                    "type": "tool_call_start",
                    "tool": tool_name,
                    "input": tool_input,
                }

                # 执行工具
                tool_result = await self.execute_tool(tool_name, tool_input)

                yield {
                    "type": "tool_result",
                    "tool": tool_name,
                    "result": tool_result,
                }

                has_tool_call = True
            elif event.get("type") == "message":
                # 最终回复
                yield {
                    "type": "message",
                    "content": event.get("content"),
                    "usage": event.get("usage"),
                }

                # 保存到记忆
                await self.memory_manager.add_message("assistant", event.get("content", ""))

        # 如果有工具调用，尝试再次获取回复
        # 这里可以添加循环逻辑

    async def reset_session(self):
        """重置会话"""
        await self.memory_manager.clear_session()

    async def create_note(self, title: str, content: str, tags: list[str] = None):
        """创建会话笔记"""
        await self.memory_manager.create_session_note(title, content, tags)

    async def get_notes(self) -> list[dict]:
        """获取会话笔记"""
        return await self.memory_manager.get_session_notes()
