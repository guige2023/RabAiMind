# -*- coding: utf-8 -*-
"""
布局类型定义

作者: Claude
日期: 2026-03-17
"""

from enum import Enum


class LayoutType(str, Enum):
    """布局类型"""
    TITLE_SLIDE = "title_slide"  # 封面
    CONTENT_CARD = "content_card"  # 卡片
    TWO_COLUMN = "two_column"  # 双栏
    CENTER_RADIATION = "center_radiation"  # 中心辐射
    TIMELINE = "timeline"  # 时间线
    DATA_VISUALIZATION = "data_visualization"  # 数据可视化
    QUOTE = "quote"  # 金句
    COMPARISON = "comparison"  # 对比
    TOC = "toc"  # 目录
    THANK_YOU = "thank_you"  # 结束页
