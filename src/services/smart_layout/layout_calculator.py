"""
布局参数计算模块

计算各种布局类型的参数，包括卡片位置、区域划分等

作者: Claude
日期: 2026-03-18
"""

import threading
from dataclasses import dataclass
from typing import Any


@dataclass
class CardLayout:
    """卡片布局参数"""
    card_width: int
    card_height: int
    positions: list[tuple[int, int]]
    gap: int


@dataclass
class TwoColumnLayout:
    """双栏布局参数"""
    left_width: int
    right_width: int
    left_x: int
    right_x: int
    content_height: int
    gap: int


@dataclass
class TimelineLayout:
    """时间线布局参数"""
    direction: str  # "horizontal" or "vertical"
    node_positions: list[tuple[int, int]]
    node_radius: int
    line_width: int
    spacing: int


@dataclass
class RadialLayout:
    """中心辐射布局参数"""
    center_x: int
    center_y: int
    center_radius: int
    branch_angles: list[float]
    branch_distances: list[int]
    branch_positions: list[tuple[int, int]]


class LayoutCalculator:
    """布局参数计算器"""

    # 画布尺寸 (16:9)
    CANVAS_WIDTH = 1600
    CANVAS_HEIGHT = 900

    # 安全边距
    SAFE_MARGIN = {
        "left": 100,
        "right": 100,
        "top": 50,
        "bottom": 100
    }

    @classmethod
    def get_safe_zone(cls) -> tuple[int, int, int, int]:
        """获取安全区域 (x, y, width, height)"""
        x = cls.SAFE_MARGIN["left"]
        y = cls.SAFE_MARGIN["top"]
        width = cls.CANVAS_WIDTH - cls.SAFE_MARGIN["left"] - cls.SAFE_MARGIN["right"]
        height = cls.CANVAS_HEIGHT - cls.SAFE_MARGIN["top"] - cls.SAFE_MARGIN["bottom"]
        return (x, y, width, height)

    @classmethod
    def calculate_card_layout(cls, card_count: int, style: str = "grid") -> CardLayout:
        """
        计算卡片布局参数

        Args:
            card_count: 卡片数量
            style: 布局风格 ("grid", "horizontal", "vertical")

        Returns:
            CardLayout 对象
        """
        safe_width = cls.CANVAS_WIDTH - cls.SAFE_MARGIN["left"] - cls.SAFE_MARGIN["right"]
        safe_height = cls.CANVAS_HEIGHT - cls.SAFE_MARGIN["top"] - cls.SAFE_MARGIN["bottom"]

        if card_count == 1:
            card_width = safe_width
            card_height = safe_height - 150
            positions = [(cls.SAFE_MARGIN["left"], 130)]
            gap = 0

        elif card_count == 2:
            card_width = (safe_width - 40) // 2
            card_height = safe_height - 100
            positions = [
                (cls.SAFE_MARGIN["left"], 130),
                (cls.SAFE_MARGIN["left"] + card_width + 40, 130)
            ]
            gap = 40

        elif card_count == 3:
            card_width = (safe_width - 60) // 3
            card_height = safe_height - 100
            positions = [
                (cls.SAFE_MARGIN["left"], 130),
                (cls.SAFE_MARGIN["left"] + card_width + 30, 130),
                (cls.SAFE_MARGIN["left"] + (card_width + 30) * 2, 130)
            ]
            gap = 30

        elif card_count == 4:
            card_width = (safe_width - 30) // 2
            card_height = (safe_height - 100 - 30) // 2
            positions = [
                (cls.SAFE_MARGIN["left"], 130),
                (cls.SAFE_MARGIN["left"] + card_width + 30, 130),
                (cls.SAFE_MARGIN["left"], 130 + card_height + 30),
                (cls.SAFE_MARGIN["left"] + card_width + 30, 130 + card_height + 30)
            ]
            gap = 30

        elif card_count == 6:
            card_width = (safe_width - 30) // 3
            card_height = (safe_height - 100 - 30) // 2
            positions = [
                (cls.SAFE_MARGIN["left"], 130),
                (cls.SAFE_MARGIN["left"] + card_width + 15, 130),
                (cls.SAFE_MARGIN["left"] + (card_width + 15) * 2, 130),
                (cls.SAFE_MARGIN["left"], 130 + card_height + 30),
                (cls.SAFE_MARGIN["left"] + card_width + 15, 130 + card_height + 30),
                (cls.SAFE_MARGIN["left"] + (card_width + 15) * 2, 130 + card_height + 30)
            ]
            gap = 15

        else:
            # 默认处理更多卡片
            cols = min(card_count, 4)
            rows = (card_count + cols - 1) // cols
            card_width = (safe_width - (cols - 1) * 20) // cols
            card_height = (safe_height - 100 - (rows - 1) * 20) // rows
            positions = []

            for i in range(card_count):
                row = i // cols
                col = i % cols
                x = cls.SAFE_MARGIN["left"] + col * (card_width + 20)
                y = 130 + row * (card_height + 20)
                positions.append((x, y))

            gap = 20

        return CardLayout(
            card_width=card_width,
            card_height=card_height,
            positions=positions,
            gap=gap
        )

    @classmethod
    def calculate_two_column_layout(cls, split_ratio: float = 0.5) -> TwoColumnLayout:
        """
        计算双栏布局参数

        Args:
            split_ratio: 左侧比例 (0.0-1.0)

        Returns:
            TwoColumnLayout 对象
        """
        safe_width = cls.CANVAS_WIDTH - cls.SAFE_MARGIN["left"] - cls.SAFE_MARGIN["right"]
        safe_height = cls.CANVAS_HEIGHT - cls.SAFE_MARGIN["top"] - cls.SAFE_MARGIN["bottom"]

        gap = 40
        left_width = int((safe_width - gap) * split_ratio)
        right_width = safe_width - left_width - gap

        return TwoColumnLayout(
            left_width=left_width,
            right_width=right_width,
            left_x=cls.SAFE_MARGIN["left"],
            right_x=cls.SAFE_MARGIN["left"] + left_width + gap,
            content_height=safe_height - 150,
            gap=gap
        )

    @classmethod
    def calculate_timeline_layout(cls, event_count: int, direction: str = "horizontal") -> TimelineLayout:
        """
        计算时间线布局参数

        Args:
            event_count: 事件数量
            direction: 方向 ("horizontal" or "vertical")

        Returns:
            TimelineLayout 对象
        """
        if direction == "horizontal":
            safe_width = cls.CANVAS_WIDTH - cls.SAFE_MARGIN["left"] - cls.SAFE_MARGIN["right"]
            spacing = safe_width // (event_count + 1)
            start_x = cls.SAFE_MARGIN["left"] + spacing

            node_positions = [(start_x + i * spacing, cls.CANVAS_HEIGHT // 2) for i in range(event_count)]
            node_radius = 20
            line_width = 4
        else:
            safe_height = cls.CANVAS_HEIGHT - cls.SAFE_MARGIN["top"] - cls.SAFE_MARGIN["bottom"]
            spacing = safe_height // (event_count + 1)
            start_y = cls.SAFE_MARGIN["top"] + spacing

            node_positions = [(cls.CANVAS_WIDTH // 2, start_y + i * spacing) for i in range(event_count)]
            node_radius = 20
            line_width = 4

        return TimelineLayout(
            direction=direction,
            node_positions=node_positions,
            node_radius=node_radius,
            line_width=line_width,
            spacing=spacing
        )

    @classmethod
    def calculate_radial_layout(cls, branch_count: int) -> RadialLayout:
        """
        计算中心辐射布局参数

        Args:
            branch_count: 分支数量

        Returns:
            RadialLayout 对象
        """
        center_x = cls.CANVAS_WIDTH // 2
        center_y = cls.CANVAS_HEIGHT // 2
        center_radius = 80

        # 计算分支角度
        angle_step = 360 / branch_count
        # 从正上方开始（-90度）
        start_angle = -90

        branch_angles = [start_angle + i * angle_step for i in range(branch_count)]

        # 分支距离（从中心到分支位置）
        branch_distance = 250

        # 计算分支位置
        import math
        branch_positions = []
        for angle in branch_angles:
            rad = math.radians(angle)
            x = int(center_x + branch_distance * math.cos(rad))
            y = int(center_y + branch_distance * math.sin(rad))
            branch_positions.append((x, y))

        return RadialLayout(
            center_x=center_x,
            center_y=center_y,
            center_radius=center_radius,
            branch_angles=branch_angles,
            branch_distances=[branch_distance] * branch_count,
            branch_positions=branch_positions
        )

    @classmethod
    def calculate_title_slide_layout(cls) -> dict[str, Any]:
        """计算封面布局参数"""
        safe_zone = cls.get_safe_zone()
        return {
            "title_y": cls.CANVAS_HEIGHT // 2 - 50,
            "subtitle_y": cls.CANVAS_HEIGHT // 2 + 50,
            "title_font_size": 60,
            "subtitle_font_size": 32,
            "center_x": cls.CANVAS_WIDTH // 2
        }

    @classmethod
    def calculate_quote_layout(cls) -> dict[str, Any]:
        """计算金句布局参数"""
        return {
            "quote_x": cls.SAFE_MARGIN["left"] + 100,
            "quote_y": cls.CANVAS_HEIGHT // 2 - 30,
            "quote_width": cls.CANVAS_WIDTH - cls.SAFE_MARGIN["left"] - cls.SAFE_MARGIN["right"] - 200,
            "font_size": 48,
            "source_y": cls.CANVAS_HEIGHT // 2 + 80
        }

    @classmethod
    def calculate_comparison_layout(cls) -> TwoColumnLayout:
        """计算对比布局参数"""
        return cls.calculate_two_column_layout(split_ratio=0.45)


# 单例实例
_layout_calculator_instance: LayoutCalculator | None = None
_manager_lock = threading.Lock()


def get_layout_calculator() -> LayoutCalculator:
    """获取布局计算器单例（线程安全）"""
    global _layout_calculator_instance
    if _layout_calculator_instance is None:
        with _manager_lock:
            if _layout_calculator_instance is None:
                _layout_calculator_instance = LayoutCalculator()
    return _layout_calculator_instance
