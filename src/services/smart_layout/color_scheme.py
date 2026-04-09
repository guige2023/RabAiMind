"""
配色方案生成模块

定义风格化配色库和动态配色生成

作者: Claude
日期: 2026-03-18
"""

import threading
from dataclasses import dataclass


@dataclass
class ColorPalette:
    """配色方案"""
    name: str
    primary: str          # 主色
    secondary: str        # 辅助色
    accent: str           # 强调色
    background: str       # 背景色
    text: str             # 主文字色
    text_secondary: str   # 次要文字色
    card_bg: str          # 卡片背景
    border: str           # 边框色


class ColorSchemeGenerator:
    """配色方案生成器"""

    # 风格化配色库
    STYLE_PALETTES = {
        "professional": {
            "name": "专业商务",
            "primary": "#165DFF",
            "secondary": "#364FC7",
            "accent": "#FF7D00",
            "background": "#FFFFFF",
            "text": "#1D2129",
            "text_secondary": "#4E5969",
            "card_bg": "#F7F8FA",
            "border": "#E5E6EB"
        },
        "creative": {
            "name": "创意活力",
            "primary": "#722ED1",
            "secondary": "#EB2F96",
            "accent": "#13C2C2",
            "background": "#FAFAFA",
            "text": "#1D2129",
            "text_secondary": "#4E5969",
            "card_bg": "#FFFFFF",
            "border": "#E5E6EB"
        },
        "simple": {
            "name": "简约现代",
            "primary": "#1D2129",
            "secondary": "#4E5969",
            "accent": "#165DFF",
            "background": "#FFFFFF",
            "text": "#1D2129",
            "text_secondary": "#86909C",
            "card_bg": "#F7F8FA",
            "border": "#E5E6EB"
        },
        "tech": {
            "name": "科技未来",
            "primary": "#00B96B",
            "secondary": "#165DFF",
            "accent": "#FF7D00",
            "background": "#000000",
            "text": "#FFFFFF",
            "text_secondary": "#86909C",
            "card_bg": "#1A1A1A",
            "border": "#333333"
        },
        "premium": {
            "name": "高端大气",
            "primary": "#C6A87C",
            "secondary": "#8B7355",
            "accent": "#D4AF37",
            "background": "#1A1A1A",
            "text": "#FFFFFF",
            "text_secondary": "#B0B0B0",
            "card_bg": "#2A2A2A",
            "border": "#404040"
        },
        "nature": {
            "name": "自然清新",
            "primary": "#34C759",
            "secondary": "#30D158",
            "accent": "#FF9500",
            "background": "#F5F5F0",
            "text": "#1D2129",
            "text_secondary": "#4E5969",
            "card_bg": "#FFFFFF",
            "border": "#E5E6EB"
        },
        "energetic": {
            "name": "活力动感",
            "primary": "#FF3B30",
            "secondary": "#FF9500",
            "accent": "#FFCC00",
            "background": "#FFFFFF",
            "text": "#1D2129",
            "text_secondary": "#4E5969",
            "card_bg": "#FFF5F5",
            "border": "#FFE5E5"
        },
        "elegant": {
            "name": "优雅知性",
            "primary": "#AF52DE",
            "secondary": "#5E5CE6",
            "accent": "#BF5AF2",
            "background": "#FAFAFA",
            "text": "#1D2129",
            "text_secondary": "#4E5969",
            "card_bg": "#FFFFFF",
            "border": "#E8E8F0"
        }
    }

    # 主题色映射（用于从用户选择的主题色生成配色）
    THEME_COLOR_PALETTES = {
        "#165DFF": {  # 科技蓝
            "primary": "#165DFF",
            "secondary": "#0E42D2",
            "accent": "#FF7D00"
        },
        "#34C759": {  # 自然绿
            "primary": "#34C759",
            "secondary": "#2AAD4A",
            "accent": "#FF9500"
        },
        "#FF9500": {  # 活力橙
            "primary": "#FF9500",
            "secondary": "#E68500",
            "accent": "#FF3B30"
        },
        "#FF3B30": {  # 热情红
            "primary": "#FF3B30",
            "secondary": "#E62E21",
            "accent": "#165DFF"
        },
        "#AF52DE": {  # 神秘紫
            "primary": "#AF52DE",
            "secondary": "#9B3BC7",
            "accent": "#FF2F55"
        },
        "#1A1A1A": {  # 经典黑
            "primary": "#1A1A1A",
            "secondary": "#333333",
            "accent": "#165DFF"
        },
        "#5856D6": {  # 暗夜紫
            "primary": "#5856D6",
            "secondary": "#4644CD",
            "accent": "#FF9500"
        },
        "#00B96B": {  # 清新薄荷
            "primary": "#00B96B",
            "secondary": "#00A85F",
            "accent": "#64D2FF"
        },
        "#FF2D55": {  # 玫瑰粉
            "primary": "#FF2D55",
            "secondary": "#E6284D",
            "accent": "#FFD60A"
        },
        "#FFD60A": {  # 阳光黄
            "primary": "#FFD60A",
            "secondary": "#E6C209",
            "accent": "#FF3B30"
        },
        "#64D2FF": {  # 天空蓝
            "primary": "#64D2FF",
            "secondary": "#5AC8FA",
            "accent": "#FF9500"
        },
        "#BF5AF2": {  # 荧光紫
            "primary": "#BF5AF2",
            "secondary": "#AF4FD8",
            "accent": "#FF2D55"
        }
    }

    def __init__(self):
        """初始化配色生成器"""
        self.current_palette: ColorPalette | None = None

    def get_palette(self, style: str) -> ColorPalette:
        """
        获取指定风格的配色方案

        Args:
            style: 风格名称 ("professional", "creative", "simple", "tech", "premium", "nature", "energetic", "elegant")

        Returns:
            ColorPalette 对象
        """
        palette_data = self.STYLE_PALETTES.get(style, self.STYLE_PALETTES["professional"])
        return ColorPalette(**palette_data)

    def get_palette_from_theme_color(self, theme_color: str, style: str = "professional") -> ColorPalette:
        """
        根据用户选择的主题色生成配色方案

        Args:
            theme_color: 用户选择的主题色（十六进制）
            style: 基础风格

        Returns:
            ColorPalette 对象
        """
        # 获取风格基础配置
        base_palette = self.STYLE_PALETTES.get(style, self.STYLE_PALETTES["professional"]).copy()

        # 根据主题色调整
        theme_adjustments = self.THEME_COLOR_PALETTES.get(theme_color)
        if theme_adjustments:
            base_palette["primary"] = theme_adjustments["primary"]
            base_palette["secondary"] = theme_adjustments["secondary"]
            base_palette["accent"] = theme_adjustments["accent"]

        return ColorPalette(**base_palette)

    def get_all_palettes(self) -> dict[str, dict[str, str]]:
        """获取所有配色方案"""
        return self.STYLE_PALETTES

    def generate_gradient_colors(self, primary_color: str, steps: int = 5) -> list[str]:
        """
        生成渐变色系列

        Args:
            primary_color: 主色
            steps: 渐变步骤数

        Returns:
            渐变色列表
        """
        # 将十六进制转换为RGB
        primary = self._hex_to_rgb(primary_color)
        white = (255, 255, 255)

        colors = []
        for i in range(steps):
            ratio = i / (steps - 1)
            # 从主色渐变到白色
            r = int(primary[0] + (white[0] - primary[0]) * ratio)
            g = int(primary[1] + (white[1] - primary[1]) * ratio)
            b = int(primary[2] + (white[2] - primary[2]) * ratio)
            colors.append(self._rgb_to_hex((r, g, b)))

        return colors

    def generate_complementary_colors(self, color: str) -> list[str]:
        """
        生成互补色

        Args:
            color: 基础色

        Returns:
            互补色列表
        """
        rgb = self._hex_to_rgb(color)
        # 计算互补色（RGB取反）
        comp = (255 - rgb[0], 255 - rgb[1], 255 - rgb[2])
        return [color, self._rgb_to_hex(comp)]

    def generate_analogous_colors(self, color: str, count: int = 3) -> list[str]:
        """
        生成类似色

        Args:
            color: 基础色
            count: 颜色数量

        Returns:
            类似色列表
        """
        rgb = self._hex_to_rgb(color)
        hls = self._rgb_to_hls(rgb)

        colors = []
        step = 30  # 色相间隔
        for i in range(count):
            # 计算新的色相
            new_h = (hls[0] + (i - count // 2) * step) % 360
            new_rgb = self._hls_to_rgb((new_h, hls[1], hls[2]))
            colors.append(self._rgb_to_hex(new_rgb))

        return colors

    def _hex_to_rgb(self, hex_color: str) -> tuple:
        """将十六进制颜色转换为RGB"""
        hex_color = hex_color.lstrip('#')
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

    def _rgb_to_hex(self, rgb: tuple) -> str:
        """将RGB转换为十六进制颜色"""
        return f'#{int(rgb[0]):02x}{int(rgb[1]):02x}{int(rgb[2]):02x}'

    def _rgb_to_hls(self, rgb: tuple) -> tuple:
        """将RGB转换为HLS"""
        r, g, b = rgb[0] / 255.0, rgb[1] / 255.0, rgb[2] / 255.0
        max_c = max(r, g, b)
        min_c = min(r, g, b)
        l = (max_c + min_c) / 2

        if max_c == min_c:
            h = s = 0
        else:
            d = max_c - min_c
            s = d / (2 - max_c - min_c) if l > 0.5 else d / (max_c + min_c)
            if max_c == r:
                h = (g - b) / d + (6 if g < b else 0)
            elif max_c == g:
                h = (b - r) / d + 2
            else:
                h = (r - g) / d + 4
            h /= 6

        return (h * 360, l, s)

    def _hls_to_rgb(self, hls: tuple) -> tuple:
        """将HLS转换为RGB"""
        h, l, s = hls[0] / 360, hls[1], hls[2]

        if s == 0:
            gray = int(l * 255)
            return (gray, gray, gray)

        if l < 0.5:
            q = l * (1 + s)
        else:
            q = l + s - l * s

        p = 2 * l - q
        hue_to_rgb = lambda p, q, t: (
            p + ((q - p) * (6 * t if t < 0 else 1 - (6 * t - 1))) if t < 1/6 else
            q if t < 1/2 else
            p + ((q - p) * (2/3 - t)) * 6 if t < 2/3 else p
        )

        r = hue_to_rgb(p, q, h + 1/3)
        g = hue_to_rgb(p, q, h)
        b = hue_to_rgb(p, q, h - 1/3)

        return (int(r * 255), int(g * 255), int(b * 255))


# 单例实例
_color_scheme_instance: ColorSchemeGenerator | None = None
_manager_lock = threading.Lock()


def get_color_scheme_generator() -> ColorSchemeGenerator:
    """获取配色生成器单例（线程安全）"""
    global _color_scheme_instance
    if _color_scheme_instance is None:
        with _manager_lock:
            if _color_scheme_instance is None:
                _color_scheme_instance = ColorSchemeGenerator()
    return _color_scheme_instance
