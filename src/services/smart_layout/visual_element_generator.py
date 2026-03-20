# -*- coding: utf-8 -*-
"""
视觉元素生成器

根据布局和内容生成完整的SVG页面

作者: Claude
日期: 2026-03-18
"""

import threading
from typing import Dict, Any, List, Optional
import math
import textwrap

from .svg_element_library import SVGElementLibrary
from .layout_calculator import LayoutCalculator
from .color_scheme import ColorPalette


class VisualElementGenerator:
    """视觉元素生成器"""

    CANVAS_WIDTH = 1600
    CANVAS_HEIGHT = 900

    def __init__(self):
        """初始化视觉元素生成器"""
        self.element_library = SVGElementLibrary()
        self.layout_calculator = LayoutCalculator()

    def generate_title_slide(
        self,
        title: str,
        subtitle: str = "",
        colors: Dict[str, str] = None,
        decorates: List[str] = None
    ) -> str:
        """生成封面幻灯片"""
        colors = colors or {
            "primary": "#165DFF",
            "secondary": "#364FC7",
            "background": "#FFFFFF",
            "text": "#FFFFFF"
        }

        decorates = decorates or ["gradient_bg", "corner_accent", "geometric_shapes"]

        # 生成装饰元素
        decorations_svg = ""
        for decorate in decorates:
            decorations_svg += self.element_library.generate_decorative_element(
                decorate,
                color=colors.get("primary", "#165DFF"),
                start_color=colors.get("primary", "#165DFF"),
                end_color=colors.get("secondary", "#364FC7")
            )

        svg = f'''<svg width="{self.CANVAS_WIDTH}" height="{self.CANVAS_HEIGHT}"
           viewBox="0 0 {self.CANVAS_WIDTH} {self.CANVAS_HEIGHT}"
           xmlns="http://www.w3.org/2000/svg">

            <defs>
                <linearGradient id="titleBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:{colors.get('primary', '#165DFF')};stop-opacity:1"/>
                    <stop offset="100%" style="stop-color:{colors.get('secondary', '#364FC7')};stop-opacity:1"/>
                </linearGradient>
            </defs>

            <!-- 背景 -->
            <rect width="{self.CANVAS_WIDTH}" height="{self.CANVAS_HEIGHT}" fill="url(#titleBgGrad)"/>

            <!-- 装饰元素 -->
            {decorations_svg}

            <!-- 大圆装饰 -->
            <circle cx="1400" cy="200" r="300" fill="white" opacity="0.08"/>
            <circle cx="200" cy="700" r="200" fill="white" opacity="0.05"/>

            <!-- 主标题 -->
            <text x="{self.CANVAS_WIDTH // 2}" y="400"
                  text-anchor="middle"
                  font-family="Microsoft YaHei, Arial, sans-serif"
                  font-size="72" font-weight="bold" fill="{colors.get('text', '#FFFFFF')}">
                {self._wrap_text(title, 20)}
            </text>

            <!-- 分隔线 -->
            <line x1="600" y1="480" x2="1000" y2="480"
                  stroke="{colors.get('text', '#FFFFFF')}" stroke-width="2" opacity="0.5"/>

            <!-- 副标题 -->
            <text x="{self.CANVAS_WIDTH // 2}" y="530"
                  text-anchor="middle"
                  font-family="Microsoft YaHei, Arial, sans-serif"
                  font-size="28" fill="{colors.get('text', '#FFFFFF')}" opacity="0.9">
                {subtitle}
            </text>

        </svg>'''

        return svg

    def generate_content_slide(
        self,
        title: str,
        content_items: List[Dict[str, Any]],
        colors: Dict[str, str],
        layout: str = "card"
    ) -> str:
        """生成内容幻灯片"""
        if layout == "card":
            return self._generate_card_layout(title, content_items, colors)
        elif layout == "two_column":
            return self._generate_two_column_layout(title, content_items, colors)
        elif layout == "timeline":
            return self._generate_timeline_layout(title, content_items, colors)
        elif layout == "center_radiation":
            return self._generate_radial_layout(title, content_items, colors)
        else:
            return self._generate_simple_layout(title, content_items, colors)

    def _generate_card_layout(
        self,
        title: str,
        content_items: List[Dict[str, Any]],
        colors: Dict[str, str]
    ) -> str:
        """生成卡片布局"""
        # 计算卡片布局
        card_count = len(content_items)
        card_layout = self.layout_calculator.calculate_card_layout(card_count)

        # 生成卡片SVG
        cards_svg = ""
        for i, item in enumerate(content_items):
            if i < len(card_layout.positions):
                x, y = card_layout.positions[i]

                card_title = item.get("title", "")
                card_content = item.get("content", "")
                icon = item.get("icon", "")

                card_svg = self._generate_card(
                    x, y,
                    card_layout.card_width,
                    card_layout.card_height,
                    card_title,
                    card_content,
                    icon,
                    colors
                )
                cards_svg += card_svg

        svg = f'''<svg width="{self.CANVAS_WIDTH}" height="{self.CANVAS_HEIGHT}"
           viewBox="0 0 {self.CANVAS_WIDTH} {self.CANVAS_HEIGHT}"
           xmlns="http://www.w3.org/2000/svg">

            <!-- 背景 -->
            <rect width="{self.CANVAS_WIDTH}" height="{self.CANVAS_HEIGHT}" fill="{colors.get('background', '#FFFFFF')}"/>

            <!-- 标题 -->
            <text x="100" y="60"
                  font-family="Microsoft YaHei, Arial, sans-serif"
                  font-size="36" font-weight="bold" fill="{colors.get('text', '#1D2129')}">
                {title}
            </text>

            <!-- 标题下划线 -->
            <line x1="100" y1="75" x2="200" y2="75"
                  stroke="{colors.get('primary', '#165DFF')}" stroke-width="3"/>

            <!-- 卡片 -->
            {cards_svg}

        </svg>'''

        return svg

    def _generate_card(
        self,
        x: int,
        y: int,
        width: int,
        height: int,
        title: str,
        content: str,
        icon: str,
        colors: Dict[str, str]
    ) -> str:
        """生成单个卡片"""
        # 获取图标
        icon_svg = ""
        if icon:
            icon_path = self.element_library.get_icon(icon)
            if icon_path:
                icon_svg = f'''<g transform="translate({x + 20}, {y + 20})">
                    <g transform="scale(1.5) translate(0, 0)">
                        {icon_path}
                    </g>
                </g>'''

        # 文本换行
        wrapped_title = self._wrap_text(title, 15)
        wrapped_content = self._wrap_text(content, 25)

        return f'''
        <!-- 卡片背景 -->
        <rect x="{x}" y="{y}" width="{width}" height="{height}" rx="12"
              fill="{colors.get('card_bg', '#F7F8FA')}"
              stroke="{colors.get('border', '#E5E6EB')}" stroke-width="1"/>

        <!-- 图标 -->
        {icon_svg}

        <!-- 卡片标题 -->
        <text x="{x + 20}" y="{y + 70}"
              font-family="Microsoft YaHei, Arial, sans-serif"
              font-size="20" font-weight="bold" fill="{colors.get('text', '#1D2129')}">
            {wrapped_title}
        </text>

        <!-- 卡片内容 -->
        <text x="{x + 20}" y="{y + 110}"
              font-family="Microsoft YaHei, Arial, sans-serif"
              font-size="14" fill="{colors.get('text_secondary', '#4E5969')}">
            {wrapped_content}
        </text>
        '''

    def _generate_two_column_layout(
        self,
        title: str,
        content_items: List[Dict[str, Any]],
        colors: Dict[str, str]
    ) -> str:
        """生成双栏布局"""
        two_col = self.layout_calculator.calculate_two_column_layout(0.5)

        # 分割内容
        mid = (len(content_items) + 1) // 2
        left_items = content_items[:mid]
        right_items = content_items[mid:]

        left_svg = self._generate_list_items(
            two_col.left_x, 120,
            two_col.left_width, two_col.content_height,
            left_items, colors
        )

        right_svg = self._generate_list_items(
            two_col.right_x, 120,
            two_col.right_width, two_col.content_height,
            right_items, colors
        )

        svg = f'''<svg width="{self.CANVAS_WIDTH}" height="{self.CANVAS_HEIGHT}"
           viewBox="0 0 {self.CANVAS_WIDTH} {self.CANVAS_HEIGHT}"
           xmlns="http://www.w3.org/2000/svg">

            <!-- 背景 -->
            <rect width="{self.CANVAS_WIDTH}" height="{self.CANVAS_HEIGHT}" fill="{colors.get('background', '#FFFFFF')}"/>

            <!-- 标题 -->
            <text x="100" y="60"
                  font-family="Microsoft YaHei, Arial, sans-serif"
                  font-size="36" font-weight="bold" fill="{colors.get('text', '#1D2129')}">
                {title}
            </text>

            <!-- 标题下划线 -->
            <line x1="100" y1="75" x2="200" y2="75"
                  stroke="{colors.get('primary', '#165DFF')}" stroke-width="3"/>

            <!-- 左侧内容 -->
            {left_svg}

            <!-- 分隔线 -->
            <line x1="{self.CANVAS_WIDTH // 2}" y1="100" x2="{self.CANVAS_WIDTH // 2}" y2="850"
                  stroke="{colors.get('border', '#E5E6EB')}" stroke-width="1"/>

            <!-- 右侧内容 -->
            {right_svg}

        </svg>'''

        return svg

    def _generate_list_items(
        self,
        x: int,
        y: int,
        width: int,
        height: int,
        items: List[Dict[str, Any]],
        colors: Dict[str, str]
    ) -> str:
        """生成列表项"""
        items_svg = ""
        item_height = 80
        start_y = y

        for i, item in enumerate(items):
            item_y = start_y + i * item_height
            bullet_color = colors.get("primary", "#165DFF")

            items_svg += f'''
            <!-- 列表项 -->
            <circle cx="{x + 15}" cy="{item_y + 8}" r="4" fill="{bullet_color}"/>
            <text x="{x + 35}" y="{item_y + 15}"
                  font-family="Microsoft YaHei, Arial, sans-serif"
                  font-size="16" font-weight="bold" fill="{colors.get('text', '#1D2129')}">
                {item.get('title', '')}
            </text>
            <text x="{x + 35}" y="{item_y + 40}"
                  font-family="Microsoft YaHei, Arial, sans-serif"
                  font-size="14" fill="{colors.get('text_secondary', '#4E5969')}">
                {item.get('content', '')}
            </text>
            '''

        return items_svg

    def _generate_timeline_layout(
        self,
        title: str,
        content_items: List[Dict[str, Any]],
        colors: Dict[str, str]
    ) -> str:
        """生成时间线布局"""
        event_count = len(content_items)
        timeline = self.layout_calculator.calculate_timeline_layout(event_count, "horizontal")

        # 生成时间节点
        nodes_svg = ""
        for i, item in enumerate(content_items):
            if i < len(timeline.node_positions):
                x, y = timeline.node_positions[i]
                year = item.get("year", "")
                title_text = item.get("title", "")
                content_text = item.get("content", "")

                nodes_svg += f'''
                <!-- 时间节点 -->
                <circle cx="{x}" cy="{y}" r="{timeline.node_radius}" fill="{colors.get('primary', '#165DFF')}"/>
                <text x="{x}" y="{y + 5}" text-anchor="middle"
                      font-family="Microsoft YaHei, Arial, sans-serif"
                      font-size="12" font-weight="bold" fill="white">
                    {i + 1}
                </text>

                <!-- 标题 -->
                <text x="{x}" y="{y + 50}" text-anchor="middle"
                      font-family="Microsoft YaHei, Arial, sans-serif"
                      font-size="16" font-weight="bold" fill="{colors.get('text', '#1D2129')}">
                    {title_text}
                </text>

                <!-- 内容 -->
                <text x="{x}" y="{y + 75}" text-anchor="middle"
                      font-family="Microsoft YaHei, Arial, sans-serif"
                      font-size="12" fill="{colors.get('text_secondary', '#4E5969')}">
                    {content_text}
                </text>
                '''

        # 时间轴线
        if len(timeline.node_positions) >= 2:
            line_svg = f'''
            <line x1="{timeline.node_positions[0][0]}" y1="{timeline.node_positions[0][1]}"
                  x2="{timeline.node_positions[-1][0]}" y2="{timeline.node_positions[-1][1]}"
                  stroke="{colors.get('primary', '#165DFF')}"
                  stroke-width="{timeline.line_width}"
                  opacity="0.3"/>
            '''
        else:
            line_svg = ""

        svg = f'''<svg width="{self.CANVAS_WIDTH}" height="{self.CANVAS_HEIGHT}"
           viewBox="0 0 {self.CANVAS_WIDTH} {self.CANVAS_HEIGHT}"
           xmlns="http://www.w3.org/2000/svg">

            <!-- 背景 -->
            <rect width="{self.CANVAS_WIDTH}" height="{self.CANVAS_HEIGHT}" fill="{colors.get('background', '#FFFFFF')}"/>

            <!-- 标题 -->
            <text x="100" y="60"
                  font-family="Microsoft YaHei, Arial, sans-serif"
                  font-size="36" font-weight="bold" fill="{colors.get('text', '#1D2129')}">
                {title}
            </text>

            <!-- 标题下划线 -->
            <line x1="100" y1="75" x2="200" y2="75"
                  stroke="{colors.get('primary', '#165DFF')}" stroke-width="3"/>

            <!-- 时间轴线 -->
            {line_svg}

            <!-- 时间节点 -->
            {nodes_svg}

        </svg>'''

        return svg

    def _generate_radial_layout(
        self,
        title: str,
        content_items: List[Dict[str, Any]],
        colors: Dict[str, str]
    ) -> str:
        """生成中心辐射布局"""
        branch_count = len(content_items)
        radial = self.layout_calculator.calculate_radial_layout(branch_count)

        # 生成中心
        center_svg = f'''
        <circle cx="{radial.center_x}" cy="{radial.center_y}" r="{radial.center_radius}"
                fill="{colors.get('primary', '#165DFF')}"/>
        <text x="{radial.center_x}" y="{radial.center_y + 5}" text-anchor="middle"
              font-family="Microsoft YaHei, Arial, sans-serif"
              font-size="14" font-weight="bold" fill="white">
            {title}
        </text>
        '''

        # 生成分支
        branches_svg = ""
        for i, item in enumerate(content_items):
            if i < len(radial.branch_positions):
                bx, by = radial.branch_positions[i]
                branch_title = item.get("title", "")
                branch_content = item.get("content", "")

                # 连接线
                branches_svg += f'''
                <line x1="{radial.center_x}" y1="{radial.center_y}"
                      x2="{bx}" y2="{by}"
                      stroke="{colors.get('primary', '#165DFF')}"
                      stroke-width="2" opacity="0.3"/>
                '''

                # 分支节点
                branches_svg += f'''
                <circle cx="{bx}" cy="{by}" r="40" fill="{colors.get('card_bg', '#F7F8FA')}"
                        stroke="{colors.get('primary', '#165DFF')}" stroke-width="2"/>
                <text x="{bx}" y="{by - 5}" text-anchor="middle"
                      font-family="Microsoft YaHei, Arial, sans-serif"
                      font-size="14" font-weight="bold" fill="{colors.get('text', '#1D2129')}">
                    {branch_title}
                </text>
                <text x="{bx}" y="{by + 20}" text-anchor="middle"
                      font-family="Microsoft YaHei, Arial, sans-serif"
                      font-size="10" fill="{colors.get('text_secondary', '#4E5969')}">
                    {branch_content}
                </text>
                '''

        svg = f'''<svg width="{self.CANVAS_WIDTH}" height="{self.CANVAS_HEIGHT}"
           viewBox="0 0 {self.CANVAS_WIDTH} {self.CANVAS_HEIGHT}"
           xmlns="http://www.w3.org/2000/svg">

            <!-- 背景 -->
            <rect width="{self.CANVAS_WIDTH}" height="{self.CANVAS_HEIGHT}" fill="{colors.get('background', '#FFFFFF')}"/>

            <!-- 中心 -->
            {center_svg}

            <!-- 分支 -->
            {branches_svg}

        </svg>'''

        return svg

    def _generate_simple_layout(
        self,
        title: str,
        content_items: List[Dict[str, Any]],
        colors: Dict[str, str]
    ) -> str:
        """生成简单布局"""
        return self._generate_card_layout(title, content_items, colors)

    def _wrap_text(self, text: str, max_chars: int = 20) -> str:
        """文本换行处理"""
        if not text:
            return ""
        # 简单处理：不超过指定字符数不换行
        if len(text) <= max_chars:
            return text
        # 使用tspan换行
        lines = textwrap.wrap(text, max_chars)
        return text  # 返回原始文本，让SVG自己处理

    def generate_quote_slide(
        self,
        quote: str,
        bullets: List[str],
        colors: Dict[str, str]
    ) -> str:
        """生成金句幻灯片"""
        quote_layout = self.layout_calculator.calculate_quote_layout()

        # 生成要点列表
        bullets_svg = ""
        bullet_y_start = 480
        for i, bullet in enumerate(bullets[:4]):
            bullets_svg += f'''
            <text x="200" y="{bullet_y_start + i * 40}"
                  font-family="Microsoft YaHei, Arial, sans-serif"
                  font-size="20" fill="{colors.get('text_secondary', '#4E5969')}">
                • {bullet}
            </text>'''

        svg = f'''<svg width="{self.CANVAS_WIDTH}" height="{self.CANVAS_HEIGHT}"
           viewBox="0 0 {self.CANVAS_WIDTH} {self.CANVAS_HEIGHT}"
           xmlns="http://www.w3.org/2000/svg">

            <!-- 背景 -->
            <rect width="{self.CANVAS_WIDTH}" height="{self.CANVAS_HEIGHT}" fill="{colors.get('background', '#FFFFFF')}"/>

            <!-- 装饰元素 -->
            {self.element_library.generate_decorative_element('radial_gradient',
                center_color=colors.get('primary', '#165DFF'),
                edge_color=colors.get('secondary', '#364FC7'))}

            <!-- 引用符号 -->
            <text x="150" y="250" font-size="120" fill="{colors.get('primary', '#165DFF')}" opacity="0.2">"</text>

            <!-- 引用内容 -->
            <text x="{self.CANVAS_WIDTH // 2}" y="380"
                  text-anchor="middle"
                  font-family="Microsoft YaHei, Arial, sans-serif"
                  font-size="42" font-weight="bold" fill="{colors.get('text', '#1D2129')}">
                {self._wrap_text(quote, 25)}
            </text>

            <!-- 分隔线 -->
            <line x1="400" y1="430" x2="1200" y2="430"
                  stroke="{colors.get('primary', '#165DFF')}" stroke-width="2"/>

            <!-- 要点列表 -->
            {bullets_svg}

        </svg>'''

        return svg


# 单例实例
_visual_element_generator_instance: Optional[VisualElementGenerator] = None
_manager_lock = threading.Lock()


def get_visual_element_generator() -> VisualElementGenerator:
    """获取视觉元素生成器单例（线程安全）"""
    global _visual_element_generator_instance
    if _visual_element_generator_instance is None:
        with _manager_lock:
            if _visual_element_generator_instance is None:
                _visual_element_generator_instance = VisualElementGenerator()
    return _visual_element_generator_instance
