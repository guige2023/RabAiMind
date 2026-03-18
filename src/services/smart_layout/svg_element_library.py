# -*- coding: utf-8 -*-
"""
SVG 视觉元素库

提供装饰元素、图标等SVG基础元素

作者: Claude
日期: 2026-03-18
"""

from typing import Dict, Any, Optional
import math


class SVGElementLibrary:
    """SVG 视觉元素库"""

    # 画布尺寸
    CANVAS_WIDTH = 1600
    CANVAS_HEIGHT = 900

    # 装饰元素模板
    DECORATIVE_ELEMENTS = {
        "dots_pattern": {
            "name": "点阵图案",
            "template": """
            <defs>
                <pattern id="dots" width="{size}" height="{size}" patternUnits="userSpaceOnUse">
                    <circle cx="{cx}" cy="{cy}" r="{radius}" fill="{color}" opacity="{opacity}"/>
                </pattern>
            </defs>
            <rect width="{width}" height="{height}" fill="url(#dots)"/>
            """,
            "default_params": {"size": 20, "radius": 1.5, "opacity": 0.3, "cx": 10, "cy": 10}
        },

        "gradient_bg": {
            "name": "渐变背景",
            "template": """
            <defs>
                <linearGradient id="bgGradient" x1="{x1}%" y1="{y1}%" x2="{x2}%" y2="{y2}%">
                    <stop offset="0%" style="stop-color:{start_color};stop-opacity:1" />
                    <stop offset="100%" style="stop-color:{end_color};stop-opacity:1" />
                </linearGradient>
            </defs>
            <rect width="{width}" height="{height}" fill="url(#bgGradient)"/>
            """,
            "default_params": {"x1": 0, "y1": 0, "x2": 100, "y2": 100}
        },

        "corner_accent": {
            "name": "角落装饰",
            "template": """
            <path d="M0,0 L{size},0 L0,{size} Z" fill="{color}" opacity="{opacity}"/>
            <path d="M{width},{height} L{width_minus_size},{height} L{width},{height_minus_size} Z" fill="{color}" opacity="{opacity}"/>
            """,
            "default_params": {"size": 200, "opacity": 0.1, "width_minus_size": 1400, "height_minus_size": 700}
        },

        "wave_decoration": {
            "name": "波浪装饰",
            "template": """
            <path d="M0,{y1} Q{qx1},{y2} {qx2},{y1} T{width},{y1} L{width},{height} L0,{height} Z"
                  fill="{color}" opacity="{opacity}"/>
            """,
            "default_params": {"y1": 800, "y2": 750, "opacity": 0.1, "qx1": 400, "qx2": 800}
        },

        "geometric_shapes": {
            "name": "几何图形装饰",
            "template": """
            <circle cx="{cx1}" cy="{cy1}" r="{r1}" fill="{color}" opacity="{opacity}"/>
            <rect x="{x2}" y="{y2}" width="{size}" height="{size}" rx="{rx}"
                  fill="{color}" opacity="{opacity}" transform="rotate({angle} {rotate_cx} {rotate_cy})"/>
            """,
            "default_params": {"cx1": 150, "cy1": 150, "r1": 80, "x2": 1350, "y2": 650, "size": 150, "rx": 20, "angle": 15, "opacity": 0.1, "rotate_cx": 1425, "rotate_cy": 725}
        },

        "radial_gradient": {
            "name": "径向渐变",
            "template": """
            <defs>
                <radialGradient id="radialGrad" cx="{cx}%" cy="{cy}%" r="{r}%">
                    <stop offset="0%" style="stop-color:{center_color};stop-opacity:1" />
                    <stop offset="100%" style="stop-color:{edge_color};stop-opacity:0" />
                </radialGradient>
            </defs>
            <circle cx="{center_x}" cy="{center_y}" r="{max_radius}" fill="url(#radialGrad)"/>
            """,
            "default_params": {"cx": 50, "cy": 50, "r": 80, "center_x": 800, "center_y": 450, "max_radius": 600}
        },

        "grid_pattern": {
            "name": "网格图案",
            "template": """
            <defs>
                <pattern id="grid" width="{size}" height="{size}" patternUnits="userSpaceOnUse">
                    <path d="M {size} 0 L 0 0 0 {size}" fill="none" stroke="{color}" stroke-width="{stroke_width}" opacity="{opacity}"/>
                </pattern>
            </defs>
            <rect width="{width}" height="{height}" fill="url(#grid)"/>
            """,
            "default_params": {"size": 40, "stroke_width": 0.5, "opacity": 0.1}
        },

        "diagonal_lines": {
            "name": "对角线条纹",
            "template": """
            <defs>
                <pattern id="diagonal" width="{size}" height="{size}" patternUnits="userSpaceOnUse" patternTransform="rotate({angle})">
                    <line x1="0" y1="0" x2="0" y2="{size}" stroke="{color}" stroke-width="{stroke_width}" opacity="{opacity}"/>
                </pattern>
            </defs>
            <rect width="{width}" height="{height}" fill="url(#diagonal)"/>
            """,
            "default_params": {"size": 10, "stroke_width": 1, "opacity": 0.1, "angle": 45}
        }
    }

    # 图标库 (24x24 viewBox)
    ICONS = {
        # 商务类
        "chart": {
            "name": "图表",
            "svg": '''<svg viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="12" width="4" height="9" rx="1"/>
                <rect x="10" y="8" width="4" height="13" rx="1"/>
                <rect x="17" y="4" width="4" height="17" rx="1"/>
            </svg>'''
        },
        "target": {
            "name": "目标",
            "svg": '''<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="12" r="6"/>
                <circle cx="12" cy="12" r="2"/>
            </svg>'''
        },
        "lightbulb": {
            "name": "灯泡/创意",
            "svg": '''<svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7z"/>
                <rect x="9" y="19" width="6" height="2" rx="1"/>
                <rect x="10" y="22" width="4" height="1" rx="0.5"/>
            </svg>'''
        },
        "rocket": {
            "name": "火箭/发展",
            "svg": '''<svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.5c-2.5 0-4.5 2-4.5 4.5 0 1.5.7 2.8 1.8 3.7L8 22h8l-1.3-11.3c1.1-.9 1.8-2.2 1.8-3.7 0-2.5-2-4.5-4.5-4.5z"/>
                <path d="M9 16l2 2 4-4" stroke="currentColor" stroke-width="2" fill="none"/>
            </svg>'''
        },
        "users": {
            "name": "用户/团队",
            "svg": '''<svg viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="7" r="4"/>
                <path d="M4 21v-2c0-2.2 3.6-4 8-4s8 1.8 8 4v2"/>
            </svg>'''
        },
        "star": {
            "name": "星星/特色",
            "svg": '''<svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>'''
        },
        "check": {
            "name": "checkmark/完成",
            "svg": '''<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 6L9 17l-5-5"/>
            </svg>'''
        },
        "calendar": {
            "name": "日历/时间",
            "svg": '''<svg viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <path d="M3 10h18M8 2v4M16 2v4" stroke="currentColor" stroke-width="2" fill="none"/>
            </svg>'''
        },
        "clock": {
            "name": "时钟",
            "svg": '''<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
            </svg>'''
        },
        "trend": {
            "name": "趋势/上升",
            "svg": '''<svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 20l5-10 4 4 7-8v14H3z"/>
            </svg>'''
        },
        "settings": {
            "name": "设置",
            "svg": '''<svg viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>'''
        },
        "globe": {
            "name": "地球/全球",
            "svg": '''<svg viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10"/>
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>'''
        },
        "shield": {
            "name": "盾牌/安全",
            "svg": '''<svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>'''
        },
        "database": {
            "name": "数据库/数据",
            "svg": '''<svg viewBox="0 0 24 24" fill="currentColor">
                <ellipse cx="12" cy="5" rx="9" ry="3"/>
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
            </svg>'''
        },
        "cloud": {
            "name": "云/云计算",
            "svg": '''<svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
            </svg>'''
        },
        "brain": {
            "name": "大脑/AI",
            "svg": '''<svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2a9 9 0 0 0-9 9c0 4.17 2.84 7.67 6.69 8.69L12 22l2.31-2.31C18.16 18.67 21 15.17 21 11a9 9 0 0 0-9-9z"/>
                <path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" fill="none"/>
            </svg>'''
        },
        "gear": {
            "name": "齿轮/技术",
            "svg": '''<svg viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>'''
        }
    }

    @classmethod
    def generate_decorative_element(
        cls,
        element_type: str,
        color: str = "#165DFF",
        width: int = None,
        height: int = None,
        **kwargs
    ) -> str:
        """生成装饰元素"""
        width = width or cls.CANVAS_WIDTH
        height = height or cls.CANVAS_HEIGHT

        element = cls.DECORATIVE_ELEMENTS.get(element_type)
        if not element:
            return ""

        params = {**element["default_params"], **kwargs, "color": color, "width": width, "height": height}

        # 计算需要动态计算的参数
        if "size" in params:
            params["cx"] = params["size"] // 2
            params["cy"] = params["size"] // 2

        # 计算 width-size 和 height-size
        if "size" in params:
            params["width_minus_size"] = width - params["size"]
            params["height_minus_size"] = height - params["size"]

        # 计算波浪曲线的控制点
        if "y1" in params:
            params["qx1"] = width // 4
            params["qx2"] = width // 2

        # 计算几何图形旋转中心
        if "x2" in params and "y2" in params and "size" in params:
            params["rotate_cx"] = params["x2"] + params["size"] // 2
            params["rotate_cy"] = params["y2"] + params["size"] // 2

        # 计算径向渐变的中心点和半径
        if "radial" in element_type or "center_x" not in params:
            params["center_x"] = width // 2
            params["center_y"] = height // 2
            params["max_radius"] = max(width, height)

        return element["template"].format(**params)

    @classmethod
    def get_icon(cls, icon_name: str) -> Optional[str]:
        """获取图标SVG"""
        icon = cls.ICONS.get(icon_name)
        return icon["svg"] if icon else None

    @classmethod
    def get_all_icons(cls) -> Dict[str, str]:
        """获取所有图标"""
        return {name: icon["svg"] for name, icon in cls.ICONS.items()}

    @classmethod
    def get_icon_names(cls) -> list:
        """获取所有图标名称"""
        return list(cls.ICONS.keys())


# 单例实例
_svg_element_library_instance: Optional[SVGElementLibrary] = None


def get_svg_element_library() -> SVGElementLibrary:
    """获取SVG元素库单例"""
    global _svg_element_library_instance
    if _svg_element_library_instance is None:
        _svg_element_library_instance = SVGElementLibrary()
    return _svg_element_library_instance
