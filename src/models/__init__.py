# -*- coding: utf-8 -*-
"""
数据模型定义

作者: Claude
日期: 2026-03-17
"""

import re
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator
from enum import Enum
from datetime import datetime


# ==================== 验证器 ====================

HEX_COLOR_PATTERN = re.compile(r'^#[0-9A-Fa-f]{6}$')


def validate_hex_color(v: str, field_name: str) -> str:
    """验证hex颜色格式"""
    if not HEX_COLOR_PATTERN.match(v):
        raise ValueError(f'{field_name}必须是有效的hex颜色格式，如#FF5500')
    return v


# ==================== 枚举类型 ====================

class TaskStatus(str, Enum):
    """任务状态"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class SceneType(str, Enum):
    """场景类型 - 与前端 constants.ts 保持同步"""
    BUSINESS = "business"
    EDUCATION = "education"
    TECH = "tech"
    CREATIVE = "creative"
    MARKETING = "marketing"
    FINANCE = "finance"
    MEDICAL = "medical"
    GOVERNMENT = "government"


class StyleType(str, Enum):
    """风格类型 - 与前端 constants.ts 保持同步"""
    PROFESSIONAL = "professional"
    SIMPLE = "simple"
    ENERGETIC = "energetic"
    PREMIUM = "premium"
    CREATIVE = "creative"
    TECH = "tech"
    NATURE = "nature"
    ELEGANT = "elegant"
    PLAYFUL = "playful"
    MINIMALIST = "minimalist"


class TemplateType(str, Enum):
    """模板类型 - 与前端 constants.ts 保持同步"""
    DEFAULT = "default"
    MODERN = "modern"
    CLASSIC = "classic"
    TECH = "tech"
    NATURE = "nature"
    OCEAN = "ocean"
    SUNSET = "sunset"
    MINIMAL = "minimal"


class TextStyleType(str, Enum):
    """文字样式类型 - 与前端 constants.ts 保持同步"""
    TRANSPARENT_OVERLAY = "transparent_overlay"  # 半透明遮罩
    SHADOW = "shadow"  # 文字阴影
    GLOW = "glow"  # 发光效果
    OUTLINE = "outline"  # 描边效果
    GRADIENT = "gradient"  # 渐变文字
    NEON = "neon"  # 霓虹灯效


class LayoutType(str, Enum):
    """布局类型 - 与前端 constants.ts 保持同步"""
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
    LEFT_TEXT_RIGHT_IMAGE = "left_text_right_image"  # 左文右图
    LEFT_IMAGE_RIGHT_TEXT = "left_image_right_text"  # 左图右文
    THREE_COLUMN = "three_column"  # 三栏
    MASONRY = "masonry"  # 瀑布流
    FULL_IMAGE = "full_image"  # 全屏图
    PROCESS = "process"  # 流程图
    TEAM = "team"  # 团队介绍


# ==================== 请求模型 ====================

class SlideBackground(BaseModel):
    """单页背景设置"""
    slide_index: int = Field(..., ge=0, description="页码索引 (0-based)")
    background_type: str = Field(default="color", description="背景类型: color(颜色), image(图片), gradient(渐变)")
    background_color: Optional[str] = Field(default=None, description="背景颜色 (hex)")
    background_image: Optional[str] = Field(default=None, description="背景图片URL")
    gradient_start: Optional[str] = Field(default=None, description="渐变起始颜色")
    gradient_end: Optional[str] = Field(default=None, description="渐变结束颜色")

    @field_validator('background_color', 'gradient_start', 'gradient_end')
    @classmethod
    def validate_hex_color_optional(cls, v):
        if v is not None:
            if not HEX_COLOR_PATTERN.match(v):
                raise ValueError('颜色必须是有效的hex格式，如#FF5500')
        return v


class SlideLayout(BaseModel):
    """单页布局设置"""
    slide_index: int = Field(..., ge=0, description="页码索引 (0-based)")
    layout_type: LayoutType = Field(default=LayoutType.CONTENT_CARD, description="布局类型")


class SlideLayout(BaseModel):
    """单页布局设置"""
    slide_index: int = Field(..., description="页码索引 (0-based)")
    layout_type: LayoutType = Field(default=LayoutType.CONTENT_CARD, description="布局类型")


class GenerateRequest(BaseModel):
    """PPT生成请求"""
    user_request: str = Field(..., min_length=10, max_length=2000, description="用户需求描述")
    slide_count: int = Field(default=10, ge=5, le=30, description="幻灯片数量")
    scene: SceneType = Field(default=SceneType.BUSINESS, description="场景类型")
    style: StyleType = Field(default=StyleType.PROFESSIONAL, description="风格类型")
    template: TemplateType = Field(default=TemplateType.DEFAULT, description="模板类型")
    theme_color: str = Field(default="#165DFF", description="主题色")
    text_style: TextStyleType = Field(default=TextStyleType.TRANSPARENT_OVERLAY, description="文字样式方案")
    shadow_color: str = Field(default="#000000", description="阴影颜色")

    @field_validator('theme_color', 'shadow_color')
    @classmethod
    def validate_hex_color(cls, v):
        return validate_hex_color(v, '颜色')
    overlay_transparency: int = Field(default=30, ge=0, le=100, description="遮罩透明度百分比")
    use_smart_layout: bool = Field(default=False, description="是否使用智能布局模式")
    slide_backgrounds: Optional[List[SlideBackground]] = Field(default=None, description="每页背景设置")
    slide_layouts: Optional[List[SlideLayout]] = Field(default=None, description="每页布局设置")
    include_charts: bool = Field(default=False, description="是否包含数据图表")
    include_pie_chart: bool = Field(default=True, description="是否包含饼图")
    include_bar_chart: bool = Field(default=True, description="是否包含柱状图")
    include_line_chart: bool = Field(default=False, description="是否包含折线图")
    add_watermark: bool = Field(default=False, description="是否添加水印")
    # 字体系统4级设置
    font_title: Optional[str] = Field(default="思源黑体", description="一级字体（标题）")
    font_subtitle: Optional[str] = Field(default="思源黑体", description="二级字体（副标题）")
    font_content: Optional[str] = Field(default="思源宋体", description="三级字体（正文）")
    font_caption: Optional[str] = Field(default="思源黑体", description="四级字体（注释）")
    # 生成模式
    generation_mode: Optional[str] = Field(default="standard", description="生成模式: standard/fast/quality/stream")
    output_format: Optional[str] = Field(default="pptx", description="输出格式: pptx/pdf/svg/png")
    quality: Optional[str] = Field(default="standard", description="输出质量: standard/high/ultra")
    # 布局设置
    layout_mode: Optional[str] = Field(default="auto", description="布局模式: auto/manual")
    unified_layout: Optional[bool] = Field(default=True, description="是否统一布局")


# ==================== 响应模型 ====================

class TaskResult(BaseModel):
    """任务结果"""
    pptx_path: str
    slide_count: int
    file_size: int = 0
    compression_ratio: float = 0.0


class TaskError(BaseModel):
    """任务错误"""
    code: str
    message: str
    details: Optional[Dict[str, Any]] = None


class GenerateResponse(BaseModel):
    """生成响应"""
    success: bool
    task_id: str
    status: TaskStatus
    message: str
    request_id: Optional[str] = None
    estimated_time: Optional[int] = None


class TaskStatusResponse(BaseModel):
    """任务状态响应"""
    success: bool
    task_id: str
    status: TaskStatus
    progress: int = Field(default=0, ge=0, le=100)
    current_step: str = ""
    created_at: str
    updated_at: str
    result: Optional[TaskResult] = None
    error: Optional[TaskError] = None


# ==================== 数据模型 ====================

class SlideData(BaseModel):
    """幻灯片数据"""
    index: int
    title: str
    content: str
    image_url: Optional[str] = None
    svg_content: Optional[str] = None


class PPTData(BaseModel):
    """PPT数据"""
    task_id: str
    user_request: str
    slides: List[SlideData]
    scene: SceneType
    style: StyleType
    template: TemplateType
    theme_color: str


# ==================== 配置模型 ====================

class HealthResponse(BaseModel):
    """健康检查响应"""
    status: str
    service: str
    version: str = "1.0.0"


class APIInfo(BaseModel):
    """API信息"""
    name: str
    version: str
    features: List[str]
