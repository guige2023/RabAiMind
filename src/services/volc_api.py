"""
火山引擎API封装
提供文本生成、图片生成等AI能力
"""
import logging
import os
import json
import requests
from typing import Optional, Dict, Any, List
from datetime import datetime

logger = logging.getLogger(__name__)


def _sanitize_error(e: Exception) -> str:
    """错误信息脱敏 - 不泄露内部细节"""
    error_msg = str(e)
    # 通用错误消息，不包含任何内部信息
    if isinstance(e, requests.exceptions.ConnectionError):
        return "网络连接失败，请检查网络后重试"
    elif isinstance(e, requests.exceptions.Timeout):
        return "请求超时，请稍后重试"
    elif isinstance(e, requests.exceptions.HTTPError):
        return f"HTTP错误，请稍后重试"
    else:
        return "服务暂时不可用，请稍后重试"


class VolcEngineAPI:
    """火山引擎API客户端"""
    
    def __init__(self, api_key: Optional[str] = None, endpoint: Optional[str] = None):
        self.api_key = api_key or os.getenv("VOLCANO_API_KEY", os.getenv("VOLCENGINE_API_KEY", ""))
        self.endpoint = endpoint or os.getenv("VOLCENGINE_ENDPOINT", "https://ark.cn-beijing.volces.com")
        self.project_id = os.getenv("VOLCENGINE_PROJECT_ID", "")
        self.timeout = (5, 120)
        
    def _get_headers(self) -> Dict[str, str]:
        """获取请求头"""
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
    
    def text_generation(
        self, 
        prompt: str, 
        model: str = "doubao-pro-32k",
        temperature: float = 0.7,
        max_tokens: int = 4096
    ) -> Dict[str, Any]:
        """
        文本生成
        
        Args:
            prompt: 输入提示词
            model: 模型名称
            temperature: 温度参数
            max_tokens: 最大token数
            
        Returns:
            生成结果字典
        """
        # P0 修复: key 为空时快速失败
        if not self.api_key:
            logger.error("VOLCANO_API_KEY 未配置，请检查 .env 文件")
            return {
                "success": False,
                "error": "VOLCANO_API_KEY 未配置，AI 功能不可用",
                "model": model
            }

        base = f"{self.endpoint}/api/v3"
        url = f"{base}/chat/completions" if not self.project_id else f"{base}/projects/{self.project_id}/chat/completions"

        payload = {
            "model": model,
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "temperature": temperature,
            "max_tokens": max_tokens
        }

        try:
            response = requests.post(
                url,
                headers=self._get_headers(), 
                json=payload,
                timeout=self.timeout,
                verify=False
            )
            response.raise_for_status()
            result = response.json()
            
            return {
                "success": True,
                "content": result.get("choices", [{}])[0].get("message", {}).get("content", ""),
                "usage": result.get("usage", {}),
                "model": model
            }
        except requests.exceptions.RequestException as e:
            logger.warning(f"文本生成API失败: {type(e).__name__}")
            return {
                "success": False,
                "error": _sanitize_error(e),
                "model": model
            }

    def image_to_text(
        self,
        image_url: str,
        prompt: str = "描述这张图片的内容",
        model: str = "doubao-vision-pro-32k"
    ) -> Dict[str, Any]:
        """
        图片理解（图生文）
        
        Args:
            image_url: 图片URL
            prompt: 提问内容
            model: 视觉模型
            
        Returns:
            理解结果
        """
        # P0 修复: key 为空时快速失败
        if not self.api_key:
            logger.error("VOLCANO_API_KEY 未配置，请检查 .env 文件")
            return {"success": False, "error": "VOLCANO_API_KEY 未配置"}

        base = f"{self.endpoint}/api/v3"
        url = f"{base}/chat/completions" if not self.project_id else f"{base}/projects/{self.project_id}/chat/completions"

        payload = {
            "model": model,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "image_url", "image_url": {"url": image_url}},
                        {"type": "text", "text": prompt}
                    ]
                }
            ],
            "temperature": 0.7,
            "max_tokens": 2048
        }
        
        try:
            response = requests.post(
                url,
                headers=self._get_headers(),
                json=payload,
                timeout=self.timeout,
                verify=False
            )
            response.raise_for_status()
            result = response.json()
            
            return {
                "success": True,
                "content": result.get("choices", [{}])[0].get("message", {}).get("content", ""),
                "usage": result.get("usage", {}),
                "model": model
            }
        except requests.exceptions.RequestException as e:
            logger.warning(f"图片理解API失败: {type(e).__name__}")
            return {
                "success": False,
                "error": _sanitize_error(e),
                "model": model
            }

    def image_generation(
        self,
        prompt: str,
        model: str = "stable-diffusion-xl-2600",
        size: str = "2048x2048",  # 最小 1920x1920 (3686400px)，火山引擎要求至少 3686400 像素
        quality: str = "standard",
        n: int = 1
    ) -> Dict[str, Any]:
        """
        图片生成（文生图）
        
        Args:
            prompt: 图片描述
            model: 图像模型
            size: 图片尺寸
            quality: 质量
            n: 生成数量
            
        Returns:
            生成结果
        """
        # P0 修复: key 为空时快速失败
        if not self.api_key:
            logger.error("VOLCANO_API_KEY 未配置，请检查 .env 文件")
            return {"success": False, "error": "VOLCANO_API_KEY 未配置"}

        base = f"{self.endpoint}/api/v3"
        url = f"{base}/images/generations" if not self.project_id else f"{base}/projects/{self.project_id}/images/generations"

        payload = {
            "model": model,
            "prompt": prompt,
            "size": size,
            "quality": quality,
            "n": n
        }
        
        try:
            response = requests.post(
                url,
                headers=self._get_headers(),
                json=payload,
                timeout=180,
                verify=False
            )
            response.raise_for_status()
            result = response.json()
            
            # 获取所有生成的图片
            images = []
            for item in result.get("data", []):
                if item.get("url"):
                    images.append(item["url"])

            return {
                "success": True,
                "images": images,
                "model": model
            }
        except requests.exceptions.RequestException as e:
            logger.warning(f"图片生成API失败: {type(e).__name__}")
            return {
                "success": False,
                "error": _sanitize_error(e),
                "model": model
            }


# 全局实例
volc_api = VolcEngineAPI()


def get_volc_api() -> VolcEngineAPI:
    """获取火山API实例"""
    return volc_api
