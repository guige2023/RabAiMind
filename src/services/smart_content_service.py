# -*- coding: utf-8 -*-
"""
Smart Content Suggestions Service
智能内容增强：内容建议、引用查找、图片建议、引用语推荐、相关演示文稿
"""
import logging
import json
import re
from typing import Dict, Any, List, Optional

from .volc_api import get_volc_api

logger = logging.getLogger(__name__)


def get_smart_content_service() -> "SmartContentService":
    return SmartContentService()


class SmartContentService:
    """Smart content suggestions service"""

    # ============ 1. Content Boost ============
    CONTENT_BOOST_PROMPT = """你是一个专业的PPT内容优化专家。根据提供的PPT内容，分析并给出增强建议。

当前PPT内容：
主题：{topic}
风格：{style}
场景：{scene}

幻灯片内容：
{slides_content}

请执行内容增强分析，返回以下JSON格式：
{{
    "content_boost": {{
        "missing_topics": ["建议添加的遗漏主题1", "建议添加的遗漏主题2"],
        "strengthened_points": ["可以进一步深化的论点1", "可以进一步深化的论点2"],
        "suggested_additions": [
            {{
                "slide_index": 0,
                "suggestion_type": "new_point",
                "original": "当前内容描述",
                "suggestion": "建议添加的内容",
                "reason": "添加理由"
            }}
        ],
        "depth_improvements": [
            {{
                "slide_index": 1,
                "current_depth": "当前深度评估",
                "improved_version": "深化后的版本",
                "improvement": "具体改进点"
            }}
        ],
        "summary": "整体内容增强总结（50字内）"
    }}
}}

请只返回JSON，不要其他内容。"""

    # ============ 2. Citation Finder ============
    CITATION_FINDER_PROMPT = """你是一个严谨的学术引用专家。分析PPT内容中需要引用的声明，并提供可靠来源。

PPT主题：{topic}

幻灯片内容：
{slides_content}

请分析并返回以下JSON格式：
{{
    "citations": [
        {{
            "slide_index": 0,
            "claim": "需要引用的具体声明",
            "citation_needed_reason": "为什么需要引用",
            "suggested_source": "建议的来源类型",
            "source_keywords": ["关键词1", "关键词2"],
            "confidence": "high/medium/low"
        }}
    ],
    "general_sources": [
        {{
            "topic": "相关主题",
            "source_type": "official_report/academic/journal/website/statistics",
            "source_name": "来源名称建议",
            "description": "来源描述"
        }}
    ],
    "citation_count": 3
}}

请只返回JSON，不要其他内容。"""

    # ============ 3. Image Suggestions ============
    IMAGE_SUGGESTION_PROMPT = """你是一个专业的PPT配图专家。根据幻灯片内容，推荐最合适的图片类型和搜索关键词。

幻灯片内容：
{slide_content}

页码：{slide_index}
主题：{topic}

请返回以下JSON格式：
{{
    "image_suggestions": [
        {{
            "slide_index": {slide_index},
            "image_type": "photo/icon/illustration/chart/diagram/background",
            "description": "图片内容描述",
            "search_keywords": ["关键词1", "关键词2", "关键词3"],
            "placement": "header/background/content/callout",
            "style_hint": "风格提示（写实/扁平/剪影等）",
            "alternative_concepts": ["备选概念1", "备选概念2"]
        }}
    ],
    "overall_image_strategy": "整体配图策略总结"
}}

请只返回JSON，不要其他内容。"""

    # ============ 4. Quote Suggestions ============
    QUOTE_SUGGESTION_PROMPT = """你是一个专业的名言引用专家。根据PPT主题和内容，推荐最合适的引用语。

PPT主题：{topic}
场景：{scene}
风格：{style}

幻灯片内容：
{slides_content}

请返回以下JSON格式：
{{
    "quote_suggestions": [
        {{
            "slide_index": 0,
            "quote": "引用内容",
            "author": "作者",
            "source": "出处",
            "relevance": "与内容的关联",
            "placement": "开头/结尾/过渡/强调",
            "translation_if_needed": "如为外文，附中文翻译"
        }}
    ],
    "quote_themes": ["主题1", "主题2", "主题3"],
    "strategy_note": "引用策略说明"
}}

请只返回JSON，不要其他内容。"""

    # ============ 5. Related Presentations ============
    RELATED_PPT_PROMPT = """你是一个专业的PPT策划专家。根据当前PPT的主题和内容，推荐相关的演示文稿方向。

当前PPT：
主题：{topic}
风格：{style}
场景：{scene}
页数：{page_count}

幻灯片内容：
{slides_content}

请返回以下JSON格式：
{{
    "related_presentations": [
        {{
            "title": "相关演示文稿标题",
            "relationship": "承接/对比/深化/案例/背景",
            "description": "为什么相关",
            "target_audience": "目标受众",
            "suggested_pages": "建议页数",
            "link_type": "prequel/sequel/comparison/case_study/background"
        }}
    ],
    "related_topics": ["相关主题1", "相关主题2", "相关主题3"],
    "audience_expansion": ["可拓展的受众群体1", "受众群体2"],
    "summary": "整体关联策略总结"
}}

请只返回JSON，不要其他内容。"""

    # ============ Feature 1: Content Boost ============
    def content_boost(
        self,
        topic: str,
        slides: List[Dict[str, Any]],
        style: str = "professional",
        scene: str = "business"
    ) -> Dict[str, Any]:
        """
        AI suggests relevant content to add to the presentation.
        """
        volc = get_volc_api()

        slides_content = "\n".join([
            f"[页{idx}] 标题: {s.get('title', '')}\n内容: {s.get('content', '')}"
            for idx, s in enumerate(slides)
        ])

        prompt = self.CONTENT_BOOST_PROMPT.format(
            topic=topic,
            style=style,
            scene=scene,
            slides_content=slides_content
        )

        result = volc.text_generation(
            prompt=prompt,
            temperature=0.5,
            max_tokens=4096
        )

        if not result.get("success", False):
            return {"success": False, "error": result.get("error", "AI调用失败")}

        try:
            text = result["content"]
            json_match = re.search(r'\{[\s\S]*\}', text)
            if json_match:
                parsed = json.loads(json_match.group())
            else:
                parsed = json.loads(text)
            return {"success": True, "data": parsed.get("content_boost", {})}
        except json.JSONDecodeError as e:
            logger.error(f"JSON解析失败: {e}, content: {text[:500]}")
            return {"success": False, "error": "内容解析失败"}

    # ============ Feature 2: Citation Finder ============
    def citation_finder(
        self,
        topic: str,
        slides: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Automatically find sources for claims in the presentation.
        """
        volc = get_volc_api()

        slides_content = "\n".join([
            f"[页{idx}] 标题: {s.get('title', '')}\n内容: {s.get('content', '')}"
            for idx, s in enumerate(slides)
        ])

        prompt = self.CITATION_FINDER_PROMPT.format(
            topic=topic,
            slides_content=slides_content
        )

        result = volc.text_generation(
            prompt=prompt,
            temperature=0.3,
            max_tokens=4096
        )

        if not result.get("success", False):
            return {"success": False, "error": result.get("error", "AI调用失败")}

        try:
            text = result["content"]
            json_match = re.search(r'\{[\s\S]*\}', text)
            if json_match:
                parsed = json.loads(json_match.group())
            else:
                parsed = json.loads(text)
            return {"success": True, "data": parsed}
        except json.JSONDecodeError as e:
            logger.error(f"JSON解析失败: {e}, content: {text[:500]}")
            return {"success": False, "error": "引用解析失败"}

    # ============ Feature 3: Image Suggestions ============
    def image_suggestions(
        self,
        topic: str,
        slides: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Suggest relevant images based on slide content.
        """
        volc = get_volc_api()

        results = []
        for idx, slide in enumerate(slides):
            slide_content = f"标题: {slide.get('title', '')}\n内容: {slide.get('content', '')}"
            prompt = self.IMAGE_SUGGESTION_PROMPT.format(
                slide_content=slide_content,
                slide_index=idx,
                topic=topic
            )

            result = volc.text_generation(
                prompt=prompt,
                temperature=0.5,
                max_tokens=2048
            )

            if result.get("success", False):
                try:
                    text = result["content"]
                    json_match = re.search(r'\{[\s\S]*\}', text)
                    if json_match:
                        parsed = json.loads(json_match.group())
                        if "image_suggestions" in parsed:
                            results.extend(parsed["image_suggestions"])
                    elif "suggestion" in result["content"]:
                        # Handle single suggestion format
                        pass
                except json.JSONDecodeError:
                    pass

        if not results:
            return {"success": True, "data": {"image_suggestions": [], "overall_image_strategy": "建议为每页添加相关配图"}}

        return {
            "success": True,
            "data": {
                "image_suggestions": results,
                "overall_image_strategy": "根据内容为每页添加对应的图片素材"
            }
        }

    # ============ Feature 4: Quote Suggestions ============
    def quote_suggestions(
        self,
        topic: str,
        slides: List[Dict[str, Any]],
        style: str = "professional",
        scene: str = "business"
    ) -> Dict[str, Any]:
        """
        Suggest relevant quotes from a knowledge base.
        """
        volc = get_volc_api()

        slides_content = "\n".join([
            f"[页{idx}] 标题: {s.get('title', '')}\n内容: {s.get('content', '')}"
            for idx, s in enumerate(slides)
        ])

        prompt = self.QUOTE_SUGGESTION_PROMPT.format(
            topic=topic,
            scene=scene,
            style=style,
            slides_content=slides_content
        )

        result = volc.text_generation(
            prompt=prompt,
            temperature=0.7,
            max_tokens=4096
        )

        if not result.get("success", False):
            return {"success": False, "error": result.get("error", "AI调用失败")}

        try:
            text = result["content"]
            json_match = re.search(r'\{[\s\S]*\}', text)
            if json_match:
                parsed = json.loads(json_match.group())
            else:
                parsed = json.loads(text)
            return {"success": True, "data": parsed}
        except json.JSONDecodeError as e:
            logger.error(f"JSON解析失败: {e}, content: {text[:500]}")
            return {"success": False, "error": "引用语解析失败"}

    # ============ Feature 5: Related Presentations ============
    def related_presentations(
        self,
        topic: str,
        slides: List[Dict[str, Any]],
        style: str = "professional",
        scene: str = "business",
        page_count: int = 10
    ) -> Dict[str, Any]:
        """
        Link to related presentations based on content.
        """
        volc = get_volc_api()

        slides_content = "\n".join([
            f"[页{idx}] 标题: {s.get('title', '')}\n内容: {s.get('content', '')}"
            for idx, s in enumerate(slides)
        ])

        prompt = self.RELATED_PPT_PROMPT.format(
            topic=topic,
            style=style,
            scene=scene,
            page_count=page_count,
            slides_content=slides_content
        )

        result = volc.text_generation(
            prompt=prompt,
            temperature=0.6,
            max_tokens=4096
        )

        if not result.get("success", False):
            return {"success": False, "error": result.get("error", "AI调用失败")}

        try:
            text = result["content"]
            json_match = re.search(r'\{[\s\S]*\}', text)
            if json_match:
                parsed = json.loads(json_match.group())
            else:
                parsed = json.loads(text)
            return {"success": True, "data": parsed}
        except json.JSONDecodeError as e:
            logger.error(f"JSON解析失败: {e}, content: {text[:500]}")
            return {"success": False, "error": "相关演示解析失败"}
