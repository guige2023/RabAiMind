"""
SVG 渲染 Agent (SVG Agent)

负责将文本/图片转为 16:9 比例 SVG，兼容 mcp-server-okppt 规范
"""

import os
import re
import base64
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
from datetime import datetime

from volc_okppt_tools import PromptOptimizer


class SVGStyle(Enum):
    """SVG 风格"""
    PROFESSIONAL = "professional"
    CREATIVE = "creative"
    MINIMAL = "minimal"
    TECH = "tech"
    EDUCATION = "education"


@dataclass
class SVGConfig:
    """SVG 配置"""
    width: int = 1600
    height: int = 900
    viewbox: str = "0 0 1600 900"
    background_color: str = "#FFFFFF"
    font_family: str = "Microsoft YaHei, Arial, sans-serif"


class SVGBuilder:
    """SVG 构建器"""

    # 预设颜色方案
    COLOR_SCHEMES = {
        "professional": {
            "primary": "#2C3E50",
            "secondary": "#3498DB",
            "accent": "#E74C3C",
            "background": "#FFFFFF",
            "text": "#2C3E50",
            "subtext": "#7F8C8D"
        },
        "creative": {
            "primary": "#9B59B6",
            "secondary": "#F39C12",
            "accent": "#1ABC9C",
            "background": "#ECF0F1",
            "text": "#2C3E50",
            "subtext": "#95A5A6"
        },
        "minimal": {
            "primary": "#000000",
            "secondary": "#333333",
            "accent": "#666666",
            "background": "#FFFFFF",
            "text": "#000000",
            "subtext": "#666666"
        },
        "tech": {
            "primary": "#0D47A1",
            "secondary": "#1565C0",
            "accent": "#00BCD4",
            "background": "#FAFAFA",
            "text": "#212121",
            "subtext": "#757575"
        },
        "education": {
            "primary": "#1976D2",
            "secondary": "#4CAF50",
            "accent": "#FF9800",
            "background": "#FFFFFF",
            "text": "#212121",
            "subtext": "#757575"
        }
    }

    def __init__(self, config: Optional[SVGConfig] = None):
        self.config = config or SVGConfig()
        self.style = SVGStyle.PROFESSIONAL

    def set_style(self, style: SVGStyle):
        """设置风格"""
        self.style = style

    def get_colors(self) -> Dict[str, str]:
        """获取颜色方案"""
        return self.COLOR_SCHEMES.get(self.style.value, self.COLOR_SCHEMES["professional"])

    def build_title_slide(
        self,
        title: str,
        subtitle: Optional[str] = None,
        style: Optional[SVGStyle] = None
    ) -> str:
        """构建标题页 SVG - 专业设计版"""
        if style:
            self.set_style(style)

        colors = self.get_colors()
        width, height = self.config.width, self.config.height
        now_str = datetime.now().strftime("%Y-%m-%d")

        # 专业封面设计
        svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="{self.config.viewbox}" width="{width}" height="{height}">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:{colors['primary']};stop-opacity:1" />
      <stop offset="100%" style="stop-color:{colors['secondary']};stop-opacity:1" />
    </linearGradient>
    <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#FFFFFF;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#E8F4FD;stop-opacity:1" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- 背景 -->
  <rect width="{width}" height="{height}" fill="url(#bgGradient)" />

  <!-- 装饰性几何图形 -->
  <circle cx="1400" cy="200" r="300" fill="#FFFFFF" opacity="0.05" />
  <circle cx="200" cy="700" r="200" fill="#FFFFFF" opacity="0.05" />
  <polygon points="0,0 300,0 0,300" fill="#FFFFFF" opacity="0.03" />
  <polygon points="{width},{height} {width-300},{height} {width},{height-300}" fill="#FFFFFF" opacity="0.03" />

  <!-- 网格装饰 -->
  <g stroke="#FFFFFF" stroke-opacity="0.05" stroke-width="1">
    <line x1="0" y1="200" x2="{width}" y2="200" />
    <line x1="0" y1="400" x2="{width}" y2="400" />
    <line x1="0" y1="600" x2="{width}" y2="600" />
    <line x1="400" y1="0" x2="400" y2="{height}" />
    <line x1="800" y1="0" x2="800" y2="{height}" />
    <line x1="1200" y1="0" x2="1200" y2="{height}" />
  </g>

  <!-- 左侧装饰条 -->
  <rect x="0" y="0" width="12" height="{height}" fill="#FFFFFF" opacity="0.3" />

  <!-- 主标题 -->
  <text x="{width//2}" y="{height//2 - 30}"
        font-family="{self.config.font_family}"
        font-size="68"
        font-weight="bold"
        fill="url(#textGradient)"
        text-anchor="middle"
        filter="url(#glow)">{self._escape_xml(title)}</text>'''

        if subtitle:
            svg += f'''
  <!-- 副标题 -->
  <text x="{width//2}" y="{height//2 + 50}"
        font-family="{self.config.font_family}"
        font-size="28"
        fill="#FFFFFF"
        opacity="0.9"
        text-anchor="middle">{self._escape_xml(subtitle)}</text>'''

        # 添加底部信息
        svg += f'''
  <!-- 底部信息 -->
  <rect x="0" y="{height-80}" width="{width}" height="80" fill="#000000" opacity="0.1" />
  <text x="{width//2}" y="{height-45}"
        font-family="{self.config.font_family}"
        font-size="20"
        fill="#FFFFFF"
        opacity="0.7"
        text-anchor="middle">RabAi Mind · AI PPT 生成平台</text>
  <text x="{width//2}" y="{height-20}"
        font-family="{self.config.font_family}"
        font-size="14"
        fill="#FFFFFF"
        opacity="0.5"
        text-anchor="middle">{now_str}</text>
