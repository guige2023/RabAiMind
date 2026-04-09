"""
火山引擎API封装
提供文本生成、图片生成等AI能力
R24优化: 添加超时重试机制
"""
import logging
import os
import time
from typing import Any

import certifi
import requests

logger = logging.getLogger(__name__)

# R24新增: 重试配置
MAX_RETRIES = 2  # 最多重试次数
RETRY_DELAY_BASE = 2.0  # 基础重试延迟（秒）


def _sanitize_error(e: Exception) -> str:
    """错误信息脱敏 - 不泄露内部细节"""
    error_msg = str(e)
    # 通用错误消息，不包含任何内部信息
    if isinstance(e, requests.exceptions.ConnectionError):
        return "网络连接失败，请检查网络后重试"
    elif isinstance(e, requests.exceptions.Timeout):
        return "请求超时，请稍后重试"
    elif isinstance(e, requests.exceptions.HTTPError):
        return "HTTP错误，请稍后重试"
    else:
        return "服务暂时不可用，请稍后重试"


def _is_retryable(e: Exception) -> bool:
    """判断异常是否值得重试"""
    return isinstance(e, (requests.exceptions.Timeout, requests.exceptions.ConnectionError))


class VolcEngineAPI:
    """火山引擎API客户端"""

    def __init__(self, api_key: str | None = None, endpoint: str | None = None):
        # 从 Settings 读取配置（唯一配置来源）
        # 支持两种导入方式：正常包导入 和 importlib 直载（agents 层用）
        try:
            from ..config import settings
        except ImportError:
            import sys
            _volc_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            if _volc_path not in sys.path:
                sys.path.insert(0, _volc_path)
            from src.config import settings
        self.api_key = api_key or os.getenv("VOLCANO_API_KEY", settings.VOLCANO_API_KEY)
        self.endpoint = endpoint or os.getenv("VOLCENGINE_ENDPOINT", settings.VOLCANO_ENDPOINT)
        self.project_id = os.getenv("VOLCENGINE_PROJECT_ID", settings.VOLCANO_PROJECT_ID)
        self.timeout = (5, settings.VOLCANO_TIMEOUT)

        # 模型配置统一从 Settings 读取（支持环境变量覆盖）
        self.text_model = os.getenv("VOLCANO_TEXT_MODEL", settings.VOLCANO_TEXT_MODEL)
        self.image_model = os.getenv("VOLCANO_IMAGE_MODEL", settings.VOLCANO_IMAGE_MODEL)
        self.vision_model = os.getenv("VOLCANN_VISION_MODEL", self.text_model)

    def _get_headers(self) -> dict[str, str]:
        """获取请求头"""
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }

    def _do_request(self, url: str, payload: dict, timeout: float) -> requests.Response:
        """执行 HTTP POST 请求（供重试机制调用）"""
        return requests.post(
            url,
            headers=self._get_headers(),
            json=payload,
            timeout=timeout,
            verify=certifi.where()
        )

    def text_generation(
        self,
        prompt: str,
        model: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 4096
    ) -> dict[str, Any]:
        """
        文本生成（R24优化: 超时自动重试，最多重试2次）

        Args:
            prompt: 输入提示词
            model: 模型名称（默认为 self.text_model）
            temperature: 温度参数
            max_tokens: 最大token数

        Returns:
            生成结果字典
        """
        # 使用默认模型（从环境变量读取）
        if model is None:
            model = self.text_model
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

        # R24优化: 超时重试机制
        last_error = None
        for attempt in range(MAX_RETRIES + 1):
            try:
                response = self._do_request(url, payload, self.timeout)
                response.raise_for_status()
                result = response.json()

                return {
                    "success": True,
                    "content": result.get("choices", [{}])[0].get("message", {}).get("content", ""),
                    "usage": result.get("usage", {}),
                    "model": model
                }
            except requests.exceptions.RequestException as e:
                last_error = e
                if _is_retryable(e) and attempt < MAX_RETRIES:
                    delay = RETRY_DELAY_BASE * (2 ** attempt)  # 指数退避
                    logger.warning(f"文本生成API超时/连接失败，{RETRY_DELAY_BASE * (2 ** attempt):.1f}秒后重试 ({attempt + 1}/{MAX_RETRIES}): {type(e).__name__}")
                    time.sleep(delay)
                    continue
                logger.warning(f"文本生成API失败: {type(e).__name__}")
                return {
                    "success": False,
                    "error": _sanitize_error(e),
                    "model": model
                }

        # 所有重试均失败
        return {
            "success": False,
            "error": _sanitize_error(last_error) if last_error else "服务暂时不可用，请稍后重试",
            "model": model
        }

    def image_to_text(
        self,
        image_url: str,
        prompt: str = "描述这张图片的内容",
        model: str | None = None
    ) -> dict[str, Any]:
        """
        图片理解（图生文）

        Args:
            image_url: 图片URL
            prompt: 提问内容
            model: 视觉模型（默认为 self.vision_model）

        Returns:
            理解结果
        """
        # 使用默认视觉模型
        if model is None:
            model = self.vision_model

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

        # R24优化: 超时重试机制
        last_error = None
        for attempt in range(MAX_RETRIES + 1):
            try:
                response = self._do_request(url, payload, self.timeout)
                response.raise_for_status()
                result = response.json()

                return {
                    "success": True,
                    "content": result.get("choices", [{}])[0].get("message", {}).get("content", ""),
                    "usage": result.get("usage", {}),
                    "model": model
                }
            except requests.exceptions.RequestException as e:
                last_error = e
                if _is_retryable(e) and attempt < MAX_RETRIES:
                    delay = RETRY_DELAY_BASE * (2 ** attempt)
                    logger.warning(f"图片理解API超时/连接失败，{delay:.1f}秒后重试 ({attempt + 1}/{MAX_RETRIES}): {type(e).__name__}")
                    time.sleep(delay)
                    continue
                logger.warning(f"图片理解API失败: {type(e).__name__}")
                return {
                    "success": False,
                    "error": _sanitize_error(e),
                    "model": model
                }

        return {
            "success": False,
            "error": _sanitize_error(last_error) if last_error else "服务暂时不可用，请稍后重试",
            "model": model
        }

    def image_generation(
        self,
        prompt: str,
        model: str | None = None,
        size: str = "2048x2048",  # 最小 1920x1920 (3686400px)，火山引擎要求至少 3686400 像素
        quality: str = "standard",
        n: int = 1
    ) -> dict[str, Any]:
        """
        图片生成（文生图）

        Args:
            prompt: 图片描述
            model: 图像模型（默认为 self.image_model）
            size: 图片尺寸
            quality: 质量
            n: 生成数量

        Returns:
            生成结果
        """
        # 使用默认模型（从环境变量读取）
        if model is None:
            model = self.image_model

        # P0 修复: key 为空时快速失败
        if not self.api_key:
            logger.error("VOLCANO_API_KEY 未配置，请检查 .env 文件")
            return {"success": False, "error": "VOLCANO_API_KEY 未配置"}

        # 火山引擎要求图片尺寸至少 3686400 像素 (1920x1920)
        # 自动调整不满足要求的尺寸
        if size:
            try:
                w, h = map(int, size.split('x'))
                pixels = w * h
                if pixels < 3686400:
                    # 按比例放大到满足最小像素要求
                    scale = (3686400 / pixels) ** 0.5
                    w = int(w * scale)
                    h = int(h * scale)
                    # 确保是偶数（某些API要求）
                    w, h = w - w % 2, h - h % 2
                    size = f"{w}x{h}"
                    logger.info(f"图片尺寸已自动调整为 {size}（最小要求 1920x1920）")
            except (ValueError, AttributeError):
                pass  # 使用原始尺寸

        base = f"{self.endpoint}/api/v3"
        url = f"{base}/images/generations" if not self.project_id else f"{base}/projects/{self.project_id}/images/generations"

        payload = {
            "model": model,
            "prompt": prompt,
            "size": size,
            "quality": quality,
            "n": n
        }

        # R24优化: 图片生成超时较长，但仍支持重试
        last_error = None
        img_timeout = 180.0
        for attempt in range(MAX_RETRIES + 1):
            try:
                response = self._do_request(url, payload, img_timeout)
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
                last_error = e
                if _is_retryable(e) and attempt < MAX_RETRIES:
                    delay = RETRY_DELAY_BASE * (2 ** attempt)
                    logger.warning(f"图片生成API超时/连接失败，{delay:.1f}秒后重试 ({attempt + 1}/{MAX_RETRIES}): {type(e).__name__}")
                    time.sleep(delay)
                    continue
                logger.warning(f"图片生成API失败: {type(e).__name__}")
                return {
                    "success": False,
                    "error": _sanitize_error(e),
                    "model": model
                }

        return {
            "success": False,
            "error": _sanitize_error(last_error) if last_error else "服务暂时不可用，请稍后重试",
            "model": model
        }


# 全局实例
volc_api = VolcEngineAPI()


def get_volc_api() -> VolcEngineAPI:
    """获取火山API实例"""
    return volc_api
