# -*- coding: utf-8 -*-
"""
SmartLayout引擎 - 整合智能布局模块

整合以下模块：
1. ai_visual_designer.py - AI视觉设计
2. color_scheme.py - 配色方案
3. content_analyzer.py - 内容分析
4. creative_engine.py - 创意引擎
5. layout_calculator.py - 布局计算
6. layout_strategy.py - 布局策略
7. svg_element_library.py - SVG元素库
8. visual_element_generator.py - 视觉元素生成
9. __init__.py - 导出入口

作者: Claude
日期: 2026-03-20
"""

from typing import Dict, Any, List, Optional


class SmartLayoutEngine:
    """SmartLayout引擎 - 统一入口"""

    def __init__(self):
        """初始化SmartLayout引擎"""
        # 延迟导入，避免循环依赖
        self._ai_designer = None
        self._color_scheme = None
        self._content_analyzer = None
        self._creative_engine = None
        self._layout_calculator = None
        self._layout_strategy = None
        self._svg_library = None
        self._visual_generator = None

    @property
    def ai_designer(self):
        """AI视觉设计器"""
        if self._ai_designer is None:
            from .ai_visual_designer import AIVisualDesigner
            self._ai_designer = AIVisualDesigner()
        return self._ai_designer

    @property
    def color_scheme_manager(self):
        """配色方案管理器"""
        if self._color_scheme is None:
            from .color_scheme import ColorSchemeManager
            self._color_scheme = ColorSchemeManager()
        return self._color_scheme

    @property
    def content_analyzer(self):
        """内容分析器"""
        if self._content_analyzer is None:
            from .content_analyzer import ContentAnalyzer
            self._content_analyzer = ContentAnalyzer()
        return self._content_analyzer

    @property
    def creative_eng(self):
        """创意引擎"""
        if self._creative_engine is None:
            from .creative_engine import CreativeEngine
            self._creative_engine = CreativeEngine()
        return self._creative_engine

    @property
    def layout_calc(self):
        """布局计算器"""
        if self._layout_calculator is None:
            from .layout_calculator import LayoutCalculator
            self._layout_calculator = LayoutCalculator()
        return self._layout_calculator

    @property
    def layout_strat(self):
        """布局策略器"""
        if self._layout_strategy is None:
            from .layout_strategy import LayoutStrategy
            self._layout_strat = LayoutStrategy()
        return self._layout_strat

    @property
    def svg_lib(self):
        """SVG元素库"""
        if self._svg_library is None:
            from .svg_element_library import SVGElementLibrary
            self._svg_library = SVGElementLibrary()
        return self._svg_library

    @property
    def visual_gen(self):
        """视觉元素生成器"""
        if self._visual_generator is None:
            from .visual_element_generator import VisualElementGenerator
            self._visual_generator = VisualElementGenerator()
        return self._visual_generator

    def generate_layout(
        self,
        title: str,
        content: List[Any],
        layout_type: str,
        style: str,
        theme_color: str,
        text_style: str = 'transparent_overlay',
        shadow_color: str = '#000000',
        overlay_transparency: int = 30,
        fonts: Dict[str, str] = None
    ) -> str:
        """生成布局 - 统一入口

        Args:
            title: 标题
            content: 内容列表
            layout_type: 布局类型
            style: 风格
            theme_color: 主题色
            text_style: 文字样式
            shadow_color: 阴影颜色
            overlay_transparency: 遮罩透明度
            fonts: 字体配置

        Returns:
            SVG代码字符串
        """
        # 1. 分析内容
        analyzed_content = self.content_analyzer.analyze(content)

        # 2. 生成配色
        colors = self.color_scheme_manager.generate_palette(style, theme_color)

        # 3. 获取布局策略
        strategy = self.layout_strat.get_layout_strategy(layout_type)

        # 4. 计算布局
        layout = self.layout_calc.calculate(
            title=title,
            content=content,
            layout_type=layout_type,
            strategy=strategy
        )

        # 5. 获取SVG元素
        elements = self.svg_lib.get_elements(layout_type, colors)

        # 6. 生成视觉元素
        visual = self.visual_gen.generate(
            title=title,
            content=content,
            layout=layout,
            colors=colors,
            text_style=text_style,
            shadow_color=shadow_color,
            overlay_transparency=overlay_transparency,
            fonts=fonts or {}
        )

        # 7. 组合SVG
        svg = self._compose_svg(
            title=title,
            content=content,
            layout=layout,
            elements=elements,
            visual=visual,
            colors=colors,
            layout_type=layout_type
        )

        return svg

    def _compose_svg(
        self,
        title: str,
        content: List[Any],
        layout: Dict[str, Any],
        elements: Dict[str, Any],
        visual: Dict[str, Any],
        colors: Dict[str, str],
        layout_type: str
    ) -> str:
        """组合SVG"""
        width = 1920
        height = 1080

        # 背景
        bg = elements.get('background', '')
        if not bg:
            bg = f'<rect width="{width}" height="{height}" fill="{colors.get("background", "#1A1A2E")}"/>'

        # 装饰元素
        decorations = elements.get('decorations', '')

        # 内容区域
        content_svg = visual.get('content', '')

        # 组合SVG
        svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">
  <defs>
    {visual.get('defs', '')}
  </defs>
  {bg}
  {decorations}
  {content_svg}
</svg>'''

        return svg

    def get_layout_suggestion(self, title: str, content: str) -> Dict[str, Any]:
        """获取布局建议"""
        # 分析内容特征
        features = self.content_analyzer.extract_features(title, content)

        # 获取推荐布局
        suggestion = self.layout_strat.recommend_layout(features)

        return suggestion

    def get_color_palette(self, style: str, base_color: str = None) -> Dict[str, str]:
        """获取配色方案"""
        return self.color_scheme_manager.generate_palette(style, base_color)

    def generate_ai_design(
        self,
        title: str,
        content: str,
        style: str
    ) -> Dict[str, Any]:
        """生成AI设计"""
        return self.ai_designer.design(title, content, style)


# 全局实例
_smart_layout_engine: Optional[SmartLayoutEngine] = None


def get_smart_layout_engine() -> SmartLayoutEngine:
    """获取SmartLayout引擎实例"""
    global _smart_layout_engine
    if _smart_layout_engine is None:
        _smart_layout_engine = SmartLayoutEngine()
    return _smart_layout_engine