</svg>'''
        return svg

    def build_content_slide(
        self,
        title: str,
        content: List[str],
        style: Optional[SVGStyle] = None
    ) -> str:
        """构建内容页 SVG - 专业设计版"""
        if style:
            self.set_style(style)

        colors = self.get_colors()
        width, height = self.config.width, self.config.height

        svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="{self.config.viewbox}" width="{width}" height="{height}">
  <defs>
    <linearGradient id="headerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:{colors['primary']};stop-opacity:1" />
      <stop offset="100%" style="stop-color:{colors['secondary']};stop-opacity:1" />
    </linearGradient>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:{colors['background']};stop-opacity:1" />
      <stop offset="100%" style="stop-color:#F8F9FA;stop-opacity:1" />
    </linearGradient>
    <!-- 阴影滤镜 -->
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.15"/>
    </filter>
  </defs>

  <!-- 背景 -->
  <rect width="{width}" height="{height}" fill="url(#bgGradient)" />

  <!-- 装饰性背景元素 -->
  <circle cx="1500" cy="150" r="200" fill="{colors['secondary']}" opacity="0.05" />
  <circle cx="100" cy="800" r="150" fill="{colors['accent']}" opacity="0.05" />
  <rect x="0" y="850" width="{width}" height="50" fill="{colors['primary']}" opacity="0.03" />

  <!-- 顶部标题栏 -->
  <rect x="0" y="0" width="{width}" height="100" fill="url(#headerGradient)" />
  <rect x="0" y="95" width="{width}" height="5" fill="{colors['accent']}" />

  <!-- 标题 -->
  <text x="50" y="65"
        font-family="{self.config.font_family}"
        font-size="42"
        font-weight="bold"
        fill="#FFFFFF">{self._escape_xml(title)}</text>

  <!-- 左侧装饰线 -->
  <rect x="0" y="0" width="8" height="100" fill="{colors['accent']}" />

  <!-- 内容区域 - 卡片式设计 -->
  <g transform="translate(50, 140)">'''

        # 生成内容项 - 更丰富的设计
        item_height = 110
        accent_colors = [colors["primary"], colors["secondary"], colors["accent"], "#27AE60", "#8E44AD", "#E67E22"]

        for i, item in enumerate(content[:5]):  # 最多显示 5 项
            y_pos = i * item_height
            accent = accent_colors[i % len(accent_colors)]

            svg += f'''
    <!-- 卡片背景 -->
    <rect x="0" y="{y_pos}" width="1450" height="90" rx="10" fill="#FFFFFF" filter="url(#shadow)" />

    <!-- 左侧色条 -->
    <rect x="0" y="{y_pos}" width="8" height="90" rx="0" fill="{accent}" />

    <!-- 数字标识 -->
    <circle cx="50" cy="{y_pos + 45}" r="25" fill="{accent}" opacity="0.1" />
    <text x="50" y="{y_pos + 55}"
          font-family="{self.config.font_family}"
          font-size="24"
          font-weight="bold"
          fill="{accent}"
          text-anchor="middle">{i+1}</text>

    <!-- 内容文字 -->
    <text x="100" y="{y_pos + 45}"
          font-family="{self.config.font_family}"
          font-size="26"
          font-weight="500"
          fill="{colors['text']}">{self._escape_xml(item[:60] if len(item) > 60 else item)}</text>

    <!-- 简短说明 -->
    <text x="100" y="{y_pos + 75}"
          font-family="{self.config.font_family}"
          font-size="18"
          fill="{colors['subtext']}">点击查看详细说明 →</text>'''

        svg += f'''
  </g>

  <!-- 页脚 -->
  <text x="50" y="870"
        font-family="{self.config.font_family}"
        font-size="14"
        fill="{colors['subtext']}">RabAi Mind · AI PPT 生成平台</text>
</svg>'''
        return svg

    def build_chart_slide(
        self,
        title: str,
        data: Dict[str, float],
        style: Optional[SVGStyle] = None
    ) -> str:
        """构建图表页 SVG"""
        if style:
            self.set_style(style)

        colors = self.get_colors()
        width, height = self.config.width, self.config.height

        # 绘制简单的柱状图
        max_value = max(data.values()) if data else 1
        chart_width = 1000
        chart_height = 400
        chart_x = 100
        chart_y = 200
        bar_width = chart_width // max(len(data), 1) - 40
        gap = 40

        svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="{self.config.viewbox}" width="{width}" height="{height}">
  <defs>
    <linearGradient id="headerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:{colors['primary']};stop-opacity:1" />
      <stop offset="100%" style="stop-color:{colors['secondary']};stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- 背景 -->
  <rect width="{width}" height="{height}" fill="{colors['background']}" />

  <!-- 标题栏 -->
  <rect x="0" y="0" width="{width}" height="120" fill="url(#headerGradient)" />
  <text x="60" y="80"
        font-family="{self.config.font_family}"
        font-size="48"
        font-weight="bold"
        fill="#FFFFFF">{self._escape_xml(title)}</text>

  <!-- 图表区域 -->
  <g transform="translate({chart_x}, {chart_y})">'''

        # 绘制柱状图
        bar_colors = [colors["primary"], colors["secondary"], colors["accent"], "#27AE60", "#8E44AD"]
        for i, (label, value) in enumerate(data.items()):
            bar_h = (value / max_value) * chart_height
            x = i * (bar_width + gap)
            y = chart_height - bar_h

            svg += f'''
    <!-- 柱子 -->
    <rect x="{x}" y="{y}" width="{bar_width}" height="{bar_h}" fill="{bar_colors[i % len(bar_colors)]}" rx="4" />

    <!-- 标签 -->
    <text x="{x + bar_width//2}" y="{chart_height + 30}"
          font-family="{self.config.font_family}"
          font-size="20"
          fill="{colors['subtext']}"
          text-anchor="middle">{self._escape_xml(label)}</text>

    <!-- 数值 -->
    <text x="{x + bar_width//2}" y="{y - 10}"
          font-family="{self.config.font_family}"
          font-size="18"
          fill="{colors['text']}"
          text-anchor="middle">{value}</text>'''

        svg += '''
  </g>
