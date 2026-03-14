"""火山引擎工具集"""
import json
import base64
from typing import Optional
from volcengine.ApiInfo import ApiInfo
from volcengine.Credentials import Credentials
from volcengine.base.Service import Service


class VolcengineTextTool:
    """火山引擎文本生成工具"""

    def __init__(
        self,
        endpoint: Optional[str] = None,
        region: Optional[str] = None,
        access_key_id: Optional[str] = None,
        secret_access_key: Optional[str] = None,
    ):
        from app.core.config import settings

        self.endpoint = endpoint or settings.volcengine_endpoint
        self.region = region or settings.volcengine_region
        self.access_key_id = access_key_id or settings.volcengine_access_key_id
        self.secret_access_key = secret_access_key or settings.volcengine_secret_access_key

        # 初始化火山引擎服务
        self.service = Service(
            service_info=ApiInfo(
                service="ark",
                version="2024-03-01",
                host=self.endpoint.replace("https://", ""),
                header={},
                credentials=Credentials(self.access_key_id, self.secret_access_key, "", "cn-beijing"),
            ),
            api_info={}
        )

    def get_schema(self) -> dict:
        """获取工具定义"""
        return {
            "name": "volcengine_text_generation",
            "description": "使用火山引擎生成文本内容，适用于文章、摘要、翻译等任务",
            "input_schema": {
                "type": "object",
                "properties": {
                    "prompt": {
                        "type": "string",
                        "description": "文本生成的提示词"
                    },
                    "max_tokens": {
                        "type": "integer",
                        "description": "最大生成token数",
                        "default": 2048
                    },
                    "temperature": {
                        "type": "number",
                        "description": "生成温度",
                        "default": 0.7
                    }
                },
                "required": ["prompt"]
            }
        }

    async def execute(self, **kwargs) -> dict:
        """执行文本生成"""
        prompt = kwargs.get("prompt", "")
        max_tokens = kwargs.get("max_tokens", 2048)
        temperature = kwargs.get("temperature", 0.7)

        # 构建请求
        body = {
            "model": "doubao-pro-32k",
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "max_tokens": max_tokens,
            "temperature": temperature,
        }

        # 调用 API
        try:
            response = self.service.post(
                "/api/v3/message/chat/completions",
                {},
                json.dumps(body)
            )

            if response.status_code == 200:
                result = json.loads(response.text)
                return {
                    "success": True,
                    "content": result.get("choices", [{}])[0].get("message", {}).get("content", ""),
                    "usage": result.get("usage", {}),
                }
            else:
                return {
                    "success": False,
                    "error": f"API Error: {response.status_code}",
                    "detail": response.text,
                }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
            }


