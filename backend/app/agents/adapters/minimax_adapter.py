"""MiniMax M2.5 模型适配器"""
import json
from typing import AsyncIterator, Optional
import anthropic
from app.core.config import settings


class MiniMaxAdapter:
    """MiniMax M2.5 模型适配器"""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        base_url: Optional[str] = None,
        max_tokens: int = 4096,
        temperature: float = 0.7,
    ):
        self.api_key = api_key or settings.minimax_api_key
        self.model = model or settings.minimax_model
        self.base_url = base_url or settings.minimax_api_base
        self.max_tokens = max_tokens
        self.temperature = temperature

        # 配置 Anthropic 客户端
        self.client = anthropic.Anthropic(
            api_key=self.api_key,
            base_url=self.base_url,
        )

    async def chat(
        self,
        messages: list[dict],
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        tools: Optional[list[dict]] = None,
    ) -> dict:
        """同步对话（用于非流式场景）"""
        request_params = {
            "model": self.model,
            "max_tokens": max_tokens or self.max_tokens,
            "temperature": temperature or self.temperature,
            "messages": self._convert_messages(messages),
        }

        if system_prompt:
            request_params["system"] = system_prompt

        if tools:
            request_params["tools"] = tools

        response = self.client.messages.create(**request_params)
        return self._parse_response(response)

    async def chat_stream(
        self,
        messages: list[dict],
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        tools: Optional[list[dict]] = None,
    ) -> AsyncIterator[str]:
        """流式对话"""
        request_params = {
            "model": self.model,
            "max_tokens": max_tokens or self.max_tokens,
            "temperature": temperature or self.temperature,
            "messages": self._convert_messages(messages),
            "stream": True,
        }

        if system_prompt:
            request_params["system"] = system_prompt

        if tools:
            request_params["tools"] = tools

        # 使用流式响应
        with self.client.messages.stream(**request_params) as stream:
            for text in stream.text_stream:
                yield text

    def _convert_messages(self, messages: list[dict]) -> list[dict]:
        """转换消息格式以适配 Anthropic API"""
        converted = []
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")

            # 如果 content 是字符串，保持不变
            # 如果是 list (多模态)，需要转换格式
            if isinstance(content, list):
                # 处理多模态内容
                new_content = []
                for item in content:
                    if isinstance(item, dict):
                        if item.get("type") == "text":
                            new_content.append({
                                "type": "text",
                                "text": item.get("text", "")
                            })
                        elif item.get("type") == "image":
                            new_content.append({
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": item.get("media_type", "image/png"),
                                    "data": item.get("data", "")
                                }
                            })
                    elif isinstance(item, str):
                        new_content.append({"type": "text", "text": item})
                content = new_content

            converted.append({
                "role": role,
                "content": content
            })
        return converted

    def _parse_response(self, response) -> dict:
        """解析 API 响应"""
        # Anthropic SDK 返回的是 Message 对象
        content_blocks = []
        tool_use = None
        stop_reason = response.stop_reason

        # 提取文本内容
        for block in response.content:
            if hasattr(block, 'text'):
                content_blocks.append({"type": "text", "text": block.text})
            elif hasattr(block, 'type'):
                if block.type == "tool_use":
                    tool_use = {
                        "id": block.id,
                        "name": block.name,
                        "input": block.input
                    }
                elif block.type == "text":
                    content_blocks.append({"type": "text", "text": block.text})

        result = {
            "content": content_blocks,
            "stop_reason": stop_reason,
            "model": response.model,
            "usage": {
                "input_tokens": response.usage.input_tokens,
                "output_tokens": response.usage.output_tokens
            }
        }

        if tool_use:
            result["tool_use"] = tool_use

        return result

    async def chat_with_tools(
        self,
        messages: list[dict],
        tools: list[dict],
        system_prompt: Optional[str] = None,
        max_iterations: int = 10,
    ) -> AsyncIterator[dict]:
        """带工具调用的对话（执行循环）"""
        iteration = 0
        current_messages = messages.copy()

        while iteration < max_iterations:
            iteration += 1

            response = await self.chat(
                messages=current_messages,
                system_prompt=system_prompt,
                tools=tools,
            )

            # 记录 assistant 消息
            content = response.get("content", [])
            text_content = ""
            tool_use = response.get("tool_use")

            for block in content:
                if block.get("type") == "text":
                    text_content += block.get("text", "")

            current_messages.append({
                "role": "assistant",
                "content": text_content or content
            })

            # 如果有工具调用，执行工具
            if tool_use:
                tool_name = tool_use.get("name")
                tool_input = tool_use.get("input", {})

                # 生成工具结果
                tool_result = {
                    "type": "tool_result",
                    "tool_use_id": tool_use.get("id"),
                    "content": f"Tool {tool_name} executed with input: {json.dumps(tool_input)}"
                }

                current_messages.append({
                    "role": "user",
                    "content": [tool_result]
                })

                yield {
                    "type": "tool_call",
                    "tool": tool_name,
                    "input": tool_input,
                }

                # 继续下一轮
                continue
            else:
                # 没有更多工具调用，返回最终结果
                yield {
                    "type": "message",
                    "content": text_content,
                    "usage": response.get("usage"),
                }
                break
