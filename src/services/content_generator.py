"""
内容生成服务
文本生成、图片生成等
"""
import logging
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
import json
from datetime import datetime

from .volc_api import get_volc_api, VolcEngineAPI

logger = logging.getLogger(__name__)

# 输入长度限制
MAX_TOPIC_LENGTH = 500
MAX_STYLE_LENGTH = 100
MAX_AUDIENCE_LENGTH = 100
MAX_PROMPT_LENGTH = 4000
MAX_SLIDE_COUNT = 30


@dataclass
class TextContent:
    """文本内容"""
    title: str
    content: str
    bullet_points: List[str]
    notes: Optional[str] = None


@dataclass
class ImageContent:
    """图片内容"""
    description: str
    prompt: str
    url: Optional[str] = None


@dataclass
class SlideContent:
    """单页幻灯片内容"""
    slide_number: int
    title: str
    content: str
    bullet_points: List[str]
    image: Optional[ImageContent] = None
    notes: Optional[str] = None


class ContentGenerator:
    """内容生成器"""
    
    def __init__(self, volc_api: Optional[VolcEngineAPI] = None):
        self.volc_api = volc_api or get_volc_api()
        
    def generate_slide_content(
        self,
        topic: str,
        slide_structure: List[Dict[str, str]],
        style: str = "professional",
        audience: str = "business"
    ) -> List[SlideContent]:
        """
        生成幻灯片内容

        Args:
            topic: 主题
            slide_structure: 幻灯片结构
            style: 风格
            audience: 目标受众

        Returns:
            幻灯片内容列表
        """
        # 输入验证
        topic = topic[:MAX_TOPIC_LENGTH] if topic else ""
        style = style[:MAX_STYLE_LENGTH] if style else "professional"
        audience = audience[:MAX_AUDIENCE_LENGTH] if audience else "business"
        slide_structure = slide_structure[:MAX_SLIDE_COUNT] if slide_structure else []

        # 构建prompt
        prompt = self._build_content_prompt(topic, slide_structure, style, audience)

        # 调用API生成
        response = self.volc_api.text_generation(
            prompt=prompt,
            model="doubao-pro-32k",
            temperature=0.7,
            max_tokens=4096
        )

        if not response.get("success"):
            logger.warning(f"文本生成API失败: {response.get('error', '未知错误')}")
            return self._create_default_content(slide_structure)

        # 解析结果
        try:
            content = response.get("content", "")
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]

            data = json.loads(content.strip())
            slides = data.get("slides", [])

            result = []
            for i, slide_data in enumerate(slides):
                result.append(SlideContent(
                    slide_number=slide_data.get("slide_number", i + 1),
                    title=slide_data.get("title", ""),
                    content=slide_data.get("content", ""),
                    bullet_points=slide_data.get("bullet_points", []),
                    notes=slide_data.get("notes")
                ))

            return result

        except (json.JSONDecodeError, KeyError) as e:
            logger.warning(f"解析生成内容失败: {type(e).__name__}, 使用默认内容")
            return self._create_default_content(slide_structure)
    
    def generate_image_prompt(
        self,
        slide_content: SlideContent,
        style: str = "professional"
    ) -> str:
        """
        生成图片提示词

        Args:
            slide_content: 幻灯片内容
            style: 风格

        Returns:
            英文提示词
        """
        # 限制输入长度
        title = slide_content.title[:200] if slide_content.title else ""
        content = slide_content.content[:1000] if slide_content.content else ""
        bullet_points = [bp[:200] for bp in (slide_content.bullet_points or [])[:5]]
        style = style[:MAX_STYLE_LENGTH] if style else "professional"

        prompt = f"""根据以下幻灯片内容生成AI绘画提示词：

标题：{title}
内容：{content}
要点：{', '.join(bullet_points)}

要求：
1. 详细描述画面内容
2. 包含艺术风格：{style}
3. 适合AI图像生成
4. 返回英文提示词

直接返回提示词，不要其他内容。"""

        response = self.volc_api.text_generation(
            prompt=prompt,
            max_tokens=512,
            temperature=0.7
        )

        if response.get("success"):
            return response.get("content", "").strip()

        return ""
    
    def generate_image(
        self,
        prompt: str,
        model: str = "stable-diffusion-xl-2600"
    ) -> Optional[str]:
        """
        生成图片

        Args:
            prompt: 提示词
            model: 模型

        Returns:
            图片URL
        """
        # 限制提示词长度
        prompt = prompt[:MAX_PROMPT_LENGTH] if prompt else ""

        response = self.volc_api.image_generation(
            prompt=prompt,
            model=model
        )

        if response.get("success"):
            images = response.get("images", [])
            return images[0] if images else None

        return None
    
    def understand_image(self, image_url: str, question: str = "描述这张图片") -> str:
        """
        理解图片
        
        Args:
            image_url: 图片URL
            question: 问题
            
        Returns:
            理解结果
        """
        response = self.volc_api.image_to_text(
            image_url=image_url,
            prompt=question
        )
        
        if response.get("success"):
            return response.get("content", "")
        
        return ""
    
    def _build_content_prompt(
        self,
        topic: str,
        slide_structure: List[Dict[str, str]],
        style: str,
        audience: str
    ) -> str:
        """构建内容生成prompt"""
        
        structure_str = json.dumps(slide_structure, ensure_ascii=False, indent=2)
        
        prompt = f"""你是一个专业的PPT内容撰写专家。请为以下主题生成每页幻灯片的详细内容。

主题：{topic}
风格：{style}
目标受众：{audience}

幻灯片结构：
{structure_str}

请为每个幻灯片生成：
1. title: 标题
2. content: 正文内容（简洁有力，适合PPT展示）
3. bullet_points: 关键要点列表（3-5个）
4. notes: 演讲备注（可选）

请按以下JSON格式返回：
{{
    "slides": [
        {{
            "slide_number": 1,
            "title": "标题",
            "content": "正文内容",
            "bullet_points": ["要点1", "要点2", "要点3"],
            "notes": "演讲备注"
        }},
        ...
    ]
}}

请只返回JSON，不要其他内容。"""
        
        return prompt
    
    def _create_default_content(
        self,
        slide_structure: List[Dict[str, str]]
    ) -> List[SlideContent]:
        """创建默认内容"""
        result = []
        for i, slide in enumerate(slide_structure):
            result.append(SlideContent(
                slide_number=i + 1,
                title=slide.get("title", f"第{i+1}页"),
                content=slide.get("content", ""),
                bullet_points=[],
                notes=None
            ))
        return result


# 全局实例
content_generator = ContentGenerator()


def get_content_generator() -> ContentGenerator:
    """获取内容生成器实例"""
    return content_generator
