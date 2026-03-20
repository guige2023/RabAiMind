# -*- coding: utf-8 -*-
"""
PPT 创意引擎

整合所有设计能力，提供完整的PPT生成流程

作者: Claude
日期: 2026-03-18
"""

import json
import logging
import threading
from typing import Dict, Any, List, Optional

from .layout_strategy import LayoutStrategy, get_layout_strategy
from .layout_calculator import LayoutCalculator, get_layout_calculator
from .color_scheme import ColorSchemeGenerator, get_color_scheme_generator
from .content_analyzer import ContentAnalyzer, get_content_analyzer
from .svg_element_library import SVGElementLibrary, get_svg_element_library
from .visual_element_generator import VisualElementGenerator, get_visual_element_generator
from .ai_visual_designer import AIVisualDesigner, get_ai_visual_designer

logger = logging.getLogger(__name__)


class PPTCreativeEngine:
    """PPT 创意引擎 - 整合所有设计能力"""

    def __init__(self, llm_client=None):
        """
        初始化创意引擎

        Args:
            llm_client: 可选的LLM客户端
        """
        # 初始化各个模块
        self.color_generator = get_color_scheme_generator()
        self.layout_strategy = get_layout_strategy()
        self.layout_calculator = get_layout_calculator()
        self.content_analyzer = get_content_analyzer()
        self.element_library = get_svg_element_library()
        self.visual_generator = get_visual_element_generator()
        self.ai_designer = get_ai_visual_designer(llm_client)

    async def create_slide_svg(
        self,
        title: str,
        content: List[Dict[str, Any]],
        slide_type: str,
        colors: Dict[str, str],
        use_ai: bool = True
    ) -> str:
        """
        创建单页SVG

        Args:
            title: 标题
            content: 内容列表
            slide_type: 幻灯片类型
            colors: 配色方案
            use_ai: 是否使用AI生成

        Returns:
            SVG代码
        """
        if use_ai:
            try:
                return await self.ai_designer.design_slide(
                    title=title,
                    content=content,
                    slide_type=slide_type,
                    colors=colors
                )
            except Exception as e:
                logger.warning(f"AI design failed, using template fallback: {e}")

        # 使用模板生成
        return self._create_slide_from_template(title, content, slide_type, colors)

    def _create_slide_from_template(
        self,
        title: str,
        content: List[Dict[str, Any]],
        slide_type: str,
        colors: Dict[str, str]
    ) -> str:
        """使用模板创建幻灯片"""
        if slide_type == "title_slide":
            # 提取副标题：从content第一个元素的title字段获取
            subtitle = content[0].get("title", "") if content else ""
            return self.visual_generator.generate_title_slide(title, subtitle, colors)
        elif slide_type == "quote":
            # 金句布局：title作为引用内容，content作为要点
            quote = title  # 使用原始标题作为引用内容
            # 获取内容要点
            bullets = [item.get("title", "") for item in content[:4]] if content else []
            return self.visual_generator.generate_quote_slide(quote, bullets, colors)
        elif slide_type == "timeline":
            return self.visual_generator.generate_content_slide(title, content, colors, layout="timeline")
        elif slide_type == "center_radiation":
            return self.visual_generator.generate_content_slide(title, content, colors, layout="center_radiation")
        elif slide_type == "two_column":
            return self.visual_generator.generate_content_slide(title, content, colors, layout="two_column")
        elif slide_type == "comparison":
            return self.visual_generator.generate_content_slide(title, content, colors, layout="two_column")
        else:
            return self.visual_generator.generate_content_slide(title, content, colors, layout="card")

    def get_layout_suggestion(self, title: str, content: str) -> Dict[str, Any]:
        """
        获取布局建议

        Args:
            title: 标题
            content: 内容

        Returns:
            布局建议字典
        """
        analysis = self.content_analyzer.analyze(title, content)

        return {
            "recommended_layout": analysis.recommended_layout,
            "content_type": analysis.type,
            "density": analysis.density,
            "element_count": analysis.element_count,
            "keywords": analysis.keywords
        }

    def generate_color_palette(
        self,
        style: str = "professional",
        theme_color: str = None
    ) -> Dict[str, str]:
        """
        生成配色方案

        Args:
            style: 风格
            theme_color: 主题色

        Returns:
            配色字典
        """
        if theme_color:
            palette = self.color_generator.get_palette_from_theme_color(theme_color, style)
        else:
            palette = self.color_generator.get_palette(style)

        return {
            "primary": palette.primary,
            "secondary": palette.secondary,
            "accent": palette.accent,
            "background": palette.background,
            "text": palette.text,
            "text_secondary": palette.text_secondary,
            "card_bg": palette.card_bg,
            "border": palette.border
        }

    def create_presentation(
        self,
        slides: List[Dict[str, Any]],
        style: str = "professional",
        theme_color: str = None,
        use_ai: bool = False
    ) -> List[str]:
        """
        创建完整演示文稿的SVG列表

        Args:
            slides: 幻灯片列表
            style: 风格
            theme_color: 主题色
            use_ai: 是否使用AI

        Returns:
            SVG代码列表
        """
        # 生成配色
        colors = self.generate_color_palette(style, theme_color)

        # 生成每页SVG
        svg_list = []

        for i, slide in enumerate(slides):
            title = slide.get("title", "")
            content = slide.get("content", [])

            # 分析内容类型
            content_text = "\n".join([str(c) for c in content])
            analysis = self.content_analyzer.analyze(title, content_text)
            slide_type = analysis.type

            # 如果没有指定内容类型，使用分析结果
            if slide.get("type"):
                slide_type = slide["type"]

            # 生成SVG - 使用模板或AI
            if use_ai:
                # 注意：AI模式需要异步调用，这里简化处理
                # 实际使用时应该在async函数中调用
                import warnings
                warnings.warn("use_ai=True requires async handling")
                svg = self._create_slide_from_template(title, content, slide_type, colors)
            else:
                svg = self._create_slide_from_template(title, content, slide_type, colors)

            svg_list.append(svg)

        return svg_list


# 单例实例
_creative_engine_instance: Optional[PPTCreativeEngine] = None
_manager_lock = threading.Lock()


def get_creative_engine(llm_client=None) -> PPTCreativeEngine:
    """获取创意引擎单例（线程安全）"""
    global _creative_engine_instance
    if _creative_engine_instance is None:
        with _manager_lock:
            if _creative_engine_instance is None:
                _creative_engine_instance = PPTCreativeEngine(llm_client)
    return _creative_engine_instance
