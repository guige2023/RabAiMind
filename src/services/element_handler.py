"""
元素处理器 - 处理幻灯片元素

负责：
1. 文本元素处理
2. 形状元素处理
3. 图片元素处理
4. 图表元素处理

作者: Claude
日期: 2026-03-20
"""

import re
import threading
from typing import Any


class ElementHandler:
    """元素处理器"""

    # 文本对齐方式
    TEXT_ALIGN = {
        'left': 'left',
        'center': 'center',
        'right': 'right',
        'justify': 'justify'
    }

    # 垂直对齐
    VERTICAL_ALIGN = {
        'top': 'top',
        'middle': 'middle',
        'bottom': 'bottom'
    }

    def __init__(self):
        """初始化元素处理器"""
        self.elements = []

    def create_text_element(
        self,
        text: str,
        x: float,
        y: float,
        width: float,
        height: float,
        font_size: int = 24,
        font_family: str = '思源黑体',
        color: str = '#FFFFFF',
        bold: bool = False,
        align: str = 'left',
        valign: str = 'top'
    ) -> dict[str, Any]:
        """创建文本元素"""
        return {
            'type': 'text',
            'text': text,
            'x': x,
            'y': y,
            'width': width,
            'height': height,
            'font_size': font_size,
            'font_family': font_family,
            'color': color,
            'bold': bold,
            'align': align,
            'valign': valign
        }

    def create_shape_element(
        self,
        shape_type: str,
        x: float,
        y: float,
        width: float,
        height: float,
        fill_color: str = '#165DFF',
        stroke_color: str = None,
        stroke_width: float = 0,
        corner_radius: float = 0,
        opacity: float = 1.0
    ) -> dict[str, Any]:
        """创建形状元素"""
        return {
            'type': 'shape',
            'shape_type': shape_type,
            'x': x,
            'y': y,
            'width': width,
            'height': height,
            'fill_color': fill_color,
            'stroke_color': stroke_color,
            'stroke_width': stroke_width,
            'corner_radius': corner_radius,
            'opacity': opacity
        }

    def create_image_element(
        self,
        image_url: str,
        x: float,
        y: float,
        width: float,
        height: float,
        fit: str = 'cover',  # cover, contain, fill
        opacity: float = 1.0
    ) -> dict[str, Any]:
        """创建图片元素"""
        return {
            'type': 'image',
            'image_url': image_url,
            'x': x,
            'y': y,
            'width': width,
            'height': height,
            'fit': fit,
            'opacity': opacity
        }

    def create_chart_element(
        self,
        chart_type: str,  # pie, bar, line
        data: list[dict[str, Any]],
        x: float,
        y: float,
        width: float,
        height: float,
        title: str = '',
        colors: list[str] = None
    ) -> dict[str, Any]:
        """创建图表元素"""
        if colors is None:
            colors = ['#165DFF', '#34C759', '#FF9500', '#FF3B30', '#AF52DE']

        return {
            'type': 'chart',
            'chart_type': chart_type,
            'data': data,
            'x': x,
            'y': y,
            'width': width,
            'height': height,
            'title': title,
            'colors': colors
        }

    def create_overlay_element(
        self,
        x: float,
        y: float,
        width: float,
        height: float,
        color: str = '#000000',
        opacity: float = 0.3
    ) -> dict[str, Any]:
        """创建遮罩元素"""
        return {
            'type': 'overlay',
            'x': x,
            'y': y,
            'width': width,
            'height': height,
            'color': color,
            'opacity': opacity
        }

    def create_line_element(
        self,
        x1: float,
        y1: float,
        x2: float,
        y2: float,
        color: str = '#FFFFFF',
        width: float = 1,
        dash_array: str = None
    ) -> dict[str, Any]:
        """创建线条元素"""
        return {
            'type': 'line',
            'x1': x1,
            'y1': y1,
            'x2': x2,
            'y2': y2,
            'color': color,
            'width': width,
            'dash_array': dash_array
        }

    def wrap_text(self, text: str, max_width: int = 40) -> list[str]:
        """自动换行文本"""
        if not text:
            return []

        lines = []
        current_line = []
        current_length = 0

        # 按换行符分割
        paragraphs = text.split('\n')

        for paragraph in paragraphs:
            words = paragraph.split()

            for word in words:
                word_length = len(word)

                if current_length + word_length + len(current_line) > max_width:
                    # 当前行已满
                    if current_line:
                        lines.append(' '.join(current_line))
                    current_line = [word]
                    current_length = word_length
                else:
                    current_line.append(word)
                    current_length += word_length

            # 处理段落结束
            if current_line:
                lines.append(' '.join(current_line))
                current_line = []
                current_length = 0

        return lines

    def calculate_text_size(
        self,
        text: str,
        font_size: int,
        font_family: str = '思源黑体'
    ) -> tuple[int, int]:
        """估算文本尺寸（宽，高）"""
        lines = self.wrap_text(text)
        if not lines:
            return (0, 0)

        # 估算每个字符的宽度（粗略估计）
        char_width = font_size * 0.6
        line_height = font_size * 1.4

        max_line_length = max(len(line) for line in lines) if lines else 0
        width = max_line_length * char_width
        height = len(lines) * line_height

        return (int(width), int(height))

    def parse_svg_text_positions(self, svg_content: str) -> list[dict[str, Any]]:
        """从SVG中解析文本位置"""
        texts = []

        # 匹配<text>标签
        text_pattern = r'<text[^>]*>([^<]*)</text>'
        for match in re.finditer(text_pattern, svg_content):
            text_content = match.group(1).strip()
            if text_content:
                # 尝试获取x,y坐标
                x_match = re.search(r'x="([^"]*)"', match.group(0))
                y_match = re.search(r'y="([^"]*)"', match.group(0))
                font_match = re.search(r'font-size="([^"]*)"', match.group(0))

                texts.append({
                    'text': text_content,
                    'x': float(x_match.group(1)) if x_match else 0,
                    'y': float(y_match.group(1)) if y_match else 0,
                    'font_size': int(font_match.group(1)) if font_match else 16
                })

        return texts

    def extract_text_from_svg(self, svg_content: str) -> list[str]:
        """从SVG中提取所有文本"""
        texts = []

        # 匹配<text>标签内容
        text_pattern = r'<text[^>]*>([^<]*)</text>'
        for match in re.finditer(text_pattern, svg_content):
            text_content = match.group(1).strip()
            if text_content and len(text_content) > 1:
                texts.append(text_content)

        return texts

    def create_card_layout(
        self,
        title: str,
        content: list[str],
        theme_config: dict[str, Any]
    ) -> list[dict[str, Any]]:
        """创建卡片布局元素"""
        elements = []
        palette = theme_config.get('palette', {})

        # 卡片背景
        card_bg = self.create_shape_element(
            shape_type='rectangle',
            x=0.5,
            y=1.5,
            width=15,
            height=7,
            fill_color=palette.get('primary', '#165DFF'),
            opacity=0.9,
            corner_radius=0.3
        )
        elements.append(card_bg)

        # 标题
        title_elem = self.create_text_element(
            text=title,
            x=1,
            y=0.5,
            width=14,
            height=1,
            font_size=48,
            font_family=theme_config.get('fonts', {}).get('title', {}).get('family', '思源黑体'),
            color=palette.get('text', '#FFFFFF'),
            bold=True,
            align='center'
        )
        elements.append(title_elem)

        # 内容项
        y_offset = 2.5
        for item in content[:6]:  # 最多6项
            item_elem = self.create_text_element(
                text=f"• {item}",
                x=1.5,
                y=y_offset,
                width=13,
                height=0.8,
                font_size=24,
                font_family=theme_config.get('fonts', {}).get('content', {}).get('family', '思源宋体'),
                color=palette.get('text', '#FFFFFF'),
                align='left'
            )
            elements.append(item_elem)
            y_offset += 0.8

        return elements

    def create_two_column_layout(
        self,
        title: str,
        left_content: list[str],
        right_content: list[str],
        theme_config: dict[str, Any]
    ) -> list[dict[str, Any]]:
        """创建双栏布局元素"""
        elements = []
        palette = theme_config.get('palette', {})

        # 背景
        bg = self.create_shape_element(
            shape_type='rectangle',
            x=0,
            y=0,
            width=16,
            height=9,
            fill_color=palette.get('background', '#1A1A2E')
        )
        elements.append(bg)

        # 标题
        title_elem = self.create_text_element(
            text=title,
            x=0.5,
            y=0.3,
            width=15,
            height=1,
            font_size=44,
            color=palette.get('text', '#FFFFFF'),
            bold=True,
            align='center'
        )
        elements.append(title_elem)

        # 左侧内容
        y_offset = 1.8
        for item in left_content[:4]:
            item_elem = self.create_text_element(
                text=f"• {item}",
                x=0.5,
                y=y_offset,
                width=7,
                height=0.7,
                font_size=20,
                color=palette.get('text', '#FFFFFF')
            )
            elements.append(item_elem)
            y_offset += 0.8

        # 右侧内容
        y_offset = 1.8
        for item in right_content[:4]:
            item_elem = self.create_text_element(
                text=f"• {item}",
                x=8.5,
                y=y_offset,
                width=7,
                height=0.7,
                font_size=20,
                color=palette.get('text', '#FFFFFF')
            )
            elements.append(item_elem)
            y_offset += 0.8

        return elements


# 全局实例
_element_handler: ElementHandler | None = None
_manager_lock = threading.Lock()


def get_element_handler() -> ElementHandler:
    """获取元素处理器实例（线程安全）"""
    global _element_handler
    if _element_handler is None:
        with _manager_lock:
            if _element_handler is None:
                _element_handler = ElementHandler()
    return _element_handler
