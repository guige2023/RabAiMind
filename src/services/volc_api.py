"""
火山引擎API封装
提供文本生成、图片生成等AI能力
"""
import os
import json
import requests
from typing import Optional, Dict, Any, List
from datetime import datetime


class VolcEngineAPI:
    """火山引擎API客户端"""
    
    def __init__(self, api_key: Optional[str] = None, endpoint: Optional[str] = None):
        self.api_key = api_key or os.getenv("VOLCANO_API_KEY", os.getenv("VOLCENGINE_API_KEY", ""))
        self.endpoint = endpoint or os.getenv("VOLCENGINE_ENDPOINT", "https://ark.cn-beijing.volces.com")
        self.project_id = os.getenv("VOLCENGINE_PROJECT_ID", "")
        self.timeout = 120
        
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
        url = f"{self.endpoint}/api/v3/projects/{self.project_id}/chat/completions"
        
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
                timeout=self.timeout
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
            return {
                "success": False,
                "error": str(e),
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
        url = f"{self.endpoint}/api/v3/projects/{self.project_id}/chat/completions"
        
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
                timeout=self.timeout
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
            return {
                "success": False,
                "error": str(e),
                "model": model
            }
    
    def image_generation(
        self,
        prompt: str,
        model: str = "stable-diffusion-xl-2600",
        size: str = "1024x1024",
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
        url = f"{self.endpoint}/api/v3/projects/{self.project_id}/images/generations"
        
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
                timeout=180
            )
            response.raise_for_status()
            result = response.json()
            
            images = result.get("data", [{}])[0].get("url", "") if result.get("data") else ""
            
            return {
                "success": True,
                "images": [images] if images else [],
                "model": model
            }
        except requests.exceptions.RequestException as e:
            return {
                "success": False,
                "error": str(e),
                "model": model
            }


# 全局实例
volc_api = VolcEngineAPI()


def get_volc_api() -> VolcEngineAPI:
    """获取火山API实例"""
    return volc_api
