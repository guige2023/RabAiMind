"""
主题管理器 - 处理主题配色和字体

负责：
1. 主题色生成和管理
2. 字体配置
3. 配色方案生成
4. 颜色工具函数

作者: Claude
日期: 2026-03-20
"""

import logging
import re
import threading
from typing import Any

logger = logging.getLogger(__name__)


class ThemeManager:
    """主题管理器"""

    # 预定义主题色
    DEFAULT_THEME_COLORS = {
        '#165DFF': {
            'name': '科技蓝',
            'light': '#5095E8',
            'dark': '#0D47A1',
            'gradient': ['#165DFF', '#4B7CF3']
        },
        '#34C759': {
            'name': '自然绿',
            'light': '#5DD67A',
            'dark': '#1B5E20',
            'gradient': ['#34C759', '#66BB6A']
        },
        '#FF9500': {
            'name': '活力橙',
            'light': '#FFB84D',
            'dark': '#E65100',
            'gradient': ['#FF9500', '#FFB74D']
        },
        '#FF3B30': {
            'name': '热情红',
            'light': '#FF6B6B',
            'dark': '#B71C1C',
            'gradient': ['#FF3B30', '#EF5350']
        }
    }

    # 字体配置
    DEFAULT_FONTS = {
        'title': {
            'family': '思源黑体',
            'size': 56,
            'bold': True,
            'color': '#FFFFFF'
        },
        'subtitle': {
            'family': '思源黑体',
            'size': 40,
            'bold': True,
            'color': '#FFFFFF'
        },
        'content': {
            'family': '思源宋体',
            'size': 24,
            'bold': False,
            'color': '#FFFFFF'
        },
        'caption': {
            'family': '思源黑体',
            'size': 16,
            'bold': False,
            'color': '#CCCCCC'
        }
    }

    # 风格配色方案
    STYLE_PALETTES = {
        'professional': {
            'primary': '#165DFF',
            'secondary': '#5095E8',
            'background': '#1A1A2E',
            'text': '#FFFFFF',
            'accent': '#00D4FF'
        },
        'simple': {
            'primary': '#34C759',
            'secondary': '#5DD67A',
            'background': '#FFFFFF',
            'text': '#333333',
            'accent': '#00B96B'
        },
        'energetic': {
            'primary': '#FF9500',
            'secondary': '#FFB84D',
            'background': '#1A1A2E',
            'text': '#FFFFFF',
            'accent': '#FFD60A'
        },
        'premium': {
            'primary': '#FFD700',
            'secondary': '#D4AF37',
            'background': '#0D0D0D',
            'text': '#FFFFFF',
            'accent': '#FF6B6B'
        },
        'tech': {
            'primary': '#00D4FF',
            'secondary': '#00B4D8',
            'background': '#0F0C29',
            'text': '#FFFFFF',
            'accent': '#FF00FF'
        },
        'creative': {
            'primary': '#FF6B6B',
            'secondary': '#FF8E8E',
            'background': '#2D1B69',
            'text': '#FFFFFF',
            'accent': '#F093FB'
        },
        'nature': {
            'primary': '#56AB2F',
            'secondary': '#A8E063',
            'background': '#E8F5E9',
            'text': '#1B5E20',
            'accent': '#4CAF50'
        },
        'elegant': {
            'primary': '#667EEA',
            'secondary': '#764BA2',
            'background': '#FAFAFA',
            'text': '#333333',
            'accent': '#F093FB'
        },
        'playful': {
            'primary': '#FF6B6B',
            'secondary': '#4ECDC4',
            'background': '#FFE66D',
            'text': '#333333',
            'accent': '#FF8E53'
        },
        'minimalist': {
            'primary': '#333333',
            'secondary': '#666666',
            'background': '#FFFFFF',
            'text': '#333333',
            'accent': '#000000'
        }
    }

    def __init__(self):
        """初始化主题管理器"""
        self.current_theme = 'professional'
        self.current_color = '#165DFF'

    def set_theme(self, style: str, theme_color: str = '#165DFF') -> dict[str, Any]:
        """设置当前主题"""
        self.current_theme = style
        self.current_color = theme_color
        return self.get_theme_config()

    def get_theme_config(self) -> dict[str, Any]:
        """获取当前主题配置"""
        palette = self.STYLE_PALETTES.get(self.current_theme, self.STYLE_PALETTES['professional'])

        return {
            'style': self.current_theme,
            'theme_color': self.current_color,
            'palette': palette,
            'fonts': self.DEFAULT_FONTS.copy()
        }

    def generate_color_palette(self, style: str, base_color: str = None) -> dict[str, str]:
        """根据风格生成配色方案

        Args:
            style: 风格类型
            base_color: 基础颜色（可选）

        Returns:
            配色字典
        """
        if base_color:
            # 基于基础颜色生成配色
            return self._generate_from_base_color(base_color)

        # 使用预定义配色
        palette = self.STYLE_PALETTES.get(style, self.STYLE_PALETTES['professional'])
        return palette.copy()

    def _generate_from_base_color(self, base_color: str) -> dict[str, str]:
        """从基础颜色生成配色方案"""
        # 解析基础颜色
        rgb = self._hex_to_rgb(base_color)

        # 生成同色系渐变
        light_color = self._adjust_brightness(rgb, 30)
        dark_color = self._adjust_brightness(rgb, -30)

        return {
            'primary': base_color,
            'secondary': self._rgb_to_hex(light_color),
            'background': self._rgb_to_hex(dark_color),
            'text': '#FFFFFF',
            'accent': base_color
        }

    def get_font_config(
        self,
        font_title: str = '思源黑体',
        font_subtitle: str = '思源黑体',
        font_content: str = '思源宋体',
        font_caption: str = '思源黑体'
    ) -> dict[str, dict[str, Any]]:
        """获取字体配置"""
        fonts = self.DEFAULT_FONTS.copy()
        fonts['title']['family'] = font_title
        fonts['subtitle']['family'] = font_subtitle
        fonts['content']['family'] = font_content
        fonts['caption']['family'] = font_caption
        return fonts

    def get_text_style_config(self, text_style: str, shadow_color: str = '#000000',
                             overlay_transparency: int = 30) -> dict[str, Any]:
        """获取文字样式配置

        Args:
            text_style: 文字样式类型
            shadow_color: 阴影颜色
            overlay_transparency: 遮罩透明度

        Returns:
            文字样式配置字典
        """
        styles = {
            'transparent_overlay': {
                'overlay': True,
                'opacity': overlay_transparency / 100.0,
                'overlay_color': '#000000',
                'shadow': False,
                'glow': False
            },
            'shadow': {
                'overlay': False,
                'shadow': True,
                'shadow_color': shadow_color,
                'shadow_blur': 4,
                'shadow_offset': 2,
                'glow': False
            },
            'glow': {
                'overlay': False,
                'shadow': False,
                'glow': True,
                'glow_color': '#00D4FF',
                'glow_blur': 10,
                'glow_intensity': 0.8
            },
            'outline': {
                'overlay': False,
                'shadow': False,
                'glow': False,
                'outline': True,
                'outline_color': '#FFFFFF',
                'outline_width': 2
            },
            'gradient': {
                'overlay': False,
                'shadow': False,
                'glow': False,
                'gradient': True,
                'gradient_colors': ['#FF6B6B', '#4ECDC4']
            },
            'neon': {
                'overlay': False,
                'shadow': False,
                'glow': True,
                'glow_color': '#FF00FF',
                'glow_blur': 15,
                'glow_intensity': 1.0,
                'neon_effect': True
            }
        }

        return styles.get(text_style, styles['transparent_overlay'])

    def _hex_to_rgb(self, hex_color: str) -> tuple:
        """Hex颜色转RGB（验证输入）"""
        hex_color = hex_color.lstrip('#')
        # 验证格式：必须是6个十六进制字符
        if not re.match(r'^[0-9A-Fa-f]{6}$', hex_color):
            raise ValueError(f"无效的十六进制颜色: #{hex_color}")
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

    def _rgb_to_hex(self, rgb: tuple) -> str:
        """RGB转Hex颜色"""
        return f'#{max(0, min(255, rgb[0])):02x}{max(0, min(255, rgb[1])):02x}{max(0, min(255, rgb[2])):02x}'

    def _adjust_brightness(self, rgb: tuple, adjustment: int) -> tuple:
        """调整颜色亮度"""
        return tuple(max(0, min(255, c + adjustment)) for c in rgb)

    def get_contrast_color(self, bg_color: str) -> str:
        """获取背景色的对比色（用于文字）"""
        rgb = self._hex_to_rgb(bg_color)
        # 计算亮度
        luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255
        return '#000000' if luminance > 0.5 else '#FFFFFF'

    def parse_color_from_css(self, css: str) -> str | None:
        """从CSS中解析颜色"""
        # 匹配hex颜色
        hex_match = re.search(r'#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})', css)
        if hex_match:
            return '#' + hex_match.group(1).lower()

        # 匹配rgb/rgba
        rgb_match = re.search(r'rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)', css)
        if rgb_match:
            r, g, b = int(rgb_match.group(1)), int(rgb_match.group(2)), int(rgb_match.group(3))
            return self._rgb_to_hex((r, g, b))

        return None


# 全局实例
_theme_manager: ThemeManager | None = None
_manager_lock = threading.Lock()  # 保护单例创建


def get_theme_manager() -> ThemeManager:
    """获取主题管理器实例（线程安全）"""
    global _theme_manager
    if _theme_manager is None:
        with _manager_lock:
            # 双重检查
            if _theme_manager is None:
                _theme_manager = ThemeManager()
    return _theme_manager