</svg>'''
        return svg

    def build_quote_slide(
        self,
        quote: str,
        author: Optional[str] = None,
        style: Optional[SVGStyle] = None
    ) -> str:
        """构建引用页 SVG"""
        if style:
            self.set_style(style)

        colors = self.get_colors()
        width, height = self.config.width, self.config.height

        svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="{self.config.viewbox}" width="{width}" height="{height}">
  <!-- 背景 -->
  <rect width="{width}" height="{height}" fill="{colors['background']}" />

  <!-- 装饰 -->
  <text x="100" y="200"
        font-family="serif"
        font-size="200"
        fill="{colors['secondary']}"
        opacity="0.1">"</text>

  <!-- 引用内容 -->
  <text x="{width//2}" y="{height//2 - 50}"
        font-family="{self.config.font_family}"
        font-size="48"
        font-style="italic"
        fill="{colors['text']}"
        text-anchor="middle">{self._escape_xml(quote)}</text>'''

        if author:
            svg += f'''
  <!-- 作者 -->
  <text x="{width//2}" y="{height//2 + 50}"
        font-family="{self.config.font_family}"
        font-size="28"
        fill="{colors['subtext']}"
        text-anchor="middle">— {self._escape_xml(author)}</text>'''

        svg += '''
</svg>'''
        return svg

    def build_thank_you_slide(
        self,
        title: str = "感谢聆听",
        contact: Optional[str] = None,
        style: Optional[SVGStyle] = None
    ) -> str:
        """构建结束页 SVG"""
        if style:
            self.set_style(style)

        colors = self.get_colors()
        width, height = self.config.width, self.config.height

        svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="{self.config.viewbox}" width="{width}" height="{height}">
  <defs>
    <radialGradient id="bgRadial" cx="50%" cy="50%" r="70%">
      <stop offset="0%" style="stop-color:{colors['secondary']};stop-opacity:0.1" />
      <stop offset="100%" style="stop-color:{colors['background']};stop-opacity:1" />
    </radialGradient>
  </defs>

  <!-- 背景 -->
  <rect width="{width}" height="{height}" fill="url(#bgRadial)" />

  <!-- 装饰圆 -->
  <circle cx="{width//2}" cy="{height//2}" r="200" fill="none" stroke="{colors['primary']}" stroke-width="2" opacity="0.1" />
  <circle cx="{width//2}" cy="{height//2}" r="150" fill="none" stroke="{colors['secondary']}" stroke-width="2" opacity="0.15" />

  <!-- 标题 -->
  <text x="{width//2}" y="{height//2}"
        font-family="{self.config.font_family}"
        font-size="80"
        font-weight="bold"
        fill="{colors['primary']}"
        text-anchor="middle">{self._escape_xml(title)}</text>'''

        if contact:
            svg += f'''
  <!-- 联系方式 -->
  <text x="{width//2}" y="{height//2 + 80}"
        font-family="{self.config.font_family}"
        font-size="24"
        fill="{colors['subtext']}"
        text-anchor="middle">{self._escape_xml(contact)}</text>'''

        svg += '''