class VolcengineImageTool:
    """火山引擎图像生成工具"""

    def __init__(
        self,
        endpoint: Optional[str] = None,
        region: Optional[str] = None,
        access_key_id: Optional[str] = None,
        secret_access_key: Optional[str] = None,
    ):
        from app.core.config import settings

        self.endpoint = endpoint or settings.volcengine_endpoint
        self.region = region or settings.volcengine_region
        self.access_key_id = access_key_id or settings.volcengine_access_key_id
        self.secret_access_key = secret_access_key or settings.volcengine_secret_access_key

        # 初始化火山引擎服务
        self.service = Service(
            service_info=ApiInfo(
                service="ark",
                version="2024-03-01",
                host=self.endpoint.replace("https://", ""),
                header={},
                credentials=Credentials(self.access_key_id, self.secret_access_key, "", "cn-beijing"),
            ),
            api_info={}
        )

    def get_schema(self) -> dict:
        """获取工具定义"""
        return {
            "name": "volcengine_image_generation",
            "description": "使用火山引擎生成图像，支持文生图功能",
            "input_schema": {
                "type": "object",
                "properties": {
                    "prompt": {
                        "type": "string",
                        "description": "图像生成的描述提示词"
                    },
                    "size": {
                        "type": "string",
                        "description": "图像尺寸",
                        "enum": ["1024x1024", "512x512", "768x768"],
                        "default": "1024x1024"
                    },
                    "num_images": {
                        "type": "integer",
                        "description": "生成图像数量",
                        "default": 1
                    }
                },
                "required": ["prompt"]
            }
        }

    async def execute(self, **kwargs) -> dict:
        """执行图像生成"""
        prompt = kwargs.get("prompt", "")
        size = kwargs.get("size", "1024x1024")
        num_images = kwargs.get("num_images", 1)

        # 构建请求
        body = {
            "model": "doubao-image-01",
            "prompt": prompt,
            "image_size": {
                "width": int(size.split("x")[0]),
                "height": int(size.split("x")[1]),
            },
            "number": num_images,
        }

        try:
            response = self.service.post(
                "/api/v3/images/generations",
                {},
                json.dumps(body)
            )

            if response.status_code == 200:
                result = json.loads(response.text)
                images = result.get("data", [])

                # 处理 base64 图像
                image_urls = []
                for img in images:
                    if "b64_json" in img:
                        # 返回 base64 数据
                        image_urls.append({
                            "type": "base64",
                            "data": img["b64_json"],
                            "format": img.get("format", "png")
                        })
                    elif "url" in img:
                        image_urls.append({
                            "type": "url",
                            "url": img["url"]
                        })

                return {
                    "success": True,
                    "images": image_urls,
                    "usage": result.get("usage", {}),
                }
            else:
                return {
                    "success": False,
                    "error": f"API Error: {response.status_code}",
                    "detail": response.text,
                }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
            }


class VolcengineServiceTool:
    """火山引擎微服务调用工具"""

    def __init__(
        self,
        endpoint: Optional[str] = None,
        region: Optional[str] = None,
        access_key_id: Optional[str] = None,
        secret_access_key: Optional[str] = None,
    ):
        from app.core.config import settings

        self.endpoint = endpoint or settings.volcengine_endpoint
        self.region = region or settings.volcengine_region
        self.access_key_id = access_key_id or settings.volcengine_access_key_id
        self.secret_access_key = secret_access_key or settings.volcengine_secret_access_key

    def get_schema(self) -> dict:
        """获取工具定义"""
        return {
            "name": "volcengine_service_call",
            "description": "调用火山引擎内部的微服务API",
            "input_schema": {
                "type": "object",
                "properties": {
                    "service_name": {
                        "type": "string",
                        "description": "微服务名称"
                    },
                    "method": {
                        "type": "string",
                        "description": "HTTP方法",
                        "enum": ["GET", "POST", "PUT", "DELETE"]
                    },
                    "path": {
                        "type": "string",
                        "description": "API路径"
                    },
                    "body": {
                        "type": "object",
                        "description": "请求体"
                    }
                },
                "required": ["service_name", "method", "path"]
            }
        }

    async def execute(self, **kwargs) -> dict:
        """执行微服务调用"""
        service_name = kwargs.get("service_name", "")
        method = kwargs.get("method", "GET")
        path = kwargs.get("path", "/")
        body = kwargs.get("body", {})

        # 构建完整的 URL
        url = f"{self.endpoint}/{service_name}{path}"

        headers = {
            "Content-Type": "application/json",
        }

        import httpx
        try:
            async with httpx.AsyncClient() as client:
                if method == "GET":
                    response = await client.get(url, headers=headers)
                elif method == "POST":
                    response = await client.post(url, headers=headers, json=body)
                elif method == "PUT":
                    response = await client.put(url, headers=headers, json=body)
                elif method == "DELETE":
                    response = await client.delete(url, headers=headers)
                else:
                    return {
                        "success": False,
                        "error": f"Unsupported method: {method}"
                    }

                if response.status_code < 400:
                    try:
                        data = response.json()
                    except:
                        data = response.text

                    return {
                        "success": True,
                        "data": data,
                        "status_code": response.status_code,
                    }
                else:
                    return {
                        "success": False,
                        "error": f"HTTP Error: {response.status_code}",
                        "detail": response.text,
                    }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
            }
