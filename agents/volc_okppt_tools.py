"""
volc_okppt_tools - 火山引擎 PPT 工具集

为 Agent 层提供:
- PromptOptimizer: PPT 提示词优化
- VolcanoClient: 火山引擎 API 客户端封装
- get_volcano_client(): 获取全局客户端实例
"""

import logging
import os
import sys
import importlib.util
from typing import Optional, Dict, Any

# 直接加载 volc_api.py，避免触发 src/services/__init__.py 的全量 import
_volc_api_path = os.path.join(os.path.dirname(__file__), "..", "src", "services", "volc_api.py")
_spec = importlib.util.spec_from_file_location("volc_api_direct", _volc_api_path)
_volc_api_mod = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_volc_api_mod)
VolcEngineAPI = _volc_api_mod.VolcEngineAPI

logger = logging.getLogger(__name__)


class VolcanoAPIError(Exception):
    """火山引擎 API 错误"""
    pass


class VolcanoClient:
    """
    火山引擎客户端封装

    适配 Agent 层的 generate_text 接口，内部委托给 VolcEngineAPI
    """

    def __init__(self, api_key: Optional[str] = None, endpoint: Optional[str] = None):
        self._api = VolcEngineAPI(api_key=api_key, endpoint=endpoint)

    def generate_text(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
        model: str = "doubao-pro-32k"
    ) -> Dict[str, Any]:
        """
        生成文本

        Args:
            prompt: 用户提示词
            system_prompt: 系统提示词（会拼接到 prompt 前面）
            temperature: 温度参数
            max_tokens: 最大 token 数
            model: 模型名称

        Returns:
            {"content": str, "success": bool, "error": Optional[str]}
        """
        full_prompt = prompt
        if system_prompt:
            full_prompt = f"{system_prompt}\n\n{prompt}"

        result = self._api.text_generation(
            prompt=full_prompt,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens
        )

        if result.get("success"):
            return {"content": result["content"]}
        else:
            raise VolcanoAPIError(result.get("error", "未知错误"))


# ---------------------------------------------------------------------------
# 全局单例
# ---------------------------------------------------------------------------

_volcano_client: Optional[VolcanoClient] = None


def get_volcano_client() -> VolcanoClient:
    """获取火山引擎客户端单例"""
    global _volcano_client
    if _volcano_client is None:
        _volcano_client = VolcanoClient()
    return _volcano_client


# ---------------------------------------------------------------------------
# PromptOptimizer
# ---------------------------------------------------------------------------

class PromptOptimizer:
    """
    PPT 提示词优化器

    将用户原始需求转换为结构化的 PPT 生成提示词
    """

    @staticmethod
    def optimize_for_ppt(
        user_request: str,
        scene: Optional[str] = None,
        slide_count: int = 10,
        style: str = "professional"
    ) -> str:
        """
        优化用户需求为 PPT 提示词

        Args:
            user_request: 用户原始需求
            scene: 场景（business/education/marketing/creative）
            slide_count: 幻灯片数量
            style: 风格（professional/minimalist/creative）

        Returns:
            优化后的提示词
        """
        scene_map = {
            "business": "商业汇报",
            "education": "教育培训",
            "marketing": "营销推广",
            "creative": "创意展示",
        }
        scene_text = scene_map.get(scene, scene or "通用")

        style_map = {
            "professional": "专业简洁",
            "minimalist": "简约大气",
            "creative": "创意活泼",
        }
        style_text = style_map.get(style, style)

        template = f"""你是一位专业的 PPT 内容策划专家。请根据用户需求，生成一份结构清晰的 PPT 内容大纲。

## 用户需求
{user_request}

## 场景
{scene_text}

## 幻灯片数量
{slide_count} 页

## 风格要求
{style_text}

## 输出格式
请以 JSON 格式输出，包含 slides 数组，每一页包含：
- title: 页面标题
- type: 页面类型（content/image/chart/title）
- content: 核心要点（3-5 个）
- notes: 演讲备注（可选）

输出示例：
```json
{{
  "slides": [
    {{
      "title": "封面页",
      "type": "title",
      "content": ["主标题", "副标题", "日期/作者"]
    }},
    {{
      "title": "目录页",
      "type": "content",
      "content": ["模块一：背景", "模块二：分析", "模块三：结论"]
    }}
  ]
}}
```"""
        return template