</svg>'''
        return svg

    def _escape_xml(self, text: str) -> str:
        """转义 XML 特殊字符"""
        return (text
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace('"', "&quot;")
            .replace("'", "&apos;"))


class SVGAgent:
    """
    SVG 渲染 Agent

    负责:
    - 将文本/图片转为 16:9 比例 SVG
    - 兼容 mcp-server-okppt 规范
    - SVG viewBox: 0 0 1600 900
    """

    SLIDE_TYPE_BUILDER = {
        "title_slide": SVGBuilder.build_title_slide,
        "outline": SVGBuilder.build_content_slide,
        "content": SVGBuilder.build_content_slide,
        "chart": SVGBuilder.build_chart_slide,
        "image": SVGBuilder.build_content_slide,
        "quote": SVGBuilder.build_quote_slide,
        "summary": SVGBuilder.build_content_slide,
        "thank_you": SVGBuilder.build_thank_you_slide
    }

    def __init__(self, config: Optional[Dict] = None):
        self.config = config or {}
        self.builder = SVGBuilder()
        self.output_dir = self.config.get("output_dir", "./output")

    def render_slide(
        self,
        slide: Dict[str, Any],
        style: Optional[SVGStyle] = None
    ) -> str:
        """
        渲染单页幻灯片为 SVG

        Args:
            slide: 幻灯片数据
            style: SVG 风格

        Returns:
            SVG 内容
        """
        slide_type = slide.get("type", "content")
        title = slide.get("title", "")
        content = slide.get("content", [])
        generated_content = slide.get("generated_content", "")

        # 解析内容
        if isinstance(content, str):
            content = [line.strip() for line in content.split("\n") if line.strip()]
        elif isinstance(generated_content, str) and not content:
            # 使用生成的内容
            content = [line.strip() for line in generated_content.split("\n") if line.strip()]

        # 选择构建器
        builder_method = self.SLIDE_TYPE_BUILDER.get(
            slide_type,
            self.SLIDE_TYPE_BUILDER["content"]
        )

        # 调用对应的构建方法
        if slide_type == "title_slide":
            return builder_method(self.builder, title, content[0] if content else None, style)
        elif slide_type == "chart":
            # 处理图表数据
            chart_data = self._parse_chart_data(content)
            return builder_method(self.builder, title, chart_data, style)
        elif slide_type == "quote":
            return builder_method(self.builder, title, content[0] if content else "", content[1] if len(content) > 1 else None, style)
        elif slide_type == "thank_you":
            return builder_method(self.builder, title, content[0] if content else None, style)
        else:
            return builder_method(self.builder, title, content, style)

    def render_slides(
        self,
        slides: List[Dict[str, Any]],
        style: Optional[SVGStyle] = None
    ) -> List[Dict[str, Any]]:
        """
        批量渲染幻灯片

        Args:
            slides: 幻灯片列表
            style: SVG 风格

        Returns:
            包含 SVG 的幻灯片列表
        """
        rendered = []

        for i, slide in enumerate(slides):
            svg_content = self.render_slide(slide, style)

            # 保存到文件
            output_path = os.path.join(self.output_dir, f"slide_{i+1}.svg")
            os.makedirs(self.output_dir, exist_ok=True)

            with open(output_path, "w", encoding="utf-8") as f:
                f.write(svg_content)

            rendered.append({
                **slide,
                "svg_path": output_path,
                "svg_content": svg_content
            })

        return rendered

    def save_svg(self, svg_content: str, output_path: str) -> str:
        """保存 SVG 到文件"""
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        with open(output_path, "w", encoding="utf-8") as f:
            f.write(svg_content)

        return output_path

    def _parse_chart_data(self, content: List[str]) -> Dict[str, float]:
        """解析图表数据"""
        data = {}
        for item in content:
            # 尝试提取标签和数值
            # 格式: "标签: 数值" 或 "标签 数值"
            parts = item.replace(":", " ").split()
            if len(parts) >= 2:
                label = parts[0]
                try:
                    value = float(parts[-1])
                    data[label] = value
                except ValueError:
                    pass

        # 如果无法解析，返回默认数据
        if not data:
            data = {"项目A": 30, "项目B": 45, "项目C": 25}

        return data


def create_svg_agent(config: Optional[Dict] = None) -> SVGAgent:
    """创建 SVG Agent"""
    return SVGAgent(config)
